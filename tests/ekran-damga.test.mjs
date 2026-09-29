import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { damgaHesapla, damgayaGirer, ekranDamgasi, KABUK, kabukDosyasi } from '../scripts/ekran-damga.mjs';

/* Cami ekranı service worker'ının sürüm damgası yayımlanan ekran dosyalarının içerik özetidir
   (scripts/ekran-damga.mjs; astro.config.mjs → derleme sonu). Eski damga derleme anıydı (Date.now): sitenin her
   yayını (günde 2–4) kutuya yeni bir SW kurduruyor ve ekranı rastgele saatlerde yeniletiyordu. */

test('damga yol ve içerikten gelir: sıra bağımsız, aynı dosyalar aynı damga, tek bayt değişince farklı', () => {
  const dosyalar = [['/ekran/ekran.js', 'paket'], ['/ekran/ekran.css', 'stil'], ['/ekran/', '<html>']];
  const damga = ekranDamgasi(dosyalar);
  assert.match(damga, /^[0-9a-f]{16}$/);
  assert.equal(ekranDamgasi([...dosyalar].reverse()), damga);
  assert.equal(ekranDamgasi(dosyalar.map(([u, i]) => [u, Buffer.from(i)])), damga, 'metin ve bayt aynı özeti verir');
  assert.notEqual(ekranDamgasi([['/ekran/ekran.js', 'paket!'], ...dosyalar.slice(1)]), damga);
  assert.notEqual(ekranDamgasi(dosyalar.slice(1)), damga, 'dosya eksildi');
  // İki dosya arasındaki sınır kayamaz: ('ab', 'c') ile ('a', 'bc') aynı özeti vermez.
  assert.notEqual(ekranDamgasi([['/a', 'ab'], ['/b', 'c']]), ekranDamgasi([['/a', 'a'], ['/b', 'bc']]));
});

test('ağ önce veri akışları damgaya girmez; iskelet, paket, CSS, fontlar ve logolar girer', () => {
  const girmeyen = KABUK.filter((u) => !damgayaGirer(u));
  assert.deepEqual(girmeyen.sort(), ['/ekran/akis.json', '/ekran/icerik.json', '/ekran/vakitler.json']);
  for (const u of ['/ekran/', '/ekran/ekran.js', '/ekran/ekran.css', '/ekran/fonts/arapca-kuran.woff2', '/ekran/fonts/arapca-metin.woff2', '/media/logo/ulu-camii-logo.svg']) {
    assert.ok(KABUK.includes(u) && damgayaGirer(u), u);
  }
  assert.equal(kabukDosyasi('kok', '/ekran/'), join('kok', 'ekran', 'index.html'));
  assert.equal(kabukDosyasi('kok', '/media/logo/ulu-camii-logo.svg'), join('kok', 'media', 'logo', 'ulu-camii-logo.svg'));
});

/* "İki derleme": kabuğun bütün dosyalarıyla sahte bir dist/ ağacı kurulur. Veri akışları her derlemede değişir
   (derleme anı); ekran dosyaları değişmedikçe damga aynı kalmalı. */
function sahteDist(degisen = {}) {
  const kok = mkdtempSync(join(tmpdir(), 'ekran-damga-'));
  for (const u of KABUK) {
    const dosya = kabukDosyasi(kok, u);
    mkdirSync(dirname(dosya), { recursive: true });
    writeFileSync(dosya, degisen[u] ?? `içerik ${u}`);
  }
  return kok;
}

test('iki derleme: ekran dosyaları değişmediyse damga aynı; paket, sayfa ya da logo değişince farklı', async () => {
  const kokler = [];
  const damga = async (degisen) => { const kok = sahteDist(degisen); kokler.push(kok); return damgaHesapla(kok); };
  try {
    const ilk = await damga();
    assert.match(ilk, /^[0-9a-f]{16}$/);
    assert.equal(await damga(), ilk, 'aynı dosyalar');
    assert.equal(await damga({ '/ekran/akis.json': '{"derleme":"2026-09-28T23:11:42.000Z"}', '/ekran/vakitler.json': '{"guncelleme":"x"}' }), ilk, 'yalnız veri akışları değişti');
    assert.notEqual(await damga({ '/ekran/ekran.js': 'yeni paket' }), ilk, 'paket değişti');
    assert.notEqual(await damga({ '/ekran/ekran.css': 'yeni stil' }), ilk, 'CSS değişti');
    assert.notEqual(await damga({ '/ekran/': '<script id="ekran-veri">{"cumaSaati":"13:30"}</script>' }), ilk, 'sayfa verisi (Cuma saati) değişti');
    assert.notEqual(await damga({ '/media/logo/ulu-camii-logo.svg': '<svg/>' }), ilk, 'logo değişti');
  } finally {
    for (const kok of kokler) rmSync(kok, { recursive: true, force: true });
  }
});

test('kabuk dosyası derleme çıktısında yoksa damga hesaplanmaz (yayın durur)', async () => {
  const kok = sahteDist();
  try {
    rmSync(kabukDosyasi(kok, '/ekran/ekran.js'));
    await assert.rejects(damgaHesapla(kok), /\/ekran\/ekran\.js/);
  } finally {
    rmSync(kok, { recursive: true, force: true });
  }
});

/* Derlenmiş site (dist/) yalnız `npm run build` sonrasında vardır; yayın hattında bu test derlemeden sonra koşar.
   Yayımlanan SW, yayımlanan ekran dosyalarının içerik damgasını taşımalı (derleme sonu adımı gerçekten çalıştı). */
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
test('dist/ekran/sw.js yayımlanan ekran dosyalarının içerik damgasını taşır', { skip: !existsSync(join(DIST, 'ekran', 'sw.js')) && 'dist/ekran/sw.js yok — önce `npm run build`; denetim atlandı' }, async () => {
  const damga = await damgaHesapla(DIST);
  assert.ok(readFileSync(join(DIST, 'ekran', 'sw.js'), 'utf8').includes(damga),
    `dist/ekran/sw.js ${damga} damgasını taşımıyor. Yerelde dist/ eski bir derlemeden kalmış olabilir (bir kabuk dosyası ya da sw.ts sonradan değişti): önce \`npm run build\` ile yeniden derleyin. Yeni derlemede de düşüyorsa derleme sonu adımı (astro.config.mjs → ekran-sw-damgasi) çalışmamıştır.`);
});
