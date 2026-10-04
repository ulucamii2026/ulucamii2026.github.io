import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
mkdirSync('node_modules/.cache',{recursive:true});
const output=resolve('node_modules/.cache/kitap-paylasim-test.mjs');
await build({entryPoints:['src/scripts/kitap-paylasim.ts'],outfile:output,bundle:true,platform:'node',format:'esm'});
const {paylasimAnahtari,anahtarlariAc}=await import(pathToFileURL(output));
const b64u=b=>Buffer.from(b).toString('base64url');
const kitaplar=JSON.parse(readFileSync('src/data/hoca-kitaplari.json','utf8'));
// Yalnız test anahtarları: gerçek kitap/paylaşım anahtarı bu dosyaya girmez.
const sar=async(harita,anahtar,surum=1)=>{
 const key=await crypto.subtle.importKey('raw',anahtar,'AES-GCM',false,['encrypt']);const iv=new Uint8Array(12).fill(3);
 const sifreli=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(`kitap-paylasim:v${surum}`)},key,new TextEncoder().encode(JSON.stringify(harita)));
 return {surum,olusturma:'2026-10-04',kitaplar:Object.keys(harita),iv:b64u(iv),sifreli:b64u(new Uint8Array(sifreli))};
};
const ornekHarita=()=>Object.fromEntries(kitaplar.map((k,i)=>[k.id,String(i+1).repeat(64)]));

test('Paylaşım anahtarı yalnız 22 karakterlik base64url (16 bayt) olarak kabul edilir',()=>{
 const anahtar=new Uint8Array(16).fill(5);const s=b64u(anahtar);assert.equal(s.length,22);
 assert.deepEqual(paylasimAnahtari('#'+s),anahtar);assert.deepEqual(paylasimAnahtari(s),anahtar);
 for(const kotu of ['','#','#'+s.slice(1),'#'+s+'A','#'+s.slice(0,21)+'=','#'+s.slice(0,21)+'+','#AAAA']) assert.equal(paylasimAnahtari(kotu),null,kotu);
});

test('Sarmal doğru anahtarla açılır; yanlış anahtar, bozuk veri, sürüm ve eksik kitap reddedilir',async()=>{
 const anahtar=new Uint8Array(16).fill(5);const harita=ornekHarita();const v=await sar(harita,anahtar);
 assert.deepEqual(await anahtarlariAc(v,anahtar),harita);
 await assert.rejects(anahtarlariAc(v,new Uint8Array(16).fill(6)),/paylasim-anahtar/);
 const bozuk=v.sifreli.slice(0,-2)+(v.sifreli.endsWith('AA')?'BB':'AA');
 await assert.rejects(anahtarlariAc({...v,sifreli:bozuk},anahtar),/paylasim-anahtar/);
 await assert.rejects(anahtarlariAc({...v,iv:b64u(new Uint8Array(12).fill(4))},anahtar),/paylasim-anahtar/);
 await assert.rejects(anahtarlariAc({...v,surum:2},anahtar),/paylasim-anahtar/);
 const eksik={...harita};delete eksik[kitaplar[0].id];
 await assert.rejects(anahtarlariAc(await sar(eksik,anahtar),anahtar),/paylasim-surum/);
 await assert.rejects(anahtarlariAc(await sar({...harita,[kitaplar[1].id]:'zz'},anahtar),anahtar),/paylasim-surum/);
 await assert.rejects(anahtarlariAc({surum:1,durum:'kapali'},anahtar),/paylasim-kapali/);
});

test('Depodaki paylaşım verisi: kapalı ya da güncel dört kitapla eşleşen sarmal; açık anahtar içermez',()=>{
 const metin=readFileSync('src/data/kitap-paylasim.json','utf8');const v=JSON.parse(metin);
 assert.equal(typeof v.surum,'number');
 assert.doesNotMatch(metin,/[0-9a-f]{64}/i,'açık kitap anahtarı depoya girmemeli');
 if(v.durum==='kapali'){assert.deepEqual(Object.keys(v).sort(),['durum','surum']);return;}
 // Kitap yenilemesinden sonra sarmal yenilenmezse burası kırılır (docs/HOCA-KITAPLARI.md, «Paylaşım bağlantısı»).
 assert.deepEqual([...v.kitaplar].sort(),kitaplar.map(k=>k.id).sort());
 assert.match(v.iv,/^[A-Za-z0-9_-]{16}$/);assert.match(v.sifreli,/^[A-Za-z0-9_-]+$/);
 assert.match(v.olusturma,/^\d{4}-\d{2}-\d{2}$/);
});
