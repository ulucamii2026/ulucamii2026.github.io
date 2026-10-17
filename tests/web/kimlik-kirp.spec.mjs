/** İhtida formu: kimlik yüzünü karta kırpma penceresi (17 Eki 2026, src/scripts/kimlik-kirp.ts).
 *  Kurgusal kart görüntüsü kullanılır; gerçek kimlik verisi yoktur. Ağ dışarıya kapalıdır. */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, s => s.close());
});

/** Koyu masa üzerinde eğik duran örnek kart (1600 × 1200). */
async function kartFotografi() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <rect width="1600" height="1200" fill="#4a3b2e"/>
    <g transform="translate(800 600) rotate(-8)">
      <rect x="-560" y="-353" width="1120" height="706" rx="40" fill="#efe9f4"/>
      <rect x="-560" y="-353" width="1120" height="90" fill="#c9a7c4"/>
      <rect x="-500" y="-210" width="300" height="400" fill="#9aa7b5"/>
      <rect x="-140" y="-180" width="560" height="40" fill="#555"/>
      <rect x="-140" y="-80" width="420" height="40" fill="#555"/>
    </g></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

async function ac(page) {
  await page.goto('/tr/ihtida-basvurusu/');
  await page.locator('[data-adim-tumu]').click();
}

test('Kimlik yüzü karta kırpılır; köşeler klavyeyle ayarlanır; vazgeç önceki görseli korur', async ({ page }, info) => {
  await ac(page);
  const kutu = page.locator('[data-gorsel="kimlikOn"]');
  await page.locator('#i-g-kimlik-on').setInputFiles({ name: 'kart.jpg', mimeType: 'image/jpeg', buffer: await kartFotografi() });
  const pencere = page.locator('dialog.kimlik-kirp');
  await expect(pencere).toBeVisible();
  await expect(pencere.locator('[data-durum]')).toHaveText(/bulundu/);
  await expect(pencere.locator('.kk-kose')).toHaveCount(4);
  await pencere.screenshot({ path: info.outputPath('kirp-penceresi.png') });
  expect(await pencere.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const axe = await new AxeBuilder({ page }).include('dialog.kimlik-kirp').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id)).toEqual([]);

  // Her tutamacın merkezi çokgenin köşesinde durmalı (global button transform'u ortalamayı bozmamalı).
  const sapma = await pencere.evaluate(el => {
    const svg = el.querySelector('.kk-cizgi').getBoundingClientRect();
    const noktalar = el.querySelector('.kk-cizgi polygon').getAttribute('points').trim().split(/\s+/).map(p => p.split(',').map(Number));
    return [...el.querySelectorAll('.kk-kose')].map((b, i) => {
      const r = b.getBoundingClientRect();
      return Math.hypot(r.x + r.width / 2 - (svg.x + noktalar[i][0]), r.y + r.height / 2 - (svg.y + noktalar[i][1]));
    });
  });
  for (const s of sapma) expect(s).toBeLessThan(1.5);
  // Kartın köşeleri bulunmuş olmalı: kurgusal kart 1600 × 1200 kaynakta (800, 600) merkezli, 1120 × 706, −8° döndürülmüş.
  const kaynakKose = await pencere.evaluate(el => {
    const r = el.querySelector('.kk-resim').getBoundingClientRect(), olcek = 1600 / r.width;
    return el.querySelector('.kk-cizgi polygon').getAttribute('points').trim().split(/\s+/)
      .map(p => p.split(',').map(Number).map(v => v * olcek));
  });
  const a = -8 * Math.PI / 180;
  const beklenen = [[-560, -353], [560, -353], [560, 353], [-560, 353]]
    .map(([x, y]) => [800 + x * Math.cos(a) - y * Math.sin(a), 600 + x * Math.sin(a) + y * Math.cos(a)]);
  for (const [x, y] of beklenen) expect(Math.min(...kaynakKose.map(([u, v]) => Math.hypot(u - x, v - y)))).toBeLessThan(20);

  const kose = pencere.locator('.kk-kose').first();
  const once = await kose.boundingBox();
  await kose.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');
  const sonra = await kose.boundingBox();
  expect(sonra.x).toBeGreaterThan(once.x);
  expect(sonra.y).toBeGreaterThan(once.y + 5);
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Shift+ArrowUp');

  // Sürükleme: tutamaç merkezinin yanından tutulsa da köşe yalnız hareket kadar kayar, parmağın altına sıçramaz.
  const nokta = () => pencere.evaluate(el => el.querySelector('.kk-cizgi polygon').getAttribute('points').trim().split(/\s+/)[2].split(',').map(Number));
  const surukle = async (dx) => {
    const b = await pencere.locator('.kk-kose').nth(2).boundingBox();
    const x = b.x + b.width / 2 + 10, y = b.y + b.height / 2 + 6;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + dx, y, { steps: 4 }); await page.mouse.up();
  };
  const [nx, ny] = await nokta();
  await surukle(-20);
  const [sx, sy] = await nokta();
  expect(Math.abs(sx - (nx - 20))).toBeLessThan(1.5);
  expect(Math.abs(sy - ny)).toBeLessThan(1.5);
  await surukle(20);

  await pencere.locator('[data-uygula]').click();
  await expect(pencere).toBeHidden();
  await expect(kutu).toHaveAttribute('data-dolu', '1');
  await expect(kutu.locator('[data-durum]')).toHaveText(/Kart kırpıldı/);
  const olcu = await kutu.locator('[data-onizleme]').evaluate(async img => { await img.decode(); return [img.naturalWidth, img.naturalHeight]; });
  expect(olcu).toEqual([1011, 638]);
  // Kırpılmış kartın kenarında masa rengi kalmamalı.
  const kenar = await kutu.locator('[data-onizleme]').evaluate(img => {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    return [[30, 320], [980, 320], [505, 610]].map(([px, py]) => Array.from(x.getImageData(px, py, 1, 1).data.slice(0, 3)));
  });
  for (const [r, g, b] of kenar) expect(r + g + b).toBeGreaterThan(450);
  await kutu.screenshot({ path: info.outputPath('kirpilmis-kart.png') });

  // Düzelt → vazgeç: kırpılmış görsel olduğu gibi kalır.
  const src = await kutu.locator('[data-onizleme]').getAttribute('src');
  await kutu.locator('[data-kirp-duzelt]').click();
  await expect(pencere).toBeVisible();
  await pencere.locator('[data-vazgec]').click();
  await expect(pencere).toBeHidden();
  await expect(kutu.locator('[data-onizleme]')).toHaveAttribute('src', src);

  // Pasaporta geçince kırpılmış görüntü pasaport bilgi sayfası oranına yeniden açılır.
  await page.locator('#i-belge-pasaport').check();
  const pasaport = await kutu.locator('[data-onizleme]').evaluate(async img => { await img.decode(); return [img.naturalWidth, img.naturalHeight]; });
  expect(pasaport).toEqual([1476, 1039]);
});

test('Kırpmadan kullan ham fotoğrafı gönderir; düzelt düğmesi kırpmaya geri döner', async ({ page }) => {
  await ac(page);
  const kutu = page.locator('[data-gorsel="kimlikOn"]');
  await page.locator('#i-g-kimlik-on').setInputFiles({ name: 'kart.jpg', mimeType: 'image/jpeg', buffer: await kartFotografi() });
  const pencere = page.locator('dialog.kimlik-kirp');
  await pencere.locator('[data-ham]').click();
  await expect(kutu).toHaveAttribute('data-dolu', '1');
  await expect(kutu.locator('[data-durum]')).toHaveText(/Hazır/);
  const ham = await kutu.locator('[data-onizleme]').evaluate(async img => { await img.decode(); return [img.naturalWidth, img.naturalHeight]; });
  expect(ham).toEqual([1600, 1200]);
  await kutu.locator('[data-kirp-duzelt]').click();
  await pencere.locator('[data-uygula]').click();
  await expect(kutu.locator('[data-durum]')).toHaveText(/Kart kırpıldı/);
  // Vazgeçilen yeni seçim önceki kartı silmez.
  await page.locator('#i-g-kimlik-on').setInputFiles({ name: 'kart2.jpg', mimeType: 'image/jpeg', buffer: await kartFotografi() });
  await pencere.locator('[data-vazgec]').click();
  await expect(kutu).toHaveAttribute('data-dolu', '1');
  await expect(kutu).not.toHaveAttribute('data-mesgul', '1');
  await expect(kutu.locator('[data-durum]')).toHaveText(/Kart kırpıldı/);
});
