import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tazele, akisTazele, vakitGecerli, sayfaIlcesi, VARSAYILAN_ILCE, VAKIT_YOLU, AKIS_YOLU, ICERIK_YOLU } from '../src/ekran/veri.ts';
import { DIYANET_ILCE } from '../src/lib/ekran/vakit-kapisi.ts';

/* Konumdan bağımsız ekran sayfası (D2): ilçe sayfanın kendisinden (#ekran-veri.ilce) gelir, veri yolları sayfaya
   görelidir. Ulu Camii'nin davranışı değişmez: alanı olmayan eski iskelet 11890 varsayar. */
const VAKIT = (ilce) => ({ kaynakTuru: 'diyanet', ilce, gunler: [{ tarih: '2026-09-27' }] });
const AKIS = { duyurular: [], ayar: { slayt: { tabanSn: 8 } } };
const ICERIK = { ayetler: [], hadisler: [] };
const oku = (yol) => readFileSync(new URL(yol, import.meta.url), 'utf8');

/** Sahte fetch: istenen yolları toplar; vakit akışı verilen ilçeyle döner. */
async function sahteFetchle(vakitIlcesi, calistir) {
  const istenen = [];
  const eski = globalThis.fetch;
  globalThis.fetch = async (yol) => {
    istenen.push(yol);
    return Response.json(yol.endsWith('vakitler.json') ? VAKIT(vakitIlcesi) : yol.endsWith('akis.json') ? AKIS : ICERIK);
  };
  try {
    await calistir();
  } finally {
    globalThis.fetch = eski;
  }
  return istenen;
}

test('istemci varsayılan ilçesi sitenin Diyanet ilçesidir (tek kaynak)', () => assert.equal(VARSAYILAN_ILCE, DIYANET_ILCE));

test('vakitGecerli ilçeyi parametreyle karşılaştırır; parametre yoksa 11890', () => {
  assert.equal(vakitGecerli(VAKIT('12345'), '12345'), true);
  assert.equal(vakitGecerli(VAKIT('11890'), '12345'), false);
  assert.equal(vakitGecerli(VAKIT('12345')), false);
  assert.equal(vakitGecerli(VAKIT('11890')), true);
});

test('sayfaIlcesi: eski iskelette (alan yok) ya da bozuk değerde 11890', () => {
  for (const x of [undefined, null, 11890, '', 'abc', '1234567', '12 45', ' 12345', {}, [], ['12345']]) assert.equal(sayfaIlcesi(x), '11890', JSON.stringify(x));
  assert.equal(sayfaIlcesi('12345'), '12345');
  assert.equal(sayfaIlcesi('9541'), '9541');
  assert.equal(sayfaIlcesi('1'), '1');
  assert.equal(sayfaIlcesi('123456'), '123456');
});

test('veri yolları sayfaya görelidir', () => {
  assert.equal(VAKIT_YOLU, './vakitler.json');
  assert.equal(AKIS_YOLU, './akis.json');
  assert.equal(ICERIK_YOLU, './icerik.json');
});

test('tazele göreli yollar ister ve sayfanın ilçesini uygular; ilçe verilmezse 12345 dosyası reddedilir', async () => {
  const v = { vakit: null, akis: null, icerik: null };
  const istenen = await sahteFetchle('12345', () => tazele(v, 50, '12345'));
  assert.deepEqual([...istenen].sort(), ['./akis.json', './icerik.json', './vakitler.json']);
  assert.equal(v.vakit?.ilce, '12345');
  assert.notEqual(v.akis, null);
  assert.notEqual(v.icerik, null);

  const eski = { vakit: null, akis: null, icerik: null };
  await sahteFetchle('12345', () => tazele(eski, 50));
  assert.equal(eski.vakit, null, 'ilçe verilmeyince varsayılan 11890 uygulanır, 12345 reddedilir');
  assert.notEqual(eski.akis, null, 'akış ve içerik ilçeden bağımsızdır');
});

test('tazele: sayfanın ilçesi 12345 iken 11890 dosyası (Ulu Camii verisi sızması) reddedilir ve eski vakit korunur', async () => {
  const onceki = VAKIT('12345');
  const v = { vakit: onceki, akis: null, icerik: null };
  await sahteFetchle('11890', () => tazele(v, 50, '12345'));
  assert.equal(v.vakit, onceki);
});

test('tazele(v, süre) çağrısı bugünkü gibi 11890 ister (Ulu Camii davranışı)', async () => {
  const v = { vakit: null, akis: null, icerik: null };
  await sahteFetchle('11890', () => tazele(v, 50));
  assert.equal(v.vakit?.ilce, '11890');
});

test('akisTazele yalnız göreli akis.json ister', async () => {
  const v = { vakit: null, akis: null, icerik: null };
  const istenen = await sahteFetchle('11890', () => akisTazele(v, 50));
  assert.deepEqual(istenen, ['./akis.json']);
  assert.notEqual(v.akis, null);
});

/** Yorum satırları ve blok yorumlar ayıklanır; geriye kalan kodda mutlak /ekran/ yolu aranır. */
function yorumsuz(kaynak) {
  return kaynak
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((satir) => satir.replace(/(^|\s)\/\/.*$/, '$1'))
    .join('\n');
}

test('veri.ts ve main.ts yorum dışında mutlak /ekran/ yolu içermez (K9)', () => {
  for (const dosya of ['../src/ekran/veri.ts', '../src/ekran/main.ts']) {
    const kod = yorumsuz(oku(dosya));
    assert.doesNotMatch(kod, /['"`]\/ekran\//, `${dosya} mutlak /ekran/ yolu içeriyor`);
  }
});

test('yorum ayıklayıcı mutlak yolu yorumda bırakır, kodda yakalar (kalıbın kendisi sınanır)', () => {
  assert.doesNotMatch(yorumsuz("// '/ekran/x'\n/* '/ekran/y' */\nconst a = 1;"), /['"`]\/ekran\//);
  assert.match(yorumsuz("const a = '/ekran/x'; // yorum"), /['"`]\/ekran\//);
  assert.match(yorumsuz("navigator.serviceWorker.register('/ekran/sw.js')"), /['"`]\/ekran\//);
});

test('index.astro sayfa verisine ilce ekler', () => {
  assert.match(oku('../src/pages/ekran/index.astro'), /ilce:\s*DIYANET_ILCE/);
});
