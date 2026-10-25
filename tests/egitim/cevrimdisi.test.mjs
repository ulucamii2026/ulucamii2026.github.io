/**
 * egitim.ulucamii.be çevrim dışı çalışma ve ana ekrana ekleme (25 Ekim 2026) — saf kütüphane, beş dilli metinler ve derlenmiş çıktı.
 * Neden: service worker'ın kararları (bayt aralığı, hangi dosya önbelleğe girer, hangi sayfa kaydedilebilir) tarayıcıda hata vermeden yanlış
 * davranabilir; yanlış bir 206 ya da 416 ses çalarını çevrim dışı sessizce susturur. Derlenmiş çıktıda: sw.js yer tutucusuz ve damgalı, damga
 * yeniden hesaplanınca aynı, önyüklenen sayfaların hepsi derlemede var, her sayfa manifest ve tema rengiyle bağlı, simgeler doğru boyutta,
 * her madde sayfasındaki kayıt kutusu kataloğun ses yollarını ve yalnız onları taşır, `_astro` dosyalarının atıfları eksiksiz çözülür.
 * Önce `npm run egitim:build` (test:egitim bu sırayla çalışır).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/egitim-cevrimdisi-test.mjs');
await build({
  stdin: {
    contents: [
      'export * from "./egitim/src/lib/cevrimdisi-ortak.ts";',
      'export { cevrimdisiMetinleri } from "./egitim/src/i18n/cevrimdisi.ts";',
      'export { fransizTipografi } from "./egitim/src/i18n/metinler.ts";',
      'export { sesYollari } from "./src/lib/ezber/cevrimdisi.ts";',
      'export { KATALOG, calismaSayfasiVar } from "./src/lib/ezber/katalog.ts";',
    ].join('\n'),
    resolveDir: process.cwd(),
  },
  alias: { '@ortak': './src' },
  outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(cikti).href);
const damga = await import(pathToFileURL(resolve('scripts/egitim-sw.mjs')).href);

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const DIST = resolve('egitim/dist');
const derlendi = existsSync(join(DIST, 'index.html'));
const atla = !derlendi && 'önce npm run egitim:build';
const dosya = (yol) => join(DIST, ...yol.split('/').filter(Boolean));

// ——— aralikCoz: ses çalarının istediği bayt aralıkları ———
test('aralikCoz: bytes=a-b, a-, -n; son dâhildir ve boyutu aşmaz', () => {
  assert.deepEqual(m.aralikCoz('bytes=0-9', 100), { bas: 0, son: 9 });
  assert.deepEqual(m.aralikCoz('bytes=10-19', 34062), { bas: 10, son: 19 });
  assert.deepEqual(m.aralikCoz('bytes=90-', 100), { bas: 90, son: 99 });
  assert.deepEqual(m.aralikCoz('bytes=90-500', 100), { bas: 90, son: 99 });
  assert.deepEqual(m.aralikCoz('bytes=-10', 100), { bas: 90, son: 99 });
  assert.deepEqual(m.aralikCoz('bytes=-500', 100), { bas: 0, son: 99 });
  assert.deepEqual(m.aralikCoz('bytes=0-0', 100), { bas: 0, son: 0 });
  assert.deepEqual(m.aralikCoz(' bytes=5-6 ', 100), { bas: 5, son: 6 });
});

test('aralikCoz: karşılanamayan aralık → gecersiz (416); anlamsız ya da çoklu aralık, başlık yok → null (tam yanıt)', () => {
  for (const b of ['bytes=100-', 'bytes=100-200', 'bytes=50-10', 'bytes=-0']) assert.equal(m.aralikCoz(b, 100), 'gecersiz', b);
  for (const b of ['bytes=0-1,5-6', 'bytes=-', 'bytes=', 'items=0-5', 'bytes=a-b', '', null, undefined]) assert.equal(m.aralikCoz(b, 100), null, String(b));
  assert.equal(m.aralikCoz('bytes=0-0', 0), 'gecersiz'); // boş dosyadan bayt istenemez
});

test('sesTuru: audio/mp3 → audio/mpeg (iOS Safari standart ister); başlık yoksa audio/mpeg; diğer türler olduğu gibi', () => {
  assert.equal(m.sesTuru('audio/mp3'), 'audio/mpeg');
  assert.equal(m.sesTuru('Audio/MP3; charset=x'), 'audio/mpeg');
  assert.equal(m.sesTuru(null), 'audio/mpeg');
  assert.equal(m.sesTuru(''), 'audio/mpeg');
  assert.equal(m.sesTuru('audio/mpeg'), 'audio/mpeg');
  assert.equal(m.sesTuru('audio/ogg'), 'audio/ogg');
});

// ——— dil ve yol kararları ———
test('dilSec: önce adresteki dil, sonra tarayıcının dil sırası, yoksa İngilizce', () => {
  assert.equal(m.dilSec('/de/calis/s-ihlas/', 'fr-BE,fr;q=0.9'), 'de');
  assert.equal(m.dilSec('/nl/', null), 'nl');
  assert.equal(m.dilSec('/', 'fr-BE,fr;q=0.9,en;q=0.8'), 'fr');
  assert.equal(m.dilSec('/bilinmeyen/', 'tr-TR,tr;q=0.9'), 'tr');
  assert.equal(m.dilSec('/', 'ja-JP,ja;q=0.9'), 'en');
  assert.equal(m.dilSec('/', undefined), 'en');
  assert.equal(m.dilSec('/_astro/x.js', 'de-DE'), 'de');
});

test('kaydedilebilirYolMu: yalnız beş dilin sayfaları; dosya, üst dizin, büyük harf, dış ve boş yol reddedilir', () => {
  for (const y of ['/tr/', '/fr/kartlar/', '/en/calis/s-ihlas/', '/de/calis/b-secme-hadisler/', '/nl/cevrimdisi/']) assert.equal(m.kaydedilebilirYolMu(y), true, y);
  for (const y of ['/', '', '/xx/calis/s-ihlas/', '/tr/calis/s-ihlas', '/tr/calis/../', '/tr/%2e%2e/', '/tr//', '//evil.example/tr/', '/tr/Calis/', '/_astro/a.js', '/sw.js', '/tr/calis/s-ihlas/?x=1', 'https://ulucamii.be/tr/', '/tr/calis/s ihlas/'])
    assert.equal(m.kaydedilebilirYolMu(y), false, y);
});

test('statikMi: yapı dosyaları, yazı tipleri, logo ve simgeler; sayfa, sw.js, manifest ve ses değil', () => {
  for (const y of ['/_astro/Taban.abc.css', '/fonts/atkinson-next.woff2', '/logo/kuran-kursu-yatay.svg', '/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png'])
    assert.equal(m.statikMi(y), true, y);
  for (const y of ['/', '/tr/', '/sw.js', '/manifest.webmanifest', '/og/ezber-kilimi-tr.png', '/robots.txt', '/media/ses/ayet/112-1.mp3', '/sitemap-0.xml'])
    assert.equal(m.statikMi(y), false, y);
});

test('sesAdresiMi: yalnız ulucamii.be/media/ses/; başka köken, başka yol ve egitim sitesinin kendisi hayır', () => {
  const u = (a) => new URL(a);
  assert.equal(m.sesAdresiMi(u('https://ulucamii.be/media/ses/ayet/112-1.mp3')), true);
  assert.equal(m.sesAdresiMi(u('https://ulucamii.be/media/ses/sureler/ihlas.mp3?x=1')), true);
  for (const a of ['https://ulucamii.be/media/video/a.mp4', 'https://ulucamii.be/tr/', 'https://evil.example/media/ses/a.mp3', 'http://ulucamii.be/media/ses/a.mp3', 'https://egitim.ulucamii.be/media/ses/a.mp3', 'https://ulucamii.be.evil.example/media/ses/a.mp3'])
    assert.equal(m.sesAdresiMi(u(a)), false, a);
});

test('Kayıt anahtarları: gidiş dönüş, yalnız geçerli dil ve madde kimliği; sürüm işareti künye sayılmaz; sayfa anahtarı sorgusuzdur', () => {
  assert.equal(m.kayitAnahtari('tr', 's-ihlas'), '/cevrimdisi-kayit/tr/s-ihlas');
  assert.equal(m.kayitAnahtariMi(m.kayitAnahtari('fr', 'd-amentu')), true);
  for (const y of [m.YENILENEN_SURUM, '/cevrimdisi-kayit/xx/s-ihlas', '/cevrimdisi-kayit/tr/', '/cevrimdisi-kayit/tr/S-IHLAS', '/tr/calis/s-ihlas/', '/cevrimdisi-kayit/tr/a/b'])
    assert.equal(m.kayitAnahtariMi(y), false, y);
  assert.equal(m.sayfaAnahtari(new URL('https://egitim.ulucamii.be/tr/kartlar/?sec=s-ihlas#a')), 'https://egitim.ulucamii.be/tr/kartlar/');
  assert.deepEqual([...m.DILLER], DILLER);
  assert.deepEqual([...m.ONYUKLEME_SAYFALARI], ['/', ...DILLER.map((d) => `/${d}/cevrimdisi/`)]);
  assert.equal(m.cevrimdisiYolu('de'), '/de/cevrimdisi/');
});

test('varlikAdresleri: HTML href/src, CSS url(), JS dinamik içe aktarma ve Vite yükleme listesi; yalnız aynı kökenin statik dosyaları', () => {
  const html = '<link rel="stylesheet" href="/_astro/a.css"><script type="module" src="/_astro/b.js"></script><a href="/tr/kartlar/">k</a><a href="https://ulucamii.be/tr/">u</a>'
    + '<link rel="alternate" href="https://egitim.ulucamii.be/tr/"><meta property="og:image" content="https://egitim.ulucamii.be/og/ezber-kilimi-tr.png"><img src="/logo/kuran-kursu-yatay.svg"><link rel="preload" href="/fonts/atkinson-next.woff2">';
  assert.deepEqual(m.varlikAdresleri('html', html, '/tr/'), ['/_astro/a.css', '/_astro/b.js', '/fonts/atkinson-next.woff2', '/logo/kuran-kursu-yatay.svg']);
  assert.deepEqual(m.varlikAdresleri('css', '@font-face{src:url(/fonts/a.woff2) format("woff2")}.x{background:url("../logo/b.svg")}.y{background:url(data:image/png;base64,AAA)}', '/_astro/Taban.css'), ['/fonts/a.woff2', '/logo/b.svg']);
  assert.deepEqual(m.varlikAdresleri('js', 'import("./kip-sina.AbC.js");import("/_astro/kip-oyun.js");const d=["_astro/kip-x.js","_astro/c.css"];const s="https://evil.example/_astro/z.js";', '/_astro/ana.js'),
    ['/_astro/c.css', '/_astro/kip-oyun.js', '/_astro/kip-sina.AbC.js', '/_astro/kip-x.js']);
  assert.deepEqual(m.varlikAdresleri('html', '<a href="javascript:alert(1)">x</a><img src="data:image/png;base64,AA">', '/tr/'), []);
});

// ——— beş dilli metinler ———
const anahtarlar = Object.keys(m.cevrimdisiMetinleri('tr'));
const yerTutucular = (s) => [...s.matchAll(/\{(\w+)\}/g)].map(([, a]) => a).sort().join(',');

test('Metinler: beş dilde aynı anahtarlar, hepsi dolu; yer tutucular dillerde aynı; kayıt düğmesi istenen söz', () => {
  assert.ok(anahtarlar.length >= 40);
  assert.equal(m.cevrimdisiMetinleri('tr').kaydet, 'İnternetsiz çalışmak için kaydet');
  for (const dil of DILLER) {
    const t = m.cevrimdisiMetinleri(dil);
    assert.deepEqual(Object.keys(t), anahtarlar, dil);
    for (const k of anahtarlar) {
      assert.equal(typeof t[k], 'string', `${dil}.${k}`);
      assert.ok(t[k].trim().length > 1, `${dil}.${k} boş`);
      assert.equal(yerTutucular(t[k]), yerTutucular(m.cevrimdisiMetinleri('tr')[k]), `${dil}.${k}: yer tutucular tr ile aynı olmalı`);
    }
  }
});

test('Metinler: dillerin metni birbirinin kopyası değil (çevrilmemiş alan yok); Fransızca tipografi uygulanmış; yasak simge yok', () => {
  for (const k of anahtarlar) {
    if (['sil'].includes(k)) continue; // kısa sözcükler dillerde örtüşebilir
    const farkli = new Set(DILLER.map((d) => m.cevrimdisiMetinleri(d)[k]));
    assert.ok(farkli.size >= 4, `${k}: ${farkli.size} farklı çeviri`);
  }
  const fr = m.cevrimdisiMetinleri('fr');
  for (const k of anahtarlar) {
    assert.equal(m.fransizTipografi(fr[k]), fr[k], `fr.${k}: tipografi tekrar uygulanınca değişmemeli`);
    assert.doesNotMatch(fr[k], /\S[:;?!]( |$)/, `fr.${k}: noktalama öncesi boşluk yok`);
  }
  for (const dil of DILLER) for (const k of anahtarlar) assert.doesNotMatch(m.cevrimdisiMetinleri(dil)[k], /[❤♥\u{1F49B}-\u{1F49F}\u{1F90D}-\u{1F90E}\u{1F64F}]|\p{Extended_Pictographic}/u, `${dil}.${k}: kalp, emoji ya da katlanmış el`);
});

test('Metinler: gizlilik dört şeyi söyler — yalnız bu tarayıcıda, kişisel veri yok, silinebilir, önce bir kez internetle açılmalı', () => {
  const beklenen = {
    tr: [/yalnız bu tarayıcının/, /kişisel veri içermez/, /silebilirsiniz/, /en az bir kez/],
    fr: [/uniquement dans le cache de ce navigateur/, /sans donnée personnelle/, /supprimer/, /au moins une fois/],
    en: [/only in this browser/, /no personal data/, /delete/, /at least once/],
    nl: [/alleen in de cache van deze browser/, /geen persoonsgegevens/, /verwijderen/, /minstens één keer/],
    de: [/nur im Cache dieses Browsers/, /keine personenbezogenen Daten/, /löschen/, /mindestens einmal/],
  };
  for (const dil of DILLER) for (const re of beklenen[dil]) assert.match(m.cevrimdisiMetinleri(dil).gizlilikMetni, re, `${dil}: ${re}`);
});

// ——— derlenmiş çıktı ———
const tumHtml = (klasor = DIST) => readdirSync(klasor, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tumHtml(join(klasor, e.name)) : e.name.endsWith('.html') ? [join(klasor, e.name)] : []));

test('dist/sw.js: yer tutucusuz, damgalı (yeniden hesaplanınca aynı), kalıcı önbellek adları, depolama ve dış kaynak yok', { skip: atla }, async () => {
  const sw = readFileSync(dosya('sw.js'), 'utf8');
  assert.equal(sw.includes('__SURUM__'), false);
  const hesap = await damga.damgaHesapla(DIST);
  assert.match(hesap, /^[0-9a-f]{16}$/);
  assert.ok(sw.includes(hesap), 'SW damgası derleme çıktısından yeniden hesaplananla aynı olmalı');
  for (const ad of ['ezber-kabuk-', 'ezber-ses-v1', 'ezber-kayit-v1']) assert.ok(sw.includes(ad), ad);
  assert.ok(!/localStorage|sessionStorage|importScripts|eval\(|new Function/.test(sw), "SW depolama ya da dinamik kod kullanıyor");
  // Tek gerçek köken ulucamii.be (ses); varlik.invalid yalnız göreli adresleri çözmek için kullanılan sahte taban, ağa gitmez.
  assert.deepEqual([...new Set(sw.match(/https?:\/\/[a-z0-9.-]+/g) ?? [])].sort(), ['https://ulucamii.be', 'https://varlik.invalid']);
  assert.ok(statSync(dosya('sw.js')).size < 40 * 1024, 'SW 40 KB’ı aşmamalı');
});

test('Önyüklenen sayfalar derlemede var ve gerçek sayfadır (kök, beş dilin çevrim dışı sayfası)', { skip: atla }, () => {
  for (const u of m.ONYUKLEME_SAYFALARI) {
    const html = readFileSync(join(dosya(u), 'index.html'), 'utf8');
    assert.ok(/<html lang="[a-z]{2}(-[A-Z]{2})?"/.test(html), u);
    if (u !== '/') {
      const dil = u.split('/')[1];
      assert.ok(new RegExp(`<html lang="${dil}(-[A-Z]{2})?" dir="ltr" data-dil="${dil}"`).test(html), u);
      assert.ok(/data-cd-sayfa/.test(html), u);
      assert.ok(/<meta name="robots" content="noindex, nofollow">/.test(html), u);
      assert.ok(!/data-cd-kayitlar[^>]*>\s*<li/.test(html), `${u}: kayıt listesi derlemede boş olmalı (içerik tarayıcıda cihazdan gelir)`);
    }
  }
});

test('Her sayfa manifest ve tema rengiyle bağlı; manifest alanları, kapsamı ve simgeleri doğru', { skip: atla }, () => {
  const sayfalar = tumHtml();
  assert.ok(sayfalar.length > 350, `yalnız ${sayfalar.length} sayfa`);
  const manifest = JSON.parse(readFileSync(dosya('manifest.webmanifest'), 'utf8'));
  // Kök (/) yalnız dile yönlendiren ince sayfadır (Taban kullanmaz); uygulama dil sayfalarından kurulur, başlangıç adresi `/` yönlendirmeyle dile gider.
  for (const s of sayfalar.filter((x) => x !== join(DIST, 'index.html'))) {
    const html = readFileSync(s, 'utf8');
    assert.equal(html.split('<link rel="manifest" href="/manifest.webmanifest">').length - 1, 1, `${s}: manifest bağlantısı`);
    assert.ok(new RegExp(`<meta name="theme-color" content="${manifest.theme_color}">`).test(html), `${s}: tema rengi`);
  }
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.id, '/');
  assert.equal(manifest.theme_color, '#134420');
  assert.equal(manifest.background_color, '#134420');
  assert.ok(manifest.name.length > manifest.short_name.length && manifest.short_name.length <= 12);
  assert.ok(manifest.lang && manifest.description);
  const png = (yol) => { const t = readFileSync(dosya(yol)); assert.equal(t.subarray(1, 4).toString('latin1'), 'PNG', yol); return [t.readUInt32BE(16), t.readUInt32BE(20)]; };
  const kaynakli = manifest.icons.filter((i) => i.type === 'image/png');
  assert.ok(kaynakli.some((i) => i.sizes === '192x192' && i.purpose === 'any'));
  assert.ok(kaynakli.some((i) => i.sizes === '512x512' && i.purpose === 'any'));
  assert.ok(kaynakli.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'));
  for (const i of manifest.icons) {
    assert.ok(existsSync(dosya(i.src)), `${i.src} yok`);
    if (i.type === 'image/png') assert.deepEqual(png(i.src), i.sizes.split('x').map(Number), i.src);
  }
});

test('Her madde sayfasındaki kayıt kutusu: JS yokken gizli; yol, ad ve ses listesi kataloğun sesYollari’sıyla birebir', { skip: atla }, () => {
  const ogeler = m.KATALOG.ogeler.filter(m.calismaSayfasiVar);
  assert.ok(ogeler.length >= 70);
  let sesliKutu = 0;
  for (const dil of DILLER) {
    for (const oge of ogeler) {
      const html = readFileSync(join(dosya(`${dil}/calis/${oge.id}/`), 'index.html'), 'utf8');
      const kutu = /<section class="cd-kutu"[^>]*?data-cd[^>]*?data-veri="([^"]+)"[^>]*>/.exec(html);
      assert.ok(kutu, `${dil}/${oge.id}: kayıt kutusu yok`);
      assert.match(kutu[0], /\shidden(\s|>)/, `${dil}/${oge.id}: kutu JS yokken gizli olmalı`);
      const veri = JSON.parse(kutu[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
      assert.equal(veri.id, oge.id);
      assert.equal(veri.dil, dil);
      assert.equal(veri.yol, `/${dil}/calis/${oge.id}/`);
      assert.ok(veri.ad.length > 0);
      assert.deepEqual(veri.sesler, m.sesYollari(oge).map((y) => `https://ulucamii.be${y}`), `${dil}/${oge.id}: ses listesi`);
      if (veri.sesler.length) sesliKutu++;
    }
  }
  assert.ok(sesliKutu > 300, `yalnız ${sesliKutu} sesli kutu`);
});

test('_astro dosyalarının atıfları çözülür: her sayfanın, CSS’in ve JS’in istediği statik dosya derlemede var; ses ve sayfa bağlantıları karışmaz', { skip: atla }, () => {
  const eksik = [];
  const kontrol = (tur, metin, taban, nerede) => {
    for (const y of m.varlikAdresleri(tur, metin, taban)) if (!existsSync(dosya(y))) eksik.push(`${nerede} → ${y}`);
  };
  for (const s of tumHtml()) kontrol('html', readFileSync(s, 'utf8'), '/' + s.slice(DIST.length + 1).replaceAll('\\', '/').replace(/index\.html$/, ''), s.slice(DIST.length));
  for (const a of readdirSync(dosya('_astro'))) {
    const tur = a.endsWith('.css') ? 'css' : a.endsWith('.js') ? 'js' : null;
    if (tur) kontrol(tur, readFileSync(dosya(`_astro/${a}`), 'utf8'), `/_astro/${a}`, `_astro/${a}`);
  }
  assert.deepEqual(eksik.slice(0, 10), []);
  // Örnek sayfa: yapı dosyaları, yazı tipi ve logo bulunur.
  const bulunan = m.varlikAdresleri('html', readFileSync(join(dosya('tr/calis/s-ihlas/'), 'index.html'), 'utf8'), '/tr/calis/s-ihlas/');
  assert.ok(bulunan.some((y) => y.endsWith('.css')) && bulunan.some((y) => y.endsWith('.js')));
  assert.ok(bulunan.includes('/fonts/atkinson-next.woff2') && bulunan.includes('/logo/kuran-kursu-yatay.svg'));
  assert.equal(bulunan.some((y) => y.startsWith('/media/') || y.endsWith('/')), false);
});

test('Service worker ses önbelleğine YAZMAZ: ses önbelleği adı sw.ts’te yalnız okuma (caches.match cacheName) olarak geçer; sesIndir ve arka plan indirmesi yok', () => {
  const kaynak = readFileSync('egitim/src/sw/sw.ts', 'utf8');
  const satirlar = kaynak.split('\n').filter((s) => s.includes('SES_ONBELLEGI') && !s.trimStart().startsWith('KABUK_ONEKI') && !s.trimStart().startsWith('*') && !s.trimStart().startsWith('//'));
  assert.ok(satirlar.length >= 1);
  for (const s of satirlar) assert.match(s, /caches\.match\(.*cacheName: SES_ONBELLEGI/, s.trim());
  assert.doesNotMatch(kaynak, /sesIndir|indirilenler|\.put\([^)]*adres/);
  // Sayfa tarafı: ses önbelleğine yazan tek yer, kaydet akışındaki sesiAl'dır.
  const istemci = readFileSync('egitim/src/lib/cevrimdisi-istemci.ts', 'utf8');
  assert.equal([...istemci.matchAll(/ses\.put\(|onbellek\.put\(adres/g)].length, 1);
});
