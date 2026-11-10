/**
 * Kur'an Okuma harita ve adım sayfaları (10 Kasım 2026): sunucuda sıfır ilerlemeyle çizilen sayıları cihazdaki (girişliyse hesaptaki) ilerlemeyle doldurur.
 *  - `[data-okuma-aralik]` (adım kartı, ders satırı): `data-adim`, `data-bas`, `data-n`, `data-sablon` («{a} / {b} madde çalışıldı»);
 *  - `[data-okuma-bugun]`: `data-plan` (JSON) ve `data-sablon` («{t} tekrar · {y} yeni madde»).
 * JavaScript kapalıysa sayılar görünmez; bağlantılar yine çalışır. Metin yalnız `textContent` ile yazılır.
 */
import { yerelGun } from '@ortak/lib/ezber/tekrar';
import { maddeKimligi, goruldu } from '@ortak/lib/okuma/ilerleme';
import { oturumKur, type PlanAdim } from '@ortak/lib/okuma/oturum';
import { doldur } from './kip-ortak';
import { bulutlaEsitle, okumaOku } from './okuma-ortak';

function ciz() {
  const il = okumaOku();
  for (const el of document.querySelectorAll<HTMLElement>('[data-okuma-aralik]')) {
    const adim = el.dataset.adim ?? '';
    const bas = Number(el.dataset.bas ?? 0);
    const n = Number(el.dataset.n ?? 0);
    let a = 0;
    for (let i = 0; i < n; i++) if (goruldu(il, maddeKimligi(adim, bas + i))) a++;
    const hedef = el.querySelector<HTMLElement>('[data-okuma-sayi]') ?? el;
    hedef.textContent = doldur(el.dataset.sablon ?? '', { a, b: n });
    el.dataset.durum = a === 0 ? '0' : a >= n ? '2' : '1';
    const cubuk = el.querySelector<HTMLProgressElement>('progress');
    if (cubuk) { cubuk.max = n; cubuk.value = a; }
  }
  const bugun = document.querySelector<HTMLElement>('[data-okuma-bugun]');
  if (bugun) {
    try {
      const plan = JSON.parse(bugun.dataset.plan ?? '[]') as PlanAdim[];
      const o = oturumKur(il, yerelGun(new Date()), plan);
      bugun.textContent = doldur(bugun.dataset.sablon ?? '', { t: o.tekrar.length, y: o.yeni.length });
    } catch { /* plan okunamadı: özet boş kalır */ }
  }
}

ciz();
void bulutlaEsitle(ciz);
