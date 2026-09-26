/**
 * SVG denetimi (26 Eylül 2026, Ezber Kilimi Faz 0).
 *
 * Neden: Ezber Kilimi'nin çizimlerini Codex saf vektör olarak üretiyor ve bu çizimler
 * sayfaya SATIR İÇİ gömülüyor. Satır içi SVG sayfanın parçasıdır: içindeki <style> bütün
 * sayfayı boyar, <script> ve on* olayları çalışır, dış href ziyaretçiyi başka sunucuya
 * bağlar, iki çizimdeki aynı kimlik (id) birbirinin degradesini ezer. Vektör önceliği
 * kuralı da raster gömmeyi (<image>, data:) yasaklar; yazı ise her zaman gerçek metindir —
 * Arapça ya da başka bir yazı çizimin içine konmaz.
 *
 * Kurallar:
 *   - geçerli XML; kök <svg> viewBox taşır, width/height taşımaz
 *   - yasak öğeler: script, style, image, foreignObject, text/tspan/textPath, iframe,
 *     animate/animateMotion/animateTransform/set (hareket CSS'le ve azaltılmış hareket
 *     tercihine uyarak verilir)
 *   - yasak öznitelikler: on* olayları; # ile başlamayan href / xlink:href
 *   - yasak içerik: data:, javascript:, @import, # ile başlamayan url(...)
 *   - her kimlik «<dosya-kökü>__» önekiyle başlar (--iyilestir bunu kendisi ekler)
 *   - boyut sınırı (varsayılan 12 KB)
 *
 * Kullanım:
 *   node scripts/svg-denetim.mjs                → varsayılan çizim klasörlerini denetler
 *   node scripts/svg-denetim.mjs <yol>...       → verilen dosya ya da klasörleri denetler
 *   node scripts/svg-denetim.mjs --iyilestir …  → önce svgo ile küçültür + kimlik öneki ekler
 *                                                 (dosyanın üzerine yazar), sonra denetler
 *   --sinir <bayt>                              → boyut sınırı (varsayılan 12288)
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { optimize } from 'svgo';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const VARSAYILAN_KLASORLER = ['src/assets/cizim', 'egitim/src/assets/cizim'];
export const VARSAYILAN_SINIR = 12 * 1024;

const YASAK_OGELER = ['script', 'style', 'image', 'foreignObject', 'text', 'tspan', 'textPath', 'iframe',
  'animate', 'animateMotion', 'animateTransform', 'set'];

/** «Ş-Fâtiha Motif.svg» → «s-fatiha-motif»: kimlik öneki olarak güvenli dosya kökü. */
export function dosyaKokuOf(dosyaYolu) {
  return basename(dosyaYolu).replace(/\.svg$/i, '')
    .toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'cizim';
}

/** Bir SVG metnindeki sorunların listesi (boş liste = temiz). */
export function svgSorunlari(icerik, { dosyaKoku = 'cizim', sinir = VARSAYILAN_SINIR } = {}) {
  const sorunlar = [];
  const bayt = Buffer.byteLength(icerik, 'utf8');
  if (bayt > sinir) sorunlar.push(`boyut ${bayt} bayt > sınır ${sinir}`);

  try {
    optimize(icerik, { plugins: [] });
  } catch (hata) {
    sorunlar.push(`XML ayrıştırılamadı: ${String(hata.message ?? hata).split('\n')[0]}`);
    return sorunlar;
  }

  const kokEtiket = icerik.match(/<svg\b[^>]*>/i)?.[0];
  if (!kokEtiket) {
    sorunlar.push('kök <svg> öğesi yok');
  } else {
    if (!/\sviewBox\s*=/.test(kokEtiket)) sorunlar.push('kök <svg> viewBox taşımıyor');
    if (/\s(width|height)\s*=/.test(kokEtiket)) sorunlar.push('kök <svg> width/height taşıyor (boyutu CSS verir)');
  }

  const yasakOge = new RegExp(`<\\s*(${YASAK_OGELER.join('|')})\\b`, 'gi');
  const bulunanOgeler = new Set([...icerik.matchAll(yasakOge)].map((m) => m[1]));
  for (const oge of bulunanOgeler) sorunlar.push(`yasak öğe <${oge}>`);

  if (/\son[a-z]+\s*=/i.test(icerik)) sorunlar.push('olay özniteliği (on*) var');
  for (const [, deger] of icerik.matchAll(/(?:xlink:)?href\s*=\s*["']\s*([^"']*)/gi)) {
    if (!deger.startsWith('#')) sorunlar.push(`dış bağlantı href="${deger.slice(0, 60)}"`);
  }
  if (/data:/i.test(icerik)) sorunlar.push('data: adresi var (gömülü raster/dosya)');
  if (/javascript:/i.test(icerik)) sorunlar.push('javascript: adresi var');
  if (/@import/i.test(icerik)) sorunlar.push('@import var');
  if (/url\(\s*['"]?\s*(?!#)/i.test(icerik)) sorunlar.push('# ile başlamayan url(...) var');

  const onek = `${dosyaKoku}__`;
  const oneksizler = [...icerik.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)]
    .map((m) => m[1]).filter((id) => !id.startsWith(onek));
  if (oneksizler.length) {
    sorunlar.push(`«${onek}» öneki olmayan kimlik: ${oneksizler.slice(0, 5).join(', ')}${oneksizler.length > 5 ? '…' : ''}`);
  }
  return sorunlar;
}

/** svgo ile küçültür; viewBox ve <title> korunur, width/height atılır, kimliklere dosya öneki eklenir. */
export function svgIyilestir(icerik, dosyaKoku) {
  return optimize(icerik, {
    multipass: true,
    plugins: [
      'preset-default',
      'removeDimensions',
      { name: 'prefixIds', params: { prefix: dosyaKoku, delim: '__' } },
    ],
  }).data;
}

function svgDosyalari(yol) {
  if (!existsSync(yol)) return [];
  if (statSync(yol).isFile()) return /\.svg$/i.test(yol) ? [yol] : [];
  return readdirSync(yol, { withFileTypes: true }).flatMap((g) => svgDosyalari(join(yol, g.name)));
}

function calistir(argv) {
  const iyilestir = argv.includes('--iyilestir');
  const sinirIndeks = argv.indexOf('--sinir');
  const sinir = sinirIndeks >= 0 ? Number(argv[sinirIndeks + 1]) : VARSAYILAN_SINIR;
  if (!Number.isFinite(sinir) || sinir <= 0) throw new Error('--sinir için pozitif bir bayt sayısı verin.');
  const yollar = argv.filter((a, i) => !a.startsWith('--') && !(sinirIndeks >= 0 && i === sinirIndeks + 1));
  const kokler = yollar.length ? yollar : VARSAYILAN_KLASORLER.map((k) => join(KOK, k));
  const dosyalar = kokler.flatMap(svgDosyalari);

  if (!dosyalar.length) {
    console.log('SVG denetimi: denetlenecek SVG yok.');
    return 0;
  }
  let sorunSayisi = 0;
  for (const dosya of dosyalar) {
    const dosyaKoku = dosyaKokuOf(dosya);
    let icerik = readFileSync(dosya, 'utf8');
    if (iyilestir) {
      try {
        icerik = svgIyilestir(icerik, dosyaKoku);
        writeFileSync(dosya, icerik);
      } catch {
        // Ayrıştırılamayan dosya olduğu gibi kalır; hatayı aşağıdaki denetim bildirir.
      }
    }
    for (const sorun of svgSorunlari(icerik, { dosyaKoku, sinir })) {
      console.log(`✗ ${relative(KOK, dosya)}: ${sorun}`);
      sorunSayisi += 1;
    }
  }
  console.log(`SVG denetimi: ${dosyalar.length} dosya, ${sorunSayisi} sorun.`);
  return sorunSayisi ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = calistir(process.argv.slice(2));
}
