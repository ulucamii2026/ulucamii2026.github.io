import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/apps-script/veli-mail-listesi.gs',import.meta.url),'utf8');
const c=vm.createContext({console});vm.runInContext(source,c);
const row=(n,extra={})=>({'Referans':`UC-2099-000${n}`,'Öğrenci adı':'Deniz','Öğrenci soyadı':'Örnek','Veli adı soyadı':'Veli Örnek','Veli e-posta':'veli@example.test','İletişim dili':'fr',...extra});
const current=data=>({data,updateTime:'2099-01-01T00:00:00.000000Z'});
const plain=x=>JSON.parse(JSON.stringify(x));
function runtime(){
 const props={},docs={},events=[];
 const x=vm.createContext({console:{log(){},error(){}},Session:{getEffectiveUser:()=>({getEmail:()=> 'ulucamii2026@gmail.com'})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>events.push('unlock')})},PropertiesService:{getScriptProperties:()=>({getProperties:()=>({...props}),setProperties:p=>Object.assign(props,p),setProperty:(k,v)=>props[k]=v,getProperty:k=>props[k]})}});
 vm.runInContext(source,x);x.veliPortalHash=k=>JSON.stringify(k);x.veliPortalDefterOku=()=>[row(1)];x.veliPortalBelgeOku=k=>k==='ayarlar/portal'?{data:{}}:docs[k]||null;
 x.veliPortalHttp=(path,body)=>{assert.equal(path,':commit');events.push('commit');apply(body,docs);return {writeResults:body.writes.map(()=>({}))};};
 return {x,props,docs,events};
}
function apply(plan,docs={}){for(const w of plan.writes){const key=w.update.name.split('/documents/')[1];const data=structuredClone(docs[key]?.data||{});for(const f of w.updateMask.fieldPaths)data[f]=plain(c.veliPortalDegerCoz(w.update.fields[f]));for(const t of w.updateTransforms||[])data[t.fieldPath]=[...new Set([...(data[t.fieldPath]||[]),...t.appendMissingElements.values.map(v=>v.stringValue)])];docs[key]=current(data);}return docs;}

test('Sunucu tekrarında başarılı kayıt atlanır ve ikinci commit yapılmaz',()=>{
 const {x,events}=runtime();assert.equal(x.veliMailListesiIsle(false).islenen,1);assert.equal(x.veliMailListesiIsle(false).aday,0);assert.equal(events.filter(x=>x==='commit').length,1);assert.equal(events.filter(x=>x==='unlock').length,2);
});
test('Yazma başarısızsa başarı damgası konmaz; sonraki çalışma yeniden dener',()=>{
 const {x,props}=runtime();const http=x.veliPortalHttp;x.veliPortalHttp=()=>{throw Error('portal-http-503')};assert.throws(()=>x.veliMailListesiIsle(false),/portal-http-503/);assert.equal(Object.keys(props).length,0);x.veliPortalHttp=http;assert.equal(x.veliMailListesiIsle(false).islenen,1);
});
test('Kuru sınama kayıt veya başarı damgası yazmaz',()=>{
 const {x,props,events}=runtime();assert.equal(x.veliMailListesiIsle(true).yazma,2);assert.equal(Object.keys(props).length,0);assert.ok(!events.includes('commit'));
});
test('Kişisel hesapla zamanlı aktarım başlamaz',()=>{
 const {x,events}=runtime();x.Session.getEffectiveUser=()=>({getEmail:()=> 'personal@example.test'});assert.throws(()=>x.veliMailListesiIsle(false),/portal-dernek-hesabi-gerekli/);assert.equal(events.length,0);
});
test('Üç kardeş tek Fransızca veli hesabına eklenir; yalnız gerekli alanlar taşınır',()=>{
 const regs=c.veliPortalKayitlari([row(1,{'Adres':'Özel adres','Kimlik':'Özel kimlik'}),row(2),row(3)],{}).kayitlar;
 const plan=c.veliPortalYazilari(regs,{});assert.equal(plan.writes.length,4);
 const docs=apply(plan);assert.deepEqual(docs['aileler/veli@example.test'].data.ogrenciler,['UC-2099-0001','UC-2099-0002','UC-2099-0003']);assert.equal(docs['aileler/veli@example.test'].data.iletisimDili,'fr');
 assert.doesNotMatch(JSON.stringify(plan),/Özel adres|Özel kimlik/);
});
test('Mevcut şifre, kitap yanıtları, ek veli/öğrenci ve sabit isim korunur',()=>{
 const regs=c.veliPortalKayitlari([row(1),row(2)],{}).kayitlar;
 const docs={'aileler/veli@example.test':current({ogrenciler:['UC-2099-0001','UC-2099-0008'],sifreVar:true,kitapSecim:{'UC-2099-0001':{secim:'var'}},dil:'tr'}),'ogrenciler/UC-2099-0001':current({ad:'Özel Ad',soyad:'SABİT',adSabit:true,veliler:['diger@example.test'],grup:'A',durum:'aktif'})};
 const result=apply(c.veliPortalYazilari(regs,docs),docs);
 assert.equal(result['aileler/veli@example.test'].data.sifreVar,true);assert.equal(result['aileler/veli@example.test'].data.kitapSecim['UC-2099-0001'].secim,'var');assert.ok(result['aileler/veli@example.test'].data.ogrenciler.includes('UC-2099-0008'));
 assert.equal(result['aileler/veli@example.test'].data.dil,'tr');assert.equal(result['aileler/veli@example.test'].data.iletisimDili,'fr');
 assert.equal(result['ogrenciler/UC-2099-0001'].data.ad,'Özel Ad');assert.equal(result['ogrenciler/UC-2099-0001'].data.grup,'A');assert.ok(result['ogrenciler/UC-2099-0001'].data.veliler.includes('diger@example.test'));
});
test('Aynı kayıt tekrar işlendiğinde yeni yazma veya mükerrer üyelik oluşmaz',()=>{
 const regs=c.veliPortalKayitlari([row(1)],{}).kayitlar;const docs=apply(c.veliPortalYazilari(regs,{}));
 assert.equal(c.veliPortalYazilari(regs,docs).writes.length,0);
});
test('Son revizyon, atlanan denemeler ve düzeltilmiş e-posta dikkate alınır',()=>{
 const regs=c.veliPortalKayitlari([row(1),row(1,{'Referans':'UC-2099-0001-R2','Veli e-posta':'eski@example.test'}),row(2),row(3,{'Öğrenci soyadı':'TESTOGLU'}),row(3,{'Referans':'UC-2026-0003'})],{atlanan:['UC-2099-0002'],epostaDuzelt:{'eski@example.test':'dogru@example.test'}}).kayitlar;
 assert.equal(regs.length,1);assert.equal(regs[0].ref,'UC-2099-0001');assert.equal(regs[0].eposta,'dogru@example.test');
});
test('Dili eksik veya çelişkili yeni aileye Türkçe varsayılarak kayıt açılmaz',()=>{
 for(const rows of [[row(1,{'İletişim dili':''})],[row(1),row(2,{'İletişim dili':'tr'})]]){const p=c.veliPortalYazilari(c.veliPortalKayitlari(rows,{}).kayitlar,{});assert.equal(p.writes.length,0);assert.ok(p.bekleyen>0);assert.equal(p.islenen.length,0);}
});
test('Eski kayıtta dil boşsa mevcut doğrulanmış iletişim tercihi korunur',()=>{
 const docs={'aileler/veli@example.test':current({ogrenciler:[],iletisimDili:'fr',dil:'tr'})};
 const p=c.veliPortalYazilari(c.veliPortalKayitlari([row(1,{'İletişim dili':''})],{}).kayitlar,docs);assert.equal(p.bekleyen,0);assert.equal(apply(p,docs)['aileler/veli@example.test'].data.iletisimDili,'fr');
});
test('Yeni belge ve eşzamanlı düzenleme için yazma önkoşulları zorunludur',()=>{
 const regs=c.veliPortalKayitlari([row(1)],{}).kayitlar;const p=c.veliPortalYazilari(regs,{});assert.ok(p.writes.every(w=>w.currentDocument.exists===false));
 const docs={'aileler/veli@example.test':current({ogrenciler:[]})};const q=c.veliPortalYazilari(regs,docs);const family=q.writes.find(w=>w.update.name.includes('/aileler/'));assert.equal(family.currentDocument.updateTime,docs['aileler/veli@example.test'].updateTime);
});
test('Bu otomasyon e-posta göndermez ve başka kurum projesine yönlenmez',()=>{
 assert.doesNotMatch(source,/MailApp|GmailApp|epostaGonder\(|sendOobCode/);assert.equal(c.VELI_PORTAL_PROJE,'ulucamii-portal');
});
