/**
 * Ders günü ezber takvimi metinleri (25 Ekim 2026): giriş sayfasındaki «Derste bu hafta» bandı, /<dil>/takvim/ sayfası ve çalışma sayfalarındaki
 * «Derste:» satırı. Beş dil `Record<Dil, …>` ile zorunlu (docs/DIL-NL-DE.md): nl «u», de «Sie»; ders alanı adları veli portalıyla aynı
 * (src/i18n/veli.ts: Croyance · Geloofsleer · Glaubenslehre…). Yeni dinî metin, okunuş ya da ses YOKTUR; yalnız arayüz metni. Fransızca metin kaynakta düz
 * boşlukla yazılır; `takvimMetinleri('fr')` `fransizTipografi` ile ince/bölünmez boşluk koyar. Tarihler metne değil Intl'e bırakılır
 * (src/lib/ezber/ders-takvimi.ts): metinlerde `{tarih}`, `{aralik}`, `{a}`, `{b}`, `{n}` yer tutucuları vardır.
 */
import type { Dil } from '@ortak/i18n/ui';
import type { DersKipi, GrupKodu } from '@ortak/lib/ezber/ders-takvimi';
import { fransizTipografi } from './metinler';

export interface TakvimMetinleri {
  /** Takvim sayfası. */
  baslik: string;
  aciklama: string;
  lead: string;
  notlar: readonly string[];
  yazdir: string;
  aylarEtiket: string;
  /** «Giriş sayfasındaki band». */
  bandBaslik: string;
  /** {aralik}: bugünü kapsayan hafta sonunun aralığı. */
  bandBu: string;
  /** {tarih}: sıradaki ders günü (hafta sonunun ilk günü). */
  bandSiradaki: string;
  bandBitti: string;
  bandTumu: string;
  bandNoJs: string;
  bugun: string;
  gunKipi: Readonly<Record<DersKipi, string>>;
  /** Grup başlıkları (cümle başı büyük) ve «Derste:» satırında kullanılan küçük harfli kısa adlar. */
  grup: Readonly<Record<GrupKodu, string>>;
  grupKisa: Readonly<Record<GrupKodu, string>>;
  gunBos: string;
  /** Madde eki: {a}, {b} âyet sınırları; {n} bölüm numarası. */
  ayetTek: string;
  ayetAralik: string;
  bolum: string;
  /** Çalışma sayfasındaki satır: «{dersOnek} <tarih> (<gruplar>)». */
  dersOnek: string;
  /** Alt bilgi ve öteki sayfalardaki bağlantı; giriş sayfasındaki «Kendi çalışmanız için» satırının açıklaması. */
  baglanti: string;
  araclarAciklama: string;
}

const TAKVIM: Record<Dil, TakvimMetinleri> = {
  tr: {
    baslik: 'Ezber takvimi',
    aciklama: 'Hangi ezberin hangi ders gününde çalışıldığını görün: ezber köşesinde yeni, pekiştirilen ve tekrar edilen metinler ile öteki derslerin ezberleri; her biri çalışma sayfasına bağlı.',
    lead: 'Her Kur’an dersinin son dakikalarında bir ezber köşesi vardır. Aşağıda bu yıl hangi gün hangi ezberin çalışılacağını görürsünüz; öteki derslerde (İtikat, İbadet, Siyer) ezberlenecek metinler de ayrıca yazılıdır. Bağlantılı her ezberin kendi çalışma sayfası vardır: dinleyin, tekrar edin, kendinizi sınayın.',
    notlar: [
      'Çoğu hafta sonu Cumartesi günü yeni ezber başlar, Pazar günü pekiştirilir; tatil Pazartesileri tekrar içindir.',
      'Çocukların tek tek dinlenmesi sınıfta hoca tarafından yapılır; bu sayfa yalnız hangi ezberlerin çalışıldığını gösterir.',
      'Bilgi maddeleri ve niyetler ezber köşesinde değil, ilgili derslerde (İtikat, İbadet, Siyer) işlenir.',
      'Sınıfın ilerleyişine göre program küçük kaydırmalar gösterebilir.',
    ],
    yazdir: 'Takvimi yazdır',
    aylarEtiket: 'Aylar',
    bandBaslik: 'Derste bu hafta',
    bandBu: 'Bu haftanın dersleri: {aralik}',
    bandSiradaki: 'Sıradaki ders: {tarih}',
    bandBitti: 'Bu ders yılının dersleri tamamlandı. Geçen ayların ezberlerine yıllık takvimden bakabilirsiniz.',
    bandTumu: 'Bütün yılın takvimi',
    bandNoJs: 'Bu hafta sonu hangi ezberlerin çalışılacağını yıllık takvimde bulabilirsiniz.',
    bugun: 'Bugün',
    gunKipi: {
      kose: 'Ezber köşesi (dersin son dakikaları)',
      'plan-ezber': 'Kur’an dersi bu gün ezber dersi',
      tekrar: 'Tekrar günü',
      'tam-ders': 'Kur’an dersinin tamamı ezber',
    },
    grup: {
      yeni: 'Yeni ezber', pekistir: 'Pekiştirme', dinleme: 'Dinleme', kalici: 'Tekrar ve kalıcı tur', plan: 'Dersin ezberi (plan)', diger: 'Diğer derslerin ezberi',
    },
    grupKisa: {
      yeni: 'yeni ezber', pekistir: 'pekiştirme', dinleme: 'dinleme', kalici: 'tekrar ve kalıcı tur', plan: 'dersin ezberi', diger: 'diğer derslerin ezberi',
    },
    gunBos: 'Bu gün için ayrı bir ezber maddesi yok.',
    ayetTek: '{a}. âyet',
    ayetAralik: '{a}–{b}. âyetler',
    bolum: '{n}. bölüm',
    dersOnek: 'Derste:',
    baglanti: 'Ders günü ezber takvimi',
    araclarAciklama: 'Hangi ezberin hangi ders gününde çalışıldığını bütün yıl boyunca görün.',
  },
  fr: {
    baslik: 'Calendrier de mémorisation',
    aciklama: 'Voyez quel texte est travaillé quel jour de cours : textes nouveaux, consolidés et révisés au coin mémorisation, et ceux des autres cours ; chacun renvoie à sa page de travail.',
    lead: 'À la fin de chaque cours de Coran, il y a un coin mémorisation. Vous voyez ci-dessous quel texte est travaillé quel jour cette année ; les textes à mémoriser dans les autres cours (croyance, adoration, vie du Prophète) sont indiqués à part. Chaque texte avec un lien a sa propre page de travail : écoutez, répétez, testez-vous.',
    notlar: [
      'La plupart des week-ends, un texte nouveau commence le samedi et se consolide le dimanche ; les lundis de vacances servent à réviser.',
      'L’écoute individuelle des enfants se fait en classe, avec l’enseignant ; cette page indique seulement quels textes sont travaillés.',
      'Les connaissances et les intentions (niyya) ne se travaillent pas au coin mémorisation, mais dans les cours concernés (croyance, adoration, vie du Prophète).',
      'Le programme peut connaître de petits décalages selon l’avancement de la classe.',
    ],
    yazdir: 'Imprimer le calendrier',
    aylarEtiket: 'Mois',
    bandBaslik: 'En classe cette semaine',
    bandBu: 'Cours de cette semaine : {aralik}',
    bandSiradaki: 'Prochain cours : {tarih}',
    bandBitti: 'Les cours de cette année scolaire sont terminés. Retrouvez les textes des mois passés dans le calendrier annuel.',
    bandTumu: 'Calendrier de toute l’année',
    bandNoJs: 'Retrouvez dans le calendrier annuel les textes travaillés ce week-end.',
    bugun: 'Aujourd’hui',
    gunKipi: {
      kose: 'Coin mémorisation (fin du cours)',
      'plan-ezber': 'Le cours de Coran est aujourd’hui un cours de mémorisation',
      tekrar: 'Journée de révision',
      'tam-ders': 'Tout le cours de Coran est consacré à la mémorisation',
    },
    grup: {
      yeni: 'Nouveau à mémoriser', pekistir: 'Consolidation', dinleme: 'Écoute', kalici: 'Révision et contrôle durable', plan: 'Mémorisation du cours (programme)', diger: 'Mémorisation dans les autres cours',
    },
    grupKisa: {
      yeni: 'nouveau à mémoriser', pekistir: 'consolidation', dinleme: 'écoute', kalici: 'révision et contrôle durable', plan: 'mémorisation du cours', diger: 'mémorisation dans les autres cours',
    },
    gunBos: 'Pas de texte à mémoriser prévu ce jour-là.',
    ayetTek: 'verset {a}',
    ayetAralik: 'versets {a}–{b}',
    bolum: 'partie {n}',
    dersOnek: 'En classe :',
    baglanti: 'Calendrier de mémorisation des cours',
    araclarAciklama: 'Voyez toute l’année quel texte est travaillé quel jour de cours.',
  },
  en: {
    baslik: 'Memorisation calendar',
    aciklama: 'See which text is practised on which lesson day: new, consolidated and revised texts in the memorisation corner, plus those from the other lessons; each links to its practice page.',
    lead: 'Every Qur’an lesson ends with a memorisation corner. Below you can see which text is worked on each day this year; texts to memorise in the other lessons (creed, worship, the life of the Prophet) are listed separately. Every text with a link has its own practice page: listen, repeat, test yourself.',
    notlar: [
      'On most lesson weekends a new text starts on Saturday and is consolidated on Sunday; holiday Mondays are for review.',
      'Individual listening is done in class by the teacher; this page only shows which texts are being worked on.',
      'Knowledge items and intentions (niyyah) are not part of the memorisation corner; they are taught in the relevant lessons (creed, worship, the life of the Prophet).',
      'The programme may shift slightly as the class progresses.',
    ],
    yazdir: 'Print the calendar',
    aylarEtiket: 'Months',
    bandBaslik: 'In class this week',
    bandBu: 'This week’s lessons: {aralik}',
    bandSiradaki: 'Next lesson: {tarih}',
    bandBitti: 'This year’s lessons are over. You can look back at earlier months in the yearly calendar.',
    bandTumu: 'The whole year’s calendar',
    bandNoJs: 'Find the texts being practised this weekend in the yearly calendar.',
    bugun: 'Today',
    gunKipi: {
      kose: 'Memorisation corner (end of the lesson)',
      'plan-ezber': 'Today’s Qur’an lesson is a memorisation lesson',
      tekrar: 'Review day',
      'tam-ders': 'The whole Qur’an lesson is memorisation',
    },
    grup: {
      yeni: 'New to memorise', pekistir: 'Consolidation', dinleme: 'Listening', kalici: 'Review and lasting check', plan: 'Lesson memorisation (programme)', diger: 'Memorisation in other lessons',
    },
    grupKisa: {
      yeni: 'new to memorise', pekistir: 'consolidation', dinleme: 'listening', kalici: 'review and lasting check', plan: 'lesson memorisation', diger: 'memorisation in other lessons',
    },
    gunBos: 'No separate text to memorise on this day.',
    ayetTek: 'verse {a}',
    ayetAralik: 'verses {a}–{b}',
    bolum: 'part {n}',
    dersOnek: 'In class:',
    baglanti: 'Lesson-day memorisation calendar',
    araclarAciklama: 'See all year which text is practised on which lesson day.',
  },
  nl: {
    baslik: 'Memoriseerkalender',
    aciklama: 'Bekijk welke tekst op welke lesdag wordt geoefend: nieuwe, verstevigde en herhaalde teksten in de memoriseerhoek en die van de andere lessen; elk met een link naar de oefenpagina.',
    lead: 'Elke Koranles eindigt met een memoriseerhoek. Hieronder ziet u welke tekst dit jaar op welke dag wordt geoefend; de teksten die in de andere lessen (geloofsleer, eredienst, leven van de Profeet) worden gememoriseerd, staan apart vermeld. Elke tekst met een link heeft een eigen oefenpagina: luister, herhaal, test uzelf.',
    notlar: [
      'In de meeste lesweekenden begint op zaterdag een nieuwe tekst en wordt die op zondag verstevigd; vrije maandagen zijn voor herhaling.',
      'Het individueel beluisteren van de kinderen gebeurt in de klas door de leraar; deze pagina toont alleen welke teksten worden geoefend.',
      'Kennisonderdelen en intenties (niyyah) horen niet bij de memoriseerhoek; ze komen aan bod in de betreffende lessen (geloofsleer, eredienst, leven van de Profeet).',
      'Het programma kan licht verschuiven naarmate de klas vordert.',
    ],
    yazdir: 'Kalender afdrukken',
    aylarEtiket: 'Maanden',
    bandBaslik: 'Deze week in de les',
    bandBu: 'Lessen van deze week: {aralik}',
    bandSiradaki: 'Volgende les: {tarih}',
    bandBitti: 'De lessen van dit schooljaar zijn afgelopen. Eerdere maanden vindt u terug in de jaarkalender.',
    bandTumu: 'Kalender van het hele jaar',
    bandNoJs: 'In de jaarkalender vindt u welke teksten dit weekend worden geoefend.',
    bugun: 'Vandaag',
    gunKipi: {
      kose: 'Memoriseerhoek (einde van de les)',
      'plan-ezber': 'De Koranles is vandaag een memoriseerles',
      tekrar: 'Herhalingsdag',
      'tam-ders': 'De hele Koranles is memoriseren',
    },
    grup: {
      yeni: 'Nieuw te leren', pekistir: 'Verstevigen', dinleme: 'Luisteren', kalici: 'Herhaling en blijvende controle', plan: 'Memoriseren van de les (programma)', diger: 'Memoriseren in de andere lessen',
    },
    grupKisa: {
      yeni: 'nieuw te leren', pekistir: 'verstevigen', dinleme: 'luisteren', kalici: 'herhaling en blijvende controle', plan: 'memoriseren van de les', diger: 'memoriseren in de andere lessen',
    },
    gunBos: 'Geen aparte tekst om te memoriseren op deze dag.',
    ayetTek: 'vers {a}',
    ayetAralik: 'verzen {a}–{b}',
    bolum: 'deel {n}',
    dersOnek: 'In de les:',
    baglanti: 'Memoriseerkalender van de lesdagen',
    araclarAciklama: 'Zie het hele jaar welke tekst op welke lesdag wordt geoefend.',
  },
  de: {
    baslik: 'Memorierkalender',
    aciklama: 'Sehen Sie, welcher Text an welchem Unterrichtstag geübt wird: neue, gefestigte und wiederholte Texte in der Memorierecke sowie die aus den anderen Fächern; jeder führt zur Übungsseite.',
    lead: 'Jeder Koranunterricht endet mit einer Memorierecke. Unten sehen Sie, welcher Text in diesem Jahr an welchem Tag geübt wird; Texte, die in den anderen Fächern (Glaubenslehre, Gottesdienst, Leben des Propheten) auswendig gelernt werden, stehen gesondert. Zu jedem verlinkten Text gibt es eine eigene Übungsseite: anhören, nachsprechen, sich selbst abfragen.',
    notlar: [
      'An den meisten Unterrichtswochenenden beginnt am Samstag ein neuer Text und wird am Sonntag gefestigt; die Montage in den Ferien dienen der Wiederholung.',
      'Das einzelne Abhören der Kinder übernimmt der Lehrer im Unterricht; diese Seite zeigt nur, welche Texte geübt werden.',
      'Wissensstoffe und Absichtserklärungen (Niyya) gehören nicht zur Memorierecke; sie werden in den jeweiligen Fächern behandelt (Glaubenslehre, Gottesdienst, Leben des Propheten).',
      'Das Programm kann sich je nach Fortschritt der Klasse leicht verschieben.',
    ],
    yazdir: 'Kalender drucken',
    aylarEtiket: 'Monate',
    bandBaslik: 'Diese Woche im Unterricht',
    bandBu: 'Unterricht dieser Woche: {aralik}',
    bandSiradaki: 'Nächster Unterricht: {tarih}',
    bandBitti: 'Der Unterricht dieses Schuljahres ist zu Ende. Frühere Monate finden Sie im Jahreskalender.',
    bandTumu: 'Kalender für das ganze Jahr',
    bandNoJs: 'Welche Texte an diesem Wochenende geübt werden, finden Sie im Jahreskalender.',
    bugun: 'Heute',
    gunKipi: {
      kose: 'Memorierecke (Ende des Unterrichts)',
      'plan-ezber': 'Der Koranunterricht ist heute eine Memorierstunde',
      tekrar: 'Wiederholungstag',
      'tam-ders': 'Der ganze Koranunterricht ist Auswendiglernen',
    },
    grup: {
      yeni: 'Neu auswendig lernen', pekistir: 'Festigen', dinleme: 'Zuhören', kalici: 'Wiederholung und Dauerkontrolle', plan: 'Auswendiglernen der Stunde (Plan)', diger: 'Auswendiglernen in den anderen Fächern',
    },
    grupKisa: {
      yeni: 'neu auswendig lernen', pekistir: 'festigen', dinleme: 'zuhören', kalici: 'Wiederholung und Dauerkontrolle', plan: 'Auswendiglernen der Stunde', diger: 'Auswendiglernen in den anderen Fächern',
    },
    gunBos: 'Für diesen Tag steht kein eigener Text zum Auswendiglernen an.',
    ayetTek: 'Vers {a}',
    ayetAralik: 'Verse {a}–{b}',
    bolum: 'Teil {n}',
    dersOnek: 'Im Unterricht:',
    baglanti: 'Memorierkalender der Unterrichtstage',
    araclarAciklama: 'Sehen Sie das ganze Jahr, welcher Text an welchem Unterrichtstag geübt wird.',
  },
};

/** Fransızca için noktalama öncesi boşluklar düzeltilir (iç içe nesne ve diziler dâhil). */
function fransizca<T>(deger: T): T {
  if (typeof deger === 'string') return fransizTipografi(deger) as T;
  if (Array.isArray(deger)) return deger.map((x) => fransizca(x)) as T;
  if (deger && typeof deger === 'object') return Object.fromEntries(Object.entries(deger).map(([k, v]) => [k, fransizca(v)])) as T;
  return deger;
}
const HAZIR: Record<Dil, TakvimMetinleri> = { ...TAKVIM, fr: fransizca(TAKVIM.fr) };

export const takvimMetinleri = (dil: Dil): TakvimMetinleri => HAZIR[dil];
