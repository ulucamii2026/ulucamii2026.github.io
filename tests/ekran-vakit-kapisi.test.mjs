import test from 'node:test';
import assert from 'node:assert/strict';
import { ekranVakitleri, gunGecerliMi } from '../src/lib/ekran/vakit-kapisi.ts';

const gun = (tarih, ek = {}) => ({ tarih, hicri: '15 Rebiulahir 1448', imsak: '05:41', gunes: '07:24', ogle: '13:35', ikindi: '16:49', aksam: '19:37', yatsi: '21:06', ...ek });
const gunler = (bas, n) => Array.from({ length: n }, (_, i) => gun(new Date(Date.parse(bas + 'T12:00:00Z') + i * 864e5).toISOString().slice(0, 10)));
const veri = (liste, ek = {}) => ({ kaynak: 'Diyanet', kaynakTuru: 'diyanet', ilce: '11890', ilceAdi: 'M.FAMENNE', guncelleme: '2026-09-26T08:00:00Z', gunler: liste, ...ek });

test('Diyanet verisi dünden itibaren sıralı ve eksiksiz verilir', () => {
  const s = ekranVakitleri(veri(gunler('2026-09-20', 20).reverse()), '2026-09-27');
  assert.equal(s.gunler[0].tarih, '2026-09-26');
  assert.equal(s.gunler[s.gunler.length - 1].tarih, '2026-10-09');
  assert.equal(s.kaynakTuru, 'diyanet');
  assert.deepEqual(s.atlanan, []);
});

test('kaynağı Diyanet olmayan ya da başka ilçenin verisi derlemeyi durdurur', () => {
  assert.throws(() => ekranVakitleri(veri(gunler('2026-09-26', 10), { kaynakTuru: 'aladhan' }), '2026-09-27'), /REDDEDİLDİ.*aladhan/);
  assert.throws(() => ekranVakitleri(veri(gunler('2026-09-26', 10), { kaynakTuru: undefined }), '2026-09-27'), /REDDEDİLDİ/);
  assert.throws(() => ekranVakitleri(veri(gunler('2026-09-26', 10), { ilce: '9541' }), '2026-09-27'), /ilçe/);
});

test('biçimi ya da sırası bozuk gün ve mükerrer tarih yayımlanmaz, hesapla onarılmaz', () => {
  const g = gunler('2026-09-26', 10);
  g[2] = gun(g[2].tarih, { ogle: '1:35' });
  g[3] = gun(g[3].tarih, { aksam: '16:00' });
  g.push(gun(g[4].tarih, { yatsi: '21:10' }));
  const s = ekranVakitleri(veri(g), '2026-09-27');
  assert.deepEqual(s.atlanan, [g[2].tarih, g[3].tarih, g[4].tarih]);
  assert.ok(!s.gunler.some((x) => s.atlanan.includes(x.tarih)));
});

// Son inceleme M1: veri EKSİKLİĞİ (yanlış veri değil) bütün sitenin yayınını durdurmaz — sitenin kendi kapısıyla
// aynı karar (src/lib/icerik.ts). Uyarı yazılır; kapsamı site denetimi ölçer, ekran son sağlam veriyle döner.
test('yediden az geçerli gün kalırsa derleme durmaz, uyarı yazılır', (t) => {
  const uyari = t.mock.method(console, 'warn', () => {});
  const s = ekranVakitleri(veri(gunler('2026-09-26', 6)), '2026-09-27');
  assert.equal(s.gunler.length, 6);
  assert.equal(uyari.mock.callCount(), 1);
  assert.match(String(uyari.mock.calls[0].arguments[0]), /yalnız 6/);
});

test('tarihi metin olmayan kayıt sessizce düşmez, atlanan listesine girer', () => {
  const g = gunler('2026-09-26', 10);
  const s = ekranVakitleri(veri([...g, { ...gun('2026-10-06'), tarih: 20261006 }, { ...gun('2026-10-07'), tarih: undefined }]), '2026-09-27');
  assert.equal(s.gunler.length, 10);
  assert.equal(s.atlanan.length, 2);
  assert.ok(s.atlanan.some((a) => a.includes('20261006')), s.atlanan.join(', '));
});

test('gunGecerliMi saat biçimini ve vakit sırasını denetler', () => {
  assert.equal(gunGecerliMi(gun('2026-09-27')), true);
  assert.equal(gunGecerliMi(gun('2026-09-27', { imsak: '24:10' })), false);
  assert.equal(gunGecerliMi(gun('2026-09-27', { gunes: '05:00' })), false);
});
