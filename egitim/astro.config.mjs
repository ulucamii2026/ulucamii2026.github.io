// egitim.ulucamii.be — Ulu Camii Kur’an Kursu eğitim platformu (Faz 1f iskeleti, 27 Eylül 2026).
// Ana siteyle aynı depoda ikinci Astro uygulaması: kök node_modules ortak, ortak kod `@ortak/*` → kök src/.
// Komutlar depo kökünden: npm run egitim:build | egitim:dev | egitim:onizle (hepsi `--root egitim`).
// Karar ve sınırlar: docs/EGITIM-PLATFORMU.md; görünüm: egitim/DESIGN.md. Hosting/DNS/Auth canlı adımları ayrı onaylıdır.
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// Stil ve betik hep dış dosya olarak çıkar (satır içine alınmaz): Hosting'de tanımlanacak sıkı CSP (`style-src 'self'`,
// `script-src 'self'` + kök yönlendirmesinin tek özeti) buna dayanır.
export default defineConfig({
  site: 'https://egitim.ulucamii.be',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: {
    resolve: { alias: { '@ortak': fileURLToPath(new URL('../src', import.meta.url)) } },
    build: { assetsInlineLimit: 0 },
  },
});
