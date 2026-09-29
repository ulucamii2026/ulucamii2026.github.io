/**
 * Cami ekranı istemci paketini üretir → public/ekran/ (üretilen çıktı; .gitignore'da, her derlemede yenilenir).
 *
 * Neden ayrı paket: ekran ikinci el Android TV kutularının WebView'ünde çalışır; hesapsız kurulan
 * Android 9 kutusunda WebView Chromium 70 civarında kalabilir. Sitenin Vite/Tailwind 4 çıktısı yeni
 * tarayıcı ister; esbuild bu paketin SÖZDİZİMİNİ chrome70'e indirir (API'ler inmez — src/ekran/ ve
 * src/lib/ekran/ yalnız Chromium 70'te olan API'leri kullanır; tests/ekran-eski-tarayici.test.mjs denetler).
 * Renkler kurumsal kimlik dosyasından CSS değişkeni olarak eklenir (elle renk yazılmaz).
 * Arapça yüzlerin @font-face kuralları src/ekran/yazi-tipleri.json'dan üretilir.
 *
 * Kullanım: node scripts/ekran-derle.mjs [--izle]   (npm run build ve npm run dev bunu önce çalıştırır)
 */
import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ORTAK, swAyari } from './ekran-damga.mjs';

const yol = (p) => fileURLToPath(new URL('../' + p, import.meta.url));
const CIKTI = yol('public/ekran/');

/* Eski derlemelerden kalan yazı tipi dosyaları dist'e sızmasın diye klasör her seferinde sıfırlanır. */
rmSync(CIKTI + 'fonts', { recursive: true, force: true });
mkdirSync(CIKTI + 'fonts', { recursive: true });
const FONTLAR = {
  'work-sans-latin.woff2': 'node_modules/@fontsource-variable/work-sans/files/work-sans-latin-wght-normal.woff2',
  'work-sans-latin-ext.woff2': 'node_modules/@fontsource-variable/work-sans/files/work-sans-latin-ext-wght-normal.woff2',
};
/* Arapça yüzler src/ekran/yazi-tipleri.json'dan (rol → dosya, kaynak, satır yüksekliği, boyut katsayısı). Kur'an
   metni (ayet, Kur'an duası; slaytlar.ts → data-yuz="kuran") 'Ekran Kuran', öteki Arapça 'Ekran Metin' ile yazılır. */
const YUZLER = JSON.parse(readFileSync(yol('src/ekran/yazi-tipleri.json'), 'utf8'));
for (const y of Object.values(YUZLER)) FONTLAR[y.dosya] = y.kaynak;
for (const [ad, kaynak] of Object.entries(FONTLAR)) copyFileSync(yol(kaynak), CIKTI + 'fonts/' + ad);
const ARAPCA_ARALIK = 'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC';
const yuzKurallari = Object.values(YUZLER)
  .map((y) => `@font-face { font-family: '${y.aile}'; font-style: normal; font-weight: 400; font-display: swap; src: url(fonts/${y.dosya}) format('woff2'); unicode-range: ${ARAPCA_ARALIK}; }\n`)
  .join('');
const yuzDegiskenleri = `:root{--lh-kuran:${YUZLER.kuran.satirYuksekligi};--lh-metin:${YUZLER.metin.satirYuksekligi};--k-kuran:${YUZLER.kuran.boyutKatsayisi};--k-metin:${YUZLER.metin.boyutKatsayisi}}\n`;

const kimlik = JSON.parse(readFileSync(yol('src/data/kurumsal-kimlik.json'), 'utf8'));
const r = kimlik.gorunum.ortakRenk;
const cami = kimlik.kurumlar.cami.renk;
const degiskenler = `:root{--ana:${cami.ana};--siyah:${cami.koyu};--beyaz:${cami.acik};--zemin:${r.zemin};--yuzey:${r.acikYuzey};--metin:${r.metin};--ikincil:${r.ikincil};--cizgi:${r.cizgi}}\n`;
writeFileSync(CIKTI + 'ekran.css', degiskenler + yuzDegiskenleri + yuzKurallari + readFileSync(yol('src/ekran/ekran.css'), 'utf8'));

const paketler = [{ ...ORTAK, entryPoints: [yol('src/ekran/main.ts')], outfile: CIKTI + 'ekran.js' }];

/* public/ekran/sw.js yalnız geliştirme (astro dev) içindir: her çalıştırmada yeni bir yerel damga, tarayıcı yeni
   paketi alır. Yayımlanan dist/ekran/sw.js'in damgası derleme SONUNDA ekran dosyalarının içerik özetinden gelir
   (scripts/ekran-damga.mjs; astro.config.mjs → ekran-sw-damgasi): ekran dosyaları değişmeyen bir yayın kutuya yeni
   SW kurdurmaz, ekranı yenilemez. */
paketler.push(swAyari('yerel-' + Date.now().toString(36), { outfile: CIKTI + 'sw.js' }));

if (process.argv.includes('--izle')) {
  for (const p of paketler) await (await context(p)).watch();
  console.log('[ekran] paket izleniyor (CSS değişince betiği yeniden çalıştırın)…');
} else {
  await Promise.all(paketler.map((p) => build(p)));
  console.log('[ekran] paket hazır → public/ekran/');
}
