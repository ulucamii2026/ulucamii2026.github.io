import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mektepAc } from './helpers/mektep.mjs';

/* Hoca ekranı — isteğe bağlı iki adımlı doğrulama (TOTP), 12 Kasım 2026. Auth emülatörü TOTP'yi desteklemez; Firebase Auth modülü
   mektep.mjs içinde sahtelenir (window.__mfa). Burada: faktörsüz girişin eskisi gibi olması, kod sınaması (yanlış/doğru kod, geri dönüş),
   Hesap sekmesinde aç/kapat, TOTP'nin projede kapalı olması, tarayıcı diyaloğu (confirm/alert) kullanılmaması, beş dilden ikisi, erişilebilirlik. */

const ogrenciler = [{ ref: 'TEST-1', ad: 'Örnek', soyad: 'Talebe', veliler: ['veli@example.test'] }];
const faktor = { uid: 'F1', factorId: 'totp', displayName: 'Authenticator' };

async function girisYap(page) {
  await page.locator('[data-form=giris] input[name=eposta]').fill('hoca@example.test');
  await page.locator('[data-form=giris] input[name=sifre]').fill('Ornek-parola-1');
  await page.locator('[data-form=giris] button[type=submit]').click();
}
async function hesapSekmesi(page) {
  await page.locator('[role=tab][data-sekme=hesap]').click();
  await expect(page.locator('[data-mfa]')).toBeVisible();
}
const diyaloglar = new WeakMap();
test.beforeEach(async ({ page }) => {
  const liste = []; diyaloglar.set(page, liste);
  page.on('dialog', (x) => { liste.push(x.type() + ': ' + x.message()); void x.dismiss(); });
});
test.afterEach(async ({ page }) => { expect(diyaloglar.get(page), 'tarayıcı diyaloğu (confirm/alert/prompt) açılmamalı').toEqual([]); });

test('faktörsüz hesap: şifreyle giriş eskisi gibi, kod ekranı çıkmaz', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {}, mfa: { girisIster: false } });
  await girisYap(page);
  await expect(page.locator('[data-sekme=odev]')).toBeVisible();
  await expect(page.locator('[data-mfa-giris]')).toHaveCount(0);
});

test('faktörlü hesap: şifreden sonra 6 haneli kod istenir; yanlış kod hata verir, doğru kod girişi tamamlar', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {}, mfa: { girisIster: true, dogruKod: '123456' } });
  await girisYap(page);
  const kod = page.locator('[data-mfa-giris] input[name=kod]');
  await expect(kod).toBeVisible();
  await expect(kod).toHaveAttribute('autocomplete', 'one-time-code');
  await expect(kod).toHaveAttribute('inputmode', 'numeric');
  await expect(kod).toBeFocused();
  await expect(page.locator('[data-sekme=odev]')).toHaveCount(0); // kod girilmeden ekran açılmaz

  await kod.fill('12ab');
  await page.locator('[data-mfa-giris] button[type=submit]').click();
  await expect(page.locator('[data-mfa-giris] [data-mesaj]')).toContainText('6 haneli');

  await kod.fill('000000');
  await page.locator('[data-mfa-giris] button[type=submit]').click();
  const hata = page.locator('[data-mfa-giris] [data-mesaj]');
  await expect(hata).toContainText('Kod yanlış ya da süresi dolmuş');
  await expect(hata).toHaveAttribute('role', 'alert');
  await expect(kod).toHaveValue('');
  await expect(kod).toBeFocused();
  await expect(page.locator('[data-sekme=odev]')).toHaveCount(0);

  await kod.fill('123 456'); // uygulamalar «123 456» gösterir
  await page.locator('[data-mfa-giris] button[type=submit]').click();
  await expect(page.locator('[data-sekme=odev]')).toBeVisible();
  const cagri = await page.evaluate(() => window.__mfa.cagrilar.filter((c) => c[0] === 'resolveSignIn').map((c) => c[1]));
  expect(cagri.at(-1)).toEqual({ uid: 'F1', kod: '123456' });
});

test('kod ekranından «Girişe dön» giriş formunu geri getirir', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {}, mfa: { girisIster: true, dogruKod: '123456' } });
  await girisYap(page);
  await page.locator('[data-mfa-geri]').click();
  await expect(page.locator('[data-form=giris]')).toBeVisible();
  await expect(page.locator('[data-mfa-giris]')).toHaveCount(0);
});

test('Hesap sekmesi: kapalıyken açma akışı (kare kod + anahtar + bağlantı), yanlış ve doğru kod', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: {}, mfa: { dogruKod: '123456', kayitli: [] } });
  await hesapSekmesi(page);
  const bolum = page.locator('[data-mfa]');
  await expect(bolum).toContainText('Kapalı: hesap yalnız şifreyle korunuyor.');
  await bolum.locator('[data-mfa-ac]').click();
  await expect(bolum.locator('svg.mfa-kare')).toBeVisible(); // kare kod yerelde çizilir (qrcode paketi, satır içi SVG)
  expect(await bolum.locator('svg.mfa-kare path').getAttribute('d')).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
  await expect(bolum.locator('[data-mfa-anahtar]')).toHaveText('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP');
  await expect(bolum.locator('[data-mfa-baglanti]')).toHaveAttribute('href', /^otpauth:\/\/totp\/Ulu Camii:/);
  await expect(bolum.locator('input[name=kod]')).toBeFocused();
  await expect(bolum.locator('input[name=kod]')).toHaveAttribute('autocomplete', 'one-time-code');
  // gizli anahtar sayfa dışına gitmez: tek istek kaynağı yok (mektepAc dış istekleri keser), localStorage'a yazılmaz
  expect(await page.evaluate(() => JSON.stringify(localStorage).includes('JBSW'))).toBe(false);

  await bolum.locator('input[name=kod]').fill('000000');
  await bolum.locator('form[data-mfa-kayit] button[type=submit]').click();
  await expect(bolum.locator('[data-mesaj]')).toContainText('Kod yanlış ya da süresi dolmuş');
  await expect(bolum.locator('svg.mfa-kare')).toBeVisible(); // aynı gizli anahtarla yeniden denenir

  await bolum.locator('input[name=kod]').fill('123456');
  await bolum.locator('form[data-mfa-kayit] button[type=submit]').click();
  await expect(bolum).toContainText('Açık: doğrulayıcı uygulama kayıtlı (Authenticator).');
  await expect(bolum).toContainText('İki adımlı doğrulama açıldı.');
  const kayit = await page.evaluate(() => window.__mfa.cagrilar.filter((c) => c[0] === 'enroll'));
  expect(kayit.at(-1)[1].kod).toBe('123456');
  expect(kayit.at(-1)[2]).toBe('Authenticator');
  // MFA durumu Firestore'a yazılmaz
  expect(await page.evaluate(() => window.__writes.length)).toBe(0);
});

test('Hesap sekmesi: açıkken kapatma sayfa içi onayla (tarayıcı diyaloğu yok), vazgeçilebilir', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: {}, mfa: { dogruKod: '123456', kayitli: [faktor] } });
  await hesapSekmesi(page);
  const bolum = page.locator('[data-mfa]');
  await expect(bolum).toContainText('Açık: doğrulayıcı uygulama kayıtlı (Authenticator).');
  await bolum.locator('[data-mfa-kapat]').click();
  await expect(bolum).toContainText('İki adımlı doğrulama kapatılsın mı?');
  await expect(bolum.locator('[data-mfa-vazgec]')).toBeFocused(); // güvenli seçenek odakta
  await bolum.locator('[data-mfa-vazgec]').click();
  await expect(bolum.locator('[data-mfa-kapat]')).toBeVisible();
  expect(await page.evaluate(() => (window.__mfa.cagrilar || []).filter((c) => c[0] === 'unenroll').length)).toBe(0);

  await bolum.locator('[data-mfa-kapat]').click();
  await bolum.locator('[data-mfa-kapat-onay]').click();
  await expect(bolum).toContainText('İki adımlı doğrulama kapatıldı.');
  await expect(bolum).toContainText('Kapalı: hesap yalnız şifreyle korunuyor.');
  expect(await page.evaluate(() => window.__mfa.cagrilar.filter((c) => c[0] === 'unenroll').map((c) => c[1]))).toEqual(['F1']);
});

test('TOTP projede açılmamışsa: «henüz açılmadı» iletisi, bozuk ekran yok', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: {}, mfa: { kapali: true, kayitli: [] } });
  await hesapSekmesi(page);
  const bolum = page.locator('[data-mfa]');
  await bolum.locator('[data-mfa-ac]').click();
  await expect(bolum.locator('[data-mesaj]')).toContainText('henüz açılmadı');
  await expect(bolum.locator('[data-mfa-ac]')).toBeVisible();
  await expect(bolum.locator('svg.mfa-kare')).toHaveCount(0);
});

test('çoklu faktör yüzeyi olmayan ortamda Hesap sekmesi bölüm eklemez (eski görünüm)', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: {} }); // __mfa yok → multiFactor fırlatır
  await page.locator('[role=tab][data-sekme=hesap]').click();
  await expect(page.locator('form[data-form=sifreDegistir]')).toBeVisible();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-mfa]')).toHaveCount(0);
});

for (const d of ['de', 'fr']) {
  test(`${d}: kod ekranı ve Hesap bölümü o dilde; 360 px'te yatay taşma yok; axe temiz`, async ({ page, context }) => {
    await context.addInitScript((x) => { try { localStorage.setItem('hocaDil', x); } catch {} }, d);
    await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {}, mfa: { girisIster: true, dogruKod: '123456', kayitli: [] } });
    await page.setViewportSize({ width: 360, height: 800 });
    await girisYap(page);
    const baslik = { de: 'Bestätigung in zwei Schritten', fr: 'Vérification en deux étapes' }[d];
    await expect(page.locator('[data-mfa-giris] h2')).toHaveText(baslik);
    expect((await new AxeBuilder({ page }).include('[data-mfa-giris]').analyze()).violations).toEqual([]);
    await page.locator('[data-mfa-giris] input[name=kod]').fill('123456');
    await page.locator('[data-mfa-giris] button[type=submit]').click();
    await expect(page.locator('[data-sekme=odev]')).toBeVisible();
    await page.locator('[role=tab][data-sekme=hesap]').click();
    const bolum = page.locator('[data-mfa]');
    await expect(bolum.locator('h2')).toHaveText(baslik);
    await bolum.locator('[data-mfa-ac]').click();
    await expect(bolum.locator('svg.mfa-kare')).toBeVisible();
    expect((await new AxeBuilder({ page }).include('[data-mfa]').analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
