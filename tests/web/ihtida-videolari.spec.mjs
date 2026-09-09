import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, existsSync } from 'node:fs';

const veri = JSON.parse(readFileSync(new URL('../../src/data/ihtida-videolari.json', import.meta.url), 'utf8'));
const tr = JSON.parse(readFileSync(new URL('../../src/data/diyanet-videolar.json', import.meta.url), 'utf8'));
const en = JSON.parse(readFileSync(new URL('../../src/data/diyanet-videolar-en.json', import.meta.url), 'utf8'));
const yollar = { tr: 'ihtida', fr: 'conversion-a-l-islam', en: 'becoming-muslim' };

for (const dil of ['tr', 'fr', 'en']) {
  test(`${dil}: tam genişlik, doğru dil, yerel kapak ve akordiyon oynatıcı yaşam döngüsü`, async ({ page, context }) => {
    const disIstekler = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === 'http://127.0.0.1:4401') return route.continue();
      disIstekler.push(url.href);
      return route.abort('blockedbyclient');
    });
    await context.routeWebSocket(/.*/, socket => socket.close());
    await page.goto(`/${dil}/${yollar[dil]}/`);
    const alan = page.locator('#diyanet-videolari');
    await alan.scrollIntoViewIfNeeded();
    await expect(alan).toHaveAttribute('data-video-dil', dil);
    await expect(alan.locator('iframe, video')).toHaveCount(0);
    await expect(alan.locator('[data-video-dersi][open]')).toHaveCount(1);
    const expected = dil === 'tr' ? [...tr.bolumler, ...tr.ekler] : dil === 'en' ? en.bolumler : [];
    await expect(alan.locator('[data-video-dersi]')).toHaveCount(1 + expected.length);
    expect(disIstekler.filter(u => /youtube|ytimg|diyanet/.test(u))).toEqual([]);
    const heroWidth = (await alan.locator('.one-cikan').boundingBox()).width;
    expect(Math.abs((await alan.locator('.video-giris').boundingBox()).width - heroWidth)).toBeLessThan(2);
    expect(Math.abs((await alan.locator('.one-cikan figure').boundingBox()).width - heroWidth)).toBeLessThan(2);

    const sources = await alan.locator('[data-resmi-kaynak]').evaluateAll(links => links.map(a => a.href));
    for (const href of sources) expect(['dijital.diyanet.gov.tr', 'whatis.islam.gov.tr', 'www.diyanethaber.com.tr']).toContain(new URL(href).hostname);
    const posters = await alan.locator('img').evaluateAll(imgs => [...new Set(imgs.map(i => i.getAttribute('src')))]);
    for (const src of posters) {
      expect(src).toMatch(/^\/media\/ihtida\/kapaklar\/[a-z0-9-]+\.webp$/);
      expect(existsSync(new URL('../../public' + src, import.meta.url)), src).toBe(true);
    }
    const ids = await alan.locator('.seri-dersleri [data-video-dersi]').evaluateAll(rows => rows.map(r => r.dataset.dersId));
    expect(ids).toEqual(expected.map(v => v.id));
    if (dil !== 'tr') {
      await expect(alan.locator('[data-gom*="tX_NMZjTSc8"]')).toHaveCount(0);
      await expect(alan).not.toContainText('Kelime-i Şehadet');
    }
    const ilk = alan.locator('.one-cikan [data-video-dersi]');
    const image = ilk.locator('figure img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.locator('#tema-dugme').click();
      await page.screenshot({ animations: 'disabled' });
      const axe = await new AxeBuilder({ page }).include('#diyanet-videolari').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await ilk.locator('button').focus();
    await page.keyboard.press('Enter');
    await expect(ilk.locator('iframe')).toHaveAttribute('src', new RegExp(`youtube-nocookie.com/embed/${veri[dil][0].id}`));
    await expect(ilk.locator('iframe')).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    await expect(ilk.locator('[data-video-yardim]')).toBeVisible();
    await expect(ilk.locator('[data-resmi-kaynak]')).toBeVisible();
    await expect.poll(() => disIstekler.some(u => u.includes('youtube-nocookie.com/embed/'))).toBe(true);

    // Kapatınca iframe DOM'dan kalkar: gizli ses/ağ devam etmez. Klavyeyle tekrar açılabilir.
    await ilk.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(ilk).not.toHaveAttribute('open', '');
    await expect(ilk.locator('iframe')).toHaveCount(0);
    await page.keyboard.press('Space');
    await expect(ilk.locator('button')).toBeVisible();
    await expect(ilk.locator('[data-video-yardim]')).toBeHidden();
    await ilk.locator('button').click();
    await expect(ilk.locator('iframe')).toHaveCount(1);
    if (expected.length) {
      const next = alan.locator('.seri-dersleri [data-video-dersi]').first();
      await next.locator('summary').click();
      await expect(ilk).not.toHaveAttribute('open', '');
      await expect(ilk.locator('iframe')).toHaveCount(0);
      await expect(alan.locator('[data-video-dersi][open]')).toHaveCount(1);
      await expect(next.locator('button')).toBeVisible();
      // Akordiyonu açmak üçüncü tarafa bağlanmaz; ayrı Oynat eylemi gerekir.
      await expect(next.locator('iframe')).toHaveCount(0);
      await next.locator('button').click();
      await expect(next.locator('iframe')).toHaveAttribute('src', new RegExp(`/embed/${expected[0].id}`));
      await next.locator('summary').click();
      await expect(alan.locator('iframe')).toHaveCount(0);
    }
    expect(page.url()).toBe(`http://127.0.0.1:4401/${dil}/${yollar[dil]}/`);
    expect(context.pages()).toHaveLength(1);
    // Sayfanın altındaki ertelenen kitap kartları önceki ekran genişliğini taşımamalı.
    await page.setViewportSize({ width: 320, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
