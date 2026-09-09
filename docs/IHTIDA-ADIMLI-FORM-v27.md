# İhtida başvurusu — v27

9 Eylül 2026. Kullanıcının onayladığı EK-10 ve dilekçe tasarımları ile adımlı form birlikte yayımlanır.

## Başvuru deneyimi

- TR, FR ve EN formları yedi adım, ilerleme çubuğu, geri/devam ve bütün formu göster seçenekleri sunar.
- Devam yalnız açık adımı doğrular; son gönderim bütün alanları tekrar denetler ve ilk hatalı adımı açar.
- Özet bağlantıları ilgili bölüme ve alana döner. İlk adımlarda Enter başvuruyu göndermez.
- Yazılı taslak eski yerel depolama düzenini korur. Görseller, imza ve rıza işaretleri taslağa kaydedilmez.
- Görsel işleme sürerken ilerleme durur. Gizlenen imza tuvali boyut değiştirmez; imza kırpılmaz.
- Belge yükleme durum metninin koyu tema kontrastı düzeltildi. Adım düğmeleri klavye ve azaltılmış hareket tercihini destekler.

## PDF ve rıza

- Yeni EK-10 iki sayfada TR/FR/EN/NL metin ve yalnız ikinci sayfada ortak ad, tarih, imza içerir.
- Form rızası `ek10Surumu: '2026-09-09'` ile kaydedilir. Çizili imza için ayrı `imzaAktarimIzni: true` gerekir; elle imzalamada kesin `false` gönderilir.
- İmza izni EK-9, EK-10 ve dilekçeyle sınırlıdır. Eski kayıtların rızası yeni metne dönüştürülmez; eski EK-10 şablonu `-v1.pdf` olarak korunur.
- Dilekçe normalde tek A4’tür; uzun ad, e-posta, cami veya posta adresleri kesilmeden devam sayfasına akar. İmza ile yazılı ad ayrı alanlardadır.
- Normal tam paket altı sayfadır: EK-9 (2), EK-10 (2), dilekçe (1), kimlik örneği (1). Uzun açıklama ve kimlik PDF eki gerektiğinde sayfa sayısını artırabilir.
- Ön başvuruda gerçekleşmiş tören beyanı veya gerçek ihtida tarihi üretilmez. Kayıtlı beyan tarihi sonraki PDF üretiminde korunur.

## Cami seçimi ve işleyiş

`docs/IHTIDA-CAMI-SECIMI-v26.md` kapsamındaki katalog, manuel cami ve teslim seçimi bu sürüme dahildir. Başka camide iki farklı şahit adı zorunludur; yerel şahit imzaları yedek olarak kullanılmaz.

Başvuruyu Ulu Camii ekibi takip eder. Başka cami seçimi o camiye otomatik e-posta göndermez. Mevcut arşiv ve üç alıcılı gönderim akışı korunur; admin paneli aynı PDF’yi ve alıcı bazında teslim durumunu gösterir.

## Dağıtım ve doğrulama

- Form en az GAS v27 ve hazır PDF kuyruğu ister. Eski istemcilerin sürümsüz rızası geçiş sırasında v1 olarak kabul edilir.
- Üretim kaynağı `scripts/apps-script/ulucamii-Kod-v27.gs`; paket derlemesi `npm run ihtida:gas-derle` ile oluşturulur.
- Önce GAS sürümü ve kuyruk kurulum işareti, sonra Pages dağıtımı güncellenir. Dernek hesapları kullanılır.
- Yerel kalite kapısı `npm run dogrula:codex`; ayrı PDF tasarım testleri bu zincire dahildir. Canlı teslim doğrulaması yerel testten ayrı yapılır.

Gerçek başvurular, kimlik görüntüleri, imzalar ve canlı oturum bilgileri bu belgeye veya kaynak kontrolüne eklenmez.
