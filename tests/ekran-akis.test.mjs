import test from 'node:test';
import assert from 'node:assert/strict';
import { ekranDuyurulari } from '../src/lib/ekran/akis.ts';

const d = (id, data) => ({ id, data: { baslik: 'Başlık ' + id, tarih: new Date('2026-09-20'), taslak: false, ekranHedef: [], ...data } });

test('TR ve FR duyuru slugdan eşlenir; yalnız ekranda işaretli olan girer', () => {
  const s = ekranDuyurulari([
    d('tr/kermes', { ekranda: true, ozet: 'Kermes pazar günü.' }),
    d('fr/kermes', { ekranda: true, baslik: 'Kermesse', ozet: 'Kermesse dimanche.' }),
    d('tr/eski-haber', { ekranda: false }),
  ], '2026-09-27', 30);
  assert.equal(s.length, 1);
  assert.equal(s[0].id, 'kermes');
  assert.deepEqual(s[0].tr, { baslik: 'Başlık tr/kermes', metin: 'Kermes pazar günü.' });
  assert.deepEqual(s[0].fr, { baslik: 'Kermesse', metin: 'Kermesse dimanche.' });
});

test('ekran metni özetten önce gelir, boş bırakılmışsa özet; taslak ve süresi dolan duyuru girmez', () => {
  const s = ekranDuyurulari([
    d('tr/a', { ekranda: true, ozet: 'Uzun özet', ekranMetni: 'Kısa ekran metni' }),
    d('tr/b', { ekranda: true, taslak: true }),
    d('tr/c', { ekranda: true, ekranSon: new Date('2026-09-26') }),
    d('tr/d', { ekranda: true, ozet: 'Özet kalır', ekranMetni: '  ' }),
  ], '2026-09-27', 30);
  assert.deepEqual(s.map((x) => x.id), ['a', 'd']);
  assert.equal(s[0].tr.metin, 'Kısa ekran metni');
  assert.equal(s[1].tr.metin, 'Özet kalır');
});

test('son gün boşsa başlangıçtan itibaren varsayılan gün sayısı kadar (başlangıç dâhil) gösterilir', () => {
  const [x] = ekranDuyurulari([d('tr/a', { ekranda: true, ekranBaslangic: new Date('2026-09-25') })], '2026-09-27', 30);
  assert.equal(x.baslangic, '2026-09-25');
  assert.equal(x.son, '2026-10-24');
  assert.deepEqual(ekranDuyurulari([d('tr/a', { ekranda: true, ekranBaslangic: new Date('2026-08-01') })], '2026-09-27', 30), []);
});

test('hedef ekranlar ve kapak görseli akışa taşınır; FR yoksa yalnız TR', () => {
  const [x] = ekranDuyurulari([d('tr/a', { ekranda: true, ekranHedef: ['kadin'], kapak: '/media/duyurular/a.webp' })], '2026-09-27', 30);
  assert.deepEqual(x.hedef, ['kadin']);
  assert.equal(x.gorsel, '/media/duyurular/a.webp');
  assert.equal(x.fr, undefined);
});
