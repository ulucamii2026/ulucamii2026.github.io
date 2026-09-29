/** Sağ alt panel (slayt alanı): duyuru, günün ayeti, hadisi, duası ve Esmâ'sı ortalı bir «levha» olarak çizilir (A alt projesi).
 *  Levha tek ölçekle (--olcek) büyür/küçülür; öğe boyları src/lib/ekran/olcu.ts'teki tabanlar × ölçek. Ölçek okunur
 *  tabanın (1) altına inmez: tabanda da sığmayan slaytı çağıran (main.ts → sonrakiSlayt) atlar. */
import type { Slayt } from '../lib/ekran/secim.ts';
import { OLCU, olcuDegiskenleri, UST_BASLIK, type LevhaTuru } from '../lib/ekran/olcu.ts';
import { olcekBul, type OlcekSonucu } from '../lib/ekran/sigdirma.ts';
import { ayetKaynagi } from '../lib/ekran/kaynak.ts';
import { el } from './gorunum.ts';
import { METIN } from './metinler.ts';
import { SUSLEME_SVG } from './susleme.ts';

function paragraf(kok: HTMLElement, sinif: string, metin: string | undefined, dil?: 'fr' | 'ar'): HTMLElement | null {
  if (!metin) return null;
  const p = el('p', sinif, metin);
  if (dil) p.setAttribute('lang', dil);
  if (dil === 'ar') p.setAttribute('dir', 'rtl');
  kok.appendChild(p);
  return p;
}

/** Arapça satır. Kur'an metni (ayet, Kur'an duası) `data-yuz="kuran"` taşır; Kur'an yazı tipi buna bağlanır. */
function arapca(levha: HTMLElement, metin: string, kuran: boolean): void {
  const p = paragraf(levha, 'ar', metin, 'ar');
  if (p && kuran) p.setAttribute('data-yuz', 'kuran');
}

/** Kaynak satırı: ayraçlardan (« · », « — », «; ») bölünen her parça `span.bolunmez` içindedir; satır yalnız ayraçta
 *  kırılır, «94/5-6» gibi bir başvuru ortasından bölünmez. Ayraçlar düz metin olarak parçaların arasında kalır.
 *  Ölçülen dize (kaynak.ts → ayetKaynagi) ile ekrandaki metin aynıdır; yalnız işaretleme farklıdır. */
function kaynakCiz(kok: HTMLElement, metin: string): void {
  if (!metin) return;
  const p = el('p', 'kaynak');
  const parcalar = metin.split(/( · | — |; )/);
  for (let i = 0; i < parcalar.length; i++) {
    if (!parcalar[i]) continue;
    if (i % 2 === 1) p.appendChild(document.createTextNode(parcalar[i]));
    else p.appendChild(el('span', 'bolunmez', parcalar[i]));
  }
  kok.appendChild(p);
}

function ustBaslik(kok: HTMLElement, m: { tr: string; fr: string }, ek?: string): void {
  const b = el('div', 'ust-baslik', m.tr + ' · ');
  const fr = el('span', 'fr', m.fr);
  fr.setAttribute('lang', 'fr');
  b.appendChild(fr);
  if (ek) b.appendChild(el('span', 'sira', ek));
  kok.appendChild(b);
}

/** Sabit süsleme SVG'si (src/ekran/susleme.ts); CMS metni değildir. */
const susleme = (levha: HTMLElement): void => levha.insertAdjacentHTML('beforeend', SUSLEME_SVG);

export function slaytCiz(kok: HTMLElement, s: Slayt): void {
  kok.textContent = '';
  const kart = el('article', 'slayt slayt-' + s.tur);
  kart.setAttribute('data-tur', s.tur);
  kart.setAttribute('data-yerlesim', 'levha');
  for (const [ad, deger] of olcuDegiskenleri(s.tur)) kart.style.setProperty(ad, deger);
  kart.style.setProperty('--f-ust', String(UST_BASLIK)); // üst başlık sabit boy: ölçekle büyümez
  ustBaslik(kart, METIN[s.tur], s.tur === 'esma' ? s.oge.sira + '/99' : undefined);
  const levha = el('div', 'levha');
  if (s.tur === 'duyuru') {
    const d = s.oge;
    if (d.gorsel) {
      kart.setAttribute('data-yerlesim', 'kucuk-gorsel');
      const img = document.createElement('img');
      img.alt = '';
      img.addEventListener('load', () => { levhaSigdir(kok); });
      // Görsel yüklenemezse (ör. yeniden adlandırılmış medya dosyası) kırık görsel simgesi her turda bütün
      // ekranlarda görünmesin: gizlenir, slayt yazı levhasına döner ve yeniden sığdırılır.
      img.addEventListener('error', () => { img.hidden = true; kart.setAttribute('data-yerlesim', 'levha'); levhaSigdir(kok); });
      img.src = d.gorsel;
      levha.appendChild(img);
    }
    if (d.tr) { paragraf(levha, 'baslik', d.tr.baslik); paragraf(levha, 'tr', d.tr.metin); }
    if (d.tr && d.fr) susleme(levha);
    if (d.fr) { paragraf(levha, 'baslik fr', d.fr.baslik, 'fr'); paragraf(levha, 'fr', d.fr.metin, 'fr'); }
  } else if (s.tur === 'ayet') {
    const a = s.oge;
    arapca(levha, a.ar, true);
    susleme(levha);
    paragraf(levha, 'tr', a.tr);
    paragraf(levha, 'fr', a.fr, 'fr');
    kaynakCiz(levha, ayetKaynagi(a));
  } else if (s.tur === 'hadis') {
    const h = s.oge;
    arapca(levha, h.ar, false);
    susleme(levha);
    paragraf(levha, 'tr', h.tr);
    paragraf(levha, 'fr', h.fr, 'fr');
    kaynakCiz(levha, h.kaynak);
  } else if (s.tur === 'dua') {
    const d = s.oge;
    arapca(levha, d.ar, d.kuran);
    susleme(levha);
    paragraf(levha, 'tr', d.tr);
    paragraf(levha, 'fr', d.fr, 'fr');
    kaynakCiz(levha, d.kaynak);
  } else {
    // Esmâ: isim çok büyük (OLCU.esma.ar), altında okunuş, süsleme, anlam.
    const e = s.oge;
    arapca(levha, e.ar, false);
    paragraf(levha, 'okunus', e.okunus);
    susleme(levha);
    paragraf(levha, 'tr', e.tr);
    paragraf(levha, 'fr', e.fr, 'fr');
    kaynakCiz(levha, e.kaynak);
  }
  kart.appendChild(levha);
  kok.appendChild(kart);
}

/** Veri hiç gelmediyse (ilk açılış, internet yok) ya da turda sığan slayt kalmadıysa gösterilen sakin slayt. */
export function bosCiz(kok: HTMLElement, cami: { tr: string; fr: string }): void {
  kok.textContent = '';
  kok.style.setProperty('--olcek', '1');
  kok.setAttribute('data-olcek', '1.000');
  kok.setAttribute('data-sigdi', 'bos');
  const kart = el('article', 'slayt bos');
  kart.appendChild(el('b', '', METIN.hosgeldiniz.tr));
  paragraf(kart, 'fr', METIN.hosgeldiniz.fr, 'fr');
  paragraf(kart, 'kaynak', cami.tr);
  kok.appendChild(kart);
}

/** Dikey ya da yatay 1 px'ten fazla taşma. Yalnız düzen değerleri: getBoundingClientRect ?don=90'da yanıltır. */
const tasiyor = (kok: HTMLElement): boolean =>
  kok.scrollHeight > kok.clientHeight + 1 || kok.scrollWidth > kok.clientWidth + 1;

/** Yazı tipi yükleme beklemesi en çok bir tane kurulur (levhaSigdir sık çağrılır; beklemeler birikmesin). Beklenen
 *  yükleme bitince bayrak inip sığdırma yeni yüklemelere göre yeniden kurulabilir. */
let yazitipiBekleniyor = false;

/** Levhayı sığan en büyük ölçekle yerleştirir (iki yönlü: kısa metin büyür, uzun metin küçülür, tabanın altına
 *  inmez). Sonuç kökte data-olcek / data-sigdi olarak da yazılır. Work Sans ve Arapça yüzler `font-display: swap`
 *  ile yüklenir: ilk ölçüm yedek yazı tipiyle yapılmış olabilir; yazı tipleri hazır olduğunda bir kez daha
 *  sığdırılır (durum zaten 'loaded' ise ek bekleme kurulmaz; bekleyen varken yenisi kurulmaz). */
export function levhaSigdir(kok: HTMLElement): OlcekSonucu {
  const kart = kok.firstElementChild;
  const tur = kart ? (kart.getAttribute('data-tur') as LevhaTuru | null) : null;
  const yaz = (s: number): void => kok.style.setProperty('--olcek', s.toFixed(3));
  let sonuc: OlcekSonucu;
  if (!tur || !OLCU[tur]) {
    yaz(1);
    sonuc = { olcek: 1, sigdi: !tasiyor(kok), olcumSayisi: 1 };
  } else {
    sonuc = olcekBul((s) => { yaz(s); return !tasiyor(kok); }, 1, OLCU[tur].enCok);
    yaz(sonuc.olcek);
  }
  kok.setAttribute('data-olcek', sonuc.olcek.toFixed(3));
  kok.setAttribute('data-sigdi', !tur ? 'bos' : sonuc.sigdi ? 'evet' : 'hayir');
  if (document.fonts && document.fonts.status !== 'loaded' && !yazitipiBekleniyor) {
    yazitipiBekleniyor = true;
    document.fonts.ready.then(() => { yazitipiBekleniyor = false; levhaSigdir(kok); });
  }
  return sonuc;
}
