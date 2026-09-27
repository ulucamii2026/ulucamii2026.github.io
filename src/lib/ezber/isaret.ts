/**
 * Ezber Kilimi — basamak işareti (27 Eylül 2026, Faz 1c). Dokuma «göz» motifi: kilimde olduğu gibi basamaklı
 * baklava; basamak ilerledikçe motif dolar. Renk tek başına bilgi taşımaz: her basamağın biçimi ayrıdır
 * (0 nokta · 1 boş baklava · 2 ortası dolu · 3 dolu, ortası boş haç · 4 dolu küçük baklava + dış çerçeve).
 * İşaret süstür (`aria-hidden`); adını çevresindeki metin ya da `aria-label` taşır. Renk CSS'te: `.ez-isaret.b0…b4`
 * (`src/styles/hoca-ezber.css`); SVG `currentColor` kullanır. Saf: DOM bilmez, dize döndürür.
 */
import type { Basamak } from './durum';

/** Büyük basamaklı baklava (x 3–17, y 2–18). */
const BUYUK = 'M9 2H11V4H13V6H15V8H17V12H15V14H13V16H11V18H9V16H7V14H5V12H3V8H5V6H7V4H9Z';
/** Ortadaki haç (x 7–13, y 7–13). */
const ORTA = 'M9 7H11V9H13V11H11V13H9V11H7V9H9Z';
/** Kalıcı: küçük dolu baklava (x 5–15, y 4–16) ve dış çerçeve (x 1–19, y 1–19). */
const KUCUK = 'M9 4H11V6H13V8H15V12H13V14H11V16H9V14H7V12H5V8H7V6H9Z';
const CERCEVE = 'M9 1H11V3H13V5H15V7H17V9H19V11H17V13H15V15H13V17H11V19H9V17H7V15H5V13H3V11H1V9H3V7H5V5H7V3H9Z';

const GOVDE: Readonly<Record<Basamak, string>> = Object.freeze({
  0: '<circle cx="10" cy="10" r="1.7" fill="currentColor"/>',
  1: `<path d="${BUYUK}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"/>`,
  2: `<path d="${BUYUK}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"/><path d="${ORTA}" fill="currentColor"/>`,
  3: `<path d="${BUYUK}${ORTA}" fill="currentColor" fill-rule="evenodd"/>`,
  4: `<path d="${CERCEVE}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="miter"/><path d="${KUCUK}" fill="currentColor"/>`,
});

/** Basamak işareti; `ek` sınıfı (ör. «kontrol») kontrol günü gelen maddeyi CSS'te halkayla ayırır. */
export function basamakIsareti(b: Basamak, ek = ''): string {
  const govde = GOVDE[b] ?? GOVDE[0];
  return `<svg class="ez-isaret b${b}${ek ? ` ${ek}` : ''}" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">${govde}</svg>`;
}
