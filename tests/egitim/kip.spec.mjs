/**
 * Çalışma kipleri (Faz 2c, 24 Ekim 2026): «Bağlayarak ezberle» ve «Kademeli gizle» — gerçek tarayıcıda, derlenmiş çıktıya karşı.
 * Neden: kipin kararı saf kütüphanede sınanır (tests/ezber-kip.test.mjs); burada ekranın o kararı doğru çizdiği, klavye ve
 * dokunmayla kullanıldığı, sesin tek sahibi olduğu, depolama kapalıyken bozulmadığı ve CSP/erişilebilirlik kapısı sınanır.
 * Ses sahte: `play()` adresi kaydeder, `ended` testten tetiklenir; dış ağ kapalıdır.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync } from 'node:fs';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const ZINCIR = '#kip-panel-zincir';
const GIZLE = '#kip-panel-gizle';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__sesler = [];
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    HTMLMediaElement.prototype.play = function () { window.__ses = this; window.__sesler.push(new URL(this.src).pathname); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });
});

const halka = (page) => page.locator(`${ZINCIR} .kip-halka`);
const birincil = (page) => page.locator(`${ZINCIR} .kip-eylem .dugme.birincil`).first();
const sayac = (page) => page.locator(`${GIZLE} .kip-sayac`);
const seviye = (page, n) => page.locator(`${GIZLE} .kip-seviye-dugme`).nth(n);

for (const dil of DILLER) {
  test(`${dil}: zincir ve kademeli gizleme çalışır; CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.goto(`/${dil}/calis/s-ihlas/`);
    await expect(page.locator('[data-kip]')).toBeVisible();
    await expect(page.locator('#kip-sekme-zincir')).toHaveAttribute('aria-selected', 'true');
    await expect(halka(page)).toContainText(/1\s*\/\s*4/);

    // Üç dokunuş: okumaya hazırım → kontrol et → tam; ikinci halkaya geçilir ve kapsam iki âyettir.
    for (let i = 0; i < 3; i++) await birincil(page).click();
    await expect(halka(page)).toContainText(/2\s*\/\s*4/);
    await expect(page.locator(`${ZINCIR} .kip-birim`)).toHaveCount(2);
    // «Sondan başla»: ilk halka son âyettir.
    await page.locator(`${ZINCIR} .kip-onay input`).check();
    await expect(halka(page)).toContainText(/1\s*\/\s*4/);
    await expect(page.locator(`${ZINCIR} .kip-birim.yeni`)).toContainText('٤');

    await page.locator('#kip-sekme-gizle').click();
    await expect(page.locator(GIZLE)).toBeVisible();
    await expect(page.locator(ZINCIR)).toBeHidden();
    await expect(sayac(page)).toContainText(/15\s*\/\s*15/);
    await seviye(page, 2).click();
    await expect(sayac(page)).toContainText(/^\D*0\s*\/\s*15/);
    await expect(seviye(page, 2)).toHaveAttribute('aria-pressed', 'true');
    // Gizli kelimeye dokunmak onu bir adım açar (ilk harften tam kelimeye).
    await page.locator(`${GIZLE} .kelime.gizli`).first().click();
    await expect(sayac(page)).toContainText(/1\s*\/\s*15/);
    // İki «Tam» bir üst düzeye çıkarır.
    const tam = page.locator(`${GIZLE} .kip-sonuc .dugme.birincil`);
    await tam.click();
    await tam.click();
    await expect(seviye(page, 3)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`${GIZLE} .kip-durum`)).not.toBeEmpty();

    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('Klavye: sekmeler oklarla gezilir; düğmeler Enter ile çalışır; İpucu ve Kelimeyi aç kelimeleri açar', async ({ page }) => {
  await page.goto('/tr/calis/s-ihlas/');
  await page.locator('#kip-sekme-zincir').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#kip-sekme-gizle')).toBeFocused();
  await expect(page.locator('#kip-sekme-gizle')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#kip-sekme-gizle')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#kip-sekme-zincir')).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('Home');
  await expect(page.locator('#kip-sekme-zincir')).toBeFocused();
  // 2d: üçüncü sekme «Kendini sına»; End son sekmeye gider, sağ ok başa sarar, sol ok geri getirir.
  await page.keyboard.press('End');
  await expect(page.locator('#kip-sekme-sina')).toBeFocused();
  await expect(page.locator('#kip-sekme-sina')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#kip-sekme-zincir')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#kip-sekme-sina')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#kip-sekme-gizle')).toBeFocused();

  // 3. düzey: tamamı boş. Klavyeyle «İpucu» boş kelimeyi ilk harfe, «Kelimeyi aç» tam kelimeye çıkarır.
  await seviye(page, 3).focus();
  await page.keyboard.press('Enter');
  await expect(sayac(page)).toContainText(/^\D*0\s*\/\s*15/);
  await page.getByRole('button', { name: 'İpucu' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(`${GIZLE} .kelime.ilk`)).toHaveCount(1);
  await page.getByRole('button', { name: 'Kelimeyi aç' }).focus();
  await page.keyboard.press('Enter');
  await expect(sayac(page)).toContainText(/^\D*1\s*\/\s*15/);
  // Gizli kelimeler ekran okuyucudan gizlidir ve odak almaz.
  expect(await page.locator(`${GIZLE} .kelime.gizli[aria-hidden="true"]`).count()).toBeGreaterThan(10);
  expect(await page.locator(`${GIZLE} .kelime.gizli`).evaluateAll((l) => l.every((x) => x.tabIndex < 0 && !x.closest('button, a')))).toBe(true);
});

test('Ses: yeni parça ve hepsi çalınır, tek ses sahibi (çalar ile kip birbirini keser), hata iletisi', async ({ page }) => {
  await page.goto('/tr/calis/s-ihlas/');
  const ses = page.locator(`${ZINCIR} .kip-eylem .dugme.ikincil`);
  await ses.click();
  expect(await page.evaluate(() => window.__sesler)).toEqual(['/media/ses/ayet/112-1.mp3']);
  await expect(ses).toHaveText('Sesi durdur');
  await ses.click();
  await expect(ses).toHaveText('Yeni parçayı dinle');
  // Çalar başlayınca kip sesi kesilir; kip başlayınca çalar durur.
  await ses.click();
  await expect(ses).toHaveText('Sesi durdur');
  await page.locator('[data-sira]').selectOption('0');
  await page.locator('[data-oynat]').click();
  await expect(ses).toHaveText('Yeni parçayı dinle');
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  await ses.click();
  await expect(page.locator('[data-oynat]')).toHaveText('Dinlemeye başla');
  // Sondan zincir: yeni parça son âyet; kontrol evresinde bütün kapsam sırayla çalar.
  await page.evaluate(() => { window.__sesler.length = 0; });
  await page.locator(`${ZINCIR} .kip-onay input`).check();
  await ses.click();
  expect(await page.evaluate(() => window.__sesler)).toEqual(['/media/ses/ayet/112-4.mp3']);
  await birincil(page).click();
  await birincil(page).click();
  const hepsi = page.locator(`${ZINCIR} .kip-eylem .dugme.ikincil`).first();
  await page.evaluate(() => { window.__sesler.length = 0; });
  await hepsi.click();
  expect(await page.evaluate(() => window.__sesler)).toEqual(['/media/ses/ayet/112-4.mp3']);
  await page.evaluate(() => window.__ses.dispatchEvent(new Event('ended')));
  await expect(hepsi).toHaveText('Hepsini dinle');
  // Hata: kayıt açılamazsa uyarı çıkar, düğme eski hâline döner.
  await hepsi.click();
  await page.evaluate(() => window.__ses.dispatchEvent(new Event('error')));
  await expect(page.locator('.kip-hata')).toBeVisible();
  await expect(page.locator('.kip-hata')).toContainText('Ses çalınamadı');
  await expect(hepsi).toHaveText('Hepsini dinle');
});

test('Dinleyici kipi: Takıldı önce bölümün sesini çalar, sonra kelimeleri tek tek açar; sonraki bölüme geçilir', async ({ page }) => {
  await page.goto('/tr/calis/s-ihlas/');
  await page.locator('#kip-sekme-gizle').click();
  await page.getByRole('button', { name: 'Dinleyici kipi' }).click();
  await expect(page.getByRole('button', { name: 'Dinleyici kipi' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(`${GIZLE} .kip-sonuc`)).toBeHidden();
  await expect(sayac(page)).toContainText(/^\D*0\s*\/\s*15/);
  const takildi = page.getByRole('button', { name: 'Takıldı' });
  await takildi.click();
  expect(await page.evaluate(() => window.__sesler)).toEqual(['/media/ses/ayet/112-1.mp3']);
  await takildi.click();
  await expect(sayac(page)).toContainText(/^\D*1\s*\/\s*15/);
  await expect(page.locator(`${GIZLE} .kip-birim.simdiki`)).toContainText('١');
  await page.getByRole('button', { name: /Sonrakine geç/ }).click();
  await expect(page.locator(`${GIZLE} .kip-birim.simdiki`)).toContainText('٢');
  await takildi.click();
  expect(await page.evaluate(() => window.__sesler.at(-1))).toBe('/media/ses/ayet/112-2.mp3');
});

test('Ayarlar bu cihazda kalır: Arapça boyutu ve gizleme düzeyi; depolama kapalıyken sayfa bozulmaz', async ({ page }) => {
  await page.goto('/tr/calis/s-ihlas/');
  await expect(page.locator('.madde')).toHaveAttribute('data-ar-olcek', '1');
  await page.locator('[data-ar-arttir]').click();
  await page.locator('[data-ar-arttir]').click();
  await expect(page.locator('.madde')).toHaveAttribute('data-ar-olcek', '3');
  const once = await page.locator('.ayet-grubu .ar').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  await page.locator('#kip-sekme-gizle').click();
  await seviye(page, 3).click();
  await page.reload();
  await expect(page.locator('.madde')).toHaveAttribute('data-ar-olcek', '3');
  await expect(page.locator('#kip-sekme-gizle')).toHaveAttribute('aria-selected', 'true');
  await expect(seviye(page, 3)).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.ayet-grubu .ar').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBe(once);
  await page.locator('[data-ar-azalt]').click();
  await page.locator('[data-ar-azalt]').click();
  await page.locator('[data-ar-azalt]').click();
  await expect(page.locator('[data-ar-azalt]')).toBeDisabled();
  await expect(page.locator('.madde')).toHaveAttribute('data-ar-olcek', '0');
});

test('Depolama kapalıyken kipler çalışır ve hata vermez', async ({ browser }) => {
  const baglam = await browser.newContext();
  await baglam.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('kapalı', 'SecurityError'); } });
  });
  const page = await baglam.newPage();
  const hatalar = [];
  page.on('pageerror', (e) => hatalar.push(e.message));
  await page.goto(`${KOK}/tr/calis/s-ihlas/`);
  await expect(page.locator('[data-kip]')).toBeVisible();
  await birincil(page).click();
  await page.locator('#kip-sekme-gizle').click();
  await seviye(page, 1).click();
  await expect(sayac(page)).toContainText(/^\D*8\s*\/\s*15/);
  await page.locator('[data-ar-arttir]').click();
  await expect(page.locator('.madde')).toHaveAttribute('data-ar-olcek', '2');
  expect(hatalar).toEqual([]);
  await baglam.close();
});

test('Uzun madde (Nebe): kısım seçilir, zincir bitince sonraki kısıma geçilir', async ({ page }) => {
  await page.goto('/tr/calis/s-nebe/');
  const secici = page.locator(`${ZINCIR} .kip-alan select`);
  await expect(secici.locator('option')).toHaveCount(8);
  await expect(halka(page)).toContainText(/1\s*\/\s*5/);
  for (let i = 0; i < 15; i++) await birincil(page).click();
  await expect(page.locator(`${ZINCIR} .kip-metin .kip-birim`)).toHaveCount(5);
  const dugmeler = page.locator(`${ZINCIR} .kip-eylem button`);
  await expect(dugmeler).toHaveCount(3);
  await dugmeler.nth(1).click();
  await expect(secici).toHaveValue('1');
  await expect(halka(page)).toContainText(/1\s*\/\s*5/);
  await expect(page.locator(`${ZINCIR} .kip-birim.yeni`)).toContainText('٦');
  await secici.selectOption('7');
  await expect(page.locator(`${ZINCIR} .kip-birim.yeni`)).toContainText('٣٦');
  // Kısım seçimi gizleme ekranına da taşınır: yalnız o kısmın âyetleri görünür.
  await page.locator('#kip-sekme-gizle').click();
  await expect(page.locator(`${GIZLE} .kip-alan select`)).toHaveValue('7');
  await expect(page.locator(`${GIZLE} .kip-birim`)).toHaveCount(5);
});

test('Parça sesi olmayan dua: zincirde ses düğmesi yok ve not var; Takıldı doğrudan kelime açar', async ({ page }) => {
  await page.goto('/tr/calis/d-ettehiyyatu/');
  await expect(page.locator(`${ZINCIR} .kip-not`)).toBeVisible();
  await expect(page.locator(`${ZINCIR} .kip-eylem .dugme.ikincil`)).toHaveCount(0);
  await expect(page.locator(`${ZINCIR} .kip-birim`).first()).toContainText('1');
  await page.locator('#kip-sekme-gizle').click();
  await page.getByRole('button', { name: 'Dinleyici kipi' }).click();
  await page.getByRole('button', { name: 'Takıldı' }).click();
  await expect(sayac(page)).toContainText(/^\D*1\s*\/\s*\d+/);
  expect(await page.evaluate(() => window.__sesler)).toEqual([]);
});

test('Tek parçalı dua: zincir kurulamaz, kademeli gizle açılır; notla birlikte yönlendirme', async ({ page }) => {
  await page.goto('/tr/calis/d-ruku-tesbihi/');
  await expect(page.locator('#kip-sekme-gizle')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`${GIZLE} .kip-metin`)).toBeVisible();
  await page.locator('#kip-sekme-zincir').click();
  await expect(page.locator(`${ZINCIR} .kip-not`)).toBeVisible();
  await page.locator(`${ZINCIR} .dugme.birincil`).click();
  await expect(page.locator('#kip-sekme-gizle')).toBeFocused();
  await expect(page.locator(GIZLE)).toBeVisible();
});

// Sayfası olan ama metin dosyası olmayan maddeler (24 Ekim 2026'dan beri yok; sesli ya da Kur'anlı bir madde metinsiz eklenirse kapsanır).
const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
const metinDosyalari = new Set(readdirSync(new URL('../../src/data/ezber/metin/', import.meta.url)).filter((d) => d.endsWith('.json') && d !== 'metin.schema.json').map((d) => d.slice(0, -5)));
const METINSIZ = katalog.ogeler.filter((o) => (o.ses?.tam || o.ses?.parcalar?.length || o.kuran || o.metinli) && !metinDosyalari.has(o.id)).map((o) => o.id);

test('Metni olmayan sayfada (varsa) kip bölümü ve A−/A+ yoktur; metni olan Eûzü–Besmele ve sessiz Tekbir sayfasında vardır', async ({ page }) => {
  for (const id of METINSIZ) {
    await page.goto(`/tr/calis/${id}/`);
    await expect(page.locator('[data-kip]'), id).toHaveCount(0);
    await expect(page.locator('[data-ar-boyut]'), id).toHaveCount(0);
  }
  for (const id of ['d-euzu-besmele', 'd-tekbir']) {
    await page.goto(`/tr/calis/${id}/`);
    await expect(page.locator('[data-kip]'), id).toHaveCount(1);
    await expect(page.locator('[data-ar-boyut]'), id).toHaveCount(1);
  }
});

test.describe('JavaScript kapalı', () => {
  test.use({ javaScriptEnabled: false });
  test('Metin ve meâl okunur; çalışma kipleri gizli kalır', async ({ page }) => {
    await page.goto('/tr/calis/s-ihlas/');
    await expect(page.locator('.metin .ar').first()).toBeVisible();
    await expect(page.locator('[data-kip]')).toBeHidden();
    await expect(page.locator('[data-ar-boyut]')).toBeHidden();
  });
});
