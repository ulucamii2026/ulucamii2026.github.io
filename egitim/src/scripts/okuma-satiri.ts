/**
 * Kur'an Okuma kısa satırı (10 Kasım 2026): `[data-okuma-satir]` öğesini cihazdaki okuma ilerlemesinden doldurur (çalışılan madde sayısı ve bugün
 * tekrarı gelen madde sayısı). Hiç madde çalışılmadıysa satır gizli kalır. Yalnız OKUR; `data-esitle` varsa (ana sayfa) oturum açıkken
 * hesapla da eşitler, Kilimim sayfası ağa hiç dokunmaz. Metin `textContent` ile yazılır.
 */
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import { goruldu, maddeKimligi, vadeGeldi } from '@ortak/lib/okuma/ilerleme';
import type { PlanAdim } from '@ortak/lib/okuma/oturum';
import { doldur } from './kip-ortak';
import { bulutlaEsitle, okumaOku } from './okuma-ortak';

const kok = document.querySelector<HTMLElement>('[data-okuma-satir]');
if (kok) {
  try {
    const veri = JSON.parse(kok.dataset.veri ?? '') as { plan: PlanAdim[]; ilerleme: string; tekrar: string; yok: string };
    const ciz = () => {
      const il = okumaOku();
      const bugun = yerelGun(new Date());
      let a = 0;
      let b = 0;
      let t = 0;
      for (const adim of veri.plan) {
        for (let i = 0; i < adim.n; i++) {
          const id = maddeKimligi(adim.id, i);
          b++;
          if (goruldu(il, id)) { a++; if (vadeGeldi(il, id, bugun)) t++; }
        }
      }
      kok.hidden = a === 0;
      const ilerleme = kok.querySelector<HTMLElement>('[data-satir-ilerleme]');
      const tekrar = kok.querySelector<HTMLElement>('[data-satir-tekrar]');
      if (ilerleme) ilerleme.textContent = doldur(veri.ilerleme, { a, b });
      if (tekrar) { tekrar.textContent = t > 0 ? doldur(veri.tekrar, { t }) : veri.yok; tekrar.dataset.var = t > 0 ? '1' : '0'; }
    };
    ciz();
    if (kok.hasAttribute('data-esitle')) void bulutlaEsitle(ciz);
  } catch {
    /* veri okunamadı: satır gizli kalır, sayfa etkilenmez */
  }
}
