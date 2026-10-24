/**
 * Giriş sayfasındaki «Bugün tekrar» bandı (Faz 2d, 24 Ekim 2026): bu cihazda «Kendini sına» ile işaretlenmiş maddelerden bugün
 * (ya da daha önce) tekrar günü gelenleri listeler ve bu hafta kaç gün çalışıldığını yazıyla söyler. Seri, puan ve renkli
 * ilerleme çubuğu yoktur. Yalnız bu tarayıcıdaki kayıttan (src/lib/ezber/cihaz.ts) okur; kayıt yoksa ya da depolama kapalıysa band
 * gizli kalır ve sayfa etkilenmez. Metin ve madde adları sayfadan `data-veri` ile gelir (CSP: satır içi betik yok).
 */
import { oku, type Depo } from '@ortak/lib/ezber/cihaz';
import { bugunTekrar, haftaGunu, yerelGun } from '@ortak/lib/ezber/tekrar';
import type { TekrarMetinleri } from '../i18n/sina';
import { doldur, el } from './kip-ortak';

/** Listede en çok bu kadar madde gösterilir; toplam sayı özette yazar. */
const AZAMI_SATIR = 12;

const kok = document.querySelector<HTMLElement>('[data-tekrar]');
if (kok) {
  try {
    const veri = JSON.parse(kok.dataset.veri ?? '') as { dil: string; adlar: Record<string, string>; m: TekrarMetinleri };
    let depo: Depo | null = null;
    try { depo = window.localStorage; } catch { depo = null; }
    const d = oku(depo);
    const bugun = yerelGun(new Date());
    const idler = bugunTekrar(d.maddeler, bugun).filter((id) => veri.adlar[id]);
    const planli = Object.values(d.maddeler).some((x) => x.sonraki !== '');
    const hafta = haftaGunu(d.gunler, bugun);
    if (planli || hafta > 0) {
      const m = veri.m;
      const ozet = kok.querySelector<HTMLElement>('[data-tekrar-ozet]');
      const liste = kok.querySelector<HTMLElement>('[data-tekrar-liste]');
      const haftaP = kok.querySelector<HTMLElement>('[data-tekrar-hafta]');
      if (ozet) ozet.textContent = idler.length === 0 ? m.yok : idler.length === 1 ? m.bir : doldur(m.cok, { n: idler.length });
      if (liste) {
        liste.replaceChildren(...idler.slice(0, AZAMI_SATIR).map((id) => {
          const li = el('li');
          const a = el('a', '', veri.adlar[id]);
          a.href = `/${veri.dil}/calis/${id}/`;
          li.append(a);
          return li;
        }));
        liste.hidden = idler.length === 0;
      }
      if (haftaP) {
        haftaP.textContent = hafta === 0 ? '' : hafta === 1 ? m.hafta1 : doldur(m.haftaN, { k: hafta });
        haftaP.hidden = hafta === 0;
      }
      kok.hidden = false;
    }
  } catch {
    /* veri okunamadı: band gizli kalır */
  }
}
