/**
 * egitim.ulucamii.be service worker'ının derlenmesi ve sürüm damgası (25 Ekim 2026, «çevrim dışı çalışma»).
 *
 * Kaynak egitim/src/sw/sw.ts'tir (esbuild ile tek dosyaya, /sw.js). Astro derlemesi bittikten SONRA (egitim/astro.config.mjs →
 * egitim-sw, astro:build:done) dist/sw.js yazılır; damga SW'nin sürümlü önbellek adına (`ezber-kabuk-<damga>`) gömülür.
 *
 * Damga neden bu içerikten: sürümlü önbelleğin dolduğu dosyalar SW'nin kurulumda önyüklediği yedek sayfalardır (kök ve beş dilin
 * `/<dil>/cevrimdisi/` sayfası; hepsi `_astro` dosyalarını özetli adlarıyla anar) ve SW'nin kendi kodudur. Bunlardan biri değişince yeni
 * sürüm kurulur, eski sürümlü önbellek silinir, kayıtlı maddelerin sayfaları yeni sürümde yeniden alınır. Hiçbiri değişmeyen bir yayın
 * (örneğin yalnız bir maddenin metni) kullanıcıya yeni SW kurdurmaz; açılmış sayfaların HTML'i zaten ağ önce tazelenir.
 * Önbellek dosyalarının hiçbiri özet adsız değildir (`_astro/**` özetli, yazı tipleri adı değişmeden kalmaz: docs/EGITIM-PLATFORMU.md «Önbellek»).
 *
 * Kurulum önyüklemesinde olması gereken dosyalar derlemede yoksa durur: eksik tek sayfa SW kurulumunu sonsuza dek reddettirirdi.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const yol = (p) => fileURLToPath(new URL('../' + p, import.meta.url));
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];

/** SW paketinin esbuild ayarı; `damga` pakete __SURUM__ olarak gömülür. Sözdizimi es2020: eski iOS Safari'de de çalışır. */
export const swAyari = (damga, ek = {}) => ({
  bundle: true, format: 'iife', target: ['es2020'], minify: true, legalComments: 'none', logLevel: 'warning', charset: 'utf8',
  entryPoints: [yol('egitim/src/sw/sw.ts')], define: { __SURUM__: JSON.stringify(damga) }, ...ek,
});

/** Kurulumda önyüklenen sayfaların derleme çıktısındaki dosyaları (sw.ts → ONYUKLEME_SAYFALARI ile aynı liste). */
export const onyuklemeDosyalari = (kok) => ['/', ...DILLER.map((d) => `/${d}/cevrimdisi/`)]
  .map((u) => [u, join(kok, ...u.split('/').filter(Boolean), 'index.html')]);

/** Derleme çıktısından (`kok` = egitim/dist) damga: yedek sayfalar + sabit yer tutucuyla bellekte derlenen SW kodu. */
export async function damgaHesapla(kok) {
  const ozet = createHash('sha256');
  const sw = await build(swAyari('yer-tutucu', { write: false }));
  ozet.update(sw.outputFiles[0].contents);
  for (const [u, dosya] of onyuklemeDosyalari(kok)) {
    if (!existsSync(dosya)) throw new Error(`[egitim-sw] önyükleme sayfası derleme çıktısında yok: ${u}`);
    ozet.update(`\0${u}\0`).update(readFileSync(dosya));
  }
  return ozet.digest('hex').slice(0, 16);
}

/** dist/sw.js'i damgayla yazar ve damgayı döner. */
export async function swDamgala(kok) {
  const damga = await damgaHesapla(kok);
  await build(swAyari(damga, { outfile: join(kok, 'sw.js') }));
  return damga;
}
