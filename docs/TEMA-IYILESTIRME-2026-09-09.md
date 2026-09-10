# Ana sayfa ve tema — 9 Eylül 2026

Kullanıcı yönü: daha ferah, zarif, bütünlüklü ve dinamik bir site; ana sayfada
[Belçika Diyanet Vakfı](https://diyanet.be/) tasarımını örnek alma.
Referansın ana sayfası tarayıcıda görsel olarak incelendi.

## Uygulanan düzen

- Ana sayfada iki sıralı kurumsal üst menü; mavi hizmet bağlantıları.
- Kur’an kursu, veli portalı, ihtida başvurusu ve cenaze hizmetlerine hızlı erişim.
- Geniş cami fotoğrafları ve yanında günlük namaz vakitleri; telefonda tek sütun.
- Fotoğrafların üzerindeki yazılar için sabit, koyu okunabilirlik zemini.
- Mevcut fotoğraf slaytının seçim ve duraklatma denetimleri görünür üst köşede.
- Duyuru şeridi vitrin altında; güncel duyurular hizmetlerden önce gelir.
- Hizmetler ve haftalık program masaüstünde yan yana, telefonda alt alta.
- Ortak temada daha hafif zeminler, sade kilim motifi, tutarlı düğme ölçüleri,
  daha geniş form aralıkları; koyu tema sıcak koyu griden oluşur.
- Menü açılışı ve hizmet bağlantılarında kısa hareketli geri bildirim.
  Azaltılmış hareket tercihinde konum/ölçek efektleri kapalıdır.
- TR, FR ve EN sayfaları aynı yapıyı kullanır. Namaz verisinin kaynağı veya
  başvuru/e-posta/backend politikası bu çalışmada değiştirilmedi.

## Kontrol sırasında düzeltilenler

- Müfredat başlıklarındaki numaraların açık temadaki kontrastı yetersizdi;
  temaya uyumlu mavi vurguya geçirildi.
- İmza küçültme testi ham fare koordinatlarıyla sabit menünün arkasını
  işaretleyebiliyordu. Tuval merkezlenir ve hedef noktanın tuvale ait olduğu
  doğrulanır; imza/PDF beklentileri aynen korunur.

## Doğrulama

Ana sayfa 1440 piksel masaüstü, 768 piksel tablet ve 390 piksel telefon
görünümlerinde incelendi. İhtida formunun açık/koyu mobil görünümü de incelendi.
Otomatik testler ayrıca üç dilde 320, 768 ve 1024 piksel taşma kontrolü,
klavyeyle fotoğraf seçimi, duraklatma tercihinin saklanması ve hareket azaltmayı kapsar.

Son toplu doğrulama günlüğü: `.codex/cikti/tema-son-dogrula.log`.
`npm run dogrula:codex` tamamlandı: tüm kalite kapıları geçti.
134 web, 33 ihtida/PDF, 17 Firestore kuralı ve 32 veli e-postası testi başarılı.
Astro tip kontrolünde 0 hata ve 0 uyarı; mevcut geliştirme ipuçları devam ediyor.
İlk çalıştırmada bulunan kontrast ve test koordinatı sorunları düzeltildikten
sonra tam doğrulama yeniden çalıştırıldı. Değişikliklerde `git diff --check` temiz.

Kullanıcının açık yayın talebi üzerine 9 Eylül 2026'da canlıya alındı.
Yayın commit'i: `fa9e9f153b50daeb877187290e8718084b5e56dc`.
[GitHub Pages yayın kaydı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/34369981184)
başarıyla tamamlandı. Temiz yayın kopyasında da 216 test geçti
(`.codex/cikti/canli-oncesi-dogrula.log`). Canlı TR/FR/EN ana sayfalarında
HTTP 200 ve yeni vitrin yapısı doğrulandı; ihtida başvuru sayfası ile FR/EN
vaaz sayfaları da HTTP 200 verdi. Canlı ana sayfa tarayıcıda incelendi,
kaydedilen konsol hata listesi boştu.

Gerçek başvuru, e-posta gönderimi veya canlı Firebase yazması yapılmadı.
Apps Script kaynakları depoda güncellendi; bu yayın Google Apps Script
dağıtımı veya zamanlanmış görev değişikliği yapmadı.

## Şahit imzası

Resmî genelgenin 44/3 hükmü yeniden çevrimiçi doğrulandı: EK-9 nüshaları
mühtedi, şahitler ve müftü/müşavir/ataşe tarafından imzalanır; müşavir imzası
tek başına bu usulü tamamlamaz.
[Kaynak ve ayrıntılar](EK9-SAHIT-IMZASI.md).

Basılı nüshaya eklenen imza görselinin ıslak imza yerine kabul edildiği
genelgede belirtilmez. Mevcut belge/imza otomasyonu araştırma talebiyle değiştirilmedi.
