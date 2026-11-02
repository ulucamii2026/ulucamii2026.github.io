import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import QRCode from 'qrcode';
import { kareKodYolu } from '../../src/lib/ezber/kare-kod.ts';
import { mektepAc } from './helpers/mektep.mjs';

/* İlim Yolu hesapları — hoca ekranı «İlim Yolu» sekmesi (2 Kasım 2026, docs/ILIM-YOLU.md Dilim 1, «Ortak kararlar» 4).
   Callable'lar sahte: tests/web/helpers/mektep.mjs (`firebase/functions` → window.__callables, çağrılar window.__cagrilar).
   İnceleme odakları: (1) şifre yalnız bir kez gösterilir ve pencere kapanınca DOM'dan silinir, (2) hiçbir sır tarayıcı
   deposuna (localStorage/sessionStorage/IndexedDB) yazılmaz, (3) kart baskısı A4'e 8 kart, saf SVG kare kod (img yok) ve kod
   kart adresini birebir taşır, (4) yıkıcı işlemler sayfanın kendi penceresiyle onay ister (window.confirm yok), (5) hatalar sade Türkçe. */

const KART = (ref) => `https://egitim.ulucamii.be/k/#yeni-${ref}.${'s'.repeat(22)}`;
const SIFRE = 'elma-kalem-42';
const YENI_SIFRE = 'armut-defter-17';
const ILK_KART = (ref) => `https://egitim.ulucamii.be/k/#ilk-${ref}.SIRSIRSIRSIRSIRSIRSIR`;
const students = [
  { ref: 'TEST-1', ad: 'Örnek', soyad: 'TALEBE', dil: 'fr' },
  { ref: 'TEST-2', ad: 'İkinci', soyad: 'ÖRNEK' },
  { ref: 'TEST-3', ad: 'Yetişkin', soyad: 'ÖĞRENCİ' },
  { ref: 'TEST-4', ad: 'Pasif', soyad: 'HESAPSIZ', durum: 'pasif' },
  { ref: 'TEST-5', ad: 'Pasif', soyad: 'HESAPLI', durum: 'pasif' },
];
const hesaplar = [
  { ref: 'TEST-2', kullaniciAdi: 'ikinci.ornek', cocuk: true, kartSurum: 1, olusturma: '2026-11-02T10:00:00Z' },
  { ref: 'TEST-3', cocuk: false, yetiskinAd: 'yetiskin42', olusturma: '2026-11-02T10:00:00Z' },
  { ref: 'TEST-5', kullaniciAdi: 'pasif.hesapli', cocuk: true, kartSurum: 2, olusturma: '2026-11-02T10:00:00Z' },
];

const depo = (page) => page.evaluate(async () => ({
  local: Object.fromEntries(Object.entries(localStorage)),
  session: Object.fromEntries(Object.entries(sessionStorage)),
  idb: indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name).sort() : [],
}));
const cagrilar = (page, ad) => page.evaluate((a) => (window.__cagrilar || []).filter((c) => !a || c.ad === a), ad);

async function ilimAc(page, context, { students: ogr = students, hesaplar: h = hesaplar, ayar = {} } = {}) {
  const yerli = [];
  page.on('dialog', (d) => { yerli.push(d.type()); void d.dismiss(); }); // window.alert/confirm/prompt kullanılmamalı
  await mektepAc(page, context, { hoca: true, students: ogr, tarih: '2026-11-02T09:00:00Z' });
  await page.evaluate(({ h, ayar, kart, ilk, sifre, yeni }) => {
    window.print = () => { window.__yazdirildi = (window.__yazdirildi || 0) + 1; };
    const hata = (kod) => { throw Object.assign(new Error(kod), { code: `functions/${kod}` }); };
    window.__callables = {
      ogrenciHesaplariListe: async () => (ayar.listeHata ? hata(ayar.listeHata) : h.map((x) => ({ ...x }))),
      cocukHesabiAc: async ({ ref }) => (ayar.acHata ? hata(ayar.acHata) : { uid: `c_${ref}`, kullaniciAdi: `ogr.${ref.toLowerCase()}`, sifre, kartUrl: ilk.replace('{ref}', ref) }),
      kartYenile: async ({ ref }) => (ayar.kartHata === ref ? hata('unavailable') : { kartUrl: kart.replace('{ref}', ref) }),
      cocukSifreYenile: async () => ({ sifre: yeni }),
      cocukOturumKapat: async () => ({ ok: true }),
      bagKoduUret: async () => ({ kod: 'K7P2QX9M', bitis: '2026-11-16T12:00:00Z' }),
    };
  }, { h, ayar, kart: KART('{ref}'), ilk: ILK_KART('{ref}'), sifre: SIFRE, yeni: YENI_SIFRE });
  const once = await depo(page);
  await page.locator('[data-sekme=ilim]').click();
  const kok = page.locator('[data-hoca-ilim-yolu]');
  return { kok, once, yerli };
}
const satir = (kok, ref) => kok.locator(`[data-iy-satir="${ref}"]`);
const pencere = (page) => page.locator('dialog.iy-dialog[open]').last();
/** Sırların hiçbir depoya düşmediğini ve depo anahtarlarının değişmediğini doğrular. */
async function depoTemiz(page, once, sirlar) {
  const sonra = await depo(page);
  expect(sonra).toEqual(once);
  const hepsi = JSON.stringify(sonra);
  for (const s of sirlar) expect(hepsi).not.toContain(s);
}

test('Sekme: durumlar (hesap yok / çocuk @ad / yetişkin bağlı), pasif yalnız hesabı varsa; bölge europe-west1; erişilebilirlik', async ({ page, context }) => {
  const { kok, once, yerli } = await ilimAc(page, context);
  await expect(kok.locator('.iy-liste')).toBeVisible();
  expect((await page.locator('[role=tab]').allTextContents()).map((x) => x.trim())).toContain('İlim Yolu');
  await expect(satir(kok, 'TEST-1')).toContainText('Hesap yok');
  await expect(satir(kok, 'TEST-1').getByRole('button', { name: /Çocuk hesabı aç/ })).toBeVisible();
  await expect(satir(kok, 'TEST-1').getByRole('button', { name: /Bağlama kodu/ })).toBeVisible();
  await expect(satir(kok, 'TEST-2')).toContainText('Çocuk hesabı açık');
  await expect(satir(kok, 'TEST-2')).toContainText('@ikinci.ornek');
  for (const ad of ['Kartı bas', 'Kartı yenile', 'Şifreyi yenile', 'Oturumları kapat'])
    await expect(satir(kok, 'TEST-2').getByRole('button', { name: new RegExp(`^${ad} — İkinci ÖRNEK$`) })).toBeVisible();
  await expect(satir(kok, 'TEST-3')).toContainText('Yetişkin hesabı bağlı');
  await expect(satir(kok, 'TEST-3').locator('[data-iy-sec]')).toHaveCount(0);
  await expect(satir(kok, 'TEST-4')).toHaveCount(0);
  await expect(satir(kok, 'TEST-5')).toContainText('pasif');
  await expect(kok.locator('.iy-ozet')).toContainText('2 çocuk hesabı');
  const c = await cagrilar(page);
  expect(c.map((x) => x.ad)).toEqual(['ogrenciHesaplariListe']);
  expect(c[0].bolge).toBe('europe-west1');
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    const axe = await new AxeBuilder({ page }).include('[data-hoca-ilim-yolu]').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.map((v) => `${colorScheme} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  }
  await depoTemiz(page, once, []);
  expect(yerli).toEqual([]);
});

test('Öğrenci kartındaki «İlim Yolu sekmesinde aç» sekmeyi açar ve öğrenciyi vurgular', async ({ page, context }) => {
  await ilimAc(page, context);
  await page.locator('[data-sekme=ogrenci]').click();
  await page.locator('[data-ogr="TEST-2"]').first().click();
  await page.locator('[data-ilim-ac="TEST-2"]').click();
  await expect(page.locator('#hoca-tab-ilim')).toHaveAttribute('aria-selected', 'true');
  const kok = page.locator('[data-hoca-ilim-yolu]');
  await expect(satir(kok, 'TEST-2')).toHaveClass(/secili/);
  await expect(satir(kok, 'TEST-2').getByRole('button', { name: /^Kartı bas/ })).toBeFocused();
});

test('Hesap aç: şifre tek seferlik pencerede; Yazdır fişi basar, «Kartı bas» kartı açar; kapanınca hiçbir sır DOM\'da ya da depoda kalmaz', async ({ page, context }) => {
  const { kok, once, yerli } = await ilimAc(page, context);
  await satir(kok, 'TEST-1').getByRole('button', { name: /Çocuk hesabı aç/ }).click();
  const d = pencere(page);
  await expect(d).toBeVisible();
  await expect(d.getByRole('heading')).toHaveText('Çocuk hesabı açıldı');
  await expect(d).toContainText('Örnek TALEBE');
  await expect(d).toContainText('ogr.test-1');
  await expect(d).toContainText(SIFRE);
  await expect(d).toContainText('bir daha gösterilmez');
  expect((await cagrilar(page, 'cocukHesabiAc'))[0].veri).toEqual({ ref: 'TEST-1', dil: 'fr' });
  const axe = await new AxeBuilder({ page }).include('dialog.iy-dialog').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);

  // Yazdır: fiş yazdırma kabına girer (pencere değil), yazdırma çağrılır.
  await d.getByRole('button', { name: 'Yazdır' }).click();
  expect(await page.evaluate(() => window.__yazdirildi)).toBe(1);
  await expect(page.locator('.iy-yazdirma .iy-fis')).toContainText(SIFRE);
  await expect(page.locator('html')).toHaveClass(/iy-yazdiriliyor/);

  // Kartı bas: hesap açılışının kart adresi baskı önizlemesine kare kod olarak gider (adres metin olarak yok).
  await d.getByRole('button', { name: 'Kartı bas' }).click();
  const on = pencere(page);
  await expect(on.getByRole('heading')).toContainText('1 kart');
  await expect(on.locator('.iy-kart')).toHaveCount(1);
  await expect(on.locator('.iy-kart-ad')).toHaveText('Örnek TALEBE');
  expect(await on.locator('svg.iy-kare path').getAttribute('d')).toBe(kareKodYolu(QRCode.create(ILK_KART('TEST-1'), { errorCorrectionLevel: 'M' }).modules));
  expect(await page.content()).not.toContain('SIRSIR');
  await on.getByRole('button', { name: 'Kapat' }).click();
  await expect(page.locator('.iy-kart')).toHaveCount(0);
  await expect(pencere(page)).toContainText(SIFRE); // şifre penceresi hâlâ açık

  await pencere(page).getByRole('button', { name: 'Kapat' }).click();
  await expect(page.locator('dialog.iy-dialog')).toHaveCount(0);
  await expect(page.locator('.iy-yazdirma')).toHaveCount(0);
  expect(await page.content()).not.toContain(SIFRE);
  await expect(satir(kok, 'TEST-1')).toContainText('@ogr.test-1');
  await expect(satir(kok, 'TEST-1')).toContainText('Çocuk hesabı açık');
  await expect(kok.locator('[data-iy-mesaj]')).toContainText('çocuk hesabı açıldı');
  await depoTemiz(page, once, [SIFRE, 'SIRSIR', 'ilk-TEST-1']);
  expect(yerli).toEqual([]);
});

test('Toplu kart baskısı: 9 seçili → onay → 2 A4 sayfa (8 + 1), saf SVG kare kod adresi birebir taşır, img yok; kapanınca silinir', async ({ page, context }) => {
  const dokuz = Array.from({ length: 9 }, (_, i) => ({ ref: `TEST-${i + 1}`, ad: `Ad${i + 1}`, soyad: `SOYAD${String.fromCharCode(65 + i)}` }));
  const { kok, once, yerli } = await ilimAc(page, context, { students: dokuz, hesaplar: dokuz.map((o) => ({ ref: o.ref, kullaniciAdi: `k${o.ref.toLowerCase()}`, cocuk: true })) });
  await expect(kok.locator('[data-iy-sec]')).toHaveCount(9);
  const dugme = kok.locator('[data-iy=topluBas]');
  await expect(dugme).toBeDisabled();
  await kok.locator('[data-iy-hepsi]').check();
  await expect(dugme).toHaveText(/\(9\)/);
  await dugme.click();
  const onay = pencere(page);
  await expect(onay).toContainText('eski kartlar hemen geçersiz olur');
  await expect(onay).toContainText('2 A4 sayfaya');
  expect(await cagrilar(page, 'kartYenile')).toEqual([]); // onaydan önce hiçbir kart yenilenmez
  await onay.getByRole('button', { name: 'Kartları yenile ve bas' }).click();

  const on = pencere(page);
  await expect(on.getByRole('heading')).toHaveText('Kart baskısı · 9 kart · 2 sayfa');
  expect((await cagrilar(page, 'kartYenile')).map((c) => c.veri.ref).sort()).toEqual(dokuz.map((o) => o.ref).sort());
  await expect(on.locator('.iy-sayfa')).toHaveCount(2);
  await expect(on.locator('.iy-sayfa').nth(0).locator('.iy-kart')).toHaveCount(8);
  await expect(on.locator('.iy-sayfa').nth(1).locator('.iy-kart')).toHaveCount(1);
  await expect(on.locator('img')).toHaveCount(0);
  await expect(on.locator('svg.iy-kare')).toHaveCount(9);
  const kart = on.locator('.iy-kart').first();
  await expect(kart).toContainText('İlim Yolu');
  await expect(kart).toContainText('Kare kodu telefonla okut, giriş yap');
  await expect(kart.locator('[lang=fr]', { hasText: 'Scanne le code pour te connecter' })).toHaveCount(1);
  await expect(kart.locator('.iy-kart-ad')).toHaveText('Ad1 SOYADA');
  expect(await kart.locator('svg.iy-kare path').getAttribute('d')).toBe(kareKodYolu(QRCode.create(KART('TEST-1'), { errorCorrectionLevel: 'M' }).modules));
  expect(await page.content()).not.toContain('sssssssssss'); // kart adresi metin olarak hiçbir yerde yok
  // Kart ölçüsü: 85 × 55 mm oranı (önizleme ölçekli)
  const kutu = await on.locator('.iy-hucre').first().boundingBox();
  expect(kutu.width / kutu.height).toBeCloseTo(85 / 55, 1);
  const axe = await new AxeBuilder({ page }).include('dialog.iy-onizleme').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);

  await on.getByRole('button', { name: 'Yazdır' }).click();
  expect(await page.evaluate(() => window.__yazdirildi)).toBe(1);
  await expect(page.locator('.iy-yazdirma .iy-kart')).toHaveCount(9);
  await expect(page.locator('.iy-yazdirma img')).toHaveCount(0);
  await on.getByRole('button', { name: 'Kapat' }).click();
  await expect(page.locator('.iy-kart')).toHaveCount(0);
  await expect(page.locator('.iy-yazdirma')).toHaveCount(0);
  await expect(dugme).toHaveText(/\(0\)/);
  await depoTemiz(page, once, ['sssssssssss', 'yeni-TEST']);
  expect(yerli).toEqual([]);
});

test('Yıkıcı işlemler sayfa penceresiyle onay ister: Vazgeç çağrı yapmaz; oturum kapatma, kart yenileme, şifre yenileme', async ({ page, context }) => {
  const { kok, once, yerli } = await ilimAc(page, context);
  const s2 = satir(kok, 'TEST-2');
  await s2.getByRole('button', { name: /^Oturumları kapat/ }).click();
  await expect(pencere(page)).toContainText('Bütün oturumlar kapatılsın mı?');
  await expect(pencere(page).getByRole('button', { name: 'Vazgeç' })).toBeFocused();
  await pencere(page).getByRole('button', { name: 'Vazgeç' }).click();
  await expect(page.locator('dialog.iy-dialog')).toHaveCount(0);
  expect(await cagrilar(page, 'cocukOturumKapat')).toEqual([]);
  await s2.getByRole('button', { name: /^Oturumları kapat/ }).click();
  await pencere(page).getByRole('button', { name: 'Oturumları kapat' }).click();
  await expect(kok.locator('[data-iy-mesaj]')).toContainText('bütün oturumlar kapatıldı');
  expect((await cagrilar(page, 'cocukOturumKapat')).map((c) => c.veri)).toEqual([{ ref: 'TEST-2' }]);

  // Esc de vazgeçer.
  await s2.getByRole('button', { name: /^Kartı yenile/ }).click();
  await expect(pencere(page)).toContainText('eski kart hemen geçersiz olur');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.iy-dialog')).toHaveCount(0);
  expect(await cagrilar(page, 'kartYenile')).toEqual([]);
  await s2.getByRole('button', { name: /^Kartı yenile/ }).click();
  await pencere(page).getByRole('button', { name: 'Kartı yenile' }).click();
  await expect(pencere(page).getByRole('heading')).toHaveText('Eski kart iptal edildi');
  await pencere(page).getByRole('button', { name: 'Yeni kartı bas' }).click();
  await expect(pencere(page).locator('.iy-kart')).toHaveCount(1);
  await pencere(page).getByRole('button', { name: 'Kapat' }).click();
  await expect(page.locator('dialog.iy-dialog')).toHaveCount(0);

  await s2.getByRole('button', { name: /^Şifreyi yenile/ }).click();
  await pencere(page).getByRole('button', { name: 'Şifreyi yenile' }).click();
  await expect(pencere(page)).toContainText(YENI_SIFRE);
  await expect(pencere(page)).toContainText('ikinci.ornek');
  await pencere(page).getByRole('button', { name: 'Kapat' }).click();
  expect(await page.content()).not.toContain(YENI_SIFRE);
  await expect(s2.getByRole('button', { name: /^Şifreyi yenile/ })).toBeFocused(); // odak tetikleyen düğmeye döner
  await depoTemiz(page, once, [YENI_SIFRE, 'sssssssssss']);
  expect(yerli).toEqual([]);
});

test('Hatalar sade Türkçe; bağlama kodu tek seferlik pencerede; kısmi baskı hatası önizlemede bildirilir', async ({ page, context }) => {
  const { kok, yerli } = await ilimAc(page, context, { ayar: { acHata: 'already-exists', kartHata: 'TEST-5' } });
  await satir(kok, 'TEST-1').getByRole('button', { name: /Çocuk hesabı aç/ }).click();
  await expect(kok.locator('[data-iy-mesaj]')).toHaveText('Bu öğrencinin zaten bir İlim Yolu hesabı var. Listeyi yenileyin.');
  await expect(page.locator('dialog.iy-dialog')).toHaveCount(0);

  await satir(kok, 'TEST-1').getByRole('button', { name: /Bağlama kodu/ }).click();
  await expect(pencere(page)).toContainText('K7P2QX9M');
  await expect(pencere(page)).toContainText('16 Kasım 2026');
  await expect(pencere(page)).toContainText('tek kullanımlıktır');
  await pencere(page).getByRole('button', { name: 'Kapat' }).click();
  expect(await page.content()).not.toContain('K7P2QX9M');

  await kok.locator('[data-iy-hepsi]').check();
  await kok.locator('[data-iy=topluBas]').click();
  await pencere(page).getByRole('button', { name: 'Kartları yenile ve bas' }).click();
  await expect(pencere(page).locator('.iy-kart')).toHaveCount(1);
  await expect(pencere(page).getByRole('alert')).toContainText('1 kart yenilenemedi');
  await expect(pencere(page).getByRole('alert')).toContainText('Pasif HESAPLI (Sunucuya ulaşılamadı');
  expect(yerli).toEqual([]);
});

test('Liste alınamazsa sade Türkçe hata ve «Yeniden dene»', async ({ page, context }) => {
  const { kok } = await ilimAc(page, context, { ayar: { listeHata: 'unavailable' } });
  await expect(kok.getByRole('alert')).toHaveText('İlim Yolu hesapları alınamadı. Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip yeniden deneyin.');
  await page.evaluate(() => { window.__callables.ogrenciHesaplariListe = async () => []; });
  await kok.getByRole('button', { name: 'Yeniden dene' }).click();
  await expect(satir(kok, 'TEST-1')).toContainText('Hesap yok');
});
