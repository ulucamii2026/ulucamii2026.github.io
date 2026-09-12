# Mektep Çalışma Odası & Öğrenci Modu Kalıcı Kararları

Güncelleme: 12 Eylül 2026.
Amaç: Veli Portalı içinde çocukların müfredata uygun, etkileşimli, güvenli ve teşvik edici bir mektep odasına kavuşturulması.

## 1. Çocuk Mahremiyeti ve RGPD Kararı (Kalıcı)
- Belçika ve Avrupa Birliği veri koruma standartları (RGPD) gereğince çocukların vesikalık, kimlik veya kamera fotoğrafları veri tabanında tutulmaz ve kaynak koda eklenmez.
- Her talebe için adı ve soyadının baş harflerinden (`toLocaleUpperCase('tr-TR')`) ve öğrenci referans kodundan türetilen deterministik renkli monogram avatarlar (`r-iznik`, `r-kiremit`, `r-adacayi`, `r-ochre`) kullanılır.

## 2. Ezber & Dinleme Odası
- Müfredattaki 15 Kur'an sûresi (Fâtiha, Âyetü’l-Kürsî, İnşirâh, Kadir, Asr, Fîl, Kureyş, Mâûn, Kevser, Kâfirûn, Nasr, Tebbet, İhlâs, Felak, Nâs) ve 4 temel namaz duası (Sübhâneke, Ettehiyyâtü, Salli-Bârik, Rabbenâ) tam harekeli Amiri Arapça hattıyla yer alır.
- Türkçe, Fransızca ve İngilizce transkripsiyonlu okunuş ve mealler sunulur.
- Doğrudan ses dinleme, 0.8x/1.0x hız ayarı ve öğrencinin gayretini ödüllendiren `localStorage` tabanlı `+1 ⭐` yıldız sayacı içerir.

## 3. İnteraktif Elif-Bâ ve Harekeler
- 28 Arapça harf, müfredatın 5 grubuna (Elif, Hı, Şîn, Ayn, Lâm) göre filtrelenebilir.
- Harflerin yalın, başta, ortada ve sonda yazılışları gösterilir; kalın ve peltek harfler rozetlerle ayrılır.
- Her harf için Üstün (َ), Esre (ِ), Ötre (ُ) ve Cezm (ْ) harekeli okunuş kartları bulunur.
- Mikro etkileşimlerde Web Audio API kullanılır. Elifba ve tilavet yalnız resmî Diyanet kayıtlarından çalınır; tarayıcı TTS yedeği kullanılmaz.

## 4. Çok Dilli Haftalık Mini Bilgi Yarışması (Quiz)
- *Camiye Gidiyorum 1* ünite kazanımlarına ve Elif-Bâ bahçesine dayalı 10 soruluk tam soru havuzu (İslam'ın ve İmanın şartları, Abdest, Namaz, Peygamberimiz Hz. Muhammed s.a.v., Kur'an, Elif-Bâ harfleri ve Güzel Ahlak).
- TR, FR ve EN dillerinde soru, seçenekler ve açıklamalar.
- Doğru cevapta melodik başarı sesi ve konfeti, yanlış cevapta eğitici ipucu, test sonunda kupa animasyonu (`🏆`), dinamik başarı rozeti (`🎯 X / 10 Doğru Cevap`) ve yeniden çözme imkânı.

## 5. Hoca Paneli ile Eşgüdümlü Başarı Rozetleri
- Kur'an Yolculuğu: Harflerden Kur'an-ı Kerim / Amme cüzüne uzanan 6 basamak.
- Standart rozetler (İlk Adım, Elif-Bâ Yıldızı, Dua Ustası, Kur’an Yolcusu, Düzenli Talebe).
- Hoca ekranından (`src/scripts/hoca-ekrani.ts`) hocanın talebeye takdim ettiği özel başarı rozetleri (⭐ Haftanın Yıldızı, 📖 Ezber Şampiyonu, 🌸 Güzel Ahlak, 🏆 Üstün Gayret, 🏅 Düzenli Devam) öğrenci odasında parıldayarak gösterilir.

## 6. Diyanet Resmî Sesleri ve Görsel/Hareketli Mimari
- **Resmî Diyanet Elifba Sesleri (`public/media/ses/elifba/`):** 28 harfin tamamı Diyanet İşleri Başkanlığı'nın resmi Kur'an portalından (`kuran.diyanet.gov.tr/elifba`) yerel olarak indirildi ve projeye dahil edildi. Harfe tıklandığında yerel Diyanet kaydı çalar. Ses yüklenemezse hata gösterilir; farklı kaynağa veya cihaz TTS sesine geçilmez.
- **Özgün Mektep İllüstrasyonları (`public/media/mektep/`):** İznik çinileri, rahleler, fenerler ve basamaklı yollarla hazırlanan 1280px optimize WebP görselleri (mektep odası hero banner, Elifba bahçesi, ezber ve dua köşesi, Kur'an basamak yolu, başarı kupası).
- **Hareketli Kutlama ve Parıltı GIF'i:** Yarışma bitişi ve tebrik anları için şeffaf arka planlı, akıcı döngülü `tebrik-kutlama.gif` konfeti ve altın yıldız ışıltısı.
- **Üç Boyutlu Başarı Rozetleri:** Haftanın Yıldızı, Kur'an Rehberi, Güzel Ahlak, Kur’an-ı Kerim / Hatim ve İstikrarlı Devam madalyaları için yüksek çözünürlüklü özel WebP rozet illüstrasyonları (`rozet-yildiz.webp`, `rozet-kuran.webp`, `rozet-ahlak.webp`, `rozet-hatim.webp`, `rozet-devam.webp`).

## 7. Namaz Duaları ve Sûre Sesleri Altyapısı (Kalıcı Karar)
- **4 Temel Namaz Duası (`public/media/ses/dualar/`):** Sübhâneke (`subhaneke.mp3`), Ettehiyyâtü (`tahiyyat.mp3`), Allâhümme Salli & Bârik (`sallibarik.mp3`) ve Rabbenâ Âtinâ & Rabbenâğfirlî (`rabbena.mp3` — Bakara 201 + İbrahim 41 Diyanet resmî tilaveti) duaları yerel dizine aktarıldı.
- **15 Kur'an Sûresi (`public/media/ses/sureler/`):** Fâtiha, Âyetü’l-Kürsî, İnşirâh, Kadir, Asr, Fîl, Kureyş, Mâûn, Kevser, Kâfirûn, Nasr, Tebbet, İhlâs, Felak, Nâs sesleri dış CDN bağımlılığından kurtarılarak yerel dizine aktarıldı. Sesler siteyle aynı kaynaktan sunulur. Bu, çevrimdışı çalışma garantisi değildir; sesleri çevrimdışı önbelleğe alan bir servis çalışanı bu kapsamda kurulmadı.
- **Dua Metni Doğruluğu:** Rabbenâ duası Arapça metnindeki yazım kontrol edildi ve tashih edildi.

## 8. Ses Senkronizasyonu & Çakışma Önleme
- Öğrenci bir sûre veya dua dinlerken aynı anda Elif-Bâ harfine basarsa, çalan ezber sesi anında durdurulur (`audio.ezber-audio.pause()`).
- Tersi durumda, ezber oynatıcısında ses başladığında capture listener ile aktif harf sesi kesilir (`aktifAudio.pause()`). İki ses asla üst üste binmez.

## 9. Elif-Bâ Klavye & WAI-ARIA Erişilebilirliği
- 28 harflik Elif-Bâ tahtasında sağ ve sol ok tuşlarıyla (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) akıcı gezinim sağlandı. Harf butonları arasında dolaşırken seçili harf anında güncellenir, detaylar açılır ve telaffuz sesi tetiklenir.

## 10. Diyanet Elifba He/Vav Ses Eşleşmesi ve Harekeli Okunuş Ayrımı (Kalıcı Karar)
- **He ve Vav Sıralaması:** Diyanet Elifba portalında (`kuran.diyanet.gov.tr/elifba`) 26. buton `btn_26.mp3` = **He (هـ)** (14.045 bayt), 27. buton `btn_27.mp3` = **Vav (و)** (18.852 bayt) olarak yer almaktadır. `src/lib/elifba-verisi.ts` içindeki `ELIFBA_HARFLERI` dizisi de Diyanet Elifba Cüzü sırasına (`nun -> he -> vav -> ye`) getirilerek hem görsel tahta sırası hem ses eşleşmesi `%100 MATCH` olarak tam hizalanmıştır.
- **Harekeli Kart Fonetiği:** Harf butonuna basıldığında harfin talim ismi (Diyanet MP3) okunurken, altındaki harekeli (üstün, esre, ötre, cezm) kutucuklara tıklandığında harfin yalın ismi DEĞİL, doğrudan ilgili Diyanet ses kaydı çalınır. Cezm kartı, resmî örnekteki tam metni gösterir; şedde alıştırmaları ayrı açılır bölümde sunulur.
- **Sûre Seçiminde Ses Temizliği:** Ezber odasında sûre/dua açılır menüsü değiştiğinde sayfadaki tüm aktif sesler anında durdurulur ve başa sarılır (`a.pause(); a.currentTime = 0;`).
- **Quiz Dinamik Başarı Skoru:** Mini test tamamlandığında talebenin doğru sayısı hesaplanır ve başarı kupasının hemen altında üç dilli dinamik başarı rozeti (`🎯 X / 10 Doğru Cevap` / `Bonnes réponses` / `Correct answers`) sergilenir.

## 11. Pedagojik Ses Hızı, Konum Butonları ve Konfeti Kutlaması (Kalıcı Karar)
- **0.8x Yavaş Dinleme Desteği:** Ezber Odası'nda çocukların tecvid ve mahreçleri daha rahat takip edebilmesi için `0.8x Yavaş` ve `1.0x Normal` hız butonları eklenmiştir. Seçilen hız (`durum.ezberHizi`), hem buton tıklandığında hem de ses başladığında `playbackRate` üzerinden otomatik uygulanır.
- **Harf Konumlarının Etkileşimi:** Elif-Bâ tahtasında başta, ortada ve sonda yazılış kutucukları tıklanabilir butonlara dönüştürülmüştür. Çocuk harfin hangi formuna dokunursa dokunsun ilgili harfin Diyanet talim sesi tetiklenir.
- **Dinamik Konfeti Yağmuru:** Doğru quiz cevaplarında, mini yarışma bitişinde ve tekrar butonuna basıldığında ekranda 32 parçacıklı hafif CSS konfeti efekti tetiklenir; `prefers-reduced-motion` kullanıcılarında animasyon kapatılır.

## 12. Kur'an-ı Kerim Sûre ve Âyet Seslerinde Resmî Diyanet Kaynağı İlkesi (Kalıcı Karar, 11 Eylül 2026)
- **Zorunlu Kaynak:** Portal ve Mektep Odası'ndaki tüm Kur'an sûre ve âyet sesleri istisnasız ve her zaman Diyanet İşleri Başkanlığı'nın resmî Kur'an portalı sunucusundan (`https://webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/` — Davut Kaya / Osman Şahin) temin edilir.
- **Doğrulanan Varlıklar (15 Sûre + Rabbenâ Duası, Tamamı Besmele + Âyet Birleşimli):**
  - `fatiha.mp3` (Besmele 1_0 + Ayetler 1_1–1_7, 266.552 bayt)
  - `ayetel-kursi.mp3` (Bakara 2_255, 308.491 bayt)
  - `insirah.mp3` (Besmele 1_0 + Ayetler 94_1–94_8, 192.349 bayt)
  - `kadir.mp3` (Besmele 1_0 + Ayetler 97_1–97_5, 209.375 bayt)
  - `asr.mp3` (Besmele 1_0 + Ayetler 103_1–103_3, 121.529 bayt)
  - `fil.mp3` (Besmele 1_0 + Ayetler 105_1–105_5, 183.252 bayt)
  - `kureys.mp3` (Besmele 1_0 + Ayetler 106_1–106_4, 152.390 bayt)
  - `maun.mp3` (Besmele 1_0 + Ayetler 107_1–107_7, 219.690 bayt)
  - `kevser.mp3` (Besmele 1_0 + Ayetler 108_1–108_3, 99.168 bayt)
  - `kafirun.mp3` (Besmele 1_0 + Ayetler 109_1–109_6, 223.622 bayt)
  - `nasr.mp3` (Besmele 1_0 + Ayetler 110_1–110_3, 152.771 bayt)
  - `tebbet.mp3` (Besmele 1_0 + Ayetler 111_1–111_5, 177.401 bayt)
  - `ihlas.mp3` (Besmele 1_0 + Ayetler 112_1–112_4, 104.743 bayt)
  - `felak.mp3` (Besmele 1_0 + Ayetler 113_1–113_5, 149.291 bayt)
  - `nas.mp3` (Besmele 1_0 + Ayetler 114_1–114_6, 192.275 bayt)
  - `rabbena.mp3` (Bakara 2_201 + İbrahim 14_41, 136.956 bayt)
- Üçüncü taraf veya teyit edilmemiş ses kaynakları projeye sokulamaz; yerel varlıklar her zaman bu Diyanet resmî kaynaklarıyla güncel tutulur.

## 13. Günün Keşfi: Günün Harfi & Nebevî Ahlâk Hadisleri (Kalıcı Karar, 11 Eylül 2026)
- **Deterministik Günlük Seçim:** Her gün hem çocuk hem veli için takvim gününe göre belirlenen Günün Harfi (`gununHarfiGetir`) ve Günün Hadis-i Şerifi (`gununHadisiGetir`) sunulur.
- **10 Nebevî Hadis Kütüphanesi (`src/lib/hadis-verisi.ts`):** Tebessüm, Kur’ân sevgisi, temizlik, saygı ve merhamet, doğruluk, hediyeleşme, teşekkür ve şükür, tatlı dil, komşuluk hakkı ve kolaylaştırma temalarında, resmî hadis kaynakları (Buhârî, Müslim, Tirmizî, Ebû Dâvûd) ve tam tashkeel'li Arapça metinleriyle yer alır.
- **Dokunarak Dinleme:** Günün harfine dokunulduğunda anında Diyanet İşleri Başkanlığı'nın resmi harf tilaveti çalar.

## 14. Harf Kulak Talimi ("Dinle ve Bul") & Etkileşimli Dokunma Sesleri (Kalıcı Karar, 11 Eylül 2026)
- **İşitsel Hafıza & Pekiştirme:** Diyanet Elifba portalının "Harfler ve Pekiştirme" pedagojisi esas alınarak 4 seçenekli interaktif kulak talimi oyunu geliştirilmiştir. Çocuk "Sesi Dinle 🔊" butonuna bastığında Diyanet tilavetini dinler ve doğru harfe dokunur.
- **Sıfır Gecikmeli Web Audio API Efektleri:**
  - `kutlamaSesiCal()`: Doğru cevaplarda ve tekrar sayımlarında çalan 4 kademeli zafer melodisi.
  - `hataSesiCal()`: Yanlış seçimlerde çocuğu korkutmayan, eğitici yumuşak bas uyarı tonu (280Hz -> 180Hz).
  - `pariltiSesiCal()`: Yıldız sayacına, Kur'an basamaklarına veya başarı rozetlerine dokunulduğunda çalan 5 tonlu sihirli parıltı çanı (chimes).
  - Kullanılmayan `harekeTonuCal()` 12 Eylül incelemesinde kaldırıldı; telaffuz için resmî ses kayıtları kullanılır.
## 15. Diyanet Resmî Harekeli Sesleri (Üstün, Esre, Ötre) & Pedagojik Ritim (Kalıcı Karar, 11 Eylül 2026)
- **28 Harfin Üstün (Fetha) Sesleri (`public/media/ses/elifba/ustun/`):** Diyanet Elifba portalı `harfler/sesleri/btn_{1..28}.mp3` kaynağından 28 harfin tamamı yerel dizine indirildi.
- **28 Harfin Esre (Kesra) Sesleri (`public/media/ses/elifba/esre/`):** Diyanet Elifba portalı `kesra/kesra/btn_{1..28}.mp3` kaynağından 28 harfin tamamı yerel dizine indirildi.
- **28 Harfin Ötre (Damme) Sesleri (`public/media/ses/elifba/otre/`):** Diyanet Elifba portalı `damme/damme/btn_{1..28}.mp3` kaynağından 28 harfin tamamı yerel dizine indirildi.
- **Cezm ve Şedde (12 Eylül düzeltmesi):** Ses kesme/tekrarlama veya yapay telaffuz yerine resmî Diyanet cezm dersindeki 28 metin/ses çifti ve şedde dersindeki 18 kelime/ifade kullanılır. Şedde örnekleri harf başına uydurulmaz; ayrı açılır alanda Diyanet metniyle sunulur. Eşleşmeler: `src/data/elifba-alistirmalari.json`; aktarım: `scripts/elifba-alistirmalari-aktar.py`.
- Elifba telaffuzları resmî Diyanet kayıtlarından gelir; cihazın Arapça ses paketine bağlı değildir. Çeviri sesleri ve arayüz efektleri tilavet kaydı değildir.

## 16. Çift Dilli Öğrenim, Fransızca Mealler ve Gemini 3.1 Flash TTS (Kalıcı Karar, 11 Eylül 2026)
- **Çift Dilli Görünüm:** Belçika'da büyüyen talebelerin iki dilli öğrenim ihtiyacı gözetilerek, Türkçe arayüzde hem Türkçe Anlamı hem de altında Fransızca Tercümesi (`Traduction française`) bir arada sunulur.
- **Gemini 3.1 Flash TTS (`gemini-3.1-flash-tts-preview`):** 19 sûre ve duanın (15 Kur'an sûresi + 4 namaz duası) Fransızca anlam kayıtları `public/media/ses/mealler/fr/` altındadır. Fransızca dinleme düğmesi bu yerel dosyaları kullanır; gecikme bağlantı ve cihaza bağlıdır.
- **4 Kademeli Hız Kumandası:** Ezber odasındaki oynatıcıya 0.75x (Lent/Yavaş), 1.0x (Normal), 1.25x (Rapide/Hızlı) ve 1.5x (Très rapide/Çok Hızlı) seçenekleri eklenmiş ve anlık `playbackRate` senkronizasyonu sağlanmıştır.


## 17. Ses, Karne ve Erişilebilirlik Denetimi (12 Eylül 2026)

- Ses geçişleri tek istek kimliğiyle yönetilir; iptal edilmiş kaydın gecikmiş hatası yeni sesi etkileyemez. Metni gizleme, döngü ve hız düğmeleri oynatıcıyı yeniden çizmez; konum ve klavye odağı korunur.
- Hadis seslerinin varlığı derlemede gerçek dosyalardan belirlenir (`Veli.astro → hadisSesleri`). İlk incelemede eksik olan 10 İngilizce ve `kolaylastirin` hadisinin Fransızca kaydı, aynı gün Windows SAPI ile üretilip eklendi. Bunlar anlamın otomatik seslendirmesidir; tilavet değildir. Kaynak/motor/hash bilgileri `src/data/hadis-anlam-sesleri.json` içinde tutulur.
- Panoya kopyalama gerçek sonuca göre başarı/hata bildirir; API reddinde yedek yol denenir, geçici alan ve odak temizlenir (`src/lib/pano.ts`).
- Haftalık karne yalnız Brüksel takvimindeki bu haftanın girilmiş yoklamalarını toplar; cumartesi ve pazar ders/ezberlerini birlikte gösterir. Geçmiş hafta kaydı bu haftanın sonucu diye sunulmaz.
- Açık/koyu tema kontrastı, klavye, gizli metnin ekran okuyucudan da gizlenmesi ve iç içe düğme kusurları düzeltildi.
- Gerçek portal kodunu sentetik aileyle çalıştıran test: `tests/web/mektep-islev.spec.mjs`. Firebase ve dış ağ kapalıdır. Bu, gerçek veli hesabıyla giriş veya gerçek cihazda ses dinleme kanıtı değildir.

Kaynaklar: [Diyanet Elifba](https://kuran.diyanet.gov.tr/elifba/),
[cezm örnekleri](https://kuran.diyanet.gov.tr/elifba/templates/dersler/eb/cezm/kavrama.html),
[şedde örnekleri](https://kuran.diyanet.gov.tr/elifba/templates/dersler/eb/sedde/uygulama.html).
Ayrıntılı kapsam ve kontrol sonucu: [oturum incelemesi](AGY-OTURUM-INCELEMESI-2026-09-12.md).

## 18. Birlikte Öğrenme Atölyesi (12 Eylül 2026)

65 etkinlik, günlük üç adım, yerel aralıklı tekrar, sekiz aile rehberi, hazırlık
kontrolü ve haftalık yazdırma eklendi. Yeni alan eski araçları korur; hocanın
merkezî değerlendirmesine öz beyan yazmaz. Ayrıntı ve test kanıtları:
[Atölye](VELI-OGRENCI-ATOLYESI.md). Araştırma ve öneriler:
[Pedagojik rapor](VELI-OGRENCI-PEDAGOJIK-ARASTIRMA.md).
