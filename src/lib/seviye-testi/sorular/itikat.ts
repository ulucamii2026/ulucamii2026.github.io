/** Seviye testi soru bankası — itikat (docs/SEVIYE-TESTI.md §5 soru yazım kılavuzu).
 *
 *  14 madde: B1 5 · B2 5 · B3 4. Her maddenin kaynağı `kaynak` alanındadır; TDV İslâm
 *  Ansiklopedisi maddeleri, DİB «İslâm İlmihali» ve Diyanet Kur’an portalı üzerinden tek tek doğrulanmıştır.
 *  Mezhebe bağlı madde yoktur; üslup yargılamayan ve başka inançları küçültmeyen bir dildedir.
 */
import type { BilgiMaddesi } from '../tipler.ts';

export const ITIKAT: BilgiMaddesi[] = [
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 1,
    id: 'it01',
    soru: {
      tr: '«Eşhedü en lâ ilâhe illallah ve eşhedü enne Muhammeden abdühû ve resûlüh» cümlesine kelime-i şehâdet denir. Bu cümle neyi ifade eder?',
      fr: 'La phrase « Ach-hadou an lâ ilâha illallâh wa ach-hadou anna Mouhammadan abdouhou wa rassoulouh » est appelée l’attestation de foi (chahâda). Que signifie-t-elle ?',
      en: 'The sentence “Ash-hadu an lâ ilâha illallâh wa ash-hadu anna Muhammadan abduhu wa rasûluh” is called the declaration of faith (shahada). What does it express?',
    },
    siklar: [
      {
        tr: 'Allah’tan başka ilâh olmadığına ve Hz. Muhammed’in (s.a.s.) O’nun kulu ve elçisi olduğuna şehâdet etmeyi',
        fr: 'Attester qu’il n’y a de divinité qu’Allah et que le Prophète Muhammad (paix et salut sur lui) est Son serviteur et Son messager',
        en: 'Bearing witness that there is no deity but Allah and that Prophet Muhammad (peace be upon him) is His servant and messenger',
      },
      {
        tr: 'Günde beş vakit namaz kılmaya ve ramazan orucunu tutmaya söz vermeyi',
        fr: 'Promettre d’accomplir les cinq prières quotidiennes (salât) et de jeûner le mois de ramadan',
        en: 'Promising to perform the five daily prayers (salah) and to fast the month of Ramadan',
      },
      {
        tr: 'İşlenen günahlar için Allah’tan bağışlanma dileyip tövbe etmeyi',
        fr: 'Demander à Allah le pardon des péchés commis et revenir vers Lui par le repentir',
        en: 'Asking Allah for forgiveness of one’s sins and turning back to Him in repentance',
      },
      {
        tr: 'Allah’ın verdiği nimetlere şükredip bütün insanlara iyilik etmeyi',
        fr: 'Remercier Allah pour Ses bienfaits et faire du bien à toutes les personnes',
        en: 'Giving thanks to Allah for His blessings and doing good to all people',
      },
    ],
    dogru: 0,
    kaynak: 'TDV İslâm Ansiklopedisi, «Kelime-i şehâdet» — islamansiklopedisi.org.tr/kelime-i-sehadet',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 1,
    id: 'it02',
    soru: {
      tr: 'Kur’an-ı Kerim’in İhlâs sûresi Allah hakkında hangi temel gerçeği bildirir?',
      fr: 'Quelle vérité fondamentale la sourate al-Ikhlâs (sourate 112) énonce-t-elle au sujet d’Allah ?',
      en: 'What fundamental truth does Surah Al-Ikhlas (surah 112) state about Allah?',
    },
    siklar: [
      {
        tr: 'Allah’ın her şeyi görüp işittiğini ve dualara karşılık verdiğini',
        fr: 'Qu’Allah voit et entend toute chose et qu’Il répond aux invocations',
        en: 'That Allah sees and hears everything and answers supplications',
      },
      {
        tr: 'Allah’ın bir ve tek olduğunu, hiçbir şeyin O’na denk olmadığını',
        fr: 'Qu’Allah est Un et unique et que rien ni personne ne Lui est égal',
        en: 'That Allah is one and unique and that nothing whatsoever is equal to Him',
      },
      {
        tr: 'Allah’ın kullarına karşı çok merhametli ve bağışlayıcı olduğunu',
        fr: 'Qu’Allah est infiniment miséricordieux et pardonne à Ses serviteurs',
        en: 'That Allah is most merciful and forgiving towards His servants',
      },
      {
        tr: 'Allah’ın bütün canlıların rızkını verip onları koruduğunu',
        fr: 'Qu’Allah pourvoit à la subsistance de toutes les créatures et les protège',
        en: 'That Allah provides for every living creature and protects them',
      },
    ],
    dogru: 1,
    kaynak:
      'Diyanet Kur’an portalı, İhlâs sûresi 112/1-4 («Hiçbir şey O’na denk ve benzer değildir») — kuran.diyanet.gov.tr/mushaf/kuran-meal-2/ihlas-suresi-112/ayet-1/diyanet-isleri-baskanligi-meali-1',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 1,
    id: 'it03',
    soru: {
      tr: 'Aşağıdakilerden hangisi imanın şartları (âmentü) arasında yer alır?',
      fr: 'Lequel de ces éléments fait partie des piliers de la foi (arkân al-îmân) ?',
      en: 'Which of the following is one of the articles of faith (arkan al-iman)?',
    },
    siklar: [
      {
        tr: 'Zekât vermek',
        fr: 'Verser l’aumône légale (zakât)',
        en: 'Giving the obligatory alms (zakah)',
      },
      {
        tr: 'Ramazan orucunu tutmak',
        fr: 'Jeûner le mois de ramadan',
        en: 'Fasting the month of Ramadan',
      },
      {
        tr: 'Meleklere inanmak',
        fr: 'Croire aux anges (malâika)',
        en: 'Believing in the angels (mala’ika)',
      },
      {
        tr: 'Hacca gitmek',
        fr: 'Accomplir le pèlerinage (hajj)',
        en: 'Performing the pilgrimage (hajj)',
      },
    ],
    dogru: 2,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Âmentü» — islamansiklopedisi.org.tr/amentu ; DİB «İslâm İlmihali», s. 41: «İman esasları altıdır ve Amentü cümlesinde toplanmıştır» (Allah’a, meleklerine, kitaplarına, peygamberlerine, âhiret gününe, kadere)',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 1,
    id: 'it04',
    soru: {
      tr: 'Hz. Muhammed (s.a.s.) için «son peygamber» denmesi ne anlama gelir?',
      fr: 'Que signifie le fait de dire du Prophète Muhammad (paix et salut sur lui) qu’il est « le dernier des prophètes » ?',
      en: 'What does it mean to say that Prophet Muhammad (peace be upon him) is “the last prophet”?',
    },
    siklar: [
      {
        tr: 'Kendisinden sonra başka bir peygamber gönderilmeyeceğini',
        fr: 'Qu’aucun autre prophète ne sera envoyé après lui',
        en: 'That no other prophet will be sent after him',
      },
      {
        tr: 'Kendisinden önce hiçbir peygamber gönderilmediğini',
        fr: 'Qu’aucun prophète n’avait été envoyé avant lui',
        en: 'That no prophet had been sent before him',
      },
      {
        tr: 'Yalnız kendi kabilesine peygamber olarak gönderildiğini',
        fr: 'Qu’il a été envoyé comme prophète à sa seule tribu',
        en: 'That he was sent as a prophet only to his own tribe',
      },
      {
        tr: 'Kendisine kitap verilen tek peygamber olduğunu',
        fr: 'Qu’il est le seul prophète à avoir reçu un Livre',
        en: 'That he is the only prophet who received a Book',
      },
    ],
    dogru: 0,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Hatm-i nübüvvet» (Ahzâb 33/40: «hâtemü’n-nebiyyîn») — islamansiklopedisi.org.tr/hatm-i-nubuvvet',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 1,
    id: 'it05',
    soru: {
      tr: 'Kur’an-ı Kerim’in İslâm inancındaki yeri için aşağıdakilerden hangisi doğrudur?',
      fr: 'Laquelle de ces affirmations est exacte au sujet de la place du Coran dans la foi musulmane ?',
      en: 'Which of the following is correct about the place of the Qur’an in Islamic belief?',
    },
    siklar: [
      {
        tr: 'Hz. Îsâ’ya indirilen ve sonradan yazıya geçirilen kitaptır',
        fr: 'C’est le Livre révélé au prophète Jésus (Îsâ) et mis par écrit plus tard',
        en: 'It is the Book revealed to Prophet Jesus (Îsâ) and written down later',
      },
      {
        tr: 'Sahâbenin Hz. Peygamber’den duyduklarını yazdığı kitaptır',
        fr: 'C’est le livre où les Compagnons ont consigné les paroles du Prophète',
        en: 'It is the book in which the Companions recorded the Prophet’s sayings',
      },
      {
        tr: 'İslâm âlimlerinin yazdığı en eski ilmihal kitabıdır',
        fr: 'C’est le plus ancien manuel de pratique religieuse écrit par les savants',
        en: 'It is the oldest handbook of religious practice written by scholars',
      },
      {
        tr: 'Allah’ın Hz. Muhammed’e (s.a.s.) indirdiği son ilâhî kitaptır',
        fr: 'C’est le dernier Livre révélé par Allah au Prophète Muhammad (paix et salut sur lui)',
        en: 'It is the last divine Book revealed by Allah to Prophet Muhammad (peace be upon him)',
      },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Kur’an» — islamansiklopedisi.org.tr/kuran',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 2,
    id: 'it06',
    soru: {
      tr: 'Dört büyük melekten Cebrâil’in görevi nedir?',
      fr: 'Parmi les quatre grands anges (malâika), quelle est la mission de Gabriel (Djibrîl) ?',
      en: 'Among the four great angels (mala’ika), what is the duty of Gabriel (Jibrîl)?',
    },
    siklar: [
      {
        tr: 'Peygamberlere Allah’tan vahiy getirmek',
        fr: 'Apporter aux prophètes la révélation venant d’Allah',
        en: 'Bringing revelation from Allah to the prophets',
      },
      {
        tr: 'Sûra üfleyerek kıyametin başladığını bildirmek',
        fr: 'Souffler dans la Trompe pour annoncer la fin des temps',
        en: 'Blowing the Trumpet to announce the end of the world',
      },
      {
        tr: 'Eceli gelen canlıların ruhunu almakla görevli olmak',
        fr: 'Être chargé de reprendre l’âme des créatures à leur terme',
        en: 'Being charged with taking the souls of creatures at their appointed time',
      },
      {
        tr: 'Tabiat olaylarını ve rızıkların dağıtımını düzenlemek',
        fr: 'Régler les phénomènes naturels et la répartition des subsistances',
        en: 'Ordering natural events and the distribution of sustenance',
      },
    ],
    dogru: 0,
    kaynak: 'TDV İslâm Ansiklopedisi, «Melek» — islamansiklopedisi.org.tr/melek',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 2,
    id: 'it07',
    soru: {
      tr: 'Kur’an-ı Kerim’e göre Zebûr hangi peygambere verilmiştir?',
      fr: 'Selon le Coran, à quel prophète le Zabûr (les Psaumes) a-t-il été donné ?',
      en: 'According to the Qur’an, to which prophet was the Zabûr (the Psalms) given?',
    },
    siklar: [
      {
        tr: 'Hz. Mûsâ’ya',
        fr: 'Au prophète Moïse (Mûsâ)',
        en: 'To Prophet Moses (Mûsâ)',
      },
      {
        tr: 'Hz. Dâvûd’a',
        fr: 'Au prophète David (Dâvûd)',
        en: 'To Prophet David (Dâvûd)',
      },
      {
        tr: 'Hz. Îsâ’ya',
        fr: 'Au prophète Jésus (Îsâ)',
        en: 'To Prophet Jesus (Îsâ)',
      },
      {
        tr: 'Hz. İbrâhim’e',
        fr: 'Au prophète Abraham (Ibrâhîm)',
        en: 'To Prophet Abraham (Ibrâhîm)',
      },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Zebûr» (Nisâ 4/163; İsrâ 17/55) — islamansiklopedisi.org.tr/zebur',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 2,
    id: 'it08',
    soru: {
      tr: 'İslâm inancında «âhiret» ne anlama gelir?',
      fr: 'Que signifie « l’au-delà » (âkhira) dans la foi musulmane ?',
      en: 'What does “the Hereafter” (akhirah) mean in Islamic belief?',
    },
    siklar: [
      {
        tr: 'Kur’an-ı Kerim’in indirilmeye başladığı mübarek gece',
        fr: 'La nuit bénie où la révélation du Coran a commencé',
        en: 'The blessed night on which the revelation of the Qur’an began',
      },
      {
        tr: 'Peygamberlere Allah katından haber getirilmesi hâli',
        fr: 'Le fait qu’un message d’Allah soit transmis aux prophètes',
        en: 'The conveying of a message from Allah to the prophets',
      },
      {
        tr: 'Ölümden sonra başlayıp sonsuza kadar sürecek olan ikinci hayat',
        fr: 'La seconde vie qui commence après la mort et dure éternellement',
        en: 'The second life that begins after death and continues for ever',
      },
      {
        tr: 'Hz. Peygamber’in Mekke’den Medine’ye göç etmesi olayı',
        fr: 'L’émigration du Prophète de La Mecque vers Médine',
        en: 'The Prophet’s migration from Mecca to Medina',
      },
    ],
    dogru: 2,
    kaynak: 'TDV İslâm Ansiklopedisi, «Âhiret» — islamansiklopedisi.org.tr/ahiret',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 2,
    id: 'it09',
    soru: {
      tr: 'Kadere iman ile insanın sorumluluğu arasındaki ilişki için aşağıdakilerden hangisi doğrudur?',
      fr: 'Quelle affirmation décrit correctement le lien entre la foi au décret divin (qadar) et la responsabilité de l’être humain ?',
      en: 'Which statement correctly describes the link between belief in divine decree (qadar) and human responsibility?',
    },
    siklar: [
      {
        tr: 'Allah’ın her şeyi önceden bilmesi insanı sorumluluktan kurtarır',
        fr: 'Le fait qu’Allah sache tout d’avance dispense l’être humain de toute responsabilité',
        en: 'Allah’s knowing everything in advance relieves people of all responsibility',
      },
      {
        tr: 'Kadere inanan kişinin tedbir almasına ve çalışmasına gerek yoktur',
        fr: 'Celui qui croit au décret divin n’a besoin ni de précautions ni d’efforts',
        en: 'Someone who believes in qadar need take no precautions and make no effort',
      },
      {
        tr: 'İnsan yalnız iyi işlerinden sorumludur, kötülükler kaderin gereğidir',
        fr: 'L’être humain n’est responsable que de ses bonnes actions, le mal relevant du décret',
        en: 'People are responsible only for their good deeds; evil is a matter of decree',
      },
      {
        tr: 'İnsan kendi iradesiyle seçim yapar ve yaptıklarından sorumludur',
        fr: 'L’être humain choisit par sa propre volonté et répond de ses actes',
        en: 'People choose by their own will and are answerable for what they do',
      },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Kader» — islamansiklopedisi.org.tr/kader',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 2,
    id: 'it10',
    soru: {
      tr: 'Peygamberlerin ortak sıfatlarından «tebliğ» ne anlama gelir?',
      fr: 'Que signifie « tablîgh », l’un des attributs communs à tous les prophètes ?',
      en: 'What does “tablîgh”, one of the attributes shared by all prophets, mean?',
    },
    siklar: [
      {
        tr: 'Her sözlerinde ve işlerinde doğru olmaları',
        fr: 'Être véridiques dans toutes leurs paroles et leurs actes',
        en: 'Being truthful in all their words and deeds',
      },
      {
        tr: 'İnsanlara karşı her konuda güvenilir olmaları',
        fr: 'Être dignes de confiance en toute chose envers les gens',
        en: 'Being trustworthy towards people in every matter',
      },
      {
        tr: 'Allah’tan aldıkları vahyi insanlara eksiksiz ulaştırmaları',
        fr: 'Transmettre intégralement aux hommes la révélation reçue d’Allah',
        en: 'Conveying to people in full the revelation they receive from Allah',
      },
      {
        tr: 'Akıllı ve anlayışlı bir yaratılışta olmaları',
        fr: 'Être dotés d’une intelligence et d’une perspicacité remarquables',
        en: 'Being created with keen intelligence and understanding',
      },
    ],
    dogru: 2,
    kaynak:
      'DİB «İslâm İlmihali», s. 60: «Tebliğ: “Duyurmak” demektir… kendilerine vahyedilmiş olan her şeyi eksiksiz olarak insanlara duyurmuşlardır» (sıdk, emanet, tebliğ, fetanet, ismet); TDV İslâm Ansiklopedisi, «Peygamber» — islamansiklopedisi.org.tr/peygamber',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 3,
    id: 'it11',
    soru: {
      tr: 'Allah’ın güzel isimlerinden (esmâ-i hüsnâ) «Rezzâk» ne anlama gelir?',
      fr: 'Parmi les beaux noms d’Allah (asmâ al-housnâ), que signifie « ar-Razzâq » ?',
      en: 'Among the beautiful names of Allah (asma al-husna), what does “ar-Razzâq” mean?',
    },
    siklar: [
      {
        tr: 'Kullarını tövbeye yöneltip tövbelerini kabul eden',
        fr: 'Celui qui incite Ses serviteurs au repentir et l’accepte d’eux',
        en: 'The One who leads His servants to repentance and accepts it from them',
      },
      {
        tr: 'Bedenlerin ve ruhların gıdasını yaratıp veren',
        fr: 'Celui qui crée et dispense la subsistance des corps et des âmes',
        en: 'The One who creates and provides the sustenance of bodies and souls',
      },
      {
        tr: 'Gizli açık her şeyi hakkıyla bilen',
        fr: 'Celui qui connaît parfaitement toute chose, cachée ou manifeste',
        en: 'The One who knows all things perfectly, hidden or manifest',
      },
      {
        tr: 'Kullarına karşı çok esirgeyen ve bağışlayan',
        fr: 'Celui qui est infiniment clément et miséricordieux envers Ses serviteurs',
        en: 'The One who is most compassionate and merciful to His servants',
      },
    ],
    dogru: 1,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Rezzâk»: Allah’a nisbet edildiğinde «bedenlerin ve ruhların gıdasını yaratıp veren» — islamansiklopedisi.org.tr/rezzak',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 3,
    id: 'it12',
    soru: {
      tr: 'Allah’ın zâtî sıfatlarından «kıyâm bi-nefsihî» ne anlama gelir?',
      fr: 'Parmi les attributs essentiels d’Allah, que signifie « qiyâm bi-nafsihi » ?',
      en: 'Among the essential attributes of Allah, what does “qiyam bi-nafsihi” mean?',
    },
    siklar: [
      {
        tr: 'Allah’ın varlığının bir başlangıcının bulunmaması',
        fr: 'Que l’existence d’Allah n’a pas de commencement',
        en: 'That Allah’s existence has no beginning',
      },
      {
        tr: 'Allah’ın bir ve tek olması, hiçbir ortağının bulunmaması',
        fr: 'Qu’Allah est Un et unique et qu’Il n’a aucun associé',
        en: 'That Allah is one and unique and has no partner at all',
      },
      {
        tr: 'Allah’ın varlığının kendinden olması, hiçbir şeye muhtaç olmaması',
        fr: 'Que l’existence d’Allah vient de Lui-même et ne dépend de rien',
        en: 'That Allah’s existence is from Himself and depends on nothing',
      },
      {
        tr: 'Allah’ın yarattıklarının hiçbirine hiçbir bakımdan benzememesi',
        fr: 'Qu’Allah ne ressemble en rien à aucune de Ses créatures',
        en: 'That Allah in no way resembles any of His creatures',
      },
    ],
    dogru: 2,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Kıyâm bi-nefsihî»: «Allah’ın varlığının kendinden olup hiçbir yönden başkasına muhtaç bulunmadığı anlamında kelâm terimi» — islamansiklopedisi.org.tr/kiyam-bi-nefsihi ; DİB «İslâm İlmihali», s. 43-44 (zâtî sıfatlar)',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 3,
    id: 'it13',
    soru: {
      tr: 'İslâm inancında «şirk» ne demektir?',
      fr: 'Que signifie « chirk » (l’association) dans la foi musulmane ?',
      en: 'What does “shirk” (associating partners with God) mean in Islamic belief?',
    },
    siklar: [
      {
        tr: 'Bilerek günah işleyip tövbe etmeyi sürekli geciktirmek',
        fr: 'Commettre sciemment des péchés en repoussant sans cesse le repentir',
        en: 'Knowingly committing sins and constantly postponing repentance',
      },
      {
        tr: 'Bir ibadeti şartlarına uymadan eksik biçimde yerine getirmek',
        fr: 'Accomplir un acte d’adoration sans en respecter les conditions',
        en: 'Performing an act of worship without fulfilling its conditions',
      },
      {
        tr: 'Dinî bir konuda yeterince bilmeden konuşup yanlış bilgi vermek',
        fr: 'Parler d’une question religieuse sans savoir et transmettre une erreur',
        en: 'Speaking about a religious matter without knowledge and passing on error',
      },
      {
        tr: 'Allah’ın zâtında, sıfatlarında veya ibadette O’na ortak koşmak',
        fr: 'Attribuer à Allah un associé dans Son essence, Ses attributs ou l’adoration',
        en: 'Ascribing a partner to Allah in His essence, His attributes or worship',
      },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Şirk» — islamansiklopedisi.org.tr/sirk',
  },
  {
    tur: 'bilgi',
    alan: 'itikat',
    basamak: 3,
    id: 'it14',
    soru: {
      tr: 'Hanefî, Şâfiî, Mâlikî ve Hanbelî mezhepleri için aşağıdakilerden hangisi doğrudur?',
      fr: 'Au sujet des écoles hanafite, chaféite, malikite et hanbalite (madhâhib), laquelle de ces affirmations est exacte ?',
      en: 'Regarding the Hanafi, Shafi‘i, Maliki and Hanbali schools (madhhabs), which of the following is correct?',
    },
    siklar: [
      {
        tr: 'Birbirinden ayrı dört ayrı din oldukları',
        fr: 'Qu’il s’agit de quatre religions distinctes les unes des autres',
        en: 'That they are four separate religions, distinct from one another',
      },
      {
        tr: 'İslâm’ın anlaşılıp uygulanmasında ortaya çıkan fıkıh ekolleri oldukları',
        fr: 'Qu’il s’agit d’écoles juridiques nées de la compréhension et de la pratique de l’islam',
        en: 'That they are schools of law arising from understanding and practising Islam',
      },
      {
        tr: 'Yalnız iman esaslarında birbirinden ayrıldıkları',
        fr: 'Qu’elles se distinguent les unes des autres uniquement sur les articles de foi',
        en: 'That they differ from one another only in the articles of faith',
      },
      {
        tr: 'Her birinin ayrı bir kutsal kitabı bulunduğu',
        fr: 'Que chacune d’elles possède son propre Livre sacré',
        en: 'That each of them has its own separate holy Book',
      },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Mezhep» — islamansiklopedisi.org.tr/mezhep',
  },
];
