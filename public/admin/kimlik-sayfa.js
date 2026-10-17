/** Kimlik belgesi fotokopisi sayfası (A4) — belge-pdf becerisinin kimlik_sayfa.py düzeni.
 *
 * Başlık > ad > künye satırı > ince ayraç > kartlar (1:1 ölçek, ISO/IEC 7810 köşe yarıçapı, ince gri çerçeve).
 * Formdaki kimlik yüzleri tarayıcıda karta kırpılıp düzeltilir (src/scripts/kimlik-kirp.ts): kart görüntüsü
 * 85,6 × 54 mm (pasaport bilgi sayfası 125 × 88 mm) oranındadır ve burada gerçek boyutuyla basılır. Kırpılmamış
 * fotoğraf (eski başvurular, «kırpmadan gönder» seçimi) aynı düzende, oranı korunarak sığdırılır.
 * Sayfanın dili belgenin dilidir (Belçika belgeleri: Fransızca; formu Felemenkçe dolduranlarda Felemenkçe).
 * 🛑 Kimlik NUMARASI okunmaz ve yazılmaz (MRZ/OCR yok): künyede yalnız formdaki ad ve doğum tarihi durur.
 */
import { adBicimleri } from './kalem.js';

const MM = 72 / 25.4;
const A4 = [595.2756, 841.8898];
export const KART = { en: 85.6, boy: 54.0, r: 3.18 };          // ISO/IEC 7810 ID-1
export const PASAPORT = { en: 125.0, boy: 88.0, r: 3.18 };     // ICAO TD3 bilgi sayfası
const ORAN_TOLERANS = 0.012;

const DILLER = {
  fr: {
    kimlik: "PHOTOCOPIE DE LA CARTE D'IDENTITÉ", pasaport: 'PHOTOCOPIE DU PASSEPORT',
    etiketler: ['RECTO', 'VERSO'], pasaportEtiket: "PAGE D'IDENTITÉ", dogum: 'Naissance', ayrac: ' : ',
    meta: "Photocopie du document d'identité",
  },
  nl: {
    kimlik: 'FOTOKOPIE VAN DE IDENTITEITSKAART', pasaport: 'FOTOKOPIE VAN HET PASPOORT',
    etiketler: ['VOORZIJDE', 'ACHTERZIJDE'], pasaportEtiket: 'PERSONALIAPAGINA', dogum: 'Geboorte', ayrac: ': ',
    meta: 'Fotokopie identiteitsdocument',
  },
};

/** Görüntü kırpılmış kart mı? Oran ID-1 ya da TD3 bilgi sayfasına eşitse ölçüsü döner. */
export function kartOlcusu(en, boy) {
  const oran = en / boy;
  for (const o of [KART, PASAPORT]) if (Math.abs(oran - o.en / o.boy) < ORAN_TOLERANS) return o;
  return null;
}

function yuvarlakDikdortgen(L, x, y, w, h, r) {
  const { moveTo, lineTo, appendBezierCurve, closePath } = L;
  const k = 0.5523 * r;
  return [
    moveTo(x + r, y), lineTo(x + w - r, y), appendBezierCurve(x + w - r + k, y, x + w, y + r - k, x + w, y + r),
    lineTo(x + w, y + h - r), appendBezierCurve(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h),
    lineTo(x + r, y + h), appendBezierCurve(x + r - k, y + h, x, y + h - r + k, x, y + h - r),
    lineTo(x, y + r), appendBezierCurve(x, y + r - k, x + r - k, y, x + r, y), closePath(),
  ];
}

async function gorselGom(belge, veri) {
  if (!veri) return null;
  try {
    if (typeof veri === 'string') return veri.startsWith('data:image/png') || veri.startsWith('iVBOR') ? await belge.embedPng(veri) : await belge.embedJpg(veri);
    return veri[0] === 0x89 ? await belge.embedPng(veri) : await belge.embedJpg(veri);
  } catch { return null; }
}

/** Kimlik sayfasını `belge`ye ekler. Görseller okunamazsa hata verir: paket eksik ekle hazırlanmaz. */
export async function kimlikSayfasiEkle(L, belge, g) {
  const { StandardFonts, rgb, pushGraphicsState, popGraphicsState, clip, endPath, setCharacterSpacing } = L;
  const d = DILLER[g.dil === 'nl' ? 'nl' : 'fr'];
  const pasaport = g.belgeTuru === 'pasaport';
  const yuzler = pasaport ? [[d.pasaportEtiket, g.kimlikOn]] : [[d.etiketler[0], g.kimlikOn], [d.etiketler[1], g.kimlikArka]];
  const gorseller = [];
  for (const [etiket, veri] of yuzler) {
    const im = await gorselGom(belge, veri);
    if (!im) throw new Error(`${etiket}: kimlik görüntüsü okunamadı. JPEG veya PNG yükleyin.`);
    gorseller.push([etiket, im]);
  }

  const times = await belge.embedFont(StandardFonts.TimesRoman);
  const timesKalin = await belge.embedFont(StandardFonts.TimesRomanBold);
  const yedek = g.fontBytes ? await belge.embedFont(g.fontBytes, { subset: true }) : null;
  const yedekKalin = g.fontKalinBytes ? await belge.embedFont(g.fontKalinBytes, { subset: true }) : yedek;
  // Times (WinAnsi) Türkçe ve Doğu Avrupa harflerini kodlayamaz; o metin aynı yerde Lora ile basılır.
  const fontSec = (metin, f, y) => { try { f.encodeText(metin); return f; } catch { return y || f; } };

  const sayfa = belge.addPage(A4);
  const [PW, PH] = A4;
  const ortali = (metin, y, boyut, font, renk) => {
    const f = fontSec(metin, font, font === timesKalin ? yedekKalin : yedek);
    sayfa.drawText(metin, { x: (PW - f.widthOfTextAtSize(metin, boyut)) / 2, y, size: boyut, font: f, color: renk });
  };

  // Ölçü: kırpılmış kart gerçek boyutuyla; kırpılmamış fotoğraf kart genişliğinde, oranı korunarak.
  const olcu = gorseller.map(([, im]) => kartOlcusu(im.width, im.height));
  const kartEn = (pasaport ? PASAPORT.en : KART.en) * MM;
  const kutular = gorseller.map(([, im], i) => {
    const o = olcu[i];
    if (o) return { w: o.en * MM, h: o.boy * MM, r: o.r * MM };
    const azamiH = (pasaport ? 150 : 72) * MM;
    const k = Math.min(kartEn / im.width, azamiH / im.height);
    return { w: im.width * k, h: im.height * k, r: 0 };
  });
  const ch = Math.max(...kutular.map(k => k.h));

  let y = PH - (2 * ch > 150 * MM ? 22 * MM : 30 * MM);
  const baslik = pasaport ? d.pasaport : d.kimlik;
  let bp = 14.0;
  while (bp > 9.0 && fontSec(baslik, timesKalin, yedekKalin).widthOfTextAtSize(baslik, bp) > PW - 32 * MM) bp -= 0.5;
  ortali(baslik, y, bp, timesKalin, rgb(0x11 / 255, 0x11 / 255, 0x14 / 255));

  const adSatiri = adBicimleri(g.adSoyad).yazili[1];   // SOYAD Ad
  if (adSatiri) { y -= 8.4 * MM; ortali(adSatiri, y, 12, times, rgb(0x23 / 255, 0x23 / 255, 0x2a / 255)); }
  const dogum = String(g.dogumTarihi || '').trim()
    .replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$3.$2.$1').replace(/^(\d{2})[/](\d{2})[/](\d{4})$/, '$1.$2.$3');
  if (dogum) { y -= 6.4 * MM; ortali(`${d.dogum}${d.ayrac}${dogum}`, y, 9.5, times, rgb(0x55 / 255, 0x55 / 255, 0x5c / 255)); }

  const x = (PW - kartEn) / 2;
  y -= 6.5 * MM;
  sayfa.drawLine({ start: { x, y }, end: { x: x + kartEn, y }, thickness: 0.6, color: rgb(0x9a / 255, 0x9a / 255, 0xa2 / 255) });

  let bosluk = 15 * MM, ara = 32 * MM;
  const altKenar = 18 * MM;
  const toplamH = kutular.reduce((t, k) => t + k.h, 0);
  if (y - (bosluk + toplamH + (kutular.length - 1) * ara) < altKenar) {
    const kalan = y - altKenar - toplamH;
    if (kutular.length > 1 && kalan > 0) { bosluk = Math.max(9 * MM, kalan * 0.45); ara = Math.max(8 * MM, kalan - bosluk); }
    else if (kalan > 0) bosluk = Math.max(9 * MM, kalan * 0.5);
  }
  let ust = y - bosluk;
  gorseller.forEach(([etiket, im], i) => {
    const k = kutular[i];
    const kx = (PW - k.w) / 2, yy = ust - k.h;
    if (etiket) {
      sayfa.pushOperators(pushGraphicsState(), setCharacterSpacing(0.7));
      sayfa.drawText(etiket, { x: kx, y: yy + k.h + 3.8 * MM, size: 9, font: fontSec(etiket, times, yedek), color: rgb(0x55 / 255, 0x55 / 255, 0x5c / 255) });
      sayfa.pushOperators(popGraphicsState());
    }
    const pay = 1.2 * MM;
    if (k.r) {
      sayfa.drawSvgPath(yuvarlakSvg(k.w + 2 * pay, k.h + 2 * pay, 4 * MM),
        { x: kx - pay, y: yy + k.h + pay, borderColor: rgb(0xc9 / 255, 0xc9 / 255, 0xcf / 255), borderWidth: 0.5 });
      sayfa.pushOperators(pushGraphicsState(), ...yuvarlakDikdortgen(L, kx, yy, k.w, k.h, k.r), clip(), endPath());
      sayfa.drawImage(im, { x: kx, y: yy, width: k.w, height: k.h });
      sayfa.pushOperators(popGraphicsState());
    } else {
      sayfa.drawImage(im, { x: kx, y: yy, width: k.w, height: k.h });
      sayfa.drawRectangle({ x: kx - pay, y: yy - pay, width: k.w + 2 * pay, height: k.h + 2 * pay,
        borderColor: rgb(0xc9 / 255, 0xc9 / 255, 0xcf / 255), borderWidth: 0.5 });
    }
    ust = yy - ara;
  });
  return { sayfa, kirpilmis: olcu.every(Boolean), baslik: `${d.meta} — ${adSatiri}` };
}

/** drawSvgPath için yuvarlak köşeli dikdörtgen (sol üst köşe başlangıçlı, y aşağı). */
function yuvarlakSvg(w, h, r) {
  const k = 0.5523 * r;
  const n = v => Number(v.toFixed(3));
  return `M${n(r)} 0 L${n(w - r)} 0 C${n(w - r + k)} 0 ${n(w)} ${n(r - k)} ${n(w)} ${n(r)} L${n(w)} ${n(h - r)} `
    + `C${n(w)} ${n(h - r + k)} ${n(w - r + k)} ${n(h)} ${n(w - r)} ${n(h)} L${n(r)} ${n(h)} C${n(r - k)} ${n(h)} 0 ${n(h - r + k)} 0 ${n(h - r)} `
    + `L0 ${n(r)} C0 ${n(r - k)} ${n(r - k)} 0 ${n(r)} 0 Z`;
}
