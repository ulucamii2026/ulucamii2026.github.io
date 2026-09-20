/** Seviye testi soru bankası — siyer (docs/SEVIYE-TESTI.md §5 soru yazım kılavuzu).
 *
 *  12 madde: B1 4 · B2 4 · B3 4. Yalnız üzerinde ittifak edilen bilgiler soruldu; tartışmalı
 *  tarih ve sayılar dışarıda bırakıldı. Kaynaklar madde başına `kaynak` alanındadır (TDV İslâm
 *  Ansiklopedisi ve Diyanet Kur’an portalı). B3’te hıristiyan geçmişli katılımcılar için önceki
 *  peygamberlerle ilgili iki madde vardır; üslup başka inançları küçültmeyecek biçimde kurulmuştur.
 */
import type { BilgiMaddesi } from '../tipler.ts';

export const SIYER: BilgiMaddesi[] = [
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 1,
    id: 'sy01',
    soru: {
      tr: 'Hz. Muhammed (s.a.s.) hangi şehirde dünyaya gelmiştir?',
      fr: 'Dans quelle ville le Prophète Muhammad (paix et salut sur lui) est-il né ?',
      en: 'In which city was Prophet Muhammad (peace be upon him) born?',
    },
    siklar: [
      { tr: 'Medine’de', fr: 'À Médine', en: 'In Medina' },
      { tr: 'Mekke’de', fr: 'À La Mecque', en: 'In Mecca' },
      { tr: 'Kudüs’te', fr: 'À Jérusalem', en: 'In Jerusalem' },
      { tr: 'Tâif’te', fr: 'À Tâ’if', en: 'In Ta’if' },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Muhammed» — islamansiklopedisi.org.tr/muhammed',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 1,
    id: 'sy02',
    soru: {
      tr: 'Hz. Muhammed’e (s.a.s.) ilk vahiy nerede gelmiştir?',
      fr: 'Où le Prophète Muhammad (paix et salut sur lui) a-t-il reçu la première révélation (wahy) ?',
      en: 'Where did Prophet Muhammad (peace be upon him) receive the first revelation (wahy)?',
    },
    siklar: [
      {
        tr: 'Mekke yakınındaki Hira mağarasında',
        fr: 'Dans la grotte de Hirâ, près de La Mecque',
        en: 'In the cave of Hirâ, near Mecca',
      },
      {
        tr: 'Medine’deki Mescid-i Nebevî’de',
        fr: 'Dans la mosquée du Prophète, à Médine',
        en: 'In the Prophet’s Mosque, in Medina',
      },
      {
        tr: 'Kudüs’teki Mescid-i Aksâ’da',
        fr: 'Dans la mosquée al-Aqsâ, à Jérusalem',
        en: 'In the al-Aqsâ Mosque, in Jerusalem',
      },
      {
        tr: 'Mekke’deki Kâbe’nin içinde',
        fr: 'À l’intérieur de la Kaaba, à La Mecque',
        en: 'Inside the Kaaba, in Mecca',
      },
    ],
    dogru: 0,
    kaynak: 'TDV İslâm Ansiklopedisi, «Hira» — islamansiklopedisi.org.tr/hira',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 1,
    id: 'sy03',
    soru: {
      tr: 'Hicret, Hz. Peygamber’in ve müslümanların hangi şehirden hangi şehre göç etmesidir?',
      fr: 'L’hégire (hidjra) est l’émigration du Prophète et des musulmans de quelle ville vers quelle ville ?',
      en: 'The Hijra is the migration of the Prophet and the Muslims from which city to which city?',
    },
    siklar: [
      { tr: 'Medine’den Mekke’ye', fr: 'De Médine vers La Mecque', en: 'From Medina to Mecca' },
      { tr: 'Mekke’den Kudüs’e', fr: 'De La Mecque vers Jérusalem', en: 'From Mecca to Jerusalem' },
      { tr: 'Mekke’den Medine’ye', fr: 'De La Mecque vers Médine', en: 'From Mecca to Medina' },
      { tr: 'Tâif’ten Mekke’ye', fr: 'De Tâ’if vers La Mecque', en: 'From Ta’if to Mecca' },
    ],
    dogru: 2,
    kaynak: 'TDV İslâm Ansiklopedisi, «Hicret» — islamansiklopedisi.org.tr/hicret',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 1,
    id: 'sy04',
    soru: {
      tr: 'Mekkeliler, peygamberlikten önce Hz. Muhammed’e (s.a.s.) niçin «el-Emîn (güvenilir)» derlerdi?',
      fr: 'Pourquoi les Mecquois appelaient-ils le Prophète Muhammad (paix et salut sur lui) « al-Amîn » (le digne de confiance) avant sa mission prophétique ?',
      en: 'Why did the people of Mecca call Prophet Muhammad (peace be upon him) “al-Amîn” (the trustworthy) before his prophethood?',
    },
    siklar: [
      {
        tr: 'Kureyş kabilesinin en zengin tüccarı olduğu için',
        fr: 'Parce qu’il était le marchand le plus riche de la tribu de Quraych',
        en: 'Because he was the wealthiest merchant of the Quraysh tribe',
      },
      {
        tr: 'Kâbe’nin bakımıyla görevlendirilmiş olduğu için',
        fr: 'Parce qu’il avait été chargé de l’entretien de la Kaaba',
        en: 'Because he had been put in charge of looking after the Kaaba',
      },
      {
        tr: 'Okuma yazma bilen sayılı kişilerden biri olduğu için',
        fr: 'Parce qu’il était l’un des rares à savoir lire et écrire',
        en: 'Because he was one of the few people who could read and write',
      },
      {
        tr: 'Sözünde ve ticaretinde son derece güvenilir olduğu için',
        fr: 'Parce qu’il était d’une fiabilité exemplaire dans sa parole et son commerce',
        en: 'Because he was utterly reliable in his word and in his trade',
      },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Muhammed» — islamansiklopedisi.org.tr/muhammed',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 2,
    id: 'sy05',
    soru: {
      tr: 'Hicret hangi milâdî yılda gerçekleşmiş ve hicrî takvimin başlangıcı olmuştur?',
      fr: 'En quelle année de l’ère chrétienne l’hégire a-t-elle eu lieu, marquant le début du calendrier hégirien ?',
      en: 'In which year CE did the Hijra take place, marking the beginning of the Hijri calendar?',
    },
    siklar: [
      { tr: '610 yılında', fr: 'En 610', en: 'In 610' },
      { tr: '622 yılında', fr: 'En 622', en: 'In 622' },
      { tr: '630 yılında', fr: 'En 630', en: 'In 630' },
      { tr: '632 yılında', fr: 'En 632', en: 'In 632' },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Hicret» — islamansiklopedisi.org.tr/hicret',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 2,
    id: 'sy06',
    soru: {
      tr: 'Hz. Peygamber’in ilk hanımı ve kendisine ilk iman eden kişi kimdir?',
      fr: 'Qui fut la première épouse du Prophète et la première personne à croire en lui ?',
      en: 'Who was the Prophet’s first wife and the first person to believe in him?',
    },
    siklar: [
      { tr: 'Hz. Âişe', fr: 'Aïcha', en: 'Aishah' },
      { tr: 'Hz. Hafsa', fr: 'Hafsa', en: 'Hafsah' },
      { tr: 'Hz. Hatice', fr: 'Khadîdja', en: 'Khadijah' },
      { tr: 'Hz. Ümmü Seleme', fr: 'Oumm Salama', en: 'Umm Salamah' },
    ],
    dogru: 2,
    kaynak: 'TDV İslâm Ansiklopedisi, «Hatice» — islamansiklopedisi.org.tr/hatice',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 2,
    id: 'sy07',
    soru: {
      tr: 'İslâm’ın ilk müezzini olan sahâbî kimdir?',
      fr: 'Quel Compagnon fut le premier muezzin de l’islam ?',
      en: 'Which Companion was the first muezzin of Islam?',
    },
    siklar: [
      { tr: 'Selmân-ı Fârisî', fr: 'Salmân al-Fârisî', en: 'Salman al-Farisi' },
      { tr: 'Zeyd b. Hârise', fr: 'Zayd ibn Hâritha', en: 'Zayd ibn Harithah' },
      { tr: 'Abdullah b. Mes‘ûd', fr: 'Abdallah ibn Mas‘oûd', en: 'Abdullah ibn Mas‘ud' },
      { tr: 'Bilâl-i Habeşî', fr: 'Bilâl al-Habachî', en: 'Bilal al-Habashi' },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Bilâl-i Habeşî» — islamansiklopedisi.org.tr/bilal-i-habesi',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 2,
    id: 'sy08',
    soru: {
      tr: 'Hz. Peygamber, hicretten sonra Mekke’den gelen muhacirlerle Medineli ensar arasında neyi kurmuştur?',
      fr: 'Après l’hégire, qu’a institué le Prophète entre les émigrés venus de La Mecque (mouhâdjiroûn) et leurs hôtes médinois (ansâr) ?',
      en: 'After the Hijra, what did the Prophet establish between the emigrants from Mecca (muhajirun) and their Medinan hosts (ansar)?',
    },
    siklar: [
      {
        tr: 'Onları karşılıklı olarak kardeş ilân eden kardeşlik bağını (muâhât)',
        fr: 'Un pacte de fraternité (mou’âkhât) les déclarant frères les uns des autres',
        en: 'A bond of brotherhood (mu’akhat) declaring them brothers of one another',
      },
      {
        tr: 'Muhacirler için ayrı bir mahalle ve ayrı bir pazar düzenini',
        fr: 'Un quartier séparé et un marché propre aux émigrés',
        en: 'A separate quarter and a separate market for the emigrants',
      },
      {
        tr: 'Ensarın mallarının yarısını hazineye bağışlaması kuralını',
        fr: 'La règle imposant aux Médinois de céder la moitié de leurs biens',
        en: 'A rule requiring the Medinans to give up half of their property',
      },
      {
        tr: 'Mekke’ye geri dönecekler için ayrı bir kafile düzenini',
        fr: 'Une organisation de caravanes pour ceux qui rentreraient à La Mecque',
        en: 'A caravan system for those who would return to Mecca',
      },
    ],
    dogru: 0,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Muâhât»: «Hz. Peygamber’in Medine’de ensar ve muhacirlerden bazılarını birbirleriyle kardeş ilân etmesi» — islamansiklopedisi.org.tr/muahat',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 3,
    id: 'sy09',
    soru: {
      tr: 'Hudeybiye Antlaşması’nın niteliği nedir?',
      fr: 'Quelle était la nature du traité de Houdaybiya ?',
      en: 'What was the nature of the Treaty of Hudaybiyah?',
    },
    siklar: [
      {
        tr: 'Bizans imparatoruyla yapılan bir ticaret ve geçiş antlaşmasıdır',
        fr: 'Un accord de commerce et de passage conclu avec l’empereur byzantin',
        en: 'A trade and transit agreement made with the Byzantine emperor',
      },
      {
        tr: 'Mekkeli müşriklerle yapılan, on yıl sürmesi kararlaştırılan barış antlaşmasıdır',
        fr: 'Un traité de paix de dix ans conclu avec les polythéistes de La Mecque',
        en: 'A ten-year peace treaty concluded with the polytheists of Mecca',
      },
      {
        tr: 'Medineli kabilelerle yapılan bir ortak savunma sözleşmesidir',
        fr: 'Un pacte de défense commune conclu avec les tribus de Médine',
        en: 'A joint defence pact concluded with the tribes of Medina',
      },
      {
        tr: 'Tâif halkıyla yapılan, hac yollarını güvenceye alan bir sözleşmedir',
        fr: 'Un accord avec les habitants de Tâ’if garantissant les routes du pèlerinage',
        en: 'An agreement with the people of Ta’if securing the pilgrimage routes',
      },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Hudeybiye Antlaşması» — islamansiklopedisi.org.tr/hudeybiye-antlasmasi',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 3,
    id: 'sy10',
    soru: {
      tr: 'Vedâ Hutbesi’nde Hz. Peygamber’in bildirdiği temel ilkelerden biri nedir?',
      fr: 'Quel est l’un des principes fondamentaux énoncés par le Prophète dans le Sermon d’adieu ?',
      en: 'What is one of the core principles the Prophet declared in the Farewell Sermon?',
    },
    siklar: [
      {
        tr: 'Müslümanların yılda bir kez Mekke’ye gitmekle yükümlü olduğu',
        fr: 'Que les musulmans doivent se rendre à La Mecque une fois par an',
        en: 'That Muslims must travel to Mecca once every year',
      },
      {
        tr: 'Yalnız Arapça bilenlerin Kur’an-ı Kerim’i okuyabileceği',
        fr: 'Que seuls ceux qui connaissent l’arabe peuvent lire le Coran',
        en: 'That only those who know Arabic may read the Qur’an',
      },
      {
        tr: 'İnsanların can ve mallarının dokunulmaz olduğu, üstünlüğün ancak takvâ ile olduğu',
        fr: 'Que la vie et les biens sont inviolables et que la supériorité ne tient qu’à la piété (taqwâ)',
        en: 'That people’s lives and property are inviolable and that superiority lies only in piety (taqwa)',
      },
      {
        tr: 'Ticaretin yalnız Medine pazarında yapılabileceği',
        fr: 'Que le commerce ne peut se faire qu’au marché de Médine',
        en: 'That trade may be carried on only in the market of Medina',
      },
    ],
    dogru: 2,
    kaynak: 'TDV İslâm Ansiklopedisi, «Vedâ hutbesi» — islamansiklopedisi.org.tr/veda-hutbesi',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 3,
    id: 'sy11',
    soru: {
      tr: 'Kur’an-ı Kerim’e göre Kâbe’nin temellerini kim, kiminle birlikte yükseltmiştir?',
      fr: 'Selon le Coran, qui a élevé les fondations de la Kaaba, et avec qui ?',
      en: 'According to the Qur’an, who raised the foundations of the Kaaba, and with whom?',
    },
    siklar: [
      {
        tr: 'Hz. Âdem, oğlu Hz. Şît ile birlikte',
        fr: 'Adam, avec son fils Seth (Chîth)',
        en: 'Adam, together with his son Seth (Shîth)',
      },
      {
        tr: 'Hz. Nûh, oğullarıyla birlikte',
        fr: 'Noé (Noûh), avec ses fils',
        en: 'Noah (Nûh), together with his sons',
      },
      {
        tr: 'Hz. Mûsâ, kardeşi Hz. Hârûn ile birlikte',
        fr: 'Moïse (Mûsâ), avec son frère Aaron (Hârûn)',
        en: 'Moses (Mûsâ), together with his brother Aaron (Hârûn)',
      },
      {
        tr: 'Hz. İbrâhim, oğlu Hz. İsmâil ile birlikte',
        fr: 'Abraham (Ibrâhîm), avec son fils Ismaël (Ismâ‘îl)',
        en: 'Abraham (Ibrâhîm), together with his son Ishmael (Ismâ‘îl)',
      },
    ],
    dogru: 3,
    kaynak:
      'Diyanet Kur’an portalı, Bakara sûresi 2/127 («Hani İbrahim, İsmail ile birlikte evin (Kâbe’nin) temellerini yükseltiyor») — kuran.diyanet.gov.tr/mushaf/kuran-meal-2/bakara-suresi-2/ayet-127/diyanet-isleri-baskanligi-meali-1',
  },
  {
    tur: 'bilgi',
    alan: 'siyer',
    basamak: 3,
    id: 'sy12',
    soru: {
      tr: 'İslâm inancına göre Hz. Îsâ kimdir?',
      fr: 'Selon la foi musulmane, qui est Jésus (Îsâ) ?',
      en: 'According to Islamic belief, who is Jesus (Îsâ)?',
    },
    siklar: [
      {
        tr: 'Allah’ın kulu ve insanlara gönderdiği peygamberlerden biridir',
        fr: 'Il est un serviteur d’Allah et l’un des prophètes envoyés aux hommes',
        en: 'He is a servant of Allah and one of the prophets sent to humankind',
      },
      {
        tr: 'Peygamber değil, ahlâkı güzel bir öğretmen ve bilgedir',
        fr: 'Il n’est pas prophète, mais un sage et un maître de bonne morale',
        en: 'He is not a prophet, but a sage and a teacher of good character',
      },
      {
        tr: 'Kendisine hiçbir ilâhî kitap verilmemiş bir peygamberdir',
        fr: 'C’est un prophète à qui aucun Livre n’a été révélé',
        en: 'He is a prophet to whom no divine Book was revealed',
      },
      {
        tr: 'Adı Kur’an-ı Kerim’de geçmeyen bir din büyüğüdür',
        fr: 'C’est une grande figure religieuse dont le Coran ne parle pas',
        en: 'He is a great religious figure not mentioned in the Qur’an',
      },
    ],
    dogru: 0,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Îsâ»: «Kur’an’da adı geçen ve kendisine kutsal kitap İncil verilen peygamber» — islamansiklopedisi.org.tr/isa',
  },
];
