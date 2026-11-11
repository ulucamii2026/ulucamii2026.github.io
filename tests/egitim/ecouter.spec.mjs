/**
 * Sesli dersler (egitim.ulucamii.be/e/, /e/<kod>/, Dilim 4 / P6): sayfa Fransızca açılır, noindex, kanonik ulucamii.be/e/<kod>/, CSP ihlali 0, taşmasız,
 * iki temada erişilebilir. Sesler ulucamii.be'den gelir: ağ kesik olduğundan o adres yerel dosyayla karşılanır (gerçek ses çözücüsü, `Audio`
 * örnekleri gözlenir) — `currentTime` ilerler, istek ulucamii.be/media/ses/… adresine gider. `test` kodu seviye testine (ulucamii.be) yönlendirir.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const KODLAR = JSON.parse(readFileSync(new URL('../fixtures/e-kodlari-basili.json', import.meta.url), 'utf8')).kodlar;

test.beforeEach(async ({ context }) => {
  await context.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (u.origin === KOK) return r.continue();
    if (u.origin === 'https://ulucamii.be' && u.pathname.startsWith('/media/ses/')) {
      // ulucamii.be'nin yanıtının yerine yerel dosya (aynı bayt); CORS * (GitHub Pages gibi)
      const dosya = new URL(`../../public${u.pathname}`, import.meta.url);
      return r.fulfill({ status: 200, contentType: 'audio/mpeg', headers: { 'access-control-allow-origin': '*', 'accept-ranges': 'none' }, body: readFileSync(dosya) });
    }
    if (u.href === 'https://ulucamii.be/fr/test-de-niveau/') return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>test</title>' });
    return r.abort();
  });
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
    window.__ses = [];
    const A = window.Audio;
    window.Audio = function (...x) { const o = new A(...x); window.__ses.push(o); return o; };
  });
});

const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const yol of ['/e/', '/e/fatiha/', '/e/alphabet/']) {
  test(`${yol}: Fransızca, noindex, kanonik ulucamii.be, CSP 0, taşmasız, iki temada axe`, async ({ page }) => {
    const yanit = await page.goto(yol);
    expect(yanit.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', /^fr/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://ulucamii.be${yol}`);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('.ec-sayfa')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const tema of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, tema, nodes: v.nodes.slice(0, 4).map((n) => n.target) }))).toEqual([]);
    }
    for (const [w, h] of [[1280, 900], [320, 700]]) {
      await page.setViewportSize({ width: w, height: h });
      expect(await tasmaYok(page), `${w} px`).toBe(true);
    }
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('/e/fatiha/: çalar denetimleri görünür; «tamamını dinle» ulucamii.be’deki sesi çalar, currentTime ilerler', async ({ page }) => {
  const istekler = [];
  page.on('request', (r) => { if (r.url().includes('/media/ses/')) istekler.push(r.url()); });
  await page.goto('/e/fatiha/');
  await expect(page.locator('[data-ec-tam]')).toBeVisible();
  await expect(page.locator('.ec-kontroller')).toBeVisible();
  await page.locator('[data-ec-tam]').click();
  await expect(page.locator('[data-ec-tam]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => Math.max(0, ...window.__ses.map((a) => a.currentTime))), { timeout: 8000 }).toBeGreaterThan(0.3);
  expect(istekler[0]).toMatch(/^https:\/\/ulucamii\.be\/media\/ses\/sureler\/fatiha\.mp3\?v=\d+$/);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  // ikinci dokunuş durdurur
  await page.locator('[data-ec-tam]').click();
  await expect(page.locator('[data-ec-tam]')).toHaveAttribute('aria-pressed', 'false');
});

test('/e/test/: seviye testine (ulucamii.be/fr/test-de-niveau/) yönlendirir', async ({ page }) => {
  await page.goto('/e/test/', { waitUntil: 'commit' }).catch(() => {});
  await page.waitForURL('https://ulucamii.be/fr/test-de-niveau/', { timeout: 10_000 });
});

test('74 kodun hepsi açılır: 200 ve (yönlendirme dışında) çalar bölümü var', async ({ request }) => {
  for (const k of KODLAR) {
    const r = await request.get(`/e/${k}/`);
    expect(r.status(), k).toBe(200);
    const html = await r.text();
    if (k === 'test') expect(html).toContain('data-ec-yonlendir');
    else expect(html, k).toContain('data-ecouter');
  }
});
