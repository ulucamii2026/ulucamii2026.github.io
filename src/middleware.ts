/**
 * Fransızca sayfalara Fransız yazım kuralı (27 Eylül 2026): noktalama öncesindeki düz boşluk bölünmez boşluğa döner,
 * ayrıntı src/lib/fransiz-tipografi.ts. İçerik (CMS Markdown'ı, arayüz metinleri) düz boşlukla yazılmaya devam
 * edebilir; dönüşüm sayfa çıktısında yapılır. Statik derlemede derleme anında çalışır; HTML dışındaki yanıtlara
 * (JSON, ICS, XML) dokunulmaz.
 */
import { defineMiddleware } from 'astro:middleware';
import { fransizcaSayfaMi, fransizTipografiHtml } from './lib/fransiz-tipografi';

export const onRequest = defineMiddleware(async (_baglam, sonraki) => {
  const yanit = await sonraki();
  if (!(yanit.headers.get('content-type') ?? '').includes('text/html')) return yanit;
  const html = await yanit.text();
  return new Response(fransizcaSayfaMi(html) ? fransizTipografiHtml(html) : html, yanit);
});
