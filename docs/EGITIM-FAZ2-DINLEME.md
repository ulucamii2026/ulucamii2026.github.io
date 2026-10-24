# Eğitim platformu — Faz 2 dinleme çalışması

Tarih: 2 Ekim 2026, Europe/Brussels. Kullanıcı isteği: eğitim sitesinin durumunu kontrol etmek ve kaldığı yerden devam etmek.

## Dilim 2a — eksik Diyanet sesleri (19 Ekim 2026 yerel; 24 Ekim 2026 07:42'de yayımlandı)

Faz 2 «Bir ezber, bir sayfa» planı Rıdvan'ın onayıyla beş dilime ayrıldı. Plan dosyası:
`C:\Users\ridva\.claude-ana\plans\reactive-cooking-yeti.md`. Dilimler: 2a ses, 2b metin ve madde sayfası, 2c bağlayarak
ezber ve gizleme, 2d oyunlar ve tekrar takvimi, 2e baskı kartı ve duyuru.

**Kapsam**
- 28 Kur'an maddesine ses eklendi:
  - Amme'nin 24 sûresi;
  - Rabbi'şrah lî (Tâhâ 25–28);
  - Alak 1–5;
  - Bakara 285–286;
  - Haşr 22–24.
- Kaynak, `webdosya.diyanet.gov.tr/…/ar_OsmanSahin/{sûre}_{âyet}.mp3` (Hafız Osman Şahin) dosyalarıdır.
  - 509 yeni âyet dosyası eklendi (25 MB); her biri `docs/dinleme-ses-kaynaklari.json` içinde kaynak adresi ve sha256 ile
    kayıtlı.
  - Her dosya ffmpeg ile çözülerek denendi.
  - Tam sûrelerde `{n+1}` dosyasının 404 verdiği doğrulandı: âyet sayısı Diyanet mushafıyla aynı.
- Rükû ve secde tesbihi eklendi: `namaz.diyanet.gov.tr/namaz/assets/audio/dualar/hanefi/4_RUKU.mp3` ve `5_SECDE.mp3`.
  Kayıt birer kez söylüyor; çalar «3 kez» seçeneğiyle tekrarlar.
- Sonuç: sesli madde 27'den **57**'ye çıktı. Çalışma sayfası sayısı 57 × 5 dil = 285 oldu.

**Karar: birleşik sûre kaydı üretilmedi**
- Yeni sûreler için birleşik `sureler/*.mp3` dosyası yok.
- Gerekçe:
  - Derlenmiş ana site 805 MB, GitHub Pages yayın sınırı 1 GB.
  - Git'te izlenen `public/` 693 MB; bunun 364 MB'ı hoca kitapları.
- Bunun yerine çalar âyet parçalarını sırayla çalar.
  - Girişteki liste düğmesi, sûrenin başından başlayan maddede önce eûzü ve besmeleyi çalar (`dinlemeSirasi`,
    `src/lib/ezber/katalog.ts`). Fâtiha'da besmele zaten 1. âyettir.
  - Çalışma sayfası, önceki sûrelerde olduğu gibi, yalnız âyetleri bölüm bölüm çalar.
- Yer açmak için kayıtlı karar şu: hoca kitaplarının bir sonraki yenilemesi ayrı bir Pages deposuna gider.

**Komut:** `python scripts/sure-ses-uret.py --ayetler`
- Yalnız katalogda sesi olmayan Kur'an maddelerinin âyetlerini indirir.
- Kaldığı yerden sürer: kaydı ve özeti tutan dosyayı atlar.
- Sunucu yoğunlukta bağlantıyı kesiyor; betik artan beklemeyle 8 kez yeniden dener ve dosyalar arasında 0,4 sn bekler.

**Diyanet'in paylaşım beyanı**
- `acikkaynakkuran-dev.diyanet.gov.tr` sayfası şöyle diyor: Kur'an metni, sesi ve veri setleri üçüncü kişilerle
  paylaşılmaz; içeriğin başka uygulamalarda kullanılmak üzere toplu aktarılması ya da yeniden yayımlanması talepleri
  karşılanmaz.
- Rıdvan 19 Ekim 2026'da bu kullanımı kurum içi saydı ve «plana devam» dedi. Gerekçe: Diyanet'e bağlı caminin kâr amacı
  gütmeyen eğitimi; künye her yerde yazılır.
- Kurallar:
  - `/sync/*` tam döküm uçları kullanılmaz;
  - yalnız gereken dosyalar sırayla ve beklemeli çekilir.

**Kalan sesler (dilim 2d)**
- Kelime-i Şehâdet: Tahiyyât kaydından kesit alınacak; kulakla teyit gerekir ve `kesit` testi yeniden tanımlanacak.
- «Rabbenâ leke'l-hamd»: Diyanet'in `2_KIYAM.mp3` kaydından.
- Tekbir: hoca seçer (kamet kesiti ya da yapay ses).
- Ezan: beş vaktin kaydı var, vakit seçimi eklenecek.
- Diyanet kaydı olmayan dualar: yapay ses ve hoca onayı. Kur'an metninde yapay ses kullanılmaz.

**Doğrulama:** aşağıdaki «Dilim 2a doğrulaması».

### Dilim 2a doğrulaması (19 Ekim 2026, yalnız 2a değişiklikleriyle)

- 2b dosyaları geçici olarak kenara alınıp 2a tek başına sınandı; ardından geri getirildi.
- `sure-ses-uret.py --ayetler` çıkış 0: 28 maddenin bütün âyetleri indi; tam sûrelerde n+1 dosyası 404 verdi.
- `docs/dinleme-ses-kaynaklari.json`: 1399 kayıt, sha256 değerleri dosyalarla aynı.
- `npm run test:ezber` 59/59; dinleme ses testleri 7/7.
- egitim:
  - 292 sayfa, `astro check` 0 hata;
  - birim testleri 15/15;
  - Playwright: 70 test geçti, 2'si bilinçli atlandı.
- `npm run dogrula:codex` çıkış 0, 10/10 aşama. Ana web testlerinde 803 test geçti, 113'ü yapılandırma gereği atlandı.
- Derlenmiş ana site 827 MB, 5370 dosya; GitHub Pages sınırı 1 GB.
- Sınır: rükû ve secde kayıtlarını henüz bir insan kulağı dinlemedi. Bu iki kaydın Diyanet adresi ve sha256 değeri kayıtlı.

## Dilim 2b — metin katmanı ve madde sayfası (19 Ekim 2026 yerel; v1 24 Ekim 2026 07:48'de yayımlandı)

**Yayın (24 Ekim 2026):** commit'ler `9aff50dc` (2a), `c0139420` (2b), `38dae018` (belge); ana site Pages
[40067329329](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/40067329329) success; egitim Hosting
sürümü 07:48:10 (319 dosya); canlı denetim 36/36 (290 adres). Ayrıntı: `docs/YAYIN-KAYITLARI.md` «24 Ekim 2026».

**Metin hattı:** `node scripts/ezber-metin-cek.mjs`
- Kaynak, kuran.diyanet.gov.tr'nin `/api/v2` uçlarıdır.
  - Yanıtlar AES-256-CBC ile şifreli gelir. Anahtar her çalıştırmada sitenin açık JS paketinden okunur; dosyaya, günlüğe ya
    da depoya yazılmaz.
  - `/sync/*` tam döküm uçları kullanılmaz.
  - Mushaf sayfası başına bir istek atılır, istekler arasında 15 sn beklenir. Gerekçe: API geçidi dakikada yaklaşık
    4 isteğin üstünde 504 veriyor.
  - Yanıtlar `node_modules/.cache/ezber-metin-cek/` altında önbelleğe alınır; Git dışıdır.
- Çıktı `src/data/ezber/metin/<id>.json`: 45 Kur'an maddesi, 588 âyet. Her dosyada şunlar var:
  - Arapça metin, Diyanet'in Türk imlâsıyla birebir (U+06CC yâ; U+10EFD–10EFF sekte, kasr ve medd işaretleri);
  - Arapça sûre adı;
  - Diyanet'in TR, EN ve DE meâlleri, Diyanet'in gruplamasıyla (TR kaynak 4, EN kaynak 5, DE kaynak 6);
  - `ozet`: Diyanet'ten gelen kısmın sha256 özeti. Elle değişiklik testte düşer.
- `--denetle` önbelleği kullanmadan yeniden çeker; dosyalarla fark varsa çıkış 1 verir.
- Hoca alanları yeniden çekimde korunur: `okunus`, `zor`, `onay`, FR/NL meâl.
- Okunuş yalnız `onay.kapsam` içinde ilgili usul (`okunus-tr` / `okunus-fr`) varsa görünür. Şu an hiçbir maddede okunuş
  yok.

**Diyanet verisindeki hatalar:** `src/data/ezber/metin/duzeltmeler.json`
- Her düzeltme tek bir Diyanet kaydına uygulanır ve gerekçesi ile kaynağı yazılıdır.
- Metin değiştirilmez: yalnız âyet bağı düzeltilir ya da eksik kayıt Diyanet'in başka bir yayınından eklenir.
- Uygulanamayan ya da artık gereksiz düzeltme (Diyanet verisini düzeltmiş) betiği durdurur.
- Düzeltilen grup verideki `duzeltme` alanında gerekçesini taşır.
- Beş düzeltme:
  - **TR Fâtiha 1:** kayıt eksik. «Bismillahirrahmânirrahîm» eklendi; kaynak, eski kuran-meal-2 sayfasının 27 Eylül
    kopyası.
  - **TR Fâtiha 2–4:** kayıt 3–4 diye işaretli, düzeltildi.
  - **DE Fâtiha 7:** kayıt eksik. Diyanet'in Almanca meâl kitabından eklendi (dijital.diyanet.gov.tr kitap 5684, PDF s. 4).
  - **EN Tîn 7:** 7–8 diye işaretli; 8'in kendi kaydı var.
  - **DE Abese 40:** 40–42 diye işaretli; aynı kitabın s. 399'u 40'ı tek âyet verir.

**Tanzil iskelet denetimi:** `tests/fixtures/ezber-tanzil-iskelet.json`
- Üretim: `node scripts/ezber-iskelet.mjs --uret <quran-uthmani.json>`.
- Fikstürde yalnız gevşek iskelet özetleri var, metnin kendisi yok. Lisans CC BY 3.0, künye fikstürde.
- 583 âyetin 580'i Tanzil Uthmani ile aynı. Üç fark imlâ farkıdır, okunuş aynıdır; gerekçeleri fikstürde yazılı:
  - Şems 13 (vesukyâhâ), Şems 15 (ukbâhâ): Diyanet elif-i maksûreyi yâ ve çeker üstünle yazar.
  - Kureyş 2 (îlâfihim): Diyanet uzatma yâsını tam harfle yazar.
- Yeniden üretimde, Diyanet iskeleti değişmeyen farkın gerekçesi korunur.

**Yazı tipi:** Ulu Nesih kümesine Diyanet metninin dört kod noktası eklendi: U+06CC ve U+10EFD–10EFF. Toplam 169 kod
noktası, 36,4 KB. Test, metindeki her harfin yazı tipinde olduğunu denetler.

**Madde sayfası v1:** `egitim/src/pages/[dil]/calis/[id].astro`
- Sayfa onaylı `madde.html` taslağından taşındı. Bölümler:
  - yol izi;
  - serlevha: madalyon, Arapça sûre adı, tür, âyet sayısı, şerit, sınıf hedefi;
  - metin ve meâl, Diyanet gruplamasıyla;
  - künye satırı;
  - «Nasıl çalışılır» beş adımı (3–5 «Yakında»);
  - «Hazır olunca hocana oku» ve veli portalı bağlantısı;
  - «Namazda nerede okunur»;
  - komşu maddeler.
- Âyet numarasına dokununca o âyet çalar. Çalan âyet vurgulanır; azaltılmış harekette sayfa kaymaz.
- Âyetin son kelimesi ve numarası bölünmez; numara satıra tek başına düşmez.
- Telefonda sıra: çalar → metin → hoca kutusu ve «Namazda». Komşu maddeler en altta.
- FR'de Diyanet meâli henüz yok:
  - Arapça mushaftaki gibi tek blokta akar;
  - «Le Noble Coran (Diyanet) yakında» notu metnin üstünde durur.
  - Arama, 19 Ekim 2026: Diyanet dijital kitaplığının «Kur'an kitaplığı» (58) ve «Yabancı dil» (376) kategorilerinde Chiadmi
    çevirisi yok. Almanca meâl (5684) orada var. Kitap Rıdvan'a soruldu.
- NL'de meâl yok, şimdilik TR meâli gösterilmez. Gerekçe: kural `docs/DIL-NL-DE.md`, çeviri ve «gözden geçirilecek»
  işareti gerekir.
- «Namazda»:
  - Diyanet İlmihali I, «Namazın Kılınışı»;
  - kunut duaları için «Vitir Namazı» bölümü (s. 305); kendi kaynak satırını taşır.
- Sayfa koşulu tek yerde: `calismaSayfasiVar` (`src/lib/ezber/katalog.ts`).
  - Koşul: Diyanet sesi ya da Kur'an metni.
  - Bugün 57 madde × 5 dil = 285 sayfa.
  - Metni olup koşulu karşılamayan madde testte düşer.
- Ana site: veli portalındaki kilim kartında, sayfası olan her madde egitim.ulucamii.be'deki sayfasına bağlanır
  (`src/scripts/veli-ezber.ts`).

### Dilim 2b doğrulaması (19 Ekim 2026, 2a ile birlikte)

- `npm run test:ezber` 68/68. Yeni testler:
  - `tests/ezber-madde-metni.test.mjs`: şema; âyet aralığı; `ozet`; Arapça dışı harf; Tanzil iskeleti; meâl kapsamı;
    FR yalnız Chiadmi; sesler ve bölümler; yazı tipi kapsamı; sayfa blokları; okunuş onayı;
  - `calismaSayfasiVar`;
  - veli kartındaki bağlantı.
- egitim:
  - `astro check` 0 hata;
  - 292 sayfa;
  - Playwright: 72 test geçti, 2'si bilinçli atlandı (son koşu, dokunma testiyle; kapı içinde 70).
  - `calisma.spec` yeni düzene uyarlandı: ezan notu `.calisma-not`, sayfa koşulu ses ya da Kur'an metni.
- `npm run dogrula:codex` çıkış 0, 10/10 aşama. Ana web testlerinde 803 test geçti, 113'ü yapılandırma gereği atlandı.
  Derlenmiş ana site 827 MB, 5370 dosya; 2b'nin metin dosyaları egitim'e gömülür, ana site boyutu değişmedi.
- Görsel inceleme, ekran görüntüleriyle:
  - TR Fâtiha 1440 px açık ve 390 px açık;
  - FR Nebe 1440 px koyu ve 390 px açık;
  - TR rükû tesbihi 768 px;
  - DE Tîn 390 px koyu.
- İncelemede bulunup düzeltilenler:
  - 320 px'te «Namazda» duruş sırası yana taşıyordu: sütunlar artık daralabiliyor, «Niederwerfung» heceleniyor.
  - Âyet numarası satıra tek başına düşüyordu.
  - «Nasıl çalışılır» ızgarasında boş bir altıncı kare kalıyordu.
  - FR'de meâlsiz ayraçlar vardı ve «yakında» notu metnin altında kalıyordu.
  - Telefonda hoca kutusu metnin önüne geçiyordu.
  - Kullanılmayan eski `calisma.css` kuralları silindi.
- Sınırlar:
  - Fiziksel iPhone/Safari ve gerçek veli girişiyle kilim kartı denenmedi; birim testi sahte veriyle yapıldı.
  - Âyete dokununca çalma ve vurgu sahte sesle sınandı (yeni test, iki cihaz profili); gerçek ses yalnız canlı denetimde.
  - Rükû ve secde kayıtları kulakla dinlenmedi.

**Kalan (2b'nin devamı):**
- Dua metinleri: namaz.diyanet.gov.tr, Dinim İslâm ve İlmihal karşılaştırmasıyla.
- Bilgi maddelerinin metni.
- Hoca inceleme sayfası (`npm run ezber:inceleme`) ve okunuş onayı.
- NL meâl çevirisi.
- FR meâl, Rıdvan kitabı sağlarsa.

## Canlı durum ve bu çalışmanın sınırı

- **9 Ekim 2026 09:19 (CEST) YAYINDA.** Kullanıcının 9 Ekim «Eğitim Faz 2 yayını» seçimiyle güncel `origin/main`
  üzerinde (commit `1fecd5b`) kalite kapısı 10/10 geçti; `npm run egitim:yayinla` → Hosting `ulucamii-egitim` canlı
  kanalı; `npm run egitim:canli -- https://egitim.ulucamii.be` 36/36 (140 adresli site haritası, çalışma çaları gerçek
  ses 206, CSP ihlali 0). Duyuru yapılmadı (karar: metin/oyun içerikleri tamamlanınca). Aşağıdaki 2 Ekim notları
  yerel geliştirme kaydıdır. Yayın kaydı: `docs/YAYIN-KAYITLARI.md` «9 Ekim 2026 (5)».
- `https://egitim.ulucamii.be`: 2 Ekim 19.07'de mevcut canlı denetim 33/33 geçti. Beş dil, CSP ve diğer güvenlik başlıkları,
  yönlendirme, site haritası ve gerçek Diyanet kaydının HTTP 206 ile oynatılması doğrulandı.
- Faz 1a–1f tamam; katalog 81 madde, 27 sesli / 54 sessiz. Canlı site halen beş giriş sayfasından oluşuyor.
- Bu değişiklik Faz 2'nin **dinle–tekrarla** bölümüdür. Arapça metin, okunuş, meâl, gizleme/oyunlar ve hesapsız ilerleme
  bu bölümle tamamlanmış sayılmaz. Yeni dinî metin veya ses eklenmedi; doğrulanmış katalog ve ses kayıtları kullanıldı.
- Commit, push, Hosting/Firestore/GAS yayını, hesap değişikliği veya e-posta gönderimi yapılmadı.
- Dernek GitHub sarmalayıcısıyla uzak `main` salt okunur doğrulandı: `6b0e452f4fc2b1dddf24cbd917fb52694eb03ded`,
  yerel `9877efc` tabanından 10 commit ileride. Farklar vaaz, cami ekranı ve namaz verisinde; eğitim dosyalarıyla
  çakışma yok. Test sırasında çalışma ağacı değiştirilmedi. Yayından önce güncel tabanla birleştirip kalite kapısını
  o içerikte yeniden çalıştır; bu kaydın test sonucu yerel tabana aittir.

## Yerel uygulama

- `egitim/src/pages/[dil]/calis/[id].astro`: yalnız sesi hazır 27 madde için beş dilde 135 sayfa; örnek `/tr/calis/s-fatiha/`.
  Sınıf hedefi mevcut yıllık plandan, madde ve seviye adları ortak katalogdan gelir.
- `egitim/src/scripts/calisma.ts`: bütün bölümler sırayla veya tek bölüm; bölüm başına 1/3 tekrar; 1×/0,75× hız;
  isteğe bağlı üç saniyelik tekrar arası; duraklat/devam/başa dön; anlaşılır hata ve yeniden başlatma.
  Ses kullanıcı tıklamadan yüklenmez. Eski ses nesnesinin olayları/oynatma reddi yeni çalışmayı kesemez.
  Bölüm/tekrar değişimi oynatmayı durdurur; hız anında uygulanır. Sayfadan ayrılınca oynatma ve zamanlayıcı kapanır.
- `egitim/src/i18n/calisma.ts`, `egitim/src/styles/calisma.css`: beş dil, Çini Panosu tasarımı ve açık/koyu tema.
  JavaScript kapalıysa doğrudan kayıt bağlantısı gösterilir. Ezan sayfası kaydın sabah ezanı olduğunu belirtir.
- Girişte Fâtiha düğmesi ve sesli madde adları çalışma sayfalarına bağlanır; pano ve eski `#m-…` bağlantıları korunur.
  Dil seçici aynı maddeyi korur; kanonik/hreflang ve site haritası her çalışma sayfasını içerir.
- Hesap veya ilerleme yazımı yok; çalışma hocanın verdiği basamağı değiştirmez.
- `tests/egitim/calisma.spec.mjs`: ses sırası, tekrar, hız, duraklatma, bekleme iptali, eski olaylardan yalıtım,
  hata sonrası yeniden başlatma, beş dil, klavye, CSP, tema, dar ekran ve kapalı depolama.
  `tests/egitim/barindirma.test.mjs` bütün 142 HTML çıktısını CSP için tarar, 140 kanonik adresi kontrol eder.
- `scripts/egitim-canli-denetim.mjs` bir sonraki yayından sonra 140 adresli site haritası ve yeni çalışma çalarını da bekler.
  Eski canlı sürümün bu yeni denetimden geçmesi beklenmez; 33/33 sonucu değişiklik öncesi denetimin sonucudur.

## Doğrulama

- `npm run dogrula:codex` çıkış **0**; 10/10 aşama geçti: tasarım, tip kontrolü, içerik/derleme,
  ana web, eğitim derleme/test, yerel Firestore kuralları, veli e-postası, otomatik kayıt ve öğrenme testleri.
- Ana site: **796 geçti / 96 yapılandırılmış atlama**. Eğitim: **15/15 birim**, **70 geçti / 2 bilinçli atlama**
  (yönlendirme ve başlık senaryolarının mobil tekrarları). Yeni çalışma ekranı senaryoları iki cihaz profilinde geçti.
- Eğitim derlemesi **142 HTML**, site haritası **140 adres**; satır içi betik/stil olmadan CSP denetimi geçti.
- Görsel inceleme: TR 1440 px masaüstü, FR 390 px mobil, DE 390 px koyu mobil. Koyu tema motifinin dolgusu düzeltildi,
  son derlemede yeniden incelendi. 320 px DE ekran, klavye, açık/koyu tema ve otomatik erişilebilirlik testleri geçti.
- Yeni çalarda gerçek `ulucamii.be` kaydı HTTP **206** ile alındı, **0,75×** hızda süre ilerledi (`currentTime > 0,3`),
  duraklatma `paused: true` oldu. JavaScript kapalı sayfada doğrudan kayıt bağlantısı var ve çalışma düğmeleri kapalı.
- Kanıtlar: `D:\tmp\egitim-faz2-dogrula.log`, `D:\tmp\egitim-faz2-dogrula-exit.txt`,
  `D:\tmp\egitim-faz2-gorsel\kontrol.json` ve aynı klasörde `tr-masaustu.png`, `fr-mobil.png`, `de-mobil-koyu.png`.
- `git diff --check` ve yeni denetim/test betiklerinin sözdizimi kontrolü geçti. Başlangıçtaki dokuz ilgisiz izlenmeyen
  dosya korundu. Test/önizleme portları 4399, 4401, 4402, 8185, 4485, 4585, 9150 son kontrolde dinlenmiyordu.
- Sınırlar: fiziksel telefon/iPhone/Safari, girişli canlı veli/hoca akışı ve yeni sayfaların Hosting yayını denenmedi.
  Otomatik axe testi erişilebilirlik sertifikası değildir. Bu çalışma yalnız yerel tabanda doğrulandı; yukarıdaki uzak dal
  farkı yayın öncesinde ele alınmalı. Yeni bir yayın olmadığı için `YAYIN-KAYITLARI.md` dosyasına yayın kaydı eklenmedi.

## Sonraki sıra

1. Bu bölümün yayın onayı, temiz çalışma ağacından yayın ve yayın kaydı; mevcut ana site ses adresleri değişmedi.
2. Diyanet'ten eksik sesler ve metinlerin kaynaklı hazırlanması. Arapça harf karşılaştırması, meâl kaynakları ve hoca
   okunuş kontrolü tamamlanmadan metinleri çalışma sayfalarına ekleme.
3. Kademeli gizleme, sıralama/eşleştirme/eksik kelime ve cihazda ilerleme.
4. Faz 2'nin asıl madde içerikleri tamamlanınca duyuru; hesaplar/belgeler Faz 3, diğer bölümlerin taşınması Faz 4.
