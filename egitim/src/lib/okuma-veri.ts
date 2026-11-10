/**
 * Kur'an Okuma sayfa verisi (10 Kasım 2026): çalışma ekranına (scripts/okuma-kart.ts) `data-veri` ile giden yük ve sayfa yardımcıları.
 * Tarayıcıya yol içeriğinin KENDİSİ girmez (ecouter.json paketlenmez); sayfa çizilirken bu yük sayfanın diliyle derlenir. Satır içi betik yok (CSP).
 *
 * Yük biçimi (sıkı, ≈ 60 KB): `o[adım]` = maddeler dizisi `[ar, önekIndisi, dosya, vurgu|0, etiketIndisi]`; ses adresi `önek[i] + dosya`
 * (önek = ANA_SITE + klasör). `d[dersKimliği]` = `{a: adım, f: ilk madde sırası, n: madde sayısı, ad: ders adı}`.
 */
import type { Dil } from '@ortak/i18n/ui';
import { PLAN, YOL, yerelSesMi } from '@ortak/lib/okuma/yol';
import { dersAdi, etiketYaz, okumaMetinleri } from '../i18n/okuma';
import { ANA_SITE } from './kimlik';

export type MaddeSatiri = [ar: string, onek: number, dosya: string, vurgu: number[][] | 0, etiket: number];
export interface OkumaYuku {
  dil: Dil;
  plan: typeof PLAN;
  onek: string[];
  etiket: string[];
  o: Record<string, MaddeSatiri[]>;
  d: Record<string, { a: string; f: number; n: number; ad: string }>;
  m: ReturnType<typeof okumaMetinleri>['kart'];
  adAdim: Record<string, string>;
  geri: string;
  adimaGit: string;
  ilkOturumYol: string;
}

/** Ses adresinin kökü: ulucamii.be'deki Diyanet kayıtları için ANA_SITE, egitim Hosting'indeki yeni kayıtlar için boş (aynı köken). */
export const sesKoku = (ses: string): string => (yerelSesMi(ses) ? '' : ANA_SITE);

export function okumaYuku(dil: Dil): OkumaYuku {
  const t = okumaMetinleri(dil);
  const onek: string[] = [];
  const etiket: string[] = [];
  const indis = (liste: string[], deger: string): number => {
    const i = liste.indexOf(deger);
    return i >= 0 ? i : liste.push(deger) - 1;
  };
  const o: OkumaYuku['o'] = {};
  const d: OkumaYuku['d'] = {};
  for (const b of YOL) {
    o[b.id] = [];
    for (const ders of b.dersler) {
      d[ders.id] = { a: b.id, f: o[b.id].length, n: ders.ogeler.length, ad: dersAdi(dil, ders.grup, ders.parca, ders.parcaSayisi) };
      for (const g of ders.ogeler) {
        const k = g.ses.lastIndexOf('/') + 1;
        o[b.id].push([g.ar, indis(onek, sesKoku(g.ses) + g.ses.slice(0, k)), g.ses.slice(k), g.v?.map((x) => [...x]) ?? 0, indis(etiket, etiketYaz(dil, g))]);
      }
    }
  }
  return {
    dil, plan: PLAN, onek, etiket, o, d, m: t.kart,
    adAdim: Object.fromEntries(Object.entries(t.adimlar).map(([k, v]) => [k, v.ad])),
    geri: `/${dil}/okuma/`, adimaGit: t.adimaGit, ilkOturumYol: `/${dil}/okuma/bugun/`,
  };
}

/** Bir adımın ulucamii.be'deki ses yolları (çevrim dışı kayıt için, ANA_SITE'lı). egitim Hosting'indeki yeni sesler (o8, o9) çevrim dışı kaydedilmez: service worker ayrı bir önbellek tutmaz. */
export const adimSesleri = (adim: string): string[] =>
  [...new Set(YOL.find((b) => b.id === adim)?.dersler.flatMap((d) => d.ogeler.filter((g) => !yerelSesMi(g.ses)).map((g) => `${ANA_SITE}${g.ses}`)) ?? [])];
