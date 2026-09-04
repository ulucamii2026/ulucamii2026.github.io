/* Yönetim paneli giriş kapısı — /admin/ ve /admin/icerik/ (Sveltia CMS) aynı dosyayı yükler.
   Üç koşul birden aranır: (1) GitHub anahtarı (Sveltia'nın beklediği yerde, localStorage),
   (2) panel sırları (sessionStorage — sekme kapanınca silinir), (3) 12 saati aşmamış oturum damgası.
   Biri eksikse kalıntı temizlenip giriş sayfasına dönülür.

   Neden ortak dosya: kapı iki HTML'de ayrı ayrı yazılıyken içerik yönetimi tarafı yalnız
   «anahtar var mı» diye bakıyor, 12 saat sınırını hiç uygulamıyordu — ortak bilgisayarda
   «Çıkış»a basılmadan bırakılan oturum, doğrudan /admin/icerik/ adresinden süresiz açık
   kalıyordu (4 Eylül 2026 denetimi). Tek kaynak: biri güncellenip öbürü unutulamaz.
   Panel sırları yalnız /admin/ (panel) için aranır: içerik yönetimi Sveltia'nın kendi anahtarıyla
   çalışır, sırlara ihtiyacı yoktur; sessionStorage sekmeye özel olduğundan yeni sekmede açılan
   içerik yönetimi boş yere giriş sayfasına düşmesin.
   Bu betik <body> başında eşzamanlı (defer'siz) yüklenir; yönlendirme sayfa çizilmeden olur. */
(function () {
  var SURE = 12 * 60 * 60 * 1000;
  var panel = /^\/admin\/(index\.html)?$/.test(location.pathname);
  var temizle = function () {
    try {
      ['sveltia-cms.user', 'panel-oturum', 'panel-basvuru-v1', 'panel-trafik-v3'].forEach(function (k) { localStorage.removeItem(k); });
      ['panel-sirlar', 'panel-basvuru-v2', 'panel-trafik-v4'].forEach(function (k) { sessionStorage.removeItem(k); });
    } catch (e) {}
  };
  try {
    var u = JSON.parse(localStorage.getItem('sveltia-cms.user') || 'null');
    var s = JSON.parse(sessionStorage.getItem('panel-sirlar') || 'null');
    var o = JSON.parse(localStorage.getItem('panel-oturum') || 'null');
    var doldu = !o || !o.baslangic || (Date.now() - o.baslangic) > SURE;
    var sirlarEksik = panel && (!s || !s.gh);
    if (!u || !u.token || sirlarEksik || doldu) { temizle(); location.replace('/admin/giris.html'); }
  } catch (e) { temizle(); location.replace('/admin/giris.html'); }
})();
