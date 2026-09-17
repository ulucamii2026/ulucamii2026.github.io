# Devir Notu — 17 Eylül 2026

**Tarih:** 17 Eylül 2026, 23:05 (Europe/Brussels)  
**Hazırlayan:** Antigravity / Codex  
**Amaç:** Oturum sırasında tamamlanan web sitesi güncellemeleri, e-posta işlemleri, kalite kapısı sonuçları ve bekleyen yayın adımlarının sonraki oturuma eksiksiz devri.

---

## 1. Tamamlanan İşlemler ve Canlı Kanıtları

### A. E-posta ve Veli İletişimi (`info@ulucamii.be`)
Tüm gönderimler `portal-yonetim.py` kurumsal şablonu (Kilim paleti, responsive, kurs logosu, Date ve Message-ID tam, Purelymail SMTP + IMAP Bcc teyidi) ile yapılmıştır:
1. **Sev Halilovic (`sevhalilovic@gmail.com`):**
   - *Konu:* Tina ve Irina için Rendeux sığınma merkezi idari süreci mazeret yanıtı (Fransızca).
   - *Durum:* Mazeret teyit edildi, kayıtlarının geçerli olduğu bildirildi.
   - *Kanıt:* `Message-ID: <178965359730.7424.12392453732296230741@ulucamii.be>`, IMAP UID `131`.
2. **Laetitia Auquier (`laetitia.auquier@icloud.com`):**
   - *Konu:* Tayip, Ramazan ve Tahir Şahbaz için kimlik tamamlama hatırlatması (Fransızca).
   - *Kanıt:* `Message-ID: <178965565727.17652.8262540315135703712@ulucamii.be>`, IMAP UID `132`.
3. **Elem Şahbaz (`elemsahbaz03@gmail.com`):**
   - *Konu:* Emir Şahbaz için kimlik tamamlama hatırlatması (Türkçe).
   - *Kanıt:* `Message-ID: <178965568137.17652.15382023958876040310@ulucamii.be>`, IMAP UID `133`.
4. **Sevilay Karatay (`sevilaykaratay900@gmail.com`):**
   - *Konu:* Tahir Efe Karatay (UC-2026-0021) için kimlik tamamlama hatırlatması (Fransızca).
   - *Kanıt:* `Message-ID: <178965570054.17652.5712924457458168124@ulucamii.be>`, IMAP UID `134`.

---

## 2. Web Sitesinde Yapılan Değişiklikler (Yerelde Hazır, Yayın Bekliyor)

| Dosya | Yapılan İşlem |
| :--- | :--- |
| `src/content.config.ts` | `fonKayitWeb: z.string().url().optional()` şema alanı eklendi. |
| `src/content/ayarlar/site.yaml` | `fonKayitWeb: https://diyanet.be/cenaze` değeri eklendi. |
| `src/sayfalar/Cenaze.astro` | Cenaze Nakil Fonu çevrim içi kayıt butonu ve metinleri (TR, FR, EN) entegre edildi. |
| `src/content/sayfalar/{tr,fr,en}/bagis.md` | BDV Çevrim İçi Bağış Portalı (`https://bagis.diyanet.be`) kartı ve butonları eklendi. |
| `src/sayfalar/DiyanetHizmetleri.astro` | BDV Çevrim İçi Bağış Portalı kartı üç dilde yerleştirildi. |
| `src/content/duyurular/tr/2026-sosyal-isler-musaviri-salih-gor-goreve-basladi.md` | Salih Gör'ün atanmasına dair 20 Nisan 2026 tarihli resmî Türkçe duyuru oluşturuldu. |
| `src/content/duyurular/fr/2026-sosyal-isler-musaviri-salih-gor-goreve-basladi.md` | Aynı duyurunun Fransızca versiyonu oluşturuldu. |

---

## 3. Kalite Kapısı Sonuçları
`npm run dogrula:codex` komutu başarıyla çalıştırıldı ve tüm adımlar geçti:
- ✅ **design:check** (Tasarım ve CSS token kontrolleri)
- ✅ **check** (Astro ve TypeScript tip denetimi)
- ✅ **dogrula** (İçerik ve rota doğrulama)
- ✅ **test:web** (214 Playwright testi: masaüstü, mobil, tablet, kontrast, WCAG AAA)
- ✅ **test:kurallar** (Firestore güvenlik kuralları)
- ✅ **test:veli-eposta** (57 e-posta şablon ve dil kural testi)
- ✅ **test:oto-kaydet** (14 oto-kaydet testi)
- ✅ **test:ogrenme** (8 öğrenme atölyesi testi)

---

## 4. Sıradaki Adımlar ve Bekleyen Kararlar

1. **GitHub Pages Yayını (Push):**
   - Değişiklikler yerel çalışma dizininde staged/unstaged durumdadır.
   - Kullanıcı canlı yayın izni verdiğinde:
     `powershell scripts/gh-cami.ps1` ile hesap doğrulanıp (`ulucamii2026`), `git add`, anlamlı bir commit mesajı ve `git push origin main` çalıştırılacaktır.
2. **Öğrenci Kimlik Belgeleri Takibi:**
   - Şahbaz ve Karatay ailelerinden gelecek yanıtlar `info@ulucamii.be` veya WhatsApp üzerinden kontrol edilecektir.
   - 19 Eylül 2026 Cumartesi saat 11.00'deki ilk derste teslim edilmeyen belgelerin fotokopisi elden istenecektir.
