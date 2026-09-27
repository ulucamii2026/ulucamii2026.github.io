/**
 * egitim.ulucamii.be arayüz metinleri (Faz 1f, 27 Eylül 2026). Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md):
 * nl Belçika Felemenkçesi ve «u», de «Sie»; FR/EN/NL/DE ilk taslak, Türkçe onaylı taslaktan (egitim/docs/taslaklar).
 * Madde, şerit ve basamak adları katalogdan ve src/lib/ezber/metinler.ts'ten gelir; burada yalnız sayfa metni var.
 * Fransızca metin kaynakta düz boşlukla yazılır; `metin('fr')` noktalama öncesine bölünmez boşluk koyar.
 * Eşikler (rozet ≥ Hocaya okudu, sertifika ≥ Pekişti, altın kenar = Kalıcı) docs/EZBER-KILIMI.md ile aynıdır.
 */
import type { Dil } from '@ortak/i18n/ui';
import { yerelKodu } from '@ortak/i18n/utils';
import { KALICILIK_GUN, PEKISME_GUN } from '@ortak/lib/ezber/durum';
import type { EzberTuru } from '@ortak/lib/ezber/katalog';

type Adim = 1 | 2 | 3 | 4;
export interface Metinler {
  aciklama: (n: number) => string;
  icerigeGec: string;
  anaMenu: string;
  dilGrubu: string;
  vaat: (n: number) => string;
  baslaDugme: string;
  seritleriGez: string;
  kusakSayi: (n: number) => string;
  kusakEk: (serit: number, durak: number) => string;
  panoEtiketi: string;
  guven: string;
  seritAdi: (seviye: number) => string;
  /** Pano ve kuşakta Amme'nin kısa adı. */
  amme: string;
  tur: Record<EzberTuru, string>;
  sesli: string;
  sinifHedefi: (tarih: string) => string;
  basamakBaslik: string;
  basamakGiris: string;
  /** [açıklama, zaman satırı] */
  basamak: Record<Adim, readonly [string, string]>;
  ilke: string;
  seritBaslik: string;
  seritGiris: string;
  maddeSayisi: (n: number) => string;
  goster: string;
  gizle: string;
  durakBasligi: (durak: string, n: number) => string;
  ammeEk: (durak: number, n: number) => string;
  dinleEtiketi: (ad: string) => string;
  durdurEtiketi: (ad: string) => string;
  sesHatasi: string;
  kilimAciklama: string;
  ornekEtiket: string;
  kilimSvgBasligi: string;
  kilimNot: string;
  veliPortali: string;
  kaynakBaslik: string;
  kaynaklar: readonly (readonly [string, string])[];
  altTanitim: string;
  anaSiteyeDon: string;
  iletisim: string;
  kaynaklarBasligi: string;
  kaynakDiyanet: string;
  diyanetAdi: string;
  yaziTipleri: string;
  bulunamadi: string;
  bulunamadiMetin: string;
  giriseDon: string;
}

const METINLER: Record<Dil, Metinler> = {
  tr: {
    aciklama: (n) => `Namaz sûrelerinden Amme cüzüne ${n} ezber: Diyanet metni ve sesiyle, kendi hızında.`,
    icerigeGec: 'İçeriğe geç',
    anaMenu: 'Ana menü',
    dilGrubu: 'Dil',
    vaat: (n) => `Panodaki ${n} karonun her biri bir ezber, namaz sûrelerinden Amme cüzüne. Öğrenci kendi hızında çalışır, hocasına okur; okudukça o karonun motifi kendi kilimine dokunur.`,
    baslaDugme: 'Fâtiha ile başla',
    seritleriGez: 'Şeritleri gez',
    kusakSayi: (n) => `${n} ezber`,
    kusakEk: (s, d) => `${s} şerit ve Amme’nin ${d} durağı; çevredeki bordürde kenar suyu`,
    panoEtiketi: 'Ezber panosu: şerit şerit bütün maddeler, çevresinde kenar suyu',
    guven: 'Kur’an metni, meâl ve tilavet Diyanet İşleri Başkanlığı’ndan. Sıralama yok: herkes yalnız kendi kilimini görür.',
    seritAdi: (s) => `${s}. şerit`,
    amme: 'Amme',
    tur: { sure: 'Sûre', dua: 'Dua', bilgi: 'Bilgi' },
    sesli: 'sesli',
    sinifHedefi: (t) => `Sınıf hedefi: ${t}`,
    basamakBaslik: 'Dört basamak, dört çini aşaması',
    basamakGiris: 'Kilimdeki her motif, bir çini karo gibi dört aşamada olgunlaşır: önce konturu çizilir, sonra firuzeyle boyanır, yeşille sırlanır, en sonunda altınla bezenir. Her aşamayı hoca, öğrenciyi dinleyerek açar.',
    basamak: {
      1: ['Öğrenci bu maddeye başladı. Motif yalnız konturla çizilir.', 'Hoca dinleyince ilerler'],
      2: ['Hocasına ilk kez okudu: «Tam» ya da «Az hatalı». Motif firuzeyle boyanır.', `En erken ${PEKISME_GUN} gün sonra pekişir`],
      3: ['Bir hafta sonra yine okudu, unutmamış. Motif yeşille sırlanır; şeridin bütün maddeleri pekişince Ezber Sertifikası verilir.', `En erken ${KALICILIK_GUN} gün sonra kalıcı olur`],
      4: ['Bir ay sonra da hatırladı. Motif altınla bezenir; şeridin bütün maddeleri kalıcı olunca kilime altın kenar dokunur.', 'Tekrarlarla korunur'],
    },
    ilke: 'Evde yapılan tekrar önemlidir ama basamağı değiştirmez; basamağı yalnız hocanın dinlemesi ilerletir.',
    seritBaslik: 'Şeritler: namazın sırasıyla',
    seritGiris: 'İlk yedi şerit, bir namazı baştan sona kılabilmenin sırasını izler. Sekizinci şerit Amme cüzüdür; kenar suyunda bayram, Ramazan ve özel günlerin ezberleri durur. Yıllık plandaki tarih, sınıfın o maddeye ulaşmayı hedeflediği gündür; öğrenci kendi hızında ilerler.',
    maddeSayisi: (n) => `${n} madde`,
    goster: 'Göster',
    gizle: 'Gizle',
    durakBasligi: (d, n) => `${d} · ${n} sûre`,
    ammeEk: (d, n) => `${d} durakta, ${n} sûre.`,
    dinleEtiketi: (ad) => `Dinle: ${ad}`,
    durdurEtiketi: (ad) => `Durdur: ${ad}`,
    sesHatasi: 'Ses şu an çalınamadı; bağlantınızı denetleyip yeniden deneyin.',
    kilimAciklama: 'Her öğrencinin kendi kilimi vardır ve panoyla aynı düzende dokunur: her şerit bir sıra, her karo bir motif, kenar suyu kenar bordüründe. Hoca dinledikçe motif konturdan firuzeye, yeşile ve altına geçer; bir şeridin bütün maddeleri okununca şerit rozetini, pekişince mührünü alır.',
    ornekEtiket: 'Örnek veri: uydurma bir öğrencinin kilimi',
    kilimSvgBasligi: 'Örnek kilim',
    kilimNot: 'Veliler çocuklarının kilimini veli portalında görür; Fransızca konuşan ailelere hocanın notu Fransızca gider.',
    veliPortali: 'Veli portalına git',
    kaynakBaslik: 'Metin ve ses nereden geliyor',
    kaynaklar: [
      ['Kur’an metni', 'Arapça metin Diyanet İşleri Başkanlığı’nın mushafından, Türk mushaf usulüyle: çeker esre, çeker üstün ve vakıf işaretleri yerli yerinde.'],
      ['Meâl', 'Türkçe anlam, kuran.diyanet.gov.tr’deki Diyanet İşleri Başkanlığı Meali’nden birebir alınır; öteki dillerde çevirinin kaynağı her zaman belirtilir.'],
      ['Tilavet', 'Sûre sesleri Diyanet İşleri Başkanlığı’nın kayıtlarıdır. Kaydı olmayan dua ve bilgilerde ses, hoca onayından sonra eklenir.'],
    ],
    altTanitim: 'Marche-en-Famenne Ulu Camii’nin Kur’an kursu ve eğitim çalışmaları. Ücretsizdir; kayıtlar ana sitede.',
    anaSiteyeDon: 'ulucamii.be’ye dön',
    iletisim: 'İletişim',
    kaynaklarBasligi: 'Kaynaklar',
    kaynakDiyanet: 'Kur’an metni, meâl ve tilavet:',
    diyanetAdi: 'Diyanet İşleri Başkanlığı',
    yaziTipleri: 'Yazı tipleri: Atkinson Hyperlegible Next ve Ulu Nesih (Scheherazade New’den), SIL Open Font License 1.1',
    bulunamadi: 'Sayfa bulunamadı',
    bulunamadiMetin: 'Aradığınız sayfa burada yok. Ezber Kilimi’ne dönebilir ya da caminin ana sitesine geçebilirsiniz.',
    giriseDon: 'Ezber Kilimi’ne dön',
  },
  fr: {
    aciklama: (n) => `${n} textes à mémoriser, des sourates de la prière au juz’ ‘Amma : texte et récitation de la Diyanet, à votre rythme.`,
    icerigeGec: 'Aller au contenu',
    anaMenu: 'Menu principal',
    dilGrubu: 'Langue',
    vaat: (n) => `Chacun des ${n} carreaux du panneau est un texte à mémoriser, des sourates de la prière au juz’ ‘Amma. L’élève avance à son rythme et récite à l’enseignant ; à chaque récitation, le motif de ce carreau se tisse dans son propre kilim.`,
    baslaDugme: 'Commencer par la Fatiha',
    seritleriGez: 'Parcourir les bandes',
    kusakSayi: (n) => `${n} textes`,
    kusakEk: (s, d) => `${s} bandes et les ${d} étapes de ‘Amma ; la bordure du kilim tout autour`,
    panoEtiketi: 'Panneau de mémorisation : tous les textes, bande par bande, entourés de la bordure du kilim',
    guven: 'Texte coranique, sens et récitation : Présidence des Affaires religieuses (Diyanet). Aucun classement : chacun ne voit que son propre kilim.',
    seritAdi: (s) => `bande ${s}`,
    amme: '‘Amma',
    tur: { sure: 'Sourate', dua: 'Invocation', bilgi: 'Connaissance' },
    sesli: 'audio',
    sinifHedefi: (t) => `Objectif de la classe : ${t}`,
    basamakBaslik: 'Quatre étapes, comme un carreau d’Iznik',
    basamakGiris: 'Chaque motif du kilim mûrit en quatre étapes, comme un carreau de faïence : on trace d’abord son contour, puis on le peint en turquoise, on l’émaille de vert et, enfin, on le rehausse d’or. C’est l’enseignant qui ouvre chaque étape, en écoutant l’élève.',
    basamak: {
      1: ['L’élève a commencé ce texte. Le motif n’est tracé qu’en contour.', 'Avance quand l’enseignant écoute'],
      2: ['Récité pour la première fois à l’enseignant : sans faute ou avec de petites corrections. Le motif est peint en turquoise.', `Consolidé au plus tôt ${PEKISME_GUN} jours après`],
      3: ['Récité de nouveau une semaine plus tard, sans oubli. Le motif est émaillé de vert ; quand tous les textes de la bande sont consolidés, le certificat de mémorisation est remis.', `Acquis durablement au plus tôt ${KALICILIK_GUN} jours après`],
      4: ['Toujours su un mois plus tard. Le motif est rehaussé d’or ; quand tous les textes de la bande sont acquis durablement, une bordure d’or se tisse sur le kilim.', 'Entretenu par les révisions'],
    },
    ilke: 'Réviser à la maison compte, mais ne change pas l’étape ; seule l’écoute de l’enseignant fait avancer un texte.',
    seritBaslik: 'Les bandes : dans l’ordre de la prière',
    seritGiris: 'Les sept premières bandes suivent l’ordre nécessaire pour accomplir une prière du début à la fin. La huitième bande est le juz’ ‘Amma ; la bordure du kilim rassemble les textes des fêtes, du Ramadan et des jours particuliers. La date du plan annuel est le jour où la classe vise ce texte ; chaque élève avance à son rythme.',
    maddeSayisi: (n) => `${n} textes`,
    goster: 'Afficher',
    gizle: 'Masquer',
    durakBasligi: (d, n) => `${d} · ${n} sourates`,
    ammeEk: (d, n) => `En ${d} étapes, ${n} sourates.`,
    dinleEtiketi: (ad) => `Écouter : ${ad}`,
    durdurEtiketi: (ad) => `Arrêter : ${ad}`,
    sesHatasi: 'Le son ne peut pas être lu pour le moment ; vérifiez votre connexion et réessayez.',
    kilimAciklama: 'Chaque élève a son propre kilim, tissé selon la même disposition que le panneau : chaque bande est une rangée, chaque carreau un motif, la bordure du kilim tout autour. À mesure que l’enseignant écoute, le motif passe du contour au turquoise, au vert puis à l’or ; quand tous les textes d’une bande ont été récités, la bande reçoit son insigne, puis son sceau quand ils sont consolidés.',
    ornekEtiket: 'Exemple : le kilim d’un élève fictif',
    kilimSvgBasligi: 'Exemple de kilim',
    kilimNot: 'Les parents voient le kilim de leur enfant dans le portail des parents ; les familles francophones reçoivent la note de l’enseignant en français.',
    veliPortali: 'Aller au portail des parents',
    kaynakBaslik: 'D’où viennent le texte et le son',
    kaynaklar: [
      ['Texte coranique', 'Le texte arabe provient du mushaf de la Présidence des Affaires religieuses (Diyanet), selon l’usage des mushafs turcs : kasra et fatha verticales et signes de pause à leur place.'],
      ['Sens', 'Le sens en turc est repris mot pour mot de la traduction de la Diyanet sur kuran.diyanet.gov.tr ; pour les autres langues, la source de la traduction est toujours indiquée.'],
      ['Récitation', 'Les enregistrements des sourates sont ceux de la Diyanet. Pour les invocations et connaissances sans enregistrement, le son n’est ajouté qu’après l’accord de l’enseignant.'],
    ],
    altTanitim: 'L’école coranique et les activités éducatives de la Mosquée Ulu Camii de Marche-en-Famenne. Gratuit ; les inscriptions se font sur le site principal.',
    anaSiteyeDon: 'Retour à ulucamii.be',
    iletisim: 'Contact',
    kaynaklarBasligi: 'Sources',
    kaynakDiyanet: 'Texte coranique, sens et récitation :',
    diyanetAdi: 'Présidence des Affaires religieuses (Diyanet)',
    yaziTipleri: 'Polices : Atkinson Hyperlegible Next et Ulu Nesih (d’après Scheherazade New), SIL Open Font License 1.1',
    bulunamadi: 'Page introuvable',
    bulunamadiMetin: 'La page que vous cherchez n’est pas ici. Vous pouvez revenir au kilim de mémorisation ou aller sur le site principal de la mosquée.',
    giriseDon: 'Retour au kilim de mémorisation',
  },
  en: {
    aciklama: (n) => `${n} texts to memorise, from the prayer surahs to Juz’ ‘Amma: text and recitation from the Diyanet, at your own pace.`,
    icerigeGec: 'Skip to content',
    anaMenu: 'Main menu',
    dilGrubu: 'Language',
    vaat: (n) => `Each of the ${n} tiles on the panel is a text to memorise, from the prayer surahs to Juz’ ‘Amma. Pupils work at their own pace and recite to their teacher; with every recitation, that tile’s motif is woven into their own kilim.`,
    baslaDugme: 'Start with Al-Fatihah',
    seritleriGez: 'Browse the bands',
    kusakSayi: (n) => `${n} texts`,
    kusakEk: (s, d) => `${s} bands and the ${d} stages of ‘Amma; the kilim border all around`,
    panoEtiketi: 'Memorisation panel: every text, band by band, framed by the kilim border',
    guven: 'Qur’an text, meaning and recitation come from the Presidency of Religious Affairs (Diyanet). No rankings: everyone sees only their own kilim.',
    seritAdi: (s) => `band ${s}`,
    amme: '‘Amma',
    tur: { sure: 'Surah', dua: 'Supplication', bilgi: 'Knowledge' },
    sesli: 'audio',
    sinifHedefi: (t) => `Class goal: ${t}`,
    basamakBaslik: 'Four steps, like an Iznik tile',
    basamakGiris: 'Every motif in the kilim matures in four steps, like a glazed tile: first its outline is drawn, then it is painted turquoise, glazed green and finally gilded. The teacher opens each step by listening to the pupil.',
    basamak: {
      1: ['The pupil has started this text. The motif is drawn in outline only.', 'Moves on when the teacher listens'],
      2: ['Recited to the teacher for the first time: without mistakes or with small corrections. The motif is painted turquoise.', `Consolidated after ${PEKISME_GUN} days at the earliest`],
      3: ['Recited again a week later, nothing forgotten. The motif is glazed green; once every text in the band is consolidated, the Memorisation Certificate is awarded.', `Firmly memorised after ${KALICILIK_GUN} days at the earliest`],
      4: ['Still known a month later. The motif is gilded; once every text in the band is firmly memorised, a golden border is woven into the kilim.', 'Kept alive by revision'],
    },
    ilke: 'Practice at home matters, but it does not change the step; only the teacher’s listening moves a text forward.',
    seritBaslik: 'The bands: in the order of the prayer',
    seritGiris: 'The first seven bands follow the order needed to perform a prayer from beginning to end. The eighth band is Juz’ ‘Amma; the kilim border holds the texts for the Eids, Ramadan and special days. The date from the yearly plan is the day the class aims to reach that text; each pupil moves at their own pace.',
    maddeSayisi: (n) => `${n} texts`,
    goster: 'Show',
    gizle: 'Hide',
    durakBasligi: (d, n) => `${d} · ${n} surahs`,
    ammeEk: (d, n) => `In ${d} stages, ${n} surahs.`,
    dinleEtiketi: (ad) => `Listen: ${ad}`,
    durdurEtiketi: (ad) => `Stop: ${ad}`,
    sesHatasi: 'The audio cannot be played right now; please check your connection and try again.',
    kilimAciklama: 'Every pupil has their own kilim, woven in the same layout as the panel: each band a row, each tile a motif, the kilim border all around. As the teacher listens, the motif moves from outline to turquoise, green and gold; when every text in a band has been recited, the band earns its badge, and once they are consolidated, its seal.',
    ornekEtiket: 'Example: the kilim of a fictional pupil',
    kilimSvgBasligi: 'Example kilim',
    kilimNot: 'Parents see their child’s kilim in the parents’ portal; French-speaking families receive the teacher’s note in French.',
    veliPortali: 'Go to the parents’ portal',
    kaynakBaslik: 'Where the text and audio come from',
    kaynaklar: [
      ['Qur’an text', 'The Arabic text comes from the mushaf of the Presidency of Religious Affairs (Diyanet), following the Turkish mushaf tradition: the vertical kasra and fatha and the pause marks are all in place.'],
      ['Meaning', 'The Turkish meaning is taken word for word from the Diyanet translation at kuran.diyanet.gov.tr; for other languages, the source of the translation is always stated.'],
      ['Recitation', 'The surah recordings are the Diyanet’s own. For supplications and knowledge without a recording, audio is added only after the teacher approves it.'],
    ],
    altTanitim: 'The Qur’an school and educational work of the Marche-en-Famenne Ulu Mosque. Free of charge; registration is on the main website.',
    anaSiteyeDon: 'Back to ulucamii.be',
    iletisim: 'Contact',
    kaynaklarBasligi: 'Sources',
    kaynakDiyanet: 'Qur’an text, meaning and recitation:',
    diyanetAdi: 'Presidency of Religious Affairs (Diyanet)',
    yaziTipleri: 'Typefaces: Atkinson Hyperlegible Next and Ulu Nesih (based on Scheherazade New), SIL Open Font License 1.1',
    bulunamadi: 'Page not found',
    bulunamadiMetin: 'The page you are looking for is not here. You can go back to the memorisation kilim or to the mosque’s main website.',
    giriseDon: 'Back to the memorisation kilim',
  },
  nl: {
    aciklama: (n) => `${n} teksten om uit het hoofd te leren, van de gebedssoera’s tot djoez’ ‘Amma: tekst en recitatie van de Diyanet, op uw eigen tempo.`,
    icerigeGec: 'Naar de inhoud',
    anaMenu: 'Hoofdmenu',
    dilGrubu: 'Taal',
    vaat: (n) => `Elk van de ${n} tegels op het paneel is een tekst om uit het hoofd te leren, van de gebedssoera’s tot djoez’ ‘Amma. De leerling werkt op eigen tempo en zegt de tekst op bij de leraar; bij elke voordracht wordt het motief van die tegel in de eigen kelim geweven.`,
    baslaDugme: 'Begin met Al-Fatiha',
    seritleriGez: 'Bekijk de banden',
    kusakSayi: (n) => `${n} teksten`,
    kusakEk: (s, d) => `${s} banden en de ${d} etappes van ‘Amma; rondom de rand van de kelim`,
    panoEtiketi: 'Memorisatiepaneel: alle teksten band per band, met rondom de rand van de kelim',
    guven: 'Korantekst, betekenis en recitatie komen van het Presidium voor Religieuze Zaken (Diyanet). Geen ranglijst: iedereen ziet alleen de eigen kelim.',
    seritAdi: (s) => `band ${s}`,
    amme: '‘Amma',
    tur: { sure: 'Soera', dua: 'Smeekbede', bilgi: 'Kennis' },
    sesli: 'audio',
    sinifHedefi: (t) => `Klasdoel: ${t}`,
    basamakBaslik: 'Vier stappen, zoals een tegel uit Iznik',
    basamakGiris: 'Elk motief in de kelim rijpt in vier stappen, zoals een geglazuurde tegel: eerst wordt de omtrek getekend, dan wordt het turkoois beschilderd, groen geglazuurd en ten slotte met goud versierd. De leraar opent elke stap door naar de leerling te luisteren.',
    basamak: {
      1: ['De leerling is met deze tekst begonnen. Het motief is alleen als omtrek getekend.', 'Gaat vooruit als de leraar luistert'],
      2: ['Voor het eerst bij de leraar opgezegd: foutloos of met kleine verbeteringen. Het motief wordt turkoois beschilderd.', `Op zijn vroegst na ${PEKISME_GUN} dagen verstevigd`],
      3: ['Een week later opnieuw opgezegd, niets vergeten. Het motief wordt groen geglazuurd; als alle teksten van de band verstevigd zijn, volgt het memorisatiecertificaat.', `Op zijn vroegst na ${KALICILIK_GUN} dagen blijvend gekend`],
      4: ['Een maand later nog steeds gekend. Het motief wordt met goud versierd; als alle teksten van de band blijvend gekend zijn, krijgt de kelim een gouden rand.', 'Blijft behouden door herhaling'],
    },
    ilke: 'Thuis herhalen is belangrijk, maar verandert de stap niet; alleen het luisteren van de leraar brengt een tekst een stap verder.',
    seritBaslik: 'De banden: in de volgorde van het gebed',
    seritGiris: 'De eerste zeven banden volgen de volgorde die nodig is om een gebed van begin tot eind te verrichten. De achtste band is djoez’ ‘Amma; in de rand van de kelim staan de teksten voor de feesten, de ramadan en bijzondere dagen. De datum uit het jaarplan is de dag waarop de klas die tekst wil bereiken; elke leerling gaat op eigen tempo vooruit.',
    maddeSayisi: (n) => `${n} teksten`,
    goster: 'Tonen',
    gizle: 'Verbergen',
    durakBasligi: (d, n) => `${d} · ${n} soera’s`,
    ammeEk: (d, n) => `In ${d} etappes, ${n} soera’s.`,
    dinleEtiketi: (ad) => `Beluisteren: ${ad}`,
    durdurEtiketi: (ad) => `Stoppen: ${ad}`,
    sesHatasi: 'De audio kan nu niet worden afgespeeld; controleer uw verbinding en probeer het opnieuw.',
    kilimAciklama: 'Elke leerling heeft een eigen kelim, geweven in dezelfde indeling als het paneel: elke band een rij, elke tegel een motief, de rand van de kelim rondom. Naarmate de leraar luistert, gaat het motief van omtrek naar turkoois, groen en goud; als alle teksten van een band zijn opgezegd, krijgt de band een insigne, en zodra ze verstevigd zijn, een zegel.',
    ornekEtiket: 'Voorbeeld: de kelim van een fictieve leerling',
    kilimSvgBasligi: 'Voorbeeldkelim',
    kilimNot: 'Ouders zien de kelim van hun kind in het ouderportaal; Franstalige gezinnen krijgen de notitie van de leraar in het Frans.',
    veliPortali: 'Naar het ouderportaal',
    kaynakBaslik: 'Waar tekst en audio vandaan komen',
    kaynaklar: [
      ['Korantekst', 'De Arabische tekst komt uit de moesjaf van het Presidium voor Religieuze Zaken (Diyanet), volgens de Turkse moesjaf-traditie: de verticale kasra en fatha en de pauzetekens staan op hun plaats.'],
      ['Betekenis', 'De Turkse betekenis wordt woord voor woord overgenomen uit de vertaling van de Diyanet op kuran.diyanet.gov.tr; voor andere talen wordt de bron van de vertaling altijd vermeld.'],
      ['Recitatie', 'De soera-opnames zijn die van de Diyanet. Voor smeekbeden en kennis zonder opname wordt audio pas na goedkeuring door de leraar toegevoegd.'],
    ],
    altTanitim: 'De koranschool en de educatieve activiteiten van de Ulu Camii-moskee in Marche-en-Famenne. Gratis; inschrijven gebeurt via de hoofdsite.',
    anaSiteyeDon: 'Terug naar ulucamii.be',
    iletisim: 'Contact',
    kaynaklarBasligi: 'Bronnen',
    kaynakDiyanet: 'Korantekst, betekenis en recitatie:',
    diyanetAdi: 'Presidium voor Religieuze Zaken (Diyanet)',
    yaziTipleri: 'Lettertypes: Atkinson Hyperlegible Next en Ulu Nesih (op basis van Scheherazade New), SIL Open Font License 1.1',
    bulunamadi: 'Pagina niet gevonden',
    bulunamadiMetin: 'De pagina die u zoekt, staat hier niet. U kunt terug naar de memorisatiekelim of naar de hoofdsite van de moskee gaan.',
    giriseDon: 'Terug naar de memorisatiekelim',
  },
  de: {
    aciklama: (n) => `${n} Texte zum Auswendiglernen, von den Gebetssuren bis zum Dschuz’ ‘Amma: Text und Rezitation der Diyanet, in Ihrem eigenen Tempo.`,
    icerigeGec: 'Zum Inhalt springen',
    anaMenu: 'Hauptmenü',
    dilGrubu: 'Sprache',
    vaat: (n) => `Jede der ${n} Kacheln auf der Tafel ist ein Text zum Auswendiglernen, von den Gebetssuren bis zum Dschuz’ ‘Amma. Die Lernenden gehen in ihrem eigenen Tempo vor und tragen dem Lehrer vor; mit jedem Vortrag wird das Motiv dieser Kachel in ihren eigenen Kelim eingewebt.`,
    baslaDugme: 'Mit der Fatiha beginnen',
    seritleriGez: 'Die Streifen ansehen',
    kusakSayi: (n) => `${n} Texte`,
    kusakEk: (s, d) => `${s} Streifen und die ${d} Etappen von ‘Amma; ringsum die Kelim-Bordüre`,
    panoEtiketi: 'Memorier-Tafel: alle Texte Streifen für Streifen, ringsum die Kelim-Bordüre',
    guven: 'Korantext, Bedeutung und Rezitation stammen vom Präsidium für Religiöse Angelegenheiten (Diyanet). Keine Rangliste: Alle sehen nur den eigenen Kelim.',
    seritAdi: (s) => `Streifen ${s}`,
    amme: '‘Amma',
    tur: { sure: 'Sure', dua: 'Bittgebet', bilgi: 'Wissen' },
    sesli: 'Audio',
    sinifHedefi: (t) => `Klassenziel: ${t}`,
    basamakBaslik: 'Vier Stufen, wie eine Kachel aus Iznik',
    basamakGiris: 'Jedes Motiv im Kelim reift in vier Stufen wie eine glasierte Kachel: Zuerst wird die Kontur gezeichnet, dann wird es türkis bemalt, grün glasiert und schließlich mit Gold verziert. Jede Stufe öffnet der Lehrer, indem er zuhört.',
    basamak: {
      1: ['Mit diesem Text wurde begonnen. Das Motiv ist nur als Kontur gezeichnet.', 'Geht weiter, wenn der Lehrer zuhört'],
      2: ['Zum ersten Mal beim Lehrer vorgetragen: fehlerfrei oder mit kleinen Korrekturen. Das Motiv wird türkis bemalt.', `Frühestens nach ${PEKISME_GUN} Tagen gefestigt`],
      3: ['Eine Woche später erneut vorgetragen, nichts vergessen. Das Motiv wird grün glasiert; sind alle Texte des Streifens gefestigt, gibt es das Memorier-Zertifikat.', `Frühestens nach ${KALICILIK_GUN} Tagen dauerhaft gelernt`],
      4: ['Einen Monat später immer noch gewusst. Das Motiv wird mit Gold verziert; sind alle Texte des Streifens dauerhaft gelernt, bekommt der Kelim einen goldenen Rand.', 'Durch Wiederholen bewahrt'],
    },
    ilke: 'Wiederholen zu Hause ist wichtig, ändert aber die Stufe nicht; nur das Zuhören des Lehrers bringt einen Text eine Stufe weiter.',
    seritBaslik: 'Die Streifen: in der Reihenfolge des Gebets',
    seritGiris: 'Die ersten sieben Streifen folgen der Reihenfolge, in der man lernt, ein Gebet von Anfang bis Ende zu verrichten. Der achte Streifen ist der Dschuz’ ‘Amma; in der Kelim-Bordüre stehen die Texte für die Feste, den Ramadan und besondere Tage. Das Datum aus dem Jahresplan ist der Tag, an dem die Klasse diesen Text erreichen möchte; alle lernen in ihrem eigenen Tempo.',
    maddeSayisi: (n) => `${n} Texte`,
    goster: 'Anzeigen',
    gizle: 'Ausblenden',
    durakBasligi: (d, n) => `${d} · ${n} Suren`,
    ammeEk: (d, n) => `In ${d} Etappen, ${n} Suren.`,
    dinleEtiketi: (ad) => `Anhören: ${ad}`,
    durdurEtiketi: (ad) => `Stoppen: ${ad}`,
    sesHatasi: 'Der Ton kann gerade nicht abgespielt werden; bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    kilimAciklama: 'Alle Lernenden haben einen eigenen Kelim, gewebt in derselben Ordnung wie die Tafel: jeder Streifen eine Reihe, jede Kachel ein Motiv, ringsum die Bordüre. Je öfter der Lehrer zuhört, desto weiter geht das Motiv von der Kontur zu Türkis, Grün und Gold; sind alle Texte eines Streifens vorgetragen, gibt es das Abzeichen, sind sie gefestigt, das Siegel.',
    ornekEtiket: 'Beispiel: der Kelim einer erfundenen Person',
    kilimSvgBasligi: 'Beispiel-Kelim',
    kilimNot: 'Eltern sehen den Kelim ihres Kindes im Elternportal; französischsprachige Familien erhalten die Notiz des Lehrers auf Französisch.',
    veliPortali: 'Zum Elternportal',
    kaynakBaslik: 'Woher Text und Ton kommen',
    kaynaklar: [
      ['Korantext', 'Der arabische Text stammt aus dem Mushaf des Präsidiums für Religiöse Angelegenheiten (Diyanet), nach türkischer Mushaf-Tradition: senkrechtes Kasra und Fatha sowie die Pausenzeichen stehen an ihrem Platz.'],
      ['Bedeutung', 'Die türkische Bedeutung wird wörtlich aus der Übersetzung der Diyanet auf kuran.diyanet.gov.tr übernommen; für andere Sprachen wird die Quelle der Übersetzung immer angegeben.'],
      ['Rezitation', 'Die Surenaufnahmen stammen von der Diyanet. Für Bittgebete und Wissen ohne Aufnahme wird Ton erst nach Freigabe durch den Lehrer ergänzt.'],
    ],
    altTanitim: 'Koranschule und Bildungsarbeit der Ulu-Camii-Moschee in Marche-en-Famenne. Kostenlos; die Anmeldung erfolgt über die Hauptseite.',
    anaSiteyeDon: 'Zurück zu ulucamii.be',
    iletisim: 'Kontakt',
    kaynaklarBasligi: 'Quellen',
    kaynakDiyanet: 'Korantext, Bedeutung und Rezitation:',
    diyanetAdi: 'Präsidium für Religiöse Angelegenheiten (Diyanet)',
    yaziTipleri: 'Schriften: Atkinson Hyperlegible Next und Ulu Nesih (auf Basis von Scheherazade New), SIL Open Font License 1.1',
    bulunamadi: 'Seite nicht gefunden',
    bulunamadiMetin: 'Die gesuchte Seite gibt es hier nicht. Sie können zum Memorier-Kelim oder zur Hauptseite der Moschee zurückkehren.',
    giriseDon: 'Zurück zum Memorier-Kelim',
  },
};

/** Fransız yazım kuralı: «;», «!», «?» öncesine ince bölünmez boşluk, «:» öncesine ve «« »» içine bölünmez boşluk. */
export function fransizTipografi(s: string): string {
  return s
    .replace(/ ([;!?])/g, ' $1')
    .replace(/ :/g, ' :')
    .replace(/« /g, '« ')
    .replace(/ »/g, ' »');
}

function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (typeof deger === 'function') return ((...a: unknown[]) => fransizca((deger as (...b: unknown[]) => unknown)(...a))) as T;
  if (Array.isArray(deger)) return deger.map((x) => fransizca(x)) as T;
  if (deger && typeof deger === 'object') {
    return Object.fromEntries(Object.entries(deger).map(([k, v]) => [k, fransizca(v)])) as T;
  }
  return deger;
}

const HAZIR: Record<Dil, Metinler> = { ...METINLER, fr: fransizca(METINLER.fr) };

export function metin(dil: Dil): Metinler {
  return HAZIR[dil];
}

/** «2026-10-18» → sayfa dilinde uzun tarih (Brüksel takvim günü; saat dilimi kaymasın diye öğlen UTC). */
export function tarihYaz(t: string, dil: Dil): string {
  return new Intl.DateTimeFormat(yerelKodu[dil], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${t}T12:00:00Z`));
}

/** Satır başı için ilk harfi büyütür (dile duyarlı: «étape 2» → «Étape 2»; «1. durak» olduğu gibi kalır). */
export function ilkHarfBuyuk(s: string, dil: Dil): string {
  return s ? s[0].toLocaleUpperCase(yerelKodu[dil]) + s.slice(1) : s;
}
