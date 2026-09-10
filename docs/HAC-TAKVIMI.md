# Hac 2027 takvimi — 10 Eylül 2026

Cami din görevlisinin bu oturumdaki doğrudan teyidi ve güncelleme talimatı esas alındı: ön başvuru son günü 11 Eylül 2026; kesin kayıt bu ayın sonuna, 30 Eylül 2026’ya kadar devam ediyor. Vakfın web sayfasındaki genel tarihle çelişki kullanıcıya bildirildi; kullanıcı yerel takvimi teyit ederek duyurulmasını istedi.

Tek tarih kaynağı: `src/lib/etkinlik-tarihleri.ts`. Brüksel’de iki tarih de yaz saatindedir (+02:00). Ana sayfa bandı, Diyanet hizmetleri sayfası ve TR/FR hac duyurusu birlikte güncellenir. Eski tarihli üç afiş taslağa alındı; güncel iki dilli afiş kullanılır. Eski görsel dosyaları arşiv olarak korunur.

Yeni afiş yerleşik imagegen ile üretildi. İstem: mevcut zümrüt/altın Kâbe afişini koru; TR/FR ön başvuru 11 Eylül ve kesin kayıt 30 Eylül 2026; göreli yarın ifadesi kullanma. Dosyalar: `public/media/afisler/hac-2027-guncel-takvim.webp` ve küçük sürümü.

Doğrulama (10 Eylül 2026): `npm run dogrula:codex` bütün kapıları geçti; 160 web testi ve 32 veli e-postası testi başarılı. Ayrıca yedi sayfa 390 px genişlikte incelendi; üç dilde güncel tarih, taşmasız görünüm ve eski afişlerin gizlenmesi doğrulandı.
