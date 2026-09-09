# Mühtedi formu — hata taraması, 9 Eylül 2026

## Düzeltilen sorunlar

- **Fotoğraf işlemlerinin sırası:** geç biten çözümleme, kaldırılmış veya daha yeni seçilmiş görseli artık geri getiremez. Dosya türü/boyutu geçersizse önceki görsel sessizce gönderim paketinde kalmaz.
- **Çift gönderim:** aynı formun eşzamanlı ikinci gönderimi engellenir. İşlem sırasında taslak silme düğmesi kapatılır. Ağ hatası sonrası deneme aynı başvuru anahtarını korur.
- **Başarı sonrası taslak:** bekleyen otomatik kayıt zamanlayıcısı iptal edilir; başarıyla gönderilmiş başvurunun kişisel bilgileri taslakta yeniden belirmez.
- **İmza ve ekran boyutu:** çizgiler ilk çizim alanının koordinatlarında saklanır; dar ekranda orantılı gösterilir. PDF görüntüsü güncel ekran genişliğine göre kesilmez.
- **Taslak sıfırlama:** imzasız taslak silindikten sonra kutuların yerel sıfırlanması tamamlanır, ardından imza alanı yeniden açılır. Çizim desteği yoksa imzasız seçenek açıkça seçilmeden form gönderilmez.
- **Şahit tekrarı:** Ulu Camii için de aynı isim iki şahit olarak girilemez; tarayıcı ve sunucu bunu denetler. Otomatik PDF, paneldeki ortak tamamlama işlevini kullanır; ilk şahit Yeliz KAYAHAN ise boş ikinci alana aynı isim tekrar yazılmaz. Başka camide yerel şahit adları eklenmez.
- **Son kontrol:** ihtida sebebi ve istenen yeni isim, kendi bölümüne düzenleme bağlantısıyla üç dilde gösterilir. Kimlikteki adın yerini kendiliğinden değiştirmez.

## Kontrol kapsamı

- Üç dilde alanlar, yedi adım, cami arama/seçimi, elle cami ekleme, şahitler, tam adres ve teslim tercihi.
- Ayrı vesikalık, kimlik/pasaport yüzleri, imza ve imzasız başvuru, EK-10 ve aktarım izinleri, taslaklar ve son kontrol.
- Eski servis koruması, ağ hatası/yeniden deneme, mükerrer gönderim ve geç tamamlanan dosya işlemleri.
- Sentetik veriden EK-9, iki sayfalık EK-10, dilekçe ve kimlik eki; PDF arşivi, yönetim paneli, e-posta kuyruğu ve ihtida defteri.
- 320 ve 1280 piksel, TR/FR/EN, açık/koyu tema: 12 birleşimin tamamında sıfır yatay taşma, JavaScript hatası ve axe ihlali. Bu otomatik sonuç bir erişilebilirlik sertifikası değildir.
- EK-9 birinci sayfası görsele dönüştürülerek iki ayrı şahit adı ve sayfa düzeni gözle incelendi. Gerçek kişinin belgesi veya imzası kullanılmadı.

## Doğrulama kayıtları

Son `npm run dogrula:codex` çalıştırması başarılı: **126 web**, **33 ihtida/PDF**, **17 Firestore emülatörü**, **32 veli e-postası** testi geçti. Tip kontrolünde sıfır hata/uyarı; build ve mevcut panel/CMS/site/EK-9 denetimleri geçti. Yeni dayanıklılık dosyası 11 senaryoyu mobil ve masaüstünde çalıştırır (22 test).

- `.codex/cikti/ihtida-tarama-son-dogrula.log`: son kalite kapısı.
- `.codex/cikti/ihtida-dayaniklilik-once.log`: değişikliklerden önce hataları yeniden üreten testler.
- `.codex/cikti/ihtida-sahit-once.log`: yinelenen şahitleri gösteren sunucu/PDF testleri.
- `.codex/cikti/ihtida-gorsel-denetim.json`: 12 görünümün erişilebilirlik ve taşma sonuçları.
- `.codex/cikti/ihtida-sahit-kontrol.png`: sentetik PDF'nin görsel kontrolü.
- Impeccable mekanik denetiminin tek uyarısı bir TypeScript yorumundaki `<img>` sözcüğünü bozuk görsel saymasıdır; gerçek DOM bulgusu değildir.

## Canlı durum ve sınırlar

9 Eylül 2026 saat 16.37–16.38 Brüksel zamanı: canlı Türkçe başvuru sayfası HTTP 200; herkese açık servis sağlık yanıtı HTTP 200, `ok: true`, sürüm 28, `ihtidaPaketHazir: true`.

Bu yalnız erişim/hazırlık denetimidir; servis kodunun yerel kaynakla aynı olduğunu veya bir e-postanın gerçekten teslim edildiğini kanıtlamaz. Gerçek başvuru, e-posta, Drive/Firestore yazımı yapılmadı. Otomatik e-posta testlerinde dış servisler taklit edildi; kurumsal alıcılara ve sentetik başvuran adresine aynı PDF'nin ayrı mesajlarla hazırlanması denetlendi.

Değişiklikler yereldir. Commit, push, Pages veya Apps Script yayını yapılmadı. Yayında ön yüz dosyalarıyla birlikte `scripts/ihtida-gas-derle.mjs` çıktısındaki sunucu/PDF değişiklikleri de dağıtılmalıdır. Gerçek iPhone/Safari veya Android cihazında test yapılmadı.

## Değişen kaynaklar

`src/components/formlar/IhtidaFormu.astro`, `src/scripts/ihtida-form.ts`, `src/scripts/ihtida-gorseller.ts`, `src/scripts/ihtida-cami.ts`, `src/scripts/form-cekirdek.ts`, `public/admin/ek9-hazirlik.js`, `scripts/apps-script/ihtida-pdf-entry.js`, `scripts/apps-script/ulucamii-Kod-v28.gs`.

Regresyonlar: `tests/web/ihtida-dayaniklilik.spec.mjs`, `tests/ihtida-contract.test.mjs`, `tests/ihtida-paket-akis.test.mjs`. Ortak form çekirdeği değiştiğinden kurs kayıt/veli testleri de toplu doğrulamaya dahildir.
