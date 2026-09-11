# Esma Avcı — Telefon Odaklı Sosyal Medya Afişleri v2 (2026–2027)

Bu klasör, Marche-en-Famenne Ulu Camii ve Namur Camii hanım, genç kız ve kız öğrenci dersleri için hazırlanan **telefon odaklı sosyal medya afişlerini (1080x1350 akış ve 1080x1920 hikâye)** içermektedir.

---

## 🎨 Tasarım Dili ve İlkeler

- **Eski Seriden Tamamen Bağımsız Yeni Görsel Dil:** Koyu aubergine, ince altın çerçeve, grid, kemer/portal, EA rozeti, kurum logoları ve klasik PDF görünümü kullanılmamıştır.
- **Aydınlık Gündüz & 3D Kâğıt Formları:** Aydınlık gündüz atmosferi, kâğıt kolaj ve yumuşak 3D kâğıt katmanları (tactile layered paper craft); elektrik mavisi, ultramarin, limon sarısı, mercan, narenciye turuncusu, adaçayı yeşili ve sıcak fildişi/krem tonları.
- **Özgün AI Arka Planlar:** 8 konunun her biri için özel olarak üretilen, yazı, logo, sahte harf veya insan yüzü içermeyen saf soyut kâğıt sanatı arka planları kullanılmıştır.
- **Telefonda Yüksek Kontrast & Kristal Netlik:** Yazılar, arkadaki 3D kâğıt dalgalarını çevreleyen yumuşak gölgeli ve yarı saydam (%94 opak) modern beyaz cam plaka üzerinde yer alır.
- **Kusursuz Tipografi:** Türkçe karakterler (ğ, ü, ş, ı, ö, ç, İ) hatasızdır; başlıklar 76–94 px, gövde metinleri 26–34 px aralığındadır. Saat ve konum bilgileri özel renkli bloklarda (pill badge) konumlandırılmıştır.
- **Hikâye Güvenli Alanı:** 1080x1920 hikâyelerde üstten ve alttan en az 230 px güvenli alan bırakılmış; Instagram ve WhatsApp arayüz butonlarının metinleri kapatması engellenmiştir. Kenarlarda en az 80 px pay bulunmaktadır.

---

## 📁 16 Afiş Dosya Listesi ve Boyutları

| No | Konu Başlığı | Akış Gönderisi (1080x1350) | Hikâye (1080x1920) | Renk Paleti & Tema |
|:---|:---|:---|:---|:---|
| **00** | Haftalık Buluşmalar | `00-haftalik-bulusmalar-akis.png` | `00-haftalik-bulusmalar-hikaye.png` | Elektrik Mavisi & Limon Sarısı |
| **01** | Pazartesi Hanımlar | `01-pazartesi-hanimlar-akis.png` | `01-pazartesi-hanimlar-hikaye.png` | Adaçayı Yeşili & Nane |
| **02** | Perşembe Hanımlar | `02-persembe-hanimlar-akis.png` | `02-persembe-hanimlar-hikaye.png` | Mercan & Şeftali & Krem |
| **03** | Çarşamba Marche Buluşması | `03-carsamba-marche-bulusmasi-akis.png` | `03-carsamba-marche-bulusmasi-hikaye.png` | Narenciye Turuncusu & Güneş Sarısı |
| **04** | Cuma Genç Kızlar | `04-cuma-genc-kizlar-akis.png` | `04-cuma-genc-kizlar-hikaye.png` | Ultramarin & Elektrik Camgöbeği |
| **05** | Hafta Sonu Kız Öğrenciler | `05-hafta-sonu-kiz-ogrenciler-akis.png` | `05-hafta-sonu-kiz-ogrenciler-hikaye.png` | Gök Mavisi & Canlı Limon Sarısı |
| **06** | Birebir Görüşme / MDR | `06-birebir-gorusme-mdr-akis.png` | `06-birebir-gorusme-mdr-hikaye.png` | Dingin Adaçayı & Yumuşak Lavanta |
| **07** | Haftalık Akış | `07-haftalik-akis-akis.png` | `07-haftalik-akis-hikaye.png` | Çok Renkli Aydınlık Kâğıt Kolajı |

---

## 🛠️ Üretim ve Yeniden Derleme

Tüm afişler `uretim.py` betiği ile yerel Chrome / Edge headless motoru üzerinden tek komutla piksel kusursuzluğunda derlenir:

```powershell
# Klasöre geçiniz
cd D:\app\ulucamii-site\docs\afisler\esma-avci-social-v2-2026-2027

# Üretim betiğini çalıştırınız
python uretim.py
```

### Klasör Yapısı
```
esma-avci-social-v2-2026-2027/
├── BRIF.md                                # Proje teknik ve tasarım brifi
├── README.md                              # Bu dokümantasyon
├── uretim.py                              # Otomatik üretim motoru (HTML5 + Headless Browser)
├── kaynaklar/                             # AI ile üretilen 8 adet özgün 3D kâğıt arka planı
│   ├── bg-00-haftalik-bulusmalar.jpg
│   ├── bg-01-pazartesi-hanimlar.jpg
│   ├── bg-02-persembe-hanimlar.jpg
│   ├── bg-03-carsamba-marche.jpg
│   ├── bg-04-cuma-genc-kizlar.jpg
│   ├── bg-05-hafta-sonu-kiz-ogrenciler.jpg
│   ├── bg-06-birebir-gorusme-mdr.jpg
│   └── bg-07-haftalik-akis.jpg
└── *.png                                  # 16 adet nihai afiş (1080x1350 ve 1080x1920)
```

---

## 🔒 Kalite ve Uyumluluk Notları
- Canlı site kaynaklarına ve kodlarına dokunulmamıştır.
- Yalnız PNG formatında üretim yapılmıştır.
- Tüm görseller telefon ekranında anında okunacak şekilde test edilmiştir.
