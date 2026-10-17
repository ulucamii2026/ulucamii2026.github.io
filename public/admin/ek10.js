/** EK-10 açık rıza metni.
 * Ekim 2026 sürümü ('2026-10'): Müşavirliğin dört dilli formu (TR·EN / FR·NL), her yüzde tarih · ad · imza;
 * alanlar mavi dolma kalemle (kalem.js), imza aynı mürekkeple. Başvuran hangi metne onay verdiyse o üretilir:
 * 2026-09-09 sürümü iki sayfada dört dili taşır (ortak ad, tarih ve tek imza ikinci sayfada); daha önceki
 * başvurular v1 şablonu ve koordinatlarıyla kalır.
 */
import { EK10_2026_10 } from './belge-yerlesim.js';
import { kalemKur, adBicimleri, KALEM_OZELLIKLERI } from './kalem.js';
import { imzaHazirla, aktarimKutusu } from './imza-ciz.js';

const YENI_SURUM = '2026-09-09';
const EKIM_SURUMU = EK10_2026_10.surum;

function imzayiOku(belge, imza) {
  if (!imza) return null;
  return belge.embedPng(imza).catch(() => { throw new Error('Başvuranın imzası okunamadı; EK-10 imzalı olarak üretilemedi.'); });
}

function adYaz(s, font, rgb, metin, x, y, en) {
  const ad = String(metin || '').trim();
  if (!ad) return;
  const boyut = Math.min(10.5, en / Math.max(1, font.widthOfTextAtSize(ad, 1)));
  if (boyut < 6) throw new Error('Ad soyad EK-10 alanına okunur biçimde sığmıyor; belgeyi elle tamamlayın.');
  s.drawText(ad, { x, y, size: boyut, font, color: rgb(.08, .12, .14) });
}

async function yeniEk10Uret(g) {
  if (typeof g.imzaAktarimIzni !== 'boolean') throw new Error('EK-10 imza görüntüsü izni Evet veya Hayır olarak seçilmelidir.');
  if (g.imza && g.onay !== true) throw new Error('EK-10 rızası kayıtta doğrulanmadan imza eklenemez.');
  const { PDFDocument, rgb } = g.pdfLib;
  const belge = await PDFDocument.load(g.sablonBytes, { parseSpeed: Infinity });
  if (belge.getPageCount() !== 2) throw new Error('EK-10 şablonu iki sayfa olmalıdır.');
  belge.registerFontkit(g.fontkit);
  const font = await belge.embedFont(g.fontBytes, { subset: true });
  const kalin = g.fontKalinBytes ? await belge.embedFont(g.fontKalinBytes, { subset: true }) : font;
  const sayfa = belge.getPages()[1];
  const imza = g.imzaAktarimIzni ? await imzayiOku(belge, g.imza) : null;

  // Onay kutuları: PDF koordinatları aktif şablondaki açık kutuların içidir.
  const kutuX = g.imzaAktarimIzni ? 43 : 272;
  sayfa.drawLine({ start: { x: kutuX + 2, y: 170 }, end: { x: kutuX + 4.5, y: 172.5 }, thickness: 1.35, color: rgb(.09, .24, .28) });
  sayfa.drawLine({ start: { x: kutuX + 4.2, y: 172.4 }, end: { x: kutuX + 8.5, y: 177.5 }, thickness: 1.35, color: rgb(.09, .24, .28) });

  // Tek ortak ad/tarih satırı ve tek imza yalnız ikinci sayfaya işlenir.
  adYaz(sayfa, kalin, rgb, g.adSoyad, 43, 125, 357);
  adYaz(sayfa, font, rgb, g.tarih || '', 419, 125, 133);
  if (imza) {
    const oran = Math.min(180 / imza.width, 25 / imza.height);
    sayfa.drawImage(imza, { x: 54 + (180 - imza.width * oran) / 2, y: 65, width: imza.width * oran, height: imza.height * oran });
  }
  belge.setTitle(`EK-10 Açık Rıza — ${g.adSoyad || ''}`);
  belge.setSubject('İhtida başvurusu için iki sayfa, dört dil ve tek ortak imza');
  belge.setCreator('Marche-en-Famenne Ulu Camii');
  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}

async function eskiEk10Uret(g) {
  if (g.imza && g.onay !== true) throw new Error('EK-10 rızası kayıtta doğrulanmadan imza eklenemez.');
  const { PDFDocument, rgb } = g.pdfLib;
  const belge = await PDFDocument.load(g.sablonBytes, { parseSpeed: Infinity });
  if (belge.getPageCount() !== 2) throw new Error('EK-10 şablonu iki sayfa olmalıdır.');
  belge.registerFontkit(g.fontkit);
  const font = await belge.embedFont(g.fontBytes, { subset: true });
  const imza = await imzayiOku(belge, g.imza);
  const yaz = (s, metin, ust) => {
    const m = String(metin || '').trim();
    if (!m) return;
    const boyut = Math.min(10, 143 / Math.max(1, font.widthOfTextAtSize(m, 1)));
    if (boyut < 6) throw new Error('Ad soyad EK-10 alanına okunur biçimde sığmıyor; belgeyi elle tamamlayın.');
    s.drawRectangle({ x: 402, y: s.getHeight() - ust - 3, width: 149, height: 16, color: rgb(1, 1, 1) });
    s.drawText(m, { x: 405, y: s.getHeight() - ust, size: boyut, font, color: rgb(.08, .08, .08) });
  };
  for (const sayfa of belge.getPages()) {
    yaz(sayfa, g.adSoyad, 706.2); yaz(sayfa, g.tarih || '', 681.3);
    if (imza) {
      const oran = Math.min(140 / imza.width, 29 / imza.height);
      sayfa.drawRectangle({ x: 402, y: sayfa.getHeight() - 745, width: 149, height: 31, color: rgb(1, 1, 1) });
      sayfa.drawImage(imza, { x: 405 + (140 - imza.width * oran) / 2, y: sayfa.getHeight() - 743, width: imza.width * oran, height: imza.height * oran });
    }
  }
  belge.setTitle(`EK-10 Açık Rıza — ${g.adSoyad || ''}`);
  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}

/** Ekim 2026 formu: kalem.py/ek10-imzali-dijital.py ile aynı alanlar ve boylar (ad ve tarih 21 pt). */
async function ekimEk10Uret(g) {
  const imzali = Boolean(g.imza || g.imzaVektor);
  if (imzali && g.onay !== true) throw new Error('EK-10 rızası kayıtta doğrulanmadan imza eklenemez.');
  if (imzali && g.imzaAktarimIzni !== true) throw new Error('İmza aktarım izni olmadan imzalı EK-10 üretilemez.');
  if (!g.kalemFontBytes) throw new Error('Kalem yazı tipi (Allura) eksik.');
  const { PDFDocument } = g.pdfLib;
  const belge = await PDFDocument.load(g.sablonBytes, { parseSpeed: Infinity });
  if (belge.getPageCount() !== EK10_2026_10.sayfalar.length) throw new Error('EK-10 Ekim 2026 şablonu iki sayfa olmalıdır.');
  belge.registerFontkit(g.fontkit);
  const allura = await belge.embedFont(g.kalemFontBytes, { subset: false, features: KALEM_OZELLIKLERI });   // alt küme gömme bazı harfleri görünmez yapıyor (Caveat dersi)
  const yedek = g.fontBytes ? await belge.embedFont(g.fontBytes, { subset: true }) : null;
  const kalem = kalemKur(g.pdfLib, allura, yedek);
  const imza = imzali ? await imzaHazirla(g.pdfLib, belge, { vektor: g.imzaVektor, gorsel: g.imza }) : null;
  const adlar = adBicimleri(g.adSoyad).el;
  const tarih = String(g.tarih || '').trim();
  belge.getPages().forEach((sayfa, i) => {
    const A = EK10_2026_10.sayfalar[i].alanlar;
    if (imza) imza.ciz(sayfa, aktarimKutusu(imza.en, imza.boy, A.imza));
    if (tarih) kalem.alanaYaz(sayfa, A.tarih, tarih, 21);
    if (adlar[i]) kalem.alanaYaz(sayfa, A.ad, adlar[i], 21);
  });
  const durum = imza ? 'imzalı, dijital' : 'imzaya hazır';
  belge.setTitle(`EK-10 Açık Rıza — ${g.ref || g.adSoyad || ''} (${durum})`);
  belge.setSubject('EK-10 Açık Rıza Metni (Ekim 2026 formu, TR·EN / FR·NL). Ad ve tarih mavi dolma kalem el yazısıyla (Allura)'
    + (imza ? '; imza, başvuranın formda çizdiği imzadır ve açık izniyle aktarıldı.' : '; imza alanı ıslak imza için boş.'));
  belge.setAuthor('T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği');
  belge.setCreator('Marche-en-Famenne Ulu Camii');
  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}

/** Defterdeki «EK-10 sürümü» hücresi → sürüm. Google Sheets «2026-09-09» ve «2026-10» metnini tarihe çevirip
 *  «09.09.2026» / «01.10.2026» olarak geri verebiliyor (17 Eki 2026'ya kadar metin işaretsiz yazıldı). */
export function ek10SurumuCoz(deger) {
  const s = String(deger ?? '').trim();        // panel listesi tarihi «dd.MM.yyyy HH:mm» olarak da verir
  if (s === EKIM_SURUMU || s.startsWith('01.10.2026')) return EKIM_SURUMU;
  if (s === YENI_SURUM || s.startsWith('09.09.2026')) return YENI_SURUM;
  return 'v1';
}

export async function ek10Uret(g) {
  if (g.surum === EKIM_SURUMU) return ekimEk10Uret(g);
  return g.surum === YENI_SURUM ? yeniEk10Uret(g) : eskiEk10Uret(g);
}

export { YENI_SURUM, EKIM_SURUMU };
