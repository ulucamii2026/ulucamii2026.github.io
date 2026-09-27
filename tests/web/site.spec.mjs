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
  nl: ['gebedstijden', 'contact', 'koranschool'],
  de: ['gebetszeiten', 'kontakt', 'koranschule'],
};

const htmlLang = { tr: 'tr', fr: 'fr-BE', en: 'en', nl: 'nl-BE', de: 'de-BE' };
/* Eğitim platformu bağlantısı (27 Eylül 2026): adres src/i18n/utils.ts → egitimBaglantisi, menü adı
   src/lib/ezber/metinler.ts → KILIM_METINLERI.baslik (platformun şimdilik tek bölümü). */
const egitimAdi = { tr: 'Ezber Kilimi', fr: 'Kilim de mémorisation', en: 'Memorisation kilim', nl: 'Memorisatiekelim', de: 'Memorier-Kelim' };
for (const lang of ['tr', 'fr', 'en', 'nl', 'de']) {
  test(`${lang}: ana sayfa, tema, gezinme ve taşma`, async ({ page, isMobile }, info) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`/${lang}/`);
    expect(response.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang[lang]);
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
    for (const target of ['tr', 'fr', 'en', 'nl', 'de']) {
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
      await expect(page.locator('html')).toHaveAttribute('lang', htmlLang[lang]);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      // Ortak WhatsApp bağlantısı telefon NUMARASINI görünür metne ya da başlık ipucuna taşımaz (kalıcı kural); numara yalnız
      // wa.me hedefindedir. Görünen etiket WhatsApp kullanıcı adıdır (7 Eylül 2026 kararı) — beş dilde aynı bileşen.
      const whatsapp = page.locator('a.wa-bag');
      expect(await whatsapp.count()).toBeGreaterThan(0);
      for (const link of await whatsapp.all()) {
        expect(await link.innerText()).not.toMatch(/\d{6,}|\+\s?\d{2}/);
        expect((await link.getAttribute('title')) ?? '').not.toMatch(/\d{6,}|\+\s?\d{2}/);
        await expect(link).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+$/);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), slug).toBe(true);
    }
  });

  test(`${lang}: egitim.ulucamii.be bağlantısı (menü, altbilgi, Kur'an kursu)`, async ({ page, isMobile }) => {
    const hedef = `https://egitim.ulucamii.be/${lang}/`;
    await page.goto(`/${lang}/`);
    // «Eğitim» grubu (üçüncü açılır liste; mobilde menü düğmesi): ad sayfa dilinde, ↗ ekran okuyucuya alan adı olarak.
    if (isMobile) await page.locator('#menu-dugme').click();
    else await page.locator('button[aria-controls="grup-2"]').click();
    const madde = page.locator(`${isMobile ? '#mobil-menu' : '#grup-2'} a[href="${hedef}"]`);
    await expect(madde).toBeVisible();
    await expect(madde).toHaveAccessibleName(`${egitimAdi[lang]} (egitim.ulucamii.be)`);
    await expect(page.locator(`footer a[href="${hedef}"]`)).toHaveText(/^egitim\.ulucamii\.be/);
    // Kur'an kursu sayfasının yan sütununda kart: başlık platformla aynı, düğme alan adını gösterir.
    await page.goto(`/${lang}/${pages[lang][2]}/`);
    const kart = page.locator(`main a[href="${hedef}"]`);
    await expect(kart).toHaveCount(1);
    await expect(kart).toBeVisible();
    await expect(page.locator('main aside')).toContainText(egitimAdi[lang]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
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
