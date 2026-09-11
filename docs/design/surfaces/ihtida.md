# İhtida yüzey notu

**Mod:** Operate + Read  
**Hedef:** İslam hakkında güvenilir ilk bilgiyi sunmak ve ihtida başvurusunu
kişiyi gereksiz veri istemeden tamamlatmak.

## Ziyaretçi işi

Başvuru sahibi süreci, gerekli bilgileri, şahit ve cami seçimi kurallarını,
belge akışını ve iletişim adımını anlar; formu telefondan tamamlar. Kimlik
numarası istenmez. İhtiyaç duyulan belge ve fotoğraf kuralları açıkça yazılır.

## Kompozisyon

Bilgilendirme ve Diyanet kaynaklı video/kütüphane bantları formdan önce veya
sonra nefesli bölümler hâlinde sunulur. `IhtidaFormu.astro` ve adım bileşenleri
tek akışta ilerler; alanlar dil sözlüğünden gelir. Cami seçimi başka bir cami
olduğunda varsayılan şahitler boş kalır ve manuel giriş istenir.

## Medya ve mahremiyet

Videolar yerel poster kapaklarıyla gösterilir; YouTube nocookie iframe yalnız
kullanıcı tıklayınca oluşturulur. Diyanet’in Fransızca/İngilizce video kataloğu
olmayan yerde metin bunu dürüstçe belirtir. Kimlik/çocuk fotoğrafı kaynak koda,
rapora veya test ekran görüntüsüne taşınmaz.

## Kabul ölçütleri

- Her adımda hangi alanın eksik olduğu ve nasıl düzeltileceği söylenir.
- Klavye, ekran okuyucu, azaltılmış hareket ve açık/koyu tema akışları çalışır.
- Üç dilde başlık, düğme, hata ve onay metni aynı anlamı taşır.
- Form backend’ine gerçek gönderim yapmadan Playwright mock ile test edilir.
