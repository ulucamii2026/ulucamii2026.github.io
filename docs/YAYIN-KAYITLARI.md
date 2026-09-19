# Web yayını kayıtları

Kalıcı kural: [AGENTS.md](../AGENTS.md). Tarihler Europe/Brussels saat dilimindedir.
Kayıtlar içerik yayınının kanıtıdır; sırf kayıt güncelleyen belge commit'i yeni içerik yayını değildir.
Kaynak proje: `D:/ulu-camii-kuran-kursu`; kurs indeksi `belgeler/YAYIN-KAYITLARI.md`.

## 19 Eylül 2026 — 19–20 Eylül öğretici materyalleri

- Durum: tamamlandı. Önceki oturumun doğrulanmış sonucu bu kalıcı indekse aktarıldı.
- İçerik commit'i: `5b8bd5fd3979eaa6f6251672b8acaf373c13e9bb`.
- Değişen site dosyası: `src/data/ders-materyalleri.json`.
- Release: `ders-2026-09-19`, `ders-2026-09-20`; her birinde 13 dosya
  (plan PDF, üç öğrenci PPTX/PDF, üç öğretici PPTX/PDF).
- [Pages 35433895620](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35433895620): başarılı.
- Canlı [19 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-19),
  [20 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-20); TR/FR/EN bağlantı kontrolü geçti.
- `npm run dogrula:codex`: sekiz kapı ve 424 tarayıcı testi geçti.
  Yayın dosyalarının HTTP/SHA-256 eşitliği 26/26; mobil/masaüstü ve açık/koyu tema kontrolü geçti.
- Kaynak rapor: `belgeler/KALITE-DENETIMI-2026-09-19.md`.
  Kanıt: `scratchpad/denetim-2026-09-19/`.
- Sınır: fiziksel baskı/projeksiyon ve bütün ses/video içeriğinin yeniden dinleme/izleme provası yapılmadı.

## 19 Eylül 2026 — 26–27 Eylül öğretici materyalleri

- Durum: tamamlandı. Önceki oturumun doğrulanmış sonucu bu kalıcı indekse aktarıldı.
- İçerik commit'i: `fcc71bf3dfa4328c9e0539390f6384d30a1d62d0`.
- Değişen site dosyası: `src/data/ders-materyalleri.json`.
- Release: `ders-2026-09-26`, `ders-2026-09-27`; her birinde 13 güncel ve benzersiz dosya.
- [Pages 35440883908](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35440883908): başarılı.
- Canlı [26 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-26),
  [27 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-27).
- 134 öğretici slaydı öğrenciyle 1:1; notlar öğrenci PPTX'e işlendi. Altı öğretici PPTX/PDF.
  PowerPoint ölçümünde öğrenci/öğretici taşması 0; kaynak, süre, dil/punto denetimleri geçti.
- `npm run dogrula:codex`: sekiz kapı ve 424 tarayıcı testi geçti.
  Yayın dosyalarının HTTP/SHA-256 eşitliği 26/26; OneDrive yerel eşitliği 22/22.
  TR/FR/EN, 320/390/1440 px, açık/koyu tema kontrolleri geçti.
- Kaynak rapor: `belgeler/KALITE-DENETIMI-2026-09-26-27.md`.
  Kanıt: `scratchpad/hafta-2026-09-26/`.
- Sınır: fiziksel sınıf provası ve videoların baştan sona tekrar izlenmesi yapılmadı;
  OneDrive kanıtı yerel kopyadır, bulut eşitleme makbuzu değildir.

## 19 Eylül 2026 — 3–4 Ekim öğretici materyalleri ve yayın kayıt düzeni

Durum: tamamlandı. Son kayıt: 2026-09-19T17:01:40+02:00 (Europe/Brussels).

- İçerik commit'i: `8edf0232e6f3659fb61fbabea6702662249c9b57`.
- [Pages 35450386608](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35450386608): başarılı; canlı yayın ayrıca doğrulandı.
- Kalite kapılarının tümü geçti: ilk `dogrula:codex` koşusunda yedi kapı başarılı;
  iki klavye hatası `src/styles/global.css` içinde azaltılmış hareket kaydırmasıyla
  düzeltildi. Yeniden derleme, iki hedef test ve tam `test:web` tekrarı başarılı: 424/424.
  İlk başarısız koşu `site-kalite.log`, son başarılı koşu `site-web-final.log` içinde korunur.
- Dört Release'te 13'er benzersiz dosya; 52/52 indirme HTTP 200 ve SHA-256 eşleşmesi.
- Canlı TR/FR/EN: gün başına 13 bağlantı, altısı öğretici; 320/390/1440 px taşma yok.
  Açık/koyu tema ciddi/kritik erişilebilirlik ihlali 0; klavye erişimi başarılı.
- OneDrive yerel 44/44 dosya eşleşmesi; üretim/yerleşim/kaynak kontrolleri temiz.
- Canlı: [26 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-26),
  [27 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-27),
  [3 Ekim](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-03),
  [4 Ekim](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-04).

İşlem günü/saat dilimi: 19 Eylül 2026, Europe/Brussels.

- 3–4 Ekim: altı öğretici PPTX/PDF, toplam 138 slayt ve öğrenci sunucu notları tamamlandı.
- 26–27 Eylül ve 3–4 Ekim öğrenci PDF'lerinde video kapakları korundu.
  4 Ekim planı metin kaybı olmadan 16 sayfadan 14 sayfaya düzenlendi.
- Dört Release: `ders-2026-09-26`, `ders-2026-09-27`, `ders-2026-10-03`,
  `ders-2026-10-04`. Gün başına 13 dosya; 52/52 HTTP 200 ve SHA-256 eşleşmesi.
- OneDrive yerel kopyaları: 44/44 SHA-256 eşleşmesi.
- Altı öğrenci ve altı öğretici sunumunun PowerPoint yerleşimi temiz;
  dil/punto/not eşleşmesi ve sert materyal kapıları geçti.
- Yerel TR/FR/EN sayfalarında dört günün her birinde 13 dosya, altısı öğretici bağlantısı.
  320/390/1440 px taşma yok; açık/koyu tema ciddi/kritik erişilebilirlik ihlali yok;
  klavye erişimi çalışıyor.
- Site değişiklikleri: `src/data/ders-materyalleri.json`, `AGENTS.md`,
  `docs/PROJE-HAFIZASI.md`, `docs/YAYIN-KAYITLARI.md`, `src/styles/global.css`.
  Son dosyada azaltılmış hareket tercihi kök kaydırıcıya da uygulanır;
  kayıt sonrası klavyeyle kardeş kaydı bağlantısına geçerken ekran odağı izler.
- Kurs raporu: `belgeler/KALITE-DENETIMI-2026-10-03-04.md`;
  kanıt: `scratchpad/hafta-2026-10-03/`.
- Sınırlar: fiziksel sınıf provası, bütün seslerin yeniden dinlenmesi ve videoların
  baştan sona tekrar izlenmesi yapılmadı; OneDrive kanıtı yerel kopyadır.

Kayıt tamamlandı; salt devir belgesi commit’i bu içerik yayınına referans verir.

Kalıcı kural `AGENTS.md`, başvuru `docs/PROJE-HAFIZASI.md` ve bu dosyadır.
Kurs tarafında `AGENTS.md`, `CLAUDE.md`, `DEVAM.md`, `belgeler/YAYIN-KAYITLARI.md`
aynı kayıt düzenine bağlanır. İzole çalışma kopyası:
`D:/tmp/ulucamii-ogretici-yayin-20260919`; ana repodaki başka oturum değişiklikleri korunur.

## 19 Eylül 2026 — slayda gömülü oyunlar (20 Eylül–4 Ekim)

- Kapsam: 20/26/27 Eylül, 3/4 Ekim; 15 öğrenci ve 15 öğretici PPTX/PDF, beş plan PDF. Gün başına 13, toplam 65 Release dosyası.
- Sınıf oyunlarında ayrı kart/çıktı ve fiziksel hazırlık kaldırıldı; 18 oyun yerel PowerPoint cevap tetiğiyle sunuma gömüldü. Öğretici metinleri, sunucu notları, planlar ve 23 kısa TR/FR anlatım eşleştirildi; yedi resmî Diyanet FR kaynak bağlantısı eklendi.
- Kaynak proje: `D:/ulu-camii-kuran-kursu`; rapor `belgeler/KALITE-DENETIMI-GOMULU-OYUN-2026-09-19.md`; kanıt `scratchpad/oyun-2026-09-20/`.
- Site değişikliği: `src/data/ders-materyalleri.json`; adlar sabit, sürüm çoğaltılmadı.
- Portalın 19 Eylül haftalık tekrar notunda yalnız `odevler/2026-09-19.ezber.tr` alanındaki kart seçeneği kitap/defterle değiştirildi; eşzamanlı değişiklik önkoşulu ve canlı geri okuma doğrulandı. Diğer kayıtlar değiştirilmedi.
- Durum: son kalite kapıları sürüyor; commit/deploy/canlı hash sonuçları henüz tamamlanmadı. Bu kayıt sonuçlarla güncellenecek.
- Özel veli iletileri ve öğrenciye özel meşk defterleri kamuya açık yayına dahil edilmedi; kişisel bilgiler bu depoya alınmadı.
