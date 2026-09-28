// Yalnız tür: testlerde Node .ts dosyasını tür silerek çalıştırır, değer olarak içe aktarılan bir tür çalışma anında hata verir.
import type { Duzen } from '../lib/ekran/secim.ts';

/** Döndürme sonrası alan oranı (genişlik ÷ yükseklik) bu eşiğe ulaşırsa tuval yatay çizilir. */
export const YATAY_ESIGI = 1.2;

export interface TuvalGeometrisi {
  duzen: Duzen;
  genislik: number; // tuval genişliği, CSS px (tuvalin kendi ekseninde, döndürmeden önce)
  yukseklik: number; // tuval yüksekliği, CSS px
  u: number; // --u, CSS px: tuvalin kısa kenarının %1'i (dikeyde genişlik, yatayda yükseklik)
  donusum: string; // CSS transform değeri
}

/** Zorlanmış tercih (`?duzen=`) varsa o, yoksa alan oranı belirler. Yükseklik 0 ya da eksiyken (pencere henüz ölçülmedi)
 *  bölme yapılmaz, eski davranış olan dikey düzende kalınır. */
export function duzenSec(alanG: number, alanY: number, tercih: Duzen | null): Duzen {
  if (tercih) return tercih;
  if (alanY <= 0) return 'dikey';
  return alanG / alanY >= YATAY_ESIGI ? 'yatay' : 'dikey';
}

/** Ekrana sığan 16:9 (yatay) ya da 9:16 (dikey) tuvalin boyutu, --u değeri ve yerleştirme dönüşümü. Saf hesaptır, DOM'a
 *  dokunmaz; olcekKur ile testler aynı kaynaktan yararlanır. Alan (alanG × alanY) tuvalin kendi eksenindedir: ?don=90/270
 *  ile pencerenin yüksekliği tuval için genişlik olur. Dikeyde genişlik, yatayda yükseklik esastır; öteki 16:9'dan gelir. */
export function tuvalGeometrisi(W: number, H: number, don: 0 | 90 | 270, tercih: Duzen | null): TuvalGeometrisi {
  const alanG = don ? H : W;
  const alanY = don ? W : H;
  const duzen = duzenSec(alanG, alanY, tercih);
  let g: number;
  let y: number;
  if (duzen === 'yatay') {
    y = Math.min(alanY, (alanG * 9) / 16);
    g = (y * 16) / 9;
  } else {
    g = Math.min(alanG, (alanY * 9) / 16);
    y = (g * 16) / 9;
  }
  /* TV kesirli CSS boyutu bildirir (ör. 961,5023×540,8451) ve 16:9'a yuvarlama alanı 1 pikselden az açıkta bırakabilir;
     o payı doldurmazsak kenarda alt-piksellik siyah çizgi görünür. 1 pikseli aşan pay gerçek şerittir, korunur.
     Bu yapışma iki düzen için de bilerek geçerlidir: kesirli boyutlu dikey bir TV de kenarda siyah çizgi göstermemeli. */
  if (alanG - g < 1) g = alanG;
  if (alanY - y < 1) y = alanY;
  const x = (W - (don ? y : g)) / 2;
  const ust = (H - (don ? g : y)) / 2;
  const donusum =
    don === 90 ? `translate(${x + y}px, ${ust}px) rotate(90deg)`
    : don === 270 ? `translate(${x}px, ${ust + g}px) rotate(270deg)`
    : `translate(${x}px, ${ust}px)`;
  return { duzen, genislik: g, yukseklik: y, u: (duzen === 'yatay' ? y : g) / 100, donusum };
}

/** Tuvalin durduğu alan: .sahne kabının ölçüsü. Kap yoksa ya da henüz ölçülmediyse (bir kenarı 0) pencere ölçüsü alınır.
 *  Kaptan okumanın nedeni TV: kesirli CSS boyutu (961,5×540,8) bildirir, window.innerWidth/Height ise tam sayıya
 *  yuvarlanmış verir ve tuval kenarda alt-piksellik pay bırakırdı. Sahne pencereyi aynen kaplar (position: fixed) ve
 *  tuvalin boyutundan etkilenmez, yani bu okuma tuvalin kendi ayarıyla geri beslenmez. */
function alanOlc(tuval: HTMLElement): { W: number; H: number } {
  const kap = tuval.parentElement;
  const r = kap ? kap.getBoundingClientRect() : null;
  return r && r.width > 0 && r.height > 0 ? { W: r.width, H: r.height } : { W: window.innerWidth, H: window.innerHeight };
}

/**
 * Tuvali (#ekran) alana sığdırır ve düzenini seçer. Düzen, döndürme sonrası etkin alanın oranından gelir: oran
 * YATAY_ESIGI (1,2) ve üzerindeyse yatay 16:9, altındaysa dikey 9:16; `?duzen=yatay|dikey` bu seçimi zorlar. Kutu
 * ekrana yatay 16:9 sinyal verir; ekran dikey asıldığında `?don=90` (ya da 270) tuvali döndürür ve etkin alan
 * pencerenin yan çevrilmişi olur. Bütün ölçüler --u'ya bağlıdır: tuvalin KISA kenarının %1'i, px (dikeyde genişlik,
 * yatayda yükseklik). Eski WebView'de cqw/clamp olmadığı için ölçek JS ile verilir.
 * Pencere boyutu değişince (ör. döndürülmüş pencere) düzen yeniden seçilir ve ardından `degisince` çağrılır. İlk
 * uygulamada çağrılmaz: çağıranın durumu (main.ts'te veri, sayfa) o anda henüz kurulmamıştır.
 */
export function olcekKur(tuval: HTMLElement, don: 0 | 90 | 270, tercih: Duzen | null, degisince?: () => void): void {
  const uygula = (): void => {
    const { W, H } = alanOlc(tuval);
    const s = tuvalGeometrisi(W, H, don, tercih);
    tuval.setAttribute('data-duzen', s.duzen);
    tuval.style.width = s.genislik + 'px';
    tuval.style.height = s.yukseklik + 'px';
    tuval.style.setProperty('--u', s.u + 'px');
    tuval.style.transformOrigin = '0 0';
    tuval.style.transform = s.donusum;
  };
  uygula();
  window.addEventListener('resize', () => {
    uygula();
    // Sayfa aylarca açık kalır: geri çağrıdaki bir hata sonraki yeniden boyutlanmaları da bozmasın.
    if (degisince) { try { degisince(); } catch (hata) { console.error(hata); } }
  });
}
