/** Sesli ders oynatıcısı (egitim.ulucamii.be/e/, /e/<kod>/) — ayrıntılı tarayıcı testleri.
 *
 *  Dilim 4 / P7 (11 Kasım 2026): ana sitedeki eski `/e/` dinleme testleri (tests/web/ecouter.spec.mjs) buraya taşındı; oynatıcı artık
 *  egitim'dedir. Sayfa egitim'in kendi derlemesidir (4402); sesler ulucamii.be/media/ses/ adresinden gelir (`data-ses-kok`), bu yüzden
 *  «dosya yerinde mi» denetimi depodaki public/media/ses dosyasına bakar. Gerçek ses çözücüsüne bağlı kalmamak için
 *  `HTMLMediaElement.prototype.play` taklit edilir; `bitir` açıkken her klip kısa sürede `ended` verir (tekrar/zincir senaryoları).
 *  Taşınmayanlar: ana sitede kalan eğitim rehberi/menüsü testleri (tests/web/ecouter.spec.mjs) ve beş dilli `/<dil>/audio/<kod>/`
 *  sayfaları (egitim'de yalnız Fransızca `/e/<kod>/` vardır; dil döngüsü yalnız `fr` ile koşar).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, existsSync } from 'node:fs';
import { EC_METIN, EC_TEKRAR_SAYISI, ecParcaAdi } from '../../src/lib/ecouter.ts';
import { EGITIM } from '../../src/i18n/egitim.ts';
import { DINLEME } from '../../src/i18n/dinleme.ts';

const KOK = 'http://127.0.0.1:4402';
const EGITIM_ADRES = 'https://egitim.ulucamii.be';
const VERI = JSON.parse(readFileSync(new URL('../../src/data/ecouter.json', import.meta.url), 'utf8'));
const KODLAR = VERI.kodlar;
const FATIHA = KODLAR.fatiha;
const FATHA = KODLAR.fatha;
const YONLENDIRME = KODLAR.test;
const SESLI_KARELER = (FATHA.ogeler ?? []).filter((o) => o.ses);
const DERS_SAYISI = Object.values(KODLAR).filter((c) => !c.yonlendir).length;
/** Sesin depodaki yeri (egitim'de ses dosyası yok: oynatıcı ulucamii.be'den çalar, dosya orada aynı yoldadır). */
const sesDosyaVar = (y) => existsSync(new URL(`../../public${y}`, import.meta.url));

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

/** Çalınan adreslerin yolu (kaynak: ulucamii.be; köken ayrıca denetlenir). */
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
  await context.route('**/*', (route) => new URL(route.request().url()).origin === KOK
    ? route.continue() : route.abort('blockedbyclient'));
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

/* ---------- 1. Üç örnek kod ---------- */

for (const kod of ['fatiha', 'fatha']) {
  test(`${kod}: sayfa Fransızca, herkese açık, künyeli; sesler resmî Diyanet kayıtları`, async ({ page }) => {
    const icerik = KODLAR[kod];
    await calarTaklidi(page);
    await sayfayiAc(page, kod);

    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toHaveText(icerik.baslik);
    await expect(page.locator('html')).toHaveAttribute('lang', /^fr/);
    expect(await page.evaluate(() => document.querySelector('meta[name="robots"]')?.content ?? '')).not.toContain('noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${EGITIM_ADRES}/e/${kod}/`);
    await expect(page.locator('.ec-geri a')).toHaveAttribute('href', '/e/');
    // Künye: ses kaynağı + cami adı.
    await expect(page.locator('.ec-kaynak')).toContainText(icerik.kaynak);
    await expect(page.locator('.ec-kaynak')).toContainText(EC_METIN.kurum);
    // Sitenin normal başlığı ve alt bilgisi yerinde (sayfa markalı görünsün).
    await expect(page.locator('header.ust').first()).toBeVisible();
    await expect(page.locator('footer.alt')).toBeVisible();
    // Bütün sesler resmî Diyanet kayıtlarıdır (yol /media/ses/…), oynatıcı bunları ulucamii.be kökünden ister; dış barındırıcı yok.
    const sesYollari = await page.locator('[data-ses]').evaluateAll((liste) => liste.map((e) => e.getAttribute('data-ses')));
    expect(sesYollari.length).toBeGreaterThan(0);
    expect(sesYollari.every((y) => y.startsWith('/media/ses/')), sesYollari.join(' ')).toBe(true);
    await expect(page.locator('[data-ecouter]')).toHaveAttribute('data-ses-kok', 'https://ulucamii.be');
  });
}

test('Bütün dersler egitim site haritasındadır; yönlendirme kodu dizine girmez', async ({ page }) => {
  const indeks = await (await page.request.get('/sitemap-index.xml')).text();
  const dosyalar = [...indeks.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(dosyalar.length).toBeGreaterThan(0);
  const govde = (await Promise.all(dosyalar.map(async (dosya) => (await page.request.get(dosya)).text()))).join('');
  expect(govde).toContain(`<loc>${EGITIM_ADRES}/e/</loc>`);
  for (const [kod, ders] of Object.entries(KODLAR)) {
    if (ders.yonlendir) expect(govde).not.toContain(`<loc>${EGITIM_ADRES}/e/${kod}/</loc>`);
    else expect(govde).toContain(`<loc>${EGITIM_ADRES}/e/${kod}/</loc>`);
  }
});

test('Ders dizini: bütün dersler, aksansız arama, boş sonuç ve geri dönüş', async ({ page }) => {
  await page.goto('/e/');
  const dersler = Object.entries(KODLAR).filter(([, c]) => !c.yonlendir);
  await expect(page.locator('[data-ec-cours]')).toHaveCount(dersler.length);
  const hrefs = await page.locator('[data-ec-cours] a').evaluateAll((a) => a.map((e) => e.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(dersler.length);
  for (const [kod] of dersler) expect(hrefs).toContain(`/e/${kod}/`);
  await page.getByLabel(EGITIM.fr.ara).fill('fatha');
  // Fatḥa hem temel derste hem uzatma başlıklarında geçer; tüm eşleşmeler kalır.
  await expect(page.locator('[data-ec-cours] a[href="/e/fatha/"]')).toBeVisible();
  await expect(page.locator('[data-ec-cours] a[href="/e/kasra/"]')).not.toBeVisible();
  await page.locator('[data-ec-cours] a[href="/e/fatha/"]').click();
  await expect(page).toHaveURL(/\/e\/fatha\/$/);
  await page.locator('.ec-geri a').click();
  await expect(page).toHaveURL(/\/e\/$/);
  await page.getByLabel(EGITIM.fr.ara).fill('zzzzzz');
  await expect(page.locator('[data-ec-vide]')).toBeVisible();
  await page.getByLabel(EGITIM.fr.ara).fill('');
  await expect(page.locator('[data-ec-cours]:visible')).toHaveCount(dersler.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await ciddiAxe(page, ['.ec-catalogue'])).toEqual([]);
});

test('Ders dizini JavaScript olmadan da bütün derslere bağlantı verir; sesler ulucamii.be adresli düz bağlantı', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route('**/*', (r) => r.request().url().startsWith(`${KOK}/`) ? r.continue() : r.abort());
  const page = await context.newPage();
  await page.goto(`${KOK}/e/`);
  await expect(page.locator('[data-ec-recherche]')).not.toBeVisible();
  await expect(page.locator('[data-ec-cours] a')).toHaveCount(DERS_SAYISI);
  await page.locator('[data-ec-cours] a[href="/e/fatha/"]').click();
  await expect(page.locator('.ec-noscript a')).toHaveCount(28);
  await expect(page.locator('.ec-noscript a').first()).toHaveAttribute('href', new RegExp(`^https://ulucamii\\.be/media/ses/.*\\?v=${VERI.surum}$`));
  await context.close();
});

/* ---------- 2. Sûre sayfası: büyük düğme ve satırlar ---------- */

test('Fâtiha: büyük çal düğmesi durur/başlar, satırlar Arapça–okunuş–anlam taşır', async ({ page }) => {
  await calarTaklidi(page);
  await sayfayiAc(page, 'fatiha');

  // Ses yerinde (depodaki resmî Diyanet kaydı; yayında ulucamii.be'den servis edilir).
  const tam = page.locator('button[data-ec-tam]');
  await expect(tam).toHaveAttribute('data-ses', FATIHA.tam.ses);
  expect(sesDosyaVar(FATIHA.tam.ses)).toBe(true);
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

  // Âyet âyet ses: her satırın kendi çal düğmesi var, hepsi aynı resmî kayıttan ve depoda duruyor.
  expect(FATIHA.satirlar.every((s) => s.ses?.startsWith('/media/ses/ayet/1-'))).toBe(true);
  const satirDugmeleri = page.locator('.ec-satir button[data-ec-cal]');
  await expect(satirDugmeleri).toHaveCount(FATIHA.satirlar.length);
  await expect(satirDugmeleri.nth(1)).toHaveAttribute('data-ses', FATIHA.satirlar[1].ses);
  for (const s of FATIHA.satirlar) expect(sesDosyaVar(s.ses), s.ses).toBe(true);
  await expect(page.locator('button[data-ec-zincir]')).toHaveCount(1);
  await satirDugmeleri.nth(2).click();
  await expect(satirDugmeleri.nth(2)).toHaveAttribute('aria-pressed', 'true');
  expect((await calinanlar(page)).at(-1)).toBe(FATIHA.satirlar[2].ses);
  // Ses ulucamii.be kökünden istenir (egitim'de dosya yok).
  expect(await page.evaluate(() => new URL(window.__calinan.at(-1)).origin)).toBe('https://ulucamii.be');
  await satirDugmeleri.nth(2).click();
  await expect(satirDugmeleri.nth(2)).toHaveAttribute('aria-pressed', 'false');

  // Çal/duraklat: etiket DEĞİŞMEZ (düzen kaymaz), durumu aria-pressed ve simge taşır.
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

test('Bölüm kaydı olmayan dua tek tam metin hücresinden dinlenir; âyet bölümlerine yanlış ses bağlanmaz', async ({ page }) => {
  await calarTaklidi(page);
  const SUBHANEKE = KODLAR.subhaneke;
  expect(SUBHANEKE.satirlar.every((s) => !s.ses)).toBe(true);
  await sayfayiAc(page, 'subhaneke');
  await expect(page.locator('.ec-satir')).toHaveCount(1);
  await expect(page.locator('.ec-satir button[data-ec-cal]')).toHaveCount(1);
  await page.locator('.ec-satir .ec-ar').click();
  expect((await calinanlar(page)).at(-1)).toBe(SUBHANEKE.tam.ses);
  await expect(page.locator('.ec-satir .ec-ar')).toHaveCSS('text-align', 'center');
  await expect(page.locator('button[data-ec-zincir]')).toHaveCount(0);
  const tam = page.locator('button[data-ec-tam]');
  await expect(tam).toHaveAttribute('data-ses', SUBHANEKE.tam.ses);
  expect(sesDosyaVar(SUBHANEKE.tam.ses)).toBe(true);

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

/* ---------- 3. Besmele, zincir, kare ızgara ---------- */

test('fr: bütün sûrelerde besmele bir kez görünür, âyet numaraları korunur', async ({ page }) => {
  test.setTimeout(120_000);
  await calarTaklidi(page);
  const kodlar = [...Object.keys(KODLAR).filter((k) => KODLAR[k].besmele), 'fatiha', 'e76'];
  for (const kod of kodlar) {
    await page.goto(`/e/${kod}/`);
    const veri = KODLAR[kod];
    const besmele = page.locator('[data-ec-besmele]');
    await expect(besmele).toHaveCount(veri.besmele ? 1 : 0);
    if (veri.besmele) {
      await expect(besmele.locator('button')).toHaveAccessibleName(DINLEME.fr.besmeleCal);
      await expect(besmele.locator('.ec-no')).toHaveCount(0);
      await expect(besmele.locator('.ec-ar')).toHaveCSS('text-align', 'center');
      await expect(page.locator('[data-ec-cal]').first()).toHaveAttribute('data-ses', '/media/ses/ayet/1-1.mp3');
    }
    if (veri.satirlar) {
      expect(await page.locator('.ec-no').allTextContents()).toEqual(veri.satirlar.map((s) => String(s.no)));
      await expect(page.locator('[data-ec-cal]')).toHaveCount(veri.satirlar.length + (veri.besmele ? 1 : 0));
    } else {
      await expect(page.locator('.ec-kare')).toHaveCount(veri.ogeler.length);
    }
  }
  await page.goto('/e/asr/');
  const bas = page.locator('[data-ec-besmele] button');
  await bas.focus();
  await page.keyboard.press('Space');
  expect(await calinanlar(page)).toEqual(['/media/ses/ayet/1-1.mp3']);
  await page.keyboard.press('Space');
  await expect(bas).toHaveAttribute('aria-pressed', 'false');
});

for (const kod of ['asr', 'e81']) {
  test(`${kod}: sıralı dinleme besmeleden ilk âyete geçer`, async ({ page }) => {
    await calarTaklidi(page, { bitir: true });
    await sayfayiAc(page, kod);
    await page.locator('[data-ec-zincir]').click();
    await page.locator('[data-ec-besmele] button').click();
    const parcalar = KODLAR[kod].satirlar ?? KODLAR[kod].ogeler;
    const beklenen = ['/media/ses/ayet/1-1.mp3', ...parcalar.map((s) => s.ses)];
    await expect.poll(() => calinanlar(page)).toEqual(beklenen);
    await expect(page.locator('[data-ec-cal][aria-pressed="true"]')).toHaveCount(0);
  });
}

test('Âyetü’l-Kürsî hücresi yalnız yazılı âyeti, tam kayıt girişle birlikte çalar', async ({ page }) => {
  await calarTaklidi(page);
  await sayfayiAc(page, 'ayetel-kursi');
  await page.locator('.ec-satir button').click();
  expect(await calinanlar(page)).toEqual(['/media/ses/ayet/2-255.mp3']);
  await page.locator('[data-ec-tam]').click();
  expect((await calinanlar(page)).at(-1)).toBe(KODLAR['ayetel-kursi'].tam.ses);
});

test('Besmele JavaScript kapalıyken de görünür ve ses bağlantısı (ulucamii.be) verilir', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route('**/*', (r) => r.request().url().startsWith(`${KOK}/`) ? r.continue() : r.abort());
  const page = await context.newPage();
  await page.goto(`${KOK}/e/asr/`);
  await expect(page.locator('[data-ec-besmele] .ec-ar')).toBeVisible();
  const baglanti = page.getByRole('link', { name: DINLEME.fr.besmeleCal, exact: true });
  await expect(baglanti).toHaveAttribute('href', `https://ulucamii.be/media/ses/ayet/1-1.mp3?v=${VERI.surum}`);
  expect(sesDosyaVar('/media/ses/ayet/1-1.mp3')).toBe(true);
  await context.close();
});

test('Uzun âyet hücresi çalarken ilk satır sabit başlığın arkasında kalmaz', async ({ page }) => {
  await calarTaklidi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await sayfayiAc(page, 'ayetel-kursi');
  await page.locator('.ec-satir .ec-ar').click({ position: { x: 100, y: 35 } });
  const konum = await page.evaluate(() => ({
    arapca: document.querySelector('.ec-ar').getBoundingClientRect().top,
    baslik: document.querySelector('header.ust').getBoundingClientRect().bottom,
  }));
  expect(konum.arapca).toBeGreaterThanOrEqual(konum.baslik);
  expect(await calinanlar(page)).toEqual(['/media/ses/ayet/2-255.mp3']);
});

for (const zincir of [false, true]) {
  test(`Tekrar beklerken kapatılırsa bekleyen ses iptal edilir (zincir=${zincir})`, async ({ page }) => {
    await calarTaklidi(page, { bitir: true, sure: 1 });
    await sayfayiAc(page, 'asr');
    await page.locator('[data-ec-tekrar]').click();
    if (zincir) await page.locator('[data-ec-zincir]').click();
    await page.locator('[data-ec-besmele] button').click();
    await page.waitForTimeout(150); // 1 saniyelik tekrar arasının içi
    await page.locator('[data-ec-tekrar]').click();
    const beklenen = ['/media/ses/ayet/1-1.mp3', ...(zincir ? KODLAR.asr.satirlar.map((s) => s.ses) : [])];
    await expect.poll(() => calinanlar(page)).toEqual(beklenen);
    await page.waitForTimeout(1100); // Eski zamanlayıcı tekrar başlatmamalı.
    expect(await calinanlar(page)).toEqual(beklenen);
    await expect(page.locator('[data-ec-cal][aria-pressed="true"]')).toHaveCount(0);
  });
}

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
  await ikinci.click(); // durdur
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

test('Yönlendirme kodu hem meta ile hem düğmeyle seviye testinin sayfasına (ulucamii.be) götürür', async ({ page }) => {
  const hedef = `https://ulucamii.be${YONLENDIRME.yonlendir}`;
  const ham = await (await page.request.get('/e/test/')).text();
  expect(ham).toContain(`content="0;url=${hedef}"`);
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
  await expect(dugme).toHaveAttribute('href', hedef);
  await expect(dugme).toHaveText(EC_METIN.yonlendirDugme);
  await expect(page.locator('main h1')).toHaveText(YONLENDIRME.baslik);
  await expect(page.locator('[data-ecouter]')).toHaveCount(0);

  // Etiket yerine konunca gerçekten yönlenir (ulucamii.be ağda kesik: istek hedef adrese gider).
  await page.unroute('**/e/test/');
  await page.context().route('https://ulucamii.be/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>test</title>' }));
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

    await page.evaluate(() => { delete document.documentElement.dataset.theme; });
    await page.setViewportSize({ width: 360, height: 780 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${kod} — 360 px`).toBe(true);
    if (kod === 'fatha') {
      expect(await page.locator('.ec-izgara').evaluate((el) => el.scrollWidth <= el.clientWidth + 1), 'ızgara 360 px').toBe(true);
    }
    await page.setViewportSize(info.project.use.viewport ?? { width: 1440, height: 1000 });
  }

  // Çalan durum da erişilebilir kalır.
  await sayfayiAc(page, 'fatha');
  await page.locator('.ec-izgara button[data-ec-cal]').first().click();
  await sonluAnimasyonlariBekle(page);
  expect(await ciddiAxe(page, ['main']), 'çalarken').toEqual([]);
});
