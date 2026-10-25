# Eğitim platformu — egitim.ulucamii.be

Karar tarihi: 26 Eylül 2026 (Rıdvan: «eğitim işleri için egitim.ulucamii.be adlı ayrı bir platforma geçelim»).
Durum: **yayında** (27 Eylül 2026 akşamı): https://egitim.ulucamii.be — Ezber Kilimi girişi beş dilde (Faz 1f
iskeleti `egitim/`), Firebase Hosting sitesi `ulucamii-egitim`; barındırma ayrıntısı aşağıda, yayın kanıtı
[YAYIN-KAYITLARI.md](YAYIN-KAYITLARI.md) «27 Eylül 2026 (2)». Ana siteden bağlantı aynı akşam eklendi (Rıdvan: «ana
siteye egitim.ulucamii.be bağlantısı ekle»; aşağıda «Ana siteden bağlantı», kayıt «27 Eylül 2026 (3)»); duyuru Faz 2
madde sayfalarıyla yapılacak (27 Eylül 2026 kararı, gerekçe aynı satırda).
Auth alanı ayrıca onaylanır (Faz 3). İskelet ve açık kalemler:
[Faz 1f belgesi](superpowers/plans/2026-09-27-ezber-kilimi-faz-1f-iskelet.md).
Ana plan §3.1 ve §4: [2026-09-26-ezber-kilimi-ana-plan.md](superpowers/plans/2026-09-26-ezber-kilimi-ana-plan.md).
İlk bölüm: [Ezber Kilimi](EZBER-KILIMI.md).

**2 Ekim 2026 güncellemesi:** canlı sürüm salt okunur denetimde 33/33 geçti (19.07 Europe/Brussels).
Canlıda beş giriş sayfası, 81 madde ve 27 sesli madde var. Sonraki aşama olan 27 madde × beş dil
dinle–tekrarla sayfaları yerelde hazırlandı ve **9 Ekim 2026 09:19'da yayımlandı** (canlı denetim 36/36, site haritası
140 adres; kayıt `docs/YAYIN-KAYITLARI.md` «9 Ekim 2026 (5)»; duyuru yok). Güncel uygulama ve doğrulama:
[Faz 2 dinleme çalışması](EGITIM-FAZ2-DINLEME.md). Aşağıdaki 27 Eylül tarihli sayfa/test sayıları o yayının kanıtıdır.

**24 Ekim 2026 YAYINDA (kayıt `docs/YAYIN-KAYITLARI.md` «24 Ekim 2026»; önce ana site, sonra egitim; 290 adres):** dilim 2a ile sesli madde 57'ye çıktı (285 çalışma sayfası). Yayın sırası: önce ana
site (sesler ulucamii.be'den sunulur), sonra egitim. Ayrıntı: [Faz 2 dinleme çalışması](EGITIM-FAZ2-DINLEME.md) «Dilim 2a».
Dilim 2b (yerel): madde sayfası v1 (Diyanet metni, TR/EN/DE meâl, «Namazda», hoca kutusu); veri hattı ve denetimler aynı
belgede «Dilim 2b».

## Kararlar

| Konu | Karar |
|---|---|
| Adres | `egitim.ulucamii.be` |
| Barındırma | Firebase Hosting, proje `ulucamii-portal` (Spark planı: Cloud Functions yok, Hosting ~360 MB/gün) |
| Kod | Aynı depoda ikinci Astro uygulaması `egitim/` (kendi `astro.config.mjs`, `output: 'static'`); ortak kod `@ortak/*` takma adıyla ana `src/`'den; kök `node_modules` ortak |
| Ses dosyaları | Ana siteden (ulucamii.be, GitHub Pages) verilir; platform yalnız HTML, JS, SVG ve font taşır |
| Giriş | Platformda `authDomain: 'egitim.ulucamii.be'` (Hosting `/__/auth` yardımcısı; Google girişi kendi alan adımızda, Safari/iPhone uyumlu). Ana site eski ayarla sürer. Giriş gerektiren ilk bölümle (Faz 3) açılır: yetkili alan listesi beceri betiği `fb-auth-ayar.py` ile TAM listeyle güncellenir (eksik liste veli portalının girişini bozar) |
| Güvenlik başlıkları | Hosting'de CSP, HSTS, `X-Content-Type-Options` — ayrıntı aşağıda «Barındırma ve yayın» |
| Diller | tr, fr, en, nl, de — ana sitenin `yollar` + `Record<Dil, …>` düzeni ve [DIL-NL-DE.md](DIL-NL-DE.md) kuralları |
| Tasarım | Yön «Çini Panosu» (Faz 1e, 27 Eylül 2026): beyaz sırlı karo, derz çizgisi, kurs yeşili `#134420` kuşak; firuze ve altın yalnız ezber basamaklarında; gölge yok, yalnız vektör (Codex çizimleri). Arapça «Ulu Nesih» (Scheherazade New 4.500 alt kümesi, Türk usulü yazım), Latin Atkinson Hyperlegible Next. Tasarım sistemi [`egitim/DESIGN.md`](../egitim/DESIGN.md); karar, taslaklar ve Rıdvan'ın seçenekleri: [Faz 1e belgesi](superpowers/plans/2026-09-27-ezber-kilimi-faz-1e-tasarim.md) |

## Barındırma ve yayın (27 Eylül 2026)

| Ne | Nasıl |
|---|---|
| Hosting sitesi | `ulucamii-egitim` (`https://ulucamii-egitim.web.app`), proje `ulucamii-portal`. `firebase.json` → `hosting[].site`; `.firebaserc`'de hedef tanımı yok (CLI `--only hosting:ulucamii-egitim`'i siteyle eşler) |
| Alan adı ve DNS | `egitim.ulucamii.be` siteye Hosting REST API v1beta1 `customDomains` ile bağlandı (firebase-tools 15.30.1'de bu komut yok): `ulucamii-site` becerisindeki `egitim-alan-adi.py` (`durum`, `ekle`, `bekle`; dernek hesabı değilse istek atmaz). bNamed'de tek kayıt: CNAME `egitim` → `ulucamii-egitim.web.app.` — sahipliği de bu kayıt kanıtlar, A/TXT istenmedi. Sertifikayı Firebase kendisi alır ve yeniler. Olumsuz yanıt önbelleği 901 sn (SOA): Firebase adı kayıttan önce sorguladıysa kaydı en geç 15 dakika sonra görür |
| Yayın | `npm run egitim:yayinla` = `astro check` + derleme + `test:egitim` + `scripts/firebase-cami.ps1 deploy --only hosting:ulucamii-egitim` (dernek hesabı ve proje sarmalayıcıda zorlanır). Yalnız temiz çalışma ağacından (yayımlanan içerik = commit); ardından canlı denetim ve [YAYIN-KAYITLARI](YAYIN-KAYITLARI.md) kaydı. Otomatik yayın yok: GitHub Actions'tan Hosting yayını hizmet hesabı anahtarı ister, bilerek elle |
| Canlı denetim | `npm run egitim:canli -- https://egitim.ulucamii.be` (salt okuma): güvenlik başlıkları `firebase.json` ile birebir + HSTS, önbellek süreleri, `/tr` → `/tr/` (301), 404, `robots.txt`, site haritası, simgeler, beş kart; tarayıcıda beş dil CSP ihlali ve konsol hatası olmadan, kök yönlendirme (fr-BE → `/fr/`), gerçek sesle bir çal düğmesi |
| Güvenlik başlıkları | `firebase.json`'daki `**` kuralı. CSP: `default-src 'none'`; betik, stil, görsel ve yazı tipi yalnız `'self'`; bağlantı (`connect-src`) `'self'` ve `https://ulucamii.be`, `worker-src` ve `manifest-src` `'self'` (25 Ekim 2026, «Çevrim dışı çalışma» bölümü); ses (`media-src`) yalnız `https://ulucamii.be` ve `blob:` (2d: «Kendini sına»da çocuğun kendi kaydı sayfa belleğinden çalınır; ağdan bir şey getirmez); `base-uri`, `form-action`, `frame-ancestors`, `object-src` kapalı. Ayrıca `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (kamera, konum, ödeme, USB kapalı; mikrofon yalnız `self`: 24 Ekim 2026'da «Kendini sına»nın «Kendi sesim» oyunu için açıldı, izin yine kullanıcı dokunuşuyla ve tarayıcı penceresiyle alınır). HSTS'yi Hosting kendisi ekler, ikinci kez yazılmaz: `egitim.ulucamii.be`'de `max-age=31556926`, `*.web.app`'te ayrıca `includeSubDomains; preload` (27 Eylül 2026 ölçümü). Sayfalarda satır içi betik ve stil yoktur (kök yönlendirme de dış dosya: `src/scripts/kok-yonlendir.ts`); `tests/egitim/barindirma.test.mjs` bunu derlenmiş çıktıda denetler |
| Testlerde CSP | `scripts/egitim-onizle.mjs` aynı başlıkları `firebase.json`'dan okuyup gönderir: bütün ekran testleri gerçek CSP altında koşar; ayrıca ihlal sayılır ve ses adresinin `media-src`'ye uyduğu sınanır |
| Önbellek | HTML (`/…/` ve `.html`) `no-cache`: yayından sonra eski HTML, silinmiş `_astro` dosyalarını istemesin. `_astro/**` bir yıl (ad özetli). `fonts/**` bir hafta — ad özetsiz: **yazı tipi alt kümesi değişirse dosya adı da değişmeli** (ör. `ulu-nesih-2.woff2`), yoksa eski alt küme bir hafta yeni harfleri göstermez. Öbürleri Hosting varsayılanı (1 saat) |
| Simgeler | `favicon.svg` (vektör), `favicon.ico` (16/32/48), `apple-touch-icon.png` (180, kurs yeşili zemin): kurs ambleminin iç dairesi, kimlik paketindeki ana SVG'den `node scripts/egitim-simge-uret.mjs` (ana SVG'nin SHA-256'sı [LOGO-KIMLIGI.md](LOGO-KIMLIGI.md) ile doğrulanır; logo değişirse yeniden çalıştırılır) |
| Paylaşım kartı | `egitim/public/og/ezber-kilimi-<dil>.png` (1200 × 630, en çok 300 KB — WhatsApp önizlemesi): giriş sayfasının üst kısmından, menü ve düğmeler gizlenerek `node scripts/egitim-og-kart.mjs`. Giriş sayfasının görünümü değişirse: derle → kartları üret → yeniden derle |
| Arama motoru | `robots.txt` + `@astrojs/sitemap`: haritada yalnız beş dil sayfası; hreflang sayfanın kendi `<head>`'inden (kök `astro.config.mjs` düzeni). `*.web.app` kopyası kanonik adresle `egitim.ulucamii.be`'yi gösterir |
| Kota | Spark: Hosting 10 GB depolama, günde 360 MB aktarım (ücretli aşım yok; kota dolarsa o gün hizmet kesilir, uptime denetimi bildirir). Sesler ana siteden gelir, bu kotayı harcamaz |
| Uptime | `.github/workflows/uptime.yml`, `https://egitim.ulucamii.be/tr/` adresini yoklar (200 ve «Ezber» metni); sertifika `CERT_ACTIVE` olduktan sonra eklendi (27 Eylül 2026 19.50). Kesintide info@ulucamii.be'ye tek uyarı gider. Zamanlama yarım saatte birdir, ama GitHub zamanlanmış koşuları seyrek başlatıyor: 21–27 Eylül 2026'da 60 koşu, ardışık aralık ortanca 2,5 saat, en çok 6 saat. Kesinti saatlerce geç fark edilebilir |
| Ana siteden bağlantı | Adres yalnız `src/i18n/utils.ts`'te (`EGITIM_SITESI`, `egitimBaglantisi(dil)`): ziyaretçi kendi dilinin giriş sayfasına gider. Üç yer: menünün «Eğitim» grubunda «Ders günlüğü»nden sonraki madde (adı platformun başlığı `KILIM_METINLERI.baslik`; ↗ işareti, ekran okuyucuya alan adı), altbilgi «Bağlantılar» (alan adıyla), Kur'an kursu sayfasının yan sütununda kısa tanıtımlı kart. Platform ikinci bölümünü açınca menü maddesine genel bir ad verilir. Test: `tests/web/site.spec.mjs` «egitim.ulucamii.be bağlantısı» (beş dil, masaüstü ve mobil). **Duyuru** (27 Eylül 2026 akşamı karar, Rıdvan'ın devrettiği yetkiyle): Faz 2 madde sayfaları yayımlanınca yapılır. Giriş sayfası şimdilik 81 maddenin 27'sinde ses sunuyor; madde metinleri ve çalışma kipleri Faz 2'de geliyor. Eksik vitrin duyurulmaz, bağlantı keşfedilebilirliği sağlar |

## Kademeli taşıma (Faz 4, Ocak–Mart 2027; her bölüm ayrı yayın)

1. Veli portalı + hoca ekranı
2. Kur'an kursu sayfaları (müfredat, yıllık plan, materyaller, günlük)
3. Seviye testi + yetişkin eğitimi
4. Muhtedi eğitimi, vaazlar, irşat, UİP

Her bölümde: ulucamii.be'deki eski adreslerde sorgu ve hash'i koruyan yönlendirme sayfaları (ziyaret sayacı **yok**);
yetişkin kitabındaki basılı `ulucamii.be/e/<kod>/` kare kodları sonsuza dek çalışır; Apps Script kaynak denetimi yeni
alan adına göre güncellenir; veliye bir kez yeniden giriş duyurusu (onayla); yayın `YAYIN-KAYITLARI.md`'ye işlenir.

## Taşınmayanlar — bağlayıcı

- **İhtida** (sayfa, form, EK-9, EK-10) ulucamii.be'de kalır.
- **`ihtida.ulucamii.be`'ye dokunulmaz.** Rıdvan onu Müşavir Beye gösterip onay alacak (26 Eylül 2026:
  «şimdilik oraya dokunma»).

## Çevrim dışı çalışma ve ana ekrana ekleme (25 Ekim 2026)

Çocuk evde, arabada ya da yurt dışında zayıf internetle çalışır; bir maddeyi Diyanet kaydıyla birlikte cihazına alıp internetsiz de açabilmeli,
siteyi telefonunun ana ekranından uygulama gibi başlatabilmeli. **Yeni dinî metin, okunuş ya da ses yoktur**: kaydedilen şey kataloğun var olan
sayfası ve var olan ses yollarıdır. Hesap, sunucu tarafı kayıt ve ağ günlüğü yoktur; her şey kullanıcının tarayıcı önbelleğindedir (Cache API).

### Ne var

| Ne | Nasıl |
|---|---|
| Kaydet düğmesi | Madde sayfasında çalar bölümünün altında «İnternetsiz çalışmak için kaydet» (beş dilde; `CevrimdisiKutu.astro`, `scripts/cevrimdisi.ts`). Kutu `hidden` gelir; service worker sayfayı denetleyince ve tarayıcı Cache API'yi sunuyorsa açılır (JS kapalıysa ya da SW kullanılamıyorsa — örneğin Firefox özel penceresinde — hiç görünmez, sayfa olduğu gibi çalışır). TEK düğme üç iş yapar: kaydet → «Vazgeç» (indirme sürerken) → «Sil»; aynı öğe kaldığından odak kaybolmaz. İlerleme çubuğu ve sayaç ekran okuyucudan gizlidir; duyurular `role="status"` satırından yalnız başlangıçta, çeyrekte, yarıda, bitişte ve hatada gider. Kayıtlıyken «Bu cihazda kayıtlı · 921 KB» yazar. Çevrim dışıyken kayıtsız maddede düğme kapalı ve nedeni yazılıdır; kayıtlıda «Sil» yerel olduğundan çalışır |
| Ne kaydedilir | Sayfanın HTML'i ve dosyaları (CSS, betik, tembel yüklenen çalışma kipi parçaları, yazı tipleri, logo) ile maddenin BÜTÜN sesleri: tam kayıt, âyet parçaları, vakit seçenekleri (Ezan) ve dinleme sırası (`src/lib/ezber/cevrimdisi.ts` → `sesYollari`; çalışma sayfasının hangi kipi hangi dosyayı çalarsa çalsın hiçbiri eksik kalmaz, `tests/ezber-cevrimdisi.test.mjs`). Ölçü: ortanca madde 0,57 MB, en büyüğü Ezan 11,3 MB (5 dosya), sonra Kamet 3,0 MB ve 40–50 âyet parçalı sûreler ≈ 2 MB; 76 maddenin toplamı 59 MB |
| Yönetim ve yedek sayfa | `/<dil>/cevrimdisi/` (beş dil, `noindex`, site haritasında yok): kayıtlı maddeler boyutlarıyla ve tek tek «Sil» ile, bu cihazda açılmış öteki sayfalar, bağlantı durumu (`role="status"`), «Hepsini sil» (önce sayfa içi onay, vazgeçilebilir). Aynı sayfa service worker'ın **çevrim dışı yedek sayfasıdır**: önbellekte olmayan bir adres ağ yokken açılmak istenirse bu sayfa gelir, istenen adres kayıtlı değilse bunu söyler ve kayıtlı maddelere götürür. Dil sırası: adresteki dil, yoksa tarayıcının `Accept-Language` sırası, yoksa İngilizce. Giriş sayfasındaki «Kendi çalışmanız için» bloğunun altında ve alt bilgide bağlantı vardır (araç döşemesi üç kaldı; bağlantı ayrı bir satırdır) |
| Ana ekrana ekleme | `manifest.webmanifest` (`id`/`start_url`/`scope` `/`, `standalone`, tema ve zemin `#134420`, 192 ve 512 `any` + 512 `maskable` PNG, ayrıca `favicon.svg`), her sayfada `<link rel="manifest">` + `theme-color` + `apple-mobile-web-app-title`. Kurulum sistemin kendi menüsüyle (Android/Chrome «Uygulamayı yükle», iPhone/iPad «Ana Ekrana Ekle»); `beforeinstallprompt` kullanılmaz. Yönetim sayfasında kısa bir yönerge vardır. `/` yalnız dile yönlendiren ince sayfadır (manifest taşımaz); kurulu uygulama `/`yi açar, yönlendirme kayıtlı dile götürür |
| Uygulama simgeleri | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: web uygulama bildirimi PNG ister, bu **«vektör önce» kuralının bilinen istisnasıdır** (favicon.ico ve apple-touch-icon gibi). Kurs ambleminin iç dairesinin ana SVG'sinden, `node scripts/egitim-simge-uret.mjs` ile **Playwright Chromium'da** hedef boyutta çizilerek üretildi (kurs yeşili zemin; `any` için amblem çapın %86'sı, `maskable` için güvenli alan nedeniyle %70'i). Vektör sürümü bildirimde `favicon.svg` olarak da durur |
| Eski tarayıcıda zarar yok | `import.meta.env.PROD`, güvenli bağlam (https ya da localhost) ve `serviceWorker` yoksa kayıt hiç denenmez (`astro dev`'de SW yok); kayıt hatası yutulur ve sayfa olduğu gibi çalışır |

### Service worker (`/sw.js`, `egitim/src/sw/sw.ts`)

Kök kapsamlı tek dosya (`/sw.js`). `scripts/egitim-sw.mjs` esbuild ile (iife, es2020: eski iOS Safari'de de çalışır) derleme **bittikten sonra** `dist/sw.js` yazar
(`astro:build:done`, `egitim/astro.config.mjs` → `egitim-sw`). Sayfa betiği `register('/sw.js', { scope: '/', updateViaCache: 'none' })` ile yükün
bitiminde kaydeder.

| İstek | Strateji | Nerede |
|---|---|---|
| Sayfa (HTML, `navigate`) | **Ağ önce**: başarılı (200, HTML) yanıt önbelleğe yazılır ve sayfanın dosyaları arka planda tamamlanır. Önbellekte kopyası olan sayfa için ağ 4 sn içinde yanıt vermezse (ya da 5xx dönerse) kopya gelir. Ağ yok ve kopya yoksa o dilin `/<dil>/cevrimdisi/` yedek sayfası, o da yoksa düz metin 503 | `ezber-kabuk-<damga>` |
| `/_astro/**`, `/fonts/**`, `/logo/**`, simgeler | **Önbellek önce** (adları özetli ya da sürümlü yayın kuralına bağlı) | `ezber-kabuk-<damga>` |
| `https://ulucamii.be/media/ses/**` (Diyanet kayıtları) | **Yalnız okur, asla yazmaz.** Dosya `ezber-ses-v1`'de varsa (kullanıcı o maddeyi «İnternetsiz çalışmak için kaydet» ile kaydetmiştir) önbellekteki gövdeden doğru yanıt kurar: `Range` isteğine 206 (`Content-Range`, `Content-Length`, `Accept-Ranges: bytes`), karşılanamazsa 416 (`bytes */boyut`), çoklu/anlamsız aralıkta tam 200; `audio/mp3` (GitHub Pages'in yazdığı) standart `audio/mpeg`'e çevrilir: iOS Safari standart türü ve doğru 206'yı şart koşar. Dosya önbellekte **yoksa** SW isteği aynen ağa geçirir (`fetch(istek)`): tarayıcı sesi SW hiç yokmuş gibi, kendi `Range` istekleriyle akıtır; tam inmesi beklenmez, hiçbir şey önbelleğe yazılmaz | `ezber-ses-v1` (yalnız okuma) |
| Başka istek | Dokunulmaz (`/sw.js`, `/__/`, GET dışı, başka köken) | — |

Kurulumda yalnız **altı sayfa** önyüklenir: `/` ve beş dilin `/<dil>/cevrimdisi/` sayfası (+ dosyaları); biri alınamazsa kurulum reddedilir (yarım
önyüklemeyle etkinleşmez). 76 madde ve sesler önceden indirilmez. `skipWaiting` + `clients.claim`: HTML ağ önce olduğundan eski sayfayla yeni SW'nin birlikte
çalışması güvenlidir.

### Önbellekler ve sürüm

| Önbellek | Kalıcılık | İçerik |
|---|---|---|
| `ezber-kabuk-<damga>` | Sürümlü: yeni SW etkinleşince eskisi silinir | Açılmış sayfaların HTML'i, `_astro`/yazı tipi/logo/simge dosyaları, altı yedek sayfa |
| `ezber-ses-v1` | **Kalıcı**: sürümle silinmez | Ulu Camii sunucusundan gelen Diyanet kayıtları (tam 200). **Yalnız «İnternetsiz çalışmak için kaydet» akışının** (sayfa tarafı) yazdığı maddelerin sesleri; dinlenen ama kaydedilmeyen ses buraya girmez. Silme, başka kayıtlı maddenin künyesinde geçmeyen dosyaları kaldırır |
| `ezber-kayit-v1` | **Kalıcı** | «Kaydet»e basılan maddelerin künyesi (JSON: `v`, `id`, `dil`, `ad`, `yol`, `sayfaBayt`, `sesler[{y,b}]`, `tarih`; kişisel veri yok) + bir sürüm işaretçisi (`_yenilenen-surum`) |

**Damga** (`scripts/egitim-sw.mjs` → `damgaHesapla`): SW kodunun (yer tutucuyla derlenmiş) ve altı yedek sayfanın SHA-256 özeti, ilk 16 onaltılık hane. Bunlardan biri
değişince (yeni `_astro` dosya adları dâhil) yeni sürüm kurulur, eski sürümlü önbellek silinir. Hiçbiri değişmeyen yayın (örneğin yalnız bir maddenin metni)
yeni SW kurdurmaz; açılmış sayfaların HTML'i zaten ağ önce tazelenir. Yeni sürümde SW **açıkça kaydedilmiş maddelerin sayfalarını ve dosyalarını yeniden
alır** (ilk istekte, sürüm başına bir kez; ağ yoksa sonraki açılışta yeniden dener); sesler kalıcı olduğundan yeniden inmez. `/sw.js` Hosting'de `Cache-Control: no-cache`
(`firebase.json`; tarayıcı SW dosyasını HTTP önbelleğinden de geciktirmesin) ve kayıtta `updateViaCache: 'none'`.

### Güvenlik başlıkları (CSP) — önce ve sonra

```
ÖNCE:  default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; media-src https://ulucamii.be blob:;
       connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'
SONRA: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; media-src https://ulucamii.be blob:;
       connect-src 'self' https://ulucamii.be; worker-src 'self'; manifest-src 'self';
       base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'
```

Fark yalnız üç yönerge: `worker-src 'self'` (SW yalnız kendi kökeninden), `manifest-src 'self'`, `connect-src`'e `https://ulucamii.be`. Sebep: `media-src` yalnız `<audio>`
öğesini kapsar; sesi cihaza almak `fetch` ister (sayfa ve SW), o da `connect-src`'e bağlıdır. Başka köken, joker, `unsafe-*`, `data:` yok. `tests/egitim/barindirma.test.mjs`
bu yönerge kümesini birebir sabitler; `scripts/egitim-onizle.mjs` başlıkları `firebase.json`'dan okuduğundan ekran testleri gerçek CSP altında koşar.
Hosting'e eklenen tek kural `/sw.js` → `no-cache`.

### Gizlilik

Cihazdan hiçbir şey çıkmaz; kayıt yalnız Cache API'dedir (localStorage anahtarı eklenmedi, test sabitler). Ana sitenin gizlilik politikasının «Ezber Kilimi»
bölümüne (`src/content/sayfalar/{tr,fr,en,nl,de}/gizlilik.md`, `guncelleme: 2026-10-25`) tek madde eklendi: kaydedilen sayfa ve seslerin yalnız bu tarayıcının önbelleğinde
durduğu, düğmeye basılınca o maddenin Diyanet sesinin de aynı yere alındığı (yalnız dinlenen seslerin saklanmadığı), kişisel veri içermediği, hangi maddelerin kaydedildiğini bilmediğimiz, «Çevrim dışı çalışma» sayfasından ya da
tarayıcı verilerini silerek kaldırılabileceği, tarayıcının yer daraldığında silebileceği. Önceki «hesap, çerez ve izleme yok» cümleleri doğru kalır. Kayıt adı
(madde adı) yalnız cihazdaki künyede durur.

### Testler

- `tests/ezber-cevrimdisi.test.mjs` (düğüm, `test:ezber`): her sesli maddede dinleme sırası, tam kayıt, âyet parçaları, vakit seçenekleri eksiksiz; yineleme yok; her yol sunucu yolu ve depoda var; eûzü/besmele; sessiz madde boş; ortak ses dosyaları (eûzü-besmele dosyaları Alak 1–5 ile paylaşılır, en az 20 madde 1-1.mp3'ü içerir).
- `tests/egitim/cevrimdisi.test.mjs` (düğüm, `test:egitim`): bayt aralığı (`aralikCoz`), ses türü, dil seçimi, kaydedilebilir yol, statik/ses adresi kararları, kayıt anahtarları, varlık adresi çıkarımı; service worker'ın ses önbelleğine hiç yazmadığı (kaynak taraması: yalnız `caches.match(... cacheName)`, `put`/indirme yok) ve istemcide tek yazma noktası bulunduğu; beş dil metinlerinin eşitliği, yer tutucular, Fransızca tipografi, yasak simge yok, gizlilik içeriği; derlenmiş çıktı: `sw.js` yer tutucusuz ve damgası yeniden hesaplanınca aynı, önyükleme sayfaları var, her sayfa manifest + tema rengiyle bağlı, simge boyutları, her madde sayfasındaki kutunun ses listesi `sesYollari` ile birebir, her `_astro` atfı çözülüyor.
- `tests/egitim/barindirma.test.mjs`: CSP yönerge kümesi (yukarıdaki «sonra»), `/sw.js` `no-cache`, çevrim dışı sayfalarda satır içi betik yok.
- `tests/egitim/cevrimdisi.spec.mjs` (Playwright, gerçek Chromium, gerçek SW; `serviceWorkers: 'allow'`): SW kaydı/denetimi, Chromium'un kendi uygulama bildirimi çözümleyicisi ve kurulabilirlik denetimi hatasız, kaydet → çevrim dışı yeniden yükle → çalar çalıyor + Range 206/416 başlıkları, **kaydedilmemiş sesi online çalmak `ezber-ses-v1`'e hiçbir kayıt yazmaz** (yalnız tarayıcının `Range` istekleri görülür; çevrim dışıyken aynı dosya alınamaz), hata (404) ve iptal (yazılan dosyalar geri alınır, önbellek boş kalır), **ortak dosya paylaşan iki maddeden biri silinince ortak dosya kalır, ikisi de silinince gider (iki sırayla)**, ağ önce, yeni SW'de eski önbelleğin silinip kalıcıların kalması, yedek sayfa (beş dil + tarayıcı dili), yönetim (tek tek silme, «Hepsini sil» onayı), klavye, iki temada axe, 320 px, giriş/alt bilgi bağlantıları. Dış ağ kapalı; yalnız `ulucamii.be/media/ses/` depodan CORS başlıklı verilir. Çevrim dışı kipi (`cevrimdisiYap`) hem `context.setOffline` yapar hem bu sahte ses sunucusunu susturur: `route.fulfill` ağ katmanına inmediği için yalnız `setOffline` yetmez ve ses çevrim dışıyken de sahteden gelirdi.
- `scripts/egitim-canli-denetim.mjs`: `/sw.js`, bildirim, simgeler, beş yedek sayfa ve **gerçek ses sunucusuyla** uçtan uca kaydet → çevrim dışı → sil (silince `ezber-ses-v1` boş). Yayından önce yerel önizlemeye karşı denendi: gerçek `ulucamii.be` sesi `Access-Control-Allow-Origin: *` ile iniyor (5 dosya, tam 200), 206 ve çalmaya hazır.

### Bilinen sınırlar

- **İlk ziyaret internet ister**: sayfayı ve SW'yi bir kez çevrimiçi açmak gerekir. SW sayfayı ilk açılışta değil, etkinleştikten sonra denetler; kayıt kutusu da o zaman görünür.
- **Tarayıcı önbelleği silebilir.** Yer daraldığında ya da site uzun süre kullanılmadığında silme tarayıcının kararıdır; WebKit'in izleme önleme kuralı gereği Safari, etkileşim görmeyen sitelerin betikle yazılan verisini (Cache API dâhil) yedi günlük Safari kullanımından sonra silebilir; ana ekrana eklenmiş uygulamalar bu kısıttan muaftır. Kayıt sırasında `navigator.storage.persist()` istenir (Chrome sessizce karar verir, Firefox bir kez sorabilir) ama garanti değildir. Silinirse madde yeniden kaydedilir; yönetim sayfasındaki metin bunu söyler.
- **Kaydedilmemiş ses internetsiz çalmaz.** Online iken dinlenen ses SW'ye uğramadan, tarayıcının normal akışıyla çalar (ilk bayt beklemesi önceki davranışla aynıdır); hiçbir yere kaydedilmez. İnternetsiz dinlemek için maddenin «İnternetsiz çalışmak için kaydet» düğmesine basılmalıdır. Tarayıcının kendi HTTP önbelleği SW'den bağımsızdır ve belirleyici değildir.
- **Ses yalnız kayıt akışıyla önbelleğe girer.** Başarısız ya da iptal edilen kayıt, o denemede yazdığı dosyaları geri alır (başka kayıtlı maddenin künyesinde geçenlere dokunmaz). Maddeler ses dosyası paylaşabilir (ör. «Eûzü-Besmele» dosyaları Alak 1–5 içinde de vardır): bir maddeyi silmek, başka kayıtlı maddenin künyesinde geçen dosyayı silmez; son kullanan madde silinince dosya da gider. «Hepsini sil» ve tarayıcı verilerini silmek her şeyi temizler.
- **Çevrim dışıyken yeni kayıt başlatılamaz** (düğme kapalı ve nedeni yazılı).
- Sorgulu adresler (`?sec=…`) aynı yolun önbellekteki HTML'ini kullanır (anahtar sorgusuzdur); ağ varken her zaman taze sayfa gelir.
- SW kaydı ve kutu yalnız üretim derlemesinde çalışır; yerelde denemek için `npm run egitim:build` + `npm run egitim:onizle` (ya da `egitim:canli -- http://127.0.0.1:4402`).

### Dosyalar

Yeni: `egitim/src/sw/sw.ts`, `egitim/src/lib/cevrimdisi-ortak.ts`, `egitim/src/lib/cevrimdisi-istemci.ts`, `egitim/src/i18n/cevrimdisi.ts`, `egitim/src/scripts/{cevrimdisi-kayit,cevrimdisi,cevrimdisi-liste}.ts`,
`egitim/src/components/CevrimdisiKutu.astro`, `egitim/src/pages/[dil]/cevrimdisi.astro`, `egitim/src/styles/cevrimdisi.css`, `egitim/public/manifest.webmanifest`, `egitim/public/icon-{192,512,maskable-512}.png`,
`scripts/egitim-sw.mjs`, `src/lib/ezber/cevrimdisi.ts`, üç test dosyası (yukarıda).
Değişen: `firebase.json`, `egitim/astro.config.mjs`, `egitim/src/layouts/Taban.astro`, `egitim/src/pages/[dil]/calis/[id].astro`, `egitim/src/components/{Araclar,AltBilgi,Ikon}.astro`,
`egitim/src/styles/araclar.css`, `scripts/egitim-simge-uret.mjs`, `scripts/egitim-canli-denetim.mjs`, `tests/egitim/barindirma.test.mjs`, `package.json` (test listeleri), beş dilde `gizlilik.md`.

## Derste bu hafta ve ezber takvimi (25 Ekim 2026)

Veli çocuğuyla evde çalışırken «bu hafta derste hangi ezber var?» sorusunun cevabını arar. Kurs projesindeki **ezber köşesi planı** (her Kur'an dersinin son
dakikalarındaki köşe; 77 ders günü, 10 Ekim 2026 → 6 Haziran 2027) ve yıllık plandaki öteki derslerin ezberleri tek takvimde birleşti: giriş sayfasında
«Derste bu hafta» bandı, `/<dil>/takvim/` sayfası (bütün yıl) ve her çalışma sayfasında «Derste: 31 Ekim Cumartesi (yeni ezber)» satırı. **Yeni dinî metin,
okunuş ya da ses yoktur**: yalnız katalogdaki madde adları ve var olan çalışma sayfalarına bağlantılar. Hesap, sunucu, ağ isteği ve cihaza yazma yoktur.

### Veri akışı (tek yön)

```
D:\ulu-camii-kuran-kursu\veri\ezber-kosesi-2026-2027.json   (kurs projesi; tek kaynak, bu depoya KOPYALANMAZ)
        │  node scripts/ezber-ders-takvimi.mjs        (üretici: beyaz liste + doğrulama)
        ▼
src/data/ezber/ders-takvimi-2026-2027.json                  (türev, ~10 KB, depoda; her gün tek satır)
        │  + src/data/yillik-plan-2026-2027.json            (öteki derslerin ezberi; zaten depoda)
        ▼
src/lib/ezber/ders-takvimi.ts (saf kütüphane)  →  egitim/src/lib/ders-takvimi.ts (DERS_GUNLERI, HAFTA_SONLARI, SAYFALI)
```

- **Üretici** yalnız şunları alır: `tarih`, `gun`, `kip` (`kose` · `plan-ezber` · `tekrar` · `tam-ders`) ve boş olmayan `yeni` / `pekistir` / `dinleme`
  (`{id, ayet?:[a,b], bolum?:n}`) ile `plan` / `kalici` (kimlik dizisi) listeleri. **Öğreticiye ait alanlar hiç kopyalanmaz**: `not`, `plan_konusu`, `bireysel`
  (bireysel dinleme listesi), `karar`, `ayarlar`, `maddeler`, `katalog`, `kose_disi`. Üst kayda kaynağın adı (mutlak yol değil), SHA-256 özeti ve üretim günü yazılır.
  Bilinmeyen bir alan uyarı verir ve alınmaz; hatalı kaynak reddedilir (tarih artan ve tekil olmalı, gün adı haftanın gününe uymalı, bilinen kip, ayet aralığı,
  bölüm numarası, **her kimlik katalogda olmalı**).
- **`bolum`** alanı (Ettehiyyâtü ve Âyetü'l-Kürsî'nin ilerleyen bölümleri) kaynakta vardır ve gösterilir: «1. bölüm / partie 1 / part 1 / deel 1 / Teil 1».
- **«Diğer derslerin ezberi»** yıllık plandaki Kur'an dışı derslerin (`kod ≠ 'kuran'`) `ezber` metinlerinden katalog kimliğine (`planKimlikleri`) çevrilerek gelir.
  Ezber köşesi listelerinde (yeni, pekiştirme, dinleme, plan, kalıcı) o gün zaten geçen kimlik burada **yinelenmez**; Kur'an dersinin plan ezberi köşedeki `plan`
  grubuyla örtüştüğü için ayrıca sayılmaz.
- **Gruplar** sabit sırayla: Yeni ezber · Pekiştirme · Dinleme · Tekrar ve kalıcı tur · Dersin ezberi (plan) · Diğer derslerin ezberi.
- Çalışma sayfası olmayan ezber (ör. oruç niyeti, tesbihat) bağlantı değil, kesikli çerçeveli düz metindir.

### Kurs planı değişince (güncelleme prosedürü)

1. Kurs projesinde `veri/ezber-kosesi-2026-2027.json` güncellenir (kurs oturumunun işi).
2. Bu depoda `npm run ezber:takvim` çalıştırılır (kaynak yolu: `--kaynak <yol>` ya da `EZBER_KOSESI_KAYNAK`; varsayılan `D:/ulu-camii-kuran-kursu/veri/…`).
   İçerik değişmediyse dosyaya dokunmaz.
3. `npm run test:ezber` (üretici + saf kütüphane + beş dil metinleri) ve `npm run egitim:build` geçmeden yayın yapılmaz.

- **`npm run ezber:takvim:denetle`** (`test:ezber`'in ilk adımlarındandır): türev dosya kaynağın özetiyle ve içeriğiyle aynı mı? Kaynak bu makinede yoksa (CI) **atlar**
  ve 0 döner; kaynak varsa ve fark varsa 1 döner. Kaynakta yalnız bir öğretici alanı değişse bile kaynak özeti değiştiği için dosya «eski» sayılır; yeniden üretmek
  listeyi değiştirmez, yalnız özeti günceller.
- Yıllık plan (`src/data/yillik-plan-2026-2027.json`) değişirse ayrıca bir şey gerekmez; birleştirme derleme sırasında yapılır.

### Hangi hafta gösterilir (Brüksel günü)

Sunucu bugünü bilmez (statik derleme); seçim **tarayıcıda** yapılır (`src/lib/ezber/ders-takvimi.ts` → `brukselGunu`, `haftaBul`). Bugün, **cihazın saat diliminden bağımsız**
olarak Europe/Brussels takvim günüdür (yaz saati bitişi dâhil; Los Angeles'ta 25 Ekim 16.30, Brüksel'de 26 Ekim 00.30'dur). Ders günleri «hafta sonu»na toplanır:
Cumartesi + Pazar + (tatilde) Pazartesi; ardışık ders günleri arasında en çok 2 gün boşluk olabilir (35 hafta sonu; 15 Mayıs 2027 tek günlüktür, 16 Mayıs Kurban
Bayramı'nda ders yoktur). Seçim: bugünü kapsayan ya da bugünden sonra biten ilk hafta sonu. Cumartesi sabahı, Pazar ve tatil Pazartesisi **bu haftanın dersleri**
(«Bu haftanın dersleri: 24 – 26 Ekim»), hafta içi ve tatil günleri **sıradaki ders** («Sıradaki ders: 31 Ekim Cumartesi»), ilk günden önce ilk hafta sonu; son günden
(6 Haziran 2027) sonra kısa bir not. Tarihler `Intl` ile sayfa dilinde yazılır (öğlen UTC; gün kaymaz).

### Sayfalar ve bileşenler

| Yer | Ne |
|---|---|
| Giriş (`/<dil>/`) | Hero'dan sonra, «Tekrar» şeridinden önce `DersBandi.astro`: bütün yılın verisi `data-veri` içinde yoğun biçimde gelir (madde başına `id`, `id~a-b`, `id#n`; ~16 KB ham, ~2,7 KB gzip) — **ayrı istek ve satır içi betik yok (CSP)**. `scripts/ders-bu-hafta.ts` DOM'u kurar (`innerHTML` yok). **JavaScript kapalıyken yanlış hafta göstermek yerine** band gizli kalır, `<noscript>` içinde takvime tek bağlantılı sabit paragraf görünür. Bugünün kartı `aria-current="date"` + «Bugün» etiketi taşır |
| Takvim (`/<dil>/takvim/`) | Tamamen sunucuda çizilir (81 KB, gzip 8,9 KB; 77 gün, 35 hafta sonu, ay → hafta sonu → gün). JS yalnız bugünün haftasını vurgular (`tk-simdi`, `data-simdi="bu-hafta"`), bugünün kartına «Bugün» ekler ve oraya kaydırır; **`#g-…` / `#h-…` ile gelindiyse ya da geri düğmesiyle dönüldüyse kaydırmaz**. Beş dilde aynı yol (`takvim`), indekslenir, site haritasında. Yazdır düğmesi (JS ister) ve A4 yazdırma düzeni var: üç sütun, bir hafta sonu bölünmez, band ve gezinti gizli |
| Çalışma sayfası | `DersSatiri.astro`, başlık bloğunda: «Derste: 31 Ekim Cumartesi (yeni ezber)», takvimdeki o güne bağlanır (`#g-<tarih>`). Sıradaki gün tarayıcıda bugüne göre seçilir (bugün de sayılır); takvimde geçip bitmiş ezberde gizli kalır; **takvimde hiç geçmeyen ezberde hiç çizilmez**. Basılı kartta görünmez |
| Giriş noktaları | Alt bilgide bağlantı; «Kendi çalışmanız için» bloğunda karo olmayan ayrı bir satır (`p.arac-takvim`; **karo sayısı üç kaldı**, çünkü takvim çalışma kaydından değil programdan gelir) |

### Gizlilik, CSP, çevrim dışı

- Cihaza hiçbir şey yazılmaz (localStorage, sessionStorage, çerez, IndexedDB; testle sabit — yalnız bütün sayfaların ortak dil tercihi vardır) ve dış ağ isteği atılmaz. Gizlilik metni değişmedi.
- Satır içi betik/stil yok; veri `data-` özniteliğinde. Güvenlik başlıkları (CSP) değişmedi, testte ihlal sayacı sıfır.
- Service worker'a dokunulmadı: takvim ağ önce gelen sıradan bir sayfadır, çevrim dışı önbelleğe özel bir kayıt gerekmez.

### Testler

- `tests/ezber-ders-takvimi.test.mjs` (düğüm, `test:ezber`, 22 test): türev dosyanın şeması, 77 gün, tüm kimlikler katalogda, tüm tarihler yıllık planın ders günü, öğreticiye ait alan ve kişi adı yok;
  kaynak yerelde varsa dosyanın güncelliği; üretici birimleri ve komut satırı (`--denetle` çıkış kodları, kaynak yok → atla); `digerDersEzberi`/`dersGunleri` (Kur'an dersi sayılmaz, yineleme yok);
  planın Kur'an dışı bütün ezberleri ekranda; hafta sonu gruplaması ve `haftaBul` sınırları (Cumartesi sabahı, Pazar, tatil Pazartesisi, hafta içi, tatil, ilk/son gün, bayram); Brüksel günü yaz saati bitişinde;
  `maddeTarihleri`/`sonrakiGun`; yoğun kodlama gidiş dönüşü; tarih biçimleri; beş dil metin eşitliği, yer tutucular, Fransızca tipografi, yasak simge yok, «hoca» yalnız Türkçede.
- `tests/egitim/takvim.spec.mjs` (Playwright, 82 test = 41 × masaüstü + mobil, `page.clock.setFixedTime`): band (28 Ekim, 24 Ekim sabahı, 25, 26, 27 Ekim, yıl bitişi, ilk günden önce), cihaz saat dilimi başka (Los Angeles),
  JavaScript kapalı (band gizli + yedek paragraf; takvim eksiksiz), takvim sayfası beş dilde (77 gün, 35 hafta, adlar, bağlantılar), vurgulanan hafta, derin bağlantı, düz metin ezber, cihaza yazmama,
  «Derste:» satırı (sıradaki gün, bugün de sayılır, gizli, hiç çizilmez, beş dil, axe), iki temada axe ve 320 px taşma yok (beş dil × giriş + takvim), dokunma hedefi ≥ 44 px, klavye, giriş sırası ve araç karoları,
  yazdırmada band yok, PDF (A4, piksel görsel yok, yazı tipi gömülü).
- Güncellenen: `tests/egitim/barindirma.test.mjs` (site haritasına `takvim` adresleri: +5) ve `scripts/egitim-canli-denetim.mjs` (beklenen adres listesi).

### Bilinen sınırlar

- Program kaynağı kurs projesidir: kurs planı kayarsa türev dosya **yeniden üretilmedikçe** site eski haftayı gösterir (`ezber:takvim:denetle` bunu yakalar, ama kaynak yalnız bu makinede bulunur).
- Tarih biçimleri tarayıcının `Intl` verisine bağlıdır (ör. Fransızca «1 novembre», Almanca «Samstag, 24. Oktober»).
- Takvim, hoca ekranında kaydedilen bireysel dinleme sonuçlarını göstermez (bilerek: öğretici verisi). «Sınıfın ilerleyişine göre program küçük kaydırmalar gösterebilir» notu sayfada yazılıdır.

### Dosyalar

Yeni: `scripts/ezber-ders-takvimi.mjs`, `src/data/ezber/ders-takvimi-2026-2027.json`, `src/lib/ezber/{ders-takvimi,ders-takvimi-veri}.ts`, `egitim/src/lib/ders-takvimi.ts`, `egitim/src/i18n/takvim.ts`,
`egitim/src/components/{DersBandi,DersSatiri,TakvimGunu}.astro`, `egitim/src/pages/[dil]/takvim.astro`, `egitim/src/scripts/{ders-bu-hafta,takvim,ders-satiri}.ts`, `egitim/src/styles/takvim.css`,
`tests/ezber-ders-takvimi.test.mjs`, `tests/egitim/takvim.spec.mjs`.
Değişen: `egitim/src/pages/[dil]/index.astro`, `egitim/src/pages/[dil]/calis/[id].astro`, `egitim/src/components/{AltBilgi,Araclar,Ikon}.astro`, `egitim/src/styles/{araclar,madde,kart}.css`,
`tests/egitim/barindirma.test.mjs`, `scripts/egitim-canli-denetim.mjs`, `package.json` (`test:ezber`, `ezber:takvim`, `ezber:takvim:denetle`), bu belge.
