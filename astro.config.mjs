// @ts-check
import { defineConfig } from 'astro/config';
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
      // xmlns:xhtml bildirilen ad alanını fiilen dolduracak hreflang alternate
      // (xhtml:link) girişleri üretir; kodlar src/i18n/utils.ts:hreflangKodu ile birebir
      i18n: {
        defaultLocale: 'tr',
        locales: { tr: 'tr', fr: 'fr-BE', en: 'en' },
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
