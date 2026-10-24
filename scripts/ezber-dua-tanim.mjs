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
 *   url       kaynak.url (yoksa PORTAL)
 *   kitap     Portalda olmayan dua: Diyanet'in basılı kitaplarından, iki bağımsız kaynakla (aşağıda KITAP_DUALARI ve scripts/ezber-dua-kitap.mjs)
 */

import { createHash } from 'node:crypto';

export const PORTAL = 'https://namaz.diyanet.gov.tr/namaz/html/sureler-dualar.html';

const NI = 'Diyanet İşleri Başkanlığı, Namaz İlmihali, «Namaz İçinde Okunacak Dualar» (Namaz İlmihali, II. bölüm)';
const KAYNAK_AR = 'Diyanet İşleri Başkanlığı, Namaz Vakitleri sitesi (namaz.diyanet.gov.tr)';
const EZAN_ANLAM = 'Diyanet İşleri Başkanlığı, Dînî Kavramlar Sözlüğü, «Ezan» maddesi';

// --- Kitap kaynaklı dualar (scripts/ezber-dua-kitap.mjs) -----------------------------------------------------------------
// Portalda olmayan dualar, Diyanet'in basılı kitaplarından alınır. Kural: iki bağımsız Diyanet kaynağında harf iskeleti
// aynı olmalı; anlam ve okunuş kitaptan sözcüğü sözcüğüne alınır (kitapDuasi doğrular). Arapça çapalar (`bas`, `son`,
// `kesim`) yalnız metnin kaynakta nerede başlayıp bittiğini gösterir; metin kitaptan gelir.
//   kitap.ana       birincil Arapça: { kok, dosya, kesit?, kunye, parcalar: [{ bas, son?, nth? }] } ya da { mushaf: [...] }
//   kitap.ikinci    iskeleti karşılaştırılan başka Diyanet kaynakları (+ bolumler, fark)
//   kitap.kesim     bölümlerin başladığı Arapça çapalar; kitap.anlam / .fr / .okunus: kitapDuasi'deki anlamCoz biçimi
const kurs = (dosya, kunye, kesit) => ({ kok: 'kurs', dosya, kunye, ...(kesit && { kesit }) });
const ihtisas = (dosya, kunye, kesit) => ({ kok: 'ihtisas', dosya, kunye, ...(kesit && { kesit }) });
const dia = (dosya, kunye, kesit) => ({ kok: 'dia', dosya, kunye, ...(kesit && { kesit }) });
const YAYIN = 'https://diniyayinlar.diyanet.gov.tr/';
const DIJITAL = 'https://dijital.diyanet.gov.tr/Kitaplik';
const ELIFBA = 'elifba/30-namaz-dualari.md';
const ELIFBA_K = 'Diyanet İşleri Başkanlığı, Tecvidli Kur’an-ı Kerim Elif-Bâ (2020), s. {s}';
const TDB_IMAN = 'temel-dini-bilgiler/tr/02-itikat-unite-ii-iman.md';
const TDB_NAMAZ = 'temel-dini-bilgiler/tr/12-ibadet-unite-iv-namaz-i.md';
const TDB_EKLER = 'temel-dini-bilgiler/tr/34-ekler-namazlarda-okunan-dualar.md';
const TDB_K = 'Diyanet İşleri Başkanlığı, Temel Dinî Bilgiler (S. Yazıcı, DİB Yay. 301), s. {s}';
const CG1_TR_U2 = 'camiye-gidiyorum/cg1/tr/02-unite-02-islam-in-sartlari.md';
const CG1_FR_U1 = 'camiye-gidiyorum/cg1/fr/01-unite-01-ma-religion-est-l-islam.md';
const CG1_FR_U2 = 'camiye-gidiyorum/cg1/fr/02-unite-02-les-cinq-piliers-de-l-islam.md';
const CG1_FR_U19 = 'camiye-gidiyorum/cg1/fr/19-unite-19-je-crois-en-allah.md';
const CG2_TR_U1 = 'camiye-gidiyorum/cg2/tr/01-unite-01-allah-a-iman-ile-ilgili-bilmem-gerekenleri-ogreniyorum.md';
const CG1_K = 'Diyanet İşleri Türk İslam Birliği (DİTİB), Camiye Gidiyorum 1, s. {s}';
const CG2_K = 'Diyanet İşleri Türk İslam Birliği (DİTİB), Camiye Gidiyorum 2, s. {s}';
const CG1_FR_K = 'Diyanet İşleri Türk İslam Birliği (DİTİB), Camiye Gidiyorum 1 – Je vais à la mosquée 1 (resmî Fransızca yayın), s. {s}';
const IIL = 'diyanet-kitaplik/ilmihal-fikih/islam-ilmihali';
const HAC = 'diyanet-ilmihal-ek/hac-ilmihali.md';
const TS = 'diyanet-kitaplik/hadis-ve-siyer';
const ELIFBA_TESBIHAT = ['Tekbir (Namaza başlarken)', 'Rükuda üç kere'];
const TDB_TESBIHAT = [['“Elhamdü lillâh”', 1], 'denilir.'];
const TDB_TEVHID = ['### KELİME-İ TEVHİD', '### KELİME-İ ŞEHADET'];
const TDB_SEHADET = ['### KELİME-İ ŞEHADET', '## İMAN ESASLARI'];
const ELIFBA_AMENTU = ['## ÂMENTÜ DUÂSI', '# ŞAFİİ MEZHEBİNE'];
const TESRIK_IIL = ['#### 2. Teşrik Tekbirleri', 'Bu tekbir, hem cemaatle'];
const TELBIYE_HAC = [['### b) Telbiye', 1], 'Peygamberimiz (a.s.) böyle telbiye'];

const KITAP_DUALARI = {
  'd-euzu-besmele': {
    url: 'https://kuran.diyanet.gov.tr/mushaf',
    kitap: {
      ana: {
        kunye: 'Diyanet İşleri Başkanlığı Kur’an-ı Kerim mushafı (kuran.diyanet.gov.tr/mushaf): Bakara 2/67 (15–16), Nahl 16/98 (6–8), Fâtiha 1/1',
        mushaf: [{ sure: 2, ayet: 67, kelimeler: [15, 16] }, { sure: 16, ayet: 98, kelimeler: [6, 8] }, { sure: 1, ayet: 1, kelimeler: [1, 4] }],
      },
      kesim: ['بسم'],
      ikinci: [
        { ...ihtisas(`${TS}/tecrid-i-sarih-8/052-kitabul-edeb.md`, 'Diyanet İşleri Başkanlığı, Tecrid-i Sarih Tercemesi ve Şerhi, 8. cilt, Kitâbü’l-Edeb'), bolumler: [1], parcalar: [{ bas: 'اعوذ بالله من الشيطان الرجيم' }] },
        { ...kurs(TDB_EKLER, `${TDB_K}, «Fatiha Suresi»`, [['## Fatiha Suresi:', 1], 'Namazda ayakta iken okunur.']), bolumler: [2], parcalar: [{ bas: 'بسم الله الرحمن الرحيم' }] },
        { ...kurs(CG1_TR_U2, CG1_K, ['**Besmele**', '## Her işin başı bismillah']), bolumler: [2], parcalar: [{ bas: 'بسم الله الرحمن الرحيم' }] },
      ],
      anlam: {
        dizi: [
          { metin: 'Kovulmuş şeytandan Allah’a sığınırım.', kaynak: ihtisas(`${TS}/riyazus-salihin-metin-ve-ceviri-1/007-sabir.md`, 'Eûzü: Diyanet İşleri Başkanlığı, Riyâzü’s-Sâlihîn (Metin ve Çeviri), 1. cilt, «Sabır», 46. hadis (Buhârî, Bed’ü’l-halk 11; Müslim, Birr 109)') },
          { metin: 'Rahmân (Bağışlayıcı) ve Rahîm (Esirgeyici) olan Allah’ın adıyla', kaynak: kurs(CG1_TR_U2, `Besmele: ${CG1_K}`, ['**Besmele**', '## Her işin başı bismillah']) },
        ],
      },
      okunus: {
        dizi: [
          { metin: 'Eûzü billâhi mine’ş-şeytâni’r-racîm', kaynak: dia('i/istiaze.md', 'TDV İslâm Ansiklopedisi, «İstiâze» (c. 23, s. 318–319)') },
          { metin: 'Bismillâhirrahmânirrahîm', kaynak: dia('b/besmele.md', 'TDV İslâm Ansiklopedisi, «Besmele» (c. 5, s. 529–540)') },
        ],
      },
    },
  },

  'd-kelime-i-tevhid': {
    url: YAYIN,
    kitap: {
      ana: { ...kurs(TDB_IMAN, `${TDB_K}, «Kelime-i Tevhid»`, TDB_TEVHID), parcalar: [{ bas: 'لا اله الا الله محمد رسول الله' }] },
      kesim: ['محمد'],
      ikinci: [
        { ...kurs(CG2_TR_U1, CG2_K), parcalar: [{ bas: 'لا اله الا الله محمد رسول الله' }] },
        { ...ihtisas(`${IIL}/010-iv-iman.md`, 'Diyanet İşleri Başkanlığı, İslam İlmihali, IV. İman, «Kelime-i Tevhid»'), parcalar: [{ bas: 'لا اله الا الله محمد رسول الله' }] },
      ],
      anlam: { kaynak: kurs(TDB_IMAN, `${TDB_K}, «Kelime-i Tevhid»`, TDB_TEVHID), dizi: ['Allah’tan başka tanrı yoktur.', 'Hazreti Muhammed (s.a.s.) Allah’ın Peygamberidir.'] },
      fr: { kaynak: kurs(CG1_FR_U1, CG1_FR_K, [["La profession d'unicité", 1], "Écoutons la profession d'unicité"]), dizi: ['Il n’y a de divinité qu’Allah.', 'Muhammed est le Messager d’Allah.'] },
      okunus: { kaynak: kurs(TDB_IMAN, TDB_K, TDB_TEVHID), metin: 'Lâ ilâhe İllallâh, Muhammedün Resûlüllah.', kesim: ['Muhammedün'] },
    },
  },

  'd-kelime-i-sehadet': {
    url: YAYIN,
    kitap: {
      ana: { ...kurs(TDB_IMAN, `${TDB_K}, «Kelime-i Şehadet»`, TDB_SEHADET), parcalar: [{ bas: 'اشهد ان لا اله الا الله', son: 'عبده ورسوله' }] },
      kesim: ['واشهد'],
      ikinci: [
        { ...kurs(CG2_TR_U1, CG2_K), parcalar: [{ bas: 'اشهد ان لا اله الا الله', son: 'عبده ورسوله' }] },
        { ...kurs(ELIFBA, `${ELIFBA_K}, «Âmentü Duâsı»`, ELIFBA_AMENTU), parcalar: [{ bas: 'اشهد ان لا اله الا الله', son: 'عبده ورسوله' }] },
      ],
      anlam: { kaynak: kurs(TDB_IMAN, `${TDB_K}, «Kelime-i Şehadet»`, TDB_SEHADET), dizi: ['Ben şahitlik ederim ki Allah’tan başka Tanrı yoktur.', 'Yine şahitlik ederim ki Hazreti Muhammed (s.a.s.) Allah’ın kulu ve Peygamberidir.'] },
      fr: { kaynak: kurs(CG1_FR_U2, CG1_FR_K, ['**La profession de foi**', '## Lexique']), dizi: ["J'atteste qu'il n'est point de divinité hormis Allah", 'et je témoigne que Muhammed est Son serviteur et Son Messager.'] },
      okunus: { kaynak: kurs(TDB_IMAN, TDB_K, TDB_SEHADET), metin: 'Eşhedu en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühü ve Resûlüh.', kesim: ['ve eşhedü'] },
    },
  },

  'd-tekbir': {
    url: YAYIN,
    kitap: {
      ana: { ...kurs(ELIFBA, `${ELIFBA_K}, «Namaz içindeki tesbihat»`, ELIFBA_TESBIHAT), parcalar: [{ bas: 'الله اكبر' }] },
      ikinci: [{ ...kurs(TDB_NAMAZ, `${TDB_K}, «Namaz sonrası tesbihat»`, TDB_TESBIHAT), parcalar: [{ bas: 'الله اكبر' }] }],
      anlam: { kaynak: kurs(ELIFBA, `${ELIFBA_K}, «Namaz içindeki tesbihat»`, ELIFBA_TESBIHAT), dizi: ['Allah en büyüktür'] },
      okunus: { kaynak: kurs(TDB_NAMAZ, `${TDB_K}, «Namaz sonrası tesbihat»`, TDB_TESBIHAT), dizi: ['Allâhu Ekber'] },
    },
  },

  'd-tesmi-tahmid': {
    url: YAYIN,
    kitap: {
      ana: { ...kurs(ELIFBA, `${ELIFBA_K}, «Namaz içindeki tesbihat»`, ['Rükudan kalkarken', 'Secdede üç kere']), parcalar: [{ bas: 'سمع الله لمن حمده' }, { bas: 'ربنا لك الحمد' }] },
      kesim: ['ربنا'],
      ikinci: [{ ...ihtisas(`${TS}/hadislerle-islam-2/017-imamlik-cemaate-kilavuz-olmak.md`, 'Diyanet İşleri Başkanlığı, Hadislerle İslam, 2. cilt, «İmamlık: Cemaate Kılavuz Olmak»'), parcalar: [{ bas: 'سمع الله لمن حمده' }, { bas: 'ربنا لك الحمد' }] }],
      anlam: { kaynak: kurs(ELIFBA, `${ELIFBA_K}, «Namaz içindeki tesbihat»`, ['Rükudan kalkarken', 'Secdede üç kere']), dizi: ['Allah, kendisine hamdedeni işitir.', 'Rabbimiz, hamd senin içindir'] },
    },
  },

  'd-selam': {
    url: YAYIN,
    kitap: {
      ana: { ...kurs(ELIFBA, `${ELIFBA_K}, «Namaz içindeki tesbihat»`, ['Sağa sola selam verirken', '## NAMAZ SONRASI TESBİHAT']), parcalar: [{ bas: 'السلام عليكم ورحمة الله' }] },
      ikinci: [{ ...ihtisas(`${TS}/tecrid-i-sarih-2/011-kitabul-ezan.md`, 'Diyanet İşleri Başkanlığı, Tecrid-i Sarih Tercemesi ve Şerhi, 2. cilt, Kitâbü’l-Ezân'), parcalar: [{ bas: 'السلام عليكم ورحمة الله' }] }],
      anlam: { kaynak: kurs(ELIFBA, `${ELIFBA_K}, «Namaz içindeki tesbihat»`, ['Sağa sola selam verirken', '## NAMAZ SONRASI TESBİHAT']), dizi: ['Allah’ın selamı ve rahmeti üzerinize olsun'] },
    },
  },

  'd-amentu': {
    url: YAYIN,
    kitap: {
      ana: { ...kurs(ELIFBA, `${ELIFBA_K}, «Âmentü Duâsı»`, ELIFBA_AMENTU), parcalar: [{ bas: 'امنت بالله', son: 'عبده ورسوله' }] },
      kesim: ['وبالقدر', 'والبعث', 'اشهد', 'واشهد'],
      ikinci: [
        { ...kurs(TDB_IMAN, `${TDB_K}, «Âmentü»`), parcalar: [{ bas: 'امنت بالله', son: 'عبده ورسوله' }] },
        { ...kurs(CG1_FR_U19, CG1_FR_K), parcalar: [{ bas: 'امنت بالله', son: 'رسوله' }] },
      ],
      anlam: {
        kaynak: kurs(ELIFBA, `${ELIFBA_K}, «Âmentü Duâsı»`, ELIFBA_AMENTU),
        metin: 'Ben, Allah’a, meleklerine, kitaplarına, peygamberlerine, Ahiret gününe, kadere yani hayır ve şerrin Yüce Allah’ın takdiriyle olduğuna, ölümden sonra tekrar dirilmenin hak ve gerçek olduğuna iman ettim. Ben şehâdet ederim ki Allah’tan başka ilah yoktur ve Muhammed (s.a.s.) O’nun kulu ve elçisidir.',
        kesim: ['kadere yani', 'ölümden sonra', 'Ben şehâdet ederim'],
        gruplar: [[1, 1], [2, 2], [3, 3], [4, 5]],
      },
      fr: {
        kaynak: kurs(CG1_FR_U19, CG1_FR_K, [['# Le résumé de ma croyance', 1], '# Mes amis aussi croient']),
        metin: "Je crois en Allah, en Ses anges, en Ses Livres révélés, en Ses messagers, au Jour dernier, à la prédestination, et au fait que le bien comme le mal viennent d'Allah, le Très-Haut, et que la résurrection après la mort est vraie. Je témoigne qu'il n'y a de divinité qu'Allah. Et je témoigne que Muhammed est Son serviteur et Son messager.",
        kesim: ['à la prédestination', 'et que la résurrection', 'Je témoigne'],
        gruplar: [[1, 1], [2, 2], [3, 3], [4, 5]],
      },
    },
  },

  'd-tesrik-tekbiri': {
    url: YAYIN,
    kitap: {
      ana: { ...ihtisas(`${IIL}/018-viii-namaz.md`, 'Diyanet İşleri Başkanlığı, İslam İlmihali, VIII. Namaz, «Teşrik Tekbirleri»', TESRIK_IIL), parcalar: [{ bas: 'الله اكبر', son: 'ولله الحمد' }] },
      kesim: ['لا اله', 'والله اكبر'],
      ikinci: [
        { ...ihtisas(HAC, 'Diyanet İşleri Başkanlığı, Hac İlmihali, s. {s}, «Teşrik Tekbiri» (sözlük)', [['### TEŞRÎK TEKBİRİ', 1], '### TEMETTU']), parcalar: [{ bas: 'الله اكبر', son: 'ولله الحمد' }] },
        { ...ihtisas(`${IIL}/022-xii-kurban.md`, 'Diyanet İşleri Başkanlığı, İslam İlmihali, XII. Kurban'), parcalar: [{ bas: 'الله اكبر الله اكبر لا اله', son: 'ولله الحمد' }] },
      ],
      anlam: {
        kaynak: ihtisas('dini-kavramlar-sozlugu/t.md', 'Diyanet İşleri Başkanlığı, Dinî Kavramlar Sözlüğü, «Tekbir» maddesi, s. {s}', [['Selamdan sonra, hutbe içinde', 1], 'Kurban bayramının bir gün öncesi']),
        metin: "Allah, en büyüktür, Allah en büyüktür, O'ndan başka ilah yoktur, sadece O vardır. Allah en büyüktür ve her türlü övgü Allah' içindir",
        kesim: ['O’ndan başka', 'Allah en büyüktür ve'],
      },
      okunus: {
        kaynak: ihtisas(`${IIL}/018-viii-namaz.md`, 'Diyanet İşleri Başkanlığı, İslam İlmihali, VIII. Namaz, «Teşrik Tekbirleri»', TESRIK_IIL),
        metin: 'Allâhu Ekber, Allâhu Ekber, Lâ ilâhe illallâhu vallâhu Ekber. Allâhu Ekber ve lillâhi’l-hamd',
        kesim: ['Lâ ilâhe', 'vallâhu Ekber'],
      },
    },
  },

  'd-telbiye': {
    url: YAYIN,
    kitap: {
      ana: { ...ihtisas(HAC, 'Diyanet İşleri Başkanlığı, Hac İlmihali, s. {s}, «Telbiye»', TELBIYE_HAC), parcalar: [{ bas: 'لبيك اللهم لبيك', son: 'والملك لا شريك لك' }] },
      kesim: ['لبيك لا شريك', 'ان الحمد', 'لا شريك لك'],
      ikinci: [{ ...ihtisas(`${IIL}/021-xi-hac.md`, 'Diyanet İşleri Başkanlığı, İslam İlmihali, XI. Hac, «Telbiye»', [['2. Telbiye, yani,', 1], 'Hac veya umreye yahut']), parcalar: [{ bas: 'لبيك اللهم لبيك', son: 'والملك لا شريك لك' }] }],
      anlam: {
        kaynak: ihtisas(HAC, 'Diyanet İşleri Başkanlığı, Hac İlmihali, s. {s}, «Telbiye»', TELBIYE_HAC),
        metin: 'Buyur Allah’ım buyur! Buyur, senin hiçbir ortağın yoktur. Buyur, şüphesiz, her türlü övgü, nimet, mülk ve hükümranlık sana mahsustur. Senin ortağın yoktur.',
        kesim: ['Buyur, senin', 'Senin ortağın'],
        gruplar: [[1, 1], [2, 3], [4, 4]],
      },
      okunus: {
        kaynak: ihtisas(`${IIL}/021-xi-hac.md`, 'Diyanet İşleri Başkanlığı, İslam İlmihali, XI. Hac, «Telbiye»', [['2. Telbiye, yani,', 1], 'Hac veya umreye yahut']),
        metin: 'Lebbeyk, Allâhümme lebbeyk, Lebbeyke lâ şerike leke lebbeyk. İnne’l-hamde ve’n-ni’mete leke ve’l-mülk lâ şerîke lek.',
        kesim: ['Lebbeyke lâ', 'İnne’l-hamde', 'lâ şerîke lek'],
      },
    },
  },

  'd-yemek-duasi': {
    url: `${DIJITAL}/hadis-ve-siyer/hadislerle-islam-6`,
    kitap: {
      ana: { ...ihtisas(`${TS}/hadislerle-islam-6/025-hz-peygamberin-yemek-adabi-acikmadan-yemezdi-doyma.md`, 'Diyanet İşleri Başkanlığı, Hadislerle İslam, 6. cilt, «Hz. Peygamber’in Yemek Âdâbı: Acıkmadan Yemezdi, Doymadan Kalkardı» (Ebû Saîd el-Hudrî’den; D3850 Ebû Dâvûd, Et’ıme, 52; T3457 Tirmizî, Deavât, 55)'), parcalar: [{ bas: 'الحمد لله الذي اطعمنا', son: 'وجعلنا مسلمين' }] },
      kesim: ['الذي', 'وجعلنا'],
      ikinci: [
        { ...ihtisas(`${TS}/tecrid-i-sarih-8/042-kitabul-etime.md`, 'Diyanet İşleri Başkanlığı, Tecrid-i Sarih Tercemesi ve Şerhi, 8. cilt, Kitâbü’l-Et‘ime'), parcalar: [{ bas: 'الحمد لله الذي اطعمنا', son: 'وجعلنا مسلمين' }] },
      ],
      anlam: {
        kaynak: ihtisas(`${TS}/hadislerle-islam-6/025-hz-peygamberin-yemek-adabi-acikmadan-yemezdi-doyma.md`, 'Diyanet İşleri Başkanlığı, Hadislerle İslam, 6. cilt, «Hz. Peygamber’in Yemek Âdâbı: Acıkmadan Yemezdi, Doymadan Kalkardı»'),
        dizi: ['Bizi yediren, bizi içiren ve bizi Müslüman yapan Allah’a hamdolsun.'],
        gruplar: [[1, 3]],
      },
    },
  },
};

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
  ...KITAP_DUALARI,
};

/**
 * Dua dosyasının özeti: Arapça bölümler, Türkçe anlam, okunuş, dikkat notları ve düzeltme listesi. Elle değişikliği yakalar;
 * hoca onayı (`onay`) ve alım tarihi özete girmez. Kur'an maddelerinin özeti ayrıdır (scripts/ezber-metin-cek.mjs).
 */
export function duaOzeti(m) {
  const { bolumler, meal, okunus, zor, duzeltmeler } = m;
  // Fransızca anlam yalnız Diyanet-hattı kitaptan gelen dualarda (Camiye Gidiyorum) vardır; yoksa özet eskisiyle aynı kalır.
  return createHash('sha256').update(JSON.stringify({ bolumler, meal: { tr: meal.tr, ...(meal.fr && { fr: meal.fr }) }, okunus, zor, duzeltmeler })).digest('hex');
}
