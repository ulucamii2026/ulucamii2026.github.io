import test from 'node:test';
import assert from 'node:assert/strict';
import { renderKur } from '../src/ekran/render.ts';

test('renderer yalnız başarılı döngü bildirimiyle ilerler; zamanlayıcı ve ağ işi oluşturmaz', () => {
  const pencere = {}; const r = renderKur(pencere);
  assert.deepEqual(pencere.UluRenderDurumu(), { v: 1, sayfa: 'site', sayac: 0 });
  r.ilerle(); r.ilerle();
  assert.deepEqual(pencere.UluRenderDurumu(), { v: 1, sayfa: 'site', sayac: 2 });
});
test('snapshot ve dış API değiştirilemez; sayaç içerik adres kimlik taşımaz', () => {
  const pencere = {}; const r = renderKur(pencere);
  assert.throws(() => { pencere.UluRenderDurumu = () => ({ body: 'fixture' }); }, TypeError);
  const eski = pencere.UluRenderDurumu();
  assert.throws(() => { eski.sayac = 100; }, TypeError);
  r.ilerle(); assert.equal(eski.sayac, 0); assert.equal(pencere.UluRenderDurumu().sayac, 1);
  assert.deepEqual(Object.keys(pencere.UluRenderDurumu()), ['v', 'sayfa', 'sayac']);
});
