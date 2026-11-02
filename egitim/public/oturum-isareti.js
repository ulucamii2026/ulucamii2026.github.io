/* Oturum işareti okuyucu (İlim Yolu, 2 Kasım 2026): boyamadan önce <html data-oturum> koyar ki giriş yapmış ve ziyaretçi görünümü
   sıçramasın. FIREBASE'SİZ: yalnız localStorage'daki işarete (egitim/src/lib/hesap/isaret.ts, anahtar `ilimYolu:oturum`, 32 onaltılık hane)
   bakar; değeri hiçbir yere yazmaz, ağa çıkmaz. Depo kapalıysa sessizce ziyaretçi görünümü kalır. */
(function () {
  try {
    var v = window.localStorage.getItem('ilimYolu:oturum');
    if (v && /^[0-9a-f]{32}$/.test(v)) document.documentElement.setAttribute('data-oturum', '1');
  } catch (e) { /* depo kapalı */ }
})();
