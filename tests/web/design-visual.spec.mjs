import { test, expect } from '@playwright/test';

// Görsel regresyonlar dış ağdan etkilenmesin; proje test sunucusu dışındaki her
// isteği kesiyoruz. Baseline dosyaları bu test dosyasının yanında tutulur.
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
});

const surfaces = [
  { name: 'ana-sayfa', paths: { tr: '/tr/', fr: '/fr/', en: '/en/' } },
  { name: 'ihtida', paths: { tr: '/tr/ihtida/', fr: '/fr/conversion-a-l-islam/', en: '/en/becoming-muslim/' } },
];

for (const surface of surfaces) {
  for (const [lang, path] of Object.entries(surface.paths)) {
    for (const theme of ['light', 'dark']) {
      test(`${surface.name}/${lang}/${theme}: ilk görünüm baseline`, async ({ page }) => {
        await page.addInitScript(({ theme: selectedTheme }) => {
          localStorage.setItem('tema', selectedTheme);
        }, { theme });
        await page.goto(path);
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.evaluate(async () => {
          await document.fonts.ready;
          const images = [...document.images];
          await Promise.all(images.map(async image => {
            if (image.complete && image.decode) {
              try { await image.decode(); } catch { /* bozuk medya mevcut testte ayrıca raporlanır */ }
            }
          }));
        });
        await expect(page).toHaveScreenshot(`${surface.name}-${lang}-${theme}.png`, {
          animations: 'disabled',
          caret: 'hide',
          fullPage: false,
          scale: 'css',
          maxDiffPixels: 1200,
        });
      });
    }
  }
}
