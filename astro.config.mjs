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
  integrations: [
    preact({ compat: false }),
    sitemap({
      // noindex taşıyan 9 sayfa (portal/portail, gizlilik/confidentialite/privacy,
      // ihtida-basvurusu/demande-de-conversion/conversion-application) sitemap'e girmemeli
      filter: (page) =>
        page !== 'https://ulucamii.be/' &&
        !/\/(portal|portail|privacy|confidentialite|gizlilik|conversion-application|demande-de-conversion|ihtida-basvurusu)\/$/.test(
          page,
        ),
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
    locales: ['tr', 'fr', 'en'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
