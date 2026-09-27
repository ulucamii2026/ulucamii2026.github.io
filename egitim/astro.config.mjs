// egitim.ulucamii.be — Ulu Camii Kur’an Kursu eğitim platformu (Faz 1f iskeleti, 27 Eylül 2026).
// Ana siteyle aynı depoda ikinci Astro uygulaması: kök node_modules ortak, ortak kod `@ortak/*` → kök src/.
// Komutlar depo kökünden: npm run egitim:build | egitim:dev | egitim:onizle | egitim:yayinla (hepsi `--root egitim`).
// Karar, barındırma ve sınırlar: docs/EGITIM-PLATFORMU.md; görünüm: egitim/DESIGN.md.
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://egitim.ulucamii.be';
// Derlenmiş sayfanın dosyası (site haritası derleme sonunda yazılır, egitim/dist hazırdır).
const sayfaDosyasi = (adres) => fileURLToPath(new URL('./dist' + new URL(adres).pathname + 'index.html', import.meta.url));
const sayfaBasi = (adres) => {
  const dosya = sayfaDosyasi(adres);
  return existsSync(dosya) ? readFileSync(dosya, 'utf8').slice(0, 30000) : null;
};

// Stil ve betik hep dış dosya olarak çıkar (satır içine alınmaz): Hosting'deki sıkı CSP (`style-src 'self'`,
// `script-src 'self'`; firebase.json) buna dayanır.
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  integrations: [
    sitemap({
      // Kök sitenin düzeni (../astro.config.mjs): haritaya yalnız dizine girebilen sayfalar konur, karar sayfanın
      // kendi <meta name="robots"> etiketinden; hreflang alternatifleri sayfanın kendi <head>'inden (tek kaynak).
      filter: (adres) => {
        if (adres === `${SITE}/` || /\/404\/?$/.test(adres)) return false; // kök yönlendirme ve bulunamadı sayfası
        const bas = sayfaBasi(adres);
        return bas === null || !/<meta name="robots" content="[^"]*noindex/.test(bas);
      },
      serialize(item) {
        const bas = sayfaBasi(item.url);
        if (bas === null) return item;
        const links = [...bas.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, url]) => ({ lang, url }));
        if (links.length) item.links = links;
        return item;
      },
    }),
  ],
  vite: {
    resolve: { alias: { '@ortak': fileURLToPath(new URL('../src', import.meta.url)) } },
    build: { assetsInlineLimit: 0 },
  },
});
