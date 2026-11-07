import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { firestoreTam } from './helpers/mektep.mjs';

/* «Neler biliyorum?» bağlantı sayfası — EV KİPİ (1 Kasım 2026): velinin tek öğrencilik bağlantısı
   (`envanterBaglanti/{k}` belgesinde kip:'ev', grup, dil). Gerçek derlenmiş sayfa iskeleti (dist/neler-biliyorum) + gerçek
   src/scripts/envanter-baglanti.ts, sahte tam SDK (tests/web/helpers/mektep.mjs → firestoreTam; veri window.__records,
   her toplu yazım window.__ezberYazimlar). Odak: hoca alanı HİÇ çizilmez/yazılmaz, yazılan belge mevcut biçimde kalır,
   Bitti → 'ogrenci-bitti' + son ekran (bekleyen yazımda “gönderiliyor”), yardım kartı dil sırası, hoca olmayan bağlantı değişmedi. */

const M = JSON.parse(readFileSync('src/data/ogrenci-envanteri/maddeler.json', 'utf8'));
const satirlar = (g) => M.gruplar[g].sayfalar.flatMap((s) => s.bolumler.flatMap((b) => b.satirlar.map((x) => x.id)));
const S913 = satirlar('9-13');
const S58 = satirlar('5-8');
const K = 'AbC1'.repeat(8); // 32 karakter, anahtar biçimine uyar
const bugun = '2026-11-01';
const yol = (g, ref = 'EV-1') => `envanterBaglanti/${K}/kayitlar/${ref}_${bugun}_${g}`;
// kural (firestore.rules envVeri) hasOnly listesi: bunun dışında alan yazılamaz
const KURAL_ALANLARI = ['ref', 'tarih', 'grup', 'kaynak', 'ben', 'hoca', 'kutular', 'metin', 'okuma', 'okuma_notlari', 'cizim', 'sayfaDinlendi', 'durum', 'surum', 'guncelleme', 'kaydeden'];
const HOCA_ALANLARI = ['hoca', 'okuma', 'okuma_notlari', 'sayfaDinlendi'];
const bag = (o = {}) => ({ id: K, gun: bugun, refler: ['EV-1'], ogrenciler: [{ ref: 'EV-1', ad: 'Elif', soyad: 'K' }], ...o });
const ev = (grup, dil = 'tr') => bag({ kip: 'ev', grup, dil });

let paket;
async function derle() {
  if (paket) return paket;
  const r = await build({
    entryPoints: ['src/scripts/envanter-baglanti.ts'], bundle: true, write: false, format: 'iife', globalName: 'BaglantiTest', logLevel: 'silent',
    plugins: [{ name: 'sahte-firebase', setup(b) {
      b.onResolve({ filter: /^(firebase\/|\.\.\/lib\/firebase$)/ }, (a) => ({ path: a.path, namespace: 'test' }));
      b.onLoad({ filter: /.*/, namespace: 'test' }, (a) => ({ loader: 'js', contents: a.path === 'firebase/firestore' ? firestoreTam : 'export const firebaseUygulamasi = () => ({});' }));
    } }],
  });
  paket = r.outputFiles[0].text;
  return paket;
}

async function sayfaAc(page, context, { veri, records = {}, hash = `#k=${K}`, dil } = {}) {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  const html = readFileSync('dist/neler-biliyorum/index.html', 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  await context.route('http://127.0.0.1:4401/neler-test/', (r) => r.fulfill({ contentType: 'text/html', body: html }));
  await page.clock.install({ time: new Date(`${bugun}T09:00:00Z`) });
  await page.goto(`/neler-test/${hash}`);
  await page.evaluate(({ veri, records }) => {
    window.__records = { ...records, envanterBaglanti: veri ? [veri] : [] };
  }, { veri, records });
  await page.addScriptTag({ content: await derle() });
  await page.evaluate(() => window.BaglantiTest.baglantiEnvanteri());
  void dil;
  return page.locator('[data-baglanti-envanter]');
}
const yazimlar = (page) => page.evaluate(() => (window.__ezberYazimlar || []).flat().filter((o) => o.yol.startsWith('envanterBaglanti/') && o.yol.includes('/kayitlar/')));
const kayit = (page, id) => page.evaluate((i) => (window.__records[`envanterBaglanti/${i.k}/kayitlar`] || []).find((x) => x.id === i.id), { k: K, id });
const satir = (kap, id) => kap.locator(`[data-satir="${id}"]`);
const HOCA_METINLERI = ['Bugün', 'Öğrenciler', 'Deneme öğrenci', 'Hoca (dinledim', 'Hocanın notu', 'Doğrulama tarihi', 'Bu sayfayı dinledim', 'Formu tamamlandı say', 'Kişisel program', 'başlat', 'Telefonu hocana ver'];

async function hocaAlaniYok(page, kok) {
  for (const m of HOCA_METINLERI) await expect(kok, `“${m}” görünmemeli`).not.toContainText(m);
  for (const s of ['[data-hoca-d]', '.env-sutun', '[data-okuma-bas]', '[data-okuma-sonraki]', '[data-okuma-not]', '[data-env-geri]', '[data-env-ogr-ac]', '[data-env-program]', '[data-env-tamam]', '[data-env-dinledim]', '[data-env-gorunum]', '[data-metin="hoca_notu"]', '[data-metin="dogrulama_tarihi"]']) {
    await expect(kok.locator(s), s).toHaveCount(0);
  }
  await expect(page.locator('.env-ogr')).toHaveCount(0); // kiosk katmanı yok
  await expect(page.locator('html')).not.toHaveClass(/env-kilitli/);
}
function belgeBicimi(d, grup) {
  expect(Object.keys(d).filter((k) => k !== 'id').every((k) => KURAL_ALANLARI.includes(k)), `kural dışı alan: ${Object.keys(d)}`).toBe(true);
  for (const a of HOCA_ALANLARI) expect(d, a).not.toHaveProperty(a);
  expect(d.hoca ?? {}).toEqual({});
  expect(d).toMatchObject({ grup, kaynak: 'online', ref: 'EV-1' });
}

test('9–13 TR: tek form doğrudan açılır, hoca alanı yok, yardım kartı TR önce, yazım mevcut biçimde, Bitti → ogrenci-bitti + son ekran, Geri dön düzeltir', async ({ page, context }) => {
  const kok = await sayfaAc(page, context, { veri: ev('9-13', 'tr') });
  await expect(kok.locator('.env-ev-baslik')).toContainText('Neler biliyorum? · Elif');
  await expect(kok.locator('.env-ev-baslik')).toContainText('/ Ce que je sais');
  await expect(kok).toHaveAttribute('lang', 'tr');
  await expect(kok.locator('[data-satir]')).toHaveCount(S913.length);
  await hocaAlaniYok(page, kok);
  // yardım kartı: varsayılan açık, TR önce
  await expect(kok.locator('details[data-env-yardim]')).toHaveJSProperty('open', true);
  expect(await kok.locator('[data-yardim-dil]').evaluateAll((l) => l.map((e) => e.dataset.yardimDil))).toEqual(['tr', 'fr']);
  await expect(kok.locator('[data-yardim-dil="tr"]')).toContainText('1. Her satırı oku ve sana en uygun yüzü seç. Doğrusu yanlışı yok.');
  await expect(kok.locator('[data-yardim-dil="tr"]')).toContainText('2. Bilmiyorsan «Bilmiyorum»u seç; ezberlerini derste hocan dinleyecek.');
  await expect(kok.locator('[data-yardim-dil="fr"]')).toContainText('2. Si tu ne sais pas, choisis « Je ne sais pas » ; ton enseignant écoutera tes récitations en classe.');
  await expect(kok.locator('details summary')).toContainText('Nasıl doldurulur?');
  await expect(kok.locator('details summary')).toContainText('Comment remplir ?');
  // satır TR + FR, bölüm «Kendimi tanıtıyorum / Je me présente»
  await expect(kok.locator('.env-yuz').first()).toContainText('Bilmiyorum');
  await expect(kok.locator('.env-yuz').first()).toContainText('Je ne sais pas');
  await expect(kok).toContainText('Kendimi tanıtıyorum');
  await expect(kok).toContainText('Je me présente');
  // yardım kartı kapatılınca durum hatırlanır
  await kok.locator('details summary').click();
  await expect(kok.locator('details[data-env-yardim]')).toHaveJSProperty('open', false);
  expect(await page.evaluate(() => localStorage.getItem('ulucamii-envanter-ev-yardim'))).toBe('kapali');
  // dokunuşlar
  const [a, b, c] = S913;
  await satir(kok, a).locator('[data-ben][data-deger="2"]').click();
  await satir(kok, b).locator('[data-ben][data-deger="0"]').click();
  await satir(kok, c).locator('[data-ben][data-deger="1"]').click();
  await kok.locator('[data-kutu="dil"][data-sec="fr"]').click();
  await expect.poll(async () => (await yazimlar(page)).length).toBeGreaterThan(0);
  await page.waitForTimeout(1400);
  const w = await yazimlar(page);
  expect(w.every((x) => x.yol === yol('9-13'))).toBe(true);
  expect(w[0].veri).toMatchObject({ ref: 'EV-1', tarih: bugun, grup: '9-13', kaynak: 'online', kaydeden: 'baglanti' });
  expect(w.map((x) => x.veri.surum)).toEqual(w.map((_, i) => i + 1));
  let d = await kayit(page, `EV-1_${bugun}_9-13`);
  expect(d.ben).toEqual({ [a]: 2, [b]: 0, [c]: 1 });
  expect(d.kutular).toEqual({ dil: ['fr'] });
  belgeBicimi(d, '9-13');
  expect(d.durum).toBe('baslandi');
  // Bitti
  await kok.locator('[data-env-ev-bitti]').scrollIntoViewIfNeeded();
  await kok.locator('[data-env-ev-bitti]').click();
  await expect(kok.locator('[data-env-ev-son]')).toContainText('Teşekkürler! Formun hocana ulaştı.');
  await expect(kok.locator('[data-env-ev-son]')).toContainText('Merci ! Ton formulaire est bien envoyé à ton enseignant.');
  await expect(kok.locator('[data-env-ev-son]')).toHaveAttribute('data-env-ev-son', 'tamam');
  await expect(kok.locator('[data-satir]')).toHaveCount(0);
  d = await kayit(page, `EV-1_${bugun}_9-13`);
  expect(d.durum).toBe('ogrenci-bitti');
  belgeBicimi(d, '9-13');
  // Geri dön, düzelt: form döner, durum aynı kalır, yeni düzenleme yine kaydedilir
  await kok.locator('[data-env-ev-geri]').click();
  await expect(kok.locator('[data-satir]')).toHaveCount(S913.length);
  await expect(satir(kok, a).locator('[data-ben][data-deger="2"]')).toHaveAttribute('aria-pressed', 'true');
  await satir(kok, a).locator('[data-ben][data-deger="1"]').click();
  await page.waitForTimeout(1400);
  d = await kayit(page, `EV-1_${bugun}_9-13`);
  expect(d.ben[a]).toBe(1);
  expect(d.durum).toBe('ogrenci-bitti');
  belgeBicimi(d, '9-13');
  // beforeunload: bekleyen yazım yokken uyarı yok
  await hocaAlaniYok(page, kok);
});

test('5–8 FR: 19 madde, yalnız çocuk sütunu, ilahi alanı veli etiketli, çizim kaydedilir, yardım kartı FR önce, son ekran 5–8 metni', async ({ page, context }) => {
  expect(S58.length).toBe(19);
  const kok = await sayfaAc(page, context, { veri: ev('5-8', 'fr') });
  await expect(kok).toHaveAttribute('lang', 'fr');
  await expect(kok.locator('[data-satir]')).toHaveCount(19);
  await hocaAlaniYok(page, kok);
  expect(await kok.locator('[data-yardim-dil]').evaluateAll((l) => l.map((e) => e.dataset.yardimDil))).toEqual(['fr', 'tr']);
  await expect(kok.locator('[data-yardim-dil="fr"]')).toContainText('1. Lisez chaque question à votre enfant et cochez sa réponse.');
  await expect(kok.locator('[data-yardim-dil="tr"]')).toContainText('4. Sonunda çocuğunuz sevdiği bir şeyi çizebilir; ardından «Bitti» düğmesine basın.');
  await expect(kok.locator('details summary').first()).toContainText('Comment remplir ?');
  // ilahi etiketi + çizim bölümü
  await expect(kok.locator('label.env-alan', { hasText: 'Bildiği ilahiler (isterseniz yazın)' })).toContainText('Chants religieux qu’il connaît (facultatif)');
  await expect(kok).not.toContainText('hocam yazar');
  await expect(kok).toContainText('En sevdiğim şeyi çiziyorum');
  await expect(kok).toContainText('Je dessine ce que j’aime le plus');
  await expect(kok.locator('[data-env-cizim-sil]')).toContainText('Çizimi sil');
  await satir(kok, 'd-euzu-besmele').locator('[data-ben][data-deger="1"]').click();
  await kok.locator('[data-metin="ilahi"]').fill('Ilahi Deneme');
  const tuval = kok.locator('[data-env-tuval]');
  await tuval.scrollIntoViewIfNeeded();
  const k = await tuval.boundingBox();
  await page.mouse.move(k.x + 20, k.y + 20); await page.mouse.down();
  await page.mouse.move(k.x + 120, k.y + 90, { steps: 8 }); await page.mouse.move(k.x + 200, k.y + 40, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(1400);
  let d = await kayit(page, `EV-1_${bugun}_5-8`);
  expect(d.ben).toEqual({ 'd-euzu-besmele': 1 });
  expect(d.metin).toEqual({ ilahi: 'Ilahi Deneme' });
  expect(d.cizim).toMatch(/^data:image\/png;base64,/);
  expect(d.cizim.length).toBeLessThanOrEqual(200000);
  belgeBicimi(d, '5-8');
  await kok.locator('[data-env-ev-bitti]').scrollIntoViewIfNeeded();
  await kok.locator('[data-env-ev-bitti]').click();
  await expect(kok.locator('[data-env-ev-son]')).toContainText('Teşekkürler! Form hocaya ulaştı.');
  await expect(kok.locator('[data-env-ev-son]')).toContainText('Merci ! Le formulaire est bien envoyé à l’enseignant.');
  d = await kayit(page, `EV-1_${bugun}_5-8`);
  expect(d.durum).toBe('ogrenci-bitti');
  belgeBicimi(d, '5-8');
  const w = await yazimlar(page);
  expect(w.map((x) => x.veri.surum)).toEqual(w.map((_, i) => i + 1));
});

test('Bitti çevrim dışıyken “gönderiliyor”, bağlantı gelince başarı metni; bekleyen yazımda sayfadan ayrılma uyarılır', async ({ page, context }) => {
  const kok = await sayfaAc(page, context, { veri: ev('9-13', 'tr') });
  await expect(kok.locator('[data-satir]')).toHaveCount(S913.length);
  await page.evaluate(() => window.__ezberBaglantiKes());
  await satir(kok, S913[0]).locator('[data-ben][data-deger="1"]').click();
  await kok.locator('[data-env-ev-bitti]').scrollIntoViewIfNeeded();
  await kok.locator('[data-env-ev-bitti]').click();
  await expect(kok.locator('[data-env-ev-son]')).toHaveAttribute('data-env-ev-son', 'bekliyor');
  await expect(kok.locator('[data-env-ev-son]')).toContainText('Kayıtlar gönderiliyor… İnternet gelince kendiliğinden gider, sayfayı kapatmayın.');
  await expect(kok.locator('[data-env-ev-son]')).toContainText('Envoi en cours… Les réponses partiront dès que la connexion revient ; ne fermez pas la page.');
  // bekleyen yazım varken beforeunload engellenir
  const engel = await page.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
  expect(engel).toBe(true);
  await page.evaluate(() => window.__ezberBaglan());
  await expect(kok.locator('[data-env-ev-son]')).toHaveAttribute('data-env-ev-son', 'tamam');
  await expect(kok.locator('[data-env-ev-son]')).toContainText('Teşekkürler! Formun hocana ulaştı.');
  expect((await kayit(page, `EV-1_${bugun}_9-13`)).durum).toBe('ogrenci-bitti');
  const engel2 = await page.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
  expect(engel2).toBe(false);
});

test('Aynı öğrenci + grup için bağlantıda belge varsa en yenisi sürdürülür (yeni belge açılmaz)', async ({ page, context }) => {
  const [a, b] = S913;
  const eski = { id: 'EV-1_2026-10-31_9-13', ref: 'EV-1', tarih: '2026-10-31', grup: '9-13', kaynak: 'online', ben: { [a]: 2 }, kutular: {}, metin: {}, durum: 'baslandi', surum: 3 };
  const kok = await sayfaAc(page, context, { veri: ev('9-13'), records: { [`envanterBaglanti/${K}/kayitlar`]: [eski] } });
  await expect(satir(kok, a).locator('[data-ben][data-deger="2"]')).toHaveAttribute('aria-pressed', 'true');
  await satir(kok, b).locator('[data-ben][data-deger="0"]').click();
  await page.waitForTimeout(1400);
  const w = await yazimlar(page);
  expect(w.length).toBeGreaterThan(0);
  expect(w.every((x) => x.yol === `envanterBaglanti/${K}/kayitlar/EV-1_2026-10-31_9-13`)).toBe(true);
  expect(w[0].veri.surum).toBe(4);
  expect(w[0].veri.ref).toBeUndefined(); // kimlik alanları var olan belgeye yeniden yazılmaz
  const d = await kayit(page, 'EV-1_2026-10-31_9-13');
  expect(d.ben).toEqual({ [a]: 2, [b]: 0 });
  belgeBicimi(d, '9-13');
});

test('Geçersiz ev belgesi (grup yok) hoca arayüzüne düşmez', async ({ page, context }) => {
  const kok = await sayfaAc(page, context, { veri: bag({ kip: 'ev', dil: 'tr' }) });
  await expect(kok.locator('[role=alert]')).toContainText('Bu bağlantı geçersiz');
  await expect(kok.locator('[data-env-gorunum]')).toHaveCount(0);
});

test('Ev kipi olmayan bağlantı değişmedi: Bugün / Öğrenciler görünümü ve hoca sütunu', async ({ page, context }) => {
  const kok = await sayfaAc(page, context, { veri: bag() });
  await expect(kok.locator('[data-env-gorunum=bugun]')).toBeVisible();
  await kok.locator('[data-env-gorunum=liste]').click();
  await kok.locator('[data-env-filtre=tumu]').click(); // bağlantıda varsayılan süzgeç «Kalan» (7 Kas 2026)
  await expect(kok.locator('.env-ogr-kart', { hasText: 'Deneme öğrenci' })).toHaveCount(1);
  await kok.locator('.env-ogr-kart', { hasText: 'Elif K' }).locator('[data-env-ac][data-grup="9-13"]').click();
  await expect(kok.locator('[data-env-ogr-ac]')).toBeVisible();
  await kok.locator('[data-env-sayfa="2"]').click();
  await expect(kok.locator('[data-hoca-d]').first()).toBeVisible();
  await expect(kok.locator('.env-sutun.hoca').first()).toContainText('Hoca (dinledim / gördüm)');
});
