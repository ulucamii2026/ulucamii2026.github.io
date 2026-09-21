/** Seviye testi — sonuç metinleri (sonuç ekranı + katılımcı e-postası + hoca raporu ortak kullanır).
 *
 *  Sunucu paketi (`SeviyeTesti`) ve sayfa aynı metni okur; yalnız bu klasörden import edilir.
 *  Üslup: teşvik eden, yargılamayan; not ya da «yanlış» sözcüğü katılımcıya gösterilmez.
 */
import type { AlanKodu, Dil, ProgramOnerisi } from './tipler.ts';

export interface SonucMetinleri {
  alanAdlari: Record<AlanKodu, string>;
  /** Bilgi alanı düzeyleri 0–3. */
  duzeyAdlari: [string, string, string, string];
  /** Kur'an okuma düzeyi K0–K5, katılımcıya hitapla. */
  okumaDuzeyleri: [string, string, string, string, string, string];
  tecvidVar: string;
  atlandi: string;
  programlar: Record<ProgramOnerisi, { ad: string; aciklama: string }>;
  programGiris: string;
  programNot: string;
  sonraki: string;
  eposta: {
    konu: string;        // {ref}
    onIzleme: string;
    giris: string;       // hitap ve kapanış kurumsal şablondan (KIMLIK.yazisma) gelir
    kuranBaslik: string;
    alanBaslik: string;
    programBaslik: string;
    sonrakiBaslik: string;
    gizlilik: string;
    dugme: string;
  };
}

export const SONUC_METINLERI: Record<Dil, SonucMetinleri> = {
  tr: {
    alanAdlari: {
      okuma: 'Kur’an okuma',
      kuranBilgi: 'Kur’an bilgisi',
      itikat: 'İnanç esasları',
      namaz: 'Temizlik ve namaz',
      ibadet: 'Oruç, zekât, hac ve günlük hayat',
      siyer: 'Peygamberimizin hayatı',
      ahlak: 'Ahlak ve âdâb',
    },
    duzeyAdlari: ['Başlangıç', 'Temel', 'Orta', 'İleri'],
    okumaDuzeyleri: [
      'Arap harfleriyle yeni tanışacaksınız',
      'Harfleri tanıyorsunuz',
      'Harfleri kelime içinde tanıyorsunuz',
      'Harekeli heceleri okuyorsunuz',
      'Cezm, şedde, tenvin ve uzatmaları okuyorsunuz',
      'Kelime ve âyetleri okuyabiliyorsunuz',
    ],
    tecvidVar: 'Tecvid kavramlarını tanıyorsunuz.',
    atlandi: 'Bu bölümü şimdilik atladınız; birlikte baştan başlarız.',
    programlar: {
      A: { ad: 'İlk adımlar', aciklama: 'Temel inanç esasları, abdest ve namazın uygulamalı öğrenimi, Fâtiha ve kısa sûreler, Arap harfleriyle tanışma.' },
      B: { ad: 'Elifbâ ve temel ilmihal', aciklama: 'Harekeler ve okuma kurallarıyla Kur’an okumaya hazırlık; ibadet bilgilerinin pekiştirilmesi.' },
      C: { ad: 'Kur’an’a geçiş', aciklama: 'Kur’an’ı yüzünden okuma alıştırmaları; namaz ve diğer ibadetlerde eksik kalan konuların tamamlanması.' },
      D: { ad: 'Tecvid ve derinleşme', aciklama: 'Tecvidle okuma ve sûre ezberleri; tefsir, hadis ve siyer okumalarıyla derinleşme.' },
    },
    programGiris: 'Size önerebileceğimiz başlangıç noktası',
    programNot: 'Bu yalnızca bir öneridir; programınızı din görevlimizle yapacağınız görüşmede birlikte belirleyeceksiniz.',
    sonraki: 'Din görevlimiz sonucunuzu inceleyecek ve en geç bir hafta içinde sizinle iletişime geçecek.',
    eposta: {
      konu: 'Seviye tespit sonucunuz — {ref}',
      onIzleme: 'Testi tamamladığınız için teşekkür ederiz; sonucunuzun özeti içeride.',
      giris: 'Testi tamamladığınız için teşekkür ederiz. Bu bir sınav değildir; amacımız size en uygun eğitimi planlayabilmektir. Aşağıda sonucunuzun özetini bulabilirsiniz.',
      kuranBaslik: 'Kur’an-ı Kerim okuma',
      alanBaslik: 'Dinî bilgiler',
      programBaslik: 'Önerilen başlangıç',
      sonrakiBaslik: 'Bundan sonra',
      gizlilik: 'Yanıtlarınız yalnızca din görevlimiz tarafından görülür ve en fazla 24 ay saklanır. Verilerinizin silinmesini isterseniz bu e-postayı yanıtlamanız yeterlidir.',
      dugme: 'Gizlilik bilgilendirmesi',
    },
  },
  fr: {
    alanAdlari: {
      okuma: 'Lecture du Coran',
      kuranBilgi: 'Connaissance du Coran',
      itikat: 'Fondements de la foi',
      namaz: 'Purification et prière',
      ibadet: 'Jeûne, zakât, pèlerinage et vie quotidienne',
      siyer: 'Vie du Prophète',
      ahlak: 'Éthique et bonnes manières',
    },
    duzeyAdlari: ['Découverte', 'Bases', 'Intermédiaire', 'Avancé'],
    okumaDuzeyleri: [
      'Vous allez découvrir l’alphabet arabe',
      'Vous reconnaissez les lettres',
      'Vous reconnaissez les lettres à l’intérieur des mots',
      'Vous lisez les syllabes vocalisées',
      'Vous lisez le soukoun, la chadda, le tanwin et les prolongations',
      'Vous savez lire des mots et des versets',
    ],
    tecvidVar: 'Vous connaissez les notions de tajwid.',
    atlandi: 'Vous avez passé cette partie pour l’instant ; nous la commencerons ensemble depuis le début.',
    programlar: {
      A: { ad: 'Premiers pas', aciklama: 'Fondements de la foi, apprentissage pratique des ablutions et de la prière, al-Fatiha et sourates courtes, découverte de l’alphabet arabe.' },
      B: { ad: 'Alphabet et bases du culte', aciklama: 'Voyelles et règles de lecture pour se préparer à lire le Coran ; consolidation des connaissances sur le culte.' },
      C: { ad: 'Passage au Coran', aciklama: 'Exercices de lecture du Coran dans le texte ; compléments sur la prière et les autres actes de culte.' },
      D: { ad: 'Tajwid et approfondissement', aciklama: 'Lecture avec tajwid et mémorisation de sourates ; approfondissement par l’exégèse, le hadith et la vie du Prophète.' },
    },
    programGiris: 'Le point de départ que nous pouvons vous proposer',
    programNot: 'Il ne s’agit que d’une suggestion ; votre programme sera établi avec notre imam lors de votre entretien.',
    sonraki: 'Notre imam étudiera votre résultat et vous contactera au plus tard dans un délai d’une semaine.',
    eposta: {
      konu: 'Votre test de niveau — {ref}',
      onIzleme: 'Merci d’avoir complété le test ; vous trouverez ici le résumé de votre résultat.',
      giris: 'Merci d’avoir complété le test. Ce n’est pas un examen : notre but est de préparer la formation qui vous convient le mieux. Voici le résumé de votre résultat.',
      kuranBaslik: 'Lecture du Coran',
      alanBaslik: 'Connaissances religieuses',
      programBaslik: 'Point de départ suggéré',
      sonrakiBaslik: 'Et ensuite',
      gizlilik: 'Vos réponses ne sont consultées que par notre imam et sont conservées 24 mois au maximum. Si vous souhaitez leur suppression, il vous suffit de répondre à cet e-mail.',
      dugme: 'Information sur la vie privée',
    },
  },
  en: {
    alanAdlari: {
      okuma: 'Reading the Qur’an',
      kuranBilgi: 'Knowledge of the Qur’an',
      itikat: 'Foundations of faith',
      namaz: 'Purification and prayer',
      ibadet: 'Fasting, zakat, pilgrimage and daily life',
      siyer: 'Life of the Prophet',
      ahlak: 'Ethics and good manners',
    },
    duzeyAdlari: ['Starting out', 'Foundations', 'Intermediate', 'Advanced'],
    okumaDuzeyleri: [
      'You are about to discover the Arabic alphabet',
      'You recognise the letters',
      'You recognise the letters inside words',
      'You read vowelled syllables',
      'You read sukun, shadda, tanwin and lengthened vowels',
      'You can read words and verses',
    ],
    tecvidVar: 'You are familiar with the concepts of tajwid.',
    atlandi: 'You skipped this part for now; we will start it together from the beginning.',
    programlar: {
      A: { ad: 'First steps', aciklama: 'Foundations of faith, hands-on learning of ablution and prayer, al-Fatiha and short surahs, first contact with the Arabic alphabet.' },
      B: { ad: 'Alphabet and basics of worship', aciklama: 'Vowels and reading rules to prepare for reading the Qur’an; consolidating what you know about worship.' },
      C: { ad: 'Moving on to the Qur’an', aciklama: 'Practice in reading the Qur’an from the text; filling the gaps in prayer and other acts of worship.' },
      D: { ad: 'Tajwid and deeper study', aciklama: 'Reading with tajwid and memorising surahs; deeper study through exegesis, hadith and the life of the Prophet.' },
    },
    programGiris: 'The starting point we can suggest',
    programNot: 'This is only a suggestion; your programme will be decided together with our imam when you meet.',
    sonraki: 'Our imam will review your result and contact you within one week at the latest.',
    eposta: {
      konu: 'Your level assessment — {ref}',
      onIzleme: 'Thank you for completing the test; a summary of your result is inside.',
      giris: 'Thank you for completing the test. It is not an exam: our aim is to plan the teaching that suits you best. Below is a summary of your result.',
      kuranBaslik: 'Reading the Qur’an',
      alanBaslik: 'Religious knowledge',
      programBaslik: 'Suggested starting point',
      sonrakiBaslik: 'What happens next',
      gizlilik: 'Your answers are seen only by our imam and are kept for 24 months at most. If you would like them deleted, simply reply to this e-mail.',
      dugme: 'Privacy information',
    },
  },
  nl: {
    alanAdlari: {
      okuma: 'De Koran lezen',
      kuranBilgi: 'Kennis van de Koran',
      itikat: 'Grondslagen van het geloof',
      namaz: 'Reinheid en gebed',
      ibadet: 'Vasten, zakat, hadj en dagelijks leven',
      siyer: 'Leven van de Profeet',
      ahlak: 'Ethiek en omgangsvormen',
    },
    duzeyAdlari: ['Kennismaking', 'Basis', 'Halfgevorderd', 'Gevorderd'],
    okumaDuzeyleri: [
      'U maakt nu kennis met het Arabische alfabet',
      'U herkent de letters',
      'U herkent de letters in een woord',
      'U leest lettergrepen met klinkertekens',
      'U leest soekoen, sjadda, tanwien en verlengingen',
      'U kunt woorden en verzen lezen',
    ],
    tecvidVar: 'U kent de begrippen van de tadjwied.',
    atlandi: 'U hebt dit onderdeel voorlopig overgeslagen; we beginnen er samen aan, van bij het begin.',
    programlar: {
      A: { ad: 'Eerste stappen', aciklama: 'Grondslagen van het geloof, de wudu en het gebed in de praktijk leren, al-Fatiha en korte soera’s, kennismaking met het Arabische alfabet.' },
      B: { ad: 'Alfabet en basis van de eredienst', aciklama: 'Klinkertekens en leesregels als voorbereiding op het lezen van de Koran; steviger maken wat u al over de eredienst weet.' },
      C: { ad: 'Op weg naar de Koran', aciklama: 'Oefenen met het lezen van de Koran uit de tekst; aanvullen wat nog ontbreekt over het gebed en de overige vormen van eredienst.' },
      D: { ad: 'Tadjwied en verdieping', aciklama: 'Lezen met tadjwied en soera’s uit het hoofd leren; verdieping met de uitleg van verzen, hadith en het leven van de Profeet.' },
    },
    programGiris: 'Het beginpunt dat we u kunnen voorstellen',
    programNot: 'Dit is enkel een voorstel; uw programma wordt samen met onze imam vastgelegd tijdens uw gesprek.',
    sonraki: 'Onze imam bekijkt uw resultaat en neemt ten laatste binnen de week contact met u op.',
    eposta: {
      konu: 'Uw niveautest — {ref}',
      onIzleme: 'Bedankt voor het invullen van de test; hierin vindt u de samenvatting van uw resultaat.',
      giris: 'Bedankt voor het invullen van de test. Dit is geen examen: we willen de begeleiding voorbereiden die het best bij u past. Hieronder vindt u de samenvatting van uw resultaat.',
      kuranBaslik: 'De Koran lezen',
      alanBaslik: 'Religieuze kennis',
      programBaslik: 'Voorgesteld beginpunt',
      sonrakiBaslik: 'Hoe het verdergaat',
      gizlilik: 'Uw antwoorden worden alleen door onze imam bekeken en maximaal 24 maanden bewaard. Wilt u dat ze gewist worden, dan volstaat het op deze e-mail te antwoorden.',
      dugme: 'Privacyverklaring',
    },
  },
  de: {
    alanAdlari: {
      okuma: 'Den Koran lesen',
      kuranBilgi: 'Wissen über den Koran',
      itikat: 'Grundlagen des Glaubens',
      namaz: 'Reinheit und Gebet',
      ibadet: 'Fasten, Zakat, Hadsch und Alltag',
      siyer: 'Leben des Propheten',
      ahlak: 'Ethik und gute Umgangsformen',
    },
    duzeyAdlari: ['Einstieg', 'Grundlagen', 'Mittelstufe', 'Fortgeschritten'],
    okumaDuzeyleri: [
      'Sie lernen das arabische Alphabet gerade kennen',
      'Sie erkennen die Buchstaben',
      'Sie erkennen die Buchstaben im Wort',
      'Sie lesen Silben mit Vokalzeichen',
      'Sie lesen Sukun, Schadda, Tanwin und Dehnungen',
      'Sie können Wörter und Verse lesen',
    ],
    tecvidVar: 'Sie kennen die Begriffe des Tadschwid.',
    atlandi: 'Diesen Teil haben Sie vorerst übersprungen; wir beginnen ihn gemeinsam von vorn.',
    programlar: {
      A: { ad: 'Erste Schritte', aciklama: 'Glaubensgrundlagen, Wudu und Gebet praktisch lernen, al-Fatiha und kurze Suren, erste Begegnung mit dem arabischen Alphabet.' },
      B: { ad: 'Alphabet und Grundlagen des Gottesdienstes', aciklama: 'Vokalzeichen und Leseregeln als Vorbereitung auf das Koranlesen; Festigung dessen, was Sie über den Gottesdienst wissen.' },
      C: { ad: 'Übergang zum Koran', aciklama: 'Übungen im Lesen des Korans aus dem Text; Ergänzung dessen, was beim Gebet und bei den weiteren gottesdienstlichen Handlungen noch fehlt.' },
      D: { ad: 'Tadschwid und Vertiefung', aciklama: 'Lesen mit Tadschwid und Auswendiglernen von Suren; Vertiefung durch Koranauslegung, Hadith und das Leben des Propheten.' },
    },
    programGiris: 'Der Startpunkt, den wir Ihnen vorschlagen können',
    programNot: 'Das ist nur ein Vorschlag; Ihr Programm legen Sie gemeinsam mit unserem Imam in Ihrem Gespräch fest.',
    sonraki: 'Unser Imam sieht sich Ihr Ergebnis an und meldet sich spätestens innerhalb einer Woche bei Ihnen.',
    eposta: {
      konu: 'Ihr Einstufungstest — {ref}',
      onIzleme: 'Danke, dass Sie den Test ausgefüllt haben; die Zusammenfassung Ihres Ergebnisses finden Sie hier.',
      giris: 'Danke, dass Sie den Test ausgefüllt haben. Es ist keine Prüfung: Wir möchten den Unterricht planen, der am besten zu Ihnen passt. Unten finden Sie die Zusammenfassung Ihres Ergebnisses.',
      kuranBaslik: 'Den Koran lesen',
      alanBaslik: 'Religiöses Wissen',
      programBaslik: 'Vorgeschlagener Startpunkt',
      sonrakiBaslik: 'Wie es weitergeht',
      gizlilik: 'Ihre Antworten werden nur von unserem Imam eingesehen und höchstens 24 Monate aufbewahrt. Wenn Sie deren Löschung wünschen, genügt eine Antwort auf diese E-Mail.',
      dugme: 'Datenschutzhinweise',
    },
  },
};
