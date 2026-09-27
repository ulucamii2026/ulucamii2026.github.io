/**
 * /ekran/icerik.json — günün ayeti ve günün hadisi havuzu (yalnız imam onaylı kayıtlar).
 * Veri: src/data/ekran/{ayetler,hadisler}.json (içerik hattı İ2/İ3) + sitedeki 10 ahlâk hadisi.
 */
import type { APIRoute } from 'astro';
import ayetler from '../../data/ekran/ayetler.json';
import hadisler from '../../data/ekran/hadisler.json';
import { AHLAK_HADISLERI } from '../../lib/hadis-verisi';
import { ekranIcerigi, type AyetKaydi, type HadisKaydi } from '../../lib/ekran/icerik.ts';

export const GET: APIRoute = () => {
  const govde = ekranIcerigi(ayetler as AyetKaydi[], hadisler as HadisKaydi[], AHLAK_HADISLERI);
  if (govde.eksik.length) console.warn(`[ekran] UYARI: eksik/mükerrer içerik yayımlanmadı: ${govde.eksik.join(', ')}`);
  return new Response(JSON.stringify({ derleme: new Date().toISOString(), ...govde }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
