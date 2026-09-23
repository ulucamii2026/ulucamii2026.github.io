# Web yayını kayıtları

Kalıcı kural: [AGENTS.md](../AGENTS.md). Tarihler Europe/Brussels saat dilimindedir.
Kayıtlar içerik yayınının kanıtıdır; sırf kayıt güncelleyen belge commit'i yeni içerik yayını değildir.
Kaynak proje: `D:/ulu-camii-kuran-kursu`; kurs indeksi `belgeler/YAYIN-KAYITLARI.md`.

## 23 Eylül 2026 (2) — hoca portalındaki Camiye Gidiyorum kitapları A4 baskı sürümleriyle yenilendi

- Zaman: 23 Eylül 2026 21:55 (istek) – 22:12 (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının talimatı («hoca portalındaki kitapları güncelle bu dosyadaki en güncel versiyonları ile, eskileri at gitsin»).
- Kapsam: `/hoca/ → Ders kitapları` bölümündeki dört PDF, kullanıcının teslim klasöründeki (`Downloads/Camiye Gidiyorum/Güncel Kitaplar`, 22–23 Eylül A4 ev yazıcısı baskı hazırlığı; klasördeki `BASKI_NOTLARI.md` + `SHA256.txt`) sürümlerle değiştirildi: TR1 228 s. / 87 384 744 B (eski 227 s.), FR1 228 s. / 97 003 740 B, TR2 270 s. / 119 001 909 B, FR2 270 s. / 69 277 461 B. Kaynak özetleri klasördeki `SHA256.txt` ile birebir. Kimlikler `…-20260921` → `…-20260923`; eski 21 şifreli parça silindi, 25 yeni AES-256-GCM parçası ve her kitap için yeni bağımsız anahtar üretildi. Açık PDF, anahtar ve kişisel veri Git'e girmedi. Mekanizma, Firestore kuralı ve hoca rolü değişmedi ([HOCA-KITAPLARI.md](HOCA-KITAPLARI.md)).
- Değişen dosyalar: `public/media/hoca-kitaplari/` (−21 / +25 `.bin`), `src/data/hoca-kitaplari.json`, `docs/HOCA-KITAPLARI.md`. Yardımcılar (Git dışı, `.codex/`): `kitap-yenile-20260923.py`, `kitap-yayin-20260923.py`, `kitap-tarayici.mjs`; eski anahtar dosyası `hoca-kitap-anahtarlar-eski-20260921.json` olarak yerelde yedeklendi, ardından 22:20'de kullanıcının «eski verileri temizle» talimatıyla 21 Eylül'e ait önizleme/ekran görüntüsü/günlük dosyalarıyla birlikte silindi (eski parçalar artık hiçbir anahtarla çözülemez).
- İçerik commit'i `48decb4` (32 dosya; push `e7d5a88..48decb4`, ≈356 MB). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35913987429> — build + deploy **success** (22:10:59). Yerel `dist` 744 MB (Pages 1 GB sınırının altında); GitHub depo boyutu yenileme öncesi ≈766 MB, sonrası ≈1,1 GB (eski parçalar geçmişte kalır; anahtarları silindiği için çözülemez).
- Yerel doğrulama: `.codex/kitap-yayin-20260923.py` dört kitabı parçalardan çözüp kaynak PDF özetiyle eşledi; `npm run test:ogrenme` 10/10; `npm run build` 1885 sayfa; `tests/web/hoca-kitaplari.spec.mjs` 2/2 (masaüstü + mobil, axe açık/koyu, taşma yok); önizlemeden (4401) gerçek tarayıcı indirmesi 4/4 SHA-256 eşleşti (`kitap-tarayici-sonuc-20260923.json`, ekran görüntüleri `.codex/kitaplar-{mobile,desktop}-20260923.png`).
- Firestore (dernek, `ayarlar/hocaKitaplari`): önce eski ∪ yeni 8 anahtar (sürüm 2, canlı site kesintisiz), yayın ve canlı doğrulama sonrası yalnız yeni 4 anahtar (sürüm 3); yazım sonrası geri okundu; oturumsuz erişim 401/403.
- Canlı doğrulama (22:11–22:14, `--canli`): 25 parça `https://ulucamii.be` üzerinden indirildi, dört PDF özeti eşleşti (`.codex/kitap-canli-20260923.log`); eski `…-20260921` parçaları canlıda yok (HEAD ≠ 200); `/hoca/` betiklerinde yalnız yeni kimlikler.
- Açık sınırlar: fiziksel cihazda hoca hesabıyla indirme denenmedi (aynı kod yolu Playwright ile doğrulandı). Kitap içeriği bu işte incelenmedi; `BASKI_NOTLARI.md`'deki «karar sizde olan küçük eklemeler» ve bilinen sınırlar kullanıcıya aittir. Depo her yenilemede ≈350 MB büyür; sık yenileme gerekirse parçalar için Release/ayrı depo düşünülmeli.
## 23 Eylül 2026 — kayıt ve ihtida uçlarına sunucu tarafı hacim sınırı (Apps Script v40)

- Zaman: 23 Eylül 2026 14:00–15:05 (Europe/Brussels, CEST). Durum: **GAS canlıda, site yayımlandı ve canlı doğrulandı.** Dayanak: koordinatörlük oturumundan gelen görev (herkese açık `kayit`/`ihtida` POST uçlarında sunucu tarafı hacim sınırı yoktu; bot defteri, Drive'ı ve Brevo kotasını doldurabilirdi).
- Kapsam: `AYAR_BASVURU_SINIRI` (tek yapılandırma, dosyanın başında): tür başına 10 dakikada 10 yeni kayıt → `cok-sik`; günde kayıt 60 / ihtida 20 → `gunluk-sinir`; aynı e-posta (küçük harf, kırpılmış) günde 3 → `eposta-gunluk-sinir`. Sayım `basvuruSinirKodu()` ile v2 defterindeki gerçek satırlardan (zaman damgası + e-posta sütunu), `LockService` kilidi içinde ve `gonderimAnahtari` tekrar denetiminden SONRA yapılır → yinelenen istek hiç engellenmez/sayılmaz. Tuzak alan `web` (formdaki görünmez alan) doluysa gövde doğrulamadan önce `bos-istek` ile reddedilir; gerçek istemci bu alanı zaten göndermez. `console.warn` satırlarında kişisel veri yok. Sağlık yanıtında `basvuruSiniri: true`. Başka davranış değişmedi.
- İstemci: `src/i18n/formlar/{tipler,tr,fr,en,nl,de}.ts` → `hata.yogunluk` (beş dil; «Bugün çok sayıda başvuru alındı… info@ulucamii.be»); `KayitFormu.astro` ve `IhtidaFormu.astro` üç kodu bu iletiye bağlar.
- Değişen yollar: `scripts/apps-script/ulucamii-Kod-v39.gs` → `ulucamii-Kod-v40.gs` (`git mv`, depo düzeni), `scripts/apps-script/README.md`, `scripts/apps-script/veli-mail-listesi.gs` (yorum), `scripts/ihtida-gas-derle.mjs`, `scripts/pdf-onizleme.mjs`, `package.json` (`test:kayit`), `tests/basvuru-siniri.test.mjs` (yeni, 13 sınama), sürüm/yol güncellenen 10 test, `docs/KAYIT-ZORUNLU-BELGELER.md`.
- Apps Script **v40** (önce GAS, sonra site): `D:/tmp/gas/dagit_v40.py`. `--kuru` okumasında canlı kaynak 21 Eylül v39 dağıtımında yeniden okunan kopyayla birebir aynıydı (8 490 265 karakter) → `v40-oncesi-dogrulanmis.gs`. Yeni paketin canlı v39'dan farkı yalnız bu değişiklik (63 satır). Paket 8 639 834 bayt, SHA-256 `512a607334552b79…febdcc53b`; yeniden okunan kod paketle birebir aynı; «Nouvelle version» ile 14:45'te **sürüm 40 canlıda**. Sağlık GET: `surum:40`, `basvuruSiniri:true`, `kayitKimlik/kayitImza/kayitBelgeleriZorunlu/kayitDuzelt/defterCeviri/ihtidaPaketHazir/ihtidaDefteriHazir/seviyeTesti:true`, `ceviriMotoru:gemini`, `seviyeBankaSurumu:1`. Canlı kayıt/ihtida uçlarına deneme başvurusu GÖNDERİLMEDİ.
- İçerik commit'i: `d9bd48b` (25 dosya). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35864015422> — build + deploy **success** (13:02 UTC).
- Yerel doğrulama: `npm run dogrula` çıkış 0 (build 1894 sayfa; `test:kayit` 23/23, `test:ihtida` 33/33, `test:duzelt` 6/6, `test:gas-ceviri` 6/6, `test:seviye` 51/51, `test:kimlik` 31/31 …); ayrıca `test:veli-eposta` 58/58; `npm run check` 0 hata 0 uyarı; `npm run test:web` Playwright **616/616**.
- Canlı doğrulama: `/kayit/`, `/kayit/fr/`, `/tr/ihtida-basvurusu/`, `/fr/demande-de-conversion/`, `/en/conversion-application/`, `/nl/aanvraag-bekering/`, `/de/antrag-konversion/` yeni hata kodlarını taşıyor; imam numarası metinde yok.
- Açık sınırlar: (1) aynı e-postayla günde 3 kayıt sınırı, dört ve daha çok çocuğunu aynı gün kaydeden bir veliyi durdurur — veli yerelleştirilmiş iletiyle info@ adresine yönlendirilir; gerekirse `AYAR_BASVURU_SINIRI.kayit.epostaGunlukSinir` artırılıp GAS yeniden dağıtılır. (2) Sınır, defterden silinen (ör. `test-temizle`) satırları saymaz. (3) Site denetimindeki «fr dilinde 73 sayfa eksik» orta bulgusu bu değişiklikten bağımsızdır (sayfa eklenip çıkarılmadı).

## 21 Eylül 2026 (11) — görünür besmele ve dinleme derslerinde hata avı

- Zaman: `2026-09-21T23:06:42+02:00` (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.**
- Kullanıcı: Asr'da âyetlerin üzerinde besmele hücresi ve diğer derslerde benzer hata avı.
- İlk içerik `7ca0e2e11ab78ba429011ff726bc3dec488b23a8` (9 dosya), son kaydırma
  düzeltmesi `6840174c3c16e0b2a13e0e03179160a19143263c` (3 dosya); toplam 9 farklı yol. İlk
  [deploy](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35654145461)
  22:58:28+02:00'da doğrulandı; ardından 372 sayfalık canlı kontrol geçti. Dernek kimliği `ulucamii2026` doğrulandı;
  pull --rebase, push ve [Pages yayını](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35654892416) başarılı. Release: 0; yeni ses/PDF: 0.
- Asr dâhil 13 sûre ve `e81/e85/e86` rehberli okumasında ayrı, numarasız, ortalı ve
  dokunulabilir besmele hücresi. Fâtiha ve `e76` içinde mevcut besmele çiftlenmiyor;
  âyet numaraları değişmedi. Beş dil, klavye, sıralı dinleme ve betiksiz ses erişimi çalışır.
  Dört rehberli sûre dersinde uzun âyetler tam genişlikte gösterilir.
- Âyetü’l-Kürsî hücresi yalnız Bakara 255 kaydını çalar; tam kayıt eûzü–besmele–âyet
  sırasını korur. Tekrar arası sırasında kip kapatıldığında bekleyen sesin yeniden
  başlaması düzeltildi. İlerleme çubuğu genişlik yerine transform ile güncellenir.
  Uzun hücrede ilk satırı sabit başlık arkasına bırakan kaydırma payı düzeltildi;
  yerelde ve canlıda başlık/ilk Arapça satır koordinatlarıyla doğrulandı.
- Kaynak üretici `motor/site-veri-uret.mjs` besmele/metinSesi alanlarını üretir.
  `icerik/web-okunus.json`, 7 dersteki önceki 11 web okunuş düzeltmesini korur.
  `--denetle`: 74 kod, 815 öge, site JSON'uyla birebir eşleşme; dosya yazmaz.
  Kaynak kitap metinleri/PDF'leri değiştirilmedi.
- Metin: 14 sûredeki 71 âyet güncel Diyanet mushafıyla karşılaştırıldı; NFC ve boşluk
  normalleştirmesi dışında Arapça metinler aynı (harekeler korunarak karşılaştırıldı).
  Kaynak örneği: [Asr mushafı](https://kuran.diyanet.gov.tr/mushaf/kuran-tefsir-1/asr-suresi-103/ayet-1/diyanet-isleri-baskanligi-meali-1).
- Ses: resmî Osman Şahin `1_1.mp3` ve `2_255.mp3` yeniden indirilip yerelle eşleştirildi.
  Besmele SHA-256 `ce2f8701f14fb41028cfe9fc92daac454d3657baf9ccc147857425cc58809145`;
  Bakara 255 `1d62b8de5e45bfd13f88319f26c665144eb2913d58fde75c1222b7d5e6d330d8`.
  `ecouter.json` SHA-256 `f358a4b940a9ff0066f5fc47e8243bd79c8a32ee4179590c019e19468d50c372`.
- Kalite: `npm run dogrula:codex` tüm aşamaları geçti; **614/614** tarayıcı, 42 güvenlik,
  58 veli e-postası, 14 otomatik kayıt, 10 öğrenme/kitap testi. Ses regresyonu **6/6**.
  Son tip kontrolü 0 hata/0 uyarı. Son görünüm ve kaydırma değişikliklerinden sonra build
  (1.885 sayfa) ve ilgili iki test dosyası **88/88** yeniden geçti. 485 eğitim iç bağlantısı sağlam.
  320 px açık/1280 px koyu temada 8 görünüm; metin ortalaması, taşma, gerçek ses çözümleme ve
  axe serious/critical kontrolü geçti. Görseller incelendi. Impeccable 0 bulgu;
  yeni bastırma yok. Önceki genel site denetiminin 2 orta/58 düşük kaydı kapsam dışıdır.
- Canlı: 372 eğitim/QR HTML sayfası ve 2 ses özeti doğrulandı. Beş dilde Asr tam kayıt,
  besmele ve ilk âyet gerçekten oynadı (15 oynatma); numaralar 1–2–3. Rehberli Kevser
  genişliği ve Âyetü’l-Kürsî hücresinin ses yolu ayrıca 320 px canlı tarayıcıda doğrulandı.
  URL'ler: https://ulucamii.be/tr/audio/asr/ · https://ulucamii.be/e/asr/ ·
  https://ulucamii.be/tr/muhtedi-egitimi/ . 74 basılı QR adresi korunuyor.
- Değişen yollar: `src/components/SesliDers.astro`, `src/data/ecouter.json`,
  `src/i18n/dinleme.ts`, `src/lib/ecouter.ts`, `src/scripts/ecouter.ts`,
  `src/styles/ecouter.css`, `tests/ecouter-ses.test.mjs`, `tests/web/ecouter.spec.mjs`,
  `docs/DINLEME-SAYFALARI.md`. Yerel kanıtlar `.codex/besmele-denetim/`.
- Açık sınır: fiziksel iPhone/Safari testi ve bütün kayıtların baştan sona bağımsız
  insan dinleme denetimi yapılmadı. Bu tur mevcut resmî sesleri değiştirmedi.

## 21 Eylül 2026 (10) — sûre/dua ses düzeltmeleri ve hocaya özel kitap indirme

- Zaman: `2026-09-21T20:02:52+02:00` (Europe/Brussels). **Yayımlandı ve canlı doğrulandı.**
- Kullanıcı: Asr'da besmele eksikliğinin ve benzer kusurların giderilmesi; Arapça metnin
  ortalanıp hücreye dokunarak dinlenmesi; dört güncel kitabın hoca portalından indirilmesi.
- İçerik commit'i `e2e14d0ceee038b55366939b0fb748af71c2d965`; 63 dosya. Dernek kimliği `ulucamii2026` doğrulandı;
  pull --rebase, push ve [Pages yayını](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35635411859) başarılı. Release: 0.
- Asr dâhil 13 sûrede besmele eksikti. Fâtiha ve Âyetü'l-Kürsî dâhil 15 tam kayıt resmî
  Osman Şahin âyetlerinden yeniden üretildi: eûzü → tek besmele → âyetler. Eski ham MP3
  birleştirmesinin başlık hataları PCM çözümleme/birleştirme/kodlamayla giderildi.
- Kunut 1'in son cümlesi eski 23,76 sn kesiminde Kunut 2'ye geçmişti; içerik ve sessizlik
  doğrulanarak sınır 29,4 sn yapıldı. Sabah ibaresi bulunan ezan metni resmî sabah ezanıyla
  eşleştirildi. Uzun ezan duasındaki iki ibare web metnine/okunuşuna/anlamına eklendi.
  Kamet için otomatik analizdeki 6 başlangıç tekbiri iddiası bağımsız dökümde doğrulanmadı
  (başta 4, sonda 2); resmî kayıt korunmuştur. Arapça TTS/üçüncü taraf ses kullanılmadı.
- Arapça hücre ortalı ve tamamı düğme; dokunma/Enter/Boşluk, etkin simge ve aria-pressed.
  Bölüm kaydı olmayan duanın bütün metni tek hücrede kendi tam sesine bağlanır. 74 basılı
  QR adresi ve 365 dil/ders yolu değişmedi. Önbellek sürümü 3, ezber odası da güncellendi.
- `/hoca/ → Ders kitapları`: dört PDF, 21 AES-256-GCM parçası; açık PDF veya anahtar Git'e
  girmedi. Yalnız `ayarlar/hocaKitaplari` özel belgesi yazıldı ve geri okunarak doğrulandı.
  Mevcut canlı Firestore kuralları yerelde sınananla birebir aynı; kural/rol değişikliği yok.
  Ziyaretçi, veli ve hoca rolü olmayan hesap erişimi reddedildi (emülatör); canlı oturumsuz
  anahtar okuma reddedildi. Tarayıcıda dört gerçek PDF indirilip kaynak özetiyle eşleştirildi.
  - `cg1-fr-20260921`: 228 sayfa, 119508776 bayt, SHA-256 `750d7a0759637e6d3dd32095d132d1f137babdc0e4ade9a95ef7f36436b5559a`.
  - `cg1-tr-20260921`: 227 sayfa, 47574147 bayt, SHA-256 `4814a8f6f3d9cd40fb121ab9df1b3d5c8772a9d1a31252507951c13a80c5a160`.
  - `cg2-fr-20260921`: 270 sayfa, 94836992 bayt, SHA-256 `d1e56722873195763d208194d0940df7208b9f883b6b2fdffc9ce77af083a969`.
  - `cg2-tr-20260921`: 270 sayfa, 63422630 bayt, SHA-256 `1f734c4dc409df102db2d0892a1d0c53a7780fea8b53876398b10d99772eff91`.
- Doğrulama: `npm run dogrula:codex` çalıştırıldı. İlk tam tarayıcı turu 588/592 geçti;
  dört başarısız beklenti eski ses sürümü ve eski sekme sırasıydı. Bunlar düzeltildi;
  ilgili dört dosyanın **80/80** testi yeniden geçti. Öğrenme testi dosya yolundaki sürüm
  parametresini ayıracak şekilde düzeltildi; **10/10** geçti. Kural **42/42**, veli e-postası
  **58/58**, otomatik kayıt **14/14**, son ses regresyonu **5/5**. Son tip kontrolü 0 hata/
  0 uyarı; son derleme 1.885 sayfa; site denetiminde yeni kritik hata yok. Önceden var olan
  2 orta/58 düşük bilgi kaydı bu işte genişletilmedi. Değişen arayüzde Impeccable 0 bulgu;
  bastırma eklenmedi. 485 eğitim iç bağlantısı ve 18 dış Diyanet PDF bağlantısı sağlam.
- Ses kanıtı: 26/26 tam kayıt ffmpeg `-xerror` kontrolünden geçti; 26/26 canlı MP3 yerel
  SHA-256 ile eşleşti. Asr, Fâtiha, İhlâs ve düzeltilen dualar için ayrı ses dökümleri
  incelendi; kaynak, sıra, PCM ve MP3 özetleri `docs/dinleme-ses-kaynaklari.json` içindedir.
- Canlı: 374 HTML + 3 önceki varlık kontrolü; beş dilde gerçek tarayıcı Asr tam ses/âyet
  hücresi oynadı, hizalama doğru ve yatay taşma yok. Dört kitabın 21 canlı parçası indirilip
  çözülünce kaynak PDF'lerin tüm SHA-256 değerleri eşleşti. Kampanya PDF'si ve özel imzalı
  tutanak önceki özetleriyle aynı; yeni kişisel belge yayımlanmadı.
- Değişen yollar: `src/components/SesliDers.astro`, `src/styles/ecouter.css`,
  `src/data/{ecouter,hoca-kitaplari}.json`, `src/i18n/dinleme.ts`, `src/lib/ezber-verisi.ts`,
  `src/scripts/{hoca-ekrani,hoca-kitaplari}.ts`, `scripts/sure-ses-uret.py`,
  `public/media/ses/{sureler,ayet,dualar}`, `public/media/hoca-kitaplari`, `package.json`,
  ilgili 7 test dosyası ve `docs/{DINLEME-SAYFALARI,OGRENCI-MODU-PORTAL,HOCA-KITAPLARI,PROJE-HAFIZASI}.md`.
- Açık sınırlar: fiziksel iPhone/Safari denenmedi. Her sesin her kelimesi bağımsız insan
  uzman tarafından dinlenmedi; otomatik döküm tek başına kesin kaynak sayılmadı.
  Kitaplar cihazda açılabilen kaynak PDF'lerle aynıdır; baskı/akademik redaksiyon yapılmadı.
  İndirme yetkisi olan hocanın kaydettiği kopyayı geri çekme iddiası yoktur.

## 21 Eylül 2026 (9) — Dinimi Öğreniyorum ve eğitim yardımı kampanyası

- Zaman: `2026-09-21T18:55:05+02:00` (Europe/Brussels). Durum: **yayımlandı ve canlı doğrulandı**.
- Kullanıcı, beş dilde eğitim hata avı, kapsayıcı başlık, resmî kampanya yayını ve özel imzalı tutanak istedi.
- İçerik commit'i `ff875f57626a9edcc542861cfb4abacb76221f8e`; pull --rebase ve push tamamlandı. Deploy <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35628304909> **success**.
- Release 0; içerik commit'inde 27 dosya. 1 resmî PDF (125.916 bayt); SHA-256
  `99fc9e1407b0773ff317b4cdaf89c527a174398bd8964f04dc2f9e37009c7658`.
- Eğitim başlığı TR/FR/EN/NL/DE dillerinde **Dinimi Öğreniyorum** karşılıklarıyla değişti.
  73 dersin beş dilde toplam 365 karşılığı, dil koruyan bağlantılar/arama/oynatıcı, yerel hata
  mesajları ve 14 ek yerel dilde Diyanet kitap bağlantısı var. 74 eski QR rotası korundu.
  Eski oynatma isteğinin gecikmiş hatası yeni sesi durdurmuyor.
- `npm run dogrula:codex`: **8/8**; Playwright **590/590**. Derleme 1.885 sayfa.
  18 resmî Diyanet PDF bağlantısı canlı doğrulandı. Beş dilde mobil/açık ve masaüstü/koyu
  görünüm, Almanca 320 px ve TR/FR kampanya görselleri incelendi; taşma yok. Impeccable 0 bulgu;
  bastırma eklenmedi. Kampanya vitrin sırasını değiştirdiği için 6 ana sayfa referansı güncellendi.
- Canlı kontrol: **374 HTML** (365 ders, 5 merkez, /e/, /e/test/, 2 kampanya)
  başlık/dil/ses kontrolleri geçti. PDF ve iki örnek ses için **3/3 SHA-256** yerelle aynı.
- Canlı adresler: <https://ulucamii.be/tr/muhtedi-egitimi/>,
  <https://ulucamii.be/tr/audio/fatha/>, <https://ulucamii.be/e/fatha/>,
  <https://ulucamii.be/tr/duyurular/egitim-yardimi-kampanyasi-2026/>,
  <https://ulucamii.be/fr/annonces/egitim-yardimi-kampanyasi-2026/>,
  <https://ulucamii.be/belgeler/egitim-yardimi-kampanyasi-2026-09-21.pdf>.
- Kaynak proje `D:/koordinatörlük`: yayın kaydı ve DEVAM güncellendi. Başkan ve din görevlisi
  imzalı tutanak yalnız özel çıktı klasöründedir; web deposunda yoktur. Tahsilat ve aktarım
  henüz gerçekleşmediğinden tutar, sayım ve dekont alanları boş bırakıldı. Üçüncü kişiye gönderim yok.
- Sınırlar: kitaptan gelen Fransızca okunuş/anlamlar açıkça etiketlenerek korunur; yeni meal
  üretilmez. Fiziksel telefon/Safari ve tüm seslerin insan tarafından dinlenmesi yapılmadı.
- Ayrıntı: `docs/EGITIM-DIL-DENETIMI-2026-09-21.md`; kanıtlar `.codex/egitim-son-kalite.log`,
  `.codex/egitim-canli-sonuc.json`, `.codex/egitim-gorsel/`.
- Değişen yollar:
  - `docs/DINLEME-SAYFALARI.md`
  - `docs/EGITIM-DIL-DENETIMI-2026-09-21.md`
  - `docs/PROJE-HAFIZASI.md`
  - `public/belgeler/egitim-yardimi-kampanyasi-2026-09-21.pdf`
  - `src/components/SesliDers.astro`
  - `src/components/SesliDersDizini.astro`
  - `src/content/duyurular/fr/egitim-yardimi-kampanyasi-2026.md`
  - `src/content/duyurular/tr/egitim-yardimi-kampanyasi-2026.md`
  - `src/i18n/dinleme.ts`
  - `src/i18n/egitim-kitaplari.ts`
  - `src/i18n/egitim.ts`
  - `src/i18n/ui.ts`
  - `src/i18n/utils.ts`
  - `src/lib/ecouter.ts`
  - `src/pages/[lang]/audio/[kod].astro`
  - `src/pages/e/[kod].astro`
  - `src/pages/e/index.astro`
  - `src/sayfalar/MuhtediEgitimi.astro`
  - `src/scripts/ecouter.ts`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-en-dark-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-en-light-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-fr-dark-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-fr-light-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-tr-dark-masaustu-chromium-win32.png`
  - `tests/web/design-visual.spec.mjs-snapshots/ana-sayfa-tr-light-masaustu-chromium-win32.png`
  - `tests/web/ecouter.spec.mjs`
  - `tests/web/egitim-diller.spec.mjs`


## 21 Eylül 2026 (8) — son tasarım uyarısı kapatıldı; proje devri tamamlandı

- Zaman `2026-09-21T16:53:13+02:00` (Europe/Brussels); durum **yayımlandı ve canlı doğrulandı**.
  Kullanıcının “her şeyi bitir” kapanışı ve tekrarlanan denetim bulgusu üzerine,
  önceki yayında açık bırakılan ilerleme çubuğu animasyonu da giderildi.
- Tek değişiklik `src/styles/ecouter.css`: `.ec-cubuk > span` üzerindeki
  `transition: width .2s linear` kaldırıldı. Dolgu ses süresine göre güncellenir;
  hareket azaltma tercihi dışında da genişlik animasyonu yoktur. Uyarı bastırılmadı.
- İçerik commit'i `01ae56b02f69bc888b3adc7aaac9bbf445ea21ca`; push tamamlandı. Deploy <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35614930192> **success**.
  Release 0; değişen içerik dosyası 1 CSS. SHA-256 `76b6b6387c34f947395d717110701d0ae93808c2d095c2928927994ccabf5f02`.
- `npm run dogrula:codex` 8/8; Playwright 564/564. Ek yerel/canlı gerçek ses kontrolünde
  Fâtiha kaydının yarısında dolgu %50, computed transition süresi `0s`; görünüm incelendi.
  Canlı adres <https://ulucamii.be/e/fatiha/>; eğitim <https://ulucamii.be/tr/muhtedi-egitimi/>.
- Kanıtlar: `.codex/dinleme-animasyon-kalite.log`, `dinleme-animasyon-yerel.json`,
  `dinleme-animasyon-canli.json` ve aynı adlı PNG'ler.
- (7) numaralı kayıttaki açık animasyon uyarısı bu yayınla kapandı. Bildirilen üç
  benzersiz tasarım bulgusu da giderildi; ignore eklenmedi. İçerik, ses/QR adresleri
  ve özel PDF değişmedi. İki `DEVAM.md` ve kaynak kitap kalite raporu güncellendi.
- Sınır: fiziksel telefon/Safari ve bütün seslerin insan tarafından dinlenmesi yapılmadı.
  Bu görevde bekleyen uygulama veya yayın yoktur.

## 21 Eylül 2026 (7) — eğitim kutularında dar kapsamlı tasarım düzeltmesi

- Zaman: `2026-09-21T16:24:59.633033+02:00` (Europe/Brussels). Kullanıcının tasarım denetimi geri bildirimi
  kapsamında **yayımlandı ve canlı doğrulandı**.
- `src/styles/ecouter.css`: `.eg-takip` ve `.eg-uygulama` üzerindeki dekoratif yan
  çizgiler kaldırıldı (iki satır). Mevcut zemin, içerik ve işlevler korundu.
- Triage: yinelenen raporda üç benzersiz bulgu vardı. İki yeni `side-tab` düzeltildi.
  `layout-transition` (`.ec-cubuk > span`, `transition: width .2s linear`) başlangıç
  commit'i `13624c2` içinde de bulunduğundan önceden var olan bulgu olarak bırakıldı;
  bu görsel düzeltmede kapsam genişletilmedi. **Bastırma/ignore eklenmedi.**
- İçerik commit'i `151352c50ee57ffd31d7c46cd62b36f2c1ad36cb`; push tamamlandı. Deploy <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35611599948> **success**.
  Release: 0; değişen içerik dosyası: 1 CSS. SHA-256: `90094db0600fd7d59e68e29803ebd599731c90831be4076d983336b343cf400c`.
- Kalite: `npm run dogrula:codex` 8/8; Playwright 564/564. Yerel mobil açık/masaüstü
  koyu görseller incelendi. Canlı aynı iki ölçekte 9 kutunun yan çizgisi 0 px,
  taşma yok, 8 bölüm ve 73 ders korundu. Kayıtlar `.codex/dinleme-tasarim-*.json/log/png`.
- Canlı: <https://ulucamii.be/tr/muhtedi-egitimi/>,
  <https://ulucamii.be/fr/formation-nouveaux-musulmans/>.
- Önceki yayın (6) içindeki 56 ses düzeltmesi ve 74 QR adresi değişmedi. Kaynak
  kitap kalite raporu ve iki projenin `DEVAM.md` kayıtları güncellendi.
  Sınır: önceden mevcut ilerleme animasyonu uyarısı açık; yeni fiziksel telefon testi yok.

## 21 Eylül 2026 (6) — Yeni Müslümanlar eğitim platformu ve Elifbâ ses düzeltmesi

- Zaman: 21 Eylül 2026 öğleden sonra; canlı kontrol `2026-09-21T16:05:00.539675+02:00` (Europe/Brussels, CEST).
  Durum: **yayımlandı ve canlı doğrulandı**. Kullanıcı, fetha ses hatasının ve benzerlerinin
  düzeltilmesini, kitap karekodları korunarak derslerin herkese açılmasını ve yeni
  Müslümanlar için ayrıntılı bir eğitim platformunun tam otonom kurulmasını istedi.
- Platform: beş dilde sekiz öğrenme bölümü, 24 çalışma konusu, sekiz uygulama,
  günlük çalışma önerisi, dört SSS, dört resmî Fransızca Diyanet PDF kaynağı,
  çok dilli kütüphane ve mevcut seviye testi/iletişim bağlantıları. İsteğe bağlı ilerleme
  işaretleri yalnız cihazda saklanır; üyelik, yeni sunucu kaydı veya veri toplama yoktur.
- 73 sesli ders `/e/` üzerinden aramalı/kategorili dizinde ve bütün eğitim merkezlerinde
  erişilebilir; indexlenebilir ve site haritasındadır. Ders açıklamaları FR, tilavetler AR;
  rehber TR/FR/EN/NL/DE. 74 basılı QR adresi sabit; `/e/test/` yönlendirmesi korunur.
- Ses: yanlış klasör/numaralandırmadan gelen 28 yalın harf + 28 fetha dosyası resmî Diyanet
  asıllarıyla değiştirildi. 787 Elifbâ yolu / 759 benzersiz resmî URL bayt eşitliği ve
  41 bölümde 787 metin–ses bağı kontrol edildi. `e09` aynı kayıtta okunan kısa–uzun
  heceleri 28 çift düğmede gösterir. Ses URL'leri JS ve betiksiz erişimde `?v=2` kullanır.
- Değişen yollar: `src/sayfalar/MuhtediEgitimi.astro`, `src/i18n/egitim.ts`,
  `src/i18n/egitim-rehberi.ts`, `src/scripts/muhtedi-egitimi.ts`,
  `src/components/SesliDersDizini.astro`, `src/pages/e/index.astro`, `src/pages/e/[kod].astro`,
  `src/pages/[lang]/[sayfa]/index.astro`, `src/components/Header.astro`, `src/i18n/ui.ts`,
  `src/layouts/Base.astro`, `src/lib/ecouter.ts`, `src/scripts/ecouter.ts`,
  `src/styles/ecouter.css`, `src/data/ecouter.json`, 56 `public/media/ses/elifba/` MP3,
  `scripts/indir-elifba-ustun.ps1`, `scripts/elifba-ses-denetle.py`, `package.json`,
  `tests/ecouter-ses.test.mjs`, `tests/fixtures/elifba-resmi-eslesmeler.json`,
  `tests/web/ecouter.spec.mjs`, `docs/dinleme-ses-kaynaklari.json`,
  `docs/DINLEME-SAYFALARI.md`, `docs/PROJE-HAFIZASI.md`.
- İçerik commit'i `413f013ab7bd8aa9d9a8a50430ec275dd9d2acc5` — 80 dosya; push tamamlandı. Release: **0** (yeni Release
  gerekmiyor; 56 ses Git deposu üzerinden). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35609410527> — build/deploy **success**.
- Yerel kalite: `npm run dogrula:codex` **8/8 geçti**, çıkış 0; Astro 303 dosyada
  0 hata/0 uyarı, 1588 sayfa; Playwright **564/564**, buna eğitim/dinleme **38** senaryosu
  dahil. Yeni ses regresyonları 3/3. Bütün 856 kullanılan ses Chromium AudioContext ile
  çözümlendi, hata 0. Mobil/masaüstü, açık/koyu, klavye, JavaScript kapalı ve engelli
  depolama kontrolleri geçti; görseller gözle incelendi.
- Canlı kontrol: **80/80** adres HTTP 200 (5 merkez + dizin + 74 QR); 56/56 düzeltilmiş
  MP3 SHA-256 yerel/resmî manifestle eşleşti. Beş merkezde 8 bölüm/73 ders, arama,
  ilerleme kalıcılığı ve mobil taşma kontrol edildi. Fetha `be.mp3?v=2` gerçek tarayıcı
  oynatması başarılı (1.110204 saniye, medya hatası yok).
- Canlı adresler: <https://ulucamii.be/tr/muhtedi-egitimi/>,
  <https://ulucamii.be/fr/formation-nouveaux-musulmans/>,
  <https://ulucamii.be/en/learning-new-muslims/>,
  <https://ulucamii.be/nl/onderwijs-nieuwe-moslims/>,
  <https://ulucamii.be/de/unterricht-neue-muslime/>, <https://ulucamii.be/e/>,
  <https://ulucamii.be/e/fatha/>.
- SHA-256: `src/data/ecouter.json` = `bfa1e50341283772f3449e204ab26b17a44906c93684617c1bf15092ceff6ebe`;
  kaynak manifesti = `8215dea311cea7b458bd44dbaf9c21d86ba8a1faf0385817a19bb130c2af7281`.
  Dosya başına ses özetleri manifesttedir. Özel kaynak PDF değişmedi; 766 sayfa,
  99 karekod / 74 kod, hata 0; başlangıç/son SHA-256 eşitliği doğrulandı.
- Kaynak kitap projesindeki katalog/doğrulama/üretici, kalite raporu ve `DEVAM.md`
  güncellendi. Özel kitap ve kişisel bilgiler siteye yüklenmedi. Yerel kanıtlar
  `.codex/dinleme-platform-kalite.log`, `dinleme-canli-sonuc.json`,
  `dinleme-canli-tarayici.json`; kaynak raporu `inceleme/WEB-SES-DUZELTMESI-2026-09-21.md`.
- Sınırlar: bütün kayıtlar kıraat hocası tarafından tek tek dinlenmedi; fiziksel
  telefon/Safari testi yapılmadı. Kaynak kitapların bağlantıları doğrulandı;
  Diyanet'in ileride değiştirebileceği dış adresler site denetiminin dışındadır.

## 21 Eylül 2026 (5) — site dilleri: Flemenkçe (nl) + Almanca (de); seviye testi form sürümü 2 (Apps Script v39)

- Zaman: 21 Eylül 2026 sabah (istek) – 14:40 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının talimatı («camimiz bundan sonra Flemenkçe ve Almanca da olsun, iki dil daha ekle»; seviye testi için «Flemenkçe ve Almanca… seslendirme vesaire her şey olsun» + başvuranın yeri, en yakın Diyanet camisi, görevliyi tanıma, ataşelik bilgisi ve iki paylaşım onayı).
- Kapsam: site dilleri tr, fr, en + **nl** (Belçika Flemenkçesi, u-biçimi) ve **de** (Sie-biçimi) — `src/i18n/ui.ts` tek kaynak, yollar, menü, hreflang (`nl-BE`, `de-BE`), bayraklar, paylaşım kartları (`scripts/og-kart-uret.mjs`), veli portalı manifestleri, 11 içerik sayfası × 2 dil, formlar, veli portalı arayüzü, UİP, seviye testi bankası ve arayüzü. Yasak kalıp `dil === 'tr' ? … : dil === 'en' ? … : …` bütün bileşenlerde `Record<Dil, …>` oldu. Saklanan içerik (duyuru, etkinlik, vaaz, ders defteri) TR+FR kalır; nl/de sayfaları ziyaretçinin dilinde not gösterir. Kılavuz: [DIL-NL-DE.md](DIL-NL-DE.md).
- Seviye testi **form sürümü 2**: «yer ve yerel destek» bölümü (ülke, şehir/posta kodu, bilinen en yakın Diyanet camisi, görevliyi tanıma, Müşavirlik/Ataşelik bilgisi) + **iki ayrı, isteğe bağlı, işaretsiz gelen** paylaşım onayı (yerel din görevlisi / Müşavirlik-Ataşelik; GDPR md. 9/2-a, AEA dışı md. 49/1-a). Otomatik aktarım YOKTUR; hoca raporu ve panel «ONAY VERDİ / VERMEDİ» gösterir. Ders dili seçenekleri beş. `RIZA_SURUMU = 2026-09-21` ([arşiv](seviye-testi/riza-arsivi.md)); gizlilik sayfası beş dilde güncellendi.
- Sesli okuma: nl + de 2 × 126 klip (Gemini TTS `gemini-3.1-flash-tts-preview`, ses `Iapetus`; nl'nin bir bölümü ortak havuzdan, kalanı ve de Vertex AI `tedris-pro`). 630 klibin tamamı yazıya dökülerek denetlendi: 1 bozuk klip silinip yeniden üretildi → bozuk 0; manifest 695/695 soru.
- Apps Script **v39** (önce GAS, sonra site): `scripts/apps-script/ulucamii-Kod-v39.gs` (`SITE_DILLERI`, beş dilli sözlükler; tr/fr/en çıktıları eşdeğerlik sınamasıyla birebir) + `seviye-testi-isleri.gs` (deftere SONA 8 sütun; sürüm 1 gövdesi geçişte kabul). Dağıtım `D:/tmp/gas/dagit_v39.py`: `--kuru` okumasında canlı kaynak 20 Eylül v38 dağıtımında kaydedilen kopyayla birebir aynıydı; yazım sonrası yeniden okunan kod paketle birebir aynı; paket 8 635 586 bayt, SHA-256 `2c466100343feb64…449e99c9`; 14:09'da **sürüm 39 canlıda**. Sağlık: `surum:39`, `seviyeTesti:true`, `seviyeBankaSurumu:1`, eski bayrakların tamamı aynen.
- İçerik commit'i: `9ce231e` (439 dosya; dal `dil-nl-de` → `main` hızlı ileri sarma, push `e363cb5..9ce231e`). Deploy: <https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35598056348> — build + deploy **success**.
- Yerel doğrulama: `npx astro check` 0 hata; `npm run build` 1582 sayfa; `npm run denetim` yüksek=0 orta=0 (53 eski düşük başlık seviyesi bulgusu kapsam dışı); `npm run dogrula:codex` 8/8 aşama, çıkış 0 (Codex CLI ile bağımsız koşu): birim testleri başarısız 0 (`test:seviye` 51/51, `test:kimlik` 31/31, `test:ihtida` 33/33, `test:veli-eposta` 58/58, `test:kurallar` 41/41 …), Playwright **552/552**; nl/de görsel kontrol 68 görüntü (360/768/1280, açık/koyu, açık menüler) — sayfa ve metin taşması 0; 360 px'te nl/de marka adı kırpılması giderildi (tr/fr/en değişmedi).
- Canlı doğrulama (14:25–14:40, `.codex/canli-dogrula-nlde.py`, 48/48): beş dil ana sayfa 200 + doğru `lang` + hreflang (tr, fr-BE, en, nl-BE, de-BE, x-default) + paylaşım kartları 200 + imam numarası metinde yok; `/nl/niveautest/`, `/de/einstufungstest/`, `/tr/seviye-tespit-testi/` → form sürümü 2, asgari servis 39, yer bölümü + iki isteğe bağlı onay, cevap anahtarı HTML'de yok, 126'şar klip düğmesi, ilk klipler 200 `audio/mpeg`; portal manifestleri, nl/de gizlilik ve namaz sayfaları 200; site haritasında nl=1047, de=1047 adres.
- Canlı uçtan uca deneme: Almanca form, soyad TESTOGLU, deneme adresi dernek kutusu → `ST-2026-0003`, Almanca sonuç ekranı; defterde yeni sütunlar dolu (ülke DE, ataşelik onayı «Evet», yerel görevli onayı «Hayır», ders dili `de`), Durum `katilimci-eposta-gonderildi | imam-eposta-gonderildi`; kayıt `seviye-sil` ile TEK BAŞINA silindi (`silinen: 1`), gerçek 2 kayıt yerinde. `test-temizle` kullanılmadı.
- Açık sınırlar: nl/de çevirilerinde imamın kararına bırakılan yazım noktaları (kh/ch, «sjahada», çocuk içeriklerinde u↔je, `kb04` «uw/jouw Heer» vb.) `DEVAM.md`'de; âyet/hadis anlam çevirileri «gözden geçirilecek» listesinde; UİP nl/de yazılı görselleri yok (İngilizce görsele düşer); nl/de hadis MP3'leri yok; defterde «Rıza sürümü» hücresini Sheets tarihe çeviriyor (`21.09.2026 00:00` — v38'den beri böyle, kozmetik); imam@ ve info@ kutularındaki deneme iletileri elle silinecek.
## 21 Eylül 2026 (4) — seviye testi: soruyu sesli dinleme (3 dil × 126 klip)

- Zaman: 20 Eylül 22:30 (istek) – 21 Eylül 2026 08:40 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının talimatı («sorunun üzerine tıklayınca… sesli okuma olsun. Sesleri API key havuzumuz ile üret… en iyi modelleri kullan»; 21 Eylül sabahı: «yap dediğim yapmadığın ne varsa hepsini yap»).
- Kapsam (yalnız ön yüz + statik ses; Apps Script v38 ve veri sözleşmesi değişmedi): her sorunun yanında hoparlör düğmesi; soru metnine ya da düğmeye dokununca önceden üretilmiş klip çalar, ikinci dokunuş durdurur; şık seçilince, adım değişince ve Diyanet «Dinle» düğmesi başlayınca susar. Bilgi sorularında kök + şıklar + «Bilmiyorum», okuma bölümünde **yalnız soru kökü** okunur; üretilmiş ses Arapça harf/hece/âyet OKUMAZ (Arap harfli metin klibe girmez), Kur'an/Elifbâ sesi yalnız resmî Diyanet. Klibi olmayan soruda düğme basılmaz.
- Ses üretimi: Gemini TTS (`gemini-3.1-flash-tts-preview`, ses `Iapetus`); anahtarlar yalnız ortak havuzdan, depoya yazılmadı. Ücretsiz havuzun günlük kotası dolunca üretimin ve içerik denetiminin son bölümü Vertex AI ile tamamlandı (`--vertex`, GCP `tedris-pro`, kullanıcının 7 Eylül 2026 izni; yalnız herkese açık soru metinleri gönderildi, kişisel veri yok). Her klip yazıya dökülüp metniyle karşılaştırıldı: **378 denetlendi, bozuk 0**; manifest 417/417 soru–dil eşlemesi. Metin ve ses arşivi `D:/sesli-anlatim/seviye-testi`.
- Aynı işte düzeltilenler: ses denetçisi sayıları yalnız dökümde rakama çeviriyordu → rekât sorularında doğru klibi «bozuk» gösteriyordu (iki taraf da rakama indirildi); klavye odak testi yeni sıraya göre güncellendi (hoparlör düğmesi ilk şıktan önce).
- Değişen yollar (392 dosya): `src/components/formlar/{SeviyeSoru,SeviyeTestiFormu}.astro`, `src/scripts/{seviye-form,seviye-sesli-okuma}.ts`, `src/lib/seviye-testi/sesli-okuma.ts`, `src/i18n/seviye-testi.ts`, `src/styles/seviye-testi.css`, `src/data/seviye-sesler.json`, `public/media/ses/seviye/{tr,fr,en}/*.mp3` (378 klip, 49 MB), `scripts/seviye-ses-{metin.mjs,uret.py,denetle.py}`, `package.json` (`seviye:ses`), `tests/web/seviye-testi.spec.mjs`, `docs/SEVIYE-TESTI.md` §8.
- İçerik commit'i `dc0a894` (namaz vakti veri commit'i `a61dfb1` üstüne alındı); Release kullanılmadı. [Pages 35568925725](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35568925725) başarılı (08:33).
- Testler (yayın öncesi, yerel, 08:12–08:30): `npm run dogrula:codex` çıkış 0 — design:check, check (0 hata), dogrula (980 sayfa), **test:web 532/532**, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ.
- Canlı doğrulama (08:38, **gönderimsiz**): üç dil sayfası HTTP 200, her birinde 139 hoparlör düğmesi; 3 × 126 klip adresi HTTP 200 (`audio/mp3`); gerçek tarayıcıda (Chromium) düğmeye tıklayınca `aria-pressed="true"` ve klip isteği 206 (tr/fr/en); iki klibin canlı SHA-256 özeti yerelle aynı (`03ed7024eb642e4e…`, `d7452ad44612525b…`).
- Açık sınırlar: klipler yapay sestir (Türkçe/Fransızca/İngilizce soru metni); soru metni değişirse kimlik değişir ve klip yeniden üretilmelidir (`docs/SEVIYE-TESTI.md` §8 sırası); ücretsiz havuz günde sınırlı klip üretir — toplu yenilemede `--vertex`.

## 21 Eylül 2026 (3) — dinleme sayfaları `/e/<kod>/` (ders kitabı kare kodlarının hedefi)

- Zaman: 21 Eylül 2026 03:10 – 05:05 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının kişiye özel ders kitabı talimatı («içeriğinde kare kodlar olsun, sesli dinlemeler için kullanılabilsin… full otonom ilerle»); kare kodların çalışması için sayfaların yayında olması gerekir.
- Kapsam: 74 kod → 74 Fransızca sayfa (`noindex, nofollow`, site haritası dışı, kanonik adres yok). 14 sûre âyet âyet (71 satır sesi) + bütün kayıt; Sübhâneke, Tahiyyât, Salli, Bârik, Rabbenâ (2), Kunut (2), ezan, kamet, ezan duası; Elifbâ ve tecvid aşamaları (843 öge); `test` kodu seviye testine yönlendirir. Sayfalarda **kişisel veri yok**; kod kişiyi değil içeriği adlandırır. Kaynak proje özeldir ve depoya girmez.
- Ses kaynakları (yalnız resmî Diyanet; hepsi yerelde): mushaf kaydı Hafız Osman Şahin (`webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/ar_OsmanSahin/`), Namaz Portalı (`namaz.diyanet.gov.tr`), Elifbâ portalı (`kuran.diyanet.gov.tr/elifba`). Her dosyanın kaynak adresi ve SHA-256 özeti: `docs/dinleme-ses-kaynaklari.json`.
- Aynı yayında mevcut sistemde düzeltilen: `public/media/ses/dualar/{subhaneke,tahiyyat,sallibarik}.mp3` dosyalarının kaynağı belgesizdi → resmî Namaz Portalı kayıtlarıyla değiştirildi (öğrenci ezber sayfası bu dosyaları zamanlamasız, bütün olarak çalar; süreler 17,4→13,9 / 41,0→33,0 / 57,5→40,1 sn).
- Yayından ÖNCE yakalanan üretim kusuru: üreteç tek âyetin bölümlerine (Âyetü'l-Kürsî) satır numarasını âyet numarası sanıp Bakara 1–2'nin sesini bağlamıştı; satır sesi artık yalnız tam sûrede ve sûre boyunca tek kayıttan bağlanır, `tests/web/ecouter.spec.mjs` içindeki bekçi testi tekrarını engeller. Harf sayfalarında portalın noktasız yazdığı yâ' düşüyordu (27/28) → 28/28, kitap sırası.
- Değişen yollar (720 dosya): `src/pages/e/[kod].astro`, `src/lib/ecouter.ts`, `src/scripts/ecouter.ts`, `src/styles/ecouter.css`, `src/data/ecouter.json`, `tests/web/ecouter.spec.mjs`, `docs/DINLEME-SAYFALARI.md`, `docs/dinleme-ses-kaynaklari.json`, `public/media/ses/ayet/` (71), `public/media/ses/dualar/` (9 yeni + 3 değişen), `public/media/ses/elifba/k/` (≈ 23 MB).
- İçerik commit'i `2d09f07`; Release kullanılmadı. [Pages 35551772695](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35551772695) başarılı.
- Testler (yayın öncesi, yerel): `npm run check` 0 hata / 0 uyarı; `npm run build` 980 sayfa; `tests/web/ecouter.spec.mjs` 26/26; tam `playwright test` 530 geçti / 2 kaldı — kalan ikisi (`seviye-testi.spec.mjs:481`, odak beklentisi) çalışma ağacında duran, **bu yayına girmeyen** «soruyu sesli dinleme» çalışmasına ait; `npm run dogrula:codex` içindeki tek kırmızı da aynı çalışmanın ses listesi (`seviye-sesler.json` güncel değil — klip üretimi sürüyor). Öteki kapılar GEÇTİ.
- Canlı doğrulama: 74 sayfa + 884 ses adresi HTTP 200 (`text/html` / `audio/mp3`), bilinmeyen kod 404, `sitemap-0.xml` içinde `/e/` adresi 0; iki dosyanın canlı SHA-256 özeti yerelle aynı (`64c76f36d86811ed…`, `9818f1ad7a4e1682…`); gerçek tarayıcıda (390 px) `/e/fatiha/` 2. âyet ve `/e/lettres-7/` yâ' **gerçekten çaldı** (`currentTime` ilerledi, `aria-pressed="true"`), konsol hatası 0.
- Açık sınırlar: Âmentü, şehâdet, tevhid, yemek/uyku duaları, tesbihat ve kısa namaz formülleri için resmî Diyanet kaydı bulunamadı → kare kodsuz (kitapta «imamla tekrarlayın»); basılmış kitaptaki kod kalıcı adrestir — yayımlanmış kod silinmez, başka içeriğe bağlanmaz.

## 21 Eylül 2026 (2) — seviye testi: tek e-posta, telefon biçimi, titreme ve iniş düzeltmeleri

- Zaman: 21 Eylül 2026 00:25 – 01:10 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık talimatı («Bunları düzelt, yayınla»).
- İlk gerçek başvuru aynı gece geldi (`ST-2026-0001`, 00:02; iki e-posta da gönderildi) — kullanıcı geri bildirimi bu başvurunun ardından verildi. Kayıtta kişisel veri tutulmaz.
- Kapsam (yalnız ön yüz; Apps Script v38 değişmedi): (1) e-posta TEK kez yazılır, yaygın alan adı yazım hatasında «Şunu mu demek istediniz…?» önerisi (TR/FR/EN); (2) telefon alanları yalnız rakam kabul eder ve yazarken «+32 470 12 34 56» biçimine girer — ortak çekirdekte, seviye + kayıt + ihtida formlarında; gövdeye giden değer yine boşluksuz E.164; (3) **titreme**: alt şerit yapışınca içindeki taslak notu gizleniyor, şeridin boyu 110↔71 px oynuyor ve formun sonundaki ~40 px'lik bantta 1,2 sn'de 34 yapış/çöz döngüsü kuruluyordu → not şeridin dışına alındı, aynı ölçüm 1; (4) kısa ekranda (ör. 1366×640) adıma inişte adım paneli + alt şerit içeriğe 70 px bırakıyordu → yer < 240 px ise doğrudan bölüme inilir (ortak adım motoru; ihtida formu da yararlanır); (5) koyu temada atlanan basamağın kesik çizgisi okunur oldu.
- Değişen dosyalar: `src/scripts/telefon-bicim.ts` (yeni), `src/scripts/form-cekirdek.ts`, `src/scripts/form-adimlari.ts`, `src/scripts/seviye-form.ts`, `src/components/formlar/SeviyeTestiFormu.astro`, `src/i18n/seviye-testi.ts`, `src/styles/seviye-testi.css`, `tests/telefon-bicim.test.mjs` (yeni, 6 test), `tests/web/seviye-testi.spec.mjs` (+3 senaryo: iniş, titreme, e-posta/telefon), `package.json`, `docs/SEVIYE-TESTI.md`.
- İçerik commit'i `3f5ed97`; Release kullanılmadı. [Pages 35543472762](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35543472762) başarılı.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` çıkış 0 — **test:web 504/504**, öteki bütün kapılar GEÇTİ; `npm run test:seviye` 50/50 + döküm güncel; kayıt ve ihtida form testleri 116/116 (telefon biçimlendirici bağlıyken).
- Canlı doğrulama (gerçek tarayıcı, 1366×640, **gönderimsiz — POST kesildi**), üç dilde: tekrar alanı yok (0), öneri görünür ve `ornek@gmial.com` → `ornek@gmail.com` düzeliyor, `04x70-12 34ab56` → `+32 470 12 34 56`, kararsız bantta `data-yapisik` değişimi **0**, sayfa hatası yok.
- Açık sınırlar: ek animasyon eklenmedi (öncelik hatalardaydı); soruyu sesli dinleme ayrı yayın olarak hazırlanıyor (bkz. sonraki kayıt).

## 21 Eylül 2026 — seviye testi: etkileşim ve hareket katmanı

- Zaman: 20 Eylül 23:50 – 21 Eylül 2026 00:20 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık talimatı («ön izleme göstermene gerek yok… ne gerekiyorsa yap, yayınla»).
- Kapsam (yalnız ön yüz; Apps Script v38 değişmedi, veri sözleşmesi aynı): seçim anı (mürekkep dolumu, çizilen onay işareti, «cevaplandı» rozeti; «Bilmiyorum» aynı onayı alır ve artık soluk gösterilmez), otomatik ilerleme + `role="switch"` anahtarı (odak taşımaz, klavye seçiminde devreye girmez), masaüstünde 1–4 / 0 kısayolları, yapışkan alt şerit (adım sayacı, ilerleme çubuğu, kalan süre, tek `aria-live` bölgesinde eşik cümleleri), Kur'an merdiveni (kilim baklavası düğümleri, basamak tamamlanınca kıvılcım, atlanan basamak kesik çizgili), Arapça ibarelerde mürekkep belirişi, ses çalarken ekolayzır, adım geçiş hareketi, «Teste başla» / «Kaldığım yerden devam et», sonuç ekranında sırayla dolan çubuklar + 1,8 sn'lik kilim konfetisi. İstemcide doğruluk bilgisi yoktur; hiçbir hareket doğru/yanlış ima etmez. `prefers-reduced-motion` altında tümü kapalı; betik hata verse de form aynen çalışır.
- Değişen dosyalar: `src/scripts/seviye-etkilesim.ts` (yeni), `src/scripts/seviye-form.ts`, `src/scripts/form-adimlari.ts` (geriye uyumlu tek ek: `form:adim` olayı), `src/styles/seviye-testi.css`, `src/i18n/seviye-testi.ts` (TR/FR/EN 14 metin), `src/components/formlar/SeviyeTestiFormu.astro`, `tests/web/seviye-testi.spec.mjs` (+9 senaryo).
- İçerik commit'i `cf34fd0`; Release kullanılmadı. [Pages 35540452564](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35540452564) başarılı.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` çıkış 0 — design:check, check (0 hata / 0 uyarı), dogrula, **test:web 500/500**, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ; `npm run test:seviye` 44/44 + döküm güncel; `npm run denetim` yüksek/orta bulgu yok.
- Canlı doğrulama (gerçek tarayıcı, 390 px dokunmatik bağlam, **gönderimsiz — POST kesildi**): üç dilde «Teste başla» düğmesi, merdiven, anahtar ve alt şerit yerinde; şık seçilince `data-cevaplandi` işaretlendi; şerit metinleri yerelleşmiş («Bu adım: 1 / 33 · yaklaşık 28 dk kaldı» / «Cette étape : 1 / 33 · environ 28 min restantes» / «This step: 1 / 33 · about 28 min left»); sayfa hatası yok; sayfa kaynağında `"dogru"` izi 0.
- Açık sınırlar: kaydırırken görünür kalan küçük merdiven sürümü yapılmadı (isteğe bağlıydı); 49 düşük «başlık seviyesi atlanıyor» bulgusu eski sayfalarda duruyor (bu yayının kapsamı dışında).

## 20 Eylül 2026 — yetişkinler için Kur'an ve dinî bilgi seviye tespit testi (Apps Script v38)

- Zaman: 20 Eylül 2026, 21:55–22:10 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık yayın onayı (aynı oturumda, soru-yanıtla teyit edildi).
- Kapsam: üç dilli test sayfası (`/tr/seviye-tespit-testi/`, `/fr/test-de-niveau/`, `/en/level-assessment/`), «Eğitim» menüsü + ihtida sayfasında «Nereden başlamalıyım?» kartı + Kur'an kursu sayfasında yetişkin satırı; soru bankası sürüm 1 (112 madde + 14 ezber + 13 öz beyan, üç bağımsız doğrulamadan geçti); sunucu yetkili puanlama; defter + iki e-posta (rapor yalnız `imam@ulucamii.be`, yedek kanal kapalı); panelde «Seviye testleri» sekmesi; gizlilik politikası ×3 yeni bölüm; TR + FR duyuru. Ayrıntı: [Seviye testi](SEVIYE-TESTI.md).
- Aynı yayında mevcut sistemde düzeltilenler: `panelYetkiTamam` gömülü yer tutucuyu anahtar sayıyordu; `ihtidaV2AnahtarBul` önbellek kesintisinde başvuruyu düşürüyordu; 20 KiB gövde sınırı bayt yerine UTF-16 birimi sayıyordu; form çekirdeği iç içe koşullu blokları yeniden açamıyordu; Elifbâ şedde metinleri NFC değildi (veri + aktarım betiği + test kapısı); ihtida başarı panelinde koyu tema kontrastı 2:1 → 6,4:1; panelde yetki hatasında asılı kalan not; ihtida formunda hiç görünmeyen ölü ok işaretlemesi.
- Aşama 1 — Apps Script: `D:/tmp/gas/dagit_v38.py` (`--kuru` → canlı editör kaynağı yerel v37 derlemesiyle bayt bayt aynı, dernek hesabı doğrulandı; sonra `GAS_HEADLESS=1`). Paket `.codex/cikti/gas/ulucamii-v38.gs` 8 542 627 bayt (LF), SHA-256 `eb7befcac583b577e7ad20d23c3eac867632e27da7ef8fca8be137efba4453c6`; yeniden okunan kaynak paketle birebir aynı; **mevcut dağıtıma yeni sürüm** (adres değişmedi). Yerel yedek `D:/tmp/gas/v38-oncesi-20260920-215735-389322.gs`. Sağlık: `surum:38 · seviyeTesti:true · seviyeBankaSurumu:1`; `kayitKimlik`, `kayitImza`, `kayitBelgeleriZorunlu`, `kayitDuzelt`, `defterCeviri`, `ihtidaPaketHazir`, `ihtidaDefteriHazir`, `ihtidaCamiSecimi` aynen `true`.
- Aşama 2 — site: içerik commit'i `b4140913882b68877b30522ca0419bb14e37b80c` (`main`'e ileri sarma). [Pages 35534070441](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35534070441) başarılı. Release kullanılmadı.
- Aşama 3 — canlı doğrulama: üç adres + `/admin/seviye-panel.js` HTTP 200; `hreflang` tr/fr/en/x-default; sayfa kaynağında `"dogru"` izi 0; `data-asgari-servis-surumu="38"`; ana sayfa menüsü ve ihtida kartı canlı. İki gerçek deneme (soyad TESTOGLU, deneme adresi dernek kutusu): `ST-2026-0001` (FR) ve `ST-2026-0002` (TR) — sonuç ekranı K3 + «B» programı (beklenen), defter damgası ikisinde de `katilimci-eposta-gonderildi | imam-eposta-gonderildi`; info@ gelen kutusunda **yalnız** iki katılımcı iletisi (doğru dilde, `Reply-To: imam@ulucamii.be`), hoca raporu info@'ya düşmedi; `liste` yanıtında `seviyeler` 29 sütun, gizli sütun (Cevaplar, Gönderim anahtarı, Not) yok; `seviye-detay` raporu döndürdü; gömülü yer tutucu anahtar canlıda `yetki` ile reddedildi.
- Temizlik: iki deneme kaydı `seviye-sil` ile **tek tek** silindi (`silinen:1` ×2); seviye defteri 0 satır; kayıt defteri 25, ihtida defteri 5 satır — dokunulmadı. `test-temizle` bilerek kullanılmadı (öteki defterlere de dokunur). Açık: `imam@` kutusundaki iki deneme raporu ile info@ kutusundaki iki deneme iletisi elle silinecek; ilk gerçek katılımcı yeniden `ST-2026-0001` numarasını alır.
- Aşama 4 — duyuru: `src/content/duyurular/{tr,fr}/seviye-tespit-testi-2026.md` taslaktan çıkarıldı (öne çıkan, 25 Ekim 2026'ya kadar); commit `a6e6f1c0a77cb33b2a0d446045082256b99a0b98`; [Pages 35534574905](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35534574905) başarılı; `/tr/duyurular/seviye-tespit-testi-2026/` ve `/fr/annonces/seviye-tespit-testi-2026/` HTTP 200, ana sayfa vitrininde görünüyor.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` — design:check, check (0 hata), dogrula, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ; test:web 476 geçti + 6 beklenen görsel taban çizgisi farkı (ihtida kartı) güncellendi → `design-visual` 24/24; duyurudan sonra ana sayfa taban çizgileri de güncellendi (24/24). `npm run test:seviye` 44/44 + döküm güncel; `seviye-testi` + `seviye-panel` + `ihtida` tarayıcı testleri 62/62; `npm run denetim` yüksek/orta bulgu yok (49 düşük, hepsi eski sayfalarda).
- Açık sınırlar: katılımcıdan ses kaydı alınmaz — akıcılık/mahreç ilk yüz yüze derste teyit edilir; duyurunun EN sürümü, Facebook/afiş kapsam dışı; cevap anahtarı herkese açık depoda durur (sayfa HTML'ine basılmaz).

## 20 Eylül 2026 — örnek defterler ve ders kitapları (kalıcı materyaller)

- Zaman: 20 Eylül 2026, 11:18–11:25 (Europe/Brussels, CEST). Durum: yayımlandı ve canlı doğrulandı. Kullanıcının açık yayın talimatı.
- Kapsam: «Ders Materyalleri → Kalıcı materyaller» bölümüne beş kayıt. İki PDF depoda (`public/media/materyaller/`): `Ornek-Mesk-Defteri-2026-2027.pdf` (64 s., 180 768 bayt) ve `Ornek-Ders-ve-Iletisim-Defteri-2026-2027.pdf` (324 s., boş şablon, 1 476 520 bayt). Üç ders kitabı **yalnız resmî ücretsiz kaynağa bağlantıyla**: Camiye Gidiyorum 1 ve 2 → DİTİB Akademi (`/cg1/`, `/cg2/`), Temel Dinî Bilgiler → `dijital.diyanet.gov.tr` e-kitap 4218 (bağlantılar yayından önce HTTP 200).
- Değişen dosyalar: `src/content/materyaller/{ornek-mesk-defteri-2026-2027,ornek-ders-ve-iletisim-defteri-2026-2027,camiye-gidiyorum-1,camiye-gidiyorum-2,temel-dini-bilgiler}.md`; yeni materyal türleri `kitap` ve `defter` — `src/content.config.ts`, `src/sayfalar/DersMateryalleri.astro` (TR/FR/EN etiket), `public/admin/icerik/config.yml` birlikte.
- İçerik commit'i `e822d0110c3cc9b2d1e286e92c1ee7cd2bce4871`; Release kullanılmadı (dosyalar ≤ 15 MB). [Pages 35501947723](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35501947723): build ve deploy başarılı.
- Testler: `npm run check` 0 hata / 0 uyarı (259 dosya); `npm run dogrula` çıkış 0, başarısız test yok; `npm run denetim:cms` çıkış 0. Günlükler: `D:/tmp/materyal-{check,dogrula,cms}.log`.
- Canlı doğrulama: `/tr/ders-materyalleri/`, `/fr/supports-de-cours/`, `/en/lesson-materials/` HTTP 200, beş kayıt üç dilde görünüyor; iki PDF HTTP 200 `application/pdf`, indirilen dosyaların SHA-256'sı kaynakla eşleşti (`69588ecd99b7e98e…`, `b754fad8dac498b1…`). Sayfada din görevlisi hattı: 0.
- Kişisel veri taraması (yayından önce): iki PDF'te 98 öğrenci/veli/hoca ad sözcüğü, `UC-…` kayıt numarası, e-posta ve telefon arandı — yalnız cami hattı, `info@` ve `imam@ulucamii.be` var; ad ve kayıt numarası yok.
- Açık sınır — **kitap PDF'leri yüklenmedi**: kullanıcı Camiye Gidiyorum 1-2 PDF'lerinin de yayımlanmasını istedi. Yerel dosyalar incelendi: Türkçe kaynaklar DİTİB Akademi çevrim içi okuyucusundan alınmış sayfa görüntüleri (jsPDF, metin katmanı yok); kitaplar ISBN'li ve satışta, içlerinde DİTİB'e lisanslı Shutterstock fotoğrafları var; Fransızca sürümler kursun kendi çevirisi olduğu hâlde kapakta «DITIB | DITIB Verlag — VERSION FRANÇAISE», 2. kitabın künyesinde «Fondation Diyanet de Belgique» ibaresi taşıyor. Bu depo herkese açık ve sitenin kendisi olduğundan yükleme kullanıcının teyidine bırakıldı; 29 Ağustos 2026 kararı («kitap PDF'i dağıtılmaz — telif») yürürlükte kaldı. Kaynak proje kaydı: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-09-20-ORNEK-DEFTERLER-VE-KITAPLAR.md`.
- OneDrive: kapsam dışı (örnek defterlerin tek kopyası D sürücüsündedir; 19 Eylül kararı).

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
