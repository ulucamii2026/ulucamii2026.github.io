/** Seviye testi soru bankası — beyan (içerik yazımı sürüyor; docs/SEVIYE-TESTI.md kılavuzu).
 *
 *  Öz beyan maddeleri puanlanmaz; hoca raporunda katılımcının kendi anlatımı olarak yer alır.
 *  Seçenekler «henüz» diliyle, yargılamadan, en alt düzeyden en üste doğru sıralanmıştır.
 */
import type { BeyanMaddesi } from '../tipler.ts';

export const BEYAN: BeyanMaddesi[] = [
  // ——— Kur’an okuma beyanı ———
  {
    id: 'by01',
    kume: 'okuma',
    soru: {
      tr: "Kur’an-ı Kerim’i Arapça aslından (yüzünden) okuyabiliyor musunuz?",
      fr: "Arrivez-vous à lire le Coran directement dans le texte arabe ?",
      en: "Can you read the Qur’an directly from the Arabic text?",
    },
    secenekler: [
      { tr: 'Henüz okuyamıyorum', fr: 'Pas encore', en: 'Not yet' },
      {
        tr: 'Harfleri tanıyorum ama birleştiremiyorum',
        fr: "Je reconnais les lettres, mais je n’arrive pas à les relier",
        en: 'I recognise the letters but cannot join them yet',
      },
      { tr: 'Heceleyerek okuyorum', fr: 'Je lis en syllabant', en: 'I read syllable by syllable' },
      { tr: 'Yavaş yavaş okuyorum', fr: 'Je lis lentement, mais je lis', en: 'I read slowly, but I do read' },
      { tr: 'Akıcı okuyorum', fr: 'Je lis couramment', en: 'I read fluently' },
      {
        tr: 'Tecvid kurallarına dikkat ederek okuyorum',
        fr: 'Je lis en appliquant les règles du tajwîd',
        en: 'I read applying the rules of tajwid',
      },
    ],
  },
  {
    id: 'by02',
    kume: 'okuma',
    soru: {
      tr: "Arap harflerini ve Kur’an okumayı nerede öğrendiniz?",
      fr: "Où avez-vous appris les lettres arabes et la lecture du Coran ?",
      en: "Where did you learn the Arabic letters and Qur’an reading?",
    },
    secenekler: [
      { tr: 'Henüz öğrenmedim', fr: "Je ne l’ai pas encore appris", en: 'I have not learnt it yet' },
      {
        tr: 'Kendi kendime: internet, uygulama ya da kitapla',
        fr: 'Seul(e) : internet, application ou livre',
        en: 'On my own: internet, an app or a book',
      },
      { tr: 'Ailemden ya da bir arkadaşımdan', fr: "Auprès de ma famille ou d’un(e) ami(e)", en: 'From my family or a friend' },
      { tr: "Camide ya da Kur’an kursunda", fr: 'À la mosquée ou dans un cours de Coran', en: "At the mosque or in a Qur’an course" },
      { tr: 'Okulda ya da üniversitede', fr: "À l’école ou à l’université", en: 'At school or university' },
    ],
  },
  {
    id: 'by03',
    kume: 'okuma',
    soru: {
      tr: 'Namazda okuduğunuz sûre ve duaları nereden okuyorsunuz?',
      fr: "Les sourates et les invocations que vous récitez dans la prière, d’où les lisez-vous ?",
      en: 'Where do you read the sûrahs and supplications you recite in prayer from?',
    },
    secenekler: [
      { tr: 'Henüz okuyamıyorum', fr: 'Je ne les récite pas encore', en: 'I cannot recite them yet' },
      { tr: 'Latin harfleriyle yazılmış metinden', fr: 'Dans un texte transcrit en lettres latines', en: 'From a text written in Latin letters' },
      {
        tr: 'Ezberimden; Arapça yazıyı okuyamıyorum',
        fr: "De mémoire ; je ne lis pas l’écriture arabe",
        en: 'From memory; I cannot read the Arabic script',
      },
      { tr: 'Arapça yazıdan ve ezberimden', fr: "De l’écriture arabe et de mémoire", en: 'From the Arabic script and from memory' },
    ],
  },

  // ——— Uygulama öz beyanı ———
  {
    id: 'by04',
    kume: 'uygulama',
    soru: {
      tr: 'Abdest almayı ne kadar biliyorsunuz?',
      fr: 'Savez-vous faire les ablutions (woudou) ?',
      en: 'Do you know how to perform the ablution (wudu)?',
    },
    secenekler: [
      { tr: 'Henüz öğrenmedim', fr: 'Pas encore', en: 'Not yet' },
      { tr: 'Biliyorum ama sırasından emin değilim', fr: "Je connais, mais je ne suis pas sûr(e) de l’ordre", en: 'I know it, but I am not sure of the order' },
      { tr: 'Yardım alarak alıyorum', fr: "Je les fais avec de l’aide", en: 'I do it with help' },
      { tr: 'Kendi başıma rahatça alıyorum', fr: 'Je les fais seul(e), sans difficulté', en: 'I do it on my own, with ease' },
    ],
  },
  {
    id: 'by05',
    kume: 'uygulama',
    soru: {
      tr: 'Boy abdesti (gusül) hakkında ne kadar bilgilisiniz?',
      fr: 'Que savez-vous de la grande ablution (ghousl) ?',
      en: 'How much do you know about the full ablution (ghusl)?',
    },
    secenekler: [
      { tr: 'Henüz öğrenmedim', fr: 'Pas encore', en: 'Not yet' },
      { tr: 'Duydum ama ayrıntısını bilmiyorum', fr: "J’en ai entendu parler, sans en connaître les détails", en: 'I have heard of it but do not know the details' },
      { tr: 'Genel hatlarıyla biliyorum', fr: 'Je le connais dans les grandes lignes', en: 'I know it broadly' },
      { tr: 'Nasıl ve ne zaman gerektiğini rahatça biliyorum', fr: "Je sais sans difficulté comment et quand il est nécessaire", en: 'I know clearly how and when it is needed' },
    ],
  },
  {
    id: 'by06',
    kume: 'uygulama',
    soru: {
      tr: 'Beş vakit namazı tek başınıza kılabiliyor musunuz?',
      fr: 'Arrivez-vous à accomplir seul(e) les cinq prières quotidiennes (salât) ?',
      en: 'Can you perform the five daily prayers (salah) on your own?',
    },
    secenekler: [
      { tr: 'Henüz kılamıyorum', fr: 'Pas encore', en: 'Not yet' },
      { tr: 'Birine bakarak ya da yardım alarak kılıyorum', fr: "Je les fais en suivant quelqu’un ou avec de l’aide", en: 'I follow someone else or need help' },
      { tr: 'Bazı vakitleri kendi başıma kılıyorum', fr: 'Je fais certaines prières seul(e)', en: 'I perform some of the prayers on my own' },
      { tr: 'Bütün vakitleri kendi başıma rahatça kılıyorum', fr: 'Je fais toutes les prières seul(e), sans difficulté', en: 'I perform all of them on my own, with ease' },
    ],
  },
  {
    id: 'by07',
    kume: 'uygulama',
    soru: {
      tr: 'Namaz vakitlerini takip ediyor musunuz?',
      fr: 'Suivez-vous les horaires de prière ?',
      en: 'Do you follow the prayer times?',
    },
    secenekler: [
      { tr: 'Henüz takip etmiyorum', fr: 'Pas encore', en: 'Not yet' },
      { tr: 'Ara sıra bakıyorum', fr: 'Je les regarde de temps en temps', en: 'I check them now and then' },
      { tr: 'Çoğu gün takip ediyorum', fr: 'Je les suis la plupart des jours', en: 'I follow them most days' },
      { tr: 'Her gün düzenli takip ediyorum', fr: 'Je les suis chaque jour, régulièrement', en: 'I follow them every day, regularly' },
    ],
  },
  {
    id: 'by08',
    kume: 'uygulama',
    soru: {
      tr: 'Cemaatle namaza ve cuma namazına katılıyor musunuz?',
      fr: "Participez-vous à la prière en commun et à la prière du vendredi (djoumou’a) ?",
      en: "Do you attend congregational prayer and the Friday prayer (jumu’ah)?",
    },
    secenekler: [
      { tr: 'Henüz katılmadım', fr: 'Pas encore', en: 'Not yet' },
      { tr: 'Bir iki kez katıldım', fr: "J’y ai participé une ou deux fois", en: 'I have attended once or twice' },
      { tr: 'Ara sıra katılıyorum', fr: "J’y participe de temps en temps", en: 'I attend now and then' },
      { tr: 'Cuma namazına düzenli katılıyorum', fr: 'Je participe régulièrement à la prière du vendredi', en: 'I attend the Friday prayer regularly' },
      {
        tr: 'Hem cuma namazına hem vakit namazlarına cemaatle katılıyorum',
        fr: 'Je participe à la prière du vendredi et aux prières quotidiennes en commun',
        en: 'I attend both the Friday prayer and the daily prayers in congregation',
      },
    ],
  },
  {
    id: 'by09',
    kume: 'uygulama',
    soru: {
      tr: 'Ramazan orucu tecrübeniz nedir?',
      fr: 'Quelle est votre expérience du jeûne du ramadan ?',
      en: 'What is your experience of fasting in Ramadan?',
    },
    secenekler: [
      { tr: 'Henüz oruç tutmadım', fr: "Je n’ai pas encore jeûné", en: 'I have not fasted yet' },
      { tr: 'Birkaç gün tuttum', fr: "J’ai jeûné quelques jours", en: 'I have fasted a few days' },
      { tr: "Ramazan’ın bir bölümünü tuttum", fr: "J’ai jeûné une partie du ramadan", en: 'I have fasted part of Ramadan' },
      { tr: "Bir Ramazan’ı baştan sona tuttum", fr: "J’ai jeûné un ramadan en entier", en: 'I have fasted a whole Ramadan' },
      { tr: 'Her yıl Ramazan orucunu tutuyorum', fr: 'Je jeûne le ramadan chaque année', en: 'I fast Ramadan every year' },
    ],
  },
  {
    id: 'by10',
    kume: 'uygulama',
    soru: {
      tr: 'Dua etme alışkanlığınız nasıl?',
      fr: "Comment décririez-vous votre habitude d’invoquer Dieu (du’â) ?",
      en: "How would you describe your habit of supplication (du’a)?",
    },
    secenekler: [
      { tr: 'Henüz nasıl dua edeceğimi bilmiyorum', fr: 'Je ne sais pas encore comment faire', en: 'I do not know how yet' },
      { tr: 'Kendi dilimde, içimden geldiği gibi dua ediyorum', fr: 'Je prie dans ma propre langue, avec mes mots', en: 'I pray in my own language, in my own words' },
      { tr: 'Ezberimdeki kısa duaları okuyorum', fr: 'Je récite les courtes invocations que je connais par cœur', en: 'I recite the short supplications I know by heart' },
      { tr: 'Günlük duaları düzenli olarak okuyorum', fr: 'Je récite régulièrement les invocations quotidiennes', en: 'I recite the daily supplications regularly' },
    ],
  },
  {
    id: 'by11',
    kume: 'uygulama',
    soru: {
      tr: 'Helal gıda konusunda kendinizi ne kadar bilgili hissediyorsunuz?',
      fr: "Dans quelle mesure vous sentez-vous informé(e) au sujet de l’alimentation halal ?",
      en: 'How informed do you feel about halal food?',
    },
    secenekler: [
      { tr: 'Henüz bilgim yok', fr: 'Pas encore informé(e)', en: 'Not informed yet' },
      { tr: 'Temelini biliyorum, ayrıntılarda zorlanıyorum', fr: 'Je connais les bases, les détails me posent problème', en: 'I know the basics but struggle with the details' },
      { tr: 'Alışverişte etiketlere bakacak kadar biliyorum', fr: "J’en sais assez pour lire les étiquettes en faisant mes courses", en: 'I know enough to check labels when shopping' },
      { tr: 'Rahatım; başkasına da anlatabilirim', fr: "Je suis à l’aise et je peux l’expliquer à quelqu’un d’autre", en: 'I feel at ease and could explain it to someone else' },
    ],
  },
  {
    id: 'by12',
    kume: 'uygulama',
    soru: {
      tr: 'Camiye ne sıklıkla geliyorsunuz?',
      fr: 'À quelle fréquence venez-vous à la mosquée ?',
      en: 'How often do you come to the mosque?',
    },
    secenekler: [
      { tr: 'Henüz gelmedim', fr: 'Pas encore venu(e)', en: 'I have not come yet' },
      { tr: 'Yılda birkaç kez', fr: 'Quelques fois par an', en: 'A few times a year' },
      { tr: 'Ayda birkaç kez', fr: 'Quelques fois par mois', en: 'A few times a month' },
      { tr: 'Haftada en az bir kez', fr: 'Au moins une fois par semaine', en: 'At least once a week' },
      { tr: 'Hemen her gün', fr: 'Presque tous les jours', en: 'Almost every day' },
    ],
  },
  {
    id: 'by13',
    kume: 'uygulama',
    soru: {
      tr: 'Sizin için en verimli öğrenme biçimi hangisi?',
      fr: "Quelle façon d’apprendre vous convient le mieux ?",
      en: 'Which way of learning suits you best?',
    },
    secenekler: [
      { tr: 'Okuyarak', fr: 'En lisant', en: 'By reading' },
      { tr: 'Dinleyerek ve izleyerek', fr: 'En écoutant et en regardant', en: 'By listening and watching' },
      { tr: 'Uygulayarak, birlikte yaparak', fr: 'En pratiquant, en faisant ensemble', en: 'By practising, doing it together' },
      { tr: 'Birebir soru-cevapla', fr: 'En posant des questions en tête-à-tête', en: 'Through one-to-one questions and answers' },
    ],
  },
];
