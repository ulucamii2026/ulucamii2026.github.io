/**
 * /ekran/akis.json — cami ekranının duyuru akışı ve ekran ayarları (derleme anında; CMS'te her kayıt
 * yeniden derlemeyi tetikler). Kurucu: src/lib/ekran/akis.ts. Ekrana sığmayan duyuru akışa girmez: derleme uyarır,
 * `sigmayan` alanı site denetimine taşır.
 */
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { bugunBrussels } from '../../lib/icerik';
import { ekranDuyurulari } from '../../lib/ekran/akis.ts';
import { gorselSurumu } from '../../lib/ekran/gorsel-surumu.ts';
import { gorselOrani } from '../../lib/ekran/gorsel-orani.ts';
import { AFIS_ORANI } from '../../lib/ekran/olcu.ts';

export const GET: APIRoute = async () => {
  const ayar = (await getEntry('ekranAyar', 'ekran'))!.data;
  const sigmayan: string[] = [];
  const duyurular = ekranDuyurulari(await getCollection('duyurular'), bugunBrussels(), ayar.duyuruVarsayilanGun, sigmayan);
  if (sigmayan.length) console.warn(`[ekran] UYARI: ekrana sığmayan duyuru yayımlanmadı (CMS'te ekran başlığı ya da metni kısaltılmalı): ${sigmayan.join(', ')}`);
  const govde = {
    // Bilgi amaçlı (her yayında değişir). Ekran slayt turunu buna değil duyuru içeriğine göre yeniden kurar
    // (src/ekran/veri.ts → duyuruAnahtari): duyuru değişmeyen bir yayın turu baştan başlatmaz.
    derleme: new Date().toISOString(),
    ayar,
    // Site içi görsel adresi içerik özetiyle sürümlenir (?v=): yerinde yenilenen afiş ekranın SW önbelleğinde eski
    // kalmaz (src/lib/ekran/gorsel-surumu.ts). Görselli duyuruya oranı eklenir (afiş kutusu yüklenmeden boyutlanır).
    // Alan sırası korunur; görselsiz duyuruda iki alan da yazılmaz.
    duyurular: await Promise.all(duyurular.map(async (d) => {
      if (!d.gorsel) return d;
      const oran = await gorselOrani(d.gorsel);
      return { ...d, gorsel: gorselSurumu(d.gorsel), gorselOran: oran ?? AFIS_ORANI };
    })),
    ...(sigmayan.length ? { sigmayan } : {}),
  };
  return new Response(JSON.stringify(govde), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
