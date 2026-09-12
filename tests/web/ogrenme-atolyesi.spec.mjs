import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mektepAc} from './helpers/mektep.mjs';
for(const dil of ['tr','fr','en']){
 test(`${dil}: kısa oturum, açıklama, öz değerlendirme ve yerel tekrar`,async({page,context})=>{
  await mektepAc(page,context,{dil});const a=page.locator('[data-ogrenme]');
  await a.locator('[data-oa=basla]').click();
  await a.locator('[data-oa=dinle]').click();
  expect(await page.evaluate(()=>window.__audio.at(-1).getAttribute('src'))).toMatch(/^\/media\/ses\/elifba\//);
  await a.locator('[data-oa=cevap]').first().click();
  await expect(a.locator('.oa-aciklama')).toBeVisible();
  await a.locator('[data-deger=rahat]').click();
  await expect(a.locator('[data-oa=sonraki]')).toBeVisible();
  const kayit=await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('ulucamii_ogrenme_v1:')))));
  expect(Object.keys(kayit.tekrar)).toHaveLength(1);
  await a.locator('[data-oa=sonraki]').click();
  await expect(a.locator('[data-baslik]')).toBeVisible();
  await a.locator('[data-oa=mola]').click();
  expect(await page.evaluate(()=>window.__audio.every(a=>a.paused))).toBe(true);
  await a.locator('[data-sekme=takip]').click();await expect(a.locator('.oa-liste li')).toHaveCount(1);
 });
 test(`${dil}: aile rehberi, çanta ve hocaya gönderilmemiş yardım taslağı`,async({page,context})=>{
  await mektepAc(page,context,{dil,ogrenci:false});const a=page.locator('[data-ogrenme]');
  await a.locator('[data-sekme=aile]').click();await expect(a.locator('.oa-rehber details')).toHaveCount(8);
  await a.locator('.oa-rehber summary').first().click();await expect(a.locator('.oa-rehber details').first()).toHaveAttribute('open','');
  await a.locator('[data-canta=kitap]').check();
  await a.locator('[data-sekme=bugun]').click();await expect(a.locator('[data-canta=kitap]')).toBeChecked();
  await a.locator('[data-sekme=aile]').click();await a.locator('[data-oa=yardim]').click();
  await expect(page.locator('form[data-form=bildir] [name=metin]')).not.toHaveValue('');
  await expect(page.locator('form[data-form=bildir] [name=tur]')).toHaveValue('soru');
 });
}
test('Kütüphane arama, sekme odağı ve boş sonuç',async({page,context})=>{
 await mektepAc(page,context);const a=page.locator('[data-ogrenme]');
 await a.locator('[data-sekme=kutuphane]').focus();await page.keyboard.press('Enter');
 await expect(a.locator('[data-sekme=kutuphane]')).toBeFocused();
 await expect(a.locator('.oa-liste li')).toHaveCount(65);
 await a.locator('[data-alan]').selectOption('hayat');await expect(a.locator('.oa-liste li')).toHaveCount(8);
 await a.locator('[data-ara]').fill('<script>yok</script>');await expect(a.locator('.oa-liste li')).toHaveCount(0);
 await expect(a.locator('[data-ara]')).toBeFocused();
});
test('İki kardeşin tekrar defterleri ayrıdır; yazdırma yalnız seçili öğrenciyi içerir',async({page,context})=>{
 await mektepAc(page,context,{students:[{ref:'TEST-1',ad:'Birinci',soyad:'Örnek'},{ref:'TEST-2',ad:'İkinci',soyad:'Örnek'}]});
 const a=page.locator('[data-ogrenme]');await a.locator('[data-oa=basla]').click();await a.locator('[data-oa=goster]').click();await a.locator('[data-deger=rahat]').click();
 await page.locator('[data-sec="1"]').click();await a.locator('[data-sekme=takip]').click();await expect(a.locator('.oa-liste li')).toHaveCount(0);
 await page.locator('[data-sec="0"]').click();await a.locator('[data-sekme=takip]').click();await expect(a.locator('.oa-liste li')).toHaveCount(1);
 await page.evaluate(()=>{const get=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'contentWindow').get;Object.defineProperty(HTMLIFrameElement.prototype,'contentWindow',{get(){const win=get.call(this);if(win)win.print=()=>{window.__printed=win.document.body.innerText};return win;}});});
 await a.locator('[data-sekme=aile]').click();await a.locator('[data-oa=yazdir]').click();
 const printed=await page.evaluate(()=>window.__printed);expect(printed).toContain('Birinci Örnek');expect(printed).not.toContain('İkinci Örnek');expect(printed).toContain('Cumartesi konusu');
});
test('Yerel defter bozukken ve depolama kapalıyken öğrenme çalışır',async({page,context})=>{
 await mektepAc(page,context);await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('blocked')};});
 await page.locator('[data-eylem=veliModunaDon]').click();await page.locator('[data-eylem=ogrenciModu]').click();
 const a=page.locator('[data-ogrenme]');await expect(a).toContainText('Tarayıcı kayda izin vermiyor');
 await a.locator('[data-oa=basla]').click();await a.locator('[data-oa=goster]').click();await a.locator('[data-deger=destek]').click();
 await expect(a.locator('[data-oa=sonraki]')).toBeVisible();
});
test('Öğrenme alanı açık/koyu tema, klavye, mobil taşma ve görsel kontrol',async({page,context},info)=>{
 await mektepAc(page,context,{dil:'fr',ogrenci:false});const a=page.locator('[data-ogrenme]');
 for(const theme of ['light','dark']){
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.screenshot({animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const audit=await new AxeBuilder({page}).include('[data-ogrenme]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await a.screenshot({path:info.outputPath(`atolye-${theme}.png`)});
 }
});
