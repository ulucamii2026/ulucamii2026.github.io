/**
 * /ekran/vakitler.json — cami ekranının vakit akışı (derleme anında; site her gün 03:30 UTC'de yeniden
 * derlenir). Kapı: src/lib/ekran/vakit-kapisi.ts (yalnız Diyanet, ilçe 11890; bozuk gün yayımlanmaz).
 */
import type { APIRoute } from 'astro';
import namaz from '../../data/namaz-vakitleri.json';
import { bugunBrussels } from '../../lib/icerik';
import { ekranVakitleri, type VakitKaynagi } from '../../lib/ekran/vakit-kapisi.ts';

export const GET: APIRoute = () => {
  const govde = ekranVakitleri(namaz as VakitKaynagi, bugunBrussels());
  if (govde.atlanan.length) console.warn(`[ekran] UYARI: biçimi/sırası bozuk ${govde.atlanan.length} gün yayımlanmadı: ${govde.atlanan.join(', ')}`);
  return new Response(JSON.stringify(govde), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
