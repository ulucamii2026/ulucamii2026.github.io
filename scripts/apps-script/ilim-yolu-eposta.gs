/* İlim Yolu haftalık e-posta boşaltıcı — Apps Script v47 (YEREL KAYNAK; canlıya alınmadı, bkz. docs/ILIM-YOLU.md «Durum»).
 * Kuyruğu functions/src/eposta.ts (haftalikKuyruk) ve hesap.ts (hareketsizTara) yazar: Firestore `epostaKuyrugu/h_<uid>_<ISO hafta>`
 * (tur: haftalik) ve `epostaKuyrugu/z_<uid>` (tur: hareketsiz; 24 aydır girmeyen hesaba silme uyarısı, hesap güvenliği bildirimi).
 * İki tür aynı kilit, deneme, günlük sınır ve şablonla boşalır; hareketsiz uyarı önce gider (hukuki bildirim) ve 20 güne kadar bayatlamaz.
 * Bu dosya 10 dakikada bir kuyruğu boşaltır: belgeyi KİLİTLER (updateTime önkoşulu) → kurumsal şablonla (veli-eposta-sablon.gs,
 * kurum «kurs») epostaGonder → belgeyi «gonderildi» yapıp e-posta adresini siler. Belge TTL (bitis, 7 gün) dolana dek kalır;
 * böylece aynı hafta ikinci kez kuyruğa girmez. Firestore erişimi veli-mail-listesi.gs ile aynıdır: dernek hesabının OAuth belirteci
 * (datastore kapsamı), ek anahtar YOK. Bağımlılıklar: veli-mail-listesi.gs (VELI_PORTAL_API, veliPortalDegerCoz,
 * veliPortalKimlikDogrula), veli-eposta-sablon.gs, kimlik-sabitler.gs, ulucamii-Kod-v47.gs (epostaGonder + brevoGonder `headers`).
 *
 * Güvenlik/sağlamlık:
 *  - En çok bir kez gönderim: önce «gonderiliyor» kilidi, sonra gönderim. Gönderim HATA verirse kilit geri alınır (deneme+1, 30 dk bekle,
 *    en çok 5 deneme). Kilit alındıktan sonra betik çökerse belge 2 saat sonra «belirsiz» olur ve ASLA yeniden gönderilmez.
 *  - Brevo yedeksiz: MailApp yedeği List-Unsubscribe başlığı taşıyamaz; Brevo düşerse belge «bekliyor» kalır, sonraki turda denenir.
 *  - Günlük sınır (Brevo kotası diğer postalarla ortak): Script Property ILIM_YOLU_EPOSTA_GUNLUK_SINIR (varsayılan 120), sayaç Brüksel günü.
 *  - 48 saatten eski özet gönderilmez («eski»). Kuyruk belgesindeki bağlantılar yalnızca ILIM_YOLU_ADRES ile başlıyorsa kabul edilir.
 */
var ILIM_YOLU_ADRES = "https://egitim.ulucamii.be/";
var ILIM_EPOSTA_PARTI = 40;
var ILIM_EPOSTA_GUNLUK = 120;
var ILIM_EPOSTA_DENEME = 5;
var ILIM_EPOSTA_ESKI_MS = 48 * 3600000;
var ILIM_EPOSTA_BEKLEME_MS = 30 * 60000;
var ILIM_EPOSTA_TAKILI_MS = 2 * 3600000;
var ILIM_EPOSTA_SAYAC = "ILIM_YOLU_EPOSTA_GUNLUK";
var ILIM_EPOSTA_SINIR = "ILIM_YOLU_EPOSTA_GUNLUK_SINIR";
var ILIM_EPOSTA_ESKI_HAREKETSIZ_MS = 20 * 24 * 3600000;
var ILIM_EPOSTA_TURLER = ["hareketsiz", "haftalik"]; // gönderim önceliği sırası
var ILIM_EPOSTA_KIMLIK = { haftalik: /^h_[A-Za-z0-9_-]{1,128}_\d{4}-W\d{2}$/, hareketsiz: /^z_[A-Za-z0-9_-]{1,128}$/ };

/* ── Metinler (tr «siz», fr vous, en, nl u, de Sie) ── */
function ilimYoluSayiMetni(n, tekil, cogul) { return n + " " + (n === 1 ? tekil : cogul); }
var ILIM_EPOSTA_METIN = {
  tr: {
    konu: "İlim Yolu: haftalık özetiniz", selam: function (ad) { return ad ? "Selâm @" + ad + "," : "Selâm,"; },
    gun: function (n) { return n === 0 ? "Son 7 günde henüz çalışmadınız; küçük bir adımla başlayabilirsiniz." : "Son 7 günde **" + n + " gün** çalıştınız."; },
    madde: function (n) { return "Şu ana kadar **" + n + " madde** üzerinde çalıştınız."; },
    baslik: "Sonraki adımınız",
    adim: { tekrar: function (t) { return "Tekrar zamanı gelen maddeler var (" + t + "); bugün onlara göz atmanız yeterli."; }, ezber: "Ezber bölümünden bir madde seçerek küçük bir ilk adım atın.", bilgi: "Bilgi bölümünden bir kart seçip okuyun.", yol: "Öğrenme yolunuzda bir sonraki konuya geçin.", devam: "Kaldığınız yerden devam etmeniz yeterli; küçük adımlar da sayılır." },
    dugme: "İlim Yolu'nu aç", onizleme: "Haftalık çalışma özetiniz hazır.",
    not: function (u) { return "Bu e-postayı, hesabınızda haftalık özeti açtığınız için alıyorsunuz. Artık almak istemiyorsanız tek tıkla vazgeçebilirsiniz: " + u; }
  },
  fr: {
    konu: "İlim Yolu : votre résumé de la semaine", selam: function (ad) { return ad ? "Bonjour @" + ad + "," : "Bonjour,"; },
    gun: function (n) { return n === 0 ? "Vous n’avez pas encore étudié ces 7 derniers jours ; un petit pas suffit pour commencer." : "Ces 7 derniers jours, vous avez étudié **" + ilimYoluSayiMetni(n, "jour", "jours") + "**."; },
    madde: function (n) { return "Jusqu’ici, vous avez travaillé sur **" + ilimYoluSayiMetni(n, "élément", "éléments") + "**."; },
    baslik: "Votre prochaine étape",
    adim: { tekrar: function (t) { return "Des éléments sont à revoir (" + t + ") ; un coup d’œil aujourd’hui suffit."; }, ezber: "Choisissez un élément dans la section Mémorisation pour faire un premier petit pas.", bilgi: "Choisissez une fiche dans la section Connaissances et lisez-la.", yol: "Passez au sujet suivant de votre parcours.", devam: "Il vous suffit de reprendre là où vous en étiez ; les petits pas comptent aussi." },
    dugme: "Ouvrir İlim Yolu", onizleme: "Votre résumé de la semaine est prêt.",
    not: function (u) { return "Vous recevez ce courriel parce que vous avez activé le résumé hebdomadaire dans votre compte. Pour ne plus le recevoir, désactivez-le en un clic : " + u; }
  },
  en: {
    konu: "İlim Yolu: your weekly summary", selam: function (ad) { return ad ? "Hello @" + ad + "," : "Hello,"; },
    gun: function (n) { return n === 0 ? "You haven’t studied in the last 7 days yet; one small step is enough to start." : "In the last 7 days you studied on **" + ilimYoluSayiMetni(n, "day", "days") + "**."; },
    madde: function (n) { return "So far you have worked on **" + ilimYoluSayiMetni(n, "item", "items") + "**."; },
    baslik: "Your next step",
    adim: { tekrar: function (t) { return "Some items are due for review (" + t + "); a quick look today is enough."; }, ezber: "Pick an item in the Memorisation section to take a small first step.", bilgi: "Pick a card in the Knowledge section and read it.", yol: "Move on to the next topic on your learning path.", devam: "Just pick up where you left off; small steps count too." },
    dugme: "Open İlim Yolu", onizleme: "Your weekly summary is ready.",
    not: function (u) { return "You are receiving this e-mail because you turned on the weekly summary in your account. To stop receiving it, unsubscribe in one click: " + u; }
  },
  nl: {
    konu: "İlim Yolu: uw weekoverzicht", selam: function (ad) { return ad ? "Hallo @" + ad + "," : "Hallo,"; },
    gun: function (n) { return n === 0 ? "U hebt de afgelopen 7 dagen nog niet gestudeerd; één kleine stap is genoeg om te beginnen." : "In de afgelopen 7 dagen hebt u op **" + ilimYoluSayiMetni(n, "dag", "dagen") + "** gestudeerd."; },
    madde: function (n) { return "Tot nu toe hebt u aan **" + ilimYoluSayiMetni(n, "onderdeel", "onderdelen") + "** gewerkt."; },
    baslik: "Uw volgende stap",
    adim: { tekrar: function (t) { return "Er zijn onderdelen om te herhalen (" + t + "); vandaag even doorkijken is genoeg."; }, ezber: "Kies in het onderdeel Memoriseren een item voor een kleine eerste stap.", bilgi: "Kies in het onderdeel Kennis een kaart en lees die.", yol: "Ga verder met het volgende onderwerp op uw leerpad.", devam: "Pak gewoon op waar u gebleven was; ook kleine stappen tellen." },
    dugme: "İlim Yolu openen", onizleme: "Uw weekoverzicht staat klaar.",
    not: function (u) { return "U ontvangt deze e-mail omdat u het wekelijkse overzicht in uw account hebt ingeschakeld. Wilt u hem niet meer ontvangen, dan kunt u zich met één klik afmelden: " + u; }
  },
  de: {
    konu: "İlim Yolu: Ihre Wochenübersicht", selam: function (ad) { return ad ? "Hallo @" + ad + "," : "Hallo,"; },
    gun: function (n) { return n === 0 ? "Sie haben in den letzten 7 Tagen noch nicht gelernt; ein kleiner Schritt genügt zum Anfangen." : "In den letzten 7 Tagen haben Sie an **" + ilimYoluSayiMetni(n, "Tag", "Tagen") + "** gelernt."; },
    madde: function (n) { return "Bisher haben Sie an **" + ilimYoluSayiMetni(n, "Eintrag", "Einträgen") + "** gearbeitet."; },
    baslik: "Ihr nächster Schritt",
    adim: { tekrar: function (t) { return "Einige Einträge sind zur Wiederholung fällig (" + t + "); heute ein kurzer Blick genügt."; }, ezber: "Wählen Sie im Bereich Auswendiglernen einen Eintrag für einen kleinen ersten Schritt.", bilgi: "Wählen Sie im Bereich Wissen eine Karte aus und lesen Sie sie.", yol: "Gehen Sie auf Ihrem Lernweg zum nächsten Thema weiter.", devam: "Machen Sie einfach dort weiter, wo Sie aufgehört haben; auch kleine Schritte zählen." },
    dugme: "İlim Yolu öffnen", onizleme: "Ihre Wochenübersicht ist da.",
    not: function (u) { return "Sie erhalten diese E-Mail, weil Sie die Wochenübersicht in Ihrem Konto aktiviert haben. Wenn Sie sie nicht mehr erhalten möchten, können Sie sich mit einem Klick abmelden: " + u; }
  }
};

/* Hareketsiz hesap uyarısı (tr «siz», fr vous, en, nl u, de Sie). `selam` haftalık metinle ortak. */
var ILIM_HAREKETSIZ_METIN = {
  tr: { konu: "İlim Yolu: hesabınız silinmek üzere", bilgi: "İlim Yolu hesabınızı yaklaşık iki yıldır kullanmadınız. Verileriniz gereksiz yere saklanmasın diye, 30 gün içinde giriş yapmazsanız hesabınız ve verileriniz silinecektir.", koru: "Hesabınızı korumak için yalnızca giriş yapmanız yeterli.", dugme: "Giriş yap", onizleme: "Hesabınız 30 gün içinde silinecek; giriş yapmanız yeterli.", not: "Bu e-posta bir hesap güvenliği bildirimidir; haftalık özet aboneliğinden bağımsızdır." },
  fr: { konu: "İlim Yolu : votre compte va être supprimé", bilgi: "Vous n’avez pas utilisé votre compte İlim Yolu depuis près de deux ans. Pour ne pas conserver vos données inutilement, votre compte et vos données seront supprimés si vous ne vous connectez pas dans les 30 jours.", koru: "Il vous suffit de vous connecter pour conserver votre compte.", dugme: "Se connecter", onizleme: "Votre compte sera supprimé dans 30 jours ; connectez-vous pour le conserver.", not: "Ce courriel est un avis de sécurité du compte ; il est indépendant du résumé hebdomadaire." },
  en: { konu: "İlim Yolu: your account is about to be deleted", bilgi: "You haven’t used your İlim Yolu account for almost two years. So that your data isn’t kept unnecessarily, your account and data will be deleted if you don’t sign in within 30 days.", koru: "Just sign in to keep your account.", dugme: "Sign in", onizleme: "Your account will be deleted in 30 days; just sign in to keep it.", not: "This e-mail is an account security notice; it is independent of the weekly summary." },
  nl: { konu: "İlim Yolu: uw account wordt binnenkort verwijderd", bilgi: "U hebt uw İlim Yolu-account al bijna twee jaar niet gebruikt. Om te voorkomen dat uw gegevens onnodig bewaard blijven, worden uw account en gegevens verwijderd als u niet binnen 30 dagen inlogt.", koru: "Log gewoon in om uw account te behouden.", dugme: "Inloggen", onizleme: "Uw account wordt over 30 dagen verwijderd; log in om het te behouden.", not: "Deze e-mail is een beveiligingsbericht over uw account; hij staat los van het weekoverzicht." },
  de: { konu: "İlim Yolu: Ihr Konto wird bald gelöscht", bilgi: "Sie haben Ihr İlim Yolu-Konto seit fast zwei Jahren nicht mehr genutzt. Damit Ihre Daten nicht unnötig gespeichert bleiben, werden Ihr Konto und Ihre Daten gelöscht, wenn Sie sich nicht innerhalb von 30 Tagen anmelden.", koru: "Melden Sie sich einfach an, um Ihr Konto zu behalten.", dugme: "Anmelden", onizleme: "Ihr Konto wird in 30 Tagen gelöscht; melden Sie sich an, um es zu behalten.", not: "Diese E-Mail ist eine Kontosicherheits-Mitteilung; sie ist unabhängig von der Wochenübersicht." }
};

/* ── E-posta içeriği (saf: Firestore'a ve ağa dokunmaz) ── */
function ilimYoluSayi(v, azami) { v = Number(v); return isFinite(v) && v >= 0 ? Math.min(Math.floor(v), azami) : 0; }
/** Kuyruk belgesinden ({dil, ad, ozet, baglanti, abonelik}) iletiyi kurar. Geçersiz alan → Error('ilim-eposta-<alan>'). */
function ilimYoluEpostaIcerik(b) {
  if (!b || KIMLIK.diller.indexOf(b.dil) < 0) throw new Error("ilim-eposta-dil");
  if (typeof b.baglanti !== "string" || b.baglanti.indexOf(ILIM_YOLU_ADRES) !== 0) throw new Error("ilim-eposta-baglanti");
  if (typeof b.abonelik !== "string" || b.abonelik.indexOf(ILIM_YOLU_ADRES + "api/abonelik-cik?k=") !== 0 || !/^[^\s<>"']+$/.test(b.abonelik)) throw new Error("ilim-eposta-abonelik");
  var m = ILIM_EPOSTA_METIN[b.dil], o = b.ozet || {};
  var ad = typeof b.ad === "string" && /^[a-z0-9][a-z0-9._-]{0,23}$/.test(b.ad) ? b.ad : "";
  var gun = ilimYoluSayi(o.gun, 7), madde = ilimYoluSayi(o.madde, 100000), tekrar = ilimYoluSayi(o.tekrar, 100000);
  var sonraki = ["tekrar", "ezber", "bilgi", "yol", "devam"].indexOf(o.sonraki) >= 0 ? o.sonraki : "devam";
  var adim = m.adim[sonraki], adimMetni = typeof adim === "function" ? adim(tekrar) : adim;
  var satirlar = [m.gun(gun)]; if (madde > 0) satirlar.push(m.madde(madde));
  var bloklar = [{ tur: "paragraf", metin: m.selam(ad) }];
  satirlar.forEach(function (t) { bloklar.push({ tur: "paragraf", metin: t }); });
  bloklar.push({ tur: "baslik", metin: m.baslik }, { tur: "paragraf", metin: adimMetni });
  var secenekler = { kurum: "kurs", onIzleme: m.onizleme, dugme: { metin: m.dugme, url: b.baglanti }, altNot: m.not(b.abonelik) };
  var imza = KIMLIK.yazisma.imza.kurs[b.dil].join("\n");
  return {
    subject: m.konu,
    body: [m.selam(ad)].concat(satirlar, ["", m.baslik, adimMetni, "", b.baglanti, "", imza, "", m.not(b.abonelik)]).join("\n").replace(/\*\*/g, ""),
    htmlBody: veliEpostaZengin(bloklar, b.dil, m.konu, secenekler),
    // RFC 8058 tek tıkla çıkış: Gmail/Yahoo toplu gönderici kuralı. Aynı bağlantı e-posta gövdesinde de görünür.
    headers: { "List-Unsubscribe": "<" + b.abonelik + ">", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
  };
}

/** Hareketsiz hesap uyarısı ({dil, ad, baglanti}). Abonelik bağlantısı/başlığı YOK: hesap güvenliği bildirimidir. */
function ilimYoluHareketsizIcerik(b) {
  if (!b || KIMLIK.diller.indexOf(b.dil) < 0) throw new Error("ilim-eposta-dil");
  if (typeof b.baglanti !== "string" || b.baglanti.indexOf(ILIM_YOLU_ADRES) !== 0 || !/^[^\s<>"']+$/.test(b.baglanti)) throw new Error("ilim-eposta-baglanti");
  var m = ILIM_HAREKETSIZ_METIN[b.dil], s = ILIM_EPOSTA_METIN[b.dil];
  var ad = typeof b.ad === "string" && /^[a-z0-9][a-z0-9._-]{0,23}$/.test(b.ad) ? b.ad : "";
  var bloklar = [{ tur: "paragraf", metin: s.selam(ad) }, { tur: "paragraf", metin: m.bilgi }, { tur: "paragraf", metin: m.koru }];
  var imza = KIMLIK.yazisma.imza.kurs[b.dil].join("\n");
  return {
    subject: m.konu,
    body: [s.selam(ad), m.bilgi, m.koru, "", b.baglanti, "", imza, "", m.not].join("\n"),
    htmlBody: veliEpostaZengin(bloklar, b.dil, m.konu, { kurum: "kurs", onIzleme: m.onizleme, dugme: { metin: m.dugme, url: b.baglanti }, altNot: m.not }),
    headers: undefined
  };
}
function ilimYoluIcerik(tur, b) { return tur === "hareketsiz" ? ilimYoluHareketsizIcerik(b) : ilimYoluEpostaIcerik(b); }

/* ── Firestore (REST; dernek hesabının OAuth belirteci — veli-mail-listesi.gs ile aynı kimlik) ── */
function ilimYoluHttp(yol, yontem, govde) {
  var secenek = { method: yontem, contentType: "application/json", headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
  if (govde) secenek.payload = JSON.stringify(govde);
  var r = UrlFetchApp.fetch(VELI_PORTAL_API + yol, secenek);
  var kod = r.getResponseCode();
  var icerik = null; try { icerik = JSON.parse(r.getContentText()); } catch (e) { icerik = null; }
  return { kod: kod, govde: icerik };
}
/** Belirli durum ve türdeki kuyruk belgeleri: [{id, updateTime, tur, v:{alan:değer}}]. Yanıt gövdesi günlüğe yazılmaz (e-posta adresi içerir). */
function ilimYoluKuyrukOku(durum, adet, tur) {
  var r = ilimYoluHttp(":runQuery", "post", { structuredQuery: {
    from: [{ collectionId: "epostaKuyrugu" }],
    where: { compositeFilter: { op: "AND", filters: [
      { fieldFilter: { field: { fieldPath: "durum" }, op: "EQUAL", value: { stringValue: durum } } },
      { fieldFilter: { field: { fieldPath: "tur" }, op: "EQUAL", value: { stringValue: tur } } }
    ] } },
    limit: adet
  } });
  if (r.kod < 200 || r.kod >= 300 || !Array.isArray(r.govde)) throw new Error("ilim-kuyruk-http-" + r.kod);
  var sonuc = [];
  r.govde.forEach(function (x) {
    if (!x.document) return;
    var id = x.document.name.split("/").pop();
    if (!ILIM_EPOSTA_KIMLIK[tur].test(id)) return;
    var v = {}; Object.keys(x.document.fields || {}).forEach(function (k) { v[k] = veliPortalDegerCoz(x.document.fields[k]); });
    sonuc.push({ id: id, updateTime: x.document.updateTime, v: v, tur: tur });
  });
  return sonuc;
}
/** Kısmi güncelleme. `maske` içinde olup `alanlar`da olmayan alan SİLİNİR. onkosul (updateTime) tutmazsa null döner (başkası kilitlemiş). */
function ilimYoluKuyrukYaz(id, alanlar, maske, onkosul) {
  var yol = "/epostaKuyrugu/" + encodeURIComponent(id) + "?" + maske.map(function (m) { return "updateMask.fieldPaths=" + encodeURIComponent(m); }).join("&")
    + (onkosul ? "&currentDocument.updateTime=" + encodeURIComponent(onkosul) : "");
  var r = ilimYoluHttp(yol, "patch", { fields: alanlar });
  if (r.kod >= 200 && r.kod < 300) return r.govde;
  if (onkosul && (r.kod === 400 || r.kod === 409 || r.kod === 412)) return null;
  throw new Error("ilim-kuyruk-yaz-http-" + r.kod);
}
var ILIM_EPOSTA_TEMIZ = ["eposta", "abonelik"]; // gönderim sonrası kişisel veri belgeden silinir (alan maskede, değerde yok)
function ilimYoluSimdi() { return { timestampValue: new Date().toISOString() }; }

/* ── Günlük sınır ── */
function ilimYoluSayac() {
  var bugun = Utilities.formatDate(new Date(), "Europe/Brussels", "yyyy-MM-dd"), s = {};
  try { s = JSON.parse(PropertiesService.getScriptProperties().getProperty(ILIM_EPOSTA_SAYAC) || "{}") || {}; } catch (e) { s = {}; }
  return s.gun === bugun && isFinite(s.n) ? s : { gun: bugun, n: 0 };
}
function ilimYoluSinir() {
  var v = Number(PropertiesService.getScriptProperties().getProperty(ILIM_EPOSTA_SINIR));
  return isFinite(v) && v > 0 ? Math.floor(v) : ILIM_EPOSTA_GUNLUK;
}

/**
 * Kuyruğu bir tur boşaltır. kuru:true → hiçbir şey kilitlenmez/gönderilmez/yazılmaz; yalnız içerik kurulabiliyor mu sınanır.
 * Dönen sayılar günlüğe yazılır (adres ve içerik yazılmaz).
 */
function ilimYoluEpostaIsle(secenek) {
  var kuru = !!(secenek && secenek.kuru);
  veliPortalKimlikDogrula();
  var kilit = LockService.getScriptLock();
  if (!kilit.tryLock(1000)) return { ok: false, mesgul: true };
  var sayim = { ok: true, kuru: kuru, bakilan: 0, gonderilen: 0, hata: 0, bekleyen: 0, eski: 0, gecersiz: 0, belirsiz: 0, sinir: false };
  try {
    var simdi = Date.now();
    // 1) Kilitli ama bitmemiş (çökmüş tur): belirsiz — ASLA yeniden gönderilmez.
    ILIM_EPOSTA_TURLER.forEach(function (tur) {
      ilimYoluKuyrukOku("gonderiliyor", 20, tur).forEach(function (d) {
        var t = Date.parse(d.v.talepZamani || "");
        if (!isFinite(t) || simdi - t < ILIM_EPOSTA_TAKILI_MS) return;
        sayim.belirsiz++;
        if (!kuru) ilimYoluKuyrukYaz(d.id, { durum: { stringValue: "belirsiz" } }, ["durum"].concat(ILIM_EPOSTA_TEMIZ));
      });
    });
    // 2) Bekleyenler, günlük sınıra kadar.
    var sayac = ilimYoluSayac(), kalan = ilimYoluSinir() - sayac.n;
    var belgeler = []; // hareketsiz uyarı önce (hukuki bildirim), sonra haftalık özet
    ILIM_EPOSTA_TURLER.forEach(function (tur) { belgeler = belgeler.concat(ilimYoluKuyrukOku("bekliyor", ILIM_EPOSTA_PARTI, tur)); });
    for (var i = 0; i < belgeler.length; i++) {
      var d = belgeler[i], v = d.v;
      sayim.bakilan++;
      var zaman = Date.parse(v.zaman || "");
      if (isFinite(zaman) && simdi - zaman > (d.tur === "hareketsiz" ? ILIM_EPOSTA_ESKI_HAREKETSIZ_MS : ILIM_EPOSTA_ESKI_MS)) { // bayat özet/uyarı gönderilmez
        sayim.eski++; if (!kuru) ilimYoluKuyrukYaz(d.id, { durum: { stringValue: "eski" } }, ["durum"].concat(ILIM_EPOSTA_TEMIZ)); continue;
      }
      var sonDeneme = Date.parse(v.sonDeneme || "");
      if (isFinite(sonDeneme) && simdi - sonDeneme < ILIM_EPOSTA_BEKLEME_MS) { sayim.bekleyen++; continue; }
      var icerik;
      try {
        if (typeof v.eposta !== "string" || !epostaGecerli(v.eposta)) throw new Error("ilim-eposta-adres");
        icerik = ilimYoluIcerik(d.tur, v);
      } catch (hata) {
        sayim.gecersiz++; console.error(d.id + " " + hata.message);
        if (!kuru) ilimYoluKuyrukYaz(d.id, { durum: { stringValue: "gecersiz" }, sonHata: { stringValue: String(hata.message).slice(0, 60) } }, ["durum", "sonHata"].concat(ILIM_EPOSTA_TEMIZ));
        continue;
      }
      if (kuru) continue;
      if (kalan <= 0) { sayim.sinir = true; break; }
      // Kilit: updateTime önkoşulu → iki tur aynı belgeyi alamaz.
      var kilitli = ilimYoluKuyrukYaz(d.id, { durum: { stringValue: "gonderiliyor" }, talepZamani: ilimYoluSimdi() }, ["durum", "talepZamani"], d.updateTime);
      if (!kilitli) continue;
      var deneme = ilimYoluSayi(v.deneme, 1000);
      try {
        epostaGonder({ to: v.eposta, subject: icerik.subject, body: icerik.body, htmlBody: icerik.htmlBody, headers: icerik.headers, kurum: "kurs", yedeksiz: true });
      } catch (hata) {
        // Gönderim kesin olarak başarısız (Brevo hatası/anahtar yok): kilidi geri al, ya da yeterince denendiyse bırak.
        sayim.hata++; deneme++;
        var son = deneme >= ILIM_EPOSTA_DENEME;
        console.error(d.id + " gonderim-hatasi " + String(hata.message).replace(/\S+@\S+/g, "").slice(0, 80));
        ilimYoluKuyrukYaz(d.id, { durum: { stringValue: son ? "basarisiz" : "bekliyor" }, deneme: { integerValue: String(deneme) }, sonDeneme: ilimYoluSimdi() },
          ["durum", "deneme", "sonDeneme"].concat(son ? ILIM_EPOSTA_TEMIZ : []));
        continue;
      }
      sayac.n++; kalan--; sayim.gonderilen++;
      PropertiesService.getScriptProperties().setProperty(ILIM_EPOSTA_SAYAC, JSON.stringify(sayac));
      ilimYoluKuyrukYaz(d.id, { durum: { stringValue: "gonderildi" }, gonderim: ilimYoluSimdi() }, ["durum", "gonderim"].concat(ILIM_EPOSTA_TEMIZ));
    }
    return sayim;
  } finally { kilit.releaseLock(); }
}

/** Zamanlı tetikleyici girişi (olay nesnesi yok sayılır). */
function ilimYoluEpostaZamanli() {
  try { var s = ilimYoluEpostaIsle({}); console.log(JSON.stringify(s)); return s; }
  catch (e) { console.error("ilim-eposta " + String(e.message).slice(0, 120)); throw e; }
}
/** Düzenleyiciden elle: gönderim yapmaz, yalnız kuyruğu okuyup içeriğin kurulabildiğini sayar. */
function ilimYoluEpostaSina() { ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL); var s = ilimYoluEpostaIsle({ kuru: true }); console.log(JSON.stringify(s)); return s; }
/** Düzenleyiciden BİR KEZ: 10 dakikalık tetikleyiciyi kurar (varsa yenisini eklemez). */
function ilimYoluEpostaKur() {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  veliPortalKimlikDogrula();
  var varMi = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "ilimYoluEpostaZamanli"; });
  if (!varMi) ScriptApp.newTrigger("ilimYoluEpostaZamanli").timeBased().everyMinutes(10).create();
  return ilimYoluEpostaSina();
}
