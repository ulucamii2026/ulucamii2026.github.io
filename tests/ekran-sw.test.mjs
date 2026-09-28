import test from 'node:test';
import assert from 'node:assert/strict';
import { budanacaklar, surumluAdres } from '../src/ekran/onbellek.ts';

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
