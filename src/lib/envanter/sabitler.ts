/** Mühtedi Hizmetleri Envanteri — değer kümeleri ve sınırlar (1 Ekim 2026).
 *
 *  Bu dosya HİÇBİR şey içe aktarmaz: tarayıcı betiği (envanter-form.ts), Astro bileşeni, sözleşme
 *  (sozlesme.ts) ve Apps Script paketi (`EnvanterVeri`) aynı değerleri buradan okur. Değer (anahtar)
 *  değiştirmek, defterdeki eski satırlarla uyumu bozar; yeni değer yalnız SONA eklenir.
 *  Görünen Türkçe adlar: src/i18n/formlar/envanter-tr.ts
 */

/** Gövde biçimi. Alan eklenir/çıkarılırsa artırılır; sunucu başka sürümü kabul etmez. */
export const FORM_SURUMU = 1;
/** Bilgilendirme ve onay metninin sürümü (GDPR md. 9/2-a damgası). Metin değişirse artırılır. */
export const ONAY_SURUMU = 'envanter-bilgilendirme-v1';
/** Bir gönderimdeki en çok adlı bildirim satırı. */
export const AZAMI_KISI = 40;
/** Sayı alanlarının üst sınırı (0 dahil, tam sayı). */
export const AZAMI_SAYI = 999;
/** Cami listesinde bulunmayan cami için seçim değeri (serbest ad yazılır). */
export const LISTEDE_YOK = 'listede-yok';
/** Asgari Apps Script sürümü (sağlık yanıtı `surum`). */
export const ASGARI_SERVIS_SURUMU = 42;

/** Koordinatörlük bölgeleri (T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği cami listesi). */
export const BOLGELER = ['Antwerpen', 'Brüksel', 'Charleroi', 'Gent', 'Limburg', 'Liège', 'Namur'] as const;
export const STATULER = ['baokk', 'uip', 'kisa-sureli', 'executif', 'fahri', 'emekli', 'bdv', 'diger'] as const;
export const GOREVLI_DILLERI = ['tr', 'fr', 'nl', 'en', 'de', 'ar', 'diger'] as const;
export const IHTIDA_YILLARI = ['2026', '2025', '2024', '2023', '2022', '2021-oncesi'] as const;
export const CINSIYETLER = ['kadin', 'erkek'] as const;
/** Belge durumu: sayılarda «belgesini alan / almayan / almak isteyen», satırda «aldı / almadı / almak istiyor». */
export const BELGE_DURUMLARI = ['aldi', 'almadi', 'istiyor'] as const;
export const YAS_GRUPLARI = ['18-alti', '18-25', '26-40', '41-60', '60-ustu'] as const;
export const TERCIH_DILLERI = ['fr', 'nl', 'en', 'de', 'tr', 'ar', 'diger'] as const;
export const DURUM_ALANLARI = [
  'duzenliGelen', 'irtibatKopan', 'baskiYasayan', 'egitimIsteyen', 'kardesAileIsteyen', 'cenazeFonuBilgi', 'konyaIsteyen',
] as const;
export const FAALIYETLER = ['dersSohbet', 'acikKapi', 'bulusmaIftar', 'kadinProgrami', 'komite'] as const;
export const GONULLU_ALANLARI = ['kadin', 'erkek', 'kardesAile'] as const;
export const EVET_HAYIR = ['evet', 'hayir'] as const;
export const BELGE_VAR = ['evet', 'hayir', 'bilmiyorum'] as const;
export const IRTIBAT_ISTEGI = ['evet', 'hayir', 'gorusmek'] as const;
/** 8b: bölge ihtida sorumlusu adayı (BDV personeli). */
export const ADAY_B_SECIMLERI = ['yok', 'baskasi', 'kendim'] as const;

/** Metin uzunluk sınırları (karakter). İstemci `maxlength` ve sunucu aynı sayıları kullanır. */
export const SINIR = {
  ad: 120,
  kod: 40,
  telefon: 20,
  eposta: 160,
  camiSerbest: 160,
  statuAciklama: 80,
  digerDil: 60,
  neden: 300,
  gerekce: 600,
  uzunMetin: 1500,
} as const;

export type Bolge = (typeof BOLGELER)[number];
export type Statu = (typeof STATULER)[number];
export type GorevliDili = (typeof GOREVLI_DILLERI)[number];
export type IhtidaYili = (typeof IHTIDA_YILLARI)[number];
export type Cinsiyet = (typeof CINSIYETLER)[number];
export type BelgeDurumu = (typeof BELGE_DURUMLARI)[number];
export type YasGrubu = (typeof YAS_GRUPLARI)[number];
export type TercihDili = (typeof TERCIH_DILLERI)[number];
export type DurumAlani = (typeof DURUM_ALANLARI)[number];
export type Faaliyet = (typeof FAALIYETLER)[number];
export type GonulluAlani = (typeof GONULLU_ALANLARI)[number];
export type BelgeVar = (typeof BELGE_VAR)[number];
export type IrtibatIstegi = (typeof IRTIBAT_ISTEGI)[number];
export type AdayBSecimi = (typeof ADAY_B_SECIMLERI)[number];
