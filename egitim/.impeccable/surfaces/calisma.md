---
version: 1
slug: "calisma"
primary_target: "src/pages/[dil]/calis/[id].astro"
related_targets: ["src/scripts/calisma.ts", "src/styles/calisma.css"]
---

# Dinle–tekrarla çalışma sayfası

2 Ekim 2026. Yüzey: `src/pages/[dil]/calis/[id].astro`. Kip: Operate.

Amaç: öğrenci/veli tek bir ezberi kendi hızında dinler ve sesli tekrar eder. Mevcut `DESIGN.md` Çini Panosu,
kurs yeşili, yerel Atkinson yazı tipi, vektör motif ve derz yüzeyleri korunur.

Başlıkta ezberin adı, şeridi ve varsa sınıf hedefi; altta ana iş olan dinleme denetimleri, yanda kaynak/çalışma notu.
Telefonda tek sütun. Kullanıcı doğrudan bölüm, tekrar sayısı ve hız seçer; hesap veya ilerleme kaydı yoktur.
Durumlar: hazır, dinliyor, tekrar arası, duraklatıldı, tamamlandı, yeniden denenebilir hata. JavaScript kapalıyken
ses bağlantısı kullanılabilir. Dil değişimi maddeyi korur. Doğrulanmamış Arapça veya meâl gösterilmez.
