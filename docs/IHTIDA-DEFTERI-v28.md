# İhtida kayıt defteri

9 Eylül 2026. Ulu Camii'nin özel kayıt ve belge teslim defteri. Diyanet Din
Hizmetleri Uygulama Genelgesi madde 44'teki DHYS kaydının veya EK-9/EK-10'un
yerine geçmez. Birincil kaynak:
https://hukukmusavirligi.diyanet.gov.tr/Documents/DinHizmetleriUygulamaGenelgesi.pdf

## Basılı ve düzenlenebilir nüsha

PDF ve gerçek DOCX aynı kayıt modelinden üretilir. A4 yatay, ay-yıldızlı ve bordo
çift çerçeveli kapak; kullanım/özet sayfası; 50 matbu kayıt sayfası ve sayfa başına
iki kayıt yeri vardır. Yüz kayıt aşılınca ilave blok açılır. Teyit bekleyen ve
iptal edilmiş numarasız başvurular ayrı eklerdedir. Uzun notlar kaybolmadan ekte
yer alır. Dosyalarda kimlik numarası, fotoğraf, imza görseli ve iletişim bilgisi yoktur.

Ay-yıldız geometrisi: https://commons.wikimedia.org/wiki/File:Flag_of_Turkey.svg
(kamu malı SVG çizimi; kapakta bordo olarak kullanılır).

## Otomatik aktarım

- Yeni Ulu Camii başvurusu önce bekleyenler ekine girer. Tören tarihi tercihi
  gerçekleşmiş ihtida sayılmaz. Diğer camilere ait başvurular bu deftere alınmaz.
- Yetkili panelde merasimi ve gerçek tarihi doğrulayınca `UC-YYYY-NNNN` cami içi
  sıra numarası verilir. Bu numara EK-9/DHYS numarası değildir; yeniden kaydetme
  veya sonraki durum değişikliği numarayı değiştirmez.
- Müşavirlik gönderimi, dönüş ve teslim ayrı alanlardır. Sunucu gerçek tarih,
  zorunlu alan ve tarih sırasını kontrol eder.
- Dakikalık görev, kaynak satırları ve işlem bilgileri değiştiğinde özel Drive
  alt klasöründeki PDF/DOCX'i aynı kimliklerde günceller. Görev kısa bir kilitle
  diğer kayıt işlemleriyle sıraya girer. Hatalı üretim eski dosyayı güncel göstermez.
- Başvuru verileri özel mevcut kayıt tablosunda, defter işlem bilgileri özel
  JSON dosyasında tutulur. Bozuk metadata sessizce sıfırlanmaz. Test başvuruları
  (adı `TEST ` veya `TEST-`/`TEST_` ile başlayanlar) deftere alınmaz.
- Defterin tamamı başvurana veya başka camiye e-posta ile gönderilmez.

Panel: **Başvurular → İhtida Defteri → Word indir / PDF indir**. Güncelleme
bekleniyorsa indirme bekletilir; Yenile ile son durum alınır. İndirilen Word'e
yapılan yerel düzenlemeler sisteme aktarılmaz. Kalıcı düzeltme panelde yapılmalıdır.

## Kurulum ve sınama

`npm run ihtida:gas-derle` v28 tek dosyasını `.codex/cikti/gas` altına üretir.
Derleme yayın değildir. Yetkili dernek hesabında web uygulaması v28 kaynağıyla
güncellendikten sonra `ihtidaPaketKur()` ve `ihtidaDefteriKur()` bir kez çalıştırılır.
Kimlik/erişim ve dağıtım URL'si korunur. Defter görevini ilk kez
`ihtidaDefteriKuyrukCalistir()` çalıştırarak da başlatmak mümkündür.

VM testleri: yetki, gerçek tarih/onay, mükerrer ve tükenen numara, bozuk metadata,
500'den fazla kayıt, dosya kimliği korunması, eski dosyanın indirilmemesi ve kilit.
Belge testleri: yatay 53 sayfalık sentetik defter, boş kayıt alanları, ayrı bekleyen
eki, XML/ZIP geçerliliği, Word gövdesi ve uzun notların korunması. Word ayrıca
masaüstü Word ile açılarak PDF'ye dönüştürülür; sentetik sayfalar görsel incelenir.
Canlı kayıtlar ve teslim dosyaları Git'e eklenmez.
