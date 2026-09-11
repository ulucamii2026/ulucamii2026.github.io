# Ana sayfa yüzey notu

**Mod:** Persuade + Read  
**Hedef:** İlk bakışta camiyi, güncel yayını ve ziyaretçinin yapabileceği işi
anlatmak; aşağı doğru indikçe eğitim, duyuru ve ziyaret bilgisine düzenli geçiş.

## Ziyaretçi işi

Ziyaretçi güncel bir duyuruyu açar, namaz vaktini görür, Kur’an kursu veya veli
portalına ilerler ya da caminin adresine ulaşır. Birincil eylem her dilde aynı
yerleşimde kalır; metin dili `Dil` seçimine göre çevrilir.

## Kompozisyon

`HeroSlayt.astro` ve `GundemVitrini.astro` güncel yayınları üstte toplar.
`AnaSayfaAkisi.astro` haftalık yaşam, duyurular/takvim, hizmetler, ziyaret ve
bağış bantlarını ritimlendirir. Masaüstünde iki kolon bilgi karşılaştırmasını
kolaylaştırır; telefonda her bölüm tek kolona iner.

## Görsel ve hareket

İlk vitrin görseli eager, devamı lazy yüklenir; posterler yerel medya yolundan
gelir. Otomatik geçişin yanında önce/sonra, duraklat ve seçim bağlantıları
vardır. Kullanıcı azaltılmış hareket seçtiğinde geçişler görünür durumları
bozmadan kapanır. Üçüncü taraf video veya küçük resim isteği ilk yüklemede
başlatılmaz.

## İçerik sınırları

Güncel duyuru ve etkinlik metinleri CMS kaynaklıdır. İngilizce içerik Fransızca
geri dönüşle geldiğinde bu durum açıkça belirtilir; tarih veya kurum bilgisi
uydurulmaz. Namaz vakitleri yalnız Diyanet verisidir.

## Kabul ölçütleri

- Başlık ve güncel yayın ilk viewport içinde okunur.
- Vitrin kontrolleri klavye ile ulaşılabilir ve aktif yayın belirtilir.
- 390 px genişlikte yatay taşma ve kesilmiş başlık yoktur.
- Açık/koyu temada metin ve odak kontrastı korunur.
