/** Kayıt defterindeki veli e-postasını ayarlar/portal.epostaDuzelt eşlemesinden geçirir (10 Ekim 2026).
 *  Eşleme yoksa defterdeki adres, varsa eşlenen değer kullanılır. Geçerli bir adres değilse sonuç '' olur ve
 *  çağıran veli/aile bağı KURMAZ. Bu durumlar: boş hücre ya da '@' içermeyen işaret (ör. «gecersiz-geri-donuyor»:
 *  adres geri dönüyor, doğrusu bekleniyor). Adres düzeni Apps Script veli-mail-listesi.gs ile aynıdır; '/' içeren
 *  değer Firestore belge yolunu da bozardı. Aynı kural: portal-yonetim.py ice_aktar. */
const ADRES = /^[^\s@/\\]+@[^\s@/\\]+\.[^\s@/\\]+$/;

export function defterVeliEpostasi(defterdeki: unknown, duzelt: Record<string, unknown> = {}): string {
  const ham = String(defterdeki ?? '').trim().toLowerCase();
  const eslenen = ham && Object.prototype.hasOwnProperty.call(duzelt, ham) ? duzelt[ham] : '';
  const ep = String(eslenen || ham).trim().toLowerCase();
  return ADRES.test(ep) && ep.length <= 254 ? ep : '';
}
