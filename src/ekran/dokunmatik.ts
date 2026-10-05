/** Kişisel görünüm açık seçimdir; pencere boyutu cihaz rolü veya kiosk yetkisi üretmez. */
export const dokunmatikKipiOku = (kip: string | null): boolean => kip === 'dokunmatik';

export function dokunmatikOlcu(genislik: number, yukseklik: number, buyuk: boolean): {
  sinif: 'compact' | 'medium' | 'expanded'; kisa: boolean; u: number;
} {
  return {
    sinif: genislik < 600 ? 'compact' : genislik < 840 ? 'medium' : 'expanded',
    kisa: yukseklik < 480,
    // Ortak OLCU tabanları: FR 20,3 px, kaynak 16,1 px. Dar/çok kısa alan yazıyı küçültmez.
    u: buyuk ? 9.8 : 7,
  };
}

/** TV tuvalinden bağımsız, doğal içerik yüksekliği. Ölçüm içerikten etkilenmeyen sabit sahneden gelir.
 *  Slayt alanı otomatik boylanır; burada ResizeObserver kullanılmaz (yazı ölçümünün geri besleme döngüsü yok). */
export function dokunmatikKur(kok: HTMLElement, degisince: () => void): void {
  let buyuk = false;
  const sahne = kok.parentElement;
  kok.setAttribute('data-kip', 'dokunmatik');
  kok.setAttribute('data-duzen', 'dikey');
  if (sahne) sahne.setAttribute('data-kip', 'dokunmatik');
  const vakit = kok.querySelector('[data-alan="vakitler"]');
  const slayt = kok.querySelector('[data-alan="slayt"]');
  if (vakit && slayt) kok.insertBefore(vakit, slayt);
  const araclar = kok.querySelector<HTMLElement>('.dokunmatik-araclar');
  if (araclar) araclar.hidden = false;
  if (vakit) vakit.setAttribute('aria-label', 'Namaz vakitleri · Horaires de prière');
  if (slayt) slayt.setAttribute('aria-label', 'Levha ve duyurular · Textes et annonces');
  const saat = kok.querySelector('[data-alan="saat"]');
  if (saat) { saat.setAttribute('role', 'timer'); saat.setAttribute('aria-live', 'off'); }
  const uygula = (): void => {
    const r = sahne?.getBoundingClientRect();
    const s = dokunmatikOlcu(r?.width || window.innerWidth, r?.height || window.innerHeight, buyuk);
    const temel = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    kok.setAttribute('data-pencere', s.sinif);
    kok.setAttribute('data-kisa', s.kisa ? 'evet' : 'hayir');
    kok.setAttribute('data-buyuk', buyuk ? 'evet' : 'hayir');
    kok.style.setProperty('--u', (s.u * temel / 16) + 'px');
    kok.style.setProperty('--saat-boy', Math.min(64 * temel / 16, ((r?.width || window.innerWidth) - 40) / 3.8) + 'px');
  };
  uygula(); // Main durumu ilk çağrıda henüz kurulmadı.
  const yenile = (): void => { uygula(); degisince(); };
  window.addEventListener('resize', yenile);
  const font = kok.querySelector<HTMLButtonElement>('[data-dokun="yazi"]');
  font?.addEventListener('click', () => {
    buyuk = !buyuk;
    font.setAttribute('aria-pressed', String(buyuk));
    yenile();
  });
}
