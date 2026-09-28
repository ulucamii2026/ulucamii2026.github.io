/**
 * Cami ekranı istemci paketini üretir → public/ekran/ (üretilen çıktı; .gitignore'da, her derlemede yenilenir).
 *
 * Neden ayrı paket: ekran ikinci el Android TV kutularının WebView'ünde çalışır; hesapsız kurulan
 * Android 9 kutusunda WebView Chromium 70 civarında kalabilir. Sitenin Vite/Tailwind 4 çıktısı yeni
 * tarayıcı ister; esbuild bu paketin SÖZDİZİMİNİ chrome70'e indirir (API'ler inmez — src/ekran/ ve
 * src/lib/ekran/ yalnız Chromium 70'te olan API'leri kullanır; tests/ekran-eski-tarayici.test.mjs denetler).
 * Renkler kurumsal kimlik dosyasından CSS değişkeni olarak eklenir (elle renk yazılmaz).
 *
 * Kullanım: node scripts/ekran-derle.mjs [--izle]   (npm run build ve npm run dev bunu önce çalıştırır)
 */
import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ORTAK, swAyari } from './ekran-damga.mjs';

const yol = (p) => fileURLToPath(new URL('../' + p, import.meta.url));
const CIKTI = yol('public/ekran/');

mkdirSync(CIKTI + 'fonts', { recursive: true });
const FONTLAR = {
  'work-sans-latin.woff2': 'node_modules/@fontsource-variable/work-sans/files/work-sans-latin-wght-normal.woff2',
  'work-sans-latin-ext.woff2': 'node_modules/@fontsource-variable/work-sans/files/work-sans-latin-ext-wght-normal.woff2',
  'amiri-arabic.woff2': 'node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff2',
};
for (const [ad, kaynak] of Object.entries(FONTLAR)) copyFileSync(yol(kaynak), CIKTI + 'fonts/' + ad);

const kimlik = JSON.parse(readFileSync(yol('src/data/kurumsal-kimlik.json'), 'utf8'));
const r = kimlik.gorunum.ortakRenk;
const cami = kimlik.kurumlar.cami.renk;
const degiskenler = `:root{--ana:${cami.ana};--siyah:${cami.koyu};--beyaz:${cami.acik};--zemin:${r.zemin};--yuzey:${r.acikYuzey};--metin:${r.metin};--ikincil:${r.ikincil};--cizgi:${r.cizgi}}\n`;
writeFileSync(CIKTI + 'ekran.css', degiskenler + readFileSync(yol('src/ekran/ekran.css'), 'utf8'));

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
