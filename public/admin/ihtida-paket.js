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
  if (g.kimlikPdfBytes) await ekle(g.kimlikPdfBytes);
  else {
    await kimlikSayfasiEkle(g.pdfLib, paket, {
      dil: v.dil, belgeTuru: g.belgeTuru, kimlikOn: g.kimlikOn, kimlikArka: g.kimlikArka,
      adSoyad: v.adSoyad, dogumTarihi: v.dogumTarihi, fontBytes: g.fontBytes, fontKalinBytes: g.fontKalinBytes,
    });
  }
  // Formdaki uzun açıklamalar kesilmez; aynı PDF'nin açıklama ekinde tam olarak korunur.
  if (uzunAlanlar.length) {
    const font = await paket.embedFont(g.fontBytes, { subset: true });
    const basliklar = { oncekiDin: 'Önceki din / Previous religion', ihtidaSebebi: 'İhtida sebebi / Reason for conversion', ihtidaTarihi: 'İhtida tarihi', eposta: 'E-posta / Email', telefon: 'Telefon / Phone', adres: 'Adres / Address' };
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
