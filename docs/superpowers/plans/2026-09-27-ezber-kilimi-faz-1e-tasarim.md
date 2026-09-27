# Ezber Kilimi Faz 1e — Tasarım yönü, yazı tipleri ve taslaklar

**Tarih:** 27 Eylül 2026. **Karar yetkisi:** Rıdvan devretti («bütün yetki ve karar sende, full otonom ilerle»);
yön sayfası ve soru turu bu yüzden açılmadı, bütün seçimler aşağıda gerekçesiyle kayıtlıdır. Rıdvan dönünce
«Rıdvan'ın seçebilecekleri» bölümündeki seçeneklerden birini isteyebilir.

**Şartname:** [Ana plan](2026-09-26-ezber-kilimi-ana-plan.md) §4 Faz 1e; platform kararları
[`docs/EGITIM-PLATFORMU.md`](../../EGITIM-PLATFORMU.md); ürün bağlamı [`egitim/PRODUCT.md`](../../../egitim/PRODUCT.md).

**Çıktılar:**

| Ne | Yer |
|---|---|
| Ürün bağlamı (kitle, ilkeler, kanıt ve uydurulmayacaklar) | `egitim/PRODUCT.md` |
| Yön sözleşmesi ve yükseltmeler | `egitim/.impeccable/surfaces/docs-taslaklar-giris-html.md` |
| Tasarım sistemi (bitmiş taslaklardan çıkarıldı; adlandırılmış kurallar: Tek Dünya, Müfredat Kahramandır, Ayrılmış Sır, Yeşil Kuşakta ve Sırdadır, Dört Ses, On Yedi Piksel, Derz) | `egitim/DESIGN.md` + `egitim/.impeccable/design.json` |
| Üç taslak ekran + ortak stil | `egitim/docs/taslaklar/{giris,madde,hoca}.html`, `cini.css` |
| Taslak üretim hattı | `egitim/docs/taslaklar/uretim/` |
| Codex vektör çizimleri (15 sahne ve şerit çizimi) | `egitim/src/assets/cizim/sahne/*.svg` |
| Yazı tipleri | `egitim/public/fonts/` (Ulu Nesih, Atkinson Hyperlegible Next) |
| Logo (kimlik paketinden birebir kopya) | `egitim/public/logo/kuran-kursu-yatay.svg` |

## 1. Süreç (impeccable 4.1.3)

1. `init` → `egitim/PRODUCT.md`; kaynaklardan çıkarılan her cümle «[çıkarım]» diye işaretli.
2. Yön tohumu `concept-seed` (anahtar `d89ca935`, kip *persuade*): kendi yedi adaylık listemden **7. aday** atandı.
   Liste yankı sırasıyla: mushaf serlevhası ve tezhip · kilim tezgâhı · Elif-Bâ cüzü · hilye levhası · cüz kesesi ve
   rahle · meşk ve icazet · **çini panosu**.
3. Katalogdan gelen altı rakip tartıldı; kazanan çıkmadı. Hükümler ve her rakipten alınan yükseltme:

| Rakip (katalog dünyası) | Hüküm | Atanan yöne kattığı |
|---|---|---|
| Turşu kavanozu takvimi | reddedildi | Her durum zamanını yazıyla söyler («Pekişme kontrolü 24 Ekim'de») |
| Nefes alan gerilim sütunu | reddedildi | Dört basamak renk olmadan da biçimle ayrılır (kontur, boya, sır, altın çerçeve) |
| Fosfor terminal | reddedildi | Bağlantı durumu akışta satır olarak yazılır, açılır bildirim yok; pano ok tuşlarıyla gezilir |
| Ebru | **rekabetçi (yedek)** | Tek hareket yasası: her değişim dokunulan karodan yayılır |
| Sokak afişi | reddedildi | Her ekranda tek baskın öğe ve bir sakin alan |
| Massin sahne sayfası | reddedildi | Dört ses, dört yazı biçimi: Kur'an, okunuş, anlam, hocanın notu |

4. **Seçenek kartı (IMPECCABLE'S PICK):** kendi listemin 1. adayı «Mushaf serlevhası ve tezhip». Risk: kategorinin
   yeşil-altın süsleme kalıbına yakın düşer. Uygulanmadı; seçenek olarak duruyor.
5. **Kod öncelikli yol:** bu ortamda görsel üretimi yok, karşılaştırma görseli (comp) çizilmedi. Hırs yön
   sözleşmesindeki FIRST VIEWPORT satırında ve imza etkileşimde; bitiş incelemesi bunları davranışta denetledi.
   Ayar yalnız bu makinede (`egitim/.impeccable/config.local.json`, Git dışı).
6. **Bitiş incelemesi ve belgeleme** impeccable'ın paketle gelen iki alt ajanıyla yapıldı: inceleyici taze başlatıldı
   ve iki turla sınırlıydı; belgeleyici yalnız `egitim/DESIGN.md` ile yan dosyasını yazdı. AGENTS.md alt ajanı ancak
   açıkça istendiğinde kullanmayı söyler; bu iki adım Rıdvan'ın yetki devrine dayanır.

## 2. Yön: Çini panosu

Bütün ezber yolu caminin duvarındaki tek bir çini panosudur: 12 sıra karo (7 şerit + Amme'nin 5 durağı), çevresinde
kenar suyu bordürü; 13 kenar suyu maddesi kilimdeki gibi saat yönünde dağılır (üst 4, sağ 3, alt 3, sol 3), aradaki
bordür karolarında koçboynuzu, köşelerde köşe motifi. Düzen öğrencinin kilimiyle birebir aynıdır. Kategori kalıbını
(yeşil-altın arabesk kahraman, cami silueti, stok fotoğraf, «Learn Quran online») ve oyunlaştırmayı (seri alevi, puan,
sıralama) reddeder; kahraman müfredattır.

- **Dünya:** açık astar zemin, beyaz sırlı karo, 1–2 px derz, 3 px köşe, gölge yok. Karoda motif yeşil dolgulu ve koyu
  konturludur (çinideki tahrir). Kurs yeşili `#134420` yalnız yazı kuşağında ve yayılan sırdadır. Firuze ve altın
  **yalnız basamak** sırrıdır: Çalışıyor = kontur, Hocaya okudu = firuze boya, Pekişti = yeşil sır, Kalıcı = altın.
  Kilim ödülleri kazandıran basamağın rengini taşır: rozet firuze, mühür yeşil, altın kenar altın.
- **Kilim ile çini tek dünya:** pano müfredattır (her karo bir ezber), kilim öğrencinin kendi yoludur (okudukça o
  karonun motifi kilime dokunur); dört basamak, bir çini karonun dört olgunlaşma aşamasıdır (kontur, boya, sır, altın).
- **İmza:** panoda odaklanan ya da üzerine gelinen karo, üstteki yeşil kuşağa kendi adını, şeridini ve hedef tarihini
  yazar; kurs yeşili sır dokunulan noktadan karoya yayılır ve motif aynı anda sırrın beyazına döner (`clip-path:
  circle()` + `--x/--y`, azaltılmış harekette anında). Bağlantıyla gelinen liste maddesinde (`#m-…`, `:target`) aynı
  sır rozet karodan yayılır.
- **Sözleşme:** yön sözleşmesi (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH) yüzey özetindedir.

## 3. Yazı tipleri

**Arapça — «Ulu Nesih» (Scheherazade New 4.500 alt kümesi).** Diyanet'in çevrim içi mushafındaki Türk usulü yazımın
bütün kod noktalarını (çeker esre U+0656, çeker üstün U+0670, ط ز ع ق قف sekte ve vakıf işaretleri, U+06EB/06EC
halkaları) kapsayan açık lisanslı tek aday Scheherazade New çıktı; katalogdaki 583 âyet HarfBuzz'la hatasız
şekillendi. Amiri Quran dört vakıf işaretini içermiyor (14 âyet bozuluyor), Noto Naskh esreyi Arap usulüyle koyuyor,
Diyanet'in kendi yazı tipi tescilli (yalnız yerel görsel karşılaştırmada kullanıldı, projeye girmedi). OFL'nin
ayrılmış adları (Scheherazade, SIL) yüzünden alt küme yeniden adlandırıldı. CSS: `font-feature-settings: "cv62" 1`
(şeddeli esre harfin altında, Türk usulü). Üretim `egitim/scripts/ulu-nesih-uret.py` (aynı kaynak aynı baytı verir).

**Latin — Atkinson Hyperlegible Next.** Okunabilirlik için tasarlanmış (Braille Institute), karışabilen harfleri
(I/l/1, O/0) ayırıyor; çocuk, yaşlı ve ikinci dilden okuyan için doğru seçim. Türkçe, Fransızca, Hollandaca ve
Almanca harflerini, uzun ünlüleri (â î û, ā ī ū) ve kesme işaretlerini (’ ‘) karşılıyor. Noktalı transliterasyon
harfleri (ḥ ṣ ḍ ṭ ẓ) ile ʿ ʾ fontta yok; katalog ve taslak metinlerinin hiçbiri bunları kullanmıyor (27 Eylül 2026'da
karakter karakter denetlendi; Arapça dışındaki tek eksik ← → oklarıydı, SVG simgeye çevrildi). Değişken ağırlık
200–800 + italik; OFL, ayrılmış ad yok. Elenenler: Alegreya Sans (kitapsı, küçük boyda zayıf), Lexend (geniş ve sıradan).
Üretim `egitim/scripts/atkinson-uret.py` (889 kod noktası; 41,8 KB + 45,7 KB woff2).

Dört ses, dört yazı biçimi: Kur'an metni Ulu Nesih; okunuş Atkinson italik; anlam Atkinson düz; hocanın notu çip.

## 4. Taslaklar

Üç sayfa gerçek veriyle üretilir: katalog v3 (81 madde), yıllık plan 2026–2027'nin sınıf hedefleri, Diyanet'in Fâtiha
metni ve meâli (kuran.diyanet.gov.tr, birebir), Diyanet tilavet dosyaları (`public/media/ses/ayet/1-*.mp3`). Bütün
öğrenci adları uydurmadır ve «Örnek veri» diye işaretlidir; iletişim bloğunda imam telefonu yoktur.

- `giris.html` — Ezber Kilimi girişi: pano ilk görünümde; dört basamak; şeritler (telefonda katlanır listeler);
  «Kilimim» (örnek öğrencinin kilimi, `src/lib/ezber/kilim.ts` ile çizilir); metin ve sesin kaynakları.
- `madde.html` — Fâtiha: serlevha (Türkçe ad + «سُورَةُ الْفَاتِحَةِ»), âyet âyet Diyanet tilaveti (3 kez tekrar,
  0,75× yavaş), metin + okunuş + meâl, öğrencinin durum karosu, «Namazda nerede okunur».
- `hoca.html` — hoca telefonunda «Ezber» sekmesi, üç durum yan yana: günün listesi, dinleme penceresi, bağlantı
  yokken sıraya alınmış kayıtlar.

**Yeniden üretme** (depo kökünden):

```bash
node egitim/docs/taslaklar/uretim/veri.mjs    # katalog + plan → node_modules/.cache/egitim-taslak/
node egitim/docs/taslaklar/uretim/derle.mjs   # şablonlar → egitim/docs/taslaklar/*.html
node egitim/docs/taslaklar/uretim/ekran.mjs   # ekran görüntüleri → egitim/.impeccable/review/ (Git dışı)
```

## 5. İnceleme

**İki görsel tur (1440 ve 390 genişlik, açık ve koyu).** Birinci turun bulguları tek toplu düzeltmeyle giderildi:

- Pano çerçevesi panodan genişti (kuşak yazısı ve friz karolarının içerik genişliği çerçeveyi büyütüyordu; sağda boş
  derz alanı kalıyordu). Çerçeve genişliği artık karo ölçüsünden hesaplanıyor. Kenar suyu o turda 13 karoluk frize
  alındı; bitiş incelemesinde panonun bordürüne dönüştü (aşağıda).
- Telefonda giriş sayfası 16.211 px idi → 7.786 px: şerit listeleri `<details>` ile katlanır (bağlantı katlanmış bir
  maddeye giderse liste açılır), basamak kartları yatay, üst bilgi iki satır, güven satırı panonun altında.
- Madde sayfasında çal ve durdur simgeleri birlikte görünüyordu (`[hidden]` kuralı eksikti); serlevha tek satıra
  toplandı; madalyon küçüldü.
- Hoca listesinde «kontrol günü geldi» halkası yerine firuze etiket; satır içi stiller sınıflara taşındı.

**Dedektör** (tam kipte, bir kez): 21 bulgu → mekanik olanlar düzeltildi (koyu temada sıra numaraları, «Amme» ve
kenar suyu motiflerinin karşıtlığı; basılı düğme ve seçili sekme göstergeleri; yeşil bant üstündeki gri yazı; satır
aralığı; başlık ölçüleri). Kalan 6'sı gerekçeli: `clamp()` ölçemeyen tip hiyerarşisi uyarısı (2), kilim SVG
başlıklarındaki uzun tire (tavsiye; üretim kodunda, Faz 1f'de virgüle çevrilecek), sekme çubuğunun kenara dayanması
(bilinçli, 3).

**Chromium `ch` tuzağı:** `max-width: 34ch` yazı tipi yüklenmeden önce yedek yazı tipinin «0» genişliğiyle hesaplanıp
güncellenmeyebiliyor (aynı sayfada 405 px ↔ 487 px ölçüldü). Bütün satır ölçüleri `em`'e çevrildi.

**Bitiş incelemesi** (taze inceleyici, en çok iki tur). Birinci tur hükmü **fix**: sekiz maddi düzeltme, tek toplu
düzeltmeyle uygulandı.

1. Pano karoları beyaz sırlı yüze döndü; motif yeşil dolgulu ve koyu konturlu. Yeşil yalnız kuşakta ve yayılan sırda
   kaldı. Rozet karolar ve madde başındaki madalyon da aynı yüzü taşıyor. Önceki yeşil karolar «Pekişti» gibi
   okunabiliyordu.
2. İmza görünür oldu: sır beyaz karoya yayılır, motif aynı anda beyaza döner. Bağlantıyla gelinen liste maddesinde
   (`:target`) aynı sır rozet karodan yayılır.
3. Basamak kartlarındaki «Kontur / Boya / Sır / Altın» üst etiketleri kalktı; zanaat sırası giriş cümlesinde.
4. Firuze ve altın yalnız basamakta: hoca ekranında sıradaki kayıt beyaz zeminde kesikli çerçeveyle gösterilir, altın
   ton kalktı. Kilim rozeti firuze oldu.
5. Kenar suyu, friz yerine panonun bordürü oldu (kilimdeki düzen). Kuşak ve bütün pano 1440×900 ilk görünüme sığıyor
   (164→885 px). 72 px başlık zaten sağlanıyordu: kök yazı 17 px olduğundan 4.25rem = 72,25 px.
6. Hoca taslağının her telefon durumunda kesikli «Örnek veri» etiketi var.
7. Metinde kilim ile çini tek dünyaya bağlandı (giriş vaadi, basamak girişi, Kilimim).
8. Madde sayfasında komşu bağlantılarının çizili okları hizalandı.

Aynı 11 görüntü aynı adlarla yeniden çekildi. İkinci turda (karar geçişi) sekiz düzeltmenin hepsi **resolved**, hüküm
**ship**. İkinci dedektör koşusu yapılmadı (kural gereği). Düzeltme sırasında yakalanan hata: bordür karolarının yön
sınıfı `alt`, alt bilginin `.alt` kuralıyla çakışıp alt sırayı sıfır yüksekliğe indiriyordu. Sınıflar `yon-*` oldu;
Faz 1f'de pano sınıfları sayfa düzeyindeki `.ust` / `.alt` adlarından ayrı tutulmalı.

Açık kalan tavan notları (bağlayıcı değil): kuşakta maddenin Arapça adı (katalogda henüz her maddenin Arapça adı yok),
daha büyük Kilimim çizimi, «Nasıl çalışılır» kartları.

**Metin doğruluğu:** Fâtiha 1. âyetin meâli «Bismillahirrahmânirrahîm», kuran.diyanet.gov.tr `kuran-meal-2`
sayfasının meâl verisiyle (`MealAyats`) 27 Eylül 2026'da birebir teyit edildi. Aynı sayfadaki «Rahmân ve Rahîm olan
Allah´ın adıyla» sûre açıklamasının altındaki besmele bandıdır (`mts-besmele`), âyet meâli değildir.

## 6. Rıdvan'ın seçebilecekleri

Kurulan yön **çini panosu**dur. Dönüşte istenirse:

1. **Mushaf serlevhası ve tezhip** (seçenek kartı) — en tanıdık, en «Kur'an kursu» görünen yön; risk: kategorinin
   yeşil-altın kalıbına yakın.
2. **Ebru** (rekabetçi yedek) — hareketli, sıvı; pano yerine akan desen.
3. **Standart çıkış** — beyaz zeminli sade eğitim sitesi, tek yeşil vurgu; en az risk, en az kimlik.

Seçim değişirse yalnız görünüm katmanı değişir; katalog, durum makinesi ve kilim verisi aynı kalır.

## 7. Faz 1f'ye devredilenler

- `egitim/` Astro uygulaması (statik, `@ortak/*`, beş dil, ana siteye dönüş bağlantısı); `cini.css` jetonları ve
  bileşenleri `DESIGN.md`'ye göre taşınır. Hosting, DNS ve Auth canlı adımları ayrıca onay ister.
- Kilim SVG başlıklarında «—» ayırıcı → virgül (ekran okuyucu okuması); `kilim.ts` + testleri.
- Veli portalındaki kilim (`src/styles/ezber-kilim.css`) şimdilik ana sitenin paletinde (rozet aşı boyası tonunda);
  egitim'e taşınınca çini jetonlarına geçer, rozet firuze olur.
- Dar telefonda (360 px) üst bilgi 211 px yüksek: menü ve dil düğmeleri iki satıra kırılıyor. Astro başlığında
  sadeleştirilir.
- Madde sayfasındaki «Nasıl çalışılır» kartları (dinle-tekrarla, kademeli gizle, sırala-eşleştir) Faz 2'dir.
