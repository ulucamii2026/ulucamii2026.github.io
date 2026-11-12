/**
 * Hoca ekranı arayüz dili (12 Kasım 2026) — çekirdek. Beş dil: tr (varsayılan), fr, en, nl, de.
 *
 * Yalnız ARAYÜZ metni çevrilir (etiket, düğme, başlık, ipucu, durum/hata iletisi, aria-label, tarih/sayı biçimi).
 * Firestore'a yazılan, veliye giden ya da mantığın metin olarak eşleştirdiği hiçbir şey çevrilmez
 * (defter metni, kalıp cümleleri, yoklama değerleri, anahtarlar, öğrenci/veli verisi): bkz. docs/HOCA-EKRANI-DILLERI.md.
 *
 * Dil tercihi CİHAZA özeldir (localStorage, try/catch korumalı; hassas veri değil). Dil değişince sayfa yeniden yüklenir
 * (src/scripts/hoca-dil.ts); bu yüzden dil tek kez okunur ve modül düzeyindeki sabitler de güvenle çeviri kullanabilir.
 *
 * Kullanım (her modülün kendi sözlüğü, `Record<Dil, …>` tipli: eksik dil `astro check` hatasıdır):
 *   const tr = { 'giris.baslik': 'Hoca girişi', 'yoklama.sayi': { other: '{n} öğrenci' } } as const;
 *   export const EKRAN = { tr, fr: {…}, en: {…}, nl: {…}, de: {…} } satisfies Record<Dil, Record<keyof typeof tr, Metin>>;
 *   const t = sozluk(EKRAN);  t('giris.baslik');  t('yoklama.sayi', { n: 3 });
 *
 * Kurallar: değerler düz metindir (HTML yok; `<` ve `&` yasak) — yalnız anahtarı `Html` ile biten değerlerde işaretleme olabilir
 * ve her dilde aynı etiketleri taşımalıdır. Yer tutucu `{ad}` biçimindedir, her dilde aynı küme. Çoğul: `{ one?, other }`
 * (Intl.PluralRules, `n` yer tutucusu). Kelime sırası dile göre değişir: metin parçalayıp birleştirmek yerine yer tutucu kullanılır.
 */
import { diller, type Dil } from './ui';

export const HOCA_DILLERI = Object.keys(diller) as Dil[];
export const HOCA_DIL_ADI: Record<Dil, string> = diller;
/** Tarih/sayı biçimi için yerel (Belçika kullanımı: fr-BE, nl-BE). */
export const HOCA_YEREL: Record<Dil, string> = { tr: 'tr-TR', fr: 'fr-BE', en: 'en-GB', nl: 'nl-BE', de: 'de-DE' };

export type Metin = string | { one?: string; other: string };
export type Yer = Record<string, string | number>;

const ANAHTAR = 'hocaDil';
let gecerli: Dil | undefined;

/** Cihazda saklı hoca ekranı dili; yoksa ya da depolama kapalıysa Türkçe. Tek kez okunur. */
export function hocaDili(): Dil {
  if (gecerli) return gecerli;
  let d: Dil = 'tr';
  try {
    const v = localStorage.getItem(ANAHTAR);
    if (v && (HOCA_DILLERI as string[]).includes(v)) d = v as Dil;
  } catch { /* depolama kapalı: Türkçe */ }
  gecerli = d;
  return d;
}

/** Tercihi saklar (hassas olmayan, cihaza özel kolaylık). Sayfayı yeniden yüklemek çağıranın işidir. */
export function hocaDiliKaydet(d: Dil): void {
  gecerli = d;
  try { localStorage.setItem(ANAHTAR, d); } catch { /* depolama kapalı: bu oturumda geçerli */ }
}

export const hocaYerel = (): string => HOCA_YEREL[hocaDili()];

const doldur = (s: string, yer?: Yer) => (yer ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in yer ? String(yer[k]) : m)) : s);

/** Bir sözlükten `t(anahtar, yer?)` işlevi üretir; geçerli dili her çağrıda hocaDili()'nden alır. */
export function sozluk<A extends string>(d: Record<Dil, Record<A, Metin>>) {
  return (anahtar: A, yer?: Yer): string => {
    const dil = hocaDili();
    const m = d[dil][anahtar] ?? d.tr[anahtar];
    if (typeof m === 'string') return doldur(m, yer);
    const n = typeof yer?.n === 'number' ? yer.n : Number(yer?.n);
    const bicim = Number.isFinite(n) ? new Intl.PluralRules(HOCA_YEREL[dil]).select(n) : 'other';
    return doldur(bicim === 'one' && m.one !== undefined ? m.one : m.other, yer);
  };
}

/** `document.documentElement.lang` ve ekran kabuğunu geçerli dile ayarlar (ilk çizimden önce çağrılır). */
export function hocaDiliUygula(): void {
  if (typeof document !== 'undefined') document.documentElement.lang = hocaDili();
}
