/**
 * Çalışma Belgesi (25 Ekim 2026): bu cihazdaki çalışma kaydından (src/lib/ezber/cihaz.ts) belgeye girecek ezberleri çıkarır,
 * seçtirir ve A4 kâğıdı doldurur. Yalnız OKUR: cihaz hafızasına hiçbir şey yazılmaz, ağa hiçbir istek atılmaz. İsteğe bağlı ad yalnız
 * bu betiğin belleğinde ve kâğıttaki metin düğümünde durur (depoya, adrese, çerezlere yazılmaz). Kayıt yoksa ya da depolama kapalıysa
 * boş durum gösterilir. Metin ve ezber adları sayfadan `data-veri` ile gelir (CSP: satır içi betik yok); DOM elle kurulur, `innerHTML` yok.
 */
import { oku, type Depo } from '@ortak/lib/ezber/cihaz';
import { basamakYazisi, belgeSatirlari, ucHaftaGunu, yogunluk, type BelgeSatiri } from '@ortak/lib/ezber/belge';
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import type { BelgeMetinleri } from '../i18n/belge';
import { doldur, el } from './kip-ortak';

interface Veri { dil: string; yerel: string; sira: string[]; adlar: Record<string, string>; m: BelgeMetinleri }

const kok = document.querySelector<HTMLElement>('[data-belge]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* veri okunamadı: bölüm gizli kalır, sayfa yine açıklamayı gösterir */
  }
}

function kur(kok: HTMLElement, veri: Veri) {
  const m = veri.m;
  const sor = <T extends HTMLElement>(s: string): T => {
    const e = kok.querySelector<T>(s);
    if (!e) throw new Error(`öğe yok: ${s}`);
    return e;
  };
  const bos = sor('[data-belge-bos]');
  const dolu = sor('[data-belge-dolu]');

  let depo: Depo | null = null;
  try { depo = window.localStorage; } catch { depo = null; }
  const d = oku(depo);
  const bugun = yerelGun(new Date());
  const satirlar = belgeSatirlari(d, veri.sira).filter((s) => veri.adlar[s.id]);

  if (satirlar.length === 0) {
    bos.hidden = false;
    kok.hidden = false;
    return;
  }

  const tarihYaz = (t: string) => new Intl.DateTimeFormat(veri.yerel, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${t}T12:00:00Z`));
  const secili = new Set(satirlar.map((s) => s.id));

  // ——— Seçim listesi ———
  const liste = sor<HTMLUListElement>('[data-belge-liste]');
  const kutular = new Map<string, HTMLInputElement>();
  liste.replaceChildren(...satirlar.map((s) => {
    const li = el('li');
    const etiket = el('label');
    const kutu = el('input');
    kutu.type = 'checkbox';
    kutu.checked = true;
    kutu.addEventListener('change', () => { if (kutu.checked) secili.add(s.id); else secili.delete(s.id); ciz(); });
    kutular.set(s.id, kutu);
    etiket.append(kutu, el('span', 'ad', veri.adlar[s.id]), el('span', 'son', doldur(m.sonCalisma, { t: tarihYaz(s.son) })));
    li.append(etiket);
    return li;
  }));
  const hepsiniAyarla = (deger: boolean) => {
    for (const [id, kutu] of kutular) {
      kutu.checked = deger;
      if (deger) secili.add(id); else secili.delete(id);
    }
    ciz();
  };
  sor<HTMLButtonElement>('[data-belge-hepsi]').addEventListener('click', () => hepsiniAyarla(true));
  sor<HTMLButtonElement>('[data-belge-hicbiri]').addEventListener('click', () => hepsiniAyarla(false));

  // ——— Ad (yalnız bellek) ———
  const adGirdi = sor<HTMLInputElement>('[data-belge-ad]');
  const adYaz = sor('[data-belge-ad-yaz]');
  adGirdi.addEventListener('input', () => { adYaz.textContent = adGirdi.value.trim(); });

  // ——— Kâğıt ———
  const kagit = sor('[data-belge-kagit]');
  const govde = sor('[data-belge-satirlar]');
  const ozet = sor('[data-belge-ozet]');
  const sayac = sor('[data-belge-sayac]');
  const yazdir = sor<HTMLButtonElement>('[data-belge-yazdir]');
  const seciliYok = sor('[data-belge-seciliyok]');
  sor('[data-belge-tarih]').textContent = doldur(m.duzenleme, { t: tarihYaz(bugun) });
  const gun = ucHaftaGunu(d.gunler, bugun);

  const satir = (s: BelgeSatiri, no: number) => {
    const tr = el('tr');
    tr.append(el('td', 'no', String(no)), el('td', 'ad', veri.adlar[s.id]), el('td', 'son', tarihYaz(s.son)), el('td', 'basamak', basamakYazisi(s.kutu)));
    return tr;
  };

  // Yoğunluk: satır sayısından başlanır, içerik (uzun ezber adları satır sardırır) A4'e sığmıyorsa bir sonraki sıkılığa geçilir; en sıkı
  // düzen (`cok`) sayfalara temiz bölünür. Ölçü em cinsindendir (1 em = 4 mm), kâğıt her genişlikte aynı sayfadır; bütçe tek sayfada
  // üst bölüm + tablo + özet için 57,5 em (230 mm), kalanı alt satıra ve kenar boşluklarına ayrılır.
  const logo = sor('.belge-logo');
  const ozetBas = ozet;
  const SIKILIK = ['az', 'orta', 'siki', 'cok'] as const;
  function sigdir(baslangic: (typeof SIKILIK)[number]) {
    const sirasi = SIKILIK.slice(SIKILIK.indexOf(baslangic));
    const em = parseFloat(getComputedStyle(kagit).fontSize) || 1;
    for (const y of sirasi) {
      kagit.dataset.yogunluk = y;
      if (y === 'cok') return;
      const yuk = (ozetBas.getBoundingClientRect().bottom - logo.getBoundingClientRect().top) / em;
      if (yuk <= 57.5) return;
    }
  }

  function ciz() {
    const secilen = satirlar.filter((s) => secili.has(s.id));
    if (secilen.length === 0) {
      const tr = el('tr');
      const td = el('td', 'bos', m.tabloBos);
      td.colSpan = 4;
      tr.append(td);
      govde.replaceChildren(tr);
    } else {
      govde.replaceChildren(...secilen.map((s, i) => satir(s, i + 1)));
    }
    ozet.textContent = secilen.length === 0 ? '' : (secilen.length === 1 ? m.ezber1 : doldur(m.ezberN, { n: secilen.length }))
      + (gun === 0 ? '' : gun === 1 ? m.gun1 : doldur(m.gunN, { k: gun }));
    sayac.textContent = doldur(m.sayac, { n: secilen.length, m: satirlar.length });
    sigdir(yogunluk(secilen.length));
    yazdir.disabled = secilen.length === 0;
    seciliYok.hidden = secilen.length !== 0;
  }
  yazdir.addEventListener('click', () => window.print());

  // Ölçüm için bölüm görünür olmalı (gizliyken kutular 0 ölçülür); yazı tipi inince satır sarımı değişebilir, yoğunluk yeniden seçilir.
  dolu.hidden = false;
  kok.hidden = false;
  ciz();
  void document.fonts?.ready.then(() => ciz());
}
