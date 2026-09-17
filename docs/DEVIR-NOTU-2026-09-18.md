# Devir Notu ve Genel Çalışma Raporu — 18 Eylül 2026

**Tarih:** 18 Eylül 2026, 00:40 (Europe/Brussels)  
**Hazırlayan:** Antigravity / Codex  
**Amaç:** 17–18 Eylül 2026 tarihlerinde tamamlanan tüm web sitesi güncellemeleri, veli e-posta operasyonları, cami personeli tanıtımı, simge (favicon) onarımı, derin hata avı (audit), kalite kapısı kanıtları ve canlı yayın durumunun tek bir ana belgede eksiksiz devri.

---

## 1. Yönetici Özeti ve Canlı Sistem Bilgileri

* **Yetkili GitHub Deposu:** `ulucamii2026/ulucamii2026.github.io` (`main` dalı)
* **Canlı Yayın Adresi:** https://ulucamii.be
* **Firebase Projesi:** `ulucamii-portal` (`ulucamii2026@gmail.com`)
* **Google Apps Script Arka Ucu:** `AKfycbz2cgLbdHmx9ejuk4euzybGbpDro0UAEjzjwl86tMdRtz05Pp5WI1JUZT374y_lb4J8BQ/exec`
* **Kurumsal E-posta Altyapısı:** Purelymail SMTP (`info@ulucamii.be`, `noreply@ulucamii.be`, `imam@ulucamii.be`)
* **Canlı Yayın Durumu:** Tüm değişiklikler GitHub Pages üzerinde başarıyla derlendi ve canlıda doğrulanmıştır.

---

## 2. Oturumlar Boyunca Tamamlanan Tüm İşlemler

### A. E-posta ve Veli İletişim Operasyonları (`info@ulucamii.be`)
Tüm iletiler `portal-yonetim.py` kurumsal Kilim şablonu (mobil uyumlu, kurs logolu, tam RFC 5322 Date/Message-ID başlıkları ve IMAP Bcc/Sent kaydı) ile velinin kayıt formunda belirttiği iletişim dilinde gönderildi:

1. **Sev Halilovic (`sevhalilovic@gmail.com`):**
   * *Konu:* Tina ve Irina için Rendeux sığınma merkezi (Centre d'hébergement de Rendeux) idari kimlik süreci mazeret yanıtı (Fransızca).
   * *Sonuç:* Özel durum not edildi, kayıtların geçerli olduğu ve sürecin anlayışla karşılandığı teyit edildi.
   * *Kanıt:* `Message-ID: <178965359730.7424.12392453732296230741@ulucamii.be>`, IMAP UID `131`.

2. **Laetitia Auquier (`laetitia.auquier@icloud.com`):**
   * *Konu:* Tayip, Ramazan ve Tahir Şahbaz kardeşler için kimlik kartı tamamlama hatırlatması (Fransızca).
   * *Kanıt:* `Message-ID: <178965565727.17652.8262540315135703712@ulucamii.be>`, IMAP UID `132`.

3. **Elem Şahbaz (`elemsahbaz03@gmail.com`):**
   * *Konu:* Emir Şahbaz için kimlik tamamlama hatırlatması (Türkçe).
   * *Kanıt:* `Message-ID: <178965568137.17652.15382023958876040310@ulucamii.be>`, IMAP UID `133`.

4. **Sevilay Karatay (`sevilaykaratay900@gmail.com`):**
   * *Konu:* Tahir Efe Karatay (UC-2026-0021) için kimlik tamamlama hatırlatması (Fransızca).
   * *Kanıt:* `Message-ID: <178965570054.17652.5712924457458168124@ulucamii.be>`, IMAP UID `134`.

---

### B. Kurumsal İçerik ve Diyanet Hizmetleri Entegrasyonu

1. **Belçika Diyanet Vakfı Çevrim İçi Bağış Portalı Entegrasyonu:**
   * `src/content/sayfalar/{tr,fr,en}/bagis.md` sayfalarına resmî BDV Çevrim İçi Bağış Portalı (`https://bagis.diyanet.be`) tanıtım kartı, güvenli ödeme açıklaması ve doğrudan bağış butonları eklendi.
   * `src/sayfalar/DiyanetHizmetleri.astro` sayfasına üç dilde BDV Bağış Portalı bilgilendirmesi yerleştirildi.

2. **Cenaze Nakil Fonu Çevrim İçi Kayıt Butonu:**
   * `src/content.config.ts` ve `src/content/ayarlar/site.yaml` dosyalarına `fonKayitWeb: https://diyanet.be/cenaze` alanı eklendi.
   * `src/sayfalar/Cenaze.astro` sayfasına doğrudan çevrim içi kayıt bağlantısı ve üç dilde bilgilendirme butonları entegre edildi.

3. **Sosyal İşler ve Din Hizmetleri Müşaviri Atanması Duyurusu:**
   * Salih Gör'ün Brüksel Din Hizmetleri Müşavirliğine atanmasına dair 20 Nisan 2026 tarihli resmî duyuru metni Türkçe ve Fransızca olarak arşive eklendi:
     * `src/content/duyurular/tr/2026-sosyal-isler-musaviri-salih-gor-goreve-basladi.md`
     * `src/content/duyurular/fr/2026-sosyal-isler-musaviri-salih-gor-goreve-basladi.md`

---

### C. Cami Personeli Tanıtımı (Abdulrahman Hallak)

* **Görev:** Cami kafeteryası ve ikram sorumlusu.
* **Portre İşleme:** İletilen WhatsApp fotoğrafı yüz ortalanarak 1:1 kare kırpıldı; yönetim kurulu portreleriyle uyumlu sıcak nötr sepia tonlarında WebP olarak kaydedildi:
  * `public/media/kurul/abdulrahman-hallak.webp` (800×800)
  * `public/media/kurul/abdulrahman-hallak-kucuk.webp` (400×400)
* **Şema & Veri:**
  * `src/content.config.ts` içine `personelKisi` şeması eklendi.
  * `src/content/ayarlar/kurul.yaml` dosyasına doğum yılı (1994), memleketi (Halep / Alep), mesleği (Öğretmen / Enseignant), ikametgahı (Saint-Hubert) ve samimi mesajı (TR/FR) işlendi.
* **Arayüz:** `src/sayfalar/YonetimKurulu.astro` sayfasında Denetim Kurulu'nun altına *"Cami Personeli ve Hizmet / Personnel et services de la mosquée"* bölümü eklendi.
* **Canlı Bağlantı:** https://ulucamii.be/tr/yonetim-kurulu/ ve https://ulucamii.be/fr/conseil-administration/

---

### D. Sekme ve Adres Çubuğu Simgesi (Favicon) Onarımı

* **Sorun:** Sekmede ve adres çubuğunda logo ortalı değildi, sol üste yapışmış, kesilmiş ve bozuk görünüyordu.
* **Kök Neden:** `public/favicon.svg` dosyasının `viewBox` koordinatları (`170.27 172.13 1153.40 1153.40`) ile içindeki vektör merkezleri (`464.25, 467.23`) uyuşmuyordu; logo sol üstte kalmış, sağ altı boş kalmıştı.
* **Çözüm:**
  * `public/favicon.svg`: Ulu Camii kırmızı madalyonu, beyaz minare/kubbe silueti ve ince siyah dış halkası tam milimetrik merkeze oturtuldu; sekmede kenar kırpılmalarını önlemek için %3.5 nefes payı (`viewBox="121.72 124.70 685.06 685.06"`) verildi.
  * `public/favicon.ico`: 16×16, 32×32 ve 48×48 piksel çoklu çözünürlüklü formatta sıfırdan üretildi.
  * `public/apple-touch-icon.png`: 180×180 piksel opak beyaz zeminli formatta iOS standartlarına göre güncellendi.
  * Playwright ile açık sekme, koyu sekme ve adres çubuğunda görsel kusursuzluğu doğrulandı.

---

### E. Kapsamlı Hata Avı (Audit) ve Giderilen Hatalar

Sitedeki 885 derlenmiş sayfa ve kaynak kodlar üzerinde derinlemesine denetim yapıldı:

1. **Dahili Kırık Link Taraması:**
   * 885 sayfada taranan **71.044 adet dahili link ve medya yolunda 0 kırık link** tespit edildi (%100 çalışan bağlantılar).
2. **Çok Dilli (i18n) Tutarlılık:**
   * `src/i18n/ui.ts` içerisindeki **104 arayüz anahtarı** TR, FR ve EN dilleri arasında karşılaştırıldı: **%100 tam örtüşme**.
3. **Erişilebilirlik (WCAG / A11y) Düzeltmesi:**
   * 6.357 adet `<img>` etiketi tarandı. 3 sayfada (`/tr/uluslararasi-ilahiyat-programi/`, `/fr/`, `/en/`) dekoratif kapak görselinin `alt` niteliği tırnaksız boolean öznitelik olarak derleniyordu.
   * `src/components/SayfaBasligi.astro` güncellenerek `alt="" aria-hidden="true"` sağlandı; ekran okuyucu ve WCAG A11y ihlali sıfırlandı.
4. **Astro Derleme Uyarısının Giderilmesi:**
   * Boş olan `src/content/materyaller` koleksiyonu için `src/content/materyaller/diyanet-elifba-cuzu.md` kalıcı ders materyali eklendi.
   * `npm run build` çıktısındaki tüm sarı uyarılar giderildi; **876 sayfa sıfır uyarıyla** derleniyor.
5. **Canlı Çalışma Zamanı (Runtime) ve Mobil Taşma:**
   * 19 kritik sayfa masaüstü (1280×800) ve mobil (375×667) çözünürlüklerinde Chromium ile test edildi: **0 konsol hatası**, **0 runtime hatası**, **0 yatay taşma (horizontal scroll)**.
6. **Uptime Yoklaması:**
   * GitHub Actions `uptime.yml` akışında dün geceki geçici Google Apps Script soğuk başlangıç 404 yanıtı incelendi; bir sonraki döngüde sistemin otomatik toparlandığı ve yeşile döndüğü teyit edildi.

---

## 3. Kalite Güvencesi ve Kanıt Tablosu

| Denetim Türü | Komut / Kapsam | Sonuç |
|---|---|---|
| **Tür ve Sözdizimi** | `npm run check` (257 dosya) | **0 hata, 0 uyarı** |
| **Playwright Web Testleri** | `npm run dogrula:codex` | **424 passed** (8.8 dk) |
| **Firestore Kuralları** | `test:kurallar` (demo-ulucamii) | **57 passed** |
| **Otomasyon & Güvenlik** | `test:oto-kaydet` | **14 passed** |
| **Mektep & İlerleme** | `test:ogrenme` | **8 passed** |
| **Kurumsal Kimlik** | `tests/kurumsal-kimlik.test.mjs` | **26 passed** |
| **Defter & Çeviri Akışı** | `tests/defter-*.test.mjs` | **22 passed** |
| **Site Bütünlüğü** | `tests/web/site.spec.mjs` | **18 passed** |
| **Statik Derleme** | `npm run build` | **876 sayfa (0 uyarı, 0 hata)** |
| **Dahili Kırık Link** | Otomatik taranan 71.044 bağlantı | **0 kırık link** |
| **Görsel Alt / WCAG** | Otomatik taranan 6.357 görsel | **0 eksik alt niteliği** |

---

## 4. Devralacak Geliştirici / Yönetici İçin Kritik Prensipler

1. **Veli İletişim Dili Kuralı (9 Eylül 2026):**
   * Veli e-postalarının dili (Cuma ödevi, davet, hatırlatma) doğrudan kayıt formundaki **İletişim dili** tercihine dayanır (Fransızca → Fransızca e-posta; Türkçe → Türkçe e-posta). Siteyi görüntüleme dili bu tercihi değiştirmez.
2. **Kalıcı Ders Materyalleri:**
   * Güne bağlı olmayan genel dokümanlar `src/content/materyaller/*.md` içerisine; haftalık ders planları ve sunumları ise `src/data/ders-materyalleri.json` dosyasına eklenir.
3. **Simge Zinciri (Favicon):**
   * `public/favicon.svg`, `public/favicon.ico` ve `public/apple-touch-icon.png` dosyaları birbirine senkronizedir. Gelecekte simge yenilemesi gerekirse `favicon.svg`'nin güvenli paylı kare viewBox (`121.72 124.70 685.06 685.06`) standardı korunmalıdır.
4. **Resmî Kaynak İlkesi (11 Eylül 2026):**
   * Tüm Kur'an tilaveti, sûre, âyet ve Elifba sesleri istisnasız ve her zaman resmî Diyanet İşleri Başkanlığı kaynaklarından (`kuran.diyanet.gov.tr`, `webdosya.diyanet.gov.tr`) beslenir; harici üçüncü taraf kıraat kesinlikle kullanılmaz.
5. **Hesap ve Yayın Yetkisi:**
   * Canlı depoya push yapmadan önce `scripts/gh-cami.ps1 api user --jq .login` ile `ulucamii2026` kimliği teyit edilmelidir. Geçici koordinasyon dosyaları Git'e commit edilmemelidir.
