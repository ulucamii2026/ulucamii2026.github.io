# Hoca ekranı — arayüz dilleri (tr · fr · en · nl · de)

Karar: 12 Kasım 2026 (site sahibi). `/hoca/` (ulucamii.be) ve `egitim.ulucamii.be/hoca/` aynı betiği (`src/scripts/hoca-ekrani.ts`) kullanır; ikisi de beş dilde çalışır.
Canlı bir araçtır (hoca her gün gerçek öğrenci verisiyle kullanır): **davranış değişmedi, Türkçe birebir aynıdır.**

## Nasıl çalışır

- **Dil seçici:** ekranın üstünde küçük bir seçim kutusu (`src/scripts/hoca-dil.ts`, `#hoca-dil`, klavyeyle kullanılır). Seçim **cihaza özeldir**
  (`localStorage` anahtarı `hocaDil`, try/catch korumalı; hassas veri değil). Varsayılan Türkçe. Değişince sayfa yeniden yüklenir: ekranın tüm
  parçaları (yoklama, defter, ezber, envanter, bülten…) aynı dille baştan çizilir. Kaydedilmemiş taslak varsa yeniden yükleme onu kaybettirir:
  dil değişikliği bilinçli bir eylemdir. `document.documentElement.lang` seçilen dile ayarlanır. Satır içi betik/stil yok (CSP aynı); seçicinin
  stili `src/styles/hoca-ilim-yolu.css` içindedir. `egitim/src/pages/hoca/index.astro` ve `src/pages/hoca/index.astro` değişmedi (seçici betikten eklenir).
- **Çekirdek:** `src/i18n/hoca.ts` — `sozluk(sözlük)` → `t(anahtar, {yer: değer})`, `hocaDili()` (sayfa açılışında bir kez okunur), `hocaYerel()`
  (`tr-TR`, `fr-BE`, `en-GB`, `nl-BE`, `de-DE`; tarih ve sayı `Intl` ile). Çoğul: `{ one, other }` (`Intl.PluralRules`, yer tutucu `{n}`).
- **Sözlükler:** `src/i18n/hoca-metin/*.ts` (`cekirdek`, `ekran`, `defter`, `defter-kaliplari`, `bulten`, `odev`, `kitaplar`, `ezber`, `envanter`, `ilim`).
  Her sözlük `Record<Dil, Record<anahtar, Metin>>` tiplidir (`satisfies`): bir dilde anahtar eksikse `npm run check` (astro check) kırılır.
  Türkçe değerler eski kaynaktaki metnin **birebir** kopyasıdır (noktalama ve tipografik karakterler dâhil).
- **Eşitlik sınaması:** `tests/hoca-metin-esitlik.test.mjs` — beş dilde aynı anahtarlar, boş değer yok, yer tutucu kümesi ve çoğul türü aynı,
  tr dışı değerlerde `<` ve `&` yok (işaretleme yalnız anahtarı `Html` ile biten değerlerde ve her dilde aynı etiketlerle), Fransızca yazım kuralı
  (`: ; ! ? « »` öncesi/içi bölünmez boşluk).
- **Yeni metin eklemek:** ilgili sözlüğün `tr` nesnesine anahtarı ekleyin, beş dile de karşılığını yazın, kodda `t('anahtar')` kullanın. Metin
  birleştirme yerine yer tutucu kullanın (kelime sırası dile göre değişir).
- **Yeni dil eklemek:** `src/i18n/ui.ts` → `diller`; sonra her sözlüğe yeni dili ekleyin (tip denetimi eksikleri gösterir) ve `HOCA_YEREL`i güncelleyin.

## Çeviri notu

fr, en, nl ve de metinleri **makine destekli çeviridir**: hoca ekranının Türkçe metninden, sitenin mevcut terimleri (`src/i18n/ui.ts`, `veli.ts`,
`egitim/src/i18n`, `docs/DIL-NL-DE.md` terim tablosu) esas alınarak üretildi; her dil bağlamıyla ayrıca gözden geçirildi (anlam, ton, telefonda
360 px'te uzunluk, tutarlılık). Hitap resmîdir (vous · u · Sie). Anadili konuşan biri tarafından okunması iyi olur; düzeltmeler yalnız ilgili
sözlük dosyasında yapılır.

## Tasarım gereği Türkçe kalanlar

Arayüz çevrilir; şunlar çevrilmez ve değişmez:

- **Firestore'a yazılan ve veliye giden içerik:** ders defteri metinleri, defter **kalıp cümleleri** (kalıp düğmesinin etiketi çevrilir; kaydedilecek
  Türkçe cümle düğmenin altında `lang="tr"` ile görünür ve formda bunu söyleyen bir ipucu satırı vardır), hazır kayıt notları, «Gelmedi» notu,
  yoklama değerleri ve enum'lar, anahtarlar/kimlikler, duyuru ve bülten metinleri, haftalık ödev kalıp cümleleri (`ODEV_KALIPLARI`; etiketleri çevrilir,
  kaydedilen cümle aynı kalır), WhatsApp karne metni, ezberin deftere yazılan «Ezber — …» cümlesi, değerlendirme ölçütleri (`OLCUTLER`),
  kayıt defteri sütun başlıkları, çeviri hizmeti yükü ve e-posta/davet metinleri.
- **Veri:** öğrenci/veli adları, müfredat konu/hedef/kaynak adları, Ezber kataloğundaki sûre ve madde adları, seviye adları, Arapça metin.
- **Çocuğa/aileye dönük yüzeyler:** Envanter'in öğrenci kipi ve ev kipi (çocuğun ve velinin gördüğü ekranlar) ile `maddeler.json` içeriği; İlim Yolu
  basılı kartı ve bağlama fişi (TR+FR çift dilli belge); `/kitap/` paylaşım sayfası; bülten önizleme/yazdırma çıktısı (veli bülteni kendi dilinde).
- **Kütüphane hata iletileri** (`bultenDeposu`, `portalIdare` içinden gelen `err.message`), Firebase kimlik e-postalarının dili (`languageCode = 'tr'`),
  `<noscript>` iletisi, sayfa başlığı/`<title>` ve «Yükleniyor…» kabuk metni (betik çalışınca seçili dille değişir), `console.*`.
- **Mantığın metne göre eşleştirdiği iki yer:** çakışma iletisindeki `includes('başka bir ekranda')` ve arama normalleştirmesi (`tr-TR`) aynen durur.

## Doğrulama

- `tests/egitim/hoca-dil.spec.mjs`: giriş ekranı ve 13 sekmenin çizdiği HTML, i18n öncesi alınan altın kayıtla (`tests/egitim/hoca-dil-altin/tr.json`)
  **birebir** aynı olmalıdır (sunucu portu hariç). Altın kayıt yeniden üretilmez; Türkçe bilerek değişecekse `HOCA_ALTIN_YAZ=1` ile ve gerekçeyle güncellenir.
- `tests/egitim/hoca-cok-dilli.spec.mjs`: dil değişince üç ekranda metinler değişir; yoklama ve defter yazımları Türkçe ve Almanca arayüzde birebir aynı;
  360 px'te nl/de Türkçeden fazla yatay taşma yok; Almanca arayüz Türkçede olmayan axe ihlali getirmez; seçici beş dili listeler ve seçimi saklar.
- Yerel koşu için `HOCA_PORT` ortam değişkeni (test yardımcısı ve `hoca-odev` / `ders-defteri` sınamaları 4401 (egitim ev sahibinde 4402) yerine o portu kullanır). Dilim 4 taşımasıyla (dal `dilim4-p7`) hoca ekranı egitim.ulucamii.be’de olduğundan bu üç sınama `tests/egitim/` altındadır, `npm run egitim:build` sonrası 4402’de koşar.
