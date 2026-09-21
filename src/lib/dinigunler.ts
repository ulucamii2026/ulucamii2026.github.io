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
  { tarih: '2026-08-24', hicri: '11 Rebiülevvel 1448', tur: 'kandil', ad: { tr: 'Mevlid Kandili', fr: 'Mawlid — naissance du Prophète', en: 'Mawlid al-Nabi', nl: 'Mevlid Kandili (geboortenacht van de Profeet)', de: 'Mevlid Kandili (Geburtsnacht des Propheten)' } },
  { tarih: '2026-12-10', hicri: '1 Recep 1448', tur: 'gun', ad: { tr: 'Üç Ayların Başlangıcı', fr: 'Début des trois mois bénis', en: 'Start of the three blessed months', nl: 'Begin van de drie gezegende maanden', de: 'Beginn der drei gesegneten Monate' } },
  { tarih: '2026-12-10', hicri: '1 Recep 1448', tur: 'kandil', ad: { tr: 'Regaib Kandili', fr: 'Nuit de Raghaïb', en: 'Laylat al-Raghaib', nl: 'Regaib Kandili (gezegende nacht)', de: 'Regaib Kandili (gesegnete Nacht)' } },
  { tarih: '2027-01-04', hicri: '26 Recep 1448', tur: 'kandil', ad: { tr: 'Miraç Kandili', fr: 'Nuit de l’Ascension (Mi‘raj)', en: 'Laylat al-Mi‘raj', nl: 'Miraç Kandili (nacht van de hemelvaart)', de: 'Miraç Kandili (Nacht der Himmelfahrt)' } },
  { tarih: '2027-01-22', hicri: '14 Şaban 1448', tur: 'kandil', ad: { tr: 'Berat Kandili', fr: 'Nuit de Bara’a (mi-Cha‘ban)', en: 'Laylat al-Bara’ah', nl: 'Berat Kandili (nacht van de vergeving)', de: 'Berat Kandili (Nacht der Vergebung)' } },
  { tarih: '2027-02-08', hicri: '1 Ramazan 1448', tur: 'gun', ad: { tr: 'Ramazan Başlangıcı', fr: 'Début du Ramadan', en: 'First day of Ramadan', nl: 'Begin van de ramadan', de: 'Beginn des Ramadan' } },
  { tarih: '2027-03-05', hicri: '26 Ramazan 1448', tur: 'kandil', ad: { tr: 'Kadir Gecesi', fr: 'Nuit du Destin (Laylat al-Qadr)', en: 'Laylat al-Qadr', nl: 'Kadir Gecesi (nacht van de lotsbeschikking)', de: 'Kadir Gecesi (Nacht der Bestimmung)' } },
  { tarih: '2027-03-08', hicri: '29 Ramazan 1448', tur: 'gun', ad: { tr: 'Arefe', fr: 'Veille de l’Aïd al-Fitr', en: 'Eve of Eid al-Fitr', nl: 'Arefe (dag vóór het Suikerfeest)', de: 'Arefe (Tag vor dem Ramadanfest)' } },
  { tarih: '2027-03-09', bitis: '2027-03-11', hicri: '1-3 Şevval 1448', tur: 'bayram', ad: { tr: 'Ramazan Bayramı', fr: 'Aïd al-Fitr', en: 'Eid al-Fitr', nl: 'Suikerfeest (Ramazan Bayramı)', de: 'Ramadanfest (Ramazan Bayramı)' } },
  { tarih: '2027-05-15', hicri: '9 Zilhicce 1448', tur: 'gun', ad: { tr: 'Arefe', fr: 'Jour de ‘Arafat (veille de l’Aïd)', en: 'Day of Arafah', nl: 'Arefe (dag van Arafat, vóór het Offerfeest)', de: 'Arefe (Tag von Arafat, vor dem Opferfest)' } },
  { tarih: '2027-05-16', bitis: '2027-05-19', hicri: '10-13 Zilhicce 1448', tur: 'bayram', ad: { tr: 'Kurban Bayramı', fr: 'Aïd al-Adha', en: 'Eid al-Adha', nl: 'Offerfeest (Kurban Bayramı)', de: 'Opferfest (Kurban Bayramı)' } },
  { tarih: '2027-06-06', hicri: '1 Muharrem 1449', tur: 'gun', ad: { tr: 'Hicrî Yılbaşı (1449)', fr: 'Nouvel an de l’Hégire (1449)', en: 'Hijri New Year (1449)', nl: 'Islamitisch nieuwjaar (1449)', de: 'Islamisches Neujahr (1449)' } },
  { tarih: '2027-06-15', hicri: '10 Muharrem 1449', tur: 'gun', ad: { tr: 'Aşure Günü', fr: 'Jour d’Achoura', en: 'Day of Ashura', nl: 'Dag van Asjoera', de: 'Tag von Aschura' } },
  { tarih: '2027-08-13', hicri: '11 Rebiülevvel 1449', tur: 'kandil', ad: { tr: 'Mevlid Kandili', fr: 'Mawlid — naissance du Prophète', en: 'Mawlid al-Nabi', nl: 'Mevlid Kandili (geboortenacht van de Profeet)', de: 'Mevlid Kandili (Geburtsnacht des Propheten)' } },
];

/** Bugünden (Brüksel) itibaren yaklaşan günler; çok günlü bayramlar son günü geçene dek listede kalır. */
export function yaklasanDiniGunler(bugun: string): DiniGun[] {
  // .sort(): DINI_GUNLER elle kronolojik tutulsa da sıralamayı garanti altına al —
  // Namaz.astro'daki «Yaklaşan» rozeti gunlerListe[0]'ın gerçekten en yakın gün olmasına dayanır.
  return DINI_GUNLER.filter((g) => (g.bitis ?? g.tarih) >= bugun).sort((a, b) => a.tarih.localeCompare(b.tarih));
}
