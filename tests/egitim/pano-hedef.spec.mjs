/**
 * Giriş panosu dokunma hedefi (WCAG 2.2 SC 2.5.8, en az 24 × 24 CSS px) — Ezber Kilimi (24 Ekim 2026).
 * Neden: 13 sütunlu panonun karoları, sayfa kenar boşluğu 1 rem iken 360 px'te 23 px kalıyordu (372 px'ten itibaren 24 px+).
 * Dar ekranda pano kenar boşluğunun yarısına kadar yayılır (egitim/src/styles/cini.css, `@media (max-width: 29.99rem)`).
 * Bu sınama her dilde 360 / 375 / 390 / 412 px'te her madde karosunun boyunu ölçer, panonun görünüm alanında kaldığını ve sayfanın
 * yatay taşmadığını doğrular; 320 px'te (13 × 24 + derz = 340 px sığmaz) yalnız taşma yok ve karoların listedeki bağlantılarla
 * eşdeğer olduğu (her karo bir liste maddesine gider) denetlenir. Telefon projesi taşan içeriği kendi görünümüne kattığı için
 * yalnız masaüstü Chromium'da dar pencereyle sınanır (bkz. yeniden-akis.spec.mjs). Dış ağ kapalıdır.
 */
import { test, expect } from '@playwright/test';

const KOK = 'http://127.0.0.1:4402';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const HEDEF = 24;

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'masaustu-chromium', 'dar pencere yalnız masaüstü Chromium projesinde sınanır'));

async function olc(browser, genislik, dil) {
  const baglam = await browser.newContext({ viewport: { width: genislik, height: 800 }, reducedMotion: 'reduce', baseURL: KOK });
  await baglam.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
  const sayfa = await baglam.newPage();
  await sayfa.goto(`/${dil}/`);
  const sonuc = await sayfa.evaluate(() => {
    const kutular = [...document.querySelectorAll('.pano a.karo.madde')].map((a) => a.getBoundingClientRect());
    const cerceve = document.querySelector('.pano-cerceve').getBoundingClientRect();
    const hedefler = [...document.querySelectorAll('.pano a.karo.madde')].map((a) => a.getAttribute('href').slice(1));
    return {
      adet: kutular.length,
      enKucukGenislik: Math.min(...kutular.map((k) => k.width)),
      enKucukYukseklik: Math.min(...kutular.map((k) => k.height)),
      cerceveSol: cerceve.left, cerceveSag: cerceve.right,
      tasma: document.documentElement.scrollWidth - innerWidth,
      hedefVar: hedefler.every((id) => document.getElementById(id)),
    };
  });
  await baglam.close();
  return sonuc;
}

for (const genislik of [360, 375, 390, 412]) {
  test(`${genislik} px: her madde karosu en az ${HEDEF} × ${HEDEF} px, pano görünümde, yatay taşma yok (beş dil)`, async ({ browser }) => {
    for (const dil of DILLER) {
      const s = await olc(browser, genislik, dil);
      expect(s.adet, `${dil}: madde karosu sayısı`).toBeGreaterThan(50);
      expect(s.enKucukGenislik, `${dil}: en dar karo`).toBeGreaterThanOrEqual(HEDEF);
      expect(s.enKucukYukseklik, `${dil}: en kısa karo`).toBeGreaterThanOrEqual(HEDEF);
      expect(s.cerceveSol, `${dil}: pano solda görünüm içinde`).toBeGreaterThanOrEqual(0);
      expect(s.cerceveSag, `${dil}: pano sağda görünüm içinde`).toBeLessThanOrEqual(genislik);
      expect(s.tasma, `${dil}: yatay taşma`).toBeLessThanOrEqual(0);
    }
  });
}

test('320 px: yatay taşma yok; 13 sütun 24 px\'e sığmaz ama her karo listede bir maddeye bağlıdır (eşdeğer bağlantı)', async ({ browser }) => {
  for (const dil of DILLER) {
    const s = await olc(browser, 320, dil);
    expect(s.tasma, `${dil}: yatay taşma`).toBeLessThanOrEqual(0);
    expect(s.cerceveSol).toBeGreaterThanOrEqual(0);
    expect(s.cerceveSag).toBeLessThanOrEqual(320);
    expect(s.hedefVar, `${dil}: her karo bir liste maddesine (#m-…) gitmeli`).toBe(true);
    // Karo 24 px'in altında kalabilir ama okunur kalmalı (alt sınır clamp: 1,1 rem = 17,6 px).
    expect(s.enKucukGenislik).toBeGreaterThanOrEqual(17);
  }
});
