import { test, expect } from '@playwright/test';
import sharp from 'sharp';

let png;
test.beforeAll(async () => { png = await sharp({ create: { width: 300, height: 400, channels: 3, background: '#687c92' } }).png().toBuffer(); });
test.beforeEach(async ({ context }) => {
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, s => s.close());
});
const form = p => p.locator('form[data-form="ihtida"]');
const dosya = name => ({ name, mimeType: 'image/png', buffer: png });
async function ac(page, dil = 'tr') {
  const yollar = { tr: 'ihtida-basvurusu', fr: 'demande-de-conversion', en: 'conversion-application' };
  await page.goto(`/${dil}/${yollar[dil]}/`);
  await page.locator('[data-adim-tumu]').click();
}
async function doldur(page) {
  for (const [id, value] of Object.entries({ ad: 'Deniz Örnek', dogum: '1990-05-20', 'dogum-yeri': 'Namur', uyruk: 'Belgique', anne: 'Anne Örnek', baba: 'Baba Örnek', ogrenim: 'Lisans', meslek: 'Öğretmen', eposta: 'deniz@example.test', telefon: '+32470000000', adres: 'Rue du Test 12', 'posta-kodu': '6900', sehir: 'Marche-en-Famenne', ulke: 'Belgique', 'onceki-din': 'Belirtilen inanç', beyan: 'Deniz Örnek' })) await page.locator(`#i-${id}`).fill(value);
  await page.locator('#i-cins-kadin').check();
  await page.locator('#i-medeni').selectOption('bekar');
  await page.locator('#i-belge-pasaport').check();
  for (const [id, key] of [['vesikalik', 'vesikalik'], ['kimlik-on', 'kimlikOn']]) {
    await page.locator(`#i-g-${id}`).setInputFiles(dosya(id + '.png'));
    await expect(page.locator(`[data-gorsel="${key}"]`)).toHaveAttribute('data-dolu', '1');
  }
  await page.locator('#i-imza-yok').check();
  for (const id of ['riza', 'ek10', 'gizlilik', 'gorsel']) await page.locator(`#i-onay-${id}`).check();
}

test('Geç biten fotoğraf işlemi kaldırılan veya daha yeni seçilen görseli geri getiremez', async ({ page }) => {
  await page.addInitScript(() => {
    const decode = window.createImageBitmap.bind(window);
    window.bekleyenGorseller = {};
    window.createImageBitmap = async (file, options) => {
      const bitmap = await decode(file, options);
      if (file.name.startsWith('bekle')) await new Promise(resolve => { window.bekleyenGorseller[file.name] = resolve; });
      return bitmap;
    };
  });
  await ac(page);
  const input = page.locator('#i-g-vesikalik'), box = page.locator('[data-gorsel="vesikalik"]');
  await input.setInputFiles(dosya('ilk.png'));
  await expect(box).toHaveAttribute('data-dolu', '1');
  await input.setInputFiles(dosya('bekle-sil.png'));
  await expect.poll(() => page.evaluate(() => !!window.bekleyenGorseller['bekle-sil.png'])).toBe(true);
  await box.locator('[data-kaldir]').click();
  await page.evaluate(() => window.bekleyenGorseller['bekle-sil.png']());
  await expect(box).not.toHaveAttribute('data-mesgul', '1');
  await page.waitForTimeout(100);
  await expect(box).toHaveAttribute('data-dolu', '');
  await input.setInputFiles(dosya('bekle-eski.png'));
  await expect.poll(() => page.evaluate(() => !!window.bekleyenGorseller['bekle-eski.png'])).toBe(true);
  const yeni = await sharp({ create: { width: 180, height: 240, channels: 3, background: '#e0a830' } }).png().toBuffer();
  await input.setInputFiles({ name: 'yeni.png', mimeType: 'image/png', buffer: yeni });
  await expect(box).toHaveAttribute('data-dolu', '1');
  const src = await box.locator('[data-onizleme]').getAttribute('src');
  await page.evaluate(() => window.bekleyenGorseller['bekle-eski.png']());
  await page.waitForTimeout(100);
  await expect(box.locator('[data-onizleme]')).toHaveAttribute('src', src);
});

test('Gönderim kilidi çift isteği engeller; başarıdan sonra taslak yeniden yazılmaz', async ({ page }) => {
  let post = 0, bitir;
  const bekle = new Promise(resolve => { bitir = resolve; });
  await page.route('**/macros/**', async r => {
    if (r.request().method() === 'POST') { post++; await bekle; }
    await r.fulfill({ json: { ok: true, surum: 28, ihtidaPaketHazir: true, ref: 'IH-2099-9999' } });
  });
  await ac(page); await doldur(page);
  await form(page).evaluate(f => { f.requestSubmit(); f.requestSubmit(); });
  await expect.poll(() => post).toBeGreaterThan(0);
  await page.waitForTimeout(100);
  expect(post).toBe(1);
  // Son input olayının 400 ms taslak zamanlayıcısı başarıdan sonra çalışmamalı.
  await page.locator('#i-sebep').fill('Kendi araştırmam sonucunda.');
  bitir();
  await expect(page.locator('[data-basari]')).toBeVisible();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => localStorage.getItem('ulucamii:ihtida:v2'))).toBeNull();
});

test('Ağ hatasından sonra yeniden deneme aynı başvuru anahtarını korur', async ({ page }) => {
  const gelen = [];
  await page.route('**/macros/**', async r => {
    if (r.request().method() === 'POST') {
      gelen.push(r.request().postDataJSON());
      if (gelen.length === 1) return r.abort();
    }
    await r.fulfill({ json: { ok: true, surum: 28, ihtidaPaketHazir: true, ref: 'IH-2099-9999' } });
  });
  await ac(page); await doldur(page);
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-mesaj]')).toBeVisible();
  await expect(form(page).locator('[type=submit]')).toBeEnabled();
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeVisible();
  expect(gelen).toHaveLength(2);
  expect(gelen[0].gonderimAnahtari).toBe(gelen[1].gonderimAnahtari);
});

for (const dil of ['tr', 'fr', 'en']) test(`${dil}: son kontrol sebebi ve yeni ismi gösterir`, async ({ page }) => {
  await ac(page, dil);
  await page.locator('#i-sebep').fill('Kendi araştırmam sonucunda.');
  await page.locator('input[name="basvuran.yeniIsim"]').fill('Meryem');
  await page.locator('input[name="basvuran.yeniIsim"]').blur();
  await expect(page.locator('[data-ozet-alan="sebep"]')).toContainText('Kendi araştırmam sonucunda.');
  await expect(page.locator('[data-ozet-alan="yeniIsim"]')).toContainText('Meryem');
});

test('Ekran daraltıldığında çizilmiş imzanın tamamı PDF gövdesinde korunur', async ({ page }) => {
  let gelen;
  await page.route('**/macros/**', r => {
    if (r.request().method() === 'POST') gelen = r.request().postDataJSON();
    return r.fulfill({ json: { ok: true, surum: 28, ihtidaPaketHazir: true, ref: 'IH-2099-9999' } });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await ac(page); await doldur(page);
  await page.locator('#i-imza-yok').uncheck();
  const canvas = page.locator('[data-imza] canvas');
  await canvas.scrollIntoViewIfNeeded();
  // Ham fare koordinatları Playwright'ın örtüşme denetimini yapmaz. Tuval tamamen
  // ekranda olsa da sabit üst menünün altında kalabilir; gerçek çizim alanını aç.
  await canvas.evaluate(c => c.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect.poll(() => canvas.evaluate(c => {
    const r = c.getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width * .15, r.y + 45) === c;
  })).toBe(true);
  const b = await canvas.boundingBox();
  await page.mouse.move(b.x + b.width * .15, b.y + 45); await page.mouse.down();
  await page.mouse.move(b.x + b.width * .85, b.y + 85, { steps: 12 }); await page.mouse.up();
  await page.locator('#i-onay-imza').check();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => canvas.evaluate(c => c.width / Math.min(3, devicePixelRatio))).toBeLessThan(400);
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeVisible();
  const meta = await sharp(Buffer.from(gelen.gorseller.imza.split(',')[1], 'base64')).metadata();
  // Sıkıştırma sınırı içinde özgün imzanın en/boy oranı korunur.
  expect(meta.width / meta.height).toBeGreaterThan(7);
});

test('Ulu Camii için de iki aynı şahit adı belge adımına geçmeden açıklanır', async ({ page }) => {
  await page.goto('/tr/ihtida-basvurusu/');
  await page.locator('[data-adim-sec="3"]').click();
  await page.locator('#i-onceki-din').fill('Belirtilen inanç');
  await page.locator('#i-sahit-ekle').check();
  await page.locator('#i-sahit-1').fill('Birinci Örnek');
  await page.locator('#i-sahit-2').fill('BİRİNCİ  ÖRNEK');
  await page.locator('[data-adim-ileri]').click();
  await expect(page.locator('#i-sahit-2')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#b-ihtida')).toBeVisible();
});

test('İmzasız taslak silinince imza alanı yeniden çizime açılır', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ulucamii:ihtida:v2', JSON.stringify({ surum: 2, zaman: Date.now(), anahtar: 'test-reset-2099', alanlar: { 'basvuran.adSoyad': 'Deniz Örnek', imzaYok: '1' } })));
  await ac(page);
  await expect(page.locator('[data-imza] canvas')).toHaveAttribute('data-kapali', '1');
  await page.locator('[data-taslak-sil]').click();
  await page.locator('[data-adim-sec="4"]').click();
  await expect(page.locator('#i-imza-yok')).not.toBeChecked();
  await expect(page.locator('[data-imza] canvas')).not.toHaveAttribute('data-kapali', '1');
  await expect(page.locator('[data-imza] canvas')).toHaveAttribute('aria-disabled', 'false');
});

test('Yanlış tür, çok büyük ve bozuk fotoğraflar açıklanır; eski fotoğraf gönderimde kalmaz', async ({ page }) => {
  await ac(page);
  const input = page.locator('#i-g-vesikalik'), box = page.locator('[data-gorsel="vesikalik"]');
  for (const file of [
    { name: 'belge.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-test') },
    { name: 'buyuk.png', mimeType: 'image/png', buffer: Buffer.alloc(12 * 1024 * 1024 + 1) },
    { name: 'bozuk.png', mimeType: 'image/png', buffer: Buffer.from('resim degil') },
  ]) {
    await input.setInputFiles(dosya('gecerli.png'));
    await expect(box).toHaveAttribute('data-dolu', '1');
    await input.setInputFiles(file);
    await expect(box.locator('.hata')).toBeVisible();
    await expect(box).toHaveAttribute('data-dolu', '');
    await expect(box).not.toHaveAttribute('data-mesgul', '1');
  }
});

test('İmza tuvali desteklenmiyorsa imzasız seçenek seçilmeden başvuru gönderilmez', async ({ page }) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) { return this.closest('[data-imza]') ? null : get.apply(this, args); };
  });
  let post = 0;
  await page.route('**/macros/**', r => {
    if (r.request().method() === 'POST') post++;
    return r.fulfill({ json: { ok: true, surum: 28, ihtidaPaketHazir: true, ref: 'IH-2099-9999' } });
  });
  await ac(page); await doldur(page);
  await page.locator('#i-imza-yok').uncheck();
  await page.locator('#i-onay-imza').check();
  await form(page).locator('[type=submit]').click();
  expect(post).toBe(0);
  await expect(page.locator('[data-imza] .hata')).toBeVisible();
  await page.locator('#i-imza-yok').check();
  await form(page).locator('[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeVisible();
});
