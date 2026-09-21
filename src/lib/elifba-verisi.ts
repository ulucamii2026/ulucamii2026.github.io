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
  { id: 'hepsi', ad: { tr: 'Bütün Harfler', fr: 'Toutes les lettres', en: 'All Letters', nl: 'Alle letters', de: 'Alle Buchstaben' } },
  { id: 'elif', ad: { tr: '1. Elif Grubu', fr: '1. Groupe Alif', en: '1. Alif Group', nl: '1. Alif-groep', de: '1. Alif-Gruppe' } },
  { id: 'hi', ad: { tr: '2. Hı Grubu', fr: '2. Groupe Kha', en: '2. Kha Group', nl: '2. Chaa-groep', de: '2. Cha-Gruppe' } },
  { id: 'sin', ad: { tr: '3. Şîn Grubu', fr: '3. Groupe Shin', en: '3. Shin Group', nl: '3. Sjien-groep', de: '3. Schin-Gruppe' } },
  { id: 'ayn', ad: { tr: '4. Ayn Grubu', fr: '4. Groupe Ayn', en: '4. Ayn Group', nl: '4. Ayn-groep', de: '4. Ain-Gruppe' } },
  { id: 'lam', ad: { tr: '5. Lâm Grubu', fr: '5. Groupe Lam', en: '5. Lam Group', nl: '5. Laam-groep', de: '5. Lam-Gruppe' } },
];

export const ELIFBA_HARFLERI: HarfOgesi[] = [
  {
    id: 'elif',
    ad: { tr: 'Elif', fr: 'Alif', en: 'Alif', nl: 'Alif', de: 'Alif' },
    harf: 'ا',
    basta: 'ا',
    ortada: 'ـا',
    sonda: 'ـا',
    grup: 'elif',
    ipucu: { tr: 'Boğazın sonundan çıkan düz harf. Kendinden sonrakine bitişmez.', fr: 'Lettre droite de la gorge. Ne se lie pas après.', en: 'Straight vertical letter. Does not connect to the left.', nl: 'Rechte letter die diep uit de keel komt. Verbindt niet met de volgende letter.', de: 'Gerader Buchstabe aus der Tiefe des Rachens. Verbindet sich nicht mit dem folgenden Buchstaben.' },
  },
  {
    id: 'be',
    ad: { tr: 'Bâ / Be', fr: 'Ba', en: 'Baa', nl: 'Baa', de: 'Ba' },
    harf: 'ب',
    basta: 'بـ',
    ortada: 'ـبـ',
    sonda: 'ـب',
    grup: 'elif',
    ipucu: { tr: 'Dudakların ıslak kısmının birbirine dokunmasıyla çıkar. Noktası altındadır.', fr: 'Se prononce en fermant les lèvres. Point en dessous.', en: 'Formed by closing lips. Single dot underneath.', nl: 'Ontstaat door de lippen op elkaar te brengen, zoals de b in “boek”. Eén punt eronder.', de: 'Entsteht durch das Schließen der Lippen, wie b in „Buch“. Ein Punkt darunter.' },
  },
  {
    id: 'te',
    ad: { tr: 'Tâ / Te', fr: 'Ta', en: 'Taa', nl: 'Taa', de: 'Ta' },
    harf: 'ت',
    basta: 'تـ',
    ortada: 'ـتـ',
    sonda: 'ـت',
    grup: 'elif',
    ipucu: { tr: 'Dil ucunun üst ön dişlerin etine değmesiyle çıkar. Üstte iki noktası vardır.', fr: 'Bout de la langue contre les incisives. Deux points au-dessus.', en: 'Tip of tongue against upper teeth roots. Two dots above.', nl: 'De tongpunt raakt de bovenste voortanden, zoals de t in “tafel”. Twee punten erboven.', de: 'Die Zungenspitze berührt die oberen Schneidezähne, wie t in „Tag“. Zwei Punkte darüber.' },
  },
  {
    id: 'se',
    ad: { tr: 'Sâ / Se (Peltek)', fr: 'Tha (interdentale)', en: 'Thaa (soft)', nl: 'Thaa (interdentaal)', de: 'Tha (interdental)' },
    harf: 'ث',
    basta: 'ثـ',
    ortada: 'ـثـ',
    sonda: 'ـث',
    grup: 'elif',
    peltekMi: true,
    ipucu: { tr: 'Peltek ve incedir. Dil ucu dişlerin arasından hafifçe çıkar. Üstte üç nokta.', fr: 'Interdentale douce. Trois points au-dessus.', en: 'Soft and lisping sound. Three dots above.', nl: 'Zacht en lispelend: de tongpunt komt licht tussen de tanden, zoals th in het Engelse “think”. Drie punten erboven.', de: 'Weich und gelispelt: Die Zungenspitze tritt leicht zwischen die Zähne, wie th im englischen „think“. Drei Punkte darüber.' },
  },
  {
    id: 'cim',
    ad: { tr: 'Cîm', fr: 'Jim', en: 'Jeem', nl: 'Djiem', de: 'Dschim' },
    harf: 'ج',
    basta: 'جـ',
    ortada: 'ـجـ',
    sonda: 'ـج',
    grup: 'elif',
    ipucu: { tr: 'Dil ortasının üst damağa basmasıyla çıkar. Noktası karnındadır.', fr: 'Milieu de la langue contre le palais. Point au milieu.', en: 'Middle of tongue against hard palate. Point in center.', nl: 'Het midden van de tong drukt tegen het gehemelte: een “dj”, zoals in “djembé”. Punt in de buik.', de: 'Die Zungenmitte drückt gegen den Gaumen: „dsch“ wie in „Dschungel“. Punkt im Bauch.' },
  },
  {
    id: 'ha',
    ad: { tr: 'Hâ (Boğaz)', fr: 'Ha (gorge)', en: 'Haa (throat)', nl: 'Haa (keel)', de: 'Ha (Kehllaut)' },
    harf: 'ح',
    basta: 'حـ',
    ortada: 'ـحـ',
    sonda: 'ـح',
    grup: 'elif',
    ipucu: { tr: 'Boğaz ortasının hafif sıkılmasıyla çıkan tatlı ve net bir "H" sesidir.', fr: 'Friction douce au milieu de la gorge. Sans point.', en: 'Clear whispering "H" from the middle of the throat. No dots.', nl: 'Een zachte, heldere h uit het midden van de keel; deze klank bestaat niet in het Nederlands. Zonder punt.', de: 'Ein weiches, klares h aus der Mitte des Rachens; diesen Laut gibt es im Deutschen nicht. Ohne Punkt.' },
  },
  {
    id: 'hi',
    ad: { tr: 'Hı (Hırıltılı / Kalın)', fr: 'Kha (rauque)', en: 'Khaa (raspy)', nl: 'Chaa (schrapend)', de: 'Cha (rau)' },
    harf: 'خ',
    basta: 'خـ',
    ortada: 'ـخـ',
    sonda: 'ـخ',
    grup: 'hi',
    kalinMi: true,
    ipucu: { tr: 'Boğazın ağza en yakın yerinden, hırıltılı ve kalın çıkar. Noktası tepesindedir.', fr: 'Rauque et sonore, point au-dessus.', en: 'Heavy rasping sound from upper throat. Dot above.', nl: 'Schrapend en donker, zoals de g in “goed” (Noord-Nederlandse harde g). Punt erboven.', de: 'Rau und dunkel, wie ch in „Bach“. Punkt darüber.' },
  },
  {
    id: 'dal',
    ad: { tr: 'Dâl', fr: 'Dal', en: 'Daal', nl: 'Daal', de: 'Dal' },
    harf: 'د',
    basta: 'د',
    ortada: 'ـد',
    sonda: 'ـد',
    grup: 'hi',
    ipucu: { tr: 'Dil ucunun üst ön dişlerin köküne değmesiyle çıkar. Kendinden sonrakine bitişmez.', fr: 'Bout de langue aux gencives supérieures. Ne se lie pas après.', en: 'Tip of tongue touching roots of upper teeth. Does not connect left.', nl: 'De tongpunt raakt de wortel van de boventanden, zoals de d in “dag”. Verbindt niet met de volgende letter.', de: 'Die Zungenspitze berührt den Ansatz der oberen Schneidezähne, wie d in „danke“. Verbindet sich nicht mit dem folgenden Buchstaben.' },
  },
  {
    id: 'zel',
    ad: { tr: 'Zel (Peltek)', fr: 'Dhal (interdentale)', en: 'Dhaal (soft)', nl: 'Dhaal (interdentaal)', de: 'Dhal (interdental)' },
    harf: 'ذ',
    basta: 'ذ',
    ortada: 'ـذ',
    sonda: 'ـذ',
    grup: 'hi',
    peltekMi: true,
    ipucu: { tr: 'Peltek ve ince "Z" sesi. Dil ucu ön dişlerin arasına konur. Noktası vardır.', fr: 'Z doux interdental avec un point au-dessus.', en: 'Soft lisping Z with a dot on top. Does not connect left.', nl: 'Een zachte, stemhebbende z tussen de tanden, zoals th in het Engelse “this”. Eén punt erboven; verbindt niet met de volgende letter.', de: 'Ein weiches, stimmhaftes z zwischen den Zähnen, wie th im englischen „this“. Ein Punkt darüber; verbindet sich nicht mit dem folgenden Buchstaben.' },
  },
  {
    id: 'ra',
    ad: { tr: 'Râ', fr: 'Ra', en: 'Raa', nl: 'Raa', de: 'Ra' },
    harf: 'ر',
    basta: 'ر',
    ortada: 'ـر',
    sonda: 'ـر',
    grup: 'hi',
    kalinMi: true,
    ipucu: { tr: 'Dil ucunun üst ön damağa hafifçe titremesiyle çıkar. Kendinden sonrakine bitişmez.', fr: 'R roulé de la pointe de la langue.', en: 'Rolling R produced with tip of tongue.', nl: 'Een met de tongpunt gerolde r, niet de keel-r. Verbindt niet met de volgende letter.', de: 'Ein mit der Zungenspitze gerolltes r, nicht das Rachen-r des Hochdeutschen. Verbindet sich nicht mit dem folgenden Buchstaben.' },
  },
  {
    id: 'ze',
    ad: { tr: 'Zâ / Ze (Keskin)', fr: 'Zay', en: 'Zay', nl: 'Zaa (scherp)', de: 'Zay' },
    harf: 'ز',
    basta: 'ز',
    ortada: 'ـز',
    sonda: 'ـز',
    grup: 'hi',
    ipucu: { tr: 'Keskin ve net "Z" sesidir. Noktası tepesindedir. Kendinden sonrakine bitişmez.', fr: 'Z net et sonore avec point au-dessus.', en: 'Sharp buzzing Z sound with single dot.', nl: 'Een scherpe, stemhebbende z, zoals in “zon”. Eén punt erboven; verbindt niet met de volgende letter.', de: 'Ein scharfes, stimmhaftes s, wie s in „Sonne“. Ein Punkt darüber; verbindet sich nicht mit dem folgenden Buchstaben.' },
  },
  {
    id: 'sin',
    ad: { tr: 'Sîn (İnce)', fr: 'Sin', en: 'Seen', nl: 'Sien', de: 'Sin' },
    harf: 'س',
    basta: 'سـ',
    ortada: 'ـسـ',
    sonda: 'ـس',
    grup: 'hi',
    ipucu: { tr: 'Üç dişli, ince ve ıslıklı "S" sesidir. Noktasızdır.', fr: 'S doux et sifflant à trois dents, sans point.', en: 'Soft hissing S sound with three teeth.', nl: 'Een heldere, sissende s, zoals in “sok”. Drie tandjes, zonder punt.', de: 'Ein helles, zischendes s, wie ss in „Wasser“. Drei Zacken, ohne Punkt.' },
  },
  {
    id: 'sin2',
    ad: { tr: 'Şîn', fr: 'Shin', en: 'Sheen', nl: 'Sjien', de: 'Schin' },
    harf: 'ش',
    basta: 'شـ',
    ortada: 'ـشـ',
    sonda: 'ـش',
    grup: 'sin',
    ipucu: { tr: 'Dil ortası damağa yükseltilerek çıkarılan "Ş" sesidir. Üstte üç noktası vardır.', fr: 'Ch sonore avec trois points au-dessus.', en: 'Sh sound as in "shine" with three dots on top.', nl: 'De “sj”-klank, zoals sj in “sjaal”. Drie punten erboven.', de: 'Der „sch“-Laut, wie sch in „Schule“. Drei Punkte darüber.' },
  },
  {
    id: 'sad',
    ad: { tr: 'Sâd (Kalın)', fr: 'Sad (emphatique)', en: 'Saad (heavy)', nl: 'Saad (emfatisch)', de: 'Sad (emphatisch)' },
    harf: 'ص',
    basta: 'صـ',
    ortada: 'ـصـ',
    sonda: 'ـص',
    grup: 'sin',
    kalinMi: true,
    ipucu: { tr: 'Kalın, tok ve dolgun "S" sesidir. Ağız içi hava ile dolar.', fr: 'S emphatique et profond.', en: 'Deep and heavy emphatic S sound.', nl: 'Een donkere, volle s: dezelfde s als in “sok”, maar met een holle mond uitgesproken.', de: 'Ein dunkles, volles s: derselbe s-Laut wie in „Wasser“, aber mit hohlem Mundraum gesprochen.' },
  },
  {
    id: 'dad',
    ad: { tr: 'Dâd (Kalın)', fr: 'Dad (emphatique)', en: 'Daad (heavy)', nl: 'Daad (emfatisch)', de: 'Dad (emphatisch)' },
    harf: 'ض',
    basta: 'ضـ',
    ortada: 'ـضـ',
    sonda: 'ـض',
    grup: 'sin',
    kalinMi: true,
    ipucu: { tr: 'Dil yanının üst azı dişlerine yaslanmasıyla çıkan kalın "D" sesidir. Noktası vardır.', fr: 'D emphatique caractéristique de la langue arabe.', en: 'Unique emphatic heavy D sound with single dot.', nl: 'Een donkere d: de zijkant van de tong drukt tegen de bovenste kiezen. Deze klank bestaat alleen in het Arabisch. Eén punt.', de: 'Ein dunkles d: Der Zungenrand drückt gegen die oberen Backenzähne. Diesen Laut gibt es nur im Arabischen. Ein Punkt.' },
  },
  {
    id: 'ti',
    ad: { tr: 'Tı (Kalın)', fr: 'Ta (emphatique)', en: 'Taa (heavy)', nl: 'Taa (emfatisch)', de: 'Ta (emphatisch)' },
    harf: 'ط',
    basta: 'طـ',
    ortada: 'ـطـ',
    sonda: 'ـط',
    grup: 'sin',
    kalinMi: true,
    ipucu: { tr: 'Kalın ve tok "T" sesidir. Dil damağa yapışır.', fr: 'T emphatique très sonore.', en: 'Strong emphatic heavy T sound.', nl: 'Een donkere, krachtige t: de tong drukt breed tegen het gehemelte.', de: 'Ein dunkles, kräftiges t: Die Zunge legt sich breit an den Gaumen.' },
  },
  {
    id: 'zi',
    ad: { tr: 'Zı (Kalın & Peltek)', fr: 'Zha (emphatique & interdentale)', en: 'Dhaa (heavy & soft)', nl: 'Zaa (emfatisch & interdentaal)', de: 'Za (emphatisch & interdental)' },
    harf: 'ظ',
    basta: 'ظـ',
    ortada: 'ـظـ',
    sonda: 'ـظ',
    grup: 'sin',
    kalinMi: true,
    peltekMi: true,
    ipucu: { tr: 'Hem kalın hem peltek okunan "Z" sesidir. Noktası vardır.', fr: 'Z emphatique et interdental avec un point.', en: 'Heavy and soft interdental sound with single dot.', nl: 'Tegelijk donker en tussen de tanden: de dhaal-klank, maar zwaar uitgesproken. Eén punt.', de: 'Zugleich dunkel und zwischen den Zähnen: der Dhal-Laut, aber schwer gesprochen. Ein Punkt.' },
  },
  {
    id: 'ayn',
    ad: { tr: 'Ayn', fr: 'Ayn (gorge)', en: 'Ayn (throat)', nl: 'Ayn (keel)', de: 'Ain (Kehllaut)' },
    harf: 'ع',
    basta: 'عـ',
    ortada: 'ـعـ',
    sonda: 'ـع',
    grup: 'ayn',
    ipucu: { tr: 'Boğazın tam ortasının sıkılmasıyla çıkarılan özel ve derin sestir.', fr: 'Son guttural profond du milieu de la gorge.', en: 'Deep guttural sound from the middle of the throat.', nl: 'Een diepe keelklank uit het midden van de keel; er is geen Nederlandse klank die hierop lijkt.', de: 'Ein tiefer Kehllaut aus der Mitte des Rachens; im Deutschen gibt es keinen vergleichbaren Laut.' },
  },
  {
    id: 'gayn',
    ad: { tr: 'Ğayn (Kalın)', fr: 'Ghayn', en: 'Ghayn (heavy)', nl: 'Ghayn (zwaar)', de: 'Ghain (dunkel)' },
    harf: 'غ',
    basta: 'غـ',
    ortada: 'ـغـ',
    sonda: 'ـغ',
    grup: 'ayn',
    kalinMi: true,
    ipucu: { tr: 'Fransızca "R" veya yumuşak "Ğ" sesine benzer, kalın ve boğazdan akar. Noktası vardır.', fr: 'Proche du R grasseyé français, point au-dessus.', en: 'Resembles French R sound, produced from upper throat.', nl: 'Lijkt op de gorgelende keel-r van het Frans: donker en achter in de keel. Eén punt erboven.', de: 'Ähnelt dem Rachen-r in „Rose“, nur dunkler und gurgelnder. Ein Punkt darüber.' },
  },
  {
    id: 'fe',
    ad: { tr: 'Fâ / Fe', fr: 'Fa', en: 'Faa', nl: 'Faa', de: 'Fa' },
    harf: 'ف',
    basta: 'فـ',
    ortada: 'ـفـ',
    sonda: 'ـف',
    grup: 'ayn',
    ipucu: { tr: 'Üst ön dişlerin alt dudağın içine değmesiyle çıkar. Bir noktası vardır.', fr: 'Dents supérieures sur la lèvre inférieure. Un point.', en: 'Upper teeth on lower lip. Single dot above.', nl: 'De boventanden raken de onderlip, zoals de f in “fles”. Eén punt erboven.', de: 'Die oberen Schneidezähne berühren die Unterlippe, wie f in „Fisch“. Ein Punkt darüber.' },
  },
  {
    id: 'kaf',
    ad: { tr: 'Kâf (Kalın)', fr: 'Qaf (profond)', en: 'Qaaf (deep)', nl: 'Qaaf (diep)', de: 'Qaf (tief)' },
    harf: 'ق',
    basta: 'قـ',
    ortada: 'ـقـ',
    sonda: 'ـق',
    grup: 'ayn',
    kalinMi: true,
    ipucu: { tr: 'Dil kökünün küçük dile doğru basmasıyla çıkan kalın ve sert "K" sesidir. İki noktası vardır.', fr: 'K guttural très profond avec deux points.', en: 'Deep and heavy K from the back of the throat. Two dots.', nl: 'Een diepe, harde k, ver achter in de keel gevormd, veel dieper dan de k in “kat”. Twee punten erboven.', de: 'Ein tiefes, hartes k, weit hinten am Zäpfchen gebildet, viel tiefer als das k in „Kind“. Zwei Punkte darüber.' },
  },
  {
    id: 'kef',
    ad: { tr: 'Kef (İnce)', fr: 'Kaf (doux)', en: 'Kaaf (soft)', nl: 'Kaaf (zacht)', de: 'Kaf (weich)' },
    harf: 'ك',
    basta: 'كـ',
    ortada: 'ـكـ',
    sonda: 'ـك',
    grup: 'ayn',
    ipucu: { tr: 'Dil kökünün biraz önünden çıkan ince "K" sesidir.', fr: 'K classique doux et léger.', en: 'Light standard K sound as in "kite".', nl: 'De gewone, lichte k, zoals in “kat”.', de: 'Das gewöhnliche, helle k, wie in „Kind“.' },
  },
  {
    id: 'lam',
    ad: { tr: 'Lâm', fr: 'Lam', en: 'Laam', nl: 'Laam', de: 'Lam' },
    harf: 'ل',
    basta: 'لـ',
    ortada: 'ـلـ',
    sonda: 'ـل',
    grup: 'lam',
    ipucu: { tr: 'Dil ucunun üst ön damağa değmesiyle çıkarılan akıcı "L" sesidir.', fr: 'L fluide de la pointe de la langue.', en: 'Smooth flowing L sound.', nl: 'Een vloeiende l met de tongpunt tegen het gehemelte, zoals in “licht”.', de: 'Ein fließendes l mit der Zungenspitze am Gaumen, wie in „Licht“.' },
  },
  {
    id: 'mim',
    ad: { tr: 'Mîm', fr: 'Mim', en: 'Meem', nl: 'Miem', de: 'Mim' },
    harf: 'م',
    basta: 'مـ',
    ortada: 'ـمـ',
    sonda: 'ـم',
    grup: 'lam',
    ipucu: { tr: 'Dudakların birbirine kapanmasıyla çıkarılan "M" sesidir.', fr: 'M bilabial en fermant les lèvres.', en: 'M sound made by closing both lips.', nl: 'De m-klank, gevormd door de lippen te sluiten, zoals in “maan”.', de: 'Der m-Laut, der durch das Schließen der Lippen entsteht, wie in „Mond“.' },
  },
  {
    id: 'nun',
    ad: { tr: 'Nûn', fr: 'Noun', en: 'Noon', nl: 'Noen', de: 'Nun' },
    harf: 'ن',
    basta: 'نـ',
    ortada: 'ـنـ',
    sonda: 'ـن',
    grup: 'lam',
    ipucu: { tr: 'Dil ucunun üst ön diş etine değmesiyle ve genizden çıkarılan "N" sesidir.', fr: 'N sonore avec légère résonance nasale.', en: 'N sound with slight nasal resonance. Single dot in cup.', nl: 'De n-klank met de tongpunt tegen het tandvlees en een lichte neusklank. Eén punt in het kommetje.', de: 'Der n-Laut mit der Zungenspitze am Zahnfleisch und leichtem Nasenklang. Ein Punkt in der Schale.' },
  },
  {
    id: 'he',
    ad: { tr: 'He (Göğüs)', fr: 'Ha (léger)', en: 'Haa (light)', nl: 'Haa (licht)', de: 'Ha (leicht)' },
    harf: 'ه',
    basta: 'هـ',
    ortada: 'ـهـ',
    sonda: 'ـه',
    grup: 'lam',
    ipucu: { tr: 'Boğazın en derininden göğüsten gelen ince ve hafif "H" sesidir.', fr: 'H très léger venant du fond de la gorge.', en: 'Very light and airy H coming from the chest.', nl: 'Een lichte, ademende h diep uit de keel, zoals de h in “huis”.', de: 'Ein leichtes, behauchtes h aus der Tiefe des Rachens, wie h in „Haus“.' },
  },
  {
    id: 'vav',
    ad: { tr: 'Vâv', fr: 'Waw', en: 'Waaw', nl: 'Waaw', de: 'Waw' },
    harf: 'و',
    basta: 'و',
    ortada: 'ـو',
    sonda: 'ـو',
    grup: 'lam',
    ipucu: { tr: 'Dudakların ileriye doğru yuvarlanmasıyla çıkarılan "V/W" sesidir. Kendinden sonrakine bitişmez.', fr: 'Lèvres arrondies comme un W anglais. Ne se lie pas après.', en: 'Formed by rounding lips as in English "W". Does not connect left.', nl: 'De lippen worden vooruit gerond: de w van het Engelse “water”, niet de Nederlandse w. Verbindt niet met de volgende letter.', de: 'Die Lippen werden vorgerundet: das w des englischen „water“, nicht das deutsche w. Verbindet sich nicht mit dem folgenden Buchstaben.' },
  },
  {
    id: 'ye',
    ad: { tr: 'Ye', fr: 'Ya', en: 'Yaa', nl: 'Yaa', de: 'Ya' },
    harf: 'ي',
    basta: 'يـ',
    ortada: 'ـيـ',
    sonda: 'ـي',
    grup: 'lam',
    ipucu: { tr: 'Dil ortasının damağa yaklaşmasıyla çıkan "Y" sesidir. Altında iki noktası vardır.', fr: 'Y sonore avec deux points en dessous.', en: 'Y sound with two dots underneath.', nl: 'Het midden van de tong nadert het gehemelte: de j van “ja”. Twee punten eronder.', de: 'Die Zungenmitte nähert sich dem Gaumen: das j von „ja“. Zwei Punkte darunter.' },
  },
];

export type HarekeTuru = 'ustun' | 'esre' | 'otre' | 'cezm' | 'sedde';

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
    ad: { tr: 'Üstün (Fetha)', fr: 'Fatha (A / E)', en: 'Fatha (A / E)', nl: 'Fatha (A / E)', de: 'Fatha (A / E)' },
    isaret: '\u064E',
    aciklama: {
      tr: 'Harfin üstüne konur. İnce harfleri "E", kalın harfleri "A" sesiyle okutur.',
      fr: 'Placée au-dessus de la lettre. Donne le son « E » (lettres légères) ou « A » (lettres lourdes).',
      en: 'Placed above the letter. Produces "E" for light letters and "A" for heavy letters.',
      nl: 'Staat boven de letter. Lichte letters krijgen de klank “e”, donkere letters de klank “a”.',
      de: 'Steht über dem Buchstaben. Helle Buchstaben bekommen den Laut „e“, dunkle den Laut „a“.',
    },
    sesEtiketi: { tr: 'E / A', fr: 'E / A', en: 'E / A', nl: 'E / A', de: 'E / A' },
  },
  {
    id: 'esre',
    ad: { tr: 'Esre (Kesra)', fr: 'Kasra (İ / I)', en: 'Kasra (I)', nl: 'Kasra (I)', de: 'Kasra (I)' },
    isaret: '\u0650',
    aciklama: {
      tr: 'Harfin altına konur. İnce harfleri "İ", kalın harfleri "I/İ" sesiyle okutur.',
      fr: 'Placée sous la lettre. Donne le son « I » net.',
      en: 'Placed beneath the letter. Produces the "I" sound.',
      nl: 'Staat onder de letter. Geeft de heldere klank “i”.',
      de: 'Steht unter dem Buchstaben. Ergibt den hellen Laut „i“.',
    },
    sesEtiketi: { tr: 'İ / I', fr: 'I', en: 'I', nl: 'I', de: 'I' },
  },
  {
    id: 'otre',
    ad: { tr: 'Ötre (Damma)', fr: 'Damma (Ü / U)', en: 'Damma (U)', nl: 'Damma (OE)', de: 'Damma (U)' },
    isaret: '\u064F',
    aciklama: {
      tr: 'Harfin üstüne konur. İnce harfleri "Ü", kalın harfleri "U" sesiyle okutur.',
      fr: 'Placée au-dessus de la lettre. Donne le son « OU / U » arrondi.',
      en: 'Placed above the letter. Produces "U" sound with rounded lips.',
      nl: 'Staat boven de letter. Geeft de ronde klank “oe”, zoals in “boek”.',
      de: 'Steht über dem Buchstaben. Ergibt den runden Laut „u“, wie in „Buch“.',
    },
    sesEtiketi: { tr: 'Ü / U', fr: 'U', en: 'U', nl: 'OE', de: 'U' },
  },
  {
    id: 'cezm',
    ad: { tr: 'Cezm (Sükûn)', fr: 'Soukoun (Arrêt)', en: 'Sukun (Stop)', nl: 'Soekoen (stop)', de: 'Sukun (Stopp)' },
    isaret: '\u0652',
    aciklama: {
      tr: 'Harfin üstüne konur. Harfi harekesiz, tutarak ve cezimli okutur.',
      fr: 'Petit cercle au-dessus. Indique l’absence de voyelle (arrêt sur la consonne).',
      en: 'Small circle above. Indicates the letter has no vowel sound.',
      nl: 'Klein rondje boven de letter. Het geeft aan dat de letter geen klinker krijgt: de medeklinker wordt afgesloten.',
      de: 'Kleiner Kreis über dem Buchstaben. Er zeigt an, dass der Buchstabe keinen Vokal hat: Der Konsonant wird angehalten.',
    },
    sesEtiketi: { tr: 'Durgun', fr: 'Arrêt', en: 'Stop', nl: 'Stop', de: 'Stopp' },
  },
  {
    id: 'sedde',
    ad: { tr: 'Şedde (Teşdîd)', fr: 'Chaddah (Doublement)', en: 'Shaddah (Doubling)', nl: 'Sjadda (verdubbeling)', de: 'Schadda (Verdopplung)' },
    isaret: '\u0651',
    aciklama: {
      tr: 'Harfin üstüne konur. Harfi önce cezimli, sonra kendi harekesiyle iki kez okutur.',
      fr: 'Placée au-dessus de la lettre. Indique le redoublement de la consonne (arrêt puis voyelle).',
      en: 'Placed above the letter. Doubles the consonant (first with stop, then with vowel).',
      nl: 'Staat boven de letter. De medeklinker wordt verdubbeld: eerst afgesloten, daarna met de eigen klinker gelezen.',
      de: 'Steht über dem Buchstaben. Der Konsonant wird verdoppelt: zuerst angehalten, dann mit dem eigenen Vokal gelesen.',
    },
    sesEtiketi: { tr: 'Çift', fr: 'Double', en: 'Double', nl: 'Dubbel', de: 'Doppelt' },
  },
];

/**
 * Günün tarihine göre deterministik olarak günün Elif-Bâ harfini seçer.
 */
export function gununHarfiGetir(tarih: Date | string = new Date()): HarfOgesi {
  const d = typeof tarih === 'string' ? new Date(tarih.slice(0, 10) + 'T12:00:00Z') : tarih;
  const gunSayisi = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
  const index = Math.abs(gunSayisi) % ELIFBA_HARFLERI.length;
  return ELIFBA_HARFLERI[index];
}


