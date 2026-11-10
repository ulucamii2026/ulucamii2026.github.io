import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
mkdirSync('node_modules/.cache',{recursive:true});
const output=resolve('node_modules/.cache/zengin-metin-test.mjs');
await build({entryPoints:['src/lib/zengin-metin.ts'],outfile:output,bundle:true,platform:'node',format:'esm'});
const {renkSinifi,renkOku,RENK_PALETI}=await import(pathToFileURL(output));
const css=readFileSync('src/styles/portal-sinif.css','utf8');

test('Eski kayıtlardaki renkler doğru zr- sınıfına çevrilir (hex, rgb, ad)',()=>{
 assert.equal(renkSinifi('#b5452b'),'zr-kiremit');
 assert.equal(renkSinifi('rgb(181, 69, 43)'),'zr-kiremit');
 assert.equal(renkSinifi('#1F5F8B'),'zr-mavi');
 assert.equal(renkSinifi('#2f6d3c'),'zr-yesil');
 assert.equal(renkSinifi('#24201c'),'zr-koyu');
 assert.equal(renkSinifi('red'),'zr-red');
 assert.equal(renkSinifi('grey'),'zr-gray');
 assert.equal(renkSinifi('#f00'),'zr-red');
 assert.equal(renkSinifi('rgb(250, 10, 10)'),'zr-red');
});
test('Güvensiz veya geçersiz renk reddedilir (sıkı beyaz liste)',()=>{
 for(const k of ['expression(alert(1))','url(javascript:1)','red;background:url(x)','var(--x)','#12','javascript:1','','transparent','rgb(1,2)'])
  assert.equal(renkSinifi(k),null,k);
});
test('renkOku: style özniteliğini metin olarak ve <font color> değerini okur',()=>{
 const el=(attrs,style)=>({getAttribute:n=>attrs[n]??null,style});
 assert.equal(renkOku(el({style:'font-weight:bold; color: #1f5f8b'})),'#1f5f8b');
 assert.equal(renkOku(el({style:'background-color:red'})),'');
 assert.equal(renkOku(el({color:'#2f6d3c'})),'#2f6d3c');
 assert.equal(renkOku(el({}, {color:'rgb(1, 2, 3)'})),'rgb(1, 2, 3)');
});
test('Her palet sınıfı portal-sinif.css içinde tanımlı ve değerleri birebir aynı',()=>{
 for(const [ad,[r,g,b]] of Object.entries(RENK_PALETI)){
  const hex='#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  assert.match(css,new RegExp(`\.zr-${ad} \{ color: ${hex}; \}`),ad);
 }
});
test('Toplu sınıflar: yz-0…yz-100 tanımlı',()=>{
 for(let i=0;i<=100;i++) assert.ok(css.includes(`.yz-${i} { width: ${i}%; }`),String(i));
});
