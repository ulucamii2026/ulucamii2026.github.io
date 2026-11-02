// İlim Yolu Dilim 1 — bağlama kodu (tek kullanım, 14 gün), yetişkin bağı (ref yetkisi) ve öğrenci kaydı silinince
// (ogrenciler/{ref}; portalSilme yalnız işlem kilidi) çocuk hesabının tümden silinmesi, yetişkin bağının çözülmesi.
import { before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  db, auth, temizle, hazir, cagir, basarili, kullaniciAc, hocaAc, cocukOturumu, sifreyleGir, giris, coz, kartAyir, bekle, uyu,
  Timestamp, GUN,
} from './yardimci.mjs';

before(() => hazir(['bagKoduUret', 'hesabiBagla', 'ogrenciHesaplariListe', 'cocukHesabiAc', 'kullaniciAdiAl', 'cocukGiris', 'kartGiris']));
beforeEach(async () => {
  await temizle();
  await db.doc('ogrenciler/R1').set({ ad: 'Deneme', soyad: 'BIR', dil: 'tr' });
  await db.doc('ogrenciler/R2').set({ ad: 'Yetişkin', soyad: 'IKI', dil: 'fr' });
});
const ozet = (kod) => createHash('sha256').update(kod).digest('hex');
const yeniden = (uid) => sifreyleGir(`${uid}@example.test`); // yetki değişince token tazelenir

test('kod: 8 karakter Crockford (I/L/O/U yok), 14 gün; yalnız özeti saklanır', async () => {
  const hoca = await hocaAc();
  const { kod, bitis } = await basarili('bagKoduUret', { ref: 'R2' }, hoca);
  assert.match(kod, /^[0-9A-HJKMNP-TV-Z]{8}$/);
  assert.ok(Math.abs(Date.parse(bitis) - Date.now() - 14 * GUN) < 60_000);
  const belge = await db.doc(`bagKodlari/${ozet(kod)}`).get();
  assert.deepEqual({ ...belge.data(), bitis: undefined }, { ref: 'R2', kullanildi: false, uretenHoca: 'hoca-a', bitis: undefined });
  assert.equal((await db.collection('bagKodlari').get()).docs.some((d) => JSON.stringify(d.data()).includes(kod)), false);
  assert.equal((await cagir('bagKoduUret', { ref: 'YOK' }, hoca)).hata.status, 'NOT_FOUND');
});

test('yetişkin kodla bağlanır: ref yetkisi + kursYetiskin; kod ikinci kez kullanılamaz', async () => {
  const hoca = await hocaAc();
  const { kod } = await basarili('bagKoduUret', { ref: 'R2' }, hoca);
  let t = await kullaniciAc('y1');
  await basarili('kullaniciAdiAl', { ad: 'yetiskin.r2' }, t);
  // Elle yazım: küçük harf, tire, O→0 / I,L→1 okuması.
  const yazilan = `${kod.slice(0, 4)}-${kod.slice(4)}`.toLowerCase();
  assert.deepEqual(await basarili('hesabiBagla', { kod: yazilan }, t), { ref: 'R2' });
  t = await yeniden('y1');
  const jeton = coz(t);
  assert.equal(jeton.ref, 'R2');
  assert.equal(jeton.email, 'y1@example.test');
  assert.equal(jeton.rol, undefined);
  const p = (await db.doc('kullanicilar/y1').get()).data();
  assert.equal(p.ref, 'R2');
  assert.equal(p.tur, 'kursYetiskin');
  const oh = (await db.doc('ogrenciHesaplari/R2').get()).data();
  assert.equal(oh.yetiskinUid, 'y1');
  assert.equal(oh.yetiskinAd, 'yetiskin.r2');
  assert.equal((await db.doc(`bagKodlari/${ozet(kod)}`).get()).get('kullanildi'), true);

  const ikinci = await cagir('hesabiBagla', { kod }, await kullaniciAc('y2'));
  assert.equal(ikinci.hata.status, 'FAILED_PRECONDITION');
  assert.equal(ikinci.hata.details.neden, 'kullanildi');
  assert.equal((await auth.getUser('y2')).customClaims?.ref, undefined);

  const liste = await basarili('ogrenciHesaplariListe', null, hoca);
  assert.deepEqual(liste.map(({ olusturma, ...x }) => x), [{ ref: 'R2', cocuk: false, yetiskinAd: 'yetiskin.r2' }]);
});

test('süresi dolmuş, bilinmeyen, bozuk kod; doğrulanmamış e-posta ve çocuk reddedilir', async () => {
  const hoca = await hocaAc();
  const { kod } = await basarili('bagKoduUret', { ref: 'R2' }, hoca);
  await db.doc(`bagKodlari/${ozet(kod)}`).update({ bitis: Timestamp.fromMillis(Date.now() - 1000) });
  const t = await kullaniciAc('y1');
  const eski = await cagir('hesabiBagla', { kod }, t);
  assert.equal(eski.hata.status, 'FAILED_PRECONDITION');
  assert.equal(eski.hata.details.neden, 'suresi-doldu');
  assert.equal((await cagir('hesabiBagla', { kod: '0000AAAA' }, t)).hata.status, 'NOT_FOUND');
  assert.equal((await cagir('hesabiBagla', { kod: 'KISA' }, t)).hata.status, 'INVALID_ARGUMENT');

  const { kod: taze } = await basarili('bagKoduUret', { ref: 'R2' }, hoca);
  assert.equal((await cagir('hesabiBagla', { kod: taze }, await kullaniciAc('y3', { dogrulanmis: false }))).hata.status, 'PERMISSION_DENIED');
  assert.equal((await cagir('hesabiBagla', { kod: taze }, await cocukOturumu())).hata.status, 'PERMISSION_DENIED');
  assert.equal((await cagir('hesabiBagla', { kod: taze })).hata.status, 'UNAUTHENTICATED');
  assert.equal((await db.doc(`bagKodlari/${ozet(taze)}`).get()).get('kullanildi'), false, 'reddedilen denemeler kodu harcamaz');
});

test('aynı kayda yeni kod: bağ yeni hesaba geçer, eski hesabın yetkisi kalkar', async () => {
  const hoca = await hocaAc();
  const { kod: k1 } = await basarili('bagKoduUret', { ref: 'R2' }, hoca);
  await basarili('hesabiBagla', { kod: k1 }, await kullaniciAc('y1'));
  const { kod: k2 } = await basarili('bagKoduUret', { ref: 'R2' }, hoca);
  await basarili('hesabiBagla', { kod: k2 }, await kullaniciAc('y2'));
  assert.equal((await auth.getUser('y2')).customClaims.ref, 'R2');
  assert.equal((await auth.getUser('y1')).customClaims?.ref, undefined);
  assert.equal((await db.doc('kullanicilar/y1').get()).get('ref'), undefined);
  assert.equal((await db.doc('ogrenciHesaplari/R2').get()).get('yetiskinUid'), 'y2');
  // Başka bir kayda bağlı hesap ikinci bir kayda bağlanamaz.
  const { kod: k3 } = await basarili('bagKoduUret', { ref: 'R1' }, hoca);
  const baska = await cagir('hesabiBagla', { kod: k3 }, await yeniden('y2'));
  assert.equal(baska.hata.details.neden, 'baska-kayit');
});

test('öğrenci silinince (ogrenciler/{ref}) çocuk hesabı tümden silinir, yetişkin bağı çözülür; yalnız işlem kilidi (portalSilme) kapatmaz', async () => {
  const hoca = await hocaAc();
  const { uid, kullaniciAdi, sifre, kartUrl } = await basarili('cocukHesabiAc', { ref: 'R1' }, hoca);
  const r2 = await basarili('cocukHesabiAc', { ref: 'R2' }, hoca);
  const { kod } = await basarili('bagKoduUret', { ref: 'R1' }, hoca);
  await basarili('hesabiBagla', { kod }, await kullaniciAc('y1'));
  const { kod: bekleyen } = await basarili('bagKoduUret', { ref: 'R1' }, hoca);
  assert.equal((await giris('cocukGiris', { kullaniciAdi, sifre })).durum, 200);

  // «Yalnız ev çalışmaları» silme (src/lib/portal-idare.ts): kilit açılır ve kalkar, öğrenci kursta kalır. Kilit sürerken kod yok.
  await db.doc('portalSilme/R2').set({ islem: 'ev', zaman: Timestamp.now() });
  assert.equal((await cagir('bagKoduUret', { ref: 'R2' }, hoca)).hata.status, 'FAILED_PRECONDITION');
  await db.doc('portalSilme/R2').delete();

  // Tam silme: öğrenci profili silinir.
  await db.doc('ogrenciler/R1').delete();
  // Tetik işçisinin soğuk başlangıcı + önceki testlerin temizliğinden kalan silme olayları (her biri ogrenciler/* siler) sırada:
  // yüklü makinede 30 sn'ye yaklaştı (2 Kas 2026). Bekleme koşul gerçekleşince biter.
  await bekle(async () => !(await db.doc('ogrenciHesaplari/R1').get()).exists, 90_000);
  // Çocuk hesabı tümden silinir: Auth kullanıcısı, profil ve gizli giriş belgesi kalmaz.
  await assert.rejects(auth.getUser(uid), (e) => e.code === 'auth/user-not-found');
  assert.equal((await db.doc(`kullanicilar/${uid}`).get()).exists, false);
  assert.equal((await db.doc(`gizli/cocuk/hesaplar/${uid}`).get()).exists, false);
  assert.deepEqual((await giris('cocukGiris', { kullaniciAdi, sifre })).govde, { hata: 'yanlis' });
  assert.equal((await giris('kartGiris', kartAyir(kartUrl))).durum, 401);
  assert.equal((await auth.getUser('y1')).customClaims?.ref, undefined);
  const p = (await db.doc('kullanicilar/y1').get()).data();
  assert.equal(p.ref, undefined);
  assert.equal(p.tur, 'genel');
  // Silinmiş öğrenci için kart/şifre yenileme ve yeni kod yok; önceden üretilmiş kod da bağlamaz.
  for (const ad of ['kartYenile', 'cocukSifreYenile']) assert.equal((await cagir(ad, { ref: 'R1' }, hoca)).hata.status, 'NOT_FOUND', ad);
  assert.equal((await cagir('bagKoduUret', { ref: 'R1' }, hoca)).hata.status, 'NOT_FOUND');
  const gec = await cagir('hesabiBagla', { kod: bekleyen }, await kullaniciAc('y2'));
  assert.equal(gec.hata.details?.neden, 'kapali');

  // Kilidi açılıp kapanan R2'nin hesabı açık kaldı (R1'in tetiği işlendikten sonra bakılır).
  await uyu(1000);
  assert.equal((await auth.getUser(r2.uid)).disabled, false);
  assert.equal((await db.doc('ogrenciHesaplari/R2').get()).exists, true);
  assert.equal((await giris('cocukGiris', { kullaniciAdi: r2.kullaniciAdi, sifre: r2.sifre })).durum, 200);
});
