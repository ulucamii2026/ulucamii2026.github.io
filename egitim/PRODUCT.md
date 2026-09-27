# Product

<!-- impeccable:product-schema 1 -->

> Kaynak: Rıdvan'ın 26 Eylül 2026 kararları (ana plan `docs/superpowers/plans/2026-09-26-ezber-kilimi-ana-plan.md`
> §2, `docs/EGITIM-PLATFORMU.md`, `docs/EZBER-KILIMI.md`). Bu kayıt 27 Eylül 2026'da ayrı bir soru turu olmadan
> yazıldı: Rıdvan o gün bilgisayar başında değildi ve bütün kararları devretti («bütün yetki ve karar sende, full
> otonom ilerle»). Belgelerde doğrudan karşılığı olmayan her cümle **[çıkarım]** diye işaretlidir; Rıdvan
> düzeltirse bu dosya güncellenir.

## Platform

web

## Stack

Karar (onaylı plan, 26 Eylül 2026): aynı depoda ikinci Astro uygulaması `egitim/` — `output: 'static'`,
TypeScript strict, ana sitenin `src/` kodu `@ortak/*` takma adıyla, kök `node_modules` ortak. Etkileşim ana sitedeki
gibi framework'süz TS modülleri (`data-*` kancaları); gerektiğinde Preact adacığı. Barındırma Firebase Hosting
(proje `ulucamii-portal`, Spark planı: Cloud Functions yok). Ses dosyaları ana siteden (ulucamii.be) gelir; platform
yalnız HTML, JS, SVG ve font taşır.

## Users

Marche-en-Famenne (Belçika) Ulu Camii'nin eğitim işlerini kullanan beş kitle:

- **Hoca** (tek ortak hoca hesabı): hafta sonu kursunda sınıfta öğrencileri tek tek dinler ve ezberi telefonundan
  işaretler; aynı ekranda ders defterini yazar. Ekran telefon önceliklidir, bağlantı kopsa da çalışır.
- **Öğrenciler (çocuk):** hafta sonu Kur'an kursu — 2026-27'de 21 öğrenci, tek sınıf, Türkçe ve Fransızca konuşan
  aileler. Çocuk kendi kilimini velisinin hesabından ve Ezber Odası'ndan görür. **[çıkarım]** Okul çağındadırlar;
  kesin yaş aralığı belgelenmedi.
- **Veliler:** portalda çocuklarının ilerlemesini ve hocanın yumuşak dilli notunu görür, cuma e-postasında haftalık
  özeti alır. İletişim dili kayıt formunda seçilir (Türkçe ya da Fransızca) ve her şey o dilde gider. **[çıkarım]**
  Çoğunlukla hafta içi akşamları telefondan bakarlar.
- **Yetişkin öğrenciler:** portala öğrenci olarak eklenir, kendi e-postasıyla girer; seviye testinin «ezbere
  biliyorum» cevapları yalnız öneri olarak aktarılır, hoca teyit eder. **[çıkarım]** Aralarında yeni Müslümanlar ve
  Fransızca konuşanlar çoktur (yetişkin eğitimi kitabı Fransızca basıldı).
- **Genel cemaat ve ziyaretçi:** hesapsız çalışır (ilerleme cihazda kalır) ya da isteğe bağlı hesap açar (Faz 3);
  ilerlemesini öz sınavla kaydeder. Yaş sorulmaz.

## Product Purpose

egitim.ulucamii.be, Ulu Camii'nin eğitim işlerini tek, profesyonel bir platformda toplar. İlk bölüm **Ezber
Kilimi**'dir: namaz sûreleri, namaz duaları, temel bilgiler ve Amme cüzünden oluşan tek ezber kataloğu, öğrenci
başına takip, velinin gördüğü kişisel kilim ve herkese açık çalışma sayfaları. Sonra (Faz 4, Ocak–Mart 2027) Kur'an
kursu sayfaları, veli portalı ve hoca ekranı, seviye testi ve yetişkin eğitimi, muhtedi eğitimi, vaazlar, irşat ve
UİP kademeli olarak buraya taşınır.

Başarı: hoca sınıfta birkaç dokunuşla dinlemeyi kaydeder; veli çocuğunun nerede olduğunu anlaşılır ve güzel bir
biçimde görür; öğrenci ve cemaat Diyanet metni ve sesiyle kendi hızında çalışır; platform kurumu en profesyonel
biçimde tanıtır.

## Positioning

- **Kilim metaforu, gerçek dinlemeye bağlı:** her ezber öğrencinin kilimine bir motif dokur — kontur (çalışıyor)
  → yarı dokunmuş (hocaya okudu) → renkli (pekişti, ≥1 hafta sonra) → altın kenar (kalıcı, ≥1 ay sonra). Basamağı
  hoca ilerletir; evdeki tekrar görünür ama resmî basamağı değiştirmez. Ezber Sertifikası yalnız hocanın dinlediği
  ezberlere verilir.
- **Tek kaynak Diyanet:** Kur'an metni, meâl ve sesler yalnız Diyanet İşleri Başkanlığı'nın resmî kaynaklarından;
  Arapça Türk mushaf usulüyle (çeker esre, çeker üstün, Türk vakıf işaretleri) gösterilir.
- **Gerçek bir cami ve kurs:** yıllık plan, sınıf hedef haftaları, hoca notları ve basılı materyal aynı sistemden
  beslenir; beş dilde (tr, fr, en, nl, de).
- **Kıyas yok:** öğrenciler arasında sıralama, puan tablosu, seri ya da yarış yoktur; herkes yalnız kendi ilerlemesini
  görür.

## Operating Context

- Hafta sonu kursu, tek sınıf; ilk plan ezberi 18 Ekim 2026. Hoca dinlemeyi sınıfta telefondan işaretler; kayıt
  ders defterine bir cümle olarak da düşer. Yazımlar bağlantı gelince gider; ulaşmayan kayıt hocaya söylenir.
- Veli bilgisi: veli portalı + haftalık cuma e-postası («Bu hafta ezber» özeti, kurs e-posta şablonu v2, iletişim
  dili).
- Kalite ve not: Tam / Az hatalı / Tekrar gelsin + kısa not; veliye yumuşak dille görünür («Çok güzel okudu»,
  «Küçük düzeltmelerle geçti», «Bir kez daha çalışalım»); Fransızca konuşan ailelere çevirisi gider.
- Basılı materyal A4 ev yazıcısında, vektör PDF: kişisel kilim çıktısı, ezber kartları (bir sayfada 8 kart, arkada
  ses için kare kod), öğrenci defterinin «Ezber listem» sayfası, dönem sonu ezber karnesi.
- Okunuş sayfa diline göre açılıp kapanır: TR sayfada Türkçe usulü, öbür dillerde Fransızca usulü.
- Çalışma modları (Faz 2): dinle-tekrarla, kademeli gizleme (öz sınav), oyunlar (sıralama, eşleştirme, eksik
  kelime).

## Capabilities and Constraints

- Katalog: `src/data/ezber/katalog.json` (v3, 81 madde) — 7 şerit (namaz kılabilme sırası) + 8. şerit Amme +
  kenar suyu (seviye dışı dönemlik ezberler). Yıllık plan değişmez; plandaki tarih «sınıf hedefi» olarak görünür.
- Veri: Firestore `ezberDurum/{ref}` (sürümlü madde durumları + yalnız eklenen olaylar); kurallar emülatörde
  sınanır. Hoca ekranı çevrim dışı önceliklidir.
- Sesler: sûreler yalnız Diyanet'ten; dualar namaz.diyanet.gov.tr'den. Diyanet kaydı olmayan **Kur'an dışı** metinde
  yapay ses ancak hoca onayından sonra ve arayüzde notla.
- Güvenlik başlıkları (CSP, HSTS, `X-Content-Type-Options`); Spark planı sınırları; hesap açma Faz 3'te, kural
  denetimi ve rastgele kullanıcı testleri yeşil olunca.
- Terimler: Ezber Kilimi / Ezber Kilimim, şerit, kenar suyu, basamak (Çalışıyor, Hocaya okudu, Pekişti, Kalıcı),
  Ezber Odası, Ezber Sertifikası, Çalışma Belgesi, ezber karnesi.
- Canlı adımlar (Hosting sitesi, DNS, Auth yetkili alanı, kural yayını) her biri ayrı onay ister.
- Taşınmayanlar: İhtida (sayfa, form, EK-9/EK-10) ulucamii.be'de kalır; `ihtida.ulucamii.be`'ye dokunulmaz.
- Açık kararlar: Faz 2 çalışma modlarının ayrıntısı; Faz 3 hesap akışının arayüzü; Faz 4 taşıma sırası içindeki
  tarih.

## Brand Commitments

- Kurum: Ulu Camii Marche-en-Famenne (Diyanet Belçika'ya bağlı dernek). Eğitim kitlesine (veli, öğrenci) **kurs
  kimliği** konuşur: kurs logosu ve kurs yeşili; kimlik verisinin tek kaynağı
  `D:\vektorel-calismalar\ulu-camii-kurumsal-kimlik\05-yazisma\kimlik.json` (adlar TR/FR/EN, iletişim bloğu).
- Rıdvan'ın bağlayıcı görsel sözleri (genişletilmeden kaydedildi): «yepyeni ayrı tasarım»; «modern ve ferah,
  çizimlerle sıcak»; «kurs yeşili (#134420) + altın»; Arapça yazı «Türk mushaf hattına yakın»; «görsellik benim için
  önemli… bol bol görsellik».
- Çizim kuralları: vektör önce (piksel yalnız vektörün imkânsız olduğu yerde, ana SVG'den üretilir); canlı figür ve
  hayvan yok — tek istisna yüzsüz küçük insan siluetleri (namaz, rahle); peygamber ve sahabe asla çizilmez; Arapça
  yazı hiçbir zaman çizim olarak konmaz; logo yeniden çizilmez. Motif dili Anadolu kilim motifleri + İslâmî
  geometrik desenler; rozet ve belge çerçeveleri geometrik (girih, sekiz köşeli yıldız, rûmî-hatâyî).
- İletişim bloğu yalnız adres, `info@ulucamii.be`, cami telefonu `+32 472 98 50 73` ve web. Din görevlisinin
  telefonu hiçbir yerde yazılmaz (tek kanal sitedeki `wa.me` bağlantısı; numara metin olarak görünmez).
- Dil: Türkçe tam imlâ; Diyanet terimleri; Fransızca tipografi kuralları.

## Evidence on Hand

- Ezber kataloğu ve kaynak kayıtları: `src/data/ezber/` (katalog, plan eşlemesi, eski kimlikler).
- Diyanet sesleri: ana sitenin yerel varlıkları (kaynak ve sha256 `docs/dinleme-ses-kaynaklari.json`).
- Kilim motifleri (Codex, saf vektör, denetimli): `src/lib/ezber/motifler.ts`; kilim çizici `src/lib/ezber/kilim.ts`.
- Arapça yazı tipi «Ulu Nesih» (Scheherazade New 4.500 alt kümesi, OFL 1.1): `egitim/public/fonts/`.
- Kurumsal kimlik paketi (logolar SVG, renkler, fontlar): `D:\vektorel-calismalar\ulu-camii-kurumsal-kimlik\`.
- Yok ve uydurulmayacak: kullanıcı yorumu, istatistik, başarı yüzdesi, öğrenci ya da çocuk fotoğrafı, gerçek
  öğrenci adı. Örneklerde yalnız uydurma adlar ve `.test` adresleri.

## Product Principles

1. **Kaynağa sadakat önce gelir:** Kur'an metni, meâl ve ses yalnız Diyanet'ten; doğrulanmamış dinî içerik
   yayımlanmaz.
2. **Herkes kendi kilimini dokur:** kıyas, sıralama ve yarış yok; dil övgü ve cesaret verir, «başarısız» demez.
3. **Sınıf önce:** hocanın telefonu en zor ortamdır (gürültü, zaman baskısı, kopuk bağlantı); orada çalışmayan
   tasarım hiçbir yerde çalışmaz.
4. **Beş dil eşittir:** ailenin iletişim dili esastır; Türkçe olmayan sayfa ikinci sınıf değildir.
5. **Çocuk verisi asgaridir:** yaş sorulmaz, fotoğraf alınmaz, yalnız gereken tutulur.

## Accessibility & Inclusion

- Telefon öncelikli; klavye erişimi, açık/koyu tema ve azaltılmış hareket tercihi her ekranda doğrulanır
  (depo kalite kapısı; otomatik axe testi tek başına onay sayılmaz).
- Arapça metin `lang="ar"` ve `dir="rtl"` ile işaretlenir; okunuş ve anlam ekran okuyucuda ayrı okunur.
- Oyunlar sürükle-bırakın yanında dokunarak seçmeyle ve klavyeyle oynanır.
- **[çıkarım]** Kullanıcıların bir bölümü yaşlı cemaat üyeleri ve ikinci dilinde okuyan velilerdir: yazı boyu cömert,
  dil sade, dokunma hedefleri büyük tutulur.
