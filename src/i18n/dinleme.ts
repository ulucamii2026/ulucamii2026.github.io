import type { Dil } from './ui';
import { EC_METIN, type EcouterKod } from '../lib/ecouter';

type Metin = { [K in keyof typeof EC_METIN]: string } & {
  geri: string; gezinme: string; oge: string; satir: string; dokun: string;
  frNotu: string; kaynak: string; besmele: string; besmeleCal: string; metinCal: string;
};
const ortak = { ...EC_METIN };
export const DINLEME: Record<Dil, Metin> = {
  fr: { ...ortak, besmele: 'Basmala', besmeleCal: 'Écouter la basmala', metinCal: 'Écouter le texte affiché', geri: 'Tous les cours audio', gezinme: 'Parcours des cours', oge: 'éléments', satir: 'lignes', dokun: 'touchez pour écouter', frNotu: 'Transcription et sens en français', kaynak: 'Enregistrements officiels de la Diyanet' },
  tr: { ...ortak, besmele: 'Besmele', besmeleCal: 'Besmeleyi dinle', metinCal: 'Yazılı metni dinle', etiket: 'Dinle', kurum: 'Ulu Camii · Marche-en-Famenne', tamEtiket: 'Tamamını dinle', kontroller: 'Dinleme ayarları', hizBaslik: 'Hız', hizYavasAd: 'Yavaş hız, 0,75 kat', hizNormalAd: 'Normal hız, 1 kat', tekrar: 'Tekrarla', tekrarIpucu: '“Tekrarla” açıkken her parça 3 kez çalınır. Aralarda kayıt süresi kadar beklenir; dinleyin, sonra sesli tekrar edin.', zincir: 'Sırayla çal', zincirIpucu: 'Parçalar sırayla çalınır.', satirCal: '{no}. bölümü dinle', ogeCal: '{ad} dinle', hata: 'Ses çalınamadı. Bağlantınızı kontrol edip yeniden deneyin.', noscript: 'Oynatıcı için JavaScript gerekir. Aşağıdaki kayıt bağlantılarını doğrudan açabilirsiniz.', noscriptListe: 'Ses kayıtları', yonlendirMetin: 'Seviye testine yönlendiriliyorsunuz.', yonlendirDugme: 'Devam et', geri: 'Bütün sesli dersler', gezinme: 'Dersler arasında gezinme', oge: 'öge', satir: 'satır', dokun: 'dinlemek için dokunun', frNotu: 'Fransızca okunuş ve anlam', kaynak: 'Resmî Diyanet kayıtları' },
  en: { ...ortak, besmele: 'Basmala', besmeleCal: 'Listen to the basmala', metinCal: 'Listen to the displayed text', etiket: 'Listen', kurum: 'Ulu Camii Mosque · Marche-en-Famenne', tamEtiket: 'Listen to the full recording', kontroller: 'Playback settings', hizBaslik: 'Speed', hizYavas: '0.75×', hizYavasAd: 'Slow speed, 0.75 times', hizNormalAd: 'Normal speed, 1 time', tekrar: 'Repeat', tekrarIpucu: 'When “Repeat” is on, each passage plays 3 times, with a pause as long as the recording: listen, then repeat aloud.', zincir: 'Play in order', zincirIpucu: 'Passages play one after another.', satirCal: 'Listen to passage {no}', ogeCal: 'Listen to {ad}', hata: 'The audio could not play. Check your connection and try again.', noscript: 'The player needs JavaScript. You can open the recordings directly below.', noscriptListe: 'Recordings', yonlendirMetin: 'You are being redirected to the level test.', yonlendirDugme: 'Continue', geri: 'All audio lessons', gezinme: 'Lesson navigation', oge: 'items', satir: 'lines', dokun: 'tap to listen', frNotu: 'French transcription and meaning', kaynak: 'Official Diyanet recordings' },
  nl: { ...ortak, besmele: 'Basmala', besmeleCal: 'De basmala beluisteren', metinCal: 'De weergegeven tekst beluisteren', etiket: 'Luisteren', kurum: 'Ulu Camii-moskee · Marche-en-Famenne', tamEtiket: 'Volledige opname beluisteren', kontroller: 'Afspeelinstellingen', hizBaslik: 'Snelheid', hizYavasAd: 'Langzaam, 0,75 keer', hizNormalAd: 'Normale snelheid, 1 keer', tekrar: 'Herhalen', tekrarIpucu: 'Met “Herhalen” aan wordt elke passage 3 keer afgespeeld, met een pauze zo lang als de opname: luister en herhaal hardop.', zincir: 'Op volgorde afspelen', zincirIpucu: 'De passages worden na elkaar afgespeeld.', satirCal: 'Passage {no} beluisteren', ogeCal: '{ad} beluisteren', hata: 'De opname kan niet worden afgespeeld. Controleer uw verbinding en probeer het opnieuw.', noscript: 'De speler heeft JavaScript nodig. U kunt de opnamen hieronder rechtstreeks openen.', noscriptListe: 'Opnamen', yonlendirMetin: 'U wordt doorgestuurd naar de niveautest.', yonlendirDugme: 'Verder', geri: 'Alle audiolessen', gezinme: 'Lesnavigatie', oge: 'onderdelen', satir: 'regels', dokun: 'tik om te luisteren', frNotu: 'Franse transcriptie en betekenis', kaynak: 'Officiële opnamen van Diyanet' },
  de: { ...ortak, besmele: 'Basmala', besmeleCal: 'Basmala anhören', metinCal: 'Angezeigten Text anhören', etiket: 'Anhören', kurum: 'Ulu-Camii-Moschee · Marche-en-Famenne', tamEtiket: 'Vollständige Aufnahme anhören', kontroller: 'Wiedergabeeinstellungen', hizBaslik: 'Geschwindigkeit', hizYavasAd: 'Langsam, 0,75-fach', hizNormalAd: 'Normale Geschwindigkeit, 1-fach', tekrar: 'Wiederholen', tekrarIpucu: 'Mit „Wiederholen“ wird jeder Abschnitt 3-mal abgespielt. Die Pause dauert so lange wie die Aufnahme: zuhören und laut nachsprechen.', zincir: 'Der Reihe nach abspielen', zincirIpucu: 'Die Abschnitte werden nacheinander abgespielt.', satirCal: 'Abschnitt {no} anhören', ogeCal: '{ad} anhören', hata: 'Die Aufnahme konnte nicht abgespielt werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.', noscript: 'Der Player benötigt JavaScript. Die Aufnahmen können Sie unten direkt öffnen.', noscriptListe: 'Aufnahmen', yonlendirMetin: 'Sie werden zum Einstufungstest weitergeleitet.', yonlendirDugme: 'Weiter', geri: 'Alle Audiokurse', gezinme: 'Kursnavigation', oge: 'Elemente', satir: 'Zeilen', dokun: 'zum Anhören antippen', frNotu: 'Französische Umschrift und Bedeutung', kaynak: 'Offizielle Aufnahmen von Diyanet' },
};

// Fransızca kitabın karekodları kalıcıdır. Diğer diller ayrı statik sayfalardır.
export const dersYolu = (dil: Dil, kod: string) => dil === 'fr' ? `/e/${kod}/` : `/${dil}/audio/${kod}/`;

const basliklar: Record<string, [string, string, string, string]> = {
  alphabet: ['Arap alfabesindeki 28 harf', 'The 28 Arabic letters', 'De 28 Arabische letters', 'Die 28 arabischen Buchstaben'],
  fatha: ['Üstün (fetha): 28 harf', 'Fatḥa: 28 letters with a short a', 'Fatḥa: 28 letters met een korte a', 'Fatḥa: 28 Buchstaben mit kurzem a'],
  kasra: ['Esre (kesra): 28 harf', 'Kasra: 28 letters with a short i', 'Kasra: 28 letters met een korte i', 'Kasra: 28 Buchstaben mit kurzem i'],
  damma: ['Ötre (damme): 28 harf', 'Ḍamma: 28 letters with a short u', 'Ḍamma: 28 letters met een korte oe', 'Ḍamma: 28 Buchstaben mit kurzem u'],
  e03: ['Harfler ve sesleri', 'Letters and their sounds', 'Letters en hun klanken', 'Buchstaben und ihre Laute'],
  e08: ['Uzun â (üstün ve elif)', 'Long ā (fatḥa and alif)', 'Lange ā (fatḥa en alif)', 'Langes ā (Fatḥa und Alif)'],
  e09: ['Kısa ve uzun a: karşılaştırma', 'Short and long a: comparison', 'Korte en lange a: vergelijking', 'Kurzes und langes a: Vergleich'],
  e11: ['İki üstün: tenvin an', 'Tanwīn an', 'Tanwīn an', 'Tanwīn an'],
  e13: ['İki üstün: alıştırmalar', 'Tanwīn an: exercises', 'Tanwīn an: oefeningen', 'Tanwīn an: Übungen'],
  e16: ['Uzun î (esre ve yâ)', 'Long ī (kasra and yā)', 'Lange ī (kasra en yā)', 'Langes ī (Kasra und Yā)'],
  e19: ['İki esre: tenvin in', 'Tanwīn in', 'Tanwīn in', 'Tanwīn in'],
  e24: ['Uzun û (ötre ve vâv)', 'Long ū (ḍamma and wāw)', 'Lange ū (ḍamma en wāw)', 'Langes ū (Ḍamma und Wāw)'],
  e27: ['İki ötre: tenvin un', 'Tanwīn un', 'Tanwīn oen', 'Tanwīn un'],
  e30: ['Cezim (sükûn)', 'Sukūn', 'Sukūn', 'Sukūn'],
  e31: ['Cezmi anlama', 'Understanding sukūn', 'Sukūn begrijpen', 'Sukūn verstehen'],
  e32: ['Cezim alıştırmaları', 'Sukūn exercises', 'Sukūn-oefeningen', 'Sukūn-Übungen'],
  e34: ['Şedde alıştırmaları', 'Shadda exercises', 'Shadda-oefeningen', 'Shadda-Übungen'],
  e37: ['Hû / hî zamiri: uzatma', 'Hū / hī: when to lengthen', 'Hū / hī: wanneer verlengen', 'Hū / hī: wann gedehnt wird'],
  e38: ['Hû / hî zamiri: uzatmama', 'Hū / hī: when not to lengthen', 'Hū / hī: wanneer niet verlengen', 'Hū / hī: wann nicht gedehnt wird'],
  e41: ['Durak (vakıf) kuralları', 'Stopping (waqf): rules', 'Stoppen (waqf): regels', 'Anhalten (Waqf): Regeln'],
  e42: ['Râ harfi: kalın ve ince okuyuş', 'Rā: heavy and light pronunciation', 'Rā: zware en lichte uitspraak', 'Rā: schwere und leichte Aussprache'],
  e44: ['Allah lafzındaki lâm', 'The lām in the name Allah', 'De lām in de naam Allah', 'Das Lām im Namen Allah'],
  e45: ['Allah lafzındaki lâm: alıştırmalar', 'Lām in Allah: exercises', 'Lām in Allah: oefeningen', 'Lām in Allah: Übungen'],
  e46: ['İhfâ', 'Ikhfā', 'Ikhfā', 'Ikhfā'],
  e47: ['İzhâr', 'Iẓhār', 'Iẓhār', 'Iẓhār'],
  e48: ['İhfâ ve izhâr alıştırmaları', 'Ikhfā and iẓhār: exercises', 'Ikhfā en iẓhār: oefeningen', 'Ikhfā und Iẓhār: Übungen'],
  e51: ['İdgam meal-gunne', 'Idghām with ghunna', 'Idghām met ghunna', 'Idghām mit Ghunna'],
  e53: ['Aynı iki harfin gunneli idgamı', 'Identical letters: idghām with ghunna', 'Gelijke letters: idghām met ghunna', 'Gleiche Buchstaben: Idghām mit Ghunna'],
  e55: ['İklâb', 'Iqlāb', 'Iqlāb', 'Iqlāb'],
  e56: ['Dudak ihfâsı', 'Labial ikhfā', 'Labiale ikhfā', 'Labiales Ikhfā'],
  e63: ['Kalkale', 'Qalqala', 'Qalqala', 'Qalqala'],
  e66: ['Medd-i tabii', 'Natural madd', 'Natuurlijke madd', 'Natürlicher Madd'],
  e68: ['Medd-i munfasıl', 'Separate madd', 'Gescheiden madd', 'Getrennter Madd'],
  e70: ['Medd-i ârız', 'Incidental madd', 'Tijdelijke madd', 'Vorübergehender Madd'],
  e71: ['Medd-i lîn', 'Madd līn', 'Madd līn', 'Madd Līn'],
  'mots-simples': ['İlk kelimeler: üç kısa hareke', 'First words: three short vowels', 'Eerste woorden: drie korte klinkers', 'Erste Wörter: drei kurze Vokale'],
  subhaneke: ['Sübhâneke duası', 'Subḥānaka: opening supplication', 'Subḥānaka: openingssmeekbede', 'Subḥānaka: Bittgebet zu Beginn'],
  tahiyyat: ['Tahiyyat duası', 'At-taḥiyyāt: the sitting prayer', 'At-taḥiyyāt: het zittende gebed', 'At-Taḥiyyāt: Gebet im Sitzen'],
  salli: ['Allahümme Salli', 'Allāhumma ṣalli', 'Allāhumma ṣalli', 'Allāhumma ṣalli'],
  barik: ['Allahümme Bârik', 'Allāhumma bārik', 'Allāhumma bārik', 'Allāhumma bārik'],
  'kunut-1': ['Kunut duası 1', 'Qunūt supplication 1', 'Qunūt-smeekbede 1', 'Qunūt-Bittgebet 1'],
  'kunut-2': ['Kunut duası 2', 'Qunūt supplication 2', 'Qunūt-smeekbede 2', 'Qunūt-Bittgebet 2'],
  ezan: ['Sabah ezanı', 'Adhān: dawn call to prayer', 'Adhān: oproep tot het ochtendgebed', 'Adhān: Gebetsruf zum Morgengebet'],
  kamet: ['Kamet', 'Iqāma: call before prayer', 'Iqāma: oproep vlak voor het gebed', 'Iqāma: Ruf vor dem Gebet'],
  'ezan-duasi': ['Ezan duası', 'Supplication after the adhān', 'Smeekbede na de adhān', 'Bittgebet nach dem Adhān'],
  'rabbena-atina': ['Rabbenâ Âtinâ duası', 'Rabbanā ātinā', 'Rabbanā ātinā', 'Rabbanā ātinā'],
  rabbenagfirli: ['Rabbenağfirlî duası', 'Rabbana-ghfir lī', 'Rabbana-ghfir lī', 'Rabbana-ghfir lī'],
  'ayetel-kursi': ['Âyetü’l-Kürsî', 'Āyat al-Kursī', 'Āyat al-Kursī', 'Āyat al-Kursī'],
};
const sureler: Record<string, [string, string]> = {
  fatiha:['Fâtiha','al-Fātiḥa'], insirah:['İnşirah','ash-Sharḥ'], kadir:['Kadir','al-Qadr'], asr:['Asr','al-ʿAṣr'], fil:['Fil','al-Fīl'], kureys:['Kureyş','Quraysh'], maun:['Mâûn','al-Māʿūn'], kevser:['Kevser','al-Kawthar'], kafirun:['Kâfirûn','al-Kāfirūn'], nasr:['Nasr','an-Naṣr'], tebbet:['Tebbet','al-Masad'], ihlas:['İhlâs','al-Ikhlāṣ'], felak:['Felak','al-Falaq'], nas:['Nâs','an-Nās'],
};
const guided: Record<string,string> = {e76:'fatiha',e81:'kevser',e85:'ihlas',e86:'felak'};
const letterGroups = ['ا ب ت ث','ج ح خ','د ذ ر ز','س ش ص ض','ط ظ ع غ','ف ق ك ل','م ن و ه ي'];
export function dersBasligi(dil: Dil, kod: string, asil: string): string {
  if (dil === 'fr') return asil;
  const ix = ({tr:0,en:1,nl:2,de:3} as const)[dil];
  if (basliklar[kod]) return basliklar[kod][ix];
  if (sureler[kod]) return [`${sureler[kod][0]} Sûresi`, `Surah ${sureler[kod][1]}`, `Soera ${sureler[kod][1]}`, `Sure ${sureler[kod][1]}`][ix];
  if (guided[kod]) return `${['Rehberli okuma','Guided reading','Begeleid lezen','Begleitetes Lesen'][ix]}: ${dersBasligi(dil,guided[kod],asil)}`;
  if (/^lettres-[1-7]$/.test(kod)) return `${['Harfler','Letters','Letters','Buchstaben'][ix]}: ${letterGroups[Number(kod.slice(-1))-1]}`;
  throw new Error(`Ders başlığı çevirisi eksik: ${dil}/${kod}`);
}
export function dersIcerigi(dil: Dil, kod: string, asil: EcouterKod): EcouterKod {
  if (dil === 'fr') return asil;
  const m=DINLEME[dil];
  return {...asil, baslik:dersBasligi(dil,kod,asil.baslik),
    altbaslik:asil.ogeler ? `${asil.ogeler.length} ${m.oge} · ${m.dokun}` : `${asil.satirlar?.length ?? 0} ${m.satir}`,
    tam:asil.tam ? {...asil.tam,etiket:m.tamEtiket} : undefined};
}
