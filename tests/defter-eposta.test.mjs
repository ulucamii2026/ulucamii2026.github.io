/** Hoca ekranı «Kayıt defterinden yenile»: veli e-postası eşlemesi (10 Ekim 2026). Geri dönen adres epostaDuzelt'te
 *  '@'siz bir işaretle tutulur; içe aktarma bu işareti ve boş hücreyi «adres yok» sayar (veli/aile bağı kurulmaz). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { defterVeliEpostasi } from '../src/lib/defter-eposta.ts';

const duzelt = {
  'eski@example.test': 'dogru@example.test',
  'donen@example.test': 'gecersiz-geri-donuyor',
  'bos@example.test': '',
};

test('Eşleme yoksa defterdeki adres küçük harfle ve boşluksuz döner', () => {
  assert.equal(defterVeliEpostasi('  Veli@Example.TEST ', duzelt), 'veli@example.test');
});

test('Eşlenen doğru adres kullanılır', () => {
  assert.equal(defterVeliEpostasi('ESKI@example.test', duzelt), 'dogru@example.test');
});

test('@ içermeyen işaret: adres yok sayılır', () => {
  assert.equal(defterVeliEpostasi('donen@example.test', duzelt), '');
});

test('Boş hücre ve boşluk: adres yok (eskiden veliler dizisine "" eklenirdi)', () => {
  for (const v of ['', '   ', null, undefined]) assert.equal(defterVeliEpostasi(v, duzelt), '');
});

test('Boş eşleme yok sayılır (Apps Script eşitlemesiyle aynı: [ep] || ep)', () => {
  assert.equal(defterVeliEpostasi('bos@example.test', duzelt), 'bos@example.test');
});

test('Bozuk ya da belge yolunu bozacak değerler reddedilir', () => {
  for (const v of ['veli@example', 'a b@example.test', 'a/b@example.test', 'a@b/c.test', 'x'.repeat(250) + '@e.test']) {
    assert.equal(defterVeliEpostasi(v, {}), '', v);
  }
});

test('Prototip anahtarları eşleme sayılmaz', () => {
  assert.equal(defterVeliEpostasi('constructor', {}), '');
  assert.equal(defterVeliEpostasi('tostring@example.test', {}), 'tostring@example.test');
});
