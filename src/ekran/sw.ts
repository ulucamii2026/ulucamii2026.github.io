/**
 * Cami ekranının service worker'ı — /ekran/sw.js (kapsam /ekran/). 27 Eylül 2026, düzeltme turu 1.
 * Ekran internetsiz de açılabilsin diye sayfa iskeleti, paket, fontlar, logolar ve üç veri akışı
 * önbellekte tutulur. Sayfa ve JSON'lar AĞ ÖNCE (taze veri), diğerleri ÖNBELLEK ÖNCE gelir. Her derleme
 * yeni bir sürüm damgası taşır; yeni SW eski önbelleği siler, sayfa bir kez yenilenir (main.ts).
 */
/* Önbelleğe alınacak dosyaların TEK listesi (esbuild JSON'u pakete gömer). Site denetimi (scripts/site-denetim.mjs)
   aynı dosyayı okur ve her yolun dist/ altında gerçekten üretildiğini `kritik` olarak denetler: tek bir eksik dosya
   (ör. yeniden adlandırılmış bir logo) cache.addAll'ı reddettirir, bundan sonraki hiçbir SW sürümü kurulamaz. */
import KABUK from './kabuk.json';

declare const __EKRAN_SURUM__: string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw: any = self;
const ONBELLEK = 'ekran-' + __EKRAN_SURUM__;

/* self/ExtendableEvent/FetchEvent için DOM tip tanımları (bu proje "webworker" lib'ini değil "dom" lib'ini
   kullanıyor, ikisi aynı anda olamaz) yok — olay parametreleri ihtiyaç duyulan iki üyeyle kendi arayüzümüzle
   tipleniyor. FetchEvent gerçekte ExtendableEvent'i genişletir (waitUntil + respondWith/request). */
interface UzatilabilirOlay { waitUntil(p: Promise<unknown>): void }
interface AgIstegiOlayi extends UzatilabilirOlay { request: Request; respondWith(p: Promise<Response>): void }

/* GitHub Pages KABUK dosyalarını max-age=600 ile sunar: adressiz bir addAll() bu dosyaları HTTP
   önbelleğinden alabilir ve yeni SW sürümü altında eski ekran.js/ekran.css'i saklayabilir. Her istek
   { cache: 'reload' } ile kurulur (Chrome 64+): HTTP önbelleği atlanır, doğrudan ağdan taze kopya alınır. */
sw.addEventListener('install', (e: UzatilabilirOlay) => {
  e.waitUntil(
    caches.open(ONBELLEK)
      .then((c) => c.addAll(KABUK.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (e: UzatilabilirOlay) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a.indexOf('ekran-') === 0 && a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => sw.clients.claim()),
  );
});

/** Ağdan gelen yanıtı klonlayıp GÜNCEL SÜRÜMÜN önbelleğine yazar; yalnız tam 200 (ok bazen 206'yı da
 *  sayar, cache.put 206'yı reddeder). Yazma başarısız olursa (kota, tuhaf yanıt…) günlüğe düşer, hiçbir
 *  zaman reddetmez — bu adım arka planda sürebildiği için fetch olayının ömrünü (waitUntil) hiç bozmamalı. */
async function sakla(istek: Request, yanit: Response): Promise<Response> {
  if (yanit.status === 200) {
    try {
      const c = await caches.open(ONBELLEK);
      await c.put(istek, yanit.clone());
    } catch (hata) {
      console.error(hata);
    }
  }
  return yanit;
}

const AG_ZAMAN_ASIMI_MS = 10_000;
type AgSonuc = { tamam: true; yanit: Response } | { tamam: false };

/* Bir ağ yanıtı yalnız "ok" ya da bir "opaque redirect" ise BAŞARI sayılır. Sayfa isteği (/ekran/)
   redirect modu 'manual' ile gelebilir (yönlendirmeyi SW değil tarayıcı sürsün diye); bu durumda yanıt
   opaqueredirect tipinde gelir ve olduğu gibi geçmelidir. Her şeyin dışı (5xx, 4xx…) BAŞARISIZLIK sayılır:
   GitHub Pages kesintisinde kutu, içinde ekran.js bile olmayan bir hata sayfasını önbelleğe hiç ALMAMALI,
   son sağlam sürümden yanıtlamaya devam etmeli. */
function agBasarili(yanit: Response): boolean {
  return yanit.ok || yanit.type === 'opaqueredirect';
}

/* Wi-Fi ayakta ama internet tıkandığında (taşıyıcı portalı, yarım kalan DNS…) fetch() hiç çözülmeyebilir:
   ne başarıyla döner ne de reddedilir. Sayfanın kendi isteği (src/ekran/veri.ts → getir) 30 sn'de
   vazgeçer ve önbelleği hiç görmez — kutu Wi-Fi'ye bağlıyken bile "Namaz vakitleri güncellenemedi" yazar.
   AbortSignal.timeout (Chrome 103) eski WebView'de yoktur; zamanlayıcı setTimeout + Promise ile kurulur.
   Ağ kazanırsa zamanlayıcı temizlenir (clearTimeout) — kaybeden taraf sarkan bir zamanlayıcı bırakmaz. */
function zamanAsimiBekle(ms: number): { soz: Promise<AgSonuc>; iptal: () => void } {
  let id!: ReturnType<typeof setTimeout>;
  const soz = new Promise<AgSonuc>((cozum) => { id = setTimeout(() => cozum({ tamam: false }), ms); });
  return { soz, iptal: () => clearTimeout(id) };
}

const agOnce = async (istek: Request, e: AgIstegiOlayi): Promise<Response> => {
  const ag: Promise<Response> = fetch(istek).then((y) => sakla(istek, y));
  // Ağ geç de gelse sakla() çalışsın diye SW bu isteğin ömrü boyunca ayakta tutulur (hata da olsa asla
  // reddetmeyen bir söz — waitUntil'e verilen söz reddederse SW'nin kendisi "hata verdi" sayılabilir).
  e.waitUntil(ag.then(() => undefined).catch(() => undefined));

  const { soz: zamanAsimi, iptal: zamanAsimiIptal } = zamanAsimiBekle(AG_ZAMAN_ASIMI_MS);
  const agSonucu: Promise<AgSonuc> = ag.then((yanit): AgSonuc => ({ tamam: true, yanit }));

  let sonuc: AgSonuc;
  try {
    sonuc = await Promise.race([agSonucu, zamanAsimi]);
  } catch {
    sonuc = { tamam: false }; // ağ 10 sn dolmadan reddetti (ör. DNS/bağlantı hatası)
  }
  zamanAsimiIptal();

  if (sonuc.tamam && agBasarili(sonuc.yanit)) return sonuc.yanit;

  // Zaman aşımı, ağ hatası ya da başarısız HTTP yanıtı (5xx…): GÜNCEL SÜRÜMÜN önbelleğinden yanıtla.
  // Global caches.match DEĞİL: geç gelen bir yanıt eski bir SW'nin (aktivate sırasında silinmiş) önbelleğini
  // yeniden yaratabilir ve global arama o "yetim" önbelleği okuyabilirdi.
  const onbellek = await caches.open(ONBELLEK).then((c) => c.match(istek, { ignoreSearch: true }));
  if (onbellek) return onbellek;
  if (sonuc.tamam) return sonuc.yanit; // önbellek de yok: hatalı yanıtın (ör. 503) kendisini dön
  try {
    return await ag; // önbellek boş, ağı beklemeye devam et
  } catch {
    return Response.error();
  }
};

const onbellekOnce = (istek: Request): Promise<Response> =>
  caches.open(ONBELLEK).then((c) => c.match(istek)).then((y) => y || fetch(istek).then((t) => sakla(istek, t)));

sw.addEventListener('fetch', (e: AgIstegiOlayi) => {
  const istek = e.request;
  const u = new URL(istek.url);
  if (istek.method !== 'GET' || u.origin !== sw.location.origin) return;
  if (u.pathname === '/ekran/' || /^\/ekran\/[^/]+\.json$/.test(u.pathname)) e.respondWith(agOnce(istek, e));
  else if (u.pathname.indexOf('/ekran/') === 0 || u.pathname.indexOf('/media/') === 0) e.respondWith(onbellekOnce(istek));
});

export {};
