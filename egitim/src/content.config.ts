/**
 * İçerik koleksiyonları (Dilim 4 / P5a): kurs sayfaları (egitim.ulucamii.be/<dil>/kurs/…) ana siteyle AYNI kaynak dosyalardan okur — içerik kopyalanmaz.
 * Şema tek yerde: src/lib/icerik-semalari.ts (ana sitenin src/content.config.ts'i de oradan alır). Yalnız bu üç koleksiyon egitim'e gerekir;
 * duyuru, etkinlik, cami ekranı vb. ana sitede kalır.
 */
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse as yamlParse } from 'yaml';
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

export const collections = { sayfalar, ayarlar, materyaller };
