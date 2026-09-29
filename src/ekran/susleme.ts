/**
 * Levhada Arapça ile meal arasındaki süsleme (A alt projesi): iki ince çizgi, ortada sekiz köşeli yıldız.
 * Sabit satır içi SVG — vektör, raster yok; boyutu CSS verir (ekran.css → .levha .susleme). Çizgiler metin rengini
 * (currentColor), yıldız kurumsal ana rengi alır (ekran.css → .susleme .yildiz). Kimlik (id) taşımaz; sayfaya
 * yalnız koddaki bu sabit dize eklenir (CMS metni asla HTML olarak yazılmaz).
 */
export const SUSLEME_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" class="susleme" viewBox="0 0 200 20" aria-hidden="true" focusable="false">' +
  '<path d="M4 10H82M118 10H196" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>' +
  '<path class="yildiz" d="M94 4H106V16H94ZM100 1.5L108.5 10L100 18.5L91.5 10Z"/>' +
  '</svg>';
