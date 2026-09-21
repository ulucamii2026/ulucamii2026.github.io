import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {DINLEME,dersYolu,dersBasligi} from '../../src/i18n/dinleme.ts';
import {EGITIM} from '../../src/i18n/egitim.ts';
import {yollar} from '../../src/i18n/ui.ts';
import {readFileSync} from 'node:fs';
const veri=JSON.parse(readFileSync(new URL('../../src/data/ecouter.json',import.meta.url),'utf8'));
const langs=['tr','fr','en','nl','de'];
test.beforeEach(async({context})=>{
  await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4401'?r.continue():r.abort());
  await context.routeWebSocket(/.*/,s=>s.close());
});
for(const dil of langs){
  test(`${dil}: kendi dilinde arama, ders, ses, hata ve geri dönüş`,async({page})=>{
    await page.addInitScript(()=>{
      window.__sesler=[];
      HTMLMediaElement.prototype.play=function(){window.__sesler.push(this.src);return window.__sesHata?Promise.reject(new Error('offline')):Promise.resolve();};
      HTMLMediaElement.prototype.pause=function(){};
    });
    const hub=`/${dil}/${yollar.muhtediEgitimi[dil]}/`;
    await page.goto(hub);
    await expect(page.locator('main h1')).toHaveText(EGITIM[dil].baslik);
    await page.getByLabel(EGITIM[dil].ara).fill(dil==='tr'?'USTUN':'fatha');
    const link=page.locator(`[data-ec-cours] a[href="${dersYolu(dil,'fatha')}"]`);
    await expect(link).toBeVisible();await link.click();
    await expect(page.locator('html')).toHaveAttribute('lang',new RegExp(`^${dil}`));
    await expect(page.locator('main h1')).toHaveText(dersBasligi(dil,'fatha',veri.kodlar.fatha.baslik));
    await expect(page.locator('[data-ec-tekrar]')).toHaveText(DINLEME[dil].tekrar);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(6);
    for(const next of langs) await expect(page.locator(`link[rel="alternate"][href="https://ulucamii.be${dersYolu(next,'fatha')}"]`).first()).toHaveCount(1);
    await page.locator('[data-ec-cal]').nth(1).click();
    expect(await page.evaluate(()=>new URL(window.__sesler.at(-1)).pathname)).toBe(veri.kodlar.fatha.ogeler[1].ses);
    await page.evaluate(()=>{window.__sesHata=true;});
    await page.locator('[data-ec-cal]').nth(2).click();
    await expect(page.locator('[data-ec-durum]')).toHaveText(DINLEME[dil].hata);
    await page.locator('.ec-geri a').click();
    await expect(page).toHaveURL(dil==='fr'?/\/e\/$/:new RegExp(`${yollar.muhtediEgitimi[dil]}/#sesli-dersler$`));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test(`${dil}: eğitim ve ders açık/koyu temada erişilebilir`,async({page})=>{
    for(const route of [`/${dil}/${yollar.muhtediEgitimi[dil]}/`,dersYolu(dil,'fatiha')]){
      await page.goto(route);
      for(const theme of ['light','dark']){
        await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
        await page.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);
        // Kapalı details içindeki ertelenen geçişler finished sözünü çözmeyebilir.
        // Kontrast, ekran görüntüsü testindeki gibi geçişin son durumunda ölçülür.
        await page.evaluate(()=>{for(const a of document.getAnimations()) if(Number.isFinite(a.effect?.getComputedTiming().endTime)) a.finish();});
        expect((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      }
    }
  });
}
test('Dil değiştirme aynı derste kalır; 73 dersin beş dilde adresi ve sesleri korunur',async({page,request})=>{
  await page.goto(dersYolu('en','fatiha'));
  for(const dil of langs){
    const target=dersYolu(dil,'fatiha');
    await expect(page.locator(`header a[href="${target}"]`).first()).toHaveAttribute('href',target);
  }
  for(const dil of langs) for(const [kod,ders] of Object.entries(veri.kodlar).filter(([,d])=>!d.yonlendir)){
    const response=await request.get(dersYolu(dil,kod));
    expect(response.status(),`${dil}/${kod}`).toBe(200);
    const body=await response.text();
    expect(body).toContain(dersBasligi(dil,kod,ders.baslik));
    const sources=[ders.tam?.ses,...(ders.ogeler??[]).map(p=>p.ses),...(ders.satirlar??[]).map(p=>p.ses)].filter(Boolean);
    for(const src of sources) expect(body).toContain(src);
    expect(body).not.toContain('name="robots" content="noindex');
  }
});
test('Önceki sesin geciken hatası yeni sesi durdurmaz',async({page})=>{
  await page.addInitScript(()=>{
    window.__playCount=0;
    HTMLMediaElement.prototype.play=function(){window.__playCount++;if(window.__playCount===1)return new Promise((_,reject)=>{window.__oldReject=reject;});return Promise.resolve();};
    HTMLMediaElement.prototype.pause=function(){};
  });
  await page.goto('/tr/audio/fatha/');
  const buttons=page.locator('[data-ec-cal]');
  await buttons.nth(0).click();await buttons.nth(1).click();
  await page.evaluate(()=>window.__oldReject(new Error('old request aborted')));
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-ec-durum]')).toBeEmpty();
});
test('Yerelleştirilmiş ders JavaScript kapalıyken Arapça metni ve ses bağlantılarını sunar',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4401'?r.continue():r.abort());
  const page=await context.newPage();
  for(const dil of langs){
    await page.goto(`http://127.0.0.1:4401${dersYolu(dil,'fatha')}`);
    await expect(page.locator('.ec-noscript a')).toHaveCount(28);
    await expect(page.locator('.ec-noscript')).toContainText(DINLEME[dil].noscript);
  }
  await context.close();
});
