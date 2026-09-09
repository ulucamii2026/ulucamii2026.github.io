# İhtida cami seçimi ve belge tutarlılığı — v26

09.09.2026. Bu değişiklik yerelde hazırlanmıştır; bu belge canlı yayın kanıtı değildir.
Önceki canlı v25 durumu `IHTIDA-OTOMASYON-v25.md` içindedir.

## Form ve kayıt

- Formun başında cami adı, şehir veya posta koduyla arama; listede yoksa elle giriş vardır.
- Varsayılan `ulucamii-marche` kaydıdır. Katalogdaki kimlik sunucuda çözülür; istemcinin değiştirdiği ad/adres kopyasına güvenilmez.
- Katalog tek kaynaktır: `public/data/belcika-camileri.json`. Kapsam ve kaynaklar `BELCIKA-CAMI-KATALOGU.md` içindedir.
- Başka cami seçimi iki farklı şahidin elle girilmesini gerektirir. Önceki caminin şahit adları yeni seçime taşınmaz; Rıdvan/Yeliz kayıtlı imzaları kullanılamaz.
- Eski kayıtta cami alanı yoksa Ulu Camii kabul edilir. Açıkça verilen geçersiz cami kimliği varsayılana çevrilmez.
- Ulusal kimlik numarası formda istenmez. Başvuranın ikamet adresi ile belgenin postalanacağı adres farklı kavramlardır.
- Kayıt sütunlarına cami kimliği, adı, şehri, posta kodu, adresi ve kurumu eklendi. Eski sütunların sırası korundu.

## Belgeler ve teslim

- Seçilen cami, admin ekranına ve aynı PDF üreticisine aktarılır. Dilekçedeki tören cümlesi, yer-tarih satırı ve cami adresi aynı kaydı kullanır.
- EK-9 arka sayfasındaki adres kişinin ikamet adresidir. Dönüş posta adresi ayrıca dilekçede belirtilir: seçilen cami veya kişinin adresi.
- İşlem yapan kurum olarak Ulu Camii adı ve iletişim bilgileri kalır; başka cami seçmek o camiye otomatik başvuru/e-posta göndermez.
- Mevcut üç alıcı ve özel arşiv düzeni korunur: info@ulucamii.be, imam@ulucamii.be, başvuran. Yeni bir gerçek e-posta gönderim denemesi yapılmadı.
- Tören tarihi ve şahit imzaları teyitsiz tamamlanmış sayılmaz. Müşavirin imza alanı ıslak imza için boş kalır.
- Dilekçe, uzun bilgilerde metin veya imzayı sıkıştırmak yerine devam sayfasına akar. Bu nedenle tam paketin sayfa sayısı içeriğe göre değişebilir; bütün ekler tek PDF'de kalır ve admin gerçek sayfa sayısını gösterir.
- TR/FR/EN site metinleri Fransızca hutbeyi, imamla Fransızca iletişimi, iki dilli hafta sonu kurslarını ve Müşavirlikten posta dönüşünü açıklar.

## Yeni EK-10 sınırı

İki sayfa, dört dil ve tek ortak imzalı yeni EK-10 kullanıcı incelemesi için ayrı PDF taslağıdır. Sitedeki mevcut EK-10 şablonu ve otomatik imza koordinatları bu taslakla değiştirilmedi. Onaydan sonra şablon, rıza metinleri ve imza üretimi birlikte ele alınmalıdır.

## Yayın sırası

1. Kullanıcı yayın izni verdiğinde yalnız dernek hesapları ve proje sarmalayıcıları kullanılır.
2. `npm run ihtida:gas-derle` ile v26 dosyası hazırlanır; komut yalnız yerel çıktı üretir.
3. Önce GAS v26 dağıtılır; sağlık cevabında `surum:26`, `ihtidaPaketHazir:true`, `ihtidaCamiSecimi:true` doğrulanır.
4. Sonra frontend ve admin birlikte yayımlanır. Yeni form minimum v26 ister; eski backend'e yeni cami verisini kayıpsız kaydediyormuş gibi göndermez.
5. Canlı işlemler ve gerçek e-posta teslimi ayrıca doğrulanır. Yerel testler localhost ve demo Firestore kullanır.

## Doğrulama

`npm run dogrula:codex`: Astro kontrolü, site/PDF denetimleri, ihtida sözleşme testleri, üç dilde mobil/masaüstü tarayıcı senaryoları ve demo Firestore güvenlik testleri.

Yerel PDF örnekleri yalnız sentetik kişilerle üretildi. Namur ve uzun manuel cami adı/adresi; iki farklı şahit; geçersiz cami; eski kayıt; camiden/adresten teslim yolları denetlenir. Arama açık/kapalı, klavye, taslak geri yükleme/silme, açık/koyu tema ve yatay taşma tarayıcıda kontrol edilir.

09.09.2026 son doğrulaması: `npm run dogrula:codex` başarılı; Astro 0 hata / 0 uyarı, 867 sayfalık build, ihtida/PDF 17/17, tarayıcı 56/56 ve Firestore 17/17 geçti. Toplam 90 test. Maksimum cami adı (120), şehir (80), adres (200) ve uzun başvuran adıyla iki sayfalık dilekçe üretildi; metin kutularının yatay/dikey sınırları ve imza yerleşimi denetlendi. Derlenmiş site 4399 portunda mobil/masaüstü, açık/koyu tema ile görsel incelendi. Gerçek telefon/Safari testi yapılmadı.
