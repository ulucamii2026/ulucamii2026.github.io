# Yeni kurs kayıtlarının veli listesine aktarımı

9 Eylül 2026 kullanıcı isteği: yeni kurs kayıtları bundan sonra e-posta listesine
otomatik alınır. Mevcut liste, Firestore `aileler` ve `ogrenciler` koleksiyonlarıdır.

## Davranış

- Google Apps Script zamanlayıcısı beş dakikada bir kayıt defterini kontrol eder.
  Bilgisayarın açık olması gerekmez.
- Kayıt formundaki TR/FR iletişim tercihi `iletisimDili` alanına aktarılır.
  Eksik/çelişkili yeni aile tercihleri tahmin edilmez; bekleyen olarak sayılır.
- Aynı e-posta ile kaydedilen kardeşler aynı aileye eklenir. Son kayıt revizyonu
  kullanılır; deneme ve yönetimde atlanan kayıtlar aktarılmaz.
- Yalnız ad, soyad, veli adı, e-posta, iletişim dili ve kayıt referansı okunur.
  Adres, kimlik, fotoğraf ve sağlık bilgisi bu aktarıma alınmaz.
- Mevcut şifre, davet, kitap yanıtı, ikinci veli, grup/durum ve sabit ad korunur.
- Atomik yazma ve belge sürümü önkoşulu eşzamanlı değişiklikleri korur.
  Başarılı işlem özeti işaretlenir. Hatalı işlem sonraki çalışmada tekrar denenir.
- Bu işlem e-posta göndermez. Yeni kayıt, sonraki yetkili veli e-postalarının
  alıcı listesinde görünür. Formun kendi kayıt onay akışı devam eder.

## Kurulum ve kontrol

Kod: `scripts/apps-script/veli-mail-listesi.gs`; derleyici bu modülü birleştirir.
Manifest: `scripts/apps-script/appsscript.json`. Mevcut Drive, Sheets, e-posta,
dış istek ve zamanlayıcı izinleri korunur; dernek e-posta kimliği ve Firestore
izinleri açıkça belirtilir. Kişisel hesapla çalıştırma reddedilir.

1. Mevcut dernek Apps Script projesinde kod ve manifest kaydedilir.
2. `veliMailListesiSina` editörden çalıştırılır; gereken izinler dernek hesabıyla
   tamamlanır. Bu işlev kayıt veya başarı damgası yazmaz.
3. `veliMailListesiKur` ilk eşitlemeyi yapar ve yalnız bir adet beş dakikalık
   `veliMailListesiZamanli` tetikleyicisi kurar.
4. Mevcut web uygulaması dağıtımı yeni sürümle güncellenir; adres değiştirilmez.
5. Panel anahtarıyla `islem=veli-mail-listesi-durum` yalnız durum ve sayıları döner.
   Kurulumdan sonra gerçek zamanlı tetikleyici çalışması ayrıca doğrulanır.

Anahtarlar ve kişisel kayıtlar bu belgeye veya kaynak koda yazılmaz.

## Doğrulama

`npm run dogrula:codex` içindeki `test:veli-eposta`, kayıt dili ve otomatik
aktarım testlerini çalıştırır. Kardeşler, tekrar, bağlantı hatası, kuru sınama,
yanlış hesap, iletişim dili ve mevcut alanların korunması sınanır.

Teknik dayanaklar: [Firestore REST yetkilendirmesi](https://firebase.google.com/docs/firestore/use-rest-api),
[Apps Script OAuth kapsamları](https://developers.google.com/apps-script/concepts/scopes),
[ScriptApp izin denetimi](https://developers.google.com/apps-script/reference/script/script-app).

## Canlı doğrulama — 9 Eylül 2026

- Dernek hesabıyla gerekli OAuth izinleri tamamlandı. İlk izin ekranı Firestore
  kapsamını vermediği için kurulumda `requireAllScopes` zorunlu hale getirildi.
- İlk gerçek aktarım: 13 kayıt işlendi; bekleyen 0. Şifreler ve kitap yanıtları
  korunarak yalnız gereken alanlar güncellendi.
- Zamanlayıcının bağımsız sonraki çalışması 11:15:24 UTC'de doğrulandı:
  aday 0, yazma 0, bekleyen 0. Tekrarlanan kayıt oluşmadı.
- Canlı sağlık uç noktası `veliMailListesiOtomatik: true` dönüyor.
- Cuma bilgilendirmesi daha sonra aynı zamanlayıcının sonuna eklendi. Liste
  aktarımı başarısızsa o çalışmada cuma gönderimine geçilmez.
