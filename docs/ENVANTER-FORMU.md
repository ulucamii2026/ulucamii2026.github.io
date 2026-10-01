# Saha envanteri formu — işletme notu

Adres: https://ulucamii.be/envanter/ . İlk yayın 1 Ekim 2026’da kapalı yapıldı;
aynı gün sahibin açık açılış ve karar yetkisiyle bağlantıya sahip herkesin
oturum açmadan doldurmasına açıldı. Kurumsal duyuru ayrı bir işlemdir.

## Açılış ve tarihler

Apps Script v42, `ENVANTER_AYAR` özelliğini okur. Bu pilotun veri sorumlusu
**Ulu Camii Derneği**, son kabul günü **22 Ekim 2026**, çevrim içi tablonun
kalıcı silme son günü **21 Kasım 2026** olarak seçildi. Siteyi yeniden
derlemeden bu özellik ile kapatılabilir. Kapanış gününden sonraki Brüksel
takvim gününde sağlık yanıtı `envanter.acik=false` olur.

Formun herkesçe doldurulması cevap tablosunun paylaşılması anlamına gelmez.
İlk geçerli gönderimde yaratılan tablo, dernek hesabının İhtida Başvuruları
klasöründedir; klasör ve tablo erişimi **Kısıtlı / yalnız dernek hesabı** olmalıdır.
Tablo/klasör kimlikleri, panel anahtarı ve cevaplar depoya yazılmaz.

## Ağ gecikmesi

`src/scripts/envanter-form.ts` sayfa açılışında sağlık GET’i yapar. Google’ın
geçici ağ hatası, 20 saniyelik zaman aşımı, HTTP 429 veya 5xx yanıtında **bir kez**
yeniden dener. Geçerli kapalı/eski/geçersiz sağlık yanıtını açığa çevirmez.
İki istek de başarısızsa mevcut kapalı görünüm korunur. Bu değişiklik yalnız
başlangıç sağlık GET’ine aittir; gönderim davranışı değişmedi.

`tests/web/envanter.spec.mjs` geçici ağ hatası ardından açılma ve 503 ardından
gerçek kapalı yanıtın kapalı kalmasını mobil/masaüstünde sınar. Kaynak sözleşme:
`src/lib/envanter/`; sunucu: `scripts/apps-script/envanter-isleri.gs`.

## Kapanış ve silme

Kapanış sonrası tablo yerel özel arşive indirilir. Son tarihte Drive dosyası
**çöp kutusu dahil kalıcı silinir** ve `ENVANTER_TABLO_ID` kaldırılır.
Satır temizliği Sheets sürüm geçmişini ortadan kaldırmaz. Zamanlı sunucu
satır temizliği bu kalıcı silme işinin yerine geçmez. Dışarıya yalnız
toplulaştırılmış sonuç çıkar; kişi listesi yayımlanmaz.

Canlı yayın/test kanıtı: [Yayın kayıtları](YAYIN-KAYITLARI.md).
