/**
 * Marche-en-Famenne Ulu Camii — Ortak Apps Script Alıcı (SÜRÜM 20)
 * (Kur'an Kursu Kayıt Alıcı + İhtida Başvuru Alıcı — TEK Web App)
 *
 * 30 Ağustos 2026 — FORM-SÖZLEŞMESİ v2'ye göre baştan yazıldı:
 *   - Hiçbir kimlik numarası (Belçika RRN, T.C. kimlik no, pasaport no) toplanmaz.
 *   - Hiçbir görsel (kimlik, vesikalık, imza kanvası) toplanmaz/saklanmaz.
 *   - İstemci artık PDF üretmez; PDF bu dosyada HTML→PDF ile üretilir
 *     (Utilities.newBlob(html,'text/html',ad).getAs('application/pdf')).
 *   - Gövde küçük JSON'dur (≤ 20 KB), Content-Type text/plain (CORS ön uçuşu yok).
 *   - Eski (v1) defterler SİLİNMEZ; yalnız salt-okunur geçmiş olarak durur ve
 *     ?islem=eski-kimlik-temizle ile kimlik verisi/görselleri temizlenir.
 *   - v17: panel (?islem=liste) yalnız v2 defterlerini okuduğu için v1'de kalan
 *     satırlar panelde görünmüyordu. ?islem=eski-tasi bu satırları v2 defterine
 *     BİR KEZ taşır (idempotent); v1 defterler silinmez, yalnız "Durum" hücresine
 *     " | tasindi-v17" eklenir.
 *   - v19 (4 Eylül 2026): kayıt PDF'inde velinin doldurduğu alanlar mavi mürekkepli
 *     EL YAZISI görünümünde basılır (Caveat, SIL OFL; dosyanın sonunda base64 gömülü TTF —
 *     dönüştürücü dış yazı tipi adresi yüklemez, gömülü olan tek yol). Seçenekli alanlar
 *     basılı kare kutu + kalemle çarpı, onaylar kutu, sonda tarih + imza satırı.
 *     ?islem=pdf-ornek&anahtar=…&dil=tr|fr|en[&saglik=0][&gizle=1][&sade=1] örnek veriyle
 *     şablon önizlemesi döndürür (defter/Drive/e-postaya dokunmaz). Dönüşüm gömülü yazı tipiyle
 *     takılırsa kayitPdfUret() aynı belgeyi yazı tipsiz üretir (kayıt PDF yüzünden düşmez).
 *     ?islem=arsiv-saglik-gizle&anahtar=…[&uygula=1]: sağlık notu olan kayıtların Drive arşiv PDF'ini
 *     notsuz yeniden üretir (v18 öncesi kopyalar notu taşıyordu); uygula=1 verilmezse yalnız sayar.
 *   - v20 (4 Eylül 2026 öğle): kayıt PDF'i İKİ SAYFA — 1. sayfa form (bölüm şeritli tablo, sağlık notu
 *     tabloda), 2. sayfa veli sözleşmesi (kurallar TR | FR iki sütun, onay kutuları, tarih / imza);
 *     @page alt bilgi (ref + sayfa numarası). Rıdvan'ın isteği: sözleşme ayrı sayfada olsun.
 *
 * DAĞITIM NOTU (insan adımı — bu dosya otomatik dağıtılmaz):
 *   1. script.google.com'a DERNEK hesabıyla (ulucamii2026@gmail.com) giriş yapın.
 *   2. Aynı proje ("Ulu Camii Alıcı") içinde kodu bu dosyayla değiştirin.
 *   3. Dağıt → Dağıtımları yönet → kalem simgesi → Sürüm: "Nouvelle version"
 *      (ASLA "Nouveau déploiement" — /exec adresi değişmesin).
 *   4. /exec adresi zaten front-end'lerde kayıtlı; v2 formlar aynı adresi kullanır.
 *   5. ?islem=eski-kimlik-temizle&anahtar=<PANEL_ANAHTARI> ve ?islem=eski-tasi&anahtar=
 *      uçları PANEL_ANAHTARI Script Properties'te tanımlıysa çalışır; bir kez elle
 *      tetiklenir (eski-tasi idempotenttir, tekrar çağrılması zararsızdır).
 *
 * doPost, gövdedeki "tur" alanına göre yönlendirir: "kayit" → kayitPostIsleV2(),
 * "ihtida" → ihtidaPostIsleV2(). Bilinmeyen/eksik tur → {ok:false, hata:"tur-gecersiz"}.
 * (v14'ten farklı olarak artık "tur" eksikse sessizce kayıt sayılmıyor — v2 formları
 * her zaman "tur" gönderir; eski istemci hâlâ ayakta kalırsa doğrulama başarısız olur,
 * bu KASITLI: PDF artık istemciden gelmez, eski gövde biçimi zaten geçersizdir.)
 */

var SURUM = 20;

/* ===================================================================
   ORTAK — doGet / doPost yönlendirme, JSON yardımcıları, güvenlik
   =================================================================== */

function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.islem === "liste") return panelListeIsle(e);
    if (e.parameter.islem === "belge") return panelBelgeIsle(e);
    if (e.parameter.islem === "sayim") return sayimIsle(e);
    if (e.parameter.islem === "eski-kimlik-temizle") return eskiKimlikTemizleIsle(e);
    if (e.parameter.islem === "test-temizle") return testTemizleIsle(e);
    if (e.parameter.islem === "mufredat-sina") return mufredatSinaIsle(e);
    if (e.parameter.islem === "eski-tasi") return eskiTasiIsle(e);
    if (e.parameter.islem === "saglik-temizle") return saglikTemizleIsle(e);
    if (e.parameter.islem === "pdf-ornek") return pdfOrnekIsle(e);
    if (e.parameter.islem === "arsiv-saglik-gizle") return arsivSaglikGizleIsle(e);
  }
  return json({ ok: true, servis: "ulucamii-alici", surum: SURUM, zaman: new Date().toISOString() });
}

/* Gövde üst sınırı: sözleşme "toplam gövde ≤ 20 KB" der (görsel/PDF artık
   istemciden gelmediği için v14'teki 9 MB sınırına gerek kalmadı). */
var AZAMI_GOVDE_BAYT = 20 * 1024;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ ok: false, hata: "bos-istek" });
    var govde = e.postData.contents;
    if (govde.length > AZAMI_GOVDE_BAYT) {
      // Tek istisna: müfredat PDF'inin Drive'a yönetici anahtarıyla yüklenmesi (v16).
      if (govde.length < 2 * 1024 * 1024 && govde.indexOf('"tur":"mufredat-yukle"') >= 0) return mufredatYukleIsle(govde);
      return json({ ok: false, hata: "cok-buyuk" });
    }

    var v;
    try { v = JSON.parse(govde); } catch (ayristirmaHata) { return json({ ok: false, hata: "bos-istek" }); }
    if (!v || typeof v !== "object") return json({ ok: false, hata: "bos-istek" });

    if (v.tur === "ihtida") return ihtidaPostIsleV2(v);
    if (v.tur === "kayit") return kayitPostIsleV2(v);
    return json({ ok: false, hata: "tur-gecersiz" });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "sunucu-hatasi", ayrinti: String(hata).slice(0, 200) });
  }
}

function json(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne))
                       .setMimeType(ContentService.MimeType.JSON);
}

/* Gönderim anahtarı: istemcinin ürettiği 16-64 karakterlik rastgele dize (uuid v4 dahil).
   Biçim yanlışsa boş döner — idempotency devre dışı kalır ama istek yine işlenir
   (v14'teki davranışla aynı, hata değildir). */
function temizAnahtar(a) {
  var t = String(a || "").trim();
  return /^[A-Za-z0-9_-]{16,64}$/.test(t) ? t : "";
}

/**
 * Sheets'e yazılacak bir hücreyi METNE sabitler (formül enjeksiyonu koruması).
 * NEDEN: Google Sheets "=", "+", "-" veya "@" ile başlayan bir metni FORMÜL sayar.
 * Başvurandan gelen bir alan (adres, sağlık notu…) böylece defterde ÇALIŞMASIN diye
 * zararsız bir tek tırnak öneki hücreyi metin olarak sabitler (Sheets arayüzünde görünmez).
 * Tarih nesneleri olduğu gibi geçer.
 */
function hucreGuvenli(deger) {
  if (deger instanceof Date) return deger;
  var metin = (deger === null || deger === undefined) ? "" : String(deger);
  return /^[=+\-@\t\r]/.test(metin) ? "'" + metin : metin;
}

/** Defterle konuşan TEK yer: her satır yazılmadan önce hücre hücre güvenlestirilir. */
function satirEkle(sayfa, degerler) {
  sayfa.appendRow(degerler.map(hucreGuvenli));
}

function satirBulGenel(sayfa, ref, refSutunu) {
  if (sayfa.getLastRow() < 2) return 0;
  var veri = sayfa.getRange(2, refSutunu, sayfa.getLastRow() - 1, 1).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][0]).trim() === ref) return i + 2;
  }
  return 0;
}

/** Bir grup sayfada (v1 + v2) "ÖNEK-YYYY-NNNN" biçimindeki en büyük NNNN'den bir sonrakini döndürür.
    Referans her zaman 2. sütundadır (v1 ve v2 defterlerinin tümünde). */
function referansMaxBul(sayfalar, onEk) {
  var sira = 1;
  var desen = new RegExp("^" + onEk + "-\\d{4}-(\\d{4})");
  sayfalar.forEach(function (sayfa) {
    if (!sayfa || sayfa.getLastRow() < 2) return;
    var veri = sayfa.getRange(2, 2, sayfa.getLastRow() - 1, 1).getValues();
    for (var j = 0; j < veri.length; j++) {
      var e = String(veri[j][0]).match(desen);
      if (e) sira = Math.max(sira, parseInt(e[1], 10) + 1);
    }
  });
  return sira;
}

/* PDF: HTML→PDF dönüşümü, sözleşmede zorunlu tutulan tek yol. */
function htmlPdfUret(html, dosyaAdi) {
  var ad = String(dosyaAdi).replace(/\.pdf$/i, "") + ".pdf";
  var blob = Utilities.newBlob(html, "text/html", ad).getAs("application/pdf");
  blob.setName(ad);
  return blob;
}

/** v19: kayıt PDF'i — el yazısı yazı tipi gömülü HTML'i PDF'e çevirir; dönüştürücü gömülü yazı tipiyle
    takılırsa (Google'ın AppSheet belgelerinde anılan seyrek durum) aynı belgeyi yazı tipsiz (meta.sade)
    üretir: kayıt hiçbir zaman PDF görünümü yüzünden düşmez. */
function kayitPdfUret(v, meta, dosyaAdi) {
  try {
    return htmlPdfUret(pdfHtmlKayit(v, meta), dosyaAdi);
  } catch (hata) {
    console.warn("kayıt PDF'i el yazısıyla üretilemedi, sade üretiliyor: " + hata);
    return htmlPdfUret(pdfHtmlKayit(v, Object.assign({}, meta, { sade: true })), dosyaAdi);
  }
}


/* ===================================================================
   SAF (PURE) BÖLÜM BAŞLANGICI
   Bu bölümdeki her şey YALNIZ string/veri işler; SpreadsheetApp, DriveApp,
   MailApp, Utilities, PropertiesService, LockService, ContentService,
   UrlFetchApp, CacheService çağrısı YOKTUR. scripts/pdf-onizleme.mjs bu
   bölümü Node'da da çalıştırabilir (GAS API'leri sahte nesnelerle doldurulur).
   =================================================================== */

/** HTML'e yazılacak kullanıcı metnini kaçış karakterleriyle güvenli hâle getirir. */
function kacis(m) {
  return String(m == null ? "" : m).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/** "YYYY-MM-DD" değerini "gg.aa.yyyy" biçimine getirir (Date nesnesi kurmadan, salt metin). */
function tarihGoster(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? (m[3] + "." + m[2] + "." + m[1]) : String(iso || "");
}

/** Türkçe/Fransızca aksanları sadeleştirip küçük harfe indirger — ad/imza karşılaştırması için. */
function sadelestir(metin) {
  var s = String(metin == null ? "" : metin).trim();
  s = s.replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
       .replace(/Ğ/g, "g").replace(/ğ/g, "g")
       .replace(/Ü/g, "u").replace(/ü/g, "u")
       .replace(/Ş/g, "s").replace(/ş/g, "s")
       .replace(/Ö/g, "o").replace(/ö/g, "o")
       .replace(/Ç/g, "c").replace(/ç/g, "c");
  s = s.toLowerCase();
  if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return s.replace(/[^a-z0-9]+/g, "");
}

/** İki ad-soyad dizesini boşluk/büyük-küçük/aksan duyarsız karşılaştırır. */
function adSadelestirEsit(a, b) {
  var sa = sadelestir(a), sb = sadelestir(b);
  return sa.length > 0 && sa === sb;
}

/** {tr,fr,en} sözlüğünden dile göre "TR" veya "TR / İkincilDil" metni üretir. */
function ikiDilliEtiket(sozluk, dil) {
  var e = sozluk || {};
  var tr = e.tr || "";
  if (dil === "tr" || !e[dil]) return kacis(tr);
  return kacis(tr) + " / " + kacis(e[dil]);
}

/** Kod → {tr,fr,en} eşlemesinden görüntülenecek değeri üretir; eşleşme yoksa kodu olduğu gibi gösterir. */
function etiketDeger(harita, kod, dil) {
  var e = (harita && harita[kod]) || null;
  if (!e) return kacis(kod || "—");
  if (dil === "tr" || !e[dil]) return kacis(e.tr);
  return kacis(e.tr) + " / " + kacis(e[dil]);
}

function evetHayirGoster(bool, dil) {
  if (dil === "fr") return bool ? "Oui / Evet" : "Non / Hayır";
  if (dil === "en") return bool ? "Yes / Evet" : "No / Hayır";
  return bool ? "Evet" : "Hayır";
}

/* ---- v19: "mavi kalemle el yazısı" görünümü (yalnız kayıt PDF'i) ----------------------------
   Basılı bir formu kalemle doldurmuş gibi: etiketler ve sabit metin basılı (Arial, siyah),
   velinin yazdığı her değer gömülü Caveat yazı tipiyle mavi mürekkep renginde; seçenekli
   sorularda tüm seçenekler basılı kare kutuyla dizilir, seçilen kutuya kalemle çarpı atılır.
   Yazı tipi dosyanın sonundaki EL_YAZISI_B64 sabitindedir (@font-face, data: URI). */
var MUREKKEP = "#1c3e9e";
var ENUM_FORM_DILI = {
  tr: { tr: "Türkçe", fr: "Turc", en: "Turkish" },
  fr: { tr: "Fransızca", fr: "Français", en: "French" },
  en: { tr: "İngilizce", fr: "Anglais", en: "English" }
};
var DEVAM_METIN = { tr: "Kurallar, onaylar ve imza 2. sayfadadır.", fr: "Règlement, consentements et signature en page 2.", en: "Rules, consents and signature are on page 2." };
var SOZLESME_BASLIK = { tr: "Kurs kuralları ve kurs–veli sözleşmesi", fr: "Règlement du cours et engagement parent–cours", en: "Course rules and parent–course agreement" };
var DERS_YILI_ETIKET = { tr: "Ders yılı", fr: "Année scolaire", en: "School year" };
var ONAY_BASLIK = { tr: "Onaylar", fr: "Consentements", en: "Consents" };
var ONAY_GIRIS = { tr: "Aşağıdaki kutuları işaretleyerek veli olarak beyan ederim:", fr: "En cochant les cases ci-dessous, je déclare en tant que parent :", en: "By ticking the boxes below, I declare as the parent:" };
var ONAY_METIN = {
  kurallar: { tr: "Kurs kurallarını ve kurs–veli sözleşmesini okudum, kabul ediyorum.", fr: "J'ai lu et j'accepte le règlement du cours et l'engagement parent–cours.", en: "I have read and accept the course rules and the parent–course agreement." },
  gizlilik: { tr: "Gizlilik bildirimini okudum.", fr: "J'ai lu la notice de confidentialité.", en: "I have read the privacy notice." },
  saglikRiza: { tr: "Sağlık bilgisinin işlenmesine açık rıza veriyorum (GDPR md. 9/2-a).", fr: "Je consens explicitement au traitement de l'information de santé (art. 9.2.a RGPD).", en: "I give explicit consent to the processing of the health information (Art. 9(2)(a) GDPR)." }
};

/** Kayıt PDF'ine eklenen ek CSS: gömülü el yazısı yazı tipi, bölüm şeritli form, iki sayfalık düzen, sözleşme sayfası. */
function kayitCss(sade, ref, devamMetni) {
  var cssMetin = function (m) { return String(m || "").replace(/["\\]/g, "").replace(/\s+/g, " "); };
  var altYazi = "Marche-en-Famenne Ulu Camii \u00b7 Kur'an Kursu Kay\u0131t Formu / Formulaire d'inscription \u00b7 Ref " + cssMetin(ref);
  return [
    sade ? "" : '@font-face{font-family:"ElYazisi";src:url(data:font/ttf;base64,' + EL_YAZISI_B64 + ') format("truetype");font-weight:normal;font-style:normal;}',
    // Sayfa kenarlığı: her sayfanın altında belge adı + ref (sol) ve sayfa numarası (sağ)
    '@page{margin:15mm 14mm 19mm;@bottom-left{content:"' + altYazi + '";font-family:Arial,Helvetica,sans-serif;font-size:7.5pt;color:#666;}@bottom-right{content:counter(page) " / " counter(pages);font-family:Arial,Helvetica,sans-serif;font-size:7.5pt;color:#666;}}',
    // İlk sayfanın alt-sol kutusu: «kurallar, onaylar ve imza 2. sayfada» — akışta yer kaplamaz, taşma yapmaz
    devamMetni ? '@page:first{@bottom-left{content:"\u2192 ' + cssMetin(devamMetni) + '";}}' : "",
    '.el{font-family:"ElYazisi","Caveat","Segoe Script",cursive;color:' + MUREKKEP + ';font-size:15pt;line-height:1.08;}',
    // Google'ın dönüştürücüsü arka planları basmaz (Chromium yazdırma varsayılanı) → bölüm şeritleri ve etiket zemini için zorunlu
    "html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}",
    "header.ust{margin-bottom:10px;}",
    ".ref-kutu .yil{font-size:8.5pt;color:#444;}",
    "h1{margin-bottom:8px;}",
    "table.bilgi{margin-bottom:4px;}",
    "table.bilgi th{width:40%;font-size:9pt;padding:3px 8px;line-height:1.3;}",
    "table.bilgi td{padding:2px 8px 1px;}",
    ".not .el{font-size:13.5pt;line-height:1.12;}",
    ".not .el.el-k{font-size:12pt;line-height:1.15;}",
    "table.bilgi tr.bolum th{width:auto;background:#1F4E4E;color:#fff;font-size:8pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-color:#1F4E4E;}",
    ".kucuk{font-weight:400;font-size:8pt;color:#555;}",
    ".kunye{font-size:8pt;}",
    ".secenek{display:inline-block;white-space:nowrap;margin:1px 14px 1px 0;font-size:10pt;}",
    ".kutu{display:inline-block;width:12px;height:12px;border:1px solid #333;margin-right:7px;vertical-align:-2px;text-align:center;line-height:10px;overflow:visible;}",
    ".kutu .el{font-size:16.5pt;line-height:10px;position:relative;top:-1px;left:1px;}",
    ".sistem-not{font-style:italic;color:#444;font-size:9.5pt;}",
    // 2. sayfa: veli sözleşmesi
    "section.sozlesme{break-before:page;page-break-before:always;}",
    "section.sozlesme h1{font-size:14pt;margin:0 0 6px;}",
    ".s-kimlik{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:2px solid #1F4E4E;padding-bottom:5px;margin-bottom:12px;font-size:10pt;}",
    ".s-kimlik .ref{font-size:9pt;color:#444;white-space:nowrap;}",
    "table.kurallar{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:12px;}",
    "table.kurallar td{width:50%;vertical-align:top;padding:8px 10px;border:1px solid #cfd8d6;background:#FAFBFB;font-size:9.5pt;line-height:1.45;}",
    "table.kurallar h3{margin:0 0 5px;font-size:10.5pt;color:#1F4E4E;}",
    "table.kurallar p{margin:0 0 7px;}",
    "table.kurallar p:last-child{margin-bottom:0;}",
    "h2.onay-baslik{font-size:11.5pt;color:#1F4E4E;margin:14px 0 4px;}",
    ".onay-giris{margin:0 0 4px;font-size:10pt;}",
    ".onay-kutular{margin-top:2px;font-size:10pt;}",
    ".onay-kutular .secenek{display:block;white-space:normal;margin:4px 0;}",
    "table.imza{width:100%;border-collapse:collapse;margin-top:22px;page-break-inside:avoid;}",
    "table.imza td{vertical-align:bottom;padding:0 18px 0 0;}",
    "table.imza td.dar{width:32%;}",
    ".imza-cizgi{border-bottom:1px solid #444;min-height:40px;padding:0 6px 2px;}",
    ".imza-cizgi .el{font-size:21pt;line-height:1;}",
    ".imza-etiket{font-size:8.5pt;color:#444;margin-top:2px;}",
    ".onay-not{font-size:8.5pt;color:#444;margin:10px 0 0;}",
    "footer{margin-top:16px;}"
  ].join("\n");
}
/** Velinin yazdığı metni mavi el yazısı olarak basar; boş alan kalemle kısa çizgi. */
function elYazisi(deger, ekSinif) {
  var s = (deger === undefined || deger === null) ? "" : String(deger).trim();
  return '<span class="el' + (ekSinif ? " " + ekSinif : "") + '">' + (s ? kacis(s) : "–") + "</span>";
}
/** Basılı kare kutu (+ işaretliyse kalemle çarpı) ve yanında basılı etiket (etiketHtml kaçışlı olmalı). */
function kutu(isaretli, etiketHtml) {
  return '<span class="secenek"><span class="kutu">' + (isaretli ? '<span class="el">X</span>' : "&nbsp;") + "</span>" + etiketHtml + "</span>";
}
/** Enum'un tüm seçeneklerini kutuyla dizer, seçileni işaretler; tanınmayan kod → el yazısıyla olduğu gibi. */
function secenekKutulari(harita, kod, dil) {
  var kodlar = Object.keys(harita);
  if (!kod || kodlar.indexOf(kod) === -1) return elYazisi(kod);
  return kodlar.map(function (k) { return kutu(k === kod, etiketDeger(harita, k, dil)); }).join("");
}
function evetHayirKutu(bool, dil) {
  var hayir = dil === "fr" ? "Non / Hayır" : dil === "en" ? "No / Hayır" : "Hayır";
  var evet = dil === "fr" ? "Oui / Evet" : dil === "en" ? "Yes / Evet" : "Evet";
  return kutu(!bool, hayir) + kutu(!!bool, evet);
}
/** Şablon önizlemesi için uydurma ama biçimce gerçek kayıt verisi (gerçek kişi yok). */
function ornekKayitVerisi(dil, saglikVar) {
  dil = dil || "tr";
  return {
    tur: "kayit", formSurumu: 2, dil: dil,
    ogrenci: { ad: "Ayşe Nur", soyad: "ÖRNEK", cinsiyet: "kiz", dogumTarihi: "2017-03-15", okul: "Institut Saint-Roch", sinif: "P2", kursDurumu: "yeni" },
    veli: { yakinlik: "anne", adSoyad: "Fatma Şükran Örnek", cep: "+32 470 00 00 00", eposta: "ornek@example.com", adres: "Rue de l'Exemple 12", postaKodu: "6900", sehir: "Marche-en-Famenne", iletisimDili: dil === "fr" ? "fr" : "tr" },
    acil: { adSoyad: "Mehmet Örnek", cep: "+32 471 00 00 00" },
    saglik: saglikVar ? { var: true, not: "Fıstık alerjisi var; çantasında EpiPen bulunur. / Allergie aux arachides ; EpiPen dans le cartable." } : { var: false },
    goruntuIzni: true, goruntuSosyalIzni: false,
    onay: { kurallar: true, gizlilik: true, saglikRiza: !!saglikVar, elektronikImza: "Fatma Şükran Örnek" }
  };
}

var ENUM_CINSIYET_OGRENCI = {
  kiz: { tr: "Kız", fr: "Fille", en: "Girl" },
  erkek: { tr: "Erkek", fr: "Garçon", en: "Boy" }
};
var ENUM_CINSIYET_BASVURAN = {
  kadin: { tr: "Kadın", fr: "Femme", en: "Woman" },
  erkek: { tr: "Erkek", fr: "Homme", en: "Man" }
};
var ENUM_YAKINLIK = {
  anne: { tr: "Anne", fr: "Mère", en: "Mother" },
  baba: { tr: "Baba", fr: "Père", en: "Father" },
  vasi: { tr: "Vasi", fr: "Tuteur / tutrice légal(e)", en: "Legal guardian" }
};
var ENUM_KURS_DURUMU = {
  yeni: { tr: "Yeni kayıt", fr: "Nouvelle inscription", en: "New enrollment" },
  devam: { tr: "Devam eden öğrenci", fr: "Élève déjà inscrit(e)", en: "Continuing student" }
};
var ENUM_ILETISIM_DILI = {
  tr: { tr: "Türkçe", fr: "Turc", en: "Turkish" },
  fr: { tr: "Fransızca", fr: "Français", en: "French" }
};
var ENUM_MEDENI = {
  bekar: { tr: "Bekâr", fr: "Célibataire", en: "Single" },
  evli: { tr: "Evli", fr: "Marié(e)", en: "Married" },
  dul: { tr: "Dul", fr: "Veuf / veuve", en: "Widowed" },
  bosanmis: { tr: "Boşanmış", fr: "Divorcé(e)", en: "Divorced" }
};
var ENUM_TOREN_DILI = {
  tr: { tr: "Türkçe", fr: "Turc", en: "Turkish" },
  fr: { tr: "Fransızca", fr: "Français", en: "French" },
  en: { tr: "İngilizce", fr: "Anglais", en: "English" },
  ar: { tr: "Arapça", fr: "Arabe", en: "Arabic" }
};

var ETIKET_KAYIT = {
  ogrenciAdSoyad: { tr: "Öğrenci adı soyadı", fr: "Nom et prénom de l'élève", en: "Student's full name" },
  ogrenciDogum: { tr: "Doğum tarihi", fr: "Date de naissance", en: "Date of birth" },
  ogrenciCinsiyet: { tr: "Cinsiyet", fr: "Sexe", en: "Gender" },
  okul: { tr: "Okul", fr: "École", en: "School" },
  sinif: { tr: "Sınıf", fr: "Classe", en: "Grade" },
  kursDurumu: { tr: "Kurs durumu", fr: "Statut d'inscription", en: "Enrollment status" },
  veliYakinlik: { tr: "Veli yakınlığı", fr: "Lien de parenté", en: "Relationship to student" },
  veliAdSoyad: { tr: "Veli adı soyadı", fr: "Nom et prénom du parent", en: "Parent's full name" },
  veliCep: { tr: "Veli cep telefonu", fr: "GSM du parent", en: "Parent's mobile phone" },
  veliEposta: { tr: "Veli e-posta", fr: "E-mail du parent", en: "Parent's e-mail" },
  adres: { tr: "Adres", fr: "Adresse", en: "Address" },
  postaKodu: { tr: "Posta kodu", fr: "Code postal", en: "Postal code" },
  sehir: { tr: "Şehir", fr: "Ville", en: "City" },
  iletisimDili: { tr: "İletişim dili", fr: "Langue de communication", en: "Communication language" },
  acilKisi: { tr: "Acil durum kişisi", fr: "Personne à contacter en cas d'urgence", en: "Emergency contact" },
  acilCep: { tr: "Acil durum telefonu", fr: "GSM d'urgence", en: "Emergency phone" },
  saglikBilgisi: { tr: "Sağlık notu", fr: "Note de santé", en: "Health note" },
  goruntuIzni: { tr: "Görüntü izni (site ve duyurular)", fr: "Autorisation image (site et annonces)", en: "Image permission (website and announcements)" },
  goruntuSosyalIzni: { tr: "Görüntü izni (sosyal medya)", fr: "Autorisation image (réseaux sociaux)", en: "Image permission (social media)" },
  formDili: { tr: "Form dili", fr: "Langue du formulaire", en: "Form language" },
  elektronikImza: { tr: "Elektronik imza (veli)", fr: "Signature électronique (parent)", en: "Electronic signature (parent)" },
  saglikVar: { tr: "Bildirilecek sağlık bilgisi", fr: "Information de santé à signaler", en: "Health information to report" },
  tarih: { tr: "Tarih", fr: "Date", en: "Date" },
  postaSehir: { tr: "Posta kodu ve şehir", fr: "Code postal et localité", en: "Postal code and city" }
};

var ETIKET_IHTIDA = {
  adSoyad: { tr: "Adı Soyadı", fr: "Nom et prénom", en: "Full name" },
  cinsiyet: { tr: "Cinsiyet", fr: "Sexe", en: "Gender" },
  dogumTarihi: { tr: "Doğum tarihi", fr: "Date de naissance", en: "Date of birth" },
  dogumYeri: { tr: "Doğum yeri", fr: "Lieu de naissance", en: "Place of birth" },
  uyruk: { tr: "Uyruk", fr: "Nationalité", en: "Nationality" },
  anneAdi: { tr: "Anne adı", fr: "Prénom de la mère", en: "Mother's first name" },
  babaAdi: { tr: "Baba adı", fr: "Prénom du père", en: "Father's first name" },
  medeniHali: { tr: "Medeni hâli", fr: "État civil", en: "Marital status" },
  ogrenimDurumu: { tr: "Öğrenim durumu", fr: "Niveau d'études", en: "Education level" },
  meslek: { tr: "Mesleği", fr: "Profession", en: "Occupation" },
  oncekiDin: { tr: "Önceki din/mezhep", fr: "Religion/confession précédente", en: "Previous religion" },
  ihtidaSebebi: { tr: "İhtida sebebi", fr: "Motif de la conversion", en: "Reason for conversion" },
  yeniIsim: { tr: "Yeni isim tercihi", fr: "Nouveau prénom souhaité", en: "Preferred new name" },
  eposta: { tr: "E-posta", fr: "E-mail", en: "E-mail" },
  telefon: { tr: "Telefon", fr: "Téléphone", en: "Phone" },
  adres: { tr: "Adres", fr: "Adresse", en: "Address" },
  torenDili: { tr: "Tören dili", fr: "Langue de la cérémonie", en: "Ceremony language" },
  torenTarihi: { tr: "Tören tarihi tercihi", fr: "Date souhaitée pour la cérémonie", en: "Preferred ceremony date" },
  nasilHaberdar: { tr: "Nasıl haberdar oldu", fr: "Comment vous nous avez connus", en: "How you heard about us" },
  ekNot: { tr: "Ek not", fr: "Remarque complémentaire", en: "Additional note" },
  fotografIzni: { tr: "Fotoğraf izni", fr: "Autorisation photo", en: "Photo consent" },
  sahit1: { tr: "1. şahit", fr: "1er témoin", en: "1st witness" },
  sahit2: { tr: "2. şahit", fr: "2e témoin", en: "2nd witness" },
  formDili: { tr: "Form dili", fr: "Langue du formulaire", en: "Form language" }
};

var PDF_CSS = [
  "@page { size: A4; margin: 16mm 14mm; }",
  "*{box-sizing:border-box;}",
  "body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#1a1a1a;line-height:1.42;margin:0;}",
  "header.ust{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1F4E4E;padding-bottom:8px;margin-bottom:12px;gap:12px;}",
  ".kunye{font-size:8.5pt;color:#444;max-width:68%;}",
  ".ref-kutu{text-align:right;font-size:9.5pt;white-space:nowrap;}",
  ".ref-kutu b{font-size:13pt;color:#1F4E4E;}",
  "h1{font-size:15pt;color:#1F4E4E;margin:0 0 10px;}",
  "table.bilgi{width:100%;border-collapse:collapse;margin-bottom:12px;}",
  "table.bilgi th{width:36%;text-align:left;background:#F3F6F5;padding:4px 8px;border:1px solid #cfd8d6;font-weight:600;vertical-align:top;font-size:10pt;}",
  "table.bilgi td{padding:4px 8px;border:1px solid #cfd8d6;vertical-align:top;font-size:10pt;}",
  "section.blok{margin:12px 0;padding:8px 12px;border:1px solid #cfd8d6;border-radius:4px;background:#FAFBFB;}",
  "section.blok h2{font-size:11.5pt;margin:0 0 6px;color:#1F4E4E;}",
  "section.blok h3{font-size:10.5pt;margin:8px 0 2px;}",
  "section.blok ul{margin:2px 0 6px 18px;padding:0;font-size:9.5pt;}",
  "section.blok li{margin-bottom:2px;}",
  ".onay{margin-top:8px;font-size:10pt;padding:6px 8px;background:#EFF6F3;border-left:3px solid #1F4E4E;}",
  "footer{margin-top:14px;font-size:8pt;color:#555;border-top:1px solid #cfd8d6;padding-top:6px;}",
  ".ayrac{border:0;border-top:1px dashed #cfd8d6;margin:8px 0;}"
].join("\n");

/** Üst bilgi + referans/tarih kutusu + başlık — iki şablon de aynı düzeni kullanır. */
function pdfUst(baslikTr, baslikDil, dil, ref, zaman, ekSatirHtml) {
  var baslik = kacis(baslikTr) + ((dil !== "tr" && baslikDil) ? " / " + kacis(baslikDil) : "");
  return '<header class="ust"><div class="kunye">Marche-en-Famenne Ulu Camii — Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL — KBO 0421.900.807 — Thier des Corbeaux 14, 6900 Marche-en-Famenne — info@ulucamii.be</div>'
    + '<div class="ref-kutu">Ref: <b>' + kacis(ref) + '</b><br>' + kacis(zaman) + (ekSatirHtml ? "<br>" + ekSatirHtml : "") + '</div></header>'
    + '<h1>' + baslik + '</h1>';
}

/** [ [etiketHtml, degerHtml], ... ] dizisinden iki sütunlu tablo üretir. */
function pdfTablo(satirlar) {
  var iç = satirlar.map(function (s) {
    if (s && s.bolum) return '<tr class="bolum"><th colspan="2">' + s.bolum + "</th></tr>"; // v20: bölüm şeridi
    return "<tr><th>" + s[0] + "</th><td>" + s[1] + "</td></tr>";
  }).join("");
  return '<table class="bilgi">' + iç + "</table>";
}

/* --- Kurs kuralları / sözleşme özeti (TR + FR, kayıt PDF'ine her zaman ikisi de eklenir) --- */
var KURALLAR_OGRENCI_TR = "Öğrenci: cami ve kurs kurallarına uyar; derslere düzenli ve zamanında gelir; kurs eşyasına özen gösterir; arkadaşlarına, hocalarına ve görevlilere saygılı davranır; zararlı maddelerden ve kumardan uzak durur; sınıfını temiz ve düzenli tutar; derste izinsiz dışarı çıkmaz.";
var KURALLAR_VELI_TR = "Veli: öğrencinin zamanında ve hazır gelmesini sağlar; duyuruları takip eder ve veli toplantılarına katılır; öğrencinin sağlık/ruh hâlindeki önemli değişiklikleri kursa bildirir; kursun ücretsiz olduğunu, ders kitaplarının (“Camiye Gidiyorum 1–2”, “Temel Dinî Bilgiler”) ve defter-kalem gibi materyallerin velinin sorumluluğunda olduğunu kabul eder; kursta çekilen görüntülerin kullanımı için verdiği izni istediği zaman geri alabilir.";
var KURALLAR_OGRENCI_FR = "Élève : respecte les règles de la mosquée et du cours ; vient aux cours régulièrement et à l'heure ; prend soin du matériel du cours ; se comporte avec respect envers ses camarades, ses enseignants et le personnel ; évite toute substance nocive et les jeux d'argent ; garde sa classe propre et rangée ; ne sort pas de la classe sans autorisation pendant le cours.";
var KURALLAR_VELI_FR = "Parent : veille à ce que l'élève arrive à l'heure et prêt ; suit les communications et participe aux réunions de parents ; informe le cours de tout changement important dans l'état de santé ou psychologique de l'élève ; reconnaît que le cours est gratuit et que l'achat des manuels (« Camiye Gidiyorum 1-2 », « Temel Dinî Bilgiler ») et du matériel scolaire (cahier, stylo, etc.) reste à sa charge ; peut retirer à tout moment l'autorisation donnée pour l'utilisation des images prises pendant le cours.";

/**
 * Kur'an kursu kayıt formu PDF'i — SAF fonksiyon (string in, string out).
 * veri: doPost gövdesiyle aynı şekil ({ dil, ogrenci, veli, acil, saglik, goruntuIzni, onay }).
 * meta: { ref, zaman: "gg.aa.yyyy SS:dd" (Europe/Brussels, dışarıda formatlanmış), dil }.
 */
function pdfHtmlKayit(veri, meta) {
  veri = veri || {};
  meta = meta || {};
  var dil = meta.dil || veri.dil || "tr";
  var o = veri.ogrenci || {};
  var veli = veri.veli || {};
  var acil = veri.acil || {};
  var saglik = veri.saglik || {};
  var onay = veri.onay || {};
  var ref = meta.ref || "";
  var zaman = meta.zaman || "";
  // Ders yılı: defter adındaki "2026-2027" (tek kaynak) — meta.dersYili verilirse o
  var dersYili = String(meta.dersYili || ((typeof AYAR2 !== "undefined" && AYAR2 && AYAR2.tabloAdi) ? (String(AYAR2.tabloAdi).match(/\d{4}-\d{4}/) || [""])[0] : "")).replace("-", "\u2013");

  var okulGoster = (o.okul === "diger" && o.okulDiger) ? o.okulDiger : (o.okul || "");
  var E = function (anahtar) { return ikiDilliEtiket(ETIKET_KAYIT[anahtar], dil); };
  var D = function (sozluk) { return ikiDilliEtiket(sozluk, dil); };
  var bolum = function (tr, fr, en) { return { bolum: ikiDilliEtiket({ tr: tr, fr: fr, en: en }, dil) }; };
  var ogrenciAd = ((o.ad || "") + " " + (o.soyad || "")).trim();
  var tarihKisa = (String(zaman).match(/^\d{2}\.\d{2}\.\d{4}/) || [""])[0]; // tarihle başlamıyorsa kutu boş kalır
  var formDiliBuyuk = kacis((veri.dil || "tr").toUpperCase());

  // Sağlık notu hücresi: veliye giden kopyada el yazısı; Drive arşiv kopyasında (meta.saglikGizle) basılı sistem notu —
  // not yalnız defterde tutulur ve ders yılı sonunda silinir (gizlilik bildirimi).
  var saglikNotHucre = "";
  if (saglik.var) {
    saglikNotHucre = meta.saglikGizle
      ? '<span class="sistem-not">' + (dil === "fr" ? "Conservée uniquement dans le registre d’inscription ; non reprise dans ce document."
         : dil === "en" ? "Kept only in the registration register; not included in this document."
         : "Yalnız kayıt defterinde tutulur; bu belgeye yazılmamıştır.") + "</span>"
      : '<span class="not">' + elYazisi(saglik.not, String(saglik.not || "").length > 300 ? "el-k" : "") + "</span>";
  }
  var rizaNotu = dil === "fr" ? "communiquée avec consentement explicite" : dil === "en" ? "shared with explicit consent" : "açık rızayla verilmiştir";

  // 1. SAYFA — form: velinin yazdığı her değer mavi el yazısı; seçenekli sorular basılı kutu + kalemle çarpı
  var satirlar = [
    bolum("Öğrenci", "Élève", "Student"),
    [E("ogrenciAdSoyad"), elYazisi(ogrenciAd)],
    [E("ogrenciDogum"), elYazisi(tarihGoster(o.dogumTarihi))],
    [E("ogrenciCinsiyet"), secenekKutulari(ENUM_CINSIYET_OGRENCI, o.cinsiyet, dil)],
    [E("okul"), elYazisi(okulGoster)],
    [E("sinif"), elYazisi(o.sinif)],
    [E("kursDurumu"), secenekKutulari(ENUM_KURS_DURUMU, o.kursDurumu, dil)],
    bolum("Veli", "Parent", "Parent"),
    [E("veliYakinlik"), secenekKutulari(ENUM_YAKINLIK, veli.yakinlik, dil)],
    [E("veliAdSoyad"), elYazisi(veli.adSoyad)],
    [E("veliCep"), elYazisi(veli.cep)],
    [E("veliEposta"), elYazisi(veli.eposta)],
    [E("adres"), elYazisi(veli.adres)],
    [E("postaSehir"), elYazisi(((veli.postaKodu || "") + " " + (veli.sehir || "")).trim())],
    [E("iletisimDili"), secenekKutulari(ENUM_ILETISIM_DILI, veli.iletisimDili, dil)],
    bolum("Acil durum", "Urgence", "Emergency"),
    [E("acilKisi"), elYazisi(acil.adSoyad)],
    [E("acilCep"), elYazisi(acil.cep)],
    bolum("Sağlık ve izinler", "Santé et autorisations", "Health and permissions"),
    [E("saglikVar"), evetHayirKutu(!!saglik.var, dil)],
    saglik.var ? [E("saglikBilgisi") + ' <span class="kucuk">(' + rizaNotu + ")</span>", saglikNotHucre] : null,
    [E("goruntuIzni"), evetHayirKutu(!!veri.goruntuIzni, dil)],
    [E("goruntuSosyalIzni"), evetHayirKutu(!!veri.goruntuSosyalIzni, dil)],
    [E("formDili"), secenekKutulari(ENUM_FORM_DILI, veri.dil || "tr", dil)]
  ].filter(Boolean);

  var dersYiliHtml = dersYili ? '<span class="yil">' + D(DERS_YILI_ETIKET) + " " + kacis(dersYili) + "</span>" : "";
  var sayfa1 = pdfUst("Kur'an Kursu Kayıt Formu", dil === "fr" ? "Formulaire d'inscription à l'école coranique" : dil === "en" ? "Qur'an course registration form" : "", dil, ref, zaman, dersYiliHtml)
    + pdfTablo(satirlar);

  // 2. SAYFA — veli sözleşmesi: kurallar TR | FR yan yana, onay kutuları (kalemle çarpı), tarih / imza satırı.
  // İmza alanındaki ad velinin forma yazdığı addır; basılı not bunun elektronik onay olduğunu söyler.
  var kuralParagraf = function (metin) {
    var i = String(metin).indexOf(":");
    return i > 0 ? "<b>" + kacis(String(metin).slice(0, i + 1)) + "</b>" + kacis(String(metin).slice(i + 1)) : kacis(metin);
  };
  var sozlesmeBaslik = kacis(SOZLESME_BASLIK.tr) + (dil !== "tr" && SOZLESME_BASLIK[dil] ? " / " + kacis(SOZLESME_BASLIK[dil]) : "");
  var onayKutular = '<div class="onay-kutular">'
    + kutu(!!onay.kurallar, D(ONAY_METIN.kurallar))
    + kutu(!!onay.gizlilik, D(ONAY_METIN.gizlilik))
    + (saglik.var ? kutu(!!onay.saglikRiza, D(ONAY_METIN.saglikRiza)) : "")
    + "</div>";
  var imzaBlok = '<table class="imza"><tr>'
    + '<td class="dar"><div class="imza-cizgi">' + elYazisi(tarihKisa) + '</div><div class="imza-etiket">' + E("tarih") + "</div></td>"
    + '<td><div class="imza-cizgi">' + elYazisi(onay.elektronikImza) + '</div><div class="imza-etiket">' + E("elektronikImza") + "</div></td>"
    + "</tr></table>";
  var sayfa2 = '<section class="sozlesme">'
    + "<h1>" + sozlesmeBaslik + "</h1>"
    + '<div class="s-kimlik"><span>' + E("ogrenciAdSoyad") + ": " + elYazisi(ogrenciAd) + '</span><span class="ref">Ref ' + kacis(ref) + (dersYili ? " \u00b7 " + D(DERS_YILI_ETIKET) + " " + kacis(dersYili) : "") + "</span></div>"
    + '<table class="kurallar"><tr>'
    + "<td><h3>Türkçe</h3><p>" + kuralParagraf(KURALLAR_OGRENCI_TR) + "</p><p>" + kuralParagraf(KURALLAR_VELI_TR) + "</p></td>"
    + "<td><h3>Français</h3><p>" + kuralParagraf(KURALLAR_OGRENCI_FR) + "</p><p>" + kuralParagraf(KURALLAR_VELI_FR) + "</p></td>"
    + "</tr></table>"
    + '<h2 class="onay-baslik">' + D(ONAY_BASLIK) + "</h2>"
    + '<p class="onay-giris">' + D(ONAY_GIRIS) + "</p>"
    + onayKutular + imzaBlok
    + '<p class="onay-not">Bu belge çevrim içi formla oluşturulmuş, veli tarafından ' + kacis(zaman) + " tarihinde elektronik olarak onaylanmıştır (form dili: " + formDiliBuyuk + "); imza alanındaki ad, velinin forma yazdığı addır. / "
    + "Ce document a été généré via le formulaire en ligne et approuvé électroniquement par le parent le " + kacis(zaman) + " (langue du formulaire : " + formDiliBuyuk + ") ; le nom dans la case signature est celui saisi par le parent dans le formulaire.</p>"
    + "</section>";

  var altBilgi = "<footer>Bu belgedeki kişisel veriler yalnız Kur'an kursu yönetimi için işlenir ve eğitim dönemi + 2 yıl saklanır. "
    + "Verilerinize erişim, düzeltme veya silme talebi için: info@ulucamii.be — "
    + "Les données personnelles de ce document sont traitées uniquement pour la gestion du cours coranique et conservées pendant l'année scolaire + 2 ans. "
    + "Pour accéder, corriger ou supprimer vos données : info@ulucamii.be</footer>";

  return "<!DOCTYPE html><html lang=\"" + kacis(dil) + "\"><head><meta charset=\"utf-8\"><title>" + kacis(ref)
    + "</title><style>" + PDF_CSS + "\n" + kayitCss(!!meta.sade, ref, D(DEVAM_METIN)) + "</style></head><body>"
    + sayfa1
    + sayfa2
    + altBilgi
    + "</body></html>";
}

/**
 * İhtida (Müslüman olma) ön başvuru formu PDF'i — SAF fonksiyon.
 * veri: { dil, basvuran, sahitler, fotografIzni, onay }. meta: { ref, zaman, dil }.
 */
function pdfHtmlIhtida(veri, meta) {
  veri = veri || {};
  meta = meta || {};
  var dil = meta.dil || veri.dil || "tr";
  var b = veri.basvuran || {};
  var onay = veri.onay || {};
  var sahitler = Array.isArray(veri.sahitler) ? veri.sahitler : [];
  var ref = meta.ref || "";
  var zaman = meta.zaman || "";
  var d = function (v) { var s = (v === undefined || v === null) ? "" : String(v).trim(); return s ? kacis(s) : "—"; };

  var satirlar = [
    [ikiDilliEtiket(ETIKET_IHTIDA.adSoyad, dil), d(b.adSoyad)],
    [ikiDilliEtiket(ETIKET_IHTIDA.cinsiyet, dil), etiketDeger(ENUM_CINSIYET_BASVURAN, b.cinsiyet, dil)],
    [ikiDilliEtiket(ETIKET_IHTIDA.dogumTarihi, dil), d(tarihGoster(b.dogumTarihi))],
    [ikiDilliEtiket(ETIKET_IHTIDA.dogumYeri, dil), d(b.dogumYeri)],
    [ikiDilliEtiket(ETIKET_IHTIDA.uyruk, dil), d(b.uyruk)],
    [ikiDilliEtiket(ETIKET_IHTIDA.anneAdi, dil), d(b.anneAdi)],
    [ikiDilliEtiket(ETIKET_IHTIDA.babaAdi, dil), d(b.babaAdi)],
    [ikiDilliEtiket(ETIKET_IHTIDA.medeniHali, dil), etiketDeger(ENUM_MEDENI, b.medeniHali, dil)],
    [ikiDilliEtiket(ETIKET_IHTIDA.ogrenimDurumu, dil), d(b.ogrenimDurumu)],
    [ikiDilliEtiket(ETIKET_IHTIDA.meslek, dil), d(b.meslek)],
    [ikiDilliEtiket(ETIKET_IHTIDA.oncekiDin, dil), d(b.oncekiDin)],
    [ikiDilliEtiket(ETIKET_IHTIDA.ihtidaSebebi, dil), d(b.ihtidaSebebi)],
    [ikiDilliEtiket(ETIKET_IHTIDA.yeniIsim, dil), d(b.yeniIsim)],
    [ikiDilliEtiket(ETIKET_IHTIDA.eposta, dil), d(b.eposta)],
    [ikiDilliEtiket(ETIKET_IHTIDA.telefon, dil), d(b.telefon)],
    [ikiDilliEtiket(ETIKET_IHTIDA.adres, dil), d(b.adres)],
    [ikiDilliEtiket(ETIKET_IHTIDA.torenDili, dil), etiketDeger(ENUM_TOREN_DILI, b.torenDili, dil)],
    [ikiDilliEtiket(ETIKET_IHTIDA.torenTarihi, dil), d(b.torenTarihi)],
    [ikiDilliEtiket(ETIKET_IHTIDA.nasilHaberdar, dil), d(b.nasilHaberdar)],
    [ikiDilliEtiket(ETIKET_IHTIDA.ekNot, dil), d(b.ekNot)],
    [ikiDilliEtiket(ETIKET_IHTIDA.fotografIzni, dil), evetHayirGoster(!!veri.fotografIzni, dil)],
    [ikiDilliEtiket(ETIKET_IHTIDA.sahit1, dil), d(sahitler[0] && sahitler[0].ad)],
    [ikiDilliEtiket(ETIKET_IHTIDA.sahit2, dil), d(sahitler[1] && sahitler[1].ad)],
    [ikiDilliEtiket(ETIKET_IHTIDA.formDili, dil), d((veri.dil || "tr").toUpperCase())]
  ];

  var beyanTr = "Kendi hür irademle, hiçbir baskı altında kalmadan İslam dinine girmek istediğimi beyan ederim.";
  var beyanFr = "Je déclare vouloir embrasser l'islam de mon plein gré, sans aucune contrainte.";
  var beyanBlok = '<section class="blok"><h2>Beyan / Déclaration</h2>'
    + "<p>" + kacis(beyanTr) + "<br>" + kacis(beyanFr) + "</p>"
    + '<div class="onay">Elektronik beyan / Déclaration électronique: <b>' + kacis(onay.beyan || "") + "</b> — " + kacis(zaman) + "</div>"
    + "<p style=\"margin-top:8px;font-size:9pt;color:#444\">Vesikalık fotoğraf ve ıslak imzalar törende elden alınır; "
    + "kimlik belgesi din görevlisine yalnız GÖSTERİLİR, kopyası alınmaz. / "
    + "La photo d'identité et les signatures manuscrites sont recueillies lors de la cérémonie ; "
    + "la pièce d'identité est uniquement MONTRÉE à l'imam, aucune copie n'en est conservée.</p>"
    + "</section>";

  var altBilgi = "<footer>Bu bir ön başvurudur; resmî İhtida Belgesi (EK-9) törenin ardından düzenlenir. "
    + "Dinî inanç verisi yalnız bu belge için, açık rızanızla işlenir (GDPR md. 9/2-a). "
    + "Il s'agit d'une pré-demande ; l'attestation officielle (EK-9) est délivrée après la cérémonie. "
    + "Les données relatives aux convictions religieuses ne sont traitées que pour ce document, avec votre consentement explicite.</footer>";

  return "<!DOCTYPE html><html lang=\"" + kacis(dil) + "\"><head><meta charset=\"utf-8\"><title>" + kacis(ref)
    + "</title><style>" + PDF_CSS + "</style></head><body>"
    + pdfUst("İhtida (Müslüman Olma) Ön Başvuru Formu", "Formulaire de pré-demande de conversion à l'islam", dil, ref, zaman)
    + pdfTablo(satirlar)
    + beyanBlok
    + altBilgi
    + "</body></html>";
}

/* === SAF (PURE) BÖLÜM SONU === */


/* ===================================================================
   DOĞRULAMA YARDIMCILARI (GAS API'si kullanmaz, ama pure bölümün dışında
   tutuldu çünkü Node önizlemesi bunlara ihtiyaç duymuyor)
   =================================================================== */

function metinDolu(s) { return typeof s === "string" && s.trim().length > 0; }
function uzunlukTamam(s, maks) { return String(s == null ? "" : s).length <= maks; }
function epostaGecerli(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim()); }
function cepGecerli(s) { return /^\+\d{8,15}$/.test(String(s || "").trim()); }

function tarihGecerliMi(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
  if (!m) return null;
  var yil = +m[1], ay = +m[2], gun = +m[3];
  if (ay < 1 || ay > 12 || gun < 1 || gun > 31) return null;
  var dt = new Date(Date.UTC(yil, ay - 1, gun));
  if (dt.getUTCFullYear() !== yil || dt.getUTCMonth() !== ay - 1 || dt.getUTCDate() !== gun) return null;
  return dt;
}

function yasHesapla(dogum, referans) {
  var yas = referans.getUTCFullYear() - dogum.getUTCFullYear();
  var ay = referans.getUTCMonth() - dogum.getUTCMonth();
  if (ay < 0 || (ay === 0 && referans.getUTCDate() < dogum.getUTCDate())) yas--;
  return yas;
}

/** "tamam" | "format" | "aralik" döner. */
function yasDogrula(iso, minYas, maxYas) {
  var dt = tarihGecerliMi(iso);
  if (!dt) return "format";
  var bugun = new Date();
  var bugunUtc = new Date(Date.UTC(bugun.getUTCFullYear(), bugun.getUTCMonth(), bugun.getUTCDate()));
  if (dt.getTime() > bugunUtc.getTime()) return "aralik";
  var yas = yasHesapla(dt, bugunUtc);
  if (yas < minYas || yas > maxYas) return "aralik";
  return "tamam";
}

var SINIFLAR_GECERLI = ["M1", "M2", "M3", "P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "diger"];

function h(kod) { return { tamam: false, kod: kod }; }

function kayitDogrulaV2(v) {
  if (!v || typeof v !== "object") return h("bos-istek");
  if (v.sir !== AYAR2.ortakSir) return h("yetkisiz");
  var o = v.ogrenci || {}, veli = v.veli || {}, acil = v.acil || {}, saglik = v.saglik || {}, onay = v.onay || {};

  if (!metinDolu(o.ad) || !uzunlukTamam(o.ad, 60)) return h("ogrenci-ad-eksik");
  if (!metinDolu(o.soyad) || !uzunlukTamam(o.soyad, 60)) return h("ogrenci-soyad-eksik");
  if (["kiz", "erkek"].indexOf(o.cinsiyet) === -1) return h("ogrenci-cinsiyet-gecersiz");
  var yasSonuc = yasDogrula(o.dogumTarihi, 3, 25);
  if (yasSonuc === "format") return h("ogrenci-dogum-tarihi-gecersiz");
  if (yasSonuc === "aralik") return h("ogrenci-yas-disi");
  if (!metinDolu(o.okul) || !uzunlukTamam(o.okul, 120)) return h("ogrenci-okul-eksik");
  if (o.okul === "diger" && (!metinDolu(o.okulDiger) || !uzunlukTamam(o.okulDiger, 120))) return h("ogrenci-okul-diger-eksik");
  if (SINIFLAR_GECERLI.indexOf(o.sinif) === -1) return h("ogrenci-sinif-gecersiz");
  if (["yeni", "devam"].indexOf(o.kursDurumu) === -1) return h("ogrenci-kurs-durumu-gecersiz");

  if (["anne", "baba", "vasi"].indexOf(veli.yakinlik) === -1) return h("veli-yakinlik-gecersiz");
  if (!metinDolu(veli.adSoyad) || !uzunlukTamam(veli.adSoyad, 120)) return h("veli-adsoyad-eksik");
  if (!cepGecerli(veli.cep)) return h("veli-cep-gecersiz");
  if (!epostaGecerli(veli.eposta)) return h("veli-eposta-gecersiz");
  if (!metinDolu(veli.adres) || !uzunlukTamam(veli.adres, 200)) return h("veli-adres-eksik");
  if (veli.postaKodu && !uzunlukTamam(veli.postaKodu, 12)) return h("veli-posta-kodu-uzun");
  if (veli.sehir && !uzunlukTamam(veli.sehir, 80)) return h("veli-sehir-uzun");
  if (["tr", "fr"].indexOf(veli.iletisimDili) === -1) return h("veli-iletisim-dili-gecersiz");

  if (acil.adSoyad && !uzunlukTamam(acil.adSoyad, 120)) return h("acil-adsoyad-uzun");
  if (acil.cep && !cepGecerli(acil.cep)) return h("acil-cep-gecersiz");

  if (typeof saglik.var !== "boolean") return h("saglik-var-gecersiz");
  if (saglik.var) {
    if (!metinDolu(saglik.not)) return h("saglik-not-eksik");
    if (!uzunlukTamam(saglik.not, 600)) return h("saglik-not-uzun");
  }

  if (typeof v.goruntuIzni !== "boolean") return h("goruntu-izni-gecersiz");
  if (v.goruntuSosyalIzni !== undefined && typeof v.goruntuSosyalIzni !== "boolean") return h("goruntu-sosyal-izni-gecersiz");
  if (onay.kurallar !== true) return h("onay-kurallar-eksik");
  if (onay.gizlilik !== true) return h("onay-gizlilik-eksik");
  if (saglik.var && onay.saglikRiza !== true) return h("onay-saglik-riza-eksik");
  if (!metinDolu(onay.elektronikImza)) return h("onay-imza-eksik");
  if (!adSadelestirEsit(onay.elektronikImza, veli.adSoyad)) return h("onay-imza-eslesmiyor");

  if (["tr", "fr", "en"].indexOf(v.dil) === -1) return h("dil-gecersiz");
  return { tamam: true };
}

var TOREN_DILLERI_GECERLI = ["tr", "fr", "en", "ar"];

function ihtidaDogrulaV2(v) {
  if (!v || typeof v !== "object") return h("bos-istek");
  if (v.sir !== AYAR2_IHTIDA.ortakSir) return h("yetkisiz");
  var b = v.basvuran || {}, onay = v.onay || {};

  if (!metinDolu(b.adSoyad) || !uzunlukTamam(b.adSoyad, 120)) return h("basvuran-adsoyad-eksik");
  if (["kadin", "erkek"].indexOf(b.cinsiyet) === -1) return h("basvuran-cinsiyet-gecersiz");
  var yasSonuc = yasDogrula(b.dogumTarihi, 16, 120);
  if (yasSonuc === "format") return h("basvuran-dogum-tarihi-gecersiz");
  if (yasSonuc === "aralik") return h("basvuran-yas-disi");
  if (!metinDolu(b.dogumYeri) || !uzunlukTamam(b.dogumYeri, 120)) return h("basvuran-dogum-yeri-eksik");
  if (!metinDolu(b.uyruk) || !uzunlukTamam(b.uyruk, 80)) return h("basvuran-uyruk-eksik");
  if (!metinDolu(b.anneAdi) || !uzunlukTamam(b.anneAdi, 80)) return h("basvuran-anne-adi-eksik");
  if (!metinDolu(b.babaAdi) || !uzunlukTamam(b.babaAdi, 80)) return h("basvuran-baba-adi-eksik");
  if (["bekar", "evli", "dul", "bosanmis"].indexOf(b.medeniHali) === -1) return h("basvuran-medeni-hali-gecersiz");
  if (!metinDolu(b.ogrenimDurumu) || !uzunlukTamam(b.ogrenimDurumu, 80)) return h("basvuran-ogrenim-eksik");
  if (!metinDolu(b.meslek) || !uzunlukTamam(b.meslek, 80)) return h("basvuran-meslek-eksik");
  if (!metinDolu(b.oncekiDin) || !uzunlukTamam(b.oncekiDin, 80)) return h("basvuran-onceki-din-eksik");
  if (b.ihtidaSebebi && !uzunlukTamam(b.ihtidaSebebi, 600)) return h("basvuran-sebep-uzun");
  if (b.yeniIsim && !uzunlukTamam(b.yeniIsim, 120)) return h("basvuran-yeni-isim-uzun");
  if (!epostaGecerli(b.eposta)) return h("basvuran-eposta-gecersiz");
  if (!cepGecerli(b.telefon)) return h("basvuran-telefon-gecersiz");
  if (!metinDolu(b.adres) || !uzunlukTamam(b.adres, 200)) return h("basvuran-adres-eksik");
  if (TOREN_DILLERI_GECERLI.indexOf(b.torenDili) === -1) return h("basvuran-toren-dili-gecersiz");
  if (b.torenTarihi && !uzunlukTamam(b.torenTarihi, 120)) return h("basvuran-toren-tarihi-uzun");
  if (b.nasilHaberdar && !uzunlukTamam(b.nasilHaberdar, 120)) return h("basvuran-nasil-haberdar-uzun");
  if (b.ekNot && !uzunlukTamam(b.ekNot, 600)) return h("basvuran-ek-not-uzun");

  var sahitler = Array.isArray(v.sahitler) ? v.sahitler : [];
  for (var si = 0; si < sahitler.length; si++) {
    if (sahitler[si] && sahitler[si].ad && !uzunlukTamam(sahitler[si].ad, 120)) return h("sahit-adi-uzun");
  }

  if (typeof v.fotografIzni !== "boolean") return h("fotograf-izni-gecersiz");
  if (onay.acikRiza !== true) return h("onay-acik-riza-eksik");
  if (onay.ek10 !== true) return h("onay-ek10-eksik");
  if (onay.gizlilik !== true) return h("onay-gizlilik-eksik");
  if (!metinDolu(onay.beyan)) return h("onay-beyan-eksik");
  if (!adSadelestirEsit(onay.beyan, b.adSoyad)) return h("onay-beyan-eslesmiyor");

  if (["tr", "fr", "en"].indexOf(v.dil) === -1) return h("dil-gecersiz");
  return { tamam: true };
}


/* ===================================================================
   1) KUR'AN KURSU KAYIT — v2
   =================================================================== */

var AYAR2 = {
  tabloAdi: "Kur'an Kursu Kayıt Defteri 2026-2027 (v2)",
  bildirimEposta: "ulucamii.marche@gmail.com,info@ulucamii.be",
  ortakSir: "ULUCAMII-KAYIT-2026",
  yil: "2026"
};

var BASLIKLAR2 = [
  "Zaman damgası", "Referans", "Öğrenci soyadı", "Öğrenci adı", "Doğum tarihi", "Cinsiyet", "Okul", "Sınıf", "Kurs durumu",
  "Veli yakınlığı", "Veli adı soyadı", "Veli cep", "Veli e-posta", "Adres", "Posta kodu", "Şehir", "İletişim dili",
  "Acil kişi", "Acil cep", "Sağlık notu", "Sağlık rızası", "Görüntü izni", "Elektronik imza", "Form dili",
  "PDF bağlantısı", "Durum", "Gönderim anahtarı", "Sosyal medya izni"   // v18: sona eklendi (eski satırlar kaymasın)
];
var SUTUN2 = { referans: 2, durum: 26, anahtar: 27 };

/* ----- v1 (eski) klasör/defter — YALNIZCA okumak/geçmişten sayı üretmek için ----- */
var AYAR = {
  klasorAdi: "Kur'an Kursu Kayıtları 2026-2027",
  tabloAdi: "Kur'an Kursu Kayıt Defteri 2026-2027"
};
var AYAR_IHTIDA = {
  klasorAdi: "İhtida Başvuruları",
  tabloAdi: "İhtida Başvuru Defteri"
};

function klasorGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("KLASOR_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var bul = DriveApp.getFoldersByName(AYAR.klasorAdi);
  var k = bul.hasNext() ? bul.next() : DriveApp.createFolder(AYAR.klasorAdi);
  p.setProperty("KLASOR_ID", k.getId());
  return k;
}

function ihtidaKlasorGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("IHTIDA_KLASOR_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var bul = DriveApp.getFoldersByName(AYAR_IHTIDA.klasorAdi);
  var k = bul.hasNext() ? bul.next() : DriveApp.createFolder(AYAR_IHTIDA.klasorAdi);
  p.setProperty("IHTIDA_KLASOR_ID", k.getId());
  return k;
}

/** v1 defterini YARATMADAN bulur — yoksa null (sayım ve geçmiş numaralandırma için). */
function v1SayfaBulTablo(idPropAdi, tabloAdi) {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty(idPropAdi);
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) {} }
  try {
    var bul = DriveApp.getFilesByName(tabloAdi);
    if (bul.hasNext()) return SpreadsheetApp.open(bul.next()).getSheets()[0];
  } catch (e2) {}
  return null;
}

function kayitV2SayfaGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("TABLO2_ID");
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(AYAR2.tabloAdi);
    var dosya = DriveApp.getFileById(ss.getId());
    klasorGetir().addFile(dosya);
    DriveApp.getRootFolder().removeFile(dosya);
    p.setProperty("TABLO2_ID", ss.getId());
  }
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0 || sh.getLastColumn() < BASLIKLAR2.length) {
    sh.getRange(1, 1, 1, BASLIKLAR2.length).setValues([BASLIKLAR2])
      .setFontWeight("bold").setBackground("#1F4E4E").setFontColor("#FFFFFF");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(SUTUN2.referans, 120);
    sh.setColumnWidth(SUTUN2.durum, 200);
  }
  return sh;
}

function kayitV2AnahtarBul(sayfa, anahtar) {
  var onbellek = CacheService.getScriptCache();
  var ham = onbellek.get("kayit2:" + anahtar);
  if (ham) { try { return JSON.parse(ham); } catch (_) {} }
  if (sayfa.getLastRow() < 2 || sayfa.getLastColumn() < SUTUN2.anahtar) return null;
  var veri = sayfa.getRange(2, 1, sayfa.getLastRow() - 1, SUTUN2.anahtar).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][SUTUN2.anahtar - 1]).trim() === anahtar) {
      var sonuc = { ref: String(veri[i][SUTUN2.referans - 1]) };
      onbellek.put("kayit2:" + anahtar, JSON.stringify(sonuc), 21600);
      return sonuc;
    }
  }
  return null;
}
function kayitV2AnahtarKaydet(anahtar, ref) {
  try { CacheService.getScriptCache().put("kayit2:" + anahtar, JSON.stringify({ ref: ref }), 21600); } catch (_) {}
}

function kayitPostIsleV2(v) {
  try {
    var dogrulama = kayitDogrulaV2(v);
    if (!dogrulama.tamam) return json({ ok: false, hata: dogrulama.kod });

    var klasor = klasorGetir();
    var sayfaV2 = kayitV2SayfaGetir();
    var anahtar = temizAnahtar(v.gonderimAnahtari);

    var onceki = anahtar ? kayitV2AnahtarBul(sayfaV2, anahtar) : null;
    if (onceki) return json({ ok: true, ref: onceki.ref, tekrar: true });

    var o = v.ogrenci, veli = v.veli, acil = v.acil || {}, saglik = v.saglik || {}, onay = v.onay;
    var adSoyad = (o.soyad + " " + o.ad).trim();

    var kilit = LockService.getScriptLock();
    kilit.waitLock(30000);
    var ref, dosya, blob, okulHucre;
    try {
      onceki = anahtar ? kayitV2AnahtarBul(sayfaV2, anahtar) : null;
      if (onceki) return json({ ok: true, ref: onceki.ref, tekrar: true });

      var sayfaV1 = v1SayfaBulTablo("TABLO_ID", AYAR.tabloAdi);
      ref = "UC-" + AYAR2.yil + "-" + ("0000" + referansMaxBul([sayfaV1, sayfaV2], "UC")).slice(-4);

      var zamanDate = new Date();
      var meta = { ref: ref, zaman: Utilities.formatDate(zamanDate, "Europe/Brussels", "dd.MM.yyyy HH:mm"), dil: v.dil };
      var dosyaAdi = ref + " - " + adSoyad + ".pdf";
      blob = kayitPdfUret(v, meta, dosyaAdi);
      // Sağlık notu varsa Drive kopyası notsuz üretilir (gizlilik: not yalnız defterde); veli tam kopyayı e-postayla alır.
      dosya = klasor.createFile(saglik.var ? kayitPdfUret(v, Object.assign({}, meta, { saglikGizle: true }), dosyaAdi) : blob);

      okulHucre = o.okul === "diger" ? ("Diğer: " + (o.okulDiger || "")) : o.okul;

      satirEkle(sayfaV2, [
        zamanDate, ref, o.soyad, o.ad, o.dogumTarihi || "", o.cinsiyet || "", okulHucre || "", o.sinif || "", o.kursDurumu || "",
        veli.yakinlik || "", veli.adSoyad || "", veli.cep || "", veli.eposta || "", veli.adres || "",
        veli.postaKodu || "", veli.sehir || "", veli.iletisimDili || "",
        acil.adSoyad || "", acil.cep || "",
        saglik.var ? (saglik.not || "") : "", saglik.var ? (onay.saglikRiza ? "Evet" : "Hayır") : "",
        v.goruntuIzni ? "Evet" : "Hayır", onay.elektronikImza || "", v.dil || "",
        dosya.getUrl(), "Yeni kayıt", anahtar,
        v.goruntuSosyalIzni === true ? "Evet" : "Hayır"
      ]);
      SpreadsheetApp.flush();
      if (anahtar) kayitV2AnahtarKaydet(anahtar, ref);
    } finally {
      kilit.releaseLock();
    }

    try {
      MailApp.sendEmail({
        to: AYAR2.bildirimEposta,
        subject: "Kurs kaydı: " + adSoyad + "  [" + ref + "]",
        body: [
          "Kur'an kursuna yeni bir kayıt geldi.", "",
          "Referans      : " + ref,
          "Öğrenci       : " + adSoyad,
          "Doğum tarihi  : " + (o.dogumTarihi || "-"),
          "Okul / Sınıf  : " + (okulHucre || "-") + " / " + (o.sinif || "-"),
          "Veli          : " + (veli.adSoyad || "-") + " (" + (veli.yakinlik || "-") + ")",
          "Veli telefon  : " + (veli.cep || "-"),
          "Veli e-posta  : " + (veli.eposta || "-"),
          "Sağlık notu   : " + (saglik.var ? (saglik.not || "-") : "Yok"),
          "Görüntü izni  : " + (v.goruntuIzni ? "Evet" : "Hayır") + " (site/duyurular) · " + (v.goruntuSosyalIzni === true ? "Evet" : "Hayır") + " (sosyal medya)",
          "",
          "Doldurulmuş form ektedir.",
          "Drive: " + dosya.getUrl(),
          "Kayıt defteri: " + sayfaV2.getParent().getUrl()
        ].join("\n"),
        attachments: [blob],
        name: EPOSTA.ad,
        replyTo: epostaGecerli(veli.eposta) ? String(veli.eposta).trim() : EPOSTA.yanit
      });
    } catch (bildirimHatasi) {
      console.error("bildirim gonderilemedi: " + bildirimHatasi);
      try {
        var satir = satirBulGenel(sayfaV2, ref, SUTUN2.referans);
        if (satir > 0) sayfaV2.getRange(satir, SUTUN2.durum).setValue("Yeni kayıt · e-posta gönderilemedi");
      } catch (_) {}
    }

    try { kopyaGonderV2(blob, ref, adSoyad, [veli.eposta]); }
    catch (kopyaHatasi) { console.error("kopya gonderilemedi: " + kopyaHatasi); }

    return json({ ok: true, ref: ref, tekrar: false });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "sunucu-hatasi", ayrinti: String(hata).slice(0, 200) });
  }
}

/* --- E-POSTA KİMLİĞİ (v12'den değişmedi) --- */
var EPOSTA = { yanit: "info@ulucamii.be", ad: "Ulu Camii Marche-en-Famenne" };

/* DERS KİTAPLARI (v14'ten AYNEN korunmuştur) */
var KITAPLAR = {
  zsuShop: "https://zsu-shop.de",
  cg1: "https://www.ditib-akademie.de/cg1/",
  cg2: "https://www.ditib-akademie.de/cg2/",
  uygulama: "https://play.google.com/store/apps/details?id=com.ditib.camiyegidiyorum",
  temelDiniBilgiler: "https://dijital.diyanet.gov.tr/e-kitap/temel-dini-bilgiler/seyfettin-yazici/ilmihal-fikih/4218",
  elifba: "https://egitimhizmetleri.diyanet.gov.tr/Documents/Elif-Ba.pdf",
  sayfaTr: "https://ulucamii.be/tr/kuran-kursu/#ders-kitaplari",
  sayfaFr: "https://ulucamii.be/fr/ecole-coranique/#manuels"
};

function kitapSatirlari(dil) {
  if (dil === "fr") {
    return [
      "Manuels scolaires : les cours s'appuient sur Camiye Gidiyorum 1 et 2 (Éditions DİTİB) ainsi que sur Temel Dinî Bilgiler (Seyfettin Yazıcı, Éditions de la Présidence des Affaires religieuses de Turquie). L'achat des manuels et du matériel scolaire (cahier, stylo, etc.) reste à la charge des parents. Nous vous prions de vous procurer les livres avant le premier jour de cours.",
      "- Livres imprimés : ZSU-Shop (distributeur officiel de la DİTİB, livraison en Belgique) " + KITAPLAR.zsuShop,
      "- Lecture en ligne gratuite : " + KITAPLAR.cg1 + " · " + KITAPLAR.cg2 + " · Application Android : " + KITAPLAR.uygulama,
      "- Temel Dinî Bilgiler, livre numérique gratuit (Diyanet) : " + KITAPLAR.temelDiniBilgiler,
      "",
      "En venant au cours : nos élèves apportent à chaque cours les manuels prévus au programme, un cahier et de quoi écrire.",
      "- Le manuel du jour selon le plan annuel (Camiye Gidiyorum 1 / 2 ou Temel Dinî Bilgiler)",
      "- Un cahier ligné, un crayon, une gomme, un taille-crayon ; des crayons de couleur pour les plus jeunes",
      "- Pour les cours de Coran, le fascicule Elifbâ et, pour ceux qui lisent déjà, un exemplaire du Coran (Elif-Bâ gratuit de la Diyanet : " + KITAPLAR.elifba + " ; pour un exemplaire imprimé, adressez-vous à notre imam)",
      "- Le nom et le prénom de l'élève sont inscrits sur les livres et les cahiers",
      "- Une gourde d'eau et une petite collation pour la pause",
      "- Arriver au plus tard 10 minutes avant le cours ; reprendre l'enfant à l'heure à la fin du cours",
      "- Il est recommandé de venir en état d'ablution aux cours de Coran ; une tenue propre et confortable, conforme aux convenances de la mosquée",
      "- Si l'élève ne peut pas venir, prévenir notre imam à l'avance",
      "",
      "Informations détaillées : " + KITAPLAR.sayfaFr
    ];
  }
  return [
    "Ders kitapları: Derslerde Camiye Gidiyorum 1 ve 2 (DİTİB Yayınları) ile Temel Dinî Bilgiler (Seyfettin Yazıcı, Diyanet İşleri Başkanlığı Yayınları) okutulmaktadır. Ders kitapları ile defter, kalem gibi ders materyallerinin temini velilerimizin sorumluluğundadır. Kitapları lütfen ilk ders gününe kadar edininiz.",
    "- Basılı kitap: ZSU-Shop (DİTİB'in resmî dağıtımcısı, Belçika'ya kargo) " + KITAPLAR.zsuShop,
    "- Ücretsiz çevrim içi okuma: " + KITAPLAR.cg1 + " · " + KITAPLAR.cg2 + " · Android uygulaması: " + KITAPLAR.uygulama,
    "- Temel Dinî Bilgiler ücretsiz e-kitap (Diyanet): " + KITAPLAR.temelDiniBilgiler,
    "",
    "Derslere gelirken: Öğrencilerimiz her derse müfredatta belirtilen ders kitapları, defter ve kalemle gelir.",
    "- Yıllık planda o derse ait kitap (Camiye Gidiyorum 1 / 2 veya Temel Dinî Bilgiler)",
    "- Çizgili defter, kurşun kalem, silgi, kalemtıraş; küçükler için boya kalemleri",
    "- Kur'an-ı Kerim dersleri için Elifbâ cüzü, okumaya geçenler için Kur'an-ı Kerim (Diyanet'in ücretsiz Elif-Bâ kitabı: " + KITAPLAR.elifba + " ; basılı temin için din görevlimize danışabilirsiniz)",
    "- Kitap ve defterlere öğrencinin adı soyadı yazılır",
    "- Ara için su matarası ve küçük bir atıştırmalık",
    "- Derse en geç 10 dakika önce geliş; ders bitiminde zamanında teslim alma",
    "- Kur'an-ı Kerim derslerine abdestli gelmek tavsiye edilir; cami adabına uygun, temiz ve rahat giyim",
    "- Öğrenci derse gelemeyecekse din görevlimize önceden haber verilmesi",
    "",
    "Ayrıntılı bilgi: " + KITAPLAR.sayfaTr
  ];
}

/* MÜFREDAT EKİ (v13'ten AYNEN korunmuştur) */
var MUFREDAT = {
  pdf: "https://ulucamii.be/belgeler/kuran-kursu/Ulu-Camii-Kuran-Kursu-Mufredat-2026-2027.pdf",
  sayfa: "https://ulucamii.be/tr/kuran-kursu-mufredati/",
  sayfaFr: "https://ulucamii.be/fr/programme-ecole-coranique/",
  dosyaAdi: "Ulu Camii Kuran Kursu 2026-2027 Mufredat.pdf"
};

function mufredatEki() {
  // v16: önce Drive'daki kopya (kayıt klasöründe MUFREDAT.dosyaAdi adlı dosya), yoksa siteden
  // çek ve Drive'a kaydet. UrlFetchApp'in siteye erişemediği durumda ek yine de gider.
  try {
    var klasor = klasorGetir();
    var mevcut = klasor.getFilesByName(MUFREDAT.dosyaAdi);
    if (mevcut.hasNext()) {
      var dosya = mevcut.next();
      if (dosya.getSize() > 10000) return dosya.getBlob().setName(MUFREDAT.dosyaAdi).setContentType("application/pdf");
    }
  } catch (driveHata) { console.error("mufredat Drive kopyasi okunamadi: " + driveHata); }
  try {
    var cevap = UrlFetchApp.fetch(MUFREDAT.pdf, { muteHttpExceptions: true, followRedirects: true });
    if (cevap.getResponseCode() !== 200) return null;
    var blob = cevap.getBlob();
    if (blob.getBytes().length < 10000) return null;
    blob = blob.setName(MUFREDAT.dosyaAdi).setContentType("application/pdf");
    try { klasorGetir().createFile(blob); } catch (kaydetHata) { console.error("mufredat Drive'a yazilamadi: " + kaydetHata); }
    return blob;
  } catch (hata) {
    console.error("mufredat eki alinamadi: " + hata);
    return null;
  }
}

/* v16 — tanı: siteden müfredat çekimi ve Drive kopyası durumu (PANEL_ANAHTARI ister). */
function mufredatSinaIsle(e) {
  if (!e.parameter.anahtar || e.parameter.anahtar !== PANEL.anahtar) return json({ ok: false, hata: "yetki" });
  var sonuc = { ok: true };
  try {
    var m = klasorGetir().getFilesByName(MUFREDAT.dosyaAdi);
    sonuc.drive = m.hasNext() ? m.next().getSize() : 0;
  } catch (h1) { sonuc.driveHata = String(h1).slice(0, 200); }
  try {
    var c = UrlFetchApp.fetch(MUFREDAT.pdf, { muteHttpExceptions: true, followRedirects: true });
    sonuc.kod = c.getResponseCode(); sonuc.uzunluk = c.getContent().length;
    sonuc.tip = String(c.getHeaders()["Content-Type"] || c.getHeaders()["content-type"] || "");
  } catch (h2) { sonuc.fetchHata = String(h2).slice(0, 300); }
  return json(sonuc);
}

/* v16 — müfredat PDF'ini Drive'a yükle: {tur:"mufredat-yukle", anahtar, base64}. */
function mufredatYukleIsle(govde) {
  var v; try { v = JSON.parse(govde); } catch (h) { return json({ ok: false, hata: "bos-istek" }); }
  if (!v.anahtar || v.anahtar !== PANEL.anahtar) return json({ ok: false, hata: "yetkisiz" });
  try {
    var bayt = Utilities.base64Decode(String(v.base64 || ""));
    if (bayt.length < 10000) return json({ ok: false, hata: "dosya-kucuk" });
    var klasor = klasorGetir();
    var eskiler = klasor.getFilesByName(MUFREDAT.dosyaAdi);
    while (eskiler.hasNext()) eskiler.next().setTrashed(true);
    var dosya = klasor.createFile(Utilities.newBlob(bayt, "application/pdf", MUFREDAT.dosyaAdi));
    return json({ ok: true, boyut: dosya.getSize() });
  } catch (hata) { return json({ ok: false, hata: "yukleme-hatasi", ayrinti: String(hata).slice(0, 200) }); }
}

/* Düz metni "-----" ayıraç çizgilerinden bloklara böler: 1. blok TR, 2. blok FR, 3. blok (künye) TR. */
function mailHtml(govde) {
  var bloklar = String(govde).split(/\n-{10,}\n/);
  var diller = ["tr", "fr", "tr"];
  var parcalar = bloklar.map(function (blok, i) {
    var paragraflar = blok.trim().split(/\n\s*\n/).map(function (p) {
      return "<p style=\"margin:0 0 12px\">" + kacis(p.trim()).replace(/\n/g, "<br>") + "</p>";
    }).join("");
    return "<div lang=\"" + (diller[i] || "tr") + "\">" + paragraflar + "</div>";
  });
  return "<!DOCTYPE html><html lang=\"tr\"><body style=\"font-family:Arial,Helvetica,sans-serif;"
    + "font-size:15px;line-height:1.5;color:#222\">"
    + parcalar.join("<hr style=\"border:0;border-top:1px solid #ccc;margin:18px 0\">")
    + "</body></html>";
}

/** Veliye imzalı formun bir kopyasını yollar (v2: güncelleme akışı yok, tek e-posta metni). */
function kopyaGonderV2(blob, ref, adSoyad, adresler) {
  var gecerli = [];
  (adresler || []).forEach(function (a) {
    var adres = String(a || "").trim();
    if (!adres || !epostaGecerli(adres)) return;
    if (gecerli.some(function (x) { return x.toLowerCase() === adres.toLowerCase(); })) return;
    gecerli.push(adres);
  });
  if (!gecerli.length) return;

  var konu = "Kur'an kursu kayıt onayı / Confirmation d'inscription — " + ref;
  var govde = [
    "Esselâmü aleyküm,", "",
    adSoyad + " adına yaptığınız kurs kaydı alınmıştır. Kayıt numaranız: " + ref,
    "Doldurduğunuz form bu e-postanın ekindedir; lütfen saklayınız.", "",
    "Dersler 5 Eylül 2026 Cumartesi günü başlayacaktır.",
    "Kursumuz ücretsizdir; aidat alınmamaktadır.", ""
  ]
    .concat(kitapSatirlari("tr"))
    .concat([
      "",
      "2026-2027 müfredatı ve yıllık ders planı bu e-postanın ekindedir; web sürümü: " + MUFREDAT.sayfa,
      "",
      "Bilgilerinizde bir düzeltme gerekirse info@ulucamii.be adresine yazınız; " + ref + " numarasını belirtiniz.",
      "",
      "----------------------------------------------------------", "",
      "Bonjour,", "",
      "L'inscription de " + adSoyad + " a bien été enregistrée. Numéro d'inscription : " + ref,
      "Le formulaire complété se trouve en pièce jointe ; conservez-le.", "",
      "Les cours débutent le samedi 5 septembre 2026.",
      "Les cours sont gratuits ; aucune cotisation n'est demandée.", ""
    ])
    .concat(kitapSatirlari("fr"))
    .concat([
      "",
      "Le programme et le plan annuel des cours 2026-2027 sont joints à cet e-mail (document en turc) ; version web : " + MUFREDAT.sayfaFr,
      "",
      "Pour corriger une information, écrivez à info@ulucamii.be en indiquant le numéro " + ref + ".",
      "",
      "----------------------------------------------------------", "",
      "Marche-en-Famenne Ulu Camii Kur'an Kursu",
      "Thier des Corbeaux 14, 6900 Marche-en-Famenne",
      "Cami telefonu / Téléphone de la mosquée : +32 472 98 50 73",
      "Din görevlisi / Imam : +32 471 79 46 82"
    ]).join("\n");

  var ekler = [blob];
  var mufredat = mufredatEki();
  if (mufredat) ekler.push(mufredat);

  gecerli.forEach(function (adres) {
    try {
      MailApp.sendEmail({
        to: adres, subject: konu, body: govde, htmlBody: mailHtml(govde),
        attachments: ekler, name: EPOSTA.ad, replyTo: EPOSTA.yanit
      });
    } catch (hata) {
      console.error("kopya basarisiz (" + adres + "): " + hata);
    }
  });
}


/* ===================================================================
   2) İHTİDA BAŞVURU — v2
   =================================================================== */

var AYAR2_IHTIDA = {
  tabloAdi: "İhtida Başvuru Defteri (v2)",
  bildirimEposta: "ulucamii.marche@gmail.com,info@ulucamii.be",
  ortakSir: "ULUCAMII-IHTIDA-2026",
  yil: "2026"
};

var BASLIKLAR2_IHTIDA = [
  "Zaman damgası", "Referans", "Adı Soyadı", "Cinsiyet", "Doğum tarihi", "Doğum yeri", "Uyruk",
  "Önceki din/mezhep", "E-posta", "Telefon", "Adres", "Öğrenim durumu", "Anne adı", "Baba adı", "Medeni hali", "Mesleği",
  "İhtida sebebi", "Yeni isim tercihi", "Tören dili", "Tören tarihi tercihi", "Nasıl haberdar oldu", "Ek not",
  "Fotoğraf izni", "Şahit 1", "Şahit 2", "Açık rıza", "Elektronik beyan", "Form dili", "PDF bağlantısı", "Durum", "Gönderim anahtarı"
];
var SUTUN2_IHTIDA = { referans: 2, durum: 30, anahtar: 31 };

function ihtidaV2SayfaGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("IHTIDA_TABLO2_ID");
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(AYAR2_IHTIDA.tabloAdi);
    var dosya = DriveApp.getFileById(ss.getId());
    ihtidaKlasorGetir().addFile(dosya);
    DriveApp.getRootFolder().removeFile(dosya);
    p.setProperty("IHTIDA_TABLO2_ID", ss.getId());
  }
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0 || sh.getLastColumn() < BASLIKLAR2_IHTIDA.length) {
    sh.getRange(1, 1, 1, BASLIKLAR2_IHTIDA.length).setValues([BASLIKLAR2_IHTIDA])
      .setFontWeight("bold").setBackground("#7A4B2A").setFontColor("#FFFFFF");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(SUTUN2_IHTIDA.referans, 110);
    sh.setColumnWidth(SUTUN2_IHTIDA.durum, 200);
  }
  return sh;
}

function ihtidaV2AnahtarBul(sayfa, anahtar) {
  var onbellek = CacheService.getScriptCache();
  var ham = onbellek.get("ihtida2:" + anahtar);
  if (ham) { try { return JSON.parse(ham); } catch (_) {} }
  if (sayfa.getLastRow() < 2 || sayfa.getLastColumn() < SUTUN2_IHTIDA.anahtar) return null;
  var veri = sayfa.getRange(2, 1, sayfa.getLastRow() - 1, SUTUN2_IHTIDA.anahtar).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][SUTUN2_IHTIDA.anahtar - 1]).trim() === anahtar) {
      var sonuc = { ref: String(veri[i][SUTUN2_IHTIDA.referans - 1]) };
      onbellek.put("ihtida2:" + anahtar, JSON.stringify(sonuc), 21600);
      return sonuc;
    }
  }
  return null;
}
function ihtidaV2AnahtarKaydet(anahtar, ref) {
  try { CacheService.getScriptCache().put("ihtida2:" + anahtar, JSON.stringify({ ref: ref }), 21600); } catch (_) {}
}

function sahitOzetMetni(sahitler) {
  var liste = Array.isArray(sahitler) ? sahitler : [];
  var parcalar = [];
  for (var i = 0; i < 2; i++) {
    var s = liste[i] || {};
    if (s.ad) parcalar.push(s.ad);
  }
  return parcalar.length ? parcalar.join(" | ") : "verilmedi (törende cami görevlileri şahitlik eder)";
}

function ihtidaPostIsleV2(v) {
  try {
    var dogrulama = ihtidaDogrulaV2(v);
    if (!dogrulama.tamam) return json({ ok: false, hata: dogrulama.kod });

    var klasor = ihtidaKlasorGetir();
    var sayfaV2 = ihtidaV2SayfaGetir();
    var anahtar = temizAnahtar(v.gonderimAnahtari);

    var onceki = anahtar ? ihtidaV2AnahtarBul(sayfaV2, anahtar) : null;
    if (onceki) return json({ ok: true, ref: onceki.ref, tekrar: true });

    var b = v.basvuran, onay = v.onay;
    var sahitler = Array.isArray(v.sahitler) ? v.sahitler : [];
    var sahit1 = (sahitler[0] && sahitler[0].ad) || "";
    var sahit2 = (sahitler[1] && sahitler[1].ad) || "";

    var kilit = LockService.getScriptLock();
    kilit.waitLock(30000);
    var ref, dosya, blob;
    try {
      onceki = anahtar ? ihtidaV2AnahtarBul(sayfaV2, anahtar) : null;
      if (onceki) return json({ ok: true, ref: onceki.ref, tekrar: true });

      var sayfaV1 = v1SayfaBulTablo("IHTIDA_TABLO_ID", AYAR_IHTIDA.tabloAdi);
      ref = "IH-" + AYAR2_IHTIDA.yil + "-" + ("0000" + referansMaxBul([sayfaV1, sayfaV2], "IH")).slice(-4);

      var zamanDate = new Date();
      var meta = { ref: ref, zaman: Utilities.formatDate(zamanDate, "Europe/Brussels", "dd.MM.yyyy HH:mm"), dil: v.dil };
      var html = pdfHtmlIhtida(v, meta);
      var dosyaAdi = ref + " - " + b.adSoyad + ".pdf";
      blob = htmlPdfUret(html, dosyaAdi);
      dosya = klasor.createFile(blob);

      satirEkle(sayfaV2, [
        zamanDate, ref, b.adSoyad || "", b.cinsiyet || "", b.dogumTarihi || "", b.dogumYeri || "", b.uyruk || "",
        b.oncekiDin || "", b.eposta || "", b.telefon || "", b.adres || "", b.ogrenimDurumu || "",
        b.anneAdi || "", b.babaAdi || "", b.medeniHali || "", b.meslek || "",
        b.ihtidaSebebi || "", b.yeniIsim || "", b.torenDili || "", b.torenTarihi || "",
        b.nasilHaberdar || "", b.ekNot || "", v.fotografIzni ? "Evet" : "Hayır", sahit1, sahit2,
        onay.acikRiza ? "Evet" : "Hayır", onay.beyan || "", v.dil || "", dosya.getUrl(), "Yeni başvuru", anahtar
      ]);
      SpreadsheetApp.flush();
      if (anahtar) ihtidaV2AnahtarKaydet(anahtar, ref);
    } finally {
      kilit.releaseLock();
    }

    try {
      MailApp.sendEmail({
        to: AYAR2_IHTIDA.bildirimEposta,
        subject: "İhtida başvurusu: " + b.adSoyad + "  [" + ref + "]",
        body: [
          "Yeni bir İhtida Belgesi ön başvurusu geldi.", "",
          "Referans            : " + ref,
          "Adı Soyadı          : " + b.adSoyad,
          "Doğum tarihi        : " + (b.dogumTarihi || "-"),
          "Telefon             : " + (b.telefon || "-"),
          "E-posta             : " + (b.eposta || "-"),
          "Adres               : " + (b.adres || "-"),
          "Tören dili tercihi  : " + (b.torenDili || "-"),
          "Tören tarihi tercihi: " + (b.torenTarihi || "-"),
          "Fotoğraf izni       : " + (v.fotografIzni ? "Evet" : "Hayır"),
          "Şahitler            : " + sahitOzetMetni(v.sahitler),
          "",
          "EK-9 İhtida Belgesi'ni yönetim panelinden (ulucamii.be/admin/ → Başvurular) üretebilirsiniz.",
          "Vesikalık fotoğraf, ıslak imzalar ve şahit imzaları törende elden alınır; kimlik belgesi",
          "din görevlisine yalnız GÖSTERİLİR, kopyası alınmaz.",
          "",
          "Doldurulmuş ön başvuru formu ektedir.",
          "Drive: " + dosya.getUrl(),
          "Başvuru defteri: " + sayfaV2.getParent().getUrl()
        ].join("\n"),
        attachments: [blob],
        name: "Ulu Camii İhtida Başvuruları"
      });
    } catch (bildirimHatasi) {
      console.error("ihtida bildirimi gonderilemedi: " + bildirimHatasi);
      try {
        var satir = satirBulGenel(sayfaV2, ref, SUTUN2_IHTIDA.referans);
        if (satir > 0) sayfaV2.getRange(satir, SUTUN2_IHTIDA.durum).setValue("Yeni başvuru · e-posta gönderilemedi");
      } catch (_) {}
    }

    try { ihtidaKopyaGonderV2(blob, ref, b.adSoyad, b.eposta); }
    catch (kopyaHatasi) { console.error("ihtida kopyasi gonderilemedi: " + kopyaHatasi); }

    return json({ ok: true, ref: ref, tekrar: false });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "sunucu-hatasi", ayrinti: String(hata).slice(0, 200) });
  }
}

function ihtidaKopyaGonderV2(blob, ref, adSoyad, eposta) {
  var adres = String(eposta || "").trim();
  if (!adres || !epostaGecerli(adres)) return;

  var konu = "İhtida ön başvurunuz alındı / Votre pré-demande de conversion — " + ref;
  var govde = [
    "Esselâmü aleyküm,", "",
    adSoyad + " adına yaptığınız İhtida Belgesi ön başvurusu alınmıştır. Referans numaranız: " + ref,
    "Doldurduğunuz form bu e-postanın ekindedir; lütfen saklayınız.", "",
    "Bu bir ön başvurudur. Resmî İhtida Belgesi (EK-9), camimizdeki törenin ardından",
    "T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği onayıyla düzenlenir.",
    "Tören tarihini belirlemek için camimiz sizinle ayrıca iletişime geçecektir.", "",
    "----------------------------------------------------------", "",
    "Bonjour,", "",
    "Votre pré-demande d'attestation de conversion au nom de " + adSoyad + " a bien été reçue.",
    "Numéro de référence : " + ref,
    "Le formulaire complété se trouve en pièce jointe ; conservez-le.", "",
    "Il s'agit d'une pré-demande. L'attestation officielle de conversion (EK-9) est délivrée",
    "après la cérémonie à la mosquée, avec la validation du Conseiller des Affaires sociales",
    "de l'Ambassade de Turquie à Bruxelles. La mosquée vous recontactera pour fixer une date.", "",
    "----------------------------------------------------------", "",
    "Marche-en-Famenne Ulu Camii",
    "Thier des Corbeaux 14, 6900 Marche-en-Famenne",
    "Cami telefonu / Téléphone de la mosquée : +32 472 98 50 73",
    "Din görevlisi / Imam : +32 471 79 46 82"
  ].join("\n");

  try {
    MailApp.sendEmail({ to: adres, subject: konu, body: govde, htmlBody: mailHtml(govde), attachments: [blob], name: EPOSTA.ad, replyTo: EPOSTA.yanit });
  } catch (hata) {
    console.error("ihtida kopyasi basarisiz (" + adres + "): " + hata);
  }
}


/* ===================================================================
   3) YÖNETİM PANELİ UÇLARI (salt okur) — panel: https://ulucamii.be/admin/
   =================================================================== */

function panelAnahtariniOku() {
  try {
    var deger = PropertiesService.getScriptProperties().getProperty("PANEL_ANAHTARI");
    if (deger) return String(deger).trim();
  } catch (hata) {
    console.error("Script Properties okunamadi, gomulu anahtara donuluyor: " + hata);
  }
  return "SCRIPT-PROPERTIES-ICINDE";
}
var PANEL = { anahtar: panelAnahtariniOku() };

function panelYetkiTamam(e) {
  return !!(e && e.parameter && e.parameter.anahtar && e.parameter.anahtar === PANEL.anahtar);
}

/** Sayfayı başlık + satır dizisi olarak döndürür; gizli sütunları (adına göre) çıkarır. En yeni üstte, en çok 500 satır. */
function sayfayiOku(sayfa, gizliBasliklar) {
  var son = sayfa.getLastRow(), sonSutun = sayfa.getLastColumn();
  if (son < 1 || sonSutun < 1) return { basliklar: [], satirlar: [] };
  var basliklar = sayfa.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
  var gizli = [];
  basliklar.forEach(function (b, i) { if (gizliBasliklar.indexOf(b) !== -1) gizli.push(i); });
  var kalanBaslik = basliklar.filter(function (_, i) { return gizli.indexOf(i) === -1; });
  if (son < 2) return { basliklar: kalanBaslik, satirlar: [] };
  var bas = Math.max(2, son - 499);
  var veri = sayfa.getRange(bas, 1, son - bas + 1, sonSutun).getValues();
  var satirlar = veri.reverse().map(function (r) {
    return r.filter(function (_, i) { return gizli.indexOf(i) === -1; })
            .map(function (c) { return c instanceof Date ? Utilities.formatDate(c, "Europe/Brussels", "dd.MM.yyyy HH:mm") : String(c); });
  });
  return { basliklar: kalanBaslik, satirlar: satirlar };
}

function panelListeIsle(e) {
  try {
    if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
    return json({
      ok: true, surum: SURUM, zaman: new Date().toISOString(),
      kayitlar: sayfayiOku(kayitV2SayfaGetir(), ["Gönderim anahtarı"]),
      ihtidalar: sayfayiOku(ihtidaV2SayfaGetir(), ["Gönderim anahtarı"])
    });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "liste-hatasi", ayrinti: String(hata).slice(0, 160) });
  }
}

/* EK-9 belge verisi: v2'de görsel/imza toplanmadığı için gorseller/okunamayanGorseller
   her zaman boş döner — alanlar yalnız panel geriye dönük uyumluluğu için durur. */
function panelBelgeIsle(e) {
  try {
    if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
    var ref = String(e.parameter.ref || "").trim();
    if (!ref) return json({ ok: false, hata: "ref-yok" });

    var sayfa = ihtidaV2SayfaGetir();
    var satir = satirBulGenel(sayfa, ref, SUTUN2_IHTIDA.referans);
    if (satir < 2) return json({ ok: false, hata: "bulunamadi" });

    var sonSutun = sayfa.getLastColumn();
    var basliklar = sayfa.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
    var degerler = sayfa.getRange(satir, 1, 1, sonSutun).getValues()[0];
    var kayit = {};
    basliklar.forEach(function (b, i) {
      var d = degerler[i];
      kayit[b] = d instanceof Date ? Utilities.formatDate(d, "Europe/Brussels", "dd.MM.yyyy") : String(d == null ? "" : d);
    });
    delete kayit["Gönderim anahtarı"];

    return json({ ok: true, surum: SURUM, ref: ref, kayit: kayit, gorseller: {}, okunamayanGorseller: [] });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "belge-hatasi", ayrinti: String(hata).slice(0, 160) });
  }
}

function sayimIsle(e) {
  try {
    if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
    var kayitV1 = v1SayfaBulTablo("TABLO_ID", AYAR.tabloAdi);
    var ihtidaV1 = v1SayfaBulTablo("IHTIDA_TABLO_ID", AYAR_IHTIDA.tabloAdi);
    var kayitV2 = kayitV2SayfaGetir();
    var ihtidaV2 = ihtidaV2SayfaGetir();
    var say = function (s) { return s ? Math.max(0, s.getLastRow() - 1) : 0; };
    return json({
      ok: true,
      kayitV1: say(kayitV1), kayitV2: say(kayitV2),
      ihtidaV1: say(ihtidaV1), ihtidaV2: say(ihtidaV2)
    });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "sayim-hatasi", ayrinti: String(hata).slice(0, 160) });
  }
}


/* ===================================================================
   4) ESKİ KİMLİK TEMİZLİĞİ (v1 defterleri) — ?islem=eski-kimlik-temizle
   Belçika hukuku (8 Ağustos 1983 K. md. 8, APD eID rehberi) gereği v1
   defterlerindeki kimlik numarası hücreleri silinir; her satır için v2
   şablonuyla kimlik/görselsiz PDF yeniden üretilir, eski PDF çöpe atılır.
   İdempotenttir: "temizlendi-v15" işaretli satırlar bir daha işlenmez.
   =================================================================== */

/** Bir Drive paylaşım/aç bağlantısından dosya kimliğini çıkarır. */
function driveIdCikar(url) {
  var s = String(url || "").trim();
  if (!s) return "";
  var m = s.match(/\/d\/([-\w]{15,})/) || s.match(/[?&]id=([-\w]{15,})/);
  if (m) return m[1];
  m = s.match(/([-\w]{25,})/);
  return m ? m[1] : "";
}

function dosyayiIdIleCopeAt(id) {
  if (!id) return false;
  try { DriveApp.getFileById(id).setTrashed(true); return true; } catch (e) { return false; }
}

/** Bir klasörde tam ada uyan tüm dosyaları çöpe atar; kaç dosya çöpe gittiğini döndürür. */
function dosyaAdiylaCopeAt(klasor, ad) {
  var n = 0;
  try {
    var it = klasor.getFilesByName(ad);
    while (it.hasNext()) { it.next().setTrashed(true); n++; }
  } catch (e) {}
  return n;
}

function eskiKimlikTemizleIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  var sonuc = { ok: true, temizlenen: { kayit: 0, ihtida: 0 }, cop: 0, hatalar: [] };
  try { sonuc.temizlenen.kayit = eskiKimlikTemizleKayit(sonuc); }
  catch (hata) { sonuc.hatalar.push("kayit-genel: " + String(hata).slice(0, 200)); }
  try { sonuc.temizlenen.ihtida = eskiKimlikTemizleIhtida(sonuc); }
  catch (hata) { sonuc.hatalar.push("ihtida-genel: " + String(hata).slice(0, 200)); }
  return json(sonuc);
}

var ARSIV_NOTU = "Arşiv kopyası — 30.08.2026'da kimlik görselleri kaldırılarak yeniden üretildi.";

function eskiKimlikTemizleKayit(sonuc) {
  var sayfa = v1SayfaBulTablo("TABLO_ID", AYAR.tabloAdi);
  if (!sayfa || sayfa.getLastRow() < 2) return 0;
  var sonSutun = sayfa.getLastColumn();
  var basliklar = sayfa.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
  var idx = function (ad) { return basliklar.indexOf(ad); };
  var iKimlik = idx("Kimlik no"), iDurum = idx("Durum"), iPdf = idx("PDF bağlantısı"), iRef = idx("Referans"),
      iZaman = idx("Zaman damgası"), iSoyad = idx("Öğrenci soyadı"), iAd = idx("Öğrenci adı"),
      iDogum = idx("Doğum tarihi"), iCinsiyet = idx("Cinsiyet"), iOkul = idx("Okul"), iSinif = idx("Sınıf"),
      iVYakin = idx("Veli yakınlığı"), iVAd = idx("Veli adı soyadı"), iVCep = idx("Veli cep"),
      iVEposta = idx("Veli e-posta"), iAdres = idx("Adres"), iSaglikNot = idx("Sağlık notu"), iGoruntu = idx("Görüntü izni"), iGoruntuSosyal = idx("Sosyal medya izni");

  var klasor = klasorGetir();
  var son = sayfa.getLastRow();
  var veriler = sayfa.getRange(2, 1, son - 1, sonSutun).getValues();
  var islenen = 0;

  for (var i = 0; i < veriler.length; i++) {
    var satirNo = i + 2;
    var satir = veriler[i];
    try {
      var durum = String(iDurum >= 0 ? (satir[iDurum] || "") : "");
      if (durum.indexOf("temizlendi-v15") !== -1) continue;

      if (iKimlik >= 0) sayfa.getRange(satirNo, iKimlik + 1).setValue("");

      var ref = iRef >= 0 ? String(satir[iRef] || "").trim() : "";
      var adSoyad = ((iSoyad >= 0 ? String(satir[iSoyad] || "") : "") + " " + (iAd >= 0 ? String(satir[iAd] || "") : "")).trim();
      var zamanCell = iZaman >= 0 ? satir[iZaman] : "";
      var zamanStr = zamanCell instanceof Date ? Utilities.formatDate(zamanCell, "Europe/Brussels", "dd.MM.yyyy HH:mm") : String(zamanCell || "");

      var saglikNotVar = !!(iSaglikNot >= 0 && String(satir[iSaglikNot] || "").trim());
      var veriSynth = {
        dil: "tr",
        ogrenci: {
          ad: iAd >= 0 ? String(satir[iAd] || "") : "", soyad: iSoyad >= 0 ? String(satir[iSoyad] || "") : "",
          cinsiyet: iCinsiyet >= 0 ? String(satir[iCinsiyet] || "") : "", dogumTarihi: iDogum >= 0 ? String(satir[iDogum] || "") : "",
          okul: iOkul >= 0 ? String(satir[iOkul] || "") : "", okulDiger: "",
          sinif: iSinif >= 0 ? String(satir[iSinif] || "") : "", kursDurumu: ""
        },
        veli: {
          yakinlik: iVYakin >= 0 ? String(satir[iVYakin] || "") : "", adSoyad: iVAd >= 0 ? String(satir[iVAd] || "") : "",
          cep: iVCep >= 0 ? String(satir[iVCep] || "") : "", eposta: iVEposta >= 0 ? String(satir[iVEposta] || "") : "",
          adres: iAdres >= 0 ? String(satir[iAdres] || "") : "", postaKodu: "", sehir: "", iletisimDili: "tr"
        },
        acil: { adSoyad: "", cep: "" },
        saglik: { var: saglikNotVar, not: iSaglikNot >= 0 ? String(satir[iSaglikNot] || "") : "" },
        goruntuIzni: iGoruntu >= 0 ? /evet/i.test(String(satir[iGoruntu] || "")) : false,
        goruntuSosyalIzni: iGoruntuSosyal >= 0 ? /evet/i.test(String(satir[iGoruntuSosyal] || "")) : false,
        onay: { kurallar: true, gizlilik: true, saglikRiza: saglikNotVar, elektronikImza: iVAd >= 0 ? String(satir[iVAd] || "") : "" }
      };

      // v19: Drive arşiv kopyası sağlık notunu taşımaz (saglikGizle); yazı tipi takılırsa sade üretilir.
      var meta = { ref: ref, zaman: zamanStr + " — " + ARSIV_NOTU, dil: "tr", saglikGizle: true };
      var dosyaAdi = ref + " - " + adSoyad + ".pdf";
      var yeniBlob = kayitPdfUret(veriSynth, meta, dosyaAdi);
      var yeniDosya = klasor.createFile(yeniBlob);

      if (iPdf >= 0) {
        var eskiId = driveIdCikar(String(satir[iPdf] || ""));
        if (eskiId && dosyayiIdIleCopeAt(eskiId)) sonuc.cop++;
        sayfa.getRange(satirNo, iPdf + 1).setValue(yeniDosya.getUrl());
      }

      if (iDurum >= 0) {
        var yeniDurum = (!durum || /^yeni( kayıt)?$/i.test(durum.trim())) ? "temizlendi-v15" : (durum + " | temizlendi-v15");
        sayfa.getRange(satirNo, iDurum + 1).setValue(yeniDurum);
      }
      islenen++;
    } catch (satirHata) {
      sonuc.hatalar.push("kayit satır " + satirNo + ": " + String(satirHata).slice(0, 200));
    }
  }
  return islenen;
}

function eskiKimlikTemizleIhtida(sonuc) {
  var sayfa = v1SayfaBulTablo("IHTIDA_TABLO_ID", AYAR_IHTIDA.tabloAdi);
  if (!sayfa || sayfa.getLastRow() < 2) return 0;
  var sonSutun = sayfa.getLastColumn();
  var basliklar = sayfa.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
  var idx = function (ad) { return basliklar.indexOf(ad); };
  var iTc = idx("T.C. Kimlik No"), iDurum = idx("Durum"), iPdf = idx("PDF bağlantısı"), iRef = idx("Referans"),
      iZaman = idx("Zaman damgası"), iAdSoyad = idx("Adı Soyadı"), iCinsiyet = idx("Cinsiyet"), iDogum = idx("Doğum tarihi"),
      iDogumYeri = idx("Doğum yeri"), iUyruk = idx("Uyruk"), iOncekiDin = idx("Önceki din/mezhep"),
      iEposta = idx("E-posta"), iTelefon = idx("Telefon"), iAdres = idx("Adres"), iOgrenim = idx("Öğrenim durumu"),
      iAnne = idx("Anne adı"), iBaba = idx("Baba adı"), iMedeni = idx("Medeni hali"), iMeslek = idx("Mesleği"),
      iSebep = idx("İhtida sebebi"), iYeniIsim = idx("Yeni isim tercihi"), iTorenDili = idx("Tören dili"),
      iTorenTarihi = idx("Tören tarihi tercihi"), iNasil = idx("Nasıl haberdar oldu"), iEkNot = idx("Ek not"),
      iFotoIzni = idx("Fotoğraf izni"), iSahit1 = idx("Şahit 1"), iSahit2 = idx("Şahit 2");

  var klasor = ihtidaKlasorGetir();
  var son = sayfa.getLastRow();
  var veriler = sayfa.getRange(2, 1, son - 1, sonSutun).getValues();
  var islenen = 0;

  for (var i = 0; i < veriler.length; i++) {
    var satirNo = i + 2;
    var satir = veriler[i];
    try {
      var durum = String(iDurum >= 0 ? (satir[iDurum] || "") : "");
      if (durum.indexOf("temizlendi-v15") !== -1) continue;

      if (iTc >= 0) sayfa.getRange(satirNo, iTc + 1).setValue("");

      var ref = iRef >= 0 ? String(satir[iRef] || "").trim() : "";
      var adSoyad = iAdSoyad >= 0 ? String(satir[iAdSoyad] || "") : "";
      var zamanCell = iZaman >= 0 ? satir[iZaman] : "";
      var zamanStr = zamanCell instanceof Date ? Utilities.formatDate(zamanCell, "Europe/Brussels", "dd.MM.yyyy HH:mm") : String(zamanCell || "");

      var veriSynth = {
        dil: "tr",
        basvuran: {
          adSoyad: adSoyad, cinsiyet: iCinsiyet >= 0 ? String(satir[iCinsiyet] || "") : "",
          dogumTarihi: iDogum >= 0 ? String(satir[iDogum] || "") : "", dogumYeri: iDogumYeri >= 0 ? String(satir[iDogumYeri] || "") : "",
          uyruk: iUyruk >= 0 ? String(satir[iUyruk] || "") : "", anneAdi: iAnne >= 0 ? String(satir[iAnne] || "") : "",
          babaAdi: iBaba >= 0 ? String(satir[iBaba] || "") : "", medeniHali: iMedeni >= 0 ? String(satir[iMedeni] || "") : "",
          ogrenimDurumu: iOgrenim >= 0 ? String(satir[iOgrenim] || "") : "", meslek: iMeslek >= 0 ? String(satir[iMeslek] || "") : "",
          oncekiDin: iOncekiDin >= 0 ? String(satir[iOncekiDin] || "") : "", ihtidaSebebi: iSebep >= 0 ? String(satir[iSebep] || "") : "",
          yeniIsim: iYeniIsim >= 0 ? String(satir[iYeniIsim] || "") : "", eposta: iEposta >= 0 ? String(satir[iEposta] || "") : "",
          telefon: iTelefon >= 0 ? String(satir[iTelefon] || "") : "", adres: iAdres >= 0 ? String(satir[iAdres] || "") : "",
          torenDili: iTorenDili >= 0 ? String(satir[iTorenDili] || "") : "", torenTarihi: iTorenTarihi >= 0 ? String(satir[iTorenTarihi] || "") : "",
          nasilHaberdar: iNasil >= 0 ? String(satir[iNasil] || "") : "", ekNot: iEkNot >= 0 ? String(satir[iEkNot] || "") : ""
        },
        sahitler: [
          { ad: iSahit1 >= 0 ? String(satir[iSahit1] || "") : "" },
          { ad: iSahit2 >= 0 ? String(satir[iSahit2] || "") : "" }
        ],
        fotografIzni: iFotoIzni >= 0 ? /evet/i.test(String(satir[iFotoIzni] || "")) : false,
        onay: { acikRiza: true, ek10: true, gizlilik: true, beyan: adSoyad }
      };

      var meta = { ref: ref, zaman: zamanStr + " — " + ARSIV_NOTU, dil: "tr" };
      var html = pdfHtmlIhtida(veriSynth, meta);
      var dosyaAdi = ref + " - " + adSoyad + ".pdf";
      var yeniBlob = htmlPdfUret(html, dosyaAdi);
      var yeniDosya = klasor.createFile(yeniBlob);

      if (iPdf >= 0) {
        var eskiId = driveIdCikar(String(satir[iPdf] || ""));
        if (eskiId && dosyayiIdIleCopeAt(eskiId)) sonuc.cop++;
        sayfa.getRange(satirNo, iPdf + 1).setValue(yeniDosya.getUrl());
      }

      if (ref) {
        sonuc.cop += dosyaAdiylaCopeAt(klasor, ref + " - imza.png");
        sonuc.cop += dosyaAdiylaCopeAt(klasor, ref + " - sahit1.png");
        sonuc.cop += dosyaAdiylaCopeAt(klasor, ref + " - sahit2.png");
        // Vesikalık (ref + " - vesikalik.jpg") KASITLI olarak silinmez — sözleşme "vesikalık kalabilir" der.
      }

      if (iDurum >= 0) {
        var yeniDurum = (!durum || /^yeni( başvuru)?$/i.test(durum.trim())) ? "temizlendi-v15" : (durum + " | temizlendi-v15");
        sayfa.getRange(satirNo, iDurum + 1).setValue(yeniDurum);
      }
      islenen++;
    } catch (satirHata) {
      sonuc.hatalar.push("ihtida satır " + satirNo + ": " + String(satirHata).slice(0, 200));
    }
  }
  return islenen;
}


/* ===================================================================
   5) ESKİ SATIRLARI v2'YE TAŞI — ?islem=eski-tasi
   Panel (?islem=liste) yalnız v2 defterlerini okur; eski-kimlik-temizle v1
   satırlarının kimliğini/PDF'ini temizledi ama satırları v1'de bıraktı, bu
   yüzden panelde görünmüyorlardı. Bu uç her v1 satırını (kayıt + ihtida)
   v2 defterine BİR KEZ taşır — v1 defterler SİLİNMEZ, yalnız "Durum"
   hücresine " | tasindi-v17" eklenir (idempotent: bu işareti taşıyan veya
   referansı v2'de zaten bulunan satırlar bir daha işlenmez, atlanan sayılır).
   "Kimlik no" / "T.C. Kimlik No" sütunlarına HİÇ dokunulmaz — eşleme onları
   hiç okumaz. v1'de karşılığı olmayan v2 alanları (Kurs durumu, Posta kodu,
   Şehir, İletişim dili, Açık rıza, Elektronik beyan) boş bırakılır.
   =================================================================== */

function eskiTasiIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  var sonuc = { ok: true, tasinan: { kayit: 0, ihtida: 0 }, atlanan: 0, hatalar: [] };
  try { sonuc.tasinan.kayit = eskiTasiKayit(sonuc); }
  catch (hata) { sonuc.hatalar.push("kayit-genel: " + String(hata).slice(0, 200)); }
  try { sonuc.tasinan.ihtida = eskiTasiIhtida(sonuc); }
  catch (hata) { sonuc.hatalar.push("ihtida-genel: " + String(hata).slice(0, 200)); }
  return json(sonuc);
}

function eskiTasiKayit(sonuc) {
  var sayfaV1 = v1SayfaBulTablo("TABLO_ID", AYAR.tabloAdi);
  if (!sayfaV1 || sayfaV1.getLastRow() < 2) return 0;
  var sonSutun = sayfaV1.getLastColumn();
  var basliklar = sayfaV1.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
  var idx = function (ad) { return basliklar.indexOf(ad); };
  var iDurum = idx("Durum"), iRef = idx("Referans"), iZaman = idx("Zaman damgası"), iPdf = idx("PDF bağlantısı"),
      iAnahtar = idx("Gönderim anahtarı"), iSoyad = idx("Öğrenci soyadı"), iAd = idx("Öğrenci adı"),
      iDogum = idx("Doğum tarihi"), iCinsiyet = idx("Cinsiyet"), iOkul = idx("Okul"), iSinif = idx("Sınıf"),
      iVYakin = idx("Veli yakınlığı"), iVAd = idx("Veli adı soyadı"), iVCep = idx("Veli cep"),
      iVEposta = idx("Veli e-posta"), iAdres = idx("Adres"), iSaglikNot = idx("Sağlık notu"), iGoruntu = idx("Görüntü izni"), iGoruntuSosyal = idx("Sosyal medya izni");

  var sayfaV2 = kayitV2SayfaGetir();
  var son = sayfaV1.getLastRow();
  var veriler = sayfaV1.getRange(2, 1, son - 1, sonSutun).getValues();
  var tasinan = 0;

  for (var i = 0; i < veriler.length; i++) {
    var satirNo = i + 2;
    var satir = veriler[i];
    try {
      var durum = String(iDurum >= 0 ? (satir[iDurum] || "") : "");
      if (durum.indexOf("tasindi-v17") !== -1) { sonuc.atlanan++; continue; }

      var ref = iRef >= 0 ? String(satir[iRef] || "").trim() : "";

      // Referans v2'de zaten varsa (kısmi/tekrar çalıştırma): yalnız işaretle, taşıma.
      if (ref && satirBulGenel(sayfaV2, ref, SUTUN2.referans) > 0) {
        if (iDurum >= 0) sayfaV1.getRange(satirNo, iDurum + 1).setValue(durum + " | tasindi-v17");
        sonuc.atlanan++;
        continue;
      }

      var zamanDeger = iZaman >= 0 ? satir[iZaman] : "";
      var saglikNotu = iSaglikNot >= 0 ? String(satir[iSaglikNot] || "") : "";
      var goruntu = iGoruntu >= 0 ? String(satir[iGoruntu] || "") : "";
      var pdfBaglanti = iPdf >= 0 ? String(satir[iPdf] || "") : "";
      var anahtar = iAnahtar >= 0 ? String(satir[iAnahtar] || "") : "";

      satirEkle(sayfaV2, [
        zamanDeger, ref,
        iSoyad >= 0 ? String(satir[iSoyad] || "") : "", iAd >= 0 ? String(satir[iAd] || "") : "",
        iDogum >= 0 ? String(satir[iDogum] || "") : "", iCinsiyet >= 0 ? String(satir[iCinsiyet] || "") : "",
        iOkul >= 0 ? String(satir[iOkul] || "") : "", iSinif >= 0 ? String(satir[iSinif] || "") : "",
        "",                                            // Kurs durumu — v1'de karşılığı yok
        iVYakin >= 0 ? String(satir[iVYakin] || "") : "", iVAd >= 0 ? String(satir[iVAd] || "") : "",
        iVCep >= 0 ? String(satir[iVCep] || "") : "", iVEposta >= 0 ? String(satir[iVEposta] || "") : "",
        iAdres >= 0 ? String(satir[iAdres] || "") : "",
        "", "",                                        // Posta kodu, Şehir — adres tek hücrede kaldı
        "",                                             // İletişim dili — v1'de karşılığı yok
        "", "",                                         // Acil kişi, Acil cep — v1'de karşılığı yok
        saglikNotu,
        saglikNotu ? "evet" : "",                       // Sağlık rızası
        goruntu,
        "(v1 imzalı PDF)",                               // Elektronik imza
        "tr",                                            // Form dili
        pdfBaglanti,                                     // PDF bağlantısı — eski-kimlik-temizle'de yenilenmiş
        (durum + " | v1'den taşındı"),                   // Durum
        anahtar                                          // Gönderim anahtarı — aynen
      ]);

      if (iDurum >= 0) sayfaV1.getRange(satirNo, iDurum + 1).setValue(durum + " | tasindi-v17");
      tasinan++;
    } catch (satirHata) {
      sonuc.hatalar.push("kayit satır " + satirNo + ": " + String(satirHata).slice(0, 200));
    }
  }
  if (tasinan > 0) SpreadsheetApp.flush();
  return tasinan;
}

function eskiTasiIhtida(sonuc) {
  var sayfaV1 = v1SayfaBulTablo("IHTIDA_TABLO_ID", AYAR_IHTIDA.tabloAdi);
  if (!sayfaV1 || sayfaV1.getLastRow() < 2) return 0;
  var sonSutun = sayfaV1.getLastColumn();
  var basliklar = sayfaV1.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
  var idx = function (ad) { return basliklar.indexOf(ad); };
  var iDurum = idx("Durum"), iRef = idx("Referans"), iZaman = idx("Zaman damgası"), iPdf = idx("PDF bağlantısı"),
      iAnahtar = idx("Gönderim anahtarı"), iAdSoyad = idx("Adı Soyadı"), iCinsiyet = idx("Cinsiyet"),
      iDogum = idx("Doğum tarihi"), iDogumYeri = idx("Doğum yeri"), iUyruk = idx("Uyruk"),
      iOncekiDin = idx("Önceki din/mezhep"), iEposta = idx("E-posta"), iTelefon = idx("Telefon"),
      iAdres = idx("Adres"), iOgrenim = idx("Öğrenim durumu"), iAnne = idx("Anne adı"), iBaba = idx("Baba adı"),
      iMedeni = idx("Medeni hali"), iMeslek = idx("Mesleği"), iSebep = idx("İhtida sebebi"),
      iYeniIsim = idx("Yeni isim tercihi"), iTorenDili = idx("Tören dili"), iTorenTarihi = idx("Tören tarihi tercihi"),
      iNasil = idx("Nasıl haberdar oldu"), iEkNot = idx("Ek not"), iFotoIzni = idx("Fotoğraf izni"),
      iSahit1 = idx("Şahit 1"), iSahit2 = idx("Şahit 2");

  var sayfaV2 = ihtidaV2SayfaGetir();
  var son = sayfaV1.getLastRow();
  var veriler = sayfaV1.getRange(2, 1, son - 1, sonSutun).getValues();
  var tasinan = 0;

  for (var i = 0; i < veriler.length; i++) {
    var satirNo = i + 2;
    var satir = veriler[i];
    try {
      var durum = String(iDurum >= 0 ? (satir[iDurum] || "") : "");
      if (durum.indexOf("tasindi-v17") !== -1) { sonuc.atlanan++; continue; }

      var ref = iRef >= 0 ? String(satir[iRef] || "").trim() : "";

      if (ref && satirBulGenel(sayfaV2, ref, SUTUN2_IHTIDA.referans) > 0) {
        if (iDurum >= 0) sayfaV1.getRange(satirNo, iDurum + 1).setValue(durum + " | tasindi-v17");
        sonuc.atlanan++;
        continue;
      }

      var zamanDeger = iZaman >= 0 ? satir[iZaman] : "";
      var pdfBaglanti = iPdf >= 0 ? String(satir[iPdf] || "") : "";
      var anahtar = iAnahtar >= 0 ? String(satir[iAnahtar] || "") : "";

      satirEkle(sayfaV2, [
        zamanDeger, ref,
        iAdSoyad >= 0 ? String(satir[iAdSoyad] || "") : "", iCinsiyet >= 0 ? String(satir[iCinsiyet] || "") : "",
        iDogum >= 0 ? String(satir[iDogum] || "") : "", iDogumYeri >= 0 ? String(satir[iDogumYeri] || "") : "",
        iUyruk >= 0 ? String(satir[iUyruk] || "") : "",
        iOncekiDin >= 0 ? String(satir[iOncekiDin] || "") : "", iEposta >= 0 ? String(satir[iEposta] || "") : "",
        iTelefon >= 0 ? String(satir[iTelefon] || "") : "", iAdres >= 0 ? String(satir[iAdres] || "") : "",
        iOgrenim >= 0 ? String(satir[iOgrenim] || "") : "", iAnne >= 0 ? String(satir[iAnne] || "") : "",
        iBaba >= 0 ? String(satir[iBaba] || "") : "", iMedeni >= 0 ? String(satir[iMedeni] || "") : "",
        iMeslek >= 0 ? String(satir[iMeslek] || "") : "",
        iSebep >= 0 ? String(satir[iSebep] || "") : "", iYeniIsim >= 0 ? String(satir[iYeniIsim] || "") : "",
        iTorenDili >= 0 ? String(satir[iTorenDili] || "") : "", iTorenTarihi >= 0 ? String(satir[iTorenTarihi] || "") : "",
        iNasil >= 0 ? String(satir[iNasil] || "") : "", iEkNot >= 0 ? String(satir[iEkNot] || "") : "",
        iFotoIzni >= 0 ? String(satir[iFotoIzni] || "") : "",
        iSahit1 >= 0 ? String(satir[iSahit1] || "") : "", iSahit2 >= 0 ? String(satir[iSahit2] || "") : "",
        "", "",                                          // Açık rıza, Elektronik beyan — v1'de karşılığı yok
        "tr",                                             // Form dili
        pdfBaglanti,                                      // PDF bağlantısı — eski-kimlik-temizle'de yenilenmiş
        (durum + " | v1'den taşındı"),                    // Durum
        anahtar                                           // Gönderim anahtarı — aynen
      ]);

      if (iDurum >= 0) sayfaV1.getRange(satirNo, iDurum + 1).setValue(durum + " | tasindi-v17");
      tasinan++;
    } catch (satirHata) {
      sonuc.hatalar.push("ihtida satır " + satirNo + ": " + String(satirHata).slice(0, 200));
    }
  }
  if (tasinan > 0) SpreadsheetApp.flush();
  return tasinan;
}


/* ===================================================================
   6) TEST TEMİZLİĞİ — ?islem=test-temizle (v2 defterleri)
   =================================================================== */

function testTemizleSayfa(sayfa, klasor, adAlanlari) {
  var silinen = 0;
  if (sayfa.getLastRow() < 2) return 0;
  var sonSutun = sayfa.getLastColumn();
  var basliklar = sayfa.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
  var idxler = adAlanlari.map(function (a) { return basliklar.indexOf(a); }).filter(function (i) { return i >= 0; });
  var iPdf = basliklar.indexOf("PDF bağlantısı");
  var veri = sayfa.getRange(2, 1, sayfa.getLastRow() - 1, sonSutun).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    var satir = veri[i];
    var hedefBuldu = idxler.some(function (idx) {
      var d = String(satir[idx] || "").toUpperCase().trim();
      return d.indexOf("TESTOGLU") !== -1 || d === "TEST";
    });
    if (!hedefBuldu) continue;
    if (iPdf >= 0) {
      var id = driveIdCikar(String(satir[iPdf] || ""));
      if (id) dosyayiIdIleCopeAt(id);
    }
    sayfa.deleteRow(i + 2);
    silinen++;
  }
  return silinen;
}

function testTemizleIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  try {
    var silinen = 0;
    silinen += testTemizleSayfa(kayitV2SayfaGetir(), klasorGetir(), ["Öğrenci soyadı", "Öğrenci adı"]);
    silinen += testTemizleSayfa(ihtidaV2SayfaGetir(), ihtidaKlasorGetir(), ["Adı Soyadı"]);
    return json({ ok: true, silinen: silinen });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "test-temizleme-hatasi", ayrinti: String(hata).slice(0, 160) });
  }
}

/* ---------- v18: ders yılı sonu sağlık notu temizliği ---------- */

/** Belirtilen tarihten (oncesi=YYYY-MM-DD) önce alınmış kayıtların sağlık notunu v2 defterinden siler
 *  (GDPR md. 5/1-e; gizlilik bildirimi: sağlık notu yalnız ilgili ders yılı boyunca tutulur). Drive'daki
 *  arşiv PDF'i v18'den beri notu zaten taşımaz; veliye giden e-posta kopyasına dokunulamaz.
 *  Çağrı (panel anahtarıyla): ?islem=saglik-temizle&anahtar=…&oncesi=2027-07-01 — her Temmuz bir kez. */
function saglikTemizleIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  var oncesi = new Date(String(e.parameter.oncesi || ""));
  if (isNaN(oncesi.getTime())) return json({ ok: false, hata: "oncesi-gecersiz" });
  var sh = kayitV2SayfaGetir();
  var son = sh.getLastRow();
  if (son < 2) return json({ ok: true, silinen: 0 });
  var basliklar = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var iZaman = basliklar.indexOf("Zaman damgası"), iNot = basliklar.indexOf("Sağlık notu"), iRiza = basliklar.indexOf("Sağlık rızası");
  if (iZaman < 0 || iNot < 0) return json({ ok: false, hata: "sutun-yok" });
  var veriler = sh.getRange(2, 1, son - 1, sh.getLastColumn()).getValues();
  var damga = "silindi " + Utilities.formatDate(new Date(), "Europe/Brussels", "dd.MM.yyyy");
  var silinen = 0;
  for (var i = 0; i < veriler.length; i++) {
    var z = veriler[i][iZaman];
    var t = z instanceof Date ? z : new Date(String(z));
    if (isNaN(t.getTime()) || t >= oncesi) continue;
    if (String(veriler[i][iNot] || "").trim() === "") continue;
    sh.getRange(i + 2, iNot + 1).setValue("");
    if (iRiza >= 0) sh.getRange(i + 2, iRiza + 1).setValue(damga);
    silinen++;
  }
  return json({ ok: true, silinen: silinen, oncesi: oncesi.toISOString().slice(0, 10) });
}

/** v19: kayıt PDF şablonunun önizlemesi — örnek veriyle PDF üretir, base64 döndürür.
    Defter/Drive/e-postaya DOKUNMAZ; panel anahtarı ister. dil=tr|fr|en, saglik=0 (sağlık yok), gizle=1 (Drive arşiv görünümü), sade=1 (yazı tipsiz yedek görünüm). */
function pdfOrnekIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  var dil = ["tr", "fr", "en"].indexOf(e.parameter.dil) === -1 ? "tr" : e.parameter.dil;
  var v = ornekKayitVerisi(dil, e.parameter.saglik !== "0");
  var meta = { ref: "UC-0000-0000", zaman: Utilities.formatDate(new Date(), "Europe/Brussels", "dd.MM.yyyy HH:mm"), dil: dil, saglikGizle: e.parameter.gizle === "1", sade: e.parameter.sade === "1" };
  var blob = htmlPdfUret(pdfHtmlKayit(v, meta), "ornek-kayit-" + dil + ".pdf");
  var bayt = blob.getBytes();
  return json({ ok: true, surum: SURUM, ad: blob.getName(), boyut: bayt.length, pdfB64: Utilities.base64Encode(bayt) });
}

/** v2 defter satırını doPost gövdesiyle aynı şekle geri çevirir (PDF'i yeniden üretmek için). */
function v2SatirdanVeri(basliklar, satir) {
  var s = function (ad) {
    var i = basliklar.indexOf(ad); var v = i >= 0 ? satir[i] : "";
    return v instanceof Date ? Utilities.formatDate(v, "Europe/Brussels", "yyyy-MM-dd") : String(v == null ? "" : v);
  };
  var evet = function (ad) { return /evet/i.test(s(ad)); };
  var okul = s("Okul"), okulDiger = "";
  if (okul.indexOf("Diğer: ") === 0) { okulDiger = okul.slice(7); okul = "diger"; }
  var not = s("Sağlık notu");
  return {
    dil: s("Form dili") || "tr",
    ogrenci: { ad: s("Öğrenci adı"), soyad: s("Öğrenci soyadı"), cinsiyet: s("Cinsiyet"), dogumTarihi: s("Doğum tarihi"), okul: okul, okulDiger: okulDiger, sinif: s("Sınıf"), kursDurumu: s("Kurs durumu") },
    veli: { yakinlik: s("Veli yakınlığı"), adSoyad: s("Veli adı soyadı"), cep: s("Veli cep"), eposta: s("Veli e-posta"), adres: s("Adres"), postaKodu: s("Posta kodu"), sehir: s("Şehir"), iletisimDili: s("İletişim dili") },
    acil: { adSoyad: s("Acil kişi"), cep: s("Acil cep") },
    saglik: { var: not.trim() !== "", not: not },
    goruntuIzni: evet("Görüntü izni"), goruntuSosyalIzni: evet("Sosyal medya izni"),
    onay: { kurallar: true, gizlilik: true, saglikRiza: evet("Sağlık rızası"), elektronikImza: s("Elektronik imza") }
  };
}

/** v19: v2 defterinde sağlık notu olan kayıtların Drive arşiv PDF'ini NOTSUZ (saglikGizle) yeniden üretir.
    v18 öncesi kayıtların ve 30 Ağustos v1 temizliğinde üretilen kopyaların arşiv PDF'i notu taşıyordu; gizlilik
    bildirimi «not yalnız kayıt defterinde tutulur» der. uygula=1 verilmezse yalnız sayar (kuru çalışma).
    Eski dosya tek tek, kimliğiyle çöpe gider; satırın «Durum» hücresine " | arsiv-notsuz-v19" eklenir (idempotent). */
function arsivSaglikGizleIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  var uygula = e.parameter.uygula === "1";
  var sh = kayitV2SayfaGetir();
  var son = sh.getLastRow(), sonSutun = sh.getLastColumn();
  if (son < 2) return json({ ok: true, uygula: uygula, aday: 0, yenilenen: 0, cop: 0, hatalar: [] });
  var basliklar = sh.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
  var iNot = basliklar.indexOf("Sağlık notu"), iPdf = basliklar.indexOf("PDF bağlantısı"), iRef = basliklar.indexOf("Referans"),
      iZaman = basliklar.indexOf("Zaman damgası"), iSoyad = basliklar.indexOf("Öğrenci soyadı"), iAd = basliklar.indexOf("Öğrenci adı"),
      iDurum = basliklar.indexOf("Durum");
  if (iNot < 0 || iPdf < 0 || iRef < 0) return json({ ok: false, hata: "sutun-yok" });
  var veriler = sh.getRange(2, 1, son - 1, sonSutun).getValues();
  var klasor = uygula ? klasorGetir() : null;
  var aday = 0, yenilenen = 0, cop = 0, hatalar = [];
  for (var i = 0; i < veriler.length; i++) {
    var satir = veriler[i];
    if (String(satir[iNot] || "").trim() === "") continue;
    var durum = String(iDurum >= 0 ? (satir[iDurum] || "") : "");
    if (durum.indexOf("arsiv-notsuz-v19") !== -1) continue;
    aday++;
    if (!uygula) continue;
    var ref = String(satir[iRef] || "").trim();
    try {
      var veri = v2SatirdanVeri(basliklar, satir);
      var z = iZaman >= 0 ? satir[iZaman] : "";
      var zamanStr = z instanceof Date ? Utilities.formatDate(z, "Europe/Brussels", "dd.MM.yyyy HH:mm") : String(z || "");
      var meta = { ref: ref, zaman: zamanStr, dil: veri.dil, saglikGizle: true };
      var dosyaAdi = ref + " - " + (String(satir[iSoyad] || "") + " " + String(satir[iAd] || "")).trim() + ".pdf";
      var yeni = klasor.createFile(kayitPdfUret(veri, meta, dosyaAdi));
      var eskiId = driveIdCikar(String(satir[iPdf] || ""));
      if (eskiId && dosyayiIdIleCopeAt(eskiId)) cop++;
      sh.getRange(i + 2, iPdf + 1).setValue(yeni.getUrl());
      if (iDurum >= 0) sh.getRange(i + 2, iDurum + 1).setValue(durum + " | arsiv-notsuz-v19");
      yenilenen++;
    } catch (hata) {
      hatalar.push(ref + ": " + hata);
    }
  }
  return json({ ok: true, uygula: uygula, aday: aday, yenilenen: yenilenen, cop: cop, hatalar: hatalar });
}

/* ===================================================================
   v19: EL YAZISI YAZI TİPİ — Caveat (Copyright 2014 The Caveat Project Authors,
   SIL Open Font License 1.1, ayrılmış yazı tipi adı yok; github.com/google/fonts/tree/main/ofl/caveat).
   wght 500 statik örnek + Latin / Latin-1 / Latin Ext-A alt kümesi (Türkçe ı İ ş ğ ve
   Fransızca é è ê œ « » tam; 336 glif, 124 KB TTF). Üretim: fontTools instancer + subset
   (bkz. dokumanlar/27). Dönüştürücü dış adresten yazı tipi yüklemediği için gömülüdür.
   =================================================================== */
var EL_YAZISI_B64 = "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AtMAUAI5AFcB8wB5AdgAcAHqAGAB8gBaAekASAHKAJgB4gCDAeoAuQLQAJkCDABfAfgA2AIKAE0B+QBDAgMAUwHlAFcCRQBUAicAkwHVAFoB9QBTAjcAUQGTABEBNf+2AfEATQGqAHIC0wBCAjkAdgHzAFsB2ABOAhsAYgHyAFAB6QCFAcoAnQHiAIQB6gDOAtAAxwIMAB8B+ADYAgoAIAG4AE8BtQBOAbUATgG1AE4BtQBOAbUATgG1AE4BtQBOAbUATgG1AE4CPgBJAbYAdwFmAGIBYwBhAWMAYQFjAEQBYwBhAWMAYQGMAFwBXQBdAcsAWwGJAFsBSABkAUUAYwFFAGMBRQBjAUUAYwFFAGMBRQBjAUUAYwFFAGMBRQBcASYATAFmAEIBYwBBAWMAQQFjAEABYwBBAdMAXAHQAFsB0ABbAL4AXQC7AFwAuwBcALsAXAC7AFwAuwBcALsAXAGHAFwAuwBcALv/2wC7AFsAz/+tAMz/rQDM/60BcABKAW0ASQFtAEwArABTAKkAUgEuAFIAqf/lAPsAUgDhAEMCMwBXAcUAYwHCAGIBwgBiAcIAYgHCAGIBwgCAAcIAYgFkAFwBYQBbAWEAWwFhAFsBYQBbAWEAWwFhAFsBYQBbAWEAMgFhAFsCHQBSAXoAHQF6ACABeQBiAWgAYgFoAGIBaABiAWgANQFYAGMBVQBiAVUAYgFVAGIBjgAlAUsAbgFLADUBXgBuAXIAagFyAGoBcgBqAXIAagFyAGoBcgBqAXIAagFyAGoBVQBSAUsARgFVAGIBSwBNAXIAagFyAGoBcgBqAUsAagIFAHgCBQB4AVcANwFV/8cBVf/HAVX/xwFV/8cBOwAZATsAGQE7ABkBOwAZAZQAXwG2AGcBYgBuAYwATwFIAF0BJgBgAWYAQAHJAIAAvgBvAM//jwFwAFcArABfAmQAawHFAJEBZABqAXoAMAF5AGYBaAB2AVgAUAFLAG8BcgBnAUsAhgIFAHUBVwA2AVUAAAE7AFIBnQBbAbYAeQF4AHIBjABVAUgAUAEmAF4BZgBCAckAaQC+AFUAz/+oAXAAWgCsAEsCMwBzAcUAbwFkAGsBegAPAXkAWAFoAGcBWABxAUsAcQFyAHoBSwB9AgUAkQFXADYBVQBuATsATgH0AGACjgBhAp4AYAHLAEkBzABHAkYARwFeAKYBGwC3AcIAhwHCAKQBwgB2AcIAjwHCAK0BvQCCAckAegHBALYBwgB2Ab4AygFDACEBQABCAUAADgFAACoBQABEAUAAHQFAABMBQABNAUAAOAFAAFkBQADKAUAA5gFAALUBQADRAUAA8QFAAMkBQAC8AUAA9AFAANwBQAD9AyAAsgMgALIDIAB6AyAAsgMgAJsDIACyAyAAmwMgAJEDIADFAWsAuQFKAKUAuwCKALsAjgDGAFAAxgAeAlIASwDSAD8A0v/+Ai8AQgDGAEsBdgCOAXYADwDtAKkAdQChAMYAJAFKABsBvgAnAUoAiAFKAEsBSgAzAUr/zgFKAJABSgAaAjYAYgG+AGIBRgBiAUYAZAFhATwChgB4AsQArgELABMBCwCtAQsAuAB1AKcAdQC6AHUADADyAAAA8gAAAcIAJAHCALUBwgB5AcIANAHCABgBwgBQAb4AYgG+AGIBvgCOAb4AYgG+AGMBvgCNAb4AdQG+AGIB0QB4Ab4AZAFyACECWABhAoMAWQI0AEEBqACaAYEAgAHwAJoB8ACaARsAygFKAGMBSgBgAzkAUAG+AHwAAAE8AAAAMQAAAaAAAAHgAAABzAAAAc4AAAGOAAABnwAAAZkAAAGcAAABxgAAAXIAAAF5AWEBSwDrAPMAIwDXAOsBPgECAOYA4gAoASQAvQABAAADwP7UAAAETP+P/VsE2AABAAAAAAAAAAAAAAAAAAAB4AAEAcEB9AAFAAACigJYAAAASwKKAlgAAAFeADIA8AAAAAAAAAAAAAAAAIAAAC8AAABCAAAAAAAAAABDWVJFAMAAICISA8D+1AAAA84BOwAAAJMAAAAAAZACYgAAACAAAwAAAAIAAAADAAAAFAADAAEAAAAUAAQDAgAAAB4AEAADAA4ALwA5AH4BfgIbAsYC3CAUIBogHiAiICYgrCIS//8AAAAgADAAOgCgAhgCxgLcIBMgGCAcICIgJiCsIhL//wAAATcAAAAAAAD/Hf8PAADhmAAA4W/hbuEJ36oAAQAeAAAAOgDCAn4AAAAAAoAAAAKAAAAAAAAAAAAAAAGzAZUBmwGXAbgBxgHIAZwBpAGlAY4BuwGTAagBmAGeAZIBnQHBAb8BwAGZAccAAQAMAA0AEwAXACEAIgAnACoANQA3ADkAPwBAAEYAUQBTAFQAWABcAF8AagBrAG0AbgByAaIBjwGjAdEBnwHmAK4AuQC6AMAAxADOAM8A1ADXAOIA5QDoAO4A7wD2AQEBAwEEAQgBDQEQAR8BIAEiASMBJwGgAc4BoQHEAbQBlgG2AbkBtwG6Ac8BygHkAcsBZQGrAcMBqQHMAegBzQHCAX0BfgHfAcUByQGQAeIBfAFmAawBiAGFAYkBmgAGAAIABAAKAAUACQALABAAHgAYABsAHAAxACwALgAvABQARQBLAEcASQBPAEoBvQBOAGQAYABiAGMAbwBSAQwAswCvALEAtwCyALYAuAC9AMsAxQDIAMkA3QDZANsA3ADBAPUA+wD3APkA/wD6Ab4A/gEVAREBEwEUASQBAgEmAAcAtAADALAACAC1AA4AuwARAL4AEgC/AA8AvAAVAMIAFgDDAB8AzAAZAMYAHQDKACAAzQAaAMcAJADRACMA0AAmANMAJQDSACkA1gAoANUANADhADIA3wAtANoAMwDgADAA2AArAN4ANgDkADgA5gDnADoA6QA8AOsAOwDqAD0A7AA+AO0AQQDwAEMA8wBCAPIA8QBEAPQATQD9AEgA+ABMAPwAUAEAAFUBBQBXAQcAVgEGAFkBCQBbAQsAdgEYAFoBCgB3ARkAXgEPAF0BDgBpAR4AZgEXAGEBEgBoAR0AZQEWAGcBHABsASEAcAElAHEAcwEoAHUBKgB0ASkAeAEaAHkBGwGnAaYBrgGvAa0AALgB/4WwBI0AAAAACABmAAMAAQQJAAAAogAAAAMAAQQJAAEADACiAAMAAQQJAAIADgCuAAMAAQQJAAMAMgC8AAMAAQQJAAQAHADuAAMAAQQJAAUAGgEKAAMAAQQJAAYAHAEkAAMAAQQJAQAADAFAAEMAbwBwAHkAcgBpAGcAaAB0ACAAMgAwADEANAAgAFQAaABlACAAQwBhAHYAZQBhAHQAIABQAHIAbwBqAGUAYwB0ACAAQQB1AHQAaABvAHIAcwAgACgAaAB0AHQAcABzADoALwAvAGcAaQB0AGgAdQBiAC4AYwBvAG0ALwBnAG8AbwBnAGwAZQBmAG8AbgB0AHMALwBjAGEAdgBlAGEAdAApAEMAYQB2AGUAYQB0AFIAZQBnAHUAbABhAHIAMgAuADAAMAAwADsAQwBZAFIARQA7AEMAYQB2AGUAYQB0AC0AUgBlAGcAdQBsAGEAcgBDAGEAdgBlAGEAdAAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADIALgAwADAAMABDAGEAdgBlAGEAdAAtAFIAZQBnAHUAbABhAHIAVwBlAGkAZwBoAHQAAAADAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgAWAAEACwABAA0AIAABACIAKgABACsAKwACACwAPgABAEAAQwABAEUATwABAFQAaQABAGsAbAABAG4AeQABAK4AuAABALoAwAABAMIAzQABAM8A4QABAOQA5gABAOgA7QABAO8A8wABAPUA/wABAQQBCwABAQ0BHgABASABIQABASMBKgABAAEAAAAKACQAMgACREZMVAAObGF0bgAOAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIACAABAAgAAQDYAAQAAABnAaoCiANOBBgE3gVcBpIHIAdeCEAIvgnoCuILZAu2DFgNYg3kD1YQQBGyEmgTjhQkFNIWVBcmF8gYPhisGSoatBt6G8gb0hwkHD4dQB4+HpAerh8YIDIgmCDqIZQjAiMwJH4kzCVWJygnrii0KSYpeCouLEAtVi1gLWYtkC4OLuwvai+cMAoxIDE6Mpg0cjW8NeY2tDeyOCw5/jsUOyI7RDtSO2A7ZjuQO5o7uDvCO9g8FjwkPDo8WDxuPHw8kjygPLY8yDzmPQg9Ej1EPWYAAQBnAAEADAANABMAFwAhACIAJwAqADUANwA5AD8AQABGAFEAUwBUAFgAXABfAGoAawBtAG4AcgB6AHsAfAB9AH4AfwCAAIEAggCDAIQAhQCGAIcAiACJAIoAiwCMAI0AjgCPAJAAkQCSAJMAlACVAJYAlwCYAJkAmgCbAJ0AngCfAKAAoQCiAKMApAClAKYApwCoAKkAqgCrAKwArQCuALkAugDAAMQAzgDPANQA1wDiAOUA6ADuAO8A9gEBAQMBBAEIAQ0BEAEfASABIgEjAScANwAN/+wAF//2ACL/9gAn//YAKgAKADUACgA5//YAPwAKAEb/7ABR//YAU//sAFj/3QBc/84AX//sAGr/2ABr/+wAbf/2AG7/vwBy//YAfP/sAH7/4gCA//YAhf/sAIf/9gCI/+wAiv/2AIv/9gCM/+wAjf/sAI7/7ACP/+IAkP/2AJL/2ACY/9gAnQAUAJ//9gCh//YApP/sAKX/9gCm/+wAp//2AKj/7ACp/+IAqv/EAKz/2ADiAAoA7//2AQP/9gEE//YBCP/2ARD/9gEf//sBIgAKASP/9gEnABQAMQAN/+wAIf/sACr/9gA1//YAUf/2AFT/9gBY/+wAXP/YAF//7ABq/84Aa//OAG3/2ABu/78Acv/iAHz/7AB+/+wAf//2AIL/9gCH/+wAif/2AIz/7ACN/+wAjv/sAI//zgCQ/+IAkf/sAJL/zgCT/+wAlP/sAJj/7ACc//YAof/sAKX/9gCm/+wAp//2AKj/9gCp/9gAqv/EAKz/zgCt//YAzgAKAM8ACgDXAAoA4gAKAOUACgDoAAoA7gAKASIACgEnACgAMgAB/+wADf/2ABf/9gAi//YANf/2ADf/9gBG//YAUf/2AFP/7ABY//YAXP/sAF//9gBq/+wAa//sAG3/4gBu/90Acv/YAH7/7ACI/+wAif/2AIv/9gCM/+IAjf/2AJD/9gCR//YAkv/iAJP/9gCU//YAmP/iAKL/9gCk/+wApf/sAKb/7ACp//YAqv/OAKv/9gCs/84Arf/2ALr/+wDA//YA4gAKAOgABQDv//sBCP/2AQ0ACgEQ//YBH//sASD/9gEiABQBJwAUADEAAf/2ACH/9gAq//YANf/2AD//+wBc/9gAav/iAGv/9gBt/84Abv/OAHL/4gB+/+wAf//2AIz/7ACN//YAkf/sAJL/9gCU/+wAmP/sAJn/9gCm/+wAp//2AKn/4gCq/+IAq//2AKz/2ACt//YAuQAKALoACgDEAAoAzgAUAM8ACgDUAAoA1wAPAOIABQDlAAoA6AAKAO4AFAD2AAoBAQAKAQMACgEEAAoBCAAKAQ0AFAEfAB4BIAAUASIAFAEjAAoBJwAeAB8ADf/2ABP/9gAi//YANf/2AEb/9gBT/+wAWP/YAFz/9gBf/+wAav/nAGv/4gBt/9gAbv/OAHL/7AB+/+wAjP/sAI//9gCQ/+wAkf/2AJL/7ACU//YAmP/2AKb/9gCp/+wAqv/EAKz/7AEf//YBIP/2ASIACgEj//YBJwAUAE0AAf/YAA3/9gATABQAIQAUACoACgA1ABQAOQAKAD//9gBAAAoARgAKAFH/9gBTAAoAWAAKAFz/4gBqAAoAawAKAG4ACgBy//YAev/YAH0AFAB+/+wAfwAKAIIAHgCDAAoAhv/sAIf/9gCSAAoAkwAKAJT/4gCV//YAlwA8AJj/2ACZ//YAnAAeAJ0AMgCq/+IArAAKAK7/4gC6/+wAwP/sAMT/8QDOAAoAz//2ANQAFADXAAoA4gAKAOUACgDoABQA7//sAPb/7AEB//YBA//2AQT/9gENAAoBEP/2AR8ACgEnAAoBK//iAS3/7AEu/+wBL//sATH/9gE3//YBOP/2ATn/7AE6//YBO//sAT3/9gFB//YBRf/iAUf/7AFI/+wBU//iAVT/9gFV//YBWf/2AVv/9gAjAAH/9gAq//YANf/2AD//9gBAAAoAUf/sAFj/9gBf//YAav/2AGv/7ABt/9gAbv/YAHL/7AB6//YAfv/iAIb/9gCM/+wAkf/2AJL/9gCTAAoAlP/2AJj/4gCq/84ArP/iAM4ACgDUAAoA1wAKAOIACgDlAAoA6AAKAO4ACgENAAoBHwAKASIACgEnAAoADwCU//YAqv/sALkACgDOAAoA1AAKANcACgDiABQA5QAKAOgACgDuAAoBDQAUAR8ACgEiABQBIwAKAScAFAA4AAEACgATAB4AIQAoACoAHgA1ACgANwAKADkACgA/AB4AQAAUAFQACgBfAAoAagAeAGsAFABtAAoAbgAeAHIAFAB+//YAfwAeAIIAFACDABQAhAAKAJEACgCSACgAkwAeAJcAFACcAB4AnQAeAJ4ACgCrAB4ArAAeAK0AMgCu//YAuQAKALr/9gDA//YAxP/2AM4AFADP//YA1AAeANcAFADiAB4A5QAUAOgAFADv//YA9v/2AQEACgED/+wBBP/2AQj/9gENAAoBEP/2AR//7AEg/+cBIgAKASP/9gEnABQAHwAq//YANQAKAEb/9gBR//YAU//2AFT/9gBcAAoAX//2AG3/5wBu/+wAcv/sAIz/9gCq/+wArv/2ALkACgC6//YAwP/2AMT/9gDOAAoA1AAKANcACgDiABQA5QAKAOgAFADv//YA9v/2AQEACgED//YBDQAUARD/7AEnAAoASgAN//YAEwAKACEAFAAi//YANQAUAD8AFABG//YAXP/2AG3/9gB+//YAfwAKAIX/9gCI/+wAjP/2AJj/4gCcAAoAnQAoAKL/9gCq/+IArv/YALr/2ADA/9gAxP/YAM4ACgDP/9gA1AAKANcACgDiACgA5QAKAOgACgDv/9gA9v/OAQEACgED/84BCP/YAQ0ACgEQ/8QBH//iASD/2AEi//YBI//iASv/4gEt/9gBL//iATH/7AE3/+IBOP/OATn/2AE7/+IBPf/sAT7/9gE//9gBQP/iAUH/7AFC//YBQ//iAUT/9gFF/9gBR//iAUj/7AFJ/+wBS//sAVH/4gFS/+wBU//YAVX/zgFX//YBWP/2AVn/xAFa/+IBW//sAVz/9gFd/84BXv/sAD4ADf/sABf/7AAi/+wAKv/YADn/7ABG/+cAU//iAFj/vwBc/7oAX//TAGr/ugBr/9gAbv+mAHL/9gB8/+IAfv/YAID/7ACF/+wAhv/2AIf/9gCI/9gAiv/sAIv/9gCM//YAjf/YAI7/4gCP/8QAkP/sAJL/sACU//YAlv/2AJj/2ACf/+wAof/2AKL/9gCk/+wApf/2AKb/2ACn/9gAqP/iAKn/ugCq/7AArP+cALn/9gDOAAoAz//2ANT/9gDXAAoA4gAUAOUACgDoAAoA7//sAQEACgED/9gBCP/2AQ3/9gEQ/9gBH//EASD/2AEiAAoBI//sAScAHgAgADUACgBR//YAU//2AFj/7ABc/+IAX//sAGr/7ABr/+IAbf/2AG7/zgBy//YAfv/iAIz/7ACS//YAmP/iAKb/9gCq/84ArP/sALkACgDOAAoA1AAKANcACgDlAAoA6AAKAQEACgED//YBDQAUARD/9gEfAAoBIgAKASP/9gEnAAoAFABr//YAbf/sAG7/7ABy//YAuQAKAMQACgDOAAoAzwAKANQACgDXABQA4gAUAOUAFADoABQA7gAKAQMACgENABQBHwAeASIAHgEjAAoBJwAoACgAAf/2ABP/9gAq//YAOQAKAFMACgBc//YAav/2AGv/9gBt/9gAbv/YAHL/7ACM//YAjf/2AJH/4gCS/+IAk//2AJT/9gCn//YAqv/YAKv/9gCs/+IArf/2AM4AFADPABQA1AAKANcAFADiABQA5QAKAOgAFADuABQA9gAKAQEACgEDAAoBCAAKAQ0AFAEfAB4BIAAKASIAHgEjABQBJwAeAEIAAf/YABP/9gAq//YANf/2AD//4gBA//YAWAAKAG3/3QBu/+wAcv/OAHr/2ACC//YAg//2AIb/7ACM/+wAkf/sAJL/9gCU/84AmP/2AJz/9gCd//YApv/2AKr/2ACr//YArP/iAK3/9gCu/9gAuv/iAMD/2ADE/+wAzgAKAM//9gDUAAoA1wAKAOIAFADlAAoA6AAKAO4ACgDv//YA9v/iAQP/4gEI/+wBDQAUARD/4gEfAAoBIgAKAScACgEr/84BLf/iAS7/7AEx//YBN//iATj/7AE5/+IBO//iAT3/9gE///YBQ//2AUX/2AFH/9gBSP/2AVH/9gFS//YBU//iAVX/4gFZ/+wAIAA1AFAAXP/2AGr/9gBr//YAbf/sAG7/4gBy//YAjP/sAI//9gCS/+wAlP/2AJ0AHgCm/+wAp//2AKn/9gCq/+IArP/iALkACgDOABQAzwAUANQACgDXABQA4gBaAOUACgDoABQA7gAUAQEAFAENAB4BHwAUASIAFAEjADIBJwAoAFwAAf/nAAz/9gAN/+wAEwAKABf/7AAhAAoAIv/2ACr/9gA1AB4AOf/2AD//7ABAAAoARv/2AFP/9gBc//YAX//sAGr/9gBr//YAbf/sAG7/4gBy/9MAev/2AHv/9gB8//YAfv/iAID/9gCDAAoAhf/2AIf/9gCI/+wAi//2AIz/7ACS//YAlP/sAJX/9gCY/+IAnQAUAJ//7ACh/+wApv/sAKf/9gCp//YAqv/YAKv/9gCs/+wArv/2ALr/9gDA//YAxP/2AM4AFADP//YA4gAeAO//9gD2//YBAQAUAQP/4gEE//YBCP/2AQ0ACgEQ/+IBIP/2ASIACgEjAAoBJwAUASv/9gEt//YBLv/2AS//9gEx//YBNAAKATj/7AE5//YBOgAUATv/4gE8//YBPf/2AT//7AFD//YBRf/2AUf/9gFI//YBSf/2AUv/9gFOAAoBUv/sAVP/9gFUABQBVf/iAVb/9gFX//YBWf/sAV3/9gA6ABMAFAAX//YAIQAeACoACgA1AB4AOQAUAEAACgBGAAoAagAUAGsACgBuAAoAcv/2AH0AFAB+//YAfwAUAIIAFACDABQAhAAKAIb/9gCNAAoAjwAeAJAAFACTABQAlP/2AJcAKACY/+IAnAAUAJ0AHgCeAAoAoAAKAKkAFACq/+wAqwAeAK0AKACu//YAuQAKALr/7ADA/+cAxP/sAM4AFADP/+wA1AAUANcAFADiAB4A5QAKAOgAFADv/+wA9v/2AQP/7AEE//YBCP/2AQ0AFAEQ/+wBH//OASD/4gEiAAoBI//xAScAFABcAAH/zgAN//YAEwAKABf/9gAhAB4AIv/2ACoACgA//+IAXP/iAGoACgBt//YAcv/2AHr/zgB+/+wAhv/YAIf/9gCI/+wAjP/2AI3/9gCPAB4AlP/iAJj/4gCf//YAoP/iAKH/9gCi//YApP/2AKf/4gCpABQAqv/sAK7/pgC6/7AAwP+SAMT/pgDOABQAz/+wANQAFADiABQA5QAKAOgAFADu/84A7/+mAPb/pgEB/7ABA/+IAQT/sAEI/7ABDQAKARD/pgEf/7oBIP+cASL/xAEj/84BJ//YASv/sAEt/7ABLv/OAS//xAEx/8QBN/+wATj/sAE5/7ABOv/OATv/ugE8/84BPf/YAT7/9gE//7oBQP+wAUH/xAFC/9gBQ//OAUT/xAFF/5wBR/+mAUj/4gFJ/8QBS/+wAVH/nAFS/7ABU/+wAVT/7AFV/7oBVv/OAVf/2AFY//YBWf+wAVr/sAFb/7oBXP/YAV3/2AFe/9gALQAXAAoAIQAKAFMAHgBUAAoAXAAUAF8ACgBqAAoAbf/2AG7/9gBy//YAgwAUAIoAHgCNADIAjgAKAI8AHgCTAB4AlP/2AJYAFACY//YAnQAUAKcAKACoAAoAqQAKAKr/9gCrABQArQAKALkAFADOAB4AzwAKANQAHgDXAB4A4gAoAOUAFADoAB4A7gAeAQEACgEEAAoBCAAKAQ0AMgEQAAoBHwAyASAACgEiAB4BIwAKAScAHgBJAAH/yQAN/+wAF//sACEACgAi//YAP//iAED/9gBG//YAUf/sAFP/9gBcABQAX//2AG3/7ABu//YAcv/sAHr/4gB+/+IAhv/iAIf/9gCI/+wAjP/sAI0AHgCR//YAlP/sAJj/9gCZ//YAnQAUAKD/9gCi//YApf/2AKcAFACq/+wArv/OALr/4gDA/+IAxP/iAM//4gDu//YA7//iAPb/4gEB/+wBA//iAQT/7AEI/+IBEP/iASD/4gEr/84BLf/iAS7/4gEv/+IBMf/sATf/7AE4/+IBOf/iATr/7AE7/+IBPP/sAT3/4gE//+IBQf/2AUX/4gFH/+IBSP/iAUn/4gFL/+IBUf/sAVL/4gFT/+IBVP/2AVX/4gFW/+wBV//sAVn/4gAlAAH/7AATABQAIQAUACoACgA1ABQAOQAKAD//9gBYAAoAXAAeAGoACgBt//YAbgAKAHL/9gB6//YAhv/2AIz/7ACNACgAjwAKAJMAFACU//YApwAeAKr/4gC5ABQAwP/2AMQACgDOAB4A1AAeANcAHgDiACgA5QAUAOgAKADuAAoBDQAoAR8AHgEiABQBIwAUAScAHgArAAH/5wAN/+wAF//2ACL/7AAq//YAP//nAED/9gBG/+wAUf/2AFP/5wBY/+wAX//sAG3/4gBu/+wAfv/sAIj/7ACM/+wAjQAKAI7/9gCU//YAmP/iAKL/7ACm/+IAqv/OAKsAKACtAB4AxP/2AM4ACgDP//YA1wAKAOIAHgDlAAoA6AAUAO4ACgD2//YBAQAKAQP/2AEQ/+IBH//sASD/4gEiAAoBI//sAScAHgBgAAH/yQAN/+IAEwAKABf/4gAhABQAIv/iACf/9gAqAAoANQAKAD//3QBG/+wAUf/2AFP/9gBU//YAWP/2AFz/8QBt/+IAbv/2AHL/2AB6/84AfP/iAH7/4gCG/9gAh//sAIj/4gCM/+wAkf/iAJL/9gCT/7oAlP/YAJb/9gCY/9gAmf/2AJr/4gCf//YAoP/YAKH/9gCi/+IApP/sAKj/9gCs//YArf/EAK7/ugC6/8QAwP/EAMT/xADP/8QA7v/iAO//xAD2/8QBAf/OAQP/xAEE/8QBCP/EARD/xAEf/+wBIP/OASL/zgEj/9gBJ//iASv/ugEt/8QBLv/EAS//xAEx/8QBN//OATj/ugE5/8QBOv/OATv/xAE8/8QBPf/EAT//xAFA/+wBQf/OAUL/zgFD/9gBRP/iAUX/ugFH/8QBSP/OAUn/xAFL/8QBUf/YAVL/ugFT/8QBVP/YAVX/xAFW/8QBV//EAVn/xAFa/+wBW//OAVz/zgFd/9gBXv/iADQAAf/sAAz/9gAN/+wAE//2ABf/7AAi/+wAOf/2AEb/4gBR//YAU//2AFT/9gBY/+wAX//2AGv/9gBt//YAbv/sAHL/9gB6//YAe//sAH7/9gCI//YAjP/sAJT/7ACY/+IAov/2AKb/9gCo//YAqf/2AKr/2ACs/+IArv/sALn/9gC6//YAwP/iAMT/2ADP/9gA4gAKAOUACgDu//YA7//OAPb/4gEB//YBA//OAQT/2AEI/+IBDf/2ARD/4gEf/+wBIP/YASL/9gEj/+IBJwAKACgADf/2ACL/9gA1AB4ARv/sAFj/7ABc/+IAX//sAGr/4gBr//YAbv/OAHz/9gB+/+wAgP/2AIMAHgCF//YAhv/sAIf/9gCI/+wAi//2AI3/7ACO//YAj//iAJL/4gCY/+wAnQA8AJ//7ACg/+wAof/sAKT/7ACm/+IAp//2AKj/7ACp/+IAqv/EAKz/zgDiACgA5QAKAR8AAAE0AB4BTgAUAB0AIQAKAEb/9gBc/+wAav/sAGv/9gBt/+wAbv/EAHL/9gB+/+IAh//2AIj/9gCM//YAjf/2AI//9gCR/+wAkv/OAJP/9gCU//YAmP/iAJ//9gCg//YAof/2AKX/9gCm/+IAp//sAKj/7ACp/+IAqv/OAKz/xAAbAAH/9gAN//YAWP/2AFz/9gBf//YAav/iAG3/9gBu/+IAcv/2AHr/9gB+/9gAiP/iAIz/9gCO/+wAj//sAJH/9gCS/+wAlP/iAJX/7ACY/+IApf/2AKb/4gCn//YAqP/2AKn/7ACq/9gArP/YAB8AAf/2ACH/9gAq//YAXP/iAGr/7ABr//YAbf/iAG7/zgBy/+wAev/2AH7/7ACM/+wAjf/2AI//7ACQ//YAkf/iAJL/zgCT/+wAlP/iAJX/9gCY//YAmf/sAKH/7ACl//YApv/iAKf/9gCp/9gAqv/OAKv/7ACs/8QArf/2AGIAE//2AFj/9gBr//YAbf/sAG7/7AB+/+IAhf/2AIb/9gCM/+IAkP/2AJH/4gCU//YAlf/sAJj/2ACf/+wAoP/sAKb/4gCp//YAqv/OAKv/9gCu//YAuf/2ALr/9gDA//YAxP/2AM7/9gDP//YA1P/2ANf/9gDi//YA5f/2AOj/9gDu//YA7//2APb/9gEB//YBA//2AQT/9gEI//YBDf/2ARD/9gEf//YBIP/2ASL/9gEj//YBJ//2ASv/9gEs//YBLf/2AS7/9gEv//YBMP/2ATH/9gEy//YBM//2ATT/9gE1//YBNv/2ATf/9gE4//YBOf/2ATr/9gE7//YBPP/2AT3/9gE+//YBP//2AUD/9gFB//YBQv/2AUP/9gFE//YBRf/2AUb/9gFH//YBSP/2AUn/9gFK//YBS//2AUz/9gFN//YBTv/2AU//9gFQ//YBUf/2AVL/9gFT//YBVP/2AVX/9gFW//YBV//2AVj/9gFZ//YBWv/2AVv/9gFc//YBXf/2AV7/9gAxAAH/7AA1AAoAP//2AFwACgBt/+wAcv/2AHr/4gB+/+wAhf/2AIb/4gCM//YAlP/iAJX/7ACY/+wAnQAoAJ//9gCg//YApv/2AK7/7AC6/+wAwP/sAMT/9gDv/9gA9v/sAQH/9gED//YBBP/2ASv/4gEt/+wBLv/sAS//9gEx/+wBN//sATj/4gE5/+wBOv/2ATv/7AE8/+wBPf/sAUX/4gFH/+wBSP/2AUv/9gFR//YBUv/2AVP/4gFV/+wBVv/2AVn/7AATACr/9gBc//YAav/sAG3/7ABu//YAcv/sAHr/9gCB//YAjP/2AJH/9gCS/+wAlP/sAJv/9gCm//YAqf/2AKr/4gCr//YArP/2AK3/9gACAJT/9gCq/+IAFAABAAoAIQAKAD8AFABAAAoAXAAKAH7/9gB/ABQAgwAKAIz/9gCNAAoAjwAKAJEACgCU//YAmP/2AJ0AFACeAAoApgAKAKcACgCq/9gAqwAKAAYAfv/2AIz/9gCU//YAmP/sAKb/9gCq/84AQAAN//YARv/2AFj/9gB6//YAfP/2AH7/7ACI//YAjP/sAJT/9gCW//YAmP/iAJn/9gCf//YAov/2AKb/7ACq/9gArv/iALr/7ADA/+IAxP/iAO7/4gDv/+IA9v/iAQP/4gEE/+wBCP/2ARD/2AEf/9gBIP/YASL/9gEr/+IBLf/iAS7/7AEv/+IBMf/2ATf/4gE4/8QBOf/YATv/2AE8/+wBPf/sAT7/7AE//9gBQP/YAUH/7AFC//YBQ//sAUX/4gFH/9gBSP/sAUn/4gFL//YBUf/iAVL/2AFT/+IBVf/OAVb/7AFX/+wBWP/iAVn/zgFa/9gBW//YAVz/9gFd/9gAPwAM/+wADf/YABP/7AAX/+wAIf/2ACL/4gAn/+wAOf/2AEb/7ABR/+wAU//iAFj/2ABc/8QAX//iAGr/xABr/+IAbf/2AG7/ugBy//YAev/2AHv/4gB8/8QAff/sAH7/zgB///YAgP/iAIH/7ACE//YAhf/sAIb/9gCH/+wAiP/YAIn/4gCK/+wAjP/2AI3/zgCO/+IAj//OAJD/7ACS/8QAk//2AJT/4gCV/+IAlv/sAJf/9gCY/8QAmf/sAJr/9gCb/+wAnv/2AJ//zgCg/+wAof/sAKL/4gCj//YApP/iAKX/9gCm/84Ap//YAKj/2ACp/7oAqv+cAKz/ugAUACL/9gBq//YAbv/iAHz/7AB+/+wAgP/2AIX/9gCI//YAjP/sAJL/7ACU//YAlf/2AJj/7ACi//YApP/2AKb/9gCn//YAqf/2AKr/2ACs/+IABwBt//YAbv/2AHL/7ACM//YAkf/2AJT/9gCq/+wAGgAq//YANf/2AFz/4gBq/+wAa//2AG3/4gBu/9gAcv/sAH7/9gCC//YAjP/sAI3/9gCP//YAkf/iAJL/4gCT//YAlP/sAJj/9gCc//YApv/sAKf/9gCp/+wAqv/OAKv/7ACs/9gArf/2AEYAAf/YACr/7AA1/+wAP//sAFz/9gBq//YAa//2AG3/xABu/+IAcv/OAHr/2ACC/+wAg//sAIb/7ACH//YAjP/YAI//9gCR/84Akv/2AJT/zgCZ//YAnP/sAJ3/7ACg/+wApf/sAKb/7ACn//YAqf/sAKr/xACr/+wArP/YAK3/9gCu/9gAuv/sAMD/4gDE/+wAz//sAO//7AD2/+wBAf/2AQP/4gEE/+wBCP/2AQ0ACgEQ/+wBK//EAS3/4gEu/+IBL//sATH/7AE3/+wBOP/sATn/7AE7/+IBPP/sAT3/7AE//+wBQ//2AUX/zgFH/+IBSP/iAUn/7AFL/+wBUf/2AVL/7AFT/+wBVf/iAVb/9gFX//YBWf/iABkAAf/sADUACgBc/+wAav/2AGv/9gBt/+wAbv/sAHL/9gB6//YAfv/iAIz/4gCN//YAj//2AJH/7ACS/+wAlP/iAJj/4gCZ//YAnQAKAKb/7ACn/+wAqf/sAKr/2ACr//YArP/iABQANf/2AFz/9gBq/+wAbf/2AG7/2AB+//YAg//2AIj/9gCM//YAj//2AJL/4gCU//YAmP/sAJ3/9gCm//YAp//2AKj/9gCp//YAqv/YAKz/zgAqAAH/4gAN/+wAE//2ACL/9gAq//YANf/2AEb/9gBR//YAX//2AGr/7ABr//YAbf/YAG7/4gBy/+IAev/iAHz/4gB+/9gAgP/sAIL/9gCF/+wAhv/2AIf/9gCI//YAjP/OAI//9gCQ//YAkf/iAJL/7ACU/9gAlf/iAJb/9gCY/84Amf/sAJ//7ACg/+wAof/2AKP/9gCm/9gAp//2AKn/7ACq/8QArP/iAFsAAf/OAAz/9gAN//YAIQAKAD//4gBG//YAXP/EAF//9gBt/+wAcv/iAHr/zgB8//YAfv/iAIX/9gCG/84Ah//2AIj/7ACM/+IAjf/OAJH/9gCT/84AlP/OAJX/9gCW/+wAmP/iAJr/9gCg/+IAov/sAKb/9gCn/8QAqv/YAKz/9gCt/7oArv+wALn/9gC6/7oAwP+mAMT/sADP/8QA7v+6AO//sAD2/7oBAf/sAQP/ugEE/84BCP/EAQ3/7AEQ/84BH/+6ASD/pgEi/84BI/+6ASf/7AEr/5IBLf+cAS7/nAEv/8QBMf+mATf/nAE4/6YBOf+wATr/ugE7/7ABPP/OAT3/sAE+//YBP/+mAUD/sAFB/7oBQv+6AUP/pgFE/9gBRf+cAUf/kgFI/7ABSf/OAUv/ugFR/5wBUv+mAVP/pgFU/+IBVf+mAVb/ugFX/7ABWP/sAVn/sAFa/7ABW/+6AVz/xAFd/7oBXv/OAAsAAf/2AFwACgBt//YAfv/sAIb/9gCM//YAjQAUAJT/7ACY/+wAnQAUAKr/4gBTAAH/zgAN/+wAF//2ADf/7AA//+IAQP/2AEb/7ABR//YAWP/sAF//9gBr//YAbf/sAG7/7ABy//YAev/OAHz/4gB+/9gAhf/2AIb/2ACH/+IAiP/iAIz/7ACR//YAkv/2AJT/zgCV/+wAlv/2AJj/4gCZ/+wAmv/sAJ7/9gCg/9gAof/YAKL/7ACk/+wApf/2AKb/9gCq/9gArf/2AK7/2AC6/+IAwP/sAMT/4gDP/+IA7v/2AO//9gD2/+IBAf/2AQP/4gEE//YBCP/iARD/4gEg//YBK//YAS3/4gEu/+wBL//iATH/4gE3/+IBOP/sATn/4gE6/+wBO//iATz/9gE9/+IBP//iAUD/9gFB//YBQ//sAUX/2AFH/+IBSP/sAUn/4gFL/+IBUf/sAVL/7AFT/+IBVP/2AVX/4gFW//YBV//sAVn/2AFb//YAEwAB/+IADf/2AD//9gBTAAoAbf/sAHr/7AB8//YAfv/sAIb/7ACH/+IAigAKAIz/7ACU/9gAlf/2AJb/9gCY/+IAoP/sAKH/7ACq/+IAIgAB//YADf/2ABf/9gAi/+wARv/sAFj/2ABf//YAav/2AGv/9gBt//YAbv/YAHr/9gB8/+IAfv/iAID/4gCI/9gAjP/sAI7/9gCQ//YAkf/2AJL/7ACU/9gAmP/YAJn/9gCa//YAn//sAKL/7ACk/+wApv/YAKj/7ACp//YAqv+6AKsAFACs/+IAdAAB/8QADP/2AA3/9gAT//YAF//2ACH/9gAi/+wAJ//sACr/9gA3//YAP//YAEb/4gBR/+IAU//sAFT/9gBY//YAX//2AGr/9gBr/+wAbf/iAG7/7ABy/+IAev+wAHv/9gB8/+IAfv/OAH//9gCA/+IAgf/2AIX/9gCG/84Ah//sAIj/2ACJ/+wAiv/2AIv/9gCM/+IAjv/2AJD/9gCR/+wAkv/sAJP/9gCU/8QAlf/iAJb/4gCY/8QAmf/iAJr/2ACb/+wAnv/sAJ//9gCg/9gAof/2AKL/2ACj/+IApP/iAKX/9gCm//YAqP/2AKr/xACs//YArf/2AK7/xAC6/8QAwP/iAMT/xADP/9gA7v/sAO//2AD2/8QBAf/sAQP/xAEE/+IBCP/YARD/xAEf/+wBIP/iASL/4gEj/+wBJ//sASv/xAEt/8QBLv/iAS//xAEx/9gBN//iATj/2AE5/8QBOv/iATv/xAE8/+IBPf/YAT//xAFA/+wBQf/iAUL/4gFD/+IBRP/sAUX/xAFH/8QBSP/iAUn/xAFL/9gBUf/iAVL/2AFT/8QBVP/sAVX/xAFW/+IBV//YAVn/xAFa/+IBW//iAVz/4gFd/+wBXv/sACEAAf/YAA3/4gAX//YAIf/2ACL/9gAq//YAQP/2AFj/7ABq//YAbv/2AHL/7AB6/7oAfP/sAH7/zgB///YAgP/iAIL/9gCG//YAh//2AIj/7ACM/+wAj//2AJL/9gCT//YAlP+6AJb/7ACY/84Amv/iAKH/7ACi//YApv/YAKz/4gCtAAoAQQAN/+wAE//sABf/9gAh//YAIv/sACf/7AAq//YANQAKADf/9gBG/+wAUf/sAFP/7ABU//YAWP/sAFz/2ABf/+IAav+6AGv/2ABt//YAbv+6AHL/7AB7//YAfP/sAH3/7AB+/+IAf//sAID/2ACB//YAgv/2AIT/9gCF/+wAh//2AIj/7ACJ//YAiv/2AIv/7ACM/+wAjf/iAI7/4gCP/8QAkP/sAJL/xACT/+wAlf/2AJb/9gCX//YAmP/iAJn/9gCa//YAm//sAJ7/9gCf/+wAof/sAKL/9gCk/+wApf/sAKb/4gCn/+IAqP/iAKn/xACq/6YAq//2AKz/xACt//YBHwAAABwADf/2ABP/9gAh//YAQAAKAFj/7ABc//YAX//2AGr/7ABr//YAbf/2AG7/2ABy/+wAfP/2AH7/7ACI//YAjP/2AJD/7ACR//YAkv/YAJP/9gCU//YAmP/sAJ//9gCm/+IAqf/iAKr/zgCs/9gArf/2ABQAUf/sAGr/9gBt//YAbv/sAHL/9gB+/9gAiP/2AIz/7ACR/+wAkv/2AJT/7ACY/+IAmf/2AKD/9gCh//YAov/2AKb/7ACp//YAqv/YAKz/9gAtAAH/7AAM//YADf/2ABP/9gAX//YAIf/2ACL/9gAq/+wANf/2AFz/7ABq/+wAa//2AG3/7ABu/+IAcv/sAHr/7AB7/+wAfP/2AH3/7AB+/+IAf//2AID/9gCC/+wAg//2AIz/7ACN//YAj//2AJH/4gCS/+wAlP/iAJX/4gCW//YAl//2AJj/2ACZ//YAmv/2AJz/9gCd//YAof/2AKX/9gCm/+wAp//2AKn/7ACq/84ArP/YAIQAAf/sAAz/7AAN/+IAE//sABf/9gAh//YAIv/sACf/9gAq//YANf/2ADf/7AA///YARv/2AFH/4gBT//YAWP/sAG3/7ABu//YAcv/YAHr/7AB7/+IAfP/iAH3/9gB+/9gAgP/2AIH/7ACC//YAg//2AIX/9gCH/+wAiP/iAIn/9gCK//YAjP/OAJL/9gCU/8QAlf/YAJb/4gCY/84Amv/sAJv/7ACc//YAnQAKAJ//9gCh/+IAov/sAKP/7ACk//YApv/YAKj/9gCp//YAqv/OAKv/9gCs/+IArv/sALn/7AC6/+wAwP/sAMT/7ADO//YAz//sANT/9gDX//YA4v/2AOX/9gDo//YA7v/sAO//7AD2/+wBAf/2AQP/7AEE/+wBCP/sAQ3/9gEQ/+IBH//sASD/7AEi/+wBI//sASf/9gEr/+IBLP/sAS3/7AEu/+wBL//sATD/9gEx/+wBMv/2ATP/9gE0//YBNf/2ATb/9gE3/+wBOP/sATn/7AE6//YBO//sATz/7AE9/+wBPv/2AT//4gFA/+wBQf/sAUL/7AFD/+wBRP/2AUX/7AFG/+wBR//sAUj/7AFJ/+wBSv/2AUv/7AFM//YBTf/2AU7/9gFP//YBUP/2AVH/7AFS/+wBU//sAVT/9gFV/+wBVv/sAVf/7AFY//YBWf/iAVr/7AFb/+wBXP/sAV3/7AFe//YARQAB/+IANf/2AD//9gBt/+wAbv/sAHL/7AB6/9gAfv/iAIP/9gCF//YAhv/2AIf/7ACI//YAjP/iAJH/7ACTAAoAlP/OAJj/7ACdAAoAn//2AKD/9gCh/+IAov/2AKX/9gCq/9gArv/YALr/9gDA/+wAxP/sAM//9gDv/+IA9v/iAQH/7AED/9gBBP/sAQj/9gEQ/+IBIP/2AScACgEr/9gBLf/iAS7/7AEv//YBMf/sATf/7AE4/+IBOf/sATr/4gE7/9gBPP/sAT3/7AE//+IBQf/sAUP/7AFF/9gBR//iAUj/7AFJ//YBS//2AUz/9gFR/+wBUv/sAVP/2AFU/+wBVf/YAVb/7AFX//YBWf/YAVv/9gACAJT/9gCsAAoAAQCq/+wACgAXAAoAcv/2AH7/9gCM/+wAjQAKAJMACgCU/+wAmP/2AKb/9gCq/+IAHwAN//YAF//2AEb/9gBY//YAbv/2AHz/9gB+/+wAiP/sAJT/9gCW//YAmP/iAJn/9gCi//YApv/sAKr/2ACs//YArQAUAR//7AEg//YBI//iATj/9gE5//YBQP/sAUH/9gFD//YBU//2AVX/9gFZ//YBWv/sAVv/9gFd/+wANwAN/+IAE//2ABf/7AAi/9gAJ//2ADn/9gBG/+wAUf/2AFP/7ABY/9gAXP/EAF//2ABq/8QAa//YAG3/9gBu/7AAcv/2AHz/2AB9//YAfv/OAID/2ACB//YAhf/sAIb/9gCI/8QAif/2AIr/7ACM/+IAjf+6AI7/zgCP/8QAkP/iAJL/sACT//YAlP/2AJX/9gCW/+wAl//2AJj/2ACZ//YAmv/sAJv/9gCf/+IAoP/2AKH/9gCi/9gAo//2AKT/7ACl/+wApv/EAKf/xACo/9gAqf/EAKr/sACs/7AAHwAN//YAE//2AEb/9gBY//YAXP/2AF//9gBq/+wAbv/OAHL/9gB6//YAe//sAHz/7AB+/+wAiP/2AIz/7ACO//YAj//2AJL/zgCT/+wAlP/iAJX/9gCW//YAmP/sAJ//9gCi//YApv/iAKf/9gCo//YAqf/iAKr/yQCs/7oADABt/+IAbv/2AHL/7AB+//YAjP/2AI0ACgCR/+wAkv/2AJT/9gCY//YAqv/iAKz/9gAbAAH/9gAq//YANf/2AFz/9gBq//YAbf/2AG7/2ABy/+IAev/sAIL/9gCD//YAhv/2AIf/9gCM/+IAkf/sAJL/4gCU/+wAmP/iAJz/9gCd//YApv/sAKf/9gCp/+wAqv/YAKv/9gCs/84Arf/2AEUAAf/EAA3/9gAT//YAIf/2ACr/9gA1//YAP//iAED/9gBG//YAUf/2AGr/9gBt/+IAbv/sAHL/4gB6/84AfP/2AH7/4gCC//YAg//2AIb/zgCH/9gAiP/sAIn/9gCM/+IAkf/iAJL/9gCU/84AmP/YAKD/4gCh/+IAov/2AKX/9gCm//YAqv/YAKv/9gCs/+wArf/2AK7/4gC6//YAwP/sAMT/9gDP//YA7//2APb/4gED/+IBBP/2AQj/9gEQ/+wBK//YAS3/7AEu//YBL//2ATH/4gE3/+wBOP/2ATn/4gE7/+IBPP/2AT3/7AE///YBRf/YAUf/4gFI//YBS//sAVL/9gFT/+IBVf/iAVb/9gFZ/+wABgBu//YAfv/sAIoAHgCY//YAqv/YAKz/7ABXAA3/4gAT//YAF//sACL/9gAq/+wANf/2AEb/7ABR//YAU//sAFj/9gBc/+IAav/iAGv/9gBt//YAbv/YAHL/7AB6//YAe//sAHz/7AB+/9gAgP/sAIL/9gCD/+wAhf/sAIb/9gCH/+wAiP/iAIn/7ACK//YAi//sAIz/4gCN//YAj//2AJH/9gCS/84Ak//2AJT/7ACV/+wAmP/YAJn/4gCa//YAnf/2AJ//7ACg//YAof/2AKL/7ACj//YApP/iAKX/9gCm/8QAp//2AKn/2ACq/7oArP+6AK7/9gC6//YAwP/2AMT/9gDP//YA7//2APb/9gED//YBCP/sARD/7AEj/+wBK//2AS3/9gEv//YBMf/2ATf/7AE4/+wBOf/2ATv/9gE9/+wBP//sAUP/7AFF//YBR//2AUn/9gFL//YBUv/2AVP/9gFV//YBV//sAVn/4gFa//YBXf/2AHYAAf/sAAz/9gAN//YAF//2ACL/7AAn/+wAN//2AD//9gBG//YAUf/2AFT/9gBY//YAX//2AG3/4gBu//YAcv/sAHr/2AB7//YAfP/iAH7/4gCA/+wAgf/2AIT/9gCF//YAhv/iAIj/7ACJ//YAi//2AIz/2ACR/+wAkv/2AJMACgCU/9gAlf/iAJb/7ACY/9gAmf/sAJr/7ACb/+IAn//sAKD/7ACi/+wAo//sAKT/7ACl/+wApv/sAKj/9gCq/+IAq//2AKz/7ACu/+wAuf/2ALr/4gDA/+wAxP/YAM7/9gDP/+IA1P/sANf/9gDu//YA7//OAPb/4gEB/9gBA//YAQT/2AEI/+IBDf/sARD/4gEf/9gBIP/iASL/4gEj/9gBK//sASz/9gEt/+IBLv/2AS//7AEw//YBMf/iATL/9gEz//YBN//EATj/ugE5/8QBOv/OATv/zgE8/84BPf/sAT7/7AE//9gBQP/OAUH/2AFC/+wBQ//YAUT/2AFF/+IBRv/2AUf/zgFI/+wBSf/iAUr/9gFL/9gBTP/iAU3/9gFR/84BUv/iAVP/zgFU/9gBVf/EAVb/4gFX/+wBWP/sAVn/2AFa/84BW//OAVz/7AFd/8QBXv/sAFIAAf/sAAwACgA1AB4AP//iAF8ACgBqAB4Acv+6AHr/4gB+//YAgwAeAIb/4gCH//YAiP/2AIkACgCM//YAjgAKAI8APACS/9gAk//2AJT/7ACY/+wAn//2AKD/9gCi//YAqQAoAKv/7ACs/84Arf/sAK7/ugC6/7oAwP/YAMT/ugDP/7oA7v/EAO//zgD2/7ABAf/EAQP/sAEE/84BCP/EARD/xAEf/+IBIP/EASL/4gEj/84BJ//iASv/nAEt/7oBLv/OAS//ugEx/84BN/+6ATj/sAE5/6YBOv+wATv/xAE8/7oBPf/EAT//zgFA/84BQf/OAUL/4gFD/84BRP/sAUX/nAFH/5wBSP/OAUn/zgFL/8QBUf/EAVL/sAFT/7ABVP/EAVX/ugFW/84BV//YAVn/xAFa/84BW//OAVz/2AFd/+wBXv/iAAoAAf/2AG3/9gBy//YAev/2AIz/9gCNACgAlP/sAKcAHgCq//YArP/2ADMAAf/iADf/9gA//+wAXAAKAG3/9gBy//YAev/2AH7/7ACG/+IAjP/2AJT/7ACY/+IAnQAKAKD/9gCq/+IArv/2ALr/9gDA//YAxP/2AM//9gDv//YA9v/2AQP/9gEE//YBCP/2ARD/7AEr/+wBLf/2AS7/9gEv//YBMf/2ATf/7AE4//YBOf/2ATv/9gE8//YBPf/sAT//7AFD//YBRf/sAUf/9gFI//YBSf/2AUv/9gFR//YBUv/2AVP/9gFV//YBVv/2AVf/9gFZ/+wAPwAB/8QADP/2ABP/7AAX//YAIf/2ACL/9gAn/+wAKv/iADX/9gA3//YAP//sAEb/9gBR/+wAXP/2AF//9gBq/+wAa//2AG3/2ABu/84Acv/YAHr/2AB7//YAfP/2AH3/9gB+/84AgP/sAIH/7ACC/+wAhP/2AIX/9gCG/+wAh//sAIj/9gCJ//YAjP/iAI7/9gCP//YAkP/sAJH/2ACS/+IAk//sAJT/ugCV/+wAlv/2AJf/9gCY/9gAmf/2AJr/9gCb/+IAnP/2AJ7/9gCf/+wAoP/2AKL/9gCk//YApf/2AKb/7ACo//YAqf/2AKr/sACr//YArP/YAK3/4gAeAAH/4gAN//YAIv/2ACr/7AA//+wARv/2AFj/9gBq//YAbf/YAG7/9gBy/+IAev/YAHz/9gB+/+wAgP/iAIb/xACI/+IAjP/OAI7/7ACR/9gAlP+6AJj/xACa//YAoP/OAKL/7ACm/9gAqP/sAKn/9gCq/9gArP/sAHQAAf/EAAz/7AAN/9gAE//sABf/4gAh//YAIv/sACf/7AAq/+wAN//sAD//7ABA/+wARv/iAFH/9gBT/+wAVP/sAFj/9gBf/+IAa//2AG3/7ABu/9gAcv/EAHr/xAB7/+wAfP/OAH3/7AB+/84Af//2AID/7ACB/+wAhP/2AIb/xACH/+wAiP/OAIr/7ACL/+wAjP/EAI7/7ACQ//YAkf/2AJL/4gCT//YAlP/iAJX/2ACW/+IAl//sAJj/ugCZ/+wAmv/sAJv/7ACe//YAoP/OAKH/7ACi/+IApP/YAKX/4gCm/+IAqP/2AKr/zgCr//YArP/iAK3/9gCu/8QAuv/EAMD/2ADE/9gAz//iAO7/7ADv/+IA9v/EAQH/2AED/8QBBP/YAQj/zgEQ/8QBH//iASD/7AEi/+wBI//iASf/7AEr/7oBLf/EAS7/2AEv/9gBMf/iATf/4gE4/+IBOf/EATr/2AE7/8QBPP/YAT3/zgE//8QBQP/iAUH/7AFC/+wBQ//YAUT/7AFF/8QBR//EAUj/2AFJ/9gBS//iAVH/4gFS/+IBU//EAVT/2AFV/8QBVv/YAVf/zgFZ/8QBWv/iAVv/7AFc/+wBXf/iAV7/7ABFAAH/2AAM//YADf/sABP/7AAX//YAQP/2AEb/7ABY//YAav/2AG3/7ABu//YAcv/2AHr/7AB7//YAfP/YAH7/zgCH/+IAiP/iAIz/7ACR//YAkv/2AJMAHgCU/9gAlf/sAJb/7ACY/9gAn//sAKL/7ACo//YAqv/OAKz/7ACt//YArv/sALn/7AC6/+wAwP/sAMT/7ADO//YAz//2APb/9gED//YBEP/sAR//4gEg/+wBI//iASv/7AEs/+wBLf/sAS7/7AEv/+wBMf/2ATn/9gE7//YBP//sAUD/4gFB/+wBQ//iAUX/7AFG/+wBR//sAUj/7AFJ/+wBS//2AVP/9gFV//YBWf/YAVr/4gFb/+wBXf/YAAMBH//sASD/9gEj/+wACACu//YAuv/2AMD/9gDU//sA4v/7ARD/9gEi//YBI//2AAMA6AAKASD/9gEj//sAAwDv//YBDQAKARD/9gABAOgACgAKAK7/9gDOAAoA1AAKANcACgDiAAoA6AAUAO4ACgENACgBHwAKASMACgACANcACgEjAAoABwDO//YAz//sAQP/9gEI//YBH//iASD/8QEj/+IAAgDOAAoBHwAKAAUBDQAKARD/9gEiAAoBIwAKAScACgAPALoAFADEAAoAzgAUANQACgDXAAoA5QAUAOgAFADuAAoA9gAKAQQACgENAAoBEAAKAR8ACgEj//YBJwAKAAMA6AAKAQ0ACgEnABQABQDAAAoA9gAUAR//8QEg//YBI//2AAcAuf/xAQj/+wEN//YBEP/2AR//7AEg/+wBI//sAAUA4v/7ARD/9gEfAAUBIP/2ASP/9gADAO//9gEQ//YBI//2AAUA1P/2AOIACgDv//YA9v/2ARD/9gADAK7/+wDXAAUBHwAUAAUAzgAKAQ0ACgEfABQBIgAPAScAFAAEANcABQEfAAoBIgAUAScAHgAHALn/9gDOAAoA1wAKAOUACgDoAAoBIgAKAScAHgAIAK7/9gDOAAoA1wAKAQ0ACgEfABQBIgAUASMACgEnAAoAAgDXAAoBIgAKAAwAzgAKANcACgDlAAoA6AAKAO//9gEBAAoBA//2ARD/+wEfAAoBIgAPASP/9gEnAAoACACu//YAwP/2AMQACgDv//YBDQAKARD/9gEfAAoBIgAKAAYAzgAKANcACgENAAoBHwAKASIACgEnABQAAAABAAAACgBgAPQAAkRGTFQADmxhdG4AEgAOAAAACgABQ0FUIAAmAAD//wALAAAAAQACAAMABAAGAAcACAAJAAoACwAA//8ADAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMYWFsdABKY2FsdABQZGxpZwBWZnJhYwBcbGlnYQBibG9jbABob3JkbgBuc2FsdAB2c3MwMQB8c3MwMgCCc3VicwCIc3VwcwCOAAAAAQAAAAAAAQACAAAAAQAYAAAAAQAUAAAAAQABAAAAAQAPAAAAAgAVABcAAAABABkAAAABABoAAAABABsAAAABABIAAAABABMAHAA6AsAC9A4qDqAOKg6gDioOoA4qDqAOKg6gDioOoAxQDIgMqAzIDNYM5A1uDbYN2A36DioOKg6gAAMAAAABAAgAAQH+AD4AggCKAJAAlgCcAKIAqACuALQAugDAAMYAzADSANgA4ADmAOwA8gD4AP4BBAEKARABFgEcASIBKgEwATYBPAFCAUgBTgFUAVoBYAFmAWwBcgF4AYABhgGMAZIBmAGeAaQBqgGwAbYBvAHCAcgBzgHUAdoB4AHmAewB8gH4AAMAegCUAWUAAgB7AJUAAgB8AJYAAgB9AJcAAgB+AJgAAgB/AJkAAgCAAJoAAgCBAJsAAgCCAJwAAgCDAJ0AAgCEAJ4AAgCFAJ8AAgCGAKAAAgCHAKEAAwCIAKIBZgACAIkAowACAIoApAACAIsApQACAIwApgACAI0ApwACAI4AqAACAI8AqQACAJAAqgACAJEAqwACAJIArAACAJMArQADASsBRQFlAAIBLAFGAAIBLQFHAAIBLgFIAAIBLwFJAAIBMAFKAAIBMQFLAAIBMgFMAAIBMwFNAAIBNAFOAAIBNQFPAAIBNgFQAAIBNwFRAAIBOAFSAAMBOQFTAWYAAgE6AVQAAgE7AVUAAgE8AVYAAgE9AVcAAgE+AVgAAgE/AVkAAgFAAVoAAgFBAVsAAgFCAVwAAgFDAV0AAgFEAV4AAgFxAXsAAgFyAXwAAgFzAX0AAgF0AX4AAgF1AX8AAgF2AYAAAgF3AYEAAgF4AYIAAgF5AYMAAgF6AYQAAQA+AAEADAANABMAFwAhACIAJwAqADUANwA5AD8AQABGAFEAUwBUAFgAXABfAGoAawBtAG4AcgCuALkAugDAAMQAzgDPANQA1wDiAOUA6ADuAO8A9gEBAQMBBAEIAQ0BEAEfASABIgEjAScBZwFoAWkBagFrAWwBbQFuAW8BcAAEAAAAAQAIAAELXAABAAgABgAOABYAHgtCC0gLTgFgAAMAzgDXAWEAAwDOAOgBXwACAM4ABgAAADAAZgB4AIoAngCyAMgA3gD2AQ4BKAFCAV4ClgKoAroCzgLiAvgDDgMmAz4DWANyA44E5AT2BQgFHAUwBUYFXAV0BYwFpgXABdwHFAcmBzgHTAdgB3YHjAekB7wH1gfwCAwAAwABAgIAAQICAAAAAQAAAAMAAwABAc4AAQHwAAAAAQAAAAQAAwACAPAB3gABAd4AAAABAAAABQADAAIA3AGoAAEBygAAAAEAAAAGAAMAAwDIAMgBtgABAbYAAAABAAAABwADAAMAsgCyAX4AAQGgAAAAAQAAAAgAAwAEAJwAnACcAYoAAQGKAAAAAQAAAAkAAwAEAIQAhACEAVAAAQFyAAAAAQAAAAoAAwAFAGwAbABsAGwBWgABAVoAAAABAAAACwADAAUAUgBSAFIAUgEeAAEBQAAAAAEAAAAMAAMABgA4ADgAOAA4ADgBJgABASYAAAABAAAADQADAAYAHAAcABwAHAAcAOgAAQEKAAAAAQAAAA4AAQBkAAEADAANABMAFwAhACIAJwAqADUANwA5AD8AQABGAFEAUwBUAFgAXABfAGoAawBtAG4AcgB6AHsAfAB9AH4AfwCAAIEAggCDAIQAhQCGAIcAiACJAIoAiwCMAI0AjgCPAJAAkQCSAJMAlACVAJYAlwCYAJkAmgCbAJwAnQCeAJ8AoAChAKIAowCkAKUApgCnAKgAqQCqAKsArACtAK4AxADXAPYBEAErAS8BMwE5AT8BRQFJAU0BUwFZAV8BYAFhAWIBYwFkAbMAAgAFASwBLgAAATABMgADATQBOAAGAToBPgALAUABRAAQAAEAFQC5ALoAwADOAM8A1ADiAOUA6ADuAO8BAQEDAQQBCAENAR8BIAEiASMBJwADAAECQAABAkAAAAABAAAAAwADAAECIAABAi4AAAABAAAABAADAAIA8AIcAAECHAAAAAEAAAAFAAMAAgDcAfoAAQIIAAAAAQAAAAYAAwADAMgAyAH0AAEB9AAAAAEAAAAHAAMAAwCyALIB0AABAd4AAAABAAAACAADAAQAnACcAJwByAABAcgAAAABAAAACQADAAQAhACEAIQBogABAbAAAAABAAAACgADAAUAbABsAGwAbAGYAAEBmAAAAAEAAAALAAMABQBSAFIAUgBSAXAAAQF+AAAAAQAAAAwAAwAGADgAOAA4ADgAOAFkAAEBZAAAAAEAAAANAAMABgAcABwAHAAcABwBOgABAUgAAAABAAAADgACAC8AAQABAAAADAANAAEAEwATAAMAFwAXAAQAIQAiAAUAJwAnAAcAKgAqAAgANQA1AAkANwA3AAoAOQA5AAsAPwBAAAwARgBGAA4AUQBRAA8AUwBUABAAWABYABIAXABcABMAXwBfABQAagBrABUAbQBuABcAcgByABkAegCtABoAuQC6AE4AwADAAFAAzgDPAFEA1ADUAFMA4gDiAFQA5QDlAFUA6ADoAFYA7gDvAFcBAQEBAFkBAwEEAFoBCAEIAFwBDQENAF0BHwEgAF4BIgEjAGABJwEnAGIBLAEuAGMBMAEyAGYBNAE4AGkBOgE+AG4BQAFEAHMBRgFIAHgBSgFMAHsBTgFSAH4BVAFYAIMBWgFkAIgBswGzAJMAAQAFASsBLwEzATkBPwABAAUArgDEANcA9gEQAAMAAQICAAECAgAAAAEAAAADAAMAAQHOAAEB8AAAAAEAAAAEAAMAAgDwAd4AAQHeAAAAAQAAAAUAAwACANwBqAABAcoAAAABAAAABgADAAMAyADIAbYAAQG2AAAAAQAAAAcAAwADALIAsgF+AAEBoAAAAAEAAAAIAAMABACcAJwAnAGKAAEBigAAAAEAAAAJAAMABACEAIQAhAFQAAEBcgAAAAEAAAAKAAMABQBsAGwAbABsAVoAAQFaAAAAAQAAAAsAAwAFAFIAUgBSAFIBHgABAUAAAAABAAAADAADAAYAOAA4ADgAOAA4ASYAAQEmAAAAAQAAAA0AAwAGABwAHAAcABwAHADoAAEBCgAAAAEAAAAOAAEAZAABABcAKgBGAF8AegB+AIIAiACOAJQAmACcAKIAqACuALkAugDAAMQAzgDPANQA1wDiAOUA6ADuAO8A9gEBAQMBBAEIAQ0BEAEfASABIgEjAScBKwEsAS0BLgEvATABMQEyATMBNAE1ATYBNwE4ATkBOgE7ATwBPQE+AT8BQAFBAUIBQwFEAUUBRgFHAUgBSQFKAUsBTAFNAU4BTwFQAVEBUgFTAVQBVQFWAVcBWAFZAVoBWwFcAV0BXgFfAWABYQFiAWMBZAGzAAIABQB7AH0AAAB/AIEAAwCDAIcABgCJAI0ACwCPAJMAEAABABUADAANABMAIQAiACcANQA3ADkAPwBAAFEAUwBUAFgAXABqAGsAbQBuAHIAAwABAjoAAQI6AAAAAQAAAAMAAwABAhoAAQIoAAAAAQAAAAQAAwACAPACFgABAhYAAAABAAAABQADAAIA3AH0AAECAgAAAAEAAAAGAAMAAwDIAMgB7gABAe4AAAABAAAABwADAAMAsgCyAcoAAQHYAAAAAQAAAAgAAwAEAJwAnACcAcIAAQHCAAAAAQAAAAkAAwAEAIQAhACEAZwAAQGqAAAAAQAAAAoAAwAFAGwAbABsAGwBkgABAZIAAAABAAAACwADAAUAUgBSAFIAUgFqAAEBeAAAAAEAAAAMAAMABgA4ADgAOAA4ADgBXgABAV4AAAABAAAADQADAAYAHAAcABwAHAAcATQAAQFCAAAAAQAAAA4AAgAuAAwADQAAABMAEwACACEAIgADACcAJwAFADUANQAGADcANwAHADkAOQAIAD8AQAAJAFEAUQALAFMAVAAMAFgAWAAOAFwAXAAPAGoAawAQAG0AbgASAHIAcgAUAHsAfQAVAH8AgQAYAIMAhwAbAIkAjQAgAI8AkwAlAJUAlwAqAJkAmwAtAJ0AoQAwAKMApwA1AKkArgA6ALkAugBAAMAAwABCAMQAxABDAM4AzwBEANQA1ABGANcA1wBHAOIA4gBIAOUA5QBJAOgA6ABKAO4A7wBLAPYA9gBNAQEBAQBOAQMBBABPAQgBCABRAQ0BDQBSARABEABTAR8BIABUASIBIwBWAScBJwBYASsBZABZAbMBswCTAAEABQB6AH4AggCIAI4AAQAFAAEAFwAqAEYAXwAGAAAAAgAKAB4AAwAAAAIAPgAoAAEAPgABAAAAEAADAAAAAgBKABQAAQBKAAEAAAARAAEAAQGQAAQAAAABAAgAAQAIAAEADgABAAEA6AABAAQA7AACAZAABAAAAAEACAABAAgAAQAOAAEAAQA5AAEABAA9AAIBkAABAAAAAQAIAAEA1AAKAAEAAAABAAgAAQDGABQABAAAAAEACAABAHQABQAQADoARgBcAGgABAAKABIAGgAiAYoAAwGeAW8BiAADAZ4BawGGAAMBngFqAYUAAwGeAWkAAQAEAYcAAwGeAWoAAgAGAA4BiwADAZ4BbwGJAAMBngFrAAEABAGMAAMBngFvAAEABAGNAAMBngFvAAEABQFoAWkBagFsAW4ABgAAAAIACgAkAAMAAQAsAAEAEgAAAAEAAAAWAAEAAgABAK4AAwABABIAAQAcAAAAAQAAABYAAgABAWcBcAAAAAEAAgBGAPYAAQAAAAEACAACAA4ABAFlAWYBZQFmAAEABAABAEYArgD2AAQAAAABAAgAAQAUAAEACAABAAQB0AADAPYBmAABAAEAQAAEAAAAAQAIAAEAIgABAAgAAwAIAA4AFAFiAAIA1wFjAAIA6AFkAAIBDQABAAEAzgABAAAAAQAIAAIA5AA0AHoAewB8AH0AfgB/AIAAgQCCAIMAhACFAIYAhwCIAIkAigCLAIwAjQCOAI8AkACRAJIAkwErASwBLQEuAS8BMAExATIBMwE0ATUBNgE3ATgBOQE6ATsBPAE9AT4BPwFAAUEBQgFDAUQAAQAAAAEACAACAG4ANACUAJUAlgCXAJgAmQCaAJsAnACdAJ4AnwCgAKEAogCjAKQApQCmAKcAqACpAKoAqwCsAK0BRQFGAUcBSAFJAUoBSwFMAU0BTgFPAVABUQFSAVMBVAFVAVYBVwFYAVkBWgFbAVwBXQFeAAEANAABAAwADQATABcAIQAiACcAKgA1ADcAOQA/AEAARgBRAFMAVABYAFwAXwBqAGsAbQBuAHIArgC5ALoAwADEAM4AzwDUANcA4gDlAOgA7gDvAPYBAQEDAQQBCAENARABHwEgASIBIwEnAAAAAQABAAgAAQAAABQAAAAAAAAAAndnaHQBAAAA";
