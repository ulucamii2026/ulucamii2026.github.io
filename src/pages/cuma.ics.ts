/**
 * /cuma.ics — Cuma namazı takvim aboneliği (1 Kasım 2026 yönetim kararı: Cuma saati hatırlatması sitede de).
 * Bugünden itibaren verideki Cuma günleri; saat sitede girilmiş sabit Cuma saati ya da o günün Diyanet öğle vakti
 * (lib/namaz → cumaVakti). Site her gece yeniden derlendiği için abonelik kendiliğinden ileri kayar.
 */
import type { APIRoute } from 'astro';
import { bugunBrussels, namazVakitleri, siteAyarlari } from '../lib/icerik';
import { cumaGunleri, cumaVakti } from '../lib/namaz';
import { cumaTakvimiUret } from '../lib/ics';

export const GET: APIRoute = async () => {
  const site = await siteAyarlari();
  const bugun = bugunBrussels();
  const cumalar = cumaGunleri(namazVakitleri().gunler)
    .filter((c) => c.tarih >= bugun)
    .map((c) => ({ tarih: c.tarih, saat: cumaVakti(c, site.cumaSaati) }));
  const a = site.adres;
  const govde = cumaTakvimiUret(cumalar, `Mosquée Ulu Camii, ${a.sokak}, ${a.posta} ${a.sehir}, ${a.ulke}`);
  return new Response(govde, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
