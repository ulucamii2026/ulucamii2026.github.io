/* Kurs kayıt defteri → veli e-posta listesi. Google sunucusunda beş dakikada bir.
 * Yalnız dernek hesabı; özel anahtar yok. Şifre, kitap yanıtı ve öğretmen verileri korunur.
 * Bu görev listeyi günceller. İleti veya portal giriş bağlantısı üretmez.
 */
var VELI_PORTAL_PROJE = "ulucamii-portal";
var VELI_PORTAL_DOKUMAN = "projects/" + VELI_PORTAL_PROJE + "/databases/(default)/documents";
var VELI_PORTAL_API = "https://firestore.googleapis.com/v1/" + VELI_PORTAL_DOKUMAN;
var VELI_PORTAL_ISLENEN = "VELI_PORTAL_AKTARILAN_";
var VELI_PORTAL_SURUM = "20260909-1";

function veliPortalMetin(v) { return String(v == null ? "" : v).trim(); }
function veliPortalBuyuk(v) { return veliPortalMetin(v).replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase(); }
function veliPortalAd(v) {
  return veliPortalMetin(v).split(/\s+/).filter(Boolean).map(function (w) {
    var k = w === veliPortalBuyuk(w) ? w.replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase() : w;
    return k.charAt(0).replace("i", "İ").toUpperCase() + k.slice(1);
  }).join(" ");
}
function veliPortalKayitlari(satirlar, ayar) {
  ayar = ayar || {}; var guncel = {}, atlanan = new Set(["UC-2026-0003"].concat(ayar.atlanan || [])), sayi = 0;
  satirlar.forEach(function (s) {
    var ref = veliPortalMetin(s.Referans), kok = ref.replace(/-R\d+$/i, ""), m = ref.match(/-R(\d+)$/i), surum = m ? Number(m[1]) : 1;
    if (!/^UC-\d{4}-\d{4}$/.test(kok) || atlanan.has(kok) || veliPortalBuyuk(s["Öğrenci adı"] + " " + s["Öğrenci soyadı"]).indexOf("TESTOGLU") >= 0) { sayi++; return; }
    if (!guncel[kok] || surum > guncel[kok].surum) guncel[kok] = { satir: s, surum: surum, ref: ref };
  });
  var kayitlar = [];
  Object.keys(guncel).sort().forEach(function (ref) {
    var s = guncel[ref].satir, ep = veliPortalMetin(s["Veli e-posta"]).toLowerCase();
    ep = veliPortalMetin((ayar.epostaDuzelt || {})[ep] || ep).toLowerCase();
    if (!/^[^\s@/\\]+@[^\s@/\\]+\.[^\s@/\\]+$/.test(ep) || ep.length > 254) { sayi++; return; }
    kayitlar.push({ ref: ref, kayitRef: guncel[ref].ref, ad: veliPortalAd(s["Öğrenci adı"]), soyad: veliPortalBuyuk(s["Öğrenci soyadı"]), veliAd: veliPortalAd(s["Veli adı soyadı"]), eposta: ep, iletisimDili: veliPortalMetin(s["İletişim dili"]).toLowerCase() });
  });
  return { kayitlar: kayitlar, atlanan: sayi };
}
function veliPortalDeger(v) {
  if (Array.isArray(v)) return { arrayValue: { values: v.map(veliPortalDeger) } };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return { integerValue: String(v) };
  if (v && typeof v === "object") { var f = {}; Object.keys(v).forEach(function (k) { f[k] = veliPortalDeger(v[k]); }); return { mapValue: { fields: f } }; }
  return { stringValue: String(v == null ? "" : v) };
}
function veliPortalDegerCoz(v) {
  if (!v) return null;
  if (Object.prototype.hasOwnProperty.call(v, "stringValue")) return v.stringValue;
  if (Object.prototype.hasOwnProperty.call(v, "booleanValue")) return v.booleanValue;
  if (v.integerValue != null) return Number(v.integerValue);
  if (v.timestampValue) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(veliPortalDegerCoz);
  if (v.mapValue) { var o = {}; Object.keys(v.mapValue.fields || {}).forEach(function (k) { o[k] = veliPortalDegerCoz(v.mapValue.fields[k]); }); return o; }
  return null;
}
function veliPortalYazilari(kayitlar, belgeler) {
  var aileler = {}, writes = [], islenen = [], bekleyen = 0, simdi = new Date().toISOString();
  kayitlar.forEach(function (k) { (aileler[k.eposta] || (aileler[k.eposta] = [])).push(k); });
  function yaz(anahtar, alanlar, diziAdi, eklenecek) {
    var eski = belgeler[anahtar], data = eski ? eski.data : {}, fields = {}, transforms = [];
    Object.keys(alanlar).forEach(function (k) { if (JSON.stringify(data[k]) !== JSON.stringify(alanlar[k])) fields[k] = veliPortalDeger(alanlar[k]); });
    var eksik = eklenecek.filter(function (x) { return (data[diziAdi] || []).indexOf(x) < 0; });
    if (eksik.length) transforms.push({ fieldPath: diziAdi, appendMissingElements: { values: eksik.map(veliPortalDeger) } });
    if (!Object.keys(fields).length && !transforms.length) return;
    fields.guncelleme = veliPortalDeger(simdi);
    if (eski && !eski.updateTime) throw new Error("portal-belge-surumu-yok");
    writes.push({ update: { name: VELI_PORTAL_DOKUMAN + "/" + anahtar, fields: fields }, updateMask: { fieldPaths: Object.keys(fields) }, updateTransforms: transforms, currentDocument: eski ? { updateTime: eski.updateTime } : { exists: false } });
  }
  Object.keys(aileler).sort().forEach(function (ep) {
    var grup = aileler[ep], onceki = belgeler["aileler/" + ep], aile = onceki ? onceki.data : {};
    var diller = Array.from(new Set(grup.map(function (k) { return k.iletisimDili; }).filter(Boolean)));
    var dil = diller.length === 1 ? diller[0] : diller.length === 0 ? (aile.iletisimDili || aile.dil || "") : "";
    if (["tr", "fr"].indexOf(dil) < 0 || grup.some(function (k) { return !k.ad || !k.soyad; })) { bekleyen += grup.length; return; }
    grup.forEach(function (k) {
      var o = belgeler["ogrenciler/" + k.ref], eski = o ? o.data : {};
      var data = { kayitRef: k.kayitRef, iletisimDili: dil };
      if (!eski.adSabit) { data.ad = k.ad; data.soyad = k.soyad; }
      if (!eski.dil) data.dil = dil;
      if (!o) { data.durum = "aktif"; data.grup = ""; }
      yaz("ogrenciler/" + k.ref, data, "veliler", [ep]);
      islenen.push(k.ref);
    });
    var data = { iletisimDili: dil };
    if (diller.length) data.iletisimDiliKaynagi = "kayit-formu";
    if (!aile.dil) data.dil = dil;
    if (!aile.adSoyad && grup[0].veliAd) data.adSoyad = grup[0].veliAd;
    yaz("aileler/" + ep, data, "ogrenciler", grup.map(function (k) { return k.ref; }));
  });
  return { writes: writes, islenen: islenen, bekleyen: bekleyen };
}
function veliPortalKimlikDogrula() {
  if (Session.getEffectiveUser().getEmail().toLowerCase() !== "ulucamii2026@gmail.com") throw new Error("portal-dernek-hesabi-gerekli");
}
function veliPortalHttp(yol, govde, yokOlabilir) {
  var options = { method: govde ? "post" : "get", contentType: "application/json", headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
  if (govde) options.payload = JSON.stringify(govde);
  var r = UrlFetchApp.fetch(VELI_PORTAL_API + yol, options);
  var kod = r.getResponseCode();
  if (kod === 404 && yokOlabilir) return null;
  if (kod < 200 || kod >= 300) {
    var neden = "";
    try { var hata = JSON.parse(r.getContentText()).error || {}; var detay = (hata.details || []).filter(function (x) { return x.reason; })[0];
      if (detay && /^[A-Z_]+$/.test(detay.reason)) neden = "-" + detay.reason.toLowerCase().replace(/_/g, "-");
    } catch (ayristirmaHatasi) { /* Yanıt gövdesi ve özel veriler günlüğe taşınmaz. */ }
    throw new Error("portal-http-" + kod + neden);
  }
  return JSON.parse(r.getContentText());
}
function veliPortalBelgeOku(anahtar) {
  var parca = anahtar.split("/"), yol = "/" + parca.map(encodeURIComponent).join("/");
  var alanlar = parca[0] === "ogrenciler" ? ["ad", "soyad", "veliler", "dil", "iletisimDili", "adSabit", "kayitRef"] : parca[0] === "aileler" ? ["ogrenciler", "dil", "iletisimDili", "iletisimDiliKaynagi", "adSoyad"] : ["atlanan", "epostaDuzelt"];
  yol += "?" + alanlar.map(function (a) { return "mask.fieldPaths=" + encodeURIComponent(a); }).join("&");
  var r = veliPortalHttp(yol, null, parca[0] !== "ayarlar"); if (!r) return null;
  var data = {}; Object.keys(r.fields || {}).forEach(function (k) { data[k] = veliPortalDegerCoz(r.fields[k]); });
  return { data: data, updateTime: r.updateTime };
}
function veliPortalDefterOku() {
  var sh = kayitV2SayfaGetir(), n = sh.getLastRow(), count = sh.getLastColumn(); if (n < 2) return [];
  var baslik = sh.getRange(1, 1, 1, count).getValues()[0].map(String), sonuc = [];
  var alanlar = ["Referans", "Öğrenci adı", "Öğrenci soyadı", "Veli adı soyadı", "Veli e-posta", "İletişim dili"];
  alanlar.forEach(function (a) { if (baslik.indexOf(a) < 0) throw new Error("portal-defter-semasi"); });
  // Yalnız ihtiyaç duyulan sütunlar okunur; adres, kimlik, sağlık ve fotoğraf alanları alınmaz.
  alanlar.forEach(function (a) { var col = sh.getRange(2, baslik.indexOf(a) + 1, n - 1, 1).getValues(); col.forEach(function (r, i) { (sonuc[i] || (sonuc[i] = {}))[a] = r[0]; }); });
  return sonuc;
}
function veliPortalHash(k) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(k), Utilities.Charset.UTF_8).map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("");
}
function veliMailListesiIsle(kuru) {
  veliPortalKimlikDogrula(); var lock = LockService.getScriptLock(); if (!lock.tryLock(1000)) return { ok: false, mesgul: true };
  var p = PropertiesService.getScriptProperties();
  try {
    var ayar = veliPortalBelgeOku("ayarlar/portal").data;
    var model = veliPortalKayitlari(veliPortalDefterOku(), ayar), hashler = {}, tumu = p.getProperties();
    var adaylar = model.kayitlar.filter(function (k) { hashler[k.ref] = veliPortalHash(k); return tumu[VELI_PORTAL_ISLENEN + k.ref] !== hashler[k.ref]; }).slice(0, 50);
    // Aynı ailenin diğer kayıtları da dil çatışmasını yakalamak için değerlendirilir.
    var epostalar = new Set(adaylar.map(function (k) { return k.eposta; }));
    var kayitlar = model.kayitlar.filter(function (k) { return epostalar.has(k.eposta); }), belgeler = {};
    kayitlar.forEach(function (k) { belgeler["ogrenciler/" + k.ref] = veliPortalBelgeOku("ogrenciler/" + k.ref); });
    epostalar.forEach(function (ep) { belgeler["aileler/" + ep] = veliPortalBelgeOku("aileler/" + ep); });
    var plan = veliPortalYazilari(kayitlar, belgeler);
    if (!kuru) {
      if (plan.writes.length) { var cevap = veliPortalHttp(":commit", { writes: plan.writes }); if (!cevap.writeResults || cevap.writeResults.length !== plan.writes.length) throw new Error("portal-yazma-cevabi"); }
      var damgalar = {}; plan.islenen.forEach(function (ref) { damgalar[VELI_PORTAL_ISLENEN + ref] = hashler[ref]; }); if (Object.keys(damgalar).length) p.setProperties(damgalar, false);
    }
    var sonuc = { ok: true, zaman: new Date().toISOString(), kuru: !!kuru, kayitSayisi: model.kayitlar.length, aday: adaylar.length, islenen: plan.islenen.length, yazma: plan.writes.length, bekleyen: plan.bekleyen, atlanan: model.atlanan };
    if (!kuru) p.setProperty("VELI_PORTAL_SONUC", JSON.stringify(sonuc));
    return sonuc;
  } finally { lock.releaseLock(); }
}
function veliMailListesiZamanli() {
  try { var s = veliMailListesiIsle(false); if (s.ok && typeof veliCumaKontrol === "function") s.cuma = veliCumaKontrol(); console.log(JSON.stringify(s)); return s; }
  catch (e) {
    var kod = /^portal-[a-z0-9-]+$/.test(String(e.message)) ? String(e.message) : "portal-baglanti-hatasi";
    PropertiesService.getScriptProperties().setProperty("VELI_PORTAL_SONUC", JSON.stringify({ ok: false, zaman: new Date().toISOString(), hata: kod }));
    console.error(kod); throw new Error(kod);
  }
}
function veliMailListesiSina() { ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL); var s = veliMailListesiIsle(true); console.log(JSON.stringify(s)); return s; }
function veliMailListesiKur() {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  veliPortalKimlikDogrula(); veliPortalBelgeOku("ayarlar/portal");
  var varMi = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "veliMailListesiZamanli"; });
  if (!varMi) ScriptApp.newTrigger("veliMailListesiZamanli").timeBased().everyMinutes(5).create();
  PropertiesService.getScriptProperties().setProperty("VELI_PORTAL_KURULU", VELI_PORTAL_SURUM);
  return veliMailListesiZamanli();
}
function veliMailListesiDurumIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  var p = PropertiesService.getScriptProperties();
  return json({ ok: true, kurulu: p.getProperty("VELI_PORTAL_KURULU") === VELI_PORTAL_SURUM, aralikDakika: 5, sonuc: JSON.parse(p.getProperty("VELI_PORTAL_SONUC") || "null") });
}
