# Apps Script arka ucu (kayıt + ihtida)

Kur'an kursu kayıt formu ile ihtida başvurusunun **arka ucu**. Tek bir Apps Script projesi
her iki formu da karşılar: veriyi başvuru defterine (Sheets) yazar, PDF ve görselleri
Drive'a koyar, bildirim e-postası gönderir ve yönetim paneline liste/belge uçları sunar.

> **Bu klasör neden var:** kod 25 Ağustos 2026'ya kadar yalnız `D:\tmp\gas\` altında
> duruyordu — geçici bir klasörde, sürüm takibi olmadan. Canlı başvuru sisteminin tek
> kaynağı böyle bir yerde durmamalı. Artık depoda; `D:\tmp\gas\` yalnız dağıtım betiklerinin
> çalışma alanı.

## Dosyalar

| Dosya | Durum |
|---|---|
| `ulucamii-Kod-v10.gs` | **Canlıda** — 25 Ağustos 2026'da dağıtıldı |
| `ulucamii-Kod-v9.gs` | Önceki sürüm, karşılaştırma için duruyor |

> **Anahtarlar bu dosyalarda YOKTUR.** Depo public olduğu için panel API anahtarı koddan
> çıkarıldı; yerinde `SCRIPT-PROPERTIES-ICINDE` yer tutucusu durur. Gerçek değer Apps
> Script'in **komut dosyası özelliklerinde** (`PANEL_ANAHTARI`). Doğrulandı: yer tutucu
> dizeyle yapılan istek `yetkisiz` döner, gerçek anahtarla çalışır.

## v10'daki düzeltmeler (25 Ağustos 2026 denetimi)

Dördü de dünkü çok ajanlı hata avında doğrulanmış bulgulardır; ayrıntı ve gerekçe için
`D:\app\marche-cami-sitesi\dokumanlar\16_HATA_AVI_25AGU2026.md`.

1. **Panel API anahtarı Script Properties'ten okunuyor** (bulgu 1). Kaynak kodda düz metin
   duruyordu. `PANEL_ANAHTARI` özelliği eklendi ve koddaki gerçek değer yer tutucuyla
   değiştirildi — **tamamlandı**. Proje zaten bu mekanizmayı kullanıyordu (`TABLO_ID`,
   `KLASOR_ID`, `IHTIDA_TABLO_ID`, `IHTIDA_KLASOR_ID`).
2. **Görsel okunamadığında sebebi kayda geçiyor** (bulgu 4). 4 MB üstü ya da bozuk bir
   görsel sessizce boş dönüyordu; artık `console.error` ile loglanıyor ve panele
   `okunamayanGorseller` alanıyla bildiriliyor.
3. **Drive'a yazılamayan belge iz bırakıyor** (bulgu 5). Şahit imzası, vesikalık veya
   başvuran imzası kaydedilemezse bildirim e-postasının sonuna "DİKKAT: şu belgeler
   kaydedilemedi" notu ekleniyor. Eskiden yalnız konsola düşüyordu; eksiklik ancak EK-9
   üretilirken fark ediliyordu.
4. **Eski satırı işaretleme hatası kaydı düşürmüyor** (bulgu 17). Bilgi güncellemesinde
   kayıt zaten yazıldıktan sonra eski satır işaretlenir; bu ikincil iş başarısız olunca
   başvurana `sunucu-hatasi` dönüyor ve tekrar göndermeye çalışıyordu. Artık kendi
   `try/catch`'inde.

## Dağıtım

Apps Script'in web editörü üzerinden yapılır (dernek Google hesabı `ulucamii2026@gmail.com`,
tarayıcı oturumu gerekir). Kanıtlanmış akış `D:\tmp\gas\dagit_v8b.py` içindedir:

1. Proje: `script.google.com/…/1lqu1c3HvcLKiTgKR_JJUsId0AcH1SQRfUI6OFEGFYiVeVcfaT4Sa0NAG/edit`
2. Editöre yaz: `monaco.editor.getModels()[0].setValue(kod)` → `Ctrl+S`
3. **Dağıt → Dağıtımları yönet → kalem (Düzenle) → Yeni sürüm → Dağıt**
   — "Yeni dağıtım" DEĞİL: yeni dağıtım yeni bir `/exec` adresi üretir ve site eski adrese
   bağlı kaldığı için başvurular sessizce eski sürüme gitmeye devam eder.
4. Doğrula: `/exec` → `{"ok":true,"servis":"ulucamii-alici"}`;
   `?islem=liste&anahtar=<UCP-…>` başlıkları dönmeli, yanlış anahtar `yetkisiz` demeli.

**Dağıtımdan sonra:** panelden bir EK-9 üretip belgenin eksiksiz geldiğini ve gerçek bir
gönderimin deftere düştüğünü doğrulayın. Test kaydı bırakırsanız **tek tek, ad filtresiyle**
silin — Drive'da toplu silme yasaktır (24 Ağustos'ta başvuru defteri bu yüzden çöpe gitti).

## Bağlı kaynaklar

| | |
|---|---|
| `/exec` | `https://script.google.com/macros/s/AKfycbz2cgLbdHmx9ejuk4euzybGbpDro0UAEjzjwl86tMdRtz05Pp5WI1JUZT374y_lb4J8BQ/exec` |
| Başvuru defteri | Sheets `1hYAhwkiKxDCbc-aFDrCP95PMNMSs2DLwM8TniKGptp0` |
| Siteden bağlantı | `src/content/ayarlar/site.yaml → servisler.basvuru` |
| Bildirim | `ulucamii.marche@gmail.com`, `info@ulucamii.be` |
