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
      nl: 'Ta’awwoedh en Basmala (Aoedhoe billah – Bismillah)',
      de: 'Ta’awwudh und Basmala (Audhu billah – Bismillah)',
    },
    aciklama: {
      tr: 'Kur’an okumaya ve her hayırlı işe başlarken söylenir.',
      fr: 'Se dit avant de lire le Coran et avant toute bonne action.',
      en: 'Said before reciting the Qur’an and before any good deed.',
      nl: 'Wordt gezegd vóór het lezen van de Koran en vóór elke goede daad.',
      de: 'Wird vor dem Lesen des Korans und vor jeder guten Tat gesprochen.',
    },
  },
  {
    id: 'ez02',
    ad: {
      tr: 'Kelime-i şehâdet',
      fr: 'Chahada (kalimat ach-chahada)',
      en: 'Shahadah (kalimat ash-shahadah)',
      nl: 'Sjahada (kalimat asj-sjahada)',
      de: 'Schahada (kalimat asch-schahada)',
    },
    aciklama: {
      tr: 'İmanın sözle ikrarıdır; her fırsatta tekrarlanır.',
      fr: 'Profession de foi prononcée à voix haute ; elle se répète à toute occasion.',
      en: 'The spoken declaration of faith; repeated on every occasion.',
      nl: 'De hardop uitgesproken geloofsgetuigenis; ze wordt bij elke gelegenheid herhaald.',
      de: 'Das laut ausgesprochene Glaubensbekenntnis; es wird bei jeder Gelegenheit wiederholt.',
    },
  },
  {
    id: 'ez03',
    ad: { tr: 'Sübhâneke duası', fr: 'Sobhanaka', en: 'Subhanaka', nl: 'Soebhanaka', de: 'Subhanaka' },
    aciklama: {
      tr: 'Namaza başlarken, iftitah tekbirinden sonra okunur.',
      fr: 'Se récite au début de la prière, après le premier takbir.',
      en: 'Recited at the beginning of the prayer, after the opening takbir.',
      nl: 'Wordt aan het begin van het gebed gereciteerd, na de eerste takbir.',
      de: 'Wird zu Beginn des Gebets nach dem ersten Takbir rezitiert.',
    },
  },
  {
    id: 'ez04',
    ad: { tr: 'Fâtiha sûresi', fr: 'Sourate Al-Fatiha', en: 'Surah Al-Fatiha', nl: 'Soera Al-Fatiha', de: 'Sure Al-Fatiha' },
    aciklama: {
      tr: 'Namazın kıyamında, her rekâtta okunur; Kur’an’ın ilk sûresidir.',
      fr: 'Se récite debout, à chaque unité (rak’a) de la prière ; c’est la première sourate du Coran.',
      en: 'Recited standing, in every unit (rak’ah) of the prayer; it is the first surah of the Qur’an.',
      nl: 'Wordt staand gereciteerd, in elke gebedseenheid (raka) van het gebed; het is de eerste soera van de Koran.',
      de: 'Wird im Stehen in jeder Gebetseinheit (Raka) rezitiert; sie ist die erste Sure des Korans.',
    },
  },
  {
    id: 'ez05',
    ad: { tr: 'Tahiyyât (Ettehiyyâtü)', fr: 'Tachahhoud (at-Tahiyyat)', en: 'Tashahhud (at-Tahiyyat)', nl: 'Tasjahhoed (at-Tahiyyat)', de: 'Taschahhud (at-Tahiyyat)' },
    aciklama: {
      tr: 'Namazda oturuşlarda (ka’delerde) okunur.',
      fr: 'Se récite lors des positions assises de la prière.',
      en: 'Recited during the sitting positions of the prayer.',
      nl: 'Wordt gereciteerd tijdens de zithoudingen in het gebed.',
      de: 'Wird während der Sitzpositionen im Gebet rezitiert.',
    },
  },
  {
    id: 'ez06',
    ad: { tr: 'Salli ve Bârik duaları', fr: 'Salawat (Salli – Barik)', en: 'Salawat (Salli – Barik)', nl: 'Salawat (Salli – Barik)', de: 'Salawat (Salli – Barik)' },
    aciklama: {
      tr: 'Namazın son oturuşunda, Tahiyyât’tan sonra okunur.',
      fr: 'Se récitent lors de la dernière position assise, après le tachahhoud.',
      en: 'Recited in the final sitting, after the tashahhud.',
      nl: 'Worden in de laatste zithouding gereciteerd, na de tasjahhoed.',
      de: 'Werden in der letzten Sitzposition nach dem Taschahhud rezitiert.',
    },
  },
  {
    id: 'ez07',
    ad: {
      tr: 'Rabbenâ duaları',
      fr: 'Invocations Rabbana (Rabbana atina – Rabbana-ghfir li)',
      en: 'Rabbana supplications (Rabbana atina – Rabbana-ghfir li)',
      nl: 'Rabbana-smeekbeden (Rabbana atina – Rabbana-ghfir li)',
      de: 'Rabbana-Bittgebete (Rabbana atina – Rabbana-ghfir li)',
    },
    aciklama: {
      tr: 'Namazın son oturuşunda, Salli–Bârik duasından sonra okunur.',
      fr: 'Se récitent à la fin de la prière, après Salli – Barik.',
      en: 'Recited at the end of the prayer, after Salli – Barik.',
      nl: 'Worden aan het einde van het gebed gereciteerd, na Salli – Barik.',
      de: 'Werden am Ende des Gebets nach Salli – Barik rezitiert.',
    },
  },
  {
    id: 'ez08',
    ad: { tr: 'Kunut duaları', fr: 'Invocations du qounout', en: 'Qunut supplications', nl: 'Smeekbeden van de qoenoet', de: 'Bittgebete des Qunut' },
    aciklama: {
      tr: 'Vitir namazının üçüncü rekâtında okunur.',
      fr: 'Se récitent dans la troisième rak’a de la prière du witr.',
      en: 'Recited in the third rak’ah of the witr prayer.',
      nl: 'Worden in de derde gebedseenheid (raka) van het witr-gebed gereciteerd.',
      de: 'Werden in der dritten Gebetseinheit (Raka) des Witr-Gebets rezitiert.',
    },
  },
  {
    id: 'ez09',
    ad: {
      tr: 'Âmentü',
      fr: 'Amantou (profession des six piliers de la foi)',
      en: 'Amantu (declaration of the six articles of faith)',
      nl: 'Amantoe (belijdenis van de zes geloofsartikelen)',
      de: 'Amantu (Bekenntnis der sechs Glaubensartikel)',
    },
    aciklama: {
      tr: 'İmanın altı esasını özetleyen metindir.',
      fr: 'Texte qui résume les six piliers de la foi.',
      en: 'The text summarising the six articles of faith.',
      nl: 'De tekst die de zes geloofsartikelen samenvat.',
      de: 'Der Text, der die sechs Glaubensartikel zusammenfasst.',
    },
  },
  {
    id: 'ez10',
    ad: {
      tr: 'Fîl sûresinden Tebbet sûresine kadar kısa sûreler',
      fr: 'Les courtes sourates, de Al-Fil à Al-Masad (Tabbat)',
      en: 'The short surahs, from Al-Fil to Al-Masad (Tabbat)',
      nl: 'De korte soera’s, van Al-Fil tot Al-Masad (Tabbat)',
      de: 'Die kurzen Suren, von Al-Fil bis Al-Masad (Tabbat)',
    },
    aciklama: {
      tr: 'Fîl, Kureyş, Mâûn, Kevser, Kâfirûn, Nasr, Tebbet; namazda Fâtiha’dan sonra okunur.',
      fr: 'Al-Fil, Qouraych, Al-Maoun, Al-Kawthar, Al-Kafiroun, An-Nasr, Al-Masad ; se récitent après la Fatiha dans la prière.',
      en: 'Al-Fil, Quraysh, Al-Maun, Al-Kawthar, Al-Kafirun, An-Nasr, Al-Masad; recited after the Fatiha in the prayer.',
      nl: 'Al-Fil, Qoeraisj, Al-Maoen, Al-Kawthar, Al-Kafiroen, An-Nasr, Al-Masad; worden in het gebed na de Fatiha gereciteerd.',
      de: 'Al-Fil, Quraisch, Al-Maun, Al-Kauthar, Al-Kafirun, An-Nasr, Al-Masad; werden im Gebet nach der Fatiha rezitiert.',
    },
  },
  {
    id: 'ez11',
    ad: {
      tr: 'İhlâs, Felak ve Nâs sûreleri',
      fr: 'Sourates Al-Ikhlas, Al-Falaq et An-Nas',
      en: 'Surahs Al-Ikhlas, Al-Falaq and An-Nas',
      nl: 'Soera’s Al-Ichlas, Al-Falaq en An-Nas',
      de: 'Suren Al-Ichlas, Al-Falaq und An-Nas',
    },
    aciklama: {
      tr: 'En çok okunan üç kısa sûredir; namazda ve korunma duası olarak okunur.',
      fr: 'Les trois courtes sourates les plus récitées : dans la prière et comme invocation de protection.',
      en: 'The three most frequently recited short surahs: in prayer and as a supplication for protection.',
      nl: 'De drie meest gereciteerde korte soera’s: in het gebed en als smeekbede om bescherming.',
      de: 'Die drei am häufigsten rezitierten kurzen Suren: im Gebet und als Bittgebet um Schutz.',
    },
  },
  {
    id: 'ez12',
    ad: { tr: 'Âyetü’l-Kürsî', fr: 'Ayat al-Koursi (le verset du Trône)', en: 'Ayat al-Kursi (the Verse of the Throne)', nl: 'Ayat al-Koersi (het vers van de Troon)', de: 'Ayat al-Kursi (der Thronvers)' },
    aciklama: {
      tr: 'Bakara sûresinin 255. âyetidir; farz namazlardan sonra okunur.',
      fr: 'Verset 255 de la sourate Al-Baqara ; se récite après les prières obligatoires.',
      en: 'Verse 255 of Surah Al-Baqara; recited after the obligatory prayers.',
      nl: 'Vers 255 van soera Al-Baqara; wordt na de verplichte gebeden gereciteerd.',
      de: 'Vers 255 der Sure Al-Baqara; wird nach den Pflichtgebeten rezitiert.',
    },
  },
  {
    id: 'ez13',
    ad: { tr: 'Ezan ve kāmet', fr: 'Adhan et iqama', en: 'Adhan and iqamah', nl: 'Adhan en iqama', de: 'Adhan und Iqama' },
    aciklama: {
      tr: 'Ezan namaz vaktini duyurur; kāmet namaza durulurken okunur.',
      fr: 'L’adhan annonce l’heure de la prière ; l’iqama se dit juste avant de commencer la prière.',
      en: 'The adhan announces the prayer time; the iqamah is called just before the prayer begins.',
      nl: 'De adhan kondigt de gebedstijd aan; de iqama wordt vlak vóór het begin van het gebed uitgesproken.',
      de: 'Der Adhan kündigt die Gebetszeit an; die Iqama wird unmittelbar vor Beginn des Gebets gesprochen.',
    },
  },
  {
    id: 'ez14',
    ad: { tr: 'Yemek duası', fr: 'Invocation du repas', en: 'Supplication for meals', nl: 'Smeekbede bij de maaltijd', de: 'Bittgebet zum Essen' },
    aciklama: {
      tr: 'Yemekten önce ve sonra okunur.',
      fr: 'Se récite avant et après le repas.',
      en: 'Recited before and after a meal.',
      nl: 'Wordt voor en na de maaltijd gereciteerd.',
      de: 'Wird vor und nach dem Essen gesprochen.',
    },
  },
];
