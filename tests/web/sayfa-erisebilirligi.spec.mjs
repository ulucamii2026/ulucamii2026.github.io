import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const yollar={
 tr:['hakkimizda','uyelik','ihtida','diyanet-hizmetleri','kuran-kursu-mufredati'],
 fr:['a-propos','adhesion','conversion-a-l-islam','services-diyanet','programme-ecole-coranique'],
 en:['about','membership','becoming-muslim','diyanet-services','quran-school-curriculum'],
};
for(const [lang,paths] of Object.entries(yollar))test(`${lang}: bilgi listeleri ve küçük metin kontrastı`,async({page,context})=>{
 test.setTimeout(90000);
 await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4401'?r.continue():r.abort());
 await context.routeWebSocket(/.*/,s=>s.close());
 for(const path of paths){
  await page.goto(`/${lang}/${path}/`);
  await expect(page.locator('main')).toBeVisible();
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   await page.screenshot({animations:'disabled'});
   const result=await new AxeBuilder({page}).include('main').withRules(['definition-list','dlitem','color-contrast']).analyze();
   expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,reason:n.failureSummary}))})),`${lang}/${path}: ${theme}`).toEqual([]);
  }
 }
});
