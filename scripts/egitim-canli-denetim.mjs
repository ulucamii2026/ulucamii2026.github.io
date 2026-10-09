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
 *    bir çal düğmesi gerçek sesi ulucamii.be'den alır (200/206) ve çalmaya başlar.
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
const sesliler = katalog.ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length);
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
const robots = await getir('/robots.txt');
kontrol('robots.txt site haritasını gösterir', robots.status === 200 && (await robots.text()).includes('Sitemap: https://egitim.ulucamii.be/sitemap-index.xml'), robots.status);
const harita = await getir('/sitemap-0.xml');
const locs = [...(await harita.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, a]) => a).sort();
const beklenen = DILLER.flatMap((d) => [`https://egitim.ulucamii.be/${d}/`,
  ...sesliler.map((o) => `https://egitim.ulucamii.be/${d}/calis/${o.id}/`)]).sort();
kontrol(`site haritası ${beklenen.length} adres`, harita.status === 200 && JSON.stringify(locs) === JSON.stringify(beklenen), `${harita.status}, ${locs.length} adres`);
for (const [yol, tur] of [['/favicon.ico', /icon/], ['/favicon.svg', /svg/], ['/apple-touch-icon.png', /png/],
  ...DILLER.map((d) => [`/og/ezber-kilimi-${d}.png`, /png/])]) {
  const y = await getir(yol, { method: 'HEAD' });
  kontrol(yol, y.status === 200 && tur.test(y.headers.get('content-type') ?? ''), `${y.status} ${y.headers.get('content-type')}`);
}

// 2) Tarayıcı: beş dil, kök yönlendirme, gerçek ses
const tarayici = await chromium.launch();
try {
  const baglam = await tarayici.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'tr-TR' });
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
  await baglam.close();
  // Kök yönlendirme: kayıtlı dil yok, tarayıcı fr-BE → /fr/.
  const fr = await tarayici.newContext({ locale: 'fr-BE' });
  const fs = await fr.newPage();
  await fs.goto(`${KOK}/`);
  await fs.waitForURL(/\/(tr|fr|en|nl|de)\/$/, { timeout: 10_000 }).catch(() => {});
  kontrol('kök yönlendirme fr-BE → /fr/', new URL(fs.url()).pathname === '/fr/', fs.url());
  await fr.close();
} finally {
  await tarayici.close();
}

const dusen = sonuclar.filter((x) => !x.tamam);
for (const { ad, tamam, ayrinti } of sonuclar) console.log(`${tamam ? '✓' : '✗'} ${ad}${ayrinti !== '' ? ` — ${ayrinti}` : ''}`);
console.log(`\n${KOK}: ${sonuclar.length - dusen.length}/${sonuclar.length} denetim geçti (${new Date().toISOString()}).`);
process.exit(dusen.length ? 1 : 0);
