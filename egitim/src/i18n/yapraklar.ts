/**
 * Yazdırılabilir Çalışma Yaprakları Arşivi metinleri (İlim Yolu · 26 Kasım 2026): beş dil zorunlu.
 * İki yaş grubu (4–8 yaş Minikler · Camiye Gidiyorum 1 ve Elifbâ; 9–13 yaş Büyükler · Camiye Gidiyorum 2, Temel Dinî Bilgiler ve Tecvid)
 * yıllık plan müfredatına göre düzenlenmiştir.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export interface YaprakKart {
  readonly id: string;
  readonly yas: '4-8' | '9-13';
  readonly alan: 'kuran' | 'itikat' | 'ibadet' | 'siyer' | 'ahlak';
  readonly pdf: string;
  readonly sayfa: string; // dil önekinden sonraki etkileşimli yol (ör. okuma/cark/)
  readonly baslik: Record<Dil, string>;
  readonly ozet: Record<Dil, string>;
  readonly kaynak: Record<Dil, string>;
}

export const YAPRAK_LISTESI: readonly YaprakKart[] = [
  {
    id: '4-8-elifba-harfler',
    yas: '4-8',
    alan: 'kuran',
    pdf: '/dosyalar/yapraklar/4-8-elifba-harfler.pdf',
    sayfa: 'okuma/cark/',
    baslik: {
      tr: 'Elifbâ Harfleri: Tanı, Eşleştir ve Boya',
      fr: 'Lettres d’Elifbâ : reconnaître, relier et colorier',
      en: 'Elifba Letters: Recognise, Match and Colour',
      nl: 'Elifba-letters: herkennen, verbinden en kleuren',
      de: 'Elifba-Buchstaben: Erkennen, Zuordnen und Ausmalen',
    },
    ozet: {
      tr: 'Elif, Bâ, Tâ, Se, Cîm grubu başta–ortada–sonda şekilleri, nokta sayısı boyama etkinliği ve Sesli Çarkıfelek karekodu.',
      fr: 'Formes des lettres (début, milieu, fin), coloriage selon le nombre de points et code QR vers la Roue sonore.',
      en: 'Beginning/middle/end letter shapes, dot-counting colouring task and QR link to the Audio Reading Wheel.',
      nl: 'Begin-, midden- en eindvormen van letters, kleurplaat op puntjes en QR-link naar het Geluidswiel.',
      de: 'Anfangs-, Mittel- und Endformen, Punkte-Ausmalaufgabe und QR-Code zum Vorlese-Glücksrad.',
    },
    kaynak: {
      tr: 'Elifbâ · Ders 1–6 (Kur’an Okuma)',
      fr: 'Elifbâ · Leçons 1 à 6 (Lecture)',
      en: 'Elifba · Lessons 1–6 (Reading)',
      nl: 'Elifba · Les 1–6 (Koranlezen)',
      de: 'Elifba · Lektion 1–6 (Lesen)',
    },
  },
  {
    id: '4-8-iman-ve-islam',
    yas: '4-8',
    alan: 'itikat',
    pdf: '/dosyalar/yapraklar/4-8-iman-ve-islam.pdf',
    sayfa: 'yollar/plan-itikat/',
    baslik: {
      tr: 'Benim Dinim İslam ve İman Ağacımız',
      fr: 'Ma religion est l’islam & l’arbre de la foi',
      en: 'My Religion Is Islam & Our Tree of Faith',
      nl: 'Mijn godsdienst is de islam & onze geloofsboom',
      de: 'Meine Religion ist der Islam & unser Glaubensbaum',
    },
    ozet: {
      tr: 'Kelime-i Tevhid, İslam’ın 3 boyutu (inanç–ibadet–ahlâk) ve iman ağacı boyama etkinliği.',
      fr: 'Attestation de foi, les trois dimensions de l’islam (foi, adoration, éthique) et arbre de la foi à compléter.',
      en: 'Kalima Tawhid, the 3 pillars of practice (faith, worship, ethics) and a faith-tree completion activity.',
      nl: 'Geloofsgetuigenis, drie pijlers (geloof, aanbidding, ethiek) en invulopdracht rond de geloofsboom.',
      de: 'Glaubensbekenntnis, drei Säulen (Glaube, Gottesdienst, Ethik) und Ausmalbaum zum Glauben.',
    },
    kaynak: {
      tr: 'Camiye Gidiyorum 1 · s. 11–24, 85–90',
      fr: 'Camiye Gidiyorum 1 · p. 11–24, 85–90',
      en: 'Camiye Gidiyorum 1 · pp. 11–24, 85–90',
      nl: 'Camiye Gidiyorum 1 · p. 11–24, 85–90',
      de: 'Camiye Gidiyorum 1 · S. 11–24, 85–90',
    },
  },
  {
    id: '4-8-abdest-adimlari',
    yas: '4-8',
    alan: 'ibadet',
    pdf: '/dosyalar/yapraklar/4-8-abdest-adimlari.pdf',
    sayfa: 'ibadet/abdest/',
    baslik: {
      tr: 'Abdest Alıyorum, Temizleniyorum',
      fr: 'Je fais mes ablutions, je me purifie',
      en: 'Making Wudu & Staying Clean',
      nl: 'Ik verricht de woedoe en reinig mij',
      de: 'Ich mache Wudu und reinige mich',
    },
    ozet: {
      tr: 'Abdest adımlarını 1’den 8’e sıralama, 4 farzı daire içine alma ve su tasarrufu sorusu.',
      fr: 'Remettre les 8 étapes des ablutions dans l’ordre, entourer les 4 obligations et question sur l’économie d’eau.',
      en: 'Numbering wudu steps 1 to 8, circling the 4 obligatory acts and a water-saving prompt.',
      nl: 'De 8 stappen van de woedoe nummeren, de 4 verplichte handelingen omcirkelen en waterbesparing.',
      de: '8 Wudu-Schritte ordnen, die 4 Pflichtteile einkreisen und Frage zum Wassersparen.',
    },
    kaynak: {
      tr: 'Camiye Gidiyorum 1 · s. 55–58',
      fr: 'Camiye Gidiyorum 1 · p. 55–58',
      en: 'Camiye Gidiyorum 1 · pp. 55–58',
      nl: 'Camiye Gidiyorum 1 · p. 55–58',
      de: 'Camiye Gidiyorum 1 · S. 55–58',
    },
  },
  {
    id: '4-8-guzel-ahlak-evde-10dk',
    yas: '4-8',
    alan: 'ahlak',
    pdf: '/dosyalar/yapraklar/4-8-guzel-ahlak-evde-10dk.pdf',
    sayfa: 'ezber/',
    baslik: {
      tr: 'Güzel Söz, Selamlaşma ve Evde 10 Dakika',
      fr: 'Belles paroles, salutations & 10 min à la maison',
      en: 'Kind Words, Greetings & 10 Min at Home',
      nl: 'Mooie woorden, groeten & 10 min thuis',
      de: 'Gute Worte, Grüßen & 10 Min. zu Hause',
    },
    ozet: {
      tr: 'Besmele, Selam, Elhamdülillah durumsal eşleştirme ve 7 günlük evde yıldız takip çizelgesi.',
      fr: 'Associer Basmala, Salam et Alhamdoulillah aux situations et tableau hebdomadaire d’étoiles.',
      en: 'Matching daily Islamic phrases to situations plus a 7-day star tracker for home practice.',
      nl: 'Dagelijkse uitdrukkingen koppelen aan situaties plus een 7-daagse sterrenkaart voor thuis.',
      de: 'Alltägliche Ausdrücke Situationen zuordnen plus 7-Tage-Sterneplan für zu Hause.',
    },
    kaynak: {
      tr: 'Camiye Gidiyorum 1 · s. 25–30 + Ezber',
      fr: 'Camiye Gidiyorum 1 · p. 25–30 + Mémorisation',
      en: 'Camiye Gidiyorum 1 · pp. 25–30 + Memorisation',
      nl: 'Camiye Gidiyorum 1 · p. 25–30 + Memorisatie',
      de: 'Camiye Gidiyorum 1 · S. 25–30 + Memorieren',
    },
  },
  {
    id: '9-13-tecvid-uygulama',
    yas: '9-13',
    alan: 'kuran',
    pdf: '/dosyalar/yapraklar/9-13-tecvid-uygulama.pdf',
    sayfa: 'okuma/cark/',
    baslik: {
      tr: 'Cezm, Şedde, Tenvin, Med ve Tecvid Uygulaması',
      fr: 'Soukoûn, chadda, tanwîn, madd et tajwîd appliqué',
      en: 'Sukun, Shadda, Tanwin, Madd & Applied Tajwid',
      nl: 'Soekoen, sjadda, tanwien, madd en toegepaste tajwied',
      de: 'Sukun, Schadda, Tanwin, Madd & Tadschwid-Übung',
    },
    ozet: {
      tr: 'Med, kalkale, idğam ve iklâb kurallarını Kur’an örnek kelimeleri üzerinde tespit ve yazılış–okunuş eşleştirmesi.',
      fr: 'Repérer madd, qalqala, idghâm et iqlâb sur des mots coraniques et relier écriture et lecture.',
      en: 'Spotting madd, qalqalah, idgham and iqlab on Qur’anic words and matching written vs recited forms.',
      nl: 'Madd, qalqala, idgham en iqlaab herkennen in Koranwoorden en geschreven/gelezen vormen koppelen.',
      de: 'Madd, Qalqala, Idgham und Iqlab an Koran-Beispielen erkennen sowie Schreib- und Leseform zuordnen.',
    },
    kaynak: {
      tr: 'Elifbâ & Kur’an Okuma · Adım o4, o6, o8',
      fr: 'Elifbâ & Lecture · Étapes o4, o6, o8',
      en: 'Elifba & Reading · Steps o4, o6, o8',
      nl: 'Elifba & Lezen · Stap o4, o6, o8',
      de: 'Elifba & Lesen · Schritt o4, o6, o8',
    },
  },
  {
    id: '9-13-abdest-namaz-rekatlar',
    yas: '9-13',
    alan: 'ibadet',
    pdf: '/dosyalar/yapraklar/9-13-abdest-namaz-rekatlar.pdf',
    sayfa: 'ibadet/namaz/',
    baslik: {
      tr: 'Abdest Farzları, Beş Vakit Rekâtlar ve Dualar',
      fr: 'Obligations des ablutions, unités de prière et douas',
      en: 'Wudu Pillars, Five Daily Prayer Units & Duas',
      nl: 'Woedoe-plichten, gebedseenheden en smeekbeden',
      de: 'Wudu-Pflichten, Gebetseinheiten & Bittgebete',
    },
    ozet: {
      tr: 'Abdestin ve namazın iç/dış farzları, 5 vakit + Vitir rekât tablosu doldurma ve namaz duaları denetimi.',
      fr: 'Conditions intérieures/extérieures de la prière, tableau des 5 prières + Witr et suivi des douas.',
      en: 'Outer/inner pillars of salah, fill-in 5 daily prayers + Witr table and prayer-dua checklist.',
      nl: 'Uiterlijke/innerlijke voorwaarden van het gebed, tabel voor de 5 gebeden + Witr en doua-overzicht.',
      de: 'Äußere/innere Gebetspflichten, Tabelle der 5 Gebete + Witr und Bittgebete-Überblick.',
    },
    kaynak: {
      tr: 'Camiye Gidiyorum 2 · s. 13–20 (Diyanet İlmihali)',
      fr: 'Camiye Gidiyorum 2 · p. 13–20',
      en: 'Camiye Gidiyorum 2 · pp. 13–20',
      nl: 'Camiye Gidiyorum 2 · p. 13–20',
      de: 'Camiye Gidiyorum 2 · S. 13–20',
    },
  },
  {
    id: '9-13-iman-ve-temel-kaynaklar',
    yas: '9-13',
    alan: 'itikat',
    pdf: '/dosyalar/yapraklar/9-13-iman-ve-temel-kaynaklar.pdf',
    sayfa: 'yollar/plan-itikat/',
    baslik: {
      tr: 'İmanın 6 Şartı, İslam’ın 5 Şartı ve Dinî Kaynaklar',
      fr: '6 piliers de la foi, 5 piliers de l’islam & sources',
      en: '6 Pillars of Iman, 5 Pillars of Islam & Sources',
      nl: '6 zuilen van het geloof, 5 zuilen van de islam & bronnen',
      de: '6 Säulen des Glaubens, 5 Säulen des Islam & Quellen',
    },
    ozet: {
      tr: 'Âmentü esasları, İslam’ın beş şartı ve Kur’an, Sünnet, İcmâ, Kıyas temel dinî kaynaklarını sınıflandırma.',
      fr: 'Classer les piliers d’Âmantou, les 5 piliers de l’islam et les sources fondamentales (Coran, Sunna…).',
      en: 'Categorising the articles of faith, the 5 pillars of Islam and primary religious sources.',
      nl: 'Geloofsartikelen, 5 zuilen en religieuze hoofdbronnen (Koran, Soenna…) ordenen.',
      de: 'Glaubensartikel, 5 Säulen und die Grundquellen (Koran, Sunna…) zuordnen.',
    },
    kaynak: {
      tr: 'Camiye Gidiyorum 2 · s. 6–12, 26–29',
      fr: 'Camiye Gidiyorum 2 · p. 6–12, 26–29',
      en: 'Camiye Gidiyorum 2 · pp. 6–12, 26–29',
      nl: 'Camiye Gidiyorum 2 · p. 6–12, 26–29',
      de: 'Camiye Gidiyorum 2 · S. 6–12, 26–29',
    },
  },
  {
    id: '9-13-siyer-mekke-medine',
    yas: '9-13',
    alan: 'siyer',
    pdf: '/dosyalar/yapraklar/9-13-siyer-mekke-medine.pdf',
    sayfa: 'yollar/plan-siyer/',
    baslik: {
      tr: 'Siyer-i Nebî: Mekke’den Medine’ye Zaman Çizelgesi',
      fr: 'Sîra : chronologie de La Mecque à Médine',
      en: 'Sirah Timeline: From Makkah to Madinah',
      nl: 'Siera-tijdlijn: van Mekka naar Medina',
      de: 'Sira-Zeitstrahl: Von Mekka nach Medina',
    },
    ozet: {
      tr: 'Fil Yılı (571), Muhammedü’l-Emîn dönemi, ilk vahiy (610) ve Hicret (622) kronoloji sıralaması ve kaynak soruları.',
      fr: 'Remettre dans l’ordre chronologique : année de l’Éléphant (571), al-Amîn, première révélation (610) et Hégire (622).',
      en: 'Chronological timeline drill covering 571 CE, al-Amin years, First Revelation (610) and Hijrah (622).',
      nl: 'Chronologische tijdlijn met 571, al-Amien, eerste openbaring (610) en Hidjra (622).',
      de: 'Chronologische Einordnung: 571, al-Amin, erste Offenbarung (610) und Hidschra (622).',
    },
    kaynak: {
      tr: 'Camiye Gidiyorum 2 · s. 30–39, 75–78 · TDB s. 257–270',
      fr: 'Camiye Gidiyorum 2 · p. 30–39, 75–78 · TDB',
      en: 'Camiye Gidiyorum 2 · pp. 30–39, 75–78 · TDB',
      nl: 'Camiye Gidiyorum 2 · p. 30–39, 75–78 · TDB',
      de: 'Camiye Gidiyorum 2 · S. 30–39, 75–78 · TDB',
    },
  },
];

export interface YaprakMetinleri {
  ad: string;
  aciklama: string;
  giris: string;
  geri: string;
  grup48Baslik: string;
  grup48Aciklama: string;
  grup913Baslik: string;
  grup913Aciklama: string;
  indir: string;
  sayfayaGit: string;
  pdfNot: string;
  alanlar: Record<YaprakKart['alan'], string>;
}

const YAPRAK_HAM: Record<Dil, YaprakMetinleri> = {
  tr: {
    ad: 'Yazdırılabilir Çalışma Yaprakları',
    aciklama: 'Hafta sonu Kur’an kursları için yıllık müfredata göre hazırlanmış, iki yaş grubuna özel, QR kodlu A4 çalışma yaprakları arşivi.',
    giris: 'Belçika camilerimiz ve hafta sonu Kur’an kursları için müfredata bağlı hazırlanmış 1 sayfalık A4 çalışma yaprakları. Her yaprakta öğrencinin evde sesli tekrar yapabileceği sayfaya giden karekod bulunur.',
    geri: 'İlim Yolu',
    grup48Baslik: '4–8 Yaş · Minikler',
    grup48Aciklama: 'Elifbâ harfleri ve Camiye Gidiyorum 1 konularıyla eşleştirmeli, boyamalı ve kısa evde tekrarlı yapraklar.',
    grup913Baslik: '9–13 Yaş · Büyükler',
    grup913Aciklama: 'Tecvid, Camiye Gidiyorum 2 ve Temel Dinî Bilgiler müfredatına göre kavrama, tablo doldurma ve zaman çizelgesi yaprakları.',
    indir: 'A4 PDF indir',
    sayfayaGit: 'Etkileşimli sayfayı aç',
    pdfNot: 'PDF yaprakları şu an Türkçe müfredat baskısıdır; Fransızca ve Flamanca çift dilli baskılar öğretmen geri bildirimleriyle sırayla eklenecektir.',
    alanlar: { kuran: 'Kur’an-ı Kerim', itikat: 'İtikat', ibadet: 'İbadet', siyer: 'Siyer', ahlak: 'Ahlak' },
  },
  fr: {
    ad: 'Fiches d’activités à imprimer',
    aciklama: 'Archive de fiches A4 imprimables avec code QR pour les cours coraniques du week-end, organisées en deux tranches d’âge selon le programme annuel.',
    giris: 'Fiches d’une page au format A4 prêtes à imprimer pour les mosquées et cours coraniques en Belgique. Chaque fiche porte un code QR vers l’activité audio et interactive sur la plateforme.',
    geri: 'Chemin du savoir',
    grup48Baslik: '4–8 ans · Les plus jeunes',
    grup48Aciklama: 'Fiches avec coloriage, associations et suivi de 10 minutes à la maison (Elifbâ et Camiye Gidiyorum 1).',
    grup913Baslik: '9–13 ans · Les plus âgés',
    grup913Aciklama: 'Fiches de tajwîd, tableaux des prières, piliers de la foi et chronologie de la Sîra (Camiye Gidiyorum 2).',
    indir: 'Télécharger le PDF (A4)',
    sayfayaGit: 'Ouvrir la page interactive',
    pdfNot: 'Les fiches PDF sont actuellement publiées en turc selon le programme du week-end ; les éditions bilingues (français / néerlandais) suivront selon les retours des enseignants.',
    alanlar: { kuran: 'Coran', itikat: 'Foi', ibadet: 'Adoration', siyer: 'Sîra', ahlak: 'Éthique' },
  },
  en: {
    ad: 'Printable Worksheets',
    aciklama: 'Curriculum-aligned A4 printable worksheets with QR codes for weekend mosque classes, organised into two age groups.',
    giris: 'Single-page A4 worksheets ready to print for Belgian mosques and weekend Qur’an classes. Each sheet includes a QR code linking straight to the audio-guided web activity.',
    geri: 'Path of Knowledge',
    grup48Baslik: 'Ages 4–8 · Younger group',
    grup48Aciklama: 'Letter recognition, colouring, matching and home 10-minute star trackers.',
    grup913Baslik: 'Ages 9–13 · Older group',
    grup913Aciklama: 'Tajwid applications, prayer unit tables, articles of faith and Sirah timelines.',
    indir: 'Download A4 PDF',
    sayfayaGit: 'Open interactive page',
    pdfNot: 'The PDF sheets are currently in Turkish (weekend curriculum edition); bilingual French/Dutch editions will be added based on teacher feedback.',
    alanlar: { kuran: 'Qur’an', itikat: 'Faith', ibadet: 'Worship', siyer: 'Sirah', ahlak: 'Ethics' },
  },
  nl: {
    ad: 'Afdrukbare werkbladen',
    aciklama: 'Overzichtelijke A4-werkbladen met QR-code voor de weekendlessen in de moskee, ingedeeld in twee leeftijdsgroepen volgens het jaarplan.',
    giris: 'Kant-en-klare A4-werkbladen van één bladzijde voor moskeeën in België. Elk werkblad heeft een QR-code naar de bijbehorende oefening met geluid.',
    geri: 'Weg van kennis',
    grup48Baslik: '4–8 jaar · Jongste groep',
    grup48Aciklama: 'Letters herkennen, kleuren, koppelen en een wekelijkse sterrenkaart voor thuis.',
    grup913Baslik: '9–13 jaar · Oudere groep',
    grup913Aciklama: 'Tajwied-oefeningen, gebedstabel, geloofszuilen en tijdslijn van de Siera.',
    indir: 'Download A4-pdf',
    sayfayaGit: 'Open interactieve pagina',
    pdfNot: 'De pdf-werkbladen zijn momenteel in het Turks; tweetalige versies (Frans / Nederlands) worden toegevoegd op basis van feedback van leerkrachten.',
    alanlar: { kuran: 'Koran', itikat: 'Geloof', ibadet: 'Aanbidding', siyer: 'Siera', ahlak: 'Ethiek' },
  },
  de: {
    ad: 'Arbeitsblätter zum Ausdrucken',
    aciklama: 'Nach dem Jahreslehrplan erstellte A4-Arbeitsblätter mit QR-Code für zwei Altersgruppen im Wochenendunterricht.',
    giris: 'Einseitige A4-Arbeitsblätter für Moscheegemeinden in Belgien. Jedes Blatt enthält einen QR-Code zur passenden Audio-Übung auf der Plattform.',
    geri: 'Weg des Wissens',
    grup48Baslik: '4–8 Jahre · Jüngere Gruppe',
    grup48Aciklama: 'Buchstaben erkennen, Ausmalen, Zuordnen und 10-Minuten-Sterneplan für zu Hause.',
    grup913Baslik: '9–13 Jahre · Ältere Gruppe',
    grup913Aciklama: 'Tadschwid-Übungen, Gebetstabelle, Glaubensgrundlagen und Sira-Zeitstrahl.',
    indir: 'A4-PDF herunterladen',
    sayfayaGit: 'Interaktive Seite öffnen',
    pdfNot: 'Die PDF-Arbeitsblätter liegen derzeit auf Türkisch vor; zweisprachige Ausgaben (Französisch / Niederländisch) folgen nach Rückmeldung der Lehrkräfte.',
    alanlar: { kuran: 'Koran', itikat: 'Glaube', ibadet: 'Gottesdienst', siyer: 'Sira', ahlak: 'Ethik' },
  },
};

export const yaprakMetinleri = (dil: Dil): YaprakMetinleri => {
  const ham = YAPRAK_HAM[dil];
  if (dil !== 'fr') return ham;
  return {
    ...ham,
    ad: fransizTipografi(ham.ad),
    aciklama: fransizTipografi(ham.aciklama),
    giris: fransizTipografi(ham.giris),
    pdfNot: fransizTipografi(ham.pdfNot),
  };
};
