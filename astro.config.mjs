// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ulucamii.be',
  output: 'static',
  trailingSlash: 'always',
  // 21 Eylül'deki eğitim yardımı duyurusu 25 Eylül'de güncel duyuruyla birleştirildi; eski adres paylaşılmış olabilir.
  redirects: {
    '/tr/duyurular/egitim-yardimi-kampanyasi-2026/': '/tr/duyurular/egitim-kampanyasi-2026/',
    '/fr/annonces/egitim-yardimi-kampanyasi-2026/': '/fr/annonces/egitim-kampanyasi-2026/',
    '/en/announcements/egitim-yardimi-kampanyasi-2026/': '/en/announcements/egitim-kampanyasi-2026/',
    '/nl/mededelingen/egitim-yardimi-kampanyasi-2026/': '/nl/mededelingen/egitim-kampanyasi-2026/',
    '/de/mitteilungen/egitim-yardimi-kampanyasi-2026/': '/de/mitteilungen/egitim-kampanyasi-2026/',
  },
  integrations: [
    preact({ compat: false }),
    sitemap({
      // Sitemap'e yalnız dizine girebilen sayfalar konur. Slug listesi tutmak yerine sayfanın
      // KENDİ <meta name="robots"> etiketi okunur (tek doğruluk kaynağı) — slug değişince
      // (portal → veli-portali, /hoca/) liste eskiyip noindex sayfalar sitemap'e sızıyordu.
      // Sitemap derleme sonunda yazıldığı için dist/ hazırdır (serialize de aynı yolu kullanır).
      filter: (page) => {
        if (page === 'https://ulucamii.be/') return false; // dil seçmeyen kök yönlendirme
        const dosya = fileURLToPath(new URL('./dist' + new URL(page).pathname + 'index.html', import.meta.url));
        if (!existsSync(dosya)) return true;
        return !/<meta name="robots" content="[^"]*noindex/.test(readFileSync(dosya, 'utf8').slice(0, 30000));
      },
      // hreflang alternatifleri: eklentinin i18n eşleştirmesi yalnız aynı yolu paylaşan sayfaları
      // (/tr/afisler ↔ /fr/afisler) yakalar; bizim yollar yerelleştirilmiş olduğundan (/tr/duyurular ↔
      // /fr/annonces) 390 adresin 17'sinde kalıyordu. Kaynak olarak her sayfanın kendi <head>'indeki
      // <link rel="alternate" hreflang> etiketleri okunur (Base.astro üretir, üç dil + x-default) —
      // tek doğruluk kaynağı, çift bakım yok. Sitemap derleme sonunda yazıldığı için dist hazırdır.
      serialize(item) {
        const yol = new URL(item.url).pathname;
        const dosya = fileURLToPath(new URL('./dist' + yol + 'index.html', import.meta.url));
        if (!existsSync(dosya)) return item;
        const bas = readFileSync(dosya, 'utf8').slice(0, 30000);
        const links = [...bas.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, url]) => ({ lang, url }));
        if (links.length) item.links = links;
        return item;
      },
    }),
  ],
  i18n: {
    locales: ['tr', 'fr', 'en', 'nl', 'de'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
