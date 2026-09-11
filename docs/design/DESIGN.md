# Ulu Camii görsel sistem sözleşmesi

Güncelleme: 11 Eylül 2026  
Kapsam: Astro web sitesi, TR/FR/EN sayfaları, ana sayfa vitrini, ihtida akışı ve veli portalı.

## Ürün sahnesi

Marche-en-Famenne Ulu Camii sitesini telefonundan takip eden cemaat üyesi, veli,
ihtida başvurusu yapan kişi ve ziyaretçi; güvenilir bilgiye hızlıca ulaşır, dili
değiştirebilir ve bir sonraki adımı açıkça görür. Arayüz ibadet, eğitim ve
dayanışma hizmetlerini aynı kurumsal ses içinde birleştirir.

## Görsel dünya

Mevcut görsel dünya **Kilim Kartografyası**dır: sakin bir kâğıt zemini üzerinde
toprak renkleri, tek serin İznik mavisi aksı ve ince kilim çizgileri. Renkler
dekor olarak saçılmaz; bölümün anlamını ve eylem sırasını taşır. Ceviz ve mürekkep
metin için, kiremit birincil eylem için, İznik mavisi bağlantı ve odak için,
adaçayı destekleyici durumlar için kullanılır.

Bu sistem, mevcut kimliği belgeleyen bir genişletmedir; ana sayfanın veya form
akışının ürün davranışını değiştiren bir yeniden tasarım değildir.

## Tasarım ilkeleri

- **Önce görev:** Başlık, tarih/dil bağlamı ve bir sonraki eylem ilk bakışta
  anlaşılır. Operasyonel yüzeylerde süs, görevin önüne geçmez.
- **Hiyerarşiyle nefes:** Bölüm başlıklarının üst boşluğu alt boşluğundan daha
  geniştir. Metin ölçüsü mümkün olduğunca 65–75 karakter aralığındadır.
- **Tek aksan:** Kiremit eylemi, İznik mavisi bağlantıyı ve klavye odağını
  taşır. Aynı bileşende iki güçlü vurgu yarışmaz.
- **Gerçek içerik:** Afiş, duyuru ve fotoğraf gerçek kaynaktan gelir; yer tutucu
  veya dekoratif ikon içerik yerine geçmez. İkonlar `Ikon.astro` üzerinden tek
  stroke diliyle çizilir.
- **Dil eşitliği:** TR, FR ve EN aynı bileşen yapısını paylaşır. Çeviri metni
  uzadığında kutu taşmaz; dil kodu ve yön bilgisi korunur.
- **Güvenli hareket:** Slider ve açılır durumlar içerik görünür kaldıktan sonra
  hareket eder. `prefers-reduced-motion: reduce` ile geçişler kapanır.

## Temel kararlar

| Alan | Karar |
|---|---|
| Zemin | `--zemin` / `--zemin-2` / `--zemin-3`; açıkta ferah kâğıt, koyuda sıcak koyu gri |
| Metin | `--metin` birincil, `--metin-2` ikincil; gövde kontrastı en az 4,5:1 |
| Vurgu | `--vurgu` (kiremit) eylem, `--vurgu-2` (İznik) bağlantı/odak |
| Yazı | Başlık Lora, arayüz Work Sans, veri/kod IBM Plex Mono, Arapça Amiri |
| Köşe | `--radius-kose: 6px`; kart ve düğmelerde tutarlı |
| Gölge | Yumuşak, ofsetli yüzey gölgesi; sert blok gölge yok |
| Odak | En az 3 px İznik mavisi görünür `:focus-visible` halkası |
| Hareket | Kısa ease-out geçiş; azaltılmış harekette opak ve konumsal efekt yok |
| Görseller | Yerel WebP/JPEG/AVIF öncelikli; anlamlı alt metin; poster oranı içeriğe göre |

İlkel renk değişkenleri `src/styles/global.css` içindeki Tailwind `@theme` ve
` :root` bloklarındadır. Bileşenler için anlamlı takma adlar
`src/styles/tokens.css` içindedir; yeni CSS doğrudan hex yerine bu takma adları
kullanır.

## Bileşen dili

- `dugme` sınıfı en az 44 px dokunma yüksekliğiyle birincil, ikincil ve İznik
  varyantlarına ayrılır.
- `kart` ve `kart-kagit` yalnız gerçek bir içerik birimini gruplayan yüzeylerdir;
  kart içine kart eklenmez.
- `Ikon.astro` ikonların tek kaynağıdır; Unicode/emoji ikon yerine geçmez.
- Vitrin ve galeriler klavye ile ilerler, `aria-current`/`aria-live` durumlarını
  bildirir ve üçüncü taraf görsel isteğini gereksiz yere başlatmaz.
- Formlarda hata metni alan geçerli olur olmaz temizlenir; odaklanan alan sticky
  başlığın altında kalmaması için kaydırma payı alır.

## Yüzeyler

- [Ana sayfa](surfaces/ana-sayfa.md): **Persuade + Read**. Vitrin, ibadet/eğitim
  yönlendirmesi ve ziyaret bilgisi aynı akışta.
- [İhtida](surfaces/ihtida.md): **Operate + Read**. Başvuru adımlarını sakin,
  güvenilir ve dil eşitliğiyle tamamlatır.
- [Veli portalı](surfaces/veli-portali.md): **Operate**. Telefon öncelikli,
  ders/ödev/takvim bilgisini hızlı taranabilir yapar.

## Responsive ve erişilebilirlik sınırı

Masaüstünde iki kolonlu bilgi mimarisi korunur; 640 px altında tek kolona
düşer. Yatay taşma, 32 px altı dokunma hedefi, 11,5 px altı metin ve alt
metinsiz anlamlı görsel kalite kapısında kusurdur. Koyu tema, sistem tercihi
ve açık/koyu seçiciyle aynı tokenları kullanır. Renk tek başına anlam taşımaz;
etiket, ikon veya metin eşlik eder.

## Kalite kapısı

`npm run design:check` token ve medya sözleşmesini hızlıca denetler.
`npm run dogrula:codex` Astro, CMS, form, portal, Firebase kuralı ve web
testlerini çalıştırır. Görsel davranış için Playwright `toHaveScreenshot()`
testleri masaüstü ve Pixel 7 projelerinde seçili ana sayfa/ihtida yüzeylerini
ışık ve koyu temada kaydeder. Baseline değişikliği içerik değişikliği değilse
inceleme gerektirir; görsel snapshot kendi başına erişilebilirlik onayı değildir.

Yeni bir yüzey bu sözleşmeye eklenecekse ilgili kısa not önce
`docs/design/surfaces/` altında yazılır. Renk, yazı veya hareket dünyasını
değiştiren bir karar bu dosyada gerekçesiyle güncellenir.
