/**
 * Yeniden akış (WCAG 2.1 SC 1.4.10, 320 CSS px) — Ezber Kilimi (Faz 2e cila turu, 24 Ekim 2026).
 * Neden ayrı bir sınama: telefon projesi (isMobile) taşan içeriği kendi düzen görünümüne katar; `scrollWidth <= innerWidth`
 * orada taşmayı göstermez. 24 Ekim'de Hollandaca giriş başlığı «Memorisatiekelim» (bölünemeyen tek sözcük, 3 rem tabanı) 440 px'e
 * kadar sayfayı yatay taşırıyordu, Fransızca/İngilizce «mémorisation» 320 px'te taşıyordu; bu durum yalnız masaüstü
 * Chromium'unda dar pencereyle yakalanıyor. Burada her dil giriş sayfasını ve bir sûre, bir dua sayfasını (Sına sekmesi ve
 * «Anlamla eşleştir» açık hâlde) 320 / 360 / 390 px'te yatay kaydırmasız bekler. Dış ağ kapalıdır.
 */
import { test, expect } from '@playwright/test';

const KOK = 'http://127.0.0.1:4402';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const GENISLIKLER = [320, 360, 390];
const SAYFALAR = [['', 'giriş'], ['calis/s-nebe/', 'sûre'], ['calis/d-subhaneke/', 'dua']];

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'masaustu-chromium', 'dar pencere yalnız masaüstü Chromium projesinde sınanır'));

for (const genislik of GENISLIKLER) {
  test(`${genislik} px: beş dilde yatay kaydırma yok (giriş, sûre, dua; Sına ve Anlamla eşleştir açık)`, async ({ browser }) => {
    const baglam = await browser.newContext({ viewport: { width: genislik, height: 800 }, reducedMotion: 'reduce', baseURL: KOK });
    await baglam.route('**/*', (r) => (new URL(r.request().url()).origin === KOK ? r.continue() : r.abort()));
    const sayfa = await baglam.newPage();
    const taşan = [];
    for (const dil of DILLER) {
      for (const [yol, ad] of SAYFALAR) {
        await sayfa.goto(`/${dil}/${yol}`);
        if (yol) {
          await sayfa.locator('#kip-sekme-sina').click();
          const oyun = sayfa.locator('#kip-panel-sina [data-oyun="anlam"]');
          if (await oyun.count()) await oyun.click();
        }
        const fark = await sayfa.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (fark > 0) taşan.push(`${dil}/${ad}: ${fark} px`);
      }
    }
    await baglam.close();
    expect(taşan, `taşan sayfalar (${genislik} px)`).toEqual([]);
  });
}
