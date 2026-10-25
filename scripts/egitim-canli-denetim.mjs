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
import { readFileSync } from 'node:fs';
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
  bildirim?.theme_color === '#134420' && bildirim?.icons?.some((i) => i.purpose === 'maskable'), `${bildirimYaniti.status} ${bildirimYaniti.headers.get('content-type')}`);
for (const i of bildirim?.icons ?? []) {
  const y = await getir(i.src, { method: 'HEAD' });
  kontrol(`bildirim simgesi ${i.src}`, y.status === 200 && (i.type ? new RegExp(i.type.split('/')[1].split('+')[0]).test(y.headers.get('content-type') ?? '') : true), `${y.status} ${y.headers.get('content-type')}`);
}
for (const dil of DILLER) {
  const y = await getir(`/${dil}/cevrimdisi/`);
  const h = await y.text();
  kontrol(`/${dil}/cevrimdisi/ 200, noindex, manifest bağlantılı, no-cache`, y.status === 200 && /<meta name="robots" content="noindex, nofollow">/.test(h) && h.includes('<link rel="manifest" href="/manifest.webmanifest">') &&
    y.headers.get('cache-control') === 'no-cache' && h.includes('data-cd-sayfa'), `${y.status} ${y.headers.get('cache-control')}`);
}
const robots = await getir('/robots.txt');
kontrol('robots.txt site haritasını gösterir', robots.status === 200 && (await robots.text()).includes('Sitemap: https://egitim.ulucamii.be/sitemap-index.xml'), robots.status);
const harita = await getir('/sitemap-0.xml');
const locs = [...(await harita.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, a]) => a).sort();
const beklenen = DILLER.flatMap((d) => [`https://egitim.ulucamii.be/${d}/`, `https://egitim.ulucamii.be/${d}/calisma-belgesi/`, `https://egitim.ulucamii.be/${d}/kilimim/`, `https://egitim.ulucamii.be/${d}/kartlar/`,
  ...sesliler.map((o) => `https://egitim.ulucamii.be/${d}/calis/${o.id}/`)]).sort();
kontrol(`site haritası ${beklenen.length} adres`, harita.status === 200 && JSON.stringify(locs) === JSON.stringify(beklenen), `${harita.status}, ${locs.length} adres`);
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
    await s.goto(`${KOK}/${dil}/`, { waitUntil: 'networkidle' });
    await s.evaluate(() => document.fonts.ready);
    await s.locator('.pano .karo.madde').first().hover();
    const ihlal = await s.evaluate(() => window.__ihlaller);
    const baslik = await s.locator('main h1').textContent();
    kontrol(`/${dil}/ tarayıcıda: CSP ihlali 0, konsol hatası 0`, ihlal.length === 0 && hatalar.length === 0 && baslik,
      [baslik, ...ihlal, ...hatalar].join(' | '));
  }
  // Gerçek ses: ilk çal düğmesi ulucamii.be'den sesi alır ve çalmaya başlar.
  await s.goto(`${KOK}/tr/`);
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
      (await s.locator('[data-oynat]').textContent()) === 'Duraklat' && hatalar.length === 0,
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
    await c.getByRole('button', { name: /^Bu cihazdaki kaydı sil: / }).click();
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
