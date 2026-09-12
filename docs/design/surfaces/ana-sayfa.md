# Ana sayfa yüzey notu

**Mod:** Persuade + Read  
**Hedef:** İlk bakışta camiyi, güncel yayını ve ziyaretçinin yapabileceği işi
anlatmak; aşağı doğru indikçe eğitim, duyuru ve ziyaret bilgisine düzenli geçiş.

## Ziyaretçi işi

Ziyaretçi güncel bir duyuruyu açar, namaz vaktini görür, Kur’an kursu veya veli
portalına ilerler ya da caminin adresine ulaşır. Birincil eylem her dilde aynı
yerleşimde kalır; metin dili `Dil` seçimine göre çevrilir.

## Kompozisyon

`GundemVitrini.astro` güncel yayınları üstte toplar; ana sayfa çalışma zamanı
vitrini bu bileşendir.
`AnaSayfaAkisi.astro` haftalık yaşam, duyurular/takvim, hizmetler, ziyaret ve
bağış bantlarını ritimlendirir. Masaüstünde iki kolon bilgi karşılaştırmasını
kolaylaştırır; telefonda her bölüm tek kolona iner.

## Görsel ve hareket

İlk vitrin görseli eager, devamı lazy yüklenir; posterler yerel medya yolundan
gelir ve doğal oranı korunur. Poster çevresindeki boşluklar aynı görselden
türetilen yumuşak bir arka planla dengelenir; görsel kırpılmaz. Otomatik geçişin
yanında önce/sonra, duraklat ve seçim bağlantıları vardır. Duraklatma tercihi
vitrinle duyuru şeridini birlikte kontrol eder ve yeniden yüklemede korunur.
Kullanıcı azaltılmış hareket seçtiğinde otomatik geçiş varsayılan olarak kapalıdır.
Üçüncü taraf video veya küçük resim isteği ilk yüklemede başlatılmaz.

## İçerik sınırları

Güncel duyuru ve etkinlik metinleri CMS kaynaklıdır. İngilizce içerik Fransızca
geri dönüşle geldiğinde bu durum açıkça belirtilir; tarih veya kurum bilgisi
uydurulmaz. Namaz vakitleri yalnız Diyanet verisidir.

## Kabul ölçütleri

- Başlık ve güncel yayın ilk viewport içinde okunur.
- Vitrin kontrolleri klavye ile ulaşılabilir ve aktif yayın belirtilir.
- 390 px genişlikte yatay taşma ve kesilmiş başlık yoktur.
- Açık/koyu temada metin ve odak kontrastı korunur.


## Görünmeyen afişlerin yüklenmesi — 12 Eylül 2026

Fade geçişinde bütün slaytların kutuları görüş alanında kaldığından `loading=lazy`
büyük afişleri ertelemiyordu. Ayrıca bulanık arka plan değişkeni her slaytta gerçek
URL taşıyordu. İlk slaytın resmi ve arka planı sunucudan hazır gelir; diğerlerinde
aynı ölçüyü koruyan veri URI'si ve `data-afis-src` bulunur. Seçimde gerçek `src`
ve arka plan birlikte etkinleşir. Daha önce yüklenen afiş yeniden boşaltılmaz.
Küçük film şeridi görselleri ve afişi açan normal bağlantılar korunur.

Mobil Chromium, 390×844, azaltılmış hareket, networkidle koşulunda görüntü kaynaklarının
encodedBodySize toplamı önce 1.001.381 bayt, düzeltmede 405.847 bayt ölçüldü
(yaklaşık %59 azalma). Bu, aynı içerikle ilk açılışın görsel verisidir; bütün site
trafiği veya her kullanıcının hız kazancı için garanti değildir. Otomatik slayt
geçişi son LCP adayını değiştirebildiğinden tek LCP sayısı ilk afişin açılışı olarak
sunulmaz. Var olan yavaş telefon ölçüm betiğinin sınırı da budur.

`tests/web/vitrin.spec.mjs` görünmeyen son afişin istenmediğini, seçilince resim
ve bulanık arka planın yüklendiğini mobil/masaüstünde doğrular. Görsel tasarım,
klavye, modal ve azaltılmış hareket senaryoları mevcut kalite kapısındadır.

Son kalite kapısı da bütünüyle geçti: 308 web, 22 güvenlik, 32 e-posta, 12 otomatik kayıt, 7 öğrenme testi. Kanıt: `D:\tmp\ulucamii-performans-son-kapi.log`.
