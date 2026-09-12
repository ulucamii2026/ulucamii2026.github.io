import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mektepAc} from './helpers/mektep.mjs';
const yol='bultenler/TEST-1/haftalar';
const kayit={id:'2026-09-12',tarih:'2026-09-12',hafta:2,dil:'tr',metin:{ders:'Birlikte öğreniyoruz.',odev:'Kitap: 12–13. sayfalar',getir:'Defter, kalem, ders kitabı.',not:'Sorularını bizimle paylaşman çok güzel.'},yayin:true,surum:1};
const aile={id:'veli@example.test',ogrenciler:['TEST-1','TEST-2'],kitapSecim:{'TEST-1':{secim:'var'},'TEST-2':{secim:'satin'}}};
const ogrenciler=[{ref:'TEST-1',ad:'Örnek',soyad:'Talebe'},{ref:'TEST-2',ad:'İkinci',soyad:'Örnek'}];
async function hocaAc(page,context,extra={}){
 await mektepAc(page,context,{hoca:true,students:ogrenciler,...extra});await page.locator('[data-sekme=bulten]').click();await page.locator('[data-hb-ogr]').selectOption('TEST-1');await expect(page.locator('[data-hb-form]')).toBeVisible();
}

for(const dil of ['tr','fr','en'])test(`${dil}: veli bülteni okur, bir kez onaylar ve yalnız seçili öğrencinin çıktısını alır`,async({page,context})=>{
 await mektepAc(page,context,{dil,ogrenci:false,students:ogrenciler,records:{[yol]:[kayit]}});
 const p=page.locator('[data-veli-bulten]');await expect(p.locator('.bulten-sayfa')).toContainText('12–13. sayfalar');
 await p.locator('[data-bulten-oku]').click();await expect(p.locator('[data-bulten-oku]')).toBeDisabled();
 expect(await page.evaluate(()=>window.__writes.filter(w=>w.ref.col.includes('/okumalar')).length)).toBe(1);
 await page.evaluate(()=>{const append=document.body.appendChild.bind(document.body);document.body.appendChild=function(n){if(n.tagName==='IFRAME'){const onload=n.onload;n.onload=()=>{n.contentWindow.print=()=>{window.__bultenPrint=n.contentDocument.body.textContent;};onload?.();};}return append(n);};});
 await p.locator('[data-bulten-yazdir]').click();await expect.poll(()=>page.evaluate(()=>window.__bultenPrint)).toContain('Örnek Talebe');
 expect(await page.evaluate(()=>window.__bultenPrint)).not.toContain('İkinci Örnek');
 await page.locator('[data-sec="1"]').click();await expect(page.locator('[data-veli-bulten] .bulten-sayfa')).toHaveCount(0);
});

test('Bülten çevrimdışı hatası yeniden yüklenir; değişmiş sürüme eski okudum yazılmaz',async({page,context})=>{
 await mektepAc(page,context,{ogrenci:false,records:{[yol]:[kayit]}});const p=page.locator('[data-veli-bulten]');await expect(p.locator('.bulten-sayfa')).toBeVisible();
 await page.evaluate(y=>{window.__records[y][0].surum=2;},yol);await p.locator('[data-bulten-oku]').click();await expect(p.locator('[data-bulten-durum]')).toContainText('güncellendi');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await page.evaluate(()=>{window.__dataError=true;});await p.locator('[data-bulten-yenile]').click();await expect(p.locator('[data-bulten-durum]')).toContainText('alınamadı');
 await page.evaluate(()=>{window.__dataError=false;});await p.locator('[data-bulten-yenile]').click();await expect(p.locator('.bulten-sayfa')).toContainText('Sürüm 2');
 await p.locator('[data-bulten-oku]').click();await expect(p.locator('[data-bulten-oku]')).toBeDisabled();
});

test('Hoca plandan taslak hazırlar; yayın, sürüm ve kayıt çakışması korunur',async({page,context})=>{
 await hocaAc(page,context);let f=page.locator('[data-hb-form]');await expect(f.locator('[name=ders]')).toHaveValue(/Cumartesi konusu[\s\S]*Pazar konusu/);
 await f.locator('[name=not]').fill('Örnek not <script>alert(1)</script>');await f.locator('[value=taslak]').click();await expect(page.locator('[data-hb-durum]')).toContainText('Taslak kaydedildi');
 expect(await page.evaluate(y=>window.__records[y][0].yayin,yol)).toBe(false);
 await f.locator('[value=yayin]').click();await expect(page.locator('[data-hb-durum]')).toContainText('yayımlandı');
 expect(await page.evaluate(y=>window.__records[y][0].surum,yol)).toBe(2);
 await page.evaluate(y=>{window.__records[y][0].surum=3;window.__records[y][0].metin.not='Başka ekranda yazıldı';},yol);
 await f.locator('[name=not]').fill('Eski ekran');await f.locator('[value=yayin]').click();await expect(page.locator('[data-hb-durum]')).toContainText('başka bir ekranda');
 expect(await page.evaluate(y=>window.__records[y][0].metin.not,yol)).toBe('Başka ekranda yazıldı');
});

test('İdari döküm salt okunur; yanlış onay silmez, tüm temizlik kardeşi ve ortak veliyi korur',async({page,context})=>{
 await hocaAc(page,context,{records:{[yol]:[kayit],[yol+'/2026-09-12/okumalar']:[{id:'veli@example.test',surum:1}],aileler:[aile],yoklama:[{id:'a',ref:'TEST-1'},{id:'b',ref:'TEST-2'}]}});
 await page.locator('[data-hb-idare] summary').click();await page.locator('[data-hb-tara]').click();await expect(page.locator('[data-hb-sil]')).toBeVisible();
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 const f=page.locator('[data-hb-sil]');await f.locator('[name=onay]').fill('TEST-2');await f.locator('[type=submit]').click();await expect(page.locator('[data-hb-durum]')).toContainText('eşleşmedi');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await f.locator('[name=onay]').fill('TEST-1');await f.locator('[name=kapsam]').selectOption('tum');page.once('dialog',d=>d.accept());await f.locator('[type=submit]').click();await expect(page.locator('[data-hb-durum]')).toContainText('kayıt silindi');
 expect(await page.evaluate(()=>window.__students.map(o=>o.ref))).toEqual(['TEST-2']);
 expect(await page.evaluate(()=>window.__records.aileler[0].ogrenciler)).toEqual(['TEST-2']);
 expect(await page.evaluate(()=>window.__records.aileler[0].kitapSecim)).toEqual({'TEST-2':{secim:'satin'}});
 expect(await page.evaluate(y=>window.__records[y],yol+'/2026-09-12/okumalar')).toEqual([]);
 expect(await page.evaluate(()=>window.__records.yoklama.map(o=>o.ref))).toEqual(['TEST-2']);
});

test('İncelemeden sonra eklenen kayıt silinmez; hata görünür ve kilit çözülür',async({page,context})=>{
 await hocaAc(page,context,{records:{aileler:[aile]}});await page.locator('[data-hb-idare] summary').click();await page.locator('[data-hb-tara]').click();await expect(page.locator('[data-hb-sil]')).toBeVisible();
 await page.evaluate(()=>{window.__records.notlar=[{id:'yeni',ref:'TEST-1',metin:'Sonradan eklendi'}];});
 await page.locator('[data-hb-sil] [name=onay]').fill('TEST-1');page.once('dialog',d=>d.accept());await page.locator('[data-hb-sil] [type=submit]').click();await expect(page.locator('[data-hb-durum]')).toContainText('incelemeden sonra değişti');
 expect(await page.evaluate(()=>window.__records.notlar.length)).toBe(1);expect(await page.evaluate(()=>window.__records.portalSilme)).toEqual([]);
});

test('Veli ekleme ve kaldırma: kesintide yarım bağlantı oluşmaz; Fransızca tercih korunur',async({page,context})=>{
 await mektepAc(page,context,{hoca:true,students:ogrenciler,records:{aileler:[{id:'ikinci@example.test',ogrenciler:['TEST-2'],dil:'fr'}]}});
 await page.locator('[data-sekme=ogrenci]').click();await page.locator('[data-ogr=TEST-1]').click();
 const f=page.locator('[data-form=veliEkle]');await f.locator('[name=eposta]').fill('ikinci@example.test');
 await page.evaluate(()=>{window.__commitError=true;});await f.locator('[type=submit]').click();await expect(f.locator('[data-mesaj]')).toContainText('kaydedilemedi');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await page.evaluate(()=>{window.__commitError=false;});await f.locator('[type=submit]').click();await expect(page.locator('[data-veli-sil="ikinci@example.test"]')).toBeVisible();
 const a=await page.evaluate(()=>window.__records.aileler[0]);expect(a.dil).toBe('fr');expect(a.ogrenciler).toEqual(['TEST-2','TEST-1']);
 page.once('dialog',d=>d.accept());await page.locator('[data-veli-sil="ikinci@example.test"]').click();await expect(page.locator('[data-veli-sil="ikinci@example.test"]')).toHaveCount(0);
 expect(await page.evaluate(()=>window.__records.aileler[0].ogrenciler)).toEqual(['TEST-2']);
});

test('Bülten mobil/masaüstü açık ve koyu temada okunur; klavye ve taşma denetimi',async({page,context})=>{
 await mektepAc(page,context,{ogrenci:false,records:{[yol]:[kayit]}});const p=page.locator('[data-veli-bulten]');await expect(p.locator('.bulten-sayfa')).toBeVisible();
 for(const tema of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');},tema);await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>p.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  const a=await new AxeBuilder({page}).include('[data-veli-bulten]').analyze();expect(a.violations).toEqual([]);
  await p.screenshot({path:test.info().outputPath('veli-bulten-'+tema+'.png')});
 }
 await hocaAc(page,context);await page.locator('[data-hb-form] [name=not]').fill('Sorularını birlikte çalışalım.');await page.locator('[data-hb-onizle]').click();
 await expect(page.locator('[data-hb-onizleme]')).toContainText('Sorularını birlikte çalışalım.');
 await page.locator('[data-hoca-bulten]').screenshot({path:test.info().outputPath('hoca-bulten.png')});
});
