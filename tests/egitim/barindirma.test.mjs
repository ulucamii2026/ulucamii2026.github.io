/**
 * egitim.ulucamii.be barındırma yapılandırması ve derlenmiş çıktının CSP'ye uygunluğu (27 Eyl 2026). Neden:
 * firebase.json canlıya aittir. egitim sitesinin güvenlik başlıkları (CSP, nosniff…) ya da önbellek kuralları sessizce
 * gevşerse veya Firestore bloğu bozulursa bu yayından önce yakalanmalı. CSP satır içi betik ve stile izin vermez;
 * derlenmiş sayfada bir tane bile kalırsa canlıda sayfa bozulur (yerelde değil). Önbellekte HTML her açılışta
 * doğrulanmalı: eski HTML yayından sonra silinmiş `_astro` dosyalarını isterse sayfa stilsiz kalır. Site haritası,
 * simgeler ve paylaşım kartları da yayının parçasıdır.
 * Çevrim dışı çalışma (25 Ekim 2026): service worker (/sw.js) kökten sunulur ve her açılışta doğrulanır (eski SW'nin sonsuza dek kalmaması için);
 * CSP yalnız üç yönerge kazandı (worker-src, manifest-src, connect-src'e ana site: SW sesi oradan alıp önbelleğe koyar) — başka gevşeme yok.
 * İlim Yolu Dilim 0 (2 Kasım 2026): hesap girişi için (authDomain egitim.ulucamii.be, Google açılır penceresi, Firestore, Apps Script) CSP yalnız şu kadar açıldı:
 * script-src + apis.google.com; connect-src + Firestore/Kimlik/Token/Cloud Functions (callable, europe-west1)/Apps Script kökenleri; yeni frame-src 'self' (Auth yardımcı iframe'i /__/auth/iframe aynı kökenden);
 * frame-ancestors ve X-Frame-Options 'none'/DENY → 'self'/SAMEORIGIN. /api/saglik yalnız bu bir yola Cloud Function bağlar.
 * Dilim 1 (2 Kasım 2026): çocuk girişi için iki tam yol daha: /api/cocuk-giris → cocukGiris, /api/kart-giris → kartGiris.
 * Önce `npm run egitim:build` (test:egitim bu sırayla çalışır; npm run dogrula:codex de).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const KOK = new URL('../../', import.meta.url);
const oku = (yol) => readFileSync(new URL(yol, KOK), 'utf8');
const firebase = JSON.parse(oku('firebase.json'));
const hosting = [firebase.hosting].flat();
const egitim = hosting.find((h) => h?.public === 'egitim/dist');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SITE = 'https://egitim.ulucamii.be';
const deger = (kural, ad) => kural.headers.find((h) => h.key.toLowerCase() === ad.toLowerCase())?.value;
// Hosting eşleşmesi (yalnız bu yapılandırmadaki biçimler): `regex` (RE2 ile aynı sonuç), `/önek/**` ve `**`.
const uyar = (kural, yol) => (kural.regex ? new RegExp(kural.regex).test(yol)
  : kural.source === '**' ? true
  : kural.source.endsWith('/**') ? yol.startsWith(kural.source.slice(0, -2)) : kural.source === yol);

test('Hosting: egitim sitesi derlenmiş çıktıyı yayınlar; Firestore bloğu değişmedi', () => {
  assert.equal(hosting.length, 1);
  assert.equal(egitim?.site, 'ulucamii-egitim');
  assert.deepEqual(firebase.firestore, { rules: 'firebase/firestore.rules', indexes: 'firebase/firestore.indexes.json' });
  // Varsayılan davranış korunur: /tr → /tr/ (dizin dizini); 404 sayfası gerçek 404 döner. Yeniden yazmalar yalnız üç tam yol → Cloud Function:
  // /api/saglik, çocuk girişi (Dilim 1: /api/cocuk-giris, /api/kart-giris; aynı köken, çerez/CORS gerekmez). Genel `**` yok; başka yol yakalanmaz.
  for (const ad of ['trailingSlash', 'cleanUrls', 'redirects', 'i18n']) assert.equal(egitim[ad], undefined, ad);
  const islev = (functionId) => ({ functionId, region: 'europe-west1' });
  assert.deepEqual(egitim.rewrites, [
    { source: '/api/saglik', function: islev('saglik') },
    { source: '/api/cocuk-giris', function: islev('cocukGiris') },
    { source: '/api/kart-giris', function: islev('kartGiris') },
    { source: '/api/abonelik-cik', function: islev('abonelikCik') },
  ]);
  // Yönlendirilen her işlev gerçekten dışa aktarılıyor (yanlış ad canlıda 404 verirdi).
  const disa = oku('functions/src/index.ts');
  for (const { function: { functionId } } of egitim.rewrites) assert.match(disa, new RegExp(`\\b${functionId}\\b`), functionId);
});

test('Functions: ilim-yolu kod tabanı Node 22, europe-west1, derleme çıktısı dağıtılır', () => {
  assert.equal(firebase.functions.length, 1);
  const [f] = firebase.functions;
  assert.equal(f.source, 'functions');
  assert.equal(f.codebase, 'ilim-yolu');
  assert.deepEqual(f.predeploy, ['npm --prefix functions run build']);
  assert.equal(f.ignore.includes('lib'), false, 'lib/ (esbuild çıktısı) dağıtımdan dışlanamaz');
  const paket = JSON.parse(oku('functions/package.json'));
  assert.equal(paket.engines.node, '22');
  assert.equal(paket.main, 'lib/index.js');
  // Genel seçenekler ortak.ts'te: firebase-functions bunları işlev tanımlanırken okur; index.ts onu ilk içe aktarır.
  assert.match(oku('functions/src/ortak.ts'), /setGlobalOptions\(\{ region: 'europe-west1', maxInstances: 2 \}\)/);
  assert.match(oku('functions/src/index.ts'), /^(\/\/[^\n]*\n)*import '\.\/ortak';/);
});

test('Hosting: bütün yanıtlarda sıkı CSP ve güvenlik başlıkları', () => {
  const genel = egitim.headers.find((k) => k.source === '**');
  const csp = deger(genel, 'Content-Security-Policy');
  const yonerge = Object.fromEntries(csp.split(';').map((y) => y.trim().split(/\s+/)).map(([ad, ...d]) => [ad, d]));
  assert.deepEqual(yonerge['default-src'], ["'none'"]);
  for (const ad of ['style-src', 'img-src', 'font-src', 'worker-src', 'manifest-src', 'frame-ancestors']) assert.deepEqual(yonerge[ad], ["'self'"], ad);
  // Yeni Müslüman yolu (11 Kasım 2026): Diyanet videoları tıklanınca youtube-nocookie.com çerçevesinde açılır; frame-src'ye YALNIZ bu köken eklendi.
  assert.deepEqual(yonerge['frame-src'], ["'self'", 'https://www.youtube-nocookie.com']);
  for (const ad of ['base-uri', 'form-action', 'object-src']) assert.deepEqual(yonerge[ad], ["'none'"], ad);
  // Google ile giriş: yalnız Google'ın giriş betiği (gapi) dış betik kaynağıdır.
  assert.deepEqual(yonerge['script-src'], ["'self'", 'https://apis.google.com']);
  // Sesler ana siteden gelir (Diyanet kayıtları; egitim/src/lib/kimlik.ts ANA_SITE). `blob:` yalnız «Kendini sına»da çocuğun
  // kendi kaydını sayfa belleğinden çalmak içindir (2d); ağdan bir şey getirmez, başka köken eklenmedi.
  const APPS_SCRIPT = oku('src/scripts/hoca-ekrani.ts').match(/const GAS = '([^']+)'/)[1];
  const anaSite = oku('egitim/src/lib/kimlik.ts').match(/ANA_SITE = '([^']+)'/)[1];
  assert.deepEqual(yonerge['media-src'], ["'self'", anaSite, 'blob:']); // 'self': İlim Yolu kart seslendirmesi egitim Hosting'in kendi alanından çalar
  // connect-src: sayfa ve service worker yalnız kendi kökeninden ve ana siteden (ses) okur; «İnternetsiz çalışmak için kaydet» sesi fetch ile
  // indirip önbelleğe koyar (service worker aynı isteği kendisi de yapar). Başka köken, joker ve ws/wss yok.
  // Hesap (Dilim 0): Firestore, Kimlik Araç Seti, Token ve Apps Script (script.google.com → script.googleusercontent.com yönlendirmesi) kökenleri açık yazılır.
  assert.deepEqual(yonerge['connect-src'], ["'self'", anaSite, 'https://firestore.googleapis.com', 'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://europe-west1-ulucamii-portal.cloudfunctions.net', APPS_SCRIPT, 'https://script.googleusercontent.com']);
  // G-10: Apps Script yalnız TEK dağıtımın tam adresine açıktır (yol sabit); hoca ekranının GAS sabiti ve site.yaml'ın basvuru adresi aynı adrestir.
  // Dağıtım değişirse ikisi ve bu başlık birlikte güncellenir; yoksa hoca ekranı çevirisi/listesi CSP'ye takılır.
  assert.match(APPS_SCRIPT, /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/);
  assert.equal(oku('src/scripts/hoca-ekrani.ts').match(/const GAS = '([^']+)'/)[1], APPS_SCRIPT);
  assert.equal(oku('src/content/ayarlar/site.yaml').match(/^\s*basvuru:\s*"([^"]+)"/m)[1], APPS_SCRIPT);
  // Çevrim dışı çalışma: service worker yalnız aynı kökenden (/sw.js), uygulama bildirimi yalnız aynı kökenden. Üçü dışında CSP değişmedi.
  assert.deepEqual(Object.keys(yonerge).sort(), ['base-uri', 'connect-src', 'default-src', 'font-src', 'form-action', 'frame-ancestors', 'frame-src', 'img-src', 'manifest-src', 'media-src', 'object-src', 'script-src', 'style-src', 'worker-src']);
  assert.doesNotMatch(csp, /unsafe-|\*|data:|http:/);
  assert.equal(deger(genel, 'X-Content-Type-Options'), 'nosniff');
  assert.equal(deger(genel, 'Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(deger(genel, 'X-Frame-Options'), 'SAMEORIGIN');
  // Mikrofon yalnız sayfanın kendisine açıktır (2d: kendi sesini kaydet; izin yine kullanıcı dokunuşu ve tarayıcı penceresiyle);
  // kamera, konum, ödeme ve USB kapalı kalır.
  const izinler = deger(genel, 'Permissions-Policy');
  assert.match(izinler, /camera=\(\).*microphone=\(self\)/);
  for (const kapali of ['geolocation', 'payment', 'usb']) assert.match(izinler, new RegExp(`${kapali}=\\(\\)`), kapali);
  // HSTS'yi Firebase Hosting kendisi ekler (özel alan adında max-age=31556926; web.app'te ayrıca includeSubDomains;
  // preload) — ikinci kez yazılmaz.
  assert.equal(deger(genel, 'Strict-Transport-Security'), undefined);
});

test('Hosting: önbellek — HTML her açılışta doğrulanır, özetli dosyalar bir yıl, yazı tipleri bir hafta', () => {
  const kurallar = egitim.headers.filter((k) => deger(k, 'Cache-Control'));
  const beklenen = {
    '/': 'no-cache', '/tr/': 'no-cache', '/de/': 'no-cache', '/404.html': 'no-cache',
    // Service worker her açılışta sunucudan doğrulanır: tarayıcı 24 saatten uzun önbelleğe almasa da HTTP önbelleği yeni sürümü geciktirmesin.
    '/sw.js': 'no-cache',
    '/_astro/Taban.ABC123.css': 'public, max-age=31536000, immutable',
    '/_astro/index.astro_astro_type_script_index_0_lang.ABC.js': 'public, max-age=31536000, immutable',
    '/fonts/atkinson-next.woff2': 'public, max-age=604800',
    '/media/ses/okuma/yeni/zamir/uygulama/1.mp3': 'public, max-age=604800', // okuma tecvid + kısa âyet sesleri (o8, o9): bir hafta
    '/media/ses/kart/tr/ib-013.mp3': 'public, max-age=604800', // kart seslendirmesi: bir hafta (hatalı bir anlatım düzeltilirse en geç bir haftada herkese ulaşır)
    '/favicon.ico': undefined, '/og/ezber-kilimi-tr.png': undefined, '/robots.txt': undefined, // Hosting varsayılanı (1 saat)
    '/manifest.webmanifest': undefined, '/icon-192.png': undefined, '/icon-maskable-512.png': undefined,
  };
  for (const [yol, sure] of Object.entries(beklenen)) {
    const eslesen = kurallar.filter((k) => uyar(k, yol));
    assert.ok(eslesen.length <= 1, `${yol}: birden çok önbellek kuralı eşleşiyor`);
    assert.equal(eslesen[0] && deger(eslesen[0], 'Cache-Control'), sure, yol);
  }
});

const dist = (yol) => new URL(`egitim/dist/${yol}`, KOK);
const derlendi = existsSync(dist('index.html'));
// Çalışma sayfası olan her madde (src/lib/ezber/katalog.ts `calismaSayfasiVar`): ses, Kur'an metni, bilgi metni ya da sessiz kitap duasının metni.
const sesliler = JSON.parse(oku('src/data/ezber/katalog.json')).ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length || o.kuran || o.bilgiMetni || o.metinli);
// İlim Yolu ana sayfası, Ezber Kilimi girişi (ezber/), Çalışma Belgesi, Kilimim, ezber kartları ve ezber takvimi (25 Ekim 2026) ve her çalışma sayfası.
// İlim Yolu Dilim 2: bilgi yolları dizini, 13 yol, yerleştirme, rozetler ve her bilgi kartı (src/data/ilim-yolu/kartlar).
const KART_IDLERI = ['kuran', 'itikat', 'ibadet', 'siyer', 'ahlak'].flatMap((k) => JSON.parse(readFileSync(new URL(`src/data/ilim-yolu/kartlar/${k}.json`, KOK), 'utf8')).kartlar.map((c) => c.id));
const YOL_IDLERI = ['plan-kuran', 'plan-itikat', 'plan-ibadet', 'plan-siyer', 'plan-ahlak', ...['okuma', 'kuranBilgi', 'itikat', 'namaz', 'ibadet', 'siyer', 'ahlak'].map((a) => `alan-${a}`), 'bilgi'];
// Yeni Müslüman yolu (11 Kasım 2026): 12 hafta + 8 adım sayfası, kimlikler paylaşılan içerikten.
const YENI_YOL = JSON.parse(readFileSync(new URL('../../paylasilan/ogrenme-yolu/icerik.json', import.meta.url), 'utf8'));
const YENI_YOL_SAYFALARI = [...YENI_YOL.haftalar.map((h) => h.id), ...YENI_YOL.adimlar.map((a) => `adim-${a.no}`)];
const dilYollari = DILLER.flatMap((d) => [`${d}/`, `${d}/ezber/`, `${d}/calisma-belgesi/`, `${d}/kilimim/`, `${d}/kartlar/`, `${d}/takvim/`, `${d}/yollar/`, `${d}/yollar/rozetler/`, `${d}/yollar/yerlestirme/`, `${d}/ibadet/`, `${d}/ibadet/abdest/`, `${d}/ibadet/namaz/`, ...['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'].map((v) => `${d}/ibadet/namaz/${v}/`), `${d}/okuma/`, `${d}/yarisma/`, ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${d}/okuma/o${n}/`), ...YOL_IDLERI.map((y) => `${d}/yollar/${y}/`), `${d}/yollar/yeni-musluman/`, ...YENI_YOL_SAYFALARI.map((k) => `${d}/yollar/yeni-musluman/${k}/`), ...KART_IDLERI.map((i) => `${d}/ogren/${i}/`), ...sesliler.map((o) => `${d}/calis/${o.id}/`)]);
// Çevrim dışı çalışma sayfaları (noindex, site haritasında yok) satır içi betik denetimine girer: service worker bunları önyükler.
const cevrimdisiYollari = DILLER.map((d) => `${d}/cevrimdisi/`);
// Hesap sayfaları ve kart girişi (2 Kasım 2026): noindex, site haritasında ve önbellekte yok; yine de CSP’ye uyar (satır içi betik yok).
const hesapYollari = [...DILLER.flatMap((d) => [`${d}/hesap/`, `${d}/hesap/giris/`, `${d}/hesap/kayit/`]), 'k/'];
// Kur'an Okuma ders oturumu (okuma/bugun/) site haritasında yok ama CSP'ye uyar.
const SAYFALAR = ['index.html', '404.html', ...[...dilYollari, ...cevrimdisiYollari, ...hesapYollari, ...DILLER.map((d) => `${d}/okuma/bugun/`), ...DILLER.map((d) => `${d}/yarisma/oyna/`)].map((y) => `${y}index.html`)];

test('Derlenmiş sayfalarda satır içi betik, stil ve olay özniteliği yok (CSP)', { skip: !derlendi && 'önce npm run egitim:build' }, () => {
  for (const sayfa of SAYFALAR) {
    const html = readFileSync(dist(sayfa), 'utf8');
    assert.deepEqual(html.match(/<script(?![^>]*\ssrc=)[^>]*>/g), null, `${sayfa}: src'siz <script>`);
    assert.equal(/<style[\s>]/.test(html), false, `${sayfa}: <style>`);
    assert.equal(/<[^>]+\sstyle=/.test(html), false, `${sayfa}: style özniteliği`);
    assert.equal(/<[^>]+\son[a-z]+\s*=/i.test(html), false, `${sayfa}: olay özniteliği`);
    assert.equal(/javascript:/i.test(html), false, `${sayfa}: javascript: adresi`);
    assert.equal(/\s(src|href)="http:/.test(html), false, `${sayfa}: şifresiz http: kaynağı`);
  }
  // Kök yönlendirme dış betikle (src/scripts/kok-yonlendir.ts), dil listesi data-diller'da.
  const kok = readFileSync(dist('index.html'), 'utf8');
  assert.match(kok, /<html lang="tr" data-diller="tr fr en nl de">/);
  assert.match(kok, /<script type="module" src="\/_astro\/[^"]+\.js"><\/script>/);
});

test('Site haritası: beş dil sayfası ve hreflang; kök yönlendirme ve 404 yok; robots.txt gösterir', { skip: !derlendi && 'önce npm run egitim:build' }, () => {
  assert.match(readFileSync(dist('sitemap-index.xml'), 'utf8'), /<loc>https:\/\/egitim\.ulucamii\.be\/sitemap-0\.xml<\/loc>/);
  const harita = readFileSync(dist('sitemap-0.xml'), 'utf8');
  const adresler = [...harita.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, a]) => a).sort();
  // Dilim 4 geçişi: kurs sayfaları (5 dil × 5) ve basılı karekod sesli dersleri (73 + dizin; `test` kodu hariç) haritadadır; veli/hoca değildir.
  const kursHarita = DILLER.flatMap((d) => ['kurs/', 'kurs/mufredat/', 'kurs/yillik-plan/', 'kurs/materyaller/', 'kurs/gunluk/'].map((y) => `${d}/${y}`));
  const eHarita = ['e/', ...JSON.parse(oku('tests/fixtures/e-kodlari-basili.json')).kodlar.filter((k) => k !== 'test').map((k) => `e/${k}/`)];
  assert.deepEqual(adresler, [...dilYollari, ...kursHarita, ...eHarita].map((y) => `${SITE}/${y}`).sort());
  for (const url of harita.split('<url>').slice(1)) {
    const diller = [...url.matchAll(/hreflang="([^"]+)"/g)].map(([, h]) => h);
    // /e/ sayfaları tek dillidir (Fransızca) ve dil öneki taşımaz: hreflang kümesi yok.
    if (url.includes(`<loc>${SITE}/e/`)) assert.deepEqual(diller, [], 'e/: hreflang yok');
    else assert.deepEqual(diller, ['tr', 'fr-BE', 'en', 'nl-BE', 'de-BE', 'x-default']);
  }
  assert.match(oku('egitim/public/robots.txt'), /^Sitemap: https:\/\/egitim\.ulucamii\.be\/sitemap-index\.xml$/m);
});

// PNG başlığından genişlik ve yükseklik (IHDR).
const pngOlcu = (tampon) => {
  assert.equal(tampon.subarray(1, 4).toString('latin1'), 'PNG');
  return [tampon.readUInt32BE(16), tampon.readUInt32BE(20)];
};

test('Simgeler (kurs ambleminin iç dairesi) ve beş dilde paylaşım kartı', () => {
  const svg = oku('egitim/public/favicon.svg');
  assert.match(svg, /<svg[^>]*viewBox="[\d. ]+"/);
  assert.match(svg, /id="ic-halka"/); // iç halka ve merkez çizimi durur
  assert.doesNotMatch(svg, /ozgun-yazi-konturlari|id="dis-halka"|<script|<image|href="http/); // yazı halkası çıkarıldı; dış kaynak yok
  const ico = readFileSync(new URL('egitim/public/favicon.ico', KOK));
  assert.equal(ico.readUInt16LE(2), 1); // simge dosyası
  const boyutlar = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => {
    const girdi = 6 + 16 * i;
    const [en, boy] = pngOlcu(ico.subarray(ico.readUInt32LE(girdi + 12)));
    assert.equal(en, ico.readUInt8(girdi));
    assert.equal(boy, en);
    return en;
  });
  assert.deepEqual(boyutlar, [16, 32, 48]);
  assert.deepEqual(pngOlcu(readFileSync(new URL('egitim/public/apple-touch-icon.png', KOK))), [180, 180]);
  for (const dil of DILLER) {
    const yol = new URL(`egitim/public/og/ezber-kilimi-${dil}.png`, KOK);
    assert.deepEqual(pngOlcu(readFileSync(yol)), [1200, 630], dil);
    assert.ok(statSync(yol).size <= 300 * 1024, `${dil}: paylaşım kartı 300 KB'ı aşıyor (WhatsApp önizlemesi)`);
    if (derlendi) {
      const html = readFileSync(dist(`${dil}/index.html`), 'utf8');
      assert.match(html, new RegExp(`<meta property="og:image" content="${SITE}/og/ezber-kilimi-${dil}\\.png">`));
      assert.match(html, /<link rel="icon" href="\/favicon\.ico" sizes="32x32"><link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml"><link rel="apple-touch-icon" href="\/apple-touch-icon\.png">/);
    }
  }
});
