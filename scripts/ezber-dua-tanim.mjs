/**
 * Ezber duaları: kaynak eşlemesi ve bölümleme tablosu (Faz 2b, 24 Ekim 2026). scripts/ezber-dua-cek.mjs bu tabloyu
 * okur; Arapça metin portaldan GELİR, bu dosyada yazılmaz (yalnız düzeltilecek parçalar «bul» olarak, portalın kendi
 * yazımıyla geçer ve betik onları kaynakta arar). Türkçe anlam ve okunuş Diyanet yayınlarından aynen alınmıştır;
 * bölüm sınırları yalnız cümle/öbek başlarından kesilir, metin değiştirilmez.
 *
 * Alan sözlüğü
 *   portal    namaz.diyanet.gov.tr/namaz/html/sureler-dualar.html içindeki dua kaydının `data-index` değeri
 *   turet     Arapça portalda yok: başka bir duanın bölümlerinden türetilir (ezan = ikamet − «kad kâmeti’s-salâh» + sabah bölümü)
 *   aralik    portal kaydının bir parçası: [baş, son] harf iskeleti (harekesiz) çapaları; null = baştan / sona kadar
 *   cikar     kayıttan çıkarılacak parça (portalın yazımıyla; yalnız namazda okunmayan eklemeler)
 *   duzelt    portalın harekeleme/yazım kusurları: { bul, yerine, neden }; «bul» kaynakta bulunmazsa betik durur
 *   kesim     bölümlerin başladığı harf iskeleti çapaları (ilk bölüm baştan başlar); sırayla aranır
 *   anlam     Türkçe anlam: bölüm sayısı kadar dizi ya da { metin, kesim } (tam paragraf + bölüm başı çapaları)
 *   okunus    Türkçe usulü okunuş: aynı biçim; `**` işaretleri (Diyanet’in vurgu harfleri) atılır
 *   zor       dikkat edilecek kelimeler (hoca alanı)
 */

import { createHash } from 'node:crypto';

export const PORTAL = 'https://namaz.diyanet.gov.tr/namaz/html/sureler-dualar.html';

const NI = 'Diyanet İşleri Başkanlığı, Namaz İlmihali, «Namaz İçinde Okunacak Dualar» (Namaz İlmihali, II. bölüm)';
const KAYNAK_AR = 'Diyanet İşleri Başkanlığı, Namaz Vakitleri sitesi (namaz.diyanet.gov.tr)';
const EZAN_ANLAM = 'Diyanet İşleri Başkanlığı, Dînî Kavramlar Sözlüğü, «Ezan» maddesi';

export const DUALAR = {
  'd-subhaneke': {
    portal: 14,
    kaynakAr: KAYNAK_AR,
    cikar: ['(وَجَلَّ ثَنَآئُكَ)'],
    kesim: ['وتبارك', 'ولا اله'],
    anlamKaynak: NI,
    anlam: {
      metin: 'Allah’ım! Sen eksik sıfatlardan pak ve uzaksın. Seni daima böyle tenzih eder ve överim. Senin adın mübarektir. Varlığın her şeyden üstündür, şanın yücedir. Senden başka ilâh yoktur.',
      kesim: ['Senin adın', 'Senden başka'],
    },
    okunus: {
      metin: 'Sübhâneke’l-lâhümme ve bi-hamdik ve tebâra kesmük. Ve te**’â**lâ ceddük Velâ ilâhe ğayruk.',
      kesim: ['ve tebâra', 'Velâ'],
    },
    zor: [{ bolum: 2, kelime: 'وَجَلَّ ثَنَآئُكَ', not: '«Ve celle senâüke» cümlesi yalnız cenaze namazında okunur; diğer namazlarda okunmaz, Diyanet kaydında da yoktur.' }],
  },

  'd-ruku-tesbihi': {
    portal: 15,
    kaynakAr: KAYNAK_AR,
    anlamKaynak: NI,
    anlam: ['Ulu Rabbim, her türlü kusurdan münezzehtir.'],
    okunus: ['Sübhâne rabbiye’l-**‘a**zîm'],
  },

  'd-secde-tesbihi': {
    portal: 16,
    kaynakAr: KAYNAK_AR,
    anlamKaynak: NI,
    anlam: ['Ulu Rabbim, (her çeşit kusurdan) münezzehtir.'],
    okunus: ['Sübhâne Rabbiye’l-**a’**lâ'],
  },

  'd-ettehiyyatu': {
    portal: 18,
    kaynakAr: KAYNAK_AR,
    kesim: ['السلام عليك', 'السلام علينا', 'اشهد ان لا', 'واشهد'],
    anlamKaynak: NI,
    anlam: {
      metin: 'Selam, rahmet ve bütün güzellikler, her türlü dil, beden ve mal ile yapılan ibadet Allah’a mahsustur. Ey Peygamber! Allah’ın rahmeti ve bereketleri senin üzerine olsun. Selâm bizlere ve Allah’ın sâlih kullarına olsun. Ben şahadet ederim (kesinlikle bilirim) ki, Allah’tan başka hiçbir ilâh yoktur. Ve şahadet ederim ki Hazret-i Muhammed Allah’ın kulu ve Resûlüdür.',
      kesim: ['Ey Peygamber!', 'Selâm bizlere', 'Ben şahadet', 'Ve şahadet'],
    },
    okunus: {
      metin: 'Ettehıyyâtü lillâhi ve’s-salevâtü ve’t-tayyibâtü esselâmü **‘a**leyke eyyühe’n-nebiyyü ve rahmetüllâhi ve berakâtühû esselâmü **‘a**leynâ ve **‘a**lâ **‘ı**bâdillâhi’s-salihîn. Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden **‘a**bdühû ve rasûlüh.',
      kesim: ['esselâmü **‘a**leyke', 'esselâmü **‘a**leynâ', 'Eşhedü en', 've eşhedü'],
    },
  },

  'd-salli': {
    portal: 19,
    kaynakAr: KAYNAK_AR,
    kesim: ['كما صليت', 'انك حميد'],
    anlamKaynak: NI,
    anlam: {
      metin: 'Allah’ım! Muhammed’e ve Muhammed’in ümmetine rahmet eyle; şerefini yücelt. İbrahim’e ve İbrahim’in ümmetine rahmet ettiğin gibi. Şüphesiz övülmeye lâyık yalnız sensin, şan ve şeref sahibi de sensin.',
      kesim: ['İbrahim’e', 'Şüphesiz'],
    },
    okunus: {
      metin: 'Allâhümme salli **‘a**lâ Muhammedin ve **‘a**lâ âli Muhammed. Kemâ salleyte **‘a**lâ İbrahîme ve **‘a**lâ âli İbrahîm. İnneke hamîdün mecîd.',
      kesim: ['Kemâ', 'İnneke'],
    },
  },

  'd-barik': {
    portal: 20,
    kaynakAr: KAYNAK_AR,
    kesim: ['كما باركت', 'انك حميد'],
    anlamKaynak: NI,
    anlam: {
      metin: 'Allah’ım! Muhammed’e ve Muhammed’in ümmetine hayır ve bereket ver. İbrahim’e ve İbrahim’in ümmetine verdiğin gibi. Şüphesiz övülmeye lâyık yalnız sensin, şan ve şeref sahibi de sensin.',
      kesim: ['İbrahim’e', 'Şüphesiz'],
    },
    okunus: {
      metin: 'Allâhümme bârik **‘a**lâ Muhammedin ve **‘a**lâ âli Muhammed. Kemâ bârakte **‘a**lâ İbrahîme ve **‘a**lâ âli İbrahim. İnneke hamidün mecîd.',
      kesim: ['Kemâ', 'İnneke'],
    },
  },

  'd-kunut-1': {
    portal: 17,
    aralik: [null, 'اللهم اياك'],
    kaynakAr: KAYNAK_AR,
    duzelt: [
      { bul: 'وَنُثْنِى عَلَيْك ', yerine: 'وَنُثْنِى عَلَيْكَ ', neden: 'Portalda kâf harfinin fethası düşmüş; aynı kelime bir önceki cümlede ve ikinci kaynakta (Tecrid-i Sarih) fethalıdır.' },
      { bul: 'اْلخَيْرَ', yerine: 'الْخَيْرَ', neden: 'Portalda elif üzerine sükûn, lâm üzerine harekesizlik yazılmış (basım hatası); ال takısı lâm sükûnuyla yazılır.' },
    ],
    kesim: ['ونؤمن', 'ونتوكل', 'ونخلع'],
    anlamKaynak: NI,
    anlam: {
      metin: 'Allah’ım! Senden yardım isteriz, günahlarımızı bağışlamanı isteriz, razı olduğun şeylere hidayet etmeni isteriz. Sana inanırız, sana tövbe ederiz. Sana güveniriz. Bize verdiğin bütün nimetleri bilerek seni hayır ile överiz. Sana şükrederiz. Hiçbir nimetini inkâr etmeyiz ve onları başkasından bilmeyiz. Nimetlerini inkâr eden ve sana karşı geleni bırakırız.',
      kesim: ['Sana inanırız', 'Sana güveniriz', 'Nimetlerini inkâr eden'],
    },
    okunus: {
      metin: 'Allâhümme innâ neste’**î**nüke ve nesteğfiruke ve nestehdîke ve nü’minü bike ve netûbü ileyke ve netevekkelü **a**leyke ve nü**s**nî **‘a**leyke’l-**h**ayra küllehû neşküruke velâ nekfürüke ve na**h**le**’u** ve netrukü men yefcürük.',
      kesim: ['ve nü’minü', 've netevekkelü', 've na**h**le'],
    },
  },

  'd-kunut-2': {
    portal: 17,
    aralik: ['اللهم اياك', null],
    kaynakAr: KAYNAK_AR,
    duzelt: [
      { bul: 'نَسعْىَ', yerine: 'نَسْعَى', neden: 'Portalda sin harfinin sükûnu eksik, ayn harfine sükûn konmuş; kelime نَسْعَى (nes‘â) olarak yazılır. İkinci kaynak (Tecrid-i Sarih) نَسْعَى yazar.' },
      { bul: 'بِاْلكُفَّارِ', yerine: 'بِالْكُفَّارِ', neden: 'Portalda elif üzerine sükûn, lâm üzerine harekesizlik yazılmış (basım hatası); ال takısı lâm sükûnuyla yazılır.' },
      { bul: 'عَذَابَك ', yerine: 'عَذَابَكَ ', neden: 'Portalda kâf harfinin fethası düşmüş; aynı kelime ikinci kaynakta (Tecrid-i Sarih) fethalıdır.' },
    ],
    kesim: ['واليك', 'نرجو', 'ان عذابك'],
    anlamKaynak: NI,
    anlam: {
      metin: 'Allah’ım! Biz yalnız sana kulluk ederiz. Namazı yalnız senin için kılarız, ancak sana secde ederiz. Yalnız sana koşar ve sana yaklaştıracak şeyleri kazanmaya çalışırız. İbadetlerini sevinçle yaparız. Rahmetinin devamını ve çoğalmasını dileriz. Azabından korkarız, şüphesiz senin azabın kâfirlere ve inançsızlara ulaşır.',
      kesim: ['Yalnız sana koşar', 'Rahmetinin', 'şüphesiz senin'],
    },
    okunus: {
      metin: 'Allâhümme iyyâke na**’**büdü ve leke nüsalli ve ne**s**cüdü ve ileyke nes**’â** ve nahfidü nercû rahmeteke ve na**h**şâ ‘a**z**âbek. İnne ‘a**z**âbeke bi’l-küffâri mülhık.',
      kesim: ['ve ileyke', 'nercû', 'İnne'],
    },
  },

  'd-ezan-duasi': {
    portal: 22,
    kaynakAr: `${KAYNAK_AR}; son bölüm: Diyanet İşleri Başkanlığı, İslam İlmihali, VIII. Namaz`,
    duzelt: [
      { bul: 'مَحْمُودًانِ الَّذ۪ى', yerine: 'مَحْمُودًا الَّذِى', neden: 'Portalda «mahmûden» kelimesine fazladan نِ eklenmiş (basım hatası; ikinci kaynaklar Tecrid-i Sarih ve İslam İlmihali مَحْمُودًا الَّذِى yazar); ayrıca ذ۪ى içindeki U+06EA işareti kesreye (U+0650) çevrilmiştir.' },
    ],
    ek: [{ ar: 'اِنَّكَ لاَ تُخْلِفُ الْمِيعَادَ' }],
    kesim: ['ات محمدا', 'وابعثه'],
    anlamKaynak: 'Diyanet İşleri Başkanlığı, Diyanet İlmihali, I. cilt, «Ezan ve Kamet» (s. 269–270)',
    anlam: [
      'Ey şu eksiksiz mesajın ve kılınacak namazın Rabbi olan Allahım!',
      'Muhammed’e vesileyi ve fazileti (ve yüksek dereceyi) ver!',
      'Vaad ettiğin övülmüş makama yükselt',
      '(Sen vaadine muhalefet etmezsin)',
    ],
    okunus: [
      'Allâhümme rabbe hâzihi’d-da‘veti’t-tâmme ve’s-salâti’l-kaime',
      'âti Muhammeden el-vesîlete ve’l-fazîleh',
      'Veb‘ashü makamen mahmûdeni’llezî va‘adteh',
      'İnneke lâ tuhlifü’l-mîâd',
    ],
    zor: [{ bolum: 2, kelime: 've’d-derecete’r-refîah', not: 'Diyanet İlmihali’ne göre bu kısa ek isteğe bağlıdır («ve yüksek dereceyi»). Diyanet kaydında okunur, Diyanet’in yazılı Arapça metninde yer almaz.' }],
  },

  'd-kamet': {
    portal: 12,
    kaynakAr: KAYNAK_AR,
    kesim: ['اشهد ان لا', 'اشهد ان محمدا', 'حي علي الصلاة', 'حي علي الفلاح', 'قد قامت', 'الله اكبر الله اكبر لا اله', 'لا اله الا الله'],
    anlamKaynak: `${EZAN_ANLAM}; «Kad kâmeti’s-salâh» anlamı: Diyanet İşleri Başkanlığı, Diyanet İlmihali, I. cilt, «Ezan ve Kamet» (s. 267–268)`,
    anlam: [
      'Allah uludur. (4 kere)',
      'Şüphesiz bilirim ve bildiririm ki Allâh’tan başka ilah yoktur. (2 kere)',
      'Şüphesiz bilirim ve bildiririm ki Muhammed Allâh’ın elçisidir. (2 kere)',
      'Haydin namaza. (2 kere)',
      'Haydin kurtuluşa. (2 kere)',
      'Namaz başladı. (2 kere)',
      'Allah uludur. (2 kere)',
      'Allâh’tan başka tanrı yoktur. (1 kere)',
    ],
    okunus: [
      'Allâhu Ekber, Allâhu Ekber, Allâhu Ekber, Allâhu Ekber',
      'Eşhedü en lâ ilâhe illellah, Eşhedü en lâ ilâhe illellah',
      'Eşhedü enne Muhammeden Resulüllah, Eşhedü enne Muhammeden Resulüllah',
      'Hayye ale’s-salâh, Hayye ale’s-salâh',
      'Hayye ale’l-felâh, Hayye ale’l-felâh',
      'Kad kâmeti’s-salâh, Kad kâmeti’s-salâh',
      'Allâhu Ekber, Allâhu Ekber',
      'Lâ ilâhe illellah',
    ],
  },

  'd-ezan': {
    turet: {
      kaynak: 'd-kamet',
      cikar: [6],
      sabah: {
        sonra: 5,
        ar: 'اَلصَّلاَةُ خَيْرٌ مِنَ النَّوْمِ اَلصَّلاَةُ خَيْرٌ مِنَ النَّوْمِ',
        anlam: 'Namaz uykudan hayırlıdır. (2 kere)',
        okunus: 'es-Salâtü hayrun mine’n-nevm, es-Salâtü hayrun mine’n-nevm',
      },
    },
    kaynakAr: `${KAYNAK_AR} (ikamet kaydından türetildi: «İkamet de ezan gibidir, yalnız ‹Hayye ale’l-felâh›tan sonra ‹Kad kâmeti’s-salâh› eklenir», İslam İlmihali); sabah bölümü: Diyanet İşleri Başkanlığı, İslam İlmihali, VIII. Namaz (yazım portalın imlâsına uyarlandı)`,
    anlamKaynak: `${EZAN_ANLAM}; sabah bölümünün anlamı: Diyanet İşleri Başkanlığı, Diyanet İlmihali, I. cilt, «Ezan ve Kamet» (s. 267–268)`,
    zor: [{ bolum: 6, kelime: 'اَلصَّلاَةُ خَيْرٌ مِنَ النَّوْمِ', not: 'Yalnız sabah ezanında, «Hayye ale’l-felâh»tan sonra iki defa okunur. Diyanet’in ezan kaydı sabah ezanıdır.' }],
  },
};

/**
 * Dua dosyasının özeti: Arapça bölümler, Türkçe anlam, okunuş, dikkat notları ve düzeltme listesi. Elle değişikliği yakalar;
 * hoca onayı (`onay`) ve alım tarihi özete girmez. Kur'an maddelerinin özeti ayrıdır (scripts/ezber-metin-cek.mjs).
 */
export function duaOzeti(m) {
  const { bolumler, meal, okunus, zor, duzeltmeler } = m;
  return createHash('sha256').update(JSON.stringify({ bolumler, meal: { tr: meal.tr }, okunus, zor, duzeltmeler })).digest('hex');
}
