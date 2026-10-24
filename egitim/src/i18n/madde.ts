/**
 * Madde sayfası metinleri (Faz 2b, 19 Ekim 2026; onaylı taslak egitim/docs/taslaklar/madde.html). Fransız tipografisi
 * derlemede middleware'den gelir. «Namazda nerede okunur» cümleleri Diyanet İlmihali I, «Namazın Kılınışı»
 * (s. 262–264) esas alınarak yazıldı; kaynak satırı sayfada basılır.
 */
import type { Dil } from '@ortak/i18n/ui';

export type Durus = 'kiyam' | 'ruku' | 'secde' | 'kade';
export const DURUSLAR: readonly Durus[] = ['kiyam', 'ruku', 'secde', 'kade'];

interface MaddeMetinleri {
  yol: string; ayet: (n: number) => string; metinBaslik: string; metinBaslikYalniz: string; okunusGoster: string;
  ayetiDinle: (n: number) => string; dokun: string;
  mealYok: string; metinYok: string;
  kunyeAr: string; kunyeMeal: string; gruplama: (g: string) => string; mealInceleme: string; okunusUsulu: string;
  yolBaslik: string; adimlar: readonly { ad: string; metin: string; hazir: boolean }[]; yakinda: string;
  hocaBaslik: string; hocaMetin: string; veliBag: string;
  namazBaslik: string; durus: Record<Durus, string>; namazKaynak: string;
  onceki: string; sonraki: string; seriteDon: string;
  /** Kur'an dışı maddeler (dualar): başlık, künye, anlamsız dil, hoca onayı bekleniyor, dikkat edilecek yerler. */
  metinBaslikDua: string; kunyeKaynak: (ar: string, anlam?: string) => string; anlamYok: string; onayBekliyor: string; zorBaslik: string;
}

const METINLER: Record<Dil, MaddeMetinleri> = {
  tr: {
    yol: 'Bulunduğunuz yer', ayet: (n) => `${n} âyet`, metinBaslik: 'Metin ve meâl', metinBaslikYalniz: 'Metin', okunusGoster: 'Okunuşu göster',
    ayetiDinle: (n) => `${n}. âyeti dinle`, dokun: 'Bir âyete dokunursanız o âyet çalar.',
    mealYok: 'Bu dilde meâl yakında eklenecek.', metinYok: 'Bu maddenin metni hazırlanıyor. Şimdilik dinleyerek çalışabilirsiniz.',
    kunyeAr: 'Arapça metin: Diyanet İşleri Başkanlığı, kuran.diyanet.gov.tr.',
    kunyeMeal: 'Meâl: Diyanet İşleri Başkanlığı Meâli, kuran.diyanet.gov.tr.',
    gruplama: (g) => `Meâl, Diyanet’in gruplamasıyla verilir (${g}).`,
    mealInceleme: 'Bu meâl çeviridir; gözden geçirilecek.', okunusUsulu: 'Okunuş Türkçe usulüdür ve hoca tarafından gözden geçirildi.',
    yolBaslik: 'Nasıl çalışılır',
    adimlar: [
      { ad: 'Dinle', metin: 'Her âyeti Diyanet okuyuşuyla en az üç kez dinleyin, sonra sesli tekrar edin.', hazir: true },
      { ad: 'Yüzünden oku', metin: 'Metne bakarak okuyun; isterseniz sesle birlikte takip edin.', hazir: true },
      { ad: 'Bağlayarak ezberle', metin: 'Âyetleri birer birer ekleyerek zincir kurun.', hazir: true },
      { ad: 'Kademeli gizle', metin: 'Kelimeler adım adım gizlenir; ilk harften hatırlayın.', hazir: true },
      { ad: 'Kendini sına', metin: 'Sırala, eksik kelimeyi bul; tekrar gününü gör.', hazir: false },
    ],
    yakinda: 'Yakında',
    hocaBaslik: 'Hazır olunca hocana oku',
    hocaMetin: 'Ezberin basamağını hoca verir. Evdeki çalışma basamağı değiştirmez; hazır olunca derste hocana oku.',
    veliBag: 'Velilerin portalında çocuğun basamağı görünür',
    namazBaslik: 'Namazda nerede okunur', durus: { kiyam: 'Kıyam', ruku: 'Rükû', secde: 'Secde', kade: 'Oturuş' },
    namazKaynak: 'Kaynak: Diyanet İlmihali I, «Namazın Kılınışı».',
    onceki: 'Önceki madde', sonraki: 'Sonraki madde', seriteDon: 'Şeride dön',
    metinBaslikDua: 'Metin ve anlam', kunyeKaynak: (ar, an) => `Arapça metin: ${ar}.${an ? ` Türkçe anlam: ${an}.` : ""}`,
    anlamYok: 'Bu dilde anlam yakında eklenecek.', onayBekliyor: 'Metin Diyanet kaynaklarından alınmıştır. Hoca incelemesi bekleniyor.', zorBaslik: 'Dikkat edilecek yerler',
  },
  fr: {
    yol: 'Vous êtes ici', ayet: (n) => `${n} versets`, metinBaslik: 'Texte et traduction du sens', metinBaslikYalniz: 'Texte', okunusGoster: 'Afficher la translittération',
    ayetiDinle: (n) => `Écouter le verset ${n}`, dokun: 'Touchez un verset pour l’écouter.',
    mealYok: 'La traduction française du sens (Le Noble Coran, Diyanet) sera bientôt ajoutée.',
    metinYok: 'Le texte de ce contenu est en préparation. Vous pouvez déjà l’apprendre à l’écoute.',
    kunyeAr: 'Texte arabe : Présidence des Affaires religieuses de Turquie (Diyanet), kuran.diyanet.gov.tr.',
    kunyeMeal: 'Traduction du sens : Mohammed Chiadmi, « Le Noble Coran », Diyanet, 2022.',
    gruplama: (g) => `La traduction suit le regroupement des versets de la Diyanet (${g}).`,
    mealInceleme: 'Cette traduction sera relue.', okunusUsulu: 'Translittération française, relue par l’enseignant.',
    yolBaslik: 'Comment apprendre',
    adimlar: [
      { ad: 'Écouter', metin: 'Écoutez chaque verset au moins trois fois dans la récitation de la Diyanet, puis répétez à voix haute.', hazir: true },
      { ad: 'Lire sur le texte', metin: 'Lisez en suivant le texte, avec la récitation si vous le souhaitez.', hazir: true },
      { ad: 'Enchaîner', metin: 'Ajoutez les versets un par un pour former une chaîne.', hazir: true },
      { ad: 'Masquer peu à peu', metin: 'Les mots disparaissent étape par étape ; retrouvez-les grâce à la première lettre.', hazir: true },
      { ad: 'Se tester', metin: 'Remettez dans l’ordre, retrouvez le mot manquant, puis voyez quand réviser.', hazir: false },
    ],
    yakinda: 'Bientôt',
    hocaBaslik: 'Quand vous êtes prêt, récitez à l’enseignant',
    hocaMetin: 'C’est l’enseignant qui valide l’étape. Le travail à la maison ne la change pas : récitez en classe quand vous êtes prêt.',
    veliBag: 'Le portail des parents montre l’étape de l’enfant',
    namazBaslik: 'Dans la prière', durus: { kiyam: 'Debout', ruku: 'Inclinaison', secde: 'Prosternation', kade: 'Assis' },
    namazKaynak: 'Source : Diyanet İlmihali I, « La manière d’accomplir la prière ».',
    onceki: 'Contenu précédent', sonraki: 'Contenu suivant', seriteDon: 'Revenir à la bande',
    metinBaslikDua: 'Texte et sens', kunyeKaynak: (ar, an) => `Texte arabe : ${ar}.${an ? ` Sens en turc : ${an}.` : ""}`,
    anlamYok: 'Le sens dans cette langue sera bientôt ajouté.', onayBekliyor: 'Texte repris des sources de la Diyanet ; relecture par l’enseignant en attente.', zorBaslik: 'Points d’attention',
  },
  en: {
    yol: 'You are here', ayet: (n) => `${n} verses`, metinBaslik: 'Text and translation', metinBaslikYalniz: 'Text', okunusGoster: 'Show transliteration',
    ayetiDinle: (n) => `Listen to verse ${n}`, dokun: 'Tap a verse to hear it.',
    mealYok: 'A translation in this language will be added soon.', metinYok: 'The text of this item is being prepared. You can already learn it by listening.',
    kunyeAr: 'Arabic text: Presidency of Religious Affairs (Diyanet), kuran.diyanet.gov.tr.',
    kunyeMeal: 'Translation: “The Holy Quran with English Translation”, Presidency of Religious Affairs (Diyanet), kuran.diyanet.gov.tr.',
    gruplama: (g) => `The translation follows Diyanet’s grouping of verses (${g}).`,
    mealInceleme: 'This translation will be reviewed.', okunusUsulu: 'Transliteration reviewed by the teacher.',
    yolBaslik: 'How to learn',
    adimlar: [
      { ad: 'Listen', metin: 'Listen to each verse at least three times in Diyanet’s recitation, then repeat it aloud.', hazir: true },
      { ad: 'Read from the text', metin: 'Read while looking at the text; follow the recitation if you like.', hazir: true },
      { ad: 'Link the verses', metin: 'Add the verses one by one to build a chain.', hazir: true },
      { ad: 'Fade the text', metin: 'Words disappear step by step; recall them from the first letter.', hazir: true },
      { ad: 'Test yourself', metin: 'Put the verses in order, find the missing word and see when to review.', hazir: false },
    ],
    yakinda: 'Soon',
    hocaBaslik: 'When you are ready, recite to your teacher',
    hocaMetin: 'Your teacher confirms the stage. Practising at home does not change it: recite in class when you are ready.',
    veliBag: 'The parents’ portal shows your child’s stage',
    namazBaslik: 'Where it is recited in the prayer', durus: { kiyam: 'Standing', ruku: 'Bowing', secde: 'Prostration', kade: 'Sitting' },
    namazKaynak: 'Source: Diyanet İlmihali I, “How the prayer is performed”.',
    onceki: 'Previous item', sonraki: 'Next item', seriteDon: 'Back to the band',
    metinBaslikDua: 'Text and meaning', kunyeKaynak: (ar, an) => `Arabic text: ${ar}.${an ? ` Turkish meaning: ${an}.` : ""}`,
    anlamYok: 'The meaning in this language will be added soon.', onayBekliyor: 'Text taken from Diyanet sources; teacher review pending.', zorBaslik: 'Things to watch for',
  },
  nl: {
    yol: 'U bent hier', ayet: (n) => `${n} verzen`, metinBaslik: 'Tekst en vertaling', metinBaslikYalniz: 'Tekst', okunusGoster: 'Transliteratie tonen',
    ayetiDinle: (n) => `Luister naar vers ${n}`, dokun: 'Tik op een vers om het te beluisteren.',
    mealYok: 'Een Nederlandse vertaling van de betekenis volgt binnenkort.', metinYok: 'De tekst van dit onderdeel wordt voorbereid. U kunt het nu al leren door te luisteren.',
    kunyeAr: 'Arabische tekst: Presidium voor Religieuze Zaken (Diyanet), kuran.diyanet.gov.tr.',
    kunyeMeal: 'Vertaling: vertaald uit de Turkse betekenisvertaling van de Diyanet, kuran.diyanet.gov.tr.',
    gruplama: (g) => `De vertaling volgt de versgroepering van de Diyanet (${g}).`,
    mealInceleme: 'Deze vertaling wordt nog nagelezen.', okunusUsulu: 'Transliteratie nagelezen door de leerkracht.',
    yolBaslik: 'Zo leert u het',
    adimlar: [
      { ad: 'Luisteren', metin: 'Luister minstens drie keer naar elk vers in de recitatie van de Diyanet en herhaal het hardop.', hazir: true },
      { ad: 'Van de tekst lezen', metin: 'Lees mee met de tekst, eventueel samen met de recitatie.', hazir: true },
      { ad: 'Aaneenrijgen', metin: 'Voeg de verzen één voor één toe tot een ketting.', hazir: true },
      { ad: 'Stap voor stap verbergen', metin: 'Woorden verdwijnen stap voor stap; herinner ze aan de eerste letter.', hazir: true },
      { ad: 'Uzelf toetsen', metin: 'Zet in de juiste volgorde, vind het ontbrekende woord en zie wanneer u herhaalt.', hazir: false },
    ],
    yakinda: 'Binnenkort',
    hocaBaslik: 'Klaar? Draag het voor aan de leerkracht',
    hocaMetin: 'De leerkracht bevestigt de stap. Thuis oefenen verandert die niet: draag het in de les voor als u klaar bent.',
    veliBag: 'Het ouderportaal toont de stap van uw kind',
    namazBaslik: 'Waar het in het gebed wordt gereciteerd', durus: { kiyam: 'Staand', ruku: 'Buiging', secde: 'Prosternatie', kade: 'Zittend' },
    namazKaynak: 'Bron: Diyanet İlmihali I, „Hoe het gebed wordt verricht”.',
    onceki: 'Vorig onderdeel', sonraki: 'Volgend onderdeel', seriteDon: 'Terug naar de band',
    metinBaslikDua: 'Tekst en betekenis', kunyeKaynak: (ar, an) => `Arabische tekst: ${ar}.${an ? ` Betekenis in het Turks: ${an}.` : ""}`,
    anlamYok: 'De betekenis in deze taal volgt binnenkort.', onayBekliyor: 'Tekst overgenomen uit Diyanet-bronnen; nalezing door de leerkracht volgt.', zorBaslik: 'Let hierop',
  },
  de: {
    yol: 'Sie sind hier', ayet: (n) => `${n} Verse`, metinBaslik: 'Text und Übersetzung', metinBaslikYalniz: 'Text', okunusGoster: 'Umschrift zeigen',
    ayetiDinle: (n) => `Vers ${n} anhören`, dokun: 'Tippen Sie auf einen Vers, um ihn zu hören.',
    mealYok: 'Eine Übersetzung in dieser Sprache folgt bald.', metinYok: 'Der Text dieses Inhalts wird vorbereitet. Sie können ihn schon jetzt durch Zuhören lernen.',
    kunyeAr: 'Arabischer Text: Präsidium für Religionsangelegenheiten (Diyanet), kuran.diyanet.gov.tr.',
    kunyeMeal: 'Übersetzung: „Der Heilige Koran – Deutsche Übersetzung“, Präsidium für Religionsangelegenheiten (Diyanet), kuran.diyanet.gov.tr.',
    gruplama: (g) => `Die Übersetzung folgt der Versgruppierung der Diyanet (${g}).`,
    mealInceleme: 'Diese Übersetzung wird noch geprüft.', okunusUsulu: 'Umschrift von der Lehrkraft geprüft.',
    yolBaslik: 'So lernen Sie',
    adimlar: [
      { ad: 'Hören', metin: 'Hören Sie jeden Vers mindestens dreimal in der Rezitation der Diyanet und wiederholen Sie ihn laut.', hazir: true },
      { ad: 'Vom Text lesen', metin: 'Lesen Sie mit Blick auf den Text, auf Wunsch zusammen mit der Rezitation.', hazir: true },
      { ad: 'Verketten', metin: 'Fügen Sie die Verse einzeln zu einer Kette zusammen.', hazir: true },
      { ad: 'Schrittweise ausblenden', metin: 'Wörter verschwinden Schritt für Schritt; erinnern Sie sich am ersten Buchstaben.', hazir: true },
      { ad: 'Sich prüfen', metin: 'In die richtige Reihenfolge bringen, das fehlende Wort finden und sehen, wann Sie wiederholen.', hazir: false },
    ],
    yakinda: 'Bald',
    hocaBaslik: 'Wenn Sie bereit sind: der Lehrkraft vortragen',
    hocaMetin: 'Die Stufe bestätigt die Lehrkraft. Üben zu Hause ändert sie nicht: Tragen Sie im Unterricht vor, wenn Sie bereit sind.',
    veliBag: 'Das Elternportal zeigt die Stufe Ihres Kindes',
    namazBaslik: 'Wo es im Gebet rezitiert wird', durus: { kiyam: 'Stehen', ruku: 'Verbeugung', secde: 'Niederwerfung', kade: 'Sitzen' },
    namazKaynak: 'Quelle: Diyanet İlmihali I, „Wie das Gebet verrichtet wird“.',
    onceki: 'Vorheriger Inhalt', sonraki: 'Nächster Inhalt', seriteDon: 'Zurück zum Band',
    metinBaslikDua: 'Text und Bedeutung', kunyeKaynak: (ar, an) => `Arabischer Text: ${ar}.${an ? ` Bedeutung auf Türkisch: ${an}.` : ""}`,
    anlamYok: 'Die Bedeutung in dieser Sprache folgt bald.', onayBekliyor: 'Text aus Diyanet-Quellen übernommen; Durchsicht durch die Lehrkraft steht aus.', zorBaslik: 'Worauf zu achten ist',
  },
};

export const maddeMetinleri = (dil: Dil): MaddeMetinleri => METINLER[dil];

/**
 * Namazda nerede okunur: duruş ve kısa açıklama (Diyanet İlmihali I, s. 262–264). Yalnız namazda okunan maddeler.
 * Başka bölümden alınan açıklama kendi kaynak satırını taşır; yoksa sayfa «Namazın Kılınışı» satırını basar.
 */
type Namazda = { durus: Durus; metin: Record<Dil, string>; kaynak?: Record<Dil, string> };
const ZAMM: Namazda = {
  durus: 'kiyam',
  metin: {
    tr: 'Fâtiha’dan sonra «zamm-ı sûre» olarak okunabilir: farz namazların ilk iki rekâtında, sünnet ve vitir namazlarının her rekâtında, ayakta (kıyamda).',
    fr: 'Elle peut être récitée debout après la Fâtiha, comme « sourate ajoutée » : dans les deux premières unités (rak‘a) des prières obligatoires et dans chaque unité des prières surérogatoires et du witr.',
    en: 'It can be recited while standing after the Fatihah as the “added surah”: in the first two units (rak‘ahs) of obligatory prayers and in every unit of sunnah and witr prayers.',
    nl: 'Het kan staand na de Fatiha worden gereciteerd als „toegevoegde soera”: in de eerste twee gebedseenheden (rak‘a) van de verplichte gebeden en in elke eenheid van de soenna- en witr-gebeden.',
    de: 'Sie kann im Stehen nach der Fatiha als „hinzugefügte Sure“ rezitiert werden: in den ersten beiden Gebetseinheiten (Rak‘a) der Pflichtgebete und in jeder Einheit der Sunna- und Witr-Gebete.',
  },
};
const SON_OTURUS_DUASI: Namazda = {
  durus: 'kade',
  metin: {
    tr: 'Son oturuşta salavattan sonra, selâmdan önce okunabilecek dualardandır.',
    fr: 'C’est l’une des invocations que l’on peut réciter lors de la dernière position assise, après les salutations sur le Prophète et avant la salutation finale.',
    en: 'It is one of the supplications that may be recited in the final sitting, after the prayers upon the Prophet and before the closing salutation.',
    nl: 'Het is een van de smeekbeden die in de laatste zithouding kunnen worden gereciteerd, na de zegebede over de Profeet en vóór de slotgroet.',
    de: 'Es gehört zu den Bittgebeten, die im letzten Sitzen nach dem Segensgebet für den Propheten und vor dem Schlussgruß gesprochen werden können.',
  },
};
// Diyanet İlmihali I, «Vitir Namazı», s. 305: son rekâtta Fâtiha ve sûreden sonra, rükûdan önce tekbirle (Hanefî).
const KUNUT: Namazda = {
  durus: 'kiyam',
  metin: {
    tr: 'Vitir namazının son (üçüncü) rekâtında okunur: Fâtiha ve sûreden sonra, rükûdan önce tekbir alınır ve ayakta önce «Allâhümme innâ neste‘înüke», ardından «Allâhümme iyyâke na‘büdü» okunur.',
    fr: 'On les récite dans la dernière (troisième) unité du witr : après la Fâtiha et la sourate, avant l’inclinaison, on prononce un takbir puis, debout, « Allâhumma innâ nasta‘înuka », suivie de « Allâhumma iyyâka na‘budu ».',
    en: 'They are recited in the last (third) unit of the witr prayer: after the Fatihah and the surah, before bowing, one says a takbir and then, standing, “Allahumma inna nasta‘inuka”, followed by “Allahumma iyyaka na‘budu”.',
    nl: 'Ze worden gereciteerd in de laatste (derde) eenheid van het witr-gebed: na de Fatiha en de soera, vóór de buiging, zegt men een takbier en reciteert men staand eerst „Allahoemma inna nasta‘inoeka”, daarna „Allahoemma iyyaka na‘boedoe”.',
    de: 'Sie werden in der letzten (dritten) Einheit des Witr-Gebets rezitiert: Nach der Fatiha und der Sure, vor der Verbeugung, spricht man einen Takbir und rezitiert im Stehen zuerst „Allahumma inna nasta‘inuka“, danach „Allahumma iyyaka na‘budu“.',
  },
  kaynak: {
    tr: 'Kaynak: Diyanet İlmihali I, «Vitir Namazı».',
    fr: 'Source : Diyanet İlmihali I, « La prière du witr ».',
    en: 'Source: Diyanet İlmihali I, “The witr prayer”.',
    nl: 'Bron: Diyanet İlmihali I, „Het witr-gebed”.',
    de: 'Quelle: Diyanet İlmihali I, „Das Witr-Gebet“.',
  },
};
const NAMAZDA: Readonly<Record<string, Namazda>> = {
  'd-rabbena-atina': SON_OTURUS_DUASI,
  'd-rabbenagfirli': SON_OTURUS_DUASI,
  'd-kunut-1': KUNUT,
  'd-kunut-2': KUNUT,
  's-fatiha': {
    durus: 'kiyam',
    metin: {
      tr: 'Namazın her rekâtında ayakta (kıyamda) okunur; bitince «âmîn» denir. İlk iki rekâtta ardından bir sûre ya da birkaç âyet eklenir.',
      fr: 'Elle est récitée debout à chaque unité (rak‘a) de la prière, suivie de « âmîn ». Dans les deux premières unités, on y ajoute une sourate ou quelques versets.',
      en: 'It is recited while standing in every unit (rak‘ah) of the prayer, followed by “amin”. In the first two units a surah or a few verses are added after it.',
      nl: 'Ze wordt staand gereciteerd in elke gebedseenheid (rak‘a), gevolgd door „amien”. In de eerste twee eenheden volgt een soera of enkele verzen.',
      de: 'Sie wird in jeder Gebetseinheit (Rak‘a) im Stehen rezitiert, danach sagt man „Amin“. In den ersten beiden Einheiten folgen eine Sure oder einige Verse.',
    },
  },
  'd-subhaneke': {
    durus: 'kiyam',
    metin: {
      tr: 'İlk rekâtta, iftitah tekbirinden sonra eller bağlanınca ayakta okunur; sonra eûzü-besmele ve Fâtiha gelir.',
      fr: 'Dans la première unité, on la récite debout après le takbir d’ouverture, les mains posées ; viennent ensuite la ta‘awwudh, la basmala et la Fâtiha.',
      en: 'In the first unit it is recited while standing, after the opening takbir with hands placed; then come the ta‘awwudh, the basmalah and the Fatihah.',
      nl: 'In de eerste eenheid wordt het staand gereciteerd na de openingstakbier, met de handen gevouwen; daarna volgen de ta‘awwoedh, de basmala en de Fatiha.',
      de: 'In der ersten Einheit wird es nach dem Eröffnungstakbir mit gebundenen Händen im Stehen rezitiert; danach folgen Ta‘awwudh, Basmala und Fatiha.',
    },
  },
  'd-ruku-tesbihi': {
    durus: 'ruku',
    metin: {
      tr: 'Rükûda en az üç kez söylenir.', fr: 'On la dit au moins trois fois pendant l’inclinaison.',
      en: 'It is said at least three times while bowing.', nl: 'Het wordt minstens drie keer gezegd tijdens de buiging.',
      de: 'Sie wird in der Verbeugung mindestens dreimal gesprochen.',
    },
  },
  'd-secde-tesbihi': {
    durus: 'secde',
    metin: {
      tr: 'Her secdede en az üç kez söylenir.', fr: 'On la dit au moins trois fois à chaque prosternation.',
      en: 'It is said at least three times in each prostration.', nl: 'Het wordt bij elke prosternatie minstens drie keer gezegd.',
      de: 'Sie wird in jeder Niederwerfung mindestens dreimal gesprochen.',
    },
  },
  'd-ettehiyyatu': {
    durus: 'kade',
    metin: {
      tr: 'Her oturuşta (ka‘de) okunur. İlk oturuşta ona bir şey eklenmez, üçüncü rekâta kalkılır.',
      fr: 'On la récite à chaque position assise. Lors de la première, on n’y ajoute rien et l’on se relève pour la troisième unité.',
      en: 'It is recited in every sitting. In the first sitting nothing is added, and one rises for the third unit.',
      nl: 'Het wordt in elke zithouding gereciteerd. In de eerste wordt er niets aan toegevoegd en staat men op voor de derde eenheid.',
      de: 'Es wird in jedem Sitzen rezitiert. Im ersten Sitzen wird nichts hinzugefügt, und man steht zur dritten Einheit auf.',
    },
  },
  'd-salli': {
    durus: 'kade',
    metin: {
      tr: 'Son oturuşta Tahiyyât’tan sonra okunur; ardından Allâhümme Bârik gelir.',
      fr: 'On la récite lors de la dernière position assise, après la Tahiyyat ; suit « Allahoumma barik ».',
      en: 'It is recited in the final sitting after the Tahiyyat; “Allahumma barik” follows.',
      nl: 'Het wordt in de laatste zithouding na de Tahiyyaat gereciteerd; daarna volgt „Allahoemma barik”.',
      de: 'Es wird im letzten Sitzen nach der Tahiyyat rezitiert; danach folgt „Allahumma barik“.',
    },
  },
  'd-barik': {
    durus: 'kade',
    metin: {
      tr: 'Son oturuşta Allâhümme Salli’den sonra okunur; ardından dua edilir ve selâm verilir.',
      fr: 'On la récite lors de la dernière position assise, après « Allahoumma salli » ; viennent ensuite les invocations et la salutation finale.',
      en: 'It is recited in the final sitting after “Allahumma salli”; then come the supplications and the closing salutation.',
      nl: 'Het wordt in de laatste zithouding na „Allahoemma salli” gereciteerd; daarna volgen de smeekbeden en de slotgroet.',
      de: 'Es wird im letzten Sitzen nach „Allahumma salli“ rezitiert; danach folgen Bittgebete und der Schlussgruß.',
    },
  },
};
/** Zamm-ı sûre: bütün sûre maddeleri ve sûre olarak okunan âyet grupları (Fâtiha hariç). */
export function namazda(id: string, tur: string): Namazda | undefined {
  return NAMAZDA[id] ?? (tur === 'sure' && id !== 's-fatiha' ? ZAMM : undefined);
}
