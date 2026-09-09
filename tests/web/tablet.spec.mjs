import { test, expect } from '@playwright/test';

test('Diyanet hizmetleri: tablet genişliklerinde üç dilde taşma yok', async ({ page, context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
  for (const width of [640, 768, 1024]) {
    await page.setViewportSize({ width, height: 1024 });
    for (const path of ['/tr/diyanet-hizmetleri/', '/fr/services-diyanet/', '/en/diyanet-services/']) {
      const response = await page.goto(path);
      expect(response.status(), path).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} @${width}`).toBeLessThanOrEqual(width + 1);
    }
  }
});

test('Fransızca kütüphane: dar ekranda kitap sayıları sayfayı taşırmaz', async ({ page, context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const response = await page.goto('/fr/bibliotheque-diyanet/');
    expect(response.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `kütüphane @${width}`).toBeLessThanOrEqual(width + 1);
    const counts = page.locator('.grup-adet');
    expect(await counts.count()).toBeGreaterThan(0);
  }
});

test('320 pikselde namaz ve anma sayfaları taşmaz', async ({ page, context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
  await page.setViewportSize({ width: 320, height: 844 });
  for (const path of ['/tr/namaz-vakitleri/', '/tr/rahmetle-aniyoruz/', '/fr/in-memoriam/', '/en/in-memoriam/']) {
    const response = await page.goto(path);
    expect(response.status(), path).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(321);
  }
});
