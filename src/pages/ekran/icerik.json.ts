/**
 * /ekran/icerik.json — günün ayeti, hadisi, duası ve Esmâ'sı havuzu (yalnız imam onaylı ve ekrana sığan kayıtlar).
 * Veri: src/data/ekran/{ayetler,hadisler,dualar,esma}.json (içerik hattı) + sitedeki 10 ahlâk hadisi.
 */
import type { APIRoute } from 'astro';
import ayetler from '../../data/ekran/ayetler.json';
import hadisler from '../../data/ekran/hadisler.json';
import dualar from '../../data/ekran/dualar.json';
import esma from '../../data/ekran/esma.json';
import { AHLAK_HADISLERI } from '../../lib/hadis-verisi';
import { ekranIcerigi, type AyetKaydi, type DuaKaydi, type EsmaKaydi, type HadisKaydi } from '../../lib/ekran/icerik.ts';

export const GET: APIRoute = () => {
  const govde = ekranIcerigi(ayetler as AyetKaydi[], hadisler as HadisKaydi[], AHLAK_HADISLERI, dualar as DuaKaydi[], esma as EsmaKaydi[]);
  if (govde.eksik.length) console.warn(`[ekran] UYARI: eksik, mükerrer ya da ekrana sığmayan içerik yayımlanmadı: ${govde.eksik.join(', ')}`);
  return new Response(JSON.stringify({ derleme: new Date().toISOString(), ...govde }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
