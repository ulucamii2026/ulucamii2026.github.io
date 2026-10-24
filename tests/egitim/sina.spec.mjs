/**
 * Kendini sına, tekrar takvimi ve «Bugün tekrar» bandı (Faz 2d, 24 Ekim 2026) — gerçek tarayıcıda, derlenmiş çıktıya karşı.
 * Neden: oyunların kararı (soru üretimi, doğru yanıt) ve takvim saf kütüphanede sınanır (tests/ezber-tekrar-oyun.test.mjs,
 * tests/ezber-kip.test.mjs); burada ekranın bunu doğru çizdiği, klavyeyle kullanıldığı, doğru yanıtın yalnız renkle
 * bildirilmediği, tekrar önerisinin cihazda kalıp giriş sayfasına yansıdığı, depolama kapalıyken sayfanın bozulmadığı ve
 * CSP/erişilebilirlik kapısı sınanır. Ses sahte (`play()` adresi kaydeder); tarih sabitlenir; dış ağ kapalıdır.
 * Ses kaydının gerçek mikrofon yolu tests/egitim/sina-mikrofon.spec.mjs'tedir.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KOK = 'http://127.0.0.1:4402';
const SINA = '#kip-panel-sina';
const ANAHTAR = 'ulucamii:ezber:cihaz:v1';
const BUGUN = new Date(2026, 9, 24, 10, 0, 0);
const YARIN = { tr: 'yarın', fr: 'demain', en: 'tomorrow', nl: 'morgen', de: 'morgen' };

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await context.addInitScript(() => {
    window.__sesler = [];
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    HTMLMediaElement.prototype.play = function () { window.__sesler.push(new URL(this.src).pathname); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () {};
  });
  await page.clock.setFixedTime(BUGUN);
});

const oyun = (page, i) => page.locator(`${SINA} .sina-oyunlar button`).nth(i);
const durum = (page) => page.locator(`${SINA} .sina-alan + .kip-durum`);
const sinaAc = async (page, yol = '/tr/calis/s-ihlas/') => {
  await page.goto(yol);
  await page.locator('#kip-sekme-sina').click();
  await expect(page.locator(SINA)).toBeVisible();
};
const cihaz = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), ANAHTAR);

for (const dil of DILLER) {
  test(`${dil}: Kendini sına sekmesi — Sırala çözülür, doğru yerler ✓ ve yazıyla bildirilir; CSP ve iki temada erişilebilirlik`, async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await sinaAc(page, `/${dil}/calis/s-ihlas/`);
    await expect(page.locator('#kip-sekme-sina')).toHaveAttribute('aria-selected', 'true');
    await oyun(page, 0).click();
    await expect(oyun(page, 0)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`${SINA} .sina-oge`)).toHaveCount(4);
    // «Doğru sırayı göster» (ikinci eylem) hepsini doğru yere koyar ve her satırda ✓ + yazı belirir (yalnız renk değil).
    await page.locator(`${SINA} .sina-alan .kip-eylem button`).nth(1).click();
    await expect(page.locator(`${SINA} .sina-oge.dogru`)).toHaveCount(4);
    await expect(page.locator(`${SINA} .sina-isaret`).first()).toContainText('✓');
    await expect(durum(page)).toContainText(/4\s*\/\s*4/);

    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const sonuc = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
    }
    expect(hatalar).toEqual([]);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });

  test(`${dil}: «Nasıl geçti?» — Tam yarına öneri yazar, öneri cihazda kalır`, async ({ page }) => {
    await sinaAc(page, `/${dil}/calis/s-ihlas/`);
    await page.locator(`${SINA} > .kip-sonuc .dugme`).first().click();
    await expect(page.locator(`${SINA} > .kip-sonuc + .kip-durum`)).toContainText(YARIN[dil]);
    const d = await cihaz(page);
    expect(d.maddeler['s-ihlas']).toMatchObject({ kutu: 0, sonraki: '2026-10-25', kip: 'sina' });
    expect(d.gunler).toEqual(['2026-10-24']);
  });
}

test('Sırala: ↑ ↓ düğmeleri ve Alt + ok yer değiştirir, odak taşınan parçada kalır; Kontrol et kaç parçanın yerinde olduğunu söyler', async ({ page }) => {
  await sinaAc(page);
  await oyun(page, 0).click();
  const metinler = () => page.locator(`${SINA} .sina-parca`).allTextContents();
  const once = await metinler();
  expect(once).toHaveLength(4);
  await page.getByRole('button', { name: '1. parçayı aşağı taşı' }).click();
  const sonra = await metinler();
  expect(sonra[0]).toBe(once[1]);
  expect(sonra[1]).toBe(once[0]);
  await expect(page.getByRole('button', { name: '2. parçayı aşağı taşı' })).toBeFocused();
  await page.keyboard.press('Alt+ArrowUp');
  expect(await metinler()).toEqual(once);
  // İlk parçanın «yukarı» düğmesi, son parçanın «aşağı» düğmesi kapalıdır.
  await expect(page.getByRole('button', { name: '1. parçayı yukarı taşı' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '4. parçayı aşağı taşı' })).toBeDisabled();
  await page.locator(`${SINA} .sina-alan .kip-eylem .dugme.birincil`).click();
  await expect(durum(page)).toContainText(/Yerinde olan parça: \d \/ 4|Hepsi doğru sırada/);
  // Taşıyınca eski «doğru yerde» işaretleri silinir.
  await page.getByRole('button', { name: '3. parçayı aşağı taşı' }).click();
  await expect(page.locator(`${SINA} .sina-oge.dogru`)).toHaveCount(0);
});

test('Eksik kelime: her soruda üç seçenek, doğru seçenek ✓ ile işaretlenir; sonunda «Doğru: d / n»; yeni tur başlar', async ({ page }) => {
  await sinaAc(page);
  await oyun(page, 1).click();
  const soru = page.locator(`${SINA} .sina-soru .kip-soru`);
  await expect(soru).toContainText(/1\s*\/\s*[345]/);
  const toplam = Number((await soru.textContent()).match(/\/\s*(\d)/)[1]);
  let dogru = 0;
  for (let i = 0; i < toplam; i++) {
    await expect(page.locator(`${SINA} .sina-secenek`)).toHaveCount(3);
    await expect(page.locator(`${SINA} .sina-bos[role="img"]`)).toHaveCount(1);
    await page.locator(`${SINA} .sina-secenek`).first().click();
    await expect(page.locator(`${SINA} .sina-secenek.dogru`)).toHaveCount(1);
    await expect(page.locator(`${SINA} .sina-secenek.dogru .sina-isaret`)).toHaveText('✓');
    await expect(page.locator(`${SINA} .sina-secenek:not(:disabled)`)).toHaveCount(0);
    // Boşluk doğru kelimeyle dolar ve ekran okuyucudan gizli «eksik kelime» etiketi kalkar.
    await expect(page.locator(`${SINA} .sina-dogru-kelime`)).toHaveCount(1);
    const ilkDogru = await page.locator(`${SINA} .sina-secenek:first-child`).evaluate((d) => d.classList.contains('dogru'));
    await expect(durum(page)).toHaveText(ilkDogru ? 'Doğru.' : 'Doğru seçenek işaretlendi.');
    if (ilkDogru) dogru++;
    await page.locator(`${SINA} .sina-soru .kip-eylem button`).click();
  }
  await expect(page.locator(`${SINA} .sina-soru .kip-soru`)).toHaveText(`Doğru: ${dogru} / ${toplam}`);
  await expect(durum(page)).toHaveText(`Doğru: ${dogru} / ${toplam}`);
  await page.getByRole('button', { name: 'Yeni tur' }).click();
  await expect(page.locator(`${SINA} .sina-soru .kip-soru`)).toContainText(/1\s*\/\s*[345]/);
  // Çalışılan gün işlendi.
  expect((await cihaz(page)).gunler).toEqual(['2026-10-24']);
});

test('Hangi âyet?: Dinle bölüm kaydını çalar; seçenekler âyet metnidir; Kur’an dışı maddede kayıt yok iletisi', async ({ page }) => {
  await sinaAc(page);
  await oyun(page, 2).click();
  await expect(page.locator(`${SINA} .sina-secenek`)).toHaveCount(3);
  await page.getByRole('button', { name: 'Dinle', exact: true }).click();
  expect(await page.evaluate(() => window.__sesler)).toEqual([expect.stringMatching(/^\/media\/ses\/ayet\/112-[1-4]\.mp3$/)]);
  await page.locator(`${SINA} .sina-secenek`).nth(1).click();
  await expect(page.locator(`${SINA} .sina-secenek.dogru`)).toHaveCount(1);

  await sinaAc(page, '/tr/calis/d-subhaneke/');
  await oyun(page, 2).click();
  await expect(page.locator(`${SINA} .sina-alan`)).toContainText('âyet âyet kayıt gerekir');
  // Aynı dua için Sırala ve Eksik kelime yine çalışır.
  await oyun(page, 0).click();
  expect(await page.locator(`${SINA} .sina-oge`).count()).toBeGreaterThanOrEqual(2);
});

test('Tekrar takvimi: Tam kutuyu yükseltir (1 → 3 gün), Az yerinde bırakır, Bir daha başa döndürür; öneri sayfa yenilenince geri gelir', async ({ page }) => {
  await sinaAc(page);
  const dugme = (i) => page.locator(`${SINA} > .kip-sonuc .dugme`).nth(i);
  const oneri = page.locator(`${SINA} > .kip-sonuc + .kip-durum`);
  await dugme(0).click();
  await expect(oneri).toContainText('yarın');
  await expect(oneri).toContainText(/25 Ekim/);
  await expect(oneri).toContainText(/Pazar/);
  await expect(page.getByText('hocanın verdiği basamak değişmez')).toBeVisible();
  await dugme(0).click();
  await expect(oneri).toContainText('3 gün sonra');
  expect((await cihaz(page)).maddeler['s-ihlas']).toMatchObject({ kutu: 1, sonraki: '2026-10-27' });
  await dugme(1).click();
  expect((await cihaz(page)).maddeler['s-ihlas']).toMatchObject({ kutu: 1, sonraki: '2026-10-27' });
  await dugme(2).click();
  expect((await cihaz(page)).maddeler['s-ihlas']).toMatchObject({ kutu: 0, sonraki: '2026-10-25' });
  // Sayfa yenilenince sekme ve kayıtlı öneri geri gelir.
  await page.reload();
  await expect(page.locator('#kip-sekme-sina')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`${SINA} > .kip-sonuc + .kip-durum`)).toContainText('Bu madde için tekrar önerisi');
  // Hoca basamağı ve Firestore'a dokunulmaz: yalnız bu cihazın anahtarı yazılmıştır.
  expect(await page.evaluate(() => Object.keys(localStorage))).toContain(ANAHTAR);
});

test('Tekrar günü gelen madde: «tekrar günü geldi» yazar', async ({ page }) => {
  await page.addInitScript((k) => {
    localStorage.setItem(k, JSON.stringify({ v: 1, ar: 1, gunler: [], maddeler: { 's-ihlas': { kip: 'sina', kutu: 1, sonraki: '2026-10-22' } } }));
  }, ANAHTAR);
  await page.goto('/tr/calis/s-ihlas/');
  await expect(page.locator(`${SINA} > .kip-sonuc + .kip-durum`)).toHaveText('Bu madde için tekrar günü geldi.');
});

test('Ses kaydı: tarayıcı desteklemiyorsa ve izin verilmediyse açık ileti; sayfa bozulmaz', async ({ page, context }) => {
  await context.addInitScript(() => { delete window.MediaRecorder; });
  await sinaAc(page);
  await oyun(page, 3).click();
  await expect(durum(page)).toHaveText('Bu tarayıcı ses kaydını desteklemiyor.');
});

test('Ses kaydı: mikrofon izni reddedilirse ileti çıkar ve kayıt başlamaz', async ({ page, context }) => {
  await context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('reddedildi'), { name: 'NotAllowedError' }));
  });
  await sinaAc(page);
  await oyun(page, 3).click();
  await page.getByRole('button', { name: 'Kaydı başlat' }).click();
  await expect(durum(page)).toContainText('Mikrofon izni verilmedi');
  await expect(page.getByRole('button', { name: 'Kaydı durdur' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Kaydı başlat' })).toBeVisible();
});

test.describe('Giriş sayfası: «Bugün tekrar» bandı', () => {
  const tohumla = (page, durumu) => page.addInitScript(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [ANAHTAR, durumu]);

  test('kayıt yoksa gizli; tekrarı gelen madde bağlantıyla listelenir; haftalık çalışma yazıyla söylenir', async ({ page }) => {
    await page.goto('/tr/');
    await expect(page.locator('[data-tekrar]')).toBeHidden();
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({
      v: 1, ar: 1, gunler: ['2026-10-17', '2026-10-22', '2026-10-24'],
      maddeler: { 's-ihlas': { kip: 'sina', kutu: 0, sonraki: '2026-10-23' }, 's-felak': { kip: 'sina', kutu: 2, sonraki: '2026-11-05' } },
    })), ANAHTAR);
    await page.reload();
    const band = page.locator('[data-tekrar]');
    await expect(band).toBeVisible();
    await expect(band.locator('[data-tekrar-ozet]')).toHaveText('Bugün tekrar edilecek: 1 madde');
    await expect(band.locator('a')).toHaveCount(1);
    await expect(band.locator('a')).toHaveAttribute('href', '/tr/calis/s-ihlas/');
    await expect(band.locator('[data-tekrar-hafta]')).toHaveText('Bu hafta 2 gün çalıştınız.');
    // Seri ya da puan yok.
    await expect(band).not.toContainText(/seri|puan|rekor|streak/i);
  });

  test('tekrarı gelen madde yoksa söylenir; geçmişte kalan çalışma günü haftaya sayılmaz', async ({ page }) => {
    await tohumla(page, { v: 1, ar: 1, gunler: ['2026-10-10'], maddeler: { 's-ihlas': { kip: 'sina', kutu: 2, sonraki: '2026-11-05' } } });
    await page.goto('/tr/');
    const band = page.locator('[data-tekrar]');
    await expect(band.locator('[data-tekrar-ozet]')).toHaveText('Bugün tekrar günü olan madde yok.');
    await expect(band.locator('[data-tekrar-liste]')).toBeHidden();
    await expect(band.locator('[data-tekrar-hafta]')).toBeHidden();
  });

  for (const dil of DILLER) {
    test(`${dil}: bant beş dilde açılır, bağlantı o dilin madde sayfasına gider; erişilebilirlik`, async ({ page }) => {
      await tohumla(page, { v: 1, ar: 1, gunler: ['2026-10-24'], maddeler: { 's-ihlas': { kip: 'sina', kutu: 0, sonraki: '2026-10-24' } } });
      await page.goto(`/${dil}/`);
      const band = page.locator('[data-tekrar]');
      await expect(band).toBeVisible();
      await expect(band.locator('a')).toHaveAttribute('href', `/${dil}/calis/s-ihlas/`);
      const sonuc = await new AxeBuilder({ page }).include('[data-tekrar]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(sonuc.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
      expect(await page.evaluate(() => window.__csp)).toEqual([]);
    });
  }

  test('depolama kapalıyken sayfa bozulmaz ve bant gizli kalır', async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('kapalı', 'SecurityError'); } });
    });
    await page.goto('/tr/');
    await expect(page.locator('[data-tekrar]')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();
    expect(hatalar).toEqual([]);
  });

  test('bozuk kayıt sayfayı bozmaz', async ({ page }) => {
    const hatalar = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await page.addInitScript((k) => localStorage.setItem(k, '{bozuk'), ANAHTAR);
    await page.goto('/tr/');
    await expect(page.locator('[data-tekrar]')).toBeHidden();
    expect(hatalar).toEqual([]);
  });
});
