/**
 * «Kilimim · kendi çalışmam» metinleri (25 Ekim 2026). Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md): nl «u», de «Sie»;
 * fr/en «kilim», nl/de «kelim» (KILIM_METINLERI ile aynı); «hoca» nl/de'de «leerkracht»/«Lehrkraft» (Çalışma Belgesi ile aynı).
 *
 * BAĞLAYICI AYRIM: bu sayfa hocanın dinleyip verdiği basamağı değil, yalnız çocuğun bu cihazdaki kendi çalışmasını gösterir. Bu yüzden
 * hocanın basamak adları (Çalışıyor · Hocaya okudu · Pekişti · Kalıcı), «rozet», «mühür» ve «sertifika» burada kullanılmaz; dokuların
 * adları yalnız cihazdaki iki alandan (`son`, `kutu`) türeyen kendi durumlarını söyler. «Hocanın dinlediği ezberler veli portalındaki
 * kilimde görünür» cümlesi zorunludur (sayfada ve kâğıtta). Fransızca metin kaynakta düz boşlukla yazılır; `kilimimMetinleri('fr')`
 * `fransizTipografi` ile ince/bölünmez boşluk koyar.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export interface KilimimMetinleri {
  /** Sayfa başlığı = kâğıdın başlığı = kilimin erişilebilir adı. */
  baslik: string;
  aciklama: string;
  lead: string;
  /** Zorunlu tek satır: hocanın dinlediği ezberler veli portalındaki kilimde görünür. */
  fark: string;
  /** Kâğıttaki ayrım cümlesi (iki cümle). */
  ayrim: string;
  gizlilik: string;
  jsGerek: string;
  bosBaslik: string;
  bosMetin: string;
  /** Kilimin yanındaki açıklama başlığı. */
  lejantBaslik: string;
  /** Ad alanının ipucu (kâğıtta elle yazmak için çizgi kalır). */
  adIpucu: string;
  /** Dört dokunun açıklaması (0…3); 2. doku bir aralık söyler. */
  doku: readonly [string, string, string, string];
  /** Aynı dokular tek maddede: 2. doku «{b} / 5» basamağını söyler. */
  dokuMadde: readonly [string, string, string, string];
  /** Özet satırları: {n} {m} {k}. */
  ozetBasladi: string;
  ozetTakvim: string;
  ozetGun: string;
  /** Metin karşılığı: «Şerit şerit» listesi. */
  liste: string;
  sayfasiz: string;
  /** «son çalışma: {t}» */
  sonCalisma: string;
  /** Giriş sayfası, alt bilgi, «Bugün tekrar» bandı ve madde sayfalarındaki bağlantı. */
  baglanti: string;
}

const KILIMIM: Record<Dil, KilimimMetinleri> = {
  tr: {
    baslik: 'Kilimim · kendi çalışmam',
    aciklama: 'Bu cihazdaki kendi çalışmanızdan çizilen kilim. Hocanın verdiği basamak değildir; hiçbir veri gönderilmez.',
    lead: 'Bu cihazda çalıştığınız her ezber kilimde bir motif olur. Motif, ezbere çalıştıkça ve «Kendini sına» ile tekrar ettikçe kurşun kalemle doldurulur gibi değişir.',
    fark: 'Hocanın dinlediği ezberler veli portalındaki kilimde görünür.',
    ayrim: 'Bu kilim, hocanın verdiği basamağı değil, yalnızca bu cihazda yapılan kendi çalışmayı gösterir. Hocanın dinlediği ezberler veli portalındaki kilimde görünür.',
    gizlilik: 'Gizlilik: Kilim yalnız bu cihazdaki çalışma kaydınızdan çizilir; hiçbir yere gönderilmez ve bu sayfa kayıt yazmaz. Yazdığınız ad da kaydedilmez, sayfayı kapatınca silinir.',
    jsGerek: 'Bu sayfa, çalışma kaydınızı bu cihazdan okumak için JavaScript gerektirir.',
    bosBaslik: 'Bu cihazda henüz çalışma kaydı yok',
    bosMetin: 'Kilim, bu cihazda çalıştığınız ezberlerden çizilir. Bir ezbere çalışmaya başlayın, sonra buraya dönün.',
    lejantBaslik: 'Kilimi okumak',
    adIpucu: 'Boş bırakırsanız kâğıtta elle yazmanız için bir çizgi kalır.',
    doku: ['Çalışılmadı', 'Çalışmaya başladım', 'Tekrar takvimine girdi (1–4 / 5)', 'Son tekrar basamağında (5 / 5)'],
    dokuMadde: ['çalışılmadı', 'çalışmaya başladım', 'tekrar takvimine girdi ({b} / 5)', 'son tekrar basamağında (5 / 5)'],
    ozetBasladi: 'Çalışmaya başlanan ezber: {n} / {m}',
    ozetTakvim: 'Tekrar takviminde: {n}',
    ozetGun: 'Son üç haftada çalışılan gün: {k}',
    liste: 'Şerit şerit',
    sayfasiz: 'çalışma sayfası yok',
    sonCalisma: 'son çalışma: {t}',
    baglanti: 'Kilimim: kendi çalışmam',
  },
  fr: {
    baslik: 'Mon kilim · mon travail personnel',
    aciklama: 'Le kilim tissé à partir de votre travail personnel sur cet appareil. Ce n’est pas l’étape attribuée par l’enseignant ; aucune donnée n’est envoyée.',
    lead: 'Chaque texte que vous travaillez sur cet appareil devient un motif du kilim. Le motif se remplit comme au crayon à mesure que vous le travaillez et le révisez avec « Se tester ».',
    fark: 'Les textes écoutés par l’enseignant apparaissent dans le kilim du portail des parents.',
    ayrim: 'Ce kilim montre uniquement le travail personnel fait sur cet appareil, pas l’étape attribuée par l’enseignant. Les textes écoutés par l’enseignant apparaissent dans le kilim du portail des parents.',
    gizlilik: 'Confidentialité : le kilim est dessiné uniquement à partir de votre suivi sur cet appareil ; rien n’est envoyé et cette page n’écrit rien. Le nom saisi n’est pas enregistré et disparaît à la fermeture de la page.',
    jsGerek: 'Cette page a besoin de JavaScript pour lire votre suivi sur cet appareil.',
    bosBaslik: 'Aucun suivi de travail sur cet appareil pour l’instant',
    bosMetin: 'Le kilim est dessiné à partir des textes que vous avez travaillés sur cet appareil. Commencez un texte, puis revenez ici.',
    lejantBaslik: 'Lire le kilim',
    adIpucu: 'Si vous le laissez vide, une ligne reste sur la feuille pour l’écrire à la main.',
    doku: ['Pas encore travaillé', 'J’ai commencé à travailler', 'Entré dans le calendrier de révision (1 à 4 sur 5)', 'À la dernière étape de révision (5 sur 5)'],
    dokuMadde: ['pas encore travaillé', 'j’ai commencé à travailler', 'entré dans le calendrier de révision (étape {b} sur 5)', 'à la dernière étape de révision (5 sur 5)'],
    ozetBasladi: 'Textes commencés : {n} sur {m}',
    ozetTakvim: 'Dans le calendrier de révision : {n}',
    ozetGun: 'Jours de travail ces trois dernières semaines : {k}',
    liste: 'Bande par bande',
    sayfasiz: 'pas de page de travail',
    sonCalisma: 'dernier travail : {t}',
    baglanti: 'Mon kilim : mon travail personnel',
  },
  en: {
    baslik: 'My kilim · my own practice',
    aciklama: 'The kilim drawn from your own practice on this device. It is not a stage awarded by a teacher; no data is sent anywhere.',
    lead: 'Every text you practise on this device becomes a motif in the kilim. The motif fills in, as if shaded in pencil, as you practise it and review it with “Test yourself”.',
    fark: 'The texts a teacher has listened to appear in the kilim in the parents’ portal.',
    ayrim: 'This kilim shows only the practice done on this device, not a stage awarded by a teacher. The texts a teacher has listened to appear in the kilim in the parents’ portal.',
    gizlilik: 'Privacy: the kilim is drawn only from the progress stored on this device; nothing is sent and this page writes nothing. The name you type is not saved and disappears when you close the page.',
    jsGerek: 'This page needs JavaScript to read your progress from this device.',
    bosBaslik: 'No study record on this device yet',
    bosMetin: 'The kilim is drawn from the texts you have practised on this device. Start on a text, then come back here.',
    lejantBaslik: 'Reading the kilim',
    adIpucu: 'If you leave it empty, a line remains on the sheet to write it by hand.',
    doku: ['Not practised yet', 'I have started practising', 'In my review schedule (stage 1–4 of 5)', 'At the last review stage (5 of 5)'],
    dokuMadde: ['not practised yet', 'started practising', 'in my review schedule (stage {b} of 5)', 'at the last review stage (5 of 5)'],
    ozetBasladi: 'Texts started: {n} of {m}',
    ozetTakvim: 'In the review schedule: {n}',
    ozetGun: 'Days practised in the last three weeks: {k}',
    liste: 'Band by band',
    sayfasiz: 'no practice page',
    sonCalisma: 'last practised: {t}',
    baglanti: 'My kilim: my own practice',
  },
  nl: {
    baslik: 'Mijn kelim · mijn eigen oefening',
    aciklama: 'De kelim getekend uit uw eigen oefening op dit apparaat. Het is niet de stap die een leerkracht toekent; er worden geen gegevens verstuurd.',
    lead: 'Elke tekst die u op dit apparaat oefent, wordt een motief in de kelim. Het motief vult zich als met potlood naarmate u het oefent en herhaalt met “Uzelf toetsen”.',
    fark: 'De teksten waarnaar een leerkracht heeft geluisterd, staan in de kelim in het ouderportaal.',
    ayrim: 'Deze kelim toont alleen de eigen oefening op dit apparaat, niet de stap die een leerkracht toekent. De teksten waarnaar een leerkracht heeft geluisterd, staan in de kelim in het ouderportaal.',
    gizlilik: 'Privacy: de kelim wordt alleen getekend uit uw voortgang op dit apparaat; er wordt niets verstuurd en deze pagina schrijft niets weg. De naam die u typt wordt niet opgeslagen en verdwijnt zodra u de pagina sluit.',
    jsGerek: 'Deze pagina heeft JavaScript nodig om uw voortgang op dit apparaat te lezen.',
    bosBaslik: 'Nog geen oefengegevens op dit apparaat',
    bosMetin: 'De kelim wordt getekend uit de teksten die u op dit apparaat hebt geoefend. Begin met een tekst en kom daarna hier terug.',
    lejantBaslik: 'De kelim lezen',
    adIpucu: 'Laat u het leeg, dan blijft er op het blad een lijn over om het met de hand in te vullen.',
    doku: ['Nog niet geoefend', 'Ik ben begonnen met oefenen', 'In mijn herhaalschema (stap 1–4 van 5)', 'Op de laatste herhaalstap (5 van 5)'],
    dokuMadde: ['nog niet geoefend', 'begonnen met oefenen', 'in mijn herhaalschema (stap {b} van 5)', 'op de laatste herhaalstap (5 van 5)'],
    ozetBasladi: 'Teksten waaraan begonnen is: {n} van {m}',
    ozetTakvim: 'In het herhaalschema: {n}',
    ozetGun: 'Dagen geoefend in de laatste drie weken: {k}',
    liste: 'Band per band',
    sayfasiz: 'geen oefenpagina',
    sonCalisma: 'laatst geoefend: {t}',
    baglanti: 'Mijn kelim: mijn eigen oefening',
  },
  de: {
    baslik: 'Mein Kelim · mein eigenes Üben',
    aciklama: 'Der Kelim, gezeichnet aus Ihrem eigenen Üben auf diesem Gerät. Es ist keine von einer Lehrkraft vergebene Stufe; es werden keine Daten gesendet.',
    lead: 'Jeder Text, den Sie auf diesem Gerät üben, wird zu einem Motiv im Kelim. Das Motiv füllt sich wie mit Bleistift, je mehr Sie es üben und mit „Sich prüfen“ wiederholen.',
    fark: 'Die Texte, denen eine Lehrkraft zugehört hat, erscheinen im Kelim des Elternportals.',
    ayrim: 'Dieser Kelim zeigt nur das eigene Üben auf diesem Gerät, nicht die von einer Lehrkraft vergebene Stufe. Die Texte, denen eine Lehrkraft zugehört hat, erscheinen im Kelim des Elternportals.',
    gizlilik: 'Datenschutz: Der Kelim wird ausschließlich aus Ihrem Lernstand auf diesem Gerät gezeichnet; nichts wird gesendet und diese Seite schreibt nichts. Der eingegebene Name wird nicht gespeichert und verschwindet beim Schließen der Seite.',
    jsGerek: 'Diese Seite braucht JavaScript, um Ihren Lernstand von diesem Gerät zu lesen.',
    bosBaslik: 'Noch kein Lernstand auf diesem Gerät',
    bosMetin: 'Der Kelim wird aus den Texten gezeichnet, die Sie auf diesem Gerät geübt haben. Beginnen Sie mit einem Text und kehren Sie dann hierher zurück.',
    lejantBaslik: 'Den Kelim lesen',
    adIpucu: 'Lassen Sie das Feld leer, bleibt auf dem Blatt eine Linie zum handschriftlichen Eintragen.',
    doku: ['Noch nicht geübt', 'Ich habe angefangen zu üben', 'In meinem Wiederholungsplan (Stufe 1–4 von 5)', 'Auf der letzten Wiederholungsstufe (5 von 5)'],
    dokuMadde: ['noch nicht geübt', 'angefangen zu üben', 'in meinem Wiederholungsplan (Stufe {b} von 5)', 'auf der letzten Wiederholungsstufe (5 von 5)'],
    ozetBasladi: 'Begonnene Texte: {n} von {m}',
    ozetTakvim: 'Im Wiederholungsplan: {n}',
    ozetGun: 'Geübte Tage in den letzten drei Wochen: {k}',
    liste: 'Streifen für Streifen',
    sayfasiz: 'keine Übungsseite',
    sonCalisma: 'zuletzt geübt: {t}',
    baglanti: 'Mein Kelim: mein eigenes Üben',
  },
};

/** Fransızca için noktalama öncesi boşluklar düzeltilir. */
function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (Array.isArray(deger)) return deger.map((x) => fransizca(x)) as T;
  return deger;
}
const HAZIR: Record<Dil, KilimimMetinleri> = {
  ...KILIMIM,
  fr: Object.fromEntries(Object.entries(KILIMIM.fr).map(([k, v]) => [k, fransizca(v)])) as unknown as KilimimMetinleri,
};

export const kilimimMetinleri = (dil: Dil): KilimimMetinleri => HAZIR[dil];
