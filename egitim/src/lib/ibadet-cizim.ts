/**
 * «Abdest ve Namaz» çizimleri (10 Kasım 2026): egitim/src/assets/cizim/ibadet/*.svg, saf vektör, yüzsüz sade figürler (yalnız bu bölümde
 * kullanılan, imamın verdiği Motif Yasağı istisnası). Sayfa, kullandığı çizimleri BİR KEZ gizli bir `<symbol>` setinde taşır; her yerde
 * `<use href="#ib-…">` ile çağrılır (aynı çizim birden çok yerde geçse de sayfa şişmez). Denetim: scripts/svg-denetim.mjs.
 */
const DOSYALAR = import.meta.glob<string>('../assets/cizim/ibadet/*.svg', { query: '?raw', import: 'default', eager: true });
const SVG: Record<string, string> = Object.fromEntries(
  Object.entries(DOSYALAR).map(([yol, svg]) => [yol.replace(/^.*\//, '').replace(/\.svg$/, ''), svg]),
);

export const CIZIM_KIMLIKLERI: readonly string[] = Object.keys(SVG);

/** Bir çizimin `<symbol>` karşılığı. */
export function sembol(ad: string): string {
  const svg = SVG[ad];
  if (!svg) throw new Error(`çizim yok: ${ad}`);
  const ic = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<symbol id="ib-${ad}" viewBox="0 0 240 240">${ic}</symbol>`;
}

/** Sayfanın başında bir kez basılan gizli sembol seti. */
export function sembolSeti(adlar: readonly string[]): string {
  const tekil = [...new Set(adlar)];
  return `<svg class="ib-sprite" aria-hidden="true" focusable="false" width="0" height="0">${tekil.map(sembol).join('')}</svg>`;
}
