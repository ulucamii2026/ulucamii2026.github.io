import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../scripts/apps-script/veli-eposta-sablon.gs',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../scripts/apps-script/ulucamii-Kod-v28.gs',import.meta.url),'utf8');
function backend(){const sent=[];const c=vm.createContext({console,PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})}});vm.runInContext(source,c);c.epostaGonder=m=>sent.push(m);c.mufredatEki=()=>null;return {c,sent};}
for(const dil of ['tr','fr'])test(`Kayıt onayı yalnız seçilen iletişim dilinde: ${dil}`,()=>{
 const {c,sent}=backend();const blob={name:'test.pdf'};
 c.kopyaGonderV2(blob,'UC-2099-TEST','Deniz Örnek',['veli@example.test'],dil);
 assert.equal(sent.length,1);assert.equal(sent[0].to,'veli@example.test');assert.equal(sent[0].attachments[0],blob);
 assert.match(sent[0].htmlBody,new RegExp('<html lang="'+dil+'">'));
 if(dil==='fr'){assert.match(sent[0].subject,/Confirmation d’inscription/);assert.match(sent[0].body,/Bonjour/);assert.doesNotMatch(sent[0].body,/Esselâmü|kaydı alınmıştır|Dersler /);}
 else{assert.match(sent[0].subject,/kayıt onayı/);assert.match(sent[0].body,/kaydı alınmıştır/);assert.doesNotMatch(sent[0].body,/Bonjour|L’inscription|Les cours/);}
});
test('Eksik ya da bilinmeyen iletişim dilinde Türkçe varsayılarak gönderim yapılmaz',()=>{
 for(const dil of [undefined,'','nl']){const {c,sent}=backend();assert.throws(()=>c.kopyaGonderV2({},'UC-2099-TEST','Örnek',['veli@example.test'],dil),/iletişim dili/i);assert.equal(sent.length,0);}
});
test('Formun görüntüleme dili farklı olsa da veli iletişim dili kayıt onayına aktarılır',()=>{
 const {c,sent}=backend();let dil;
 c.kayitDogrulaV2=()=>({tamam:true});c.klasorGetir=()=>({createFile:()=>({getUrl:()=>''})});c.kayitV2SayfaGetir=()=>({getParent:()=>({getUrl:()=>''})});c.kayitV2AnahtarBul=()=>null;
 c.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};c.v1SayfaBulTablo=()=>null;c.referansMaxBul=()=>1;c.Utilities={formatDate:()=>''};c.kayitPdfUret=()=>({});c.satirEkle=()=>{};c.SpreadsheetApp={flush(){}};c.kayitV2AnahtarKaydet=()=>{};c.json=x=>x;c.kopyaGonderV2=(b,r,n,es,lang)=>{dil=lang;};
 const v={dil:'tr',gonderimAnahtari:'test',ogrenci:{ad:'Deniz',soyad:'Örnek'},veli:{eposta:'veli@example.test',iletisimDili:'fr'},onay:{}};
 assert.equal(c.kayitPostIsleV2(v).ok,true);assert.equal(dil,'fr');
});
