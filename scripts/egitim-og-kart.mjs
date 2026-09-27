#!/usr/bin/env node
/** egitim.ulucamii.be paylaşım kartları (Open Graph, 1200 × 630) — egitim/public/og/ezber-kilimi-<dil>.png
 *
 *  Kart ayrı bir şablon değildir: derlenmiş sayfanın üst kısmı (kurs logosu, kuşak bordürü, başlık, vaat cümlesi,
 *  Diyanet güven satırı, çini pano) 1200 × 630 pencerede çekilir. Resimde işe yaramayan etkileşim öğeleri (menü, dil
 *  düğmeleri, eylem düğmeleri) gizlenir, sağ üste adres yazılır; kart böylece sitenin görünümüyle kendiliğinden aynı
 *  kalır. PNG raster olmak zorundadır («vektör önce» kuralının bilinen istisnası; ana sitede scripts/og-kart-uret.mjs).
 *  WhatsApp önizlemesi için dosya başına en çok 300 KB.
 *
 *  Çalıştırma (depo kökünden; kart public/'e yazılır, yayına girmesi için yeniden derlenir):
 *    npm run egitim:build && node scripts/egitim-og-kart.mjs && npm run egitim:build
 */
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const PORT = 4403;
const HEDEF = new URL('../egitim/public/og/', import.meta.url);
const AZAMI_BAYT = 300 * 1024;
const KART_STILI = `
  header.ust nav, .giris .eylem { display: none !important; }
  .og-adres { margin-left: auto; color: var(--yesil); font-weight: 700; font-size: 1.05rem; letter-spacing: 0.06em; }
`;

mkdirSync(HEDEF, { recursive: true });
const sunucu = await preview({
  root: fileURLToPath(new URL('../egitim/', import.meta.url)),
  server: { host: '127.0.0.1', port: PORT, open: false },
  logLevel: 'error',
});
if (sunucu.port !== PORT) {
  await sunucu.stop();
  throw new Error(`${PORT} portu kullanımda.`);
}
const tarayici = await chromium.launch();
try {
  // bypassCSP: karta eklenen stil, sunucu CSP gönderse bile uygulansın (yalnız bu üretim betiğinde).
  const baglam = await tarayici.newContext({
    viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', bypassCSP: true,
  });
  const s = await baglam.newPage();
  for (const dil of DILLER) {
    await s.goto(`http://127.0.0.1:${PORT}/${dil}/`);
    await s.addStyleTag({ content: KART_STILI });
    await s.evaluate(() => {
      const adres = document.createElement('span');
      adres.className = 'og-adres';
      adres.textContent = 'egitim.ulucamii.be';
      document.querySelector('header.ust .icerik')?.append(adres);
    });
    await s.evaluate(() => document.fonts.ready);
    const yol = fileURLToPath(new URL(`ezber-kilimi-${dil}.png`, HEDEF));
    await s.screenshot({ path: yol, type: 'png' });
    const bayt = statSync(yol).size;
    if (bayt > AZAMI_BAYT) throw new Error(`${yol}: ${Math.round(bayt / 1024)} KB (sınır 300 KB).`);
    console.log(`✓ ezber-kilimi-${dil}.png (${Math.round(bayt / 1024)} KB)`);
  }
} finally {
  await tarayici.close();
  await sunucu.stop();
}
