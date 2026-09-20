/** Seviye testi soru bankası — ahlak ve âdâb (docs/SEVIYE-TESTI.md §5 soru yazım kılavuzu).
 *
 *  12 madde: B1 4 · B2 4 · B3 4. Kaynaklar madde başına `kaynak` alanındadır (TDV İslâm
 *  Ansiklopedisi ve Diyanet Kur’an portalı). Mezhebe bağlı madde yoktur; sorular kimseyi
 *  yargılamayan, günlük hayatta karşılığı olan davranış ve kavramlar üzerine kurulmuştur.
 */
import type { BilgiMaddesi } from '../tipler.ts';

export const AHLAK: BilgiMaddesi[] = [
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 1,
    id: 'ah01',
    soru: {
      tr: 'Bir müslüman «es-selâmü aleyküm» diyerek selâm verdiğinde kendisine nasıl karşılık verilir?',
      fr: 'Lorsqu’un musulman vous salue en disant « as-salâmou alaykoum », que lui répondez-vous ?',
      en: 'When a Muslim greets you by saying “as-salâmu alaykum”, what do you reply?',
    },
    siklar: [
      {
        tr: 'Ve aleykümü’s-selâm (selâm sizin de üzerinize olsun)',
        fr: 'Wa alaykoum as-salâm (que la paix soit aussi sur vous)',
        en: 'Wa alaykum as-salâm (and peace be upon you too)',
      },
      {
        tr: 'Bismillâhirrahmânirrahîm (Rahmân ve rahîm Allah’ın adıyla)',
        fr: 'Bismillâhi ar-Rahmâni ar-Rahîm (au nom d’Allah, le Tout Miséricordieux)',
        en: 'Bismillâhi ar-Rahmâni ar-Rahîm (in the name of Allah, the Most Merciful)',
      },
      {
        tr: 'Elhamdülillâh (hamd ve övgü Allah’a mahsustur)',
        fr: 'Al-hamdou lillâh (la louange appartient à Allah)',
        en: 'Al-hamdu lillâh (all praise belongs to Allah)',
      },
      {
        tr: 'Sübhânallah (Allah her türlü eksiklikten uzaktır)',
        fr: 'Soubhâna Allah (Allah est exempt de toute imperfection)',
        en: 'Subhânallâh (Allah is free from every imperfection)',
      },
    ],
    dogru: 0,
    kaynak: 'TDV İslâm Ansiklopedisi, «Selâm» — islamansiklopedisi.org.tr/selam',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 1,
    id: 'ah02',
    soru: {
      tr: 'Yemeğe ve her işe başlarken söylenen «Bismillâhirrahmânirrahîm» sözüne ne ad verilir?',
      fr: 'Comment appelle-t-on la formule « Bismillâhi ar-Rahmâni ar-Rahîm », prononcée avant de manger et avant toute action ?',
      en: 'What is the name of the formula “Bismillâhi ar-Rahmâni ar-Rahîm”, said before eating and before starting anything?',
    },
    siklar: [
      { tr: 'Tekbir', fr: 'Le takbîr', en: 'The takbir' },
      { tr: 'Salâvat', fr: 'La prière sur le Prophète (salawât)', en: 'The prayer upon the Prophet (salawat)' },
      { tr: 'Besmele', fr: 'La basmala', en: 'The basmala' },
      { tr: 'Tesbih', fr: 'Le tasbîh', en: 'The tasbih' },
    ],
    dogru: 2,
    kaynak: 'TDV İslâm Ansiklopedisi, «Besmele» — islamansiklopedisi.org.tr/besmele',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 1,
    id: 'ah03',
    soru: {
      tr: 'İslâm ahlâkında yalanın karşıtı olan ve başlıca erdemlerden sayılan davranış hangisidir?',
      fr: 'Dans l’éthique musulmane, quel comportement est l’opposé du mensonge et compte parmi les principales vertus ?',
      en: 'In Islamic ethics, which quality is the opposite of lying and counts among the chief virtues?',
    },
    siklar: [
      {
        tr: 'Cömertlik: elindekini başkalarıyla paylaşabilmek',
        fr: 'La générosité : savoir partager ce que l’on possède',
        en: 'Generosity: being able to share what one has',
      },
      {
        tr: 'Doğruluk: sözde ve işte gerçeğe uygun olmak',
        fr: 'La véracité : être conforme à la vérité en parole et en acte',
        en: 'Truthfulness: being true to reality in word and deed',
      },
      {
        tr: 'Sabır: sıkıntı ve zorluk karşısında dayanabilmek',
        fr: 'La patience : tenir bon face à l’épreuve et à la difficulté',
        en: 'Patience: holding firm in the face of hardship and difficulty',
      },
      {
        tr: 'Tevâzu: kendini başkalarından üstün görmemek',
        fr: 'L’humilité : ne pas se croire supérieur aux autres',
        en: 'Humility: not considering oneself above other people',
      },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Sıdk» — islamansiklopedisi.org.tr/sidk',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 1,
    id: 'ah04',
    soru: {
      tr: 'Kur’an-ı Kerim (İsrâ sûresi, 23. âyet) yaşlanan ana babaya karşı nasıl davranılmasını ister?',
      fr: 'Que demande le Coran (sourate al-Isrâ, verset 23) quant à l’attitude envers des parents devenus âgés ?',
      en: 'What does the Qur’an (Surah Al-Isra, verse 23) ask regarding one’s conduct towards ageing parents?',
    },
    siklar: [
      {
        tr: 'İhtiyaçları karşılandıktan sonra ayrı yaşamalarının sağlanmasını',
        fr: 'Qu’on subvienne à leurs besoins puis qu’ils vivent séparément',
        en: 'That their needs be met and that they then live separately',
      },
      {
        tr: 'Yalnız bayram ve özel günlerde ziyaret edilmelerini',
        fr: 'Qu’on leur rende visite seulement lors des fêtes et des jours particuliers',
        en: 'That they be visited only on feast days and special occasions',
      },
      {
        tr: 'Kendilerine «öf» bile denmeden güzel ve tatlı söz söylenmesini',
        fr: 'Qu’on ne leur dise pas même « fi ! » et qu’on leur parle avec douceur',
        en: 'That not even “ugh” be said to them and that they be addressed kindly',
      },
      {
        tr: 'Aile kararlarında görüşlerinin sonradan alınmasını',
        fr: 'Que leur avis soit recueilli après coup dans les décisions familiales',
        en: 'That their opinion be sought afterwards in family decisions',
      },
    ],
    dogru: 2,
    kaynak:
      'Diyanet Kur’an portalı, İsrâ sûresi 17/23 («sakın onlara “öf!” bile deme; onları azarlama; onlara tatlı ve güzel söz söyle») — kuran.diyanet.gov.tr/mushaf/kuran-meal-2/isra-suresi-17/ayet-23/diyanet-isleri-baskanligi-meali-1',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 2,
    id: 'ah05',
    soru: {
      tr: 'Bir kimsenin başkasının hakkını yemesine «kul hakkı» denir. Bu hakkın bağışlanması için ne gerekir?',
      fr: 'Porter atteinte au droit d’autrui relève de ce qu’on appelle « les droits des serviteurs » (houqoûq al-‘ibâd). Que faut-il pour en obtenir le pardon ?',
      en: 'Wronging another person in what is theirs by right is called “a debt owed to a fellow human being” (huquq al-‘ibad). What is needed for such a wrong to be forgiven?',
    },
    siklar: [
      {
        tr: 'Bir süre oruç tutup fazladan sadaka vermek',
        fr: 'Jeûner un certain temps et donner une aumône supplémentaire',
        en: 'Fasting for a period and giving extra charity',
      },
      {
        tr: 'Hakkı ödeyip hak sahibinin rızasını almak (helâlleşmek)',
        fr: 'Réparer le tort et obtenir l’agrément de la personne lésée',
        en: 'Making the wrong good and obtaining the wronged person’s pardon',
      },
      {
        tr: 'Yalnız tövbe edip Allah’tan bağışlanma dilemek',
        fr: 'Se repentir seulement et demander le pardon d’Allah',
        en: 'Merely repenting and asking Allah for forgiveness',
      },
      {
        tr: 'Aynı hatayı bir daha yapmamaya karar vermek',
        fr: 'Décider de ne plus jamais commettre la même faute',
        en: 'Resolving never to repeat the same mistake',
      },
    ],
    dogru: 1,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Kul hakkı»: «bu hakların sahiplerine ödenmesi veya onların rızalarının alınması gerektiğini bildirmişlerdir» — islamansiklopedisi.org.tr/kul-hakki',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 2,
    id: 'ah06',
    soru: {
      tr: 'İslâm ahlâkında «gıybet» ne demektir?',
      fr: 'Que signifie « ghîba » (la médisance) dans l’éthique musulmane ?',
      en: 'What does “ghibah” (backbiting) mean in Islamic ethics?',
    },
    siklar: [
      {
        tr: 'Bir kimseyle yüz yüze tartışıp ona kırıcı sözler söylemek',
        fr: 'Discuter en face avec quelqu’un et lui adresser des paroles blessantes',
        en: 'Arguing with someone face to face and saying hurtful things to them',
      },
      {
        tr: 'Bir kimseye, kendisinde bulunmayan bir kusuru yakıştırmak',
        fr: 'Imputer à quelqu’un un défaut qu’il n’a pas',
        en: 'Attributing to someone a fault that they do not have',
      },
      {
        tr: 'Bir kimsenin sırrını izni olmadan bir başkasına aktarmak',
        fr: 'Rapporter à autrui le secret de quelqu’un sans son accord',
        en: 'Passing on someone’s secret to another person without permission',
      },
      {
        tr: 'Bir kimseyi arkasından, hoşlanmayacağı gerçek bir kusuruyla anmak',
        fr: 'Évoquer en son absence un défaut réel qu’elle n’aimerait pas entendre',
        en: 'Mentioning, behind their back, a real fault they would not like to hear',
      },
    ],
    dogru: 3,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Gıybet»: kişiyi «kendisinde bulunan kusurlarla anmanın gıybet», bulunmayan kusuru isnat etmenin iftira (bühtan) olduğu — islamansiklopedisi.org.tr/giybet',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 2,
    id: 'ah07',
    soru: {
      tr: 'İslâm ahlâkında «israf» ne anlama gelir?',
      fr: 'Que signifie « isrâf » (le gaspillage) dans l’éthique musulmane ?',
      en: 'What does “israf” (wastefulness) mean in Islamic ethics?',
    },
    siklar: [
      {
        tr: 'Mal ve imkânları ölçüsüzce, gereksiz yere harcayıp savurmak',
        fr: 'Dépenser ses biens sans mesure et les dissiper inutilement',
        en: 'Spending one’s wealth without measure and squandering it needlessly',
      },
      {
        tr: 'Gereken yere bile harcamaktan kaçınıp elini sıkı tutmak',
        fr: 'S’abstenir de dépenser même là où il le faudrait, par avarice',
        en: 'Refusing to spend even where one should, out of stinginess',
      },
      {
        tr: 'Kazancın bir bölümünü ileride kullanmak üzere biriktirmek',
        fr: 'Mettre de côté une part de ses revenus pour l’avenir',
        en: 'Setting aside part of one’s income for use in the future',
      },
      {
        tr: 'Gerekli yerlere gerektiği ölçüde eli açık biçimde harcamak',
        fr: 'Dépenser généreusement là où il faut et dans la juste mesure',
        en: 'Spending generously where needed and in the right measure',
      },
    ],
    dogru: 0,
    kaynak: 'TDV İslâm Ansiklopedisi, «İsraf» — islamansiklopedisi.org.tr/israf',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 2,
    id: 'ah08',
    soru: {
      tr: 'İslâm’da komşu hakkı konusunda aşağıdakilerden hangisi doğrudur?',
      fr: 'Au sujet des droits du voisin (djâr) en islam, laquelle de ces affirmations est exacte ?',
      en: 'Regarding the rights of the neighbour (jar) in Islam, which of the following is correct?',
    },
    siklar: [
      {
        tr: 'Komşu hakkı yalnız aynı binada oturanlar için geçerlidir',
        fr: 'Les droits du voisin ne valent que pour les habitants d’un même immeuble',
        en: 'Neighbours’ rights apply only to people living in the same building',
      },
      {
        tr: 'Komşu hakkı yalnız akraba olan komşular için geçerlidir',
        fr: 'Les droits du voisin ne valent que pour les voisins de la même famille',
        en: 'Neighbours’ rights apply only to neighbours who are relatives',
      },
      {
        tr: 'Komşu hakkı, komşunun müslüman olup olmamasına bakılmadan gözetilir',
        fr: 'Les droits du voisin s’observent, que le voisin soit musulman ou non',
        en: 'Neighbours’ rights are observed whether or not the neighbour is Muslim',
      },
      {
        tr: 'Komşu hakkı yalnız komşu yardım istediğinde gözetilir',
        fr: 'Les droits du voisin ne s’observent que lorsqu’il demande de l’aide',
        en: 'Neighbours’ rights are observed only when the neighbour asks for help',
      },
    ],
    dogru: 2,
    kaynak: 'TDV İslâm Ansiklopedisi, «Komşu» (Nisâ 4/36) — islamansiklopedisi.org.tr/komsu',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 3,
    id: 'ah09',
    soru: {
      tr: 'Ahlâk ve tasavvuf terimi olarak «ihlâs» ne demektir?',
      fr: 'Comme terme d’éthique et de spiritualité, que signifie « ikhlâs » (la sincérité) ?',
      en: 'As a term of ethics and spirituality, what does “ikhlas” (sincerity) mean?',
    },
    siklar: [
      {
        tr: 'İbadetleri günün en faziletli vaktinde yerine getirmeye özen göstermek',
        fr: 'Veiller à accomplir les actes d’adoration au moment le plus méritoire',
        en: 'Taking care to perform acts of worship at the most meritorious time',
      },
      {
        tr: 'Yapılan iyiliği başkalarına anlatarak onları da iyiliğe teşvik etmek',
        fr: 'Raconter le bien accompli afin d’encourager les autres à le faire',
        en: 'Telling others about one’s good deeds so as to encourage them too',
      },
      {
        tr: 'İbadetlerin şeklî şartlarına eksiksiz biçimde uymaya dikkat etmek',
        fr: 'Respecter scrupuleusement toutes les conditions formelles du culte',
        en: 'Carefully fulfilling every formal condition of an act of worship',
      },
      {
        tr: 'İbadet ve iyilikleri gösterişten arındırıp yalnız Allah rızâsı için yapmak',
        fr: 'Accomplir adorations et bonnes actions sans ostentation, pour Allah seul',
        en: 'Doing worship and good deeds free of show, for Allah’s sake alone',
      },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «İhlâs» — islamansiklopedisi.org.tr/ihlas',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 3,
    id: 'ah10',
    soru: {
      tr: 'İslâm ahlâkında «tevekkül» ne anlama gelir?',
      fr: 'Que signifie « tawakkoul » (la confiance en Dieu) dans l’éthique musulmane ?',
      en: 'What does “tawakkul” (trust in God) mean in Islamic ethics?',
    },
    siklar: [
      {
        tr: 'Hiçbir şey yapmadan sonucu beklemeye geçip olacakları seyretmek',
        fr: 'Ne rien entreprendre et attendre simplement que le sort s’accomplisse',
        en: 'Doing nothing at all and simply waiting for the outcome to unfold',
      },
      {
        tr: 'Geçmişte yapılan hataları düşünüp pişmanlık duymak',
        fr: 'Songer à ses fautes passées et en éprouver du regret',
        en: 'Reflecting on past mistakes and feeling regret for them',
      },
      {
        tr: 'Sıkıntı anında insanlardan yardım istemekten kaçınmak',
        fr: 'Éviter de demander de l’aide à autrui dans l’épreuve',
        en: 'Avoiding asking other people for help in times of difficulty',
      },
      {
        tr: 'Üzerine düşeni yaptıktan sonra sonucu Allah’a bırakıp O’na güvenmek',
        fr: 'Faire ce qui dépend de soi, puis s’en remettre à Allah avec confiance',
        en: 'Doing one’s own part and then entrusting the outcome to Allah',
      },
    ],
    dogru: 3,
    kaynak: 'TDV İslâm Ansiklopedisi, «Tevekkül» — islamansiklopedisi.org.tr/tevekkul',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 3,
    id: 'ah11',
    soru: {
      tr: 'Sıkıntıya dayanmaya «sabır» denir. Kişinin kendisine verilen nimetin değerini bilip söz ve davranışla karşılığını vermesine ne denir?',
      fr: 'Tenir bon dans l’épreuve s’appelle « sabr ». Comment nomme-t-on le fait de reconnaître la valeur d’un bienfait reçu et d’y répondre en parole et en acte ?',
      en: 'Enduring hardship is called “sabr”. What is it called when a person recognises the worth of a blessing received and responds to it in word and deed?',
    },
    siklar: [
      { tr: 'Tevekkül', fr: 'Le tawakkoul', en: 'Tawakkul' },
      { tr: 'Şükür', fr: 'Le choukr', en: 'Shukr' },
      { tr: 'Tövbe', fr: 'La tawba', en: 'Tawbah' },
      { tr: 'İhlâs', fr: 'L’ikhlâs', en: 'Ikhlas' },
    ],
    dogru: 1,
    kaynak: 'TDV İslâm Ansiklopedisi, «Şükür» — islamansiklopedisi.org.tr/sukur',
  },
  {
    tur: 'bilgi',
    alan: 'ahlak',
    basamak: 3,
    id: 'ah12',
    soru: {
      tr: 'İslâm ahlâkında «haset» ne anlama gelir?',
      fr: 'Que signifie « hasad » (l’envie) dans l’éthique musulmane ?',
      en: 'What does “hasad” (envy) mean in Islamic ethics?',
    },
    siklar: [
      {
        tr: 'Başkasının elindeki nimetin ondan gitmesini istemek',
        fr: 'Souhaiter que le bienfait dont autrui jouit lui soit retiré',
        en: 'Wishing that a blessing someone enjoys be taken away from them',
      },
      {
        tr: 'Başkasının sahip olduğunun benzerini kıskanmadan istemek',
        fr: 'Désirer sans jalousie l’équivalent de ce que possède autrui',
        en: 'Wanting, without jealousy, the like of what another person has',
      },
      {
        tr: 'Başkasının elde ettiği başarıyı görmezden gelip küçümsemek',
        fr: 'Ignorer et minimiser la réussite obtenue par autrui',
        en: 'Ignoring and belittling the success another person has achieved',
      },
      {
        tr: 'Başkasının sahip olduklarını sürekli kendisiyle karşılaştırmak',
        fr: 'Comparer sans cesse ce que possède autrui à ce que l’on a soi-même',
        en: 'Constantly comparing what others own with what one has oneself',
      },
    ],
    dogru: 0,
    kaynak:
      'TDV İslâm Ansiklopedisi, «Haset» (haset ↔ gıpta ayrımı: kıskanılan kişinin nimetten mahrum kalmasını isteme) — islamansiklopedisi.org.tr/haset',
  },
];
