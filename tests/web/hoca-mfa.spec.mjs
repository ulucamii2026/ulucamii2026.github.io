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
  await expect(kod).toHaveAttribute('aria-invalid', 'true');
  await expect(kod).toHaveValue('');
  await expect(kod).toBeFocused();
  await kod.pressSequentially('1');
  await expect(kod).not.toHaveAttribute('aria-invalid', 'true'); // düzeltmeye başlayınca kalkar
  await kod.fill('');
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

const kod6 = '123456';
async function kodGir(page, kod) {
  await page.locator('[data-mfa-giris] input[name=kod]').fill(kod);
  await page.locator('[data-mfa-giris] button[type=submit]').click();
}

test('e-posta bağlantısıyla giriş + faktör: kod ekranı açılır, bağlantı adresten silinir; yanlış kod hata, doğru kod girişi tamamlar', async ({ page, context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('hocaEposta', 'hoca@example.test'); } catch {} });
  await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {}, mfa: { baglanti: true, girisIster: true, dogruKod: kod6 } });
  await expect(page.locator('[data-sekme=odev]')).toHaveCount(0); // kod girilmeden ekran açılmaz
  expect(page.url()).not.toContain('oobCode'); // tek kullanımlık bağlantı adreste kalmaz (yenilemede yeniden denenmesin)
  await kodGir(page, '000000');
  await expect(page.locator('[data-mfa-giris] [data-mesaj]')).toContainText('Kod yanlış ya da süresi dolmuş');
  await expect(page.locator('[data-sekme=odev]')).toHaveCount(0);
  await kodGir(page, kod6);
  await expect(page.locator('[data-sekme=odev]')).toBeVisible();
  const cagri = await page.evaluate(() => window.__mfa.cagrilar.filter((c) => c[0] === 'resolveSignIn').map((c) => c[1]));
  expect(cagri.map((c) => c.kod)).toEqual(['000000', kod6]);
});

test('ikinci adım oturumu dolmuşsa (auth/invalid-multi-factor-session): açık ileti, girişe dönülür, kod yazdırılmaz', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {}, mfa: { girisIster: true, dogruKod: kod6, oturumDoldu: true } });
  await girisYap(page);
  await kodGir(page, kod6);
  await expect(page.locator('[data-form=giris]')).toBeVisible();
  await expect(page.locator('[data-mfa-giris]')).toHaveCount(0);
  const not = page.locator('[data-giris-notu]');
  await expect(not).toContainText('Doğrulama süresi doldu');
  await expect(not).not.toHaveClass(/basari/); // güvenlik bildirimi başarı biçiminde değil
  await expect(page.locator('body')).not.toContainText('auth/invalid-multi-factor-session');
});

test('kod doğru ama ekran yüklenemedi: yükleme hatası gösterilir, «kod yanlış» denmez ve kod formu yeniden kurulmaz', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, oturumYok: true, students: ogrenciler, records: {}, mfa: { girisIster: true, dogruKod: kod6, yuklemeHatasi: true } });
  await girisYap(page);
  await kodGir(page, kod6);
  const hata = page.locator('p.not.hata');
  await expect(hata).toContainText('permission-denied');
  await expect(hata).not.toContainText('Kod yanlış');
  await expect(page.locator('[data-mfa-giris]')).toHaveCount(0);
  await expect(page.locator('[data-eylem=cikis]')).toBeVisible();
});

test('faktörü kapatırken oturum düşerse (auth/user-token-expired): giriş ekranı + yansız bildirim; sonraki ziyarette bildirim yinelenmez', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: {}, mfa: { dogruKod: kod6, kayitli: [faktor], unenrollHata: 'auth/user-token-expired' } });
  await hesapSekmesi(page);
  const bolum = page.locator('[data-mfa]');
  await bolum.locator('[data-mfa-kapat]').click();
  await bolum.locator('[data-mfa-kapat-onay]').click();
  await expect(page.locator('[data-form=giris]')).toBeVisible();
  const not = page.locator('[data-giris-notu]');
  await expect(not).toContainText('oturumunuz kapandı');
  await expect(not).not.toHaveClass(/basari/);
  await page.evaluate(() => window.__authCb(null)); // sonraki çıkış/oturum olayı giriş ekranını yeniden çizer
  await expect(page.locator('[data-form=giris]')).toBeVisible();
  await expect(page.locator('[data-giris-notu]')).toHaveCount(0);
});

test('Hesap sekmesi yeniden çizilince yarım kalan kayıt açıkça bildirilir: kapalı duruma dönülür, gizli anahtar kalmaz', async ({ page, context }) => {
  await mektepAc(page, context, { hoca: true, students: ogrenciler, records: {}, mfa: { dogruKod: kod6, kayitli: [] } });
  await hesapSekmesi(page);
  let bolum = page.locator('[data-mfa]');
  await bolum.locator('[data-mfa-ac]').click();
  await expect(bolum.locator('[data-mfa-anahtar]')).toBeVisible();
  await page.locator('[role=tab][data-sekme=odev]').click(); // sekme değişimi bölümü yeniden kurar
  await hesapSekmesi(page);
  bolum = page.locator('[data-mfa]');
  await expect(bolum.locator('[data-mesaj]')).toContainText('Kayıt yarım kaldığı için gizli anahtar silindi');
  await expect(bolum.locator('[data-mesaj]')).not.toHaveClass(/basari|hata/);
  await expect(bolum.locator('[data-mfa-ac]')).toBeVisible();
  await expect(bolum.locator('[data-mfa-anahtar]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify(localStorage).includes('JBSW'))).toBe(false);
  // bildirim bir kez: normal ziyarette görünmez
  await page.locator('[role=tab][data-sekme=odev]').click();
  await hesapSekmesi(page);
  await expect(page.locator('[data-mfa] [data-mesaj]')).toBeHidden();
});
