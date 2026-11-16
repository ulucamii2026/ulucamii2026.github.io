# EK-9 ön yüz: yetkilinin imza ve mühür yeri (DÜZEN 2)

Tarih: 16 Kasım 2026 · Karar: Rıdvan KAYAHAN («Müşavir Bey'in ıslak imzası ve mührü için gerçek yer»; yetki devredildi).
Durum: dalda hazır (`ek9-imza-yeri`), yayınlanmadı. Servis sürümü **v50** (v49 canlıdır).
Arka yüze dokunulmadı. Hiçbir sözcük, punto ya da yazı tipi değişmedi; yalnız konum. Hepsi vektör (görüntü yok).

## Ne değişti

- Başlık bloğu, vesikalık, noktalı ad çizgisi, Türkçe ve İngilizce paragraf **yukarı** kaydı. Her biri katı bir blok: bloğun içindeki aralıklar aynı.
- «Diyanet İşleri Başkanlığı Yetkilisi / Presidency of Religious Affairs Authority» etiketleri ile basılı ad ve unvan **8 pt aşağı** indi.
- ŞAHİT/WITNESS etiketleri, şahit adları ve şahit imza kutuları **yerinde**. Süsleme çerçevesi ve orta filigran **bayt bayt aynı**.
- Yetkilinin sayısal imza kutusu (`girdi.yetkiliImza`, yalnız normal yol) artık etiketlerin altında değil, basılı adın ÜSTÜNDEKİ cepte.

Şablon Diyanet'in hazır PDF'idir (üretici kaynağı yok). Bu yüzden içerik akışındaki sayılar yerinde kaydırıldı:
`python scripts/ek9-duzen-kaydir.py <eski.pdf> <yeni.pdf>` (yeniden üretilebilir; her öğenin kayma miktarını doğrular).
Tek kaynak: `public/admin/ek9.js` içinde `EK9_DUZEN = 2` ve `EK9_DUZEN_KAYMA = { ust: -6.5, ingilizce: -10.25, yetkili: 8 }`.

## Ne kadar boşluk elde edildi (ve hedeften sapma)

| Ölçü (pt, üstten) | Eski | Yeni |
|---|---|---|
| İngilizce son satır mürekkep alt kenarı | 391,75 | 381,50 |
| Basılı ad «Salih GÖR» mürekkep üst kenarı (Ö noktası) | 389,50 | 397,50 |
| **Tam sütun temiz şerit** (x 320–535) | **−2,25** (üst üste) | **16,0 pt = 5,6 mm** |
| **Cep** (İngilizce son satır x ≤ 369'da bittiği için x 372–535, 163 pt = 57,5 mm geniş) | 18,0 | **36,0 pt = 12,7 mm** |

İstenen en az 57 pt (20 mm) tam sütun boşluğu **ölçümle imkânsızdır**. Nedeni (mürekkep ölçümleri, 288 dpi):
iç çerçeve çizgisi y = 133,0; alt süs bandı y = 463,5. Aradaki 330,5 pt'e şunlar sığmak zorundadır.

- Başlık bloğu 39,5 pt (başlık üst kenarı 148,5; çerçeveden en az 9 pt aşağıda kalır).
- **Vesikalık 80 pt yüksekliğindedir** (kalem yolu, çerçevenin 11,4 pt üstüne taşar). Sağ üst köşede başlığın 3. satırı (x ≤ 644) ile aynı x aralığındadır; üstünde en az 8 pt, altında Türkçe paragrafın ilk satırıyla en az 7,5 pt boşluk ister. Başlık→Türkçe paragraf mesafesi bu yüzden **zaten asgaridedir** (8 + 80 + 7,5 = 95,5 pt, eski ve yeni aynı). Başlıkla ad çizgisini sıkıştırmak kazanç getirmez; Türkçe paragraf vesikalığa yapışır.
- Türkçe 46,75 + İngilizce 46,75 pt; ikisinin arası 14,75 → 11,0 pt (satır içi boşluk 6,3 pt; daha sıkısı paragraf ayrımını siler).
- Basılı ad + unvan + etiketler 51 pt (ad 12 pt, unvan 10 pt, etiket 8,2 pt aralıksız).
- Alt kenar boşluğu en az 8 pt (şu an 15,5; en fazla +8 indirme izni kullanıldı).

Bütün aralıklar asgariye çekilse bile tam sütun şerit en çok ≈ 20 pt olur. Şu anki 16 pt dengeli ritim (≈ 9 · 8 · 7,5 · 11 pt) için seçildi.
57 pt'e ancak şunlardan biri ya da birkaçı ile yaklaşılır (hepsi Rıdvan/Müşavir kararı; **uygulanmadı**):

| Seçenek | Kazanç | Bedel |
|---|---|---|
| Vesikalık 80 → 66 pt (şablonun kendi çerçeve yüksekliği) | +14 pt (şerit ≈ 30) | Büyük vesikalık kararı (17.10.2026) geri alınır |
| Yetkili ad/unvan/etiket +8 yerine +15 pt | +7 pt | Alt süs bandına 8,5 pt kalır; şahit etiketleriyle 15 pt basamak |
| İmzayı «cep»e yerleştirmek (uygulandı) | cepte 36 pt (12,7 mm) | İmza x 372–535 aralığında; ıslak imza adın üstünden de taşabilir |

## Eski → yeni koordinat tablosu (pt, üstten; PyMuPDF kutuları; eksi = yukarı)

| Blok | Eski y | Yeni y | Kayma |
|---|---|---|---|
| Başlık (T.C. / Cumhurbaşkanlığı / DİB), 3 satır ve dikey ayraç | 148,1 (ayraç 147,98–186,91) | 141,6 (ayraç 141,48–180,41) | −6,5 |
| İHTİDA BELGESİ | 206,5 | 200,0 | −6,5 |
| DOCUMENT OF CONVERSION TO ISLAM | 226,6 | 220,1 | −6,5 |
| Şablonun vesikalık çerçevesi | 207,36–273,62 | 200,86–267,12 | −6,5 |
| Vesikalık (kalem yolu, 80 pt) | 196,0–276,0 | 189,5–269,5 | −6,5 |
| Vesikalık (normal yol, `S1.foto`) | 203 | 196,5 | −6,5 |
| Noktalı ad çizgisi | 267,4 | 260,9 | −6,5 |
| Ad kaligrafisi tabanı (`S1.isim.taban`, `K.isim[2]`) | 265 | 258,5 | −6,5 |
| Türkçe paragraf, satır 1 / 2 / 3 | 283,6 / 301,3 / 319,0 | 277,1 / 294,8 / 312,5 | −6,5 |
| Türkçe kurum çizikleri (akış y 305,896) | 289,38 | 282,88 (akış 312,396) | −6,5 |
| İngilizce paragraf, satır 1 / 2 / 3 | 345,2 / 362,9 / 380,6 | 334,9 / 352,6 / 370,3 | −10,25 |
| İngilizce kurum çizikleri (akış y 244,35) | 350,93 | 340,68 (akış 254,60) | −10,25 |
| he/she · his/her zamir çizikleri (`EK9_ZAMIR_CIZIKLERI`) | 350,9 · 386,29 | 340,65 · 376,04 | −10,25 |
| Yetkili ad «Salih GÖR» taban | 401 | 409 | +8 |
| Yetkili unvan taban | 415 | 423 | +8 |
| Etiket «DİYANET İŞLERİ BAŞKANLIĞI YETKİLİSİ» | 420,7 | 428,7 | +8 |
| Etiket «PRESIDENCY OF RELIGIOUS AFFAIRS AUTHORITY» | 433,8 | 441,8 | +8 |
| Yetkili sayısal imza kutusu (normal yol) | x 350–505, y 437–461 | x 376–479, y 363–396 (`S1.yetkili.imza`) | taşındı |
| ŞAHİT/WITNESS etiketleri, şahit adları, şahit imza kutuları | 420,6 · etiket−12/−21/−25 · etiket+8 | aynı | 0 |
| Süsleme çerçevesi, orta filigran | — | — | 0 |

Yetkili imza alanları (`EK9_YETKILI_IMZA_ALANI`): tam şerit x 320–535, y 381,5–397,5; cep x 372–535, y 361,5–397,5.

## Eski ve yeni düzeni ayırmak (dış araçlar için)

Güvenilir kural: PDF'in 1. sayfasında metin olarak «Have applied» ile başlayan satırın **üst kenarı** (PyMuPDF `search_for("Have applied")[0].y0`; sayfa 595,28 pt yüksek, üstten):

- ≈ 345,2 (344–347) → **DÜZEN 1** (eski)
- ≈ 334,9 (334–336) → **DÜZEN 2** (yeni)

Eşik: `y0 < 340` ise DÜZEN 2. İçerik akışı kullanan araçlar için karşılık: İngilizce ilk satırın `Tm` y değeri 243,56 (eski) / 253,99 (yeni).
Üretilen PDF'lerde (ek9Uret, ek9-tamamla.py) bu satır metin olarak durur, kural dolu belgelerde de geçerlidir.
Hazır denetim: `python scripts/ek9-duzen-kaydir.py --denetle belge.pdf` → `1` ya da `2` yazar.
Hiçbir aracın iki düzeni ayırt etmeden koordinat varsaymaması gerekir.

## Dış araçların izleyeceği değişiklikler (Mühtedi Koordinatörlüğü hattı; bu depoda DEĞİL)

- `ek9-tamamla.py` (S1_ETIKET, ad, vesikalık, foto çerçevesi): yukarıdaki tabloya göre kaydır; yetkili etiketi +8; şahit etiketi 0.
- `ek9-sahit-imza.py`: şahit etiketleri ve imza kutuları değişmedi (0); yalnız düzen ayrımı yap.
- `dijital-nusha.py` (YETKILI_IMZA, MUHUR_MERKEZ): yetkilinin imzası ve mührü artık EK-9'un «cep»inde (x 372–535, y 361,5–397,5) ve basılı adın ÜSTÜNDE; eski «etiketlerin altı» yer kalktı.
- `ek9-iki-dilli.py`: ihtida sebebi yazısı arka yüzdedir (değişmez); ön yüz zamir çizikleri −10,25 pt; eski düzendeki belgeyi yeni düzene taşımak istiyorsa şablonu `ek9-duzen-kaydir.py` ile değil, yeniden üretimle değiştirin (şahit imzalı belge yeniden üretilmez).
- Önceden üretilmiş, imzalanmış DÜZEN 1 belgeler olduğu gibi kalır; yeniden basılmaz.

## Doğrulama

- `python scripts/ek9-duzen-kaydir.py` her koşuşta: metin kutularının x, genişlik, içerik değişmedi; her bloğun kayması tam tablodaki değer; çerçeve ve filigran kutuları Δ = 0; sayfada görüntü yok; yazı tipi aynı (PalatinoLinotype-Bold).
- `tests/ek9-duzen.test.mjs`: süsleme/filigran akışı SHA-256'sı eski şablonla aynı; 18 `Tm` satırı tam kayma kadar; yetkili ad/unvan +8; imza cebi basılı adın üstünde.
- `tests/ihtida-contract.test.mjs`: kurum çizikleri yeni y'lerde (312,396 ve 254,6).
- Görsel inceleme: `scripts/ek9-duzen-onizleme.mjs` (kurgusal veri, 110 dpi).
