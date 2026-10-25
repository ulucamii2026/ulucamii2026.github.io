/**
 * egitim.ulucamii.be service worker'ı — /sw.js (kapsam /). 25 Ekim 2026, «çevrim dışı çalışma».
 * Çocuk evde, arabada ya da yurt dışında zayıf internetle ezber çalışır: açtığı ya da kaydettiği sayfa, Diyanet kaydıyla birlikte
 * internetsiz de çalışmalı. Kurallar:
 *  - SAYFA (HTML): ağ önce (HTML `no-cache` yayınlanır; taze içerik esastır). Başarılı yanıt önbelleğe yazılır ve sayfanın dosyaları
 *    (CSS, betik ve tembel yüklenen çalışma kipi parçaları, yazı tipleri, logo) arka planda tamamlanır. Önbellekte kopyası olan sayfa için ağ
 *    4 sn içinde yanıt vermezse (zayıf bağlantı) kopya gelir. Ağ yok ve kopya yoksa: sayfanın diline göre çevrim dışı yedek sayfa
 *    (`/<dil>/cevrimdisi/`, kurulumda önyüklenir), kayıtlı maddeleri listeler.
 *  - STATİK (`/_astro/**`, `/fonts/**`, `/logo/**`, simgeler): önbellek önce, sürümlü önbellek (`ezber-kabuk-<damga>`).
 *  - SES (Ulu Camii sunucusundaki Diyanet kayıtları, `https://ulucamii.be/media/ses/…`): dosya KALICI ses önbelleğinde varsa (yalnız «İnternetsiz
 *    çalışmak için kaydet» yazar; sürümle silinmez) oradan, `Range` isteklerine önbellekteki gövdeden doğru bir 206 kurularak verilir (iOS Safari bunu
 *    şart koşar). Önbellekte YOKSA SW araya girmemiş gibi davranır: istek olduğu gibi ağa iletilir, tarayıcı sesi her zamanki gibi akış olarak alır
 *    (tam inmesini beklemez) ve hiçbir şey yazılmaz. SW ses önbelleğine hiç yazmaz; kaydı sayfa yapar (src/lib/cevrimdisi-istemci.ts).
 *  - Önyükleme yalnız yedek sayfalar ve onların dosyalarıdır; 76 madde ve sesler önceden indirilmez.
 * Damga (yapı özeti): scripts/egitim-sw.mjs derlemede gömer; yedek sayfalar ya da SW kodu değişince yeni sürüm kurulur, eski sürümlü
 * önbellek silinir, kayıtlı maddelerin sayfaları yeni sürümde SW tarafından yeniden alınır (sesler kalıcıdır, yeniden inmez).
 */
import {
  KABUK_ONEKI, KAYIT_ONBELLEGI, ONYUKLEME_SAYFALARI, SES_ONBELLEGI, YENILENEN_SURUM,
  aralikCoz, cevrimdisiYolu, dilSec, kayitAnahtariMi, kaydedilebilirYolMu, sayfaAnahtari, sesAdresiMi, sesTuru, statikMi, varlikAdresleri,
  type Kayit,
} from '../lib/cevrimdisi-ortak';

declare const __SURUM__: string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw: any = self;
const KABUK = KABUK_ONEKI + __SURUM__;
const SAYFA_ZAMAN_ASIMI_MS = 4000;

/* self/ExtendableEvent/FetchEvent için DOM tip tanımı yok (proje "dom" lib'ini kullanır, "webworker"ı değil): olaylar kullanılan üyelerle tiplenir. */
interface UzatilabilirOlay { waitUntil(p: Promise<unknown>): void }
interface AgOlayi extends UzatilabilirOlay { request: Request; respondWith(p: Promise<Response>): void }
interface MesajOlayi extends UzatilabilirOlay { data: unknown; ports: readonly MessagePort[] }

const htmlMi = (y: Response): boolean => (y.headers.get('content-type') ?? '').includes('text/html');
const baytSay = (metin: string): number => new Blob([metin]).size;

/* ——— Sayfa ve dosyaları ——— */

/** Dosyaları önbelleğe tamamlar (yoksa ağdan alır); CSS ve JS'in kendi istediği dosyalar da (tembel yüklenen kip parçaları, yazı tipleri).
 *  `say`: kaydın boyutunu bildirmek için bayt toplar (yalnız açık kayıtta; arka plan tamamlamada okumaya gerek yoktur). Alınamayan dosya atlanır. */
async function varliklariAl(adresler: string[], kabuk: Cache, gorulen: Set<string>, say: boolean): Promise<number> {
  let bayt = 0;
  for (const yol of adresler) {
    if (gorulen.has(yol)) continue;
    gorulen.add(yol);
    const anahtar = sw.location.origin + yol;
    let yanit = await kabuk.match(anahtar, { ignoreVary: true });
    if (!yanit) {
      try {
        const ag = await fetch(anahtar);
        if (ag.status !== 200) continue;
        await kabuk.put(anahtar, ag.clone());
        yanit = ag;
      } catch {
        continue;
      }
    }
    const tur = yol.endsWith('.css') ? 'css' : yol.endsWith('.js') ? 'js' : null;
    if (!tur && !say) continue;
    const blob = await yanit.clone().blob();
    bayt += blob.size;
    if (tur) bayt += await varliklariAl(varlikAdresleri(tur, await blob.text(), yol), kabuk, gorulen, say);
  }
  return bayt;
}

/** Bir sayfayı ağdan TAZE alır, önbelleğe yazar ve dosyalarını tamamlar; sayfa + dosyalarının bayt boyunu döner. Kurulum, açık kayıt ve
 *  yeni sürümde yeniden alma bunu kullanır. Başarısızlıkta reddeder (kurulum yarım kalan önyüklemeyle etkinleşmez). */
async function sayfayiAl(yol: string): Promise<number> {
  const u = new URL(yol, sw.location.origin);
  if (u.origin !== sw.location.origin) throw new Error(`başka köken: ${yol}`);
  const yanit = await fetch(u.href, { cache: 'reload' });
  if (yanit.status !== 200 || !htmlMi(yanit)) throw new Error(`sayfa alınamadı: ${u.pathname} (${yanit.status})`);
  const metin = await yanit.clone().text();
  const kabuk = await caches.open(KABUK);
  await kabuk.put(sayfaAnahtari(u), yanit);
  return baytSay(metin) + (await varliklariAl(varlikAdresleri('html', metin, u.pathname), kabuk, new Set(), true));
}

/** Gezinti sırasında ağdan gelen sayfa: yanıt tarayıcıya giderken kopyası yazılır, dosyaları arka planda tamamlanır. Hatalar yanıtı bozmaz. */
async function sayfayiSakla(anahtar: string, kopya: Response, yol: string): Promise<void> {
  try {
    const metin = await kopya.clone().text();
    const kabuk = await caches.open(KABUK);
    await kabuk.put(anahtar, kopya);
    await varliklariAl(varlikAdresleri('html', metin, yol), kabuk, new Set(), false);
  } catch (hata) {
    console.error(hata);
  }
}

/** Yeni sürümde (kabuk silindi) açıkça kaydedilmiş maddelerin sayfa ve dosyaları yeniden alınır. Damga bir kez yazılır: SW kapanıp açılınca tekrarlanmaz. */
async function kayitlileriYenile(): Promise<void> {
  const kayit = await caches.open(KAYIT_ONBELLEGI);
  const isaret = await kayit.match(YENILENEN_SURUM);
  if (isaret && (await isaret.text()) === __SURUM__) return;
  let tamam = true;
  for (const istek of await kayit.keys()) {
    if (!kayitAnahtariMi(new URL(istek.url).pathname)) continue;
    const k = (await (await kayit.match(istek))?.json().catch(() => null)) as Kayit | null;
    if (!k?.yol || !kaydedilebilirYolMu(k.yol)) continue;
    try {
      await sayfayiAl(k.yol);
    } catch {
      tamam = false; // ağ yok: sonraki açılışta yeniden denenir
    }
  }
  if (tamam) await kayit.put(YENILENEN_SURUM, new Response(__SURUM__, { headers: { 'Content-Type': 'text/plain' } }));
}

/* ——— Yaşam döngüsü ——— */

// Kurulum: yalnız yedek sayfalar (kök, beş dilin çevrim dışı sayfası) ve dosyaları. Biri alınamazsa kurulum reddedilir.
sw.addEventListener('install', (e: UzatilabilirOlay) => {
  e.waitUntil((async () => {
    for (const yol of ONYUKLEME_SAYFALARI) await sayfayiAl(yol);
    await sw.skipWaiting(); // HTML ağ önce olduğundan eski sayfayla yeni SW'nin birlikte çalışması güvenlidir
  })());
});

sw.addEventListener('activate', (e: UzatilabilirOlay) => {
  e.waitUntil((async () => {
    for (const ad of await caches.keys()) if (ad.startsWith(KABUK_ONEKI) && ad !== KABUK) await caches.delete(ad);
    await sw.clients.claim();
  })());
});

// Sayfa «Bu sayfayı ve dosyalarını al» der (`sayfa-kaydet`); yanıt MessageChannel portundan gelir. Sesleri sayfa kendisi indirir (SW ömrü kısıtlı, ilerleme sayfada).
sw.addEventListener('message', (e: MesajOlayi) => {
  const veri = e.data as { tur?: unknown; yol?: unknown } | null;
  const port = e.ports[0];
  if (!port || veri?.tur !== 'sayfa-kaydet' || typeof veri.yol !== 'string' || !kaydedilebilirYolMu(veri.yol)) return;
  e.waitUntil(sayfayiAl(veri.yol).then(
    (bayt) => port.postMessage({ tamam: true, bayt }),
    (hata: { name?: string }) => port.postMessage({ tamam: false, hata: hata?.name === 'QuotaExceededError' ? 'kota' : 'ag' }),
  ));
});

/* ——— Sayfa istekleri: ağ önce ——— */

const agBasarili = (y: Response): boolean => y.type === 'opaqueredirect' || y.status < 500;

function zamanAsimi(ms: number): { soz: Promise<null>; iptal: () => void } {
  let id!: ReturnType<typeof setTimeout>;
  const soz = new Promise<null>((cozum) => { id = setTimeout(() => cozum(null), ms); });
  return { soz, iptal: () => clearTimeout(id) };
}

async function cevrimdisiSayfasi(u: URL, istek: Request): Promise<Response> {
  const dil = dilSec(u.pathname, istek.headers.get('accept-language'));
  const kabuk = await caches.open(KABUK);
  const sayfa = await kabuk.match(sayfaAnahtari(new URL(cevrimdisiYolu(dil), sw.location.origin)), { ignoreVary: true });
  return sayfa ?? new Response('Çevrim dışı · Hors ligne · Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

async function sayfaIstegi(istek: Request, e: UzatilabilirOlay): Promise<Response> {
  const u = new URL(istek.url);
  const anahtar = sayfaAnahtari(u);
  const kabuk = await caches.open(KABUK);
  const kayitli = await kabuk.match(anahtar, { ignoreVary: true });
  const ag = fetch(istek).then((y) => {
    if (y.status === 200 && htmlMi(y)) e.waitUntil(sayfayiSakla(anahtar, y.clone(), u.pathname));
    return y;
  });
  e.waitUntil(ag.then(() => undefined, () => undefined)); // zaman aşımında da ağ yanıtı arka planda bitsin, önbellek tazelensin
  if (!kayitli) {
    try {
      return await ag;
    } catch {
      return cevrimdisiSayfasi(u, istek);
    }
  }
  const { soz, iptal } = zamanAsimi(SAYFA_ZAMAN_ASIMI_MS);
  const sonuc = await Promise.race([ag.then((y) => ({ y }), () => null), soz]);
  iptal();
  return sonuc && agBasarili(sonuc.y) ? sonuc.y : kayitli;
}

/* ——— Statik dosyalar: önbellek önce ——— */

async function onbellekOnce(istek: Request): Promise<Response> {
  const u = new URL(istek.url);
  const anahtar = u.origin + u.pathname;
  const kabuk = await caches.open(KABUK);
  const kayitli = await kabuk.match(anahtar, { ignoreVary: true });
  if (kayitli) return kayitli;
  const ag = await fetch(istek);
  if (ag.status === 200 && ag.type === 'basic') {
    try {
      await kabuk.put(anahtar, ag.clone());
    } catch (hata) {
      console.error(hata);
    }
  }
  return ag;
}

/* ——— Ses: yalnız kaydedilmiş dosya önbellekten (Range → 206); kayıtsız ses olduğu gibi ağdan ——— */

const sesBasliklari = (boyut: number, tur: string): Record<string, string> => ({ 'Content-Type': tur, 'Content-Length': String(boyut), 'Accept-Ranges': 'bytes' });

/** Önbellekteki gövdeden tam (200), kısmi (206) ya da karşılanamaz (416) yanıt. Kısmi gövde Blob dilimidir: bellekte kopyalanmaz. */
function aralikYaniti(istek: Request, blob: Blob, tur: string): Response {
  const boyut = blob.size;
  const aralik = aralikCoz(istek.headers.get('range'), boyut);
  if (aralik === 'gecersiz') {
    return new Response(null, { status: 416, statusText: 'Range Not Satisfiable', headers: { 'Content-Range': `bytes */${boyut}`, 'Accept-Ranges': 'bytes' } });
  }
  if (!aralik) return new Response(blob, { status: 200, headers: sesBasliklari(boyut, tur) });
  const uzunluk = aralik.son - aralik.bas + 1;
  return new Response(blob.slice(aralik.bas, aralik.son + 1, tur), {
    status: 206, statusText: 'Partial Content',
    headers: { ...sesBasliklari(uzunluk, tur), 'Content-Range': `bytes ${aralik.bas}-${aralik.son}/${boyut}` },
  });
}

async function sesIstegi(istek: Request): Promise<Response> {
  // `caches.match(…, { cacheName })` önbelleği oluşturmaz: hiç kayıt yapılmamış cihazda `ezber-ses-v1` doğmaz.
  const kayitli = await caches.match(istek.url.split('#')[0], { cacheName: SES_ONBELLEGI });
  if (kayitli) return aralikYaniti(istek, await kayitli.blob(), sesTuru(kayitli.headers.get('content-type')));
  // Kayıtlı değil: istek (`Range` başlığıyla birlikte) olduğu gibi ağa gider; yanıt akar, önbelleğe YAZILMAZ. Ağ yoksa tarayıcının kendi hatası.
  return fetch(istek).catch(() => Response.error());
}

/* ——— Yönlendirme ——— */

let yenilemeBasladi = false;
sw.addEventListener('fetch', (e: AgOlayi) => {
  const istek = e.request;
  if (istek.method !== 'GET') return;
  const u = new URL(istek.url);
  if (u.origin === sw.location.origin) {
    if (u.pathname === '/sw.js' || u.pathname.startsWith('/__/')) return; // SW'nin kendisi ve Firebase'in ayrılmış adresleri
    if (!yenilemeBasladi) {
      yenilemeBasladi = true;
      e.waitUntil(kayitlileriYenile().catch((hata) => console.error(hata)));
    }
    if (istek.mode === 'navigate') e.respondWith(sayfaIstegi(istek, e));
    else if (statikMi(u.pathname)) e.respondWith(onbellekOnce(istek));
  } else if (sesAdresiMi(u)) {
    e.respondWith(sesIstegi(istek));
  }
});

export {};
