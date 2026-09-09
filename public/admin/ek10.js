/** EK-10: mevcut iki sayfalık TR/EN + FR/NL metin korunur; yalnız boş alanlar doldurulur. */
export async function ek10Uret(g) {
  if (g.imza && g.onay !== true) throw new Error('EK-10 rızası kayıtta doğrulanmadan imza eklenemez.');
  const { PDFDocument, rgb } = g.pdfLib;
  const belge = await PDFDocument.load(g.sablonBytes, { parseSpeed: Infinity });
  if (belge.getPageCount() !== 2) throw new Error('EK-10 şablonu iki sayfa olmalıdır.');
  belge.registerFontkit(g.fontkit);
  const font = await belge.embedFont(g.fontBytes, { subset: true });
  let imza = null;
  if (g.imza) {
    try { imza = await belge.embedPng(g.imza); }
    catch { throw new Error('Başvuranın imzası okunamadı; EK-10 imzalı olarak üretilemedi.'); }
  }
  const yaz = (s, metin, ust) => {
    const m = String(metin || '').trim();
    if (!m) return;
    const boyut = Math.min(10, 143 / Math.max(1, font.widthOfTextAtSize(m, 1)));
    if (boyut < 6) throw new Error('Ad soyad EK-10 alanına okunur biçimde sığmıyor; belgeyi elle tamamlayın.');
    s.drawRectangle({ x: 402, y: s.getHeight() - ust - 3, width: 149, height: 16, color: rgb(1, 1, 1) });
    s.drawText(m, { x: 405, y: s.getHeight() - ust, size: boyut, font, color: rgb(.08, .08, .08) });
  };
  for (const sayfa of belge.getPages()) {
    yaz(sayfa, g.adSoyad, 706.2);
    yaz(sayfa, g.tarih || '', 681.3);
    if (imza) {
      const oran = Math.min(140 / imza.width, 29 / imza.height);
      sayfa.drawRectangle({ x: 402, y: sayfa.getHeight() - 745, width: 149, height: 31, color: rgb(1, 1, 1) });
      sayfa.drawImage(imza, { x: 405 + (140 - imza.width * oran) / 2, y: sayfa.getHeight() - 743, width: imza.width * oran, height: imza.height * oran });
    }
  }
  belge.setTitle(`EK-10 Açık Rıza — ${g.adSoyad || ''}`);
  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}
