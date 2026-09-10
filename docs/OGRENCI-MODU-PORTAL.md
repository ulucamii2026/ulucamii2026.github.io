# Mektep Çalışma Odası & Öğrenci Modu Kalıcı Kararları

Güncelleme: 11 Eylül 2026.
Amaç: Veli Portalı içinde çocukların müfredata uygun, etkileşimli, güvenli ve teşvik edici bir mektep odasına kavuşturulması.

## 1. Çocuk Mahremiyeti ve RGPD Kararı (Kalıcı)
- Belçika ve Avrupa Birliği veri koruma standartları (RGPD) gereğince çocukların vesikalık, kimlik veya kamera fotoğrafları veri tabanında tutulmaz ve kaynak koda eklenmez.
- Her talebe için adı ve soyadının baş harflerinden (`toLocaleUpperCase('tr-TR')`) ve öğrenci referans kodundan türetilen deterministik renkli monogram avatarlar (`r-iznik`, `r-kiremit`, `r-adacayi`, `r-ochre`) kullanılır.

## 2. Ezber & Dinleme Odası
- Müfredattaki 10 temel sure ve dua (Fâtiha, İhlâs, Felak, Nâs, Kevser, Âyetü’l-Kürsî, Sübhâneke, Tahiyyât, Salli-Bârik, Rabbenâ) tam harekeli Amiri Arapça hattıyla yer alır.
- Türkçe, Fransızca ve İngilizce transkripsiyonlu okunuş ve mealler sunulur.
- Doğrudan ses dinleme ve öğrencinin gayretini ödüllendiren `localStorage` tabanlı `+1 ⭐` yıldız sayacı içerir.

## 3. İnteraktif Elif-Bâ ve Harekeler
- 28 Arapça harf, müfredatın 5 grubuna (Elif, Hı, Şîn, Ayn, Lâm) göre filtrelenebilir.
- Harflerin yalın, başta, ortada ve sonda yazılışları gösterilir; kalın ve peltek harfler rozetlerle ayrılır.
- Her harf için Üstün (َ), Esre (ِ), Ötre (ُ) ve Cezm (ْ) harekeli okunuş kartları bulunur.
- Web Audio API ile sıfır gecikmeli mikro ton ve Web Speech API ile Arapça telaffuz desteği mevcuttur.

## 4. Çok Dilli Haftalık Mini Bilgi Yarışması (Quiz)
- *Camiye Gidiyorum 1* ünite kazanımlarına dayalı 10 soruluk zengin soru havuzu (İslam'ın ve İmanın şartları, Abdest, Namaz, Peygamberimiz Hz. Muhammed s.a.v., Kur'an ve Güzel Ahlak).
- TR, FR ve EN dillerinde soru, seçenekler ve açıklamalar.
- Doğru cevapta melodik başarı sesi, yanlış cevapta eğitici ipucu, test sonunda kupa animasyonu (`🏆`) ve yeniden çözme imkânı.

## 5. Hoca Paneli ile Eşgüdümlü Başarı Rozetleri
- Kur'an Yolculuğu: Harflerden Kur'an-ı Kerim / Amme cüzüne uzanan 6 basamak.
- Standart rozetler (İlk Adım, Elif-Bâ Yıldızı, Dua Ustası, Kur’an Yolcusu, Düzenli Talebe).
- Hoca ekranından (`src/scripts/hoca-ekrani.ts`) hocanın talebeye takdim ettiği özel başarı rozetleri (⭐ Haftanın Yıldızı, 📖 Ezber Şampiyonu, 🌸 Güzel Ahlak, 🏆 Üstün Gayret, 🏅 Düzenli Devam) öğrenci odasında parıldayarak gösterilir.

## 6. Diyanet Resmî Sesleri ve Görsel/Hareketli Mimari
- **Resmî Diyanet Elifba Sesleri (`public/media/ses/elifba/`):** 28 harfin tamamı Diyanet İşleri Başkanlığı'nın resmi Kur'an portalından (`kuran.diyanet.gov.tr/elifba`) yerel olarak indirildi ve projeye dahil edildi. Harfe tıklandığında anında (0 gecikme ile) kristal netliğinde Diyanet tilaveti çalar; hareke kombinasyonlarında SpeechSynthesis fallback devreye girer.
- **Özgün Mektep İllüstrasyonları (`public/media/mektep/`):** İznik çinileri, rahleler, fenerler ve basamaklı yollarla hazırlanan 1280px optimize WebP görselleri (mektep odası hero banner, Elifba bahçesi, ezber ve dua köşesi, Kur'an basamak yolu, başarı kupası).
- **Hareketli Kutlama ve Parıltı GIF'i:** Yarışma bitişi ve tebrik anları için şeffaf arka planlı, akıcı döngülü `tebrik-kutlama.gif` konfeti ve altın yıldız ışıltısı.
- **Üç Boyutlu Başarı Rozetleri:** Haftanın Yıldızı, Kur'an Rehberi, Güzel Ahlak, Kur’an-ı Kerim / Hatim ve İstikrarlı Devam madalyaları için yüksek çözünürlüklü özel WebP rozet illüstrasyonları (`rozet-yildiz.webp`, `rozet-kuran.webp`, `rozet-ahlak.webp`, `rozet-hatim.webp`, `rozet-devam.webp`).

## 7. Namaz Duaları ve Sûre Sesleri Altyapısı (Kalıcı Karar)
- **4 Temel Namaz Duası (`public/media/ses/dualar/`):** Sübhâneke (`subhaneke.mp3`), Ettehiyyâtü (`tahiyyat.mp3`), Allâhümme Salli & Bârik (`sallibarik.mp3`) ve Rabbenâ Âtinâ & Rabbenâğfirlî (`rabbena.mp3`) duaları doğrulanmış kıraat ve talim arşivinden projeye yerel olarak dahil edildi.
- **6 Kısa Kur'an Sûresi (`public/media/ses/sureler/`):** Fâtiha, İhlâs, Felak, Nâs, Kevser ve Âyetü'l-Kürsî sesleri dış CDN bağımlılığından kurtarılarak yerel dizine aktarıldı. Böylece öğrenci odası sıfır dış ağ gecikmesiyle, çevrimdışı ve CORS engellerinden muaf olarak çalışır.
- **Dua Metni Doğruluğu:** Rabbenâ duası Arapça metnindeki yazım kontrol edildi ve tashih edildi.

## 8. Ses Senkronizasyonu & Çakışma Önleme
- Öğrenci bir sûre veya dua dinlerken aynı anda Elif-Bâ harfine basarsa, çalan ezber sesi anında durdurulur (`audio.ezber-audio.pause()`).
- Tersi durumda, ezber oynatıcısında ses başladığında capture listener ile aktif harf sesi kesilir (`aktifAudio.pause()`). İki ses asla üst üste binmez.

## 9. Elif-Bâ Klavye & WAI-ARIA Erişilebilirliği
- 28 harflik Elif-Bâ tahtasında sağ ve sol ok tuşlarıyla (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) akıcı gezinim sağlandı. Harf butonları arasında dolaşırken seçili harf anında güncellenir, detaylar açılır ve telaffuz sesi tetiklenir.
