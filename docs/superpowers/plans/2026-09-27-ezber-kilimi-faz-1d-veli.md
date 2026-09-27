# Ezber Kilimi Faz 1d — Veli Portalında Kilim ve Ezber Odası Bağı — Uygulama Planı

> **Ajanlar için:** Gerekli alt beceri: `superpowers:subagent-driven-development` (önerilen) ya da
> `superpowers:executing-plans`. Adımlar `- [ ]` onay kutularıyla izlenir.

**Amaç:** Velinin çocuğunun ezber yolculuğunu tek bakışta görmesi: kişisel Ezber Kilimi, metin karşılığı olan liste,
yumuşak dilli son dinlemeler; öğrenci kipinde «Kilimim» ve Ezber Odası çiplerinde basamak işareti. Eski ilerleme
listesi, geçiş betiği koşana kadar yerinde kalır.

**Mimari:** Codex'in saf vektör motifleri → üreteçle `motifler.ts` → saf çizici `kilim.ts` (SVG dizesi, `<symbol>` +
`<use>`, önekli kimlikler) + veli satırları `veli.ts`. Portalda kart ayrı parça `src/scripts/veli-ezber.ts`
(`import()` ile): lite SDK'yla `ezberDurum/{ref}` ve son 20 olayı okur, görünüm kuralını uygular, kartları kurar.
Ana veli paketine katalog girmez.

**Teknoloji:** TypeScript, Firebase JS SDK 12 lite, Codex CLI (yalnız çizim), svgo 4.1.0 denetimi, `node:test` +
esbuild, Playwright (sahte lite SDK `tests/web/helpers/mektep.mjs`), axe.

**Şartname:** [Ana plan](2026-09-26-ezber-kilimi-ana-plan.md) §3 (kilim), §4 Faz 1d; veri modeli
[Faz 1b planı](2026-09-27-ezber-kilimi-faz-1b-durum.md); kalıcı özet [`docs/EZBER-KILIMI.md`](../../EZBER-KILIMI.md).

## Genel kısıtlar

- Vektör önce: motifler saf SVG; `<image>`, `data:`, betik, dış bağlantı ve `<text>` yok (`npm run denetim:svg`).
- Görsel dil: Anadolu kilim motifleri + İslâmî geometri; canlı figür, Arapça yazı yok.
- Renk tek başına bilgi taşımaz; açık/koyu tema; telefonda yatay taşma yok.
- Veliye giden her metin beş dilde, yumuşak dil; öğrenci adı satırlara girmez; hocanın düğme adı veliye gitmez.
- Kur'an sesi yalnız Diyanet; kaynak kaydı olmayan ses bağlanmaz.
- Veri okuma yalnız mevcut kurallarla (`veliOkur`); kural değişikliği yok.

## İnceleme odağı

1. Geçiş betiği koşmadan önce veli eski listesini görmeye devam eder (boş kilim eski emeği silmiş gibi görünmemeli).
2. Okuma reddedilirse (kurallar henüz yayında değil) sayfa çökmez; eski liste yerinde kalır.
3. Olaylar zamana göre yeniden eskiye ve sınırlı gelir; geçiş olayı veliye olay diye görünmez.
4. Velinin dili Fransızcaysa kilim, özet, dinleme ve not satırlarının hepsi Fransızca.
5. Aynı sayfada iki kilim (iki çocuk, veli ↔ öğrenci kipi) kimlik paylaşmaz; listedeki işaretler kilimin sembollerine
   çözülür.

## Dosya yapısı

| Dosya | Durum |
|---|---|
| `src/assets/cizim/ezber-kilim/*.svg` | Yeni: 12 Codex motifi + elle kenar muskası |
| `scripts/ezber-motif-uret.mjs` | Yeni: çizim → `motifler.ts`, `--denetle` |
| `src/lib/ezber/motifler.ts` | Yeni, üretilmiş |
| `src/lib/ezber/kilim.ts` | Yeni: çizici, açıklama, özet, motif işareti |
| `src/lib/ezber/veli.ts` | Yeni: veli satırları ve şerit listesi |
| `src/lib/ezber/metinler.ts` | Değişti: `KILIM_METINLERI`, `durakAdi` |
| `src/scripts/veli-ezber.ts` | Yeni: okuma, görünüm kuralı, kartlar, Oda işareti |
| `src/scripts/veli-portali.ts` | Değişti: tembel yükleme, iki kart, eski liste koşulu, çip işareti, iki simge |
| `src/sayfalar/Veli.astro`, `src/styles/ezber-kilim.css` | Stil |
| `docs/dinleme-ses-kaynaklari.json` | `rabbena.mp3` kaydı (mevcut açık) |
| `tests/ezber-kilim.test.mjs`, `tests/web/veli-ezber.spec.mjs`, `tests/web/helpers/mektep.mjs` | Sınama |

### Görev 1: Motifler

- [x] Codex'e çizim görevi (`.codex/kilim-motifler/GOREV.md`): 8 şerit motifi, koçboynuzu bordür, köşe, rozet, mühür.
- [x] Kenar suyu muskası elle (tek yol, `fill-rule="evenodd"`).
- [x] Üreteç + `--denetle`; `denetim:svg` 0 sorun; `package.json`: `ezber:motif`, `test:ezber` başında denetim.

### Görev 2: Çizici (TDD)

- [x] Boş kilim geçerli XML, 81 madde tam bir kez, önekli kimlikler, bağlar çözülür, < 60 KB.
- [x] Ödüller durum makinesiyle aynı; kapsayan madde (`s-alak` → `s-alak-1-5`) gösterilen basamağı taşır.
- [x] İki kilim kimlik paylaşmaz; kötü önek reddedilir; beş dilde başlık ve açıklama.

### Görev 3: Veli kartı

- [x] `veliEzberiYukle`: durum + `orderBy('zaman','desc')` + `limit(20)`; hata → `null` (sorgunun biçimi testte).
- [x] `ezberGorunumu`: kilim / eski / hata.
- [x] Kart «Bu hafta»dan sonra; eski liste yalnız kilim görünmüyorken.
- [x] Sahte lite SDK'ya `orderBy`, `limit`, `__ezberHata`.
- [x] Web testi: tr, fr, dört görünüm hâli, iki çocuk, iki temada axe, Pixel 7 taşma, ekran görüntüleri.

### Görev 4: Öğrenci kipi ve Ezber Odası

- [x] «Kilimim» kartı Ezber Odası'ndan sonra.
- [x] Çiplerde basamak işareti (`odaIsareti`; bileşikte en düşük; başlanmamışta yok; geçişten önce yok).
- [x] Rabbenâ sesi: ölçüm ve kayıt (aşağıda «Sapma»).

### Görev 5: Belgeler, doğrulama, commit

- [x] `docs/EZBER-KILIMI.md` Faz 1d bölümü; `docs/OGRENCI-MODU-PORTAL.md` notu; bu belge.
- [x] `npm run dogrula:codex`, tam `test:web`, görsel inceleme, commit.

## Uygulamadaki sapmalar

- **Tek kilim yerleşimi:** ana plan yatay/dikey iki yerleşimi açık bırakmıştı. Alan kareye yakın çıktığı (448 × 476)
  ve telefonda motifler okunur kaldığı için tek yerleşim seçildi.
- **Fransızca notlar:** ana plan «mevcut çeviri hattıyla» diyordu. Notlar Faz 1b'den beri yalnız kalıp anahtarı
  olduğundan cümle beş dilde hazır geliyor; makine çevirisi gerekmedi.
- **Rabbenâ sesi:** ön kabul «kaynaksız, Diyanet dışı» idi ve özgün namaz kaydıyla değiştirilecekti. Silmeden önce
  ölçüldü: `rabbena.mp3`, Diyanet Kur'an sitesindeki Davut Kaya kayıtlarının (`ar_DavutKaya/2_201.mp3` + `14_41.mp3`)
  bayt bayt birleşimi. Yani resmî kaynak; eksik olan yalnız kayıttı. Ses değişmedi, kayıt işlendi, test güncellendi.
- **Ayrı parça:** kart ana veli paketine değil `import()` ile ayrı parçaya kondu (ana paket ~1 KB büyüdü; katalog ve
  metinler ortak parçada, yalnız kart yüklenirken iner).

## Sonuç (27 Eylül 2026)

Kilim, veli kartı, öğrenci kipi ve Oda işaretleri tamam. Birim testleri: `tests/ezber-kilim.test.mjs` 14/14,
`test:ezber` toplam 54. Web: `tests/web/veli-ezber.spec.mjs` masaüstü + Pixel 7'de 24/24, iki temada axe temiz.

Kalite kapısı (`npm run dogrula:codex`, 27 Eylül 2026):

- design:check geçti; check 0 hata, 0 uyarı; `dogrula` (derleme ve bütün düğüm testleri) geçti.
- test:web 646 geçti, 12 düştü: bilinen, tarihe bağlı ana sayfa görsel temel resim karşılaştırmaları (26 Eylül
  yayın kaydındakilerin aynısı; bu işle ilgisiz).
- test:kurallar 53/53 (emülatör), test:veli-eposta 58/58, test:oto-kaydet 14/14, test:ogrenme 10/10.

Kapıdan sonra bulunan ve düzeltilen: kilim görünürken, kaydında yalnız eski ezber listesi olan çocuğun «İlerleme»
kartı başlıkla boş kalıyordu; artık boş durum cümlesini yazar (alanları boş eski kayıtlarda da). Test eklendi; veli
takımı 24/24, `mektep-islev` + `tablet` + `ogrenme-atolyesi` 56/56.
