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
  **24 Ekim 2026:** kurs kütüphanesinde doğrulanmış sesi bulunan iki dua (Kelime-i Tevhid, Kelime-i Şehâdet) görünür «Yapay ses»
  etiketiyle eklendi; ayrıntı aşağıdaki «Yapay sesli dualar, cami ekranı FR meâl ve NL gözden geçirme (24 Ekim 2026)».

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
    denetler). Cami ekranına aynı gün uygulandı (`scripts/ekran-meal-fr.mjs`, aşağıdaki «Yapay sesli dualar, cami ekranı FR meâl…» bölümü).
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
**24 Ekim 2026 gözden geçirmesi:** 45 maddenin tamamı Diyanet TR meâliyle yeniden karşılaştırıldı; sonuç aşağıdaki bölümde.

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

## Yapay sesli dualar, cami ekranı FR meâl ve NL gözden geçirme (24 Ekim 2026)

Dayanak: Rıdvan'ın 24 Ekim 2026 «kalan işleri tamamla… ezber kilimi yayını konusunda herşeyi onaylıyorum, bütün yetki ve
karar sende» talimatı. Üç iş, aynı yayın.

### 1. Yapay sesli iki dua (Kur'an dışı)

- **Dinleme onayı: VERİLDİ** (Rıdvan, 24 Ekim 2026 akşamı: «sesi onaylıyorum»). İki ses yayındaki hâliyle kalır; geri alma adımı gerekmez.
- **Kural:** Diyanet kaydı her zaman önceliklidir; Kur'an metninde yapay ses asla kullanılmaz; **yeni TTS üretilmedi.** Yalnız
  kursun kütüphanesinde zaten bulunan, yazıya dökümle doğrulanmış iki ses alındı: `D:/ulu-camii-kuran-kursu/sesler/dua/kelime-i-tevhid-ar.mp3`
  ve `kelime-i-sehadet-ar.mp3` (Gemini TTS `gemini-3.1-flash-tts-preview`, ses Charon, 5 Eylül 2026). Yazıya dökümde okunan metin maddenin
  metniyle aynı çıktı (benzerlik 1,00 ve 0,99; metin Temel Dinî Bilgiler s. 25–26 ile aynı).
- **Diyanet kaydı yok:** namaz portalının 28 kaydında ve e-Elifbâ'da bu iki metin yoktur. Şehâdet'in Tahiyyât kesiti ayrı iştir
  (kulakla teyit bekler); Diyanet kaydı gelirse kataloğa `ses.tam` olarak yazılır, `yapay` bayrağı ve yapay dosya kalkar.
- **Dosyalar:** `public/media/ses/yapay/kelime-i-tevhid.mp3` (10,08 sn, sha256 `8252fa70…`) ve `kelime-i-sehadet.mp3` (13,92 sn, sha256 `9481775f…`).
  Kurs kütüphanesinin seviyeli kopyasıdır (`sesler/.seviye/`); yeniden işlenmedi: çalma yüksekliği −16 LUFS (çift mono −16,45 ve −16,44),
  gerçek tepe −4,26 ve −2,27 dBTP. Kayıt `docs/dinleme-ses-kaynaklari.json` içinde: `yapay: true`, kaynak dizisi «Yapay ses (Gemini TTS, …); Diyanet kaydı
  yoktur», `kursKaynakSha256` (kurs kütüphanesindeki ham dosya), `dogrulama`, `seviye`, `sure`.
- **Katalog:** iki maddede `ses: { tam, yapay: true }`. Şema `yapay` için yalnız `true` kabul eder; `yapaySesMi()` (`src/lib/ezber/katalog.ts`)
  etiketin tek kaynağıdır.
- **Görünür etiket** (çalışma sayfasında çalar bölümünün başında, liste satırında rozet olarak, çal düğmesinin erişilebilir adında):
  TR «Yapay ses», FR «Voix de synthèse», EN «Synthetic voice», NL «Synthetische stem», DE «Synthetische Stimme». Sayfa «Bu madde için
  Diyanet'in ses kaydı yoktur…» notu taşır ve o sayfada Diyanet kaydı olduğunu söyleyen cümle yer almaz. Çal düğmesi etikete `aria-describedby` ile bağlıdır.
- **Atlananlar:** Amentü, Selâm ve Teşrik tekbiri. Kurs kütüphanesindeki seslerin okuduğu metin maddenin metniyle birebir aynı olmadığı için
  alınmadı; bunlar için ya Diyanet kaydı ya da onaylı yeni üretim gerekir (yeni üretim bu işte yasaktı).
- **Metin sayfası yok:** dua metni hattı (`ezber-dua-cek.mjs`) Diyanet portalı kaynağı ve ikinci kaynak ister; bu iki madde için yalnız Camiye
  Gidiyorum ve Temel Dinî Bilgiler anılıyor. Sayfa çalar, etiket ve «metin hazırlanıyor» notundan oluşur; «Yüzünden oku» adımı «Yakında» kalır. (Güncelleme, 24 Ekim 2026 akşamı: iki maddenin metni de artık Diyanet kitaplarından hazırlandı, bkz. «Kitap kaynaklı dua metinleri…».)
- **Testler:** `tests/ezber-katalog.test.mjs` (yalnız bu iki madde yapay olabilir; Diyanet kaydı bulunan dua yapay sese bırakılmaz; kayıtla birebir;
  `public/media/ses/yapay/` yalnız yapay ses içindir), `tests/egitim/yapay-ses.spec.mjs` (beş dil, iki proje: 42 test).
- **Geri alma:** hoca dinleyip beğenmezse iki maddenin `ses` alanı katalogdan, dosya ve defter kaydı birlikte silinir (testler birini diğersiz bırakmaz).

### 2. Cami ekranı FR âyet meâli

`scripts/ekran-meal-fr.mjs` 97 Kur'an kaydından 72'sine Hamidullah çevirisini (`fr` ve `kaynakFr: "Hamidullah"`) ekledi; 25 kayıt ekrana
sığmadığı için AR + TR kaldı. Her âyet iki kaynakla (api.alquran.cloud `fr.hamidullah` ve Tanzil) birebir doğrulandı. Sayılar, sığmayan kayıtların listesi,
kaynak satırı kararı ve tipografi: [EKRAN-YOL-HARITASI.md](EKRAN-YOL-HARITASI.md) «Ekran FR âyet meâli (24 Ekim 2026)».

### 3. NL meâl gözden geçirme

45 maddenin 461 grubu Diyanet TR meâliyle yeniden karşılaştırıldı; 59 grup düzeltildi (61 işlem: terim tutarlılığı 26, akıcılık 17, çeviri hatası 14,
imlâ ve noktalama 3, eksik ya da fazla 1). 25 dosya değişti; yalnız `meal.nl.gruplar[*].metin`. `inceleme: true` ve «taslak çeviri» kaynak etiketi korundu,
sayfa «gözden geçirilecek» notunu göstermeye devam eder. Hiçbir tr, en, de ya da fr meâline dokunulmadı.

- **Standartlaşan terimler:** azap «straf»; gün adları «de Dag van de Afrekening en Vergelding», «de Dag van de Opstanding», «de Dag van het Oordeel en de Scheiding»;
  takva «godsvrees (zich hoeden voor ongehoorzaamheid aan Allah)», muttaki «godvrezend»; bedbaht «rampzaligste»; yalanlamak: nesne gün, âyet ya da Kur'an ise
  «loochenen», nesne kişi ise «voor leugenaar uitmaken»; Kur'an için zamir «Het» (büyük harfli «Hij» yalnız Allah için); dönüş «terugkeer naar».
- **Anlam düzelten yerler:** Nebe 36–38 (özne ve nesne karışmıştı), Bakara 286 («Belast ons niet met wat wij niet kunnen dragen!», «Pardonneer ons»),
  Nâzi'ât 19 (teklif, koşul değil), Nâzi'ât 43, Tekvîr 8–9 (soru kime soruluyor), Kureyş 1–2 (belirsiz öbek), Mâ'ûn 1 (soru işareti), Târık 4 ve 13, Burûc 21,
  Abese 23.
- **Hâlâ belirsiz (NL ana dilli okuyucu ve hoca görüşü gerekir):**
  - Âdiyât 8 «çok katıdır»: «zeer hardvochtig»; alternatif «zeer gierig» ya da «zeer gehecht» (EN ve DE sevginin yoğunluğu olarak okuyor).
  - Âyetü'l-Kürsî: «kayyûm» için «de Zelfbestaande» (alternatif «de Onderhouder van alles»); «Kürsî» için «Zijn Zetel» (alternatif «Zijn Voetenbank»); «Troon» Arş için ayrıldı.
  - Alak 2 «alak»: çevrilmeden «alaq»; alternatif «aanklevende klont».
  - Nebe 39 «hak olan gün»: «de dag van de waarheid»; alternatif «de waarachtige dag». Nebe 33: «jonge vrouwen… volgroeide boezem»; alternatif «jonge meisjes».
  - İnşikâk 24 «müjdele» ironisi: «Breng hun… het bericht»; alternatif «Geef hun de ‘blijde boodschap’ van een pijnlijke straf».
  - Tîn 5 «aşağıların aşağısına»: «de laagste der lagen»; alternatif «het allerlaagste van het lage».
  - Bakara 286 «Mevlâ»: «Beschermer» (alternatif «Beschermheer»); «affet» için «Pardonneer» (alternatif «Wis onze fouten uit»).
  - Kureyş 2 «ısındırıp alıştırmak»: «vertrouwd en gewend maken» (FR ve DE bunu «pakt» okuyor).
  - Çevrilmeden bırakılan adlar: «at-Tariq», «al-Hoetama», «al-Kauthar», «Hawiya» (Türkçe kaynak da çevirmiyor).
- **Doğrulama:** `node --test tests/ezber-madde-metni.test.mjs`; her dosya HEAD ile JSON düzeyinde karşılaştırıldı, NL metni dışındaki alanlar ve biçim aynı.

## Dilim 2e — «Anlamla eşleştir», Adım 1 «senin sıran», basılı ezber kartı ve görsel cila (24 Ekim 2026)

**Yayın (24 Ekim 2026):** commit'ler `bcfe05bd` (kütüphaneler), `0b1e4eb2` (arayüz), `87a487e7` (giriş başlığı cilası), `059179fe` (yapay-ses.spec uyarlaması); origin/main taban `501bc5c4`. Ayrıntılı kanıt ve canlı denetim: `docs/YAYIN-KAYITLARI.md` «24 Ekim 2026 (5)».
Dayanak: Rıdvan, 24 Ekim 2026: «ezber kilimi yayını konusunda herşeyi onaylıyorum, bütün yetki ve karar sende».

### 1. «Anlamla eşleştir» (Adım 5, dördüncü oyun)

- **Ne yapar:** seçili bölümden en çok üç Arapça parça ile sayfa dilindeki meâl blokları karışık sırayla dizilir; çocuk bir
  parça, sonra anlamını seçer. Doğru çift kilitlenir, iki yanda **aynı numara** ve ✓ (ekran okuyucuya «eşleşti» yazısı) belirir;
  yanlış çiftte yalnız nazik bir yazı çıkar («Bu ikisi eşleşmedi; başka bir anlam deneyin»), kırmızı durum, ses, puan ve sıralama
  yoktur. «Eşleşmeleri göster» kalanları açar (o gün «çalıştım» sayılmaz); «Yeni tur» yeni üçlü kurar. Üç çift bitince
  «çalıştım» işlenir ve «Nasıl geçti?» sorulur. Klavye: Tab ile gezinti, Enter/Boşluk ile seçim; odak eşleşince sıradaki
  Arapça parçaya geçer.
- **Hangi sayfada çıkar (karar):** yalnız sayfa dilinin **gözden geçirilmiş** meâli varsa ve bölümde en az iki dolu meâl bloğu
  varsa (`anlamBloklari` → `anlamAdaylari`). Sonuçlar:
  - **TR:** Diyanet meâli, 45 Kur'an maddesi; bir bloklu sûrelerde (Felak, Nâs, Nasr, Kureyş) düğme çıkmaz. Dualarda yalnız TR
    meâl vardır (3–8 blok): TR dua sayfalarında çıkar, diğer dillerde çıkmaz.
  - **FR:** Hamidullah (çevirmen adıyla künyede; `sayfaMeali` yalnız Chiadmi/Hamidullah kaynağını kabul eder).
  - **EN / DE:** mevcut meâl.
  - **NL: çıkmaz.** NL meâl `inceleme: true` taslaktır (Rıdvan henüz gözden geçirmedi); taslak bir çeviriyi «doğru cevap anahtarı»
    yapmak yanlış bir şeyi öğretme riskidir. NL sayfada dört oyun kalır. NL meâl gözden geçirilince `inceleme` kalkar ve oyun
    kendiliğinden açılır, kod değişmez (`tests/ezber-tekrar-oyun.test.mjs` bunu NL taslak durumuyla sabitler).
- **Doğru çiftler veriden gelir:** meâl grupları (`gruplar[{ayetler, metin}]`) bölüm aralıklarına eşlenir; aynı metinli bloklar
  ayrıştırılır (belirsiz eşleşme sunulmaz); sağ sütun `farkliSira` ile karışık gelir (asla sırayla değil).
- Kütüphane: `src/lib/ezber/oyun.ts` (`anlamAdaylari`, `eslestirmeTuru`), `src/lib/ezber/madde-metni.ts` (`anlamBloklari`).
  Ekran: `egitim/src/scripts/kip-sina.ts` (`anlamKur`), CSS `egitim/src/styles/madde.css`, metinler `egitim/src/i18n/sina.ts`
  (beş dil). Dar ekranda iki sütun alt alta dizilir; yüksek karşıtlık ve zorunlu renk kipinde kenarlıklar korunur.

### 2. Adım 1 «senin sıran» (ertelenen kısım)

- Dinleme sonrası bekleme artık dört seçenekli bir seçimdir: **Yok · Dinleme süresi kadar (varsayılan) · 1,5× · 2×**. Süre,
  bölümün gerçek kayıt süresinden ve seçili hızdan hesaplanır (`siraSuresiMs`: süre ÷ hız × katsayı; 0,75× hızda daha uzun);
  süre bilinmiyorsa 3 sn; alt sınır 2 sn, üst sınır 90 sn. Bekleme sırasında durum satırı «Senin sıran: sûreyi sen oku»
  der (`data-senin-siran`) ve ilerleme çubuğu (`<progress aria-hidden>`, 100 ms) dolar; çubuk yalnız görsel yardımdır, anlam
  yazıda ve durum satırındadır. Durdurma, bölüm/tekrar/hız değişimi ve sayfadan ayrılma çubuğu ve zamanlayıcıyı temizler.
- **Karar:** eski kullanıcı seçeneği «3 sn bekle» onay kutusuydu ve varsayılan kapalıydı. «Senin sıran»ın anlamı çocuğun
  sesli tekrar etmesidir; sabit 3 sn bir sûre için fazla kısa olduğundan bekleme **dinleme süresi kadar** olur ve varsayılan
  budur. **Seçim saklanmaz** (her ziyaret varsayılanla başlar; cihaz hafızasına yeni alan eklenmedi, gizlilik bölümü
  değişmedi). Eski `[data-bekle]` onay kutusu kaldırıldı (testler uyarlandı).
- Kütüphane: `src/lib/ezber/sira.ts`; ekran `egitim/src/scripts/calisma.ts`; metinler `egitim/src/i18n/calisma.ts`.

### 3. Basılı ezber kartı (A4)

- **Teslim kararı:** kart, madde sayfasının **yazdırma görünümüdür**. Her madde sayfasında «Kartı yazdır» düğmesi (JavaScript
  varsa) tarayıcının yazdırma penceresini açar; telefonda «PDF olarak kaydet / paylaş» aynı yoldan çalışır. Sayfa her zaman
  güncel veriden basıldığı için kart **eskimez**. Toplu hâli için `npm run ezber:kart` (`scripts/ezber-kart-pdf.mjs`)
  derlenmiş siteyi yerelde sunar, Chromium'la her sayfayı PDF'e yazar. PDF'ler **depoya ve Hosting'e konmaz** (280 dosya,
  yaklaşık 37 MB; veri değişince eskir). Güncel paket bu çalışmada `D:\tmp\ezber-kartlar-2026-10-24\` altında üretildi.
- **İçerik:** başlık satırı (kurs adı, «Ezber kartı»), madalyon (madde motifi), madde adı ve Arapça adı, tür/âyet sayısı/sınıf
  hedefi, **kare kod**, âyet gruplarında Arapça metin + sayfa dilinin meâli, «Dikkat edilecek yerler», kaynak künyesi, alt
  bilgi ve sayfa numarası. Kişisel veri, ilerleme ya da hesap bilgisi yoktur; kare kod yalnız kamuya açık sayfa adresini
  kodlar (`https://egitim.ulucamii.be/<dil>/calis/<madde>/`).
- **Arapça ve okunuş:** Arapça metin yalnız mevcut doğrulanmış veriden gelir, yeni metin üretilmedi. **Latin okunuş varsayılan
  olarak basılmaz** (sayfada da gizli başlar); hocanın onayladığı okunuş (11 dua, `okunus-tr` onayı) ancak çocuk/hoca sayfada
  «okunuşu göster» dediyse basılır. Toplu pakette bu seçenek ayrı klasördedir: `okunuslu\` (`--okunus`). Onaysız maddede
  okunuş hiç yoktur. Meâli olmayan/taslak (NL) maddelerde sayfadaki uyarı kartta da çıkar.
- **Vektör kural:** kare kod `qrcode` paketinin matrisinden **saf SVG yoluna** yazılır (`src/lib/ezber/kare-kod.ts`; art arda
  karanlık modüller tek dikdörtgen, dört modül sessiz bölge, hata düzeltme M); piksel yoktur. Motifler ve madalyon SVG'dir.
- **Düzen:** `@page` A4 dikey, kenar boşlukları 16/15/18 mm (ev yazıcısı sınırı ≥ 15 mm), tam sayfa zemin yok, koyu tema
  yazdırmada açık jetonlara döner (siyah yazı beyaz kâğıtta), gezinme/araçlar/hoca kutusu basılmaz, her âyet grubu sayfada
  bölünmez, sayfa numarası `@page @bottom-right`. Kısa maddelerde sayfanın altı boş kalır (kabul edildi); uzun sûreler çok sayfa olur (Nebe 40 âyet: TR 5, FR 6; en uzun kart 7 sayfa).
- **Doğrulama (`scripts/ezber-kart-dogrula.py`, PyMuPDF + OpenCV + poppler):** her PDF'te piksel görsel 0 (`get_images` ve
  `pdfimages`), tüm yazı tipleri gömülü (`pdffonts`), kare kod ilk sayfadan **çözülür ve kanonik adresle eşit** çıkar, metin
  katmanı var. Tam paket (5 dil × 56 kartlı madde = **280 PDF, 585 sayfa, ≈ 37 MB**) ve okunuşlu paket (**44 PDF, 55 sayfa**): **hatalı 0**. Aynı denetim canlı siteden (`https://egitim.ulucamii.be`, tr/fr/nl `s-ihlas`) Chromium'la yazdırılan PDF'lerde de 0 hata verdi. Kartı olmayan madde: Arapça metni hazır olmayanlar; onlarda düğme de kare kod da yoktur. (24 Ekim 2026 akşamı: Kelime-i Tevhid ve Şehâdet, Euzü-Besmele dâhil on dua için metin hazırlandı ve kartları var; bkz. «Kitap kaynaklı dua metinleri…».)

### 4. Görsel cila turu

- Ekranlar 320 / 360 / 390 / 768 / 1280 px × açık/koyu: giriş sayfası, sûre sayfası (Nebe), dua sayfası; Sına sekmesi ve yeni
  oyun açık; «senin sıran» seçici ve ilerleme çubuğu bekleme durumunda; yazdır düğmesi. Odak halkası (3 px, açık ve koyu
  tema) yeni öğelerde görünür; karşıtlık axe ile açık ve koyu temada sınandı.
- **Bulunan ve düzeltilen gerçek kusur:** giriş sayfası başlığı bölünemeyen tek sözcükle taşıyordu. NL «Memorisatiekelim»
  (3 rem tabanı) 440 px'e kadar sayfayı yatay taşırıyordu (Pixel 7 genişliğinde 28 px, 360'ta 80 px); FR/EN «mémorisation»
  320 px'te 20 px taşıyordu (WCAG 1.4.10 yeniden akış ölçüsü). `egitim/src/styles/cini.css`: `.giris h1` boyutu içerik
  genişliğine bağlandı (`min(özgün clamp, (100vw − 2,4 rem) / 7,2)`; NL için 9,1). Geniş ekranda görünüm değişmez.
  870 sayfa (5 dil × 58 sayfa × 320/360/768 px) taşmasız; yeni `tests/egitim/yeniden-akis.spec.mjs` masaüstü Chromium'da
  dar pencereyle sabitler (telefon projesi taşan içeriği kendi görünümüne kattığı için orada yakalanmaz).
- **Bilinçli bırakılanlar:** Gezinme kırıntısı ve alt bilgi bağlantıları 20–22 px yüksekliktedir (aralık istisnası kapsamında).
  Giriş panosunun 360 px'te 23 px kalan karoları 24 Ekim 2026'da düzeltildi (aşağıda «Giriş panosu karoları 24 px»); 356 px'in
  altında 13 sütun 24 px'e sığmaz, orada her karonun gittiği liste bağlantısı «eşdeğer bağlantı» sayılır.

### Testler

- `tests/ezber-tekrar-oyun.test.mjs` (22 test: `anlamBloklari`, taslak NL, `anlamAdaylari`, `eslestirmeTuru` 300 tohumla, tur,
  `siraSuresiMs`, `siraKatsayisi`), `tests/ezber-kare-kod.test.mjs` (4 test: yoldan geri kurulan matris `qrcode` matrisiyle
  birebir, 280+ adres; görsel/bağlantı yok; sessiz bölge).
- `tests/egitim/anlam.spec.mjs` (beş dil, doğru çiftler veriden, numaralı kilit, yanlış çift, klavye, çok bölümlü Nebe FR,
  TR Felak/FR Felak, TR/EN dua, axe açık/koyu, CSP 0), `tests/egitim/kart.spec.mjs` (ekranda gizli, düğme `window.print`,
  kare kod kanonik adres ve saf vektör, yazdırma ortamı açık/koyu, `page.pdf()` A4/görsel yok/yazı tipi/çok sayfa),
  `tests/egitim/yeniden-akis.spec.mjs`; `calisma.spec.mjs` «senin sıran» (süre ölçeği ×1/×2/0,75×/Yok/bilinmeyen süre
  için sahte saat) ve beş dil; `kip`, `sina`, `sina-mikrofon` yeni seçici ve düğme sırasına uyarlandı.

**Doğrulama:** `npm run dogrula:codex` rebase öncesi tabanda **9/10 GEÇTİ**: `check` 0 hata (453 dosya); `test:ezber` 126/126 (rebase sonrası 127/127); ana site 1947 sayfa; `test:web` 839 geçti / 120 atlama / **1 zaman aşımı** (`tests/web/ders-defteri.spec.mjs:88` mobil, 30 sn; makine yüklüyken düştü, tek başına 7 sn'de geçti, dosyanın tamamı 32/32 — egitim koduyla ilgisiz, geçici yük kaynaklı); `egitim:build` astro check 0 hata; `test:egitim` 15/15 birim + 222 geçti / 8 bilinçli atlama; `test:kurallar` 54, `test:veli-eposta` 58, `test:oto-kaydet` 14, `test:ogrenme` 13. Bilinen aralıklı `tests/web/ekran.spec.mjs:1143` (Open-Meteo) bu koşuda düşmedi. Rebase (yapay sesli dualar, ekran FR meâl, NL gözden geçirme geldi) sonrası: `test:ezber` 127/127, `egitim:build` 0 hata / 302 sayfa, `test:egitim` ilk koşuda **20 hata**: hepsi yeni gelen `yapay-ses.spec.mjs` (kaldırılan `[data-bekle]` onay kutusunu işaretini kaldırıyordu) — `[data-sira]` «Yok» seçimine uyarlandı, 42/42; yayın sırasında temiz ağaçta `test:egitim` **264 geçti / 8 atlama**. Elle: ekranlar 320–1280 px açık/koyu, odak halkası, taşma taraması (870 sayfa), canlı tr/fr/nl kontrolü.

**Sınırlar:** NL meâl gözden geçirilmedi (oyun NL'de kapalı); kart PDF'leri Chromium'un yazdırma çıktısıyla üretildi ve
doğrulandı, fiziksel yazıcı ya da Safari/Firefox yazdırma önizlemesi denenmedi; kare kodun gerçek telefon kamerasıyla
okunması denenmedi (OpenCV çözücüsüyle PDF'ten okundu); «senin sıran» sesli tekrarı dinlemez (çocuğun tekrarı doğrulanmaz);
fiziksel iPhone/Safari ve gerçek mikrofon yine denenmedi; duyuru yapılmadı.

## Bilgi maddeleri — kaynaklı sayılı listeler (24 Ekim 2026)

Katalogdaki on `bilgi` maddesi (imanın şartları, İslâm'ın şartları, abdestin, gusül ve teyemmümün farzları, namazın farzları, Ülü'l-azm
peygamberler, dört halife, seçme hadisler, Kur'an okumanın fazileti hadisleri) artık egitim sitesinde beş dilde (tr, fr, en, nl, de)
kendi sayfasına sahiptir: **50 yeni sayfa**. Ses ve Arapça âyet metni yoktur; sayfa kaynaklı, numaralı bir listedir.

### Tasarım

- **Veri:** madde başına tek dosya `src/data/ezber/bilgi/<id>.json`, şema `bilgi.schema.json` (`additionalProperties: false`).
  Madde: sıralı satırlar (`ad` beş dilde, isteğe bağlı kısa Arapça `ar`, hadiste `kunye` ve `dogrulama`), isteğe bağlı gruplar (namazın
  şartları / rükünleri), `sirali` (sıra anlamlı mı), sayfa notu `not`, kaynaklar (`metin`, `fr`, `ar`, `dogrulama` rolleriyle,
  sayfa ya da bölüm göstermek zorunda), `alinmayan` (kitapta olup doğrulanamadığı için sayfaya alınmayanlar ve nedenleri) ve `onay`.
- **Katalog bayrağı:** `bilgiMetni: true` (`katalog.schema.json`, `KatalogOgesi`, `calismaSayfasiVar`). `calismaSayfasiVar` ortak koddur:
  ana sitedeki veli kilim kartı bu on maddeyi de egitim sayfasına bağlar (daha önce düz addı). `tur: "bilgi"` olup bayrağı olmayan madde
  sayfa almaz; bayrak ile dosya bire bir eşleşmek zorundadır (test).
- **Sayfa:** `egitim/src/components/BilgiBolumu.astro` (liste sunucuda yazılır: JavaScript olmadan da okunur), `egitim/src/scripts/bilgi.ts`
  (çalışma kipleri; yalnız `textContent`, sınıf ve öznitelik: CSP satır içi betiğe izin vermez), `egitim/src/styles/bilgi.css`,
  `egitim/src/i18n/bilgi.ts`, saf işlevler `src/lib/ezber/bilgi-metni.ts`. `[id].astro` yalnız bilgi dalı ekler: Kur'an metni
  yerine liste, «çalışma yolu» basamakları (dinle/okuyarak ezberle…) bu sayfada yoktur.
- **Okunaklılık:** satır başına tek madde, 1,3–1,75 rem punto, numara yeşil kutuda, 360 px'te tek sütun; Arapça terim sağdan sola
  (`lang="ar" dir="rtl"`), A− / A+ yalnız sayfada Arapça terim varsa çıkar ve cihazda kalır. Fransızca iki nokta öncesi bölünmez
  boşluk tarayıcıda çizilen dizelerde de vardır.
- **Çalışma kipleri** (hesapsız, yalnız bu cihazda): «Gizle ve söyle» (madde noktalı çizgiyle gizli, çocuk önce söyler, «Göster» ile
  kontrol eder; hepsini göster/gizle; gizli sayısı okunur), «Sırala» (yalnız `sirali` ve en az üç maddeli grupta; ↑ ↓ düğmeleri ya da
  Alt + ok; iki gruplu listede bölüm seçilir; «Kontrol et», «Doğru sırayı göster», «Yeni tur»; puan ve ses yok) ve «Nasıl geçti?»
  (Tam / Az takıldım / Bir daha → sonraki tekrar günü önerilir, `tekrar.ts` kutuları 1·3·7·14·30). Kip kütüphaneleri (`oyun.ts`,
  `tekrar.ts`, `cihaz.ts`, `kip-ortak.ts`) yeniden kullanıldı; yeni oyun motoru yazılmadı.
- **Dil durumu:** `tr` kaynağın kendisi; `fr` Camiye Gidiyorum'un resmî Fransızca baskısı (baskıda tam karşılığı olmayan satırda
  `taslak: ["fr"]`, sayfada «à relire» rozeti); `en`, `nl`, `de` her zaman Türkçeden çevrilmiş **taslaktır** ve sayfada «resmî değil,
  hoca inceleyecek» der (`docs/DIL-NL-DE.md`). `onay: null` olduğu sürece her dil «hoca incelemesi bekleniyor» der.

### Kaynak kuralı ve doğrulama

Dinî metin ezberden yazılmadı. Her satır, aşağıdaki kitaptan **birebir** alındı ve ikinci bir Diyanet çizgili kaynakla
karşılaştırıldı; ikisi uyuşmayan satır sayfaya alınmadı. Fransızca yalnız resmî baskıdan geldi. Hadis metni ve künyesi Diyanet'in
*Hadislerle İslam* ya da *Riyâzü's-Sâlihîn* yayınında bulunmadan alınmadı (sunnah.com yalnız numara doğrulaması için öngörülmüştü; betikle erişilemediği için künye Diyanet yayınındaki numarayla, ör. T1954, B69, doğrulandı). Yerel arşivde
(`D:\ihtisas`) arandı; kitap sayfası numarası dosyadaki `<!-- s. N -->` işaretinden okundu (işaretler sayfa başını gösterir).

| Madde | Satır | Metin ve Fransızca | Karşılaştırıldığı |
|---|---|---|---|
| `b-imanin-sartlari` | 6 (+ Âmentü'den kısa Arapça terimler) | Camiye Gidiyorum 1 s. 87–89 | Temel Dinî Bilgiler s. 26–27, Diyanet İslam İlmihali (İman Esasları) |
| `b-islamin-sartlari` | 5 | Camiye Gidiyorum 1 s. 22–23 | Temel Dinî Bilgiler s. 79–80, İslam İlmihali (İslâm'ın Şartları) |
| `b-abdestin-farzlari` | 4 | Camiye Gidiyorum 2 s. 252 | Temel Dinî Bilgiler s. 87–88, İlmihal c. 1 s. 197 |
| `b-guslun-farzlari` | 3 | Camiye Gidiyorum 2 s. 252 | Temel Dinî Bilgiler s. 92–93, İlmihal c. 1 s. 206 |
| `b-teyemmumun-farzlari` | 2 | Camiye Gidiyorum 2 s. 252 | Temel Dinî Bilgiler s. 96, Dînî Kavramlar Sözlüğü s. 660, İlmihal c. 1 s. 209 |
| `b-namazin-farzlari` | 12 (6 şart + 6 rükün) | Camiye Gidiyorum 2 s. 253 | Temel Dinî Bilgiler s. 106–107, İlmihal c. 1 s. 227 |
| `b-ulul-azm` | 5 | Camiye Gidiyorum 1 s. 151 | Dînî Kavramlar Sözlüğü s. 668 |
| `b-dort-halife` | 4 | Dînî Kavramlar Sözlüğü s. 269 (Fransızca yazım: Camiye Gidiyorum 2 Fr. s. 123) | İlmihal c. 2 s. 278 |
| `b-secme-hadisler` | 5 / 9 | Camiye Gidiyorum 2 s. 238 | Hadislerle İslam c. 2, 3, 6; Serlevha Hadisler; Riyâzü's-Sâlihîn c. 1 |
| `b-kuran-fazileti-hadisleri` | 3 / 7 | Temel Dinî Bilgiler s. 47 (Fransızca: Camiye Gidiyorum 1 s. 67) | Hadislerle İslam c. 1 ve 7; Serlevha Hadisler; Riyâzü's-Sâlihîn c. 2 |

Notlar: (a) Teyemmümün farzı Camiye Gidiyorum'da iki, İlmihalde üç sayılabilir; sayfa notu bunu söyler. (b) İslâm'ın şartlarında kitap
sırası (kelime-i şehâdet, namaz, oruç, zekât, hac) korundu; İlmihal Müslim hadisinin sırasını izler, sayfa notu bunu belirtir.
(c) Hadiste kitabın cümlesi ile Diyanet yayınındaki cümle arasındaki ifade farkı (anlam aynı) `dogrulama.fark` alanında ve hoca inceleme
sayfasında yazılıdır; çocuğun sayfasında kitabın cümlesi (ezber cümlesi) durur. Kaynak zinciri hadis meâlini Hadislerle İslam /
Riyâzü's-Sâlihîn'den istediği için Türkçe sayfada, cümle Diyanet çevirisinden farklıysa altında «Diyanet çevirisi: «…» (cilt, başlık,
hadis no)» satırı çizilir (`diyanetCevirisi()`, `src/lib/ezber/bilgi-metni.ts`; yalnız noktalama farkı olan cümlede çizilmez; diğer
dillerde Türkçe çeviri gösterilmez). Karar 24 Ekim 2026 gece, Rıdvan'ın verdiği tam yetkiyle; test `tests/ezber-bilgi.test.mjs` ve
`tests/egitim/bilgi.spec.mjs`. (d) Hadis #6 («kolaylaştırın…») sayfada «Buhârî, İlim, 11» künyesiyle
yazılır: Diyanet bu Enes rivayetini Buhârî'ye bağlar; kitap Müslim'i de anar, inceleme sayfası bunu işaretler.

### Sayfaya alınmayanlar (doğrulanamadı) ve gerekçeleri

Kitaptaki hadislerden **sekizi sayfada yok**; ikisinde de plan öğrencinin seçip ezberlemesini ister (seçme hadisler: dokuzdan üçü;
Kur'an fazileti: yediden beşi), bu yüzden katalog adındaki sayı plan hedefidir, sayfadaki liste doğrulanan hadislerdir ve her sayfa
bunu notla söyler (ör. «Kitapta dokuz hadis vardır; öğrenci üçünü seçip ezberler. Bu sayfada kaynağı doğrulanan beşi yer alır.»).

- **Seçme hadisler** (Camiye Gidiyorum 2 s. 238; 4 alınmadı): «İslâm güzel ahlâktır» (yalnız İlmihal dipnotunda, Kenzü'l-Ummâl;
  izin verilen hadis yayınlarında yok); «öfkelenme» hadisi (kitap «üç defa» der, Diyanet metni «birkaç kere»); «Güzel bir şeye aracılık
  eden…» (Diyanet'te tek cümlelik farklı bir alıntı); «Allah, sizden biriniz iş yaptığında…» (Taberânî; Diyanet hadis yayınlarında yok,
  yalnız farklı ifadeyle bir kitapta alıntı).
- **Kur'an okumanın fazileti** (Temel Dinî Bilgiler s. 47; 4 alınmadı): «Bir âyet dinlerse…» (Diyanet hadis yayınlarında bulunamadı);
  «…onunla amel ederse (taç)» (Ebû Dâvûd, Vitr 14: Diyanet'te çok farklı ifadeyle, birebir doğrulanamadı); «Sabahleyin evden çıkıp…
  (yüz rekât)» (bulunamadı; benzeri başka bir hadis); «…ezberlerse (on kişiye şefaat)» (İbn Mâce, Sünne 16: Diyanet'te kısaltılmış çeviri,
  kitabın şartı yok). Ayrıntılı gerekçe her dosyada `alinmayan` alanında ve inceleme sayfasında.
- Bunlar doğrulanınca (ör. Hadislerle İslam'da karşılığı bulunursa) ilgili `maddeler` dizisine eklenir; sayfa notundaki sayı güncellenir.
- Hadislerin Arapça metni bu dilimde yoktur (sonraki dilimin işi); Arapça yalnız
  Âmentü'den alınan altı kısa terimdedir ve `ar` rolüyle kaynağı gösterilir.

### Yayın

- **24 Ekim 2026 23:17 (CEST) YAYINDA.** Commit `17f91411`, Hosting `ulucamii-egitim` (383 dosya), Pages run 40133866103 success, `egitim:canli` 41/41. Kayıt: `docs/YAYIN-KAYITLARI.md` «24 Ekim 2026 (8)».

### Hoca incelemesi (onay bekliyor)

- **İnceleme sayfası:** `docs/ezber-bilgi-inceleme/ezber-bilgi-inceleme.html` ve `.pdf` (`npm run ezber:bilgi`; dua incelemesiyle
  `docs/ezber-metin-inceleme/` aynı düzen). Her madde beş dilde, kaynak künyesiyle, hadislerde Diyanet karşılığı ve ifade farkıyla,
  «ALINMAYANLAR» tablosuyla ve onay kutularıyla yazdırılabilir.
- **Onay:** `node scripts/ezber-bilgi.mjs --onayla hepsi` (yalnız Türkçe) ya da `--onayla b-ulul-azm,b-dort-halife --kapsam tr,fr`;
  dosyaya `onay: {tarih, kapsam}` yazar, ardından `npm run egitim:yayinla`. En, nl, de, ana dili konuşan biri okuyup onaylamadıkça
  kapsama yazılmaz. **Şu an hiçbir madde onaylı değildir; sayfalar «hoca incelemesi bekleniyor» der.**

### Testler

- `tests/ezber-bilgi.test.mjs` (14 test): şema, bayrak ⇔ dosya eşleşmesi, kaynak kuralları (≥ 2 kaynak, metin + karşılaştırma, sayfa/bölüm),
  beş dilin doluluğu, en/nl/de taslak sayılması, grup bütünlüğü, Arapça terimlerin Ulu Nesih kümesinde olması, hadiste künye ve Diyanet
  karşılığı, `dilDurumu`, `gosterimGruplari` numaralaması, `siralamaVar`, kitaptaki sayılar, kişisel veri/telefon/yasak simge taraması,
  `--onayla` reddi.
- `tests/egitim/bilgi.spec.mjs` (29 senaryo × masaüstü + telefon): beş dilde liste, kaynak ve notlar; 360 px'te yatay kaydırma yok;
  açık ve koyu temada axe 0; CSP ihlali 0; Arapça sağdan sola ve A− / A+; JavaScript kapalıyken liste okunur; kapalı depolama; «Gizle ve söyle»
  (düğme boyutu ≥ 44 px), «Sırala» (↑ ↓, Alt + ok, kontrol, iki gruplu bölüm seçimi), «Nasıl geçti?» kaydı, klavye ile sekmeler.
- `scripts/egitim-canli-denetim.mjs` bilgi maddelerini de site haritasında bekler ve bir bilgi sayfasını (liste, kaynak, çalışma
  bölümü, «Göster», CSP ve konsol temiz) ile Fransızca künyede bölünmez boşluğu denetler.

## Kitap kaynaklı dua metinleri ve giriş panosu dokunma hedefi (24 Ekim 2026)

Dayanak: Rıdvan'ın 24 Ekim 2026 «ezber kilimi yayını konusunda herşeyi onaylıyorum, bütün yetki ve karar sende» talimatı; iş, ana
oturumun «metni olmayan dua maddeleri için ikinci kaynak yolu + 360 px karo boyu» görevidir. İki iş, aynı yayın.

### 1. Portalda olmayan on dua için metin sayfası (Diyanet'in basılı kitaplarından)

- **Neden yeni yol:** `namaz.diyanet.gov.tr` portalı yalnız namaz dualarını taşır (`scripts/ezber-dua-cek.mjs`); Kelime-i Tevhid ve Şehâdet,
  Eûzü–Besmele, tekbir, tesmî–tahmîd, selâm, âmentü, teşrik tekbiri, telbiye ve yemek duası portalda yoktur. Bunların metni, yerelde
  Markdown olarak duran Diyanet (DİB/DİTİB/TDV) kitaplarından alınır (`scripts/ezber-dua-kitap.mjs`, tanımlar `scripts/ezber-dua-tanim.mjs`
  içinde `kitap` alanı). Telifli kitap metni depoya girmez: depoya yalnız maddenin kendi metni, künyesi ve iskelet özetleri girer.
- **Kural (değişmedi, sertleştirildi): iki bağımsız Diyanet kaynağı.** Arapça birincil kaynaktan harekeli alınır; her bölümün harf iskeleti
  (`ezber-iskelet.mjs`: hareke ve işaretler atılır, elif ve hemze atılır) en az bir ikinci Diyanet kaynağındaki iskeletle **birebir** aynı olmalıdır.
  Fark varsa ya giderilir ya da gerekçesiyle `fark` alanına yazılır; ama gerekçeli fark tek başına doğrulama sayılmaz: her bölümü iskeleti
  aynı çıkan bir ikinci kaynak da doğrulamalıdır. İkinci kaynağı olmayan ya da iskeleti ayrışan madde **yazılmaz** (aşağıda atlananlar).
- **Anlam ve okunuş ezberden yazılmaz:** Türkçe anlam, Fransızca anlam ve okunuş kaynak kitaptan sözcüğü sözcüğüne alınır; tabloya yazılan her
  dize, her çalıştırmada kaynakta (tırnak türü, `*`, dipnot imi ve sayfa yorumu farkı yok sayılarak) aynen aranır, bulunamazsa betik durur.
  Künyedeki sayfa numarası kaynaktaki sayfa işaretinden gelir. Okunuş yalnız Diyanet kaynağında varsa yazılır (hoca onaylayana kadar sayfada hiç görünmez).
- **Fransızca anlam:** yalnız DİTİB'in resmî Fransızca yayını (*Camiye Gidiyorum 1 – Je vais à la mosquée 1*) karşılığı olan üç maddede var
  (Kelime-i Tevhid, Kelime-i Şehâdet, Âmentü); Temel Dinî Bilgiler'in Fransızcası resmî değil («çalışma çevirisi») olduğu için hiçbir yerde
  kullanılmadı. Resmî Fransızcası olmayan maddede Fransızca sayfa «Le sens dans cette langue sera bientôt ajouté» der; çevirisi uydurulmadı.
  `sayfaMeali` (`src/lib/ezber/madde-metni.ts`) FR meâl kabulüne «Je vais à la mosquée» künyesini ekledi (Chiadmi / Hamidullah önceki gibi).
- **Hepsi `onay: null`:** metin sayfada «Diyanet kaynaklarından alınmıştır. Hoca incelemesi bekleniyor» notuyla görünür, okunuş gizlidir.
  `--onayla` çalıştırılmadı. Hoca inceleme sayfası yenilendi (`npm run ezber:inceleme` → `docs/ezber-metin-inceleme/`, 21 dua).
- **Ses:** hiçbir ses eklenmedi, `ses` alanı değişmedi, yeni TTS üretilmedi. Kelime-i Tevhid ve Şehâdet'in iki «Yapay ses» etiketi aynen duruyor;
  Eûzü–Besmele'nin Diyanet âyet sesi duruyor. Diyanet kaydı olmayan yedi madde için katalogda yeni `metinli: true` işareti var
  (`calismaSayfasiVar` bunu da sayar; şema yalnız `true` kabul eder; test işaret ⇔ metin dosyası eşleşmesini ve sesli/Kur'anlı maddede işaret
  olmamasını sınar). Bu sayfalarda ses oynatıcısı yoktur: «Henüz dinleme kaydı yok» bölümü ve «Dinle» adımı «Yakında» durur; kartın kare kod
  yönergesi «Çalışmak için…» (dinleme sözü verilmez).

**Maddeler ve kaynakları** (Arapça birincil → harf iskeleti karşılaştırılan ikinci kaynaklar; anlam/okunuş):

| Madde | Arapça (birincil) | İkinci kaynak(lar) | Anlam / okunuş / FR |
|---|---|---|---|
| Eûzü–Besmele (`d-euzu-besmele`) | Diyanet mushafı (`kuran.diyanet.gov.tr/mushaf`): Bakara 2/67 (15–16. kelime) + Nahl 16/98 (6–8. kelime) + Fâtiha 1/1 | Tecrid-i Sarih 8. cilt, Kitâbü'l-Edeb · TDB s. 325 · CG1 s. 20 | TR: Riyâzü's-Sâlihîn 1. cilt «Sabır» 46. hadis + CG1 s. 20; okunuş: TDV İslâm Ansiklopedisi «İstiâze», «Besmele»; FR yok |
| Kelime-i Tevhid (`d-kelime-i-tevhid`) | TDB s. 25 | CG2 s. 6 · İslam İlmihali IV. İman «Kelime-i Tevhid» | TR+okunuş: TDB s. 25; FR: CG1 (Je vais à la mosquée 1) s. 15 |
| Kelime-i Şehâdet (`d-kelime-i-sehadet`) | TDB s. 25–26 | CG2 s. 6 · Elif-Bâ s. 39 «Âmentü Duâsı» | TR: TDB s. 26; okunuş: TDB s. 25; FR: CG1 s. 18 |
| Tekbir (`d-tekbir`) | Elif-Bâ s. 38 «Namaz içindeki tesbihat» | TDB s. 127 «Namaz sonrası tesbihat» | TR: Elif-Bâ s. 38; okunuş: TDB s. 127; FR yok |
| Tesmî–Tahmîd (`d-tesmi-tahmid`) | Elif-Bâ s. 38 | Hadislerle İslam 2. cilt «İmamlık: Cemaate Kılavuz Olmak» | TR: Elif-Bâ s. 38; okunuş ve FR yok |
| Selâm (`d-selam`) | Elif-Bâ s. 38 | Tecrid-i Sarih 2. cilt, Kitâbü'l-Ezân | TR: Elif-Bâ s. 38; okunuş ve FR yok |
| Âmentü (`d-amentu`) | Elif-Bâ s. 39 «Âmentü Duâsı» | TDB s. 27 «Âmentü» · CG1 s. 124 | TR: Elif-Bâ s. 39; FR: CG1 s. 124; okunuş yok |
| Teşrik tekbiri (`d-tesrik-tekbiri`) | İslam İlmihali VIII. Namaz «Teşrik Tekbirleri» | Hac İlmihali s. 238 · İslam İlmihali XII. Kurban | TR: Dinî Kavramlar Sözlüğü «Tekbir» s. 643; okunuş: İslam İlmihali VIII; FR yok |
| Telbiye (`d-telbiye`) | Hac İlmihali s. 51 | İslam İlmihali XI. Hac «Telbiye» | TR: Hac İlmihali s. 51; okunuş: İslam İlmihali XI; FR yok |
| Yemek duası (`d-yemek-duasi`) | Hadislerle İslam 6. cilt «Hz. Peygamber'in Yemek Âdâbı…» (Ebû Saîd el-Hudrî; Ebû Dâvûd Et'ıme 52, Tirmizî Deavât 55) | Tecrid-i Sarih 8. cilt, Kitâbü'l-Et'ime | TR: Hadislerle İslam 6; okunuş ve FR yok |

(TDB = Temel Dinî Bilgiler, S. Yazıcı, DİB Yay. 301; CG1/CG2 = Camiye Gidiyorum 1/2, DİTİB; yerel arşiv `D:/ulu-camii-kuran-kursu/veri/kitaplar`,
`D:/ihtisas`.) Her maddenin künyesi (kitap, bölüm, sayfa) `kaynak.ar` ve `meal.tr.kaynak` alanlarında ve sayfada görünür.

**Atlananlar (5) ve gerekçeleri** (kural: ikinci kaynakta iskelet eşit değilse ya da ikinci kaynak yoksa yazılmaz):

- **Kadir gecesi duası (`d-kadir-gecesi-duasi`):** ilmihaldeki metin «كَرِيمٌ» sözcüğünü taşıyor; Tecrid-i Sarih 5. cilt ve İbn Mâce'deki rivayette bu sözcük
  yok → harf iskeletleri ayrışıyor. İki Diyanet yayınından hangisinin metninin esas alınacağı kaynak/hoca kararıdır; tahminle seçilmedi.
- **Tesbihat (`d-tesbihat`):** namaz sonrası tesbihatın Elif-Bâ'daki kısa dizisi için bağımsız ikinci bir Diyanet metni doğrulanamadı.
- **Abdest, namaz ve oruç niyeti (`d-abdest-niyeti`, `d-namaz-niyeti`, `d-oruc-niyeti`):** yerel Diyanet arşivinde Arapça yazılı niyet metni
  bulunamadı. Arapça uydurulmadı.

**Dikkat edilecekler (hoca onayı için):**

- `d-tesrik-tekbiri` Türkçe anlamı kaynakta «…her türlü övgü Allah' içindir» diye basılmıştır (Dinî Kavramlar Sözlüğü s. 643; olası yazım kusuru).
  Aynen alındı; onay öncesi karar hocanındır (inceleme sayfasında not var).
- `d-euzu-besmele` Arapçası tek bir yerde bu sırayla geçmez: Diyanet mushafından üç âyetten sözcük sözcük birleştirildi (kaynak satırında âyet ve
  kelime numaraları yazılı); harf iskeleti üç ayrı Diyanet kitabıyla birebir.
- `d-yemek-duasi` Arapçası Hadislerle İslam'daki rivayetten alındı: «الَّذِى» yazımı Diyanet'in yazımıdır (kaynak yazımı korundu).
- Motor düzeltmesi (yazım sırasında bulundu): kelime sonundaki elif iskelette atıldığı için bir aralığın son sözcüğü «دَرْسًا» gibi biterken elifini
  kaybediyordu; aralık artık bitişik harf ve işaretleri de alır (`arapcaAralik`). Gerçek on madde bu düzeltmeden etkilenmedi (dosyalar karşılaştırıldı).

**Dosyalar:** `scripts/ezber-dua-kitap.mjs` (yeni motor), `scripts/ezber-dua-tanim.mjs` (10 `kitap` tanımı), `scripts/ezber-dua-cek.mjs`,
`scripts/ezber-dua-iskelet.mjs` (ikinci kaynak fixtürü, önceki dualar dâhil toplam 28 kayıt), `scripts/ezber-metin-cek.mjs` (`--yalniz-ayet`), `scripts/ezber-inceleme.mjs`,
`scripts/ezber-seviye-tablosu.mjs`, `scripts/egitim-canli-denetim.mjs`, `src/data/ezber/metin/d-{…}.json` (10), `src/data/ezber/katalog.json` ve
`katalog.schema.json` (`metinli`), `src/lib/ezber/katalog.ts`, `src/lib/ezber/madde-metni.ts`, `egitim/src/i18n/madde.ts`, `egitim/src/i18n/kart.ts`,
`egitim/src/pages/[dil]/calis/[id].astro`, `tests/fixtures/ezber-dua-ikinci-kaynak.json`.
**Testler:** yeni `tests/ezber-dua-kitap.test.mjs` (17 test; sentetik, dinî içeriği olmayan kaynaklarla: baştaki hemze, kelime ortasından kesme,
sayfa aralığı, sözcüğü sözcüğüne doğrulama, ikinci kaynak yokluğu/ayrışması); `tests/ezber-madde-metni.test.mjs` (kitap duasında Diyanet adresi, her bölüm
iskeleti eşit ikinci kaynakla doğrulanmış, FR yalnız resmî Fransızca), `tests/ezber-katalog.test.mjs` (`metinli`), `tests/egitim/calisma.spec.mjs`,
`tests/egitim/barindirma.test.mjs` (yeni sayfalar CSP denetiminde).
**Basılı kart:** otomatik; yazdırma düğmesi Arapça metni olan her sayfada çıkar. 10 madde × 5 dil = 50 kart üretildi, `ezber-kart-dogrula.py` 50 PDF,
hatalı 0 (piksel görsel yok, yazı tipleri gömülü, kare kod kanonik adrese gidiyor). Önceki «Arapça metni olmayan maddede kart yok» notu bu on madde için
geçersizdir (kartı olmayan maddeler artık bilgi maddeleri ve yukarıdaki beş atlanan duadır). 324 PDF'lik yerel paket yeniden üretilmedi.

### 2. Giriş panosu karoları 24 px (WCAG 2.5.8)

- **Bulgu:** sayfa kenar boşluğu 1 rem iken 13 sütunlu panonun karoları 360 px'te 22,9 px (372 px'ten itibaren 24 px+) idi.
- **Çözüm** (`egitim/src/styles/cini.css`, `@media (max-width: 29.99rem)`): dar ekranda pano kenar boşluğunun yarısına (0,5 rem) kadar yayılır;
  karo = (içerik genişliği + 1 rem − 28 px) / 13 → 360 px'te 24,3 · 375 px'te 25,5 · 390 px'te 26,6 · 412 px'te 28,3 px. İçerik genişliği `100vw`
  değil kapsayıcı birimiyle (`cqw`, `.giris .icerik` kapsayıcı) alınır: kaydırma çubuklu dar masaüstü penceresinde `100vw` sayfayı yatay
  taşırırdı; `cqw` yoksa önceki ölçü geçerli kalır (`@supports`). Geniş ekranda görünüm değişmedi.
- **Sınır:** 356 px'in altında 13 sütun 24 px'e sığmaz (320 px'te 21 px); her karo alttaki listedeki bir maddeye gider (WCAG 2.5.8 «eşdeğer
  bağlantı» istisnası).
- **Test:** yeni `tests/egitim/pano-hedef.spec.mjs`: 360/375/390/412 px × beş dilde her madde karosu ≥ 24 × 24 px, pano görünümde, yatay taşma yok;
  320 px'te taşma yok ve her karo bir liste maddesine gider. Kural gerçekten sınıyor: eski CSS ile 360 px sınaması 22,92 ile **düşüyor**, yeni
  CSS ile geçiyor. `yeniden-akis.spec.mjs` (320/360/390, beş dil) geçti. Daha önceki «bilinçli bırakılanlar» notu güncellendi.

### Doğrulama ve yayın (25 Ekim 2026 00:14 CEST)

- **Rebase:** bilgi oturumunun `17f91411` + `a63c02bd` commit'lerinin üzerine; `package.json` (`test:ezber`), `egitim-canli-denetim.mjs`, `katalog.ts`,
  `barindirma.test.mjs`, `calisma.spec.mjs` çakışmaları iki taraf korunarak çözüldü; sayfa koşulu artık `ses || kuran || bilgiMetni || metinli`.
- **Kapılar (rebase sonrası):** `check` 0 hata / 0 uyarı (463 dosya); `test:ezber` 159/159; ana site 1952 sayfa; `egitim:build` 387 sayfa, 0 hata; `test:egitim`
  15/15 birim + **347 geçti / 13 atlama / 0 başarısız**; `test:kurallar` 54, `test:veli-eposta` 58, `test:oto-kaydet` 14, `test:ogrenme` 13. `test:web` 839 geçti /
  120 atlama / 1 başarısız: `seviye-testi.spec.mjs:729` konfeti animasyonu, yük altında zamanlama (tek başına iki projede 12/12 geçti; rebase öncesi tam koşu 840/0).
- **Test bakımı (gevşetme yok):** `d-euzu-besmele` artık metinli olduğu için «Arapça metni olmayan sayfada kart/kip yok» senaryoları (`kart.spec`, `kip.spec`) sayfası olan
  ama metin dosyası olmayan maddeleri veriden hesaplar (bugün küme boş) ve Eûzü–Besmele ile Tekbir'de kart, kip ve A−/A+'nın VAR olduğunu doğrular;
  `calisma.spec` durum satırı `.calisma-durum` ile seçilir (kip noktaları da `data-durum` taşır); `sessiz-metin.spec` A−/A+ ölçümü `expect.poll` ile bekler.
- **Yayın:** commit `fe1ba765`; egitim Hosting 418 dosya (388 yeni); Pages run 40137688909 success; `egitim:canli` 41/41; `/tr` ve `/fr/calis/d-amentu/`, `d-tekbir/` 200.
  Kayıt: `docs/YAYIN-KAYITLARI.md` «24 Ekim 2026 (9)».
- **Hoca onayı bekleyen on metin:** `docs/ezber-metin-inceleme/ezber-metin-inceleme.pdf` (21 dua). Onay: `node scripts/ezber-dua-cek.mjs --onayla <id|hepsi>`, sonra `npm run egitim:yayinla`.

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
   okunuş kontrolü tamamlanmadan metinleri çalışma sayfalarına ekleme. (25 Ekim 2026: portalda olmayan on dua metni kitaplardan eklendi; kalan: Kadir gecesi duası, Tesbihat,
   üç niyet için kaynak kararı, on metnin hoca onayı, Diyanet ses kayıtları.)
3. ~~Kademeli gizleme, sıralama/eşleştirme/eksik kelime ve cihazda ilerleme.~~ 24 Ekim 2026'da yayımlandı (2c, 2d, 2e: «Anlamla eşleştir», Adım 1 «senin sıran», basılı kart). Kalan: NL meâl ana dilli/hoca onayı (onaylanınca NL'de «Anlamla eşleştir» kendiliğinden açılır), basılı kartın fiziksel yazıcıda ve Safari/Firefox'ta denenmesi, duyuru.
4. Faz 2'nin asıl madde içerikleri tamamlanınca duyuru; hesaplar/belgeler Faz 3, diğer bölümlerin taşınması Faz 4.
