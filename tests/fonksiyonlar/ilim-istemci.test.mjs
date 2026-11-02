// İlim Yolu Dilim 1 — istemci mantığı GERÇEK kurallar ve işlevlerle (emülatör: Auth 9185, Firestore 8185, Functions 5185).
// egitim/src/lib/hesap/** ve firebase-istemci.ts'in ürettiği yazımları firebase/firestore.rules kabul ediyor mu: profil (yalnız izinli
// alanlar), sonGiris, «Yeni Müslümanım» açık rızası, çalışma eşitlemesi (lite transaction + serverTimestamp), kullanıcı adı callable'ı,
// kartla giriş (/api/kart-giris → custom token) ve öğrencinin kendi hoca kaydını okuması. İstemci Firebase JS SDK'sı Node'da çalışır.
import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { db, auth, temizle, hazir, basarili, hocaAc, KOKEN, SIFRE, Timestamp } from './yardimci.mjs';
import { BellekDepo, yukle } from '../egitim/hesap-sahte.mjs';

const m = await yukle('ilim-istemci-emulator-test', [
  'firebase-istemci', 'hesap/isaret', 'hesap/oturum', 'hesap/esitle', 'hesap/profil', 'hesap/kart-giris', 'hesap/ogretmen-kaydi',
  '@ortak/lib/ezber/cihaz',
]);
const [appM, a, fs, fnM] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite'), import('firebase/functions')]);

let sayac = 0;
/** firebaseYukle()'nin emülatör kolunun Node karşılığı (tarayıcı nesneleri yok): aynı modüller, aynı bağlantılar. */
function istemci() {
  const app = appM.initializeApp(m.yapilandirma({ apiKey: 'demo', authDomain: 'x', projectId: 'ulucamii-portal', appId: 'demo' }, true), `${m.UYGULAMA_ADI}-${++sayac}`);
  const authI = a.getAuth(app);
  a.connectAuthEmulator(authI, `http://${m.EMULATOR.host}:${m.EMULATOR.auth}`, { disableWarnings: true });
  const dbI = fs.getFirestore(app);
  fs.connectFirestoreEmulator(dbI, m.EMULATOR.host, m.EMULATOR.firestore);
  const fns = fnM.getFunctions(app, m.BOLGE);
  fnM.connectFunctionsEmulator(fns, m.EMULATOR.host, m.EMULATOR.functions);
  return {
    app, auth: authI, db: dbI, a, fs,
    cagir: async (ad, veri) => (await fnM.httpsCallable(fns, ad)(veri)).data,
    api: (uc) => m.apiAdresi(uc, true),
  };
}
const uygulamalar = [];
const yeni = () => { const f = istemci(); uygulamalar.push(f.app); return f; };
// Node fetch Origin başlığı koymaz; tarayıcı aynı köken POST'ta koyar.
const getir = (adres, istek) => fetch(adres, { ...istek, headers: { ...istek.headers, Origin: KOKEN } });
const cevrimici = () => true;

before(() => hazir(['kullaniciAdiAl', 'cocukHesabiAc', 'kartGiris']));
beforeEach(() => temizle());
after(() => Promise.all(uygulamalar.map((x) => appM.deleteApp(x))));

test('yetişkin: profil, sonGiris, açık rıza, kullanıcı adı ve çalışma eşitlemesi kurallardan geçer', async () => {
  await auth.createUser({ uid: 'u-ist', email: 'ist@example.test', password: SIFRE, emailVerified: true });
  const f = yeni();
  const depo = new BellekDepo();
  const g = await m.girisYap(f, { eposta: 'ist@example.test', sifre: SIFRE, depo });
  assert.equal(g.ok, true);
  assert.equal(m.oturumOzeti(depo), await m.uidOzeti('u-ist'));

  assert.deepEqual(await m.kullaniciAdiAl(f, 'İst.Deneme'), { ok: true, ad: 'ist.deneme' });
  assert.deepEqual(await m.profilYaz(f, { dil: 'fr', sehir: 'Namur', cami: 'Ulu Camii', tercihler: { haftalik: true, gun: 0, saat: 19 } }), { ok: true });
  assert.deepEqual(await m.profilYaz(f, { cami: null, tercihler: { saat: 8 } }), { ok: true });
  assert.equal(await m.sonGirisYaz(f, { bugun: '2026-11-02', depo }), true);
  const p = await m.profilGetir(f);
  assert.deepEqual({ ...p, silinecek: undefined }, { ad: 'ist.deneme', dil: 'fr', tur: 'genel', ref: '', sehir: 'Namur', cami: '', tercihler: { haftalik: true, gun: 0, saat: 8 }, silinecek: undefined });
  assert.ok((await db.doc('kullanicilar/u-ist').get()).get('sonGiris') instanceof Timestamp);

  assert.deepEqual(await m.muhtediIsaretle(f, 'riza-2026-11'), { ok: true });
  assert.equal(await m.muhtediOku(f), true);
  const h = (await db.doc('kullanicilar/u-ist/ozel/hassas').get()).data();
  assert.deepEqual(Object.keys(h).sort(), ['muhtedi', 'riza']);
  assert.ok(h.riza.zaman instanceof Timestamp);
  assert.deepEqual(await m.muhtediGeriAl(f), { ok: true });
  assert.equal((await db.doc('kullanicilar/u-ist/ozel/hassas').get()).exists, false);

  // Eşitleme: cihazdaki çalışma buluta; kural alanları ve sunucu zamanı.
  const anahtar = m.kullaniciAnahtari(await m.uidOzeti('u-ist'));
  const simdi = Date.now();
  m.yaz(depo, m.calismaGunuIsle(m.maddeyiGuncelle(m.bos(), 's-fatiha', { kutu: 2, kip: 'sina' }, simdi - 1000), '2026-11-02'), anahtar);
  assert.deepEqual(await m.esitle(f, { depo, cevrimici }), { durum: 'tamam', yazildi: true, madde: 1 });
  const c = (await db.doc('kullanicilar/u-ist/calisma/ezber').get()).data();
  assert.deepEqual(Object.keys(c).sort(), ['ar', 'guncelleme', 'gunler', 'maddeler', 'v']);
  assert.ok(c.guncelleme instanceof Timestamp);
  assert.equal(c.maddeler['s-fatiha'].kutu, 2);
  assert.deepEqual(await m.esitle(f, { depo, cevrimici }), { durum: 'tamam', yazildi: false, madde: 1 });
  // Başka cihazdan gelen daha yeni kayıt (bulut) birleşir; güncelleme yazımı da kuraldan geçer.
  m.yaz(depo, m.maddeyiGuncelle(m.oku(depo, anahtar), 's-ihlas', {}, simdi - 10), anahtar);
  assert.deepEqual(await m.esitle(f, { depo, cevrimici }), { durum: 'tamam', yazildi: true, madde: 2 });

  assert.deepEqual(await m.cikisYap(f, { depo, cevrimici }), { ok: true });
  assert.equal(depo.getItem(anahtar), null);
  assert.equal(f.auth.currentUser, null);
});

test('çocuk: kartla giriş (custom token), kendi hoca kaydını okur, başkasınınkini okuyamaz; açık rıza yazamaz; eşitler', async () => {
  await db.doc('ogrenciler/R1').set({ ad: 'Ayşe', soyad: 'DENEME', dil: 'tr' });
  await db.doc('ezberDurum/R1').set({ ogeler: { 's-fatiha': { basamak: 2, kalite: 'tam', notlar: [], son: Timestamp.now(), sonrakiKontrol: '2026-11-09', surum: 1 } }, degisen: 's-fatiha', guncelleme: Timestamp.now() });
  await db.doc('ezberDurum/R1/olaylar/o1').set({ ezber: 's-fatiha', tur: 'dinleme', kalite: 'tam', notlar: [], basamakOnce: 1, basamakSonra: 2, zorla: false, tarih: '2026-11-02', zaman: Timestamp.now() });
  await db.doc('ezberDurum/R2').set({ ogeler: {}, degisen: 's-fatiha', guncelleme: Timestamp.now() });
  const { kartUrl } = await basarili('cocukHesabiAc', { ref: 'R1' }, await hocaAc());

  const f = yeni();
  const depo = new BellekDepo();
  const gecmis = { state: null, adres: '', replaceState(_s, _b, u) { this.adres = u; } };
  const u = new URL(kartUrl);
  const kart = m.adrestenKartAl({ hash: u.hash, pathname: u.pathname, search: '' }, gecmis);
  assert.equal(gecmis.adres, '/k/');
  const s = await m.kartlaGir(f, kart, { depo, getir });
  assert.equal(s.ok, true, JSON.stringify(s));
  const k = await m.kullaniciBilgisi(f.auth.currentUser);
  assert.equal(k.rol, 'cocuk');
  assert.equal(k.ref, 'R1');

  const kayit = await m.ogretmenKaydiOku(f, k);
  assert.deepEqual(Object.keys(kayit.ogeler), ['s-fatiha']);
  assert.equal(kayit.olaylar.length, 1);
  const uyari = console.warn;
  console.warn = () => {};
  try { assert.equal(await m.ogretmenKaydiOku(f, { ref: 'R2' }), null, 'başka öğrencinin kaydı'); } finally { console.warn = uyari; }

  assert.deepEqual(await m.muhtediIsaretle(f, 'riza-2026-11'), { ok: false, neden: 'yetki-yok' });
  m.yaz(depo, m.maddeyiGuncelle(m.bos(), 's-ihlas', { kutu: 0 }, Date.now() - 1000), m.etkinAnahtar(depo));
  assert.deepEqual(await m.esitle(f, { depo, cevrimici }), { durum: 'tamam', yazildi: true, madde: 1 });

  // Yanlış sır: 401 → yanlis (kart iptali de böyle görünür).
  const f2 = yeni();
  assert.deepEqual(await m.kartlaGir(f2, { ...kart, sir: 'A'.repeat(22) }, { depo: new BellekDepo(), getir }), { ok: false, neden: 'yanlis' });
});
