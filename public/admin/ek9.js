/* EK-9 İhtida Belgesi üretimi — Diyanet'in resmî iki sayfalık (A4 yatay) şablonu üzerine
 * başvuru verilerini, vesikalık fotoğrafı ve imzaları yerleştirir.
 * Ortak şablon Müşavirliğe uyarlanmıştır: diğer kurum seçeneklerinin üstü TR/EN çizilidir.
 * Böylece bütün başvurular aynı kurum seçimini otomatik devralır.
 *
 * Neden panelde: belgeyi düzenleyen makam camidir (başvuran değil) ve şahit imzaları
 * yalnız belge hazırlama ekranındaki açık teyitle kullanılır. İmza görselleri bu yüzden
 * hiçbir zaman herkese açık bir dosyada durmaz; panelin AES-GCM şifreli sır paketinden
 * (giris.html) çözülüp yalnız bellekte kullanılır.
 *
 * Koordinatlar şablondan piksel ölçümüyle çıkarıldı (200 dpi tarama, PDF point cinsinden,
 * ÜST kenardan). pdf-lib alt kenardan ölçtüğü için `ust()` ile çevrilir.
 */

// --- Şablon ölçüleri (pt, üstten) --------------------------------------------
const S1 = {
  foto: { x: 645, y: 203, g: 50, h: 66 },          // sağ üstteki boş çerçevenin içi
  isim: { x0: 270, x1: 588, taban: 265 },          // kaligrafinin üst ve alt uzantıları için başlıkla metin arasındaki boşluk
  sahitSol: { x0: 155, x1: 235, etiketTaban: 424 },
  sahitSag: { x0: 603, x1: 683, etiketTaban: 424 },
  yetkili: { x0: 330, x1: 525, etiketTaban: 424 },
};

// Sol sütun: [etiket sağ kenarı, TR satırının tabanı]
const S2_SOL = {
  belgeNo: [165.9, 104.2], belgeTarihi: [180.4, 133.6], duzenleyen: [245.4, 163],
  adSoyad: [175.5, 192.3], cinsiyet: [165.7, 221.7], ogrenim: [168.5, 251.1],
  anneAdi: [168.8, 280.5], babaAdi: [166.5, 309.9], dogumYeri: [179.9, 339.2],
  dogumTarihi: [189.4, 368.6], medeniHali: [182.2, 398], meslek: [160.7, 427.4],
  uyruk: [159, 456.8], tcKimlik: [247.7, 486.2],
};
const S2_SAG = {
  oncekiDin: [551.2, 104.8], ihtidaSebebi: [512.5, 136.4], ihtidaTarihi: [506.6, 168],
  eposta: [484.2, 199.6], telefon: [513.1, 231.1], adres: [477.6, 262.7],
};
// Basılı "Adı Soyadı / Name Surname" yer tutucusuna başvuranın gerçek adı yazılır.
const S2_ALT = { tarihTaban: 430.3, x0: 700, x1: 780, isimTaban: 453, isimEn: 110 };
const S2_SAG_SINIR = 795;   // sağ sütun metinlerinin taşamayacağı x

/** Adı verilmiş şahit, imzası olmasa da korunur. Yedek yalnız boş şahit yuvasına girer.
 * Kayıtlı imzayı kullanma teyidi panelde alınır; bu fonksiyon isim değiştirmez. */
export function sahitleriCoz(sahitler, yedekler) {
  const varMi = (s) => Boolean(s && (String(s.ad || '').trim() || s.imza));
  const sonuc = [];
  let yedekSira = 0;
  for (let i = 0; i < 2; i++) {
    const s = sahitler[i];
    if (varMi(s)) { sonuc.push({ ad: (s.ad || '').trim(), imza: s.imza, yedek: false }); continue; }
    const y = yedekler[yedekSira++];
    sonuc.push(y ? { ad: y.ad, imza: y.imza, yedek: true } : null);
  }
  return sonuc;
}

const bosMu = (v) => v === undefined || v === null || String(v).trim() === '';

export async function ek9Uret(girdi) {
  const { PDFDocument, rgb } = girdi.pdfLib;
  const fontkit = girdi.fontkit;

  const belge = await PDFDocument.load(girdi.sablonBytes, { parseSpeed: Infinity });
  belge.registerFontkit(fontkit);
  const elYazisi = girdi.alanYazisi !== 'sade' && Boolean(girdi.fontElYazisiBytes);
  const kaligrafik = girdi.isimYazisi !== 'sade' && Boolean(girdi.fontKaligrafiBytes);
  // Caveat alt kümesi ve bağlamsal değişimler bu fontkit sürümünde eksik harf üretiyor.
  // Tam font + standart harfler el yazısı görünümünü koruyarak eksiksiz basılır.
  const font = await belge.embedFont(elYazisi ? girdi.fontElYazisiBytes : girdi.fontBytes, { subset: !elYazisi, features: elYazisi ? { calt: false, liga: false } : undefined });
  const fontIsim = await belge.embedFont(kaligrafik ? girdi.fontKaligrafiBytes : (girdi.fontKalinBytes || girdi.fontBytes), { subset: true });
  const MAVI = rgb(0.08, 0.20, 0.48);
  const SIYAH = rgb(0.09, 0.09, 0.12);
  const MUREKKEP = elYazisi ? MAVI : SIYAH;
  const [s1, s2] = belge.getPages();
  const Y1 = s1.getHeight();
  const Y2 = s2.getHeight();
  const ust1 = (y) => Y1 - y;
  const ust2 = (y) => Y2 - y;

  const v = girdi.veri;

  // ---- yardımcılar ----------------------------------------------------------
  const kisalt = (metin, boyut, enGenis, f = font) => {
    let s = String(metin ?? '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (f.widthOfTextAtSize(s, boyut) <= enGenis) return s;
    girdi.uyar?.('alan-kisaltildi');
    while (s.length > 1 && f.widthOfTextAtSize(s + '…', boyut) > enGenis) s = s.slice(0, -1);
    return s.trimEnd() + '…';
  };
  const sar = (metin, boyut, enGenis, enFazlaSatir) => {
    const kelimeler = String(metin ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const satirlar = [];
    let satir = '';
    for (const k of kelimeler) {
      const aday = satir ? `${satir} ${k}` : k;
      if (font.widthOfTextAtSize(aday, boyut) <= enGenis) satir = aday;
      // Bosluksuz tek uzun kelime (uzun e-posta, birlesik adres) hicbir satira sigmaz;
      // genislige kirpilmazsa alanin disina tasiyordu (25 Agustos 2026 denetimi).
      else { if (satir) satirlar.push(kisalt(satir, boyut, enGenis)); satir = k; }
      if (satirlar.length === enFazlaSatir) break;
    }
    if (satirlar.length < enFazlaSatir && satir) satirlar.push(kisalt(satir, boyut, enGenis));
    if (satirlar.length === enFazlaSatir && kelimeler.length) {
      const son = satirlar[enFazlaSatir - 1];
      const kalan = kelimeler.slice(satirlar.join(' ').split(' ').length).length;
      if (kalan > 0) { girdi.uyar?.('alan-kisaltildi'); satirlar[enFazlaSatir - 1] = kisalt(son + ' …', boyut, enGenis); }
    }
    return satirlar;
  };
  const yaz = (sayfa, metin, x, tabanY, boyut, cevir, f = font) => {
    if (bosMu(metin)) return;
    sayfa.drawText(String(metin), { x, y: cevir(tabanY), size: boyut, font: f, color: MUREKKEP });
  };
  const yazOrtali = (sayfa, metin, x0, x1, tabanY, boyut, cevir, f = font, renk = MUREKKEP) => {
    if (bosMu(metin)) return;
    const g = f.widthOfTextAtSize(String(metin), boyut);
    sayfa.drawText(String(metin), { x: x0 + (x1 - x0 - g) / 2, y: cevir(tabanY), size: boyut, font: f, color: renk });
  };
  /** Telefon kamerasi WEBP/HEIC uretebilir; pdf-lib yalniz PNG ve JPEG gomer.
   *  Desteklenmeyen bicim eskiden sessizce atlaniyor, EK-9 vesikaliksiz basiliyordu.
   *  Once dogrudan denenir, olmazsa tarayicinin cozebildigi her bicim canvas uzerinden
   *  PNG'ye cevrilir (25 Agustos 2026 denetimi). */
  const pngeCevir = async (veri) => {
    const kaynak = typeof veri === 'string'
      ? (veri.startsWith('data:') ? veri : 'data:image/*;base64,' + veri)
      : URL.createObjectURL(new Blob([veri]));
    try {
      const img = await new Promise((coz, sik) => {
        const g = new Image();
        g.onload = () => coz(g);
        g.onerror = () => sik(new Error('gorsel-cozulemedi'));
        g.src = kaynak;
      });
      const tuval = document.createElement('canvas');
      tuval.width = img.naturalWidth || img.width;
      tuval.height = img.naturalHeight || img.height;
      if (!tuval.width || !tuval.height) return null;
      tuval.getContext('2d').drawImage(img, 0, 0);
      return tuval.toDataURL('image/png');
    } finally {
      if (typeof veri !== 'string') URL.revokeObjectURL(kaynak);
    }
  };
  const gorselGom = async (veri) => {
    if (!veri) return null;
    try {
      if (typeof veri === 'string') {
        return veri.startsWith('data:image/png') || veri.startsWith('iVBOR')
          ? await belge.embedPng(veri)
          : await belge.embedJpg(veri);
      }
      // Uint8Array: PNG imzası 0x89 'P' 'N' 'G'
      return veri[0] === 0x89 ? await belge.embedPng(veri) : await belge.embedJpg(veri);
    } catch { /* bicim desteklenmiyor olabilir — asagida cevrilir */ }
    try {
      const png = await pngeCevir(veri);
      return png ? await belge.embedPng(png) : null;
    } catch { return null; }
  };
  /** Görseli kutuya sığdırır (oran korunur, ortalanır) — vesikalık için "cover" değil "contain". */
  const kutuyaCiz = (sayfa, gorsel, x, ustY, g, h, cevir) => {
    const olcek = Math.min(g / gorsel.width, h / gorsel.height);
    const gg = gorsel.width * olcek;
    const hh = gorsel.height * olcek;
    sayfa.drawImage(gorsel, { x: x + (g - gg) / 2, y: cevir(ustY + h) + (h - hh) / 2, width: gg, height: hh });
  };
  // Siyah imza çizgilerinin PDF renk eşlemesi; şekil, çözünürlük ve saydamlık korunur.
  const imzayiMaviYap = async im => {
    if (!elYazisi) return;
    await im.embed();
    const nesne = belge.context.lookup(im.ref);
    if (nesne.dict.get(girdi.pdfLib.PDFName.of('ColorSpace'))?.toString() === '/DeviceRGB') {
      nesne.dict.set(girdi.pdfLib.PDFName.of('Decode'), belge.context.obj([.08, 1, .20, 1, .48, 1]));
    }
  };

  // ---- Sayfa 1: belge yüzü --------------------------------------------------
  const foto = await gorselGom(girdi.foto);
  if (foto) kutuyaCiz(s1, foto, S1.foto.x, S1.foto.y, S1.foto.g, S1.foto.h, ust1);
  // Vesikalik verildigi halde gomulemediyse cagirana bildirilir; belge sessizce
  // fotografsiz cikmasin (panel bunu kullaniciya uyari olarak gosterir).
  else if (girdi.foto && typeof girdi.uyar === 'function') girdi.uyar('vesikalik-gomulemedi');

  // Not: büyük harfe çevrilmez — `toLocaleUpperCase('tr')` yabancı isimlerde "i"yi "İ" yapıp
  // POUİLLON gibi hatalı yazıma yol açıyor. İsim kimlikteki gibi, girildiği hâliyle basılır.
  const adSoyad = `${v.adSoyad || ''}`.trim();
  // Resmî adlar üç noktayla kesilmez; gerekirse yazı küçültülür.
  const siganBoyut = (metin, boyut, en, f = font) => Math.min(boyut, en / Math.max(1, f.widthOfTextAtSize(String(metin || ''), 1)));
  const adBoyut = siganBoyut(adSoyad, kaligrafik ? 24 : 13, S1.isim.x1 - S1.isim.x0 - 4, fontIsim);
  if (adBoyut < 7) girdi.uyar?.('yazi-kucuk');
  yazOrtali(s1, adSoyad, S1.isim.x0, S1.isim.x1, kaligrafik ? S1.isim.taban : 258, adBoyut, ust1, fontIsim, kaligrafik ? MAVI : SIYAH);

  const sahitler = sahitleriCoz(girdi.sahitler || [], girdi.yedekImzalar || []);
  const alanlar = [S1.sahitSol, S1.sahitSag];
  for (let i = 0; i < 2; i++) {
    const s = sahitler[i];
    if (!s) continue;
    const alan = alanlar[i];
    const im = await gorselGom(s.imza);
    if (s.imza && !im) throw new Error(`${i + 1}. şahidin imzası okunamadı; belge hazırlanamadı.`);
    if (im) {
      await imzayiMaviYap(im);
      // İmza, şahit etiketinin altındaki boş alana yerleşir; büyüyen adla çakışmaz.
      const kutuG = alan.x1 - alan.x0 + 26;
      const kutuH = 30;
      const x = alan.x0 - 13;
      kutuyaCiz(s1, im, x, alan.etiketTaban + 8, kutuG, kutuH, ust1);
    }
    if (s.ad) {
      const boyut = siganBoyut(s.ad, elYazisi ? 12 : 7, alan.x1 - alan.x0 + 40);
      if (boyut < 6) girdi.uyar?.('yazi-kucuk');
      yazOrtali(s1, s.ad, alan.x0 - 20, alan.x1 + 20, alan.etiketTaban - 12, boyut, ust1);
    }
  }

  // Yetkili adı ve unvanı resmî siyah yazıyla hazırdır; ıslak imza alanı boş kalır.
  const resmi = await belge.embedFont(girdi.fontBytes, { subset: true });
  const resmiKalin = await belge.embedFont(girdi.fontKalinBytes || girdi.fontBytes, { subset: true });
  const yetkiliAd = girdi.yetkiliAd ?? 'Salih GÖR';
  const yetkiliUnvan = girdi.yetkiliUnvan ?? 'T.C. Brüksel Büyükelçiliği Sosyal İşler Müşaviri';
  yazOrtali(s1, yetkiliAd, S1.yetkili.x0, S1.yetkili.x1, 401, siganBoyut(yetkiliAd, 12, 240, resmiKalin), ust1, resmiKalin, rgb(0, 0, 0));
  yazOrtali(s1, yetkiliUnvan, S1.yetkili.x0, S1.yetkili.x1, 415, siganBoyut(yetkiliUnvan, 10, 255, resmi), ust1, resmi, rgb(0, 0, 0));
  // Yalnız açıkça verilmiş bir yetkili imzası varsa kullanılır.
  if (girdi.yetkiliImza) {
    const im = await gorselGom(girdi.yetkiliImza);
    if (im) kutuyaCiz(s1, im, S1.yetkili.x0 + 20, 437, S1.yetkili.x1 - S1.yetkili.x0 - 40, 24, ust1);
  }

  // ---- Sayfa 2: künye ------------------------------------------------------
  const BOY = elYazisi ? 14 : 9.5;
  const solYaz = (anahtar, deger, boyut = BOY) => {
    const [x, taban] = S2_SOL[anahtar];
    const sigan = siganBoyut(deger, boyut, 415 - (x + 7));
    if (sigan < 7) girdi.uyar?.('yazi-kucuk');
    yaz(s2, deger, x + 7, taban, sigan, ust2);
  };
  solYaz('belgeNo', v.belgeNo);
  solYaz('belgeTarihi', v.belgeTarihi);
  solYaz('duzenleyen', v.duzenleyen);
  solYaz('adSoyad', adSoyad);
  solYaz('cinsiyet', v.cinsiyet);
  solYaz('ogrenim', v.ogrenim);
  solYaz('anneAdi', v.anneAdi);
  solYaz('babaAdi', v.babaAdi);
  solYaz('dogumYeri', v.dogumYeri);
  solYaz('dogumTarihi', v.dogumTarihi);
  solYaz('medeniHali', v.medeniHali);
  solYaz('meslek', v.meslek);
  solYaz('uyruk', v.uyruk);
  solYaz('tcKimlik', v.tcKimlik);

  const sagYaz = (anahtar, deger, satirSayisi = 1, boyut = BOY) => {
    const [x, taban] = S2_SAG[anahtar];
    const genislik = S2_SAG_SINIR - (x + 7);
    if (girdi.uzunAlan && !bosMu(deger)) {
      let satir = '', adet = 1, tasiyor = false;
      for (const kelime of String(deger).trim().split(/\s+/)) {
        if (font.widthOfTextAtSize(kelime, boyut) > genislik) tasiyor = true;
        const aday = satir ? satir + ' ' + kelime : kelime;
        if (font.widthOfTextAtSize(aday, boyut) <= genislik) satir = aday;
        else { if (satir) adet++; satir = kelime; }
      }
      if (tasiyor || adet > satirSayisi) {
        girdi.uzunAlan(anahtar, String(deger));
        yaz(s2, 'Ek açıklama sayfasında / See supplement', x + 7, taban, elYazisi ? 11 : 8, ust2);
        return;
      }
    }
    if (satirSayisi === 1) { yaz(s2, kisalt(deger, boyut, genislik), x + 7, taban, boyut, ust2); return; }
    // İlk satır etiketin sağında durur; alt satırlar İngilizce etiketin ALTINDAN başlar
    // (aksi hâlde uzun adresin ikinci satırı "Adress" yazısının üstüne biniyordu).
    const satirlar = sar(deger, boyut, genislik, satirSayisi);
    satirlar.forEach((s, i) => yaz(s2, s, i === 0 ? x + 7 : 448, taban + (i === 0 ? 0 : 11 + i * 12), boyut, ust2));
  };
  sagYaz('oncekiDin', v.oncekiDin);
  sagYaz('ihtidaSebebi', v.ihtidaSebebi, 1, elYazisi ? 13 : 8.6);   // alanın altında EN etiketi var: tek satır
  sagYaz('ihtidaTarihi', v.ihtidaTarihi);
  sagYaz('eposta', v.eposta, 1, elYazisi ? 13.5 : 9);
  sagYaz('telefon', v.telefon);
  sagYaz('adres', v.adres, 3);

  // Alt blok: beyan tarihi, başvuranın tam adı ve varsa imzası.
  // ".../.../......" yer tutucusu beyaz kutuyla örtülür (zemin beyaz) ve tarih yerine basılır.
  if (!bosMu(v.beyanTarihi)) {
    s2.drawRectangle({ x: S2_ALT.x0 + 22, y: ust2(S2_ALT.tarihTaban + 2), width: 84, height: 13, color: rgb(1, 1, 1) });
    yazOrtali(s2, v.beyanTarihi, S2_ALT.x0, S2_ALT.x1, S2_ALT.tarihTaban, BOY, ust2);
  }
  if (adSoyad) {
    s2.drawRectangle({ x: 700, y: ust2(465), width: 94, height: 30, color: rgb(1, 1, 1) });
    const boyut = siganBoyut(adSoyad, BOY, S2_ALT.isimEn);
    if (boyut < 7) girdi.uyar?.('yazi-kucuk');
    yazOrtali(s2, adSoyad, S2_ALT.x0, S2_ALT.x1, S2_ALT.isimTaban, boyut, ust2);
  }
  const basvuranImza = await gorselGom(girdi.basvuranImza);
  if (girdi.basvuranImza && !basvuranImza) throw new Error('Başvuranın imzası okunamadı; imzalı EK-9 hazırlanamadı.');
  if (basvuranImza) kutuyaCiz(s2, basvuranImza, S2_ALT.x0 - 4, S2_ALT.tarihTaban - 46, 108, 28, ust2);

  belge.setTitle(`İhtida Belgesi (EK-9) — ${v.adSoyad || ''}`.trim());
  belge.setSubject('T.C. Cumhurbaşkanlığı Diyanet İşleri Başkanlığı — İhtida Belgesi');
  belge.setCreator('Marche-en-Famenne Ulu Camii — yönetim paneli');
  if (girdi.tarih) { belge.setCreationDate(girdi.tarih); belge.setModificationDate(girdi.tarih); }

  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}
