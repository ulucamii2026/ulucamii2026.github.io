/** Dinleme sayfaları (/e/<kod>/) — tarayıcı testleri (21 Eylül 2026).
 *
 *  Sayfa tamamen yereldir: dış istek yoktur, sesler `public/media/ses/` altındaki resmî Diyanet
 *  kayıtlarıdır. Gerçek ses çözücüsüne bağlı kalmamak için `HTMLMediaElement.prototype.play`
 *  taklit edilir; hangi dosyanın hangi hızla istendiği kaydedilir. «Répéter» ve «Lecture continue»
 *  senaryolarında taklit kısa bir gecikmeyle `ended` olayını da ateşler, böylece zincir gerçekten
 *  ilerler. Sözleşme: docs/DINLEME-SAYFALARI.md
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { EC_METIN, EC_TEKRAR_SAYISI, ecParcaAdi } from '../../src/lib/ecouter.ts';

const VERI = JSON.parse(readFileSync(new URL('../../src/data/ecouter.json', import.meta.url), 'utf8'));
const KODLAR = VERI.kodlar;
const FATIHA = KODLAR.fatiha;
const FATHA = KODLAR.fatha;
const YONLENDIRME = KODLAR.test;
const SESLI_KARELER = (FATHA.ogeler ?? []).filter((o) => o.ses);

/* ---------- ortak yardımcılar ---------- */

/** Çalar taklidi. `bitir` açıkken her klip kısa sürede `ended` verir (tekrar/zincir senaryoları). */
async function calarTaklidi(page, { bitir = false, sure = 0.05 } = {}) {
  await page.addInitScript(({ bitir, sure }) => {
    window.__calinan = [];
    window.__hiz = [];
    Object.defineProperty(HTMLMediaElement.prototype, 'duration', { get() { return sure; }, configurable: true });
    HTMLMediaElement.prototype.play = function play() {
      window.__calinan.push(this.src);
      window.__hiz.push(this.playbackRate);
      if (bitir) setTimeout(() => this.dispatchEvent(new Event('ended')), 15);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {};
  }, { bitir, sure });
}

const calinanlar = (page) => page.evaluate(() => window.__calinan.map((u) => new URL(u).pathname));

async function sayfayiAc(page, kod) {
  await page.goto(`/e/${kod}/`);
  await expect(page.locator('.ec-sayfa')).toBeVisible();
}

async function sonluAnimasyonlariBekle(page) {
  await page.evaluate(async () => {
    const liste = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(liste.map((a) => a.finished.catch(() => {})));
  });
}

async function ciddiAxe(page, kapsamlar) {
  let olcum = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  for (const kapsam of kapsamlar) olcum = olcum.include(kapsam);
  const sonuc = await olcum.analyze();
  return sonuc.violations.filter((v) => ['serious', 'critical'].includes(v.impact))
    .map((v) => ({ id: v.id, hedefler: v.nodes.map((n) => n.target) }));
}

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => new URL(route.request().url()).origin === 'http://127.0.0.1:4401'
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

/* ---------- 1. Üç örnek kod ---------- */

for (const kod of ['fatiha', 'fatha']) {
  test(`${kod}: sayfa Fransızca, arama motoruna kapalı ve künyeli açılır`, async ({ page }) => {
    const icerik = KODLAR[kod];
    await calarTaklidi(page);
    await sayfayiAc(page, kod);

    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toHaveText(icerik.baslik);
    await expect(page.locator('html')).toHaveAttribute('lang', /^fr/);
    // Kitaptan gelen sayfa dizine girmez ve kanonik adres bildirmez.
    expect(await page.evaluate(() => document.querySelector('meta[name="robots"]')?.content ?? '')).toContain('noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    // Künye: ses kaynağı + cami adı.
    await expect(page.locator('.ec-kaynak')).toContainText(icerik.kaynak);
    await expect(page.locator('.ec-kaynak')).toContainText(EC_METIN.kurum);
    // Sitenin normal başlığı ve alt bilgisi yerinde (sayfa markalı görünsün).
    await expect(page.locator('header.vt-baslik, .vt-baslik').first()).toBeVisible();
    await expect(page.locator('footer.vt-altbilgi')).toBeVisible();
    // Bütün sesler YEREL Diyanet kayıtlarıdır: dış barındırıcı yok (AGENTS.md kalıcı kuralı).
    const sesYollari = await page.locator('[data-ses]').evaluateAll((liste) => liste.map((e) => e.getAttribute('data-ses')));
    expect(sesYollari.length).toBeGreaterThan(0);
    expect(sesYollari.every((y) => y.startsWith('/media/ses/')), sesYollari.join(' ')).toBe(true);
  });
}

test('Dinleme sayfaları site haritasına girmez', async ({ page }) => {
  const indeks = await (await page.request.get('/sitemap-index.xml')).text();
  const dosyalar = [...indeks.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(dosyalar.length).toBeGreaterThan(0);
  for (const dosya of dosyalar) {
    const govde = await (await page.request.get(dosya)).text();
    expect(govde, `${dosya} içinde /e/ yok`).not.toContain('ulucamii.be/e/');
  }
});

/* ---------- 2. Sûre sayfası: büyük düğme ve satırlar ---------- */

test('Fâtiha: büyük çal düğmesi durur/başlar, satırlar Arapça–okunuş–anlam taşır', async ({ page }) => {
  await calarTaklidi(page);
  await sayfayiAc(page, 'fatiha');

  // Ses gerçekten yerinde (yerel Diyanet kaydı).
  const tam = page.locator('button[data-ec-tam]');
  await expect(tam).toHaveAttribute('data-ses', FATIHA.tam.ses);
  expect(await page.evaluate(async (y) => (await fetch(y)).status, FATIHA.tam.ses)).toBe(200);
  await expect(tam).toHaveText(FATIHA.tam.etiket);

  // Satırlar: yedi âyet, her biri Arapça + çeviri yazı + Fransızca anlam.
  const satirlar = page.locator('.ec-satir');
  await expect(satirlar).toHaveCount(FATIHA.satirlar.length);
  const ilk = satirlar.first();
  await expect(ilk.locator('.ec-ar')).toHaveAttribute('lang', 'ar');
  await expect(ilk.locator('.ec-ar')).toHaveAttribute('dir', 'rtl');
  await expect(ilk.locator('.ec-okunus')).toHaveText(FATIHA.satirlar[0].okunus);
  await expect(ilk.locator('.ec-fr')).toHaveText(FATIHA.satirlar[0].fr);
  await expect(ilk.locator('.ec-no')).toHaveText('1');
  // Kur'an işaretlerini taşımayan alt küme yazı tipi bu sayfada KULLANILMAZ.
  expect(await ilk.locator('.ec-ar').evaluate((e) => getComputedStyle(e).fontFamily)).toContain('Amiri');
  await expect(page.locator('.arabic-ana')).toHaveCount(0);

  // Âyet âyet ses: her satırın kendi çal düğmesi var, hepsi aynı resmî kayıttan ve yerelde duruyor.
  expect(FATIHA.satirlar.every((s) => s.ses?.startsWith('/media/ses/ayet/1-'))).toBe(true);
  const satirDugmeleri = page.locator('.ec-satir button[data-ec-cal]');
  await expect(satirDugmeleri).toHaveCount(FATIHA.satirlar.length);
  await expect(satirDugmeleri.nth(1)).toHaveAttribute('data-ses', FATIHA.satirlar[1].ses);
  for (const s of FATIHA.satirlar) expect(await page.evaluate(async (y) => (await fetch(y)).status, s.ses)).toBe(200);
  await expect(page.locator('button[data-ec-zincir]')).toHaveCount(1);
  await satirDugmeleri.nth(2).click();
  await expect(satirDugmeleri.nth(2)).toHaveAttribute('aria-pressed', 'true');
  expect((await calinanlar(page)).at(-1)).toBe(FATIHA.satirlar[2].ses);
  await satirDugmeleri.nth(2).click();
  await expect(satirDugmeleri.nth(2)).toHaveAttribute('aria-pressed', 'false');

  // Çal/duraklat: etiket DEĞİŞMEZ (düzen kaymaz), durumu aria-pressed ve simge taşır.
  // (Satır düğmesi sayfayı kaydırdı: ölçümden önce düğmeyi görünür alana getir; kayma değil BOYUT karşılaştırılır.)
  await tam.scrollIntoViewIfNeeded();
  const boyut = async () => { const k = await tam.boundingBox(); return { en: k.width, boy: k.height, x: k.x }; };
  const once = await boyut();
  await tam.click();
  await expect(tam).toHaveAttribute('aria-pressed', 'true');
  expect((await calinanlar(page)).at(-1)).toBe(FATIHA.tam.ses);
  await expect(tam).toHaveText(FATIHA.tam.etiket);
  expect(await boyut()).toEqual(once);
  await tam.click();
  await expect(tam).toHaveAttribute('aria-pressed', 'false');

  // İlerleme göstergesi yerinde ve ekran okuyucudan gizli (metin zaten düğmede).
  await expect(page.locator('.ec-ilerleme')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-ec-gecen]')).toHaveText(EC_METIN.sureSifir);
});

test('Satır sesi olmayan metin (Sübhâneke) yalnız büyük düğmeyle çalışır; âyet bölümlerine âyet sesi bağlanmaz', async ({ page }) => {
  await calarTaklidi(page);
  const SUBHANEKE = KODLAR.subhaneke;
  expect(SUBHANEKE.satirlar.every((s) => !s.ses)).toBe(true);
  await sayfayiAc(page, 'subhaneke');
  await expect(page.locator('.ec-satir')).toHaveCount(SUBHANEKE.satirlar.length);
  await expect(page.locator('.ec-satir button[data-ec-cal]')).toHaveCount(0);
  await expect(page.locator('button[data-ec-zincir]')).toHaveCount(0);
  const tam = page.locator('button[data-ec-tam]');
  await expect(tam).toHaveAttribute('data-ses', SUBHANEKE.tam.ses);
  expect(await page.evaluate(async (y) => (await fetch(y)).status, SUBHANEKE.tam.ses)).toBe(200);

  // 21 Eyl 2026 kusurunun bekçisi: satır numarası yalnız TAM SÛREDE âyet numarasıdır. Âyetü'l-Kürsî tek âyetin dokuz
  // bölümüdür; bölümlerine «2-1.mp3» (Bakara 1) gibi bir âyet sesi bağlanamaz.
  for (const [kod, k] of Object.entries(KODLAR)) {
    for (const s of k.satirlar ?? []) {
      if (!s.ses) continue;
      expect(s.ses, `${kod} satır ${s.no}`).toMatch(new RegExp(`^/media/ses/ayet/\\d+-${s.no}\\.mp3$`));
    }
  }
  expect(KODLAR['ayetel-kursi'].satirlar.every((s) => !s.ses)).toBe(true);
});

/* ---------- 3. Kare ızgara: tek dokunuşla çalma ---------- */

test('Elifbâ kareleri: dokunuş sesi çalar, ikinci dokunuş durdurur, öteki kare devralır', async ({ page }) => {
  await calarTaklidi(page);
  await sayfayiAc(page, 'fatha');

  const kareler = page.locator('.ec-izgara .ec-kare');
  await expect(kareler).toHaveCount(FATHA.ogeler.length);
  const dugmeler = page.locator('.ec-izgara button[data-ec-cal]');
  await expect(dugmeler).toHaveCount(SESLI_KARELER.length);
  // Gizli ad çeviri yazıdan üretilir: «Écouter ba».
  await expect(dugmeler.first()).toHaveAccessibleName(new RegExp(ecParcaAdi(SESLI_KARELER[0], 1, true)));

  const birinci = dugmeler.first();
  const ikinci = dugmeler.nth(1);
  await birinci.click();
  await expect(birinci).toHaveAttribute('aria-pressed', 'true');
  await expect(kareler.first()).toHaveAttribute('aria-current', 'true');
  await expect(kareler.first()).toHaveAttribute('data-caliyor', '1');
  expect((await calinanlar(page)).at(-1)).toBe(SESLI_KARELER[0].ses);

  // İkinci dokunuş yalnız durdurur.
  await birinci.click();
  await expect(birinci).toHaveAttribute('aria-pressed', 'false');
  await expect(kareler.first()).not.toHaveAttribute('aria-current', 'true');

  // Başka kareye dokunmak öncekini kapatır: iki ses üst üste binmez.
  await birinci.click();
  await ikinci.click();
  await expect(birinci).toHaveAttribute('aria-pressed', 'false');
  await expect(ikinci).toHaveAttribute('aria-pressed', 'true');
  expect((await calinanlar(page)).at(-1)).toBe(SESLI_KARELER[1].ses);

  // Klavye: düğmeler gerçek <button>, boşluk tuşu çalıştırır.
  await ikinci.click();                                   // durdur
  await birinci.focus();
  await page.keyboard.press('Space');
  await expect(birinci).toHaveAttribute('aria-pressed', 'true');
});

/* ---------- 4. Hız ve tekrar tercihleri ---------- */

test('Hız ve «Répéter» tercihleri kaydedilir ve yeniden açılışta geri gelir', async ({ page }) => {
  await calarTaklidi(page);
  await sayfayiAc(page, 'fatha');

  const yavas = page.locator('button[data-ec-hiz="0.75"]');
  const normal = page.locator('button[data-ec-hiz="1"]');
  const tekrar = page.locator('button[data-ec-tekrar]');
  await expect(normal).toHaveAttribute('aria-pressed', 'true');
  await expect(tekrar).toHaveAttribute('aria-pressed', 'false');

  await yavas.click();
  await expect(yavas).toHaveAttribute('aria-pressed', 'true');
  await expect(normal).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-ecouter]')).toHaveAttribute('data-hiz', '0.75');
  await tekrar.click();
  await expect(tekrar).toHaveAttribute('aria-pressed', 'true');

  // Seçilen hız gerçekten çalara uygulanır.
  await page.locator('.ec-izgara button[data-ec-cal]').first().click();
  expect(await page.evaluate(() => window.__hiz.at(-1))).toBe(0.75);

  // Tercihler yeniden açılışta korunur.
  await page.reload();
  await expect(page.locator('button[data-ec-hiz="0.75"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('button[data-ec-tekrar]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-ecouter]')).toHaveAttribute('data-hiz', '0.75');

  // Bozuk/kapalı depolama sayfayı çökertmez: varsayılana düşer.
  await page.evaluate(() => localStorage.setItem('ulucamii:ecouter:v1', '{bozuk'));
  await page.reload();
  await expect(page.locator('button[data-ec-hiz="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('button[data-ec-tekrar]')).toHaveAttribute('aria-pressed', 'false');
});

test('«Répéter» aynı parçayı üç kez çalar ve orada durur', async ({ page }) => {
  await calarTaklidi(page, { bitir: true });
  await sayfayiAc(page, 'fatha');
  await page.locator('button[data-ec-tekrar]').click();

  const hedef = SESLI_KARELER[0].ses;
  await page.locator('.ec-izgara button[data-ec-cal]').first().click();
  await expect.poll(async () => (await calinanlar(page)).length, { timeout: 8000 }).toBe(EC_TEKRAR_SAYISI);
  expect(await calinanlar(page)).toEqual(Array(EC_TEKRAR_SAYISI).fill(hedef));

  // Üçüncüden sonra durur: dördüncü çalma olmaz, düğme normale döner.
  await expect(page.locator('.ec-izgara button[data-ec-cal]').first()).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(1200);
  expect(await calinanlar(page)).toHaveLength(EC_TEKRAR_SAYISI);
});

test('«Lecture continue» parçaları sırayla çalar ve çalan kareyi ekrana getirir', async ({ page }) => {
  await calarTaklidi(page, { bitir: true });
  await sayfayiAc(page, 'fatha');
  const zincir = page.locator('button[data-ec-zincir]');
  await zincir.click();
  await expect(zincir).toHaveAttribute('aria-pressed', 'true');

  await page.locator('.ec-izgara button[data-ec-cal]').first().click();
  await expect.poll(async () => (await calinanlar(page)).length, { timeout: 8000 }).toBeGreaterThanOrEqual(4);
  expect((await calinanlar(page)).slice(0, 4)).toEqual(SESLI_KARELER.slice(0, 4).map((o) => o.ses));

  // Zincir sonunda durur ve son çalan kare görünür kalır.
  await expect.poll(async () => (await calinanlar(page)).length, { timeout: 15000 }).toBe(SESLI_KARELER.length);
  const son = page.locator('.ec-izgara .ec-kare').last();
  await expect(son).toBeInViewport();
  await expect(page.locator('.ec-izgara .ec-kare[aria-current="true"]')).toHaveCount(0);
});

test('Ses açılamazsa sayfa Fransızca uyarı verir ve düğme normale döner', async ({ page }) => {
  await page.addInitScript(() => {
    window.__calinan = [];
    HTMLMediaElement.prototype.play = function play() { return Promise.reject(new Error('sınama')); };
    HTMLMediaElement.prototype.pause = function pause() {};
  });
  await sayfayiAc(page, 'fatha');
  const dugme = page.locator('.ec-izgara button[data-ec-cal]').first();
  await dugme.click();
  await expect(page.locator('[data-ec-durum]')).toHaveText(EC_METIN.hata);
  await expect(dugme).toHaveAttribute('aria-pressed', 'false');
});

/* ---------- 5. Yönlendirme kodu ---------- */

test('Yönlendirme kodu hem meta ile hem düğmeyle testin sayfasına götürür', async ({ page }) => {
  const ham = await (await page.request.get('/e/test/')).text();
  expect(ham).toContain(`content="0;url=${YONLENDIRME.yonlendir}"`);
  expect(ham).toContain('noindex');

  // Kartın kendisini görebilmek için yenileme etiketi çıkarılarak sunulur: gecikmesiz
  // yenilemeyi iptal etmek Chromium'da belgeyi boş bırakabiliyor (yarış), bu yol kararlı.
  await page.route('**/e/test/', async (route) => {
    const yanit = await route.fetch();
    const govde = (await yanit.text()).replace(/<meta http-equiv="refresh"[^>]*>/i, '');
    await route.fulfill({ response: yanit, body: govde });
  });
  await page.goto('/e/test/');
  const dugme = page.locator('.ec-yonlendir a.dugme');
  await expect(dugme).toHaveAttribute('href', YONLENDIRME.yonlendir);
  await expect(dugme).toHaveText(EC_METIN.yonlendirDugme);
  await expect(page.locator('main h1')).toHaveText(YONLENDIRME.baslik);
  await expect(page.locator('[data-ecouter]')).toHaveCount(0);

  // Etiket yerine konunca gerçekten yönlenir.
  await page.unroute('**/e/test/');
  await page.goto('/e/test/', { waitUntil: 'commit' }).catch(() => {});
  await expect(page).toHaveURL(/\/fr\/test-de-niveau\/$/, { timeout: 15_000 });
});

test('Bilinmeyen kod normal 404 verir', async ({ page }) => {
  const yanit = await page.request.get('/e/bilinmeyen-kod/');
  expect(yanit.status()).toBe(404);
});

/* ---------- 6. Erişilebilirlik, dar ekran ve koyu tema ---------- */

test('Dinleme sayfaları erişilebilir; 360 pikselde taşma yok; koyu tema temiz', async ({ page }, info) => {
  test.setTimeout(90_000);
  await calarTaklidi(page);

  for (const kod of ['fatiha', 'fatha']) {
    await sayfayiAc(page, kod);
    await sonluAnimasyonlariBekle(page);
    expect(await ciddiAxe(page, ['main']), `${kod} — açık tema`).toEqual([]);

    await page.emulateMedia({ colorScheme: 'dark' });
    await sonluAnimasyonlariBekle(page);
    expect(await ciddiAxe(page, ['main']), `${kod} — işletim sistemi koyu teması`).toEqual([]);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    await page.emulateMedia({ colorScheme: 'light' });
    await sonluAnimasyonlariBekle(page);
    expect(await ciddiAxe(page, ['main']), `${kod} — elle seçilen koyu tema`).toEqual([]);
    await page.locator('.ec-sayfa').screenshot({ path: info.outputPath(`ecouter-${kod}-koyu.png`) });

    await page.evaluate(() => { delete document.documentElement.dataset.theme; });
    await page.setViewportSize({ width: 360, height: 780 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${kod} — 360 px`).toBe(true);
    if (kod === 'fatha') {
      expect(await page.locator('.ec-izgara').evaluate((el) => el.scrollWidth <= el.clientWidth + 1), 'ızgara 360 px').toBe(true);
    }
    await page.locator('.ec-sayfa').screenshot({ path: info.outputPath(`ecouter-${kod}-360.png`) });
    await page.setViewportSize(info.project.use.viewport ?? { width: 1440, height: 1000 });
  }

  // Çalan durum da erişilebilir kalır.
  await sayfayiAc(page, 'fatha');
  await page.locator('.ec-izgara button[data-ec-cal]').first().click();
  await sonluAnimasyonlariBekle(page);
  expect(await ciddiAxe(page, ['main']), 'çalarken').toEqual([]);
});
