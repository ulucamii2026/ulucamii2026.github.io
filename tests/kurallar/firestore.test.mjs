import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, setLogLevel } from 'firebase/firestore';

// Bu kontroller initializeTestEnvironment'dan ÖNCE: üretime sessiz geri dönüş yok.
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8185', 'Yalnız test emülatörü kullanılabilir.');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ulucamii', 'Yalnız demo projesi kullanılabilir.');
setLogLevel('silent'); // Beklenen permission-denied denemeleri günlükleri şişirmesin.
let env;
const parent = () => env.authenticatedContext('veli-a', { email: 'veli-a@example.test' }).firestore();
const teacher = () => env.authenticatedContext('hoca-a', { email: 'hoca@example.test' }).firestore();
const read = (db, path) => getDoc(doc(db, path));
const message = (extra = {}) => ({ eposta: 'veli-a@example.test', ref: 'ogrenci-a', tur: 'soru', metin: 'Deneme mesajı', okundu: false, ...extra });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-ulucamii', firestore: {
    host: '127.0.0.1', port: 8185,
    rules: readFileSync(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8'),
  } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const records = {
      'hocalar/hoca-a': { adSoyad: 'Deneme Hoca', sifreVar: true },
      'aileler/veli-a@example.test': { ogrenciler: ['ogrenci-a'], dil: 'tr' },
      'aileler/veli-b@example.test': { ogrenciler: ['ogrenci-b'], dil: 'fr' },
      'ogrenciler/ogrenci-a': { ad: 'Deneme A' }, 'ogrenciler/ogrenci-b': { ad: 'Deneme B' },
      'ayarlar/genel': { donem: 'test' },
      'notlar/gorunur': { ref: 'ogrenci-a', veliyeGorunur: true },
      'notlar/gizli': { ref: 'ogrenci-a', veliyeGorunur: false },
      'yoklama/a': { ref: 'ogrenci-a' }, 'yoklama/b': { ref: 'ogrenci-b' },
      'degerlendirme/a': { ref: 'ogrenci-a' }, 'ilerleme/ogrenci-a': { seviye: 1 },
      'odevler/yayinda': { yayin: true }, 'odevler/taslak': { yayin: false },
      'duyurular/yayinda': { yayin: true }, 'duyurular/taslak': { yayin: false },
      'bildirimler/kendi': message(), 'bildirimler/okunmus': message({ okundu: true }),
      'bildirimler/baskasi': message({ eposta: 'veli-b@example.test', ref: 'ogrenci-b' }),
    };
    await Promise.all(Object.entries(records).map(([path, data]) => setDoc(doc(db, path), data)));
  });
});

test('Anonim kullanıcı öğrenci ve duyuru okuyamaz', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(read(db, 'ogrenciler/ogrenci-a'));
  await assertFails(read(db, 'duyurular/yayinda'));
});
test('Kayıtsız hesap aile verisi okuyamaz', async () => {
  await assertFails(read(env.authenticatedContext('yabanci', { email: 'yabanci@example.test' }).firestore(), 'ogrenciler/ogrenci-a'));
});
test('Veli yalnız kendi öğrencisini okur', async () => {
  await assertSucceeds(read(parent(), 'ogrenciler/ogrenci-a'));
  await assertFails(read(parent(), 'ogrenciler/ogrenci-b'));
  await assertFails(getDocs(collection(parent(), 'ogrenciler')));
});
test('E-posta büyük/küçük harf normalizasyonu çalışır', async () => {
  await assertSucceeds(read(env.authenticatedContext('veli-a', { email: 'VELI-A@EXAMPLE.TEST' }).firestore(), 'ogrenciler/ogrenci-a'));
});
test('Veli öğrenci yazamaz ve silemez', async () => {
  await assertFails(setDoc(doc(parent(), 'ogrenciler/yeni'), { ad: 'Deneme' }));
  await assertFails(updateDoc(doc(parent(), 'ogrenciler/ogrenci-a'), { ad: 'Değişti' }));
  await assertFails(deleteDoc(doc(parent(), 'ogrenciler/ogrenci-a')));
});
test('Veli kendini hoca yapamaz veya öğrenci listesini genişletemez', async () => {
  await assertFails(setDoc(doc(parent(), 'hocalar/veli-a'), { adSoyad: 'Deneme' }));
  await assertFails(updateDoc(doc(parent(), 'aileler/veli-a@example.test'), { ogrenciler: ['ogrenci-a', 'ogrenci-b'] }));
});
test('Veli kendi dilini değiştirir; diğer aileyi okuyamaz', async () => {
  await assertSucceeds(updateDoc(doc(parent(), 'aileler/veli-a@example.test'), { dil: 'fr' }));
  await assertFails(read(parent(), 'aileler/veli-b@example.test'));
  await assertFails(read(parent(), 'ayarlar/genel'));
});
test('Yoklama, ilerleme ve değerlendirme öğrenci sınırını korur', async () => {
  for (const path of ['yoklama/a', 'ilerleme/ogrenci-a', 'degerlendirme/a']) await assertSucceeds(read(parent(), path));
  await assertFails(read(parent(), 'yoklama/b'));
  await assertSucceeds(getDocs(query(collection(parent(), 'yoklama'), where('ref', '==', 'ogrenci-a'))));
  await assertFails(getDocs(collection(parent(), 'yoklama')));
});
test('Veliye gizli notlar görünmez', async () => {
  await assertSucceeds(read(parent(), 'notlar/gorunur'));
  await assertFails(read(parent(), 'notlar/gizli'));
});
test('Ödev ve duyuru taslakları görünmez; filtreli sorgu geçer', async () => {
  for (const name of ['odevler', 'duyurular']) {
    await assertSucceeds(read(parent(), `${name}/yayinda`));
    await assertFails(read(parent(), `${name}/taslak`));
    await assertSucceeds(getDocs(query(collection(parent(), name), where('yayin', '==', true))));
    await assertFails(getDocs(collection(parent(), name)));
  }
});
test('Veli kendi öğrencisi için geçerli mesaj oluşturur', async () => {
  await assertSucceeds(setDoc(doc(parent(), 'bildirimler/yeni'), message()));
});
test('Sahte gönderen, öğrenci, tür ve uzun mesaj reddedilir', async () => {
  for (const extra of [{ eposta: 'veli-b@example.test' }, { ref: 'ogrenci-b' }, { tur: 'admin' }, { metin: 'x'.repeat(1001) }, { okundu: true }]) {
    await assertFails(setDoc(doc(parent(), 'bildirimler/gecersiz'), message(extra)));
  }
});
test('Okunmamış mesaj düzeltilebilir; okunmuş mesaj değiştirilemez', async () => {
  await assertSucceeds(updateDoc(doc(parent(), 'bildirimler/kendi'), { metin: 'Düzeltilmiş deneme' }));
  await assertFails(updateDoc(doc(parent(), 'bildirimler/okunmus'), { metin: 'Değişiklik' }));
  await assertFails(updateDoc(doc(parent(), 'bildirimler/kendi'), { okundu: true }));
});
test('Veli başka mesajı okuyamaz veya silemez; kendininkini silebilir', async () => {
  await assertFails(read(parent(), 'bildirimler/baskasi'));
  await assertFails(deleteDoc(doc(parent(), 'bildirimler/baskasi')));
  await assertSucceeds(deleteDoc(doc(parent(), 'bildirimler/okunmus')));
});
test('Hoca öğrenci/ayar/taslak yönetebilir; hoca oluşturamaz', async () => {
  await assertSucceeds(read(teacher(), 'ogrenciler/ogrenci-b'));
  await assertSucceeds(read(teacher(), 'notlar/gizli'));
  await assertSucceeds(setDoc(doc(teacher(), 'ayarlar/genel'), { donem: 'test-2' }));
  await assertSucceeds(updateDoc(doc(teacher(), 'ogrenciler/ogrenci-a'), { ad: 'Yeni deneme' }));
  await assertSucceeds(deleteDoc(doc(teacher(), 'odevler/taslak')));
  await assertFails(setDoc(doc(teacher(), 'hocalar/yeni'), { adSoyad: 'Deneme' }));
});
test('Hoca kendi giriş durumunu değiştirir; rol belgesini genişletemez', async () => {
  await assertSucceeds(updateDoc(doc(teacher(), 'hocalar/hoca-a'), { sonGiris: 1 }));
  await assertFails(updateDoc(doc(teacher(), 'hocalar/hoca-a'), { adSoyad: 'Değişti' }));
});
test('Tanımlanmamış koleksiyonlar hoca dahil herkese kapalıdır', async () => {
  await assertFails(read(teacher(), 'bilinmeyen/test'));
  await assertFails(setDoc(doc(teacher(), 'bilinmeyen/test'), { deger: 1 }));
});
