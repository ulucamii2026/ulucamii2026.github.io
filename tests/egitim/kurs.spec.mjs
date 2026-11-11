/**
 * Kur'an kursu sayfaları (egitim.ulucamii.be/<dil>/kurs/…, Dilim 4 / P5): beş dilde açılır, ana sitedeki sayfayla aynı bloklar, Kilim görünümü, CSP ihlali 0,
 * konsol hatası 0, yatay taşma yok (320 px dahil), iki temada erişilebilir (axe), klavyeyle gezilir, çapalar çalışır.
 * Dış ağ kesik: ses/indirme adresleri ulucamii.be'dedir, bu testler yalnız egitim kökenine gider.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const KOK = 'http://127.0.0.1:4402';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SAYFALAR = ['', 'mufredat/', 'yillik-plan/', 'materyaller/', 'gunluk/'];
// axe: her dilde her sayfa pahalı; tr+fr tam, diğer dillerde kurs ana sayfası ve materyaller.
const AXE = (dil, s) => dil === 'tr' || dil === 'fr' || s === '' || s === 'materyaller/';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
});

const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const dil of DILLER) {
  for (const s of SAYFALAR) {
    test(`${dil}/kurs/${s}: dizine açık, kanonik egitim + hreflang, bloklar, CSP 0, konsol 0, taşmasız${AXE(dil, s) ? ', iki temada axe' : ''}`, async ({ page }) => {
      const hatalar = [];
      page.on('pageerror', (e) => hatalar.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) hatalar.push(m.text()); });
      const yanitlar = [];
      page.on('response', (r) => yanitlar.push([new URL(r.url()).pathname, r.status()]));
      const yanit = await page.goto(`/${dil}/kurs/${s}`);
      expect(yanit.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${dil}`));
      await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^https://egitim\\.ulucamii\\.be/${dil}/kurs/[a-z-/]*$`));
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(6);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main h2').first()).toBeAttached();
      // Dil değiştirici aynı sayfanın diğer dilindeki karşılığına gider
      const diger = dil === 'tr' ? 'fr' : 'tr';
      await expect(page.locator(`.diller a[hreflang="${diger}"]`)).toHaveAttribute('href', `/${diger}/kurs/${s}`);
      await page.evaluate(() => document.fonts.ready);
      // Kilim zemini ve jetonlar (uyum katmanı)
      const boya = await page.evaluate(() => ({ zemin: getComputedStyle(document.body).backgroundColor, vurgu: getComputedStyle(document.documentElement).getPropertyValue('--vurgu').trim() }));
      expect(boya.zemin).toBe('rgb(246, 238, 223)');
      expect(boya.vurgu).not.toBe('');

      if (s === 'materyaller/') await expect(page.locator('[data-materyal]')).toBeVisible();
      if (s === 'mufredat/') {
        // Ders dağılımı çubuğu: parçalar CSSOM ile ölçeklenir (satır içi stil yok) ve eşit değil
        const g = await page.locator('.cubuk .seg').evaluateAll((l) => l.map((e) => getComputedStyle(e).flexGrow));
        expect(g.length).toBe(5);
        expect(new Set(g).size).toBeGreaterThan(1);
      }
      if (s === 'gunluk/') {
        const w = await page.locator('.ilerleme-dolgu').evaluate((e) => e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width);
        expect(w).toBeGreaterThan(0.01);
        expect(w).toBeLessThan(1);
      }

      for (const [genislik, yukseklik] of [[1280, 900], [320, 700]]) {
        await page.setViewportSize({ width: genislik, height: yukseklik });
        expect(await tasmaYok(page), `${genislik} px yatay taşma`).toBe(true);
      }
      if (AXE(dil, s)) {
        for (const tema of ['light', 'dark']) {
          await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
          const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
          expect(sonuc.violations.map((v) => ({ id: v.id, tema, nodes: v.nodes.slice(0, 4).map((n) => n.target) }))).toEqual([]);
        }
      }
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
      expect(hatalar).toEqual([]);
      // Kendi kökenimizden gelen hiçbir dosya 4xx/5xx vermemeli (ulucamii.be adresleri bu testte kesiktir)
      expect(yanitlar.filter(([, d]) => d >= 400)).toEqual([]);
    });
  }
}

test('ders kitapları çapaları çalışır (tr #ders-kitaplari; fr #manuels) ve müfredattaki bağlantı kurs sayfasındaki çapaya gider', async ({ page }) => {
  await page.goto('/tr/kurs/#ders-kitaplari');
  await expect(page.locator('#ders-kitaplari')).toBeAttached();
  expect(await page.locator('#ders-kitaplari').evaluate((e) => e.getBoundingClientRect().top)).toBeLessThan(700);
  await page.goto('/fr/kurs/mufredat/');
  await expect(page.locator('a[href="/fr/kurs/#manuels"]').first()).toBeAttached();
  await page.goto('/fr/kurs/#manuels');
  await expect(page.locator('#manuels')).toBeAttached();
  expect(await page.locator('#manuels').evaluate((e) => e.getBoundingClientRect().top)).toBeLessThan(700);
});

test('kurs sayfaları arası gezinti egitim içinde kalır', async ({ page }) => {
  await page.goto('/tr/kurs/');
  for (const hedef of ['mufredat', 'yillik-plan', 'materyaller', 'gunluk']) await expect(page.locator(`main a[href="/tr/kurs/${hedef}/"]`).first()).toBeVisible();
  await page.locator('main a[href="/tr/kurs/mufredat/"]').first().click();
  await expect(page).toHaveURL(`${KOK}/tr/kurs/mufredat/`);
  await expect(page.locator('main h1')).toBeVisible();
});

test('klavyeyle (Tab) içerik bağlantılarına ulaşılır ve odak halkası görünür', async ({ page }) => {
  await page.goto('/tr/kurs/');
  let odak = '';
  for (let i = 0; i < 60 && !odak.startsWith('/tr/kurs/'); i++) {
    await page.keyboard.press('Tab');
    odak = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? '');
  }
  expect(odak).toMatch(/^\/tr\/kurs\//);
  const halka = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });
  expect(halka).toBe(true);
});
