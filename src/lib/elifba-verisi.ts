/**
 * İnteraktif Elif-Bâ Harf Tahtası Verisi.
 * 28 Arapça harf: yalın, başta, ortada, sonda yazılışları,
 * müfredattaki grupları ve mahreç özellikleri.
 */
import type { Dil } from '../i18n/ui';

export type HarfGrup = 'hepsi' | 'elif' | 'hi' | 'sin' | 'ayn' | 'lam';

export type HarfOgesi = {
  id: string;
  ad: Record<Dil, string>;
  harf: string;
  basta: string;
  ortada: string;
  sonda: string;
  grup: 'elif' | 'hi' | 'sin' | 'ayn' | 'lam';
  kalinMi?: boolean;
  peltekMi?: boolean;
  ipucu: Record<Dil, string>;
};

export const HARF_GRUPLARI: { id: HarfGrup; ad: Record<Dil, string> }[] = [
  { id: 'hepsi', ad: { tr: 'Bütün Harfler', fr: 'Toutes les lettres', en: 'All Letters' } },
  { id: 'elif', ad: { tr: '1. Elif Grubu', fr: '1. Groupe Alif', en: '1. Alif Group' } },
  { id: 'hi', ad: { tr: '2. Hı Grubu', fr: '2. Groupe Kha', en: '2. Kha Group' } },
  { id: 'sin', ad: { tr: '3. Şîn Grubu', fr: '3. Groupe Shin', en: '3. Shin Group' } },
  { id: 'ayn', ad: { tr: '4. Ayn Grubu', fr: '4. Groupe Ayn', en: '4. Ayn Group' } },
  { id: 'lam', ad: { tr: '5. Lâm Grubu', fr: '5. Groupe Lam', en: '5. Lam Group' } },
];

export const ELIFBA_HARFLERI: HarfOgesi[] = [
  {
    id: 'elif',
    ad: { tr: 'Elif', fr: 'Alif', en: 'Alif' },
    harf: 'ا',
    basta: 'ا',
    ortada: 'ـا',
    sonda: 'ـا',
    grup: 'elif',
    ipucu: { tr: 'Boğazın sonundan çıkan düz harf. Kendinden sonrakine bitişmez.', fr: 'Lettre droite de la gorge. Ne se lie pas après.', en: 'Straight vertical letter. Does not connect to the left.' },
  },
  {
    id: 'be',
    ad: { tr: 'Bâ / Be', fr: 'Ba', en: 'Baa' },
    harf: 'ب',
    basta: 'بـ',
    ortada: 'ـبـ',
    sonda: 'ـب',
    grup: 'elif',
    ipucu: { tr: 'Dudakların ıslak kısmının birbirine dokunmasıyla çıkar. Noktası altındadır.', fr: 'Se prononce en fermant les lèvres. Point en dessous.', en: 'Formed by closing lips. Single dot underneath.' },
  },
  {
    id: 'te',
    ad: { tr: 'Tâ / Te', fr: 'Ta', en: 'Taa' },
    harf: 'ت',
    basta: 'تـ',
    ortada: 'ـتـ',
    sonda: 'ـت',
    grup: 'elif',
    ipucu: { tr: 'Dil ucunun üst ön dişlerin etine değmesiyle çıkar. Üstte iki noktası vardır.', fr: 'Bout de la langue contre les incisives. Deux points au-dessus.', en: 'Tip of tongue against upper teeth roots. Two dots above.' },
  },
  {
    id: 'se',
    ad: { tr: 'Sâ / Se (Peltek)', fr: 'Tha (interdentale)', en: 'Thaa (soft)' },
    harf: 'ث',
    basta: 'ثـ',
    ortada: 'ـثـ',
    sonda: 'ـث',
    grup: 'elif',
    peltekMi: true,
    ipucu: { tr: 'Peltek ve incedir. Dil ucu dişlerin arasından hafifçe çıkar. Üstte üç nokta.', fr: 'Interdentale douce. Trois points au-dessus.', en: 'Soft and lisping sound. Three dots above.' },
  },
  {
    id: 'cim',
    ad: { tr: 'Cîm', fr: 'Jim', en: 'Jeem' },
    harf: 'ج',
    basta: 'جـ',
    ortada: 'ـجـ',
    sonda: 'ـج',
    grup: 'elif',
    ipucu: { tr: 'Dil ortasının üst damağa basmasıyla çıkar. Noktası karnındadır.', fr: 'Milieu de la langue contre le palais. Point au milieu.', en: 'Middle of tongue against hard palate. Point in center.' },
  },
  {
    id: 'ha',
    ad: { tr: 'Hâ (Boğaz)', fr: 'Ha (gorge)', en: 'Haa (throat)' },
    harf: 'ح',
    basta: 'حـ',
    ortada: 'ـحـ',
    sonda: 'ـح',
    grup: 'elif',
    ipucu: { tr: 'Boğaz ortasının hafif sıkılmasıyla çıkan tatlı ve net bir "H" sesidir.', fr: 'Friction douce au milieu de la gorge. Sans point.', en: 'Clear whispering "H" from the middle of the throat. No dots.' },
  },
  {
    id: 'hi',
    ad: { tr: 'Hı (Hırıltılı / Kalın)', fr: 'Kha (rauque)', en: 'Khaa (raspy)' },
    harf: 'خ',
    basta: 'خـ',
    ortada: 'ـخـ',
    sonda: 'ـخ',
    grup: 'hi',
    kalinMi: true,
    ipucu: { tr: 'Boğazın ağza en yakın yerinden, hırıltılı ve kalın çıkar. Noktası tepesindedir.', fr: 'Rauque et sonore, point au-dessus.', en: 'Heavy rasping sound from upper throat. Dot above.' },
  },
  {
    id: 'dal',
    ad: { tr: 'Dâl', fr: 'Dal', en: 'Daal' },
    harf: 'د',
    basta: 'د',
    ortada: 'ـد',
    sonda: 'ـد',
    grup: 'hi',
    ipucu: { tr: 'Dil ucunun üst ön dişlerin köküne değmesiyle çıkar. Kendinden sonrakine bitişmez.', fr: 'Bout de langue aux gencives supérieures. Ne se lie pas après.', en: 'Tip of tongue touching roots of upper teeth. Does not connect left.' },
  },
  {
    id: 'zel',
    ad: { tr: 'Zel (Peltek)', fr: 'Dhal (interdentale)', en: 'Dhaal (soft)' },
    harf: 'ذ',
    basta: 'ذ',
    ortada: 'ـذ',
    sonda: 'ـذ',
    grup: 'hi',
    peltekMi: true,
    ipucu: { tr: 'Peltek ve ince "Z" sesi. Dil ucu ön dişlerin arasına konur. Noktası vardır.', fr: 'Z doux interdental avec un point au-dessus.', en: 'Soft lisping Z with a dot on top. Does not connect left.' },
  },
  {
    id: 'ra',
    ad: { tr: 'Râ', fr: 'Ra', en: 'Raa' },
    harf: 'ر',
    basta: 'ر',
    ortada: 'ـر',
    sonda: 'ـر',
    grup: 'hi',
    kalinMi: true,
    ipucu: { tr: 'Dil ucunun üst ön damağa hafifçe titremesiyle çıkar. Kendinden sonrakine bitişmez.', fr: 'R roulé de la pointe de la langue.', en: 'Rolling R produced with tip of tongue.' },
  },
  {
    id: 'ze',
    ad: { tr: 'Zâ / Ze (Keskin)', fr: 'Zay', en: 'Zay' },
    harf: 'ز',
    basta: 'ز',
    ortada: 'ـز',
    sonda: 'ـز',
    grup: 'hi',
    ipucu: { tr: 'Keskin ve net "Z" sesidir. Noktası tepesindedir. Kendinden sonrakine bitişmez.', fr: 'Z net et sonore avec point au-dessus.', en: 'Sharp buzzing Z sound with single dot.' },
  },
  {
    id: 'sin',
    ad: { tr: 'Sîn (İnce)', fr: 'Sin', en: 'Seen' },
    harf: 'س',
    basta: 'سـ',
    ortada: 'ـسـ',
    sonda: 'ـس',
    grup: 'hi',
    ipucu: { tr: 'Üç dişli, ince ve ıslıklı "S" sesidir. Noktasızdır.', fr: 'S doux et sifflant à trois dents, sans point.', en: 'Soft hissing S sound with three teeth.' },
  },
  {
    id: 'sin2',
    ad: { tr: 'Şîn', fr: 'Shin', en: 'Sheen' },
    harf: 'ش',
    basta: 'شـ',
    ortada: 'ـشـ',
    sonda: 'ـش',
    grup: 'sin',
    ipucu: { tr: 'Dil ortası damağa yükseltilerek çıkarılan "Ş" sesidir. Üstte üç noktası vardır.', fr: 'Ch sonore avec trois points au-dessus.', en: 'Sh sound as in "shine" with three dots on top.' },
  },
  {
    id: 'sad',
    ad: { tr: 'Sâd (Kalın)', fr: 'Sad (emphatique)', en: 'Saad (heavy)' },
    harf: 'ص',
    basta: 'صـ',
    ortada: 'ـصـ',
    sonda: 'ـص',
    grup: 'sin',
    kalinMi: true,
    ipucu: { tr: 'Kalın, tok ve dolgun "S" sesidir. Ağız içi hava ile dolar.', fr: 'S emphatique et profond.', en: 'Deep and heavy emphatic S sound.' },
  },
  {
    id: 'dad',
    ad: { tr: 'Dâd (Kalın)', fr: 'Dad (emphatique)', en: 'Daad (heavy)' },
    harf: 'ض',
    basta: 'ضـ',
    ortada: 'ـضـ',
    sonda: 'ـض',
    grup: 'sin',
    kalinMi: true,
    ipucu: { tr: 'Dil yanının üst azı dişlerine yaslanmasıyla çıkan kalın "D" sesidir. Noktası vardır.', fr: 'D emphatique caractéristique de la langue arabe.', en: 'Unique emphatic heavy D sound with single dot.' },
  },
  {
    id: 'ti',
    ad: { tr: 'Tı (Kalın)', fr: 'Ta (emphatique)', en: 'Taa (heavy)' },
    harf: 'ط',
    basta: 'طـ',
    ortada: 'ـطـ',
    sonda: 'ـط',
    grup: 'sin',
    kalinMi: true,
    ipucu: { tr: 'Kalın ve tok "T" sesidir. Dil damağa yapışır.', fr: 'T emphatique très sonore.', en: 'Strong emphatic heavy T sound.' },
  },
  {
    id: 'zi',
    ad: { tr: 'Zı (Kalın & Peltek)', fr: 'Zha (emphatique & interdentale)', en: 'Dhaa (heavy & soft)' },
    harf: 'ظ',
    basta: 'ظـ',
    ortada: 'ـظـ',
    sonda: 'ـظ',
    grup: 'sin',
    kalinMi: true,
    peltekMi: true,
    ipucu: { tr: 'Hem kalın hem peltek okunan "Z" sesidir. Noktası vardır.', fr: 'Z emphatique et interdental avec un point.', en: 'Heavy and soft interdental sound with single dot.' },
  },
  {
    id: 'ayn',
    ad: { tr: 'Ayn', fr: 'Ayn (gorge)', en: 'Ayn (throat)' },
    harf: 'ع',
    basta: 'عـ',
    ortada: 'ـعـ',
    sonda: 'ـع',
    grup: 'ayn',
    ipucu: { tr: 'Boğazın tam ortasının sıkılmasıyla çıkarılan özel ve derin sestir.', fr: 'Son guttural profond du milieu de la gorge.', en: 'Deep guttural sound from the middle of the throat.' },
  },
  {
    id: 'gayn',
    ad: { tr: 'Ğayn (Kalın)', fr: 'Ghayn', en: 'Ghayn (heavy)' },
    harf: 'غ',
    basta: 'غـ',
    ortada: 'ـغـ',
    sonda: 'ـغ',
    grup: 'ayn',
    kalinMi: true,
    ipucu: { tr: 'Fransızca "R" veya yumuşak "Ğ" sesine benzer, kalın ve boğazdan akar. Noktası vardır.', fr: 'Proche du R grasseyé français, point au-dessus.', en: 'Resembles French R sound, produced from upper throat.' },
  },
  {
    id: 'fe',
    ad: { tr: 'Fâ / Fe', fr: 'Fa', en: 'Faa' },
    harf: 'ف',
    basta: 'فـ',
    ortada: 'ـفـ',
    sonda: 'ـف',
    grup: 'ayn',
    ipucu: { tr: 'Üst ön dişlerin alt dudağın içine değmesiyle çıkar. Bir noktası vardır.', fr: 'Dents supérieures sur la lèvre inférieure. Un point.', en: 'Upper teeth on lower lip. Single dot above.' },
  },
  {
    id: 'kaf',
    ad: { tr: 'Kâf (Kalın)', fr: 'Qaf (profond)', en: 'Qaaf (deep)' },
    harf: 'ق',
    basta: 'قـ',
    ortada: 'ـقـ',
    sonda: 'ـق',
    grup: 'ayn',
    kalinMi: true,
    ipucu: { tr: 'Dil kökünün küçük dile doğru basmasıyla çıkan kalın ve sert "K" sesidir. İki noktası vardır.', fr: 'K guttural très profond avec deux points.', en: 'Deep and heavy K from the back of the throat. Two dots.' },
  },
  {
    id: 'kef',
    ad: { tr: 'Kef (İnce)', fr: 'Kaf (doux)', en: 'Kaaf (soft)' },
    harf: 'ك',
    basta: 'كـ',
    ortada: 'ـكـ',
    sonda: 'ـك',
    grup: 'ayn',
    ipucu: { tr: 'Dil kökünün biraz önünden çıkan ince "K" sesidir.', fr: 'K classique doux et léger.', en: 'Light standard K sound as in "kite".' },
  },
  {
    id: 'lam',
    ad: { tr: 'Lâm', fr: 'Lam', en: 'Laam' },
    harf: 'ل',
    basta: 'لـ',
    ortada: 'ـلـ',
    sonda: 'ـل',
    grup: 'lam',
    ipucu: { tr: 'Dil ucunun üst ön damağa değmesiyle çıkarılan akıcı "L" sesidir.', fr: 'L fluide de la pointe de la langue.', en: 'Smooth flowing L sound.' },
  },
  {
    id: 'mim',
    ad: { tr: 'Mîm', fr: 'Mim', en: 'Meem' },
    harf: 'م',
    basta: 'مـ',
    ortada: 'ـمـ',
    sonda: 'ـم',
    grup: 'lam',
    ipucu: { tr: 'Dudakların birbirine kapanmasıyla çıkarılan "M" sesidir.', fr: 'M bilabial en fermant les lèvres.', en: 'M sound made by closing both lips.' },
  },
  {
    id: 'nun',
    ad: { tr: 'Nûn', fr: 'Noun', en: 'Noon' },
    harf: 'ن',
    basta: 'نـ',
    ortada: 'ـنـ',
    sonda: 'ـن',
    grup: 'lam',
    ipucu: { tr: 'Dil ucunun üst ön diş etine değmesiyle ve genizden çıkarılan "N" sesidir.', fr: 'N sonore avec légère résonance nasale.', en: 'N sound with slight nasal resonance. Single dot in cup.' },
  },
  {
    id: 'vav',
    ad: { tr: 'Vâv', fr: 'Waw', en: 'Waaw' },
    harf: 'و',
    basta: 'و',
    ortada: 'ـو',
    sonda: 'ـو',
    grup: 'lam',
    ipucu: { tr: 'Dudakların ileriye doğru yuvarlanmasıyla çıkarılan "V/W" sesidir. Kendinden sonrakine bitişmez.', fr: 'Lèvres arrondies comme un W anglais. Ne se lie pas après.', en: 'Formed by rounding lips as in English "W". Does not connect left.' },
  },
  {
    id: 'he',
    ad: { tr: 'He (Göğüs)', fr: 'Ha (léger)', en: 'Haa (light)' },
    harf: 'ه',
    basta: 'هـ',
    ortada: 'ـهـ',
    sonda: 'ـه',
    grup: 'lam',
    ipucu: { tr: 'Boğazın en derininden göğüsten gelen ince ve hafif "H" sesidir.', fr: 'H très léger venant du fond de la gorge.', en: 'Very light and airy H coming from the chest.' },
  },
  {
    id: 'ye',
    ad: { tr: 'Ye', fr: 'Ya', en: 'Yaa' },
    harf: 'ي',
    basta: 'يـ',
    ortada: 'ـيـ',
    sonda: 'ـي',
    grup: 'lam',
    ipucu: { tr: 'Dil ortasının damağa yaklaşmasıyla çıkan "Y" sesidir. Altında iki noktası vardır.', fr: 'Y sonore avec deux points en dessous.', en: 'Y sound with two dots underneath.' },
  },
];

export type HarekeTuru = 'ustun' | 'esre' | 'otre' | 'cezm';

export type HarekeOgesi = {
  id: HarekeTuru;
  ad: Record<Dil, string>;
  isaret: string;
  aciklama: Record<Dil, string>;
  sesEtiketi: Record<Dil, string>;
};

export const HAREKELER: HarekeOgesi[] = [
  {
    id: 'ustun',
    ad: { tr: 'Üstün (Fetha)', fr: 'Fatha (A / E)', en: 'Fatha (A / E)' },
    isaret: '\u064E',
    aciklama: {
      tr: 'Harfin üstüne konur. İnce harfleri "E", kalın harfleri "A" sesiyle okutur.',
      fr: 'Placée au-dessus de la lettre. Donne le son « E » (lettres légères) ou « A » (lettres lourdes).',
      en: 'Placed above the letter. Produces "E" for light letters and "A" for heavy letters.',
    },
    sesEtiketi: { tr: 'E / A', fr: 'E / A', en: 'E / A' },
  },
  {
    id: 'esre',
    ad: { tr: 'Esre (Kesra)', fr: 'Kasra (İ / I)', en: 'Kasra (I)' },
    isaret: '\u0650',
    aciklama: {
      tr: 'Harfin altına konur. İnce harfleri "İ", kalın harfleri "I/İ" sesiyle okutur.',
      fr: 'Placée sous la lettre. Donne le son « I » net.',
      en: 'Placed beneath the letter. Produces the "I" sound.',
    },
    sesEtiketi: { tr: 'İ / I', fr: 'I', en: 'I' },
  },
  {
    id: 'otre',
    ad: { tr: 'Ötre (Damma)', fr: 'Damma (Ü / U)', en: 'Damma (U)' },
    isaret: '\u064F',
    aciklama: {
      tr: 'Harfin üstüne konur. İnce harfleri "Ü", kalın harfleri "U" sesiyle okutur.',
      fr: 'Placée au-dessus de la lettre. Donne le son « OU / U » arrondi.',
      en: 'Placed above the letter. Produces "U" sound with rounded lips.',
    },
    sesEtiketi: { tr: 'Ü / U', fr: 'U', en: 'U' },
  },
  {
    id: 'cezm',
    ad: { tr: 'Cezm (Sükûn)', fr: 'Soukoun (Arrêt)', en: 'Sukun (Stop)' },
    isaret: '\u0652',
    aciklama: {
      tr: 'Harfin üstüne konur. Harfi harekesiz, tutarak ve cezimli okutur.',
      fr: 'Petit cercle au-dessus. Indique l’absence de voyelle (arrêt sur la consonne).',
      en: 'Small circle above. Indicates the letter has no vowel sound.',
    },
    sesEtiketi: { tr: 'Durgun', fr: 'Arrêt', en: 'Stop' },
  },
];

