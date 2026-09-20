# Kur'an ve dinî bilgi seviye tespit testi

Karar tarihi: 20 Eylül 2026 · Durum: **yayında — 20 Eylül 2026** (Apps Script v38 + site `b414091`; duyuru `a6e6f1c`). Kanıt: [Yayın kayıtları](YAYIN-KAYITLARI.md).
Amaç: yetişkin (18+) yeni Müslümanların ve temel dinî eğitim almak isteyenlerin Kur'an okuma ve dinî bilgi düzeyini
ölçüp din görevlisinin kişiye özel eğitim planlamasını sağlamak. Test bir sınav değil, **yerleştirme** aracıdır.

Dayanak: Diyanet 2025 «Kur'an-ı Kerim ve Temel Dinî Bilgiler Öğretim Programı» (öğrenme alanları; «dönem başında
hazırbulunuşluk düzeyinin tespiti»); TDV İslâm Ansiklopedisi «İlmihal» maddesi (her Müslümanın bilmesi gereken asgari bilgi).

## 1. Kalıcı kararlar (kullanıcı, 20 Eyl 2026)

1. Karma, bölümlü test (~30–35 dk), yarıda bırakılıp sürdürülebilir; her soruda «Bilmiyorum», eksi puan yok.
2. **Önce Kur'an:** Arap harfleri ve okuma ölçümü testin ilk ve en ayrıntılı bölümü; hoca raporunun ilk başlığı.
3. Katılımcıdan ses kaydı alınmaz; okuma ölçümü tanıma testi + öz beyan; akıcılık/mahreç yüz yüze teyit edilir.
4. Saklama: e-posta + dernek defteri (özel Google Sheets) + panel listesi; 24 ay, otomatik silme.
5. Katılımcı yalnız alan alan düzey + teşvik görür; yanlış cevap listesi ve not yok. Söz: «en geç bir hafta içinde» dönüş.
6. Profil: ad soyad, e-posta (21 Eyl 2026'dan beri TEK kez — Rıdvan: «iki kere doldurmaya gerek yok»; yaygın alan adı hatasında öneri çıkar), isteğe bağlı telefon (yalnız rakam, yazarken «+32 470 12 34 56»), yaş aralığı, cinsiyet, İslâm'la geçmişi, önceki eğitim,
   hedefler, ders dili, müsaitlik, yüz yüze/çevrim içi. Kimlik numarası, adres, doğum tarihi, fotoğraf **istenmez**.
7. Yalnız 18+. Dayanak açık rıza (GDPR md. 9/2-a), sürüm damgalı.
8. Fıkıh: ortak zemin; mezhebe bağlı az sayıda madde «Hanefî mezhebine göre» etiketli, puana girmez.
9. Hoca raporu **yalnız `imam@ulucamii.be`**; info@ kopyası yok; katılımcı e-postasının yanıt adresi de imam@.
10. İçerik yetkisi Claude'a devredildi: kaynaklı yazım + bağımsız ikinci doğrulama; Türkçe döküm bilgi amaçlı sunulur.
11. Yayınla birlikte sitede TR + FR duyuru.

## 2. Bölümler ve madde sayıları

| # | Bölüm | Alan kodu | Madde |
|---|---|---|---|
| 0 | Tanışma ve onaylar | — | profil |
| 1 | Kur'an okuma — tanıma merdiveni | `okuma` | 30 (K1–K5 × 6) + 3 okuma beyanı |
| 2 | Kur'an bilgisi ve ezber | `kuranBilgi` | 12 (4/4/4; B3 = tecvid kavramları) + ezber 14 |
| 3 | İnanç | `itikat` | 14 (5/5/4) |
| 4 | Temizlik ve namaz | `namaz` | 18 (6/6/6) |
| 5 | Oruç, zekât, hac, kurban, günlük hayat | `ibadet` | 14 (5/5/4) |
| 6 | Siyer ve peygamberler | `siyer` | 12 (4/4/4) |
| 7 | Ahlak ve âdâb | `ahlak` | 12 (4/4/4) |
| 8 | Uygulama öz beyanı | — | ~10 |
| 9 | Özet ve gönder | — | — |

Tavanlar (banka testi): toplam puanlı madde ≤ 115, okuma ≤ 30, hücre (alan × basamak) başına ≥ 4.

Okuma merdiveni: K1 harfleri tanıma (3 gör + 3 dinle) · K2 harfin başta/ortada/sonda yazılışı (6 gör) · K3 harekeler
(3 gör + 3 dinle) · K4 cezm, şedde, tenvin, med (3 gör + 3 dinle) · K5 kelime ve âyet (6 gör).

## 3. Puanlama (tek uygulama: `src/lib/seviye-testi/puanlama.ts`; sunucuya esbuild paketiyle gider)

- «Bilmiyorum» (-1), boş ve atlanan = 0. `mezhepBagli` ve `emekli` maddeler puana girmez.
- Bilgi alanı: basamak «geçti» = o basamağın puanlı maddelerinde doğru oranı ≥ 0,60. Düzey = kesintisiz geçilen en yüksek
  basamak (0 Başlangıç · 1 Temel · 2 Orta · 3 İleri). Yüzde = alanın bütün puanlı maddelerinde doğru oranı.
- Okuma: basamak «geçti» = 6'da ≥ 4 (genel kural: doğru oranı ≥ 0,66). Düzey K0–K5 = kesintisiz geçilen en yüksek basamak.
  `tecvid` = `kuranBilgi` B3 geçti.
- Bölüm atlandıysa (`atla.<alan> = true`): düzey 0, `atlandi: true`. Okumada «harfleri hiç bilmiyorum» → K0 + atlandı.
- Program önerisi (öneri, karar değil): **A** İlk adımlar (K0–K1) · **B** Elifbâ + temel ilmihal (K2–K3) ·
  **C** Kur'an'a geçiş + ilmihal (K4–K5 ve `namaz` düzeyi < 2) · **D** Tecvid ve derinleşme (K4–K5 ve `namaz` ≥ 2).

## 4. Veri sözleşmesi (istemci → Apps Script, `tur: "seviye"`)

```
{ tur:'seviye', sir, formSurumu:1, dil, gonderimAnahtari, bankaSurumu, rizaSurumu,
  profil:{ adSoyad, eposta, telefon?, yasAraligi, cinsiyet, muslumanlik, oncekiEgitim, hedefler[], dersDili,
           gunler[], dilim[], bicim, not? },
  onay:{ yas18:true, riza:true },
  atla:{ okuma?, kuranBilgi?, itikat?, namaz?, ibadet?, siyer?, ahlak? },
  cevaplar:{ <maddeId>: 0..n-1 | -1 }, ezber:{ <id>: 0|1|2 }, beyan:{ <id>: 0..n-1 },
  meta:{ sureSn } }
```
Sunucu yetkilidir: kimlikleri ve şık sıralarını bankaya göre doğrular, puanı kendisi hesaplar, yanıtta `sonuc` döner.
Sayfanın derlenmiş HTML'inde doğru cevap ve kaynak bulunmaz. Gövde < 20 KiB. Referans `ST-YYYY-NNNN`.

## 5. Soru yazım kılavuzu (içerik yazarları için — bağlayıcı)

**Biçim.** `src/lib/seviye-testi/tipler.ts` tiplerine birebir uy. Dosya başı: yalnız `import type { … } from '../tipler.ts';`
(bildirim biçimi, `.ts` uzantılı). Kimlik öneki: `ok` okuma · `kb` Kur'an bilgisi · `it` inanç · `nm` namaz · `ib` ibadet ·
`sy` siyer · `ah` ahlak · `ez` ezber · `by` beyan; iki haneli sıra (`ok01`). Kimlikte nokta ve tire olmaz.

**Şıklar.** 4 şık (okuma maddelerinde 3 ya da 4). «Bilmiyorum» şıkkı YAZILMAZ (bileşen ekler). Tek ve tartışmasız doğru
cevap. Doğru şıkkın konumu dosya genelinde dengeli dağılsın (0/1/2/3 yaklaşık eşit). «Hepsi / hiçbiri», olumsuz kök
(«hangisi değildir») ve tuzak ifade kullanma; şıklar benzer uzunlukta olsun. Çeldiriciler makul ama açıkça yanlış olsun.

**Dil ve üslup.** Muhatap yetişkin, belki Müslüman olalı birkaç hafta olmuş biri: saygılı, sade, yargılamayan dil.
Üç dil de yazılır (`tr`, `fr`, `en`); Fransızca Belçika Fransızcası, «vous»; tipografi: Fransızcada « » ve ince boşluk yerine
normal boşluk kabul. Terimler: TR'de Diyanet yazımı (Kur'an-ı Kerim, âyet, sûre, Hz. Muhammed (s.a.s.)); FR «le Coran, la
prière (salât), les ablutions (woudou), le Prophète Muhammad (paix et salut sur lui)»; EN «the Qur'an, prayer (salah),
ablution (wudu), Prophet Muhammad (peace be upon him)». Arapça terimi parantez içinde ver ki başka çevreden öğrenen de tanısın.

**Doğruluk.** Her madde `kaynak` alanında künye taşır (eser + bölüm/sayfa ya da URL). Kabul edilen kaynaklar: DİB
«İslâm İlmihali» ve «Temel Dinî Bilgiler», TDV İslâm Ansiklopedisi (islamansiklopedisi.org.tr), Din İşleri Yüksek Kurulu
fetvaları (kurul.diyanet.gov.tr), Diyanet Kur'an portalı (kuran.diyanet.gov.tr). Âyet metni ve meali yalnız
kuran.diyanet.gov.tr'den birebir. Emin olmadığın, kaynakta doğrulayamadığın ya da âlimler arasında tartışmalı olan konuyu
SORMA. Mezhepler arasında hükmü değişen konu ancak soru kökünde «Hanefî mezhebine göre» denerek ve `mezhepBagli: true`
ile sorulur (alan başına en çok 2). Tarih/sayı sorularında yalnız üzerinde ittifak olan değerler (ör. hicret 622).

**Basamaklar.** B1: bir Müslümanın ilk haftalarda öğrendiği en temel bilgi. B2: düzenli ibadet eden birinin bildiği
uygulama bilgisi. B3: kurs görmüş birinin bildiği ayrıntı. Dosya içinde maddeler B1 → B3 sıralı.

**Okuma maddeleri.** Arapça metin NFC, yalnız Arap harfleri + harekeler (Diyanet mushafının çekerleri U+0656/U+0657 dâhil) + U+0670, U+0671, U+0640, U+200D. «Gör → okunuşu
seç» maddelerinde şıklar dile göre Latin yazımı: TR Diyanet Elifbâ okunuşu (`src/lib/elifba-verisi.ts` esas: ince harfte بَ «be», بِ «bi», بُ «bü»;
kalın harfte صَ «sa», قُ «ku»), FR yaygın yazım (ba/bi/**bou**; ش «ch»), EN (ba/bi/bu; ش «sh»). **Latin yazımında ayırt edilemeyen çiftleri (ت/ط, س/ص,
ه/ح, ذ/ز/ظ, د/ض, ك/ق) aynı maddenin şıklarında karşı karşıya getirme** — o ayrımlar «dinle → yazılışı seç» ya da şıkları
Arapça olan maddelerle ölçülür. «Dinle» maddelerinde `ses` yerel dosyadır: harf adları `/media/ses/elifba/<ad>.mp3`,
harekeler `/media/ses/elifba/{ustun,esre,otre}/…`; cezm ve şedde için YALNIZ `src/data/elifba-alistirmalari.json`
içindeki resmî Diyanet metin–ses çiftleri (örnek uydurulmaz); şıklar `{ ar: … }`. Harf ↔ dosya eşleşmesi
`src/lib/elifba-verisi.ts` ve `docs/OGRENCI-MODU-PORTAL.md` (§10 he/vav sırası) ile doğrulanır.

**Kişisel veri.** Bankada gerçek kişi adı (peygamberler ve tarihî şahsiyetler dışında), telefon, e-posta bulunmaz.

## 6. Kaynak dosyalar
`src/lib/seviye-testi/` (banka + puanlama) · `src/components/formlar/SeviyeTesti*.astro` · `src/scripts/seviye-form.ts` ·
`src/scripts/seviye-etkilesim.ts` (hareket/etkileşim katmanı, 21 Eyl 2026 — aşamalı geliştirme: hata verse de form çalışır; doğruluk ima eden hareket YASAK) ·
`src/i18n/seviye-testi.ts` · `scripts/apps-script/seviye-testi-isleri.gs` · `public/admin/seviye-panel.js` ·
testler `tests/seviye-*.test.mjs`, `tests/web/seviye-*.spec.mjs`.

## 7. İşletme (din görevlisi ve site bakımı için)

**Yeni sonuç geldiğinde.** Rapor yalnız `imam@ulucamii.be` kutusuna düşer (info@ kopyası yoktur); «Yanıtla» doğrudan
katılımcıya gider. Aynı kayıt yönetim panelinde «Seviye testleri» sekmesindedir; «Ayrıntı» raporun tamamını (bütün
maddeler dâhil) gösterir. Katılımcıya verilen söz: **en geç bir hafta içinde** dönüş.

**Rapor nasıl okunur.** İlk başlık Kur'an okuma düzeyidir (K0–K5 + tecvid işareti) ve test sonucu ile katılımcının kendi
beyanı yan yana durur; ikisi çelişiyorsa uyarı çıkar. Test yalnız **tanımayı** ölçer — akıcılık, mahreç ve tecvid
uygulaması ilk yüz yüze derste teyit edilir. Program önerisi (A–D) karar değil, öneridir. «Hanefî mezhebine göre»
etiketli maddeler düzeyi etkilemez, yalnız bilgi olarak listelenir. «Çok hızlı bitirdi» ve «bölüm atladı» uyarıları
sonucun ihtiyatla okunması gerektiğini gösterir.

**Panelde `imam-eposta-gonderilemedi` rozeti.** Hoca raporu bilerek yedek kanalsız gönderilir (dernek Gmail'inin
«Gönderilenler» klasörüne md. 9 verisi düşmesin diye). Brevo o an başarısızsa kayıt yine defterdedir; panelden okunur,
ayrıca bir işlem gerekmez. `katilimci-eposta-gonderilemedi` ise katılımcının özet e-postasını alamadığını gösterir —
panelden «E-posta yaz» ile kendisine elle dönülür.

**Silme talebi / rızanın geri çekilmesi.** Talep `imam@ulucamii.be` adresine gelir → panelde ilgili kayıt → «Kaydı sil»
(referans yazdırılarak ikinci onay; tek tek, toplu silme yoktur). Ardından hoca posta kutusundaki rapor iletisi ve varsa
yazışma **elle** silinir (Gelen + Çöp). Talep sahibine silindiği bildirilir. Defter dosyasının kendisi Drive'dan
silinmez.

**Saklama.** Kayıtlar 24 ay sonra kendiliğinden silinir (her yeni gönderimin sonunda ve günlük zamanlı görevde
denetlenir; ayrı tetikleyici yoktur). Katılımcının tarayıcısındaki taslak 14 gün sonra geçersiz olur. Seviye kayıtları
CSV'ye aktarılmaz; ayrıntı yanıtı tarayıcı deposuna yazılmaz.

**Günlük sınırlar.** Günde en çok 25 gönderim, aynı e-posta adresinden günde en çok 3 (uç, katılımcının yazdığı adrese
e-posta yolladığı için). Aşımda kayıt açılmaz, e-posta gitmez; katılımcı anlaşılır bir ileti görür ve taslağı korunur.

**Bankayı değiştirme.** Madde kimliği asla değişmez ve silinmez; kaldırılacak madde `emekli: true` yapılır. Her içerik
değişikliğinde `SORU_BANKASI_SURUMU` bir artırılır, `npm run test:seviye` yeşil olmalıdır; ardından hem site hem Apps
Script (esbuild paketi bankayı sunucuya taşır) **birlikte** yayımlanır — önce Apps Script, sonra site. Rıza metni
değişirse `RIZA_SURUMU` yeni tarihle damgalanır ve eski metin `docs/seviye-testi/riza-arsivi.md`'ye eklenir.

**Deneme kaydı.** Soyad `TESTOGLU` ile yapılır; `?islem=test-temizle` üç defteri birlikte temizler (`ST-` dâhil).
Yerel önizlemede formun ucu CANLI Apps Script'tir — «Gönder» yalnız Playwright rota taklidiyle denenir.
