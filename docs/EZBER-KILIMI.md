# Ezber Kilimi

Karar tarihi: 26 Eylül 2026 (Rıdvan, 11 turluk planlama). Durum: **Faz 1a — tek katalog iskeleti hazır (79 madde);
seviye listesi v2 Rıdvan'ın onayında (27 Eylül 2026)**. Ana plan: [2026-09-26-ezber-kilimi-ana-plan.md](superpowers/plans/2026-09-26-ezber-kilimi-ana-plan.md);
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
| `src/data/ezber/eski-kimlikler.json` | `ezberListesi` (eski `EZBER_LISTESI.id`, ev çalışması `ezber-<id>`) ve `seviyeTesti` (`ez01…ez14`) → katalog kimlikleri |
| `src/lib/ezber/katalog.ts` | Tipli erişim: `KATALOG`, `ezberBul`, `seviyeOgeleri`, `planKimlikleri`, `eskiKimliktenYeni`, `sinifHedefleri` |

**Kurallar**
- **Kimlik:** `s-` sûre/âyet, `d-` dua (Kur'an'dan olan dualar dahil), `b-` bilgi; küçük ASCII, `-` ayraç.
  Öneki türle aynı olmalı. Faz 1 yayına girdikten sonra kimlik **değiştirilmez ve silinmez** (Firestore kayıtları
  kimliğe bağlıdır); gerekirse yeni kimlik açılır, eskisi `eski-kimlikler.json`'a taşınır ve `surum` artar.
- **Seviye ve sıra:** `seviye` 1–8 ya da `kenar`; her seviyede `sira` 1'den başlar, kesintisizdir. Kenar suyunda sıra
  sınıf hedefi tarihine göredir.
- **`kuranMetni`:** Kur'an metni olan her madde (Kur'an'dan olan dualar dahil; ör. Rabbenâ âtinâ = Bakara 201) `true`
  taşır. Bu bayrak yapay ses yasağının ve «yalnız Diyanet» kuralının dayanağıdır. Sûrelerde `kuran` (sûre + âyet
  aralığı, Diyanet mushafı sayımı) zorunludur.
- **Ses:** yalnız `docs/dinleme-ses-kaynaklari.json`'da kaydı olan ve sha256'sı tutan dosya bağlanır; kaynak Diyanet
  alan adıdır, sûre sesi Kur'an sunucusundandır. Âyet parçaları sırayla `parcalar`'da (`1-0` besmele kaydı Fâtiha
  parçalarına girmez).
- **Adlar:** beş dilde zorunlu. Eski 19 maddenin adları `src/lib/ezber-verisi.ts` ile birebir aynıdır (test korur).
- **`not`:** maddeye özgü uyarı (ör. ezan kaydının sabah ezanı olması).

## Madde ekleme / değiştirme

1. `katalog.json`'da maddeyi ekle ya da düzelt (sıralar kesintisiz kalsın).
2. Yıllık plandaki ezber dizesi değişti ya da eklendiyse `plan-eslesme.json`'u güncelle; test, plandaki her dizenin
   eşlendiğini ve fazlalık olmadığını denetler.
3. `npm run test:ezber` → yeşil. `npm run ezber:tablo` (isteğe bağlı `-- --dil fr`) ile tabloya bak.

## Bilinen açıklar (27 Eylül 2026)

- `public/media/ses/dualar/rabbena.mp3`: kaynak kaydı yok ve Diyanet'in özgün «Rabbenâ duaları» dosyasıyla aynı değil
  (137 KB / 879 KB). Yeni katalog onun yerine kaynağı kayıtlı `rabbena-atina.mp3` ve `rabbenagfirli.mp3`'ü kullanır;
  eski dosya yalnız eski Ezber Odası'nda (`ezber-verisi.ts`) kalıyor — Faz 1d'de Ezber Odası kataloğa bağlanınca düşer.
- `public/media/ses/dualar/ezan.mp3` Diyanet'in **sabah ezanıdır**; katalogda `not` ile belirtildi. Diğer vakitlerin
  ezanı Faz 2'de Diyanet'ten eklenir.
- 53 maddenin Diyanet sesi henüz yok (Amme'nin çoğu, iman cümleleri, tesbihler, tekbir, selâm); Faz 2 ses işi.
- Yeni maddelerin FR/EN/NL/DE adları ilk taslaktır; ana dili konuşan okuması Faz 2'de.
- Kurs müfredatındaki «Amme Cüzü Satırları — Elifbâ s. 32–33» atfı yanlış (s. 32 Fâtiha, s. 33 Bakara'nın başı). Kaynak
  OneDrive'daki müfredat belgesidir; yıllık plan ve müfredat çıktıları elle düzenlenmez → kaynakta düzeltilip yeniden
  üretilmeli (Rıdvan'ın kararı).
- Seviye testindeki «Diyanet 2025 programı sırasını izler» ifadesi yanlıştı (program lise çağı yatılı öğrenciler
  içindir); 27 Eylül 2026'da `ezber.ts` yorumu ve [SEVIYE-TESTI.md](SEVIYE-TESTI.md) notuyla düzeltildi.

## Faz 2'ye kalan metin kararları (kaynaklar arası farklar)

1. Sübhâneke'deki «ve celle senâük»: Elif-Bâ'da notsuz var; Namaz İlmihali «yalnız cenaze namazında» der. Öneri:
   Temel Dinî Bilgiler modeli (parantez + not).
2. Ezan duasının son cümlesi («inneke lâ tuhlifü'l-mîâd») Beyhakî ziyadesidir; öneri Buhârî metni + not.
3. Rabbenâ âtinâ âyetle (Bakara 201) biter; «bi rahmetike…» ayrı, isteğe bağlı ek. Rabbenağfirlî yalnız İbrâhîm 41.
4. Meâlle kıraat: Diyanet İlmihali s. 243 «öğreninceye kadar caiz», Namaz İlmihali «geçersiz» — Fransızca konuşan
   yeni Müslümanlar için hoca notu gerekir (hocanın ve Rıdvan'ın kararı).
5. Katalog metinleri arşivden kopyalanmaz; resmî yayından (kuran.diyanet.gov.tr, Elif-Bâ, namaz.diyanet.gov.tr) alınır.

## Onay durumu

- Seviye listesi **v2** (79 madde; kaynak araştırmasının «asgari değişiklik» önerisi uygulandı: tekbir ve selâm
  eklendi, Kevser 3. şeride, Fîl 5. şeride, gusül ve teyemmüm farzları 2. şeride): **Rıdvan onayı bekleniyor**
  (27 Eylül 2026). Onaydan sonra yalnız `seviye`, `sira` ve seviye adları değişir; `npm run test:ezber` yeniden koşar.
