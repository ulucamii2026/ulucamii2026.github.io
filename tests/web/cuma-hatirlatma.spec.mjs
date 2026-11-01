import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as yamlParse } from 'yaml';

/* Cuma namazı hatırlatma bandı (1 Kasım 2026 yönetim kararı). Gün ve saat tarayıcıda hesaplanır: derlenmiş HTML'de
   bant yoktur, sahte saatle Perşembe/Cuma kurulup adacığın ne bastığı denetlenir. Saat verisi derlemenin kullandığı
   Diyanet dosyasından okunur (sabit saat yazılmaz). */

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const origin = new URL(route.request().url()).origin;
    return origin === 'http://127.0.0.1:4401' || origin === 'http://localhost:4401' ? route.continue() : route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

const gunler = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/namaz-vakitleri.json'), 'utf-8')).gunler;
const sabit = yamlParse(readFileSync(resolve(process.cwd(), 'src/content/ayarlar/site.yaml'), 'utf-8')).site.cumaSaati || '';
const haftaGunu = (tarih) => new Date(tarih + 'T12:00:00Z').getUTCDay(); // 4 = Perşembe, 5 = Cuma
const sonrakiGun = (tarih) => new Date(Date.parse(tarih + 'T12:00:00Z') + 86_400_000).toISOString().slice(0, 10);
// Verideki ilk Perşembe-Cuma çifti (Cuma kaydı da olmalı)
const persembe = gunler.find((g) => haftaGunu(g.tarih) === 4 && gunler.some((c) => c.tarih === sonrakiGun(g.tarih)))?.tarih;
const cuma = persembe && gunler.find((g) => g.tarih === sonrakiGun(persembe));
const saat = sabit || cuma?.ogle;
// Çarşamba: Perşembe'den bir gün önce
const carsamba = persembe && new Date(Date.parse(persembe + 'T12:00:00Z') - 86_400_000).toISOString().slice(0, 10);

async function ac(page, an, yol = '/tr/') {
  await page.clock.install({ time: new Date(an) });
  await page.goto(yol);
}

test.describe('Cuma hatırlatma bandı', () => {
  test.skip(!persembe || !cuma, 'Veride Perşembe-Cuma çifti yok');

  test('Perşembe: «Yarın Cuma» ve Cuma saati; hutbe satırı; erişilebilir', async ({ page }) => {
    await ac(page, `${persembe}T09:00:00Z`);
    const bant = page.locator('.cuma-hatirlatma');
    await expect(bant).toHaveCount(1);
    await expect(bant).toHaveAttribute('data-tur', 'yarin');
    await expect(bant).toHaveAttribute('role', 'status');
    await expect(bant).toContainText(`Yarın Cuma: Cuma namazı ${saat}`);
    await expect(bant).toContainText('Türkçe hutbenin ardından Fransızca hutbe okunur.');
    for (const tema of ['light', 'dark']) {
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
      const sonuc = await new AxeBuilder({ page }).include('.cuma-hatirlatma').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => v.id), `axe ${tema}`).toEqual([]);
    }
  });

  test('Cuma namazdan önce «Bugün Cuma», namazdan bir saat sonra bant kalkar', async ({ page }) => {
    await ac(page, `${cuma.tarih}T08:00:00Z`);
    const bant = page.locator('.cuma-hatirlatma');
    await expect(bant).toHaveAttribute('data-tur', 'bugun');
    await expect(bant).toContainText(`Bugün Cuma: Cuma namazı ${saat}`);
    // 16.30 UTC: Brüksel'de en geç 18.30; Cuma vakti + 60 dk her mevsimde bunun öncesinde biter.
    await page.clock.setSystemTime(new Date(`${cuma.tarih}T16:30:00Z`));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(bant).toHaveCount(0);
  });

  test('Çarşamba ve Cumartesi bant yok', async ({ page }) => {
    await ac(page, `${carsamba}T09:00:00Z`);
    await expect(page.locator('#vakit-baslik')).toBeVisible();
    await expect(page.locator('.cuma-hatirlatma')).toHaveCount(0);
    await page.clock.setSystemTime(new Date(`${sonrakiGun(cuma.tarih)}T09:00:00Z`));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(page.locator('.cuma-hatirlatma')).toHaveCount(0);
  });

  test('Beş dilde metin; Fransızcada «:» öncesi ince bölünmez boşluk', async ({ page }) => {
    const beklenen = {
      '/fr/': `Demain, c’est vendredi : prière du vendredi à ${saat}`,
      '/en/': `Tomorrow is Friday: Friday prayer at ${saat}`,
      '/nl/': `Morgen is het vrijdag: vrijdaggebed om ${saat}`,
      '/de/': `Morgen ist Freitag: Freitagsgebet um ${saat}`,
    };
    await page.clock.install({ time: new Date(`${persembe}T09:00:00Z`) });
    for (const [yol, metin] of Object.entries(beklenen)) {
      await page.goto(yol);
      await expect(page.locator('.cuma-hatirlatma strong')).toHaveText(metin);
    }
  });

  test('Namaz vakitleri sayfasında da görünür; takvim aboneliği bağlantısı ve /cuma.ics', async ({ page, request }) => {
    await ac(page, `${persembe}T09:00:00Z`, '/tr/namaz-vakitleri/');
    await expect(page.locator('.cuma-hatirlatma')).toContainText(`Yarın Cuma: Cuma namazı ${saat}`);
    await expect(page.locator('[data-cuma-takvim]')).toHaveAttribute('href', 'webcal://ulucamii.be/cuma.ics');
    const yanit = await request.get('/cuma.ics');
    expect(yanit.status()).toBe(200);
    const ics = await yanit.text();
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('TRIGGER:-PT30M');
    expect((ics.match(/BEGIN:VEVENT/g) || []).length).toBeGreaterThan(0);
  });
});
