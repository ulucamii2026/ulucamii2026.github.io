/**
 * İlim Yolu · Kur'an Okuma yolunun içeriği (10 Kasım 2026): yedi adım, derslere bölünmüş maddeler. Dil bağımsızdır (etiketler egitim/src/i18n/okuma.ts'te).
 * Her madde: büyük Arapça, resmî Diyanet kaydı (dinle), kendi okuyuşunu denemek. KAYNAKLAR, hepsi yerel ve doğrulanmış:
 *  - harfler, heceler, tecvid örnekleri, cezm/şedde/tenvin/med alıştırmaları: src/data/ecouter.json (Diyanet Elifbâ, sha256 tests/ecouter-ses.test.mjs);
 *  - harflerin şekilleri ve üstün/esre/ötre kelimeleri: src/data/okuma/ek.json (aynı portal, scripts/okuma-uret.mjs, sha256 docs/okuma-ses-kaynaklari.json);
 *  - sûreler: src/data/okuma/sureler.json (Ezber Kilimi'nin Arapça metni ve âyet sesleri, scripts/okuma-uret.mjs ile kataloğa karşı üretilir).
 * Yapay ses ve harici Kur'an kaynağı yoktur. SIRA KALICIDIR: madde kimliği `<adım>-<sıra>` ilerleme dizesindeki yerdir (ilerleme.ts); yeni madde
 * yalnız adımın SONUNA eklenir (tests/okuma-veri.test.mjs parmak izi).
 */
import ecouter from '../../data/ecouter.json';
import ek from '../../data/okuma/ek.json';
import sureler from '../../data/okuma/sureler.json';
import { ELIFBA_HARFLERI } from '../elifba-verisi';
import { maddeKimligi } from './ilerleme';

export interface Oge {
  /** `<adım>-<sıra>` */
  readonly id: string;
  readonly ar: string;
  /** Site köküne göre ses yolu (`/media/ses/…`); sayfa başına ANA_SITE eklenir. */
  readonly ses: string;
  /** Vurgulanacak [başlangıç, bitiş) aralıkları (harflerin şekilleri). */
  readonly v?: readonly (readonly [number, number])[];
  /** Etiket anahtarı (i18n `etiketler`). */
  readonly e?: string;
  /** Harf kimliği (elifba-verisi) — etikette harfin adı. */
  readonly h?: string;
  /** Sûre kimliği (Ezber kataloğu) ve âyet no — etikette «Sûre · n». */
  readonly s?: string;
  readonly n?: number;
}
export interface Ders {
  readonly id: string;
  readonly adim: string;
  /** Ders grubu anahtarı (i18n `gruplar`; sûre derslerinde sûre kimliği). */
  readonly grup: string;
  readonly parca: number;
  readonly parcaSayisi: number;
  readonly ogeler: readonly Oge[];
}
export interface Basamak {
  readonly id: string;
  readonly sira: number;
  /** `elifba`: harften kelimeye ve tecvide; `mushaf`: sûre okuma. İkisine de baştan girilir. */
  readonly iz: 'elifba' | 'mushaf';
  readonly dersler: readonly Ders[];
}

interface Ham { ar: string; ses: string; v?: readonly (readonly [number, number])[]; e?: string; h?: string; s?: string; n?: number }
const dosyaAdi = (ses: string): string => ses.split('/').pop()!.replace(/\.mp3$/, '');
const kod = ecouter.kodlar as unknown as Record<string, { ogeler?: { ar: string; ses: string }[] }>;
const kodOgeleri = (k: string): { ar: string; ses: string }[] => {
  const o = kod[k]?.ogeler;
  if (!o?.length) throw new Error(`ecouter.json: ${k} yok`);
  return o;
};

/** Ham maddeleri eşit parçalı derslere böler (en çok `boyut` madde). */
function bol(grup: string, ham: readonly Ham[], boyut: number): { grup: string; parca: number; parcaSayisi: number; ham: Ham[] }[] {
  const sayi = Math.max(1, Math.ceil(ham.length / boyut));
  const aralik = Math.ceil(ham.length / sayi);
  return Array.from({ length: sayi }, (_, i) => ({ grup, parca: i + 1, parcaSayisi: sayi, ham: ham.slice(i * aralik, (i + 1) * aralik) }));
}

function kur(adim: string, sira: number, iz: Basamak['iz'], parcalar: ReturnType<typeof bol>): Basamak {
  let n = 0;
  const dersler = parcalar.map((p, i): Ders => ({
    id: `${adim}-d${i + 1}`,
    adim,
    grup: p.grup,
    parca: p.parca,
    parcaSayisi: p.parcaSayisi,
    ogeler: p.ham.map((h): Oge => ({ id: maddeKimligi(adim, n++), ...h })),
  }));
  return { id: adim, sira, iz, dersler };
}

const harfSirasi = ELIFBA_HARFLERI.map((h) => h.id);
const harfKimligi = (ses: string): string => {
  const id = dosyaAdi(ses);
  if (!harfSirasi.includes(id)) throw new Error(`bilinmeyen harf sesi: ${ses}`);
  return id;
};
const harfSiraliHam = (k: string, e?: string): Ham[] =>
  kodOgeleri(k)
    .map((o) => ({ ar: o.ar, ses: o.ses, h: harfKimligi(o.ses), ...(e ? { e } : {}) }))
    .sort((a, b) => harfSirasi.indexOf(a.h) - harfSirasi.indexOf(b.h));
const duz = (k: string, e: string): Ham[] => kodOgeleri(k).map((o) => ({ ar: o.ar, ses: o.ses, e }));

const o1 = kur('o1', 1, 'elifba', bol('harf', harfSiraliHam('alphabet'), 6));
const o2 = kur('o2', 2, 'elifba', [
  ...bol('hece-ustun', harfSiraliHam('fatha', 'ustun'), 7),
  ...bol('hece-esre', harfSiraliHam('kasra', 'esre'), 7),
  ...bol('hece-otre', harfSiraliHam('damma', 'otre'), 7),
]);
const o3 = kur('o3', 3, 'elifba', bol('bitisme', ek.bitisme.map((b): Ham => ({ ar: b.ar, ses: b.ses, v: b.v as [number, number][], e: `bit-${b.konum}` })), 8));
const o4 = kur('o4', 4, 'elifba', [
  ...bol('cezm-anlama', duz('e31', 'cezm'), 14),
  ...bol('cezm-alistirma', duz('e32', 'cezm'), 9),
  ...bol('sedde', duz('e34', 'sedde'), 9),
  ...bol('tenvin-an', duz('e11', 'tenvin-an'), 14),
  ...bol('tenvin-in', duz('e19', 'tenvin-in'), 14),
  ...bol('tenvin-un', duz('e27', 'tenvin-un'), 14),
  ...bol('med-a', duz('e08', 'med-a'), 14),
  ...bol('med-i', duz('e16', 'med-i'), 14),
  ...bol('med-u', duz('e24', 'med-u'), 14),
]);
const kelime = (hareke: string): Ham[] => ek.kelimeler.filter((k) => k.hareke === hareke).map((k) => ({ ar: k.ar, ses: k.ses }));
const o5 = kur('o5', 5, 'elifba', [
  ...bol('kelime-ilk', duz('mots-simples', 'kelime'), 9),
  ...bol('kelime-ustun', kelime('ustun'), 9),
  ...bol('kelime-esre', kelime('esre'), 10),
  ...bol('kelime-otre', kelime('otre'), 9),
  ...bol('kelime-tenvin', duz('e13', 'kelime'), 8),
]);
const o6 = kur('o6', 6, 'elifba', [
  ...bol('kalkale', duz('e63', 'kalkale'), 10),
  ...bol('iklab', duz('e55', 'iklab'), 10),
  ...bol('ihfa-sefevi', duz('e56', 'ihfa-sefevi'), 12),
  ...bol('med-tabii', duz('e66', 'med-tabii'), 9),
  ...bol('med-munfasil', duz('e68', 'med-munfasil'), 9),
  ...bol('med-ariz', duz('e70', 'med-ariz'), 9),
  ...bol('med-lin', duz('e71', 'med-lin'), 10),
]);
const o7 = kur('o7', 7, 'mushaf', sureler.flatMap((s) => bol(s.id, s.ayetler.map((a): Ham => ({ ar: a.ar, ses: a.ses, s: s.id, n: a.n })), 10)));

export const YOL: readonly Basamak[] = [o1, o2, o3, o4, o5, o6, o7];

/** Adımın bütün maddeleri (ilerleme dizesindeki sırayla). */
export const adimOgeleri = (adim: string): Oge[] => YOL.find((b) => b.id === adim)?.dersler.flatMap((d) => d.ogeler) ?? [];
export const basamakBul = (adim: string): Basamak | undefined => YOL.find((b) => b.id === adim);
export const dersBul = (dersId: string): Ders | undefined => YOL.flatMap((b) => b.dersler).find((d) => d.id === dersId);

const TUM = new Map<string, Oge>(YOL.flatMap((b) => b.dersler.flatMap((d) => d.ogeler)).map((o) => [o.id, o]));
export const ogeBul = (id: string): Oge | undefined => TUM.get(id);
export const TUM_OGELER: readonly Oge[] = [...TUM.values()];

/** Oturum kurucusunun (oturum.ts) ve tarayıcının bildiği yalın yapı: adım, iz, madde sayısı. */
export const PLAN = YOL.map((b) => ({ id: b.id, iz: b.iz, n: b.dersler.reduce((t, d) => t + d.ogeler.length, 0) }));
