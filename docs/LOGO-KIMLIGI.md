# Geçerli cami ve kurs logoları

12 Eylül 2026 kullanıcı kararı: yeniden tasarım kullanılmaz. Mevcut logoların temizlenmiş sürümleri tek ana kaynak olarak kullanılır; eski kusurlu logo kaynakları geri getirilmez.

- Cami ana SVG: `D:\vektorel-calismalar\ulu-camii-kurumsal-kimlik\01-cami\cami-renkli.svg`
- Kurs ana SVG: `D:\vektorel-calismalar\ulu-camii-kurumsal-kimlik\02-kuran-kursu\kuran-kursu-renkli.svg`
- Kurumsal kılavuz ve şablonlar: aynı pakette `KULLANIM.md`, `03-kilavuz`, `04-sablonlar`.

Site kullanım kopyaları `public/media/logo` altındadır. SVG’lerde yazılar eğri olarak korunur. PNG’ler yeni SVG’lerden türetilmiştir. Koyu zemin sürümü aynı renkli amblemi beyaz koruma alanıyla kullanır. Yeni bir fontla logo içindeki yazıları yeniden dizmeyin.

12 Eylül 2026 ek düzeltmesi: cami ambleminin içindeki DİYANET yazısında İ'nin noktası ve gövdesindeki örtüşme giderildi. Nokta ile gövde ayrı, aynı eksende ve eşit köşe yarıçapına sahip vektör şekilleridir. SVG, PNG ve kurumsal paket bu düzeltmeyi içerir.

Cami SVG SHA-256: `2bed412bf94117d2000b966daa3600b9579f330063051f2fd5c5a43ef7684b6a`.
Kurs SVG SHA-256: `6d0bc56df446622aa1fb012b1d43aa11624412cc69c9239a7e31b0ddc485a8c1`.

Eski yayınlar veya Git geçmişi yeniden kullanılacak logo kaynağı değildir.

## 13 Eylül 2026 — yayına alındı, türevler yenilendi

Rıdvan «eski logoları her yerden kaldır, yeni logoları kullan» dedi. Yeni logolar depoya
alınıp yayımlandı ve logodan türeyen bütün varlıklar yeni amblemden yeniden üretildi:

- `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png` —
  `D:\app\marche-cami-sitesi\simge\simge-uret.py` (kadraj ve beyaz zemin gerekçeleri betiğin
  başında yazılıdır).
- `public/media/og/ulu-camii-{tr,fr,en}.png` — paylaşım kartlarındaki amblem. Kartın kaynak
  şablonu (`__og-kart.html`) geçici dosyaydı ve silinmişti; bu yüzden yalnız 268 × 268'lik logo
  kutusu değiştirildi, metin ve zemin dokunulmadan kaldı.
- `public/media/logo/ulu-camii-logo-madalyon.png` yeni geometriden üretilmiştir; CMS'in
  (`public/admin/icerik/config.yml`) marka görselidir.

Eski kusurlu logo kaynakları yerel arşivden de silinmiştir
(`D:\app\marche-cami-sitesi\kaynak\logolar\orijinal-kaynak\` boştur).

**Logo bir daha değişirse** yukarıdaki üç türev de yenilenmelidir; aksi hâlde sekme simgesi ve
sosyal medya kartı eski amblemi göstermeye devam eder.
