/**
 * Cami ekranı service worker'ının sürüm damgası — yayımlanan ekran dosyalarının içerik özeti (28 Eylül 2026, Faz 2).
 *
 * Neden: damga eskiden derleme anıydı (Date.now). Sitenin her yayını (günde 2–4: iki gece koşusu + her push) kutuya
 * yeni bir SW kurduruyor ve ekranı rastgele saatlerde (Cuma öğlesi dâhil) yeniletiyordu. Artık damga yalnız SW'nin
 * önbelleğe aldığı ekran dosyaları (src/ekran/kabuk.json) ya da SW'nin kendi kodu değişince değişir.
 *
 * Neden derleme SONUNDA (astro.config.mjs → ekran-sw-damgasi, astro:build:done): kabuğun parçası olan sayfa iskeleti
 * (/ekran/ → dist/ekran/index.html) ancak Astro derlemesinde üretilir ve sayfa verisini (#ekran-veri: Cuma namazı
 * saati, konum, adlar) taşır. Sayfa ağdan önce gelse de aylarca açık kalan ekran onu ancak yeniden yüklenince okur:
 * örneğin Cuma saati değişince ekranın yenilenmesi için iskelet damgaya girmelidir. scripts/ekran-derle.mjs'in
 * public/ekran/'a yazdığı sw.js yalnız geliştirme (astro dev) içindir; dist/ekran/sw.js burada aynı ayarlarla
 * içerik damgasıyla yeniden derlenir.
 *
 * Damgaya GİRMEYENLER: üç veri akışı (/ekran/*.json). Ağdan önce gelirler, sayfa onları kendisi tazeler ve her
 * derlemede değişirler (derleme anı) — girselerdi damga yine her yayında değişirdi.
 */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const yol = (p) => fileURLToPath(new URL('../' + p, import.meta.url));

/** Ekran paketlerinin ortak esbuild ayarları (scripts/ekran-derle.mjs de kullanır): sözdizimi Chromium 70'e iner. */
export const ORTAK = { bundle: true, format: 'iife', target: ['chrome70'], minify: true, legalComments: 'none', logLevel: 'warning', charset: 'utf8' };

/** src/ekran/sw.ts'in esbuild ayarı; `damga` pakete __EKRAN_SURUM__ olarak gömülür (önbellek adı ekran-<damga>). */
export const swAyari = (damga, ek = {}) => ({ ...ORTAK, entryPoints: [yol('src/ekran/sw.ts')], define: { __EKRAN_SURUM__: JSON.stringify(damga) }, ...ek });

/** SW'nin önbelleğe aldığı dosyaların TEK listesi (sw.ts ve site denetimi de bunu okur). */
export const KABUK = JSON.parse(readFileSync(yol('src/ekran/kabuk.json'), 'utf8'));

/** Ağdan önce gelen ve sayfanın kendisinin tazelediği veri akışları damgaya girmez (sw.ts'teki ağ önce kalıbı). */
export const damgayaGirer = (u) => !/^\/ekran\/[^/]+\.json$/.test(u);

/** Kabuk yolunun derleme çıktısındaki dosyası: /ekran/ → ekran/index.html, gerisi kök + yol (site denetimiyle aynı). */
export const kabukDosyasi = (kok, u) => (u === '/ekran/' ? join(kok, 'ekran', 'index.html') : join(kok, ...u.replace(/^\//, '').split('/')));

/** [yol, içerik] çiftlerinden 16 haneli onaltılık özet (SHA-256). Yola göre sıralanır; her kaydın yolu ve bayt
 *  uzunluğu da özete girer, iki dosya arasındaki sınır kayamaz. */
export function ekranDamgasi(dosyalar) {
  const ozet = createHash('sha256');
  for (const [u, icerik] of [...dosyalar].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
    const bayt = Buffer.from(icerik);
    ozet.update(`${u}\0${bayt.length}\0`);
    ozet.update(bayt);
  }
  return ozet.digest('hex').slice(0, 16);
}

/** Derleme çıktısından (`kok` = dist/) damgayı hesaplar: kabuk dosyaları + sabit bir yer tutucu damgayla bellekte
 *  derlenen SW kodu (SW'nin kendi değişikliği de yeni damga verir). Kabuk dosyası eksikse durur: o dosya olmadan
 *  cache.addAll reddeder, yeni SW hiç kurulamazdı (site denetimi de bunu kritik sayar). */
export async function damgaHesapla(kok) {
  const dosyalar = KABUK.filter(damgayaGirer).map((u) => {
    try {
      return [u, readFileSync(kabukDosyasi(kok, u))];
    } catch {
      throw new Error(`[ekran] önbellek dosyası derleme çıktısında yok: ${u} (src/ekran/kabuk.json)`);
    }
  });
  const sw = await build(swAyari('yer-tutucu', { write: false }));
  dosyalar.push(['/ekran/sw.js', sw.outputFiles[0].contents]);
  return ekranDamgasi(dosyalar);
}

/** dist/ekran/sw.js'i içerik damgasıyla yeniden derler ve damgayı döner. */
export async function swDamgala(kok) {
  const damga = await damgaHesapla(kok);
  await build(swAyari(damga, { outfile: join(kok, 'ekran', 'sw.js') }));
  return damga;
}
