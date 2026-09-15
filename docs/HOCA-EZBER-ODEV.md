# Hoca portalı — haftalık ezber ve ödev

## Ortak kayıt ve gezinme

Hoca, veli portalı ve öğrenci atölyesi mevcut `odevler/{haftanın ilk ders günü}`
kaydını kullanır. Haftalar yıllık plandaki ders günlerinden üretilir; aynı gün ve
hafta bağlantıları Ders Defteri ile Bülten–İdare bölümlerini açar. Öğrenci seçimi,
Öğrenciler bölümündeki mevcut bireysel ilerleme kaydına gider. Ortak çalışma
atamak bir öğrencinin ezberini kendiliğinden tamamlanmış saymaz.

Hafta listesi kayıt durumunu gösterir: hazırlanmadı, taslak, yayında. Önceki,
sonraki ve güncel hafta düğmeleri bulunur. Kaydedilmemiş değişikliklerde hafta,
sekme ve çıkış geçişleri sorulur. Kayıt/çeviri sürerken gezinme kilitlenir;
başarısız işlemde metinler korunur.

## İçerik ve seçim mantığı

- Yeni çalışma taslak başlar; veliye görünmesi için yayımla seçimi ve kayıt gerekir.
- Planın ezberleri alınabilir. Önceki kayıttan yalnız boş metinler kopyalanır;
  hedefte farklı bir dil metni varsa o alan grubunun eski çevirisi taşınmaz.
  Eski materyal, etkinlik ve yayın durumu yeni haftaya kopyalanmaz.
- Altı hazır öneri TR/FR/EN birlikte eklenir veya kaldırılır. “Ödev yok” diğer
  hazır ödev önerilerini ve etkinlik atamalarını kaldırır. Yeni etkinlik seçmek
  bu kalıbı kaldırır. Serbest yazılan metin otomatik anlam denetiminden geçmez.
- Aynı etkinlik ikinci kez seçilemez; en fazla üç seçim ve toplam süre gösterilir.
- Fransızca çeviri yalnız düğmeye basınca istenir; mevcut çeviriyi değiştirmeden
  önce sorulur. Türkçe serbest metin değişince çeviriyi kontrol etme açıklaması vardır.
- Veli önizlemesi gerçek portal ile aynı dil yedeğini kullanır:
  istenen dil → Fransızca → Türkçe. Eksik çeviri önizlemede belirtilir.

## Kaynaklar ve doğrulama

`src/lib/haftalik-odev.ts`: saf hafta, taslak, kalıp, dil ve doğrulama kuralları.
`src/scripts/hoca-odev.ts`: form ve gezinme; `src/styles/hoca-odev.css`: görünüm.
`tests/haftalik-odev.test.mjs` ve `tests/web/hoca-odev.spec.mjs`: işlev kanıtı.

15 Eylül 2026: derlenmiş yerel önizleme 1440 ve 390 px genişlikte, açık/koyu
temada sentetik kayıtlarla incelendi; yatay taşma yok. Tarayıcı testleri dış ağı
keser, Firebase yazımları sahtedir. Canlı yayın, gerçek aile hesabıyla deneme ve
gerçek çeviri servisine gönderim bu çalışmanın kapsamında yapılmadı.

`npm run dogrula:codex` tamamı geçti: tasarım, tip kontrolü, üretim derlemesi,
422 tarayıcı testi, 41 Firebase kural testi ve diğer zorunlu test grupları.
Son eklenen kopyalama ve “ödev yok”/etkinlik karşıtlığı kontrolleriyle
`npx playwright test tests/web/hoca-odev.spec.mjs`: 10/10 geçti.

15 Eylül 2026 yayın öncesi tekrar: `npm run dogrula:codex` bütün kapılarıyla
geçti; yeni kopyalama senaryosu dâhil 424 tarayıcı ve 41 güvenlik testi başarılı.
Mobil/masaüstü önizlemeleri tekrar incelendi; tema geçiş animasyonları bitirilerek
son renkler doğrulandı. Kanıt: `D:/tmp/portal-yayin-oncesi-20260915.log`.
Bu kayıt canlı yayın kanıtı değildir.
