import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/apps-script/veli-eposta-sablon.gs',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../scripts/apps-script/veli-cuma.gs',import.meta.url),'utf8');
const c=vm.createContext({console});vm.runInContext(source,c);
const plan={donem:'2026-2027',gunler:[{tarih:'2026-09-12',dersler:[{kod:'kuran',konu:'Harfler'}]},{tarih:'2026-09-13',dersler:[{kod:'ahlak',konu:'Yardımlaşma'}]}]};
const model=()=>c.veliCumaModel('2026-09-11',plan,[],{});
const translate=t=>({'Harfler':'Les lettres','Yardımlaşma':"L'entraide"}[t]||'Traduction');
test('Kitap kaynağı yalnız aynı dönem, tarih ve ders eşleşmesinde aktarılır',()=>{
 const p=structuredClone(plan),k=structuredClone(plan);k.gunler[0].dersler[0].kaynak='Kitap s. 31–36';k.gunler[1].dersler[0].konu='Başka konu';k.gunler[1].dersler[0].kaynak='Yanlış sayfa';
 c.veliCumaKaynakEkle(p,k);assert.equal(p.gunler[0].dersler[0].kaynak,'Kitap s. 31–36');assert.equal(p.gunler[1].dersler[0].kaynak,undefined);
 const m=c.veliCumaModel('2026-09-11',p,[],{});const tr=c.veliCumaIcerik(m,'tr',translate),fr=c.veliCumaIcerik(m,'fr',translate);
 assert.match(tr.htmlBody,/font-size:16px[^>]+>Kitap s\. 31–36/);assert.match(fr.body,/Kitap p\. 31–36/);assert.doesNotMatch(tr.body,/Yanlış sayfa/);assert.throws(()=>c.veliCumaKaynakEkle(p,{donem:'2025-2026',gunler:[]}),/donem/);
});
test('Cuma ve düz metin duyurusu aynı kurs logosunu ve hareketli görseli kullanır',()=>{
 for(const html of [c.veliCumaIcerik(model(),'tr',translate).htmlBody,c.veliEpostaDuzMetin('<özel>','fr','Duyuru')]){assert.match(html,/kuran-kursu-logo-256\.png/);assert.match(html,/kurs-kurumsal-v1\.gif/);assert.match(html,/font-size:20px/);}
 assert.match(c.veliEpostaDuzMetin('<özel>','tr','Başlık'),/&lt;özel&gt;/);
});
test('Cuma saati, yaz/kış saati dönemleri ve hafta günleri doğru sınırlandırılır',()=>{
 for(const cuma of ['2026-09-11','2026-10-30','2027-03-26','2027-04-02']){assert.equal(c.veliCumaZamanUygun(cuma,9,{}),false);assert.equal(c.veliCumaZamanUygun(cuma,10,{}),true);assert.equal(c.veliCumaZamanUygun(cuma,21,{}),false);}
 assert.equal(c.veliCumaZamanUygun('2026-09-12',10,{}),false);assert.equal(c.veliCumaZamanUygun('2026-09-11',16,{saat:17}),false);
});
test('Yalnız cumadan sonraki cumartesi ve pazar planı kullanılır',()=>{assert.deepEqual(Array.from(model().gunler,g=>g.tarih),['2026-09-12','2026-09-13']);assert.equal(model().dersVar,true);});
test('Yayımlanmamış, çok eski ve sonraki haftanın ödevleri e-postaya alınmaz',()=>{
 const m=c.veliCumaModel('2026-09-11',plan,[{tarih:'2026-09-12',yayin:false,odev:{tr:'GİZLİ'}},{tarih:'2026-09-19',yayin:true,odev:{tr:'SONRA'}},{tarih:'2026-08-29',yayin:true,odev:{tr:'ESKİ'}},{tarih:'2026-09-05',yayin:true,odev:{tr:'Tekrar',fr:'Révision'}}],{});
 assert.equal(m.odev.odev.tr,'Tekrar');assert.doesNotMatch(c.veliCumaIcerik(m,'tr',translate).body,/GİZLİ|SONRA|ESKİ/);
});
test('Fransızca velide konu, gövde, düğme, dersler ve bağlantı Fransızcadır',()=>{
 const r=c.veliCumaIcerik(model(),'fr',translate);assert.match(r.subject,/Bon vendredi/);assert.match(r.htmlBody,/Les lettres/);assert.match(r.htmlBody,/Ouvrir le portail des parents/);assert.match(r.body,/\/fr\/portail-parents\//);assert.doesNotMatch(r.htmlBody,/Harfler|Yardımlaşma|Hayırlı|Değerli velimiz/);
});
test('Fransızca ödev eksikse Türkçe ayrıntı Fransızca e-postaya sızmaz',()=>{
 const m=model();m.odev={tarih:'2026-09-05',odev:{tr:'Türkçe özel ödev'},ezber:{tr:'Türkçe ezber'}};
 const r=c.veliCumaIcerik(m,'fr',translate);assert.doesNotMatch(r.body,/Türkçe özel|Türkçe ezber/);assert.match(r.body,/Consultez le portail/);
});
test('İptal edilen hafta sonunda kitap/ödev hazırlığı istenmez; eksik plan tatil sayılmaz',()=>{
 const m=c.veliCumaModel('2026-09-11',plan,[],{gunler:{'2026-09-12':{iptal:true},'2026-09-13':{iptal:true}}});assert.equal(m.dersYok,true);assert.doesNotMatch(c.veliCumaIcerik(m,'tr',translate).body,/Çantamız hazır mı/);
 const missing=c.veliCumaModel('2026-09-18',plan,[],{});assert.equal(missing.dersYok,false);assert.match(c.veliCumaIcerik(missing,'tr',translate).body,/yayımlanmış ders planı bulunmuyor/);
});
test('HTML ve bilinmeyen dil güvenli biçimde ele alınır',()=>{const m=model();m.gunler[0].dersler[0].konu='<img src=x onerror=alert(1)>';assert.doesNotMatch(c.veliCumaIcerik(m,'tr',translate).htmlBody,/<img src=x/);assert.throws(()=>c.veliCumaIcerik(m,'en',translate),/cuma-dil-eksik/);assert.throws(()=>c.veliCumaModel('2026-09-11',null,[],{}),/cuma-plan-eksik/);});
test('Harf adları ve onaylı başlıklar hatalı otomatik çeviriden korunur',()=>{assert.equal(c.veliCumaCevir('Ayn Grubu Harfleri'),'Lettres du groupe Ayn');assert.equal(c.veliCumaCevir('Şîn Grubu Harfleri'),'Lettres du groupe Shîn');assert.equal(c.veliCumaCevir('Sevincimi paylaşıyorum'),'Je partage ma joie');assert.match(c.veliCumaCevir('Abdest alıyorum, temizleniyorum (1/2)'),/\(1\/2\)$/);});
test('Uzun ödev kısa tutulur, ayrıntı için portal hatırlatılır',()=>{const m=model();m.odev={tarih:'2026-09-12',odev:{tr:'Birlikte tekrar edin. '.repeat(60)}};const r=c.veliCumaIcerik(m,'tr',translate);assert.ok(r.body.length<2300);assert.match(r.body,/…/);assert.match(r.body,/ayrıntısını veli portalından/);});
test('Kısa hatırlatma tam satırda kesilir, sayfa numarası yarıda bırakılmaz',()=>{assert.equal(c.veliCumaKisalt('Evde tekrar:\nİlk çalışmayı yapın.\nKitabın p. 11-16 sayfalarını birlikte okuyun. Devamı var.',53),'Evde tekrar:\nİlk çalışmayı yapın.…');});
function runtime(){const props={};let sends=0,found='';const x=vm.createContext({console,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{getUuid:()=> 'e3d7c872-0f84-4d8a-8a50-a098c15fdf2b'}});vm.runInContext(source,x);Object.assign(x,{veliPortalKimlikDogrula(){},veliPortalHash:s=>s,brevoAnahtari:()=> 'fixture',veliCumaHazirla:()=>({alicilar:[{eposta:'veli@example.test',dil:'fr'}],icerik:{fr:{}}}),veliCumaGonder:()=>{sends++;return {durum:'saglayici-kabul',messageId:'example'};},veliCumaBelirsizYokla:()=>found});return {x,props,sends:()=>sends,setFound:v=>found=v};}
test('Aynı cuma ikinci kez çalıştırma ve yeni günün kampanyası doğru ayrılır',()=>{const {x,sends}=runtime();x.veliCumaIsle('2026-09-11',{});x.veliCumaIsle('2026-09-11',{});assert.equal(sends(),1);x.veliCumaIsle('2026-09-18',{});assert.equal(sends(),2);});
test('Belirsiz gönderim körlemesine tekrarlanmaz; sağlayıcı kaydıyla uzlaştırılır',()=>{const r=runtime();let calls=0;r.x.veliCumaGonder=()=>{calls++;return {durum:'belirsiz'};};r.x.veliCumaIsle('2026-09-11',{});r.x.veliCumaIsle('2026-09-11',{});assert.equal(calls,1);r.setFound('located');assert.equal(r.x.veliCumaIsle('2026-09-11',{}).onceki,1);assert.equal(calls,1);});
test('Kesin hız sınırı reddi tekrar denenebilir, başarısız plan hiçbir mail göndermez',()=>{const r=runtime();let calls=0;r.x.veliCumaGonder=()=>{calls++;return {durum:calls===1?'yeniden-denenecek':'saglayici-kabul'};};r.x.veliCumaIsle('2026-09-11',{});r.x.veliCumaIsle('2026-09-11',{});assert.equal(calls,2);r.x.veliCumaHazirla=()=>{throw Error('cuma-plan-http')};assert.throws(()=>r.x.veliCumaIsle('2026-09-18',{}),/cuma-plan-http/);assert.equal(calls,2);});
test('Pasif çocuklar ve haftalık e-posta istemeyenler alıcıya alınmaz',()=>{c.epostaGecerli=e=>e.includes('@');const a=[{id:'aktif@example.test',ogrenciler:['1'],iletisimDili:'fr'},{id:'pasif@example.test',ogrenciler:['2'],dil:'tr'},{id:'kapali@example.test',ogrenciler:['1'],dil:'tr',haftalikEposta:false}];assert.deepEqual(Array.from(c.veliCumaAlicilar(a,[{id:'1',durum:'aktif'},{id:'2',durum:'pasif'}]),x=>x.eposta),['aktif@example.test']);});
