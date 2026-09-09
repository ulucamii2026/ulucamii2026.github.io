import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const yollar = { tr: 'ihtida-basvurusu', fr: 'demande-de-conversion', en: 'conversion-application' };
let png;

test('Admin aynı arşiv PDF’sini ve her alıcının gerçek gönderim durumunu gösterir', async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('sveltia-cms.user', JSON.stringify({ token: 'test-token' }));
    localStorage.setItem('panel-oturum', JSON.stringify({ baslangic: Date.now() }));
    sessionStorage.setItem('panel-sirlar', JSON.stringify({ gh: 'test-token', gas: 'test-key' }));
  });
  let teslim = false;
  await page.route('https://script.google.com/**', route => {
    const islem = new URL(route.request().url()).searchParams.get('islem');
    if (islem === 'liste') return route.fulfill({ json: { ok: true, surum: 27, kayitlar: { basliklar: [], satirlar: [] }, ihtidalar: {
      basliklar: ['Zaman damgası', 'Referans', 'Adı Soyadı', 'E-posta', 'PDF bağlantısı', 'Durum', 'Tam paket PDF'],
      satirlar: [['09.09.2026 12:00', 'IH-2099-9999', 'Deniz Örnek', 'deniz@example.test', 'https://drive.google.com/file/d/test-summary-file-123/view', 'Yeni başvuru', 'https://drive.google.com/file/d/test-packet-file-12345/view']],
    } } });
    if (islem === 'ihtida-paket-durum') return route.fulfill({ json: { ok: true, paket: {
      ref: 'IH-2099-9999', revizyon: 1, sayfa: 6, pdfId: 'test-packet-file-12345', durum: teslim ? 'tamam' : 'teslim-takibi',
      alicilar: [{ eposta: 'info@ulucamii.be', durum: 'teslim-edildi' }, { eposta: 'imam@ulucamii.be', durum: teslim ? 'teslim-edildi' : 'saglayici-kabul' }, { eposta: 'deniz@example.test', durum: teslim ? 'teslim-edildi' : 'gonderim-hatasi' }],
    } } });
    return route.fulfill({ json: { ok: true, surum: 27 } });
  });
  await formSayfasiniAc(page, '/admin/#basvurular');
  await page.locator('#sekme-ihtida').click();
  const arsiv = page.getByRole('button', { name: 'Tam paket PDF', exact: true });
  await expect(arsiv).toHaveAttribute('data-pdf', 'test-packet-file-12345');
  const durum = page.getByRole('button', { name: 'PDF ve e-posta durumu', exact: true });
  await durum.click();
  const dialog = page.getByRole('dialog', { name: 'PDF ve e-posta durumu' });
  await expect(dialog).toContainText('6 sayfa');
  await expect(dialog).toContainText('Gönderildi · teslim teyidi bekleniyor');
  await expect(dialog).toContainText('Gönderim başarısız');
  await expect(dialog).not.toContainText('bütün alıcı sunucularına teslim edildi');
  await expect(dialog.getByRole('button', { name: 'Arşivdeki tam PDF’yi aç' })).toHaveAttribute('data-pdf', 'test-packet-file-12345');
  if (info.project.name.includes('mobil')) await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: info.outputPath('paket-gonderim-durumu.png') });
  expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth)).toBeTruthy();
  teslim = true;
  await dialog.getByRole('button', { name: 'Durumu yenile' }).click();
  await expect(dialog).toContainText('bütün alıcı sunucularına teslim edildi');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0); await expect(durum).toBeFocused();
});
test.beforeAll(async () => { png = await sharp({ create: { width: 300, height: 400, channels: 3, background: '#827868' } }).png().toBuffer(); });
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401' ? route.continue() : route.abort());
  await context.routeWebSocket(/.*/, socket => socket.close());
});

async function formSayfasiniAc(page, url) {
  await page.goto(url);
  const secim = page.locator('[data-adim-tumu]');
  if (await secim.count()) await secim.click();
}

async function doldur(page) {
  const alanlar = { ad: 'Deniz Örnek', dogum: '1990-05-20', 'dogum-yeri': 'Namur', uyruk: 'Belçika', anne: 'Anne Örnek', baba: 'Baba Örnek', ogrenim: 'Lisans', meslek: 'Öğretmen', eposta: 'deniz@example.test', telefon: '+32 470 00 00 00', adres: 'Rue du Test 12, boîte 3', 'posta-kodu': '6900', sehir: 'Marche-en-Famenne', ulke: 'Belçika', 'onceki-din': 'Belirtilen inanç', beyan: 'Deniz Örnek' };
  for (const [id, value] of Object.entries(alanlar)) await page.locator(`#i-${id}`).fill(value);
  await page.locator('#i-cins-kadin').check();
  await page.locator('#i-medeni').selectOption('bekar');
  await page.locator('#i-belge-pasaport').check();
  for (const id of ['vesikalik', 'kimlik-on']) {
    await page.locator(`#i-g-${id}`).setInputFiles({ name: 'ornek.png', mimeType: 'image/png', buffer: png });
  }
  await expect(page.locator('[data-gorsel="kimlikOn"]')).toHaveAttribute('data-dolu', '1');
  await page.locator('input[name="imzaYok"]').check();
  for (const id of ['riza', 'ek10', 'gizlilik', 'gorsel']) await page.locator(`#i-onay-${id}`).check();
}

for (const [dil, yol] of Object.entries(yollar)) {
  test(`${dil}: ihtida şahit seçimi, posta ve gönderim sözleşmesi`, async ({ page }, info) => {
    const gonderilen = [];
    await page.route('**/macros/**', route => {
      if (route.request().method() === 'POST') gonderilen.push(route.request().postDataJSON());
      return route.fulfill({ json: { ok: true, surum: 27, ihtidaPaketHazir: true, ref: 'IH-2099-9999' } });
    });
    await formSayfasiniAc(page, `/${dil}/${yol}/`);
    await expect(page.locator('#i-sahit-ekle')).not.toBeChecked();
    await expect(page.locator('#i-sahit-alanlari')).toBeHidden();
    await expect(page.locator('#i-sahit-1')).toBeDisabled();
    await expect(page.locator('#i-teslim-cami')).toBeChecked();
    await doldur(page);
    await expect(page.locator('#i-sebep')).toBeVisible();
    await page.locator('#i-sebep').fill('Kendi araştırmam sonucunda.');
    for (const id of ['posta-kodu', 'sehir', 'ulke']) {
      const alan = page.locator('#i-' + id), deger = await alan.inputValue();
      await alan.fill('');
      await page.locator('form[data-form="ihtida"] button[type="submit"]').click();
      expect(gonderilen).toHaveLength(0);
      await alan.fill(deger);
    }
    await expect(page.locator('#i-g-vesikalik')).toHaveAttribute('aria-required', 'true');
    // Kimlik görseli varken de ayrı vesikalık zorunludur; sunucuya veri çıkmamalı.
    await page.locator('[data-gorsel="vesikalik"] [data-kaldir]').click();
    await page.locator('form[data-form="ihtida"] button[type="submit"]').click();
    await expect(page.locator('#i-g-vesikalik-hata')).toBeVisible();
    expect(gonderilen).toHaveLength(0);
    await page.locator('#i-g-vesikalik').setInputFiles({ name: 'vesikalik.png', mimeType: 'image/png', buffer: png });
    await expect(page.locator('[data-gorsel="vesikalik"]')).toHaveAttribute('data-dolu', '1');
    await page.locator('[data-gorsel="vesikalik"]').screenshot({ path: info.outputPath('vesikalik.png') });
    await page.locator('#i-sahit-ekle').focus(); await page.keyboard.press('Space');
    await expect(page.locator('#i-sahit-1')).toBeEnabled();
    await page.locator('#i-sahit-1').fill('Birinci Örnek Şahit');
    await page.locator('#i-sahit-2').fill('İkinci Örnek Şahit');
    await page.locator('#i-teslim-adres').check();
    await expect(page.locator('[data-ozet-alan="teslimat"]')).toContainText('6900');
    await page.locator('#b-iletisim').screenshot({ path: info.outputPath('posta.png') });
    await page.locator('#i-sahit-alanlari').screenshot({ path: info.outputPath('sahitler.png') });
    for (const tema of ['light', 'dark']) {
      if (tema === 'dark') await page.locator('#tema-dugme').click();
      await page.evaluate(async () => Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
      const axe = await new AxeBuilder({ page }).include('#b-iletisim').include('#b-ihtida').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    // Kapalı tercih yazılmış adları gövdeden çıkarır; açık tercih iki adı korur.
    if (dil === 'tr') await page.locator('#i-sahit-ekle').uncheck();
    await page.locator('form[data-form="ihtida"] button[type="submit"]').click();
    await expect(page.locator('[data-basari]')).toBeVisible();
    expect(gonderilen).toHaveLength(1);
    const v = gonderilen[0];
    expect(v.teslimat).toEqual({ yontem: 'adres' });
    expect(v.basvuran.adres).toBe('Rue du Test 12, boîte 3, 6900, Marche-en-Famenne, Belçika');
    expect(v.sahitSecimi).toBe(dil === 'tr' ? 'cami' : 'kendi');
    expect(v.sahitler).toEqual(dil === 'tr' ? [] : [{ ad: 'Birinci Örnek Şahit' }, { ad: 'İkinci Örnek Şahit' }]);
    expect(v.gorseller.vesikalik).toMatch(/^data:image\/(jpeg|png);base64,/);
    expect(Object.keys(v.basvuran).some(k => /kimlik|national|registry|tcno|pasaport/i.test(k))).toBe(false);
  });
}

test('Eski servis yeni ihtida bilgilerini eksik kaydedemez', async ({ page }) => {
  let post = 0;
  await page.route('**/macros/**', route => { if (route.request().method() === 'POST') post++; return route.fulfill({ json: { ok: true, surum: 25 } }); });
  await formSayfasiniAc(page, '/tr/ihtida-basvurusu/'); await doldur(page);
  await page.locator('form[data-form="ihtida"] button[type="submit"]').click();
  await expect(page.locator('[data-mesaj]')).toContainText('Bilgileriniz gönderilmedi');
  expect(post).toBe(0);
});

test('Hata düzeltildikten sonra eski uyarı odağı yeni yazılan alandan çalamaz', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await formSayfasiniAc(page, '/fr/demande-de-conversion/');
  await doldur(page);
  await page.locator('#i-ulke').fill('');
  await page.locator('form[data-form="ihtida"] button[type="submit"]').click();
  await page.locator('#i-ulke').fill('Belçika');
  await page.locator('#i-sebep').focus();
  // Üretimdeki 350 ms kaydırma/odak gecikmesinin geçmesini özellikle bekler.
  await page.waitForTimeout(450);
  await expect(page.locator('#i-sebep')).toBeFocused();
  await page.keyboard.type('TEST');
  await expect(page.locator('#i-sebep')).toHaveValue('TEST');
  await expect(page.locator('#i-ulke')).toHaveValue('Belçika');
});

test('Panelde şahit adları korunur; kayıtlı imza teyitsiz eklenmez', async ({ page }, info) => {
  await formSayfasiniAc(page, '/tr/');
  await page.addStyleTag({ url: '/admin/panel.css' });
  await page.evaluate(async () => {
    const { ek9HazirlikAc } = await import('/admin/ek9-hazirlik.js');
    window.sonuc = undefined;
    ek9HazirlikAc({ 'Adı Soyadı': 'Deniz Örnek', 'Şahit 1': 'Birinci Örnek Şahit', 'Belge teslim yeri': 'cami' }, { ridvan: 'SAHTE_TEST_IMZASI', yeliz: 'SAHTE_TEST_IMZASI' }).then(s => window.sonuc = s);
  });
  await expect(page.locator('#ek9-sahit-0')).toHaveValue('Birinci Örnek Şahit');
  await expect(page.locator('#ek9-sahit-1')).toHaveValue('Ercan MOLA');
  await expect(page.locator('dialog input[type=checkbox]').nth(0)).toBeDisabled();
  await expect(page.locator('dialog input[type=checkbox]').nth(1)).not.toBeChecked();
  await expect(page.locator('#ek9-gercek-tarih')).toHaveValue('');
  await page.getByRole('dialog', { name: 'EK-9 belgesini hazırlayın' }).screenshot({ path: info.outputPath('ek9-hazirlik.png') });
  await page.getByRole('button', { name: 'PDF’yi hazırla' }).click();
  await expect.poll(() => page.evaluate(() => window.sonuc)).toEqual({ adSoyad: 'Deniz Örnek', sahitler: [{ ad: 'Birinci Örnek Şahit', imza: '' }, { ad: 'Ercan MOLA', imza: '' }], ihtidaTarihi: '', isimYazisi: 'kaligrafik', alanYazisi: 'el-yazisi' });
  await page.evaluate(async () => {
    const { ek9HazirlikAc } = await import('/admin/ek9-hazirlik.js');
    ek9HazirlikAc({ 'Adı Soyadı': 'Deniz Örnek' }, { ridvan: 'TEST_R', ercan: 'TEST_E', yeliz: 'TEST_Y' }).then(s => window.sonuc = s);
  });
  await page.getByLabel('Belgeye yazılacak ad soyad (kimlikteki gibi)').fill('Deniz Élodie Örnek');
  await page.getByLabel('İlk sayfadaki isim').selectOption('sade');
  await page.getByLabel('Diğer doldurulan alanlar').selectOption('sade');
  await page.locator('.ek9-hazirlik input[type=checkbox]').nth(0).check();
  await page.locator('.ek9-hazirlik input[type=checkbox]').nth(1).check();
  await page.locator('#ek9-sahit-1').fill('Başka Örnek Şahit');
  await expect(page.locator('.ek9-hazirlik input[type=checkbox]').nth(1)).not.toBeChecked();
  await page.getByRole('button', { name: 'PDF’yi hazırla' }).click();
  await expect.poll(() => page.evaluate(() => window.sonuc)).toEqual({ adSoyad: 'Deniz Élodie Örnek', sahitler: [{ ad: 'Ercan MOLA', imza: 'TEST_E' }, { ad: 'Başka Örnek Şahit', imza: '' }], ihtidaTarihi: '', isimYazisi: 'sade', alanYazisi: 'sade' });
});

test('Yerel şahit sırası Ercan Mola ve Rıdvan Kayahan olur; Yeliz imzası aktarılmaz', async ({ page, context }) => {
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  await page.goto('/tr/ihtida-basvuru/');
  await page.evaluate(async () => {
    const { ek9HazirlikAc } = await import('/admin/ek9-hazirlik.js');
    ek9HazirlikAc({ 'Adı Soyadı': 'Deniz Örnek' }, { ridvan:'TEST_R', yeliz:'TEST_Y' });
  });
  await expect(page.locator('#ek9-sahit-0')).toHaveValue('Ercan MOLA');
  await expect(page.locator('#ek9-sahit-1')).toHaveValue('Rıdvan KAYAHAN');
  await expect(page.locator('[data-sahit-unvan]')).toHaveText(['Dernek Başkanı', 'Din Görevlisi']);
  await expect(page.locator('.ek9-onay input').nth(0)).toBeDisabled();
  await page.locator('#ek9-sahit-0').fill('Başka Örnek Şahit');
  await expect(page.locator('[data-sahit-unvan]').nth(0)).toBeHidden();
});


test('Tam paket ekranı adresi ve beyanı hazır getirir; tören tarihini kullanıcı doğrular', async ({ page }, info) => {
  await formSayfasiniAc(page, '/tr/');
  await page.addStyleTag({ url: '/admin/panel.css' });
  await page.evaluate(async () => {
    const { ek9HazirlikAc } = await import('/admin/ek9-hazirlik.js');
    window.paketSonucu = undefined;
    ek9HazirlikAc({ 'Adı Soyadı': 'Deniz Örnek', 'Adres': 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', 'İhtida sebebi': 'Kendi araştırmam sonucunda.', 'Kimlik belgesi türü': 'pasaport', 'Belge teslim yeri': 'cami' }, {}, { paket: true, imzali: true, beyanTarihi: '2026-09-09' }).then(v => window.paketSonucu = v);
  });
  const dialog = page.getByRole('dialog', { name: 'İhtida belge paketini hazırlayın' });
  await expect(page.locator('#ek9-tam-adres')).toHaveValue('Rue du Test 12, 6900, Marche-en-Famenne, Belçika');
  await expect(page.locator('#ek9-sebep')).toHaveValue('Kendi araştırmam sonucunda.');
  await expect(page.locator('#ek9-beyan-tarihi')).toHaveValue('2026-09-09');
  await expect(page.locator('#ek9-beyan-tarihi')).toHaveAttribute('readonly', '');
  await expect(page.locator('#ek9-gercek-tarih')).toHaveValue('');
  await page.getByRole('button', { name: 'Tek PDF paketini hazırla' }).click();
  expect(await page.evaluate(() => window.paketSonucu)).toBeUndefined();
  await page.locator('#ek9-gercek-tarih').fill('2026-09-08');
  await page.locator('#ek9-tam-adres').scrollIntoViewIfNeeded();
  await dialog.screenshot({ path: info.outputPath('paket-hazirlik.png') });
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const axe = await new AxeBuilder({ page }).include('.ek9-hazirlik').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id)).toEqual([]);
  await page.getByRole('button', { name: 'Tek PDF paketini hazırla' }).click();
  await expect.poll(() => page.evaluate(() => window.paketSonucu?.ihtidaTarihi)).toBe('2026-09-08');
  expect(await page.evaluate(() => window.paketSonucu.beyanTarihi)).toBe('2026-09-09');
});

test('Tarayıcıdaki yerel fontlarla EK-9 ve imzalı tam paket üretilir', async ({ page }, info) => {
  await formSayfasiniAc(page, '/tr/');
  await page.addScriptTag({ url: '/vendor/pdf-lib.min.js' });
  await page.addScriptTag({ url: '/vendor/fontkit.umd.min.js' });
  const sonuc = await page.evaluate(async () => {
    const { ek9Uret } = await import('/admin/ek9.js');
    const { ihtidaPaketiUret } = await import('/admin/ihtida-paket.js');
    const getir = async yol => { const r = await fetch(yol); if (!r.ok) throw new Error(yol); return new Uint8Array(await r.arrayBuffer()); };
    const [sablonBytes, fontBytes, fontKalinBytes, fontKaligrafiBytes, fontElYazisiBytes] = await Promise.all([
      '/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf', '/fonts/Lora-Regular.ttf', '/fonts/Lora-Bold.ttf', '/fonts/GreatVibes-Regular.ttf', '/fonts/Caveat-Medium.ttf',
    ].map(getir));
    const kaynak = { pdfLib: window.PDFLib, fontkit: window.fontkit, sablonBytes, fontBytes, fontKalinBytes, fontKaligrafiBytes, fontElYazisiBytes,
      veri: { ref: 'IH-2099-9999', adSoyad: 'Deniz Élodie Örnek', anneAdi: 'İlknur', dogumYeri: 'Liège', dogumTarihi: '20/05/1990', adres: 'Rue du Test 12, 6900, Belçika', beyanTarihi: '09/09/2026', ihtidaTarihi: '08/09/2026', dil: 'fr' } };
    const bytes = await ek9Uret(kaynak);
    const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 80;
    const ctx = canvas.getContext('2d'); ctx.strokeStyle = '#142d75'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(12, 55); ctx.quadraticCurveTo(100, 5, 224, 58); ctx.stroke();
    const resim = canvas.toDataURL('image/png');
    const paket = await ihtidaPaketiUret({ ...kaynak,
      ek10SablonBytes: await getir('/belgeler/ihtida/ek10-kvkk-acik-riza-metni.pdf'), ek10Surumu: '2026-09-09', imzaAktarimIzni: true,
      foto: resim, kimlikOn: resim, kimlikArka: resim, belgeTuru: 'kimlik', basvuranImza: resim, ek10Onayi: true });
    const doc = await window.PDFLib.PDFDocument.load(bytes);
    const paketDoc = await window.PDFLib.PDFDocument.load(paket);
    const base64 = veri => { let binary = ''; for (const byte of veri) binary += String.fromCharCode(byte); return btoa(binary); };
    return { sayfa: doc.getPageCount(), pdf: base64(bytes), paket: base64(paket), paketSayfa: paketDoc.getPageCount() };
  });
  expect(sonuc.sayfa).toBe(2);
  expect(sonuc.paketSayfa).toBe(6);
  writeFileSync(info.outputPath('ek9-tarayici.pdf'), Buffer.from(sonuc.pdf, 'base64'));
  writeFileSync(info.outputPath('tam-paket-tarayici.pdf'), Buffer.from(sonuc.paket, 'base64'));
});


for (const [dil, yol] of Object.entries(yollar)) {
  test(`${dil}: başka cami seçimi iki elle girilmiş şahit gerektirir`, async ({ page }, info) => {
    const gonderilen = [];
    await page.route('**/macros/**', route => {
      if (route.request().method() === 'POST') gonderilen.push(JSON.parse(route.request().postData()));
      return route.fulfill({ json: { ok: true, surum: 27, ihtidaPaketHazir: true, ihtidaCamiSecimi: true, ref: 'IH-2099-9999' } });
    });
    await formSayfasiniAc(page, `/${dil}/${yol}/`); await doldur(page);
    const kimlik = page.locator('input[name="camiId"]');
    await expect(kimlik).toHaveValue('ulucamii-marche');
    await page.locator('#i-sahit-ekle').check();
    await page.locator('#i-sahit-1').fill('Önceki Cami Şahidi');
    await page.locator('[data-cami-degistir] summary').click();
    await page.locator('#i-cami-ara').fill('liege');
    expect(await page.locator('#i-cami-liste option').count()).toBeGreaterThan(0);
    // Aday listesinde aramak, seçme düğmesine basmadan asıl camiyi değiştirmez.
    await expect(kimlik).toHaveValue('ulucamii-marche');
    const hedef = await page.locator('#i-cami-liste').inputValue();
    await page.locator('[data-cami-sec]').click();
    await expect(kimlik).toHaveValue(hedef);
    await expect(page.locator('#i-sahit-ekle')).toBeHidden();
    await expect(page.locator('#i-sahit-1')).toHaveValue('');
    await expect(page.locator('#i-sahit-2')).toHaveValue('');
    await expect(page.locator('#i-sahit-2')).toHaveAttribute('required', '');
    const gonder = page.locator('form[data-form="ihtida"] button[type="submit"]');
    await gonder.click(); expect(gonderilen).toHaveLength(0);
    await page.locator('#i-sahit-1').fill('Birinci Örnek Şahit');
    await gonder.click(); expect(gonderilen).toHaveLength(0);
    await page.locator('#i-sahit-2').fill('Birinci Örnek Şahit');
    await gonder.click(); expect(gonderilen).toHaveLength(0);
    await page.locator('#i-sahit-2').fill('İkinci Örnek Şahit');
    await page.locator('[data-cami-degistir] summary').click();
    await page.locator('#b-cami').screenshot({ path: info.outputPath('cami-secimi.png') });
    for (const tema of ['light', 'dark']) {
      if (tema === 'dark') await page.locator('#tema-dugme').click();
      await page.locator('#b-cami').evaluate(async e => Promise.all(e.getAnimations({ subtree: true }).filter(a => a.playState === 'running' && a.timeline === document.timeline && Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished.catch(() => {}))));
      const axe = await new AxeBuilder({ page }).include('#b-cami').include('#i-sahit-alanlari').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.locator('[data-cami-degistir] summary').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#i-cami-ara')).toBeHidden();
    await gonder.click();
    await expect(page.locator('[data-basari]')).toBeVisible();
    expect(gonderilen).toHaveLength(1);
    expect(gonderilen[0].cami.id).toBe(hedef);
    expect(gonderilen[0].cami.sehir.toLowerCase()).toContain('li');
    expect(gonderilen[0].cami.adres).toBeTruthy();
    expect(gonderilen[0].sahitSecimi).toBe('kendi');
    expect(gonderilen[0].sahitler).toEqual([{ ad: 'Birinci Örnek Şahit' }, { ad: 'İkinci Örnek Şahit' }]);
  });
}

test('Listede olmayan cami taslakta korunur; taslak silinince Ulu Camii geri gelir', async ({ page }) => {
  await formSayfasiniAc(page, '/tr/ihtida-basvurusu/');
  await page.locator('[data-cami-degistir] summary').click();
  await page.locator('#i-cami-ara').fill('listede-olmayan-sentetik-cami');
  await expect(page.locator('[data-cami-sec]')).toBeDisabled();
  await expect(page.locator('input[name="camiId"]')).toHaveValue('ulucamii-marche');
  await page.locator('[data-cami-elle]').click();
  for (const [id, value] of Object.entries({ ad: 'Örnek Test Camisi', sehir: 'Namur', postaKodu: '5000', adres: 'Rue du Test 42' })) await page.locator(`#i-cami-${id}`).fill(value);
  await page.locator('#i-sahit-1').fill('Birinci Örnek');
  await page.locator('#i-sahit-2').fill('İkinci Örnek');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ulucamii:ihtida:v2') || '{}').alanlar?.camiId)).toBe('diger');
  await page.reload();
  await page.locator('[data-adim-tumu]').click();
  await expect(page.locator('input[name="camiId"]')).toHaveValue('diger');
  await expect(page.locator('#i-cami-ad')).toHaveValue('Örnek Test Camisi');
  await expect(page.locator('#i-sahit-1')).toHaveValue('Birinci Örnek');
  await expect(page.locator('#i-sahit-2')).toHaveAttribute('required', '');
  await expect(page.locator('#i-sahit-ekle')).toBeHidden();
  await page.locator('[data-taslak-sil]').click();
  await expect(page.locator('input[name="camiId"]')).toHaveValue('ulucamii-marche');
  await expect(page.locator('#i-sahit-ekle')).toBeVisible();
  await expect(page.locator('#i-sahit-ekle')).not.toBeChecked();
  await expect(page.locator('#i-sahit-2')).not.toHaveAttribute('required', '');
  await expect(page.locator('#i-cami-ad')).toBeDisabled();
});
