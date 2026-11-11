# İlim Yolu — hesaplar, öğrenme yolları ve ihtida platformu

Onay: Rıdvan, 2 Kasım 2026 (44 soruluk planlama). Kaynak plan: `modular-booping-brooks.md` (oturum plan klasörü).
Bu belge planın teknik ekidir; dilimler ilerledikçe durum satırları eklenir.

## Teknik plan

### Bağlam
- 2 Kasım 2026'da Rıdvan istedi: «egitim.ulucamii.be … kullanıcı adı oluşturup kişisel ilerleme ile takip edebilsin; kurs
  öğrencileri, yeni Müslümanlar, muhtelif yerlerden kullanıcılar; 5 dilde».
- Bugünkü durum:
  - Ezber Kilimi canlı: 81 madde, 5 adım, Kilimim, kartlar, takvim, çevrim dışı.
  - Son egitim yayını 25 Ekim (19); main ile eşit.
  - Hesap ve Firebase SDK yok. İlerleme yalnız `ulucamii:ezber:cihaz:v1` (`src/lib/ezber/cihaz.ts`) içinde.
  - CSP Firebase'i engelliyor (`firebase.json`).
  - Gizlilik metni egitim'de «hesap yok» diyor (`gizlilik.md` L118-125, 5 dil).

### Rıdvan'ın kararları (2 Kasım 2026, 44 soru)

**Ad, adres, tasarım**
- Ad «İlim Yolu» (Chemin du savoir · Path of Knowledge · Weg van kennis · Weg des Wissens); Ezber Kilimi bir bölüm olarak
  kalır.
- Adres egitim.ulucamii.be.
- YENİ tasarım: Claude 2–3 taslak çizer, Rıdvan seçer.

**Hesaplar**
- Giriş e-posta+şifre ya da Google. Herkesin benzersiz, görünen bir kullanıcı adı olur.
- Firebase Blaze; bütçe uyarısı ayda 5 €. Kartı Rıdvan ekler.
- Herkes kendisi kaydolur. Başka camilerin sınıfı yoktur.
- Yaş sorulmaz, 13+ kutusu yoktur.
- Kayıtta isteğe bağlı alanlar:
  - şehir + cami: Belçika'daki 73 BDV camisinin listesi + «diğer» (şehir);
  - «Yeni Müslümanım»: ayrı açık rıza kutusuyla.
- Hesap silme 30 gün bekler, sonra kalıcı olur; 24 ay hareketsiz kalan hesap silinir.

**Kurs öğrencileri**
- Çocuklar: hocanın verdiği kullanıcı adı + kısa şifre ve kare kodlu kart (kartta ad soyad + kare kod). Hoca kartı tek
  dokunuşla iptal eder.
- Veli izni kayıtla alınmıştır; yeni izin adımı yoktur.
- Çocuk sayfası: hocanın basamakları + kendi çalışması aynı kilimde.
- Kurs yetişkinleri: hocanın bağlama koduyla kendi hesabını öğrenci kaydına bağlar.

**İçerik ve öğrenme**
- Bütün kitleler, «en kısa zamanda», parça parça açılır. İlk parça: hesaplar + Ezber Kilimi.
- Kurs bilgisi HEPSİ:
  - yıllık plan konuları kart + mini soru olarak; kitap metni kopyalanmaz, telifli;
  - bilgi maddeleri;
  - seviye testinin 7 alanına göre yol.
- «Öğrendim»: kendisi işaretler, isterse mini sınav da çözer. İsteyen kısa yerleştirme testi çözer.
- Ödül: rozet + basılabilir belge («kendi çalışmasıyla»). Hocanın dinlediği ezberin ayrı sertifikası olur.
- Haftalık e-posta isteyene gider; günü kullanıcı seçer, seçmezse Pazar akşamı.
- Çeviri: Diyanet çevirisi; yoksa Claude çevirir ve «taslak» yazar. Onaylanmamış metin «taslak» etiketiyle görünür.

**Yeni Müslüman yolu**
- 8 adımlı rehber ile 12 haftalık «İlk Adımlar» planı birleşir. Diyanet «İslam Nedir?» videoları olan dillerde (TR, EN)
  eklenir.
- Hoca, yalnız kullanıcı «hocamla paylaş» derse görür; kullanıcı bunu geri alabilir.

**Hocalar ve taşıma**
- Her hocaya ayrı hesap; şimdilik yalnız Rıdvan.
- ŞİMDİ taşınacaklar: veli portalı, hoca ekranı, kurs sayfaları, sesli dersler `/e/`. Basılı kare kod adresleri sonsuza
  dek çalışır.
- ulucamii.be'de kalacaklar: seviye testi, vaazlar, irşat, ihtida formu.

**İhtida platformu**
- ihtida.ulucamii.be: öğrenme yolu aynı kodla; panel + uygulama GERÇEK olur, bütün roller açılır.
- Veri sorumlusu Ulu Camii ASBL (pilot); onay var, hemen açılır, DPIA yine yazılır.
- Kişisel veriler ayrı bir Firebase projesinde (europe-west1) tutulur.
- ulucamii.be ihtida formu kalır; başvurular panelde görünür.
- İlk panel hesabı yalnız Rıdvan (koordinatör).
- «Önizleme» yazısı kalkar; kamu sayfaları aramaya açılır, panel kapalı kalır.

**Duyuru ve deneme**
- Duyuru hepsi bitince yapılır. Bir parçanın açılması için otomatik testler yeterlidir.

**Tasarım ayrıntısı**
- Hava: sade-ferah + geleneksel motifler (çini, kilim, tezhip).
- Ana rengi Claude seçer; taslaklar farklı renk dener.
- Çocuk ve yetişkin aynı görünümü görür.
- Giriş yapan kişi ana sayfada kendi yolunu, «bugün tekrar» listesini ve ilerlemesini görür.

**İhtida paneli ayrıntısı**
- İlk çalışacak işler: başvuru dosyaları + EK-9, kardeş aile eşleştirme, faaliyet günlüğü + üç aylık rapor, «Beni arayın»
  haritası.
- Rıdvan: «bunlar dışında aklıma gelen yok, araştır, tavsiyelerine devam et». Claude, 5. dilimden önce mühtedi destek
  programlarının iyi uygulamalarını araştırır ve kısa bir öneri listesi sunar.
- Yeni Müslüman kendi dosyasını (başvuru durumu, belge, mentor) İlim Yolu hesabıyla görür.
- Belge doğrulama sayfası gerçek olur: yalnız «geçerli/geçersiz» + tarih gösterir, ad göstermez.
- Kurgusal örnekler gerçek içerikle ya da «yakında» bilgisiyle değişir.

### Dilimler

Dilim sırası ve boyutları:

| Dilim | İçerik | Boyut |
|---|---|---|
| 0 | Temel altyapı | S/M |
| 1 | Hesaplar + Ezber Kilimi (ilk yayın) | L |
| 2 | Bilgi yolları | L |
| 3 | Yeni Müslüman yolu (iki site) | M/L |
| 4 | Taşıma | L |
| 5 | Gerçek ihtida paneli | L |

Uygulama düzeni:
- Uygulamayı Sonnet/Opus alt ajanlar yapar; brifinge «commit etme» yazılır.
- Doğrulama, commit, yayın ve kayıt ana oturumda yapılır.
- Her dilim `dogrula:codex` → yayın → canlı denetim → `docs/YAYIN-KAYITLARI.md` zincirinden geçer.
- Başka oturumların dosyalarına dokunulmaz: üye defteri, `gizlilik.md` taslakları, defter-yoklama.

**Ortak kararlar**

1. **Paylaşılan kod:**
   - Tek kaynak `paylasilan/ogrenme-yolu/`: saf TS, içerik JSON ve i18n. Kurum adı yoktur; marka her siteye ayrıca verilir.
   - `scripts/ortak-aktar.mjs` bu klasörü `ihtida-platform/src/ortak/ogrenme-yolu/` içine kopyalar ve `SURUM.json`
     yazar (dosya başına SHA-256 + kaynak commit).
   - Kopyalamadan önce yasak terim taraması yapılır. Terim listesi izlenmeyen yerel bir dosyadadır.
   - ihtida tarafında `scripts/ortak-dogrula.mjs` build'i düşürür (elle değiştirilmiş kopya).
   - Seçilmeyen yollar: monorepo, submodule, npm paketi.
2. **Hesap–alan adı:**
   - Öğrenci hesapları yalnız `ulucamii-portal`'da tutulur; `authDomain: egitim.ulucamii.be`.
   - ihtida sitesi de aynı projeyi `ilim` adlı uygulamayla yükler; aynı hesapla, her sitede bir kez girilir.
   - Personel ve dosyalar yeni projede (örn. `ihtida-rehber`, europe-west1) tutulur. Bir sayfa iki projeyi birlikte
     yüklemez.
3. **Kullanıcı adı:**
   - `kullaniciAdlari/{ad}` belgesine istemci yazamaz; callable `kullaniciAdiAl` yazar.
   - Ad önce normalleştirilir (NFKC, küçük harf), sonra `^[a-z0-9][a-z0-9._-]{2,23}$` kalıbına bakılır.
   - Ayrılmış adlar listesi sunucudadır.
   - Ad değişikliği 30 günde bir yapılabilir.
   - Ekranda `@ad` görünür. Gerçek ad yalnız baskıda yazılır ve saklanmaz.
4. **Çocuk hesabı:**
   - Custom token kullanılır, e-posta yoktur. `cocukHesabiAc` (yalnız hoca) şunları yapar:
     - kullanıcıyı `c_<rastgele>` olarak açar;
     - yetki bilgisi olarak `{rol:'cocuk', ref}` verir;
     - iki kelime + iki rakamdan oluşan şifreyi scrypt ile `gizli/cocuk/{uid}` altına yazar;
     - 128 bitlik kart sırrının SHA-256 özetini saklar.
   - Giriş uçları `/api/cocuk-giris` ve `/api/kart-giris`'tir (Hosting rewrite). 8 hatalı denemede giriş 15 dk kilitlenir.
   - Kart adresi `https://egitim.ulucamii.be/k/#<kartId>.<sır>`. Sır fragment'te durur; girişten sonra `replaceState` ile
     adresten silinir.
   - Kartta ad soyad yazar (Rıdvan'ın seçimi).
   - Hoca şunları yapabilir: `kartYenile`, `cocukSifreYenile`, `cocukOturumKapat` (`revokeRefreshTokens`).

**Dilim 0 — temel**

- **Rıdvan:** Blaze planı + 5 € bütçe uyarısı; Google Cloud veri işleme şartları.
- **Fonksiyonlar:** her fonksiyonda `maxInstances: 2`.
- **Auth:**
  - Google, e-posta+şifre ve e-posta bağlantısı açılır.
  - `fb-auth-ayar.py` ile TAM alan listesine egitim ve önizleme kanalları eklenir.
  - OAuth istemcisine `https://egitim.ulucamii.be/__/auth/handler` eklenir.
- **`functions/`:** TypeScript, Node 22, gen2, europe-west1, codebase `ilim-yolu`; esbuild ile `src/lib/**` içe aktarılır.
  `firebase.json` içinde `/api/**` rewrite tanımlanır.
- **`firebase.json` başlıkları:**
  - `X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'self'`, `frame-src 'self'`;
  - `script-src` listesine `https://apis.google.com`;
  - `connect-src` listesine firestore/identitytoolkit/securetoken.googleapis.com ve Apps Script (yalnız tek dağıtımın tam adresi + script.googleusercontent.com; G-10).
  - `/__/auth/*` başlıkları önizleme kanalında sınanır.
- **Emülatör ve testler:**
  - `firebase.emulators.json` dosyasına Auth ve Functions emülatörleri eklenir.
  - `scripts/test-kurallar.mjs` içindeki port bekçisi güncellenir; yeni `test:hesap` komutu eklenir.
  - `scripts/egitim-canli-denetim.mjs` yeni başlıklara göre güncellenir.
- **Tasarım:** «İlim Yolu» için 2–3 tasarım taslağı hazırlanır (sade-ferah + geleneksel motif). Ekran görüntüsü ve
  karşılaştırma Rıdvan'a gider.

**Dilim 1 — hesaplar + Ezber Kilimi (ilk yayın)**

- **Yeni sayfalar ve dosyalar:**
  - `egitim/src/pages/[dil]/hesap/{index,giris,kayit}.astro`
  - `egitim/src/pages/k/index.astro` (kartla giriş)
  - `egitim/src/scripts/hesap.ts`
  - `egitim/src/lib/firebase-istemci.ts` (dinamik `firebase/auth` + `firestore/lite`; anonim sayfalar Firebase'siz kalır)
- **Kayıt akışı:**
  - E-posta+şifre ya da Google ile kayıt; ardından zorunlu kullanıcı adı adımı.
  - İsteğe bağlı şehir/cami: `public/data/belcika-camileri.json` listesinden + «diğer».
  - «Yeni Müslümanım» işaretlenirse `kullanicilar/{uid}/ozel/hassas` belgesine
    `{muhtedi, riza:{zaman,metinSurum}}` yazılır. Bu bilgi Auth'a ya da token'a asla girmez.
- **Cihazdaki ilerlemenin hesaba taşınması (`src/lib/ezber/cihaz.ts`):**
  - Saf `birlestir(yerel, bulut)` fonksiyonu: madde başına en yeni `son` kazanır; `gunler` birleşimi `gunleriTemizle` +
    `budaYap` ile süzülür. Buluttan gelen her okuma `temizle()`'den geçer.
  - Kullanıcı başına ayrı anahtar: `ulucamii:ezber:cihaz:v1:u:<uidHash>`.
  - İlk girişte «Bu cihazdaki N madde hesabına eklensin mi?» diye sorulur.
  - Eşitleme açılışta ve `visibilitychange` olayında yapılır.
- **Birleşik kilim:**
  - `src/lib/ezber/kilim.ts` içine birleşik kip eklenir: hocanın basamağı dolgudur. Kendi dokusu (`kilimim.ts`) yalnız
    hocanın basamağı ≤ 1 olan yerlerde görünür.
  - Hoca notları `src/lib/ezber/veli.ts` içindeki `veliSeritleri` ve `veliDinlemeleri` ile çocuk diline çevrilir.
- **Hoca ekranı (`src/scripts/hoca-ekrani.ts`):**
  - Yeni düğmeler: «Öğrenci hesabı aç», «Kart bas» (A4'e 8 kart; `kare-kod.ts` + kartlar baskı CSS'i), «Bağlama kodu».
  - Rıdvan'ın `hocalar/{uid}` kaydı mevcut yönetim akışıyla açılır. Betik açılmaz, kopyalanmaz.
- **Veri modeli:**
  - `kullanicilar/{uid}`: `{ad, dil, tur: genel|cocuk|kursYetiskin, ref?, sehir?, cami?, tercihler:{haftalik,gun,saat},
    olusturma, sonGiris}`.
  - `kullanicilar/{uid}/calisma/{ezber|bilgi|yol}`
  - `ogrenciHesaplari/{ref}`
  - `bagKodlari/{hash}`: 8 karakter, tek kullanımlık, 14 gün geçerli.
  - `gizli/**`
- **Kurallar (`firebase/firestore.rules`):**
  - Yeni yardımcılar: `oturum()`, `sahip(uid)`, `ogrenciOkur(ref)`.
  - `ezberDurum/{ref}` ve `olaylar` okumasına `|| ogrenciOkur(ref)` eklenir.
  - `calisma`: yalnız 3 ad, ≤ 120 madde, `guncelleme == request.time`.
  - `gizli`, `bagKodlari` ve `kullaniciAdlari` istemciye kapalıdır.
  - `hassas` belgesini yalnız sahibi okur ve yazar.
- **Fonksiyonlar:**
  - Hesap: `kullaniciAdiAl`, `hesabimiSil` (30 gün bekletir, sonra özyinelemeli siler).
  - Çocuk: `cocukHesabiAc`, `cocukGiris`, `kartGiris`, `kartYenile`, `cocukSifreYenile`, `cocukOturumKapat`.
  - Bağlama: `bagKoduUret`, `hesabiBagla` (ref yetkisini verir; istemci token'ı tazeler).
  - `portalSilmeTetik`: öğrenci silinince çocuk hesabını tümden siler, yetişkinin bağını çözer.
  - `hareketsizTara`: aylık; önce kuru çalışır, 24 ay hareketsiz hesaba 30 gün önce uyarı gönderir.
- **Testler:**
  - `tests/kurallar/ilim-yolu.test.mjs`: e-postasız `ref` yetkili çocuk, rastgele kullanıcı, başka `ref` okuması.
  - `tests/fonksiyonlar/*.test.mjs`: custom token, kilitlenme, kart yenileme, bağlama kodunun ikinci kullanımı,
    Google ile veli e-postası çakışması.
  - `tests/ezber-cihaz-birlestir.test.mjs`; `tests/ezber-kilim.test.mjs` içine birleşik kip.
  - Playwright: gerçek CSP ile giriş, sıfır CSP ihlali.
- **Gizlilik:** `src/content/sayfalar/{5 dil}/gizlilik.md` L118-125 yeniden yazılır ve egitim'e de bir sayfa açılır.
  İçerik:
  - veri sorumlusu ve kategoriler;
  - Md. 9(2)(a) rızası;
  - çocuk hesaplarının dayanağı kurs kaydıdır;
  - Auth ABD'de tutulur (DPF + SCC);
  - saklama: 24 ay; çocuk hesabı kurstan ayrılınca silinir;
  - silme 30 gün bekler.
  - Ayrıca kurs kayıt formunun rıza metni okunur; online hesabı kapsamıyorsa Rıdvan'a tek satırla bildirilir.
- **Yayın sırası:** `test:kurallar` + `test:hesap` → `firebase-cami.ps1 deploy --only functions` →
  `npm run firebase:kurallar` → ana site push (hoca ekranı) → `npm run egitim:yayinla` → `egitim:canli` → kayıt.

**Dilim 2 — bilgi yolları, rozet, belge, haftalık e-posta**

- **Bilgi kartları:** `src/data/ilim-yolu/bilgi-kartlari.json` (+ şema).
  - Kaynak yalnız yıllık planın `kazanim` ve `ozet` alanları + `src/data/ezber/bilgi/`.
  - Kitap metni girmez; bir test bunu reddeder.
- **Mini sorular:** her dilde `durum: taslak|onayli`, `kaynak: diyanet|claude`. Ortak bir «taslak» etiket bileşeni
  kullanılır.
- **Seviye yolu:** `src/lib/seviye-testi/tipler.ts` içindeki 7 `AlanKodu`.
- **Yerleştirme testi:** `sorular/` alt kümesi + `puanlama.ts`, tarayıcıda çalışır. Hiçbir şey gönderilmez; yalnız yol
  önerir.
- **Rozet ve belge:** `calisma-belgesi.astro`, `BelgeCercevesi.astro` ve `src/lib/ezber/belge.ts` yeniden kullanılır;
  belgede «kendi çalışmasıyla» yazar.
- **Haftalık e-posta:**
  - `haftalikKuyruk` (saatlik, Europe/Brussels) `epostaKuyrugu/{id}` yazar (TTL 7 gün).
  - Apps Script 10 dakikada bir kuyruğu boşaltır: `epostaGonder(…,'kurs')`, Brevo.
  - Abonelikten çıkma: HMAC bağlantısı + `List-Unsubscribe` başlığı.
  - Apps Script v47 olur.

**Dilim 3 — yeni Müslüman yolu (iki site)**

- **İçerik:** `src/i18n/egitim-rehberi.ts` (8 adım) + `D:\muhtedi-koordinatorlugu\04_Egitim_Materyalleri\Ilk_Adimlar\`
  (12 hafta) → `paylasilan/ogrenme-yolu/icerik.json`.
  - Diyanet çevirisi yoksa Claude çevirir ve «taslak» yazar.
- **Videolar:** `src/data/diyanet-videolar*.json` (TR, EN); youtube-nocookie, tıklayınca açılır. `frame-src` yalnız bu
  yollarda açılır.
- **İşaretlerin taşınması:** `MuhtediEgitimi.astro` sayfasındaki cihaz işaretleri hesaba taşınır.
- **Hocayla paylaşma:** `paylasimlar/{uid}` = `{hocalar:[≤3], zaman}`. Yalnız öğrenen yazar; silince erişim kapanır.
- **ihtida tarafı:**
  - Modül vendor kopya olarak alınır; öğrenme sayfaları eklenir.
  - CSP meta etiketine Firebase alanları eklenir.
  - Yalnız BDV markası görünür.
  - Yasak terim taraması `dist/` ve `git ls-files` üzerinde SIFIR olmalı.

**Dilim 4 — taşıma (veli portalı, hoca ekranı, kurs sayfaları, `/e/`)**

- **Sayfalar:**
  - `egitim/src/pages/[dil]/veli/` ve `egitim/src/pages/hoca/` kabukları `@ortak/scripts/veli-portali` ve
    `@ortak/scripts/hoca-ekrani` dosyalarını içe aktarır; kaynak tek kalır.
  - Kurs sayfaları içerik koleksiyonlarıyla taşınır (`base: '../src/content/...'`).
  - `/e/<kod>/` sayfaları `src/data/ecouter.json` dosyasından üretilir; sesler ulucamii.be'de kalır.
- **ulucamii.be'deki yönlendirmeler:**
  - `search` ve `hash` korunur (oobCode bağlantıları çalışmaya devam eder).
  - Sayaç yoktur; `noindex`, canonical ve meta-refresh yedeği vardır.
  - Basılı `/e/` kodlarının hepsi için bir test vardır.
- **Oturum:** herkes bir kez yeniden giriş yapar. `actionCodeSettings.url` egitim'e taşınır. Velilere tek bir bilgi
  verilir (Rıdvan onaylar).
- **Hocalar:** hoca ekranında hoca ekleme. `hocalar/{uid}` kaydı her hocaya ayrı açılır; değişiklikler `olaylar`
  kaydında kimin yaptığını taşır.
- **Service worker:** `/hoca/`, `/*/veli/`, `/*/hesap/` ve `/k/` sayfa önbelleğinin dışında kalır.
- **CSP:** satır içi `style=` ihlalleri Playwright CSP geçişiyle bulunur ve düzeltilir.

**Dilim 5 — gerçek ihtida paneli ve uygulaması**

- **Önce yazılacaklar:** Claude DPIA'yı, işleme kaydını ve personel gizlilik taahhüdünü yazar; Rıdvan imzalar. Belgeler
  özel Drive'da tutulur, iki açık depoya da girmez. İlk gerçek kayıt bunlardan sonra alınır (Rıdvan: onay var).
- **Panel önerileri:** mühtedi destek programlarının iyi uygulamaları araştırılır, Rıdvan'a kısa bir öneri listesi
  sunulur.
- **Yeni proje ve barındırma:**
  - Örneğin `ihtida-rehber`: europe-west1, Blaze + bütçe uyarısı, `scripts/firebase-ihtida.ps1`.
  - ihtida.ulucamii.be Firebase Hosting'e taşınır (gerçek başlıklar, `/__/auth`). Bunun için bNamed'de CNAME değişir;
    bu ayrı bir canlı adımdır.
- **Veri modeli** (`src/data/ornek-dosyalar.ts` rollerinden; yalnız seçim alanları, serbest metin yok):
  - `personel/{uid}`
  - `basvurular/{IH-ref}`
  - `kisiler/{kod}`
  - `kisiler/{kod}/kimlik/ad` (yalnız koordinatör)
  - `kisiler/{kod}/iletisim/ana`
  - `kisiler/{kod}/olaylar`
  - `faaliyetler`
  - `denetim/{id}` (yalnız eklenir)
- **Roller (kurallar):**
  - Koordinatör + kayıt yetkilisi her şeyi görür.
  - Bölge sorumlusu yalnız `bolge == token.bolge` olan kayıtları görür.
  - Din görevlisi ve kardeş aile yalnız `uid in gorevliler` olan kayıtları görür.
- **Fonksiyonlar ve güvenlik:**
  - `personelDavet`, `rolAta`, `basvuruKabul`, `denetimYaz`.
  - Koordinatöre TOTP iki adımlı giriş.
  - Uygulama yalnız bellek önbelleği kullanır; 30 dakika boşta kalınca oturum kapanır.
- **Form → panel:**
  - `ihtidaPostIsleV2` içinde, Sheet yazımından sonra `ihtidaPaneleYansit` çalışır: REST `createDocument` (409 = zaten
    var).
  - Hata olursa kuyruktan yeniden denenir; başvuranın gönderimi asla düşmez.
  - Eski kayıtlar `ihtidaPaneleGeriDoldur` ile önce kuru çalışmayla aktarılır.
- **Kişisel alan:** yeni Müslüman, personelin verdiği bağlama koduyla İlim Yolu hesabını dosyasına bağlar. Özet
  `kullanicilar/{uid}/ihtida/ozet` belgesine yansıtılır: aşama, belge no/tarih, mentorun ön adı.
- **Belge doğrula:** public fonksiyon; hız sınırlı; yalnız «geçerli/geçersiz» + tarih döner.
- **Kamu sayfaları:**
  - Önizleme uyarısı, `noindex` ve `robots` kapısı kalkar; panel ve `/app/` noindex kalır.
  - Kurgusal içerik gerçek içerikle ya da «yakında» bilgisiyle değişir.
  - Başvuru formu ulucamii.be formuna bağlanır.
- **ihtida-platform kuralları sürer:** Müşavirlik/elçilik terimleri hiçbir yerde geçmez (her değişiklikten sonra
  tarama); tek kurum BDV; telefon numarası yok.

### Doğrulama (her dilimde)
- `npm run dogrula:codex` 10/10 + `test:kurallar` + `test:hesap` (Auth/Functions emülatörü).
- Playwright: 5 dil, 320 px, iki tema, klavye, sıfır CSP ihlali, JS kapalıyken anonim sayfalar.
- Canlı: `npm run egitim:canli -- https://egitim.ulucamii.be`, `/__/auth` başlıkları, gerçek hesapla uçtan uca
  (`.test` adresli deneme hesabı, sonra silinir).
- ihtida: `npm run build` + `test:onizleme` (gerçeğe uyarlanmış) + yasak terim taraması SIFIR.
- Kayıt: `docs/YAYIN-KAYITLARI.md`, `DEVAM.md`, hafıza (`egitim-platformu`, `ezber-kilimi-kararlari`, ihtida notu
  «dokunulmaz» → «gerçek, pilot»).

### Riskler
- Bütçe uyarısı harcamayı durdurmaz; bu yüzden `maxInstances` sınırı konur.
- Auth verisi ABD'de tutulur.
- Google girişi aynı gmail.com adresli şifreli hesabı devralabilir.
- `/__/auth` başlıkları sınanmamıştır.
- Brevo'nun günlük sınırı vardır.
- Kurs kayıt rızasının online hesabı kapsayıp kapsamadığı bilinmiyor.
- İki depo da herkese açıktır.
- Taslak çeviriler öğrencilere görünür.
- ihtida.ulucamii.be'yi taşırken DNS değişikliği gerekir.

## Kart seslendirmesi: ses nereden gelir, nasıl geri getirilir

- Bilgi kartlarının «Dinleyin / Écouter» çaları yalnız **tr ve fr** içindir (en/nl/de'de kontrol yoktur). Kontrol, `src/data/ilim-yolu/kart-ses.json` manifesti o kart ve dil için dosya listeliyorsa çizilir.
- **Barındırma:** MP3'ler egitim Firebase Hosting'in kendi alanından, aynı kökenden çalar: `egitim/public/media/ses/kart/<dil>/<kart-kimliği>.mp3` (519 dosya, ≈ 95 MB, mono 64 kbps). Ana siteye (ulucamii.be) EKLENMEDİ: Pages çıktısı zaten büyük, dağıtım zaman aşımına uğruyordu. CSP `media-src 'self'`; `/media/ses/kart/**` için `Cache-Control: public, max-age=604800` (bir hafta; hatalı bir anlatım düzeltilirse en geç bir haftada herkese ulaşır). Service worker bu dosyaları önceden indirmez ve kaydetmez (sayfa dosyası/`/_astro/` dışı aynı köken istekleri SW'den geçmez); sesler çevrim dışı kutuya girmez.
- **Git'te yok:** `egitim/public/media/ses/kart/` `.gitignore`'dadır. Git'te yalnız manifest durur (kimlik, dil, süre, bayt, sha256).
- **Koruma (bekçi):** `npm run egitim:build` başında ve sonunda `node scripts/kart-ses-al.mjs --denetle` (ikincisi `--dist`, derlenmiş çıktıyı denetler) çalışır; manifestte listelenen dosya eksik, bayt ya da sha256 farklıysa ya da klasörde manifestsiz dosya varsa AÇIK iletiyle başarısız olur ve derleme/yayın (`egitim:yayinla`) durur. Temiz klondan yayın bu yüzden sessizce bozuk «Dinleyin» düğmeleri çıkaramaz. GitHub CI egitim'i hiç derlemez (`deploy.yml` yalnız ana siteyi derler; egitim yalnız yerelde yayınlanır) ve `test:ilim-yolu` CI'da koşmaz; bu yüzden ortam bayrağı gerekmedi. Kural basit: egitim derlemesi her zaman denetler.
- **Geri getirme (dosyalar yoksa):** kaynak `D:\sesli-anlatim\ilim-yolu-kartlar\` (`MANIFEST.json` + `tr\`, `fr\`; bu klasör salt okunur kaynaktır). Komut: `node scripts/kart-ses-al.mjs` (önce `--kuru`). Betik her kaydı doğrular (kimlik, dil, MP3, bayt, sha256), dosyaları kopyalar ve manifesti yeniden üretir; bozuk kayıtta hiçbir şey yazmaz. Kaynak da yoksa sesler yeniden üretilmeli (aşağıdaki üretim notu) ve manifest yenilenmelidir.
- **Hariç:** fr `ku-044`, `ku-047`, `ku-048` (Arapça tecvid terimlerinin Fransızca okunuşu imam tarafından henüz onaylanmadı) içe alınmaz; bu kartlarda fr'de kontrol yoktur (tr'de vardır). İmam onaylarsa `HARIC` kümesinden çıkarılıp betik yeniden çalıştırılır.
- **Üretim:** Gemini TTS `gemini-3.1-flash-tts-preview`, ses «Charon», 10 Kasım 2026; çoğu Vertex (`vertex-global`, dernek kredisi), 25 dosya Gemini API anahtar havuzu. Toplam ≈ 3,4 saat. Vertex maliyeti üst sınır ≈ 6 $ (dernek kredisinden). Sayfa, sesin yapay olduğunu söyler.

## Okuma sesleri (o8 tecvid uygulamaları, o9 kısa âyetler): ses nereden gelir, metin nasıl doğrulandı

- **Ne:** Kur'an Okuma'ya iki adım SONA eklendi (eski madde kimlikleri ve ilerleme dizeleri değişmez; parmak izi testi). o8 = 105 tecvid örneği (zamir hâsı, râ, idğâm bilâ ğunne/misleyn/mütekâribeyn/mütecâniseyn, muttasıl ve lâzım med, hurûf-u mukattaa; idğâm ve hurûf maddelerinde «Yazılışı/Okunuşu» çifti), o9 = 60 kısa âyet (Bakara 1–5, Âyetü'l-Kürsî, Bakara 285–286, Haşr 22–24, Fîl, Kureyş, Mâûn, Kevser, Kâfirûn, Nasr, Tebbet, İhlâs, Nâs; besmeleler dâhil). Hepsi Diyanet Elifbâ kaydı; yapay ses yok.
- **Nereden çalar:** `egitim/public/media/ses/okuma/yeni/…` (egitim Hosting, aynı köken, bir hafta önbellek). Git dışıdır (`.gitignore`, 21 MB, 165 dosya); git'te künye `docs/okuma-ses-kaynaklari-egitim.json` (her dosya için Diyanet adresi, bayt, sha256), madde verisi `src/data/okuma/yeni.json`, doğrulama kaydı `docs/okuma-metin-dogrulama.json`. Eski 225 madde ulucamii.be'den çalmaya devam eder; `yerelSesMi()` ayrımı yapar. Bu sesler çevrim dışı kutuya girmez (SW ses önbelleği yalnız ulucamii.be içindir).
- **Bekçi:** `npm run egitim:build` başta ve sonda `node scripts/okuma-ses-ekle.mjs --denetle [--dist]` çalıştırır; eksik/bozuk/yetim dosyada açık iletiyle durur. Geri getirme: `node scripts/okuma-ses-ekle.mjs --uret` (kaynak `D:\tmp\ilim-yolu-okuma-ses`; yoksa Diyanet adresleri künyede).
- **Metin doğrulaması** (`--dogrula --kuran <kuran_arapca.json>`; tam Kur'an metni depo dışı: `D:\app\Ihtisas2027\data-prep\kaynak\`): Arapça metin Diyanet kaydından OLDUĞU GİBİ alındı. Kanonik karşılaştırma yalnız yazılış biçimini eler (elif/hemze, hançer elif, işaret kodlaması); ünsüz/hareke/şedde/sükûn farkı eşitsizliktir. Âyetler Ezber Kilimi metniyle sıkı kipte karşılaştırıldı (Bakara 1–5 için depoda kaynak yok: tam metne karşı). Tecvid «yazılışı» örnekleri tam metinde kelime sınırlarında aranıp sûre:âyet'i kaydedildi; «okunuşu» maddeleri eşiyle ≤ 3 harf farkla DOLAYLI kabul edildi (Kur'an'da aynen geçmez); hurûf-u mukattaa sûre başlangıçlarıyla ve harf adı açılımıyla.
- **Alınmayanlar:** 156 tecvid örneğinden 51'i (23 maddede Arapça metin yok; 14 «Mushaflarda yer alan işaretler» maddesinin metni Türkçe açıklama; 12 «tenvinli kelimelerden geçiş» fonetik yeniden yazım; 1 zamir ve 1 lâzım örneği tam metinde bulunamadı). Ayrıca Bakara 1–141 (metin kaynağı yok), 115 Türkçe ders sesi, 25 etiket sesi, ihfâ/idğâm/iklâb/kalkale uygulamalarının 43 âyet parçası (sonraki tur adayı).

## Durum (11 Kasım 2026, öğleden sonra): ana sayfada kişisel yol, egitim gizlilik sayfası, Kur'an kartlarına mini sınav CANLI

- Ana sayfa (girişli): Bugün = en son çalışılan kart yolunun sıradaki kartı; Kaldığınız yer ve Yolunuz Ezber/kart yolu arasında en yeniye gider; başlanmış 5 plan yolu kartı (kilim şeridi) ve rozet sayısı. Cihazdaki «son kart» kaydı (`ulucamii:bilgi:son:v1`) yalnız cihazda, çıkışta silinir. Yeni Müslüman yolu ana sayfada iz bırakmaz (testle sabit). Ziyaretçi görünümü değişmedi.
- `/<dil>/gizlilik/`: `src/content/sayfalar/<dil>/gizlilik.md` tek kaynak (`src/lib/gizlilik-bolumleri.ts` iki dilim keser; çapa düşerse derleme ve `tests/egitim/gizlilik-bolum.test.mjs` kırılır). Dizine girer, kendi kanonik adresi var; alt bilgi, hesap ve kayıt sayfaları buraya bağlanır.
- 75 `ku-*` kartına 93 mini soru (5 dil, 3 şıklı); artık sorusuz kart yok. Kaynak alanı «claude»; terimler imam onayında.
- Canlı: egitim:canli 110/110; ayrıntı ve koşu bağlantıları `YAYIN-KAYITLARI.md`.

## Durum (11 Kasım 2026, akşam): güvenlik ve gizlilik gözden geçirmesinin kalanı (G-03…G-12)

Kaynak: `D:	mpilim-yolu-arastirmaguvenlik-gizlilik-gozden-gecirme-20261111.md`. Daha önce kapananlar: G-01 (iş bölme), G-02, G-04, G-13, G-14, G-15. Her madde ayrı commit.

- **G-06 + G-07 (kapandı):** `calisma/{bilgi,okuma,ibadet}` ve `ozel/yol12` değerleri tür+boyut sınırlı (bilgi kodu ≤ 800, okuma adımı ≤ 2400, ibadet/yol12 konusu ≤ 16 karakter, anahtarlar sabit liste); istemcinin bugün yazdığı en büyük yük (bilgi 5 × 400, okuma 9 × 1200, ibadet 7 × 5, yol12 12 × 4) ve eski istemci yükleri testle geçer. `ezber`/`yol` belgelerinde değerler iç içe nesne olduğundan (kurallarda döngü yok) yalnız madde sayısı sınırlı kaldı: **bilerek bırakıldı**. `okuma`/`ibadet` için olumlu/olumsuz kural testleri eklendi. Kurallar yayında, canlı = dosya (sha256 `e1dc2fc8…`); önceki küme `2027e5b8…`.
- **G-03 + G-08 (kapandı):** `cocukGiris` kilidi artık (kullanıcı adı + IP özeti) çiftine bağlı (8 hata / 15 dk); ad başına yedek tavan 40 hata / 15 dk (IP'den bağımsız). Ad var da olsa yok da olsa aynı sayaçlar çalışır: kilitli ad ile bilinmeyen ad dışarıdan ayırt edilemez (aynı 401 dizisi, 8. hatada aynı 429). `kartGiris` örnek yük tavanından (`yukAsildi`) muaf; `kullaniciAdiAl` uid başına günde 30 deneme (`ad-sorgu-sinirli`, sayaç `gizli/giris/ipler/kad_<uid>`, TTL). Hoca şifre yenileyince `sifirlama` damgası eski sayaç pencerelerini geçersiz kılar. En kötü durum tahmin sayısı (tek kullanıcı adı, 230 sözcük → ≈ 5,3 milyon olası şifre): tek gerçek IP için saatte ≤ 30 (IP sayacı) ve ≤ 32 (çift sayacı); IP sahteciliğiyle (işlev adresine doğrudan) ≤ 40 / 15 dk ≈ 160 / saat. Eski sürümde ad başına 8 / 15 dk (≈ 32 / saat) idi; kart girişi şifre kilidinden hiç etkilenmez, böylece yabancı bir kişi çocuğu kartla girişten alıkoyamaz.
- **G-11 (kapandı):** `abonelikCik` her yanıtta (200/302/400/405) `X-Frame-Options: DENY`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`, nosniff, no-referrer yazar. `/__/auth/handler` çerçevelenebilir kalır: **kabul edilmiş risk** (Firebase'in ayrılmış yolu, Hosting başlıkları ve özel başlık uygulanmıyor; `authDomain`'i ayrı bir alana taşımak ancak ayrı bir kararla yapılır).
- **G-10 (kısmen):** egitim CSP `connect-src` Apps Script için artık yalnız tek dağıtımın tam adresi (`…/macros/s/<kimlik>/exec`; hoca ekranının `GAS` sabiti = `site.yaml` `basvuru`) + `https://script.googleusercontent.com`. Playwright (`tests/egitim/csp-apps-script.spec.mjs`, gerçek başlık): tam adres ve yönlendirme geçer, başka dağıtım/yol CSP ile kesilir. Dağıtım adresi değişirse `hoca-ekrani.ts`, `site.yaml` ve `firebase.json` birlikte güncellenmeli (`barindirma.test.mjs` üçünün eşitliğini denetler). `script-src https://apis.google.com` **olduğu gibi kaldı**: Google girişi emülatörde apis.google.com yüklemiyor, daha dar kaynağın çalıştığı kanıtlanamadı.
- **G-05 + G-09 (kapandı):** gizlilik metni (5 dil, yalnız «İlim Yolu» bölümü): okuma/ibadet ilerlemesi, Yeni Müslüman yolu (işaretler, kim görmez, silme, önbellek yok), YouTube (yalnız tıklayınca, youtube-nocookie), yapay zekâ ile üretilen kart seslendirmesi, e-posta kuyruğu ve Brevo günlükleri, CDN, giriş kilidinin yeni biçimi. G-09: hareketsiz hesap silmenin henüz devreye alınmadığı (platform Kasım 2026'da açıldı, ilk etki en erken Kasım 2028) açıkça yazıldı; **takvim notu: `ILIM_SIL_GERCEK` açılmadan önce metin yeniden güncellenir ve açma Kasım 2028'den önce yapılır.**
- **Çıkışta cihaz kopyaları:** bilgi, okuma ve ibadet hesap kopyaları da çıkışta önce buluta gönderilir, sonra cihazdan silinir (gönderilemezse mevcut «yine de çıkılsın mı?» sorusu); anonim kopyalara dokunulmaz.
- **G-12 (yalnız `dilim4-p7` dalında):** `robots.txt` `Disallow: /hoca/` ve `/*/veli/` satırları kalktı; `firebase.json`'a bu yollar için `X-Robots-Tag: noindex, nofollow` eklendi; testler ve canlı denetim uyarlandı. Dal main'e birleşmedi (P7 yayını ayrı karar).
- **Bilinçli bırakılanlar:** `yayinla` işine zorunlu onaylayıcılı Environment (otomatik veri tazelemeyi bloklar), `ezber`/`yol` değer sınırları (yukarıda), App Check (F-09).

## Durum (11 Kasım 2026): «Yeni Müslüman yolu» (/<dil>/yollar/yeni-musluman/)

- **Ne:** 12 hafta + 8 adım, 5 dil. İçerik tek kaynaktan, `paylasilan/ogrenme-yolu/icerik.json` (ihtida.ulucamii.be aynı dosyayı `npm run ortak:aktar` ile alır); egitim derleme anında doğrudan okur, kopya YOK, dinî metin düzenlenmez. Sayfalar: dizin, `h01…h12`, `adim-1…adim-8` (`egitim/src/pages/[dil]/yollar/yeni-musluman/`, veri `egitim/src/lib/yeni-yol.ts`, metinler `egitim/src/i18n/yeni-yol.ts`). Konusu açıkça örtüşen haftalar platform çalışmasına bağlanır (yalnız bağlantı; `PLATFORM_BAGLANTILARI`): h01–h02 itikat planı, h03 siyer planı, h04 ve h07 Kur'an Okuma, h05 Abdest, h06 Namaz, h08 ahlak planı, h10–h11 ibadet planı; h09 ve h12 bağlantısız.
- **Video:** yalnız JSON'daki Diyanet videoları, yalnız TR ve EN'de (kendi dili); tıklanana kadar iframe ve YouTube isteği yok; `youtube-nocookie.com`. CSP: `frame-src 'self' https://www.youtube-nocookie.com` (başka yönerge değişmedi).
- **İlerleme (ne saklanır):** hafta başına dört işaret: soru 1, soru 2, uygulama, hafta (`h01…h12`, her biri 4 karakterlik '0'–'3' dizesi; bit 1 = tamam, bit 2 = ilk denemede doğru). Cevap metni, ad, zaman, sayaç YOK. Cihazda `localStorage` `ulucamii:yeniyol:cihaz:v1` (girişliyse `:u:<uid özeti>`). Girişliyse ayrıca `kullanicilar/{uid}/ozel/yol12` (`{v, maddeler, guncelleme}`), **calisma/ altında DEĞİL**: calisma listesini kursun hocası okuyabilir; `ozel/yol12` yalnız sahibi okur/yazar/siler (list kapalı). Haftalık e-posta (`functions/src/eposta.ts` adla okur), hoca/veli ekranları ve raporlar bu belgeye uzanmaz (test: `tests/ilim-yolu-yeni-yol.test.mjs`). Hesapsız yapılan işaret girişte hesaba kendiliğinden katılmaz (ibadet/okuma gibi giriş sorusu eklenmedi). `/kilimim` satırı ve «bugün tekrar» eklenmedi: ev kalıbı (kart/madde kimliğine bağlı) bu hafta kayıtlarına uymuyor, ve ilerleme belgesini sahibi dışındaki hiçbir görünüme (kilim, tekrar, e-posta, rapor) taşımamak için.
- **Kurallar:** `firestore.rules` `ozel/{belge}` bloğuna `yol12` (biçim: `v`, `maddeler` ≤ 12 anahtar h01–h12, `guncelleme == request.time`); `calismaAdi()` değişmedi. Testler `tests/kurallar/ilim-yolu.test.mjs` (son test).
- **Çevrim dışı:** dizinde `CevrimdisiKutu` (20 sayfa birlikte, ses yok). Site haritası, hreflang, canonical, `egitim-canli-denetim`, `egitim-dist-taban.json` (taban 3020) güncellendi.
- **Testler:** `tests/ilim-yolu-yeni-yol.test.mjs` (node), `tests/egitim/yeni-yol.spec.mjs` (Playwright: akış, video tıklama, CSP 0, axe, 320–1280 px).

## Durum (11 Kasım 2026, öğleden sonra): Yeni Müslüman yolu — hesap, silme ve cihaz izi

- **Hesaba ekleme:** girişli kullanıcı dizini açtığında cihazdaki (hesapsız) işaretler hesapta yoksa BİR kez sorulur (`yolTeklif`; sessiz yükleme yok). Evet: birleşim (VEYA), anonim kopya hesabın cihaz kopyasına katılıp silinir, bulutla eşitlenir; hesaptaki hiçbir işaret silinmez. «Şimdi değil»: `ilim:y12:d:v1:u:<özet>` içinde yalnız sayı tutulur, aynı sayıda yeniden sorulmaz.
- **«Bu cihazdaki izleri silin»:** onay paneli (odak «Vazgeçin»de, Esc iptal; alert/confirm yok): cihaz anahtarları (yeni + eski ad), Cache API kopyaları ve girişliyse `ozel/yol12` silinir. Bulut silinemezse `{sil:true}` bayrağı kalır; sonraki `yolEsitle` önce belgeyi siler, birleştirmez (silinen işaret geri gelmez).
- **Çıkış kuralı:** `cikisYap` önce yol işaretlerini de hesaba gönderir (olmazsa mevcut «yine de çıkılsın mı?» sorusu), sonra hesabın cihaz kopyasını siler; cihazda yalnız durum anahtarı (sayı/bayrak, işaret yok) kalır; hesapsız (anonim) işaretlere dokunulmaz. Bilgi, okuma ve ibadet cihaz kopyaları da aynı kuralla (önce gönderilir, sonra silinir) çıkışta kalkar (12 Kasım 2026).
- **Gizlilik sertleştirmesi (G-04, G-15):** depo anahtarı `ilim:y12:v1` (eski `ulucamii:yeniyol:cihaz:v1` bir kez okunup taşınır ve silinir); `/<dil>/yollar/yeni-musluman/` sayfaları service worker tarafından ÖNBELLEĞE ALINMAZ, etkinleşmede eski kopyalar silinir; dizindeki çevrim dışı kutusu kalktı; YouTube iframe'inde `sandbox="allow-scripts allow-same-origin allow-presentation"` (gerçek ağda oynatıcı yükleniyor).
- **Testler:** `tests/ilim-yolu-yeni-yol.test.mjs` (teklif, idempotent, bekleyen silme, çıkış, anahtar taşıma), `tests/egitim/cevrimdisi.test.mjs`, `tests/egitim/yeni-yol-hesap.spec.mjs` (emülatörsüz sahte Auth + Firestore REST).

## Durum (11 Kasım 2026): egitim OTOMATİK YAYIN (P7 öncesi engel kalktı)

- `.github/workflows/egitim-yayinla.yml`: main'de egitim'i ilgilendiren push'ta, başarılı ana site yayınından sonra (zamanlanmış/namaz tetikli koşular) ve elle derler, kapılardan geçirir, Hosting'e (`hosting:ulucamii-egitim`, başka hiçbir şey) yayınlar ve canlıyı denetler. Kimlik: Workload Identity Federation, JSON anahtar yok. Tüm kurallar, IAM nesneleri ve geri alma: `docs/EGITIM-PLATFORMU.md` «Otomatik yayın».
- **Kural:** sesler (≈ 116 MB, git dışı) CI'da canlı siteden geri alınıp manifestle doğrulanır; yeni ses her zaman ÖNCE yerelde `npm run egitim:yayinla` ile girer. Kart sesi ve okuma sesi bölümlerindeki «geri getirme» yolu yerel yoldur; CI yolu yalnız mevcut sesleri korur.
- Kanıt ve çalıştırma kayıtları: `docs/YAYIN-KAYITLARI.md` 11 Kasım.

## Durum (10 Kasım 2026 gece, altıncı): Dilim 4 P5a+P5b+P6 — kurs sayfaları ve `/e/` egitim'de AÇIK (bağlantısız)

- Duyurusuz, eklemeli: `egitim.ulucamii.be/<dil>/kurs/` (+ `mufredat/`, `yillik-plan/`, `materyaller/`, `gunluk/`) ve `/e/` + 74 basılı kodun `/e/<kod>/` sayfaları canlı; `noindex`, robots Disallow (`/*/kurs/`, `/e/`), haritada ve SW önbelleğinde yok, hiçbir yerden bağlı değil. Kanonik adres ulucamii.be'deki asıl sayfa (`Taban` `kanonik` özelliği). ulucamii.be'de hiçbir şey değişmedi (yönlendirme, kaldırma, bağlantı yok); basılı karekodlar orada aynen çalışır.
- **Nasıl yapıldı:** sayfa gövdeleri ana sitedeki dosyaların kopyasıdır (`egitim/src/sayfalar/*.astro`, `components/{KursSayfasi,IcerikSayfasi,DersGunuKarti,SesliDers,SesliDersDizini,AnaSiteBaglantili}.astro`); içerik ve veri KOPYALANMADI (`@ortak/data/…`, `egitim/src/content.config.ts` → `../src/content/{sayfalar,ayarlar,materyaller}`; şema tek yerde `src/lib/icerik-semalari.ts`, ana siteninki de oradan). Tailwind yok: `.kurs` kapsamlı `styles/kurs.css` (ön ayar + kap/kart + kullanılan yardımcı sınıflar), `.ec-sayfa` için `styles/ecouter.css`. Satır içi stil: dinamik ölçüler `data-grow`/`data-yuzde` + `scripts/kurs-olcu.ts` (CSSOM). Sesler/indirmeler ulucamii.be'de kalır (mutlak adres; `data-ses-kok` → `src/scripts/ecouter.ts`); markdown gövdesindeki kök göreli bağlantılar çıktıda ulucamii.be'ye çevrilir (`AnaSiteBaglantili`).
- **Yayın:** içerik commit'i `ec9e4d7a`; Pages run 42966822937 success (11 Kasım 05:38 UTC); Hosting `ulucamii-egitim` yayını ve `egitim:canli` 100/100 (11 Kasım ≈ 07.10). Ayrıntı `docs/YAYIN-KAYITLARI.md` 11 Kasım.
- **Kanıt:** 25 kurs sayfasının ve 75 `/e/` sayfasının ana metni canlı ulucamii.be sayfalarıyla karakter karakter aynı (başlık sayıları dâhil; `ders-materyalleri` 18 karakter fark: tarih bağlı); ana sitenin yeni yerel derlemesi canlıyla aynı metin (şema çıkarımı içeriği değiştirmedi).
- **P8'in ekleyeceği satırlar (bu paketten):** `AGENTS.md` proje haritasına egitim kurs/`/e/` kabukları (`egitim/src/pages/[dil]/kurs`, `pages/e`, `sayfalar/`, `kurs.css`, `ecouter.css`, `content.config.ts`); `scripts/egitim-canli-denetim.mjs` listesine 5 kurs sayfası × dil ve 74 `/e/<kod>/` (dondurulmuş liste `tests/fixtures/e-kodlari-basili.json`); `.github/workflows/uptime.yml`'e egitim `/tr/kurs/` ve `/e/fatiha/`; `tests/egitim/barindirma.test.mjs` noindex listesine kurs ve `/e/` sayfaları (CSP taraması `kurs-icerik.test.mjs`'te zaten var); `package.json` `test:egitim` listesine `kurs-icerik` ve `e-kodlar` (eklendi); `UstBilgi`/`AltBilgi` «Kur'an Kursu» bağlantısı (bilerek eklenmedi); `veli/index.astro` içindeki `kursYolu` ve `materyalYolu` → `/<dil>/kurs/` ve `/<dil>/kurs/materyaller/` (gizlilik ana sitede kalır); genel yayına açarken: `KursSayfasi`/`SesliDers`/`e/index` `noindex` + `kanonik` kalkar (kanonik egitim, hreflang `Taban`'dan gelir), robots Disallow satırları kalkar, kurs sayfaları site haritasına girer (`barindirma.test.mjs` adres listesi).
- **Bilinen sınırlar:** (1) kurs verisi (CMS `materyaller`, `ders-ilerleme.json`, `ders-materyalleri.json`, plan) ana sitede Pages ile kendiliğinden yenilenir; egitim kopyası ancak `npm run egitim:yayinla` ile yenilenir (plan riski 1; yayın otomasyonu kararı Rıdvan'da). (2) İndirme bağlantıları başka kökende olduğundan `download` özniteliği tarayıcıca yok sayılır: dosya aynı sekmede açılır/iner (ana sitede aynı kökendi). (3) `/e/` dil değiştiricisi ana sayfalara gider (sayfa yalnız Fransızca). (4) `Dinleme` ses önbelleği (SW) yalnız mevcut kurallara dayanır; ses önceden indirilmez. (4) JSON-LD (Event/Course vb.) egitim kopyasında yok (noindex sayfa).

## Durum (10 Kasım 2026 gece, beşinci): Dilim 4 P1+P3+P4 — veli portalı ve hoca ekranı egitim'de AÇIK (bağlantısız)

- Duyurusuz, eklemeli: `egitim.ulucamii.be/<dil>/veli/` ve `/hoca/` canlı, `noindex`, robots Disallow, haritada ve SW'de yok, hiçbir yerden bağlı değil; ulucamii.be'deki sayfalar aynen. Ayrıntı ve sınırlar: `docs/YAYIN-KAYITLARI.md` 10 Kasım gece (beşinci). Gerçek girişin egitim'de çalışması için gereken (doğrulanmadı): Auth yetkili alanlarında `egitim.ulucamii.be`, e-posta bağlantısı hedefi (Apps Script/Functions hâlâ ulucamii.be).
- **P8'in ekleyeceği satırlar:** `AGENTS.md` proje haritasına egitim veli/hoca kabukları (`egitim/src/pages/[dil]/veli`, `hoca`, `uyum-jetonlari.css`); `scripts/egitim-canli-denetim.mjs` listesine `/tr/veli/` ve `/hoca/`; `.github/workflows/uptime.yml`'e egitim `/tr/veli/`; `tests/egitim/barindirma.test.mjs` noindex sayfa listesine veli/hoca; `UstBilgi`/`AltBilgi` «Veli» ve «Kurs» bağlantıları (P1'den bilerek çıkarıldı); P5'ten sonra `veli/index.astro` içindeki `kursYolu`/`materyalYolu`/`gizlilikYolu` (ve `hoca/index.astro` `materyalYolu`) mutlak ulucamii.be yerine `/<dil>/kurs/…`; `veli-*.webmanifest` yönlendirme sonrası ana sitedekilerin yerine; P7 yönlendirmeleri; ana siteden egitim'e bağlantılar. (Kurs/`/e/` paketinin ek satırları: yukarıdaki «altıncı» durum.)

## Durum (10 Kasım 2026 gece, dördüncü): Kur'an Okuma o8 (tecvid uygulamaları) ve o9 (kısa âyetler) CANLI

- Duyurusuz. 105 + 60 madde, 165 Diyanet sesi egitim Hosting'inde; metin doğrulaması ve alınmayanlar yukarıdaki «Okuma sesleri» bölümünde. İmam gözden geçirmedi. Kayıt: `docs/YAYIN-KAYITLARI.md` 10 Kasım gece (dördüncü).

## Durum (10 Kasım 2026 gece, üçüncü): kart seslendirmesi (TR + FR) CANLI

- Duyurusuz. 261 bilgi kartında tr, 258'inde fr «Dinleyin/Écouter» çaları çalışıyor (fr `ku-044/047/048` imam onayı bekliyor, hariç). Sesler egitim Hosting'de, git dışı; bekçi ve geri getirme için yukarıdaki «Kart seslendirmesi» bölümü. Kayıt: `docs/YAYIN-KAYITLARI.md` 10 Kasım gece (üçüncü).

## Durum (10 Kasım 2026 gece, ikinci): okuma satırı, «bir tur geri», çevrim dışı kapsam, kart sesi çaları CANLI

- Duyurusuz. Kilimim ve ana sayfa Kur'an Okuma ilerlemesi/bugün tekrar satırı gösterir; yarışmada ← ile bir tur geri; çevrim dışı kutu okuma adım/harita ve ibadet sayfalarını da kaydeder; kart sesi çaları hazır, manifest boş (içe alma: `node scripts/kart-ses-al.mjs`, sesler `D:sesli-anlatimilim-yolu-kartlar` bitince, önce `--kuru`). `/__/auth/handler` başlıkları değişmedi (ayrılmış ad alanı; önizleme kanalı sınaması gerekir). Apps Script v47 canlı (ayrı kayıt). Kayıt: `docs/YAYIN-KAYITLARI.md`.

## Durum (10 Kasım 2026 gece): «Bilgi Yarışması» (/yarisma/) CANLI; bilgi kartlarında taslak etiketi kalktı

- Duyurusuz yayımlandı; imam henüz gözden geçirmedi. Sınıfça tek ekran, tek ortak puan, hiçbir veri saklanmaz. 261 kartın hepsi «onayli» (etiket mekanizması gelecek taslaklar için durur). Kayıt: `docs/YAYIN-KAYITLARI.md` 10 Kasım gece (kapı parça parça koşuldu).

## Durum (10 Kasım 2026 akşam): «Kur'an Okuma» (/okuma/) ve «Abdest ve Namaz» (/ibadet/) CANLI

- Duyurusuz yayımlandı; imam henüz gözden geçirmedi; okuma `/kilimim`'e bağlı değil. Kayıt: `docs/YAYIN-KAYITLARI.md` 10 Kasım akşam.

## Durum (10 Kasım 2026): İLK CANLI YAYIN YAPILDI

- Canlı: 18 Cloud Function (`europe-west1`), Firestore kuralları (bayt eşit), TTL ilkeleri, ana site (hoca «İlim Yolu»
  sekmesi) ve egitim.ulucamii.be (99/99 canlı denetim). Duyuru yapılmadı. Ayrıntı ve kanıtlar: `docs/YAYIN-KAYITLARI.md` 10 Kasım.
- Uçtan uca hesap sınaması geçti (kayıt, kullanıcı adı, kart ilerlemesi, sunucudan geri gelme, uygulamadan silme); sınama hesabı
  yönetici araçlarıyla tamamen silindi. `Fastly-Client-IP` işleve ulaşıyor ve istemci uyduramıyor.
- Açık: Google ile giriş gerçek hesapla denenmedi; Apps Script v47 dağıtılmadı (e-postalar kuyrukta, gönderilmiyor); App Check
  ertelendi; kartlar «taslak»; `/__/auth/handler` güvenlik başlığı taşımıyor; `ILIM_SIL_GERCEK` kapalı (hareketsiz hesap silme kuru).
- Aşağıdaki bölüm 2 Kasım tarihli geçmiş durumdur («yayın YOK» artık geçerli değil).

## Durum (2 Kasım 2026 akşamüstü, dal `ilim-yolu`; geçmiş)

**Son durum — oturum kapanışı (2 Kas 2026):**
- Commit `f41cce14` (dal `ilim-yolu`, yerel, push yok): Dilim 0 + Dilim 1 tamam; Dilim 2 verisi ve Dilim 3 ortak modülü.
- Dilim 1 arayüzü bitti: bütün egitim Kilim tasarımına geçti (`egitim/DESIGN.md`), `/[dil]/` İlim Yolu ana sayfası
  (misafir/girişli), eski Ezber ana sayfası `/[dil]/ezber/`, `/[dil]/hesap/{giris,kayit}/`, `/[dil]/hesap/`, `/k/`;
  hoca ekranı «İlim Yolu» sekmesi (hesap aç, kart bas, bağlama kodu, yıkıcı işlem onayı).
- Türkçe hitap «siz» (Rıdvan, 2 Kas 2026); FR vous, NL u, DE Sie, EN değişmedi.
- Düzeltilen hatalar: ana sayfa mini kilim siyah dolgu (şeffaf tıklama kutuları ortak `kilim.css`'e taşındı; bekçi
  `tests/egitim/ana-kilim.spec.mjs`); hoca penceresindeki şifre kapanınca anında silinir (`gizliGoster`);
  `ekran.spec.mjs` test sonunda uçuştaki isteğin «disposed» hatası (yalnız o hata yutulur).
- Kalite kapısı `npm run dogrula:codex` (2 Kas 15.43): 12 bölümün 11'i geçti, tek düşen ekran testi yukarıdaki
  düzeltmeyle 114/114. `test:hesap` 25/25, `test:kurallar` geçti, `test:ilim-yolu` 54 + 1 atlanan, `test:egitim` geçti.
- ihtida deposu: `b57bbdc` (yerel `main`, push yok) — `scripts/ortak-dogrula.mjs` + build önünde denetim; yasak terim
  taraması 0.
- Taslak ekran görüntüleri (`egitim/docs/taslaklar/ilim-yolu/ekran/`, 5,8 MB) depoya girmez; `ekran.mjs` yeniden üretir.
- Sıradaki: Rıdvan Blaze'i açınca «Yayından önce» 1–8 ve plandaki yayın sırası; beklerken Dilim 2 arayüzü.

**Ayrıntılı notlar:**

- Dilim 0 altyapısı hazır:
  - `functions/`: TypeScript, esbuild, gen2, europe-west1, `maxInstances: 2`;
  - `firebase.json` başlıkları ve yönlendirmeler;
  - Auth (9185) ve Functions (5185) emülatörleri;
  - `npm run test:hesap`.
- Kurallar: `npm run test:kurallar` 72/72 (62 eski + 10 İlim Yolu).
- Saf mantık: `birlestir()` ve `kullaniciAnahtari()` (`src/lib/ezber/cihaz.ts`), `src/lib/ilim-yolu/kullanici-adi.ts`.
- Fonksiyonlar: `test:hesap` 23/23. Yazılanlar:
  - kullanıcı adı;
  - silme (30 gün) ve `silmeTara`; `hareketsizTara` (varsayılan kuru);
  - çocuk hesabı, kart, şifre, oturum kapatma;
  - bağlama kodu;
  - `portalSilmeTetik`;
  - `/api/cocuk-giris` ve `/api/kart-giris`.
- `portalSilmeTetik`, `ogrenciler/{ref}` silinince çalışır. `portalSilme` yalnız bir işlem kilididir; o kilitte
  tetiklenirse kursa devam eden çocuğun hesabı kapanır.
- Öğrenci silinince çocuk hesabı kapatılmakla kalmaz, TÜMDEN silinir (gizlilik metnindeki «kurstan ayrılınca silinir»
  sözü): Auth kullanıcısı, `kullanicilar/{uid}` ve alt belgeleri, `gizli/cocuk/hesaplar/{uid}`, `ogrenciHesaplari/{ref}`.
  Bağlı yetişkinin hesabı kalır, yalnız bağı çözülür.
- Ortak emülatör portları (8185, 9185, 5185, 4485): `test:hesap` ile `test:kurallar` aynı anda iki oturumda
  çalıştırılamaz; ikincisi port bekçisinde durur.
- `test:hesap` 25/25 (çocuk hesabının tümden silinmesi + istemci bütünleşik testleri dahil); `test:ilim-yolu` 44/44.
- İstemci mantığı hazır, henüz hiçbir sayfa içe aktarmıyor: `egitim/src/lib/firebase-istemci.ts`, `egitim/src/lib/hesap/`
  (`isaret`, `oturum`, `kart-giris`, `esitle`, `profil`, `ogretmen-kaydi`), `src/lib/ezber/kilim.ts` birleşik kip.
  Arayüz aşamasında uyulacak kararlar (2 Kas 2026, Claude):
  - Oturum işareti `ilimYolu:oturum` = uid özeti (32 onaltılık); sayfa Firebase yüklemeden kullanıcı anahtarını bilir.
  - İlerleme yazan her sayfa `oku/yaz(depo, etkinAnahtar(depo))` kullanır; yoksa girişliyken çalışma anonim anahtara gider.
  - Oturum kendiliğinden düşerse cihaz kopyası kalır. Açık çıkışta önce eşitlenir; eşitlenemezse kullanıcıya sorulur.
  - `/k/` betiğinin ilk satırı `adrestenKartAl()`; sır Firebase'i beklemeden adresten silinir.
  - Birleşik kilim için `.ezber-kilim.kl-birlesik` ve `.kl-ust` stilleri yazılmalı; yoksa üstteki doku görünmez.
- CSP `connect-src`'e `https://europe-west1-ulucamii-portal.cloudfunctions.net` eklendi (callable çağrıları).
- Google girişi ile veli e-postası çakışması (plan riski): ayrı test yazılmadı. Firebase «e-posta başına tek hesap»
  ayarında doğrulanmış e-postalı hesaba Google ile girilince aynı uid'e bağlanır; veli hesapları e-posta bağlantısıyla
  açıldığı için doğrulanmıştır, yani veli kendi hesabına girer. Doğrulanmamış şifreli hesapta Google şifreyi düşürür
  (Firebase'in hesap ele geçirme koruması). Auth emülatörü bu davranışı birebir taklit etmez; canlıda `.test` dışı
  gerçek bir gmail ile tek deneme yapılır (yayın sonrası denetim listesi).
- **Tasarım seçildi (Rıdvan, 2 Kas 2026): C · Kilim** — `egitim/docs/taslaklar/ilim-yolu/c/` (renk, yazı, motif:
  `NOTLAR.md`). A ve B taslakları karşılaştırma için klasörde kalır.
- Dilim 3: `paylasilan/ogrenme-yolu/` (12 hafta, 8 adım; `tests/ogrenme-yolu-icerik.test.mjs`), aktarım
  `npm run ortak:aktar` (yerel liste `D:\app\ihtida-platform\.yerel\yasak-terimler.txt`, depo dışı), ihtida tarafında
  `scripts/ortak-dogrula.mjs` derlemeden önce çalışır (ihtida deposunda commit YOK).
- Kartlar yazılırken görülen plan–DİA farkları (soru sorulmadı, plan değiştirilmedi): siyerde kedi kıssası, mağaradaki
  örümcek ağı, «Bugün merhamet günüdür» sözü, Hendek kuşatması 27 gün (DİA ~20), Bahîrâ (DİA tartışmalı), vefat
  tarihi, Habeşistan ikinci kafile sayısı, yedi çocuğun hepsinin Hz. Hatice'den olduğu. Müfredat sahibine sorulacak.
- Dilim 2 verisi başladı: tip `src/lib/ilim-yolu/bilgi-kartlari.ts`, denetim `tests/ilim-yolu-bilgi-kartlari.test.mjs`,
  veri `src/data/ilim-yolu/kartlar/<kod>.json` (plandaki 261 konu; Kur'an okuma kartları sorusuz, diğerleri 2 mini soru,
  bütün dillerde «taslak»).

### Yayından önce (canlı adımlar, sırayla)
1. Rıdvan: Blaze + 5 € bütçe uyarısı.
2. Fonksiyon servis hesabına kendi üzerinde `roles/iam.serviceAccountTokenCreator` verilir;
   `iamcredentials.googleapis.com` açılır (custom token için).
3. Hoca hesabının `emailVerified=true` olduğu doğrulanır. Fonksiyonlar bunu ister, kural istemez.
4. Firestore konumu europe-west1 tetikleriyle uyumlu mu, bakılır.
5. Auth: Google ve e-posta/şifre sağlayıcıları açılır; `fb-auth-ayar.py` ile TAM alan listesi verilir; OAuth istemcisine
   egitim `/__/auth/handler` eklenir.
6. `/__/auth/*` başlıkları önizleme kanalında sınanır.
7. Firestore TTL ilkesi: `ipler` (koleksiyon grubu, `gizli/giris/ipler`) ve `bagKodlari` koleksiyonlarında `bitis` alanı (süresi dolan deneme sayaçları ve
   bağlama kodları kendiliğinden silinir).
8. `ILIM_SIL_GERCEK=1` yalnız Rıdvan karar verince açılır. O zamana kadar hareketsiz hesap taraması kuru çalışır.

Yayın sırası: `test:kurallar` + `test:hesap` → `scripts/firebase-cami.ps1 deploy --only functions` →
`npm run firebase:kurallar` → ana site push (hoca ekranı) → `npm run egitim:yayinla` → `npm run egitim:canli` →
`docs/YAYIN-KAYITLARI.md` kaydı. Yayından sonra: gerçek bir gmail ile Google girişi denemesi (çakışma notu yukarıda).

### Dilim 2 — haftalık e-posta arka ucu (10 Kasım 2026, yerel; yayın YOK)

- **Kuyruk:** `functions/src/eposta.ts` → `haftalikKuyruk` (saatlik, Brüksel) `epostaKuyrugu/h_<uid>_<ISO hafta>` yazar (`create`,
  TTL `bitis` = 7 gün). Çocuk, e-postası doğrulanmamış, silinecek hesap atlanır. Saf mantık: `src/lib/ilim-yolu/eposta.ts`
  (Brüksel saati, yaz/kış saati, hafta kimliği, özet), `abonelik-imza.ts` (HMAC, 180 gün).
- **Çıkış:** `abonelikCik` = `/api/abonelik-cik?k=<token>` (GET ve POST, `firebase.json` yönlendirmesi eklendi); sıkı CSP ile uyumlu düz sayfa, 5 dil.
- **Kurallar:** `epostaKuyrugu` istemciye tamamen kapalı. Sınavlar: `test:hesap` 47/47, `test:kurallar` 73/73.
- **Apps Script (v47, yerel):** `scripts/apps-script/ilim-yolu-eposta.gs` (10 dakikada bir; kilitle-gönder-işaretle; günlük sınır 120);
  `brevoGonder` artık `headers` taşır. Sürüm numarası ve dosya adı (v46 → v47) canlıya alınırken değişir: `git mv`, `SURUM = 47`,
  `v46` dosyasına ve `surum, 46` değerine bakan testler, `scripts/ihtida-gas-derle.mjs` paket listesine yeni dosya.
- **Canlı adımlar:** (1) `ABONELIK_SIRRI` Functions secret'ı (≥ 32 rastgele karakter); (2) Firestore TTL: `epostaKuyrugu.bitis`;
  (3) functions + kurallar + egitim Hosting dağıtımı; (4) Apps Script v47 dağıtımı, düzenleyicide bir kez `ilimYoluEpostaKur()`
  ardından `ilimYoluEpostaSina()` (kuru tur); (5) Brevo günlük kotası bakılıp gerekirse `ILIM_YOLU_EPOSTA_GUNLUK_SINIR`; (6) canlıda
  kendi hesabıyla bir deneme: kuyruk → e-posta → bağlantıyla çıkış.

### Güvenlik sertleştirmesi (10 Kasım 2026, yerel; yayın YOK)

Bağımsız inceleme (13 bulgu) kod karşısında doğrulandı; gerçek olanlar kökünden kapatıldı, her biri için geri-dönüş testi var.
- **Giriş uçları:** IP anahtarı artık `Fastly-Client-IP`, yoksa `X-Forwarded-For`'un SAĞ ucu (sol girdiler istemcinin); IP'den bağımsız
  örnek başına yük tavanı (dakikada 150 hatalı deneme), hesap başına 8 hata/15 dk penceresi (eski hatalar birikmez, kilit uzamaz),
  `kartGiris` eşzamanlılığı 10. **Sınır:** run.app adresine doğrudan gelen biri `Fastly-Client-IP`'yi uydurabilir; asıl koruma hesap
  kilidi + 128 bit kart sırrı + yük tavanı. Başlıklar canlı önizlemede doğrulanmadı.
- **Çocuk oturumu:** kurallar yalnız `sign_in_provider == 'custom'` ve e-postasız çocuk token'ını kabul eder; `kartYenile`/`cocukSifreYenile`/
  giriş bağlı kimlikleri Auth'tan kaldırır; şifre yenileme de yenileme belirteçlerini iptal eder.
- **Silinen hesap:** `silinenUidler/{uid}` mezar taşı (hesabiTamamenSil yazar; kurallar `canli(uid)` ile yazımı ve `ref` okumasını keser);
  çocuk girişi profil yoksa token vermez; `portalSilmeTetik` önce gizli özeti siler. Çocuk kendi profilini oluşturamaz, yalnız `dil`/`sonGiris` günceller.
- **Gizlilik:** `kullanicilar/{uid}/ihtida/ozet` ve `ozel/hassas` yalnız sahibine açık (hoca, kursa bağlı hoca, paylaşılan hoca, başka kullanıcı kapalı;
  testli). `kullaniciAdlari` istemciye tamamen kapalı. Rezerve adlarda `0→o`, `1→i/l` katlaması.
- **Bağlama kodu:** yeni kod öncekileri geçersiz kılar (`bagSurum`); çocuk hesabı olan kayda kod/bağ yok; aynı hesap kodu kurtarma için yeniden kullanır.
- **Taramalar:** `hareketsizTara` 200 hesap/tur (500 yazım sınırı), tek hesabın hatası turu durdurmaz; `hesabiBagla` `sonGiris` yazar.
- **Abonelik çıkışı:** yalnız POST çıkar; GET geçerli belirteçle `https://egitim.ulucamii.be/<dil>/abonelik-cik/#<belirteç>` adresine 302 (sayfa
  ayrı ajanda; fetch ile POST `/api/abonelik-cik?k=<belirteç>`).
- **Hareketsiz uyarı:** `hareketsizTara` artık `epostaKuyrugu/z_<uid>` yazar (adres, dil, giriş bağlantısı, TTL 45 gün); `ilim-yolu-eposta.gs`
  haftalıktan ÖNCE, aynı günlük sınırla, beş dilde gönderir; uyarısı gitmemiş hesap silinmez.
- **Apps Script v47:** dosya `ulucamii-Kod-v47.gs`, `SURUM = 47`; testler ve `ihtida-gas-derle.mjs` (artık `ilim-yolu-eposta.gs` dahil) güncel.
- **Reddedilen/ertelenen:** F-02 kullanıcı adı yoklaması (kilit mesajı çocuğa gösterilmek zorunda; ad gizli değil, şifre korur) ve kart kilidi
  (128 bit sır); F-07 JWT `ref` 1 saatlik gecikmesi (Firebase'in genel sınırı); F-09 App Check (istemci + konsol işi, ayrı karar);
  F-10 `calisma` iç içe boyutu (yalnız sahibi/kursun hocası okur, belge başı 1 MiB sınırı); F-12 HSTS/CSP (`firebase.json` başlıkları bu
  paketin dışında; localhost CORS yalnız emülatörde); F-13 sahte ad kaydı için e-posta doğrulaması.
- **Yeni canlı adımlar:** Firestore TTL `silinenUidler.bitis`; Hosting önizlemesinde `Fastly-Client-IP`/`X-Forwarded-For` başlıkları görülür;
  `functions` yeniden dağıtımı (Fastly başlığı + kurallar birlikte).
