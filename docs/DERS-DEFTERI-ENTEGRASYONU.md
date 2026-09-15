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

Orijinal kişisel PDF ve kâğıttaki notlar değiştirilmez. Dijital çıktı
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

`npm run defter:ac` (`scripts/defter-gelmedi-ac.mjs`, hoca hesabıyla) düğmenin komut
satırı eşidir: yoklamada gelmemiş sayılan ve kaydı olmayan dersleri listeler, `--yaz`
ile kütüphanedeki `topluGelmediYaz` üzerinden açar (ekranla birebir aynı belge), `--tarih`
ile güne daraltılır. Var olan kayda dokunmaz. Denetim «DEFTERİ AÇILMAMIŞ n ders» diyorsa
eksikleri bu kapatır (14 Eyl 2026: hoca ekranından önceki 1. haftanın 16 kaydı böyle açıldı).

## «Dokuna dokuna» doldurma — kalıp çipleri ve hazır kayıt (14 Eyl 2026)

### Öğrenci/gün seçimi ve tutarlı kalıplar — 15 Eylül 2026

- Öğrenci adını veya soyadını arayıp sonuca dokunarak defter açılır. Türkçe
  harflerin sade yazımı da bulunur. Mevcut öğrenci listesi ve günlük doluluk
  işaretleri korunur; önceki/sonraki öğrenci düğmeleri listedeki sırayı izler.
- Ders günleri tarih sırasındadır. Önceki/sonraki ders günü ile bugün ders varsa
  bugüne, yoksa son ders gününe tek dokunuşla geçilir. Kaydedilmemiş not uyarısı
  arama sonuçları ve hızlı geçiş düğmelerinde de geçerlidir.
- Konu, katılım, okuma/ezber ve gün notuna 20 seçenek eklendi. Fransızca karşılıkları
  `src/lib/defter-ceviri.ts` sözlüğünde bulunur; hazır cümleler makine çevirisi istemez.
- `mantikliKalipSec` aynı değerlendirme grubundaki önceki kalıbı kaldırır:
  katılım düzeyi, kavrama, soruya cevap, dikkat, harf tanıma, akıcılık, ezber,
  zamanında/geç gelme, malzeme, ilk gün uyumu ve söz sırası. Son seçim geçerlidir;
  aynı seçime yeniden dokunmak kaldırır. Bağımsız gözlemler birlikte kalabilir.
- «Ödev yok» kaynak dışındaki hazır ödev önerilerini kaldırır; herhangi bir ödev
  önerisi seçilince «Ödev yok» kaldırılır. Birden fazla ödev önerisi birlikte kalır.
- Mantık yalnız tanımlı hazır kalıpları karşılaştırır; serbest cümlelerin anlamını
  yorumlamaz. Kullanıcının diğer notları korunur, eski kayıtlar kendiliğinden
  yeniden yazılmaz. Kaydetme ve veliye paylaşma adımları değişmez.
- Doğrulama: `tests/defter-kaliplari.test.mjs`, `tests/defter-ceviri.test.mjs` ve
  `tests/web/ders-defteri.spec.mjs`; tüm kalite kapısı `npm run dogrula:codex`.
- 15 Eylül 2026 yerel sonuç: kalite kapısının sekiz aşaması geçti; 414/414
  tarayıcı, 41/41 emülatör güvenlik testi ve 14/14 kalıp/çeviri testi başarılı.
  `npm run onizle -- --host 127.0.0.1` üzerinde sentetik öğrencilerle 1440 ve
  390 px ekran görüntüleri açık/koyu temada incelendi. Gerçek cihaz ve canlı
  hesap akışı sınanmadı; commit, push veya yayın yapılmadı.

Rıdvan: «hazır kalıplar olsun, hazır butonlara basınca o metin ile defter kolay
doldurulabilsin; özel bir durum varsa hoca yine özel durumu yazar.» 12–13 Eylül'ün 23
işlenmiş kaydı incelendi: hoca üç tür cümle yazıyor — katılım/tutum, konuya bağlı
«…öğrendik», ve çoğu öğrenciye birebir aynı ödev cümlesi (5 kez aynı ödev). «Sonraki
adım», «okunan», «dikkat» alanları hiç kullanılmamıştı.

- Kalıp metinleri **`src/lib/defter-kaliplari.ts`** içindedir (saf modül; DOM ve
  Firestore bilmez). `defterKaliplari(ders, sonrakiDers)` alanlara göre grup döndürür;
  Kur'an dersinde «Okuma», «Okuma · ezber», «Okunan», «Dikkat» grupları eklenir.
  Konu, kaynak ve sıradaki ders plandan gelir; **öğrenci adı hiçbir kalıba girmez**.
- **Çip** bir cümle ekler, ikinci dokunuş geri alır (`aria-pressed`); hocanın serbest
  metnine cümle sınırında eklenir (`kalipEkle`/`kalipCikar`). Kısa etiket alanları
  (`okunan`, `dikkat`) virgülle birleşir (`ALAN_BICIMI`). Elle silince çipin basılı
  görünümü de düşer.
- **Hazır kayıt** (`hazirKayitlar`): «İşlendi · katılım iyi», «İşlendi · tekrar gerek»,
  «Kısmen işlendi», «Ertelendi». Durumu daima yazar; metin alanlarını **yalnız boşsa**
  doldurur, dolu alan raporlanır (`hazirKaydiUygula`).
- **«Son kayıtla aynı»**: aynı dersin en son KAYDEDİLEN notları cihazda tutulur
  (`localStorage: ulucamii-defter-son-kayit`, 40 ders); sıradaki öğrencide boş alanlara
  kopyalar. Gelmeyen öğrencinin kaydı önbelleğe alınmaz.
- **Kullanım sayacı** cihazda kalır (`ulucamii-defter-kalip-sayac`); çok kullanılan çip
  grubun başına gelir — yalnız yeniden çizimde, dokunurken çipler yer değiştirmez.
- Gelmeyen (`gelmedi`/`mazeretli`) derste çip ve hazır kayıt gösterilmez; kanonik not yeter.
- Kaydet çubuğu ekranın altına yapışır; metin alanları içeriğe göre uzar.
- Testler: `npm run test:kaliplar` (saf işlevler) ve `tests/web/ders-defteri.spec.mjs`
  (çip, hazır kayıt, son kayıtla aynı, gelmeyen öğrenci, yapışkan çubuk, dokunma hedefi).

## Günün ilerlemesi ve hoca ekranı ikinci tur (14 Eyl 2026)

İkinci tasarım/içerik turu: ders gününün iş akışı (yoklama → defter → haftalık ödev →
veli bildirimleri) ekranın düzenine işlendi; sayımlar tek tek sayılmak yerine gösterilir.

- **Günün ilerlemesi** (defter panelinin üstü, `data-dd-gun-ozet`): «n/N öğrencinin
  günlük defteri tamam · k kısmen · m başlanmadı» ve **«Sıradaki eksik: <ad>»**
  düğmesi (`data-dd-siradaki`) — listede defteri tamamlanmamış ilk öğrenciyi ilk EKSİK
  dersiyle açar. Öğrenci seçeneklerinde ✓ (tamam) / ◐ 1/3 (kısmen) işareti.
  Veri `gunDefterOzeti(db, refler, tarih)` (`src/lib/ders-defteri.ts`): öğrenci başına
  `kayitlar` alt koleksiyonunda `tarih ==` sorgusu; koleksiyon grubu sorgusu ve kural
  değişikliği gerekmedi (N küçük sorgu, gün değişince bir kez okunur; kaydetmeden sonra
  yerelde güncellenir; «Yeniden dene» ve toplu doldurma yeniden okur).
- **Öğrenci kartı → defter:** «Ders defterini aç» (`data-defter-ac`) defteri o öğrenciyle
  açar (`dersDefteri(..., { baslangicRef })`). Kartta devam özeti (`data-devam`: ders günü
  sayısı, Var/Yok/Mazeretli/Geç sayıları — `yoklama` koleksiyonundan `ref ==` sorgusu).
- **Yoklama:** akıllı varsayılan — günün İLK dersi işaretlenince öğrencinin BOŞ kalan
  dersleri aynı işaretlenir («Geç» → sonrakiler «Var»); dolu ders asla ezilmez. Canlı özet
  `data-yk-ozet` («k/n ders işaretli · Var/Yok/Mazeretli/Geç · İşaretsiz m»). Gün notu
  katlı (`<details class="yk-not">`, dolu ise açık). Telefonda kaydet çubuğu yapışkan.
- **Başlık ve sekmeler:** günün özeti `data-hero-gun` (bugün / sıradaki ders günü, hafta,
  günün dersleri, aktif öğrenci sayısı, okunmamış veli bildirimi bağlantısı); sekme sırası
  iş akışına göre, «Veli bildirimleri» sekmesinde okunmamış rozeti (`.sekme-sayi`).
- Testler: `tests/web/ders-defteri.spec.mjs` («Günün ilerlemesi…») ve
  `tests/web/hoca-yoklama.spec.mjs` (akıllı varsayılan + canlı özet + gün notu; günün
  özeti + rozet + sekme sırası; öğrenci kartı devam özeti + «Ders defterini aç»).

## Fransızca aileye Fransızca kayıt — defter çevirisi (14 Eyl 2026)

Rıdvan: «İletişim tercihi Fransızca olan velilere benim Türkçe olarak doldurduğum ekranlar
Fransızca olarak kaydedilsin.» Hoca defteri Türkçe yazmaya devam eder; Fransızca aileye
giden her metin Fransızca üretilir ve **ayrı belgede** saklanır.

- **Hedef aile:** öğrenci `ogrenciler.dil == 'fr'` ya da ailelerinden birinin
  `aileler.iletisimDili` / `aileler.dil` değeri `fr` (`hedefDil(ref)`,
  `src/scripts/hoca-ekrani.ts`). Türkçe ailede hiçbir şey değişmez.
- **Belge:** `dersDefteri/{ref}/ceviriler/{kayitId}_fr` — `kayitId`, `dil`, `kaynakSurum`
  (kaydın `surum`u; kayıt değişince çeviri «eski» sayılır), `yontem` (`kalip` / `makine` /
  `karma`), `calisma`, `odev`, `sonraki`, `okunan`, `dikkat`, `guncelleme`. Kayıt belgesine
  dokunulmaz; kilitli anahtar kuralı ve sürüm sayacı aynen kalır. Kurallar: yalnız hoca
  okur/yazar, kimlik `kayitId + '_' + dil`, uzunluk sınırları
  (`firebase/firestore.rules`, test `tests/kurallar/firestore.test.mjs`).
- **İki katman** (`src/lib/defter-ceviri.ts`): (1) ekrandaki her kalıp cümlenin, hazır
  kaydın, kanonik notun («Derse gelmedi.» → «Absence au cours.»), durum etiketinin ve
  249 ders başlığının (`src/data/ders-konu-fr.ts`) elle yazılmış, **cinsiyetsiz**
  Fransızcası («Votre enfant a…», «Sa participation…»); (2) kalan serbest cümleler
  derneğin Apps Script'ine (`tur: 'cevir'`, **v35**; Firebase kimlik belirteci Identity
  Toolkit'te doğrulanır + `hocalar/{uid}` şartı). Metin cümlelere bölünür (`bolumle`), kalıp olanlar sözlükten,
  yalnız serbest olanlar makineye gider; makine yanıtı eksikse **hiçbir şey yazılmaz** (yarım
  çeviri yok).
- **Motor zinciri (v35, 14 Eyl 2026 öğleden sonra; Rıdvan «inisiyatif al, ai ile çeviri
  daha iyiyse onu yap»):** birincil **Gemini** — derneğin GCP projesi `ulucamii-portal`'ın
  Generative Language anahtarı (Script Property `GEMINI_API_KEY`; anahtar yalnız
  `D:/tmp/gas/gemini-anahtar.json` ve Script Properties'te, hiçbir yere basılmaz), modeller
  `CEVIRI_MODEL` (virgülle; varsayılan `gemini-3.5-flash-lite,gemini-3.6-flash`) sırayla
  denenir; sistem istemi (`CEVIRI_ISTEM`): Belçika Fransızcası, veliye «vous», çocuk için
  «votre enfant» + sıradan uyum (kapsayıcı «arrivé·e» biçimi yasak), Diyanet terimleri
  (Muhammad, sourate, ablutions, obligations…), `[[n]]` yer tutucuları korunur ve metindeki
  ad asla yer tutucuya çevrilmez (istem v5 — v4'te model «Tayyip»i kendiliğinden «[ [1] ]»
  yapmıştı), virgül/nokta önünde boşluk yok, JSON dizi şeması,
  sıcaklık 0, `thinkingLevel: low`. Model düşerse (HTTP ≠ 200, sayı tutmaz, boş öğe)
  sıradaki model, hepsi düşerse **Google Translate** (`LanguageApp`); her yanıt
  `ceviriDuzelt`'ten geçer ve `motor` alanıyla döner. Anahtarlar: `CEVIRI_MOTOR=translate`
  yalnız Google Translate, `CEVIRI_KAPALI=1` tümü kapalı; sağlık ucu `ceviriMotoru`
  (`gemini` / `translate` / `kapali`). DeepL seçilmedi (kart/kayıt ister, dernek hesabında
  yok); Vertex AI seçilmedi (kişisel proje). Ücretsiz katman Belçika'dan çalışıyor; ölçülen
  kota: `gemini-3.6-flash` günde **20 istek/proje** (429 `GenerateRequestsPerDayPerProjectPerModel-FreeTier`),
  `gemini-3.5-flash-lite` daha geniş — bu yüzden lite birincil, 3.6 ikinci, kota bitince Google
  Translate. Canlı ölçüm (14 Eyl 2026): lite ~1 s doğrudan, uç üzerinden 8–20 s (belirteç
  doğrulama + Apps Script); 3.6-flash düşük düşünmede virgül/nokta önüne boşluk ve yazım hatası
  («meustrise», «ritueles») üretti, `ceviriDuzelt` boşlukları temizler.
- **Ad gizleme (`adGizleyici`, `src/lib/ceviri-servisi.ts`):** makineye gitmeden önce
  öğrenci ad/soyadları ve veli adları (2 harften uzun her sözcük, Türkçe büyük/küçük harf
  duyarsız, sözcük sınırında) `[[n]]` yer tutucusuna çevrilir, çeviri dönünce yazıldığı
  biçimiyle geri konur («Tayyip'in» → «[[1]]'in» → «Tayyip'in»). Kurallar (canlı ön izleme
  dersleri): yalnız **büyük harfle başlayan** geçiş ad sayılır; `AD_DEGIL` listesindeki
  sıradan sözcükler («temel», «melek», «Ramazan», «Muhammed»…) hiç maskelenmez — ilk turda
  bir velinin adı olan «temel» maskelenince Gemini «les temel informations» üretmişti; motor
  tanınmayan bir yer tutucu döndürürse çeviri hata sayılır (yarım çeviri yazılmaz). Hocanın
  kayıtlı addan farklı yazdığı ad («Tayyip» ↔ kayıtta «Tayip») maskelenmez, olduğu gibi gider.
  Hoca ekranı (`S.ogrenciler`/`S.aileler`) ve CLI aynı sarmalayıcıyı kullanır.
- **Çeviri ayarları ucu (v35):** `POST { tur: 'ceviri-ayar', anahtar: <PANEL_ANAHTARI>,
  ayarlar: { GEMINI_API_KEY | CEVIRI_MOTOR | CEVIRI_MODEL | CEVIRI_KAPALI } }` — boş dize
  siler, yanıt gizli anahtarı geri vermez (`var`/`yok`), panel anahtarı tanımsızsa uç
  kapalıdır. Neden gerekli: Apps Script ayar sayfası 50'den fazla Script Property olunca
  «düzenle» düğmesini kaldırıyor (veli-cuma'nın `VELI_CUMA_FR_*` çeviri önbelleği ve
  `VELI_CUMA_GONDERIM_*` gönderim durumları sayıyı aştı; `gas-ozellik.py` bu yüzden
  «düzenle düğmesi yok» der). Anahtar bu uçla yazıldı: `py -3.14 D:/tmp/gas/ceviri-ayar.py
  GEMINI_API_KEY=@` (değer dosyadan, basılmaz; argümansız çağrı ayarları gösterir).
  **v36 (14 Eyl 2026, 3) kilidi kaldırdı:** veli-cuma gönderim durumları cuma başına tek özellik
  (`VELI_CUMA_GONDERIM_<cuma>` → `{hash: durum}`), çeviri önbelleği `CacheService`; `veliCumaOzellikBakim`
  eski tekil kayıtları katlar, `VELI_CUMA_FR_*` siler, 12 haftadan eski cumaları siler (her cuma gönderiminin
  sonunda kendiliğinden; elle `POST { tur: 'ozellik-bakim', anahtar }` → `py -3.14 D:/tmp/gas/ozellik-bakim.py`,
  yanıt yalnız özellik adları + sayılar). Sözleşme testleri: `tests/gas-ceviri.test.mjs` (6) ve
  `tests/veli-cuma.test.mjs` (v36 iki test). Böylece «tek JSON'a taşıma» açık konusu kapandı.
- **Makine ucu istemcisi** (`src/lib/ceviri-servisi.ts`): 20 metin / 1.800 karakterlik
  partiler; geçici sunucu sapmaları (Apps Script echo 404'ü, doGet'e düşen yönlendirmenin
  sağlık JSON'u, ağ hatası) üç kez denenir; ucun bilinçli hata kodları (`ceviri-kapali`,
  `yetkisiz`, `metin-uzunlugu`) yeniden denenmez.
- **Ekran:** Fransızca ailede defter başlığında `data-dd-ceviri` satırı («Veli dili Fransızca ·
  çeviri: kaydedince yapılır / kayıtlı ✓ (yöntem) / eski — kayıt değişti») ve gerekirse
  «Şimdi çevir» (`data-dd-cevir`). Kaydet, çeviriyi beklemez: kayıt yazılır, çeviri arkadan
  gelir ve durum satırına «Fransızca çevirisi kaydedildi (…)» ya da «yapılamadı; «Şimdi
  çevir» ile ya da bülten aktarımında yeniden denenir» eklenir. Gelmeyenler için toplu
  kayıt (`topluGelmediYaz`) Fransızca öğrencilere aynı anda `topluGelmediCevirisiYaz` ile
  kalıp çevirisini yazar.
- **Bülten (`src/scripts/hoca-bulten.ts`):** Fransızca aileye yeni bülten `dil: 'fr'` ve
  Fransızca ders başlıklarıyla başlar; ödev/ezber `odevler.*.fr` alanından gelir. «Ders
  defterinden doldur» çevirileri kullanır (`defterdenBultenFr`: «tarih · cours n · konu»,
  «Cours fait : …»); çevirisi olmayan/eski kayıt Türkçe kalır ve durum satırı «N dersin
  çevirisi yok ya da eski» der. «Metinleri Fransızcaya çevir» (`data-hb-cevir`) hocanın
  elle yazdığı bülten metnini paragraf paragraf makineye gönderir; dil `fr`, yayın kapalı
  kalır, hoca kontrol edip kaydeder.
- **Komut satırı:** `HOCA_EPOSTA=… HOCA_SIFRE=… npm run defter:cevir` (kuru liste),
  `-- --yaz` (yazar), `-- --ref UC-2026-0016`, `-- --kalip` (makinesiz), `-- --yeniden`
  (güncel olsa da makine/karma çevirileri yeni motorla yeniler; kalıp çevirilere dokunmaz;
  14 Eyl 2026 öğleden sonra 9 makine/karma çeviri Gemini ile yenilendi). Ekran açılmadan
  önce yazılmış kayıtlar, başarısız çeviriler ve eskiyen çeviriler bununla kapatılır;
  14 Eyl 2026'da 6 Fransızca öğrencinin 21 kaydı çevrildi (12 kalıp, 8 makine, 1 karma).
- **Bilinçli sınırlar:** veli defter içeriğini yalnız haftalık bültenden görür (çeviri
  belgesi veliye doğrudan açılmadı); Google Translate serbest cümlede cinsiyet tahmin
  edebilir («Il n'était pas en classe») — Gemini istemi «votre enfant» der, yedek motora
  düşünce bu güvence yoktur, kalıp cümleler hiç tahmin etmez; paragraf boşlukları çeviride
  tek boşluğa iner; makine çevirisi derneğin Apps Script'i üzerinden Gemini'ye (yedekte
  Google Translate'e) adlar gizlenmiş hâlde gider, kapatınca yalnız kalıp cümleler çevrilir.
- Testler: `tests/defter-ceviri.test.mjs` (7: başlık sözlüğü, kalıp eksiksizliği,
  bölümleme, yöntemler, güncellik + Fransızca bülten, uç istemcisi yeniden deneme, ad
  gizleme), `tests/gas-ceviri.test.mjs` (5, `npm run test:gas-ceviri`, dogrula zincirinde:
  motor seçimi, Gemini istek gövdesi, düşüş zinciri, sınırlar/yetki, `ceviri-ayar` ucu),
  `tests/web/ders-defteri.spec.mjs` («Veli dili Fransızca…», «Fransızca aile: yeni
  bülten…»), kural testi «ceviriler alt koleksiyonu».

## Doldurulmamış defterler — tek ekran ve kuyruk (14 Eyl 2026)

Rıdvan: «Hangi gün hangi öğrencinin hangi dersi doldurulmamış, tek ekranda göreyim;
ekran beni yönlendirsin, gidip kolayca doldurayım.»

- **Nerede:** başlıktaki günün özetinde «N doldurulmamış defter kaydı (g gün · ö öğrenci)»
  düğmesi (`data-hero-eksik`, girişten sonra arka planda hesaplanır) ve defter sekmesinin
  üstünde «Doldurulmamış defterler N» (`data-dd-eksikler-ac`). Liste görünümü defter
  panelinin içindedir (`gorunum = "eksikler"`), yeni sekme yok.
- **Hesap** (`src/lib/ders-defteri.ts`): `katalogGunleri` → `defterEksikleri(db, refler,
  gunler, bugun)` → saf `eksikleriHesapla`. Bugün dâhil geçmiş ders günleri × aktif öğrenci
  × ders; kaydı olmayanlar gün → öğrenci → ders sırasıyla, her biri yoklama ipucuyla
  (`yoklama`: var/yok/mazeret/gec/''). Kimsenin kaydı ve yoklaması olmayan gün «ders
  yapılmamış» sayılır (`bosGunler`; plandaki 5–6 Eylül böyle), toplama girmez, listenin
  altında notla gösterilir. Öğrenci başına tek okuma (kayıt kimlikleri), gün başına bir
  yoklama.
- **Yönlendirme:** ders düğmesi (`data-dd-eksik="ref" data-dd-eksik-ders="id"`) defteri o
  öğrenci/gün/dersle açar ve listedeki kalan eksikler kuyruk olur: «Kaydet ve sonraki»
  sıradaki eksiğe gider (gün ve öğrenci değişebilir); formun üstünde «Sıradaki eksik: …» +
  «Sıradakine geç» (`data-dd-kuyruk-sonraki`). «Sırayla doldur» (`data-dd-eksik-basla`)
  ilk eksikten başlar. Gün başlığındaki «Gelmeyenlerin n kaydını aç» (`data-dd-eksik-toplu`)
  yoklamada Yok/Mazeretli olanları `topluGelmediYaz` ile açar (+ Fransızca çeviri belgesi).
- Kaydedilen / açılan ders listeden yerelde düşer (`eksikDus`), başlık sayısı `eksikDegisti`
  ile güncellenir; «Yenile» yeniden okur. Testler: `tests/defter-eksik.test.mjs`,
  `tests/web/ders-defteri.spec.mjs` («Doldurulmamış defterler…»).

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
İlk entegrasyonun katalog/depo `sayfa` alanı 51–311 aralığını taşır ve kayıt
kimliğinin parçasıdır. Güncel **324 sayfalık Sürüm 3'te dersler 55–315** arasındadır.
15 Eylül 2026'da `Surum-3/sayfa-haritasi.json` ve PDF'lerle doğrulanıp ekran ile
yazdırma yönlendirmesi `src/lib/basili-defter.ts` üzerinden ders numarasına bağlandı.
Firestore'daki eski alan, kayıt sürümleri ve çeviriler korunur; veri göçü gerekmez.
`test:ogrenme` eski kimlik sözleşmesini ve yeni fiziksel sayfayı ayrı ayrı sınar.
Kitap yeniden üretilip sayfaları değişirse bu eşleştirme gözden geçirilmelidir.
Katalog hoca sekmesi açılınca yüklenir.

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

### 15 Eylül 2026 — doldurulmuş defter ve baskı kontrolü

- Dernek hesabıyla salt okunur canlı denetim: 18 aktif öğrenci, 12 aile; güncel kayıt defteri ile portal eşleşti. Dört ders gününde 216/216 kayıt tamam, yoklama çelişkisi yok; 72/72 Fransızca çeviri güncel.
- Bültenler ana koleksiyon sayısıyla ölçülmez: `bultenler/{ref}/haftalar` alt koleksiyonları tarandı. Üç öğrenciye ait beş yayımlanmış bülten var; hepsinin dili aile tercihine uygun. Diğer 15 öğrenci için henüz yayımlanmış bülten yok. Bu denetim yeni bülten veya e-posta göndermedi.
- Sürüm 3: 18 kişisel defter + boş şablon = 19 PDF / 6.156 sayfa. Üretim verisindeki 216 kayıt ve çeviriler canlı metinlerle eşleşti. Yeniden üretim gerekmiyor. A4, qpdf, bağımsız plan denetimi, yazdırma ön ayarları ve OneDrive SHA-256 eşleşmeleri 19/19 geçti.
- Hoca ekranı ve yazdırılabilir arşiv, fiziksel ders sayfalarını artık 55–315 gösterir; dijital kayıtların eski kimliği ve sürümü korunur. Boş örnek verilerle 390 px koyu ve 1440 px açık görünüm incelendi; taşma yok.
- `npm run dogrula:codex` çalıştırıldı: tasarım, tip/derleme/denetimler ve bağımsız güvenlik/e-posta/otomatik kayıt/öğrenme paketleri geçti. 412 web testinden 411'i ilk taramada geçti; tarama sırasında güncellenen basılı sayfa beklentisi bir işçide eski yüklenmişti. Son kaynakla yeniden `npm run check` (0 hata/uyarı), `npm run build` (873 sayfa) ve ders-defteri/kayıt/bülten testleri **88/88** geçti. Son derlenmiş önizlemede taslak silme ve kurs günlüğü ayrıca sınandı; gerçek form gönderilmedi.
- Fiziksel baskı/spiral cilt yapılmadı; gerçek iPhone/Safari testi yok. Baskı kontrol notu yalnız kurs arşivindeki `Surum-3/BASKI-KONTROL-2026-09-15.md` içindedir; kişisel PDF'ler siteye alınmadı.

`tests/web/ders-defteri.spec.mjs`: telefon/masaüstü kayıt, sonraki ders, yeniden
yükleme, kesinti, çakışma, vazgeçme, seçili öğrenci çıktısı, JSON, bültene aktarım,
açık/koyu tema ve axe. `tests/kurallar/firestore.test.mjs`: yalnız demo emülatöründe
yetki, sürüm, gerçek transaction ve seçili öğrenci temizliği. `test:ogrenme`:
261 ders/sayfa eşleştirmesi. Gerçek öğrenci hesabına test kaydı yazılmaz.

14 Eylül 2026 (defter çevirisi): `npm run test:ceviri` 6/6, `npm run test:kurallar`
41/41, `astro check` 0 hata, üç hoca ekranı Playwright dosyası 60/60; kurallar
`npm run firebase:kurallar` ile yayımlandı; Apps Script v34 canlı
(`defterCeviri: true`); canlı uçta gerçek hoca belirteciyle çeviri sınandı.

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
