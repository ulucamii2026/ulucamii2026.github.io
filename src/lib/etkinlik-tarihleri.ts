/** Süreli duyuru tarihleri — tek kaynak. HacBandi.astro ve DiyanetHizmetleri.astro buradan
 * import eder; iki dosyada ayrı ayrı kopyalanmaz, senkron kaybı riski ortadan kalkar. */
/** Ön kayıt son günü — Müşavirliğin 4 Eylül 2026 yazısı: «2027 Hac ön kayıtları 11.09.2026 tarihine
 * kadar devam etmektedir». Vakfın ön kayıt sayfası aynı gün hâlâ 30.09.2026 yazıyordu; Müşavirlik takvimi esastır. */
export const HAC_SON_GUN = new Date('2026-09-11T23:59:59+02:00');
/** Kesin kayıt son günü — aynı yazı: 30.10.2026'ya uzatıldı; kesin kayıt e-postaları 07.09.2026'dan itibaren. */
export const HAC_KESIN_SON_GUN = new Date('2026-10-30T23:59:59+01:00');
export const HAC_DUYURU_SLUG = '2027-hac-on-kayit-son-gunler';

export const UMRE_SON_GUN = new Date('2026-11-20T23:59:59+01:00');
export const UMRE_DUYURU_SLUG = 'taif-ziyaretli-aralik-umresi';

/** Uluslararası İlahiyat Programı (UİP) başvuru dönemi — tek kaynak (src/sayfalar/Uip.astro).
 * Diyanet her yıl şubatta yeni kılavuzla ilan eder; yeni dönemde yalnız bu üç satır güncellenir
 * (ISO gün, Brüksel takvimine göre karşılaştırılır). Kaynak: 2026 UİP Tanıtım ve Başvuru Kılavuzu, s. 15/18. */
export const UIP_DONEM = 2026;
export const UIP_BASVURU_BASLANGIC = '2026-02-23';
export const UIP_BASVURU_SON = '2026-05-29';

/** Kur'an kursu ders yılı — tek kaynak. Yeni döneme geçişte yalnızca bu satır güncellenir;
 * "2026-2027" yazan diğer tüm yerler (dosya adları, PDF/JSON veri yolları) elle izlenmelidir,
 * çünkü onlar fiziksel dosya adlarına bağlıdır ve buradan otomatik türetilemez. */
export const DERS_YILI_BASLANGIC = 2026;
export const DERS_YILI_ETIKETI = `${DERS_YILI_BASLANGIC}–${DERS_YILI_BASLANGIC + 1}`; // örn. "2026–2027" (en tire)
