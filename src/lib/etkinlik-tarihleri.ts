/** Süreli duyuru tarihleri — tek kaynak. HacBandi.astro ve DiyanetHizmetleri.astro buradan
 * import eder; iki dosyada ayrı ayrı kopyalanmaz, senkron kaybı riski ortadan kalkar. */
export const HAC_SON_GUN = new Date('2026-09-30T23:59:59+02:00');
export const HAC_DUYURU_SLUG = '2027-hac-on-kayit-son-gunler';

export const UMRE_SON_GUN = new Date('2026-11-20T23:59:59+01:00');
export const UMRE_DUYURU_SLUG = 'taif-ziyaretli-aralik-umresi';

/** Kur'an kursu ders yılı — tek kaynak. Yeni döneme geçişte yalnızca bu satır güncellenir;
 * "2026-2027" yazan diğer tüm yerler (dosya adları, PDF/JSON veri yolları) elle izlenmelidir,
 * çünkü onlar fiziksel dosya adlarına bağlıdır ve buradan otomatik türetilemez. */
export const DERS_YILI_BASLANGIC = 2026;
export const DERS_YILI_ETIKETI = `${DERS_YILI_BASLANGIC}–${DERS_YILI_BASLANGIC + 1}`; // örn. "2026–2027" (en tire)
