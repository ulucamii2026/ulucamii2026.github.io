/** Küçük DOM yardımcıları. Metin her zaman textContent ile yazılır: CMS metni HTML olarak yorumlanmaz. */
export const alan = (ad: string): HTMLElement | null => document.querySelector(`[data-alan="${ad}"]`);

export function yaz(ad: string, metin: string): void {
  const e = alan(ad);
  if (e && e.textContent !== metin) e.textContent = metin;
}

export function el(etiket: string, sinif?: string, metin?: string): HTMLElement {
  const e = document.createElement(etiket);
  if (sinif) e.className = sinif;
  if (metin !== undefined) e.textContent = metin;
  return e;
}
