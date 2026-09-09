# İhtida tam PDF ve e-posta akışı — 9 Eylül 2026

9 Eylül'de kullanıcı canlıya alma ve kontrollü gönderim doğrulamasına onay verdi. Yayın, mevcut Apps Script dağıtımı ve dernek GitHub hesabıyla yürütülür. Başlangıç canlı sürümü 23'tür; yeni kodun dosyada bulunması canlı sürüm kanıtı değildir. Sonuçlar aşağıdaki canlı doğrulama bölümüne kaydedilir.

## Başvuru ve belge

- Form, başvuranın posta adresini ayrı sokak/numara, posta kodu, şehir ve ülke alanlarıyla alır. Kimlik numarası alanı yoktur.
- Başvuru kaydı tamamlanınca özel Drive klasöründe kalıcı bir paket işi oluşturulur. Dakikalık Apps Script tetikleyicisi PDF'yi üretir; form HTTP isteği PDF ve e-posta işlemlerini beklemez.
- Tek dosya: EK-9 (2 sayfa), EK-10 (2 sayfa), dilekçe ve kimlik/pasaport örneği. Olağan paket 6 sayfadır; sığmayan uzun metinler açıklama ekine eklenir.
- Başvuranın rızayla verdiği imza dört imza alanına taşınır. İmzasız başvuruda bu alanlar boş kalır. İmzasız metin imzalanmış gibi konuşmaz.
- Ön başvuru nüshasında gerçek tören tarihi uydurulmaz; şahit adları önerilir, şahit imzaları kullanılmaz. EK-9'da ön başvuru ibaresi bulunur; dilekçe gerçekleşmiş tören beyanı içermez.
- Yönetici, “Son nüshayı onayla ve gönder” ile gerçek ihtida tarihini, adresi ve şahitleri kontrol eder. Kayıtlı şahit imzaları ancak o belgedeki işaretli teyitlerden gelir. Gelecekteki tören tarihi reddedilir.
- Salih GÖR ve resmî unvanı basılır; Müşavirin ıslak imza alanı boş kalır. Millî kimlik numarası, belge numarası ve resmî düzenleme alanları kullanıcı kararına göre boş kalır.

## Arşiv, alıcılar ve kesintiler

- PDF bir kez özel Drive klasöründe oluşturulur. SHA-256 özeti kaydedilir; gönderimden önce arşivdeki dosyayla karşılaştırılır. Admin ve e-posta ekleri aynı dosyayı kullanır. Drive genel paylaşıma açılmaz.
- Alıcılar sunucuda belirlenir: `info@ulucamii.be`, `imam@ulucamii.be`, defterdeki başvuran e-postası. Her birine ayrı ileti gönderilir. İstemcinin alıcı, PDF eki veya dış şablon URL'si belirlemesine izin verilmez.
- Eski HTML özet PDF'si artık otomatik bildirim eki değildir. E-postayı yalnız tam paket kuyruğu gönderir.
- Gönderim öncesi durum diske kaydedilir. Brevo ileti kimliğiyle teslim olayları takip edilir. API kabulü “teslim edildi” sayılmaz; teslim, alıcı sunucusunun kabulüdür, okundu garantisi değildir.
- Bir ağ zaman aşımında ikinci sağlayıcıya düşülmez ve bilinmeyen sonuç otomatik yeniden gönderilmez. Böylece çift e-posta riski sınırlandırılır; admin “sonuç belirsiz” görür.
- Yanıtı kaybolan gönderimler, yalnız aynı başvuru revizyonu ve alıcıya ait tekil Brevo ileti kimliği bulunursa teslim takibine döner. Başka nüsha/alıcı olayları ve birden fazla ileti kimliği başarı sayılmaz.
- Bilinen başarısız gönderimler en fazla üç otomatik deneme alır. Yönetici yeniden deneme düğmesiyle başarısız hazırlama/gönderimleri tekrar sıraya koyabilir. Başarıyla gönderilmiş kopyalar tekrarlanmaz.
- Aynı form gönderim anahtarı ikinci başvuru oluşturmaz. Satır kaydolup kuyruk yazımı kesilmişse tekrar istek kuyruğu tamamlar. Admin onayının tekrarında aynı işlem anahtarı yeni revizyon oluşturmaz.
- Bozuk/eksik fotoğraf, kimlik eki veya rıza durumunda eksik PDF gönderilmez. Hata admin panelinde görünür.
- Bir başvurunun iş dosyası okunamazsa hata o başvuruya yazılır; kuyruk diğer başvurularla devam eder.

## Kaynak ve dağıtım

Ana kaynaklar:

- `scripts/apps-script/ulucamii-Kod-v25.gs`: form alıcısı, doğrulama, defter ve yönlendirme.
- `scripts/apps-script/ihtida-paket-isleri.gs`: özel arşiv, kuyruk, teslim takibi, admin uçları.
- `scripts/apps-script/ihtida-pdf-entry.js`: defter → ortak PDF üreticisi eşlemesi ve GAS font uyarlaması.
- `public/admin/ihtida-paket.js`, `ek9.js`, `ek10.js`, `dilekce.js`: ortak PDF üreticileri.
- `scripts/ihtida-gas-derle.mjs`: yalnız açık şablon, font ve kodlardan dağıtım dosyası üretir. Anahtar, kimlik görseli veya şahit imzası gömmez.

`npm run ihtida:gas-derle` çıktısı `.codex/cikti/gas/ulucamii-v25.gs` dosyasıdır. Apps Script'e **bu derlenmiş dosya** yüklenir; yalnız `ulucamii-Kod-v25.gs` kopyalanırsa PDF üreticisi eksik kalır. Tam font gömme, fontkit'in GAS'ta bulunmayan timer/akış API'lerine ihtiyaç duymasını önler.

Onaylanmış yayın adımları:

1. Dernek kimliğini yeniden doğrula; mevcut Apps Script kodu ve dağıtım kimliğini yedekle.
2. Aynı Apps Script projesine derlenmiş dosyayı kaydet; `ihtidaPaketKur()` fonksiyonunu bir kez çalıştır. Gereken izin tamamlanmadan hazır bayrağı yazılmaz.
3. Aynı mevcut dağıtımda **Nouvelle version** kullan; yeni `/exec` adresi oluşturma.
4. Canlı GET cevabında `surum:25` ve `ihtidaPaketHazir:true` doğrula. Yeni form bu iki koşul olmadan başvuruyu göndermez.
5. Yalnız bu işin ilgili site dosyalarını dernek GitHub hesabıyla yayımla; alakasız kirli çalışma ağacı değişikliklerini ekleme.
6. Gerçek kişi verisi yerine açıkça TEST olarak işaretli örnekle tüm form → arşiv → admin → üç e-posta zincirini sına. Başvuran rolü için derneğin kontrolündeki adresi kullan; gerçek başvurana deneme gönderme.
7. Gelen PDF'lerin SHA-256 değerlerini arşivle karşılaştır; Brevo teslim olaylarını, mümkün olan dernek kutularını doğrula. E-postanın okunmuş olduğunu iddia etme.

## Yerel doğrulama

`npm run test:ihtida`: 16 sözleşme/akış testi geçti. Bunlar timer, `window`, `Buffer` ve dış ağ bulunmayan GAS benzeri V8 ortamında gerçek PDF üretimini, aynı ekin üç alıcıya gitmesini, bozuk ekleri, idempotency, yetki ve arşiv bütünlüğünü kapsar. Bozuk iş dosyasından sonra kuyruğun devam etmesi ve kayıp gönderim yanıtının doğru nüsha/alıcıyla kurtarılması ayrıca sınanır.

Admin durum ekranı masaüstü ve mobil koyu temada sınandı; klavyeyle kapanma, odağın geri gelmesi ve taşmama doğrulandı. Paket onay düğmesinin başarı, iptal ve bağlantı hatasından sonra kullanılabilir kalması; tekrar denemede aynı işlem anahtarının korunması sınandı. Ön başvuru ve son nüsha PDF sayfaları ile 4399 portundaki derlenmiş form görsel olarak incelendi.

Son toplu `npm run dogrula:codex` çalışması başarılı: tip kontrolü 0 hata/0 uyarı; 867 sayfalık build; 16 ihtida/PDF, 48 tarayıcı ve 17 Firestore testi geçti. Aynı kontroller güncel `origin/main` tabanından hazırlanmış temiz yayın kopyasında da geçti. Kayıtlar: `.codex/cikti/dogrulama-ihtida-v25-son.log` ve `.codex/cikti/yayin-dogrulama.log`. Yerel testler gerçek alıcı kutusuna teslimi kanıtlamaz; canlı doğrulama ayrıca yapılır.

Resmî teknik kaynaklar: [Apps Script V8 çalışma ortamı](https://developers.google.com/apps-script/guides/v8-runtime), [Brevo teslim olayları](https://developers.brevo.com/reference/get-email-event-report), [Brevo idempotency](https://developers.brevo.com/docs/heterogenous-versions-batch-emails).
