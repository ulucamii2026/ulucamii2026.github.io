# Veli ve öğrenci öğrenme atölyesi

12 Eylül 2026 uygulaması. Araştırma: [pedagojik rapor](VELI-OGRENCI-PEDAGOJIK-ARASTIRMA.md).
Bu not canlıya yayın kanıtı değildir. Önceki oturumun yerel değişiklikleri korunmuştur.

## İşlevler

- Veli ve öğrenci panosunda aynı öğrencinin öğrenme alanı; TR/FR/EN.
- 65 etkinlik: 28 harf, mevcut 19 sûre/dua, 10 bilgi sorusu, 8 özgün hayat durumu.
- Günlük en çok üç etkinlik: vadesi gelenler önce, farklı alanlar birlikte.
- Üç çalışma biçimi: yetişkinle başlangıç, biraz yardımla çalışma, bağımsız deneme.
  Bunlar seviye sınavı veya yaş sınıflandırması değildir. Bütün içerikler kütüphanede bulunur.
- Sesi dinleme, cevabı seçme, açıklama, kendi cümlesiyle anlatma ve öz değerlendirme.
- Aynı gün tekrar basamağı artmaz. Rahat hatırlamada sırasıyla 1/3/7 gün;
  destek ihtiyacında ertesi gün önerilir. Bu aralıklar uygulama kararıdır.
- Arama, alan filtresi, boş sonuç, klavye odağı, açık/koyu tema, 48 px düğmeler.
- Sekiz aile rehberi, günlük hazırlık kontrol listesi ve yazdırılabilir haftalık kâğıt.
- Hocaya yardım mesajı hazırlanır; metin boş değilse korunur. Gönderim veliye aittir.

## Kod haritası

| Sorumluluk | Dosya |
|---|---|
| İçerik ve özgün senaryolar | `src/lib/ogrenme-icerigi.ts` |
| Tarih, kayıt doğrulama, tekrar seçimi | `src/lib/ogrenme-ilerleme.ts` |
| Üç dilli kumandalar | `src/i18n/ogrenme.ts` |
| Bağımsız alan ve yazdırma | `src/scripts/ogrenme-atolyesi.ts` |
| Ana panoya bağlama / ses ve yardım taslağı | `src/scripts/veli-portali.ts` |
| Mobil ve tema düzeni | `src/styles/ogrenme-atolyesi.css` |
| Mantık / varlık doğrulama | `tests/ogrenme-ilerleme.test.mjs` |
| Gerçek kodla sentetik aile testi | `tests/web/ogrenme-atolyesi.spec.mjs` |

## Verinin anlamı

Yerel anahtar `ulucamii_ogrenme_v1:<hesap>:<öğrenci>` ile ayrılır. Anahtardaki
URL kodlaması şifreleme değildir. Kayıtta çalışma kimliği, tarih, öz değerlendirme,
tekrar basamağı ve çanta işaretleri tutulur; fotoğraf/ses/biyometri toplanmaz.
Öğrenci değişince alan yeniden kurulup doğru kapsamdan okunur. Öğretmen notu,
merkezî yoklama ve aile iletişim dili değiştirilmez.

Depolama reddinde alan bellekte çalışır ve kalıcılık uyarısı gösterir. Bozuk
kayıt, bilinmeyen etkinlik, gelecekte yapılmış görünen çalışma ve uygunsuz tarih
ayıklanır. Temizleme yalnız seçili öğrencinin bu alandaki yerel kaydını sıfırlar;
diğer öğrenci ve portal verilerini temizlemez. Hesap eşleştirmesi aşağıdaki ikinci turda eklenmiştir.

## Ses eksiklerinin kapatılması

10 İngilizce ve 1 Fransızca hadis **anlam** kaydı üretildi. Mevcut Gemini
servisi HTTP 429 döndürdüğü için yerel Windows SAPI sesleri kullanıldı:
Microsoft Zira Desktop / Microsoft Hortense Desktop. Kur’an/Elifba kayıtları
değiştirilmedi; tilavet yalnız Diyanet kaynağındadır.

Ses üretimi `D:\sesli-anlatim` altında yapıldı. 11 MP3 kodlaması `ffprobe` ile
doğrulandı; metinler yerel Whisper tiny ile karşılaştırıldı. İngilizce teşekkür
kaydındaki Allah kelimesi `ɑˈlɑh` IPA ile düzeltilip tam cümle yeniden doğrulandı.
Konuşma tanıma bir insanın dinleyerek telaffuz/kalite onayı vermesiyle eşdeğer
değildir; diğer sonuçlarda küçük yazım ve bağlaç farklılıkları bulunabilir.
Arayüz bunları otomatik anlam seslendirmesi olarak etiketler.

Kaynak metin, motor, dil, ses ve SHA-256 bilgisi:
`src/data/hadis-anlam-sesleri.json`. Dosyalar
`public/media/ses/hadisler/{en,fr}/` içindedir. Kaydın etkinleşmesi derlemedeki
dosya varlığı manifestiyle olur. Çeviri metni değiştirilirse kayıt da yeniden
üretilmeli ve kaynak eşleştirmesi kontrol edilmelidir.

## Araştırma çıktısı

Raporun düzenlenebilir kaynağı `docs/VELI-OGRENCI-PEDAGOJIK-ARASTIRMA.md`;
PDF `output/pdf/Veli-Ogrenci-Pedagojik-Arastirma.pdf`.
Üretim: `python scripts/pedagoji-raporu.py` (ReportLab ve Windows Arial fontları).
Genişletilmiş PDF altı sayfadır; Türkçe metin ve 20 tıklanabilir kaynak bağlantısı doğrulandı.
Doğum yeri sorusunun açıklamasındaki kesin 571 yılı kaldırıldı; soru Mekke'yi
sorar. TDV maddesi farklı tarih hesaplarını aktarır:
[Hz. Muhammed](https://islamansiklopedisi.org.tr/muhammed).

## İlk tur doğrulaması (yayın öncesi tarihçe)

`npm run dogrula:codex` geçti: 292 tarayıcı testi, 17 Firebase kural testi,
32 e-posta testi, 12 otomatik kayıt testi ve 5 öğrenme mantığı/varlık testi.
870 sayfa derlendi. Testler demo emülatör ve sentetik `.test` aileleri kullanır.
Öğrenciler arası kayıt ayrılığı ve yazdırma kapsamı ayrıca sınandı.

Yerel kanıt: `D:\tmp\ulucamii-atolye-tam.log`.
Son metin ve telaffuz düzeltmeleri sonrasında 870 sayfalık derleme tekrar
geçti; öğrenci modu ve atölye testleri birlikte **50/50** geçti
(`D:\tmp\ulucamii-atolye-son-build.log`, `D:\tmp\ulucamii-atolye-son-test.log`).
Yerel önizleme `http://localhost:4399` üzerinde hazırdır.
75 mevcut medya önerisi vardır; hata değildir. Gerçek veli hesabı ve telefonla
ses dinleme, canlı veri eşitleme, yayın ve gerçek mesaj gönderimi bu testin
kapsamında değildir. Hiçbir commit/push/yayın yapılmadı.


## İkinci tur: hoca ataması ve hesapta çalışma defteri

- `odevler/{haftanın ilk ders tarihi}.etkinlikler`: katalogdaki en fazla üç kimlik.
  Hoca ekranında üç seçici vardır; boş ve yinelenenler kayıtta ayıklanır.
  Veli yalnız yayınlanmış ve içinde bulunulan haftaya ait atamayı görür.
  TR/FR yanında EN ezber/ödev düzenlemesi ve önceki haftadan kopyalanması eklenmiştir.
- `src/lib/ogrenme-bulut.ts`: `evCalismalari/{ref}/etkinlikler/{id}` altında
  en fazla 65 belge. Firestore alanları `son`, `sonraki` (Timestamp), `basamak`,
  `cevap`, `guncelleme` (serverTimestamp). Kimlik/ad/yanıt metni tutulmaz.
- Yalnız bağlı veliler yazar; bağlı veliler ve hocalar okur. Veli öğretmen
  notunu değiştiremez. Katalog dışı id, ek alan, bozuk tarih/basamak, eski tarihli
  üstüne yazma ve sahte sunucu zamanı emülatörde reddedildi. Hoca bu kayıtları
  gerektiğinde silebilir; veliye ait öz değerlendirme olarak kendisi yazamaz.
- `runTransaction` en fazla üç deneme yapar. Yeni tarih korunur; aynı günde
  daha düşük tekrar basamağı/daha fazla destek isteyen bildirim korunur.
  Öğrenci değişimi/çıkış sonrasında geç gelen yanıt arayüzü veya yerel kaydı değiştirmez.
- İlk açılış ve yeniden eşleştirme okumayı yapar. Yeni tek değerlendirme yalnız
  ilgili belgeyi işlemle okur/yazar; her yanıtta 65 belge yeniden okunmaz.
  Sürekli dinleyici veya arka planda zamanlayıcı yoktur.
- Gönderilecek yerel sıra `<yerel-anahtar>:bekleyen` altındadır. Ağ dönünce
  veya düğmeyle yeniden denenir. Sayfayı kapatmadan önce tarayıcı kaydı başarısızsa
  ekranda uyarı vardır; çevrimdışı kalıcılık garantisi verilmez.
- Eski yerel geçmiş otomatik yüklenmez. Çanta ve çalışma biçimi yereldir.
  Temizleme yerel sıra dahil bu cihazdaki kaydı siler; hesap verisi yeniden
  eşleştirmede gelir. Hesap kayıtlarının silme talepleri idareye iletilir.
  Hoca ekranındaki **Bülten · İdare** bölümü bu alt koleksiyonu da öğrenci
  dökümüne ve kontrollü silmeye dahil eder. Giriş hesabı ve asıl kayıt defteri
  ayrı işlemdir. Ayrıntı: [Bülten ve idare](HAFTALIK-BULTEN-VE-IDARE.md).
- Hoca öğrenci kartındaki evde çalışma bölümü son bildirimi gösterir.
  Boş kayıt, öğrencinin evde çalışmadığı anlamına gelmediği açıklaması taşır.
  Yanlış cevap açıklamadan sonra yeniden denenebilir; konu hazır yardım taslağı
  veli tarafından görülmeden/gönderilmeden iletişim servisine gönderilmez.

Test dosyaları: `tests/web/ogrenme-bulut.spec.mjs`,
`tests/kurallar/firestore.test.mjs`, `tests/ogrenme-ilerleme.test.mjs`.
Canlı yayın kanıtı ayrı tarihli yayın notunda tutulur.


## İkinci turun son kalite kapısı ve kural yayını — 12 Eylül 2026

`npm run dogrula:codex` bütünüyle geçti. 306 web, 22 Firestore kuralı,
32 e-posta, 12 otomatik kayıt, 7 öğrenme testi; 870 sayfalık derleme,
Astro 0 hata/0 uyarı (mevcut geliştirme ipuçları ayrıca raporlanır).
Kanıt: `D:\tmp\ulucamii-yayin-son-kapi.log`. Önceki başarısız turdaki
Firebase giriş taklidi yeni statik modül dışa aktarımlarına göre düzeltildi;
son turda giriş, şifre korunması ve depolama engeli senaryoları geçti.

Mobil/masaüstü, açık/koyu atölye ve hoca ekranı görüntüleri incelendi.
`npm run onizle` ile çalışan 4399 önizlemesinde gerçek giriş sayfası da açıldı.
Araştırma PDF'si altı sayfa ve 20 bağlantı; sayfa görüntüleri incelendi.

Canlı kurallar yalnız dernek hesabıyla 14:27 UTC'de yayınlandı. Yayından önce
mevcut kurallar önceki Git sürümüyle eşleşti; yedeği alındı. Yayından sonra
Rules API'den tekrar okunan içerik yerel dosyayla birebir eşleşti (satır sonları
normalleştirilerek SHA-256):
`a3a67bea1e5b01ca7ee7ca379b347d678c745d50d741c8a3a6e797a7682b14d5`.
Ruleset: `36a33a41-d2ae-4ce6-9e98-09837635d613`.

Site dağıtımının bağımsız kanıtı, bu değişiklikleri içeren commit için
[Pages iş akışı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/workflows/deploy.yml)
sonucudur. Gerçek aileye test mesajı gönderilmedi veya test öğrencisi yazılmadı.
Gerçek telefon/iOS ses oynatımı ve insan telaffuz değerlendirmesi bu otomatik
kontrollerin kapsamı dışındadır.
