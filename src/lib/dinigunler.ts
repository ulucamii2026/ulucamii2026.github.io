/**
 * Dinî günler ve kandiller — Diyanet İşleri Başkanlığı resmî listesi.
 * Kaynak: vakithesaplama.diyanet.gov.tr (2026: icerik=153, 2027: icerik=154; 23-24 Ağustos 2026'da doğrulandı).
 * `hicri` Türkçe yazılır; FR/EN görünümü i18n/hicri.ts (hicriCevir) ile çevrilir.
 */
import type { Dil } from '../i18n/ui';

export interface DiniGun {
  /** Başlangıç tarihi (Brüksel), YYYY-MM-DD */
  tarih: string;
  /** Çok günlü bayramlar için son gün */
  bitis?: string;
  hicri: string;
  tur: 'kandil' | 'bayram' | 'gun';
  ad: Record<Dil, string>;
}

export const DINI_GUNLER: DiniGun[] = [
  { tarih: '2026-08-24', hicri: '11 Rebiülevvel 1448', tur: 'kandil', ad: { tr: 'Mevlid Kandili', fr: 'Mawlid — naissance du Prophète', en: 'Mawlid al-Nabi' } },
  { tarih: '2026-12-10', hicri: '1 Recep 1448', tur: 'gun', ad: { tr: 'Üç Ayların Başlangıcı', fr: 'Début des trois mois bénis', en: 'Start of the three blessed months' } },
  { tarih: '2026-12-10', hicri: '1 Recep 1448', tur: 'kandil', ad: { tr: 'Regaib Kandili', fr: 'Nuit de Raghaïb', en: 'Laylat al-Raghaib' } },
  { tarih: '2027-01-04', hicri: '26 Recep 1448', tur: 'kandil', ad: { tr: 'Miraç Kandili', fr: 'Nuit de l’Ascension (Mi‘raj)', en: 'Laylat al-Mi‘raj' } },
  { tarih: '2027-01-22', hicri: '14 Şaban 1448', tur: 'kandil', ad: { tr: 'Berat Kandili', fr: 'Nuit de Bara’a (mi-Cha‘ban)', en: 'Laylat al-Bara’ah' } },
  { tarih: '2027-02-08', hicri: '1 Ramazan 1448', tur: 'gun', ad: { tr: 'Ramazan Başlangıcı', fr: 'Début du Ramadan', en: 'First day of Ramadan' } },
  { tarih: '2027-03-05', hicri: '26 Ramazan 1448', tur: 'kandil', ad: { tr: 'Kadir Gecesi', fr: 'Nuit du Destin (Laylat al-Qadr)', en: 'Laylat al-Qadr' } },
  { tarih: '2027-03-08', hicri: '29 Ramazan 1448', tur: 'gun', ad: { tr: 'Arefe', fr: 'Veille de l’Aïd al-Fitr', en: 'Eve of Eid al-Fitr' } },
  { tarih: '2027-03-09', bitis: '2027-03-11', hicri: '1-3 Şevval 1448', tur: 'bayram', ad: { tr: 'Ramazan Bayramı', fr: 'Aïd al-Fitr', en: 'Eid al-Fitr' } },
  { tarih: '2027-05-15', hicri: '9 Zilhicce 1448', tur: 'gun', ad: { tr: 'Arefe', fr: 'Jour de ‘Arafat (veille de l’Aïd)', en: 'Day of Arafah' } },
  { tarih: '2027-05-16', bitis: '2027-05-19', hicri: '10-13 Zilhicce 1448', tur: 'bayram', ad: { tr: 'Kurban Bayramı', fr: 'Aïd al-Adha', en: 'Eid al-Adha' } },
  { tarih: '2027-06-06', hicri: '1 Muharrem 1449', tur: 'gun', ad: { tr: 'Hicrî Yılbaşı (1449)', fr: 'Nouvel an de l’Hégire (1449)', en: 'Hijri New Year (1449)' } },
  { tarih: '2027-06-15', hicri: '10 Muharrem 1449', tur: 'gun', ad: { tr: 'Aşure Günü', fr: 'Jour d’Achoura', en: 'Day of Ashura' } },
  { tarih: '2027-08-13', hicri: '11 Rebiülevvel 1449', tur: 'kandil', ad: { tr: 'Mevlid Kandili', fr: 'Mawlid — naissance du Prophète', en: 'Mawlid al-Nabi' } },
];

/** Bugünden (Brüksel) itibaren yaklaşan günler; çok günlü bayramlar son günü geçene dek listede kalır. */
export function yaklasanDiniGunler(bugun: string): DiniGun[] {
  return DINI_GUNLER.filter((g) => (g.bitis ?? g.tarih) >= bugun);
}
