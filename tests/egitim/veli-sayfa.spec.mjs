/**
 * Veli portalı kabuğu (egitim.ulucamii.be/<dil>/veli/, Dilim 4 / P3): beş dilde açılır, noindex, kanonik adres/hreflang yok, dil başına manifest,
 * `veli-veri` bloğu ana sitedekiyle aynı biçimde (Apps Script veli-cuma.gs plan okur), giriş ekranı Kilim jetonlarıyla boyalı, CSP ihlali 0,
 * yatay taşma yok (320 px dahil), JavaScript kapalıyken `noscript` yedeği, iki temada erişilebilir, klavyeyle e-posta alanına ulaşılır.
 * Dış ağ kesik; Firebase sunucusuna HİÇBİR istek gitmez (gerçek hesap yok).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
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

for (const dil of DILLER) {
  test(`${dil}/veli: noindex, dil başına manifest, veli-veri biçimi, giriş ekranı, CSP 0, taşmasız, iki temada erişilebilir`, async ({ page }) => {
    const yanitlar = [];
    page.on('response', (r) => yanitlar.push([new URL(r.url()).pathname, r.status()]));
    const yanit = await page.goto(`/${dil}/veli/`);
    expect(yanit.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${dil}`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"], link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', `/portal/veli-${dil}.webmanifest`);
    const manifest = await (await page.request.get(`/portal/veli-${dil}.webmanifest`)).json();
    expect(manifest.start_url).toBe(`/${dil}/veli/`);
    expect(manifest.scope).toBe(`/${dil}/veli/`);

    // veli-veri: ana sitedeki sayfayla aynı alanlar (veli-cuma.gs `gunler` ve `donem`i okur).
    const veri = JSON.parse(await page.locator('script#veli-veri[type="application/json"]').evaluate((e) => e.textContent));
    expect(Object.keys(veri).sort()).toEqual(['dilYollari', 'donem', 'gizlilikYolu', 'gunler', 'hadisSesleri', 'kursYolu', 'materyalGunleri', 'materyalYolu']);
    expect(veri.gunler.length).toBeGreaterThan(20);
    expect(Object.keys(veri.gunler[0]).sort()).toEqual(['dersler', 'hafta', 'tarih']);
    expect(veri.dilYollari).toEqual({ tr: '/tr/veli/', fr: '/fr/veli/', en: '/en/veli/', nl: '/nl/veli/', de: '/de/veli/' });
    // Dilim 4 / P7b: kurs ve materyal sayfaları egitim'de (göreli), gizlilik sayfası ulucamii.be'de kalır.
    expect(veri.materyalYolu).toBe(`/${dil}/kurs/materyaller/`);
    expect(veri.kursYolu).toBe(`/${dil}/kurs/`);
    expect(veri.gizlilikYolu).toMatch(/^https:\/\/ulucamii\.be\/(tr|fr|en|nl|de)\//);
    expect(Object.keys(veri.hadisSesleri)).toEqual(['ar', 'tr', 'fr', 'en']);
    expect(veri.hadisSesleri.tr.length).toBeGreaterThan(0);

    // Giriş ekranı çizilir (oturum yok) ve Kilim jetonlarıyla boyanır: sayfa zemini yün krem, kart yüzü krem-beyaz.
    await expect(page.locator('#veli-portal form[data-form="giris"]')).toBeVisible();
    await expect(page.locator('main h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const boya = await page.evaluate(() => ({
      zemin: getComputedStyle(document.body).backgroundColor,
      kart: getComputedStyle(document.querySelector('.giris-kart')).backgroundColor,
      jeton: getComputedStyle(document.documentElement).getPropertyValue('--vurgu').trim(),
    }));
    expect(boya.zemin).toBe('rgb(246, 238, 223)');
    expect(boya.kart).toBe('rgb(255, 250, 240)');
    expect(boya.jeton).not.toBe('');

    for (const tema of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, tema, nodes: v.nodes.slice(0, 5).map((n) => n.target) }))).toEqual([]);
      expect(await tasmaYok(page)).toBe(true);
    }
    await page.setViewportSize({ width: 320, height: 640 });
    expect(await tasmaYok(page)).toBe(true);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    // Ağ kesikken yalnız başarısız Firebase/dış istekleri olur; kendi kökenimizden gelen hiçbir dosya 4xx/5xx vermemeli.
    expect(yanitlar.filter(([, d]) => d >= 400)).toEqual([]);
  });
}

test('tr/veli: klavyeyle (Tab) giriş formunun e-posta alanına ulaşılır', async ({ page }) => {
  await page.goto('/tr/veli/');
  await expect(page.locator('form[data-form="giris"]')).toBeVisible();
  let odak = '';
  for (let i = 0; i < 40 && odak !== 'eposta'; i++) {
    await page.keyboard.press('Tab');
    odak = await page.evaluate(() => document.activeElement?.getAttribute('name') ?? '');
  }
  expect(odak).toBe('eposta');
});

test('tr/veli: JavaScript kapalıyken noscript yedeği görünür', async ({ browser }) => {
  const baglam = await browser.newContext({ baseURL: KOK, javaScriptEnabled: false });
  const page = await baglam.newPage();
  await page.goto('/tr/veli/');
  await expect(page.locator('#veli-portal noscript')).toHaveCount(1);
  expect(await page.locator('#veli-portal').innerText()).toContain('JavaScript');
  await baglam.close();
});
