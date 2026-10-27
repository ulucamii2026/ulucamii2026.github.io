/**
 * Cami ekranı service worker'ının saf yardımcıları (src/ekran/sw.ts). sw.ts yan etkilidir (olay dinleyicileri
 * kurar); bu dosya yalnız hesap yapar, birim testle sınanır (tests/ekran-sw.test.mjs). Chromium 70 uyumlu.
 */

/** Kurulumda kabuk dosyasının sürümlü adresi: `u?v=<damga>` (sorgu varsa `&v=`). GitHub Pages'in CDN'i yayından
 *  hemen sonra eski ekran.js'i verebilir; `cache: 'reload'` yalnız tarayıcının HTTP önbelleğini atlar. Sürümlü
 *  adres CDN'de hiç görülmemiş bir adrestir, taze kopya gelir; önbelleğe asıl adresle (`u`) yazılır. */
export function surumluAdres(u: string, surum: string): string {
  return u + (u.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(surum);
}

/** Duyuru akışı (/ekran/akis.json) ağdan geldiğinde silinecek önbellek kayıtları: aynı kökende /media/ altında olup
 *  ne kabuk listesinde (logolar) ne de akışın `duyurular[].gorsel` adreslerinde bulunanlar — eski ?v= sürümleri ve
 *  süresi dolmuş duyuruların görselleri. Tam adres (sorgu dâhil) karşılaştırılır. Akış beklenen biçimde değilse
 *  hiçbir şey silinmez (bozuk bir yanıt önbelleği boşaltmamalı). `anahtarlar`: önbellekteki isteklerin tam adresleri. */
export function budanacaklar(anahtarlar: readonly string[], kabuk: readonly string[], akis: unknown, koken: string): string[] {
  const duyurular = akis && typeof akis === 'object' ? (akis as { duyurular?: unknown }).duyurular : undefined;
  if (!Array.isArray(duyurular)) return [];
  const tut = new Set<string>();
  const ekle = (adres: unknown): void => {
    if (typeof adres !== 'string') return;
    try { tut.add(new URL(adres, koken).href); } catch { /* çözülemeyen adres: tutulacak bir kayıt değil */ }
  };
  for (const u of kabuk) ekle(u);
  for (const d of duyurular) if (d && typeof d === 'object') ekle((d as { gorsel?: unknown }).gorsel);
  return anahtarlar.filter((a) => {
    let adres: URL;
    try { adres = new URL(a); } catch { return false; }
    return adres.origin === koken && adres.pathname.indexOf('/media/') === 0 && !tut.has(adres.href);
  });
}

/* ---- Kapsam (D2: konumdan bağımsız sayfa) ----
   Aynı paket Ulu Camii'nde /ekran/ kapsamında, bir platform camisinde /c/<kimlik>/ kapsamında çalışır. SW kapsamını
   kendi kaydından okur (sw.registration.scope); aşağıdaki işlevlerin hepsi saftır ve `kapsam` hep `/` ile biter.
   /ekran/ kapsamında sonuç bugünkü davranışla birebir aynıdır. */

/** Ulu Camii'nin kapsamı; bu kapsamda önbellek adı ve kabuk listesi eskisiyle aynıdır. */
const EKRAN_KAPSAMI = '/ekran/';

/** Kayıt kapsamı adresinden yol: `https://x/c/a/` → `/c/a/`. Her zaman `/` ile biter. */
export function kapsamYolu(kapsamAdresi: string): string {
  const yol = new URL(kapsamAdresi).pathname;
  return yol.charAt(yol.length - 1) === '/' ? yol : yol + '/';
}

/** Önbellek adı öneği: /ekran/ için `ekran-` (bugünkü); başka kapsamda `ekran-` + yol + `_` (eğik çizgiler `-`,
 *  `[^a-z0-9-]` → `-`), ör. /c/x/ → `ekran-c-x_`. Ayırıcı `_` cami kimliklerinde bulunmaz: `x` kimliğinin öneği
 *  (`ekran-c-x_`) `x-y` kimliğinin önbelleğini (`ekran-c-x-y_…`) kapsamaz, yani biri ötekinin önbelleğini silemez. */
export function onbellekOnEki(kapsam: string): string {
  if (kapsam === EKRAN_KAPSAMI) return 'ekran-';
  return 'ekran-' + kapsam.replace(/^\/+|\/+$/g, '').replace(/\//g, '-').replace(/[^a-z0-9-]/g, '-') + '_';
}

export const onbellekAdi = (kapsam: string, surum: string): string => onbellekOnEki(kapsam) + surum;

/** Etkinleşmede silinecek eski önbellekler: bu kapsamın öneğiyle başlayıp güncel sürümün kendi adı olmayanlar. */
export function silinecekOnbellekler(adlar: readonly string[], kapsam: string, surum: string): string[] {
  const onEk = onbellekOnEki(kapsam);
  const guncel = onbellekAdi(kapsam, surum);
  return adlar.filter((a) => a.indexOf(onEk) === 0 && a !== guncel);
}

/** Kurulumda önbelleğe alınacak adresler (src/ekran/kabuk.json, Ulu Camii'nin /ekran/ listesi). /ekran/ kapsamında
 *  liste birebir; başka kapsamda: sayfa (/ekran/) kapsamın kendisi, akışlar (/ekran/<ad>.json) kapsamın içindeki aynı
 *  adlı dosyalar olur, /media/ düşer (platformda logo yok: tek eksik dosya kurulumu reddettirirdi), öteki paylaşılan
 *  /ekran/ dosyaları (paket, CSS, fontlar) kalır. */
export function kabukAdresleri(kabuk: readonly string[], kapsam: string): string[] {
  if (kapsam === EKRAN_KAPSAMI) return kabuk.slice();
  const sonuc: string[] = [];
  for (const u of kabuk) {
    if (u.indexOf('/media/') === 0) continue;
    if (u === EKRAN_KAPSAMI) sonuc.push(kapsam);
    else if (/^\/ekran\/[^/]+\.json$/.test(u)) sonuc.push(kapsam + u.slice(EKRAN_KAPSAMI.length));
    else sonuc.push(u);
  }
  return sonuc;
}

/** Ağ önce yolu: kapsamın sayfası ya da kapsamın hemen altındaki `<ad>.json` akışları (taze veri); gerisi önbellek önce. */
export function agOnceMi(yol: string, kapsam: string): boolean {
  return yol === kapsam || (yol.indexOf(kapsam) === 0 && /^[^/]+\.json$/.test(yol.slice(kapsam.length)));
}

/** SW'nin yanıtladığı yollar: kapsamın kendisi ile paylaşılan /ekran/ ve /media/ altı. */
export function kapsamdaMi(yol: string, kapsam: string): boolean {
  return yol.indexOf(kapsam) === 0 || yol.indexOf(EKRAN_KAPSAMI) === 0 || yol.indexOf('/media/') === 0;
}

/** Duyuru akışı yolu; medya budaması yalnız bu yol ağdan tam geldiğinde çalışır (sw.ts → agOnce). */
export const akisYolu = (kapsam: string): string => kapsam + 'akis.json';

/** Önbellek sürümü: platform derlemesi sw.js içindeki `@@EKRAN_SURUM@@` yer tutucusunu kendi sürümüyle değiştirir
 *  (platform sayfa derlemesi); değiştirilmemişse (Ulu Camii'nin kendi derlemesi) yer tutucu `@@` ile başlar ve derleme
 *  damgası (`varsayilan`) geçerlidir. */
export function surumSec(yerTutucu: string, varsayilan: string): string {
  return yerTutucu.indexOf('@@') === 0 ? varsayilan : yerTutucu;
}
