/** İmzaları belgeye kalem mürekkebiyle (#1A3D9E) koyar.
 *
 * Formda çizilen imza, tuvaldeki çizgilerin kendisi olarak gelir (vektör: `imzaVektor`); belgeye yol olarak çizilir,
 * raster gömülmez. Eski başvurularda yalnız PNG vardır: o zaman görüntü aynı mürekkebe boyanarak (Decode dizisi
 * sabit renge çevrilir, saydamlık korunur) yerleştirilir.
 * Yerleşim, Mühtedi Koordinatörlüğünün hattındaki aktarım kuralıdır (ek10-imzali-dijital.py «aktarim_kutusu»):
 * imza yalnız küçülür, alana ortalanır ve yazı çizgisine oturur.
 */
import { MUREKKEP } from './kalem.js';

export const IMZA_VEKTOR_SURUM = 1;
const AZAMI_D = 120000;          // karakter; 13 Eyl 2026'daki imzalar 2–20 KB
const DOGAL = { en: 170, boy: 46 };   // pt: imzanın belgedeki en büyük boyu (alan daha küçükse küçülür)
const TABAN = 0.8;               // imzanın yazı çizgisi, yüksekliğin bu oranında (imza-vektor.py varsayılanı)

/** Formdan gelen vektör imzayı çözer: {w, h, k, cizgiler:[[x,y,x,y…]…]} ya da null. Sunucu da aynı kurala uyar. */
export function imzaVektorCoz(metin) {
  if (!metin) return null;
  let v;
  try { v = typeof metin === 'string' ? JSON.parse(metin) : metin; } catch { return null; }
  if (!v || v.v !== IMZA_VEKTOR_SURUM || typeof v.d !== 'string' || v.d.length > AZAMI_D) return null;
  const w = Number(v.w), h = Number(v.h), k = Number(v.k);
  if (!(w > 4 && w < 5000 && h > 4 && h < 5000 && k > 0.2 && k < 20)) return null;
  if (!/^[ML0-9., -]+$/.test(v.d)) return null;
  const cizgiler = [];
  for (const parca of v.d.match(/[ML][^ML]*/g) || []) {
    const sayilar = parca.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (!sayilar.length || sayilar.length % 2 || sayilar.some(n => !Number.isFinite(n))) return null;
    if (parca[0] === 'M') cizgiler.push(sayilar);
    else if (cizgiler.length) cizgiler[cizgiler.length - 1].push(...sayilar);
    else return null;
  }
  const noktaSayisi = cizgiler.reduce((t, c) => t + c.length / 2, 0);
  if (!cizgiler.length || noktaSayisi < 4) return null;
  return { w, h, k, cizgiler };
}

/* ---- Şahit imzası: kayıtlı gerçek imzanın vektör kaydı (sürüm 2, 23 Eki 2026) ----------------------------------------
 * Başvuranın ekranda çizdiği imza yalnız çizgidir (sürüm 1). Şahitlerin imzası ise taranmış gerçek imzanın vektörel
 * izidir: ya kalem çizgisi (kalınlıklı yol) ya da dolgulu kontur (potrace benzeri, çift-tek kuralı). Kayıt:
 *   { "v": 2, "w": genişlik, "h": yükseklik, "p": [{ "d": "M x y L x y C x1 y1 x2 y2 x y Z", "f": 1, "e": 1 } | { "d": "…", "k": kalınlık }] }
 * d yalnız mutlak M, L, C, Z komutlarını içerir; f:1 dolgu (e:1 çift-tek), aksi hâlde k kalınlıklı yuvarlak uçlu çizgi.
 * Bu biçim yalnız sunucudaki özel depodan (sahit-imza-yukle) ve panelin yetkili isteğinden gelir; herkese açık formdan
 * gelen vektör imza (sürüm 1) bu çözücüden geçmez. Gerçek imzalar depoya, public/ klasörüne ve derlemeye KONMAZ. */
export const SAHIT_IMZA_SURUM = 2;
const SAHIT_AZAMI_D = 150000;          // karakter, tek yol
const SAHIT_AZAMI_TOPLAM = 220000;     // karakter, bütün yollar
const SAHIT_AZAMI_KOORD = 20000;
const SAHIT_EN_INCE = 0.55;            // pt: küçültülmüş kalem çizgisinin okunur alt sınırı

/** Şahit imzasını çözer: {w, h, yollar:[{ops:[{c, sayilar}], dolgu, evenodd, k}]} ya da null. */
export function sahitImzaCoz(metin) {
  if (!metin) return null;
  let v;
  try { v = typeof metin === 'string' ? JSON.parse(metin) : metin; } catch { return null; }
  if (!v || v.v !== SAHIT_IMZA_SURUM || !Array.isArray(v.p) || !v.p.length || v.p.length > 64) return null;
  const w = Number(v.w), h = Number(v.h);
  if (!(w > 4 && w < 5000 && h > 4 && h < 5000)) return null;
  const yollar = [];
  let toplam = 0;
  for (const p of v.p) {
    if (!p || typeof p.d !== 'string' || !p.d.length || p.d.length > SAHIT_AZAMI_D) return null;
    toplam += p.d.length;
    if (toplam > SAHIT_AZAMI_TOPLAM) return null;
    if (!/^[MLCZ0-9., -]+$/.test(p.d) || p.d.trim()[0] !== 'M') return null;
    const dolgu = p.f === 1, k = Number(p.k);
    if (!dolgu && !(k > 0.05 && k < 50)) return null;
    const ops = [];
    for (const parca of p.d.match(/[MLCZ][^MLCZ]*/g) || []) {
      const c = parca[0];
      const sayilar = parca.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (sayilar.some(n => !Number.isFinite(n) || Math.abs(n) > SAHIT_AZAMI_KOORD)) return null;
      const adim = c === 'Z' ? 0 : c === 'C' ? 6 : 2;
      if (adim ? !sayilar.length || sayilar.length % adim : sayilar.length) return null;
      ops.push({ c, sayilar });
    }
    if (!ops.length) return null;
    yollar.push({ ops, dolgu, evenodd: p.e === 1, k });
  }
  return { w, h, yollar };
}

/** Kaynak boyutu (pt) → hedef alanda imza kutusu (sol üst köşeden pt). alan = [x0, üst, x1, taban]. */
export function aktarimKutusu(en, boy, alan) {
  const [fx0, fy0, fx1, ftaban] = alan;
  const k = Math.min(1, (fx1 - fx0 - 8) / en, (ftaban + 6 - (fy0 - 0.5)) / boy);
  const w = en * k, h = boy * k;
  const alt = Math.min(ftaban + 6, ftaban + (boy - boy * TABAN) * k);
  const ust = Math.max(fy0 - 0.5, alt - h);
  const x0 = fx0 + (fx1 - fx0 - w) / 2;
  return { x0, y0: ust, x1: x0 + w, y1: ust + h, k };
}

/** Bir kutuya oranı koruyarak ortalar (şahit yuvası; ek9-sahit-imza.py: yalnız küçülür). */
export function kutuyaSigdir(en, boy, kutu, buyut = false) {
  const [x0, y0, x1, y1] = kutu;
  const k = Math.min(buyut ? Infinity : 1, (x1 - x0) / en, (y1 - y0) / boy);
  const w = en * k, h = boy * k, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2, k };
}

/** Bir imzayı (vektör ya da PNG/JPEG) belgeye hazırlar: {en, boy, ciz(sayfa, kutu)}. Doğal boy pt'dir.
 *  sahit: true yalnız kayıtlı şahit imzası içindir; o zaman sürüm 2 kayıt (kalem çizgisi ya da dolgulu kontur) da kabul edilir. */
export async function imzaHazirla(pdfLib, belge, { vektor, gorsel, sahit = false }) {
  const y = sahit ? sahitImzaCoz(vektor) : null;
  if (y) {
    const s0 = Math.min(DOGAL.en / y.w, DOGAL.boy / y.h);
    return { tur: 'yol', en: y.w * s0, boy: y.h * s0, ciz: (sayfa, kutu) => yolCiz(pdfLib, sayfa, y, kutu) };
  }
  const v = imzaVektorCoz(vektor);
  if (v) {
    const s0 = Math.min(DOGAL.en / v.w, DOGAL.boy / v.h);
    return { tur: 'vektor', en: v.w * s0, boy: v.h * s0, ciz: (sayfa, kutu) => vektorCiz(pdfLib, sayfa, v, kutu) };
  }
  if (!gorsel) return null;
  let im;
  try {
    im = typeof gorsel === 'string'
      ? (gorsel.startsWith('data:image/png') || gorsel.startsWith('iVBOR') ? await belge.embedPng(gorsel) : await belge.embedJpg(gorsel))
      : (gorsel[0] === 0x89 ? await belge.embedPng(gorsel) : await belge.embedJpg(gorsel));
  } catch { throw new Error('İmza görüntüsü okunamadı.'); }
  await murekkebeBoya(pdfLib, belge, im);
  const s0 = Math.min(DOGAL.en / im.width, DOGAL.boy / im.height);
  return {
    tur: 'raster', en: im.width * s0, boy: im.height * s0,
    ciz: (sayfa, kutu) => sayfa.drawImage(im, { x: kutu.x0, y: sayfa.getHeight() - kutu.y1, width: kutu.x1 - kutu.x0, height: kutu.y1 - kutu.y0 }),
  };
}

/** Raster imzayı mürekkep rengine çevirir: renk bileşenleri sabitlenir, şekli saydamlık (SMask) taşır.
 *  Saydamlığı olmayan (JPEG) imzada kâğıt da boyanacağından dokunulmaz. */
async function murekkebeBoya(pdfLib, belge, im) {
  await im.embed();
  const { PDFName } = pdfLib;
  const nesne = belge.context.lookup(im.ref);
  const sozluk = nesne?.dict;
  if (!sozluk || !sozluk.get(PDFName.of('SMask'))) return;
  if (sozluk.get(PDFName.of('ColorSpace'))?.toString() !== '/DeviceRGB') return;
  const [r, g, b] = MUREKKEP;
  sozluk.set(PDFName.of('Decode'), belge.context.obj([r, r, g, g, b, b]));
}

/** Şahit imzasını yol olarak çizer, hep kalem mürekkebiyle: dolgulu kontur doldurulur (çift-tek kuralı korunur), kalem
 *  çizgisi gerçek kalınlığıyla (küçüldüğü oranda ince; okunur alt sınırın altına inmez) yuvarlak uçla çizilir. Raster yok. */
function yolCiz(pdfLib, sayfa, y, kutu) {
  const { pushGraphicsState, popGraphicsState, concatTransformationMatrix, setLineWidth, setLineCap, setLineJoin,
    LineCapStyle, LineJoinStyle, setStrokingRgbColor, setFillingRgbColor, moveTo, lineTo, appendBezierCurve,
    closePath, stroke, fill, PDFOperator, PDFOperatorNames } = pdfLib;
  const s = (kutu.x1 - kutu.x0) / y.w;
  const ops = [pushGraphicsState(), concatTransformationMatrix(s, 0, 0, -s, kutu.x0, sayfa.getHeight() - kutu.y0)];
  for (const yol of y.yollar) {
    ops.push(pushGraphicsState());
    if (yol.dolgu) ops.push(setFillingRgbColor(...MUREKKEP));
    else ops.push(setStrokingRgbColor(...MUREKKEP), setLineWidth(Math.max(SAHIT_EN_INCE / s, yol.k)), setLineCap(LineCapStyle.Round), setLineJoin(LineJoinStyle.Round));
    for (const { c, sayilar: n } of yol.ops) {
      if (c === 'Z') ops.push(closePath());
      else if (c === 'C') for (let i = 0; i < n.length; i += 6) ops.push(appendBezierCurve(n[i], n[i + 1], n[i + 2], n[i + 3], n[i + 4], n[i + 5]));
      else for (let i = 0; i < n.length; i += 2) ops.push(c === 'M' && i === 0 ? moveTo(n[i], n[i + 1]) : lineTo(n[i], n[i + 1]));
    }
    ops.push(yol.dolgu ? (yol.evenodd ? PDFOperator.of(PDFOperatorNames.FillEvenOdd) : fill()) : stroke(), popGraphicsState());
  }
  ops.push(popGraphicsState());
  sayfa.pushOperators(...ops);
}

/** Çizgileri yol olarak çizer: yuvarlak uçlu, kalem mürekkebiyle. Kalınlık ölçekle küçülür, okunur sınırda tutulur. */
function vektorCiz(pdfLib, sayfa, v, kutu) {
  const { pushGraphicsState, popGraphicsState, concatTransformationMatrix, setLineWidth, setLineCap, setLineJoin,
    LineCapStyle, LineJoinStyle, setStrokingRgbColor, moveTo, lineTo, stroke } = pdfLib;
  const s = (kutu.x1 - kutu.x0) / v.w;
  const kalinlik = Math.min(1.15, Math.max(0.7, v.k * s));
  const ops = [
    pushGraphicsState(),
    concatTransformationMatrix(s, 0, 0, -s, kutu.x0, sayfa.getHeight() - kutu.y0),
    setLineWidth(kalinlik / s),
    setLineCap(LineCapStyle.Round),
    setLineJoin(LineJoinStyle.Round),
    setStrokingRgbColor(...MUREKKEP),
  ];
  for (const c of v.cizgiler) {
    ops.push(moveTo(c[0], c[1]));
    if (c.length === 2) ops.push(lineTo(c[0], c[1]));     // tek dokunuş: yuvarlak uçla nokta
    for (let i = 2; i < c.length; i += 2) ops.push(lineTo(c[i], c[i + 1]));
  }
  ops.push(stroke(), popGraphicsState());
  sayfa.pushOperators(...ops);
}
