/** Seviye testi soru bankası — kuran-bilgi (içerik yazımı sürüyor; docs/SEVIYE-TESTI.md kılavuzu). */
import type { BilgiMaddesi } from '../tipler.ts';

export const KURAN_BILGI: BilgiMaddesi[] = [
  // ——— B1: ilk haftalarda öğrenilen temel bilgi ———
  {
    id: 'kb01',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 1,
    soru: {
      tr: 'Kur’an-ı Kerim hangi peygambere ve hangi dilde indirilmiştir?',
      fr: 'À quel prophète et dans quelle langue le Coran a-t-il été révélé ?',
      en: 'To which prophet and in which language was the Qur’an revealed?',
    },
    siklar: [
      {
        tr: 'Hz. Mûsâ’ya (a.s.), İbrânîce',
        fr: 'Au prophète Moïse (Moussa), en hébreu',
        en: 'To Prophet Moses (Musa), in Hebrew',
      },
      {
        tr: 'Hz. Îsâ’ya (a.s.), Süryânîce',
        fr: 'Au prophète Jésus (Issa), en syriaque',
        en: 'To Prophet Jesus (Isa), in Syriac',
      },
      {
        tr: 'Hz. Muhammed’e (s.a.s.), Arapça',
        fr: 'Au prophète Muhammad (paix et salut sur lui), en arabe',
        en: 'To Prophet Muhammad (peace be upon him), in Arabic',
      },
      {
        tr: 'Hz. Muhammed’e (s.a.s.), Farsça',
        fr: 'Au prophète Muhammad (paix et salut sur lui), en persan',
        en: 'To Prophet Muhammad (peace be upon him), in Persian',
      },
    ],
    dogru: 2,
    kaynak: 'TDV İslâm Ansiklopedisi, «Kur’an» maddesi — https://islamansiklopedisi.org.tr/kuran (Arapça olarak Hz. Muhammed’e indirilmiştir)',
  },
  {
    id: 'kb02',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 1,
    soru: {
      tr: 'Kur’an-ı Kerim’in en başında yer alan, adı «açılış» anlamına gelen sûre hangisidir?',
      fr: 'Quelle est la sourate placée tout au début du Coran, dont le nom signifie « l’ouverture » ?',
      en: 'Which surah stands at the very beginning of the Qur’an and has a name meaning “the opening”?',
    },
    siklar: [
      { tr: 'İhlâs sûresi', fr: 'Sourate Al-Ikhlas', en: 'Surah Al-Ikhlas' },
      { tr: 'Fâtiha sûresi', fr: 'Sourate Al-Fatiha', en: 'Surah Al-Fatiha' },
      { tr: 'Bakara sûresi', fr: 'Sourate Al-Baqara', en: 'Surah Al-Baqara' },
      { tr: 'Yâsîn sûresi', fr: 'Sourate Ya-Sin', en: 'Surah Ya-Sin' },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Fâtiha Sûresi» maddesi — https://islamansiklopedisi.org.tr/fatiha-suresi (Kur’an’ın tertibi itibariyle birinci sûre)',
  },
  {
    id: 'kb03',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 1,
    soru: {
      tr: 'Kur’an-ı Kerim kaç sûreden oluşur?',
      fr: 'Le Coran est composé de combien de sourates ?',
      en: 'How many surahs does the Qur’an consist of?',
    },
    siklar: [
      { tr: '99 sûre', fr: '99 sourates', en: '99 surahs' },
      { tr: '104 sûre', fr: '104 sourates', en: '104 surahs' },
      { tr: '110 sûre', fr: '110 sourates', en: '110 surahs' },
      { tr: '114 sûre', fr: '114 sourates', en: '114 surahs' },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Kur’an» maddesi — https://islamansiklopedisi.org.tr/kuran («Hz. Osman’ın mushaflarına göre Kur’an’da 114 sûre bulunmaktadır»)',
  },
  {
    id: 'kb04',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 1,
    soru: {
      tr: '«Yaratan Rabbinin adıyla oku!» âyetiyle başlayan ilk vahiy, hangi sûrenin ilk âyetleridir?',
      fr: 'La première révélation, qui commence par « Lis, au nom de ton Seigneur qui a créé ! », forme les premiers versets de quelle sourate ?',
      en: 'The first revelation, which begins “Read, in the name of your Lord who created”, forms the opening verses of which surah?',
    },
    siklar: [
      { tr: 'Alak sûresi', fr: 'Sourate Al-Alaq', en: 'Surah Al-Alaq' },
      { tr: 'Kalem sûresi', fr: 'Sourate Al-Qalam', en: 'Surah Al-Qalam' },
      { tr: 'Müddessir sûresi', fr: 'Sourate Al-Mouddaththir', en: 'Surah Al-Muddaththir' },
      { tr: 'Duhâ sûresi', fr: 'Sourate Ad-Douha', en: 'Surah Ad-Duha' },
    ],
    dogru: 0,
    kaynak:
      'Diyanet Kur’an portalı, Alak 96/1 — https://kuran.diyanet.gov.tr/mushaf/kuran-meal-2/alak-suresi-96/ayet-1/diyanet-isleri-baskanligi-meali-1 («Yaratan Rabbinin adıyla oku!»); TDV İslâm Ansiklopedisi, «Kur’an» — https://islamansiklopedisi.org.tr/kuran',
  },

  // ——— B2: düzenli ibadet eden birinin bildiği uygulama bilgisi ———
  {
    id: 'kb05',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 2,
    soru: {
      tr: 'Kur’an-ı Kerim yaklaşık yirmi üç yıl boyunca parça parça indirilmiştir. Hicretten önce inen sûrelere ne ad verilir?',
      fr: 'Le Coran a été révélé progressivement pendant environ vingt-trois ans. Comment appelle-t-on les sourates révélées avant l’Hégire ?',
      en: 'The Qur’an was revealed gradually over about twenty-three years. What are the surahs revealed before the Hijrah called?',
    },
    siklar: [
      { tr: 'Medenî sûreler', fr: 'Les sourates médinoises (madani)', en: 'Medinan (madani) surahs' },
      { tr: 'Mekkî sûreler', fr: 'Les sourates mecquoises (makki)', en: 'Meccan (makki) surahs' },
      { tr: 'Mufassal sûreler', fr: 'Les sourates moufassal', en: 'Mufassal surahs' },
      { tr: 'Mesânî sûreler', fr: 'Les sourates mathani', en: 'Mathani surahs' },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Kur’an» maddesi — https://islamansiklopedisi.org.tr/kuran («hicretten önce nâzil olan âyet ve sûrelerin Mekkî, hicretten sonra nâzil olanların Medenî sayılması»)',
  },
  {
    id: 'kb06',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 2,
    soru: {
      tr: 'Kur’an-ı Kerim indirildiği günden bu yana hem yazıyla hem de ezberlenerek korunmuştur. Kur’an’ın tamamını ezberleyen kişiye ne ad verilir?',
      fr: 'Depuis sa révélation, le Coran a été préservé à la fois par l’écrit et par la mémorisation. Comment appelle-t-on la personne qui a mémorisé le Coran en entier ?',
      en: 'Since its revelation the Qur’an has been preserved both in writing and by memorisation. What is a person who has memorised the whole Qur’an called?',
    },
    siklar: [
      { tr: 'Müfessir', fr: 'Un moufassir (exégète)', en: 'A mufassir (exegete)' },
      { tr: 'Müezzin', fr: 'Un mouezzin', en: 'A muezzin' },
      { tr: 'Muhaddis', fr: 'Un mouhaddith (savant du hadith)', en: 'A muhaddith (hadith scholar)' },
      { tr: 'Hâfız', fr: 'Un hafiz', en: 'A hafiz' },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Hâfız» maddesi — https://islamansiklopedisi.org.tr/hafiz--kuran («Kur’an’ın tamamını ezberleyene hâfız denilmiştir»)',
  },
  {
    id: 'kb07',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 2,
    soru: {
      tr: 'Kur’an-ı Kerim, okunmasını ve ezberlenmesini kolaylaştırmak için otuz bölüme ayrılmıştır. Bu bölümlerden her birine ne ad verilir?',
      fr: 'Pour faciliter la lecture et la mémorisation, le Coran est divisé en trente parties. Comment appelle-t-on chacune de ces parties ?',
      en: 'To make reading and memorising easier, the Qur’an is divided into thirty parts. What is each of these parts called?',
    },
    siklar: [
      { tr: 'Cüz', fr: 'Un jouz’', en: 'A juz' },
      { tr: 'Sûre', fr: 'Une sourate', en: 'A surah' },
      { tr: 'Âyet', fr: 'Un verset (aya)', en: 'A verse (ayah)' },
      { tr: 'Mushaf', fr: 'Un moushaf', en: 'A mushaf' },
    ],
    dogru: 0,
    kaynak: 'Diyanet Kur’an portalı, Kur’an sözlüğü «Cüz» — https://kuran.diyanet.gov.tr/kuran-sozlugu/detay/34-cuz («Her yirmi sayfa bir cüz sayılmış, böylece Kur’ân 30 cüz’e bölünmüştür»)',
  },
  {
    id: 'kb08',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 2,
    soru: {
      tr: 'Kur’an âyetlerinin, anlamı esas alınarak başka bir dile aktarılmış hâline ne ad verilir?',
      fr: 'Comment appelle-t-on le rendu des versets du Coran dans une autre langue, fondé sur leur sens ?',
      en: 'What is the rendering of the Qur’an’s verses into another language, based on their meaning, called?',
    },
    siklar: [
      { tr: 'Tefsir', fr: 'Le tafsir (exégèse)', en: 'Tafsir (exegesis)' },
      { tr: 'Tilâvet', fr: 'La tilawa (récitation)', en: 'Tilawah (recitation)' },
      { tr: 'Meâl', fr: 'Le meal (traduction du sens)', en: 'Meal (translation of the meaning)' },
      { tr: 'Kıraat', fr: 'La qiraa (lecture)', en: 'Qiraah (reading)' },
    ],
    dogru: 2,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Meâl» maddesi — https://islamansiklopedisi.org.tr/meal ; «Tefsir» maddesi — https://islamansiklopedisi.org.tr/tefsir',
  },

  // ——— B3: tecvid kavramları (rapordaki «tecvid» işareti bu basamaktan gelir) ———
  {
    id: 'kb09',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 3,
    soru: {
      tr: 'Kur’an-ı Kerim’i harflerin hakkını vererek, kendine has kurallarına uygun biçimde okumayı öğreten ilme ne ad verilir?',
      fr: 'Comment appelle-t-on la science qui enseigne à réciter le Coran correctement, en donnant à chaque lettre son droit ?',
      en: 'What is the science that teaches reciting the Qur’an correctly, giving each letter its due, called?',
    },
    siklar: [
      { tr: 'Tefsir', fr: 'Le tafsir', en: 'Tafsir' },
      { tr: 'Tecvid', fr: 'Le tajwid', en: 'Tajwid' },
      { tr: 'Siyer', fr: 'La sira', en: 'Sirah' },
      { tr: 'Fıkıh', fr: 'Le fiqh', en: 'Fiqh' },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Tecvid» maddesi — https://islamansiklopedisi.org.tr/tecvid--kuran («Kur’ân-ı Kerîm’i harflerin mahreç ve sıfatlarına riayet edip … güzel ve hatasız okumayı öğreten ilim»)',
  },
  {
    id: 'kb10',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 3,
    soru: {
      tr: 'Tecvidde bir harfin sesinin uzatılmasına «med» denir. Bu uzatmayı sağlayan üç med harfi hangileridir?',
      fr: 'En tajwid, l’allongement du son d’une lettre s’appelle le madd. Quelles sont les trois lettres d’allongement (hourouf al-madd) ?',
      en: 'In tajwid, lengthening the sound of a letter is called madd. Which are the three letters of prolongation (huruf al-madd)?',
    },
    siklar: [
      { tr: 'Elif, vav, ye', fr: 'Alif, waw, ya', en: 'Alif, waw, ya' },
      { tr: 'Be, cim, dal', fr: 'Ba, jim, dal', en: 'Ba, jim, dal' },
      { tr: 'Sin, şın, ra', fr: 'Sin, chin, ra', en: 'Sin, shin, ra' },
      { tr: 'Mim, nun, lam', fr: 'Mim, noun, lam', en: 'Mim, nun, lam' },
    ],
    dogru: 0,
    kaynak: 'TDV İslâm Ansiklopedisi, «Med» maddesi — https://islamansiklopedisi.org.tr/med (tabiî medlerin oluşumunda «med harfleri» [hurûf-ı med]: elif, vav, ye)',
  },
  {
    id: 'kb11',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 3,
    soru: {
      tr: 'Tecvidde, yan yana gelen iki harften birincisinin ikincisine katılarak tek harf gibi okunmasına ne ad verilir?',
      fr: 'En tajwid, comment appelle-t-on le fait de fondre la première de deux lettres voisines dans la seconde, de sorte qu’elles se prononcent comme une seule ?',
      en: 'In tajwid, what is it called when the first of two adjacent letters is merged into the second so that they are pronounced as one?',
    },
    siklar: [
      { tr: 'İzhâr', fr: 'L’izhar', en: 'Izhar' },
      { tr: 'İhfâ', fr: 'L’ikhfa', en: 'Ikhfa' },
      { tr: 'İdgam', fr: 'L’idgham', en: 'Idgham' },
      { tr: 'Med', fr: 'Le madd', en: 'Madd' },
    ],
    dogru: 2,
    kaynak:
      'TDV İslâm Ansiklopedisi, «İdgam» maddesi — https://islamansiklopedisi.org.tr/idgam («iki harften ilkini ikinciye katarak telaffuz etmek») ; «İhfâ» — https://islamansiklopedisi.org.tr/ihfa ; «İzhar» — https://islamansiklopedisi.org.tr/izhar--tecvid',
  },
  {
    id: 'kb12',
    tur: 'bilgi',
    alan: 'kuranBilgi',
    basamak: 3,
    soru: {
      tr: 'Tecvidde, sükûn hâlindeyken mahreçleri sarsılarak kuvvetli bir sesle okunan harflere «kalkale harfleri» denir. Bu harfler hangileridir?',
      fr: 'En tajwid, les lettres qui, portant un soukoun, se prononcent avec un rebond sonore s’appellent les lettres de la qalqala. Lesquelles sont-ce ?',
      en: 'In tajwid, the letters pronounced with a bounce when they carry a sukun are called the letters of qalqalah. Which are they?',
    },
    siklar: [
      { tr: 'Elif, vav, ye', fr: 'Alif, waw, ya', en: 'Alif, waw, ya' },
      { tr: 'Hemze, he, ayn, hı', fr: 'Hamza, ha, ayn, kha', en: 'Hamza, ha, ayn, kha' },
      { tr: 'Mim, nun, lam, ra', fr: 'Mim, noun, lam, ra', en: 'Mim, nun, lam, ra' },
      { tr: 'Be, cim, dal, tı, kaf', fr: 'Ba, jim, dal, ta, qaf', en: 'Ba, jim, dal, ta, qaf' },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Kalkale» maddesi — https://islamansiklopedisi.org.tr/kalkale (sükûn hâlindeki be, cim, dal, tı, kaf harflerinin mahreçlerinin sarsılarak okunması)',
  },
];
