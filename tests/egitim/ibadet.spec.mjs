// Abdest ve Namaz (10 Kasım 2026): ana sayfa, abdest, namaz, vakit sayfası, sıralama ve eşleştirme klavyeyle, CSP ve iki tema.
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
  });
});

for (const dil of DILLER) {
  test(`${dil}: ibadet sayfaları, CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    for (const yol of ['', 'abdest/', 'namaz/', 'namaz/sabah/']) {
      await page.goto(`/${dil}/ibadet/${yol}`);
      await expect(page.locator('h1')).toBeVisible();
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
      }
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('tr: abdest — sıralama ve eşleştirme yalnız klavyeyle tamamlanır, ilerleme yenilemede kalır', async ({ page, request }) => {
  // Doğru sıra, betik karıştırmadan önceki sunucu HTML'indedir.
  const html = await (await request.get('/tr/ibadet/abdest/')).text();
  const sirala = html.slice(html.indexOf('data-ib-sirala'));
  const dogru = [...sirala.slice(0, sirala.indexOf('</ol>')).matchAll(/data-ad="([^"]*)"/g)].map((x) => x[1]);
  expect(dogru.length).toBeGreaterThan(2);
  await page.goto('/tr/ibadet/abdest/');
  const kok = page.locator('[data-ib-sirala]').first();
  const adlar = () => kok.locator('[data-liste] > li').evaluateAll((l) => l.map((x) => x.dataset.ad));
  for (let hedef = 0; hedef < dogru.length; hedef++) {
    let simdi = (await adlar()).indexOf(dogru[hedef]);
    while (simdi > hedef) {
      await kok.locator('[data-liste] > li').nth(simdi).locator('[data-yukari]').focus();
      await page.keyboard.press('Enter');
      simdi--;
    }
  }
  expect(await adlar()).toEqual(dogru);
  await kok.locator('[data-kontrol]').focus();
  await page.keyboard.press('Enter');
  await expect(kok.locator('[data-tamam]')).toBeVisible();

  const es = page.locator('[data-ib-esles]').first();
  await expect(es).toHaveAttribute('data-hazir', '');
  const n = await es.locator('[data-sol] > li:not([hidden])').count();
  for (let k = 0; k < n; k++) {
    const g = await es.locator('[data-sol] > li:not([hidden])').nth(k).getAttribute('data-i');
    await es.locator(`[data-sol] > li[data-i="${g}"] [data-sol-oge]`).focus();
    await page.keyboard.press('Enter');
    await es.locator(`[data-sag] > li[data-i="${g}"] [data-sag-oge]`).focus();
    await page.keyboard.press('Enter');
  }
  await es.locator('[data-kontrol]').focus();
  await page.keyboard.press('Enter');
  await expect(es.locator('[data-tamam]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-ib-sirala] [data-tamam]').first()).toBeVisible();
  await expect(page.locator('[data-ib-esles] [data-tamam]').first()).toBeVisible();
});
