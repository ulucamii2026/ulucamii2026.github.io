import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// Talimat C: bütün ağ çıkışları kapalı; derlenmiş site (playwright.config webServer'ı 4401 —
// `ONIZLEME` ile 4399'daki elle açılmış önizlemeye yönlendirilebilir) ve sahte GAS.
const kok = process.env.ONIZLEME?.replace(/\/$/, '') || 'http://127.0.0.1:4401';
const cikti = 'D:/tmp/form-test';
const taslakAnahtari = 'ulucamii:kayit:v2';
let png;
test.beforeAll(async () => {
  await mkdir(cikti, { recursive: true });
  png = await sharp({ create: { width: 640, height: 400, channels: 3, background: '#a2b8c4' } }).png().toBuffer();
});
test.beforeEach(async ({ page, context }) => {
  await context.route('**/*', r => new URL(r.request().url()).origin === kok ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, s => s.close());
  const hatalar = [];
  page.on('pageerror', e => hatalar.push(e.message));
  page.hatalar = hatalar;
});
test.afterEach(async ({ page }) => { expect(page.hatalar).toEqual([]); });
const form = p => p.locator('form[data-form="kayit"]');
const cubuk = p => p.locator('#k-ilerleme [role="progressbar"]');
const dosya = name => ({ name, mimeType: 'image/png', buffer: png });
const ac = (p, dil = '') => p.goto(`${kok}/kayit/${dil ? dil + '/' : ''}`);
const ekran = (p, ad) => p.screenshot({ path: `${cikti}/kayit-v3c-${ad}.png`, animations: 'disabled' });
async function doldur(p) {
  for (const [id, deger] of Object.entries({ ad: 'Deniz', soyad: 'TESTOGLU', dogum: '2017-03-15', 'veli-ad': 'Anne-Marie Işık', 'veli-cep': '0470000000', 'veli-eposta': 'veli@example.test', adres: 'Rue Exemple 12', posta: '6900', imza: 'annemarieisik' })) await p.locator(`#k-${id}`).fill(deger);
  await p.locator('#k-okul').selectOption({ label: "École communale d'Aye" });
  await p.locator('#k-sinif').selectOption('P3');
  for (const id of ['cins-kiz', 'kurs-yeni', 'yak-anne', 'saglik-hayir', 'goruntu-hayir', 'goruntu-sosyal-hayir']) await p.locator(`#k-${id}`).check();
  await p.locator('#k-kurallar-kutu').evaluate(e => { e.scrollTop = e.scrollHeight; e.dispatchEvent(new Event('scroll')); });
  await p.locator('#k-onay-kurallar').check();
  await p.locator('#k-onay-gizlilik').check();
}
async function yol(p, deger) {
  await p.locator('#k-kimlik-sonra').check();
  await p.locator(`#k-kimlik-${deger}`).check();
  if (deger !== 'elden') await p.locator('#k-kimlik-riza').check();
}
async function resim(p, yan = 'on', name = 'sentetik.png') {
  await p.locator(`#k-g-kimlik-${yan}`).setInputFiles(dosya(name));
  await expect(p.locator(`[data-gorsel="${yan === 'on' ? 'kimlikOn' : 'kimlikArka'}"]`)).toHaveAttribute('data-dolu', '1');
}
async function sahte(p, gelen = []) {
  await p.route('**/macros/**', r => {
    if (r.request().method() === 'POST') gelen.push(r.request().postDataJSON());
    return r.fulfill({ json: { ok: true, ref: `UC-2099-${String(gelen.length).padStart(4, '0')}`, surum: 29, tekrar: false, kopyaGitti: true } });
  });
}

test('Bozuk taslak tarihi veya alan şeması formun açılışını durdurmaz', async ({ page }) => {
  for (const taslak of [{ surum: 2, zaman: 'bozuk', alanlar: {} }, { surum: 2, zaman: Date.now(), alanlar: null }]) {
    await ac(page);
    await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [taslakAnahtari, taslak]);
    await page.reload();
    await page.locator('#k-kimlik-sonra').check();
    await expect(page.locator('#k-kimlik-elden')).toBeVisible();
    await form(page).locator('[type=submit]').click();
    await expect(page.locator('#k-ad')).toHaveAttribute('aria-invalid', 'true');
  }
});

test('Koşullu okul/sağlık/kimlik eksikleri ve kaydırma kilidi yüzdeyle tutarlıdır', async ({ page }) => {
  await ac(page); await doldur(page); await yol(page, 'elden');
  await expect(cubuk(page)).toHaveAttribute('aria-valuenow', '100');
  for (const [secim, alan, bolum, deger] of [
    ['okul', 'okul-diger', 'okul', 'École Exemple'],
    ['saglik-evet', 'saglik-not', 'saglik', 'Sentetik test notu'],
  ]) {
    if (secim === 'okul') await page.locator('#k-okul').selectOption('diger');
    else await page.locator('#k-saglik-evet').check();
    await expect(cubuk(page)).not.toHaveAttribute('aria-valuenow', '100');
    await expect(page.locator(`[data-eksikler] a[href="#k-${alan}"]`)).toBeVisible();
    await page.locator(`#k-${alan}`).fill(deger);
    if (bolum === 'saglik') await page.locator('#k-saglik-riza').check();
    await expect(page.locator(`#b-${bolum}`)).toHaveAttribute('data-durum', 'tamam');
    await expect(cubuk(page)).toHaveAttribute('aria-valuenow', '100');
  }
  await page.locator('#k-kimlik-whatsapp').check();
  await expect(cubuk(page)).not.toHaveAttribute('aria-valuenow', '100');
  await page.locator('#k-kimlik-riza').check();
  await expect(cubuk(page)).toHaveAttribute('aria-valuenow', '100');
  // Okumak için tekrar yukarı kaydırmak verilmiş onayı sessizce silmemeli.
  await page.locator('#k-kurallar-kutu').evaluate(e => { e.scrollTop = 0; e.dispatchEvent(new Event('scroll')); });
  await expect(page.locator('#k-onay-kurallar')).toBeChecked();
  await page.setViewportSize({ width: 360, height: 780 });
  await expect(page.locator('#k-onay-kurallar')).toBeDisabled();
  await expect(cubuk(page)).not.toHaveAttribute('aria-valuenow', '100');
});

test('Görsel işlemi geç bitse bile Sonra geçişinden sonra geri gelmez; rıza ve taslak sıfırlanır', async ({ page }) => {
  await page.addInitScript(() => {
    const ac = window.createImageBitmap.bind(window);
    window.createImageBitmap = async (...args) => {
      const bitmap = await ac(...args);
      if (args[0].name === 'bekle.png') await new Promise(r => { window.gorseliBirak = r; });
      return bitmap;
    };
  });
  await ac(page); await resim(page); await resim(page, 'arka');
  await page.locator('#k-kimlik-riza').check();
  await page.locator('#k-g-kimlik-on').setInputFiles(dosya('bekle.png'));
  await expect.poll(() => page.evaluate(() => !!window.gorseliBirak)).toBe(true);
  await yol(page, 'elden');
  await page.evaluate(() => window.gorseliBirak());
  await page.locator('#k-kimlik-simdi').check();
  await expect(page.locator('[data-gorsel="kimlikOn"]')).toHaveAttribute('data-dolu', '');
  await expect(page.locator('[data-gorsel="kimlikArka"]')).toHaveAttribute('data-dolu', '');
  await expect(page.locator('#k-kimlik-riza')).not.toBeChecked();
  await yol(page, 'whatsapp');
  await page.waitForTimeout(450); await page.reload();
  await expect(page.locator('#k-kimlik-whatsapp')).toBeChecked();
  await expect(page.locator('#k-kimlik-riza')).not.toBeChecked();
  const ham = await page.evaluate(k => localStorage.getItem(k), taslakAnahtari);
  expect(ham).not.toMatch(/data:image|blob:|onay\.|saglik\.not/);
});

test('Gönderim sırasında yol değişse bile başarı gönderilen yolu anlatır', async ({ page }) => {
  let bitir, govde;
  const bekle = new Promise(r => { bitir = r; });
  await page.route('**/macros/**', async r => {
    govde = r.request().postDataJSON(); await bekle;
    await r.fulfill({ json: { ok: true, ref: 'UC-2099-0001', kopyaGitti: true } });
  });
  await ac(page); await doldur(page); await yol(page, 'whatsapp');
  await form(page).evaluate(f => { f.requestSubmit(); f.requestSubmit(); });
  await expect.poll(() => govde?.kimlik.yol).toBe('whatsapp');
  await page.locator('#k-kimlik-simdi').check();
  bitir();
  await expect(page.locator('[data-basari]')).toBeVisible();
  await expect(page.locator('[data-kimlik-baglanti]')).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  await expect(page.locator('[data-kimlik-sonradan]')).toBeVisible();
});

test('60 saniye zaman aşımı, çift gönderim kilidi ve tekrarın kopya sonucu', async ({ page }) => {
  const gelen = [];
  await page.clock.install();
  await page.route('**/macros/**', r => {
    gelen.push(r.request().postDataJSON());
    if (gelen.length === 1) return;
    if (gelen.length === 2) return r.fulfill({ json: { ok: false, hata: 'kayit-isleniyor' } });
    return r.fulfill({ json: { ok: true, ref: 'UC-2099-0001', tekrar: true, kopyaGitti: false } });
  });
  await ac(page); await doldur(page); await yol(page, 'elden');
  await form(page).evaluate(f => { f.requestSubmit(); f.requestSubmit(); });
  await expect.poll(() => gelen.length).toBe(1);
  await page.clock.fastForward(60_100);
  await expect(page.locator('[data-mesaj]')).toContainText('Taslağınız kayıtlı');
  await expect(form(page).locator('[type=submit]')).toBeEnabled();
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-mesaj]')).toContainText('Kaydınız işleniyor');
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeVisible();
  expect(gelen).toHaveLength(3);
  expect(new Set(gelen.map(g => g.gonderimAnahtari)).size).toBe(1);
  await expect(page.locator('[data-eposta-metin]')).toContainText('gönderilemedi');
  expect(await page.evaluate(k => localStorage.getItem(k), taslakAnahtari)).toBeNull();
});

test('Depolama engelliyken ağ hatası kayıtlı taslak vaadinde bulunmaz', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Engelli', 'QuotaExceededError'); }; });
  await page.route('**/macros/**', r => r.abort());
  await ac(page); await doldur(page); await yol(page, 'elden');
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-mesaj]')).toContainText('taslağı kaydedemedi');
  await expect(page.locator('[data-mesaj]')).not.toContainText('Taslağınız kayıtlı');
  await expect(page.locator('[data-mesaj]')).not.toContainText('saklı');
  await expect(page.locator('#k-ad')).toHaveValue('Deniz');
});

test('Veli provası: mobil taslak, hata, fotoğraf, başarı, kardeş ve ikinci gönderim', async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const gelen = []; await sahte(page, gelen);
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: kok });
  await ac(page); await ekran(page, '01-giris');
  await page.locator('#k-ad').fill('Deniz'); await page.waitForTimeout(450); await page.reload();
  await expect(page.locator('[data-taslak-not]')).toBeVisible(); await ekran(page, '02-taslak');
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('#k-soyad')).toHaveAttribute('aria-invalid', 'true'); await ekran(page, '03-hatalar');
  await doldur(page); await resim(page); await page.locator('#k-kimlik-riza').check();
  await expect(cubuk(page)).toHaveAttribute('aria-valuenow', '100'); await ekran(page, '04-kimlik');
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeVisible(); await ekran(page, '05-basari');
  await expect(page.locator('[data-kimlik-sonradan]')).toBeHidden();
  await page.locator('[data-ref-kopyala]').press('Enter');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('UC-2099-0001');
  await page.locator('a[href="?kardes=1"]').press('Enter');
  await expect(page.locator('#k-ad')).toBeFocused();
  for (const id of ['ad', 'soyad', 'dogum', 'saglik-not', 'imza']) await expect(page.locator(`#k-${id}`)).toHaveValue('');
  await expect(page.locator('#k-veli-eposta')).toHaveValue('veli@example.test');
  await expect(page.locator('#k-kimlik-simdi')).toBeChecked();
  await expect(page.locator('#k-kimlik-riza')).not.toBeChecked();
  await expect(page.locator('[data-gorsel="kimlikOn"]')).toHaveAttribute('data-dolu', '');
  await ekran(page, '06-kardes');
  await doldur(page); await page.locator('#k-ad').fill('Ekin'); await yol(page, 'elden');
  await form(page).locator('[type=submit]').click(); await expect(page.locator('[data-basari]')).toBeVisible();
  await ekran(page, '07-ikinci-basari');
  expect(gelen).toHaveLength(2); expect(gelen[0].gonderimAnahtari).not.toBe(gelen[1].gonderimAnahtari);
  expect(gelen[0].kimlik.on).toMatch(/^data:image\/jpeg;base64,/);
  expect(gelen[1].kimlik).toEqual({ yol: 'elden', on: '', arka: '' });
  expect(gelen[1].onay.kimlikRiza).toBe(false);
});

for (const dil of ['tr', 'fr', 'en']) test(`${dil}: main axe, iki tema, 360 px ve 200 yüzde yeniden akış`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 360, height: 800 });
  await ac(page, dil === 'tr' ? '' : dil);
  for (const tema of ['light', 'dark']) {
    await page.evaluate(t => { document.documentElement.dataset.theme = t; }, tema);
    await page.screenshot({ animations: 'disabled' });
    const sonuc = await new AxeBuilder({ page }).include('main').analyze();
    expect(sonuc.violations.filter(v => ['critical', 'serious'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await ekran(page, `${dil}-${tema}-360`);
  }
  // 1280 fiziksel piksel / 200% yakınlaştırma = 640 CSS piksel yeniden akış.
  await page.setViewportSize({ width: 640, height: 450 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#k-kimlik-simdi').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#k-kimlik-sonra')).toBeChecked();
  await page.keyboard.press('Tab'); await page.keyboard.press('ArrowDown');
  await expect(page.locator('#k-kimlik-whatsapp')).toBeChecked();
  await ekran(page, `${dil}-200-yuzde`);
  expect(await form(page).evaluate(f => f.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(page.locator('#k-ilerleme [aria-current]')).toHaveCount(1);
});

test('Klavye ile tüm kayıt: Tab, radyolar, dosya seçici, kurallar, kopya ve kardeş', async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: kok });
  const gelen = []; await sahte(page, gelen); await ac(page);
  async function tab(secici) {
    for (let n = 0; n < 100; n++) {
      if (await page.locator(secici).evaluate(e => e === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }
    await expect(page.locator(secici)).toBeFocused();
    await page.waitForTimeout(50);
    const olcum = await page.locator(secici).evaluate(e => {
      const g = e.type === 'file' ? e.closest('[data-alan]').querySelector('.g-sec') : e;
      const r = g.getBoundingClientRect(), ray = document.querySelector('#k-ilerleme').getBoundingClientRect();
      const stil = getComputedStyle(g);
      return { gorunur: r.top >= Math.max(0, ray.bottom) && r.bottom <= innerHeight, halka: stil.outlineStyle !== 'none' || stil.boxShadow !== 'none' };
    });
    expect(olcum.gorunur, secici + ' ray altında görünür').toBe(true);
    expect(olcum.halka, secici + ' odak halkası').toBe(true);
  }
  async function yaz(id, metin) { await tab('#k-' + id); await page.keyboard.type(metin); }
  await yaz('ad', 'Deniz'); await yaz('soyad', 'TESTOGLU');
  await tab('#k-cins-kiz'); await page.keyboard.press('Space');
  await tab('#k-dogum'); await page.keyboard.type('15032017');
  await expect(page.locator('#k-dogum')).toHaveValue('2017-03-15');
  await tab('#k-okul'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab');
  await tab('#k-sinif'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab');
  await tab('#k-kurs-yeni'); await page.keyboard.press('Space');
  await tab('#k-yak-anne'); await page.keyboard.press('Space');
  await yaz('veli-ad', 'Deniz Test'); await yaz('veli-cep', '0470000000');
  await yaz('veli-eposta', 'veli@example.test'); await yaz('adres', 'Rue Exemple 12'); await yaz('posta', '6900');
  await tab('#k-saglik-hayir'); await page.keyboard.press('Space');
  for (const id of ['goruntu-hayir', 'goruntu-sosyal-hayir']) { await tab('#k-' + id); await page.keyboard.press('Space'); }
  await tab('#k-kurallar-kutu'); await page.keyboard.press('Control+End');
  await tab('#k-onay-kurallar'); await page.keyboard.press('Space');
  await tab('#k-onay-gizlilik'); await page.keyboard.press('Space');
  await yaz('imza', 'Deniz Test');
  await tab('#k-kimlik-simdi');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
  await tab('#k-g-kimlik-on');
  const secici = page.waitForEvent('filechooser'); await page.keyboard.press('Enter');
  await (await secici).setFiles(dosya('klavye.png'));
  await expect(page.locator('[data-gorsel="kimlikOn"]')).toHaveAttribute('data-dolu', '1');
  await tab('#k-kimlik-riza'); await page.keyboard.press('Space');
  await expect(cubuk(page)).toHaveAttribute('aria-valuenow', '100');
  await tab('form button[type=submit]'); await ekran(page, 'klavye-gonderim');
  await page.keyboard.press('Enter'); await expect(page.locator('[data-basari]')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('[data-ref-kopyala]')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('UC-2099-0001');
  await page.keyboard.press('Tab'); await expect(page.locator('a[href="?kardes=1"]')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#k-ad')).toBeFocused();
  expect(gelen).toHaveLength(1);
});

test('Sayfadan hemen ayrılınca son harf kaybolmaz; Temizle boş taslak üretmez', async ({ page }) => {
  await ac(page);
  await page.locator('#k-ad').fill('Son harf');
  await page.goto(kok + '/tr/'); await ac(page);
  await expect(page.locator('#k-ad')).toHaveValue('Son harf');
  await page.locator('[data-taslak-sil]').click();
  await page.goto(kok + '/tr/'); await ac(page);
  await expect(page.locator('[data-taslak-not]')).toBeHidden();
});

test('Hızlı yazı sırasında ilerleme hesapları birleştirilir; canlı yaş metni tekrarlanmaz', async ({ page }) => {
  await ac(page); await doldur(page); await yol(page, 'elden');
  await expect(cubuk(page)).toHaveAttribute('aria-valuenow', '100');
  const sonuc = await page.evaluate(async () => {
    const alan = document.querySelector('#k-ad'), cubuk = document.querySelector('[role=progressbar]');
    let hesap = 0, ses = 0;
    const gozlem = new MutationObserver(k => { hesap += k.length; });
    const canli = new MutationObserver(k => { ses += k.length; });
    gozlem.observe(cubuk, { attributes: true, attributeFilter: ['aria-valuenow'] });
    canli.observe(document.querySelector('[data-yas-cip]'), { childList: true });
    for (let i = 0; i < 25; i++) { alan.value += 'a'; alan.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 12)); }
    await new Promise(r => setTimeout(r, 180)); gozlem.disconnect(); canli.disconnect();
    return { hesap, ses };
  });
  expect(sonuc.hesap).toBeLessThanOrEqual(3); expect(sonuc.ses).toBe(0);
  console.log('25 hızlı input olayı:', JSON.stringify(sonuc));
});
