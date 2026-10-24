/**
 * Basılı ezber kartı (Faz 2e, 24 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı.
 * Kart, madde sayfasının yazdırma görünümüdür. Burada sabitlenenler:
 *  - ekranda kart öğeleri (kare kod, üst satır) görünmez, «Kartı yazdır» düğmesi betik çalışınca çıkar ve yazdırma penceresini açar;
 *  - kare kod sayfanın kanonik adresini (https://egitim.ulucamii.be/<dil>/calis/<id>/, yerel adres değil) kodlar ve saf vektördür;
 *  - yazdırma ortamında gezinme/araçlar gizlenir, koyu tema bile açık jetonlara döner (siyah yazı, beyaz kâğıt);
 *  - Chromium'un PDF çıktısı: A4, piksel görsel yok, yazı tipleri gömülü, uzun sûre birden çok sayfa;
 *  - Arapça metni olmayan maddede (onay bekleyen dua) kart hiç sunulmaz.
 * PDF üretimi yalnız masaüstü projesinde sınanır (page.pdf masaüstü Chromium'da yazdırma ortamını kurar). Dış ağ kapalıdır.
 * Kare kodun telefonla okunduğunda doğru adrese gittiği ayrıca PDF'ten çözülerek denetlenir (scripts/ezber-kart-dogrula.py).
 */
import { test, expect } from '@playwright/test';
import QRCode from 'qrcode';

const KOK = 'http://127.0.0.1:4402';
const SITE = 'https://egitim.ulucamii.be';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KARTLI = ['s-ihlas', 'd-subhaneke'];

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
  });
});

/** SVG yolundan (M x y h w v1 h-w z koşuları) modül matrisini kurar; kenar = sessiz bölge. */
function yoldanMatris(yol, boy, kenar = 4) {
  const m = Array.from({ length: boy }, () => Array(boy).fill(0));
  for (const [, x, y, w] of yol.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    for (let i = 0; i < Number(w); i++) m[Number(y) - kenar][Number(x) - kenar + i] = 1;
  }
  return m;
}
const beklenenMatris = (adres) => {
  const q = QRCode.create(adres, { errorCorrectionLevel: 'M' }).modules;
  return Array.from({ length: q.size }, (_, y) => Array.from({ length: q.size }, (_, x) => (q.get(y, x) ? 1 : 0)));
};

test.describe('ekranda', () => {
  for (const dil of ['tr', 'fr']) {
    test(`${dil}: kart öğeleri gizli, yazdır düğmesi görünür ve yazdırmayı açar`, async ({ page }) => {
      await page.addInitScript(() => { window.__yazdirildi = 0; window.print = () => { window.__yazdirildi++; }; });
      await page.goto(`/${dil}/calis/s-ihlas/`);
      const dugme = page.locator('[data-yazdir]');
      await expect(dugme).toBeVisible();
      await expect(dugme).toHaveAccessibleName(/\S/);
      await expect(page.locator('[data-kart-kare]')).toBeHidden();
      await expect(page.locator('.kart-ust')).toBeHidden();
      await expect(page.locator('.kart-alt')).toBeHidden();
      await expect(page.locator('.kare-kod')).toBeHidden();
      await dugme.click();
      expect(await page.evaluate(() => window.__yazdirildi)).toBe(1);
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('betik kapalıyken yazdır düğmesi görünmez: ölü düğme sunulmaz', async ({ browser }) => {
    const baglam = await browser.newContext({ javaScriptEnabled: false, baseURL: KOK });
    const sayfa = await baglam.newPage();
    await sayfa.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    await sayfa.goto('/tr/calis/s-ihlas/');
    await expect(sayfa.locator('[data-yazdir]')).toBeHidden();
    await baglam.close();
  });

  test('Arapça metni olmayan madde (onay bekleyen dua): düğme de kare kod da yok', async ({ page }) => {
    await page.goto('/tr/calis/d-euzu-besmele/');
    await expect(page.locator('[data-yazdir]')).toHaveCount(0);
    await expect(page.locator('.kare-kod')).toHaveCount(0);
  });
});

test.describe('kare kod', () => {
  for (const dil of DILLER) {
    for (const id of KARTLI) {
      test(`${dil}/${id}: kare kod kanonik adresi kodlar, saf vektör`, async ({ page }) => {
        await page.goto(`/${dil}/calis/${id}/`);
        const svg = page.locator('[data-kart-kare] svg.kare-kod');
        await expect(svg).toHaveCount(1);
        const { yol, kutu, ic } = await svg.evaluate((el) => ({
          yol: el.querySelector('path').getAttribute('d'),
          kutu: el.getAttribute('viewBox'),
          ic: el.innerHTML,
        }));
        const beklenen = beklenenMatris(`${SITE}/${dil}/calis/${id}/`);
        expect(kutu).toBe(`0 0 ${beklenen.length + 8} ${beklenen.length + 8}`);
        expect(yoldanMatris(yol, beklenen.length)).toEqual(beklenen);
        expect(ic).not.toMatch(/<image|href|data:|<foreignObject/i);
        // Altındaki adres yazısı da aynı kanonik adrestir (yerel adres sızmaz).
        const yazi = (await page.locator('.kart-adres').textContent()).replace(/\s+/g, '');
        expect(yazi).toBe(`egitim.ulucamii.be/${dil}/calis/${id}/`);
      });
    }
  }
});

test.describe('yazdırma ortamı', () => {
  for (const tema of ['light', 'dark']) {
    test(`${tema} tema: gezinme gizli, kart öğeleri görünür, kâğıt beyaz yazı siyah`, async ({ page }) => {
      await page.emulateMedia({ media: 'print', colorScheme: tema });
      await page.goto('/tr/calis/s-ihlas/');
      await expect(page.locator('.ust')).toBeHidden();
      await expect(page.locator('.alt')).toBeHidden();
      await expect(page.locator('.metin-araclar')).toBeHidden();
      await expect(page.locator('[data-yazdir]')).toBeHidden();
      await expect(page.locator('.kart-ust')).toBeVisible();
      await expect(page.locator('[data-kart-kare] svg.kare-kod')).toBeVisible();
      await expect(page.locator('.kart-alt')).toBeVisible();
      const renk = await page.evaluate(() => ({
        zemin: getComputedStyle(document.body).backgroundColor,
        baslik: getComputedStyle(document.querySelector('h1')).color,
        meal: getComputedStyle(document.querySelector('.meal')).color,
      }));
      const koyuMu = (c) => { const [r, g, b] = c.match(/\d+/g).map(Number); return Math.max(r, g, b) <= 60; };
      expect(renk.zemin).toBe('rgb(255, 255, 255)');
      expect(koyuMu(renk.baslik), `başlık rengi ${renk.baslik}`).toBe(true);
      expect(koyuMu(renk.meal), `meâl rengi ${renk.meal}`).toBe(true);
    });
  }
});

test.describe('PDF çıktısı', () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'masaustu-chromium', 'page.pdf yalnız masaüstü Chromium projesinde sınanır'));

  const pdfAl = async (page, yol, tema = 'light') => {
    await page.emulateMedia({ colorScheme: tema });
    await page.goto(yol);
    await page.evaluate(() => document.fonts.ready);
    const veri = await page.pdf({ format: 'A4', printBackground: false, preferCSSPageSize: true });
    return { veri, metin: veri.toString('latin1') };
  };
  const sayfaSayisi = (metin) => (metin.match(/\/Type\s*\/Page[^s]/g) ?? []).length;

  test('kısa sûre: tek sayfa A4, piksel görsel yok, yazı tipleri gömülü', async ({ page }) => {
    const { veri, metin } = await pdfAl(page, '/tr/calis/s-ihlas/');
    expect(veri.subarray(0, 5).toString()).toBe('%PDF-');
    expect(sayfaSayisi(metin)).toBe(1);
    expect(metin).not.toMatch(/\/Subtype\s*\/Image/);
    expect(metin).toMatch(/\/FontFile[23]?\b|\/Subtype\s*\/Type3/);
    const kutu = metin.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
    expect(Number(kutu[1])).toBeCloseTo(595.28, 0);
    expect(Number(kutu[2])).toBeCloseTo(841.89, 0);
  });

  test('uzun sûre (Nebe, 40 âyet) Fransızca: birden çok sayfa, görsel yok', async ({ page }) => {
    const { metin } = await pdfAl(page, '/fr/calis/s-nebe/');
    expect(sayfaSayisi(metin)).toBeGreaterThanOrEqual(2);
    expect(metin).not.toMatch(/\/Subtype\s*\/Image/);
  });

  test('koyu temada da çıktı aynı: görsel yok, sayfa sayısı değişmez', async ({ page }) => {
    const acik = await pdfAl(page, '/tr/calis/d-subhaneke/', 'light');
    const koyu = await pdfAl(page, '/tr/calis/d-subhaneke/', 'dark');
    expect(sayfaSayisi(koyu.metin)).toBe(sayfaSayisi(acik.metin));
    expect(koyu.metin).not.toMatch(/\/Subtype\s*\/Image/);
  });
});
