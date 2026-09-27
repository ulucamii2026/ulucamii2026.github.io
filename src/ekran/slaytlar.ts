/** Orta bölüm: duyuru, günün ayeti ve günün hadisi slaytları; metin kutuya sığana dek küçültülür. */
import type { Slayt } from '../lib/ekran/secim.ts';
import { el } from './gorunum.ts';
import { METIN } from './metinler.ts';

function paragraf(kok: HTMLElement, sinif: string, metin: string | undefined, dil?: 'fr' | 'ar'): void {
  if (!metin) return;
  const p = el('p', sinif, metin);
  if (dil) p.setAttribute('lang', dil);
  if (dil === 'ar') p.setAttribute('dir', 'rtl');
  kok.appendChild(p);
}

function ustBaslik(kok: HTMLElement, m: { tr: string; fr: string }): void {
  const b = el('div', 'ust-baslik', m.tr + ' · ');
  const fr = el('span', 'fr', m.fr);
  fr.setAttribute('lang', 'fr');
  b.appendChild(fr);
  kok.appendChild(b);
}

export function slaytCiz(kok: HTMLElement, s: Slayt): void {
  kok.textContent = '';
  const kart = el('article', 'slayt slayt-' + s.tur);
  ustBaslik(kart, METIN[s.tur]);
  if (s.tur === 'duyuru') {
    const d = s.oge;
    if (d.gorsel) {
      const img = document.createElement('img');
      img.alt = '';
      img.addEventListener('load', () => sigdir(kok));
      img.src = d.gorsel;
      kart.appendChild(img);
    }
    if (d.tr) { paragraf(kart, 'baslik', d.tr.baslik); paragraf(kart, 'tr', d.tr.metin); }
    if (d.fr) { paragraf(kart, 'baslik fr', d.fr.baslik, 'fr'); paragraf(kart, 'fr', d.fr.metin, 'fr'); }
  } else if (s.tur === 'ayet') {
    const a = s.oge;
    paragraf(kart, 'ar', a.ar, 'ar');
    paragraf(kart, 'tr', a.tr);
    paragraf(kart, 'fr', a.fr, 'fr');
    paragraf(kart, 'kaynak', `${a.referans.tr} · ${a.referans.fr} — ${a.kaynakTr}${a.fr && a.kaynakFr ? ' · ' + a.kaynakFr : ''}`);
  } else {
    const h = s.oge;
    paragraf(kart, 'ar', h.ar, 'ar');
    paragraf(kart, 'tr', h.tr);
    paragraf(kart, 'fr', h.fr, 'fr');
    paragraf(kart, 'kaynak', h.kaynak);
  }
  kok.appendChild(kart);
}

/** Veri hiç gelmediyse (ilk açılış, internet yok) gösterilen sakin slayt. */
export function bosCiz(kok: HTMLElement, cami: { tr: string; fr: string }): void {
  kok.textContent = '';
  const kart = el('article', 'slayt bos');
  kart.appendChild(el('b', '', METIN.hosgeldiniz.tr));
  paragraf(kart, 'fr', METIN.hosgeldiniz.fr, 'fr');
  paragraf(kart, 'kaynak', cami.tr);
  kok.appendChild(kart);
}

/** Metin kutudan taşıyorsa --olcek'i %10'luk adımlarla küçültür (en az ~%45).
 *  Work Sans/Amiri `font-display: swap` ile yüklenir: ilk çizimde yedek yazı tipiyle ölçülüp sığdırılmış
 *  olabilir, sonra gerçek yazı tipi gelince metin büyüyüp taşabilir. Görsel yükleme bittiğinde sigdir'i
 *  yeniden çağıran img `load` dinleyicisiyle aynı mantıkla, yazı tipleri hazır olduğunda da bir kez daha
 *  sığdırılır (durum zaten 'loaded' ise ek bir bekleme kurulmaz). */
export function sigdir(kok: HTMLElement): void {
  let olcek = 1;
  kok.style.setProperty('--olcek', '1');
  for (let i = 0; i < 12 && kok.scrollHeight > kok.clientHeight + 1 && olcek > 0.45; i++) {
    olcek *= 0.9;
    kok.style.setProperty('--olcek', olcek.toFixed(3));
  }
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => sigdir(kok));
}
