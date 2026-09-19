import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const site = parse(readFileSync('src/content/ayarlar/site.yaml', 'utf8')).site;
const ozelTelefon = String(site.telefon.dinGorevlisi).replace(/\D/g, '');
const yollar = {
  tr: ['yonetim-kurulu', 'kurs-gunlugu', 'cenaze-hizmetleri', 'duyurular/2027-hac-kayitlari-devam-ediyor'],
  fr: ['conseil-administration', 'journal-des-cours', 'services-funeraires', 'annonces/2027-hac-kayitlari-devam-ediyor'],
  en: ['board', 'course-journal', 'funeral-services'],
};

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, socket => socket.close());
});

for (const [dil, sayfalar] of Object.entries(yollar)) {
  for (const sayfa of sayfalar) {
    test(`${dil}/${sayfa}: yeni içerik, tema, dar ekran ve mahremiyet`, async ({ page, isMobile }) => {
      if (isMobile) await page.setViewportSize({ width: 320, height: 850 });
      const hatalar = [];
      page.on('pageerror', e => hatalar.push(e.message));
      expect((await page.goto(`/${dil}/${sayfa}/`)).status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      // Numara bağlantının hedefinde bulunabilir, görünen/erişilebilir metinde ve tel: bağlantısında bulunamaz.
      const mahremiyet = await page.evaluate(numara => {
        const temiz = s => (s || '').replace(/\D/g, '');
        return {
          metin: temiz(document.body.innerText).includes(numara),
          etiket: [...document.querySelectorAll('[aria-label], [title], img[alt]')].some(el =>
            ['aria-label', 'title', 'alt'].some(a => temiz(el.getAttribute(a)).includes(numara))),
          telefon: [...document.querySelectorAll('a[href^="tel:"]')].some(a => temiz(a.getAttribute('href')).includes(numara)),
        };
      }, ozelTelefon);
      expect(mahremiyet).toEqual({ metin: false, etiket: false, telefon: false });
      for (const tema of ['light', 'dark']) {
        await page.evaluate(t => document.documentElement.dataset.theme = t, tema);
        await page.screenshot({ animations: 'disabled' });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tema).toBe(true);
        const sonuc = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map(v => ({ id: v.id, hedefler: v.nodes.map(n => n.target) })), tema).toEqual([]);
      }
      expect(hatalar).toEqual([]);
    });
  }
}

test('Fransızca hac tablosu dar ekranda klavyeyle kayar; geniş ekranda ek sekme durağı kalmaz', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/fr/annonces/2027-hac-kayitlari-devam-ediyor/');
  const tablo = page.locator('.duz-yazi table');
  await expect(tablo).toHaveAttribute('tabindex', '0');
  await tablo.focus();
  await expect(tablo).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => tablo.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(tablo).not.toHaveAttribute('tabindex', '0');
});
