# Dinleme sayfaları — `/e/<kod>/`

21 Eylül 2026. Basılı **Fransızca yetişkin ders kitabındaki** kare kodların açtığı sayfalar.
Kitap projesi ayrıdır ve **özeldir**: `D:\ulu-camii-yetiskin-egitimi` (kişisel veri içerir, bu
depoya girmez). Burada yalnız herkese açık dinleme yüzeyi ve verisi durur.

## 1. Amaç

Kitabı okuyan yetişkin, sayfadaki kare kodu telefonuyla okutur ve `https://ulucamii.be/e/<kod>/`
açılır. Bu kalıcı karekod sayfası Fransızcadır; aynı ders Türkçe, İngilizce, Felemenkçe ve Almanca arayüzle de açılır.

- Rotalar: `src/pages/e/[kod].astro` (kalıcı Fransızca QR) ve `src/pages/[lang]/audio/[kod].astro` (TR/EN/NL/DE); ortak görünüm `src/components/SesliDers.astro`.
- 21 Eylül 2026 düzeltmesi: `/e/` herkese açık, aramalı ders dizinidir. Beş dildeki eğitim
  menüsü **Dinimi Öğreniyorum** eğitim merkezine gider; oradan bütün derslere seçilen dilde erişilir.
  Başlık, oynatıcı, hata mesajı ve ses bağlantıları beş dilde yerelleştirilir (`src/i18n/dinleme.ts`).
  Kitaptan gelen Fransızca çeviri yazı ve anlamlar `lang="fr"` ile ve görünür açıklamayla korunur;
  yeni Kur’an meali üretilmez. Seçilen dilde Diyanet kitapları ayrıca sunulur (`src/i18n/egitim-kitaplari.ts`).
  Kitap, karekod veya üyelik gerekmez. 73 ders indekslenebilir ve site haritasındadır;
  yalnız seviye testine yönlendiren `/e/test/` noindex kalır. Kalıcı 74 QR adresi korunur.
- 73 ders × 5 dil = 365 ders sayfası. Dil menüsü ve hreflang aynı dersin karşılığına gider;
  Fransızca karşılık daima `/e/<kod>/` kalır. Diğer dillerde geri bağlantısı eğitim merkezinin
  sesli ders bölümüne, Fransızcada `/e/` dizinine döner. Eski eğitim merkezi adresleri değişmez.
- Hızlı ses geçişinde eski `play()` isteğinin gecikmiş reddi yeni sesi durduramaz;
  oynatma sürümü kontrol edilir. Arama yerelleştirilmiş başlık, eski başlık ve kodu birlikte tarar.
- Ek regresyonlar: `tests/web/egitim-diller.spec.mjs`; 365 ders adresi/ses eşliği, beş dilde
  yerel hata mesajı, tema/erişilebilirlik, JavaScript kapalıyken sesler ve gecikmiş oynatma hatası.
- Bilinmeyen kod → normal 404 (yalnız statik yollar üretilir).
- Sitenin olağan başlığı, alt bilgisi ve Kilim Kartografyası jetonları kullanılır; içerik sütunu
  dardır (en çok 40 rem).

## 2. Veri sözleşmesi — `src/data/ecouter.json`

Türler ve bütün Fransızca arayüz metinleri: `src/lib/ecouter.ts`.

```json
{ "surum": 1, "kodlar": {
  "<kod>": {
    "baslik": "Sourate al-Fâtiḥa",
    "altbaslik": "L’Ouverture · 7 versets",
    "kaynak": "Récitation officielle de la Diyanet",
    "tam":      { "ses": "/media/ses/sureler/fatiha.mp3", "etiket": "Écouter la sourate en entier" },
    "satirlar": [ { "no": 1, "ar": "…", "okunus": "…", "fr": "…", "ses": "/media/ses/ayet/1-1.mp3" } ],
    "ogeler":   [ { "ar": "بَ", "okunus": "ba", "ses": "/media/ses/elifba/ustun/be.mp3" } ],
    "yonlendir": "/fr/test-de-niveau/"
  } } }
```

- `tam`, `satirlar`, `ogeler`, `yonlendir` **isteğe bağlıdır**; bir satırda `ses` yoksa orada çal
  düğmesi hiç basılmaz, `ar` / `okunus` / `fr` de tek tek eksik olabilir. Sayfa hepsine dayanıklıdır.
- `yonlendir` doluysa sayfa yalnız kısa bir yönlendirme kartıdır (düğme + `meta http-equiv="refresh"`,
  gecikme 0 — gecikmeli yenileme WCAG 2.2.1'e takılır).
- `satirlar` → numara, büyük Arapça, çeviri yazı, Fransızca anlam. `ogeler` → sağdan sola dokunmatik
  kare ızgarası (Elifbâ heceleri).
- Çeviri yazı şeması kitapla aynıdır: `motor/YAZIM-KILAVUZU.md` §4 (Fransız okura göre; a/i/ou, â/î/oû,
  ḥ ṣ ḍ ṭ ẓ ʿ).
- Arapça her zaman `class="arabic" lang="ar" dir="rtl"` ile basılır. **`.arabic-ana` kullanılmaz** —
  o alt küme ana sayfanın sabit satırları içindir ve Kur'an işaretlerini taşımaz.

### Dosya nereden gelir

`ecouter.json` **elle yazılmaz**: kitap projesindeki `icerik/sesler.json` dosyasının kişisel veri
içermeyen kopyasından bir betikle üretilir (`D:\ulu-camii-yetiskin-egitimi`). Kurallar:

- Dosyaya **hiçbir kişisel veri girmez**: ad, başvuru numarası (`ST-…`), e-posta, telefon, adres yok.
  Kod, kişiyi değil **içeriği** adlandırır (`fatiha`, `fatha`, `test`).
- **Ses kaynağı yalnız resmî Diyanet'tir** (AGENTS.md kalıcı kuralı): `public/media/ses/…` altındaki
  yerel kayıtlar, Diyanet Namaz Portalı ve Elifbâ portalı. Üçüncü taraf kıraat ya da üretilmiş ses
  (TTS) Arapça okumaz. Fransızca meâl kaynağı künyede adıyla yazılır.
- `ses` yolları `public/` altında **gerçekten var olmalıdır**; olmayan yol yerine alanı boş bırakın.
- **Satır sesi yalnız tam sûrelerde bağlanır** (satır no = âyet no) ve sûre boyunca **tek kayıttan** gelir:
  `public/media/ses/ayet/<sure>-<ayet>.mp3`, resmî Diyanet mushaf kaydı (Hafız Osman Şahin,
  `webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/ar_OsmanSahin/<sure>_<ayet>.mp3`). Tek âyetin bölümlere ayrıldığı
  metinlerde (Âyetü'l-Kürsî, Âmene'r-Resûlü, Rabbenâ) ve dualarda satır numarası âyet numarası **değildir**; oralarda
  yalnız bütün kayıt (`tam`) çalar. 21 Eylül 2026'da bu ayrım gözden kaçmış, Âyetü'l-Kürsî'nin ilk iki bölümüne Bakara 1–2
  bağlanmıştı; yayından önce yakalandı, `tests/web/ecouter.spec.mjs` içindeki bekçi testi tekrarını engeller.
- Harf dersi sayfaları (`lettres-1` … `lettres-7`) kitaptaki sırayı izler («kâğıt = ses»); portalın noktasız yazdığı
  yâ' (`ى`) da gruba dahildir — 28 harfin 28'i.
- Her ses dosyasının kaynağı ve özeti `docs/dinleme-ses-kaynaklari.json` içinde durur (site yolu → kaynak adresi + sha256).

## 3. Sayfanın davranışı

Betik: `src/scripts/ecouter.ts` · biçem: `src/styles/ecouter.css` (ad alanı `.ec-`).

- Tek paylaşılan `Audio` (`preload="none"`, DOM'a eklenmez): iki ses asla üst üste binmez.
- `tam` için büyük birincil düğme: çal/duraklat, ilerleme çubuğu, geçen/toplam süre. Düğmenin
  **etiketi değişmez** (düzen kaymasın); durumu simge ve `aria-pressed` taşır.
- Satır/kare: dokunuş o parçayı çalar, çalan parça vurgulanır (`data-caliyor` + `aria-current`) ve
  `scrollIntoView` ile görünür kalır.
- Kipler: **hız** 0,75× / 1× ve **« Répéter »** (parça 3 kez çalınır, aralar klibin kendi uzunluğu
  kadar susar — dinle, sonra sesli tekrarla) `localStorage`'da saklanır (`ulucamii:ecouter:v1`,
  okuma/yazma `try/catch` içinde). **« Lecture continue »** parçaları sırayla oynatır; iki ya da daha
  çok sesli parça varsa gösterilir.
- Erişilebilirlik: gerçek `<button>`ler, görünür odak, `aria-pressed` / `aria-current`, tek
  `role="status"` bölgesi, hareket azaltmada anî kaydırma, açık/koyu tema (renkler yalnız jetonlardan
  geldiği için iki koyu tema kanalı da ek kural istemez), 360 pikselde yatay taşma yok.
- Betiksiz erişim: `html:not(.js)` düğmeleri gizler, `<noscript>` bloğu `<audio controls>` ve her ses
  için düz bağlantı verir.

## 4. Sınama

```powershell
npm run check                 # tip kontrolü
npm run build                 # statik çıktı (dist/)
npm run test:web -- tests/web/ecouter.spec.mjs
```

`tests/web/ecouter.spec.mjs` Playwright ile: örnek kodların açılışı, satır seslerinin yerelde durduğu, satır sesi olmayan metnin yalnız büyük düğmeyle çalıştığı, herkese açık ders dizini, arama, canonical ve site haritası,
büyük düğmenin çal/duraklat durumu, karelerin çalması ve devri, hız/tekrar tercihlerinin
kalıcılığı, üç kez tekrar, kesintisiz oynatma, ses hatası iletisi, yönlendirme kodu, bilinmeyen kodda
404, axe (açık + iki koyu tema kanalı) ve 360 piksel taşma denetimi. Dış ağ kesilir; gerçek ses
çözücüsüne bağlı kalmamak için `HTMLMediaElement.prototype.play` taklit edilir.

Görsel değişiklikte ayrıca `npm run onizle` ile `/e/fatiha/` ve `/e/fatha/` telefon ve masaüstü
ölçülerinde gözle incelenir.

## 5. Üretim

`ecouter.json`, ses kopyaları ve `docs/dinleme-ses-kaynaklari.json` kitap projesindeki
`node motor/site-veri-uret.mjs` ile üretilir (`--kuru` yalnız sayar). Yalnız kitapta gerçekten kullanılan kodlar
yayımlanır. Kod kümesi değiştiğinde: üret → `npm run check` → `npm run build` → `ecouter.spec.mjs` → yayın kaydı
(`docs/YAYIN-KAYITLARI.md`). Basılmış bir kitaptaki kare kod **kalıcı adrestir**: yayımlanmış bir kod silinmez ve
başka içeriğe bağlanmaz.

## 6. Ses eşleştirme düzeltmesi ve tekrarını önleme — 21 Eylül 2026

- Kök hata: `scripts/indir-elifba-ustun.ps1`, üstün klasörüne `harfler/sesleri`
  kayıtlarını indiriyordu. Kaynak `fetha/fetha` olarak düzeltildi; gerçek HTML
  `data-sound` kimlikleri kullanıldı (kalın harflerde 25–28 ve 30–33).
- 787 Elifbâ ses yolu (759 benzersiz resmî URL) Diyanet'ten alınarak karşılaştırıldı.
  28 fetha ve 28 yalın harf dosyası resmî asıllarıyla yenilendi. Esre ve ötre
  dahil 41 bölümün 787 metin–ses bağı resmî HTML ile doğrulandı.
- `e09` kısa–uzun karşılaştırmasında aynı resmî ses iki heceyi birlikte okur.
  Artık iki hece tek düğmede görünür (56 ayrı kutu yerine 28 hece çifti).
- `scripts/elifba-ses-denetle.py` resmî kaydın baytlarıyla yereli karşılaştırır;
  varsayılan salt okunur, `--onar` önce yedekleyerek düzeltir. Denetimin indirme
  önbelleği `.codex/elifba-ses-denetimi/resmi/` altındadır; yeni tarihli canlı kaynak
  kontrolü için `--tazele` kullanılır. Raporlar depoya girmez.
- `tests/fixtures/elifba-resmi-eslesmeler.json`: 21 Eylül'de resmî HTML ve MP3'lerden
  doğrulanmış 112 harf/hareke eşleştirmesi. `npm run test:dinleme`, bunları,
  tüm ses dosyalarının varlığını ve manifest özetlerini sınar; ana kalite kapısına dahildir.
- Kaynak kitap projesinde `04_map_existing_local.py` artık resmî MP3 ile eşitlik
  arar; `05_build_catalog.py` doğrulanmamış yerel eşleştirmeyi reddeder.
  `motor/site-veri-uret.mjs` mevcut ses özetlerini doğrular, birlikte okunan
  heceleri birleştirir ve yayımlanmış QR kodunun silinmesini engeller.
- Veri sürümü 2: çalar `?v=2` kullanarak önceki yanlış kaydın tarayıcı önbelleğine
  takılmasını önler. PDF değiştirilmez; eski karekodlar yeni sesleri açar.
- Dijital doğrulama, bütün kayıtların bir kıraat hocası tarafından tek tek dinlenmiş
  olduğu anlamına gelmez. Bu çalışmada kaynak/metin/bayt ve tarayıcı oynatma doğrulandı.

## 7. Yeni Müslümanlar için eğitim merkezi

- Ana yüzey `src/sayfalar/MuhtediEgitimi.astro`; yollar `src/i18n/ui.ts` içinde
  `muhtediEgitimi`. TR `/tr/muhtedi-egitimi/`, FR `/fr/formation-nouveaux-musulmans/`,
  EN `/en/learning-new-muslims/`, NL `/nl/onderwijs-nieuwe-moslims/`, DE `/de/unterricht-neue-muslime/`.
- Beş dilde sekiz öğrenme bölümü: İslâm/şehâdet, iman, temizlik, namaz, Elifbâ,
  sûre/dua, diğer ibadetler, siyer/ahlâk. Her bölümde açıklama, üç çalışma konusu,
  uygulama ve kaynak/ders bağlantısı bulunur. Çalışma rutini, dört SSS ve dört resmî
  Fransızca kaynak kitap tamamlar. Bu, Ulu Camii'nin çalışma önerisidir; resmî
  sertifikalı müfredat ya da bireysel fetva hizmeti olarak sunulmaz.
- Çeviriler `src/i18n/egitim.ts`, `src/i18n/egitim-rehberi.ts`; ortak 73 derslik
  dizin `src/components/SesliDersDizini.astro`. Sesli ders başlıkları FR, tilavetler AR;
  bütün derslerin beş dile çevrildiği izlenimi verilmez.
- `src/scripts/muhtedi-egitimi.ts`: sekiz isteğe bağlı çalışma işareti yalnız
  `localStorage['ulucamii.egitim.v1']` altında sabit bölüm kimlikleriyle tutulur.
  Diller arasında aynıdır. Hesap, kişisel bilgi, yeni ağ isteği veya sunucu kaydı yoktur.
  Silme yalnız bu anahtarı temizler. Depolama engelliyse geçici çalışır ve bunu bildirir.
  JavaScript kapalıyken takip gizlenir; yerel `<details>` ve bütün dersler çalışır.
- Kaynak kontrolü 21 Eylül 2026: Diyanet yetişkin temel öğretim programı 2026
  (`egitimhizmetleri.diyanet.gov.tr/sayfa/489`), resmî Fransızca PDF'ler 3624
  (İslâm nedir), 4194 (Müslüman kimdir), 513 (resimli ibadet rehberi), 3623
  (Hz. Muhammed). Dört PDF indirilip içerikleri kontrol edildi; kitaplar yeniden
  barındırılmaz, resmî indirme adreslerine bağlanır. Bu kaynaklar sayfada görünürdür.
- Platform testleri: beş dil ve menü, 8 bölüm/4 kaynak/73 ders, arama, cihazda kalıcılık,
  dil geçişi, seçici sıfırlama, engelli depolama, JavaScript olmadan erişim,
  klavye, açık/koyu axe ve mobil taşma. Gerçek telefon veya Safari sınaması ayrıdır.
