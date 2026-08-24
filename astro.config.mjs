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
  integrations: [preact({ compat: false }), sitemap({ filter: (page) => page !== 'https://ulucamii.be/' })],
  i18n: {
    locales: ['tr', 'fr', 'en'],
    defaultLocale: 'tr',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
