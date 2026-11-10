/**
 * «Abdest ve Namaz» ilerlemesi (10 Kasım 2026; src/lib/ilim-yolu/ibadet-ilerleme.ts, egitim/src/lib/hesap/ibadet-esitle.ts). Bağlayıcı: yedi konu en
 * çok 7 anahtara sığar (kuralın 120 sınırı), bit işaretleri geri alınmaz, birleştirme VEYA'dır (değişme, idempotent), bozuk girdi temizlenir,
 * buluta yalnız `v, maddeler, guncelleme` gider, cihaz anahtarı ham uid taşımaz, eşitleme değişiklik yoksa yazmaz ve belge adı `ibadet`tir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { BellekDepo, SUNUCU_ZAMANI, kullanici, sahteFirebase, yukle } from './egitim/hesap-sahte.mjs';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ibadet-ilerleme-test.mjs');
await build({ entryPoints: ['src/lib/ilim-yolu/ibadet-ilerleme.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const m = await import(pathToFileURL(cikti).href);
const esitle = await yukle('ibadet-esitle-test', ['hesap/ibadet-esitle', 'hesap/isaret']);

test('belge adı ibadet; yedi konu; her konunun çalışmaları slot listesine sığar', () => {
  assert.equal(m.CALISMA_BELGESI, 'ibadet');
  assert.deepEqual([...m.KONULAR], ['abdest', 'namaz', 'sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']);
  for (const k of m.KONULAR) {
    assert.ok(m.KONU_SLOTLARI[k].length > 0 && m.KONU_SLOTLARI[k].length <= m.AZAMI_UZUNLUK, k);
    for (const s of m.KONU_SLOTLARI[k]) assert.ok(m.SLOTLAR.includes(s), `${k}: ${s}`);
  }
});

test('hepsini hatasız işaretleyince bulut yükü kuralın sınırlarında kalır (≤ 7 anahtar, ≤ 5 karakter)', () => {
  let il = m.bos();
  for (const k of m.KONULAR) for (const s of m.KONU_SLOTLARI[k]) il = m.isaretle(il, k, s, m.TAMAM | m.HATASIZ);
  const yuk = m.bulutYuku(il, 'zaman');
  assert.deepEqual(Object.keys(yuk).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.ok(Object.keys(yuk.maddeler).length <= 7);
  for (const d of Object.values(yuk.maddeler)) assert.ok(d.length <= 5);
  for (const k of m.KONULAR) assert.equal(m.konuSayimi(il, k).tamam, true, k);
  assert.equal(m.durum(il, 'abdest', 'hukum'), 3);
});

test('işaretleme: geri alınmaz, yalnız ekler; geçersiz konu/slot durumu değiştirmez', () => {
  let il = m.isaretle(m.bos(), 'abdest', 'sirala', m.TAMAM);
  assert.equal(m.durum(il, 'abdest', 'sirala'), 1);
  il = m.isaretle(il, 'abdest', 'sirala', m.HATASIZ);
  assert.equal(m.durum(il, 'abdest', 'sirala'), 3);
  il = m.isaretle(il, 'abdest', 'sirala', 0);
  assert.equal(m.durum(il, 'abdest', 'sirala'), 3, 'sıfır bit geri almaz');
  assert.equal(il.maddeler.abdest, '03', 'ilk slot boş, ikincisi 3');
  const ayni = m.isaretle(il, 'bilinmeyen', 'sirala', 3);
  assert.equal(ayni, il);
  assert.equal(m.isaretle(il, 'abdest', 'yok', 3), il);
  assert.equal(m.durum(il, 'bilinmeyen', 'sirala'), 0);
});

test('birleştirme: bit düzeyinde VEYA, değişmeli ve idempotent; bozuk girdi temizlenir', () => {
  const a = m.isaretle(m.isaretle(m.bos(), 'namaz', 'ogren', 1), 'sabah', 'hukum', 3);
  const b = m.isaretle(m.isaretle(m.bos(), 'namaz', 'sirala', 1), 'sabah', 'hukum', 1);
  const ab = m.birlestir(a, b);
  assert.deepEqual(ab, m.birlestir(b, a));
  assert.deepEqual(m.birlestir(ab, ab), ab);
  assert.equal(m.durum(ab, 'namaz', 'ogren'), 1);
  assert.equal(m.durum(ab, 'namaz', 'sirala'), 1);
  assert.equal(m.durum(ab, 'sabah', 'hukum'), 3);
  const kirli = m.temizle({ maddeler: { abdest: '12x9', namaz: 5, diger: '111', ogle: '0000000000', sabah: '3'.repeat(50) } });
  assert.equal(kirli.maddeler.abdest, '12', 'geçersiz karakterler 0 olur, sondaki sıfırlar atılır');
  assert.equal(kirli.maddeler.namaz, undefined);
  assert.equal(kirli.maddeler.diger, undefined);
  assert.equal(kirli.maddeler.ogle, undefined, 'yalnız sıfırdan oluşan dize tutulmaz');
  assert.equal(kirli.maddeler.sabah.length, m.AZAMI_UZUNLUK);
  for (const kotu of [null, 5, 'x', [], { maddeler: [] }, { maddeler: 'x' }]) assert.deepEqual(m.temizle(kotu), m.bos());
});

test('depo: okuma/yazma; bozuk JSON ve kapalı depo sessizce boş döner; cihaz anahtarı ham uid taşımaz', () => {
  const depo = new BellekDepo();
  const il = m.isaretle(m.bos(), 'aksam', 'ogren', 1);
  assert.equal(m.yaz(depo, il), true);
  assert.deepEqual(m.oku(depo), il);
  depo.setItem(m.ANAHTAR, '{bozuk');
  assert.deepEqual(m.oku(depo), m.bos());
  assert.deepEqual(m.oku(null), m.bos());
  assert.equal(m.yaz(null, il), false);
  assert.throws(() => m.kullaniciAnahtari('u-deneme-1'), TypeError, 'ham uid kabul edilmez');
  assert.equal(m.kullaniciAnahtari('abcdef0123456789'), `${m.ANAHTAR}:u:abcdef0123456789`);
});

test('eşitleme: hesap kopyasıyla birleşir; değişiklik yoksa yazmaz; belge adı calisma/ibadet; oturum yoksa dokunmaz', async () => {
  const depo = new BellekDepo();
  const ozet = await esitle.uidOzeti('u-deneme-1');
  const anahtar = m.kullaniciAnahtari(ozet);
  m.yaz(depo, m.isaretle(m.bos(), 'abdest', 'eslestir', 1), anahtar);
  const yol = 'kullanicilar/u-deneme-1/calisma/ibadet';
  const { f, k, bulut } = sahteFirebase({ user: kullanici('u-deneme-1'), belgeler: { [yol]: { v: 1, maddeler: { namaz: '03' }, guncelleme: 'eski' } } });
  const sonuc = await esitle.ibadetEsitle(f, { depo, cevrimici: () => true });
  assert.equal(sonuc.durum, 'tamam');
  assert.equal(sonuc.yazildi, true);
  const yerel = m.oku(depo, anahtar);
  assert.equal(m.durum(yerel, 'abdest', 'eslestir'), 1);
  assert.equal(m.durum(yerel, 'namaz', 'sirala'), 3);
  const belge = bulut.get(yol);
  assert.deepEqual(Object.keys(belge).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.equal(belge.guncelleme, SUNUCU_ZAMANI);
  assert.equal(belge.maddeler.abdest, '001');
  assert.equal(belge.maddeler.namaz, '03');
  const ikinci = await esitle.ibadetEsitle(f, { depo, cevrimici: () => true });
  assert.equal(ikinci.yazildi, false);
  assert.equal(k.yazimlar.length, 1, 'ikinci eşitleme buluta yazmadı');
  assert.equal((await esitle.ibadetEsitle(sahteFirebase({ user: null }).f, { depo, cevrimici: () => true })).durum, 'oturum-yok');
  const once = JSON.stringify(m.oku(depo, anahtar));
  assert.equal((await esitle.ibadetEsitle(f, { depo, cevrimici: () => false })).durum, 'cevrimdisi');
  assert.equal(JSON.stringify(m.oku(depo, anahtar)), once);
});

test('eklenecekSayisi: yalnız hesapta olmayan bitler sayılır; girişte soru metni için', () => {
  const a = m.isaretle(m.isaretle(m.bos(), 'abdest', 'ogren', m.TAMAM), 'namaz', 'sirala', m.TAMAM | m.HATASIZ);
  assert.equal(m.eklenecekSayisi(a, m.bos()), 2);
  assert.equal(m.eklenecekSayisi(a, a), 0);
  assert.equal(m.eklenecekSayisi(a, m.isaretle(m.bos(), 'abdest', 'ogren', m.TAMAM)), 1);
  assert.equal(m.eklenecekSayisi(m.bos(), a), 0);
});
