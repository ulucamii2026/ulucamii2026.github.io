/** Bulletin d’école Sürüm 3: 324 sayfa; 261 ders 55–315. sayfalarda.
 * Kaynak: Surum-3/sayfa-haritasi.json, 15 Eylül 2026'da PDF'lerle doğrulandı.
 * Firestore/katalog `sayfa` alanı eski sürümün no+50 kimlik bilgisidir;
 * basılı yönlendirmede kullanılmaz, mevcut kayıtların sözleşmesi korunur.
 */
export const BASILI_DEFTER = { surum: 3, sayfaSayisi: 324, ilkDersSayfasi: 55, dersSayisi: 261 } as const;

export function basiliDefterSayfasi(ders: { no: number }): number {
  if (!Number.isInteger(ders.no) || ders.no < 1 || ders.no > BASILI_DEFTER.dersSayisi)
    throw new RangeError('Basılı defter ders numarası geçersiz.');
  return BASILI_DEFTER.ilkDersSayfasi + ders.no - 1;
}
