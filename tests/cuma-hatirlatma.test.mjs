import test from 'node:test';
import assert from 'node:assert/strict';
import { cumaHatirlatmasi, cumaGunleri, cumaVakti, CUMA_BANDI_SONRA_DK } from '../src/lib/namaz.ts';
import { cumaTakvimiUret } from '../src/lib/ics.ts';

// Ziyaretçinin saat dilimi ne olursa olsun Brüksel takvimi esas alınır.
process.env.TZ = 'America/New_York';

/* Sentetik kayıtlar: 5 Kasım 2026 Perşembe, 6 Kasım 2026 Cuma (öğle 12:27, CET +01:00). */
const gunler = [
  { tarih: '2026-11-04', hicri: '', imsak: '06:00', gunes: '07:30', ogle: '12:28', ikindi: '14:40', aksam: '17:05', yatsi: '18:30' },
  { tarih: '2026-11-05', hicri: '', imsak: '06:01', gunes: '07:31', ogle: '12:27', ikindi: '14:39', aksam: '17:04', yatsi: '18:29' },
  { tarih: '2026-11-06', hicri: '', imsak: '06:03', gunes: '07:33', ogle: '12:27', ikindi: '14:38', aksam: '17:02', yatsi: '18:28' },
  { tarih: '2026-11-07', hicri: '', imsak: '06:04', gunes: '07:34', ogle: '12:27', ikindi: '14:37', aksam: '17:01', yatsi: '18:27' },
];
const cumalar = cumaGunleri(gunler);

test('cumaGunleri yalnız Cuma kayıtlarını, yalnız tarih ve öğleyle verir', () => {
  assert.deepEqual(cumalar, [{ tarih: '2026-11-06', ogle: '12:27' }]);
});

test('cumaVakti: sabit saat önce gelir, yoksa öğle, ikisi de yoksa boş', () => {
  assert.equal(cumaVakti({ ogle: '12:27' }, '13:30'), '13:30');
  assert.equal(cumaVakti({ ogle: '12:27' }, ''), '12:27');
  assert.equal(cumaVakti(undefined, ''), '');
});

test('Perşembe bütün gün ertesi günün saati («yarın»)', () => {
  assert.deepEqual(cumaHatirlatmasi(cumalar, new Date('2026-11-04T23:30:00Z')), { tur: 'yarin', tarih: '2026-11-06', saat: '12:27' }); // Brüksel 5.11 00.30
  assert.deepEqual(cumaHatirlatmasi(cumalar, new Date('2026-11-05T22:50:00Z')), { tur: 'yarin', tarih: '2026-11-06', saat: '12:27' }); // 23.50
});

test('Cuma günü namazdan bir saat sonrasına kadar «bugün», sonra yok', () => {
  assert.equal(cumaHatirlatmasi(cumalar, new Date('2026-11-06T08:00:00Z'))?.tur, 'bugun');
  // 12:27 CET = 11:27 UTC; +60 dk = 12:27 UTC
  assert.equal(cumaHatirlatmasi(cumalar, new Date('2026-11-06T12:27:00Z'))?.tur, 'bugun');
  assert.equal(cumaHatirlatmasi(cumalar, new Date('2026-11-06T12:28:00Z')), null);
  assert.equal(CUMA_BANDI_SONRA_DK, 60);
});

test('Öbür günler ve verisi olmayan Cuma: bant yok; sabit saat verisizken de çalışır', () => {
  assert.equal(cumaHatirlatmasi(cumalar, new Date('2026-11-04T09:00:00Z')), null); // Çarşamba
  assert.equal(cumaHatirlatmasi(cumalar, new Date('2026-11-07T09:00:00Z')), null); // Cumartesi
  assert.equal(cumaHatirlatmasi([], new Date('2026-11-05T09:00:00Z')), null);
  assert.deepEqual(cumaHatirlatmasi([], new Date('2026-11-05T09:00:00Z'), '13:30'), { tur: 'yarin', tarih: '2026-11-06', saat: '13:30' });
});

test('cuma.ics: Brüksel saatiyle başlangıç, bir saat süre, 30 dk önce hatırlatma, CRLF ve katlama', () => {
  const ics = cumaTakvimiUret([{ tarih: '2026-11-06', saat: '12:27' }, { tarih: '2027-04-02', saat: '13:39' }, { tarih: '2027-04-09', saat: '' }], 'Mosquée Ulu Camii, Thier des Corbeaux 14, 6900 Marche-en-Famenne, Belgique', new Date('2026-11-01T00:00:00Z'));
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.match(ics, /DTSTART:20261106T112700Z\r\nDTEND:20261106T122700Z/); // kış saati +01:00
  assert.match(ics, /DTSTART:20270402T113900Z/); // yaz saati +02:00
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2, 'saati olmayan gün etkinlik üretmez');
  assert.match(ics, /TRIGGER:-PT30M/);
  assert.match(ics, /UID:cuma-2026-11-06@ulucamii\.be/);
  for (const satir of ics.split('\r\n')) assert.ok(new TextEncoder().encode(satir).length <= 75, `uzun satır: ${satir}`);
});
