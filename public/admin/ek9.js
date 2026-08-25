/* EK-9 İhtida Belgesi üretimi — Diyanet'in resmî iki sayfalık (A4 yatay) şablonu üzerine
 * başvuru verilerini, vesikalık fotoğrafı ve imzaları yerleştirir.
 *
 * Neden panelde: belgeyi düzenleyen makam camidir (başvuran değil) ve şahit imzaları
 * gerektiğinde din görevlisinin kendi imzasıyla tamamlanır. İmza görselleri bu yüzden
 * hiçbir zaman herkese açık bir dosyada durmaz; panelin AES-GCM şifreli sır paketinden
 * (giris.html) çözülüp yalnız bellekte kullanılır.
 *
 * Koordinatlar şablondan piksel ölçümüyle çıkarıldı (200 dpi tarama, PDF point cinsinden,
 * ÜST kenardan). pdf-lib alt kenardan ölçtüğü için `ust()` ile çevrilir.
 */

// --- Şablon ölçüleri (pt, üstten) --------------------------------------------
const S1 = {
  foto: { x: 645, y: 203, g: 50, h: 66 },          // sağ üstteki boş çerçevenin içi
  isim: { x0: 345, x1: 512, taban: 258 },          // noktalı satırın hemen üstü
  sahitSol: { x0: 155, x1: 235, etiketTaban: 424 },
  sahitSag: { x0: 630, x1: 710, etiketTaban: 424 },
  yetkili: { x0: 355, x1: 545, etiketTaban: 424 },
};

// Sol sütun: [etiket sağ kenarı, TR satırının tabanı]
const S2_SOL = {
  belgeNo: [153.6, 100], belgeTarihi: [167.7, 131], duzenleyen: [232.8, 162],
  adSoyad: [163.0, 192], cinsiyet: [152.9, 223], ogrenim: [155.8, 252],
  anneAdi: [156.5, 283], babaAdi: [154.0, 313], dogumYeri: [168.0, 345],
  dogumTarihi: [177.0, 375], medeniHali: [169.5, 405], meslek: [147.5, 436],
  uyruk: [148.6, 467], tcKimlik: [284.3, 498],
};
const S2_SAG = {
  oncekiDin: [552.7, 99], ihtidaSebebi: [511.3, 133], ihtidaTarihi: [507.7, 166],
  eposta: [485.4, 200], telefon: [513.1, 232], adres: [478.5, 265],
};
const S2_ALT = { tarihTaban: 440, x0: 700, x1: 800, isimTaban: 454 };
const S2_SAG_SINIR = 795;   // sağ sütun metinlerinin taşamayacağı x

/** Şahit imzası çözümü: verilmeyen imzalar sırayla din görevlisi ve eşiyle tamamlanır.
 *  (Kullanıcı kuralı: bir imza eksikse Rıdvan Kayahan, iki imza da eksikse ikincisi Yeliz Kayahan.) */
export function sahitleriCoz(sahitler, yedekler) {
  const varMi = (s) => Boolean(s && s.imza);
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

  const belge = await PDFDocument.load(girdi.sablonBytes);
  belge.registerFontkit(fontkit);
  const font = await belge.embedFont(girdi.fontBytes, { subset: true });
  const fontKalin = girdi.fontKalinBytes ? await belge.embedFont(girdi.fontKalinBytes, { subset: true }) : font;

  const MUREKKEP = rgb(0.09, 0.09, 0.12);
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
      if (kalan > 0) satirlar[enFazlaSatir - 1] = kisalt(son + ' …', boyut, enGenis);
    }
    return satirlar;
  };
  const yaz = (sayfa, metin, x, tabanY, boyut, cevir, f = font) => {
    if (bosMu(metin)) return;
    sayfa.drawText(String(metin), { x, y: cevir(tabanY), size: boyut, font: f, color: MUREKKEP });
  };
  const yazOrtali = (sayfa, metin, x0, x1, tabanY, boyut, cevir, f = font) => {
    if (bosMu(metin)) return;
    const g = f.widthOfTextAtSize(String(metin), boyut);
    sayfa.drawText(String(metin), { x: x0 + (x1 - x0 - g) / 2, y: cevir(tabanY), size: boyut, font: f, color: MUREKKEP });
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

  // ---- Sayfa 1: belge yüzü --------------------------------------------------
  const foto = await gorselGom(girdi.foto);
  if (foto) kutuyaCiz(s1, foto, S1.foto.x, S1.foto.y, S1.foto.g, S1.foto.h, ust1);
  // Vesikalik verildigi halde gomulemediyse cagirana bildirilir; belge sessizce
  // fotografsiz cikmasin (panel bunu kullaniciya uyari olarak gosterir).
  else if (girdi.foto && typeof girdi.uyar === 'function') girdi.uyar('vesikalik-gomulemedi');

  // Not: büyük harfe çevrilmez — `toLocaleUpperCase('tr')` yabancı isimlerde "i"yi "İ" yapıp
  // POUİLLON gibi hatalı yazıma yol açıyor. İsim kimlikteki gibi, girildiği hâliyle basılır.
  const adSoyad = `${v.adSoyad || ''}`.trim();
  yazOrtali(s1, kisalt(adSoyad, 13, S1.isim.x1 - S1.isim.x0 - 4, fontKalin), S1.isim.x0, S1.isim.x1, S1.isim.taban, 13, ust1, fontKalin);

  const sahitler = sahitleriCoz(girdi.sahitler || [], girdi.yedekImzalar || []);
  const alanlar = [S1.sahitSol, S1.sahitSag];
  for (let i = 0; i < 2; i++) {
    const s = sahitler[i];
    if (!s) continue;
    const alan = alanlar[i];
    const im = await gorselGom(s.imza);
    if (im) {
      // İmza, etiketin üstündeki boşluğa (metin bloğu ile "ŞAHİT/WITNESS" arası) oturur.
      const kutuG = alan.x1 - alan.x0 + 26;
      const kutuH = 26;
      const x = alan.x0 - 13;
      kutuyaCiz(s1, im, x, alan.etiketTaban - 38, kutuG, kutuH, ust1);
    }
    if (s.ad) yazOrtali(s1, kisalt(s.ad, 7, alan.x1 - alan.x0 + 40), alan.x0 - 20, alan.x1 + 20, alan.etiketTaban - 8, 7, ust1);
  }

  // Belgeyi düzenleyen görevlinin imzası (orta blok) — istenirse
  if (girdi.yetkiliImza) {
    const im = await gorselGom(girdi.yetkiliImza);
    if (im) kutuyaCiz(s1, im, S1.yetkili.x0 + 20, S1.yetkili.etiketTaban - 34, S1.yetkili.x1 - S1.yetkili.x0 - 40, 26, ust1);
    if (girdi.yetkiliAd) yazOrtali(s1, girdi.yetkiliAd, S1.yetkili.x0, S1.yetkili.x1, S1.yetkili.etiketTaban - 7.5, 6.4, ust1);
  }

  // ---- Sayfa 2: künye ------------------------------------------------------
  const BOY = 9.5;
  const solYaz = (anahtar, deger, boyut = BOY) => {
    const [x, taban] = S2_SOL[anahtar];
    yaz(s2, kisalt(deger, boyut, 415 - (x + 7)), x + 7, taban, boyut, ust2);
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
    if (satirSayisi === 1) { yaz(s2, kisalt(deger, boyut, genislik), x + 7, taban, boyut, ust2); return; }
    // İlk satır etiketin sağında durur; alt satırlar İngilizce etiketin ALTINDAN başlar
    // (aksi hâlde uzun adresin ikinci satırı "Adress" yazısının üstüne biniyordu).
    const satirlar = sar(deger, boyut, genislik, satirSayisi);
    satirlar.forEach((s, i) => yaz(s2, s, i === 0 ? x + 7 : 448, taban + (i === 0 ? 0 : 11 + i * 12), boyut, ust2));
  };
  sagYaz('oncekiDin', v.oncekiDin);
  sagYaz('ihtidaSebebi', v.ihtidaSebebi, 1, 8.6);   // alanın altında EN etiketi var: tek satır
  sagYaz('ihtidaTarihi', v.ihtidaTarihi);
  sagYaz('eposta', v.eposta, 1, 9);
  sagYaz('telefon', v.telefon);
  sagYaz('adres', v.adres, 3);

  // Alt blok: beyan tarihi ve başvuranın imzası.
  // ".../.../......" yer tutucusu beyaz kutuyla örtülür (zemin beyaz) ve tarih yerine basılır.
  if (!bosMu(v.beyanTarihi)) {
    s2.drawRectangle({ x: S2_ALT.x0 + 22, y: ust2(S2_ALT.tarihTaban + 2), width: 84, height: 13, color: rgb(1, 1, 1) });
    yazOrtali(s2, v.beyanTarihi, S2_ALT.x0, S2_ALT.x1, S2_ALT.tarihTaban, 9.5, ust2);
  }
  const basvuranImza = await gorselGom(girdi.basvuranImza);
  if (basvuranImza) kutuyaCiz(s2, basvuranImza, S2_ALT.x0 - 4, S2_ALT.tarihTaban - 46, 108, 28, ust2);

  belge.setTitle(`İhtida Belgesi (EK-9) — ${v.adSoyad || ''}`.trim());
  belge.setSubject('T.C. Cumhurbaşkanlığı Diyanet İşleri Başkanlığı — İhtida Belgesi');
  belge.setCreator('Marche-en-Famenne Ulu Camii — yönetim paneli');
  if (girdi.tarih) { belge.setCreationDate(girdi.tarih); belge.setModificationDate(girdi.tarih); }

  return belge.save({ useObjectStreams: false });
}
