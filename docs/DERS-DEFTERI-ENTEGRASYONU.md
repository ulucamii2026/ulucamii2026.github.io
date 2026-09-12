# Basılı ve dijital ders defteri

12 Eylül 2026. **Bulletin d’école** kitabının günlük ders sayfaları hoca ekranındaki
**Ders Defteri** ile eşleştirildi. Hoca kâğıtta çalışmaya devam edebilir; notları
telefonundan aynı öğrenci, gün ve ders altında girer.

## Kullanım

1. `/hoca/` → **Ders Defteri** → öğrenci → ders günü → 1., 2. veya 3. ders.
2. Ekrandaki basılı sayfa numarasıyla kâğıt defterdeki sayfayı karşılaştırın.
3. Dersin durumunu seçin, çalışma notunu ve varsa ödevi yazın. Kaynak menüsü son
   seçiminizi hatırlar; varsayılan **Doğrudan dijitale yazıyorum**.
4. **Diğer defter alanları** gerektiğinde açılır: Kur’an dersinde grup, okunan
   bölüm ve dikkat noktası; sonraki adım ve öğrencinin öz değerlendirmesi.
   Grup ve öz değerlendirme boş başlar; öğrencinin beyanı başarı notu sayılmaz.
5. **Kaydet** veya **Kaydet ve sonraki derse geç**. Başarı mesajı sunucu işlemi
   tamamlanınca gösterilir. Menü/öğrenci/gün değişiminde kaydedilmemiş not için
   uyarı çıkar; bağlantı veya sürüm çakışmasında yazılan metin ekranda korunur.
6. **Dijital arşiv** kaydedilmiş dersleri açar; seçili öğrenci için JSON indirir
   veya yazdırılabilir, PDF olarak kaydedilebilir ayrı bir döküm üretir.

Orijinal 320 sayfalık kişisel PDF ve kâğıttaki notlar değiştirilmez. Dijital çıktı
girilen metinlerin dökümüdür; çizimleri veya ıslak imzaları taramaz. Otomatik OCR,
çocuk fotoğrafı, imza görüntüsü ve ek kişisel dosya yükleme bu kapsamda yoktur.
Sunucuya kaydedilmemiş taslak tarayıcı kapatıldığında kurtarılamaz. Arşiv her
dersin son kaydını ve sürümünü saklar; eski sürümlerin ayrı geçmişi tutulmaz.

## KALICI KURAL — veliden gelen mazeret her zaman kabul edilir

Rıdvan'ın 12 Eylül 2026 kararı: **veli portaldan bir ders günü için mazeret
bildirdiyse o mazeret her zaman kabul edilir.** Bu yüzden mazeret bir tıklama
değil, bir kuraldır; ekran onu kendiliğinden uygular.

- **Yoklama** sekmesinde gün açılırken o güne ait veli mazeretleri okunur ve ilgili
  öğrencinin günün dersleri **Mazeretli** işaretlenir. Şerit hem mazeret metnini hem
  de kuralı yazar. Yazma yine **Yoklamayı kaydet** ile olur; ekran kendiliğinden
  sunucuya veri yazmaz.
- **Dokunulmayanlar:** «Var» ve «Geç» — çocuk mazerete rağmen gelmiş olabilir, gerçek
  katılım kuralı ezer. Ayrıca hocanın kural uygulandıktan *sonra* bilerek «Yok»a
  çevirdiği ders geri alınmaz; bunun izi yoklama belgesindeki `veliMazereti`
  alanında (kuralın işaretlediği sıralar) tutulur, yoksa her açılışta geri dönerdi.
- **Geç gelen mazeret:** yoklama alınıp «Yok» yazıldıktan sonra veli mazeret
  bildirirse, gün bir sonraki açılışta **bir kez** düzeltilir. Hoca o güne hiç
  dönmeyebileceği için **ders günü listesinde** mazeret bildirilen günler
  «· veli mazereti» diye işaretlenir.
- **Ders defteri** yoklamayı izlediği için kayıt kendiliğinden `mazeretli` olur ve
  kanonik not «Mazereti bildirildi; derse gelmedi.» yazılır.
- Kuralın tek kaynağı `mazeretKuraliniUygula` (`src/lib/ders-defteri.ts`); aynı
  işlev hem hoca ekranında hem `npm run denetim:defter` betiğinde kullanılır.
- Bu kural **veliye duyurulmaz**; portal metinlerinde «mazeretiniz her zaman kabul
  edilir» yazmaz. Kural hocanın iç işleyişidir.
- Veri ayrımı korunur: `mazeret` (veli bildirdi) ile `yok` (bildirim yok) ayrı
  kalır, dolayısıyla devam istatistiği anlamını yitirmez.

## Gelmeyen öğrencinin kaydı

`gelmedi` ve `mazeretli` ders durumları 12 Eylül 2026'da eklendi. Öncesinde yalnız
üç durum vardı (`islendi`, `kismen`, `ertelendi`) ve gelmeyen öğrencinin kaydı da
`islendi` yazılıyordu; ders o öğrenciye **işlenmiş** görünüyordu. O günün 45
kaydının 30'u böyleydi ve hoca «gelmedi.», «Derse katılmadı.», «Ya, işte yoktu.»
gibi on beşten fazla farklı cümleyi elle yazmıştı.

- Defter paneli günün yoklamasını okur; durum oradan gelir, ders düğmelerinde ve
  form başlığında yoklama rozeti görünür.
- Gelmeyen derste çalışma notu **zorunlu değildir**; boş bırakılırsa kanonik cümleyi
  depo yazar (`GELMEDI_NOTU`). Hoca kendi cümlesini yazarsa ona dokunulmaz.
- Yoklamayla çelişen bir durum seçilirse uyarı çıkar, **kayıt engellenmez**.
- **Gelmeyenlerin defterini doldur** düğmesi, yoklamada gelmemiş sayılan ve henüz
  kaydı olmayan dersler için kayıt açar. Var olan kayda asla dokunmaz (yalnız
  `create`; Firestore kuralı da mevcut belgeye `surum: 1` yazılmasını reddeder).
- **Kaydet ve sonraki derse geç** günün son dersinden sonra ertesi güne değil, aynı
  günün ilk dersinde **sıradaki öğrenciye** geçer.

`npm run denetim:defter` (`scripts/defter-yoklama-denetim.mjs`, hoca hesabıyla salt
okuma) iki zinciri birden denetler: veli mazereti → yoklama, yoklama → defter
durumu. `--duzelt` yalnız yoklamanın `dersler`/`veliMazereti` alanlarını ve defterin
`durum` alanını değiştirir; hocanın yazdığı metinlere dokunmaz, eksik defter kaydı
açmaz, alınmamış yoklamayı oluşturmaz.

## Haftalık bülten bağlantısı

**Bülten · İdare** içinde aynı öğrenci/hafta seçilip **Ders defterinden doldur**
kullanılır. İşlenmiş/kısmi/ertelenmiş ders notları, ödev ve sonraki adım taslağa
aktarılır; getirilecekler alanı korunur. Hoca mevcut metinlerin değişeceğini
onaylar. Uzun notlar kesilmez; sığmıyorsa mevcut taslak korunur, kısa özet istenir.
Öz değerlendirme, grup ve özel okuma notları topluca veliye açılmaz.

Aktarım kendiliğinden kayıt, yayın veya e-posta oluşturmaz. Hoca metinleri ve
**içerik dilini** kontrol eder; gerekirse ailenin dilinde düzenler, sonra açıkça
yayımlar. E-posta iletişim dili tercihi değişmez. Basılı haftalık aile yazışma
sayfasının tüm alanları veya aile imzası otomatik doldurulmuş sayılmaz.

## Eşleştirme kaynağı ve veri koruması

Basılı kaynak: `D:/ulu-camii-kuran-kursu/belgeler/ogrenci-defteri-2026-2027/`
içindeki `yillik-plan.json`, `ders-etkinlikleri-v2.json`, `ogrenci_defteri_uret.py`
dosyasının A grubu aylık hedefleri ve `scratchpad/defter-v2/son-v2/sayfa-haritasi.json`
(scratchpad yolu kurs deposunun köküne göredir). Özel öğrenci listesi kullanılmaz.
Etkinlik kaynağı SHA-256:
`bedeef6da3cdb1c996b7fd33acfa503bf5384c75aa05e51b07a07ae88e04b343`.

`src/data/ders-defteri-2026-2027.json` yalnız 87 gün / 261 derslik kişisel olmayan
müfredatı içerir. TR/FR hedef ve etkinlik metinleri basılı kaynaktan alınmıştır.
Basılı sayfalar 51–311; site planıyla tarih, sıra, ders numarası, konu ve kaynak
eşleşmesi test edilir. Kaynak kitap yeniden üretilip sayfaları değişirse bu
eşleştirme de gözden geçirilmelidir. Katalog hoca sekmesi açılınca yüklenir.

Kayıt yolu `dersDefteri/{ogrenciRef}/kayitlar/{YYYY-MM-DD_sira}`. Notlar yalnız
hocalara açıktır. Veli kendi çocuğunun bu özel koleksiyonunu da okuyamaz/yazamaz.
İlk sürüm 1; güncellemeler transaction ve beklenen sürüm kontrolüyle yapılır.
Sunucu saati, alan uzunluğu, belge kimliği/sayfa ve izin verilen değerler Firestore
kurallarıyla korunur. Mevcut dersin tarih/konu/sayfa kimliği güncellemede değişmez.

İdari envanter ve **tüm portal kayıtları** temizliği ders defterini de kapsar.
Yalnız ev çalışması temizliği bu kayıtları etkilemez. Ortak veli ve kardeş
kayıtları korunur. Silme kilidi yeni defter yazımlarını durdurur. İndirilen
dosyalar kişisel veri içerir; dernek arşivinde saklanmalıdır. Portalın mevcut
saklama süreleri geçerlidir; sınırsız saklama veya ayrıca otomatik yedek garantisi
verilmez.

## Doğrulama

`tests/web/ders-defteri.spec.mjs`: telefon/masaüstü kayıt, sonraki ders, yeniden
yükleme, kesinti, çakışma, vazgeçme, seçili öğrenci çıktısı, JSON, bültene aktarım,
açık/koyu tema ve axe. `tests/kurallar/firestore.test.mjs`: yalnız demo emülatöründe
yetki, sürüm, gerçek transaction ve seçili öğrenci temizliği. `test:ogrenme`:
261 ders/sayfa eşleştirmesi. Gerçek öğrenci hesabına test kaydı yazılmaz.

12 Eylül 2026 doğrulaması:

- `npm run dogrula:codex` tamamen geçti: 334 tarayıcı, 34 emülatör güvenlik,
  33 ihtida sözleşme, 32 e-posta, 12 otomatik kayıt ve 8 öğrenme/eşleştirme testi.
  870 sayfa üretildi. Astro: 0 hata, 0 uyarı (250 mevcut/araç ipucu).
  Site denetiminin 48 düşük öncelikli başlık hiyerarşisi notu ayrıca devam ediyor;
  bu sonuç sitenin her konuda kusursuz olduğu iddiası değildir.
- Son küçük klavye odağı düzeltmesi ve gizlilik sayfası tarih güncellemesinden
  sonra `check` ve `build` yeniden geçti; ders defteri, bülten ve giriş akışları
  için 50 hedefli tarayıcı testi tekrar başarılı oldu. Bu sayı 334 ile örtüşür.
- Mobil/masaüstü, açık/koyu tema ve azaltılmış hareket kontrol edildi. Arşiv ve
  isteğe bağlı alanlar kapalı başlar; kaydetme düğmeleri notların üstünü örtmez.
- Gerçek çıktı fonksiyonuyla, yalnız örnek öğrenci verisiyle dört A4 sayfalık
  uzun metin denemesi üretildi. Tekrarlanan 80 çalışma, 40 ödev ve 25 sonraki-adım
  cümlesi PDF metninde eksiksiz; metin kutuları sayfa sınırları içinde. Sayfalar
  görsel olarak da incelendi. Baskı akışı, özgün basılı defteri değiştirmedi.
- Kural yayını yalnız dernek hesabı/projesiyle yapıldı; önceki canlı kural yedeği
  alındı. Rules API geri okuması yerel kuralla eşleşti: ruleset
  `d48ba616-6dfe-4dd5-b27e-adb41e5daeed`, yayın `2026-09-12T17:13:03.250491Z`.
  Normalize SHA-256: `1d7550f2f1537e8ff377cccfd1ded8f06f7b54b08874cce69b0ab9607ef961c0`.

Kanıt dosyaları (yerel, gerçek öğrenci verisi içermez):
`D:/tmp/ulucamii-defter-tam-kapi.log`, `ulucamii-defter-son-check.log`,
`ulucamii-defter-son-build.log`, `ulucamii-defter-son-web.log`,
`ulucamii-defter-cikti-test.mjs`, `ulucamii-defter-cikti-test.pdf`.
Canlı sürümün dört portal/hoca sayfası, JS/CSS dosyaları ve tembel yüklenen ders
kataloğu hash karşılaştırması `D:/tmp/ulucamii-defter-canli.json` kaydında tutulur.
Canlıda gerçek öğrenci notu yazma/silme veya veliye yayın/gönderim denenmedi.
