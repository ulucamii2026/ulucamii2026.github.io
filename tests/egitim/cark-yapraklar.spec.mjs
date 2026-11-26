// Sesli Çarkıfelek ve Çalışma Yaprakları Arşivi (26 Kasım 2026): beş dil, iki temada Axe WCAG AA, 320 px taşmasız, CSP temiz,
// Diyanet ses adresi doğrulaması ve 8 A4 PDF bağlantısının tamamının HTTP 200 dönmesi.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    HTMLMediaElement.prototype.play = function () {
      window.__sonSes = this.src;
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
  });
});

for (const dil of DILLER) {
  test(`${dil}: çarkıfelek ve çalışma yaprakları, 320 px, CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.setViewportSize({ width: 320, height: 700 });
    for (const yol of ['okuma/cark/', 'yapraklar/']) {
      await page.goto(`/${dil}/${yol}`);
      await expect(page.locator('h1')).toBeVisible();
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
      }
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('tr: Sesli Çarkıfelek deste değiştirir, döner, Diyanet sesini çalar ve turdan çıkarır', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tr/okuma/cark/');
  await expect(page.locator('[data-sayac]')).toContainText('28 / 28');
  await page.locator('[data-cevir]').click();
  await expect(page.locator('[data-ar]')).not.toBeEmpty();
  expect(await page.evaluate(() => window.__sonSes)).toContain('https://ulucamii.be/media/ses/');

  await page.locator('[data-cikar]').click();
  await expect(page.locator('[data-sayac]')).toContainText('27 / 28');

  await page.locator('[data-deste="o8"]').click();
  await expect(page.locator('[data-deste="o8"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-cevir]').click();
  expect(await page.evaluate(() => window.__sonSes)).toContain('/media/ses/okuma/yeni/');
});

test('tr: Çalışma Yaprakları arşivindeki 8 A4 PDF dosyasının tamamı 200 application/pdf döner', async ({ page, request }) => {
  await page.goto('/tr/yapraklar/');
  const baglar = await page.locator('a[href$=".pdf"]').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
  expect(baglar.length).toBe(8);
  for (const href of baglar) {
    const r = await request.get(href);
    expect(r.status(), href).toBe(200);
    expect(r.headers()['content-type'], href).toContain('application/pdf');
  }
});

test('tr: Sesli Çarkıfelek soru çarkı (s-siyer) soruyu açar, cevabı gösterir ve takım puanını artırır', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tr/okuma/cark/');
  await page.locator('[data-deste="s-siyer"]').click();
  await expect(page.locator('[data-deste="s-siyer"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-cevir]').click();
  await expect(page.locator('[data-soru-alan]')).toBeVisible();
  await expect(page.locator('.ck-soru-metin')).not.toBeEmpty();
  expect(await page.locator('.ck-soru-siklar .ck-soru-sik').count()).toBeGreaterThanOrEqual(2);
  await page.locator('[data-cevap-goster]').click();
  expect(await page.locator('.ck-soru-sik[data-durum="dogru"]').count()).toBe(1);
  await page.locator('[data-takim-arti="0"]').click();
  await expect(page.locator('[data-takim-puan="0"]')).toHaveText('1');
});

test('tr: Bilgi Yarışması 2 takım ve fon müzik/efekt/paylaşım modu ışık ve koyu temada çalışır', async ({ page }) => {
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  await page.goto('/tr/yarisma/oyna/#f=quiz&k=itikat,ibadet,siyer,ahlak,kuran&d=1-2&n=5&s=takim1&t=2');
  await expect(page.locator('[data-takimlar]')).toBeVisible();
  expect(await page.locator('[data-takim-btn]').count()).toBe(2);
  await expect(page.locator('[data-takim-btn="0"]')).toHaveAttribute('data-aktif', '1');

  // İlk sorunun doğru şıkkını sayfadaki gömülü veriden bulup işaretleyerek 1. Takım puanının 3 olmasını doğrula.
  const id = await page.locator('[data-sahne]').getAttribute('data-soru-id');
  const metinler = await page.locator('[data-ya-oyun]').evaluate((el, soruId) => {
    const v = JSON.parse(el.getAttribute('data-veri') || '{}');
    const s = (v.sorular || []).find((x) => x.id === soruId);
    return s && s.secenekler ? s.secenekler[s.dogru] : null;
  }, id);
  expect(metinler).toBeTruthy();
  await page.locator('.ya-sec', { hasText: metinler }).click();
  await page.locator('[data-kontrol]').click();
  await expect(page.locator('[data-takim-btn="0"] .ya-takim-puan')).toHaveText('3');

  await page.locator('[data-sonraki]').click();
  await expect(page.locator('[data-takim-btn="1"]')).toHaveAttribute('data-aktif', '1');

  await page.locator('[data-muzik]').click();
  await expect(page.locator('[data-muzik]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-paylas]').click();

  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
  }
  expect(hatalar).toEqual([]);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});
