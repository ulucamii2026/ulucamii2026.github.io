/**
 * Ezber Kilimi — tek ezber kataloğu (27 Eylül 2026, Faz 1a).
 * Veri: src/data/ezber/katalog.json (şema katalog.schema.json). Yıllık plandaki serbest ezber dizeleri
 * plan-eslesme.json'da, eski kimlikler (EZBER_LISTESI, seviye testi ez01…) eski-kimlikler.json'da eşlenir;
 * yıllık plan JSON'u elle düzenlenmez. Bu modül ekran ve veritabanı bilmez. Kurallar: docs/EZBER-KILIMI.md.
 */
import type { Dil } from '../../i18n/ui';
import katalogVerisi from '../../data/ezber/katalog.json';
import planEslesme from '../../data/ezber/plan-eslesme.json';
import eskiKimlikler from '../../data/ezber/eski-kimlikler.json';

export type Seviye = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'kenar';
export type EzberTuru = 'sure' | 'dua' | 'bilgi';
export type BesDil = Record<Dil, string>;
export interface EzberOgesi {
  id: string;
  tur: EzberTuru;
  seviye: Seviye;
  sira: number;
  ad: BesDil;
  /** Kur'an metni mi (Kur'an'dan olan dualar dahil): yapay ses yasağının ve «yalnız Diyanet» kuralının dayanağı. */
  kuranMetni: boolean;
  kuran?: { sure: number; ayetler: [number, number] };
  ses?: { tam?: string; parcalar?: string[] };
  not?: string;
}
export interface SeviyeTanimi { kimlik: Seviye; ad: BesDil; amac: BesDil }
export interface Katalog { surum: number; seviyeler: SeviyeTanimi[]; ogeler: EzberOgesi[] }
export type EskiKaynak = 'ezberListesi' | 'seviyeTesti';
type PlanGunu = { tarih: string; dersler?: { ezber?: string[] }[] };

export const KATALOG = katalogVerisi as unknown as Katalog;
export const SEVIYE_SIRASI: readonly Seviye[] = [1, 2, 3, 4, 5, 6, 7, 8, 'kenar'];

const dizin = new Map(KATALOG.ogeler.map((o) => [o.id, o]));
const planTablosu = planEslesme as Record<string, string[]>;
const eskiTablo = eskiKimlikler as Record<EskiKaynak, Record<string, string[]>>;

export function ezberBul(id: string): EzberOgesi | undefined {
  return dizin.get(id);
}

export function seviyeOgeleri(seviye: Seviye, katalog: Katalog = KATALOG): EzberOgesi[] {
  return katalog.ogeler.filter((o) => o.seviye === seviye).sort((a, b) => a.sira - b.sira);
}

export function planKimlikleri(planMetni: string): string[] {
  return Object.hasOwn(planTablosu, planMetni) ? planTablosu[planMetni] : [];
}

export function eskiKimliktenYeni(kaynak: EskiKaynak, eski: string): string[] {
  const tablo = eskiTablo[kaynak] ?? {};
  return Object.hasOwn(tablo, eski) ? tablo[eski] : [];
}

/** Katalog kimliği → yıllık planda ilk geçtiği tarih («sınıf hedefi»). Aynı madde birden çok yazımla geçebilir. */
export function sinifHedefleri(plan: { gunler: PlanGunu[] }): Record<string, string> {
  const hedef: Record<string, string> = {};
  for (const gun of plan.gunler)
    for (const ders of gun.dersler ?? [])
      for (const metin of ders.ezber ?? [])
        for (const id of planKimlikleri(metin)) if (!hedef[id] || gun.tarih < hedef[id]) hedef[id] = gun.tarih;
  return hedef;
}
