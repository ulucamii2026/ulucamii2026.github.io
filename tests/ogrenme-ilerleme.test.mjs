import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { runInNewContext } from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sandbox={module:{exports:{}}};
runInNewContext(buildSync({entryPoints:['src/lib/ogrenme-ilerleme.ts'],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text,sandbox);
const {bosKayit,kaydiOku,tekrarKaydet,gunlukSec,tarihEkle}=sandbox.module.exports;
test('Aralıklı tekrar farklı günlerde 1, 3 ve 7 güne ilerler; aynı gün tıklama şişirmez',()=>{
 const k=bosKayit();assert.equal(tekrarKaydet(k,'a','rahat','2026-09-12'),true);assert.equal(k.tekrar.a.sonraki,'2026-09-13');
 assert.equal(tekrarKaydet(k,'a','rahat','2026-09-12'),false);assert.equal(k.tekrar.a.basamak,1);
 tekrarKaydet(k,'a','rahat','2026-09-13');assert.equal(k.tekrar.a.sonraki,'2026-09-16');
 tekrarKaydet(k,'a','rahat','2026-09-16');assert.equal(k.tekrar.a.sonraki,'2026-09-23');
 tekrarKaydet(k,'a','destek','2026-09-23');assert.equal(k.tekrar.a.sonraki,'2026-09-24');assert.equal(k.tekrar.a.basamak,0);
});
test('Bozuk, gelecek tarihli ve bilinmeyen yerel kayıtlar içeriğe taşınmaz',()=>{
 for(const raw of ['null','{','[]','{"v":9}'])assert.equal(Object.keys(kaydiOku(raw,new Set(['a']),'2026-09-12').tekrar).length,0);
 const raw=JSON.stringify({v:1,tekrar:{a:{son:'2026-09-13',sonraki:'2026-09-14',basamak:1,cevap:'rahat'},yabanci:{son:'2026-09-11',sonraki:'2026-09-12',basamak:1,cevap:'rahat'}},canta:{'2026-01-01:kitap':true,'2026-09-12:kitap':true}});
 const k=kaydiOku(raw,new Set(['a']),'2026-09-12');assert.equal(Object.keys(k.tekrar).length,0);assert.equal(Object.keys(k.canta).length,1);
});
test('Günlük öneri vadesi geleni önce alır, alanları çeşitlendirir ve aynı gün biteni eklemez',()=>{
 const k=bosKayit();k.tekrar.a={son:'2026-09-10',sonraki:'2026-09-11',basamak:1,cevap:'tekrar'};
 k.tekrar.c={son:'2026-09-12',sonraki:'2026-09-13',basamak:1,cevap:'rahat'};
 const sonuc=Array.from(gunlukSec([{id:'b',alan:'harf'},{id:'a',alan:'harf'},{id:'c',alan:'hayat'},{id:'d',alan:'bilgi'},{id:'e',alan:'hayat'}],k,'2026-09-12'));
 assert.deepEqual(sonuc,['a','d','e']);
});
test('Takvim ay sonu ve yaz saati sınırında bir günlük artışı korur',()=>{
 assert.equal(tarihEkle('2026-03-29',1),'2026-03-30');assert.equal(tarihEkle('2026-12-31',1),'2027-01-01');
});
test('Etkinlik sesleri mevcut; bütün hadislerin Türkçe, Fransızca ve İngilizce anlam kayıtları hazır',()=>{
 const mod={module:{exports:{}}};runInNewContext(buildSync({entryPoints:['src/lib/ogrenme-icerigi.ts'],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text,mod);
 const etkinlikler=mod.module.exports.ETKINLIKLER;assert.equal(etkinlikler.length,65);assert.equal(new Set(etkinlikler.map(a=>a.id)).size,65);
 for(const e of etkinlikler){if(e.ses)assert.ok(existsSync('public'+e.ses),e.ses);for(const d of ['tr','fr','en'])assert.ok(e.baslik[d]&&e.soru[d]&&e.aciklama[d]);}
 const ids=[...readFileSync('src/lib/hadis-verisi.ts','utf8').matchAll(/id: '([^']+)'/g)].map(m=>m[1]);
 for(const id of ids)for(const dil of ['tr','fr','en'])assert.ok(existsSync(`public/media/ses/hadisler/${dil}/${id}.mp3`),`${dil}/${id}`);
 const sesler=JSON.parse(readFileSync('src/data/hadis-anlam-sesleri.json','utf8'));
 for(const s of sesler)assert.equal(createHash('sha256').update(readFileSync('public'+s.sesUrl)).digest('hex'),s.sha256);
});

test('İki cihazın aynı günkü kayıtları sıradan bağımsız birleşir; daha eski gün yeniyi ezmez',()=>{
 const {tekrarBirlestir}=sandbox.module.exports;
 const a={son:'2026-09-12',sonraki:'2026-09-15',basamak:2,cevap:'rahat'};
 const b={son:'2026-09-12',sonraki:'2026-09-13',basamak:0,cevap:'destek'};
 assert.equal(JSON.stringify(tekrarBirlestir(a,b)),JSON.stringify(tekrarBirlestir(b,a)));
 assert.equal(tekrarBirlestir(a,b).basamak,0);
 assert.equal(tekrarBirlestir(a,{...b,son:'2026-09-11'}).son,a.son);
});

test('Güvenlik kuralının etkinlik izin listesi yayınlanan katalogla aynı kalır',()=>{
 const model={module:{exports:{}}};runInNewContext(buildSync({entryPoints:['src/lib/ogrenme-icerigi.ts'],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,model);
 const ids=Array.from(model.module.exports.ETKINLIKLER,e=>e.id).sort();
 const rules=readFileSync('firebase/firestore.rules','utf8');const izin=JSON.parse(rules.match(/return id in (\[[^\n]+\])/)[1].replaceAll("'",'"')).sort();assert.deepEqual(izin,ids);
});
