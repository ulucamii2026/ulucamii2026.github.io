import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const katalog = JSON.parse(readFileSync(new URL('../../src/data/ezber/katalog.json', import.meta.url), 'utf8'));
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => new URL(r.request().url()).origin === KOK ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__sesler = []; window.__kayitlar = []; window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    HTMLMediaElement.prototype.play = function () {
      window.__ses = this; window.__kayitlar.push(this); window.__sesler.push({ src: this.src, hiz: this.playbackRate });
      if (window.__hata) return Promise.reject(new Error('Bağlantı yok'));
      if (window.__gecik) return new Promise((resolve, reject) => { window.__reddet = reject; window.__coz = resolve; });
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () { this.__duraklatildi = true; };
  });
});
const bitir = (page) => page.evaluate(() => window.__ses.dispatchEvent(new Event('ended')));

for (const dil of DILLER) {
  test(`${dil}: çalışma, dil geçişi, CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.goto(`/${dil}/calis/s-fatiha/`);
    await expect(page.locator('h1')).toHaveText(katalog.ogeler.find((o) => o.id === 's-fatiha').ad[dil]);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://egitim.ulucamii.be/${dil}/calis/s-fatiha/`);
    expect(await page.locator('.diller a').evaluateAll((a) => a.map((x) => x.pathname))).toEqual(DILLER.map((d) => `/${d}/calis/s-fatiha/`));
    await expect(page.locator('[data-oynat]')).toBeEnabled();
    expect(await page.evaluate(() => window.__sesler)).toEqual([]);
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
    }
    await page.locator('.diller a[lang="fr"]').click();
    await expect(page).toHaveURL('/fr/calis/s-fatiha/');
    await page.locator('.calisma-geri').click();
    await expect(page).toHaveURL('/fr/#m-s-fatiha');
    await expect(page.locator('#m-s-fatiha')).toBeInViewport();
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

test('Her parça üç kez; hız, duraklat/devam, bitiş ve yeniden başlatma', async ({ page }) => {
  await page.goto('/tr/calis/d-euzu-besmele/');
  await page.locator('[data-sira]').selectOption('0');
  await page.locator('[data-hiz]').selectOption('0.75');
  await page.locator('[data-oynat]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  expect(await page.evaluate(() => window.__ses.playbackRate)).toBe(.75);
  await page.locator('[data-oynat]').click();
  await expect(page.locator('[data-oynat]')).toHaveText('Devam et');
  await page.locator('[data-oynat]').click();
  await bitir(page); await bitir(page); await bitir(page);
  expect(await page.evaluate(() => window.__ses.src)).toMatch(/\/media\/ses\/ayet\/1-1\.mp3$/);
  await bitir(page); await bitir(page); await bitir(page);
  await expect(page.locator('.calisma-durum')).toContainText('tamamlandı');
  await expect(page.locator('[data-durdur]')).toBeDisabled();
  const sesler = await page.evaluate(() => window.__sesler.map((s) => new URL(s.src).pathname));
  expect(sesler).toEqual([...Array(4).fill('/media/ses/ayet/1-0.mp3'), ...Array(3).fill('/media/ses/ayet/1-1.mp3')]);
  await page.locator('[data-oynat]').click();
  expect(await page.evaluate(() => window.__ses.src)).toMatch(/\/media\/ses\/ayet\/1-0\.mp3$/);
});

test('Seçili bölüm, tek dinleyiş, durdurma ve eski kaydın geç gelen hatası', async ({ page }) => {
  await page.goto('/tr/calis/d-euzu-besmele/');
  await page.locator('[data-sira]').selectOption('0');
  await page.locator('[data-bolum]').selectOption('1');
  await page.locator('[data-tekrar]').selectOption('1');
  await page.locator('[data-oynat]').click();
  expect(await page.evaluate(() => window.__ses.src)).toMatch(/\/media\/ses\/ayet\/1-1\.mp3$/);
  await bitir(page);
  await expect(page.locator('.calisma-durum')).toContainText('tamamlandı');
  await page.locator('[data-oynat]').click();
  await page.locator('[data-bolum]').selectOption('0');
  await expect(page.locator('[data-oynat]')).toHaveText('Dinlemeye başla');
  await page.locator('[data-oynat]').click();
  await page.evaluate(() => window.__kayitlar[0].dispatchEvent(new Event('error')));
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  await page.locator('[data-durdur]').click();
  await expect(page.locator('.calisma-durum')).toContainText('Hazır');
});

test('Tekrar arası duraklatılabilir; durdurma bekleyen zamanlayıcıyı iptal eder', async ({ page }) => {
  await page.clock.install();
  await page.goto('/tr/calis/d-euzu-besmele/');
  await page.locator('[data-oynat]').click();
  await bitir(page);
  await expect(page.locator('.calisma-durum')).toContainText('Şimdi siz');
  await page.locator('[data-oynat]').click();
  await page.clock.fastForward(4000);
  expect(await page.evaluate(() => window.__sesler.length)).toBe(1);
  await page.locator('[data-oynat]').click();
  await page.clock.fastForward(3000);
  expect(await page.evaluate(() => window.__sesler.length)).toBe(2);
  await bitir(page);
  await page.locator('[data-oynat]').click();
  await page.locator('[data-sira]').selectOption('0');
  await page.locator('[data-oynat]').click();
  expect(await page.evaluate(() => window.__sesler.length)).toBe(3);
  await page.locator('[data-sira]').selectOption('1');
  await bitir(page);
  await page.locator('[data-durdur]').click();
  await page.clock.fastForward(4000);
  expect(await page.evaluate(() => window.__sesler.length)).toBe(3);
});

test('Senin sıran arası kaydın süresiyle ölçeklenir: ×1, ×2, 0,75× hızda daha uzun; «Yok» hemen geçer; süre ölçülemezse 3 sn', async ({ page }) => {
  await page.clock.install();
  await page.goto('/tr/calis/d-euzu-besmele/');
  const sayi = () => page.evaluate(() => window.__sesler.length);
  const sureVer = (sn) => page.evaluate((x) => Object.defineProperty(window.__ses, 'duration', { value: x, configurable: true }), sn);
  const cubuk = page.locator('[data-sira-ilerleme]');
  const kok = page.locator('[data-calisma]');
  // Varsayılan «Dinleme süresi kadar» (×1): 10 sn’lik kayıttan sonra 10 sn beklenir; çubuk dolar, ekran okuyucudan gizlidir.
  await expect(page.locator('[data-sira]')).toHaveValue('1');
  await expect(cubuk).toHaveAttribute('aria-hidden', 'true');
  await page.locator('[data-oynat]').click();
  await sureVer(10);
  await bitir(page);
  await expect(page.locator('.calisma-durum')).toContainText('Şimdi siz');
  await expect(kok).toHaveAttribute('data-senin-siran', '');
  await expect(cubuk).toHaveAttribute('data-aktif', '');
  await page.clock.runFor(5000);
  const yari = await cubuk.evaluate((e) => e.value);
  expect(yari).toBeGreaterThan(0.4);
  expect(yari).toBeLessThan(0.6);
  await page.clock.runFor(4000);
  expect(await sayi()).toBe(1);
  await page.clock.runFor(1500);
  expect(await sayi()).toBe(2);
  await expect(kok).not.toHaveAttribute('data-senin-siran');
  await expect(cubuk).not.toHaveAttribute('data-aktif');

  // ×2: 5 sn’lik kayıt → 10 sn.
  await page.locator('[data-sira]').selectOption('2');
  await sureVer(5);
  await bitir(page);
  await page.clock.runFor(9500);
  expect(await sayi()).toBe(2);
  await page.clock.runFor(1000);
  expect(await sayi()).toBe(3);

  // 0,75× hız, ×1: 6 sn’lik kayıt gerçekte 8 sn sürer; çocuk da o kadar bekler.
  await page.locator('[data-sira]').selectOption('1');
  await page.locator('[data-hiz]').selectOption('0.75');
  await sureVer(6);
  await bitir(page);
  await page.clock.runFor(7500);
  expect(await sayi()).toBe(3);
  await page.clock.runFor(1000);
  expect(await sayi()).toBe(4);

  // Bekleme sürerken «Yok» seçilirse hemen sıradakine geçilir.
  await sureVer(10);
  await bitir(page);
  await page.clock.runFor(2000);
  expect(await sayi()).toBe(4);
  await page.locator('[data-sira]').selectOption('0');
  expect(await sayi()).toBe(5);
  await expect(kok).not.toHaveAttribute('data-senin-siran');

  // Süre ölçülemezse (NaN) eski sabit 3 sn kullanılır.
  await page.locator('[data-sira]').selectOption('1');
  await page.locator('[data-hiz]').selectOption('1');
  await bitir(page);
  await page.clock.runFor(2500);
  expect(await sayi()).toBe(5);
  await page.clock.runFor(700);
  expect(await sayi()).toBe(6);
});

test('Senin sıran seçenekleri beş dilde aynı dört değerdir; durdurma çubuğu ve bekleyen süreyi sıfırlar', async ({ page }) => {
  await page.clock.install();
  for (const dil of DILLER) {
    await page.goto(`/${dil}/calis/d-euzu-besmele/`);
    expect(await page.locator('[data-sira] option').evaluateAll((o) => o.map((x) => x.value))).toEqual(['0', '1', '1.5', '2']);
    await expect(page.locator('[data-sira]')).toHaveValue('1');
    await expect(page.locator('[data-sira-ilerleme]')).toHaveAttribute('aria-hidden', 'true');
  }
  await page.goto('/tr/calis/d-euzu-besmele/');
  await page.locator('[data-oynat]').click();
  await page.evaluate(() => Object.defineProperty(window.__ses, 'duration', { value: 10, configurable: true }));
  await bitir(page);
  await expect(page.locator('[data-sira-ilerleme]')).toHaveAttribute('data-aktif', '');
  await page.locator('[data-durdur]').click();
  await expect(page.locator('[data-sira-ilerleme]')).not.toHaveAttribute('data-aktif');
  await expect(page.locator('[data-calisma]')).not.toHaveAttribute('data-senin-siran');
  await page.clock.runFor(15000);
  expect(await page.evaluate(() => window.__sesler.length)).toBe(1);
});

test('Ses hatası kurtarılabilir; eski play reddi yeni bölümü durduramaz', async ({ page }) => {
  await page.goto('/tr/calis/d-euzu-besmele/');
  await page.evaluate(() => { window.__hata = true; });
  await page.locator('[data-oynat]').click();
  await expect(page.locator('.calisma-durum')).toContainText('Ses çalınamadı');
  await page.evaluate(() => { window.__hata = false; window.__gecik = true; });
  await page.locator('[data-oynat]').click();
  await page.locator('[data-bolum]').selectOption('1');
  await page.evaluate(() => { window.__gecik = false; });
  await page.locator('[data-oynat]').click();
  await page.evaluate(() => window.__reddet(new Error('Eski istek')));
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  await expect(page.locator('.calisma-durum')).toContainText('Bölüm 2');
});

test('Katalogda sesi ya da metni olan maddeler çalışmaya bağlanır; tek kayıt ve ezan vakit notu', async ({ page }) => {
  await page.goto('/tr/');
  const baglar = await page.locator('.maddeler a[href*="/calis/"]').evaluateAll((a) => a.map((x) => x.pathname).sort());
  // calismaSayfasiVar (src/lib/ezber/katalog.ts) ile aynı koşul: Diyanet sesi, Kur'an metni, bilgi metni ya da (sessiz dualarda) metinli işareti.
  expect(baglar).toEqual(katalog.ogeler.filter((o) => o.ses || o.kuran || o.bilgiMetni || o.metinli).map((o) => `/tr/calis/${o.id}/`).sort());
  await page.goto('/tr/calis/d-ezan/');
  // Ezan: varsayılan sabah kaydı; vakit seçimi ve beş vaktin ayrıntısı tests/egitim/ezan-vakit.spec.mjs'te.
  await expect(page.locator('.calisma-not')).toContainText('Diyanet');
  await expect(page.locator('.calisma-not')).not.toContainText('tek kayıt'); // beş vaktin kaydı var: «tek kayıt» denmez
  await expect(page.locator('.vakit-notu:visible')).toHaveText('Bu kayıt sabah ezanıdır.');
  await expect(page.locator('[data-bolum] option')).toHaveCount(1);
});

test('Metinde âyet numarasına dokununca o âyet çalar ve vurgulanır; başka âyete dokununca vurgu ona geçer', async ({ page }) => {
  await page.goto('/tr/calis/s-fatiha/');
  await expect(page.locator('[data-dokun-ipucu]')).toBeVisible();
  const ucuncu = page.locator('button.ayet-no').nth(2);
  await expect(ucuncu).toBeEnabled();
  await page.locator('[data-sira]').selectOption('0');
  await ucuncu.click();
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  expect(await page.evaluate(() => window.__sesler.at(-1).src)).toMatch(/\/media\/ses\/ayet\/1-3\.mp3$/);
  await expect(ucuncu).toHaveAttribute('data-calan', '');
  await expect(page.locator('.ayet[data-no="3"]')).toHaveAttribute('data-calan', '');
  await expect(page.locator('[data-calan]')).toHaveCount(2);
  // Tek bölüm seçildi: üç tekrar bitince çalar durur; başka âyete dokunmak onu çalar, vurgu ona geçer.
  for (let i = 0; i < 3; i++) await bitir(page);
  await expect(page.locator('[data-oynat]')).not.toHaveText('Duraklat');
  await page.locator('button.ayet-no').nth(6).click();
  expect(await page.evaluate(() => window.__sesler.at(-1).src)).toMatch(/\/1-7\.mp3$/);
  await expect(page.locator('.ayet[data-no="7"]')).toHaveAttribute('data-calan', '');
  await expect(page.locator('.ayet[data-no="3"]')).not.toHaveAttribute('data-calan', '');
});

test('Duraklatılan play isteğinin gecikmiş reddi devam eden aynı kaydı kesmez', async ({ page }) => {
  await page.goto('/tr/calis/d-euzu-besmele/');
  await page.evaluate(() => { window.__gecik = true; });
  await page.locator('[data-oynat]').click();
  await page.locator('[data-oynat]').click();
  await page.evaluate(() => { window.__gecik = false; });
  await page.locator('[data-oynat]').click();
  await page.evaluate(() => window.__reddet(Object.assign(new Error('İptal edildi'), { name: 'AbortError' })));
  await expect(page.locator('[data-oynat]')).toHaveText('Duraklat');
  await expect(page.locator('.calisma-durum')).toContainText('Bölüm 1');
});

test('Depolama kapalıyken ve 320 px ekranda çalışma açılır', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Kapalı'); }; });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/de/calis/d-rabbena-atina/');
  await expect(page.locator('[data-oynat]')).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
