/**
 * Bilgi maddesinin metni (24 Ekim 2026): imanın şartları, farzlar, Ülü'l-azm, dört halife ve hadis seçkileri gibi sayılı
 * listeler. Veri: src/data/ezber/bilgi/<id>.json (şema bilgi.schema.json). Her madde kaynak göstermek zorundadır; metin
 * Camiye Gidiyorum 1-2'den (Türkçe ve resmî Fransızca) alınır ve Temel Dinî Bilgiler, Diyanet İlmihali, Dînî Kavramlar
 * Sözlüğü, Hadislerle İslam ya da Riyâzü's-Sâlihîn ile karşılaştırılır. Bu modül saf işlevlerdir; dosyaları sayfa okur
 * (import.meta.glob). Kurallar ve Kur'an maddelerinden farkı: docs/EGITIM-FAZ2-DINLEME.md «Bilgi maddeleri».
 *
 * Dil durumu: `tr` kaynağın kendisidir; `fr` resmî Fransızca baskıdan gelir (madde bazında `taslak: ["fr"]` varsa o madde
 * çalışma çevirisidir); `en`, `nl`, `de` her zaman Türkçe metinden çevrilmiş TASLAKTIR ve sayfada öyle yazılır, resmî gibi
 * sunulmaz (docs/DIL-NL-DE.md). Hoca onayı `onay` ile dil dil verilir; onaysız metin sayfada «hoca incelemesi bekleniyor» der.
 */
import type { Dil } from '../../i18n/ui';

export type BesMetin = Readonly<Record<Dil, string>>;
export type KaynakRolu = 'metin' | 'fr' | 'ar' | 'dogrulama';

export interface BilgiGrubu { readonly kimlik: string; readonly ad: BesMetin }
export interface BilgiMaddesi {
  readonly ad: BesMetin;
  /** Kısa Arapça terim (yalnız Diyanet kaynağında yazılıysa); yazı tipi kümesinde olmak zorundadır. */
  readonly ar?: string;
  readonly grup?: string;
  /** Hadis künyesi (dile bağlı olmayan kısa yazım). */
  readonly kunye?: string;
  /** Bu madde için çalışma çevirisi olan diller (resmî baskıda karşılığı yok ya da eksik): sayfa «taslak» der. */
  readonly taslak?: readonly Dil[];
  /** Yalnız hoca inceleme sayfasında görünür: Diyanet hadis yayınındaki karşılık ve ifade farkı. */
  readonly dogrulama?: { readonly kaynak: string; readonly metin?: string; readonly fark?: string };
}
export interface BilgiKaynagi {
  readonly rol: KaynakRolu;
  readonly ad: string;
  readonly sayfa?: string;
  readonly bolum?: string;
}
export interface BilgiMetni {
  readonly id: string;
  /** Sıra anlamlıysa (iman şartları, rükünler, halifeler…) «Sırala» oyunu açılır; hadis seçkisinde sıra yoktur. */
  readonly sirali: boolean;
  readonly gruplar?: readonly BilgiGrubu[];
  readonly maddeler: readonly BilgiMaddesi[];
  readonly not?: BesMetin;
  readonly taslak: readonly Dil[];
  readonly kaynaklar: readonly BilgiKaynagi[];
  /** Kitapta olup bu sayfaya doğrulanamadığı için alınmayanlar (hoca inceleme sayfasında nedeniyle yazılıdır). */
  readonly alinmayan?: readonly { readonly metin: string; readonly neden: string; readonly kaynak?: string }[];
  readonly onay: null | { readonly tarih: string; readonly kapsam: readonly Dil[] };
}

export type DilDurumu = 'onayli' | 'taslak' | 'bekliyor';

/**
 * Sayfa dilinin metin durumu. `onayli`: hoca bu dili onayladı. `taslak`: Türkçe metinden çevrilmiş çalışma metni (en, nl, de).
 * `bekliyor`: kaynaktan olduğu gibi alındı, hoca incelemesi bekleniyor (tr, fr). Onay bir dili taslaktan da çıkarır:
 * hoca İngilizceyi okuyup onaylamışsa sayfa artık «taslak» demez.
 */
export function dilDurumu(b: BilgiMetni, dil: Dil): DilDurumu {
  if (b.onay?.kapsam.includes(dil)) return 'onayli';
  return b.taslak.includes(dil) ? 'taslak' : 'bekliyor';
}

/** Maddenin bu dildeki metni çalışma çevirisi mi (rozet): dil onaylanmadıysa ve madde ya da dosya bu dili taslak sayıyorsa. */
export const maddeTaslakMi = (b: BilgiMetni, m: BilgiMaddesi, dil: Dil): boolean =>
  !b.onay?.kapsam.includes(dil) && (m.taslak?.includes(dil) === true || b.taslak.includes(dil));

export interface GosterimMaddesi {
  /** Grup içindeki sıra (1'den). */
  readonly no: number;
  readonly metin: string;
  readonly ar?: string;
  readonly kunye?: string;
  readonly taslak: boolean;
  /** Hadisin Diyanet yayınındaki çevirisi: yalnız Türkçe sayfada ve kitabın cümlesinden farklıysa (bkz. diyanetCevirisi). */
  readonly diyanet?: { readonly metin: string; readonly kaynak: string };
}
export interface GosterimGrubu { readonly kimlik: string; readonly ad?: string; readonly maddeler: readonly GosterimMaddesi[] }

/** Karşılaştırma için sade biçim: küçük harf, yalnız harfler (noktalama, boşluk ve tırnak farkı «farklı» sayılmaz). */
const sade = (s: string): string => s.toLocaleLowerCase('tr').replace(/[^\p{L}]/gu, '');

/**
 * Kaynak zinciri (hadis meâli Hadislerle İslam / Riyâzü's-Sâlihîn'den): ezber cümlesi öğrencinin elindeki kitabın cümlesidir;
 * Diyanet hadis yayınındaki çeviri ondan farklıysa Türkçe sayfada altında kaynağıyla gösterilir (24 Ekim 2026). Kaynak, doğrulama
 * künyesinin ilk parçasıdır («; » öncesi: cilt + başlık + hadis numarası).
 */
export function diyanetCevirisi(m: BilgiMaddesi): { metin: string; kaynak: string } | undefined {
  const d = m.dogrulama;
  if (!d?.metin || sade(d.metin) === sade(m.ad.tr)) return undefined;
  return { metin: d.metin, kaynak: d.kaynak.split('; ')[0] };
}

/**
 * Sayfada çizilecek gruplar. Grupsuz listede tek, adsız grup döner. Her grup kendi içinde 1'den numaralanır (kitapta
 * «namazın şartları» 1–6, «rükünleri» 1–6). Veri tutarsızsa (bilinmeyen grup) madde atlanmaz: adsız gruba düşer; test bunu yakalar.
 */
export function gosterimGruplari(b: BilgiMetni, dil: Dil): GosterimGrubu[] {
  const tanimli = b.gruplar ?? [];
  const sira = tanimli.length ? tanimli.map((g) => g.kimlik) : [''];
  const bilinen = new Set(sira);
  const kovalar = new Map<string, BilgiMaddesi[]>(sira.map((k) => [k, []]));
  for (const m of b.maddeler) {
    const k = m.grup && bilinen.has(m.grup) ? m.grup : sira[0];
    kovalar.get(k)!.push(m);
  }
  return sira.map((k) => ({
    kimlik: k,
    ad: tanimli.find((g) => g.kimlik === k)?.ad[dil],
    maddeler: kovalar.get(k)!.map((m, i) => ({
      no: i + 1,
      metin: m.ad[dil],
      ar: m.ar,
      kunye: m.kunye,
      taslak: maddeTaslakMi(b, m, dil),
      diyanet: dil === 'tr' ? diyanetCevirisi(m) : undefined,
    })),
  })).filter((g) => g.maddeler.length > 0);
}

/** Sırala oyunu: sıra anlamlıdır ve karıştırılacak en az üç madde vardır (iki maddede oyun anlamsız kalır). */
export const siralamaVar = (b: BilgiMetni): boolean => b.sirali && gosterimGruplari(b, 'tr').some((g) => g.maddeler.length >= 3);

/** Kaynakları rol sırasıyla (metin, Fransızca, Arapça, doğrulama) döndürür. */
export function kaynakSirasi(b: BilgiMetni): BilgiKaynagi[] {
  const sira: KaynakRolu[] = ['metin', 'fr', 'ar', 'dogrulama'];
  return [...b.kaynaklar].sort((a, c) => sira.indexOf(a.rol) - sira.indexOf(c.rol));
}
