# İhtida şahitleri — 9 Eylül 2026

- Yeni Ulu Camii başvurularında boş şahit alanları Ercan MOLA (Dernek Başkanı) ve Rıdvan KAYAHAN (Din Görevlisi) sırasıyla tamamlanır.
- Başvuruda açıkça belirtilmiş eski veya özel şahit isimleri korunur. Başka cami seçildiğinde yerel varsayılanlar ve unvanlar kullanılmaz; iki şahit elle girilir.
- Üç dilde form açıklaması, yönetici hazırlık ekranı ve EK-9 PDF üretimi aynı kurala uyar.
- İmza eşleştirmesinde Ercan için yalnız `ercan` anahtarı kullanılır. Yeliz imzası Ercan adına kullanılamaz. Kayıtlı uygun imza yoksa ıslak imza alanı boş bırakılır. Kayıtlı imza kullanımı belge bazında teyit gerektirir.
- Özel imza dosyaları bu değişiklikle siteye veya Git deposuna eklenmedi.
- Canlı Apps Script dağıtımı 35. sürüme güncellendi. Canlı kaynakta yalnız `IhtidaPdf` modülü değiştirildi; diğer hizmet kodu korundu. Kaydedilen kod yeniden okunarak doğrulandı. Uygulamanın genel `SURUM` değeri 28 olarak kalır; dağıtım sürümü farklı bir sayaçtır.
- Doğrulama sentetik kayıtlarla yapılır; gerçek başvuru veya e-posta gönderilmez.

## 1 Kasım 2026 — tek şahit kuralı (Rıdvan KAYAHAN)

Karar: «Sadece bir şahit eklenebilsin. Şahitlerden birisi her zaman din görevlisi, yani imam, yani ben olayım.» Bu bölüm yukarıdaki 9 Eylül kurallarının yerine geçer.

- **2. şahit her başvuruda ve her camide «Rıdvan KAYAHAN» (Din Görevlisi)'dir.** Formda sabit, değiştirilemez bir satırdır (girdi ve imza kutusu yok). Kayıtlı vektör imzası (`ridvan`) artık yalnız Ulu Camii'nde değil, her camide belgeye kendiliğinden basılır; görevli panelde işareti kaldırabilir (`imzaKullan: false`).
- **Başvuran en çok bir şahit (1. şahit) bildirir**; adı ve isteğe bağlı ekran imzası (`IhtidaSahitImza no=1`) eskisi gibidir.
- **Ulu Camii (`ulucamii-marche`):** 1. şahit isteğe bağlıdır. Boşsa `sahitSecimi: "cami"`, `sahitler: []` gider ve 1. şahit olarak «Ercan MOLA» (Dernek Başkanı) önerilir (`sahitOnerileri`).
- **Başka cami (`cami.farkli()`):** 1. şahit zorunludur (törende hazır bulunan kişi); `sahitSecimi: "kendi"`, `sahitler: [{ad: 1. şahit, …}, {ad: "Rıdvan KAYAHAN"}]`. 1. şahit din görevlisinin adı olamaz.
- **Sunucu (Apps Script v46):** `ihtidaSahitleriTamamla(v)` doğrulamadan sonra 2. şahit adı boşsa «Rıdvan KAYAHAN» yazar; deftere (Şahit 2), PDF'e, e-postaya ve panele aynı değer gider. Eski önbellekli istemcinin iki şahitli gövdesi olduğu gibi kabul edilir ve saklanır; başvuru kaybolmaz. Resmî son liste (`ihtidaPaketOnayDogrula`) hâlâ tam iki şahit ister.
- **Panel «son nüsha» penceresi (`ek9-hazirlik.js`):** 2. şahit varsayılan «Rıdvan KAYAHAN»; istisna için düzenlenebilir. Yedek şahit akışı (Ercan MOLA + Rıdvan) aynen çalışır.
- Metinler beş dilde güncellendi: `src/i18n/formlar/*`, `src/i18n/cami-secimi.ts`, ihtida/gizlilik sayfaları, ihtida özet kartı, onay e-postası (`IHTIDA_SAHIT_METIN`, `ETIKET_IHTIDA.sahit2`) ve suret e-postası.
