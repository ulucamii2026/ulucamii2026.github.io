import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';

const kitaplar=JSON.parse(readFileSync('src/data/hoca-kitaplari.json','utf8'));
const depolar=()=>JSON.stringify([Object.entries(localStorage).sort(),Object.entries(sessionStorage).sort()]);
// Test sarmalı: sahte kitap anahtarları, sabit test paylaşım anahtarı. Gerçek anahtar bu dosyaya girmez.
const testAnahtari=new Uint8Array(16).fill(11);
const testSarmali=async()=>{
 const key=await crypto.subtle.importKey('raw',testAnahtari,'AES-GCM',false,['encrypt']);const iv=new Uint8Array(12).fill(2);
 const harita=Object.fromEntries(kitaplar.map(k=>[k.id,'ab'.repeat(32)]));
 const sifreli=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('kitap-paylasim:v1')},key,new TextEncoder().encode(JSON.stringify(harita)));
 return {surum:1,olusturma:'2026-10-04',kitaplar:Object.keys(harita),iv:Buffer.from(iv).toString('base64url'),sifreli:Buffer.from(sifreli).toString('base64url')};
};

test.beforeEach(async({context})=>{
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4401'?route.continue():route.abort('blockedbyclient'));
});

test('Anahtarsız ve hatalı bağlantı kitap göstermez; sayfa dizine kapalı',async({page})=>{
 await page.goto('/kitap/');
 await expect(page.locator('[data-paylasim-durum]')).toHaveAttribute('data-paylasim-durum','yok');
 await expect(page.locator('[data-kitap-indir]')).toHaveCount(0);
 expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
 await page.goto('/kitap/#AAAA');
 await expect(page.locator('[data-paylasim-durum]')).toHaveAttribute('data-paylasim-durum','paylasim-anahtar');
 // Biçimi doğru ama yanlış anahtar: depodaki gerçek sarmal açılmaz.
 await page.goto('/kitap/#'+Buffer.from(new Uint8Array(16).fill(1)).toString('base64url'));
 await expect(page.locator('[data-paylasim-durum]')).toHaveAttribute('data-paylasim-durum','paylasim-anahtar');
 await expect(page.locator('[data-kitap-indir]')).toHaveCount(0);
});

test('Doğru bağlantı dört kitabı açar; indirme hatası yeniden denenebilir, anahtar saklanmaz',async({page})=>{
 const sarmal=JSON.stringify(await testSarmali());
 await page.route('**/kitap/',async route=>{
  const yanit=await route.fetch();const govde=await yanit.text();
  const yeni=govde.replace(/(<script[^>]*id="kitap-paylasim-veri"[^>]*>)[\s\S]*?(<\/script>)/,(_,a,b)=>a+sarmal+b);
  expect(yeni).not.toBe(govde);
  await route.fulfill({response:yanit,body:yeni});
 });
 await page.route('**/media/hoca-kitaplari/**',route=>route.abort('failed'));
 const hash=Buffer.from(testAnahtari).toString('base64url');
 await page.goto('/kitap/#'+hash);
 const panel=page.locator('[data-hoca-kitaplari]');
 await expect(panel.locator('[data-kitap-indir]')).toHaveCount(4);
 const once=await page.evaluate(depolar);
 await expect(panel).toContainText('Fransızca · Belçika');await expect(panel).toContainText('Türkçe · Vektörel');
 let indirildi=false;page.on('download',()=>{indirildi=true;});
 await panel.locator('[data-kitap-indir]').first().click();
 await expect(panel.locator('[data-kitap-durum]')).toContainText('Kitap indirilemedi');
 await expect(panel.locator('[data-kitap-indir]').first()).toBeEnabled();expect(indirildi).toBe(false);
 const depo=await page.evaluate(depolar);expect(depo).not.toContain(hash);expect(depo).toBe(once);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const tema of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;},tema);
  await page.evaluate(()=>{for(const a of document.getAnimations())if(Number.isFinite(a.effect?.getComputedTiming().endTime))a.finish();});
  expect((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
 }
 await page.screenshot({path:test.info().outputPath('kitap-paylasim.png'),fullPage:true});
});
