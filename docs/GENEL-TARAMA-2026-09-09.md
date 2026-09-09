# Genel site taraması — 9 Eylül 2026

Durum: Yerel düzeltmeler ve doğrulamalar tamamlandı. Bu taramada commit, push,
yayın, canlı veri değişikliği, e-posta veya form gönderimi yapılmadı. Önceki
vaazlar düzenlemesi de son test koşusuna dahil edildi.

## Düzeltilenler

- `package-lock.json`: npm denetiminin bildirdiği Astro, sharp, js-yaml ve SVGO
  açıkları kapatıldı. Kurulu sürümler Astro 7.3.2, sharp 0.35.4, js-yaml 4.3.2,
  SVGO 4.1.0; son npm audit sonucu sıfır bilinen açık.
- `src/sayfalar/Hakkimizda.astro`, `Ihtida.astro`, `Uyelik.astro`: yanlış
  tanım listesi yapıları düzeltildi. Başlıklar, iletişim bağlantıları ve bağımsız
  açıklamalar doğru HTML öğelerine taşındı; banka/iletişim değerleri değiştirilmedi.
- `src/sayfalar/DiyanetHizmetleri.astro`: hac rozeti açık ve koyu temada daha
  okunur renklerle gösteriliyor.
- `src/sayfalar/Mufredat.astro`: içindekiler numaraları, “Bu ay” etiketi ve
  telefonda koyu temadaki ders alanı etiketlerinin kontrastı düzeltildi.
- `src/i18n/uip{,-fr,-en}.ts`: eski TDV adresi
  [güncel resmî siteye](https://tdv.org/tr-TR/) yöneltildi.
- Üç dilde `src/content/sayfalar/*/konsolosluk.md`: tarayıcıda 404 veren
  `/Askeralma` bağlantısı, HTTP 200 ile doğrulanan
  [MSB /askeralma](https://www.msb.gov.tr/askeralma) adresiyle değiştirildi.
- `tests/web/sayfa-erisebilirligi.spec.mjs`: beş ortak sayfanın üç dilde,
  mobil/masaüstü ve açık/koyu temada liste semantiği ve kontrast kontrolleri eklendi.

## Doğrulama

- `npm run dogrula:codex`: bütün kalite kapıları geçti; 104 web testi,
  17 Firestore emülatör testi ve 32 veli e-postası testi başarılı.
- Derlenmiş site denetimi: 875 HTML sayfası, 1.009 farklı site içi bağlantı.
- 90 ana sayfa üç dilde 320 ve 1280 piksel genişlikte incelendi. Açık/koyu
  tema taramalarında saptanan ortak sorunlar yukarıdaki testlerle yeniden doğrulandı.
- Görsel/dosya taraması: 881 HTML/CSS dosyası içindeki 357 yerel kaynakta
  eksik hedef bulunmadı. Sayfa içi bağlantı taramasındaki adaylar CMS hash
  yolları, çalışan yıl filtresi ve tarayıcının `#top` hedefiydi.
- Canlı site: 90 ana sayfanın tamamı HTTP 200 yanıtı verdi. Bu kontrol,
  yerel düzeltmelerin canlıda yayımlandığı anlamına gelmez.
- Dış bağlantılar: 253 adres tarandı. Araçtaki sertifika kaynaklı yanlış
  uyarılar Windows güvenilir sertifika deposuyla tekrar denetlenerek ayrıldı;
  sertifika doğrulaması kapatılmadı. MSB ve yeni TDV adresleri ayrıca gerçek
  Chromium gezinmesinde 200 ve beklenen sayfa başlıklarıyla doğrulandı.

## Kalan sınır

[DİBBYS UİP başvuru adresi](https://dibbys.diyanet.gov.tr/IKYS/Sinav/KurumDisi/DisIliskiler/UIPBasvuru.aspx)
hem HTTP denemelerinde hem tarayıcıda bağlantı zaman aşımına uğradı. Kuruma ait
bu sunucu sorunu yerel kodla giderilemez; başvuru hedefi keyfî biçimde değiştirilmedi.
Otomatik araçta başlık boyutu hatası veren Diyanet kurban açıklaması resmî
sayfa içeriği açılarak doğrulandı.

Tarayıcı kontrolleri Chromium ve mobil emülasyondadır; fiziksel iPhone/Safari
testi değildir. Form ve e-posta testleri canlı gönderim yapmadan çalıştı.

Kanıtlar: `.codex/cikti/genel-kapanis-dogrula.log`, `genel-kapanis-audit.json`,
`genel-tarama.json`, `genel-tarama-koyu.json`, `genel-canli-kontrol.json`,
`genel-dosya-kontrol.json`, `genel-dis-baglanti-sistem.log`,
`genel-dis-tarayici{,-once}.json` ve `genel-son-*.png`.
