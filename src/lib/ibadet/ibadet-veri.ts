/**
 * İlim Yolu «Abdest ve Namaz» verisi (10 Kasım 2026): src/data/ibadet/{abdest,namaz}.json'un tipli okuyucusu ve ders mantığı.
 * Veri Diyanet İlmihali'ne göre (Hanefî) hazırlanmış ve iki kez kaynakla denetlenmiştir (KAYNAK-DENETIM.md); buradaki kod hüküm
 * ÜRETMEZ, yalnız veriyi seçer ve sıralar. Dinî ifade, etiket (farz/vâcip/sünnet) ve kaynak numarası JSON'dan olduğu gibi gelir.
 */
import type { Dil } from '../../i18n/ui';
import abdestHam from '../../data/ibadet/abdest.json';
import namazHam from '../../data/ibadet/namaz.json';

export type Hukum = 'farz' | 'vacip' | 'sunnet' | 'adab';
export type DilMetni = Readonly<Record<Dil, string>>;

export interface Adim {
  readonly id: string;
  readonly sira: number;
  readonly tur: Hukum;
  readonly grup?: string;
  readonly metin: DilMetni;
  readonly kadin?: DilMetni;
  readonly not?: DilMetni;
  readonly ikon: string;
  readonly dua?: string;
  readonly duaEk?: readonly string[];
  readonly kaynakNo: string;
  readonly kaynakNolar?: readonly string[];
}
export interface RekatKurali { readonly id: string; readonly sira: number; readonly metin: DilMetni; readonly kaynakNo: string }
export interface Birim { readonly rekat: number; readonly hukum: 'muekked' | 'gayrimuekked' }
export interface Vakit {
  readonly id: string;
  readonly ad: DilMetni;
  readonly farz: number;
  readonly sunnetOnce: Birim | null;
  readonly sunnetSonra: Birim | null;
  readonly kaynakNo: { readonly farz: string; readonly sunnet: string };
}
export interface KonuVerisi {
  readonly konu: string;
  readonly etiket: DilMetni;
  readonly terimler: Readonly<Record<string, DilMetni>>;
  readonly kaynak: readonly { readonly eser: string; readonly cilt: number; readonly dosya: string; readonly sayfa: string }[];
  readonly adimlar: readonly Adim[];
}
export interface NamazVerisi extends KonuVerisi {
  readonly rekatSablonu: { readonly ilkRekat: readonly string[]; readonly ikinciRekat: readonly string[]; readonly ucuncuDorduncuRekat: readonly string[]; readonly sonOturus: readonly string[] };
  readonly rekatKurallari: readonly RekatKurali[];
  readonly vakitler: readonly Vakit[];
  readonly vitir: { readonly id: string; readonly ad: DilMetni; readonly rekat: number; readonly hukum: string; readonly zaman: DilMetni; readonly kaynakNo: string; readonly kaynakNolar?: readonly string[] };
}

export const ABDEST = abdestHam as unknown as KonuVerisi;
export const NAMAZ = namazHam as unknown as NamazVerisi;

export const VAKIT_IDLERI = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
export type VakitId = (typeof VAKIT_IDLERI)[number];

export const adimBul = (konu: KonuVerisi, id: string): Adim => {
  const a = konu.adimlar.find((x) => x.id === id);
  if (!a) throw new Error(`adım yok: ${id}`);
  return a;
};
export const kuralBul = (id: string): RekatKurali => {
  const k = NAMAZ.rekatKurallari.find((x) => x.id === id);
  if (!k) throw new Error(`kural yok: ${id}`);
  return k;
};
export const vakitBul = (id: string): Vakit => {
  const v = NAMAZ.vakitler.find((x) => x.id === id);
  if (!v) throw new Error(`vakit yok: ${id}`);
  return v;
};

/**
 * Etiketi (farz) adımın TAMAMINA değil asıl fiile ait olan adımlar (ikinci denetim, açık nokta a): iftitah tekbiri, rükû, secde.
 * Metinde bu fiillerin yanında sünnet/vâcip ayrıntılar da vardır; arayüz etiketi fiile bağlar ve bunu yazar.
 */
export const KISMI_ETIKET: Readonly<Record<string, 'iftitah' | 'ruku' | 'secde'>> = { 'nm-02': 'iftitah', 'nm-07': 'ruku', 'nm-09': 'secde' };

/**
 * «Hüküm eşleştir» için seçilmiş namaz adımları. Bilerek DIŞARIDA bırakılanlar: nm-02/nm-07/nm-09 dışındaki karma etiketliler değil,
 * arşivde tartışmalı olanlar (nm-08 kavme, nm-10 celse: vâcip de sayılabilir), ilk/son oturuşu ayıran nm-12 ve rek‘ata göre hükmü
 * değişen nm-06 (Fâtiha). Kalanlarda etiket tek anlamlıdır.
 */
export const HUKUM_ADIMLARI_NAMAZ: readonly string[] = ['nm-04', 'nm-05', 'nm-07', 'nm-09', 'nm-13', 'nm-15', 'nm-16'];

/** «Çizim eşleştir» için her çizimden bir adım (namazda çizimler birden çok adımda tekrarlanır). */
export const CIZIM_ADIMLARI_NAMAZ: readonly string[] = ['nm-01', 'nm-02', 'nm-03', 'nm-07', 'nm-08', 'nm-09', 'nm-10', 'nm-12', 'nm-15', 'nm-16'];

export type RekatSatiri = { readonly no: number; readonly adimlar: readonly string[]; readonly son: boolean };

/**
 * `n` rek‘atlık bir farzın rek‘at rek‘at adım listesi, `rekatSablonu`'ndan. İkiden fazla rek‘atta ikinci rek‘at ilk oturuşla biter;
 * son rek‘at `sonOturus` ile biter. İki rek‘atta ikinci rek‘at doğrudan son oturuşa bağlanır (nm-12 bir kez).
 */
export function rekatSemasi(n: number): RekatSatiri[] {
  const s = NAMAZ.rekatSablonu;
  if (!Number.isInteger(n) || n < 2 || n > 4) throw new RangeError('rek‘at sayısı 2…4 olmalı');
  const satirlar: RekatSatiri[] = [];
  for (let no = 1; no <= n; no++) {
    const son = no === n;
    let temel: readonly string[] = no === 1 ? s.ilkRekat : no === 2 ? s.ikinciRekat : s.ucuncuDorduncuRekat;
    if (son) temel = [...temel.filter((id) => !(no === 2 && id === 'nm-12')), ...s.sonOturus];
    satirlar.push({ no, adimlar: temel, son });
  }
  return satirlar;
}

export interface Birimi { readonly tip: 'once' | 'farz' | 'sonra'; readonly rekat: number; readonly hukum: 'farz' | 'muekked' | 'gayrimuekked' }

/** Bir vakitte kılınış sırası: farzdan önceki sünnet, farz, farzdan sonraki sünnet. */
export function vakitBirimleri(v: Vakit): Birimi[] {
  const b: Birimi[] = [];
  if (v.sunnetOnce) b.push({ tip: 'once', rekat: v.sunnetOnce.rekat, hukum: v.sunnetOnce.hukum });
  b.push({ tip: 'farz', rekat: v.farz, hukum: 'farz' });
  if (v.sunnetSonra) b.push({ tip: 'sonra', rekat: v.sunnetSonra.rekat, hukum: v.sunnetSonra.hukum });
  return b;
}

/** Bir adımın sayfa kaynağı satırı: varsa `kaynakNolar`, yoksa `kaynakNo`. */
export const adimKaynaklari = (a: Adim): readonly string[] => (a.kaynakNolar?.length ? a.kaynakNolar : [a.kaynakNo]);
