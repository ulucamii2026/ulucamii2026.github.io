// Yalnız yapay örnek; gerçek Firebase ve dış ağ erişimi yok. Portalın aynı çıktı işlevini kullanır.
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const bundle=await build({entryPoints:['src/scripts/bulten-gorunumu.ts'],bundle:true,write:false,format:'iife',globalName:'BultenOrnek'});
const browser=await chromium.launch();
try{
 const context=await browser.newContext();await context.route('**/*',r=>r.request().url()==='http://localhost:4399/bulten-ornek/'?r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="tr"><head><title>Bülten örneği</title></head><body></body></html>'}):r.abort());
 const page=await context.newPage();await page.goto('http://localhost:4399/bulten-ornek/');await page.addScriptTag({content:bundle.outputFiles[0].text});
 const html=await page.evaluate(()=>{
  const get=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'contentWindow').get;
  Object.defineProperty(HTMLIFrameElement.prototype,'contentWindow',{get(){const w=get.call(this);if(w)w.print=()=>{};return w;}});
  window.BultenOrnek.bultenYazdir({id:'2026-09-12',tarih:'2026-09-12',hafta:2,dil:'tr',surum:1,yayin:false,metin:{ders:'ÖRNEK İÇERİK — gerçek öğrenci kaydı değildir.\n\nKur’an-ı Kerim: Harfleri tanıma ve kısa tekrar.\nTemel dinî bilgiler: Selamlaşma ve birlikte öğrenme.',odev:'Örnek çalışma: Derste öğrenilenleri ailece kısa bir süre tekrar edelim. Kitap ve sayfa bilgisi hoca tarafından bu alana eklenebilir.',getir:'Ders kitabı, defter, kalem ve yazılı bülten.',not:'Örnek hoca notu: Soru sorman ve arkadaşlarını dinlemen çok değerli. Gelecek hafta kısa tekrarımızı birlikte sürdürelim.'}},'Örnek Öğrenci','tr');
  return document.querySelector('iframe').srcdoc;
 });
 await page.setContent(html);await page.emulateMedia({media:'print'});mkdirSync('output/pdf',{recursive:true});
 await page.pdf({path:'output/pdf/Haftalik-Bulten-Ornegi.pdf',preferCSSPageSize:true,printBackground:true});
 console.log('Hazır: output/pdf/Haftalik-Bulten-Ornegi.pdf');
}finally{await browser.close();}
