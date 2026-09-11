# Codex CLI tasarım altyapısı ve geliştirme planı

## Yönetici özeti

Bu proje için yeni bir ön yüz çatısı kurmaya gerek yok. Mevcut temel, gerçek bir dernek sitesi için yeterince güçlü: Astro 7.3.2 ile statik üretim, Preact 10.29.8 ile gerektiğinde etkileşimli adacıklar, Tailwind CSS 4.3.3 ile CSS tabanlı tasarım değişkenleri, Sharp 0.35.4 ile görsel dönüştürme, Embla 8.6.0 ile erişilebilir vitrin ve Playwright 1.63.0 ile tarayıcı doğrulaması birlikte çalışıyor.

Codex CLI bu temelin üzerinde kaynak kodu inceleyebilir, Astro/Preact/Tailwind bileşenleri yazabilir, yerel görselleri dönüştürebilir, tarayıcıda çalışan siteyi ölçebilir, erişilebilirlik denetimi yapabilir ve değişikliği kalite kapısından geçirebilir. OpenAI’nin güncel CLI belgeleri de bu çalışma biçimini; proje klasöründe çalışma, kabuk komutları, beceriler, MCP bağlantıları, tarayıcı ve görsel üretimiyle genişletme olarak tanımlıyor ([Codex CLI](https://developers.openai.com/codex/cli/), [beceriler](https://developers.openai.com/codex/skills/), [MCP](https://developers.openai.com/codex/mcp/)).

En yüksek getirili ekleme yeni bir UI kütüphanesi değil, dört parçalı bir tasarım işletim katmanıdır:

1. Tek bir `DESIGN.md` ve sayfa yüzeyi brifleriyle renk, tipografi, boşluk, hareket ve bileşen kararlarını yazılı hâle getirmek.
2. Playwright’ın `toHaveScreenshot()` özelliğiyle masaüstü, telefon, açık tema ve koyu tema için sürüm kontrollü piksel baselines’ı eklemek.
3. Sharp tabanlı bir medya manifesti ve görsel lint’iyle ölçü, oran, dosya boyutu, format, alt metin ve tekrarları denetlemek.
4. Codex’in bu akışı tek komutla çalıştıracağı küçük bir `design:check` kalite kapısı oluşturmak.

Canva ve Figma bağlantıları sistemde iz bırakmış ve bazı eklenti paketleri kurulu, ancak bu proje için ilgili Claude eklentileri kapalı; gerçek tasarım çağrısı bu incelemede yapılmadı. Bu yüzden bunları “hazır ve denenmiş” saymıyorum. Önce birini seçip tek bir uçtan uca deneme yapmak, iki tasarım aracını birden açmaktan daha sağlıklı olur.

## İnceleme yöntemi ve sınır

İlk inceleme salt-okunur yapıldı. Proje kodu, canlı CMS, Firebase, GitHub ve e-posta hesaplarında değişiklik yapılmadı. Şu kontroller çalıştırıldı:

- `codex --version`, `codex login status`, `codex mcp list --json`
- `codex doctor`, `codex features list`, `codex plugin list`
- `npm run codex:kontrol`
- `npm run agy:kontrol`
- `npm run dogrula:codex`
- Paket, dosya ağacı, font, görsel, tarayıcı ve test araması
- Güncel resmî Astro, Tailwind CSS, Playwright, Sharp ve OpenAI belgeleri

## Mevcut araç ve proje envanteri

### Komut satırı ve çalışma ortamı

| Katman | Canlı bulgu | Tasarım açısından anlamı |
|---|---|---|
| Codex CLI | `0.154.0`, ChatGPT ile giriş yapılmış | Kod, dosya, tarayıcı ve kalite kapısı tek oturumdan yürütülebilir. |
| Codex modeli | Proje doktorunda `gpt-5.6-sol`, çaba `high` | Tasarım sistemi, refaktör ve görsel hata çözümünde yeterli ana çalışma modeli. |
| Anti-Gravity CLI | `agy 1.2.1` | Yüksek hacimli afiş, OCR, medya varyantı ve mekanik işlerde ikinci üretim hattı. |
| Node/npm | Node `24.19.0`, npm `11.17.0` | Astro, Sharp ve Playwright araçları güncel çalışma ortamında. |
| Python | `3.14.7` | Mevcut belge, medya ve rapor betikleri çalıştırılabilir. |
| ffmpeg | PATH üzerinde mevcut | Video/GIF kareleme ve sesli medya iş akışlarında kullanılabilir. |
| disk | Yaklaşık 109 GiB boş alan | Baseline, önizleme ve medya üretimi için yeterli; rollouts ayrıca 1,32 GiB tutuyor. |

Codex’in kararlı özellik listesinde `image_generation`, `browser_use`, `computer_use`, `hooks`, `plugins`, `memories`, `multi_agent`, `view_image` ve `fast_mode` açık görünüyor. Bu özellikler tasarım işini yalnızca metin üretiminden çıkarıp dosyaya, tarayıcıya ve görsel denetime taşıyor.

### Site yığını

| Paket/katman | Kurulu sürüm | Kullanım |
|---|---:|---|
| Astro | 7.3.2 | Statik rotalar, içerik koleksiyonları, sitemap ve yerel görsel servisi |
| Preact | 10.29.8 | Namaz vakitleri, portal ve etkileşimli küçük yüzeyler |
| Tailwind CSS | 4.3.3 | `@theme` ile renk, yazı tipi, kırılım noktası, gölge ve hareket değişkenleri |
| Sharp | 0.35.4 | JPEG/PNG/WebP/AVIF/GIF üretimi, yeniden boyutlandırma, kırpma ve birleştirme |
| Embla Carousel | 8.6.0 | Ana sayfa vitrin slaytı ve küçük ekran kaydırma davranışı |
| Firebase | 12.18.0 | Portal ve emülatör tabanlı veri akışları |
| Playwright Test | 1.63.0 | Masaüstü/mobil uçtan uca test, klavye ve tema emülasyonu |
| `@axe-core/playwright` | 4.13.0 | WCAG odaklı erişilebilirlik kontrolleri |
| `@playwright/mcp` | 0.0.80 | Yerel tarayıcı MCP köprüsü |

Astro yapılandırması `output: 'static'`, üç dil (`tr`, `fr`, `en`), `@astrojs/preact`, sitemap ve Sharp tabanlı görsel servisini kullanıyor. Astro’nun resmî belgelerine göre yerel görsel servisi statik derleme sırasında görselleri dönüştürebilir; `<Image />` ve `<Picture />` ile responsive çıktılar üretilebilir ([Astro görselleri](https://docs.astro.build/en/guides/images/), [Astro Image Service API](https://docs.astro.build/en/reference/image-service-reference/)).

### Mevcut tasarım katmanı

- `src/styles/global.css` içinde 66 satırlık tema değişkeni ve temel bileşen tanımı bulunuyor.
- Renk ailesi kiremit, okra, adaçayı, ceviz, kâğıt, İznik mavisi ve mürekkep ekseninde kurulmuş.
- Lora, Work Sans, IBM Plex Mono ve Amiri yerel olarak yükleniyor; web fontu için dış ağ çağrısı gerekmiyor.
- Açık/koyu tema hem sistem tercihini hem de `data-theme` seçimini ele alıyor.
- `prefers-reduced-motion` kuralları global stil, ihtida adımları, vitrin ve formlarda bulunuyor.
- Yerel `.woff2`, `.ttf` ve `.otf` dosyalarının yanı sıra 619 medya dosyası var
  (458 raster, 161 diğer biçim).
- `docs/afisler` altında 132 dosyalık üretim ve kaynak arşivi bulunuyor.
- `src/components/HeroSlayt.astro`, `GundemVitrini.astro` ve `AnaSayfaAkisi.astro` ana sayfanın görsel omurgasını oluşturuyor.
- `src/scripts/gundem-vitrini.ts`, Embla autoplay, klavye, dokunma, odak, `inert`, `aria-hidden`, canlı bölge ve azaltılmış hareket davranışını yönetiyor.

Tailwind CSS 4’ün resmî modeli de tam olarak bu kullanımı destekliyor: `@theme` içindeki değişkenler hem CSS değişkeni hem de utility sınıfı üretir; renk, font, text scale, spacing, radius, shadow, container ve animation namespace’leri tasarım token’ı olarak paylaşılabilir ([Tailwind theme variables](https://tailwindcss.com/docs/theme)). Mevcut `global.css` bu yönde doğru bir başlangıç, fakat token’lar henüz ayrı bir tasarım sözleşmesi dosyasında ve otomatik lint raporunda toplanmış değil.

### Doğrulama katmanı

Projedeki `package.json` tasarım ve yayın kalitesini tek akışta çalıştıran şu kapıları içeriyor:

- `npm run check` — Astro tip ve şablon denetimi
- `npm run build` — 870 statik sayfalık üretim
- `npm run test:web` — Playwright masaüstü ve Pixel 7 profilleri
- `npm run test:kurallar` — yalnız `demo-ulucamii` Firestore emülatörü
- `npm run dogrula:codex` — toplu kalite kapısı
- `npm run onizle` — derlenmiş siteyi 4399 portunda görsel inceleme için açma
- `npm run test:anasayfa`, `npm run olc` — ana sayfa ve web vitals yardımcıları

Mevcut web testleri DOM, ARIA, klavye, tema, hareket, taşma, dil, slider yaşam döngüsü ve içerik davranışını iyi kapsıyor. Buna karşın test ağacında sürüm kontrollü `*-snapshots` veya golden görsel klasörü bulunmadı; yani piksel seviyesinde “önce/sonra” koruması henüz yok.

## Codex CLI ile bugün yapabileceklerimiz

### Koddan tasarıma

Codex, proje klasöründen başlayıp mevcut token’ları, bileşenleri ve rotaları okuyarak:

- Astro sayfası veya Preact adacığı tasarlayabilir ve uygulayabilir.
- Tailwind `@theme` değişkenlerini kullanarak yeni bir yüzeyin renk, tipografi ve responsive davranışını kurabilir.
- Var olan kimliği koruyarak hero, slider, kart, form, portal, modal ve boş durumlarını yeniden düzenleyebilir.
- TR/FR/EN rotalarını aynı bileşen sözleşmesiyle güncelleyebilir.
- `npm run dogrula:codex`, Playwright ve Axe sonuçlarına göre tek seferde düzeltme yapabilir.
- `codex exec` ile aynı tasarım kontrolünü tekrarlanabilir bir boru hattına dönüştürebilir; resmî CLI belgeleri bu modu otomasyon ve pipeline çalışmaları için tanımlıyor ([Codex CLI belgeleri](https://developers.openai.com/codex/cli/)).

### Görsel üretim ve medya

- Yerel SVG, CSS ve HTML ile vektörel arayüz parçaları oluşturabilir.
- ImageGen aracıyla özgün bitmap görsel üretebilir veya düzenleyebilir; resmî OpenAI model kataloğunda GPT Image ailesi görsel üretim ve düzenleme için listeleniyor ([GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2)).
- Sharp ile afiş ve hero görsellerini 4:5, 9:16, 16:9, WebP ve AVIF varyantlarına dönüştürebilir. Sharp belgeleri JPEG, PNG, WebP, GIF, AVIF, TIFF ve SVG giriş/çıkışlarını, kırpma, birleştirme ve renk profili işlemlerini desteklediğini belirtiyor ([Sharp](https://sharp.pixelplumbing.com/)).
- Higgsfield medya becerisiyle yetkili açık tarayıcı oturumunda sosyal görsel/video üretim sürecini yürütebilir. Bu beceri parola/çerez saklamaz; üretim çıktısının ölçü, oran, uzantı ve taşma kontrolünü ister.
- `ffmpeg` ile video kareleri, GIF önizlemeleri ve ses/video dönüştürmeleri yapılabilir.
- PDF ve belge eklentileriyle afiş, dilekçe, kayıt defteri ve yazdırılabilir materyal üretilebilir.

### Tarayıcıda tasarım incelemesi

`cua_repl`, `node_repl` ve `ulucamii_browser` bağlantılarıyla yerel önizleme tarayıcıda açılabilir, DOM/ARIA ölçülebilir, ekran görüntüsü alınabilir ve mobil/masaüstü karşılaştırması yapılabilir. `npm run codex:kontrol`, yerel Playwright MCP’nin 24 araçla açılıp dış ağ isteğini engelleme kuralını doğruladı. Bu, canlı öğrenci verisine veya dış sayfalara yanlışlıkla gitmeden yerel tasarım QA yapmamızı sağlar.

### Beceri ve MCP ile genişletme

Codex becerileri kademeli yükler: önce ad ve açıklama keşfedilir, seçilen becerideki `SKILL.md`, betikler, referanslar ve varlıklar gerektiğinde okunur. Bu proje için keşifte 84 beceri ve 0 keşif hatası görüldü. `impeccable`, `frontend-design`, `canvas-design`, `better-icons`, `higgsfield-medya`, `pdf`, `documents`, `openai-docs` ve `ulucamii-site` gibi beceriler mevcut.

MCP tarafında 18 sunucu tanımı var. `codex mcp list --json` çıktısında proje için etkin görünenler `context7`, `cua_repl`, `node_repl`, `serena` ve `ulucamii_browser`; Firebase, GitHub, genel Playwright, Stitch, filesystem ve diğer kişisel/harici sunucular kapalı. Proje ayarındaki `apps = false` kişisel uygulamaların dernek verisiyle karışmasını engelliyor.

Canva ve Figma için iki ayrı iz bulunuyor:

- Claude eklenti kaynağındaki `canva` ve `figma` paketleri kurulu fakat proje ayarında devre dışı.
- OpenAI curated remote listesinde Canva ve Figma bağlantıları kurulu/enabled görünüyor, ancak bu oturumda bu araçların çağrı yüzeyi açılmadı ve gerçek tasarım işlemi denenmedi.

Bu nedenle “OAuth tamam, tasarım üretimi kesin çalışıyor” sonucu çıkarılamaz. Bir sonraki aşamada yalnız bir araç seçilip kimlik doğrulama, dosya oluşturma, dışa aktarma ve yerel dosyaya alma zinciri uçtan uca denenmelidir.

## Canlı sağlık sonucu

### Geçen kontroller

| Kontrol | Sonuç |
|---|---|
| `npm run codex:kontrol` | GEÇTİ — Codex ayarları, hesap ayrımı, kancalar, 84 beceri, 0 keşif hatası; yerel Playwright MCP 24 araç |
| `npm run agy:kontrol` | GEÇTİ — agy 1.2.1, AGENTS kuralları, beceri filtresi ve emülatör yalıtımı |
| Astro `check` | GEÇTİ — 0 hata, 0 uyarı, 235 hint |
| CMS ve panel denetimi | GEÇTİ — 8 koleksiyon, 0 kritik, 0 uyarı |
| Astro build | GEÇTİ — 870 sayfa |
| Playwright | GEÇTİ — masaüstü/mobil toplam 242 test |
| Firestore kuralları | GEÇTİ — 17 emülatör testi |
| Veli e-posta sözleşmeleri | GEÇTİ — 32 test |
| İhtida/PDF sözleşmeleri | GEÇTİ — 33 test |

`npm run dogrula:codex` çıkış kodu 0 ile tamamlandı ve canlı yayın/veri değişikliği yapmadı.

### Takip edilmesi gereken bulgular

1. Build sırasında `src/content/materyaller` klasöründe Markdown bulunmadığı için Astro uyarısı geliyor. Sayfa bilinçli olarak boşsa koleksiyon yükleme davranışı açıkça belgelenmeli; içerik bekleniyorsa örnek/taslak kayıt veya loader düzeltmesi yapılmalı.
2. Site denetiminde bir duyurudaki DİB Dış İlişkiler iletişim numarası için beyaz liste kaydı eksikti. Resmî 2026 sınav duyurusuyla doğrulanıp içerik `+90 (312) 295 75 82 / 295 75 83` biçimine ve denetim beyaz listesine işlendi.
3. Astro check 0 hata ve 0 uyarı verse de 235 hint var. Bunların çoğu `z` API’si deprecation’ı, kullanılmayan değişkenler ve `document.execCommand` deprecation’ı. Bunlar hemen tasarım engeli değil; ayrı bir teknik borç işi olarak ele alınmalı.
4. `codex doctor` 20 olumlu kontrol, 1 idle, 6 not, 2 uyarı ve 1 başarısız durum bildirdi. Tek başarısız başlık, bu başlatma ortamında `TERM=dumb` olmasıdır; etkileşimli Codex oturumunun tasarım yeteneğini bozduğuna dair kanıt yok. Microsoft Defender dışlama doğrulaması ve Windows Dev Drive önerisi performans notudur.
5. 117 aktif rollout dosyası yaklaşık 1,32 GiB yer kaplıyor. Bu bir tasarım yeteneği eksikliği değil, uzun vadeli çalışma alanı bakım konusudur.
6. Masaüstü Codex uygulaması için daha yeni bir build bildiriliyor; CLI’nin kendisi güncel görünüyor. CLI güncellemesi bu incelemede yapılmadı.

## Kurulması veya eklenmesi mantıklı olanlar

### P0 — Yeni paket kurmadan

#### 1. Tasarım sözleşmesi

`docs/design/DESIGN.md` ve yüzey bazlı kısa brifler oluşturulmalı. Her brif şu alanları taşımalı:

- yüzeyin amacı: `Persuade`, `Operate`, `Read` veya `Experience`
- hedef kullanıcı ve birincil eylem
- renk ve kontrast rolleri
- başlık/gövde/etiket yazı tipleri ve ölçüleri
- 4, 8 ve 12 tabanlı boşluk ölçeği
- kart, panel, düğme, form ve modal yarıçapları
- açık/koyu tema karşılıkları
- hareket süresi, easing ve reduced-motion davranışı
- TR/FR/EN uzun metin sınırları
- kullanılacak görsel oranları ve güvenli metin alanı

Bu dosya olmadan her yeni slider veya afiş bölümü iyi görünebilir, ancak site genelinde kararlar tekrar dağılabilir.

#### 2. Gerçek görsel regresyon

Playwright zaten kurulu. Resmî belgeler `expect(page).toHaveScreenshot()` ile ilk çalıştırmada referans görselleri üretmeyi, sonraki çalıştırmalarda piksel farklarını karşılaştırmayı; sabit viewport, aynı tarayıcı/işletim sistemi ve gerektiğinde `stylePath` ile dinamik alanları dondurmayı öneriyor ([Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)).

Önerilen matris:

| Yüzey | Genişlikler | Tema |
|---|---|---|
| Ana sayfa | 320, 390, 768, 1440 | açık, koyu |
| İhtida formu | 320, 390, 1440 | açık, koyu |
| Veli portalı | 390, 1440 | açık, koyu |
| Vaazlar ve kütüphane | 320, 1440 | açık, koyu |

Slider için saat, tarih ve autoplay dondurulmalı; baseline yalnız görsel düzeni ölçmeli. Böylece içerik tarihleri değiştiğinde gereksiz piksel alarmı oluşmaz.

#### 3. Medya manifesti ve lint

Sharp tabanlı `scripts/design-media-check.mjs` şu kontrolleri yapmalı:

- dosya formatı ve renk profili
- minimum ve maksimum piksel ölçüsü
- hedef yüzey oranı
- büyük dosya uyarısı
- aynı içeriğin tekrar eden hash’i
- afişte güvenli metin alanı
- içerik kaydında `alt` alanı
- `public/media` ile içerik koleksiyonu eşleşmesi

`sharp` zaten kurulu olduğundan bunu yeni ağır bir medya çerçevesi eklemeden yapmak mümkün.

#### 4. Tek tasarım kalite komutu

`package.json` içine yayın yapmayan bir komut eklenmeli:

```text
npm run design:check
```

Bu komut token ve medya lint’ini hızlıca çalıştırmalı. Görsel baselines ve Axe
kontrolleri `test:web` içinde, tam `dogrula:codex` akışında korunmalı; böylece
günlük tasarım iterasyonu kısa kalır.

### P1 — Seçerek açılacaklar

#### Figma veya Canva, ikisi birden değil

- Figma; ortak bileşen, token ve geliştirici-tasarım eşleşmesi gerekiyorsa seçilmeli.
- Canva; afiş, sosyal medya, baskı ve ekip içi şablon üretimi ağırlıktaysa seçilmeli.

İlk uçtan uca denemede şu zincir ölçülmeli: yetki, mevcut dosyayı okuma, tek bir kopya oluşturma, metin/görsel değişimi, PNG/PDF dışa aktarma ve yerel teslim. Bu zincir geçmeden eklentiyi günlük üretim hattı olarak kabul etmemek gerekir.

#### Impeccable proje bağlamı

`impeccable` eklentisi kurulu ve etkin. Yeni bir görsel yüzey uygulanacağı zaman proje köküne `PRODUCT.md`, `DESIGN.md` ve yüzey brifi eklenip becerinin bağlam betiği bir kez çalıştırılmalı. 11 Eylül uygulamasında mevcut kimliği korumak için `docs/design/DESIGN.md` ve üç yüzey brifi oluşturuldu; bağlam betiği ana sayfa üzerinde çalıştırıldı. Görsel ilkelere dokunmadan semantik token katmanı ve regresyon tabanları eklendi.

#### İkon politikası

`better-icons` komutu PATH üzerinde çalışıyor. Üretimde emoji veya rastgele üçüncü taraf ikon yerine tek bir Iconify/Lucide ailesi seçilmeli; SVG’ler lisans ve `aria-hidden`/etiket kurallarıyla içeri alınmalı.

#### Mevcut yerel Playwright köprüsü

Genel Playwright MCP’yi açmak yerine mevcut `ulucamii_browser` köprüsü korunmalı. Bu köprü yerel sayfayı açıyor ve dış ağ süzgecini test ediyor. Genel MCP ancak ayrı bir ihtiyaç çıktığında ve hesap/veri yalıtımı yeniden doğrulandığında açılmalı.

### P2 — Şimdilik kurulmaması gerekenler

- Storybook: Site şu anda büyük bir paylaşılan UI kütüphanesinden çok içerik ağırlıklı statik sayfalardan oluşuyor. Bileşen sayısı ve ekip paylaşımı artmadan kurulum maliyeti getirisi düşük.
- Lighthouse: Web vitals betiği ve Playwright mevcut. Özel performans sorunu ölçülmeden yeni bir rapor katmanı eklemek tekrarlı sonuç üretir.
- Cloudinary/ImageKit/Mux: Astro harici image service destekliyor, ancak mevcut Sharp + statik çıktı + dernek hesabı yalıtımı medya CDN’ini şu an zorunlu kılmıyor. 619 medya dosyasının ölçüleri ve cache davranışı önce ölçülmeli.
- Yeni CSS/UI kütüphanesi: Tailwind 4 ve mevcut yerel bileşenler yeterli; başka bir kit mevcut Kilim Kartografyası dilini parçalayabilir.
- Figma Code Connect: Figma gerçekten ekip standardı olarak seçilmedikçe kuruluma gerek yok.

## Önerilen dosya ve akış düzeni

```text
docs/design/DESIGN.md
docs/design/surfaces/ana-sayfa.md
docs/design/surfaces/ihtida.md
docs/design/surfaces/veli-portali.md
src/styles/tokens.css
scripts/design-check.mjs
scripts/design-media-check.mjs
tests/web/design-visual.spec.mjs
tests/web/design-visual.spec.mjs-snapshots/
```

## 11 Eylül uygulama kaydı

Önerilen ilk dört adım yerel projeye uygulandı:

- `docs/design/DESIGN.md` ve `docs/design/surfaces/` altında ana sayfa, ihtida ve
  veli portalı için görsel sözleşme ile yüzey kabul ölçütleri yazıldı.
- `src/styles/tokens.css`, mevcut Kilim Kartografyası değişkenlerini semantik
  adlarla tüketmek için eklendi; görünür renk ve yazı karakterleri korunarak
  `global.css` içine alındı.
- `scripts/design-media-check.mjs` ve `scripts/design-media-manifest.mjs`, Sharp
  ile yerel medya ölçüsü, biçimi, boyutu, hash tekrarları ve eksik referansları
  denetliyor. Manifest `docs/design/media-manifest.json` dosyasına deterministik
  olarak yazılıyor.
- `scripts/design-token-check.mjs` ve `scripts/design-check.mjs`, bu sözleşmeyi
  `npm run design:check` ile tek kalite kapısına bağlıyor; `dogrula:codex` bu kapıyı
  otomatik olarak ilk adımda çalıştırıyor.
- `tests/web/design-visual.spec.mjs`, altı yüzeyi TR/FR/EN, açık/koyu tema,
  masaüstü ve Pixel 7 ölçülerinde 24 görsel baseline testiyle izliyor. Baseline
  dosyaları aynı test klasöründe sürüm kontrollü tutuluyor.

Uygulama sonrası doğrulama: tasarım kapısı 0 hata ile geçti; üretim 870 statik
sayfa oluşturdu; `test:web` 242/242, `test:kurallar` 17/17 ve
`test:veli-eposta` 32/32 test geçti. Bu adım canlı yayın, CMS, Firebase veya
gerçek e-posta gönderimi yapmadı.

Günlük tasarım döngüsü şöyle olmalı:

```text
brief → token/content check → Astro/Preact/Tailwind uygulaması
      → Sharp medya kontrolü → Playwright + Axe
      → masaüstü/mobil ekran görüntüsü → kullanıcıya önizleme
      → onaydan sonra ayrı yayın adımı
```

Bu akış, üretim ile yayını birbirinden ayırır. Kullanıcı açıkça yayın istemedikçe Codex yalnız yerel build, önizleme ve rapor üretir.

## Model ve araç yönlendirmesi

| İş | Önerilen araç | Gerekçe |
|---|---|---|
| Tasarım sistemi, sayfa omurgası, erişilebilirlik ve refaktör | Codex, `gpt-5.6-sol`, `high` | Kod ve tarayıcı kanıtını aynı işte birleştirir. |
| Küçük CSS düzeltmesi ve tekrar eden sınıf işi | Codex, daha düşük çaba veya `gpt-5.6-terra` | Hız ve maliyet dengesi. |
| Yüzlerce afiş varyantı, OCR, dosya dönüştürme | `agy` + Sharp/ffmpeg | Yüksek hacimli mekanik üretim için uygun ikinci hat. |
| Afiş/video yaratıcı varyantları | Higgsfield tarayıcı becerisi veya ImageGen | Hesap oturumunu sır saklamadan kullanır. |
| Ortak tasarım dosyası | Seçilecek tek araç: Figma veya Canva | Aynı işi iki ayrı tasarım deposuna bölmez. |
| Kütüphane/API ayrıntısı | Context7 | Güncel birincil kütüphane belgelerini sorgular. |

Model adları ve özellikleri zamanla değişebildiği için belirli bir modelin “her işte en iyi” olduğu varsayılmamalı; iş türüne göre yönlendirme yapılmalı. Mevcut Codex doktoru `gpt-5.6-sol` ve yüksek çabayı doğruluyor.

## Uygulama sırası

1. ✓ `DESIGN.md` ve üç ana yüzey brifi yazıldı.
2. ✓ `design:check` ve Sharp medya lint’i eklendi.
3. ✓ Ana sayfanın ve ihtida yüzeyinin iki tema, iki viewport ve üç dil baseline’ları üretildi.
4. ✓ İhtida formu ve veli portalı için aynı görsel kalite kapısı kuruldu; portal baseline’ı
   ihtiyaç çıktığında aynı matrise eklenebilir.
5. Bir haftalık gerçek kullanım sonrasında Figma mı Canva mı gerektiğine karar ver ve yalnız seçilen bağlantıyı uçtan uca doğrula.
6. Storybook, CDN veya ek görsel kütüphanesini ancak ölçülen bir ihtiyaç varsa değerlendir.

Bu sırada mevcut `npm run dogrula:codex` kalite kapısı korunur; yeni komut ona paralel bir tasarım denetimi olur. Hiçbir yeni araç, kişisel hesap veya öğrenci/veli verisi proje kaynaklarına taşınmamalı.

## Son karar

Codex CLI olarak tasarım yapma kapasitemiz zaten yeterli ve sağlıklı: kod, görsel üretim, yerel medya işleme, tarayıcı kontrolü, erişilebilirlik, çoklu dil ve PDF/afiş üretimi aynı çalışma alanında mevcut. Şu an yeni bir frontend çatısı veya ağır tasarım platformu kurmak yerine tasarım kararlarını belgeleyen ve piksel farkını ölçen küçük bir kalite katmanı eklemek en doğru yatırımdır.

Figma/Canva bağlantısı ancak gerçek bir uçtan uca testten sonra günlük üretim hattına alınmalı. Böylece kurulu görünen ancak denenmemiş araçlar “hazır” kabul edilmez; tasarım üretimi, önizleme ve yayın sınırları net kalır.

## Kaynaklar

- [OpenAI Codex CLI](https://developers.openai.com/codex/cli/)
- [OpenAI Codex becerileri](https://developers.openai.com/codex/skills/)
- [OpenAI Codex MCP](https://developers.openai.com/codex/mcp/)
- [OpenAI Codex kullanım örnekleri](https://developers.openai.com/codex/use-cases)
- [OpenAI GPT Image modeli](https://developers.openai.com/api/docs/models/gpt-image-2)
- [Astro görselleri](https://docs.astro.build/en/guides/images/)
- [Astro Image Service API](https://docs.astro.build/en/reference/image-service-reference/)
- [Tailwind CSS tema değişkenleri](https://tailwindcss.com/docs/theme)
- [Playwright görsel karşılaştırmaları](https://playwright.dev/docs/test-snapshots)
- [Sharp resmî belgeleri](https://sharp.pixelplumbing.com/)

Yerel kanıt dosyaları: `AGENTS.md`, `astro.config.mjs`, `playwright.config.mjs`, `package.json`, `src/styles/global.css`, `src/components/HeroSlayt.astro`, `src/components/GundemVitrini.astro`, `src/scripts/gundem-vitrini.ts`, `scripts/codex-kontrol.mjs`, `scripts/agy-kontrol.mjs`, `scripts/dogrula-codex.mjs`.
