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
import { camiCoz } from './cami-secimi.js';
import { sahitUnvani } from './ek9-hazirlik.js';
import { kalemKur, adBicimleri, KALEM_OZELLIKLERI, MUREKKEP } from './kalem.js';
import { imzaHazirla, aktarimKutusu, kutuyaSigdir } from './imza-ciz.js';

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

/* 25 Eki 2026 (Rıdvan KAYAHAN: «başvuru sahibinin cinsiyetine göre burda diğer cinsiyetin üstünü çizmek lazım»): ön yüzün
   İngilizce metnindeki «he/she» ve «his/her» zamirlerinden başvurana uymayanın üstü çizilir. Erkekse «/she» ve «/her»,
   kadınsa «he/» ve «his/» (şablondaki kurum çizikleri gibi eğik çizgi de çizgiye girer). Ölçüler şablonun metin
   katmanındaki harf kutularından (PyMuPDF rawdict): [x0, x1, y üstten]; y = taban − 2,56 pt, kurum çizikleriyle aynı yükseklik
   ve 0,8 pt kalınlık. Cinsiyet bilinmiyorsa hiçbir zamir çizilmez. Mühtedi Koordinatörlüğü hattı (ek9-tamamla.py) aynı ölçüleri
   kullanır. */
export const EK9_ZAMIR_CIZIKLERI = {
  erkek: [[578.3, 599.2, 350.9], [304.0, 324.4, 386.29]],
  kadin: [[565.5, 581.2, 350.9], [288.1, 307.0, 386.29]],
};
const ZAMIR_KALINLIK = 0.8;
export function ek9CinsiyetKodu(deger) {
  const d = String(deger ?? '').trim().toLocaleLowerCase('tr');
  if (/^(erkek|homme|male|man|männlich)/.test(d)) return 'erkek';
  if (/^(kad[ıi]n|femme|female|woman|vrouw|weiblich)/.test(d)) return 'kadin';
  return '';
}
function zamirleriCiz(sayfa, cinsiyet, renk) {
  const H = sayfa.getHeight();
  for (const [x0, x1, y] of EK9_ZAMIR_CIZIKLERI[cinsiyet] || []) {
    sayfa.drawLine({ start: { x: x0, y: H - y }, end: { x: x1, y: H - y }, thickness: ZAMIR_KALINLIK, color: renk });
  }
}

/* 25 Eki 2026 (Rıdvan KAYAHAN: «bu belgeyi diyanet veriyor, diyanetin resmi olarak konuştuğu dil türkçe, bu belgede dolayısıyla iki
   dilli olmalı»): ihtida sebebi başvuranın dilinde yazılır, Türkçesi altına eklenir (veri.ihtidaSebebiTr). Özgün metin etiketin
   sağındaki satırda biraz yukarıda, Türkçesi «Reason of Conversion» etiketinin sağında; ikisi aynı boyda. Biri sığmazsa ikisi de
   açıklama ekine gider. Türkçesi yoksa ya da özgün metnin aynısıysa eski tek satır düzeni sürer. */
export const EK9_SEBEP_IKI_SATIR = { ustTaban: 132.6, altTaban: 150.6, altX: 553.0, boy: 13.5, sadeBoy: 8.2 };
const sebepNormal = s => String(s ?? '').trim().replace(/\s+/g, ' ');
export function ek9SebepTurkcesi(sebep, turkcesi) {
  const s = sebepNormal(sebep), t = sebepNormal(turkcesi);
  if (!s || !t || s === EK9_BOS_ALAN) return '';
  return s.toLocaleLowerCase('tr') === t.toLocaleLowerCase('tr') ? '' : t;
}

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
  // Kalem kipi (17.10.2026, KALICI KURAL): Allura verilmişse bütün el yazısı alanlar mavi dolma kalemle yazılır.
  // Basılı doldurma (alanYazisi 'sade') yalnız açıkça istenirse eski yoldan çıkar.
  if (girdi.kalemFontBytes && girdi.alanYazisi !== 'sade') return ek9KalemUret(girdi);
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
  const seciliCami = camiCoz(girdi.cami || v?.cami);
  if (!seciliCami) throw new Error('Başvuru camisi eksik veya geçersiz.');
  const digerCami = seciliCami.id !== 'ulucamii-marche';
  if (digerCami) {
    const sahitAdlari = (Array.isArray(girdi.sahitler) ? girdi.sahitler : []).slice(0, 2).map((s) => String(s?.ad || '').trim());
    if (sahitAdlari.length !== 2 || !sahitAdlari[0] || !sahitAdlari[1]) throw new Error('Seçilen cami için iki şahidin adı zorunludur.');
    if (sahitAdlari[0].localeCompare(sahitAdlari[1], 'tr', { sensitivity: 'accent' }) === 0) throw new Error('Seçilen cami için iki farklı şahit yazın.');
    if ((girdi.yedekImzalar || []).some((s) => s && (String(s.ad || '').trim() || s.imza))) throw new Error('Başka cami seçildiğinde yerel yedek şahit veya imza kullanılamaz.');
  }

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
  // Zamir çizikleri şablondaki kurum çizikleriyle aynı renkte (sade kipte şablon mavisi, el yazısında kalem mavisi).
  zamirleriCiz(s1, ek9CinsiyetKodu(v?.cinsiyetKodu || v?.cinsiyet), MAVI);

  // Not: büyük harfe çevrilmez — `toLocaleUpperCase('tr')` yabancı isimlerde "i"yi "İ" yapıp
  // POUİLLON gibi hatalı yazıma yol açıyor. İsim kimlikteki gibi, girildiği hâliyle basılır.
  const adSoyad = `${v.adSoyad || ''}`.trim();
  // Resmî adlar üç noktayla kesilmez; gerekirse yazı küçültülür.
  const siganBoyut = (metin, boyut, en, f = font) => Math.min(boyut, en / Math.max(1, f.widthOfTextAtSize(String(metin || ''), 1)));
  const adBoyut = siganBoyut(adSoyad, kaligrafik ? 24 : 13, S1.isim.x1 - S1.isim.x0 - 4, fontIsim);
  if (adBoyut < 7) girdi.uyar?.('yazi-kucuk');
  yazOrtali(s1, adSoyad, S1.isim.x0, S1.isim.x1, kaligrafik ? S1.isim.taban : 258, adBoyut, ust1, fontIsim, kaligrafik ? MAVI : SIYAH);

  const sahitler = sahitleriCoz(girdi.sahitler || [], girdi.yedekImzalar || []);
  const resmi = await belge.embedFont(girdi.fontBytes, { subset: true });
  const alanlar = [S1.sahitSol, S1.sahitSag];
  for (let i = 0; i < 2; i++) {
    const s = sahitler[i];
    if (!s) continue;
    const alan = alanlar[i];
    if (vektorMu(s.imza)) {
      // Sade siyah yazı kipinde de kayıtlı şahit imzası (vektör) yol olarak, aynı kutuya çizilir.
      const iv = await imzaHazirla(girdi.pdfLib, belge, { vektor: s.imza, sahit: true }).catch(() => null);
      if (!iv) throw new Error(`${i + 1}. şahidin imzası okunamadı; belge hazırlanamadı.`);
      iv.ciz(s1, kutuyaSigdir(iv.en, iv.boy, [alan.x0 - 13, alan.etiketTaban + 8, alan.x1 + 13, alan.etiketTaban + 38], true));
    }
    const im = vektorMu(s.imza) ? null : await gorselGom(s.imza);
    if (s.imza && !im && !vektorMu(s.imza)) throw new Error(`${i + 1}. şahidin imzası okunamadı; belge hazırlanamadı.`);
    if (im) {
      await imzayiMaviYap(im);
      // İmza, şahit etiketinin altındaki boş alana yerleşir; büyüyen adla çakışmaz.
      const kutuG = alan.x1 - alan.x0 + 26;
      const kutuH = 30;
      const x = alan.x0 - 13;
      kutuyaCiz(s1, im, x, alan.etiketTaban + 8, kutuG, kutuH, ust1);
    }
    if (s.ad) {
      const unvan = sahitUnvani(s.ad, seciliCami.id);
      const boyut = siganBoyut(s.ad, elYazisi ? 12 : 7, alan.x1 - alan.x0 + 40);
      if (boyut < 6) girdi.uyar?.('yazi-kucuk');
      yazOrtali(s1, s.ad, alan.x0 - 20, alan.x1 + 20, alan.etiketTaban - (unvan ? 25 : 12), boyut, ust1);
      if (unvan) yazOrtali(s1, unvan, alan.x0 - 20, alan.x1 + 20, alan.etiketTaban - 11, 8, ust1, resmi, SIYAH);
    }
  }

  // Yetkili adı ve unvanı resmî siyah yazıyla hazırdır; ıslak imza alanı boş kalır.
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
  const sebepTr = ek9SebepTurkcesi(v.ihtidaSebebi, v.ihtidaSebebiTr);
  if (!sebepTr) sagYaz('ihtidaSebebi', v.ihtidaSebebi, 1, elYazisi ? 13 : 8.6);   // alanın altında EN etiketi var: tek satır
  else {
    // İki dilli sebep: özgün metin etiketin sağında, Türkçesi «Reason of Conversion» etiketinin sağında (EK9_SEBEP_IKI_SATIR).
    const [x] = S2_SAG.ihtidaSebebi, I = EK9_SEBEP_IKI_SATIR;
    const boyut = elYazisi ? 11 : I.sadeBoy, ozgun = sebepNormal(v.ihtidaSebebi);
    const en1 = S2_SAG_SINIR - (x + 7), en2 = S2_SAG_SINIR - I.altX;
    const b = Math.min(siganBoyut(ozgun, boyut, en1), siganBoyut(sebepTr, boyut, en2));
    if (b < 7 && girdi.uzunAlan) {
      girdi.uzunAlan('ihtidaSebebi', ozgun); girdi.uzunAlan('ihtidaSebebiTr', sebepTr);
      yaz(s2, 'Ek açıklama sayfasında / See supplement', x + 7, S2_SAG.ihtidaSebebi[1], elYazisi ? 11 : 8, ust2);
    } else {
      if (b < 7) girdi.uyar?.('yazi-kucuk');
      yaz(s2, ozgun, x + 7, I.ustTaban, b, ust2);
      yaz(s2, sebepTr, I.altX, I.altTaban, b, ust2);
    }
  }
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

/* ---------------------------------------------------------------------------------------------------------------
 * Kalem kipi: Mühtedi Koordinatörlüğünün ek9-tamamla.py aracıyla aynı yerleşim (KALICI KURAL «belge doldurma
 * kalemi», 17.10.2026). Ön yüzde ad ve şahit adları kalemle, vesikalık büyük (80 pt) ve altın çerçevenin ÜSTÜNDE;
 * arka yüzün bütün değerleri kalemle; başvuranın imzası beyanın altında, kalem mürekkebiyle. Ölçüler pt, ÜST kenardan.
 * ------------------------------------------------------------------------------------------------------------- */
const K = {
  cerceve: { x0: 643.0, y0: 207.4, x1: 695.8, y1: 273.6 },      // şablonun foto çerçevesi
  cerceveRenk: [0.545, 0.431, 0.106],
  fotoBoy: 80.0,
  imzaYeri: [686.0, 372.0, 794.0, 410.0],                       // s.2: beyanın altı, tarihin üstü
  isim: [270.0, 588.0, 265.0],
  sahit: [[155.0, 235.0], [603.0, 683.0]],
  etiket: 424.0,
  // Şahit adı tabanı (unvanlı, unvansız): solda −21 (metnin son satırına binmesin), sağda −25 (Y kuyruğu unvana değmesin).
  sahitAd: [{ true: -21.0, false: -12.0 }, { true: -25.0, false: -12.0 }],
  solSinir: 415.0, sagSinir: 795.0, altSatirX: 448.0,
  tarih: [700.0, 780.0, 430.3], tarihOrtu: [722.0, 419.3, 806.0, 432.3],
  ad: [740.0, 453.0, 110.0], adIkiSatir: [446.0, 461.0], adOrtu: [700.0, 435.0, 794.0, 465.0],
  duzenleyenSatir: [-4.5, 10.0], yukari: 1.5, adresSatir: 24.0,
  boy: 17.0, boySebep: 16.0, boyIsim: 27.0, boySahit: 14.0, boyDuzenleyen: 14.5,
  siteMavi: '.08 .2 .48',                                        // şablondaki kurum çiziklerinin rengi
};
export const EK9_DUZENLEYEN = 'T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği';
export const EK9_BOS_ALAN = 'Bildirilmedi / Non communiqué';
const EK9_BOS_DOLAN = ['ogrenim', 'anneAdi', 'babaAdi', 'dogumYeri', 'medeniHali', 'meslek', 'oncekiDin', 'ihtidaSebebi', 'eposta', 'telefon', 'adres'];
const OKUNUR_EN_KUCUK = 10.0;    // bundan küçük yazılacak değer ek açıklama sayfasına gider

/** Şablondaki kurum çiziklerini (sitenin MAVİ'si) kalem mürekkebine boyar; büyük süsleme akışına dokunmaz. */
function cizikleriBoya(pdfLib, belge, sayfa) {
  const { PDFName, PDFArray, decodePDFRawStream, PDFRawStream } = pdfLib;
  const icerik = sayfa.node.get(PDFName.of('Contents'));
  const refler = icerik instanceof PDFArray ? icerik.asArray() : [icerik];
  const murekkep = MUREKKEP.join(' ');
  let sayac = 0;
  for (const ref of refler) {
    const akis = belge.context.lookup(ref);
    if (!(akis instanceof PDFRawStream) || akis.contents.length > 4096) continue;
    const ham = decodePDFRawStream(akis).decode();
    let metin = '';
    for (const b of ham) metin += String.fromCharCode(b);
    if (!metin.includes(`${K.siteMavi} RG`) && !metin.includes(`${K.siteMavi} rg`)) continue;
    const yeni = metin.split(`${K.siteMavi} RG`).join(`${murekkep} RG`).split(`${K.siteMavi} rg`).join(`${murekkep} rg`);
    belge.context.assign(ref, belge.context.flateStream(Uint8Array.from(yeni, c => c.charCodeAt(0))));
    sayac++;
  }
  return sayac;
}

async function gorselGomKalem(belge, veri) {
  if (!veri) return null;
  try {
    if (typeof veri === 'string') {
      return veri.startsWith('data:image/png') || veri.startsWith('iVBOR') ? await belge.embedPng(veri) : await belge.embedJpg(veri);
    }
    return veri[0] === 0x89 ? await belge.embedPng(veri) : await belge.embedJpg(veri);
  } catch { return null; }
}

const vektorMu = imza => typeof imza === 'string' && imza.trim().startsWith('{');

async function ek9KalemUret(girdi) {
  const L = girdi.pdfLib;
  const { PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } = L;
  const belge = await PDFDocument.load(girdi.sablonBytes, { parseSpeed: Infinity });
  belge.registerFontkit(girdi.fontkit);
  const allura = await belge.embedFont(girdi.kalemFontBytes, { subset: false, features: KALEM_OZELLIKLERI });   // alt küme gömme bazı harfleri görünmez yapıyor (Caveat dersi)
  const resmi = await belge.embedFont(girdi.fontBytes, { subset: true });
  const resmiKalin = await belge.embedFont(girdi.fontKalinBytes || girdi.fontBytes, { subset: true });
  const kalem = kalemKur(L, allura, resmi);
  const SIYAH = rgb(0.09, 0.09, 0.12);
  const [s1, s2] = belge.getPages();
  const v = girdi.veri || {};
  const uyar = kod => girdi.uyar?.(kod);

  const seciliCami = camiCoz(girdi.cami || v.cami);
  if (!seciliCami) throw new Error('Başvuru camisi eksik veya geçersiz.');
  if (seciliCami.id !== 'ulucamii-marche') {
    const adlar = (Array.isArray(girdi.sahitler) ? girdi.sahitler : []).slice(0, 2).map(s => String(s?.ad || '').trim());
    if (adlar.length !== 2 || !adlar[0] || !adlar[1]) throw new Error('Seçilen cami için iki şahidin adı zorunludur.');
    if (adlar[0].localeCompare(adlar[1], 'tr', { sensitivity: 'accent' }) === 0) throw new Error('Seçilen cami için iki farklı şahit yazın.');
    if ((girdi.yedekImzalar || []).some(s => s && (String(s.ad || '').trim() || s.imza))) throw new Error('Başka cami seçildiğinde yerel yedek şahit veya imza kullanılamaz.');
  }

  // ---- Ön yüz ------------------------------------------------------------------------------------------------
  cizikleriBoya(L, belge, s1);
  zamirleriCiz(s1, ek9CinsiyetKodu(v.cinsiyetKodu || v.cinsiyet), rgb(...MUREKKEP));
  const foto = await gorselGomKalem(belge, girdi.foto);
  if (foto) {
    // Vesikalık 80 pt yüksekliğinde, çerçeveyi örterek; oranı uymayan fotoğraf kutuya kırpılır (yüz üstte kalır).
    const oran = foto.width / foto.height, kutuOran = Math.min(0.86, Math.max(0.72, oran));
    const h = K.fotoBoy, w = h * kutuOran, cx = (K.cerceve.x0 + K.cerceve.x1) / 2, ust = K.cerceve.y0 - 11.4;
    const x0 = cx - w / 2, H1 = s1.getHeight();
    let gw = w, gh = h, gx = x0, gy = ust;
    if (oran > kutuOran) { gw = h * oran; gx = cx - gw / 2; }
    else if (oran < kutuOran) { gh = w / oran; gy = ust - (gh - h) * 0.3; }
    s1.pushOperators(pushGraphicsState(), rectangle(x0, H1 - ust - h, w, h), clip(), endPath());
    s1.drawImage(foto, { x: gx, y: H1 - gy - gh, width: gw, height: gh });
    s1.pushOperators(popGraphicsState());
    s1.drawRectangle({ x: x0, y: H1 - ust - h, width: w, height: h, borderColor: rgb(...K.cerceveRenk), borderWidth: 0.9 });
  } else if (girdi.foto) uyar('vesikalik-gomulemedi');

  const { el } = adBicimleri(v.adSoyad);
  const kaligrafiAd = String(girdi.kaligrafiAd || el[0] || '').trim();
  if (kaligrafiAd) {
    const b = kalem.ortaliYaz(s1, K.isim[0] + 2, K.isim[1] - 2, K.isim[2], kaligrafiAd, K.boyIsim);
    if (b < 12) uyar('yazi-kucuk');
  }

  const sahitler = sahitleriCoz(girdi.sahitler || [], girdi.yedekImzalar || []);
  for (let i = 0; i < 2; i++) {
    const s = sahitler[i];
    if (!s) continue;
    const [a0, a1] = K.sahit[i];
    if (s.imza) {
      // Kayıtlı şahit imzası vektör kaydıdır (kalem çizgisi ya da dolgulu kontur; imza-ciz.js sürüm 2) ve yol olarak çizilir.
      const im = await imzaHazirla(L, belge, vektorMu(s.imza) ? { vektor: s.imza, sahit: true } : { gorsel: s.imza }).catch(() => null);
      if (!im) throw new Error(`${i + 1}. şahidin imzası okunamadı; belge hazırlanamadı.`);
      im.ciz(s1, kutuyaSigdir(im.en, im.boy, [a0 - 13, K.etiket + 8, a1 + 13, K.etiket + 38], true));
    }
    if (s.ad) {
      const unvan = sahitUnvani(s.ad, seciliCami.id);
      const b = kalem.ortaliYaz(s1, a0 - 20, a1 + 20, K.etiket + K.sahitAd[i][Boolean(unvan)], s.ad, K.boySahit);
      if (b < 9.5) uyar('yazi-kucuk');
      if (unvan) {
        const g = resmi.widthOfTextAtSize(unvan, 8);
        s1.drawText(unvan, { x: (a0 + a1) / 2 - g / 2, y: s1.getHeight() - (K.etiket - 11), size: 8, font: resmi, color: SIYAH });
      }
    }
  }

  // Yetkili adı ve unvanı resmî siyah yazıyla; ıslak imza alanı yetkili makama boş kalır.
  const ortali = (sayfa, metin, x0, x1, taban, boyut, font, renk) => {
    const g = font.widthOfTextAtSize(metin, boyut);
    sayfa.drawText(metin, { x: x0 + (x1 - x0 - g) / 2, y: sayfa.getHeight() - taban, size: boyut, font, color: renk });
  };
  const sigan = (metin, boyut, en, font) => Math.min(boyut, en / Math.max(1, font.widthOfTextAtSize(String(metin || ''), 1)));
  const yetkiliAd = girdi.yetkiliAd ?? 'Salih GÖR';
  const yetkiliUnvan = girdi.yetkiliUnvan ?? 'T.C. Brüksel Büyükelçiliği Sosyal İşler Müşaviri';
  ortali(s1, yetkiliAd, 330, 525, 401, sigan(yetkiliAd, 12, 240, resmiKalin), resmiKalin, rgb(0, 0, 0));
  ortali(s1, yetkiliUnvan, 330, 525, 415, sigan(yetkiliUnvan, 10, 255, resmi), resmi, rgb(0, 0, 0));

  // ---- Arka yüz ----------------------------------------------------------------------------------------------
  const deger = { ...v, duzenleyen: v.duzenleyen || EK9_DUZENLEYEN };
  // Başvuranın bildirmediği alan boş kalmaz, «Bildirilmedi» yazılır; uydurma bilgi yazılmaz. Belge no/tarihi ve
  // T.C. kimlik no resmî makamın alanlarıdır, hep boş kalır.
  for (const a of EK9_BOS_DOLAN) if (!String(deger[a] ?? '').trim()) deger[a] = EK9_BOS_ALAN;
  const ekSayfaya = (anahtar, metin) => {
    if (!girdi.uzunAlan) { uyar('alan-kisaltildi'); return false; }
    girdi.uzunAlan(anahtar, String(metin));
    return true;
  };
  const dengeliIki = metin => {
    const s = metin.split(/\s+/);
    let enIyi = 1, enIyiEn = Infinity;
    for (let i = 1; i < s.length; i++) {
      const m = Math.max(kalem.en(s.slice(0, i).join(' '), 1), kalem.en(s.slice(i).join(' '), 1));
      if (m < enIyiEn) { enIyiEn = m; enIyi = i; }
    }
    return [s.slice(0, enIyi).join(' '), s.slice(enIyi).join(' ')];
  };

  for (const [anahtar, [x, taban]] of Object.entries(S2_SOL)) {
    const metin = String(deger[anahtar] ?? '').trim().replace(/\s+/g, ' ');
    if (!metin) continue;
    if (anahtar === 'duzenleyen') {
      const xx = x + 7, en = K.solSinir - xx - 2;
      const satirlar = kalem.en(metin, K.boyDuzenleyen) <= en || metin.split(' ').length < 2 ? [metin] : dengeliIki(metin);
      const b = Math.min(K.boyDuzenleyen, en / Math.max(...satirlar.map(t => kalem.en(t, 1))));
      if (satirlar.length === 1) kalem.yaz(s2, xx, taban - K.yukari, satirlar[0], b);
      else satirlar.forEach((t, i) => kalem.yaz(s2, xx, taban + K.duzenleyenSatir[i], t, b));
      continue;
    }
    const b = kalem.sigdir(metin, K.boy, K.solSinir - (x + 7) - 2);
    if (b < 9.5) uyar('yazi-kucuk');
    kalem.yaz(s2, x + 7, taban - K.yukari, metin, b);
  }

  const adresSatirlari = (metin, boy) => {
    const [x0] = S2_SAG.adres;
    const enler = [K.sagSinir - (x0 + 7) - 2, K.sagSinir - K.altSatirX - 2];
    const virgul = (metin.match(/,/g) || []).length;
    const parcalar = metin.split(',').map((p, i) => p.trim() + (i < virgul ? ',' : ''));
    for (;;) {
      const birim = parcalar.every(p => kalem.en(p, boy) <= enler[1]) ? parcalar : metin.split(/\s+/);
      const satirlar = [];
      let satir = '';
      for (const k of birim) {
        const aday = `${satir} ${k}`.trim();
        if (satir && kalem.en(aday, boy) > enler[Math.min(satirlar.length, 1)]) { satirlar.push(satir); satir = k; }
        else satir = aday;
      }
      satirlar.push(satir);
      const sigdi = satirlar.length <= 3 && satirlar.every((t, i) => kalem.en(t, boy) <= enler[Math.min(i, 1)]);
      if (sigdi || boy <= OKUNUR_EN_KUCUK) return { satirlar, boy, sigdi };
      boy -= 0.5;
    }
  };
  for (const [anahtar, [x, taban]] of Object.entries(S2_SAG)) {
    const metin = String(deger[anahtar] ?? '').trim().replace(/\s+/g, ' ');
    if (!metin) continue;
    if (anahtar === 'adres') {
      const { satirlar, boy, sigdi } = adresSatirlari(metin, K.boy);
      if (!sigdi && ekSayfaya(anahtar, metin)) { kalem.yaz(s2, x + 7, taban - K.yukari, 'Ek sayfada / See supplement', 13); continue; }
      satirlar.forEach((t, i) => kalem.yaz(s2, i === 0 ? x + 7 : K.altSatirX, taban - K.yukari + K.adresSatir * i, t, boy));
      continue;
    }
    const en = K.sagSinir - (x + 7) - 2;
    const sebepTr = anahtar === 'ihtidaSebebi' ? ek9SebepTurkcesi(metin, v.ihtidaSebebiTr) : '';
    if (sebepTr) {
      // İki dilli sebep (25.10.2026): özgün metin üst satırda, Türkçesi «Reason of Conversion» etiketinin sağında, aynı boyda.
      const I = EK9_SEBEP_IKI_SATIR, en2 = K.sagSinir - I.altX - 2;
      const b = Math.min(kalem.sigdir(metin, I.boy, en, OKUNUR_EN_KUCUK), kalem.sigdir(sebepTr, I.boy, en2, OKUNUR_EN_KUCUK));
      if ((kalem.en(metin, b) > en || kalem.en(sebepTr, b) > en2) && ekSayfaya(anahtar, metin)) {
        ekSayfaya('ihtidaSebebiTr', sebepTr);
        kalem.yaz(s2, x + 7, taban - K.yukari, 'Ek sayfada / See supplement', 13);
        continue;
      }
      kalem.yaz(s2, x + 7, I.ustTaban, metin, b);
      kalem.yaz(s2, I.altX, I.altTaban, sebepTr, b);
      continue;
    }
    const b = kalem.sigdir(metin, anahtar === 'ihtidaSebebi' ? K.boySebep : K.boy, en, OKUNUR_EN_KUCUK);
    if (kalem.en(metin, b) > en && ekSayfaya(anahtar, metin)) { kalem.yaz(s2, x + 7, taban - K.yukari, 'Ek sayfada / See supplement', 13); continue; }
    kalem.yaz(s2, x + 7, taban - K.yukari, metin, b);
  }

  const H2 = s2.getHeight();
  const ortu = ([x0, y0, x1, y1]) => s2.drawRectangle({ x: x0, y: H2 - y1, width: x1 - x0, height: y1 - y0, color: rgb(1, 1, 1) });
  const beyanTarihi = String(v.beyanTarihi || '').trim();
  if (beyanTarihi) { ortu(K.tarihOrtu); kalem.ortaliYaz(s2, K.tarih[0], K.tarih[1], K.tarih[2], beyanTarihi, K.boy); }
  const imzaAdi = String(girdi.imzaAdi || v.adSoyad || '').trim().replace(/\s+/g, ' ');
  if (imzaAdi) {
    ortu(K.adOrtu);
    const [orta, taban, en] = K.ad;
    const b = kalem.sigdir(imzaAdi, K.boy, en, 6);
    if (b >= 12 || imzaAdi.split(' ').length < 2) kalem.yaz(s2, orta - kalem.en(imzaAdi, b) / 2, taban, imzaAdi, b);
    else {
      const satirlar = dengeliIki(imzaAdi);
      const b2 = Math.min(13.0, en / Math.max(...satirlar.map(t => kalem.en(t, 1))));
      satirlar.forEach((t, i) => kalem.yaz(s2, orta - kalem.en(t, b2) / 2, K.adIkiSatir[i], t, b2));
    }
  }
  if (girdi.basvuranImza || girdi.basvuranImzaVektor) {
    const im = await imzaHazirla(L, belge, { vektor: girdi.basvuranImzaVektor, gorsel: girdi.basvuranImza }).catch(() => null);
    if (!im) throw new Error('Başvuranın imzası okunamadı; imzalı EK-9 hazırlanamadı.');
    im.ciz(s2, aktarimKutusu(im.en, im.boy, K.imzaYeri));
  }

  belge.setTitle(`İhtida Belgesi (EK-9) — ${v.adSoyad || ''}`.trim());
  belge.setSubject('T.C. Cumhurbaşkanlığı Diyanet İşleri Başkanlığı — İhtida Belgesi. El yazısı alanlar mavi dolma kalem kaligrafisiyle (Allura).');
  belge.setCreator('Marche-en-Famenne Ulu Camii — yönetim paneli');
  if (girdi.tarih) { belge.setCreationDate(girdi.tarih); belge.setModificationDate(girdi.tarih); }
  return belge.save({ useObjectStreams: false, objectsPerTick: Infinity });
}
