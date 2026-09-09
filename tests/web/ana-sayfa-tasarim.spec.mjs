import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
});

for (const lang of ['tr', 'fr', 'en']) {
  test(`${lang}: ana sayfanın dar ekran ve tablet yerleşimi`, async ({ page }) => {
    for (const width of [320, 768, 1024]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `@${width}`).toBeLessThanOrEqual(width + 1);
      const hero = await page.locator('.ana-hero').boundingBox();
      const prayer = await page.locator('.ana-vakit').boundingBox();
      expect(prayer.width).toBeGreaterThan(240);
      if (width >= 768) {
        expect(Math.abs(hero.y - prayer.y)).toBeLessThan(2);
        expect(hero.x + hero.width).toBeLessThan(prayer.x);
      } else {
        expect(prayer.y).toBeGreaterThanOrEqual(hero.y + hero.height);
      }
      for (const link of await page.locator('.ana-hizli a').all()) {
        const box = await link.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(await link.getAttribute('href')).toMatch(new RegExp(`^/${lang}/`));
      }
    }
  });
}

test('Fotoğraf seçimi klavyeyle çalışır; hareket tercihi korunur', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');
  const pause = page.locator('#hero-duraklat');
  await pause.press('Enter');
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-nokta="2"]').press('Enter');
  await expect(page.locator('[data-slayt="2"]')).toHaveClass(/aktif/);
  expect(await page.locator('[data-slayt="2"]').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.reload();
  await expect(page.locator('#hero-duraklat')).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.locator('.hero-kare.aktif').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
