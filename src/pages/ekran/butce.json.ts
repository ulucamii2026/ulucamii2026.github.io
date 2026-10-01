/**
 * /ekran/butce.json — duyuru karakter sınırlarının TEK kaynağı (src/lib/ekran/butce.ts). Yönetim araçları (platform
 * deposunda yonetim/duyuru.mjs; B2'de imam uygulaması) sınırları kendi içlerine kopyalamaz, buradan okur. Yalnız
 * ekleme: ekran bu dosyayı istemez ve önbelleğe almaz; kimlik ya da gizli veri içermez.
 */
import type { APIRoute } from 'astro';
import { BUTCE } from '../../lib/ekran/butce.ts';
import { EKRANLAR } from '../../lib/ekran/akis.ts';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ duyuru: BUTCE.duyuru, ekranlar: EKRANLAR }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
