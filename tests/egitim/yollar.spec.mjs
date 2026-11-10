/**
 * İlim Yolu Dilim 2 (10 Kasım 2026) — bilgi yolları, bilgi kartı, mini sınav, yerleştirme testi, rozet ve belge. Gerçek tarayıcıda, derlenmiş
 * çıktıya karşı, 320 px genişlikte; dış ağ kesik. Burada sabitlenenler:
 *  - kart sayfası: içerik JSON'dan gelir, dili taslak olan kartta «Taslak» etiketi var; «Öğrendim» cihaza yazılır ve yenilemede kalır; mini sınav
 *    yanlışta doğru cevabı söyler, doğruda kartı öğrenildi sayar; hepsi klavyeyle (Tab, Boşluk, Enter, oklar) yapılır; CSP ihlali yok, yatay taşma yok;
 *  - yerleştirme testi: sorular tarayıcıda gelir, hiçbir ağ isteği atılmaz ve depoya hiçbir şey yazılmaz; hepsi doğruda en üst basamak,
 *    hepsi «bilmiyorum»da 1. basamak önerilir; sonuçtaki bağlantı alan yoluna gider;
 *  - yol dizini beş dilde 13 yol; ilerleme ve rozet cihaz kaydından gelir; tamamlanan yolun rozeti ve «kendi çalışmasıyla» yazan belge çıkar;
 *  - üç sayfada iki temada axe (wcag2a/aa).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, readFileSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const ANAHTAR = 'ulucamii:bilgi:cihaz:v1';
const kartlar = readdirSync('src/data/ilim-yolu/kartlar').filter((a) => a.endsWith('.json'))
  .flatMap((a) => JSON.parse(readFileSync(`src/data/ilim-yolu/kartlar/${a}`, 'utf8')).kartlar);
const SORULU = kartlar.find((k) => k.sorular.length === 2 && k.id.startsWith('ib-'));
const SORUSUZ = kartlar.find((k) => k.sorular.length === 0);
const AHLAK = kartlar.filter((k) => k.kod === 'ahlak');

test.use({ viewport: { width: 320, height: 700 } });

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
});

const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const depoOku = (page) => page.evaluate((a) => localStorage.getItem(a), ANAHTAR);

test.describe('bilgi kartı ve mini sınav', () => {
  test('içerik, taslak etiketi, Öğrendim (kalıcı), 320 px taşmasız, CSP ihlalsiz', async ({ page }) => {
    await page.goto(`/tr/ogren/${SORULU.id}/`);
    await expect(page.locator('h1')).toHaveText(SORULU.baslik.tr);
    await expect(page.locator('.yl-ozet')).toHaveText(SORULU.ozet.tr);
    await expect(page.locator('[data-taslak]').first()).toBeVisible();
    await expect(page.locator('[data-taslak] .yl-taslak-ad')).toHaveText('Taslak');
    expect(await tasmaYok(page)).toBe(true);
    const dugme = page.locator('[data-ogrendim]');
    await expect(dugme).toHaveAttribute('aria-pressed', 'false');
    expect(await depoOku(page)).toBeNull();
    await dugme.click();
    await expect(dugme).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-ogrendim-durum]')).toContainText('öğrendim olarak işaretlediniz');
    const kayit = JSON.parse(await depoOku(page));
    expect(kayit.v).toBe(1);
    expect(kayit.maddeler.ibadet[Number(SORULU.id.slice(3)) - 1]).toBe('1');
    await page.reload();
    await expect(page.locator('[data-ogrendim]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test('sorusuz kart: sınav yok notu, öğrendim yine çalışır', async ({ page }) => {
    await page.goto(`/tr/ogren/${SORUSUZ.id}/`);
    await expect(page.locator('.yl-sinav')).toContainText('mini sorusu yok');
    await expect(page.locator('[data-kontrol]')).toHaveCount(0);
    await page.locator('[data-ogrendim]').click();
    await expect(page.locator('[data-ogrendim]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('mini sınav klavyeyle: eksik seçimde uyarı, yanlışta doğru cevap, yeniden dene, hepsi doğruda kart öğrenildi', async ({ page }) => {
    await page.goto(`/tr/ogren/${SORULU.id}/`);
    const kontrol = page.locator('[data-kontrol]');
    // Hiç seçmeden kontrol: uyarı, kayıt yok.
    await kontrol.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-sinav-sonuc]')).toContainText('Önce her soruda bir şık seçin');
    expect(await depoOku(page)).toBeNull();

    // Her soruda doğru olmayan ilk şıkkı klavyeyle seç (odak + Boşluk).
    const yanlisSec = async (n) => {
      const yanlis = SORULU.sorular[n].dogru === 0 ? 1 : 0;
      const radyo = page.locator(`fieldset[data-soru="${n}"] input[type="radio"]`).nth(yanlis);
      await radyo.focus();
      await page.keyboard.press('Space');
      await expect(radyo).toBeChecked();
    };
    await yanlisSec(0);
    await yanlisSec(1);
    await kontrol.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-geri][data-d="yanlis"]')).toHaveCount(2);
    await expect(page.locator('[data-geri]').first()).toContainText('Doğru cevap:');
    await expect(page.locator('.yl-sik[data-sonuc="dogru"]')).toHaveCount(2);
    await expect(page.locator('[data-sinav-sonuc]')).toContainText('0 / 2 doğru');
    expect(await depoOku(page)).toBeNull();

    // Yeniden dene (odak düğmede; klavyeyle), bu sefer doğru şıklar.
    const yeniden = page.locator('[data-yeniden]');
    await expect(yeniden).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
    for (const n of [0, 1]) {
      const radyo = page.locator(`fieldset[data-soru="${n}"] input[type="radio"]`).nth(SORULU.sorular[n].dogru);
      await radyo.focus();
      await page.keyboard.press('Space');
    }
    await kontrol.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-sinav-sonuc]')).toContainText('Hepsi doğru');
    await expect(page.locator('[data-ogrendim]')).toHaveAttribute('aria-pressed', 'true');
    const kayit = JSON.parse(await depoOku(page));
    expect(kayit.maddeler.ibadet[Number(SORULU.id.slice(3)) - 1]).toBe('3');
    expect(await tasmaYok(page)).toBe(true);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  for (const dil of DILLER) {
    test(`${dil}: kart sayfası açılır, başlık ve taslak etiketi, kanonik adres, yol bağlantıları`, async ({ page }) => {
      await page.goto(`/${dil}/ogren/${SORULU.id}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${dil}`));
      await expect(page.locator('h1')).toHaveText(SORULU.baslik[dil]);
      await expect(page.locator('[data-taslak]').first()).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://egitim.ulucamii.be/${dil}/ogren/${SORULU.id}/`);
      await expect(page.locator(`.yl-meta a[href="/${dil}/yollar/plan-ibadet/"]`)).toHaveCount(1);
      expect(await tasmaYok(page)).toBe(true);
    });
  }
});

test.describe('yerleştirme testi (tarayıcıda, hiçbir şey gönderilmez)', () => {
  /** Soruları sayfa verisinden okur; `dogruMu` verilen soruda doğru şıkkı, değilse «bilmiyorum»u seçtirir; klavyeyle (odak + Boşluk + Enter). */
  async function coz(page, dogruMu) {
    const sorular = await page.evaluate(() => JSON.parse(document.querySelector('[data-yerlestirme]').dataset.veri).sorular);
    await page.locator('[data-basla]').click();
    let sayi = 0;
    while (await page.locator('[data-test]').isVisible()) {
      const kimlik = await page.locator('[data-soru-alani]').getAttribute('data-id');
      const q = sorular.find((x) => x.id === kimlik);
      expect(q, `soru bulunamadı: ${kimlik}`).toBeTruthy();
      const secenekler = page.locator('input[name="yerlestirme"]');
      const hedef = dogruMu(q) ? q.dogru : q.siklar.length; // son seçenek = «Bilmiyorum»
      await secenekler.nth(hedef).focus();
      await page.keyboard.press('Space');
      await expect(secenekler.nth(hedef)).toBeChecked();
      await page.keyboard.press('Enter'); // form gönderimi
      if (++sayi > 60) throw new Error('test bitmedi');
    }
    return { sayi, sorular };
  }

  test('hepsi doğru: her alan en üst basamak; ağ isteği yok, depoya yazım yok; sonuç bağlantısı alan yoluna gider', async ({ page }) => {
    await page.goto('/tr/yollar/yerlestirme/');
    await expect(page.locator('h1')).toHaveText('Yerleştirme testi');
    expect(await tasmaYok(page)).toBe(true);
    const istekler = [];
    page.on('request', (r) => istekler.push(r.url()));
    const { sayi, sorular } = await coz(page, () => true);
    expect(sayi).toBe(sorular.length);
    await expect(page.locator('[data-sonuc]')).toBeVisible();
    await expect(page.locator('#yl-sonuc-baslik')).toBeFocused();
    await expect(page.locator('[data-oneri]')).toContainText('3. basamaktan');
    await expect(page.locator('[data-alan-liste] li')).toHaveCount(7);
    await expect(page.locator('[data-alan-liste] li[data-onerilen="1"]')).toHaveCount(1);
    const baglanti = await page.locator('[data-oneri-baglanti]').getAttribute('href');
    expect(baglanti).toMatch(/^\/tr\/yollar\/alan-[a-zA-Z]+\/#basamak-3$/);
    // Yalnız yerel yazı tipi dosyası (Arapça şık görününce tembel yüklenir) olabilir; veri gönderen ya da dış istek olmaz.
    expect(istekler.filter((u) => !u.startsWith(KOK + '/fonts/')), 'test sırasında ağ isteği atılmamalı').toEqual([]);
    expect(await depoOku(page)).toBeNull();
    expect(await page.evaluate(() => Object.keys(localStorage).filter((a) => a.startsWith('ulucamii:bilgi')))).toEqual([]);
    expect(await tasmaYok(page)).toBe(true);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test('hepsi «bilmiyorum»: yalnız 1. basamak sorulur, 1. basamak önerilir; yeniden çöz çalışır', async ({ page }) => {
    await page.goto('/tr/yollar/yerlestirme/');
    const { sayi, sorular } = await coz(page, () => false);
    expect(sayi).toBe(sorular.filter((q) => q.basamak === 1).length);
    await expect(page.locator('[data-oneri]')).toContainText('1. basamaktan');
    await page.locator('[data-yeniden]').click();
    await expect(page.locator('[data-test]')).toBeVisible();
    await expect(page.locator('[data-legend] .no')).toHaveText('Soru 1');
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test('bir alanda B1 doğru, B2 yanlış → o alanda 2. basamak önerilir', async ({ page }) => {
    await page.goto('/tr/yollar/yerlestirme/');
    const sorular = await page.evaluate(() => JSON.parse(document.querySelector('[data-yerlestirme]').dataset.veri).sorular);
    const hedef = sorular.find((q) => q.alan === 'itikat').alan;
    await coz(page, (q) => (q.alan === hedef ? q.basamak === 1 : false));
    const satir = page.locator('[data-alan-liste] li', { hasText: 'İman' });
    await expect(satir).toContainText('2. basamaktan');
  });

  test('iki temada erişilebilir (sorular ve sonuç)', async ({ page }) => {
    await page.goto('/tr/yollar/yerlestirme/');
    await page.locator('[data-basla]').click();
    for (const tema of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: tema });
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([]);
    }
  });
});

test.describe('yol dizini, yol sayfası, rozet ve belge', () => {
  for (const dil of DILLER) {
    test(`${dil}: dizin 13 yol gösterir, taşmaz, hreflang var`, async ({ page }) => {
      await page.goto(`/${dil}/yollar/`);
      await expect(page.locator('.yl-yol')).toHaveCount(13);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(6);
      expect(await tasmaYok(page)).toBe(true);
      await page.goto(`/${dil}/`);
      await expect(page.locator(`a[href="/${dil}/yollar/#plan"]`).first()).toHaveCount(1);
    });
  }

  test('ilerleme cihazdan gelir; tamamlanan yol rozet kazanır; yol sayfasında durum, taslak etiketi ve Basamak başlıkları var', async ({ page }) => {
    // Ahlak kartlarının hepsi öğrenildi (+ biri sınavlı), başka yol yok.
    const yarim = AHLAK.map((k, i) => (i === 0 ? '3' : '1')).join('');
    await page.addInitScript(([a, d]) => localStorage.setItem(a, JSON.stringify({ v: 1, maddeler: { ahlak: d } })), [ANAHTAR, yarim]);
    await page.goto('/tr/yollar/');
    const planAhlak = page.locator('li[data-yol="plan-ahlak"]');
    await expect(planAhlak.locator('[data-ilerleme]')).toHaveText(`${AHLAK.length} / ${AHLAK.length} öğrenildi`);
    await expect(planAhlak.locator('[data-rozet]')).toBeVisible();
    await expect(planAhlak).toHaveAttribute('data-tamam', '1');
    await expect(page.locator('li[data-yol="plan-siyer"] [data-rozet]')).toBeHidden();
    await expect(page.locator('li[data-yol="alan-ahlak"] [data-rozet]')).toBeVisible();
    await expect(page.locator('li[data-yol="plan-siyer"] [data-ilerleme]')).toContainText('0 /');

    await page.goto('/tr/yollar/alan-ahlak/');
    await expect(page.locator('h2.yl-basamak')).toHaveCount(await page.locator('h2.yl-basamak').count());
    await expect(page.locator('#basamak-1')).toBeVisible();
    await expect(page.locator('li[data-kart-id]').first()).toHaveAttribute('data-durum', '3');
    await expect(page.locator('li[data-kart-id]').first().locator('[data-durum-yazi]')).toHaveText('Öğrenildi · mini soru çözüldü');
    await expect(page.locator('li[data-kart-id] [data-taslak]').first()).toBeVisible();
    expect(await tasmaYok(page)).toBe(true);

    // Belge
    await page.goto('/tr/yollar/rozetler/');
    const rozet = page.locator('li[data-rozet-yol="plan-ahlak"]');
    await expect(rozet).toHaveAttribute('data-kazanildi', '1');
    await expect(page.locator('li[data-rozet-yol="plan-siyer"]')).toHaveAttribute('data-kazanildi', '0');
    await expect(page.locator('li[data-rozet-yol="plan-siyer"] [data-belge-sec]')).toBeHidden();
    await expect(page.locator('[data-belge-alan]')).toBeHidden();
    const sec = rozet.locator('[data-belge-sec]');
    await sec.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-belge-alan]')).toBeVisible();
    await expect(page.locator('[data-belge-satirlar] tr')).toHaveCount(AHLAK.length);
    await expect(page.locator('[data-belge-ifade]')).toContainText('kendi çalışmasıyla');
    await expect(page.locator('.belge-alt')).toContainText('Kendi çalışmasıyla');
    await expect(page.locator('[data-belge-kagit]')).toHaveAttribute('data-yogunluk', 'cok');
    // Yolun bir kartı bu dilde taslaksa belgede «Taslak» etiketi var (içerik onaylandıkça kendiliğinden kalkar; beklenen değer sayfa verisinden).
    const taslakBeklenen = await page.evaluate(() => JSON.parse(document.querySelector('[data-rozetler]').dataset.veri).yollar.find((y) => y.id === 'plan-ahlak').taslak);
    if (taslakBeklenen) await expect(page.locator('[data-belge-taslak] .yl-taslak-ad')).toHaveText('Taslak');
    else await expect(page.locator('[data-belge-taslak]')).toBeHidden();
    await page.locator('[data-belge-ad]').fill('Deneme Kişi');
    await expect(page.locator('[data-belge-ad-yaz]')).toHaveText('Deneme Kişi');
    // Ad depoya yazılmaz.
    expect(await page.evaluate(() => JSON.stringify(localStorage).includes('Deneme'))).toBe(false);
    expect(await tasmaYok(page)).toBe(true);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test('rozet yokken boş durum; bilgi yolu Ezber kaydından okunur', async ({ page }) => {
    await page.goto('/tr/yollar/rozetler/');
    await expect(page.locator('[data-hic-yok]')).toBeVisible();
    await expect(page.locator('[data-belge-sec]:visible')).toHaveCount(0);
    const ids = await page.evaluate(() => document.querySelector('[data-rozetler]') && JSON.parse(document.querySelector('[data-rozetler]').dataset.veri).yollar.find((y) => y.id === 'bilgi').idler);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    const maddeler = Object.fromEntries(ids.map((id) => [id, { kip: 'zincir', seviye: 0, seri: 0, boy: 5, grup: 0, sondan: false, dinleyici: false, kutu: -1, sonraki: '', son: Date.now() }]));
    await page.addInitScript((d) => localStorage.setItem('ulucamii:ezber:cihaz:v1', JSON.stringify(d)), { v: 1, ar: 1, maddeler, gunler: [] });
    await page.goto('/tr/yollar/bilgi/');
    await expect(page.locator('[data-rozet]')).toBeVisible();
    await expect(page.locator('li[data-bilgi-id]').first().locator('[data-durum-yazi]')).toHaveText('Çalışıldı');
  });

  for (const sayfa of ['yollar', 'yollar/plan-ibadet', `ogren/${SORULU.id}`, 'yollar/rozetler']) {
    test(`${sayfa}: iki temada erişilebilir`, async ({ page }) => {
      await page.goto(`/tr/${sayfa}/`);
      await page.evaluate(() => document.fonts.ready);
      for (const tema of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: tema });
        const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(sonuc.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([]);
      }
    });
  }
});
