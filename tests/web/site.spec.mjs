import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ context }) => {
  // Canlı Firebase/GAS/analitik ve yönlendirmeler dahil dış HTTP isteklerini kes.
  await context.route('**/*', route => {
    return new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
      ? route.continue() : route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, socket => socket.close());
});

const pages = {
  tr: ['namaz-vakitleri', 'iletisim', 'kuran-kursu'],
  fr: ['horaires-de-priere', 'contact', 'ecole-coranique'],
  en: ['prayer-times', 'contact', 'quran-school'],
};

for (const lang of ['tr', 'fr', 'en']) {
  test(`${lang}: ana sayfa, tema, gezinme ve taşma`, async ({ page, isMobile }, info) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`/${lang}/`);
    expect(response.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang === 'fr' ? 'fr-BE' : lang);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    const checkWidth = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    };
    await checkWidth();
    await page.locator('#tema-dugme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await checkWidth();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#tema-dugme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    if (isMobile) {
      await page.locator('#menu-dugme').click();
      await expect(page.locator('#mobil-menu')).toBeVisible();
      await expect(page.locator('#menu-dugme')).toHaveAttribute('aria-expanded', 'true');
      await page.locator('#menu-dugme').click();
      await expect(page.locator('#mobil-menu')).toBeHidden();
    }
    await page.locator('[aria-controls="dil-menu"]').click();
    await expect(page.locator('#dil-menu')).toBeVisible();
    for (const target of ['tr', 'fr', 'en']) {
      await expect(page.locator(`#dil-menu a[hreflang="${target}"]`)).toHaveAttribute('href', `/${target}/`);
    }
    await page.keyboard.press('Escape');
    await page.screenshot({ path: info.outputPath(`${lang}-anasayfa.png`), fullPage: false });
    expect(errors).toEqual([]);
  });

  test(`${lang}: temel sayfalar ve yerel bağlantılar`, async ({ page }) => {
    for (const slug of pages[lang]) {
      const response = await page.goto(`/${lang}/${slug}/`);
      expect(response.status(), slug).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang === 'fr' ? 'fr-BE' : lang);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), slug).toBe(true);
    }
  });

  test(`${lang}: ana sayfa ciddi erişilebilirlik ihlali`, async ({ page }, info) => {
    await page.goto(`/${lang}/`);
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.locator('#tema-dugme').click();
      // Tema değişimindeki görünür renk geçişlerinin bitmesini bekle. Kapalı
      // details içindeki veya tarayıcının değiştirdiği Animation.finished
      // nesnelerine bağlanmak, görünüm tamamlandığı hâlde testi kilitleyebilir.
      await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation => {
        const target = animation.effect?.target;
        return animation instanceof CSSTransition && animation.playState === 'running'
          && target instanceof Element && target.getClientRects().length > 0;
      }).length)).toBe(0);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      await info.attach(`axe-${theme}`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
      const severe = result.violations.filter(v => ['serious', 'critical'].includes(v.impact));
      expect.soft(severe.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), `${lang} / ${theme}`).toEqual([]);
    }
  });
}
