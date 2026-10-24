/**
 * Kendi sesini kaydet — gerçek mikrofon yolu (Faz 2d, 24 Ekim 2026). Chromium'un sahte ses aygıtıyla (`--use-fake-device-for-media-stream`)
 * gerçek `getUserMedia` + `MediaRecorder` çalışır; `play()` BİLEREK sahte değildir: kaydın blob adresi gerçek bir <audio> ile
 * çalınır, böylece Hosting başlıklarındaki `Permissions-Policy: microphone=(self)` ve CSP `media-src blob:` gerçekten sınanır
 * (biri eksikse kayıt başlamaz ya da çalma CSP ihlali verir). Dış ağ kapalıdır. Kayıt sunucuya gitmez: ağ isteği sayılır.
 */
import { test, expect } from '@playwright/test';

const KOK = 'http://127.0.0.1:4402';

test.use({
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] },
  permissions: ['microphone'],
});

test('Kayıt başlar, durur, kendi kaydı çalınır (CSP ihlali yok), mikrofon bırakılır, kayıt silinir; ağa kayıt gitmez', async ({ page, context }) => {
  const istekler = [];
  await context.route('**/*', (r) => {
    const adres = new URL(r.request().url());
    if (adres.origin !== KOK) return r.abort();
    istekler.push(`${r.request().method()} ${adres.pathname}`);
    return r.continue();
  });
  await context.routeWebSocket(/.*/, (s) => s.close());
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    window.__akimlar = [];
    const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (c) => { const a = await gum(c); window.__akimlar.push(a); return a; };
  });
  await page.goto('/tr/calis/s-ihlas/');
  await page.locator('#kip-sekme-sina').click();
  await page.locator('#kip-panel-sina .sina-oyunlar [data-oyun="kayit"]').click();
  await page.getByRole('button', { name: 'Kaydı başlat' }).click();
  await expect(page.getByRole('button', { name: 'Kaydı durdur' })).toBeVisible();
  await expect(page.locator('#kip-panel-sina .sina-alan + .kip-durum')).toContainText('Kayıt sürüyor');
  // Kayıt sürerken hafızın kaydı çalınamaz (hoparlör sesi kayda karışmasın).
  await expect(page.getByRole('button', { name: 'Hafızın okuyuşunu dinle' })).toBeDisabled();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Kaydı durdur' }).click();
  await expect(page.locator('#kip-panel-sina .sina-alan + .kip-durum')).toHaveText('Kayıt hazır.');
  await expect(page.getByRole('button', { name: 'Kaydımı dinle' })).toBeVisible();
  // Mikrofon bırakıldı: açılan bütün akışların bütün kanalları bitmiş durumda (tarayıcının kırmızı göstergesi söner).
  expect(await page.evaluate(() => window.__akimlar.length)).toBe(1);
  expect(await page.evaluate(() => window.__akimlar.flatMap((a) => a.getTracks()).every((t) => t.readyState === 'ended'))).toBe(true);

  // Kendi kaydı gerçek <audio> ile blob adresinden çalınır; CSP engellemez.
  await page.getByRole('button', { name: 'Kaydımı dinle' }).click();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  await expect(page.locator('.kip-hata')).toBeHidden();

  await page.getByRole('button', { name: 'Kaydı sil' }).click();
  await expect(page.getByRole('button', { name: 'Kaydı başlat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kaydımı dinle' })).toBeHidden();
  // Ağ: yalnız sayfanın kendi varlıkları; kayıt hiçbir yere POST/PUT edilmedi.
  expect(istekler.filter((i) => !i.startsWith('GET '))).toEqual([]);
});

test('Sekme değişince kayıt durur ve silinir', async ({ page, context }) => {
  await context.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  await context.routeWebSocket(/.*/, (s) => s.close());
  await page.goto('/tr/calis/s-ihlas/');
  await page.locator('#kip-sekme-sina').click();
  await page.locator('#kip-panel-sina .sina-oyunlar [data-oyun="kayit"]').click();
  await page.getByRole('button', { name: 'Kaydı başlat' }).click();
  await expect(page.getByRole('button', { name: 'Kaydı durdur' })).toBeVisible();
  await page.locator('#kip-sekme-gizle').click();
  await page.locator('#kip-sekme-sina').click();
  // Panel yeniden açılınca oyun seçimi temizdir; kayıt oyununu yeniden açmak taze bir ekran verir.
  await page.locator('#kip-panel-sina .sina-oyunlar [data-oyun="kayit"]').click();
  await expect(page.getByRole('button', { name: 'Kaydı başlat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kaydı durdur' })).toBeHidden();
});
