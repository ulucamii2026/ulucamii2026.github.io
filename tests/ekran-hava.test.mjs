import test from 'node:test';
import assert from 'node:assert/strict';
import { havaAdresi, havaCoz, havaTazeMi, havaSimgesi } from '../src/ekran/hava.ts';

test('Open-Meteo yanıtı çözülür, eksik yanıt reddedilir', () => {
  assert.deepEqual(havaCoz({ current: { temperature_2m: 18.6, weather_code: 61 } }, 1000), { sicaklik: 19, kod: 61, alinan: 1000 });
  assert.equal(havaCoz({ current: { temperature_2m: '18' } }, 1), null);
  assert.equal(havaCoz(null, 1), null);
});

test('3 saatten eski hava gösterilmez', () => {
  const h = { sicaklik: 12, kod: 3, alinan: 0 };
  assert.equal(havaTazeMi(h, 3 * 3_600_000), true);
  assert.equal(havaTazeMi(h, 3 * 3_600_000 + 1), false);
  assert.equal(havaTazeMi(null, 0), false);
});

test('WMO kodları simgeye eşlenir', () => {
  assert.deepEqual([0, 2, 3, 45, 61, 73, 86, 95].map(havaSimgesi), ['gunes', 'parcali', 'bulut', 'sis', 'yagmur', 'kar', 'kar', 'firtina']);
});

test('adres caminin konumunu ve Brüksel saat dilimini taşır', () => {
  assert.match(havaAdresi(50.231495, 5.339165), /latitude=50\.231495&longitude=5\.339165&current=temperature_2m,weather_code&timezone=Europe%2FBrussels$/);
});
