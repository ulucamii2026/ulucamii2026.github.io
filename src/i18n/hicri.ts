/** Diyanet verisindeki Türkçe hicrî ay adlarını Fransızca / İngilizce karşılığına çevirir. */
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

export function hicriCevir(hicri: string, dil: Dil): string {
  if (dil === 'tr' || !hicri) return hicri;
  const AYLAR = dil === 'en' ? EN : FR;
  return hicri.replace(/[A-Za-zÇçĞğİıÖöŞşÜü]+/g, (k) => {
    const anahtar = k.toLocaleLowerCase('tr-TR');
    return AYLAR[anahtar] ?? k;
  });
}
