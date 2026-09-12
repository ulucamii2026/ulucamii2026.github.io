import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mektepAc } from './helpers/mektep.mjs';

/* 12 Eyl 2026 — veli mazereti ile yoklama arasındaki kopukluk.
   O gün dört veli portaldan mazeret bildirdi; bildirimler «Veli bildirimleri» sekmesinde
   okunmamış dururken hoca yoklamada üçünü «Yok» (mazeretsiz) işaretledi ve defterlerine
   sitemli notlar düştü. Mazeretler artık yoklama ekranının kendisinde görünür. */

const students = [
  { ref: 'TEST-1', ad: 'Örnek', soyad: 'Talebe' },
  { ref: 'TEST-2', ad: 'İkinci', soyad: 'Örnek' },
];
const gun = '2026-09-19'; // sahte planda üç dersli gün
const baskaGun = '2026-09-13';
const mazeret = (id, ref, metin, extra = {}) => ({
  id, ref, tur: 'mazeret', tarih: gun, metin, okundu: false,
  eposta: 'veli@example.test', zaman: '2026-09-19T08:00:00Z', ...extra,
});

async function yoklamaAc(page, context, records) {
  await mektepAc(page, context, { hoca: true, students, records });
  await page.locator('[data-sekme=yoklama]').click();
  await page.locator('[data-yoklama-tarih]').selectOption(gun);
  return page.locator('#hoca-ekrani');
}

test('Günün veli mazeretleri yoklama ekranında görünür ve tek tıkla işaretlenir', async ({ page, context }) => {
  const kok = await yoklamaAc(page, context, {
    bildirimler: [
      mazeret('m1', 'TEST-1', 'Hasta'),
      mazeret('m2', 'TEST-2', 'Sport', { okundu: true }),
      // Başka güne ait mazeret ve mazeret olmayan mesaj bu şeritte görünmez.
      mazeret('m3', 'TEST-1', 'Başka gün', { tarih: baskaGun }),
      { id: 'm4', ref: 'TEST-1', tur: 'soru', tarih: gun, metin: 'Soru', okundu: false, eposta: 'veli@example.test' },
    ],
  });
  const serit = kok.locator('[data-mazeret-serit]');
  await expect(serit).toContainText('2 veli mazereti');
  await expect(serit).toContainText('Örnek Talebe');
  await expect(serit).toContainText('Hasta');
  await expect(serit).not.toContainText('Başka gün');
  await expect(serit).not.toContainText('Soru');
  await expect(serit.locator('.rozet')).toHaveCount(1); // yalnız okunmamış olan

  await serit.locator('[data-mazeret-uygula="TEST-1"]').click();
  for (const sira of ['1', '2', '3'])
    await expect(kok.locator(`[data-yok="TEST-1"][data-ders="${sira}"][data-durum="mazeret"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(serit.locator('[data-mazeret-uygula="TEST-1"]')).toBeDisabled();
  await expect(serit.locator('[data-mazeret-uygula="TEST-2"]')).toBeEnabled();

  // İşaret ekranda kalır; yazma ancak «Yoklamayı kaydet» ile olur.
  expect(await page.evaluate(() => window.__writes.length)).toBe(0);
  await kok.locator('[data-eylem=yoklamaKaydet]').click();
  await expect(page.locator('#hoca-durum')).toContainText('yoklaması kaydedildi');
  const yazilan = await page.evaluate(() => window.__records.yoklama);
  const kayit = yazilan.find((y) => y.id === `TEST-1_${gun}`);
  expect(kayit.dersler).toEqual({ 1: 'mazeret', 2: 'mazeret', 3: 'mazeret' });
  expect(yazilan.some((y) => y.id === `TEST-2_${gun}`)).toBe(false); // işaretlenmeyen yazılmaz
});

test('Mazeret yoksa şerit hiç çıkmaz', async ({ page, context }) => {
  const kok = await yoklamaAc(page, context, {});
  await expect(kok.locator('[data-eylem=yoklamaKaydet]')).toBeVisible();
  await expect(kok.locator('[data-mazeret-serit]')).toHaveCount(0);
});

test('Mazeret şeridi erişilebilir ve taşmasız', async ({ page, context }) => {
  const kok = await yoklamaAc(page, context, {
    bildirimler: [mazeret('m1', 'TEST-1', 'Hasta olduğu için gelemeyecek, kusura bakmayın.')],
  });
  const serit = kok.locator('[data-mazeret-serit]');
  await expect(serit).toBeVisible();
  for (const tema of ['light', 'dark']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; document.documentElement.classList.toggle('dark', t === 'dark'); }, tema);
    expect(await serit.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const sonuc = await new AxeBuilder({ page }).include('[data-mazeret-serit]').analyze();
    expect(sonuc.violations).toEqual([]);
  }
});
