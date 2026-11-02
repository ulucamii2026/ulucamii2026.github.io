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
  - `connect-src` listesine firestore/identitytoolkit/securetoken.googleapis.com ve script.google(usercontent).com.
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

## Durum (2 Kasım 2026 akşamüstü, dal `ilim-yolu`, yayın YOK)

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
