// Üst bilgi: marka adı kelime içinde kırılmaz ve 1024/1280/1440 px'te yatay taşma yoktur (fr/de/nl'de marka harf harf kırılıyordu).
import { test, expect } from '@playwright/test';

for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
  for (const genislik of [360, 1024, 1280, 1440]) {
    test(`üst bilgi markası kelime içinde kırılmaz: ${dil} ${genislik} px`, async ({ page }) => {
      await page.setViewportSize({ width: genislik, height: 900 });
      await page.goto(`/${dil}/`);
      const sonuc = await page.evaluate(() => {
        const ad = document.querySelector('.damga-ad');
        const metin = ad.firstChild;
        const aralik = document.createRange();
        let kirik = false;
        let konum = 0;
        for (const kelime of ad.textContent.trim().split(/\s+/)) {
          const i = ad.textContent.indexOf(kelime, konum);
          aralik.setStart(metin, i);
          aralik.setEnd(metin, i + kelime.length);
          if (aralik.getClientRects().length > 1) kirik = true;
          konum = i + kelime.length;
        }
        return { kirik, tasma: document.documentElement.scrollWidth - window.innerWidth };
      });
      expect(sonuc.kirik, 'marka adı bir kelimenin ortasından kırıldı').toBe(false);
      expect(sonuc.tasma, 'yatay taşma').toBeLessThanOrEqual(0);
    });
  }
}
