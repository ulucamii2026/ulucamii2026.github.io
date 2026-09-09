/** Başvuru verilerinden tek dosya: EK-9, EK-10, dilekçe, kimlik örneği.
 * Panel ve Apps Script aynı üreticiyi kullanır; şablonlar dağıtımda birlikte paketlenir.
 * Şahit teyitleri ve gerçek ihtida tarihi belge hazırlama ekranından gelir.
 */
import { ek9Uret } from './ek9.js';
import { ek10Uret } from './ek10.js';
import { dilekceUret } from './dilekce.js';

export async function ihtidaPaketiUret(g) {
  const { PDFDocument, rgb } = g.pdfLib;
  const v = g.veri || {};
  for (const [ad, deger] of [['Ad soyad', v.adSoyad], ['Adres', v.adres], ['İhtida tarihi', g.onBasvuru ? 'teyit bekliyor' : v.ihtidaTarihi], ['Beyan tarihi', v.beyanTarihi]]) {
    if (!String(deger || '').trim()) throw new Error(ad + ' eksik; paketi hazırlamadan önce tamamlayın.');
  }
  if (!g.foto) throw new Error('Vesikalık fotoğraf eksik.');
  if (g.okunamayanGorseller?.length) throw new Error('Başvurunun bazı görselleri okunamadı; eksik eklerle paket hazırlanamaz.');
  if (g.basvuranImza && g.ek10Onayi !== true) throw new Error('EK-10 rızası doğrulanmadan imzalı paket hazırlanamaz.');
  if (!g.basvuranImza && g.imzasiz !== true) throw new Error('Başvuranın imzası yok; imza için gönderilecek nüshayı seçin.');
  if (!g.kimlikPdfBytes) {
    if (!['kimlik', 'pasaport'].includes(g.belgeTuru)) throw new Error('Kimlik belgesi türünü seçin.');
    if (!g.kimlikOn || (g.belgeTuru === 'kimlik' && !g.kimlikArka)) throw new Error('Kimlik belgesinin gerekli yüzleri eksik.');
    if (g.belgeTuru === 'pasaport' && g.kimlikArka) throw new Error('Pasaport seçilmiş ancak arka yüz de var; kimlik türünü kontrol edin.');
  }
  const eslesme = String(v.beyanTarihi).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!eslesme) throw new Error('Beyan tarihi gün/ay/yıl biçiminde olmalı.');
  const tarih = new Date(Number(eslesme[3]), Number(eslesme[2]) - 1, Number(eslesme[1]), 12);
  if (tarih.getDate() !== Number(eslesme[1]) || tarih.getMonth() + 1 !== Number(eslesme[2])) throw new Error('Beyan tarihi geçersiz.');

  const uyarilar = [], uzunAlanlar = [];
  const ek9 = await ek9Uret({ ...g, uzunAlan: (ad, deger) => uzunAlanlar.push([ad, deger]), uyar: kod => { uyarilar.push(kod); g.uyar?.(kod); } });
  if (uyarilar.includes('vesikalik-gomulemedi')) throw new Error('Vesikalık fotoğraf okunamadı. JPEG veya PNG yükleyin.');
  if (uyarilar.includes('alan-kisaltildi') || uyarilar.includes('yazi-kucuk')) throw new Error('Bazı bilgiler EK-9 alanına okunur biçimde sığmıyor. Bilgileri kontrol ederek ayrı EK-9 oluşturun.');
  const ek10 = await ek10Uret({
    pdfLib: g.pdfLib, fontkit: g.fontkit, fontBytes: g.fontBytes, sablonBytes: g.ek10SablonBytes,
    adSoyad: v.adSoyad, tarih: v.beyanTarihi, imza: g.basvuranImza || '', onay: g.ek10Onayi === true,
  });
  const dilekce = await dilekceUret({ ...g, veri: v, imza: g.basvuranImza || '', tarih });
  const paket = await PDFDocument.create();
  paket.registerFontkit(g.fontkit);
  const ekle = async bytes => {
    const belge = await PDFDocument.load(bytes, { parseSpeed: Infinity });
    if (!belge.getPageCount()) throw new Error('PDF eki boş; paket hazırlanamadı.');
    const sayfalar = await paket.copyPages(belge, belge.getPageIndices());
    for (const sayfa of sayfalar) paket.addPage(sayfa);
  };
  await ekle(ek9); await ekle(ek10); await ekle(dilekce);
  if (g.kimlikPdfBytes) {
    await ekle(g.kimlikPdfBytes);
  } else {
    const font = await paket.embedFont(g.fontBytes, { subset: true });
    const sayfa = paket.addPage([595.28, 841.89]);
    sayfa.drawText('Kimlik belgesi örneği / Copie du document d’identité', { x: 48, y: 793, font, size: 12, color: rgb(.09, .09, .12) });
    const ekler = g.belgeTuru === 'kimlik'
      ? [['Ön yüz / Recto', g.kimlikOn], ['Arka yüz / Verso', g.kimlikArka]]
      : [['Pasaport bilgi sayfası / Page d’identité du passeport', g.kimlikOn]];
    for (const [i, [etiket, veri]] of ekler.entries()) {
      let resim;
      try { resim = await paket.embedPng(veri); }
      catch {
        try { resim = await paket.embedJpg(veri); }
        catch { throw new Error(etiket + ' okunamadı. JPEG veya PNG yükleyin.'); }
      }
      const ust = 737 - i * 345, h = ekler.length === 1 ? 600 : 295;
      sayfa.drawText(etiket, { x: 48, y: ust + 15, font, size: 10, color: rgb(.25, .25, .25) });
      const oran = Math.min(499 / resim.width, h / resim.height);
      sayfa.drawImage(resim, { x: 48 + (499 - resim.width * oran) / 2, y: ust - h + (h - resim.height * oran) / 2, width: resim.width * oran, height: resim.height * oran });
    }
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
    const font = await paket.embedFont(g.fontBytes, { subset: true });
    for (const sayfa of paket.getPages().slice(0, 2)) {
      sayfa.drawText('ÖN BAŞVURU / PRÉ-DEMANDE / PRE-APPLICATION — Tören ve yetkili onayı bekleniyor', { x: 90, y: 10, size: 8, font, color: rgb(.25, .25, .25) });
    }
  }
  paket.setTitle(`İhtida belge paketi — ${v.ref || ''}`.trim());
  paket.setSubject('EK-9, EK-10, ihtida belgesi talep dilekçesi ve kimlik belgesi örneği');
  paket.setCreator('Marche-en-Famenne Ulu Camii — yönetim paneli');
  return paket.save({ useObjectStreams: false, objectsPerTick: Infinity });
}
