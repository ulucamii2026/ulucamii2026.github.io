/** Diyanet verisindeki Türkçe hicrî ay adlarını Fransızca (Belçika'da yaygın yazım) karşılığına çevirir. */
const AYLAR: Record<string, string> = {
  muharrem: 'Mouharram', safer: 'Safar', rebiulevvel: 'Rabi‘ al-awwal', rebiülevvel: 'Rabi‘ al-awwal',
  rebiulahir: 'Rabi‘ al-thani', rebiülahir: 'Rabi‘ al-thani', cemaziyelevvel: 'Joumada al-oula', cemaziyelahir: 'Joumada al-thania',
  recep: 'Rajab', şaban: 'Cha‘ban', ramazan: 'Ramadan', şevval: 'Chawwal', zilkade: 'Dhou al-qi‘da', zilhicce: 'Dhou al-hijja',
};

export function hicriCevir(hicri: string, dil: 'tr' | 'fr'): string {
  if (dil === 'tr' || !hicri) return hicri;
  return hicri.replace(/[A-Za-zÇçĞğİıÖöŞşÜü]+/g, (k) => {
    const anahtar = k.toLocaleLowerCase('tr-TR');
    return AYLAR[anahtar] ?? k;
  });
}
