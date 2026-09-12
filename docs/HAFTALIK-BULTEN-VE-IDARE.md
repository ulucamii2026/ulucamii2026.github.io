# Haftalık bülten ve idari kayıt araçları

12 Eylül 2026. Yazılı **bulletin de classe** defterinin ayrıntılı içeriği daha sonra
kararlaştırılacak; bu sürüm portal, çıktı ve okuma takibi altyapısını hazırlar.

## Hoca için kullanım

1. `/hoca/` → **Bülten · İdare** → öğrenci ve ders haftası seçilir.
2. Yeni taslak, ilgili haftanın ders planından ve varsa ödev kaydından hazırlanır.
   Var olan bülten kendiliğinden güncellenmez; yayımlanan belge bir haftanın sabit
   kopyasıdır. Kitap/sayfa, getirilecek malzemeler ve aileye not düzenlenebilir.
3. **Önizle**, ardından **Taslak kaydet** veya **Kaydet ve veliye göster** kullanılır.
   Taslak velilere kapalıdır. Yayımlama e-posta göndermez.
4. **Yazdır / PDF kaydet** tarayıcının A4 çıktısını açar. Aile notu ve ıslak imza
   alanları boş bırakılır. Örnek: `output/pdf/Haftalik-Bulten-Ornegi.pdf`.
5. Bülten yeniden yüklenerek hangi velinin hangi sürümü okuduğu görülür.

Arayüz TR/FR/EN dilindedir. Bülten metninin dili hocanın seçimi ve yazdığı içeriktir;
Türkçe planı Fransızcaya çevirmiş gibi göstermez. İçerik dili sayfanın dilinden
farklıysa belirtilir. Velilerin kayıtlı **iletişim dili** veya e-posta tercihi değişmez.

## Veli için kullanım

Veli modunda öğrenci seçilince **Haftalık bülten** görünür. Geçmiş yayımlanmış
haftalar seçilebilir; yalnız o öğrencinin bülteni yazdırılır. **Okudum**, ilgili
velinin hesabı ve sürüm numarasıyla sunucu zamanında kaydedilir. Aynı sürümü tekrar
işaretlemek kaydı şişirmez. Metin güncellenince yeni sürüm yeniden okunmalıdır.
Bu bildirim ıslak imza yerine geçiyormuş gibi sunulmaz; imza görüntüsü alınmaz.

## İdari işlemler

Öğrenciler sekmesindeki veli ekleme/kaldırma da tek transaction kullanır.
Bağlantı kesilirse öğrenci ve aile arasında yarım kayıt kalmaz. Var olan ailenin
dili, diğer çocukları ve kitap tercihleri ekleme sırasında değiştirilmez.
İdari silme kilidi varken aynı öğrenciye veli bağlantısı eklenemez/kaldırılamaz.

Aynı hoca bölümündeki **İdari kayıt dökümü ve temizlik**, seçili öğrencinin
yoklama, ilerleme, değerlendirme, not, mesaj, ev çalışması, bülten ve bülten okuma
kayıtlarını sayar. Dökümü açmak salt okunurdur. JSON indirme yalnız seçili öğrenci
verilerini içerir; aile bölümünde kardeşlerin verisi dışarı aktarılmaz.

Silme iki kapsamdadır: yalnız evde çalışma kayıtları veya öğrencinin tüm portal
kayıtları ile veli bağlantıları. Öğrenci kodu yazılır ve son işlem özeti onaylanır.
Ortak veli hesabı ve kardeşlerin kitap tercihleri/bağlantıları korunur. Bu araç
Firebase Authentication giriş hesabını, asıl kayıt defterini, gönderilmiş
e-postaları, indirilen dosyaları ve cihazın yerel kayıtlarını silmez. Asıl kayıt
defteri değiştirilmezse sonraki aktarım öğrenciyi yeniden oluşturabilir.
Yalnız ev çalışması temizliğinde cihazda bekleyen eşleştirmeler veya yeni çalışmalar
hesapta yeniden kayıt oluşturabilir.

Silme sırasında `portalSilme/{ref}` kilidi yeni ders/ev çalışması/bülten yazılarını
engeller. İncelemeden sonra değişen dökümde silme durur. İncelenen belgeler ve aile
bağlantıları tek Firestore transaction içinde kaldırılır. 400 yazma üzerindeki
döküm hiçbir kayıt silinmeden yönetici bakımına yönlendirilir. Başarısız işlemin
kilidi bağlantı izin veriyorsa kaldırılır; kesintide kalan kilit 15 dakika sonra
hoca ekranından kaldırılıp döküm yeniden incelenebilir. Canlıda gerçek öğrenci
silme işlemi bu geliştirme sırasında uygulanmaz.

Sunucu yetkili dış aktarımlar (Admin SDK / asıl kayıt defteri) güvenlik kurallarını
atlayabilir. Kalıcı kayıt kapatma talebinde dış aktarım kaynağı da yönetici tarafından
ele alınır; bu ekran tüm dış sistemlerden silindiği iddiasında bulunmaz.

## Veri modeli ve denetim

- `bultenler/{ref}/haftalar/{ilkDersTarihi}`: hafta, dil, dört metin, yayın durumu,
  sürüm ve sunucu güncelleme zamanı. İlk sürüm 1; her kaydetmede bir artar.
- Altındaki `okumalar/{veliEposta}`: yalnız sürüm ve sunucu zamanı. Veli başka
  velinin okuma kaydını okuyamaz/yazamaz. Hoca okuma dökümünü görebilir.
- Bozuk/uzun metin, bilinmeyen alan, eski sürüm, başka öğrenci, taslak ve sahte
  istemci saati kurallarla reddedilir. Gecikmiş yanıt öğrenci değişiminde taşınmaz.
- `src/lib/haftalik-bulten.ts`, `src/lib/portal-idare.ts`: veri işlemleri;
  `src/scripts/bulten-gorunumu.ts`, `src/scripts/hoca-bulten.ts`: arayüz;
  `src/i18n/bulten.ts`, `src/styles/haftalik-bulten.css`: dil ve görünüm.
- `tests/web/bulten-idare.spec.mjs`: sahte kayıtlarla tarayıcı akışları;
  `tests/kurallar/firestore.test.mjs`: yalnız demo emülatöründe yetki ve gerçek
  transaction ile silme/sürüm çakışması. Canlı kayıt okunmaz veya silinmez.

Teknik dayanak: [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions),
[üst belge silmenin alt koleksiyonları silmemesi](https://firebase.google.com/docs/firestore/manage-data/delete-data#delete_documents).

## Yayın ve doğrulama

12 Eylül 2026 doğrulaması:

- `npm run dogrula:codex`: bütün aşamalar geçti; 324 web, 30 güvenlik,
  32 e-posta, 12 otomatik kayıt ve 7 öğrenme testi. 870 sayfa derlendi.
- Son veli bağı düzeltmesinden sonra `npm run check` tekrar hatasız/uyarısız;
  yeniden build ve bülten/idare + giriş + öğrenme eşleştirmesi için 56 hedefli
  tarayıcı testi geçti. Bu 56 test genel taramayla örtüşür; toplamına eklenmez.
- Mobil/masaüstü, açık/koyu tema, azaltılmış hareket ve axe kontrolü; PDF
  tek A4 sayfa olarak görsel inceleme ve metin çıkarımıyla doğrulandı.
- Mekanik tasarım denetçisi bu eklemede bulgu üretmedi. Bu sonuç tek başına
  tüm erişilebilirliğin veya tüm fiziksel telefonların doğrulandığı anlamına gelmez.
- Firestore kuralları 12 Eylül 2026 **15:48:52 UTC** yayımlandı ve sunucudan
  geri okunarak yerelle eşleşti. Ruleset: `5ee379a3-6dc9-4499-9d15-4d1123296be7`.
  Normalize SHA-256: `ae0e40a777f7d4f9de1fef93b26ea2a69729027bc3c7b342385b1209dd9f5ac9`.
- Testler gerçek öğrenci veya veli hesabını değiştirmedi; canlıda bülten
  gönderimi, veli adına okudum veya kayıt silme denemesi yapılmadı.

Yerel kanıtlar: `D:/tmp/ulucamii-bulten-son-kapi.log`,
`D:/tmp/ulucamii-bulten-final-web.log`, `D:/tmp/ulucamii-bulten-final-check.log`.
Site yayını [deponun Pages iş akışında](https://github.com/ulucamii2026/ulucamii2026.github.io/actions)
izlenir; yayımdan sonra dört portal/hoca rotasının giriş JS dosyaları ve bülten
modüllerinin hash karşılaştırması `D:/tmp/ulucamii-bulten-canli.json` içine yazılır.
