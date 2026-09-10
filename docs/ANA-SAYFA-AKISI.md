# Ana sayfanın içerik akışı

10 Eylül 2026: Kullanıcı yeni Gündem Vitrini'ni beğendi; masaüstünde aşağı indikçe oluşan kalabalığın giderilmesini ve ana sayfanın bütün olarak iyileştirilmesini istedi.

## Düzen kararı

- Üstte hızlı erişim, Gündem Vitrini ve namaz vakitleri bulunur.
- Alt bölümün sırası: haftalık yaşam ve eğitim, güncel duyurular ve takvim, hizmetler, ziyaret bilgileri, bağış desteği.
- Afişleri ve kayıt çağrılarını farklı büyük bantlarda tekrar etmek yerine ilgili bölümün içinde sunarız.
- Haberler kısa satırlar halinde; hizmetler açıklamalı bağlantılar halinde gösterilir. İçerik kart ızgaralarına dönüştürülmez.
- Haftalık programda özel etkinlikler görünür; her gün beş vakit namaz bilgisi bir kez belirtilir. Kaynak programdaki başlıklar ve saatler korunur.
- Kompakt haftalık programda derleme gününe bağlı bir "bugün" rozeti gösterilmez. Güncel namaz paneli mevcut istemci davranışını korur.
- Ziyaret bölümünde gerçek cami fotoğrafı, kurum bilgisi, adres ve yol tarifi bulunur. Tam harita ve ayrıntılı iletişim bilgileri iletişim sayfasından erişilir.
- Bağış bölümünde banka bilgileri ve gerçek EPC QR kodu yerel bir açılır bölümde sunulur; hesap bilgileri site ayarlarından alınır.

## Uygulama kapsamı

- Ana sayfaya özel bileşen: `src/components/AnaSayfaAkisi.astro`.
- Ana sayfaya özel stiller: `src/styles/ana-sayfa-akisi.css`.
- `BuHafta` ve `BagisBandi` için isteğe bağlı `kompakt` görünüm.
- TR/FR/EN arayüzü; yalnız TR/FR bulunan kaynak yayınlarda dil açıkça belirtilir.
- Kurs bölümündeki çalışma masası görseli Anti-Gravity ile üretildi. Cami iç mekân görseli mevcut gerçek fotoğraftır.

## Doğrulama

10 Eylül 2026, yerel derleme üzerinde görsel doğrulama:

- TR 1440/1920 px, FR 390 px, EN 768 px ve TR 320 px koyu tema incelendi. Yatay taşma bulunmadı; eğitim ve gerçek cami fotoğrafları yükleniyor.
- Masaüstü ana sayfa yüksekliği aynı 1440 × 1000 görünümde 5857 px'den 4029 px'e indi (yaklaşık %31 azalma).
- Bağış alanı kapalı/açık, uzun Fransızca metinler ve dar ekranda adres incelendi. Son görsel kanıt: `D:\tmp\ana-akis-gorsel-son.log` ve aynı klasörde `akis-*.png`.
- Etkinliklerde başlangıç–bitiş aralığı ve gerçek `ozet` alanı kullanılıyor. Kurs kaydı `kayitBaglantisi(site.kursKayitLinki, dil)` üzerinden, veli bağlantısı kendi dilindeki veli portalına açılıyor. Adres ve banka bilgileri site ayarlarından geliyor.
- IBAN düğmesi yinelenen tıklamalarda özgün etiketine döner; kopyalama engellenirse kullanıcıya canlı durum mesajı verir.
- Tema erişilebilirlik testindeki bitmiş/değiştirilmiş animasyon nesnesini bekleme sorunu, görünür ve çalışan CSS geçişlerini gözleyerek giderildi. Renk kontrastı denetimleri korunuyor; açık banka alanı da iki temada ayrıca test ediliyor.

## Kalite Kapısı ve Test Kanıtları (10 Eylül 2026)

- **Kaynak Doğrulama (`D:\tmp\ana-akis-dogrulama-son.log`):**
  - `check` (Astro check): GEÇTİ
  - `dogrula` (Derleme, bağlantı ve içerik kontrolleri): GEÇTİ
  - `test:web`: GEÇTİ (218 passed)
  - `test:kurallar`: GEÇTİ (17 passed, 0 fail)
  - `test:veli-eposta`: GEÇTİ (32 passed, 0 fail)
  - Toplu sonuç: GEÇTİ, BAŞARISIZ yok.
- **İzole Hedef Testi (`D:\tmp\ulucamii-hac-yayin-20260910`, log: `D:\tmp\ana-akis-yayin-web.log`):**
  - `npx playwright test tests/web/ana-sayfa-akisi.spec.mjs tests/web/ana-sayfa-tasarim.spec.mjs tests/web/vitrin.spec.mjs tests/web/site.spec.mjs`: 84 passed (çıkış kodu 0).
  - Ana sayfa akışı, tasarım, vitrin ve site genel regresyon testlerinin tamamı yeşil.

## Canlı yayın doğrulaması — 10 Eylül 2026, 14.15 (Brüksel)

- Yayın commit'i: `481d3090ca8c10672c87b2e31d0674f5ab8e5281`. GitHub Actions `34475486695`: `completed / success`; build ve deploy başarılı.
- Canlı TR 1440 px, FR 390 px, EN 768 px sayfaları HTTP 200 döndü. Dört yeni bölüm sırası, diline uygun kurs kaydı, doğru adres, yüklenmiş fotoğraflar, açılır banka/QR alanı ve slider geçişi doğrulandı.
- Üç dilde yatay taşma, JavaScript çalışma hatası veya siteye ait başarısız kaynak isteği bulunmadı. Kanıt: `D:\tmp\ana-akis-canli.log`; ekran görüntüleri `D:\tmp\ana-akis-canli-{tr,fr,en}.png`.
- Tarayıcı kontrolleri Chromium ile yapıldı; gerçek Safari/iPhone ve Firefox bu çalışmada sınanmadı. Canlı form, e-posta veya banka işlemi gönderilmedi.
- Bu son yayın kanıtı yerel proje notuna eklendi; yayımlanan uygulama kodunda ek değişiklik yapılmadı.
