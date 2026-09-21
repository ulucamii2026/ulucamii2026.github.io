import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
mkdirSync('node_modules/.cache',{recursive:true});
const output=resolve('node_modules/.cache/kitap-test.mjs');
await build({entryPoints:['src/scripts/hoca-kitaplari.ts'],outfile:output,bundle:true,platform:'node',format:'esm'});
const {kitapCoz}=await import(pathToFileURL(output));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('Kitap parçaları şifreli, eksiksiz ve yayımlanacak özetle aynı',()=>{
 const books=JSON.parse(readFileSync('src/data/hoca-kitaplari.json','utf8'));assert.equal(books.length,4);
 for(const k of books) {
  let size=0;
  for(const p of k.parcalar){
   const b=readFileSync('public'+p.yol);assert.equal(sha(b),p.sha256);assert.notEqual(b.subarray(0,5).toString(),'%PDF-');size+=b.length-28;
  }
  assert.equal(size,k.bayt);assert.ok(k.sayfa>200);
 }
});
test('Kitap çözümü doğru dosyayı verir; yanlış anahtar, bozuk parça, yanlış sıra ve iptali reddeder',async()=>{
 const raw=new TextEncoder().encode('%PDF-1.7\nYalnız test belgesi');const keyBytes=new Uint8Array(32).fill(7);
 const key=await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt']);const keyHex=Buffer.from(keyBytes).toString('hex');
 const iv=new Uint8Array(12).fill(9);
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('ornek:0')},key,raw);
 const bytes=Buffer.concat([iv,Buffer.from(cipher)]);
 const fixture={id:'ornek',bayt:raw.length,sha256:sha(raw),parcalar:[{yol:'/ornek.bin',sha256:sha(bytes)}]};
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response(bytes);
  const controller=new AbortController();const progress=[];
  const pdf=await kitapCoz(fixture,keyHex,controller.signal,p=>progress.push(p));
  assert.equal(sha(Buffer.from(await pdf.arrayBuffer())),sha(raw));assert.deepEqual(progress,[100]);
  await assert.rejects(kitapCoz(fixture,'00'.repeat(32),controller.signal,()=>{}));
  await assert.rejects(kitapCoz({...fixture,id:'yanlis'},keyHex,controller.signal,()=>{}));
  globalThis.fetch=async()=>new Response(Buffer.from('bozuk'));
  await assert.rejects(kitapCoz(fixture,keyHex,controller.signal,()=>{}));
  controller.abort();await assert.rejects(kitapCoz(fixture,keyHex,controller.signal,()=>{}));
 } finally {globalThis.fetch=original;}
});
