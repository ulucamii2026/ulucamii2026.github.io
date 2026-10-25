/**
 * Çalışma Belgesi metinleri (25 Ekim 2026). Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md): nl «u», de «Sie»;
 * «hoca» nl/de'de «leerkracht»/«Lehrkraft» (giriş sayfasındaki «Bugün tekrar» bandıyla aynı). Zorunlu ifade (`ifade`) ana plandaki
 * kararın sadık çevirisidir: «Ezber Sertifikası yalnız hocanın dinlediği ezberlere verilir». Ezber Sertifikası'nın adı
 * metinler.ts'teki karşılıklarla aynıdır (certificat de mémorisation · Memorisation Certificate · memorisatiecertificaat ·
 * Memorier-Zertifikat). Fransızca metin kaynakta düz boşlukla yazılır; `belgeMetinleri('fr')` `fransizTipografi` ile
 * ince/bölünmez boşluk koyar.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export interface BelgeMetinleri {
  /** Sayfa başlığı = belgenin başlığı. */
  baslik: string;
  aciklama: string;
  lead: string;
  fark: string;
  gizlilik: string;
  jsGerek: string;
  adEtiket: string;
  adIpucu: string;
  secimBaslik: string;
  secimYonerge: string;
  hepsiniSec: string;
  hicbiriniSecme: string;
  /** {n} seçili, {m} toplam. */
  sayac: string;
  /** «son çalışma: {t}» */
  sonCalisma: string;
  yazdir: string;
  yazdirNot: string;
  seciliYok: string;
  bosBaslik: string;
  bosMetin: string;
  onizleme: string;
  /** Kâğıt üstü */
  altBaslik: string;
  adSatiri: string;
  ifade: string;
  tabloAdi: string;
  sutunNo: string;
  sutunEzber: string;
  sutunSon: string;
  sutunBasamak: string;
  tabloBos: string;
  /** Özet: ezber sayısı (`ezber1`/`ezberN` {n}) + son üç haftadaki gün (`gun1`/`gunN` {k}; hiç yoksa eklenmez). */
  ezber1: string;
  ezberN: string;
  gun1: string;
  gunN: string;
  /** «Düzenlenme tarihi: {t}» */
  duzenleme: string;
  /** Giriş sayfasındaki ve madde sayfalarındaki bağlantı. */
  baglanti: string;
}

const BELGE: Record<Dil, BelgeMetinleri> = {
  tr: {
    baslik: 'Çalışma Belgesi',
    aciklama: 'Bu cihazdaki çalışmanızdan, hoca dinlemeden hazırlanan yazdırılabilir Çalışma Belgesi. Hiçbir veri gönderilmez.',
    lead: 'Bu cihazda çalıştığınız ezberlerden, A4 kâğıda yazdırılabilir bir belge hazırlayın. Belge, ezberleri hocaya okumadan, kendi çalışmanızla çalıştığınızı gösterir.',
    fark: 'Ezber Sertifikası yalnız hocanın dinlediği ezberlere verilir; bu belge onun yerini tutmaz.',
    gizlilik: 'Gizlilik: Belge yalnız bu cihazdaki çalışma kaydınızdan hazırlanır. Yazdığınız ad hiçbir yere gönderilmez ve kaydedilmez; sayfayı kapatınca silinir.',
    jsGerek: 'Bu sayfa, çalışma kaydınızı bu cihazdan okumak için JavaScript gerektirir.',
    adEtiket: 'Adınız (isteğe bağlı)',
    adIpucu: 'Boş bırakırsanız belgede elle yazmanız için bir çizgi kalır.',
    secimBaslik: 'Belgeye girecek ezberler',
    secimYonerge: 'Çalıştığınız her ezber işaretli gelir; istemediklerinizin işaretini kaldırın.',
    hepsiniSec: 'Hepsini seç',
    hicbiriniSecme: 'Hiçbirini seçme',
    sayac: 'Seçili: {n} / {m}',
    sonCalisma: 'son çalışma: {t}',
    yazdir: 'Yazdır / PDF olarak kaydet',
    yazdirNot: 'A4 dikey. Yazdırma penceresinde yazıcı yerine «PDF olarak kaydet» de seçebilirsiniz.',
    seciliYok: 'Belgeyi hazırlamak için en az bir ezber seçin.',
    bosBaslik: 'Bu cihazda henüz çalışma kaydı yok',
    bosMetin: 'Çalışma Belgesi, bu cihazda çalıştığınız ezberlerden hazırlanır. Bir ezbere çalışmaya başlayın, sonra buraya dönün.',
    onizleme: 'Belge önizlemesi',
    altBaslik: 'Kendi çalışmasıyla · hoca dinlemeden',
    adSatiri: 'Adı soyadı',
    ifade: 'Bu belge, aşağıdaki ezberlerin kendi çalışmasıyla, hoca dinlemeden çalışıldığını gösterir. Ezber Sertifikası yalnız hocanın dinlediği ezberlere verilir.',
    tabloAdi: 'Çalışılan ezberler',
    sutunNo: 'No',
    sutunEzber: 'Ezber',
    sutunSon: 'Son çalışma',
    sutunBasamak: 'Tekrar basamağı',
    tabloBos: 'Ezber seçilmedi.',
    ezber1: '1 ezber',
    ezberN: '{n} ezber',
    gun1: ' · son üç haftada 1 gün çalışıldı',
    gunN: ' · son üç haftada {k} gün çalışıldı',
    duzenleme: 'Düzenlenme tarihi: {t}',
    baglanti: 'Çalışma Belgesi hazırlayın',
  },
  fr: {
    baslik: 'Attestation de travail personnel',
    aciklama: 'Une attestation imprimable, établie à partir de votre travail sur cet appareil, sans écoute d’un enseignant. Aucune donnée n’est envoyée.',
    lead: 'Établissez, à partir de ce que vous avez travaillé sur cet appareil, un document imprimable en A4. Il indique que vous avez travaillé les textes par vous-même, sans les réciter à un enseignant.',
    fark: 'Le certificat de mémorisation n’est délivré que pour les textes écoutés par l’enseignant ; ce document ne le remplace pas.',
    gizlilik: 'Confidentialité : le document est établi uniquement à partir de votre suivi sur cet appareil. Le nom saisi n’est ni envoyé ni enregistré ; il disparaît à la fermeture de la page.',
    jsGerek: 'Cette page a besoin de JavaScript pour lire votre suivi sur cet appareil.',
    adEtiket: 'Votre nom (facultatif)',
    adIpucu: 'Si vous le laissez vide, une ligne reste sur le document pour l’écrire à la main.',
    secimBaslik: 'Textes à inclure',
    secimYonerge: 'Les textes travaillés sont cochés d’office ; décochez ceux que vous ne voulez pas inclure.',
    hepsiniSec: 'Tout sélectionner',
    hicbiriniSecme: 'Tout désélectionner',
    sayac: 'Sélection : {n} sur {m}',
    sonCalisma: 'dernier travail : {t}',
    yazdir: 'Imprimer / enregistrer en PDF',
    yazdirNot: 'A4 portrait. Dans la fenêtre d’impression, vous pouvez aussi choisir « Enregistrer au format PDF ».',
    seciliYok: 'Sélectionnez au moins un texte pour établir le document.',
    bosBaslik: 'Aucun suivi de travail sur cet appareil pour l’instant',
    bosMetin: 'L’attestation est établie à partir des textes que vous avez travaillés sur cet appareil. Commencez un texte, puis revenez ici.',
    onizleme: 'Aperçu du document',
    altBaslik: 'Travail personnel · sans écoute de l’enseignant',
    adSatiri: 'Nom et prénom',
    ifade: 'Ce document indique que les textes ci-dessous ont été travaillés par la personne elle-même, sans qu’un enseignant les ait écoutés. Le certificat de mémorisation n’est délivré que pour les textes écoutés par l’enseignant.',
    tabloAdi: 'Textes travaillés',
    sutunNo: 'N°',
    sutunEzber: 'Texte',
    sutunSon: 'Dernier travail',
    sutunBasamak: 'Étape de révision',
    tabloBos: 'Aucun texte sélectionné.',
    ezber1: '1 texte',
    ezberN: '{n} textes',
    gun1: ' · 1 jour de travail ces trois dernières semaines',
    gunN: ' · {k} jours de travail ces trois dernières semaines',
    duzenleme: 'Établi le {t}',
    baglanti: 'Préparer une attestation de travail personnel',
  },
  en: {
    baslik: 'Self-Study Certificate',
    aciklama: 'A printable certificate made from your own practice on this device, without a teacher listening. No data is sent anywhere.',
    lead: 'Prepare a printable A4 document from what you have practised on this device. It shows that you studied the texts on your own, without reciting them to a teacher.',
    fark: 'The Memorisation Certificate is awarded only for texts a teacher has listened to; this certificate does not replace it.',
    gizlilik: 'Privacy: the certificate is made only from the progress stored on this device. The name you type is never sent or saved and disappears when you close the page.',
    jsGerek: 'This page needs JavaScript to read your progress from this device.',
    adEtiket: 'Your name (optional)',
    adIpucu: 'If you leave it empty, a line remains on the certificate to write it by hand.',
    secimBaslik: 'Texts to include',
    secimYonerge: 'Every text you have practised is ticked; untick any you do not want to include.',
    hepsiniSec: 'Select all',
    hicbiriniSecme: 'Select none',
    sayac: 'Selected: {n} of {m}',
    sonCalisma: 'last practised: {t}',
    yazdir: 'Print / save as PDF',
    yazdirNot: 'A4 portrait. In the print dialog you can also choose “Save as PDF”.',
    seciliYok: 'Select at least one text to prepare the certificate.',
    bosBaslik: 'No study record on this device yet',
    bosMetin: 'The certificate is made from the texts you have practised on this device. Start on a text, then come back here.',
    onizleme: 'Certificate preview',
    altBaslik: 'Own study · without a teacher listening',
    adSatiri: 'Name',
    ifade: 'This document shows that the texts listed below were studied by the person themselves, without a teacher listening. The Memorisation Certificate is awarded only for texts that a teacher has listened to.',
    tabloAdi: 'Texts practised',
    sutunNo: 'No.',
    sutunEzber: 'Text',
    sutunSon: 'Last practised',
    sutunBasamak: 'Review stage',
    tabloBos: 'No text selected.',
    ezber1: '1 text',
    ezberN: '{n} texts',
    gun1: ' · practised on 1 day in the last three weeks',
    gunN: ' · practised on {k} days in the last three weeks',
    duzenleme: 'Issued on {t}',
    baglanti: 'Prepare a Self-Study Certificate',
  },
  nl: {
    baslik: 'Bewijs van zelfstudie',
    aciklama: 'Een afdrukbaar bewijs, opgesteld uit uw eigen oefening op dit apparaat, zonder dat een leerkracht luisterde. Er worden geen gegevens verstuurd.',
    lead: 'Stel van wat u op dit apparaat hebt geoefend een afdrukbaar A4-document op. Het toont dat u de teksten zelf hebt geoefend, zonder ze voor een leerkracht op te zeggen.',
    fark: 'Het memorisatiecertificaat geldt alleen voor teksten waarnaar een leerkracht heeft geluisterd; dit bewijs vervangt het niet.',
    gizlilik: 'Privacy: het bewijs wordt alleen opgesteld uit uw voortgang op dit apparaat. De naam die u typt wordt nergens naartoe gestuurd of opgeslagen en verdwijnt zodra u de pagina sluit.',
    jsGerek: 'Deze pagina heeft JavaScript nodig om uw voortgang op dit apparaat te lezen.',
    adEtiket: 'Uw naam (optioneel)',
    adIpucu: 'Laat u het leeg, dan blijft er op het bewijs een lijn over om het met de hand in te vullen.',
    secimBaslik: 'Op te nemen teksten',
    secimYonerge: 'Elke geoefende tekst is aangevinkt; haal het vinkje weg bij wat u niet wilt opnemen.',
    hepsiniSec: 'Alles selecteren',
    hicbiriniSecme: 'Niets selecteren',
    sayac: 'Geselecteerd: {n} van {m}',
    sonCalisma: 'laatst geoefend: {t}',
    yazdir: 'Afdrukken / opslaan als pdf',
    yazdirNot: 'A4 staand. In het afdrukvenster kunt u ook “Opslaan als pdf” kiezen.',
    seciliYok: 'Selecteer minstens één tekst om het bewijs op te stellen.',
    bosBaslik: 'Nog geen oefengegevens op dit apparaat',
    bosMetin: 'Het bewijs wordt opgesteld uit de teksten die u op dit apparaat hebt geoefend. Begin met een tekst en kom daarna hier terug.',
    onizleme: 'Voorbeeld van het bewijs',
    altBaslik: 'Zelfstudie · zonder luisterende leerkracht',
    adSatiri: 'Naam',
    ifade: 'Dit document toont aan dat de onderstaande teksten door de persoon zelf zijn geoefend, zonder dat een leerkracht luisterde. Het memorisatiecertificaat wordt alleen uitgereikt voor teksten waarnaar een leerkracht heeft geluisterd.',
    tabloAdi: 'Geoefende teksten',
    sutunNo: 'Nr.',
    sutunEzber: 'Tekst',
    sutunSon: 'Laatst geoefend',
    sutunBasamak: 'Herhaalstap',
    tabloBos: 'Geen tekst geselecteerd.',
    ezber1: '1 tekst',
    ezberN: '{n} teksten',
    gun1: ' · in de laatste drie weken 1 dag geoefend',
    gunN: ' · in de laatste drie weken {k} dagen geoefend',
    duzenleme: 'Opgesteld op {t}',
    baglanti: 'Een bewijs van zelfstudie opstellen',
  },
  de: {
    baslik: 'Nachweis des Selbststudiums',
    aciklama: 'Ein druckbarer Nachweis aus Ihrem eigenen Üben auf diesem Gerät, ohne dass eine Lehrkraft zugehört hat. Es werden keine Daten gesendet.',
    lead: 'Erstellen Sie aus dem, was Sie auf diesem Gerät geübt haben, ein druckbares A4-Dokument. Es zeigt, dass Sie die Texte selbst geübt haben, ohne sie einer Lehrkraft vorzutragen.',
    fark: 'Das Memorier-Zertifikat gibt es nur für Texte, denen eine Lehrkraft zugehört hat; dieses Dokument ersetzt es nicht.',
    gizlilik: 'Datenschutz: Das Dokument entsteht ausschließlich aus Ihrem Lernstand auf diesem Gerät. Der eingegebene Name wird weder gesendet noch gespeichert und verschwindet beim Schließen der Seite.',
    jsGerek: 'Diese Seite braucht JavaScript, um Ihren Lernstand von diesem Gerät zu lesen.',
    adEtiket: 'Ihr Name (optional)',
    adIpucu: 'Lassen Sie das Feld leer, bleibt auf dem Dokument eine Linie zum handschriftlichen Eintragen.',
    secimBaslik: 'Aufzunehmende Texte',
    secimYonerge: 'Jeder geübte Text ist angehakt; nehmen Sie den Haken bei allem weg, was nicht aufgenommen werden soll.',
    hepsiniSec: 'Alle auswählen',
    hicbiriniSecme: 'Keine auswählen',
    sayac: 'Ausgewählt: {n} von {m}',
    sonCalisma: 'zuletzt geübt: {t}',
    yazdir: 'Drucken / als PDF speichern',
    yazdirNot: 'A4 hochkant. Im Druckdialog können Sie auch „Als PDF speichern“ wählen.',
    seciliYok: 'Wählen Sie mindestens einen Text aus, um das Dokument zu erstellen.',
    bosBaslik: 'Noch kein Lernstand auf diesem Gerät',
    bosMetin: 'Das Dokument entsteht aus den Texten, die Sie auf diesem Gerät geübt haben. Beginnen Sie mit einem Text und kehren Sie dann hierher zurück.',
    onizleme: 'Vorschau des Dokuments',
    altBaslik: 'Selbststudium · ohne Zuhören der Lehrkraft',
    adSatiri: 'Name',
    ifade: 'Dieses Dokument zeigt, dass die unten aufgeführten Texte von der Person selbst geübt wurden, ohne dass eine Lehrkraft zugehört hat. Das Memorier-Zertifikat wird nur für Texte vergeben, denen eine Lehrkraft zugehört hat.',
    tabloAdi: 'Geübte Texte',
    sutunNo: 'Nr.',
    sutunEzber: 'Text',
    sutunSon: 'Zuletzt geübt',
    sutunBasamak: 'Wiederholungsstufe',
    tabloBos: 'Kein Text ausgewählt.',
    ezber1: '1 Text',
    ezberN: '{n} Texte',
    gun1: ' · in den letzten drei Wochen an 1 Tag geübt',
    gunN: ' · in den letzten drei Wochen an {k} Tagen geübt',
    duzenleme: 'Ausgestellt am {t}',
    baglanti: 'Einen Nachweis des Selbststudiums erstellen',
  },
};

/** Fransızca için noktalama öncesi boşluklar düzeltilir (işlevler sonuçlarıyla birlikte). */
function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (typeof deger === 'function') return ((...a: unknown[]) => fransizca((deger as (...b: unknown[]) => unknown)(...a))) as T;
  return deger;
}
const HAZIR: Record<Dil, BelgeMetinleri> = {
  ...BELGE,
  fr: Object.fromEntries(Object.entries(BELGE.fr).map(([k, v]) => [k, fransizca(v)])) as unknown as BelgeMetinleri,
};

export const belgeMetinleri = (dil: Dil): BelgeMetinleri => HAZIR[dil];
