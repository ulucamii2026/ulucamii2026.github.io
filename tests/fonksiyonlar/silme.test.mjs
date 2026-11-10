// İlim Yolu Dilim 1 — hesap silme (30 gün bekletme + günlük silmeTara) ve aylık hareketsizTara (varsayılan kuru çalışma).
// Zamanlanmış işlevler emülatörde tetiklenmez: derlenmiş paket bu süreçte yüklenir ve işleyici `.run()` ile doğrudan çalıştırılır
// (aynı emülatörlere bağlanır; yardimci.mjs önce emülatör adreslerini doğrular).
import { before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { db, auth, gerek, temizle, hazir, cagir, basarili, kullaniciAc, cocukOturumu, Timestamp, GUN } from './yardimci.mjs';

const islevler = gerek('./lib/index.js');
before(() => hazir(['hesabimiSil', 'hesapSilmeIptal', 'kullaniciAdiAl']));
beforeEach(temizle);

const var_mi = async (yol) => (await db.doc(yol).get()).exists;
const authVar = (uid) => auth.getUser(uid).then(() => true, () => false);
const once = (gun) => Timestamp.fromMillis(Date.now() - gun * GUN);

test('hesabimiSil 30 gün sonrasını işaretler, hesapSilmeIptal geri alır; çocuk bu yolu kullanamaz', async () => {
  const t = await kullaniciAc('u1');
  const { silinecek } = await basarili('hesabimiSil', null, t);
  assert.ok(Math.abs(Date.parse(silinecek) - Date.now() - 30 * GUN) < 60_000);
  assert.equal((await db.doc('kullanicilar/u1').get()).get('silinecek').toDate().toISOString(), silinecek);
  assert.deepEqual(await basarili('hesapSilmeIptal', null, t), { ok: true });
  assert.equal((await db.doc('kullanicilar/u1').get()).get('silinecek'), undefined);
  assert.equal((await cagir('hesabimiSil', null, await cocukOturumu())).hata.status, 'PERMISSION_DENIED');
  assert.equal((await cagir('hesabimiSil')).hata.status, 'UNAUTHENTICATED');
});

test('silmeTara: süresi gelen hesabı bütünüyle siler; gelmeyene ve çocuğa dokunmaz', async () => {
  const t = await kullaniciAc('u1');
  await basarili('kullaniciAdiAl', { ad: 'giden.kisi' }, t);
  await basarili('hesabimiSil', null, t);
  await db.doc('kullanicilar/u1').update({ silinecek: once(1), ref: 'R9' });
  await db.doc('kullanicilar/u1/calisma/ezber').set({ maddeler: {} });
  await db.doc('kullanicilar/u1/ozel/hassas').set({ muhtedi: false });
  await db.doc('paylasimlar/u1').set({ hocalar: [], zaman: Timestamp.now() });
  await db.doc('kullaniciAdlari/eski.ad').set({ uid: 'u1', birakildi: Timestamp.now(), bitis: Timestamp.now() });
  await db.doc('ogrenciHesaplari/R9').set({ yetiskinUid: 'u1', yetiskinAd: 'giden.kisi', olusturma: Timestamp.now() });
  await db.doc('epostaKuyrugu/e1').set({ tur: 'hareketsiz', uid: 'u1', dil: 'tr', zaman: Timestamp.now() });

  await basarili('hesabimiSil', null, await kullaniciAc('u2')); // 30 gün sonra: kalır
  await kullaniciAc('u3'); // silme istemedi: kalır
  await db.doc('kullanicilar/u3').set({ ad: 'kalan', tur: 'genel' });
  await db.doc('kullanicilar/c_x').set({ ad: 'cocuk', tur: 'cocuk', ref: 'R1', silinecek: once(1) });

  await islevler.silmeTara.run({ scheduleTime: new Date().toISOString() });

  assert.equal(await authVar('u1'), false);
  for (const yol of ['kullanicilar/u1', 'kullanicilar/u1/calisma/ezber', 'kullanicilar/u1/ozel/hassas', 'paylasimlar/u1',
    'kullaniciAdlari/giden.kisi', 'kullaniciAdlari/eski.ad', 'epostaKuyrugu/e1']) assert.equal(await var_mi(yol), false, yol);
  const oh = (await db.doc('ogrenciHesaplari/R9').get()).data();
  assert.equal(oh.yetiskinUid, undefined);
  assert.equal(oh.yetiskinAd, undefined);
  assert.equal(await authVar('u2'), true);
  assert.equal(await var_mi('kullanicilar/u2'), true);
  assert.equal(await var_mi('kullanicilar/u3'), true);
  assert.equal(await var_mi('kullanicilar/c_x'), true, 'çocuk hesabı hoca yolundan silinir');
});

test('hareketsizTara: varsayılan kuru çalışma hiçbir şeyi değiştirmez; ILIM_SIL_GERCEK=1 uyarır ve siler', async () => {
  const ay = (n) => { const d = new Date(); d.setUTCMonth(d.getUTCMonth() - n); return Timestamp.fromDate(d); };
  for (const uid of ['eski', 'yeni', 'uyarilmis', 'donen', 'bekleyen']) await auth.createUser({ uid, email: `${uid}@example.test`, emailVerified: true });
  await auth.createUser({ uid: 'adressiz' });
  await db.doc('kullanicilar/adressiz').set({ ad: 'adressiz', tur: 'genel', sonGiris: ay(25) });
  // Uyarısı kuyrukta henüz gitmemiş hesap (GAS gecikti) silinmez; gitmiş olan silinir.
  await db.doc('kullanicilar/bekleyen').set({ ad: 'bekleyen', tur: 'genel', sonGiris: ay(26), hareketsizUyari: once(31) });
  await db.doc('epostaKuyrugu/z_bekleyen').set({ tur: 'hareketsiz', uid: 'bekleyen', durum: 'bekliyor' });
  await db.doc('epostaKuyrugu/z_uyarilmis').set({ tur: 'hareketsiz', uid: 'uyarilmis', durum: 'gonderildi' });
  await db.doc('kullanicilar/eski').set({ ad: 'eski', tur: 'genel', dil: 'fr', sonGiris: ay(25) });
  await db.doc('kullanicilar/yeni').set({ ad: 'yeni', tur: 'genel', dil: 'tr', sonGiris: ay(1) });
  await db.doc('kullanicilar/uyarilmis').set({ ad: 'uyarilmis', tur: 'genel', sonGiris: ay(26), hareketsizUyari: once(31) });
  await db.doc('kullanicilar/donen').set({ ad: 'donen', tur: 'genel', sonGiris: once(2), hareketsizUyari: once(31) });
  await db.doc('kullanicilar/c_eski').set({ ad: 'cocuk', tur: 'cocuk', ref: 'R1', sonGiris: ay(30) });
  await db.doc('kullanicilar/silinecek').set({ ad: 'sil', tur: 'genel', sonGiris: ay(30), silinecek: Timestamp.now() });

  const calistir = () => islevler.hareketsizTara.run({ scheduleTime: new Date().toISOString() });
  delete process.env.ILIM_SIL_GERCEK;
  await calistir();
  assert.equal((await db.doc('kullanicilar/eski').get()).get('hareketsizUyari'), undefined, 'kuru: uyarı yok');
  assert.deepEqual((await db.collection('epostaKuyrugu').get()).docs.map((d) => d.id).sort(), ['z_bekleyen', 'z_uyarilmis'], 'kuru: kuyruğa yeni belge yok');
  assert.equal((await db.doc('silinenUidler/uyarilmis').get()).exists, false, 'kuru: mezar taşı yok');
  assert.equal(await authVar('uyarilmis'), true, 'kuru: silme yok');
  assert.ok((await db.doc('kullanicilar/donen').get()).get('hareketsizUyari'), 'kuru: uyarı kaldırılmaz');

  process.env.ILIM_SIL_GERCEK = '1';
  try { await calistir(); } finally { delete process.env.ILIM_SIL_GERCEK; }
  assert.ok((await db.doc('kullanicilar/eski').get()).get('hareketsizUyari') instanceof Timestamp);
  // Uyarı belgesi GAS'ın boşaltabileceği biçimde: z_<uid>, adres, dil, giriş bağlantısı, durum bekliyor, TTL.
  const uyari = (await db.doc('epostaKuyrugu/z_eski').get()).data();
  assert.deepEqual(Object.keys(uyari).sort(), ['ad', 'baglanti', 'bitis', 'deneme', 'dil', 'durum', 'eposta', 'tur', 'uid', 'zaman']);
  assert.deepEqual({ ...uyari, zaman: undefined, bitis: undefined }, {
    tur: 'hareketsiz', uid: 'eski', eposta: 'eski@example.test', dil: 'fr', ad: 'eski', baglanti: 'https://egitim.ulucamii.be/fr/hesap/giris/',
    durum: 'bekliyor', deneme: 0, zaman: undefined, bitis: undefined,
  });
  assert.ok(uyari.bitis.toMillis() > Date.now() + 40 * GUN);
  assert.ok((await db.doc('kullanicilar/adressiz').get()).get('hareketsizUyari') instanceof Timestamp, 'adressiz: işaretlenir');
  assert.equal((await db.doc('epostaKuyrugu/z_adressiz').get()).exists, false, 'adressiz: kuyruk yok');
  assert.equal(await authVar('bekleyen'), true, 'uyarısı gitmemiş hesap silinmez');
  assert.equal(await var_mi('kullanicilar/bekleyen'), true);
  assert.equal(await authVar('uyarilmis'), false);
  assert.equal(await var_mi('silinenUidler/uyarilmis'), true, 'silinen uid mezar taşı alır (F-05)');
  assert.ok((await db.doc('silinenUidler/uyarilmis').get()).get('bitis') instanceof Timestamp);
  assert.equal(await var_mi('kullanicilar/uyarilmis'), false);
  assert.equal((await db.doc('kullanicilar/donen').get()).get('hareketsizUyari'), undefined, 'uyarıdan sonra giren kalır');
  assert.equal(await authVar('donen'), true);
  assert.equal((await db.doc('kullanicilar/yeni').get()).get('hareketsizUyari'), undefined);
  assert.equal((await db.doc('kullanicilar/c_eski').get()).get('hareketsizUyari'), undefined, 'çocuğa e-posta yok');
  assert.equal((await db.doc('kullanicilar/silinecek').get()).get('hareketsizUyari'), undefined, 'silinmeyi bekleyene uyarı yok');
});
