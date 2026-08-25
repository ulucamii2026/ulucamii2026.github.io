/**
 * Marche-en-Famenne Ulu Camii — Ortak Apps Script Alıcı
 * (Kur'an Kursu Kayıt Alıcı + İhtida Başvuru Alıcı — TEK Web App)
 *
 * DAĞITIM NOTU (insan adımı — bu dosya otomatik dağıtılmaz):
 *   1. script.google.com'a DERNEK hesabıyla (ulucamii2026@gmail.com) giriş yapın.
 *   2. Yeni proje → bu dosyanın tamamını yapıştırın → proje adı "Ulu Camii Alıcı".
 *   3. Dağıt → Yeni dağıtım → Web uygulaması:
 *        - Şu kullanıcı olarak yürüt : Ben (ulucamii2026@gmail.com)
 *        - Erişimi olan kullanıcılar : Herkes  (Tout le monde / Anyone)
 *   4. Çıkan /exec adresini:
 *        - Kur'an kursu ön yüzünde  → D:\tmp\ulucamii-kayit-mirror\index.html satır 25
 *        - İhtida başvuru formunda  → src/content/ayarlar/site.yaml → servisler.basvuru
 *      alanına yazın (bu iki front-end AYNI /exec adresini kullanır; istek gövdesindeki
 *      "tur" alanına göre bu script kendi içinde doğru işleyiciye yönlendirir).
 *   5. kurulumTesti() ve ihtidaKurulumTesti() fonksiyonlarını bir kez elle çalıştırıp
 *      izinleri onaylayın; ardından testKaydiniSil() / ihtidaTestKaydiniSil() ile
 *      deneme kayıtlarını temizleyin.
 *
 * doPost, gelen JSON gövdesindeki "tur" alanına göre yönlendirir:
 *   tur === "ihtida"  → ihtidaPostIsle()  (yeni — İhtida Başvuru Formu)
 *   tur yok / diğer   → kayitPostIsle()   (mevcut Kur'an kursu kayıt işleyicisi, AYNEN korunmuştur)
 * doGet değişmedi.
 */

/* ===================================================================
   ORTAK
   =================================================================== */

function doGet(e) {
  if (e && e.parameter && e.parameter.islem === "liste") return panelListeIsle(e);
  if (e && e.parameter && e.parameter.islem === "belge") return panelBelgeIsle(e);
  return json({ ok: true, servis: "ulucamii-alici", surum: 9, zaman: new Date().toISOString() });
}

/* ===================================================================
   YÖNETİM PANELİ LİSTE API'Sİ (v7) — yalnız gizli anahtarla, SALT OKUR
   Panel: https://ulucamii.be/admin/  (anahtar şifreli pakette taşınır)
   =================================================================== */
/* Panel API anahtari once Script Properties'ten okunur (kaynak kodda gorunmez, editorden
   degistirilebilir, rotasyona acik). Property tanimlanmamissa mevcut deger kullanilir —
   boylece bu surum tek basina dagitilabilir, panel calismaya devam eder.
   Kurulum: Apps Script > Proje ayarlari > Komut dosyasi ozellikleri >
   PANEL_ANAHTARI = <UCP-...>  (25 Agustos 2026 denetimi, bulgu 1) */
function panelAnahtariniOku() {
  try {
    var deger = PropertiesService.getScriptProperties().getProperty("PANEL_ANAHTARI");
    if (deger) return String(deger).trim();
  } catch (hata) {
    console.error("Script Properties okunamadi, gomulu anahtara donuluyor: " + hata);
  }
  return "UCP-0ab0a87af595a967176c069354d2d378";
}
const PANEL = { anahtar: panelAnahtariniOku() };

function panelListeIsle(e) {
  try {
    if (!e.parameter.anahtar || e.parameter.anahtar !== PANEL.anahtar) return json({ ok: false, hata: "yetkisiz" });
    return json({
      ok: true, surum: 10, zaman: new Date().toISOString(),
      kayitlar: sayfayiOku(sayfaGetir(), ["Gönderim anahtarı"]),
      ihtidalar: sayfayiOku(ihtidaSayfaGetir(), ["Gönderim anahtarı", "Anahtar"])
    });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "liste-hatasi", ayrinti: String(hata).slice(0, 160) });
  }
}

/* -------------------------------------------------------------------
   EK-9 BELGE VERİSİ (v9) — panelde İhtida Belgesi üretmek için.
   Başvuru satırının tüm alanlarını, vesikalığı ve imzaları base64 döndürür.
   İmza görselleri hiçbir zaman herkese açık bir adreste durmaz; yalnız
   panel anahtarıyla, yalnız bu uçtan alınır.
   ------------------------------------------------------------------- */
function panelBelgeIsle(e) {
  try {
    if (!e.parameter.anahtar || e.parameter.anahtar !== PANEL.anahtar) return json({ ok: false, hata: "yetkisiz" });
    var ref = String(e.parameter.ref || "").trim();
    if (!ref) return json({ ok: false, hata: "ref-yok" });

    var sayfa = ihtidaSayfaGetir();
    var satir = ihtidaSatirBul(sayfa, ref);
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
    delete kayit["Anahtar"];

    var klasor = ihtidaKlasorGetir();
    /* Gorsel okunamazsa panelde sessizce bos alan cikiyordu; artik neden kayda gecer ve
       panele bildirilir. 4 MB siniri Apps Script'in yanit boyutu korumasidir.
       (25 Agustos 2026 denetimi, bulgu 4) */
    var okunamayanlar = [];
    function gorselAl(sonEk) {
      var ad = ref + sonEk;
      try {
        var it = klasor.getFilesByName(ad);
        if (!it.hasNext()) return "";                 // dosya hic yok: olagan durum
        var blob = it.next().getBlob();
        var bayt = blob.getBytes();
        if (!bayt || !bayt.length) {
          console.error("gorsel bos: " + ad);
          okunamayanlar.push({ dosya: ad, neden: "bos" });
          return "";
        }
        if (bayt.length > 4 * 1024 * 1024) {
          console.error("gorsel 4 MB sinirini asti (" + Math.round(bayt.length / 1024) + " KB): " + ad);
          okunamayanlar.push({ dosya: ad, neden: "cok-buyuk", kb: Math.round(bayt.length / 1024) });
          return "";
        }
        return "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(bayt);
      } catch (hata) {
        console.error("gorsel okunamadi (" + ad + "): " + hata);
        okunamayanlar.push({ dosya: ad, neden: "hata" });
        return "";
      }
    }

    return json({
      ok: true, surum: 10, ref: ref, kayit: kayit,
      okunamayanGorseller: okunamayanlar,
      vesikalik: gorselAl(" - vesikalik.jpg"),
      basvuranImza: gorselAl(" - imza.png"),
      sahitler: [
        { ad: kayit["Şahit 1"] || "", imza: gorselAl(" - sahit1.png") },
        { ad: kayit["Şahit 2"] || "", imza: gorselAl(" - sahit2.png") }
      ]
    });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "belge-hatasi", ayrinti: String(hata).slice(0, 160) });
  }
}

/** "data:image/png;base64,..." ya da düz base64 metnini Drive blob'una çevirir. */
function veriUrlBlob(veri, dosyaAdi) {
  var metin = String(veri || "");
  var tur = "image/png";
  var esles = metin.match(/^data:([^;]+);base64,/);
  if (esles) { tur = esles[1]; metin = metin.slice(esles[0].length); }
  var bayt = Utilities.base64Decode(metin);
  if (!bayt || bayt.length < 200) return null;
  return Utilities.newBlob(bayt, tur, dosyaAdi);
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

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ ok: false, hata: "bos-istek" });
    var govde = e.postData.contents;
    // Paylaşılan üst sınır: iki servisin en büyüğü kadar; asıl sınır her işleyicide ayrıca uygulanır.
    if (govde.length > Math.max(AYAR.azamiBayt, AYAR_IHTIDA.azamiBayt)) return json({ ok: false, hata: "cok-buyuk" });

    var v = JSON.parse(govde);
    if (v && v.tur === "ihtida") return ihtidaPostIsle(v);
    return kayitPostIsle(v);
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "sunucu-hatasi", ayrinti: String(hata).slice(0, 200) });
  }
}

function json(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne))
                       .setMimeType(ContentService.MimeType.JSON);
}

/* Gönderim anahtarı: istemcinin ürettiği 16-64 karakterlik rastgele dizi.
   Hem kayıt hem ihtida işleyicisi tarafından ortak kullanılır. */
function temizAnahtar(a) {
  var t = String(a || "").trim();
  return /^[A-Za-z0-9_-]{16,64}$/.test(t) ? t : "";
}


/* ===================================================================
   1) KUR'AN KURSU KAYIT ALICI — mevcut mantık AYNEN korunmuştur
      (yalnızca doPost'un dış kabuğu kaldırıldı; gövde kayitPostIsle'a taşındı)
   =================================================================== */

const AYAR = {
  klasorAdi: "Kur'an Kursu Kayıtları 2026-2027",
  tabloAdi:  "Kur'an Kursu Kayıt Defteri 2026-2027",
  bildirimEposta: "ulucamii.marche@gmail.com,info@ulucamii.be",   // bildirimlerin gideceği adres
  ortakSir: "ULUCAMII-KAYIT-2026",                 // index.html içindeki değerle AYNI olmalı
  azamiBayt: 9 * 1024 * 1024,                      // ~9 MB gövde sınırı
  yil: "2026"
};

const BASLIKLAR = ["Zaman damgası", "Referans", "Öğrenci soyadı", "Öğrenci adı", "Doğum tarihi",
                   "Cinsiyet", "Kimlik no", "Okul", "Sınıf", "Veli yakınlığı", "Veli adı soyadı",
                   "Veli cep", "Veli e-posta", "Adres", "Sağlık notu", "Görüntü izni",
                   "PDF bağlantısı", "Durum", "Günceller", "Gönderim anahtarı"];

const SUTUN = { referans: 2, durum: 18, günceller: 19, anahtar: 20 };   // 1 tabanlı sütun numaraları

function kayitPostIsle(v) {
  try {
    if (!v) return json({ ok: false, hata: "bos-istek" });
    if (v.sir !== AYAR.ortakSir)                          return json({ ok: false, hata: "yetkisiz" });
    if (!v.ogrenci || !v.ogrenci.ad || !v.ogrenci.soyad)  return json({ ok: false, hata: "eksik-bilgi" });
    if (!v.pdfBase64)                                     return json({ ok: false, hata: "pdf-yok" });

    var klasor = klasorGetir();
    var sayfa  = sayfaGetir();

    var anahtar = temizAnahtar(v.gonderimAnahtari);

    // Aynı gönderim daha önce işlendiyse (cevap veliye ulaşmamış olabilir)
    // yeni kayıt açma; önceki referansı döndür.
    var onceki = anahtar ? anahtarBul(anahtar) : null;
    if (onceki) return json({ ok: true, ref: onceki.ref, guncelleme: onceki.guncelleme, tekrar: true, refBulunamadi: Boolean(onceki.refBulunamadi), aranan: onceki.aranan || "" });

    var adSoyad  = (v.ogrenci.soyad + " " + v.ogrenci.ad).trim();
    var veli = v.veli || {};
    var pdfBayt = Utilities.base64Decode(v.pdfBase64);
    if (!pdfBayt || pdfBayt.length < 1000) return json({ ok: false, hata: "pdf-bozuk" });

    // Referans üretimi, dosya adı ve satır ekleme TEK kilit içinde: iki veli
    // aynı anda gönderse bile aynı numara iki satıra yazılamaz.
    var kilit = LockService.getScriptLock();
    kilit.waitLock(30000);
    var ref, guncelleme, eskiRef, dosya;
    try {
      onceki = anahtar ? anahtarBul(anahtar) : null;
      if (onceki) return json({ ok: true, ref: onceki.ref, guncelleme: onceki.guncelleme, tekrar: true, refBulunamadi: Boolean(onceki.refBulunamadi), aranan: onceki.aranan || "" });

      eskiRef = temizRef(v.guncellenenRef);
      guncelleme = Boolean(eskiRef && satirBul(sayfa, eskiRef) > 0);
      // Biçimi doğru ama defterde yok: yeni kayıt açılır, veli uyarılır.
      var refBulunamadi = Boolean(eskiRef && !guncelleme);
      ref = referansUret(sayfa, guncelleme ? eskiRef : null);

      var dosyaAdi = ref + " - " + adSoyad + ".pdf";
      var blob = Utilities.newBlob(pdfBayt, "application/pdf", dosyaAdi);
      dosya = klasor.createFile(blob);

      sayfa.appendRow([
        new Date(), ref, v.ogrenci.soyad, v.ogrenci.ad, v.ogrenci.dogumTarihi || "",
        v.ogrenci.cinsiyet || "", v.ogrenci.kimlikNo || "", v.ogrenci.okul || "", v.ogrenci.sinif || "",
        veli.yakinlik || "", veli.adSoyad || "", veli.cep || "", veli.eposta || "", veli.adres || "",
        v.saglikNotu || "", v.goruntuIzni ? "Evet" : "Hayır", dosya.getUrl(),
        guncelleme ? "Güncel kayıt (revizyon)" : "Yeni kayıt",
        guncelleme ? eskiRef : "",
        anahtar
      ]);
      SpreadsheetApp.flush();
      if (anahtar) anahtarKaydet(anahtar, ref, guncelleme, refBulunamadi, refBulunamadi ? eskiRef : "");
      /* Guncelleme kaydi zaten yazildi. Eski satiri isaretlemek ikincil bir istir;
         basarisiz olursa basvuran "sunucu-hatasi" gorup tekrar gonderiyordu.
         (25 Agustos 2026 denetimi, bulgu 17) */
      if (guncelleme) {
        try { eskiSatiriIsaretle(sayfa, eskiRef, ref); }
        catch (isaretHata) { console.error("eski satir isaretlenemedi (" + eskiRef + "): " + isaretHata); }
      }
    } finally {
      kilit.releaseLock();
    }

    // Kayıt artık güvende. Bundan sonrası bildirimdir; e-posta kotası dolsa
    // bile veliye "başarısız" dönmez — dönseydi tekrar denerdi.
    var postaHatasi = "";
    try {
    MailApp.sendEmail({
      to: AYAR.bildirimEposta,
      subject: (guncelleme ? "[GÜNCELLEME] " : "") + "Kurs kaydı: " + adSoyad + "  [" + ref + "]",
      body: [
        guncelleme
          ? ("Daha önce alınan " + eskiRef + " numaralı kaydın GÜNCELLENMİŞ hâli geldi.")
          : "Kur'an kursuna yeni bir kayıt geldi.",
        "",
        "Referans      : " + ref,
        guncelleme ? ("Güncellenen   : " + eskiRef) : "",
        "Öğrenci       : " + adSoyad,
        "Doğum tarihi  : " + (v.ogrenci.dogumTarihi || "-"),
        "Okul / Sınıf  : " + (v.ogrenci.okul || "-") + " / " + (v.ogrenci.sinif || "-"),
        "Veli          : " + (veli.adSoyad || "-") + " (" + (veli.yakinlik || "-") + ")",
        "Veli telefon  : " + (veli.cep || "-"),
        "Veli e-posta  : " + (veli.eposta || "-"),
        "Görüntü izni  : " + (v.goruntuIzni ? "Evet" : "Hayır"),
        "",
        "Doldurulmuş ve imzalanmış form ektedir.",
        "Drive: " + dosya.getUrl(),
        "Kayıt defteri: " + sayfa.getParent().getUrl()
      ].filter(String).join("\n"),
      attachments: [blob],
      name: "Ulu Camii Kur'an Kursu"
    });
    } catch (bildirimHatasi) {
      postaHatasi = String(bildirimHatasi);
      console.error("bildirim gonderilemedi: " + postaHatasi);
      try {
        var satir = satirBul(sayfa, ref);
        if (satir > 0) sayfa.getRange(satir, SUTUN.durum).setValue(
          (guncelleme ? "Güncel kayıt (revizyon)" : "Yeni kayıt") + " · e-posta gönderilemedi");
      } catch (_) { /* not düşülemedi, kayıt yine de sağlam */ }
    }

    // Ailenin kendi arşivi için imzalı formun bir kopyası.
    // Adres hatası kaydı düşürmesin diye ayrı try/catch içinde.
    try {
      kopyaGonder(blob, ref, adSoyad, guncelleme, [veli.eposta, (v.ogrenci && v.ogrenci.eposta) || ""]);
    } catch (postaHatasi) {
      console.error("kopya gonderilemedi: " + postaHatasi);
    }

    return json({ ok: true, ref: ref, guncelleme: guncelleme, refBulunamadi: refBulunamadi, aranan: refBulunamadi ? eskiRef : "" });

  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "sunucu-hatasi", ayrinti: String(hata).slice(0, 200) });
  }
}

/* ----------------------------------------------------------------- yardımcılar (kayıt) */

/** Kullanıcının girdiği referansı normalleştirir: boşluk/küçük harf toleranslı. */
function temizRef(deger) {
  if (!deger) return "";
  var s = String(deger).toUpperCase().replace(/\s+/g, "");
  return /^UC-\d{4}-\d{4}(-R\d+)?$/.test(s) ? s : "";
}

/* Daha önce işlenmiş anahtarlar CacheService'te (6 saat) ve defterde tutulur.
   Önbellek hızlı yol, defter kalıcı yoldur. */
function anahtarBul(anahtar) {
  var onbellek = CacheService.getScriptCache();
  var ham = onbellek.get("gonderim:" + anahtar);
  if (ham) { try { return JSON.parse(ham); } catch (_) { /* devam */ } }
  var sayfa = sayfaGetir();
  if (sayfa.getLastRow() < 2 || sayfa.getLastColumn() < SUTUN.anahtar) return null;
  var veri = sayfa.getRange(2, 1, sayfa.getLastRow() - 1, SUTUN.anahtar).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][SUTUN.anahtar - 1]).trim() === anahtar) {
      var sonuc = { ref: String(veri[i][SUTUN.referans - 1]),
                    guncelleme: /revizyon/i.test(String(veri[i][SUTUN.durum - 1])) };
      onbellek.put("gonderim:" + anahtar, JSON.stringify(sonuc), 21600);
      return sonuc;
    }
  }
  return null;
}

function anahtarKaydet(anahtar, ref, guncelleme, refBulunamadi, aranan) {
  try {
    // "Eski kayıt bulunamadı" uyarısı tekrar denemede de veliye ulaşsın diye saklanır.
    CacheService.getScriptCache().put("gonderim:" + anahtar,
      JSON.stringify({ ref: ref, guncelleme: guncelleme, refBulunamadi: Boolean(refBulunamadi), aranan: aranan || "" }), 21600);
  } catch (_) { /* önbellek yoksa defter yeter */ }
}

function satirBul(sayfa, ref) {
  if (sayfa.getLastRow() < 2) return 0;
  var veri = sayfa.getRange(2, SUTUN.referans, sayfa.getLastRow() - 1, 1).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][0]).trim() === ref) return i + 2;
  }
  return 0;
}

function eskiSatiriIsaretle(sayfa, eskiRef, yeniRef) {
  var satir = satirBul(sayfa, eskiRef);
  if (satir > 0) sayfa.getRange(satir, SUTUN.durum).setValue("Güncellendi → " + yeniRef);
}

function klasorGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("KLASOR_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var bul = DriveApp.getFoldersByName(AYAR.klasorAdi);
  var k = bul.hasNext() ? bul.next() : DriveApp.createFolder(AYAR.klasorAdi);
  p.setProperty("KLASOR_ID", k.getId());
  return k;
}

function sayfaGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("TABLO_ID");
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(AYAR.tabloAdi);
    var dosya = DriveApp.getFileById(ss.getId());
    klasorGetir().addFile(dosya);
    DriveApp.getRootFolder().removeFile(dosya);
    p.setProperty("TABLO_ID", ss.getId());
  }
  var sh = ss.getSheets()[0];
  // başlık satırı yoksa ya da eski (dar) sürümdense yenile
  if (sh.getLastRow() === 0 || sh.getLastColumn() < BASLIKLAR.length) {
    sh.getRange(1, 1, 1, BASLIKLAR.length).setValues([BASLIKLAR])
      .setFontWeight("bold").setBackground("#1F4E4E").setFontColor("#FFFFFF");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(SUTUN.referans, 120);
    sh.setColumnWidth(17, 260);
    sh.setColumnWidth(SUTUN.durum, 200);
  }
  return sh;
}

/** UC-2026-0001 · güncellemede UC-2026-0001-R2 biçiminde referans üretir. */
function referansUret(sayfa, guncellenenRef) {
  /* Kilit burada DEĞİL, çağıran kayitPostIsle'da tutulur; Apps Script'te aynı
     betiğin kilidi yeniden alınamaz (iç içe kilit kilitlenir). */
  {
    if (guncellenenRef) {
      var kok = String(guncellenenRef).split("-R")[0];
      var enBuyuk = 1;
      if (sayfa.getLastRow() > 1) {
        var veri = sayfa.getRange(2, SUTUN.referans, sayfa.getLastRow() - 1, 1).getValues();
        for (var i = 0; i < veri.length; i++) {
          var m = String(veri[i][0]).match(/^(UC-\d{4}-\d{4})-R(\d+)$/);
          if (m && m[1] === kok) enBuyuk = Math.max(enBuyuk, parseInt(m[2], 10));
        }
      }
      return kok + "-R" + (enBuyuk + 1);
    }
    // Satir sayisi degil, var olan en buyuk numara esas alinir: defterden bir
    // satir silinse bile numara geri sarmaz, iki kayda ayni referans cikmaz.
    var sira = 1;
    if (sayfa.getLastRow() > 1) {
      var mevcut = sayfa.getRange(2, SUTUN.referans, sayfa.getLastRow() - 1, 1).getValues();
      for (var j = 0; j < mevcut.length; j++) {
        var e = String(mevcut[j][0]).match(/^UC-\d{4}-(\d{4})/);
        if (e) sira = Math.max(sira, parseInt(e[1], 10) + 1);
      }
    }
    return "UC-" + AYAR.yil + "-" + ("0000" + sira).slice(-4);
  }
}

/* Veliye ve (varsa) ogrenciye imzali formun kopyasini yollar.
   Ayni adres iki kez verilmisse tek posta gider; gecersiz adres atlanir. */
function kopyaGonder(blob, ref, adSoyad, guncelleme, adresler) {
  const gecerli = [];
  (adresler || []).forEach(function (a) {
    const adres = String(a || "").trim();
    if (!adres) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adres)) return;
    if (gecerli.some(function (x) { return x.toLowerCase() === adres.toLowerCase(); })) return;
    gecerli.push(adres);
  });
  if (!gecerli.length) return;

  const konu = (guncelleme ? "[GÜNCELLEME] " : "")
    + "Kur'an kursu kayıt onayı / Confirmation d'inscription — " + ref;

  const govde = [
    "Esselâmü aleyküm,",
    "",
    adSoyad + " adına yaptığınız kurs kaydı alınmıştır. Kayıt numaranız: " + ref,
    "Doldurduğunuz ve imzaladığınız form bu e-postanın ekindedir; lütfen saklayınız.",
    "",
    "Dersler 5 Eylül 2026 Cumartesi günü başlayacaktır.",
    "Kursumuz ücretsizdir; aidat alınmamaktadır.",
    "",
    "Bilgilerinizde bir düzeltme gerekirse kayıt sayfasındaki",
    "\"Daha önce kayıt yaptınız mı?\" bölümüne " + ref + " numarasını yazmanız yeterlidir.",
    "",
    "----------------------------------------------------------",
    "",
    "Bonjour,",
    "",
    "L'inscription de " + adSoyad + " a bien été enregistrée. Numéro d'inscription : " + ref,
    "Le formulaire complété et signé se trouve en pièce jointe ; conservez-le.",
    "",
    "Les cours débutent le samedi 5 septembre 2026.",
    "Les cours sont gratuits ; aucune cotisation n'est demandée.",
    "",
    "Pour corriger une information, indiquez le numéro " + ref,
    "dans la rubrique « Avez-vous déjà une inscription ? » du formulaire en ligne.",
    "",
    "----------------------------------------------------------",
    "",
    "Marche-en-Famenne Ulu Camii Kur'an Kursu",
    "Thier des Corbeaux 14, 6900 Marche-en-Famenne",
    "Cami telefonu / Téléphone de la mosquée : +32 472 98 50 73",
    "Din görevlisi / Imam : +32 471 79 46 82"
  ].join("\n");

  gecerli.forEach(function (adres) {
    try {
      MailApp.sendEmail({
        to: adres,
        subject: konu,
        body: govde,
        attachments: [blob],
        name: "Ulu Camii Kur'an Kursu"
      });
    } catch (hata) {
      console.error("kopya basarisiz (" + adres + "): " + hata);
    }
  });
}

function kurulumTesti() {
  var k = klasorGetir();
  var s = sayfaGetir();
  Logger.log("Klasör: " + k.getUrl());
  Logger.log("Kayıt defteri: " + s.getParent().getUrl());
  MailApp.sendEmail(AYAR.bildirimEposta, "Ulu Camii kayıt sistemi hazır",
    "Kayıt alıcı çalışıyor (sürüm 6 — çift kayıt korumalı).\n\nKlasör: " + k.getUrl() +
    "\nKayıt defteri: " + s.getParent().getUrl());
  return "Tamam";
}

/** Kurulum sırasında atılan deneme kayıtlarını temizler. Bir kez çalıştırıp unutun. */
function testKaydiniSil() {
  var sayfa = sayfaGetir();
  var silinen = 0;
  if (sayfa.getLastRow() > 1) {
    var veri = sayfa.getRange(2, 1, sayfa.getLastRow() - 1, BASLIKLAR.length).getValues();
    for (var i = veri.length - 1; i >= 0; i--) {
      var soyad = String(veri[i][2] || "").toUpperCase();
      var kimlik = String(veri[i][6] || "").toUpperCase();
      if (soyad.indexOf("TESTOGLU") >= 0 || kimlik.indexOf("TEST") >= 0) {
        sayfa.deleteRow(i + 2);
        silinen++;
      }
    }
  }
  var klasor = klasorGetir();
  var dosyalar = klasor.getFiles();
  while (dosyalar.hasNext()) {
    var d = dosyalar.next();
    if (d.getName().toUpperCase().indexOf("TESTOGLU") >= 0) { d.setTrashed(true); silinen++; }
  }
  Logger.log("Silinen deneme kaydı: " + silinen);
  return "Silinen: " + silinen;
}


/* ===================================================================
   2) İHTİDA BAŞVURU ALICI — yeni
   =================================================================== */

const AYAR_IHTIDA = {
  klasorAdi: "İhtida Başvuruları",
  tabloAdi:  "İhtida Başvuru Defteri",
  bildirimEposta: "ulucamii.marche@gmail.com,info@ulucamii.be",
  ortakSir: "ULUCAMII-IHTIDA-2026",              // src/components/IhtidaFormu.tsx içindeki ORTAK_SIR ile AYNI olmalı
  azamiBayt: 9 * 1024 * 1024,
  yil: "2026"
};

const BASLIKLAR_IHTIDA = [
  "Zaman damgası", "Referans", "Adı Soyadı", "Cinsiyet", "Doğum tarihi", "Doğum yeri",
  "Uyruk", "T.C. Kimlik No", "Önceki din/mezhep", "E-posta", "Telefon", "Adres",
  "Öğrenim durumu", "Anne adı", "Baba adı", "Medeni hali", "Mesleği", "İhtida sebebi",
  "Yeni isim tercihi", "Tören dili", "Tören tarihi tercihi", "Nasıl haberdar oldu",
  "Ek not", "Fotoğraf izni", "PDF bağlantısı", "Durum", "Gönderim anahtarı",
  // v9 — EK-9 İhtida Belgesi için: iki isteğe bağlı şahit ve belgeye basılacak vesikalık
  "Şahit 1", "Şahit 1 imza", "Şahit 2", "Şahit 2 imza", "Vesikalık"
];

const SUTUN_IHTIDA = { referans: 2, durum: 26, anahtar: 27 };   // 1 tabanlı sütun numaraları

function ihtidaPostIsle(v) {
  try {
    if (!v) return json({ ok: false, hata: "bos-istek" });
    if (v.sir !== AYAR_IHTIDA.ortakSir) return json({ ok: false, hata: "yetkisiz" });
    var basvuran = v.basvuran || {};
    if (!basvuran.adSoyad) return json({ ok: false, hata: "eksik-bilgi" });
    if (!v.pdfBase64) return json({ ok: false, hata: "pdf-yok" });

    var klasor = ihtidaKlasorGetir();
    var sayfa = ihtidaSayfaGetir();
    var anahtar = temizAnahtar(v.gonderimAnahtari);

    // Aynı gönderim daha önce işlendiyse (cevap ulaşmamış olabilir) yeni satır açma.
    var onceki = anahtar ? ihtidaAnahtarBul(sayfa, anahtar) : null;
    if (onceki) return json({ ok: true, ref: onceki.ref, tekrar: true });

    var pdfBayt = Utilities.base64Decode(v.pdfBase64);
    if (!pdfBayt || pdfBayt.length < 1000) return json({ ok: false, hata: "pdf-bozuk" });

    var kilit = LockService.getScriptLock();
    kilit.waitLock(30000);
    var ref, dosya, blob;
    try {
      onceki = anahtar ? ihtidaAnahtarBul(sayfa, anahtar) : null;
      if (onceki) return json({ ok: true, ref: onceki.ref, tekrar: true });

      ref = ihtidaReferansUret(sayfa);
      var dosyaAdi = ref + " - " + basvuran.adSoyad + ".pdf";
      blob = Utilities.newBlob(pdfBayt, "application/pdf", dosyaAdi);
      dosya = klasor.createFile(blob);

      // v9: EK-9 belgesinde kullanılacak görseller ayrı dosyalar olarak saklanır.
      // (Hepsi isteğe bağlıdır; biri düşerse başvuru yine de kaydedilir.)
      var sahitGirdi = Array.isArray(v.sahitler) ? v.sahitler : [];
      var sahitBilgi = [];
      /* Drive'a yazilamayan gorsel eskiden yalniz konsola dusuyor, basvuruda hicbir iz
         birakmiyordu: EK-9 uretilirken eksik oldugu ancak o an fark ediliyordu. Artik
         toplanip bildirim e-postasina yaziliyor. (25 Agustos 2026 denetimi, bulgu 5) */
      var kaydedilemeyen = [];
      for (var si = 0; si < 2; si++) {
        var s = sahitGirdi[si] || {};
        var sUrl = "";
        if (s.imza) {
          try {
            var sBlob = veriUrlBlob(s.imza, ref + " - sahit" + (si + 1) + ".png");
            if (sBlob) sUrl = klasor.createFile(sBlob).getUrl();
          } catch (sHata) { console.error("sahit imzasi kaydedilemedi: " + sHata); kaydedilemeyen.push("sahit imzasi"); }
        }
        sahitBilgi.push({ ad: String(s.ad || ""), url: sUrl });
      }
      var vesikalikUrl = "";
      if (v.vesikalikBase64) {
        try {
          var vBlob = veriUrlBlob(v.vesikalikBase64, ref + " - vesikalik.jpg");
          if (vBlob) vesikalikUrl = klasor.createFile(vBlob).getUrl();
        } catch (vHata) { console.error("vesikalik kaydedilemedi: " + vHata); kaydedilemeyen.push("vesikalik"); }
      }
      if (v.basvuranImzaBase64) {
        try {
          var iBlob = veriUrlBlob(v.basvuranImzaBase64, ref + " - imza.png");
          if (iBlob) klasor.createFile(iBlob);
        } catch (iHata) { console.error("basvuran imzasi kaydedilemedi: " + iHata); kaydedilemeyen.push("basvuran imzasi"); }
      }

      sayfa.appendRow([
        new Date(), ref, basvuran.adSoyad || "", basvuran.cinsiyet || "", basvuran.dogumTarihi || "",
        basvuran.dogumYeri || "", basvuran.uyruk || "", basvuran.tcKimlikNo || "", basvuran.oncekiDin || "",
        basvuran.eposta || "", basvuran.telefon || "", basvuran.adres || "",
        basvuran.ogrenimDurumu || "", basvuran.anneAdi || "", basvuran.babaAdi || "",
        basvuran.medeniHali || "", basvuran.meslek || "", basvuran.ihtidaSebebi || "",
        basvuran.yeniIsim || "", basvuran.torenDili || "", basvuran.torenTarihi || "",
        basvuran.nasilHaberdar || "", basvuran.ekNot || "",
        v.fotografIzni ? "Evet" : "Hayır",
        dosya.getUrl(), "Yeni başvuru", anahtar,
        sahitBilgi[0].ad, sahitBilgi[0].url, sahitBilgi[1].ad, sahitBilgi[1].url, vesikalikUrl
      ]);
      SpreadsheetApp.flush();
      if (anahtar) ihtidaAnahtarKaydet(anahtar, ref);
    } finally {
      kilit.releaseLock();
    }

    // Kayıt artık güvende; bundan sonrası bildirimdir, e-posta hatası başvuruyu düşürmez.
    var eksikNotu = kaydedilemeyen.length
      ? "\n\nDIKKAT: su belgeler Drive'a kaydedilemedi -> " + kaydedilemeyen.join(", ")
        + "\nEK-9 uretilirken bu alanlar bos gelecektir; basvurandan yeniden istenmelidir.\n"
      : "";
    try {
      MailApp.sendEmail({
        to: AYAR_IHTIDA.bildirimEposta,
        subject: "İhtida başvurusu: " + basvuran.adSoyad + "  [" + ref + "]",
        body: [
          "Yeni bir İhtida Belgesi ön başvurusu geldi.",
          "",
          "Referans            : " + ref,
          "Adı Soyadı          : " + basvuran.adSoyad,
          "Doğum tarihi        : " + (basvuran.dogumTarihi || "-"),
          "Telefon             : " + (basvuran.telefon || "-"),
          "E-posta             : " + (basvuran.eposta || "-"),
          "Adres               : " + (basvuran.adres || "-"),
          "Tören dili tercihi  : " + (basvuran.torenDili || "-"),
          "Tören tarihi tercihi: " + (basvuran.torenTarihi || "-"),
          "Fotoğraf izni       : " + (v.fotografIzni ? "Evet" : "Hayır"),
          "Şahitler            : " + (sahitOzetMetni(v.sahitler)),
          "",
          "EK-9 İhtida Belgesi'ni yönetim panelinden (ulucamii.be/admin/ → Başvurular) tek tıkla üretebilirsiniz.",
          "Şahit imzası verilmeyen alanlar, belgede cami görevlilerinin imzasıyla tamamlanır.",
          "",
          "Doldurulmuş ve imzalanmış ön başvuru formu ektedir.",
          "Drive: " + dosya.getUrl(),
          "Başvuru defteri: " + sayfa.getParent().getUrl()
        ].join("\n") + eksikNotu,
        attachments: [blob],
        name: "Ulu Camii İhtida Başvuruları"
      });
    } catch (bildirimHatasi) {
      console.error("ihtida bildirimi gonderilemedi: " + bildirimHatasi);
      try {
        var satir = ihtidaSatirBul(sayfa, ref);
        if (satir > 0) sayfa.getRange(satir, SUTUN_IHTIDA.durum).setValue("Yeni başvuru · e-posta gönderilemedi");
      } catch (_) { /* not düşülemedi, kayıt yine de sağlam */ }
    }

    // Başvuranın kendi arşivi için imzalı formun bir kopyası (adres hatası kaydı düşürmesin diye ayrı try/catch).
    try {
      ihtidaKopyaGonder(blob, ref, basvuran.adSoyad, basvuran.eposta);
    } catch (kopyaHatasi) {
      console.error("ihtida kopyasi gonderilemedi: " + kopyaHatasi);
    }

    return json({ ok: true, ref: ref });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "sunucu-hatasi", ayrinti: String(hata).slice(0, 200) });
  }
}

/* ----------------------------------------------------------------- yardımcılar (ihtida) */

/** Bildirim e-postası için şahit özeti: "Ahmet Yılmaz (imzalı), 2. şahit yok" gibi. */
function sahitOzetMetni(sahitler) {
  var liste = Array.isArray(sahitler) ? sahitler : [];
  var parcalar = [];
  for (var i = 0; i < 2; i++) {
    var s = liste[i] || {};
    if (s.ad || s.imza) parcalar.push((s.ad || "(isimsiz)") + (s.imza ? " · imzalı" : " · imzasız"));
  }
  return parcalar.length ? parcalar.join(" | ") : "verilmedi (belgede cami görevlileri imzalayacak)";
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

function ihtidaSayfaGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("IHTIDA_TABLO_ID");
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(AYAR_IHTIDA.tabloAdi);
    var dosya = DriveApp.getFileById(ss.getId());
    ihtidaKlasorGetir().addFile(dosya);
    DriveApp.getRootFolder().removeFile(dosya);
    p.setProperty("IHTIDA_TABLO_ID", ss.getId());
  }
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0 || sh.getLastColumn() < BASLIKLAR_IHTIDA.length) {
    sh.getRange(1, 1, 1, BASLIKLAR_IHTIDA.length).setValues([BASLIKLAR_IHTIDA])
      .setFontWeight("bold").setBackground("#7A4B2A").setFontColor("#FFFFFF");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(SUTUN_IHTIDA.referans, 110);
    sh.setColumnWidth(SUTUN_IHTIDA.durum, 200);
  }
  return sh;
}

/** IH-2026-0001 biçiminde referans üretir — satır sayısı değil, defterdeki en büyük mevcut numara esastır. */
function ihtidaReferansUret(sayfa) {
  var sira = 1;
  if (sayfa.getLastRow() > 1) {
    var mevcut = sayfa.getRange(2, SUTUN_IHTIDA.referans, sayfa.getLastRow() - 1, 1).getValues();
    for (var j = 0; j < mevcut.length; j++) {
      var e = String(mevcut[j][0]).match(/^IH-\d{4}-(\d{4})/);
      if (e) sira = Math.max(sira, parseInt(e[1], 10) + 1);
    }
  }
  return "IH-" + AYAR_IHTIDA.yil + "-" + ("0000" + sira).slice(-4);
}

function ihtidaSatirBul(sayfa, ref) {
  if (sayfa.getLastRow() < 2) return 0;
  var veri = sayfa.getRange(2, SUTUN_IHTIDA.referans, sayfa.getLastRow() - 1, 1).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][0]).trim() === ref) return i + 2;
  }
  return 0;
}

/* Daha önce işlenmiş gönderim anahtarları CacheService'te (6 saat, hızlı yol) ve
   defterin son sütununda (kalıcı yol) tutulur — çift kayıt koruması kayıt sistemiyle aynı desen. */
function ihtidaAnahtarBul(sayfa, anahtar) {
  var onbellek = CacheService.getScriptCache();
  var ham = onbellek.get("ihtida-gonderim:" + anahtar);
  if (ham) { try { return JSON.parse(ham); } catch (_) { /* devam */ } }
  if (sayfa.getLastRow() < 2 || sayfa.getLastColumn() < SUTUN_IHTIDA.anahtar) return null;
  var veri = sayfa.getRange(2, 1, sayfa.getLastRow() - 1, SUTUN_IHTIDA.anahtar).getValues();
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][SUTUN_IHTIDA.anahtar - 1]).trim() === anahtar) {
      var sonuc = { ref: String(veri[i][SUTUN_IHTIDA.referans - 1]) };
      onbellek.put("ihtida-gonderim:" + anahtar, JSON.stringify(sonuc), 21600);
      return sonuc;
    }
  }
  return null;
}

function ihtidaAnahtarKaydet(anahtar, ref) {
  try {
    CacheService.getScriptCache().put("ihtida-gonderim:" + anahtar, JSON.stringify({ ref: ref }), 21600);
  } catch (_) { /* önbellek yoksa defter yeter */ }
}

/* Başvurana imzalı ön başvuru formunun bir kopyasını yollar (adres varsa ve geçerliyse). */
function ihtidaKopyaGonder(blob, ref, adSoyad, eposta) {
  var adres = String(eposta || "").trim();
  if (!adres || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adres)) return;

  var konu = "İhtida ön başvurunuz alındı / Votre pré-demande de conversion — " + ref;
  var govde = [
    "Esselâmü aleyküm,",
    "",
    adSoyad + " adına yaptığınız İhtida Belgesi ön başvurusu alınmıştır. Referans numaranız: " + ref,
    "Doldurduğunuz ve imzaladığınız form bu e-postanın ekindedir; lütfen saklayınız.",
    "",
    "Bu bir ön başvurudur. Resmî İhtida Belgesi (EK-9), camimizdeki törenin ardından",
    "T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği onayıyla düzenlenir.",
    "Tören tarihini belirlemek için camimiz sizinle ayrıca iletişime geçecektir.",
    "",
    "----------------------------------------------------------",
    "",
    "Bonjour,",
    "",
    "Votre pré-demande d'attestation de conversion au nom de " + adSoyad + " a bien été reçue.",
    "Numéro de référence : " + ref,
    "Le formulaire complété et signé se trouve en pièce jointe ; conservez-le.",
    "",
    "Il s'agit d'une pré-demande. L'attestation officielle de conversion (EK-9) est délivrée",
    "après la cérémonie à la mosquée, avec la validation du Conseiller des Affaires sociales",
    "de l'Ambassade de Turquie à Bruxelles. La mosquée vous recontactera pour fixer une date.",
    "",
    "----------------------------------------------------------",
    "",
    "Marche-en-Famenne Ulu Camii",
    "Thier des Corbeaux 14, 6900 Marche-en-Famenne",
    "Cami telefonu / Téléphone de la mosquée : +32 472 98 50 73",
    "Din görevlisi / Imam : +32 471 79 46 82"
  ].join("\n");

  try {
    MailApp.sendEmail({ to: adres, subject: konu, body: govde, attachments: [blob], name: "Ulu Camii İhtida Başvuruları" });
  } catch (hata) {
    console.error("ihtida kopyasi basarisiz (" + adres + "): " + hata);
  }
}

function ihtidaKurulumTesti() {
  var k = ihtidaKlasorGetir();
  var s = ihtidaSayfaGetir();
  Logger.log("Klasör: " + k.getUrl());
  Logger.log("Başvuru defteri: " + s.getParent().getUrl());
  MailApp.sendEmail(AYAR_IHTIDA.bildirimEposta, "Ulu Camii ihtida başvuru sistemi hazır",
    "İhtida başvuru alıcı çalışıyor.\n\nKlasör: " + k.getUrl() +
    "\nBaşvuru defteri: " + s.getParent().getUrl());
  return "Tamam";
}

/** Kurulum sırasında atılan deneme başvurularını temizler. Bir kez çalıştırıp unutun. */
function ihtidaTestKaydiniSil() {
  var sayfa = ihtidaSayfaGetir();
  var silinen = 0;
  if (sayfa.getLastRow() > 1) {
    var veri = sayfa.getRange(2, 1, sayfa.getLastRow() - 1, BASLIKLAR_IHTIDA.length).getValues();
    for (var i = veri.length - 1; i >= 0; i--) {
      var adSoyad = String(veri[i][2] || "").toUpperCase();
      if (adSoyad.indexOf("TESTOGLU") >= 0 || adSoyad.indexOf("TEST ") === 0) {
        sayfa.deleteRow(i + 2);
        silinen++;
      }
    }
  }
  var klasor = ihtidaKlasorGetir();
  var dosyalar = klasor.getFiles();
  while (dosyalar.hasNext()) {
    var d = dosyalar.next();
    if (d.getName().toUpperCase().indexOf("TESTOGLU") >= 0) { d.setTrashed(true); silinen++; }
  }
  Logger.log("Silinen deneme başvurusu: " + silinen);
  return "Silinen: " + silinen;
}
