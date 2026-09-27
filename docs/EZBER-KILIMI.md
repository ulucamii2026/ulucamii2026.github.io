# Ezber Kilimi

Karar tarihi: 26 Eylül 2026 (Rıdvan, 11 turluk planlama). Durum: **Faz 1a tamam; seviye listesi v3 kesin (81 madde,
27 Eylül 2026); Faz 1b sürüyor**. Ana plan: [2026-09-26-ezber-kilimi-ana-plan.md](superpowers/plans/2026-09-26-ezber-kilimi-ana-plan.md);
Faz 1a planı: [2026-09-27-ezber-kilimi-faz-1a-katalog.md](superpowers/plans/2026-09-27-ezber-kilimi-faz-1a-katalog.md);
platform: [Eğitim platformu](EGITIM-PLATFORMU.md). Yayın kanıtları: [Yayın kayıtları](YAYIN-KAYITLARI.md).

## Bağlayıcı kararlar (özet)

| Konu | Karar |
|---|---|
| Kitle | Hafta sonu çocuk kursu + yetişkinler (portala öğrenci olarak eklenir) + genel cemaat |
| Kapsam | Yıllık plandaki bütün ezberler + namaz ekleri (Âyetü'l-Kürsî, İnşirâh, 32 farz, tesbihat) + Amme cüzü |
| Seviyeler | 7 şerit (namaz kılabilme sırası) + 8. şerit Amme + kenar suyu (seviye dışı, dönemlik) |
| Yıllık plan | **Değişmez.** Plan tarihleri öğrencinin önünde «sınıf hedefi» olarak görünür; öğrenci kendi hızında ilerler |
| Takip | Hoca işler, veli görür. 4 basamak: Çalışıyor → Hocaya okudu → Pekişti (≥ 1 hafta) → Kalıcı (≥ 1 ay). Kalite: Tam / Az hatalı / Tekrar gelsin + kısa not |
| Veliye not | Yumuşak dil («Çok güzel okudu», «Küçük düzeltmelerle geçti», «Bir kez daha çalışalım»); Fransızca konuşan aileye çeviri |
| Karşılaştırma | Öğrenciler arasında sıralama yok |
| Eşikler (onaylı öneri) | Rozet: seviyedeki tümü ≥ Hocaya okudu · Sertifika: tümü ≥ Pekişti · Altın kenar: tümü Kalıcı · «Tekrar gelsin» bir basamak düşürür (en az 1), 7 gün sonra yeniden kontrol |
| Görsel dil | Metafor «Ezber Kilimi / Ezber Kilimim»; Anadolu kilim motifleri + İslâmî geometrik desen. Canlı figür ve hayvan yok; tek istisna yüzsüz küçük insan siluetleri. Peygamber ve sahabe çizilmez; çizimlerde Arapça yazı yok. Çizimler saf vektör (Codex), `npm run denetim:svg` |
| Ses | Sûreler **yalnız Diyanet**; dualar namaz.diyanet.gov.tr. Diyanet kaydı olmayan **Kur'an dışı** metinde yapay ses yalnız hoca onayıyla ve arayüzde notla |
| Genel cemaat | İsteğe bağlı hesap (e-posta bağlantısı + Google); yaş sorulmaz; ilerleme öz sınavla; «Hesabımı sil»; 24 ay hareketsiz hesap silinir; hesapsızsa ilerleme cihazda |
| Takvim | Faz 1 sınıf (17 Ekim 2026 canlı; ilk plan ezberi 18 Ekim) → Faz 2 herkese açık bölüm (Kasım) → Faz 3 hesaplar/belgeler/e-posta (Aralık) → Faz 4 taşıma (Ocak–Mart 2027) |

## Kaynak dayanağı (27 Eylül 2026 araştırması)

Tam rapor ve kaynakça: [EZBER-SEVIYE-KAYNAK-ARASTIRMASI.md](EZBER-SEVIYE-KAYNAK-ARASTIRMASI.md) (yerel arşiv `D:\ihtisas`
önce, resmî Diyanet siteleri sonra).

- Diyanet'in ayrı bir hafta sonu kursu programı yok. En yakın modeller: çocuk için 7–10 Yaş (2024) ve 11–14 Yaş (2025);
  yetişkin için İhtiyaç Odaklı Temel (2026). Kademeli (kur) ezberin tek örneği Camilerde Kur'an Öğretim Programı (2010, 3 kur).
- Bütün programların ilkesi: «namazlarını kılabilecek düzeyde sure ve dua öğrenmelerine öncelik»; sıra «örnek»tir,
  öğretici değiştirebilir. Seviyelerin «namaz kılabilme sırası» bu ilkeye dayanır.
- Hanefî hüküm (Diyanet İlmihali c. 1 s. 240–255): farz iftitah tekbiri ve kıraat; vâcip Fâtiha, zamm-ı sûre, Tahiyyât,
  selâm, vitirde kunut; sünnet Sübhâneke, Eûzü-Besmele, tesbihler, tesmî-tahmîd, salavât, dualar. Farzın ilk iki
  rekâtında aynı sûre ve mushaf sırasına aykırılık mekruh (s. 260) → 3. şeritte iki kısa sûre (İhlâs, Kevser).
- Kunut bilmeyen vitirde Rabbenâ âtinâ ya da üç kez «Allâhümmağfir lî» okur (s. 305–306) → 4. şeritte not.
- 32 farz: Dînî Kavramlar Sözlüğü s. 534, DİYK fetvası no. 815 → 1. ve 2. şeritte tamamlanır.

## Katalog (tek kaynak)

| Dosya | İçerik |
|---|---|
| `src/data/ezber/katalog.json` | Seviye tanımları (ad + amaç, beş dilde) ve maddeler |
| `src/data/ezber/katalog.schema.json` | Şema (draft-07); çapraz alan kuralları `tests/ezber-katalog.test.mjs` içinde |
| `src/data/ezber/plan-eslesme.json` | Yıllık plandaki serbest ezber dizesi → katalog kimlikleri (dizi) |
| `src/data/ezber/eski-kimlikler.json` | `ezberListesi` (eski `EZBER_LISTESI.id`, ev çalışması `ezber-<id>`), `seviyeTesti` (`ez01…ez14`) ve `eskiPlan` (planın git geçmişindeki eski yazımları) → katalog kimlikleri |
| `src/lib/ezber/katalog.ts` | Tipli erişim: `KATALOG`, `ezberBul`, `seviyeOgeleri`, `planKimlikleri`, `eskiKimliktenYeni`, `eskiEzberGecisi`, `sinifHedefleri` |

**Kurallar**
- **Kimlik:** `s-` sûre/âyet, `d-` dua (Kur'an'dan olan dualar dahil), `b-` bilgi; küçük ASCII, `-` ayraç.
  Öneki türle aynı olmalı. Faz 1 yayına girdikten sonra bir kimliğin **anlamı değişmez ve kimlik başka madde için
  yeniden kullanılmaz** (Firestore kayıtları kimliğe bağlıdır). Madde bölünür ya da birleşirse yeni kimlik açılır; eski
  kimlik katalogdan ancak `eski-kimlikler.json`'da yeni bir bölümle (ör. `katalog`: eski → yeni kimlikler) eşlenip
  kayıtlar kuru çalıştırılan betikle taşındıktan sonra çıkar ve `surum` artar. O bölüm, `EskiKaynak` türüne ve teste
  ilk böyle değişiklikte eklenir. Faz 1 yayınından önce kimlikler serbestçe düzeltilebilir.
- **Seviye ve sıra:** `seviye` 1–8 ya da `kenar`; her seviyede `sira` 1'den başlar, kesintisizdir. Kenar suyunda sıra
  sınıf hedefi tarihine göredir; planda olmayan kenar maddeleri sona gelir.
- **Durak (yalnız Amme):** 8. şeritteki her madde `durak` (1–5) taşır; sıra boyunca geri gitmez (test). Öbür
  şeritlerde `durak` yoktur.
- **`kuranMetni`:** Kur'an metni olan her madde (Kur'an'dan olan dualar dahil; ör. Rabbenâ âtinâ = Bakara 201) `true`
  taşır. Bu bayrak yapay ses yasağının ve «yalnız Diyanet» kuralının dayanağıdır. Sûrelerde `kuran` (sûre + âyet
  aralığı, Diyanet mushafı sayımı) zorunludur.
- **Ses:** yalnız `docs/dinleme-ses-kaynaklari.json`'da kaydı olan ve sha256'sı tutan dosya bağlanır; kaynak Diyanet
  alan adıdır, sûre sesi Kur'an sunucusundandır. Tek resmî dosyadan kesilen seste `kesim` (saniye) ve `ozgunSha256`
  zorunludur (test: Kunut 1–2, Rabbenâ âtinâ / Rabbenağfirlî). Âyet parçaları sırayla `parcalar`'dadır ve `kuran`
  aralığıyla birebir aynıdır (test). **`1-0` eûzü (istiâze) kaydıdır; `1-1` besmeledir = Fâtiha'nın 1. âyeti** (Kûfe
  sayımı). Birleşik sûre kayıtları (`sureler/*.mp3`) `1-0` + `1-1` ile başlar (Fâtiha'da yalnız `1-0`); `1-0` hiçbir
  sûrenin âyet parçalarına girmez, yalnız `d-euzu-besmele`'de `1-1` ile birlikte durur.
- **Âyet sayıları:** Diyanet mushafı (Kûfe sayımı); katalogda geçen 41 sûrenin sayısı testte tablo olarak durur ve
  27 Eylül 2026'da Diyanet'in âyet ses dosyalarıyla doğrulandı (`{sûre}_{n}.mp3` var, `{sûre}_{n+1}.mp3` yok).
- **Adlar:** beş dilde zorunlu. Tek karşılığı olan 17 eski maddenin adları `src/lib/ezber-verisi.ts` ile birebir
  aynıdır (test korur; `salli-barik` ve `rabbena` ikişer maddeye bölündü). Türkçe sûre adları kuran.diyanet.gov.tr /
  Kur'an Yolu başlıklarıyla aynıdır (kesme işareti ’); tek istisna «Mâûn Sûresi» (eski Ezber Odası adı korunur; Kur'an
  Yolu başlığı «Maûn»). NL/DE din terimleri [DIL-NL-DE.md](DIL-NL-DE.md) sözlüğüne uyar (abdest = wudu, gusül = ghusl).
- **`not`:** maddeye özgü uyarı (ör. ezan kaydının sabah ezanı olması); hüküm bildiren not kaynak gösterir
  (ör. «Diyanet İlmihali c. 1 s. 399»).
- **Örtüşen maddeler:** `s-alak-1-5` (kenar suyu: ilk vahiy, Kadir Gecesi dersi) `s-alak`'ın (8. şerit) ilk beş
  âyetidir; ikisi ayrı ilerleme tutar. Faz 1b önerisi: `s-alak` bir basamağa ulaşınca `s-alak-1-5` en az o basamakta
  **gösterilir** (türetilir, ayrıca yazılmaz); tersi geçerli değildir.

## Madde ekleme / değiştirme

1. `katalog.json`'da maddeyi ekle ya da düzelt (sıralar kesintisiz kalsın).
2. Yıllık plandaki ezber dizesi değişti ya da eklendiyse `plan-eslesme.json`'u güncelle; test, plandaki her dizenin
   eşlendiğini ve fazlalık olmadığını denetler. Plandan **kalkan** dize silinmez, `eski-kimlikler.json` → `eskiPlan`'a
   taşınır (hoca ekranının eski kayıtları dizeyle anahtarlıdır).
3. `npm run test:ezber` → yeşil. `npm run ezber:tablo` (isteğe bağlı `-- --dil fr`) ile tabloya bak.

## Eski kayıtların geçişi (Faz 1b kuralları, 27 Eylül 2026)

Bugünkü hoca ekranı ezber durumunu `ilerleme/{ref}.ezber` içinde **plandaki serbest dizeyle** anahtarlar (değerler
`baslamadi` · `tekrar` · `ogrendi`). Yeni sistem `ezberDurum`'a katalog kimliğiyle yazar. Geçiş şu kurallarla yapılır:

1. **Tek çekirdek:** `eskiEzberGecisi(ilerleme.ezber)` (saf işlev, testli). Anahtar önce bugünkü planda
   (`plan-eslesme.json`), sonra planın eski yazımlarında (`eski-kimlikler.json` → `eskiPlan`) aranır. Ev çalışması
   `ezber-<id>` → `eskiKimliktenYeni('ezberListesi', id)`; seviye testi → `eskiKimliktenYeni('seviyeTesti', 'ez..')`.
2. **Önce kuru çalıştırma:** eşleşmeyen anahtar ya da tanınmayan durum değeri varsa betik listeyi yazar ve **durur**;
   hiçbir kayıt yazılmaz. Eksik eşleme eklenip `npm run test:ezber` yeşil olunca yeniden çalıştırılır.
3. **Aynı maddeye birden çok dize** (bugün 7 madde: kelime-i tevhid, kelime-i şehâdet, Âmentü, Kadir Gecesi duası,
   Rabbenâ âtinâ, namaz niyeti, tesbihat): **en ileri durum** alınır. Yeni basamaklar (Pekişti ≥ 1 hafta, Kalıcı ≥ 1 ay)
   yeniden dinlemeyi zaten istediği için fazla tahmin kendiliğinden düzelir; eksik tahmin çocuğun emeğini siler.
4. **Bilerek karşılıksız:** «Salât-ı ümmiye (kısa salavat)» (planın 3–12 Eylül 2026 sürümlerinde vardı; katalogda
   maddesi yok, Rıdvan'ın kararı bekleniyor) taşınmaz; değeri eski alanda kalır.
5. **Eski alan salt okunur kalır**, silinmez; yeni ekran yalnız `ezberDurum`'a yazar.
6. Eski durumun yeni basamağa çevrilmesi Faz 1b planında kesinleşir. Öneri: `ogrendi` → Hocaya okudu,
   `tekrar` → Çalışıyor, `baslamadi` → kayıt açılmaz.

Planın eski yazımları git geçmişinden çıkarıldı (`src/data/yillik-plan-2026-2027.json`, bbddea8…a4b802b): bugünkü
49 dizenin dışında yalnız iki dize var («Telbiye: Lebbeyk Allahümme lebbeyk…» → `d-telbiye` ve Salât-ı ümmiye). Plan
yeniden üretildiğinde (müfredat değişikliği) kaybolan her dize `eskiPlan`'a eklenir; test, `eskiPlan` anahtarlarının
bugünkü planda olmadığını ve hepsinin katalogdaki bir kimliğe gittiğini denetler.

## Bilinen açıklar (27 Eylül 2026)

- `public/media/ses/dualar/rabbena.mp3`: kaynak kaydı yok ve Diyanet'in özgün «Rabbenâ duaları» dosyasıyla aynı kayıt
  değil (ilinti 0,04). Yeni katalog onun yerine özgünden kesilmiş `rabbena-atina.mp3` (0–12 sn) ve `rabbenagfirli.mp3`
  (12–21,9951 sn) dosyalarını kullanır; `kesim` + `ozgunSha256` 27 Eylül 2026'da kayda işlendi (ilinti 0,998). Makine
  dökümü ve sessizlik kesitleri: ilk kesit Bakara 201 «…ve kınâ azâbe'n-nâr»da biter, «bi rahmetike…» eki yoktur;
  hocanın bir kez dinleyerek teyidi yeterlidir. `rabbena.mp3` ve iki kaydın birleşimi `sallibarik.mp3` yalnız eski
  Ezber Odası'nda (`ezber-verisi.ts`) kalıyor; Faz 1d'de Ezber Odası kataloğa bağlanınca düşer (test katalogda yasaklar).
- `public/media/ses/dualar/ezan.mp3` Diyanet'in **sabah ezanıdır**; katalogda `not` ile belirtildi. Diğer vakitlerin
  ezanı Faz 2'de Diyanet'ten eklenir.
- 54 maddenin Diyanet sesi henüz yok (Amme'nin çoğu, iman cümleleri, tesbihler, tekbir, selâm, kenar suyu); Faz 2 ses işi.
- Yeni maddelerin FR/EN/NL/DE adları ilk taslaktır; ana dili konuşan okuması Faz 2'de.
- `npm run test:ezber` yalnız yerel `dogrula` zincirinde koşuyor; Faz 1b'de kimlikler Firestore anahtarı olunca
  `.github/workflows/deploy.yml` kapısına eklenir.
- Eski Ezber Odası'nın Arapça metinleri Diyanet yazımında değil (genel mushaf yazımı); Faz 2'de katalog metinleri
  resmî yayından alınınca Ezber Odası da kataloğa bağlanır. Fâtiha'nın **âyet numaraları** 27 Eylül 2026'da Medine
  sayımından Diyanet (Kûfe) sayımına çevrildi: besmele ﴿١﴾, «…الضالين» ﴿٧﴾ (portal besmeleyi serlevhada gösterir,
  metin ﴿٢﴾'den başlar; test korur).
- Kurs müfredatındaki «Amme Cüzü Satırları — Elifbâ s. 32–33» atfı yanlış (s. 32 Fâtiha, s. 33 Bakara'nın başı). Kaynak
  OneDrive'daki müfredat belgesidir; yıllık plan ve müfredat çıktıları elle düzenlenmez → kaynakta düzeltilip yeniden
  üretilmeli (Rıdvan'ın kararı).
- Seviye testindeki «Diyanet 2025 programı sırasını izler» ifadesi yanlıştı (program lise çağı yatılı öğrenciler
  içindir); 27 Eylül 2026'da `ezber.ts` yorumu ve [SEVIYE-TESTI.md](SEVIYE-TESTI.md) notuyla düzeltildi.

## Faz 2'ye kalan metin kararları (kaynaklar arası farklar)

1. Sübhâneke'deki «ve celle senâük»: Elif-Bâ'da notsuz var; Namaz İlmihali «yalnız cenaze namazında» der. Öneri:
   Temel Dinî Bilgiler modeli (parantez + not).
2. Ezan duasının son cümlesi («inneke lâ tuhlifü'l-mîâd») Beyhakî ziyadesidir; öneri Buhârî metni + not.
3. Rabbenâ âtinâ âyetle (Bakara 201) biter; «bi rahmetike…» ayrı, isteğe bağlı ek (namaz.diyanet.gov.tr kaydı da
   âyetle biter). Rabbenağfirlî yalnız İbrâhîm 41.
4. Meâlle kıraat: Diyanet İlmihali s. 243 «öğreninceye kadar caiz», Namaz İlmihali «geçersiz» — Fransızca konuşan
   yeni Müslümanlar için hoca notu gerekir (hocanın ve Rıdvan'ın kararı).
5. Katalog metinleri arşivden kopyalanmaz; resmî yayından (kuran.diyanet.gov.tr, Elif-Bâ, namaz.diyanet.gov.tr) alınır.

## Onay durumu

- **27 Eylül 2026 — seviye listesi v3 kesinleşti (81 madde).** Rıdvan kararı devretti («bütün yetki ve karar sende,
  full otonom ilerle»); açık seçenekler [araştırmaya](EZBER-SEVIYE-KAYNAK-ARASTIRMASI.md) (§I.3–I.6) dayanarak
  şöyle karara bağlandı:
  1. **Seçenek A kaldı** (Kunut 7. şeritte, 4. şeritte Rabbenâ yedeği). Şeritler namaz kılabilme sırasıdır; kunutu
     henüz bilmeyen vitri Rabbenâ ile kılabilir (İlmihal c. 1 s. 305–306). B, yıllık planın sırasını da bozardı.
  2. **İnşirâh 6. şeritte kaldı:** yaygın namaz sûresidir, eski Ezber Odası listesinde de vardı.
  3. **Amme 5 durağa bölündü** (`durak`: 10 + 4 + 4 + 4 + 3 sûre, §I.4). 25 sûrelik tek şerit çocuk için çok uzun;
     durak, rozet ve kilim bölmesi olur.
  4. **Kenar suyuna aşır üçlüsünün iki parçası eklendi:** `s-bakara-285-286` (Âmene'r-Resûlü) ve `s-hasr-22-24`.
     Diyanet programlarının hepsinde Âyetü'l-Kürsî'yi izler; Namaz İlmihali (DİB) sabah-akşam ve yatsı sonrası okur.
     «Rabbi yessir» eklenmedi: hadis kaynağı doğrulanamadı.
  5. **Salât-ı ümmiye eklenmedi:** metni doğrulanamadı; eski kayıt `eskiPlan`'da bilerek karşılıksız kalır.
  6. **32 farz 6 bilgi maddesi olarak kaldı** (1. şeritte imanın ve İslâm'ın şartları; 2. şeritte abdestin, guslün,
     teyemmümün ve namazın farzları).
  7. **Yemek duası kenar suyunda kaldı:** şeritler namaz sırasıdır; günlük dua kenar suyunda yerini korur.
- Faz 1 yayınından önce seviye ve sıra değişikliği serbesttir; sonra kimlik kuralı geçerlidir (yukarıda).
