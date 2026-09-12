import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mektepAc } from './helpers/mektep.mjs';

/* KALICI KURAL (Rıdvan, 12 Eyl 2026): veliden gelen mazeret HER ZAMAN kabul edilir.
   Öncesinde kopukluk vardı: o gün dört veli portaldan mazeret bildirdi; bildirimler «Veli
   bildirimleri» sekmesinde okunmamış dururken hoca yoklamada üçünü «Yok» (mazeretsiz)
   işaretledi ve defterlerine sitemli notlar düştü. Artık mazeret bir tıklama değil, kural:
   gün açılırken kendiliğinden işaretlenir; yazma yine «Yoklamayı kaydet» ile olur. */

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
const yok = (ref, dersler, extra = {}) => ({ id: `${ref}_${gun}`, ref, tarih: gun, dersler, not: '', ...extra });

async function yoklamaAc(page, context, records) {
  await mektepAc(page, context, { hoca: true, students, records });
  await page.locator('[data-sekme=yoklama]').click();
  await page.locator('[data-yoklama-tarih]').selectOption(gun);
  return page.locator('#hoca-ekrani');
}
const dugme = (kok, ref, sira, durum) =>
  kok.locator(`[data-yok="${ref}"][data-ders="${sira}"][data-durum="${durum}"]`);

test('Veli mazereti kendiliğinden işaretlenir; yazma yalnız kaydetmeyle olur', async ({ page, context }) => {
  const kok = await yoklamaAc(page, context, {
    bildirimler: [
      mazeret('m1', 'TEST-1', 'Hasta'),
      mazeret('m2', 'TEST-2', 'Sport', { okundu: true }),
      // Başka güne ait mazeret ve mazeret olmayan mesaj bu şeritte görünmez, kural da işlemez.
      mazeret('m3', 'TEST-1', 'Başka gün', { tarih: baskaGun }),
      { id: 'm4', ref: 'TEST-1', tur: 'soru', tarih: gun, metin: 'Soru', okundu: false, eposta: 'veli@example.test' },
    ],
  });
  const serit = kok.locator('[data-mazeret-serit]');
  await expect(serit).toContainText('2 veli mazereti');
  await expect(serit).toContainText('her zaman kabul edilir');
  await expect(serit).toContainText('Hasta');
  await expect(serit).not.toContainText('Başka gün');
  await expect(serit).not.toContainText('Soru');
  await expect(serit.locator('.rozet')).toHaveCount(1); // yalnız okunmamış olan

  // Tıklama YOK: kural gün açılırken uygulanmış olmalı.
  await expect(kok.locator('[data-mazeret-oto]')).toContainText('2 öğrenci');
  for (const ref of ['TEST-1', 'TEST-2'])
    for (const sira of ['1', '2', '3'])
      await expect(dugme(kok, ref, sira, 'mazeret')).toHaveAttribute('aria-pressed', 'true');
  await expect(serit.locator('[data-mazeret-uygula="TEST-1"]')).toBeDisabled();

  /* Kaydedilmiş bir günü hoca bir daha hiç açmayabilir; mazeret bildirilen günler gün
     listesinde işaretlenir ki hangi güne dönmesi gerektiği görünsün. */
  const secenek = (t) => kok.locator(`[data-yoklama-tarih] option[value="${t}"]`);
  await expect(secenek(gun)).toContainText('veli mazereti');
  await expect(secenek(baskaGun)).toContainText('veli mazereti'); // m3 o güne ait
  await expect(secenek('2026-09-12')).not.toContainText('veli mazereti');

  // Ekranda durur; sunucuya ancak «Yoklamayı kaydet» yazar.
  expect(await page.evaluate(() => window.__writes.length)).toBe(0);
  await kok.locator('[data-eylem=yoklamaKaydet]').click();
  await expect(page.locator('#hoca-durum')).toContainText('yoklaması kaydedildi');
  await expect(kok.locator('[data-mazeret-oto]')).toHaveCount(0); // kaydedildi, uyarı kalkar
  const yazilan = await page.evaluate(() => window.__records.yoklama);
  for (const ref of ['TEST-1', 'TEST-2']) {
    const kayit = yazilan.find((y) => y.id === `${ref}_${gun}`);
    expect(kayit.dersler).toEqual({ 1: 'mazeret', 2: 'mazeret', 3: 'mazeret' });
    expect(kayit.veliMazereti).toEqual(['1', '2', '3']); // kural izi kaydedilir
  }
});

test('Gerçek katılım kuralı ezer; geç gelen mazeret kaydedilmiş «Yok»u düzeltir', async ({ page, context }) => {
  const kok = await yoklamaAc(page, context, {
    bildirimler: [mazeret('m1', 'TEST-1', 'Hasta'), mazeret('m2', 'TEST-2', 'Doktor')],
    // TEST-1 derse rağmen gelmiş (1. ders «var»); TEST-2 mazeret geç geldiği için «yok» kalmış.
    yoklama: [yok('TEST-1', { 1: 'var', 2: '', 3: '' }), yok('TEST-2', { 1: 'yok', 2: 'yok', 3: 'yok' })],
  });
  await expect(dugme(kok, 'TEST-1', '1', 'var')).toHaveAttribute('aria-pressed', 'true');
  await expect(dugme(kok, 'TEST-1', '2', 'mazeret')).toHaveAttribute('aria-pressed', 'true');
  for (const sira of ['1', '2', '3'])
    await expect(dugme(kok, 'TEST-2', sira, 'mazeret')).toHaveAttribute('aria-pressed', 'true');

  // Hoca kural sonrası bilerek «Yok» derse bu seçim kaydedilir ve kural izi korunur.
  await dugme(kok, 'TEST-2', '3', 'yok').click();
  await kok.locator('[data-eylem=yoklamaKaydet]').click();
  await expect(page.locator('#hoca-durum')).toContainText('yoklaması kaydedildi');
  const yazilan = await page.evaluate(() => window.__records.yoklama);
  const bir = yazilan.find((y) => y.id === `TEST-1_${gun}`);
  expect(bir.dersler).toEqual({ 1: 'var', 2: 'mazeret', 3: 'mazeret' });
  expect(bir.veliMazereti).toEqual(['2', '3']);
  const iki = yazilan.find((y) => y.id === `TEST-2_${gun}`);
  expect(iki.dersler).toEqual({ 1: 'mazeret', 2: 'mazeret', 3: 'yok' });
  expect(iki.veliMazereti).toEqual(['1', '2', '3']);
});

test('Mazeret yoksa şerit hiç çıkmaz ve yoklamaya dokunulmaz', async ({ page, context }) => {
  const kok = await yoklamaAc(page, context, { yoklama: [yok('TEST-1', { 1: 'yok', 2: 'yok', 3: 'yok' })] });
  await expect(kok.locator('[data-eylem=yoklamaKaydet]')).toBeVisible();
  await expect(kok.locator('[data-mazeret-serit]')).toHaveCount(0);
  await expect(dugme(kok, 'TEST-1', '1', 'yok')).toHaveAttribute('aria-pressed', 'true');
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
