/**
 * «Ahde Vefa» — Veda Programı (8 Kasım 2026) katılım bildirimi arka ucu.
 * AYRI küçük Apps Script projesi (dernek hesabı ulucamii2026@gmail.com). Canlı kayıt/ihtida arka ucuna dokunmaz.
 *
 *   POST {tur:'veda', ...}                 herkese açık: doğrular, deftere yazar, bildirim e-postası gönderir
 *   POST {tur:'veda-liste', anahtar}       yalnız LISTE_ANAHTARI ile: kayıtlar + toplamlar
 *   GET                                    sağlık ({ok, surum, kapali})
 *
 * Script Properties (elle, koda YAZILMAZ): LISTE_ANAHTARI (uzun rastgele). TABLO_ID ilk kayıtta kendiliğinden oluşur.
 * E-posta: MailApp, gönderen = betiği dağıtan hesap (ulucamii2026). Alıcı: BILDIRIM_ALICI.
 * Saklama: program sonrası silme → OKUBENI.md (defter dosyası çöpe atılır).
 */
var SURUM = 1;
var BILDIRIM_ALICI = 'rdvankayahan@gmail.com';
var KAPANIS_MS = Date.parse('2026-11-07T12:00:00+01:00');
var TABLO_ADI = 'Veda Programı 2026-11-07 — katılım (veda-2026-11-07)';
var BASLIK = ['Anahtar', 'Zaman (Brüksel)', 'Ad soyad', 'Kurum / dernek', 'Görevi', 'Telefon', 'Katılım', 'Kişi', 'Zaman (ISO)', 'Mesaj'];
var GOREVLER = ['', 'Dernek başkanı', 'Din görevlisi', 'STK temsilcisi', 'Diğer'];
var GUNLUK_SINIR = 400;
var MESAJ_AZAMI = 600;

function yanit_(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne)).setMimeType(ContentService.MimeType.JSON);
}

function kapaliMi_(simdi) {
  return (simdi == null ? Date.now() : simdi) >= KAPANIS_MS;
}

function doGet() {
  return yanit_({ ok: true, surum: SURUM, kapali: kapaliMi_() });
}

function doPost(e) {
  var govde;
  try { govde = JSON.parse((e && e.postData && e.postData.contents) || ''); } catch (x) { return yanit_({ ok: false, hata: 'json' }); }
  if (!govde || typeof govde !== 'object') return yanit_({ ok: false, hata: 'json' });
  if (govde.tur === 'veda') return vedaKaydet_(govde);
  if (govde.tur === 'veda-liste') return vedaListe_(govde);
  return yanit_({ ok: false, hata: 'bilinmeyen-tur' });
}

/* ---------- doğrulama ---------- */
function metin_(v, azami) {
  if (typeof v !== 'string') return null;
  var t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length <= azami ? t : null;
}

/** Çok satırlı serbest metin: satır sonları korunur, denetim karakterleri atılır, en çok MESAJ_AZAMI karakter. */
function mesajMetni_(v) {
  if (v == null || v === '') return '';
  if (typeof v !== 'string') return null;
  var t = v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return t.length <= MESAJ_AZAMI ? t : null;
}

function dogrula_(g) {
  var ad = metin_(g.ad, 80), kurum = metin_(g.kurum, 120), gorev = metin_(g.gorev == null ? '' : g.gorev, 40);
  var tel = metin_(g.telefon == null ? '' : g.telefon, 24), anahtar = metin_(g.gonderimAnahtari, 80), mesaj = mesajMetni_(g.mesaj);
  if (ad === null || ad.length < 3) return { hata: 'ad' };
  if (kurum === null || kurum.length < 2) return { hata: 'kurum' };
  if (gorev === null || GOREVLER.indexOf(gorev) < 0) return { hata: 'gorev' };
  if (tel === null || (tel && !/^\+?[0-9 ()./-]{6,24}$/.test(tel))) return { hata: 'telefon' };
  if (g.durum !== 'katilacak' && g.durum !== 'katilamayacak') return { hata: 'durum' };
  var kisi = 0;
  if (g.durum === 'katilacak') {
    kisi = Number(g.kisi);
    if (!(kisi === Math.floor(kisi)) || kisi < 1 || kisi > 10) return { hata: 'kisi' };
  }
  if (mesaj === null) return { hata: 'mesaj' };
  if (!anahtar || anahtar.length < 8) return { hata: 'anahtar' };
  return { ad: ad, kurum: kurum, gorev: gorev, telefon: tel, durum: g.durum, kisi: kisi, anahtar: anahtar, mesaj: mesaj };
}

function normal_(s) {
  return String(s).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

/** Aynı ad+kurum için yalnız en yeni kayıt geçerlidir; toplamlar yalnız geçerli kayıtlardan çıkar. */
function toplamlar_(kayitlar) {
  var son = {}, i, k;
  for (i = 0; i < kayitlar.length; i++) { k = kayitlar[i]; son[normal_(k.ad) + '|' + normal_(k.kurum)] = i; }
  var t = { katilacakKayit: 0, katilacakKisi: 0, katilamayacak: 0, toplamKayit: kayitlar.length };
  for (i = 0; i < kayitlar.length; i++) {
    k = kayitlar[i];
    k.gecerli = son[normal_(k.ad) + '|' + normal_(k.kurum)] === i;
    if (!k.gecerli) continue;
    if (k.durum === 'katilacak') { t.katilacakKayit++; t.katilacakKisi += Number(k.kisi) || 0; } else t.katilamayacak++;
  }
  return t;
}

function hucre_(s) { // Sheets formülüne dönüşmesin
  s = String(s);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/* ---------- defter ---------- */
function tabloAc_() {
  var ozellikler = PropertiesService.getScriptProperties();
  var id = ozellikler.getProperty('TABLO_ID');
  if (id) return SpreadsheetApp.openById(id).getSheets()[0];
  var tablo = SpreadsheetApp.create(TABLO_ADI);
  var sayfa = tablo.getSheets()[0];
  sayfa.setName('Katılım');
  sayfa.getRange(1, 1, 1, BASLIK.length).setValues([BASLIK]).setFontWeight('bold');
  sayfa.setFrozenRows(1);
  ozellikler.setProperty('TABLO_ID', tablo.getId());
  return sayfa;
}

function kayitlariOku_(sayfa) {
  var son = sayfa.getLastRow();
  if (son < 2) return [];
  var satirlar = sayfa.getRange(2, 1, son - 1, BASLIK.length).getValues();
  return satirlar.map(function (r) {
    return { anahtar: String(r[0]), zamanYazi: String(r[1]), ad: String(r[2]), kurum: String(r[3]), gorev: String(r[4]), telefon: String(r[5]),
      durum: String(r[6]) === 'Katılacak' ? 'katilacak' : 'katilamayacak', kisi: Number(r[7]) || 0, zaman: String(r[8]), mesaj: String(r[9] == null ? '' : r[9]) };
  });
}

function vedaKaydet_(g) {
  if (kapaliMi_()) return yanit_({ ok: false, hata: 'kapali' });
  if (g.web) return yanit_({ ok: false, hata: 'bos-istek' }); // tuzak alan
  var d = dogrula_(g);
  if (d.hata) return yanit_({ ok: false, hata: 'gecersiz', alan: d.hata });
  var kilit = LockService.getScriptLock();
  kilit.waitLock(20000);
  var kayitlar, yeni, toplam;
  try {
    var sayfa = tabloAc_();
    kayitlar = kayitlariOku_(sayfa);
    for (var i = 0; i < kayitlar.length; i++) if (kayitlar[i].anahtar === d.anahtar) return yanit_({ ok: true, tekrar: true }); // aynı gönderim yeniden denendi
    var bugun = Utilities.formatDate(new Date(), 'Europe/Brussels', 'yyyy-MM-dd');
    var bugunSayisi = kayitlar.filter(function (k) { return Utilities.formatDate(new Date(k.zaman), 'Europe/Brussels', 'yyyy-MM-dd') === bugun; }).length;
    if (bugunSayisi >= GUNLUK_SINIR) return yanit_({ ok: false, hata: 'gunluk-sinir' });
    var simdi = new Date();
    var zamanYazi = Utilities.formatDate(simdi, 'Europe/Brussels', 'dd.MM.yyyy HH:mm');
    yeni = { anahtar: d.anahtar, zamanYazi: zamanYazi, ad: d.ad, kurum: d.kurum, gorev: d.gorev, telefon: d.telefon, durum: d.durum, kisi: d.kisi, zaman: simdi.toISOString(), mesaj: d.mesaj };
    sayfa.appendRow([hucre_(d.anahtar), zamanYazi, hucre_(d.ad), hucre_(d.kurum), hucre_(d.gorev), hucre_(d.telefon),
      d.durum === 'katilacak' ? 'Katılacak' : 'Katılamayacak', d.kisi, yeni.zaman, hucre_(d.mesaj)]);
    kayitlar.push(yeni);
    toplam = toplamlar_(kayitlar);
  } finally { kilit.releaseLock(); }
  try { bildirimGonder_(yeni, toplam); } catch (x) { console.error('bildirim-gonderilemedi: ' + x); } // kayıt kaybolmaz
  return yanit_({ ok: true });
}

function bildirimMetni_(k, t) {
  return [
    'Veda programı için yeni katılım bildirimi alındı.',
    '',
    'Ad soyad: ' + k.ad,
    'Kurum / dernek: ' + k.kurum,
    'Görevi: ' + (k.gorev || '—'),
    'Telefon: ' + (k.telefon || '—'),
    'Katılım: ' + (k.durum === 'katilacak' ? 'Katılacak' : 'Katılamayacak'),
    'Kişi sayısı: ' + (k.durum === 'katilacak' ? k.kisi : '—'),
    'Zaman: ' + k.zamanYazi + ' (Brüksel)',
    'Hocamıza mesaj: ' + (k.mesaj ? '\n' + k.mesaj : '—'),
    '',
    'Toplamlar (aynı ad ve kurumda yalnız en yeni kayıt sayılır)',
    'Katılacak kayıt: ' + t.katilacakKayit,
    'Katılacak toplam kişi: ' + t.katilacakKisi,
    'Katılamayacak: ' + t.katilamayacak,
    'Toplam kayıt (tekrarlar dahil): ' + t.toplamKayit,
  ].join('\n');
}

function bildirimGonder_(k, t) {
  MailApp.sendEmail({
    to: BILDIRIM_ALICI,
    subject: 'Veda programı — yeni katılım: ' + k.ad,
    body: bildirimMetni_(k, t),
    name: 'Ulu Camii Marche-en-Famenne',
  });
}

/* ---------- korumalı liste ---------- */
function sabitKarsilastir_(a, b) {
  a = String(a || ''); b = String(b || '');
  var fark = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) fark |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return fark === 0;
}

function vedaListe_(g) {
  var beklenen = PropertiesService.getScriptProperties().getProperty('LISTE_ANAHTARI');
  if (!beklenen || beklenen.length < 24 || !sabitKarsilastir_(g.anahtar, beklenen)) return yanit_({ ok: false, hata: 'yetki' });
  var kayitlar = kayitlariOku_(tabloAc_());
  var toplam = toplamlar_(kayitlar);
  var cikti = kayitlar.map(function (k) {
    return { ad: k.ad, kurum: k.kurum, gorev: k.gorev, telefon: k.telefon, durum: k.durum, kisi: k.kisi, zaman: k.zaman, gecerli: k.gecerli, mesaj: k.mesaj };
  }).reverse();
  return yanit_({ ok: true, toplam: toplam, kayitlar: cikti });
}
