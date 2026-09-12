import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mektepAc } from './helpers/mektep.mjs';
import AxeBuilder from '@axe-core/playwright';

test('Diyanet alıştırmalarının kaynak, metin ve dosya bütünlüğü', () => {
  const veri = JSON.parse(readFileSync('src/data/elifba-alistirmalari.json', 'utf8'));
  expect(veri.cezm.ornekler).toHaveLength(28);
  expect(veri.sedde.ornekler).toHaveLength(18);
  for (const ders of Object.values(veri)) for (const ornek of ders.ornekler) {
    expect(new URL(ornek.kaynak).hostname).toBe('kuran.diyanet.gov.tr');
    expect(ornek.metin).toMatch(/[\u0600-\u06ff]/);
    expect(createHash('sha256').update(readFileSync(`public${ornek.sesUrl}`)).digest('hex')).toBe(ornek.sha256);
  }
});

for (const dil of ['tr', 'fr', 'en']) {
  test(`${dil}: cezm ve şedde resmî örneği çalar, yapay ses kullanmaz`, async ({ page, context }) => {
    await mektepAc(page, context, { dil });
    await page.locator('[data-eylem="harfSec"][data-harf="be"]').click();
    const cezm = page.locator('[data-hareke-id="cezm"]');
    await expect(cezm).toContainText('تِبْ');
    await cezm.click();
    expect(await page.evaluate(() => window.__audio.at(-1).getAttribute('src'))).toBe('/media/ses/elifba/cezm/2.mp3');
    await page.locator('.sedde-alistirmalari summary').click();
    const sedde = page.locator('[data-eylem="seddeSesCal"]').first();
    await sedde.focus(); await page.keyboard.press('Enter');
    await expect(sedde).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.__audio.at(-1).getAttribute('src'))).toBe('/media/ses/elifba/sedde/1.mp3');
    await page.evaluate(() => window.__audio.at(-1).dispatchEvent(new Event('error')));
    await expect(page.locator('.portal-toast.hata')).toBeVisible();
    expect(await page.evaluate(() => window.__tts)).toEqual([]);
  });

  test(`${dil}: kopyalama hatası başarı diye gösterilmez ve odak korunur`, async ({ page, context }) => {
    await mektepAc(page, context, { dil });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('blocked'); } } });
      document.execCommand = () => false;
    });
    const btn = page.locator('[data-eylem="ezberMetinKopyala"]');
    await btn.click();
    await expect(page.locator('.portal-toast.hata')).toBeVisible();
    await expect(page.locator('.portal-toast.basari')).toHaveCount(0);
    await expect(btn).toBeFocused();
    await page.evaluate(() => { document.execCommand = () => true; });
    await btn.click();
    await expect(page.locator('.portal-toast.basari')).toBeVisible();
    await expect(page.locator('textarea[readonly]')).toHaveCount(0);
  });
}

test('ses gecikmesi ve ikinci tıklama eski sesi yeniden başlatmaz', async ({ page, context }) => {
  await mektepAc(page, context);
  await page.evaluate(() => { window.__delayNextAudio = true; });
  const tr = page.locator('.ezber-tr-anlam');
  await tr.click();
  await page.locator('.ezber-fr-anlam').click();
  await page.evaluate(() => window.__pending.reject(new DOMException('aborted', 'AbortError')));
  await expect(page.locator('.ezber-fr-anlam')).toHaveClass(/oynuyor/);
  await expect(page.locator('.portal-toast.hata')).toHaveCount(0);
  expect(await page.evaluate(() => window.__tts)).toEqual([]);
  await page.locator('.ezber-fr-anlam').click();
  await expect(page.locator('.ezber-fr-anlam')).not.toHaveClass(/oynuyor/);
  expect(await page.evaluate(() => window.__audio.every(a => a.paused))).toBe(true);
});

test('dinleme alıştırmasında cevap sonrası seçilen harfin sesi kesilmez', async ({ page, context }) => {
  await mektepAc(page, context);
  await page.locator('[data-eylem="kulakSecim"]').first().click();
  await expect(page.locator('.kulak-sonuc-kutusu')).toBeVisible();
  expect(await page.evaluate(() => window.__audio.at(-1)?.paused)).toBe(false);
});

test('döngü, hız ve metni gizleme çalan sûreyi sıfırlamaz', async ({ page, context }) => {
  await mektepAc(page, context);
  await page.locator('[data-eylem="ezberSesOynatDur"]').click();
  await page.evaluate(() => { window.__native = document.querySelector('audio.ezber-audio'); window.__native.currentTime = 8; });
  const dongu = page.locator('[data-eylem="ezberDonguToggle"]');
  await dongu.click();
  await expect(dongu).toHaveAttribute('aria-pressed', 'true');
  const hiz = page.locator('[data-eylem="ezberHizAyarla"][data-hiz="0.75"]');
  await hiz.click(); await expect(hiz).toHaveAttribute('aria-pressed', 'true');
  const gizle = page.locator('.ezber-arac-btn[data-eylem="ezberGizleToggle"]');
  await gizle.click();
  await expect(page.locator('.ezber-arapca')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('.ezber-gizli-overlay').focus(); await page.keyboard.press('Enter');
  await expect(gizle).toBeFocused();
  expect(await page.evaluate(() => ({ same: window.__native === document.querySelector('audio.ezber-audio'), time: window.__native.currentTime, rate: window.__native.playbackRate, loop: window.__native.loop, paused: window.__native.paused }))).toEqual({ same: true, time: 8, rate: 0.75, loop: true, paused: false });
  await page.locator('[data-eylem="ezberSesOynatDur"]').click();
  await page.locator('[data-eylem="ezberSesOynatDur"]').click();
  expect(await page.evaluate(() => window.__native.currentTime)).toBe(8);
});

test('İngilizce hadis anlamı kendi dilindeki kayıtla çalar', async ({ page, context }) => {
  await mektepAc(page, context, { dil: 'en' });
  await expect(page.locator('.hadis-meal-kutu')).toHaveAttribute('aria-disabled', 'false');
  await page.locator('.hadis-meal-kutu').focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__audio.at(-1).getAttribute('src'))).toMatch(/^\/media\/ses\/hadisler\/en\//);
  await expect(page.locator('.hadis-meal-kutu')).toContainText('Computer-generated');
  await expect(page.locator('.ezber-anlam [lang="en"]')).not.toBeEmpty();
});

test('haftalık karne eski yoklamayı taşımaz ve iki ders gününü kapsar', async ({ page, context }) => {
  await mektepAc(page, context, { ogrenci: false, records: { yoklama: [{ ref: 'TEST-1', tarih: '2026-09-05', durum: 'var' }] } });
  const karne = page.locator('.haftalik-karne-kart');
  await expect(karne).toContainText('Bu hafta için henüz yoklama girilmedi');
  await expect(karne).toContainText('Cumartesi konusu, Pazar konusu');
  await expect(karne).toContainText('Cumartesi tekrarı, Pazar tekrarı');
});

test('haftalık karne iki günün yoklamasını birleştirir', async ({ page, context }) => {
  await mektepAc(page, context, { ogrenci: false, records: { yoklama: [
    { ref: 'TEST-1', tarih: '2026-09-12', dersler: { '1': 'var', '2': 'yok' } },
    { ref: 'TEST-1', tarih: '2026-09-13', dersler: { '1': 'gec', '2': 'mazeret' } },
  ] } });
  await expect(page.locator('.haftalik-karne-kart')).toContainText('1 geldi · 1 gelmedi · 1 mazeretli · 1 geç');
});

test('öğrenci modu mobilde taşmaz, iç içe ses düğmesi yoktur', async ({ page, context }, testInfo) => {
  await mektepAc(page, context, { dil: 'fr' });
  await page.locator('.sedde-alistirmalari summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page.locator('.ezber-tiklanabilir-kutu button')).toHaveCount(0);
  await page.locator('.ezber-vitrin').screenshot({ path: testInfo.outputPath('ezber.png') });
  await page.locator('.sedde-alistirmalari').screenshot({ path: testInfo.outputPath('sedde.png') });
});

test('öğrenci modunun ses kontrolleri açık ve koyu temada erişilebilirdir', async ({ page, context }) => {
  await mektepAc(page, context, { dil: 'fr' });
  for (const theme of ['light', 'dark']) {
    await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
    await page.screenshot({ animations: 'disabled' });
    const result = await new AxeBuilder({ page }).include('#veli-portal').withRules(['button-name', 'nested-interactive', 'color-contrast']).analyze();
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, reason: n.failureSummary })) })), theme).toEqual([]);
  }
});
