/**
 * Ekran levhasının okunur tabanları (u = tuval kısa kenarının %1'i) ve en büyük ölçekleri (A alt projesi).
 * Levha tek ölçekle (--olcek = s, s ∈ [1, enCok]) büyür/küçülür; her öğenin boyu taban × s'dir, oranlar sabittir.
 * Tek kaynak: src/ekran/slaytlar.ts bu değerleri slayt köküne --f-* değişkenleri olarak yazar, CSS
 * calc(var(--u) * var(--f-…) * var(--olcek, 1)) ile kullanır; bütçe kalibrasyonu
 * da bu tabanlarla ölçer. Tabanlar yazı tipi numunesinde onaylandı, bütçeler bu tabanlarla kalibre edildi;
 * TV üzerindeki denetim değiştirirse kalibrasyon yeniden çalıştırılır.
 *
 * Kalibrasyonu çalıştırmak için: EKRAN_KALIBRE=1 npx playwright test tests/web/ekran.spec.mjs -g kalibrasyonu
 */
/** Levha türü = slayt türü; tema kartı içeriğine göre ayet, hadis, bilgi ya da söz levhasıyla çizilir. */
export type LevhaTuru = 'ayet' | 'hadis' | 'dua' | 'bilgi' | 'soz' | 'duyuru';

export interface LevhaOlcusu {
  ar: number;
  tr: number;
  fr: number;
  kaynak: number;
  baslikTr: number;
  baslikFr: number;
  susleme: number;
  /** Kısa metnin büyüyebileceği en büyük ölçek (s_max). */
  enCok: number;
}

const MANEVI: LevhaOlcusu = { ar: 4.8, tr: 3.4, fr: 2.9, kaynak: 2.3, baslikTr: 0, baslikFr: 0, susleme: 2.2, enCok: 1.9 };

export const OLCU: Record<LevhaTuru, LevhaOlcusu> = {
  ayet: MANEVI,
  hadis: MANEVI,
  dua: MANEVI,
  /** Söz: Arapçası varsa ayet/hadis düzeni; yoksa TR, süsleme, FR. */
  soz: MANEVI,
  /** Bilgi kartı: duyuru gibi iki dilli başlık + metin; başlık duyurununkinden küçük, metni ezmesin. */
  bilgi: { ar: 0, tr: 3.4, fr: 2.9, kaynak: 2.3, baslikTr: 3.8, baslikFr: 3.3, susleme: 2.2, enCok: 1.7 },
  duyuru: { ar: 0, tr: 3.4, fr: 2.9, kaynak: 0, baslikTr: 4.4, baslikFr: 3.8, susleme: 2.2, enCok: 1.7 },
};

/** Üst başlık taban boyu: sabit, ölçekle büyümez. */
export const UST_BASLIK = 2.6;

/** Slayt köküne yazılacak CSS değişkenleri (ad, değer). */
export function olcuDegiskenleri(tur: LevhaTuru): Array<[string, string]> {
  const o = OLCU[tur];
  return [
    ['--f-ar', String(o.ar)],
    ['--f-tr', String(o.tr)],
    ['--f-fr', String(o.fr)],
    ['--f-kaynak', String(o.kaynak)],
    ['--f-baslik-tr', String(o.baslikTr)],
    ['--f-baslik-fr', String(o.baslikFr)],
    ['--f-susleme', String(o.susleme)],
  ];
}

/** Afişli duyuruda görsel oranı (genişlik ÷ yükseklik) bilinmiyorsa: A serisi dikey afiş (1 : √2). */
export const AFIS_ORANI = 0.707;
/** Afiş kutusunun en geniş hâli: panel genişliğinin oranı (yazı sütununa en az %55 kalır). */
export const AFIS_EN_COK = 0.45;
