/**
 * Cami ekranının ayet/hadis akışı (/ekran/icerik.json) — 27 Eylül 2026.
 *
 * Yalnız imamın onayladığı kayıtlar (durum: "imam-onayli") yayına girer; eksik alanlı ya da mükerrer
 * kimlikli kayıt atlanır ve `eksik` listesinde raporlanır. Metinler resmî Diyanet yayınlarından alınır;
 * Yerel ihtisas arşivi yalnız seçim/doğrulama içindir (telif kuralı). Fransızca meal DİB / Mohammed Chiadmi
 * «Le Noble Coran» (2022) çevirisidir; cami Diyanet'e bağlı olduğu için Diyanet yayınları için ayrıca izin
 * istenmez. `fr` ile `kaynakFr` birlikte dolu değilse FR yayımlanmaz, ekran AR + TR gösterir. Sitedeki 10 ahlâk
 * hadisi (src/lib/hadis-verisi.ts) zaten yayında olduğu için başlangıç havuzudur.
 */
import type { HadisOgesi } from '../hadis-verisi.ts';

type Durum = 'taslak' | 'imam-onayli';

export interface AyetKaydi {
  id: string;
  sure: number;
  ayet: number[];
  sureAdi: { tr: string; fr: string };
  ar: string;
  tr: string;
  fr?: string;
  kaynakTr: string;
  kaynakFr?: string;
  durum: Durum;
  onayTarihi?: string;
}

export interface HadisKaydi {
  id: string;
  ar: string;
  tr: string;
  fr?: string;
  kaynak: string;
  durum: Durum;
  onayTarihi?: string;
}

export interface EkranAyet { id: string; referans: { tr: string; fr: string }; ar: string; tr: string; fr?: string; kaynakTr: string; kaynakFr?: string }
export interface EkranHadis { id: string; ar: string; tr: string; fr?: string; kaynak: string }
export interface EkranIcerik { ayetler: EkranAyet[]; hadisler: EkranHadis[]; eksik: string[] }

const dolu = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const aralik = (ayetler: number[]): string =>
  ayetler.length > 1 ? `${ayetler[0]}-${ayetler[ayetler.length - 1]}` : String(ayetler[0]);
/** Ayet numaraları pozitif tam sayı ve aralığın sonu başından önce değil (ör. [7, 5] ters aralıktır). */
const aralikGecerli = (ayetler: number[]): boolean =>
  ayetler.every((n) => Number.isInteger(n) && n >= 1) && ayetler[ayetler.length - 1] >= ayetler[0];
/** JSON dosyasında null ya da nesne olmayan öğe derlemeyi düşürmez; `eksik`te raporlanır. */
const nesneMi = (x: unknown): boolean => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Mükerrer kimlik denetimi: her tür (ayet, sitedeki hadis, JSON hadis) kendi kimlik kümesiyle. */
function mukerrerDenetcisi(eksik: string[]): (id: string) => boolean {
  const gorulen = new Set<string>();
  return (id: string): boolean => {
    if (gorulen.has(id)) { eksik.push(id + ' (mükerrer)'); return false; }
    gorulen.add(id);
    return true;
  };
}

export function ekranIcerigi(ayetler: AyetKaydi[], hadisler: HadisKaydi[], siteHadisleri: HadisOgesi[]): EkranIcerik {
  const eksik: string[] = [];

  const ekranAyetleri: EkranAyet[] = [];
  const yeniAyet = mukerrerDenetcisi(eksik);
  for (const a of ayetler) {
    if (!nesneMi(a)) { eksik.push('geçersiz kayıt (ayet): ' + String(a)); continue; }
    if (a.durum !== 'imam-onayli') continue;
    const tam = dolu(a.id) && Number.isInteger(a.sure) && a.sure >= 1 && a.sure <= 114 && Array.isArray(a.ayet) && a.ayet.length > 0
      && dolu(a.ar) && dolu(a.tr) && dolu(a.kaynakTr) && !!a.sureAdi && dolu(a.sureAdi.tr) && dolu(a.sureAdi.fr);
    if (!tam) { eksik.push(String(a.id)); continue; }
    if (!aralikGecerli(a.ayet)) { eksik.push(a.id + ' (ayet aralığı bozuk)'); continue; }
    if (!yeniAyet(a.id)) continue;
    const ek = aralik(a.ayet);
    const frGecerli = dolu(a.fr) && dolu(a.kaynakFr);
    if (dolu(a.fr) && !frGecerli) eksik.push(String(a.id) + ' (FR kaynağı yok)');
    ekranAyetleri.push({
      id: a.id,
      referans: { tr: `${a.sureAdi.tr}, ${a.sure}/${ek}`, fr: `${a.sureAdi.fr}, ${a.sure}:${ek}` },
      ar: a.ar,
      tr: a.tr,
      ...(frGecerli ? { fr: a.fr, kaynakFr: a.kaynakFr } : {}),
      kaynakTr: a.kaynakTr,
    });
  }

  const ekranHadisleri: EkranHadis[] = [];
  const yeniSiteHadisi = mukerrerDenetcisi(eksik);
  for (const h of siteHadisleri) {
    const id = 'site-' + h.id;
    if (yeniSiteHadisi(id)) ekranHadisleri.push({ id, ar: h.arapca, tr: h.metin.tr, ...(dolu(h.metin.fr) ? { fr: h.metin.fr } : {}), kaynak: h.kaynak });
  }
  const yeniHadis = mukerrerDenetcisi(eksik);
  for (const h of hadisler) {
    if (!nesneMi(h)) { eksik.push('geçersiz kayıt (hadis): ' + String(h)); continue; }
    if (h.durum !== 'imam-onayli') continue;
    if (!dolu(h.id) || !dolu(h.ar) || !dolu(h.tr) || !dolu(h.kaynak)) { eksik.push(String(h.id)); continue; }
    if (!yeniHadis(h.id)) continue;
    ekranHadisleri.push({ id: h.id, ar: h.ar, tr: h.tr, ...(dolu(h.fr) ? { fr: h.fr } : {}), kaynak: h.kaynak });
  }
  return { ayetler: ekranAyetleri, hadisler: ekranHadisleri, eksik };
}
