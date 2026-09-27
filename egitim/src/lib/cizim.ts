/**
 * Codex vektör çizimleri (egitim/src/assets/cizim/sahne, SVG denetiminden geçer): satır içi basılır ki kontur
 * `currentColor`dan, sır renkleri sınıftan (`__s0…s3`) gelsin. Süs olduklarından başlıkları çıkarılır, ekran
 * okuyucudan gizlenir. Onaylı taslaktaki `cizim()` ile aynı dönüşüm.
 */
const DOSYALAR = import.meta.glob<string>('../assets/cizim/sahne/*.svg', { query: '?raw', import: 'default', eager: true });
const SAHNE: Record<string, string> = Object.fromEntries(
  Object.entries(DOSYALAR).map(([yol, svg]) => [yol.replace(/^.*\//, '').replace(/\.svg$/, ''), svg]),
);

export function cizim(ad: string, sinif = ''): string {
  const svg = SAHNE[ad];
  if (!svg) throw new Error(`çizim yok: ${ad}`);
  return svg
    .replace('<svg ', `<svg class="cizim${sinif ? ` ${sinif}` : ''}" aria-hidden="true" focusable="false" `)
    .replace(/<title>[^<]*<\/title>/, '');
}
