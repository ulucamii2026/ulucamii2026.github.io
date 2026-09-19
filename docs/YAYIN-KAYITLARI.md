# Web yayını kayıtları

Kalıcı kural: [AGENTS.md](../AGENTS.md). Tarihler Europe/Brussels saat dilimindedir.
Kayıtlar içerik yayınının kanıtıdır; sırf kayıt güncelleyen belge commit'i yeni içerik yayını değildir.
Kaynak proje: `D:/ulu-camii-kuran-kursu`; kurs indeksi `belgeler/YAYIN-KAYITLARI.md`.

## 19 Eylül 2026 — Belçika’dan dergi aboneliği araştırması

- Kullanıcı talebiyle TR/FR/EN yayın rehberi güncellendi; içerik commit'i `2b54e7c`.
- [Pages 35459124981](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35459124981): build ve deploy başarılı; üç canlı rehber HTTP 200, yeni resmî birim/teslimat şartları/e-posta bağlantıları doğrulandı.
- Yurt dışı birimi, üç adımlı başvuru ve örnek bilgi talebi eklendi. Portal üyeliğinin Belçika teslimat onayı olmadığı açıklandı. Güncel avro bedeli/posta ücreti teyit edilemedi; eski tarifeler kullanılmadı.
- `npm run dogrula:codex`: sekiz kapı geçti; 448 tarayıcı testi başarılı. Ek 12 rehber kontrolü (üç dil, iki genişlik, iki tema): taşma ve axe ihlali yok; masaüstü TR ve mobil FR ekran görüntüleri incelendi.
- Kanıtlar: `D:/tmp/ulucamii-belcika-abonelik-dogrulama-20260919.log`, `D:/tmp/abone-gorsel-20260919.json`, `D:/tmp/abone-canli-20260919.json`.
- Kaynaklar ve doğrulama sınırı: [Belçika araştırması](BELCIKA-DERGI-ABONELIGI.md). Abonelik açılmadı, ödeme yapılmadı, e-posta gönderilmedi.

## 19 Eylül 2026 — Diyanet içerikleri ve site hata düzeltmeleri

- Durum: yayımlandı ve canlı doğrulandı. Kullanıcının açık içerik/yayın talimatı.
- İçerik/teknik commit: `82871f2`; görsel referans ve son denetim: `d0c0d8f`.
- [Pages 35456237657](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35456237657): build ve deploy başarılı.
- [Hac kayıtları](https://ulucamii.be/tr/duyurular/2027-hac-kayitlari-devam-ediyor/): ön kayıt ve kesin kayıt son günü 30 Ekim. Ortak tarih kaynağı ve hizmet sayfaları düzeltildi; eski duyurular güncel takvime yönlendiriyor.
- [Taif ziyaretli Aralık umresi](https://ulucamii.be/tr/duyurular/taif-ziyaretli-aralik-umresi/): 20 Aralık–1 Ocak, son başvuru 20 Kasım; mevcut duyuru yenilendi.
- [Salih GÖR / Müşavirlik](https://ulucamii.be/tr/musavirlik-salih-gor/): TR/FR/EN kalıcı tanıtım; göreve başlama 20 Nisan 2026.
- [Yeni eğitim yılı mesajı](https://ulucamii.be/tr/duyurular/yeni-egitim-yili-birlikte-ogreniyoruz/): Diyanet'in 14 Eylül mesajından hareketle yerel kursa uyarlama.
- [Dergi aboneliği ve ücretsiz erişim](https://ulucamii.be/tr/diyanet-yayinlari-rehberi/): TR/FR/EN rehber, resmî dış abonelik temsilcilikleri/e-postaları ve anonim PDF erişimi. Belçika güncel ücret/posta bedeli açıkça doğrulanamadığından fiyat vaadi yok.
- [İslam İlmihali tanıtımı](https://ulucamii.be/tr/duyurular/diyanet-islam-ilmihali-tanitimi/): resmî tanıtım ve ürün künyesi; ücretsiz PDF iddiası yok.
- Teknik düzeltmeler: CMS alan eşleştirmesi, çeviride ad bütünlüğü/yanıt kontrolü, personel kartı kontrastı ve kenarlığı, geniş tabloda klavye erişimi.
- Doğrulama: toplu kapının web dışındaki adımları geçti; 442 web testi ve içerik nedeniyle yenilenen 6 görsel referans. Son rebase/build ardından normal modda 110/110 web testi; ek 54 içerik/görünüm kontrolü. Build: 900 sayfa.
- Canlı: 25/25 sayfa/dosya kontrolü; `govde.js` ve CMS yapılandırması SHA-256 eşit, çeviri paketindeki yeni kontrol mevcut. Kanıt: `D:/tmp/site-yayin-dogrulama-20260919.json`.
- Ayrıntılar ve sınırlar: [19 Eylül denetimi](HATA-AVI-2026-09-19.md). Öğrenci dosyaları ve özel işlem betikleri bu yayına alınmadı.

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
- İçerik commit'i `61bde97dcf563b04c3968c43f9eb6aceff147ae0`; Pages [35455560570](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35455560570) başarılı.
- Yayın sonrası kanıt: 65/65 canlı Release indirmesi HTTP 200 ve SHA-256 eşleşmesi; OneDrive yerel 55/55 SHA-256 eşleşmesi. TR/FR/EN canlı ve yerel kontrollerde her gün 13 bağlantı, altısı öğretici; 320/390/1440 px taşma 0, açık/koyu temada ciddi/kritik ihlal 0 ve klavye odağı geçer.
- Özel veli iletileri ve öğrenciye özel meşk defterleri kamuya açık yayına dahil edilmedi; kişisel bilgiler bu depoya alınmadı.
