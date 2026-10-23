import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFArray, decodePDFRawStream } from 'pdf-lib';

/* 23 Eki 2026 (Rıdvan KAYAHAN: «benim imzam ve başkan Ercan MOLA imzası otomatik gelmedi, belgeye … otomatik gelecek şekilde
   düzelt»): panelin yerel tek EK-9 belgesine kayıtlı şahit imzaları (Rıdvan KAYAHAN, Ercan MOLA) kendiliğinden gelir. İmzalar
   herkese açık depoda durmaz; panel bunları yetkili istekle (`islem=sahit-imzalari`) yalnız belleğe alır. Bu testte GAS taklit
   edilir ve imzalar SENTETİK şekillerdir; dış ağ kesilir. */

const REF = 'IH-2099-9999';
const SAHTE_DOLGU = JSON.stringify({ v: 2, w: 300, h: 120, p: [{ d: 'M10 100L60 20L110 100L90 100L60 50L30 100Z M150 20L290 20L290 40L150 40Z', f: 1, e: 1 }] });
const SAHTE_CIZGI = JSON.stringify({ v: 2, w: 240, h: 100, p: [{ d: 'M10 80C40 10 80 10 100 60L140 20L230 90', k: 3 }] });
const FOTO = 'data:image/png;base64,' + (await sharp({ create: { width: 300, height: 400, channels: 3, background: '#99a0b0' } }).png().toBuffer()).toString('base64');

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const hedef = new URL(route.request().url()).origin;
    if (hedef === 'http://127.0.0.1:4401') return route.continue();
    return route.abort();
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
});

/** imza: 'tamam' → iki sentetik imza, 'hata' → yetkili istek başarısız. Yapılan sahit-imzalari isteklerinin anahtar parametresi toplanır. */
async function panelHazirla(page, imza = 'tamam') {
  const istekler = [];
  await page.addInitScript(() => {
    localStorage.setItem('sveltia-cms.user', JSON.stringify({ token: 'test-token' }));
    localStorage.setItem('panel-oturum', JSON.stringify({ baslangic: Date.now() }));
    sessionStorage.setItem('panel-sirlar', JSON.stringify({ gh: 'test-token', gas: 'test-key' }));
  });
  await page.route('https://script.google.com/**', async (route) => {
    const url = new URL(route.request().url());
    const islem = url.searchParams.get('islem');
    if (islem === 'liste') return route.fulfill({
      json: { ok: true, surum: 43, kayitlar: { basliklar: [], satirlar: [] }, ihtidalar: {
        basliklar: ['Zaman damgası', 'Referans', 'Adı Soyadı', 'E-posta', 'PDF bağlantısı', 'Durum'],
        satirlar: [['09.09.2026 12:00', REF, 'Deniz Örnek', 'deniz@example.test', 'https://drive.google.com/file/d/test-summary-file-123/view', 'Yeni başvuru']],
      } },
    });
    if (islem === 'belge') return route.fulfill({ json: { ok: true,
      kayit: { 'Zaman damgası': '09.09.2026 12:00', 'Adı Soyadı': 'Deniz Örnek', 'Adres': 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika',
        'Doğum tarihi': '1990-05-20', 'Doğum yeri': 'Liège', 'Uyruk': 'Belçika', 'Telefon': '+32470000000', 'E-posta': 'deniz@example.test',
        'Form dili': 'fr', 'EK-10 rızası': 'Evet', 'EK-10 sürümü': '2026-10', 'İmza aktarım izni': 'Hayır', 'Belge teslim yeri': 'cami' },
      vesikalik: FOTO, basvuranImza: '', basvuranImzaVektor: '', gorseller: { imza: '', imzaVektor: '' } } });
    if (islem === 'sahit-imzalari') {
      istekler.push({ anahtar: url.searchParams.get('anahtar') });
      return route.fulfill({ json: imza === 'tamam' ? { ok: true, surum: 43, imzalar: { ercan: SAHTE_DOLGU, ridvan: SAHTE_CIZGI } } : { ok: false, hata: 'sahit-imzalari-okunamadi' } });
    }
    return route.fulfill({ json: { ok: true, surum: 43 } });
  });
  return istekler;
}

async function ek9Indir(page, { tikKaldir = [] } = {}) {
  page.on('dialog', (d) => d.accept());
  await page.goto('/admin/#basvurular');
  await page.locator('#sekme-ihtida').click();
  const dugme = page.locator(`[data-ek9="${REF}"]`);
  await expect(dugme).toBeVisible();
  await dugme.click();
  const pencere = page.getByRole('dialog', { name: 'EK-9 belgesini hazırlayın' });
  await expect(pencere).toBeVisible();
  for (const i of tikKaldir) await pencere.locator('input[type=checkbox]').nth(i).uncheck();
  const kutular = await pencere.locator('input[type=checkbox]').evaluateAll((l) => l.map((k) => ({ acik: !k.disabled, isaretli: k.checked })));
  const notlar = await pencere.locator('[data-imza-not]').allTextContents();
  const indirme = page.waitForEvent('download', { timeout: 30000 });
  await pencere.getByRole('button', { name: 'PDF’yi hazırla' }).click();
  const indi = await indirme;
  return { bytes: readFileSync(await indi.path()), kutular, notlar };
}

/** EK-9 ön yüzündeki vektör şahit imzaları: «q s 0 0 -s x y cm q <kalem mürekkebi>» (şablonun kendi cm'leri ayrışır). */
async function sahitImzalari(bytes) {
  const doc = await PDFDocument.load(bytes);
  const sayfa = doc.getPage(0), H = sayfa.getHeight();
  const c = sayfa.node.get(PDFName.of('Contents'));
  const akis = (c instanceof PDFArray ? c.asArray() : [c]).map((r) => Buffer.from(decodePDFRawStream(doc.context.lookup(r)).decode()).toString('latin1')).join('\n');
  const kutular = [...akis.matchAll(/q\s+(-?[\d.]+(?:e-?\d+)?) 0 0 -[\d.]+(?:e-?\d+)? (-?[\d.]+) (-?[\d.]+) cm\s+q\s+0\.1 0\.24 0\.62 (?:rg|RG)/g)]
    .map((m) => ({ x0: Number(m[2]), y0: H - Number(m[3]) }));
  return { sayfa: doc.getPageCount(), kutular, dolgu: /f\*/.test(akis) };
}

test('Panelin yerel EK-9 belgesine Ercan MOLA ve Rıdvan KAYAHAN imzaları otomatik, vektör olarak gelir', async ({ page }) => {
  const istekler = await panelHazirla(page);
  const { bytes, kutular } = await ek9Indir(page);
  expect(kutular).toEqual([{ acik: true, isaretli: true }, { acik: true, isaretli: true }]);
  expect(istekler).toEqual([{ anahtar: 'test-key' }]);          // yetkili istek, tek kez
  const s = await sahitImzalari(bytes);
  expect(s.sayfa).toBe(2);
  expect(s.kutular).toHaveLength(2);
  expect(s.dolgu).toBe(true);                                   // Ercan MOLA: dolgulu kontur (çift-tek)
  expect(s.kutular[0].x0).toBeGreaterThan(140); expect(s.kutular[0].x0).toBeLessThan(250);    // sol şahit yuvası
  expect(s.kutular[1].x0).toBeGreaterThan(588); expect(s.kutular[1].x0).toBeLessThan(700);    // sağ şahit yuvası
  for (const k of s.kutular) { expect(k.y0).toBeGreaterThan(431); expect(k.y0).toBeLessThan(462); }
});

test('İşareti kaldırılan şahidin imzası belgeye basılmaz', async ({ page }) => {
  await panelHazirla(page);
  const { bytes } = await ek9Indir(page, { tikKaldir: [0] });
  const s = await sahitImzalari(bytes);
  expect(s.kutular).toHaveLength(1);
  expect(s.kutular[0].x0).toBeGreaterThan(588);                 // yalnız sağdaki (Rıdvan KAYAHAN)
});

test('İmzalar alınamazsa kutular kapalı kalır, neden yazılır ve belge adlarla, imzasız çıkar', async ({ page }) => {
  await panelHazirla(page, 'hata');
  const { bytes, kutular, notlar } = await ek9Indir(page);
  expect(kutular).toEqual([{ acik: false, isaretli: false }, { acik: false, isaretli: false }]);
  for (const not of notlar) expect(not).toContain('alınamadı');
  expect((await sahitImzalari(bytes)).kutular).toHaveLength(0);
});
