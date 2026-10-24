/**
 * Kademeli gizleme (Faz 2c, 24 Ekim 2026): Arapça metni kelimelere böler, beş düzeyde gizler, kelime başına açılmayı
 * ve «Tam / Az takıldım / Bir daha» sonucuna göre düzey ilerlemesini hesaplar. Saf işlevler: ekran (egitim kip-gizle.ts)
 * yalnız bunların sonucunu çizer. Tasarım: plan «Çalışma yolu, adım 4» (Diyanet'in «Hafızlık Risâlesi» usulü:
 * önce görerek, sonra ilk harften, en sonda ezberden).
 */

/** 0 tam · 1 iki kelimeden biri gizli · 2 yalnız ilk harfler · 3 boş (bölüm işaretleri kalır) · 4 boş ve işaretsiz. */
export type Seviye = 0 | 1 | 2 | 3 | 4;
export const SEVIYELER: readonly Seviye[] = [0, 1, 2, 3, 4];
/** Bir kelimenin ekrandaki hâli: tam metin · yalnız ilk harf (+ nokta çizgisi) · boş çizgi. */
export type Gorunum = 'tam' | 'ilk' | 'bos';
/** Kelime başına dokunma sayısı: 0 düzeyin gösterdiği, 1 bir adım açık (ilk harf / tam), 2 tamamen açık. */
export type Acilma = 0 | 1 | 2;

const BOSLUK = /[\s\u00a0]+/u;
const HARF = /\p{L}/u;
const ISARET = /[\p{Mn}\p{Cf}]/u;
// «ال» tanımlığının harfleri: yalın elif ve vasl harfleri. Hemzeli elif (أ إ آ) kelime kökünün parçasıdır, takı değildir.
const ELIFLER = new Set(['ا', 'ٱ']);
// «ال» tanımlık takısının önüne gelebilen tek harfli ekler: vâv, fâ, bâ, kâf (وَالْ، فَالْ، بِالْ، كَالْ).
const EKLER = new Set(['و', 'ف', 'ب', 'ك']);

/**
 * Metni kelimelere böler. Boşluk ve sert boşluk keser; yalnız durak işaretinden (ۙ ۚ ۗ ۖ ۜ) ya da başka işaretten oluşan
 * parça önceki kelimeye bağlanır, baştaki işaretler atılır. Kelimenin harekeleri ve kasr işaretleri (U+0656, U+06EA,
 * U+10EFD–10EFF) kelimeyle birlikte kalır.
 */
export function kelimeler(ar: string): string[] {
  const kelimeler: string[] = [];
  for (const parca of ar.split(BOSLUK)) {
    if (!parca) continue;
    if (HARF.test(parca)) kelimeler.push(parca);
    else if (kelimeler.length) kelimeler[kelimeler.length - 1] += parca;
  }
  return kelimeler;
}

/** Harf kümeleri: her temel harf ve ardından gelen işaretler (harekeler, şedde, hançer elif…) birlikte. */
function kumeler(kelime: string): string[] {
  const kume: string[] = [];
  for (const c of kelime) {
    if (ISARET.test(c) && kume.length) kume[kume.length - 1] += c;
    else kume.push(c);
  }
  return kume;
}
const temel = (k: string) => [...k][0];

// Tanımlık «ال» ayrımı için işaret kümeleri (kod noktasıyla: görünmez/okunaksız karakter kaynağa konmaz).
const isaretKumesi = (...kodlar: number[]) => new RegExp(`[${kodlar.map((c) => String.fromCodePoint(c)).join('')}]`, 'u');
/** Tanımlığın elifi kesre, damme, tenvin ya da alt elif taşımaz: اِلٰهَ ve اِلاَّ takı değildir. */
const ELIF_DISI = isaretKumesi(0x064b, 0x064c, 0x064d, 0x064f, 0x0650, 0x0656);
/** Tanımlığın lâmı kısa ünlü taşımaz (sükûnlu ya da işaretsiz) ya da şeddelidir (اَلَّذِى): اَلَمْ takı değildir. */
const KISA_UNLU = isaretKumesi(0x064b, 0x064c, 0x064d, 0x064e, 0x064f, 0x0650);
const SEDDE = String.fromCodePoint(0x0651);

function tanimlikMi(k: readonly string[], a: number): boolean {
  if (k[a + 2] === undefined) return false;
  if (!ELIFLER.has(temel(k[a])) || ELIF_DISI.test(k[a])) return false;
  return temel(k[a + 1]) === 'ل' && (k[a + 1].includes(SEDDE) || !KISA_UNLU.test(k[a + 1]));
}

/**
 * İlk harf ipucu: ilk harf ve harekesi. Kelime «ال» takısıyla başlıyorsa (ekli olsa da: وَالْ، بِالْ) ipucu, takıdan sonraki ilk
 * harfi de verir; yoksa her «ال…» kelimesi aynı tek elifle görünür ve ipucu işe yaramaz. Takı sayılan yalnız gerçek tanımlıktır
 * (elif ve lâm işaretleri yukarıdaki kurala uyar); اِلٰهَ gibi kök harfleriyle başlayan kelimede ipucu yine tek harftir. Sonuna ZWJ
 * eklenir: harf kelimenin başındaki biçimiyle (bitişik) çizilir.
 */
export function ilkHarf(kelime: string): string {
  const k = kumeler(kelime);
  if (!k.length) return '';
  const ek = k.length > 3 && EKLER.has(temel(k[0])) && tanimlikMi(k, 1) ? 1 : 0;
  const bit = tanimlikMi(k, ek) ? ek + 3 : 1;
  return k.slice(0, bit).join('') + '\u200d';
}

/** Düzeyin kelime için gösterdiği hâl (kelime sırası 0'dan). */
export function tabanGorunum(seviye: Seviye, sira: number): Gorunum {
  if (seviye === 0) return 'tam';
  if (seviye === 1) return sira % 2 === 1 ? 'bos' : 'tam';
  return seviye === 2 ? 'ilk' : 'bos';
}

/** Dokunma sayısına göre hâl: boş → ilk harf → tam; ilk harf → tam; tam hep tam. */
export function acilmisGorunum(taban: Gorunum, acilma: Acilma): Gorunum {
  if (acilma >= 2) return 'tam';
  if (acilma === 1) return taban === 'bos' ? 'ilk' : 'tam';
  return taban;
}

/** Bölüm işaretleri (âyet sonu ۝N, dualarda bölüm numarası) 4. düzeyde de kaybolur; 0–3'te çapa olarak kalır. */
export const isaretGoster = (seviye: Seviye): boolean => seviye <= 3;

/** Bir bölümün kelime hâlleri. `acilma` kelime sırasına göre; eksikse 0. */
export function gorunumler(kelimeSayisi: number, seviye: Seviye, acilma: readonly Acilma[] = []): Gorunum[] {
  return Array.from({ length: kelimeSayisi }, (_, i) => acilmisGorunum(tabanGorunum(seviye, i), acilma[i] ?? 0));
}

/** Sıradaki tam açık olmayan kelime (İpucu ve «Kelimeyi aç» düğmeleri ona etki eder); yoksa -1. */
export function sonrakiGizli(g: readonly Gorunum[]): number {
  return g.findIndex((x) => x !== 'tam');
}

/** «12 kelimeden 5'i açık» için: tam görünen kelime sayısı. */
export const acikSayisi = (g: readonly Gorunum[]): number => g.filter((x) => x === 'tam').length;

/** Bir düğmeyle ya da dokunuşla bir kelimeyi bir adım aç (en çok 2). */
export const bir_adim_ac = (a: Acilma): Acilma => (a >= 2 ? 2 : ((a + 1) as Acilma));

export type Sonuc = 'tam' | 'az' | 'tekrar';
export interface Ilerleme { seviye: Seviye; seri: number }

/** Kaç «Tam» üst düzeye geçirir. */
export const TAM_SAYISI = 2;

/**
 * Tur sonucu: art arda iki «Tam» bir üst düzeye götürür (en çok 4); «Az takıldım» yerinde bırakır ve seriyi sıfırlar;
 * «Bir daha» bir alt düzeye indirir (en az 0). Seri her düzey değişiminde sıfırlanır.
 */
export function ilerle(d: Ilerleme, sonuc: Sonuc): Ilerleme {
  if (sonuc === 'tekrar') return { seviye: Math.max(0, d.seviye - 1) as Seviye, seri: 0 };
  if (sonuc === 'az') return { seviye: d.seviye, seri: 0 };
  const seri = d.seri + 1;
  if (seri >= TAM_SAYISI && d.seviye < 4) return { seviye: (d.seviye + 1) as Seviye, seri: 0 };
  return { seviye: d.seviye, seri: d.seviye === 4 ? Math.min(seri, TAM_SAYISI) : seri };
}

/** Tam boş ve işaretsiz düzeyde (4) iki kez «Tam»: bu madde için kademeli gizleme tamamdır; ezberi hoca onaylar. */
export const tamamlandi = (d: Ilerleme): boolean => d.seviye === 4 && d.seri >= TAM_SAYISI;

/**
 * Dinleyici kipi: dinleyen kişi (veli, kardeş) Arapça bilmese de ekranda ilk harfleri izler. «Takıldı» düğmesi sırayla ipucu
 * verir: bölümün sesi varsa önce o ses, sonra her basışta bir sonraki kelime; yoksa doğrudan kelimeler.
 */
export type Ipucu = { tur: 'ses' } | { tur: 'kelime'; sira: number } | { tur: 'bitti' };
export function takildi(basis: number, kelimeSayisi: number, sesVar: boolean): Ipucu {
  if (sesVar && basis === 0) return { tur: 'ses' };
  const sira = basis - (sesVar ? 1 : 0);
  return sira < kelimeSayisi ? { tur: 'kelime', sira } : { tur: 'bitti' };
}

/** Boş çizginin uzunluğu: kelimenin harf sayısına göre 1–6 basamak (CSS sınıfı; satır içi stil yok). */
export function cizgiBoyu(kelime: string): number {
  const harf = kumeler(kelime).length;
  return Math.max(1, Math.min(6, Math.ceil(harf / 2)));
}
