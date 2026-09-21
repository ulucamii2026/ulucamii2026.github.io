/* Kur'an ve dinî bilgi seviye tespit testi — sunucu iş mantığı (v38, 20 Eylül 2026).
 *
 *  Sözleşme ve kalıcı kararlar: docs/SEVIYE-TESTI.md. Puanlama ve soru bankası bu dosyada DEĞİL:
 *  tek kaynak `src/lib/seviye-testi/` ve esbuild paketi `SeviyeTesti` (npm run ihtida:gas-derle).
 *
 *  Mahremiyet — bu dosyanın var oluş sebebi:
 *   · Hoca raporu YALNIZ imam@ulucamii.be'ye gider: info@, AYAR2.bildirimEposta, cc ya da bcc ASLA eklenmez.
 *   · Rapor bilerek YEDEKSİZ gönderilir (`yedeksiz:true`): Brevo düşerse ileti dernek Gmail'inin
 *     «Gönderilenler» klasörüne (GDPR md. 9 verisi) düşmesin. Kayıt yine defterdedir, panelden okunur.
 *   · Katılımcı e-postası yalnız DÜZEY adlarını taşır: puan, yüzde, doğru/yanlış dökümü ve katılımcının
 *     kendi serbest metni bu iletide YOKTUR; «Yanıtla» doğrudan imama gider.
 *   · Katılımcıdan gelen serbest metin hoca raporunda tıklanabilir bağlantıya dönüştürülmez (`seviyeSerbest`).
 */

var AYAR_SEVIYE = {
  tabloAdi: "Ulu Camii — Seviye Testleri",
  ortakSir: "ULUCAMII-SEVIYE-2026",
  imamEposta: "imam@ulucamii.be",
  gunlukSinir: 25,
  epostaGunlukSinir: 3,
  saklamaAy: 24
};

/* Sıra BAĞLAYICIDIR: yeni sütun yalnız SONA eklenir (defterdeki eski satırlar kayar). */
var BASLIKLAR_SEVIYE = [
  "Zaman", "Referans", "Ad Soyad", "E-posta", "Telefon", "Test dili", "Ders dili", "Yaş aralığı", "Cinsiyet",
  "Müslümanlık süresi", "Önceki eğitim", "Hedefler", "Müsaitlik", "Biçim", "Not", "Kur'an düzeyi", "Tecvid",
  "Kur'an bilgisi", "İnanç", "Namaz", "İbadet", "Siyer", "Ahlak", "Yüzdeler", "Önerilen program",
  "Atlananlar", "Ezberler", "Beyanlar", "Cevaplar", "Süre (dk)", "Banka sürümü", "Rıza sürümü", "Durum", "Gönderim anahtarı",
  // v39 (form sürümü 2): başvuranın yeri ve yerel destek — eski satırlarda boştur
  "Ülke", "Şehir", "En yakın Diyanet camisi", "Camiyi biliyor", "Görevliyi tanıyor", "Ataşelik bilgisi",
  "Yerel görevli onayı", "Ataşelik onayı"
];

/** Test dili = sitenin beş dili (src/i18n/ui.ts → diller). Hoca raporu her zaman Türkçedir. */
var SEVIYE_DILLERI = ["tr", "fr", "en", "nl", "de"];

/** Başlık dizisinden türetilen 1 tabanlı sütun numarası — sıra elle yazılmaz. */
function seviyeSutun(ad) { return BASLIKLAR_SEVIYE.indexOf(ad) + 1; }

var SUTUN_SEVIYE = {
  zaman: seviyeSutun("Zaman"),
  referans: seviyeSutun("Referans"),
  eposta: seviyeSutun("E-posta"),
  cevaplar: seviyeSutun("Cevaplar"),
  durum: seviyeSutun("Durum"),
  anahtar: seviyeSutun("Gönderim anahtarı")
};

var SEVIYE_REF_DESENI = /^ST-\d{4}-\d{4}$/;
var SEVIYE_BEKLENIYOR = "eposta-bekleniyor";

/* ===================================================================
   Küçük yardımcılar (GAS API'si kullanmaz)
   =================================================================== */

function seviyeDuzNesne(x) { return !!x && typeof x === "object" && !Array.isArray(x); }

/** Alan kodlarının kanonik sırası tek kaynaktan gelir: `okuma` ilk, sonra altı bilgi alanı. */
function seviyeAlanKodlari() { return Object.keys(SeviyeTesti.SONUC_METINLERI.tr.alanAdlari); }

function seviyeJsonOku(deger) {
  var metin = String(deger == null ? "" : deger).trim();
  if (metin.charAt(0) === "'") metin = metin.slice(1); // hucreGuvenli öneki
  if (!metin) return {};
  try {
    var x = JSON.parse(metin);
    return seviyeDuzNesne(x) ? x : {};
  } catch (_) { return {}; }
}

/** Katılımcının yazdığı metni raporda ETKİSİZLEŞTİRİR: şablon `https://…` dizgelerini bağlantıya
    çevirdiği ve `**…**` kalını uyguladığı için `://` ayrılır, `*` ayıklanır. */
function seviyeSerbest(metin) {
  return String(metin == null ? "" : metin).replace(/:\/\//g, ":/ /").replace(/\*/g, "").trim();
}

function seviyeSureSn(v) {
  var meta = seviyeDuzNesne(v && v.meta) ? v.meta : {};
  var sn = typeof meta.sureSn === "number" && isFinite(meta.sureSn) ? meta.sureSn : 0;
  return Math.min(36000, Math.max(0, Math.round(sn)));
}

function seviyeGun(deger) {
  if (deger instanceof Date) return Utilities.formatDate(deger, "Europe/Brussels", "yyyy-MM-dd");
  return String(deger == null ? "" : deger).trim().slice(0, 10);
}

function seviyeSikMetni(sik, dil) {
  if (!seviyeDuzNesne(sik)) return "";
  if (typeof sik.ar === "string") return sik.ar;
  return String(sik[dil] || sik.tr || "");
}

/* ===================================================================
   Defter — SEVIYE_TABLO_ID (yeni Script Property; başkası eklenmez)
   =================================================================== */

/** Defteri açar, yoksa YARATIR. Yalnız POST'ta, kilit altında çağrılır. */
function seviyeSayfaGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("SEVIYE_TABLO_ID");
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(AYAR_SEVIYE.tabloAdi);
    var dosya = DriveApp.getFileById(ss.getId());
    klasorGetir().addFile(dosya);
    DriveApp.getRootFolder().removeFile(dosya);
    p.setProperty("SEVIYE_TABLO_ID", ss.getId());
  }
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0 || sh.getLastColumn() < BASLIKLAR_SEVIYE.length) {
    sh.getRange(1, 1, 1, BASLIKLAR_SEVIYE.length).setValues([BASLIKLAR_SEVIYE]).setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(SUTUN_SEVIYE.referans, 120);
    sh.setColumnWidth(SUTUN_SEVIYE.durum, 200);
  }
  return sh;
}

/** Defteri ASLA yaratmaz. GET uçları iki kez çalışabildiği için liste/detay/silme/temizlik bunu kullanır. */
function seviyeSayfaBul() {
  try {
    var id = PropertiesService.getScriptProperties().getProperty("SEVIYE_TABLO_ID");
    if (!id) return null;
    var ss = SpreadsheetApp.openById(id);
    return ss ? ss.getSheets()[0] : null;
  } catch (e) { return null; }
}

/* ===================================================================
   Doğrulama — sunucu yetkilidir; istemciden gelen hiçbir şey peşinen doğru sayılmaz
   =================================================================== */

/** `kayitDuzeltDogrula`'daki ad deseninin emsali: `*`, `<`, `>`, `:`, `/`, `@` ve rakam giremez. */
function seviyeAdGecerli(deger) {
  var d = String(deger == null ? "" : deger).trim();
  return d.length > 0 && /^[\p{L}\p{M}][\p{L}\p{M} '\-.]*$/u.test(d);
}

function seviyeDogrula(v) {
  if (!seviyeDuzNesne(v)) return h("bos-istek");
  if (v.sir !== AYAR_SEVIYE.ortakSir) return h("yetkisiz");
  // Sürüm 1 (yer bilgisi yok) yalnız dağıtım geçişinde, eski sayfa önbelleğinden gelen gönderimler için kabul edilir.
  if (v.formSurumu !== 1 && v.formSurumu !== 2) return h("form-surumu-gecersiz");
  if (SEVIYE_DILLERI.indexOf(v.dil) < 0) return h("dil-gecersiz");
  if (!temizAnahtar(v.gonderimAnahtari)) return h("anahtar-gecersiz");

  var onay = seviyeDuzNesne(v.onay) ? v.onay : {};
  if (onay.yas18 !== true) return h("onay-yas-eksik");
  if (onay.riza !== true) return h("onay-riza-eksik");
  var riza = typeof v.rizaSurumu === "string" ? v.rizaSurumu.trim() : "";
  if (!riza || riza.length > 20) return h("riza-surumu-gecersiz");
  if (typeof v.bankaSurumu !== "number" || !isFinite(v.bankaSurumu)) return h("banka-surumu-gecersiz");

  var sinir = SeviyeTesti.PROFIL_SINIRLARI, degerler = SeviyeTesti.PROFIL_DEGERLERI;
  var p = seviyeDuzNesne(v.profil) ? v.profil : {};
  if (!metinDolu(p.adSoyad) || !uzunlukTamam(p.adSoyad, sinir.adSoyad) || !seviyeAdGecerli(p.adSoyad)) return h("ad-gecersiz");
  if (!epostaGecerli(p.eposta) || !uzunlukTamam(p.eposta, sinir.eposta)) return h("eposta-gecersiz");
  var telefon = String(p.telefon == null ? "" : p.telefon).trim();
  if (telefon !== "" && !cepGecerli(telefon)) return h("telefon-gecersiz");

  var i, j;
  for (i = 0; i < SeviyeTesti.PROFIL_TEKLI.length; i++) {
    var tekli = SeviyeTesti.PROFIL_TEKLI[i];
    if (degerler[tekli].indexOf(p[tekli]) < 0) return h("profil-" + tekli + "-gecersiz");
  }
  for (i = 0; i < SeviyeTesti.PROFIL_COKLU.length; i++) {
    var coklu = SeviyeTesti.PROFIL_COKLU[i], dizi = p[coklu];
    if (!Array.isArray(dizi)) return h("profil-" + coklu + "-gecersiz");
    var gorulen = {};
    for (j = 0; j < dizi.length; j++) {
      var deger = dizi[j];
      if (degerler[coklu].indexOf(deger) < 0 || gorulen[deger] === true) return h("profil-" + coklu + "-gecersiz");
      gorulen[deger] = true;
    }
  }
  if (!uzunlukTamam(p.not == null ? "" : p.not, sinir.not)) return h("not-uzun");

  if (v.formSurumu === 2) {
    var yerelDurumu = seviyeYerelDogrula(v.yerel, onay);
    if (yerelDurumu) return h(yerelDurumu);
  }

  var alanlar = seviyeAlanKodlari();
  if (v.atla !== undefined && v.atla !== null) {
    if (!seviyeDuzNesne(v.atla)) return h("atla-gecersiz");
    var atlaAnahtarlari = Object.keys(v.atla);
    for (i = 0; i < atlaAnahtarlari.length; i++) {
      if (alanlar.indexOf(atlaAnahtarlari[i]) < 0 || typeof v.atla[atlaAnahtarlari[i]] !== "boolean") return h("atla-gecersiz");
    }
  }

  var cevapDurumu = SeviyeTesti.girdiDogrula(v.cevaplar);
  if (!cevapDurumu.tamam) return h(cevapDurumu.kod);

  var ezber = v.ezber === undefined || v.ezber === null ? {} : v.ezber;
  if (!seviyeDuzNesne(ezber)) return h("ezber-gecersiz");
  var ezberKimlikleri = SeviyeTesti.EZBER.map(function (e) { return e.id; });
  var ezberAnahtarlari = Object.keys(ezber);
  for (i = 0; i < ezberAnahtarlari.length; i++) {
    var ezberDeger = ezber[ezberAnahtarlari[i]];
    if (ezberKimlikleri.indexOf(ezberAnahtarlari[i]) < 0 || [0, 1, 2].indexOf(ezberDeger) < 0) return h("ezber-gecersiz");
  }

  var beyan = v.beyan === undefined || v.beyan === null ? {} : v.beyan;
  if (!seviyeDuzNesne(beyan)) return h("beyan-gecersiz");
  var beyanAnahtarlari = Object.keys(beyan);
  for (i = 0; i < beyanAnahtarlari.length; i++) {
    var madde = seviyeBeyanBul(beyanAnahtarlari[i]);
    var beyanDeger = beyan[beyanAnahtarlari[i]];
    if (!madde || typeof beyanDeger !== "number" || Math.floor(beyanDeger) !== beyanDeger ||
      beyanDeger < 0 || beyanDeger >= madde.secenekler.length) return h("beyan-gecersiz");
  }

  var meta = seviyeDuzNesne(v.meta) ? v.meta : {};
  if (meta.sureSn !== undefined && meta.sureSn !== null &&
    (typeof meta.sureSn !== "number" || !isFinite(meta.sureSn))) return h("sure-gecersiz");

  return { tamam: true };
}

/** Form sürümü 2: «Nereden başvuruyorsunuz?» bölümü. Hata kodu döner, sorun yoksa "" (tek kaynak: src/lib/seviye-testi/yerel.ts). */
function seviyeYerelDogrula(yerel, onay) {
  if (!seviyeDuzNesne(yerel)) return "yerel-eksik";
  var degerler = SeviyeTesti.YEREL_DEGERLERI, sinir = SeviyeTesti.YEREL_SINIRLARI;
  for (var i = 0; i < SeviyeTesti.YEREL_TEKLI.length; i++) {
    var alan = SeviyeTesti.YEREL_TEKLI[i];
    if (degerler[alan].indexOf(yerel[alan]) < 0) return "yerel-" + alan + "-gecersiz";
  }
  if (!metinDolu(yerel.sehir) || !uzunlukTamam(yerel.sehir, sinir.sehir)) return "yerel-sehir-gecersiz";
  if (!uzunlukTamam(yerel.yakinCami == null ? "" : yerel.yakinCami, sinir.yakinCami)) return "yerel-cami-uzun";
  // Paylaşım onayları İSTEĞE BAĞLIDIR; gelirse yalnız boolean olabilir (dize "true" onay sayılmaz).
  for (var j = 0; j < SeviyeTesti.YEREL_ONAYLARI.length; j++) {
    var o = onay[SeviyeTesti.YEREL_ONAYLARI[j]];
    if (o !== undefined && o !== null && typeof o !== "boolean") return "onay-paylasim-gecersiz";
  }
  return "";
}

function seviyeYerelKur(v) {
  if (v.formSurumu !== 2 || !seviyeDuzNesne(v.yerel)) return null;
  var y = v.yerel, onay = seviyeDuzNesne(v.onay) ? v.onay : {};
  return {
    ulke: y.ulke, sehir: String(y.sehir).trim(), camiBiliyor: y.camiBiliyor,
    yakinCami: String(y.yakinCami == null ? "" : y.yakinCami).trim(),
    gorevliTaniyor: y.gorevliTaniyor, ateselikBilgisi: y.ateselikBilgisi,
    onayYerelGorevli: onay.yerelGorevli === true, onayAteselik: onay.ateselik === true
  };
}

function seviyeBeyanBul(id) {
  var liste = SeviyeTesti.BEYAN;
  for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
  return null;
}

/* ===================================================================
   Kayıt nesnesi ↔ defter satırı
   =================================================================== */

function seviyeKayitKur(v, ref, zaman, anahtar) {
  var p = v.profil, alanlar = seviyeAlanKodlari(), atla = {};
  for (var i = 0; i < alanlar.length; i++) if (v.atla && v.atla[alanlar[i]] === true) atla[alanlar[i]] = true;
  return {
    ref: ref, zaman: zaman, gonderimAnahtari: anahtar, dil: SEVIYE_DILLERI.indexOf(v.dil) >= 0 ? v.dil : "tr",
    yerel: seviyeYerelKur(v),
    adSoyad: String(p.adSoyad).trim(), eposta: String(p.eposta).trim(),
    telefon: String(p.telefon == null ? "" : p.telefon).trim(),
    profil: {
      yasAraligi: p.yasAraligi, cinsiyet: p.cinsiyet, muslumanlik: p.muslumanlik, oncekiEgitim: p.oncekiEgitim,
      hedefler: (p.hedefler || []).slice(), dersDili: p.dersDili, gunler: (p.gunler || []).slice(),
      dilim: (p.dilim || []).slice(), bicim: p.bicim
    },
    not: String(p.not == null ? "" : p.not).trim(),
    atla: atla, cevaplar: v.cevaplar, ezber: v.ezber || {}, beyan: v.beyan || {},
    sureSn: seviyeSureSn(v), bankaSurumu: v.bankaSurumu, rizaSurumu: String(v.rizaSurumu).trim()
  };
}

function seviyeSatirKur(kayit, sonuc) {
  var alanSonucu = {}, yuzdeler = {};
  sonuc.alanlar.forEach(function (a) { alanSonucu[a.alan] = a; yuzdeler[a.alan] = a.yuzde; });
  var p = kayit.profil;
  var satir = [];
  satir[seviyeSutun("Zaman") - 1] = kayit.zaman;
  satir[seviyeSutun("Referans") - 1] = kayit.ref;
  satir[seviyeSutun("Ad Soyad") - 1] = kayit.adSoyad;
  satir[seviyeSutun("E-posta") - 1] = kayit.eposta;
  satir[seviyeSutun("Telefon") - 1] = kayit.telefon;
  satir[seviyeSutun("Test dili") - 1] = kayit.dil;
  satir[seviyeSutun("Ders dili") - 1] = p.dersDili;
  satir[seviyeSutun("Yaş aralığı") - 1] = p.yasAraligi;
  satir[seviyeSutun("Cinsiyet") - 1] = p.cinsiyet;
  satir[seviyeSutun("Müslümanlık süresi") - 1] = p.muslumanlik;
  satir[seviyeSutun("Önceki eğitim") - 1] = p.oncekiEgitim;
  satir[seviyeSutun("Hedefler") - 1] = p.hedefler.join(", ");
  // Ham değerler; Türkçe etiketleme yalnız raporda yapılır (günler ile saat dilimleri « | » ile ayrılır).
  satir[seviyeSutun("Müsaitlik") - 1] = p.gunler.join(", ") + " | " + p.dilim.join(", ");
  satir[seviyeSutun("Biçim") - 1] = p.bicim;
  satir[seviyeSutun("Not") - 1] = kayit.not;
  satir[seviyeSutun("Kur'an düzeyi") - 1] = sonuc.okuma.duzey;
  satir[seviyeSutun("Tecvid") - 1] = sonuc.okuma.tecvid ? "Evet" : "Hayır";
  satir[seviyeSutun("Kur'an bilgisi") - 1] = alanSonucu.kuranBilgi ? alanSonucu.kuranBilgi.duzey : "";
  satir[seviyeSutun("İnanç") - 1] = alanSonucu.itikat ? alanSonucu.itikat.duzey : "";
  satir[seviyeSutun("Namaz") - 1] = alanSonucu.namaz ? alanSonucu.namaz.duzey : "";
  satir[seviyeSutun("İbadet") - 1] = alanSonucu.ibadet ? alanSonucu.ibadet.duzey : "";
  satir[seviyeSutun("Siyer") - 1] = alanSonucu.siyer ? alanSonucu.siyer.duzey : "";
  satir[seviyeSutun("Ahlak") - 1] = alanSonucu.ahlak ? alanSonucu.ahlak.duzey : "";
  satir[seviyeSutun("Yüzdeler") - 1] = JSON.stringify(yuzdeler);
  satir[seviyeSutun("Önerilen program") - 1] = sonuc.program;
  satir[seviyeSutun("Atlananlar") - 1] = JSON.stringify(kayit.atla);
  satir[seviyeSutun("Ezberler") - 1] = JSON.stringify(kayit.ezber);
  satir[seviyeSutun("Beyanlar") - 1] = JSON.stringify(kayit.beyan);
  satir[seviyeSutun("Cevaplar") - 1] = JSON.stringify(kayit.cevaplar);
  satir[seviyeSutun("Süre (dk)") - 1] = Math.round(kayit.sureSn / 60);
  satir[seviyeSutun("Banka sürümü") - 1] = kayit.bankaSurumu;
  satir[seviyeSutun("Rıza sürümü") - 1] = kayit.rizaSurumu;
  satir[seviyeSutun("Durum") - 1] = "Yeni | " + SEVIYE_BEKLENIYOR;
  satir[seviyeSutun("Gönderim anahtarı") - 1] = temizAnahtar(kayit.gonderimAnahtari);
  if (kayit.yerel) {
    var y = kayit.yerel;
    satir[seviyeSutun("Ülke") - 1] = y.ulke;
    satir[seviyeSutun("Şehir") - 1] = y.sehir;
    satir[seviyeSutun("En yakın Diyanet camisi") - 1] = y.yakinCami;
    satir[seviyeSutun("Camiyi biliyor") - 1] = y.camiBiliyor;
    satir[seviyeSutun("Görevliyi tanıyor") - 1] = y.gorevliTaniyor;
    satir[seviyeSutun("Ataşelik bilgisi") - 1] = y.ateselikBilgisi;
    // Onaylar defterde açık sözcükle durur: boş hücre «sorulmadı» (form sürümü 1), «Hayır» «sorulup verilmedi» demektir.
    satir[seviyeSutun("Yerel görevli onayı") - 1] = y.onayYerelGorevli ? "Evet" : "Hayır";
    satir[seviyeSutun("Ataşelik onayı") - 1] = y.onayAteselik ? "Evet" : "Hayır";
  }
  for (var i = 0; i < BASLIKLAR_SEVIYE.length; i++) if (satir[i] === undefined) satir[i] = "";
  return satir;
}

/** Defter satırından kayıt nesnesi (panel ayrıntısı ve tekrar eden gönderim için). */
function seviyeSatirdanKayit(basliklar, satir) {
  var al = function (ad) {
    var i = basliklar.indexOf(ad);
    return i < 0 ? "" : satir[i];
  };
  var musaitlik = String(al("Müsaitlik") || "").split("|");
  var ayir = function (metin) {
    return String(metin || "").split(",").map(function (x) { return x.trim(); }).filter(function (x) { return x !== ""; });
  };
  return {
    ref: String(al("Referans") || "").trim(),
    zaman: al("Zaman"),
    dil: String(al("Test dili") || "tr").trim(),
    adSoyad: String(al("Ad Soyad") || "").trim(),
    eposta: String(al("E-posta") || "").trim(),
    telefon: String(al("Telefon") || "").trim(),
    profil: {
      yasAraligi: String(al("Yaş aralığı") || "").trim(), cinsiyet: String(al("Cinsiyet") || "").trim(),
      muslumanlik: String(al("Müslümanlık süresi") || "").trim(), oncekiEgitim: String(al("Önceki eğitim") || "").trim(),
      hedefler: ayir(al("Hedefler")), dersDili: String(al("Ders dili") || "").trim(),
      gunler: ayir(musaitlik[0]), dilim: ayir(musaitlik[1]), bicim: String(al("Biçim") || "").trim()
    },
    not: String(al("Not") || "").trim(),
    yerel: String(al("Ülke") || "").trim() === "" ? null : {
      ulke: String(al("Ülke")).trim(), sehir: String(al("Şehir") || "").trim(),
      yakinCami: String(al("En yakın Diyanet camisi") || "").trim(), camiBiliyor: String(al("Camiyi biliyor") || "").trim(),
      gorevliTaniyor: String(al("Görevliyi tanıyor") || "").trim(), ateselikBilgisi: String(al("Ataşelik bilgisi") || "").trim(),
      onayYerelGorevli: String(al("Yerel görevli onayı") || "").trim() === "Evet",
      onayAteselik: String(al("Ataşelik onayı") || "").trim() === "Evet"
    },
    atla: seviyeJsonOku(al("Atlananlar")), cevaplar: seviyeJsonOku(al("Cevaplar")),
    ezber: seviyeJsonOku(al("Ezberler")), beyan: seviyeJsonOku(al("Beyanlar")),
    sureSn: Math.round(Number(al("Süre (dk)") || 0) * 60),
    bankaSurumu: Number(al("Banka sürümü")), rizaSurumu: String(al("Rıza sürümü") || "").trim(),
    durum: String(al("Durum") || "").trim()
  };
}

/** `kayitDurumNotuEkle` kalıbı; «eposta-bekleniyor» parçası kaldırılır. */
function seviyeDurumNotuEkle(sayfa, ref, not) {
  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    var satir = satirBulGenel(sayfa, ref, SUTUN_SEVIYE.referans);
    if (satir < 2) return;
    var hucre = sayfa.getRange(satir, SUTUN_SEVIYE.durum);
    var parcalar = String(hucre.getValue() || "Yeni").split(" | ").filter(function (x) { return x !== SEVIYE_BEKLENIYOR; });
    if (parcalar.indexOf(not) === -1) parcalar.push(not);
    hucre.setValue(parcalar.join(" | "));
  } finally { kilit.releaseLock(); }
}

/* ===================================================================
   POST tur:"seviye"
   =================================================================== */

function seviyePostIsle(v) {
  var dogrulama = seviyeDogrula(v);
  if (!dogrulama.tamam) return json({ ok: false, hata: dogrulama.kod });

  var anahtar = temizAnahtar(v.gonderimAnahtari);
  var erken = null, sayfa = null, kayit = null, sonuc = null, ref = "";
  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    sayfa = seviyeSayfaGetir();
    var son = sayfa.getLastRow();
    // TEK okuma: tekrar denetimi, günlük sınırlar ve referans üretimi aynı veriden yapılır.
    var veri = son >= 2 ? sayfa.getRange(2, 1, son - 1, SUTUN_SEVIYE.anahtar).getValues() : [];

    var i;
    for (i = veri.length - 1; i >= 0 && !erken; i--) {
      if (String(veri[i][SUTUN_SEVIYE.anahtar - 1]).trim() !== anahtar) continue;
      erken = seviyeTekrarYaniti(veri[i]);
    }

    if (!erken) {
      var bugun = Utilities.formatDate(new Date(), "Europe/Brussels", "yyyy-MM-dd");
      var epostaKucuk = String(v.profil.eposta).trim().toLowerCase();
      var gunToplam = 0, gunEposta = 0;
      for (i = 0; i < veri.length; i++) {
        if (seviyeGun(veri[i][SUTUN_SEVIYE.zaman - 1]) !== bugun) continue;
        gunToplam++;
        if (String(veri[i][SUTUN_SEVIYE.eposta - 1]).trim().toLowerCase() === epostaKucuk) gunEposta++;
      }
      if (gunToplam >= AYAR_SEVIYE.gunlukSinir) {
        console.warn("seviye: gunluk sinir asildi (" + gunToplam + ")");
        erken = json({ ok: false, hata: "gunluk-sinir" });
      } else if (gunEposta >= AYAR_SEVIYE.epostaGunlukSinir) {
        console.warn("seviye: adres basina gunluk sinir asildi (" + gunEposta + ")");
        erken = json({ ok: false, hata: "eposta-gunluk-sinir" });
      }
    }

    if (!erken) {
      sonuc = SeviyeTesti.bankaPuanla({ cevaplar: v.cevaplar, atla: v.atla });
      ref = "ST-" + Utilities.formatDate(new Date(), "Europe/Brussels", "yyyy") + "-" +
        ("0000" + referansMaxBul([sayfa], "ST")).slice(-4);
      kayit = seviyeKayitKur(v, ref, new Date(), anahtar);
      satirEkle(sayfa, seviyeSatirKur(kayit, sonuc));
      SpreadsheetApp.flush();
    }
  } finally {
    kilit.releaseLock();
  }
  if (erken) return erken;

  // Kilit DIŞINDA: iki e-posta birbirinden bağımsızdır, biri düşerse öbürü yine denenir.
  var kopyaGitti = false, imamGitti = false;
  try { seviyeKatilimciEpostasi(kayit, sonuc, kayit.dil); kopyaGitti = true; }
  catch (hata) { console.error("seviye-katilimci-eposta-hatasi: " + String(hata && hata.message || hata).slice(0, 160)); }
  try { seviyeImamEpostasi(seviyeRaporVerisi(kayit, sonuc)); imamGitti = true; }
  catch (hata) { console.error("seviye-imam-eposta-hatasi: " + String(hata && hata.message || hata).slice(0, 160)); }

  try {
    seviyeDurumNotuEkle(sayfa, ref, kopyaGitti ? "katilimci-eposta-gonderildi" : "katilimci-eposta-gonderilemedi");
    seviyeDurumNotuEkle(sayfa, ref, imamGitti ? "imam-eposta-gonderildi" : "imam-eposta-gonderilemedi");
  } catch (hata) { console.error("seviye-durum-notu-hatasi: " + String(hata && hata.message || hata).slice(0, 160)); }

  try { seviyeSaklamaTemizle(sayfa); } catch (hata) { console.error("seviye-saklama-hatasi: " + String(hata && hata.message || hata).slice(0, 160)); }

  return json({ ok: true, ref: ref, kopyaGitti: kopyaGitti, sonuc: sonuc });
}

/** Aynı gönderim anahtarı: e-posta YENİDEN GÖNDERİLMEZ, sonuç satırdan yeniden hesaplanır. */
function seviyeTekrarYaniti(satir) {
  var durum = String(satir[SUTUN_SEVIYE.durum - 1] || "");
  var zaman = satir[SUTUN_SEVIYE.zaman - 1];
  var ms = zaman instanceof Date ? zaman.getTime() : Date.parse(String(zaman));
  if (isFinite(ms) && new Date().getTime() - ms < 120000 && durum.indexOf(SEVIYE_BEKLENIYOR) !== -1) {
    return json({ ok: false, hata: "kayit-isleniyor" });
  }
  var sonuc = SeviyeTesti.bankaPuanla({
    cevaplar: seviyeJsonOku(satir[SUTUN_SEVIYE.cevaplar - 1]),
    atla: seviyeJsonOku(satir[seviyeSutun("Atlananlar") - 1])
  });
  return json({
    ok: true, ref: String(satir[SUTUN_SEVIYE.referans - 1]).trim(), tekrar: true,
    kopyaGitti: durum.indexOf("katilimci-eposta-gonderildi") !== -1, sonuc: sonuc
  });
}

/* ===================================================================
   Katılımcı e-postası — yalnız düzey adları
   =================================================================== */

/** Gerçek yollar `src/i18n/ui.ts` → `yollar.gizlilik` (tr/fr/en) ile birebirdir. */
function seviyeGizlilikBaglantisi(dil) {
  var yollar = { tr: "https://ulucamii.be/tr/gizlilik/", fr: "https://ulucamii.be/fr/confidentialite/", en: "https://ulucamii.be/en/privacy/" };
  return (yollar[dil] || yollar.tr) + "#seviye-testi";
}

function seviyeKatilimciOlcekleri(sonuc, M) {
  var okuma = {
    etiket: M.alanAdlari.okuma, deger: sonuc.okuma.atlandi ? 0 : sonuc.okuma.duzey, azami: 5,
    metin: sonuc.okuma.atlandi ? M.atlandi : M.okumaDuzeyleri[sonuc.okuma.duzey]
  };
  var alanlar = sonuc.alanlar.map(function (a) {
    return {
      etiket: M.alanAdlari[a.alan], deger: a.atlandi ? 0 : a.duzey, azami: 3,
      metin: a.atlandi ? M.atlandi : M.duzeyAdlari[a.duzey]
    };
  });
  return { okuma: okuma, alanlar: alanlar };
}

function seviyeKatilimciEpostasi(kayit, sonuc, dil) {
  var M = SeviyeTesti.SONUC_METINLERI[dil];
  if (!M) throw new Error("seviye-eposta-dil");
  var olcekler = seviyeKatilimciOlcekleri(sonuc, M);
  var program = M.programlar[sonuc.program];
  var hitap = KIMLIK.yazisma.hitap[dil].resmi.replace(/\{adSoyad\}/g, seviyeSerbest(kayit.adSoyad));
  var konu = M.eposta.konu.replace(/\{ref\}/g, kayit.ref);

  var bloklar = [
    { tur: "paragraf", metin: hitap },
    { tur: "paragraf", metin: M.eposta.giris },
    { tur: "baslik", metin: M.eposta.kuranBaslik },
    { tur: "olcek", ogeler: [olcekler.okuma] }
  ];
  if (sonuc.okuma.tecvid) bloklar.push({ tur: "paragraf", metin: M.tecvidVar });
  bloklar.push({ tur: "baslik", metin: M.eposta.alanBaslik });
  bloklar.push({ tur: "olcek", ogeler: olcekler.alanlar });
  bloklar.push({ tur: "baslik", metin: M.eposta.programBaslik });
  bloklar.push({ tur: "paragraf", metin: "**" + program.ad + "** — " + program.aciklama });
  bloklar.push({ tur: "paragraf", metin: M.programNot });
  bloklar.push({ tur: "baslik", metin: M.eposta.sonrakiBaslik });
  bloklar.push({ tur: "paragraf", metin: M.sonraki });
  bloklar.push({ tur: "not", metin: M.eposta.gizlilik });
  bloklar.push({ tur: "paragraf", metin: KIMLIK.yazisma.kapanis[dil].genel });

  var htmlBody = veliEpostaZengin(bloklar, dil, konu, {
    kurum: "cami", onIzleme: M.eposta.onIzleme,
    dugme: { metin: M.eposta.dugme, url: seviyeGizlilikBaglantisi(dil) }
  });
  return epostaGonder({
    to: kayit.eposta, subject: konu, body: seviyeKatilimciDuzMetin(kayit, sonuc, dil),
    htmlBody: htmlBody, kurum: "cami", replyTo: AYAR_SEVIYE.imamEposta
  });
}

/** Düz metin karşılığı çağıranın sorumluluğundadır (şablon blokları düz metne çevirmez). */
function seviyeKatilimciDuzMetin(kayit, sonuc, dil) {
  var M = SeviyeTesti.SONUC_METINLERI[dil], olcekler = seviyeKatilimciOlcekleri(sonuc, M);
  var program = M.programlar[sonuc.program], s = [];
  s.push(KIMLIK.yazisma.hitap[dil].resmi.replace(/\{adSoyad\}/g, seviyeSerbest(kayit.adSoyad)), "");
  s.push(M.eposta.giris, "");
  s.push(M.eposta.kuranBaslik, olcekler.okuma.etiket + ": " + olcekler.okuma.metin);
  if (sonuc.okuma.tecvid) s.push(M.tecvidVar);
  s.push("");
  s.push(M.eposta.alanBaslik);
  olcekler.alanlar.forEach(function (o) { s.push(o.etiket + ": " + o.metin); });
  s.push("");
  s.push(M.eposta.programBaslik, program.ad + " — " + program.aciklama, M.programNot, "");
  s.push(M.eposta.sonrakiBaslik, M.sonraki, "");
  s.push(M.eposta.gizlilik, seviyeGizlilikBaglantisi(dil), "");
  s.push(KIMLIK.yazisma.kapanis[dil].genel);
  return s.concat(KIMLIK.yazisma.imza.cami[dil]).join("\n");
}

/* ===================================================================
   Hoca raporu — panel ayrıntısı ile ORTAK saf veri
   =================================================================== */

function seviyeEtiketle(alan, deger) {
  var etiket = SeviyeTesti.PROFIL_ETIKETLERI_TR[alan];
  if (!etiket) return String(deger == null ? "" : deger);
  return etiket.degerler[deger] || String(deger == null ? "" : deger);
}

function seviyeRaporVerisi(kayit, sonuc) {
  var T = SeviyeTesti.PROFIL_ETIKETLERI_TR, M = SeviyeTesti.SONUC_METINLERI.tr;
  // Hoca raporu HER ZAMAN Türkçedir: şık metinleri de TR'den (Arapça şıklarda `ar`) okunur.
  var p = kayit.profil, dil = "tr";

  var profil = [];
  SeviyeTesti.PROFIL_TEKLI.forEach(function (alan) {
    profil.push({ etiket: T[alan].ad, deger: seviyeEtiketle(alan, p[alan]) });
  });
  SeviyeTesti.PROFIL_COKLU.forEach(function (alan) {
    profil.push({
      etiket: T[alan].ad,
      deger: (p[alan] || []).map(function (d) { return seviyeEtiketle(alan, d); }).join(", ")
    });
  });

  var atlananlar = [];
  seviyeAlanKodlari().forEach(function (alan) { if (kayit.atla && kayit.atla[alan] === true) atlananlar.push(M.alanAdlari[alan]); });

  var yerel = seviyeYerelRaporu(kayit.yerel);

  var okumaBeyanlari = [], uygulamaBeyanlari = [], celiskiler = [];
  SeviyeTesti.BEYAN.forEach(function (b) {
    var secim = kayit.beyan ? kayit.beyan[b.id] : undefined;
    if (typeof secim !== "number" || !b.secenekler[secim]) return;
    var oge = { id: b.id, soru: b.soru.tr, cevap: b.secenekler[secim].tr, secim: secim, toplam: b.secenekler.length };
    if (b.kume === "okuma") okumaBeyanlari.push(oge); else uygulamaBeyanlari.push(oge);
  });
  if (!sonuc.okuma.atlandi) {
    okumaBeyanlari.forEach(function (b) {
      if (b.toplam < 2) return;
      var oran = b.secim / (b.toplam - 1);
      if (oran >= 0.75 && sonuc.okuma.duzey <= 1) {
        celiskiler.push("Öz beyan («" + b.cevap + "») test sonucundan belirgin biçimde YÜKSEK: " + SeviyeTesti.OKUMA_DUZEYLERI_TR[sonuc.okuma.duzey] + ".");
      } else if (oran <= 0.25 && sonuc.okuma.duzey >= 4) {
        celiskiler.push("Öz beyan («" + b.cevap + "») test sonucundan belirgin biçimde DÜŞÜK: " + SeviyeTesti.OKUMA_DUZEYLERI_TR[sonuc.okuma.duzey] + ".");
      }
    });
  }

  var yanlislar = {}, dogrular = [], mezhep = [], cevapsiz = 0;
  seviyeAlanKodlari().forEach(function (alan) { yanlislar[alan] = []; });
  SeviyeTesti.MADDELER.forEach(function (m) {
    if (m.emekli) return;
    if (kayit.atla && kayit.atla[m.alan] === true) return;
    var verilen = kayit.cevaplar ? kayit.cevaplar[m.id] : undefined;
    if (m.mezhepBagli) {
      if (typeof verilen === "number" && verilen !== -1) {
        mezhep.push({
          id: m.id, alan: m.alan, soru: m.soru.tr, verilen: seviyeSikMetni(m.siklar[verilen], dil),
          dogru: seviyeSikMetni(m.siklar[m.dogru], dil)
        });
      }
      return;
    }
    if (typeof verilen !== "number") { cevapsiz++; return; }
    if (verilen === m.dogru) { dogrular.push(m.id); return; }
    yanlislar[m.alan].push({
      id: m.id, basamak: m.basamak, soru: m.soru.tr,
      verilen: verilen === -1 ? "Bilmiyorum" : seviyeSikMetni(m.siklar[verilen], dil),
      dogru: seviyeSikMetni(m.siklar[m.dogru], dil)
    });
  });

  var ezberler = SeviyeTesti.EZBER.map(function (e) {
    var d = kayit.ezber ? kayit.ezber[e.id] : undefined;
    return { id: e.id, ad: e.ad.tr, durum: SeviyeTesti.EZBER_DURUMLARI_TR[typeof d === "number" ? d : 0] };
  });

  var sureDk = Math.round((kayit.sureSn || 0) / 60), uyarilar = [];
  if (sureDk > 0 && sureDk < 4) uyarilar.push("Test çok hızlı tamamlandı (" + sureDk + " dk) — sonuç ihtiyatla okunmalıdır.");
  if (atlananlar.length) uyarilar.push("Atlanan bölümler: " + atlananlar.join(", ") + ".");
  if (Number(kayit.bankaSurumu) !== SeviyeTesti.SORU_BANKASI_SURUMU) {
    uyarilar.push("Soru bankası sürümü uyuşmuyor (gönderim " + kayit.bankaSurumu + ", sunucu " + SeviyeTesti.SORU_BANKASI_SURUMU + ").");
  }

  return {
    ref: kayit.ref, zaman: seviyeGun(kayit.zaman), adSoyad: seviyeSerbest(kayit.adSoyad), eposta: kayit.eposta,
    telefon: kayit.telefon, testDili: dil, sureDk: sureDk, bankaSurumu: kayit.bankaSurumu, rizaSurumu: kayit.rizaSurumu,
    profil: profil, yerel: yerel,
    okuma: {
      duzey: sonuc.okuma.duzey, ad: SeviyeTesti.OKUMA_DUZEYLERI_TR[sonuc.okuma.duzey],
      atlandi: sonuc.okuma.atlandi, tecvid: sonuc.okuma.tecvid, basamaklar: sonuc.okuma.basamaklar
    },
    okumaBeyanlari: okumaBeyanlari, celiskiler: celiskiler,
    alanlar: sonuc.alanlar.map(function (a) {
      return {
        alan: a.alan, ad: M.alanAdlari[a.alan], duzey: a.duzey, duzeyAdi: M.duzeyAdlari[a.duzey],
        yuzde: a.yuzde, atlandi: a.atlandi, basamaklar: a.basamaklar
      };
    }),
    yanlislar: yanlislar, cevapsiz: cevapsiz, dogrular: dogrular, mezhep: mezhep,
    ezberler: ezberler, uygulamaBeyanlari: uygulamaBeyanlari,
    program: { kod: sonuc.program, ad: M.programlar[sonuc.program].ad, aciklama: M.programlar[sonuc.program].aciklama },
    atlananlar: atlananlar, uyarilar: uyarilar, not: seviyeSerbest(kayit.not)
  };
}

/** «Yer ve yerel destek» bölümü: hoca, eğitimi katılımcıya en yakın yerde planlayabilsin diye.
    Paylaşım onayı YOKSA bunu açıkça yazar — onaysız hiçbir bilgi başka görevliye ya da Müşavirliğe verilmez. */
function seviyeYerelRaporu(y) {
  if (!y) return null;
  var E = SeviyeTesti.YEREL_ETIKETLERI_TR, EH = SeviyeTesti.EVET_HAYIR_TR;
  var ulke = SeviyeTesti.ULKE_ADLARI[y.ulke] ? SeviyeTesti.ULKE_ADLARI[y.ulke].tr : String(y.ulke || "");
  var satirlar = [
    E.ulke + ": " + ulke,
    E.sehir + ": " + seviyeSerbest(y.sehir),
    E.camiBiliyor + ": " + (EH[y.camiBiliyor] || "—"),
    E.yakinCami + ": " + (y.yakinCami ? seviyeSerbest(y.yakinCami) : "—"),
    E.gorevliTaniyor + ": " + (EH[y.gorevliTaniyor] || "—"),
    E.ateselikBilgisi + ": " + (EH[y.ateselikBilgisi] || "—")
  ];
  var onaylar = [
    E.yerelGorevli + ": " + (y.onayYerelGorevli ? "ONAY VERDİ" : "ONAY VERMEDİ"),
    E.ateselik + ": " + (y.onayAteselik ? "ONAY VERDİ" : "ONAY VERMEDİ")
  ];
  var oneriler = [];
  if (y.ulke !== "BE") {
    oneriler.push("Başvuru Belçika dışından: eğitim katılımcıya en yakın yerde planlanmalıdır" +
      (y.onayYerelGorevli ? " — onayı var; en yakın Diyanet camisinin din görevlisiyle görüşülebilir." : " — ancak paylaşım onayı YOK; önce katılımcının kendisiyle görüşünüz, çevrim içi ders seçeneğini sununuz."));
  } else {
    oneriler.push("Başvuru Belçika içinden: şehir Marche-en-Famenne'e uzaksa en yakın Diyanet camisiyle yerel planlama düşünülebilir" +
      (y.onayYerelGorevli ? " (paylaşım onayı var)." : " (paylaşım onayı YOK — önce katılımcıya sorunuz)."));
  }
  if (y.camiBiliyor === "hayir") oneriler.push("En yakın Diyanet camisini bilmiyor: ilk görüşmede kendisine en yakın cami bildirilmelidir.");
  if (y.ateselikBilgisi === "hayir") oneriler.push("Ülkesindeki Din Hizmetleri Müşavirliği / Ataşeliğinden haberdar değil: kısaca tanıtılabilir.");
  var uyari = (!y.onayYerelGorevli || !y.onayAteselik)
    ? "Onay verilmeyen paylaşım YAPILMAZ: bu sonuç ve kişi bilgileri onay verilmeyen tarafa (başka din görevlisi / Müşavirlik-Ataşelik) iletilmez."
    : "";
  return { satirlar: satirlar, onaylar: onaylar, oneriler: oneriler, uyari: uyari, ulke: ulke, sehir: seviyeSerbest(y.sehir) };
}

function seviyeBasamakDokumu(basamaklar, onEk) {
  return basamaklar.map(function (b) {
    return onEk + b.basamak + ": " + b.dogru + "/" + b.toplam + " — " + (b.gecti ? "geçti" : "geçmedi");
  });
}

/** `sinir` > 0 ise alan başına yalnız ilk N yanlış madde yazılır (HTML 90 KB'ı aşarsa). */
function seviyeImamBloklari(rapor, sinir) {
  var bloklar = [];
  bloklar.push({ tur: "paragraf", metin: "**" + rapor.ref + "** · " + rapor.zaman + " · " + rapor.adSoyad + " · " + rapor.eposta + (rapor.telefon ? " · " + rapor.telefon : "") });

  bloklar.push({ tur: "baslik", metin: "Kur'an okuma düzeyi" });
  bloklar.push({
    tur: "olcek", ogeler: [{
      etiket: "Kur'an okuma", deger: rapor.okuma.atlandi ? 0 : rapor.okuma.duzey, azami: 5,
      metin: rapor.okuma.atlandi ? "Bölüm atlandı" : rapor.okuma.ad, sayi: true
    }]
  });
  bloklar.push({ tur: "madde", ogeler: seviyeBasamakDokumu(rapor.okuma.basamaklar, "K").concat([rapor.okuma.tecvid ? "Tecvid kavramları: tanıyor" : "Tecvid kavramları: henüz tanımıyor"]) });
  if (rapor.okumaBeyanlari.length) {
    bloklar.push({ tur: "paragraf", metin: "**Katılımcının kendi beyanı**" });
    bloklar.push({ tur: "madde", ogeler: rapor.okumaBeyanlari.map(function (b) { return b.soru + " → " + b.cevap; }) });
  }
  if (rapor.celiskiler.length) bloklar.push({ tur: "not", metin: rapor.celiskiler.join("\n") });

  bloklar.push({ tur: "baslik", metin: "Katılımcı bilgileri" });
  bloklar.push({ tur: "madde", ogeler: rapor.profil.map(function (x) { return x.etiket + ": " + x.deger; }) });

  if (rapor.yerel) {
    bloklar.push({ tur: "baslik", metin: "Yer ve yerel destek" });
    bloklar.push({ tur: "madde", ogeler: rapor.yerel.satirlar });
    bloklar.push({ tur: "paragraf", metin: "**Paylaşım onayları**" });
    bloklar.push({ tur: "madde", ogeler: rapor.yerel.onaylar });
    if (rapor.yerel.uyari) bloklar.push({ tur: "not", metin: rapor.yerel.uyari });
    bloklar.push({ tur: "madde", ogeler: rapor.yerel.oneriler });
  }

  bloklar.push({ tur: "baslik", metin: "Dinî bilgi alanları" });
  bloklar.push({
    tur: "olcek", ogeler: rapor.alanlar.map(function (a) {
      return { etiket: a.ad, deger: a.atlandi ? 0 : a.duzey, azami: 3, metin: a.atlandi ? "Bölüm atlandı" : a.duzeyAdi, sayi: true };
    })
  });
  bloklar.push({
    tur: "madde", ogeler: rapor.alanlar.map(function (a) {
      return a.ad + ": %" + a.yuzde + " — " + seviyeBasamakDokumu(a.basamaklar, "B").join(" · ");
    })
  });

  bloklar.push({ tur: "baslik", metin: "Yanlış ve «bilmiyorum» maddeleri" });
  var kirpildi = false;
  [{ alan: "okuma", ad: "Kur'an okuma" }].concat(rapor.alanlar).forEach(function (a) {
    var liste = rapor.yanlislar[a.alan] || [];
    if (!liste.length) return;
    var gosterilen = sinir > 0 && liste.length > sinir ? liste.slice(0, sinir) : liste;
    if (gosterilen.length < liste.length) kirpildi = true;
    bloklar.push({ tur: "paragraf", metin: "**" + a.ad + "** (" + liste.length + ")" });
    bloklar.push({
      tur: "madde", ogeler: gosterilen.map(function (m) {
        return m.id + " (B" + m.basamak + ") " + m.soru + " → verdiği: " + m.verilen + " · doğrusu: " + m.dogru;
      })
    });
  });
  bloklar.push({ tur: "paragraf", metin: "Cevapsız madde: " + rapor.cevapsiz + " · Doğru madde: " + rapor.dogrular.length });
  if (rapor.dogrular.length) bloklar.push({ tur: "paragraf", metin: "Doğru bilinen maddeler: " + rapor.dogrular.join(", ") });
  if (kirpildi) bloklar.push({ tur: "not", metin: "Döküm uzun olduğu için kısaltıldı; tam döküm yönetim panelindedir." });

  if (rapor.mezhep.length) {
    bloklar.push({ tur: "baslik", metin: "Mezhebe bağlı maddeler (puana girmez)" });
    bloklar.push({
      tur: "madde", ogeler: rapor.mezhep.map(function (m) {
        return m.id + " " + m.soru + " → verdiği: " + m.verilen + " · Hanefî mezhebine göre: " + m.dogru;
      })
    });
  }

  bloklar.push({ tur: "baslik", metin: "Ezber listesi" });
  bloklar.push({ tur: "madde", ogeler: rapor.ezberler.map(function (e) { return e.ad + ": " + e.durum; }) });

  if (rapor.uygulamaBeyanlari.length) {
    bloklar.push({ tur: "baslik", metin: "Uygulama öz beyanı" });
    bloklar.push({ tur: "madde", ogeler: rapor.uygulamaBeyanlari.map(function (b) { return b.soru + " → " + b.cevap; }) });
  }

  bloklar.push({ tur: "baslik", metin: "Önerilen program" });
  bloklar.push({ tur: "paragraf", metin: "**" + rapor.program.kod + " — " + rapor.program.ad + "** · " + rapor.program.aciklama });

  if (rapor.uyarilar.length) {
    bloklar.push({ tur: "baslik", metin: "Uyarılar" });
    bloklar.push({ tur: "madde", ogeler: rapor.uyarilar });
  }
  if (rapor.not) {
    bloklar.push({ tur: "baslik", metin: "Katılımcının notu" });
    bloklar.push({ tur: "not", metin: rapor.not });
  }
  return bloklar;
}

function seviyeImamDuzMetin(rapor) {
  var s = [rapor.ref + " · " + rapor.zaman + " · " + rapor.adSoyad + " · " + rapor.eposta, ""];
  s.push("Kur'an okuma: " + (rapor.okuma.atlandi ? "Bölüm atlandı" : rapor.okuma.ad) + " (" + rapor.okuma.duzey + "/5)");
  rapor.alanlar.forEach(function (a) {
    s.push(a.ad + ": " + (a.atlandi ? "Bölüm atlandı" : a.duzeyAdi) + " (" + (a.atlandi ? 0 : a.duzey) + "/3)");
  });
  s.push("", "Önerilen program: " + rapor.program.kod + " — " + rapor.program.ad, "");
  if (rapor.yerel) s.push("Yer: " + rapor.yerel.ulke + " · " + rapor.yerel.sehir, rapor.yerel.onaylar.join(" · "), "");
  var kimlikler = [];
  seviyeAlanKodlari().forEach(function (alan) {
    (rapor.yanlislar[alan] || []).forEach(function (m) { kimlikler.push(m.id); });
  });
  s.push("Yanlış/bilmiyorum maddeleri: " + (kimlikler.length ? kimlikler.join(", ") : "yok"));
  s.push("Cevapsız: " + rapor.cevapsiz + " · Doğru: " + rapor.dogrular.length);
  if (rapor.uyarilar.length) s.push("", "Uyarılar: " + rapor.uyarilar.join(" "));
  s.push("", "Tam döküm yönetim panelindedir.");
  return s.join("\n");
}

function seviyeImamEpostasi(rapor) {
  var konu = "Seviye testi — " + rapor.ref + " · " + rapor.adSoyad;
  var secenekler = { kurum: "cami", onIzleme: "Yeni seviye tespit sonucu: " + rapor.ref };
  var htmlBody = veliEpostaZengin(seviyeImamBloklari(rapor, 0), "tr", konu, secenekler);
  if (htmlBody.length > 90 * 1024) htmlBody = veliEpostaZengin(seviyeImamBloklari(rapor, 12), "tr", konu, secenekler);
  // Alıcı TEK: imam@ulucamii.be. cc/bcc yok, MailApp yedeği kapalı.
  return epostaGonder({
    to: AYAR_SEVIYE.imamEposta, subject: konu, body: seviyeImamDuzMetin(rapor),
    htmlBody: htmlBody, kurum: "cami", replyTo: rapor.eposta, yedeksiz: true
  });
}

/* ===================================================================
   Panel uçları ve saklama temizliği
   =================================================================== */

/** GET ?islem=seviye-detay&ref=ST-YYYY-NNNN&anahtar=… — yan etkisizdir, defter YARATMAZ. */
function seviyeDetayIsle(e) {
  // PANEL_ANAHTARI tanımlı değilken koddaki yer tutucu ANAHTAR SAYILMAZ (depo public; `ozellikBakimIsle`
  // ile aynı koruma). `panelYetkiTamam` tek başına bu denetimi yapmıyor — bkz. rapor: panel yer tutucusu.
  if (PANEL.anahtar === "SCRIPT-PROPERTIES-ICINDE" || !panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  var ref = String(e && e.parameter && e.parameter.ref || "").trim();
  if (!SEVIYE_REF_DESENI.test(ref)) return json({ ok: false, hata: "ref-gecersiz" });
  try {
    var sayfa = seviyeSayfaBul();
    if (!sayfa) return json({ ok: false, hata: "bulunamadi" });
    var son = sayfa.getLastRow(), sonSutun = sayfa.getLastColumn();
    if (son < 2 || sonSutun < 1) return json({ ok: false, hata: "bulunamadi" });
    var basliklar = sayfa.getRange(1, 1, 1, sonSutun).getValues()[0].map(String);
    var veri = sayfa.getRange(2, 1, son - 1, sonSutun).getValues();
    var iRef = basliklar.indexOf("Referans");
    if (iRef < 0) return json({ ok: false, hata: "sutun-yok" });
    for (var i = veri.length - 1; i >= 0; i--) {
      if (String(veri[i][iRef] || "").trim() !== ref) continue;
      var kayit = seviyeSatirdanKayit(basliklar, veri[i]);
      var sonuc = SeviyeTesti.bankaPuanla({ cevaplar: kayit.cevaplar, atla: kayit.atla });
      return json({ ok: true, rapor: seviyeRaporVerisi(kayit, sonuc) });
    }
    return json({ ok: false, hata: "bulunamadi" });
  } catch (hata) {
    console.error("seviye-detay-hatasi");
    return json({ ok: false, hata: "seviye-detay-hatasi" });
  }
}

/** POST tur:"seviye-sil" — tek tek siler, idempotenttir; toplu silme YOKTUR. */
function seviyeSilIsle(v) {
  if (PANEL.anahtar === "SCRIPT-PROPERTIES-ICINDE" || !v || !v.anahtar || String(v.anahtar) !== PANEL.anahtar) {
    return json({ ok: false, hata: "yetkisiz" });
  }
  var ref = String(v.ref || "").trim();
  if (!SEVIYE_REF_DESENI.test(ref)) return json({ ok: false, hata: "ref-gecersiz" });
  var sayfa = seviyeSayfaBul();
  if (!sayfa) return json({ ok: true, silinen: 0 });
  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    var satir = satirBulGenel(sayfa, ref, SUTUN_SEVIYE.referans);
    if (satir < 2) return json({ ok: true, silinen: 0 });
    sayfa.deleteRow(satir);
    return json({ ok: true, silinen: 1 });
  } catch (hata) {
    console.error("seviye-sil-hatasi");
    return json({ ok: false, hata: "seviye-sil-hatasi" });
  } finally { kilit.releaseLock(); }
}

/** 24 aydan eski satırlar SONDAN BAŞA silinir (GDPR md. 5/1-e; docs/SEVIYE-TESTI.md §7). */
function seviyeSaklamaTemizle(sayfa) {
  sayfa = sayfa || seviyeSayfaBul();
  if (!sayfa) return 0;
  var son = sayfa.getLastRow();
  if (son < 2) return 0;
  var esik = new Date();
  esik.setMonth(esik.getMonth() - AYAR_SEVIYE.saklamaAy);
  var veri = sayfa.getRange(2, 1, son - 1, 1).getValues(), silinen = 0;
  for (var i = veri.length - 1; i >= 0; i--) {
    var z = veri[i][0];
    var ms = z instanceof Date ? z.getTime() : Date.parse(String(z));
    if (!isFinite(ms) || ms >= esik.getTime()) continue;
    sayfa.deleteRow(i + 2);
    silinen++;
  }
  return silinen;
}

/** Günlük zamanlı görev (veliMailListesiZamanli'nin sonundan çağrılır); ayrı tetikleyici yoktur. */
function seviyeZamanliTemizlik() {
  var onbellek = null;
  try { onbellek = CacheService.getScriptCache(); } catch (_) { onbellek = null; }
  if (onbellek && onbellek.get("seviye-temizlik")) return 0;
  var sayfa = seviyeSayfaBul();
  var silinen = sayfa ? seviyeSaklamaTemizle(sayfa) : 0;
  if (onbellek) { try { onbellek.put("seviye-temizlik", "1", 21600); } catch (_) {} }
  return silinen;
}
