/**
 * Yerleştirme testi (Dilim 2, 10 Kasım 2026): tamamen tarayıcıda. Hiçbir ağ isteği, hiçbir depolama, hiçbir adres değişikliği yoktur; cevaplar
 * yalnız bu betiğin belleğinde durur ve sayfa kapanınca gider. Sıradaki soruyu ve sonucu `src/lib/ilim-yolu/yerlestirme.ts` verir (seviye testinin
 * puanlaması). Her soruda «Bilmiyorum» seçeneği vardır (−1). DOM elle kurulur; `innerHTML` yok (CSP). Odak: yeni soruda soru başlığına, sonuçta
 * sonuç başlığına taşınır.
 */
import { oner, siradaki } from '@ortak/lib/ilim-yolu/yerlestirme';
import type { AlanKodu, Cevaplar, Madde } from '@ortak/lib/seviye-testi/tipler';
import { doldur, el } from './kip-ortak';

interface Soru { id: string; alan: AlanKodu; basamak: number; soru: string; goster?: string; siklar: ({ t: string } | { ar: string })[]; dogru: number }
interface Veri { dil: string; sorular: Soru[]; alanlar: Record<AlanKodu, string>; m: { yNo: string; yBilmiyorum: string; yOneri: string; yAlanSatiri: string; yYolaGit: string; basamak: string } }

const kok = document.querySelector<HTMLElement>('[data-yerlestirme]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* veri okunamadı: sayfa açıklamasını gösterir, test başlamaz */
  }
}

function kur(kok: HTMLElement, veri: Veri) {
  const sor = <T extends HTMLElement>(s: string): T => {
    const e = kok.querySelector<T>(s);
    if (!e) throw new Error(`öğe yok: ${s}`);
    return e;
  };
  const giris = sor('[data-giris]');
  const test = sor<HTMLFormElement>('[data-test]');
  const sonuc = sor('[data-sonuc]');
  const legend = sor('[data-legend]');
  const goster = sor('[data-goster]');
  const siklar = sor('[data-siklar]');
  // Kütüphane işlevleri `Madde` bekler; burada yalnız kullandıkları alanlar vardır (alan, basamak, id, dogru, şık sayısı).
  const sorular = veri.sorular as unknown as Madde[];
  let cevaplar: Cevaplar = {};
  let sayi = 0;
  let simdiki: Soru | null = null;

  function sonrakiniGoster() {
    const m = siradaki(sorular, cevaplar) as unknown as Soru | null;
    if (!m) { bitir(); return; }
    simdiki = m;
    sayi += 1;
    sor('[data-soru-alani]').dataset.id = m.id;
    legend.replaceChildren(el('span', 'no', doldur(veri.m.yNo, { n: sayi })), document.createTextNode(m.soru));
    goster.hidden = !m.goster;
    goster.textContent = m.goster ?? '';
    siklar.replaceChildren(...m.siklar.map((s, j) => sik(j, 't' in s ? s.t : s.ar, 'ar' in s)), sik(-1, veri.m.yBilmiyorum, false));
    giris.hidden = true;
    sonuc.hidden = true;
    test.hidden = false;
    legend.focus();
  }

  function sik(deger: number, yazi: string, ar: boolean): HTMLElement {
    const etiket = el('label', 'yl-sik');
    const girdi = el('input');
    girdi.type = 'radio';
    girdi.name = 'yerlestirme';
    girdi.value = String(deger);
    const metin = el('span', ar ? 'yazi yl-ar' : 'yazi', yazi);
    if (ar) { metin.lang = 'ar'; metin.dir = 'rtl'; }
    etiket.append(girdi, metin);
    return etiket;
  }

  function bitir() {
    const s = oner(sorular, cevaplar);
    test.hidden = true;
    sonuc.hidden = false;
    const ad = veri.alanlar[s.onerilen.alan];
    sor('[data-oneri]').textContent = doldur(veri.m.yOneri, { alan: ad, b: s.onerilen.basamak });
    sor<HTMLAnchorElement>('[data-oneri-baglanti]').href = `/${veri.dil}/yollar/alan-${s.onerilen.alan}/#basamak-${s.onerilen.basamak}`;
    sor('[data-alan-liste]').replaceChildren(...s.alanlar.map((a) => {
      const li = el('li', '', doldur(veri.m.yAlanSatiri, { alan: veri.alanlar[a.alan], b: a.basamak }));
      if (a.alan === s.onerilen.alan) li.dataset.onerilen = '1';
      return li;
    }));
    sor('#yl-sonuc-baslik').focus();
  }

  sor<HTMLButtonElement>('[data-basla]').addEventListener('click', sonrakiniGoster);
  sor<HTMLButtonElement>('[data-yeniden]').addEventListener('click', () => {
    cevaplar = {};
    sayi = 0;
    simdiki = null;
    sonrakiniGoster();
  });
  test.addEventListener('submit', (e) => {
    e.preventDefault();
    const secili = test.querySelector<HTMLInputElement>('input[name="yerlestirme"]:checked');
    if (!secili || !simdiki) { test.querySelector<HTMLInputElement>('input[name="yerlestirme"]')?.focus(); return; }
    cevaplar = { ...cevaplar, [simdiki.id]: Number(secili.value) };
    sonrakiniGoster();
  });
}
