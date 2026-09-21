/** Seviye testi — «Nereden başvuruyorsunuz?» bölümünün tek kaynağı (21 Eyl 2026, form sürümü 2).
 *
 *  Karar (Rıdvan, 21 Eyl 2026): teste Avrupa'nın her yerinden girilebilir; eğitim planlaması katılımcıya
 *  EN YAKIN yerde yapılabilmelidir. Bunun için başvuranın ülkesi ve şehri, bildiği en yakın Diyanet camisi,
 *  o caminin din görevlisini tanıyıp tanımadığı ve ülkesindeki Din Hizmetleri Müşavirliği / Ataşeliğinden
 *  haberdar olup olmadığı sorulur. İki AYRI ve İSTEĞE BAĞLI onay vardır (işaretsiz gelir, testi göndermek
 *  için şart değildir): (1) sonuçların katılımcıya en yakın din görevlisiyle paylaşılması ve o görevlinin
 *  kendisiyle iletişim kurması, (2) bilgilerin ülkesindeki Müşavirlik / Ataşelikle paylaşılması.
 *  Onay yoksa hiçbir bilgi üçüncü kişiye verilmez (GDPR md. 9/2-a — dinî inanç verisi); hoca raporu bunu
 *  büyük harfle yazar. Sunucu (paket `SeviyeTesti`) gövdeyi bu listelere göre doğrular.
 *  Bu klasör Apps Script paketine girdiği için dış içe aktarım yoktur; `Dil` yereldir (tipler.ts).
 */
import type { Metin } from './tipler.ts';

export const YEREL_DEGERLERI = {
  ulke: ['BE', 'NL', 'DE', 'FR', 'LU', 'AT', 'CH', 'GB', 'IE', 'DK', 'SE', 'NO', 'FI', 'IT', 'ES', 'PT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'GR', 'TR', 'diger'],
  camiBiliyor: ['evet', 'hayir'],
  gorevliTaniyor: ['evet', 'hayir'],
  ateselikBilgisi: ['evet', 'hayir'],
} as const;

export type YerelAlani = keyof typeof YEREL_DEGERLERI;
export type UlkeKodu = (typeof YEREL_DEGERLERI.ulke)[number];

/** Zorunlu tek seçimli alanlar (form sürümü 2). `sehir` zorunlu serbest metin, `yakinCami` isteğe bağlıdır. */
export const YEREL_TEKLI: YerelAlani[] = ['ulke', 'camiBiliyor', 'gorevliTaniyor', 'ateselikBilgisi'];
export const YEREL_SINIRLARI = { sehir: 80, yakinCami: 120 } as const;
/** İsteğe bağlı paylaşım onaylarının gövdedeki adları (`onay.<ad>`: boolean; yoksa false sayılır). */
export const YEREL_ONAYLARI = ['yerelGorevli', 'ateselik'] as const;

export const ULKE_ADLARI: Record<UlkeKodu, Metin> = {
  BE: { tr: 'Belçika', fr: 'Belgique', en: 'Belgium', nl: 'België', de: 'Belgien' },
  NL: { tr: 'Hollanda', fr: 'Pays-Bas', en: 'Netherlands', nl: 'Nederland', de: 'Niederlande' },
  DE: { tr: 'Almanya', fr: 'Allemagne', en: 'Germany', nl: 'Duitsland', de: 'Deutschland' },
  FR: { tr: 'Fransa', fr: 'France', en: 'France', nl: 'Frankrijk', de: 'Frankreich' },
  LU: { tr: 'Lüksemburg', fr: 'Luxembourg', en: 'Luxembourg', nl: 'Luxemburg', de: 'Luxemburg' },
  AT: { tr: 'Avusturya', fr: 'Autriche', en: 'Austria', nl: 'Oostenrijk', de: 'Österreich' },
  CH: { tr: 'İsviçre', fr: 'Suisse', en: 'Switzerland', nl: 'Zwitserland', de: 'Schweiz' },
  GB: { tr: 'Birleşik Krallık', fr: 'Royaume-Uni', en: 'United Kingdom', nl: 'Verenigd Koninkrijk', de: 'Vereinigtes Königreich' },
  IE: { tr: 'İrlanda', fr: 'Irlande', en: 'Ireland', nl: 'Ierland', de: 'Irland' },
  DK: { tr: 'Danimarka', fr: 'Danemark', en: 'Denmark', nl: 'Denemarken', de: 'Dänemark' },
  SE: { tr: 'İsveç', fr: 'Suède', en: 'Sweden', nl: 'Zweden', de: 'Schweden' },
  NO: { tr: 'Norveç', fr: 'Norvège', en: 'Norway', nl: 'Noorwegen', de: 'Norwegen' },
  FI: { tr: 'Finlandiya', fr: 'Finlande', en: 'Finland', nl: 'Finland', de: 'Finnland' },
  IT: { tr: 'İtalya', fr: 'Italie', en: 'Italy', nl: 'Italië', de: 'Italien' },
  ES: { tr: 'İspanya', fr: 'Espagne', en: 'Spain', nl: 'Spanje', de: 'Spanien' },
  PT: { tr: 'Portekiz', fr: 'Portugal', en: 'Portugal', nl: 'Portugal', de: 'Portugal' },
  PL: { tr: 'Polonya', fr: 'Pologne', en: 'Poland', nl: 'Polen', de: 'Polen' },
  CZ: { tr: 'Çekya', fr: 'Tchéquie', en: 'Czechia', nl: 'Tsjechië', de: 'Tschechien' },
  HU: { tr: 'Macaristan', fr: 'Hongrie', en: 'Hungary', nl: 'Hongarije', de: 'Ungarn' },
  RO: { tr: 'Romanya', fr: 'Roumanie', en: 'Romania', nl: 'Roemenië', de: 'Rumänien' },
  BG: { tr: 'Bulgaristan', fr: 'Bulgarie', en: 'Bulgaria', nl: 'Bulgarije', de: 'Bulgarien' },
  GR: { tr: 'Yunanistan', fr: 'Grèce', en: 'Greece', nl: 'Griekenland', de: 'Griechenland' },
  TR: { tr: 'Türkiye', fr: 'Türkiye (Turquie)', en: 'Türkiye', nl: 'Turkije', de: 'Türkei' },
  diger: { tr: 'Başka bir ülke', fr: 'Un autre pays', en: 'Another country', nl: 'Een ander land', de: 'Ein anderes Land' },
};

/** Hoca raporu ve panel için Türkçe etiketler (rapor her zaman Türkçedir). */
export const YEREL_ETIKETLERI_TR = {
  ulke: 'Başvurduğu ülke',
  sehir: 'Şehir / posta kodu',
  camiBiliyor: 'En yakın Diyanet camisini biliyor mu',
  yakinCami: 'Bildirdiği en yakın Diyanet camisi',
  gorevliTaniyor: 'O caminin din görevlisini tanıyor mu',
  ateselikBilgisi: 'Ülkesindeki Din Hizmetleri Müşavirliği / Ataşeliğinden haberdar mı',
  yerelGorevli: 'En yakın din görevlisiyle paylaşım ve iletişim onayı',
  ateselik: 'Müşavirlik / Ataşelikle paylaşım onayı',
} as const;
export const EVET_HAYIR_TR: Record<string, string> = { evet: 'Evet', hayir: 'Hayır' };
