# Ezber Kilimi

Karar tarihi: 26 Eylül 2026 (Rıdvan, 11 turluk planlama). Durum: **Faz 1a ve 1b tamam (27 Eylül 2026): seviye listesi
v3 kesin (81 madde); durum makinesi, veri modeli, kurallar ve geçiş betiği emülatörde yeşil; Faz 1c sürüyor**. Ana plan:
[2026-09-26-ezber-kilimi-ana-plan.md](superpowers/plans/2026-09-26-ezber-kilimi-ana-plan.md); Faz 1a planı:
[2026-09-27-ezber-kilimi-faz-1a-katalog.md](superpowers/plans/2026-09-27-ezber-kilimi-faz-1a-katalog.md); Faz 1b planı:
[2026-09-27-ezber-kilimi-faz-1b-durum.md](superpowers/plans/2026-09-27-ezber-kilimi-faz-1b-durum.md); platform:
[Eğitim platformu](EGITIM-PLATFORMU.md). Yayın kanıtları: [Yayın kayıtları](YAYIN-KAYITLARI.md).

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
  âyetidir; ikisi ayrı ilerleme tutar. Kural (Faz 1b, `gorunenBasamak`): `s-alak` bir basamağa ulaşınca `s-alak-1-5` en
  az o basamakta **gösterilir** (türetilir, ayrıca yazılmaz); tersi geçerli değildir. Kapsama `kuran` aralığından
  hesaplanır (aynı sûre, aralık içinde); test bugün yalnız bu çifti bulur.

## Madde ekleme / değiştirme

1. `katalog.json`'da maddeyi ekle ya da düzelt (sıralar kesintisiz kalsın).
2. Yıllık plandaki ezber dizesi değişti ya da eklendiyse `plan-eslesme.json`'u güncelle; test, plandaki her dizenin
   eşlendiğini ve fazlalık olmadığını denetler. Plandan **kalkan** dize silinmez, `eski-kimlikler.json` → `eskiPlan`'a
   taşınır (hoca ekranının eski kayıtları dizeyle anahtarlıdır).
3. Madde eklendi ya da kaldırıldıysa `firebase/firestore.rules` → `evCalismalari` → `katalogEzberi()` listesine
   `'ezber-<kimlik>'` ekle/çıkar (test katalogla birebir karşılaştırır) ve kuralları yayına al (`npm run firebase:kurallar`).
4. `npm run test:ezber` → yeşil. `npm run ezber:tablo` (isteğe bağlı `-- --dil fr`) ile tabloya bak.

## Durum makinesi ve veri modeli (Faz 1b, 27 Eylül 2026)

| Dosya | Sorumluluk |
|---|---|
| `src/lib/ezber/durum.ts` | Saf durum makinesi (`dinle`, `ata`, `elleBasamak`, `duzelt`, `gecisDurumu`), okuma süzgeçleri (`ezberDurumuOku`, `olayOku`), `kontrolSirasi`, `gorunenBasamak`, bölüm ve ödül özeti |
| `src/lib/ezber/gecis.ts` | Eski `ilerleme.ezber` → yazılacak geçişler (saf) |
| `src/lib/ezber/depo.ts` | Firestore: `ezberDeposu(db, ref)` (`oku`, `uygula`, `olayKimligi`, `geriAl`, `olaylar`), `ezberSinifi`, `eskiKayitlariTasi`; tam SDK |
| `firebase/firestore.rules` | `ezberDurum/{ref}` + `olaylar`; `evCalismalari` katalog kimlikleri |
| `tests/ezber-durum.test.mjs`, `tests/kurallar/firestore.test.mjs` | Makine ve plan testleri; kural, depo, geçiş ve silme testleri (emülatör) |

**Basamaklar:** 0 yok · 1 Çalışıyor · 2 Hocaya okudu · 3 Pekişti · 4 Kalıcı (kayıtta yalnız 1–4).

| Önceki | Tam / Az hatalı | Tekrar gelsin |
|---|---|---|
| 0 (kayıt yok), 1 | 2, kontrol +7 gün (kontrol günü beklenmez) | 1, +7 gün |
| 2 | kontrol günü geldiyse 3, +30 gün; gelmediyse yalnız olay | 1, +7 gün |
| 3 | kontrol günü geldiyse 4, kontrol yok; gelmediyse yalnız olay | 2, +7 gün |
| 4 | yalnız olay | 3, +7 gün |

- **«Yine de ilerlet»** (`zorla`): kontrol gününden önce 2 → 3 ya da 3 → 4; olayda `zorla: true` kalır.
- **Kontrol günü** o gün dahil gelmiş sayılır. Günler Brüksel ders günüdür (`YYYY-AA-GG`); takvim dönümleri testlidir.
- **Atama** (`ata`): kaydı olmayan madde Çalışıyor olur; kaydı olana dokunulmaz. **Elle düzeltme** (`duzelt`) hedef
  durumu aynen yazar, «geri al» için de kullanılır; 0 kaydı kaldırır.
- **Veliye not:** yalnız kalıp anahtarı (en çok 3, `^[a-z0-9-]{1,40}$`). Serbest metin ezber kaydına girmez; serbest söz
  ders defterinde kalır (oranın çeviri hattı var). Kalıp metinleri beş dilde Faz 1c'de; öğrenci adı hiçbir kalıba girmez.
- **Ödüller** (gösterilen basamakla): rozet = bölümde tümü ≥ 2 · sertifika = tümü ≥ 3 · altın kenar = tümü 4. Bölümler:
  1–8. şeritler ve Amme durakları 8.1–8.5. Kenar suyu seviye dışıdır, ödülü yoktur.

**Firestore**

```text
ezberDurum/{ref}                       hoca yazar · bağlı veli okur · idari kilitte yazım yok
  ogeler.<katalogId>: { basamak 1–4, kalite ''|tam|az|tekrar, notlar [≤ 3 kalıp], son (sunucu zamanı),
                        sonrakiKontrol 'YYYY-AA-GG'|'', surum }
  degisen: <katalogId>                 bu yazımda değişen tek madde (kural yalnız onu doğrular)
  silinenSurum: <int>                  madde kaldırılırken kaldırılan kaydın sürümü (kural sunucudakiyle karşılaştırır)
  guncelleme: sunucu zamanı
ezberDurum/{ref}/olaylar/{otomatik}    yalnız eklenir; güncellenmez; yalnız hoca siler (öğrenci silme)
  ezber, tur atama|dinleme|duzeltme|gecis, kalite, notlar, basamakOnce, basamakSonra, zorla, tarih, zaman
```

- **Neden öğrenci başına tek belge:** sınıf görünümü (Bugün, Tekrar kuyruğu, Tablo) öğrenci başına tek okuma yapar;
  madde başına belge 30 öğrenci × 81 madde = 2.430 okuma olurdu (Spark günlük sınırı 50.000).
- **Yazım başına tek madde:** kural haritada döngü kuramaz; yazım değiştirdiği maddeyi `degisen` ile bildirir, kural
  `diff().affectedKeys()` ile yalnız onun değiştiğini ve biçimini doğrular. Durum ve olay **tek toplu yazımdır**
  (`depo.uygula`): biri reddedilirse ikisi de yazılmaz.
- **Eşzamanlılık:** madde `surum`'u eski + 1 olmalı. Ortak hoca hesabı iki telefonda açıkken farklı maddeler birbirini
  ezmez; aynı maddede eski ekrandan ya da çevrim dışı kuyruktan gelen yazım reddedilir ve `EZBER_CAKISMA` iletisiyle
  ekrana döner (ekran durumu yeniden okur). Madde kaldırma da sürümlüdür (27 Eylül 2026, bağımsız inceleme): yazım
  kaldırılan kaydın sürümünü `silinenSurum` ile bildirir; sunucudaki sürüm o değilse reddedilir. Böylece çevrim dışı
  kuyrukta kalmış «Geri al» ya da eski ekrandaki «Kaydı kaldır», o arada başka telefonun yazdığı kaydı silemez.
- **Sahipsiz olay yok:** olay, durum belgesi yazım sonunda varsa eklenir (`existsAfter`); silinen öğrencinin açık kalan
  ekranı ne durumu yeniden açabilir (öğrenci profili gerekir) ne olay bırakabilir.
- **Silme dökümü:** `portal-idare.ts` «Ezber durumu» ve «Ezber olayları»nı listeler; «ev» kapsamı dokunmaz, «tüm» siler.
- **Ev çalışması:** `evCalismalari` kimlikleri eski 19 `ezber-*` + katalogdaki 81 madde `ezber-<katalogId>` (açık liste).

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
6. **Kesinleşti (27 Eylül 2026, Faz 1b):** `ogrendi` → Hocaya okudu (kontrol geçiş günü + 7; Pekişti yeniden
   dinlemeyle gelir), `tekrar` → Çalışıyor, `baslamadi` → kayıt açılmaz. Yeni sistemde kaydı olan madde **ezilmez**
   (hocanın yeni kaydı her zaman önde). Her taşınan madde `gecis` olayı bırakır.
7. **Betik:** `HOCA_EPOSTA=… HOCA_SIFRE=… npm run ezber:gecis` (kuru; yalnız sayılar ve plan dizeleri yazar, öğrenci
   kimliği yazmaz) → sonuç temizse aynı komut `-- --yaz`. Yinelenebilir: yarıda kalırsa yeniden çalıştırmak kalanı
   tamamlar. Ne zaman: yeni hoca «Ezber» sekmesi yayına girdiği gün, kurallar canlıdayken. Mantık tek yerde
   (`src/lib/ezber/depo.ts` → `eskiKayitlariTasi`) ve emülatörde uçtan uca test edilir.
8. **Yeniden çalıştırma hocanın kaldırdığını geri getirmez (27 Eylül 2026, bağımsız inceleme):** yeni sistemde kaydı
   olmayan ama olayı olan madde (geçişten sonra hoca kaldırmış) atlanır ve «hocanın geçişten sonra kaldırdığı» diye
   sayılır; betik bunun için eski kaydı olan öğrencilerin olaylarını okur.

Planın eski yazımları git geçmişinden çıkarıldı (`src/data/yillik-plan-2026-2027.json`, bbddea8…a4b802b): bugünkü
49 dizenin dışında yalnız iki dize var («Telbiye: Lebbeyk Allahümme lebbeyk…» → `d-telbiye` ve Salât-ı ümmiye). Plan
yeniden üretildiğinde (müfredat değişikliği) kaybolan her dize `eskiPlan`'a eklenir; test, `eskiPlan` anahtarlarının
bugünkü planda olmadığını ve hepsinin katalogdaki bir kimliğe gittiğini denetler.

## Hoca ekranı: «Ezber» sekmesi (Faz 1c, 27 Eylül 2026)

| Dosya | Sorumluluk |
|---|---|
| `src/scripts/hoca-ezber.ts` | Sekme (`ezberPaneli`: Bugün · Tekrar · Tablo), sekme ile defterin ortak dinleme paneli, sınıf deposu (tek canlı dinleme), bağlantı rozeti |
| `src/styles/hoca-ezber.css` | `.ez-kok` kapsamı; basamak renkleri `--ez-b0…b4` Kilim jetonlarından; açık/koyu tema |
| `src/lib/ezber/metinler.ts` | Basamak adları, veliye giden yumuşak karşılıklar ve 8 not kalıbı (5 dil); defter cümlesi ve Fransızca sözlüğü |
| `src/lib/ezber/oneri.ts` | Öğrenci önerisi: kontrol günü gelenler → Çalışıyor → sıradaki (önce plan hedefi, sonra katalog sırası) |
| `src/lib/ezber/isaret.ts` | Kilim basamak işareti (20 px SVG); basamak renkle birlikte biçimle de okunur |
| `src/lib/firebase-tam.ts` | Tam Firestore SDK'sı (kalıcı önbellek, çok sekme); yalnız ezber paneli yükler, hoca ekranının geri kalanı lite kalır |

**Sınıfta akış (telefon):**

1. **Bugün:** yoklamada «Var» ya da «Geç» işaretli öğrenciler. Yoklama henüz işaretlenmediyse ya da gün ders günü
   değilse bütün aktif öğrenciler gelir; ekranda bunun açıklaması yazar. Karta dokunulunca kart yerinde açılır; açılır
   pencere yoktur.
2. **Madde seçimi:** önce kontrol günü gelen madde (en eskisi), sonra Çalışıyor, sonra sıradaki madde önerilir.
   «Başka madde» ile katalogdan herhangi bir madde seçilebilir.
3. **Kayıt:** isteğe bağlı veliye not çipleri seçilir (en çok 3; «Veli görecek:» önizlemesi çıkar). Sonra üç büyük
   düğmeden biri: **Tam · Az hatalı · Tekrar gelsin**.
   - Her düğmenin altında sonucu yazar («→ Pekişti», «Basamak değişmez»).
   - Dokunuş kaydeder; ikinci bir onay istenmez.
4. **Geri al:** sonuç kartında «Kaydedildi» ya da «Telefonda tutuluyor» yazar, odak «Geri al»a gelir.
   - Geri alma, tek toplu yazımda önceki durumu döndürür (sürüm + 1) ya da kaydı kaldırır; yanlış olayı da siler.
   - Veli geçmişinde iz kalmaz.
   - Arada başka bir cihaz aynı maddeyi değiştirdiyse geri alma yapılmaz; `EZBER_CAKISMA` iletisi çıkar ve ekran
     güncel durumu gösterir.
   - Yalnız olay yazan dokunuşun (erken dinleme, Kalıcı'da dinleme) geri alınması durumu hiç yazmaz, yalnız olayı
     siler: madde o arada başka telefonda ilerlediyse ilerleme yerinde kalır.
   - Defterdeki dinlemenin cümlesi sunucunun yanıtını izler: dinleme reddedilirse cümle defterden çıkar, geri alma
     reddedilirse (dinleme kayıtlı kaldı) cümle geri gelir.
   - «Geri al»a yazımın onayından önce basılırsa gelen onay ekranı yeniden «Kaydedildi»ye çevirmez.
5. **Erken dinleme:** kontrol günü gelmemiş 2. ya da 3. basamakta «Tam» ve «Az hatalı» basamağı değiştirmez.
   «Kontrol günü … gelmedi; … yine de ilerletsin» kutusu işaretlenirse ilerletir; olayda `zorla: true` kalır.
6. **Tekrar:** kontrol günü gelen maddeler listelenir, en eskisi önce. Düğmedeki sayı madde sayısını gösterir;
   yoklamada gelmediği görünen öğrenci «bugün yok» etiketi alır.
7. **Tablo:** şerit × öğrenci. Varsayılan şerit, plandaki son sınıf hedefinin şerididir.
   - Hücrenin erişilebilir adı «Ad Soyad — Madde: Basamak[, kontrol günü geldi]» biçimindedir.
   - Hücreye dokununca aynı dinleme paneli ve «Basamağı elle düzelt» açılır.
   - Elle düzeltmenin olay türü `duzeltme`dir; kontrol günü basamaktan yeniden hesaplanır.
8. **Bağlantı yokken:** tam SDK yazımı telefondaki önbelleğe koyar ve ekran hemen güncellenir.
   - Başlıktaki rozet «Bağlantı yok · N kayıt telefonda bekliyor» der; bağlantı gelince kayıtlar gönderilir.
   - Hoca girişinden sonra `ezberOnYukle`, önceki oturumdan telefonda kalan yazımları sekme açılmadan gönderir.
   - **Sunucuya ulaşmayan kayıt söylenir** (27 Eylül 2026, bağımsız inceleme): her yazım olay kimliğiyle telefondaki
     küçük bir deftere (`src/lib/ezber/bekleyen.ts`, localStorage; ad yok) girer, bu oturumda yanıt gelince çıkar.
     Sekme açılınca önceki oturumlardan kalanların olayı sunucuda aranır; olay yoksa yazım reddedilmiştir (araya başka
     telefon girdi, kayıt kilitlendi). Sekmenin başında öğrenci adı ve maddeyle uyarı çıkar, «Anladım» deyince kalkar;
     defterdeki dinleme panelinde kısa bir satır «Ezber» sekmesine yönlendirir.
   - Çıkışta önbellek silinmez: içinde yalnız öğrenci kimliği ve basamaklar vardır, ad yoktur.
9. **Defter:** «Bugün sınıfta» alanının altındaki «Ezber dinlendi…» aynı paneli defterin içinde açar.
   - Kaydedilen dinlemenin cümlesi alana eklenir (ör. «Ezber — Eûzü-Besmele: çok güzel okudu.»); dinleme geri
     alınınca cümle de çıkar.
   - Fransızca aileye giden bülten çevirisi bu cümleyi kalıp sözlüğünden alır, makineye göndermez.
   - Olayın günü defterin günüdür (bugünden eskiyse).
10. **Öğrenci kartı:** basamak sayıları, kontrol günü gelen madde sayısı ve «Ezber sekmesinde aç» düğmesi.
    - Eski ezber tablosu kalktı. «İlerlemeyi kaydet», `ilerleme.ezber`'i okunduğu gibi geri yazar; geçişin kaynağı
      korunur.
    - WhatsApp karnesi `ezberDurum`'dan kurulur: «Hocaya okudu» ve üstü, katalog sırasıyla, velinin dilinde.

**Sınama:**

- `tests/web/hoca-ezber.spec.mjs`: sahte tam SDK `tests/web/helpers/mektep.mjs` → `firestoreTam` içindedir.
  Bağlantı `__ezberBaglantiKes()` / `__ezberBaglan()` ile kesilip açılır; iki telefon çakışması `__ezberReddet` ile
  kurulur.
- `tests/kurallar/firestore.test.mjs`: geri almanın dört senaryosu, emülatörde.
- `tests/ezber-metin.test.mjs`: metinler.
- `tests/defter-ceviri.test.mjs`: 243 defter cümlesinin Fransızcası.

## Kilim çizimi ve veli portalı (Faz 1d, 27 Eylül 2026)

| Dosya | Sorumluluk |
|---|---|
| `src/assets/cizim/ezber-kilim/*.svg` | Codex'in çizdiği 12 motif (8 şerit motifi, koçboynuzu bordür, köşe, rozet, mühür) ve elle yazılan kenar suyu muskası; saf vektör, `npm run denetim:svg` |
| `scripts/ezber-motif-uret.mjs` | Çizimleri `src/lib/ezber/motifler.ts`'e çevirir; yalnız izinli nitelikler kalır (renk ve kimlik yok). `npm run ezber:motif`; `--denetle` kipi `test:ezber`'in başında koşar |
| `src/lib/ezber/kilim.ts` | Saf çizici: `kilimSvg`, `kilimLejanti`, `kilimOzeti`, `motifIsareti`, `kilimSeritleri`, `SERIT_MOTIFI` |
| `src/lib/ezber/veli.ts` | Veliye giden satırlar: `veliDinlemeleri` (yumuşak dil, kalıp notlar), `veliSeritleri` (kilimin metin karşılığı) |
| `src/scripts/veli-ezber.ts` | Portalın ayrı parçası: `veliEzberiYukle`, `ezberGorunumu`, `veliKilimKarti`, `ogrenciKilimKarti`, `odaBasamagi`, `odaIsareti` |
| `src/styles/ezber-kilim.css` | Kilim, açıklama, kart ve Oda çipi işaretleri; açık/koyu tema (Kilim Kartografyası jetonları) |

**Kilim:**

- **Tek yerleşim:** 12 şerit (1–7 ve Amme'nin 5 durağı) × en çok 10 madde; rozet yuvası solda, mühür yuvası sağda.
  Kenar suyunun 13 maddesi bordürdedir, saat yönünde 4/3/3/3. Alan kareye yakın (448 × 476 birim); telefon ve
  masaüstü için ayrı yerleşim gerekmedi.
- **Basamak dokusu** (renk tek başına bilgi taşımaz): 0 kesik çözgü · 1 çizgi · 2 çizgi + yarı dolu · 3 dolu ·
  4 altın + çerçeve. Ödüller durum makinesinin `bolumOzetleri` sonucundan: rozet ≥ 2, mühür ≥ 3, altın kenar = 4.
- **Kimlikler önekli** (`kl-v0` veli, `kl-o0` öğrenci): aynı sayfada iki kilim çakışmaz. Dış bağlantı, betik ve
  `<text>` yoktur (test).
- **Erişilebilirlik:** SVG `role="img"`, adı başlık + özettir; her maddenin `<title>`ı «ad — basamak». Metin
  karşılığı katlanır «Şerit şerit» listesidir; her madde kilimdeki dokusuyla ve basamak adıyla yazılır.

**Veli portalı** (`src/sayfalar/Veli.astro`, `src/scripts/veli-portali.ts`):

1. **Veri:** `ezberDurum/{ref}` ve son 20 olay (`orderBy('zaman', 'desc')`, `limit(20)`), lite SDK. Kurallarda
   `veliOkur`; ek kural gerekmedi.
2. **Kart «Bu hafta»dan sonra gelir:** kilim, özet, son 5 dinleme, «Kilimi okumak» açıklaması ve «Şerit şerit».
3. **Görünüm kuralı** (`ezberGorunumu`):
   - Yeni kayıt varsa kilim, «İlerleme»deki eski «Ezberler» listesinin yerini alır.
   - Hiç kayıt yoksa boş kilim ve beklenti cümlesi görünür.
   - Yeni kayıt yok ama eski listede ezber varsa (geçiş betiği henüz koşmadı) yalnız eski liste görünür.
   - Okuma hatasında kartta hata iletisi çıkar, eski liste yerinde kalır.
   - Kilim görünürken «İlerleme» kartında gösterilecek başka bir şey yoksa kart boş durum cümlesini yazar.
4. **Dil:** notlar kalıp anahtarıdır; velinin dilindeki cümle `metinler.ts`'ten gelir. Makine çevirisi gerekmez; ana
   plandaki «Fransızca notlar çeviri hattıyla» maddesi böyle karşılandı. Geçiş olayları (`gecis`) veliye gösterilmez;
   hocanın düğme adları («Tekrar gelsin») veliye gitmez.
5. **Paket:** kart, katalog ve motifler ayrı parçadır (`import('./veli-ezber')`); ana veli paketi yaklaşık 1 KB
   büyüdü. Parça inmezse kart çizilmez, eski liste kalır.

**Öğrenci kipi:**

- Ezber Odası'ndan sonra «Kilimim» kartı gelir: kilim, özet ve açıklama. Dinleme geçmişi ve liste yoktur.
- Ezber Odası çiplerinde çocuğun basamak işareti görünür (`isaret.ts`, hoca tablosundakinin aynısı); basamak adı
  `sr-only`'dir.
- Oda kimlikleri değişmez; karşılıkları `eski-kimlikler.json` → `ezberListesi`'ndedir.
- Bileşik maddede (Salli + Bârik, iki Rabbenâ) en düşük basamak alınır. Başlanmamış maddede ve geçişten önce işaret
  yoktur.

**Sınama:**

- `tests/ezber-kilim.test.mjs`: çizici, açıklama, veli satırları, kart, okuma sorgusunun biçimi ve Oda eşlemesi.
- `tests/web/veli-ezber.spec.mjs`:
  - tr ve fr;
  - görünüm kuralının dört hâli;
  - iki çocuk ve öğrenci kipi;
  - Oda çipleri;
  - iki temada axe ve telefonda taşma.
- Sahte lite SDK'da `orderBy`/`limit` ve okuma reddi için `__ezberHata` vardır.
- **Sonraya kalan:** hoca öğrenci kartında kilim, A4 baskı, sertifika ve karne (ana plan §3, «kullanıldığı yerler»).

## Tasarım yönü ve egitim taslakları (Faz 1e, 27 Eylül 2026)

- **Yön «Çini Panosu»:** bütün ezber yolu tek çini panosudur (12 sıra + kilimdeki gibi kenar suyu bordürü); pano
  müfredattır, kilim öğrencinin kendi yoludur, dört basamak bir çini karonun dört aşamasıdır. Tasarım sistemi
  [`egitim/DESIGN.md`](../egitim/DESIGN.md); süreç, yazı tipleri ve seçenekler
  [Faz 1e belgesinde](superpowers/plans/2026-09-27-ezber-kilimi-faz-1e-tasarim.md).
- **Taslaklar:** `egitim/docs/taslaklar/{giris,madde,hoca}.html` (gerçek katalog, yıllık plan ve Diyanet metniyle
  üretilir; üretim hattı `egitim/docs/taslaklar/uretim/`). Yayında değildir. Giriş taslağı Faz 1f'de Astro'ya
  taşındı (aşağıda); madde ve hoca taslakları Faz 2'dir.
- **Ana sitedeki kilim:** veli portalındaki çizim (`src/styles/ezber-kilim.css`) şimdilik ana sitenin Kilim
  Kartografyası paletindedir (rozet aşı boyası tonunda). egitim'e taşınınca çini jetonlarına geçer; orada ödül,
  kazandıran basamağın rengini taşır (rozet firuze, mühür yeşil, altın kenar altın).

## egitim iskeleti (Faz 1f, 27 Eylül 2026; aynı akşam yayında: https://egitim.ulucamii.be)

- `egitim/` ikinci Astro uygulaması: Ezber Kilimi girişi beş dilde (pano, dört basamak, şeritler, örnek kilim,
  kaynaklar); sesi olan 27 maddede kare çal düğmesi (ses ulucamii.be'den). Komutlar `npm run egitim:build`,
  `npm run test:egitim`; ayrıntı, taslaktan farklar ve açık kalemler
  [Faz 1f belgesinde](superpowers/plans/2026-09-27-ezber-kilimi-faz-1f-iskelet.md).
- Basamak kartları eşikleri doğru söyler: sertifika Pekişti kartında (şeritteki tümü ≥ Pekişti), altın kenar Kalıcı
  kartında. Kilim madde başlıkları «Ad, basamak» biçimindedir (ekran okuyucu için; veli kilimi de aynı çiziciyi kullanır).

## Bağımsız inceleme ve yayın sırası (27 Eylül 2026)

Faz 1'in bütün dalı (`main...ezber-kilimi`) yayından önce bağımsız bir gözden geçiricinin (ayrı model oturumu,
salt okunur) incelemesinden geçti. Kurallar, XSS ve veli tarafı temiz çıktı; beş bulgu doğrulandı ve testle düzeltildi:

| Bulgu | Düzeltme | Test |
|---|---|---|
| Yalnız olay yazan dokunuşun «Geri al»ı, o arada başka telefonda ilerleyen maddeyi eski hâline yazıyordu | Geri alma durumu yazmaz, yalnız olayı siler | emülatör: geri alma senaryosu 5 |
| Madde silme sürümsüzdü: kuyruktaki eski «Geri al» ya da eski ekran daha yeni kaydı siliyordu | `silinenSurum` + kural | emülatör: biçim testi, «Ezber madde silme» |
| Geçiş betiğini yeniden çalıştırmak hocanın kaldırdığı maddeyi geri getiriyordu | Olayı olan madde atlanır | birim + emülatör uçtan uca |
| Önceki oturumdan kalıp reddedilen yazım görünmüyordu | Bekleyen yazım defteri + sekmede uyarı | birim (`ezber-bekleyen`) + ekran |
| Defter cümlesi yazımın sonucunu beklemiyordu | Cümle sunucu yanıtıyla eşitlenir | ekran («Defter: dinleme reddedilirse…») |

**Yayın sırası (bağlayıcı):** yayın iş akışı (`deploy.yml`) Firestore kurallarını yayımlamaz. Önce kurallar
(`npm run firebase:kurallar`, dernek hesabıyla), sonra site. Site önce çıkarsa kilim okuması yetki hatası alır (veli
kartında hata iletisi, eski liste yerinde kalır) ve hocanın o arada kuyruğa aldığı yazımlar reddedilir (sekme bunları
«sunucuya ulaşmadı» diye söyler). Geçiş betiği (`npm run ezber:gecis`) ikisinden sonra, önce kuru çalıştırılır.

**Yayın (27 Eylül 2026, bu sırayla):** kurallar ≈15.15 → site `5b63366` (Pages koşusu 36321927828 başarılı) → geçiş
kuru koşusu: 3 öğrenci tarandı, eski ezber kaydı yok, yazılacak 0; `--yaz` gerekmedi. Kanıtlar ve açık kalem (canlı kural
kümesinin bayt karşılaştırması) `docs/YAYIN-KAYITLARI.md` «27 Eylül 2026 — Ezber Kilimi Faz 1» kaydında.

## Bilinen açıklar (27 Eylül 2026)

- Rabbenâ sesleri. Katalog, namaz sayfasındaki özgün «Rabbenâ duaları» kaydından kesilmiş `rabbena-atina.mp3` (0–12 sn)
  ve `rabbenagfirli.mp3` (12–21,9951 sn) dosyalarını kullanır; `kesim` + `ozgunSha256` 27 Eylül 2026'da kayda işlendi
  (ilinti 0,998). Makine dökümü ve sessizlik kesitleri: ilk kesit Bakara 201 «…ve kınâ azâbe'n-nâr»da biter,
  «bi rahmetike…» eki yoktur; hocanın bir kez dinleyerek teyidi yeterlidir. Eski Ezber Odası'nın `rabbena.mp3`
  dosyasının kaynak kaydı eksikti; Faz 1d'de ölçüldü: Diyanet Kur'an sitesindeki Davut Kaya kayıtlarının
  (`ar_DavutKaya/2_201.mp3` + `14_41.mp3`) **bayt bayt birleşimi**, yani resmî kaynak. Kaydı 27 Eylül 2026'da işlendi,
  ses değişmedi. Faz 1a'daki «özgünle aynı değil» ölçümü doğruydu (başka bir Diyanet kaydı), «kaynaksız» yargısı
  ise yalnız kaydın eksikliğiydi. `rabbena.mp3` ve iki namaz kaydının birleşimi `sallibarik.mp3` yalnız Ezber
  Odası'nda (`ezber-verisi.ts`) kullanılır; katalog maddelerine bağlanmaz (test yasaklar).
- `public/media/ses/dualar/ezan.mp3` Diyanet'in **sabah ezanıdır**; katalogda `not` ile belirtildi. Diğer vakitlerin
  ezanı Faz 2'de Diyanet'ten eklenir.
- 54 maddenin Diyanet sesi henüz yok (Amme'nin çoğu, iman cümleleri, tesbihler, tekbir, selâm, kenar suyu); Faz 2 ses işi.
- Yeni maddelerin FR/EN/NL/DE adları ilk taslaktır; ana dili konuşan okuması Faz 2'de.
- `npm run test:ezber` 27 Eylül 2026'dan beri `.github/workflows/deploy.yml` yayın kapısında da koşuyor (kimlikler
  Firestore anahtarı oldu). Dal `main`'e birleşince etkinleşir.
- Öğrenci silme dökümü tek işlemde en çok 400 belge siler; ezber olayları (öğrenci başına yılda ~100) sınıra daha erken
  yaklaştırır. Sınır aşılırsa döküm hiçbir şey silmez ve yönetici bakımı ister (mevcut davranış).
- `ezberUyeleri` (genel cemaat hesabı) ve `oneriler` (seviye testinden öneri) Faz 3'e kaldı: yazanı olmayan alan kurala
  girmedi.
- **Faz 1c tuzağı (çözüldü, 27 Eylül 2026):** hoca ekranı `ilerleme/{ref}`'i `setDoc` ile **bütün olarak** yazar.
  Eski ezber formu kalktı; ilerleme kaydı `ezber` alanını okunduğu gibi geri yazar, geçiş öncesinde veri kaybolmaz.
  Ekran testi bunu korur.
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
