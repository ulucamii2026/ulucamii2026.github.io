/** İhtida Başvuru Formu — cihazda PDF üretimi (pdf-lib + @pdf-lib/fontkit, dinamik import).
 *  Saf mantık dosyası (JSX yok); "Ihtida*" dosya adı kuralına uymak için .tsx uzantılı.
 *  Kur'an kursu kayıt sistemindeki assets/pdf.js ile aynı yaklaşım (Lora fontu, çerçeveli
 *  hücreler, "contained" görsel yerleştirme) — burada npm pdf-lib ile, 3 sayfalık ön başvuru
 *  belgesi için sadeleştirilmiş biçimde. */
import type { Metinler } from './IhtidaMetinler';

export interface IhtidaPdfBasvuran {
  soyad: string;
  adlar: string;
  cinsiyet: string;
  dogumTarihi: string;
  dogumYeri: string;
  uyruk: string;
  belgeNo: string;
  belgeGecerlilikTarihi: string;
  tcVatandasi: boolean;
  tcKimlikNo: string;
  oncekiDin: string;
  ogrenimDurumu: string;
  anneAdi: string;
  babaAdi: string;
  medeniHali: string;
  meslek: string;
  adres: string;
  eposta: string;
  telefon: string;
  ihtidaSebebi: string;
  yeniIsim: string;
  torenDili: string;
  torenTarihi: string;
  nasilHaberdar: string;
  ekNot: string;
}

export interface IhtidaPdfCami { ad: string; adres: string; telefon: string; eposta: string }

/** Kimlik belgesinden otomatik okunup kontrol hanesi doğrulanan alanlar — özet
 *  tablosunda "kimlikten okundu" notuyla işaretlenir. */
export type IhtidaOtoAlan = 'soyad' | 'adlar' | 'dogumTarihi' | 'cinsiyet' | 'uyruk' | 'belgeNo' | 'belgeGecerlilikTarihi' | 'tcKimlikNo';

export interface IhtidaPdfGirdi {
  dil: 'tr' | 'fr';
  m: Metinler;
  basvuran: IhtidaPdfBasvuran;
  otoOkunanAlanlar: IhtidaOtoAlan[];
  belgeTuru: 'kimlik' | 'pasaport';
  kimlikOn: string;
  kimlikArka: string;
  vesikalik: string;
  imzaDataUrl: string;
  fotografIzni: boolean;
  gonderimTarihi: Date;
  cami: IhtidaPdfCami;
}

export interface IhtidaPdfSonuc { bytes: Uint8Array; blob: Blob; file: File; filename: string }

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const INNER = PAGE_WIDTH - MARGIN * 2;

function safeFileName(value: string): string {
  return String(value || 'Basvuru')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
}

function formatTarih(deger: string): string {
  if (!deger) return '';
  const d = new Date(`${deger}T12:00:00`);
  if (Number.isNaN(d.getTime())) return deger;
  const gg = String(d.getDate()).padStart(2, '0');
  const aa = String(d.getMonth() + 1).padStart(2, '0');
  return `${gg}/${aa}/${d.getFullYear()}`;
}

function formatZamanDamgasi(tarih: Date): string {
  const gg = String(tarih.getDate()).padStart(2, '0');
  const aa = String(tarih.getMonth() + 1).padStart(2, '0');
  const ss = String(tarih.getHours()).padStart(2, '0');
  const dd = String(tarih.getMinutes()).padStart(2, '0');
  return `${gg}/${aa}/${tarih.getFullYear()} ${ss}:${dd}`;
}

export async function ihtidaPdfUret(girdi: IhtidaPdfGirdi): Promise<IhtidaPdfSonuc> {
  const { PDFDocument, rgb, degrees } = await import('pdf-lib');
  const fontkitMod = await import('@pdf-lib/fontkit');
  const fontkit = (fontkitMod as any).default ?? fontkitMod;

  const INK = rgb(0.067, 0.063, 0.055);
  const LINE = rgb(0.13, 0.13, 0.13);
  const MUTED = rgb(0.33, 0.31, 0.28);
  const WHITE = rgb(1, 1, 1);
  const VURGU = rgb(0.71, 0.27, 0.17); // kiremit

  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);

  const [regBytes, boldBytes] = await Promise.all([
    fetch('/fonts/Lora-Regular.ttf').then((r) => r.arrayBuffer()),
    fetch('/fonts/Lora-Bold.ttf').then((r) => r.arrayBuffer()),
  ]);
  const fonts = {
    regular: await document.embedFont(regBytes, { subset: true }),
    bold: await document.embedFont(boldBytes, { subset: true }),
  };

  let logoImage: any = null;
  try {
    const logoBytes = await fetch('/media/logo/ulu-camii-logo-512.png').then((r) => r.arrayBuffer());
    logoImage = await document.embedPng(logoBytes);
  } catch { /* logo yoksa metinle devam edilir */ }

  document.setTitle(`${girdi.m.pdfBaslik} – ${girdi.cami.ad}`);
  document.setAuthor(girdi.cami.ad);
  document.setSubject(girdi.m.pdfAltBaslik);
  document.setCreator('Ulu Camii İhtida Başvuru Formu');
  document.setCreationDate(girdi.gonderimTarihi);
  document.setModificationDate(girdi.gonderimTarihi);

  function fitText(text: string, font: any, size: number, maxWidth: number): string {
    const value = String(text || '');
    if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
    let result = value;
    while (result.length > 1 && font.widthOfTextAtSize(`${result}…`, size) > maxWidth) result = result.slice(0, -1);
    return `${result.trimEnd()}…`;
  }

  function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
    const paragraphs = String(text || '').split(/\n/);
    const lines: string[] = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      let line = '';
      words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
        else if (line) { lines.push(line); line = word; }
        else {
          let part = '';
          [...word].forEach((ch) => {
            const next = `${part}${ch}`;
            if (font.widthOfTextAtSize(next, size) > maxWidth && part) { lines.push(part); part = ch; }
            else part = next;
          });
          line = part;
        }
      });
      if (line) lines.push(line);
      if (paragraphIndex < paragraphs.length - 1) lines.push('');
    });
    return lines.length ? lines : [''];
  }

  function drawCentered(page: any, text: string, font: any, size: number, y: number, color = INK) {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (PAGE_WIDTH - w) / 2, y, size, font, color });
  }

  function drawImageContained(page: any, image: any, x: number, y: number, width: number, height: number) {
    const scale = Math.min(width / image.width, height / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    page.drawImage(image, { x: x + (width - dw) / 2, y: y + (height - dh) / 2, width: dw, height: dh });
  }

  async function embedDataImage(dataUrl: string): Promise<any> {
    if (!dataUrl) return null;
    if (dataUrl.startsWith('data:image/png')) return document.embedPng(dataUrl);
    return document.embedJpg(dataUrl);
  }

  function drawHeader(page: any, baslik: string) {
    let y = PAGE_HEIGHT - MARGIN;
    if (logoImage) {
      const logoBoyut = 40;
      drawImageContained(page, logoImage, MARGIN, y - logoBoyut, logoBoyut, logoBoyut);
      page.drawText(girdi.cami.ad, { x: MARGIN + logoBoyut + 12, y: y - 16, size: 11, font: fonts.bold, color: INK });
      page.drawText(baslik, { x: MARGIN + logoBoyut + 12, y: y - 30, size: 9, font: fonts.regular, color: MUTED });
      y -= logoBoyut + 14;
    } else {
      page.drawText(girdi.cami.ad, { x: MARGIN, y: y - 14, size: 11, font: fonts.bold, color: INK });
      page.drawText(baslik, { x: MARGIN, y: y - 28, size: 9, font: fonts.regular, color: MUTED });
      y -= 42;
    }
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.8, color: LINE });
    return y - 18;
  }

  // ---- Sayfa 1: başvuru özeti -------------------------------------------------
  const page1 = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = drawHeader(page1, girdi.m.pdfBaslik);

  page1.drawText(girdi.m.pdfAltBaslik, { x: MARGIN, y, size: 15, font: fonts.bold, color: VURGU });
  y -= 22;
  const b = girdi.basvuran;
  page1.drawText(`${girdi.dil === 'tr' ? 'Başvuru tarihi' : 'Date de la demande'}: ${formatZamanDamgasi(girdi.gonderimTarihi)}`, { x: MARGIN, y, size: 9.5, font: fonts.regular, color: MUTED });
  y -= 22;

  // Form etiketleri "(opsiyonel)" / "(+32...)" gibi UI ipuçları taşıyabilir — resmî belgede gereksiz.
  const et = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').trim();
  // Kimlikten otomatik okunup kontrol hanesi doğrulanan alanlar özet tablosunda işaretlenir.
  const otoNotu = girdi.dil === 'tr' ? ' · kimlikten okundu' : ' · lu automatiquement';
  const otoMu = (anahtar: IhtidaOtoAlan) => girdi.otoOkunanAlanlar.includes(anahtar);
  const etO = (s: string, anahtar: IhtidaOtoAlan) => et(s) + (otoMu(anahtar) ? otoNotu : '');
  const adSoyadEtiket = (girdi.dil === 'tr' ? 'Adı Soyadı' : 'Nom et prénom') + ((otoMu('soyad') || otoMu('adlar')) ? otoNotu : '');

  const alanlar: [string, string][] = [
    [adSoyadEtiket, `${b.soyad} ${b.adlar}`.trim()],
    [etO(girdi.m.cinsiyet, 'cinsiyet'), b.cinsiyet],
    [etO(girdi.m.dogumTarihi, 'dogumTarihi'), formatTarih(b.dogumTarihi)],
    [et(girdi.m.dogumYeri), b.dogumYeri],
    [etO(girdi.m.uyruk, 'uyruk'), b.uyruk],
    ...(b.belgeNo ? [[etO(girdi.m.belgeNo, 'belgeNo'), b.belgeNo] as [string, string]] : []),
    ...(b.belgeGecerlilikTarihi ? [[etO(girdi.m.belgeGecerlilikTarihi, 'belgeGecerlilikTarihi'), formatTarih(b.belgeGecerlilikTarihi)] as [string, string]] : []),
    ...(b.tcVatandasi ? [[etO(girdi.m.tcKimlikNo, 'tcKimlikNo'), b.tcKimlikNo] as [string, string]] : []),
    [et(girdi.m.oncekiDin), b.oncekiDin],
    ...(b.ogrenimDurumu ? [[et(girdi.m.ogrenimDurumu), b.ogrenimDurumu] as [string, string]] : []),
    ...(b.anneAdi ? [[et(girdi.m.anneAdi), b.anneAdi] as [string, string]] : []),
    ...(b.babaAdi ? [[et(girdi.m.babaAdi), b.babaAdi] as [string, string]] : []),
    ...(b.medeniHali ? [[et(girdi.m.medeniHali), b.medeniHali] as [string, string]] : []),
    ...(b.meslek ? [[et(girdi.m.meslek), b.meslek] as [string, string]] : []),
    [et(girdi.m.eposta), b.eposta],
    [et(girdi.m.telefon), b.telefon],
    [et(girdi.m.adres), b.adres],
    ...(b.ihtidaSebebi ? [[et(girdi.m.ihtidaSebebi), b.ihtidaSebebi] as [string, string]] : []),
    ...(b.yeniIsim ? [[et(girdi.m.yeniIsim), b.yeniIsim] as [string, string]] : []),
    ...(b.torenDili ? [[et(girdi.m.torenDili), b.torenDili] as [string, string]] : []),
    ...(b.torenTarihi ? [[et(girdi.m.torenTarihi), formatTarih(b.torenTarihi)] as [string, string]] : []),
  ];

  const LABEL_SIZE = 8.2;
  const VALUE_SIZE = 10;
  const ROW_PAD = 5;
  let curPage = page1;
  alanlar.forEach(([etiket, deger]) => {
    const satirlar = wrapText(deger || '—', fonts.bold, VALUE_SIZE, INNER - 4);
    const yukseklik = 12 + satirlar.length * 13 + ROW_PAD;
    if (y - yukseklik < 210) {
      curPage = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = drawHeader(curPage, girdi.m.pdfBaslik) - 4;
    }
    curPage.drawText(etiket.toUpperCase(), { x: MARGIN, y, size: LABEL_SIZE, font: fonts.regular, color: MUTED });
    y -= 13;
    satirlar.forEach((s) => { curPage.drawText(s, { x: MARGIN, y, size: VALUE_SIZE, font: fonts.bold, color: INK }); y -= 13; });
    y -= ROW_PAD;
    curPage.drawLine({ start: { x: MARGIN, y: y + ROW_PAD / 2 }, end: { x: PAGE_WIDTH - MARGIN, y: y + ROW_PAD / 2 }, thickness: 0.4, color: rgb(0.8, 0.78, 0.72) });
  });

  if (y - 150 < 100) { curPage = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]); y = drawHeader(curPage, girdi.m.pdfBaslik) - 4; }
  y -= 10;
  const beyanSatirlari = wrapText(girdi.m.beyanCumlesi, fonts.regular, 10, INNER);
  beyanSatirlari.forEach((s) => { curPage.drawText(s, { x: MARGIN, y, size: 10, font: fonts.regular, color: INK }); y -= 14; });
  y -= 10;

  const imza = await embedDataImage(girdi.imzaDataUrl);
  if (imza) {
    drawImageContained(curPage, imza, MARGIN, y - 44, 160, 44);
  }
  curPage.drawText(formatTarih(girdi.gonderimTarihi.toISOString().slice(0, 10)), { x: MARGIN, y: y - 58, size: 9, font: fonts.regular, color: MUTED });
  y -= 74;

  curPage.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.6, color: LINE });
  y -= 16;
  const kvkkNot = girdi.dil === 'tr'
    ? `Bu başvuru ile birlikte EK-10 KVKK Açık Rıza Metni ${formatTarih(girdi.gonderimTarihi.toISOString().slice(0, 10))} tarihinde elektronik olarak onaylanmıştır.`
    : `Le texte de consentement RGPD (EK-10) a été accepté électroniquement le ${formatTarih(girdi.gonderimTarihi.toISOString().slice(0, 10))} dans le cadre de cette demande.`;
  wrapText(kvkkNot, fonts.regular, 9, INNER).forEach((s) => { curPage.drawText(s, { x: MARGIN, y, size: 9, font: fonts.regular, color: MUTED }); y -= 12; });
  if (girdi.fotografIzni) {
    y -= 4;
    const izinNot = girdi.dil === 'tr' ? 'Başvuran, fotoğraf/hikâyesinin cami tarafından kullanılmasına izin vermiştir.' : 'Le/la demandeur/euse a autorisé l’usage de sa photo/son témoignage par la mosquée.';
    wrapText(izinNot, fonts.regular, 9, INNER).forEach((s) => { curPage.drawText(s, { x: MARGIN, y, size: 9, font: fonts.regular, color: MUTED }); y -= 12; });
  }

  // ---- Sayfa 2: ekler -----------------------------------------------------
  const page2 = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y2 = drawHeader(page2, girdi.m.pdfIletisim);
  drawCentered(page2, girdi.dil === 'tr' ? 'EKLER — KİMLİK VE FOTOĞRAF' : 'PIÈCES JOINTES — IDENTITÉ ET PHOTO', fonts.bold, 12, y2);
  y2 -= 26;

  const onImg = await embedDataImage(girdi.kimlikOn);
  const arkaImg = girdi.kimlikArka ? await embedDataImage(girdi.kimlikArka) : null;
  const vesikaImg = await embedDataImage(girdi.vesikalik);

  function watermark(page: any, cx: number, cy: number) {
    const metin = girdi.m.pdfFiligran;
    const boyut = 13;
    const genislik = fonts.bold.widthOfTextAtSize(metin, boyut);
    page.drawText(metin, {
      x: cx - genislik / 2, y: cy, size: boyut, font: fonts.bold,
      color: VURGU, opacity: 0.35, rotate: degrees(28),
    });
  }

  function belgeKutusu(page: any, baslik: string, image: any, y: number, h: number) {
    page.drawText(baslik, { x: MARGIN, y: y + h + 8, size: 10, font: fonts.regular, color: INK });
    page.drawRectangle({ x: MARGIN, y, width: INNER, height: h, borderColor: LINE, borderWidth: 0.8, color: WHITE });
    if (image) drawImageContained(page, image, MARGIN + 6, y + 6, INNER - 12, h - 12);
    else {
      const bosMetin = girdi.dil === 'tr' ? 'Görsel eklenmedi' : 'Aucune image';
      page.drawText(bosMetin, { x: MARGIN + (INNER - fonts.regular.widthOfTextAtSize(bosMetin, 10)) / 2, y: y + h / 2, size: 10, font: fonts.regular, color: MUTED });
    }
    watermark(page, MARGIN + INNER / 2, y + h / 2);
  }

  const boxH = 200;
  belgeKutusu(page2, girdi.m.kimlikOn, onImg, y2 - boxH, boxH);
  y2 -= boxH + 36;
  if (arkaImg) { belgeKutusu(page2, girdi.m.kimlikArka, arkaImg, y2 - boxH, boxH); y2 -= boxH + 36; }
  const vesikaH = 150;
  belgeKutusu(page2, girdi.m.vesikalik, vesikaImg, Math.max(80, y2 - vesikaH), vesikaH);

  // ---- Sayfa 3: bilgilendirme ----------------------------------------------
  const page3 = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y3 = drawHeader(page3, girdi.m.pdfIletisim);
  drawCentered(page3, girdi.dil === 'tr' ? 'BİLGİLENDİRME' : 'INFORMATIONS', fonts.bold, 12, y3);
  y3 -= 28;
  wrapText(girdi.m.pdfBilgilendirme, fonts.regular, 10.5, INNER).forEach((s) => { page3.drawText(s, { x: MARGIN, y: y3, size: 10.5, font: fonts.regular, color: INK }); y3 -= 15; });
  y3 -= 26;
  page3.drawLine({ start: { x: MARGIN, y: y3 }, end: { x: PAGE_WIDTH - MARGIN, y: y3 }, thickness: 0.6, color: LINE });
  y3 -= 22;
  page3.drawText(girdi.m.pdfIletisim.toUpperCase(), { x: MARGIN, y: y3, size: 9, font: fonts.regular, color: MUTED });
  y3 -= 16;
  [girdi.cami.ad, girdi.cami.adres, girdi.cami.telefon, girdi.cami.eposta].filter(Boolean).forEach((satir) => {
    page3.drawText(satir, { x: MARGIN, y: y3, size: 10.5, font: fonts.bold, color: INK });
    y3 -= 15;
  });

  // ---- alt bilgi (tüm sayfalar) --------------------------------------------
  const pages = document.getPages();
  pages.forEach((page: any, index: number) => {
    const etiket = `${index + 1} / ${pages.length}`;
    page.drawText(etiket, { x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(etiket, 8), y: 28, size: 8, font: fonts.regular, color: MUTED });
    page.drawText(fitText(`${girdi.m.pdfOnBasvuruUyari} · ${girdi.cami.ad}`, fonts.regular, 7.5, INNER - 60), { x: MARGIN, y: 28, size: 7.5, font: fonts.regular, color: MUTED });
  });

  const bytes = await document.save({ useObjectStreams: false, addDefaultPage: false });
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const filename = `IhtidaBasvuru_${safeFileName(`${b.soyad} ${b.adlar}`)}.pdf`;
  let file: File | Blob;
  try { file = new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() }); }
  catch { file = blob; (file as any).name = filename; }
  return { bytes, blob, file: file as File, filename };
}
