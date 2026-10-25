/**
 * Çevrim dışı çalışma metinleri (25 Ekim 2026): madde sayfasındaki «İnternetsiz çalışmak için kaydet» kutusu, `/<dil>/cevrimdisi/` sayfası
 * (çevrim dışı yedek sayfa ve kayıt yönetimi) ve giriş sayfasındaki bağlantı. Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md):
 * nl «u», de «Sie»; «hoca» burada geçmez. Dinî metin ya da okunuş yoktur; yalnız arayüz metni. Fransızca metin kaynakta düz boşlukla
 * yazılır; `cevrimdisiMetinleri('fr')` `fransizTipografi` ile ince/bölünmez boşluk koyar. «Diyanet kaydı» = ulucamii.be'den çalan Diyanet
 * mushaf/dua kaydı (gizlilik metniyle aynı söz). Yer tutucular: {ad} {n} {m} {y} {t} {boyut}.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';
export { doldur } from '../lib/cevrimdisi-ortak';

export interface CevrimdisiMetinleri {
  /** Madde sayfasındaki kutu. */
  baslik: string;
  aciklama: string;
  kaydet: string;
  vazgec: string;
  sil: string;
  /** Silme düğmesinin erişilebilir adı: {ad} madde adı. */
  silEtiket: string;
  /** Başlangıç duyurusu: {n} ses dosyası sayısı (sessiz maddede `baslangicSessiz`). */
  baslangic: string;
  baslangicSessiz: string;
  /** Görünen ilerleme: {y} yapılan, {t} toplam dosya, {boyut} indirilen. */
  ilerleme: string;
  /** Bitiş duyuruları: {boyut} toplam. */
  bitti: string;
  bittiSessiz: string;
  kayitli: string;
  silindi: string;
  vazgecildi: string;
  hata: string;
  hataKota: string;
  cevrimdisiNot: string;
  /** Madde sayfasından yönetim sayfasına bağlantı. */
  liste: string;
  gizlilik: string;
  /** `/<dil>/cevrimdisi/` sayfası. */
  sayfaBaslik: string;
  sayfaAciklama: string;
  lead: string;
  jsGerek: string;
  desteklenmiyor: string;
  bagVar: string;
  bagYok: string;
  /** Yedek sayfa başka bir adres için açıldıysa (adres kayıtlı değil). */
  istenenYok: string;
  kayitlarBaslik: string;
  bos: string;
  /** {n} madde, {boyut} toplam. */
  ozet: string;
  acilanBaslik: string;
  acilanNot: string;
  acilanYok: string;
  hepsiniSil: string;
  hepsiOnay: string;
  hepsiEvet: string;
  hepsiVazgec: string;
  hepsiSilindi: string;
  /** Tek kayıt silindi duyurusu: {ad}. */
  kayitSilindi: string;
  gizlilikBaslik: string;
  gizlilikMetni: string;
  anaEkranBaslik: string;
  anaEkran: string;
  /** Giriş sayfasındaki satır ve alt bilgi bağlantısı. */
  baglanti: string;
  girisAciklama: string;
}

const CEVRIMDISI: Record<Dil, CevrimdisiMetinleri> = {
  tr: {
    baslik: 'İnternetsiz çalışma',
    aciklama: 'Bu madde internet olmadan da açılsın ve çalsın: sayfa ve Diyanet kayıtları yalnız bu cihaza kaydedilir.',
    kaydet: 'İnternetsiz çalışmak için kaydet',
    vazgec: 'Vazgeç',
    sil: 'Sil',
    silEtiket: 'Bu cihazdaki kaydı sil: {ad}',
    baslangic: 'Kaydediliyor: sayfa ve {n} ses dosyası.',
    baslangicSessiz: 'Kaydediliyor: sayfa.',
    ilerleme: '{y} / {t} dosya · {boyut}',
    bitti: 'Kaydedildi. Bu madde artık internetsiz de açılır ve çalar. Toplam: {boyut}.',
    bittiSessiz: 'Kaydedildi. Bu sayfa artık internetsiz de açılır. Toplam: {boyut}.',
    kayitli: 'Bu cihazda kayıtlı',
    silindi: 'Kayıt silindi. Bu madde artık internetsiz açılmaz.',
    vazgecildi: 'Vazgeçildi. İndirilen dosyalar cihazda kalmış olabilir; kayıt tamamlanmadı.',
    hata: 'Kaydedilemedi. İnternet bağlantınızı denetleyip yeniden deneyin.',
    hataKota: 'Cihazda yeterli boş yer yok. Önce çevrim dışı sayfasından başka kayıtları silin.',
    cevrimdisiNot: 'Şu an internet bağlantınız yok. Kayıtlı sayfalar ve sesler çalışır; yeni kayıt için internet gerekir.',
    liste: 'Bu cihazdaki kayıtlar',
    gizlilik: 'Kaydedilen sayfa ve sesler yalnız bu tarayıcının önbelleğinde durur, kişisel veri içermez; çevrim dışı sayfasından silebilirsiniz.',
    sayfaBaslik: 'Çevrim dışı çalışma',
    sayfaAciklama: 'Bu cihazda kayıtlı ezber maddeleri: internet olmadan açılır ve çalar. Kayıtları buradan silebilirsiniz.',
    lead: 'İnternet yokken ya da zayıfken de ezber çalışabilmeniz için maddeleri bu cihaza kaydedebilirsiniz. Kaydettiğiniz madde sesiyle birlikte internetsiz açılır.',
    jsGerek: 'Bu sayfa, kayıtları listelemek için JavaScript gerektirir.',
    desteklenmiyor: 'Bu tarayıcı ya da gizli pencere internetsiz kaydı desteklemiyor.',
    bagVar: 'İnternet bağlantısı var.',
    bagYok: 'İnternet bağlantısı yok; yalnız bu cihazda kayıtlı olanlar açılır.',
    istenenYok: 'İstediğiniz sayfa bu cihazda kayıtlı değil, internetsiz açılamaz. Aşağıdaki kayıtlı maddelerden birini açabilirsiniz.',
    kayitlarBaslik: 'Bu cihazda kayıtlı maddeler',
    bos: 'Henüz kayıtlı madde yok. Bir madde sayfasında «İnternetsiz çalışmak için kaydet» düğmesine basın.',
    ozet: '{n} madde · yaklaşık {boyut}',
    acilanBaslik: 'Bu cihazda açtığınız diğer sayfalar',
    acilanNot: 'Bu sayfalar internetsiz açılır; sesler yalnız «İnternetsiz çalışmak için kaydet» ile kaydettiğiniz maddelerde çalışır.',
    acilanYok: 'Başka açılmış sayfa yok.',
    hepsiniSil: 'Hepsini sil',
    hepsiOnay: 'Bu cihazdaki bütün kayıtlar ve açılmış sayfalar silinsin mi?',
    hepsiEvet: 'Evet, hepsini sil',
    hepsiVazgec: 'Vazgeç',
    hepsiSilindi: 'Bütün kayıtlar silindi.',
    kayitSilindi: '{ad} kaydı silindi.',
    gizlilikBaslik: 'Gizlilik ve sınırlar',
    gizlilikMetni: 'Kaydedilen sayfalar ve sesler yalnız bu tarayıcının önbelleğinde durur, kişisel veri içermez ve hiçbir yere gönderilmez. Buradan ya da tarayıcı ayarlarından silebilirsiniz. Bir sayfayı internetsiz açabilmeniz için önce internetle en az bir kez açmış olmanız gerekir. Tarayıcılar yer daraldığında ya da site uzun süre kullanılmadığında (özellikle iPhone ve iPad’de) kayıtları kendiliğinden silebilir; böyle olursa maddeyi yeniden kaydedin.',
    anaEkranBaslik: 'Ana ekrana ekleyin',
    anaEkran: 'Ezber Kilimi’ni uygulama gibi açmak için tarayıcı menüsünden «Ana ekrana ekle» deyin (iPhone ve iPad’de: Paylaş, ardından «Ana Ekrana Ekle»).',
    baglanti: 'İnternetsiz çalışma: bu cihazdaki kayıtlar',
    girisAciklama: 'Madde sayfasında kaydettiğiniz ezberler, Diyanet kaydıyla birlikte internet olmadan da açılır. Kayıtları buradan yönetin.',
  },
  fr: {
    baslik: 'Travail hors ligne',
    aciklama: 'Pour que ce texte s’ouvre et se lise aussi sans internet : la page et les enregistrements de la Diyanet sont conservés uniquement sur cet appareil.',
    kaydet: 'Enregistrer pour travailler hors ligne',
    vazgec: 'Annuler',
    sil: 'Supprimer',
    silEtiket: 'Supprimer l’enregistrement de cet appareil : {ad}',
    baslangic: 'Enregistrement en cours : la page et {n} fichiers audio.',
    baslangicSessiz: 'Enregistrement en cours : la page.',
    ilerleme: '{y} sur {t} fichiers · {boyut}',
    bitti: 'Enregistré. Ce texte s’ouvre et s’écoute désormais sans internet. Total : {boyut}.',
    bittiSessiz: 'Enregistré. Cette page s’ouvre désormais sans internet. Total : {boyut}.',
    kayitli: 'Enregistré sur cet appareil',
    silindi: 'Enregistrement supprimé. Ce texte ne s’ouvre plus sans internet.',
    vazgecildi: 'Annulé. Les fichiers déjà téléchargés peuvent rester sur l’appareil ; l’enregistrement n’est pas terminé.',
    hata: 'Enregistrement impossible. Vérifiez votre connexion internet et réessayez.',
    hataKota: 'Il n’y a pas assez d’espace libre sur l’appareil. Supprimez d’abord d’autres enregistrements dans la page hors ligne.',
    cevrimdisiNot: 'Vous n’avez pas de connexion internet pour le moment. Les pages et les sons enregistrés fonctionnent ; un nouvel enregistrement demande internet.',
    liste: 'Enregistrements de cet appareil',
    gizlilik: 'Les pages et les sons enregistrés restent uniquement dans le cache de ce navigateur, sans donnée personnelle ; vous pouvez les supprimer depuis la page hors ligne.',
    sayfaBaslik: 'Travail hors ligne',
    sayfaAciklama: 'Les textes de mémorisation enregistrés sur cet appareil s’ouvrent et se lisent sans internet. Vous pouvez les supprimer ici.',
    lead: 'Pour pouvoir mémoriser sans internet ou avec une mauvaise connexion, enregistrez les textes sur cet appareil. Un texte enregistré s’ouvre hors ligne, son compris.',
    jsGerek: 'Cette page a besoin de JavaScript pour lister les enregistrements.',
    desteklenmiyor: 'Ce navigateur, ou la navigation privée, ne permet pas l’enregistrement hors ligne.',
    bagVar: 'Connexion internet disponible.',
    bagYok: 'Pas de connexion internet ; seuls les textes enregistrés sur cet appareil s’ouvrent.',
    istenenYok: 'La page demandée n’est pas enregistrée sur cet appareil et ne peut pas s’ouvrir sans internet. Vous pouvez ouvrir l’un des textes enregistrés ci-dessous.',
    kayitlarBaslik: 'Textes enregistrés sur cet appareil',
    bos: 'Aucun texte enregistré pour l’instant. Sur la page d’un texte, appuyez sur « Enregistrer pour travailler hors ligne ».',
    ozet: 'Textes : {n} · environ {boyut}',
    acilanBaslik: 'Autres pages ouvertes sur cet appareil',
    acilanNot: 'Ces pages s’ouvrent sans internet ; les sons ne se lisent que pour les textes enregistrés avec « Enregistrer pour travailler hors ligne ».',
    acilanYok: 'Aucune autre page ouverte.',
    hepsiniSil: 'Tout supprimer',
    hepsiOnay: 'Supprimer tous les enregistrements et toutes les pages ouvertes sur cet appareil ?',
    hepsiEvet: 'Oui, tout supprimer',
    hepsiVazgec: 'Annuler',
    hepsiSilindi: 'Tous les enregistrements ont été supprimés.',
    kayitSilindi: 'Enregistrement supprimé : {ad}.',
    gizlilikBaslik: 'Confidentialité et limites',
    gizlilikMetni: 'Les pages et les sons enregistrés restent uniquement dans le cache de ce navigateur, sans donnée personnelle, et ne sont envoyés nulle part. Vous pouvez les supprimer ici ou dans les réglages du navigateur. Pour ouvrir une page sans internet, il faut l’avoir ouverte au moins une fois avec internet. Le navigateur peut supprimer les enregistrements de lui-même quand l’espace manque ou que le site reste longtemps inutilisé (surtout sur iPhone et iPad) ; dans ce cas, enregistrez de nouveau le texte.',
    anaEkranBaslik: 'Ajouter à l’écran d’accueil',
    anaEkran: 'Pour ouvrir le Kilim de mémorisation comme une application, choisissez « Ajouter à l’écran d’accueil » dans le menu du navigateur (sur iPhone et iPad : Partager, puis « Sur l’écran d’accueil »).',
    baglanti: 'Travail hors ligne : enregistrements de cet appareil',
    girisAciklama: 'Les textes enregistrés sur leur page d’étude s’ouvrent aussi sans internet, avec l’enregistrement de la Diyanet. Gérez-les ici.',
  },
  en: {
    baslik: 'Offline study',
    aciklama: 'Let this text open and play even without internet: the page and the Diyanet recordings are stored on this device only.',
    kaydet: 'Save for offline study',
    vazgec: 'Cancel',
    sil: 'Delete',
    silEtiket: 'Delete the saved copy on this device: {ad}',
    baslangic: 'Saving: the page and {n} audio files.',
    baslangicSessiz: 'Saving: the page.',
    ilerleme: '{y} of {t} files · {boyut}',
    bitti: 'Saved. This text now opens and plays without internet. Total: {boyut}.',
    bittiSessiz: 'Saved. This page now opens without internet. Total: {boyut}.',
    kayitli: 'Saved on this device',
    silindi: 'Saved copy deleted. This text no longer opens without internet.',
    vazgecildi: 'Cancelled. Files already downloaded may remain on the device; saving was not completed.',
    hata: 'Could not save. Check your internet connection and try again.',
    hataKota: 'There is not enough free space on the device. First delete other saved items on the offline page.',
    cevrimdisiNot: 'You have no internet connection right now. Saved pages and recordings work; saving something new needs internet.',
    liste: 'Saved on this device',
    gizlilik: 'Saved pages and recordings stay only in this browser’s cache and contain no personal data; you can delete them on the offline page.',
    sayfaBaslik: 'Offline study',
    sayfaAciklama: 'Memorisation texts saved on this device open and play without internet. You can delete them here.',
    lead: 'So that you can memorise without internet or on a poor connection, save texts on this device. A saved text opens offline, recording included.',
    jsGerek: 'This page needs JavaScript to list what is saved.',
    desteklenmiyor: 'This browser, or a private window, does not support saving for offline use.',
    bagVar: 'Internet connection available.',
    bagYok: 'No internet connection; only texts saved on this device will open.',
    istenenYok: 'The page you asked for is not saved on this device and cannot open without internet. You can open one of the saved texts below.',
    kayitlarBaslik: 'Texts saved on this device',
    bos: 'Nothing is saved yet. On a text page, press “Save for offline study”.',
    ozet: 'Texts: {n} · about {boyut}',
    acilanBaslik: 'Other pages you have opened on this device',
    acilanNot: 'These pages open without internet; recordings play only for texts you saved with “Save for offline study”.',
    acilanYok: 'No other opened pages.',
    hepsiniSil: 'Delete all',
    hepsiOnay: 'Delete everything saved and every opened page on this device?',
    hepsiEvet: 'Yes, delete all',
    hepsiVazgec: 'Cancel',
    hepsiSilindi: 'Everything saved was deleted.',
    kayitSilindi: 'Saved copy deleted: {ad}.',
    gizlilikBaslik: 'Privacy and limits',
    gizlilikMetni: 'Saved pages and recordings stay only in this browser’s cache, contain no personal data and are sent nowhere. You can delete them here or in the browser settings. To open a page without internet you must have opened it with internet at least once. Browsers may delete saved items by themselves when space runs low or the site goes unused for a long time (especially on iPhone and iPad); if that happens, save the text again.',
    anaEkranBaslik: 'Add to the home screen',
    anaEkran: 'To open the Memorisation Kilim like an app, choose “Add to Home Screen” in the browser menu (on iPhone and iPad: Share, then “Add to Home Screen”).',
    baglanti: 'Offline study: what is saved on this device',
    girisAciklama: 'Texts you save on their study page also open without internet, together with the Diyanet recording. Manage them here.',
  },
  nl: {
    baslik: 'Offline oefenen',
    aciklama: 'Laat deze tekst ook zonder internet openen en afspelen: de pagina en de opnamen van de Diyanet worden alleen op dit apparaat bewaard.',
    kaydet: 'Opslaan om offline te oefenen',
    vazgec: 'Annuleren',
    sil: 'Verwijderen',
    silEtiket: 'De opgeslagen kopie op dit apparaat verwijderen: {ad}',
    baslangic: 'Bezig met opslaan: de pagina en {n} audiobestanden.',
    baslangicSessiz: 'Bezig met opslaan: de pagina.',
    ilerleme: '{y} van {t} bestanden · {boyut}',
    bitti: 'Opgeslagen. Deze tekst opent en speelt nu ook zonder internet. Totaal: {boyut}.',
    bittiSessiz: 'Opgeslagen. Deze pagina opent nu ook zonder internet. Totaal: {boyut}.',
    kayitli: 'Opgeslagen op dit apparaat',
    silindi: 'Opgeslagen kopie verwijderd. Deze tekst opent niet meer zonder internet.',
    vazgecildi: 'Geannuleerd. Reeds gedownloade bestanden kunnen op het apparaat blijven staan; het opslaan is niet voltooid.',
    hata: 'Opslaan is niet gelukt. Controleer uw internetverbinding en probeer het opnieuw.',
    hataKota: 'Er is niet genoeg vrije ruimte op het apparaat. Verwijder eerst andere opgeslagen items op de offlinepagina.',
    cevrimdisiNot: 'U hebt nu geen internetverbinding. Opgeslagen pagina’s en opnamen werken; voor nieuwe opslag is internet nodig.',
    liste: 'Opgeslagen op dit apparaat',
    gizlilik: 'Opgeslagen pagina’s en opnamen blijven alleen in de cache van deze browser en bevatten geen persoonsgegevens; u kunt ze verwijderen op de offlinepagina.',
    sayfaBaslik: 'Offline oefenen',
    sayfaAciklama: 'Memoriseerteksten die op dit apparaat zijn opgeslagen, openen en spelen zonder internet. Hier kunt u ze verwijderen.',
    lead: 'Om ook zonder internet of met een slechte verbinding te kunnen memoriseren, kunt u teksten op dit apparaat opslaan. Een opgeslagen tekst opent offline, inclusief de opname.',
    jsGerek: 'Deze pagina heeft JavaScript nodig om de opgeslagen items te tonen.',
    desteklenmiyor: 'Deze browser of een privévenster ondersteunt offline opslaan niet.',
    bagVar: 'Internetverbinding beschikbaar.',
    bagYok: 'Geen internetverbinding; alleen teksten die op dit apparaat zijn opgeslagen openen.',
    istenenYok: 'De gevraagde pagina is niet op dit apparaat opgeslagen en kan zonder internet niet openen. U kunt hieronder een van de opgeslagen teksten openen.',
    kayitlarBaslik: 'Op dit apparaat opgeslagen teksten',
    bos: 'Er is nog niets opgeslagen. Druk op een tekstpagina op “Opslaan om offline te oefenen”.',
    ozet: 'Teksten: {n} · ongeveer {boyut}',
    acilanBaslik: 'Andere pagina’s die u op dit apparaat hebt geopend',
    acilanNot: 'Deze pagina’s openen zonder internet; opnamen spelen alleen bij teksten die u hebt opgeslagen met “Opslaan om offline te oefenen”.',
    acilanYok: 'Geen andere geopende pagina’s.',
    hepsiniSil: 'Alles verwijderen',
    hepsiOnay: 'Alles wat op dit apparaat is opgeslagen en alle geopende pagina’s verwijderen?',
    hepsiEvet: 'Ja, alles verwijderen',
    hepsiVazgec: 'Annuleren',
    hepsiSilindi: 'Alles wat was opgeslagen is verwijderd.',
    kayitSilindi: 'Opgeslagen kopie verwijderd: {ad}.',
    gizlilikBaslik: 'Privacy en beperkingen',
    gizlilikMetni: 'Opgeslagen pagina’s en opnamen blijven alleen in de cache van deze browser, bevatten geen persoonsgegevens en worden nergens naartoe verzonden. U kunt ze hier of in de browserinstellingen verwijderen. Om een pagina zonder internet te kunnen openen, moet u ze minstens één keer met internet hebben geopend. Browsers kunnen opgeslagen items zelf verwijderen als de ruimte krap wordt of de site lang niet wordt gebruikt (vooral op iPhone en iPad); sla de tekst dan opnieuw op.',
    anaEkranBaslik: 'Aan het startscherm toevoegen',
    anaEkran: 'Om het Memorisatiekelim als een app te openen, kiest u in het browsermenu “Toevoegen aan startscherm” (op iPhone en iPad: Deel, daarna “Zet op beginscherm”).',
    baglanti: 'Offline oefenen: wat op dit apparaat is opgeslagen',
    girisAciklama: 'Teksten die u op hun oefenpagina opslaat, openen ook zonder internet, samen met de opname van de Diyanet. Beheer ze hier.',
  },
  de: {
    baslik: 'Offline üben',
    aciklama: 'Dieser Text soll auch ohne Internet geöffnet und abgespielt werden können: Die Seite und die Aufnahmen der Diyanet werden nur auf diesem Gerät gespeichert.',
    kaydet: 'Zum Offline-Üben speichern',
    vazgec: 'Abbrechen',
    sil: 'Löschen',
    silEtiket: 'Die gespeicherte Kopie auf diesem Gerät löschen: {ad}',
    baslangic: 'Wird gespeichert: die Seite und {n} Audiodateien.',
    baslangicSessiz: 'Wird gespeichert: die Seite.',
    ilerleme: '{y} von {t} Dateien · {boyut}',
    bitti: 'Gespeichert. Dieser Text öffnet und spielt jetzt auch ohne Internet. Gesamt: {boyut}.',
    bittiSessiz: 'Gespeichert. Diese Seite öffnet jetzt auch ohne Internet. Gesamt: {boyut}.',
    kayitli: 'Auf diesem Gerät gespeichert',
    silindi: 'Gespeicherte Kopie gelöscht. Dieser Text öffnet ohne Internet nicht mehr.',
    vazgecildi: 'Abgebrochen. Bereits geladene Dateien können auf dem Gerät bleiben; das Speichern wurde nicht abgeschlossen.',
    hata: 'Speichern nicht möglich. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    hataKota: 'Auf dem Gerät ist nicht genug Speicherplatz frei. Löschen Sie zuerst andere gespeicherte Texte auf der Offline-Seite.',
    cevrimdisiNot: 'Sie haben im Moment keine Internetverbindung. Gespeicherte Seiten und Aufnahmen funktionieren; zum Speichern von Neuem brauchen Sie Internet.',
    liste: 'Auf diesem Gerät gespeichert',
    gizlilik: 'Gespeicherte Seiten und Aufnahmen bleiben nur im Cache dieses Browsers und enthalten keine personenbezogenen Daten; Sie können sie auf der Offline-Seite löschen.',
    sayfaBaslik: 'Offline üben',
    sayfaAciklama: 'Auf diesem Gerät gespeicherte Auswendiglern-Texte öffnen und spielen ohne Internet. Hier können Sie sie löschen.',
    lead: 'Damit Sie auch ohne Internet oder bei schlechter Verbindung auswendig lernen können, speichern Sie Texte auf diesem Gerät. Ein gespeicherter Text öffnet offline, samt Aufnahme.',
    jsGerek: 'Diese Seite braucht JavaScript, um das Gespeicherte aufzulisten.',
    desteklenmiyor: 'Dieser Browser oder ein privates Fenster unterstützt das Speichern für die Offline-Nutzung nicht.',
    bagVar: 'Internetverbindung vorhanden.',
    bagYok: 'Keine Internetverbindung; nur auf diesem Gerät gespeicherte Texte öffnen.',
    istenenYok: 'Die gewünschte Seite ist auf diesem Gerät nicht gespeichert und lässt sich ohne Internet nicht öffnen. Sie können unten einen der gespeicherten Texte öffnen.',
    kayitlarBaslik: 'Auf diesem Gerät gespeicherte Texte',
    bos: 'Noch nichts gespeichert. Drücken Sie auf einer Textseite auf „Zum Offline-Üben speichern“.',
    ozet: 'Texte: {n} · etwa {boyut}',
    acilanBaslik: 'Weitere Seiten, die Sie auf diesem Gerät geöffnet haben',
    acilanNot: 'Diese Seiten öffnen ohne Internet; Aufnahmen spielen nur bei Texten, die Sie mit „Zum Offline-Üben speichern“ gespeichert haben.',
    acilanYok: 'Keine weiteren geöffneten Seiten.',
    hepsiniSil: 'Alles löschen',
    hepsiOnay: 'Alles Gespeicherte und alle geöffneten Seiten auf diesem Gerät löschen?',
    hepsiEvet: 'Ja, alles löschen',
    hepsiVazgec: 'Abbrechen',
    hepsiSilindi: 'Alles Gespeicherte wurde gelöscht.',
    kayitSilindi: 'Gespeicherte Kopie gelöscht: {ad}.',
    gizlilikBaslik: 'Datenschutz und Grenzen',
    gizlilikMetni: 'Gespeicherte Seiten und Aufnahmen bleiben nur im Cache dieses Browsers, enthalten keine personenbezogenen Daten und werden nirgendwohin gesendet. Sie können sie hier oder in den Browsereinstellungen löschen. Um eine Seite ohne Internet zu öffnen, müssen Sie sie mindestens einmal mit Internet geöffnet haben. Browser können Gespeichertes von selbst löschen, wenn der Platz knapp wird oder die Seite lange nicht genutzt wird (besonders auf iPhone und iPad); speichern Sie den Text dann erneut.',
    anaEkranBaslik: 'Zum Startbildschirm hinzufügen',
    anaEkran: 'Um den Memorier-Kelim wie eine App zu öffnen, wählen Sie im Browsermenü „Zum Startbildschirm hinzufügen“ (auf iPhone und iPad: Teilen, dann „Zum Home-Bildschirm“).',
    baglanti: 'Offline üben: auf diesem Gerät Gespeichertes',
    girisAciklama: 'Texte, die Sie auf ihrer Übungsseite speichern, öffnen auch ohne Internet, samt Aufnahme der Diyanet. Verwalten Sie sie hier.',
  },
};

/** Fransızca için noktalama öncesi boşluklar düzeltilir. */
const fransizca = <T>(deger: T): T => (typeof deger === 'string' ? (fransizTipografi(deger) as T) : deger);
const HAZIR: Record<Dil, CevrimdisiMetinleri> = {
  ...CEVRIMDISI,
  fr: Object.fromEntries(Object.entries(CEVRIMDISI.fr).map(([k, v]) => [k, fransizca(v)])) as unknown as CevrimdisiMetinleri,
};

export const cevrimdisiMetinleri = (dil: Dil): CevrimdisiMetinleri => HAZIR[dil];

