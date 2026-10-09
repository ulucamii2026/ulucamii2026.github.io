import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, s => s.close());
});

test('Türkçe vaazlar: arama, kategori, temizleme, okuma ve belgeler', async ({ page }) => {
  await page.goto('/tr/vaazlar/');
  const cards = page.locator('.vz-oge');
  const total = await cards.count();
  expect(total).toBeGreaterThan(100);
  const firstUrl = await cards.first().locator('a').getAttribute('href');
  await expect(page.locator('[data-vaaz-dil-uyarisi]')).toHaveCount(0);
  await expect(page.locator('.vz-ara-sil')).toBeHidden();
  await page.locator('#vz-ara-giris').fill('xyzzbulunamayacak');
  await expect(page.locator('.vz-oge:visible')).toHaveCount(0);
  await expect(page.locator('.vz-bos')).toBeVisible();
  await page.locator('.vz-ara-sil').click();
  await expect(page.locator('.vz-oge:visible')).toHaveCount(total);
  await expect(page.locator('#vz-ara-giris')).toBeFocused();
  await expect(page.locator('.vz-ara-sil')).toBeHidden();
  const category = page.locator('.vz-cip').nth(1);
  const key = await category.getAttribute('data-kat');
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.vz-oge:visible').evaluateAll(es => [...new Set(es.map(e => e.dataset.kat))])).toEqual([key]);
  await page.goto(firstUrl);
  await expect(page.locator('.vaaz-govde')).toBeVisible();
  for (const lang of ['tr', 'fr', 'en']) {
    await expect(page.locator(`#dil-menu a[lang="${lang}"]`)).toHaveAttribute('href', firstUrl.replace('/tr/', `/${lang}/`) + (firstUrl.endsWith('/') ? '' : '/'));
  }
  // Tüm yayımlanmış vaazların Word/PDF hedefleri dosya olarak gerçekten mevcut olmalı.
  // Sunumlar (PowerPoint + sunum PDF'i, 9 Eki 2026'dan beri) yalnız derneğin GitHub sürümünden iner.
  const SURUM = 'https://github.com/ulucamii2026/ulucamii2026.github.io/releases/download/';
  const root = new URL('../../dist/tr/vaaz/', import.meta.url);
  for (const slug of readdirSync(root)) {
    const html = readFileSync(new URL(`${slug}/index.html`, root), 'utf8');
    for (const [, href] of html.matchAll(/href="([^"]+)"[^>]*\bdownload\b/g)) {
      if (href.startsWith(SURUM)) continue;
      expect(href.startsWith('/'), `${slug}: ${href}`).toBe(true);
      expect(existsSync(new URL(`../../public${decodeURIComponent(href)}`, import.meta.url)), `${slug}: ${href}`).toBe(true);
    }
  }
});

for (const lang of ['fr', 'en']) {
  test(`${lang}: dil uyarısı ve aynı vaaza Türkçe geçiş`, async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    // Bu dile çevrilmiş vaazlar (9 Eki 2026): listede kendi bölümünde durur; uyarı «öteki vaazlar Türkçe» der.
    const cevrilen = readdirSync(new URL(`../../src/content/vaaz-cevirileri/${lang}/`, import.meta.url))
      .filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).sort();
    const cevrildi = (url) => cevrilen.some(s => url.replace(/\/$/, '').endsWith(`/${s}`));
    await page.goto(`/${lang}/sermons/`);
    const notice = page.locator('[data-vaaz-dil-uyarisi]');
    const uyari = cevrilen.length
      ? (lang === 'fr' ? 'Les autres sermons sont disponibles en turc' : 'The other sermons are available in Turkish')
      : (lang === 'fr' ? 'uniquement en turc' : 'only in Turkish');
    await expect(notice).toContainText(uyari);
    await expect(page.locator('#vz-ara-giris')).toHaveCount(0);
    expect((await page.locator('.vz-kart').evaluateAll(as => as.map(a => a.getAttribute('href')))).sort())
      .toEqual(cevrilen.map(s => `/${lang}/vaaz/${s}/`));
    await expect(notice.locator('a')).toHaveAttribute('href', '/tr/vaazlar/');
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.locator('#tema-dugme').click();
      await page.screenshot({ animations: 'disabled' });
      expect((await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    }
    await notice.locator('a').click();
    await expect(page).toHaveURL(/\/tr\/vaazlar\/$/);
    // Türkçeye geçiş yalnız bu dile çevrilmemiş bir vaazda denenir.
    const trUrl = (await page.locator('.vz-kart').evaluateAll(as => as.map(a => a.getAttribute('href')))).find(u => !cevrildi(u));
    await page.goto(trUrl.replace('/tr/', `/${lang}/`));
    await expect(notice).toBeVisible();
    await expect(page.locator('.vaaz-govde, .vaaz-indir')).toHaveCount(0);
    await expect(page.locator('script[type="application/ld+json"]')).not.toContainText('"@type":"Article"');
    await notice.locator('a').focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.vaaz-govde')).toBeVisible();
    expect(new URL(page.url()).pathname.replace(/\/$/, '')).toBe(trUrl.replace(/\/$/, ''));
    await page.setViewportSize({ width: 320, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    // Çevrilen vaaz kendi dilinde tam metinle açılır.
    for (const s of cevrilen) {
      await page.goto(`/${lang}/vaaz/${s}/`);
      await expect(page.locator('.vaaz-govde')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${lang}`));
    }
    expect(errors).toEqual([]);
  });
}
