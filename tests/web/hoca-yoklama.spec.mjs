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
  // 14 Eyl 2026 (Rıdvan): bitmiş durum düğmesinin üstünde imleç «bekle» diye dönmez; bekleme imleci yalnız çalışan (data-mesgul) düğmede.
  expect(await serit.locator('[data-mazeret-uygula="TEST-1"]').evaluate((e) => getComputedStyle(e).cursor)).toBe('not-allowed');

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

/* 14 Eyl 2026 — ikinci tasarım turu: akıllı varsayılan, canlı özet, katlı gün notu, günün özeti,
   okunmamış bildirim rozeti, iş akışı sırasında sekmeler, öğrenci kartında devam özeti. */
test('Akıllı varsayılan: ilk ders işaretlenince boş dersler de aynı işaretlenir, dolu ders ezilmez; özet canlı; gün notu katlı', async ({ page, context }) => {
  const kok = await yoklamaAc(page, context, { yoklama: [yok('TEST-2', { 1: '', 2: 'yok', 3: '' })] });
  await dugme(kok, 'TEST-1', '1', 'var').click();
  for (const s of ['2', '3']) await expect(dugme(kok, 'TEST-1', s, 'var')).toHaveAttribute('aria-pressed', 'true');
  // «Geç» → sonrakiler «Var»; dolu 2. ders («yok») ezilmez.
  await dugme(kok, 'TEST-2', '1', 'gec').click();
  await expect(dugme(kok, 'TEST-2', '2', 'yok')).toHaveAttribute('aria-pressed', 'true');
  await expect(dugme(kok, 'TEST-2', '3', 'var')).toHaveAttribute('aria-pressed', 'true');
  const ozet = kok.locator('[data-yk-ozet]');
  await expect(ozet).toContainText('6/6 ders işaretli');
  await expect(ozet).toContainText('Hepsi işaretli');
  // Aynı düğmeye ikinci dokunuş yalnız o dersi boşaltır; özet düşer.
  await dugme(kok, 'TEST-1', '1', 'var').click();
  await expect(dugme(kok, 'TEST-1', '1', 'var')).toHaveAttribute('aria-pressed', 'false');
  await expect(dugme(kok, 'TEST-1', '2', 'var')).toHaveAttribute('aria-pressed', 'true');
  await expect(ozet).toContainText('5/6 ders işaretli');
  await expect(ozet).toContainText('İşaretsiz 1');
  // Gün notu katlı durur; açılınca yazılır ve kaydedilir.
  const notAlani = kok.locator('[data-yok-not="TEST-1"]');
  await expect(notAlani).toBeHidden();
  await kok.locator('.yk-satir', { has: page.locator('[data-yok-not="TEST-1"]') }).locator('.yk-not summary').click();
  await notAlani.fill('Erken ayrıldı');
  await kok.locator('[data-eylem=yoklamaKaydet]').click();
  await expect(page.locator('#hoca-durum')).toContainText('yoklaması kaydedildi');
  const yazilan = await page.evaluate(() => window.__records.yoklama);
  expect(yazilan.find((y) => y.id === `TEST-1_${gun}`).not).toBe('Erken ayrıldı');
  expect(yazilan.find((y) => y.id === `TEST-1_${gun}`).dersler).toEqual({ 2: 'var', 3: 'var' });
  expect(yazilan.find((y) => y.id === `TEST-2_${gun}`).dersler).toEqual({ 1: 'gec', 2: 'yok', 3: 'var' });
});

test('Günün özeti, okunmamış bildirim rozeti ve iş akışı sırasında sekmeler', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students, records: { bildirimler: [
    { id: 'b1', ref: 'TEST-1', tur: 'soru', metin: 'Kitap nereden alınır?', okundu: false, eposta: 'veli@example.test', zaman: '2026-09-12T10:00:00Z' },
    { id: 'b2', ref: 'TEST-2', tur: 'iletisim', metin: 'Telefon değişti', okundu: true, eposta: 'veli@example.test', zaman: '2026-09-12T10:00:00Z' },
  ] } });
  const kok = page.locator('#hoca-ekrani');
  await expect(kok.locator('h1.hero-baslik')).toContainText('Hoca ekranı');
  const gunOzeti = kok.locator('[data-hero-gun]');
  await expect(gunOzeti).toContainText('bugün ders var'); // sahte saat 13 Eyl, planda ders günü
  await expect(gunOzeti).toContainText('2 aktif öğrenci');
  await expect(gunOzeti).toContainText('1 okunmamış veli bildirimi');
  const sekme = kok.locator('[role=tab][data-sekme=bildirim]');
  await expect(sekme.locator('.sekme-sayi')).toContainText('1');
  const sira = await kok.locator('[role=tab]').evaluateAll((els) => els.map((e) => e.dataset.sekme));
  expect(sira.slice(0, 4)).toEqual(['yoklama', 'defter', 'odev', 'bildirim']);
  // Özetteki bağlantı sekmeye götürür; okundu işaretlenince rozet düşer ve özet güncellenir.
  await gunOzeti.locator('[data-sekme=bildirim]').click();
  await expect(sekme).toHaveAttribute('aria-selected', 'true');
  await kok.locator('[data-okundu="b1"]').click();
  await expect(sekme.locator('.sekme-sayi')).toHaveCount(0);
  await expect(kok.locator('[data-hero-gun]')).toContainText('Okunmamış veli bildirimi yok');
});

test('Öğrenci kartında devam özeti; «Ders defterini aç» defteri o öğrenciyle açar', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students, records: { yoklama: [
    yok('TEST-1', { 1: 'var', 2: 'var', 3: 'gec' }),
    { id: `TEST-1_${baskaGun}`, ref: 'TEST-1', tarih: baskaGun, dersler: { 1: 'mazeret' }, not: '' },
  ] } });
  const kok = page.locator('#hoca-ekrani');
  await kok.locator('[role=tab][data-sekme=ogrenci]').click();
  await kok.locator('.ogr-ad[data-ogr="TEST-1"]').click();
  const devam = kok.locator('[data-devam]');
  await expect(devam).toContainText('2 ders günü');
  await expect(devam).toContainText('Var 2');
  await expect(devam).toContainText('Geç 1');
  await expect(devam).toContainText('Mazeretli 1');
  await kok.locator('[data-defter-ac="TEST-1"]').click();
  await expect(kok.locator('[role=tab][data-sekme=defter]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-dd-form]')).toBeVisible();
  await expect(page.locator('[data-dd-ogr]')).toHaveValue('TEST-1');
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
