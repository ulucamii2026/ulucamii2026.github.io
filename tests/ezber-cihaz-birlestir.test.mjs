/**
 * İlim Yolu Dilim 1 (2 Kasım 2026) — cihazdaki ilerlemenin hesaba taşınması: `birlestir(yerel, bulut)` ve kullanıcı başına
 * anahtar (src/lib/ezber/cihaz.ts). Bağlayıcı: buluttan gelen veri `temizle()`'den geçer, madde başına yeni `son` kazanır, günler
 * birleşir ve süzülür, 120 madde sınırı korunur, sonuç belirlenimci ve kendine uygulanınca değişmez; anonim davranış aynı kalır.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ezber-cihaz-birlestir-test.mjs');
await build({
  entryPoints: ['src/lib/ezber/cihaz.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(cikti).href);

const ayar = (son, ek = {}) => ({ ...m.varsayilanAyar(), son, ...ek });
const durum = (maddeler, gunler = [], ar = 1) => ({ v: 1, ar, maddeler, gunler });
class BellekDepo {
  constructor() { this.v = new Map(); }
  getItem(k) { return this.v.has(k) ? this.v.get(k) : null; }
  setItem(k, d) { this.v.set(k, String(d)); }
  removeItem(k) { this.v.delete(k); }
}

test('madde başına yeni son kazanır: iki yönde de; eşitlikte cihazdaki; yalnız bir tarafta olan madde kalır', () => {
  const yerel = durum({ a: ayar(200, { kutu: 2 }), b: ayar(100, { kutu: 1 }), c: ayar(50, { kip: 'gizle' }), y: ayar(10) });
  const bulut = durum({ a: ayar(100, { kutu: 4 }), b: ayar(300, { kutu: 3 }), c: ayar(50, { kip: 'sina' }), z: ayar(20) });
  const s = m.birlestir(yerel, bulut);
  assert.equal(s.maddeler.a.kutu, 2, 'cihaz daha yeni');
  assert.equal(s.maddeler.b.kutu, 3, 'bulut daha yeni');
  assert.equal(s.maddeler.c.kip, 'gizle', 'eşit son: cihazdaki');
  assert.equal(s.maddeler.y.son, 10);
  assert.equal(s.maddeler.z.son, 20);
  assert.deepEqual(Object.keys(s.maddeler).sort(), ['a', 'b', 'c', 'y', 'z']);
  // Yön değişince yine yeni olan kazanır.
  const t = m.birlestir(bulut, yerel);
  assert.equal(t.maddeler.a.kutu, 2);
  assert.equal(t.maddeler.b.kutu, 3);
});

test('günler birleşir: tekil, sıralı, yalnız gerçek takvim günü, son 21 gün', () => {
  const s = m.birlestir(durum({}, ['2026-10-03', '2026-10-01']), durum({}, ['2026-10-02', '2026-10-01', '2026-02-30']));
  assert.deepEqual(s.gunler, ['2026-10-01', '2026-10-02', '2026-10-03']);
  const gun = (n) => `2026-10-${String(n).padStart(2, '0')}`;
  const cift = Array.from({ length: 15 }, (_, i) => gun(2 * i + 1));
  const tek = Array.from({ length: 15 }, (_, i) => gun(2 * i + 2));
  const u = m.birlestir(durum({}, cift), durum({}, tek));
  assert.equal(u.gunler.length, 21);
  assert.equal(u.gunler[0], gun(10));
  assert.equal(u.gunler.at(-1), gun(30));
});

test('120 madde sınırı: birleşim en yeni 120 maddeyi tutar, en eski çalışılanlar atılır', () => {
  const yerel = durum(Object.fromEntries(Array.from({ length: 70 }, (_, i) => [`y-${i}`, ayar(1000 + i * 2)])));
  const bulut = durum(Object.fromEntries(Array.from({ length: 70 }, (_, i) => [`b-${i}`, ayar(1001 + i * 2)])));
  const s = m.birlestir(yerel, bulut);
  assert.equal(Object.keys(s.maddeler).length, m.AZAMI_MADDE);
  const sonlar = Object.values(s.maddeler).map((a) => a.son);
  assert.equal(Math.min(...sonlar), 1020, 'en eski 20 (1000…1019) atıldı');
  assert.equal(Math.max(...sonlar), 1139);
});

test('kötü niyetli ya da bozuk bulut verisi temizlenir; cihaz verisini bozamaz', () => {
  const yerel = durum({ a: ayar(500, { kutu: 2 }) }, ['2026-10-05'], 3);
  for (const bulut of [null, undefined, 'x', 42, [], { v: 2, maddeler: { a: ayar(9999) } }, JSON.parse('{"__proto__":{"v":1}}')]) {
    assert.deepEqual(m.birlestir(yerel, bulut), m.temizle(yerel), `bulut=${JSON.stringify(bulut)}`);
  }
  const kotu = JSON.parse(JSON.stringify({
    v: 1, ar: 99,
    maddeler: {
      a: { kip: 'zincir', seviye: 99, seri: 7, boy: 1e9, grup: -5, sondan: 'evet', dinleyici: 1, kutu: 77, sonraki: '2026-02-30', son: 600, fazla: 'x'.repeat(1000) },
      'KÖTÜ KİMLİK': ayar(700), [`u${'x'.repeat(80)}`]: ayar(700), '': ayar(700), b: 'dize', c: [1, 2], d: null,
      e: { son: 'yarın', kip: 'gizle' },
    },
    gunler: ['2026-10-06', 'kötü', 5, null, '2026-13-01'],
  }));
  // JSON.parse'ın ürettiği gibi KENDİ alanı olan «__proto__»: kimlik kalıbına uymaz, atılır; prototip kirlenmez.
  Object.defineProperty(kotu.maddeler, '__proto__', { value: ayar(800), enumerable: true, configurable: true, writable: true });
  const s = m.birlestir(yerel, kotu);
  assert.equal(s.ar, 3, 'Arapça boyutu cihazınki');
  assert.deepEqual(Object.keys(s.maddeler).sort(), ['a', 'e']);
  assert.deepEqual(s.maddeler.a, { kip: 'zincir', seviye: 4, seri: 1, boy: m.BOY_ENCOK, grup: 0, sondan: false, dinleyici: false, kutu: m.KUTU_ENCOK, sonraki: '', son: 600 });
  assert.equal(s.maddeler.e.son, 0);
  assert.deepEqual(s.gunler, ['2026-10-05', '2026-10-06']);
  assert.equal(Object.getPrototypeOf(s.maddeler), Object.prototype);
  assert.equal({}.son, undefined, 'prototip kirlenmedi');
});

test('simdi verilirse gelecekteki son ona çekilir; vermeden belirlenimci, saat okunmaz', () => {
  const simdi = 1_000_000;
  const yerel = durum({ a: ayar(simdi - 10, { kutu: 1 }) });
  const bulut = durum({ a: ayar(simdi * 50, { kutu: 4 }), b: ayar(simdi * 50) });
  const s = m.birlestir(yerel, bulut, simdi);
  assert.equal(s.maddeler.a.kutu, 4, 'ileri tarihli bulut kaydı hâlâ daha yeni');
  assert.equal(s.maddeler.a.son, simdi);
  assert.equal(s.maddeler.b.son, simdi);
  // Sonra cihazda çalışılınca (son = simdi + 5) cihaz kazanabilir; tavan olmasaydı ileri tarihli kayıt hep kazanırdı.
  const sonra = m.maddeyiGuncelle(s, 'a', { kutu: 0 }, simdi + 5);
  assert.equal(m.birlestir(sonra, bulut, simdi + 5).maddeler.a.kutu, 0);
  const gercekNow = Date.now;
  Date.now = () => { throw new Error('saat okunmamalı'); };
  try { m.birlestir(yerel, bulut); } finally { Date.now = gercekNow; }
});

test('kendine uygulanınca değişmez ve girdi sırası sonucu değiştirmez', () => {
  const a = durum({ x: ayar(5), y: ayar(9, { kutu: 2 }), k: ayar(7) }, ['2026-10-01', '2026-10-09'], 2);
  const b = durum({ y: ayar(12, { kutu: 3 }), z: ayar(3), k: ayar(7, { kip: 'sina' }) }, ['2026-10-04']);
  const ab = m.birlestir(a, b);
  assert.deepEqual(m.birlestir(a, ab), ab);
  assert.deepEqual(m.birlestir(ab, b), ab);
  assert.deepEqual(m.birlestir(ab, ab), ab);
  assert.deepEqual(m.birlestir(a, a), m.temizle(a));
  const ters = (d) => ({ ...d, maddeler: Object.fromEntries(Object.entries(d.maddeler).reverse()) });
  assert.deepEqual(m.birlestir(ters(a), ters(b)), ab);
  // Sınırda eşit `son`lar: budama anahtar sırasına bağlı kalmaz.
  const cok = (onek, n) => durum(Object.fromEntries(Array.from({ length: n }, (_, i) => [`${onek}-${String(i).padStart(3, '0')}`, ayar(42)])));
  const p = cok('p', 80);
  const q = cok('q', 80);
  const pq = m.birlestir(p, q);
  assert.equal(Object.keys(pq.maddeler).length, m.AZAMI_MADDE);
  assert.deepEqual(Object.keys(m.birlestir(ters(p), ters(q)).maddeler), Object.keys(pq.maddeler));
  assert.deepEqual(m.birlestir(p, pq), pq);
});

test('kullanıcı anahtarı: ulucamii:ezber:cihaz:v1:u:<özet>; özet [a-z0-9]{8,64} değilse hata', () => {
  assert.equal(m.kullaniciAnahtari('abc12345'), 'ulucamii:ezber:cihaz:v1:u:abc12345');
  assert.equal(m.kullaniciAnahtari('a'.repeat(64)), `ulucamii:ezber:cihaz:v1:u:${'a'.repeat(64)}`);
  for (const kotu of ['', 'abc1234', 'a'.repeat(65), 'ABC12345', 'abc-1234', 'abc 1234', 'abc12345\n', null, undefined, 12345678]) {
    assert.throws(() => m.kullaniciAnahtari(kotu), TypeError, String(kotu));
  }
});

test('anonim davranış değişmedi: oku/yaz varsayılan anahtarı kullanır; kullanıcı anahtarı ayrı tutulur', () => {
  const depo = new BellekDepo();
  const d = m.calismaGunuIsle(m.maddeyiGuncelle(m.bos(), 'd-tekbir', { kutu: 1 }, 1234), '2026-10-10');
  assert.equal(m.yaz(depo, d), true);
  assert.deepEqual([...depo.v.keys()], [m.ANAHTAR]);
  assert.equal(m.ANAHTAR, 'ulucamii:ezber:cihaz:v1');
  assert.deepEqual(m.oku(depo), d);
  const anahtar = m.kullaniciAnahtari('deadbeef01');
  assert.deepEqual(m.oku(depo, anahtar), m.bos(), 'kullanıcı anahtarı boş başlar');
  const u = m.maddeyiGuncelle(m.bos(), 's-fatiha', {}, 99);
  assert.equal(m.yaz(depo, u, anahtar), true);
  assert.deepEqual(m.oku(depo, anahtar), u);
  assert.deepEqual(m.oku(depo), d, 'anonim kayıt yerinde');
  assert.deepEqual(m.oku(null), m.bos());
  assert.equal(m.yaz(null, d), false);
  const bozuk = new BellekDepo();
  bozuk.setItem(m.ANAHTAR, '{bozuk');
  assert.deepEqual(m.oku(bozuk), m.bos());
});
