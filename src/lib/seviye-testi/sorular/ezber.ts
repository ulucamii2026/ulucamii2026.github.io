/** Seviye testi soru bankası — ezber (içerik yazımı sürüyor; docs/SEVIYE-TESTI.md kılavuzu).
 *
 *  Sıra, Diyanet 2025 «Kur’an-ı Kerim ve Temel Dinî Bilgiler Öğretim Programı» ezber listesini izler.
 *  Katılımcı her madde için üç durumdan birini işaretler (0 bilmiyorum · 1 bakarak okurum · 2 ezbere biliyorum);
 *  bu durumlar bileşende yazılıdır, bankada değil.
 */
import type { EzberMaddesi } from '../tipler.ts';

export const EZBER: EzberMaddesi[] = [
  {
    id: 'ez01',
    ad: {
      tr: 'Eûzü-Besmele',
      fr: 'Ta’awwoudh et Basmala (Aoudhou billah – Bismillah)',
      en: 'Ta’awwudh and Basmalah (Audhu billah – Bismillah)',
    },
    aciklama: {
      tr: 'Kur’an okumaya ve her hayırlı işe başlarken söylenir.',
      fr: 'Se dit avant de lire le Coran et avant toute bonne action.',
      en: 'Said before reciting the Qur’an and before any good deed.',
    },
  },
  {
    id: 'ez02',
    ad: {
      tr: 'Kelime-i şehâdet',
      fr: 'Chahada (kalimat ach-chahada)',
      en: 'Shahadah (kalimat ash-shahadah)',
    },
    aciklama: {
      tr: 'İmanın sözle ikrarıdır; her fırsatta tekrarlanır.',
      fr: 'Profession de foi prononcée à voix haute ; elle se répète à toute occasion.',
      en: 'The spoken declaration of faith; repeated on every occasion.',
    },
  },
  {
    id: 'ez03',
    ad: { tr: 'Sübhâneke duası', fr: 'Sobhanaka', en: 'Subhanaka' },
    aciklama: {
      tr: 'Namaza başlarken, iftitah tekbirinden sonra okunur.',
      fr: 'Se récite au début de la prière, après le premier takbir.',
      en: 'Recited at the beginning of the prayer, after the opening takbir.',
    },
  },
  {
    id: 'ez04',
    ad: { tr: 'Fâtiha sûresi', fr: 'Sourate Al-Fatiha', en: 'Surah Al-Fatiha' },
    aciklama: {
      tr: 'Namazın kıyamında, her rekâtta okunur; Kur’an’ın ilk sûresidir.',
      fr: 'Se récite debout, à chaque unité (rak’a) de la prière ; c’est la première sourate du Coran.',
      en: 'Recited standing, in every unit (rak’ah) of the prayer; it is the first surah of the Qur’an.',
    },
  },
  {
    id: 'ez05',
    ad: { tr: 'Tahiyyât (Ettehiyyâtü)', fr: 'Tachahhoud (at-Tahiyyat)', en: 'Tashahhud (at-Tahiyyat)' },
    aciklama: {
      tr: 'Namazda oturuşlarda (ka’delerde) okunur.',
      fr: 'Se récite lors des positions assises de la prière.',
      en: 'Recited during the sitting positions of the prayer.',
    },
  },
  {
    id: 'ez06',
    ad: { tr: 'Salli ve Bârik duaları', fr: 'Salawat (Salli – Barik)', en: 'Salawat (Salli – Barik)' },
    aciklama: {
      tr: 'Namazın son oturuşunda, Tahiyyât’tan sonra okunur.',
      fr: 'Se récitent lors de la dernière position assise, après le tachahhoud.',
      en: 'Recited in the final sitting, after the tashahhud.',
    },
  },
  {
    id: 'ez07',
    ad: {
      tr: 'Rabbenâ duaları',
      fr: 'Invocations Rabbana (Rabbana atina – Rabbana-ghfir li)',
      en: 'Rabbana supplications (Rabbana atina – Rabbana-ghfir li)',
    },
    aciklama: {
      tr: 'Namazın son oturuşunda, Salli–Bârik duasından sonra okunur.',
      fr: 'Se récitent à la fin de la prière, après Salli – Barik.',
      en: 'Recited at the end of the prayer, after Salli – Barik.',
    },
  },
  {
    id: 'ez08',
    ad: { tr: 'Kunut duaları', fr: 'Invocations du qounout', en: 'Qunut supplications' },
    aciklama: {
      tr: 'Vitir namazının üçüncü rekâtında okunur.',
      fr: 'Se récitent dans la troisième rak’a de la prière du witr.',
      en: 'Recited in the third rak’ah of the witr prayer.',
    },
  },
  {
    id: 'ez09',
    ad: {
      tr: 'Âmentü',
      fr: 'Amantou (profession des six piliers de la foi)',
      en: 'Amantu (declaration of the six articles of faith)',
    },
    aciklama: {
      tr: 'İmanın altı esasını özetleyen metindir.',
      fr: 'Texte qui résume les six piliers de la foi.',
      en: 'The text summarising the six articles of faith.',
    },
  },
  {
    id: 'ez10',
    ad: {
      tr: 'Fîl sûresinden Tebbet sûresine kadar kısa sûreler',
      fr: 'Les courtes sourates, de Al-Fil à Al-Masad (Tabbat)',
      en: 'The short surahs, from Al-Fil to Al-Masad (Tabbat)',
    },
    aciklama: {
      tr: 'Fîl, Kureyş, Mâûn, Kevser, Kâfirûn, Nasr, Tebbet; namazda Fâtiha’dan sonra okunur.',
      fr: 'Al-Fil, Qouraych, Al-Maoun, Al-Kawthar, Al-Kafiroun, An-Nasr, Al-Masad ; se récitent après la Fatiha dans la prière.',
      en: 'Al-Fil, Quraysh, Al-Maun, Al-Kawthar, Al-Kafirun, An-Nasr, Al-Masad; recited after the Fatiha in the prayer.',
    },
  },
  {
    id: 'ez11',
    ad: {
      tr: 'İhlâs, Felak ve Nâs sûreleri',
      fr: 'Sourates Al-Ikhlas, Al-Falaq et An-Nas',
      en: 'Surahs Al-Ikhlas, Al-Falaq and An-Nas',
    },
    aciklama: {
      tr: 'En çok okunan üç kısa sûredir; namazda ve korunma duası olarak okunur.',
      fr: 'Les trois courtes sourates les plus récitées : dans la prière et comme invocation de protection.',
      en: 'The three most frequently recited short surahs: in prayer and as a supplication for protection.',
    },
  },
  {
    id: 'ez12',
    ad: { tr: 'Âyetü’l-Kürsî', fr: 'Ayat al-Koursi (le verset du Trône)', en: 'Ayat al-Kursi (the Verse of the Throne)' },
    aciklama: {
      tr: 'Bakara sûresinin 255. âyetidir; farz namazlardan sonra okunur.',
      fr: 'Verset 255 de la sourate Al-Baqara ; se récite après les prières obligatoires.',
      en: 'Verse 255 of Surah Al-Baqara; recited after the obligatory prayers.',
    },
  },
  {
    id: 'ez13',
    ad: { tr: 'Ezan ve kāmet', fr: 'Adhan et iqama', en: 'Adhan and iqamah' },
    aciklama: {
      tr: 'Ezan namaz vaktini duyurur; kāmet namaza durulurken okunur.',
      fr: 'L’adhan annonce l’heure de la prière ; l’iqama se dit juste avant de commencer la prière.',
      en: 'The adhan announces the prayer time; the iqamah is called just before the prayer begins.',
    },
  },
  {
    id: 'ez14',
    ad: { tr: 'Yemek duası', fr: 'Invocation du repas', en: 'Supplication for meals' },
    aciklama: {
      tr: 'Yemekten önce ve sonra okunur.',
      fr: 'Se récite avant et après le repas.',
      en: 'Recited before and after a meal.',
    },
  },
];
