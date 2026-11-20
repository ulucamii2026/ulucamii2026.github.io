import type { DriveStep, Driver } from 'driver.js';
import type { VeliMetin } from '../i18n/veli';
import { portalTercihleri } from '../lib/portal-tercihleri';

/**
 * Veli panosu tanıtım turu (Driver.js 1.x, MIT). İlk girişte bir kez gösterilir; tur bitince ya da kapatılınca bayrak yazılır.
 * Pano ekranından yeniden başlatılır (veli-portali.ts: `data-tur-baslat`). Metinler: src/i18n/veli.ts `tur`; görünüm: veli.css «Tanıtım turu».
 * Sayfa CSS'i (driver.css) yalnız egitim veli sayfasında yüklenir; kök öğedeki `data-tanitim-turu` bu sayfanın açık izni sayılır
 * (ana sitedeki eski sayfa turu hiç başlatmaz). Hosting CSP'si (`style-src 'self'`) altında çalışır: Driver yalnız CSSOM (`style.cssText`) kullanır.
 * Kitaplık tur gerçekten başlarken ayrı parça olarak yüklenir (dinamik import); bütün koruma koşulları bundan önce denenir.
 */
const GORULDU = 'veliTuruGoruldu';
/** Ekrandaki sıraya göre; öğesi yok, gizli ya da boş olan adım atlanır. */
const ADIMLAR = [
  ['.pano-hero', 'ozet'],
  ['[data-veli-bulten]:has(.bulten-sayfa)', 'defter'], // «henüz bülten yok» yer tutucusunda adım atlanır
  ['[data-tur="hafta"]', 'hafta'],
  ['[data-tur="devam"]', 'devam'],
  ['[data-tur="bildir"]', 'bildir'],
] as const;

// Modül düzeyi durum: aynı anda tek tur; depolama kapalıysa (gizli pencere) bu sayfa oturumunda tekrar açılmaz.
let calisiyor = false;
let sakliGoruldu = false;
let aktif: Driver | null = null;

const gorunur = (el: Element | null) => !!el && !el.matches(':empty') && el.getClientRects().length > 0 && el.getBoundingClientRect().height > 8;
const goruldu = () => sakliGoruldu || portalTercihleri.getItem(GORULDU) === '1';

/** Açık tur varsa kapatır (çıkış / giriş ekranına dönüş); bayrak yazmaz. */
export function turuKapat(): void { aktif?.destroy(); }

export function veliTuru(kok: HTMLElement, m: VeliMetin, zorla = false): void {
  if (!kok.hasAttribute('data-tanitim-turu')) return;
  if (!zorla && goruldu()) return;
  const dokuHazir = () => kok.isConnected && !!kok.querySelector('.pano-hero');
  const baslat = async () => {
    // Başka bir pencere ya da tur açıksa başlatma.
    if (calisiyor || document.querySelector('.driver-active, dialog[open], [aria-modal="true"], [role="dialog"]')) return;
    const t = m.tur;
    const adimlar: DriveStep[] = ADIMLAR.filter(([sec]) => gorunur(kok.querySelector(sec)))
      .map(([sec, k]) => ({ element: sec, popover: { title: t[k].baslik, description: t[k].aciklama, ...(k === 'ozet' ? { side: 'bottom', align: 'start' } as const : {}) } }));
    if (adimlar.length < 2) return;
    calisiyor = true; // içe aktarma sürerken ikinci bir başlatma olmasın
    try {
      const { driver } = await import('driver.js');
      if (!dokuHazir()) { calisiyor = false; return; }
      const hareketsiz = matchMedia('(prefers-reduced-motion: reduce)').matches;
      aktif = driver({
        steps: adimlar, popoverClass: 'veli-tur', showProgress: true, progressText: t.ilerleme,
        nextBtnText: t.sonraki, prevBtnText: t.onceki, doneBtnText: t.bitti, closeBtnLabel: t.kapat,
        animate: !hareketsiz, smoothScroll: !hareketsiz, stagePadding: 6, stageRadius: 2, overlayOpacity: 0.62,
        // Driver ilk adımda kutuyu önce (0,0)'a koyup ~0,5 sn sonra hedefin yanına taşır; konumlanana dek saydam kalır (veli.css «veli-tur-konumlu»).
        onPopoverPositioned: (p) => { p.wrapper.classList.add('veli-tur-konumlu'); },
        // Pano yeniden çizilip öğe kaybolursa (çıkış, başka sekmede oturum kapanması) kaplama ekranda kalmasın.
        onElementMissing: (_el, _adim, o) => { o.driver.destroy(); },
        onDestroyed: (_el, _adim, o) => {
          calisiyor = false; aktif = null;
          if (o.reason === 'api') return; // koddan kapatıldı: kullanıcı turu bitirmedi
          sakliGoruldu = true; portalTercihleri.setItem(GORULDU, '1');
        },
      });
      aktif.drive();
    } catch { calisiyor = false; aktif = null; }
  };
  // Bülten bölümü Firestore'dan sonra dolar; en çok ~3 sn beklenir (sınırlı, sonsuz yoklama yok).
  const bekle = (n: number) => {
    if (!dokuHazir()) return; // başka ekrana geçildi (öğrenci kipi, çıkış)
    if (!zorla && n < 12 && kok.querySelector('[data-veli-bulten]:empty')) { setTimeout(() => bekle(n + 1), 250); return; }
    void baslat();
  };
  bekle(0);
}
