// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { swDamgala } from './scripts/ekran-damga.mjs';
import { TASIMA_ACIK, yonlendirmeler } from './src/lib/egitim-tasima.ts';
import { yonlendirmeSayfasi } from './src/lib/egitim-yonlendir-html.ts';
import { diller, yollar } from './src/i18n/ui.ts';

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
    // 3 Ekim 2026 vaaz revizyonu: İngilizce makine çevirisi vaaz, aynı konudaki Türkçe yeni vaazla değiştirildi.
    '/tr/vaaz/the-month-of-ramadan-and-the-qur-an/': '/tr/vaaz/ramazan-ayi-ve-kur-an/',
    '/fr/vaaz/the-month-of-ramadan-and-the-qur-an/': '/fr/vaaz/ramazan-ayi-ve-kur-an/',
    '/en/vaaz/the-month-of-ramadan-and-the-qur-an/': '/en/vaaz/ramazan-ayi-ve-kur-an/',
    '/nl/vaaz/the-month-of-ramadan-and-the-qur-an/': '/nl/vaaz/ramazan-ayi-ve-kur-an/',
    '/de/vaaz/the-month-of-ramadan-and-the-qur-an/': '/de/vaaz/ramazan-ayi-ve-kur-an/',
  },
  integrations: [
    preact({ compat: false }),
    // Dilim 4 (P7a): veli portalı, hoca ekranı, Kur'an kursu sayfaları ve basılı /e/<kod>/ karekodları egitim.ulucamii.be'ye taşındı. Eski sayfalar
    // yerinde derlenir (geri alma: src/lib/egitim-tasima.ts → TASIMA_ACIK=false); çıktıları derleme SONUNDA, site haritasından ÖNCE yönlendirme sayfasıyla
    // değişir. Sayfa Astro dışı saf HTML'dir: sayaç/harici betik/CSS yok (src/lib/egitim-yonlendir-html.ts). Hooks, dizi sırasıyla koşar.
    {
      name: 'egitim-yonlendirme',
      hooks: {
        'astro:build:done': ({ dir, logger }) => {
          if (!TASIMA_ACIK) { logger.info('egitim yönlendirmesi KAPALI (TASIMA_ACIK=false): eski sayfalar olduğu gibi yayınlanır'); return; }
          const kodlar = JSON.parse(readFileSync(new URL('./src/data/ecouter.json', import.meta.url), 'utf8')).kodlar;
          const liste = yonlendirmeler(yollar, /** @type {(keyof typeof diller)[]} */ (Object.keys(diller)), kodlar);
          for (const y of liste) {
            const dosya = fileURLToPath(new URL(y.dosya, dir));
            if (!existsSync(dosya)) throw new Error(`egitim yönlendirmesi: derlenmiş sayfa yok (adres değişmiş olabilir): ${y.dosya}`);
            writeFileSync(dosya, yonlendirmeSayfasi(y.hedef, y.dil, y.hesap));
          }
          logger.info(`${liste.length} sayfa egitim.ulucamii.be yönlendirmesine çevrildi`);
        },
      },
    },
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
    // Cami ekranı (/ekran/): service worker'ın sürüm damgası derleme SONUNDA, yayımlanan ekran dosyalarının
    // (paket, CSS, sayfa iskeleti, fontlar, logolar, SW kodu) içerik özetinden gelir; dist/ekran/sw.js onunla
    // yeniden derlenir (scripts/ekran-damga.mjs). Ekran dosyaları değişmeyen bir yayın kutuya yeni SW kurdurmaz.
    {
      name: 'ekran-sw-damgasi',
      hooks: {
        'astro:build:done': async ({ dir, logger }) => {
          logger.info(`cami ekranı SW damgası ${await swDamgala(fileURLToPath(dir))}`);
        },
      },
    },
  ],
  i18n: {
    locales: ['tr', 'fr', 'en', 'nl', 'de'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
