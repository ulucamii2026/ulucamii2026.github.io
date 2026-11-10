/**
 * Kur'an Okuma kısa satırı (10 Kasım 2026): Kilimim sayfasında ve giriş yapmış ana sayfada okuma ilerlemesi ve «bugün tekrar» sayısı görünür.
 * Kayıt yokken satır gizli kalır; sayfa depoya yazmaz; iki temada erişilebilirlik; konsol/CSP hatası yok.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const KOK = 'http://127.0.0.1:4402';
const OZET = 'b'.repeat(32);
const ANAHTAR = 'ulucamii:okuma:cihaz:v1';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
});

/** o1 adımında iki madde: 0 → 5 gün önce kutu 0 (vadesi geldi), 1 → bugün kutu 1 (vadesi gelmedi). */
const tohumla = (context, { oturum }) => context.addInitScript(([ozet, anahtar, oturumlu]) => {
  const n = (g) => Math.floor((Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - Date.UTC(2026, 8, 1)) / 864e5) - g;
  const kod = (g) => n(g).toString(36).padStart(2, '0');
  const il = { v: 1, maddeler: { o1: `1${kod(5)}2${kod(0)}` } };
  if (oturumlu) {
    localStorage.setItem('ilimYolu:oturum', ozet);
    localStorage.setItem(`${anahtar}:u:${ozet}`, JSON.stringify(il));
  } else localStorage.setItem(anahtar, JSON.stringify(il));
}, [OZET, ANAHTAR, oturum]);

test('kilimim: kayıt yokken okuma satırı gizli', async ({ page }) => {
  await page.goto('/tr/kilimim/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-okuma-satir]')).toBeHidden();
});

for (const dil of ['tr', 'fr']) {
  test(`${dil} kilimim: okuma satırı ilerleme ve bugün tekrar sayısını söyler, bağlantı çalışma ekranına gider`, async ({ page, context }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
    await tohumla(context, { oturum: false });
    await page.goto(`/${dil}/kilimim/`);
    const satir = page.locator('[data-okuma-satir]');
    await expect(satir).toBeVisible();
    await expect(satir.locator('[data-satir-ilerleme]')).toContainText(/^2\s?(\/|sur)\s?\d+/);
    await expect(satir.locator('[data-satir-tekrar]')).toContainText(/^1\s/);
    await expect(satir.locator('[data-satir-tekrar]')).toHaveAttribute('data-var', '1');
    await expect(satir.getByRole('link')).toHaveAttribute('href', `/${dil}/okuma/bugun/`);
    // Yalnız okur: depoya yeni anahtar yazılmaz.
    expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual(expect.arrayContaining(['ulucamii:okuma:cihaz:v1']));
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const sonuc = await new AxeBuilder({ page }).include('[data-okuma-satir]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => v.id)).toEqual([]);
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('ana sayfa (girişli görünüm): okuma satırı bugün tekrar kartında görünür', async ({ page, context }) => {
  await tohumla(context, { oturum: true });
  await page.goto('/tr/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.documentElement.setAttribute('data-oturum', '1'));
  const satir = page.locator('.iy-tekrar-kart [data-okuma-satir]');
  await expect(satir).toBeVisible();
  await expect(satir.locator('[data-satir-tekrar]')).toContainText('1 madde bugün tekrar bekliyor');
  await expect(satir.getByRole('link')).toHaveAttribute('href', '/tr/okuma/bugun/');
});
