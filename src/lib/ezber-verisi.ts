/**
 * Öğrenci Ezber ve Dinleme Odası veri seti.
 * Kur'an kursu müfredatındaki temel namaz duaları ve kısa sureler:
 * Arapça metin, okunuş, TR/FR/EN anlamlar ve doğrulanmış ses bağlantıları.
 */
import type { Dil } from '../i18n/ui';

export type EzberOgesi = {
  id: string;
  ad: Record<Dil, string>;
  tur: 'dua' | 'sure';
  arapca: string;
  okunus: string;
  anlam: Record<Dil, string>;
  sesUrl: string;
};

export const EZBER_LISTESI: EzberOgesi[] = [
  {
    id: 'fatiha',
    ad: { tr: 'Fâtiha Sûresi', fr: 'Sourate Al-Fatiha', en: 'Surah Al-Fatihah' },
    tur: 'sure',
    arapca: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿١﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٢﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٣﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٤﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٥﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ ﴿٦﴾ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Elhamdü lillâhi rabbil-âlemîn. Er-rahmânir-rahîm. Mâliki yevmid-dîn. İyyâke na’büdü ve iyyâke neste’în. İhdinas-sırâtal-müstekîm. Sırâtallezîne en’amte aleyhim, ğayril-mağdûbi aleyhim veled-dâllîn.',
    anlam: {
      tr: 'Hamd, âlemlerin Rabbi Allah’a mahsustur. O, Rahmân ve Rahîmdir. Ceza ve hesap gününün mâlikidir. Yalnız sana ibadet eder, yalnız senden yardım dileriz. Bizi doğru yola ilet; kendilerine lütufta bulunduğun kimselerin yoluna; gazaba uğramışların ve sapmışların yoluna değil.',
      fr: 'Louange à Allah, Seigneur de l’univers. Le Tout Miséricordieux, le Très Miséricordieux, Maître du Jour de la rétribution. C’est Toi seul que nous adorons, et c’est Toi seul dont nous implorons le secours. Guide-nous dans le droit chemin, le chemin de ceux que Tu as comblés de bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
      en: 'All praise is due to Allah, Lord of the worlds. The Entirely Merciful, the Especially Merciful, Sovereign of the Day of Recompense. It is You we worship and You we ask for help. Guide us to the straight path—the path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.',
    },
    sesUrl: '/media/ses/sureler/fatiha.mp3',
  },
  {
    id: 'ayetel-kursi',
    ad: { tr: 'Âyetü’l-Kürsî', fr: 'Ayat Al-Kursi (Verset du Trône)', en: 'Ayat Al-Kursi (Throne Verse)' },
    tur: 'sure',
    arapca: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    okunus: 'Allâhü lâ ilâhe illâ hüvel-hayyül-kayyûm. Lâ te’huzühû sinetün ve lâ nevm. Lehû mâ fis-semâvâti ve mâ fil-ard. Men zellezî yeşfe’u ‘ındehû illâ bi-iznih. Ya’lemü mâ beyne eydîhim ve mâ halfehüm. Ve lâ yühîtûne bi-şey’in min ‘ılmihî illâ bimâ şâ’. Vesi’a kürsiyyühüs-semâvâti vel-ard. Ve lâ yeûdühû hıfzuhümâ, ve hüvel-aliyyül-azîm.',
    anlam: {
      tr: 'Allah, O’ndan başka ilah yoktur; O diridir, her şeyi ayakta tutandır. O’nu ne uyuklama ne de uyku tutar. Göklerde ve yerde olanlar O’nundur. O’nun izni olmadan katında kim şefaat edebilir? O, kulların yaptıklarını ve yapacaklarını bilir. Onlar O’nun ilminden, dilediğinden başkasını kavrayamazlar. O’nun kürsüsü gökleri ve yeri kaplamıştır. Onları koruyup gözetmek O’na güç gelmez. O, yücedir, büyüktür.',
      fr: 'Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il sait leur passé et leur futur. Et, de Sa science, ils n’embrassent que ce qu’Il veut. Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand.',
      en: 'Allah—there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.',
    },
    sesUrl: '/media/ses/sureler/ayetel-kursi.mp3',
  },
  {
    id: 'insirah',
    ad: { tr: 'İnşirâh Sûresi', fr: 'Sourate Al-Inshirah', en: 'Surah Al-Inshirah' },
    tur: 'sure',
    arapca: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ﴿١﴾ وَوَضَعْنَا عَنكَ وِزْرَكَ ﴿٢﴾ الَّذِي أَنقَضَ ظَهْرَكَ ﴿٣﴾ وَرَفَعْنَا لَكَ ذِكْرَكَ ﴿٤﴾ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾ فَإِذَا فَرَغْتَ فَانصَبْ ﴿٧﴾ وَإِلَىٰ رَبِّكَ فَارْغَب ﴿٨﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Elem neşrah leke sadrak. Ve veda’nâ ‘anke vizrak. Ellezî enkada zahrak. Ve refa’nâ leke zikrak. Fe-inne me’al-’usri yusrâ. İnne me’al-’usri yusrâ. Fe-izâ ferağte fensab. Ve ilâ rabbike ferğab.',
    anlam: {
      tr: 'Senin göğsünü açıp genişletmedik mi? Belini büken yükünü üzerinden atmadık mı? Senin şanını ve namını yüceltmedik mi? Elbette zorlukla beraber bir kolaylık vardır. Gerçekten zorlukla beraber bir kolaylık vardır. Öyleyse bir işi bitirince diğerine koyul ve yalnız Rabbine yönel.',
      fr: 'N’avons-Nous pas ouvert pour toi ta poitrine ? Et ne t’avons-Nous pas déchargé de ton fardeau qui accablait ton dos ? Et exalté pour toi ta renommée ? À côté de la difficulté est certes une facilité ! Oui, à côté de la difficulté est une facilité. Quand tu as terminé, lève-toi donc, et vers ton Seigneur chemine avec ardeur.',
      en: 'Did We not expand for you, [O Muhammad], your breast? And We removed from you your burden which had weighed upon your back, and raised high for you your repute. For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease. So when you have finished [your duties], then stand up [for worship]. And to your Lord direct [your] longing.',
    },
    sesUrl: '/media/ses/sureler/insirah.mp3',
  },
  {
    id: 'kadir',
    ad: { tr: 'Kadir Sûresi', fr: 'Sourate Al-Qadr', en: 'Surah Al-Qadr' },
    tur: 'sure',
    arapca: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ ﴿١﴾ وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ ﴿٢﴾ لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ ﴿٣﴾ تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ ﴿٤﴾ سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ ﴿٥﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. İnnâ enzelnâhü fî leyletil-kadr. Ve mâ edrâke mâ leyletül-kadr. Leyletül-kadri hayrum-min elfi şehr. Tenezzelül-melâiketü ver-rûhu fîhâ bi-izni rabbihim min külli emr. Selâmün hiye hattâ matla’ıl-fecr.',
    anlam: {
      tr: 'Şüphesiz biz onu (Kur’an’ı) Kadir gecesinde indirdik. Kadir gecesinin ne olduğunu sen ne bileceksin? Kadir gecesi bin aydan daha hayırlıdır. Melekler ve Ruh (Cebrail), o gecede Rablerinin izniyle her türlü iş için iner dururlar. O gece, tanyeri ağarıncaya kadar esenliktir.',
      fr: 'Nous l’avons certes fait descendre pendant la nuit d’Al-Qadr. Et qui te dira ce qu’est la nuit d’Al-Qadr ? La nuit d’Al-Qadr est meilleure que mille mois. Durant celle-ci descendent les Anges ainsi que l’Esprit, par permission de leur Seigneur pour tout ordre. Elle est paix et salut jusqu’à l’apparition de l’aube.',
      en: 'Indeed, We sent the Quran down during the Night of Decree. And what can make you know what is the Night of Decree? The Night of Decree is better than a thousand months. The angels and the Spirit descend therein by permission of their Lord for every matter. Peace it is until the emergence of dawn.',
    },
    sesUrl: '/media/ses/sureler/kadir.mp3',
  },
  {
    id: 'asr',
    ad: { tr: 'Asr Sûresi', fr: 'Sourate Al-Asr', en: 'Surah Al-Asr' },
    tur: 'sure',
    arapca: 'وَالْعَصْرِ ﴿١﴾ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ﴿٢﴾ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ ﴿٣﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Vel-’asr. İnnel-insâne lefî husr. İllellezîne âmenû ve ‘amilus-sâlihâti ve tevâsav bil-hakkı ve tevâsav bis-sabr.',
    anlam: {
      tr: 'Asra yemin olsun ki, insan gerçekten ziyan içindedir. Ancak iman edip salih ameller işleyenler, birbirlerine hakkı ve sabrı tavsiye edenler müstesnadır.',
      fr: 'Par le Temps ! L’homme est certes en perdition, sauf ceux qui croient et accomplissent les bonnes œuvres, s’enjoignent mutuellement la vérité et s’enjoignent mutuellement l’endurance.',
      en: 'By time, indeed, mankind is in loss, except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.',
    },
    sesUrl: '/media/ses/sureler/asr.mp3',
  },
  {
    id: 'fil',
    ad: { tr: 'Fîl Sûresi', fr: 'Sourate Al-Fil', en: 'Surah Al-Feel' },
    tur: 'sure',
    arapca: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ ﴿١﴾ أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ ﴿٢﴾ وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ ﴿٣﴾ تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ ﴿٤﴾ فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ ﴿٥﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Elem tera keyfe fe’ale rabbüke bi-ashâbil-fîl. Elem yec’al keydehüm fî tadlîl. Ve ersele ‘aleyhim tayran ebâbîl. Termîhim bi-hıcâratin min siccîl. Fe-ce’alehüm ke-’asfin me’kûl.',
    anlam: {
      tr: 'Rabbinin fil sahiplerine neler ettiğini görmedin mi? Onların kötü planlarını boşa çıkarmadı mı? Onların üzerine sürü sürü kuşlar gönderdi; onlara çamurdan pişirilmiş sert taşlar atan. Sonunda onları yenilmiş ekin yaprağı gibi kıldı.',
      fr: 'N’as-tu pas vu comment ton Seigneur a agi envers les gens de l’Éléphant ? N’a-t-Il pas rendu leur ruse complètement vaine ? Et envoyé sur eux des oiseaux par volées qui leur lançaient des pierres d’argile, et Il les a rendus semblables à une paille mâchée.',
      en: 'Have you not considered how your Lord dealt with the companions of the elephant? Did He not make their plan into misguidance? And He sent against them birds in flocks, striking them with stones of hard clay, and He made them like eaten straw.',
    },
    sesUrl: '/media/ses/sureler/fil.mp3',
  },
  {
    id: 'kureys',
    ad: { tr: 'Kureyş Sûresi', fr: 'Sourate Quraïsh', en: 'Surah Quraysh' },
    tur: 'sure',
    arapca: 'لِإِيلَافِ قُرَيْشٍ ﴿١﴾ إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ ﴿٢﴾ فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ ﴿٣﴾ الَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ ﴿٤﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Li-îlâfi kurayş. Îlâfihim rıhleteş-şitâi ves-sayf. Fel-ya’büdû rabbe hâzel-beyt. Ellezî et’amehüm min cû’ın ve âmenehüm min havf.',
    anlam: {
      tr: 'Kureyş’in güven ve uzlaşmasını sağladığı için; kış ve yaz yolculuklarında onları uzlaştırdığı için, onlar da bu Ev’in (Kâbe’nin) Rabbine kulluk etsinler; ki O, kendilerini açlıktan kurtarıp doyurdu ve her türlü korkudan emin kıldı.',
      fr: 'À cause du pacte des Quraysh, de leur pacte lors du voyage d’hiver et d’été ! Qu’ils adorent donc le Seigneur de cette Maison (la Kaaba), qui les a nourris contre la faim et rassurés de la peur !',
      en: 'For the accustomed security of the Quraysh—their accustomed security in the caravan of winter and summer—let them worship the Lord of this House, who has fed them against hunger and made them safe from fear.',
    },
    sesUrl: '/media/ses/sureler/kureys.mp3',
  },
  {
    id: 'maun',
    ad: { tr: 'Mâûn Sûresi', fr: 'Sourate Al-Ma’un', en: 'Surah Al-Maoon' },
    tur: 'sure',
    arapca: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ ﴿١﴾ فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ ﴿٢﴾ وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ ﴿٣﴾ فَوَيْلٌ لِّلْمُصَلِّينَ ﴿٤﴾ الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ ﴿٥﴾ الَّذِينَ هُمْ يُرَاءُونَ ﴿٦﴾ وَيَمْنَعُونَ الْمَاعُونَ ﴿٧﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. E-ra’eytellezî yükezzibü bid-dîn. Fe-zâlikellezî yedu’‘ul-yetîm. Ve lâ yehuddu ‘alâ ta’âmil-miskîn. Fe-veylün lil-müsallîn. Ellezîne hüm ‘an salâtihim sâhûn. Ellezîne hüm yürâûn. Ve yemne’ûnel-mâ’ûn.',
    anlam: {
      tr: 'Dini (hesap gününü) yalanlayanı gördün mü? İşte o, yetimi itip kakar, yoksulu doyurmayı teşvik etmez. Yazıklar olsun o namaz kılanlara ki, onlar namazlarını ciddiye almazlar; onlar gösteriş yaparlar ve en ufak bir yardıma bile engel olurlar.',
      fr: 'Vois-tu celui qui traite de mensonge la Rétribution ? C’est bien lui qui repousse l’orphelin, et qui n’encourage point à nourrir le pauvre. Malheur donc aux prieurs qui sont négligents dans leur prière, qui font preuve d’ostentation et refusent la moindre aide usuelle !',
      en: 'Have you seen the one who denies the Recompense? For that is the one who drives away the orphan and does not encourage the feeding of the poor. So woe to those who pray [but] who are heedless of their prayer—those who make a show of their deeds and withhold simple assistance.',
    },
    sesUrl: '/media/ses/sureler/maun.mp3',
  },
  {
    id: 'kevser',
    ad: { tr: 'Kevser Sûresi', fr: 'Sourate Al-Kawthar', en: 'Surah Al-Kawthar' },
    tur: 'sure',
    arapca: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ﴿١﴾ فَصَلِّ لِرَبِّكَ وَانْحَرْ ﴿٢﴾ إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ ﴿٣﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. İnnâ a’taynâkel-kevser. Fe-salli li-rabbike venhar. İnne şânieke hüvel-ebter.',
    anlam: {
      tr: 'Şüphesiz biz sana Kevser’i verdik. O hâlde Rabbin için namaz kıl ve kurban kes! Asıl sonu kesik olan, sana buğzedendir.',
      fr: 'Nous t’avons certes accordé l’Abondance (Al-Kawthar). Accomplis la prière pour ton Seigneur et sacrifie. Celui qui te hait sera certes sans postérité.',
      en: 'Indeed, We have granted you, [O Muhammad], al-Kawthar. So pray to your Lord and sacrifice [to Him alone]. Indeed, your enemy is the one cut off.',
    },
    sesUrl: '/media/ses/sureler/kevser.mp3',
  },
  {
    id: 'kafirun',
    ad: { tr: 'Kâfirûn Sûresi', fr: 'Sourate Al-Kafirun', en: 'Surah Al-Kafiroon' },
    tur: 'sure',
    arapca: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ ﴿١﴾ لَا أَعْبُدُ مَا تَعْبُدُونَ ﴿٢﴾ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ﴿٣﴾ وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ ﴿٤﴾ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ﴿٥﴾ لَكُمْ دِينُكُمْ وَلِيَ دِينِ ﴿٦﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Kul yâ eyyühel-kâfirûn. Lâ a’büdü mâ ta’büdûn. Ve lâ entüm ‘âbidûne mâ a’büd. Ve lâ ene ‘âbidüm-mâ ‘abedtüm. Ve lâ entüm ‘âbidûne mâ a’büd. Leküm dînüküm ve liye dîn.',
    anlam: {
      tr: 'De ki: Ey inkârcılar! Ben sizin taptıklarınıza tapmam. Siz de benim taptığıma tapacak değilsiniz. Ben de sizin taptıklarınıza tapacak değilim. Siz de benim taptığıma tapacak değilsiniz. Sizin dininiz size, benim dinim banadır.',
      fr: 'Dis : « Ô vous les infidèles ! Je n’adore pas ce que vous adorez. Et vous n’êtes pas adorateurs de ce que j’adore. Je ne suis pas adorateur de ce que vous adorez. Et vous n’êtes pas adorateurs de ce que j’adore. À vous votre religion, et à moi ma religion. »',
      en: 'Say: O disbelievers, I do not worship what you worship. Nor are you worshippers of what I worship. Nor will I be a worshipper of what you worship. Nor will you be worshippers of what I worship. For you is your religion, and for me is my religion.',
    },
    sesUrl: '/media/ses/sureler/kafirun.mp3',
  },
  {
    id: 'nasr',
    ad: { tr: 'Nasr Sûresi', fr: 'Sourate An-Nasr', en: 'Surah An-Nasr' },
    tur: 'sure',
    arapca: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ﴿١﴾ وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا ﴿٢﴾ فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا ﴿٣﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. İzâ câe nasrullâhi vel-feth. Ve ra’eyten-nâse yedhulûne fî dînillâhi efvâcâ. Fe-sebbih bi-hamdi rabbike vestağfirh, innehû kâne tevvâbâ.',
    anlam: {
      tr: 'Allah’ın yardımı ve zafer geldiği, insanların da dalga dalga Allah’ın dinine girdiklerini gördüğün zaman, hemen Rabbini överek tesbih et ve O’ndan bağışlanma dile. Şüphesiz O, tevbeleri çokça kabul edendir.',
      fr: 'Lorsque vient le secours d’Allah ainsi que la victoire, et que tu vois les gens entrer en foule dans la religion d’Allah, alors par la louange célèbre la gloire de ton Seigneur et implore Son pardon. Certes, Il est Grand Accueillant au repentir.',
      en: 'When the victory of Allah has come and the conquest, and you see the people entering into the religion of Allah in multitudes, then exalt [Him] with praise of your Lord and ask forgiveness of Him. Indeed, He is ever Accepting of repentance.',
    },
    sesUrl: '/media/ses/sureler/nasr.mp3',
  },
  {
    id: 'tebbet',
    ad: { tr: 'Tebbet Sûresi', fr: 'Sourate Al-Massad (Tabbat)', en: 'Surah Al-Masad' },
    tur: 'sure',
    arapca: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ ﴿١﴾ مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ ﴿٢﴾ سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ ﴿٣﴾ وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ ﴿٤﴾ فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ ﴿٥﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Tebbet yedâ ebî lehebiw-ve tebb. Mâ ağnâ ‘anhü mâlühû ve mâ keseb. Seyaslâ nâran zâte leheb. Vemraetühû hammâletel-hatab. Fî cîdihâ hablüm-mim-mesed.',
    anlam: {
      tr: 'Ebû Leheb’in iki eli kurusun; kurudu da! Malı da kazandıkları da ona fayda vermedi. O, alevli bir ateşe girecektir. Boynunda bükülmüş bir ip bulunan karısı da, odun taşıyıcı olarak oraya girecektir.',
      fr: 'Que périssent les deux mains d’Abû Lahab et que lui-même périsse ! Sa fortune ne lui a servi à rien, ni ce qu’il a acquis. Il brûlera dans un Feu plein de flammes, de même que sa femme, la porteuse de bois, avec à son cou une corde de fibres.',
      en: 'May the hands of Abu Lahab be ruined, and ruined is he. His wealth will not avail him or that which he gained. He will [enter to] burn in a Fire of [blazing] flame, and his wife [as well] - the carrier of firewood, around her neck is a rope of [twisted] fiber.',
    },
    sesUrl: '/media/ses/sureler/tebbet.mp3',
  },
  {
    id: 'ihlas',
    ad: { tr: 'İhlâs Sûresi', fr: 'Sourate Al-Ikhlas', en: 'Surah Al-Ikhlas' },
    tur: 'sure',
    arapca: 'قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Kul hüvallâhü ehad. Allâhüs-samed. Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.',
    anlam: {
      tr: 'De ki: O Allah tektir. Allah Samed’dir (her şey O’na muhtaç, O hiçbir şeye muhtaç değildir). O doğurmamış ve doğmamıştır. O’nun hiçbir dengi yoktur.',
      fr: 'Dis : « Il est Allah, Unique. Allah, Le Seul à être imploré pour ce que nous désirons. Il n’a jamais engendré, n’a pas été engendré non plus. Et nul n’est égal à Lui. »',
      en: 'Say: He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.',
    },
    sesUrl: '/media/ses/sureler/ihlas.mp3',
  },
  {
    id: 'felak',
    ad: { tr: 'Felak Sûresi', fr: 'Sourate Al-Falaq', en: 'Surah Al-Falaq' },
    tur: 'sure',
    arapca: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Kul e’ûzü bi-rabbil-felak. Min şerri mâ halak. Ve min şerri ğâsikın izâ vekab. Ve min şerrin-neffâsâti fil-’ukad. Ve min şerri hâsidin izâ hased.',
    anlam: {
      tr: 'De ki: Sabahın Rabbine sığınırım; yarattığı şeylerin şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfleyenlerin şerrinden ve haset ettiği zaman hasetçinin şerrinden.',
      fr: 'Dis : « Je cherche protection auprès du Seigneur de l’aube naissante, contre le mal des êtres qu’Il a créés, contre le mal de l’obscurité quand elle s’approfondit, contre le mal de celles qui soufflent sur les nœuds, et contre le mal de l’envieux quand il envie. »',
      en: 'Say: I seek refuge in the Lord of daybreak, from the evil of that which He created, and from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies.',
    },
    sesUrl: '/media/ses/sureler/felak.mp3',
  },
  {
    id: 'nas',
    ad: { tr: 'Nâs Sûresi', fr: 'Sourate An-Nas', en: 'Surah An-Nas' },
    tur: 'sure',
    arapca: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Kul e’ûzü bi-rabbin-nâs. Melikin-nâs. İlâhin-nâs. Min şerril-vesvâsil-hannâs. Ellezî yüvesvisü fî sudûrin-nâs. Minel-cinneti ven-nâs.',
    anlam: {
      tr: 'De ki: İnsanların Rabbine, insanların hükümdarına, insanların ilahına sığınırım; sinsi vesvesecinin şerrinden, insanların kalplerine vesvese verenin, gerek cinlerden gerekse insanlardan olanın şerrinden.',
      fr: 'Dis : « Je cherche protection auprès du Seigneur des hommes, le Roi des hommes, Dieu des hommes, contre le mal du mauvais conseiller furtif, qui souffle le mal dans les poitrines des hommes, qu’il soit parmi les djinns ou les hommes. »',
      en: 'Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer—who whispers into the breasts of mankind—from among the jinn and mankind.',
    },
    sesUrl: '/media/ses/sureler/nas.mp3',
  },
  {
    id: 'subhaneke',
    ad: { tr: 'Sübhâneke Duası', fr: 'Invocation Subhânaka', en: 'Subhanaka Prayer' },
    tur: 'dua',
    arapca: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ',
    okunus: 'Sübhânekellâhümme ve bi-hamdik, ve tebârakesmük, ve teâlâ ceddük, ve lâ ilâhe ğayrük.',
    anlam: {
      tr: 'Allah’ım! Sen her türlü eksiklikten uzaksın, seni hamdinle överim. Senin adın kutludur, şanın yücedir ve senden başka hiçbir ilah yoktur.',
      fr: 'Gloire et pureté à Toi, ô Allah, et à Toi la louange. Que Ton Nom soit béni, que Ta majesté soit exaltée, et il n’y a point d’autre divinité que Toi.',
      en: 'Glory be to You, O Allah, and with Your praise. Blessed is Your name, exalted is Your majesty, and there is no deity other than You.',
    },
    sesUrl: '/media/ses/dualar/subhaneke.mp3',
  },
  {
    id: 'tahiyyat',
    ad: { tr: 'Ettehiyyâtü (Tahiyyât)', fr: 'Invocation At-Tahiyyat', en: 'At-Tahiyyat Prayer' },
    tur: 'dua',
    arapca: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    okunus: 'Et-tahıyyâtü lillâhi ves-salevâtü vet-tayyibât. Es-selâmü aleyke eyyühen-nebiyyü ve rahmetullâhi ve berakâtüh. Es-selâmü aleynâ ve alâ ibâdillâhis-sâlihîn. Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
    anlam: {
      tr: 'Bütün dualar, övgüler, ibadetler ve temiz işler Allah’a mahsustur. Selam sana ey Peygamber! Allah’ın rahmeti ve bereketleri senin üzerine olsun. Selam bizim üzerimize ve Allah’ın salih kullarına olsun. Ben şahitlik ederim ki Allah’tan başka ilah yoktur ve yine şahitlik ederim ki Muhammed O’nun kulu ve elçisidir.',
      fr: 'Toutes les salutations, les prières et les bonnes œuvres sont pour Allah. Que la paix soit sur toi, ô Prophète, ainsi que la miséricorde d’Allah et Ses bénédictions. Que la paix soit sur nous et sur les vertueux serviteurs d’Allah. J’atteste qu’il n’y a point de divinité digne d’adoration en dehors d’Allah, et j’atteste que Muhammad est Son serviteur et Son messager.',
      en: 'All compliments, prayers and pure words are due to Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is His servant and His messenger.',
    },
    sesUrl: '/media/ses/dualar/tahiyyat.mp3',
  },
  {
    id: 'salli-barik',
    ad: { tr: 'Allâhümme Salli & Bârik', fr: 'Salutations sur le Prophète (Salli & Barik)', en: 'Allahumma Salli & Barik' },
    tur: 'dua',
    arapca: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ ۝ اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    okunus: 'Allâhümme salli alâ Muhammedin ve alâ âli Muhammed, kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd. Allâhümme bârik alâ Muhammedin ve alâ âli Muhammed, kemâ bârakte alâ İbrâhîme ve alâ âli İbrâhîm, inneke hamîdün mecîd.',
    anlam: {
      tr: 'Allah’ım! İbrâhim’e ve ailesine rahmet ettiğin gibi, Muhammed’e ve ailesine de rahmet eyle. Şüphesiz sen çok övülensin, şanı yüce olansın. Allah’ım! İbrâhim’e ve ailesine bereket verdiğin gibi, Muhammed’e ve ailesine de bereket ver. Şüphesiz sen çok övülensin, şanı yüce olansın.',
      fr: 'Ô Allah ! Prie sur Muhammad et sur la famille de Muhammad comme Tu as prié sur Ibrahim et sur la famille d’Ibrahim. Tu es certes Digne de louanges et Glorieux. Ô Allah ! Bénis Muhammad et la famille de Muhammad comme Tu as béni Ibrahim et la famille d’Ibrahim. Tu es certes Digne de louanges et Glorieux.',
      en: 'O Allah, bestow Your favor upon Muhammad and upon the family of Muhammad as You bestowed favor upon Abraham and upon the family of Abraham. Indeed, You are Praiseworthy and Glorious. O Allah, bless Muhammad and the family of Muhammad as You blessed Abraham and the family of Abraham. Indeed, You are Praiseworthy and Glorious.',
    },
    sesUrl: '/media/ses/dualar/sallibarik.mp3',
  },
  {
    id: 'rabbena',
    ad: { tr: 'Rabbenâ Âtinâ & Rabbenâğfirlî', fr: 'Invocations Rabbana', en: 'Rabbana Duas' },
    tur: 'dua',
    arapca: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ ۝ رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    okunus: 'Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâben-nâr. Rabbenâğfir lî ve li-vâlideyye ve lil-mü’minîne yevme yekûmül-hisâb.',
    anlam: {
      tr: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi cehennem azabından koru. Rabbimiz! Hesabın görüleceği gün beni, anne babamı ve bütün inananları bağışla.',
      fr: 'Seigneur ! Accorde-nous belle part ici-bas, et belle part aussi dans l’au-delà ; et protège-nous du châtiment du Feu ! Ô notre Seigneur ! Pardonne-moi, ainsi qu’à mes père et mère et aux croyants, le jour où s’élèvera le compte.',
      en: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire. Our Lord, forgive me and my parents and the believers the Day the account is established.',
    },
    sesUrl: '/media/ses/dualar/rabbena.mp3',
  },
];
