import test from 'node:test';
import assert from 'node:assert/strict';
import { odevHaftalari, odevTaslagi, odevMetni, odevKalibiSec, odevHatasi, bosOdevMetni } from '../src/lib/haftalik-odev.ts';
const gunler=[{tarih:'2026-09-13',hafta:2,dersler:[{konu:'İkinci konu',kod:'kuran',ezber:['Ortak ezber']}]},{tarih:'2026-09-12',hafta:2,dersler:[{konu:'İlk konu',kod:'kuran',ezber:['Ortak ezber']}]},{tarih:'2026-09-19',hafta:3,dersler:[]}];
test('hafta anahtarı ilk gerçek ders günüdür; plan ezberleri tekilleşir, boş kayıt kendiliğinden yayımlanmaz',()=>{
 const haftalar=odevHaftalari(gunler);assert.equal(haftalar.length,1);assert.equal(haftalar[0].tarih,'2026-09-12');
 const k=odevTaslagi(haftalar[0]);assert.equal(k.ezber.tr,'Ortak ezber');assert.equal(k.yayin,false);
 assert.equal(odevTaslagi(haftalar[0],{ezber:bosOdevMetni()}).ezber.tr,'','hocanın bilerek boşalttığı alan plana dönmez');
});
test('kalıplar üç dilde birlikte değişir; ödev yok ve çalışma birbirini dışlar, serbest cümle korunur',()=>{
 let m={tr:'Özel not.',fr:'Note personnelle.',en:'Personal note.'};
 m=odevKalibiSec(odevKalibiSec(m,'tekrar'),'yok');
 assert.equal(m.tr,'Özel not.\nBu hafta için ek ödev yok.');assert.equal(m.fr,'Note personnelle.\nPas de devoir supplémentaire cette semaine.');
 m=odevKalibiSec(m,'yok');assert.deepEqual(m,{tr:'Özel not.',fr:'Note personnelle.',en:'Personal note.'});
});
test('önizleme veli portalının dil yedeğini kullanır; geçersiz atama, uzun metin ve boş yayın reddedilir',()=>{
 assert.equal(odevMetni({tr:'TR',fr:'FR'},'en'),'FR');assert.equal(odevMetni({tr:'TR'},'fr'),'TR');
 const k=odevTaslagi(odevHaftalari(gunler)[0]);
 assert.match(odevHatasi({...k,etkinlikler:['a','a']},['a']),/farklı/);
 assert.match(odevHatasi({...k,odev:{...k.odev,tr:'a'.repeat(1001)}},[]),/1000/);
 assert.match(odevHatasi({...k,materyal:'javascript:alert(1)'},[]),/bağlantısı/);
 assert.match(odevHatasi({...k,ezber:bosOdevMetni(),yayin:true},[]),/Yayımlamak/);
});
