// egitim.ulucamii.be sıkı CSP (style-src 'self'; img-src 'self' + https://ulucamii.be): ortak portal/hoca betikleri
// üretilen işaretlemede satır içi stil, <style>, srcdoc, document.write ya da data: görseli kullanmamalı.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const DOSYALAR=[
 'src/scripts/veli-portali.ts','src/scripts/hoca-ekrani.ts','src/scripts/hoca-envanter.ts','src/scripts/hoca-kitaplari.ts',
 'src/scripts/ders-defteri.ts','src/scripts/bulten-gorunumu.ts','src/scripts/ogrenme-atolyesi.ts','src/scripts/hoca-bulten.ts','src/scripts/hoca-mfa.ts','src/lib/hoca-mfa.ts',
 'src/lib/zengin-metin.ts','src/lib/ses-koken.ts',
];
const YASAK=[
 [/\bstyle\s*=\s*["']/,'style= özniteliği'],
 [/<style[\s>]/i,'<style> bloğu'],
 [/\bsrcdoc\b/,'srcdoc'],
 [/document\.write\s*\(/,'document.write'],
 [/doc\.write\s*\(/,'doc.write'],
 [/setAttribute\(\s*['"]style['"]/,"setAttribute('style')"],
 [/['"`]data:image/,'data:image adresi'],
];
// Yorum satırları (// ve /* */ ve JSDoc) taranmaz.
const yorumsuz=(s)=>s.replace(/\/\*[\s\S]*?\*\//g,'').split(/\r?\n/).map(l=>l.replace(/(^|[^:'"`])\/\/.*$/,'$1')).join('\n');
for(const dosya of DOSYALAR){
 test(`${dosya}: CSP uyumsuz kalıp yok`,()=>{
  const s=yorumsuz(readFileSync(dosya,'utf8'));
  for(const [re,ad] of YASAK) assert.doesNotMatch(s,re,`${dosya}: ${ad}`);
 });
}
test('Zengin metin temizleyicisi style özniteliği üretmez (CSSOM rengi yazılmaz)',()=>{
 const s=yorumsuz(readFileSync('src/lib/zengin-metin.ts','utf8'));
 assert.doesNotMatch(s,/\.style\.color\s*=/);
});
test('Ses ve kitap parçaları tek sabitten kurulur',()=>{
 assert.match(readFileSync('src/scripts/hoca-kitaplari.ts','utf8'),/medyaYolu\(part\.yol\)/);
 const vp=readFileSync('src/scripts/veli-portali.ts','utf8');
 assert.doesNotMatch(vp,/kayitSeslendir\(`\/media/);
 assert.doesNotMatch(vp,/new Audio\(['"`]\//);
});
