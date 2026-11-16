/** İhtida başvurusunda EK-9 kişisel metin alanları için ortak denetim (16 Kasım 2026, v49).
 *  Gerekçe: DHYS boş alanı reddeder; «..», «-», «x» gibi yer tutucular belgeye «Bildirilmedi» olarak düşüyordu.
 *  Kural: değerde en az 2 Unicode HARF (her alfabe) bulunmalı; bilmeyen kişi «Bilinmiyor» gibi bir sözcük yazar.
 *  İhtida sebebi: en az 10 karakter ve en az 5 harf.
 *  Karşılıkları (aynı kural, ayrı kopya): scripts/apps-script/ulucamii-Kod-v50.gs → ihtidaKisiMetniTamam / ihtidaSebepTamam,
 *  public/admin/ek9-hazirlik.js → kisiMetniTamam / sebepTamam. Değiştirirsen üçünü birlikte değiştir. */
export const KISI_METNI_ASGARI_HARF = 2;
export const SEBEP_ASGARI_KARAKTER = 10;
export const SEBEP_ASGARI_HARF = 5;

export function harfSay(s: unknown): number {
  const m = String(s == null ? '' : s).match(/\p{L}/gu);
  return m ? m.length : 0;
}

export function kisiMetniTamam(s: unknown): boolean {
  return harfSay(s) >= KISI_METNI_ASGARI_HARF;
}

export function sebepTamam(s: unknown): boolean {
  const d = String(s == null ? '' : s).trim();
  return d.length >= SEBEP_ASGARI_KARAKTER && harfSay(d) >= SEBEP_ASGARI_HARF;
}
