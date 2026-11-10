/**
 * İlim Yolu bilgi yolları (Dilim 2, 10 Kasım 2026): hangi kart hangi yolda, mini sınavın değerlendirilmesi, yol kimlikleri. Saf.
 * Üç yol ailesi: `plan-<kod>` (yıllık plan konuları, ilk işlenme gününe göre), `alan-<alan>` (seviye testinin 7 alanı, basamağa göre) ve
 * `bilgi` (Ezber Kilimi'ndeki bilgi maddeleri; ilerlemesi ezber cihaz kaydından gelir, kart durumundan değil).
 */
import type { AlanKodu } from '../seviye-testi/tipler';
import type { BilgiKarti, MiniSoru, PlanKodu } from './bilgi-kartlari';
import { KODLAR } from './bilgi-ilerleme';

/** Seviye testindeki alan sırası (egitim i18n `alanlar` dizisiyle aynı). */
export const ALANLAR: readonly AlanKodu[] = ['okuma', 'kuranBilgi', 'itikat', 'namaz', 'ibadet', 'siyer', 'ahlak'];
export const BILGI_YOLU = 'bilgi';
export const TUM_YOLLAR: readonly string[] = [...KODLAR.map((k) => `plan-${k}`), ...ALANLAR.map((a) => `alan-${a}`), BILGI_YOLU];

export function yolBicimi(yol: string): { tur: 'plan'; kod: PlanKodu } | { tur: 'alan'; alan: AlanKodu } | { tur: 'bilgi' } | null {
  if (yol === BILGI_YOLU) return { tur: 'bilgi' };
  const kod = KODLAR.find((k) => yol === `plan-${k}`);
  if (kod) return { tur: 'plan', kod };
  const alan = ALANLAR.find((a) => yol === `alan-${a}`);
  return alan ? { tur: 'alan', alan } : null;
}

const karsilastir = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Bir yoldaki kartlar sırayla: plan yolu ilk işlenme gününe, alan yolu basamağa ve sonra güne göre. `bilgi` yolunda kart yoktur. */
export function yolKartlari(kartlar: readonly BilgiKarti[], yol: string): BilgiKarti[] {
  const b = yolBicimi(yol);
  if (!b || b.tur === 'bilgi') return [];
  const secili = kartlar.filter((k) => (b.tur === 'plan' ? k.kod === b.kod : k.seviyeAlani === b.alan));
  return secili.sort((x, y) => (b.tur === 'alan' ? x.basamak - y.basamak : 0) || karsilastir(x.ilkDers, y.ilkDers) || karsilastir(x.id, y.id));
}

/** Kartın içinde bulunduğu iki yol (plan ve alan). */
export const kartYollari = (k: Pick<BilgiKarti, 'kod' | 'seviyeAlani'>): [string, string] => [`plan-${k.kod}`, `alan-${k.seviyeAlani}`];

/** Mini sınav: `secimler[i]` i. sorunun işaretlenen şıkkı (işaretsiz −1); hepsi doğruysa `hepsi`. */
export function miniSinav(sorular: readonly Pick<MiniSoru, 'dogru'>[], secimler: readonly number[]): { dogru: boolean[]; hepsi: boolean } {
  const dogru = sorular.map((s, i) => secimler[i] === s.dogru);
  return { dogru, hepsi: sorular.length > 0 && dogru.every(Boolean) };
}
