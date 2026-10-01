import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const depolar = () => JSON.stringify([Object.entries(localStorage).sort(), Object.entries(sessionStorage).sort()]);
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
});

test('Örnek form oturumsuz ve servis isteksiz açılır; tüm bölümler var, mod URL ile değişmez', async ({ page }) => {
  const servis = [];
  page.on('request', r => { if (r.url().includes('/macros/') || r.method() === 'POST') servis.push(r.url()); });
  await page.goto('/envanter/?canli=1');
  await expect(page.locator('[data-ornek-bilgi]')).toContainText('Gerçek kayıt alınmaz');
  await expect(page.locator('form[data-form="envanter"]')).toBeVisible();
  await expect(page.locator('[data-envanter]')).toHaveAttribute('data-uc', '');
  await page.locator('[data-adim-tumu]').click();
  for (const id of ['b-bilgi','b-gorevli','b-sayilar','b-kisiler','b-durum','b-faaliyet','b-gonullu','b-aday','b-belge','b-gorus','b-ozet']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  expect(servis).toEqual([]);
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Kurgusal örnek, izin doğrulaması ve sonuç: ağ ve depolama sıfır', async ({ page }, info) => {
  await page.goto('/envanter/');
  await expect(page.locator('[data-ornek-doldur]')).toBeVisible();
  const once = await page.evaluate(depolar);
  const gonderimler = [];
  page.on('request', r => { if (r.url().includes('/macros/') || r.method() === 'POST') gonderimler.push(r.url()); });
  await page.locator('[data-ornek-doldur]').click();
  await page.locator('[data-ornek-doldur]').click();
  await expect(page.locator('#env-ad')).toHaveValue('Örnek Görevli TESTOGLU');
  await expect(page.locator('[data-kisi]')).toHaveCount(2);
  await expect(page.locator('#env-onay-bilgi')).not.toBeChecked();
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeHidden();
  await expect(page.locator('#env-onay-bilgi')).toHaveAttribute('aria-invalid', 'true');
  for (const id of ['env-onay-bilgi', 'env-onay-izin', 'env-aa-izin']) await page.locator(`#${id}`).check();
  for (const el of await page.locator('[data-kisi] input[name$=".izin"]').all()) await el.check();
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[data-basari]')).toBeVisible();
  await expect(page.locator('[data-basari]')).toContainText('Gerçek bir kayıt oluşturulmadı');
  await expect(page.locator('[data-ref]')).toHaveText('EV-ORNEK-0001');
  await page.waitForTimeout(500);
  expect(gonderimler).toEqual([]);
  expect(await page.evaluate(depolar)).toBe(once);
  mkdirSync('.codex/cikti/envanter-ornek', { recursive: true });
  await page.screenshot({ path: `.codex/cikti/envanter-ornek/${info.project.name}-sonuc.png` });
});

test('Örneği temizle ve sayfayı yenile: girilen bilgiler ve eski gerçek taslak önizlemeye taşınmaz', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('ulucamii:envanter:v1', JSON.stringify({ surum: 2, zaman: Date.now(), alanlar: { 'gorevli.ad': 'ESKI TEST TASLAGI' } })));
  await page.goto('/envanter/');
  await expect(page.locator('[data-ornek-doldur]')).toBeVisible();
  const once = await page.evaluate(depolar);
  await expect(page.locator('#env-ad')).toHaveValue('');
  await page.locator('[data-ornek-doldur]').click();
  await page.locator('[data-taslak-sil]').click();
  if (await page.locator('[data-adim-tumu]').getAttribute('aria-pressed') !== 'true') await page.locator('[data-adim-tumu]').click();
  await expect(page.locator('#env-ad')).toHaveValue('');
  await expect(page.locator('[data-kisi]')).toHaveCount(0);
  await page.locator('#env-ad').fill('Kurgusal deneme');
  await page.waitForTimeout(500);
  expect(await page.evaluate(depolar)).toBe(once);
  await page.reload();
  await expect(page.locator('#env-ad')).toHaveValue('');
  mkdirSync('.codex/cikti/envanter-ornek', { recursive: true });
  await page.screenshot({ path: `.codex/cikti/envanter-ornek/${info.project.name}-form.png` });
});
