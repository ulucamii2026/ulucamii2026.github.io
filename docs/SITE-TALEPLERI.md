# Site güncelleme talepleri (e-postayla)

1 Kasım 2026 yönetim toplantısı kararı: «Web sitesinde yapılacak güncellemeler sizden bana mail olarak gelecek.»

## Akış

1. **Talep.** Kurul üyesi kendi kişisel `@ulucamii.be` adresinden `imam@ulucamii.be` adresine yazar. Örnek:
   `mehmetgulkilik@ulucamii.be` → `imam@ulucamii.be`. Metin ve ek (fotoğraf, PDF) kabul edilir.
2. **Tarama.** `D:\ulu-camii-dernek\site-talepleri\talep-tara.py tara` her gün 17.30'dan sonra çalışır. Facebook kuyruk
   görevinin günlük kontrolü (`kuyruk-yayinla.py` → `gunluk_kontrol`) onu çağırır; ayrı Windows görevi yoktur.
   - imam@ kutusu **salt okunur** açılır: iletiler okunmamış kalır.
   - Kabul edilen göndericiler `src/content/ayarlar/kurul.yaml` içindeki kurul e-postalarıdır. Kurul üyelerinin kişisel
     adresleri (ör. Mehmet Bey'in hotmail adresi) depo dışındaki `D:\ulu-camii-dernek\site-talepleri\ek-gondericiler.json`
     dosyasında tutulur; oradan imam@'a yazılan talepler de alınır.
   - Rıdvan'ın kişisel Gmail kutuları otomatik taranmaz. Oraya gelen bir talep (1.11.2026'daki «üye listesi» gibi) oturumda
     elle okunur.
   - `info@` kabul edilmez: formların otomatik bildirimleri kişisel veri taşır ve oradan gelir. Otomatik iletiler
     (`Auto-Submitted`, `List-Id`) de atlanır.
   - Her yeni talep `D:\ulu-camii-dernek\site-talepleri\gelen\YYYYMMDD-HHMM-konu\` klasörüne yazılır: `talep.md` ve
     ekler.
   - Yeni talep varsa Windows bildirimi gelir.
3. **Uygulama.** Cami işindeki Claude oturumu başta `talep-tara.py durum` çalıştırır, bekleyen talebi uygular ve
   kalite kapısından geçirir. Ardından yayınlar ve `docs/YAYIN-KAYITLARI.md` kaydını yazar.
4. **Dönüş.** İş bitince imam@ adresinden talep sahibine «yapıldı» cevabı ve canlı bağlantı gider (Date + Message-ID
   başlıklarıyla). Son olarak `talep-tara.py kapat <klasör> --not "…"` çalıştırılır.

## Rıdvan'a önce sorulanlar

- Yönetim, bağış, belediye, hac-umre gibi resmî ya da hukuki etkisi olan duyurular.
- Kişisel veri, çocuk fotoğrafı ya da kimlik belgesi içeren talepler.
- Proje kurallarıyla çelişen talepler. Örnek: imam telefonu, hesapla namaz vakti.

## Sınama

`talep-tara.py tara --deneme` yalnız imam@'ın kendine gönderdiği `[DENEME-TALEP]` konulu iletiyi alır. 1 Kasım 2026'da
şu adımlar uçtan uca denendi:

- iletinin klasöre düşmesi;
- ekin kaydedilmesi;
- ikinci taramanın tekrar üretmemesi;
- kapatma.

Parolalar `D:/app/marche-cami-sitesi/eposta/parolalar-30agu2026.txt` dosyasından okunur ve depoya girmez.
