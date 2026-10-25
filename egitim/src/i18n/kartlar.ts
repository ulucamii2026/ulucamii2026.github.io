/**
 * Ezber kartları · 8'li baskı metinleri (25 Ekim 2026). Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md): nl «u», de «Sie»;
 * «hoca» burada geçmez. Kartta yalnız arayüz metni vardır (dinî metin sayfanın kendi verisinden gelir). Fransızca metin kaynakta
 * düz boşlukla yazılır; `kartlarMetinleri('fr')` `fransizTipografi` ile ince/bölünmez boşluk koyar. Fransızca/İngilizce «kilim»,
 * Felemenkçe/Almanca «kelim» (KILIM_METINLERI ile aynı).
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export interface KartlarMetinleri {
  baslik: string;
  aciklama: string;
  lead: string;
  gizlilik: string;
  jsGerek: string;
  secimBaslik: string;
  /** Cihazda çalışma kaydı varsa / yoksa. */
  yonergeKayitli: string;
  yonergeKayitsiz: string;
  tumu: string;
  hicbiri: string;
  /** Şerit kutusu: «{s} şeridinin tümünü seç». */
  seritTumu: string;
  /** {n} seçili, {m} toplam. */
  sayac: string;
  yuzBaslik: string;
  yuzCift: string;
  yuzOn: string;
  yuzArka: string;
  yazdir: string;
  seciliYok: string;
  /** {n} kart, {s} basılacak sayfa, {k} yaprak. */
  ozet: string;
  yardimBaslik: string;
  yardim: readonly string[];
  onizleme: string;
  /** Önizleme sayfa başlıkları: {n} sayfa numarası. */
  sayfaOn: string;
  sayfaArka: string;
  /** Kartın arka yüzündeki kısa yönerge (sesli / sessiz madde). */
  okut: string;
  okutSessiz: string;
  /** Giriş sayfasındaki bloğun başlığı ve kısa girişi. */
  araclarBaslik: string;
  araclarGiris: string;
  /** Giriş sayfası karoları: kilimim ve belge başlıkları kendi dosyalarından, burada yalnız açıklamaları. */
  kilimimAciklama: string;
  belgeAciklama: string;
  kartlarAd: string;
  kartlarAciklama: string;
  /** Madde sayfasındaki «Birden çok kart bas» bağlantısı ve alt bilgi / öteki sayfalardaki bağlantı. */
  cokluBas: string;
  baglanti: string;
}

const KARTLAR: Record<Dil, KartlarMetinleri> = {
  tr: {
    baslik: 'Ezber kartları',
    aciklama: 'Seçtiğiniz ezberleri A4 kâğıda 8’erli, çift taraflı basılabilen kartlar olarak hazırlayın; arkadaki kare kod ezberin sayfasına götürür.',
    lead: 'Çalıştığınız ya da seçtiğiniz ezberleri, bir kâğıtta sekiz kart olacak biçimde yazdırın. Ön yüzde ezberin adı ve Arapça başlığı, arka yüzde dinlemek ve çalışmak için kare kod bulunur.',
    gizlilik: 'Gizlilik: Seçim için yalnız bu cihazdaki çalışma kaydınız okunur; hiçbir veri gönderilmez ve bu sayfa kayıt yazmaz.',
    jsGerek: 'Bu sayfa, kartları seçip dizmek için JavaScript gerektirir.',
    secimBaslik: 'Hangi ezberlerin kartı?',
    yonergeKayitli: 'Bu cihazda çalıştığınız ezberler işaretli geldi; istediğinizi ekleyin ya da işaretini kaldırın.',
    yonergeKayitsiz: 'Bu cihazda henüz çalışma kaydı yok; kartını basmak istediğiniz ezberleri işaretleyin.',
    tumu: 'Tümü',
    hicbiri: 'Hiçbiri',
    seritTumu: '{s}: tümünü seç',
    sayac: 'Seçili: {n} / {m}',
    yuzBaslik: 'Basılacak yüzler',
    yuzCift: 'Ön ve arka (çift taraflı)',
    yuzOn: 'Yalnız ön yüzler',
    yuzArka: 'Yalnız arka yüzler',
    yazdir: 'Kartları yazdır',
    seciliYok: 'Kart basmak için en az bir ezber seçin.',
    ozet: 'Kart: {n} · sayfa: {s} ({k} yaprak)',
    yardimBaslik: 'Nasıl basılır?',
    yardim: [
      'Yazdırma penceresinde kâğıt A4, ölçek %100 olsun (“sığdır” değil); üst bilgi ve alt bilgi kapalı olsun.',
      'Çift taraflı yazıcı: “iki yüze yazdır” seçeneğini açın ve “uzun kenardan çevir” (long-edge) seçin. Arka yüzler, çevirince her kartın arkasına denk gelecek biçimde dizilidir.',
      'Tek taraflı yazıcı: önce “Yalnız ön yüzler”i basın; basılı sayfaları uzun kenarından çevirip yazıcıya aynı sırayla geri koyun, sonra “Yalnız arka yüzler”i basın. Ya da iki yüzü ayrı basıp kestikten sonra arkalı önlü yapıştırın; her iki yüzde de aynı ezber kodu yazar.',
      'Kartları çevresindeki ince kesik çizgilerden makasla ya da giyotinle kesin.',
    ],
    onizleme: 'Baskı önizlemesi',
    sayfaOn: 'Sayfa {n} · ön yüz',
    sayfaArka: 'Sayfa {n} · arka yüz (kartlar yan yana aynalıdır)',
    okut: 'Dinlemek için okutun',
    okutSessiz: 'Çalışmak için okutun',
    araclarBaslik: 'Kendi çalışmanız için',
    araclarGiris: 'Üçü de bu cihazdaki çalışma kaydınızdan hazırlanır; hiçbir veri gönderilmez.',
    kilimimAciklama: 'Bu cihazdaki çalışmanızdan çizilen kilimi görün ve A4 olarak yazdırın.',
    belgeAciklama: 'Hoca dinlemeden, kendi çalışmanızı gösteren yazdırılabilir belge.',
    kartlarAd: 'Ezber kartları',
    kartlarAciklama: 'Seçtiğiniz ezberleri A4’e 8’erli, arkasında kare kodlu kartlar olarak basın.',
    cokluBas: 'Birden çok kart bas',
    baglanti: 'Ezber kartlarını yazdırın',
  },
  fr: {
    baslik: 'Fiches de mémorisation',
    aciklama: 'Préparez les textes choisis en fiches imprimables recto verso, huit par feuille A4 ; le code au dos mène à la page du texte.',
    lead: 'Imprimez les textes que vous travaillez ou que vous choisissez, à raison de huit fiches par feuille. Le recto porte le nom du texte et son titre en arabe ; le verso, un code à scanner pour écouter et travailler.',
    gizlilik: 'Confidentialité : seul votre suivi sur cet appareil est lu pour la sélection ; rien n’est envoyé et cette page n’écrit rien.',
    jsGerek: 'Cette page a besoin de JavaScript pour sélectionner et disposer les fiches.',
    secimBaslik: 'Fiches de quels textes ?',
    yonergeKayitli: 'Les textes travaillés sur cet appareil sont cochés d’office ; ajoutez ou retirez ceux que vous voulez.',
    yonergeKayitsiz: 'Aucun suivi de travail sur cet appareil pour l’instant ; cochez les textes dont vous voulez imprimer la fiche.',
    tumu: 'Tout',
    hicbiri: 'Aucun',
    seritTumu: '{s} : tout sélectionner',
    sayac: 'Sélection : {n} sur {m}',
    yuzBaslik: 'Faces à imprimer',
    yuzCift: 'Recto et verso (recto verso)',
    yuzOn: 'Rectos seulement',
    yuzArka: 'Versos seulement',
    yazdir: 'Imprimer les fiches',
    seciliYok: 'Sélectionnez au moins un texte pour imprimer des fiches.',
    ozet: 'Fiches : {n} · pages : {s} ({k} feuilles)',
    yardimBaslik: 'Comment imprimer ?',
    yardim: [
      'Dans la fenêtre d’impression : papier A4, échelle 100 % (pas « ajuster ») et sans en-têtes ni pieds de page.',
      'Imprimante recto verso : activez l’impression recto verso et choisissez « retourner sur le bord long ». Les versos sont disposés de façon à tomber exactement derrière chaque fiche une fois la feuille retournée.',
      'Imprimante simple face : imprimez d’abord « Rectos seulement », retournez les feuilles imprimées sur le bord long et remettez-les dans l’imprimante dans le même ordre, puis imprimez « Versos seulement ». Ou imprimez les deux faces séparément, découpez, puis collez dos à dos ; le même code de texte figure sur les deux faces.',
      'Découpez les fiches le long des fins traits pointillés avec des ciseaux ou un massicot.',
    ],
    onizleme: 'Aperçu avant impression',
    sayfaOn: 'Page {n} · recto',
    sayfaArka: 'Page {n} · verso (les fiches d’une même rangée sont inversées)',
    okut: 'Scannez pour écouter',
    okutSessiz: 'Scannez pour travailler',
    araclarBaslik: 'Pour votre travail personnel',
    araclarGiris: 'Les trois sont établis à partir de votre suivi sur cet appareil ; aucune donnée n’est envoyée.',
    kilimimAciklama: 'Voyez le kilim tissé à partir de votre travail sur cet appareil et imprimez-le en A4.',
    belgeAciklama: 'Un document imprimable qui montre votre travail personnel, sans écoute de l’enseignant.',
    kartlarAd: 'Fiches de mémorisation',
    kartlarAciklama: 'Imprimez les textes choisis à huit par feuille A4, avec un code à scanner au dos.',
    cokluBas: 'Imprimer plusieurs fiches',
    baglanti: 'Imprimer des fiches de mémorisation',
  },
  en: {
    baslik: 'Memorisation cards',
    aciklama: 'Prepare the texts you choose as double-sided printable cards, eight to an A4 sheet; the code on the back leads to the text’s page.',
    lead: 'Print the texts you are practising, or any you choose, eight cards to a sheet. The front shows the name of the text and its Arabic title; the back has a code to scan for listening and practice.',
    gizlilik: 'Privacy: only your progress on this device is read for the selection; nothing is sent and this page writes nothing.',
    jsGerek: 'This page needs JavaScript to select and lay out the cards.',
    secimBaslik: 'Cards for which texts?',
    yonergeKayitli: 'The texts you have practised on this device are ticked; add or remove any you like.',
    yonergeKayitsiz: 'No study record on this device yet; tick the texts you want cards for.',
    tumu: 'All',
    hicbiri: 'None',
    seritTumu: '{s}: select all',
    sayac: 'Selected: {n} of {m}',
    yuzBaslik: 'Sides to print',
    yuzCift: 'Front and back (double-sided)',
    yuzOn: 'Fronts only',
    yuzArka: 'Backs only',
    yazdir: 'Print the cards',
    seciliYok: 'Select at least one text to print cards.',
    ozet: 'Cards: {n} · pages: {s} ({k} sheets)',
    yardimBaslik: 'How to print',
    yardim: [
      'In the print dialog choose A4 paper, scale 100% (not “fit to page”), and turn headers and footers off.',
      'Double-sided printer: turn on two-sided printing and choose “flip on long edge”. The backs are laid out so each lands exactly behind its card once the sheet is turned.',
      'Single-sided printer: print “Fronts only” first, turn the printed sheets over on the long edge and feed them back in the same order, then print “Backs only”. Or print both sides separately, cut, and glue back to back; both sides carry the same text code.',
      'Cut the cards out along the fine dashed lines with scissors or a guillotine.',
    ],
    onizleme: 'Print preview',
    sayfaOn: 'Page {n} · front',
    sayfaArka: 'Page {n} · back (cards in each row are mirrored)',
    okut: 'Scan to listen',
    okutSessiz: 'Scan to practise',
    araclarBaslik: 'For your own practice',
    araclarGiris: 'All three are made from the progress stored on this device; nothing is sent anywhere.',
    kilimimAciklama: 'See the kilim drawn from your practice on this device and print it on A4.',
    belgeAciklama: 'A printable certificate of your own practice, without a teacher listening.',
    kartlarAd: 'Memorisation cards',
    kartlarAciklama: 'Print the texts you choose eight to an A4 sheet, with a scan code on the back.',
    cokluBas: 'Print several cards',
    baglanti: 'Print memorisation cards',
  },
  nl: {
    baslik: 'Memoriseerkaarten',
    aciklama: 'Maak van de gekozen teksten dubbelzijdig afdrukbare kaarten, acht per A4-vel; de code op de achterkant leidt naar de pagina van de tekst.',
    lead: 'Druk de teksten die u oefent, of die u kiest, af met acht kaarten per vel. De voorkant toont de naam van de tekst en de Arabische titel; de achterkant heeft een code om te scannen voor luisteren en oefenen.',
    gizlilik: 'Privacy: voor de selectie wordt alleen uw voortgang op dit apparaat gelezen; er wordt niets verstuurd en deze pagina schrijft niets weg.',
    jsGerek: 'Deze pagina heeft JavaScript nodig om de kaarten te kiezen en te rangschikken.',
    secimBaslik: 'Kaarten van welke teksten?',
    yonergeKayitli: 'De teksten die u op dit apparaat hebt geoefend zijn aangevinkt; voeg toe of haal weg wat u wilt.',
    yonergeKayitsiz: 'Nog geen oefengegevens op dit apparaat; vink de teksten aan waarvan u kaarten wilt afdrukken.',
    tumu: 'Alles',
    hicbiri: 'Niets',
    seritTumu: '{s}: alles selecteren',
    sayac: 'Geselecteerd: {n} van {m}',
    yuzBaslik: 'Te printen zijden',
    yuzCift: 'Voor- en achterkant (dubbelzijdig)',
    yuzOn: 'Alleen voorkanten',
    yuzArka: 'Alleen achterkanten',
    yazdir: 'Kaarten afdrukken',
    seciliYok: 'Selecteer minstens één tekst om kaarten af te drukken.',
    ozet: 'Kaarten: {n} · pagina’s: {s} ({k} vellen)',
    yardimBaslik: 'Hoe drukt u af?',
    yardim: [
      'Kies in het afdrukvenster A4-papier, schaal 100% (niet “aanpassen aan pagina”) en zet kop- en voetteksten uit.',
      'Dubbelzijdige printer: zet dubbelzijdig afdrukken aan en kies “omslaan over de lange zijde”. De achterkanten staan zo dat ze precies achter elke kaart vallen als u het vel omdraait.',
      'Enkelzijdige printer: druk eerst “Alleen voorkanten” af, draai de bedrukte vellen om over de lange zijde en leg ze in dezelfde volgorde terug, en druk dan “Alleen achterkanten” af. Of druk beide zijden apart af, knip uit en plak ze rug aan rug; beide zijden dragen dezelfde tekstcode.',
      'Knip de kaarten uit langs de fijne stippellijnen, met een schaar of een snijmachine.',
    ],
    onizleme: 'Afdrukvoorbeeld',
    sayfaOn: 'Pagina {n} · voorkant',
    sayfaArka: 'Pagina {n} · achterkant (kaarten per rij gespiegeld)',
    okut: 'Scan om te luisteren',
    okutSessiz: 'Scan om te oefenen',
    araclarBaslik: 'Voor uw eigen oefening',
    araclarGiris: 'Alle drie worden gemaakt uit uw voortgang op dit apparaat; er wordt niets verstuurd.',
    kilimimAciklama: 'Bekijk de kelim, getekend uit uw oefening op dit apparaat, en druk hem af op A4.',
    belgeAciklama: 'Een afdrukbaar bewijs van uw eigen oefening, zonder dat een leerkracht luisterde.',
    kartlarAd: 'Memoriseerkaarten',
    kartlarAciklama: 'Druk de gekozen teksten af, acht per A4-vel, met een scancode op de achterkant.',
    cokluBas: 'Meerdere kaarten afdrukken',
    baglanti: 'Memoriseerkaarten afdrukken',
  },
  de: {
    baslik: 'Lernkarten zum Auswendiglernen',
    aciklama: 'Bereiten Sie die gewählten Texte als doppelseitig druckbare Karten vor, acht pro A4-Blatt; der Code auf der Rückseite führt zur Seite des Textes.',
    lead: 'Drucken Sie die Texte, die Sie üben oder auswählen, mit acht Karten pro Blatt. Die Vorderseite zeigt den Namen des Textes und den arabischen Titel; die Rückseite trägt einen Code zum Scannen für Anhören und Üben.',
    gizlilik: 'Datenschutz: Für die Auswahl wird nur Ihr Übungsstand auf diesem Gerät gelesen; es wird nichts gesendet, und diese Seite schreibt nichts.',
    jsGerek: 'Diese Seite braucht JavaScript, um die Karten auszuwählen und anzuordnen.',
    secimBaslik: 'Karten für welche Texte?',
    yonergeKayitli: 'Die Texte, die Sie auf diesem Gerät geübt haben, sind angehakt; fügen Sie hinzu oder entfernen Sie, was Sie möchten.',
    yonergeKayitsiz: 'Auf diesem Gerät gibt es noch keinen Übungsstand; haken Sie die Texte an, deren Karten Sie drucken möchten.',
    tumu: 'Alle',
    hicbiri: 'Keine',
    seritTumu: '{s}: alle auswählen',
    sayac: 'Ausgewählt: {n} von {m}',
    yuzBaslik: 'Zu druckende Seiten',
    yuzCift: 'Vorder- und Rückseite (doppelseitig)',
    yuzOn: 'Nur Vorderseiten',
    yuzArka: 'Nur Rückseiten',
    yazdir: 'Karten drucken',
    seciliYok: 'Wählen Sie mindestens einen Text, um Karten zu drucken.',
    ozet: 'Karten: {n} · Seiten: {s} ({k} Blätter)',
    yardimBaslik: 'So drucken Sie',
    yardim: [
      'Wählen Sie im Druckdialog A4-Papier, Maßstab 100 % (nicht „An Seite anpassen“) und schalten Sie Kopf- und Fußzeilen aus.',
      'Doppelseitiger Drucker: Schalten Sie den Duplexdruck ein und wählen Sie „Wenden an der langen Kante“. Die Rückseiten sind so angeordnet, dass sie nach dem Wenden genau hinter jeder Karte liegen.',
      'Einseitiger Drucker: Drucken Sie zuerst „Nur Vorderseiten“, wenden Sie die bedruckten Blätter an der langen Kante und legen Sie sie in derselben Reihenfolge wieder ein; drucken Sie dann „Nur Rückseiten“. Oder drucken Sie beide Seiten getrennt, schneiden Sie aus und kleben Sie sie Rücken an Rücken; beide Seiten tragen denselben Textcode.',
      'Schneiden Sie die Karten entlang der feinen gestrichelten Linien mit Schere oder Schneidemaschine aus.',
    ],
    onizleme: 'Druckvorschau',
    sayfaOn: 'Seite {n} · Vorderseite',
    sayfaArka: 'Seite {n} · Rückseite (Karten je Reihe gespiegelt)',
    okut: 'Zum Anhören scannen',
    okutSessiz: 'Zum Üben scannen',
    araclarBaslik: 'Für Ihr eigenes Üben',
    araclarGiris: 'Alle drei entstehen aus Ihrem Übungsstand auf diesem Gerät; es wird nichts gesendet.',
    kilimimAciklama: 'Sehen Sie den Kelim, gezeichnet aus Ihrem Üben auf diesem Gerät, und drucken Sie ihn auf A4.',
    belgeAciklama: 'Ein druckbarer Nachweis Ihres eigenen Übens, ohne dass eine Lehrkraft zugehört hat.',
    kartlarAd: 'Lernkarten zum Auswendiglernen',
    kartlarAciklama: 'Drucken Sie die gewählten Texte acht pro A4-Blatt, mit einem Scancode auf der Rückseite.',
    cokluBas: 'Mehrere Karten drucken',
    baglanti: 'Lernkarten zum Auswendiglernen drucken',
  },
};

/** Fransızca için noktalama öncesi boşluklar düzeltilir (dizi ve metinler). */
const fransizca = <T>(deger: T): T => (typeof deger === 'string' ? (fransizTipografi(deger) as T)
  : Array.isArray(deger) ? (deger.map((x) => fransizca(x)) as T) : deger);
const HAZIR: Record<Dil, KartlarMetinleri> = {
  ...KARTLAR,
  fr: Object.fromEntries(Object.entries(KARTLAR.fr).map(([k, v]) => [k, fransizca(v)])) as unknown as KartlarMetinleri,
};

export const kartlarMetinleri = (dil: Dil): KartlarMetinleri => HAZIR[dil];
