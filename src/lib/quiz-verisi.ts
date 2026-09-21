/**
 * Öğrenci Modu Haftalık Mini Bilgi Yarışması (Quiz) Verisi.
 * Türkçe, Fransızca, İngilizce, Flemenkçe ve Almanca çok dilli mektep soruları.
 */
import type { Dil } from '../i18n/ui';

export type SoruOgesi = {
  id: string;
  soru: Record<Dil, string>;
  secenekler: Record<Dil, string[]>;
  dogruCevapIndex: number;
  aciklama: Record<Dil, string>;
  kategori: Record<Dil, string>;
};

export const QUIZ_SORULARI: SoruOgesi[] = [
  {
    id: 'islam-sartlari',
    soru: {
      tr: 'İslâm’ın kaç temel şartı vardır?',
      fr: 'Combien y a-t-il de piliers fondamentaux dans l’Islam ?',
      en: 'How many fundamental pillars of Islam are there?',
      nl: 'Hoeveel basiszuilen heeft de islam?',
      de: 'Wie viele Grundpfeiler hat der Islam?',
    },
    secenekler: {
      tr: ['4', '5', '6'],
      fr: ['4', '5', '6'],
      en: ['4', '5', '6'],
      nl: ['4', '5', '6'],
      de: ['4', '5', '6'],
    },
    dogruCevapIndex: 1,
    aciklama: {
      tr: 'İslâm’ın 5 şartı vardır: Kelime-i Şehâdet, Namaz, Oruç, Zekât ve Hac.',
      fr: 'L’Islam compte 5 piliers : Chahada, Prière, Jeûne, Zakat et Pèlerinage (Hajj).',
      en: 'Islam has 5 pillars: Shahada, Prayer, Fasting, Zakat, and Hajj.',
      nl: 'De islam heeft 5 zuilen: de geloofsgetuigenis (shahada), het gebed, het vasten, de zakat en de hadj.',
      de: 'Der Islam hat 5 Säulen: das Glaubensbekenntnis (Schahada), das Gebet, das Fasten, die Zakat und die Hadsch.',
    },
    kategori: {
      tr: 'Temel Dini Bilgiler',
      fr: 'Connaissances Fondamentales',
      en: 'Basic Islamic Knowledge',
      nl: 'Basiskennis van de islam',
      de: 'Islamisches Grundwissen',
    },
  },
  {
    id: 'kuran-ilk-ayet',
    soru: {
      tr: 'Peygamber Efendimiz’e (s.a.s.) inen ilk âyetin emri nedir?',
      fr: 'Quel est le tout premier mot révélé au Prophète Muhammad (s.a.s.) ?',
      en: 'What was the first word revealed to Prophet Muhammad (pbuh)?',
      nl: 'Wat is het eerste woord dat aan de Profeet Mohammed (vrede zij met hem) werd geopenbaard?',
      de: 'Welches Wort wurde dem Propheten Muhammad (Friede sei mit ihm) als Erstes offenbart?',
    },
    secenekler: {
      tr: ['Oku (İkra)', 'Düşün', 'Yaz'],
      fr: ['Lis (Iqra)', 'Réfléchis', 'Écris'],
      en: ['Read (Iqra)', 'Ponder', 'Write'],
      nl: ['Lees (Iqra)', 'Denk na', 'Schrijf'],
      de: ['Lies (Iqra)', 'Denk nach', 'Schreib'],
    },
    dogruCevapIndex: 0,
    aciklama: {
      tr: 'Alak Sûresi’nin ilk âyetinde yüce Rabbimiz: "Yaratan Rabbinin adıyla oku!" buyurmuştur.',
      fr: 'Dans la sourate Al-Alaq, Allah ordonne : « Lis, au nom de ton Seigneur qui a créé ! »',
      en: 'In Surah Al-Alaq, Allah commands: "Read in the name of your Lord who created!"',
      nl: 'In het eerste vers van soera Al-Alaq zegt onze Heer: “Lees, in de naam van uw Heer die geschapen heeft!”',
      de: 'Im ersten Vers der Sure Al-Alaq spricht unser Herr: „Lies im Namen deines Herrn, der erschaffen hat!“',
    },
    kategori: {
      tr: 'Kur’ân-ı Kerîm',
      fr: 'Le Noble Coran',
      en: 'The Holy Quran',
      nl: 'De Edele Koran',
      de: 'Der edle Koran',
    },
  },
  {
    id: 'namaz-vakitleri',
    soru: {
      tr: 'Müslümanlar bir günde farz olarak kaç vakit namaz kılarlar?',
      fr: 'Combien de prières obligatoires les musulmans accomplissent-ils par jour ?',
      en: 'How many obligatory daily prayers do Muslims perform each day?',
      nl: 'Hoeveel verplichte gebeden verrichten moslims per dag?',
      de: 'Wie viele Pflichtgebete verrichten Muslime pro Tag?',
    },
    secenekler: {
      tr: ['3 Vakit', '5 Vakit', '7 Vakit'],
      fr: ['3 Prières', '5 Prières', '7 Prières'],
      en: ['3 Prayers', '5 Prayers', '7 Prayers'],
      nl: ['3 gebeden', '5 gebeden', '7 gebeden'],
      de: ['3 Gebete', '5 Gebete', '7 Gebete'],
    },
    dogruCevapIndex: 1,
    aciklama: {
      tr: 'Günde 5 vakit namaz vardır: Sabah, Öğle, İkindi, Akşam ve Yatsı namazları.',
      fr: 'Il y a 5 prières quotidiennes : Fajr, Dhuhr, Asr, Maghrib et Isha.',
      en: 'There are 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, and Isha.',
      nl: 'Er zijn 5 dagelijkse gebeden: fajr, dhuhr, asr, maghrib en isha.',
      de: 'Es gibt 5 tägliche Gebete: Fadschr, Dhuhr, Asr, Maghrib und Ischa.',
    },
    kategori: {
      tr: 'İbâdet',
      fr: 'Pratique & Prière',
      en: 'Worship & Prayer',
      nl: 'Gebed & aanbidding',
      de: 'Gottesdienst & Gebet',
    },
  },
  {
    id: 'besmele-anlami',
    soru: {
      tr: 'Güzel işlere başlarken söylediğimiz "Besmele" ne anlama gelir?',
      fr: 'Que signifie la formule « Bismillah » que nous récitons au début des bonnes actions ?',
      en: 'What does "Bismillah" mean when we start doing good deeds?',
      nl: 'Wat betekent “Bismillah”, dat we zeggen als we aan iets goeds beginnen?',
      de: 'Was bedeutet „Bismillah“, das wir sagen, wenn wir etwas Gutes beginnen?',
    },
    secenekler: {
      tr: ['Rahmân ve Rahîm olan Allah’ın adıyla', 'Allah’a şükürler olsun', 'Allah her şeyden büyüktür'],
      fr: ['Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux', 'Louange à Allah', 'Allah est le plus Grand'],
      en: ['In the name of Allah, the Most Gracious, the Most Merciful', 'Praise be to Allah', 'Allah is the Greatest'],
      nl: ['In de naam van Allah, de Barmhartige, de Genadevolle', 'Alle lof komt Allah toe', 'Allah is de Grootste'],
      de: ['Im Namen Allahs, des Allerbarmers, des Barmherzigen', 'Lob sei Allah', 'Allah ist der Größte'],
    },
    dogruCevapIndex: 0,
    aciklama: {
      tr: 'Her hayırlı işe Bismillâhirrahmânirrahîm diyerek Allah’ın adıyla başlarız.',
      fr: 'Nous commençons chaque bonne action par Bismillahir-Rahmanir-Rahim pour chercher la bénédiction divine.',
      en: 'We begin every blessed action with Bismillah to invoke Allah’s blessings.',
      nl: 'Elk goed werk beginnen we met Bismillahir-Rahmanir-Rahim, in de naam van Allah.',
      de: 'Jedes gute Werk beginnen wir mit Bismillahir-Rahmanir-Rahim, im Namen Allahs.',
    },
    kategori: {
      tr: 'Güzel Ahlâk & Âdâb',
      fr: 'Bonnes Manières & Éthique',
      en: 'Manners & Ethics',
      nl: 'Goede manieren & ethiek',
      de: 'Gutes Benehmen & Ethik',
    },
  },
  {
    id: 'iman-sartlari',
    soru: {
      tr: 'İmânın kaç şartı (esası) vardır?',
      fr: 'Combien y a-t-il d’articles de foi (piliers de la foi) en Islam ?',
      en: 'How many articles of faith (pillars of Iman) are there in Islam?',
      nl: 'Hoeveel geloofsartikelen (zuilen van het geloof) kent de islam?',
      de: 'Wie viele Glaubensartikel (Säulen des Glaubens) kennt der Islam?',
    },
    secenekler: {
      tr: ['5', '6', '7'],
      fr: ['5', '6', '7'],
      en: ['5', '6', '7'],
      nl: ['5', '6', '7'],
      de: ['5', '6', '7'],
    },
    dogruCevapIndex: 1,
    aciklama: {
      tr: 'İmânın 6 şartı vardır: Allah’a, meleklerine, kitaplarına, peygamberlerine, âhiret gününe ve kadere inanmak.',
      fr: 'La foi compte 6 piliers : croire en Allah, Ses anges, Ses livres, Ses prophètes, au Jour Dernier et au Destin.',
      en: 'Faith has 6 pillars: belief in Allah, His angels, His books, His prophets, the Last Day, and Divine Destiny.',
      nl: 'Het geloof heeft 6 zuilen: geloven in Allah, in Zijn engelen, in Zijn boeken, in Zijn profeten, in de Laatste Dag en in de voorbeschikking.',
      de: 'Der Glaube hat 6 Säulen: der Glaube an Allah, an Seine Engel, an Seine Bücher, an Seine Propheten, an den Jüngsten Tag und an die Vorherbestimmung.',
    },
    kategori: {
      tr: 'Temel Dini Bilgiler',
      fr: 'Connaissances Fondamentales',
      en: 'Basic Islamic Knowledge',
      nl: 'Basiskennis van de islam',
      de: 'Islamisches Grundwissen',
    },
  },
  {
    id: 'abdest-temizlik',
    soru: {
      tr: 'Namaz kılmadan önce bedenimizi ve kalbimizi arındırmak için aldığımız temizlik ibadeti nedir?',
      fr: 'Quelle est l’ablution rituelle obligatoire accomplie avant d’accomplir la prière ?',
      en: 'What is the ritual purification performed before praying?',
      nl: 'Welke rituele wassing doen we voordat we het gebed verrichten?',
      de: 'Welche rituelle Waschung führen wir vor dem Gebet durch?',
    },
    secenekler: {
      tr: ['Abdest', 'Oruç', 'Sadaka'],
      fr: ['Les petites ablutions (Woudou)', 'Le jeûne', 'L’aumône'],
      en: ['Ablution (Wudu)', 'Fasting', 'Charity'],
      nl: ['De kleine wassing (wudu)', 'Het vasten', 'De aalmoes'],
      de: ['Die kleine Waschung (Wudu)', 'Das Fasten', 'Die Almosengabe'],
    },
    dogruCevapIndex: 0,
    aciklama: {
      tr: 'Peygamberimiz (s.a.s.): "Temizlik imanın yarısıdır" buyurmuştur. Namazın anahtarı abdesttir.',
      fr: 'Le Prophète (s.a.s.) a enseigné que la pureté est la moitié de la foi. Les ablutions ouvrent la prière.',
      en: 'The Prophet (pbuh) said cleanliness is half of faith. Wudu is the key to prayer.',
      nl: 'De Profeet (vrede zij met hem) zei: “Reinheid is de helft van het geloof.” De wudu is de sleutel tot het gebed.',
      de: 'Der Prophet (Friede sei mit ihm) sagte: „Reinheit ist die Hälfte des Glaubens.“ Das Wudu ist der Schlüssel zum Gebet.',
    },
    kategori: {
      tr: 'İbâdet & Temizlik',
      fr: 'Pratique & Pureté',
      en: 'Worship & Cleanliness',
      nl: 'Gebed & reinheid',
      de: 'Gottesdienst & Reinheit',
    },
  },
  {
    id: 'peygamberimiz-dogum',
    soru: {
      tr: 'Sevgili Peygamberimiz Hz. Muhammed (s.a.s.) hangi mübarek şehirde dünyaya gelmiştir?',
      fr: 'Dans quelle ville bénie le Prophète Muhammad (s.a.s.) est-il né ?',
      en: 'In which blessed city was Prophet Muhammad (pbuh) born?',
      nl: 'In welke gezegende stad is de Profeet Mohammed (vrede zij met hem) geboren?',
      de: 'In welcher gesegneten Stadt wurde der Prophet Muhammad (Friede sei mit ihm) geboren?',
    },
    secenekler: {
      tr: ['Mekke-i Mükerreme', 'Medine-i Münevvere', 'Kudüs'],
      fr: ['La Mecque', 'Médine', 'Jérusalem (Al-Quds)'],
      en: ['Mecca', 'Medina', 'Jerusalem'],
      nl: ['Mekka', 'Medina', 'Jeruzalem (Al-Quds)'],
      de: ['Mekka', 'Medina', 'Jerusalem (Al-Quds)'],
    },
    dogruCevapIndex: 0,
    aciklama: {
      tr: 'Efendimiz Hz. Muhammed (s.a.s.) Mekke’de doğmuş, daha sonra Medine’ye hicret etmiştir.',
      fr: 'Notre noble Prophète (s.a.s.) est né à La Mecque, puis a émigré vers Médine.',
      en: 'Prophet Muhammad (pbuh) was born in Mecca and later migrated to Medina.',
      nl: 'Onze Profeet Mohammed (vrede zij met hem) werd in Mekka geboren en trok later naar Medina.',
      de: 'Unser Prophet Muhammad (Friede sei mit ihm) wurde in Mekka geboren und wanderte später nach Medina aus.',
    },
    kategori: {
      tr: 'Siyer-i Nebî',
      fr: 'Vie du Prophète (Sîrah)',
      en: 'Life of the Prophet',
      nl: 'Leven van de Profeet (Sira)',
      de: 'Leben des Propheten (Sira)',
    },
  },
  {
    id: 'selamlasma-adabi',
    soru: {
      tr: 'Müslümanların karşılaştıklarında birbirine verdiği en güzel esenlik ve barış duası nedir?',
      fr: 'Quelle est la salutation de paix par excellence échangée entre musulmans ?',
      en: 'What is the beautiful greeting of peace exchanged between Muslims?',
      nl: 'Wat is de mooiste vredesgroet die moslims elkaar geven?',
      de: 'Welchen Friedensgruß sprechen Muslime einander zu?',
    },
    secenekler: {
      tr: ['Esselâmü Aleyküm', 'Günaydın', 'Güle Güle'],
      fr: ['As-Salâmou ‘Alaykoum', 'Bonjour', 'Au revoir'],
      en: ['As-Salamu Alaykum', 'Good morning', 'Goodbye'],
      nl: ['As-salaamoe ‘alaykoem', 'Goedemorgen', 'Tot ziens'],
      de: ['As-salamu ‘alaikum', 'Guten Morgen', 'Auf Wiedersehen'],
    },
    dogruCevapIndex: 0,
    aciklama: {
      tr: 'Esselâmü aleyküm, "Allah’ın selâmı ve esenliği üzerinize olsun" demektir.',
      fr: 'As-Salamou ‘Alaykoum signifie : « Que la paix et la grâce d’Allah soient sur vous ».',
      en: 'As-Salamu Alaykum means: "May the peace and mercy of Allah be upon you".',
      nl: 'As-salaamoe ‘alaykoem betekent: “Vrede en genade van Allah zij met u.”',
      de: 'As-salamu ‘alaikum bedeutet: „Friede und Barmherzigkeit Allahs seien mit euch.“',
    },
    kategori: {
      tr: 'Güzel Ahlâk & Âdâb',
      fr: 'Bonnes Manières & Éthique',
      en: 'Manners & Ethics',
      nl: 'Goede manieren & ethiek',
      de: 'Gutes Benehmen & Ethik',
    },
  },
  {
    id: 'fatiha-suresi',
    soru: {
      tr: 'Her namaz rekatında okuduğumuz ve Kur’ân-ı Kerîm’in "Açılış Sûresi" olan sûre hangisidir?',
      fr: 'Quelle sourate récitons-nous à chaque unité de prière et ouvre le Noble Coran ?',
      en: 'Which surah is recited in every unit of prayer and opens the Holy Quran?',
      nl: 'Welke soera lezen we in elke gebedseenheid en opent de Koran?',
      de: 'Welche Sure lesen wir in jeder Gebetseinheit und eröffnet den Koran?',
    },
    secenekler: {
      tr: ['Fâtiha Sûresi', 'İhlâs Sûresi', 'Kevser Sûresi'],
      fr: ['Sourate Al-Fâtiha', 'Sourate Al-Ikhlas', 'Sourate Al-Kawthar'],
      en: ['Surah Al-Fatiha', 'Surah Al-Ikhlas', 'Surah Al-Kawthar'],
      nl: ['Soera Al-Fatiha', 'Soera Al-Ichlaas', 'Soera Al-Kawthar'],
      de: ['Sure Al-Fatiha', 'Sure Al-Ichlas', 'Sure Al-Kauthar'],
    },
    dogruCevapIndex: 0,
    aciklama: {
      tr: 'Fâtiha, "açan, başlatan" demektir; Kur’ân’ın ilk sûresi ve namazın kalbidir.',
      fr: 'Al-Fâtiha signifie « L’Ouverture » ; elle est la première sourate du Coran et le cœur de la prière.',
      en: 'Al-Fatiha means "The Opening"; it is the first chapter of the Quran and the heart of prayer.',
      nl: 'Al-Fatiha betekent “de opening”; het is de eerste soera van de Koran en het hart van het gebed.',
      de: 'Al-Fatiha bedeutet „die Eröffnung“; sie ist die erste Sure des Korans und das Herz des Gebets.',
    },
    kategori: {
      tr: 'Kur’ân-ı Kerîm',
      fr: 'Le Noble Coran',
      en: 'The Holy Quran',
      nl: 'De Edele Koran',
      de: 'Der edle Koran',
    },
  },
  {
    id: 'elifba-harf-sayisi',
    soru: {
      tr: 'Kur’ân-ı Kerîm’i okumayı öğrendiğimiz Elif-Bâ alfabesinde kaç temel harf vardır?',
      fr: 'Combien de lettres fondamentales compte l’alphabet de l’Elif-Ba pour lire le Coran ?',
      en: 'How many fundamental letters are in the Arabic alphabet (Elif-Ba) to read the Quran?',
      nl: 'Hoeveel basisletters telt het Arabische alfabet (Elif-Ba) waarmee we de Koran lezen?',
      de: 'Wie viele Grundbuchstaben hat das arabische Alphabet (Elif-Ba), mit dem wir den Koran lesen?',
    },
    secenekler: {
      tr: ['26 Harf', '28 Harf', '32 Harf'],
      fr: ['26 Lettres', '28 Lettres', '32 Lettres'],
      en: ['26 Letters', '28 Letters', '32 Letters'],
      nl: ['26 letters', '28 letters', '32 letters'],
      de: ['26 Buchstaben', '28 Buchstaben', '32 Buchstaben'],
    },
    dogruCevapIndex: 1,
    aciklama: {
      tr: 'Elif-Bâ tahtamızda Elif’ten Ye’ye kadar boğaz, dil ve dudak mahreçlerinden çıkarılan 28 temel harf bulunur.',
      fr: 'L’alphabet arabe comprend 28 lettres fondamentales, d’Alif jusqu’à Ya, avec leurs règles de prononciation.',
      en: 'The Arabic alphabet comprises 28 fundamental letters from Alif to Yaa, each with precise articulation points.',
      nl: 'Het Arabische alfabet telt 28 basisletters, van alif tot ya, elk met een eigen uitspraakplaats.',
      de: 'Das arabische Alphabet hat 28 Grundbuchstaben, von Alif bis Ya, jeder mit einem eigenen Artikulationspunkt.',
    },
    kategori: {
      tr: 'Elif-Bâ & Tecvîd',
      fr: 'Elif-Ba & Tajwid',
      en: 'Elif-Ba & Tajweed',
      nl: 'Elif-Ba & tadjwied',
      de: 'Elif-Ba & Tadschwid',
    },
  },
];
