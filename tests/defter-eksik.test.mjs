/**
 * Doldurulmamış defterler (14 Eyl 2026) — saf hesap katmanı.
 * Rıdvan: «hangi gün hangi öğrencinin hangi dersi doldurulmamış, tek ekranda göreyim; ekran beni yönlendirsin.»
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/defter-eksik-test.mjs');
await build({
  stdin: { contents: 'export * from "./src/lib/ders-defteri.ts";', resolveDir: process.cwd() },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const m = await import(pathToFileURL(outfile).href);
const katalog = JSON.parse(readFileSync('src/data/ders-defteri-2026-2027.json', 'utf8'));

test('katalogGunleri: tarih → dersler, hafta; günler artan sırada', () => {
  const g = m.katalogGunleri(katalog);
  assert.equal(g[0].tarih, katalog[0].tarih);
  assert.equal(g[0].hafta, katalog[0].hafta);
  const g12 = g.find((x) => x.tarih === '2026-09-12');
  assert.deepEqual(g12.dersler.map((d) => d.id), ['2026-09-12_1', '2026-09-12_2', '2026-09-12_3']);
  assert.ok(g.every((x, i) => i === 0 || g[i - 1].tarih < x.tarih));
  assert.equal(g.reduce((n, x) => n + x.dersler.length, 0), katalog.length);
});

test('eksikleriHesapla: yalnız geçmiş günler; gün → öğrenci → ders sırası; yoklama ipucu; sayılar', () => {
  const gunler = m.katalogGunleri(katalog);
  const refler = ['A', 'B', 'C']; // soyad sırası
  const kayit = {
    A: ['2026-09-12_1', '2026-09-12_2', '2026-09-12_3', '2026-09-13_1', '2026-09-13_2', '2026-09-13_3'],
    B: ['2026-09-12_1'],
    C: [],
  };
  const yok = { '2026-09-13': { B: { 1: 'var', 2: 'var', 3: 'gec' }, C: { 1: 'yok', 2: 'mazeret', 3: 'yok' } } };
  const e = m.eksikleriHesapla(refler, gunler, '2026-09-13', kayit, yok);
  assert.deepEqual(e.bosGunler, ['2026-09-05', '2026-09-06']); // plandaki ilk hafta sonu: kayıt ve yoklama yok → ders yapılmamış sayılır
  assert.equal(e.gunler.length, 2);
  assert.equal(e.toplam, 11);
  assert.deepEqual(e.ogrenciler, ['B', 'C']);
  assert.equal(e.gelmeyen, 3);
  assert.equal(e.gunler[0].beklenen, 9);
  assert.equal(e.gunler[0].dolu, 4);
  assert.equal(e.gunler[0].yoklamaVar, false);
  assert.deepEqual(e.gunler[0].eksikler.map((x) => `${x.ref}:${x.id}`), ['B:2026-09-12_2', 'B:2026-09-12_3', 'C:2026-09-12_1', 'C:2026-09-12_2', 'C:2026-09-12_3']);
  assert.equal(e.gunler[1].yoklamaVar, true);
  assert.deepEqual(e.gunler[1].eksikler.map((x) => x.yoklama), ['var', 'var', 'gec', 'yok', 'mazeret', 'yok']);
  assert.equal(e.gunler[1].eksikler[0].konu, katalog.find((d) => d.id === '2026-09-13_1').konu);
  // Bugün 12 Eyl ise 13 Eyl henüz beklenmez; dönem başlamadıysa hiç gün yok. Yoklama eksikse ipucu boş.
  assert.equal(m.eksikleriHesapla(refler, gunler, '2026-09-12', kayit, {}).toplam, 5);
  assert.equal(m.eksikleriHesapla(refler, gunler, '2026-09-01', kayit, {}).gunler.length, 0);
  assert.deepEqual(m.eksikleriHesapla(refler, gunler, '2026-09-01', kayit, {}).bosGunler, []);
  assert.deepEqual(m.eksikleriHesapla(['A'], gunler, '2026-09-13', kayit, {}).gunler.map((g) => g.eksikler.length), [0, 0]);
  const c = m.eksikleriHesapla(['C'], gunler, '2026-09-13', kayit, { '2026-09-13': { C: { 1: 'var' } } });
  assert.deepEqual(c.bosGunler, ['2026-09-05', '2026-09-06', '2026-09-12']); // C'nin kaydı yok, yoklama yalnız 13 Eyl'de
  assert.equal(c.gunler.length, 1);
  assert.deepEqual(c.gunler[0].eksikler.map((x) => x.yoklama), ['var', '', '']);
});
