/** Cami içi kayıt defteri. Aynı veri modeliyle GAS ve yerelde PDF/DOCX üretir. */
import { WORD_PARCA } from './ihtida-defteri-word-sablon.js';
import { AY_YILDIZ_YOL } from './ay-yildiz.js';

export const DURUMLAR = { bekliyor: 'Başvuru / teyit bekliyor', tamamlandi: 'Merasim tamamlandı', musavirlikte: 'Müşavirliğe gönderildi', 'teslim-edildi': 'Belge teslim edildi', iptal: 'İptal edildi' };
const KAYNAK = 'Diyanet İşleri Başkanlığı, Din Hizmetleri Uygulama Genelgesi, madde 44';
const ACIKLAMA = 'Bu defter Ulu Camii’nin özel işlem ve teslim takibi içindir. Resmî DHYS kaydı, EK-9, EK-10 ve Müşavirlik işlemlerinin yerine geçmez. Başvuru tarihi veya tercih edilen tören tarihi, merasimin yapıldığının kanıtı sayılmaz.';
const TEMIZ = v => String(v ?? '').normalize('NFC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
export function tarihYaz(v) { return TEMIZ(v).replace(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/, '$3.$2.$1'); }
const deger = v => TEMIZ(v) || '—';
const KAYNAK_URL = 'https://hukukmusavirligi.diyanet.gov.tr/Documents/DinHizmetleriUygulamaGenelgesi.pdf';
function kartAlanlari(k = {}) {
  return [
    ['Adı soyadı', k.adSoyad], ['Yeni isim tercihi', k.yeniIsim], ['Başvuru referansı / tarihi', [k.ref, tarihYaz(k.basvuruTarihi)].filter(Boolean).join(' / ')],
    ['Doğrulanan ihtida tarihi', tarihYaz(k.ihtidaTarihi)], ['İlgili cami', k.camiAdi ? k.camiAdi + ' · ' + (k.camiSehir || '') : ''], ['İşlem durumu', DURUMLAR[k.durum] || ''],
    ['Birinci şahit', k.sahit1], ['İkinci şahit', k.sahit2], ['EK-9 / DHYS numarası', [k.ek9No, k.dhysNo].filter(Boolean).join(' / ')],
    ['Müşavirliğe gönderim tarihi', tarihYaz(k.musavirlikGonderimTarihi)], ['Müşavirlikten dönüş tarihi', tarihYaz(k.musavirlikDonusTarihi)], ['Belgenin teslim tarihi', tarihYaz(k.teslimTarihi)],
    ['Teslim yöntemi', ({ cami: 'Cami üzerinden teslim', adres: 'Adrese posta', elden: 'Elden teslim', posta: 'Posta' })[k.teslimYontemi] || ''], ['Posta takip numarası', k.postaTakipNo], ['Cami içi defter numarası', k.defterNo],
  ];
}
function sirala(model) {
  return [...(model.kayitlar || [])].sort((a, b) => {
    const ga = a.defterNo ? 0 : a.durum === 'iptal' ? 2 : 1, gb = b.defterNo ? 0 : b.durum === 'iptal' ? 2 : 1;
    return ga - gb || TEMIZ(a.defterNo || a.ref).localeCompare(TEMIZ(b.defterNo || b.ref), 'tr');
  });
}
function alanlar(k) {
  return [
    ['Kayıt durumu', DURUMLAR[k.durum] || deger(k.durum)],
    ['Cami içi defter no', k.defterNo || 'Henüz verilmedi'],
    ['Başvuru referansı', k.ref],
    ['Başvuru tarihi', tarihYaz(k.basvuruTarihi)],
    ['Adı soyadı', k.adSoyad],
    ['Tercih ettiği yeni isim', k.yeniIsim || 'Bildirilmedi'],
    ['İlgili cami', [k.camiAdi || 'Ulu Camii', k.camiSehir || 'Marche-en-Famenne'].filter(Boolean).join(' · ')],
    ['Doğrulanan merasim tarihi', k.ihtidaTarihi ? tarihYaz(k.ihtidaTarihi) : 'Henüz doğrulanmadı'],
    ['Birinci şahit', k.sahit1 || 'Henüz teyit edilmedi'],
    ['İkinci şahit', k.sahit2 || 'Henüz teyit edilmedi'],
    ['EK-9 belge numarası', k.ek9No],
    ['DHYS / resmî kayıt no', k.dhysNo],
    ['Müşavirliğe gönderim', tarihYaz(k.musavirlikGonderimTarihi)],
    ['Müşavirlikten dönüş', tarihYaz(k.musavirlikDonusTarihi)],
    ['Belgenin teslim tarihi', tarihYaz(k.teslimTarihi)],
    ['Teslim yöntemi', ({ elden: 'Elden teslim', posta: 'Posta', cami: 'Cami üzerinden teslim', adres: 'Başvuranın adresine posta' })[k.teslimYontemi] || k.teslimYontemi],
    ['Posta takip numarası', k.postaTakipNo],
    ['Arşiv', k.arsivPdfId ? 'PDF paketi yönetim panelindeki başvuru dosyasındadır.' : 'Başvuru dosyası yönetim panelinden takip edilir.'],
  ];
}

export async function pdfUret(model, kaynaklar, pdfLib, fontkit) {
  const { PDFDocument, rgb } = pdfLib;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  // GAS akış/timer sağlamaz; tam font gömmek aynı metriklerle her iki ortamda çalışır.
  const font = await doc.embedFont(kaynaklar.fontBytes, { subset: false });
  const bold = await doc.embedFont(kaynaklar.fontKalinBytes || kaynaklar.fontBytes, { subset: false });
  const C = { ink: rgb(.18, .12, .13), muted: rgb(.38, .29, .30), bordo: rgb(.663, .11, .165), light: rgb(.985, .965, .965), rule: rgb(.76, .61, .63), white: rgb(1, 1, 1) };
  const W = 841.89, H = 595.28, M = 32, CW = W - M * 2, ALT = 552;
  let page, y;
  const text = (s, x, top, size = 10, f = font, color = C.ink) => page.drawText(TEMIZ(s), { x, y: H - top - size, size, font: f, color });
  const line = (x, top, w, color = C.rule) => page.drawLine({ start: { x, y: H - top }, end: { x: x + w, y: H - top }, color, thickness: .6 });
  function wrap(s, width, size = 10, f = font) {
    const lines = [];
    for (const paragraph of deger(s).split(/\r?\n/)) {
      let current = '';
      for (const word of paragraph.split(/\s+/)) {
        if (f.widthOfTextAtSize(current ? current + ' ' + word : word, size) <= width) { current += (current ? ' ' : '') + word; continue; }
        if (current) { lines.push(current); current = ''; }
        for (const ch of word) { if (f.widthOfTextAtSize(current + ch, size) > width) { lines.push(current); current = ''; } current += ch; }
      }
      lines.push(current);
    }
    return lines;
  }
  function newPage(kicker = 'İHTİDA DEFTERİ') {
    page = doc.addPage([W, H]); y = 56;
    text('MARCHE-EN-FAMENNE ULU CAMİİ', M, 22, 10, bold, C.bordo);
    const sw = bold.widthOfTextAtSize(kicker, 8);
    text(kicker, W - M - sw, 23, 8, bold, C.muted); line(M, 44, CW, C.bordo);
  }
  function block(s, { size = 10, width = CW, f = font, color = C.ink, gap = 8 } = {}) {
    for (const l of wrap(s, width, size, f)) {
      if (y + size * 1.5 > ALT) newPage('DEVAM');
      text(l, M, y, size, f, color); y += size * 1.5;
    }
    y += gap;
  }
  function field(label, value) {
    const lns = wrap(deger(value), CW - 178, 9.7);
    const h = Math.max(29, lns.length * 14 + 12);
    if (y + h > ALT) newPage('KAYIT DEVAMI');
    text(label, M + 10, y + 7, 8.2, bold, C.muted);
    for (let i = 0; i < lns.length; i++) text(lns[i], M + 176, y + 5 + i * 14, 9.7);
    line(M, y + h, CW); y += h;
  }
  const rows = sirala(model), confirmed = rows.filter(k => k.defterNo), pending = rows.filter(k => !k.defterNo && k.durum !== 'iptal'), cancelled = rows.filter(k => !k.defterNo && k.durum === 'iptal');
  const sayfa = Math.max(50, Math.ceil(confirmed.length / 100) * 50);
  page = doc.addPage([W, H]);
  const center = (s, top, size, f = font, color = C.ink) => text(s, (W - f.widthOfTextAtSize(s, size)) / 2, top, size, f, color);
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: C.bordo, borderWidth: 1.4 });
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: C.bordo, borderWidth: .45 });
  const ayOlcek = 46 / 300;
  page.drawSvgPath(AY_YILDIZ_YOL, { x: W / 2 - 352 * ayOlcek, y: H - 63 + 300 * ayOlcek, scale: ayOlcek, color: C.bordo });
  center('BELÇİKA', 103, 9);
  center('MARCHE-EN-FAMENNE', 123, 19, bold);
  center('ULU CAMİİ', 148, 14);
  line(W / 2 - 176, 178, 160, C.bordo); line(W / 2 + 16, 178, 160, C.bordo);
  page.drawSvgPath('M0,-4 L4,0 L0,4 L-4,0 Z', { x: W / 2, y: H - 178, color: C.bordo });
  center('İHTİDA KAYIT DEFTERİ', 193, 28, bold, C.bordo);
  center('MÜŞAVİRLİK İŞLEMLERİ VE BELGE TESLİM TAKİBİ', 233, 8.5, font, C.muted);
  const coverRows = [['Defter / Cilt No', '................................'], ['Ait Olduğu Yıl', '20........ — 20........'], ['Matbu Kayıt Yeri Aralığı', '1 — ' + sayfa * 2], ['Kayıt Sayfası Adedi', sayfa + ' sayfa / sayfa başına 2 kayıt'], ['Kullanıma Açılış Tarihi', '........ / ........ / 20........']];
  coverRows.forEach(([l, v], i) => { const t = 266 + i * 20; text(l, 217, t, 9); text(v, 407, t, 9); line(210, t + 17, 422); });
  page.drawRectangle({ x: 46, y: H - 535, width: W - 92, height: 135, borderColor: C.rule, borderWidth: .6 });
  center('K U L L A N I M A   A Ç I L I Ş   /   K O N T R O L', 411, 9, bold, C.bordo);
  center('Bu defter, sayfaları numaralandırılmış ' + sayfa + ' kayıt sayfası ve ' + sayfa * 2 + ' kayıt yerinden oluşur.', 438, 9);
  center('İşbu defter, ........ / ........ / 20........ tarihinde kullanıma açılmıştır.', 454, 9);
  line(66, 490, 230); line(W - 296, 490, 230);
  text('Düzenleyen', 146, 499, 9); text('Kontrol eden / Onaylayan', W - 260, 499, 9);
  text('Adı Soyadı / Unvanı / İmza', 120, 514, 8, font, C.muted); text('Adı Soyadı / Unvanı / İmza', W - 259, 514, 8, font, C.muted);
  newPage('KULLANIM VE ÖZET');
  block('Kullanım ve sayım özeti', { size: 20, f: bold, color: C.bordo });
  field('Numaralı kayıt', String(confirmed.length)); field('Bekleyen başvuru', String(pending.length)); field('İptal', String(rows.filter(k => k.durum === 'iptal').length));
  block(ACIKLAMA, { size: 9, gap: 9 });
  block('Web başvuruları bekleyenler ekinde tutulur. Yetkili, merasim tarihini doğrulayınca UC-YYYY-NNNN cami içi numarası verilir. Matbu yer numarası, cami içi defter numarası ve EK-9/DHYS numarası ayrı alanlardır. Boş kayıt yerleri elle yazmaya uygundur.', { size: 9 });
  block('Güncel PDF ve Word yönetim panelinden indirilir. İndirilen veya basılan nüsha, üretildiği andaki durumu gösterir. Word üzerinde yapılan değişiklikler sisteme kendiliğinden aktarılmaz; sonraki kayıt ve düzeltmeleri yönetim panelinde yapın.', { size: 9 });
  block('Doğrulanmış merasim, Müşavirliğe gönderim, imzalı belgenin dönüşü ve kişiye teslim aşamaları birbirinden ayrı takip edilir. Defterde imza görseli ve kimlik numarası saklanmaz. Basılı nüshanın kullanıma açılış ve kontrol imzaları elle tamamlanır.', { size: 9 });
  block('Birincil kaynak: ' + KAYNAK, { size: 8, color: C.muted });
  block(KAYNAK_URL, { size: 7.4, color: C.muted });
  const notEkleri = [];
  const kart = (k, sira, ust) => {
    const top = ust ? 66 : 310, h = 224, no = k?.defterNo || '';
    page.drawRectangle({ x: M, y: H - top - h, width: CW, height: h, borderColor: C.bordo, borderWidth: .7 });
    page.drawRectangle({ x: M, y: H - top - h, width: 38, height: h, color: C.light, borderColor: C.bordo, borderWidth: .7 });
    text(String(sira), M + 13, top + 15, 11, bold, C.bordo);
    const veri = kartAlanlari(k), cell = (CW - 48) / 3;
    for (let i = 0; i < veri.length; i++) {
      const xx = M + 46 + i % 3 * cell, yy = top + 8 + Math.floor(i / 3) * 33;
      text(veri[i][0], xx, yy, 6.9, bold, C.muted);
      let size = 8.8, lns = veri[i][1] ? wrap(veri[i][1], cell - 15, size) : [];
      while (lns.length * (size + .7) > 22 && size > 7.1) { size -= .3; lns = wrap(veri[i][1], cell - 15, size); }
      if (lns.length * (size + .7) > 22) { notEkleri.push({ ref: k?.ref || no || String(sira), label: veri[i][0], value: veri[i][1] }); lns = ['Ayrıntı kayıt ekindedir.']; }
      lns.forEach((l, j) => text(l, xx, yy + 8 + j * (size + .7), size)); line(xx, yy + 31, cell - 12);
    }
    let note = k?.not || '', nlines = note ? wrap(note, CW - 90, 8) : [];
    if (nlines.length > 2) { notEkleri.push({ ref: k.ref, label: 'İşlem notu', value: note }); nlines = ['Uzun işlem notu, kayıt ekinde eksiksiz verilmiştir.']; }
    text('Not:', M + 49, top + 177, 7.1, bold, C.muted);
    nlines.forEach((l, i) => text(l, M + 76, top + 176 + i * 10, 8));
    if (!nlines.length) { line(M + 76, top + 186, CW - 90); line(M + 76, top + 198, CW - 90); }
    text('Kaydı işleyen / İmza: ________________________________', M + 49, top + 207, 8, font, C.muted);
  };
  for (let i = 0; i < sayfa; i++) { newPage(`KAYIT SAYFASI ${i + 1}`); kart(confirmed[i * 2], i * 2 + 1, true); kart(confirmed[i * 2 + 1], i * 2 + 2, false); }
  if (pending.length) for (let i = 0; i < Math.ceil(pending.length / 2); i++) { newPage('EK · BEKLEYEN BAŞVURULAR'); kart(pending[i * 2], i * 2 + 1, true); kart(pending[i * 2 + 1], i * 2 + 2, false); }
  if (cancelled.length) for (let i = 0; i < Math.ceil(cancelled.length / 2); i++) { newPage('EK · İPTAL EDİLEN BAŞVURULAR'); kart(cancelled[i * 2], i * 2 + 1, true); kart(cancelled[i * 2 + 1], i * 2 + 2, false); }
  if (notEkleri.length) { newPage('EK · KAYIT AYRINTILARI'); for (const n of notEkleri) { block(n.ref + ' / ' + n.label, { size: 10, f: bold, color: C.bordo }); block(n.value, { size: 10, gap: 18 }); } }
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    page = p; line(M, 555, CW); text('ÖZEL · YALNIZ YETKİLİ CAMİ GÖREVLİLERİ', M, 563, 7.3, font, C.muted);
    const s = (i + 1) + ' / ' + pages.length; text(s, W - M - font.widthOfTextAtSize(s, 8), 562, 8, font, C.muted);
  });
  doc.setTitle('Ulu Camii - İhtida Defteri'); doc.setAuthor('Marche-en-Famenne Ulu Camii');
  doc.setSubject('Özel cami içi kayıt, belge ve teslim takibi');
  return doc.save();
}

const xml = s => TEMIZ(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
function p(s, { size = 21, bold = false, before = 0, after = 120, color = '203F48', next = false, center = false, font = '' } = {}) {
  return '<w:p><w:pPr><w:spacing w:before="' + before + '" w:after="' + after + '"/>' + (center ? '<w:jc w:val="center"/>' : '') + (next ? '<w:keepNext/>' : '') + '</w:pPr><w:r><w:rPr><w:sz w:val="' + size + '"/><w:color w:val="' + color + '"/>' + (font ? '<w:rFonts w:ascii="' + xml(font) + '" w:hAnsi="' + xml(font) + '"/>' : '') + (bold ? '<w:b/>' : '') + '</w:rPr><w:t xml:space="preserve">' + xml(s) + '</w:t></w:r></w:p>';
}
const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
function table(rows) {
  return '<w:tbl><w:tblPr><w:tblW w:w="9706" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:bottom w:val="single" w:sz="4" w:color="D1D8D6"/><w:insideH w:val="single" w:sz="4" w:color="D1D8D6"/></w:tblBorders><w:tblCellMar><w:top w:w="85" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="85" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="3300"/><w:gridCol w:w="6406"/></w:tblGrid>' + rows.map(([label, value]) => '<w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="3300" w:type="dxa"/><w:shd w:val="clear" w:fill="F0F3F1"/></w:tcPr>' + p(label, { size: 17, bold: true, after: 0 }) + '</w:tc><w:tc><w:tcPr><w:tcW w:w="6406" w:type="dxa"/></w:tcPr>' + deger(value).split(/\r?\n/).map(v => p(v, { size: 19, after: 0 })).join('') + '</w:tc></w:tr>').join('') + '</w:tbl><w:p/>';
}
/** UTF-8 ve sıkıştırmasız ZIP: Word iskeletini GAS'ta ağ/Node bağımlılığı olmadan doldurur. */
function utf8(str) {
  const out = [];
  for (const ch of str) { const c = ch.codePointAt(0); if (c < 128) out.push(c); else if (c < 2048) out.push(192 | c >> 6, 128 | c & 63); else if (c < 65536) out.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63); else out.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63); }
  return Uint8Array.from(out);
}
function zip(parts) {
  const chunks = [], central = []; let offset = 0;
  const put = (arr, n, bytes) => { for (let i = 0; i < bytes; i++) arr.push(n >>> (8 * i) & 255); };
  for (const [name, content] of Object.entries(parts)) {
    const n = utf8(name), b = typeof content === 'string' ? utf8(content) : Uint8Array.from(content); let crc = -1;
    for (const v of b) { crc ^= v; for (let i = 0; i < 8; i++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0); } crc = (crc ^ -1) >>> 0;
    const head = []; put(head, 0x04034b50, 4); put(head, 20, 2); put(head, 0x800, 2); put(head, 0, 2); put(head, 0, 2); put(head, 0x5d29, 2); put(head, crc, 4); put(head, b.length, 4); put(head, b.length, 4); put(head, n.length, 2); put(head, 0, 2);
    chunks.push(Uint8Array.from(head), n, b);
    const c = []; put(c, 0x02014b50, 4); put(c, 20, 2); put(c, 20, 2); put(c, 0x800, 2); put(c, 0, 2); put(c, 0, 2); put(c, 0x5d29, 2); put(c, crc, 4); put(c, b.length, 4); put(c, b.length, 4); put(c, n.length, 2); put(c, 0, 2); put(c, 0, 2); put(c, 0, 2); put(c, 0, 2); put(c, 0, 4); put(c, offset, 4);
    central.push(Uint8Array.from(c), n); offset += head.length + n.length + b.length;
  }
  const length = central.reduce((s, b) => s + b.length, 0), end = [], count = Object.keys(parts).length;
  put(end, 0x06054b50, 4); put(end, 0, 2); put(end, 0, 2); put(end, count, 2); put(end, count, 2); put(end, length, 4); put(end, offset, 4); put(end, 0, 2);
  const all = [...chunks, ...central, Uint8Array.from(end)], result = new Uint8Array(offset + length + end.length); let at = 0;
  all.forEach(b => { result.set(b, at); at += b.length; }); return result;
}
export function docxUret(model) {
  if (!WORD_PARCA['word/document.xml'].includes('{{GOVDE}}')) throw new Error('Word şablonunda gövde işareti bulunamadı.');
  const rows = sirala(model), confirmed = rows.filter(k => k.defterNo), pending = rows.filter(k => !k.defterNo && k.durum !== 'iptal'), cancelled = rows.filter(k => !k.defterNo && k.durum === 'iptal');
  const count = Math.max(50, Math.ceil(confirmed.length / 100) * 50), ekler = [];
  const tiny = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="40" w:lineRule="exact"/></w:pPr></w:p>';
  const run = (s, size, bold = false) => '<w:r><w:rPr><w:sz w:val="' + size + '"/>' + (bold ? '<w:b/><w:color w:val="A91C2A"/>' : '') + '</w:rPr><w:t xml:space="preserve">' + xml(s) + '</w:t></w:r>';
  const cellP = (s, size, bold) => '<w:p><w:pPr><w:spacing w:before="0" w:after="15" w:line="205" w:lineRule="auto"/></w:pPr>' + run(s || ' ', size, bold) + '</w:p>';
  function card(k, number) {
    const fields = kartAlanlari(k);
    let out = p('KAYIT YERİ ' + number + (k?.ref ? '   /   ' + k.ref : ''), { size: 19, bold: true, color: 'A91C2A', before: 60, after: 50, next: true });
    out += '<w:tbl><w:tblPr><w:tblW w:w="15438" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>' + ['top','bottom','left','right','insideH','insideV'].map(x => '<w:' + x + ' w:val="single" w:sz="4" w:color="B88D94"/>').join('') + '</w:tblBorders><w:tblCellMar><w:top w:w="45" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="45" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="5146"/><w:gridCol w:w="5146"/><w:gridCol w:w="5146"/></w:tblGrid>';
    for (let row = 0; row < 5; row++) {
      out += '<w:tr><w:trPr><w:trHeight w:val="620" w:hRule="atLeast"/><w:cantSplit/></w:trPr>';
      for (let col = 0; col < 3; col++) {
        const [label,value] = fields[row * 3 + col];
        out += '<w:tc><w:tcPr><w:tcW w:w="5146" w:type="dxa"/></w:tcPr>' + cellP(label, 15, true) + cellP(value, 18, false) + '</w:tc>';
      }
      out += '</w:tr>';
    }
    let note = k?.not || '';
    if (note.length > 190) { ekler.push({ ref: k.ref, note }); note = 'Uzun işlem notu kayıt ekinde eksiksiz verilmiştir.'; }
    out += '<w:tr><w:trPr><w:trHeight w:val="560" w:hRule="atLeast"/><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="15438" w:type="dxa"/><w:gridSpan w:val="3"/></w:tcPr>' + cellP('İşlem notu', 15, true) + cellP(note || '................................................................................................................................................................................................................................................................................', 17, false) + '</w:tc></w:tr>';
    out += '<w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="15438" w:type="dxa"/><w:gridSpan w:val="3"/></w:tcPr>' + cellP('Kaydı işleyen / İmza: ........................................................................................', 17, false) + '</w:tc></w:tr></w:tbl>' + tiny;
    return out;
  }
  const cp = (s, options = {}) => p(s, { center: true, ...options });
  let body = cp('BELÇİKA', { size: 19, after: 120 }) + cp('MARCHE-EN-FAMENNE', { size: 38, bold: true, after: 100 }) + cp('ULU CAMİİ', { size: 28, after: 230 });
  body += cp('━━━━━━━━━━━━━━━━    ◆    ━━━━━━━━━━━━━━━━', { size: 17, color: 'A91C2A', after: 220 }) + cp('İHTİDA KAYIT DEFTERİ', { size: 56, bold: true, color: 'A91C2A', after: 210 }) + cp('MÜŞAVİRLİK İŞLEMLERİ VE BELGE TESLİM TAKİBİ', { size: 18, after: 240 });
  body += cp('Defter / Cilt No: .............................     Ait Olduğu Yıl: 20........ — 20........', { size: 21, after: 170 }) + cp('Matbu Kayıt Yeri: 1 — ' + count * 2 + '     ·     ' + count + ' kayıt sayfası / sayfa başına 2 kayıt', { size: 21, after: 170 }) + cp('Kullanıma Açılış Tarihi: ........ / ........ / 20........', { size: 21, after: 430 });
  body += cp('K U L L A N I M A   A Ç I L I Ş   /   K O N T R O L', { size: 20, bold: true, color: 'A91C2A', after: 220 }) + cp('Bu defter, sayfaları numaralandırılmış ' + count + ' kayıt sayfası ve ' + count * 2 + ' kayıt yerinden oluşur.', { size: 20, after: 100 }) + cp('İşbu defter, ........ / ........ / 20........ tarihinde kullanıma açılmıştır.', { size: 20, after: 450 }) + cp('Düzenleyen / İmza: __________________________                         Kontrol eden / Onaylayan: __________________________', { size: 20 });
  body += pageBreak + p('Kullanım ve sayım özeti', { size: 36, bold: true, color: 'A91C2A', after: 200 }) + table([['Numaralı kayıt', confirmed.length], ['Teyit bekleyen başvuru', pending.length], ['İptal kaydı', rows.filter(k => k.durum === 'iptal').length]]);
  body += p(ACIKLAMA, { size: 20, before: 130 }) + p('Web başvuruları bekleyenler ekinde tutulur. Yetkili, merasim tarihini doğrulayınca UC-YYYY-NNNN cami içi numarası verilir. Matbu yer numarası, cami içi defter numarası ve EK-9/DHYS numarası ayrı alanlardır. Boş kayıt yerleri elle yazmaya uygundur.', { size: 20 });
  body += p('Güncel PDF ve Word yönetim panelinden indirilir. İndirilen veya basılan nüsha, üretildiği andaki durumu gösterir. Word üzerinde yapılan değişiklikler sisteme kendiliğinden aktarılmaz; kayıt ve düzeltmeleri yönetim panelinde yapın.', { size: 20 });
  body += p('Doğrulanmış merasim, Müşavirliğe gönderim, imzalı belgenin dönüşü ve kişiye teslim ayrı takip edilir. Defterde imza görseli ve kimlik numarası saklanmaz. Kullanıma açılış ve kontrol imzaları basılı nüshada elle tamamlanır.', { size: 20 }) + p('Dayanak: ' + KAYNAK + '. İnceleme: 09.09.2026.', { size: 18, before: 150 }) + p(KAYNAK_URL, { size: 16 });
  for (let i = 0; i < count; i++) body += pageBreak + card(confirmed[i * 2], i * 2 + 1) + p(' ', { size: 4, after: 60 }) + card(confirmed[i * 2 + 1], i * 2 + 2);
  for (const [label,list] of [['BEKLEYEN BAŞVURULAR',pending], ['İPTAL EDİLEN BAŞVURULAR',cancelled]]) {
    for (let i = 0; i < Math.ceil(list.length / 2); i++) body += pageBreak + p('EK · ' + label, { size: 18, bold: true, color: 'A91C2A', after: 30, next: true }) + card(list[i * 2], i * 2 + 1) + p(' ', { size: 4, after: 30 }) + card(list[i * 2 + 1], i * 2 + 2);
  }
  if (ekler.length) { body += pageBreak + p('EK · KAYIT AYRINTILARI', { size: 28, bold: true, color: 'A91C2A' }); for (const e of ekler) body += p(e.ref, { size: 22, bold: true, next: true }) + p(e.note, { size: 21 }); }
  return zip({ ...WORD_PARCA, 'word/document.xml': WORD_PARCA['word/document.xml'].replace('{{GOVDE}}', body) });
}
