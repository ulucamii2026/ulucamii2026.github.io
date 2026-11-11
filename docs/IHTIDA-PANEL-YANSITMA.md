# İhtida paneline yansıtma (Dilim 5 / WP4)

Form arka ucu (Apps Script) yeni ihtida başvurusunu defterine yazdıktan sonra, panelin `basvuruAl` ucuna **imzalı** bir istekle yansıtır.
Kod: `scripts/apps-script/ihtida-panel-yansitma.gs` (derlemeye `scripts/ihtida-gas-derle.mjs` parça listesinde eklenir).
Test: `npm run test:yansitma` (`tests/ihtida-panel-yansitma.test.mjs`; panel doğrulayıcısının kopyası `tests/fixtures/ihtida-panel-sozlesme.mjs`, kaynak panel deposu commit `d92c79ec`).

**Sürüm:** bu özellik v48'e DEĞİL, v48'den sonraki ilk sürüm numarasıyla yayına girer (başka bir oturumun «hatıra» modülü de numara bekliyor; sıra `p7-yayin-adimlari.md` §7). `SURUM` bu çalışmada değişmedi.

## Script Properties (düzenleyici → Proje Ayarları; değerler depoya/rapora YAZILMAZ)

| Ad | Anlam |
|---|---|
| `PANEL_YANSIT` | Ana anahtar. Yalnız tam `1` açar; yok/`0`/başka her şey = sıraya alma ve işleme hiçbir şey yapmaz. **Varsayılan kapalı.** |
| `PANEL_YANSIT_URL` | Panelin `basvuruAl` HTTPS adresi (`https://…`). |
| `PANEL_YANSIT_SIR` | HMAC sırrı; panelin `BASVURU_IMZA` sırrıyla aynı, en az 32 karakter. |
| `PANEL_YANSIT_KUYRUK_<ref>` | Otomatik: `{d: deneme, i: 401 sayısı, s: sonraki deneme ms}`. Kişisel veri yok. |
| `PANEL_YANSIT_SONUC_<ref>` | Otomatik: `ok`, `kapsam-disi` (kesin); `atlandi-<neden>`, `red-400`, `imza-red`, `vazgecildi` (yeniden değerlendirilebilir). |
| `PANEL_YANSIT_UYARI_<tür>` | Otomatik: tür başına tek operatör uyarısı bayrağı (`imza`, `gecersiz`, `vazgecildi`). |

## Yayın sırası

1. Panel ucu (`basvuruAl`) canlı ve `sistem/anahtar` kayıt alımı kararı verilmiş.
2. Yeni sürüm Apps Script'e yüklenir ve dağıtılır (anahtar hâlâ kapalı: davranış değişmez).
3. `PANEL_YANSIT_URL` ve `PANEL_YANSIT_SIR` yazılır; panel tarafında aynı sır tanımlıdır.
4. **Önce** `ihtidaPaneleGeriDoldurKuru()` çalıştırılır (yalnız sayaç döner; kuyruk/özellik yazmaz).
5. `PANEL_YANSIT` = `1` yapılır. Yeni başvurular kendiliğinden yansır (dakika tetikleyicisi `ihtidaPaketKuyrukCalistir` PDF paketinden SONRA yansıtma turunu çalıştırır; `ihtidaPaketKur` tetikleyicisi zaten kurulu olmalı).
6. Eski satırlar için (isteğe bağlı, bilerek ayrı adım): `ihtidaPaneleGeriDoldurGercek()`; dönen sayaçlar kontrol edilir.

Geri alma: `PANEL_YANSIT` silinir/`0` yapılır; kuyruk bekler, hiçbir şey gönderilmez.

## Ne gider, ne gitmez

Giden alanlar (sözleşmenin beyaz listesi): `ref`, `zaman`, `dil` (form dili), `cinsiyet` (K/E), `dogumTarihi` (YYYY-MM-DD; panel yalnız yaşı hesaplar, yılı saklar), `uyruk` (be/fr/nl/de/gb/diger), `camiId`, `torenDili`, `rizaSurum`, `ad`, `eposta`.
Defterden yalnız bu alanların on üç sütunu okunur. Telefon, adres, serbest metin (ihtida sebebi, not, yeni isim…), anne/baba adı, meslek, doğum yeri, şahitler, görseller, imza, kimlik verisi ve PDF bağlantıları hiçbir yerde okunmaz.

Panele GİTMEYEN başvurular (sonuç `atlandi-<neden>`): `kucuk` (başvuru günü 18 yaş altı), `dogum-eksik`, `riza-yok` (açık rıza ya da EK-10 «Evet» değil), `dil-gecersiz`, `cinsiyet-gecersiz`, `toren-dili-gecersiz`, `cami-gecersiz`, `ad-gecersiz`, `eposta-gecersiz`, `satir-yok`.

## Durum makinesi (panel yanıtına göre)

| Yanıt | Davranış |
|---|---|
| 200 | Kuyruktan çıkar, `ok` (yeni, yinelenen ve 18 yaş altı atlama panelde aynı 200). |
| 422 | Kapsam dışı bölge: kuyruktan çıkar, `kapsam-disi`, yeniden denenmez. |
| 503 | Kayıt alımı kapalı: kuyrukta kalır, 1 saat bekler, deneme sayılmaz, uyarı yok. |
| 401 | Geri çekilmeyle 5 kez; sonra bırakılır (`imza-red`) ve TEK uyarı e-postası. Tur biter. Çözümden sonra `ihtidaPaneleGeriDoldurGercek()` yeniden sıraya alır. |
| 400 | Panel biçimi reddetti: yeniden denenmez (`red-400`), tek uyarı. |
| 429, 5xx, ağ | 5-10-20-… dk (üst sınır 6 saat); 40. denemede bırakılır (`vazgecildi`) + tek uyarı. |

Uyarı e-postası mevcut `epostaGonder` ile `AYAR2_IHTIDA.bildirimEposta` adreslerine gider; kişisel veri taşımaz (400 uyarısında yalnız başvuru numarası vardır).
Yansıtma hatası başvuranın yanıtını ve defter kaydını etkilemez (`ihtidaPaneleYansitKuyrugaAlGuvenli`, test: «kanca»).

## Bilinen kaymalar (karar gerektirir)

- **Katalog:** sitede olup panel kataloğunda olmayan `de-koepel-camii-borgerhout` panelde 400 (`camiId`) alır; `red-400` + uyarı. Katalog panele eklenmeli ya da site kataloğundan çıkarılmalı.
- **18 yaş altı:** form 16 yaşından kabul eder; 16–17 yaş başvurular panele gönderilmez (ad bile gitmez).
- **Uyruk** serbest metindir; tanınmayan değer `diger` olur (liste: be/fr/nl/de/gb için TR/FR/NL/DE/EN yazımları).
