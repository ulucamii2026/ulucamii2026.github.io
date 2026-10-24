/**
 * Madde sayfası (Faz 2b): metindeki âyet numarasına dokununca o âyet çalar, çalan âyet metinde işaretlenir; okunuş
 * düğmesi. Çaların kendisi calisma.ts'tedir; ikisi `calisma:cal` / `calisma:parca` olaylarıyla konuşur. JavaScript
 * yoksa düğmeler kapalı kalır, metin ve meâl okunur.
 */
export {}; // modül: üst düzey adlar calisma.ts ile çakışmasın

const kok = document.querySelector<HTMLElement>('[data-calisma]');
const metin = document.querySelector<HTMLElement>('[data-metin]');

if (kok && metin) {
  const dugmeler = [...metin.querySelectorAll<HTMLButtonElement>('button[data-parca]')];
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)');
  for (const d of dugmeler) {
    d.disabled = false;
    d.addEventListener('click', () => kok.dispatchEvent(new CustomEvent('calisma:cal', { detail: Number(d.dataset.parca) })));
  }
  if (dugmeler.length) document.querySelector('[data-dokun-ipucu]')?.removeAttribute('hidden');
  kok.addEventListener('calisma:parca', (e) => {
    const parca = (e as CustomEvent<number>).detail;
    let calan: HTMLElement | null = null;
    for (const d of dugmeler) {
      const bu = Number(d.dataset.parca) === parca;
      const ayet = d.closest<HTMLElement>('.ayet');
      d.toggleAttribute('data-calan', bu);
      ayet?.toggleAttribute('data-calan', bu);
      if (bu) calan = ayet;
    }
    // Metne bakan kullanıcı için çalan âyet görünür alana gelir; çalardayken sayfa kaymaz, azaltılmış harekette hiç kaymaz.
    if (!calan || azHareket.matches) return;
    const alan = metin.getBoundingClientRect();
    const r = (calan as HTMLElement).getBoundingClientRect();
    if (alan.top < innerHeight && alan.bottom > 0 && (r.top < 0 || r.bottom > innerHeight)) {
      (calan as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

const okunus = document.querySelector<HTMLButtonElement>('[data-okunus-dugme]');
if (okunus && metin) {
  okunus.hidden = false;
  okunus.addEventListener('click', () => {
    const acik = okunus.getAttribute('aria-pressed') !== 'true';
    okunus.setAttribute('aria-pressed', String(acik));
    metin.dataset.okunus = acik ? 'acik' : 'gizli';
  });
}
