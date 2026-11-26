/**
 * Sesli Çarkıfelek metinleri (İlim Yolu · 26 Kasım 2026): beş dil zorunlu.
 * Okuma desteleri (o1–o9) yalnız resmî Diyanet kayıtlarından gelir; Bilgi Sorusu desteleri (s-*) onaylı İlim Yolu soru bankasındandır.
 */
import type { Dil } from '@ortak/i18n/ui';
import { fransizTipografi } from './metinler';

export const CARK_OKUMA_DESTELERI = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9'] as const;
export const CARK_SORU_DESTELERI = ['s-itikat', 's-ibadet', 's-siyer', 's-ahlak', 's-kuran'] as const;
export const CARK_DESTELERI = [...CARK_OKUMA_DESTELERI, ...CARK_SORU_DESTELERI] as const;
export type CarkOkumaDeste = (typeof CARK_OKUMA_DESTELERI)[number];
export type CarkSoruDeste = (typeof CARK_SORU_DESTELERI)[number];
export type CarkDeste = (typeof CARK_DESTELERI)[number];

export interface CarkMetinleri {
  ad: string;
  aciklama: string;
  giris: string;
  geri: string;
  desteBaslik: string;
  okumaGrupBaslik: string;
  soruGrupBaslik: string;
  kalan: string;
  cevir: string;
  donuyor: string;
  sonucBaslik: string;
  ilkDurum: string;
  dinle: string;
  durdur: string;
  yavas: string;
  normal: string;
  cevabiGoster: string;
  dogruTebrik: string;
  tekrarDene: string;
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
  takimBaslik: string;
  takim1: string;
  takim2: string;
  artiBir: string;
  puanSifirla: string;
  desteler: Record<CarkDeste, string>;
}

const CARK_HAM: Record<Dil, CarkMetinleri> = {
  tr: {
    ad: 'Sesli Çarkıfelek',
    aciklama: 'Sınıf tahtası veya telefon için sesli Kur’an okuma ve bilgi soruları çarkı: harf, hece, kelime ve tecvid örneklerini resmî Diyanet kaydından dinleyin, 450+ bilgi sorusuyla yarışın.',
    giris: 'Sınıfça birlikte oynayın: ister Kur’an okuma destelerinden harf ve kelime çevirip resmî Diyanet telaffuzunu dinleyin, ister Bilgi Soruları çarkıyla takım hâlinde yarışın.',
    geri: 'Kur’an Okuma',
    desteBaslik: 'Çalışma destesi',
    okumaGrupBaslik: '1) Kur’an Okuma (Resmî Diyanet sesli · 9 deste)',
    soruGrupBaslik: '2) Sınıf Bilgi Soruları Çarkı (450+ onaylı soru · 5 konu)',
    kalan: 'Bu turda kalan: {n} / {m}',
    cevir: 'Çarkı çevir',
    donuyor: 'Çark dönüyor…',
    sonucBaslik: 'Gelen madde',
    ilkDurum: 'Başlamak için bir deste seçip «Çarkı çevir» düğmesine dokunun.',
    dinle: 'Diyanet sesiyle dinle',
    durdur: 'Sesi durdur',
    yavas: 'Yavaş (0,8×)',
    normal: 'Normal (1,0×)',
    cevabiGoster: 'Cevabı göster',
    dogruTebrik: 'Tebrikler, doğru!',
    tekrarDene: 'Tekrar deneyin',
    cikar: 'Çarktan çıkar',
    sifirla: 'Hepsini geri al',
    efektAcik: 'Çark sesi efektleri',
    havuzBitti: 'Bu destedeki bütün maddeler soruldu. «Hepsini geri al» ile yeni tur başlatabilirsiniz.',
    cikarildi: 'Madde bu turdan çıkarıldı.',
    sifirlandi: 'Destenin tüm maddeleri yeniden çarka alındı.',
    sesHata: 'Diyanet ses kaydı şu an açılamadı. Bağlantınızı denetleyip «Diyanet sesiyle dinle» düğmesine basın.',
    kisayol: 'Boşluk: çarkı çevir · Enter / R: Diyanet sesini dinle',
    kaynakNot: 'Bütün okuma telaffuzları resmî Diyanet İşleri Başkanlığı ses arşivindendir; bilgi soruları İlim Yolu müfredat kartlarındandır. Hiçbir veri kaydedilmez.',
    jsGerek: 'Sesli Çarkıfelek için tarayıcınızda JavaScript açık olmalıdır.',
    takimBaslik: 'İsteğe bağlı sınıf takım sayacı',
    takim1: '1. Takım',
    takim2: '2. Takım',
    artiBir: '+1 puan',
    puanSifirla: 'Puanları sıfırla',
    desteler: {
      o1: 'Elifbâ harfleri (28)',
      o2: 'Harekeli heceler (84)',
      o3: 'Harflerin şekilleri',
      o4: 'Cezm, şedde, tenvin, med',
      o5: 'Kısa kelimeler',
      o6: 'Tecvid temelleri',
      o7: 'Kısa sûreler (âyet âyet)',
      o8: 'Tecvid uygulamaları',
      o9: 'Seçme kısa âyetler',
      's-itikat': 'İman (İtikat) soruları',
      's-ibadet': 'İbadet ve namaz soruları',
      's-siyer': 'Siyer-i Nebî soruları',
      's-ahlak': 'Güzel ahlak soruları',
      's-kuran': 'Kur’an bilgisi soruları',
    },
  },
  fr: {
    ad: 'Roue sonore de lecture',
    aciklama: 'Roue de lecture du Coran et de quiz en classe : tirez lettres, syllabes, mots et règles de tajwîd avec la voix de la Diyanet, ou tournez la roue des questions sur 5 thèmes.',
    giris: 'Jouez ensemble en classe : écoutez la prononciation officielle de la Diyanet sur les 9 paquets de lecture ou défiez la classe avec plus de 450 questions de connaissances.',
    geri: 'Lecture du Coran',
    desteBaslik: 'Paquet d’entraînement',
    okumaGrupBaslik: '1) Lecture du Coran (voix Diyanet · 9 paquets)',
    soruGrupBaslik: '2) Roue des questions en classe (450+ questions · 5 thèmes)',
    kalan: 'Restants dans cette manche : {n} / {m}',
    cevir: 'Tourner la roue',
    donuyor: 'La roue tourne…',
    sonucBaslik: 'Élément tiré',
    ilkDurum: 'Choisissez un paquet puis touchez « Tourner la roue » pour commencer.',
    dinle: 'Écouter (voix Diyanet)',
    durdur: 'Arrêter le son',
    yavas: 'Lent (0,8×)',
    normal: 'Normal (1,0×)',
    cevabiGoster: 'Afficher la réponse',
    dogruTebrik: 'Bravo, c’est juste !',
    tekrarDene: 'Essayez encore',
    cikar: 'Retirer de la roue',
    sifirla: 'Tout remettre',
    efektAcik: 'Effets sonores de la roue',
    havuzBitti: 'Tous les éléments de ce paquet ont été tirés. Touchez « Tout remettre » pour lancer une nouvelle manche.',
    cikarildi: 'Élément retiré de cette manche.',
    sifirlandi: 'Tous les éléments du paquet ont été remis dans la roue.',
    sesHata: 'L’enregistrement de la Diyanet n’a pas pu démarrer. Vérifiez la connexion et appuyez sur « Écouter (voix Diyanet) ».',
    kisayol: 'Espace : tourner la roue · Entrée / R : réécouter la voix Diyanet',
    kaynakNot: 'Toutes les récitations viennent des archives officielles de la Diyanet ; les questions proviennent des fiches du programme. Rien n’est enregistré.',
    jsGerek: 'La roue sonore nécessite JavaScript dans votre navigateur.',
    takimBaslik: 'Compteur d’équipes facultatif',
    takim1: 'Équipe 1',
    takim2: 'Équipe 2',
    artiBir: '+1 point',
    puanSifirla: 'Remettre à zéro',
    desteler: {
      o1: 'Lettres de l’alphabet (28)',
      o2: 'Syllabes vocalisées (84)',
      o3: 'Forme des lettres',
      o4: 'Soukoûn, chadda, tanwîn, madd',
      o5: 'Mots courts',
      o6: 'Bases du tajwîd',
      o7: 'Courtes sourates (verset par verset)',
      o8: 'Tajwîd en pratique',
      o9: 'Versets courts choisis',
      's-itikat': 'Questions : Foi (‘aqîda)',
      's-ibadet': 'Questions : Adoration et prière',
      's-siyer': 'Questions : Vie du Prophète',
      's-ahlak': 'Questions : Éthique',
      's-kuran': 'Questions : Connaissance du Coran',
    },
  },
  en: {
    ad: 'Audio Reading Wheel',
    aciklama: 'Classroom spin-the-wheel for Qur’an reading (official Diyanet audio) and 450+ Islamic knowledge questions across 5 topics.',
    giris: 'Play together in class: spin letters, words and verses with official Diyanet audio, or switch to the Quiz Wheel with 5 topics and an optional 2-team counter.',
    geri: 'Qur’an Reading',
    desteBaslik: 'Practice deck',
    okumaGrupBaslik: '1) Qur’an Reading (Diyanet audio · 9 decks)',
    soruGrupBaslik: '2) Classroom Question Wheel (450+ questions · 5 topics)',
    kalan: 'Remaining this round: {n} / {m}',
    cevir: 'Spin the wheel',
    donuyor: 'Spinning…',
    sonucBaslik: 'Selected item',
    ilkDurum: 'Choose a deck and press “Spin the wheel” to begin.',
    dinle: 'Listen (Diyanet audio)',
    durdur: 'Stop audio',
    yavas: 'Slow (0.8×)',
    normal: 'Normal (1.0×)',
    cevabiGoster: 'Show answer',
    dogruTebrik: 'Well done, correct!',
    tekrarDene: 'Try again',
    cikar: 'Remove from wheel',
    sifirla: 'Restore all',
    efektAcik: 'Wheel sound effects',
    havuzBitti: 'Every item in this deck has been spun. Press “Restore all” to start a fresh round.',
    cikarildi: 'Item removed from this round.',
    sifirlandi: 'All items in the deck are back on the wheel.',
    sesHata: 'Could not start the Diyanet recording. Check your connection and tap “Listen (Diyanet audio)”.',
    kisayol: 'Space: spin wheel · Enter / R: play Diyanet audio',
    kaynakNot: 'All reading audio comes from official Diyanet recordings; quiz questions come from curriculum cards. Nothing is saved.',
    jsGerek: 'JavaScript must be enabled to use the Audio Reading Wheel.',
    takimBaslik: 'Optional team counter',
    takim1: 'Team 1',
    takim2: 'Team 2',
    artiBir: '+1 pt',
    puanSifirla: 'Reset points',
    desteler: {
      o1: 'Arabic letters (28)',
      o2: 'Vowelled syllables (84)',
      o3: 'Letter shapes',
      o4: 'Sukun, shadda, tanwin, madd',
      o5: 'Short words',
      o6: 'Tajwid basics',
      o7: 'Short surahs (verse by verse)',
      o8: 'Tajwid in practice',
      o9: 'Selected short verses',
      's-itikat': 'Faith (Aqidah) questions',
      's-ibadet': 'Worship & prayer questions',
      's-siyer': 'Prophet’s life questions',
      's-ahlak': 'Ethics questions',
      's-kuran': 'Qur’an knowledge questions',
    },
  },
  nl: {
    ad: 'Geluidswiel Koranlezen',
    aciklama: 'Interactief klasrad voor Koranlezen (officiële Diyanet-opnamen) én 450+ kennisvragen verdeeld over 5 thema’s.',
    giris: 'Speel samen in de klas: draai aan het rad voor brieven, woorden en verzen met Diyanet-geluid, of kies een vragenset met het optionele teambord.',
    geri: 'Koran lezen',
    desteBaslik: 'Oefenset',
    okumaGrupBaslik: '1) Koran lezen (Diyanet-opnamen · 9 sets)',
    soruGrupBaslik: '2) Kennisvragen-rad (450+ vragen · 5 thema’s)',
    kalan: 'Nog over in deze ronde: {n} / {m}',
    cevir: 'Draai het rad',
    donuyor: 'Het rad draait…',
    sonucBaslik: 'Gekozen onderdeel',
    ilkDurum: 'Kies een set en druk op “Draai het rad” om te beginnen.',
    dinle: 'Luister (Diyanet-opname)',
    durdur: 'Geluid stoppen',
    yavas: 'Langzaam (0,8×)',
    normal: 'Normaal (1,0×)',
    cevabiGoster: 'Antwoord tonen',
    dogruTebrik: 'Goed gedaan, juist!',
    tekrarDene: 'Probeer opnieuw',
    cikar: 'Uit het rad halen',
    sifirla: 'Alles terugzetten',
    efektAcik: 'Geluidseffecten van het rad',
    havuzBitti: 'Alle onderdelen van deze set zijn geweest. Druk op “Alles terugzetten” voor een nieuwe ronde.',
    cikarildi: 'Onderdeel uit deze ronde gehaald.',
    sifirlandi: 'Alle onderdelen van de set staan weer in het rad.',
    sesHata: 'De Diyanet-opname kon niet worden afgespeeld. Controleer de verbinding en tik op “Luister (Diyanet-opname)”.',
    kisayol: 'Spatie: rad draaien · Enter / R: Diyanet-opname afspelen',
    kaynakNot: 'Alle leesopnamen komen uit het officiële Diyanet-archief; de vragen komen uit de leskaarten. Niets wordt opgeslagen.',
    jsGerek: 'Schakel JavaScript in om het geluidswiel te gebruiken.',
    takimBaslik: 'Optioneel teambord',
    takim1: 'Team 1',
    takim2: 'Team 2',
    artiBir: '+1 pt',
    puanSifirla: 'Punten wissen',
    desteler: {
      o1: 'Alfabetletters (28)',
      o2: 'Lettergrepen met klinkertekens (84)',
      o3: 'Vorm van de letters',
      o4: 'Soekoen, sjadda, tanwien, madd',
      o5: 'Korte woorden',
      o6: 'Basis van tajwied',
      o7: 'Korte soera’s (vers voor vers)',
      o8: 'Tajwied in de praktijk',
      o9: 'Uitgekozen korte verzen',
      's-itikat': 'Geloof-vragen',
      's-ibadet': 'Aanbidding & gebed-vragen',
      's-siyer': 'Siera-vragen',
      's-ahlak': 'Ethiek-vragen',
      's-kuran': 'Kennis van de Koran-vragen',
    },
  },
  de: {
    ad: 'Vorlese-Glücksrad mit Ton',
    aciklama: 'Klassen-Glücksrad für Koranlesen (offizielle Diyanet-Aufnahmen) und über 450 Wissensfragen zu 5 Themen.',
    giris: 'Spielen Sie gemeinsam in der Klasse: Drehen Sie Buchstaben und Verse mit Diyanet-Ton oder wechseln Sie zum Fragenrad mit optionalem Teamzähler.',
    geri: 'Koran lesen',
    desteBaslik: 'Übungspaket',
    okumaGrupBaslik: '1) Koran lesen (Diyanet-Ton · 9 Pakete)',
    soruGrupBaslik: '2) Klassen-Fragenrad (450+ Fragen · 5 Themen)',
    kalan: 'In dieser Runde übrig: {n} / {m}',
    cevir: 'Rad drehen',
    donuyor: 'Das Rad dreht sich…',
    sonucBaslik: 'Ausgewählter Punkt',
    ilkDurum: 'Wählen Sie ein Paket und drücken Sie auf „Rad drehen“.',
    dinle: 'Anhören (Diyanet-Ton)',
    durdur: 'Ton anhalten',
    yavas: 'Langsam (0,8×)',
    normal: 'Normal (1,0×)',
    cevabiGoster: 'Antwort zeigen',
    dogruTebrik: 'Sehr gut, richtig!',
    tekrarDene: 'Noch einmal versuchen',
    cikar: 'Aus dem Rad nehmen',
    sifirla: 'Alle zurücklegen',
    efektAcik: 'Soundeffekte beim Drehen',
    havuzBitti: 'Alle Punkte dieses Pakets wurden gedreht. Drücken Sie „Alle zurücklegen“ für eine neue Runde.',
    cikarildi: 'Punkt aus dieser Runde entfernt.',
    sifirlandi: 'Alle Punkte des Pakets sind wieder im Rad.',
    sesHata: 'Die Diyanet-Aufnahme konnte nicht gestartet werden. Prüfen Sie die Verbindung und tippen Sie auf „Anhören (Diyanet-Ton)“.',
    kisayol: 'Leertaste: Rad drehen · Eingabe / R: Diyanet-Ton anhören',
    kaynakNot: 'Alle Lesetexte und Aufnahmen stammen von der Diyanet; die Fragen kommen aus den Lernkarten. Nichts wird gespeichert.',
    jsGerek: 'Für das Vorlese-Glücksrad muss JavaScript aktiviert sein.',
    takimBaslik: 'Optionaler Teamzähler',
    takim1: 'Team 1',
    takim2: 'Team 2',
    artiBir: '+1 Pkt.',
    puanSifirla: 'Zurücksetzen',
    desteler: {
      o1: 'Elifba-Buchstaben (28)',
      o2: 'Vokalisierte Silben (84)',
      o3: 'Buchstabenformen',
      o4: 'Sukun, Schadda, Tanwin, Madd',
      o5: 'Kurze Wörter',
      o6: 'Grundlagen des Tadschwid',
      o7: 'Kurze Suren (Vers für Vers)',
      o8: 'Tadschwid in der Praxis',
      o9: 'Ausgewählte kurze Verse',
      's-itikat': 'Fragen: Glaube (Aqida)',
      's-ibadet': 'Fragen: Gottesdienst & Gebet',
      's-siyer': 'Fragen: Leben des Propheten',
      's-ahlak': 'Fragen: Ethik',
      's-kuran': 'Fragen: Koranwissen',
    },
  },
};

function frCevir(m: CarkMetinleri): CarkMetinleri {
  return {
    ...m,
    ad: fransizTipografi(m.ad),
    aciklama: fransizTipografi(m.aciklama),
    giris: fransizTipografi(m.giris),
    okumaGrupBaslik: fransizTipografi(m.okumaGrupBaslik),
    soruGrupBaslik: fransizTipografi(m.soruGrupBaslik),
    kalan: fransizTipografi(m.kalan),
    ilkDurum: fransizTipografi(m.ilkDurum),
    dogruTebrik: fransizTipografi(m.dogruTebrik),
    havuzBitti: fransizTipografi(m.havuzBitti),
    sesHata: fransizTipografi(m.sesHata),
    kisayol: fransizTipografi(m.kisayol),
    kaynakNot: fransizTipografi(m.kaynakNot),
  };
}

export const carkMetinleri = (dil: Dil): CarkMetinleri => (dil === 'fr' ? frCevir(CARK_HAM.fr) : CARK_HAM[dil]);
