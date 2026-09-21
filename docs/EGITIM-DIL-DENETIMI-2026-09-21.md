# Dinimi Öğreniyorum — beş dilde hata avı

Tarih: 21 Eylül 2026, Europe/Brussels. Kullanıcı isteği: eğitim platformunu bütün site
dillerinde denetlemek, hataları düzeltmek ve kapsayıcı “Dinimi Öğreniyorum” başlığını kullanmak.

## Düzeltilenler

- Menü ve eğitim merkezi başlıkları TR/FR/EN/NL/DE dillerinde değiştirildi. Eski eğitim
  adresleri korundu; bağlantı/karekod kırılmadı.
- Önceki durumda beş dildeki ders dizini her ziyaretçiyi Fransızca oynatıcıya götürüyordu.
  73 ders için TR/EN/NL/DE karşılıkları eklendi; FR `/e/<kod>/` adreslerini kullanıyor.
  Toplam 365 ders sayfası, tek ortak görünüm ve aynı resmî Diyanet ses dosyaları kullanılır.
- Başlıklar, oynatma/hız/tekrar/sıralı oynatma düğmeleri, erişilebilir adlar, hata mesajları,
  betiksiz erişim açıklaması ve geri bağlantısı yerelleştirildi. Dil değiştirici aynı dersi açar;
  canonical/hreflang gerçek karşılıklara gider.
- Yerel başlık, eski Fransızca başlık ve ders kodu birlikte aranır; Türkçe `USTUN` sorgusu da
  üstün dersini bulur. Görünür ders adları Fransızcaya zorlanmaz.
- Kütüphanedeki resmî Türkçe, İngilizce, Felemenkçe ve Almanca kitaplar merkeze eklendi.
  18 resmî Diyanet PDF bağlantısı canlı HTTP ve `%PDF-` imzasıyla doğrulandı.
- Önceki sesin geciken `play()` hatasının yeni sesi durdurması giderildi; regresyon testi var.

## Korunan sınırlar

Kitaptaki Fransızca okunuş ve anlamlar korunur ve `lang="fr"` / görünür dil açıklamasıyla
sunulur. Bu çalışma yeni Kur’an meali üretmez. Arapça sesler, metinler ve kaynak künyeleri
değişmedi. Kaynak kitap özel depodadır; kişisel belge ve imzalar web deposuna alınmadı.

## Doğrulama

- Derleme: 1.885 statik sayfa; Astro kontrolü 0 hata / 0 uyarı.
- Hedefli ders/dil testlerinde 54 işlev testi geçti. İlk erişilebilirlik testinin tema
  geçişlerinde kapalı `details` içindeki ertelenen animasyonları sonsuza kadar beklediği
  saptandı; test son görünümü ölçmek üzere düzeltildi. Tekrarında 10/10 erişilebilirlik testi
  geçti; beş dil, eğitim + sûre sayfası, açık/koyu tema ve masaüstü/mobil kapsamı.
- 365 ders adresi, başlık ve ses eşleşmeleri; 74 kalıcı QR rotası; betiksiz erişim ve hata
  kurtarma testleri mevcut. Üstün örneğinde tarayıcının gerçek ses çözücüsü hata vermedi.
- Beş dilde mobil eğitim ve koyu masaüstü ders görünümü, Almanca 320 px uzun başlık,
  TR/FR kampanya sayfaları incelendi; yatay taşma yok. Impeccable taraması: 0 bulgu.
- Kampanya eklenince ana sayfa vitrin şeridindeki duyuru sırası değişti. Fark görsel olarak
  incelendi; yalnız altı masaüstü ana sayfa referansı güncellendi. Eşikler gevşetilmedi.
- Kanıtlar: `.codex/egitim-dil-*.log`, `.codex/egitim-dis-kaynak.json`,
  `.codex/egitim-gorsel/`, `.codex/egitim-dil-design.json`.

Son toplu kalite kapısı 8/8, tarayıcı testleri 590/590 geçti. İçerik commit `ff875f57626a9edcc542861cfb4abacb76221f8e`;
deploy [35628304909](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35628304909) başarılı. Canlı 374 HTML ve 3 varlık kontrolü geçti. Ayrıntı `YAYIN-KAYITLARI.md` kaydındadır. Fiziksel iPhone/Safari testi ve bütün kayıtların insan tarafından dinlenmesi
yapılmadı; otomatik erişilebilirlik kontrolü sertifika değildir.
