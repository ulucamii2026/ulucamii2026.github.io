/**
 * Hoca ekranı kabuğu (egitim.ulucamii.be/hoca/, Dilim 4 / P4): açılır, noindex, kanonik adres yok, `hoca-veri` biçimi, giriş ekranı Kilim jetonlarıyla,
 * CSP ihlali 0, taşmasız (320 px dahil), `noscript` yedeği, iki temada erişilebilir. Dış ağ kesik; gerçek hesap yok.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const KOK = 'http://127.0.0.1:4402';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
});

const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('/hoca/: noindex, hoca-veri biçimi, giriş ekranı, CSP 0, taşmasız, iki temada erişilebilir', async ({ page }) => {
  const yanitlar = [];
  page.on('response', (r) => yanitlar.push([new URL(r.url()).pathname, r.status()]));
  const yanit = await page.goto('/hoca/');
  expect(yanit.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', /^tr/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('link[rel="canonical"], link[rel="alternate"][hreflang]')).toHaveCount(0);

  const veri = JSON.parse(await page.locator('script#hoca-veri[type="application/json"]').evaluate((e) => e.textContent));
  expect(Object.keys(veri).sort()).toEqual(['ceviriUcu', 'donem', 'gunler', 'materyalGunleri', 'materyalYolu', 'veliYollari']);
  expect(veri.ceviriUcu).toMatch(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/);
  expect(veri.veliYollari).toEqual({ tr: '/tr/veli/', fr: '/fr/veli/', en: '/en/veli/', nl: '/nl/veli/', de: '/de/veli/' });
  expect(veri.materyalYolu).toMatch(/^https:\/\/ulucamii\.be\//);
  expect(veri.gunler.length).toBeGreaterThan(20);

  await expect(page.locator('#hoca-ekrani form[data-form="giris"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(246, 238, 223)');

  for (const tema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
    const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(sonuc.violations.map((v) => ({ id: v.id, tema, nodes: v.nodes.slice(0, 5).map((n) => n.target) }))).toEqual([]);
    expect(await tasmaYok(page)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await tasmaYok(page)).toBe(true);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  expect(yanitlar.filter(([, d]) => d >= 400)).toEqual([]);
});

test('/hoca/: JavaScript kapalıyken noscript yedeği görünür', async ({ browser }) => {
  const baglam = await browser.newContext({ baseURL: KOK, javaScriptEnabled: false });
  const page = await baglam.newPage();
  await page.goto('/hoca/');
  expect(await page.locator('#hoca-ekrani').innerText()).toContain('JavaScript');
  await baglam.close();
});
