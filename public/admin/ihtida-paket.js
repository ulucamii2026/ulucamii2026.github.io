/** Başvuru verilerinden tek dosya, Müşavirlik paketinin sırasıyla: EK-9 (2 s.), talep dilekçesi (2 s.),
 * EK-10 açık rıza metni (2 s.), kimlik belgesi fotokopisi (1 s.).
 * Panel ve Apps Script aynı üreticiyi kullanır; şablonlar ve fontlar dağıtımda birlikte paketlenir.
 * 17 Eki 2026 (KALICI KURAL): elle doldurulan bütün alanlar mavi dolma kalemle (Allura, #1A3D9E) yazılır; imza
 * formda çizildiği gibi vektör olarak, aynı mürekkeple konur. Düzen Mühtedi Koordinatörlüğünün hattıyla aynıdır.
 * Şahit teyitleri ve gerçek ihtida tarihi belge hazırlama ekranından gelir.
 */
import { ek9Uret } from './ek9.js';
import { ek10Uret, YENI_SURUM, EKIM_SURUMU } from './ek10.js';
import { dilekceFormUret } from './dilekce.js';
import { camiCoz } from './cami-secimi.js';
import { adBicimleri } from './kalem.js';
import { kimlikSayfasiEkle } from './kimlik-sayfa.js';

/** 23 Eki 2026: tek imza kuralı derlenmiş pakette varsa sağlık cevabı bunu gösterir (ihtidaTekImza). */
export const TEK_IMZA = true;

/** 25 Eki 2026 (Rıdvan KAYAHAN: «… bu dosyadakileri dhys sistemine yükleyecek, belge bir parça, dilekçe bi parça,
 *  aydınlatma metni ve açık rıza metni bir parça, kimlik bir parça … online başvuru formunu doldurduktan sonra bunların
 *  herbiri parça parça yani ayrı ayrı kaydedilsin»): paket DHYS'ye ayrı ayrı yüklenecek dört PDF'e bölünür. Başlıklar
 *  Mühtedi Koordinatörlüğünün dhys-parcala.py aracıyla aynıdır; EK-9 açıklama eki sayfaları EK-9 parçasına girer. */
export const DHYS_PARCALARI = [
  { no: 1, anahtar: 'ek9', baslik: 'İhtida Belgesi (EK-9)', kisa: 'EK-9' },
  { no: 2, anahtar: 'dilekce', baslik: 'İhtida Belgesi Talep Dilekçesi', kisa: 'Dilekçe' },
  { no: 3, anahtar: 'ek10', baslik: 'Aydınlatma ve Açık Rıza Metni (EK-10)', kisa: 'EK-10' },
  { no: 4, anahtar: 'kimlik', baslik: 'Kimlik Belgesi Fotokopisi', kisa: 'Kimlik' },
];
/** 25 Eki 2026 (Rıdvan KAYAHAN: «vesikalık fotoğraf ihtida belgesinin önyüzüne yerleştirdiğimiz fotoğraf olacak»): DHYS'ye
 *  fotoğraf yüklenirken kullanılsın diye vesikalık da arşive ayrı dosya olarak konur (PDF değil, görsel). */
export const DHYS_VESIKALIK = { no: 5, anahtar: 'vesikalik', baslik: 'Vesikalık Fotoğraf', kisa: 'Vesikalık' };
const aralik = (bas, son) => Array.from({ length: son - bas }, (_, i) => bas + i);

/** 25 Eki 2026 (Rıdvan KAYAHAN: «ihtida başvurusu yapan kardeşimizin mailine ihtida belgesinin sureti filigran gibi bir şey ile
 *  gitsin, bu belge bilgi amaçlıdır»): başvurana giden nüshanın her sayfasına çapraz «SURET · COPIE · COPY» filigranı ve üstte
 *  ince bir «bilgi amaçlıdır» şeridi basılır. Belgenin kendisine dokunulmaz; yalnız üstüne yarı saydam yazı eklenir. */
export const SURET_METNI = {
  buyuk: 'SURET · COPIE · COPY',
  kucuk: 'Bilgi amaçlıdır · À titre d’information · For information only',
  // Rıdvan KAYAHAN: «asıl nüsha resmi imza süreçlerinden sonra … size ulaştırılacaktır». Ayrıntı e-posta metnindedir.
  serit: [
    'SURET — bilgi amaçlıdır, resmî belge yerine geçmez. Asıl nüsha resmî imzalardan sonra size ulaştırılacaktır.',
    'COPIE — à titre d’information ; l’original vous sera remis après les signatures officielles · COPY — for information only; the original will be sent to you after the official signatures.',
  ],
};
export async function suretFiligrani(pdfLib, bytes, fontBytes, fontKalinBytes, fontkit) {
  const { PDFDocument, rgb, degrees } = pdfLib;
  const belge = await PDFDocument.load(bytes, { parseSpeed: Infinity });
  if (fontkit) belge.registerFontkit(fontkit);
  const kalin = await belge.embedFont(fontKalinBytes || fontBytes, { subset: true });
  const ince = await belge.embedFont(fontBytes, { subset: true });
  const gri = rgb(0.55, 0.12, 0.12);
  for (const sayfa of belge.getPages()) {
    const W = sayfa.getWidth(), H = sayfa.getHeight(), aci = Math.atan2(H, W), kos = Math.cos(aci), sin = Math.sin(aci);
    const kosegen = Math.hypot(W, H);
    // Büyük satır köşegenin ~%70'ini kaplar; küçük satır onun altında (köşegene dik yönde) durur.
    const buyukBoy = Math.min(72, (kosegen * 0.7) / kalin.widthOfTextAtSize(SURET_METNI.buyuk, 1));
    const kucukBoy = Math.min(16, (kosegen * 0.62) / ince.widthOfTextAtSize(SURET_METNI.kucuk, 1));
    const ciz = (metin, font, boy, kayma) => {
      const w = font.widthOfTextAtSize(metin, boy);
      // Metnin ortası sayfanın ortasına gelsin; «kayma» köşegene dik yönde (aşağı) öteler.
      const x = W / 2 - (w / 2) * kos + kayma * sin, y = H / 2 - (w / 2) * sin - kayma * kos - boy * 0.35 * kos;
      sayfa.drawText(metin, { x, y, size: boy, font, color: gri, opacity: 0.16, rotate: degrees((aci * 180) / Math.PI) });
    };
    ciz(SURET_METNI.buyuk, kalin, buyukBoy, 0);
    ciz(SURET_METNI.kucuk, ince, kucukBoy, buyukBoy * 0.9);
    // Üst şerit iki satır: aynı boyda (uzun satıra göre), sayfanın üst kenarında.
    const seritBoy = Math.min(6.5, ...SURET_METNI.serit.map(t => (W - 40) / ince.widthOfTextAtSize(t, 1)));
    SURET_METNI.serit.forEach((t, i) => {
      const sw = ince.widthOfTextAtSize(t, seritBoy);
      sayfa.drawText(t, { x: (W - sw) / 2, y: H - 10 - i * seritBoy * 1.3, size: seritBoy, font: ince, color: gri, opacity: 0.85 });
    });
  }
  belge.setSubject('SURET — bilgi amaçlıdır / COPIE — à titre d’information / COPY — for information only');
  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}

/** Paketi plandaki sayfalarla dört PDF'e böler. Plan paketle birebir uyuşmazsa (sayfa sayısı, eksik/tekrarlı sayfa) hata verir. */
export async function ihtidaPaketParcalari(pdfLib, paketBytes, plan, ref = '') {
  const { PDFDocument } = pdfLib;
  const kaynak = await PDFDocument.load(paketBytes, { parseSpeed: Infinity });
  const toplam = kaynak.getPageCount();
  if (!plan || plan.toplam !== toplam) throw new Error('DHYS parça planı paketle uyuşmuyor.');
  // Önce bütün plan doğrulanır (boş parça, geçersiz/tekrarlı sayfa, kapsam); sonra kesilir. Dizi bu alanda yeniden kurulur
  // (pdf-lib copyPages instanceof Array ile bakar; plan başka bir JS alanından gelebilir).
  const gorulen = new Set(), sirala = {};
  for (const p of DHYS_PARCALARI) {
    const sayfalar = plan[p.anahtar];
    if (!Array.isArray(sayfalar) || !sayfalar.length) throw new Error(`DHYS parçası boş: ${p.baslik}.`);
    for (const i of sayfalar) {
      if (!Number.isInteger(i) || i < 0 || i >= toplam || gorulen.has(i)) throw new Error('DHYS parça planında geçersiz sayfa.');
      gorulen.add(i);
    }
    sirala[p.anahtar] = Array.from(sayfalar);
  }
  if (gorulen.size !== toplam) throw new Error('DHYS parçaları paketin bütün sayfalarını kapsamıyor.');
  const sonuc = [];
  for (const p of DHYS_PARCALARI) {
    const belge = await PDFDocument.create();
    for (const sayfa of await belge.copyPages(kaynak, sirala[p.anahtar])) belge.addPage(sayfa);
    belge.setTitle(`${p.baslik} — ${ref}`.replace(/ — $/, ''));
    belge.setCreator('Marche-en-Famenne Ulu Camii — yönetim paneli');
    sonuc.push({ ...p, sayfa: sirala[p.anahtar].length, bytes: await belge.save({ useObjectStreams: false, objectsPerTick: Infinity }) });
  }
  return sonuc;
}

export async function ihtidaPaketiUret(g) {
  const { PDFDocument, rgb } = g.pdfLib;
  for (const [ad, bytes] of [['Kalem yazı tipi (Allura)', g.kalemFontBytes], ['EK-9 şablonu', g.sablonBytes], ['EK-10 şablonu', g.ek10SablonBytes], ['Dilekçe şablonu', g.dilekceSablonBytes]]) {
    if (!bytes) throw new Error(ad + ' eksik; paket hazırlanamadı.');
  }
  if (g.veri?.teslimat?.yontem === 'adres' && !g.dilekceAdresSablonBytes) throw new Error('Adrese teslim dilekçe şablonu eksik; paket hazırlanamadı.');
  const hamCami = g.cami || g.veri?.cami;
  const cami = camiCoz(hamCami);
  if (!cami) throw new Error('Başvuru camisi eksik veya geçersiz.');
  const ham = g.veri || {};
  // Formda ad soyad serbest yazılır; resmî belgelerde «Ad SOYAD» biçimi tek yerden kurulur.
  const v = { ...ham, cami, adSoyad: adBicimleri(ham.adSoyad).yazili[0] };
  const digerCami = cami.id !== 'ulucamii-marche';
  if (digerCami) {
    const sahitler = Array.isArray(g.sahitler) ? g.sahitler : [];
    const adlar = sahitler.slice(0, 2).map((s) => String(s?.ad || '').trim());
    if (adlar.length !== 2 || !adlar[0] || !adlar[1]) throw new Error('Seçilen cami için iki şahidin adı zorunludur.');
    if (adlar[0].localeCompare(adlar[1], 'tr', { sensitivity: 'accent' }) === 0) throw new Error('Seçilen cami için iki farklı şahit yazın.');
  }
  for (const [ad, deger] of [['Ad soyad', v.adSoyad], ['Adres', v.adres], ['İhtida tarihi', g.onBasvuru ? 'teyit bekliyor' : v.ihtidaTarihi], ['Beyan tarihi', v.beyanTarihi]]) {
    if (!String(deger || '').trim()) throw new Error(ad + ' eksik; paketi hazırlamadan önce tamamlayın.');
  }
  if (!g.foto) throw new Error('Vesikalık fotoğraf eksik.');
  if (g.okunamayanGorseller?.length) throw new Error('Başvurunun bazı görselleri okunamadı; eksik eklerle paket hazırlanamaz.');
  const imzali = Boolean(g.basvuranImza || g.basvuranImzaVektor);
  if (imzali && g.ek10Onayi !== true) throw new Error('EK-10 rızası doğrulanmadan imzalı paket hazırlanamaz.');
  // Başvuran hangi EK-10 metnine onay verdiyse o üretilir. 9 Eylül 2026'dan beri imza ancak açık izinle aktarılır.
  const surum = [EKIM_SURUMU, YENI_SURUM].includes(g.ek10Surumu) ? g.ek10Surumu : 'v1';
  const izinli = surum !== 'v1';
  if (izinli && typeof g.imzaAktarimIzni !== 'boolean') throw new Error('EK-10 imza aktarımı izni eksik.');
  if (izinli && imzali && g.imzaAktarimIzni !== true) throw new Error('EK-10 imza aktarımı izni olmadan imzalı paket hazırlanamaz.');
  if (izinli && !imzali && g.imzasiz === true && g.imzaAktarimIzni !== false) throw new Error('İmzasız EK-10 için imza aktarımı izni hayır olmalıdır.');
  if (!imzali && g.imzasiz !== true) throw new Error('Başvuranın imzası yok; imza için gönderilecek nüshayı seçin.');
  const aktarim = izinli ? g.imzaAktarimIzni === true : imzali;   // v1 kayıtları: eski rıza metni, eski davranış
  if (!g.kimlikPdfBytes) {
    if (!['kimlik', 'pasaport'].includes(g.belgeTuru)) throw new Error('Kimlik belgesi türünü seçin.');
    if (!g.kimlikOn || (g.belgeTuru === 'kimlik' && !g.kimlikArka)) throw new Error('Kimlik belgesinin gerekli yüzleri eksik.');
    if (g.belgeTuru === 'pasaport' && g.kimlikArka) throw new Error('Pasaport seçilmiş ancak arka yüz de var; kimlik türünü kontrol edin.');
  }
  const eslesme = String(v.beyanTarihi).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!eslesme) throw new Error('Beyan tarihi gün/ay/yıl biçiminde olmalı.');
  const tarih = new Date(Number(eslesme[3]), Number(eslesme[2]) - 1, Number(eslesme[1]), 12);
  if (tarih.getDate() !== Number(eslesme[1]) || tarih.getMonth() + 1 !== Number(eslesme[2])) throw new Error('Beyan tarihi geçersiz.');

  const imza = { basvuranImza: g.basvuranImza || '', basvuranImzaVektor: g.basvuranImzaVektor || '' };
  const uyarilar = [], uzunAlanlar = [];
  const ek9 = await ek9Uret({
    ...g, ...imza, veri: v, cami: v.cami, tarih, alanYazisi: 'kalem',
    uzunAlan: (ad, deger) => uzunAlanlar.push([ad, deger]), uyar: kod => { uyarilar.push(kod); g.uyar?.(kod); },
  });
  if (uyarilar.includes('vesikalik-gomulemedi')) throw new Error('Vesikalık fotoğraf okunamadı. JPEG veya PNG yükleyin.');
  if (uyarilar.includes('alan-kisaltildi') || uyarilar.includes('yazi-kucuk')) throw new Error('Bazı bilgiler EK-9 alanına okunur biçimde sığmıyor. Bilgileri kontrol ederek ayrı EK-9 oluşturun.');

  // Dilekçe, töreni ve tarihini beyan eder: ön başvuruda ihtida tarihi ve yer-tarih boş kalır (tören henüz bilinmiyor);
  // son nüshada yer ve tarih törenin yeri ve günüdür (Koordinatörlük emsali).
  // İMZA (Rıdvan'ın 23 Eki 2026 kararı: «bundan sonra tek bir imza hem belgeye hem dilekçeye hem de açık rıza
  // metninin olduğu ek belgeye otomatik basılsın»): başvuran ekranda imza attıysa ve izin verdiyse (izin, imzalı
  // gönderimde zorunludur) AYNI imza ön başvuruda da, son nüshada da EK-9'a, dilekçeye ve EK-10'a basılır.
  // İmzasız başvuruda (elle imza) üçü de boş kalır.
  const sonNusha = !g.onBasvuru && Boolean(String(v.ihtidaTarihi || '').trim());
  const dilekce = await dilekceFormUret({
    pdfLib: g.pdfLib, fontkit: g.fontkit, fontBytes: g.fontBytes, kalemFontBytes: g.kalemFontBytes, sablonBytes: g.dilekceSablonBytes,
    sablonAdresBytes: g.dilekceAdresSablonBytes,
    // v.dilekce: başvuranın kendi beyanı (son nüsha ekranındaki EK-9 düzeltmeleri dilekçeye girmez).
    veri: { ...v, ...(v.dilekce || {}), ihtidaTarihi: sonNusha ? v.ihtidaTarihi : '' },
    yerTarih: sonNusha ? `${cami.sehir || 'Marche-en-Famenne'}, ${v.ihtidaTarihi}` : '',
    imza: aktarim ? imza.basvuranImza : '', imzaVektor: aktarim ? imza.basvuranImzaVektor : '',
    imzaAktarimIzni: aktarim,
  });
  const ek10 = await ek10Uret({
    pdfLib: g.pdfLib, fontkit: g.fontkit, fontBytes: g.fontBytes, fontKalinBytes: g.fontKalinBytes, kalemFontBytes: g.kalemFontBytes,
    sablonBytes: g.ek10SablonBytes, surum, ref: v.ref,
    adSoyad: v.adSoyad, tarih: v.beyanTarihi, imza: imza.basvuranImza, imzaVektor: imza.basvuranImzaVektor, onay: g.ek10Onayi === true,
    imzaAktarimIzni: izinli ? g.imzaAktarimIzni : undefined,
  });

  const paket = await PDFDocument.create();
  paket.registerFontkit(g.fontkit);
  const ekle = async bytes => {
    const belge = await PDFDocument.load(bytes, { parseSpeed: Infinity });
    if (!belge.getPageCount()) throw new Error('PDF eki boş; paket hazırlanamadı.');
    const sayfalar = await paket.copyPages(belge, belge.getPageIndices());
    for (const sayfa of sayfalar) paket.addPage(sayfa);
    return sayfalar.length;
  };
  const ek9Sayfa = await ekle(ek9);
  const dilekceSayfa = await ekle(dilekce);
  await ekle(ek10);
  const kimlikBas = paket.getPageCount();
  if (g.kimlikPdfBytes) await ekle(g.kimlikPdfBytes);
  else {
    await kimlikSayfasiEkle(g.pdfLib, paket, {
      dil: v.dil, belgeTuru: g.belgeTuru, kimlikOn: g.kimlikOn, kimlikArka: g.kimlikArka,
      adSoyad: v.adSoyad, dogumTarihi: v.dogumTarihi, fontBytes: g.fontBytes, fontKalinBytes: g.fontKalinBytes,
    });
  }
  const ekBas = paket.getPageCount();
  // Formdaki uzun açıklamalar kesilmez; aynı PDF'nin açıklama ekinde tam olarak korunur.
  if (uzunAlanlar.length) {
    const font = await paket.embedFont(g.fontBytes, { subset: true });
    const basliklar = { oncekiDin: 'Önceki din / Previous religion', ihtidaSebebi: 'İhtida sebebi / Reason for conversion', ihtidaSebebiTr: 'İhtida sebebi (Türkçesi) / Reason for conversion (Turkish)', ihtidaTarihi: 'İhtida tarihi', eposta: 'E-posta / Email', telefon: 'Telefon / Phone', adres: 'Adres / Address' };
    let sayfa, y;
    const yeniSayfa = () => {
      sayfa = paket.addPage([595.28, 841.89]); y = 790;
      sayfa.drawText('EK-9 açıklama eki / Supplement', { x: 48, y, size: 13, font }); y -= 25;
    };
    const satirYaz = (text, size = 10) => {
      const bas = line => {
        if (y < 55) yeniSayfa();
        sayfa.drawText(line, { x: 48, y, size, font }); y -= 16;
      };
      for (const paragraf of String(text).split(/\r?\n/)) {
        let line = '';
        for (let kelime of paragraf.trim().split(/\s+/)) {
          if (font.widthOfTextAtSize(kelime, size) > 499) {
            if (line) { bas(line); line = ''; }
            let parca = '';
            for (const harf of kelime) {
              if (font.widthOfTextAtSize(parca + harf, size) > 499) { bas(parca); parca = ''; }
              parca += harf;
            }
            kelime = parca;
          }
          const aday = line ? line + ' ' + kelime : kelime;
          if (font.widthOfTextAtSize(aday, size) <= 499) line = aday;
          else { bas(line); line = kelime; }
        }
        if (line) bas(line);
        y -= 4;
      }
    };
    yeniSayfa(); satirYaz(v.adSoyad); satirYaz(`${v.ref || ''} — ${v.beyanTarihi}`);
    for (const [ad, deger] of uzunAlanlar) { y -= 10; satirYaz(basliklar[ad] || ad, 11); satirYaz(deger); }
  }
  // DHYS parça planı (yalnız sayfa sıra numaraları; kişisel veri yok): açıklama eki EK-9'un devamıdır.
  if (g.parcaPlani) {
    const ilk = ek9Sayfa + dilekceSayfa;
    Object.assign(g.parcaPlani, {
      ek9: aralik(0, ek9Sayfa).concat(aralik(ekBas, paket.getPageCount())), dilekce: aralik(ek9Sayfa, ilk),
      ek10: aralik(ilk, kimlikBas), kimlik: aralik(kimlikBas, ekBas), toplam: paket.getPageCount(),
    });
  }
  if (g.onBasvuru) {
    // Ön başvuru damgası EK-9 ile dilekçede; EK-10 rızası formda verildiği için geçerlidir.
    const font = await paket.embedFont(g.fontBytes, { subset: true });
    for (const sayfa of paket.getPages().slice(0, ek9Sayfa + dilekceSayfa)) {
      const metin = 'ÖN BAŞVURU / PRÉ-DEMANDE / PRE-APPLICATION — Tören ve yetkili onayı bekleniyor';
      sayfa.drawText(metin, { x: (sayfa.getWidth() - font.widthOfTextAtSize(metin, 8)) / 2, y: 10, size: 8, font, color: rgb(.25, .25, .25) });
    }
  }
  paket.setTitle(`İhtida belge paketi — ${v.ref || ''}`.trim());
  paket.setSubject('EK-9, ihtida belgesi talep dilekçesi, EK-10 açık rıza metni ve kimlik belgesi fotokopisi');
  paket.setCreator('Marche-en-Famenne Ulu Camii — yönetim paneli');
  return paket.save({ useObjectStreams: false, objectsPerTick: Infinity });
}
