/** Yalnız ihtida formunun aşamalı görünümü; veri ve gönderim ortak çekirdekte kalır. */
import { ihtidaAdimMetinleri } from '../i18n/ihtida-adimlari';

export function ihtidaAdimlariniBaslat(form: HTMLFormElement, dogrula: (bolumler: HTMLElement[]) => boolean) {
  const ust = form.querySelector<HTMLElement>('[data-ihtida-adimlar]');
  const alt = form.querySelector<HTMLElement>('[data-adim-eylemler]');
  if (!ust || !alt) return;
  const m = JSON.parse(ust.querySelector('script')?.textContent || '{}') as typeof ihtidaAdimMetinleri.tr;
  const gruplar = [['b-cami', 'b-kisi'], ['b-durum'], ['b-iletisim'], ['b-ihtida'], ['b-belgeler'], ['b-riza'], ['b-ozet']]
    .map(ids => ids.map(id => form.querySelector<HTMLElement>(`#${id}`)).filter((e): e is HTMLElement => !!e));
  const seciciler = Array.from(ust.querySelectorAll<HTMLButtonElement>('[data-adim-sec]'));
  const geri = alt.querySelector<HTMLButtonElement>('[data-adim-geri]')!;
  const ileri = alt.querySelector<HTMLButtonElement>('[data-adim-ileri]')!;
  const tumu = ust.querySelector<HTMLButtonElement>('[data-adim-tumu]')!;
  const durum = ust.querySelector<HTMLElement>('[data-adim-durum]')!;
  const ipucu = ust.querySelector<HTMLElement>('[data-adim-ipucu]')!;
  const ilerleme = ust.querySelector<HTMLProgressElement>('progress')!;
  let adim = 0, hepsi = false;
  const hareket = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  const goster = (yeni: number, odak = true) => {
    adim = Math.max(0, Math.min(gruplar.length - 1, yeni));
    gruplar.forEach((grup, i) => grup.forEach(b => { b.hidden = !hepsi && i !== adim; }));
    seciciler.forEach((b, i) => {
      if (i === adim) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    ilerleme.value = adim + 1;
    durum.textContent = m.adim.replace('{simdi}', String(adim + 1)).replace('{toplam}', String(gruplar.length));
    ipucu.textContent = m.ipuclari[adim];
    geri.disabled = adim === 0;
    ileri.hidden = adim === gruplar.length - 1;
    ileri.textContent = adim === gruplar.length - 2 ? m.kontrol : m.ileri;
    alt.hidden = hepsi;
    tumu.textContent = hepsi ? m.adimli : m.tumu;
    tumu.setAttribute('aria-pressed', String(hepsi));
    form.dataset.adimli = String(!hepsi);
    if (odak) {
      const baslik = gruplar[adim][0]?.querySelector<HTMLElement>('h2');
      baslik?.setAttribute('tabindex', '-1');
      baslik?.focus({ preventScroll: true });
      ust.scrollIntoView({ behavior: hareket(), block: 'start' });
    }
  };
  function devam() { if (dogrula(gruplar[adim])) goster(adim + 1); }
  geri.addEventListener('click', () => goster(adim - 1));
  ileri.addEventListener('click', devam);
  seciciler.forEach((b, i) => b.addEventListener('click', () => {
    if (hepsi) gruplar[i][0]?.scrollIntoView({ behavior: hareket(), block: 'start' });
    goster(i, !hepsi);
  }));
  tumu.addEventListener('click', () => { hepsi = !hepsi; goster(adim, false); });
  // Enter, henüz son kontrole gelmeden başvuruyu göndermez.
  form.addEventListener('submit', e => {
    if (!hepsi && adim < gruplar.length - 1) { e.preventDefault(); devam(); }
  }, { capture: true });
  form.addEventListener('form:hata', e => {
    const alan = (e as CustomEvent<{ alan: Element }>).detail.alan;
    const i = gruplar.findIndex(g => g.some(b => b.contains(alan)));
    if (i >= 0) goster(i, false);
  });
  form.querySelector('[data-ozet]')?.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const hedef = a.hash.slice(1);
    const i = gruplar.findIndex(g => g.some(b => b.id === hedef));
    if (i < 0) return;
    e.preventDefault();
    goster(i);
    gruplar[i].find(b => b.id === hedef)?.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)')?.focus({ preventScroll: true });
  });
  form.addEventListener('reset', () => { goster(0, false); });
  ust.hidden = false;
  goster(0, false);
}
