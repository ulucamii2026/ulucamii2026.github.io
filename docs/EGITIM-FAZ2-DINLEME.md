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
  - **24 Ekim 2026 kararı — FR meâl Hamidullah.** Rıdvan: «elimde yok, bulabiliyorsan bul, bulamazsan hangi Fransızca
    meâli kullanacağın konusunda yetki ve karar sende». Yeniden arandı: kuran.diyanet.gov.tr `/meal/kaynaklar` 8 meâl
    (TR 4, EN, DE, RU, ES), Fransızca yok; DİB 2022 baskısı (ISBN 978-625-435-299-7) yalnız basılı satışta. İnternetteki
    Chiadmi PDF'leri yetkisiz ve 2008 Tawhid baskısıdır, kullanılmadı. Seçilen: Muhammad Hamidullah çevirisi, çevirmen
    adıyla («Traduction du sens : Muhammad Hamidullah.»). Gerekçe: Kur'an kursunun kaynak zinciri FR meâlde Diyanet'ten
    sonra Hamidullah'ı ikincil sayar ve ders sunumları onu kullanır (çocuk sınıfta ve sitede aynı metni görür); TDV de bir
    baskısını yayımladı (ISBN 9789753897334). Metin `scripts/ezber-meal-fr.mjs` ile api.alquran.cloud `fr.hamidullah`'tan
    gelir, her âyet Tanzil dosyasıyla birebir karşılaştırılır (45 Kur'an maddesi, fark 0). Âyet âyet verilir; Diyanet
    gruplaması olmadığı için gruplama cümlesi yalnız çok âyetli grup varsa basılır. Diyanet'in Fransızca meâli dijital
    olarak açılınca meâl ve `egitim/src/i18n/madde.ts` künyesi birlikte değişir (test ikisinin aynı çevirmeni andığını
    denetler). Cami ekranı (`src/lib/ekran/icerik.ts`) hâlâ yalnız Chiadmi bekler, bu karar oraya uygulanmadı.
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


## Dilim 2b devamı ve 2c — dua metinleri, kip kütüphaneleri, çalışma kipleri (24 Ekim 2026)

**Yayın (24 Ekim 2026):** commit'ler `1694a63c` (2b devamı) ve `b5fa54ff` (2c); ana site Pages
[40073445855](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/40073445855) success; egitim Hosting
yayını ve canlı denetim sonucu: `docs/YAYIN-KAYITLARI.md` «24 Ekim 2026 (2)». Kalite kapısı `npm run dogrula:codex`
10/10 geçti.

**Dua metinleri (11 madde; 2c yayınında hoca onayı bekliyordu, hoca 24 Ekim 2026 öğleden sonra onayladı — kapsam ar,
meal, okunus-tr; commit `249d5da3`):** `d-subhaneke`, `d-ruku-tesbihi`, `d-secde-tesbihi`, `d-ettehiyyatu`,
`d-salli`, `d-barik`, `d-kunut-1`, `d-kunut-2`, `d-ezan-duasi`, `d-kamet`, `d-ezan`.
- Arapça metin namaz.diyanet.gov.tr «Sureler ve Dualar» kayıtlarından çıkarılır (`node scripts/ezber-dua-cek.mjs`).
  Türkçe anlam ve okunuş Diyanet yayınlarından aynen alınmış tablodan (`scripts/ezber-dua-tanim.mjs`) gelir. Portal
  kayıtlarının yazım kusurları tabloda tek tek gerekçesiyle düzeltilir; düzeltme kaynakta bulunmazsa betik durur.
- İkinci kaynak karşılaştırması: `tests/fixtures/ezber-dua-ikinci-kaynak.json` (harf iskeleti özetleri, metin yok).
  İskelet denetimi `scripts/ezber-dua-iskelet.mjs`.
- `onay: null`: sayfa «hoca incelemesi bekleniyor» notunu gösterir; okunuş gizli kalır. Hoca inceleme sayfası
  `npm run ezber:inceleme` (docs/ezber-metin-inceleme/ezber-metin-inceleme.html ve .pdf; Arapça, anlam, okunuş ve
  Diyanet kaydını dinleme düğmeleri). Onay: `node scripts/ezber-dua-cek.mjs --onayla hepsi` (yalnız hoca onayladıktan
  sonra).
- Kayıt dinlemesinden (Whisper) çıkan bulgular: Sübhâneke kaydı «ve celle senâük» ibaresini okumuyor; ezan duası kaydında
  metindeki bölümlerin dışında ek cümleler var. Rükû ve secde tesbihi kayıtları kulakla dinlenmedi. Karar hocaya aittir.

**NL meâl taslağı:** 45 Kur'an maddesi. TR meâlden çeviri; her kayıtta `inceleme: true` ve kaynak etiketi «Diyanet İşleri
Başkanlığı Türkçe meâlinden Flemenkçeye taslak çeviri…». Sayfa «gözden geçirilecek» notu gösterir. En belirsiz yerler
(Nebe 31–34, Âyetü'l-Kürsî «kayyûm/kürsî», Alak, İnşikâk, Kureyş): çevirmenin notları 24 Ekim oturum kaydındadır; NL
okuyucudan görüş istenir. Kural: `docs/DIL-NL-DE.md`.

**Veri düzeltmesi:** Zilzâl 99:7 TR meâlinin başında Diyanet'ten gelen görünmez U+FFA0 vardı.
`scripts/ezber-metin-cek.mjs` metin uçlarındaki görünmez kod noktalarını (`kenarTemizle`) atar; yalnız `s-zilzal.json` değişti.

**Kip kütüphaneleri (saf, birim testli):** `src/lib/ezber/gizleme.ts`, `zincir.ts`, `cihaz.ts`.
- `gizleme.ts`: Arapça kelime bölme (durak işareti önceki kelimeye bağlanır), ilk harf (gerçek «ال» tanımlığı ayrımı:
  elif kesre/damme/tenvin ya da alt elif taşımaz, lâm kısa ünlüsüz ya da şeddelidir; ek harfleri و ف ب ك), beş düzey,
  kelime başına açılma, düzey ilerlemesi (iki «Tam» bir üst düzey), «Takıldı» ipucu sırası.
- `zincir.ts`: halkalar, «sondan başla», gruplar (beşli kısımlar; artakalan yarım boydan küçükse öncekine katılır),
  durum makinesi (yeni → sen → kontrol).
- `cihaz.ts`: tek sürümlü tek anahtar `ulucamii:ezber:cihaz:v1`; yalnız bu cihaz; depolama kapalı ya da bozuksa sessizce
  varsayılan.

**Çalışma kipleri (madde sayfasında «Şimdi çalış»; JavaScript yoksa gizli):**
- **Bağlayarak ezberle:** halkalar (yeni parça, senin sıran, kontrol), «sondan başla», uzun maddede beşli kısımlar;
  sonuç Tam / Az takıldım / Bir daha. Uygulama doğruluğu ölçmez.
- **Kademeli gizle:** beş düzey; kelimeye dokununca ilk harf, sonra tam kelime; İpucu / Kelimeyi aç klavye yolu; gizli
  kelime `aria-hidden` ve odaksız; canlı bölge yalnız sayı ve sonucu söyler.
- **Dinleyici kipi:** ilk harfler; «Takıldı» önce bölümün Diyanet kaydını (varsa), sonra kelimeleri açar.
- **A− / A+:** Arapça yazı boyutu beş adım, bu cihazda hatırlanır.
- Tek ses sahibi: çalar ile kipler `ezber:ses-basladi` olayıyla birbirini keser; çalar zamanlaması değişmedi.
- Bütün DOM `textContent` ve öznitelikle kurulur (CSP: satır içi betik/stil yok); veri sayfadan `data-veri` ile gelir.
  Kip ekranları ilk açılışta ayrı parça olarak yüklenir.

**Doğrulama (2c):** `test:ezber` 96/96; `egitim:build` 292 sayfa, astro check 0 hata; `tests/egitim/kip.spec.mjs` 30 senaryo
(beş dil, klavye, ses, kapalı depolama, kapalı JavaScript, CSP, axe); `test:egitim` 102 geçti / 2 bilinçli atlama.
Görsel inceleme 390/768/1440 px, açık/koyu. Sınır: fiziksel iPhone/Safari ve girişli veli akışı denenmedi; cami ekranı
testi `tests/web/ekran.spec.mjs:1143` (Open-Meteo) bir kez aralıklı düştü, bu işle ilgisiz.

## Dilim 2d — Adım 5 «Kendini sına», tekrar takvimi ve «Bugün tekrar» (24 Ekim 2026)

**Yayın (24 Ekim 2026):** commit'ler `d3002f22` (kütüphaneler), `eb45192a` (gizlilik politikası), `8a9d6002` (arayüz ve Hosting başlıkları);
ayrıntılı kanıt ve canlı denetim: `docs/YAYIN-KAYITLARI.md` «24 Ekim 2026 (4)». Dayanak: Rıdvan, 24 Ekim 2026:
«ezber kilimi yayını konusunda herşeyi onaylıyorum, bütün yetki ve karar sende».

**Karar (kesinleşmiş, değişmedi):** puan, sıralama, konfeti ve doğru/yanlış sesi yok; sonuç çocuğun kendi
değerlendirmesine girdi olur ve yalnız bir **tekrar önerisi** üretir. Öneri hocanın verdiği basamağı, kilimi ve rozeti
değiştirmez; yalnız bu cihazda tutulur. Ses kaydı yalnız sayfa belleğindedir. `navigator.storage.persist()` kullanılmadı
(Firefox izin penceresi açar). Ertelenenler: «Anlamla eşleştir» oyunu ve Adım 1'de «senin sıran» kaydı.

**Kütüphaneler (saf, birim testli — `tests/ezber-tekrar-oyun.test.mjs`, 15 test):**
- `src/lib/ezber/tekrar.ts`: aralıklı tekrar kutuları 1 · 3 · 7 · 14 · 30 gün (Cepeda vd. 2008; Rawson–Dunlosky 2022).
  «Tam» bir üst kutuya, «Az takıldım» aynı kutuya, «Bir daha» ilk kutuya (1 gün) götürür. Tarihler yerel gün
  `YYYY-AA-GG` dizesidir; gün aritmetiği UTC takvimiyle yapılır (yaz saati kaymaz); «2026-02-30» gibi taşan günler reddedilir.
  `bugunTekrar` (günü gelen maddeler, en eski önce), `haftaGunu` (son yedi gün, bugün dâhil; seri ya da puan değil, yazıyla
  «bu hafta N gün»).
- `src/lib/ezber/oyun.ts`: tohumlu karıştırma (mulberry32), `farkliSira` (karışık gelmeyen tur olmaz), `parcalaKelimeler`
  (kısa metni 2–4 kelimelik parçalara böler), `eksikKelimeSorulari` (seçenekler aynı maddenin başka kelimelerinden,
  iskeletçe farklı), `hangiAyetSorulari`. Doğru yanıt burada belirlenir; ekran yalnız çizer.
- `src/lib/ezber/cihaz.ts` (sürüm numarası değişmedi, `v:1`): `kip` artık `sina` da olabilir; maddeye `kutu` (−1…4) ve
  `sonraki` (gün), üst düzeye `gunler` (son 21 çalışma günü) eklendi. Eski 2c kayıtlarında bu alanlar yoktur; okunurken
  varsayılanı alırlar ve kayıt bozulmaz (testli).

**Ekran (madde sayfasında üçüncü sekme «Kendini sına»; JavaScript yoksa gizli):**
- **Sırala:** ↑ ↓ düğmeleri ya da Alt + ok; fare sürüklemesi gerekmez. Kontrol sonrası doğru yerdeki parçada ✓ ve yazı
  («doğru yerde»); yalnız renk değil. «Doğru sırayı göster».
- **Eksik kelime:** beş soru, üç seçenek; doğru seçenek ✓ ve gizli «doğru seçenek» etiketiyle işaretlenir, boşluk doğru
  kelimeyle dolar.
- **Hangi âyet?:** hafız kaydı çalar, seçenekler âyet metnidir (yalnız âyet âyet kaydı olan Kur'an maddelerinde; dualarda
  ve kaydı olmayanlarda açık bir not çıkar).
- **Kendi sesim:** mikrofon yalnız «Kaydı başlat»a basılıp tarayıcı izni verilince açılır; kayıt en çok 3 dakika; durunca
  mikrofon hemen bırakılır; kayıt blob adresiyle yalnız bellekte çalınır, hiçbir yere gönderilmez; sekme değişince ya da
  sayfadan çıkınca silinir; çalar başlarsa kayıt durur (hoparlör sesi kayda karışmasın). Hafızın okuyuşu aynı yerde
  karşılaştırma için çalınabilir.
- **Nasıl geçti?** Tam · Az takıldım · Bir daha → sonraki tekrar önerisi («yarın (Pazar 25 Ekim)»; göreli ifade ve tarih
  sayfa dilinde `Intl` ile). Öneri sayfa yenilenince geri gelir; günü gelmişse «tekrar günü geldi» yazar.
- **Bugün tekrar (giriş sayfası):** bu cihazda tekrar kaydı varsa, günü gelen maddeler bağlantıyla listelenir (en çok 12) ve
  «bu hafta N gün çalıştınız» yazılır; kayıt yoksa ya da depolama kapalıysa bant gizli kalır.
- «Çalıştım» sayımı üç kipte de çocuk bir turu bitirince (sonuç seçince ya da soruları bitirince) işlenir (`calistim`).
- Sekme değişince açık mikrofon ve kayıt ekranı bırakılır (`birak`). Sekme tuş takımında ilk sekmede sol ok artık sona sarar
  (2c'deki küçük kusur düzeltildi).
- Adım 5 beş dilde «hazır» işaretlendi; alt bilgideki «Gizlilik politikası» bağlantısı ana sitedeki «Ezber Kilimi»
  bölümüne gider.

**Hosting başlıkları (`firebase.json`):** CSP `media-src https://ulucamii.be blob:` (blob yalnız çocuğun kendi kaydı için;
başka köken eklenmedi) ve `Permissions-Policy: microphone=(self)` (kamera, konum, ödeme, USB kapalı). Bu, mikrofonun
yalnız bu sayfanın kendisine açılması demektir; izin yine kullanıcı dokunuşu ve tarayıcı penceresiyle alınır.
`tests/egitim/barindirma.test.mjs` ikisini sabitler.

**Gizlilik:** ana sitenin beş dildeki gizlilik sayfasına «Ezber Kilimi (egitim.ulucamii.be)» bölümü eklendi
(`#ezber-kilimi`): cihaz hafızasında neyin tutulduğu (site dili, kip ve düzey, yazı boyutu, tekrar önerisi, çalışılan günler),
mikrofonun ne zaman açıldığı, kaydın yalnız bellekte kaldığı ve silindiği, Firebase Hosting günlükleri.

**Doğrulama:** `npm run dogrula:codex` 10/10 GEÇTİ (rebase sonrası, push öncesi): `check` 0 hata / 0 uyarı; `test:ezber` 115/115; ana site derlemesi 1947 sayfa; `test:web` 840 geçti / 120 yapılandırılmış atlama; `egitim:build` astro check 0 hata, 292 sayfa; `test:egitim` 15/15 birim + 158 geçti / 2 bilinçli atlama (yeni: `sina.spec.mjs` ve `sina-mikrofon.spec.mjs`, beş dil × iki cihaz; klavye, CSP, iki temada axe, kapalı depolama, gerçek sahte mikrofonla kayıt–dinle–sil ve «ağa kayıt gitmez» denetimi); `test:kurallar` 54, `test:veli-eposta` 58, `test:oto-kaydet` 14, `test:ogrenme` 13. Görsel inceleme 390 ve 1280 px, açık ve koyu tema, azaltılmış hareket: yatay taşma yok, CSP ihlali 0, konsol hatası 0. Temiz ağaçtan `egitim:yayinla` (derleme + testler yeniden) ve canlı denetim: `egitim:canli` 37/37.

**Sınırlar:** gerçek mikrofon aygıtı yerine Chromium'un sahte ses aygıtı (`--use-fake-device-for-media-stream`) denendi;
fiziksel iPhone/Safari (Safari `audio/mp4` üretir, `MediaRecorder` desteği sürüme bağlıdır) ve Firefox izin penceresi
davranışı denenmedi. Tekrar takvimi yalnız o cihazdadır: telefon ve bilgisayar birbirini görmez; velinin portalında
görünmez (karar). Hoca basamağı değişmez.

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
3. ~~Kademeli gizleme, sıralama/eşleştirme/eksik kelime ve cihazda ilerleme.~~ 24 Ekim 2026'da yayımlandı (2c, 2d). Kalan: «Anlamla eşleştir», Adım 1'de «senin sıran», baskı kartı (2e).
4. Faz 2'nin asıl madde içerikleri tamamlanınca duyuru; hesaplar/belgeler Faz 3, diğer bölümlerin taşınması Faz 4.
