/**
 * «Abdest ve Namaz» alıştırmalarının puanlaması (10 Kasım 2026; src/lib/ibadet/ibadet-alistirma.ts): sıralama, eşleştirme ve seçim sonuçları,
 * tur seçimi, taşıma ve ilerleme bitleri. Karıştırma tohumludur; her tohumda başlangıç sırası asıl sıradan farklıdır.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ibadet-alistirma-test.mjs');
await build({ entryPoints: ['src/lib/ibadet/ibadet-alistirma.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const a = await import(pathToFileURL(cikti).href);

test('karışık sıra: permütasyon, asıl sıradan farklı, tohumla yinelenebilir', () => {
  for (let t = 0; t < 200; t++) {
    const s = a.karisikSira(13, a.rastgele(t));
    assert.deepEqual([...s].sort((x, y) => x - y), Array.from({ length: 13 }, (_, i) => i));
    assert.equal(a.siraDegerlendir(s).tamam, false);
  }
  assert.deepEqual(a.karisikSira(5, a.rastgele(7)), a.karisikSira(5, a.rastgele(7)));
  assert.deepEqual(a.karisikSira(2, a.rastgele(1)), [1, 0], 'iki parça: tek farklı sıra');
});

test('taşıma: bir basamak, sınırda değişmez, girdiyi bozmaz', () => {
  const s = [2, 0, 1];
  assert.deepEqual(a.tasi(s, 0, 1), [0, 2, 1]);
  assert.deepEqual(a.tasi(s, 2, -1), [2, 1, 0]);
  assert.deepEqual(a.tasi(s, 0, -1), [2, 0, 1]);
  assert.deepEqual(a.tasi(s, 2, 1), [2, 0, 1]);
  assert.deepEqual(a.tasi(s, 9, 1), [2, 0, 1]);
  assert.deepEqual(s, [2, 0, 1]);
});

test('sıralama değerlendirmesi: yerindeki sayısı ve tamam', () => {
  const r = a.siraDegerlendir([0, 2, 1, 3]);
  assert.deepEqual(r.dogru, [true, false, false, true]);
  assert.equal(r.yerinde, 2);
  assert.equal(r.tamam, false);
  assert.equal(a.siraDegerlendir([0, 1, 2]).tamam, true);
  assert.equal(a.siraDegerlendir([]).tamam, false, 'boş liste tamam sayılmaz');
  // Taşıyarak çözülebilir: en çok n² adımda sıralanır.
  let s = a.karisikSira(8, a.rastgele(3));
  for (let tur = 0; tur < 64 && !a.siraDegerlendir(s).tamam; tur++) {
    const i = s.findIndex((x, k) => x !== k);
    const j = s.indexOf(i);
    s = a.tasi(s, j, -1);
  }
  assert.equal(a.siraDegerlendir(s).tamam, true);
});

test('tur seçimi: tekrarsız, artan, istenen adette; adet toplamdan büyükse hepsi', () => {
  for (let t = 0; t < 100; t++) {
    const s = a.turSec(13, 6, a.rastgele(t));
    assert.equal(s.length, 6);
    assert.equal(new Set(s).size, 6);
    assert.deepEqual(s, [...s].sort((x, y) => x - y));
    assert.ok(s.every((x) => x >= 0 && x < 13));
  }
  assert.deepEqual(a.turSec(4, 6, a.rastgele(1)), [0, 1, 2, 3]);
  assert.deepEqual(a.turSec(0, 6, a.rastgele(1)), []);
  assert.deepEqual(a.turSec(5, 0, a.rastgele(1)), []);
});

test('eşleştirme: i ↔ i doğru; seçilmeyen eksik sayılır; hepsi doğruysa tamam', () => {
  assert.deepEqual(a.eslestirDegerlendir([0, 1, 2]), { dogru: [true, true, true], eksik: 0, tamam: true });
  const r = a.eslestirDegerlendir([1, 0, null]);
  assert.deepEqual(r.dogru, [false, false, false]);
  assert.equal(r.eksik, 1);
  assert.equal(r.tamam, false);
  assert.equal(a.eslestirDegerlendir([]).tamam, false);
  assert.equal(a.eslestirDegerlendir([0, null]).tamam, false);
});

test('seçim: doğru seçenekle karşılaştırır; işaretlenmeyen eksik; uzunluk uyuşmazsa hata', () => {
  assert.deepEqual(a.secimDegerlendir([0, 2], [0, 2]), { dogru: [true, true], eksik: 0, tamam: true });
  const r = a.secimDegerlendir([1, -1, 2], [1, 0, 0]);
  assert.deepEqual(r.dogru, [true, false, false]);
  assert.equal(r.eksik, 1);
  assert.equal(r.tamam, false);
  assert.equal(a.secimDegerlendir([], []).tamam, false);
  assert.throws(() => a.secimDegerlendir([1], [1, 2]), RangeError);
});

test('ilerleme biti: tamam değilse 0; ilk kontrolde tamam 3; yanıldıktan sonra tamam 1', () => {
  assert.equal(a.sonucBiti(false, 0), 0);
  assert.equal(a.sonucBiti(false, 3), 0);
  assert.equal(a.sonucBiti(true, 0), 3);
  assert.equal(a.sonucBiti(true, 1), 1);
  assert.equal(a.sonucBiti(true, 7), 1);
});
