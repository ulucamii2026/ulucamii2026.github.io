import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agOnceMi, akisYolu, budanacaklar, kabukAdresleri, kapsamdaMi, kapsamYolu, onbellekAdi, onbellekOnEki, silinecekOnbellekler, surumluAdres, surumSec } from '../src/ekran/onbellek.ts';

/* Cami ekranı service worker'ının saf yardımcıları (src/ekran/onbellek.ts; sw.ts yan etkili olduğu için burada
   yalnız bu yardımcılar sınanır, bağlantısı tests/web/ekran.spec.mjs → "internetsiz açılış"). */
const KOKEN = 'https://ulucamii.be';
const KABUK = ['/ekran/', '/ekran/ekran.js', '/ekran/akis.json', '/media/logo/ulu-camii-logo.svg', '/media/logo/ulu-camii-logo-beyaz.svg'];

// Kurulumda kabuk dosyaları sürüm sorgusuyla istenir: GitHub Pages'in CDN'i yayından hemen sonra eski ekran.js'i
// verse bile ?v=<damga> adresi CDN'de hiç görülmemiş bir adrestir, taze kopya gelir; önbelleğe asıl adresle yazılır.
test('kurulum adresi: sürüm sorgusu eklenir, var olan sorgu korunur, damga kodlanır', () => {
  assert.equal(surumluAdres('/ekran/ekran.js', '83e21facf2a984c8'), '/ekran/ekran.js?v=83e21facf2a984c8');
  assert.equal(surumluAdres('/ekran/', '83e21facf2a984c8'), '/ekran/?v=83e21facf2a984c8');
  assert.equal(surumluAdres('/ekran/akis.json?ekran=ana', 'abc'), '/ekran/akis.json?ekran=ana&v=abc');
  assert.equal(surumluAdres('/ekran/ekran.js', 'yerel a&b'), '/ekran/ekran.js?v=yerel%20a%26b');
});

// Duyuru akışı ağdan her geldiğinde /media/ altındaki çalışma zamanı önbelleği budanır: ne kabukta ne akışta olan
// görsel (eski ?v= sürümü, süresi dolmuş duyurunun görseli) silinir. Tam adres (sorgu dâhil) karşılaştırılır.
test('budama: /media/ altında ne kabukta ne akışta olan kayıtlar silinir; eski ?v= sürümü de', () => {
  const anahtarlar = [
    KOKEN + '/ekran/',
    KOKEN + '/ekran/ekran.js',
    KOKEN + '/ekran/akis.json',
    KOKEN + '/media/logo/ulu-camii-logo.svg',
    KOKEN + '/media/logo/ulu-camii-logo-beyaz.svg',
    KOKEN + '/media/duyurular/kermes.webp?v=11111111',
    KOKEN + '/media/duyurular/kermes.webp?v=22222222',
    KOKEN + '/media/duyurular/suresi-dolan.webp',
  ];
  const akis = { derleme: 'x', duyurular: [{ id: 'kermes', gorsel: '/media/duyurular/kermes.webp?v=22222222' }, { id: 'yalniz-metin' }] };
  assert.deepEqual(budanacaklar(anahtarlar, KABUK, akis, KOKEN), [
    KOKEN + '/media/duyurular/kermes.webp?v=11111111',
    KOKEN + '/media/duyurular/suresi-dolan.webp',
  ]);
});

test('budama: boş duyuru listesi kabuk dışındaki bütün medyayı sildirir; bozuk akış hiçbir şey sildirmez', () => {
  const anahtarlar = [KOKEN + '/media/logo/ulu-camii-logo.svg', KOKEN + '/media/duyurular/a.webp?v=1'];
  assert.deepEqual(budanacaklar(anahtarlar, KABUK, { duyurular: [] }, KOKEN), [KOKEN + '/media/duyurular/a.webp?v=1']);
  for (const bozuk of [null, 'metin', {}, { duyurular: 'yok' }]) assert.deepEqual(budanacaklar(anahtarlar, KABUK, bozuk, KOKEN), [], JSON.stringify(bozuk));
});

test('budama: /media/ dışı, başka kökenli ve çözülemeyen kayıtlara dokunulmaz; tuhaf gorsel değerleri akışı bozmaz', () => {
  const anahtarlar = [KOKEN + '/ekran/icerik.json', 'https://cdn.ornek.org/media/x.webp', 'bozuk adres', KOKEN + '/media/duyurular/b.webp'];
  const akis = { duyurular: [null, { gorsel: 42 }, { gorsel: 'https://ulucamii.be/media/duyurular/b.webp' }] };
  assert.deepEqual(budanacaklar(anahtarlar, KABUK, akis, KOKEN), []);
});

/* Service worker kapsamı kayıttan türer (D2): aynı paket /ekran/ altında (Ulu Camii) ve bir platform camisinin
   /c/<kimlik>/ sayfasında çalışır. /ekran/ kapsamında davranış bugünküyle birebir aynı kalmalıdır. */
const KABUK_TAM = JSON.parse(readFileSync(new URL('../src/ekran/kabuk.json', import.meta.url), 'utf8'));

test('/ekran/ kapsamı bugünkü davranışla birebir', () => {
  assert.equal(kapsamYolu('https://ulucamii.be/ekran/'), '/ekran/');
  assert.equal(onbellekOnEki('/ekran/'), 'ekran-');
  assert.equal(onbellekAdi('/ekran/', 'abc'), 'ekran-abc');
  assert.deepEqual(kabukAdresleri(KABUK_TAM, '/ekran/'), KABUK_TAM);
  assert.equal(akisYolu('/ekran/'), '/ekran/akis.json');
  assert.deepEqual(silinecekOnbellekler(['ekran-eski', 'ekran-yeni', 'baska'], '/ekran/', 'yeni'), ['ekran-eski']);
  for (const [y, b] of [['/ekran/', true], ['/ekran/akis.json', true], ['/ekran/vakitler.json', true], ['/ekran/ekran.js', false], ['/ekran/fonts/a.json', false], ['/media/logo/x.svg', false]]) assert.equal(agOnceMi(y, '/ekran/'), b, y);
  for (const [y, b] of [['/ekran/', true], ['/ekran/ekran.js', true], ['/ekran/fonts/a.woff2', true], ['/media/duyurular/a.webp', true], ['/baska/', false], ['/c/x/', false]]) assert.equal(kapsamdaMi(y, '/ekran/'), b, y);
});

test('platform kapsamı: ad cami kimliğini taşır; x ve x-y birbirinin önbelleğini silmez', () => {
  assert.equal(kapsamYolu('https://camipano.github.io/c/x/'), '/c/x/');
  assert.equal(onbellekOnEki('/c/x/'), 'ekran-c-x_');
  assert.equal(onbellekAdi('/c/x/', 'h1'), 'ekran-c-x_h1');
  assert.equal(onbellekAdi('/c/x-y/', 'h1'), 'ekran-c-x-y_h1');
  assert.deepEqual(silinecekOnbellekler(['ekran-c-x_eski', 'ekran-c-x-y_h1', 'ekran-c-x_h1'], '/c/x/', 'h1'), ['ekran-c-x_eski']);
  assert.deepEqual(silinecekOnbellekler(['ekran-c-x_eski', 'ekran-c-x-y_eski', 'ekran-c-x-y_h1'], '/c/x-y/', 'h1'), ['ekran-c-x-y_eski']);
  assert.equal(akisYolu('/c/x/'), '/c/x/akis.json');
});

test("/ekran/ kapsamı aynı kökendeki platform kapsamlarının önbelleklerini silmez (ayırıcı _ yalnız onlarda)", () => {
  assert.deepEqual(
    silinecekOnbellekler(['ekran-0123456789abcdef', 'ekran-yerel-k3x9', 'ekran-c-x_h1', 'ekran-c-x-y_h1', 'ekran-yeni'], '/ekran/', 'yeni'),
    ['ekran-0123456789abcdef', 'ekran-yerel-k3x9'],
  );
});

test('platform kabuk listesi: sayfa ve akışlar kapsama taşınır, /media/ düşer, paylaşılan /ekran/ kalır', () => {
  const k = kabukAdresleri(KABUK_TAM, '/c/x/');
  for (const u of ['/c/x/', '/c/x/vakitler.json', '/c/x/akis.json', '/c/x/icerik.json']) assert.ok(k.includes(u), u);
  for (const u of ['/ekran/ekran.css', '/ekran/ekran.js', '/ekran/fonts/work-sans-latin.woff2', '/ekran/fonts/arapca-kuran.woff2']) assert.ok(k.includes(u), u);
  assert.deepEqual(k.filter((u) => u.indexOf('/media/') === 0), [], '/media/ platformda yok: kurulum reddedilirdi');
  assert.equal(k.includes('/ekran/'), false, 'Ulu Camii sayfası platform kabuğuna girmez');
  assert.deepEqual(k.filter((u) => /^\/ekran\/[^/]+\.json$/.test(u)), [], 'Ulu Camii akışları platform kabuğuna girmez');
  assert.equal(k.length, KABUK_TAM.length - 2, 'yalnız iki logo düştü');
  assert.equal(new Set(k).size, k.length, 'yinelenen adres yok');
});

test('platform kapsamı: ağ önce yalnız sayfa ve kendi akışları; kapsam dışı yol kapsamda sayılmaz', () => {
  for (const [y, b] of [['/c/x/', true], ['/c/x/vakitler.json', true], ['/c/x/akis.json', true], ['/c/x/sw.js', false], ['/c/x/a/b.json', false], ['/ekran/', false], ['/ekran/akis.json', false], ['/ekran/ekran.js', false], ['/c/y/vakitler.json', false]]) assert.equal(agOnceMi(y, '/c/x/'), b, y);
  for (const [y, b] of [['/c/x/', true], ['/c/x/vakitler.json', true], ['/ekran/ekran.js', true], ['/media/duyurular/a.webp', true], ['/c/y/', false], ['/c/xy/', false], ['/baska/', false]]) assert.equal(kapsamdaMi(y, '/c/x/'), b, y);
});

test('surumSec: yer tutucu bozulmamışsa damga, platformun yazdığı değerse o', () => {
  assert.equal(surumSec('@@EKRAN_SURUM@@', 'damga'), 'damga');
  assert.equal(surumSec('0123456789abcdef', 'damga'), '0123456789abcdef');
});

/** Yorum satırları ayıklanır; geriye kalan kodda mutlak /ekran/ ya da /media/ yolu aranır. */
function yorumsuz(kaynak) {
  return kaynak.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((satir) => satir.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');
}

test('sw.ts yorum dışında mutlak /ekran/ yolu içermez; kapsam yolları onbellek.ts işlevlerinden gelir', () => {
  const kod = yorumsuz(readFileSync(new URL('../src/ekran/sw.ts', import.meta.url), 'utf8'));
  assert.doesNotMatch(kod, /['"`]\/ekran\//);
  assert.match(kod, /kapsamYolu\(\s*sw\.registration\.scope\s*\)/);
  assert.match(kod, /surumSec\(\s*'@@EKRAN_SURUM@@'/);
});
