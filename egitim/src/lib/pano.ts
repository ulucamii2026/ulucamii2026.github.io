/**
 * Ezber panosunun yerleşimi (Faz 1f, 27 Eylül 2026). 13 × 14 ızgara: ortada 12 sıra (7 şerit + Amme'nin 5 durağı;
 * sıra karosu + en çok 10 madde), çevresinde kenar suyu bordürü. Kenar suyunun maddeleri kilimdeki gibi
 * (src/lib/ezber/kilim.ts) saat yönünde dağılır: üst kenar soldan sağa, sağ kenar yukarıdan aşağı, alt kenar sağdan
 * sola, sol kenar aşağıdan yukarı; aradaki bordür karolarında koçboynuzu, köşelerde köşe motifi.
 * Onaylı taslakla aynı düzen (egitim/docs/taslaklar/uretim/derle.mjs). Ekran bilmez; yalnız hücre listesi üretir.
 * Madde hücreleri katalog sırasıyla gelir (şeritler, sonra kenar suyu saat yönünde): ekran okuyucu ve ok tuşları bu
 * sırayı izler; bordür, köşe ve boş hücreler süstür.
 */
import { KATALOG, seviyeOgeleri, type Katalog, type KatalogOgesi } from '@ortak/lib/ezber/katalog';
import { SERIT_MOTIFI } from '@ortak/lib/ezber/kilim';
import type { MotifAdi } from '@ortak/lib/ezber/motifler';

export const SUTUN = 13;
export type Kenar = 'ust' | 'sag' | 'alt' | 'sol';
type SiraSeviyesi = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface PanoSirasi {
  /** Pano satırı (1 tabanlı; 1. ve son satır bordürdür). */
  readonly r: number;
  readonly seviye: SiraSeviyesi;
  /** Yalnız Amme (8. şerit): 1–5. */
  readonly durak?: number;
  readonly motif: MotifAdi;
  readonly ogeler: readonly KatalogOgesi[];
}

export type PanoHucresi =
  | { readonly tur: 'madde'; readonly r: number; readonly c: number; readonly oge: KatalogOgesi; readonly motif: MotifAdi; readonly sira: PanoSirasi | null }
  | { readonly tur: 'sira'; readonly r: number; readonly c: number; readonly seviye: SiraSeviyesi }
  | { readonly tur: 'amme'; readonly r: number; readonly c: number; readonly boy: number }
  | { readonly tur: 'bos'; readonly r: number; readonly c: number }
  | { readonly tur: 'kose'; readonly r: number; readonly c: number }
  | { readonly tur: 'bordur'; readonly r: number; readonly c: number; readonly yon: Kenar };

export interface Pano {
  readonly satir: number;
  readonly sutun: number;
  readonly siralar: readonly PanoSirasi[];
  readonly hucreler: readonly PanoHucresi[];
}

/** Pano sıraları: 1–7. şeritler, sonra Amme'nin 5 durağı; kilimle aynı düzen. */
export function panoSiralari(katalog: Katalog = KATALOG): PanoSirasi[] {
  const siralar: PanoSirasi[] = [];
  for (const seviye of [1, 2, 3, 4, 5, 6, 7] as const) {
    siralar.push({ r: siralar.length + 2, seviye, motif: SERIT_MOTIFI[seviye], ogeler: seviyeOgeleri(seviye, katalog) });
  }
  const amme = seviyeOgeleri(8, katalog);
  const duraklar = [...new Set(amme.map((o) => o.durak ?? 0))].sort((a, b) => a - b);
  for (const durak of duraklar) {
    siralar.push({ r: siralar.length + 2, seviye: 8, durak, motif: SERIT_MOTIFI[8], ogeler: amme.filter((o) => (o.durak ?? 0) === durak) });
  }
  return siralar;
}

/** `n` maddeyi `uzunluk` hücrelik kenara eşit aralıkla yayar (hücre sırası, 0 tabanlı). */
function yerler(n: number, uzunluk: number): number[] {
  return Array.from({ length: n }, (_, k) => Math.floor(((k + 0.5) * uzunluk) / n));
}

export function pano(katalog: Katalog = KATALOG): Pano {
  const siralar = panoSiralari(katalog);
  const satir = siralar.length + 2;
  const hucreler: PanoHucresi[] = [];

  let ammeYazildi = false;
  for (const s of siralar) {
    if (s.ogeler.length > SUTUN - 3) throw new Error(`${s.seviye}. şerit ${s.ogeler.length} madde: panoya sığmaz`);
    if (s.seviye !== 8) hucreler.push({ tur: 'sira', r: s.r, c: 2, seviye: s.seviye });
    else if (!ammeYazildi) {
      hucreler.push({ tur: 'amme', r: s.r, c: 2, boy: siralar.filter((x) => x.seviye === 8).length });
      ammeYazildi = true;
    }
    s.ogeler.forEach((oge, j) => hucreler.push({ tur: 'madde', r: s.r, c: j + 3, oge, motif: s.motif, sira: s }));
    for (let c = s.ogeler.length + 3; c < SUTUN; c++) hucreler.push({ tur: 'bos', r: s.r, c });
  }

  // Kenar suyu: üst kenara dörtte biri kadar (yukarı yuvarlanır), kalanı sağ, alt ve sol kenarlara.
  const kenar = seviyeOgeleri('kenar', katalog);
  const n = kenar.length;
  const dagit = [Math.ceil((n * 4) / 13), 0, 0, 0];
  dagit[1] = Math.ceil((n - dagit[0]) / 3);
  dagit[2] = Math.ceil((n - dagit[0] - dagit[1]) / 2);
  dagit[3] = n - dagit[0] - dagit[1] - dagit[2];
  if (dagit[0] > SUTUN - 2 || dagit[1] > satir - 2 || dagit[2] > SUTUN - 2 || dagit[3] > satir - 2) {
    throw new Error(`kenar suyu ${n} madde: bordüre sığmaz`);
  }
  const kenarYeri: [number, number][] = [
    ...yerler(dagit[0], SUTUN - 2).map((k): [number, number] => [1, 2 + k]),
    ...yerler(dagit[1], satir - 2).map((k): [number, number] => [2 + k, SUTUN]),
    ...yerler(dagit[2], SUTUN - 2).map((k): [number, number] => [satir, SUTUN - 1 - k]),
    ...yerler(dagit[3], satir - 2).map((k): [number, number] => [satir - 1 - k, 1]),
  ];
  const dolu = new Set<string>();
  kenar.forEach((oge, i) => {
    const [r, c] = kenarYeri[i];
    dolu.add(`${r}.${c}`);
    hucreler.push({ tur: 'madde', r, c, oge, motif: SERIT_MOTIFI.kenar, sira: null });
  });

  for (let r = 1; r <= satir; r++) {
    for (let c = 1; c <= SUTUN; c++) {
      const yon: Kenar | '' = r === 1 ? 'ust' : c === SUTUN ? 'sag' : r === satir ? 'alt' : c === 1 ? 'sol' : '';
      if (!yon || dolu.has(`${r}.${c}`)) continue;
      const kose = (r === 1 || r === satir) && (c === 1 || c === SUTUN);
      hucreler.push(kose ? { tur: 'kose', r, c } : { tur: 'bordur', r, c, yon });
    }
  }
  return { satir, sutun: SUTUN, siralar, hucreler };
}
