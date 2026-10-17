/** Belge doldurma kalemi: mavi dolma kalemle yazılmış kaligrafik el yazısı (KALICI KURAL).
 *
 * Rıdvan, 17.10.2026: «belge doldurmak için bu mavi dolma kalemle yazılmış kaligrafik yazı biçimi ve stili, bizim
 * kalıcı kuralımız olsun». Formdan gelen her değer (ad, tarih, adres, e-posta, telefon, şahit adları…) bu modülle
 * yazılır: Allura (SIL OFL 1.1) ve kraliyet mavisi mürekkep #1A3D9E. İmzalar da aynı mürekkebe boyanır.
 *
 * Mühtedi Koordinatörlüğünün belge hattındaki kalem.py'nin (D:\muhtedi-koordinatorlugu\_tarama\araclar\kalem.py)
 * birebir karşılığıdır: aynı boylar, aynı harf aralığı ve kelime başına aynı taban/eğim oynaması. Oynama, Python'un
 * random.Random(metin) dizisinden üretilir (MT19937 + SHA-512 tohumu); böylece site ile koordinatörlüğün belgeleri
 * aynı metin için aynı el yazısını verir. Panel, Apps Script ve Node aynı kodu kullanır (TextEncoder/crypto yok).
 */

export const MUREKKEP = [0.10, 0.24, 0.62];      // #1A3D9E
export const ALAN_BOY = 16.0;                     // tek satırlık form alanı
// Tamamı büyük harfli kelimeler (soyadlar) harf harf, aralık açılarak yazılır: Allura'nın büyük harfleri bitişince
// «UN» gibi çiftler birleşip okunmuyordu (kalem.py, 17.10.2026).
export const BUYUK_HARF_ARASI = 0.10;             // em
// Allura'nın tanımlı GSUB özellikleri kapatılır: kalem.py harfleri cmap'ten tek tek yazar (bitişik yazım, kuyruk
// ve süs biçimleri yok). Özellikler açık kalırsa aynı metin farklı glif dizisine dönüşür.
export const KALEM_OZELLIKLERI = {
  aalt: false, case: false, ccmp: false, dlig: false, fina: false, frac: false, hlig: false, liga: false, lnum: false,
  onum: false, ordn: false, salt: false, ss01: false, ss02: false, sups: false, swsh: false, kern: false, mark: false,
  mkmk: false, calt: false, clig: false, rlig: false, locl: false,
};

/* ---------- SHA-512 (UTF-8 bayt dizisi → 64 bayt) ----------
   BigInt yok: Apps Script kod kaydında BigInt değişmezlerini (0n) «ParseError» ile reddediyor (17 Eki 2026).
   64 bitlik sözcük [yüksek, alçak] 32 bitlik çifttir. Python'un hashlib.sha512'siyle eşliği tests/kalem.test.mjs sınar. */
const K512 = [
  '428a2f98d728ae22', '7137449123ef65cd', 'b5c0fbcfec4d3b2f', 'e9b5dba58189dbbc', '3956c25bf348b538', '59f111f1b605d019',
  '923f82a4af194f9b', 'ab1c5ed5da6d8118', 'd807aa98a3030242', '12835b0145706fbe', '243185be4ee4b28c', '550c7dc3d5ffb4e2',
  '72be5d74f27b896f', '80deb1fe3b1696b1', '9bdc06a725c71235', 'c19bf174cf692694', 'e49b69c19ef14ad2', 'efbe4786384f25e3',
  '0fc19dc68b8cd5b5', '240ca1cc77ac9c65', '2de92c6f592b0275', '4a7484aa6ea6e483', '5cb0a9dcbd41fbd4', '76f988da831153b5',
  '983e5152ee66dfab', 'a831c66d2db43210', 'b00327c898fb213f', 'bf597fc7beef0ee4', 'c6e00bf33da88fc2', 'd5a79147930aa725',
  '06ca6351e003826f', '142929670a0e6e70', '27b70a8546d22ffc', '2e1b21385c26c926', '4d2c6dfc5ac42aed', '53380d139d95b3df',
  '650a73548baf63de', '766a0abb3c77b2a8', '81c2c92e47edaee6', '92722c851482353b', 'a2bfe8a14cf10364', 'a81a664bbc423001',
  'c24b8b70d0f89791', 'c76c51a30654be30', 'd192e819d6ef5218', 'd69906245565a910', 'f40e35855771202a', '106aa07032bbd1b8',
  '19a4c116b8d2d0c8', '1e376c085141ab53', '2748774cdf8eeb99', '34b0bcb5e19b48a8', '391c0cb3c5c95a63', '4ed8aa4ae3418acb',
  '5b9cca4f7763e373', '682e6ff3d6b2b8a3', '748f82ee5defb2fc', '78a5636f43172f60', '84c87814a1f0ab72', '8cc702081a6439ec',
  '90befffa23631e28', 'a4506cebde82bde9', 'bef9a3f7b2c67915', 'c67178f2e372532b', 'ca273eceea26619c', 'd186b8c721c0c207',
  'eada7dd6cde0eb1e', 'f57d4f7fee6ed178', '06f067aa72176fba', '0a637dc5a2c898a6', '113f9804bef90dae', '1b710b35131c471b',
  '28db77f523047d84', '32caab7b40c72493', '3c9ebe0a15c9bebc', '431d67c49c100d4c', '4cc5d4becb3e42b6', '597f299cfc657e2a',
  '5fcb6fab3ad6faec', '6c44198c4a475817',
].map(h => [parseInt(h.slice(0, 8), 16), parseInt(h.slice(8), 16)]);
const H512 = ['6a09e667f3bcc908', 'bb67ae8584caa73b', '3c6ef372fe94f82b', 'a54ff53a5f1d36f1', '510e527fade682d1',
  '9b05688c2b3e6c1f', '1f83d9abfb41bd6b', '5be0cd19137e2179'].map(h => [parseInt(h.slice(0, 8), 16), parseInt(h.slice(8), 16)]);
const IKI32 = 4294967296;
/** 64 bit sağa döndürme, 0 < n < 64 (n = 32 kullanılmaz). */
const rotr = ([h, l], n) => (n < 32
  ? [(h >>> n) | (l << (32 - n)), (l >>> n) | (h << (32 - n))]
  : [(l >>> (n - 32)) | (h << (64 - n)), (h >>> (n - 32)) | (l << (64 - n))]);
const shr = ([h, l], n) => [h >>> n, (l >>> n) | (h << (32 - n))];
const x3 = (a, b, c) => [a[0] ^ b[0] ^ c[0], a[1] ^ b[1] ^ c[1]];
/** mod 2^64 toplam; ^ ve | işaretli sonuç verdiğinden her parça önce işaretsize çevrilir. */
const topla = (...p) => {
  let h = 0, l = 0;
  for (const [a, b] of p) { h += a >>> 0; l += b >>> 0; }
  return [(h + Math.floor(l / IKI32)) >>> 0, l >>> 0];
};

export function sha512(bayt) {
  const uzunluk = bayt.length;
  const blok = Math.ceil((uzunluk + 17) / 128) * 128;
  const v = new Uint8Array(blok);
  v.set(bayt); v[uzunluk] = 0x80;
  // Bit uzunluğu 128 bitlik alanın son 8 baytına büyük sonlu yazılır (2^53'ün altında; üst 8 bayt sıfır kalır).
  const bit = uzunluk * 8, bitY = Math.floor(bit / IKI32), bitA = bit >>> 0;
  for (let j = 0; j < 4; j++) { v[blok - 1 - j] = (bitA >>> (8 * j)) & 255; v[blok - 5 - j] = (bitY >>> (8 * j)) & 255; }
  const oku = i => ((v[i] << 24) | (v[i + 1] << 16) | (v[i + 2] << 8) | v[i + 3]) >>> 0;
  const h = H512.map(x => x.slice());
  const w = new Array(80);
  for (let o = 0; o < blok; o += 128) {
    for (let t = 0; t < 16; t++) w[t] = [oku(o + t * 8), oku(o + t * 8 + 4)];
    for (let t = 16; t < 80; t++) {
      const s0 = x3(rotr(w[t - 15], 1), rotr(w[t - 15], 8), shr(w[t - 15], 7));
      const s1 = x3(rotr(w[t - 2], 19), rotr(w[t - 2], 61), shr(w[t - 2], 6));
      w[t] = topla(w[t - 16], s0, w[t - 7], s1);
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 80; t++) {
      const S1 = x3(rotr(e, 14), rotr(e, 18), rotr(e, 41));
      const ch = [(e[0] & f[0]) ^ (~e[0] & g[0]), (e[1] & f[1]) ^ (~e[1] & g[1])];
      const t1 = topla(hh, S1, ch, K512[t], w[t]);
      const S0 = x3(rotr(a, 28), rotr(a, 34), rotr(a, 39));
      const maj = [(a[0] & b[0]) ^ (a[0] & c[0]) ^ (b[0] & c[0]), (a[1] & b[1]) ^ (a[1] & c[1]) ^ (b[1] & c[1])];
      const t2 = topla(S0, maj);
      hh = g; g = f; f = e; e = topla(d, t1); d = c; c = b; b = a; a = topla(t1, t2);
    }
    [a, b, c, d, e, f, g, hh].forEach((x, i) => { h[i] = topla(h[i], x); });
  }
  const sonuc = new Uint8Array(64);
  h.forEach(([y, a], i) => {
    for (let j = 0; j < 4; j++) { sonuc[i * 8 + 3 - j] = (y >>> (8 * j)) & 255; sonuc[i * 8 + 7 - j] = (a >>> (8 * j)) & 255; }
  });
  return sonuc;
}

/** Apps Script'te TextEncoder yok: UTF-8 elle kodlanır (yalnız geçerli UTF-16 bekler). */
export function utf8(metin) {
  const out = [];
  for (const ch of String(metin)) {
    const c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

/** Python'un random.Random(metin) üreteci: MT19937, sürüm 2 tohumu (metin + SHA-512 özeti, büyük sonlu tamsayı). */
export class PyRandom {
  constructor(metin) {
    const bayt = utf8(metin);
    const tum = new Uint8Array(bayt.length + 64);
    tum.set(bayt); tum.set(sha512(bayt), bayt.length);
    // Python: int.from_bytes(tum, 'big') → 32 bitlik sözcükler, en anlamsızı önce; en üstteki sıfır sözcükler atılır.
    const anahtar = [];
    for (let son = tum.length; son > 0; son -= 4) {
      let x = 0;
      for (let k = Math.max(0, son - 4); k < son; k++) x = x * 256 + tum[k];
      anahtar.push(x >>> 0);
    }
    while (anahtar.length > 1 && anahtar[anahtar.length - 1] === 0) anahtar.pop();
    this.mt = new Uint32Array(624);
    this.mti = 625;
    this._initByArray(anahtar);
  }

  _initGenrand(s) {
    const mt = this.mt;
    mt[0] = s >>> 0;
    for (let i = 1; i < 624; i++) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (Math.imul(1812433253, p) + i) >>> 0;
    }
    this.mti = 624;
  }

  _initByArray(key) {
    const mt = this.mt;
    this._initGenrand(19650218);
    let i = 1, j = 0;
    for (let k = Math.max(624, key.length); k; k--) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(p, 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
      if (j >= key.length) j = 0;
    }
    for (let k = 623; k; k--) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(p, 1566083941)) - i) >>> 0;
      i++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
    }
    mt[0] = 0x80000000;
  }

  _uint32() {
    const mt = this.mt;
    if (this.mti >= 624) {
      for (let k = 0; k < 624; k++) {
        const y = (mt[k] & 0x80000000) | (mt[(k + 1) % 624] & 0x7fffffff);
        mt[k] = mt[(k + 397) % 624] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      this.mti = 0;
    }
    let y = mt[this.mti++];
    y ^= y >>> 11;
    y = (y ^ ((y << 7) & 0x9d2c5680)) >>> 0;
    y = (y ^ ((y << 15) & 0xefc60000)) >>> 0;
    return (y ^ (y >>> 18)) >>> 0;
  }

  random() {
    const a = this._uint32() >>> 5, b = this._uint32() >>> 6;
    return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
  }

  uniform(a, b) { return a + (b - a) * this.random(); }
}

/* ---------- kalem ---------- */

const harfMi = c => /\p{L}/u.test(c);
const buyukMu = c => c !== c.toLowerCase() && c === c.toUpperCase();
/** Python str.isupper() eşleniği: en az iki harf ve harflerin hepsi büyük. */
const buyukKelime = kelime => {
  const harfler = [...kelime].filter(harfMi);
  return harfler.length >= 2 && harfler.every(buyukMu);
};

/** Allura gömülü belge için kalem. `font`, belge.embedFont(Allura, { features: KALEM_OZELLIKLERI }) sonucudur;
 *  `yedekFont` Allura'da bulunmayan harfler için (ör. Kiril) aynı mürekkeple kullanılır. Koordinatlar kalem.py gibi
 *  SOL ÜST köşeden pt'dir; taban = yazı çizgisi. */
export function kalemKur(pdfLib, font, yedekFont = null) {
  const { pushGraphicsState, popGraphicsState, concatTransformationMatrix, beginText, endText, setFontAndSize,
    setTextRenderingMode, TextRenderingMode, setLineWidth, setStrokingRgbColor, setFillingRgbColor, setTextMatrix,
    showText, PDFOperator, PDFNumber, PDFHexString } = pdfLib;
  const fk = font.embedder?.font;
  if (!fk) throw new Error('Kalem yazı tipi okunamadı.');
  const birim = 1 / fk.unitsPerEm;
  const glif = c => fk.glyphForCodePoint(c.codePointAt(0));
  const destekli = metin => [...String(metin)].every(c => c === ' ' || glif(c).id !== 0);
  const tlen = (metin, boyut) => [...metin].reduce((t, c) => t + glif(c).advanceWidth, 0) * birim * boyut;
  const kelimeEn = (kelime, boyut) => {
    const g = tlen(kelime, boyut);
    return buyukKelime(kelime) ? g + ([...kelime].length - 1) * BUYUK_HARF_ARASI * boyut : g;
  };
  const en = (metin, boyut) => {
    const bosluk = tlen(' ', boyut);
    const k = String(metin).split(' ');
    return (k.reduce((t, x) => t + kelimeEn(x, boyut), 0) + bosluk * (k.length - 1)) * 1.03;
  };
  const sigdir = (metin, boyut, genislik, enKucuk = 9.0) => {
    while (en(metin, boyut) > genislik && boyut > enKucuk) boyut -= 0.25;
    return boyut;
  };
  // kalem.py harfleri cmap'ten tek tek yazar; harf harf kodlamak bitişik yazım özelliklerini dışarıda bırakır.
  const kodla = parca => PDFHexString.of([...parca].map(c => font.encodeText(c).asString()).join(''));

  /** Tek satır el yazısı: (x, taban) ilk harfin başı ve yazı çizgisi (sayfanın üstünden). */
  const yaz = (sayfa, x, taban, metin, boyut, renk = MUREKKEP) => {
    metin = String(metin);
    if (yedekFont && !destekli(metin)) {   // Allura'da olmayan harf: aynı mürekkeple düz yazı (uydurma glif basılmaz)
      sayfa.drawText(metin, { x, y: sayfa.getHeight() - taban, size: boyut * 0.62, font: yedekFont, color: pdfLib.rgb(...renk) });
      return x + yedekFont.widthOfTextAtSize(metin, boyut * 0.62);
    }
    const rnd = new PyRandom(metin);
    const H = sayfa.getHeight();
    const anahtar = sayfa.node.newFontDictionary(font.name, font.ref);
    const bosluk = tlen(' ', boyut);
    for (const kelime of metin.split(' ')) {
      const dy = rnd.uniform(-0.45, 0.35), aci = rnd.uniform(0.6, 2.0);
      if (kelime) {
        const px = x, py = H - (taban + dy);
        const r = aci * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
        const parcalar = buyukKelime(kelime) ? [...kelime] : [kelime];
        const ara = parcalar.length > 1 ? BUYUK_HARF_ARASI * boyut : 0;
        let xx = x;
        for (const parca of parcalar) {
          sayfa.pushOperators(
            pushGraphicsState(),
            concatTransformationMatrix(cs, sn, -sn, cs, px * (1 - cs) + py * sn, py * (1 - cs) - px * sn),
            beginText(),
            setFontAndSize(anahtar, boyut),
            setTextRenderingMode(TextRenderingMode.FillAndOutline ?? 2),
            setLineWidth(0.02 * boyut),
            PDFOperator.of('M', [PDFNumber.of(1)]),
            setStrokingRgbColor(...renk),
            setFillingRgbColor(...renk),
            setTextMatrix(1, 0, 0, 1, xx, py),
            showText(kodla(parca)),
            endText(),
            popGraphicsState(),
          );
          xx += tlen(parca, boyut) + ara;
        }
      }
      x += (kelimeEn(kelime, boyut) + bosluk) * rnd.uniform(1.0, 1.06);
    }
    return x;
  };

  /** Çizgili alana (x0, üst, x1, taban) sola yaslı yazar; sığmazsa küçültür. */
  const alanaYaz = (sayfa, alan, metin, boyut = ALAN_BOY, { iceri = 5.0, yukari = 3.4, renk = MUREKKEP, enKucuk = 9.0 } = {}) => {
    const [x0, , x1, taban] = alan;
    const b = sigdir(metin, boyut, x1 - x0 - iceri - 2, enKucuk);
    yaz(sayfa, x0 + iceri, taban - yukari, metin, b, renk);
    return b;
  };

  const ortaliYaz = (sayfa, x0, x1, taban, metin, boyut, { renk = MUREKKEP, enKucuk = 9.0 } = {}) => {
    const b = sigdir(metin, boyut, x1 - x0, enKucuk);
    yaz(sayfa, x0 + (x1 - x0 - en(metin, b)) / 2, taban, metin, b, renk);
    return b;
  };

  /** Kelime sınırından satırlara böler (tek kelime sığmazsa kendi satırında kalır). */
  const sar = (metin, boyut, genislik) => {
    const satirlar = [];
    let satir = '';
    for (const k of String(metin).split(/\s+/).filter(Boolean)) {
      const aday = `${satir} ${k}`.trim();
      if (satir && en(aday, boyut) > genislik) { satirlar.push(satir); satir = k; }
      else satir = aday;
    }
    return satir ? [...satirlar, satir] : satirlar;
  };

  return { en, sigdir, yaz, alanaYaz, ortaliYaz, sar, destekli };
}

/** Elle yazılan ad biçimleri (kalem.py «ad_bicimleri»): tamamı büyük harfli kelimeler soyaddır; yoksa son kelime.
 *  yazili: [«Ad SOYAD», «SOYAD Ad»] · el: [«Ad Soyad», «Soyad Ad»] (kaligrafide büyük harfli soyad okunmuyor). */
export function adBicimleri(adSoyad) {
  const p = String(adSoyad || '').trim().split(/\s+/).filter(Boolean);
  const soyMu = x => [...x].length > 1 && buyukKelime(x);
  let soy = p.filter(soyMu);
  if (!soy.length) soy = p.slice(-1);
  const bas = x => [...x].slice(0, 1).join('').toLocaleUpperCase(dilYerel(x)) + [...x].slice(1).join('').toLocaleLowerCase(dilYerel(x));
  // Formda ad soyad tek alandır ve serbest yazılır («jean dupont»): küçük harfle yazılmış ad baş harfle,
  // soyad resmî alanlarda yine BÜYÜK harfle çıkar. Kişinin kendi büyük/küçük harf seçimi (McDonald, Jean-Luc) korunur.
  const basBuyuk = x => (x === x.toLocaleLowerCase(dilYerel(x))
    ? x.split('-').map(y => [...y].slice(0, 1).join('').toLocaleUpperCase(dilYerel(x)) + [...y].slice(1).join('')).join('-') : x);
  const ad = p.filter(x => !soy.includes(x)).map(basBuyuk);
  const buyuk = soy.map(x => x.toLocaleUpperCase(dilYerel(x)));
  return {
    yazili: [[...ad, ...buyuk].join(' '), [...buyuk, ...ad].join(' ')],
    el: [[...ad, ...soy.map(bas)].join(' '), [...soy.map(bas), ...ad].join(' ')],
  };
}

/** Türkçe harf taşıyan adlarda tr kuralı (İ/ı); yabancı adlarda en (POUİLLON hatası olmasın). */
export function dilYerel(metin) {
  return /[çğışöüÇĞİŞÖÜ]/.test(String(metin)) ? 'tr' : 'en';
}
