#!/usr/bin/env node
/** egitim.ulucamii.be canlı denetimi (salt okuma) — her Hosting yayınından sonra; çıktısı YAYIN-KAYITLARI kanıtıdır.
 *
 *    npm run egitim:canli -- https://egitim.ulucamii.be        (ya da https://ulucamii-egitim.web.app)
 *
 *  Denetler (27 Eylül 2026):
 *  - başlıklar: firebase.json'daki güvenlik başlıkları birebir, Hosting'in eklediği HSTS; önbellek (HTML no-cache,
 *    _astro bir yıl, yazı tipi bir hafta);
 *  - adresler: /tr → /tr/ (301), bilinmeyen adres 404 + beş dilli yol gösterici, robots.txt, site haritası,
 *    simgeler, beş paylaşım kartı; Faz 2'de site haritası sesli maddelerin beş dildeki çalışma sayfalarını da içerir;
 *  - tarayıcı: beş dilde sayfa CSP ihlali ve konsol hatası olmadan açılır, kök adres fr-BE tarayıcıyı /fr/'ye gönderir,
 *    bir çal düğmesi gerçek sesi ulucamii.be'den alır (200/206) ve çalmaya başlar. Bu denetimler service worker'sız (`serviceWorkers: 'block'`)
 *    bağlamda koşar: sayfa düzeyindeki ses olayları SW araya girince değişir; SW ayrı bir bölümde sınanır.
 *  - çevrim dışı çalışma (25 Ekim 2026): /sw.js (200, JavaScript, `no-cache`, güvenlik başlıkları, damgalı), uygulama bildirimi ve üç uygulama
 *    simgesi, beş dilin `/<dil>/cevrimdisi/` sayfası (noindex, site haritasında yok) ve GERÇEK tarayıcıda uçtan uca: SW kaydı → bir maddeyi kaydet
 *    (gerçek Diyanet sesi ulucamii.be'den CORS ile iner, tam 200 olarak saklanır) → internet kes → yeniden yükle (önbellekten açılır, ses önbellekten
 *    Range'e doğru 206 verir) → kayıtsız adres yedek sayfayı açar → sil. Kayıt denetim tarayıcısının kendi geçici profilindedir; sunucuya yazılan bir şey yok.
 *  Hiçbir şey yazmaz, giriş yapmaz. Çıkış kodu: 0 hepsi geçti · 1 en az biri düştü.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const girdi = process.argv[2];
if (!girdi) {
  console.error('Kullanım: npm run egitim:canli -- https://egitim.ulucamii.be');
  process.exit(2);
}
const KOK = new URL(girdi).origin;
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const katalog = JSON.parse(readFileSync(new URL('../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
// Çalışma sayfası olan her madde (src/lib/ezber/katalog.ts `calismaSayfasiVar`): ses, Kur'an metni, bilgi metni ya da sessiz kitap duasının metni (24 Ekim 2026).
// İlim Yolu (10 Kasım 2026): kart sayfaları (/ogren/<kart>/) ve yol sayfaları (/yollar/…) site haritasındadır; kimlikler depodaki kart verisinden ve derlenen yol klasörlerinden gelir.
const kartKimlikleri = readdirSync(new URL('../src/data/ilim-yolu/kartlar/', import.meta.url)).flatMap((d) => JSON.parse(readFileSync(new URL(`../src/data/ilim-yolu/kartlar/${d}`, import.meta.url), 'utf8')).kartlar.map((k) => k.id));
const yolSayfalari = readdirSync(new URL('../egitim/dist/tr/yollar/', import.meta.url), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
// Yeni Müslüman yolu (11 Kasım 2026): 12 hafta + 8 adım sayfası, kimlikler paylaşılan içerikten.
const yeniYol = JSON.parse(readFileSync(new URL('../paylasilan/ogrenme-yolu/icerik.json', import.meta.url), 'utf8'));
const yeniYolSayfalari = [...yeniYol.haftalar.map((h) => h.id), ...yeniYol.adimlar.map((a) => `adim-${a.no}`)];
const sesliler = katalog.ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length || o.kuran || o.bilgiMetni || o.metinli);
const bilgiOgeleri = katalog.ogeler.filter((o) => o.bilgiMetni);
const firebase = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8'));
const egitim = [firebase.hosting].flat().find((h) => h?.public === 'egitim/dist');
const GUVENLIK = egitim.headers.find((k) => k.source === '**').headers;

const sonuclar = [];
const kontrol = (ad, tamam, ayrinti = '') => sonuclar.push({ ad, tamam: Boolean(tamam), ayrinti });
const getir = (yol, secenek = {}) => fetch(new URL(yol, KOK), { redirect: 'manual', headers: { 'user-agent': 'UluCamii-CanliDenetim/1.0' }, ...secenek });

// 1) Başlıklar ve adresler
const sayfa = await getir('/tr/');
const html = await sayfa.text();
kontrol('/tr/ 200 ve HTML', sayfa.status === 200 && /text\/html/.test(sayfa.headers.get('content-type')), sayfa.status);
for (const { key, value } of GUVENLIK) kontrol(`/tr/ ${key}`, sayfa.headers.get(key) === value, sayfa.headers.get(key) ?? 'yok');
const hsts = sayfa.headers.get('strict-transport-security') ?? '';
kontrol('/tr/ HSTS (Hosting ekler)', /max-age=\d{7,}/.test(hsts), hsts || 'yok');
// İlim Yolu Dilim 0 (2 Kasım 2026): GUVENLIK artık firebase.json'dan gelen YENİ kümedir (SAMEORIGIN, frame-ancestors 'self', frame-src,
// apis.google.com, Firestore/Auth/Apps Script connect-src). Canlı site bu başlıkları ve /api/saglik yönlendirmesini ANCAK Dilim 1 yayınlanınca alır;
// ondan önce bu iki denetim canlıda düşer (beklenen). Önizleme kanalında önce sınanır.
const saglik = await getir('/api/saglik');
const saglikGovde = await saglik.json().catch(() => null);
kontrol('/api/saglik JSON {ok:true} (Cloud Function)', saglik.status === 200 && saglikGovde?.ok === true, `${saglik.status} ${JSON.stringify(saglikGovde)}`);
kontrol('/tr/ önbellek no-cache', sayfa.headers.get('cache-control') === 'no-cache', sayfa.headers.get('cache-control'));
for (const varlik of [...new Set(html.match(/\/_astro\/[^"]+\.(css|js)/g) ?? [])]) {
  const y = await getir(varlik);
  kontrol(`${varlik} bir yıl`, y.status === 200 && y.headers.get('cache-control') === 'public, max-age=31536000, immutable', `${y.status} ${y.headers.get('cache-control')}`);
}
const font = await getir('/fonts/atkinson-next.woff2');
kontrol('yazı tipi bir hafta', font.status === 200 && font.headers.get('cache-control') === 'public, max-age=604800', `${font.status} ${font.headers.get('cache-control')}`);
const yonlen = await getir('/tr');
kontrol('/tr → /tr/ (301)', yonlen.status === 301 && /\/tr\/$/.test(yonlen.headers.get('location') ?? ''), `${yonlen.status} ${yonlen.headers.get('location')}`);
const yok = await getir('/boyle-bir-sayfa-yok/');
kontrol('bilinmeyen adres 404 + yol gösterici', yok.status === 404 && (await yok.text()).includes('dil-yollari'), yok.status);
const kok = await getir('/');
kontrol('kök / 200, dil listesi', kok.status === 200 && (await kok.text()).includes('data-diller="tr fr en nl de"'), kok.status);
// Çevrim dışı çalışma: service worker, uygulama bildirimi, simgeler, yedek sayfalar.
const swYaniti = await getir('/sw.js');
const swMetni = await swYaniti.text();
kontrol('/sw.js 200 ve JavaScript', swYaniti.status === 200 && /javascript/.test(swYaniti.headers.get('content-type') ?? ''), `${swYaniti.status} ${swYaniti.headers.get('content-type')}`);
kontrol('/sw.js her açılışta doğrulanır (no-cache)', swYaniti.headers.get('cache-control') === 'no-cache', swYaniti.headers.get('cache-control') ?? 'yok');
for (const { key, value } of GUVENLIK) kontrol(`/sw.js ${key}`, swYaniti.headers.get(key) === value, swYaniti.headers.get(key) ?? 'yok');
kontrol('/sw.js yer tutucusuz ve damgalı', !swMetni.includes('__SURUM__') && /ezber-kabuk-/.test(swMetni) && /"[0-9a-f]{16}"/.test(swMetni), `${swMetni.length} bayt`);
const bildirimYaniti = await getir('/manifest.webmanifest');
const bildirim = await bildirimYaniti.json().catch(() => null);
kontrol('/manifest.webmanifest 200, kurulabilir uygulama alanları', bildirimYaniti.status === 200 && bildirim?.display === 'standalone' && bildirim?.start_url === '/' && bildirim?.scope === '/' &&
  bildirim?.theme_color === '#F6EEDF' && bildirim?.icons?.some((i) => i.purpose === 'maskable'), `${bildirimYaniti.status} ${bildirimYaniti.headers.get('content-type')}`);
for (const i of bildirim?.icons ?? []) {
  const y = await getir(i.src, { method: 'HEAD' });
  kontrol(`bildirim simgesi ${i.src}`, y.status === 200 && (i.type ? new RegExp(i.type.split('/')[1].split('+')[0]).test(y.headers.get('content-type') ?? '') : true), `${y.status} ${y.headers.get('content-type')}`);
}
for (const dil of DILLER) {
  // 12 Kasım 2026: her dil kendi bildirimini bağlar (Türkçe eski adresinde kaldı); dosyanın kendisi de denetlenir.
  const bildirimYolu = dil === 'tr' ? '/manifest.webmanifest' : `/manifest.${dil}.webmanifest`;
  const by = await getir(bildirimYolu);
  const b = await by.json().catch(() => null);
  kontrol(`${bildirimYolu} 200, dil ve başlangıç adresi`, by.status === 200 && b?.lang === dil && b?.scope === '/' && (dil === 'tr' ? b?.start_url === '/' : b?.start_url === `/${dil}/`), `${by.status} ${b?.lang ?? 'yok'} ${b?.start_url ?? 'yok'}`);
  const y = await getir(`/${dil}/cevrimdisi/`);
  const h = await y.text();
  kontrol(`/${dil}/cevrimdisi/ 200, noindex, manifest bağlantılı, no-cache`, y.status === 200 && /<meta name="robots" content="noindex, nofollow">/.test(h) && h.includes(`<link rel="manifest" href="${bildirimYolu}">`) &&
    y.headers.get('cache-control') === 'no-cache' && h.includes('data-cd-sayfa'), `${y.status} ${y.headers.get('cache-control')}`);
}
const robots = await getir('/robots.txt');
kontrol('robots.txt site haritasını gösterir', robots.status === 200 && (await robots.text()).includes('Sitemap: https://egitim.ulucamii.be/sitemap-index.xml'), robots.status);
const harita = await getir('/sitemap-0.xml');
const locs = [...(await harita.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, a]) => a).sort();
const beklenen = DILLER.flatMap((d) => [`https://egitim.ulucamii.be/${d}/`, `https://egitim.ulucamii.be/${d}/ezber/`, `https://egitim.ulucamii.be/${d}/calisma-belgesi/`, `https://egitim.ulucamii.be/${d}/kilimim/`, `https://egitim.ulucamii.be/${d}/kartlar/`, `https://egitim.ulucamii.be/${d}/takvim/`, `https://egitim.ulucamii.be/${d}/gizlilik/`, `https://egitim.ulucamii.be/${d}/yollar/`,
  ...['ibadet', 'ibadet/abdest', 'ibadet/namaz', ...['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'].map((v) => `ibadet/namaz/${v}`), 'okuma', 'yarisma', ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `okuma/o${n}`)].map((y) => `https://egitim.ulucamii.be/${d}/${y}/`),
  ...yolSayfalari.map((y) => `https://egitim.ulucamii.be/${d}/yollar/${y}/`),
  ...yeniYolSayfalari.map((k) => `https://egitim.ulucamii.be/${d}/yollar/yeni-musluman/${k}/`),
  ...kartKimlikleri.map((k) => `https://egitim.ulucamii.be/${d}/ogren/${k}/`),
  ...sesliler.map((o) => `https://egitim.ulucamii.be/${d}/calis/${o.id}/`)]).sort();
kontrol(`site haritası ${beklenen.length} adres`, harita.status === 200 && JSON.stringify(locs) === JSON.stringify(beklenen), `${harita.status}, ${locs.length} adres`);
// Kart seslendirmesi (12 Kasım 2026: beş dil): her dilde manifestten üç örnek — kart sayfasında oynatıcı düğmesi, MP3 200 + audio/mpeg, bayt ve sha256 manifestle aynı;
// manifestte sesi olmayan kartta (tecvid ku-044, tr dışı) düğme yok ve dosya 404. Tüm dosyaların tam doğrulaması: node scripts/egitim-ses-getir.mjs --hedef <geçici klasör>.
const sesManifest = JSON.parse(readFileSync(new URL('../src/data/ilim-yolu/kart-ses.json', import.meta.url), 'utf8'));
for (const d of DILLER) {
  const idler = Object.keys(sesManifest.kartlar).filter((id) => sesManifest.kartlar[id][d]);
  for (const id of [idler[0], idler[Math.floor(idler.length / 2)], idler.at(-1)]) {
    const k = sesManifest.kartlar[id][d];
    const sayfaY = await getir(`/${d}/ogren/${id}/`);
    const sayfaH = await sayfaY.text();
    const mp3 = await getir(`${sesManifest.taban}/${d}/${id}.mp3`);
    const govde = Buffer.from(await mp3.arrayBuffer());
    kontrol(`kart sesi ${d}/${id}: sayfada oynatıcı, MP3 200 audio/mpeg, bayt + sha256 manifestle aynı`,
      sayfaY.status === 200 && sayfaH.includes(`data-ses="${sesManifest.taban}/${d}/${id}.mp3"`) && mp3.status === 200 && /audio\/mpeg|audio\/mp3/.test(mp3.headers.get('content-type') ?? '')
      && govde.length === k.bayt && createHash('sha256').update(govde).digest('hex') === k.sha256, `${sayfaY.status}/${mp3.status} ${govde.length}`);
  }
}
for (const d of DILLER.filter((x) => x !== 'tr')) {
  const sayfaY = await getir(`/${d}/ogren/ku-044/`);
  const sayfaH = await sayfaY.text();
  const mp3 = await getir(`${sesManifest.taban}/${d}/ku-044.mp3`, { method: 'HEAD' });
  kontrol(`ku-044 ${d}: sesi yok, düğme yok, dosya 404 (imam onayı bekliyor)`, sayfaY.status === 200 && !sayfaH.includes('data-ses=') && mp3.status === 404, `${sayfaY.status}/${mp3.status}`);
}
// Hesap sayfaları ve kart girişi (2 Kasım 2026): 200, noindex, önbelleksiz; site haritasında yok (yukarıdaki eşitlik).
for (const yol of ['/tr/hesap/', '/tr/hesap/giris/', '/tr/hesap/kayit/', '/k/']) {
  const y = await getir(yol);
  const h = await y.text();
  kontrol(`${yol} 200, noindex, no-cache`, y.status === 200 && /<meta name="robots" content="noindex, nofollow">/.test(h) && y.headers.get('cache-control') === 'no-cache', `${y.status} ${y.headers.get('cache-control')}`);
}
// Gizlilik sayfası (11 Kasım 2026): dizine girer, kendi kanonik adresi, #ezber-kilimi çapası, tam metne bağlantı, yalnız cami hattı ve info@ (din görevlisinin telefonu yok).
for (const d of DILLER) {
  const y = await getir(`/${d}/gizlilik/`);
  const h = await y.text();
  kontrol(`/${d}/gizlilik/ 200, dizine girer, kanonik, çapa, tam metin bağlantısı, iletişim`, y.status === 200 && !/<meta name="robots" content="[^"]*noindex/.test(h)
    && h.includes(`<link rel="canonical" href="https://egitim.ulucamii.be/${d}/gizlilik/">`) && h.includes('id="ezber-kilimi"')
    && /href="https:\/\/ulucamii\.be\/[a-z]{2}\/[a-z-]+\/"/.test(h) && h.includes('info@ulucamii.be') && h.includes('+32 472 98 50 73'), `${y.status}`);
}
// Yeni Müslüman yolu: hafta sayfası 200; video yalnız tr/en'de ve tıklamadan önce iframe yok (CSP'ye uygun, üçüncü tarafa istek yok).
for (const d of DILLER) {
  const y = await getir(`/${d}/yollar/yeni-musluman/h01/`);
  const h = await y.text();
  const videoVar = /data-yy-video="?[\w-]{11}/.test(h);
  kontrol(`/${d}/yollar/yeni-musluman/h01/ 200, video ${d === 'tr' || d === 'en' ? 'var' : 'yok'}, iframe yok`, y.status === 200 && videoVar === (d === 'tr' || d === 'en') && !/<iframe/i.test(h), `${y.status} video=${videoVar}`);
}
for (const [yol, tur] of [['/favicon.ico', /icon/], ['/favicon.svg', /svg/], ['/apple-touch-icon.png', /png/],
  ['/icon-192.png', /png/], ['/icon-512.png', /png/], ['/icon-maskable-512.png', /png/],
  ...DILLER.map((d) => [`/og/ezber-kilimi-${d}.png`, /png/])]) {
  const y = await getir(yol, { method: 'HEAD' });
  kontrol(yol, y.status === 200 && tur.test(y.headers.get('content-type') ?? ''), `${y.status} ${y.headers.get('content-type')}`);
}

// 2) Tarayıcı: beş dil, kök yönlendirme, gerçek ses
const tarayici = await chromium.launch();
try {
  const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'tr-TR', serviceWorkers: 'block' });
  await baglam.addInitScript(() => {
    window.__ihlaller = [];
    addEventListener('securitypolicyviolation', (e) => window.__ihlaller.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  const s = await baglam.newPage();
  const hatalar = [];
  s.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  s.on('pageerror', (e) => hatalar.push(String(e)));
  for (const dil of DILLER) {
    hatalar.length = 0;
    // İlim Yolu ana sayfası (2 Kasım 2026: /dil/), Ezber Kilimi girişi (/dil/ezber/) ve hesap sayfaları (noindex): CSP ihlali ve konsol hatası olmamalı.
    for (const yol of ['', 'ezber/', 'hesap/giris/', 'hesap/kayit/', 'hesap/']) {
      hatalar.length = 0;
      await s.goto(`${KOK}/${dil}/${yol}`, { waitUntil: 'networkidle' });
      await s.evaluate(() => document.fonts.ready);
      if (yol === 'ezber/') await s.locator('.pano .karo.madde').first().hover();
      const ihlal = await s.evaluate(() => window.__ihlaller);
      const baslik = await s.locator('main h1').first().textContent();
      const noindex = yol.startsWith('hesap') ? (await s.locator('meta[name="robots"]').getAttribute('content'))?.includes('noindex') : true;
      kontrol(`/${dil}/${yol} tarayıcıda: CSP ihlali 0, konsol hatası 0${yol.startsWith('hesap') ? ', noindex' : ''}`, ihlal.length === 0 && hatalar.length === 0 && baslik && noindex,
        [baslik, ...ihlal, ...hatalar].join(' | '));
    }
  }
  // Gerçek ses: ilk çal düğmesi ulucamii.be'den sesi alır ve çalmaya başlar.
  await s.goto(`${KOK}/tr/ezber/`);
  const dugme = s.locator('button.dinle').first();
  const sesYaniti = s.waitForResponse((r) => r.url().startsWith('https://ulucamii.be/media/ses/'), { timeout: 20_000 }).catch(() => null);
  await dugme.click();
  const yanit = await sesYaniti;
  await s.waitForTimeout(2500);
  const durum = (await s.locator('[data-ses-durumu]').textContent())?.trim();
  const caliyor = await dugme.getAttribute('data-caliyor');
  const mp3 = await s.evaluate(() => new Audio().canPlayType('audio/mpeg'));
  kontrol('çal düğmesi: ses ulucamii.be\'den 200/206', yanit && [200, 206].includes(yanit.status()), yanit ? `${yanit.status()} ${yanit.url()}` : 'istek yok');
  kontrol('çal düğmesi: hata yok, çalıyor', !durum && (caliyor !== null || !mp3), `durum «${durum ?? ''}», çalıyor ${caliyor !== null}, mp3 ${mp3 || 'desteklenmiyor'}`);
  if (caliyor !== null) await dugme.click();
  kontrol('ses sırasında CSP ihlali 0', (await s.evaluate(() => window.__ihlaller)).length === 0);
  // Faz 2: çalışma sayfası ve aynı maddeyi koruyan dil geçişleri; yeni çalarda gerçek ses.
  hatalar.length = 0;
  const calismaYaniti = await s.goto(`${KOK}/tr/calis/s-fatiha/`);
  if (calismaYaniti?.status() === 200 && await s.locator('[data-calisma]').count()) {
    const dilYollari = await s.locator('.diller a').evaluateAll((a) => a.map((x) => x.pathname));
    kontrol('çalışma: dil değişimi maddeyi korur', JSON.stringify(dilYollari) === JSON.stringify(DILLER.map((d) => `/${d}/calis/s-fatiha/`)));
    const yanitBekle = s.waitForResponse((r) => r.url().startsWith('https://ulucamii.be/media/ses/'), { timeout: 20_000 }).catch(() => null);
    await s.locator('[data-hiz]').selectOption('0.75');
    await s.locator('[data-oynat]').click();
    const sesYanit = await yanitBekle;
    await s.waitForTimeout(1500);
    kontrol('çalışma: gerçek ses 200/206 ve hata yok', sesYanit && [200, 206].includes(sesYanit.status()) &&
      (await s.locator('[data-oynat]').textContent()) === 'Duraklatın' && hatalar.length === 0,
      sesYanit ? `${sesYanit.status()} ${sesYanit.url()}` : 'istek yok');
    await s.locator('[data-durdur]').click();
    kontrol('çalışma: CSP ihlali 0', (await s.evaluate(() => window.__ihlaller)).length === 0);
  } else kontrol('çalışma sayfası HTTP 200', false, calismaYaniti?.status() ?? 'yanıt yok');
  // Bilgi maddesi (24 Ekim 2026): kaynaklı liste sunucuda yazılı, çalışma bölümü açılır, «Göster» maddeyi açar, CSP/konsol temiz.
  if (bilgiOgeleri.length) {
    hatalar.length = 0;
    const bilgiYaniti = await s.goto(`${KOK}/tr/calis/${bilgiOgeleri[0].id}/`);
    const satirlar = await s.locator('section.bilgi > .bilgi-grup .bilgi-madde').count();
    const kaynak = await s.locator('.bilgi-kaynak li').count();
    await s.locator('[data-bilgi-kip]').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const ilk = s.locator('#bilgi-panel-gizle .bilgi-madde').first();
    const gizliMi = await ilk.locator('.bilgi-ad').isHidden().catch(() => false);
    await ilk.locator('.bilgi-ac').click().catch(() => {});
    const acildi = await ilk.locator('.bilgi-ad').isVisible().catch(() => false);
    kontrol(`bilgi: /tr/calis/${bilgiOgeleri[0].id}/ liste, kaynak, çalışma bölümü`, bilgiYaniti?.status() === 200 && satirlar > 0 && kaynak >= 2 && gizliMi && acildi && hatalar.length === 0 &&
      (await s.evaluate(() => window.__ihlaller)).length === 0, `${bilgiYaniti?.status()} · ${satirlar} satır · ${kaynak} kaynak · gizli ${gizliMi} · açıldı ${acildi} · ${hatalar.join(' | ')}`);
    for (const dil of ['tr', 'fr']) {
      const y = await getir(`/${dil}/calis/${bilgiOgeleri[0].id}/`);
      const h = await y.text();
      kontrol(`bilgi: /${dil}/ sayfa 200, kaynak satırı`, y.status === 200 && h.includes('bilgi-kaynak'), y.status);
    }
    const frHadis = await (await getir('/fr/calis/b-secme-hadisler/')).text();
    kontrol('bilgi: Fransızca künye iki noktadan önce bölünmez boşluk', frHadis.includes('Référence :'));
  }
  await baglam.close();
  // Kök yönlendirme: kayıtlı dil yok, tarayıcı fr-BE → /fr/.
  const fr = await tarayici.newContext({ locale: 'fr-BE', serviceWorkers: 'block' });
  const fs = await fr.newPage();
  await fs.goto(`${KOK}/`);
  await fs.waitForURL(/\/(tr|fr|en|nl|de)\/$/, { timeout: 10_000 }).catch(() => {});
  kontrol('kök yönlendirme fr-BE → /fr/', new URL(fs.url()).pathname === '/fr/', fs.url());
  await fr.close();

  // Çevrim dışı çalışma, gerçek tarayıcıda uçtan uca (service worker açık). Gerçek ses ulucamii.be'den CORS ile iner.
  const cd = await tarayici.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'tr-TR', serviceWorkers: 'allow' });
  await cd.addInitScript(() => {
    window.__ihlaller = [];
    addEventListener('securitypolicyviolation', (e) => window.__ihlaller.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  const c = await cd.newPage();
  const cdHatalar = [];
  c.on('pageerror', (e) => cdHatalar.push(String(e)));
  const durumOku = () => c.evaluate(async () => {
    const sonuc = {};
    for (const ad of await caches.keys()) {
      const onbellek = await caches.open(ad);
      sonuc[ad] = await Promise.all((await onbellek.keys()).map(async (i) => {
        const r = await onbellek.match(i);
        return { u: i.url, d: r.status, t: r.type, b: (await r.clone().arrayBuffer()).byteLength };
      }));
    }
    return sonuc;
  });
  try {
    await c.goto(`${KOK}/tr/calis/s-ihlas/`, { waitUntil: 'networkidle' });
    await c.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15_000 });
    const swBetik = await c.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL);
    kontrol('çevrim dışı: SW kayıtlı, sayfayı denetliyor', swBetik === `${KOK}/sw.js`, swBetik ?? 'kayıt yok');
    const kutu = c.locator('[data-cd]');
    await kutu.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    kontrol('çevrim dışı: kayıt kutusu görünür', await kutu.isVisible(), '');
    const veri = JSON.parse((await kutu.getAttribute('data-veri')) ?? '{}');
    await c.locator('[data-cd-dugme]').click();
    await c.locator('[data-cd-dugme][data-mod="sil"]').waitFor({ timeout: 60_000 }).catch(() => {});
    const kayitDurumu = await c.locator('[data-cd-dugme]').getAttribute('data-mod');
    const durum = (await c.locator('[data-cd-durum]').textContent())?.trim();
    kontrol("çevrim dışı: madde kaydedildi (gerçek ses ulucamii.be'den CORS ile indi)", kayitDurumu === 'sil', `${kayitDurumu} · ${durum}`);
    const o = await durumOku();
    const sesler = o['ezber-ses-v1'] ?? [];
    kontrol(`çevrim dışı: ${veri.sesler?.length ?? 0} ses tam 200 olarak saklandı (opak yok)`, sesler.length === (veri.sesler?.length ?? -1) && sesler.length > 0 && sesler.every((x) => x.d === 200 && x.t !== 'opaque' && x.b > 1000),
      sesler.map((x) => `${x.u.split('/').pop()}:${x.d}/${x.b}`).join(' '));
    await cd.setOffline(true);
    await c.reload();
    const baslik = await c.locator('h1').first().textContent();
    kontrol('çevrim dışı: kayıtlı sayfa internetsiz yeniden yüklenince önbellekten açılır', /İhlâs/.test(baslik ?? '') && (await c.locator('[data-cd-dugme]').getAttribute('data-mod')) === 'sil', baslik ?? '');
    const aralik = await c.evaluate(async (adres) => {
      const r = await fetch(adres, { headers: { Range: 'bytes=10-19' }, mode: 'cors' });
      return { d: r.status, cr: r.headers.get('content-range'), cl: r.headers.get('content-length'), ar: r.headers.get('accept-ranges'), b: (await r.arrayBuffer()).byteLength };
    }, veri.sesler[0]);
    kontrol("çevrim dışı: ses önbellekten Range'e 206 ve doğru başlıklarla yanıtlanır", aralik.d === 206 && /^bytes 10-19\/\d+$/.test(aralik.cr ?? '') && aralik.cl === '10' && aralik.ar === 'bytes' && aralik.b === 10, JSON.stringify(aralik));
    const calindi = await c.evaluate((adres) => new Promise((coz) => {
      const a = new Audio(adres);
      a.addEventListener('canplay', () => coz({ tamam: true, sure: a.duration }));
      a.addEventListener('error', () => coz({ tamam: false, hata: a.error?.code }));
      setTimeout(() => coz({ tamam: false, zaman: true }), 10_000);
      a.load();
    }), veri.sesler[0]);
    kontrol('çevrim dışı: ses öğesi önbellekten çalmaya hazır', calindi.tamam === true || !(await c.evaluate(() => new Audio().canPlayType('audio/mpeg'))), JSON.stringify(calindi));
    await c.goto(`${KOK}/tr/calis/s-fatiha/`);
    const yedekBaslik = await c.locator('h1').first().textContent();
    const listede = await c.locator('[data-cd-kayitlar] li a').allTextContents();
    kontrol('çevrim dışı: kayıtsız adres yedek sayfayı açar ve kayıtlı maddeyi listeler', yedekBaslik === 'Çevrim dışı çalışma' && listede.some((t) => /İhlâs/.test(t)) && await c.locator('[data-cd-istenen]').isVisible(), `${yedekBaslik} · ${listede.join(', ')}`);
    await cd.setOffline(false);
    await c.getByRole('button', { name: /^Bu cihazdaki kaydı sil(in)?: / }).click();
    await c.locator('[data-cd-bos]').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const son = await durumOku();
    kontrol('çevrim dışı: kayıt silinince ses ve künye önbellekten gider', (son['ezber-ses-v1'] ?? []).length === 0 && !(son['ezber-kayit-v1'] ?? []).some((x) => !x.u.endsWith('_yenilenen-surum')), '');
    const ihlaller = await c.evaluate(() => window.__ihlaller);
    kontrol('çevrim dışı: CSP ihlali 0, sayfa hatası 0', ihlaller.length === 0 && cdHatalar.length === 0, [...ihlaller, ...cdHatalar].join(' | '));
  } finally {
    await cd.close();
  }
} finally {
  await tarayici.close();
}

const dusen = sonuclar.filter((x) => !x.tamam);
for (const { ad, tamam, ayrinti } of sonuclar) console.log(`${tamam ? '✓' : '✗'} ${ad}${ayrinti !== '' ? ` — ${ayrinti}` : ''}`);
console.log(`\n${KOK}: ${sonuclar.length - dusen.length}/${sonuclar.length} denetim geçti (${new Date().toISOString()}).`);
process.exit(dusen.length ? 1 : 0);
