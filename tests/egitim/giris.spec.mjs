/**
 * egitim.ulucamii.be Faz 1f (27 Eyl 2026) — Ezber Kilimi girişi beş dilde. Dış ağ kesik (ses ulucamii.be'den gelir;
 * oynatma sahte `play` ile sınanır). Neden: panonun 81 maddesi listeye bağlanmalı, telefonda katlı liste bağlantıyla
 * açılmalı, klavye tek sekme durağıyla gezebilmeli; çal düğmesi yalnız sesi olan 27 maddede olmalı ve aynı anda tek ses
 * çalmalı; iletişimde yalnız cami hattı; açık/koyu temada erişilebilirlik ve telefon genişliğinde yatay taşma yok.
 * Önizleme sunucusu Hosting'in güvenlik başlıklarını (firebase.json: CSP…) da gönderir: bütün testler gerçek CSP
 * altında koşar; ihlal canlıda sayfayı sessizce bozacağından ayrıca sayılır.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

// Onaylı adlar (src/lib/ezber/metinler.ts KILIM_METINLERI.baslik; modül JSON içe aktardığından burada yazılı).
const BASLIK = { tr: 'Ezber Kilimi', fr: 'Kilim de mémorisation', en: 'Memorisation kilim', nl: 'Memorisatiekelim', de: 'Memorier-Kelim' };

const oku = (yol) => JSON.parse(readFileSync(new URL(yol, import.meta.url), 'utf8'));
const katalog = oku('../../src/data/ezber/katalog.json');
const kimlik = oku('../../src/data/kurumsal-kimlik.json');
const cami = kimlik.iletisim.telefonlar.find((t) => t.kimlik === 'cami');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SESLI = katalog.ogeler.filter((o) => o.ses).map((o) => `m-${o.id}`).sort();
const KOK = 'http://127.0.0.1:4402';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__sesler = [];
    HTMLMediaElement.prototype.play = function () {
      window.__ses = this;
      window.__sesler.push(this.src);
      return window.__sesHata ? Promise.reject(Object.assign(new Error('çevrim dışı'), { name: 'NotAllowedError' })) : Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
  });
});

const listeleriAc = (page) => page.evaluate(() => document.querySelectorAll('details.serit-liste').forEach((d) => { d.open = true; }));
const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const dil of DILLER) {
  test(`${dil}: pano, şeritler, iletişim ve dil seçici`, async ({ page }) => {
    await page.goto(`/${dil}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${dil}`));
    await expect(page.locator('main h1')).toHaveText(BASLIK[dil]);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(6);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://egitim.ulucamii.be/${dil}/`);
    await expect(page.locator('.pano .karo.madde')).toHaveCount(81);
    await expect(page.locator('.pano .karo.bordur-karo')).toHaveCount(33);
    await expect(page.locator('.pano .karo.kose')).toHaveCount(4);
    await expect(page.locator('.pano .karo.madde[tabindex="0"]')).toHaveCount(1);
    await expect(page.locator('.maddeler li[id^="m-"]')).toHaveCount(81);
    // Her pano karosu listede var olan bir maddeye bağlanır.
    const hedefler = await page.locator('.pano .karo.madde').evaluateAll((a) => a.map((x) => x.getAttribute('href').slice(1)));
    expect(new Set(hedefler).size).toBe(81);
    for (const id of hedefler) expect(await page.locator(`li#${id}`).count(), id).toBe(1);
    // Çal düğmesi yalnız sesi olan maddelerde; ses ana siteden.
    const sesliler = await page.locator('.maddeler li:has(> button.dinle)').evaluateAll((l) => l.map((x) => x.id).sort());
    expect(sesliler).toEqual(SESLI);
    for (const s of await page.locator('button.dinle').evaluateAll((b) => b.flatMap((x) => x.dataset.ses.split(' ')))) {
      expect(s).toMatch(/^https:\/\/ulucamii\.be\/media\/ses\/[\w/.-]+\.mp3$/);
    }
    // İletişim: yalnız cami hattı ve info@; WhatsApp bağlantısı yok.
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(1);
    await expect(page.locator('a[href^="tel:"]')).toHaveAttribute('href', `tel:${cami.e164}`);
    await expect(page.locator('a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:info@ulucamii.be');
    expect(await page.content()).not.toMatch(/wa\.me|gmail/i);
    // Dil seçici: beş dil, bulunulan işaretli; ana siteye dönüş aynı dilde.
    await expect(page.locator('.diller a')).toHaveCount(5);
    await expect(page.locator('.diller a[aria-current="true"]')).toHaveAttribute('href', `/${dil}/`);
    await expect(page.locator(`.alt a[href="https://ulucamii.be/${dil}/"]`)).toHaveCount(1);
    expect(await tasmaYok(page)).toBe(true);
    // Fransız tipografisi yalnız FR sayfada ve bütün metinde (ortak katalog adları dahil; src/middleware.ts).
    const metin = await page.evaluate(() => document.body.textContent);
    if (dil === 'fr') {
      expect(metin).not.toMatch(/ [:;!?]/);
      expect(metin).toMatch(/ :/);
      expect(metin).toMatch(/ [;!?]/);
    } else expect(metin).not.toMatch(/ /);
  });

  test(`${dil}: çal düğmesi tek ses çalar, parçaları sırayla çalar, hatayı söyler`, async ({ page }) => {
    await page.goto(`/${dil}/`);
    await listeleriAc(page);
    const dugmeler = page.locator('button.dinle');
    const [ilk, ikinci] = [dugmeler.nth(1), dugmeler.nth(2)];
    const etiket = async (d, ad) => d.getAttribute(`data-etiket-${ad}`);
    await ilk.click();
    await expect(ilk).toHaveAttribute('data-caliyor', '');
    await expect(ilk).toHaveAttribute('aria-label', await etiket(ilk, 'durdur'));
    expect(await page.evaluate(() => window.__sesler.at(-1))).toBe((await ilk.getAttribute('data-ses')).split(' ')[0]);
    await ikinci.click();
    await expect(ilk).not.toHaveAttribute('data-caliyor');
    await expect(ilk).toHaveAttribute('aria-label', await etiket(ilk, 'dinle'));
    await expect(ikinci).toHaveAttribute('data-caliyor', '');
    await ikinci.click();
    await expect(ikinci).not.toHaveAttribute('data-caliyor');
    // Eûzü–Besmele iki parça: biri bitince öteki başlar, ikisi bitince düğme durur.
    const parcali = page.locator('#m-d-euzu-besmele button.dinle');
    await parcali.click();
    expect(await page.evaluate(() => new URL(window.__sesler.at(-1)).pathname)).toBe('/media/ses/ayet/1-0.mp3');
    await page.evaluate(() => window.__ses.dispatchEvent(new Event('ended')));
    expect(await page.evaluate(() => new URL(window.__sesler.at(-1)).pathname)).toBe('/media/ses/ayet/1-1.mp3');
    await expect(parcali).toHaveAttribute('data-caliyor', '');
    await page.evaluate(() => window.__ses.dispatchEvent(new Event('ended')));
    await expect(parcali).not.toHaveAttribute('data-caliyor');
    // Ses açılamazsa durum satırı sayfa dilinde söyler, düğme durur.
    await page.evaluate(() => { window.__sesHata = true; });
    await ilk.click();
    const durum = page.locator('[data-ses-durumu]');
    await expect(durum).toHaveText(await durum.getAttribute('data-hata'));
    await expect(ilk).not.toHaveAttribute('data-caliyor');
  });

  test(`${dil}: klavyeyle pano gezilir, karo ve «başla» listedeki maddeyi açar`, async ({ page }) => {
    await page.goto(`/${dil}/`);
    const karolar = page.locator('.pano .karo.madde');
    const odak = () => page.evaluate(() => {
      const k = document.activeElement;
      return { id: k.getAttribute('href'), r: Number(k.dataset.r), c: Number(k.dataset.c) };
    });
    await karolar.first().focus();
    await expect(page.locator('[data-kusak] b')).toHaveText(await karolar.first().getAttribute('data-ad'));
    await page.keyboard.press('ArrowRight');
    expect((await odak()).id).toBe(await karolar.nth(1).getAttribute('href'));
    await expect(karolar.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(karolar.first()).toHaveAttribute('tabindex', '-1');
    const once = await odak();
    await page.keyboard.press('ArrowDown');
    const sonra = await odak();
    expect(sonra.r).toBe(once.r + 1);
    await page.keyboard.press('End');
    expect((await odak()).id).toBe(await karolar.last().getAttribute('href'));
    await page.keyboard.press('Home');
    expect((await odak()).id).toBe(await karolar.first().getAttribute('href'));
    // Kenar suyu karosu: Enter listeye götürür; telefonda katlı liste açılır.
    const kenar = page.locator('.pano .karo.madde.r1').first();
    const hedef = (await kenar.getAttribute('href')).slice(1);
    await kenar.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`#${hedef}$`));
    await expect(page.locator(`li#${hedef}`)).toBeInViewport();
    expect(await page.locator(`li#${hedef}`).evaluate((li) => li.closest('details').open)).toBe(true);
    // «Fâtiha ile başla» Fâtiha maddesine götürür.
    await page.locator('.giris a.dugme.birincil').click();
    await expect(page).toHaveURL(/#m-s-fatiha$/);
    await expect(page.locator('li#m-s-fatiha')).toBeInViewport();
    // Kuşak, panodan çıkınca özete döner.
    await page.locator('main h1').focus();
    await expect(page.locator('[data-kusak] .kusak-ek')).toContainText('·');
  });

  test(`${dil}: açık/koyu temada erişilebilir, taşma yok`, async ({ page }) => {
    await page.goto(`/${dil}/`);
    await listeleriAc(page);
    for (const tema of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: tema, reducedMotion: 'reduce' });
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
      await page.evaluate(() => { for (const a of document.getAnimations()) if (Number.isFinite(a.effect?.getComputedTiming().endTime)) a.finish(); });
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, tema, nodes: v.nodes.slice(0, 5).map((n) => n.target) }))).toEqual([]);
      expect(await tasmaYok(page)).toBe(true);
    }
  });
}

test('Telefonda şerit listeleri katlı başlar, geniş ekranda açık; azaltılmış harekette sır anında', async ({ page }, info) => {
  await page.goto('/tr/');
  const acik = await page.locator('details.serit-liste').evaluateAll((d) => d.map((x) => x.open));
  expect(acik.length).toBe(9);
  expect(acik.every((x) => x === (info.project.name === 'masaustu-chromium'))).toBe(true);
  const sure = await page.locator('.pano .karo.madde').first().evaluate((k) => getComputedStyle(k, '::after').transitionDuration);
  expect(sure).toBe('0.001s');
});

test('Kök adres: kayıtlı dil, sonra tarayıcı dili, yoksa İngilizce', async ({ browser }, info) => {
  test.skip(info.project.name !== 'masaustu-chromium', 'yönlendirme mantığı cihazdan bağımsız');
  const dene = async (locale, onceki) => {
    const context = await browser.newContext({ locale, baseURL: KOK });
    await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    const page = await context.newPage();
    if (onceki) await page.goto(onceki);
    await page.goto('/');
    await page.waitForURL(/\/(tr|fr|en|nl|de)\/$/);
    const yol = new URL(page.url()).pathname;
    await context.close();
    return yol;
  };
  expect(await dene('fr-BE')).toBe('/fr/');
  expect(await dene('nl-BE')).toBe('/nl/');
  expect(await dene('es-ES')).toBe('/en/');
  expect(await dene('fr-BE', '/de/')).toBe('/de/');
});

test('Hosting güvenlik başlıkları: beş dil ve 404 CSP ihlalsiz; ses adresi media-src içinde', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'masaustu-chromium', 'başlıklar cihazdan bağımsız');
  await context.addInitScript(() => {
    window.__ihlaller = [];
    addEventListener('securitypolicyviolation', (e) => window.__ihlaller.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  const yanit = await page.goto('/tr/');
  const basliklar = yanit.headers();
  expect(basliklar['content-security-policy']).toContain("default-src 'none'; script-src 'self'; style-src 'self'");
  expect(basliklar['x-content-type-options']).toBe('nosniff');
  expect(basliklar['x-frame-options']).toBe('DENY');
  for (const yol of ['/tr/', '/fr/', '/en/', '/nl/', '/de/', '/boyle-bir-sayfa-yok/']) {
    await page.goto(yol);
    await page.evaluate(() => document.fonts.ready);
    const karo = page.locator('.pano .karo.madde').first();
    if (await karo.count()) await karo.hover(); // kuşak betiği de çalışsın (404'te pano yok)
    expect(await page.evaluate(() => window.__ihlaller), yol).toEqual([]);
  }
  // Ses yüklemesi: ana sitedeki kayıt media-src'ye uyar (istek testte yine kesilir); başka köken engellenir.
  await page.goto('/tr/');
  const ses = (await page.locator('button.dinle').first().getAttribute('data-ses')).split(' ')[0];
  const yabanci = 'https://example.com/ses.mp3';
  const ihlal = await page.evaluate(async (adresler) => {
    const sonuc = {};
    for (const adres of adresler) {
      window.__ihlaller = [];
      const a = new Audio();
      a.preload = 'auto';
      await new Promise((bitti) => { a.addEventListener('error', bitti, { once: true }); setTimeout(bitti, 3000); a.src = adres; a.load(); });
      await new Promise((r) => setTimeout(r, 150));
      sonuc[adres] = window.__ihlaller.filter((x) => x.startsWith('media-src')).length;
    }
    return sonuc;
  }, [ses, yabanci]);
  expect(ihlal[ses]).toBe(0);
  expect(ihlal[yabanci]).toBeGreaterThan(0);
});

test('Bulunamayan sayfa beş dilde girişe yol gösterir', async ({ page }) => {
  const yanit = await page.goto('/boyle-bir-sayfa-yok/');
  expect(yanit.status()).toBe(404);
  await expect(page.locator('.dil-yollari a')).toHaveCount(5);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await tasmaYok(page)).toBe(true);
});
