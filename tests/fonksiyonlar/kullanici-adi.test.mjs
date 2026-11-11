// İlim Yolu Dilim 1 — kullaniciAdiAl: biçim, ayrılmış adlar, çakışma, 30 günde bir değişiklik, bırakılan adın 30 gün ayrılması.
import { before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { db, temizle, hazir, cagir, basarili, kullaniciAc, cocukOturumu, Timestamp, GUN } from './yardimci.mjs';

before(() => hazir(['kullaniciAdiAl']));
beforeEach(temizle);

const ad = async (yol) => (await db.doc(yol).get());
const geriAl = (uid, gun) => db.doc(`kullanicilar/${uid}`).update({ adDegisti: Timestamp.fromMillis(Date.now() - gun * GUN) });

test('ad alınır: normalleştirilir, eşlemesi ve profili sunucu yazar', async () => {
  const t = await kullaniciAc('u1');
  assert.deepEqual(await basarili('kullaniciAdiAl', { ad: ' Ali.Veli ' }, t), { ad: 'ali.veli' });
  assert.equal((await ad('kullaniciAdlari/ali.veli')).get('uid'), 'u1');
  const p = await ad('kullanicilar/u1');
  assert.equal(p.get('ad'), 'ali.veli');
  assert.equal(p.get('tur'), 'genel');
  assert.ok(p.get('olusturma') instanceof Timestamp);
  assert.equal(p.get('adDegisti'), undefined, 'ilk ad bir değişiklik sayılmaz');
  // Aynı ad yeniden: değişiklik yok, hata yok.
  assert.deepEqual(await basarili('kullaniciAdiAl', { ad: 'ALI.VELI' }, t), { ad: 'ali.veli' });
});

test('başkasının adı alınamaz (büyük/küçük harf farkı da aynı ad)', async () => {
  await basarili('kullaniciAdiAl', { ad: 'yildiz' }, await kullaniciAc('u1'));
  const c = await cagir('kullaniciAdiAl', { ad: 'YILDIZ' }, await kullaniciAc('u2'));
  assert.equal(c.durum, 409);
  assert.equal(c.hata.status, 'ALREADY_EXISTS');
});

test('biçim ve ayrılmış adlar: invalid-argument + details.neden', async () => {
  const t = await kullaniciAc('u1');
  const neden = async (girdi) => {
    const c = await cagir('kullaniciAdiAl', { ad: girdi }, t);
    assert.equal(c.hata?.status, 'INVALID_ARGUMENT', girdi);
    return c.hata.details?.neden;
  };
  assert.equal(await neden('ab'), 'kisa');
  assert.equal(await neden('a'.repeat(25)), 'uzun');
  assert.equal(await neden('_abc'), 'bas');
  assert.equal(await neden('ali veli'), 'karakter');
  for (const ayrilmis of ['admin', 'Hoca', 'imam.ali', 'ulu.camii', 'diyanetbelcika', 'yonetim', 'test', 'null', 'undefined',
    'root42', 'bdv', 'ilimyolu', 'shit42', 'ali.amk', 'merde', 'connard99', 'scheisse', 'klootzak',
    'h0ca', '1mam', 'u1ucamii', 'adm1n', 'd1yanet', 'r00t']) { // F-13: rakam benzeri harfler
    assert.equal(await neden(ayrilmis), 'ayrilmis', ayrilmis);
  }
  // Kısa küfürler yalnız tam parça olarak reddedilir: başka kelimenin içinde geçen masum adlar kabul edilir.
  assert.deepEqual(await basarili('kullaniciAdiAl', { ad: 'nazif.website' }, t), { ad: 'nazif.website' });
  assert.equal((await db.collection('kullaniciAdlari').get()).size, 1, 'reddedilen adlar yazılmadı');
});

test('ad değişikliği 30 günde bir; eski ad 30 gün yalnız eski sahibine ayrılı', async () => {
  const t1 = await kullaniciAc('u1');
  const t2 = await kullaniciAc('u2');
  await basarili('kullaniciAdiAl', { ad: 'ali.veli' }, t1);
  assert.deepEqual(await basarili('kullaniciAdiAl', { ad: 'ali2' }, t1), { ad: 'ali2' });
  const mezar = await ad('kullaniciAdlari/ali.veli');
  assert.equal(mezar.get('uid'), 'u1');
  assert.ok(mezar.get('birakildi') instanceof Timestamp);
  assert.ok(Math.abs(mezar.get('bitis').toMillis() - Date.now() - 30 * GUN) < 60_000);
  assert.ok((await ad('kullanicilar/u1')).get('adDegisti') instanceof Timestamp);

  const sinir = await cagir('kullaniciAdiAl', { ad: 'ali3' }, t1);
  assert.equal(sinir.durum, 429);
  assert.equal(sinir.hata.status, 'RESOURCE_EXHAUSTED');
  assert.ok(Date.parse(sinir.hata.details.sonraki) > Date.now() + 29 * GUN);

  // Bırakılan ad: başkası alamaz, eski sahibi (30 gün dolunca yeniden değiştirebildiğinde) geri alabilir.
  assert.equal((await cagir('kullaniciAdiAl', { ad: 'ali.veli' }, t2)).durum, 409);
  await geriAl('u1', 31);
  assert.deepEqual(await basarili('kullaniciAdiAl', { ad: 'ali.veli' }, t1), { ad: 'ali.veli' });
  assert.equal((await ad('kullaniciAdlari/ali.veli')).get('birakildi'), undefined);

  // Bırakılan adın süresi dolunca herkes alabilir.
  await geriAl('u1', 31);
  await basarili('kullaniciAdiAl', { ad: 'ali4' }, t1);
  await db.doc('kullaniciAdlari/ali.veli').update({ bitis: Timestamp.fromMillis(Date.now() - 1000) });
  assert.deepEqual(await basarili('kullaniciAdiAl', { ad: 'ali.veli' }, t2), { ad: 'ali.veli' });
  assert.equal((await ad('kullaniciAdlari/ali.veli')).get('uid'), 'u2');
});

test('oturumsuz ve çocuk hesabı ad alamaz', async () => {
  assert.equal((await cagir('kullaniciAdiAl', { ad: 'kimse' })).hata.status, 'UNAUTHENTICATED');
  const c = await cagir('kullaniciAdiAl', { ad: 'cocuk.ad' }, await cocukOturumu());
  assert.equal(c.hata.status, 'PERMISSION_DENIED');
  assert.equal((await ad('kullaniciAdlari/cocuk.ad')).exists, false);
});

test('G-08: uid başına günlük ad denemesi sınırı (30): sonrası 429 ad-sorgu-sinirli; başka kullanıcı etkilenmez', async () => {
  await basarili('kullaniciAdiAl', { ad: 'yildiz' }, await kullaniciAc('u1'));
  const t2 = await kullaniciAc('u2');
  for (let i = 0; i < 30; i++) assert.equal((await cagir('kullaniciAdiAl', { ad: 'yildiz' }, t2)).durum, 409, `deneme ${i + 1}`);
  const sinir = await cagir('kullaniciAdiAl', { ad: 'yildiz' }, t2);
  assert.equal(sinir.durum, 429);
  assert.equal(sinir.hata.status, 'RESOURCE_EXHAUSTED');
  assert.equal(sinir.hata.message, 'ad-sorgu-sinirli');
  assert.ok(Date.parse(sinir.hata.details.sonraki) > Date.now() + 23 * 3_600_000);
  assert.deepEqual(await basarili('kullaniciAdiAl', { ad: 'baska.ad' }, await kullaniciAc('u3')), { ad: 'baska.ad' });
});
