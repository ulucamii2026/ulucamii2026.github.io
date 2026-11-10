/**
 * Bilgi Yarışması soru bankası (10 Kasım 2026): src/data/yarisma/sorular.json'un tipli okuyucusu. Banka, kartlardan ve src/data/ibadet'ten
 * `scripts/yarisma-uret.mjs` ile üretilir (elle düzenlenmez); buradaki kod hüküm ÜRETMEZ, yalnız veriyi sunar. Sınıf bir ekranda birlikte
 * oynar: kişi, ad ya da puan kaydı yoktur (docs/ILIM-YOLU.md, «Bilgi Yarışması»). Sayfa betikleri `tipler.ts`'yi kullanır (JSON'suz).
 */
import type { Dil } from '../../i18n/ui';
import ham from '../../data/yarisma/sorular.json';
import { HASSAS, type Biçim, type Konu, type Soru } from './tipler';

export * from './tipler';

export const SORULAR: readonly Soru[] = (ham as unknown as { sorular: Soru[] }).sorular;

export const soruBul = (id: string): Soru | undefined => SORULAR.find((s) => s.id === id);

/** Bir sorunun karıştırılacak parça sayısı (sunum düzeni için). */
export function parcaSayisi(s: Soru): number {
  switch (s.format) {
    case 'quiz': case 'gizemli': return s.secenekler.length;
    case 'siralama': return s.ogeler.length;
    case 'gruplama': return s.ogeler.length;
    case 'eslestirme': return s.ciftler.length;
  }
}

/** Sayfa betiğine giden dar görünüm (hub: yalnız sayım için); hassas kutular hiç gitmez. */
export const ozetSatirlari = (sorular: readonly Soru[] = SORULAR): { id: string; format: Biçim; topic: Konu; level: number }[] =>
  sorular.filter((s) => !HASSAS.has(s.id)).map((s) => ({ id: s.id, format: s.format, topic: s.topic, level: s.level }));

export type YerelSoru =
  | { id: string; format: 'quiz'; topic: Konu; level: number; soru: string; secenekler: string[]; dogru: number }
  | { id: string; format: 'siralama'; topic: Konu; level: number; baslik: string; ogeler: string[] }
  | { id: string; format: 'gruplama'; topic: Konu; level: number; baslik: string; gruplar: [string, string]; ogeler: { metin: string; grup: 0 | 1 }[] }
  | { id: string; format: 'eslestirme'; topic: Konu; level: number; baslik: string; ciftler: { sol: string; sag: string }[] }
  | { id: string; format: 'gizemli'; topic: Konu; level: number; baslik: string; ipuclari: string[]; secenekler: string[]; dogru: number };

/** Bir dilin gövdesi: oyun sayfası yalnız kendi dilini taşır (`data-veri`); hassas kutular hiç taşınmaz. */
export function yerellestir(dil: Dil, sorular: readonly Soru[] = SORULAR): YerelSoru[] {
  const kok = (s: Soru) => ({ id: s.id, topic: s.topic, level: s.level });
  return sorular.filter((s) => !HASSAS.has(s.id)).map((s): YerelSoru => {
    switch (s.format) {
      case 'quiz': return { ...kok(s), format: 'quiz', soru: s.soru[dil], secenekler: s.secenekler.map((x) => x[dil]), dogru: s.dogru };
      case 'siralama': return { ...kok(s), format: 'siralama', baslik: s.baslik[dil], ogeler: s.ogeler.map((x) => x[dil]) };
      case 'gruplama': return { ...kok(s), format: 'gruplama', baslik: s.baslik[dil], gruplar: [s.gruplar[0][dil], s.gruplar[1][dil]], ogeler: s.ogeler.map((x) => ({ metin: x.metin[dil], grup: x.grup })) };
      case 'eslestirme': return { ...kok(s), format: 'eslestirme', baslik: s.baslik[dil], ciftler: s.ciftler.map((c) => ({ sol: c.sol[dil], sag: c.sag[dil] })) };
      case 'gizemli': return { ...kok(s), format: 'gizemli', baslik: s.baslik[dil], ipuclari: s.ipuclari.map((x) => x[dil]), secenekler: s.secenekler.map((x) => x[dil]), dogru: s.dogru };
    }
  });
}
