# Belçika cami kataloğu

## Amaç

`public/data/belcika-camileri.json`, ihtida formundaki “başvuru yapılan cami” seçicisinde kullanılmak üzere hazırlanmış, adresi doğrulanmış cami kataloğudur. Aynı dosya tarayıcı, PDF üreticisi ve Apps Script dağıtımında tek kaynak olarak kullanılır. Her kayıt yalnız şu alanları taşır: cami adı, şehir, posta kodu, adres, kurum ve resmî kaynak bağlantısı. Telefon, e-posta, imam veya başka kişisel iletişim bilgisi tutulmaz.

## 09.09.2026 durumu

- Kayıt sayısı: **74**
- Kurumlar: **BDV — Belçika Diyanet Vakfı (72)**; **BİF — Belçika İslam Federasyonu (2)**
- Varsayılan Ulu Camii kaydı: `ulucamii-marche`, Thier des Corbeaux 14, 6900 Marche-en-Famenne
- BDV dizinindeki `Thiers` yazımı yerine Ulu Camii'nin [kendi iletişim bilgisindeki](https://ulucamii.be/fr/) `Thier des Corbeaux 14` yazımı korundu. Kurum dizinleri arasındaki yazım farkı sessizce yeni bir adres olarak kullanılmadı.
- Kimlikler ASCII ve kararlıdır; aynı cami adı farklı şehirlerde ayrı kayıt olarak yer alır.
- Şehir ve cami adı çifti bakımından yinelenen kayıt yoktur.

## Kaynak ve kapsam

Ana kaynak, BDV’nin güncel [Camiler ve Dernekler dizini](https://www.diyanet.be/Kurumsal/Camiler-ve-Dernekler) oldu. Aynı kurumun [PDF dizini](https://www.diyanet.be/Portals/0/cami_ve_derneklerimiz.pdf) çapraz kontrol için kaydedildi. Canlı kurum sayfası esas alındı; eski PDF ile uyuşmayan adreslerde canlı sayfadaki bilgi kullanıldı.

[Belçika İslam Federasyonu (BİF)](https://head.fibif.be/) resmî şube listesi ile ulaşılabilen şube siteleri incelendi. İki kayıt, cami adı ve adresi birlikte çapraz doğrulanabildiği için eklendi: **Merkez Camii (Genk)**, [İslam Toplumu Millî Görüş dizininde](https://ajanda.igmg.org/place/merkez-camii/) BİF Genk ve Eikenlaan 34, 3600 Genk olarak geçer; **Tevhid Camii (Gent)**, [EMB cami dizininde](https://www.emb-net.be/fr/annuaire) Ferrerlaan 214A, 9000 Gent olarak yer alır ve bu adres BİF’in Gent şube adresiyle aynıdır. Diğer şubelerde bu iki unsur birlikte doğrulanamadığından kayıt eklenmedi.

[İslam Kültür Merkezleri Birliği (UCCİB)](https://uccib.com/) de kontrol edildi. Resmî sitede birlik merkezi yer alıyor; ayrı cami ad-adres dizini bulunmadığından merkez kaydı cami olarak eklenmedi.

Bu nedenle katalog **Belçika’daki tüm Türk Müslüman camilerinin eksiksiz listesi değildir**. Şu an resmî cami adı ve adresi birlikte doğrulanabilen 72 BDV ve 2 BİF camisini kapsar. BDV’nin kurumsal tanıtımında bağlı cami sayısı 73 olarak belirtilirken canlı dizin 72 adresli kayıt vermektedir; eksik olabilecek kaydı tahmin ederek eklemek yerine dizin verisi korundu. Başvuru formu mutlaka “listede yok / elle gir” yolunu korumalıdır. BİF ve başka Türk Müslüman kurumlarına ait camiler, kurumlarının resmî ad-adres dizini elde edilip tek tek doğrulandıkça eklenebilir.

## Güncelleme kuralı

1. Önce kurumun resmî dizinini kontrol et.
2. Yalnız cami adı, açık adres ve posta kodu birlikte bulunan kaydı ekle veya güncelle.
3. Merkez ofis, federasyon, dernek merkezi veya yalnız “şube” bilgisini cami kaydı yapma.
4. Cami adını ve fiziksel adresi doğrulamadan varsayılan şahit ya da belge üretim kuralı bağlama.
5. Güncelleme tarihini ve bu belgeyi aynı değişiklikte yenile.
