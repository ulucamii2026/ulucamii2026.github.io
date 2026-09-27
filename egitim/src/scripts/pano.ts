/**
 * Pano davranışı (onaylı taslaktaki betik): gezilen karonun adı ve bilgisi yeşil kuşağa yazılır; sır, dokunulan
 * noktadan yayılır (--x/--y, CSSOM ile; satır içi stil yok). Klavye: panoya tek sekme durağı (dolaşan tabindex);
 * ←/→ katalog sırası (şeritler, sonra kenar suyu saat yönünde), ↑/↓ ızgarada en yakın karo (önce satır, sonra sütun
 * uzaklığı), Home/End uçlar.
 */
const kusak = document.querySelector<HTMLElement>('[data-kusak]');
const karolar = [...document.querySelectorAll<HTMLAnchorElement>('.pano .karo.madde')];

if (kusak && karolar.length) {
  const varsayilan = [...kusak.childNodes].map((n) => n.cloneNode(true));
  const yaz = (k: HTMLElement) => {
    const ad = document.createElement('b');
    ad.textContent = k.dataset.ad ?? '';
    const ek = document.createElement('span');
    ek.className = 'kusak-ek';
    ek.textContent = k.dataset.ek ?? '';
    kusak.replaceChildren(ad, ek);
  };
  const geri = () => kusak.replaceChildren(...varsayilan.map((n) => n.cloneNode(true)));
  const konum = (k: HTMLElement, e?: PointerEvent) => {
    const r = k.getBoundingClientRect();
    const x = e && e.clientX ? ((e.clientX - r.left) / r.width) * 100 : 50;
    const y = e && e.clientY ? ((e.clientY - r.top) / r.height) * 100 : 50;
    k.style.setProperty('--x', `${x.toFixed(1)}%`);
    k.style.setProperty('--y', `${y.toFixed(1)}%`);
  };
  karolar.forEach((k, i) => {
    k.tabIndex = i === 0 ? 0 : -1;
    k.addEventListener('pointerenter', (e) => { konum(k, e); yaz(k); });
    k.addEventListener('focus', () => { konum(k); yaz(k); });
    k.addEventListener('blur', geri);
  });
  document.querySelector('.pano-cerceve')?.addEventListener('pointerleave', geri);

  const hucre = (k: HTMLElement) => ({ r: Number(k.dataset.r), c: Number(k.dataset.c) });
  const dikey = (k: HTMLElement, yon: 1 | -1) => {
    const { r, c } = hucre(k);
    let en: HTMLAnchorElement | null = null;
    let enSkor = Infinity;
    for (const x of karolar) {
      const h = hucre(x);
      const d = (h.r - r) * yon;
      const skor = d * 100 + Math.abs(h.c - c);
      if (d > 0 && skor < enSkor) { en = x; enSkor = skor; }
    }
    return en;
  };
  document.addEventListener('keydown', (e) => {
    const k = document.activeElement;
    if (!(k instanceof HTMLAnchorElement) || !karolar.includes(k)) return;
    const i = karolar.indexOf(k);
    let hedef: HTMLAnchorElement | null | undefined = null;
    if (e.key === 'ArrowRight') hedef = karolar[i + 1];
    else if (e.key === 'ArrowLeft') hedef = karolar[i - 1];
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') hedef = dikey(k, e.key === 'ArrowDown' ? 1 : -1);
    else if (e.key === 'Home') hedef = karolar[0];
    else if (e.key === 'End') hedef = karolar[karolar.length - 1];
    if (hedef) {
      e.preventDefault();
      k.tabIndex = -1;
      hedef.tabIndex = 0;
      hedef.focus();
    }
  });
}
