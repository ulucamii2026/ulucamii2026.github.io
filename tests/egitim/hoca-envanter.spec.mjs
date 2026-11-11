import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { mektepAc } from './helpers/mektep.mjs';

/* Online envanter (1 Kasım 2026) — hoca «Envanter» sekmesi. Şartname: ONLINE-ENVANTER-SPEC.md (kurs projesi, belgeler/bireysel-plan-2026-2027).
   Sahte tam SDK: tests/egitim/helpers/mektep.mjs (firestoreTam; veri window.__records, her toplu yazım window.__ezberYazimlar).
   İnceleme odakları: (1) kâğıttan aktarılan belge açılınca değerleri gösterir ve aynı belgeye yazar, (2) öğrenci kipi kilitli ve
   yalnız 2 saniyelik basılı tutma çıkarır, (3) yazımlar birleşir ve sürüm artar, (4) program yalnız onaylıysa çocuğa görünür,
   (5) çakışma sessizce ezmez, (6) 360 px genişlikte dokunma hedefi ≥ 56 px. */

const M = JSON.parse(readFileSync('src/data/ogrenci-envanteri/maddeler.json', 'utf8'));
const satirlar = (g) => M.gruplar[g].sayfalar.flatMap((s) => s.bolumler.flatMap((b) => b.satirlar.map((x) => x.id)));
const S913 = satirlar('9-13');
const students = [
  { ref: 'TEST-1', ad: 'Örnek', soyad: 'Talebe' },
  { ref: 'TEST-2', ad: 'İkinci', soyad: 'Örnek' },
  { ref: 'TEST-3', ad: 'Pasif', soyad: 'Öğrenci', durum: 'pasif' },
];
const bugun = '2026-11-01';
const tamBelge = (ref) => ({ id: `${ref}_2026-10-31_9-13`, ref, tarih: '2026-10-31', grup: '9-13', kaynak: 'kagit-2026-10-31',
  ben: Object.fromEntries(S913.map((id) => [id, 1])), hoca: Object.fromEntries(S913.map((id) => [id, 2])), kutular: { dil: ['fr'] }, metin: { sevdigi: 'Oyun' },
  okuma: { basamak: 2, sonraki: 3 }, okuma_notlari: {}, sayfaDinlendi: { 2: true, 3: true, 4: true }, durum: 'tamam', surum: 1 });
const eksikBelge = (ref) => ({ id: `${ref}_2026-10-31_9-13`, ref, tarih: '2026-10-31', grup: '9-13', kaynak: 'kagit-2026-10-31',
  ben: { 'd-euzu-besmele': 1, 'd-kelime-i-tevhid': 2, 's-fatiha': 0 }, hoca: {}, durum: 'baslandi', surum: 1 });
const sira = { id: bugun, tarih: bugun, yapildi: { a3: true }, adimlar: [
  { id: 'a1', saat: '10:00', ders: 1, ref: 'TEST-1', is: 'form', grup: '5-8', aciklama_tr: 'Beş sekiz formu', sure_dk: 5 },
  { id: 'a2', saat: '10:15', ders: 1, ref: 'TEST-2', is: 'dogrulama', aciklama_tr: 'Namaz pratiği doğrulaması', sure_dk: 8 },
  { id: 'a3', saat: '11:00', ders: 2, ref: null, is: 'not', aciklama_tr: 'Sınıf notu', sure_dk: 1 }] };
const program = (ref, durum) => ({ id: ref, ref, durum, donem: '2026-11-01..2026-11-29', ogrenciye_tr: 'Bu ay Fâtiha’yı güzel okuyacağız.', ogrenciye_fr: 'Ce mois-ci, nous lirons bien la Fâtiha.',
  hedefler: [{ tur: 'okuma', baslik_tr: 'Akıcı okuma', baslik_fr: 'Lecture fluide', neden_tr: 'Hece okuyor', haftalar: [{ tarih: '2026-11-07', derste_tr: 'Satır oku', derste_fr: 'Lis une ligne', evde_tr: 'Her gün 5 dk', evde_fr: '5 min', hoca_dinler_tr: 'Elifbâ s. 12' }] }] });

async function envAc(page, context, { records = {}, tarih = `${bugun}T09:00:00Z` } = {}) {
  await mektepAc(page, context, { hoca: true, students, tarih, records: { hocaGunSirasi: [sira], ...records } });
  await page.locator('[data-sekme=envanter]').click();
  const kok = page.locator('[data-hoca-envanter]');
  await expect(kok.locator('[data-env-baglanti]').first()).toContainText('Bütün kayıtlar gönderildi');
  return kok;
}
const yazimlar = (page) => page.evaluate(() => (window.__ezberYazimlar || []).flat().filter((o) => o.yol.startsWith('ogrenciEnvanteri/')));
const kayit = (page, id) => page.evaluate((i) => (window.__records.ogrenciEnvanteri || []).find((x) => x.id === i), id);
const listeAc = async (kok) => { await kok.locator('[data-env-gorunum=liste]').click(); };
const satir = (kap, id) => kap.locator(`[data-satir="${id}"]`);

test('Sekme Ezber’den sonra; Bugün kuyruğu adımları gösterir, tik hocaGunSirasi/yapildi’ye yazılır, form adımdan açılır', async ({ page, context }) => {
  const kok = await envAc(page, context);
  const sekmeler = (await page.locator('[role=tab]').allTextContents()).map((x) => x.trim());
  expect(sekmeler[sekmeler.indexOf('Ezber') + 1]).toBe('Envanter');
  await expect(kok.locator('.env-adim')).toHaveCount(3);
  await expect(kok.locator('.env-ozet')).toContainText('1/3');
  await expect(kok.locator('[data-env-adim=a1]')).toContainText('Örnek Talebe');
  await expect(kok.locator('[data-env-adim=a1]')).toContainText('5–8 yaş');
  await expect(kok.locator('[data-env-tik=a3]')).toHaveAttribute('aria-pressed', 'true');
  await kok.locator('[data-env-tik=a1]').click();
  await expect(kok.locator('[data-env-tik=a1]')).toHaveAttribute('aria-pressed', 'true');
  await expect(kok.locator('.env-ozet')).toContainText('2/3');
  expect(await page.evaluate(() => window.__records.hocaGunSirasi[0].yapildi)).toEqual({ a3: true, a1: true });
  await kok.locator('[data-env-adim=a1] [data-env-ac]').click();
  await expect(kok.locator('.env-baslik')).toContainText('Örnek Talebe');
  await expect(kok.locator('.env-baslik')).toContainText('5–8 yaş');
});

test('Öğrenci listesi: dolu / eksik rozetleri, pasif öğrenci yok, deneme öğrencisi başlatılabilir', async ({ page, context }) => {
  const kok = await envAc(page, context, { records: { ogrenciEnvanteri: [tamBelge('TEST-1'), eksikBelge('TEST-2')] } });
  await listeAc(kok);
  await expect(kok.locator('.env-ogr-kart')).toHaveCount(3); // iki aktif öğrenci + deneme
  await expect(kok.locator('.env-ogr-kart', { hasText: 'Örnek Talebe' }).locator('.r-dolu')).toContainText('dolu');
  await expect(kok.locator('.env-ogr-kart', { hasText: 'İkinci Örnek' }).locator('.r-eksik')).toContainText('eksik');
  await expect(kok.locator('.env-ogr-kart', { hasText: 'Deneme öğrenci' }).locator('.r-yok')).toHaveCount(2);
  await expect(kok.getByText('Pasif Öğrenci')).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).include('[data-hoca-envanter]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
});

test('Kâğıttan aktarılan belge açılınca değerlerini gösterir; hoca işareti aynı belgeye yazılır, sürüm artar, kimlik alanları yeniden yazılmaz', async ({ page, context }) => {
  const kok = await envAc(page, context, { records: { ogrenciEnvanteri: [eksikBelge('TEST-2')] } });
  await listeAc(kok);
  await kok.locator('.env-ogr-kart', { hasText: 'İkinci Örnek' }).locator('[data-env-ac]').click();
  await kok.locator('[data-env-sayfa="2"]').click();
  await expect(kok.locator('.env-ozet')).toContainText('Öğrenci 3/');
  await expect(kok.locator('.env-ozet')).toContainText('kâğıt formdan aktarılmış');
  await expect(satir(kok, 'd-euzu-besmele').locator('[data-ben][data-deger="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(satir(kok, 'd-kelime-i-tevhid').locator('[data-ben][data-deger="2"]')).toHaveAttribute('aria-pressed', 'true');
  await satir(kok, 'd-euzu-besmele').locator('[data-hoca-d][data-deger="2"]').click();
  await expect(satir(kok, 'd-kelime-i-tevhid')).toBeInViewport();      // sonraki satıra kayar
  await expect.poll(async () => (await yazimlar(page)).length).toBe(1);
  const [w] = await yazimlar(page);
  expect(w.yol).toBe('ogrenciEnvanteri/TEST-2_2026-10-31_9-13');
  expect(w.veri).toMatchObject({ hoca: { 'd-euzu-besmele': 2 }, surum: 2, durum: 'baslandi' });
  expect(w.veri).not.toHaveProperty('kaynak');
  const k = await kayit(page, 'TEST-2_2026-10-31_9-13');
  expect(k.ben).toMatchObject({ 'd-euzu-besmele': 1, 'd-kelime-i-tevhid': 2, 's-fatiha': 0 }); // eski öğrenci değerleri korunur
  await satir(kok, 'd-euzu-besmele').locator('[data-hoca-d][data-deger="2"]').click(); // aynı değere ikinci dokunuş: siler
  await expect.poll(async () => (await yazimlar(page)).length).toBe(2);
  expect((await kayit(page, 'TEST-2_2026-10-31_9-13')).hoca).toEqual({});
  expect((await kayit(page, 'TEST-2_2026-10-31_9-13')).surum).toBe(3);
});

test('Öğrenci kipi: kilitli tam ekran, hoca sütunu yok, tek dokunuş ilerler ve yazımlar birleşir; 2 sn basılı tutma çıkarır', async ({ page, context }) => {
  const kok = await envAc(page, context);
  await listeAc(kok);
  await kok.locator('.env-ogr-kart', { hasText: 'Deneme öğrenci' }).locator('[data-env-ac][data-grup="9-13"]').click();
  await expect(kok.locator('.env-baslik')).toContainText('Deneme öğrenci');
  await page.locator('[data-env-ogr-ac]').click();
  const ogr = page.locator('.env-ogr');
  await expect(ogr).toBeVisible();
  await expect(ogr.locator('[data-hoca-d]')).toHaveCount(0);
  await expect(ogr.locator('.env-sutun')).toHaveCount(0);
  await expect(ogr).not.toContainText('Örnek Talebe');
  await expect(ogr.locator('.env-sayac')).toHaveText(`0/${S913.length}`);
  await expect(ogr.locator('.env-yuz').first()).toContainText('Bilmiyorum');
  await expect(ogr.locator('.env-yuz').first()).toContainText('Je ne sais pas');
  const [a, b, c] = S913;
  await satir(ogr, a).locator('[data-ben][data-deger="2"]').click();
  await expect(satir(ogr, b)).toBeInViewport();
  await satir(ogr, b).locator('[data-ben][data-deger="0"]').click();
  await satir(ogr, c).locator('[data-ben][data-deger="1"]').click();
  await expect(ogr.locator('.env-sayac')).toHaveText(`3/${S913.length}`);
  await expect.poll(async () => (await yazimlar(page)).length).toBeGreaterThan(0);
  await page.waitForTimeout(1300);
  const w = await yazimlar(page);
  expect(w.length).toBeLessThanOrEqual(2);          // dokunuşlar birleşir (saniyede en çok bir yazım)
  expect(w.map((x) => x.veri.surum)).toEqual(w.map((_, i) => i + 1));
  expect(w[0].yol).toBe(`ogrenciEnvanteri/TEST-ENVANTER_${bugun}_9-13`);
  expect(w[0].veri).toMatchObject({ ref: 'TEST-ENVANTER', tarih: bugun, grup: '9-13', kaynak: 'online', durum: 'baslandi' });
  expect((await kayit(page, `TEST-ENVANTER_${bugun}_9-13`)).ben).toEqual({ [a]: 2, [b]: 0, [c]: 1 });
  // kilit: sekme değişmez, yalnız basılı tutma çıkarır
  await page.evaluate(() => document.querySelector('[data-sekme=ezber]').click());
  await expect(page.locator('#hoca-tab-envanter')).toHaveAttribute('aria-selected', 'true');
  await ogr.locator('[data-env-bitti]').scrollIntoViewIfNeeded();
  await ogr.locator('[data-env-bitti]').click();
  await expect(ogr).toContainText('Telefonu hocana ver');
  await expect(ogr).toContainText('Rends le téléphone');
  await expect(ogr).not.toContainText('Benim hedeflerim'); // program yok
  expect((await kayit(page, `TEST-ENVANTER_${bugun}_9-13`)).durum).toBe('ogrenci-bitti');
  const kilit = ogr.locator('[data-env-kilit]');
  const kutu = await kilit.boundingBox();
  await page.mouse.move(kutu.x + kutu.width / 2, kutu.y + kutu.height / 2);
  await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up();
  await expect(ogr).toBeVisible();                   // kısa basış çıkarmaz
  await page.mouse.down(); await page.waitForTimeout(2300);
  await page.mouse.up();
  await expect(ogr).toHaveCount(0);
  await expect(kok.locator('.env-baslik')).toContainText('Deneme öğrenci');
  await expect(kok.locator('.env-ozet')).toContainText('Öğrenci 3/');
});

test('Program kartı: hoca görür; çocuk “Benim hedeflerim / Mes objectifs” yalnız durum onaylıysa görür', async ({ page, context }) => {
  const kok = await envAc(page, context, { records: {
    ogrenciEnvanteri: [tamBelge('TEST-1'), tamBelge('TEST-2')], ogrenciProgrami: [program('TEST-1', 'onayli'), program('TEST-2', 'taslak')] } });
  await listeAc(kok);
  await kok.locator('.env-ogr-kart', { hasText: 'Örnek Talebe' }).locator('[data-env-ac]').click();
  await kok.locator('[data-env-program]').click();
  await expect(kok.locator('.env-program')).toContainText('Akıcı okuma');
  await expect(kok.locator('.env-program')).toContainText('onaylı');
  await page.locator('[data-env-ogr-ac]').click();
  const ogr = page.locator('.env-ogr');
  await ogr.locator('[data-env-bitti]').scrollIntoViewIfNeeded();
  await ogr.locator('[data-env-bitti]').click();
  await ogr.locator('[data-env-hedef]').click();
  await expect(ogr).toContainText('Benim hedeflerim');
  await expect(ogr).toContainText('Mes objectifs');
  await expect(ogr).toContainText('Bu ay Fâtiha’yı güzel okuyacağız.');
  await expect(ogr).toContainText('Ce mois-ci, nous lirons bien la Fâtiha.');
  await ogr.locator('[data-env-hedef-kapat]').click();
  const kilit = await ogr.locator('[data-env-kilit]').boundingBox();
  await page.mouse.move(kilit.x + kilit.width / 2, kilit.y + kilit.height / 2);
  await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
  await expect(ogr).toHaveCount(0);
  await kok.locator('[data-env-geri]').click();
  await kok.locator('.env-ogr-kart', { hasText: 'İkinci Örnek' }).locator('[data-env-ac]').click();
  await page.locator('[data-env-ogr-ac]').click();
  await ogr.locator('[data-env-bitti]').scrollIntoViewIfNeeded();
  await ogr.locator('[data-env-bitti]').click();
  await expect(ogr).toContainText('Telefonu hocana ver');
  await expect(ogr.locator('[data-env-hedef]')).toHaveCount(0); // taslak program çocuğa gösterilmez
});

test('5–8: hoca çocuk adına işaretler, okuma basamağı, “Bu sayfayı dinledim” ve parmak çizimi (≤ 150 kB) kaydedilir', async ({ page, context }) => {
  const kok = await envAc(page, context);
  await listeAc(kok);
  await kok.locator('.env-ogr-kart', { hasText: 'Deneme öğrenci' }).locator('[data-env-ac][data-grup="5-8"]').click();
  await expect(page.locator('[data-env-ogr-ac]')).toHaveCount(0);   // 5–8 için öğrenci kipi yok: hoca sorar
  await kok.locator('[data-okuma-bas="2"]').click();
  await satir(kok, 'd-euzu-besmele').locator('[data-ben][data-deger="1"]').click();
  await expect(satir(kok, 'd-kelime-i-tevhid')).toBeInViewport();
  await kok.locator('[data-env-sayfa="2"]').click();
  await kok.locator('[data-kutu="dil"][data-sec="fr"]').click();
  await kok.locator('[data-metin="ilahi"]').fill('Ilahi Deneme');
  const tuval = kok.locator('[data-env-tuval]');
  await tuval.scrollIntoViewIfNeeded();
  const k = await tuval.boundingBox();
  await page.mouse.move(k.x + 20, k.y + 20); await page.mouse.down();
  await page.mouse.move(k.x + 120, k.y + 90, { steps: 8 }); await page.mouse.move(k.x + 200, k.y + 40, { steps: 8 }); await page.mouse.up();
  await kok.locator('[data-env-dinledim="2"]').click();
  await page.waitForTimeout(1400);
  const d = await kayit(page, `TEST-ENVANTER_${bugun}_5-8`);
  expect(d).toMatchObject({ grup: '5-8', kaynak: 'online', okuma: { basamak: 2 }, kutular: { dil: ['fr'] }, metin: { ilahi: 'Ilahi Deneme' }, sayfaDinlendi: { 2: true } });
  expect(d.ben).toEqual({ 'd-euzu-besmele': 1 });
  expect(d.cizim).toMatch(/^data:image\/png;base64,/);
  expect(d.cizim.length).toBeLessThanOrEqual(200000);
  const w = await yazimlar(page);
  expect(w.map((x) => x.veri.surum)).toEqual(w.map((_, i) => i + 1));
});

test('Çakışma: sunucu yazımı reddederse son hâl yüklenir ve açık uyarı verilir (sessizce ezmez)', async ({ page, context }) => {
  const kok = await envAc(page, context, { records: { ogrenciEnvanteri: [eksikBelge('TEST-2')] } });
  await listeAc(kok);
  await kok.locator('.env-ogr-kart', { hasText: 'İkinci Örnek' }).locator('[data-env-ac]').click();
  await kok.locator('[data-env-sayfa="2"]').click();
  await page.evaluate(() => { window.__ezberReddet = { kod: 'permission-denied' }; });
  await satir(kok, 'd-euzu-besmele').locator('[data-hoca-d][data-deger="1"]').click();
  await expect(kok.locator('[data-env-bilgi]')).toContainText('başka bir cihazda değişti', { timeout: 6000 });
  await expect(satir(kok, 'd-euzu-besmele').locator('[data-hoca-d][aria-pressed="true"]')).toHaveCount(0); // sunucudaki hâl: hoca sütunu boş
  expect((await kayit(page, 'TEST-2_2026-10-31_9-13')).surum).toBe(1);
});

test('360 px genişlikte yatay taşma yok; yüz düğmeleri ve seçenekler ≥ 56 px', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const kok = await envAc(page, context, { records: { ogrenciEnvanteri: [eksikBelge('TEST-2')] } });
  await listeAc(kok);
  await kok.locator('.env-ogr-kart', { hasText: 'İkinci Örnek' }).locator('[data-env-ac]').click();
  const olc = async (kap, secici) => kap.locator(secici).evaluateAll((l) => l.filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const v of await olc(kok, '.env-dugme, .env-sayfa-dugme')) expect(v).toBeGreaterThanOrEqual(56);
  await kok.locator('[data-env-sayfa="2"]').click();
  for (const v of await olc(kok, '.env-yuz')) expect(v).toBeGreaterThanOrEqual(56);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await kok.locator('[data-env-sayfa="1"]').click();
  for (const v of await olc(kok, '.env-secenek')) expect(v).toBeGreaterThanOrEqual(56);
  await page.locator('[data-env-ogr-ac]').click();
  const ogr = page.locator('.env-ogr');
  for (const v of await olc(ogr, '.env-yuz, .env-secenek, .env-kilit')) expect(v).toBeGreaterThanOrEqual(56);
  expect(await ogr.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  expect(await ogr.locator('.env-ogr-liste').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  const axe = await new AxeBuilder({ page }).include('.env-ogr').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
});
