# İhtida tam PDF ve e-posta akışı — 9 Eylül 2026

9 Eylül 2026'da kullanıcı onayıyla canlıya alındı ve gerçek gönderim zinciri doğrulandı. Apps Script sağlık cevabı `surum:25`, `ihtidaPaketHazir:true`; site ve admin aynı sürüme uygun olarak yayında. Sonuçlar aşağıdaki canlı doğrulama bölümündedir.

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

## Canlı doğrulama — 9 Eylül 2026

- Dernek GitHub kimliği `ulucamii2026`, Google kimliği `ulucamii2026@gmail.com` doğrulandı. Güncel `origin/main` tabanında ayrı yayın kopyası kullanıldı; mevcut çalışma klasöründeki işler korundu.
- Ana yayın commit'i `e2e9fc3`. [GitHub Pages dağıtımı](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/34318323217) başarılı. Gerçek `ulucamii.be` sayfasında sürüm 25 form koruması ve ayrı posta adresi alanları görüldü.
- Derlenmiş GAS dosyası editöre kaydedilip yeniden açılarak birebir karşılaştırıldı. `ihtidaPaketKur()` gerekli zamanlanmış çalışma izniyle başarıyla çalıştı. Mevcut `/exec` adresi korundu. Google'ın dağıtım sıra numarası 24, uygulamanın kendi sürümü 25'tir; bunlar farklı sayaçlardır.
- Canlı form, açıkça **TEST OTOMASYON — gerçek başvuru değildir** adlı sentetik kişi, üzerinde TEST yazan görseller ve TEST çizimiyle gönderildi. Başvuran rolü yalnız derneğin kendi Gmail adresini kullandı; gerçek kişiye deneme gönderilmedi.
- Arşiv PDF'si otomatik oluştu. Olağan altı sayfaya uzun ihtida sebebi için açıklama eki eklendi; deneme 7 sayfadır. İlk iki sayfa, imza aktarımı ve kurum düzeni görsel olarak incelendi. Asıl kullanıcı şablonuyla çerçeve eşleşmesi kontrol edildi.
- `info@ulucamii.be` ve `imam@ulucamii.be` gelen kutuları salt okunur IMAP ile; `ulucamii2026@gmail.com` kutusu dernek Google oturumuyla kontrol edildi. Üç e-postadan PDF eki ayrı ayrı alındı.
- Arşiv ve üç e-posta eki **4.749.019 bayt** ve aynı SHA-256 değerine sahip: `3fec0d124164b1b0895a48ce55c7465f7da60b5c44117c4d977494c2897c5407`.
- Brevo, üç ileti için de `delivered` olayı verdi. Sağlayıcının olay raporuna yansıması gecikmeli oldu; bu sırada sistem doğru biçimde teslim teyidi bekledi. Dakikalık kuyruk sonraki kontrolde kaydı `tamam` yaptı; ek e-posta gönderilmedi.
- Canlı admin panelindeki **Tam paket PDF** düğmesi aynı arşiv dosyasını gösterdi. **PDF ve e-posta durumu** penceresinde üç alıcı da **Alıcı sunucusuna teslim edildi** olarak doğrulandı.

Özel yerel kanıtlar Git'e alınmaz: `.codex/cikti/ihtida-canli/` içinde arşiv ve üç gelen PDF, teslim olayları, form başarı ekranı ve yalnız sentetik başvuruyu gösteren admin ekranı vardır. Gerçek cihaz/Safari testleri bu yayına dahil değildir. Son nüsha onayı ve kesinti senaryoları yerel gerçek PDF/VM ve tarayıcı testlerinde sınandı; canlı deneme ön başvuru akışını kapsadı.

## Bundan sonraki kullanım

Form doldurulup imzalandığında ön başvuru paketi otomatik hazırlanır, admin panelinde açılır ve üç alıcıya gönderilir. Tören sonrasında **Başvurular → İhtida → Son nüshayı onayla ve gönder** ile gerçek tarih, adres ve şahitler kontrol edilir. Bu son onay yeni ortak PDF nüshasını üretip arşivler ve aynı üç adrese gönderir. Müşavirin ıslak imzası basılı belgede tamamlanır.
