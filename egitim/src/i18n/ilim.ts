/**
 * İlim Yolu ana sayfası, üst/alt bilgi ve kilim paneli metinleri (2 Kasım 2026). Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md).
 * Türkçe «siz» (Rıdvan, 2 Kas 2026; taslak egitim/docs/taslaklar/ilim-yolu/c); Fransızca «vous», Hollandaca «u», Almanca «Sie» (egitim'in öbür sayfalarıyla
 * aynı). Marka adı: İlim Yolu · Chemin du savoir · Path of Knowledge · Weg van kennis · Weg des Wissens; «Ezber Kilimi» adlı bir bölüm olarak kalır.
 * Fransızca metin kaynakta düz boşlukla yazılır; `ilimMetinleri('fr')` `fransizTipografi` ile ince/bölünmez boşluk koyar (istemciye giden
 * metinler de buradan geçtiği için `data-veri` içinde doğru gelir).
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export interface IlimMetinleri {
  marka: string;
  markaAlt: string;
  /** Sekme başlığı son eki ve `og:site_name`. */
  siteAdi: string;
  menuAna: string;
  menuEzber: string;
  giris: string;
  kayit: string;
  hesabim: string;
  hesabimAd: (ad: string) => string;
  altTanitim: string;
  iletisimEtiketi: string;

  // Ziyaretçi ana sayfası
  aciklama: string;
  kapakUst: string;
  vaat: string;
  hesapsizBaslik: string;
  hesapsizMetin: string;
  hesapsizBasla: string;
  yollarUst: string;
  yollarBaslik: string;
  yollarMetin: string;
  yolaBak: string;
  hazirlaniyor: string;
  yolEzberAd: string;
  yolEzberRozet: (n: number) => string;
  yolEzberMetin: string;
  yolKursAd: string;
  yolKursRozet: string;
  yolKursMetin: string;
  yolSeviyeAd: string;
  yolSeviyeRozet: string;
  alanlar: readonly string[];
  yolYeniAd: string;
  yolYeniRozet: string;
  yolYeniMetin: string;
  nasilUst: string;
  nasilBaslik: string;
  adimlar: readonly (readonly [string, string])[];
  guvenler: readonly (readonly [string, string])[];
  kursBaslik: string;
  kursMetin: string;
  kursDugme: string;
  kapakKilimAd: string;

  // Giriş yapmış ana sayfa
  selam: string;
  selamAd: (ad: string) => string;
  baslikTekrar: (n: number) => string;
  baslikYok: string;
  baslikBos: string;
  yolun: string;
  tekrarBaslik: string;
  tekrarEk: string;
  tekrarBos: string;
  tekrarAlt: string;
  tekrarla: string;
  kaldiginBaslik: string;
  kaldiginSon: (tarih: string) => string;
  kaldiginBos: string;
  devamEt: string;
  kilimBaslik: string;
  kilimGit: string;
  kilimBos: string;
  yollarimBaslik: string;
  yollarimUst: string;
  ezbereGit: string;
  yolDurumEzber: (n: number) => string;
  yolDurumYok: string;
  cikis: string;

  // Çocuk / kurs kaydına bağlı hesap: hocanın kaydı + kendi çalışması aynı kilimde
  hocaBaslik: string;
  hocaAciklama: string;
  hocaYok: string;
  hocaSeritler: string;
  hocaSon: string;
  hocaYuklenemedi: string;
  birlesikBaslik: string;
  birlesikOzet: (n: number) => string;
}

const ILIM: Record<Dil, IlimMetinleri> = {
  tr: {
    marka: 'İlim Yolu',
    markaAlt: 'Ulu Camii · Marche-en-Famenne',
    siteAdi: 'İlim Yolu',
    menuAna: 'Ana sayfa',
    menuEzber: 'Ezber Kilimi',
    giris: 'Giriş yapın',
    kayit: 'Hesap açın',
    hesabim: 'Hesabım',
    hesabimAd: (ad) => `Hesabım: @${ad}`,
    altTanitim: 'Marche-en-Famenne Ulu Camii’nin eğitim platformu: Ezber Kilimi, kurs bilgileri ve daha fazlası.',
    iletisimEtiketi: 'İletişim',
    aciklama: 'İlim Yolu: Kur’an’ı, namazı ve dininizi adım adım öğrenin. Diyanet metni ve sesiyle, kendi hızınızda, beş dilde. Ulu Camii, Marche-en-Famenne.',
    kapakUst: 'Marche-en-Famenne Ulu Camii’nin eğitim platformu',
    vaat: 'Kur’an’ı, namazı ve dininizi adım adım öğrenin. Diyanet metni ve sesiyle, kendi hızınızda, beş dilde.',
    hesapsizBaslik: 'Hesapsız da çalışır.',
    hesapsizMetin: 'İlerlemeniz bu cihazda kalır. Hesap açarsanız her cihazda sizinle gelir.',
    hesapsizBasla: 'Hesapsız başlayın',
    yollarUst: 'Dört yol, tek hesap',
    yollarBaslik: 'Her yol bir kilim gibi dokunur',
    yollarMetin: 'Çocuk da büyük de aynı yolda yürür. Nereden başlayacağınızı siz seçersiniz.',
    yolaBak: 'Yola bakın',
    hazirlaniyor: 'Hazırlanıyor',
    yolEzberAd: 'Ezber Kilimi',
    yolEzberRozet: (n) => `${n} madde`,
    yolEzberMetin: 'Namaz sûrelerinden Amme cüzüne; Diyanet metni ve sesiyle dinleyin, tekrarlayın, hocanıza okuyun.',
    yolKursAd: 'Kurs bilgileri',
    yolKursRozet: 'Yıllık plan konuları',
    yolKursMetin: 'Kur’an kursunun konuları; her biri bir kart ve kısa bir mini soru.',
    yolSeviyeAd: 'Seviye yolu',
    yolSeviyeRozet: '7 alan',
    alanlar: ['Kur’an okuma', 'Kur’an bilgisi', 'İman', 'Namaz', 'Diğer ibadetler', 'Siyer', 'Ahlak'],
    yolYeniAd: 'Yeni Müslüman yolu',
    yolYeniRozet: '8 adım · 12 hafta',
    yolYeniMetin: '«İlk Adımlar»: iman, abdest ve namazla sakin, adım adım bir başlangıç.',
    nasilUst: 'Üç adım',
    nasilBaslik: 'Nasıl ilerlersiniz?',
    adimlar: [
      ['Yolunuzu seçin', 'Ezber, kurs konuları, seviye ya da yeni Müslüman yolu.'],
      ['Dinleyin, tekrarlayın', 'Diyanet sesiyle dinleyin, kendinizi sınayın; tekrar gününüz gelince madde “Bugün tekrar” listenizde görünür.'],
      ['Kiliminizi dokuyun', 'Çalıştıkça kiliminiz alttan yukarı dokunur; ezberinizi hocanıza okuyun.'],
    ],
    guvenler: [
      ['Tek kaynak Diyanet', 'Kur’an metni, meâl ve sesler Diyanet İşleri Başkanlığı’ndan.'],
      ['Herkes kendi yolunda', 'Sıralama, puan ya da yarış yok.'],
      ['Beş dil', 'Türkçe, Français, English, Nederlands, Deutsch.'],
    ],
    kursBaslik: 'Kur’an kursu öğrencisi misiniz?',
    kursMetin: 'Hocanızdan aldığınız kullanıcı adı ve kısa şifreyle ya da kare kodlu kartınızla girin.',
    kursDugme: 'Kodla girin',
    kapakKilimAd: 'Süs: basamaklı göz ve yıldız motifli kilim',
    selam: 'Hoş geldiniz',
    selamAd: (ad) => `Hoş geldiniz, @${ad}`,
    baslikTekrar: (n) => (n === 1 ? 'Bugün 1 tekrar sizi bekliyor' : `Bugün ${n} tekrar sizi bekliyor`),
    baslikYok: 'Bugün için bekleyen tekrar yok',
    baslikBos: 'Bugün ne çalışmak istersiniz?',
    yolun: 'Yolunuz:',
    tekrarBaslik: 'Bugün tekrar',
    tekrarEk: 'Acele yok; kendi hızınızda',
    tekrarBos: 'Bugün tekrar günü olan madde yok. İsterseniz yeni bir şey çalışabilirsiniz.',
    tekrarAlt: 'Ezber Kilimi · tekrar günü geldi',
    tekrarla: 'Tekrarlayın',
    kaldiginBaslik: 'Kaldığınız yer',
    kaldiginSon: (t) => `Son çalışma: ${t}`,
    kaldiginBos: 'Henüz bir ezbere başlamadınız.',
    devamEt: 'Devam edin',
    kilimBaslik: 'Kiliminiz',
    kilimGit: 'Kilimime gidin',
    kilimBos: 'Çalışmaya başladıkça kiliminiz alttan yukarı dokunur.',
    yollarimBaslik: 'Yollarınız',
    yollarimUst: 'Dört yol, tek hesap',
    ezbereGit: 'Ezber Kilimi’ne gidin',
    yolDurumEzber: (n) => `${n} madde kiliminize dokundu`,
    yolDurumYok: 'Henüz başlamadınız',
    cikis: 'Çıkış yapın',
    hocaBaslik: 'Hocanın kilimi',
    hocaAciklama: 'Hocanın verdiği basamak dolgudur; kendi çalışmanız üstüne yeşil dokuyla biner.',
    hocaYok: 'Hocanın kaydı şu an alınamadı. Kendi çalışmanızı gösteriyoruz.',
    hocaSeritler: 'Şerit şerit hocanın kaydı',
    hocaSon: 'Hocanın son notları',
    hocaYuklenemedi: 'Hocanın kaydı yüklenemedi.',
    birlesikBaslik: 'Ezber Kilimi · hocanın kaydı ve kendi çalışmanız',
    birlesikOzet: (n) => `Kendi çalışmanızla ${n} metne başladınız.`,
  },
  fr: {
    marka: 'Chemin du savoir',
    markaAlt: 'Ulu Camii · Marche-en-Famenne',
    siteAdi: 'Chemin du savoir',
    menuAna: 'Accueil',
    menuEzber: 'Kilim de mémorisation',
    giris: 'Se connecter',
    kayit: 'Créer un compte',
    hesabim: 'Mon compte',
    hesabimAd: (ad) => `Mon compte : @${ad}`,
    altTanitim: 'La plateforme d’apprentissage de la mosquée Ulu Camii de Marche-en-Famenne : kilim de mémorisation, contenus du cours et bien plus.',
    iletisimEtiketi: 'Contact',
    aciklama: 'Chemin du savoir : apprenez pas à pas le Coran, la prière et votre religion, avec le texte et la voix de la Diyanet, à votre rythme, en cinq langues. Ulu Camii, Marche-en-Famenne.',
    kapakUst: 'La plateforme d’apprentissage de la mosquée Ulu Camii de Marche-en-Famenne',
    vaat: 'Apprenez pas à pas le Coran, la prière et votre religion. Avec le texte et la voix de la Diyanet, à votre rythme, en cinq langues.',
    hesapsizBaslik: 'Cela marche aussi sans compte.',
    hesapsizMetin: 'Votre progression reste sur cet appareil. Avec un compte, elle vous suit sur tous vos appareils.',
    hesapsizBasla: 'Commencer sans compte',
    yollarUst: 'Quatre chemins, un seul compte',
    yollarBaslik: 'Chaque chemin se tisse comme un kilim',
    yollarMetin: 'Enfants et adultes avancent sur le même chemin. Vous choisissez par où commencer.',
    yolaBak: 'Voir le chemin',
    hazirlaniyor: 'En préparation',
    yolEzberAd: 'Kilim de mémorisation',
    yolEzberRozet: (n) => `${n} contenus`,
    yolEzberMetin: 'Des sourates de la prière au juz’ Amma : écoutez avec le texte et la voix de la Diyanet, répétez, récitez à votre enseignant.',
    yolKursAd: 'Contenus du cours',
    yolKursRozet: 'Thèmes du plan annuel',
    yolKursMetin: 'Les thèmes du cours de Coran ; chacun avec une fiche et une courte question.',
    yolSeviyeAd: 'Chemin par niveau',
    yolSeviyeRozet: '7 domaines',
    alanlar: ['Lecture du Coran', 'Connaissance du Coran', 'Foi', 'Prière', 'Autres actes d’adoration', 'Biographie du Prophète', 'Éthique'],
    yolYeniAd: 'Chemin des nouveaux musulmans',
    yolYeniRozet: '8 étapes · 12 semaines',
    yolYeniMetin: '« Premiers pas » : la foi, les ablutions et la prière, un début serein, pas à pas.',
    nasilUst: 'Trois étapes',
    nasilBaslik: 'Comment avancer ?',
    adimlar: [
      ['Choisissez votre chemin', 'Mémorisation, thèmes du cours, niveau ou chemin des nouveaux musulmans.'],
      ['Écoutez, répétez', 'Écoutez avec la voix de la Diyanet, testez-vous ; le jour de la révision, le contenu apparaît dans « À réviser aujourd’hui ».'],
      ['Tissez votre kilim', 'À chaque séance, votre kilim se tisse de bas en haut ; récitez votre mémorisation à votre enseignant.'],
    ],
    guvenler: [
      ['Une seule source : la Diyanet', 'Texte du Coran, traduction et récitations de la Présidence des affaires religieuses.'],
      ['Chacun à son rythme', 'Ni classement, ni points, ni concours.'],
      ['Cinq langues', 'Türkçe, Français, English, Nederlands, Deutsch.'],
    ],
    kursBaslik: 'Vous suivez le cours de Coran ?',
    kursMetin: 'Connectez-vous avec le nom d’utilisateur et le mot de passe court donnés par l’enseignant, ou avec votre carte à code QR.',
    kursDugme: 'Entrer avec un code',
    kapakKilimAd: 'Décor : kilim à motifs d’œil et d’étoile en gradins',
    selam: 'Bienvenue',
    selamAd: (ad) => `Bienvenue, @${ad}`,
    baslikTekrar: (n) => (n === 1 ? '1 révision vous attend aujourd’hui' : `${n} révisions vous attendent aujourd’hui`),
    baslikYok: 'Aucune révision prévue aujourd’hui',
    baslikBos: 'Que souhaitez-vous travailler aujourd’hui ?',
    yolun: 'Votre chemin :',
    tekrarBaslik: 'À réviser aujourd’hui',
    tekrarEk: 'Pas de hâte ; à votre rythme',
    tekrarBos: 'Aucun contenu à réviser aujourd’hui. Vous pouvez travailler quelque chose de nouveau.',
    tekrarAlt: 'Kilim de mémorisation · jour de révision',
    tekrarla: 'Réviser',
    kaldiginBaslik: 'Là où vous en étiez',
    kaldiginSon: (t) => `Dernier travail : ${t}`,
    kaldiginBos: 'Vous n’avez pas encore commencé de mémorisation.',
    devamEt: 'Continuer',
    kilimBaslik: 'Votre kilim',
    kilimGit: 'Voir mon kilim',
    kilimBos: 'Votre kilim se tisse de bas en haut au fil de votre travail.',
    yollarimBaslik: 'Vos chemins',
    yollarimUst: 'Quatre chemins, un seul compte',
    ezbereGit: 'Aller au kilim de mémorisation',
    yolDurumEzber: (n) => `${n} contenus tissés dans votre kilim`,
    yolDurumYok: 'Pas encore commencé',
    cikis: 'Se déconnecter',
    hocaBaslik: 'Le kilim de l’enseignant',
    hocaAciklama: 'L’étape donnée par l’enseignant forme le fond ; votre propre travail s’y superpose en vert.',
    hocaYok: 'Le relevé de l’enseignant n’a pas pu être chargé. Voici votre propre travail.',
    hocaSeritler: 'Le relevé de l’enseignant, bande par bande',
    hocaSon: 'Dernières notes de l’enseignant',
    hocaYuklenemedi: 'Le relevé de l’enseignant n’a pas pu être chargé.',
    birlesikBaslik: 'Kilim de mémorisation · relevé de l’enseignant et votre travail',
    birlesikOzet: (n) => `Avec votre propre travail, vous avez commencé ${n} textes.`,
  },
  en: {
    marka: 'Path of Knowledge',
    markaAlt: 'Ulu Camii · Marche-en-Famenne',
    siteAdi: 'Path of Knowledge',
    menuAna: 'Home',
    menuEzber: 'Memorisation kilim',
    giris: 'Sign in',
    kayit: 'Create account',
    hesabim: 'My account',
    hesabimAd: (ad) => `My account: @${ad}`,
    altTanitim: 'The learning platform of Ulu Camii in Marche-en-Famenne: the memorisation kilim, course topics and more.',
    iletisimEtiketi: 'Contact',
    aciklama: 'Path of Knowledge: learn the Quran, prayer and your faith step by step, with the Diyanet text and recitation, at your own pace, in five languages. Ulu Camii, Marche-en-Famenne.',
    kapakUst: 'The learning platform of Ulu Camii in Marche-en-Famenne',
    vaat: 'Learn the Quran, prayer and your faith step by step. With the Diyanet text and recitation, at your own pace, in five languages.',
    hesapsizBaslik: 'It works without an account too.',
    hesapsizMetin: 'Your progress stays on this device. With an account it follows you to every device.',
    hesapsizBasla: 'Start without an account',
    yollarUst: 'Four paths, one account',
    yollarBaslik: 'Every path is woven like a kilim',
    yollarMetin: 'Children and adults walk the same path. You choose where to begin.',
    yolaBak: 'See the path',
    hazirlaniyor: 'In preparation',
    yolEzberAd: 'Memorisation kilim',
    yolEzberRozet: (n) => `${n} texts`,
    yolEzberMetin: 'From the prayer surahs to the Amma juz’: listen with the Diyanet text and recitation, repeat, and recite to your teacher.',
    yolKursAd: 'Course topics',
    yolKursRozet: 'Topics of the yearly plan',
    yolKursMetin: 'The topics of the Quran course; each with a card and a short quiz question.',
    yolSeviyeAd: 'Level path',
    yolSeviyeRozet: '7 areas',
    alanlar: ['Quran reading', 'Knowledge of the Quran', 'Faith', 'Prayer', 'Other acts of worship', 'The Prophet’s life', 'Ethics'],
    yolYeniAd: 'New Muslim path',
    yolYeniRozet: '8 steps · 12 weeks',
    yolYeniMetin: '“First Steps”: faith, ablution and prayer, a calm beginning, step by step.',
    nasilUst: 'Three steps',
    nasilBaslik: 'How do you move forward?',
    adimlar: [
      ['Choose your path', 'Memorisation, course topics, level or the new Muslim path.'],
      ['Listen, repeat', 'Listen with the Diyanet recitation and test yourself; when a review day comes, the item appears in “Review today”.'],
      ['Weave your kilim', 'Your kilim is woven from the bottom up as you practise; recite your memorisation to your teacher.'],
    ],
    guvenler: [
      ['One source: the Diyanet', 'Quran text, translation and recitations from the Presidency of Religious Affairs.'],
      ['Everyone on their own path', 'No ranking, no points, no competition.'],
      ['Five languages', 'Türkçe, Français, English, Nederlands, Deutsch.'],
    ],
    kursBaslik: 'Are you a Quran course student?',
    kursMetin: 'Sign in with the username and short password from your teacher, or with your card with a QR code.',
    kursDugme: 'Sign in with a code',
    kapakKilimAd: 'Decoration: a kilim with stepped eye and star motifs',
    selam: 'Welcome',
    selamAd: (ad) => `Welcome, @${ad}`,
    baslikTekrar: (n) => (n === 1 ? '1 review is waiting for you today' : `${n} reviews are waiting for you today`),
    baslikYok: 'Nothing to review today',
    baslikBos: 'What would you like to practise today?',
    yolun: 'Your path:',
    tekrarBaslik: 'Review today',
    tekrarEk: 'No rush; at your own pace',
    tekrarBos: 'Nothing is due for review today. You can practise something new.',
    tekrarAlt: 'Memorisation kilim · review day',
    tekrarla: 'Review',
    kaldiginBaslik: 'Where you left off',
    kaldiginSon: (t) => `Last practised: ${t}`,
    kaldiginBos: 'You have not started a text yet.',
    devamEt: 'Continue',
    kilimBaslik: 'Your kilim',
    kilimGit: 'Go to my kilim',
    kilimBos: 'Your kilim is woven from the bottom up as you practise.',
    yollarimBaslik: 'Your paths',
    yollarimUst: 'Four paths, one account',
    ezbereGit: 'Go to the memorisation kilim',
    yolDurumEzber: (n) => `${n} texts woven into your kilim`,
    yolDurumYok: 'Not started yet',
    cikis: 'Sign out',
    hocaBaslik: 'The teacher’s kilim',
    hocaAciklama: 'The stage your teacher gave is the fill; your own practice is woven on top in green.',
    hocaYok: 'The teacher’s record could not be loaded. Showing your own practice.',
    hocaSeritler: 'The teacher’s record, band by band',
    hocaSon: 'Latest notes from your teacher',
    hocaYuklenemedi: 'The teacher’s record could not be loaded.',
    birlesikBaslik: 'Memorisation kilim · teacher’s record and your own practice',
    birlesikOzet: (n) => `With your own practice you have started ${n} texts.`,
  },
  nl: {
    marka: 'Weg van kennis',
    markaAlt: 'Ulu Camii · Marche-en-Famenne',
    siteAdi: 'Weg van kennis',
    menuAna: 'Home',
    menuEzber: 'Memorisatiekelim',
    giris: 'Inloggen',
    kayit: 'Account maken',
    hesabim: 'Mijn account',
    hesabimAd: (ad) => `Mijn account: @${ad}`,
    altTanitim: 'Het leerplatform van Ulu Camii in Marche-en-Famenne: de memorisatiekelim, lesonderwerpen en meer.',
    iletisimEtiketi: 'Contact',
    aciklama: 'Weg van kennis: leer stap voor stap de Koran, het gebed en uw geloof, met de tekst en de recitatie van de Diyanet, in uw eigen tempo, in vijf talen. Ulu Camii, Marche-en-Famenne.',
    kapakUst: 'Het leerplatform van Ulu Camii in Marche-en-Famenne',
    vaat: 'Leer stap voor stap de Koran, het gebed en uw geloof. Met de tekst en de recitatie van de Diyanet, in uw eigen tempo, in vijf talen.',
    hesapsizBaslik: 'Het werkt ook zonder account.',
    hesapsizMetin: 'Uw voortgang blijft op dit apparaat. Met een account volgt hij u op elk apparaat.',
    hesapsizBasla: 'Zonder account beginnen',
    yollarUst: 'Vier wegen, één account',
    yollarBaslik: 'Elke weg wordt geweven als een kelim',
    yollarMetin: 'Kinderen en volwassenen lopen dezelfde weg. U kiest waar u begint.',
    yolaBak: 'Bekijk de weg',
    hazirlaniyor: 'In voorbereiding',
    yolEzberAd: 'Memorisatiekelim',
    yolEzberRozet: (n) => `${n} onderdelen`,
    yolEzberMetin: 'Van de gebedssoera’s tot de juz’ Amma: luister met de tekst en de recitatie van de Diyanet, herhaal en draag voor aan uw leerkracht.',
    yolKursAd: 'Lesonderwerpen',
    yolKursRozet: 'Onderwerpen van het jaarplan',
    yolKursMetin: 'De onderwerpen van de Koranles; elk met een kaart en een korte vraag.',
    yolSeviyeAd: 'Niveauweg',
    yolSeviyeRozet: '7 gebieden',
    alanlar: ['Koranlezen', 'Kennis van de Koran', 'Geloof', 'Gebed', 'Andere vormen van aanbidding', 'Het leven van de Profeet', 'Ethiek'],
    yolYeniAd: 'Weg voor nieuwe moslims',
    yolYeniRozet: '8 stappen · 12 weken',
    yolYeniMetin: '“Eerste stappen”: geloof, wassing en gebed, een rustig begin, stap voor stap.',
    nasilUst: 'Drie stappen',
    nasilBaslik: 'Hoe gaat u vooruit?',
    adimlar: [
      ['Kies uw weg', 'Memorisatie, lesonderwerpen, niveau of de weg voor nieuwe moslims.'],
      ['Luister, herhaal', 'Luister met de recitatie van de Diyanet en toets uzelf; op de herhaaldag verschijnt het onderdeel in “Vandaag herhalen”.'],
      ['Weef uw kelim', 'Uw kelim wordt van onder naar boven geweven terwijl u oefent; draag uw memorisatie voor aan uw leerkracht.'],
    ],
    guvenler: [
      ['Eén bron: de Diyanet', 'Korantekst, vertaling en recitaties van het Directoraat voor Religieuze Zaken.'],
      ['Ieder op zijn eigen weg', 'Geen ranglijst, geen punten, geen wedstrijd.'],
      ['Vijf talen', 'Türkçe, Français, English, Nederlands, Deutsch.'],
    ],
    kursBaslik: 'Volgt u de Koranles?',
    kursMetin: 'Log in met de gebruikersnaam en het korte wachtwoord van uw leerkracht, of met uw kaart met QR-code.',
    kursDugme: 'Inloggen met een code',
    kapakKilimAd: 'Versiering: een kelim met getrapte oog- en sterpatronen',
    selam: 'Welkom',
    selamAd: (ad) => `Welkom, @${ad}`,
    baslikTekrar: (n) => (n === 1 ? 'Vandaag wacht 1 herhaling op u' : `Vandaag wachten ${n} herhalingen op u`),
    baslikYok: 'Vandaag niets te herhalen',
    baslikBos: 'Wat wilt u vandaag oefenen?',
    yolun: 'Uw weg:',
    tekrarBaslik: 'Vandaag herhalen',
    tekrarEk: 'Geen haast; in uw eigen tempo',
    tekrarBos: 'Vandaag is er niets te herhalen. U kunt iets nieuws oefenen.',
    tekrarAlt: 'Memorisatiekelim · herhaaldag',
    tekrarla: 'Herhalen',
    kaldiginBaslik: 'Waar u gebleven was',
    kaldiginSon: (t) => `Laatst geoefend: ${t}`,
    kaldiginBos: 'U bent nog niet aan een tekst begonnen.',
    devamEt: 'Verdergaan',
    kilimBaslik: 'Uw kelim',
    kilimGit: 'Naar mijn kelim',
    kilimBos: 'Uw kelim wordt van onder naar boven geweven terwijl u oefent.',
    yollarimBaslik: 'Uw wegen',
    yollarimUst: 'Vier wegen, één account',
    ezbereGit: 'Naar de memorisatiekelim',
    yolDurumEzber: (n) => `${n} onderdelen in uw kelim geweven`,
    yolDurumYok: 'Nog niet begonnen',
    cikis: 'Uitloggen',
    hocaBaslik: 'De kelim van de leerkracht',
    hocaAciklama: 'De stap die uw leerkracht gaf is de vulling; uw eigen oefening wordt er in het groen overheen geweven.',
    hocaYok: 'De gegevens van de leerkracht konden niet worden geladen. Hier is uw eigen oefening.',
    hocaSeritler: 'De gegevens van de leerkracht, band per band',
    hocaSon: 'Laatste opmerkingen van de leerkracht',
    hocaYuklenemedi: 'De gegevens van de leerkracht konden niet worden geladen.',
    birlesikBaslik: 'Memorisatiekelim · gegevens van de leerkracht en uw eigen oefening',
    birlesikOzet: (n) => `Met uw eigen oefening bent u aan ${n} teksten begonnen.`,
  },
  de: {
    marka: 'Weg des Wissens',
    markaAlt: 'Ulu Camii · Marche-en-Famenne',
    siteAdi: 'Weg des Wissens',
    menuAna: 'Startseite',
    menuEzber: 'Memorier-Kelim',
    giris: 'Anmelden',
    kayit: 'Konto erstellen',
    hesabim: 'Mein Konto',
    hesabimAd: (ad) => `Mein Konto: @${ad}`,
    altTanitim: 'Die Lernplattform der Ulu Camii in Marche-en-Famenne: Memorier-Kelim, Kursthemen und mehr.',
    iletisimEtiketi: 'Kontakt',
    aciklama: 'Weg des Wissens: Lernen Sie Schritt für Schritt Koran, Gebet und Ihren Glauben, mit Text und Rezitation der Diyanet, in Ihrem eigenen Tempo, in fünf Sprachen. Ulu Camii, Marche-en-Famenne.',
    kapakUst: 'Die Lernplattform der Ulu Camii in Marche-en-Famenne',
    vaat: 'Lernen Sie Schritt für Schritt Koran, Gebet und Ihren Glauben. Mit Text und Rezitation der Diyanet, in Ihrem eigenen Tempo, in fünf Sprachen.',
    hesapsizBaslik: 'Es geht auch ohne Konto.',
    hesapsizMetin: 'Ihr Fortschritt bleibt auf diesem Gerät. Mit einem Konto begleitet er Sie auf jedes Gerät.',
    hesapsizBasla: 'Ohne Konto beginnen',
    yollarUst: 'Vier Wege, ein Konto',
    yollarBaslik: 'Jeder Weg wird wie ein Kelim gewebt',
    yollarMetin: 'Kinder und Erwachsene gehen denselben Weg. Sie wählen, wo Sie beginnen.',
    yolaBak: 'Weg ansehen',
    hazirlaniyor: 'In Vorbereitung',
    yolEzberAd: 'Memorier-Kelim',
    yolEzberRozet: (n) => `${n} Inhalte`,
    yolEzberMetin: 'Von den Gebetssuren bis zum Juz’ Amma: hören Sie mit Text und Rezitation der Diyanet zu, wiederholen Sie und tragen Sie Ihrer Lehrkraft vor.',
    yolKursAd: 'Kursthemen',
    yolKursRozet: 'Themen des Jahresplans',
    yolKursMetin: 'Die Themen des Koran-Kurses; jedes mit einer Karte und einer kurzen Frage.',
    yolSeviyeAd: 'Stufenweg',
    yolSeviyeRozet: '7 Bereiche',
    alanlar: ['Koranlesen', 'Koranwissen', 'Glaube', 'Gebet', 'Weitere Gottesdienste', 'Leben des Propheten', 'Ethik'],
    yolYeniAd: 'Weg für neue Muslime',
    yolYeniRozet: '8 Schritte · 12 Wochen',
    yolYeniMetin: '„Erste Schritte“: Glaube, Waschung und Gebet, ein ruhiger Anfang, Schritt für Schritt.',
    nasilUst: 'Drei Schritte',
    nasilBaslik: 'Wie kommen Sie voran?',
    adimlar: [
      ['Wählen Sie Ihren Weg', 'Memorieren, Kursthemen, Stufe oder der Weg für neue Muslime.'],
      ['Hören, wiederholen', 'Hören Sie mit der Rezitation der Diyanet zu und prüfen Sie sich; am Wiederholungstag erscheint der Inhalt unter „Heute wiederholen“.'],
      ['Weben Sie Ihren Kelim', 'Beim Üben wird Ihr Kelim von unten nach oben gewebt; tragen Sie Ihrer Lehrkraft Ihr Memoriertes vor.'],
    ],
    guvenler: [
      ['Eine Quelle: die Diyanet', 'Korantext, Übersetzung und Rezitationen der Präsidentschaft für Religiöse Angelegenheiten.'],
      ['Jeder auf seinem Weg', 'Keine Rangliste, keine Punkte, kein Wettbewerb.'],
      ['Fünf Sprachen', 'Türkçe, Français, English, Nederlands, Deutsch.'],
    ],
    kursBaslik: 'Besuchen Sie den Koran-Kurs?',
    kursMetin: 'Melden Sie sich mit dem Benutzernamen und dem kurzen Passwort Ihrer Lehrkraft an oder mit Ihrer Karte mit QR-Code.',
    kursDugme: 'Mit Code anmelden',
    kapakKilimAd: 'Zierde: ein Kelim mit gestuften Augen- und Sternmotiven',
    selam: 'Willkommen',
    selamAd: (ad) => `Willkommen, @${ad}`,
    baslikTekrar: (n) => (n === 1 ? 'Heute wartet 1 Wiederholung auf Sie' : `Heute warten ${n} Wiederholungen auf Sie`),
    baslikYok: 'Heute ist nichts zu wiederholen',
    baslikBos: 'Was möchten Sie heute üben?',
    yolun: 'Ihr Weg:',
    tekrarBaslik: 'Heute wiederholen',
    tekrarEk: 'Keine Eile; in Ihrem Tempo',
    tekrarBos: 'Heute ist nichts zu wiederholen. Sie können etwas Neues üben.',
    tekrarAlt: 'Memorier-Kelim · Wiederholungstag',
    tekrarla: 'Wiederholen',
    kaldiginBaslik: 'Hier waren Sie stehen geblieben',
    kaldiginSon: (t) => `Zuletzt geübt: ${t}`,
    kaldiginBos: 'Sie haben noch keinen Text begonnen.',
    devamEt: 'Weiter',
    kilimBaslik: 'Ihr Kelim',
    kilimGit: 'Zu meinem Kelim',
    kilimBos: 'Ihr Kelim wird beim Üben von unten nach oben gewebt.',
    yollarimBaslik: 'Ihre Wege',
    yollarimUst: 'Vier Wege, ein Konto',
    ezbereGit: 'Zum Memorier-Kelim',
    yolDurumEzber: (n) => `${n} Inhalte in Ihren Kelim gewebt`,
    yolDurumYok: 'Noch nicht begonnen',
    cikis: 'Abmelden',
    hocaBaslik: 'Der Kelim der Lehrkraft',
    hocaAciklama: 'Die von der Lehrkraft vergebene Stufe ist die Füllung; Ihr eigenes Üben wird in Grün darübergewebt.',
    hocaYok: 'Der Stand der Lehrkraft konnte nicht geladen werden. Hier ist Ihr eigenes Üben.',
    hocaSeritler: 'Der Stand der Lehrkraft, Streifen für Streifen',
    hocaSon: 'Letzte Hinweise der Lehrkraft',
    hocaYuklenemedi: 'Der Stand der Lehrkraft konnte nicht geladen werden.',
    birlesikBaslik: 'Memorier-Kelim · Stand der Lehrkraft und Ihr eigenes Üben',
    birlesikOzet: (n) => `Mit Ihrem eigenen Üben haben Sie ${n} Texte begonnen.`,
  },
};

function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (typeof deger === 'function') return ((...a: unknown[]) => fransizca((deger as (...b: unknown[]) => unknown)(...a))) as T;
  if (Array.isArray(deger)) return deger.map((x) => fransizca(x)) as T;
  return deger;
}
const HAZIR: Record<Dil, IlimMetinleri> = {
  ...ILIM,
  fr: Object.fromEntries(Object.entries(ILIM.fr).map(([k, v]) => [k, fransizca(v)])) as unknown as IlimMetinleri,
};

export const ilimMetinleri = (dil: Dil): IlimMetinleri => HAZIR[dil];
