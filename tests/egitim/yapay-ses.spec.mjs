/**
 * Yapay ses etiketi (24 Ekim 2026): Diyanet kaydı olmayan Kur'an dışı dualarda (katalog `ses.yapay`) çalarda ve liste
 * satırında görünür «Yapay ses» etiketi, beş dilde; Diyanet kaydı olan maddede etiket yok. Ses ulucamii.be'den gelir;
 * burada ağ kapalı, play() taklit edilir (calisma.spec.mjs ile aynı düzen).
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const ETIKET = { tr: 'Yapay ses', fr: 'Voix de synthèse', en: 'Synthetic voice', nl: 'Synthetische stem', de: 'Synthetische Stimme' };
const YAPAYLAR = katalog.ogeler.filter((o) => o.ses?.yapay);
const KOK = 'http://127.0.0.1:4402';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__sesler = [];
    HTMLMediaElement.prototype.play = function () { window.__ses = this; window.__sesler.push(this.src); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });
});

test('katalogda tam iki yapay sesli madde var (yeni biri onaysız eklenemez)', () => {
  expect(YAPAYLAR.map((o) => o.id).sort()).toEqual(['d-kelime-i-sehadet', 'd-kelime-i-tevhid']);
});

for (const dil of DILLER) {
  for (const oge of YAPAYLAR) {
    test(`${dil}: ${oge.id} çalışma sayfasında etiket çaların yanında; çalma düğmesi etikete bağlı`, async ({ page }) => {
      await page.goto(`/${dil}/calis/${oge.id}/`);
      await expect(page.locator('h1')).toHaveText(oge.ad[dil]);
      const not = page.locator('[data-yapay-ses]');
      await expect(not).toBeVisible();
      await expect(not.locator('.yapay-rozet')).toHaveText(ETIKET[dil]);
      // Etiket çalar bölümünün içinde, düğmelerden önce; düğme açıklamasıyla bağlı (ekran okuyucu "yapay ses" duyar).
      await expect(page.locator('.calisma-calar [data-yapay-ses]')).toHaveCount(1);
      await expect(page.locator('[data-oynat]')).toHaveAttribute('aria-describedby', 'yapay-ses-not');
      expect(await not.evaluate((el) => el.compareDocumentPosition(document.querySelector('[data-oynat]')) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
      // Diyanet kaydı olduğunu söyleyen cümle bu sayfada yok.
      await expect(page.locator('.calisma-not')).not.toContainText(/Diyanet|Presidency|Presidium|Präsidiums/);
      // Ses dosyası yapay klasöründen ve ulucamii.be'den gelir.
      await page.locator('[data-sira]').selectOption('0');
      await page.locator('[data-oynat]').click();
      expect(await page.evaluate(() => window.__sesler)).toEqual([`https://ulucamii.be${oge.ses.tam}`]);
      // Dar ekranda yatay taşma yok.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test(`${dil}: giriş listesinde yapay sesli maddede rozet ve çal düğmesi adında etiket; Diyanet kaydında yok`, async ({ page }) => {
    await page.goto(`/${dil}/`);
    for (const oge of YAPAYLAR) {
      const satir = page.locator(`#m-${oge.id}`);
      await expect(satir.locator('.yapay-rozet')).toHaveText(ETIKET[dil]);
      await expect(satir.locator('button.dinle')).toHaveAttribute('aria-label', new RegExp(`\\(${ETIKET[dil]}\\)$`));
      await expect(satir.locator('button.dinle')).toHaveAttribute('data-etiket-durdur', new RegExp(`\\(${ETIKET[dil]}\\)$`));
    }
    const diyanetli = page.locator('#m-d-subhaneke');
    await expect(diyanetli.locator('button.dinle')).toHaveCount(1);
    await expect(diyanetli.locator('.yapay-rozet')).toHaveCount(0);
    await expect(page.locator('.yapay-rozet')).toHaveCount(YAPAYLAR.length);
  });

  test(`${dil}: Diyanet kaydı olan çalışma sayfasında yapay ses etiketi yok, Diyanet açıklaması var`, async ({ page }) => {
    await page.goto(`/${dil}/calis/s-fatiha/`);
    await expect(page.locator('[data-yapay-ses]')).toHaveCount(0);
    await expect(page.locator('.yapay-rozet')).toHaveCount(0);
    await expect(page.locator('.calisma-not')).toContainText('Diyanet');
  });
}
