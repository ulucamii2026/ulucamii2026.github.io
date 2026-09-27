/**
 * Cami ekranının service worker'ı — /ekran/sw.js (kapsam /ekran/). 27 Eylül 2026.
 * Ekran internetsiz de açılabilsin diye sayfa iskeleti, paket, fontlar, logolar ve üç veri akışı
 * önbellekte tutulur. Sayfa ve JSON'lar AĞ ÖNCE (taze veri), diğerleri ÖNBELLEK ÖNCE gelir. Her derleme
 * yeni bir sürüm damgası taşır; yeni SW eski önbelleği siler, sayfa bir kez yenilenir (main.ts).
 */
declare const __EKRAN_SURUM__: string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw: any = self;
const ONBELLEK = 'ekran-' + __EKRAN_SURUM__;
const KABUK = [
  '/ekran/', '/ekran/ekran.css', '/ekran/ekran.js',
  '/ekran/fonts/work-sans-latin.woff2', '/ekran/fonts/work-sans-latin-ext.woff2', '/ekran/fonts/amiri-arabic.woff2',
  '/media/logo/ulu-camii-logo.svg', '/media/logo/ulu-camii-logo-beyaz.svg',
  '/ekran/vakitler.json', '/ekran/akis.json', '/ekran/icerik.json',
];

/* GitHub Pages KABUK dosyalarını max-age=600 ile sunar: adressiz bir addAll() bu dosyaları HTTP
   önbelleğinden alabilir ve yeni SW sürümü altında eski ekran.js/ekran.css'i saklayabilir. Her istek
   { cache: 'reload' } ile kurulur (Chrome 64+): HTTP önbelleği atlanır, doğrudan ağdan taze kopya alınır. */
sw.addEventListener('install', (e: { waitUntil(p: Promise<unknown>): void }) => {
  e.waitUntil(
    caches.open(ONBELLEK)
      .then((c) => c.addAll(KABUK.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (e: { waitUntil(p: Promise<unknown>): void }) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a.indexOf('ekran-') === 0 && a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => sw.clients.claim()),
  );
});

function sakla(istek: Request, yanit: Response): Response {
  if (yanit.ok) {
    const kopya = yanit.clone();
    void caches.open(ONBELLEK).then((c) => c.put(istek, kopya));
  }
  return yanit;
}

const AG_ZAMAN_ASIMI_MS = 10_000;
type AgSonuc = { tamam: true; yanit: Response } | { tamam: false };

/* Wi-Fi ayakta ama internet tıkandığında (taşıyıcı portalı, yarım kalan DNS…) fetch() hiç çözülmeyebilir:
   ne başarıyla döner ne de reddedilir. Sayfanın kendi isteği (src/ekran/veri.ts → getir) 30 sn'de
   vazgeçer ve önbelleği hiç görmez — kutu Wi-Fi'ye bağlıyken bile "Namaz vakitleri güncellenemedi" yazar.
   AbortSignal.timeout (Chrome 103) eski WebView'de yoktur; zamanlayıcı setTimeout + Promise ile kurulur.
   (Ad: public/admin/panel.js kendi global `bekle`sini tanımlar; sw.ts import/export içermediği için
   TypeScript onu da genel kapsamda bir "script" sayar — aynı adı kullanmak ts(2451) çakışmasına yol açar.) */
function zamanAsimiBekle(ms: number): Promise<AgSonuc> {
  return new Promise((cozum) => setTimeout(() => cozum({ tamam: false }), ms));
}

const agOnce = (istek: Request): Promise<Response> => {
  const ag: Promise<Response> = fetch(istek).then((y) => sakla(istek, y));
  const agSonucu: Promise<AgSonuc> = ag.then((yanit): AgSonuc => ({ tamam: true, yanit }));
  return Promise.race([agSonucu, zamanAsimiBekle(AG_ZAMAN_ASIMI_MS)])
    .catch((): AgSonuc => ({ tamam: false })) // ağ 10 sn dolmadan başarısız oldu: hemen önbelleğe düş
    .then((sonuc) =>
      sonuc.tamam
        ? sonuc.yanit
        // 10 sn doldu, ağ hâlâ cevap vermedi: önbellekten yanıtla. Önbellek de boşsa ağı beklemeye
        // devam et — geç de gelse sakla() zaten çalıştı; sonunda o da başarısız olursa hata dön.
        : caches.match(istek, { ignoreSearch: true }).then((onbellek) => onbellek || ag.catch(() => Response.error())));
};

const onbellekOnce = (istek: Request): Promise<Response> =>
  caches.match(istek).then((y) => y || fetch(istek).then((t) => sakla(istek, t)));

sw.addEventListener('fetch', (e: { request: Request; respondWith(p: Promise<Response>): void }) => {
  const istek = e.request;
  const u = new URL(istek.url);
  if (istek.method !== 'GET' || u.origin !== sw.location.origin) return;
  if (u.pathname === '/ekran/' || /^\/ekran\/[a-z]+\.json$/.test(u.pathname)) e.respondWith(agOnce(istek));
  else if (u.pathname.indexOf('/ekran/') === 0 || u.pathname.indexOf('/media/') === 0) e.respondWith(onbellekOnce(istek));
});
