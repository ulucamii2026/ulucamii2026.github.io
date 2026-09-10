# Veli e-postalarında iletişim dili — 9 Eylül 2026

Kullanıcı kararı: kayıt formunda Fransızca seçen veliye Fransızca, Türkçe seçen
veliye Türkçe e-posta gönderilir. Konu, gövde, bağlantı açıklamaları ve GIF metinleri
aynı dilde hazırlanır. Portalın görüntüleme dili iletişim tercihini değiştirmez.
Kalıcı kural `AGENTS.md` dosyasındadır.

## İletişim kanalı tercihleri — 10 Eylül 2026

- WhatsApp alıcısı ile e-posta alıcıları ayrı tercihlerdir. Bir öğrencinin iki
  veli hesabı varsa WhatsApp için yalnız birinin seçilmesi, diğerinin e-posta
  alıcılığını veya portal erişimini kaldırmaz.
- Aileye özel doğrulanmış tercihler, kişi bilgilerini bu depoya taşımadan özel
  dernek arşivindeki `D:\app\marche-cami-sitesi\portal\ILETISIM-TERCIHLERI.md`
  ve `iletisim-tercihleri.json` dosyalarından kontrol edilir.
- Veli bilgilendirmelerinde portalın ders, ödev, devam, gelişim ve duyuru takibi
  tanıtılır. Sonraki soru ve mazeretlerin portalın “Hocaya bildir” bölümünden
  iletilmesi rica edilir; giriş güçlüğünde mevcut iletişim kanalından yardım
  alınabilir. Mesaj metni velinin kayıtlı iletişim diline uyar.

## Bu işlemde doğrulananlar

- Gece yapılan üç yeni kayıt portal listesinde olmadığı için önceki sekiz alıcılı
  bilgilendirmeye dahil edilmemişti. Üç öğrenci aynı veli hesabına aktarıldı.
- Kayıt tercihi Fransızcaydı. Tek veliye Fransızca metin ve Fransızca GIF içeren
  ilk portal bilgilendirmesi gönderildi. Önceden hatırlatma almış gibi hitap edilmedi.
- SMTP kabulü, tek alıcı, Gönderilenler arşivi, görseller ve kişiye özel bağlantının
  Fransızca portal hedefi doğrulandı. Bu, okunma veya gelen kutusuna kesin teslim kanıtı değildir.
- Formda açıkça belirtilmiş altı mevcut ailenin iletişim tercihi ayrıca
  `aileler.iletisimDili` alanına taşındı. Yeni ailenin tercihi aktarımda kaydedildi.
  Eski iki ailede form tercihi boştu; tahminle yeni tercih yazılmadı.

## Etkin değişiklikler

- Canlı Apps Script kayıt onayı artık yalnız `veli.iletisimDili` dilinde hazırlanır.
  TR/FR dışı veya eksik değer Türkçe varsayılarak gönderilmez.
- Yalnız `doGet`, `kayitPostIsleV2`, `mailHtml`, `kopyaGonderV2` işlevleri
  değiştirildi; canlıdaki diğer kod birebir korundu. Dağıtım kimliği değişmedi.
- Canlı sağlık yanıtı `veliEpostaDili: kayit-tercihi-20260909` döndürüyor.
  GAS dağıtım sürümü 28; uygulama protokolünün mevcut `surum: 28` değeri korundu.
- Özel `portal-yonetim.py` ve `portal-kitap-eposta.py` betikleri `iletisimDili`
  alanını önce kullanır. Eski kayıtlarda mevcut geçerli `dil` alanına uyumluluk
  korunur; bilinmeyen dilde gönderim durur.
- Toplu gönderim öncesinde güncel kayıt defteriyle portal eşleştirilir. Eksik
  öğrenci veya iletişim dili uyuşmazlığı varsa gönderim durur; yeni aile sessizce atlanmaz.
- Tarihli sekiz alıcılı kampanya betiği tarihsel gönderim içindir; yeni toplu
  gönderimler için yeniden kullanılmamalıdır.

## Yerel web değişiklikleri

`src/scripts/veli-portali.ts`: sayfa açılışı yalnız son giriş zamanını günceller.
`src/scripts/hoca-ekrani.ts`: davette `iletisimDili` önceliklidir; içe aktarmada
formdaki iletişim tercihi ayrı alana yazılır. Bu iki web değişikliği yerelde
hazırdır; bu işlemde GitHub commit/push veya Pages yayını yapılmadı.

## Doğrulama

- `npm run dogrula:codex`: geçti. Web 82/82, ihtida/belge 31/31,
  Firestore 17/17 ve veli e-postası 4/4.
- Yönetim betiklerinin dil önceliği ve eksik kayıt koruması: ağsız 3/3.
- Fransızca e-posta: 390/760 piksel, iki görünüm; gerçek test teslimi ve GIF/logo
  baytları doğrulandı. Gerçek veli iletisinin tek arşiv kopyası ve Fransızca bağlantısı doğrulandı.
- Canlı GAS sağlık yanıtı ve mevcut ihtida paketi/defteri hazır durumu doğrulandı.

Özel çıktı klasörü: `D:\app\marche-cami-sitesi\portal\eposta-ikinci-bilgilendirme-2026-09-09\fr`.
E-posta adresleri, öğrenci adları, şifreler ve giriş bağlantıları bu belgeye yazılmaz.
