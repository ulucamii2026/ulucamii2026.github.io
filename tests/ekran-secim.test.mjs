import test from 'node:test';
import assert from 'node:assert/strict';
import { slaytSuresi, hedefUygunMu, aktifMi, gunNo, gununOgesi, temaSec, saatGecerliMi, brukselSaat, vakitGorunumu, slaytListesi, ekranIdOku, donmeOku } from '../src/lib/ekran/secim.ts';

const AYAR = { tabanSn: 8, karakterSn: 0.05, enAzSn: 10, enCokSn: 30 };
const gun = (tarih, ek = {}) => ({ tarih, hicri: '16 Rebiulahir 1448', imsak: '05:43', gunes: '07:26', ogle: '13:34', ikindi: '16:47', aksam: '19:35', yatsi: '21:04', ...ek });

test('slayt süresi metin uzunluğuyla artar ve 10–30 sn arasında kalır', () => {
  assert.equal(slaytSuresi(0, AYAR), 10);
  assert.equal(slaytSuresi(200, AYAR), 18);
  assert.equal(slaytSuresi(5000, AYAR), 30);
});

test('hedefsiz duyuru her ekranda, hedefli duyuru yalnız kendi ekranında', () => {
  assert.equal(hedefUygunMu([], 'giris'), true);
  assert.equal(hedefUygunMu(['kadin'], 'kadin'), true);
  assert.equal(hedefUygunMu(['kadin'], 'ana'), false);
});

test('gösterim aralığının iki ucu dâhil', () => {
  const o = { baslangic: '2026-09-27', son: '2026-09-30' };
  assert.equal(aktifMi(o, '2026-09-27'), true);
  assert.equal(aktifMi(o, '2026-09-30'), true);
  assert.equal(aktifMi(o, '2026-10-01'), false);
  assert.equal(aktifMi(o, '2026-09-26'), false);
});

test('günün öğesi aynı gün sabit, ertesi gün sıradaki; yaz saati geçişi sırayı bozmaz', () => {
  const l = ['a', 'b', 'c'];
  assert.equal(gunNo('2026-10-26') - gunNo('2026-10-25'), 1);
  assert.equal(gunNo('2027-03-29') - gunNo('2027-03-28'), 1);
  const bugun = gununOgesi(l, '2026-10-25');
  const yarin = gununOgesi(l, '2026-10-26');
  assert.equal(gununOgesi(l, '2026-10-25'), bugun);
  assert.equal(l.indexOf(yarin), (l.indexOf(bugun) + 1) % 3);
  assert.equal(gununOgesi([], '2026-10-25'), undefined);
});

test('tema güneşten akşama açık, sonra koyu (kış saatine geçilen gün dâhil)', () => {
  const g = gun('2026-10-25', { gunes: '07:45', aksam: '18:00' });
  assert.equal(temaSec(g, new Date('2026-10-25T07:44:59+01:00')), 'koyu');
  assert.equal(temaSec(g, new Date('2026-10-25T07:45:00+01:00')), 'acik');
  assert.equal(temaSec(g, new Date('2026-10-25T17:59:59+01:00')), 'acik');
  assert.equal(temaSec(g, new Date('2026-10-25T18:00:00+01:00')), 'koyu');
  assert.equal(temaSec(undefined, new Date('2026-10-25T12:00:00+01:00')), 'acik');
});

test('pilsiz kutuda saat 1970e dönerse güvenilmez sayılır', () => {
  assert.equal(saatGecerliMi(new Date(0)), false);
  assert.equal(saatGecerliMi(new Date('2026-09-27T12:00:00Z')), true);
});

test('Brüksel saati: gece yarısı 00; yaz saati biterken 02:30 iki kez yaşanır', () => {
  assert.deepEqual(brukselSaat(new Date('2026-09-26T22:00:05Z')), { sa: 0, dk: 0, sn: 5 });
  assert.deepEqual(brukselSaat(new Date('2026-10-25T00:30:00Z')), { sa: 2, dk: 30, sn: 0 });
  assert.deepEqual(brukselSaat(new Date('2026-10-25T01:30:00Z')), { sa: 2, dk: 30, sn: 0 });
});

test('bugünün kaydı yoksa vakit görünümü yok; varsa sıradaki vakit ve Cuma bilgisi', () => {
  assert.equal(vakitGorunumu([gun('2026-09-26')], new Date('2026-09-27T10:00:00+02:00')), null);
  const v = vakitGorunumu([gun('2026-09-27'), gun('2026-09-28')], new Date('2026-09-27T10:00:00+02:00'));
  assert.equal(v.siradaki.vakit, 'ogle');
  assert.equal(v.cuma, false);
  assert.equal(vakitGorunumu([gun('2026-10-02'), gun('2026-10-03')], new Date('2026-10-02T10:00:00+02:00')).cuma, true);
  const gece = vakitGorunumu([gun('2026-09-27'), gun('2026-09-28')], new Date('2026-09-27T22:00:00+02:00'));
  assert.deepEqual([gece.siradaki.vakit, gece.siradaki.yarinMi], ['imsak', true]);
});

test('slayt turu: bu ekrana özel duyuru, ortak duyuru, günün ayeti, günün hadisi', () => {
  const du = (id, hedef, son = '2026-10-30') => ({ id, tur: 'duyuru', tr: { baslik: id, metin: 'metin' }, baslangic: '2026-09-01', son, hedef });
  const s = slaytListesi({
    duyurular: [du('ortak', []), du('kadin', ['kadin']), du('giris', ['giris']), du('bitmis', [], '2026-09-20')],
    ayetler: [{ id: 'a1', referans: { tr: 'r', fr: 'r' }, ar: 'ا', tr: 'meal', kaynakTr: 'DİB' }],
    hadisler: [{ id: 'h1', ar: 'ا', tr: 'hadis', kaynak: 'k' }],
  }, 'kadin', '2026-09-27');
  assert.deepEqual(s.map((x) => x.tur + ':' + x.oge.id), ['duyuru:kadin', 'duyuru:ortak', 'ayet:a1', 'hadis:h1']);
  assert.equal(s[0].karakter, 'kadin'.length + 'metin'.length);
});

test('ekran ve döndürme parametresi güvenli okunur', () => {
  assert.equal(ekranIdOku('kadin'), 'kadin');
  assert.equal(ekranIdOku('<script>'), 'ana');
  assert.equal(ekranIdOku(null), 'ana');
  assert.equal(donmeOku('90'), 90);
  assert.equal(donmeOku('270'), 270);
  assert.equal(donmeOku('45'), 0);
});
