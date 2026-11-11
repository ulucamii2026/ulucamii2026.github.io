import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mektepAc} from './helpers/mektep.mjs';

test('Hoca dört kitabı görür; anahtar yoksa PDF indirmez ve yeniden denemeye izin verir',async({page,context})=>{
 await mektepAc(page,context,{hoca:true});
 await page.locator('[data-sekme=kitaplar]').click();
 const panel=page.locator('[data-hoca-kitaplari]');
 await expect(panel.locator('[data-kitap-indir]')).toHaveCount(4);
 await expect(panel).toContainText('Fransızca · Belçika');await expect(panel).toContainText('Türkçe · Vektörel');
 let downloaded=false;page.on('download',()=>{downloaded=true;});
 await panel.locator('[data-kitap-indir]').first().click();
 await expect(panel.locator('[data-kitap-durum]')).toContainText('Kitap indirilemedi');
 await expect(panel.locator('[data-kitap-indir]').first()).toBeEnabled();expect(downloaded).toBe(false);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const theme of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);
  await page.evaluate(()=>{for(const a of document.getAnimations())if(Number.isFinite(a.effect?.getComputedTiming().endTime))a.finish();});
  expect((await new AxeBuilder({page}).include('[data-hoca-kitaplari]').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
 }
 await panel.screenshot({path:test.info().outputPath('ders-kitaplari.png')});
});
