import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
});

for (const lang of ['tr', 'fr', 'en']) {
  test(`${lang}: ana sayfa tam genişlik vitrin ve alt namaz paneli yerleşimi`, async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);

      // Sayfa yatayda taşmamalı
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `@${width}`).toBeLessThanOrEqual(width + 1);

      // Yeni tam genişlik vitrin kapsayıcısı (carousel rolü .gv-kapsayici kökte)
      const vitrin = page.locator('.gv-kapsayici');
      await expect(vitrin).toBeVisible();
      await expect(vitrin).toHaveAttribute('role', 'region');
      await expect(vitrin).toHaveAttribute('aria-roledescription', 'carousel');
      const vitrinBox = await vitrin.boundingBox();
      expect(vitrinBox).not.toBeNull();
      expect(vitrinBox.width).toBeGreaterThanOrEqual(Math.min(width - 32, 280));

      // Vitrinin hemen altındaki namaz vakitleri paneli
      const prayer = page.locator('.ana-vakit-yatay');
      await expect(prayer).toBeVisible();
      const prayerBox = await prayer.boundingBox();
      expect(prayerBox).not.toBeNull();
      expect(prayerBox.width).toBeGreaterThan(240);

      // Düzen kuralı: Namaz paneli daima vitrinin ALTINDA yer alır
      expect(prayerBox.y).toBeGreaterThanOrEqual(vitrinBox.y + vitrinBox.height - 2);

      // Yatay sınır kontrolleri (taşma yok)
      expect(vitrinBox.x).toBeGreaterThanOrEqual(-1);
      expect(vitrinBox.x + vitrinBox.width).toBeLessThanOrEqual(width + 2);
      expect(prayerBox.x).toBeGreaterThanOrEqual(-1);
      expect(prayerBox.x + prayerBox.width).toBeLessThanOrEqual(width + 2);

      // Hızlı işlem linkleri dokunma hedefi (min 44px) ve doğru dil öneki
      for (const link of await page.locator('.ana-hizli a').all()) {
        const box = await link.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(await link.getAttribute('href')).toMatch(new RegExp(`^/${lang}/`));
      }
    }
  });
}

test('Yayın seçimi klavyeyle çalışır; hareket tercihi korunur', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/tr/');

  const playPause = page.locator('#gv-play-pause');
  await expect(playPause).toBeVisible();
  const oynatLabel = await playPause.getAttribute('data-oynat');
  const durdurLabel = await playPause.getAttribute('data-durdur');

  // Başlangıçta oynuyor: aria-pressed YOK, dinamik aria-label durdur
  await expect(playPause).not.toHaveAttribute('aria-pressed');
  await expect(playPause).toHaveAttribute('aria-label', durdurLabel);
  await expect(playPause.locator('.gv-icon-pause')).toBeVisible();
  await expect(playPause.locator('.gv-icon-play')).toBeHidden();

  // Klavye odağı pause düğmesine gelince OTOMATİK DURUR: aria-label oynat olur
  await playPause.focus();
  await expect(playPause).not.toHaveAttribute('aria-pressed');
  await expect(playPause).toHaveAttribute('aria-label', oynatLabel);
  await expect(playPause.locator('.gv-icon-play')).toBeVisible();
  await expect(playPause.locator('.gv-icon-pause')).toBeHidden();

  // Enter ile açıkça oynatılır (explicit play): aria-label durdur olur
  await playPause.press('Enter');
  await expect(playPause).not.toHaveAttribute('aria-pressed');
  await expect(playPause).toHaveAttribute('aria-label', durdurLabel);
  await expect(playPause.locator('.gv-icon-pause')).toBeVisible();
  await expect(playPause.locator('.gv-icon-play')).toBeHidden();

  // İkinci Enter ile kullanıcı açıkça durdurur: aria-label oynat olur ve localStorage durdu
  await playPause.press('Enter');
  await expect(playPause).not.toHaveAttribute('aria-pressed');
  await expect(playPause).toHaveAttribute('aria-label', oynatLabel);
  await expect(playPause.locator('.gv-icon-play')).toBeVisible();
  await expect(playPause.locator('.gv-icon-pause')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('uluCamiiHareket'))).toBe('durdu');

  const thumbs = page.locator('.gv-thumb');
  if (await thumbs.count() > 1) {
    const thumbTarget = page.locator('.gv-thumb[data-index="1"]');
    await thumbTarget.focus();
    await thumbTarget.press('Enter');

    const slideTarget = page.locator('.gv-sahne__slide[data-index="1"]');
    await expect(slideTarget).toHaveAttribute('aria-hidden', 'false');
    await expect(slideTarget).not.toHaveAttribute('inert');
    // Aktif thumb aria-current="true", aria-selected YOK
    await expect(thumbTarget).toHaveAttribute('aria-current', 'true');
    await expect(thumbTarget).not.toHaveAttribute('aria-selected');
    // Pasif thumb aria-current YOK, aria-selected YOK
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-current');
    await expect(page.locator('.gv-thumb[data-index="0"]')).not.toHaveAttribute('aria-selected');
  }

  // Yeniden yüklendiğinde durdurulmuş tercih korunur
  await page.reload();
  const reloadedPlayPause = page.locator('#gv-play-pause');
  await expect(reloadedPlayPause).not.toHaveAttribute('aria-pressed');
  await expect(reloadedPlayPause).toHaveAttribute('aria-label', oynatLabel);
  await expect(reloadedPlayPause.locator('.gv-icon-play')).toBeVisible();
  await expect(reloadedPlayPause.locator('.gv-icon-pause')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('uluCamiiHareket'))).toBe('durdu');

  // reduced-motion ortamında da durma durumu ve dinamik label korunur
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.gv-kapsayici')).toBeVisible();
  await expect(reloadedPlayPause).not.toHaveAttribute('aria-pressed');
  await expect(reloadedPlayPause).toHaveAttribute('aria-label', oynatLabel);
  await expect(reloadedPlayPause.locator('.gv-icon-play')).toBeVisible();
  await expect(reloadedPlayPause.locator('.gv-icon-pause')).toBeHidden();
});
