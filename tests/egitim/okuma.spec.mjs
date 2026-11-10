// Kur'an Okuma (10 Kasım 2026): ana sayfa, adım sayfası, ders oturumu (işaretle → yenile → ilerleme kalır), CSP ve iki tema.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => new URL(r.request().url()).origin === KOK ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    HTMLMediaElement.prototype.play = function () { window.__ses = this.src; return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });
});

for (const dil of DILLER) {
  test(`${dil}: okuma ana sayfası ve adım sayfası, CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.goto(`/${dil}/okuma/`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator(`a[href="/${dil}/okuma/o1/"]`).first()).toBeVisible();
    await page.goto(`/${dil}/okuma/o1/`);
    await expect(page.locator('[lang="ar"]').first()).toBeVisible();
    expect(await page.locator('[lang="ar"]').first().getAttribute('dir')).toBe('rtl');
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('tr: ders oturumu — dinle, işaretle, yenile, ilerleme kalır', async ({ page }) => {
  await page.goto('/tr/okuma/bugun/?ders=o1-d1');
  const kart = page.locator('[data-kart]');
  await expect(kart).toBeVisible();
  await expect(page.locator('[data-ar]')).not.toBeEmpty();
  await page.locator('[data-dinle]').click();
  expect(await page.evaluate(() => window.__ses)).toContain('/media/ses/');
  await page.locator('[data-sonuc="tam"]').click();
  const sayac = await page.locator('[data-sayac]').textContent();
  await page.goto('/tr/okuma/o1/');
  const ilk = page.locator('[data-okuma-aralik] [data-okuma-sayi]').first();
  await expect(ilk).not.toHaveText('');
  const metin = await ilk.textContent();
  await page.reload();
  await expect(page.locator('[data-okuma-aralik] [data-okuma-sayi]').first()).toHaveText(metin);
  expect(sayac).toBeTruthy();
});
