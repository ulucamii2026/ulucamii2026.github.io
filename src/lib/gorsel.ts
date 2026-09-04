/**
 * Derleme anında görsel ölçüsü — kapak/afiş kutularının oranını görselin KENDİSİNE göre kurmak için.
 *
 * Neden var: duyuru kapakları ve etkinlik afişleri çoğunlukla DİKEY (A4 ≈ 0,707 · sosyal medya 4:5 = 0,8),
 * kartlar ise 16:9 sabit kutuya basıyordu. `object-cover` afişin ortasından yatay bir dilim kesiyor —
 * 4 Eylül 2026'da ana sayfadaki öne çıkan hac duyurusunun kapağı, afişin bomboş orta bandı olduğu için
 * 350 px'lik bir BOŞ dikdörtgen olarak görünüyordu. `object-contain` ise afişi minicik bırakıp iki yanında
 * geniş boşluk açıyordu (etkinlik kartı). İkisi de yanlış: kutu görsele uymalı, görsel kutuya değil.
 *
 * Nasıl: sharp (zaten bağımlılık) `public/` altındaki dosyayı okur, oran modül belleğinde tutulur —
 * aynı görsel 3 dil × N sayfada bir kez ölçülür. Dosya yoksa/okunamazsa `null` döner ve çağıran taraf
 * eski davranışına (16:9) düşer; derleme asla kırılmaz.
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

export interface Olcu {
  genislik: number;
  yukseklik: number;
  /** genişlik / yükseklik — 1'den küçükse dikey */
  oran: number;
  dikey: boolean;
}

/** Kart çerçevesinin izin verdiği en dar (A4 dikey) ve en geniş (16:9) oran. */
export const EN_DAR_ORAN = 0.68;
export const EN_GENIS_ORAN = 16 / 9;

const bellek = new Map<string, Olcu | null>();

/* Dosya yolu iki yoldan aranır. `import.meta.url` derleme sırasında paketlenmiş modülün geçici
   konumuna kayabiliyor (4 Eylül 2026: ölçüm sessizce null dönüyor, kartlar 16:9'a düşüyordu);
   bu yüzden önce proje kökü (process.cwd — Astro derlemesi hep orada çalışır) denenir. */
const KOKLER = [
  () => join(process.cwd(), 'public'),
  () => fileURLToPath(new URL('../../public', import.meta.url)),
];
function dosyaYolu(anahtar: string): string | null {
  for (const kok of KOKLER) {
    try {
      const y = resolve(kok(), '.' + anahtar);
      if (existsSync(y)) return y;
    } catch { /* çözülemeyen kök: sıradakini dene */ }
  }
  return null;
}

/** Ölçülemeyen görseller derleme günlüğünde tek satırda görünsün — sessiz gerileme olmasın. */
const olculemeyen = new Set<string>();

/** `/media/...` biçimindeki site-içi bir görselin ölçüsü; bulunamazsa null. */
export async function gorselOlcu(yol?: string | null): Promise<Olcu | null> {
  if (!yol || !yol.startsWith('/') || yol.startsWith('//')) return null;
  const anahtar = yol.split('?')[0];
  const onbellek = bellek.get(anahtar);
  if (onbellek !== undefined) return onbellek;

  let sonuc: Olcu | null = null;
  try {
    const dosya = dosyaYolu(anahtar);
    if (dosya) {
      const m = await sharp(dosya).metadata();
      // EXIF döndürmesi (orientation 5-8) genişlik/yüksekliği takas eder.
      const donuk = typeof m.orientation === 'number' && m.orientation >= 5;
      const g = donuk ? m.height : m.width;
      const y = donuk ? m.width : m.height;
      if (g && y) sonuc = { genislik: g, yukseklik: y, oran: g / y, dikey: g / y < 0.95 };
    }
  } catch {
    /* bozuk/okunamayan görsel: null — derleme durmaz, yalnız uyarı düşer */
  }
  if (!sonuc && !olculemeyen.has(anahtar)) {
    olculemeyen.add(anahtar);
    console.warn(`[görsel] ölçülemedi, kart 16:9'a düşüyor: ${anahtar}`);
  }
  bellek.set(anahtar, sonuc);
  return sonuc;
}

/**
 * Aynı klasördeki `-thumb` sürümü. Kart kapakları en çok ~250 px genişliğinde görünür; oysa
 * duyuru afişleri 1280-1400 px ve 200 KB'ın üzerinde olabiliyor (4 Eylül 2026: öne çıkan hac
 * afişi telefonda 112 px'lik kutuda 216 KB indiriyordu). İçerikte `kapakKucuk`/`afisKucuk`
 * verilmemişse küçük sürüm burada kendiliğinden bulunur; yoksa null döner ve aslı kullanılır.
 */
export function kucukSurum(yol?: string | null): string | null {
  if (!yol || !yol.startsWith('/')) return null;
  const p = yol.split('?')[0];
  const m = p.match(/^(.*)(\.[a-z0-9]+)$/i);
  if (!m || m[1].endsWith('-thumb')) return null;
  const aday = `${m[1]}-thumb${m[2]}`;
  return dosyaYolu(aday) ? aday : null;
}

/**
 * Kart çerçevesinin oranı ve görselin oturma biçimi.
 * - Görselin oranı sınırlar içindeyse çerçeve TAM olarak o orandır → `cover` ile ne kırpma ne boşluk olur.
 * - Sınır dışındaysa (panorama, çok uzun afiş) çerçeve kırpılır ve görsel `contain` ile tümüyle görünür.
 */
export function cerceve(olcu: Olcu | null, varsayilan = EN_GENIS_ORAN) {
  if (!olcu) return { oran: varsayilan, oturma: 'cover' as const, dikey: false };
  const sinirli = Math.min(Math.max(olcu.oran, EN_DAR_ORAN), EN_GENIS_ORAN);
  const tam = Math.abs(sinirli - olcu.oran) < 0.02;
  return { oran: sinirli, oturma: tam ? ('cover' as const) : ('contain' as const), dikey: olcu.dikey };
}

/** `aspect-ratio` için güvenli CSS değeri (3 haneli). */
export function oranCss(oran: number) {
  return oran.toFixed(3);
}
