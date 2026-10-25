/**
 * Çevrim dışı çalışma — service worker (src/sw/sw.ts), sayfa betikleri ve testlerin ORTAK, DOM'suz parçaları (25 Ekim 2026).
 * Bu dosya `@ortak/*` takma adı ya da DOM bilmez: service worker paketine (esbuild) ve düğüm testlerine olduğu gibi girer.
 *
 * Önbellekler (adlar ve kalıcılık tek yerde):
 *  - `ezber-kabuk-<damga>`: sürümlü. Çevrim dışı yedek sayfalar, açılmış sayfaların HTML'i ve `_astro`/yazı tipi/logo/simge
 *    dosyaları. Damga değişince (yeni SW) eski sürüm silinir; kayıtlı maddeler yeni sürümde SW tarafından yeniden alınır.
 *  - `ezber-ses-v1`: KALICI. YALNIZ «İnternetsiz çalışmak için kaydet»e basılan maddelerin Diyanet kayıtları (tam 200 yanıt; sayfa yazar, çalınan ses yazılmaz); sürüm yükselince silinmez.
 *  - `ezber-kayit-v1`: KALICI. «İnternetsiz çalışmak için kaydet»e basılan maddelerin künyesi (JSON; kişisel veri yok).
 */
export const SES_KOKENI = 'https://ulucamii.be';
export const SES_YOLU = '/media/ses/';
export const KABUK_ONEKI = 'ezber-kabuk-';
export const SES_ONBELLEGI = 'ezber-ses-v1';
export const KAYIT_ONBELLEGI = 'ezber-kayit-v1';
/** Kayıt künyelerinin yapay anahtar öneki (`/cevrimdisi-kayit/<dil>/<madde>`): gerçek bir sayfa DEĞİL, yalnız Cache API anahtarı. */
export const KAYIT_YOLU = '/cevrimdisi-kayit/';
/** SW'nin kayıtlı maddeleri yeniden aldığı sürümü yazdığı özel kayıt (künye değildir; `kayitAnahtariMi` false döner). */
export const YENILENEN_SURUM = `${KAYIT_YOLU}_yenilenen-surum`;
export const DILLER = ['tr', 'fr', 'en', 'nl', 'de'] as const;
export type KayitDili = (typeof DILLER)[number];

/** Önbelleğe alınan künye (JSON). `sesler[].b` Ulu Camii sunucusundan inen kaydın bayt boyu; `sayfaBayt` HTML + sayfanın dosyaları. */
export interface Kayit {
  v: 1;
  id: string;
  dil: KayitDili;
  ad: string;
  yol: string;
  sayfaBayt: number;
  sesler: { y: string; b: number }[];
  tarih: string;
}

export const kayitAnahtari = (dil: string, id: string): string => `${KAYIT_YOLU}${dil}/${id}`;
const KAYIT_DESENI = new RegExp(`^${KAYIT_YOLU}(${DILLER.join('|')})/([a-z0-9-]+)$`);
export const kayitAnahtariMi = (yol: string): boolean => KAYIT_DESENI.test(yol);

/** Önbellek anahtarı: kök + yol (sorgu ve çapa yok). `/tr/kartlar/?sec=x` ile `/tr/kartlar/` aynı HTML'dir. */
export const sayfaAnahtari = (u: URL): string => u.origin + u.pathname;

/** Ulu Camii sunucusundaki Diyanet kaydı mı (SW bu adreslere ses kuralını uygular: kayıtlıysa önbellekten, değilse ağa dokunmadan). */
export const sesAdresiMi = (u: URL): boolean => u.origin === SES_KOKENI && u.pathname.startsWith(SES_YOLU);

const STATIK_ONEKLER = ['/_astro/', '/fonts/', '/logo/'];
const STATIK_DOSYALAR = new Set(['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']);
/** Önbellek öncelikli statik dosya mı: özetli yapı dosyaları, yazı tipleri, logo ve simgeler. */
export const statikMi = (yol: string): boolean => STATIK_ONEKLER.some((o) => yol.startsWith(o)) || STATIK_DOSYALAR.has(yol);

/** Sayfanın (ya da bir CSS/JS dosyasının) istediği statik dosyalar: HTML'de href/src, CSS'te url(), JS'te `./x.js`, `/_astro/x.js` ve
 *  Vite'ın `_astro/x.js` yükleme listesi. `taban`: metnin kendi yolu (göreli adresler buna göre çözülür). Başka köken ve statik olmayan
 *  adresler (sayfa bağlantıları, site haritası, paylaşım görseli) atılır. */
export function varlikAdresleri(tur: 'html' | 'css' | 'js', metin: string, taban: string): string[] {
  const SAHTE = 'https://varlik.invalid';
  const bulunan = new Set<string>();
  const ekle = (ham: string) => {
    try {
      const adres = ham.startsWith('_astro/') ? `/${ham}` : ham; // Vite'ın yükleme listesi köke göredir
      const u = new URL(adres, SAHTE + taban);
      if (u.origin === SAHTE && statikMi(u.pathname)) bulunan.add(u.pathname);
    } catch {
      /* çözülemeyen adres: yok say */
    }
  };
  if (tur === 'html') for (const m of metin.matchAll(/\s(?:href|src)="([^"]+)"/g)) ekle(m[1]);
  else if (tur === 'css') for (const m of metin.matchAll(/url\(\s*["']?([^)"'\s]+)["']?\s*\)/g)) ekle(m[1]);
  else for (const m of metin.matchAll(/["'`]((?:\.{1,2}\/|\/|_astro\/)[^"'`\s]+\.(?:js|css|woff2|svg))["'`]/g)) ekle(m[1]);
  return [...bulunan].sort();
}

/** Bayt aralığı isteği: `bytes=a-b`, `bytes=a-`, `bytes=-n`. Birden çok aralık ya da anlamsız başlık → `null` (tam yanıt verilir; RFC 9110 sunucuya
 *  Range'i yok saymayı serbest bırakır); karşılanamayan aralık → `'gecersiz'` (416). `son` dâhildir. */
export function aralikCoz(baslik: string | null | undefined, boyut: number): { bas: number; son: number } | null | 'gecersiz' {
  const m = /^bytes=(\d*)-(\d*)$/.exec((baslik ?? '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let bas: number;
  let son: number;
  if (m[1] === '') {
    const n = Number(m[2]);
    if (n === 0) return 'gecersiz';
    bas = Math.max(0, boyut - n);
    son = boyut - 1;
  } else {
    bas = Number(m[1]);
    son = m[2] === '' ? boyut - 1 : Math.min(Number(m[2]), boyut - 1);
  }
  if (!(bas < boyut) || bas > son) return 'gecersiz';
  return { bas, son };
}

/** Ses yanıtı başlıkları: `audio/mp3` (GitHub Pages'in yazdığı) standart `audio/mpeg`'e çevrilir; iOS Safari standart türü ister. */
export const sesTuru = (ham: string | null | undefined): string => {
  const t = (ham ?? '').split(';')[0].trim().toLowerCase();
  return !t || t === 'audio/mp3' ? 'audio/mpeg' : t;
};

/** Çevrim dışı yedek sayfa dili: önce adresteki dil, sonra tarayıcının dil sırası (kök sayfadaki yönlendirmeyle aynı sıra), yoksa İngilizce. */
export function dilSec(yol: string, kabulDili: string | null | undefined): KayitDili {
  const ilk = yol.split('/')[1];
  const adres = DILLER.find((d) => d === ilk);
  if (adres) return adres;
  for (const parca of (kabulDili ?? '').split(',')) {
    const kod = parca.trim().slice(0, 2).toLowerCase();
    const bulunan = DILLER.find((d) => d === kod);
    if (bulunan) return bulunan;
  }
  return 'en';
}

/** Her kurulumda önyüklenen sayfalar: kök (kurulu uygulamanın başlangıç adresi) ve beş dilin çevrim dışı sayfası. */
export const ONYUKLEME_SAYFALARI: readonly string[] = ['/', ...DILLER.map((d) => `/${d}/cevrimdisi/`)];
export const cevrimdisiYolu = (dil: string): string => `/${dil}/cevrimdisi/`;

/** SW'ye «bu sayfayı ve dosyalarını al» denebilecek yollar: yalnız beş dilin sayfaları (`/tr/calis/s-ihlas/`); başka yol reddedilir. */
export const kaydedilebilirYolMu = (yol: string): boolean => new RegExp(`^/(?:${DILLER.join('|')})/(?:[a-z0-9-]+/)*$`).test(yol);

/** `{ad}` gibi yer tutucuları doldurur (metinlerin sayfa betiğine `data-veri` ile gelen kısmı için; i18n dosyasını pakete almamak için burada). */
export const doldur = (s: string, d: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (_, x: string) => String(d[x] ?? ''));
