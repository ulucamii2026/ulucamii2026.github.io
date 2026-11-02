/**
 * İlim Yolu Dilim 1 (2 Kasım 2026) — hesap kuralları (firebase/firestore.rules, «İlim Yolu» bölümleri). docs/ILIM-YOLU.md.
 * Çocuk hesabı: custom token {rol:'cocuk', ref}, e-posta YOK → girisli()/aile()/hoca() hiçbir yolla sağlanmaz; yalnız kendi
 * ezberDurum/{ref} belgesini ve olaylarını okur, hiçbirini yazamaz.
 */
import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField, collection, getDocs, query, where, setLogLevel, Timestamp, serverTimestamp,
} from 'firebase/firestore';

// Bu kontroller initializeTestEnvironment'dan ÖNCE: üretime sessiz geri dönüş yok.
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8185', 'Yalnız test emülatörü kullanılabilir.');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ulucamii', 'Yalnız demo projesi kullanılabilir.');
setLogLevel('silent');
let env;

const kisi = (uid, ek = {}) => env.authenticatedContext(uid, { email: `${uid}@example.test`, email_verified: true, ...ek }).firestore();
const cocuk = (uid = 'c_cocuk1', ref = 'R1') => env.authenticatedContext(uid, { rol: 'cocuk', ref }).firestore();
const hocaA = () => env.authenticatedContext('hoca-a', { email: 'hoca-a@example.test' }).firestore();
const hocaB = () => env.authenticatedContext('hoca-b', { email: 'hoca-b@example.test' }).firestore();
const anonim = () => env.unauthenticatedContext().firestore();
const oku = (db, yol) => getDoc(doc(db, yol));
const ESKI = Timestamp.fromMillis(Date.UTC(2026, 0, 1));
const ezberYazimi = () => ({
  ogeler: { 's-fatiha': { basamak: 1, kalite: '', notlar: [], son: serverTimestamp(), sonrakiKontrol: '', surum: 1 } },
  degisen: 's-fatiha', guncelleme: serverTimestamp(),
});
const olay = () => ({ ezber: 's-fatiha', tur: 'atama', kalite: '', notlar: [], basamakOnce: 0, basamakSonra: 1, zorla: false, tarih: '2026-11-02', zaman: serverTimestamp() });
const calisma = (ek = {}) => ({ v: 1, ar: 1, maddeler: { 's-fatiha': { kip: 'zincir', son: 1 } }, gunler: ['2026-11-02'], guncelleme: serverTimestamp(), ...ek });
const riza = (ek = {}) => ({ zaman: serverTimestamp(), metinSurum: '2026-11-02', ...ek });

const temizle = () => env.clearFirestore();
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-ulucamii', firestore: {
    host: '127.0.0.1', port: 8185,
    rules: readFileSync(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8'),
  } });
  await temizle();
});
after(async () => { if (env) { await temizle(); await env.cleanup(); } });
beforeEach(async () => {
  await temizle();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    const kayitlar = {
      'hocalar/hoca-a': { adSoyad: 'Deneme Hoca A' }, 'hocalar/hoca-b': { adSoyad: 'Deneme Hoca B' },
      // E-postasız bir uid'nin hocalar kaydı olsa bile hoca sayılmamalı.
      'hocalar/c_sahte': { adSoyad: 'Olmamalı' },
      'aileler/veli-a@example.test': { ogrenciler: ['R1'] },
      'ogrenciler/R1': { ad: 'Deneme 1' }, 'ogrenciler/R2': { ad: 'Deneme 2' },
      'ezberDurum/R1': { ogeler: {} }, 'ezberDurum/R1/olaylar/o1': { ezber: 's-fatiha' },
      'ezberDurum/R2': { ogeler: {} }, 'ezberDurum/R2/olaylar/o1': { ezber: 's-fatiha' },
      'evCalismalari/R1/etkinlikler/ezber-s-fatiha': { son: ESKI }, 'ilerleme/R1': { seviye: 1 },
      'ayarlar/genel': { donem: 'test' }, 'duyurular/d1': { yayin: true },
      'kullanicilar/u1': { ad: 'ali', tur: 'genel', dil: 'tr', olusturma: ESKI },
      'kullanicilar/u2': { ad: 'veli2', tur: 'genel', dil: 'fr', olusturma: ESKI },
      'kullanicilar/c_cocuk1': { ad: 'yildiz.r1', tur: 'cocuk', ref: 'R1', dil: 'tr', olusturma: ESKI },
      'kullanicilar/y1': { ad: 'yetiskin', tur: 'kursYetiskin', ref: 'R2', dil: 'fr', olusturma: ESKI },
      'kullanicilar/u1/calisma/ezber': { v: 1, maddeler: {}, guncelleme: ESKI },
      'kullanicilar/u1/calisma/yol': { maddeler: {}, guncelleme: ESKI },
      'kullanicilar/c_cocuk1/calisma/ezber': { v: 1, maddeler: {}, guncelleme: ESKI },
      'kullanicilar/c_cocuk1/calisma/yol': { maddeler: {}, guncelleme: ESKI },
      'kullanicilar/u1/ozel/hassas': { muhtedi: true, riza: { zaman: ESKI, metinSurum: '2026-11-01' } },
      'kullaniciAdlari/ali': { uid: 'u1' },
      'gizli/cocuk/hesaplar/c_cocuk1': { sifreOzeti: 'x' }, 'gizli/kilit': { deneme: 0 },
      'bagKodlari/abc123': { ref: 'R2' }, 'ogrenciHesaplari/R1': { uid: 'c_cocuk1' },
    };
    await Promise.all(Object.entries(kayitlar).map(([yol, veri]) => setDoc(doc(db, yol), veri)));
  });
});

test('Profil: sahibi okur, izinli alanları açar ve günceller', async () => {
  const u1 = kisi('u1');
  await assertSucceeds(oku(u1, 'kullanicilar/u1'));
  await assertSucceeds(updateDoc(doc(u1, 'kullanicilar/u1'), {
    dil: 'nl', sehir: 'Marche-en-Famenne', cami: 'bdv-marche-en-famenne', tercihler: { haftalik: true, gun: 0, saat: 19 }, sonGiris: serverTimestamp(),
  }));
  await assertSucceeds(updateDoc(doc(u1, 'kullanicilar/u1'), { sehir: deleteField(), cami: '' }));
  const yeni = kisi('u9');
  await assertSucceeds(setDoc(doc(yeni, 'kullanicilar/u9'), { dil: 'de', tercihler: { haftalik: false }, sonGiris: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(cocuk(), 'kullanicilar/c_cocuk1'), { dil: 'fr' }, { merge: true }), 'çocuk da kendi dilini seçer');
});

test('Profil: ad, tur, ref, olusturma istemciden yazılamaz; değerler denetlenir; silinemez', async () => {
  const u1 = kisi('u1');
  for (const alan of [{ ad: 'baska' }, { tur: 'cocuk' }, { ref: 'R1' }, { olusturma: serverTimestamp() }, { ad: deleteField() }, { tur: deleteField() }, { rol: 'hoca' }]) {
    await assertFails(updateDoc(doc(u1, 'kullanicilar/u1'), alan), JSON.stringify(Object.keys(alan)));
  }
  const u9 = kisi('u9');
  for (const alan of [{ ad: 'u9' }, { tur: 'genel' }, { ref: 'R1' }, { olusturma: serverTimestamp() }]) {
    await assertFails(setDoc(doc(u9, 'kullanicilar/u9'), { dil: 'tr', ...alan }));
  }
  for (const kotu of [
    { dil: 'xx' }, { dil: 1 }, { sehir: 'x'.repeat(81) }, { sehir: 5 }, { cami: 'x'.repeat(81) },
    { tercihler: { gun: 7 } }, { tercihler: { gun: -1 } }, { tercihler: { gun: 1.5 } }, { tercihler: { saat: 24 } },
    { tercihler: { haftalik: 'evet' } }, { tercihler: { haftalik: true, fazla: 1 } }, { tercihler: 'pazar' },
    { sonGiris: ESKI }, { sonGiris: Timestamp.fromMillis(Date.UTC(2030, 0, 1)) },
  ]) {
    await assertFails(updateDoc(doc(u1, 'kullanicilar/u1'), kotu), JSON.stringify(kotu));
  }
  // Çocuk kendi profilinde ref/tur/ad değiştiremez.
  await assertFails(updateDoc(doc(cocuk(), 'kullanicilar/c_cocuk1'), { ref: 'R2' }));
  await assertFails(updateDoc(doc(cocuk(), 'kullanicilar/c_cocuk1'), { tur: 'genel' }));
  await assertFails(deleteDoc(doc(u1, 'kullanicilar/u1')));
  await assertFails(deleteDoc(doc(cocuk(), 'kullanicilar/c_cocuk1')));
});

test('Profil: başka kullanıcı, hoca, çocuk ve anonim okuyamaz/yazamaz; liste yok', async () => {
  for (const db of [kisi('u2'), hocaA(), cocuk(), anonim()]) {
    await assertFails(oku(db, 'kullanicilar/u1'));
    await assertFails(updateDoc(doc(db, 'kullanicilar/u1'), { dil: 'en' }));
    await assertFails(setDoc(doc(db, 'kullanicilar/u1'), { dil: 'en' }));
  }
  await assertFails(getDocs(collection(kisi('u1'), 'kullanicilar')));
  await assertFails(getDocs(query(collection(hocaA(), 'kullanicilar'), where('ref', '==', 'R1'))));
});

test('Çocuk hesabı: yalnız kendi ezberDurum belgesini ve olaylarını okur, yazamaz', async () => {
  const c = cocuk();
  await assertSucceeds(oku(c, 'ezberDurum/R1'));
  await assertSucceeds(oku(c, 'ezberDurum/R1/olaylar/o1'));
  await assertSucceeds(getDocs(collection(c, 'ezberDurum/R1/olaylar')));
  await assertFails(oku(c, 'ezberDurum/R2'));
  await assertFails(oku(c, 'ezberDurum/R2/olaylar/o1'));
  await assertFails(getDocs(collection(c, 'ezberDurum/R2/olaylar')));
  await assertFails(getDocs(collection(c, 'ezberDurum')));
  await assertFails(setDoc(doc(c, 'ezberDurum/R1'), ezberYazimi()));
  await assertFails(updateDoc(doc(c, 'ezberDurum/R1'), ezberYazimi()));
  await assertFails(deleteDoc(doc(c, 'ezberDurum/R1')));
  await assertFails(setDoc(doc(c, 'ezberDurum/R1/olaylar/yeni'), olay()));
  await assertFails(deleteDoc(doc(c, 'ezberDurum/R1/olaylar/o1')));
  // Hoca yazımı değişmedi.
  await assertSucceeds(setDoc(doc(hocaA(), 'ezberDurum/R2'), ezberYazimi()));
  // Boş ref ya da ref'siz oturum hiçbir öğrenciyi okumaz.
  await assertFails(oku(env.authenticatedContext('c_bos', { rol: 'cocuk', ref: '' }).firestore(), 'ezberDurum/R1'));
  await assertFails(oku(kisi('u1'), 'ezberDurum/R1'));
  // Kursa bağlanmış yetişkin (e-postalı, ref yetkili) de yalnız kendi ref'ini okur.
  const y = kisi('y1', { ref: 'R2' });
  await assertSucceeds(oku(y, 'ezberDurum/R2'));
  await assertFails(oku(y, 'ezberDurum/R1'));
  await assertFails(setDoc(doc(y, 'ezberDurum/R2'), ezberYazimi()));
});

test('Çocuk hesabı: e-postasız token aile, veli ve hoca yollarından hiçbirine giremez', async () => {
  const c = cocuk();
  const sahte = cocuk('c_sahte', 'R1'); // hocalar/c_sahte kaydı var ama e-posta yok
  for (const db of [c, sahte]) {
    for (const yol of ['aileler/veli-a@example.test', 'ogrenciler/R1', 'ogrenciler/R2', 'evCalismalari/R1/etkinlikler/ezber-s-fatiha',
      'ilerleme/R1', 'ayarlar/genel', 'duyurular/d1', 'hocalar/hoca-a']) {
      await assertFails(oku(db, yol), yol);
    }
    await assertFails(getDocs(collection(db, 'ogrenciler')));
    await assertFails(getDocs(collection(db, 'aileler')));
    await assertFails(setDoc(doc(db, 'ayarlar/genel'), { donem: 'x' }));
    await assertFails(setDoc(doc(db, 'ogrenciler/R3'), { ad: 'x' }));
    await assertFails(setDoc(doc(db, 'portalSilme/R1'), { islem: 'x', zaman: serverTimestamp() }));
    await assertFails(setDoc(doc(db, 'bildirimler/x'), { eposta: '', ref: 'R1', tur: 'soru', metin: 'x', okundu: false, zaman: serverTimestamp() }));
  }
  // Kendi uid'si hocalar'da bile olsa e-postasız oturum hoca sayılmaz.
  await assertFails(oku(sahte, 'hocalar/c_sahte'));
  await assertFails(setDoc(doc(sahte, 'ezberDurum/R1'), ezberYazimi()));
  await assertFails(oku(sahte, 'kullanicilar/u1/calisma/ezber'));
});

test('Kullanıcı adları: giriş yapan tek ad sorar; liste ve istemci yazımı yok', async () => {
  await assertSucceeds(oku(kisi('u2'), 'kullaniciAdlari/ali'));
  await assertSucceeds(oku(cocuk(), 'kullaniciAdlari/ali'));
  await assertSucceeds(oku(kisi('u2'), 'kullaniciAdlari/bos-ad'));
  await assertFails(oku(anonim(), 'kullaniciAdlari/ali'));
  for (const db of [kisi('u1'), kisi('u9'), hocaA(), cocuk()]) {
    await assertFails(getDocs(collection(db, 'kullaniciAdlari')));
    await assertFails(getDocs(query(collection(db, 'kullaniciAdlari'), where('uid', '==', 'u1'))));
    await assertFails(setDoc(doc(db, 'kullaniciAdlari/yeni-ad'), { uid: 'u9' }));
    await assertFails(updateDoc(doc(db, 'kullaniciAdlari/ali'), { uid: 'u9' }));
    await assertFails(deleteDoc(doc(db, 'kullaniciAdlari/ali')));
  }
});

test('Hassas belge: yalnız sahibi; muhtedi true her yazımda sunucu zamanlı rıza ister', async () => {
  const u1 = kisi('u1');
  await assertSucceeds(oku(u1, 'kullanicilar/u1/ozel/hassas'));
  for (const db of [kisi('u2'), hocaA(), cocuk(), anonim()]) {
    await assertFails(oku(db, 'kullanicilar/u1/ozel/hassas'));
    await assertFails(setDoc(doc(db, 'kullanicilar/u1/ozel/hassas'), { muhtedi: false }));
    await assertFails(deleteDoc(doc(db, 'kullanicilar/u1/ozel/hassas')));
  }
  await assertFails(getDocs(collection(u1, 'kullanicilar/u1/ozel')));
  const u9 = kisi('u9');
  const yol = 'kullanicilar/u9/ozel/hassas';
  for (const kotu of [
    { muhtedi: true }, { muhtedi: true, riza: riza({ zaman: ESKI }) }, { muhtedi: true, riza: { zaman: serverTimestamp() } },
    { muhtedi: true, riza: riza({ metinSurum: 3 }) }, { muhtedi: true, riza: riza({ metinSurum: '' }) },
    { muhtedi: true, riza: riza({ metinSurum: 'x'.repeat(41) }) }, { muhtedi: true, riza: riza({ ip: '1.2.3.4' }) },
    { muhtedi: 'evet', riza: riza() }, { muhtedi: false, riza: riza() }, { muhtedi: true, riza: riza(), ad: 'x' }, { riza: riza() },
  ]) {
    await assertFails(setDoc(doc(u9, yol), kotu), JSON.stringify(Object.keys(kotu)));
  }
  await assertSucceeds(setDoc(doc(u9, yol), { muhtedi: true, riza: riza() }));
  // Eski rıza zamanıyla güncelleme olmaz; her «evet» yeniden zamanlanır.
  await assertFails(updateDoc(doc(u9, yol), { 'riza.metinSurum': '2026-12-01' }));
  await assertSucceeds(updateDoc(doc(u9, yol), { riza: riza({ metinSurum: '2026-12-01' }) }));
  await assertSucceeds(setDoc(doc(u9, yol), { muhtedi: false }));
  await assertSucceeds(deleteDoc(doc(u9, yol)));
  // ozel altında başka belge yok; çocuk hesabı hassas belge yazamaz.
  await assertFails(setDoc(doc(u9, 'kullanicilar/u9/ozel/baska'), { muhtedi: false }));
  await assertFails(setDoc(doc(cocuk(), 'kullanicilar/c_cocuk1/ozel/hassas'), { muhtedi: false }));
});

test('Çalışma belgeleri: üç ad, ≤ 120 madde, guncelleme = sunucu zamanı; yalnız sahibi yazar', async () => {
  const u1 = kisi('u1');
  for (const ad of ['ezber', 'bilgi', 'yol']) await assertSucceeds(setDoc(doc(u1, `kullanicilar/u1/calisma/${ad}`), calisma()));
  await assertSucceeds(oku(u1, 'kullanicilar/u1/calisma/bilgi'));
  await assertSucceeds(getDocs(collection(u1, 'kullanicilar/u1/calisma')));
  await assertFails(setDoc(doc(u1, 'kullanicilar/u1/calisma/baska'), calisma()));
  await assertFails(oku(u1, 'kullanicilar/u1/calisma/baska'));
  const maddeler = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`m-${i}`, { son: i }]));
  await assertSucceeds(setDoc(doc(u1, 'kullanicilar/u1/calisma/ezber'), calisma({ maddeler: maddeler(120) })));
  for (const kotu of [
    { maddeler: maddeler(121) }, { guncelleme: ESKI }, { guncelleme: Timestamp.fromMillis(Date.UTC(2030, 0, 1)) },
    { maddeler: [] }, { maddeler: 'x' }, { gunler: Array.from({ length: 61 }, () => '2026-11-02') }, { gunler: 'x' },
    { ar: 9 }, { ar: '1' }, { v: '1' }, { fazla: 'x' },
  ]) {
    await assertFails(setDoc(doc(u1, 'kullanicilar/u1/calisma/ezber'), calisma(kotu)), JSON.stringify(Object.keys(kotu)));
  }
  const { guncelleme, ...zamansiz } = calisma();
  await assertFails(setDoc(doc(u1, 'kullanicilar/u1/calisma/ezber'), zamansiz));
  const { maddeler: _m, ...maddesiz } = calisma();
  await assertFails(setDoc(doc(u1, 'kullanicilar/u1/calisma/ezber'), maddesiz));
  for (const db of [kisi('u2'), hocaA(), cocuk(), anonim()]) {
    await assertFails(setDoc(doc(db, 'kullanicilar/u1/calisma/ezber'), calisma()));
    await assertFails(deleteDoc(doc(db, 'kullanicilar/u1/calisma/ezber')));
  }
  for (const db of [kisi('u2'), cocuk(), anonim()]) await assertFails(oku(db, 'kullanicilar/u1/calisma/ezber'));
  // Çocuk kendi çalışmasını yazar ve okur.
  await assertSucceeds(setDoc(doc(cocuk(), 'kullanicilar/c_cocuk1/calisma/ezber'), calisma()));
  await assertSucceeds(oku(cocuk(), 'kullanicilar/c_cocuk1/calisma/ezber'));
  await assertSucceeds(deleteDoc(doc(u1, 'kullanicilar/u1/calisma/bilgi')));
});

test('Çalışma okuma: hoca kursa bağlı hesabı okur; paylaşımla yalnız yol belgesi açılır', async () => {
  // Kursa bağlı (ref sunucuda yazılmış) hesaplar: hoca üç belgeyi de okur.
  await assertSucceeds(oku(hocaA(), 'kullanicilar/c_cocuk1/calisma/ezber'));
  await assertSucceeds(oku(hocaA(), 'kullanicilar/c_cocuk1/calisma/yol'));
  await assertFails(oku(hocaA(), 'kullanicilar/c_cocuk1/calisma/baska'));
  await assertFails(oku(kisi('u2'), 'kullanicilar/c_cocuk1/calisma/ezber'));
  await assertSucceeds(getDocs(collection(hocaA(), 'kullanicilar/c_cocuk1/calisma')));
  await assertFails(getDocs(collection(kisi('u2'), 'kullanicilar/c_cocuk1/calisma')));
  await assertFails(getDocs(collection(cocuk(), 'kullanicilar/u1/calisma')));
  // Kursa bağlı olmayan genel hesap: paylaşım yokken hoca hiçbir belgeyi okumaz.
  await assertFails(oku(hocaA(), 'kullanicilar/u1/calisma/ezber'));
  await assertFails(oku(hocaA(), 'kullanicilar/u1/calisma/yol'));
  // Paylaşım belgesi: yalnız sahibi yazar; en çok 3 uid; zaman = sunucu zamanı.
  const u1 = kisi('u1');
  for (const kotu of [
    { hocalar: ['hoca-a', 'hoca-b', 'h3', 'h4'], zaman: serverTimestamp() }, { hocalar: [5], zaman: serverTimestamp() },
    { hocalar: ['hoca a'], zaman: serverTimestamp() }, { hocalar: ['x'.repeat(129)], zaman: serverTimestamp() },
    { hocalar: ['hoca-a'], zaman: ESKI }, { hocalar: ['hoca-a'] }, { hocalar: 'hoca-a', zaman: serverTimestamp() },
    { hocalar: ['hoca-a'], zaman: serverTimestamp(), not: 'x' },
  ]) {
    await assertFails(setDoc(doc(u1, 'paylasimlar/u1'), kotu), JSON.stringify(kotu.hocalar));
  }
  await assertFails(setDoc(doc(kisi('u2'), 'paylasimlar/u1'), { hocalar: ['hoca-a'], zaman: serverTimestamp() }));
  await assertFails(setDoc(doc(hocaA(), 'paylasimlar/u1'), { hocalar: ['hoca-a'], zaman: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(u1, 'paylasimlar/u1'), { hocalar: ['hoca-a', 'u2'], zaman: serverTimestamp() }));
  await assertSucceeds(oku(u1, 'paylasimlar/u1'));
  await assertSucceeds(oku(hocaA(), 'paylasimlar/u1'));
  await assertSucceeds(getDocs(query(collection(hocaA(), 'paylasimlar'), where('hocalar', 'array-contains', 'hoca-a'))));
  await assertFails(oku(hocaB(), 'paylasimlar/u1'));
  await assertFails(oku(kisi('u2'), 'paylasimlar/u1'), 'listede ama hoca değil');
  await assertFails(getDocs(collection(hocaA(), 'paylasimlar')));
  // Listelenen hoca yalnız `yol`u okur; listede olmayan hoca ve hoca olmayan kullanıcı okumaz.
  await assertSucceeds(oku(hocaA(), 'kullanicilar/u1/calisma/yol'));
  await assertFails(oku(hocaA(), 'kullanicilar/u1/calisma/ezber'));
  await assertFails(oku(hocaA(), 'kullanicilar/u1/calisma/bilgi'));
  await assertFails(getDocs(collection(hocaA(), 'kullanicilar/u1/calisma')), 'paylaşımla liste açılmaz');
  await assertFails(oku(hocaB(), 'kullanicilar/u1/calisma/yol'));
  await assertFails(oku(kisi('u2'), 'kullanicilar/u1/calisma/yol'));
  await assertFails(oku(hocaA(), 'kullanicilar/u1/ozel/hassas'), 'paylaşım hassas belgeyi açmaz');
  // Geri alma: güncelleme ya da silme erişimi kapatır.
  await assertSucceeds(setDoc(doc(u1, 'paylasimlar/u1'), { hocalar: ['hoca-b'], zaman: serverTimestamp() }));
  await assertFails(oku(hocaA(), 'kullanicilar/u1/calisma/yol'));
  await assertSucceeds(oku(hocaB(), 'kullanicilar/u1/calisma/yol'));
  await assertFails(deleteDoc(doc(hocaB(), 'paylasimlar/u1')));
  await assertSucceeds(deleteDoc(doc(u1, 'paylasimlar/u1')));
  await assertFails(oku(hocaB(), 'kullanicilar/u1/calisma/yol'));
});

test('gizli, bagKodlari, ogrenciHesaplari: istemciye tamamen kapalı (hoca dahil)', async () => {
  const yollar = ['gizli/kilit', 'gizli/cocuk/hesaplar/c_cocuk1', 'bagKodlari/abc123', 'ogrenciHesaplari/R1'];
  for (const db of [hocaA(), kisi('u1'), cocuk(), kisi('y1', { ref: 'R2' }), anonim()]) {
    for (const yol of yollar) {
      await assertFails(oku(db, yol), yol);
      await assertFails(setDoc(doc(db, yol), { x: 1 }), yol);
      await assertFails(deleteDoc(doc(db, yol)), yol);
    }
    await assertFails(setDoc(doc(db, 'gizli/yeni'), { x: 1 }));
    await assertFails(setDoc(doc(db, 'bagKodlari/yeni'), { ref: 'R1' }));
    for (const koleksiyon of ['gizli', 'bagKodlari', 'ogrenciHesaplari', 'gizli/cocuk/hesaplar']) {
      await assertFails(getDocs(collection(db, koleksiyon)), koleksiyon);
    }
  }
});
