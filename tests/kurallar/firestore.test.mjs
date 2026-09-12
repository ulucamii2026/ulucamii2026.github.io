import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, setLogLevel, Timestamp, serverTimestamp } from 'firebase/firestore';

// Bu kontroller initializeTestEnvironment'dan ÖNCE: üretime sessiz geri dönüş yok.
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8185', 'Yalnız test emülatörü kullanılabilir.');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ulucamii', 'Yalnız demo projesi kullanılabilir.');
setLogLevel('silent'); // Beklenen permission-denied denemeleri günlükleri şişirmesin.
let env;
let portal;
const parent = () => env.authenticatedContext('veli-a', { email: 'veli-a@example.test' }).firestore();
const teacher = () => env.authenticatedContext('hoca-a', { email: 'hoca@example.test' }).firestore();
const dYol='dersDefteri/ogrenci-a/kayitlar/2026-09-05_1';
const dersKaydi=(extra={})=>({donem:'2026-2027',tarih:'2026-09-05',sira:1,no:1,sayfa:51,konu:'Örnek konu',kaynak:'Örnek kitap',grup:'',durum:'islendi',giris:'kagit',calisma:'Örnek çalışma',okunan:'',dikkat:'',oz:'',odev:'Tekrar',sonraki:'Birlikte okuyalım',surum:1,guncelleme:serverTimestamp(),...extra});
const read = (db, path) => getDoc(doc(db, path));
const message = (extra = {}) => ({ eposta: 'veli-a@example.test', ref: 'ogrenci-a', tur: 'soru', metin: 'Deneme mesajı', okundu: false, zaman: serverTimestamp(), ...extra });

before(async () => {
  mkdirSync('node_modules/.cache', {recursive:true});
  const outfile=resolve('node_modules/.cache/portal-idare-test.mjs');
  await build({stdin:{contents:'export * from "./src/lib/portal-idare.ts"; export * from "./src/lib/haftalik-bulten.ts"; export * from "./src/lib/ders-defteri.ts";',resolveDir:process.cwd()},outfile,bundle:true,platform:'node',format:'esm',packages:'external',alias:{'firebase/firestore/lite':'firebase/firestore'}});
  portal=await import(pathToFileURL(outfile).href);
  env = await initializeTestEnvironment({ projectId: 'demo-ulucamii', firestore: {
    host: '127.0.0.1', port: 8185,
    rules: readFileSync(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8'),
  } });
});
after(async () => { await env?.cleanup(); });

test('Ders defteri yalnız hocaya açık; veli kendi çocuğunun özel ders notunu da okuyamaz',async()=>{
 await assertSucceeds(setDoc(doc(teacher(),dYol),dersKaydi()));
 await assertSucceeds(read(teacher(),dYol));
 for(const db of [parent(),env.unauthenticatedContext().firestore(),env.authenticatedContext('veli-b',{email:'veli-b@example.test'}).firestore()]){
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
 await assertFails(read(env.authenticatedContext('veli-b',{email:'veli-b@example.test'}).firestore(),bYol));
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
 await assertFails(read(env.authenticatedContext('veli-b',{email:'veli-b@example.test'}).firestore(),evYol));
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
 await assertSucceeds(read(env.authenticatedContext('ikinci',{email:'ikinci@example.test'}).firestore(),evYol));
 await assertSucceeds(deleteDoc(doc(teacher(),evYol)));
});

test('Aynı gün sunucu tarafında da tekrar basamağı yükseltilemez',async()=>{
 const k=evKayit();await assertSucceeds(setDoc(doc(parent(),evYol),k));
 await assertFails(setDoc(doc(parent(),evYol),{...k,basamak:3,sonraki:Timestamp.fromMillis(k.son.toMillis()+7*86400000)}));
 await assertSucceeds(setDoc(doc(parent(),evYol),{...k,basamak:0,cevap:'destek'}));
});
