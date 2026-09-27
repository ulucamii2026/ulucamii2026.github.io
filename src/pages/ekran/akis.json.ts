/**
 * /ekran/akis.json — cami ekranının duyuru akışı ve ekran ayarları (derleme anında; CMS'te her kayıt
 * yeniden derlemeyi tetikler). Kurucu: src/lib/ekran/akis.ts.
 */
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { bugunBrussels } from '../../lib/icerik';
import { ekranDuyurulari } from '../../lib/ekran/akis.ts';

export const GET: APIRoute = async () => {
  const ayar = (await getEntry('ekranAyar', 'ekran'))!.data;
  const govde = {
    derleme: new Date().toISOString(),
    ayar,
    duyurular: ekranDuyurulari(await getCollection('duyurular'), bugunBrussels(), ayar.duyuruVarsayilanGun),
  };
  return new Response(JSON.stringify(govde), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
