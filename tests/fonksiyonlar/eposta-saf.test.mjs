// İlim Yolu Dilim 2 — haftalık e-posta SAF mantığı (emülatör gerekmez): Brüksel saati + yaz/kış saati, ISO hafta kimliği,
// ilerleme özeti, HMAC abonelik bağlantısı (doğrulama, kurcalama, süre), onay sayfası metinleri.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bruksel, isoHafta, haftalikSaatler, zamanUygunMu, kuyrukKimligi, ozetle, dilSec, abonelikSayfasi, EPOSTA_DILLERI,
} from '../../src/lib/ilim-yolu/eposta.ts';
import { tokenUret, tokenDogrula, BAGLANTI_OMRU_MS } from '../../src/lib/ilim-yolu/abonelik-imza.ts';

const z = (iso) => Date.parse(iso);

test('bruksel: kış UTC+1, yaz UTC+2; gün gece yarısında Brüksel takvimine göre döner', () => {
  assert.deepEqual(bruksel(z('2026-01-15T12:00:00Z')), { tarih: '2026-01-15', saat: 13, gun: 4 });
  assert.deepEqual(bruksel(z('2026-07-15T12:00:00Z')), { tarih: '2026-07-15', saat: 14, gun: 3 });
  // UTC'de hâlâ Pazar 23:30; Brüksel'de Pazartesi 00:30
  assert.deepEqual(bruksel(z('2026-11-08T23:30:00Z')), { tarih: '2026-11-09', saat: 0, gun: 1 });
});

test('isoHafta: hafta yılı Perşembe\'nin yılı; Pazartesi başlar', () => {
  assert.equal(isoHafta('2026-11-08'), '2026-W45'); // Pazar
  assert.equal(isoHafta('2026-11-09'), '2026-W46'); // Pazartesi
  assert.equal(isoHafta('2026-03-29'), '2026-W13');
  assert.equal(isoHafta('2027-01-01'), '2026-W53'); // 2026 53 haftalık yıl
  assert.equal(isoHafta('2024-12-30'), '2025-W01');
  assert.equal(isoHafta('2021-01-03'), '2020-W53');
  assert.throws(() => isoHafta('2026-1-1'), RangeError);
});

test('zamanUygunMu: gün/saat Brüksel saatine göre; eksik tercih = Pazar 18', () => {
  assert.equal(zamanUygunMu({ gun: 0, saat: 18 }, z('2026-11-08T17:00:00Z')), true); // kış: 18.00
  assert.equal(zamanUygunMu({ gun: 0, saat: 18 }, z('2026-11-08T18:00:00Z')), false);
  assert.equal(zamanUygunMu({ gun: 0, saat: 18 }, z('2026-07-12T16:00:00Z')), true); // yaz: 18.00 = 16 UTC
  assert.equal(zamanUygunMu({}, z('2026-11-08T17:00:00Z')), true);
  assert.equal(zamanUygunMu(undefined, z('2026-11-08T17:00:00Z')), true);
  assert.equal(zamanUygunMu({ gun: 3, saat: 18 }, z('2026-11-08T17:00:00Z')), false);
  assert.equal(zamanUygunMu({ gun: 9, saat: 99 }, z('2026-11-08T17:00:00Z')), true, 'geçersiz değer varsayılana düşer');
});

test('saat değişimi: ilkbahar atlaması 02.00 seçen kullanıcıyı kaçırmaz', () => {
  // 29 Mart 2026 Pazar: 01:00 UTC'de saat 02:00 CET → 03:00 CEST olur.
  assert.deepEqual(haftalikSaatler(z('2026-03-29T00:00:00Z')), [1]);
  assert.deepEqual(haftalikSaatler(z('2026-03-29T01:00:00Z')), [3, 2]);
  assert.deepEqual(haftalikSaatler(z('2026-03-29T02:00:00Z')), [4]);
  assert.equal(zamanUygunMu({ gun: 0, saat: 2 }, z('2026-03-29T01:00:00Z')), true);
  assert.equal(zamanUygunMu({ gun: 0, saat: 2 }, z('2026-03-29T02:00:00Z')), false);
  assert.equal(zamanUygunMu({ gun: 0, saat: 3 }, z('2026-03-29T01:00:00Z')), true);
});

test('saat değişimi: sonbaharda 02.00 iki kez eşleşir ama kuyruk kimliği aynı (tekrar yok)', () => {
  // 25 Ekim 2026 Pazar: 01:00 UTC'de 03:00 CEST → 02:00 CET (02.00 iki kez yaşanır).
  const ilk = z('2026-10-25T00:00:00Z'), ikinci = z('2026-10-25T01:00:00Z');
  assert.deepEqual(haftalikSaatler(ilk), [2]);
  assert.deepEqual(haftalikSaatler(ikinci), [2]);
  assert.equal(zamanUygunMu({ gun: 0, saat: 2 }, ilk), true);
  assert.equal(zamanUygunMu({ gun: 0, saat: 2 }, ikinci), true);
  assert.equal(kuyrukKimligi('u1', ilk), kuyrukKimligi('u1', ikinci));
});

test('kuyrukKimligi: kullanıcı + ISO haftası; hafta sınırı Brüksel gece yarısı; uid doğrulanır', () => {
  assert.equal(kuyrukKimligi('u1', z('2026-11-08T17:00:00Z')), 'h_u1_2026-W45');
  assert.equal(kuyrukKimligi('u1', z('2026-11-08T22:30:00Z')), 'h_u1_2026-W45'); // Pazar 23:30 Brüksel
  assert.equal(kuyrukKimligi('u1', z('2026-11-08T23:30:00Z')), 'h_u1_2026-W46'); // Pazartesi 00:30 Brüksel
  assert.notEqual(kuyrukKimligi('u1', z('2026-11-08T17:00:00Z')), kuyrukKimligi('u2', z('2026-11-08T17:00:00Z')));
  assert.throws(() => kuyrukKimligi('a/b', 0), RangeError);
  assert.throws(() => kuyrukKimligi('', 0), RangeError);
});

test('ozetle: son 7 gün, madde sayısı, tekrarı gelen madde ve sonraki adım', () => {
  const simdi = z('2026-11-08T17:00:00Z'); // Brüksel 2026-11-08
  const bos = ozetle({}, simdi);
  assert.deepEqual(bos, { gun: 0, madde: 0, tekrar: 0, sonraki: 'ezber' });

  const ezber = { maddeler: { a: { sonraki: '2026-11-07' }, b: { sonraki: '2026-11-08' }, c: { sonraki: '2026-11-20' }, d: {} }, gunler: ['2026-11-01', '2026-11-02', '2026-11-08'] };
  const bilgi = { maddeler: { k1: {} }, gunler: ['2026-11-08', '2026-11-05', '2026-10-30'] };
  const o = ozetle({ ezber, bilgi }, simdi);
  // 7 gün penceresi: 02…08 Kasım → 02, 05, 08 (01 Kasım ve 30 Ekim dışarıda; 08 iki belgede tek sayılır)
  assert.equal(o.gun, 3);
  assert.equal(o.madde, 5);
  assert.equal(o.tekrar, 2, 'bugün dahil geçmiş tarihler');
  assert.equal(o.sonraki, 'tekrar');

  assert.equal(ozetle({ ezber: { maddeler: { a: {} } } }, simdi).sonraki, 'bilgi');
  assert.equal(ozetle({ ezber: { maddeler: { a: {} } }, bilgi: { maddeler: { b: {} } } }, simdi).sonraki, 'yol');
  assert.equal(ozetle({ ezber: { maddeler: { a: {} } }, bilgi: { maddeler: { b: {} } }, yol: { maddeler: { c: {} } } }, simdi).sonraki, 'devam');
});

test('ozetle: bozuk veri sayılmaz, hata atmaz', () => {
  const o = ozetle({ ezber: { maddeler: [1, 2], gunler: 'x' }, bilgi: { maddeler: 'a', gunler: [1, null, '2026-13-99x', '2026-11-08'] }, yol: null }, z('2026-11-08T17:00:00Z'));
  assert.deepEqual(o, { gun: 1, madde: 0, tekrar: 0, sonraki: 'ezber' });
});

const SIRR = 'deneme-sirri-en-az-16-karakter';
test('token: üret → doğrula; yanlış sır, kurcalanmış uid/bitiş/imza ve bozuk biçim reddedilir', () => {
  const simdi = z('2026-11-08T17:00:00Z');
  const t = tokenUret('uid_1-A', SIRR, simdi);
  assert.deepEqual(tokenDogrula(t, SIRR, simdi), { ok: true, uid: 'uid_1-A' });
  assert.deepEqual(tokenDogrula(t, SIRR, simdi + 179 * 86_400_000), { ok: true, uid: 'uid_1-A' });

  const [uid, bitis, imza] = t.split('.');
  assert.deepEqual(tokenDogrula(t, SIRR + 'x', simdi), { ok: false, neden: 'imza' });
  assert.deepEqual(tokenDogrula(`baska.${bitis}.${imza}`, SIRR, simdi), { ok: false, neden: 'imza' });
  assert.deepEqual(tokenDogrula(`${uid}.${Number(bitis) + 1}.${imza}`, SIRR, simdi), { ok: false, neden: 'imza' });
  assert.deepEqual(tokenDogrula(`${uid}.${bitis}.${imza.slice(0, -1)}${imza.endsWith('A') ? 'B' : 'A'}`, SIRR, simdi), { ok: false, neden: 'imza' });
  for (const kotu of ['', 'a.b', 'a.1.2.3', `${uid}.${bitis}.kisa`, `../x.${bitis}.${imza}`, null, undefined, 42, 'x'.repeat(300)]) {
    assert.deepEqual(tokenDogrula(kotu, SIRR, simdi), { ok: false, neden: 'bicim' }, String(kotu));
  }
});

test('token: süre dolunca reddedilir (sınırda dahil); sır kısaysa üretim/doğrulama hata verir', () => {
  const simdi = z('2026-11-08T17:00:00Z');
  const t = tokenUret('u1', SIRR, simdi);
  assert.deepEqual(tokenDogrula(t, SIRR, simdi + BAGLANTI_OMRU_MS), { ok: false, neden: 'suresi-doldu' });
  assert.deepEqual(tokenDogrula(t, SIRR, simdi + BAGLANTI_OMRU_MS + 1), { ok: false, neden: 'suresi-doldu' });
  assert.deepEqual(tokenDogrula(tokenUret('u1', SIRR, simdi, -1), SIRR, simdi), { ok: false, neden: 'suresi-doldu' });
  assert.throws(() => tokenUret('u1', 'kisa', simdi), /abonelik-sirri-eksik/);
  assert.throws(() => tokenDogrula(t, '', simdi), /abonelik-sirri-eksik/);
  assert.throws(() => tokenUret('a.b', SIRR, simdi), RangeError);
});

test('dilSec: Accept-Language\'den desteklenen ilk dil, yoksa tr', () => {
  assert.equal(dilSec('nl-BE,nl;q=0.9,en;q=0.5'), 'nl');
  assert.equal(dilSec('es,fr-FR;q=0.8'), 'fr');
  assert.equal(dilSec('ja'), 'tr');
  assert.equal(dilSec(undefined), 'tr');
});

test('abonelikSayfasi: beş dil, iki sonuç; satır içi stil/betik/form yok (sıkı CSP); doğru lang ve hesap bağlantısı', () => {
  const basliklar = new Set();
  for (const dil of EPOSTA_DILLERI) {
    for (const sonuc of ['tamam', 'gecersiz']) {
      const h = abonelikSayfasi(dil, sonuc);
      assert.match(h, new RegExp(`<html lang="${dil}">`));
      assert.match(h, new RegExp(`href="/${dil}/hesap/"`));
      assert.doesNotMatch(h, /<script|<form|<style|style=|\son[a-z]+=|<img|<link/i, `${dil}/${sonuc}`);
      basliklar.add(h);
    }
  }
  assert.equal(basliklar.size, 10, 'her dil ve sonuç farklı metin');
  assert.match(abonelikSayfasi('tr', 'tamam'), /Haftalık e-posta kapatıldı/);
  assert.match(abonelikSayfasi('de', 'gecersiz'), /Ungültiger Link/);
});
