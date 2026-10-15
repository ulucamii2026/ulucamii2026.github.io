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

// Saat geriye giderse gelecekten gelen okuma bayat sayılır; küçük kayma tolere edilir.
test('gelecekten gelen hava okuması 10 dakikayı aşarsa bayat sayılır', () => {
  const simdi = 1_000_000_000;
  assert.equal(havaTazeMi({ sicaklik: 12, kod: 3, alinan: simdi + 11 * 24 * 3_600_000 }, simdi), false);
  assert.equal(havaTazeMi({ sicaklik: 12, kod: 3, alinan: simdi + 5 * 60_000 }, simdi), true);
  assert.equal(havaTazeMi({ sicaklik: 12, kod: 3, alinan: 0 }, 3 * 3_600_000 + 60_000), false);
});

test('WMO kodları simgeye eşlenir', () => {
  assert.deepEqual([0, 2, 3, 45, 61, 73, 86, 95].map(havaSimgesi), ['gunes', 'parcali', 'bulut', 'sis', 'yagmur', 'kar', 'kar', 'firtina']);
});

test('adres caminin konumunu ve Brüksel saat dilimini taşır', () => {
  assert.match(havaAdresi(50.231495, 5.339165), /latitude=50\.231495&longitude=5\.339165&current=temperature_2m,weather_code&timezone=Europe%2FBrussels$/);
});
