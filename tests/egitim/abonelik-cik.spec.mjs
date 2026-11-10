/**
 * Haftalık e-postadan çıkış onayı (/<dil>/abonelik-cik/, 10 Kasım 2026). API sahte (page.route): gerçek işleve istek gitmez. Neden bu testler:
 * belirteç adreste kalmamalı (yer imi/geçmiş), durum yalnız düğmeyle POST edilmeli (GET yok), başarı / geçersiz / ağ hatası üç ayrı durum olmalı,
 * belirteçsiz açılış açıklama göstermeli; sayfa noindex, taşmasız, CSP ihlalsiz ve iki temada erişilebilir olmalı.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const BELIRTEC = 'v1.sahte-uid.1760000000.imza_abc-123';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
});

const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

/** API'yi sahteler; gelen istekleri döner. */
async function apiSahte(page, davran) {
  const istekler = [];
  await page.route('**/api/abonelik-cik*', async (r) => {
    istekler.push({ yontem: r.request().method(), adres: r.request().url() });
    await davran(r);
  });
  return istekler;
}

for (const dil of DILLER) {
  test(`${dil}: belirteç adresten silinir; başarı durumu; yalnız POST gider; noindex, CSP ihlalsiz, iki temada erişilebilir`, async ({ page }) => {
    const istekler = await apiSahte(page, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>tamam</p>' }));
    await page.setViewportSize({ width: 320, height: 700 }); // en dar telefon
    await page.goto(`/${dil}/abonelik-cik/#${BELIRTEC}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"], link[rel="alternate"][hreflang]')).toHaveCount(0);
    const dugme = page.locator('[data-dugme]');
    await expect(dugme).toBeVisible();
    expect(new URL(page.url()).hash).toBe(''); // belirteç adres çubuğundan silindi
    expect(istekler).toEqual([]); // açılışta (GET dâhil) hiçbir istek gitmedi
    await page.evaluate(() => document.fonts.ready);
    for (const tema of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, tema, nodes: v.nodes.slice(0, 5).map((n) => n.target) }))).toEqual([]);
      expect(await tasmaYok(page)).toBe(true);
    }
    // Klavyeyle: düğmeye Tab ile gelinir, Enter ile basılır.
    await dugme.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-tamam]')).toBeVisible();
    await expect(page.locator('[data-onay]')).toBeHidden();
    await expect(page.locator('[data-hesap] a')).toHaveAttribute('href', `/${dil}/hesap/`);
    expect(istekler).toHaveLength(1);
    expect(istekler[0].yontem).toBe('POST');
    expect(new URL(istekler[0].adres).searchParams.get('k')).toBe(BELIRTEC);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('geçersiz/süresi dolmuş (400): geçersiz durumu, hesap bağlantısı', async ({ page }) => {
  await apiSahte(page, (r) => r.fulfill({ status: 400, contentType: 'text/html', body: 'x' }));
  await page.goto(`/tr/abonelik-cik/#${BELIRTEC}`);
  await page.locator('[data-dugme]').click();
  await expect(page.locator('[data-gecersiz]')).toBeVisible();
  await expect(page.locator('[data-tamam]')).toBeHidden();
  await expect(page.locator('h1')).toHaveText('Bağlantı geçersiz');
  await expect(page.locator('[data-hesap] a')).toHaveAttribute('href', '/tr/hesap/');
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});

test('çevrim dışı / sunucu hatası: hata yazısı, düğme yeniden basılabilir, sonra başarı', async ({ page }) => {
  let say = 0;
  const istekler = await apiSahte(page, (r) => {
    say++;
    if (say === 1) return r.abort('internetdisconnected');
    if (say === 2) return r.fulfill({ status: 503, body: 'x' });
    return r.fulfill({ status: 200, body: 'tamam' });
  });
  await page.goto(`/fr/abonelik-cik/#${BELIRTEC}`);
  const dugme = page.locator('[data-dugme]');
  await dugme.click();
  await expect(page.locator('[data-durum]')).toContainText('Connexion impossible');
  await expect(dugme).toBeEnabled();
  await dugme.click();
  await expect(page.locator('[data-durum]')).toContainText('Connexion impossible');
  await expect(page.locator('[data-tamam]')).toBeHidden();
  await dugme.click();
  await expect(page.locator('[data-tamam]')).toBeVisible();
  expect(istekler.map((i) => i.yontem)).toEqual(['POST', 'POST', 'POST']);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});

test('belirteç yok: açıklama + hesap ayarları bağlantısı, düğme yok, istek yok', async ({ page }) => {
  const istekler = await apiSahte(page, (r) => r.fulfill({ status: 200, body: 'x' }));
  await page.goto('/de/abonelik-cik/');
  await expect(page.locator('[data-tokensiz]')).toBeVisible();
  await expect(page.locator('[data-onay]')).toBeHidden();
  await expect(page.locator('[data-hesap] a')).toHaveAttribute('href', '/de/hesap/');
  expect(await tasmaYok(page)).toBe(true);
  expect(istekler).toEqual([]);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});
