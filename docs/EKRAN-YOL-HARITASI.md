<!-- Onay: 27 Eylül 2026, imam (plan modu). Bu dosya Faz 1 uygulama planının (docs/EKRAN-FAZ1-UYGULAMA-PLANI.md) dayandığı spesifikasyondur. -->

# Ulu Camii Dijital Ekran — Yol Haritası

## Bağlam
Camideki Odesan LED pano (miladi tarih, saat, 6 vakit, sıcaklık) yerine monitör + Android TV kutusu asılacak.
Ekran Diyanet vakitlerini sürekli gösterecek; ayet, hadis, duyuru ve diğer slaytları sırayla döndürecek.
Amaç: daha zengin, iki dilli (TR+FR), uzaktan yönetilen, 2027 devrinde derneğe sorunsuz kalan bir sistem.
Proje sıfırdan (mimari yol); onaydan sonra `superpowers:writing-plans` ile uygulama planına dökülecek.

## Senin kararların (9 tur, 36 soru)
| Konu | Karar |
|---|---|
| Yerler | 3 ekran: LED panonun yeri (ana), giriş/şadırvan/çay ocağı, kadınlar bölümü |
| Donanım | Monitör/TV 32–43 inç + Android TV kutusu; **dikey**; ikinci el/kelepir; prizler hazır; mevcut ana Wi-Fi |
| Mimari | **Hibrit:** görüntü sitede `ulucamii.be/ekran` sayfası, kutuda ince Android kabuk uygulaması |
| Dil | TR + FR aynı slaytta alt alta; ayet/hadiste Arapça aslı üstte |
| Vakitler | Yalnız Diyanet (ilçe 11890); kamet yok; sıradaki vakit vurgulu + geri sayım |
| Namaz anı | "Vakit girdi · telefonu sessize al" uyarısı + kısa ses (3 ekranda da), sonra sade/loş mod |
| Gece | Yatsı + 1 saat kapan, imsak − 30 dk açıl |
| Sıcaklık | Dış hava, internetten |
| Görünüm | Gündüz açık (krem + cami kırmızısı), akşamdan sonra koyu; üstte ince logo + ad bandı |
| Slayt süresi | Metin uzunluğuna göre otomatik |
| İçerik | Günde 1 ayet + 1 hadis; duyuru, etkinlik afişi, vefat (cenaze namazı + 1 gün), haftalık program, bağış QR, kandil geri sayımı, günün duası/Esmâ, Ramazan modu |
| Ekran hedefleme | Ortak akış + ekrana özel duyuru |
| Yönetim | İmam: sitenin paneli (Sveltia CMS). Başkan, kadınlar kolu, gençlik/kurs: **telefondan basit form, doğrudan yayın** |
| Uzaktan | Arıza e-postası, sessiz güncelleme, anlık ekran görüntüsü, uzaktan yeniden başlatma |
| FR meal | Diyanet İşleri Başkanlığı'nın Fransızca meali: **Mohammed Chiadmi, «Le Noble Coran»** (DİB, 2022, ISBN 978-625-435-299-7). *İmam kararı: 27 Eylül 2026. Cami Diyanet'e bağlı olduğundan Diyanet yayınlarının kullanımında izin sorunu yok; kaynak her ayetin altında belirtilir. TDV'nin Hamidullah baskısı (ISBN 9789753897334) incelendi, seçilmedi.* |
| Devreye alma | Önce tek ekran pilot (LED'in yanında), sonra 3 ekran; **mümkün olan en kısa sürede** |
| Kapsam | Şimdilik yalnız Ulu Camii (ad/logo/ilçe kodu tek ayar dosyasında) |

## Benim koyduğum varsayılanlar (düzeltebilirsin)
- Cuma günü "Öğle" satırı "Cuma · Joumoua" olur.
- Uyarı süresi 3 dk. Sükûnet vakit girdikten sonra 20 dk, Cuma 60 dk sürer. Güneş vaktinde uyarı olmaz. Hepsi `ekran.yaml` dosyasından değiştirilebilir.
- Tema akşam vaktinde koyuya, güneş vaktinde açığa geçer.
- Form doğrudan yayımlar ama her yayında imama bilgi e-postası gider. Formda "yayından kaldır" düğmesi olur.
- FR metni girilmemiş duyuruda yalnız TR görünür. FR meali gelmemiş ayet AR + TR ile çıkar.
- Uygulama adı "Ulu Camii Ekran", paket `be.ulucamii.ekran`. İmza anahtarı derneğe ait yeni bir anahtardır.
- LED pano pilot boyunca yerinde kalır; akıbetine dernek karar verir.

## Mimari (hibrit)
```
 Editörler (telefon)           İmam (Sveltia CMS)          GitHub Actions (günde 2×, Diyanet 11890)
   │ Apps Script formu + kişisel PIN   │                          │
   └──────────► ulucamii2026/ulucamii2026.github.io ◄────────────┘   (commit → deploy)
                                │  GitHub Pages
                                ▼
   ulucamii.be/ekran/?ekran=ana|giris|kadin&don=90   ← sayfa (Astro + TSX, service worker, noindex)
   ulucamii.be/ekran/vakitler.json · akis.json · icerik.json · surum.json
                                │  Wi-Fi (yoksa önbellek)
                                ▼
   Android TV kutusu — "Ulu Camii Ekran" kabuğu (WebView kiosk, device owner)
     ├─ gece kapan/aç → kutu uyur → HDMI-CEC → TV bekleme
     └─ nabız 15 dk → Apps Script → Google Sheet (dernek) → arıza e-postası info@ulucamii.be
                        ↳ yanıtta komut: ekran görüntüsü (Drive) / yeniden başlat / güncelle
```

### Site tarafı (`D:\app\ulucamii-site`)
Görüntünün ve mantığın tamamı burada, tek depoda durur.
- **Sayfa** `src/pages/ekran/index.astro` + `src/components/ekran/*.tsx`. Düzen dikey 1080×1920: üst bant (logo, ad, miladi/hicrî tarih, büyük saat, hava), orta slayt alanı, alt 6 vakit (TR · FR adlar) + geri sayım.
  - `?don=90` sayfayı CSS ile döndürür. Kutu yatay sinyal verir, telefonda önizlemede döndürme yapılmaz.
  - `?ekran=` hedeflemeyi seçer.
  - Service worker sayfayı ve JSON'ları önbelleğe alır, internet giderse son sağlam hâl kalır.
- **Akışlar** mevcut `src/pages/admin/durum.json.ts` kalıbıyla, derleme anında üretilir:
  - `vakitler.json`: `src/data/namaz-vakitleri.json` olduğu gibi yayımlanır. `kaynakTuru !== 'diyanet'` ise derleme düşer.
  - `akis.json`: duyuru, etkinlik, afiş, vefat, haftalık program, dinî günler, heroMesajlar, IBAN, ekran ayarları. Her öğede `hedef[]`, `baslangic` ve `son` alanları vardır; süre dolunca internet olmasa da kalkar.
  - `icerik.json`: onaylı ayet, hadis, dua ve Esmâ setleri + 400 günlük deterministik takvim. Öncelik: kandil > Ramazan > Cuma > günlük.
  - `surum.json`: kabuk APK sürümü, adresi ve sha256 özeti.
- **CMS**: `src/content.config.ts` ve `public/admin/icerik/config.yml` içine duyuru, etkinlik, afiş ve vefat için ortak bir `ekran` nesnesi eklenir: `goster`, `baslangic`, `son`, `hedef`, `kisaMetin{tr,fr}`. Yeni `src/content/ayarlar/ekran.yaml` dosyası süreleri, gece ofsetlerini, sükûneti, ses düzeyini ve temayı tutar.
- **İçerik setleri**: `src/data/ekran/{ayetler,hadisler,dualar,esma}.json`. Her kayıtta `ar/tr/fr`, `tahric`, `kaynak`, `durum: taslak|imam-onayli` alanları bulunur. Yalnız `imam-onayli` kayıtlar yayına girer.
- **Yeniden kullanılacaklar**:
  - `src/lib/namaz.ts`: Brüksel saati, yaz saatine dayanıklı.
  - `src/components/SiradakiVakit.tsx`.
  - `src/i18n/hicri.ts`.
  - `src/lib/dinigunler.ts` + `src/data/diyanet-dini-gunler.json`.
  - `src/lib/hadis-verisi.ts`: 10 hadis, AR + FR hazır; ilk içerik tohumu olur.
  - Kurumsal renkler ve Work Sans (`src/data/kurumsal-kimlik.json`).
  - Logo SVG'leri (`public/media/logo/`).
- `public/robots.txt` dosyasına `Disallow: /ekran/` eklenir. `scripts/site-denetim.mjs` akış şemasını denetleyecek şekilde genişletilir.

### Android kabuk (`D:\app\UluCamiiEkran`, yeni, küçük)
- Tek activity, tam ekran WebView. JavaScript, DOM storage, service worker ve kullanıcı dokunuşu olmadan ses çalma açıktır.
- **Device owner** kurulumu hesapsız kutuda `adb -s SERIAL shell dpm set-device-owner` ile yapılır. Uygulama ana ekran (HOME) olur, lock task ile kiosk moduna geçer, açılışta kendiliğinden başlar, saat dilimi `Europe/Brussels` yapılır.
  - Device owner kurulamazsa yedek: HOME filtresi + `BOOT_COMPLETED`.
- **Gece**: vakitler önbellekteki `vakitler.json` dosyasından okunur, Diyanet kapısından geçer. Yatsı+60'ta `lockNow()` çağrılır, kutu uyur ve CEC ile TV kapanır. İmsak−30'da alarm kutuyu uyandırır, TV açılır. Hesap `Instant` ile yapılır; yaz ortasında kapanma gece yarısını geçer.
- **Saat güvenliği**: sistem saati geride kalıyorsa (pilsiz kutuda 1970 görünebilir) sayfa geri sayım, uyarı ve modları gizler, "Saat doğrulanıyor" yazar. Kabuk saati HTTP `Date` başlığından düzeltir.
- **Nabız**: 15 dakikada bir sürüm, mod, vakit kapsamı, saat sapması, Wi-Fi gücü ve boş alan gönderilir. Komutlar nabzın yanıtıyla gelir.
  - Ekran görüntüsü `PixelCopy` ile alınıp Drive'a gider.
  - Yeniden başlatma.
  - Güncelleme `PackageInstaller` ile sessiz yapılır; sha256 ve imza kontrol edilir.
- **Yeniden kullanılacaklar**:
  - Güncelleme doğrulaması: yerel HafizAI projesindeki `update/Updater.kt` (sha256 + imza denetimi).
  - Ekranı açık tutma: yerel CoranTtsApp projesindeki `MainActivity.kt` (satır 40–47).
  - Açılış alıcısı: yerel Brocante projesindeki `core/notify/BootReceiver.kt`.
- Derleme yığını en yeni projelere uyar (StokApp: AGP 8.9.x, Kotlin 2.1+, OkHttp, Hilt yok çünkü gereksiz); derleme `android-builder` alt ajanıyla yapılır.

### Editör formu (dernek Google hesabı, Apps Script web uygulaması)
- Alanlar: tür (duyuru / etkinlik / vefat), başlık ve metin (TR zorunlu, FR isteğe bağlı), görsel, başlangıç/bitiş, hedef ekran(lar).
- Vefat için ek alanlar: cenaze namazı tarih/saat/yer ve **"aile onayı alındı"** kutusu (zorunlu).
- Her editörün kendi PIN'i olur, commit mesajına adı yazılır; git geçmişi kimin ne girdiğini tutar.
- Kayıt GitHub API ile doğrudan depoya yazılır. Anahtar yalnız bu depoya içerik yazma yetkili fine-grained bir token'dır ve Script Properties'te durur.
- "Yayındakiler" listesi ve "kaldır" düğmesi olur; her yayında imama bilgi e-postası gider.
- Google Forms kullanılmaz, çünkü Forms'ta dosya yüklemek Google hesabıyla giriş ister.

### Değişmez kurallar
- Yalnız dernek hesapları kullanılır: GitHub `ulucamii2026` ve derneğin Google hesabı.
- İmamın telefonu hiçbir yerde görünmez; yalnız cami hattı ve info@ulucamii.be.
- Bağış slaytında "vergiden düşülür" vaadi olmaz.
- Vektör önceliği: logo, hat ve simgeler SVG; QR kodu SVG olarak çizilir.
- Vakitler yalnız Diyanet'ten gelir, hiçbir yerde hesap yedeği yoktur. Bugünün verisi yoksa "Vakitler güncellenemedi / Horaires indisponibles" yazar.

## Ekran modları ve slayt sırası
- **Modlar**: NORMAL → VAKİT GİRDİ (3 dk, ses, telefon uyarısı) → SÜKÛNET (slaytlar durur, loş) → NORMAL; GECE; VERİ YOK.
- **Katmanlar**: RAMAZAN (iftar/sahur büyük geri sayımı), KANDİL/BAYRAM, CUMA.
- **Slayt döngüsü**:
  1. Vefat (her turda)
  2. Ekrana özel duyuru
  3. Ortak duyuru / afiş / etkinlik
  4. Ayet
  5. Hadis
  6. Haftalık program
  7. Kandil geri sayımı
  8. Dua / Esmâ
  9. Bağış QR (3 turda bir, Cuma daha sık)
- **Süre**: `clamp(8 sn + 0,05 sn × karakter, 10, 30)`, katsayı `ekran.yaml` dosyasından gelir.
- **Görüntü izi önlemi**: sabit düzen 10 dakikada bir ±3 px kayar; OLED ekran alınmaz.
- **Hava**: Open-Meteo, 30 dakikada bir. Veri 3 saatten eskiyse gizlenir; "Open-Meteo" ibaresi konur.

## Yol haritası

**Faz 0 — Donanım avı ve deneme (onaydan hemen sonra başlar)**
1. **Vinted taraması**: 32–43 inç TV/monitör (VESA, tercihen IPS, hoparlörlü, HDMI-CEC), Google sertifikalı kutu (Chromecast with Google TV, Google TV Streamer, Xiaomi TV Box S, Nvidia Shield) ve dikey VESA askısı aranır. Uygun ilanlar **favorilere eklenir** (`vinted-erisim`, Playwright oturumu).
2. **Diğer siteler**: 2dehands/2ememain, Facebook Marketplace (`facebook-erisim`), Leboncoin/eBay (kargolu), Back Market / Amazon ikinci el. AliExpress/Temu'dan yalnız askı, kablo, hoparlör gibi pasif parçalar alınır; markasız kutu alınmaz.
3. **Masaüstüne PDF** ("Cami Ekranı — Donanım Fırsatları"). Her ilan için fiyat, konum/kargo, durum, uygunluk puanı (boyut, VESA, panel, CEC, hoparlör, sertifika) ve bağlantı yazılır. Sonunda ekran başına alışveriş listesi ve toplam yer alır. Vektör simgeler kullanılır.
4. **Alım ve deneme**: önce 1 TV + 2 farklı kutu adayı alınır ve deneme listesi uygulanır:
   - Dikey görüntü
   - Hesapsız kurulum + device owner; ardından WebView güncellemesi için dernek Google hesabı eklenebiliyor mu?
   - Fiş çekilip takıldıktan sonra ≤ 90 saniyede ekran geri geliyor mu?
   - Uykuda CEC ile TV kapanıyor mu, alarm kutuyu ve TV'yi uyandırıyor mu?
   - İnternet ve elektrik yokken saat davranışı
   - Ekran koruyucu ve enerji tasarrufu kapalı mı?
   - 72 saat kesintisiz çalışma (bellek, ısı)
   - Modem yeniden başlayınca Wi-Fi'ye kendiliğinden bağlanıyor mu?
   - Sessiz APK güncellemesi
   - Kapanma yedekleri: siyah ekran; Shelly priz (yerel HTTP).
   - **Çıkış ölçütü**: kutu modeli seçildi; her madde geçti ya da yedeği belgelendi.

**Faz 1 — Ekran sayfası MVP (Faz 0 ile paralel; donanım beklemez, tarayıcıda önizlenir)**
- Üst bant, saat, tarih, hicrî tarih, hava; 6 vakit, vurgu, geri sayım; duyuru + ayet + hadis döngüsü; açık/koyu tema; `?ekran` ve `?don` parametreleri; service worker; noindex.
- Akışlar: `vakitler.json`, `akis.json`, `icerik.json`. CMS'e `ekran` alanları ve `ekran.yaml`.
- **Çıkış ölçütü**: `ulucamii.be/ekran` telefonda ve PC'de açılıyor; CMS'te işaretlenen duyuru ≤ 15 dakikada görünüyor; Diyanet dışı veri derlemeyi düşürüyor.

**Faz 2 — Android kabuk + pilot**
- Kiosk, açılışta başlatma, ekranı açık tutma, gece kapan/aç, saat güvenliği, basit nabız.
- Pilot ekran LED panonun yanına asılır, **7 gün paralel** çalışır.
- **Çıkış ölçütü**: 7 gün vakit farkı sıfır (LED + Diyanet sayfası örneklemesi), 7 gece doğru kapan/aç, fiş çek-tak testi geçti.

**Faz 3 — Bütün slaytlar ve modlar**
- Vakit girdi + ses; sükûnet; vefat; etkinlik afişleri; haftalık program; bağış QR (EPC/SEPA); kandil geri sayımı; dua/Esmâ; piksel kaydırma; eski veri göstergesi.
- **Ramazan modu Ramazan 2027'den önce hazır olmalı.** Başlangıç tarihi `diyanet-dini-gunler.json` dosyasından alınır.
- **Çıkış ölçütü**: zaman yolculuğu testleri yeşil.

**Faz 4 — Editör formu**
- Apps Script formu, PIN'ler, kaldırma düğmesi, imama bilgi e-postası.
- Tek sayfalık, vektör çizimli TR editör rehberi (PDF); 3 kişiye kısa tanıtım.
- **Çıkış ölçütü**: her editör telefondan bir test duyurusu yayımladı ve kaldırdı.

**Faz 5 — Uzaktan işletim**
- Nabız → Sheet → arıza e-postası (gece penceresi hariç, 45 dakika sessizlikte).
- Ekran görüntüsü → Drive; yeniden başlatma; sessiz APK güncellemesi (`pilot` / `hepsi` kanalları).
- **Çıkış ölçütü**: fiş çekilince e-posta geliyor; uzaktan görüntü alınıyor; bozuk sha256 reddediliyor.

**Faz 6 — Üç ekran + LED'in sökülmesi**
- Giriş ve kadınlar bölümü ekranları asılır. Her ekrana hedefli test duyurusu yalnız kendi ekranında görünmeli.
- 14 gün müdahalesiz çalışma. Bir sayfalık işletim kılavuzu yazılır (2027 devri için). LED pano sökülür.

**Paralel içerik hattı (hemen başlar)**
- **İ0 — Kaynak ve izin.**
  - TR meal kuran.diyanet.gov.tr'deki resmî metinden alınır.
  - FR meal: DİB'in Chiadmi çevirisi («Le Noble Coran», 2022, ISBN 978-625-435-299-7); imam kararı 27 Eylül 2026. Cami Diyanet'e bağlı; Diyanet yayınları ekranda ve sitede kaynak belirtilerek kullanılır, ayrıca izin yazışması gerekmez.
  - FR hadis: DİB'in Fransızca "40 Hadis" kitapçıkları (dijital.diyanet.gov.tr; Arapça + Fransızca + kaynak) kullanılır.
  - FR hadis için Diyanet'in Fransızca hadis yayını aranır; bulunamazsa imam onaylı "Traduction : Mosquée Ulu Camii".
  - Yerel ihtisas arşivi **yalnız seçim ve doğrulama** için kullanılır; telif kuralı gereği metin oradan kopyalanmaz.
- **İ1 — Setler.** TR ≤ 280 karakter, bağlamından koparılmamış.
  - 365 günlük ayet + 365 günlük hadis
  - 52 Cuma seti, her kandil için 3 metin, 30 Ramazan metni
  - 99 Esmâ, yaklaşık 60 dua
- **İ2 — Taslak.**
  - Arapça: yerel `coran-tts` mushaf verisi (`mushaf.json`) + kuran.diyanet.gov.tr.
  - Hadis: resmî Diyanet yayınından, tahricle.
  - Karşılaştırma için: `D:\app\Ihtisas2027\data-prep\kaynak\kuran_meal_diyanet.txt`, `D:\coran-francais\_outils\sourateN_clean.json`.
- **İ3 — İmam onayı.** 30'luk partiler hâlinde verilir. Kural: **her an en az 60 günlük onaylı içerik hazırda olmalı.** Pilottan önce ilk 30–60 gün onaylanmış olur.

## Riskler → önlemler
- Kutu dikey çıkış vermiyor → sayfa `?don=90` ile CSS döndürme yapar.
- Google TV'de device owner olmuyor → 2 kutu adayı denenir; yedek HOME + açılış alıcısı.
- Gece kapanıp açılma çalışmıyor → CEC; yedek siyah ekran; yedek 2 Shelly priz.
- Hesapsız kutuda WebView eski kalıyor → device owner kurulduktan sonra dernek hesabı eklenir; sayfa eski Chromium'a uyumlu yazılır.
- Kutuda saat pili yok → saat güvenliği + HTTP `Date` ile düzeltme.
- Kötü bir site deploy'u üç ekranı birden bozabilir → service worker son sağlam sürümü tutar; yeni tasarım önce `/ekran-beta/` üzerinde pilotta denenir.
- Doğrudan yayında hata olabilir → kaldır düğmesi + imama e-posta + git geçmişi.
- Ucuz kutuda zararlı yazılım → yalnız Google sertifikalı kutu (ana Wi-Fi kullanılacağı için bu şart).
- Telif → metinler Diyanet yayınlarından (kaynak belirtilerek) ya da caminin kendi imam onaylı tercümesinden gelir; cami Diyanet'e bağlı olduğundan izin sorunu yok.

## Doğrulama
- **Site**:
  - `npm run build` + genişletilmiş `site-denetim.mjs`.
  - Negatif test: `kaynakTuru:"aladhan"` verilince derleme düşmeli.
  - `curl -I` ile ETag/304 gözlenir.
- **Sayfa mantığı** (saat dışarıdan verilen birim testleri):
  - Her vakit sınırının ±1 saniyesi
  - Yaz/kış saati geçişleri **25 Ekim 2026** ve **28 Mart 2027**
  - Yaz ortasında gece yarısını aşan kapanma (yatsı 23:18 / imsak 03:53)
  - Ramazan'ın ilk günü, Cuma, kandil
  - Verinin son günü, bugünün kaydının eksik olması, 1970 saati
- **Görsel**: 1080×1920 ekran görüntüsü, en uzun FR metinlerle. Headless Chrome'da iframe düzeneği kullanılır (bilinen dar genişlik tuzağı).
- **Kutu**: bütün ADB komutları `-s SERIAL` ile verilir; ekran görüntüsü 1500 px'e küçültülür.
  - Fiş çek-tak
  - 72 saat internetsiz
  - Modemin yeniden başlatılması
  - 3 gerçek gece (nabız kaydıyla)
- **Pilot**: 7 gün boyunca LED + Diyanet resmî sayfasıyla günlük karşılaştırma.

## Onaydan sonra ilk adımlar
1. Yol haritası bu dosya olarak (`docs/EKRAN-YOL-HARITASI.md`) depoya konur; `superpowers:writing-plans` ile Faz 1 uygulama planı çıkarılır (`docs/EKRAN-FAZ1-UYGULAMA-PLANI.md`).
2. Faz 0 donanım avı başlar: Vinted favorileri, diğer siteler, masaüstüne PDF.
3. Aynı anda Faz 1 (ekran sayfası MVP) ve İ0 (kaynak teyidi) başlar.
