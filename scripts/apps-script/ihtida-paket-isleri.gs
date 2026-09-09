/* v25: Özel Drive arşivi + kalıcı iş kuyruğu. Bu dosya derlemede ana koda eklenir.
 * Alıcı/ek/şablon istemciden alınmaz. Başvuran e-postası yalnız kayıt defterinden okunur.
 * Ağ cevabı belirsizse ikinci sağlayıcıya düşülmez: çifte gönderim yerine kontrol durumu.
 */
var IHTIDA_PAKET_ALICILARI = ["info@ulucamii.be", "imam@ulucamii.be"];
var IHTIDA_PAKET_ON_EK = "IHTIDA_PAKET_IS_";

function ihtidaPaketKayit(ref) {
  if (!/^IH-\d{4}-\d{4}$/.test(ref)) throw new Error("ref-gecersiz");
  var sh = ihtidaV2SayfaGetir(), row = satirBulGenel(sh, ref, 2);
  if (row < 2) throw new Error("basvuru-bulunamadi");
  var baslik = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var deger = sh.getRange(row, 1, 1, baslik.length).getValues()[0], k = {};
  baslik.forEach(function (b, i) { k[b] = deger[i] instanceof Date ? Utilities.formatDate(deger[i], "Europe/Brussels", "dd.MM.yyyy") : String(deger[i] == null ? "" : deger[i]); });
  return { sh: sh, row: row, baslik: baslik, kayit: k };
}
function ihtidaPaketHucre(ref, baslik, deger) {
  var r = ihtidaPaketKayit(ref), i = r.baslik.indexOf(baslik);
  if (i >= 0) r.sh.getRange(r.row, i + 1).setValue(hucreGuvenli(deger));
}
function ihtidaPaketIsDosyasi(ref) {
  if (!/^IH-\d{4}-\d{4}$/.test(ref)) throw new Error("ref-gecersiz");
  var it = ihtidaKlasorGetir().getFilesByName(ref + " - paket-islem.json");
  if (!it.hasNext()) return null;
  var f = it.next();
  if (f.isTrashed()) return null;
  return f;
}
function ihtidaPaketIsiOku(ref) {
  var f = ihtidaPaketIsDosyasi(ref);
  return f ? JSON.parse(f.getBlob().getDataAsString("UTF-8")) : null;
}
function ihtidaPaketIsiYaz(is) {
  is.guncelleme = new Date().toISOString();
  var f = ihtidaPaketIsDosyasi(is.ref), metin = JSON.stringify(is);
  if (f) f.setContent(metin);
  else f = ihtidaKlasorGetir().createFile(Utilities.newBlob(metin, "application/json", is.ref + " - paket-islem.json"));
  PropertiesService.getScriptProperties().setProperty(IHTIDA_PAKET_ON_EK + is.ref, f.getId());
}
function ihtidaPaketKuyrugaAl(ref) {
  var onceki = ihtidaPaketIsiOku(ref);
  if (onceki) return onceki;
  var is = { ref: ref, revizyon: 1, asama: "on-basvuru", durum: "sirada", deneme: 0, alicilar: [], olusturma: new Date().toISOString() };
  ihtidaPaketIsiYaz(is);
  ihtidaPaketHucre(ref, "Paket durumu", "Otomatik PDF hazırlanıyor");
  return is;
}
function ihtidaPaketOzet(is) {
  if (!is) return null;
  return { ref: is.ref, revizyon: is.revizyon, asama: is.asama, durum: is.durum, hata: is.hata || "", pdfId: is.pdfId || "", sha256: is.sha256 || "", sayfa: is.sayfa || 0,
    alicilar: (is.alicilar || []).map(function (a) { return { eposta: a.eposta, durum: a.durum, messageId: a.messageId || "", zaman: a.zaman || "" }; }) };
}
function ihtidaPaketDurumIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  try { return json({ ok: true, surum: SURUM, paket: ihtidaPaketOzet(ihtidaPaketIsiOku(String(e.parameter.ref || ""))) }); }
  catch (_) { return json({ ok: false, hata: "paket-durum-hatasi" }); }
}

/** Bir kez editörden çalıştırılır; yalnız bu işin dakikalık tetikleyicisini kurar. */
function ihtidaPaketKur() {
  var varMi = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "ihtidaPaketKuyrukCalistir"; });
  if (!varMi) ScriptApp.newTrigger("ihtidaPaketKuyrukCalistir").timeBased().everyMinutes(1).create();
  PropertiesService.getScriptProperties().setProperty("IHTIDA_PAKET_KURULU", "25");
  console.log("İhtida PDF kuyruğu kuruldu.");
}
async function ihtidaPaketKuyrukCalistir() {
  var p = PropertiesService.getScriptProperties().getProperties();
  var refs = Object.keys(p).filter(function (k) { return k.indexOf(IHTIDA_PAKET_ON_EK) === 0; }).map(function (k) { return k.slice(IHTIDA_PAKET_ON_EK.length); });
  var bas = Date.now();
  for (var i = 0; i < refs.length && Date.now() - bas < 240000; i++) {
    try { await ihtidaPaketIsle(refs[i]); }
    catch (_) {
      console.error("paket-is-kaydi-okunamadi " + refs[i]);
      try { ihtidaPaketHucre(refs[i], "Paket durumu", "Paket iş kaydı okunamadı; yönetici kontrolü gerekiyor."); } catch (_) {}
    }
  }
}
function ihtidaPaketKaynaklari() {
  var kaynak = {};
  Object.keys(IHTIDA_PDF_KAYNAKLARI).forEach(function (ad) { kaynak[ad] = new Uint8Array(Utilities.base64Decode(IHTIDA_PDF_KAYNAKLARI[ad])); });
  return kaynak;
}
function ihtidaPaketSha(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (x) { return ("0" + (x & 255).toString(16)).slice(-2); }).join("");
}
function ihtidaPaketGuvenliDosya(is) {
  var f = DriveApp.getFileById(is.pdfId), parent = f.getParents(), izin = false;
  while (parent.hasNext()) if (parent.next().getId() === ihtidaKlasorGetir().getId()) izin = true;
  if (!izin || f.isTrashed() || f.getMimeType() !== "application/pdf") throw new Error("paket-arsiv-gecersiz");
  if (ihtidaPaketSha(f.getBlob().getBytes()) !== is.sha256) throw new Error("paket-arsiv-degismis");
  return f;
}
async function ihtidaPaketIsle(ref) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  var is;
  try {
    is = ihtidaPaketIsiOku(ref);
    if (!is || is.durum === "tamam" || is.kilit > Date.now() || is.sonraki > Date.now()) return;
    if ((!is.pdfId && is.deneme >= 3) || (is.pdfId && is.durum === "hata")) return;
    is.kilit = Date.now() + 10 * 60 * 1000;
    ihtidaPaketIsiYaz(is);
  } finally { lock.releaseLock(); }
  try {
    var k = ihtidaPaketKayit(ref).kayit;
    if (!is.pdfId) {
      is.deneme++; is.durum = "hazirlaniyor"; ihtidaPaketIsiYaz(is);
      var hatalar = [], g = ihtidaGorselleriOku(ihtidaKlasorGetir(), ref, hatalar);
      if (hatalar.length) throw new Error("gorsel-okunamadi");
      var bytes = await IhtidaPdf.uret(k, g, is.duzenleme || null, ihtidaPaketKaynaklari(), PDFLib, fontkit);
      var pdf = await PDFLib.PDFDocument.load(bytes, { parseSpeed: Infinity });
      if (pdf.getPageCount() < 6) throw new Error("paket-sayfa-eksik");
      // GAS Byte[] işaretli byte bekler. Arşiv ve ek aynı blob'dur.
      var signed = Array.from(bytes, function (n) { return n > 127 ? n - 256 : n; });
      var blob = Utilities.newBlob(signed, "application/pdf", ref + " - Ihtida Belge Paketi - r" + is.revizyon + ".pdf");
      if (blob.getBytes().length > 14 * 1024 * 1024) throw new Error("paket-eposta-icin-buyuk");
      var f = ihtidaKlasorGetir().createFile(blob);
      is.pdfId = f.getId(); is.sha256 = ihtidaPaketSha(blob.getBytes()); is.sayfa = pdf.getPageCount();
      is.durum = "hazir"; is.hata = "";
      // Şahit imzalarını iş dosyasında çoğaltma; yalnız özel son PDF'de kalır.
      delete is.duzenleme;
      var alicilar = IHTIDA_PAKET_ALICILARI.concat([String(k["E-posta"]).trim().toLowerCase()]);
      is.alicilar = alicilar.filter(function (a, i) { return alicilar.indexOf(a) === i; }).map(function (a) { return { eposta: a, durum: "sirada", anahtar: Utilities.getUuid(), deneme: 0 }; });
      ihtidaPaketIsiYaz(is);
      ihtidaPaketHucre(ref, "Tam paket PDF", f.getUrl());
      ihtidaPaketHucre(ref, "Paket durumu", is.asama === "on-basvuru" ? "Ön başvuru paketi hazır · tören teyidi bekliyor" : "Müşavirlik paketi hazır");
    }
    var dosya = ihtidaPaketGuvenliDosya(is);
    for (var i = 0; i < is.alicilar.length; i++) {
      var a = is.alicilar[i];
      if (a.durum === "gonderiliyor") a.durum = "belirsiz";
      if (a.durum === "sirada" || (a.durum === "gonderim-hatasi" && a.deneme < 3)) {
        a.durum = "gonderiliyor"; a.deneme++; a.zaman = new Date().toISOString(); ihtidaPaketIsiYaz(is);
        ihtidaPaketEpostaGonder(is, a, dosya.getBlob(), k);
        ihtidaPaketIsiYaz(is);
      }
      if (a.durum === "belirsiz" && !a.messageId) ihtidaPaketBelirsizYokla(is, a);
      if (a.messageId && a.durum !== "teslim-edildi" && a.durum !== "teslim-edilemedi") ihtidaPaketTeslimYokla(a);
    }
    is.durum = is.alicilar.every(function (a) { return a.durum === "teslim-edildi"; }) ? "tamam" : "teslim-takibi";
    ihtidaPaketHucre(ref, "E-posta durumu", is.alicilar.map(function (a) { return a.eposta + ": " + ihtidaPaketDurumMetni(a.durum); }).join(" | "));
  } catch (hata) {
    is.durum = "hata"; is.hata = "PDF veya arşiv işlemi tamamlanamadı; yönetici kontrolü gerekiyor.";
    ihtidaPaketHucre(ref, "Paket durumu", is.hata);
    console.error("ihtida-paket-hatasi " + ref); // Görsel, kimlik, e-posta veya sağlayıcı cevabı loglanmaz.
  } finally {
    is.kilit = 0; is.sonraki = Date.now() + 5 * 60 * 1000; ihtidaPaketIsiYaz(is);
    if (is.durum === "tamam") PropertiesService.getScriptProperties().deleteProperty(IHTIDA_PAKET_ON_EK + ref);
  }
}
function ihtidaPaketDurumMetni(d) {
  return ({ sirada: "Sırada", gonderiliyor: "Gönderiliyor", "saglayici-kabul": "Gönderildi · teslim teyidi bekleniyor", "teslim-edildi": "Alıcı sunucusuna teslim edildi", "teslim-edilemedi": "Teslim edilemedi", "gonderim-hatasi": "Gönderim başarısız", belirsiz: "Gönderim sonucu belirsiz · kontrol gerekli" })[d] || d;
}
function ihtidaPaketEpostaGonder(is, a, blob, k) {
  var key = brevoAnahtari();
  if (!key || !epostaGecerli(a.eposta)) { a.durum = "gonderim-hatasi"; return; }
  var on = is.asama === "on-basvuru";
  var konu = (on ? "İhtida ön başvuru belge paketi / Dossier de pré-demande" : "İhtida belge paketi / Dossier de conversion") + " — " + is.ref + " — r" + is.revizyon;
  var metin = [
    "Esselâmü aleyküm / Bonjour / Hello,", "",
    "EK-9, EK-10, dilekçe ve kimlik belgesi örneği tek PDF olarak ektedir. Adresinizi ve diğer bilgilerinizi kontrol ediniz.",
    "Le dossier PDF joint contient l’EK-9, l’EK-10, la demande et la copie du document d’identité. Merci de vérifier votre adresse et vos informations.",
    "The attached PDF contains EK-9, EK-10, the request letter and a copy of your identity document. Please check your address and details.", "",
    on ? "Bu ön başvuru nüshasıdır. Tören tarihi ve şahit teyidi sonrası son nüsha hazırlanır; resmî belge müşavirlik imzasıyla tamamlanır." : "Bu nüsha müşavirlik imzasına hazırlanmıştır. Yetkilinin ıslak imzası basılı belgede alınacaktır.",
    on ? "Il s’agit d’une pré-demande. Le dossier sera finalisé après confirmation de la cérémonie et des témoins, puis signé par le Conseiller." : "Ce dossier est préparé pour la signature manuscrite du Conseiller sur papier.",
    on ? "This is a pre-application copy. The ceremony and witnesses must be confirmed before the final copy is prepared for the Counsellor’s signature." : "This copy is prepared for the Counsellor’s handwritten signature on paper.",
    k["Elektronik beyan"] && k["EK-10 rızası"] === "Evet" ? "" : "İmza gereken alanları kontrol ediniz / Vérifiez les espaces de signature / Please check the signature fields.",
    "", "Referans / Référence / Reference: " + is.ref,
    "Marche-en-Famenne Ulu Camii", "info@ulucamii.be · imam@ulucamii.be"
  ].filter(function (x) { return x !== null; }).join("\n");
  var payload = { sender: BREVO_GONDEREN, to: [{ email: a.eposta }], replyTo: { email: "imam@ulucamii.be" }, subject: konu, textContent: metin,
    headers: { idempotencyKey: a.anahtar }, tags: [is.ref + "-r" + is.revizyon], attachment: [{ name: blob.getName(), content: Utilities.base64Encode(blob.getBytes()) }] };
  try {
    var r = UrlFetchApp.fetch(BREVO_UC, { method: "post", contentType: "application/json", headers: { "api-key": key, accept: "application/json" }, payload: JSON.stringify(payload), muteHttpExceptions: true });
    var code = r.getResponseCode();
    if (code >= 200 && code < 300) {
      var answer = JSON.parse(r.getContentText());
      a.messageId = answer.messageId || "";
      a.durum = a.messageId ? "saglayici-kabul" : "belirsiz";
    } else a.durum = (code >= 500 || String(r.getContentText()).indexOf("duplicate_parameter") >= 0) ? "belirsiz" : "gonderim-hatasi";
  } catch (_) { a.durum = "belirsiz"; }
}
function ihtidaPaketBelirsizYokla(is, a) {
  try {
    var tag = is.ref + "-r" + is.revizyon;
    var url = "https://api.brevo.com/v3/smtp/statistics/events?limit=100&tags=" + encodeURIComponent(JSON.stringify([tag])) + "&email=" + encodeURIComponent(a.eposta);
    var r = UrlFetchApp.fetch(url, { headers: { "api-key": brevoAnahtari(), accept: "application/json" }, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return;
    var events = (JSON.parse(r.getContentText()).events || []).filter(function (e) { return e.tag === tag && String(e.email).toLowerCase() === a.eposta.toLowerCase() && e.messageId; });
    var ids = events.map(function (e) { return e.messageId; }).filter(function (id, i, all) { return all.indexOf(id) === i; });
    if (ids.length === 1) { a.messageId = ids[0]; a.durum = "saglayici-kabul"; }
  } catch (_) { /* Sonuç belirsiz kalır; ikinci kez e-posta gönderilmez. */ }
}
function ihtidaPaketTeslimYokla(a) {
  try {
    var r = UrlFetchApp.fetch("https://api.brevo.com/v3/smtp/statistics/events?limit=100&messageId=" + encodeURIComponent(a.messageId), { headers: { "api-key": brevoAnahtari(), accept: "application/json" }, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return;
    var events = JSON.parse(r.getContentText()).events || [];
    events = events.filter(function (e) { return e.messageId === a.messageId && String(e.email).toLowerCase() === a.eposta.toLowerCase(); });
    if (events.some(function (e) { return ["hardBounce", "hard_bounce", "blocked", "invalid", "error"].indexOf(e.event) >= 0; })) a.durum = "teslim-edilemedi";
    else if (events.some(function (e) { return e.event === "delivered"; })) a.durum = "teslim-edildi";
  } catch (_) { /* Gönderildi bilgisini teslim edildiye çevirmeyiz; sonra tekrar yoklanır. */ }
}
function ihtidaPaketOnayDogrula(d) {
  if (!d || !tarihGecerliMi(d.ihtidaTarihi) || !tarihGecerliMi(d.beyanTarihi)) return false;
  if (d.ihtidaTarihi > Utilities.formatDate(new Date(), "Europe/Brussels", "yyyy-MM-dd")) return false;
  if (!metinDolu(d.adSoyad) || !uzunlukTamam(d.adSoyad, 120) || !metinDolu(d.adres) || !uzunlukTamam(d.adres, 400) || !uzunlukTamam(d.ihtidaSebebi, 600)) return false;
  if (["kimlik", "pasaport"].indexOf(d.belgeTuru) < 0 || !Array.isArray(d.sahitler) || d.sahitler.length !== 2) return false;
  return d.sahitler.every(function (s) { return metinDolu(s.ad) && uzunlukTamam(s.ad, 120) && (!s.imza || gorselGecerli(s.imza, 1)); });
}
function ihtidaPaketOnayIsle(v) {
  if (!panelYetkiTamam({ parameter: { anahtar: v.anahtar } })) return json({ ok: false, hata: "yetki" });
  if (!ihtidaPaketOnayDogrula(v.hazirlik) || !temizAnahtar(v.islemAnahtari)) return json({ ok: false, hata: "paket-onay-gecersiz" });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var is = ihtidaPaketIsiOku(v.ref);
    if (is && is.islemAnahtari === v.islemAnahtari) return json({ ok: true, paket: ihtidaPaketOzet(is) });
    if (is && is.kilit > Date.now()) return json({ ok: false, hata: "paket-isleniyor" });
    ihtidaPaketKayit(v.ref); // Başvuru mevcut olmalı.
    is = { ref: v.ref, revizyon: (is ? is.revizyon : 0) + 1, asama: "musavirlik", durum: "sirada", deneme: 0, duzenleme: v.hazirlik, islemAnahtari: v.islemAnahtari, alicilar: [] };
    ihtidaPaketIsiYaz(is);
    ihtidaPaketHucre(v.ref, "Paket durumu", "Onaylanan son nüsha hazırlanıyor");
    ihtidaPaketHucre(v.ref, "Tam paket PDF", "");
    ihtidaPaketHucre(v.ref, "E-posta durumu", "Sırada");
  } catch (_) { return json({ ok: false, hata: "paket-onay-hatasi" }); }
  finally { lock.releaseLock(); }
  return json({ ok: true, paket: ihtidaPaketOzet(is) });
}
function ihtidaPaketTekrarIsle(v) {
  if (!panelYetkiTamam({ parameter: { anahtar: v.anahtar } })) return json({ ok: false, hata: "yetki" });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var is = ihtidaPaketIsiOku(v.ref);
    if (!is) return json({ ok: false, hata: "paket-yok" });
    if (is.kilit > Date.now()) return json({ ok: false, hata: "paket-isleniyor" });
    is.sonraki = 0; is.deneme = 0; if (is.durum === "hata") is.durum = "sirada";
    is.alicilar.forEach(function (a) { if (a.durum === "gonderim-hatasi") { a.deneme = 0; a.durum = "sirada"; } });
    ihtidaPaketIsiYaz(is);
  } finally { lock.releaseLock(); }
  return json({ ok: true, paket: ihtidaPaketOzet(is) });
}
