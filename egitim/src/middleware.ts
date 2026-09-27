/**
 * Fransızca sayfaların tamamına Fransız yazım kuralı (PRODUCT.md): «;», «!», «?» öncesine ince bölünmez boşluk, «:»
 * öncesine ve «« »» içine bölünmez boşluk. Arayüz metinleri (src/i18n/metinler.ts) zaten dönüşmüş gelir; ortak veri
 * (katalog adları ve amaçları, kilim özeti ve lejantı, kilim başlıkları) ana sitede düz boşlukla yazıldığından burada,
 * sayfa çıktısında dönüşür. Dönüşüm tekrar uygulanınca değişmez; sayfalarda satır içi betik ve stil yoktur, bu yüzden
 * yalnız metin ve öznitelik değerleri etkilenir. Statik derlemede derleme anında çalışır.
 */
import { defineMiddleware } from 'astro:middleware';
import { fransizTipografi } from './i18n/metinler';

export const onRequest = defineMiddleware(async (baglam, sonraki) => {
  const yanit = await sonraki();
  const tur = yanit.headers.get('content-type') ?? '';
  if (!baglam.url.pathname.startsWith('/fr/') || !tur.includes('text/html')) return yanit;
  return new Response(fransizTipografi(await yanit.text()), yanit);
});
