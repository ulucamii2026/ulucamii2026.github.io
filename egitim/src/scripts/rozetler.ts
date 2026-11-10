/**
 * Rozetlerim ve Yol Belgesi (Dilim 2, 10 Kasım 2026): cihazdaki kart ilerlemesinden (ve «bilgi» yolu için Ezber Kilimi kaydından) hangi yolların
 * tamamlandığını bulur, rozetleri işaretler ve seçilen yol için basılabilir belgeyi doldurur. Yalnız OKUR (cihaz hafızasına yazılmaz, yeni ağ isteği
 * yoktur; oturum varsa mevcut eşitleme çalışır). İsteğe bağlı ad yalnız kâğıttaki metin düğümünde durur. DOM elle kurulur, `innerHTML` yok (CSP).
 * Kâğıt yoğunluğu `yogunluk(n)` (src/lib/ezber/belge.ts): 6'ya kadar ferah, 12'ye kadar orta, fazlası sayfalara bölünen sıkı düzen.
 */
import { yogunluk } from '@ortak/lib/ezber/belge';
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import { kartDurumu, SINAV, yolSayimi } from '@ortak/lib/ilim-yolu/bilgi-ilerleme';
import { bilgiOku, bulutlaEsitle, ezberOkuEtkin } from './bilgi-ortak';
import { doldur, el } from './kip-ortak';

interface Yol { id: string; ad: string; idler: string[]; taslak: boolean }
interface Veri {
  dil: string; yerel: string; yollar: Yol[]; adlar: Record<string, string>;
  m: { rKazanildi: string; rKazanilmadi: string; rBelge: string; rSecili: string; bIfade: string; bDurumOgrenildi: string; bDurumSinav: string; bDurumCalisildi: string; bOzet: string; bOzetBilgi: string; duzenleme: string };
}

const kok = document.querySelector<HTMLElement>('[data-rozetler]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* veri okunamadı: sayfa açıklamayı gösterir */
  }
}

function kur(kok: HTMLElement, veri: Veri) {
  const m = veri.m;
  const sor = <T extends HTMLElement>(s: string): T => {
    const e = kok.querySelector<T>(s);
    if (!e) throw new Error(`öğe yok: ${s}`);
    return e;
  };
  const alan = sor('[data-belge-alan]');
  const kagit = sor('[data-belge-kagit]');
  const govde = sor('[data-belge-satirlar]');
  const ifade = sor('[data-belge-ifade]');
  const ozet = sor('[data-belge-ozet]');
  const taslak = sor('[data-belge-taslak]');
  const adGirdi = sor<HTMLInputElement>('[data-belge-ad]');
  const adYaz = sor('[data-belge-ad-yaz]');
  const tarihYazisi = (t: string) => new Intl.DateTimeFormat(veri.yerel, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${t}T12:00:00Z`));
  let secili = '';

  adGirdi.addEventListener('input', () => { adYaz.textContent = adGirdi.value.trim(); });
  sor('[data-belge-tarih]').textContent = doldur(m.duzenleme, { t: tarihYazisi(yerelGun(new Date())) });
  sor<HTMLButtonElement>('[data-belge-yazdir]').addEventListener('click', () => window.print());

  const yolBul = (id: string) => veri.yollar.find((y) => y.id === id);

  function belgeCiz() {
    const yol = yolBul(secili);
    if (!yol) { alan.hidden = true; return; }
    const il = bilgiOku();
    const bilgi = yol.id === 'bilgi';
    ifade.textContent = doldur(m.bIfade, { yol: yol.ad });
    taslak.hidden = !yol.taslak;
    govde.replaceChildren(...yol.idler.map((id, i) => {
      const tr = el('tr');
      const durum = bilgi ? m.bDurumCalisildi : (kartDurumu(il, id) & SINAV) !== 0 ? m.bDurumSinav : m.bDurumOgrenildi;
      tr.append(el('td', 'no', String(i + 1)), el('td', 'ad', veri.adlar[id] ?? id), el('td', 'durum', durum));
      return tr;
    }));
    ozet.textContent = doldur(bilgi ? m.bOzetBilgi : m.bOzet, { n: yol.idler.length });
    const n = yol.idler.length;
    kagit.dataset.yogunluk = n > 12 ? 'cok' : yogunluk(n);
    alan.hidden = false;
  }

  function ciz() {
    const il = bilgiOku();
    const ezber = ezberOkuEtkin();
    let kazanilan = 0;
    for (const li of kok.querySelectorAll<HTMLElement>('li[data-rozet-yol]')) {
      const yol = yolBul(li.dataset.rozetYol ?? '');
      if (!yol) continue;
      const bilgi = yol.id === 'bilgi';
      const n = bilgi ? yol.idler.filter((id) => (ezber.maddeler[id]?.son ?? 0) > 0).length : yolSayimi(il, yol.idler).ogrenilen;
      const tamam = yol.idler.length > 0 && n === yol.idler.length;
      if (tamam) kazanilan += 1;
      li.dataset.kazanildi = tamam ? '1' : '0';
      const yazi = li.querySelector<HTMLElement>('[data-durum-yazi]');
      if (yazi) yazi.textContent = tamam ? m.rKazanildi : doldur(m.rKazanilmadi, { n, m: yol.idler.length });
      const dugme = li.querySelector<HTMLButtonElement>('[data-belge-sec]');
      if (dugme) {
        dugme.hidden = !tamam;
        dugme.setAttribute('aria-pressed', String(tamam && secili === yol.id));
      }
    }
    sor('[data-hic-yok]').hidden = kazanilan > 0;
    // Seçili yol artık tamam değilse (ör. eşitleme sonrası) belge kapanır.
    const sec = yolBul(secili);
    if (sec) {
      const tamam = kok.querySelector<HTMLElement>(`li[data-rozet-yol="${secili}"]`)?.dataset.kazanildi === '1';
      if (!tamam) { secili = ''; alan.hidden = true; } else belgeCiz();
    }
  }

  kok.addEventListener('click', (e) => {
    const dugme = (e.target as Element).closest<HTMLButtonElement>('[data-belge-sec]');
    if (!dugme) return;
    secili = dugme.dataset.belgeSec ?? '';
    ciz();
    alan.scrollIntoView({ block: 'start' });
  });

  ciz();
  void bulutlaEsitle(ciz);
}
