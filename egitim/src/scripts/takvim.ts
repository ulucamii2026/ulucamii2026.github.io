/**
 * Takvim sayfası (25 Ekim 2026): sayfa sunucuda tamamen çizilidir; bu betik yalnız bugünün Brüksel gününe göre bugünü kapsayan (yoksa sıradaki)
 * hafta sonunu vurgular, bugünün kartına «Bugün» ekler (`aria-current="date"`) ve oraya kaydırır. Bağlantıyla belirli bir güne gelindiyse
 * (`#g-…`, `#h-…`) ya da geri düğmesiyle dönüldüyse kaydırmaz; tarayıcı kendi konumunu korusun. Hiçbir şey yazılmaz, ağa çıkılmaz.
 * Hafta seçimi saf kütüphaneden (src/lib/ezber/ders-takvimi.ts), böylece giriş sayfasındaki bandla aynı sonucu verir.
 */
import { brukselGunu, haftaBul } from '@ortak/lib/ezber/ders-takvimi';

const sayfa = document.querySelector<HTMLElement>('[data-tk-sayfa]');
if (sayfa) {
  const haftalar = [...sayfa.querySelectorAll<HTMLElement>('[data-tk-hafta]')].map((e) => ({ e, ilk: e.dataset.ilk ?? '', son: e.dataset.son ?? '' }));
  const bugun = brukselGunu();
  const secim = haftaBul(haftalar, bugun);
  if (secim) {
    const hafta = secim.hafta.e;
    hafta.classList.add('tk-simdi');
    if (secim.simdi) hafta.dataset.simdi = 'bu-hafta';
    const gun = hafta.querySelector<HTMLElement>(`[data-tk-gun][data-tarih="${bugun}"]`);
    if (gun) {
      gun.setAttribute('aria-current', 'date');
      const baslik = gun.querySelector('.tk-gun-ad');
      if (baslik) {
        const etiket = document.createElement('span');
        etiket.className = 'tk-bugun';
        etiket.textContent = sayfa.dataset.bugun ?? '';
        baslik.append(' ', etiket);
      }
    }
    const geriDonus = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'back_forward';
    if (!window.location.hash && !geriDonus) hafta.scrollIntoView({ block: 'start' });
  }
}
