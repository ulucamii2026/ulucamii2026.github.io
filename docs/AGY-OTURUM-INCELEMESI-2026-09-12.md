# AGY oturum incelemesi — 12 Eylül 2026

İncelenen konuşma: `cac141e8-b0bd-43a5-89d0-e2181a8f0425`.
Başlangıç: temiz çalışma ağacı, `2506bb6`. Bu incelemedeki değişiklikler yereldir;
commit, push, canlı yayın, gerçek kayıt veya e-posta gönderimi yapılmadı.

## İnceleme kapsamı

Yerel konuşma veritabanı salt okunur incelendi: 3429 adım ve 35 kullanıcı mesajı.
Konuşmadaki işler güncel kaynak dosyaları, varlıklar ve çalıştırılabilir testlerle
karşılaştırıldı. Önceki “temiz Git / her şey hazır” mesajları canlı işlev kanıtı
sayılmadı. Veritabanı veya kişisel içerik depoya kopyalanmadı.

Oturum; Diyanet personel ve hac duyurularını, tasarım araçlarını, öğrenci modunu,
Elifba ve ezber seslerini, haftalık karneyi ve otomatik yerel kayıt betiğini kapsıyordu.
Hac takvimindeki kullanıcı tarafından teyit edilmiş yerel tarihler korundu.
Higgsfield hesabı, abonelikler ve önceki sosyal medya gönderimleri yeniden denenmedi.

## Düzeltilen bulgular

1. **Elifba cezm/şedde:** kesilmiş veya yapay Arapça ses yaklaşımı kaldırıldı.
   Diyanet'in 28 cezm ve 18 şedde örneği, kendi metinleriyle eşleştirildi.
   Şedde, harf başına uydurma örnek yerine ayrı açılır alanda sunulur.
   Kaynak ve SHA-256 değerleri `src/data/elifba-alistirmalari.json` içinde;
   tekrar aktarım betiği `scripts/elifba-alistirmalari-aktar.py`.
2. **Ses yaşam döngüsü:** eski isteğin gecikmiş hatasının yeni sesi bozması,
   iki kaydın birlikte çalması, döngü/metni gizleme sırasında konumun sıfırlanması
   ve dinleme alıştırmasında cevap sonrası sesin kesilmesi düzeltildi.
   Gerçek ses hatası kullanıcının dilinde bildirilir; yapay telaffuza geçilmez.
3. **Eksik dil kaydı:** İngilizce hadis sesinde Türkçe oynatılması ve eksik
   Fransızca dosyaya istek atılması önlendi. Kullanılabilir kayıtlar derlemede
   dosyalardan belirlenir. İngilizce anlam ve eksik kumanda çevirileri tamamlandı.
4. **Panoya kopyalama:** Clipboard API reddinde yedek yöntem denenir.
   `execCommand` başarısızlığı artık başarı mesajı üretmez; geçici alan kaldırılır,
   klavye odağı geri gelir.
5. **Haftalık karne:** eski yoklamanın bu haftaya taşınması önlendi.
   Brüksel takviminde bu haftanın girilmiş ders durumları toplanır;
   cumartesi ve pazar konuları/ezberleri birlikte gösterilir.
6. **Erişilebilirlik:** iç içe düğmeler kaldırıldı. Gizleme ve hız kontrollerinin
   klavye/ARIA durumu düzeltildi. Kilitli rozetler, bölüm başlıkları, seri etiketi
   ve koyu tema öğrenci simgesinin kontrastı iyileştirildi.
7. **Otomatik yerel kayıt:** yanlış depo/alt dizin, önceden sahnelenmiş değişiklik,
   riskli dosya ve başarısız Git işleminde betik durur. Yeni klasörlerin içindeki
   riskli dosyalar da taranır. `design-tokens.css` gibi meşru dosyalar engellenmez.
   Bu kontrol dosya adına dayanır; kapsamlı sır/içerik taraması garantisi değildir.
   Gerçek depoda betik çalıştırılmadı; sentetik geçici depolarda sınandı.

## Doğrulama ve sınırlar

`npm run dogrula:codex` bütün aşamalarıyla geçti: tasarım, Astro kontrolü,
üretim/içerik doğrulaması, **270 tarayıcı**, **17 Firebase kuralı**, **32 e-posta**
ve **12 otomatik kayıt** testi başarılı. Son dinleme alıştırması düzeltmesinden
sonra Astro kontrolü ve 870 sayfalık derleme yenilendi; hedefli öğrenci modu
paketi **30/30** geçti. Astro: 0 hata, 0 uyarı, 246 bilgi/öneri.
Medya denetiminin mevcut 75 uyarısı toplu ve ilgisiz değişiklikle kapatılmadı.

`npm run onizle` ile mevcut yerel önizleme sunucusu doğrulandı;
`http://localhost:4399/tr/veli-portali/` HTTP 200 verdi. Giriş ekranı ve
derlenmiş öğrenci modunun masaüstü/mobil ekran görüntüleri gözle incelendi.
Yerel kanıtlar: `D:\tmp\ulucamii-agy-tam-dogrulama.log`,
`D:\tmp\ulucamii-agy-son-check.log`, `D:\tmp\ulucamii-agy-son-build.log`,
`D:\tmp\ulucamii-agy-son-mektep.log`, `D:\tmp\ulucamii-agy-onizle.png`.
`git diff --check` temizdir. Bu sayılar 12 Eylül yerel çalıştırmasına aittir.

46 MP3 dosyasının tamamı `ffprobe` ile okunabildi; süreleri 1,345–5,185 saniye.
Kaynak eşleştirmeleri ve SHA-256 bütünlükleri otomatik testle kontrol edildi.
Portal testleri gerçek kaynak kodunu sentetik aile verileriyle çalıştırır;
Firebase ve dış ağ kapatılır. Masaüstü/mobil, TR/FR/EN, açık/koyu tema,
klavye, ses yarışları ve kopyalama hataları kapsanır.

İngilizce hadis kayıtları ve `kolaylastirin` hadisinin Fransızca kaydı eksiktir.
Fransızca kayıt üretme denemesi sağlayıcıdan sonuç alamadı. Arayüz eksikliği
açıkça belirtir; dosyalar eklendiğinde sonraki derlemede etkinleşir.

Gerçek veli hesabıyla giriş, gerçek telefonda ses kalitesi ve canlı gönderim
sınanmadı. Otomatik erişilebilirlik kontrolü tam erişilebilirlik onayı değildir.
İmpeccable taraması mevcut haftalık karne kartının renkli sol çizgisini estetik
öneri olarak bildirdi; işlev hatası olmadığı ve mevcut tema korunduğu için bırakıldı.

## Sonraki geliştirme öncelikleri

- Eksik dil kayıtlarını üretip içerik ve telaffuzunu dinleyerek onaylamak.
- Gerçek telefonla, izinli deneme hesabında dokunma/ses deneyimini doğrulamak.
- Öğrenme serisi ve veli teyidini cihazlar arasında taşımak istenirse ayrı veri
  modeli ve Firebase kuralı tasarlamak; mevcut yerel veriyi merkezi kayıt sanmamak.

Kaynaklar: [Diyanet Elifba](https://kuran.diyanet.gov.tr/elifba/),
[cezm dersi](https://kuran.diyanet.gov.tr/elifba/templates/dersler/eb/cezm/kavrama.html),
[şedde dersi](https://kuran.diyanet.gov.tr/elifba/templates/dersler/eb/sedde/uygulama.html).
