/**
 * İlim Yolu «Yeni Müslüman yolu» (11 Kasım 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı, gerçek CSP altında (scripts/egitim-onizle.mjs firebase.json'daki
 * başlıkları gönderir), 320 px, dış ağ kesik. Sabitlenenler:
 *  - dizin: 12 hafta + 8 adım, giriş uyarısı, saklama notu; beş dilde taşmasız, hreflang'lı; iki temada axe;
 *  - hafta akışı: soru yanlışta tekrar denenir, doğruda kaydedilir (ilk denemede hatasız bit), «Uygulamayı yaptım», «Haftayı tamamladım»; işaretler yenilemede kalır;
 *    cihaza YALNIZ hafta başına dört işaret yazılır (cevap metni, ad, zaman yok); klavyeyle yapılır;
 *  - video: yalnız tr/en'de; tıklamadan önce iframe ve YouTube isteği YOK; tıklayınca youtube-nocookie.com çerçevesi; CSP ihlali 0;
 *  - son hafta tamamlanınca bitiş kutusu; adım sayfası haftaları ve durumu gösterir; platform bağlantısı doğru sayfaya gider.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const KOK = 'http://127.0.0.1:4402';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const ANAHTAR = 'ilim:y12:v1';
const yol = JSON.parse(readFileSync('paylasilan/ogrenme-yolu/icerik.json', 'utf8'));
const H01 = yol.haftalar.find((h) => h.id === 'h01');
const H12 = yol.haftalar.find((h) => h.id === 'h12');
const YASAK = /m[uü][sş]avir|sosyal i[sş]ler|b[uü]y[uü]kel[cç]i|el[cç]ilik|konsolos|ambassade|affaires sociales|conseill|sociale zaken|raadgever|botschaft|embassy|consulat|consulaat|konsulat|social affairs|counsel/i;

test.use({ viewport: { width: 320, height: 700 } });

const istekler = [];
test.beforeEach(async ({ context }) => {
  istekler.length = 0;
  await context.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.origin === KOK) return r.continue();
    istekler.push(u.href);
    return r.abort();
  });
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
});

const tasmaYok = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const depoOku = (page) => page.evaluate((a) => localStorage.getItem(a), ANAHTAR);
const axe = async (page) => {
  for (const tema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: tema });
    const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(sonuc.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`), tema).toEqual([]);
  }
};
const dogruSik = (soru) => soru.siklar.findIndex((_, j) => j === soru.dogru);

test.describe('dizin ve adım sayfası', () => {
  for (const dil of DILLER) {
    test(`${dil}: dizin 12 hafta + 8 adım, giriş uyarısı, taşmaz, hreflang, iframe yok, yasak terim yok`, async ({ page }) => {
      await page.goto(`/${dil}/yollar/yeni-musluman/`);
      await expect(page.locator('li[data-hafta]')).toHaveCount(12);
      await expect(page.locator('.yy-adim')).toHaveCount(8);
      await expect(page.locator('.yy-giris')).toHaveText(yol.giris[dil]);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://egitim.ulucamii.be/${dil}/yollar/yeni-musluman/`);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(6);
      await expect(page.locator('html')).toHaveAttribute('lang', /./);
      await expect(page.locator('iframe')).toHaveCount(0);
      expect(await tasmaYok(page)).toBe(true);
      expect(await page.locator('body').innerText()).not.toMatch(YASAK);
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
      expect(istekler).toEqual([]);
    });

    test(`${dil}: hafta ve adım sayfası açılır, taşmaz, yasak terim yok`, async ({ page }) => {
      for (const s of ['h01', 'h06', 'h12', 'adim-3']) {
        await page.goto(`/${dil}/yollar/yeni-musluman/${s}/`);
        await expect(page.locator('h1')).toBeVisible();
        expect(await tasmaYok(page), s).toBe(true);
        expect(await page.locator('body').innerText(), s).not.toMatch(YASAK);
        expect(await page.evaluate(() => window.__csp)).toEqual([]);
      }
      expect(istekler).toEqual([]);
    });
  }

  test('yollar dizininden ve ana sayfadan ulaşılır', async ({ page }) => {
    await page.goto('/tr/yollar/');
    await page.locator('#yeni-musluman a[href="/tr/yollar/yeni-musluman/"]').click();
    await expect(page).toHaveURL(/\/tr\/yollar\/yeni-musluman\/$/);
    await page.goto('/fr/');
    await expect(page.locator('article.iy-yol.yeni a[href="/fr/yollar/yeni-musluman/"]').first()).toHaveCount(1);
  });

  test('adım sayfası o adımın haftalarını ve durumunu gösterir', async ({ page }) => {
    await page.addInitScript(([a]) => localStorage.setItem(a, JSON.stringify({ v: 1, maddeler: { h05: '1113' } })), [ANAHTAR]);
    const adim3 = yol.haftalar.filter((h) => h.adim === 3).map((h) => h.id);
    await page.goto('/tr/yollar/yeni-musluman/adim-3/');
    await expect(page.locator('li[data-hafta]')).toHaveCount(adim3.length);
    await expect(page.locator('li[data-hafta="h05"]')).toHaveAttribute('data-tamam', '1');
    await expect(page.locator('li[data-hafta="h05"] [data-yy-durum]')).toHaveText('Tamamlandı');
    await expect(page.locator('[data-yy-ilerleme]')).toHaveText(`1 / ${adim3.length} hafta tamamlandı`);
  });

  test('axe: dizin, hafta ve adım sayfası, iki tema', async ({ page }) => {
    for (const s of ['', 'h01/', 'adim-1/']) {
      await page.goto(`/tr/yollar/yeni-musluman/${s}`);
      await page.evaluate(() => document.fonts.ready);
      await axe(page);
    }
  });
});

test.describe('hafta akışı', () => {
  test('soru: yanlışta tekrar, doğruda kaydedilir; uygulama ve hafta tamamlama; yenilemede kalır; yalnız dört işaret saklanır', async ({ page }) => {
    await page.goto('/tr/yollar/yeni-musluman/h01/');
    expect(await depoOku(page)).toBeNull();
    const [s1, s2] = [H01.sorular[0], H01.sorular[1]];
    const kutu1 = page.locator('[data-yy-soru="h01-1"]');
    const yanlis = s1.siklar.findIndex((_, j) => j !== s1.dogru);
    // Seçmeden denetle → uyarı, kayıt yok.
    await kutu1.locator('[data-yy-denetle]').click();
    await expect(kutu1.locator('[data-geri]')).toHaveText('Önce bir seçenek seçin.');
    expect(await depoOku(page)).toBeNull();
    // Yanlış → tekrar dene, kayıt yok.
    await kutu1.locator(`input[value="${yanlis}"]`).check();
    await kutu1.locator('[data-yy-denetle]').click();
    await expect(kutu1.locator('[data-geri]')).toHaveText('Doğru değil; bir daha deneyin.');
    await expect(kutu1.locator('input:checked')).toHaveCount(0);
    expect(await depoOku(page)).toBeNull();
    // Doğru → kaydedilir (yanlıştan sonra yalnız «tamam» biti: 1).
    await kutu1.locator(`input[value="${s1.dogru}"]`).check();
    await kutu1.locator('[data-yy-denetle]').click();
    await expect(kutu1).toHaveAttribute('data-tamam', '1');
    await expect(kutu1.locator('[data-geri]')).toHaveText('Bu soru tamam.');
    await expect(kutu1.locator('input').first()).toBeDisabled();
    expect(JSON.parse(await depoOku(page)).maddeler.h01).toBe('1');
    await expect(page.locator('[data-yy-durum]').first()).toHaveText('1 / 2 soru doğru');
    // İkinci soru ilk denemede doğru → hatasız bit (3).
    const kutu2 = page.locator('[data-yy-soru="h01-2"]');
    await kutu2.locator(`input[value="${s2.dogru}"]`).check();
    await kutu2.locator('[data-yy-denetle]').click();
    expect(JSON.parse(await depoOku(page)).maddeler.h01).toBe('13');
    // Uygulama + hafta tamam.
    await page.locator('[data-yy-yap]').click();
    await expect(page.locator('[data-yy-yap]')).toBeDisabled();
    expect(JSON.parse(await depoOku(page)).maddeler.h01).toBe('131');
    await page.locator('[data-yy-tamamla]').click();
    await expect(page.locator('[data-yy-durum]').first()).toHaveText('Hafta tamamlandı');
    const kayit = JSON.parse(await depoOku(page));
    expect(kayit).toEqual({ v: 1, maddeler: { h01: '1311' } });
    expect(Object.keys(kayit).sort()).toEqual(['maddeler', 'v']);
    // Yenilemede kalır.
    await page.reload();
    await expect(page.locator('[data-yy-durum]').first()).toHaveText('Hafta tamamlandı');
    await expect(page.locator('[data-yy-soru="h01-1"]')).toHaveAttribute('data-tamam', '1');
    await expect(page.locator('[data-yy-soru="h01-2"] input[data-dogru]')).toBeChecked();
    await expect(page.locator('[data-yy-tamamla]')).toBeDisabled();
    // Dizinde ve adım sayfasında yansır.
    await page.goto('/tr/yollar/yeni-musluman/');
    await expect(page.locator('li[data-hafta="h01"]')).toHaveAttribute('data-tamam', '1');
    await expect(page.locator('[data-yy-ilerleme]')).toHaveText('1 / 12 hafta tamamlandı');
    await expect(page.locator('[data-yy-cubuk]')).toHaveJSProperty('value', 1);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    expect(istekler).toEqual([]);
  });

  test('klavye: Tab, Boşluk ve Enter ile soru çözülür; odak halkası görünür', async ({ page }) => {
    await page.goto('/tr/yollar/yeni-musluman/h02/');
    const h02 = yol.haftalar.find((h) => h.id === 'h02');
    const kutu = page.locator('[data-yy-soru="h02-1"]');
    const radyo = kutu.locator(`input[value="${h02.sorular[0].dogru}"]`);
    await radyo.focus();
    await page.keyboard.press('Space');
    await expect(radyo).toBeChecked();
    await page.keyboard.press('Tab');
    const dugme = kutu.locator('[data-yy-denetle]');
    for (let i = 0; i < 6 && !(await dugme.evaluate((d) => d === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(dugme).toBeFocused();
    const halka = await dugme.evaluate((d) => getComputedStyle(d).outlineStyle);
    expect(halka).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(kutu).toHaveAttribute('data-tamam', '1');
  });

  test('son hafta: tamamlanınca bitiş kutusu görünür; önceki ve sonraki bağlantıları', async ({ page }) => {
    await page.goto('/tr/yollar/yeni-musluman/h12/');
    await expect(page.locator('[data-yy-bitis]')).toBeHidden();
    await page.locator('[data-yy-tamamla]').click();
    await expect(page.locator('[data-yy-bitis]')).toBeVisible();
    await expect(page.locator('a[rel="prev"]')).toHaveAttribute('href', '/tr/yollar/yeni-musluman/h11/');
    await expect(page.locator('a[rel="next"]')).toHaveCount(0);
    await page.goto('/tr/yollar/yeni-musluman/h01/');
    await expect(page.locator('a[rel="next"]')).toHaveAttribute('href', '/tr/yollar/yeni-musluman/h02/');
    expect(H12.id).toBe('h12');
  });

  test('platform bağlantıları konusuna uygun sayfaya gider; belirsiz haftada yok', async ({ page }) => {
    const beklenen = { h05: '/tr/ibadet/abdest/', h06: '/tr/ibadet/namaz/', h04: '/tr/okuma/', h02: '/tr/yollar/plan-itikat/', h03: '/tr/yollar/plan-siyer/' };
    for (const [h, href] of Object.entries(beklenen)) {
      await page.goto(`/tr/yollar/yeni-musluman/${h}/`);
      await expect(page.locator('.yy-platform a')).toHaveAttribute('href', href);
      expect((await page.request.get(href)).status(), href).toBe(200);
    }
    for (const h of ['h09', 'h12']) {
      await page.goto(`/tr/yollar/yeni-musluman/${h}/`);
      await expect(page.locator('.yy-platform')).toHaveCount(0);
    }
  });

  test('kaynak bağlantıları yalnız https ve yeni sekmede; sayfada telefon numarası yok', async ({ page }) => {
    await page.goto('/tr/yollar/yeni-musluman/h05/');
    const bag = await page.locator('.yy-kaynaklar a').evaluateAll((a) => a.map((x) => [x.href, x.target, x.rel]));
    expect(bag.length).toBeGreaterThan(0);
    for (const [href, hedef, rel] of bag) { expect(href).toMatch(/^https:\/\//); expect(hedef).toBe('_blank'); expect(rel).toContain('noopener'); }
    expect(await page.locator('#ana').innerText()).not.toMatch(/\+?\d[\d ./-]{7,}\d/);
  });
});

test.describe('video', () => {
  test('tr: tıklamadan önce iframe ve dış istek yok; tıklayınca youtube-nocookie.com çerçevesi; CSP ihlali yok', async ({ page }) => {
    await page.goto('/tr/yollar/yeni-musluman/h01/');
    const dugme = page.locator('[data-yy-video]');
    await expect(dugme).toHaveAttribute('data-yy-video', yol.haftalar[0].video.tr);
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(istekler).toEqual([]);
    await dugme.click();
    const cerceve = page.locator('iframe');
    await expect(cerceve).toHaveCount(1);
    await expect(cerceve).toHaveAttribute('src', new RegExp(`^https://www\\.youtube-nocookie\\.com/embed/${yol.haftalar[0].video.tr}\\?`));
    await expect(cerceve).toHaveAttribute('title', /.+/);
    await expect(cerceve).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    await expect.poll(() => istekler.some((u) => u.startsWith('https://www.youtube-nocookie.com/embed/'))).toBe(true);
    expect(istekler.every((u) => new URL(u).hostname === 'www.youtube-nocookie.com')).toBe(true);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test('en: kendi dilindeki video; fr, nl, de: video yok', async ({ page }) => {
    await page.goto('/en/yollar/yeni-musluman/h01/');
    await expect(page.locator('[data-yy-video]')).toHaveAttribute('data-yy-video', yol.haftalar[0].video.en);
    for (const dil of ['fr', 'nl', 'de']) {
      await page.goto(`/${dil}/yollar/yeni-musluman/h01/`);
      await expect(page.locator('[data-yy-video]')).toHaveCount(0);
    }
  });

  test('video kapak düğmesi klavyeyle odaklanır ve Enter ile açılır', async ({ page }) => {
    await page.goto('/tr/yollar/yeni-musluman/h02/');
    const dugme = page.locator('[data-yy-video]');
    await dugme.focus();
    await expect(dugme).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('iframe')).toHaveCount(1);
  });
});

test.describe('görünüm', () => {
  for (const g of [320, 360, 1280]) {
    test(`${g} px: dizin ve hafta taşmaz, iki tema`, async ({ page }) => {
      await page.setViewportSize({ width: g, height: 800 });
      for (const tema of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: tema });
        for (const s of ['', 'h05/']) {
          await page.goto(`/fr/yollar/yeni-musluman/${s}`);
          expect(await tasmaYok(page), `${g} ${tema} ${s}`).toBe(true);
        }
      }
    });
  }
});
