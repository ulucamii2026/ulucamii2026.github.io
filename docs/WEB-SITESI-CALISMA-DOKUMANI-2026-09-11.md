# Ulu Camii web sitesi — çalışma dökümü

Güncelleme: **11 Eylül 2026**  
Amaç: Web sitesi üzerinde bugüne kadar yapılan çalışmaları, kalıcı kararları,
doğrulama sınırlarını ve sonraki oturum için başlangıç noktasını tek belgede
toplamak. Bu belge kişi bilgisi, gerçek başvuru verisi, parola, imza veya özel
belge içermez.

## Mevcut durum

- Proje: `D:\app\ulucamii-site`
- Dal: `main`
- Döküm hazırlanırken `HEAD` `3f1b055` idi. Belge yazılmadan önce kaynak kodu
  temizdi; bu doküman ve `PROJE-HAFIZASI.md` bağlantısı şu anki tek çalışma ağacı
  değişikliğidir.
- Uygulama: Astro statik sayfalar, Preact adacıkları, Tailwind 4 ve Firebase /
  Apps Script tabanlı veli–ihtida işlemleri.
- Dil akışı: Türkçe (`tr`), Fransızca (`fr`) ve İngilizce (`en`) birlikte
  korunur. Form, içerik ve e-posta değişiklikleri üç dilde kontrol edilir.

## Tamamlanan ana çalışmalar

### 1. Genel site ve tema

- Diyanet.be ana sayfası incelenerek daha ferah, kurumsal ve bütünlüklü bir
  ana sayfa omurgası oluşturuldu.
- Açık/koyu tema, mobil düzen, klavye erişimi, azaltılmış hareket ve renk
  kontrastı kontrolleri düzeltildi.
- Hakkımızda, İhtida, Üyelik, Diyanet Hizmetleri, Müfredat ve Konsolosluk
  sayfalarındaki liste semantiği, bağlantılar ve görünürlük sorunları giderildi.
- Eski TDV ve MSB bağlantıları güncel doğrulanmış adreslerle yenilendi.
- 2016 Ramazan vaiz etkinlik sayfası kalıcı olarak kaldırıldı.

Kaynak notları: [Genel tarama](GENEL-TARAMA-2026-09-09.md),
[Tema iyileştirmesi](TEMA-IYILESTIRME-2026-09-09.md).

### 2. Ana sayfa, gündem vitrini ve akış

- Eski slider'dan bağımsız yeni **Gündem Vitrini** oluşturuldu.
- Embla Carousel 8.6 ile sürükleme, klavye okları, oynat/durdur, ilerleme
  göstergesi, küçük önizlemeler ve erişilebilir afiş penceresi eklendi.
- Afiş ve duyurular Brüksel tarihine göre seçiliyor; taslak, gizli veya süresi
  geçmiş yayınlar gösterilmiyor.
- Ana sayfa akışı hızlı erişim → gündem vitrini → namaz vakitleri → eğitim ve
  haftalık yaşam → duyurular/takvim → hizmetler → ziyaret → bağış sırasına
  alındı.
- Bağış bilgileri ve QR alanı açılır bölümde tutuluyor; IBAN kopyalama durumu
  kullanıcıya bildiriliyor.
- Masaüstü içerik yüksekliği azaltıldı; mobilde tek sütun, masaüstünde dengeli
  bölümler kullanılıyor.

Kaynak notları: [Ana sayfa vitrini](ANA-SAYFA-VITRINI.md),
[Ana sayfa akışı](ANA-SAYFA-AKISI.md).

### 3. İhtida (Müslüman olmak) formu

- Türkçe, Fransızca ve İngilizce adım adım form; yedi adım, ilerleme çubuğu,
  geri/devam düğmeleri, özetten ilgili alana dönüş ve son gönderimde tam
  doğrulama bulunuyor.
- Ulusal kimlik numarası formda istenmiyor.
- Vesikalık fotoğraf, kimlik belgesinin ön/arka yüzü ve başvuranın ekranda
  çizdiği imza ayrı rıza ve doğrulama kurallarıyla işleniyor.
- Başvuru adresi sokak/numara, posta kodu, şehir ve ülke olarak ayrılıyor;
  teslim adresi ile ikamet adresi birbirine karıştırılmıyor.
- Formdaki cami seçici Belçika’daki doğrulanmış katalogla çalışıyor; listede
  olmayan cami için manuel giriş korunuyor.
- Başka cami seçildiğinde Ulu Camii’ye ait varsayılan şahit veya kayıtlı imza
  taşınmıyor; iki farklı şahit adı elle giriliyor.
- Seçilen cami, şehir, posta kodu ve adres formdan admin ekranına ve PDF
  üretimine aynı kaynak kaydıyla aktarılıyor.

Kaynak notları: [Adımlı form](IHTIDA-ADIMLI-FORM-v27.md),
[Cami seçimi](IHTIDA-CAMI-SECIMI-v26.md),
[Belçika cami kataloğu](BELCIKA-CAMI-KATALOGU.md).

### 4. İhtida PDF paketi ve defteri

- EK-9, iki sayfalık EK-10, dilekçe ve kimlik/pasaport örneği tek PDF kuyruğu
  içinde hazırlanıyor; uzun metinler devam sayfasına taşıyor.
- EK-10 dört dilde iki sayfa ve tek ortak imza düzeninde tutuluyor.
- Başvuranın imzası yalnız açık rıza varsa ilgili alanlara aktarılıyor;
  müşavirin ıslak imza alanı boş bırakılıyor.
- Ön başvuru, gerçekleşmiş tören ve gerçek ihtida tarihi gibi bilgiler
  uydurulmuyor. Son nüsha admin onayından sonra gerçek tarih ve şahitler
  teyit edilerek hazırlanıyor.
- EK-9’da düzenleyen makam ve Müşavirlik unvanı kurumsal şablona işlendi;
  şahit adları ve imza teyidi belgeye göre kontrol ediliyor.
- Admin paneline **İhtida Defteri**, Word/PDF indirme ve kayıt–gönderim–dönüş–
  teslim takibi eklendi. Defterde kimlik numarası, fotoğraf, imza ve iletişim
  bilgisi tutulmuyor.
- Ulu Camii başvuruları deftere aktarılıyor; diğer cami başvuruları Ulu Camii
  defterine otomatik eklenmiyor.

Kaynak notları: [İhtida otomasyonu](IHTIDA-OTOMASYON-v25.md),
[İhtida defteri](IHTIDA-DEFTERI-v28.md),
[EK-9 şahit imzası](EK9-SAHIT-IMZASI.md).

### 5. İhtida video bölümü

- Videolar sayfanın diline göre ayrılıyor; Türkçe içerik Fransızca veya İngilizce
  sayfaya karışmıyor.
- Dersler aynı sayfada akordiyon olarak açılıyor; aynı anda bir oynatıcı açık
  kalıyor.
- Video oynatılmadan önce yerel kapak görseli gösteriliyor; YouTube iframe'i
  yalnız kullanıcının açık oynatma eyleminden sonra yükleniyor.
- Türkçe ve İngilizce Diyanet serileri doğrulandı. Fransızca bölümde doğrulanmış
  resmî içerik sınırlı olduğu için içerik bu sınır açıkça belirtilerek sunuluyor.
- YouTube oturum açma/bot kontrolü sitenin giriş sorunu değil, platformun kendi
  oynatma kontrolüdür; sayfada resmî kaynak ve normal izleme bağlantısı korunuyor.

Kaynak notu: [İhtida videoları](IHTIDA-VIDEOLARI.md).

### 6. Veli portalı ve öğrenci modu

- Veli portalında çocuklar için mektep çalışma odası oluşturuldu.
- Elif-Bâ harf tahtası, harf konumları, hareke kartları, klavye gezinimi,
  ezber odası, sûre/dua oynatıcıları ve etkileşimli mini quiz eklendi.
- Günün harfi, günün hadisi, başarı yıldızları, rozetler, konfeti ve yumuşak
  dokunma sesleriyle teşvik edici geri bildirim sağlandı.
- Kur’an sûreleri, âyetler ve Elif-Bâ sesleri için resmî Diyanet kaynakları
  kalıcı kural hâline getirildi; dış veya teyitsiz kıraat sesleri kullanılmıyor.
- Fransızca mealler için yerel ses dosyaları ve 0,75x–1,5x hız seçenekleri
  eklendi. Çocuk fotoğrafı veya biyometrik veri tutulmuyor; deterministik
  monogram avatar kullanılıyor.

Kaynak notu: [Öğrenci modu](OGRENCI-MODU-PORTAL.md).

### 7. Veli e-posta otomasyonu

- E-posta dili site diline göre değil, kayıt formundaki **İletişim dili**
  tercihine göre belirleniyor.
- Yeni kayıtlar otomatik veli listesine aktarılıyor; aynı ailedeki kardeşler
  çoğaltılmadan eşleştiriliyor.
- Cuma otomasyonu cuma günü Belçika saatine göre çalışacak şekilde hazırlandı;
  hafta sonu dersleri, ödevler, kitap/sayfa ve gerekli malzemeler yayımlanmış
  plandan okunuyor.
- Kurumsal sabit e-posta şablonu, kurs logosu ve telefon ekranında okunabilir
  ölçüler kullanılıyor. Ana metin 20 px, kitap/sayfa satırı 16 px.
- Başarılı gönderimler ve belirsiz sağlayıcı sonuçları kayda alınıyor; belirsiz
  durumda körlemesine yeniden gönderim yapılmıyor.

Kaynak notları: [E-posta dili](VELI-EPOSTA-DILI.md),
[Veli listesi otomasyonu](VELI-MAIL-LISTESI-OTOMASYONU.md),
[Cuma e-postası](VELI-CUMA-EPOSTASI.md).

## Kalıcı işletim kararları

- Kişisel hesaplar ve özel öğrenci/veli verileri kaynak koda veya Git'e taşınmaz.
- Canlı Firebase, Apps Script, e-posta ve yayın işlemleri yerel testten ayrıdır;
  yerel testin geçmesi canlıya yayımlandığını göstermez.
- Namaz vakitleri yalnız Diyanet kaynağından alınır.
- Çocuk fotoğrafı ve biyometrik veri öğrenci modunda istenmez veya saklanmaz.
- İhtida sürecinde ulusal kimlik numarası formdan alınmaz; resmî belgeye gerekiyorsa
  yetkili kişi tarafından manuel tamamlanır.
- Veli iletişiminde dil tercihi kayıttaki iletişim dilidir; dili eksik kayıt
  Türkçe varsayımıyla gönderilmez.

## Doğrulama özeti ve sınırlar

- İlgili notlarda Astro denetimi, derleme, site/CMS/iç bağlantı, tarayıcı,
  Firestore, ihtida/PDF ve veli e-postası testlerinin geçtiği kaydedilmiştir.
- Ana sayfa, ihtida formu ve video bölümü Chromium ile mobil/masaüstü ve koyu
  tema örneklerinde incelenmiştir.
- Fiziksel iPhone/Safari/Firefox cihaz testi yapılmamıştır.
- Harici DİBBYS sunucusundaki zaman aşımı yerel kodla giderilemez.
- 11 Eylül’de eklenen öğrenci modu commitlerinin canlı sitede görünmesi ayrıca
  yayın ve canlı sağlık kontrolüyle doğrulanmalıdır; yerel commit bunu tek başına
  kanıtlamaz.
- `hook failed` uyarısı web sitesi kodundan ayrı Codex/Windows kanca katmanına
  aittir; takip notu [HATA-AVI-2026-09-08](HATA-AVI-2026-09-08.md) içindedir.

### Bu döküm hazırlanırken çalıştırılan kalite kapısı

`npm run dogrula:codex` **11 Eylül 2026** tarihinde başarıyla tamamlandı:

- Astro kontrolü: **0 hata, 0 uyarı, 235 ipucu**.
- Derleme: **864 sayfa**.
- Site denetimi: **872 sayfa, 1.006 farklı site içi bağlantı; bulgu yok**.
- EK-9 kenar testleri ve ihtida/PDF sözleşme akışı: **33/33 geçti**.
- Tarayıcı testleri (masaüstü ve mobil Chromium): **218/218 geçti**.
- Firestore emülatör kuralları: **17/17 geçti**; canlı Firebase’e bağlanılmadı.
- Veli e-posta ve otomasyon testleri: **32/32 geçti**; gerçek veliye gönderim
  yapılmadı.
- Derleme sırasında boş `src/content/materyaller` klasörü için Astro bilgi
  uyarısı görüldü; bu bir derleme hatası değil, içerik klasörü boş olduğu için
  verilen mevcut uyarıdır.

Bu koşu yayın yapmadı, canlı Firebase/Apps Script verisi yazmadı ve e-posta
göndermedi.

## Sonraki oturum için önerilen sıra

1. Önce `git status --short` ve `npm run dogrula:codex` ile mevcut dalı kontrol et.
2. Öğrenci modu ve son içeriklerin canlıda olup olmadığını yalnız dernek
   hesaplarıyla salt okunur sağlık ve sayfa kontrolüyle doğrula.
3. Yeni bir içerik/form değişikliği istenirse TR/FR/EN yüzeylerini ve ilgili
   Apps Script sürümünü birlikte ele al.
4. E-posta veya form teslimi kontrol edilecekse sağlayıcı kabulü, teslim ve
   okunma durumlarını ayrı raporla; okunmayı teslim gibi sunma.

## Ayrıntılı kaynaklar

Bu özetin teknik ayrıntıları `docs/` altındaki konu notlarında tutulur:

- `GENEL-TARAMA-2026-09-09.md`
- `TEMA-IYILESTIRME-2026-09-09.md`
- `ANA-SAYFA-VITRINI.md`
- `ANA-SAYFA-AKISI.md`
- `IHTIDA-ADIMLI-FORM-v27.md`
- `IHTIDA-OTOMASYON-v25.md`
- `IHTIDA-CAMI-SECIMI-v26.md`
- `IHTIDA-DEFTERI-v28.md`
- `IHTIDA-VIDEOLARI.md`
- `OGRENCI-MODU-PORTAL.md`
- `VELI-EPOSTA-DILI.md`
- `VELI-MAIL-LISTESI-OTOMASYONU.md`
- `VELI-CUMA-EPOSTASI.md`
- `EK9-SAHIT-IMZASI.md`
- `ANTIGRAVITY-IS-AKISI.md`
