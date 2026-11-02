/**
 * İlim Yolu kullanıcı adı (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Ortak kararlar» 3): yalnız BİÇİM. Ad önce normalleştirilir
 * (NFKC, kırpma, küçük harf), sonra `^[a-z0-9][a-z0-9._-]{2,23}$` kalıbına bakılır. Ayrılmış adlar listesi YALNIZ sunucudadır
 * (callable `kullaniciAdiAl`); buraya konmaz, çünkü bu dosya tarayıcı paketine girer. Sunucu da aynı normalleştirmeyi bu dosyadan
 * alır: iki taraf aynı adı aynı biçimde görür. Saf; dil ayarına (locale) bağlı değildir.
 */
export const KULLANICI_ADI = /^[a-z0-9][a-z0-9._-]{2,23}$/;
export const AD_ENAZ = 3;
export const AD_ENCOK = 24;

export type AdNedeni = 'kisa' | 'uzun' | 'karakter' | 'bas';
export type AdSonucu = { readonly ok: true; readonly ad: string } | { readonly ok: false; readonly neden: AdNedeni };

/**
 * NFKC (tam genişlikli harf → düz harf), kırpma, küçük harf. Türkçe «İ» doğrudan «i» olur (JS'nin `toLowerCase`'i «i» + birleşen
 * nokta üretir); «I» de «i» olur: «IRMAK» → «irmak» (Türkçe yerel ayarın «ı»sı kalıba uymazdı). «ı» olduğu gibi kalır; kalıp onu
 * reddeder, `oneri` «i» önerir.
 */
export function normalize(ad: string): string {
  return String(ad ?? '').normalize('NFKC').replace(/İ/g, 'i').toLowerCase().normalize('NFKC').trim();
}

/** Normalleştirilmiş ad kalıba uyuyor mu; uyuyorsa normal biçimini de döner (sunucu ve istemci saklanacak adı buradan alır). */
export function gecerliMi(girdi: string): AdSonucu {
  const ad = normalize(girdi);
  const uzunluk = [...ad].length;
  if (uzunluk < AD_ENAZ) return { ok: false, neden: 'kisa' };
  if (uzunluk > AD_ENCOK) return { ok: false, neden: 'uzun' };
  if (!/^[a-z0-9]/.test(ad)) return { ok: false, neden: 'bas' };
  if (!KULLANICI_ADI.test(ad)) return { ok: false, neden: 'karakter' };
  return { ok: true, ad };
}

const HARF: Readonly<Record<string, string>> = {
  ı: 'i', İ: 'i', I: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
  â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u', ß: 'ss',
};

/**
 * Serbest yazılmış addan (ör. «Ahmet Yılmaz») kalıba uyan bir öneri: Türkçe harfler Latin karşılığına çevrilir, diğer harflerin
 * aksanı atılır (é → e), boşluk «.» olur, kalan geçersiz karakterler silinir, baştaki ayraçlar atılır, 24 karaktere kısaltılır;
 * 3'ten kısa kalırsa «0» ile tamamlanır. Kullanılabilir hiçbir harf kalmazsa boş dize döner. Ad müsait mi, ayrılmış mı: sunucu.
 */
export function oneri(ad: string): string {
  const s = String(ad ?? '')
    .normalize('NFKC')
    .replace(/[ıİIşŞğĞüÜöÖçÇâÂîÎûÛß]/g, (h) => HARF[h] ?? '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/([._-])[._-]+/g, '$1')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, AD_ENCOK);
  if (!s) return '';
  return s.length < AD_ENAZ ? s.padEnd(AD_ENAZ, '0') : s;
}
