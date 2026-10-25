import { ihtidaPaketiUret, ihtidaPaketParcalari, suretFiligrani, DHYS_PARCALARI, DHYS_VESIKALIK, TEK_IMZA } from '../../public/admin/ihtida-paket.js';
import { camiCoz } from '../../public/admin/cami-secimi.js';
import { sahitOnerileri, ek9Degerleri, ek9AlanlariUygula, ek9AlanlariGecerli, sahitImzalariniBagla, sahitKendiImzalari } from '../../public/admin/ek9-hazirlik.js';
import { imzaVektorCoz, sahitImzaCoz } from '../../public/admin/imza-ciz.js';
import { ek10SurumuCoz } from '../../public/admin/ek10.js';

/** EK-9'a yazılacak ihtida sebebi: son nüsha ekranında düzeltildiyse o, yoksa başvuru kaydındaki. Sunucu Türkçesini bu metinden çevirir. */
export const sebepKaynagi = (k, d) => (d && d.ihtidaSebebi != null ? d.ihtidaSebebi : k['İhtida sebebi']) || '';

const tarih = v => String(v || '').replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$3/$2/$1').replace(/^(\d{2})\.(\d{2})\.(\d{4}).*$/, '$1/$2/$3');

/* 23 Eki 2026 (Rıdvan KAYAHAN): Marche Ulu Camii'nde şahit «Rıdvan KAYAHAN» ve «Ercan MOLA» ise kayıtlı vektör imzaları
   belgeye kendiliğinden basılır. İmzalar bu pakette YOKTUR: sunucu bunları dernek Google hesabındaki özel depodan okuyup
   secenek.sahitImzalari = {ridvan, ercan} olarak verir. Ön başvuruda varsayılan şahit adları (ya da başvuranın yazdığı
   adlar) eşleşirse imzalar dernek içi nüshaya girer; son nüshada görevlinin işareti (imzaKullan) belirler. */
export function sahitImzaPlani(k, duzenleme, imzalar, gorseller) {
  const camiId = k['Cami kimliği'] || 'ulucamii-marche';
  const sahitler = (duzenleme && duzenleme.sahitler) || sahitOnerileri({ ...k, 'Cami kimliği': camiId }).map(ad => ({ ad }));
  // 25 Eki 2026: yedek şahit rızası (son nüsha ekranı) varsa başka camide de kayıtlı imza bağlanır.
  return sahitImzalariniBagla(sahitler, camiId, imzalar, sahitKendiImzalari(gorseller), { yedekSahitRizasi: duzenleme && duzenleme.yedekSahitRizasi });
}

/** fontkit altküme yazıcısı Node akışı/timer ister. GAS'ta tam font gömülür;
 *  sayfa düzeni ve glifler değişmez, tarayıcıda altküme kullanımı sürer. */
function gasPdfLibOlustur(pdfLib) {
  const hazirla = belge => {
    const embedFont = belge.embedFont.bind(belge);
    belge.embedFont = (font, options) => embedFont(font, { ...options, subset: false });
    return belge;
  };
  return { ...pdfLib, PDFDocument: {
    create: async options => hazirla(await pdfLib.PDFDocument.create(options)),
    load: async (bytes, options) => hazirla(await pdfLib.PDFDocument.load(bytes, { ...options, parseSpeed: Infinity })),
  } };
}

/** secenek.sahitImzalari: özel depodan gelen {ridvan, ercan} vektör imza metinleri; verilmezse yerel şahit imzası basılmaz
 *  (başvuranın e-posta nüshası böyle üretilir). */
export async function uret(k, gorseller, duzenleme, kaynaklar, pdfLib, fontkit, secenek = {}) {
  const gasPdfLib = gasPdfLibOlustur(pdfLib);
  const d = duzenleme || {};
  const cami = camiCoz({
    id: k['Cami kimliği'] || 'ulucamii-marche', ad: k['Başvuru camisi'], sehir: k['Cami şehri'],
    postaKodu: k['Cami posta kodu'], adres: k['Cami adresi'], kurum: k['Cami kurumu'],
  });
  if (!cami) throw new Error('Başvuru camisi eksik veya geçersiz.');
  const teslimatYontemi = k['Belge teslim yeri'] === 'adres' ? 'adres' : 'cami'; // Eski satırlar cami teslimi varsayılır.
  // Şahidin başvuruda kendi attığı imza (rızası kayıtlıysa) her nüshada basılır; kayıtlı (Ercan MOLA / Rıdvan KAYAHAN) imzalar yalnız secenek.sahitImzalari ile.
  const sahitler = sahitImzalariniBagla(d.sahitler || sahitOnerileri({ ...k, 'Cami kimliği': cami.id }).map(ad => ({ ad })), cami.id, secenek.sahitImzalari, sahitKendiImzalari(gorseller), { yedekSahitRizasi: d.yedekSahitRizasi }).sahitler;
  const imza = gorseller.imza || '';
  // Vektör imza yalnız aynı başvurunun PNG imzasıyla birlikte geçerlidir (ikisi aynı çizimden çıkar).
  const imzaVektor = imza && imzaVektorCoz(gorseller.imzaVektor) ? gorseller.imzaVektor : '';
  const ek10Surumu = ek10SurumuCoz(k['EK-10 sürümü']);
  const imzaAktarimIzni = k['İmza aktarım izni'] === 'Evet';
  const beyan = imza ? tarih(k['Zaman damgası']) : tarih(d.beyanTarihi || k['Zaman damgası']);
  const ek10Sablonu = { '2026-10': kaynaklar.ek10EkimSablonBytes, '2026-09-09': kaynaklar.ek10SablonBytes, v1: kaynaklar.ek10V1SablonBytes }[ek10Surumu];
  // 21 Eki 2026: son nüsha ekranında görevlinin düzelttiği EK-9 değerleri kaydın değerlerinin önüne geçer.
  // Dilekçe başvuranın kendi beyanıdır (Koordinatörlük emsali, kisi.json «dilekceAlanlari»): orada kaydın değeri kalır.
  const e9Kayit = ek9Degerleri(k), e9 = ek9AlanlariUygula(e9Kayit, d.alanlar);
  return ihtidaPaketiUret({
    ...kaynaklar, pdfLib: gasPdfLib, fontkit, onBasvuru: !duzenleme,
    isimYazisi: d.isimYazisi || 'kaligrafik', alanYazisi: d.alanYazisi || 'el-yazisi',
    veri: {
      ref: k['Referans'], dil: k['Form dili'] || 'fr', adSoyad: d.adSoyad || k['Adı Soyadı'],
      adres: d.adres || k['Adres'], beyanTarihi: beyan, ihtidaTarihi: tarih(d.ihtidaTarihi),
      cinsiyet: e9.cinsiyet, ogrenim: e9.ogrenim,
      anneAdi: e9.anneAdi, babaAdi: e9.babaAdi, dogumYeri: e9.dogumYeri, dogumTarihi: tarih(k['Doğum tarihi']),
      medeniHali: e9.medeniHali, meslek: e9.meslek, uyruk: e9.uyruk, dilekce: { dogumYeri: e9Kayit.dogumYeri },
      // 25 Eki 2026: sebebin Türkçesi (sunucu çevirisi ya da görevlinin yazdığı) altına yazılır; cinsiyet ön yüzdeki zamirleri çizer.
      oncekiDin: e9.oncekiDin, ihtidaSebebi: sebepKaynagi(k, d), ihtidaSebebiTr: String(secenek.ihtidaSebebiTr || ''),
      cinsiyetKodu: k['Cinsiyet'] || '',
      eposta: k['E-posta'], telefon: k['Telefon'], cami,
      teslimat: { yontem: teslimatYontemi },
    },
    ek10SablonBytes: ek10Sablonu, ek10Surumu, imzaAktarimIzni,
    foto: gorseller.vesikalik, basvuranImza: imza, basvuranImzaVektor: imzaVektor, imzasiz: !imza, ek10Onayi: k['EK-10 rızası'] === 'Evet',
    belgeTuru: d.belgeTuru || k['Kimlik belgesi türü'], kimlikOn: gorseller.kimlikOn, kimlikArka: gorseller.kimlikArka,
    cami, sahitler,
    yedekImzalar: [],
    // 25 Eki 2026: verilirse üretici DHYS parça planını (sayfa sıraları) bu nesneye yazar.
    parcaPlani: secenek.parcaPlani,
  });
}

export { camiCoz, imzaVektorCoz, sahitImzaCoz, ek9AlanlariGecerli };
export const tekImza = TEK_IMZA;   // sağlık cevabı: ihtidaTekImza
export const sahitKendiImzasi = true;   // sağlık cevabı: ihtidaSahitKendiImzasi (mühtedinin kendi şahidinin formda attığı imza EK-9'a basılır)
export const sahitImzasi = true;   // sağlık cevabı: ihtidaSahitImzasi (kayıtlı şahit imzaları özel depodan otomatik basılır)
export const sebepIkiDilli = true;   // sağlık cevabı: ihtidaSebepTurkcesi (25 Eki 2026: EK-9 arka yüzünde sebebin Türkçesi altına yazılır)
export const zamirCizigi = true;     // sağlık cevabı: ihtidaZamirCizigi (25 Eki 2026: ön yüzde cinsiyete göre he/she, his/her çizilir)
/** 25 Eki 2026: paketi DHYS'ye ayrı yüklenecek dört PDF'e böler (EK-9 · dilekçe · EK-10 · kimlik). */
export const parcala = (pdfLib, bytes, plan, ref) => ihtidaPaketParcalari(pdfLib, bytes, plan, ref);
export { DHYS_PARCALARI, DHYS_VESIKALIK };
/** 25 Eki 2026: başvurana giden nüsha «SURET · bilgi amaçlıdır» filigranıyla (her sayfa). GAS'ta yazı tipi tam gömülür. */
export const suret = (bytes, kaynaklar, pdfLib, fontkit) =>
  suretFiligrani(gasPdfLibOlustur(pdfLib), bytes, kaynaklar.fontBytes, kaynaklar.fontKalinBytes, fontkit);
export const suretFiligranli = true;   // sağlık cevabı: ihtidaSuret
export const dhysParcalari = true;   // sağlık cevabı: ihtidaDhysParcalari
