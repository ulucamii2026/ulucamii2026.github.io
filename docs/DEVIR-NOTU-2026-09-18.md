# Ulu Camii Projesi — Devir ve Çalışma Notu (18 Eylül 2026)

**Tarih:** 18 Eylül 2026, 00:35 (Belçika / CEST)  
**Yetkili Depo:** `ulucamii2026/ulucamii2026.github.io` (`main` dalı)  
**Canlı Alan Adı:** `https://ulucamii.be`  
**Firebase Projesi:** `ulucamii-portal` (`ulucamii2026@gmail.com`)  
**E-posta Altyapısı:** `info@ulucamii.be`, `noreply@ulucamii.be`, `imam@ulucamii.be` (Purelymail SMTP)  

---

## 1. Bu Oturumda Gerçekleştirilen İşler ve Çözümler

### A. Cami Personeli Eklemesi (Abdulrahman Hallak)
* **Talep:** Cami kafeteryası ve ikram sorumlusu Abdulrahman Hallak'ın sitede personel olarak tanıtılması.
* **Görsel Optimizasyonu:** WhatsApp portre fotoğrafı yüz merkezli 1:1 kare kırpılarak WebP formatında optimize edildi:
  * `public/media/kurul/abdulrahman-hallak.webp` (800x800, q=85)
  * `public/media/kurul/abdulrahman-hallak-kucuk.webp` (400x400, q=80)
* **Şema & Veri:**
  * `src/content.config.ts` koleksiyon şemasına `personelKisi` tanımı eklendi.
  * `src/content/ayarlar/kurul.yaml` dosyasına görev unvanı (*"Cami Kafeteryası ve İkram Hizmetleri / Cafétéria et services d'accueil de la mosquée"*), doğum yılı (1994), memleketi (Halep / Alep), mesleği (Öğretmen / Enseignant) ve samimi kardeşlik mesajı (TR/FR) eklendi.
* **Arayüz:** `src/sayfalar/YonetimKurulu.astro` sayfasına kurul portreleriyle aynı sıcak nötr monokrom sepia filtre uyumunda semantik `<section aria-labelledby="personel-baslik">` personel kartı eklendi.

### B. Sekme ve Adres Çubuğu Simgesi (Favicon) Düzeltmesi
* **Sorun:** Sekme ve adres çubuğundaki küçük simge ortalı değildi; sol üst köşeye yapışmış, kesilmiş ve sağ-altı boş kalmıştı.
* **Kök Neden:** `public/favicon.svg` dosyasının `viewBox` koordinatları (`170.27 172.13 1153.40 1153.40`) ile içindeki vektörlerin merkezi (`464.253, 467.2335`) uyumsuzdu.
* **Çözüm:**
  * `public/favicon.svg`: Ulu Camii kırmızı madalyonu, beyaz cami silueti ve siyah dış konturu tam milimetrik merkeze oturtuldu; sekmede kenardan taşmayı önlemek için %3.5 güvenli kenar payı (`viewBox="121.72 124.70 685.06 685.06"`) verildi.
  * `public/favicon.ico`: 16x16, 32x32 ve 48x48 piksel çoklu katmanlı formatta yeniden üretildi.
  * `public/apple-touch-icon.png`: 180x180 piksel opak beyaz zeminli formatta iOS standartlarına göre güncellendi.
  * Playwright ile hem açık hem koyu sekme çubuğu ve adres çubuğunda görsel kusursuzluğu doğrulandı.

### C. Kapsamlı Hata Avı (Site Audit & Bug Hunt)
Sitedeki 885 derlenmiş sayfa ve kaynak kodlar üzerinde derinlemesine denetim yapıldı:
1. **Dahili Kırık Linkler:** 885 HTML sayfasında taranan **71.044 adet dahili link ve medya yolunda 0 kırık link** tespit edildi (%100 çalışan bağlantılar).
2. **Çok Dilli (i18n) Tutarlılık:** `src/i18n/ui.ts` içerisindeki 104 arayüz anahtarının tamamının TR, FR ve EN dillerinde %100 eksiksiz karşılığı olduğu doğrulandı.
3. **Erişilebilirlik (WCAG / A11y) Düzeltmesi:**
   * 6.357 adet `<img>` etiketi tarandı. 3 sayfada (`/tr/uluslararasi-ilahiyat-programi/`, `/fr/`, `/en/`) dekoratif kapak görselinin `alt` niteliği tırnaksız boolean öznitelik olarak derleniyordu.
   * `src/components/SayfaBasligi.astro` bileşeni güncellenerek dekoratif görsele `alt="" aria-hidden="true"` verildi; taramadaki A11y eksikliği sıfırlandı.
4. **Astro Derleme Uyarısının Giderilmesi (`src/content/materyaller`):**
   * Her derlemede çıkan `No files found matching "*.md"` ve `collection "materyaller" does not exist or is empty` uyarısı giderildi.
   * `src/content/materyaller/diyanet-elifba-cuzu.md` dosyası oluşturularak Diyanet İşleri Başkanlığı resmî Elifbâ cüzü kalıcı materyal olarak tanımlandı; derleme uyarıları sıfırlandı (876 sayfa sıfır uyarıyla derleniyor).
5. **Canlı Çalışma Zamanı (Runtime) ve Mobil Taşma:**
   * 19 kritik sayfa masaüstü (1280x800) ve mobil (375x667) çözünürlüklerinde Chromium ile test edildi. 0 konsol hatası, 0 runtime hatası, 0 yatay taşma (horizontal scroll) teyit edildi.
6. **Uptime Yoklaması:**
   * GitHub Actions `uptime.yml` akışında geçici Google Apps Script soğuk başlangıç 404 yanıtı incelendi; bir sonraki döngüde sistemin otomatik toparlandığı ve yeşile döndüğü kanıtlandı.

---

## 2. Kalite Kapısı ve Doğrulama Kanıtları

* `npm run check`: **0 hata, 0 uyarı** (257 dosya).
* `npm run dogrula:codex`:
  * Playwright Web Testleri: **424 passed** (8.8 dk)
  * Firestore Güvenlik Kuralları: **57 passed** (demo-ulucamii)
  * Otomatik Kayıt Kuralları: **14 passed**
  * Mektep ve Öğrenme İlerleme Testleri: **8 passed**
  * Kurumsal Kimlik Testleri: **26 passed**
  * Çeviri ve Defter Akış Testleri: **22 passed**
  * Site Bütünlük Testleri: **18 passed**
* `npm run build`: **876 sayfa sıfır uyarı ve sıfır hatayla derlendi**.
* `git push origin main`: Tüm değişiklikler `main` dalına aktarıldı, GitHub Pages derlemesi başarıyla tamamlandı.

---

## 3. Devralacak Geliştirici / Yönetici İçin Önemli Notlar

1. **Simgeler (Favicon):**
   * `public/favicon.svg`, `public/favicon.ico` ve `public/apple-touch-icon.png` dosyaları birbirine senkronizedir. Gelecekte simge değişikliği gerekirse `public/favicon.svg`'nin `viewBox="121.72 124.70 685.06 685.06"` merkezli yapısı bozulmamalıdır.
2. **Kalıcı Ders Materyalleri:**
   * Güne bağlı olmayan genel belgeler `src/content/materyaller/*.md` altına eklenir (kategori: `ezber`, `rehber`, `tablo`, `alistirma` vb.).
   * Günlük ders planları ve haftalık sunumlar ise `src/data/ders-materyalleri.json` dosyasından beslenir.
3. **Veli İletişim Dili Kuralı:**
   * Kayıt formunda velinin seçtiği iletişim dili (TR veya FR) mutlaktır. Veli e-postaları (Cuma ödevi, davet, hatırlatma) daima velinin seçtiği dilde hazırlanır; site görüntüleme dili bu tercihi değiştiremez.
4. **Hesap Güvenliği & Canlı İşlemler:**
   * Canlı depoya push yapmadan önce `scripts/gh-cami.ps1 api user --jq .login` ile `ulucamii2026` hesabı teyit edilmelidir.
   * `CODEX-DEFTER-KOORDINASYON.md` veya geçici koordinasyon dosyaları Git'e sahnelenmemelidir.
