/** Seviye testi soru bankası — ibadet (içerik yazımı sürüyor; docs/SEVIYE-TESTI.md kılavuzu). */
import type { BilgiMaddesi } from '../tipler.ts';

export const IBADET: BilgiMaddesi[] = [
  // ——— B1: ilk haftalarda öğrenilen temel bilgi ———
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 1,
    id: 'ib01',
    soru: {
      tr: "Müslümanların bir ay boyunca oruç tuttuğu ay hangisidir?",
      fr: "Pendant quel mois les musulmans jeûnent-ils (sawm) tout un mois ?",
      en: "During which month do Muslims fast (sawm) for a whole month?",
    },
    siklar: [
      { tr: "Ramazan ayı", fr: "Le mois de Ramadan", en: "The month of Ramadan" },
      { tr: "Muharrem ayı", fr: "Le mois de Mouharram", en: "The month of Muharram" },
      { tr: "Şevval ayı", fr: "Le mois de Chawwal", en: "The month of Shawwal" },
      { tr: "Zilhicce ayı", fr: "Le mois de Dhou l-hidjdja", en: "The month of Dhul-Hijjah" },
    ],
    dogru: 0,
    kaynak: "TDV İslâm Ansiklopedisi, «Oruç» — https://islamansiklopedisi.org.tr/oruc (Bakara 2/185)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 1,
    id: 'ib02',
    soru: {
      tr: "Oruç tutan bir kimse her gün hangi vakitler arasında yemekten ve içmekten uzak durur?",
      fr: "Chaque jour, entre quels moments la personne qui jeûne s’abstient-elle de manger et de boire ?",
      en: "Each day, between which times does a fasting person abstain from eating and drinking?",
    },
    siklar: [
      {
        tr: "Güneşin doğuşundan öğle vaktine kadar",
        fr: "Du lever du soleil jusqu’à midi",
        en: "From sunrise until noon",
      },
      {
        tr: "Güneşin batışından gece yarısına kadar",
        fr: "Du coucher du soleil jusqu’à minuit",
        en: "From sunset until midnight",
      },
      {
        tr: "İmsak vaktinden güneşin batışına kadar",
        fr: "De l’aube (imsak) jusqu’au coucher du soleil (iftar)",
        en: "From dawn (imsak) until sunset (iftar)",
      },
      {
        tr: "Öğle vaktinden güneşin doğuşuna kadar",
        fr: "De midi jusqu’au lever du soleil",
        en: "From noon until sunrise",
      },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Oruç» — https://islamansiklopedisi.org.tr/oruc (tan yerinin ağarmasından güneşin batışına kadar)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 1,
    id: 'ib03',
    soru: {
      tr: "Zekât ne demektir?",
      fr: "Que signifie la zakat ?",
      en: "What does zakat mean?",
    },
    siklar: [
      {
        tr: "Gönlünden koptuğu kadar gönüllü yardım yapmaktır",
        fr: "Donner librement ce que l’on veut, selon son cœur",
        en: "Giving freely whatever one wishes, from the heart",
      },
      {
        tr: "Kazancının tamamını hayır işlerine bağışlamaktır",
        fr: "Donner la totalité de ses revenus à des œuvres de bienfaisance",
        en: "Giving all of one’s income to charitable works",
      },
      {
        tr: "Ramazan ayında yoksullara iftar yemeği vermektir",
        fr: "Offrir le repas de rupture du jeûne aux pauvres pendant le Ramadan",
        en: "Offering the fast-breaking meal to the poor during Ramadan",
      },
      {
        tr: "Malının belli bir payını ihtiyaç sahiplerine vermektir",
        fr: "Donner une part déterminée de ses biens à ceux qui sont dans le besoin",
        en: "Giving a fixed share of one’s wealth to those in need",
      },
    ],
    dogru: 3,
    kaynak: "TDV İslâm Ansiklopedisi, «Zekât» — https://islamansiklopedisi.org.tr/zekat (İslâm’ın beş şartından biri)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 1,
    id: 'ib04',
    soru: {
      tr: "Hac ibadeti nerede ve ne sıklıkla yerine getirilir?",
      fr: "Où et à quelle fréquence le pèlerinage (hadj) est-il accompli ?",
      en: "Where and how often is the pilgrimage (hajj) performed?",
    },
    siklar: [
      {
        tr: "Medine’de, gücü yetenin her yıl bir defa",
        fr: "À Médine, une fois par an pour celui qui en a les moyens",
        en: "In Medina, once a year for the one who is able",
      },
      {
        tr: "Mekke’de, gücü yetenin ömründe bir defa",
        fr: "À La Mecque, une fois dans la vie pour celui qui en a les moyens",
        en: "In Mecca, once in a lifetime for the one who is able",
      },
      {
        tr: "Kudüs’te, gücü yetenin ömründe üç defa",
        fr: "À Jérusalem, trois fois dans la vie pour celui qui en a les moyens",
        en: "In Jerusalem, three times in a lifetime for the one who is able",
      },
      {
        tr: "Mekke’de, her Müslümanın her yıl bir defa",
        fr: "À La Mecque, une fois par an pour chaque musulman",
        en: "In Mecca, once a year for every Muslim",
      },
    ],
    dogru: 1,
    kaynak: "TDV İslâm Ansiklopedisi, «Hac» — https://islamansiklopedisi.org.tr/hac (gücü yetene ömürde bir defa farz)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 1,
    id: 'ib05',
    soru: {
      tr: "Aşağıdaki yiyecek ve içeceklerden hangisi Müslümanlara haram kılınmıştır?",
      fr: "Parmi ces aliments et boissons, lesquels sont interdits (haram) aux musulmans ?",
      en: "Which of these foods and drinks are forbidden (haram) for Muslims?",
    },
    siklar: [
      { tr: "Koyun eti ve inek sütü", fr: "La viande de mouton et le lait de vache", en: "Mutton and cow’s milk" },
      { tr: "Balık eti ve zeytinyağı", fr: "Le poisson et l’huile d’olive", en: "Fish and olive oil" },
      { tr: "Domuz eti ve alkollü içkiler", fr: "La viande de porc et les boissons alcoolisées", en: "Pork and alcoholic drinks" },
      { tr: "Tavuk eti ve arı balı", fr: "La viande de poulet et le miel", en: "Chicken and honey" },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Domuz» (Bakara 2/173, Mâide 5/3) — https://islamansiklopedisi.org.tr/domuz ve «İçki» (Mâide 5/90) — https://islamansiklopedisi.org.tr/icki",
  },

  // ——— B2: düzenli ibadet eden kişinin uygulama bilgisi ———
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 2,
    id: 'ib06',
    soru: {
      tr: "Hastalığı veya yolculuğu sebebiyle Ramazan orucunu tutamayan kimse ne yapar?",
      fr: "Que fait la personne qui ne peut pas jeûner le Ramadan à cause d’une maladie ou d’un voyage ?",
      en: "What does a person do who cannot fast in Ramadan because of illness or travel?",
    },
    siklar: [
      {
        tr: "Tutamadığı günleri daha sonra kaza eder",
        fr: "Elle rattrape plus tard les jours manqués (qada)",
        en: "They make up the missed days later (qada)",
      },
      {
        tr: "O yıl için oruç borcundan tamamen kurtulur",
        fr: "Elle n’a plus rien à rattraper pour cette année-là",
        en: "They have nothing left to make up for that year",
      },
      {
        tr: "Her gün için bir kurban kesmesi gerekir",
        fr: "Elle doit sacrifier un animal pour chaque jour manqué",
        en: "They must offer a sacrifice for each missed day",
      },
      {
        tr: "Ertesi Ramazan’da iki kat oruç tutar",
        fr: "Elle jeûne le double au Ramadan suivant",
        en: "They fast twice as much in the next Ramadan",
      },
    ],
    dogru: 0,
    kaynak: "Diyanet Kur’an portalı, Bakara 2/184 — https://kuran.diyanet.gov.tr/mushaf/kuran-meal-2/bakara-suresi-2/ayet-184/diyanet-isleri-baskanligi-meali-1 («Sizden kim hasta, ya da yolculukta olursa, tutamadığı günler sayısınca başka günlerde tutar»); TDV İslâm Ansiklopedisi, «Oruç» — https://islamansiklopedisi.org.tr/oruc",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 2,
    id: 'ib07',
    soru: {
      tr: "Fitre (sadaka-i fıtır) ne zaman verilir?",
      fr: "Quand donne-t-on la zakat al-fitr (fitra) ?",
      en: "When is zakat al-fitr (fitrah) given?",
    },
    siklar: [
      {
        tr: "Kurban Bayramı namazından önce verilir",
        fr: "Avant la prière de la fête du Sacrifice (Aïd al-Adha)",
        en: "Before the prayer of the Feast of Sacrifice (Eid al-Adha)",
      },
      {
        tr: "Ramazan ayında, bayram namazından önce verilir",
        fr: "Pendant le Ramadan, avant la prière de l’Aïd al-Fitr",
        en: "During Ramadan, before the Eid al-Fitr prayer",
      },
      {
        tr: "Hac mevsiminde, Arefe gününden önce verilir",
        fr: "Pendant la saison du pèlerinage, avant le jour d’Arafat",
        en: "During the pilgrimage season, before the day of Arafat",
      },
      {
        tr: "Muharrem ayının onuncu gününde verilir",
        fr: "Le dixième jour du mois de Mouharram",
        en: "On the tenth day of the month of Muharram",
      },
    ],
    dogru: 1,
    kaynak: "Din İşleri Yüksek Kurulu, «Fıtır sadakası nedir ve ne zaman verilir?» — https://kurul.diyanet.gov.tr/tr/fetva/fitir-sadakasi-nedir-ve-ne-zaman-verilir/0193c42d-6adb-726e-611e-ce66b36552d8 («bayram namazından önce verilmesi müstehap kabul edilmiştir»; Ramazan içinde de verilebilir)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 2,
    id: 'ib08',
    soru: {
      tr: "İslâm’da kaç dinî bayram vardır ve adları nedir?",
      fr: "Combien de fêtes religieuses y a-t-il en islam et quels sont leurs noms ?",
      en: "How many religious festivals are there in Islam and what are their names?",
    },
    siklar: [
      {
        tr: "Üç bayram: Ramazan, Kurban ve Mevlid",
        fr: "Trois fêtes : l’Aïd al-Fitr, l’Aïd al-Adha et le Mawlid",
        en: "Three: Eid al-Fitr, Eid al-Adha and the Mawlid",
      },
      {
        tr: "İki bayram: Kurban Bayramı ve Aşure",
        fr: "Deux fêtes : l’Aïd al-Adha et l’Achoura",
        en: "Two: Eid al-Adha and Ashura",
      },
      {
        tr: "Tek bayram: yalnız Ramazan Bayramı",
        fr: "Une seule fête : l’Aïd al-Fitr",
        en: "Only one: Eid al-Fitr",
      },
      {
        tr: "İki bayram: Ramazan Bayramı ve Kurban Bayramı",
        fr: "Deux fêtes : l’Aïd al-Fitr et l’Aïd al-Adha",
        en: "Two: Eid al-Fitr and Eid al-Adha",
      },
    ],
    dogru: 3,
    kaynak: "TDV İslâm Ansiklopedisi, «Bayram» — https://islamansiklopedisi.org.tr/bayram (İslâm dininde ramazan ve kurban olmak üzere iki bayram vardır)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 2,
    id: 'ib09',
    soru: {
      tr: "Tevbe sûresinin 60. âyetine göre zekât kimlere verilir?",
      fr: "Selon le verset 60 de la sourate At-Tawba, à qui la zakat est-elle destinée ?",
      en: "According to verse 60 of Surah At-Tawbah, to whom is zakat given?",
    },
    siklar: [
      {
        tr: "Fakirlere, düşkünlere ve borçlulara",
        fr: "Aux pauvres, aux nécessiteux et aux endettés",
        en: "To the poor, the needy and those in debt",
      },
      {
        tr: "Yakın akrabalara ve iş arkadaşlarına",
        fr: "Aux proches parents et aux collègues de travail",
        en: "To close relatives and work colleagues",
      },
      {
        tr: "Câmi ve okul yaptıran kuruluşlara",
        fr: "Aux associations qui construisent mosquées et écoles",
        en: "To organisations that build mosques and schools",
      },
      {
        tr: "Hacca gitmek isteyen tanıdıklara",
        fr: "Aux connaissances qui veulent partir en pèlerinage",
        en: "To acquaintances who wish to go on pilgrimage",
      },
    ],
    dogru: 0,
    kaynak: "Diyanet Kur’an portalı, Tevbe 9/60 — https://kuran.diyanet.gov.tr/mushaf/kuran-meal-2/tevbe-suresi-9/ayet-60/diyanet-isleri-baskanligi-meali-1 («fakirler, düşkünler, … borçlular …» sekiz sınıf); kurum/cami yapımı bu sınıflara girmez: Din İşleri Yüksek Kurulu — https://kurul.diyanet.gov.tr/tr/fetva/zekat-ayetinde-gecen-fi-sebilillahin-kapsamina-okullar-kuran-kurslari-camiler-ve-benzeri-hayir-kurumlari-girer-mi/0195dc3e-cbbd-7cde-8df2-73f61859cce4",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 2,
    id: 'ib10',
    soru: {
      tr: "Kurban ibadeti hangi günlerde yerine getirilir?",
      fr: "Pendant quels jours le sacrifice (qourbani) est-il accompli ?",
      en: "On which days is the sacrifice (qurbani) offered?",
    },
    siklar: [
      { tr: "Ramazan Bayramı günlerinde", fr: "Pendant les jours de l’Aïd al-Fitr", en: "During the days of Eid al-Fitr" },
      { tr: "Ramazan ayının son gününde", fr: "Le dernier jour du mois de Ramadan", en: "On the last day of the month of Ramadan" },
      { tr: "Kurban Bayramı günlerinde", fr: "Pendant les jours de l’Aïd al-Adha", en: "During the days of Eid al-Adha" },
      { tr: "Muharrem ayının onuncu gününde", fr: "Le dixième jour du mois de Mouharram", en: "On the tenth day of the month of Muharram" },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Kurban» — https://islamansiklopedisi.org.tr/kurban (eyyâm-ı nahr: zilhicce 10-12)",
  },

  // ——— B3: kurs görmüş kişinin bildiği ayrıntı ———
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 3,
    id: 'ib11',
    soru: {
      tr: "Hac ibadetinin geçerli olması için aşağıdakilerden hangisi mutlaka yapılmalıdır?",
      fr: "Pour que le pèlerinage (hadj) soit valable, lequel de ces actes doit impérativement être accompli ?",
      en: "For the pilgrimage (hajj) to be valid, which of these must certainly be done?",
    },
    siklar: [
      {
        tr: "Mina’da şeytan taşlamak ve kurban kesmek",
        fr: "Lapider les stèles à Mina et sacrifier un animal",
        en: "Stoning the pillars at Mina and offering a sacrifice",
      },
      {
        tr: "Medine’yi ziyaret etmek ve Uhud’a çıkmak",
        fr: "Visiter Médine et monter sur le mont Ouhoud",
        en: "Visiting Medina and climbing Mount Uhud",
      },
      {
        tr: "Zemzem içmek ve Hicr’de namaz kılmak",
        fr: "Boire l’eau de Zamzam et prier dans le Hidjr",
        en: "Drinking Zamzam water and praying in the Hijr",
      },
      {
        tr: "Arafat’ta vakfe yapmak ve Kâbe’yi tavaf etmek",
        fr: "La station à Arafat (woqouf) et le tawaf de la Kaaba",
        en: "The standing at Arafat (wuquf) and the tawaf of the Kaaba",
      },
    ],
    dogru: 3,
    kaynak: "TDV İslâm Ansiklopedisi, «Hac» — https://islamansiklopedisi.org.tr/hac (haccın rükünleri: Arafat vakfesi ve ziyaret tavafı; ihram şarttır)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 3,
    id: 'ib12',
    soru: {
      tr: "Umrenin hacdan farkı nedir?",
      fr: "Quelle est la différence entre l’omra et le hadj ?",
      en: "What is the difference between umrah and hajj?",
    },
    siklar: [
      {
        tr: "Yalnız hac aylarında yapılır ve ihram gerekmez",
        fr: "Elle ne se fait que pendant les mois du pèlerinage et sans ihram",
        en: "It is done only during the pilgrimage months and without ihram",
      },
      {
        tr: "Belirli günlere bağlı değildir ve Arafat vakfesi yoktur",
        fr: "Elle n’est pas liée à des jours précis et n’a pas de station à Arafat",
        en: "It is not tied to fixed days and has no standing at Arafat",
      },
      {
        tr: "Yalnız Ramazan ayında yapılır ve tavafı yoktur",
        fr: "Elle ne se fait qu’au Ramadan et ne comporte pas de tawaf",
        en: "It is done only in Ramadan and has no tawaf",
      },
      {
        tr: "Yalnız Medine’de yapılır ve sa’yi yoktur",
        fr: "Elle ne se fait qu’à Médine et ne comporte pas de sa’y",
        en: "It is done only in Medina and has no sa’y",
      },
    ],
    dogru: 1,
    kaynak: "TDV İslâm Ansiklopedisi, «Umre» — https://islamansiklopedisi.org.tr/umre (hac belirli ay ve günlerde edâ edilir, umrede Arafat ve Müzdelife vakfeleri yoktur; Hanefîlerde yalnız arefe ve kurban bayramı günlerinde mekruhtur)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 3,
    id: 'ib13',
    soru: {
      tr: "Kur’an-ı Kerim’de faiz (ribâ) yoluyla elde edilen kazanç hakkında ne bildirilmiştir?",
      fr: "Que dit le Coran au sujet du gain obtenu par l’intérêt (riba) ?",
      en: "What does the Qur’an say about income obtained through interest (riba)?",
    },
    siklar: [
      {
        tr: "Ticaretin bir çeşidi sayılıp helâl kılınmıştır",
        fr: "Il est considéré comme une forme de commerce et rendu licite",
        en: "It is counted as a form of trade and made lawful",
      },
      {
        tr: "Yalnız büyük miktarlarda sakıncalı görülmüştür",
        fr: "Il n’est jugé problématique que pour les grosses sommes",
        en: "It is considered problematic only for large sums",
      },
      {
        tr: "Haram kılınmış, alışveriş ise helâl kılınmıştır",
        fr: "Il est interdit, alors que le commerce est licite",
        en: "It is forbidden, while trade is lawful",
      },
      {
        tr: "Herkesin kendi kararına bırakılmıştır",
        fr: "Il est laissé à la décision de chacun",
        en: "It is left to each person’s own decision",
      },
    ],
    dogru: 2,
    kaynak: "Diyanet Kur’an portalı, Bakara 2/275 — https://kuran.diyanet.gov.tr/mushaf/kuran-meal-2/bakara-suresi-2/ayet-275/diyanet-isleri-baskanligi-meali-1 (Allah alışverişi helal, faizi haram kılmıştır)",
  },
  {
    tur: 'bilgi',
    alan: 'ibadet',
    basamak: 3,
    id: 'ib14',
    soru: {
      tr: "Bir kimse başkasının hakkını yediyse (kul hakkı) ne yapması gerekir?",
      fr: "Si une personne a lésé le droit d’autrui, que doit-elle faire ?",
      en: "If someone has wronged another person’s right, what must they do?",
    },
    siklar: [
      {
        tr: "Hakkını geri verip hak sahibiyle helâlleşmesi gerekir",
        fr: "Elle doit restituer le droit et obtenir le pardon de la personne lésée",
        en: "They must return the right and obtain the wronged person’s pardon",
      },
      {
        tr: "Yalnız içinden pişmanlık duyması yeterli olur",
        fr: "Il lui suffit d’éprouver du regret intérieurement",
        en: "It is enough for them to feel regret inwardly",
      },
      {
        tr: "Bir gün oruç tutup dua etmesi yeterli olur",
        fr: "Il lui suffit de jeûner un jour et d’invoquer Dieu",
        en: "It is enough for them to fast one day and pray",
      },
      {
        tr: "Bir miktar sadaka verip unutması yeterli olur",
        fr: "Il lui suffit de donner une aumône et d’oublier",
        en: "It is enough for them to give some charity and forget",
      },
    ],
    dogru: 0,
    kaynak: "TDV İslâm Ansiklopedisi, «Kul hakkı» — https://islamansiklopedisi.org.tr/kul-hakki (hak sahibine ödeme ya da helâlleşme gerekir)",
  },
];
