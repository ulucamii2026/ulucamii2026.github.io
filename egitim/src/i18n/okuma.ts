/**
 * İlim Yolu · Kur'an Okuma metinleri (10 Kasım 2026): beş dilde arayüz, adım ve ders adları, madde etiketleri. Dinî metin yoktur (Arapça metin ve sesler
 * src/data içindedir); burada yalnız arayüz ve terim adları vardır. Hitap: tr «siz», fr «vous», nl «u», de «Sie».
 * Tecvid terimleri (qalqala, iqlâb, ikhfâ’ labial, madd türleri) Diyanet Elifbâ başlıklarındaki adlara ve yaygın yazılışlara göre yazıldı;
 * fr/en/nl/de terim karşılıkları hoca incelemesine açıktır (docs/ILIM-YOLU.md). Tarayıcıda çizilen dizelerde (`kart`) Fransız tipografisi derlemede
 * middleware'den gelmez: bölünmez boşlukları burada yazarız.
 */
import type { Dil } from '@ortak/i18n/ui';
import { ELIFBA_HARFLERI } from '@ortak/lib/elifba-verisi';
import { KATALOG } from '@ortak/lib/ezber/katalog';
import type { Oge } from '@ortak/lib/okuma/yol';

const NB = ' ';

/** Tarayıcıda kullanılan metinler (sayfadan `data-veri` ile gider). */
export interface KartYazilari {
  dinle: string; durdur: string; yavas: string; normal: string; yonerge: string;
  dogru: string; takildim: string; tekrar: string; maddeNo: string; yeni: string; tekrarRozet: string;
  bitir: string; sonuc: string; sonucMetin: string; sonucBos: string; sesHata: string; kaydedilemedi: string; kisayol: string;
  ilerleme: string; dersBitti: string; yeniden: string; bosOturum: string;
}
export interface OkumaYazilari {
  ad: string; ust: string; aciklama: string; giris: string;
  bugunBaslik: string; bugunOzet: string; bugunMetin: string; bugunBasla: string; bugunBitti: string; bugunNot: string;
  haritaBaslik: string; adimNo: string; dersSayisi: string; maddeSayisi: string; ilerleme: string;
  izElifba: string; izMushaf: string; izElifbaMetin: string; izMushafMetin: string;
  adimlar: Record<string, { ad: string; metin: string }>;
  adlar: Record<string, string>;
  geri: string; dersler: string; dersCalis: string; dersCalisAd: string; dinlemeBaslik: string; dinlemeMetin: string;
  sinirNot: string; kaynakNot: string; hesapNot: string; js: string; dinleAdi: string; oturumGeri: string; adimaGit: string;
  anaKart: { ad: string; metin: string; git: string; rozet: string };
  /** Kilimim ve ana sayfadaki kısa okuma satırı. */
  satir: { tekrar: string; yok: string; git: string };
  kart: KartYazilari;
}

const ADIMLAR: Record<Dil, OkumaYazilari['adimlar']> = {
  tr: {
    o1: { ad: 'Harfler', metin: '28 harfi adlarıyla dinleyin ve tanıyın.' },
    o2: { ad: 'Heceler', metin: 'Harfleri üstün, esre ve ötre ile okuyun.' },
    o3: { ad: 'Harflerin şekilleri', metin: 'Harfin kelimenin başında, ortasında ve sonunda aldığı şekiller.' },
    o4: { ad: 'Cezm, şedde, tenvin, med', metin: 'Sessiz okuma, çift okuma, tenvin ve uzatma alıştırmaları.' },
    o5: { ad: 'Kelimeler', metin: 'Harekeli kısa kelimeleri dinleyip tekrar edin.' },
    o6: { ad: 'Tecvid temelleri', metin: 'Kalkale, iklâb, ihfâ-i şefevî ve med çeşitleri.' },
    o7: { ad: 'Sûre okuma', metin: 'Fâtiha ve son cüzün sûreleri, âyet âyet.' },
    o8: { ad: 'Tecvid uygulamaları', metin: 'İdğâm, zamir hâsı, râ ve med örneklerini, yazılışı ve okunuşuyla dinleyin.' },
    o9: { ad: 'Kısa âyetler', metin: 'Bakara, Âyetü’l-Kürsî, Haşr ve kısa sûrelerden seçme âyetleri dinleyin.' },
  },
  fr: {
    o1: { ad: 'Les lettres', metin: 'Écoutez les 28 lettres avec leur nom et apprenez à les reconnaître.' },
    o2: { ad: 'Les syllabes', metin: 'Lisez les lettres avec fatha, kasra et damma.' },
    o3: { ad: 'La forme des lettres', metin: 'Les formes de la lettre au début, au milieu et à la fin du mot.' },
    o4: { ad: 'Soukoûn, chadda, tanwîn, madd', metin: 'Exercices de lecture : soukoûn, redoublement, tanwîn et allongement.' },
    o5: { ad: 'Les mots', metin: 'Écoutez de courts mots vocalisés et répétez-les.' },
    o6: { ad: 'Bases du tajwîd', metin: 'Qalqala, iqlâb, ikhfâ’ labial et les sortes de madd.' },
    o7: { ad: 'Lecture des sourates', metin: 'La Fâtiha et les sourates du dernier juz’, verset par verset.' },
    o8: { ad: 'Le tajwîd en pratique', metin: 'Écoutez des exemples d’idghâm, du hâ’ du pronom, du râ’ et du madd, avec leur écriture et leur lecture.' },
    o9: { ad: 'Versets courts', metin: 'Écoutez des versets choisis de la sourate Al-Baqara, d’Ayat Al-Kursi, d’Al-Hachr et des courtes sourates.' },
  },
  en: {
    o1: { ad: 'The letters', metin: 'Listen to the 28 letters by name and learn to recognise them.' },
    o2: { ad: 'Syllables', metin: 'Read the letters with fatha, kasra and damma.' },
    o3: { ad: 'Letter shapes', metin: 'How a letter looks at the start, in the middle and at the end of a word.' },
    o4: { ad: 'Sukun, shadda, tanwin, madd', metin: 'Reading drills: sukun, doubling, tanwin and lengthening.' },
    o5: { ad: 'Words', metin: 'Listen to short vowelled words and repeat them.' },
    o6: { ad: 'Tajwid basics', metin: 'Qalqalah, iqlab, ikhfa shafawi and the kinds of madd.' },
    o7: { ad: 'Reading surahs', metin: 'Al-Fatiha and the surahs of the last juz’, verse by verse.' },
    o8: { ad: 'Tajwid in practice', metin: 'Listen to examples of idgham, the pronoun hā’, rā’ and madd, as written and as read.' },
    o9: { ad: 'Short verses', metin: 'Listen to selected verses from Surah Al-Baqarah, Ayat Al-Kursi, Al-Hashr and the short surahs.' },
  },
  nl: {
    o1: { ad: 'De letters', metin: 'Luister naar de 28 letters met hun naam en leer ze herkennen.' },
    o2: { ad: 'Lettergrepen', metin: 'Lees de letters met fatha, kasra en damma.' },
    o3: { ad: 'Vorm van de letters', metin: 'De vormen van de letter aan het begin, in het midden en aan het eind van het woord.' },
    o4: { ad: 'Soekoen, sjadda, tanwien, madd', metin: 'Leesoefeningen: soekoen, verdubbeling, tanwien en verlenging.' },
    o5: { ad: 'Woorden', metin: 'Luister naar korte woorden met klinkertekens en herhaal ze.' },
    o6: { ad: 'Basis van tajwied', metin: 'Qalqala, iqlaab, ikhfa shafawi en de soorten madd.' },
    o7: { ad: 'Soera’s lezen', metin: 'Al-Fatiha en de soera’s van de laatste djoez, vers voor vers.' },
    o8: { ad: 'Tajwied in de praktijk', metin: 'Luister naar voorbeelden van idgham, de voornaamwoord-haa, de raa en madd, zoals geschreven en zoals gelezen.' },
    o9: { ad: 'Korte verzen', metin: 'Luister naar uitgekozen verzen uit soera Al-Baqara, Ayat Al-Koersie, Al-Hasjr en de korte soera’s.' },
  },
  de: {
    o1: { ad: 'Die Buchstaben', metin: 'Hören Sie die 28 Buchstaben mit ihrem Namen und lernen Sie, sie zu erkennen.' },
    o2: { ad: 'Silben', metin: 'Lesen Sie die Buchstaben mit Fatha, Kasra und Damma.' },
    o3: { ad: 'Buchstabenformen', metin: 'Die Formen des Buchstabens am Wortanfang, in der Wortmitte und am Wortende.' },
    o4: { ad: 'Sukun, Schadda, Tanwin, Madd', metin: 'Leseübungen: Sukun, Verdoppelung, Tanwin und Dehnung.' },
    o5: { ad: 'Wörter', metin: 'Hören Sie kurze Wörter mit Vokalzeichen und sprechen Sie sie nach.' },
    o6: { ad: 'Grundlagen des Tadschwid', metin: 'Qalqala, Iqlab, Ichfa schafawi und die Arten der Madd.' },
    o7: { ad: 'Suren lesen', metin: 'Al-Fatiha und die Suren des letzten Dschuz, Vers für Vers.' },
    o8: { ad: 'Tadschwid in der Praxis', metin: 'Hören Sie Beispiele für Idgham, das Pronomen-Ha, das Ra und die Madd, geschrieben und gelesen.' },
    o9: { ad: 'Kurze Verse', metin: 'Hören Sie ausgewählte Verse aus der Sure Al-Baqara, Ayat Al-Kursi, Al-Haschr und den kurzen Suren.' },
  },
};

const ADLAR: Record<Dil, Record<string, string>> = {
  tr: {
    harf: 'Harfler', ustun: 'Üstün', esre: 'Esre', otre: 'Ötre', 'hece-ustun': 'Üstün hecileri', 'hece-esre': 'Esre heceleri', 'hece-otre': 'Ötre heceleri',
    bitisme: 'Harflerin şekilleri', 'bit-harf': 'Tek başına', 'bit-basta': 'Kelimenin başında', 'bit-ortada': 'Kelimenin ortasında', 'bit-sonda': 'Kelimenin sonunda',
    cezm: 'Cezm (sükûn)', 'cezm-anlama': 'Cezm: kavrama', 'cezm-alistirma': 'Cezm: alıştırma', sedde: 'Şedde',
    'tenvin-an': 'Üstün tenvin (-an)', 'tenvin-in': 'Esre tenvin (-in)', 'tenvin-un': 'Ötre tenvin (-un)',
    'med-a': 'Uzatma: â (üstün + elif)', 'med-i': 'Uzatma: î (esre + ye)', 'med-u': 'Uzatma: û (ötre + vav)',
    kelime: 'Kelime', 'kelime-ilk': 'İlk kelimeler', 'kelime-ustun': 'Üstünlü kelimeler', 'kelime-esre': 'Esreli kelimeler', 'kelime-otre': 'Ötreli kelimeler', 'kelime-tenvin': 'Tenvinli kelimeler',
    kalkale: 'Kalkale', iklab: 'İklâb', 'ihfa-sefevi': 'İhfâ-i şefevî', 'med-tabii': 'Tabiî med', 'med-munfasil': 'Munfasıl med', 'med-ariz': 'Ârız med', 'med-lin': 'Lîn med',
    'tv-zamir': 'Zamir hâsı (hâ-i kinâye)', 'tv-ra': 'Râ harfi', 'tv-idgam-bila': 'İdğâm bilâ ğunne', 'tv-idgam-misleyn': 'İdğâm-ı misleyn bilâ ğunne', 'tv-idgam-mutekaribeyn': 'İdğâm-ı mütekâribeyn', 'tv-idgam-mutecaniseyn': 'İdğâm-ı mütecâniseyn', 'tv-med-muttasil': 'Muttasıl med', 'tv-med-lazim': 'Lâzım med', 'tv-hurufu': 'Hurûf-u mukattaa', yazilis: 'Yazılışı', okunus: 'Okunuşu', besmele: 'Besmele', 'bakara-1-5': 'Bakara Sûresi 1–5. âyetler',
  },
  fr: {
    harf: 'Les lettres', ustun: 'Fatha', esre: 'Kasra', otre: 'Damma', 'hece-ustun': 'Syllabes avec fatha', 'hece-esre': 'Syllabes avec kasra', 'hece-otre': 'Syllabes avec damma',
    bitisme: 'Forme des lettres', 'bit-harf': 'Lettre isolée', 'bit-basta': 'Au début du mot', 'bit-ortada': 'Au milieu du mot', 'bit-sonda': 'À la fin du mot',
    cezm: 'Soukoûn', 'cezm-anlama': 'Soukoûn : comprendre', 'cezm-alistirma': 'Soukoûn : exercices', sedde: 'Chadda',
    'tenvin-an': `Tanwîn «${NB}an${NB}»`, 'tenvin-in': `Tanwîn «${NB}in${NB}»`, 'tenvin-un': `Tanwîn «${NB}oun${NB}»`,
    'med-a': `Allongement «${NB}â${NB}» (fatha + alif)`, 'med-i': `Allongement «${NB}î${NB}» (kasra + yâ’)`, 'med-u': `Allongement «${NB}oû${NB}» (damma + wâw)`,
    kelime: 'Mot', 'kelime-ilk': 'Premiers mots', 'kelime-ustun': 'Mots avec fatha', 'kelime-esre': 'Mots avec kasra', 'kelime-otre': 'Mots avec damma', 'kelime-tenvin': 'Mots avec tanwîn',
    kalkale: 'Qalqala', iklab: 'Iqlâb', 'ihfa-sefevi': 'Ikhfâ’ labial', 'med-tabii': 'Madd naturel', 'med-munfasil': 'Madd détaché', 'med-ariz': 'Madd accidentel', 'med-lin': 'Madd lîn',
    'tv-zamir': 'Le hâ’ du pronom (hâ’ al-kinâya)', 'tv-ra': 'La lettre râ’', 'tv-idgam-bila': 'Idghâm sans ghunna', 'tv-idgam-misleyn': 'Idghâm mithlayn sans ghunna', 'tv-idgam-mutekaribeyn': 'Idghâm mutaqâribayn', 'tv-idgam-mutecaniseyn': 'Idghâm mutajânisayn', 'tv-med-muttasil': 'Madd attaché (muttasil)', 'tv-med-lazim': 'Madd obligatoire (lâzim)', 'tv-hurufu': 'Les lettres isolées (hurûf muqatta‘a)', yazilis: 'Tel qu’écrit', okunus: 'Tel que lu', besmele: 'Basmala', 'bakara-1-5': 'Sourate Al-Baqara, versets 1 à 5',
  },
  en: {
    harf: 'The letters', ustun: 'Fatha', esre: 'Kasra', otre: 'Damma', 'hece-ustun': 'Syllables with fatha', 'hece-esre': 'Syllables with kasra', 'hece-otre': 'Syllables with damma',
    bitisme: 'Letter shapes', 'bit-harf': 'On its own', 'bit-basta': 'At the start of a word', 'bit-ortada': 'In the middle of a word', 'bit-sonda': 'At the end of a word',
    cezm: 'Sukun', 'cezm-anlama': 'Sukun: understanding', 'cezm-alistirma': 'Sukun: drills', sedde: 'Shadda',
    'tenvin-an': 'Tanwin “-an”', 'tenvin-in': 'Tanwin “-in”', 'tenvin-un': 'Tanwin “-un”',
    'med-a': 'Lengthening “ā” (fatha + alif)', 'med-i': 'Lengthening “ī” (kasra + yā’)', 'med-u': 'Lengthening “ū” (damma + wāw)',
    kelime: 'Word', 'kelime-ilk': 'First words', 'kelime-ustun': 'Words with fatha', 'kelime-esre': 'Words with kasra', 'kelime-otre': 'Words with damma', 'kelime-tenvin': 'Words with tanwin',
    kalkale: 'Qalqalah', iklab: 'Iqlab', 'ihfa-sefevi': 'Ikhfa shafawi (labial)', 'med-tabii': 'Natural madd', 'med-munfasil': 'Separated madd (munfasil)', 'med-ariz': 'Temporary madd (arid)', 'med-lin': 'Soft madd (lin)',
    'tv-zamir': 'The pronoun hā’ (hā’ al-kināya)', 'tv-ra': 'The letter rā’', 'tv-idgam-bila': 'Idgham without ghunna', 'tv-idgam-misleyn': 'Idgham mithlayn without ghunna', 'tv-idgam-mutekaribeyn': 'Idgham mutaqaribayn', 'tv-idgam-mutecaniseyn': 'Idgham mutajanisayn', 'tv-med-muttasil': 'Connected madd (muttasil)', 'tv-med-lazim': 'Obligatory madd (lazim)', 'tv-hurufu': 'The disjointed letters (huruf muqatta‘a)', yazilis: 'As written', okunus: 'As read', besmele: 'Basmala', 'bakara-1-5': 'Surah Al-Baqarah, verses 1–5',
  },
  nl: {
    harf: 'De letters', ustun: 'Fatha', esre: 'Kasra', otre: 'Damma', 'hece-ustun': 'Lettergrepen met fatha', 'hece-esre': 'Lettergrepen met kasra', 'hece-otre': 'Lettergrepen met damma',
    bitisme: 'Vorm van de letters', 'bit-harf': 'Los', 'bit-basta': 'Aan het begin van het woord', 'bit-ortada': 'In het midden van het woord', 'bit-sonda': 'Aan het eind van het woord',
    cezm: 'Soekoen', 'cezm-anlama': 'Soekoen: begrijpen', 'cezm-alistirma': 'Soekoen: oefeningen', sedde: 'Sjadda',
    'tenvin-an': 'Tanwien “-an”', 'tenvin-in': 'Tanwien “-in”', 'tenvin-un': 'Tanwien “-oen”',
    'med-a': 'Verlenging “aa” (fatha + alif)', 'med-i': 'Verlenging “ie” (kasra + yaa)', 'med-u': 'Verlenging “oe” (damma + waaw)',
    kelime: 'Woord', 'kelime-ilk': 'Eerste woorden', 'kelime-ustun': 'Woorden met fatha', 'kelime-esre': 'Woorden met kasra', 'kelime-otre': 'Woorden met damma', 'kelime-tenvin': 'Woorden met tanwien',
    kalkale: 'Qalqala', iklab: 'Iqlaab', 'ihfa-sefevi': 'Ikhfa shafawi (lippen)', 'med-tabii': 'Natuurlijke madd', 'med-munfasil': 'Gescheiden madd (munfasil)', 'med-ariz': 'Tijdelijke madd (aarid)', 'med-lin': 'Zachte madd (lien)',
    'tv-zamir': 'Het voornaamwoord-haa (haa’ al-kinaaya)', 'tv-ra': 'De letter raa', 'tv-idgam-bila': 'Idgham zonder ghunna', 'tv-idgam-misleyn': 'Idgham mithlayn zonder ghunna', 'tv-idgam-mutekaribeyn': 'Idgham mutaqaribayn', 'tv-idgam-mutecaniseyn': 'Idgham mutajanisayn', 'tv-med-muttasil': 'Verbonden madd (muttasil)', 'tv-med-lazim': 'Verplichte madd (lazim)', 'tv-hurufu': 'De losse letters (huruf muqatta‘a)', yazilis: 'Geschreven', okunus: 'Gelezen', besmele: 'Basmala', 'bakara-1-5': 'Soera Al-Baqara, verzen 1–5',
  },
  de: {
    harf: 'Die Buchstaben', ustun: 'Fatha', esre: 'Kasra', otre: 'Damma', 'hece-ustun': 'Silben mit Fatha', 'hece-esre': 'Silben mit Kasra', 'hece-otre': 'Silben mit Damma',
    bitisme: 'Buchstabenformen', 'bit-harf': 'Allein', 'bit-basta': 'Am Wortanfang', 'bit-ortada': 'In der Wortmitte', 'bit-sonda': 'Am Wortende',
    cezm: 'Sukun', 'cezm-anlama': 'Sukun: verstehen', 'cezm-alistirma': 'Sukun: Übungen', sedde: 'Schadda',
    'tenvin-an': 'Tanwin „-an“', 'tenvin-in': 'Tanwin „-in“', 'tenvin-un': 'Tanwin „-un“',
    'med-a': 'Dehnung „ā“ (Fatha + Alif)', 'med-i': 'Dehnung „ī“ (Kasra + Ya)', 'med-u': 'Dehnung „ū“ (Damma + Waw)',
    kelime: 'Wort', 'kelime-ilk': 'Erste Wörter', 'kelime-ustun': 'Wörter mit Fatha', 'kelime-esre': 'Wörter mit Kasra', 'kelime-otre': 'Wörter mit Damma', 'kelime-tenvin': 'Wörter mit Tanwin',
    kalkale: 'Qalqala', iklab: 'Iqlab', 'ihfa-sefevi': 'Ichfa schafawi (Lippen)', 'med-tabii': 'Natürliche Madd', 'med-munfasil': 'Getrennte Madd (munfasil)', 'med-ariz': 'Vorübergehende Madd (arid)', 'med-lin': 'Weiche Madd (lin)',
    'tv-zamir': 'Das Pronomen-Ha (Hā’ al-Kināya)', 'tv-ra': 'Der Buchstabe Ra', 'tv-idgam-bila': 'Idgham ohne Ghunna', 'tv-idgam-misleyn': 'Idgham mithlayn ohne Ghunna', 'tv-idgam-mutekaribeyn': 'Idgham mutaqaribayn', 'tv-idgam-mutecaniseyn': 'Idgham mutajanisayn', 'tv-med-muttasil': 'Verbundene Madd (muttasil)', 'tv-med-lazim': 'Verpflichtende Madd (lazim)', 'tv-hurufu': 'Die einzelnen Buchstaben (Huruf muqatta‘a)', yazilis: 'Geschrieben', okunus: 'Gelesen', besmele: 'Basmala', 'bakara-1-5': 'Sure Al-Baqara, Verse 1–5',
  },
};

const KART: Record<Dil, KartYazilari> = {
  tr: {
    dinle: 'Dinleyin', durdur: 'Durdurun', yavas: 'Yavaş dinleyin', normal: 'Normal hızda dinleyin',
    yonerge: 'Önce dinleyin, sonra aynısını sesli okuyun. Ardından dürüstçe işaretleyin.',
    dogru: 'Doğru okudum', takildim: 'Biraz takıldım', tekrar: 'Tekrar edeceğim', maddeNo: 'Madde {i} / {n}', yeni: 'Yeni', tekrarRozet: 'Tekrar',
    bitir: 'Bitirin', sonuc: 'Bugünlük bu kadar', sonucMetin: '{n} madde çalıştınız. Tekrarlar zamanı gelince kendiliğinden önünüze gelir.',
    sonucBos: 'Şu an çalışılacak madde yok. Tekrarlar zamanı gelince burada görünür.', sesHata: 'Ses açılamadı. Bağlantınızı denetleyip yeniden deneyin.',
    kaydedilemedi: 'İlerleme bu cihaza yazılamadı (tarayıcı depolamayı kapatmış olabilir).', kisayol: 'Boşluk: dinleyin · 1, 2, 3: işaretleyin',
    ilerleme: 'Çalışma ilerlemesi', dersBitti: 'Bu dersi bitirdiniz.', yeniden: 'Yeniden çalışın', bosOturum: 'Çalışılacak madde bulunamadı.',
  },
  fr: {
    dinle: 'Écouter', durdur: 'Arrêter', yavas: 'Écouter lentement', normal: 'Écouter à vitesse normale',
    yonerge: `Écoutez d’abord, puis répétez à voix haute. Ensuite, cochez honnêtement.`,
    dogru: 'Bien lu', takildim: 'J’ai hésité', tekrar: 'À refaire', maddeNo: `Élément {i}${NB}/${NB}{n}`, yeni: 'Nouveau', tekrarRozet: 'Révision',
    bitir: 'Terminer', sonuc: 'C’est tout pour aujourd’hui', sonucMetin: `Vous avez travaillé {n} éléments. Les révisions reviendront d’elles-mêmes au bon moment.`,
    sonucBos: 'Rien à travailler pour le moment. Les révisions apparaîtront ici le moment venu.', sesHata: 'Impossible de lire l’audio. Vérifiez votre connexion et réessayez.',
    kaydedilemedi: 'La progression n’a pas pu être enregistrée sur cet appareil (le stockage du navigateur est peut-être désactivé).', kisayol: `Espace${NB}: écouter · 1, 2, 3${NB}: cocher`,
    ilerleme: 'Progression de la séance', dersBitti: 'Vous avez terminé cette leçon.', yeniden: 'Retravailler', bosOturum: 'Aucun élément à travailler.',
  },
  en: {
    dinle: 'Listen', durdur: 'Stop', yavas: 'Listen slowly', normal: 'Listen at normal speed',
    yonerge: 'Listen first, then say the same aloud. Then mark honestly how it went.',
    dogru: 'Read it right', takildim: 'Stumbled a little', tekrar: 'Will repeat', maddeNo: 'Item {i} of {n}', yeni: 'New', tekrarRozet: 'Review',
    bitir: 'Finish', sonuc: 'That is enough for today', sonucMetin: 'You worked on {n} items. Reviews will come back on their own at the right time.',
    sonucBos: 'Nothing to practise right now. Reviews will show up here when they are due.', sesHata: 'The audio could not be played. Check your connection and try again.',
    kaydedilemedi: 'Progress could not be saved on this device (browser storage may be turned off).', kisayol: 'Space: listen · 1, 2, 3: mark',
    ilerleme: 'Session progress', dersBitti: 'You have finished this lesson.', yeniden: 'Practise again', bosOturum: 'No items to practise.',
  },
  nl: {
    dinle: 'Luisteren', durdur: 'Stoppen', yavas: 'Langzaam luisteren', normal: 'Op normale snelheid luisteren',
    yonerge: 'Luister eerst en zeg hetzelfde daarna hardop. Geef dan eerlijk aan hoe het ging.',
    dogru: 'Goed gelezen', takildim: 'Even gestruikeld', tekrar: 'Nog eens doen', maddeNo: 'Onderdeel {i} van {n}', yeni: 'Nieuw', tekrarRozet: 'Herhaling',
    bitir: 'Afronden', sonuc: 'Genoeg voor vandaag', sonucMetin: 'U hebt {n} onderdelen geoefend. Herhalingen komen vanzelf terug op het juiste moment.',
    sonucBos: 'Er is nu niets te oefenen. Herhalingen verschijnen hier zodra ze aan de beurt zijn.', sesHata: 'Het geluid kon niet worden afgespeeld. Controleer uw verbinding en probeer het opnieuw.',
    kaydedilemedi: 'De voortgang kon niet op dit apparaat worden opgeslagen (de opslag van de browser staat mogelijk uit).', kisayol: 'Spatie: luisteren · 1, 2, 3: aangeven',
    ilerleme: 'Voortgang van de sessie', dersBitti: 'U hebt deze les afgerond.', yeniden: 'Opnieuw oefenen', bosOturum: 'Geen onderdelen om te oefenen.',
  },
  de: {
    dinle: 'Anhören', durdur: 'Anhalten', yavas: 'Langsam anhören', normal: 'In normaler Geschwindigkeit anhören',
    yonerge: 'Hören Sie zuerst zu und sprechen Sie dasselbe dann laut nach. Markieren Sie danach ehrlich, wie es lief.',
    dogru: 'Richtig gelesen', takildim: 'Etwas gestockt', tekrar: 'Wiederhole ich', maddeNo: 'Punkt {i} von {n}', yeni: 'Neu', tekrarRozet: 'Wiederholung',
    bitir: 'Beenden', sonuc: 'Das reicht für heute', sonucMetin: 'Sie haben {n} Punkte geübt. Wiederholungen kommen zur rechten Zeit von selbst zurück.',
    sonucBos: 'Im Moment gibt es nichts zu üben. Wiederholungen erscheinen hier, sobald sie fällig sind.', sesHata: 'Der Ton konnte nicht abgespielt werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    kaydedilemedi: 'Der Fortschritt konnte auf diesem Gerät nicht gespeichert werden (der Browserspeicher ist möglicherweise ausgeschaltet).', kisayol: 'Leertaste: anhören · 1, 2, 3: markieren',
    ilerleme: 'Fortschritt der Einheit', dersBitti: 'Sie haben diese Lektion beendet.', yeniden: 'Noch einmal üben', bosOturum: 'Keine Punkte zum Üben.',
  },
};

const OKUMA: Record<Dil, Omit<OkumaYazilari, 'adimlar' | 'adlar' | 'kart'>> = {
  tr: {
    ad: 'Kur’an Okuma', ust: 'İlim Yolu', aciklama: 'Kur’an okumayı günde 10–15 dakikayla öğrenin: önce dinleyin, sonra tekrar edin. Harflerden sûrelere, Diyanet kayıtlarıyla.',
    giris: 'Her gün 10–15 dakika: önce Diyanet kaydını dinleyin, sonra aynısını sesli okuyun. Harflerden başlayıp hece, kelime ve sûre okumaya ilerlersiniz.',
    bugunBaslik: 'Bugünkü çalışma', bugunOzet: '{t} tekrar · {y} yeni madde', bugunMetin: 'Yaklaşık 12 dakika: önce zamanı gelen tekrarlar, sonra yeni maddeler.', bugunBasla: 'Bugünkü çalışmaya başlayın', bugunBitti: 'Bugün için yeni madde kalmadı.',
    bugunNot: 'Bugünkü çalışma, kaldığınız yerden devam eder.',
    haritaBaslik: 'Adımlar', adimNo: 'Adım {n}', dersSayisi: '{n} ders', maddeSayisi: '{n} madde', ilerleme: '{a} / {b} madde çalışıldı',
    izElifba: 'Elifbâ yolu', izMushaf: 'Mushaf yolu', izElifbaMetin: 'Harften tecvide: okumanın temeli.', izMushafMetin: 'Sûreleri âyet âyet dinleyip okuyun. Elifbâ bitmeden de başlayabilirsiniz.',
    geri: 'Kur’an Okuma', dersler: 'Dersler', dersCalis: 'Bu dersi çalışın', dersCalisAd: '{ad} dersini çalışın', dinlemeBaslik: 'Serbest dinleme', dinlemeMetin: 'İstediğiniz kaydı istediğiniz kadar dinleyin; bu, ilerlemenize yazılmaz.',
    sinirNot: 'Uygulama okuyuşunuzu değerlendiremez: dürüstçe işaretleyin. Asıl kontrol hocanızla birlikte okuyarak olur.',
    kaynakNot: 'Metinler ve sesler Diyanet İşleri Başkanlığı kaynaklarındandır; sûre sesleri Osman Şahin’indir.',
    hesapNot: 'İlerlemeniz bu cihazda tutulur; giriş yaparsanız hesabınızla eşitlenir.',
    js: 'Çalışma ekranı için JavaScript gerekir. Aşağıdaki kayıtları doğrudan dinleyebilirsiniz.', dinleAdi: '{ad} kaydını dinleyin', oturumGeri: 'Kur’an Okuma sayfasına dönün', adimaGit: 'Adıma gidin',
    anaKart: { ad: 'Kur’an Okuma', metin: 'Günde 10–15 dakika: Diyanet kaydını dinleyin, sonra tekrar edin. Harflerden sûrelere.', git: 'Okumaya başlayın', rozet: 'Yeni' },
    satir: { tekrar: '{t} madde bugün tekrar bekliyor', yok: 'Bugün tekrar yok', git: 'Okumaya devam edin' },
  },
  fr: {
    ad: 'Lecture du Coran', ust: 'Chemin du savoir', aciklama: 'Apprenez à lire le Coran en 10 à 15 minutes par jour : écoutez, puis répétez. Des lettres aux sourates, avec les enregistrements de la Diyanet.',
    giris: 'Chaque jour 10 à 15 minutes : écoutez d’abord l’enregistrement de la Diyanet, puis répétez-le à voix haute. Des lettres, vous passez aux syllabes, aux mots et aux sourates.',
    bugunBaslik: 'Séance du jour', bugunOzet: `{t}${NB}révisions · {y}${NB}nouveaux`, bugunMetin: 'Environ 12 minutes : d’abord les révisions du jour, puis de nouveaux éléments.', bugunBasla: 'Commencer la séance du jour', bugunBitti: 'Plus de nouvel élément pour aujourd’hui.',
    bugunNot: 'La séance du jour reprend là où vous en étiez.',
    haritaBaslik: 'Étapes', adimNo: 'Étape {n}', dersSayisi: `{n}${NB}leçons`, maddeSayisi: `{n}${NB}éléments`, ilerleme: '{a} sur {b} éléments travaillés',
    izElifba: 'Parcours de l’alphabet', izMushaf: 'Parcours du mushaf', izElifbaMetin: 'Des lettres au tajwîd : les bases de la lecture.', izMushafMetin: 'Écoutez et lisez les sourates verset par verset. Vous pouvez commencer avant d’avoir fini l’alphabet.',
    geri: 'Lecture du Coran', dersler: 'Leçons', dersCalis: 'Travailler cette leçon', dersCalisAd: 'Travailler la leçon {ad}', dinlemeBaslik: 'Écoute libre', dinlemeMetin: 'Écoutez chaque enregistrement autant que vous voulez ; cela n’est pas enregistré dans votre progression.',
    sinirNot: 'L’application ne peut pas juger votre lecture : cochez honnêtement. Le vrai contrôle se fait en lisant avec votre enseignant.',
    kaynakNot: 'Les textes et les enregistrements viennent des sources de la Diyanet ; les versets sont récités par Osman Şahin.',
    hesapNot: 'Votre progression est conservée sur cet appareil ; elle se synchronise avec votre compte si vous vous connectez.',
    js: 'L’écran de travail nécessite JavaScript. Vous pouvez écouter les enregistrements ci-dessous directement.', dinleAdi: 'Écouter l’enregistrement : {ad}', oturumGeri: 'Retour à Lecture du Coran', adimaGit: 'Aller à l’étape',
    anaKart: { ad: 'Lecture du Coran', metin: '10 à 15 minutes par jour : écoutez l’enregistrement de la Diyanet, puis répétez. Des lettres aux sourates.', git: 'Commencer la lecture', rozet: 'Nouveau' },
    satir: { tekrar: `{t}${NB}éléments à réviser aujourd’hui`, yok: 'Aucune révision aujourd’hui', git: 'Continuer la lecture' },
  },
  en: {
    ad: 'Qur’an Reading', ust: 'Path of Knowledge', aciklama: 'Learn to read the Qur’an in 10–15 minutes a day: listen first, then repeat. From letters to surahs, with Diyanet recordings.',
    giris: 'Ten to fifteen minutes a day: first listen to the Diyanet recording, then say the same aloud. You move from letters to syllables, words and surahs.',
    bugunBaslik: 'Today’s practice', bugunOzet: '{t} reviews · {y} new items', bugunMetin: 'About 12 minutes: first the reviews that are due, then new items.', bugunBasla: 'Start today’s practice', bugunBitti: 'No new items left for today.',
    bugunNot: 'Today’s practice carries on where you left off.',
    haritaBaslik: 'Steps', adimNo: 'Step {n}', dersSayisi: '{n} lessons', maddeSayisi: '{n} items', ilerleme: '{a} of {b} items practised',
    izElifba: 'The alphabet path', izMushaf: 'The mushaf path', izElifbaMetin: 'From letters to tajwid: the foundation of reading.', izMushafMetin: 'Listen to the surahs and read them verse by verse. You can start before finishing the alphabet.',
    geri: 'Qur’an Reading', dersler: 'Lessons', dersCalis: 'Practise this lesson', dersCalisAd: 'Practise the lesson: {ad}', dinlemeBaslik: 'Free listening', dinlemeMetin: 'Listen to any recording as often as you like; this is not added to your progress.',
    sinirNot: 'The app cannot judge your reading: mark honestly. The real check is reading together with your teacher.',
    kaynakNot: 'Texts and recordings come from Diyanet sources; the verses are recited by Osman Şahin.',
    hesapNot: 'Your progress is kept on this device and syncs with your account if you sign in.',
    js: 'The practice screen needs JavaScript. You can listen to the recordings below directly.', dinleAdi: 'Listen to the recording: {ad}', oturumGeri: 'Back to Qur’an Reading', adimaGit: 'Go to the step',
    anaKart: { ad: 'Qur’an Reading', metin: '10–15 minutes a day: listen to the Diyanet recording, then repeat. From letters to surahs.', git: 'Start reading', rozet: 'New' },
    satir: { tekrar: '{t} items to review today', yok: 'No reviews today', git: 'Continue reading' },
  },
  nl: {
    ad: 'Koran lezen', ust: 'Weg van kennis', aciklama: 'Leer de Koran lezen in 10 tot 15 minuten per dag: eerst luisteren, dan herhalen. Van letters tot soera’s, met opnamen van de Diyanet.',
    giris: 'Elke dag 10 tot 15 minuten: luister eerst naar de opname van de Diyanet en zeg hetzelfde daarna hardop. Van letters gaat u naar lettergrepen, woorden en soera’s.',
    bugunBaslik: 'Oefening van vandaag', bugunOzet: '{t} herhalingen · {y} nieuw', bugunMetin: 'Ongeveer 12 minuten: eerst de herhalingen die aan de beurt zijn, dan nieuwe onderdelen.', bugunBasla: 'Begin met de oefening van vandaag', bugunBitti: 'Geen nieuwe onderdelen meer voor vandaag.',
    bugunNot: 'De oefening van vandaag gaat verder waar u gebleven was.',
    haritaBaslik: 'Stappen', adimNo: 'Stap {n}', dersSayisi: '{n} lessen', maddeSayisi: '{n} onderdelen', ilerleme: '{a} van {b} onderdelen geoefend',
    izElifba: 'Het alfabetpad', izMushaf: 'Het mushafpad', izElifbaMetin: 'Van letters tot tajwied: de basis van het lezen.', izMushafMetin: 'Luister naar de soera’s en lees ze vers voor vers. U kunt beginnen voordat u het alfabet af hebt.',
    geri: 'Koran lezen', dersler: 'Lessen', dersCalis: 'Deze les oefenen', dersCalisAd: 'De les oefenen: {ad}', dinlemeBaslik: 'Vrij luisteren', dinlemeMetin: 'Luister zo vaak u wilt naar elke opname; dit wordt niet aan uw voortgang toegevoegd.',
    sinirNot: 'De app kan uw lezen niet beoordelen: geef eerlijk aan hoe het ging. De echte controle gebeurt door samen met uw leerkracht te lezen.',
    kaynakNot: 'Teksten en opnamen komen uit bronnen van de Diyanet; de verzen worden gereciteerd door Osman Şahin.',
    hesapNot: 'Uw voortgang blijft op dit apparaat bewaard en wordt met uw account gesynchroniseerd als u inlogt.',
    js: 'Het oefenscherm heeft JavaScript nodig. U kunt de opnamen hieronder rechtstreeks beluisteren.', dinleAdi: 'Luister naar de opname: {ad}', oturumGeri: 'Terug naar Koran lezen', adimaGit: 'Naar de stap',
    anaKart: { ad: 'Koran lezen', metin: '10 tot 15 minuten per dag: luister naar de opname van de Diyanet en herhaal. Van letters tot soera’s.', git: 'Begin met lezen', rozet: 'Nieuw' },
    satir: { tekrar: '{t} onderdelen om vandaag te herhalen', yok: 'Vandaag niets te herhalen', git: 'Verder met lezen' },
  },
  de: {
    ad: 'Koran lesen', ust: 'Weg des Wissens', aciklama: 'Lernen Sie, den Koran in 10 bis 15 Minuten am Tag zu lesen: erst hören, dann nachsprechen. Von den Buchstaben bis zu den Suren, mit Aufnahmen der Diyanet.',
    giris: 'Täglich 10 bis 15 Minuten: Hören Sie zuerst die Aufnahme der Diyanet und sprechen Sie sie dann laut nach. Von den Buchstaben gehen Sie zu Silben, Wörtern und Suren über.',
    bugunBaslik: 'Heutige Übung', bugunOzet: '{t} Wiederholungen · {y} neu', bugunMetin: 'Etwa 12 Minuten: zuerst die fälligen Wiederholungen, dann neue Punkte.', bugunBasla: 'Mit der heutigen Übung beginnen', bugunBitti: 'Für heute gibt es keine neuen Punkte mehr.',
    bugunNot: 'Die heutige Übung setzt dort an, wo Sie aufgehört haben.',
    haritaBaslik: 'Schritte', adimNo: 'Schritt {n}', dersSayisi: '{n} Lektionen', maddeSayisi: '{n} Punkte', ilerleme: '{a} von {b} Punkten geübt',
    izElifba: 'Der Alphabetweg', izMushaf: 'Der Mushafweg', izElifbaMetin: 'Von den Buchstaben bis zum Tadschwid: die Grundlage des Lesens.', izMushafMetin: 'Hören Sie die Suren und lesen Sie sie Vers für Vers. Sie können beginnen, bevor Sie das Alphabet abgeschlossen haben.',
    geri: 'Koran lesen', dersler: 'Lektionen', dersCalis: 'Diese Lektion üben', dersCalisAd: 'Die Lektion üben: {ad}', dinlemeBaslik: 'Freies Hören', dinlemeMetin: 'Hören Sie jede Aufnahme so oft Sie möchten; das fließt nicht in Ihren Fortschritt ein.',
    sinirNot: 'Die App kann Ihr Lesen nicht beurteilen: Markieren Sie ehrlich. Die eigentliche Kontrolle geschieht beim gemeinsamen Lesen mit Ihrer Lehrkraft.',
    kaynakNot: 'Texte und Aufnahmen stammen aus Quellen der Diyanet; die Verse werden von Osman Şahin rezitiert.',
    hesapNot: 'Ihr Fortschritt bleibt auf diesem Gerät gespeichert und wird mit Ihrem Konto abgeglichen, wenn Sie sich anmelden.',
    js: 'Der Übungsbildschirm benötigt JavaScript. Die Aufnahmen unten können Sie direkt anhören.', dinleAdi: 'Aufnahme anhören: {ad}', oturumGeri: 'Zurück zu Koran lesen', adimaGit: 'Zum Schritt',
    anaKart: { ad: 'Koran lesen', metin: '10 bis 15 Minuten am Tag: Aufnahme der Diyanet hören, dann nachsprechen. Von den Buchstaben bis zu den Suren.', git: 'Mit dem Lesen beginnen', rozet: 'Neu' },
    satir: { tekrar: '{t} Punkte heute zu wiederholen', yok: 'Heute nichts zu wiederholen', git: 'Mit dem Lesen weitermachen' },
  },
};

export const okumaMetinleri = (dil: Dil): OkumaYazilari => ({ ...OKUMA[dil], adimlar: ADIMLAR[dil], adlar: ADLAR[dil], kart: KART[dil] });
export const doldur = (s: string, d: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));

/** Dersin (grubun) görünen adı: `Ad` ya da çok parçalıysa `Ad · 2/4`; sûre derslerinde sûrenin adı. */
export function dersAdi(dil: Dil, grup: string, parca: number, parcaSayisi: number): string {
  const ad = ADLAR[dil][grup] ?? KATALOG.ogeler.find((o) => o.id === grup)?.ad[dil] ?? grup;
  return parcaSayisi > 1 ? `${ad} · ${parca}/${parcaSayisi}` : ad;
}

/** Maddenin kısa etiketi (hangi harf/şekil/konu): harf adı, hareke adı, konum, tecvid adı, yazılışı/okunuşu ya da «Sûre · n» (besmele maddesinde «Sûre · Besmele»). */
export function etiketYaz(dil: Dil, o: Pick<Oge, 'e' | 'h' | 's' | 'n'>): string {
  if (o.s) {
    const ad = KATALOG.ogeler.find((x) => x.id === o.s)?.ad[dil] ?? ADLAR[dil][o.s] ?? o.s;
    return `${ad} · ${o.n ?? ADLAR[dil].besmele}`; // n yoksa besmele maddesi
  }
  const parcalar: string[] = [];
  if (o.e) parcalar.push(ADLAR[dil][o.e] ?? '');
  if (o.h) parcalar.push(ELIFBA_HARFLERI.find((x) => x.id === o.h)?.ad[dil] ?? '');
  return parcalar.filter(Boolean).join(' · ');
}
