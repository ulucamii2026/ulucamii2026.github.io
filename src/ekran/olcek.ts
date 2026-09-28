/**
 * Dikey tuval (9:16) ekrana sığdırılır. Kutu yatay 16:9 sinyal verir; ekran dikey asıldığında ?don=90
 * (ya da 270) tuvali döndürür. Bütün ölçüler --u'ya bağlıdır (tuval genişliğinin %1'i, px): eski
 * WebView'de cqw/clamp olmadığı için ölçek JS ile verilir.
 */
export function olcekKur(tuval: HTMLElement, don: 0 | 90 | 270): void {
  const uygula = (): void => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const alanG = don ? H : W;
    const alanY = don ? W : H;
    const g = Math.min(alanG, (alanY * 9) / 16);
    const y = (g * 16) / 9;
    tuval.style.width = g + 'px';
    tuval.style.height = y + 'px';
    tuval.style.setProperty('--u', g / 100 + 'px');
    const x = (W - (don ? y : g)) / 2;
    const ust = (H - (don ? g : y)) / 2;
    tuval.style.transformOrigin = '0 0';
    tuval.style.transform =
      don === 90 ? `translate(${x + y}px, ${ust}px) rotate(90deg)`
      : don === 270 ? `translate(${x}px, ${ust + g}px) rotate(270deg)`
      : `translate(${x}px, ${ust}px)`;
  };
  uygula();
  window.addEventListener('resize', uygula);
}
