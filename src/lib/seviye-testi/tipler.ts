/** Kur'an ve dinî bilgi seviye tespit testi — tip sözleşmesi (20 Eyl 2026).
 *
 *  Tek kaynak: soru bankası bu tiplerle `sorular/*.ts` içinde durur; sayfa (Astro), sunucu paketi (esbuild →
 *  Apps Script `SeviyeTesti`) ve testler (Node 24 tür sıyırma) aynı dosyaları okur. Bu yüzden klasör içinde
 *  değer importları açık `.ts` uzantılıdır, enum/namespace yoktur, `Dil` yerelde tanımlıdır.
 *  Ayrıntı ve soru yazım kılavuzu: docs/SEVIYE-TESTI.md
 */
export type Dil = 'tr' | 'fr' | 'en';
export type Metin = Record<Dil, string>;

/** Puanlanan alanlar. `okuma` beş basamaklı merdivendir (K1–K5), diğerleri üç basamaklıdır (B1–B3). */
export type AlanKodu = 'okuma' | 'kuranBilgi' | 'itikat' | 'namaz' | 'ibadet' | 'siyer' | 'ahlak';
export type BilgiAlani = Exclude<AlanKodu, 'okuma'>;
export type Basamak = 1 | 2 | 3;
export type OkumaBasamagi = 1 | 2 | 3 | 4 | 5;

/** Şık ya üç dilli metindir ya da Arapça yazılıştır (`ar`). «Bilmiyorum» şıkkı bankada YAZILMAZ; bileşen ekler (değer -1). */
export type Sik = Metin | { ar: string };

type OrtakMadde = {
  /** `^[a-z]{2}\d{2,3}$` — nokta yok; yayından sonra değişmez, emekli madde silinmez. */
  id: string;
  soru: Metin;
  /** 3 ya da 4 şık; normalize edildikten sonra da birbirinden farklı olmalı. */
  siklar: Sik[];
  /** `siklar` dizinindeki doğru şıkkın sırası (0 tabanlı). Sayfaya basılmaz. */
  dogru: number;
  /** Kaynak künyesi (eser + bölüm ya da URL). Sayfaya basılmaz; hoca raporuna ve döküm belgesine girer. */
  kaynak: string;
  emekli?: true;
};

export type BilgiMaddesi = OrtakMadde & {
  tur: 'bilgi';
  alan: BilgiAlani;
  basamak: Basamak;
  /** Mezhebe göre değişen hüküm: soru kökünde «Hanefî mezhebine göre» yazar, puana girmez, rapora bilgi olarak düşer. */
  mezhepBagli?: true;
  /** Soru kökünün altında gösterilecek Arapça ibare (ör. âyet). */
  goster?: string;
};

export type OkumaMaddesi = OrtakMadde & {
  tur: 'okuma';
  alan: 'okuma';
  basamak: OkumaBasamagi;
  /** «gör → seç»: ekranda gösterilen Arapça harf/hece/kelime/ibare. */
  goster?: string;
  /** «dinle → seç»: yerel Diyanet sesi, `/media/ses/elifba/…` (cezm/şedde için `src/data/elifba-alistirmalari.json` çifti). */
  ses?: string;
};

export type Madde = BilgiMaddesi | OkumaMaddesi;

/** Ezber listesi: 0 bilmiyorum · 1 bakarak okurum · 2 ezbere biliyorum. */
export type EzberMaddesi = { id: string; ad: Metin; aciklama?: Metin };

/** Öz beyan (tek seçim). `kume`: Kur'an okuma beyanı mı, ibadet uygulaması mı. */
export type BeyanMaddesi = { id: string; kume: 'okuma' | 'uygulama'; soru: Metin; secenekler: Metin[] };

export type Cevaplar = Record<string, number>; // madde id → şık sırası | -1 (bilmiyorum)

export type BasamakSonucu = { basamak: number; dogru: number; toplam: number; gecti: boolean };
export type AlanSonucu = {
  alan: BilgiAlani;
  /** 0 Başlangıç · 1 Temel · 2 Orta · 3 İleri */
  duzey: 0 | 1 | 2 | 3;
  yuzde: number;
  atlandi: boolean;
  basamaklar: BasamakSonucu[];
};
export type OkumaSonucu = {
  /** 0 harfleri henüz bilmiyor … 5 kelime ve âyet okuyor (kesintisiz geçilen en yüksek basamak) */
  duzey: 0 | 1 | 2 | 3 | 4 | 5;
  atlandi: boolean;
  basamaklar: BasamakSonucu[];
  /** Kur'an bilgisi B3 (tecvid kavramları) geçildi mi. */
  tecvid: boolean;
};
export type ProgramOnerisi = 'A' | 'B' | 'C' | 'D';
export type Sonuc = {
  okuma: OkumaSonucu;
  alanlar: AlanSonucu[];
  program: ProgramOnerisi;
  /** Puana girmeyen mezhebe bağlı maddelerde verilen cevaplar (hocaya bilgi). */
  mezhepNotlari: { id: string; verilen: number; dogru: number }[];
};
