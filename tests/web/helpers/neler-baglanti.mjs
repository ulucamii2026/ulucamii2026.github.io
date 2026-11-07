import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { firestoreTam } from './mektep.mjs';

/* «Neler biliyorum?» bağlantı sayfası (hoca kipi) için ortak test iskelesi. Gerçek derlenmiş sayfa iskeleti (dist/neler-biliyorum) +
   gerçek src/scripts/envanter-baglanti.ts, sahte tam SDK (mektep.mjs → firestoreTam). Gerçek anahtar/öğrenci verisi YOK. */

export const K = 'Hk9Z'.repeat(8); // 32 karakter, anahtar biçimine uyar (sahte)
export const BUGUN = '2026-11-07';
export const M = JSON.parse(readFileSync('src/data/ogrenci-envanteri/maddeler.json', 'utf8'));
export const satirlar = (g) => M.gruplar[g].sayfalar.flatMap((s) => s.bolumler.flatMap((b) => b.satirlar.map((x) => x.id)));
export const OGRENCILER = [
  { ref: 'T-1', ad: 'Ayşe', soyad: 'A' }, { ref: 'T-2', ad: 'Burak', soyad: 'B' }, { ref: 'T-3', ad: 'Çağla', soyad: 'C' },
  { ref: 'T-4', ad: 'Davut', soyad: 'D' }, { ref: 'T-5', ad: 'Elif', soyad: 'E' }, { ref: 'T-6', ad: 'Özge', soyad: 'Ö' },
  { ref: 'T-7', ad: 'Ibrahim', soyad: 'I' }, { ref: 'T-8', ad: 'Zeynep', soyad: 'Z' },
];
export const baglantiBelgesi = (o = {}) => ({ id: K, gun: BUGUN, bitis: '2026-11-30T22:59:59Z', ogrenciler: OGRENCILER, ...o });
const S913 = satirlar('9-13');
/** T-1 tamam, T-2 yarım (hoca 3 satır), T-3 yalnız başlamış (ben 2), diğerleri hiç. */
export const KAYITLAR = [
  { id: `T-1_2026-11-01_9-13`, ref: 'T-1', tarih: '2026-11-01', grup: '9-13', kaynak: 'online', ben: Object.fromEntries(S913.map((x) => [x, 1])), hoca: Object.fromEntries(S913.map((x) => [x, 2])), durum: 'tamam', surum: 3 },
  { id: `T-2_2026-11-01_9-13`, ref: 'T-2', tarih: '2026-11-01', grup: '9-13', kaynak: 'online', ben: Object.fromEntries(S913.map((x) => [x, 1])), hoca: Object.fromEntries(S913.slice(0, 3).map((x) => [x, 2])), durum: 'ogrenci-bitti', surum: 2 },
  { id: `T-3_2026-11-01_9-13`, ref: 'T-3', tarih: '2026-11-01', grup: '9-13', kaynak: 'online', ben: Object.fromEntries(S913.slice(0, 2).map((x) => [x, 0])), hoca: {}, durum: 'baslandi', surum: 1 },
];

/** firestoreTam + getDoc sarmalayıcısı: window.__okumaHatasi kodu verilirse okuma o kodla fırlatır; her getDoc window.__getDocYollari'na yazılır. */
const SAHTE_SDK = firestoreTam.replace('export const getDoc=async ref=>anlik({ref});',
  "export const getDoc=async ref=>{(window.__getDocYollari||=[]).push(ref.col+'/'+ref.id);if(window.__okumaHatasi)throw Object.assign(new Error('x'),{code:window.__okumaHatasi});return anlik({ref});};");
if (SAHTE_SDK === firestoreTam) throw new Error('getDoc kalıbı değişmiş: helpers/mektep.mjs');

let paket;
export async function derle() {
  if (paket) return paket;
  const r = await build({
    entryPoints: ['src/scripts/envanter-baglanti.ts'], bundle: true, write: false, format: 'iife', globalName: 'BaglantiTest', logLevel: 'silent',
    plugins: [{ name: 'sahte-firebase', setup(b) {
      b.onResolve({ filter: /^(firebase\/|\.\.\/lib\/firebase$)/ }, (a) => ({ path: a.path, namespace: 'test' }));
      b.onLoad({ filter: /.*/, namespace: 'test' }, (a) => ({ loader: 'js', contents: a.path === 'firebase/firestore' ? SAHTE_SDK : 'export const firebaseUygulamasi = () => ({});' }));
    } }],
  });
  paket = r.outputFiles[0].text;
  return paket;
}

/** `veri` bağlantı belgesi; `kayitlar` envanterBaglanti/{K}/kayitlar; `sira` günün sırası (gunSirasi/{BUGUN}); `onYukle` sayfa betiğinden önce çalışır. */
export async function sayfaAc(page, context, { veri = baglantiBelgesi(), kayitlar = KAYITLAR, sira, hash = `#k=${K}`, onYukle } = {}) {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  const html = readFileSync('dist/neler-biliyorum/index.html', 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  await context.route('http://127.0.0.1:4401/neler-test/', (r) => r.fulfill({ contentType: 'text/html', body: html }));
  await page.clock.install({ time: new Date(`${BUGUN}T09:00:00Z`) });
  await page.goto(`/neler-test/${hash}`);
  await page.evaluate(({ veri, kayitlar, sira, K, BUGUN }) => {
    window.__records = { envanterBaglanti: veri ? [veri] : [], [`envanterBaglanti/${K}/kayitlar`]: kayitlar.map((x) => ({ ...x })), [`envanterBaglanti/${K}/gunSirasi`]: sira ? [{ id: BUGUN, ...sira }] : [] };
  }, { veri, kayitlar, sira, K, BUGUN });
  if (onYukle) await page.evaluate(onYukle);
  await page.addScriptTag({ content: await derle() });
  await page.evaluate(() => window.BaglantiTest.baglantiEnvanteri());
  return page.locator('[data-baglanti-envanter]');
}
export const yazimlar = (page) => page.evaluate(() => (window.__ezberYazimlar || []).flat().filter((o) => o.yol.includes('/kayitlar/')));
export const kayit = (page, id) => page.evaluate((i) => (window.__records[`envanterBaglanti/${i.k}/kayitlar`] || []).find((x) => x.id === i.id), { k: K, id });
