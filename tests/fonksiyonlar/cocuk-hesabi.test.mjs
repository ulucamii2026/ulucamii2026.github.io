// İlim Yolu Dilim 1 — çocuk hesabı: hoca yetkisi, hesap açma, şifre ve kartla giriş (custom token), kilit, IP sınırı,
// kart/şifre yenileme, oturum kapatma, giriş uçlarının kapıları.
import { before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  db, auth, temizle, hazir, cagir, basarili, kullaniciAc, hocaAc, cocukOturumu, giris, ozelTokenleGir, coz, kartAyir, Timestamp,
} from './yardimci.mjs';

const HOCA_ISLEVLERI = ['cocukHesabiAc', 'kartYenile', 'cocukSifreYenile', 'cocukOturumKapat', 'bagKoduUret', 'ogrenciHesaplariListe'];
before(() => hazir([...HOCA_ISLEVLERI, 'cocukGiris', 'kartGiris']));
beforeEach(async () => {
  await temizle();
  await db.doc('ogrenciler/R1').set({ ad: 'Ayşe Nur', soyad: 'DENEMEOGLU', dil: 'fr' });
  await db.doc('ogrenciler/R2').set({ ad: 'İsmail', soyad: 'DENEMEOGLU', dil: 'tr' });
});

const SIFRE_BICIMI = /^[a-z]{3,8}-[a-z]{3,8}-\d{2}$/;
async function hesapAc(ref = 'R1', veri = {}) {
  const t = await hocaAc();
  return { hoca: t, ...(await basarili('cocukHesabiAc', { ref, ...veri }, t)) };
}

test('hoca olmayan hoca işlevlerini çağıramaz (oturumsuz, sıradan, doğrulanmamış hoca, çocuk)', async () => {
  const siradan = await kullaniciAc('u1');
  await db.doc('hocalar/hoca-d').set({ adSoyad: 'Doğrulanmamış' });
  const dogrulanmamis = await kullaniciAc('hoca-d', { dogrulanmis: false });
  const cocuk = await cocukOturumu();
  for (const ad of HOCA_ISLEVLERI) {
    assert.equal((await cagir(ad, { ref: 'R1' })).hata?.status, 'UNAUTHENTICATED', `${ad} oturumsuz`);
    for (const [kim, t] of [['sıradan', siradan], ['doğrulanmamış hoca', dogrulanmamis], ['çocuk', cocuk]]) {
      assert.equal((await cagir(ad, { ref: 'R1' }, t)).hata?.status, 'PERMISSION_DENIED', `${ad} ${kim}`);
    }
  }
  assert.equal((await db.collection('ogrenciHesaplari').get()).size, 0);
  assert.equal((await auth.listUsers()).users.filter((u) => u.uid.startsWith('c_') && u.uid !== 'c_deneme0000000000000').length, 0);
});

test('hesap açılır: e-postasız Auth kullanıcısı, {rol, ref} yetkisi, ad ilk addan, gizli veri yalnız özet', async () => {
  const { uid, kullaniciAdi, sifre, kartUrl } = await hesapAc('R1', { dil: 'tr' });
  assert.match(uid, /^c_[a-z2-7]{20}$/);
  assert.match(kullaniciAdi, /^ayse\d{2}$/);
  assert.match(sifre, SIFRE_BICIMI);
  assert.match(kartUrl, /^https:\/\/egitim\.ulucamii\.be\/k\/#[A-Za-z0-9_-]{12}\.[A-Za-z0-9_-]{22}$/);

  const k = await auth.getUser(uid);
  assert.equal(k.email, undefined);
  assert.deepEqual(k.providerData, []);
  assert.deepEqual(k.customClaims, { rol: 'cocuk', ref: 'R1' });
  const profil = (await db.doc(`kullanicilar/${uid}`).get()).data();
  assert.deepEqual({ ...profil, olusturma: undefined }, { ad: kullaniciAdi, tur: 'cocuk', ref: 'R1', dil: 'tr', olusturma: undefined });
  assert.equal((await db.doc(`kullaniciAdlari/${kullaniciAdi}`).get()).get('uid'), uid);
  const oh = (await db.doc('ogrenciHesaplari/R1').get()).data();
  assert.equal(oh.cocukUid, uid);
  assert.equal(oh.kullaniciAdi, kullaniciAdi);
  assert.equal(oh.kartSurum, 1);
  const gizli = (await db.doc(`gizli/cocuk/hesaplar/${uid}`).get()).data();
  const { sir } = kartAyir(kartUrl);
  const metin = JSON.stringify(gizli);
  assert.ok(!metin.includes(sifre) && !metin.includes(sifre.replace(/-/g, '')) && !metin.includes(sir), 'düz şifre/sır saklanmaz');
  assert.equal(Buffer.from(gizli.tuz, 'base64').length, 16);
  assert.match(gizli.kartOzeti, /^[0-9a-f]{64}$/);

  // Dil verilmezse öğrencinin dili; ad Türkçe harfsiz («İsmail» → ismail).
  const ikinci = await basarili('cocukHesabiAc', { ref: 'R2' }, (await hocaAc('hoca-b')));
  assert.match(ikinci.kullaniciAdi, /^ismail\d{2}$/);
  assert.equal((await db.doc(`kullanicilar/${ikinci.uid}`).get()).get('dil'), 'tr');

  // Liste (hoca): iki kayıt, şifre/sır yok.
  const liste = await basarili('ogrenciHesaplariListe', null, await hocaAc('hoca-c'));
  assert.deepEqual(liste.map((x) => x.ref).sort(), ['R1', 'R2']);
  const r1 = liste.find((x) => x.ref === 'R1');
  assert.deepEqual(Object.keys(r1).sort(), ['cocuk', 'kartSurum', 'kullaniciAdi', 'olusturma', 'ref']);
  assert.equal(r1.cocuk, true);
  assert.ok(Date.parse(r1.olusturma) > Date.now() - 60_000);
});

test('ikinci hesap, kayıtsız öğrenci, kapanmış kayıt ve geçersiz girdi reddedilir', async () => {
  const { hoca } = await hesapAc('R1');
  assert.equal((await cagir('cocukHesabiAc', { ref: 'R1' }, hoca)).hata.status, 'ALREADY_EXISTS');
  assert.equal((await cagir('cocukHesabiAc', { ref: 'YOK-1' }, hoca)).hata.status, 'NOT_FOUND');
  await db.doc('portalSilme/R2').set({ islem: 'sil', zaman: Timestamp.now() });
  assert.equal((await cagir('cocukHesabiAc', { ref: 'R2' }, hoca)).hata.status, 'FAILED_PRECONDITION');
  assert.equal((await cagir('cocukHesabiAc', { ref: '../R2' }, hoca)).hata.status, 'INVALID_ARGUMENT');
  assert.equal((await cagir('cocukHesabiAc', { ref: 'R2', dil: 'xx' }, hoca)).hata.status, 'INVALID_ARGUMENT');
  // Yalnız R1'in çocuğu açıldı; reddedilenler yarım Auth kullanıcısı bırakmadı.
  assert.equal((await auth.listUsers()).users.filter((u) => u.uid.startsWith('c_')).length, 1);
});

test('şifreyle giriş → custom token → ID token: ref yetkisi var, e-posta yok; yazım farkları önemsiz', async () => {
  const { uid, kullaniciAdi, sifre } = await hesapAc();
  const g = await giris('cocukGiris', { kullaniciAdi: kullaniciAdi.toUpperCase(), sifre: sifre.replace(/-/g, ' ').toUpperCase() });
  assert.equal(g.durum, 200, JSON.stringify(g.govde));
  assert.equal(g.basliklar.get('cache-control'), 'no-store');
  const t = coz(await ozelTokenleGir(g.govde.token));
  assert.equal(t.user_id, uid);
  assert.equal(t.ref, 'R1');
  assert.equal(t.rol, 'cocuk');
  assert.equal(t.email, undefined);
  assert.ok((await db.doc(`kullanicilar/${uid}`).get()).get('sonGiris') instanceof Timestamp);
  assert.deepEqual((await giris('cocukGiris', { kullaniciAdi, sifre: 'elma-armut-00' })).govde, { hata: 'yanlis' });
});

test('8 hatalı şifre → 15 dk kilit (doğru şifre de 429); kilit bitince giriş açılır', async () => {
  const { uid, kullaniciAdi, sifre } = await hesapAc();
  for (let i = 1; i < 8; i++) assert.equal((await giris('cocukGiris', { kullaniciAdi, sifre: `yanlis-${i}` })).durum, 401, `deneme ${i}`);
  const sekiz = await giris('cocukGiris', { kullaniciAdi, sifre: 'yanlis-8' });
  assert.equal(sekiz.durum, 429);
  assert.equal(sekiz.govde.hata, 'kilit');
  const kalan = Date.parse(sekiz.govde.bitis) - Date.now();
  assert.ok(kalan > 14 * 60_000 && kalan <= 15 * 60_000, String(kalan));
  assert.equal((await giris('cocukGiris', { kullaniciAdi, sifre })).durum, 429, 'kilitliyken doğru şifre de reddedilir');
  await db.doc(`gizli/cocuk/hesaplar/${uid}`).update({ kilitBitis: Timestamp.fromMillis(Date.now() - 1000) });
  assert.equal((await giris('cocukGiris', { kullaniciAdi, sifre })).durum, 200);
  assert.equal((await db.doc(`gizli/cocuk/hesaplar/${uid}`).get()).get('hatalar'), 0);
});

test('IP başına saatte 30 hatalı deneme → 429; IP yalnız özet olarak saklanır', async () => {
  const { kullaniciAdi, sifre } = await hesapAc();
  for (let i = 0; i < 30; i++) assert.equal((await giris('cocukGiris', { kullaniciAdi: `yok${i}`, sifre: 'bir-iki-12' })).durum, 401);
  const g = await giris('cocukGiris', { kullaniciAdi, sifre });
  assert.equal(g.durum, 429);
  assert.equal(g.govde.hata, 'kilit');
  const ipler = await db.collection('gizli/giris/ipler').get();
  assert.equal(ipler.size, 1);
  assert.match(ipler.docs[0].id, /^[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(ipler.docs[0].data()).includes('127.0.0.1'));
});

test('kartla giriş; kart yenilenince eski kart geçersiz, sürüm artar', async () => {
  const { uid, kartUrl, hoca } = await hesapAc();
  const eski = kartAyir(kartUrl);
  const g = await giris('kartGiris', eski);
  assert.equal(g.durum, 200);
  assert.equal(coz(await ozelTokenleGir(g.govde.token)).ref, 'R1');
  assert.equal((await giris('kartGiris', { ...eski, sir: 'A'.repeat(22) })).durum, 401);
  assert.equal((await giris('kartGiris', { kartId: 'B'.repeat(12), sir: eski.sir })).durum, 401);

  const once = (await auth.getUser(uid)).tokensValidAfterTime;
  await new Promise((r) => setTimeout(r, 1100)); // tokensValidAfterTime saniye çözünürlüklü
  const { kartUrl: yeniUrl } = await basarili('kartYenile', { ref: 'R1' }, hoca);
  assert.notEqual(yeniUrl, kartUrl);
  assert.equal((await giris('kartGiris', eski)).durum, 401, 'eski kart');
  assert.equal((await giris('kartGiris', kartAyir(yeniUrl))).durum, 200, 'yeni kart');
  assert.equal((await db.doc('ogrenciHesaplari/R1').get()).get('kartSurum'), 2);
  assert.equal((await db.doc(`gizli/cocuk/hesaplar/${uid}`).get()).get('kartSurum'), 2);
  assert.notEqual((await auth.getUser(uid)).tokensValidAfterTime, once, 'kart yenileme oturumları kapatır');
});

test('şifre yenileme ve oturum kapatma', async () => {
  const { uid, kullaniciAdi, sifre, hoca } = await hesapAc();
  const { sifre: yeni } = await basarili('cocukSifreYenile', { ref: 'R1' }, hoca);
  assert.match(yeni, SIFRE_BICIMI);
  assert.equal((await giris('cocukGiris', { kullaniciAdi, sifre })).durum, 401, 'eski şifre');
  assert.equal((await giris('cocukGiris', { kullaniciAdi, sifre: yeni })).durum, 200, 'yeni şifre');
  const once = (await auth.getUser(uid)).tokensValidAfterTime;
  await new Promise((r) => setTimeout(r, 1100)); // tokensValidAfterTime saniye çözünürlüklü
  assert.deepEqual(await basarili('cocukOturumKapat', { ref: 'R1' }, hoca), { ok: true });
  assert.notEqual((await auth.getUser(uid)).tokensValidAfterTime, once);
  assert.equal((await cagir('kartYenile', { ref: 'R2' }, hoca)).hata.status, 'NOT_FOUND', 'hesabı olmayan öğrenci');
});

test('giriş uçlarının kapıları: yöntem, köken, içerik türü, boyut, alanlar', async () => {
  const g = { kullaniciAdi: 'ayse12', sifre: 'bir-iki-12' };
  for (const ad of ['cocukGiris', 'kartGiris']) {
    assert.equal((await giris(ad, null, { yontem: 'GET' })).durum, 405, `${ad} GET`);
    assert.equal((await giris(ad, g, { basliklar: { Origin: 'https://kotu.example' } })).durum, 403, `${ad} köken`);
    assert.equal((await giris(ad, JSON.stringify(g), { basliklar: { 'Content-Type': 'text/plain' } })).durum, 415, `${ad} tür`);
    assert.equal((await giris(ad, { ...g, dolgu: 'x'.repeat(3000) })).durum, 413, `${ad} boyut`);
    assert.equal((await giris(ad, { baska: 1 })).durum, 400, `${ad} alan`);
    // Yerel geliştirme kökeni kabul edilir (yanlış bilgi → 401/400, kapıdan geçti).
    assert.ok([400, 401].includes((await giris(ad, g, { basliklar: { Origin: 'http://localhost:4321' } })).durum), `${ad} localhost`);
  }
  const yok = await fetch('http://127.0.0.1:5185/demo-ulucamii/europe-west1/cocukGiris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
  assert.equal(yok.status, 403, 'Origin başlığı olmayan istek');
});
