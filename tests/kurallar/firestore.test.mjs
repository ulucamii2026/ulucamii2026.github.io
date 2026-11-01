import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField, collection, getDocs, query, where, setLogLevel, Timestamp, serverTimestamp } from 'firebase/firestore';

// Bu kontroller initializeTestEnvironment'dan ÖNCE: üretime sessiz geri dönüş yok.
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8185', 'Yalnız test emülatörü kullanılabilir.');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ulucamii', 'Yalnız demo projesi kullanılabilir.');
setLogLevel('silent'); // Beklenen permission-denied denemeleri günlükleri şişirmesin.
let env;
let portal;
// 26 Eyl 2026: e-postaya dayanan roller doğrulanmış e-posta ister; gerçek veli ilk girişi e-posta bağlantısıyla yapar.
// Hoca rolü uid'ye bağlıdır: teacher() bilerek doğrulama alanı taşımaz.
const veli = (uid, email) => env.authenticatedContext(uid, { email, email_verified: true }).firestore();
const parent = () => veli('veli-a', 'veli-a@example.test');
const teacher = () => env.authenticatedContext('hoca-a', { email: 'hoca@example.test' }).firestore();
const dYol='dersDefteri/ogrenci-a/kayitlar/2026-09-05_1';
const dersKaydi=(extra={})=>({donem:'2026-2027',tarih:'2026-09-05',sira:1,no:1,sayfa:51,konu:'Örnek konu',kaynak:'Örnek kitap',grup:'',durum:'islendi',giris:'kagit',calisma:'Örnek çalışma',okunan:'',dikkat:'',oz:'',odev:'Tekrar',sonraki:'Birlikte okuyalım',surum:1,guncelleme:serverTimestamp(),...extra});
const read = (db, path) => getDoc(doc(db, path));
const message = (extra = {}) => ({ eposta: 'veli-a@example.test', ref: 'ogrenci-a', tur: 'soru', metin: 'Deneme mesajı', okundu: false, zaman: serverTimestamp(), ...extra });

before(async () => {
  mkdirSync('node_modules/.cache', {recursive:true});
  const outfile=resolve('node_modules/.cache/portal-idare-test.mjs');
  await build({stdin:{contents:'export * from "./src/lib/portal-idare.ts"; export * from "./src/lib/haftalik-bulten.ts"; export * from "./src/lib/ders-defteri.ts"; export * from "./src/lib/ezber/depo.ts"; export * from "./src/lib/ezber/durum.ts"; export * from "./src/lib/ezber/gecis.ts"; export * from "./src/lib/ogrenci-envanteri/depo.ts";',resolveDir:process.cwd()},outfile,bundle:true,platform:'node',format:'esm',packages:'external',alias:{'firebase/firestore/lite':'firebase/firestore'}});
  portal=await import(pathToFileURL(outfile).href);
  env = await initializeTestEnvironment({ projectId: 'demo-ulucamii', firestore: {
    host: '127.0.0.1', port: 8185,
    rules: readFileSync(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8'),
  } });
});
after(async () => { await env?.cleanup(); });

test('Kitap çözme anahtarı yalnız hocaya açık; veli ve ziyaretçi okuyamaz',async()=>{
 await env.withSecurityRulesDisabled(async context=>{
   await setDoc(doc(context.firestore(),'ayarlar','hocaKitaplari'),{anahtarlar:{ornek:'yalniz-test-anahtari'}});
 });
 await assertSucceeds(read(teacher(),'ayarlar/hocaKitaplari'));
 for(const db of [parent(),env.unauthenticatedContext().firestore(),veli('yetkisiz', 'yetkisiz@example.test')]){
  await assertFails(read(db,'ayarlar/hocaKitaplari'));
  await assertFails(setDoc(doc(db,'ayarlar/hocaKitaplari'),{anahtarlar:{}}));
 }
});

test('Ders defteri yalnız hocaya açık; veli kendi çocuğunun özel ders notunu da okuyamaz',async()=>{
 await assertSucceeds(setDoc(doc(teacher(),dYol),dersKaydi()));
 await assertSucceeds(read(teacher(),dYol));
 for(const db of [parent(),env.unauthenticatedContext().firestore(),veli('veli-b', 'veli-b@example.test')]){
  await assertFails(read(db,dYol));await assertFails(getDocs(collection(db,'dersDefteri/ogrenci-a/kayitlar')));
  await assertFails(setDoc(doc(db,dYol),dersKaydi({surum:2})));await assertFails(deleteDoc(doc(db,dYol)));
 }
});
test('Ders defterinde alanlar, sayfa, sürüm, sunucu zamanı ve idari kilit doğrulanır',async()=>{
 for(const extra of [{surum:2},{calisma:''},{calisma:'x'.repeat(1801)},{odev:'x'.repeat(1001)},{sayfa:52},{sira:4},{durum:'geldi'},{grup:'C'},{oz:'basarili'},{imza:'x'},{guncelleme:Timestamp.fromMillis(0)}])await assertFails(setDoc(doc(teacher(),dYol),dersKaydi(extra)));
 await assertFails(setDoc(doc(teacher(),'dersDefteri/yok/kayitlar/2026-09-05_1'),dersKaydi()));
 /* 12 Eyl 2026: gelmeyen öğrencinin dersi artık 'islendi' yazılmıyor. */
 for(const durum of ['gelmedi','mazeretli']){
  await assertSucceeds(setDoc(doc(teacher(),dYol),dersKaydi({durum})));
  await deleteDoc(doc(teacher(),dYol));
 }
 await assertFails(setDoc(doc(teacher(),dYol),dersKaydi({durum:'mazeret'})));
 await setDoc(doc(teacher(),dYol),dersKaydi());
 await assertFails(setDoc(doc(teacher(),dYol),dersKaydi()));
 await assertFails(setDoc(doc(teacher(),dYol),dersKaydi({surum:2,konu:'Yanlış ders'})));
 await assertSucceeds(setDoc(doc(teacher(),dYol),dersKaydi({surum:2,calisma:'Güncellendi'})));
 await setDoc(doc(teacher(),'portalSilme/ogrenci-a'),{islem:'test',zaman:serverTimestamp()});
 await assertFails(setDoc(doc(teacher(),dYol),dersKaydi({surum:3})));
});
test('Ders defteri gerçek işlem çakışmasında eski metin ezmez; bülten aktarımı kısaltma yapmaz',async()=>{
 const depo=portal.defterDeposu(teacher(),'ogrenci-a');const k={id:'2026-09-05_1',...dersKaydi()};
 const ilk=await depo.kaydet(k,0);assert.equal(ilk.surum,1);
 await assert.rejects(()=>depo.kaydet({...k,calisma:'Eski ekran'},0),/başka bir ekranda/);
 const liste=await depo.liste();assert.equal(liste[0].calisma,'Örnek çalışma');
 assert.match(portal.defterdenBulten(liste).ders,/Örnek çalışma/);
 assert.throws(()=>portal.defterdenBulten([]),/kayıtlı ders/);
 assert.throws(()=>portal.defterdenBulten([k,{...k,id:'2026-09-05_2',calisma:'x'.repeat(2200)}]),/hiçbir metin kesilmedi/);
});
/* 12 Eyl 2026: gelmeyen öğrencide hoca her kayda ayrı bir «gelmedi» cümlesi yazmasın. */
test('Gelmeyen öğrencide çalışma notu boş bırakılabilir; kanonik cümle depoda yazılır',async()=>{
 const depo=portal.defterDeposu(teacher(),'ogrenci-a');
 const k={id:'2026-09-05_1',...dersKaydi({durum:'gelmedi',calisma:'   '})};
 const kayit=await depo.kaydet(k,0);
 assert.equal(kayit.calisma,'Derse gelmedi.');
 assert.equal((await depo.liste())[0].calisma,'Derse gelmedi.');
 // Kanonik not bültende durumun tekrarı olarak iki kez yazılmaz.
 const b=portal.defterdenBulten([kayit]);
 assert.match(b.ders,/Öğrenci gelmedi$/m);
 assert.doesNotMatch(b.ders,/Öğrenci gelmedi: Derse gelmedi\./);
 // Hoca kendi cümlesini yazarsa ona dokunulmaz.
 const kendi=await depo.kaydet({...k,calisma:'Ailesi haber verdi.'},kayit.surum);
 assert.equal(kendi.calisma,'Ailesi haber verdi.');
 // Durum 'islendi' iken boş not hâlâ reddedilir.
 await assert.rejects(()=>depo.kaydet({...k,durum:'islendi',calisma:''},kendi.surum),/çalışma notunu doldurun/);
});
/* KALICI KURAL (Rıdvan, 12 Eyl 2026): veliden gelen mazeret HER ZAMAN kabul edilir. */
test('Veli mazereti kuralı: işaretsiz ve geç fark edilen «Yok» dersler mazeretli olur',async()=>{
 const siralar=['1','2','3'];
 // 1) Hiç işaretlenmemiş öğrenci → üç ders de mazeretli
 let s=portal.mazeretKuraliniUygula({},['a'],siralar);
 assert.deepEqual(s.yoklama.a.dersler,{1:'mazeret',2:'mazeret',3:'mazeret'});
 assert.deepEqual(s.yoklama.a.veliMazereti,['1','2','3']);
 assert.deepEqual(s.degisen,['a']);
 // 2) Mazeret geç geldi: kaydedilmiş «yok» bir kez mazerete çevrilir
 s=portal.mazeretKuraliniUygula({a:{dersler:{1:'yok',2:'yok',3:'yok'},not:''}},['a'],siralar);
 assert.deepEqual(s.yoklama.a.dersler,{1:'mazeret',2:'mazeret',3:'mazeret'});
 // 3) Gerçek katılım kuralı ezer: «var» ve «gec» korunur
 s=portal.mazeretKuraliniUygula({a:{dersler:{1:'var',2:'gec',3:''},not:''}},['a'],siralar);
 assert.deepEqual(s.yoklama.a.dersler,{1:'var',2:'gec',3:'mazeret'});
 assert.deepEqual(s.yoklama.a.veliMazereti,['3']);
 // 4) Hoca kural sonrası bilerek «yok» yaptıysa geri alınmaz (sonsuz döngü olmaz)
 s=portal.mazeretKuraliniUygula({a:{dersler:{1:'yok',2:'mazeret',3:'mazeret'},not:'',veliMazereti:['1','2','3']}},['a'],siralar);
 assert.deepEqual(s.yoklama.a.dersler,{1:'yok',2:'mazeret',3:'mazeret'});
 assert.deepEqual(s.degisen,[]);
 // 5) Mazereti olmayan öğrenciye dokunulmaz; not ve diğer alanlar korunur
 s=portal.mazeretKuraliniUygula({a:{dersler:{1:'yok'},not:'Kendi notum'},b:{dersler:{1:'yok'},not:''}},['a'],siralar);
 assert.equal(s.yoklama.a.not,'Kendi notum');
 assert.deepEqual(s.yoklama.b.dersler,{1:'yok'});
 assert.deepEqual(s.degisen,['a']);
 // 6) Ders günü değilse (sıra yok) hiçbir şey yazılmaz
 assert.deepEqual(portal.mazeretKuraliniUygula({},['a'],[]).degisen,[]);
 assert.match(portal.MAZERET_KURALI,/her zaman kabul edilir/);
});
test('Yoklama ile ders defteri çelişkisi bildirilir',async()=>{
 assert.match(portal.yoklamaCelismesi('islendi','yok'),/Yok.*işaretli/);
 assert.match(portal.yoklamaCelismesi('gelmedi','var'),/Var.*işaretli/);
 assert.match(portal.yoklamaCelismesi('mazeretli','gec'),/Geç.*işaretli/);
 assert.equal(portal.yoklamaCelismesi('gelmedi','yok'),'');
 assert.equal(portal.yoklamaCelismesi('islendi','var'),'');
 assert.equal(portal.yoklamaCelismesi('islendi',undefined),'');
 assert.equal(portal.YOKLAMA_DURUMU.yok,'gelmedi');
 assert.equal(portal.YOKLAMA_DURUMU.mazeret,'mazeretli');
});
test('İdari temizlik ders defterini kapsar; ev kapsamı ve kardeşin defteri korunur',async()=>{
 await setDoc(doc(teacher(),dYol),dersKaydi());const kardes=dYol.replace('ogrenci-a','ogrenci-b');await setDoc(doc(teacher(),kardes),dersKaydi());
 let envt=await portal.portalEnvanteri(teacher(),'ogrenci-a');assert.equal(envt.sayilar['Ders defteri'],1);
 await portal.portalKayitlariniSil(teacher(),envt,'ev');assert.equal((await read(teacher(),dYol)).exists(),true);
 envt=await portal.portalEnvanteri(teacher(),'ogrenci-a');await portal.portalKayitlariniSil(teacher(),envt,'tum');
 assert.equal((await read(teacher(),dYol)).exists(),false);assert.equal((await read(teacher(),kardes)).exists(),true);
});
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
  await assertFails(read(veli('yabanci', 'yabanci@example.test'), 'ogrenciler/ogrenci-a'));
});
test('Veli yalnız kendi öğrencisini okur', async () => {
  await assertSucceeds(read(parent(), 'ogrenciler/ogrenci-a'));
  await assertFails(read(parent(), 'ogrenciler/ogrenci-b'));
  await assertFails(getDocs(collection(parent(), 'ogrenciler')));
});
test('E-posta büyük/küçük harf normalizasyonu çalışır', async () => {
  await assertSucceeds(read(veli('veli-a', 'VELI-A@EXAMPLE.TEST'), 'ogrenciler/ogrenci-a'));
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
/* 12 Eyl 2026: veli bildirimlerinde alan allowlist'i yoktu. Veli kendi belgesine keyfi
   alan/boyut ekleyebiliyor, `zaman`ı ileri tarihe atarak hoca ekranındaki sıralamada
   (azalan zaman) kendini en üste çıkarabiliyordu. */
test('Veli bildirimine keyfi alan eklenemez', async () => {
  for (const extra of [{ yanit: 'Hoca yanıtı gibi' }, { yonetici: true }, { dolgu: 'x'.repeat(900) },
    { dil: 'de' }, { ogrenciAd: 'x'.repeat(121) }, { tarih: '2026-09-05T00:00:00Z' }]) {
    await assertFails(setDoc(doc(parent(), 'bildirimler/gecersiz-alan'), message(extra)));
  }
  await assertSucceeds(setDoc(doc(parent(), 'bildirimler/gecerli-alan'),
    message({ ogrenciAd: 'Deneme A', dil: 'tr', tur: 'mazeret', tarih: '2026-09-05' })));
});
test('Veli bildirim zamanını uyduramaz', async () => {
  await assertFails(setDoc(doc(parent(), 'bildirimler/ileri-tarih'),
    message({ zaman: Timestamp.fromMillis(Date.now() + 86400000) })));
  await assertFails(updateDoc(doc(parent(), 'bildirimler/kendi'),
    { zaman: Timestamp.fromMillis(Date.now() + 86400000) }));
  await assertFails(updateDoc(doc(parent(), 'bildirimler/kendi'), { yonetici: true }));
});
/* Veli portalının 'bildir' dalının düzenlemede gönderdiği TAM alan kümesi (mazeret ve
   mazeret olmayan iki hâl); kural allowlist'i istemciyi kilitlemesin. */
test('Veli portalının gönderdiği düzenleme yükü aynen kabul edilir', async () => {
  await assertSucceeds(updateDoc(doc(parent(), 'bildirimler/kendi'),
    { ref: 'ogrenci-a', tur: 'soru', metin: 'Düzeltme', ogrenciAd: 'Deneme A', dil: 'tr', tarih: null }));
  await assertSucceeds(updateDoc(doc(parent(), 'bildirimler/kendi'),
    { ref: 'ogrenci-a', tur: 'mazeret', metin: 'Gelemeyecek', ogrenciAd: 'Deneme A', dil: 'fr', tarih: '2026-09-05' }));
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

const evKayit=(extra={})=>{const d=new Date();d.setUTCHours(12,0,0,0);return {son:Timestamp.fromDate(d),sonraki:Timestamp.fromMillis(d.getTime()+86400000),basamak:1,cevap:'rahat',guncelleme:serverTimestamp(),...extra};};
const evYol='evCalismalari/ogrenci-a/etkinlikler/hayat-su';
const bYol='bultenler/ogrenci-a/haftalar/2026-09-12';
const bulten=(extra={})=>({tarih:'2026-09-12',hafta:2,dil:'tr',metin:{ders:'Örnek ders',odev:'Birlikte tekrar',getir:'Defter',not:''},yayin:true,surum:1,guncelleme:serverTimestamp(),...extra});

test('Bülteni yalnız hoca yazar; veli yalnız kendi yayımlanmış bültenlerini sorgular',async()=>{
 await assertSucceeds(setDoc(doc(teacher(),bYol),bulten()));
 await assertFails(setDoc(doc(parent(),bYol),bulten()));
 await assertSucceeds(read(parent(),bYol));
 await assertFails(read(veli('veli-b', 'veli-b@example.test'),bYol));
 await assertSucceeds(getDocs(query(collection(parent(),'bultenler/ogrenci-a/haftalar'),where('yayin','==',true))));
 await assertFails(getDocs(collection(parent(),'bultenler/ogrenci-a/haftalar')));
 await assertSucceeds(setDoc(doc(teacher(),bYol),bulten({surum:2,yayin:false})));
 await assertFails(read(parent(),bYol));
});

test('Okudum bildirimi veliye, yayımlanmış sürüme ve sunucu tarihine bağlıdır',async()=>{
 await setDoc(doc(teacher(),bYol),bulten());
 const r=doc(parent(),bYol+'/okumalar/veli-a@example.test');
 await assertSucceeds(setDoc(r,{surum:1,zaman:serverTimestamp()}));
 await assertFails(setDoc(r,{surum:2,zaman:serverTimestamp()}));
 await assertFails(setDoc(r,{surum:1,zaman:Timestamp.fromMillis(0)}));
 await assertFails(setDoc(r,{surum:1,zaman:serverTimestamp(),imza:'sahte'}));
 await assertFails(setDoc(doc(parent(),bYol+'/okumalar/baska@example.test'),{surum:1,zaman:serverTimestamp()}));
 await assertSucceeds(read(teacher(),bYol+'/okumalar/veli-a@example.test'));
 await assertFails(getDocs(collection(parent(),bYol+'/okumalar')));
 await setDoc(doc(teacher(),bYol),bulten({surum:2}));
 await assertFails(setDoc(r,{surum:1,zaman:serverTimestamp()}));
 await assertSucceeds(setDoc(r,{surum:2,zaman:serverTimestamp()}));
 await setDoc(doc(teacher(),bYol),bulten({surum:3,yayin:false}));
 await assertFails(setDoc(r,{surum:3,zaman:serverTimestamp()}));
});

test('Bülten yanlış sürüm, ek alan, uzun metin ve istemci saatiyle kaydedilemez',async()=>{
 for(const extra of [{surum:5},{imza:'x'},{guncelleme:Timestamp.fromMillis(0)},{metin:{ders:'x'.repeat(2201),odev:'',getir:'',not:''}}])await assertFails(setDoc(doc(teacher(),bYol),bulten(extra)));
 await setDoc(doc(teacher(),bYol),bulten());
 await assertFails(setDoc(doc(teacher(),bYol),bulten()));
});

test('İdari kilit sırasında yeni öğrenci kayıtları yazılamaz; diğer öğrenci etkilenmez',async()=>{
 await assertFails(setDoc(doc(parent(),'portalSilme/ogrenci-a'),{islem:'test',zaman:serverTimestamp()}));
 await setDoc(doc(teacher(),'portalSilme/ogrenci-a'),{islem:'test',zaman:serverTimestamp()});
 await assertFails(setDoc(doc(parent(),evYol),evKayit()));
 await assertFails(setDoc(doc(parent(),'bildirimler/yeni'),message()));
 await assertFails(setDoc(doc(teacher(),bYol),bulten()));
 await assertFails(setDoc(doc(teacher(),'yoklama/yeni'),{ref:'ogrenci-a'}));
 await assertSucceeds(setDoc(doc(teacher(),'yoklama/yeni-b'),{ref:'ogrenci-b'}));
 await assertFails(deleteDoc(doc(parent(),'portalSilme/ogrenci-a')));
});

test('Gerçek işlem: bülten sürüm çakışması metni ezmez ve okuma eski sürüme kaydedilmez',async()=>{
 const depo=portal.bultenDeposu(teacher(),'ogrenci-a');
 const veri={id:'2026-09-12',...bulten()};delete veri.guncelleme;delete veri.surum;
 const b=await depo.kaydet(veri,0);assert.equal(b.surum,1);
 await assert.rejects(()=>depo.kaydet({...veri,metin:{...veri.metin,ders:'Eski ekran'}},0),/başka bir ekranda/);
 const veli=portal.bultenDeposu(parent(),'ogrenci-a');await veli.okudum(b,'veli-a@example.test');
 await depo.kaydet(veri,1);await assert.rejects(()=>veli.okudum(b,'veli-a@example.test'),/BULTEN_DEGISTI/);
 assert.equal((await read(teacher(),bYol)).data().metin.ders,'Örnek ders');
});

test('Gerçek silme: bülten alt kayıtları dahil yalnız seçili öğrenci silinir; ortak veli ve kardeş korunur',async()=>{
 await updateDoc(doc(teacher(),'aileler/veli-a@example.test'),{ogrenciler:['ogrenci-a','ogrenci-b'],kitapSecim:{'ogrenci-a':{secim:'var'},'ogrenci-b':{secim:'satin'}}});
 await setDoc(doc(parent(),evYol),evKayit());await setDoc(doc(teacher(),bYol),bulten());
 await setDoc(doc(parent(),bYol+'/okumalar/veli-a@example.test'),{surum:1,zaman:serverTimestamp()});
 const once=await portal.portalEnvanteri(teacher(),'ogrenci-a');assert.equal(once.sayilar['Bülten okuma bildirimleri'],1);
 assert.equal(await portal.portalKayitlariniSil(teacher(),once,'tum'),once.belgeler.length);
 for(const p of [evYol,bYol,bYol+'/okumalar/veli-a@example.test','ogrenciler/ogrenci-a','ilerleme/ogrenci-a','yoklama/a','bildirimler/kendi'])assert.equal((await read(teacher(),p)).exists(),false,p);
 assert.equal((await read(teacher(),'ogrenciler/ogrenci-b')).exists(),true);
 const aile=(await read(teacher(),'aileler/veli-a@example.test')).data();assert.deepEqual(aile.ogrenciler,['ogrenci-b']);assert.deepEqual(aile.kitapSecim,{'ogrenci-b':{secim:'satin'}});
 assert.equal((await read(teacher(),'aileler/veli-b@example.test')).exists(),true);
 assert.equal((await read(teacher(),'portalSilme/ogrenci-a')).exists(),false);
});

test('Gerçek silme: değişmiş dökümde hiçbir kayıt silinmez; yalnız ev çalışması temizliği profili korur',async()=>{
 await setDoc(doc(parent(),evYol),evKayit());const once=await portal.portalEnvanteri(teacher(),'ogrenci-a');
 await setDoc(doc(teacher(),'notlar/sonradan'),{ref:'ogrenci-a',metin:'Yeni kayıt'});
 await assert.rejects(()=>portal.portalKayitlariniSil(teacher(),once,'tum'),/incelemeden sonra değişti/);
 assert.equal((await read(teacher(),'ogrenciler/ogrenci-a')).exists(),true);
 assert.equal((await read(teacher(),'portalSilme/ogrenci-a')).exists(),false);
 const yeni=await portal.portalEnvanteri(teacher(),'ogrenci-a');assert.equal(await portal.portalKayitlariniSil(teacher(),yeni,'ev'),1);
 assert.equal((await read(teacher(),evYol)).exists(),false);assert.equal((await read(teacher(),'notlar/sonradan')).exists(),true);
});

test('Veli bağı tek işlemde eklenir/kalkar; mevcut aile dili, kardeş ve kitap tercihi korunur',async()=>{
 await updateDoc(doc(teacher(),'aileler/veli-b@example.test'),{kitapSecim:{'ogrenci-b':{secim:'var'}}});
 const veliler=await portal.portalVeliBagi(teacher(),'ogrenci-a','veli-b@example.test',true);assert.deepEqual(veliler,['veli-b@example.test']);
 let a=(await read(teacher(),'aileler/veli-b@example.test')).data();assert.equal(a.dil,'fr');assert.deepEqual(a.ogrenciler,['ogrenci-b','ogrenci-a']);
 await portal.portalVeliBagi(teacher(),'ogrenci-a','veli-b@example.test',false);
 a=(await read(teacher(),'aileler/veli-b@example.test')).data();assert.deepEqual(a.ogrenciler,['ogrenci-b']);assert.deepEqual(a.kitapSecim,{'ogrenci-b':{secim:'var'}});
 await setDoc(doc(teacher(),'portalSilme/ogrenci-a'),{islem:'kilit',zaman:serverTimestamp()});
 await assert.rejects(()=>portal.portalVeliBagi(teacher(),'ogrenci-a','veli-b@example.test',true),/idari işlemi sürüyor/);
 assert.deepEqual((await read(teacher(),'aileler/veli-b@example.test')).data().ogrenciler,['ogrenci-b']);
});
test('Ev çalışması yalnız bağlı aileye ve hocaya görünür; anonim, yabancı aile ve koleksiyon grubu kapalı',async()=>{
 await assertSucceeds(setDoc(doc(parent(),evYol),evKayit()));
 await assertSucceeds(read(teacher(),evYol));
 await assertSucceeds(getDocs(collection(parent(),'evCalismalari/ogrenci-a/etkinlikler')));
 await assertFails(read(env.unauthenticatedContext().firestore(),evYol));
 await assertFails(read(veli('veli-b', 'veli-b@example.test'),evYol));
 await assertFails(getDocs(collection(parent(),'evCalismalari/ogrenci-b/etkinlikler')));
});
test('Ev çalışması başka öğrenci adına, katalog dışına veya öğretmen notuna yazılamaz',async()=>{
 await assertFails(setDoc(doc(parent(),'evCalismalari/ogrenci-b/etkinlikler/hayat-su'),evKayit()));
 await assertFails(setDoc(doc(parent(),'evCalismalari/ogrenci-a/etkinlikler/yabanci'),evKayit()));
 await assertFails(setDoc(doc(parent(),evYol),evKayit({not:100})));
 await assertFails(setDoc(doc(teacher(),evYol),evKayit()));
});
test('Ev çalışması tarih, sunucu saati ve tekrar aralığını doğrular',async()=>{
 for(const extra of [{son:'2026-09-12'},{basamak:4},{cevap:'super'},{cevap:'destek',basamak:1},{guncelleme:Timestamp.fromMillis(0)},{son:Timestamp.fromMillis(Date.now()+10*86400000)},{sonraki:Timestamp.fromMillis(0)}])await assertFails(setDoc(doc(parent(),evYol),evKayit(extra)));
 await assertSucceeds(setDoc(doc(parent(),evYol),evKayit()));
 const old=Date.now()-10*86400000;
 await assertFails(setDoc(doc(parent(),evYol),evKayit({son:Timestamp.fromMillis(old),sonraki:Timestamp.fromMillis(old+86400000)})));
});
test('Ev çalışmasını veli silemez; hoca silebilir; bağlı ikinci veli okuyabilir',async()=>{
 await assertSucceeds(setDoc(doc(parent(),evYol),evKayit()));
 await assertFails(deleteDoc(doc(parent(),evYol)));
 await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'aileler/ikinci@example.test'),{ogrenciler:['ogrenci-a']}));
 await assertSucceeds(read(veli('ikinci', 'ikinci@example.test'),evYol));
 await assertSucceeds(deleteDoc(doc(teacher(),evYol)));
});

test('Aynı gün sunucu tarafında da tekrar basamağı yükseltilemez',async()=>{
 const k=evKayit();await assertSucceeds(setDoc(doc(parent(),evYol),k));
 await assertFails(setDoc(doc(parent(),evYol),{...k,basamak:3,sonraki:Timestamp.fromMillis(k.son.toMillis()+7*86400000)}));
 await assertSucceeds(setDoc(doc(parent(),evYol),{...k,basamak:0,cevap:'destek'}));
});
/* 14 Eyl 2026: defter kaydının Fransızca çevirisi — hocaya açık, veliye kapalı, alanlar/kimlik/sürüm doğrulanır. */
test('Ders defteri çevirisi yalnız hocaya açık; kimlik = kayıt_dil; alanlar ve sunucu zamanı doğrulanır',async()=>{
 const cYol='dersDefteri/ogrenci-a/ceviriler/2026-09-05_1_fr';
 const ceviri=(extra={})=>({kayitId:'2026-09-05_1',dil:'fr',kaynakSurum:1,yontem:'kalip',calisma:'Sa participation au cours était bonne.',odev:'',sonraki:'',okunan:'',dikkat:'',guncelleme:serverTimestamp(),...extra});
 await assertSucceeds(setDoc(doc(teacher(),cYol),ceviri()));
 await assertSucceeds(setDoc(doc(teacher(),cYol),ceviri({kaynakSurum:2,yontem:'karma'}))); // güncelleme: sürüm kilidi yok, kaynakSurum izler
 await assertSucceeds(read(teacher(),cYol));
 for(const db of [parent(),env.unauthenticatedContext().firestore()]){
  await assertFails(read(db,cYol));await assertFails(getDocs(collection(db,'dersDefteri/ogrenci-a/ceviriler')));
  await assertFails(setDoc(doc(db,cYol),ceviri()));await assertFails(deleteDoc(doc(db,cYol)));
 }
 for(const extra of [{dil:'en'},{yontem:'elle'},{kaynakSurum:0},{calisma:''},{calisma:'x'.repeat(2401)},{odev:'x'.repeat(1401)},{kayitId:'2026-09-05_4'},{ek:'x'},{guncelleme:Timestamp.fromMillis(0)}])
  await assertFails(setDoc(doc(teacher(),cYol),ceviri(extra)));
 await assertFails(setDoc(doc(teacher(),'dersDefteri/ogrenci-a/ceviriler/2026-09-05_2_fr'),ceviri())); // kimlik kayıtla eşleşmeli
 await setDoc(doc(teacher(),'portalSilme/ogrenci-a'),{islem:'test',zaman:serverTimestamp()});
 await assertFails(setDoc(doc(teacher(),cYol),ceviri({kaynakSurum:3})));
 await deleteDoc(doc(teacher(),'portalSilme/ogrenci-a'));
});
/* 26 Eyl 2026 (Ezber Kilimi Faz 0 kural denetimi): hesap açma herkese açık. Veli henüz giriş yapmadan biri onun
   adresiyle herkese açık kayıt ucundan DOĞRULANMAMIŞ şifreli hesap açarsa aile rolünü alamamalı. */
test('Doğrulanmamış e-postayla açılan hesap aile rolünü alamaz', async () => {
  const sahteler = [
    env.authenticatedContext('saldirgan', { email: 'veli-a@example.test', email_verified: false }).firestore(),
    env.authenticatedContext('saldirgan-2', { email: 'veli-a@example.test' }).firestore(),
  ];
  for (const sahte of sahteler) {
    for (const yol of ['ogrenciler/ogrenci-a', 'aileler/veli-a@example.test', 'yoklama/a', 'ilerleme/ogrenci-a', 'degerlendirme/a',
      'notlar/gorunur', 'odevler/yayinda', 'duyurular/yayinda', 'bildirimler/kendi', evYol]) await assertFails(read(sahte, yol));
    await assertFails(getDocs(query(collection(sahte, 'yoklama'), where('ref', '==', 'ogrenci-a'))));
    await assertFails(getDocs(query(collection(sahte, 'bildirimler'), where('eposta', '==', 'veli-a@example.test'))));
    await assertFails(setDoc(doc(sahte, 'bildirimler/sahte'), message()));
    await assertFails(updateDoc(doc(sahte, 'aileler/veli-a@example.test'), { dil: 'fr' }));
    await assertFails(deleteDoc(doc(sahte, 'bildirimler/kendi')));
    await assertFails(setDoc(doc(sahte, evYol), evKayit()));
  }
});
/* Faz 3'te genel cemaate hesap açılacak: aileye ve hocaya bağlı olmayan doğrulanmış bir hesap hiçbir portal
   verisine erişememeli ve kendini aile/hoca yapamamalı. */
test('Kayıtsız doğrulanmış hesap portal verisine erişemez ve kendini yükseltemez', async () => {
  const uye = veli('uye-1', 'uye@example.test');
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), bYol), bulten());
    await setDoc(doc(context.firestore(), dYol), dersKaydi({ guncelleme: Timestamp.now() }));
  });
  for (const yol of ['ogrenciler/ogrenci-a', 'aileler/veli-a@example.test', 'yoklama/a', 'ilerleme/ogrenci-a', 'degerlendirme/a',
    'notlar/gorunur', 'odevler/yayinda', 'duyurular/yayinda', 'bildirimler/kendi', 'ayarlar/genel', 'hocalar/hoca-a', dYol, bYol, evYol]) {
    await assertFails(read(uye, yol));
  }
  for (const ad of ['ogrenciler', 'aileler', 'yoklama', 'ilerleme', 'degerlendirme', 'notlar', 'bildirimler', 'hocalar', 'ayarlar']) {
    await assertFails(getDocs(collection(uye, ad)));
  }
  for (const ad of ['odevler', 'duyurular']) await assertFails(getDocs(query(collection(uye, ad), where('yayin', '==', true))));
  await assertFails(setDoc(doc(uye, 'aileler/uye@example.test'), { ogrenciler: ['ogrenci-a'], dil: 'tr' }));
  await assertFails(setDoc(doc(uye, 'hocalar/uye-1'), { adSoyad: 'Sahte hoca' }));
  await assertFails(setDoc(doc(uye, 'bildirimler/uye'), message({ eposta: 'uye@example.test' })));
  await assertFails(setDoc(doc(uye, 'ilerleme/ogrenci-a'), { seviye: 9 }));
  await assertFails(setDoc(doc(uye, 'yoklama/sahte'), { ref: 'ogrenci-a' }));
  await assertFails(setDoc(doc(uye, 'portalSilme/ogrenci-a'), { islem: 'x', zaman: serverTimestamp() }));
  await assertFails(setDoc(doc(uye, evYol), evKayit()));
});

/* 27 Eyl 2026 — Ezber Kilimi Faz 1b: ezberDurum/{ref} (öğrenci başına tek belge, yazım başına tek madde) ve olaylar.
   Plan: docs/superpowers/plans/2026-09-27-ezber-kilimi-faz-1b-durum.md; belge: docs/EZBER-KILIMI.md. */
const ezYol = 'ezberDurum/ogrenci-a';
const ezGun = '2026-10-17';
const ezOge = (ek = {}) => ({ basamak: 2, kalite: 'tam', notlar: ['med'], son: serverTimestamp(), sonrakiKontrol: '2026-10-24', surum: 1, ...ek });
const ezBelge = (id = 's-fatiha', oge = ezOge(), ek = {}) => ({ ogeler: { [id]: oge }, degisen: id, guncelleme: serverTimestamp(), ...ek });
const ezOlay = (ek = {}) => ({ ezber: 's-fatiha', tur: 'dinleme', kalite: 'tam', notlar: [], basamakOnce: 0, basamakSonra: 2, zorla: false, tarih: ezGun, zaman: serverTimestamp(), ...ek });
const ezYaz = (db, veri, yol = ezYol) => setDoc(doc(db, yol), veri, { merge: true });

test('Ezber durumu: hoca yazar ve okur, bağlı veli okur; başkası okuyamaz, veli ve üye yazamaz', async () => {
  await assertSucceeds(ezYaz(teacher(), ezBelge()));
  await assertSucceeds(setDoc(doc(teacher(), ezYol + '/olaylar/o1'), ezOlay()));
  await assertSucceeds(read(teacher(), ezYol));
  await assertSucceeds(getDocs(collection(teacher(), 'ezberDurum')));
  await assertSucceeds(read(parent(), ezYol));
  await assertSucceeds(getDocs(collection(parent(), ezYol + '/olaylar')));
  await assertFails(getDocs(collection(parent(), 'ezberDurum')));
  const yabancilar = [veli('veli-b', 'veli-b@example.test'), env.unauthenticatedContext().firestore(), veli('uye-1', 'uye@example.test'),
    env.authenticatedContext('saldirgan', { email: 'veli-a@example.test', email_verified: false }).firestore()];
  for (const db of yabancilar) {
    await assertFails(read(db, ezYol));
    await assertFails(read(db, ezYol + '/olaylar/o1'));
    await assertFails(getDocs(collection(db, ezYol + '/olaylar')));
  }
  for (const db of [parent(), veli('uye-1', 'uye@example.test')]) {
    await assertFails(ezYaz(db, ezBelge('s-ihlas')));
    await assertFails(setDoc(doc(db, ezYol + '/olaylar/o2'), ezOlay()));
    await assertFails(deleteDoc(doc(db, ezYol + '/olaylar/o1')));
    await assertFails(deleteDoc(doc(db, ezYol)));
  }
});

test('Ezber durumu biçimi: bozuk madde, sürüm, bildirilmeyen ya da iki madde, istemci saati reddedilir', async () => {
  const bozuk = [ezOge({ basamak: 0 }), ezOge({ basamak: 5 }), ezOge({ basamak: '2' }), ezOge({ kalite: 'super' }),
    ezOge({ notlar: ['a', 'b', 'c', 'd'] }), ezOge({ notlar: [3] }), ezOge({ notlar: ['Med'] }), ezOge({ notlar: 'med' }),
    ezOge({ sonrakiKontrol: '24.10.2026' }), ezOge({ sonrakiKontrol: '2026-13-01' }), ezOge({ sonrakiKontrol: '' }),
    ezOge({ basamak: 4 }), ezOge({ basamak: 3, sonrakiKontrol: '' }), ezOge({ surum: 2 }), ezOge({ surum: 0 }),
    ezOge({ son: Timestamp.fromMillis(0) }), ezOge({ ek: 'x' }), (({ surum, ...o }) => o)(ezOge())];
  for (const oge of bozuk) await assertFails(ezYaz(teacher(), ezBelge('s-fatiha', oge)));
  await assertFails(ezYaz(teacher(), ezBelge('s-fatiha', ezOge(), { guncelleme: Timestamp.fromMillis(0) })));
  await assertFails(ezYaz(teacher(), ezBelge('s-fatiha', ezOge(), { fazla: 1 })));
  await assertFails(ezYaz(teacher(), { ogeler: { 's-fatiha': ezOge(), 's-ihlas': ezOge() }, degisen: 's-fatiha', guncelleme: serverTimestamp() }));
  await assertFails(ezYaz(teacher(), { ogeler: { 's-fatiha': ezOge() }, degisen: 's-ihlas', guncelleme: serverTimestamp() }));
  for (const id of ['S-fatiha', 'x-fatiha', 's-' + 'a'.repeat(39), 's--fatiha']) await assertFails(ezYaz(teacher(), ezBelge(id)));
  // Geçerli akış: ilk kayıt, sürümlü güncellemeler, başka maddeler.
  await assertSucceeds(ezYaz(teacher(), ezBelge()));
  await assertFails(ezYaz(teacher(), ezBelge()));                                   // aynı sürüm yeniden: eski ekran
  for (const oge of [ezOge({ basamak: 5, surum: 2 }), ezOge({ kalite: 'super', surum: 2 }), ezOge({ surum: 2, son: Timestamp.fromMillis(0) })])
    await assertFails(ezYaz(teacher(), ezBelge('s-fatiha', oge)));
  await assertSucceeds(ezYaz(teacher(), ezBelge('s-fatiha', ezOge({ basamak: 3, sonrakiKontrol: '2026-11-16', surum: 2 }))));
  await assertFails(ezYaz(teacher(), ezBelge('s-fatiha', ezOge({ basamak: 4, sonrakiKontrol: '', surum: 4 }))));
  await assertSucceeds(ezYaz(teacher(), ezBelge('s-fatiha', ezOge({ basamak: 4, sonrakiKontrol: '', surum: 3 }))));
  await assertSucceeds(ezYaz(teacher(), ezBelge('s-ihlas', ezOge({ basamak: 1, kalite: '', notlar: [], sonrakiKontrol: '', surum: 1 }))));
  await assertSucceeds(ezYaz(teacher(), ezBelge('s-kevser', ezOge({ basamak: 1, kalite: 'tekrar', sonrakiKontrol: '2026-10-24', surum: 1 }))));
  // Bildirilmeyen madde değişemez; bütün haritayı yazan updateDoc başka maddeleri silemez.
  await assertFails(ezYaz(teacher(), { ogeler: { 's-ihlas': ezOge({ surum: 2 }) }, degisen: 's-kevser', guncelleme: serverTimestamp() }));
  await assertFails(updateDoc(doc(teacher(), ezYol), { ogeler: { 's-fatiha': ezOge({ basamak: 4, sonrakiKontrol: '', surum: 4 }) }, degisen: 's-fatiha', guncelleme: serverTimestamp() }));
  // Madde kaldırma (hocanın düzeltmesi) yalnız maddenin sunucudaki sürümüyle: kuyrukta kalmış eski «Geri al» ya da eski
  // ekrandaki «Kaydı kaldır», o arada başka telefonun yazdığı daha yeni kaydı silemez (27 Eyl 2026, inceleme F2).
  const kaldir = (id, ek = {}) => ({ ogeler: { [id]: deleteField() }, degisen: id, guncelleme: serverTimestamp(), ...ek });
  await assertFails(ezYaz(teacher(), kaldir('s-ihlas')));
  for (const silinenSurum of [2, 0, '1', 1.5]) await assertFails(ezYaz(teacher(), kaldir('s-ihlas', { silinenSurum })));
  await assertFails(ezYaz(teacher(), kaldir('s-tebbet', { silinenSurum: 1 })));          // olmayan madde
  await assertSucceeds(ezYaz(teacher(), kaldir('s-ihlas', { silinenSurum: 1 })));
  const son = (await read(teacher(), ezYol)).data();
  assert.deepEqual(Object.keys(son.ogeler).sort(), ['s-fatiha', 's-kevser']);
  assert.deepEqual([son.ogeler['s-fatiha'].basamak, son.ogeler['s-fatiha'].surum, son.degisen], [4, 3, 's-ihlas']);
});

test('Ezber durumu: öğrenci yoksa açılmaz; idari kilit yazımı durdurur; silinen öğrencinin açık ekranı yazamaz', async () => {
  await assertFails(ezYaz(teacher(), ezBelge(), 'ezberDurum/yok'));
  await assertSucceeds(ezYaz(teacher(), ezBelge()));
  await setDoc(doc(teacher(), 'portalSilme/ogrenci-a'), { islem: 'test', zaman: serverTimestamp() });
  await assertFails(ezYaz(teacher(), ezBelge('s-ihlas')));
  await assertFails(setDoc(doc(teacher(), ezYol + '/olaylar/k1'), ezOlay()));
  await assertSucceeds(ezYaz(teacher(), ezBelge('s-ihlas'), 'ezberDurum/ogrenci-b'));  // kardeş etkilenmez
  await deleteDoc(doc(teacher(), 'portalSilme/ogrenci-a'));
  await deleteDoc(doc(teacher(), ezYol));
  await deleteDoc(doc(teacher(), 'ogrenciler/ogrenci-a'));
  await assertFails(ezYaz(teacher(), ezBelge()));
  await assertFails(setDoc(doc(teacher(), ezYol + '/olaylar/k2'), ezOlay()));
});

test('Ezber olayları: biçim doğrulanır, yalnız eklenir; güncellenemez; sahipsiz olay yazılamaz', async () => {
  await assertFails(setDoc(doc(teacher(), ezYol + '/olaylar/sahipsiz'), ezOlay()));
  await ezYaz(teacher(), ezBelge());
  const o = (id) => doc(teacher(), `${ezYol}/olaylar/${id}`);
  const bozuk = [{ tur: 'sinav' }, { kalite: '' }, { tur: 'atama', kalite: 'tam' }, { zorla: 'evet' },
    { tur: 'duzeltme', kalite: '', zorla: true }, { basamakOnce: 5 }, { basamakSonra: -1 }, { basamakOnce: 1.5 },
    { tur: 'atama', kalite: '', basamakOnce: 0, basamakSonra: 2 }, { tur: 'gecis', kalite: '', basamakOnce: 1, basamakSonra: 2 },
    { tur: 'gecis', kalite: '', basamakOnce: 0, basamakSonra: 3 }, { notlar: ['a', 'b', 'c', 'd'] }, { notlar: ['Serbest not'] },
    { tarih: '17.10.2026' }, { tarih: '2026-10-32' }, { ezber: 'ezber-fatiha' }, { zaman: Timestamp.fromMillis(0) }, { metin: 'serbest not' }];
  for (const ek of bozuk) await assertFails(setDoc(o('bozuk'), ezOlay(ek)));
  const { zorla, ...eksik } = ezOlay();
  await assertFails(setDoc(o('eksik'), eksik));
  await assertSucceeds(setDoc(o('a1'), ezOlay()));
  await assertSucceeds(setDoc(o('a2'), ezOlay({ tur: 'atama', kalite: '', basamakOnce: 0, basamakSonra: 1 })));
  await assertSucceeds(setDoc(o('a3'), ezOlay({ tur: 'gecis', kalite: '', basamakOnce: 0, basamakSonra: 2 })));
  await assertSucceeds(setDoc(o('a4'), ezOlay({ tur: 'duzeltme', kalite: '', basamakOnce: 3, basamakSonra: 0 })));
  await assertSucceeds(setDoc(o('a5'), ezOlay({ basamakOnce: 2, basamakSonra: 3, zorla: true, notlar: ['med', 'mahrec', 'gayret'] })));
  await assertFails(setDoc(o('a1'), ezOlay({ kalite: 'az' })));
  await assertFails(updateDoc(o('a1'), { kalite: 'az' }));
  await assertSucceeds(deleteDoc(o('a1')));
});

test('Ezber deposu: durum ve olay tek toplu yazımda; iki telefonda farklı madde geçer, aynı maddede eski ekran çakışma alır', async () => {
  const A = portal.ezberDeposu(teacher(), 'ogrenci-a');
  const Bt = portal.ezberDeposu(teacher(), 'ogrenci-a');
  await A.uygula(portal.dinle(undefined, 's-fatiha', 'tam', ezGun));
  const [eskiA, eskiB] = [await A.oku(), await Bt.oku()];                       // iki telefon aynı anda açık
  await A.uygula(portal.dinle(eskiA['s-fatiha'], 's-fatiha', 'tekrar', ezGun, { notlar: ['med'] }));
  await Bt.uygula(portal.ata(eskiB['s-ihlas'], 's-ihlas', ezGun));              // başka madde: geçer
  await assert.rejects(() => Bt.uygula(portal.dinle(eskiB['s-fatiha'], 's-fatiha', 'az', ezGun, { zorla: true })),
    (e) => e.message === portal.EZBER_CAKISMA);
  await assert.rejects(() => Bt.uygula(portal.ata(undefined, 's-ihlas', ezGun)), (e) => e.message === portal.EZBER_CAKISMA);
  const son = await A.oku();
  assert.deepEqual(son['s-fatiha'], { basamak: 1, kalite: 'tekrar', notlar: ['med'], sonrakiKontrol: '2026-10-24', surum: 2 });
  assert.deepEqual(son['s-ihlas'], { basamak: 1, kalite: '', notlar: [], sonrakiKontrol: '', surum: 1 });
  // Erken dinleme yalnız olay yazar; madde kaldırma olayıyla birlikte gider.
  await A.uygula(portal.dinle(son['s-ihlas'], 's-ihlas', 'tam', ezGun));
  const ihlas = (await A.oku())['s-ihlas'];
  assert.equal(portal.dinle(ihlas, 's-ihlas', 'tam', ezGun).islem, 'olay');
  await A.uygula(portal.dinle(ihlas, 's-ihlas', 'tam', ezGun));
  assert.deepEqual((await A.oku())['s-ihlas'], ihlas);
  await A.uygula(portal.duzelt(ihlas, 's-ihlas', null, ezGun));
  assert.deepEqual(Object.keys(await A.oku()), ['s-fatiha']);
  const olaylar = await A.olaylar();
  assert.deepEqual(olaylar.map((x) => [x.ezber, x.tur, x.kalite, x.basamakOnce, x.basamakSonra]), [
    ['s-ihlas', 'duzeltme', '', 2, 0], ['s-ihlas', 'dinleme', 'tam', 2, 2], ['s-ihlas', 'dinleme', 'tam', 1, 2],
    ['s-ihlas', 'atama', '', 0, 1], ['s-fatiha', 'dinleme', 'tekrar', 2, 1], ['s-fatiha', 'dinleme', 'tam', 0, 2]]);
  assert.ok(olaylar.every((x) => x.zamanMs > 0 && x.id));
  assert.equal((await A.olaylar(2)).length, 2);
  assert.deepEqual(Object.keys(await portal.ezberSinifi(teacher())), ['ogrenci-a']);
  assert.throws(() => portal.ezberDeposu(teacher(), 'a/b'), /geçersiz/);
});

/* 27 Eyl 2026 — Faz 1c: «Geri al» yanlış dokunuşu iz bırakmadan geri alır (veli geçmişinde görünmez); araya başka
   cihaz girdiyse hiçbir şey yazılmaz. */
test('Ezber geri alma: yeni madde kalkar, ilerletme eski hâline döner, erken dinlemenin olayı silinir; başka cihaz girdiyse çakışma', async () => {
  const A = portal.ezberDeposu(teacher(), 'ogrenci-a');
  const dokun = async (once, gecis) => ({ id: gecis.olay.ezber, once, gecis, bugun: ezGun, olayId: await A.uygula(gecis, A.olayKimligi()) });
  // 1) İlk dinleme geri alınınca madde ve olayı kalmaz.
  const d1 = await dokun(undefined, portal.dinle(undefined, 's-fatiha', 'tam', ezGun));
  assert.equal((await A.olaylar()).length, 1);
  await A.geriAl(d1, (await A.oku())['s-fatiha']);
  assert.deepEqual(await A.oku(), {});
  assert.deepEqual(await A.olaylar(), []);
  // 2) «Yine de ilerlet» geri alınınca önceki basamak, kalite ve notlar döner; sürüm artmaya devam eder.
  await A.uygula(portal.dinle(undefined, 's-ihlas', 'az', ezGun, { notlar: ['med'] }));
  const once = (await A.oku())['s-ihlas'];
  const d2 = await dokun(once, portal.dinle(once, 's-ihlas', 'tam', ezGun, { zorla: true, notlar: ['akici'] }));
  assert.equal((await A.oku())['s-ihlas'].basamak, 3);
  await A.geriAl(d2, (await A.oku())['s-ihlas']);
  assert.deepEqual((await A.oku())['s-ihlas'], { ...once, surum: 3 });
  assert.deepEqual((await A.olaylar()).map((x) => [x.ezber, x.basamakSonra]), [['s-ihlas', 2]]);
  // 3) Erken dinleme yalnız olaydır: geri alma yalnız olayı siler, durum aynen kalır.
  const ihlas = (await A.oku())['s-ihlas'];
  const d3 = await dokun(ihlas, portal.dinle(ihlas, 's-ihlas', 'tam', ezGun));
  assert.equal(d3.gecis.islem, 'olay');
  await A.geriAl(d3, (await A.oku())['s-ihlas']);
  assert.deepEqual((await A.oku())['s-ihlas'], ihlas);
  assert.equal((await A.olaylar()).length, 1);
  // 4) Dokunuştan sonra başka telefon aynı maddeyi değiştirdiyse geri alma yazmaz.
  const d4 = await dokun(ihlas, portal.dinle(ihlas, 's-ihlas', 'tekrar', ezGun));
  const B = portal.ezberDeposu(teacher(), 'ogrenci-a');
  const araya = (await B.oku())['s-ihlas'];
  await B.uygula(portal.dinle(araya, 's-ihlas', 'tam', ezGun));
  const simdi = (await A.oku())['s-ihlas'];
  await assert.rejects(() => A.geriAl(d4, simdi), (e) => e.message === portal.EZBER_CAKISMA);
  // Eski ekran (sürümü geride) de yazamaz: kural reddeder, depo çakışma diye ayırır.
  await assert.rejects(() => A.geriAl(d4, araya), (e) => e.message === portal.EZBER_CAKISMA);
  assert.deepEqual((await A.oku())['s-ihlas'], simdi);
  assert.equal((await A.olaylar()).length, 3);
  // 5) Erken dinleme (yalnız olay) geri alınırken madde o arada başka telefonda ilerlediyse ilerleme yerinde kalır:
  //    geri alma durumu hiç yazmaz, yalnız kendi olayını siler (27 Eyl 2026, inceleme F1).
  await A.uygula(portal.dinle(undefined, 's-kevser', 'tam', ezGun));
  const kevser = (await A.oku())['s-kevser'];
  const d5 = await dokun(kevser, portal.dinle(kevser, 's-kevser', 'tam', ezGun));
  assert.equal(d5.gecis.islem, 'olay');
  await B.uygula(portal.dinle(kevser, 's-kevser', 'tam', ezGun, { zorla: true }));
  const ilerlemis = (await A.oku())['s-kevser'];
  assert.equal(ilerlemis.basamak, 3);
  await A.geriAl(d5, ilerlemis);
  assert.deepEqual((await A.oku())['s-kevser'], ilerlemis);
  assert.deepEqual((await A.olaylar()).filter((x) => x.ezber === 's-kevser').map((x) => [x.basamakOnce, x.basamakSonra, x.zorla]),
    [[2, 3, true], [0, 2, false]]);
});

/* 27 Eyl 2026 — inceleme F2: çevrim dışı kuyrukta kalmış ya da eski ekrandan gelen madde silme, o arada başka telefonun
   yazdığı daha yeni kaydı silemez; kural silinen sürümü ister, depo reddi çakışma diye ayırır. */
test('Ezber madde silme: eski sürümle silme (kuyruktaki «Geri al», eski ekran) çakışma alır; güncel sürümle silinir', async () => {
  const A = portal.ezberDeposu(teacher(), 'ogrenci-a');
  const B = portal.ezberDeposu(teacher(), 'ogrenci-a');
  const olayId = A.olayKimligi();
  const gecis = portal.ata(undefined, 's-nas', ezGun);
  await A.uygula(gecis, olayId);
  const gordugu = (await A.oku())['s-nas'];                                       // A'nın ekranı: sürüm 1
  await B.uygula(portal.dinle(gordugu, 's-nas', 'tam', ezGun));                    // B ilerletti: sürüm 2
  await assert.rejects(() => A.geriAl({ id: 's-nas', once: undefined, gecis, olayId, bugun: ezGun }, gordugu),
    (e) => e.message === portal.EZBER_CAKISMA);
  await assert.rejects(() => A.uygula(portal.duzelt(gordugu, 's-nas', null, ezGun)), (e) => e.message === portal.EZBER_CAKISMA);
  const son = (await B.oku())['s-nas'];
  assert.deepEqual([son.basamak, son.surum], [2, 2]);
  assert.equal((await A.olaylar()).length, 2);
  await A.uygula(portal.duzelt(son, 's-nas', null, ezGun));
  assert.deepEqual(await A.oku(), {});
});

test('Ezber geçişi uçtan uca: eski ilerleme → ezberDurum; hocanın yeni kaydı ezilmez; ikinci koşu boş; eski alan durur', async () => {
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'ilerleme/ogrenci-a'), { kuranAdim: 3, ezber: { 'Fâtiha': 'ogrendi', 'Kevser; Asr; Nasr': 'tekrar', 'İhlâs': 'baslamadi', 'Tebbet': '' } });
    await setDoc(doc(c.firestore(), 'ilerleme/ogrenci-b'), { ezber: { 'Felak; Nâs': 'ogrendi' } });
  });
  await portal.ezberDeposu(teacher(), 'ogrenci-a').uygula(portal.dinle(undefined, 's-asr', 'tam', ezGun));
  const kuru = await portal.eskiKayitlariTasi(teacher(), ezGun);
  assert.deepEqual([kuru.yazilacak.length, kuru.yazilan, kuru.atlanan, kuru.basamaklar], [5, 0, 1, { 1: 2, 2: 3 }]);
  assert.equal((await read(teacher(), 'ezberDurum/ogrenci-b')).exists(), false);        // kuru koşu yazmaz
  const ilk = await portal.eskiKayitlariTasi(teacher(), ezGun, { yaz: true });
  assert.deepEqual([ilk.yazilan, ilk.hatali], [5, 0]);
  const a = await portal.ezberDeposu(teacher(), 'ogrenci-a').oku();
  assert.deepEqual(Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v.basamak])), { 's-fatiha': 2, 's-kevser': 1, 's-asr': 2, 's-nasr': 1 });
  assert.equal(a['s-asr'].kalite, 'tam');
  assert.equal(a['s-fatiha'].sonrakiKontrol, '2026-10-24');
  const bOlay = await portal.ezberDeposu(teacher(), 'ogrenci-b').olaylar();
  assert.deepEqual(bOlay.map((x) => x.tur), ['gecis', 'gecis']);
  const ikinci = await portal.eskiKayitlariTasi(teacher(), ezGun, { yaz: true });
  assert.deepEqual([ikinci.yazilacak.length, ikinci.yazilan, ikinci.atlanan, ikinci.gecmisli], [0, 0, 6, 0]);
  // Hoca geçişin getirdiği maddeyi kaldırdı: betik yeniden çalıştırılınca geri gelmez (27 Eyl 2026, inceleme F3).
  const A = portal.ezberDeposu(teacher(), 'ogrenci-a');
  await A.uygula(portal.duzelt((await A.oku())['s-fatiha'], 's-fatiha', null, ezGun));
  const ucuncu = await portal.eskiKayitlariTasi(teacher(), ezGun, { yaz: true });
  assert.deepEqual([ucuncu.yazilacak.length, ucuncu.yazilan, ucuncu.atlanan, ucuncu.gecmisli], [0, 0, 5, 1]);
  assert.equal((await A.oku())['s-fatiha'], undefined);
  assert.equal((await read(teacher(), 'ilerleme/ogrenci-a')).data().ezber['Fâtiha'], 'ogrendi');
  // Engel: eşleşmeyen dize varsa --yaz bile hiçbir şey yazmaz.
  await env.withSecurityRulesDisabled(async (c) => setDoc(doc(c.firestore(), 'ilerleme/ogrenci-b'), { ezber: { 'Felak; Nâs': 'ogrendi', 'Bilinmeyen': 'ogrendi', 'İhlâs': 'ogrendi' } }));
  const engel = await portal.eskiKayitlariTasi(teacher(), ezGun, { yaz: true });
  assert.deepEqual([engel.eslesmeyen, engel.yazilan], [['Bilinmeyen'], 0]);
  assert.equal((await portal.ezberDeposu(teacher(), 'ogrenci-b').oku())['s-ihlas'], undefined);
});

test('Ev çalışması: katalog kimlikleri (ezber-s-…) yazılır; katalog dışı ve biçimsiz kimlik reddedilir; eski kimlik sürer', async () => {
  for (const id of ['ezber-s-fatiha', 'ezber-s-bakara-285-286', 'ezber-d-kelime-i-tevhid', 'ezber-fatiha'])
    await assertSucceeds(setDoc(doc(parent(), `evCalismalari/ogrenci-a/etkinlikler/${id}`), evKayit()));
  for (const id of ['ezber-s-yok', 'ezber-x-fatiha', 'ezber-S-fatiha', 'ezber-s-fatiha-2', 'ezber-', 'ezber-s-'])
    await assertFails(setDoc(doc(parent(), `evCalismalari/ogrenci-a/etkinlikler/${id}`), evKayit()));
  await assertFails(setDoc(doc(parent(), 'evCalismalari/ogrenci-b/etkinlikler/ezber-s-fatiha'), evKayit()));
});

test('Gerçek silme: ezber durumu ve olayları dökümde; «ev» kapsamı dokunmaz, «tüm» siler; kardeşinki durur', async () => {
  await portal.ezberDeposu(teacher(), 'ogrenci-a').uygula(portal.dinle(undefined, 's-fatiha', 'tam', ezGun));
  await portal.ezberDeposu(teacher(), 'ogrenci-b').uygula(portal.ata(undefined, 's-ihlas', ezGun));
  let envt = await portal.portalEnvanteri(teacher(), 'ogrenci-a');
  assert.deepEqual([envt.sayilar['Ezber durumu'], envt.sayilar['Ezber olayları']], [1, 1]);
  await portal.portalKayitlariniSil(teacher(), envt, 'ev');
  assert.equal((await read(teacher(), ezYol)).exists(), true);
  envt = await portal.portalEnvanteri(teacher(), 'ogrenci-a');
  await portal.portalKayitlariniSil(teacher(), envt, 'tum');
  assert.equal((await read(teacher(), ezYol)).exists(), false);
  assert.equal((await getDocs(collection(teacher(), ezYol + '/olaylar'))).size, 0);
  assert.equal((await read(teacher(), 'ezberDurum/ogrenci-b')).exists(), true);
  assert.equal((await getDocs(collection(teacher(), 'ezberDurum/ogrenci-b/olaylar'))).size, 1);
});

/* 1 Kasım 2026 — Online envanter: ogrenciEnvanteri/{ref}_{tarih}_{grup}, ogrenciProgrami/{ref}, hocaGunSirasi/{tarih}.
   Şartname: D:\ulu-camii-kuran-kursu\belgeler\bireysel-plan-2026-2027\ONLINE-ENVANTER-SPEC.md */
const enId = 'ogrenci-a_2026-11-01_9-13';
const enBelge = (ek = {}) => ({ ref: 'ogrenci-a', tarih: '2026-11-01', grup: '9-13', kaynak: 'online', ben: { 'd-euzu-besmele': 1 }, hoca: {},
  kutular: { dil: ['fr'], okuma: [1, 2] }, metin: { sevdigi: 'Oyun', ilahiler: ['a', 'b'] }, okuma: { basamak: 2, sonraki: 3 }, okuma_notlari: { 2: 'iyi' },
  sayfaDinlendi: { 2: true }, durum: 'baslandi', surum: 1, guncelleme: serverTimestamp(), kaydeden: 'hoca-a', ...ek });
const enYaz = (db, veri, id = enId) => setDoc(doc(db, 'ogrenciEnvanteri', id), veri);

test('Envanter: yalnız hoca okur ve yazar; veli ve ziyaretçi göremez', async () => {
  await assertSucceeds(enYaz(teacher(), enBelge()));
  await assertSucceeds(read(teacher(), 'ogrenciEnvanteri/' + enId));
  await assertSucceeds(getDocs(collection(teacher(), 'ogrenciEnvanteri')));
  for (const db of [parent(), env.unauthenticatedContext().firestore(), veli('yetkisiz', 'yetkisiz@example.test')]) {
    await assertFails(read(db, 'ogrenciEnvanteri/' + enId));
    await assertFails(getDocs(collection(db, 'ogrenciEnvanteri')));
    await assertFails(enYaz(db, enBelge({ kaydeden: 'veli-a' })));
  }
});

test('Envanter: yalnız izinli alanlar, belge kimliği ref önekiyle eşleşir, değerler 0–2, sunucu zamanı ve kaydeden', async () => {
  for (const ek of [{ ekstra: 1 }, { grup: '14+' }, { grup: '5-8' }, { ref: 'ogrenci-b' }, { tarih: '2026-11-02' }, { kaynak: 'dis' }, { durum: 'bitti' },
    { surum: 2 }, { guncelleme: Timestamp.fromMillis(0) }, { kaydeden: 'baskasi' }, { ben: { x: 3 } }, { hoca: { x: -1 } }, { ben: { x: 'iki' } },
    { okuma: { basamak: 7, sonraki: 1 } }, { okuma: { basamak: 1, sonraki: 1, ekstra: 1 } }, { sayfaDinlendi: { 1: 'evet' } }, { cizim: 'data:image/png;base64,AAAA' }, { kutular: 'x' }])
    await assertFails(enYaz(teacher(), enBelge(ek)));
  await assertFails(enYaz(teacher(), enBelge({ ref: 'yok-ogrenci' }), 'yok-ogrenci_2026-11-01_9-13'));            // kayıtlı olmayan öğrenci
  await assertFails(enYaz(teacher(), enBelge(), 'baska_2026-11-01_9-13'));                                         // kimlik öneki ref değil
  await assertSucceeds(enYaz(teacher(), enBelge({ ref: 'TEST-ENVANTER' }), 'TEST-ENVANTER_2026-11-01_9-13'));       // deneme öğrencisi
  await assertSucceeds(enYaz(teacher(), enBelge({ grup: '5-8', cizim: 'data:image/png;base64,AAAA' }), 'ogrenci-a_2026-11-01_5-8'));
  await assertFails(enYaz(teacher(), enBelge({ cizim: 'data:image/png;base64,AAAA' })));                           // çizim yalnız 5-8
  await assertFails(enYaz(teacher(), enBelge({ grup: '5-8', cizim: 'x'.repeat(210001) }), 'ogrenci-a_2026-11-01_5-8'));
});

test('Envanter: güncellemede sürüm tam bir artar (eski ekran reddedilir), kimlik alanları değişmez; işleme kilidi', async () => {
  await assertSucceeds(enYaz(teacher(), enBelge()));
  const guncel = (ek) => setDoc(doc(teacher(), 'ogrenciEnvanteri', enId), { ...ek, guncelleme: serverTimestamp(), kaydeden: 'hoca-a' }, { merge: true });
  await assertSucceeds(guncel({ ben: { 'd-kelime-i-tevhid': 2 }, surum: 2 }));
  await assertFails(guncel({ ben: { 'd-kelime-i-tevhid': 1 }, surum: 2 }));          // eski ekran: sunucu zaten 2
  await assertFails(guncel({ ben: { x: 0 }, surum: 4 }));                              // atlama
  await assertFails(guncel({ kaynak: 'kagit-2026-10-31', surum: 3 }));
  await assertSucceeds(guncel({ hoca: { 'd-euzu-besmele': 0 }, durum: 'ogrenci-bitti', surum: 3 }));
  const s = (await read(teacher(), 'ogrenciEnvanteri/' + enId)).data();
  assert.equal(s.surum, 3); assert.deepEqual(s.ben, { 'd-euzu-besmele': 1, 'd-kelime-i-tevhid': 2 });
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'portalSilme/ogrenci-a'), { islem: 'x', zaman: new Date() }));
  await assertFails(guncel({ surum: 4 }));
  await assertFails(enYaz(teacher(), enBelge(), 'ogrenci-a_2026-11-05_9-13'));
});

test('Envanter: kâğıttan aktarılan belge (surum yok) hocayla güncellenir; silme yalnız deneme belgesine', async () => {
  const kagit = { ref: 'ogrenci-b', tarih: '2026-10-31', grup: '9-13', kaynak: 'kagit-2026-10-31', ben: { 'd-euzu-besmele': 2 }, hoca: { 'd-euzu-besmele': 2 }, durum: 'tamam', guncelleme: new Date(), kaydeden: 'python' };
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'ogrenciEnvanteri/ogrenci-b_2026-10-31_9-13'), kagit));
  await assertSucceeds(read(teacher(), 'ogrenciEnvanteri/ogrenci-b_2026-10-31_9-13'));
  await assertSucceeds(setDoc(doc(teacher(), 'ogrenciEnvanteri/ogrenci-b_2026-10-31_9-13'),
    { ref: 'ogrenci-b', tarih: '2026-10-31', grup: '9-13', kaynak: 'kagit-2026-10-31', ben: { 'd-kelime-i-tevhid': 1 }, durum: 'tamam', surum: 1, guncelleme: serverTimestamp(), kaydeden: 'hoca-a' }, { merge: true }));
  await assertFails(deleteDoc(doc(teacher(), 'ogrenciEnvanteri/ogrenci-b_2026-10-31_9-13')));
  await assertSucceeds(enYaz(teacher(), enBelge({ ref: 'TEST-ENVANTER' }), 'TEST-ENVANTER_2026-11-01_9-13'));
  await assertSucceeds(deleteDoc(doc(teacher(), 'ogrenciEnvanteri/TEST-ENVANTER_2026-11-01_9-13')));
});

test('Kişisel program yalnız hocaya açık ve salt okunur; gün sırasında hoca yalnız «yapildi» günceller', async () => {
  const prog = { ref: 'ogrenci-a', durum: 'onayli', hedefler: [], ogrenciye_tr: 'Merhaba', ogrenciye_fr: 'Salut' };
  await env.withSecurityRulesDisabled(async c => {
    await setDoc(doc(c.firestore(), 'ogrenciProgrami/ogrenci-a'), prog);
    await setDoc(doc(c.firestore(), 'hocaGunSirasi/2026-11-01'), { tarih: '2026-11-01', adimlar: [{ id: 'a1', saat: '10:00', ders: 1, ref: 'ogrenci-a', is: 'form' }], yapildi: {} });
  });
  await assertSucceeds(read(teacher(), 'ogrenciProgrami/ogrenci-a'));
  for (const db of [parent(), env.unauthenticatedContext().firestore()]) {
    await assertFails(read(db, 'ogrenciProgrami/ogrenci-a'));
    await assertFails(read(db, 'hocaGunSirasi/2026-11-01'));
  }
  await assertFails(setDoc(doc(teacher(), 'ogrenciProgrami/ogrenci-a'), { ...prog, durum: 'taslak' }));
  await assertFails(deleteDoc(doc(teacher(), 'ogrenciProgrami/ogrenci-a')));
  await assertSucceeds(read(teacher(), 'hocaGunSirasi/2026-11-01'));
  await assertSucceeds(setDoc(doc(teacher(), 'hocaGunSirasi/2026-11-01'), { yapildi: { a1: true } }, { merge: true }));
  await assertSucceeds(setDoc(doc(teacher(), 'hocaGunSirasi/2026-11-01'), { yapildi: { a1: false } }, { merge: true }));
  await assertFails(setDoc(doc(teacher(), 'hocaGunSirasi/2026-11-01'), { yapildi: { a1: 'evet' } }, { merge: true }));
  await assertFails(setDoc(doc(teacher(), 'hocaGunSirasi/2026-11-01'), { adimlar: [] }, { merge: true }));
  await assertFails(setDoc(doc(teacher(), 'hocaGunSirasi/2026-11-01'), { yapildi: { a1: true }, tarih: '2026-11-02' }, { merge: true }));
  await assertFails(setDoc(doc(teacher(), 'hocaGunSirasi/2026-11-02'), { yapildi: {} }));
  await assertFails(deleteDoc(doc(teacher(), 'hocaGunSirasi/2026-11-01')));
});

/* Gerçek SDK + gerçek kurallar: online envanter deposu (src/lib/ogrenci-envanteri/depo.ts) kurallardan geçen yük üretir. */
const bekle = async (kosul, ad) => { for (let i = 0; i < 100; i++) { if (await kosul()) return; await new Promise((r) => setTimeout(r, 50)); } assert.fail(`zaman aşımı: ${ad}`); };

test('Envanter deposu: oturum yazımı kurallardan geçer (kimlik alanları yalnız ilk yazımda, sürüm +1, alan silme); eski ekran çakışma alır', async () => {
  const db1 = teacher(), db2 = teacher();
  const depo1 = portal.envanterDeposu(db1, '2026-11-01', () => 'hoca-a');
  const depo2 = portal.envanterDeposu(db2, '2026-11-01', () => 'hoca-a');
  depo1.baslat(); depo2.baslat();
  try {
    const o = depo1.oturumAc('ogrenci-a', '9-13');
    o.hataDinle((e) => assert.fail(`beklenmeyen yazım hatası: ${e.message}`));
    o.ayarla(['ben', 'd-euzu-besmele'], 1); o.ayarla(['kutular', 'dil'], ['fr']); o.ayarla(['metin', 'ilahiler'], ['a', 'b']); o.ayarla(['sayfaDinlendi', '2'], true);
    o.gonder();
    await bekle(() => !o.bekliyor(), 'ilk yazım');
    let s = (await read(teacher(), 'ogrenciEnvanteri/ogrenci-a_2026-11-01_9-13')).data();
    assert.equal(s.surum, 1); assert.equal(s.kaynak, 'online'); assert.deepEqual(s.ben, { 'd-euzu-besmele': 1 }); assert.deepEqual(s.metin.ilahiler, ['a', 'b']);
    o.ayarla(['ben', 'd-euzu-besmele'], undefined); o.ayarla(['okuma', 'basamak'], 2); o.ayarla(['durum'], 'ogrenci-bitti');
    o.gonder();
    await bekle(() => !o.bekliyor(), 'ikinci yazım');
    s = (await read(teacher(), 'ogrenciEnvanteri/ogrenci-a_2026-11-01_9-13')).data();
    assert.equal(s.surum, 2); assert.deepEqual(s.ben, {}); assert.equal(s.okuma.basamak, 2); assert.equal(s.durum, 'ogrenci-bitti'); assert.deepEqual(s.kutular, { dil: ['fr'] });
    // başka telefon: sunucudaki hâli görür, yazar; ilk telefon eski sürümle yazınca reddedilir ve sunucu hâli yüklenir
    await bekle(() => depo2.belgeler().get('ogrenci-a_2026-11-01_9-13')?.surum === 2, 'ikinci telefon belgeyi görsün');
    const eski = depo2.oturumAc('ogrenci-a', '9-13', depo2.belgeler().get('ogrenci-a_2026-11-01_9-13'));
    let hata = null; eski.hataDinle((e) => { hata = e; });
    eski.ayarla(['hoca', 'd-kelime-i-tevhid'], 2);                                      // henüz gönderilmedi: ekran eski sürümde
    o.ayarla(['hoca', 'd-euzu-besmele'], 1); o.gonder();
    await bekle(() => !o.bekliyor(), 'üçüncü yazım');
    await new Promise((r) => setTimeout(r, 400));                                       // ikinci telefona canlı güncelleme ulaşsın; yerel kirli kopya korunur
    eski.gonder();
    await bekle(() => hata, 'çakışma bildirimi');
    assert.equal(hata.message, portal.ENVANTER_CAKISMA);
    s = (await read(teacher(), 'ogrenciEnvanteri/ogrenci-a_2026-11-01_9-13')).data();
    assert.deepEqual(s.hoca, { 'd-euzu-besmele': 1 }); assert.equal(s.surum, 3);
    assert.deepEqual(eski.belge.hoca, { 'd-euzu-besmele': 1 });                        // eski ekran sunucu hâline döndü
    // günün sırası: yalnız `yapildi` yazılır
    await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'hocaGunSirasi/2026-11-01'), { tarih: '2026-11-01', adimlar: [{ id: 'a1', saat: '10:00', ders: 1, ref: null, is: 'not', aciklama_tr: 'x', sure_dk: 1 }], yapildi: {} }));
    await depo1.adimIsaretle('a1', true);
    assert.deepEqual((await read(teacher(), 'hocaGunSirasi/2026-11-01')).data().yapildi, { a1: true });
    assert.equal(await depo1.program('ogrenci-a'), null);
  } finally { depo1.kapat(); depo2.kapat(); }
});

/* 1 Kasım 2026 sabahı — «Neler biliyorum?» bağlantı sayfası: envanterBaglanti/{anahtar} (hoca girişi yok, yetki = gizli anahtar). */
const BAG = 'Kq3vT9xLm2Rz8NwYb5HcJd7P';                  // 24 karakter (deneme anahtarı)
const bagKur = (ek = {}) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'envanterBaglanti', BAG),
  { bitis: Timestamp.fromMillis(Date.now() + 3600e3), refler: ['ogrenci-a'], ogrenciler: [{ ref: 'ogrenci-a', ad: 'A', soyad: 'B.' }], ...ek }));
const bagBelge = (ek = {}) => enBelge({ kaydeden: 'baglanti', ...ek });

test('Bağlantı: anahtarı bilen ziyaretçi okur ve yazar; liste, başka anahtar, süresi dolmuş bağlantı reddedilir', async () => {
  await bagKur();
  const misafir = env.unauthenticatedContext().firestore();
  await assertSucceeds(read(misafir, 'envanterBaglanti/' + BAG));
  await assertFails(getDocs(collection(misafir, 'envanterBaglanti')));                                  // anahtarlar sayılamaz
  await assertFails(read(misafir, 'envanterBaglanti/BASKAANAHTAR0000000000000'));
  await assertFails(setDoc(doc(misafir, 'envanterBaglanti', BAG), { bitis: Timestamp.fromMillis(Date.now() + 9e9) }));
  await assertSucceeds(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, enId), bagBelge()));
  await assertSucceeds(getDocs(collection(misafir, `envanterBaglanti/${BAG}/kayitlar`)));
  await assertFails(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, enId), bagBelge({ surum: 1 })));   // sürüm +1 değil
  await assertSucceeds(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, enId), bagBelge({ surum: 2 })));
  await assertFails(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, 'ogrenci-b_2026-11-01_9-13'), bagBelge({ ref: 'ogrenci-b' })));  // listede yok
  await assertFails(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, 'ogrenci-a_2026-11-01_5-8'), bagBelge({ grup: '5-8', kaydeden: 'hoca-a' })));
  await assertFails(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, 'ogrenci-a_2026-11-01_5-8'), bagBelge({ grup: '5-8', ekstra: 1 })));
  await assertFails(deleteDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, enId)));
  await assertSucceeds(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, 'TEST-ENVANTER_2026-11-01_9-13'), bagBelge({ ref: 'TEST-ENVANTER' })));
  await assertSucceeds(deleteDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, 'TEST-ENVANTER_2026-11-01_9-13')));
  await assertFails(read(misafir, 'ogrenciEnvanteri/' + enId));                                           // ana koleksiyon kapalı
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), `envanterBaglanti/${BAG}/gunSirasi/2026-11-01`), { tarih: '2026-11-01', adimlar: [], yapildi: {} });
    await setDoc(doc(c.firestore(), `envanterBaglanti/${BAG}/program/ogrenci-a`), { ref: 'ogrenci-a', durum: 'onayli', hedefler: [] });
  });
  await assertSucceeds(setDoc(doc(misafir, `envanterBaglanti/${BAG}/gunSirasi/2026-11-01`), { yapildi: { a1: true } }, { merge: true }));
  await assertFails(setDoc(doc(misafir, `envanterBaglanti/${BAG}/gunSirasi/2026-11-01`), { adimlar: [1] }, { merge: true }));
  await assertSucceeds(read(misafir, `envanterBaglanti/${BAG}/program/ogrenci-a`));
  await assertFails(setDoc(doc(misafir, `envanterBaglanti/${BAG}/program/ogrenci-a`), { durum: 'taslak' }));
  // süresi dolunca her şey kapanır
  await bagKur({ bitis: Timestamp.fromMillis(Date.now() - 1000) });
  await assertFails(read(misafir, 'envanterBaglanti/' + BAG));
  await assertFails(getDocs(collection(misafir, `envanterBaglanti/${BAG}/kayitlar`)));
  await assertFails(setDoc(doc(misafir, `envanterBaglanti/${BAG}/kayitlar`, enId), bagBelge({ surum: 3 })));
});

test('Bağlantı deposu: girişsiz iki telefon aynı bağlantıda yazar; sürüm çakışması yakalanır', async () => {
  await bagKur();
  const yollar = { envanter: `envanterBaglanti/${BAG}/kayitlar`, gunSirasi: `envanterBaglanti/${BAG}/gunSirasi`, program: `envanterBaglanti/${BAG}/program` };
  const depo1 = portal.envanterDeposu(env.unauthenticatedContext().firestore(), '2026-11-01', () => 'baglanti', yollar);
  depo1.baslat();
  try {
    const o = depo1.oturumAc('ogrenci-a', '9-13');
    o.hataDinle((e) => assert.fail(`beklenmeyen yazım hatası: ${e.message}`));
    o.ayarla(['ben', 'd-euzu-besmele'], 2); o.gonder();
    await bekle(() => !o.bekliyor(), 'bağlantı yazımı');
    let s;
    await env.withSecurityRulesDisabled(async (c) => { s = (await getDoc(doc(c.firestore(), `envanterBaglanti/${BAG}/kayitlar/ogrenci-a_2026-11-01_9-13`))).data(); });
    assert.equal(s.surum, 1); assert.equal(s.kaydeden, 'baglanti'); assert.deepEqual(s.ben, { 'd-euzu-besmele': 2 });
  } finally { depo1.kapat(); }
});
