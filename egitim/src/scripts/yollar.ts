/**
 * Bilgi yolları dizini ve yol sayfası (Dilim 2, 10 Kasım 2026): cihazdaki kart ilerlemesinden (scripts/bilgi-ortak.ts) her yolun «N / M öğrenildi»
 * satırını, «rozet kazanıldı» işaretini ve yol sayfasındaki kart durumlarını doldurur. «bilgi» yolu kart durumundan değil Ezber Kilimi'ndeki cihaz
 * kaydından (`maddeler[id].son > 0`) okunur. Yalnız OKUR; oturum varsa hesapla eşitlenir, bulutta yeni bir şey çıkarsa yeniden çizilir.
 * DOM'a yalnız `textContent`/öznitelik yazılır (CSP: satır içi betik/stil yok, `innerHTML` yok).
 */
import { kartDurumu, SINAV, yolSayimi } from '@ortak/lib/ilim-yolu/bilgi-ilerleme';
import { bilgiOku, bulutlaEsitle, ezberOkuEtkin } from './bilgi-ortak';
import { doldur } from './kip-ortak';

interface Veri { dil: string; yol?: string; m: { sayim: string; sayimBilgi: string; durumOgrenildi: string; durumSinav: string; durumBekliyor: string; bilgiCalisildi: string; bilgiBekliyor: string } }

const kok = document.querySelector<HTMLElement>('[data-yollar], [data-yol-sayfa]');
if (kok) {
  try {
    kur(kok, JSON.parse(kok.dataset.veri ?? '') as Veri);
  } catch {
    /* veri okunamadı: sayfa yine kart listesini gösterir */
  }
}

function kur(kok: HTMLElement, veri: Veri) {
  const m = veri.m;
  const liste = (s: string | undefined) => (s ? s.split(',').filter(Boolean) : []);

  function ciz() {
    const il = bilgiOku();
    const ezber = ezberOkuEtkin();
    const calisildi = (id: string) => (ezber.maddeler[id]?.son ?? 0) > 0;

    // Yol sayfasında liste kökün kendisindedir (querySelectorAll kökü saymaz).
    for (const oge of [kok, ...kok.querySelectorAll<HTMLElement>('[data-idler], [data-bilgi-idler]')]) {
      if (oge.dataset.idler === undefined && oge.dataset.bilgiIdler === undefined) continue;
      const bilgi = oge.dataset.bilgiIdler !== undefined;
      const idler = liste(bilgi ? oge.dataset.bilgiIdler : oge.dataset.idler);
      const s = bilgi
        ? (() => { const n = idler.filter(calisildi).length; return { ogrenilen: n, toplam: idler.length, tamam: idler.length > 0 && n === idler.length }; })()
        : yolSayimi(il, idler);
      const ilerleme = oge.querySelector<HTMLElement>('[data-ilerleme]');
      if (ilerleme) ilerleme.textContent = doldur(bilgi ? m.sayimBilgi : m.sayim, { n: s.ogrenilen, m: s.toplam });
      const rozet = oge.querySelector<HTMLElement>('[data-rozet]');
      if (rozet) rozet.hidden = !s.tamam;
      const not = oge.querySelector<HTMLElement>('[data-rozet-not]');
      if (not) not.hidden = s.tamam;
      oge.dataset.tamam = s.tamam ? '1' : '0';
    }

    for (const li of kok.querySelectorAll<HTMLElement>('li[data-kart-id]')) {
      const d = kartDurumu(il, li.dataset.kartId ?? '');
      li.dataset.durum = String(d);
      const yazi = li.querySelector<HTMLElement>('[data-durum-yazi]');
      if (yazi) yazi.textContent = d === 0 ? m.durumBekliyor : (d & SINAV) !== 0 ? m.durumSinav : m.durumOgrenildi;
    }
    for (const li of kok.querySelectorAll<HTMLElement>('li[data-bilgi-id]')) {
      const c = calisildi(li.dataset.bilgiId ?? '');
      li.dataset.durum = c ? '1' : '0';
      const yazi = li.querySelector<HTMLElement>('[data-durum-yazi]');
      if (yazi) yazi.textContent = c ? m.bilgiCalisildi : m.bilgiBekliyor;
    }
  }

  ciz();
  void bulutlaEsitle(ciz);
}
