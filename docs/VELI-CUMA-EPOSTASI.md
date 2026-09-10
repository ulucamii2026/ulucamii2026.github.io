# Cuma günü otomatik veli e-postası

Kullanıcı talebi: her cuma, hafta sonu derslerinden bir gün önce velilere cuma
tebriği, cumartesi/pazar dersleri, ödev ve gerekli malzemeler gönderilir.
9 Eylül 2026'da saat tercihi soruldu; yanıt gelmediği için Belçika saatiyle
10.00 esas alındı. Gönderim mevcut beş dakikalık zamanlayıcıyla kontrol edilir.

## İçerik ve alıcılar

- Aktif öğrencisi bulunan veli hesapları ve yeni otomatik eklenen kayıtlar.
  Her e-posta adresine ayrı gönderilir; diğer velilerin adresleri paylaşılmaz.
- Kayıtta seçilen `iletisimDili` önceliklidir. Eski geçerli `dil` alanı uyumluluk
  içindir. Bilinmeyen dilde gönderim bekler; Türkçe tahmin edilmez.
- Cuma tebriği, aile-kurs işbirliği ve çanta kontrolü TR/FR hazırlanmıştır.
- Cumartesi/pazar konusu, sitenin yayımlanmış veli portalındaki güncel yıllık
  plandan her gönderimde okunur. Yerel eski plan kopyası kullanılmaz.
- Fransızca ders başlıkları Google Apps Script LanguageApp ile çevrilip içerik
  özetiyle önbelleğe alınır. Yalnız herkese açık başlıklar çevrilir; öğrenci,
  veli ve özel ödev verileri çeviri servisine gönderilmez.
- Harf grupları ve cami sitesindeki doğrulanmış Fransızca başlıklar sözlükle
  korunur. Önizlemede görülen Ayn/A-N ve "sevincimi" çeviri hataları düzeltildi.
- Ödevler `odevler` koleksiyonundan, yalnız `yayin: true` olan ve son ders
  haftasından yaklaşan pazar gününe kadarki kayıtlardan alınır. Daha eski veya
  sonraki haftanın ödevi taşınmaz. FR metin boşsa Türkçe ayrıntı gönderilmez;
  Fransızca bir portal hatırlatması kullanılır.
- İleti kısa kalması için ödev en fazla 320, ezber 180 karakterle özetlenir;
  devamı gerektiğinde veli portalına yönlendirilir. Asıl ödev metni değişmez.
- Güncel plan indirilemezse gönderim başlamaz. Tarihi planda bulunmayan gün
  "tatil" sayılmaz. Açık ders iptali veya boş ders günü ayrı ele alınır.

## Telefonda okunabilirlik ve denemeler

9 Eylül'de kullanıcı telefonda metnin küçük göründüğünü bildirdi. Önceki gövde
16, yardımcı yazılar 12 pikseldi. Gövde, paragraf ve listeler artık satır içi
20 piksel; gün başlıkları 21, bölüm başlıkları 24, alt bilgi 16 pikseldir.
Sabit `width="600"` kaldırıldı; yüzde genişlik, dar kenar boşlukları ve geniş
dokunma alanları kullanılır. Okunabilirlik yalnız `body` veya başlık CSS'ine bağlı değildir.
`tests/web/veli-cuma.spec.mjs` TR/FR metni başlık/gövde stilleri çıkarılmış bir
posta kapsayıcısında 320/390/760 pikselde sınar. Bu, gerçek telefon uygulaması
sınamasının yerine geçmez; kullanıcıya yeni örnek gönderilerek ayrıca kontrol edilir.

Deneme alıcısının 9 Eylül'deki kalıcı tercihi repo dışındaki
`D:/app/marche-cami-sitesi/portal/eposta-test-ayarlari.json` dosyasındadır.
Deneme gönderirken bu tercihi kullan; kişisel adresi kaynak koda taşımama ve
veli listesine eklememe. Tercih, kendiliğinden deneme gönderme izni değildir.
Yardımcı `.codex/veli-cuma-deneme.py`, aynı alıcı ve içerik için gönderim kaydı tutar.
Yeni mobil deneme, kullanıcının belirttiği adrese gönderildi; sağlayıcı olay kaydı
9 Eylül 2026 13.52'de `delivered` döndü. Gerçek telefondaki son görünümün kullanıcı
teyidi ayrıca beklenir; tarayıcı ölçümü bu teyidin yerine geçmez.

E-posta CSS dayanağı: [Gmail CSS desteği](https://developers.google.com/workspace/gmail/design/css?hl=tr).

## Yönetim

`ayarlar/veliCuma` belgesi:

- `aktif`: gönderimi açıp kapatır.
- `saat`: Europe/Brussels saatinde başlangıç saati; varsayılan 10.
- `gunler`: tarih anahtarlı istisnalar. Örnek: `2099-01-03` altında
  `iptal: true` ve `aciklama: {tr: "…", fr: "…"}`.
- `aileler` belgesinde `haftalikEposta: false` ilgili veliyi bu gönderimden çıkarır.
- Haftalık `odevler` belgesinde isteğe bağlı `getirilecekler: {tr: "…", fr: "…"}`
  özel malzemeyi genel defter/kitap/kalem listesine ekler.

Bu alanları yönetmek için yeni bir ekran eklenmedi; mevcut veri yönetimiyle
veya sonraki yetkili destek işlemiyle değiştirilebilir.

`veliCumaSina` canlı plan/ödev/alıcıları okuyup iki dili hazırlar; mail göndermez.
`veliCumaKur` sağlayıcı erişimini ve zamanlayıcıyı kontrol ederek etkinleştirir.
Panel anahtarıyla `islem=veli-cuma-durum` durum, `islem=veli-cuma-onizleme&dil=tr|fr`
sonraki cumanın gerçek içerik önizlemesini verir. Önizleme mail göndermez.

## Tekrar ve hata davranışı

- Aynı cuma + e-posta özeti için kalıcı gönderim kaydı tutulur.
- Gönderimden önce girişim işaretlenir; süreç kapanırsa ikinci kez körlemesine
  gönderilmez. Belirsiz sonuç Brevo olay kaydıyla aranır.
- 429 hız sınırı sonraki kontrolde denenir. Belirsiz/5xx sonucunda başka e-posta
  motoruna otomatik geçilmez; bu, mükerrer iletiyi önler.
- Sağlayıcı kabulü, alıcının okuduğu veya kesin teslim edildiği anlamına gelmez.
- Gönderim penceresi yalnız cuma, seçilen saatten 21.00'e kadardır. Başarılı
  alıcılar sonraki kontrollerde atlanır; yeni kaydolan veli aynı gün eklenebilir.

## Kaynak ve doğrulama

[LanguageApp çeviri](https://developers.google.com/apps-script/reference/language/language-app),
[Brevo gönderim API'si](https://developers.brevo.com/reference/send-transac-email),
[Brevo tekrar önleme](https://developers.brevo.com/docs/heterogenous-versions-batch-emails).

`tests/veli-cuma.test.mjs`: takvim/saat, hafta seçimi, yayımlanmamış ödev,
TR/FR, eksik çeviri, iptal/eksik plan, HTML kaçışı, mükerrer gönderim, belirsiz
sonuç, tekrar ve pasif alıcı senaryoları.

## Canlı etkinleştirme — 9 Eylül 2026

Canlı kurulumda Brevo hesap erişimi, dernek kimliği ve zamanlayıcı doğrulandı.
`aktif: true`, `saat: 10`, `zamanDilimi: Europe/Brussels` durumuyla etkin.
İlk cuma 11 Eylül 2026; hazırlanan mesaj 12-13 Eylül dersleri içindir.
Alıcı sınaması: 10 veli hesabı, 9 TR ve 1 FR; dili eksik alıcı yok.
Bu aşamada cuma e-postası velilere erken gönderilmedi.

Gerçek canlı önizlemeler TR/FR için alındı; 390 ve 760 pikselde yatay taşma
olmadığı doğrulandı. Özel çalışma çıktıları dernek arşivinde
`portal/cuma-epostasi-2026-09-11` klasöründedir. Önizlemeler kişiye özel kayıt
bilgisi veya giriş anahtarı içermez.

Son canlı dağıtım: mevcut web uygulamasının 33. sürümü (9 Eylül 2026, 13.48);
URL korundu. Bu sürüm telefon için büyütülmüş, yüzde genişlikli şablonu içerir.
Uygulama/form protokolü `surum: 28` olarak kaldı. İhtida paketi ve defteri
sağlık kontrolleri çalışmaya devam ediyor.

Son kalite zinciri `npm run dogrula:codex` geçti: web 86/86, Firestore 17/17,
ihtida/belge 31/31, veli e-postası ve otomasyon 30/30.
İlk gerçek cuma gönderimi henüz gerçekleşmedi; alıcıya teslim sonucu bu
aşamada doğrulanmış değildir.
# Kurumsal e-posta tasarımı — 9 Eylül 2026

- Ortak kaynak: `scripts/apps-script/veli-eposta-sablon.gs`; Node kullanımı: `scripts/veli-eposta-render.mjs` (JSON stdin: metin, dil, baslik).
- Cuma bülteni, kurs kayıt onayı ve `portal-yonetim.py` yönetici davetleri bu kaynağı kullanır. Yeni veli kampanyaları da buradan üretilir; eski kampanya betiklerini tekrar çalıştırmayın.
- Ana metin 20 px; dersin altındaki kitap/sayfa bilgisi 16 px. Kurs logosu her iletinin başında yer alır. GPT görseli dört saniye hafif hareket eder, tekrar etmez; görseller yüklenmese de içerik HTML metni olarak okunur.
- Dersler canlı portal planından, kitap/sayfa bilgisi derneğin açık yıllık plan JSON dosyasından alınır. Dönem+tarih+ders kodu+konu eşleşmesi gerekir. Belirtilmeyen sayfa uydurulmaz; Fransızca iletide sayfa kısaltması `p.` olur, kitap özel adı korunur.
- Görsel sürümü: GitHub `eposta-kurumsal-v1` release. Kaynak `public/media/eposta/`; logo `public/media/logo/kuran-kursu-logo-256.png`.
- Firebase'in doğrudan gönderdiği giriş/şifre sıfırlama güvenlik e-postaları ayrı altyapıdır; bu değişiklik onların şablonunu değiştirmez. Dil tercihlerini bozacak genel bir Türkçe şablon uygulanmaz.
- Deneme alıcısı tercihi repo dışındaki `eposta-test-ayarlari.json` dosyasındadır; her gönderim için açık kullanıcı isteği gerekir. Normal haftalık gönderim cuma günüdür.
- Canlı GAS dağıtımı: 34 (9 Eylül 2026 14.11). `veliCumaSina` iki gün/10 veli/9 TR+1 FR sonucunu gönderim yapmadan doğruladı. `dogrula:codex` geçti; ayrıca ortak şablon ve kitap eşleştirmesi 20/20 birim testi, TR/FR 320/390/760 px görsel kontrolü geçti.
- Python `requests` ile Apps Script önizlemesi aralıklı 404 dönebilir; aynı korumalı uç nokta dernek oturumunun tarayıcısından HTTP 200 ile doğrulanmıştır. Başarısız okuma e-posta göndermemeli; önce gerçek canlı HTML alınır.


## Son hazırlık kontrolü — 10 Eylül 2026

- Canlı durum: otomasyon kurulu ve aktif; Europe/Brussels saat 10.00. İlk gönderim 11 Eylül, içerik 12–13 Eylül içindir.
- Kayıt defterindeki 13 öğrenci ve 9 aile portalla karşılaştırıldı. İkinci veli hesabıyla toplam 10 alıcı: 9 TR, 1 FR; eksik dil yok. Yeni kayıt aktarımında bekleyen yok.
- Brevo dernek hesabı ve gönderim servisi etkin; ulucamii.be alan adı doğrulanmış ve kimlik doğrulaması tamamlanmış. 9 Eylül 14.15 deneme iletisinin teslim olayı mevcut. Bu kontrol yeni test veya toplu e-posta göndermedi.
- Gerçek canlı TR/FR önizlemelerinde iki günün dersleri, kitap/sayfa bilgileri ve yayımlanmış ödev bulundu. 320/390 px görünümde taşma yok; logo ve görseller yüklendi, ana metin 20 px. Ekran görüntüleri görsel olarak incelendi.
- Gelecekteki gerçek gönderimin gerçekleştiği veya teslim edildiği şimdiden doğrulanamaz. İlk gönderimin sonucu cuma günü sağlayıcı olay kaydıyla kontrol edilir.
- Özel kontrol çıktıları: dernek arşivinde `portal/son-kontrol-2026-09-10`; kaynak depoya kişi bilgisi taşınmadı.
