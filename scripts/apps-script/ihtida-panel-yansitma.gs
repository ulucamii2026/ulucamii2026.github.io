/* Dilim 5 / WP4: ihtida başvurusunu ihtida panelinin `basvuruAl` ucuna YANSITMA (form arka ucu → panel).
 * Bu dosya derlemede ana koda eklenir (scripts/ihtida-gas-derle.mjs). İşletme notları: docs/IHTIDA-PANEL-YANSITMA.md.
 *
 * Güvenlik sözleşmesi (sınanır: tests/ihtida-panel-yansitma.test.mjs):
 *  - Panele YALNIZ sözleşmenin beyaz listesi gider: ref, zaman, dil, cinsiyet, dogumTarihi, uyruk, camiId, torenDili, rizaSurum,
 *    ad, eposta. Serbest metin, telefon, adres, görsel, imza, şahit, kimlik verisi, ihtida sebebi defterden hiç okunmaz.
 *  - Sır (HMAC anahtarı) ve uç adresi Script Properties'te durur, kodda YOK: PANEL_YANSIT_SIR, PANEL_YANSIT_URL.
 *  - Ana anahtar PANEL_YANSIT: «1» dışındaki her değer (yok dahil) = sıraya alma ve işleme HİÇBİR ŞEY yapmaz. Varsayılan kapalı.
 *  - Kuyrukta/özelliklerde/günlükte kişisel veri YOKTUR: yalnız ref, deneme sayacı, sonraki deneme zamanı, sonuç kodu.
 *    Yük, gönderim anında defter satırından yeniden kurulur.
 *  - Yansıtma hatası başvuranın yanıtını ve kaydını ASLA etkilemez (ihtidaPaneleYansitKuyrugaAlGuvenli).
 */
var PANEL_YANSIT_ANAHTAR = "PANEL_YANSIT";
var PANEL_YANSIT_URL_OZELLIK = "PANEL_YANSIT_URL";
var PANEL_YANSIT_SIR_OZELLIK = "PANEL_YANSIT_SIR";
var PANEL_YANSIT_KUYRUK_ON_EK = "PANEL_YANSIT_KUYRUK_";
var PANEL_YANSIT_SONUC_ON_EK = "PANEL_YANSIT_SONUC_";
var PANEL_YANSIT_UYARI_ON_EK = "PANEL_YANSIT_UYARI_";
var PANEL_YANSIT_REF = /^IH-\d{4}-\d{4,6}$/;
var PANEL_YANSIT_DAKIKA = 60000;
var PANEL_YANSIT_ILK_BEKLEME_DK = 5;        // 5, 10, 20, 40 … dakika (üstel)
var PANEL_YANSIT_EN_UZUN_BEKLEME_DK = 360;  // üst sınır: 6 saat
var PANEL_YANSIT_KAPALI_BEKLEME_DK = 60;    // panel kayıt alımı kapalı (503): uzun bekleme, deneme sayılmaz
var PANEL_YANSIT_IMZA_DENEME = 5;           // 401: bu kadar denemeden sonra bırakılır + TEK uyarı
var PANEL_YANSIT_EN_COK_DENEME = 40;        // diğer geçici hatalar: ≈ 1 haftalık deneme, sonra bırakılır + uyarı
var PANEL_YANSIT_TUR_BUTCE_MS = 60000;      // bir dakikalık turda en çok bu kadar süre
var PANEL_YANSIT_PENCERE_GUN = 395;         // sözleşme: zaman damgası en çok 400 gün öncesi kabul edilir
/** shortcut: sözleşmenin enum'ları burada elle yazılı; panel enumlarına yeni değer eklenirse bu tablolar ve test fixture'ı güncellenir. */
var PANEL_YANSIT_DILLER = ["fr", "nl", "de", "en", "tr", "ar"];
var PANEL_YANSIT_UYRUK_ESLEME = [
  ["be", ["belcika", "belgique", "belgie", "belgien", "belgium", "belgian", "belge", "belgisch", "belg", "belcikali"]],
  ["fr", ["fransa", "france", "frankrijk", "frankreich", "french", "francais", "francaise", "franzosisch", "fransiz"]],
  ["nl", ["hollanda", "pays bas", "nederland", "niederlande", "netherlands", "dutch", "holland", "neerlandais", "nederlands", "hollandali"]],
  ["de", ["almanya", "allemagne", "deutschland", "duitsland", "germany", "german", "allemand", "deutsch", "alman"]],
  ["gb", ["ingiltere", "birlesik krallik", "united kingdom", "uk", "england", "great britain", "britain", "british", "royaume uni", "britannique", "verenigd koninkrijk", "vereinigtes konigreich", "ingiliz", "gb"]]
];

/* ---------- Saf eşleme (Node'da da sınanır) ---------- */

function ihtidaPanelSade(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/İ/g, "i")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
/** Uyruk metni → be|fr|nl|de|gb|diger. Tanınmayan metin SERBEST METİN olarak gitmez: «diger». */
function ihtidaPanelUyruk(metin) {
  var s = ihtidaPanelSade(metin);
  if (!s) return "diger";
  for (var i = 0; i < PANEL_YANSIT_UYRUK_ESLEME.length; i++) {
    if (PANEL_YANSIT_UYRUK_ESLEME[i][1].indexOf(s) !== -1) return PANEL_YANSIT_UYRUK_ESLEME[i][0];
  }
  return "diger";
}
function ihtidaPanelCinsiyet(m) {
  var s = String(m == null ? "" : m).trim().toLowerCase();
  return s === "kadin" ? "K" : s === "erkek" ? "E" : "";
}
/** Hücre → "YYYY-MM-DD" ya da "". Tarih nesnesi Brüksel gününe çevrilir (komut dosyası saat dilimi Europe/Brussels). */
function ihtidaPanelGun(v) {
  var g = "";
  if (v && typeof v === "object" && typeof v.getTime === "function") {
    if (isNaN(v.getTime())) return "";
    g = Utilities.formatDate(v, "Europe/Brussels", "yyyy-MM-dd");
  } else {
    var s = String(v == null ? "" : v).trim(), m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) g = m[1] + "-" + m[2] + "-" + m[3];
    else if ((m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s))) g = m[3] + "-" + m[2] + "-" + m[1];
  }
  var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(g);
  if (!p) return "";
  var y = Number(p[1]), a = Number(p[2]), d = Number(p[3]);
  if (y < 1900 || y > 2200 || a < 1 || a > 12 || d < 1 || d > new Date(Date.UTC(y, a, 0)).getUTCDate()) return "";
  return g;
}
/** Tam yaş: `dogum` (YYYY-MM-DD) ile `gun` (YYYY-MM-DD) arasında. */
function ihtidaPanelYas(dogum, gun) {
  var d = dogum.split("-").map(Number), b = gun.split("-").map(Number);
  return b[0] - d[0] - (b[1] < d[1] || (b[1] === d[1] && b[2] < d[2]) ? 1 : 0);
}
/** Sözleşmenin ad kuralı (functions/src/dosya-saf.ts tamAdAl): 2–120, NFC, harf/boşluk/nokta/kesme/tire. */
function ihtidaPanelAd(m) {
  var a = String(m == null ? "" : m).normalize("NFC").replace(/\s+/g, " ").trim(), n = Array.from(a).length;
  return n >= 2 && n <= 120 && /^\p{L}[\p{L}\p{M} .'’-]*$/u.test(a) ? a : "";
}
/** Sözleşmenin e-posta kuralı (functions/src/saf.ts epostaAl). */
function ihtidaPanelEposta(m) {
  var e = String(m == null ? "" : m).trim().toLowerCase();
  return e.length <= 254 && /^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,24}$/.test(e) ? e : "";
}

/**
 * Defter satırı (başlık → değer) → yük. Okunan alanlar YALNIZ aşağıdaki on üç sütundur; satırda başka ne olursa olsun yük'e girmez.
 * Dönüş: {ok:true, govde:{…}} ya da {ok:false, neden}. Nedenler (kişisel veri içermez):
 *  satir-yok · ref-gecersiz · kucuk (başvuru günü 18 yaş altı: panele HİÇ gönderilmez) · dogum-eksik · riza-yok · dil-gecersiz ·
 *  cinsiyet-gecersiz · toren-dili-gecersiz · cami-gecersiz · ad-gecersiz · eposta-gecersiz
 * `simdiMs`: «şimdi» (sınama için dışarıdan verilir).
 */
function ihtidaPanelGovdeKur(k, simdiMs) {
  if (!k) return { ok: false, neden: "satir-yok" };
  var ref = String(k["Referans"] == null ? "" : k["Referans"]).trim();
  if (!PANEL_YANSIT_REF.test(ref)) return { ok: false, neden: "ref-gecersiz" };
  var dogum = ihtidaPanelGun(k["Doğum tarihi"]);
  if (!dogum) return { ok: false, neden: "dogum-eksik" };
  var zamanDate = k["Zaman damgası"], zamanMs = zamanDate && typeof zamanDate.getTime === "function" ? zamanDate.getTime() : NaN;
  var basvuruGunu = isFinite(zamanMs) ? ihtidaPanelGun(zamanDate) : "";
  // 18 yaş altı: başvuru gününe göre (sonradan 18 olması geçmiş başvuruyu yetişkin yapmaz). Gün bilinmiyorsa bugüne göre (temkinli).
  var yas = ihtidaPanelYas(dogum, basvuruGunu || Utilities.formatDate(new Date(simdiMs), "Europe/Brussels", "yyyy-MM-dd"));
  if (yas < 18) return { ok: false, neden: "kucuk" };
  if (String(k["Açık rıza"]).trim() !== "Evet" || String(k["EK-10 rızası"]).trim() !== "Evet") return { ok: false, neden: "riza-yok" };
  var dil = String(k["Form dili"] == null ? "" : k["Form dili"]).trim().toLowerCase();
  if (PANEL_YANSIT_DILLER.indexOf(dil) === -1) return { ok: false, neden: "dil-gecersiz" };
  var cinsiyet = ihtidaPanelCinsiyet(k["Cinsiyet"]);
  if (!cinsiyet) return { ok: false, neden: "cinsiyet-gecersiz" };
  var toren = String(k["Tören dili"] == null ? "" : k["Tören dili"]).trim().toLowerCase();
  if (PANEL_YANSIT_DILLER.indexOf(toren) === -1) return { ok: false, neden: "toren-dili-gecersiz" };
  // Cami kimliği eski satırlarda boştur: form da bunu Marche sayar (ihtidaCamiCoz). Başka biçim: yalnız katalog kimliği biçimi.
  var cami = String(k["Cami kimliği"] == null ? "" : k["Cami kimliği"]).trim() || "ulucamii-marche";
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(cami)) return { ok: false, neden: "cami-gecersiz" };
  // EK-10 sürümü yoksa (V26 dönemi) eski rıza metni: «ek10-v1».
  var riza = String(k["EK-10 sürümü"] == null ? "" : k["EK-10 sürümü"]).replace(/^'/, "").trim() || "ek10-v1";
  if (!/^[A-Za-z0-9._-]{1,32}$/.test(riza)) return { ok: false, neden: "riza-yok" };
  var ad = ihtidaPanelAd(k["Adı Soyadı"]);
  if (!ad) return { ok: false, neden: "ad-gecersiz" };
  var eposta = ihtidaPanelEposta(k["E-posta"]);
  if (!eposta) return { ok: false, neden: "eposta-gecersiz" };

  var govde = { ref: ref };
  // Sözleşme: zaman [bugün-400 gün, bugün+1 gün] dışında ise ret; dışındaysa alan atlanır (panel kendi saatini yazar).
  if (isFinite(zamanMs) && zamanMs <= simdiMs + 86400000 && zamanMs >= simdiMs - PANEL_YANSIT_PENCERE_GUN * 86400000) govde.zaman = new Date(zamanMs).toISOString();
  govde.dil = dil; govde.cinsiyet = cinsiyet; govde.dogumTarihi = dogum;
  govde.uyruk = ihtidaPanelUyruk(k["Uyruk"]);
  govde.camiId = cami; govde.torenDili = toren; govde.rizaSurum = riza; govde.ad = ad; govde.eposta = eposta;
  return { ok: true, govde: govde };
}

/* ---------- İmza ---------- */

function ihtidaPanelHex(bayt) {
  return bayt.map(function (x) { return ("0" + (x & 255).toString(16)).slice(-2); }).join("");
}
/** İmzalanan metin (sözleşme): zaman[ms] LF nonce LF ham gövde. Çıktı: HMAC-SHA256 küçük harf hex. */
function ihtidaPanelImzaHesapla(sir, zaman, nonce, govdeMetni) {
  return ihtidaPanelHex(Utilities.computeHmacSha256Signature(zaman + "\n" + nonce + "\n" + govdeMetni, sir));
}
/** Her deneme için TAZE zaman + nonce. Nonce: 32 onaltılık karakter ([A-Za-z0-9_-]{16,64}). */
function ihtidaPanelIstekKur(govde, sir, simdiMs) {
  var metin = JSON.stringify(govde), zaman = String(simdiMs), nonce = String(Utilities.getUuid()).replace(/-/g, "");
  return {
    metin: metin,
    basliklar: { "x-ihtida-zaman": zaman, "x-ihtida-nonce": nonce, "x-ihtida-imza": ihtidaPanelImzaHesapla(sir, zaman, nonce, metin) }
  };
}

/* ---------- Durum (Script Properties) ---------- */

function ihtidaPanelSaat() { return Date.now(); }
function ihtidaPanelOzellikler() { return PropertiesService.getScriptProperties(); }
function ihtidaPanelAcikMi() {
  try { return ihtidaPanelOzellikler().getProperty(PANEL_YANSIT_ANAHTAR) === "1"; } catch (_) { return false; }
}
function ihtidaPanelSonucOku(ref) { return ihtidaPanelOzellikler().getProperty(PANEL_YANSIT_SONUC_ON_EK + ref) || ""; }
function ihtidaPanelSonucYaz(ref, sonuc) {
  var p = ihtidaPanelOzellikler();
  p.setProperty(PANEL_YANSIT_SONUC_ON_EK + ref, sonuc);
  p.deleteProperty(PANEL_YANSIT_KUYRUK_ON_EK + ref);
}
/** Son sonuç: bu ikisi KESİNDİR (geri doldurma bile dokunmaz). Diğerleri (atlandı, imza, 400, vazgeçildi) yeniden değerlendirilebilir. */
function ihtidaPanelSonucKesinMi(s) { return s === "ok" || s === "kapsam-disi"; }
function ihtidaPanelKuyrukOku(ref) {
  var h = ihtidaPanelOzellikler().getProperty(PANEL_YANSIT_KUYRUK_ON_EK + ref);
  if (!h) return null;
  try { var d = JSON.parse(h); return d && typeof d === "object" ? d : null; } catch (_) { return null; }
}
function ihtidaPanelKuyrukYaz(ref, d) { ihtidaPanelOzellikler().setProperty(PANEL_YANSIT_KUYRUK_ON_EK + ref, JSON.stringify({ d: d.d, i: d.i, s: d.s })); }

/** Başvuruyu yansıtma kuyruğuna alır; yalnız ref saklanır. Anahtar kapalıysa, ref geçersizse ya da sonuç kesinse hiçbir şey yapmaz. */
function ihtidaPaneleYansitKuyrugaAl(ref) {
  if (!ihtidaPanelAcikMi()) return false;
  ref = String(ref == null ? "" : ref);
  if (!PANEL_YANSIT_REF.test(ref)) return false;
  if (ihtidaPanelSonucKesinMi(ihtidaPanelSonucOku(ref))) return false;
  if (ihtidaPanelKuyrukOku(ref)) return false;
  ihtidaPanelKuyrukYaz(ref, { d: 0, i: 0, s: 0 });
  return true;
}
/** ihtidaPostIsleV2 kancası: yansıtma kodundaki HERHANGİ bir hata yutulur; başvuru yanıtı ve satır etkilenmez. Günlükte kişisel veri yok. */
function ihtidaPaneleYansitKuyrugaAlGuvenli(ref) {
  try { ihtidaPaneleYansitKuyrugaAl(ref); }
  catch (_) { try { console.error("panel-yansit-kuyruk-hatasi"); } catch (_2) { /* günlük de yazılamıyorsa sessiz */ } }
}

/** Bildirim: sonuç türü başına TEK uyarı (kişisel veri yok). İlk başarılı gönderimde bayrak silinir. */
function ihtidaPanelUyar(tur, konu, govde) {
  var p = ihtidaPanelOzellikler();
  if (p.getProperty(PANEL_YANSIT_UYARI_ON_EK + tur)) return;
  p.setProperty(PANEL_YANSIT_UYARI_ON_EK + tur, String(ihtidaPanelSaat()));
  try { epostaGonder({ to: AYAR2_IHTIDA.bildirimEposta, subject: konu, body: govde, kurum: "cami" }); }
  catch (_) { console.error("panel-yansit-uyari-gonderilemedi"); }
}

/* ---------- Defter satırı ---------- */

var PANEL_YANSIT_SUTUNLAR = ["Zaman damgası", "Referans", "Adı Soyadı", "Cinsiyet", "Doğum tarihi", "Uyruk", "E-posta", "Tören dili", "Form dili", "Açık rıza", "EK-10 rızası", "Cami kimliği", "EK-10 sürümü"];
/** Defterden YALNIZ gerekli sütunları okur (ham hücre değerleri; tarih nesnesi korunur). Satır yoksa null. */
function ihtidaPanelSatirOku(ref) {
  var sh = ihtidaV2SayfaGetir(), row = satirBulGenel(sh, ref, 2);
  if (row < 2) return null;
  var baslik = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], deger = sh.getRange(row, 1, 1, baslik.length).getValues()[0], k = {};
  PANEL_YANSIT_SUTUNLAR.forEach(function (ad) { var i = baslik.indexOf(ad); k[ad] = i >= 0 ? deger[i] : ""; });
  return k;
}

/* ---------- Gönderim ve durum makinesi ---------- */

/** Panelden dönen HTTP koduna göre kuyruk durumu. Dönüş: "ok" | "kapsam-disi" | "gecersiz" | "imza" | "imza-bekle" | "kapali" | "bekle" | "vazgec". */
function ihtidaPanelSonucIsle(ref, kod, simdiMs) {
  var q = ihtidaPanelKuyrukOku(ref) || { d: 0, i: 0, s: 0 };
  if (kod === 200) { ihtidaPanelSonucYaz(ref, "ok"); ihtidaPanelOzellikler().deleteProperty(PANEL_YANSIT_UYARI_ON_EK + "imza"); return "ok"; }
  if (kod === 422) { ihtidaPanelSonucYaz(ref, "kapsam-disi"); return "kapsam-disi"; }
  if (kod === 400) {
    ihtidaPanelSonucYaz(ref, "red-400");
    ihtidaPanelUyar("gecersiz", "İhtida paneline yansıtma: bir başvuru reddedildi (400)",
      "Panel bir başvurunun biçimini reddetti (HTTP 400); bu başvuru yeniden denenmeyecek.\nReferans: " + ref + "\nKişisel veri bu iletide yoktur. Defterdeki satırı ve docs/IHTIDA-PANEL-YANSITMA.md notunu kontrol edin.");
    return "gecersiz";
  }
  if (kod === 401) {
    q.d++; q.i++;
    if (q.i >= PANEL_YANSIT_IMZA_DENEME) {
      ihtidaPanelSonucYaz(ref, "imza-red");
      ihtidaPanelUyar("imza", "İhtida paneline yansıtma: imza reddediliyor (401)",
        "Panel, yansıtılan başvuru imzasını " + PANEL_YANSIT_IMZA_DENEME + " denemedir reddediyor (HTTP 401). Bu başvuru bırakıldı; sıradakiler de aynı hatayı alırsa her biri sırayla bırakılır (bu uyarı yalnız bir kez gelir).\n" +
        "Olası nedenler: PANEL_YANSIT_SIR panel sırrıyla aynı değil, sunucu saati kayması, uç adresi yanlış.\nKişisel veri bu iletide yoktur. Çözüm sonrası: ihtidaPaneleGeriDoldurGercek().");
      return "imza";
    }
    q.s = simdiMs + Math.min(PANEL_YANSIT_ILK_BEKLEME_DK * Math.pow(2, q.d - 1), PANEL_YANSIT_EN_UZUN_BEKLEME_DK) * PANEL_YANSIT_DAKIKA;
    ihtidaPanelKuyrukYaz(ref, q);
    return "imza-bekle";
  }
  if (kod === 503) { // kayıt alımı kapalı (DPIA kapısı): deneme sayılmaz, uzun bekleme
    q.s = simdiMs + PANEL_YANSIT_KAPALI_BEKLEME_DK * PANEL_YANSIT_DAKIKA;
    ihtidaPanelKuyrukYaz(ref, q);
    return "kapali";
  }
  // 429, 5xx, ağ hatası (kod 0) ve beklenmeyen kodlar: üstel geri çekilme, üst sınırlı
  q.d++;
  if (q.d >= PANEL_YANSIT_EN_COK_DENEME) {
    ihtidaPanelSonucYaz(ref, "vazgecildi");
    ihtidaPanelUyar("vazgecildi", "İhtida paneline yansıtma: bir başvuru bırakıldı",
      "Bir başvuru " + PANEL_YANSIT_EN_COK_DENEME + " denemede panele ulaşamadı ve bırakıldı.\nReferans: " + ref + "\nKişisel veri bu iletide yoktur. Panel hazır olunca ihtidaPaneleGeriDoldurGercek() ile yeniden sıraya alınır.");
    return "vazgec";
  }
  q.s = simdiMs + Math.min(PANEL_YANSIT_ILK_BEKLEME_DK * Math.pow(2, q.d - 1), PANEL_YANSIT_EN_UZUN_BEKLEME_DK) * PANEL_YANSIT_DAKIKA;
  ihtidaPanelKuyrukYaz(ref, q);
  return "bekle";
}

/** Tek başvuruyu dener. Dönüş: sonuç kodu (ihtidaPanelSonucIsle) ya da "atlandi-<neden>" / "ayar-yok". */
function ihtidaPanelBirini(ref, ayar) {
  var simdi = ihtidaPanelSaat(), k = null;
  try { k = ihtidaPanelSatirOku(ref); } catch (_) { console.error("panel-yansit-satir-okunamadi"); return ihtidaPanelSonucIsle(ref, 0, simdi); }
  var m = ihtidaPanelGovdeKur(k, simdi);
  if (!m.ok) { ihtidaPanelSonucYaz(ref, "atlandi-" + m.neden); return "atlandi-" + m.neden; }
  var istek = ihtidaPanelIstekKur(m.govde, ayar.sir, simdi), kod = 0;
  try {
    var yanit = UrlFetchApp.fetch(ayar.url, {
      method: "post", contentType: "application/json", payload: istek.metin, headers: istek.basliklar,
      muteHttpExceptions: true, followRedirects: false
    });
    kod = yanit.getResponseCode();
  } catch (_) { console.error("panel-yansit-ag-hatasi"); kod = 0; }
  return ihtidaPanelSonucIsle(ref, kod, simdi);
}
/** Sır ve adres Script Properties'ten; eksik/yanlış biçim = yapılandırılmamış (kuyruğa dokunulmaz). */
function ihtidaPanelAyar() {
  var p = ihtidaPanelOzellikler(), url = String(p.getProperty(PANEL_YANSIT_URL_OZELLIK) || "").trim(), sir = String(p.getProperty(PANEL_YANSIT_SIR_OZELLIK) || "");
  if (!/^https:\/\/[^\s/]+(\/\S*)?$/.test(url) || sir.length < 32) return null;
  return { url: url, sir: sir };
}

/**
 * Dakika tetikleyicisinin sonunda (ihtidaPaketKuyrukCalistir) çağrılır: PDF paket işinden SONRA, başvuru kilidi DIŞINDA,
 * kendi zaman bütçesiyle. Anahtar kapalıysa ya da ayar yoksa hiçbir şey yapmaz.
 * Dönüş: {denenen, ok, ...} sayaçları (kişisel veri yok).
 */
function ihtidaPaneleYansitKuyrukCalistir(baslangicMs) {
  var sayac = { denenen: 0, ok: 0, kapsamDisi: 0, bekle: 0, diger: 0 };
  if (!ihtidaPanelAcikMi()) return sayac;
  var ayar = ihtidaPanelAyar();
  if (!ayar) return sayac;
  var bas = ihtidaPanelSaat(), son = Math.min((baslangicMs || bas) + 300000, bas + PANEL_YANSIT_TUR_BUTCE_MS);
  var p = ihtidaPanelOzellikler().getProperties();
  var refs = Object.keys(p).filter(function (a) { return a.indexOf(PANEL_YANSIT_KUYRUK_ON_EK) === 0; }).map(function (a) { return a.slice(PANEL_YANSIT_KUYRUK_ON_EK.length); }).sort();
  for (var i = 0; i < refs.length && ihtidaPanelSaat() < son; i++) {
    var q = ihtidaPanelKuyrukOku(refs[i]);
    if (!q) { ihtidaPanelOzellikler().deleteProperty(PANEL_YANSIT_KUYRUK_ON_EK + refs[i]); continue; }
    if (q.s > ihtidaPanelSaat()) continue;
    sayac.denenen++;
    var s;
    try { s = ihtidaPanelBirini(refs[i], ayar); } catch (_) { console.error("panel-yansit-is-hatasi"); s = "diger"; }
    if (s === "imza" || s === "imza-bekle") { sayac.diger++; break; } // imza hatası hepsini etkiler: tur biter
    if (s === "ok") sayac.ok++; else if (s === "kapsam-disi") sayac.kapsamDisi++; else if (s === "bekle" || s === "kapali") sayac.bekle++; else sayac.diger++;
  }
  return sayac;
}

/* ---------- Eski satırlar için geri doldurma ---------- */

/**
 * Defterdeki eski ihtida satırlarını yansıtma kuyruğuna alır.
 *  - ihtidaPaneleGeriDoldur()            → KURU KOŞU (varsayılan): yalnız sayaçları döndürür, hiçbir şey yazmaz.
 *  - ihtidaPaneleGeriDoldur(false)       → GERÇEK: açıkça `false` verilmeli VE PANEL_YANSIT=1 olmalı; yoksa kuru koşu sayılır.
 * Sayaçlar: toplam, zatenTamam (ok / kapsam-disi), kuyrukta, eklenecek (gerçekte: eklenen), atlanacak (neden dökümüyle). Kişisel veri dönmez.
 */
function ihtidaPaneleGeriDoldur(kuru) {
  var gercek = kuru === false && ihtidaPanelAcikMi();
  var sh = ihtidaV2SayfaGetir(), son = sh.getLastRow(), sayac = { kip: gercek ? "gercek" : "kuru", toplam: 0, zatenTamam: 0, kuyrukta: 0, eklenecek: 0, atlanacak: 0, nedenler: {} };
  if (son < 2) return sayac;
  var baslik = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], veri = sh.getRange(2, 1, son - 1, baslik.length).getValues(), simdi = ihtidaPanelSaat();
  var idx = PANEL_YANSIT_SUTUNLAR.map(function (ad) { return baslik.indexOf(ad); });
  veri.forEach(function (satir) {
    var k = {};
    PANEL_YANSIT_SUTUNLAR.forEach(function (ad, j) { k[ad] = idx[j] >= 0 ? satir[idx[j]] : ""; });
    var ref = String(k["Referans"] == null ? "" : k["Referans"]).trim();
    sayac.toplam++;
    if (!PANEL_YANSIT_REF.test(ref)) { sayac.atlanacak++; sayac.nedenler["ref-gecersiz"] = (sayac.nedenler["ref-gecersiz"] || 0) + 1; return; }
    if (ihtidaPanelSonucKesinMi(ihtidaPanelSonucOku(ref))) { sayac.zatenTamam++; return; }
    if (ihtidaPanelKuyrukOku(ref)) { sayac.kuyrukta++; return; }
    var m = ihtidaPanelGovdeKur(k, simdi);
    if (!m.ok) { sayac.atlanacak++; sayac.nedenler[m.neden] = (sayac.nedenler[m.neden] || 0) + 1; return; }
    sayac.eklenecek++;
    if (gercek) { ihtidaPanelOzellikler().deleteProperty(PANEL_YANSIT_SONUC_ON_EK + ref); ihtidaPanelKuyrukYaz(ref, { d: 0, i: 0, s: 0 }); }
  });
  return sayac;
}
/** Düzenleyiciden çalıştırılabilsin diye (argüman verilemez): bilerek ayrı ve açık adlı. Anahtar kapalıysa kuru koşu olur. */
function ihtidaPaneleGeriDoldurGercek() { var s = ihtidaPaneleGeriDoldur(false); console.log(JSON.stringify(s)); return s; }
function ihtidaPaneleGeriDoldurKuru() { var s = ihtidaPaneleGeriDoldur(); console.log(JSON.stringify(s)); return s; }
