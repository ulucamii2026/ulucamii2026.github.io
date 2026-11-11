/**
 * G-10 (11 Kasım 2026): egitim CSP'si Apps Script'e yalnız TEK dağıtımın tam adresine izin verir (`connect-src …/macros/s/<kimlik>/exec`)
 * ve yönlendirmenin düştüğü `script.googleusercontent.com`a. Gerçek başlık yerel önizlemeden (firebase.json) gelir; ağ sahtedir.
 * Hoca ekranının yaptığı çağrı biçimi (GET ?islem=liste…, 302 → script.googleusercontent.com) çalışır; başka bir dağıtım ya da yol engellenir.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const GAS = readFileSync(new URL('../../src/scripts/hoca-ekrani.ts', import.meta.url), 'utf8').match(/const GAS = '([^']+)'/)[1];
const BASKA = 'https://script.google.com/macros/s/AKfycb-baska-dagitim-yok/exec';

test('Apps Script: tam adres (302 → script.googleusercontent.com dahil) geçer; başka dağıtım ve başka yol CSP ile engellenir', async ({ page, context }) => {
  const istekler = [];
  // Chromium, fulfill ile verilen 302'yi kendisi izler; ikinci sıçrama (script.googleusercontent.com) yerel yönlendirmeden geçmez ve gerçek ağa
  // (yalnız 404/echo) gider. Bu yüzden sonuç değil, CSP ihlali olup olmadığı ve ilk isteğin ağa çıkıp çıkmadığı sınanır.
  await context.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (u.origin === KOK) return r.continue();
    istekler.push(u.origin + u.pathname);
    if (u.origin === 'https://script.google.com') {
      return r.fulfill({ status: 302, headers: { Location: 'https://script.googleusercontent.com/macros/echo?user_content_key=deneme', 'Access-Control-Allow-Origin': '*' } });
    }
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
  });
  await context.routeWebSocket(/.*/, (s) => s.close());
  await page.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  await page.goto('/hoca/');
  const dene = (adres) => page.evaluate(async (a) => {
    try { const y = await fetch(a); return { durum: y.status, yonlendirildi: y.redirected, url: y.url }; } catch (e) { return { hata: String(e) }; }
  }, adres);

  // Tam adres: istek ağa çıkar, yönlendirme script.googleusercontent.com'a düşer ve CSP ihlali olmaz.
  const iyi = await dene(`${GAS}?islem=liste&anahtar=x`);
  expect(istekler).toContain(GAS);
  if (!iyi.hata) expect(iyi.url).toMatch(/^https:\/\/script\.googleusercontent\.com\//);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);

  // Başka dağıtım ve başka yol: tarayıcı CSP ile keser, istek ağa/yönlendirmeye hiç çıkmaz.
  const once = istekler.length;
  expect((await dene(`${BASKA}?islem=liste`)).hata).toBeTruthy();
  expect((await dene('https://script.google.com/macros/s/x/dev')).hata).toBeTruthy();
  expect(istekler.length, 'engellenen istekler ağa çıkmadı').toBe(once);
  expect((await page.evaluate(() => window.__csp)).length).toBe(2);
});
