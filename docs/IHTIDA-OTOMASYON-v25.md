# İhtida tam PDF ve e-posta akışı — 9 Eylül 2026

9 Eylül 2026'da kullanıcı onayıyla canlıya alındı ve gerçek gönderim zinciri doğrulandı. Apps Script sağlık cevabı `surum:25`, `ihtidaPaketHazir:true`; site ve admin aynı sürüme uygun olarak yayında. Sonuçlar aşağıdaki canlı doğrulama bölümündedir.

## Başvuru ve belge

- Form, başvuranın posta adresini ayrı sokak/numara, posta kodu, şehir ve ülke alanlarıyla alır. Kimlik numarası alanı yoktur.
- Başvuru kaydı tamamlanınca özel Drive klasöründe kalıcı bir paket işi oluşturulur. Dakikalık Apps Script tetikleyicisi PDF'yi üretir; form HTTP isteği PDF ve e-posta işlemlerini beklemez.
- Tek dosya, Müşavirlik paketinin sırasıyla: EK-9 (2 sayfa), dilekçe (2 sayfa), EK-10 (2 sayfa), kimlik/pasaport örneği. Olağan paket 7 sayfadır (17 Ekim 2026'ya dek 6); sığmayan uzun metinler açıklama ekine eklenir. Ayrıntı: aşağıdaki «17 Ekim 2026» bölümü.
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

## Deneme başvurusunu silme ve numaranın yeniden verilmesi — 29 Eylül 2026

- Numara `referansMaxBul` ile defterdeki en büyük numara + 1 olarak üretilir. En son satırlar silinirse aynı `IH-YYYY-NNNN` sonraki gerçek başvuruya yeniden verilir.
- Bir başvurunun izleri şunlardır: defter satırı; İhtida klasöründe `<ref> - <Ad>.pdf`, dört görsel (`vesikalik`, `kimlik-on`, `kimlik-arka`, `imza`), `<ref> - paket-islem.json`, `<ref> - Ihtida Belge Paketi - rN.pdf`; Script Property `IHTIDA_PAKET_IS_<ref>`; varsa iç defter meta kaydı. Satır tek başına silinirse yeni başvuru eski «tamam» işini ve deneme görsellerini devralabilir.
- 29 Eylül 2026'da IH-2026-0006 ve IH-2026-0007 (Rıdvan'ın deneme başvuruları) bu izlerin tamamıyla kaldırıldı. Canlıda tek başvuruyu silen bir uç olmadığı için editöre geçici bir fonksiyon eklendi: önce kuru çalıştırıldı, sonra gerçek silme yapıldı ve fonksiyon geri kaldırıldı. Editör kaynağı işlem öncesiyle birebir aynı kaldı; `/exec` dağıtımı değişmedi. Dosyalar `silindi-deneme-2026-09-29 ` önekiyle yeniden adlandırılıp çöpe atıldı. Defter 7 → 5 satır; `ihtida-paket-durum` iki ref için `null`; iç defter yeniden üretildi. Araç ve adımlar: `~/.claude/skills/ulucamii-site/scripts/ihtida-basvuru-sil/` (depo dışı, `OKUBENI.md`).
- Aynı iş sırasında bulunan hata düzeltildi ve **30 Eylül 2026 ≈07:32'de Apps Script v41 olarak canlıya alındı** (`ulucamii-Kod-v41.gs`, dağıtım `D:/tmp/gas/dagit_v41.py`):
  - `ihtidaGorselleriOku` ve `ihtidaPaketIsDosyasi` çöpteki aynı adlı dosyayı okuyabiliyordu. `getFilesByName` çöptekileri de döndürür.
  - `test-temizle` bir ihtida satırını silerken görselleri, iş dosyasını, paket PDF'ini ve kuyruk özelliğini bırakıyordu. Artık `ihtidaRefIzleriniCopeAt` bunları kaldırıyor.
  - Testler: `tests/ihtida-paket-akis.test.mjs` içindeki iki yeni test (eski kodla kırmızı). Canlı ihtida ucuna deneme başvurusu gönderilmedi; davranış yalnız yerel sahte Drive/Sheets testleriyle sınandı.
- E-posta kopyaları (info@, imam@ ve başvuranın kutusu) bu temizlikle silinmez.
- 30 Eylül 2026 ≈10:10'da, kullanıcının isteğiyle, 9 Eylül'den kalan iki otomasyon denemesi IH-2026-0004 («TEST OTOMASYON») ve IH-2026-0005 («TEST V27») aynı araçla, v41 üzerinde kaldırıldı: defter 5 → 3 satır, 14 dosya `silindi-deneme-2026-09-30 ` önekiyle çöpe; iç defter değişmedi (IH-2026-0001…0003). Defterde artık «TEST» adlı satır yok. En büyük numara IH-2026-0003 olduğundan **bir sonraki gerçek başvuru `IH-2026-0004` numarasını alır**; v41'in çöpteki aynı ref dosyalarını atlaması bu başvuruda canlı olarak ilk kez sınanır.
- 1 Ekim 2026'daki salt okunur kontrol: canlı sürüm artık **42** (envanter yayını), ihtida 3 / kayıt 25 / seviye 3; iç defter güncel, IH-2026-0001…0003. IH-2026-0004 için paket yok; numarası yeniden kullanılan ilk gerçek başvurunun belge ve görselleri henüz gözlemlenmedi. Eski v41 paketini canlıya geri yükleme. Envanterin gerçek kayıt kabulü son kararla kapalıdır; `/envanter/` örnek önizlemedir ([işletme notu](ENVANTER-FORMU.md)).

## Kalem yazısı, Ekim 2026 formları ve kimlik kırpma — 17 Ekim 2026

Mühtedi Koordinatörlüğünde elle mükemmelleştirilen belgeler site formunun otomatik paketine taşındı.

- **Belgeler.** EK-9 kalem yazısıyla; dilekçe Müşavirliğin Ekim 2026 formuyla (`public/belgeler/ihtida/ihtida-talep-dilekcesi-2026-10.pdf`, `dilekceFormUret`); EK-10 Ekim 2026 açık rıza formuyla (`ek10-acik-riza-metni-2026-10.pdf`). Formdaki EK-10 bağlantısı ve onay sürümü `2026-10` oldu.
- **Kalem kuralı.** Elle doldurulan her alan Allura, mürekkep `#1A3D9E` (`public/admin/kalem.js`, Python `kalem.py` ile aynı kelime oynatması). Allura PDF'ye **tam** gömülür (`subset:false`): fontkit alt kümesi bazı harfleri görünmez yapıyor (Caveat dersi). Panelde «Sade siyah yazı» yalnız açık talimatla seçilir.
- **Vektör imza.** Form, çizilen imzanın çizgilerini PNG'nin yanında JSON olarak da gönderir (`gorseller.imzaVektor`, `{v:1,w,h,k,d}`, yalnız M/L komutları, ≤100 000 karakter). Sunucu bunu paketleyicinin çözücüsünden geçirir (`imza-vektor-gecersiz`, PNG'siz ya da «imzasız» seçiliyken `imza-fazla`). Belgelerde imza yol olarak, yuvarlak uçlu ve mürekkep renginde çizilir; Drive'da `<ref> - imza-vektor.json` olarak saklanır ve silme/temizlik izlerine dahildir. Vektörü olmayan eski başvurular PNG imzayla sürer. Kayıtlı şahit imzaları raster kalır, mürekkebe boyanır.
- **İmza aktarımı.** Eylül ve Ekim 2026 sürümlerinde başvuranın imzası yalnız `imzaAktarimIzni` ile EK-9, dilekçe ve EK-10'a taşınır; v1 başvurularında eski davranış (imzalıysa aktar) sürer. Ön başvuru dilekçesi tören tarihi olmadığı için imzasız ve tarihsizdir; son nüshada yer-tarih «<cami şehri>, <ihtida tarihi>» olur.
- **Sheets tuzağı (mevcut hata, düzeltildi).** Defter `2026-09-09` sürüm metnini tarihe çeviriyordu; okunan değer «09.09.2026» olunca yeni başvurular v1 sanılıyordu. Yazarken başa `'` eklenir; okurken `ek10SurumuCoz()` «09.09.2026…» ve «01.10.2026…» biçimlerini de tanır (panel + GAS).
- **Kimlik sayfası.** `public/admin/kimlik-sayfa.js`, Python `kimlik_sayfa.py` düzeni: başlık, «SOYAD Ad», doğum tarihi, ön ve arka yüz **gerçek boyutta** (kart 85,6 × 54 mm, pasaport bilgi sayfası 125 × 88 mm), yuvarlak köşe. Kimlik numarası yazılmaz, OCR/MRZ yoktur.
- **Kırpma penceresi.** Formda kimlik ön/arka seçilince `src/scripts/kimlik-kirp.ts` kartın kenarlarını tarayıcıda bulur (Otsu eşiği, en büyük bölge, PCA köşeleri, kenar doğrusu oturtma), perspektifi düzeltip 300 dpi karta çevirir (1011 × 638; pasaport 1476 × 1039). Dört köşe sürüklenebilir ve klavyeyle ayarlanır (oklar, Shift ×5); «Döndür», «Kırpmadan kullan», «Vazgeç» vardır. Belge türü değişince kırpılmış görsel yeni orana yeniden açılır. Görsel tarayıcıdan çıkmadan işlenir. Kırpılmamış fotoğraf PDF'de kart genişliğine sığdırılır.
- **Sağlık.** GET cevabında `ihtidaKalemBelgeleri:true`, derlenmiş GAS paketinde Allura, Ekim 2026 EK-10 ve dilekçe şablonlarının bulunduğunu gösterir.
- **Testler.** `tests/kimlik-kirp.test.mjs` (geometri), `tests/web/kimlik-kirp.spec.mjs` (pencere, klavye, axe, çıktı ölçüsü), `tests/ihtida-contract.test.mjs` ve `tests/ihtida-paket-akis.test.mjs` (7 sayfa, vektör yol, raster yok, mürekkep rengi, kimlik numarası yok). Kalem büyük harfli kelimeleri harf harf yazdığından metin katmanında harf arası boşluk düşebilir; testler karşılaştırmadan önce boşlukları atar.
- **Apps Script sözdizimi.** Editör kayıtta BigInt değişmezini (`0n`) «ParseError» ile reddeder; `kalem.js` bu yüzden
  BigInt kullanmaz, `ihtida-gas-derle.mjs` esbuild'e `supported: { bigint: false }` verir. `\p{L}/u`, `?.`, `??` ve sınıflar
  canlıda çalışır.
- **Canlı.** Apps Script Version 59 (17 Ekim 2026 08:09); site `4fab46f` + `b13acdd`. Canlı uçtan uca sınama ve temizlik:
  [YAYIN-KAYITLARI](YAYIN-KAYITLARI.md) «17 Ekim 2026».
- **Bilinen sınır (21 Ekim 2026'da kapandı).** Eve teslimde dilekçenin «dönüş» alanı başvuranın adı ve adresini formdaki sabit «Cami» etiketinin altında taşıyordu; aşağıya bakın.

## Emsal denetimi: EK-9 değerleri, son nüshada düzeltme, adrese teslim dilekçe — 21 Ekim 2026

Sitenin paketi, Mühtedi Koordinatörlüğünün elle mükemmelleştirdiği iki emsal dosyayla (M-2026-02, M-2026-06; kişi
verisi depoya girmedi) kurgusal bir başvuruyla sayfa sayfa karşılaştırıldı. Yedi sayfanın düzeni, kalem yazısı, vektör
imza ve kimlik sayfası aynıydı. Kalan dört fark kapatıldı:

- **EK-9 değerleri tek tablodan.** Panel (tek EK-9) ve sunucu paketi (`ihtida-pdf-entry.js`) artık aynı
  `ek9Degerleri()` işlevini kullanır (`public/admin/ek9-hazirlik.js`). Kodlu seçimler emsaldeki gibi «Türkçe / Fransızca»
  yazılır. Medeni hâl de bu kurala girdi ve cinsiyete göre çekilir: «Evli / Marié», «Evli / Mariée»; cinsiyet bilinmiyorsa
  «Evli / Marié(e)». Daha önce yalnız «Evli» yazılıyordu. Serbest metnin ilk harfi büyür, anne ve baba adı yazıldığı gibi kalır.
- **Son nüsha ekranında EK-9 arka yüzü düzeltilebilir.**
  - Düzeltilebilen sekiz alan: doğum yeri, uyruk, anne adı, baba adı, medeni hâl, öğrenim, meslek, önceki din.
  - Alanlar başvurudaki değerlerle dolu gelir. Görevli bunları emsal biçimine getirebilir (ör. «İtalya / Italie»,
    «Emekli / Retraité»). Boş bırakılan alana «Bildirilmedi / Non communiqué» yazılır.
  - Değerler `hazirlik.alanlar` ile gider. Sunucu yalnız bu sekiz anahtarı ve en çok 120 karakteri kabul eder
    (`ek9AlanlariGecerli`); başka bir değer gelirse onay `paket-onay-gecersiz` olur.
  - Düzeltmeler yalnız EK-9'a girer. Dilekçe başvuranın kendi beyanı kalır (`veri.dilekce`, Koordinatörlüğün
    `dilekceAlanlari` kuralı). Başvuru kaydı değişmez.
- **Adrese teslim dilekçe.** Başvuran «ikamet adresime postalansın» seçtiyse dilekçe, formun adrese teslim baskısıyla üretilir:
  - Şablon: `public/belgeler/ihtida/ihtida-talep-dilekcesi-2026-10-adres.pdf`.
  - Kaynak: Koordinatörlükteki `dilekce_uret.py --teslim adres` ve `metinler.json` «adrese_teslim».
  - Dönüş bölümü «Belgenin gönderileceği adres · Alıcı · Adres» olur. Alan yerleri standart formla birebir aynıdır;
    yerleşim dosyaları karşılaştırıldı.
  - Şablon GAS paketine `dilekceAdresSablonBytes` olarak girer. Paket şablonsuz kalırsa durur.
  - Sağlık cevabında `ihtidaEk9Alanlari` ve `ihtidaAdresDilekcesi` bayrakları bu iki değişikliği gösterir.
- **Yeni isim.** Formdaki «Almak istediğiniz Müslüman ismi» yardımı beş dilde Genelge md. 44/12'yi hatırlatır. Bu ad EK-9'a
  yazılmaz; resmî ad değişikliği için yetkili makama ayrıca başvurulur.
- **Bilerek farklı kalanlar.**
  - Kimlik sayfasının başlığında kart ve ulusal sicil numarası yoktur. Dernek için bağlayıcı numara yasağı sürer; numara
    yalnız görüntünün kendisinde görünür.
  - Kayıtlı şahit imzaları panelin şifreli paketinden gelir; paket şu anda imza taşımaz. Şahitler son nüshayı kalemle
    imzalar. Rıdvan KAYAHAN ve Ercan MOLA imzalarının vektör olarak konması yalnız Koordinatörlüğün yerel hattında
    (`/ihtida-belgesi`) ve kişi başına talimatla yapılır.
- **Testler.** Toplam 29/29 geçti:
  - `tests/ihtida-contract.test.mjs`: değer tablosu, düzeltme, sunucu eşlemesi, dilekçenin beyanı koruması, adres baskısının
    iki yüzü, şablonsuz paketin reddi.
  - `tests/ihtida-paket-akis.test.mjs`: GAS ortamında onay doğrulaması ve basılan değer.
  - `tests/web/ihtida.spec.mjs`: son nüsha ekranındaki alanlar.
- **Canlı sınama (22 Ekim 2026, 00.05–00.15).** Kurgusal «TESTOGLU» başvurusu canlı Apps Script'e gönderildi: adrese
  teslim, vektör imza, EK-10 2026-10. Akış:
  - Ön başvuru paketi 7 sayfa geldi; SHA eşleşti. Dilekçede «Alıcı · Adres» bölümü, EK-9'da «Evli / Marié» vardı.
  - Son nüsha onayı `hazirlik.alanlar` ile gönderildi. Paket yine 7 sayfa, SHA eşleşti.
  - EK-9 arka yüzünde düzeltilen değerler basıldı: «Belçika / Belgique», «Emekli / Retraité», «Hristiyanlık / Katolik».
    Boş bırakılan öğrenim «Bildirilmedi / Non communiqué» oldu.
  - Dilekçe başvuranın beyanını korudu (doğum yeri «Liège»). İhtida tarihi ve imza paneli dolu.
  - Alıcılar yalnız dernek kutularıydı: info@, imam@ ve altyapı adresi.
  - Sonunda `test-temizle` 1 satır sildi. Defterde 3 ihtida satırı kaldı, paket izi de silindi.
  - Tuzak: sunucu telefonu boşluksuz +E.164 ister; aksi hâlde `basvuran-telefon-gecersiz` döner.

## Bundan sonraki kullanım

Form doldurulup imzalandığında ön başvuru paketi otomatik hazırlanır, admin panelinde açılır ve üç alıcıya gönderilir. Tören sonrasında **Başvurular → İhtida → Son nüshayı onayla ve gönder** ile gerçek tarih, adres, şahitler ve EK-9 arka yüzündeki bilgiler kontrol edilir. Bu son onay yeni ortak PDF nüshasını üretip arşivler ve aynı üç adrese gönderir. Müşavirin ıslak imzası basılı belgede tamamlanır.
