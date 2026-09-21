# Kayıt formu — zorunlu imza ve kimlik

## Karar — 15 Eylül 2026

Çevrim içi kurs kaydı, velinin ekranda çizdiği imza ve öğrencinin kimlik belgesi
yüklenmeden tamamlanmaz. Kimlik kartının ön yüzü veya pasaportun kimlik sayfası
zorunludur; arka yüz isteğe bağlıdır. Kimlik kopyası için ayrı rıza kutusu korunur.
Formdaki ve sunucudaki kontroller birlikte uygulanır. Eski v2/v3 istemciler de
imzasız veya kimliksiz yeni kayıt oluşturamaz. İhtida formunun akışı değişmez.

## PDF ve arşiv

- Veli adı elektronik onay bilgisidir; imza alanında çizilmiş imzanın yerine
  el yazısı yazı tipiyle basılmaz. Çizilen imza aynen, ad soyad alt etikette yer alır.
- Kimlik görselleri kayıt PDF'sinin ayrı ek sayfasına yerleştirilir. Yeni kayıt
  PDF'si arşivde ve velinin kopyasında aynı imza/kimlik görsellerini içerir.
- Sağlık notunun arşiv PDF'sinden çıkarılması kuralı korunur.
- PDF yenileme ve sağlık notu temizliği, saklanan imza ve kimlik görsellerini
  yeniden okur. Okuma hatası, görselin sessizce kaybolmasına yol açmamalıdır.
- Kimlik kopyası silme işleminde güncel arşiv PDF'si de kimlik eki olmadan
  yenilenir; aksi hâlde işlem başarılı bildirilmez. Önceden veliye gönderilen
  e-posta ekleri geri çağrılamaz. Çöpteki görseller tekrar kullanılmaz.
- Eski kayıtta gerçek imza yoksa PDF'nin imza alanı boş bırakılır ve eksiklik
  açıkça belirtilir. İmza veya kimlik belgesi uydurulmaz; eksik belge veliye aittir.

## Kaynaklar ve doğrulama

- `src/components/formlar/KayitFormu.astro`, `src/scripts/kayit-form.ts`,
  `src/scripts/kayit-etkilesim.ts`; TR/FR/EN form ve gizlilik açıklamaları.
- `scripts/apps-script/ulucamii-Kod-v39.gs`; sağlık yanıtında
  `kayitBelgeleriZorunlu: true`. GAS sürümü site yayınından ayrı doğrulanır.
- `tests/kayit-imza.test.mjs`, `tests/kayit-duzelt.test.mjs`,
  `tests/veli-eposta-dili.test.mjs`, `tests/web/kayit-v3-inceleme.spec.mjs`.
- Yalnız sentetik belgelerle PDF görsel kontrolü: imzalı örnek üç sayfa
  (ikinci sayfada bir imza, üçüncü sayfada iki kimlik görseli); eski imzasız örnek
  iki sayfa ve boş imza alanı. Gerçek kayıtlara test gönderilmez.

Özel inceleme dosyaları ve öğrenci bilgileri kamu deposuna eklenmez.

## 15 Eylül 2026 doğrulaması

- Tip kontrolü: sıfır hata/uyarı; üretim derlemesi başarılı.
- Genel kalite komutu çalıştırıldı. 424 web senaryosunun ilk taramasında kayıt
  formuna ait 12 hata görüldü; eski seçim beklentileri ve başarı ekranı düzeltildi.
  Kayıt formunun tamamı son kaynakla yeniden çalıştırıldı: 40/40 başarılı.
  Genel taramadaki diğer web senaryoları ve 41 emülatör güvenlik testi geçti.
- Kayıt/imza/kimlik/arşiv/e-posta birim kontrolleri: 42/42 başarılı.
- İmza/kimlik PDF provası: üç sayfa, görsel dağılımı 0/1/2; eski imzasız örnek:
  iki sayfa ve boş imza alanı. Mobil/masaüstü ve üç dilde görsel kontroller yapıldı.
- Canlı kaynağın önceki ana modülü yerel Git sürümüyle birebir eşleşti; yeni paket
  dış modülleri değiştirmiyor. Canlıya form/test kaydı veya veli e-postası gönderilmedi.

- Ek yalıtılmış tarayıcı betiği: 117/117 kontrol geçti. GAS canlı sağlık yanıtı:
  `surum: 37`, `kayitBelgeleriZorunlu: true`; kaydedilmiş sunucu kaynağı paketle birebir eşleşti.
