import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const runtime = vm.createContext({ console });
vm.runInContext(readFileSync(new URL('../../scripts/apps-script/veli-cuma.gs', import.meta.url), 'utf8'), runtime);
vm.runInContext(readFileSync(new URL('../../scripts/apps-script/veli-eposta-sablon.gs', import.meta.url), 'utf8'), runtime);
const plan = { donem: '2026-2027', gunler: [
  { tarih: '2026-09-12', dersler: [{ kod: 'kuran', konu: 'Ayn Grubu Harfleri' }] },
  { tarih: '2026-09-13', dersler: [{ kod: 'ahlak', konu: 'Sevincimi paylaşıyorum' }] },
] };

for (const lang of ['tr', 'fr']) {
  test(`${lang}: cuma e-postası posta uygulamasına gömülünce okunaklı ve taşmasız kalır`, async ({ page, context }) => {
    await context.route('**/*', route => route.abort('blockedbyclient'));
    await context.routeWebSocket(/.*/, socket => socket.close());
    const model = runtime.veliCumaModel('2026-09-11', plan, [], {});
    const html = runtime.veliCumaIcerik(model, lang, runtime.veliCumaCevir).htmlBody;
    // Posta uygulaması body/head yerine kendi küçük yazılı kapsayıcısını kullanabilir.
    const inner = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
    for (const width of [320, 390, 760]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent('<html><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<body style="margin:0;font:12px Arial"><main style="padding:0 12px">' + inner + '</main></body></html>');
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `taşma @${width}`).toBeLessThanOrEqual(width);
      const sizes = await page.locator('li').evaluateAll(items => items.map(e => parseFloat(getComputedStyle(e).fontSize)));
      expect(Math.min(...sizes), `ders/malzeme yazısı @${width}`).toBeGreaterThanOrEqual(18);
      const greeting = page.getByText(lang === 'tr' ? 'Değerli velimiz,' : 'Chers parents,', { exact: true });
      expect(await greeting.evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(18);
      for (const link of await page.getByRole('link').all()) {
        const box = await link.boundingBox();
        expect(box.height, `dokunma alanı @${width}`).toBeGreaterThanOrEqual(44);
      }
    }
  });
}
