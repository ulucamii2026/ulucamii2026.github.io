/**
 * Şerit listeleri telefonda kapalı başlar (geniş ekranda hep açık). Bağlantı (#serit-3, #m-…) katlanmış bir listeye
 * giderse o liste açılır ve hedefe kaydırılır; panodaki karolar ve «Fâtiha ile başla» bu yolla listeye bağlanır.
 */
const dar = matchMedia('(max-width: 59.99rem)');
const listeler = [...document.querySelectorAll<HTMLDetailsElement>('details.serit-liste')];

const hedef = (): HTMLElement | null => {
  try {
    return location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  } catch {
    return null;
  }
};
const ac = (el: HTMLElement | null) => {
  if (!el) return;
  const d = el.closest<HTMLDetailsElement>('details.serit-liste') ?? el.querySelector<HTMLDetailsElement>('details.serit-liste');
  if (d && !d.open) {
    d.open = true;
    el.scrollIntoView();
  }
};
const uygula = () => {
  listeler.forEach((d) => { d.open = !dar.matches; });
  ac(hedef());
};

uygula();
dar.addEventListener('change', uygula);
addEventListener('hashchange', () => ac(hedef()));
