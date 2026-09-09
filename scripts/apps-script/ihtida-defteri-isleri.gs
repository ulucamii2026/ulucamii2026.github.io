/* Ulu Camii iç ihtida defteri — v28.
 * Bu, Diyanet'in DHYS kaydının yerine geçen bir resmî kütük değildir. Yalnız
 * yetkili panelde doğrulanmış süreçleri ve teslim takibini, özel Drive klasöründe
 * asgari veriyle tutar. Kimlik no, adres, iletişim, fotoğraf ve imza alınmaz. */
var IHTIDA_DEFTERI_SURUM = 1;
var IHTIDA_DEFTERI_DOSYA = "ihtida-defteri-kayitlar.json";
var IHTIDA_DEFTERI_DIRTY = "IHTIDA_DEFTERI_DIRTY";
var IHTIDA_DEFTERI_KURULU = "IHTIDA_DEFTERI_KURULU";
var IHTIDA_DEFTERI_DURUMLAR = ["bekliyor", "tamamlandi", "musavirlikte", "teslim-edildi", "iptal"];

function ihtidaDefteriKlasorGetir() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty("IHTIDA_DEFTERI_KLASOR_ID"), k = null;
  if (id) { try { k = DriveApp.getFolderById(id); } catch (_) { k = null; } }
  if (!k) {
    var ana = ihtidaKlasorGetir(), ad = "İhtida Defteri — Gizli", it = ana.getFoldersByName(ad);
    k = it.hasNext() ? it.next() : ana.createFolder(ad);
    p.setProperty("IHTIDA_DEFTERI_KLASOR_ID", k.getId());
  }
  return k;
}

function ihtidaDefteriDosyaBul(ad) {
  var it = ihtidaDefteriKlasorGetir().getFilesByName(ad);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed() && f.getName() === ad) return f; }
  return null;
}

function ihtidaDefteriMetaOku() {
  var f = ihtidaDefteriDosyaBul(IHTIDA_DEFTERI_DOSYA);
  if (!f) return { surum: IHTIDA_DEFTERI_SURUM, kayitlar: {} };
  try {
    var x = JSON.parse(f.getBlob().getDataAsString());
    if (!x || x.surum !== IHTIDA_DEFTERI_SURUM || !x.kayitlar || typeof x.kayitlar !== "object" || Array.isArray(x.kayitlar)) throw new Error("surum");
    var numaralar = {};
    Object.keys(x.kayitlar).forEach(function (ref) {
      var k = x.kayitlar[ref];
      if (!k || typeof k !== "object" || Array.isArray(k)) throw new Error("kayit");
      if (k.defterNo) {
        if (!/^UC-\d{4}-\d{4}$/.test(k.defterNo) || numaralar[k.defterNo]) throw new Error("numara");
        numaralar[k.defterNo] = true;
      }
    });
    return x;
  } catch (_) { throw new Error("ihtida-defteri-meta-bozuk"); }
}

function ihtidaDefteriMetaYaz(x) {
  var metin = JSON.stringify(x), f = ihtidaDefteriDosyaBul(IHTIDA_DEFTERI_DOSYA);
  if (f) { f.setContent(metin); return f; }
  return ihtidaDefteriKlasorGetir().createFile(Utilities.newBlob(metin, "application/json", IHTIDA_DEFTERI_DOSYA));
}

function ihtidaDefteriKirlet(ref) {
  PropertiesService.getScriptProperties().setProperty(IHTIDA_DEFTERI_DIRTY, JSON.stringify({ zaman: new Date().toISOString(), ref: String(ref || "") }));
}

function ihtidaDefteriTarih(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !tarihGecerliMi(v)) return false;
  return v <= Utilities.formatDate(new Date(), "Europe/Brussels", "yyyy-MM-dd");
}
function ihtidaDefteriMetin(v, azami) {
  v = String(v == null ? "" : v).trim(); return v.length <= azami ? v : null;
}
function ihtidaDefteriRef(ref) { return /^IH-\d{4}-\d{4}$/.test(String(ref || "")); }
function ihtidaDefteriDeger(k, ad) { return String(k[ad] == null ? "" : k[ad]).trim(); }
function ihtidaDefteriSentetik(k) { return /^TEST(?:\s|[-_])/i.test(ihtidaDefteriDeger(k, "Adı Soyadı")); }

function ihtidaDefteriSatirlari() {
  var sh = ihtidaV2SayfaGetir(), son = sh.getLastRow(), sutun = sh.getLastColumn();
  if (son < 2 || !sutun) return [];
  var baslik = sh.getRange(1, 1, 1, sutun).getValues()[0].map(String);
  var degerler = sh.getRange(2, 1, son - 1, sutun).getValues(), sonuc = [];
  for (var i = 0; i < degerler.length; i++) {
    var k = {}; for (var j = 0; j < baslik.length; j++) k[baslik[j]] = degerler[i][j];
    var ref = ihtidaDefteriDeger(k, "Referans"), camiId = ihtidaDefteriDeger(k, "Cami kimliği");
    // Cami seçimi öncesi eski satırlar Ulu Camii'nde alınmıştı; bilinen diğer camiler asla eklenmez.
    if (!ihtidaDefteriRef(ref) || (camiId && camiId !== "ulucamii-marche") || ihtidaDefteriSentetik(k)) continue;
    sonuc.push(k);
  }
  return sonuc;
}

function ihtidaDefteriModelOlustur() {
  var meta = ihtidaDefteriMetaOku(), kaynak = ihtidaDefteriSatirlari(), kayitlar = [];
  for (var i = 0; i < kaynak.length; i++) {
    var k = kaynak[i], ref = ihtidaDefteriDeger(k, "Referans"), e = meta.kayitlar[ref] || {};
    var tarih = k["Zaman damgası"] instanceof Date ? Utilities.formatDate(k["Zaman damgası"], "Europe/Brussels", "yyyy-MM-dd") : ihtidaDefteriDeger(k, "Zaman damgası").slice(0, 10);
    kayitlar.push({
      ref: ref, defterNo: e.defterNo || "", adSoyad: ihtidaDefteriDeger(k, "Adı Soyadı"), yeniIsim: ihtidaDefteriDeger(k, "Yeni isim tercihi") || ihtidaDefteriDeger(k, "Yeni isim (isteğe bağlı)"),
      basvuruTarihi: tarih, ihtidaTarihi: e.ihtidaTarihi || "", durum: e.durum || "bekliyor",
      camiAdi: ihtidaDefteriDeger(k, "Başvuru camisi") || "Ulu Camii", camiSehir: ihtidaDefteriDeger(k, "Cami şehri") || "Marche-en-Famenne",
      sahit1: e.sahit1 || ihtidaDefteriDeger(k, "Şahit 1"), sahit2: e.sahit2 || ihtidaDefteriDeger(k, "Şahit 2"),
      ek9No: e.ek9No || "", dhysNo: e.dhysNo || "", musavirlikGonderimTarihi: e.musavirlikGonderimTarihi || "", musavirlikDonusTarihi: e.musavirlikDonusTarihi || "",
      teslimTarihi: e.teslimTarihi || "", teslimYontemi: e.teslimYontemi || "", postaTakipNo: e.postaTakipNo || "", not: e.not || "", arsivPdfId: ihtidaDefteriArsivPdfId(k)
    });
  }
  kayitlar.sort(function (a, b) { return a.defterNo.localeCompare(b.defterNo) || a.ref.localeCompare(b.ref); });
  return { surum: IHTIDA_DEFTERI_SURUM, guncelleme: PropertiesService.getScriptProperties().getProperty("IHTIDA_DEFTERI_SON_URETIM") || "", kurum: { ad: "Ulu Camii", sehir: "Marche-en-Famenne" }, kayitlar: kayitlar };
}

function ihtidaDefteriSonrakiNo(meta) {
  var yil = Utilities.formatDate(new Date(), "Europe/Brussels", "yyyy"), max = 0, re = new RegExp("^UC-" + yil + "-(\\d{4})$"), gorulen = {};
  Object.keys(meta.kayitlar).forEach(function (ref) { var m = String(meta.kayitlar[ref].defterNo || "").match(re); if (m) { if (gorulen[m[0]]) throw new Error("defter-no-cakisma"); gorulen[m[0]] = true; max = Math.max(max, Number(m[1])); } });
  if (max >= 9999) throw new Error("defter-no-tukendi");
  return "UC-" + yil + "-" + ("0000" + (max + 1)).slice(-4);
}

function ihtidaDefteriArsivPdfId(k) {
  var x = ihtidaDefteriDeger(k, "Tam paket PDF"), m = x.match(/[A-Za-z0-9_-]{10,}/);
  return m ? m[0] : "";
}

function ihtidaDefteriKaynakHash(model, meta) {
  var m = meta || ihtidaDefteriMetaOku(), anahtarlar = Object.keys(m.kayitlar).sort();
  var s = model.kayitlar.map(function (k) { return JSON.stringify(k); }).join("\u001e") + "\u001d" + anahtarlar.map(function (a) { return a + "=" + JSON.stringify(m.kayitlar[a]); }).join("\u001e"), h = 2166136261;
  for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return String(h >>> 0);
}

function ihtidaDefteriGuncelle(v) {
  if (!panelYetkiTamam({ parameter: { anahtar: v && v.anahtar } })) return json({ ok: false, hata: "yetki" });
  var ref = String(v && v.ref || "").trim(), durum = String(v && v.durum || "").trim();
  if (!ihtidaDefteriRef(ref) || IHTIDA_DEFTERI_DURUMLAR.indexOf(durum) < 0) return json({ ok: false, hata: "defter-gecersiz" });
  var satir = ihtidaDefteriSatirlari().filter(function (k) { return ihtidaDefteriDeger(k, "Referans") === ref; })[0];
  if (!satir) return json({ ok: false, hata: "bulunamadi" });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var meta = ihtidaDefteriMetaOku(), onceki = meta.kayitlar[ref] || { durum: "bekliyor" }, g = {};
    var alanlar = { sahit1: 120, sahit2: 120, ek9No: 80, dhysNo: 80, musavirlikGonderimTarihi: 10, musavirlikDonusTarihi: 10, teslimTarihi: 10, teslimYontemi: 40, postaTakipNo: 100, not: 800 };
    Object.keys(alanlar).forEach(function (a) { if (Object.prototype.hasOwnProperty.call(v, a)) { var x = ihtidaDefteriMetin(v[a], alanlar[a]); if (x === null) throw new Error("alan-gecersiz"); g[a] = x; } });
    ["musavirlikGonderimTarihi", "musavirlikDonusTarihi", "teslimTarihi"].forEach(function (a) { if (g[a] && !ihtidaDefteriTarih(g[a])) throw new Error("tarih-gecersiz"); });
    var gercek = Object.prototype.hasOwnProperty.call(v, "ihtidaTarihi") ? ihtidaDefteriMetin(v.ihtidaTarihi, 10) : (onceki.ihtidaTarihi || "");
    if (gercek === null || (gercek && !ihtidaDefteriTarih(gercek))) throw new Error("tarih-gecersiz");
    if (onceki.defterNo && !gercek) throw new Error("ihtida-tarihi-zorunlu");
    if (durum === "tamamlandi" && !gercek) throw new Error("ihtida-tarihi-zorunlu");
    if (durum === "tamamlandi" && v.merasimDogrulandi !== true) throw new Error("merasim-dogrulamasi-zorunlu");
    if (["musavirlikte", "teslim-edildi"].indexOf(durum) >= 0 && (!onceki.defterNo || !gercek || onceki.merasimDogrulandi !== true)) throw new Error("tamamlanma-onayi-gerekli");
    if (durum === "tamamlandi" && !onceki.defterNo) onceki.defterNo = ihtidaDefteriSonrakiNo(meta);
    if (onceki.defterNo && durum === "bekliyor") throw new Error("defter-no-durum-korunur");
    var alan = function (ad) { return Object.prototype.hasOwnProperty.call(g, ad) ? g[ad] : (onceki[ad] || ""); };
    var gonderim = alan("musavirlikGonderimTarihi"), donus = alan("musavirlikDonusTarihi"), teslim = alan("teslimTarihi");
    if (durum === "musavirlikte" && !gonderim) throw new Error("gonderim-tarihi-zorunlu");
    if (durum === "teslim-edildi" && !teslim) throw new Error("teslim-tarihi-zorunlu");
    if ((gonderim && (!gercek || gercek > gonderim)) || (donus && (!gonderim || gonderim > donus)) || (teslim && (!gercek || gercek > teslim || (donus && donus > teslim) || (gonderim && gonderim > teslim)))) throw new Error("tarih-sirasi-gecersiz");
    if (["", "cami", "adres", "elden", "posta"].indexOf(alan("teslimYontemi")) < 0) throw new Error("teslim-yontemi-gecersiz");
    onceki.durum = durum; onceki.ihtidaTarihi = gercek;
    if (durum === "tamamlandi") onceki.merasimDogrulandi = true;
    Object.keys(g).forEach(function (a) { onceki[a] = g[a]; });
    meta.kayitlar[ref] = onceki; ihtidaDefteriMetaYaz(meta); ihtidaDefteriKirlet(ref);
    return json({ ok: true, surum: SURUM, kayit: ihtidaDefteriModelOlustur().kayitlar.filter(function (x) { return x.ref === ref; })[0] || null });
  } catch (hata) { return json({ ok: false, hata: String(hata.message || hata).replace(/[^a-z-]/g, "").slice(0, 50) || "defter-hatasi" }); }
  finally { lock.releaseLock(); }
}

async function ihtidaDefteriYenile(model) {
  if (typeof IhtidaDefteri === "undefined" || typeof IhtidaDefteri.pdfUret !== "function" || typeof IhtidaDefteri.docxUret !== "function") throw new Error("ihtida-defteri-renderer-yok");
  model = model || ihtidaDefteriModelOlustur();
  model.guncelleme = new Date().toISOString();
  var kaynak = ihtidaPaketKaynaklari(), pdf = await IhtidaDefteri.pdfUret(model, kaynak, PDFLib, fontkit), docx = IhtidaDefteri.docxUret(model);
  if (docx && typeof docx.then === "function") throw new Error("ihtida-defteri-docx-eszamansiz-olmali");
  var k = ihtidaDefteriKlasorGetir();
  ihtidaDefteriIkiliYaz(k, "ihtida-defteri.pdf", "application/pdf", pdf);
  ihtidaDefteriIkiliYaz(k, "ihtida-defteri.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx);
  PropertiesService.getScriptProperties().setProperty("IHTIDA_DEFTERI_KAYNAK_HASH", ihtidaDefteriKaynakHash(model));
  PropertiesService.getScriptProperties().setProperty("IHTIDA_DEFTERI_SON_URETIM", model.guncelleme);
  return model;
}

function ihtidaDefteriIkiliYaz(klasor, ad, tur, bayt) {
  if (!bayt || !bayt.length) throw new Error("ihtida-defteri-dosya-bos");
  var signed = Array.prototype.map.call(bayt, function (x) { return x > 127 ? x - 256 : x; });
  var f = ihtidaDefteriDosyaBul(ad), blob = Utilities.newBlob(signed, tur, ad);
  if (!f) return klasor.createFile(blob);
  // DriveApp ikili içerik değiştiremez. Aynı dosya kimliği için mevcut OAuth kapsamıyla Drive v3 medya güncellemesi kullanılır.
  var cevap = UrlFetchApp.fetch("https://www.googleapis.com/upload/drive/v3/files/" + encodeURIComponent(f.getId()) + "?uploadType=media", { method: "patch", contentType: tur, payload: blob.getBytes(), headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (cevap.getResponseCode() < 200 || cevap.getResponseCode() >= 300) throw new Error("ihtida-defteri-drive-yazma-hatasi");
  return f;
}

async function ihtidaDefteriKuyrukCalistir() {
  var lock = LockService.getScriptLock();
  if (lock.tryLock && !lock.tryLock(1000)) return;
  try {
    var model = ihtidaDefteriModelOlustur(), p = PropertiesService.getScriptProperties(), dirty = p.getProperty(IHTIDA_DEFTERI_DIRTY), hash = ihtidaDefteriKaynakHash(model);
    if (!dirty && p.getProperty("IHTIDA_DEFTERI_KAYNAK_HASH") === hash) return;
    await ihtidaDefteriYenile(model);
    if (p.getProperty(IHTIDA_DEFTERI_DIRTY) === dirty) p.deleteProperty(IHTIDA_DEFTERI_DIRTY);
  } catch (hata) { console.error("ihtida-defteri-yenile-hatasi"); }
  finally { lock.releaseLock(); }
}

function ihtidaDefteriKur() {
  var varMi = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "ihtidaDefteriKuyrukCalistir"; });
  if (!varMi) ScriptApp.newTrigger("ihtidaDefteriKuyrukCalistir").timeBased().everyMinutes(1).create();
  PropertiesService.getScriptProperties().setProperty(IHTIDA_DEFTERI_KURULU, "28");
}

function ihtidaDefteriGetIsle(e) {
  try {
    if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
    var format = String(e.parameter.format || "").toLowerCase(), model = ihtidaDefteriModelOlustur(), p = PropertiesService.getScriptProperties();
    var eski = !!p.getProperty(IHTIDA_DEFTERI_DIRTY) || !p.getProperty("IHTIDA_DEFTERI_SON_URETIM") || p.getProperty("IHTIDA_DEFTERI_KAYNAK_HASH") !== ihtidaDefteriKaynakHash(model);
    if (!format) return json({ ok: true, surum: SURUM, defter: model, durum: eski ? "guncelleniyor" : "guncel" });
    if (["pdf", "docx"].indexOf(format) < 0) return json({ ok: false, hata: "format-gecersiz" });
    var f = ihtidaDefteriDosyaBul("ihtida-defteri." + format);
    if (!f || eski) return json({ ok: false, hata: f ? "guncelleniyor" : "dosya-hazir-degil" });
    var b = f.getBlob().getBytes(), mime = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; return json({ ok: true, surum: SURUM, ad: f.getName(), mime: mime, base64: Utilities.base64Encode(b) });
  } catch (_) { return json({ ok: false, hata: "defter-okuma-hatasi" }); }
}
