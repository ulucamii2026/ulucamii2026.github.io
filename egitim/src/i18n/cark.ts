/**
 * Sesli Çarkıfelek metinleri (İlim Yolu · Kur'an Okuma · 26 Kasım 2026): beş dil zorunlu.
 * Arapça harf, hece, kelime, tecvid ve kısa âyet seslendirmeleri yalnızca resmî Diyanet kayıtlarından gelir.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export const CARK_DESTELERI = ['o1', 'o2', 'o4', 'o5', 'o6', 'o8', 'o9'] as const;
export type CarkDeste = (typeof CARK_DESTELERI)[number];

export interface CarkMetinleri {
  ad: string;
  aciklama: string;
  giris: string;
  geri: string;
  desteBaslik: string;
  kalan: string;
  cevir: string;
  donuyor: string;
  sonucBaslik: string;
  ilkDurum: string;
  dinle: string;
  durdur: string;
  yavas: string;
  normal: string;
  cikar: string;
  sifirla: string;
  efektAcik: string;
  havuzBitti: string;
  cikarildi: string;
  sifirlandi: string;
  sesHata: string;
  kisayol: string;
  kaynakNot: string;
  jsGerek: string;
  desteler: Record<CarkDeste, string>;
}

const CARK_HAM: Record<Dil, CarkMetinleri> = {
  tr: {
    ad: 'Sesli Çarkıfelek',
    aciklama: 'Sınıf tahtası veya telefon için sesli Kur’an okuma çarkı: harf, hece, kelime ve tecvid örneklerini çevirin, resmî Diyanet kaydından dinleyin.',
    giris: 'Sınıfça birlikte oynayın: deste seçip çarkı çevirin, gelen harf veya kelimeyi öğrenciler okusun, ardından tek dokunuşla resmî Diyanet telaffuzunu dinleyin.',
    geri: 'Kur’an Okuma',
    desteBaslik: 'Çalışma destesi',
    kalan: 'Bu turda kalan: {n} / {m}',
    cevir: 'Çarkı çevir',
    donuyor: 'Çark dönüyor…',
    sonucBaslik: 'Gelen madde',
    ilkDurum: 'Başlamak için desteyi seçip «Çarkı çevir» düğmesine dokunun.',
    dinle: 'Diyanet sesiyle dinle',
    durdur: 'Sesi durdur',
    yavas: 'Yavaş (0,8×)',
    normal: 'Normal (1,0×)',
    cikar: 'Çarktan çıkar',
    sifirla: 'Hepsini geri al',
    efektAcik: 'Çark sesi efektleri',
    havuzBitti: 'Bu destedeki bütün maddeler soruldu. «Hepsini geri al» ile yeni tur başlatabilirsiniz.',
    cikarildi: 'Madde bu turdan çıkarıldı.',
    sifirlandi: 'Destenin tüm maddeleri yeniden çarka alındı.',
    sesHata: 'Diyanet ses kaydı şu an açılamadı. Bağlantınızı denetleyip «Diyanet sesiyle dinle» düğmesine basın.',
    kisayol: 'Boşluk: çarkı çevir · Enter / R: Diyanet sesini dinle',
    kaynakNot: 'Bütün telaffuz kayıtları resmî Diyanet İşleri Başkanlığı Elifbâ ve Kur’an-ı Kerim ses arşivindendir; yapay zekâ sesi kullanılmaz. Hiçbir veri kaydedilmez.',
    jsGerek: 'Sesli Çarkıfelek için tarayıcınızda JavaScript açık olmalıdır.',
    desteler: {
      o1: 'Elifbâ harfleri (28)',
      o2: 'Harekeli heceler (84)',
      o4: 'Cezm, şedde, tenvin, med',
      o5: 'Kısa kelimeler',
      o6: 'Tecvid temelleri',
      o8: 'Tecvid uygulamaları',
      o9: 'Kısa âyetler',
    },
  },
  fr: {
    ad: 'Roue sonore de lecture',
    aciklama: 'Roue de lecture du Coran pour le tableau ou le téléphone : faites tourner pour tirer une lettre, une syllabe, un mot ou une règle de tajwîd et écoutez l’enregistrement officiel de la Diyanet.',
    giris: 'Jouez ensemble en classe : choisissez un paquet, faites tourner la roue, laissez la classe lire, puis écoutez en un geste la prononciation officielle de la Diyanet.',
    geri: 'Lecture du Coran',
    desteBaslik: 'Paquet d’entraînement',
    kalan: 'Restants dans cette manche : {n} / {m}',
    cevir: 'Tourner la roue',
    donuyor: 'La roue tourne…',
    sonucBaslik: 'Élément tiré',
    ilkDurum: 'Choisissez un paquet puis touchez « Tourner la roue » pour commencer.',
    dinle: 'Écouter (voix Diyanet)',
    durdur: 'Arrêter le son',
    yavas: 'Lent (0,8×)',
    normal: 'Normal (1,0×)',
    cikar: 'Retirer de la roue',
    sifirla: 'Tout remettre',
    efektAcik: 'Effets sonores de la roue',
    havuzBitti: 'Tous les éléments de ce paquet ont été tirés. Touchez « Tout remettre » pour lancer une nouvelle manche.',
    cikarildi: 'Élément retiré de cette manche.',
    sifirlandi: 'Tous les éléments du paquet ont été remis dans la roue.',
    sesHata: 'L’enregistrement de la Diyanet n’a pas pu démarrer. Vérifiez la connexion et appuyez sur « Écouter (voix Diyanet) ».',
    kisayol: 'Espace : tourner la roue · Entrée / R : réécouter la voix Diyanet',
    kaynakNot: 'Toutes les prononciations proviennent des archives officielles d’Elifbâ et du Coran de la Diyanet ; aucune voix artificielle n’est utilisée. Rien n’est enregistré.',
    jsGerek: 'La roue sonore nécessite JavaScript dans votre navigateur.',
    desteler: {
      o1: 'Lettres de l’alphabet (28)',
      o2: 'Syllabes vocalisées (84)',
      o4: 'Soukoûn, chadda, tanwîn, madd',
      o5: 'Mots courts',
      o6: 'Bases du tajwîd',
      o8: 'Tajwîd en pratique',
      o9: 'Versets courts',
    },
  },
  en: {
    ad: 'Audio Reading Wheel',
    aciklama: 'Audio spin-the-wheel for the classroom board or phone: spin letters, syllables, words and tajwid examples, then listen to the official Diyanet recording.',
    giris: 'Play together in class: pick a deck, spin the wheel, have students read it aloud, then play the official Diyanet pronunciation in one tap.',
    geri: 'Qur’an Reading',
    desteBaslik: 'Practice deck',
    kalan: 'Remaining this round: {n} / {m}',
    cevir: 'Spin the wheel',
    donuyor: 'Spinning…',
    sonucBaslik: 'Selected item',
    ilkDurum: 'Choose a deck and press “Spin the wheel” to begin.',
    dinle: 'Listen (Diyanet audio)',
    durdur: 'Stop audio',
    yavas: 'Slow (0.8×)',
    normal: 'Normal (1.0×)',
    cikar: 'Remove from wheel',
    sifirla: 'Restore all',
    efektAcik: 'Wheel sound effects',
    havuzBitti: 'Every item in this deck has been spun. Press “Restore all” to start a fresh round.',
    cikarildi: 'Item removed from this round.',
    sifirlandi: 'All items in the deck are back on the wheel.',
    sesHata: 'Could not start the Diyanet recording. Check your connection and tap “Listen (Diyanet audio)”.',
    kisayol: 'Space: spin wheel · Enter / R: play Diyanet audio',
    kaynakNot: 'All pronunciations come from the official Diyanet Elifba and Qur’an recordings; no synthetic voice is used. Nothing is stored.',
    jsGerek: 'JavaScript must be enabled to use the Audio Reading Wheel.',
    desteler: {
      o1: 'Arabic letters (28)',
      o2: 'Vowelled syllables (84)',
      o4: 'Sukun, shadda, tanwin, madd',
      o5: 'Short words',
      o6: 'Tajwid basics',
      o8: 'Tajwid in practice',
      o9: 'Short verses',
    },
  },
  nl: {
    ad: 'Geluidswiel Koranlezen',
    aciklama: 'Interactief rad voor het digibord of de telefoon: draai letters, lettergrepen, woorden en tajwied-voorbeelden en beluister de officiële Diyanet-opname.',
    giris: 'Speel samen in de klas: kies een set, draai aan het rad, laat de leerlingen voorlezen en beluister met één tik de officiële Diyanet-uitspraak.',
    geri: 'Koran lezen',
    desteBaslik: 'Oefenset',
    kalan: 'Nog over in deze ronde: {n} / {m}',
    cevir: 'Draai het rad',
    donuyor: 'Het rad draait…',
    sonucBaslik: 'Gekozen onderdeel',
    ilkDurum: 'Kies een set en druk op “Draai het rad” om te beginnen.',
    dinle: 'Luister (Diyanet-opname)',
    durdur: 'Geluid stoppen',
    yavas: 'Langzaam (0,8×)',
    normal: 'Normaal (1,0×)',
    cikar: 'Uit het rad halen',
    sifirla: 'Alles terugzetten',
    efektAcik: 'Geluidseffecten van het rad',
    havuzBitti: 'Alle onderdelen van deze set zijn geweest. Druk op “Alles terugzetten” voor een nieuwe ronde.',
    cikarildi: 'Onderdeel uit deze ronde gehaald.',
    sifirlandi: 'Alle onderdelen van de set staan weer in het rad.',
    sesHata: 'De Diyanet-opname kon niet worden afgespeeld. Controleer de verbinding en tik op “Luister (Diyanet-opname)”.',
    kisayol: 'Spatie: rad draaien · Enter / R: Diyanet-opname afspelen',
    kaynakNot: 'Alle uitspraken komen uit het officiële Diyanet Elifba- en Koranarchief; er wordt geen kunstmatige stem gebruikt. Niets wordt opgeslagen.',
    jsGerek: 'Schakel JavaScript in om het geluidswiel te gebruiken.',
    desteler: {
      o1: 'Alfabetletters (28)',
      o2: 'Lettergrepen met klinkertekens (84)',
      o4: 'Soekoen, sjadda, tanwien, madd',
      o5: 'Korte woorden',
      o6: 'Basis van tajwied',
      o8: 'Tajwied in de praktijk',
      o9: 'Korte verzen',
    },
  },
  de: {
    ad: 'Vorlese-Glücksrad mit Ton',
    aciklama: 'Glücksrad für Tafel oder Smartphone: Drehen Sie Buchstaben, Silben, Wörter und Tadschwid-Beispiele und hören Sie die offizielle Diyanet-Aufnahme.',
    giris: 'Spielen Sie gemeinsam in der Klasse: Wählen Sie ein Paket, drehen Sie das Rad, lassen Sie die Kinder lesen und spielen Sie per Tipp die offizielle Diyanet-Aussprache ab.',
    geri: 'Koran lesen',
    desteBaslik: 'Übungspaket',
    kalan: 'In dieser Runde übrig: {n} / {m}',
    cevir: 'Rad drehen',
    donuyor: 'Das Rad dreht sich…',
    sonucBaslik: 'Ausgewählter Punkt',
    ilkDurum: 'Wählen Sie ein Paket und drücken Sie auf „Rad drehen“.',
    dinle: 'Anhören (Diyanet-Ton)',
    durdur: 'Ton anhalten',
    yavas: 'Langsam (0,8×)',
    normal: 'Normal (1,0×)',
    cikar: 'Aus dem Rad nehmen',
    sifirla: 'Alle zurücklegen',
    efektAcik: 'Soundeffekte beim Drehen',
    havuzBitti: 'Alle Punkte dieses Pakets wurden gedreht. Drücken Sie „Alle zurücklegen“ für eine neue Runde.',
    cikarildi: 'Punkt aus dieser Runde entfernt.',
    sifirlandi: 'Alle Punkte des Pakets sind wieder im Rad.',
    sesHata: 'Die Diyanet-Aufnahme konnte nicht gestartet werden. Prüfen Sie die Verbindung und tippen Sie auf „Anhören (Diyanet-Ton)“.',
    kisayol: 'Leertaste: Rad drehen · Eingabe / R: Diyanet-Ton anhören',
    kaynakNot: 'Alle Aussprachen stammen aus den offiziellen Elifba- und Koran-Aufnahmen der Diyanet; es wird keine künstliche Stimme verwendet. Nichts wird gespeichert.',
    jsGerek: 'Für das Vorlese-Glücksrad muss JavaScript aktiviert sein.',
    desteler: {
      o1: 'Elifba-Buchstaben (28)',
      o2: 'Vokalisierte Silben (84)',
      o4: 'Sukun, Schadda, Tanwin, Madd',
      o5: 'Kurze Wörter',
      o6: 'Grundlagen des Tadschwid',
      o8: 'Tadschwid in der Praxis',
      o9: 'Kurze Verse',
    },
  },
};

function frCevir(m: CarkMetinleri): CarkMetinleri {
  return {
    ...m,
    ad: fransizTipografi(m.ad),
    aciklama: fransizTipografi(m.aciklama),
    giris: fransizTipografi(m.giris),
    kalan: fransizTipografi(m.kalan),
    ilkDurum: fransizTipografi(m.ilkDurum),
    havuzBitti: fransizTipografi(m.havuzBitti),
    sesHata: fransizTipografi(m.sesHata),
    kisayol: fransizTipografi(m.kisayol),
    kaynakNot: fransizTipografi(m.kaynakNot),
  };
}

export const carkMetinleri = (dil: Dil): CarkMetinleri => (dil === 'fr' ? frCevir(CARK_HAM.fr) : CARK_HAM[dil]);
