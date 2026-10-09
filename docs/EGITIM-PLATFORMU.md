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
| Güvenlik başlıkları | `firebase.json`'daki `**` kuralı. CSP: `default-src 'none'`; betik, stil, görsel, yazı tipi ve bağlantı yalnız `'self'`; ses (`media-src`) yalnız `https://ulucamii.be`; `base-uri`, `form-action`, `frame-ancestors`, `object-src` kapalı. Ayrıca `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (kamera, mikrofon, konum, ödeme, USB kapalı; ileride kayıtla tekrar çalışması gelirse mikrofon `self`'e açılır). HSTS'yi Hosting kendisi ekler, ikinci kez yazılmaz: `egitim.ulucamii.be`'de `max-age=31556926`, `*.web.app`'te ayrıca `includeSubDomains; preload` (27 Eylül 2026 ölçümü). Sayfalarda satır içi betik ve stil yoktur (kök yönlendirme de dış dosya: `src/scripts/kok-yonlendir.ts`); `tests/egitim/barindirma.test.mjs` bunu derlenmiş çıktıda denetler |
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
