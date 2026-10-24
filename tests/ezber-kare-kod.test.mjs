/**
 * Basılı ezber kartının kare kodu (Faz 2e, 24 Ekim 2026): saf vektör çizim src/lib/ezber/kare-kod.ts. Kodu `qrcode` paketi üretir;
 * burada çizimin matrisle BİREBİR aynı olduğu (yoldan matris geri kurulur), hiçbir piksel ya da dış kaynak taşımadığı ve
 * katalogdaki her çalışma sayfası adresinin kodlanabildiği sabitlenir. Kodun telefonla okunduğunda doğru adrese gittiği ayrıca
 * PDF'ten çözülerek denetlenir (scripts/ezber-kart-dogrula.py, OpenCV).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import QRCode from 'qrcode';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ezber-kare-kod-test.mjs');
await build({ entryPoints: ['src/lib/ezber/kare-kod.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const k = await import(pathToFileURL(cikti).href);

const katalog = JSON.parse(readFileSync('src/data/ezber/katalog.json', 'utf8'));
const adres = (dil, id) => `https://egitim.ulucamii.be/${dil}/calis/${id}/`;
const matris = (a) => {
  const m = QRCode.create(a, { errorCorrectionLevel: 'M' }).modules;
  return { m, ham: Array.from({ length: m.size }, (_, y) => Array.from({ length: m.size }, (_, x) => (m.get(y, x) ? 1 : 0))) };
};

test('kareKodYolu: yoldan geri kurulan matris qrcode matrisiyle birebir aynı (her çalışma sayfası adresi, beş dil)', () => {
  let sayac = 0;
  for (const oge of katalog.ogeler.filter((o) => o.ses || o.kuran)) {
    for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
      const { m, ham } = matris(adres(dil, oge.id));
      assert.deepEqual(k.yoldanMatris(k.kareKodYolu(m), m.size), ham, `${dil}/${oge.id}`);
      sayac++;
    }
  }
  assert.ok(sayac >= 280, `beklenenden az adres sınandı: ${sayac}`);
});

test('kareKodSvg: yalnız vektör (yol + dikdörtgen), 4 modül sessiz bölge, beyaz zemin; görsel, bağlantı ya da betik yok', () => {
  const { m } = matris(adres('tr', 's-ihlas'));
  const svg = k.kareKodSvg(m);
  assert.match(svg, /^<svg class="kare-kod" xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) (\d+)"/);
  const [, boy] = svg.match(/viewBox="0 0 (\d+) \d+"/);
  assert.equal(Number(boy), m.size + 8);
  assert.match(svg, /<rect width="\d+" height="\d+" fill="#ffffff"\/>/);
  assert.match(svg, /<path fill="#000000" d="M\d+ \d+h\d+v1h-\d+z/);
  for (const yasak of ['<image', 'href', 'xlink', 'style=', '<script', 'data:', 'base64', 'onload']) assert.ok(!svg.includes(yasak), `SVG ${yasak} içermemeli`);
  // Sessiz bölge: hiçbir dikdörtgen 4. modülden önce başlamaz ve boy − 4'ten sonra bitmez.
  for (const [, x, y, w] of svg.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    assert.ok(Number(x) >= 4 && Number(y) >= 4 && Number(x) + Number(w) <= Number(boy) - 4 && Number(y) + 1 <= Number(boy) - 4);
  }
  assert.equal(svg, k.kareKodSvg(m), 'aynı matris aynı çizim');
});

test('Koşular en uzun yatay dizilerdir: bitişik karanlık modüller tek dikdörtgen, ardışık iki dikdörtgen aynı satırda birleşmez', () => {
  const sahte = { size: 5, get: (y, x) => [[1, 1, 0, 1, 1], [0, 0, 0, 0, 0], [1, 0, 1, 0, 1], [1, 1, 1, 1, 1], [0, 1, 0, 0, 0]][y][x] };
  assert.equal(k.kareKodYolu(sahte, 0), 'M0 0h2v1h-2zM3 0h2v1h-2zM0 2h1v1h-1zM2 2h1v1h-1zM4 2h1v1h-1zM0 3h5v1h-5zM1 4h1v1h-1z');
  assert.deepEqual(k.yoldanMatris(k.kareKodYolu(sahte, 0), 5, 0), [[1, 1, 0, 1, 1], [0, 0, 0, 0, 0], [1, 0, 1, 0, 1], [1, 1, 1, 1, 1], [0, 1, 0, 0, 0]]);
});

test('Kare kod adresleri kanonik adresle aynı biçimde kurulur ve düzgün kodlanır (sürüm ≤ 4: telefonla rahat okunur)', () => {
  for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
    for (const oge of katalog.ogeler.filter((o) => o.ses || o.kuran)) {
      const a = adres(dil, oge.id);
      assert.match(a, /^https:\/\/egitim\.ulucamii\.be\/(tr|fr|en|nl|de)\/calis\/[a-z0-9-]+\/$/);
      assert.ok(QRCode.create(a, { errorCorrectionLevel: 'M' }).version <= 4, `${a}: kod çok yoğun`);
    }
  }
});
