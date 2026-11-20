import { test, expect } from '@playwright/test';
import { mektepAc } from './helpers/mektep.mjs';

/* Veli panosu tanıtım turu (Driver.js, src/scripts/veli-turu.ts). Gerçek portal kodu + sahte Firebase (helpers/mektep.mjs),
   sayfa Hosting'in gerçek CSP'si altında açılır (`csp: true`): Driver satır içi stil/betik kullanırsa ihlal olur.
   Dış ağ kesik; yalnız demo veri (TEST-1, example.test). */

const GORULDU = 'veliTuruGoruldu';
const bayrak = (page) => page.evaluate((k) => localStorage.getItem(k), GORULDU);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  page.on('pageerror', (e) => { (test.info().annotations.push({ type: 'pageerror', description: String(e) })); });
});

const hatasizMi = (page) => {
  const hatalar = test.info().annotations.filter((a) => a.type === 'pageerror');
  expect(hatalar).toEqual([]);
  return expect.poll(() => page.evaluate(() => window.__csp)).toEqual([]);
};

test('İlk ziyarette tur açılır; ileri/geri çalışır; kapatmak bayrağı yazar; sonra gelmez; «Tanıtım turu» yeniden başlatır; CSP ihlali yok', async ({ page, context }) => {
  await mektepAc(page, context, { tur: true, csp: true, ogrenci: false });
  const pencere = page.locator('.driver-popover.veli-tur');
  const baslik = pencere.locator('.driver-popover-title');
  const ileri = pencere.locator('.driver-popover-next-btn');
  const geri = pencere.locator('.driver-popover-prev-btn');

  // Pano çizilince (bülten bölümünün dolmasını bekledikten sonra) tur kendiliğinden açılır; giriş ekranında değil.
  await expect(pencere).toBeVisible();
  await expect(baslik).toHaveText('Çocuğunuzun sayfası');
  await expect(pencere.locator('.driver-popover-progress-text')).toHaveText('1 / 4'); // demo veride yayımlanmış bülten yok: «Haftalık bülten» adımı atlanır
  expect(await bayrak(page)).toBeNull();

  await ileri.click();
  await expect(pencere.locator('.driver-popover-progress-text')).toHaveText(/^2 \/ \d$/);
  const ikinci = await baslik.textContent();
  expect(ikinci).not.toBe('Çocuğunuzun sayfası');
  await geri.click();
  await expect(baslik).toHaveText('Çocuğunuzun sayfası');
  // Vurgulanan öğe ekranda ve açıklama kutusu görünüm alanının içinde (telefonda dışarı taşmaz).
  const kutu = await pencere.boundingBox();
  const gorunum = page.viewportSize();
  expect(kutu.x).toBeGreaterThanOrEqual(0);
  expect(kutu.x + kutu.width).toBeLessThanOrEqual(gorunum.width);

  // Klavye: ok tuşu ilerler, Esc kapatır ve bayrağı yazar.
  await page.keyboard.press('ArrowRight');
  await expect(pencere.locator('.driver-popover-progress-text')).toHaveText(/^2 \/ \d$/);
  await page.keyboard.press('Escape');
  await expect(pencere).toHaveCount(0);
  expect(await bayrak(page)).toBe('1');

  // Yeniden başlatma: Hesap bölümündeki düğme.
  await page.locator('[data-tur-baslat]').click();
  await expect(pencere).toBeVisible();
  await expect(baslik).toHaveText('Çocuğunuzun sayfası');
  // Son adıma kadar ilerle: «Tamam» turu bitirir.
  for (let i = 0; i < 10 && (await ileri.textContent()) !== 'Tamam'; i++) await ileri.click();
  await expect(ileri).toHaveText('Tamam');
  await ileri.click();
  await expect(pencere).toHaveCount(0);
  await hatasizMi(page);
  // Yoklayıcı gerçekten çalışıyor mu: satır içi stil niteliği bu CSP'de ihlal sayılmalı (sınama kendi ihlalini üretip dinleyiciyi doğrular).
  await page.evaluate(() => { const e = document.createElement('div'); e.setAttribute('style', 'color:red'); document.body.append(e); });
  await expect.poll(() => page.evaluate(() => window.__csp.join())).toContain('style-src-attr');
});

test('Bayrak yazılıysa pano yeniden kurulunca tur açılmaz', async ({ page, context }) => {
  await mektepAc(page, context, { tur: true, csp: true, ogrenci: false });
  await expect(page.locator('.driver-popover.veli-tur')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await bayrak(page)).toBe('1');
  // Aynı depolama ile pano yeniden kurulur (sayfa yenileme eşdeğeri: bayrak durur, tur açılmaz).
  await page.evaluate(() => window.MektepTest.veliPortali());
  await expect(page.locator('[data-eylem="ogrenciModu"]')).toBeVisible();
  await page.waitForTimeout(3500); // bülten bekleme süresinden uzun
  await expect(page.locator('.driver-popover')).toHaveCount(0);
});

test('Oturum tur açıkken kapanırsa kaplama kalkar, giriş ekranında tur çıkmaz ve bayrak yazılmaz; X düğmesi bayrağı yazar', async ({ page, context }) => {
  await mektepAc(page, context, { tur: true, csp: true, ogrenci: false });
  await expect(page.locator('.driver-popover.veli-tur')).toBeVisible();
  await page.evaluate(() => window.__authCb(null)); // başka sekmede çıkış / belirteç iptali
  await expect(page.locator('form[data-form="giris"]')).toBeVisible();
  await expect(page.locator('.driver-popover')).toHaveCount(0);
  await expect(page.locator('.driver-active')).toHaveCount(0);
  await page.waitForTimeout(3500);
  await expect(page.locator('.driver-popover')).toHaveCount(0);
  expect(await bayrak(page)).toBeNull();
  // X ile kapatma: yeni oturumla tur yeniden açılır, kapat düğmesi bayrağı yazar.
  await page.evaluate(() => window.__authCb({ uid: 'TEST-HOCA', email: 'veli@example.test', getIdToken: async () => 't' }));
  await expect(page.locator('.driver-popover.veli-tur')).toBeVisible();
  await page.locator('.driver-popover-close-btn').click();
  await expect(page.locator('.driver-popover')).toHaveCount(0);
  expect(await bayrak(page)).toBe('1');
});
