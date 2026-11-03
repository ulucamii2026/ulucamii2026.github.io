# Veda Programı (Ahde Vefa) — katılım arka ucu

Ayrı, küçük Apps Script projesi. Canlı kayıt/ihtida arka ucuna (v46) dokunmaz. Yalnız dernek hesabı
(`ulucamii2026@gmail.com`) kullanılır.

## Sayfalar (sitede, henüz yayınlanmadı)
- Katılım: `src/pages/davet/veda-04735binju/index.astro` → `https://ulucamii.be/davet/veda-04735binju/` (adres SABİT, karekod bunu taşır)
- Liste: `src/pages/davet/liste-hh81xwgssz/index.astro` → `https://ulucamii.be/davet/liste-hh81xwgssz/#<anahtar>`
- Üst görsel: `public/davet/veda-04735binju/ebru-lale.jpg` (1600×640, aynı adla değiştirmek yeter)

## Dağıtım (Rıdvan'ın onayından sonra; dernek hesabıyla)
1. https://script.google.com (hesap ulucamii2026) → Yeni proje «Veda Programı katılım». `Kod.gs` ve `appsscript.json` içeriğini yapıştır.
2. Proje ayarları → Betik özellikleri → `LISTE_ANAHTARI` = uzun rastgele anahtar (en az 24 karakter; depoya YAZILMAZ).
3. Dağıt → Web uygulaması: «Çalıştıran: ben», «Erişim: herkes». İzinleri ver (Sheets, e-posta gönderme).
4. Çıkan `/exec` adresini iki sayfadaki `__VEDA_UC_KIMLIGI__` yerine yaz (`veda-04735binju/index.astro` içindeki `uc`, `liste-hh81xwgssz/index.astro` içindeki `UC`).
5. `npm run dogrula` → commit → push (Pages kendisi yayınlar).
6. Deneme: sayfadan bir kayıt gönder (ad «TESTOGLU Deneme»); e-posta gelmeli; liste açılmalı; defterden o satırı elle sil.

Defter dosyası ilk kayıtta dernek hesabının Drive'ında «Veda Programı 2026-11-07 — katılım (veda-2026-11-07)» adıyla kendiliğinden oluşur.

## Program sonrası silme
Drive'da o tabloyu çöpe at, betik özelliklerinden `TABLO_ID` ve `LISTE_ANAHTARI`'nı sil, projeyi arşivle
(sayfadaki gizlilik notu: «program sonrasında silinir»).

## Davranış
- Form 7 Kasım 2026 Cumartesi 12.00'de (Brüksel) kapanır; sunucu da reddeder (`kapali`).
- Aynı ad+kurumla yeniden gönderilirse toplamlara yalnız en yeni kayıt girer.
- Bildirim e-postası her yeni kayıtta `rdvankayahan@gmail.com`'a düz metin gider; e-posta başarısız olsa da kayıt korunur.
- Test: `node --test tests/veda-davet.test.mjs`
