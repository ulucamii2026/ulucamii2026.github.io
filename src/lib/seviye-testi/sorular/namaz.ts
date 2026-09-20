/** Seviye testi soru bankası — namaz (içerik yazımı sürüyor; docs/SEVIYE-TESTI.md kılavuzu). */
import type { BilgiMaddesi } from '../tipler.ts';

export const NAMAZ: BilgiMaddesi[] = [
  // ——— B1: ilk haftalarda öğrenilen temel bilgi ———
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 1,
    id: 'nm01',
    soru: {
      tr: "Namaz kılabilmek için namazdan önce hangisini yapmak gerekir?",
      fr: "Que faut-il faire avant d’accomplir la prière (salât) ?",
      en: "What needs to be done before performing the prayer (salah)?",
    },
    siklar: [
      { tr: "Sadaka vermek", fr: "Donner une aumône (sadaqa)", en: "Give charity (sadaqah)" },
      { tr: "Abdest almak", fr: "Faire les ablutions (woudou)", en: "Perform the ablution (wudu)" },
      { tr: "Oruç tutmak", fr: "Jeûner (sawm)", en: "Fast (sawm)" },
      { tr: "Kurban kesmek", fr: "Sacrifier un animal (qourbani)", en: "Offer a sacrifice (qurbani)" },
    ],
    dogru: 1,
    kaynak: "TDV İslâm Ansiklopedisi, «Abdest» — https://islamansiklopedisi.org.tr/abdest (abdest namazın şartıdır; Mâide 5/6)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 1,
    id: 'nm02',
    soru: {
      tr: "Beş vakit namazın adları aşağıdakilerden hangisinde doğru sırayla verilmiştir?",
      fr: "Dans quelle réponse les cinq prières quotidiennes sont-elles citées dans le bon ordre ?",
      en: "Which answer lists the five daily prayers in the correct order?",
    },
    siklar: [
      {
        tr: "Sabah, öğle, ikindi, akşam, yatsı",
        fr: "Fajr (aube), dhouhr (midi), asr (après-midi), maghrib (coucher), icha (nuit)",
        en: "Fajr (dawn), dhuhr (noon), asr (afternoon), maghrib (sunset), isha (night)",
      },
      {
        tr: "Sabah, ikindi, öğle, akşam, yatsı",
        fr: "Fajr (aube), asr (après-midi), dhouhr (midi), maghrib (coucher), icha (nuit)",
        en: "Fajr (dawn), asr (afternoon), dhuhr (noon), maghrib (sunset), isha (night)",
      },
      {
        tr: "Öğle, sabah, ikindi, yatsı, akşam",
        fr: "Dhouhr (midi), fajr (aube), asr (après-midi), icha (nuit), maghrib (coucher)",
        en: "Dhuhr (noon), fajr (dawn), asr (afternoon), isha (night), maghrib (sunset)",
      },
      {
        tr: "Sabah, öğle, akşam, ikindi, yatsı",
        fr: "Fajr (aube), dhouhr (midi), maghrib (coucher), asr (après-midi), icha (nuit)",
        en: "Fajr (dawn), dhuhr (noon), maghrib (sunset), asr (afternoon), isha (night)",
      },
    ],
    dogru: 0,
    kaynak: "TDV İslâm Ansiklopedisi, «Namaz» — https://islamansiklopedisi.org.tr/namaz (beş vakit namaz)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 1,
    id: 'nm03',
    soru: {
      tr: "Müslümanlar namaz kılarken hangi yöne dönerler?",
      fr: "Vers quoi vous tournez-vous pendant la prière (salât) ?",
      en: "What do Muslims turn towards during the prayer (salah)?",
    },
    siklar: [
      { tr: "Kudüs’teki Mescid-i Aksâ’ya", fr: "Vers la mosquée Al-Aqsa à Jérusalem", en: "Towards the Al-Aqsa Mosque in Jerusalem" },
      { tr: "Medine’deki Mescid-i Nebevî’ye", fr: "Vers la mosquée du Prophète à Médine", en: "Towards the Prophet’s Mosque in Medina" },
      { tr: "Mekke’deki Kâbe’ye", fr: "Vers la Kaaba à La Mecque", en: "Towards the Kaaba in Mecca" },
      { tr: "Güneşin doğduğu yöne", fr: "Vers l’endroit où le soleil se lève", en: "Towards the place where the sun rises" },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Kıble» — https://islamansiklopedisi.org.tr/kible (Bakara 2/144)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 1,
    id: 'nm04',
    soru: {
      tr: "Câminin minaresinden okunan ve namaz vaktinin girdiğini bildiren çağrının adı nedir?",
      fr: "Comment s’appelle l’annonce lancée du haut du minaret pour signaler que l’heure de la prière est arrivée ?",
      en: "What is the name of the call made from the minaret to announce that a prayer time has begun?",
    },
    siklar: [
      { tr: "Kamet", fr: "L’iqama", en: "The iqamah" },
      { tr: "Hutbe", fr: "La khoutba", en: "The khutbah" },
      { tr: "Tekbir", fr: "Le takbir", en: "The takbir" },
      { tr: "Ezan", fr: "L’adhan", en: "The adhan" },
    ],
    dogru: 3,
    kaynak: "TDV İslâm Ansiklopedisi, «Ezan» — https://islamansiklopedisi.org.tr/ezan",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 1,
    id: 'nm05',
    soru: {
      tr: "Cuma namazı hangi gün, hangi vakitte ve nasıl kılınır?",
      fr: "Quel jour, à quel moment et comment la prière du vendredi (djoumou’a) est-elle accomplie ?",
      en: "On which day, at what time and how is the Friday prayer (jumu’ah) performed?",
    },
    siklar: [
      {
        tr: "Cuma günü, öğle vaktinde ve cemaatle",
        fr: "Le vendredi, à l’heure de midi (dhouhr) et en communauté",
        en: "On Friday, at the noon (dhuhr) time and in congregation",
      },
      {
        tr: "Cuma günü, sabah vaktinde ve tek başına",
        fr: "Le vendredi, à l’heure de l’aube (fajr) et seul",
        en: "On Friday, at the dawn (fajr) time and alone",
      },
      {
        tr: "Perşembe günü, öğle vaktinde ve cemaatle",
        fr: "Le jeudi, à l’heure de midi (dhouhr) et en communauté",
        en: "On Thursday, at the noon (dhuhr) time and in congregation",
      },
      {
        tr: "Cuma günü, yatsı vaktinde ve tek başına",
        fr: "Le vendredi, à l’heure de la nuit (icha) et seul",
        en: "On Friday, at the night (isha) time and alone",
      },
    ],
    dogru: 0,
    kaynak: "TDV İslâm Ansiklopedisi, «Cuma» — https://islamansiklopedisi.org.tr/cuma (öğle vakti, cemaat şartı)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 1,
    id: 'nm06',
    soru: {
      tr: "Su bulunamadığında ya da kullanılamadığında abdest ve gusül yerine ne yapılır?",
      fr: "Lorsqu’il n’y a pas d’eau ou qu’on ne peut pas l’utiliser, que fait-on à la place des ablutions (woudou) et de la grande ablution (ghousl) ?",
      en: "When there is no water, or it cannot be used, what is done instead of ablution (wudu) and the full ablution (ghusl)?",
    },
    siklar: [
      {
        tr: "Su bulununcaya kadar namaz ertelenir",
        fr: "On reporte la prière jusqu’à trouver de l’eau",
        en: "The prayer is postponed until water is found",
      },
      {
        tr: "Temiz toprağa el sürülerek teyemmüm yapılır",
        fr: "On fait l’ablution sèche (tayammoum) avec de la terre propre",
        en: "Dry ablution (tayammum) is done with clean earth",
      },
      {
        tr: "Bir miktar sadaka verilerek namaz kılınır",
        fr: "On donne une aumône, puis on accomplit la prière",
        en: "Some charity is given and then the prayer is performed",
      },
      {
        tr: "Yalnız eller yıkanarak namaz kılınır",
        fr: "On se lave seulement les mains, puis on prie",
        en: "Only the hands are washed and then the prayer is performed",
      },
    ],
    dogru: 1,
    kaynak: "TDV İslâm Ansiklopedisi, «Teyemmüm» — https://islamansiklopedisi.org.tr/teyemmum (Mâide 5/6)",
  },

  // ——— B2: düzenli ibadet eden kişinin uygulama bilgisi ———
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 2,
    id: 'nm07',
    soru: {
      tr: "Beş vakit namazın farzları kaçar rekâttır?",
      fr: "Combien de rak’as comptent les parties obligatoires (fard) des cinq prières quotidiennes ?",
      en: "How many rak’ahs are the obligatory (fard) parts of the five daily prayers?",
    },
    siklar: [
      {
        tr: "Sabah 2, öğle 4, ikindi 3, akşam 4, yatsı 4",
        fr: "Fajr 2, dhouhr 4, asr 3, maghrib 4, icha 4",
        en: "Fajr 2, dhuhr 4, asr 3, maghrib 4, isha 4",
      },
      {
        tr: "Sabah 4, öğle 2, ikindi 4, akşam 3, yatsı 4",
        fr: "Fajr 4, dhouhr 2, asr 4, maghrib 3, icha 4",
        en: "Fajr 4, dhuhr 2, asr 4, maghrib 3, isha 4",
      },
      {
        tr: "Sabah 2, öğle 4, ikindi 4, akşam 3, yatsı 4",
        fr: "Fajr 2, dhouhr 4, asr 4, maghrib 3, icha 4",
        en: "Fajr 2, dhuhr 4, asr 4, maghrib 3, isha 4",
      },
      {
        tr: "Sabah 2, öğle 3, ikindi 4, akşam 4, yatsı 3",
        fr: "Fajr 2, dhouhr 3, asr 4, maghrib 4, icha 3",
        en: "Fajr 2, dhuhr 3, asr 4, maghrib 4, isha 3",
      },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Namaz» — https://islamansiklopedisi.org.tr/namaz (farz rekâtları: 2-4-4-3-4)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 2,
    id: 'nm08',
    soru: {
      tr: "Namazda elleri dizlerin üzerine koyarak öne eğilmeye ne ad verilir?",
      fr: "Comment appelle-t-on le fait de se pencher en avant en posant les mains sur les genoux pendant la prière ?",
      en: "What is the name for bending forward with the hands on the knees during prayer?",
    },
    siklar: [
      { tr: "Kıyam", fr: "Le qiyam", en: "Qiyam" },
      { tr: "Rükû", fr: "Le roukou’", en: "Ruku" },
      { tr: "Secde", fr: "Le soujoud", en: "Sujud" },
      { tr: "Ka’de", fr: "La qa’da", en: "Qa’dah" },
    ],
    dogru: 1,
    kaynak: "TDV İslâm Ansiklopedisi, «Rükû» — https://islamansiklopedisi.org.tr/ruku (namazın rükünlerinden)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 2,
    id: 'nm09',
    soru: {
      tr: "Namazın her rekâtında ayakta iken her zaman okunan sûre hangisidir?",
      fr: "Quelle sourate récite-t-on toujours debout, à chaque rak’a de la prière ?",
      en: "Which surah is always recited while standing, in every rak’ah of the prayer?",
    },
    siklar: [
      { tr: "Fâtiha sûresi", fr: "La sourate Al-Fatiha", en: "Surah Al-Fatiha" },
      { tr: "İhlâs sûresi", fr: "La sourate Al-Ikhlas", en: "Surah Al-Ikhlas" },
      { tr: "Kevser sûresi", fr: "La sourate Al-Kawthar", en: "Surah Al-Kawthar" },
      { tr: "Nas sûresi", fr: "La sourate An-Nas", en: "Surah An-Nas" },
    ],
    dogru: 0,
    kaynak: "TDV İslâm Ansiklopedisi, «Namaz» — https://islamansiklopedisi.org.tr/namaz (namazın vâcipleri: «Namazların bütün rek’atlarında Fâtiha sûresini okumak»; fakihlerin çoğunluğuna göre farz)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 2,
    id: 'nm10',
    soru: {
      tr: "Cünüplük hâlindeki bir kimse namaz kılabilmek için nasıl temizlenir?",
      fr: "Comment une personne en état d’impureté majeure (djanaba) se purifie-t-elle pour pouvoir prier ?",
      en: "How does a person in a state of major ritual impurity (janabah) purify themselves in order to pray?",
    },
    siklar: [
      { tr: "Yalnız yüzünü ve kollarını yıkar", fr: "Elle lave seulement le visage et les bras", en: "They wash only the face and the arms" },
      { tr: "Yalnız başını ve ayaklarını mesheder", fr: "Elle essuie seulement la tête et les pieds", en: "They wipe only the head and the feet" },
      { tr: "Yalnız ellerini ve ağzını yıkar", fr: "Elle lave seulement les mains et la bouche", en: "They wash only the hands and the mouth" },
      {
        tr: "Bütün vücudunu yıkayarak gusül abdesti alır",
        fr: "Elle lave tout le corps : c’est la grande ablution (ghousl)",
        en: "They wash the whole body: this is the full ablution (ghusl)",
      },
    ],
    dogru: 3,
    kaynak: "TDV İslâm Ansiklopedisi, «Gusül» — https://islamansiklopedisi.org.tr/gusul (cünüplük hâlinde gusül gerekir)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 2,
    id: 'nm11',
    soru: {
      tr: "Namaz kılarken aşağıdaki davranışlardan hangisi namazı bozar?",
      fr: "Pendant la prière, lequel de ces comportements annule la prière ?",
      en: "During the prayer, which of these actions invalidates the prayer?",
    },
    siklar: [
      {
        tr: "Rükûda tesbih duasını okumak",
        fr: "Réciter l’invocation de glorification pendant l’inclination (roukou’)",
        en: "Reciting the words of glorification during the bowing (ruku)",
      },
      {
        tr: "Kıyamda Fâtiha sûresini okumak",
        fr: "Réciter la sourate Al-Fatiha en station debout (qiyam)",
        en: "Reciting Surah Al-Fatiha while standing (qiyam)",
      },
      {
        tr: "Namaz içinde başkasıyla konuşmak",
        fr: "Parler avec quelqu’un pendant la prière",
        en: "Speaking with someone during the prayer",
      },
      {
        tr: "Secdeye giderken tekbir getirmek",
        fr: "Dire le takbir en allant à la prosternation (soujoud)",
        en: "Saying the takbir when going into prostration (sujud)",
      },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Namaz» — https://islamansiklopedisi.org.tr/namaz (müfsidâtü’s-salât: «Abdestin bozulması, namazda konuşmak, … bir şey yiyip içmek, gülmek»)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 2,
    id: 'nm12',
    soru: {
      tr: "Cemaatle namaz kılan bir kimse imama karşı nasıl davranır?",
      fr: "Lorsque vous priez en communauté (djama’a), comment vous comportez-vous vis-à-vis de l’imam ?",
      en: "When praying in congregation (jama’ah), how do you act with regard to the imam?",
    },
    siklar: [
      {
        tr: "İmamın önüne geçmeden durur ve hareketlerinde ona uyar",
        fr: "Vous vous placez sans dépasser l’imam et vous suivez ses mouvements",
        en: "You stand without going ahead of the imam and follow his movements",
      },
      {
        tr: "İmamın önünde durur ve ondan önce rükûya gider",
        fr: "Vous vous placez devant l’imam et vous vous inclinez avant lui",
        en: "You stand in front of the imam and bow before he does",
      },
      {
        tr: "İmamın yanında durur ve namazı kendi başına kılar",
        fr: "Vous vous placez à côté de l’imam et vous priez de votre côté",
        en: "You stand beside the imam and pray on your own",
      },
      {
        tr: "İmamdan önce selâm vererek namazdan çıkar",
        fr: "Vous terminez la prière par le salut avant l’imam",
        en: "You end the prayer with the salam before the imam",
      },
    ],
    dogru: 0,
    kaynak: "TDV İslâm Ansiklopedisi, «İktidâ» — https://islamansiklopedisi.org.tr/iktida (imama uyma; imamın cemaatin önünde durması şarttır, «önüne geçilmesi veya aynı hizada durulması mekruhtur»)",
  },

  // ——— B3: kurs görmüş kişinin bildiği ayrıntı ———
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 3,
    id: 'nm13',
    soru: {
      tr: "Namazda yanılarak yapılan eksiklik veya fazlalığı telâfi etmek için namazın sonunda yapılan iki secdenin adı nedir?",
      fr: "Comment appelle-t-on les deux prosternations faites à la fin de la prière pour réparer un oubli ou un ajout involontaire ?",
      en: "What is the name of the two prostrations made at the end of the prayer to make up for an unintentional omission or addition?",
    },
    siklar: [
      {
        tr: "Tilâvet secdesi",
        fr: "La prosternation de récitation (soujoud at-tilawa)",
        en: "The prostration of recitation (sujud al-tilawah)",
      },
      {
        tr: "Sehiv secdesi",
        fr: "La prosternation d’oubli (soujoud as-sahw)",
        en: "The prostration of forgetfulness (sujud al-sahw)",
      },
      {
        tr: "Şükür secdesi",
        fr: "La prosternation de gratitude (soujoud ach-choukr)",
        en: "The prostration of thankfulness (sujud al-shukr)",
      },
      {
        tr: "Tesbih namazı",
        fr: "La prière de glorification (salât at-tasbih)",
        en: "The prayer of glorification (salat al-tasbih)",
      },
    ],
    dogru: 1,
    kaynak: "TDV İslâm Ansiklopedisi, «Sehiv secdesi» — https://islamansiklopedisi.org.tr/sehiv-secdesi",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 3,
    id: 'nm14',
    soru: {
      tr: "Yolculuk (seferîlik) hâlinde dört rekâtlı farz namazlar için tanınan kolaylık (ruhsat) nedir?",
      fr: "En voyage (safar), quelle facilité (roukhsa) est prévue pour les prières obligatoires de quatre rak’as ?",
      en: "While travelling (safar), what concession (rukhsah) applies to the four-rak’ah obligatory prayers?",
    },
    siklar: [
      {
        tr: "Yolculuk boyunca bu namazlar tamamen düşer",
        fr: "Elles ne sont plus dues pendant tout le voyage",
        en: "They are dropped for the whole journey",
      },
      {
        tr: "Dönüşte kaza edilmek üzere ertelenir",
        fr: "Elles sont reportées et rattrapées au retour",
        en: "They are postponed and made up on return",
      },
      {
        tr: "Ayakta değil, oturarak kılınır",
        fr: "Elles s’accomplissent en position assise, non debout",
        en: "They are performed sitting, not standing",
      },
      {
        tr: "İki rekât olarak kısaltılıp kılınır",
        fr: "Elles se raccourcissent à deux rak’as",
        en: "They are shortened to two rak’ahs",
      },
    ],
    dogru: 3,
    kaynak: "TDV İslâm Ansiklopedisi, «Namaz» — https://islamansiklopedisi.org.tr/namaz («Yolculuk halinde bulunan kimse için dört rek’atlı namazların kısaltılması [kasr-ı salât] … ruhsat hükümleri söz konusudur»; Nisâ 4/101) ve «Sefer» — https://islamansiklopedisi.org.tr/sefer--fikih",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 3,
    id: 'nm15',
    soru: {
      tr: "Vakti içinde kılınamayan bir farz namazın sonradan kılınmasına ne ad verilir?",
      fr: "Comment appelle-t-on le fait d’accomplir plus tard une prière obligatoire qui n’a pas été faite dans son temps ?",
      en: "What is it called when an obligatory prayer missed in its time is performed later?",
    },
    siklar: [
      { tr: "Nâfile namaz", fr: "La prière surérogatoire (nafila)", en: "The voluntary prayer (nafilah)" },
      { tr: "Teheccüd namazı", fr: "La prière de nuit (tahajjoud)", en: "The night prayer (tahajjud)" },
      { tr: "Kaza namazı", fr: "La prière de rattrapage (qada)", en: "The make-up prayer (qada)" },
      { tr: "Tesbih namazı", fr: "La prière de glorification (salât at-tasbih)", en: "The prayer of glorification (salat al-tasbih)" },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Kazâ» — https://islamansiklopedisi.org.tr/kaza--ibadet (edâ / kazâ ayrımı)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 3,
    id: 'nm16',
    soru: {
      tr: "Cenaze namazı nasıl kılınır?",
      fr: "Comment la prière funéraire (salât al-djanaza) est-elle accomplie ?",
      en: "How is the funeral prayer (salat al-janazah) performed?",
    },
    siklar: [
      {
        tr: "İki rekât hâlinde, rükû ve secde yapılarak",
        fr: "En deux rak’as, avec inclination (roukou’) et prosternation (soujoud)",
        en: "In two rak’ahs, with bowing (ruku) and prostration (sujud)",
      },
      {
        tr: "Dört rekât hâlinde, oturarak",
        fr: "En quatre rak’as, en position assise",
        en: "In four rak’ahs, performed sitting down",
      },
      {
        tr: "Rükû yapılmadan, fakat secde yapılarak",
        fr: "Sans inclination (roukou’), mais avec prosternation (soujoud)",
        en: "Without bowing (ruku), but with prostration (sujud)",
      },
      {
        tr: "Rükû ve secde yapılmadan, ayakta tekbirlerle",
        fr: "Sans inclination ni prosternation, debout, avec des takbirs",
        en: "Without bowing or prostration, standing, with takbirs",
      },
    ],
    dogru: 3,
    kaynak: "Din İşleri Yüksek Kurulu, «Cenaze namazı nasıl kılınır?» — https://kurul.diyanet.gov.tr/tr/fetva/cenaze-namazi-nasil-kilinir/0193c42d-5ff0-7a8b-b744-96f510e9362a («Cenaze namazı rükû ve secdesi olmayan bir namazdır; rükünleri kıyam ve tekbirlerdir»)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 3,
    id: 'nm17',
    mezhepBagli: true,
    soru: {
      tr: "Hanefî mezhebine göre abdestin farzları kaç tanedir?",
      fr: "Selon l’école hanafite, combien d’actes obligatoires (fard) comptent les ablutions (woudou) ?",
      en: "According to the Hanafi school, how many obligatory acts (fard) does the ablution (wudu) have?",
    },
    siklar: [
      { tr: "İki", fr: "Deux", en: "Two" },
      { tr: "Üç", fr: "Trois", en: "Three" },
      { tr: "Dört", fr: "Quatre", en: "Four" },
      { tr: "Altı", fr: "Six", en: "Six" },
    ],
    dogru: 2,
    kaynak: "TDV İslâm Ansiklopedisi, «Abdest» — https://islamansiklopedisi.org.tr/abdest (Hanefîlere göre dört farz: yüz, kollar, başın meshi, ayaklar)",
  },
  {
    tur: 'bilgi',
    alan: 'namaz',
    basamak: 3,
    id: 'nm18',
    mezhepBagli: true,
    soru: {
      tr: "Hanefî mezhebine göre vitir namazının hükmü nedir?",
      fr: "Selon l’école hanafite, quel est le statut de la prière witr ?",
      en: "According to the Hanafi school, what is the ruling of the witr prayer?",
    },
    siklar: [
      { tr: "Farzdır", fr: "Elle est obligatoire (fard)", en: "It is obligatory (fard)" },
      { tr: "Vâciptir", fr: "Elle est nécessaire (wadjib)", en: "It is necessary (wajib)" },
      { tr: "Sünnettir", fr: "Elle est une sunna", en: "It is a sunnah" },
      { tr: "Nâfiledir", fr: "Elle est surérogatoire (nafila)", en: "It is voluntary (nafilah)" },
    ],
    dogru: 1,
    kaynak: "TDV İslâm Ansiklopedisi, «Vitir namazı» — https://islamansiklopedisi.org.tr/vitir-namazi (Ebû Hanîfe’ye göre vâcip, cumhura göre müekked sünnet)",
  },
];
