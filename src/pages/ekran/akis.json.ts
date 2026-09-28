/**
 * /ekran/akis.json — cami ekranının duyuru akışı ve ekran ayarları (derleme anında; CMS'te her kayıt
 * yeniden derlemeyi tetikler). Kurucu: src/lib/ekran/akis.ts.
 */
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { bugunBrussels } from '../../lib/icerik';
import { ekranDuyurulari } from '../../lib/ekran/akis.ts';
import { gorselSurumu } from '../../lib/ekran/gorsel-surumu.ts';

export const GET: APIRoute = async () => {
  const ayar = (await getEntry('ekranAyar', 'ekran'))!.data;
  const govde = {
    // Bilgi amaçlı (her yayında değişir). Ekran slayt turunu buna değil duyuru içeriğine göre yeniden kurar
    // (src/ekran/veri.ts → duyuruAnahtari): duyuru değişmeyen bir yayın turu baştan başlatmaz.
    derleme: new Date().toISOString(),
    ayar,
    // Site içi görsel adresi içerik özetiyle sürümlenir (?v=): yerinde yenilenen afiş ekranın SW önbelleğinde eski
    // kalmaz (src/lib/ekran/gorsel-surumu.ts). Alan sırası korunur; görselsiz duyuruda alan yine yazılmaz.
    duyurular: ekranDuyurulari(await getCollection('duyurular'), bugunBrussels(), ayar.duyuruVarsayilanGun)
      .map((d) => ({ ...d, gorsel: gorselSurumu(d.gorsel) })),
  };
  return new Response(JSON.stringify(govde), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
