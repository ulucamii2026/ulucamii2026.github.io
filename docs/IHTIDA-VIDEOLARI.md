# İhtida video dersleri — 9 Eylül 2026

## Davranış

- Öne çıkan ders içerik alanının tamamını kaplar; eski 46 rem genişlik sınırı yoktur.
- Dersler aynı sayfada, yerel HTML `details/summary` akordiyonlarıyla açılır.
- Aynı anda bir ders açık kalır. Ders kapanınca iframe kaldırılır, varsa yerel video
  durdurulur, kapak düğmesi geri gelir. Yeniden açmak videoyu kendiliğinden oynatmaz.
- İlk dersin kapağı açık gelir. Kapaklar yereldir; YouTube yalnız ayrı Oynat eylemiyle yüklenir.
- Mobilde tek akış, masaüstünde başlık ve giriş metni dengeli iki sütun kullanır.
  Klavye odağı, azaltılmış hareket ve koyu tema korunur.

## Doğrulanmış kaynaklar

Türkçe: `src/data/diyanet-videolar.json`, Diyanet Dijital'in 37 bölümlük
“İslam Nedir?” serisi ve 7 kısa video. İngilizce: `src/data/diyanet-videolar-en.json`,
[Diyanet Publications'ın 37 video serisi](https://whatis.islam.gov.tr/videos/en).
İngilizce videoların tamamının oEmbed başlığı ve yayımlayan kanalı 9 Eylül'de
canlı doğrulandı; dizilim Türkçe serinin konularıyla eşleştirildi.

Fransızca: Ali Erbaş'ın Strasbourg Yunus Emre Camii'ndeki Fransızca hutbesi,
[Diyanet Haber yayını](https://www.diyanethaber.com.tr/video/prof-dr-ali-erbas-fransizca-hutbe-ditib-strazburg-merkez-yunus-emre-camii).
Bu video ihtida dersi olarak tanıtılmaz. Fransızca kitaplara da bağlantı bulunur.
Resmî Fransızca video kataloğu araştırma tarihinde boştu; buradan Diyanet'in
başka kanallarında Fransızca video olmadığı sonucu çıkarılmadı.

Öne çıkan dersler: `src/data/ihtida-videolari.json`. Sayfanın dili, video dilini
belirler. Türkçe dersler İngilizce veya Fransızca sayfada gösterilmez.
Her oynatıcıda resmî kaynak sayfası ve normal YouTube izleme bağlantısı bulunur.

## Kapaklar

45 ayrı konu için GPT görsel üretimiyle özgün temsili illüstrasyonlar üretildi.
Türkçe ve İngilizce eş konular aynı illüstrasyonu kullanır; başlık HTML'de sayfanın
kendi dilinde gösterilir. Videonun kendisi değiştirilmez. Kapaklar Diyanet'e ait
video kareleri veya kurumun hazırladığı görseller gibi sunulmaz; bu ayrım sayfada belirtilir.

`public/media/ihtida/kapaklar/kapaklar.json` dosyası ölçü/boyut envanteridir.
45 WebP yaklaşık 4,82 MB tutar, en çok 1280 px genişliğindedir; tembel yüklenir.
Özgün PNG'ler yerel çalışma çıktısında korunur. `scripts/ihtida-kapaklari-hazirla.mjs`
özgün PNG klasörünü alır, görüntü içeriğini değiştirmeden web boyutuna dönüştürür.

## Oynatma sınırı

Oturum açılmamış Chromium'da mevcut şehadet videosunun YouTube iframe'i
“Bot olmadığınızı doğrulamak için oturum açın” uyarısı verdi. Sitenin ve iframe'in
`strict-origin-when-cross-origin` ayarı doğru. Sorun sitemizin giriş sayfası değil,
YouTube'un platform kontrolüdür.

İncelenen Diyanet Dijital, What is Islam?, Diyanet TV, Görüntülü Fetvalar ve
Diyanet Haber sayfaları ilgili içerikleri YouTube üzerinden sunuyor. Diyanet Haber'in
Vidyome katmanı da YouTube kullanıyor. Bu dersler için doğrulanmış bağımsız resmî
MP4 kaynağı bulunamadı. Alternatif kaynak linkleri oturum kontrolünü kaldırma
vaadi değildir; bu sınır oynatma yardımında açıkça belirtilir.

oEmbed 200 yalnızca başlık/kanal bilgisini doğrular. Çevrimdışı testte iframe
oluşturulması gerçek video oynatılabildiği anlamına gelmez.

## Doğrulama

`tests/web/ihtida-videolari.spec.mjs`: üç dil, mobil/masaüstü, tam genişlik,
37 dersin doğru sıralanması, kapak dosyalarının varlığı, tıklama öncesi dış video
isteği olmaması, klavyeyle aç/kapat/oynat, yeniden oynatma, önceki dersin kapanması,
iframe temizliği, yeni sekme açılmaması, kaynak/yardım bağlantıları, açık/koyu tema
axe ve yatay taşma. Genel kalite kapısı: `npm run dogrula:codex`.

EK-9 şahit imzası araştırması ayrı nottadır: `docs/EK9-SAHIT-IMZASI.md`.
Bu video değişikliği PDF imzalarını veya form backend'ini değiştirmez.

## Bu düzenlemenin son kontrolü

9 Eylül 2026: `npm run dogrula:codex` beş kapıda geçti (92 web testi,
17 Firestore testi ve veli e-posta kontrolleri dahil). Yayına ayrılmış temiz
kopya ayrıca `npm ci`, build, site/CMS denetimi ve 6 video tarayıcı testinden geçti.
45 kapak toplu önizlemede; üç dil mobil/masaüstü ve koyu tema örnekleri incelendi.

Mevcut kilit dosyasında `npm audit`, Astro (kritik), Sharp, js-yaml ve SVGO
(yüksek) için toplam dört etkilenen paket bildiriyor. Bu sürümler video
çalışmasından önce de vardı; bu değişiklik paket sürümü değiştirmiyor.
Bunlar ayrı bağımlılık güvenliği işi olarak izlenmelidir. Video testlerinin
geçmesi bu bildirimlerin çözüldüğü anlamına gelmez.
