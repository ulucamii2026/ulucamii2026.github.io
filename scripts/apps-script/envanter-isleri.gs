/* Mühtedi Hizmetleri Envanteri — sunucu iş mantığı (v42, 1 Ekim 2026).
 *
 *  Din görevlilerinin cami başına doldurduğu envanter formu (/envanter/, yalnız Türkçe, noindex).
 *  Sözleşme, doğrulama ve defter satırları bu dosyada DEĞİL: tek kaynak `src/lib/envanter/` ve esbuild
 *  paketi `EnvanterVeri` (npm run ihtida:gas-derle).
 *
 *  Açık/kapalı kararı YALNIZ Script Property `ENVANTER_AYAR`'dır (JSON):
 *    {"acik":1,"veriSorumlusu":"…","kapanis":"YYYY-MM-DD","silme":"YYYY-MM-DD"}
 *  Açık = acik == 1 VE veri sorumlusu dolu VE (kapanış varsa) bugün ≤ kapanış (Brüksel günü). Kapalıyken
 *  POST "kapali" ile reddedilir; hiçbir tablo açılmaz, hiçbir satır yazılmaz.
 *  İkinci ve son Script Property `ENVANTER_TABLO_ID`: tablo ilk GEÇERLİ POST'ta, kilit altında yaratılır.
 *
 *  Mahremiyet:
 *   · Bu modül HİÇ e-posta göndermez; Drive dosyası HİÇ silmez (yalnız satır siler).
 *   · Gizli/kodlu satırda ad, telefon, e-posta sözleşmede düşürülür; her hücre `hucreGuvenli`'den geçer.
 *   · Günlüğe (console) kişisel veri yazılmaz; yalnız hata kodu.
 *   · Saklama: `silme` günü geçince «Bildirim» sekmesinin bütün veri satırları silinir (başlık kalır);
 *     «Görevli» sekmesinde 183 günden eski satırlar silinir. Sheets sürüm geçmişi ayrıca temizlenmez.
 */

var AYAR_ENVANTER = {
  tabloAdi: "Mühtedi Hizmetleri Envanteri",
  gorevliSaklamaGun: 183,
  onbellekAnahtari: "envanter-temizlik",
  onbellekSaniye: 21600
};

/** Brüksel takvim günü (YYYY-MM-DD) — açık/kapalı ve silme kararı bu günle verilir. */
function envanterBugun(simdi) {
  return Utilities.formatDate(simdi || new Date(), "Europe/Brussels", "yyyy-MM-dd");
}

/** ENVANTER_AYAR'ı okur ve çözer. Paket yoksa ya da özellik okunamazsa KAPALI. */
function envanterAyar(simdi) {
  if (typeof EnvanterVeri === "undefined") return { acik: false, veriSorumlusu: null, kapanis: null, silme: null };
  var ham = null;
  try { ham = PropertiesService.getScriptProperties().getProperty("ENVANTER_AYAR"); } catch (e) { ham = null; }
  return EnvanterVeri.ayarCoz(ham, envanterBugun(simdi));
}

/** Sağlık yanıtındaki `envanter` nesnesi. Asla hata fırlatmaz; `silme` dışarı verilmez. */
function envanterSaglik() {
  try {
    var a = envanterAyar();
    return { acik: a.acik === true, veriSorumlusu: a.veriSorumlusu || null, kapanis: a.kapanis || null };
  } catch (e) {
    return { acik: false, veriSorumlusu: null, kapanis: null };
  }
}

/* ===================================================================
   Tablo — ENVANTER_TABLO_ID, iki sekme: «Görevli» ve «Bildirim»
   =================================================================== */

function envanterSekme(ss, ad, basliklar, ilk) {
  var sh = ss.getSheetByName(ad);
  if (!sh) {
    var sekmeler = ss.getSheets();
    // Yeni tablonun tek boş sekmesi yeniden adlandırılır; aksi hâlde yeni sekme eklenir.
    sh = (ilk && sekmeler.length === 1 && sekmeler[0].getLastRow() === 0) ? sekmeler[0].setName(ad) : ss.insertSheet(ad);
  }
  if (sh.getLastRow() === 0 || sh.getLastColumn() < basliklar.length) {
    // Sıra bağlayıcıdır (yeni sütun yalnız sona eklenir); başlık satırı tam yazılır.
    sh.getRange(1, 1, 1, basliklar.length).setValues([basliklar]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Tabloyu açar, yoksa YARATIR. Yalnız geçerli POST'ta, kilit altında çağrılır. */
function envanterTabloGetir() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("ENVANTER_TABLO_ID");
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(AYAR_ENVANTER.tabloAdi);
    var dosya = DriveApp.getFileById(ss.getId());
    // Mühtedi verisi ihtida başvurularıyla aynı gizlilik sınıfındadır: aynı klasöre konur.
    var klasor = typeof ihtidaKlasorGetir === "function" ? ihtidaKlasorGetir() : klasorGetir();
    klasor.addFile(dosya);
    DriveApp.getRootFolder().removeFile(dosya);
    p.setProperty("ENVANTER_TABLO_ID", ss.getId());
  }
  return {
    gorevli: envanterSekme(ss, EnvanterVeri.GOREVLI_SEKMESI, EnvanterVeri.GOREVLI_BASLIKLARI, true),
    bildirim: envanterSekme(ss, EnvanterVeri.BILDIRIM_SEKMESI, EnvanterVeri.BILDIRIM_BASLIKLARI, false)
  };
}

/** Tabloyu ASLA yaratmaz. GET uçları ve zamanlı temizlik bunu kullanır (GET iki kez çalışabilir). */
function envanterTabloBul() {
  if (typeof EnvanterVeri === "undefined") return null;
  try {
    var id = PropertiesService.getScriptProperties().getProperty("ENVANTER_TABLO_ID");
    if (!id) return null;
    var ss = SpreadsheetApp.openById(id);
    if (!ss) return null;
    return { gorevli: ss.getSheetByName(EnvanterVeri.GOREVLI_SEKMESI), bildirim: ss.getSheetByName(EnvanterVeri.BILDIRIM_SEKMESI) };
  } catch (e) { return null; }
}

/** Satırları tek çağrıda yazar; her hücre `hucreGuvenli` ile metne sabitlenir. */
function envanterSatirlariYaz(sayfa, satirlar) {
  if (!satirlar.length) return;
  var guvenli = satirlar.map(function (s) { return s.map(hucreGuvenli); });
  sayfa.getRange(sayfa.getLastRow() + 1, 1, guvenli.length, guvenli[0].length).setValues(guvenli);
}

/** Sheets, donmamış satırların TAMAMININ silinmesine izin vermez: gerekirse önce sona boş satır eklenir. */
function envanterSatirlariSil(sayfa, bas, adet) {
  if (adet <= 0) return;
  if (sayfa.getMaxRows() - adet <= sayfa.getFrozenRows()) sayfa.insertRowsAfter(sayfa.getMaxRows(), 1);
  sayfa.deleteRows(bas, adet);
}

function envanterSutun(basliklar, ad) { return basliklar.indexOf(ad) + 1; }

/** Aynı gönderim anahtarıyla yarım kalmış (Görevli satırı yazılamamış) önceki denemenin Bildirim satırları. */
function envanterYetimleriSil(sayfa, anahtar) {
  var son = sayfa.getLastRow();
  if (!anahtar || son < 2) return 0;
  var sutun = envanterSutun(EnvanterVeri.BILDIRIM_BASLIKLARI, "Gönderim anahtarı");
  var veri = sayfa.getRange(2, sutun, son - 1, 1).getValues(), silinen = 0;
  for (var i = veri.length - 1; i >= 0; i--) {
    if (String(veri[i][0]).trim() !== anahtar) continue;
    envanterSatirlariSil(sayfa, i + 2, 1);
    silinen++;
  }
  return silinen;
}

/* ===================================================================
   POST — tur:'envanter'
   =================================================================== */

function envanterPostIsle(v) {
  var simdi = new Date();
  if (!envanterAyar(simdi).acik) return json({ ok: false, hata: "kapali" });
  if (tuzakAlanDolu(v)) return json({ ok: false, hata: "bos-istek" });
  var yil = Number(Utilities.formatDate(simdi, "Europe/Brussels", "yyyy"));
  var d = EnvanterVeri.dogrula(v, yil);
  if (!d.ok) return json({ ok: false, hata: d.hata });

  // Seviye testi emsali: gönderim anahtarı zorunludur (tekrar denetimi ve yetim satır temizliği ona dayanır).
  var anahtar = temizAnahtar(v.gonderimAnahtari);
  if (!anahtar) return json({ ok: false, hata: "anahtar-gecersiz" });
  var yanit = null;
  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    var t = envanterTabloGetir();
    var sutunRef = envanterSutun(EnvanterVeri.GOREVLI_BASLIKLARI, "Referans");
    var sutunAnahtar = envanterSutun(EnvanterVeri.GOREVLI_BASLIKLARI, "Gönderim anahtarı");
    var son = t.gorevli.getLastRow();
    // Aynı gönderim anahtarı: ikinci satır açılmaz, ilk gönderimin numarası döner (sayılmaz, engellenmez).
    if (anahtar && son >= 2) {
      var veri = t.gorevli.getRange(2, 1, son - 1, Math.max(sutunRef, sutunAnahtar)).getValues();
      for (var i = veri.length - 1; i >= 0 && !yanit; i--) {
        if (String(veri[i][sutunAnahtar - 1]).trim() === anahtar) yanit = { ok: true, ref: String(veri[i][sutunRef - 1]), tekrar: true };
      }
    }
    if (!yanit) {
      var sinir = basvuruSinirKodu("envanter", t.gorevli, 0, "", simdi);
      if (sinir) {
        console.warn("envanter: hacim siniri (" + sinir + ")");
        yanit = { ok: false, hata: sinir };
      }
    }
    if (!yanit) {
      envanterYetimleriSil(t.bildirim, anahtar);
      var ref = "EV-" + Utilities.formatDate(simdi, "Europe/Brussels", "yyyy") + "-" +
        ("0000" + referansMaxBul([t.gorevli], "EV")).slice(-4);
      var baglam = { zaman: simdi, ref: ref, anahtar: anahtar };
      // Önce Bildirim, sonra Görevli: Görevli satırı gönderimin tamamlandığını gösterir (tekrar denetimi ona bakar).
      envanterSatirlariYaz(t.bildirim, EnvanterVeri.bildirimSatirlari(d.veri, baglam));
      envanterSatirlariYaz(t.gorevli, [EnvanterVeri.gorevliSatiri(d.veri, baglam)]);
      SpreadsheetApp.flush();
      yanit = { ok: true, ref: ref };
    }
  } finally {
    kilit.releaseLock();
  }
  return json(yanit);
}

/* ===================================================================
   GET ?islem=envanter-test-temizle — yalnız görevli adında TESTOGLU sözcüğü olan satırlar
   =================================================================== */

function envanterTestTemizleSekme(sayfa) {
  if (!sayfa || sayfa.getLastRow() < 2) return 0;
  var basliklar = sayfa.getRange(1, 1, 1, sayfa.getLastColumn()).getValues()[0].map(String);
  var sutun = basliklar.indexOf("Görevli adı") + 1;
  if (!sutun) return 0;
  var veri = sayfa.getRange(2, sutun, sayfa.getLastRow() - 1, 1).getValues(), silinen = 0;
  for (var i = veri.length - 1; i >= 0; i--) {
    var sozcukler = String(veri[i][0] || "").toUpperCase().trim().split(/\s+/);
    if (sozcukler.indexOf("TESTOGLU") === -1) continue;
    envanterSatirlariSil(sayfa, i + 2, 1);
    silinen++;
  }
  return silinen;
}

function envanterTestTemizleIsle(e) {
  if (!panelYetkiTamam(e)) return json({ ok: false, hata: "yetki" });
  try {
    var t = envanterTabloBul();
    if (!t) return json({ ok: true, silinen: 0, gorevli: 0, bildirim: 0 });
    var kilit = LockService.getScriptLock();
    kilit.waitLock(30000);
    var bildirim = 0, gorevli = 0;
    try {
      bildirim = envanterTestTemizleSekme(t.bildirim);
      gorevli = envanterTestTemizleSekme(t.gorevli);
    } finally { kilit.releaseLock(); }
    return json({ ok: true, silinen: bildirim + gorevli, gorevli: gorevli, bildirim: bildirim });
  } catch (hata) {
    console.error(hata);
    return json({ ok: false, hata: "test-temizleme-hatasi", ayrinti: String(hata).slice(0, 160) });
  }
}

/* ===================================================================
   Saklama (GDPR md. 5/1-e) — günlük işten çağrılır, tabloyu asla yaratmaz
   =================================================================== */

function envanterSaklamaTemizle(simdi) {
  simdi = simdi || new Date();
  var sonuc = { bildirim: 0, gorevli: 0 };
  var t = envanterTabloBul();
  if (!t) return sonuc;
  var ayar = envanterAyar(simdi);
  // `silme` günü GEÇİNCE (ertesi Brüksel gününden itibaren) bütün adlı bildirimler silinir; başlık kalır.
  if (ayar.silme && envanterBugun(simdi) > ayar.silme && t.bildirim && t.bildirim.getLastRow() >= 2) {
    sonuc.bildirim = t.bildirim.getLastRow() - 1;
    envanterSatirlariSil(t.bildirim, 2, sonuc.bildirim);
  }
  if (t.gorevli && t.gorevli.getLastRow() >= 2) {
    var esik = simdi.getTime() - AYAR_ENVANTER.gorevliSaklamaGun * 86400000;
    var veri = t.gorevli.getRange(2, 1, t.gorevli.getLastRow() - 1, 1).getValues();
    for (var i = veri.length - 1; i >= 0; i--) {
      var z = veri[i][0];
      var ms = z instanceof Date ? z.getTime() : Date.parse(String(z));
      if (!isFinite(ms) || ms >= esik) continue;
      envanterSatirlariSil(t.gorevli, i + 2, 1);
      sonuc.gorevli++;
    }
  }
  return sonuc;
}

/** Zamanlı iş (veliMailListesiZamanli sonunda): 6 saatte en çok bir kez. Ayrı tetikleyici yoktur. */
function envanterZamanliTemizlik() {
  var onbellek = null;
  try { onbellek = CacheService.getScriptCache(); } catch (_) { onbellek = null; }
  if (onbellek && onbellek.get(AYAR_ENVANTER.onbellekAnahtari)) return null;
  var sonuc = envanterSaklamaTemizle(new Date());
  if (onbellek) { try { onbellek.put(AYAR_ENVANTER.onbellekAnahtari, "1", AYAR_ENVANTER.onbellekSaniye); } catch (_) {} }
  return sonuc;
}
