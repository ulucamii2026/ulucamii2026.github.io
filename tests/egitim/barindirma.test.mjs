/**
 * egitim.ulucamii.be barındırma yapılandırması ve derlenmiş çıktının CSP'ye uygunluğu (27 Eyl 2026). Neden:
 * firebase.json canlıya aittir. egitim sitesinin güvenlik başlıkları (CSP, nosniff…) ya da önbellek kuralları sessizce
 * gevşerse veya Firestore bloğu bozulursa bu yayından önce yakalanmalı. CSP satır içi betik ve stile izin vermez;
 * derlenmiş sayfada bir tane bile kalırsa canlıda sayfa bozulur (yerelde değil). Önbellekte HTML her açılışta
 * doğrulanmalı: eski HTML yayından sonra silinmiş `_astro` dosyalarını isterse sayfa stilsiz kalır. Site haritası,
 * simgeler ve paylaşım kartları da yayının parçasıdır.
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
  // Varsayılan davranış korunur: /tr → /tr/ (dizin dizini); yeniden yazma yok (404 sayfası gerçek 404 döner).
  for (const ad of ['trailingSlash', 'cleanUrls', 'rewrites', 'redirects', 'i18n']) assert.equal(egitim[ad], undefined, ad);
});

test('Hosting: bütün yanıtlarda sıkı CSP ve güvenlik başlıkları', () => {
  const genel = egitim.headers.find((k) => k.source === '**');
  const csp = deger(genel, 'Content-Security-Policy');
  const yonerge = Object.fromEntries(csp.split(';').map((y) => y.trim().split(/\s+/)).map(([ad, ...d]) => [ad, d]));
  assert.deepEqual(yonerge['default-src'], ["'none'"]);
  for (const ad of ['script-src', 'style-src', 'img-src', 'font-src', 'connect-src']) assert.deepEqual(yonerge[ad], ["'self'"], ad);
  for (const ad of ['base-uri', 'form-action', 'frame-ancestors', 'object-src']) assert.deepEqual(yonerge[ad], ["'none'"], ad);
  // Sesler ana siteden gelir (Diyanet kayıtları; egitim/src/lib/kimlik.ts ANA_SITE).
  const anaSite = oku('egitim/src/lib/kimlik.ts').match(/ANA_SITE = '([^']+)'/)[1];
  assert.deepEqual(yonerge['media-src'], [anaSite]);
  assert.doesNotMatch(csp, /unsafe-|\*|data:|http:/);
  assert.equal(deger(genel, 'X-Content-Type-Options'), 'nosniff');
  assert.equal(deger(genel, 'Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(deger(genel, 'X-Frame-Options'), 'DENY');
  assert.match(deger(genel, 'Permissions-Policy'), /camera=\(\).*microphone=\(\)/);
  // HSTS'yi Firebase Hosting kendisi ekler (özel alan adında max-age=31556926; web.app'te ayrıca includeSubDomains;
  // preload) — ikinci kez yazılmaz.
  assert.equal(deger(genel, 'Strict-Transport-Security'), undefined);
});

test('Hosting: önbellek — HTML her açılışta doğrulanır, özetli dosyalar bir yıl, yazı tipleri bir hafta', () => {
  const kurallar = egitim.headers.filter((k) => deger(k, 'Cache-Control'));
  const beklenen = {
    '/': 'no-cache', '/tr/': 'no-cache', '/de/': 'no-cache', '/404.html': 'no-cache',
    '/_astro/Taban.ABC123.css': 'public, max-age=31536000, immutable',
    '/_astro/index.astro_astro_type_script_index_0_lang.ABC.js': 'public, max-age=31536000, immutable',
    '/fonts/atkinson-next.woff2': 'public, max-age=604800',
    '/favicon.ico': undefined, '/og/ezber-kilimi-tr.png': undefined, '/robots.txt': undefined, // Hosting varsayılanı (1 saat)
  };
  for (const [yol, sure] of Object.entries(beklenen)) {
    const eslesen = kurallar.filter((k) => uyar(k, yol));
    assert.ok(eslesen.length <= 1, `${yol}: birden çok önbellek kuralı eşleşiyor`);
    assert.equal(eslesen[0] && deger(eslesen[0], 'Cache-Control'), sure, yol);
  }
});

const dist = (yol) => new URL(`egitim/dist/${yol}`, KOK);
const derlendi = existsSync(dist('index.html'));
const SAYFALAR = ['index.html', '404.html', ...DILLER.map((d) => `${d}/index.html`)];

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
  assert.deepEqual(adresler, DILLER.map((d) => `${SITE}/${d}/`).sort());
  for (const url of harita.split('<url>').slice(1)) {
    const diller = [...url.matchAll(/hreflang="([^"]+)"/g)].map(([, h]) => h);
    assert.deepEqual(diller, ['tr', 'fr-BE', 'en', 'nl-BE', 'de-BE', 'x-default']);
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
