import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mektepAc } from './helpers/mektep.mjs';

async function ac(page,context,records={}) {
 await mektepAc(page,context,{hoca:true,records});
 await page.locator('[data-sekme=odev]').click();
 await expect(page.locator('[data-hoca-odev]')).toBeVisible();
 return page.locator('[data-hoca-odev]');
}
test('Haftalık çalışma taslak başlar; kalıplar üç dilde tutarlı, hafta ve sekme değişimi kaydı korur', async({page,context})=>{
 const p=await ac(page,context);
 await expect(p.locator('[name=yayin]')).not.toBeChecked();
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await p.locator('[name=odevTr]').fill('Özel açıklama.');
 await p.locator('[data-ho-kalip=tekrar]').click();await p.locator('[data-ho-kalip=yok]').click();
 await expect(p.locator('[name=odevTr]')).toHaveValue('Özel açıklama.\nBu hafta için ek ödev yok.');
 await expect(p.locator('[name=odevFr]')).toHaveValue('Pas de devoir supplémentaire cette semaine.');
 await p.locator('[data-ho-kalip=okuma]').click();
 await expect(p.locator('[name=odevTr]')).not.toHaveValue(/ek ödev yok/);
 await expect(p.locator('[data-ho-kalip=yok]')).toHaveAttribute('aria-pressed','false');
 const hafta=await p.locator('[data-hafta]').inputValue();
 page.once('dialog',d=>d.dismiss());await p.getByRole('button',{name:'Sonraki hafta',exact:true}).click();
 await expect(p.locator('[data-hafta]')).toHaveValue(hafta);
 page.once('dialog',d=>d.dismiss());await page.locator('[data-sekme=yoklama]').click();
 await expect(p.locator('[name=odevTr]')).toHaveValue(/Özel açıklama/);
 await expect(page.locator('[data-sekme=odev]')).toBeFocused();
 await p.locator('[type=submit]').click();await expect(p.locator('[data-ho-durum]')).toContainText('Taslak kaydedildi');
 await page.locator('[data-sekme=yoklama]').click();await page.locator('[data-sekme=odev]').click();
 await expect(p.locator('[name=odevTr]')).toHaveValue(/Özel açıklama/);
});
test('Etkinlikler tekildir; kaydetme hatası ve sürerken gezinme notları kaybettirmez',async({page,context})=>{
 const p=await ac(page,context);
 const sec=p.locator('[name=etkinlik]');
 await sec.nth(0).selectOption('hayat-su');await expect(sec.nth(1).locator('option[value=hayat-su]')).toHaveJSProperty('disabled',true);
 await sec.nth(1).selectOption('hayat-dinle');await expect(p.locator('[data-ho-etkinlik-ozet]')).toContainText('2/3');
 await p.locator('[data-ho-kalip=yok]').click();
 for(let i=0;i<3;i++)await expect(sec.nth(i)).toHaveValue('');
 await sec.nth(0).selectOption('hayat-su');
 await expect(p.locator('[name=odevTr]')).not.toHaveValue(/ek ödev yok/);
 await expect(p.locator('[name=odevFr]')).not.toHaveValue(/Pas de devoir/);
 await sec.nth(1).selectOption('hayat-dinle');
 await p.locator('[name=odevTr]').fill('Korunacak ödev.');
 await page.evaluate(()=>window.__odevWriteError=true);
 await p.locator('[type=submit]').click();await expect(p.locator('[data-ho-durum]')).toContainText('Kaydedilemedi');
 await expect(p.locator('[name=odevTr]')).toHaveValue('Korunacak ödev.');
 await page.evaluate(()=>{window.__odevWriteError=false;window.__odevWriteDelay=true;});
 await p.locator('[type=submit]').click();await expect(p.locator('[data-ho-durum]')).toContainText('Kaydediliyor');
 await page.locator('[data-sekme=ogrenci]').click();await expect(p.locator('[data-ho-durum]')).toContainText('İşlem sürüyor');
 await expect(p.locator('[name=odevTr]')).toBeDisabled();
 await page.evaluate(()=>window.__releaseOdev());await expect(p.locator('[data-ho-durum]')).toContainText('Taslak kaydedildi');
 const saved=await page.evaluate(()=>window.__records.odevler[0]);
 expect(saved.etkinlikler).toEqual(['hayat-su','hayat-dinle']);expect(saved.yayin).toBe(false);
 expect(saved.tarih).toBe('2026-09-12');
});
test('Yayımlanan tek haftalık kayıt veli portalı ve atölyede aynı içeriği gösterir',async({page,context,browser})=>{
 const p=await ac(page,context);
 await p.locator('[data-ho-kalip=tekrar]').click();
 await p.locator('[name=etkinlik]').first().selectOption('hayat-su');
 await p.locator('.ho-onizleme summary').click();await p.locator('[data-ho-dil]').selectOption('fr');
 await expect(p.locator('[data-ho-onizleme]')).toContainText('Revoyez ensemble');
 await p.locator('[name=yayin]').check();await p.locator('[type=submit]').click();
 await expect(p.locator('[data-ho-durum]')).toContainText('yayımlandı');
 const records=await page.evaluate(()=>window.__records);
 const ctx=await browser.newContext({baseURL:'http://127.0.0.1:4401'});const veli=await ctx.newPage();
 try{
  await mektepAc(veli,ctx,{dil:'fr',records});
  await expect(veli.locator('body')).toContainText('Revoyez ensemble');
  await expect(veli.locator('[data-ogrenme]')).toContainText('eau');
 }finally{await ctx.close();}
 await expect.poll(()=>page.evaluate(()=>Object.keys(window.__records).filter(k=>k.startsWith('ilerleme')).length)).toBe(0);
});
test('Plan ve öğrenci bağlantıları aynı kayıtları açar; görünüm iki temada erişilebilir',async({page,context},info)=>{
 const p=await ac(page,context);
 for(const tema of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');},tema);
  const axe=await new AxeBuilder({page}).include('[data-hoca-odev]').analyze();expect(axe.violations).toEqual([]);
  expect(await p.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await p.screenshot({path:info.outputPath(`odev-${tema}.png`)});
 }
 await p.locator('.ho-plan summary').click();await p.locator('[data-ho-defter]').first().click();
 await expect(page.locator('[data-dd-gun]')).toHaveValue('2026-09-12');
 await page.locator('[data-sekme=odev]').click();
 await p.locator('[data-ho-ogr]').selectOption('TEST-1');await p.locator('[data-ho-takip]').click();
 await expect(page.locator('form[data-form=ilerleme]')).toBeVisible();
});

test('Önceki hafta kopyası yeni ezbere eski çeviriyi karıştırmaz ve materyali taşımaz',async({page,context})=>{
 const p=await ac(page,context,{odevler:[{id:'2026-09-12',tarih:'2026-09-12',hafta:2,ezber:{tr:'Eski ezber',fr:'Ancienne mémorisation',en:''},odev:{tr:'Önceki ödev',fr:'Ancien devoir',en:''},materyal:'https://example.test/eski-hafta',etkinlikler:['hayat-su'],yayin:true}]});
 await p.getByRole('button',{name:'Sonraki hafta',exact:true}).click();
 await p.locator('[name=ezberTr]').fill('Bu haftanın yeni ezberi');
 await p.locator('[data-ho-kopyala]').click();
 await expect(p.locator('[name=ezberTr]')).toHaveValue('Bu haftanın yeni ezberi');
 await expect(p.locator('[name=ezberFr]')).toHaveValue('');
 await expect(p.locator('[name=odevTr]')).toHaveValue('Önceki ödev');
 await expect(p.locator('[name=odevFr]')).toHaveValue('Ancien devoir');
 await expect(p.locator('[name=materyal]')).not.toHaveValue(/eski-hafta/);
 await expect(p.locator('[name=etkinlik]').first()).toHaveValue('');
 await expect(p.locator('[name=yayin]')).not.toBeChecked();
});
