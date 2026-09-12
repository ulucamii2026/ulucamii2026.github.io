import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {mektepAc} from './helpers/mektep.mjs';
const katalog=JSON.parse(readFileSync('src/data/ders-defteri-2026-2027.json','utf8'));
const d=katalog.find(x=>x.id==='2026-09-12_1');
const yol='dersDefteri/TEST-1/kayitlar';
const students=[{ref:'TEST-1',ad:'Örnek',soyad:'Talebe'},{ref:'TEST-2',ad:'İkinci',soyad:'Örnek'}];
const kayit={id:d.id,donem:'2026-2027',tarih:d.tarih,sira:d.sira,no:d.no,sayfa:d.sayfa,konu:d.konu,kaynak:d.kaynak,grup:'',durum:'islendi',giris:'kagit',calisma:'Birlikte okuduk <b>örnek</b>',okunan:'12. sayfa',dikkat:'Yavaş oku',oz:'destek',odev:'13. sayfayı tekrar et',sonraki:'Birlikte kontrol',surum:1};
async function ac(page,context,records={}){
 await mektepAc(page,context,{hoca:true,students,records});await page.locator('[data-sekme=defter]').click();
 await page.locator('[data-dd-gun]').selectOption(d.tarih);await page.locator('[data-dd-ogr]').selectOption('TEST-1');
 await expect(page.locator('[data-dd-form]')).toBeVisible();
 return page.locator('[data-ders-defteri]');
}
test('Ders defteri basılı sayfayı eşler; boş varsayılan kayıt yazmaz, kaydeder ve sonraki derse geçer',async({page,context})=>{
 const p=await ac(page,context);await expect(p).toContainText(`${d.sayfa}. sayfa`);await expect(p.locator('[name=durum]')).toHaveValue('');await expect(p.locator('[name=grup]')).toHaveValue('');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await p.locator('[name=durum]').selectOption('islendi');await p.locator('[name=calisma]').fill('Kâğıttan aktarılan örnek not');await p.locator('[name=odev]').fill('Sayfa 12–13');
 await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 await p.locator('[data-dd-yenile]').click();await expect(p.locator('[name=calisma]')).toHaveValue('Kâğıttan aktarılan örnek not');
 await p.locator('[value=sonraki]').click();await expect(p.locator('[data-dd-ders="2026-09-12_2"]')).toHaveAttribute('aria-pressed','true');
 await expect(p.locator('[name=calisma]')).toHaveValue('');
 const r=await page.evaluate(y=>window.__records[y],yol);expect(r).toHaveLength(1);expect(r[0].surum).toBe(2);expect(r[0].sayfa).toBe(d.sayfa);
});
test('Kesinti ve çakışmada not kaybolmaz; menü ve öğrenci değişiminde vazgeçilebilir',async({page,context})=>{
 const p=await ac(page,context,{[yol]:[kayit]});await p.locator('[name=calisma]').fill('Kaybolmasın');
 page.once('dialog',x=>x.dismiss());await page.locator('[data-sekme=yoklama]').click();await expect(p.locator('[name=calisma]')).toHaveValue('Kaybolmasın');
 await expect(page.locator('[data-sekme=defter]')).toBeFocused();
 page.once('dialog',x=>x.dismiss());await page.locator('[data-sekme=defter]').press('ArrowRight');await expect(page.locator('[data-sekme=defter]')).toBeFocused();
 page.once('dialog',x=>x.dismiss());await p.locator('[data-dd-ogr]').selectOption('TEST-2');await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-1');
 await page.evaluate(()=>{window.__commitError=true;});await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('Kaydedilemedi');await expect(p.locator('[name=calisma]')).toHaveValue('Kaybolmasın');
 await page.evaluate(y=>{window.__commitError=false;window.__records[y][0].surum=2;},yol);await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('başka bir ekranda');
 expect(await page.evaluate(y=>window.__records[y][0].calisma,yol)).toBe(kayit.calisma);
 page.once('dialog',x=>x.accept());await p.locator('[data-dd-yenile]').click();await expect(p.locator('[name=calisma]')).toHaveValue(kayit.calisma);
 await page.evaluate(()=>{window.__dataError=true;});await p.locator('[data-dd-yenile]').click();await expect(p.locator('[data-dd-durum]')).toContainText('alınamadı');
 await page.evaluate(()=>{window.__dataError=false;});await p.locator('[data-dd-yenile]').click();await expect(p.locator('[data-dd-form]')).toBeVisible();
});
test('Arşiv çıktısı seçili öğrenciyle sınırlı; bültene aktarım kendiliğinden yayımlanmaz',async({page,context})=>{
 const p=await ac(page,context,{[yol]:[kayit],'dersDefteri/TEST-2/kayitlar':[{...kayit,calisma:'Kardeşin özel notu'}]});
 await p.locator('.dd-arsiv summary').click();
 await page.evaluate(()=>{const append=document.body.appendChild.bind(document.body);document.body.appendChild=function(n){if(n.tagName==='IFRAME'){const load=n.onload;n.onload=()=>{n.contentWindow.print=()=>{window.__defterPrint=n.contentDocument.body.textContent;};load?.();};}return append(n);};});
 await p.locator('[data-dd-yazdir]').click();await expect.poll(()=>page.evaluate(()=>window.__defterPrint)).toContain('Örnek Talebe');
 const metin=await page.evaluate(()=>window.__defterPrint);expect(metin).toContain('<b>örnek</b>');expect(metin).not.toContain('Kardeşin özel notu');
 const indirme=page.waitForEvent('download');await p.locator('[data-dd-indir]').click();const dosya=await indirme;expect(dosya.suggestedFilename()).toBe('Ders-Defteri-TEST-1.json');
 const data=JSON.parse(readFileSync(await dosya.path(),'utf8'));expect(data.kayitlar).toHaveLength(1);expect(data.ogrenci.ref).toBe('TEST-1');
 await page.locator('[data-sekme=bulten]').click();await page.locator('[data-hb-ogr]').selectOption('TEST-1');await expect(page.locator('[data-hb-form]')).toBeVisible();
 await page.locator('[name=getir]').fill('Defterini getir');page.once('dialog',x=>x.accept());await page.locator('[data-hb-defter]').click();
 await expect(page.locator('[data-hb-durum]')).toContainText('taslağa aktarıldı');await expect(page.locator('[name=ders]')).toHaveValue(/Birlikte okuduk/);await expect(page.locator('[name=getir]')).toHaveValue('Defterini getir');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await page.locator('[value=taslak]').click();await expect(page.locator('[data-hb-durum]')).toContainText('Taslak kaydedildi');
 expect(await page.evaluate(()=>window.__records['bultenler/TEST-1/haftalar'][0].yayin)).toBe(false);
});
test('Ders defteri telefon ve masaüstünde açık/koyu temada erişilebilir ve taşmasız',async({page,context})=>{
 const p=await ac(page,context,{[yol]:[kayit]});
 await expect(p.locator('.dd-ayrinti')).not.toHaveAttribute('open','');
 for(const tema of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');},tema);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await p.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  const sonuc=await new AxeBuilder({page}).include('[data-ders-defteri]').analyze();expect(sonuc.violations).toEqual([]);
  await p.screenshot({path:test.info().outputPath('ders-defteri-'+tema+'.png')});
 }
 await p.locator('.dd-ayrinti summary').click();await expect(p.locator('[name=okunan]')).toHaveValue('12. sayfa');
 await p.locator('[name=sonraki]').fill('Yeni hedef');await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 expect(await page.evaluate(y=>window.__records[y][0].okunan,yol)).toBe('12. sayfa');
 expect(await page.evaluate(y=>window.__records[y][0].sonraki,yol)).toBe('Yeni hedef');
});
