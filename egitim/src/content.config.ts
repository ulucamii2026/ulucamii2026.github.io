/**
 * İçerik koleksiyonları (Dilim 4 / P5a): kurs sayfaları (egitim.ulucamii.be/<dil>/kurs/…) ana siteyle AYNI kaynak dosyalardan okur — içerik kopyalanmaz.
 * Şema tek yerde: src/lib/icerik-semalari.ts (ana sitenin src/content.config.ts'i de oradan alır). Yalnız bu üç koleksiyon egitim'e gerekir;
 * duyuru, etkinlik, cami ekranı vb. ana sitede kalır.
 */
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as yamlParse } from 'yaml';
import { gizlilikBolumleri as gizlilikDilimleri } from '../../src/lib/gizlilik-bolumleri.ts';
import { sayfalarSemasi, ayarlarSemasi, materyallerSemasi } from '../../src/lib/icerik-semalari.ts';

const sayfalar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../src/content/sayfalar' }),
  schema: sayfalarSemasi,
});

const ayarlar = defineCollection({
  loader: file('../src/content/ayarlar/site.yaml', { parser: (text) => [{ id: 'site', ...yamlParse(text).site }] }),
  schema: ayarlarSemasi,
});

const materyaller = defineCollection({
  loader: glob({ pattern: '*.md', base: '../src/content/materyaller' }),
  schema: materyallerSemasi,
});

// Gizlilik sayfasının İlim Yolu bölümleri (11 Kasım 2026): aynı `gizlilik.md`'den iki dilim (veri sorumlusu; İlim Yolu + haklar), metin kopyalanmaz.
// Kimlik `<dil>-kontrolcu` / `<dil>-ilim`; dilimleme src/lib/gizlilik-bolumleri.ts'te (çapa düşerse derleme kırılır).
const gizlilikBolumleri = defineCollection({
  loader: {
    name: 'gizlilik-bolumleri',
    load: async ({ store, renderMarkdown, parseData, generateDigest, config, watcher }) => {
      store.clear();
      for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
        const dosya = new URL(`../src/content/sayfalar/${dil}/gizlilik.md`, config.root);
        watcher?.add(fileURLToPath(dosya));
        const kaynak = readFileSync(dosya, 'utf8');
        for (const [bolum, govde] of Object.entries(gizlilikDilimleri(kaynak))) {
          const id = `${dil}-${bolum}`;
          const data = await parseData({ id, data: { dil, bolum } });
          store.set({ id, data, body: govde, rendered: await renderMarkdown(govde, { fileURL: dosya }), digest: generateDigest(govde) });
        }
      }
    },
  },
  schema: z.object({ dil: z.string(), bolum: z.enum(['kontrolcu', 'ilim']) }),
});

export const collections = { sayfalar, ayarlar, materyaller, gizlilikBolumleri };
