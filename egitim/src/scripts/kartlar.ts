/**
 * Ezber kartları · 8'li baskı (25 Ekim 2026): seçilen ezberlerin kartlarını havuzdan çoğaltıp A4 sayfalara dizer. Yalnız OKUR: cihaz
 * hafızasından (src/lib/ezber/cihaz.ts) çalışma kaydı okunur, hiçbir şey yazılmaz, ağa hiçbir istek atılmaz; `?sec=` yalnız açılış
 * seçimidir. Sayfa düzeni (8'li bölme, arka yüzün satır aynası, basım sırası) saf kütüphanededir: src/lib/ezber/kartlar.ts.
 * DOM elle kurulur, `innerHTML` yok (CSP).
 */
import { oku, type Depo } from '@ortak/lib/ezber/cihaz';
import { baslangicSecimi, basimOzeti, basimSirasi, sayfala, secParametresi, type YuzSecimi } from '@ortak/lib/ezber/kartlar';
import { belgeSatirlari } from '@ortak/lib/ezber/belge';
import { doldur, el } from './kip-ortak';

interface Veri {
  dil: string;
  sira: string[];
  m: { yonergeKayitli: string; yonergeKayitsiz: string; sayac: string; ozet: string; sayfaOn: string; sayfaArka: string };
}

const kok = document.querySelector<HTMLElement>('[data-kartlar]');
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

  let depo: Depo | null = null;
  try { depo = window.localStorage; } catch { depo = null; }
  const d = oku(depo);
  const kayitli = belgeSatirlari(d, veri.sira).length > 0;
  const secili = new Set(baslangicSecimi(d, veri.sira, secParametresi(window.location.search, veri.sira)));
  let yuz: YuzSecimi = 'cift';

  const havuz = sor('[data-kk-havuz]');
  const kart = new Map<string, { on: HTMLElement; arka: HTMLElement }>();
  for (const id of veri.sira) {
    const on = havuz.querySelector<HTMLElement>(`.kk-kart[data-id="${id}"][data-yuz="on"]`);
    const arka = havuz.querySelector<HTMLElement>(`.kk-kart[data-id="${id}"][data-yuz="arka"]`);
    if (on && arka) kart.set(id, { on, arka });
  }

  // ——— Seçim listesi ———
  const kutular = [...kok.querySelectorAll<HTMLInputElement>('input[data-kk-kutu]')];
  const grupKutulari = [...kok.querySelectorAll<HTMLElement>('[data-kk-grup]')].map((g) => ({
    kutu: g.querySelector<HTMLInputElement>('input[data-kk-grup-kutu]')!,
    uyeler: [...g.querySelectorAll<HTMLInputElement>('input[data-kk-kutu]')],
  }));
  sor('[data-kk-yonerge]').textContent = kayitli ? m.yonergeKayitli : m.yonergeKayitsiz;
  for (const kutu of kutular) {
    kutu.checked = secili.has(kutu.value);
    kutu.addEventListener('change', () => { if (kutu.checked) secili.add(kutu.value); else secili.delete(kutu.value); ciz(); });
  }
  for (const g of grupKutulari) {
    g.kutu.addEventListener('change', () => {
      for (const u of g.uyeler) { u.checked = g.kutu.checked; if (g.kutu.checked) secili.add(u.value); else secili.delete(u.value); }
      ciz();
    });
  }
  const hepsiniAyarla = (deger: boolean) => {
    for (const kutu of kutular) { kutu.checked = deger; if (deger) secili.add(kutu.value); else secili.delete(kutu.value); }
    ciz();
  };
  sor<HTMLButtonElement>('[data-kk-tumu]').addEventListener('click', () => hepsiniAyarla(true));
  sor<HTMLButtonElement>('[data-kk-hicbiri]').addEventListener('click', () => hepsiniAyarla(false));
  for (const r of kok.querySelectorAll<HTMLInputElement>('input[data-kk-yuz]')) {
    r.checked = r.value === yuz;
    r.addEventListener('change', () => { if (r.checked) { yuz = r.value as YuzSecimi; ciz(); } });
  }

  // ——— Sayfalar ———
  const sayfalar = sor('[data-kk-sayfalar]');
  const sayac = sor('[data-kk-sayac]');
  const ozet = sor('[data-kk-ozet]');
  const yazdir = sor<HTMLButtonElement>('[data-kk-yazdir]');
  const seciliYok = sor('[data-kk-seciliyok]');

  function ciz() {
    const idler = veri.sira.filter((id) => secili.has(id) && kart.has(id));
    // Şerit kutusunun işareti: hepsi seçiliyse işaretli, bir kısmıysa belirsiz.
    for (const g of grupKutulari) {
      const n = g.uyeler.filter((u) => u.checked).length;
      g.kutu.checked = n === g.uyeler.length;
      g.kutu.indeterminate = n > 0 && n < g.uyeler.length;
    }
    sayac.textContent = doldur(m.sayac, { n: idler.length, m: veri.sira.length });
    yazdir.disabled = idler.length === 0;
    seciliYok.hidden = idler.length !== 0;

    const sirali = basimSirasi(sayfala(idler), yuz);
    sayfalar.replaceChildren(...sirali.map((s) => {
      const kutu = el('div', 'kk-sayfa-kutu');
      kutu.dataset.yuz = s.yuz;
      kutu.append(el('p', 'kk-sayfa-etiket', doldur(s.yuz === 'on' ? m.sayfaOn : m.sayfaArka, { n: s.sayfa })));
      const sayfa = el('div', 'kk-sayfa');
      for (const id of s.kartlar) {
        const hucre = el('div', id ? 'kk-hucre' : 'kk-hucre kk-bos');
        const kaynak = id ? kart.get(id) : undefined;
        if (kaynak) hucre.append((s.yuz === 'on' ? kaynak.on : kaynak.arka).cloneNode(true));
        sayfa.append(hucre);
      }
      kutu.append(sayfa);
      return kutu;
    }));
    const o = basimOzeti(idler.length, yuz);
    ozet.textContent = idler.length === 0 ? '' : doldur(m.ozet, { n: o.kart, s: o.sayfa, k: o.kagit });
  }
  yazdir.addEventListener('click', () => window.print());

  kok.hidden = false;
  ciz();
  // Arapça yazı tipi yalnız kullanıldığında inebilir; yazdırma penceresi açılmadan önce hazır olsun.
  void document.fonts?.load('1em "Ulu Nesih"', 'سُورَةُ').catch(() => undefined);
}
