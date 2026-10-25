/* v25: Özel Drive arşivi + kalıcı iş kuyruğu. Bu dosya derlemede ana koda eklenir.
 * Alıcı/ek/şablon istemciden alınmaz. Başvuran e-postası yalnız kayıt defterinden okunur.
 * Ağ cevabı belirsizse ikinci sağlayıcıya düşülmez: çifte gönderim yerine kontrol durumu.
 */
var IHTIDA_PAKET_ALICILARI = ["info@ulucamii.be", "imam@ulucamii.be"];
var IHTIDA_PAKET_ON_EK = "IHTIDA_PAKET_IS_";

/* 23 Eki 2026 (Rıdvan KAYAHAN: «benim imzam ve başkan Ercan MOLA imzası otomatik gelmedi, belgeye»): Ulu Camii Marche'de
   «Rıdvan KAYAHAN» ve «Ercan MOLA» adlı şahidin kayıtlı vektör imzası pakete kendiliğinden basılır. İmzalar ÖZEL depoda
   durur: ihtida klasöründe «sahit-imzalari.json» ({"ridvan": "<sürüm 2 vektör>", "ercan": "<…>"}). Herkese açık depoya,
   public/ klasörüne, derlenmiş GAS paketine ve iş dosyalarına (paket-islem.json) KONMAZ. Dosya yoksa özellik kurulmamıştır
   (imza basılmaz); dosya var ama bozuksa paket hata verir, imzasız belge sessizce çıkmaz. */
var IHTIDA_SAHIT_IMZA_DOSYA = "sahit-imzalari.json";
var IHTIDA_SAHIT_ANAHTARLARI = ["ridvan", "ercan"];

function ihtidaSahitImzaDosyasi() {
  var ad = IHTIDA_SAHIT_IMZA_DOSYA, it = ihtidaKlasorGetir().getFilesByName(ad);
  while (it.hasNext()) { var f = it.next(); if (f.getName() === ad && !f.isTrashed()) return f; }
  return null;
}
/** {ridvan, ercan}: özel depodaki şahit imzaları (yalnız kayıtlı olanlar). Dosya yoksa {}. Bozuksa hata fırlatır. */
function ihtidaSahitImzalariOku() {
  var f = ihtidaSahitImzaDosyasi();
  if (!f) return {};
  var d = JSON.parse(f.getBlob().getDataAsString("UTF-8")), sonuc = {};
  if (!d || typeof d !== "object") throw new Error("sahit-imzalari-bozuk");
  IHTIDA_SAHIT_ANAHTARLARI.forEach(function (a) {
    if (!d[a]) return;
    if (typeof d[a] !== "string" || !IhtidaPdf.sahitImzaCoz(d[a])) throw new Error("sahit-imzasi-gecersiz");
    sonuc[a] = d[a];
  });
  return sonuc;
}
/** GET ?islem=sahit-imzalari&anahtar=… — yalnız yönetim paneli (yerel tek EK-9 için, bellekte kalır). */
function ihtidaSahitImzalariGetIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  try { return json({ ok: true, surum: SURUM, imzalar: ihtidaSahitImzalariOku() }); }
  catch (_) { return json({ ok: false, hata: "sahit-imzalari-okunamadi" }); }
}
/** POST {tur: "sahit-imza-yukle", anahtar, ad: "ridvan"|"ercan", imza: "<sürüm 2 vektör>" ya da "" (kaldırır)}.
 *  Cevap imzayı geri vermez. Kayıt betik kilidi içinde, tek dosyada yapılır. */
function ihtidaSahitImzaYukleIsle(v) {
  if (!panelYetkiTamam({ parameter: { anahtar: v.anahtar } })) return json({ ok: false, hata: "yetki" });
  if (IHTIDA_SAHIT_ANAHTARLARI.indexOf(v.ad) < 0) return json({ ok: false, hata: "sahit-adi-gecersiz" });
  var imza = v.imza === undefined || v.imza === null ? "" : v.imza;
  if (imza !== "" && (typeof imza !== "string" || !IhtidaPdf.sahitImzaCoz(imza))) return json({ ok: false, hata: "sahit-imzasi-gecersiz" });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var f = ihtidaSahitImzaDosyasi(), d = {};
    if (f) { d = JSON.parse(f.getBlob().getDataAsString("UTF-8")); if (!d || typeof d !== "object") return json({ ok: false, hata: "sahit-imzalari-bozuk" }); }
    if (imza) d[v.ad] = imza; else delete d[v.ad];
    var metin = JSON.stringify(d);
    if (f) f.setContent(metin);
    else ihtidaKlasorGetir().createFile(Utilities.newBlob(metin, "application/json", IHTIDA_SAHIT_IMZA_DOSYA));
    return json({ ok: true, ad: v.ad, kayitli: Boolean(imza), kayitliSahitler: Object.keys(d).filter(function (a) { return IHTIDA_SAHIT_ANAHTARLARI.indexOf(a) >= 0 && d[a]; }) });
  } catch (_) { return json({ ok: false, hata: "sahit-imza-yazilamadi" }); }
  finally { lock.releaseLock(); }
}

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
  // 29 Eyl 2026: numara silinen denemeden sonra yeniden verilebilir; çöpteki eski iş dosyası yenisini gölgelemez.
  var ad = ref + " - paket-islem.json", it = ihtidaKlasorGetir().getFilesByName(ad);
  while (it.hasNext()) { var f = it.next(); if (f.getName() === ad && !f.isTrashed()) return f; }
  return null;
}
/** 29 Eyl 2026: test temizliği bir ihtida satırını silince numara sonraki başvuruya yeniden verilir (referansMaxBul).
 *  Bu yüzden aynı ref'in iş dosyası, son paket PDF'i, görselleri ve kuyruk özelliği de kalkar; yoksa yeni başvuru
 *  eski «tamam» işini ve deneme görsellerini devralır. Yalnız ada birebir eşleşen dosyalar çöpe gider. */
function ihtidaRefIzleriniCopeAt(klasor, ref) {
  if (!/^IH-\d{4}-\d{4}$/.test(ref)) throw new Error("ref-gecersiz");
  var silinen = 0, is = null;
  try { is = ihtidaPaketIsiOku(ref); } catch (_) { is = null; }
  // 23 Eki 2026: son nüshada yeni revizyon eskisinin dosya numarasını iş kaydından düşürürdü (eskiPdfler tutulur); ön
  // başvurunun başvuran nüshası (şahit imzasız) da ayrı dosyadır. Hepsi ad denetimiyle çöpe gider.
  var pdfler = is ? [is.pdfId, is.basvuranPdfId].concat(is.eskiPdfler || [], ihtidaParcaIdleri(is)).filter(function (id, i, h) { return id && h.indexOf(id) === i; }) : [];
  pdfler.forEach(function (id) {
    try {
      var pdf = DriveApp.getFileById(id);
      if ((/^IH-\d{4}-\d{4} - Ihtida Belge Paketi - r\d+( - basvuran)?\.pdf$/.test(pdf.getName()) || ihtidaParcaAdiMi(pdf.getName())) && pdf.getName().indexOf(ref + " - ") === 0 && !pdf.isTrashed()) { pdf.setTrashed(true); silinen++; }
    } catch (_) { /* paket PDF'i yoksa satır temizliği sürer */ }
  });
  IHTIDA_GORSEL_ADLARI.map(function (t) { return ref + t.sonEk; }).concat([ref + " - paket-islem.json"]).forEach(function (ad) {
    var it = klasor.getFilesByName(ad);
    while (it.hasNext()) { var f = it.next(); if (f.getName() === ad && !f.isTrashed()) { f.setTrashed(true); silinen++; } }
  });
  PropertiesService.getScriptProperties().deleteProperty(IHTIDA_PAKET_ON_EK + ref);
  return silinen;
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
    // 23 Eki 2026: hangi şahit imzaları basıldı (ercan/ridvan) ve ön başvuruda başvuranın şahit imzasız nüshasının durumu.
    sahitImzasi: is.sahitImzasi || [], basvuranKopya: is.basvuranKopya || "", basvuranPdfId: is.basvuranPdfId || "", basvuranSha256: is.basvuranSha256 || "",
    // 25 Eki 2026: DHYS'ye ayrı yüklenecek dört parça (sirada / hazir / hata) ve arşivdeki dosyaları.
    // 25 Eki 2026: yedek şahit (Ercan MOLA · Rıdvan KAYAHAN) mühtedinin yazılı/sözlü rızasıyla mı kullanıldı.
    yedekSahitRizasi: is.yedekSahitRizasi || "",
    parcalar: is.parcalar || "", parcaPdfler: (is.parcaPdfler || []).map(function (p) { return { no: p.no, anahtar: p.anahtar, id: p.id, sayfa: p.sayfa }; }),
    alicilar: (is.alicilar || []).map(function (a) { return { eposta: a.eposta, durum: a.durum, messageId: a.messageId || "", zaman: a.zaman || "", basvuran: a.basvuran === true }; }) };
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
  PropertiesService.getScriptProperties().setProperty("IHTIDA_PAKET_KURULU", String(SURUM));
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
/** Arşivdeki paket dosyasını doğrular (klasör, çöp, tür, SHA-256). Varsayılan: ana nüsha; başvuran nüshası için kimlik ve özet verilir. */
function ihtidaPaketGuvenliDosya(is, dosyaId, ozet) {
  var f = DriveApp.getFileById(dosyaId || is.pdfId), parent = f.getParents(), izin = false;
  while (parent.hasNext()) if (parent.next().getId() === ihtidaKlasorGetir().getId()) izin = true;
  if (!izin || f.isTrashed() || f.getMimeType() !== "application/pdf") throw new Error("paket-arsiv-gecersiz");
  if (ihtidaPaketSha(f.getBlob().getBytes()) !== (ozet || is.sha256)) throw new Error("paket-arsiv-degismis");
  return f;
}
/** E-postadaki ek adı dernek içi alıcılarda aynıdır (arşivdeki dosya adından bağımsız); başvurana giden filigranlı nüsha «Sureti» adını taşır. */
function ihtidaPaketEkAdi(is, a) { return is.ref + (a && a.basvuran && is.basvuranKopya ? " - Ihtida Belgesi Sureti - r" : " - Ihtida Belge Paketi - r") + is.revizyon + ".pdf"; }
/** 23 Eki 2026: PDF baytlarını arşive yazar. GAS Byte[] işaretli byte bekler. */
function ihtidaPaketPdfKaydet(bytes, ad) {
  var signed = Array.from(bytes, function (n) { return n > 127 ? n - 256 : n; });
  var blob = Utilities.newBlob(signed, "application/pdf", ad);
  if (blob.getBytes().length > 14 * 1024 * 1024) throw new Error("paket-eposta-icin-buyuk");
  return { dosya: ihtidaKlasorGetir().createFile(blob), sha256: ihtidaPaketSha(blob.getBytes()) };
}
/* 25 Eki 2026 (Rıdvan KAYAHAN: «bu belgeyi diyanet veriyor, diyanetin resmi olarak konuştuğu dil türkçe, bu belgede dolayısıyla iki
   dilli olmalı … web sitemizden başvuru alma süreçlerinde bunu otomatik yapacak süreci de buna göre yaz ve uygula»): EK-9 arka
   yüzündeki ihtida sebebi başvuranın dilinde kalır, Türkçesi altına yazılır. Görevli son nüsha ekranında Türkçesini yazdıysa
   (duzenleme.ihtidaSebebiTr) o kullanılır; yoksa metin Apps Script'in kendi Google Çeviri servisiyle (LanguageApp; kaynak dil
   kendiliğinden bulunur) çevrilir. Gemini kullanılmaz: sebep özel nitelikli veridir, ücretsiz API katmanına gönderilmez.
   Form dili Türkçeyse, çeviri metnin aynısıysa ya da çeviri alınamazsa ikinci satır yazılmaz; paket her durumda üretilir.
   Günlüğe metin yazılmaz. */
function ihtidaSebebiTurkcesi(k, d) {
  var sade = function (s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); };
  var elle = d && typeof d.ihtidaSebebiTr === "string" ? sade(d.ihtidaSebebiTr) : "";
  if (elle) return elle;
  var metin = sade(IhtidaPdf.sebepKaynagi(k || {}, d || null));
  if (!metin || String((k || {})["Form dili"] || "").trim().toLowerCase() === "tr" || typeof LanguageApp === "undefined") return "";
  try {
    // Türkçe tipografi: noktalama işaretinden önce boşluk olmaz (motor bazen «buldum .» yazıyor).
    var tr = sade(LanguageApp.translate(metin, "", "tr")).replace(/\s+([,.;:!?])/g, "$1");
    return tr && tr.toLocaleLowerCase("tr") !== metin.toLocaleLowerCase("tr") ? tr : "";
  } catch (_) { console.error("ihtida-sebep-ceviri-hatasi"); return ""; }
}
/* 25 Eki 2026 (Rıdvan KAYAHAN: «… bu dosyadakileri dhys sistemine yükleyecek, belge bir parça, dilekçe bi parça,
   aydınlatma metni ve açık rıza metni bir parça, kimlik bir parça … online başvuru formunu doldurduktan sonra bunların herbiri
   parça parça yani ayrı ayrı kaydedilsin»): ana paket arşive yazıldıktan sonra DHYS'ye ayrı ayrı yüklenecek dört parçası
   (EK-9 · dilekçe · EK-10 · kimlik) aynı klasöre ayrı PDF olarak kaydedilir. Bölme planı üretim sırasında yalnız sayfa sıra
   numaralarıyla iş kaydına yazılır; parçalar arşivdeki (SHA-256 doğrulanmış) ana PDF'ten kesilir, yeniden üretilmez.
   E-postalar tek PDF'le sürer; parçalar yalnız arşiv ve panel içindir. Parça hatası paketi ve e-postaları durdurmaz. */
var IHTIDA_DHYS_SUTUN = "DHYS parçaları";
function ihtidaParcaAdi(is, p, uzanti) { return is.ref + " - r" + is.revizyon + " - " + p.no + " - " + p.baslik + "." + (uzanti || "pdf"); }
/** 1–4: PDF parçaları; 5: EK-9 ön yüzündeki vesikalık (JPG ya da PNG, yüklendiği biçimde). */
function ihtidaParcaAdiMi(ad) {
  var m = String(ad).match(/^IH-\d{4}-\d{4} - r\d+ - ([1-5]) - (.+)\.(pdf|jpg|png)$/);
  if (!m) return false;
  if (m[1] === "5") return m[3] !== "pdf" && m[2] === IhtidaPdf.DHYS_VESIKALIK.baslik;
  return m[3] === "pdf" && IhtidaPdf.DHYS_PARCALARI.some(function (p) { return String(p.no) === m[1] && p.baslik === m[2]; });
}
function ihtidaParcaIdleri(is) { return ((is && is.parcaPdfler) || []).map(function (p) { return p.id; }).filter(Boolean); }
/** Yarım kalmış bir denemenin parçalarını çöpe atar (aynı adla ikinci kopya kalmasın). Yalnız parça adına uyan dosyalar. */
function ihtidaParcalariCopeAt(is) {
  ihtidaParcaIdleri(is).forEach(function (id) {
    try { var f = DriveApp.getFileById(id); if (ihtidaParcaAdiMi(f.getName()) && f.getName().indexOf(is.ref + " - ") === 0 && !f.isTrashed()) f.setTrashed(true); }
    catch (_) { /* dosya zaten yoksa sürer */ }
  });
  is.parcaPdfler = [];
}
/** Başvurunun çöpte olmayan vesikalık yüklemesi (ihtidaGorselleriOku ile aynı ad). */
function ihtidaVesikalikDosyasi(ref) {
  var ad = ref + " - vesikalik.jpg", it = ihtidaKlasorGetir().getFilesByName(ad);
  while (it.hasNext()) { var f = it.next(); if (f.getName() === ad && !f.isTrashed()) return f; }
  return null;
}
async function ihtidaPaketParcalariKaydet(is) {
  if (!is.parcaPlani) throw new Error("parca-plani-yok");
  ihtidaParcalariCopeAt(is);
  var ana = ihtidaPaketGuvenliDosya(is);
  var bytes = Uint8Array.from(ana.getBlob().getBytes(), function (b) { return b & 255; });
  var parcalar = await IhtidaPdf.parcala(PDFLib, bytes, is.parcaPlani, is.ref), urller = [];
  parcalar.forEach(function (p) {
    var kayit = ihtidaPaketPdfKaydet(p.bytes, ihtidaParcaAdi(is, p));
    is.parcaPdfler.push({ no: p.no, anahtar: p.anahtar, id: kayit.dosya.getId(), sha256: kayit.sha256, sayfa: p.sayfa });
    urller.push(kayit.dosya.getUrl());
    ihtidaPaketIsiYaz(is);   // kimlik hemen yazılır: çalışma kesilirse sonraki deneme bu dosyaları çöpe atar
  });
  // 25 Eki 2026 (Rıdvan KAYAHAN: «vesikalık fotoğraf ihtida belgesinin önyüzüne yerleştirdiğimiz fotoğraf olacak»): EK-9'a
  // gömülen yükleme dosyasının bayt bayt kopyası (form görseli tuvalden yeniden kodlar; üst veri yoktur). DHYS fotoğraf alanına
  // ayrı yüklenir. EK-9 fotoğrafı en/boy 0,72–0,86 kutusuna kırparak gösterir (public/admin/ek9.js); form 25.10'dan beri
  // vesikalığı bu orana kırparak yükler. Daha eski ve oranı dışında kalan yüklemede hücreye not düşülür.
  // Paket vesikalıksız üretilemediği için dosya olağan durumda vardır; sonradan silindiyse dört PDF yine kaydedilir, hücreye not düşülür.
  var v = ihtidaVesikalikDosyasi(is.ref);
  if (v) {
    var vBayt = v.getBlob().getBytes(), png = (vBayt[0] & 255) === 0x89;
    var vKopya = ihtidaKlasorGetir().createFile(Utilities.newBlob(vBayt, png ? "image/png" : "image/jpeg", ihtidaParcaAdi(is, IhtidaPdf.DHYS_VESIKALIK, png ? "png" : "jpg")));
    is.parcaPdfler.push({ no: IhtidaPdf.DHYS_VESIKALIK.no, anahtar: IhtidaPdf.DHYS_VESIKALIK.anahtar, id: vKopya.getId(), sha256: ihtidaPaketSha(vBayt), sayfa: 0 });
    var boyut = ihtidaGorselBoyutu(vBayt), oran = boyut && boyut.boy ? boyut.en / boyut.boy : 0;
    urller.push(vKopya.getUrl() + (oran && (oran < 0.715 || oran > 0.865)
      ? " (not: fotoğraf yüklendiği gibidir, en/boy " + oran.toFixed(2) + "; EK-9'da kırpılmış görünür, DHYS'ye yüklemeden önce bakın)" : ""));
    ihtidaPaketIsiYaz(is);
  } else urller.push("Vesikalık dosyası bulunamadı; EK-9 parçasındaki fotoğraf kullanılabilir.");
  is.parcalar = "hazir";
  // Dosyalar hazır: hücre yazılamazsa (satır yok, kota) parçalar yine «hazır» kalır, paket durmaz.
  try { ihtidaPaketHucre(is.ref, IHTIDA_DHYS_SUTUN, urller.join("\n")); }
  catch (_) { console.error("ihtida-dhys-hucre-hatasi " + is.ref); }
}
/** JPEG (SOFn) ya da PNG (IHDR) baytlarından {en, boy}; okunamazsa null. */
function ihtidaGorselBoyutu(b) {
  var u = function (i) { return b[i] & 255; };
  if (b.length > 24 && u(0) === 0x89 && u(1) === 0x50) return { en: (u(16) << 24 | u(17) << 16 | u(18) << 8 | u(19)) >>> 0, boy: (u(20) << 24 | u(21) << 16 | u(22) << 8 | u(23)) >>> 0 };
  if (b.length < 4 || u(0) !== 0xFF || u(1) !== 0xD8) return null;
  for (var i = 2; i + 8 < b.length;) {
    if (u(i) !== 0xFF) return null;
    var m = u(i + 1);
    if (m === 0xFF) { i++; continue; }                                        // dolgu baytı
    if (m === 0x01 || (m >= 0xD0 && m <= 0xD8)) { i += 2; continue; }         // uzunluksuz işaretler
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { boy: u(i + 5) << 8 | u(i + 6), en: u(i + 7) << 8 | u(i + 8) };
    i += 2 + (u(i + 2) << 8 | u(i + 3));
  }
  return null;
}
/** Başvuranın e-posta nüshası. 23 Eki 2026: ön başvuruda kayıtlı şahit imzaları basıldıysa nüsha onlar OLMADAN yeniden üretilir
 *  (herkese açık formdan otomatik gelen başvuruda başvurana yalnız kendi imzası giden nüsha gider; dernek içi nüsha ve arşiv şahit
 *  imzalıdır). Öbür durumlarda arşivdeki (SHA-256 doğrulanmış) ana nüsha kullanılır.
 *  25 Eki 2026 (Rıdvan KAYAHAN: «ihtida başvurusu yapan kardeşimizin mailine ihtida belgesinin sureti filigran gibi bir şey ile
 *  gitsin, bu belge bilgi amaçlıdır»): her aşamada başvurana giden nüshanın her sayfası «SURET · bilgi amaçlıdır» filigranlıdır. */
async function ihtidaPaketBasvuranKopyasiUret(is, k) {
  var bytes;
  if (is.asama === "on-basvuru" && (is.sahitImzasi || []).length) {
    var hatalar = [], g = ihtidaGorselleriOku(ihtidaKlasorGetir(), is.ref, hatalar);
    if (hatalar.length) throw new Error("gorsel-okunamadi");
    bytes = await IhtidaPdf.uret(k, g, null, ihtidaPaketKaynaklari(), PDFLib, fontkit, { ihtidaSebebiTr: ihtidaSebebiTurkcesi(k, null) });
  } else bytes = Uint8Array.from(ihtidaPaketGuvenliDosya(is).getBlob().getBytes(), function (b) { return b & 255; });
  bytes = await IhtidaPdf.suret(bytes, ihtidaPaketKaynaklari(), PDFLib, fontkit);
  var pdf = await PDFLib.PDFDocument.load(bytes, { parseSpeed: Infinity });
  if (pdf.getPageCount() < 6) throw new Error("paket-sayfa-eksik");
  var kayit = ihtidaPaketPdfKaydet(bytes, is.ref + " - Ihtida Belge Paketi - r" + is.revizyon + " - basvuran.pdf");
  is.basvuranPdfId = kayit.dosya.getId(); is.basvuranSha256 = kayit.sha256; is.basvuranKopya = "hazir";
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
    var k = ihtidaPaketKayit(ref).kayit, bas = Date.now();
    if (!is.pdfId) {
      is.deneme++; is.durum = "hazirlaniyor"; ihtidaPaketIsiYaz(is);
      var hatalar = [], g = ihtidaGorselleriOku(ihtidaKlasorGetir(), ref, hatalar);
      if (hatalar.length) throw new Error("gorsel-okunamadi");
      // 23 Eki 2026: kayıtlı şahit imzaları (Rıdvan KAYAHAN, Ercan MOLA) özel depodan okunur; yalnız eşleşen şahide basılır.
      var imzalar = ihtidaSahitImzalariOku();
      var plan = IhtidaPdf.sahitImzaPlani(k, is.duzenleme || null, imzalar, g), parcaPlani = {};
      var bytes = await IhtidaPdf.uret(k, g, is.duzenleme || null, ihtidaPaketKaynaklari(), PDFLib, fontkit, { sahitImzalari: imzalar, ihtidaSebebiTr: ihtidaSebebiTurkcesi(k, is.duzenleme || null), parcaPlani: parcaPlani });
      var pdf = await PDFLib.PDFDocument.load(bytes, { parseSpeed: Infinity });
      if (pdf.getPageCount() < 6) throw new Error("paket-sayfa-eksik");
      // Arşiv ve ek aynı blob'dur.
      var kayit = ihtidaPaketPdfKaydet(bytes, ref + " - Ihtida Belge Paketi - r" + is.revizyon + ".pdf"), f = kayit.dosya;
      is.pdfId = f.getId(); is.sha256 = kayit.sha256; is.sayfa = pdf.getPageCount();
      is.sahitImzasi = plan.uygulanan; is.uretimSuresiMs = Date.now() - bas;
      is.parcaPlani = parcaPlani.toplam === is.sayfa ? parcaPlani : null; is.parcalar = "sirada"; is.parcaDeneme = 0; is.parcaPdfler = [];
      is.durum = "hazir"; is.hata = "";
      // Şahit imzalarını iş dosyasında çoğaltma; yalnız özel son PDF'de kalır.
      delete is.duzenleme;
      var basvuran = String(k["E-posta"]).trim().toLowerCase();
      var alicilar = IHTIDA_PAKET_ALICILARI.concat([basvuran]);
      is.alicilar = alicilar.filter(function (a, i) { return alicilar.indexOf(a) === i; }).map(function (a) {
        return { eposta: a, durum: "sirada", anahtar: Utilities.getUuid(), deneme: 0, basvuran: a === basvuran && IHTIDA_PAKET_ALICILARI.indexOf(a) < 0 };
      });
      // 25 Eki 2026: başvurana her aşamada filigranlı suret gider (ayrı PDF). Ön başvuruda kayıtlı şahit imzası basıldıysa suret,
      // şahit imzaları basılmadan üretilen nüshadan yapılır (ihtidaPaketBasvuranKopyasiUret).
      is.basvuranKopya = is.alicilar.some(function (a) { return a.basvuran; }) ? "sirada" : "";
      is.kopyaDeneme = 0;
      ihtidaPaketIsiYaz(is);
      ihtidaPaketHucre(ref, "Tam paket PDF", f.getUrl());
      ihtidaPaketHucre(ref, "Paket durumu", is.asama === "on-basvuru" ? "Ön başvuru paketi hazır · tören teyidi bekliyor" : "Müşavirlik paketi hazır");
    }
    // 25 Eki 2026: dağıtımdan önce kuyruğa girmiş işte başvurana henüz gitmemiş nüsha da filigranlı surete çevrilir
    // (eski kayıtta basvuranKopya boş kalır; başvurana filigransız ana nüsha gitmesin).
    if (!is.basvuranKopya && is.alicilar.some(function (a) { return a.basvuran && (a.durum === "sirada" || a.durum === "gonderim-hatasi"); })) is.basvuranKopya = "sirada";
    // 6 dakikalık sınır: ikinci PDF aynı çalışmada yetişmezse sonraki dakikalık çalışmaya kalır; bu arada dernek içi alıcılara gönderim sürer.
    if (is.basvuranKopya === "sirada" && Date.now() - bas < 150000) {
      is.kopyaDeneme = (is.kopyaDeneme || 0) + 1;
      if (is.kopyaDeneme > 3) throw new Error("basvuran-kopyasi-hazirlanamadi");
      try { await ihtidaPaketBasvuranKopyasiUret(is, k); ihtidaPaketIsiYaz(is); }
      catch (kopyaHata) { console.error("ihtida-basvuran-kopyasi-hatasi " + ref); ihtidaPaketIsiYaz(is); }
    }
    var dosya = ihtidaPaketGuvenliDosya(is), basvuranDosya = null;
    for (var i = 0; i < is.alicilar.length; i++) {
      var a = is.alicilar[i];
      // Başvuran nüshası hazır olmadan başvurana şahit imzalı ana nüsha ASLA gitmez; nüsha bitince sıra ona gelir.
      var ek = dosya;
      if (a.basvuran && is.basvuranKopya) {
        if (is.basvuranKopya !== "hazir") continue;
        ek = basvuranDosya = basvuranDosya || ihtidaPaketGuvenliDosya(is, is.basvuranPdfId, is.basvuranSha256);
      }
      if (a.durum === "gonderiliyor") a.durum = "belirsiz";
      if (a.durum === "sirada" || (a.durum === "gonderim-hatasi" && a.deneme < 3)) {
        a.durum = "gonderiliyor"; a.deneme++; a.zaman = new Date().toISOString(); ihtidaPaketIsiYaz(is);
        ihtidaPaketEpostaGonder(is, a, ek.getBlob(), k);
        ihtidaPaketIsiYaz(is);
      }
      if (a.durum === "belirsiz" && !a.messageId) ihtidaPaketBelirsizYokla(is, a);
      if (a.messageId && a.durum !== "teslim-edildi" && a.durum !== "teslim-edilemedi") ihtidaPaketTeslimYokla(a);
    }
    // DHYS parçaları e-postalardan sonra: süre yetmezse 45 sn sonraki çalışmaya kalır; üç denemede olmazsa «hata» (paket sürer).
    if (is.parcalar === "sirada" && Date.now() - bas < 150000) {
      is.parcaDeneme = (is.parcaDeneme || 0) + 1;
      try { await ihtidaPaketParcalariKaydet(is); }
      catch (_) {
        console.error("ihtida-dhys-parca-hatasi " + ref);
        if (is.parcaDeneme >= 3) {
          is.parcalar = "hata";
          try { ihtidaPaketHucre(ref, IHTIDA_DHYS_SUTUN, "DHYS parçaları hazırlanamadı; tam paket PDF'i geçerlidir."); }
          catch (_) { /* hücre yazılamasa da paket sürer; durum iş kaydında */ }
        }
      }
      ihtidaPaketIsiYaz(is);
    }
    is.durum = is.alicilar.every(function (a) { return a.durum === "teslim-edildi"; }) && is.parcalar !== "sirada" ? "tamam" : "teslim-takibi";
    ihtidaPaketHucre(ref, "E-posta durumu", is.alicilar.map(function (a) { return a.eposta + ": " + ihtidaPaketDurumMetni(a.durum); }).join(" | "));
  } catch (hata) {
    is.durum = "hata"; is.hata = "PDF veya arşiv işlemi tamamlanamadı; yönetici kontrolü gerekiyor.";
    ihtidaPaketHucre(ref, "Paket durumu", is.hata);
    console.error("ihtida-paket-hatasi " + ref); // Görsel, kimlik, e-posta veya sağlayıcı cevabı loglanmaz.
  } finally {
    // Başvuran nüshası henüz hazır değilse bir sonraki dakikalık çalışma onu üretir (teslim yoklaması 5 dakikada bir).
    is.kilit = 0; is.sonraki = Date.now() + ((is.basvuranKopya === "sirada" || is.parcalar === "sirada") && is.durum !== "hata" ? 45 * 1000 : 5 * 60 * 1000); ihtidaPaketIsiYaz(is);
    if (is.durum === "tamam") PropertiesService.getScriptProperties().deleteProperty(IHTIDA_PAKET_ON_EK + ref);
  }
}
function ihtidaPaketDurumMetni(d) {
  return ({ sirada: "Sırada", gonderiliyor: "Gönderiliyor", "saglayici-kabul": "Gönderildi · teslim teyidi bekleniyor", "teslim-edildi": "Alıcı sunucusuna teslim edildi", "teslim-edilemedi": "Teslim edilemedi", "gonderim-hatasi": "Gönderim başarısız", belirsiz: "Gönderim sonucu belirsiz · kontrol gerekli" })[d] || d;
}
function ihtidaPaketEpostaGonder(is, a, blob, k) {
  var key = brevoAnahtari();
  if (!key || !epostaGecerli(a.eposta)) { a.durum = "gonderim-hatasi"; return; }
  var on = is.asama === "on-basvuru", suret = a.basvuran && is.basvuranKopya;
  var konu = (suret ? "İhtida belgesi sureti (bilgi amaçlı) / Copie du dossier de conversion (à titre d’information)"
    : on ? "İhtida ön başvuru belge paketi / Dossier de pré-demande" : "İhtida belge paketi / Dossier de conversion") + " — " + is.ref + " — r" + is.revizyon;
  var metin = suret ? ihtidaPaketBasvuranMetni(is, k) : [
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
    headers: { idempotencyKey: a.anahtar }, tags: [is.ref + "-r" + is.revizyon], attachment: [{ name: ihtidaPaketEkAdi(is, a), content: Utilities.base64Encode(blob.getBytes()) }] };
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
/* 25 Eki 2026 (Rıdvan KAYAHAN): başvurana giden suretin metni — «bu belge bilgi amaçlıdır, asıl nüsha resmi imza süreçlerinden
   sonra iletişim tercihinize göre size hem dijital olarak (… belge tarihi ve numarasını ve … imzasını da burda ekledikten sonra)
   hem de fiziki baskı ve ıslak imzaları tamamlanmış versiyonu size ulaştırılacaktır». Genel yayın kuralı (koordinatörlük
   CLAUDE.md §4): kurum adı yazılmaz, yetkili imzası nötr anılır. Kendi şahidini getiren başvurana, ön başvuruda şahit imzaları
   eksikse belgenin WhatsApp'tan gönderileceği bildirilir. */
function ihtidaPaketBasvuranMetni(is, k) {
  var on = is.asama === "on-basvuru", kendiSahit = String(k["Şahit 1"] || "").trim() !== "";
  var satirlar = [
    "Esselâmü aleyküm / Bonjour / Hello,", "",
    "İhtida belgesi dosyanızın sureti ektedir (EK-9, dilekçe, EK-10 ve kimlik belgesi örneği). Bu suret bilgi amaçlıdır, resmî belge yerine geçmez. Lütfen adınızı, adresinizi ve diğer bilgilerinizi kontrol ediniz; düzeltilmesi gereken bir bilgi varsa bu e-postaya cevap veriniz.",
    "Asıl nüsha resmî imza süreçleri tamamlandıktan sonra iletişim tercihinize göre size ulaştırılacaktır: belge tarihi, sayısı ve yetkili imzası eklenmiş PDF olarak e-postayla; ıslak imzaları tamamlanmış basılı nüsha olarak da dilekçenizde belirttiğiniz teslim yerine.",
    on ? "Bu ön başvuru suretidir. Tören tarihi ve şahitler teyit edildikten sonra son nüsha hazırlanır." : null,
    on && kendiSahit ? "Şahitlerinizin imzaları belgede eksikse, imzalatmanız için belge size WhatsApp üzerinden gönderilecektir." : null,
    "",
    "Vous trouverez ci-joint une copie de votre dossier de conversion (EK-9, demande, EK-10 et copie du document d’identité). Cette copie est fournie à titre d’information et ne remplace pas le document officiel. Merci de vérifier votre nom, votre adresse et vos autres informations ; si une correction est nécessaire, répondez à cet e-mail.",
    "Après les signatures officielles, l’original vous sera transmis selon votre choix de contact : en PDF par e-mail, avec la date, le numéro et la signature de l’autorité compétente, ainsi qu’en version imprimée avec les signatures manuscrites, au lieu de remise indiqué dans votre demande.",
    on ? "Il s’agit d’une copie de pré-demande. Le dossier sera finalisé après confirmation de la date de la cérémonie et des témoins." : null,
    on && kendiSahit ? "Si les signatures de vos témoins manquent, le document vous sera envoyé par WhatsApp pour les faire signer." : null,
    "",
    "Attached is a copy of your conversion file (EK-9, request letter, EK-10 and a copy of your identity document). This copy is for information only and does not replace the official document. Please check your name, address and other details; if anything needs correcting, reply to this e-mail.",
    "Once the official signatures are complete, the original will be sent to you according to your contact preference: as a PDF by e-mail, with the date, number and signature of the competent authority, and as a printed copy with handwritten signatures, to the delivery place given in your request.",
    on ? "This is a pre-application copy. The final copy is prepared once the ceremony date and the witnesses are confirmed." : null,
    on && kendiSahit ? "If your witnesses’ signatures are missing, the document will be sent to you via WhatsApp so that they can sign it." : null,
    "",
    "Referans / Référence / Reference: " + is.ref,
    "Marche-en-Famenne Ulu Camii", "info@ulucamii.be · imam@ulucamii.be"
  ];
  return satirlar.filter(function (x) { return x !== null; }).join("\n");   // koşulu tutmayan satır (null) atlanır
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
function ihtidaPaketOnayDogrula(d, camiId) {
  if (!d || !tarihGecerliMi(d.ihtidaTarihi) || !tarihGecerliMi(d.beyanTarihi)) return false;
  if (d.ihtidaTarihi > Utilities.formatDate(new Date(), "Europe/Brussels", "yyyy-MM-dd")) return false;
  if (!metinDolu(d.adSoyad) || !uzunlukTamam(d.adSoyad, 120) || !metinDolu(d.adres) || !uzunlukTamam(d.adres, 400) || !uzunlukTamam(d.ihtidaSebebi, 600)) return false;
  // 25 Eki 2026: sebebin Türkçesi (isteğe bağlı; boşsa sunucu çevirir).
  if (d.ihtidaSebebiTr !== undefined && (typeof d.ihtidaSebebiTr !== "string" || !uzunlukTamam(d.ihtidaSebebiTr, 600))) return false;
  // 25 Eki 2026: yedek şahit rızası (isteğe bağlı): boş, «yazili» ya da «sozlu».
  if (d.yedekSahitRizasi !== undefined && ["", "yazili", "sozlu"].indexOf(d.yedekSahitRizasi) < 0) return false;
  if (["kimlik", "pasaport"].indexOf(d.belgeTuru) < 0 || !Array.isArray(d.sahitler) || d.sahitler.length !== 2) return false;
  // 21 Eki 2026: son nüsha ekranında düzeltilen EK-9 arka yüz değerleri (isteğe bağlı; yalnız bilinen alanlar, ≤120).
  if (d.alanlar !== undefined && !IhtidaPdf.ek9AlanlariGecerli(d.alanlar)) return false;
  // 23 Eki 2026: imzaKullan (isteğe bağlı mantıksal değer) kayıtlı şahit imzasının basılıp basılmayacağını söyler; imzanın kendisi istemciden gelmez.
  if (!d.sahitler.every(function (s) { return metinDolu(s.ad) && uzunlukTamam(s.ad, 120) && (!s.imza || gorselGecerli(s.imza, 1)) && (s.imzaKullan === undefined || typeof s.imzaKullan === "boolean"); })) return false;
  return camiId === "ulucamii-marche" || String(d.sahitler[0].ad).trim().toLocaleLowerCase("tr") !== String(d.sahitler[1].ad).trim().toLocaleLowerCase("tr");
}
function ihtidaPaketOnayIsle(v) {
  if (!panelYetkiTamam({ parameter: { anahtar: v.anahtar } })) return json({ ok: false, hata: "yetki" });
  var kayit;
  try { kayit = ihtidaPaketKayit(v.ref).kayit; } catch (_) { return json({ ok: false, hata: "paket-onay-hatasi" }); }
  var camiId = kayit["Cami kimliği"] || "ulucamii-marche";
  if (!ihtidaPaketOnayDogrula(v.hazirlik, camiId) || !temizAnahtar(v.islemAnahtari)) return json({ ok: false, hata: "paket-onay-gecersiz" });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var is = ihtidaPaketIsiOku(v.ref);
    if (is && is.islemAnahtari === v.islemAnahtari) return json({ ok: true, paket: ihtidaPaketOzet(is) });
    if (is && is.kilit > Date.now()) return json({ ok: false, hata: "paket-isleniyor" });
    // Önceki nüshanın arşiv dosyaları (ana ve başvuran nüshası) yeni iş kaydında unutulmaz: test temizliği hepsini bulur.
    var eskiPdfler = is ? (is.eskiPdfler || []).concat([is.pdfId, is.basvuranPdfId], ihtidaParcaIdleri(is)).filter(function (id, i, h) { return id && h.indexOf(id) === i; }) : [];
    is = { ref: v.ref, revizyon: (is ? is.revizyon : 0) + 1, asama: "musavirlik", durum: "sirada", deneme: 0, duzenleme: v.hazirlik, islemAnahtari: v.islemAnahtari, alicilar: [], eskiPdfler: eskiPdfler,
      yedekSahitRizasi: v.hazirlik.yedekSahitRizasi || "" };   // düzenleme üretimden sonra silinir; rıza kaydı kalır
    ihtidaPaketIsiYaz(is);
    ihtidaPaketHucre(v.ref, "Paket durumu", "Onaylanan son nüsha hazırlanıyor");
    ihtidaPaketHucre(v.ref, "Tam paket PDF", "");
    ihtidaPaketHucre(v.ref, IHTIDA_DHYS_SUTUN, "");
    ihtidaPaketHucre(v.ref, "E-posta durumu", "Sırada");
    if (typeof ihtidaDefteriKirlet === "function") ihtidaDefteriKirlet(v.ref);
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
    is.sonraki = 0; is.deneme = 0; is.kopyaDeneme = 0; if (is.durum === "hata") is.durum = "sirada";
    // 25 Eki 2026: hazırlanamamış DHYS parçaları yeniden denenir (paket teslim edilmiş olsa bile).
    if (is.parcalar === "hata" && is.parcaPlani) { is.parcalar = "sirada"; is.parcaDeneme = 0; if (is.durum === "tamam") is.durum = "teslim-takibi"; }
    is.alicilar.forEach(function (a) { if (a.durum === "gonderim-hatasi") { a.deneme = 0; a.durum = "sirada"; } });
    ihtidaPaketIsiYaz(is);
  } finally { lock.releaseLock(); }
  return json({ ok: true, paket: ihtidaPaketOzet(is) });
}
