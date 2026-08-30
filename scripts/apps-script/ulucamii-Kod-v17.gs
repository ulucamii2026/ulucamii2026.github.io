/**
 * Marche-en-Famenne Ulu Camii — Ortak Apps Script Alıcı (SÜRÜM 17)
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

var SURUM = 17;

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
  saglikBilgisi: { tr: "Sağlık bilgisi", fr: "Information médicale", en: "Health information" },
  goruntuIzni: { tr: "Görüntü kullanım izni", fr: "Autorisation d'utilisation d'image", en: "Image usage consent" },
  formDili: { tr: "Form dili", fr: "Langue du formulaire", en: "Form language" },
  elektronikImza: { tr: "Elektronik imza (veli)", fr: "Signature électronique (parent)", en: "Electronic signature (parent)" }
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
function pdfUst(baslikTr, baslikDil, dil, ref, zaman) {
  var baslik = kacis(baslikTr) + ((dil !== "tr" && baslikDil) ? " / " + kacis(baslikDil) : "");
  return '<header class="ust"><div class="kunye">Marche-en-Famenne Ulu Camii — Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL — KBO 0421.900.807 — Thier des Corbeaux 14, 6900 Marche-en-Famenne — info@ulucamii.be</div>'
    + '<div class="ref-kutu">Ref: <b>' + kacis(ref) + '</b><br>' + kacis(zaman) + '</div></header>'
    + '<h1>' + baslik + '</h1>';
}

/** [ [etiketHtml, degerHtml], ... ] dizisinden iki sütunlu tablo üretir. */
function pdfTablo(satirlar) {
  var iç = satirlar.map(function (s) {
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

  var okulGoster = (o.okul === "diger" && o.okulDiger) ? o.okulDiger : (o.okul || "");
  var d = function (v) { var s = (v === undefined || v === null) ? "" : String(v).trim(); return s ? kacis(s) : "—"; };

  var satirlar = [
    [ikiDilliEtiket(ETIKET_KAYIT.ogrenciAdSoyad, dil), d(((o.ad || "") + " " + (o.soyad || "")).trim())],
    [ikiDilliEtiket(ETIKET_KAYIT.ogrenciDogum, dil), d(tarihGoster(o.dogumTarihi))],
    [ikiDilliEtiket(ETIKET_KAYIT.ogrenciCinsiyet, dil), etiketDeger(ENUM_CINSIYET_OGRENCI, o.cinsiyet, dil)],
    [ikiDilliEtiket(ETIKET_KAYIT.okul, dil), d(okulGoster)],
    [ikiDilliEtiket(ETIKET_KAYIT.sinif, dil), d(o.sinif)],
    [ikiDilliEtiket(ETIKET_KAYIT.kursDurumu, dil), etiketDeger(ENUM_KURS_DURUMU, o.kursDurumu, dil)],
    [ikiDilliEtiket(ETIKET_KAYIT.veliYakinlik, dil), etiketDeger(ENUM_YAKINLIK, veli.yakinlik, dil)],
    [ikiDilliEtiket(ETIKET_KAYIT.veliAdSoyad, dil), d(veli.adSoyad)],
    [ikiDilliEtiket(ETIKET_KAYIT.veliCep, dil), d(veli.cep)],
    [ikiDilliEtiket(ETIKET_KAYIT.veliEposta, dil), d(veli.eposta)],
    [ikiDilliEtiket(ETIKET_KAYIT.adres, dil), d(veli.adres)],
    [ikiDilliEtiket(ETIKET_KAYIT.postaKodu, dil), d(veli.postaKodu)],
    [ikiDilliEtiket(ETIKET_KAYIT.sehir, dil), d(veli.sehir)],
    [ikiDilliEtiket(ETIKET_KAYIT.iletisimDili, dil), etiketDeger(ENUM_ILETISIM_DILI, veli.iletisimDili, dil)],
    [ikiDilliEtiket(ETIKET_KAYIT.acilKisi, dil), d(acil.adSoyad)],
    [ikiDilliEtiket(ETIKET_KAYIT.acilCep, dil), d(acil.cep)],
    [ikiDilliEtiket(ETIKET_KAYIT.goruntuIzni, dil), evetHayirGoster(!!veri.goruntuIzni, dil)],
    [ikiDilliEtiket(ETIKET_KAYIT.formDili, dil), d((veri.dil || "tr").toUpperCase())]
  ];

  var saglikBlok = "";
  if (saglik.var) {
    saglikBlok = '<section class="blok"><h2>' + ikiDilliEtiket(ETIKET_KAYIT.saglikBilgisi, dil)
      + ' — ' + (dil === "fr" ? "communiquée avec consentement explicite" : "açık rızayla verilmiştir")
      + "</h2><p>" + kacis(saglik.not || "") + "</p></section>";
  }

  var kurallarBlok = '<section class="blok"><h2>Kurs kuralları ve kurs–veli sözleşmesi (özet) / Règlement du cours et engagement parent–cours (résumé)</h2>'
    + "<h3>Türkçe</h3><ul><li>" + kacis(KURALLAR_OGRENCI_TR) + "</li><li>" + kacis(KURALLAR_VELI_TR) + "</li></ul>"
    + "<h3>Français</h3><ul><li>" + kacis(KURALLAR_OGRENCI_FR) + "</li><li>" + kacis(KURALLAR_VELI_FR) + "</li></ul>"
    + '<div class="onay">Elektronik onay / Approbation électronique: <b>' + kacis(onay.elektronikImza || "") + "</b> — " + kacis(zaman)
    + " — form dili / langue du formulaire: " + kacis((veri.dil || "tr").toUpperCase())
    + "<br>Bu belge çevrim içi formla oluşturulmuş, veli tarafından elektronik olarak onaylanmıştır. / "
    + "Ce document a été généré via le formulaire en ligne et approuvé électroniquement par le parent.</div>"
    + "</section>";

  var altBilgi = "<footer>Bu belgedeki kişisel veriler yalnız Kur'an kursu yönetimi için işlenir ve eğitim dönemi + 2 yıl saklanır. "
    + "Verilerinize erişim, düzeltme veya silme talebi için: info@ulucamii.be — "
    + "Les données personnelles de ce document sont traitées uniquement pour la gestion du cours coranique et conservées pendant l'année scolaire + 2 ans. "
    + "Pour accéder, corriger ou supprimer vos données : info@ulucamii.be</footer>";

  return "<!DOCTYPE html><html lang=\"" + kacis(dil) + "\"><head><meta charset=\"utf-8\"><title>" + kacis(ref)
    + "</title><style>" + PDF_CSS + "</style></head><body>"
    + pdfUst("Kur'an Kursu Kayıt Formu", "Formulaire d'inscription à l'école coranique", dil, ref, zaman)
    + pdfTablo(satirlar)
    + saglikBlok
    + kurallarBlok
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
  "PDF bağlantısı", "Durum", "Gönderim anahtarı"
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
      var html = pdfHtmlKayit(v, meta);
      var dosyaAdi = ref + " - " + adSoyad + ".pdf";
      blob = htmlPdfUret(html, dosyaAdi);
      dosya = klasor.createFile(blob);

      okulHucre = o.okul === "diger" ? ("Diğer: " + (o.okulDiger || "")) : o.okul;

      satirEkle(sayfaV2, [
        zamanDate, ref, o.soyad, o.ad, o.dogumTarihi || "", o.cinsiyet || "", okulHucre || "", o.sinif || "", o.kursDurumu || "",
        veli.yakinlik || "", veli.adSoyad || "", veli.cep || "", veli.eposta || "", veli.adres || "",
        veli.postaKodu || "", veli.sehir || "", veli.iletisimDili || "",
        acil.adSoyad || "", acil.cep || "",
        saglik.var ? (saglik.not || "") : "", saglik.var ? (onay.saglikRiza ? "Evet" : "Hayır") : "",
        v.goruntuIzni ? "Evet" : "Hayır", onay.elektronikImza || "", v.dil || "",
        dosya.getUrl(), "Yeni kayıt", anahtar
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
          "Görüntü izni  : " + (v.goruntuIzni ? "Evet" : "Hayır"),
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
      iVEposta = idx("Veli e-posta"), iAdres = idx("Adres"), iSaglikNot = idx("Sağlık notu"), iGoruntu = idx("Görüntü izni");

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
        onay: { kurallar: true, gizlilik: true, saglikRiza: saglikNotVar, elektronikImza: iVAd >= 0 ? String(satir[iVAd] || "") : "" }
      };

      var meta = { ref: ref, zaman: zamanStr + " — " + ARSIV_NOTU, dil: "tr" };
      var html = pdfHtmlKayit(veriSynth, meta);
      var dosyaAdi = ref + " - " + adSoyad + ".pdf";
      var yeniBlob = htmlPdfUret(html, dosyaAdi);
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
      iVEposta = idx("Veli e-posta"), iAdres = idx("Adres"), iSaglikNot = idx("Sağlık notu"), iGoruntu = idx("Görüntü izni");

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
