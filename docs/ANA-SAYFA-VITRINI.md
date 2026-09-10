# Ana Sayfa Vitrini (Gündem Vitrini) — Teknik Mimari ve Doğrulama

Bu belge, ana sayfa `GundemVitrini` bileşeninin mimarisini, Embla 8.6 entegrasyonunu, içerik kurallarını ve güncel doğrulama durumunu tanımlar.

---

## 1. Mimari ve Bileşen Yapısı

* **Bileşen:** `src/components/GundemVitrini.astro` (Afiş ve duyuru birleşik vitrin bileşeni).
* **İstemci Betiği:** `src/scripts/gundem-vitrini.ts` (Bağımsız TypeScript kontrolcüsü).
* **Stil Dosyası:** `src/styles/gundem-vitrini.css` (Özerk stil sayfası).
* **Seçim Mantığı:** `src/lib/vitrin-secimi.ts` (Brüksel takvimine göre deterministik filtre).
* **Namaz Vakitleri Uyumu:** 6 vakitlik gösterge vitrin sahnesi altında bağımsız olarak konumlanır.

---

## 2. Kütüphane ve Teknik Standartlar

* **Seçilen Kütüphane:** Kararlı `embla-carousel` 8.6.0 ve `embla-carousel-autoplay` 8.6.0 (sabitlenmiş sürüm; v9 RC kullanılmaz).
* **Kaynak ve Referans Bağlantıları:**
  * Embla Autoplay Dokümantasyonu: [Embla Carousel Autoplay v8](https://www.embla-carousel.com/docs/v8/plugins/autoplay)
  * W3C Erişilebilirlik Standardı: [W3C WAI-ARIA Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)

---

## 3. UX ve Erişilebilirlik Hedefleri

* **Petrol Sahne & Tam Oran:** Kurumsal petrol zemin; afişler kırpılmadan tam en-boy oranında sergilenir.
* **Film Şeridi (Thumbnails):** Küçük önizlemelerle slaytlar arası hızlı görsel gezinme.
* **Etkileşim:** Dokunmatik/fare sürükleme, klavye desteği (Oklar, Tab, Space/Enter), durdur/oynat ve ilerleme çubuğu.
* **Detay & Modal:** Yerel HTML `<dialog>` ile afiş büyütme; net ve erişilebilir kapatma düğmesi.
* **No-JS Desteği:** JavaScript kapalıyken tüm bağlantılar ve temel vitrin içeriği erişilebilir kalır.

---

## 4. İçerik Seçim ve CMS Kuralları (`vitrin-secimi.ts`)

* **Kapasite ve Dağılım:** Vitrinde en fazla **6 yayın** yer alır. Hedef min 1, maks 2 afiş; yeterli duyuru yoksa afişlerle 6'ya tamamlanır.
* **Zaman ve Yaş Sınırı:** Brüksel takvim gününe göre son 90 gün içindeki içerikler listelenir. `oneCikan` veya `vitrin: goster` 90 gün sınırını aşabilir; son gösterim (`vitrinSon` veya `oneCikanSon`) geçmişse elenir.
* **Durum Yönetimi:** `otomatik`, `goster`, `gizle`. `taslak`, `gelecek` veya `gizli` içerikler hariç tutulur.
* **Görsel Tekilleştirme:** Aynı görsel birden fazla kayıtta varsa duyuru nitelikli içerik tercih edilir.
* **Dil ve Çok Dillilik:** EN vitrininde içerik kaynağı Fransızcadır (FR); ortak afişlerde Türkçe başlık kullanılabilir ve arayüzde kaynak notu (`enKaynakMetni`) gösterilir.
* **Kurumsal Sınırlar:** Dernek resmî banka bilgileri, iletişim kanalları ve bağış/hesap sınırları değiştirilemez.
* **Yayın Mekanizması:** `.github/workflows/deploy.yml` ile her gün **03:30 UTC**'de derleme yapılır; tarihler derleme anında değerlendirilir.

---

## 5. Doğrulama ve Test Durumu (10 Eylül 2026)

* **Derleme (Build - 13:14):** 867 sayfa yerel olarak sıfır hatayla üretildi.
* **Tip ve Statik Denetim (`astro check`):** 0 hata, 0 uyarı, 240 ipucu (hints).
* **Görsel ve Duyarlı Tasarım İncelemesi:**
  * TR (1440px desktop), FR (390px mobil), EN (768px tablet) ve TR (320px dark mode) gerçek ortamda test edildi.
  * 0 taşma (overflow), 0 konsol hatası; afişler tam en-boy oranında, gezinme kontrolleri ve dialog kapatma düğmesi tam görünür, masaüstü 6 vakit tablosu net ve okunaklı.
* **Kapsamlı Test Paketi (`npm run dogrula:codex`, 13:20):** Tamamı geçti: statik kontrol, derleme/iç bağlantı/CMS/PDF denetimleri, 200 tarayıcı testi, 17 yalıtılmış Firestore kural testi ve 32 veli e-postası testi.
* **Ek dokunma doğrulaması:** Chromium mobil bağlamında CDP `touchStart/touchMove/touchEnd` ile ilk yayından ikinciye geçildi; sürükleme afiş penceresini yanlışlıkla açmadı.
* **Test sınırı:** Görsel ve etkileşim kontrolleri Chromium üzerinde yapıldı; fiziksel iPhone/Safari testi yapılmadı. Canlı form veya e-posta gönderimi bu slider doğrulamasının parçası değildir.
* **Yayın kopyası:** Bağımsız worktree'de temiz bağımlılık kurulumu, derleme, 875 sayfa / 1009 iç bağlantı ve CMS denetimi geçti; ayrıca 66 ana sayfa/slider testi geçti.
* **Canlı doğrulama (13:34):** `cf6c105e7e6c5715a6a91838b26b0adbfe69050f` yayımlandı. TR/FR/EN ana sayfaları HTTP 200; altı yayın, ileri/geri, afiş penceresi, Escape ve odağın geri dönmesi doğrulandı. Yatay taşma ve yakalanan JavaScript çalışma zamanı hatası yok.
* **Dağıtım gözlemi:** İlk Actions akışı `34471326278`, deploy işinin 5 dakikalık sınırında iptal göründü. Buna rağmen Pages dağıtım API'si `succeed` döndürdü ve yeni site canlıda doğrulandı. İş akışı rengi tek başına canlı sürümün kanıtı değildir.
* **Yayın süresi düzeltmesi:** `ae3d1ca25763eb6060d226b1096937c56e789e59` ile deploy işi 15 dakika, Pages eylemi 600000 ms bekleyecek şekilde ayarlandı. `34472392787` numaralı iş akışı tamamen başarılı tamamlandı.
