# İhtida formu → EK-9 → Müşavirlik → posta

8–9 Eylül 2026. Bu çalışma yereldir; site veya Apps Script yayımlanmadı.

## Başvuranın gördüğü akış

- Vesikalık fotoğraf ayrı ve zorunlu bir yükleme alanıdır. Türkçe, Fransızca ve İngilizce açıklamalar kimlik belgesi görüntüsüyle farkını, güncel ve net bir portre gerektiğini belirtir. Ekran okuyucuya zorunluluk aktarılır. Kimlik görüntüsü yüklenmiş olsa bile vesikalık yoksa istemci göndermez; sunucu da reddeder. Silme/yeniden yükleme ve gönderim davranışı üç dilde test edilir.
- EK-9 kişisel bilgi alanları korunur. Ulusal/T.C. kimlik veya pasaport numarası sorulmaz; OCR/MRZ eklenmez.
- İkamet adresi sokak/kapı/daire, posta kodu, şehir ve ülke olarak alınır. Dört parça tarayıcıda ve sunucuda zorunludur. Gönderimde mevcut `basvuran.adres` alanında birleştirilir; ayrı parçalar da defterin sonuna eklenen sütunlarda korunur. Eksik veya parçalarıyla çelişen adres sunucuda reddedilir.
- “İslam’ı seçme sebebiniz” alanı TR/FR/EN canlı formunda zaten vardır; isteğe bağlıdır. Yeni bir alan eklenmedi, kişinin gerekçesi tahmin edilmez.
- İmzalı belgenin camiye postalanması ve camiden alınması varsayılandır. Başvuran kendi ikamet adresine postalanmasını seçebilir. İkinci bir adres veya başka alıcının kişisel bilgileri istenmez.
- Kendi şahidini bildirme kutusu başlangıçta kapalıdır. Açılınca ilk şahit adı zorunlu, ikinci şahit isteğe bağlıdır. Kapatılan kutudaki eski adlar gönderilmez. Eski taslaktaki şahit adı görünür biçimde geri yüklenir.
- Posta ve şahit tercihleri gönderim özetine, başvuru PDF’ine, bildirim metnine ve deftere taşınır. TR/FR/EN form ve gizlilik metinleri güncellendi.

## Panelde belge hazırlama

- Kullanıcının verdiği `EK-9 İhtida Belgesi (A4 yatay) - İnce Çerçeve.pdf` boş şablonu `public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf` dosyasına alındı. OneDrive’daki asıl belge korunur. Yeni şablonun metin koordinatlarına göre alanlar hizalandı.
- Başvuranın bildirdiği şahit adları korunur; imza yok diye başka kişiyle değiştirilmez. Boş şahit yerlerine sırasıyla Rıdvan KAYAHAN ve Yeliz KAYAHAN önerilir. Aynı kişi iki kez önerilmez.
- Her belgede şahit adları düzenlenebilir. Kayıtlı imza kullanımı kutuları boş başlar. Şahitlik ve ilgili kişinin imza kullanım onayı teyit edilirse yalnız o kişiye ait imza eklenir. Ad değiştirilince eski onay sıfırlanır. Diğer şahitlerin imza alanları kalemle imzalanmak üzere boş kalır.
- Gerçek ihtida tarihi ayrıca girilir; tarih tercihi veya bugünün tarihi otomatik kullanılmaz. Belge numarası, belge tarihi, düzenleyen birim, yetkili imzası ve T.C. kimlik numarası panelden otomatik doldurulmaz.
- Resmî adlar kesilmeden sığdırılır. Uzun diğer alanlar kısalırsa veya yazı çok küçülürse panel PDF’nin kontrol edilmesi gerektiğini bildirir.

## Müşavirlik seçimi (9 Eylül 2026)

Ortak `public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf` şablonunda Türkçe “Müftülüğümüze” ve “Ataşeliğimize”, İngilizce “Muftiate” ve “Attaché” seçeneklerinin üstü mavi çizgiyle çizildi. “Müşavirliğimize” ve “Office of the Counsellor” korunur. Metinler silinmez; seçenek ayraçları da ilgili çizgiye dahildir.

Şablon doğrudan her EK-9 üretiminde yüklendiğinden, başvuranın kimliğinden ve yazı stili seçiminden bağımsız uygulanır. Başvurudan sonra görevli panelde EK-9 oluşturduğunda kurum seçimi hazır gelir; yeni bir form alanı veya sunucu yazımı gerekmez. Boş PDF bağlantısı da aynı uyarlanmış şablonu verir. Bu çalışma canlı yayına alınmadı.

Tekrarlanabilir uygulama: `python scripts/ek9-musavirlik-uyarla.py kaynak.pdf hedef.pdf`. Betik beklenen kurum sözcüklerini arar, metinleri korur ve mevcut çizgileri ikinci kez eklemez. Orijinal OneDrive şablonu korunur. Üretilen mavi ve sade PDF'lerde dört çizginin doğru yerde kalması sözleşme testiyle denetlenir.

## Tek PDF paketi (9 Eylül 2026)

Görevli panelindeki **Tam PDF paketi** düğmesi, başvuru bilgileriyle EK-9 (2 sayfa), EK-10 (2 sayfa), dilekçe ve kimlik ön/arka örneğini tek PDF'ye yerleştirir. Pasaportta bilgi sayfası kullanılır. Dosyalar ve kayıtlı imzalar yalnız yetkili panelinin belleğinde işlenir.

Görevli gerçek ihtida tarihini girer ve şahitlerin imza kullanımını teyit eder. Tarih tercihi gerçek ihtida tarihi sayılmaz. Ad, adres, ihtida sebebi ve kimlik türü kayıttan hazır gelir; eksik eski kayıtlar aynı ekranda tamamlanabilir. Bu belgeye özel düzeltmeler canlı başvuru kaydını değiştirmez.

Başvuranın çizilmiş imzası ve kayıtlı EK-10 rızası varsa imza EK-9'un beyanına, EK-10'un her iki sayfasına ve dilekçeye otomatik aktarılır. İmzalı nüshada beyan tarihi başvuru kaydından alınır. İmza bulunmuyorsa tarih ve adlar doldurulur; dört imza alanı kişinin imzalaması için boş kalır. Eksik/bozuk fotoğraf veya kimlik eki sessizce atlanmaz. EK-10 rızası doğrulanmadan imzalı paket üretilmez.

EK-9 arka sayfasının sağ altındaki ad yer tutucusu artık gerçek tam adla doldurulur; imza bulunmaması adı boş bırakmaz. Arka sayfa yazısı 14 punto, e-posta 13,5 punto ve şahit adları 12 puntodur; uzun adlar kesilmeden sığdırılır. Şahit imzaları etiketlerin altına yerleşir ve RGB imzalardaki siyah çizgiler aynı mavi tona eşlenir; saydamlık ve imza şekli korunur.

Yetkili bölümünde **Salih GÖR** ve **T.C. Brüksel Büyükelçiliği Sosyal İşler Müşaviri** resmî siyah serif yazıyla hazır gelir. Yetkili imzası, belge numarası ve düzenleme tarihi makam için boş kalır. Uzun ihtida gerekçesi/adres/e-posta gibi alanlar kesilmez; EK-9'da ek açıklamaya yönlendirilir ve aynı PDF'nin sonundaki açıklama ekinde tam verilir.

Bu akış tören sonrasında görevli panelinden hazırlanır; yerel geliştirme tamamlanmıştır, yayın ayrı işlemdir.

## Kaligrafi ve mavi el yazısı

- İlk sayfadaki ad varsayılan olarak mavi **Great Vibes** kaligrafisiyle; diğer doldurulan alanlar mavi **Caveat Medium** el yazısıyla basılır. Şablonun basılı başlıkları ve görsel imzalar değişmez.
- Panelde iki yazı seçimi ayrı ayrı “sade siyah” olarak değiştirilebilir. Kimlikteki tam ad, belge hazırlanırken düzeltilebilir; bu işlem eski başvuru kaydını değiştirmez. Uzun adlar kesilmeden küçültülür.
- Yazı tipleri yerel `public/fonts` içinden yüklenir; font servisine başvuru bilgisi gönderilmez. Türkçe ve Fransızca karakterler font kapsamı ve gerçek PDF çıktısında sınandı.
- Caveat'ın alt kümesi bazı harfleri görünmez yapıyordu. Tam font gömme ve bağlamsal harf değişimlerini kapatma ile düzeltildi; tam gömülen font için regresyon testi eklendi. Tarayıcıdaki gerçek pdf-lib/fontkit paketleriyle ayrıca PDF üretildi ve görüntüsü incelendi.
- Kaynaklar ve lisanslar: [Great Vibes](https://github.com/googlefonts/great-vibes), [Caveat](https://github.com/googlefonts/caveat), `public/fonts/greatvibes-OFL.txt`, `public/fonts/caveat-OFL.txt`. Fontlar SIL OFL 1.1 ile dağıtılır; Caveat'ın resmi değişken kaynağından 500 ağırlığı çıkarılmıştır.

## Mühtedinin imzası ve zarfın diğer belgeleri

Kullanıcının süreç açıklaması: görevli belgeleri yazıcıdan alır, zarflayıp Müşavirliğe gönderir; Müşavir Bey ıslak imzayla onaylar. İmzalı EK-9 genellikle camiye döner ve kişiye elden teslim edilir; seçilmişse doğrudan kişinin adresine postalanır.

Özel klasördeki `Zarf İçeriği ve Gönderi Talimatı.docx` incelendi: diğer belge mühtedinin **ihtida belgesi talep dilekçesi**. Listede dilekçe, iki sayfalık EK-10, kimlik örneği, vesikalık ve varsa EK-9 nüshası bulunuyor. Eski posta tarifeleri veya süreleri yeniden doğrulanmadı; bu çalışmada güncel bilgi olarak kullanılmaz.

Panelde EK-9 ve dilekçe zaten başvuranın çizdiği imzayı kullanıyordu. Eksik olan **EK-10 Açık Rıza** üretimi `public/admin/ek10.js` ve panel düğmesiyle eklendi. Mevcut TR/EN + FR/NL iki sayfa korunur; her iki sayfaya aynı ad, başvurudaki tarih ve başvuranın imzası yerleştirilir. Formun imza açıklaması, imzanın EK-9, EK-10 ve dilekçede kullanılacağını üç dilde belirtir.

EK-10 onayı v24 defterinde ayrı saklanır. Bu onay veya çizilmiş imza yoksa imza kopyalanmaz; görevli imzasız bir nüsha hazırlayıp kişiye kâğıt üzerinde imzalatabilir. Bozuk imza dosyası sessizce atlanmaz. Müşavir imzası hiçbir aşamada otomatik eklenmez. Dilekçede imzasız çıktının dipnotu da imza beklediğini açıklar; imza için gönderilen yerel nüshada tarih boş bırakılabilir.

## Sunucu uyumu ve yayın sırası

Yerel sunucu kaynağı: `scripts/apps-script/ulucamii-Kod-v24.gs`. v23 dosyası değiştirilmedi. Defterin mevcut 31 sütununun sırası korunur; sona `Belge teslim yeri`, `Şahit seçimi`, `EK-10 rızası`, `Adres sokak`, `Posta kodu`, `Şehir`, `Ülke` ve `Kimlik belgesi türü` eklenir. Eski başvurularda bilinmeyen tercih “teyit edilecek” olarak gösterilir; geçmiş kayıtlar kendiliğinden değiştirilmez.

Yeni form gönderimden önce kişisel veri içermeyen sürüm kontrolü yapar. Servis 24’ten eskiyse POST yapılmaz; kullanıcıya bilgilerinin gönderilmediği açıklanır. Böylece yalnız site güncellenirse teslim tercihi sessizce kaybolmaz.

Yayın ayrıca istendiğinde önce dernek hesabıyla v24 dağıtımı ve sürüm kontrolü, sonra site/panel yayını yapılmalıdır. Bu çalışmada gerçek form, e-posta, Drive, Firestore veya GAS yazımı yapılmadı.

## Dayanak ve değerlendirme

- Kullanıcının sağladığı EK-9 şablonunda kimlik numarası alanı **yalnız T.C. vatandaşları** içindir. Formda bu alan boş bırakılır; gerektiğinde basılı belgede elle tamamlanır.
- [Diyanet Din Hizmetleri Uygulama Genelgesi, madde 44](https://hukukmusavirligi.diyanet.gov.tr/Documents/D%C4%B0N%20H%C4%B0ZMETLER%C4%B0%20UYGULAMA%20GENELGES%C4%B0.pdf): basılan nüshaların mühtedi, şahitler ve yetkili tarafından imzalanmasını belirtir. Kayıtlı imza görselinin Müşavirlikçe kabul edildiği bu çalışmada doğrulanmadı; panelde teyit verilmezse şahit imzaları kâğıtta tamamlanabilir. Başvuruyla otomatik şahitlik/imza üretmek yerine belge aşamasında teyit alınması uygulama tercihidir.
- Form başvurusu ile resmî belge onayı ayrı aşamalardır. Müşavirlik sonrası posta akışı kullanıcının bu oturumdaki tarifine göre düzenlendi.

## Kontroller

- `npm run dogrula:codex`: tip kontrolü, build, panel/CMS denetimi, EK-9 kenar durumları, ihtida sözleşme testleri, tarayıcı testleri ve demo Firestore testleri.
- Tarayıcı testleri dış ağı keser; yalnız sahte GAS cevaplarıyla gönderim kontrol edilir. Şahit kutusunun açık/kapalı hâli, üç dil, posta adresi, eski servis engeli, imzasız şahit adlarının korunması ve teyitli imza kullanımı sınanır.
- Yeni sunucu testleri VM içinde sahte defter/posta/Drive işlemleri kullanır. Gerçek kişi veya imza yerine sentetik veri kullanılır; e-posta adresleri `.test` alanındadır.
- Görsel kontrol: mobil/masaüstü form, açık/koyu tema, azaltılmış hareket ve yeni iki sayfalık PDF şablonu. Gerçek yazıcı, iPhone/Safari ve Müşavirlik teslim işlemi sınanmadı.
- Impeccable’ın `broken-image` bulgusu, yalnız yüklenen görsel hazır olduğunda gösterilen boş önizleme etiketi için yanlış pozitifti. `ihtida-gorseller.ts` davranışı doğrulandı; sadece `IhtidaFormu.astro` içindeki bu kural için dosya kapsamlı değer istisnası kaydedildi. Genel kural kapatılmadı.


## Son doğrulama

- `npm run dogrula:codex`: 867 sayfalık build, 0 Astro hatası/uyarısı; 40/40 tarayıcı, 7/7 ihtida/PDF sözleşmesi ve 17/17 demo Firestore testi başarılı.
- TR/FR/EN formunda eksik posta kodu, şehir ve ülkenin gönderimi engellediği; sunucunun da eksik/tutarsız adresi reddettiği doğrulandı.
- Altı sayfalık imzalı/imzasız paket, dört başvuran imzası, iki kimlik yüzü, beyan adının korunması, uzun açıklama eki ve eksik görsel/onay hataları sentetik verilerle sınandı.
- Mobil ve masaüstü belge hazırlama diyaloğu; Node ve tarayıcı üretimli iki sayfalık mavi/sade EK-9; iki sayfalık EK-10 görsel olarak kontrol edildi.
- Mevcut başvuruya ait özel belgeler yalnız kullanıcının OneDrive çalışma klasöründe hazırlandı; bu raporda, depoda ve test görsellerinde kişisel başvuru verisi bulunmaz. Canlı servis yalnız salt okunur sorgulandı; çalışma sırasında sürüm 23 döndü.

## Son kontrolde giderilen iki tutarsızlık

- Hatalı form gönderiminden 350 ms sonra çalışan eski odak zamanlayıcısı, kullanıcı başka bir alana yazmaya başlayınca odağı geri çekebiliyordu. Tarayıcı izinde şahit adının ülke alanına yazıldığı görüldü. Kullanıcının giriş/odak/klavye/dokunma hareketinde bekleyen odak iptal edilir; azaltılmış harekette gecikme uygulanmaz. Gerçek tarayıcıda bu yarış için regresyon testi eklendi.
- İhtida formunun son gizlilik kutusunda, diğer formlara ait “kimlik kopyası istemiyoruz / üçüncü tarafla paylaşmıyoruz” metni kalmıştı. İhtidaya özel, kimlik/vesikalık/imza ve Müşavirlik dosyası akışını doğru açıklayan mevcut üç dilli metin kullanıldı.
