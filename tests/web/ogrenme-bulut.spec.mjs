import {test,expect} from '@playwright/test';
import {mektepAc} from './helpers/mektep.mjs';
const path='evCalismalari/TEST-1/etkinlikler';
const kayit={son:'2026-09-12',sonraki:'2026-09-13',basamak:1,cevap:'rahat'};
for(const dil of ['tr','fr','en'])test(`${dil}: hocanın yalnız bu haftaki etkinlikleri ve hesap kaydı`,async({page,context})=>{
 await mektepAc(page,context,{dil,records:{odevler:[{tarih:'2026-09-12',yayin:true,etkinlikler:['hayat-su','hayat-dinle']},{tarih:'2026-09-05',yayin:true,etkinlikler:['hayat-tesekkur']}]},cloud:{[path]:{'hayat-su':kayit}}});
 const a=page.locator('[data-ogrenme]');await expect(a.locator('.oa-atama li')).toHaveCount(2);
 await a.locator('[data-sekme=takip]').click();await expect(a.locator('.oa-liste li')).toHaveCount(1);
 await a.locator('[data-id=hayat-su]').click();await a.locator('[data-oa=goster]').click();await a.locator('[data-deger=rahat]').click();
 await expect.poll(()=>page.evaluate(p=>window.__cloud[p]['hayat-su'].son,path)).toBe('2026-09-13');
 expect(await page.evaluate(p=>window.__cloud[p]['hayat-su'].sonraki,path)).toBe('2026-09-16');
 await expect(a.locator('[data-oa=sonraki]')).toBeFocused();
});
test('Çevrimdışı kayıt sırada kalır ve bağlantı gelince eşleşir; tekrar basmak yazmayı şişirmez',async({page,context})=>{
 await mektepAc(page,context,{cloudError:true});const a=page.locator('[data-ogrenme]');
 await a.locator('[data-oa=basla]').click();await a.locator('[data-oa=goster]').click();await a.locator('[data-deger=destek]').click();
 await expect(a.locator('[data-bulut-durum]')).toContainText('tamamlanamadı');
 expect(await page.evaluate(()=>window.__writes)).toHaveLength(0);
 expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith(':bekleyen'))))))).toHaveLength(1);
 await page.evaluate(()=>{window.__cloudError=false;window.dispatchEvent(new Event('online'));});
 await expect.poll(()=>page.evaluate(()=>window.__writes.length)).toBe(1);
 await a.locator('[data-oa=esle]').click();await expect(a.locator('[data-bulut-durum]')).toContainText('güncel');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(1);
});
test('Geç gelen eski öğrenci eşleştirmesi kardeşin ekranına veya kaydına taşınmaz',async({page,context})=>{
 await mektepAc(page,context,{students:[{ref:'TEST-1',ad:'Birinci',soyad:'Örnek'},{ref:'TEST-2',ad:'İkinci',soyad:'Örnek'}]});
 await page.evaluate(()=>{window.__cloudDelay=true;});await page.locator('[data-ogrenme] [data-oa=esle]').click();
 await page.evaluate(()=>{window.__oldRelease=window.__releaseCloud;window.__cloud['evCalismalari/TEST-1/etkinlikler']={'hayat-su':{son:'2026-09-12',sonraki:'2026-09-13',basamak:1,cevap:'rahat'}};});
 await page.locator('[data-sec="1"]').click();
 await page.evaluate(()=>{window.__cloudDelay=false;window.__oldRelease?.();window.__releaseCloud?.();});
 const a=page.locator('[data-ogrenme]');await a.locator('[data-sekme=takip]').click();await expect(a.locator('.oa-liste li')).toHaveCount(0);
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
});
test('Yanlış cevap açıklamadan sonra yeniden denenir ve yardım taslağı konuyu içerir',async({page,context})=>{
 await mektepAc(page,context);const a=page.locator('[data-ogrenme]');await a.locator('[data-sekme=kutuphane]').click();await a.locator('[data-id=hayat-su]').click();
 const buttons=a.locator('[data-oa=cevap]');const texts=await buttons.allTextContents();await buttons.nth(texts.findIndex(t=>t.includes('Başkasının'))).click();
 await expect(a.locator('[data-oa=yenidenDene]')).toBeVisible();await a.locator('[data-oa=yenidenDene]').click();await expect(buttons.first()).toBeEnabled();
 await a.locator('[data-oa=yardim]').click();await expect(page.locator('form[data-form=bildir] [name=metin]')).toHaveValue(/Suyu koruyalım/);
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
});
test('Hoca üç etkinlik atar, İngilizce ödevi kaydeder ve evdeki öz değerlendirmeyi görür',async({page,context})=>{
 await mektepAc(page,context,{hoca:true,cloud:{[path]:{'hayat-su':kayit}}});
 await page.locator('[data-sekme=odev]').click();const f=page.locator('form[data-form=odev]');
 await f.locator('[name=etkinlik]').nth(0).selectOption('hayat-su');await f.locator('[name=etkinlik]').nth(1).selectOption('hayat-dinle');
 await f.locator('[name=ezberEn]').evaluate(el=>el.closest('details').open=true);await f.locator('[name=odevEn]').fill('Review together.');
 await f.locator('[type=submit]').click();await expect.poll(()=>page.evaluate(()=>window.__writes.filter(w=>w.ref.col==='odevler').length)).toBe(1);
 const saved=await page.evaluate(()=>window.__writes.find(w=>w.ref.col==='odevler').data);expect(saved.etkinlikler).toEqual(['hayat-su','hayat-dinle']);expect(saved.odev.en).toBe('Review together.');
 await page.locator('[data-sekme=ogrenci]').click();await page.locator('[data-ogr=TEST-1]').click();await expect(page.locator('[data-ev-calismasi]')).toContainText('Suyu koruyalım');await expect(page.locator('[data-ev-calismasi]')).toContainText('öğretmen değerlendirmesi değildir');
 await page.screenshot({path:test.info().outputPath('hoca-ev-calisma.png'),fullPage:true});
});
