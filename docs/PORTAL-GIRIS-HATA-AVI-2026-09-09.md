# Portal girişleri hata avı — 9 Eylül 2026

## Düzeltilen kusurlar

- Veli ve hoca portallarında bütün form değerlerine uygulanan `trim()`, şifrenin
  başındaki ve sonundaki boşlukları da siliyordu. Giriş, şifre belirleme ve şifre
  değiştirme akışlarında şifre artık yazıldığı gibi korunur; diğer alanların
  normalleştirilmesi devam eder.
- Hatırlanan e-posta adresi için doğrudan `localStorage` erişimi, depolamayı
  engelleyen tarayıcılarda ekranın başlatılmasını veya kimlik doğrulama isteğini
  durdurabiliyordu. Başarılı bağlantı gönderiminden sonra bile hata mesajı
  gösterilebiliyordu. İsteğe bağlı tercihler artık `portal-tercihleri.ts` üzerinden
  okunur/yazılır; depolama hatası kimlik doğrulama akışına taşınmaz.
- E-posta bağlantısı başka tarayıcıda veya depolama kapalıyken açılırsa adresi
  elle girerek devam etme ekranı korunur.

## Kanıt ve kapsam

`tests/web/portal-giris.spec.mjs`, gerçek portal TypeScript kodunu paketleyip
Firebase modüllerini bellek içi taklitlerle değiştirir. Sentetik `.test` adresleri
kullanılır; gerçek hesap, e-posta veya Firestore yazımı yoktur.

Düzeltmeden önce 12 masaüstü senaryosu aynı hataları yeniden üretti. Düzeltmeden
sonra TR/FR/EN veli ve Türkçe hoca portallarında 24 mobil/masaüstü senaryosu geçti.
Kontroller şifrenin aynen iletilmesini, depolama engeline rağmen giriş/bağlantı
isteğini ve e-posta bağlantısının elle tamamlanma ekranını kapsar.

Derlenmiş kaynak taraması 882 HTML/CSS dosyasındaki 357 yerel varlıkta eksik
dosya bulmadı. Sayfa içi bağlantı taramasındaki sekiz aday CMS hash yolları,
duyuru filtreleri ve tarayıcının `#top` hedefleridir.

90 ana sayfa TR/FR/EN, 360 ve 1440 pikselde tarandı: hepsi HTTP 200; JavaScript
hatası ve yatay taşma bulunmadı. Ana sayfa ve veli giriş ekranı görsel olarak
incelendi.

Son yayın kopyasında `npm run dogrula:codex` bütünüyle geçti: 158 tarayıcı,
33 ihtida/PDF, 17 Firestore emülatör ve 32 veli e-postası testi; toplam 240 test.
Tip kontrolü, derleme, CMS/panel ve statik site denetimleri de başarılı.

Kanıtlar (yerel): `.codex/cikti/portal-yayin-dogrula.log`, `portal-once.log`,
`portal-sonra.log`, `portal-genel-sayfalar.json`. İlk genel çalışmadaki test
çıktısı çakışması, son doğrulamanın ayrı yayın kopyasında yürütülmesiyle giderildi.

## Sınırlar

Tarayıcı testleri Chromium ve mobil emülasyon kullanır; fiziksel iPhone/Safari
ve gerçek Firebase oturum açma hizmeti bu testlerin kapsamında değildir.
