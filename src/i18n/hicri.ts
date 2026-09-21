/** Diyanet verisindeki Türkçe hicrî ay adlarını ziyaretçinin dilindeki karşılığına çevirir.
    Türkçe olduğu gibi kalır; diğer diller kendi yazımlarını alır (sessiz Fransızca yok). */
import type { Dil } from './ui';

const FR: Record<string, string> = {
  muharrem: 'Mouharram', safer: 'Safar', rebiulevvel: 'Rabi‘ al-awwal', rebiülevvel: 'Rabi‘ al-awwal',
  rebiulahir: 'Rabi‘ al-thani', rebiülahir: 'Rabi‘ al-thani', cemaziyelevvel: 'Joumada al-oula', cemaziyelahir: 'Joumada al-thania',
  recep: 'Rajab', şaban: 'Cha‘ban', ramazan: 'Ramadan', şevval: 'Chawwal', zilkade: 'Dhou al-qi‘da', zilhicce: 'Dhou al-hijja',
};
const EN: Record<string, string> = {
  muharrem: 'Muharram', safer: 'Safar', rebiulevvel: 'Rabi‘ al-awwal', rebiülevvel: 'Rabi‘ al-awwal',
  rebiulahir: 'Rabi‘ al-thani', rebiülahir: 'Rabi‘ al-thani', cemaziyelevvel: 'Jumada al-awwal', cemaziyelahir: 'Jumada al-thani',
  recep: 'Rajab', şaban: 'Sha‘ban', ramazan: 'Ramadan', şevval: 'Shawwal', zilkade: 'Dhu al-Qi‘dah', zilhicce: 'Dhu al-Hijjah',
};
const NL: Record<string, string> = {
  muharrem: 'Moeharram', safer: 'Safar', rebiulevvel: 'Rabi‘ al-awwal', rebiülevvel: 'Rabi‘ al-awwal',
  rebiulahir: 'Rabi‘ al-thani', rebiülahir: 'Rabi‘ al-thani', cemaziyelevvel: 'Djoemada al-oela', cemaziyelahir: 'Djoemada al-thania',
  recep: 'Radjab', şaban: 'Sja‘ban', ramazan: 'Ramadan', şevval: 'Sjawwal', zilkade: 'Dhoe al-qi‘da', zilhicce: 'Dhoe al-hidja',
};
const DE: Record<string, string> = {
  muharrem: 'Muharram', safer: 'Safar', rebiulevvel: 'Rabi al-awwal', rebiülevvel: 'Rabi al-awwal',
  rebiulahir: 'Rabi ath-thani', rebiülahir: 'Rabi ath-thani', cemaziyelevvel: 'Dschumada al-ula', cemaziyelahir: 'Dschumada ath-thaniya',
  recep: 'Radschab', şaban: 'Schaban', ramazan: 'Ramadan', şevval: 'Schawwal', zilkade: 'Dhu l-qada', zilhicce: 'Dhu l-hiddscha',
};

/** Her dil için ay sözlüğü; `null` = Diyanet'in Türkçe yazımı olduğu gibi gösterilir. */
const SOZLUK: Record<Dil, Record<string, string> | null> = { tr: null, fr: FR, en: EN, nl: NL, de: DE };

export function hicriCevir(hicri: string, dil: Dil): string {
  const AYLAR = SOZLUK[dil];
  if (!AYLAR || !hicri) return hicri;
  return hicri.replace(/[A-Za-zÇçĞğİıÖöŞşÜü]+/g, (k) => {
    const anahtar = k.toLocaleLowerCase('tr-TR');
    return AYLAR[anahtar] ?? k;
  });
}
