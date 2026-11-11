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
| `PANEL_YANSIT_KUYRUK_<ref>` | Otomatik, yalnız YOLDAKİ başvuru için: `{d: deneme, i: 401 sayısı, s: sonraki deneme ms}`. Bitince silinir. Kişisel veri yok. |
| `PANEL_YANSIT_OZET` | Otomatik, TEK özellik: `{s: {sonuç kodu: sayı}, r: [[ref, kod], … en son 50]}`. Sayaçlar + dikkat isteyen başvurular (`red-400`, `imza-red`, `vazgecildi`, `kapsam-disi-katalog`, `atlandi-<neden>`; beklenen `atlandi-kucuk` / `atlandi-riza-yok` yalnız sayılır). Yalnız ref ve kod. |
| `PANEL_YANSIT_TAMAM` | Otomatik, TEK özellik: kesin biten (`ok`, `kapsam-disi`) başvuru numaraları, yıl başına birleşik aralıklar (`{"2026":[1,40,43,43]}` = 1–40 ve 43). 6 000 karakteri aşarsa EN ESKİ aralıklar unutulur (güvenli yön: panel yinelenen başvuruya 200 «değişmedi» döner). |
| `PANEL_YANSIT_UYARI_<tür>` | Otomatik: tür başına tek operatör uyarısı bayrağı (`imza`, `gecersiz`, `vazgecildi`, `katalog-<camiId>`). |
| `PANEL_YANSIT_TUR_KILIT` | Otomatik: tur kirası `jeton|bitiş ms` (en çok 7 dk); tur bitince silinir. |

**Özellik boyutu (B-11):** başvuru başına kalıcı özellik YOKTUR. 2 000 başvuruluk sınamada bitişte toplam < 20 000 karakter (Script Properties: 500 KB toplam, 9 KB/değer); 2 000 başvurunun hepsi aynı anda yoldayken bile ≈ 110 KB. Yoldaki kuyruk uzun bir panel kesintisinde büyür ama panel dönünce boşalır.

## Yayın sırası

1. Panel ucu (`basvuruAl`) canlı ve `sistem/anahtar` kayıt alımı kararı verilmiş.
2. Yeni sürüm Apps Script'e yüklenir ve dağıtılır (anahtar hâlâ kapalı: davranış değişmez).
3. `PANEL_YANSIT_URL` ve `PANEL_YANSIT_SIR` yazılır; panel tarafında aynı sır tanımlıdır.
4. **Önce** `ihtidaPaneleGeriDoldurKuru()` çalıştırılır (yalnız sayaç döner; kuyruk/özellik yazmaz).
5. **Önce katalog eşitliği doğrulanır** (aşağıda «Katalog»). `PANEL_YANSIT` = `1` yapılır. Yeni başvurular kendiliğinden yansır (dakika tetikleyicisi `ihtidaPaketKuyrukCalistir` PDF paketinden SONRA yansıtma turunu çalıştırır; `ihtidaPaketKur` tetikleyicisi zaten kurulu olmalı).
6. Eski satırlar için (isteğe bağlı, bilerek ayrı adım): `ihtidaPaneleGeriDoldurGercek()`; dönen sayaçlar kontrol edilir.

Geri alma: `PANEL_YANSIT` silinir/`0` yapılır; kuyruk bekler, hiçbir şey gönderilmez.

## Ne gider, ne gitmez

Giden alanlar (sözleşmenin beyaz listesi): `ref`, `zaman`, `dil` (form dili), `cinsiyet` (K/E), `dogumTarihi` (YYYY-MM-DD; panel yalnız yaşı hesaplar, yılı saklar), `uyruk` (be/fr/nl/de/gb/diger), `camiId`, `torenDili`, `rizaSurum`, `ad`, `eposta`.
Defterden yalnız bu alanların on üç sütunu okunur. Telefon, adres, serbest metin (ihtida sebebi, not, yeni isim…), anne/baba adı, meslek, doğum yeri, şahitler, görseller, imza, kimlik verisi ve PDF bağlantıları hiçbir yerde okunmaz.

Panele GİTMEYEN başvurular (sonuç `atlandi-<neden>`; nedenler tur sayaçlarında ve `PANEL_YANSIT_OZET` içinde görünür): `kucuk` (başvuru günü 18 yaş altı), `dogum-eksik`, `zaman-eksik` (başvuru günü çözülemiyor: «bugün»e DÜŞÜLMEZ), `riza-yok` (açık rıza ya da EK-10 «Evet» değil), `dil-gecersiz`, `cinsiyet-gecersiz` («Kadın», «kadın», «KADIN», «Erkek» … diğer alanlarla aynı yerel-duyarlı sadeleştirme; tanınmayan değer atlanır), `toren-dili-gecersiz`, `cami-gecersiz`, `ad-gecersiz`, `eposta-gecersiz`, `satir-yok`.

## Durum makinesi (panel yanıtına göre)

| Yanıt | Davranış |
|---|---|
| 200 | Kuyruktan çıkar, `ok` (yeni, yinelenen ve 18 yaş altı atlama panelde aynı 200). |
| 422 | Kapsam dışı bölge: kuyruktan çıkar, `kapsam-disi`, yeniden denenmez. |
| 503 | Kayıt alımı kapalı: kuyrukta kalır, 1 saat bekler, deneme sayılmaz, uyarı yok. |
| 401 | Başvuru başına geri çekilmeyle 5 kez; sonra bırakılır (`imza-red`) ve TEK uyarı e-postası. Bir başvurunun imza reddi kuyruğu TIKAMAZ: aynı turda sıradakine geçilir. Bir turda art arda 3 FARKLI başvuru reddedilirse sorun sistemik sayılır (sır/saat/adres): tur durur, TEK uyarı gider. Çözümden sonra `ihtidaPaneleGeriDoldurGercek()` bırakılanları yeniden sıraya alır. |
| 400 | Panel biçimi reddetti: yeniden denenmez (`red-400`), tek uyarı. Yanıt gövdesindeki alan `camiId` ise «Katalog» bölümüne bakın (`kapsam-disi-katalog`). |
| 429, 5xx, ağ | 5-10-20-… dk (üst sınır 6 saat); 40. denemede bırakılır (`vazgecildi`) + tek uyarı. |

Uyarı e-postası mevcut `epostaGonder` ile `AYAR2_IHTIDA.bildirimEposta` adreslerine gider; kişisel veri taşımaz (400 uyarısında yalnız başvuru numarası vardır).
**Eşzamanlılık (B-11):** tur ve gerçek geri doldurma, betik kilidiyle (`tryLock`) alınan KISA bir «tur kirası» tutar; ikinci tur ya da geri doldurma kirayı alamazsa sessizce çıkar (kuyruğa dokunmaz, gönderim yapmaz). Betik kilidi fetch süresince TUTULMAZ: form işleyicisi aynı kilidi 30 sn bekler, tutulsaydı başvurular kilit zaman aşımına uğrardı. Kira 7 dk sonra kendiliğinden geçersiz olur (çöken tur kilitli bırakmaz).

**Kodlama (B-02):** imza `Utilities.computeHmacSha256Signature(değer, anahtar, Utilities.Charset.UTF_8)` ile hesaplanır (iki bağımsız değişkenli aşırı yükleme US_ASCII kullanır ve ASCII dışı harfleri bozar); tel üzerindeki gövde ayrıca saf ASCII'dir (ASCII dışı her karakter `\uXXXX` kaçışlı) ve `Content-Type: application/json; charset=utf-8` gider: imzalanan metin ile gönderilen bayt dizisi her ortamda aynıdır.

**Başvuru günü (B-03):** defterin «Zaman damgası» hücresi tarih nesnesi ya da metin (`YYYY-MM-DD[ T]HH:MM`, `GG.AA.YYYY HH:MM`) olabilir; çözülemezse `atlandi-zaman-eksik`. 18 yaş denetimi bu güne göre (gelecek tarihliyse en çok bugüne göre; panel de yaşı `min(zaman, şimdi)` anında hesaplar) yapılır; sözleşme penceresi (400 gün) dışındaki eski satırın günü de esas alınır, bu yüzden bir geri doldurma sonradan 18 olmuş eski küçüğü yetişkin saymaz.

Yansıtma hatası başvuranın yanıtını ve defter kaydını etkilemez (`ihtidaPaneleYansitKuyrugaAlGuvenli`, test: «kanca»).

## Bilinen kaymalar (karar gerektirir)

- **Katalog (iki kopya):** cami kataloğunun İKİ kopyası vardır ve tek kaynak kurulana kadar elle EŞ tutulmalıdır: (1) site deposu `public/data/belcika-camileri.json` (formun cami seçimi ve `ihtidaCamiCoz` buradan beslenir); (2) panel deposunun `public/data/belcika-camileri.json` dosyası (panelin `functions/src/dosya-saf.ts` kataloğu `camiId`'yi buna karşı doğrular). Sitede olup panelde olmayan cami (şu an `de-koepel-camii-borgerhout`) panelde 400 (alan `camiId`) alır: bu başvuru `kapsam-disi-katalog` olarak sınıflanır (bozuk sayılmaz, yeniden denenmez) ve cami kimliği başına TEK uyarı e-postası gider (yinelenen uyarı yok). Katalog eşitlenince `ihtidaPaneleGeriDoldurGercek()` bunları yeniden sıraya alır. Sınamadaki `KATALOG_PANELDE_YOK` listesi bu kaymanın kaydıdır; kopyalar eşitlenince boşaltılır.
- **18 yaş altı:** form 16 yaşından kabul eder; 16–17 yaş başvurular panele gönderilmez (ad bile gitmez).
- **Uyruk** serbest metindir; tanınmayan değer `diger` olur (liste: be/fr/nl/de/gb için TR/FR/NL/DE/EN yazımları).
