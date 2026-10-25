/**
 * Giriş sayfasındaki «Derste bu hafta» bandı (25 Ekim 2026): bugünün Brüksel gününe göre bugünü kapsayan (yoksa sıradaki) ders hafta sonunu seçer ve
 * gün gün, gruplarıyla çizer. Hesap, sunucu ve ağ yok; cihaza hiçbir şey yazılmaz. Seçim ve biçimler saf kütüphanededir
 * (src/lib/ezber/ders-takvimi.ts; testleri tests/ezber-ders-takvimi.test.mjs) — burada yalnız DOM kurulur. Veri sayfadan `data-veri` ile gelir
 * (CSP: satır içi betik yok); DOM elle kurulur, `innerHTML` yok. Dersler bitmişse kısa bir not gösterilir. Veri okunamazsa band gizli kalır ve
 * sayfada sabit takvim bağlantısı (alt bilgi, «Kendi çalışmanız için») durur.
 */
import {
  GRUP_SIRASI, aralikYaz, brukselGunu, coz, gunYaz, haftaBul, haftaSonlari, maddeEki,
  type DersGunu, type DersKipi, type GrupKodu, type MaddeEkiMetinleri, type TakvimMaddesi,
} from '@ortak/lib/ezber/ders-takvimi';
import { el } from './kip-ortak';

interface Veri {
  dil: string;
  yerel: string;
  g: [string, DersKipi, Partial<Record<GrupKodu, string[]>>][];
  ad: Record<string, string>;
  duz: string[];
  m: MaddeEkiMetinleri & {
    bandBu: string; bandSiradaki: string; bandBitti: string; bugun: string;
    gunKipi: Record<DersKipi, string>; grup: Record<GrupKodu, string>; gunBos: string;
  };
}

const kok = document.querySelector<HTMLElement>('[data-ders-bandi]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* veri okunamadı: band gizli kalır */
  }
}

function maddeSatiri(x: TakvimMaddesi, v: Veri, duz: ReadonlySet<string>): HTMLElement {
  const li = el('li', 'tk-madde');
  const ic = (kap: HTMLElement) => {
    kap.append(el('span', 'tk-ad', v.ad[x.id] ?? x.id));
    const ek = maddeEki(x, v.m);
    if (ek) kap.append(' ', el('span', 'tk-ek', ek));
    return kap;
  };
  if (duz.has(x.id)) {
    li.append(ic(el('span', 'tk-duz')));
  } else {
    const a = ic(el('a')) as HTMLAnchorElement;
    a.href = `/${v.dil}/calis/${x.id}/`;
    li.append(a);
  }
  return li;
}

function gunKarti(g: DersGunu, v: Veri, bugun: string, duz: ReadonlySet<string>): HTMLElement {
  const kart = el('div', 'tk-gun');
  kart.dataset.tarih = g.tarih;
  const bas = el('header', 'tk-gun-bas');
  const h = el('h3', 'tk-gun-ad', gunYaz(g.tarih, v.yerel));
  if (g.tarih === bugun) {
    h.append(' ', el('span', 'tk-bugun', v.m.bugun));
    kart.setAttribute('aria-current', 'date');
  }
  bas.append(h);
  kart.append(bas, el('p', 'tk-kip', v.m.gunKipi[g.kip]));
  const kodlar = GRUP_SIRASI.filter((k) => g.gruplar[k]?.length);
  if (!kodlar.length) {
    kart.append(el('p', 'tk-bos', v.m.gunBos));
    return kart;
  }
  const dl = el('dl', 'tk-gruplar');
  for (const k of kodlar) {
    const grup = el('div', 'tk-grup');
    grup.dataset.grup = k;
    const dd = el('dd');
    const ul = el('ul', 'tk-maddeler');
    ul.append(...g.gruplar[k]!.map((x) => maddeSatiri(x, v, duz)));
    dd.append(ul);
    grup.append(el('dt', '', v.m.grup[k]), dd);
    dl.append(grup);
  }
  kart.append(dl);
  return kart;
}

/** Şablondaki `{yer}` yerine tarih/aralık yazar; tarih ayrı bir span'dir ve satır sonunda bölünmez («24–
26 octobre» olmasın). */
function sablon(metin: string, yer: string, deger: string): (string | HTMLElement)[] {
  const [once, sonra = ''] = metin.split(`{${yer}}`);
  return [once, el('span', 'tk-bolunmez', deger), sonra];
}

function kur(kok: HTMLElement, v: Veri) {
  const gunler: DersGunu[] = v.g.map(([tarih, kip, gruplar]) => ({
    tarih, gun: '', kip,
    gruplar: Object.fromEntries(Object.entries(gruplar).map(([k, l]) => [k, (l ?? []).map(coz)])) as DersGunu['gruplar'],
  }));
  const bugun = brukselGunu();
  const alt = kok.querySelector<HTMLElement>('[data-ders-alt]');
  const liste = kok.querySelector<HTMLElement>('[data-ders-gunler]');
  if (!alt || !liste) return;
  const secim = haftaBul(haftaSonlari(gunler), bugun);
  if (!secim) {
    alt.textContent = v.m.bandBitti;
    liste.hidden = true;
  } else {
    const { hafta, simdi } = secim;
    alt.replaceChildren(...(simdi ? sablon(v.m.bandBu, 'aralik', aralikYaz(hafta.ilk, hafta.son, v.yerel)) : sablon(v.m.bandSiradaki, 'tarih', gunYaz(hafta.ilk, v.yerel))));
    const duz = new Set(v.duz);
    liste.replaceChildren(...hafta.gunler.map((g) => gunKarti(g, v, bugun, duz)));
  }
  kok.hidden = false;
}
