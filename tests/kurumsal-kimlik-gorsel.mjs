/** Çalıştırma: node tests/kurumsal-kimlik-gorsel.mjs. Önce npm run eposta:onizle.
 * HTTPS logoları yerel public kopyalarından karşılanır; dış ağın tamamı kesilir. */
import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const klasor = 'D:/tmp/eposta-onizleme';
const kimlik = JSON.parse(await readFile(join(root, 'src/data/kurumsal-kimlik.json'), 'utf8'));
const gorseller = new Map(Object.values(kimlik.kurumlar).map(k => [k.logo.web, join(root, 'public', new URL(k.logo.web).pathname)]));
const sonuclar = [], hatalar = [];
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({serviceWorkers:'block', reducedMotion:'reduce'});
await context.route('**/*', async route => {
  const yol = gorseller.get(route.request().url());
  if (yol) await route.fulfill({path:yol, contentType:'image/png'});
  else await route.abort('blockedbyclient');
});
await context.routeWebSocket(/.*/, socket => socket.close());
const page = await context.newPage();
await mkdir(join(klasor, 'ekran'), {recursive:true});
try {
  for (const kurum of ['kurs', 'cami']) for (const dil of kimlik.diller) for (const tur of ['duz', 'zengin']) {
    const ad = kurum + '-' + dil + '-' + tur;
    const html = await readFile(join(klasor, ad + '.html'), 'utf8');
    for (const renk of ['light', 'dark']) for (const width of [320, 390, 760]) {
      await page.setViewportSize({width, height:1000});
      await page.emulateMedia({colorScheme:renk, reducedMotion:'reduce'});
      await page.setContent(html, {waitUntil:'load'});
      const olcum = await page.evaluate(() => ({
        genislik:document.documentElement.scrollWidth,
        kart:document.querySelector('[data-eposta-sablon]').getBoundingClientRect().width,
        zemin:getComputedStyle(document.body).backgroundColor,
        gorseller:[...document.images].every(i => i.complete && i.naturalWidth > 0),
        tasanlar:[...document.querySelectorAll('h1,h2,p,li,img')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.tagName),
        hareket:[...document.querySelectorAll('*')].every(e => getComputedStyle(e).animationName === 'none')
      }));
      await page.keyboard.press('Tab');
      olcum.klavye = await page.evaluate(() => document.activeElement.tagName === 'A');
      const id = ad + '-' + renk + '-' + width;
      sonuclar.push({id, ...olcum});
      try {
        assert.ok(olcum.genislik <= width, 'Yatay taşma');
        assert.ok(olcum.kart <= kimlik.gorunum.eposta.genislikPx, 'Kart genişliği');
        assert.deepEqual(olcum.tasanlar, [], 'Öğe taşması');
        assert.ok(olcum.gorseller, 'Yerel logo yüklenmedi'); assert.ok(olcum.hareket); assert.ok(olcum.klavye, 'Klavye erişimi');
        const rgb = kimlik.gorunum.ortakRenk.zemin.match(/\w\w/g).map(x => parseInt(x, 16));
        assert.equal(olcum.zemin, 'rgb(' + rgb.join(', ') + ')');
      } catch (hata) { hatalar.push({id, hata:hata.message}); }
      if (renk === 'light' && width !== 320) await page.screenshot({path:join(klasor, 'ekran', id + '.png'), fullPage:true});
    }
    // İstemci head/body'yi atıp kendi 12 px kapsayıcısına koysa da düzen ve gövde ölçüsü korunur.
    await page.setViewportSize({width:320, height:1000});
    const inner = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
    await page.setContent('<html><body style="margin:0;font:12px Arial"><main style="padding:0 12px">' + inner + '</main></body></html>', {waitUntil:'load'});
    const olcum = await page.evaluate(() => ({genislik:document.documentElement.scrollWidth, punto:parseFloat(getComputedStyle(document.querySelector('h1').nextElementSibling).fontSize)}));
    sonuclar.push({id:ad + '-posta-kapsayici', ...olcum});
    if (olcum.genislik > 320 || olcum.punto !== kimlik.gorunum.eposta.govdePuntoPx) hatalar.push({id:ad + '-posta-kapsayici', ...olcum});
  }
} finally { await browser.close(); }
await writeFile(join(klasor, 'gorsel-denetim.json'), JSON.stringify({tarih:new Date().toISOString(), sonuclar, hatalar}, null, 2) + '\n');
console.log(sonuclar.length + ' ölçüm; ' + hatalar.length + ' hata; 24 ekran görüntüsü: ' + join(klasor, 'ekran'));
if (hatalar.length) { console.error(JSON.stringify(hatalar)); process.exitCode = 1; }
