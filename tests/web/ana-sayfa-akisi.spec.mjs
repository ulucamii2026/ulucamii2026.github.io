import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as yamlParse } from 'yaml';

// Ağ izolasyonu: localhost:4401 dışındaki tüm dış HTTP isteklerini ve WebSocket bağlantılarını engelle
test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const origin = new URL(route.request().url()).origin;
    return origin === 'http://127.0.0.1:4401' || origin === 'http://localhost:4401'
      ? route.continue()
      : route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

// Kaynak site verileri (src/content/ayarlar/site.yaml) — sabit saat/yıl yerine public yaml ile dinamik karşılaştırma
const siteYamlPath = resolve(process.cwd(), 'src/content/ayarlar/site.yaml');
const siteConfig = yamlParse(readFileSync(siteYamlPath, 'utf-8')).site;
const haftalikProgramData = siteConfig.haftalikProgram || [];
const bankaData = siteConfig.banka || {};
const gpsData = siteConfig.gps || {};

// i18n kanonik rotalar (src/i18n/ui.ts yollar haritası ile uyumlu)
const kanonikYollar = {
  ihtida: { tr: '/tr/ihtida/', fr: '/fr/conversion-a-l-islam/', en: '/en/becoming-muslim/' },
  cenaze: { tr: '/tr/cenaze-hizmetleri/', fr: '/fr/services-funeraires/', en: '/en/funeral-services/' },
  konsolosluk: { tr: '/tr/konsolosluk/', fr: '/fr/consulat/', en: '/en/consulate/' },
  uyelik: { tr: '/tr/uyelik/', fr: '/fr/adhesion/', en: '/en/membership/' },
  kurankursu: { tr: '/tr/kuran-kursu/', fr: '/fr/ecole-coranique/', en: '/en/quran-school/' },
  veli: { tr: '/tr/veli-portali/', fr: '/fr/portail-parents/', en: '/en/parents-portal/' },
  irsat: { tr: '/tr/irsat-programi/', fr: '/fr/programme-femmes-et-jeunes-filles/', en: '/en/women-and-girls-programme/' },
  adab: { tr: '/tr/cami-adabi/', fr: '/fr/adab-de-la-mosquee/', en: '/en/mosque-etiquette/' },
  hakkimizda: { tr: '/tr/hakkimizda/', fr: '/fr/a-propos/', en: '/en/about/' },
  iletisim: { tr: '/tr/iletisim/', fr: '/fr/contact/', en: '/en/contact/' },
  bagis: { tr: '/tr/bagis/', fr: '/fr/don/', en: '/en/donate/' },
};

for (const lang of ['tr', 'fr', 'en']) {
  test.describe(`Ana Sayfa Akışı [${lang}]`, () => {
    test(`${lang}: yeni akış görünür, 4 bölüm sırası korunur ve kanonik rotalar geçerlidir`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);

      // 1. Slider ve prayers sabit kalmalı
      await expect(page.locator('.gv-kapsayici')).toBeVisible();
      await expect(page.locator('.ana-vakit-yatay')).toBeVisible();

      // 2. Eski standalone bantlar (HacBandi / KayitBandi) ana akışta bağımsız bant olarak yer almamalı
      await expect(page.locator('.hac-bandi, aside.hac-bandi')).toHaveCount(0);
      await expect(page.locator('aside.kayit-ikincil')).toHaveCount(0);

      // 3. Bu alanlarda yeni 12 kartlık ızgara olmamalı
      await expect(page.locator('.ana-akis .grid-cols-12, .ana-akis [class*="grid-cols-12"]')).toHaveCount(0);

      // 4. Yeni ana akış kapsayıcısı
      const akis = page.locator('main .ana-akis');
      await expect(akis).toBeVisible();

      // 5. 4 Bölüm: haftalik-yasam, guncel-bilgiler, hizmetler, ziyaret (sırayla)
      const secHaftalik = akis.locator('#haftalik-yasam');
      const secGuncel = akis.locator('#guncel-bilgiler');
      const secHizmetler = akis.locator('#hizmetler');
      const secZiyaret = akis.locator('#ziyaret');

      await expect(secHaftalik).toBeVisible();
      await expect(secGuncel).toBeVisible();
      await expect(secHizmetler).toBeVisible();
      await expect(secZiyaret).toBeVisible();
      for (const selector of ['.ana-akis-egitim-gorsel', '.ana-akis-ziyaret-gorsel']) {
        const picture = akis.locator(selector);
        await picture.scrollIntoViewIfNeeded();
        await expect.poll(() => picture.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      }

      // Başlık kurgusu (açıklayıcı h2)
      for (const sec of [secHaftalik, secGuncel, secHizmetler, secZiyaret]) {
        const h2 = sec.locator('h2').first();
        await expect(h2).toBeVisible();
        const text = await h2.innerText();
        expect(text.trim().length).toBeGreaterThan(0);
      }

      // Bölüm dikey yerleşim sırası (üstten alta: takvim -> haberler -> hizmetler -> ziyaret)
      const boxHaftalik = await secHaftalik.boundingBox();
      const boxGuncel = await secGuncel.boundingBox();
      const boxHizmetler = await secHizmetler.boundingBox();
      const boxZiyaret = await secZiyaret.boundingBox();

      expect(boxHaftalik.y).toBeLessThan(boxGuncel.y);
      expect(boxGuncel.y).toBeLessThan(boxHizmetler.y);
      expect(boxHizmetler.y).toBeLessThan(boxZiyaret.y);

      // 6. Kanonik hizmet rotaları ve erişilebilir linkler
      const allLinks = await akis.locator('a[href]').evaluateAll((els) =>
        els.map((a) => a.getAttribute('href') || '')
      );

      // Zorunlu hizmet rotaları
      for (const rotaKey of ['ihtida', 'cenaze', 'konsolosluk', 'uyelik']) {
        const canonical = kanonikYollar[rotaKey][lang];
        const canonicalClean = canonical.replace(/\/$/, '');
        const matched = allLinks.some((h) => h.replace(/\/$/, '') === canonicalClean);
        expect(matched, `Zorunlu hizmet rotası [${rotaKey}] (${canonical}) bulunamadı`).toBe(true);
      }

      // Ek erişilebilir linkler: Kurs + veli portal + kadın irşat + ilk ziyaret adab + hakkımızda + iletişim + donation
      for (const rotaKey of ['veli', 'irsat', 'adab', 'hakkimizda', 'iletisim', 'bagis']) {
        const canonical = kanonikYollar[rotaKey][lang];
        const canonicalClean = canonical.replace(/\/$/, '');
        const matched = allLinks.some((h) => h.replace(/\/$/, '') === canonicalClean);
        expect(matched, `Erişilebilir bağlantı [${rotaKey}] (${canonical}) bulunamadı`).toBe(true);
      }

      // Veli portalı kontrolü (veli-portali veya portal)
      const veliMatched = allLinks.some((h) =>
        h.includes('veli-portal') || h.includes('portail-parents') || h.includes('parents-portal') || h.includes('portal')
      );
      expect(veliMatched, 'Veli portalı bağlantısı bulunamadı').toBe(true);

      const expectedRegistration = `https://www.ulucamii.be/kayit/${lang === 'tr' ? '' : `${lang}/`}`;
      await expect(secHaftalik.locator('.ana-akis-dugme-birincil')).toHaveAttribute('href', expectedRegistration);
      await expect(page.locator(`.ana-hizli a[href="${kanonikYollar.kurankursu[lang]}"]`)).toBeVisible();
      await expect(secZiyaret.locator('.ana-akis-ziyaret-adres')).toContainText(siteConfig.adres.sokak);
      await expect(secZiyaret.locator('.ana-akis-ziyaret-adres')).toContainText(siteConfig.adres.posta);
      await expect(secZiyaret.locator('a[href*="maps/dir"]')).toHaveAttribute('href',
        `https://www.google.com/maps/dir/?api=1&destination=${gpsData.enlem},${gpsData.boylam}`);

      // Generic href prefix: Site içi bağlantılar geçerli dil önekiyle (/tr/, /fr/, /en/ veya /kayit/) başlamalı
      const internalLinks = await akis.locator('a[href^="/"]').all();
      for (const link of internalLinks) {
        const href = await link.getAttribute('href');
        if (
          href &&
          !href.startsWith('/media') &&
          !href.startsWith('/admin') &&
          !href.startsWith('/fonts') &&
          !href.startsWith('/belgeler')
        ) {
          expect(href, `Bağlantı geçerli dil önekini korumalı: ${href}`).toMatch(
            new RegExp(`^(/${lang}(/|$)|/kayit(/${lang})?(/|$))`)
          );
        }
      }

      // Dokunma hedefi: Birincil eylem bağlantıları ve düğmeler min 44px
      const primaryActionLinks = await akis
        .locator('.ana-akis-dugme, .ana-akis-tumu-link, .ana-akis-ek-link, .ana-akis-link-listesi a')
        .all();
      for (const link of primaryActionLinks) {
        if (await link.isVisible()) {
          const box = await link.boundingBox();
          if (box) {
            expect(box.height, `Dokunma hedefi min 44px olmalı: ${await link.innerText()}`).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test(`${lang}: haftalık kısa takvim site.yaml program verisini korur ve gün indeksleri geçerlidir`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);

      const haftaKompakt = page.locator('#haftalik-yasam .hafta-kompakt, .hafta-kompakt').first();
      await expect(haftaKompakt).toBeVisible();

      // Özel program günleri: li[data-program-gun=1..7]
      const programItems = haftaKompakt.locator('li[data-program-gun]');
      const count = await programItems.count();
      expect(count, 'Özel program günleri listelenmeli').toBeGreaterThan(0);

      const programGunleri = [];
      for (let i = 0; i < count; i++) {
        const item = programItems.nth(i);
        const gunAttr = await item.getAttribute('data-program-gun');
        expect(gunAttr).toBeTruthy();
        const gun = parseInt(gunAttr, 10);
        expect(gun, `data-program-gun (${gun}) 1 ile 7 arasında olmalı`).toBeGreaterThanOrEqual(1);
        expect(gun, `data-program-gun (${gun}) 1 ile 7 arasında olmalı`).toBeLessThanOrEqual(7);
        expect(gun, 'data-program-gun 0 olamaz').not.toBe(0);
        expect(programGunleri.includes(gun), `data-program-gun=${gun} benzersiz olmalı`).toBe(false);
        programGunleri.push(gun);
      }

      // Gerçek site verisi (site.yaml -> haftalikProgram) ile karşılaştır
      const takvimMetni = await haftaKompakt.innerText();
      const icerikDil = lang === 'en' ? 'fr' : lang;

      for (const prog of haftalikProgramData) {
        const baslik = prog.baslik[icerikDil];
        const saat = prog.saat[icerikDil];
        expect(takvimMetni, `Program başlığı (${baslik}) takvimde yer almalı`).toContain(baslik);
        expect(takvimMetni, `Program saati (${saat}) takvimde yer almalı`).toContain(saat);
      }
    });

    test(`${lang}: bağış details klavyeyle açılır, IBAN kopyalama ve clipboard-denied aria-live uyarısı`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);

      const details = page.locator('.bagis-kompakt details[data-bagis-detay], details[data-bagis-detay]').first();
      await expect(details).toBeVisible();

      // 1. Başlangıçta varsayılan kapalı olmalı
      await expect(details).not.toHaveAttribute('open');

      // 2. summary klavye Enter ile açılır
      const summary = details.locator('summary');
      await expect(summary).toBeVisible();
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(details).toHaveAttribute('open', '');

      // 3. Açılınca QR SVG ve IBAN butonu görünür
      const qrSvg = details.locator('svg').first();
      await expect(qrSvg).toBeVisible();
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        const result = await new AxeBuilder({page}).include('.bagis-kompakt')
          .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
        expect(result.violations.filter(v => ['serious','critical'].includes(v.impact))
          .map(v => ({id:v.id, targets:v.nodes.map(n=>n.target)})), `Açık banka bölümü ${theme}`).toEqual([]);
      }

      const ibanBtn = details.locator('.iban-kopyala[data-iban]');
      await expect(ibanBtn).toBeVisible();

      const dataIban = await ibanBtn.getAttribute('data-iban');
      expect(dataIban).toBeTruthy();
      const expectedCleanIban = bankaData.iban.replace(/\s+/g, '');
      expect(dataIban.replace(/\s+/g, '')).toBe(expectedCleanIban);

      // 4. Başarılı kopyalama (clipboard writeText taklidi)
      await page.evaluate(() => {
        window.__kopyalananMetin = null;
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: async (metin) => {
              window.__kopyalananMetin = metin;
              return Promise.resolve();
            },
            readText: async () => window.__kopyalananMetin,
          },
          configurable: true,
          writable: true,
        });
      });

      await ibanBtn.click();
      const kopyalanan = await page.evaluate(() => window.__kopyalananMetin);
      expect(kopyalanan).toBe(dataIban);

      // 5. Kopyalama engellendiğinde (denied clipboard) aria-live geri bildirimi
      await page.evaluate(() => {
        window.__kopyalananMetin = null;
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: async () => {
              throw new DOMException('Permission denied', 'NotAllowedError');
            },
          },
          configurable: true,
          writable: true,
        });
      });

      await ibanBtn.click();

      // Denied durumunda canlı bölgede (aria-live) kullanıcıya bildirim verilmeli
      const ariaLiveUyarisi = details.locator('.kopyala-durum[aria-live="polite"]');
      const expectedError = await ibanBtn.getAttribute('data-hata');
      expect(expectedError).toBeTruthy();
      await expect(ariaLiveUyarisi).toHaveText(expectedError);
      expect(await page.evaluate(() => window.__kopyalananMetin)).toBeNull();
    });
  });
}
