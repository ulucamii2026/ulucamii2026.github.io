# Diyanet kütüphanesi üretim hattı

`src/data/diyanet-yayinlar.json` bu dört betikle üretilir. **Günlük işlerde çalıştırmaya gerek
yoktur**; yılda bir ya da Diyanet yeni yayın eklediğinde tazelenir. Bağlantıların hâlâ yaşadığı
`npm run denetim:diyanet` ile denetlenir (ayrıca her ay GitHub Actions çalıştırır).

Betikler ara dosyalarla çalışır ve bu ara dosyalar (yüzlerce MB PDF dâhil) **depoya girmez** —
geçici bir klasörde koşturun:

```bash
cd <geçici klasör>
py -3.14 harvest_all.py      # sitemap.xml -> tum-ekitaplar.json  (959 kayıt, ~532'si canlı)
py -3.14 indir_paralel.py    # Türkçe olmayan PDF'ler -> pdfall/  (5 iş parçacığı, ~2,8 GB)
py -3.14 basliklar_all.py    # boyut + sayfa sayısı + ilk sayfa metni -> ekitap-detay.json
cp <depo>/scripts/diyanet-hatti/{uret_tum.py,baslik-duzeltme.json} .
cp <depo>/src/data/diyanet-fr-yayinlar.json .   # (varsa; elle küratörlüğü yapılmış Fransızca künye)
py -3.14 uret_tum.py         # -> diyanet-yayinlar.json  ->  src/data/ içine kopyalayın
```

## Bilinmesi gerekenler

- **Dosyalar bizde durmaz.** PDF/EPUB Diyanet'in sunucusunda kalır; biz yalnız bağlantı veririz.
  Telif Diyanet'te kalır, yayın güncellenince kopyamız eskimez, depoya gigabaytlarca PDF girmez.
- **`pdfall/` yalnız başlık çıkarmak için indirilir.** Diyanet'in ürün sayfaları başlığı yalnız
  Türkçe verir («İSLAM NEDİR (FRANSIZCA BROŞÜR)»); Fransızca okuyan biri için bu işe yaramaz.
  Bu yüzden PDF'lerin ilk sayfasından kendi dillerindeki başlık çıkarılır.
- **`baslik-duzeltme.json`** elle küratörlüktür: değer bir metinse başlığı o metin yapar, `null`
  ise otomatik çıkarımı bastırıp Türkçe künyeye düşürür (kapağı yalnız kolofon olan mealler).
  Her düzeltme kitabın KAPAĞINDAN okunmuştur; uydurma başlık yazılmaz.
- **`baslikDili`** alanı başlığın gerçekte hangi dilde olduğunu söyler. Kapak metni çözülemeyince
  Türkçe künyeye düşülür ve bu alan `tr` olur; `KitapSatiri.astro` `<h4 lang>`'i buna göre yazar.
- **`kesik` kayıtlar listeye alınmaz.** Cami broşürü (id=510) 1,7 MB bildirip gövdeyi 21 KB'de
  kesiyordu (üç bağımsız denemede aynı).
- Bu sunucuda **HEAD 405 döner**; ölü ürün sayfası da HTTP 200 + «Sayfa Bulunamadı!» gövdesi
  döndürür — bu yüzden denetim koda değil gövdeye bakar.

## Videolar (8 Eylül 2026)

`src/data/diyanet-videolar.json` ayrı bir hattır ve kitaplardan bağımsızdır:

1. `harvest_all.py`'nin indirdiği `sitemap-urls.txt` içinden `/video/` adresleri süzülür. Adres
   biçimi: `/video/<slug>/<seri-slug>/<seriId>/<videoId>/<YOUTUBE_ID>` — son parça YouTube kimliğidir.
2. `oembed.py` her kimliği YouTube oEmbed ile sorar: canlı mı, gerçek başlığı ve kanalı ne?
   (🛑 Bu makinede `yt-dlp` çalışan videoya da "not available" diyor — canlılık sorusu **oEmbed**
   ile sorulur.) Çıktı `islam-nedir.json`.
3. `videolar_uret.py` ikisini birleştirir, `- İslam Nedir?` son ekini başlıklardan atar, bölümleri
   1-37 numarasına göre beş gruba ayırır ve ölü kayıtları listeye almaz.

**9 Eylül 2026 düzeltmesi:** bu hat Türkçe dijital katalog içindir; buradan Diyanet’in
tüm yayınlarının Türkçe olduğu sonucu çıkarılamaz. `whatis.islam.gov.tr/videos/en`
adresinde 37 İngilizce video ve Diyanet Haber’de Fransızca hutbe doğrulandı.
İhtida sayfasının dil bazlı seçkisi `src/data/ihtida-videolari.json` dosyasındadır;
bu üretici seçkiyi değiştirmez. Kaynaklar ve oynatma sınırı: `docs/IHTIDA-VIDEOLARI.md`.
oEmbed 200, başlık ve kanal bilgisini doğrular; oturumsuz oynatma garantisi değildir.
