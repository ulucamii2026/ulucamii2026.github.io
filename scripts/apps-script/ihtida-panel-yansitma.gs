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
var PANEL_YANSIT_KUYRUK_ON_EK = "PANEL_YANSIT_KUYRUK_";     // yalnız YOLDA olan başvuru başına; bitince silinir
var PANEL_YANSIT_UYARI_ON_EK = "PANEL_YANSIT_UYARI_";
var PANEL_YANSIT_OZET_OZELLIK = "PANEL_YANSIT_OZET";        // TEK özellik: sonuç koduna göre sayaçlar + en son N «dikkat» başvurusu (ref, kod)
var PANEL_YANSIT_TAMAM_OZELLIK = "PANEL_YANSIT_TAMAM";      // TEK özellik: kesin biten (ok / kapsam-disi) ref numaraları, yıl başına aralık listesi
var PANEL_YANSIT_TUR_KILIT_OZELLIK = "PANEL_YANSIT_TUR_KILIT"; // tur kirası: «jeton|bitiş ms»
var PANEL_YANSIT_DIKKAT_EN_COK = 50;        // özetteki dikkat listesi sınırı (en eski düşer)
var PANEL_YANSIT_TAMAM_EN_UZUN = 6000;      // TAMAM özelliğinin en çok karakteri (Script Properties değer sınırı 9 KB); aşılırsa en eski aralıklar unutulur
var PANEL_YANSIT_KILIT_BEKLE_MS = 5000;     // betik kilidini alma bekleme süresi; alınamazsa tur sessizce çıkar
var PANEL_YANSIT_KIRA_MS = 7 * 60000;       // tur kirası geçerlilik süresi (bir çalıştırma en çok 6 dk): çöken tur kirayı kilitli bırakmaz
var PANEL_YANSIT_IMZA_SISTEMIK = 3;         // bir turda ART ARDA bu kadar FARKLI başvuru imzadan reddedilirse sorun sistemiktir: tur durur + tek uyarı
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
/** «Kadın» / «kadın» / «KADIN» / «Erkek» …: diğer alanlarla AYNI yerel-duyarlı sadeleştirme (ı/İ, aksanlar, büyük-küçük harf). */
function ihtidaPanelCinsiyet(m) {
  var s = ihtidaPanelSade(m);
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
/** Brüksel'in verilen ANDAKİ UTC farkı (dakika). Apps Script `Utilities.formatDate(…, "Z")` → «+0100». */
function ihtidaPanelFarkDk(ms) {
  var z = Utilities.formatDate(new Date(ms), "Europe/Brussels", "Z"), m = /^([+-])(\d{2})(\d{2})$/.exec(String(z));
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}
/**
 * Defterin «Zaman damgası» hücresi (tarih nesnesi YA DA metin) → {ms, gun} ya da null.
 * Metin biçimleri: «YYYY-MM-DD[ T]HH:MM[:SS][Z|±HH:MM]» (bölge yoksa Brüksel duvar saati) ve «GG.AA.YYYY[ HH:MM[:SS]]» (Brüksel duvar saati).
 * Saatsiz metin = öğlen. Tarih takvimde yoksa ya da çözülemiyorsa null: başvuru günü BİLİNMEDEN panele hiçbir şey gitmez (bugüne DÜŞÜLMEZ).
 */
function ihtidaPanelZaman(v) {
  if (v && typeof v === "object" && typeof v.getTime === "function") {
    var ms0 = v.getTime();
    if (!isFinite(ms0)) return null;
    var g0 = ihtidaPanelGun(v);
    return g0 ? { ms: ms0, gun: g0 } : null;
  }
  var s = String(v == null ? "" : v).trim(), m, y, a, d, sa = 12, dk = 0, sn = 0, bolge = null;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?)?$/.exec(s))) {
    y = Number(m[1]); a = Number(m[2]); d = Number(m[3]);
    if (m[4] !== undefined) { sa = Number(m[4]); dk = Number(m[5]); sn = Number(m[6] || 0); bolge = m[7] || null; }
  } else if ((m = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s))) {
    d = Number(m[1]); a = Number(m[2]); y = Number(m[3]);
    if (m[4] !== undefined) { sa = Number(m[4]); dk = Number(m[5]); sn = Number(m[6] || 0); }
  } else return null;
  var gun = ihtidaPanelGun(y + "-" + ("0" + a).slice(-2) + "-" + ("0" + d).slice(-2));
  if (!gun || sa > 23 || dk > 59 || sn > 59) return null;
  var duvar = Date.UTC(y, a - 1, d, sa, dk, sn), ms;
  if (bolge) {
    var f = bolge === "Z" ? 0 : (bolge.charAt(0) === "-" ? -1 : 1) * (Number(bolge.slice(1, 3)) * 60 + Number(bolge.slice(-2)));
    ms = duvar - f * 60000;
    gun = ihtidaPanelGun(new Date(ms));
    if (!gun) return null;
  } else {
    ms = duvar - ihtidaPanelFarkDk(duvar) * 60000;
    ms = duvar - ihtidaPanelFarkDk(ms) * 60000; // yaz/kış saati sınırında ikinci yaklaşım
  }
  return isFinite(ms) ? { ms: ms, gun: gun } : null;
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
 *  satir-yok · ref-gecersiz · kucuk (başvuru günü 18 yaş altı: panele HİÇ gönderilmez) · dogum-eksik · zaman-eksik · riza-yok · dil-gecersiz ·
 *  cinsiyet-gecersiz · toren-dili-gecersiz · cami-gecersiz · ad-gecersiz · eposta-gecersiz
 * `simdiMs`: «şimdi» (sınama için dışarıdan verilir).
 */
function ihtidaPanelGovdeKur(k, simdiMs) {
  if (!k) return { ok: false, neden: "satir-yok" };
  var ref = String(k["Referans"] == null ? "" : k["Referans"]).trim();
  if (!PANEL_YANSIT_REF.test(ref)) return { ok: false, neden: "ref-gecersiz" };
  var dogum = ihtidaPanelGun(k["Doğum tarihi"]);
  if (!dogum) return { ok: false, neden: "dogum-eksik" };
  // Başvuru günü ZORUNLU (B-03): tarih nesnesi ya da metin çözülür; çözülemezse panele hiçbir şey gitmez, «bugün»e DÜŞÜLMEZ.
  var z = ihtidaPanelZaman(k["Zaman damgası"]);
  if (!z) return { ok: false, neden: "zaman-eksik" };
  var zamanMs = z.ms, bugun = Utilities.formatDate(new Date(simdiMs), "Europe/Brussels", "yyyy-MM-dd");
  // 18 yaş altı: başvuru gününe göre (sonradan 18 olması geçmiş başvuruyu yetişkin yapmaz); gelecek tarihli satır en çok bugüne göre
  // (panel de yaşı min(zaman, şimdi) anında hesaplar). Sözleşme penceresi dışı eski satır da bu gün esas alınarak elenir.
  var yas = ihtidaPanelYas(dogum, z.gun > bugun ? bugun : z.gun);
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
  if (zamanMs <= simdiMs + 86400000 && zamanMs >= simdiMs - PANEL_YANSIT_PENCERE_GUN * 86400000) govde.zaman = new Date(zamanMs).toISOString();
  govde.dil = dil; govde.cinsiyet = cinsiyet; govde.dogumTarihi = dogum;
  govde.uyruk = ihtidaPanelUyruk(k["Uyruk"]);
  govde.camiId = cami; govde.torenDili = toren; govde.rizaSurum = riza; govde.ad = ad; govde.eposta = eposta;
  return { ok: true, govde: govde };
}

/* ---------- İmza ---------- */

function ihtidaPanelHex(bayt) {
  return bayt.map(function (x) { return ("0" + (x & 255).toString(16)).slice(-2); }).join("");
}
/**
 * İmzalanan metin (sözleşme): zaman[ms] LF nonce LF ham gövde. Çıktı: HMAC-SHA256 küçük harf hex.
 * B-02: iki bağımsız değişkenli aşırı yükleme US_ASCII kullanır ve ASCII dışı karakterleri bozar; bu yüzden karakter kümesi AÇIKÇA UTF-8 verilir.
 * Üstüne tel üzerindeki gövde de saf ASCII'dir (aşağıda): imza ve bayt dizisi hangi kodlamayla okunursa okunsun aynıdır.
 */
function ihtidaPanelImzaHesapla(sir, zaman, nonce, govdeMetni) {
  return ihtidaPanelHex(Utilities.computeHmacSha256Signature(zaman + "\n" + nonce + "\n" + govdeMetni, sir, Utilities.Charset.UTF_8));
}
/** JSON metni; ASCII dışı her UTF-16 birimi \uXXXX olarak kaçışlanır (astral karakterler vekil çift olarak). JSON.parse özgün metni geri verir. */
function ihtidaPanelJsonAscii(govde) {
  return JSON.stringify(govde).replace(/[\u007f-￿]/g, function (c) { return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4); });
}
/** Her deneme için TAZE zaman + nonce. Nonce: 32 onaltılık karakter ([A-Za-z0-9_-]{16,64}). */
function ihtidaPanelIstekKur(govde, sir, simdiMs) {
  var metin = ihtidaPanelJsonAscii(govde), zaman = String(simdiMs), nonce = String(Utilities.getUuid()).replace(/-/g, "");
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
/* Sonuçlar BAŞVURU BAŞINA özellik olarak tutulmaz (B-11: sınırsız büyüme). Üç sınırlı yapı vardır:
 *  - PANEL_YANSIT_OZET: {s: {sonuçKodu: sayı}, r: [[ref, kod], …en son N]}: sayaçlar + dikkat isteyen başvurular (yalnız ref ve kod).
 *  - PANEL_YANSIT_TAMAM: kesin biten (ok / kapsam-disi) ref numaraları, yıl başına birleştirilmiş aralıklar: {"2026": [1,40,43,43]} = 1–40 ve 43.
 *    Aşırı büyürse EN ESKİ aralıklar unutulur (güvenli yön: panel yinelenen başvuruya 200 «değişmedi» döner).
 *  - PANEL_YANSIT_KUYRUK_<ref>: yalnız yoldaki başvuru; bitince silinir. */
function ihtidaPanelJsonOku(ad, varsayilan) {
  try { var h = ihtidaPanelOzellikler().getProperty(ad), d = h ? JSON.parse(h) : null; return d && typeof d === "object" && !Array.isArray(d) ? d : varsayilan; } catch (_) { return varsayilan; }
}
function ihtidaPanelRefParca(ref) { var m = /^IH-(\d{4})-(\d{4,6})$/.exec(String(ref)); return m ? { y: m[1], n: Number(m[2]) } : null; }
function ihtidaPanelTamamMi(ref) {
  var r = ihtidaPanelRefParca(ref), t = ihtidaPanelJsonOku(PANEL_YANSIT_TAMAM_OZELLIK, {}), l = r && Array.isArray(t[r.y]) ? t[r.y] : [];
  for (var i = 0; i + 1 < l.length; i += 2) if (r.n >= l[i] && r.n <= l[i + 1]) return true;
  return false;
}
function ihtidaPanelTamamEkle(ref) {
  var r = ihtidaPanelRefParca(ref);
  if (!r) return;
  var t = ihtidaPanelJsonOku(PANEL_YANSIT_TAMAM_OZELLIK, {}), l = Array.isArray(t[r.y]) ? t[r.y] : [], aralik = [];
  for (var i = 0; i + 1 < l.length; i += 2) aralik.push([Number(l[i]), Number(l[i + 1])]);
  aralik.push([r.n, r.n]);
  aralik.sort(function (a, b) { return a[0] - b[0]; });
  var birlesik = [];
  aralik.forEach(function (a) {
    var son = birlesik[birlesik.length - 1];
    if (son && a[0] <= son[1] + 1) son[1] = Math.max(son[1], a[1]); else birlesik.push([a[0], a[1]]);
  });
  t[r.y] = [].concat.apply([], birlesik);
  var s = JSON.stringify(t);
  while (s.length > PANEL_YANSIT_TAMAM_EN_UZUN) { // en eski yılın en eski aralığını unut
    var yillar = Object.keys(t).sort();
    if (!yillar.length) break;
    t[yillar[0]].splice(0, 2);
    if (!t[yillar[0]].length) delete t[yillar[0]];
    s = JSON.stringify(t);
  }
  ihtidaPanelOzellikler().setProperty(PANEL_YANSIT_TAMAM_OZELLIK, s);
}
function ihtidaPanelDikkatSil(ref) {
  var o = ihtidaPanelJsonOku(PANEL_YANSIT_OZET_OZELLIK, { s: {}, r: [] });
  if (!Array.isArray(o.r)) return;
  var yeni = o.r.filter(function (x) { return x[0] !== ref; });
  if (yeni.length !== o.r.length) { o.r = yeni; ihtidaPanelOzellikler().setProperty(PANEL_YANSIT_OZET_OZELLIK, JSON.stringify(o)); }
}
/** Son sonuç: dikkat listesindeki kod, kesin bitmişse «tamam», yoksa «». */
function ihtidaPanelSonucOku(ref) {
  var o = ihtidaPanelJsonOku(PANEL_YANSIT_OZET_OZELLIK, { s: {}, r: [] }), r = Array.isArray(o.r) ? o.r : [];
  for (var i = 0; i < r.length; i++) if (r[i][0] === ref) return String(r[i][1]);
  return ihtidaPanelTamamMi(ref) ? "tamam" : "";
}
/** Beklenen, işlem gerektirmeyen sonuçlar dikkat listesine girmez (yalnız sayılır). */
function ihtidaPanelDikkatGerekirMi(kod) { return kod !== "ok" && kod !== "kapsam-disi" && kod !== "atlandi-kucuk" && kod !== "atlandi-riza-yok"; }
function ihtidaPanelSonucYaz(ref, kod) {
  var p = ihtidaPanelOzellikler(), o = ihtidaPanelJsonOku(PANEL_YANSIT_OZET_OZELLIK, { s: {}, r: [] });
  if (!o.s || typeof o.s !== "object") o.s = {};
  o.r = (Array.isArray(o.r) ? o.r : []).filter(function (x) { return x[0] !== ref; });
  o.s[kod] = (Number(o.s[kod]) || 0) + 1;
  if (kod === "ok" || kod === "kapsam-disi") ihtidaPanelTamamEkle(ref);
  else if (ihtidaPanelDikkatGerekirMi(kod)) { o.r.push([ref, kod]); while (o.r.length > PANEL_YANSIT_DIKKAT_EN_COK) o.r.shift(); }
  p.setProperty(PANEL_YANSIT_OZET_OZELLIK, JSON.stringify(o));
  p.deleteProperty(PANEL_YANSIT_KUYRUK_ON_EK + ref);
}
/** Son sonuç: bu ikisi KESİNDİR (geri doldurma bile dokunmaz). Diğerleri (atlandı, imza, 400, katalog, vazgeçildi) yeniden değerlendirilebilir. */
function ihtidaPanelSonucKesinMi(s) { return s === "tamam"; }

/** Tur kirası (B-11): iki tur AYNI ref'i aynı anda gönderemez. Betik kilidi YALNIZ kirayı almak için kısa tutulur (form işleyicisi aynı kilidi 30 sn bekler;
 *  fetch süresince tutulsaydı başvurular kilit zaman aşımına uğrardı). Alınamazsa null: tur sessizce çıkar. */
function ihtidaPanelTurKirala() {
  var kilit = LockService.getScriptLock();
  if (!kilit.tryLock(PANEL_YANSIT_KILIT_BEKLE_MS)) return null;
  try {
    var p = ihtidaPanelOzellikler(), simdi = ihtidaPanelSaat(), h = String(p.getProperty(PANEL_YANSIT_TUR_KILIT_OZELLIK) || ""), bitis = Number(h.split("|")[1]);
    if (h && isFinite(bitis) && bitis > simdi) return null;
    var jeton = String(Utilities.getUuid()).replace(/-/g, "");
    p.setProperty(PANEL_YANSIT_TUR_KILIT_OZELLIK, jeton + "|" + (simdi + PANEL_YANSIT_KIRA_MS));
    return jeton;
  } finally { try { kilit.releaseLock(); } catch (_) { /* tutulmuyorsa sessiz */ } }
}
function ihtidaPanelTurBirak(jeton) {
  try {
    var p = ihtidaPanelOzellikler();
    if (String(p.getProperty(PANEL_YANSIT_TUR_KILIT_OZELLIK) || "").split("|")[0] === jeton) p.deleteProperty(PANEL_YANSIT_TUR_KILIT_OZELLIK);
  } catch (_) { console.error("panel-yansit-kira-birakilamadi"); }
}
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

/**
 * Panelden dönen HTTP koduna göre kuyruk durumu. `ek` (yalnız 400 için, isteğe bağlı): {alan, camiId} — panelin yanıtındaki reddedilen alan ve gönderdiğimiz cami kimliği.
 * Dönüş: "ok" | "kapsam-disi" | "katalog" | "gecersiz" | "imza" | "imza-bekle" | "kapali" | "bekle" | "vazgec".
 */
function ihtidaPanelSonucIsle(ref, kod, simdiMs, ek) {
  var q = ihtidaPanelKuyrukOku(ref) || { d: 0, i: 0, s: 0 };
  if (kod === 200) { ihtidaPanelSonucYaz(ref, "ok"); ihtidaPanelOzellikler().deleteProperty(PANEL_YANSIT_UYARI_ON_EK + "imza"); return "ok"; }
  if (kod === 422) { ihtidaPanelSonucYaz(ref, "kapsam-disi"); return "kapsam-disi"; }
  if (kod === 400 && ek && ek.alan === "camiId" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(String(ek.camiId))) {
    // Katalog kayması: sitede olan cami panel kataloğunda yok. Başvuru bozuk değildir; yeniden denenmez, cami kimliği başına TEK uyarı.
    ihtidaPanelSonucYaz(ref, "kapsam-disi-katalog");
    ihtidaPanelUyar("katalog-" + ek.camiId, "İhtida paneline yansıtma: cami panel kataloğunda yok (" + ek.camiId + ")",
      "Panel, cami kimliği «" + ek.camiId + "» olan başvuruları tanımıyor (HTTP 400, alan camiId): bu cami site kataloğunda var, panel kataloğunda yok. Bu cami için tek uyarı gelir.\n" +
      "Kapsam dışı / katalog sayılır, yeniden denenmez. Katalog iki kopyadır (public/data/belcika-camileri.json — site ve panel deposu); eşitlendikten sonra ihtidaPaneleGeriDoldurGercek() yeniden sıraya alır.\nKişisel veri bu iletide yoktur.");
    return "katalog";
  }
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
  var istek = ihtidaPanelIstekKur(m.govde, ayar.sir, simdi), kod = 0, ek = null;
  try {
    var yanit = UrlFetchApp.fetch(ayar.url, {
      method: "post", contentType: "application/json; charset=utf-8", payload: istek.metin, headers: istek.basliklar,
      muteHttpExceptions: true, followRedirects: false
    });
    kod = yanit.getResponseCode();
    if (kod === 400) { // reddedilen alanı oku (kişisel veri değil): cami kataloğu kayması ayrı sınıflanır
      try { var yd = JSON.parse(yanit.getContentText()); ek = { alan: yd && typeof yd.alan === "string" ? yd.alan : "", camiId: m.govde.camiId }; } catch (_) { ek = null; }
    }
  } catch (_) { console.error("panel-yansit-ag-hatasi"); kod = 0; }
  return ihtidaPanelSonucIsle(ref, kod, simdi, ek);
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
 * Dönüş: {denenen, ok, kapsamDisi, katalog, bekle, imza, atlanan, nedenler, durdu, kilitli, diger} sayaçları (kişisel veri yok).
 * Tur kirası (ihtidaPanelTurKirala) alınamazsa sessizce çıkar. Bir başvurunun imza reddi DİĞERLERİNİ engellemez: sıradakine geçilir; art arda
 * PANEL_YANSIT_IMZA_SISTEMIK FARKLI başvuru imzadan reddedilirse sorun sistemiktir (sır/saat/adres): tur durur ve TEK uyarı gider.
 */
function ihtidaPaneleYansitKuyrukCalistir(baslangicMs) {
  var sayac = { denenen: 0, ok: 0, kapsamDisi: 0, katalog: 0, bekle: 0, imza: 0, atlanan: 0, nedenler: {}, durdu: "", kilitli: false, diger: 0 };
  if (!ihtidaPanelAcikMi()) return sayac;
  var ayar = ihtidaPanelAyar();
  if (!ayar) return sayac;
  var jeton = ihtidaPanelTurKirala();
  if (!jeton) { sayac.kilitli = true; return sayac; }
  try {
    var bas = ihtidaPanelSaat(), son = Math.min((baslangicMs || bas) + 300000, bas + PANEL_YANSIT_TUR_BUTCE_MS), artArda = 0;
    var p = ihtidaPanelOzellikler().getProperties();
    var refs = Object.keys(p).filter(function (a) { return a.indexOf(PANEL_YANSIT_KUYRUK_ON_EK) === 0; }).map(function (a) { return a.slice(PANEL_YANSIT_KUYRUK_ON_EK.length); }).sort();
    for (var i = 0; i < refs.length && ihtidaPanelSaat() < son; i++) {
      var q = ihtidaPanelKuyrukOku(refs[i]);
      if (!q) { ihtidaPanelOzellikler().deleteProperty(PANEL_YANSIT_KUYRUK_ON_EK + refs[i]); continue; }
      if (q.s > ihtidaPanelSaat()) continue;
      sayac.denenen++;
      var s;
      try { s = ihtidaPanelBirini(refs[i], ayar); } catch (_) { console.error("panel-yansit-is-hatasi"); s = "diger"; }
      if (s === "imza" || s === "imza-bekle") {
        sayac.imza++; artArda++;
        if (artArda >= PANEL_YANSIT_IMZA_SISTEMIK) {
          sayac.durdu = "imza-sistemik";
          ihtidaPanelUyar("imza", "İhtida paneline yansıtma: imza art arda reddediliyor (401)",
            "Bir turda art arda " + PANEL_YANSIT_IMZA_SISTEMIK + " farklı başvuru imza hatası aldı (HTTP 401); sorun tek başvuruda değil, sistemik görünüyor. Tur durduruldu (bu uyarı yalnız bir kez gelir).\n" +
            "Olası nedenler: PANEL_YANSIT_SIR panel sırrıyla aynı değil, sunucu saati kayması, uç adresi yanlış.\nKişisel veri bu iletide yoktur. Çözüm sonrası kuyruk kendiliğinden devam eder; bırakılanlar için: ihtidaPaneleGeriDoldurGercek().");
          break;
        }
        continue; // tek başvurunun imza hatası kuyruğun kalanını engellemez
      }
      artArda = 0;
      if (s === "ok") sayac.ok++;
      else if (s === "kapsam-disi") sayac.kapsamDisi++;
      else if (s === "katalog") sayac.katalog++;
      else if (s === "bekle" || s === "kapali") sayac.bekle++;
      else if (s.indexOf("atlandi-") === 0) { sayac.atlanan++; var n = s.slice(8); sayac.nedenler[n] = (sayac.nedenler[n] || 0) + 1; }
      else sayac.diger++;
    }
  } finally { ihtidaPanelTurBirak(jeton); }
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
  var jeton = null;
  if (gercek) { // gerçek koşu, çalışan bir yansıtma turuyla aynı anda kuyruğa yazmaz (kuru koşu hiçbir şey yazmaz: kira gerekmez)
    jeton = ihtidaPanelTurKirala();
    if (!jeton) return { kip: "kilitli", toplam: 0, zatenTamam: 0, kuyrukta: 0, eklenecek: 0, atlanacak: 0, nedenler: {} };
  }
  try { return ihtidaPanelGeriDoldurIsle(gercek); } finally { if (jeton) ihtidaPanelTurBirak(jeton); }
}
function ihtidaPanelGeriDoldurIsle(gercek) {
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
    if (gercek) { ihtidaPanelDikkatSil(ref); ihtidaPanelKuyrukYaz(ref, { d: 0, i: 0, s: 0 }); }
  });
  return sayac;
}
/** Düzenleyiciden çalıştırılabilsin diye (argüman verilemez): bilerek ayrı ve açık adlı. Anahtar kapalıysa kuru koşu olur. */
function ihtidaPaneleGeriDoldurGercek() { var s = ihtidaPaneleGeriDoldur(false); console.log(JSON.stringify(s)); return s; }
function ihtidaPaneleGeriDoldurKuru() { var s = ihtidaPaneleGeriDoldur(); console.log(JSON.stringify(s)); return s; }
