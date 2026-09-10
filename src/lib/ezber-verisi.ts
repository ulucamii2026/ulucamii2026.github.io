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
    arapca: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Elhamdü lillâhi rabbil-âlemîn. Er-rahmânir-rahîm. Mâliki yevmid-dîn. İyyâke na’büdü ve iyyâke neste’în. İhdinas-sırâtal-müstekîm. Sırâtallezîne en’amte aleyhim, ğayril-mağdûbi aleyhim veled-dâllîn.',
    anlam: {
      tr: 'Rahmân ve Rahîm olan Allah’ın adıyla. Hamd, âlemlerin Rabbi Allah’a mahsustur. O, Rahmân ve Rahîmdir. Ceza ve hesap gününün mâlikidir. Yalnız sana ibadet eder, yalnız senden yardım dileriz. Bizi doğru yola ilet; kendilerine lütufta bulunduğun kimselerin yoluna; gazaba uğramışların ve sapmışların yoluna değil.',
      fr: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Louange à Allah, Seigneur de l’univers. Le Tout Miséricordieux, le Très Miséricordieux, Maître du Jour de la rétribution. C’est Toi seul que nous adorons, et c’est Toi seul dont nous implorons le secours. Guide-nous dans le droit chemin, le chemin de ceux que Tu as comblés de bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
      en: 'In the name of Allah, the Entirely Merciful, the Especially Merciful. All praise is due to Allah, Lord of the worlds. The Entirely Merciful, the Especially Merciful, Sovereign of the Day of Recompense. It is You we worship and You we ask for help. Guide us to the straight path—the path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.',
    },
    sesUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3',
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
    sesUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
  },
  {
    id: 'ihlas',
    ad: { tr: 'İhlâs Sûresi', fr: 'Sourate Al-Ikhlas', en: 'Surah Al-Ikhlas' },
    tur: 'sure',
    arapca: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Kul hüvallâhü ehad. Allâhüs-samed. Lem yelid ve lem yûled. Ve lem yekün lehû küfüven ehad.',
    anlam: {
      tr: 'De ki: O Allah tektir. Allah Samed’dir (her şey O’na muhtaç, O hiçbir şeye muhtaç değildir). O doğurmamış ve doğmamıştır. O’nun hiçbir dengi yoktur.',
      fr: 'Dis : « Il est Allah, Unique. Allah, Le Seul à être imploré pour ce que nous désirons. Il n’a jamais engendré, n’a pas été engendré non plus. Et nul n’est égal à Lui. »',
      en: 'Say: He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.',
    },
    sesUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/112.mp3',
  },
  {
    id: 'felak',
    ad: { tr: 'Felak Sûresi', fr: 'Sourate Al-Falaq', en: 'Surah Al-Falaq' },
    tur: 'sure',
    arapca: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Kul e’ûzü bi-rabbil-felak. Min şerri mâ halak. Ve min şerri ğâsikın izâ vekab. Ve min şerrin-neffâsâti fil-’ukad. Ve min şerri hâsidin izâ hased.',
    anlam: {
      tr: 'De ki: Sabahın Rabbine sığınırım; yarattığı şeylerin şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfleyenlerin şerrinden ve haset ettiği zaman hasetçinin şerrinden.',
      fr: 'Dis : « Je cherche protection auprès du Seigneur de l’aube naissante, contre le mal des êtres qu’Il a créés, contre le mal de l’obscurité quand elle s’approfondit, contre le mal de celles qui soufflent sur les nœuds, et contre le mal de l’envieux quand il envie. »',
      en: 'Say: I seek refuge in the Lord of daybreak, from the evil of that which He created, and from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies.',
    },
    sesUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/113.mp3',
  },
  {
    id: 'nas',
    ad: { tr: 'Nâs Sûresi', fr: 'Sourate An-Nas', en: 'Surah An-Nas' },
    tur: 'sure',
    arapca: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. Kul e’ûzü bi-rabbin-nâs. Melikin-nâs. İlâhin-nâs. Min şerril-vesvâsil-hannâs. Ellezî yüvesvisü fî sudûrin-nâs. Minel-cinneti ven-nâs.',
    anlam: {
      tr: 'De ki: İnsanların Rabbine, insanların hükümdarına, insanların ilahına sığınırım; sinsi vesvesecinin şerrinden, insanların kalplerine vesvese verenin, gerek cinlerden gerekse insanlardan olanın şerrinden.',
      fr: 'Dis : « Je cherche protection auprès du Seigneur des hommes, le Roi des hommes, Dieu des hommes, contre le mal du mauvais conseiller furtif, qui souffle le mal dans les poitrines des hommes, qu’il soit parmi les djinns ou les hommes. »',
      en: 'Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer—who whispers into the breasts of mankind—from among the jinn and mankind.',
    },
    sesUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/114.mp3',
  },
  {
    id: 'kevser',
    ad: { tr: 'Kevser Sûresi', fr: 'Sourate Al-Kawthar', en: 'Surah Al-Kawthar' },
    tur: 'sure',
    arapca: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ﴿١﴾ فَصَلِّ لِرَبِّكَ وَانْحَرْ ﴿٢﴾ إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ ﴿٣﴾',
    okunus: 'Bismillâhir-rahmânir-rahîm. İnnâ a’taynâkel-kevser. Fe-salli li-rabbike venhar. İnne şânieke hüvel-ebter.',
    anlam: {
      tr: 'Şüphesiz biz sana Kevser’i verdik. O hâlde Rabbin için namaz kıl ve kurban kes! Asıl sonu kesik olan, sana buğzedendir.',
      fr: 'Nous t’avons certes accordé l’Abondance (Al-Kawthar). Accomplis la prière pour ton Seigneur et sacrifie. Celui qui te hait sera certes sans postérité.',
      en: 'Indeed, We have granted you, [O Muhammad], al-Kawthar. So pray to your Lord and sacrifice [to Him alone]. Indeed, your enemy is the one cut off.',
    },
    sesUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/108.mp3',
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
    sesUrl: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
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
    sesUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
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
    sesUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
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
    sesUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
  },
];
