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

// o8 (tecvid uygulamaları) ve o9 (kısa âyetler): sesler egitim Hosting'inden (aynı köken) çalar, eski adımlar ulucamii.be'den; Arapça RTL, iki temada erişilebilir.
for (const dil of ['tr', 'fr']) {
  for (const adim of ['o8', 'o9']) {
    test(`${dil}: ${adim} adımı — ilk ses aynı kökenden (200/206), Arapça RTL, iki temada erişilebilir, CSP temiz`, async ({ page }) => {
      const hatalar = [];
      page.on('pageerror', (e) => hatalar.push(e.message));
      await page.goto(`/${dil}/okuma/${adim}/`);
      const ilk = page.locator('.ok-oge').first();
      await expect(ilk.locator('[lang="ar"]')).toBeVisible();
      expect(await ilk.locator('[lang="ar"]').getAttribute('dir')).toBe('rtl');
      await ilk.locator('button.dinle').click();
      const adres = await page.evaluate(() => window.__ses);
      expect(adres).toContain(`${KOK}/media/ses/okuma/yeni/`);
      const yanit = await page.request.get(adres, { headers: { Range: 'bytes=0-1023' } });
      expect([200, 206]).toContain(yanit.status());
      expect(yanit.headers()['content-type']).toMatch(/audio|mpeg|octet/);
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
}

test('tr: eski adım (o1) sesi hâlâ ulucamii.be\'den, yeni ders oturumu (o8) aynı kökenden çalar', async ({ page }) => {
  await page.goto('/tr/okuma/o1/');
  await page.locator('.ok-oge button.dinle').first().click();
  expect(await page.evaluate(() => window.__ses)).toContain('https://ulucamii.be/media/ses/');
  await page.goto('/tr/okuma/bugun/?ders=o8-d1');
  await expect(page.locator('[data-kart]')).toBeVisible();
  await page.locator('[data-dinle]').click();
  expect(await page.evaluate(() => window.__ses)).toContain(`${KOK}/media/ses/okuma/yeni/`);
});
