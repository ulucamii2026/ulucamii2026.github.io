// tests/ekran-susleme.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { SUSLEME_SVG } from '../src/ekran/susleme.ts';
import { svgSorunlari } from '../scripts/svg-denetim.mjs';

test('levha süslemesi SVG denetiminden geçer: viewBox, boyutsuz kök, kimlik ve dış kaynak yok', () => {
  assert.deepEqual(svgSorunlari(SUSLEME_SVG, { dosyaKoku: 'susleme' }), []);
});

test('süsleme sabit renk yazmaz: çizgi currentColor, yıldız CSS sınıfıyla kurumsal renge bağlı', () => {
  assert.match(SUSLEME_SVG, /stroke="currentColor"/);
  assert.match(SUSLEME_SVG, /class="yildiz"/);
  assert.doesNotMatch(SUSLEME_SVG, /#[0-9a-f]{3,8}\b/i);
});
