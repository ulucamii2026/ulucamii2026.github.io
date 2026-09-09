import { ihtidaPaketiUret } from '../../public/admin/ihtida-paket.js';

const ETIKET = {
  cinsiyet: { erkek: 'Erkek / Homme', kadin: 'Kadın / Femme' },
  medeniHali: { bekar: 'Bekâr', evli: 'Evli', bosanmis: 'Boşanmış', dul: 'Dul' },
  oncekiDin: { 'hristiyan-katolik': 'Hristiyanlık / Katolik', 'hristiyan-ortodoks': 'Hristiyanlık / Ortodoks', 'hristiyan-protestan': 'Hristiyanlık / Protestan', 'hristiyan-diger': 'Hristiyanlık', musevi: 'Musevilik', budist: 'Budizm', hindu: 'Hinduizm', ateist: 'Ateist', agnostik: 'Agnostik', dinsiz: 'Dinî bağı yok', yok: 'Dinî bağı yok' },
  ogrenim: { ilkokul: 'İlkokul', ortaokul: 'Ortaokul', lise: 'Lise', onlisans: 'Ön lisans', lisans: 'Lisans', yukseklisans: 'Yüksek lisans', doktora: 'Doktora', diger: 'Diğer' },
};
const etiket = (tur, v) => ETIKET[tur]?.[v] || v || '';
const tarih = v => String(v || '').replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$3/$2/$1').replace(/^(\d{2})\.(\d{2})\.(\d{4}).*$/, '$1/$2/$3');

export async function uret(k, gorseller, duzenleme, kaynaklar, pdfLib, fontkit) {
  // fontkit altküme yazıcısı Node akışı/timer ister. GAS'ta tam font gömülür;
  // sayfa düzeni ve glifler değişmez, tarayıcıda altküme kullanımı sürer.
  const hazirla = belge => {
    const embedFont = belge.embedFont.bind(belge);
    belge.embedFont = (font, options) => embedFont(font, { ...options, subset: false });
    return belge;
  };
  const gasPdfLib = { ...pdfLib, PDFDocument: {
    create: async options => hazirla(await pdfLib.PDFDocument.create(options)),
    load: async (bytes, options) => hazirla(await pdfLib.PDFDocument.load(bytes, { ...options, parseSpeed: Infinity })),
  } };
  const d = duzenleme || {};
  const imza = gorseller.imza || '';
  const beyan = imza ? tarih(k['Zaman damgası']) : tarih(d.beyanTarihi || k['Zaman damgası']);
  return ihtidaPaketiUret({
    ...kaynaklar, pdfLib: gasPdfLib, fontkit, onBasvuru: !duzenleme,
    isimYazisi: d.isimYazisi || 'kaligrafik', alanYazisi: d.alanYazisi || 'el-yazisi',
    veri: {
      ref: k['Referans'], dil: k['Form dili'] || 'fr', adSoyad: d.adSoyad || k['Adı Soyadı'],
      adres: d.adres || k['Adres'], beyanTarihi: beyan, ihtidaTarihi: tarih(d.ihtidaTarihi),
      cinsiyet: etiket('cinsiyet', k['Cinsiyet']), ogrenim: etiket('ogrenim', k['Öğrenim durumu']),
      anneAdi: k['Anne adı'], babaAdi: k['Baba adı'], dogumYeri: k['Doğum yeri'], dogumTarihi: tarih(k['Doğum tarihi']),
      medeniHali: etiket('medeniHali', k['Medeni hali']), meslek: k['Mesleği'], uyruk: k['Uyruk'],
      oncekiDin: etiket('oncekiDin', k['Önceki din/mezhep']), ihtidaSebebi: d.ihtidaSebebi ?? k['İhtida sebebi'],
      eposta: k['E-posta'], telefon: k['Telefon'],
    },
    foto: gorseller.vesikalik, basvuranImza: imza, imzasiz: !imza, ek10Onayi: k['EK-10 rızası'] === 'Evet',
    belgeTuru: d.belgeTuru || k['Kimlik belgesi türü'], kimlikOn: gorseller.kimlikOn, kimlikArka: gorseller.kimlikArka,
    sahitler: d.sahitler || [{ ad: k['Şahit 1'] || 'Rıdvan KAYAHAN' }, { ad: k['Şahit 2'] || 'Yeliz KAYAHAN' }],
    yedekImzalar: [],
  });
}
