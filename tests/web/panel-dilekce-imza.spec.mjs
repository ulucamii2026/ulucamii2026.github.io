import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { PDFDocument, PDFName, PDFArray, decodePDFRawStream } from 'pdf-lib';

/* 23 Eki 2026 (Rıdvan'ın kararı: «bundan sonra tek bir imza hem belgeye hem dilekçeye hem de açık rıza metninin olduğu
   ek belgeye otomatik basılsın»): panelin tek başına «Dilekçe» düğmesi de, tören tarihi yazılmasa bile (ön başvuru),
   başvuranın aktarım izniyle verdiği imzayı dilekçenin iki yüzüne basar. Tören tarihi ve yer-tarih satırı yalnız tarih
   yazılınca dolar. Hepsi uydurma veri ve yerel sunucudur; dış ağ kesilir. */

const REF = 'IH-2099-9999';
const IMZA_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const IMZA_VEKTOR = JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22L140 40L180 52L224 58M60 66L170 70' });

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const hedef = new URL(route.request().url()).origin;
    if (hedef === 'http://127.0.0.1:4401') return route.continue();
    return route.abort();
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

async function panelHazirla(page, kayitEk = {}, imzali = true) {
  await page.addInitScript(() => {
    localStorage.setItem('sveltia-cms.user', JSON.stringify({ token: 'test-token' }));
    localStorage.setItem('panel-oturum', JSON.stringify({ baslangic: Date.now() }));
    sessionStorage.setItem('panel-sirlar', JSON.stringify({ gh: 'test-token', gas: 'test-key' }));
  });
  await page.route('https://script.google.com/**', async (route) => {
    const islem = new URL(route.request().url()).searchParams.get('islem');
    if (islem === 'liste') return route.fulfill({
      json: { ok: true, surum: 43, kayitlar: { basliklar: [], satirlar: [] }, ihtidalar: {
        basliklar: ['Zaman damgası', 'Referans', 'Adı Soyadı', 'E-posta', 'PDF bağlantısı', 'Durum'],
        satirlar: [['09.09.2026 12:00', REF, 'Deniz Örnek', 'deniz@example.test', 'https://drive.google.com/file/d/test-summary-file-123/view', 'Yeni başvuru']],
      } },
    });
    if (islem === 'belge') return route.fulfill({ json: { ok: true,
      kayit: { 'Zaman damgası': '09.09.2026 12:00', 'Adı Soyadı': 'Deniz Örnek', 'Adres': 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika',
        'Doğum tarihi': '1990-05-20', 'Doğum yeri': 'Liège', 'Uyruk': 'Belçika', 'Telefon': '+32470000000', 'E-posta': 'deniz@example.test',
        'Form dili': 'fr', 'EK-10 rızası': 'Evet', 'EK-10 sürümü': '2026-10', 'İmza aktarım izni': 'Evet', ...kayitEk },
      basvuranImza: imzali ? IMZA_PNG : '', basvuranImzaVektor: imzali ? IMZA_VEKTOR : '', gorseller: { imza: imzali ? IMZA_PNG : '', imzaVektor: imzali ? IMZA_VEKTOR : '' } } });
    return route.fulfill({ json: { ok: true, surum: 43 } });
  });
}

async function dilekceIndir(page, torenTarihi) {
  page.once('dialog', (d) => d.accept(torenTarihi));
  await page.goto('/admin/#basvurular');
  await page.locator('#sekme-ihtida').click();
  const dugme = page.locator(`[data-dilekce="${REF}"]`);
  await expect(dugme).toBeVisible();
  const indirme = page.waitForEvent('download', { timeout: 25000 });
  await dugme.click();
  const indi = await indirme;
  return { bytes: readFileSync(await indi.path()), ad: indi.suggestedFilename() };
}

async function imzaSayfalari(bytes) {
  const doc = await PDFDocument.load(bytes), sayfalar = [];
  doc.getPages().forEach((sayfa, i) => {
    const c = sayfa.node.get(PDFName.of('Contents'));
    const akis = (c instanceof PDFArray ? c.asArray() : [c]).map((r) => Buffer.from(decodePDFRawStream(doc.context.lookup(r)).decode()).toString('latin1')).join('\n');
    if (/(^| )1 J/m.test(akis)) sayfalar.push(i);   // vektör imza yuvarlak uçlu çizgidir
  });
  return { sayfa: doc.getPageCount(), imza: sayfalar };
}

test('Panelin Dilekçe düğmesi tören tarihi boşken (ön başvuru) da başvuranın imzasını iki yüze basar', async ({ page }) => {
  await panelHazirla(page);
  const { bytes, ad } = await dilekceIndir(page, '');
  expect(ad).toContain('imzali');
  expect(await imzaSayfalari(bytes)).toEqual({ sayfa: 2, imza: [0, 1] });
});

test('Panelin Dilekçe düğmesi tören tarihi verilince aynı imzayı basar', async ({ page }) => {
  await panelHazirla(page);
  const { bytes, ad } = await dilekceIndir(page, '08/09/2026');
  expect(ad).toContain('imzali');
  expect(await imzaSayfalari(bytes)).toEqual({ sayfa: 2, imza: [0, 1] });
});

test('Ekranda imza atmayan başvuranın dilekçesinde imza yeri boş kalır', async ({ page }) => {
  await panelHazirla(page, { 'İmza aktarım izni': 'Hayır' }, false);
  page.on('dialog', (d) => (d.type() === 'prompt' ? d.accept('') : d.accept()));
  await page.goto('/admin/#basvurular');
  await page.locator('#sekme-ihtida').click();
  const indirme = page.waitForEvent('download', { timeout: 25000 });
  await page.locator(`[data-dilekce="${REF}"]`).click();
  const indi = await indirme;
  expect(indi.suggestedFilename()).toContain('imzaya hazir');
  expect(await imzaSayfalari(readFileSync(await indi.path()))).toEqual({ sayfa: 2, imza: [] });
});
