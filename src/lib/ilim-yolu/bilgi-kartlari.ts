/**
 * İlim Yolu bilgi kartları (Dilim 2, 2 Kasım 2026; docs/ILIM-YOLU.md «Dilim 2»). Veri: `src/data/ilim-yolu/kartlar/<kod>.json`,
 * yıllık plandaki (src/data/yillik-plan-2026-2027.json) her benzersiz `kod|konu` için tek kart. Kaynak yalnız planın `kazanim` ve
 * `ozet` alanlarıdır; ders kitabının metni (telifli) karta GİRMEZ. Mini sorular Claude yazımıdır: bütün dillerde «taslak» başlar,
 * hoca onaylayınca o dil «onayli» olur. Doğrulama: tests/ilim-yolu-bilgi-kartlari.test.mjs.
 */
import type { AlanKodu, Basamak, Dil, Metin, Sik } from '../seviye-testi/tipler';

export type { Dil, Metin };
export type PlanKodu = 'kuran' | 'itikat' | 'ibadet' | 'siyer' | 'ahlak';
export type CeviriDurumu = 'taslak' | 'onayli';

export type MiniSoru = {
  /** `<kart id>-<n>`; yayından sonra değişmez. */
  id: string;
  soru: Metin;
  /** 3 ya da 4 şık, birbirinden farklı. */
  siklar: Sik[];
  /** Doğru şıkkın sırası (0 tabanlı). */
  dogru: number;
  /** Doğrulanmış künye: Diyanet İlmihali / DİA maddesi / âyet (sure:âyet) / hadis künyesi. Sayfaya basılmaz. */
  kaynak: string;
};

export type BilgiKarti = {
  /** `^(ku|it|ib|si|ah)-\d{3}$`; yayından sonra değişmez, emekli kart silinmez. */
  id: string;
  /** Plan bağı: `kod` + TR `konu` yıllık plandakiyle birebir aynı. */
  kod: PlanKodu;
  planKonu: string;
  /** Konunun planda ilk işlendiği gün (YYYY-MM-DD). */
  ilkDers: string;
  /** Seviye yolu: seviye testinin 7 alanından biri ve o alandaki basamak. */
  seviyeAlani: AlanKodu;
  basamak: Basamak;
  baslik: Metin;
  /** Kendi cümlelerimizle kısa özet (her dilde ≤ 280 karakter). */
  ozet: Metin;
  /** Planın `kaynak` alanı (ör. «Camiye Gidiyorum 1 s. 71–76»): yalnız künye, metin değil. */
  kitap?: string;
  sorular: MiniSoru[];
  /** Dil başına onay durumu; `onayli` olmayan dil sayfada «taslak» etiketiyle görünür. */
  durum: Record<Dil, CeviriDurumu>;
};

export type KartDosyasi = { kod: PlanKodu; kartlar: BilgiKarti[] };

/** Kod → izinli seviye alanları (Kur'an dersleri okuma ya da Kur'an bilgisi; ibadet dersleri namaz ya da genel ibadet). */
export const IZINLI_ALAN: Record<PlanKodu, readonly AlanKodu[]> = {
  kuran: ['okuma', 'kuranBilgi'],
  itikat: ['itikat', 'kuranBilgi'],
  ibadet: ['ibadet', 'namaz'],
  siyer: ['siyer'],
  ahlak: ['ahlak'],
};
export const ON_EK: Record<PlanKodu, string> = { kuran: 'ku', itikat: 'it', ibadet: 'ib', siyer: 'si', ahlak: 'ah' };
export const OZET_ENCOK = 280;
