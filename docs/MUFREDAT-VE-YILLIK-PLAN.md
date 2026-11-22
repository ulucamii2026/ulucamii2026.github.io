# Kur'an kursu müfredatı ve yıllık plan — site tarafı konu notu

Güncelleme: 24 Eylül 2026. Bu not, yıllık plan ya da müfredat değiştiğinde sitede **neyin, hangi sırayla** güncellendiğini
anlatır; Claude, Codex ve agy oturumları aynı keşfi tekrarlamasın diye yazıldı. Hesap ve yayın kuralları [AGENTS.md](../AGENTS.md),
yayın kanıtları [YAYIN-KAYITLARI.md](YAYIN-KAYITLARI.md) içindedir. Teknik ayrıntılı belge (özel arşiv):
`D:/app/marche-cami-sitesi/dokumanlar/19_MUFREDAT_HATTI_VE_YILLIK_PLAN.md` §13.

## 24 Eylül 2026'da ne yapıldı (özet)

Kullanıcı (kurs sorumlusu) müfredatın ders kitaplarına göre yeniden kurulmasını istedi ve yeni planı onayladı; **26 Eylül 2026'dan
itibaren** geçerli. Eski planda Temel Dinî Bilgiler sayfa numaralarının hepsi yanlıştı, 16 derste aynı sayfa aralığı tekrar
ediyordu, Oruç/Kurban/Mübarek geceler mevsiminden sonra işleniyordu, Siyer üç kez başa dönüyordu.

- **Plan:** İtikat/İbadet/Siyer/Ahlak dersleri Camiye Gidiyorum 1-2 ve Temel Dinî Bilgiler sayfalarına göre yeniden sıralandı;
  Kur'an satırının **konu sırası aynı**, yalnız `kaynak` alanına Elifbâ sayfası geldi. Tarih, saat ve alan sayıları değişmedi
  (87 gün / 261 ders · kuran 87 · itikat 44 · ibadet 44 · siyer 43 · ahlak 43). Beyyine, Zilzâl, Âdiyât, Kâria, Tekâsür, Hümeze
  dersleri bilinçli olarak **sayfasız** («Elifbâ / Kur'an-ı Kerim»).
- **`kaynak` biçimi (standart, ayrıştırıcılar buna güvenir):** `Camiye Gidiyorum 1 s. 85–90` · `Temel Dinî Bilgiler s. 151–160` ·
  `Elifbâ s. 6`; birden çok kitap `;` ile; özel programlarda sonek `(Ramazan özel programı)` / `(Kurban Bayramı özel programı)`,
  tekrar derslerinde `(tekrar)`. Sayfa = kitap MD'sindeki `<!-- s. N -->` (kurs projesi `veri/kitaplar/*/INDEX.md`; kitap metinleri
  telif gereği **siteye/depoya girmez**).
- **Uyarlanan ünite:** TDB «Vatan ve Milletimize Karşı Görevlerimiz I-II» 3 dersten 2'ye indi, çerçevesi «Yaşadığımız ülkeye ve
  topluma karşı görevlerimiz» (askerlik, şehitlik, bayrak kısımları alınmadı).
- **Sunum kapağı:** her ders sunumunun ilk slaydında «Kitabımızı açalım / Ouvrons notre livre: <kitap> · s. a–b» satırı var
  (kurs projesi kuralı, 24 Eylül 2026). 26-27 Eylül ve 3-4 Ekim sunumları bu satırla yeniden yüklendi.

## 18 Kasım 2026 — 15 Kasım Pazar dersi yapılmadı («Sade güncelleme»)

Kurs sorumlusunun kararıyla 15 Kasım'ın üç dersi sonraki hafta sonuna katıldı; sonraki haftalar değişmedi (**86 gün / 258 ders** ·
kuran 86 · itikat 44 · ibadet 44 · siyer 42 · ahlak 42). Gösterim: ders **başlıkları aynı** (başlık çevirisi, konu tabloları ↔ plan denetimi ve
cuma e-postası etkilenmez); yalnız `kaynak` ve özet/etkinlik genişledi — 21 Kasım Kur'an «Elifbâ s. 14; s. 23» (önce ≈10 dk sâkinlik tekrarı),
22 Kasım Siyer «Camiye Gidiyorum 2 s. 75–78; Temel Dinî Bilgiler s. 267–270» (ilk vahiy önce), 22 Kasım Ahlak «Camiye Gidiyorum 1 s. 205–214»
(33. ünite önce). 15 Kasım, 16 Mayıs 2027 ile aynı **işaret günü** (`tatil: true`, boş ders listesi); notu yalnız «Ders yapılmadı» (neden yazılmaz).
- **Ders numarası (`no`) KAYMAZ.** Basılı defter (Sürüm 3, 261 ders sayfası) `basiliDefterSayfasi(no)` ile sayfaya bağlı; bu yüzden `no` 70–72 boş kalır
  (üretici HTML'de işaret gününün `data-atla="3"` özniteliğiyle sayacı üç atlar; `ozet-nihai.json`'da 71 ve 72 kaydı silindi, 73/77/78 birleştirildi).
  Defter kataloğu 258 kayıt (15 Kasım kayıtları çıkarıldı), `sayfa = no+50` sözleşmesi aynı; `tests/ogrenme-ilerleme.test.mjs` buna göre.
- Kaynak Word + HTML + `ozet-nihai.json` düzenlendi (yedek: `…\2026-2027 Mufredat ve Yillik Plan\_yedek\2026-11-18 15 Kasim iptali oncesi\`);
  `mufredat-denetim.py` `IPTAL` istisnası, `yillik-plan-cikar.py` `BEKLENEN` 86/258, `mufredat-uret.py` ve kurs `mufredat_denetle.py`/`uygula.py` güncellendi.
- Sabit sayılar: `src/content/sayfalar/*/kurankursu.md`, `egitim/src/sayfalar/Mufredat.astro` (+ `src/sayfalar/Mufredat.astro`), `mufredat-test.py` (258).
  Çeviri: `kurs-ceviri/<dil>.json` → `plan` (3 yeni paragraf, 8 sahipsiz anahtar silindi), `mufredat` (5 sayı anahtarı), `rozet` («Ders yapılmadı», en/nl/de).
- Ezber takvimi: ders yapılmayan günün ezber satırı kaynaktan çıkarılır; içeriği sonraki ders gününe taşınır (15 Kasım satırı çıkarıldı; üç duanın pekiştirmesi 21 Kasım satırında zaten vardı, taşınacak bir şey kalmadı; kaynak yedeği `ulu-camii-kuran-kursu/veri/_yedek/`).
- Plan sayfasında «Ders yapılmadı» notlu işaret günü yalnız notu gösterir (başına «Ders yapılmayacak.» eklenmez); 16 Mayıs aynı kaldı.

## Plan değişince siteye giden bağımlılar (hepsi birlikte güncellenir)

| Site dosyası | Ne tutar | Nasıl güncellenir |
|---|---|---|
| `src/data/yillik-plan-2026-2027.json` | Gün gün plan (konu, kaynak, kazanım, özet, etkinlik, ezber, rozet) | `D:/app/marche-cami-sitesi/mufredat/yillik-plan-cikar.py` (elle **düzenlenmez**; biçim `indent=1`) |
| `src/data/mufredat-2026-2027.html`, `mufredat-meta.json`, `public/belgeler/kuran-kursu/{mufredat-2026-2027.html, …Mufredat-2026-2027.pdf}`, `docs/kuran-kursu-*.md` | Müfredat sayfası/PDF | `mufredat-uret.py`; PDF sayfa sayısı `mufredat-meta.json` → düğme metni (elle yazılmaz) |
| `src/data/ders-defteri-2026-2027.json` | Hoca ekranı ders defteri: her dersin konu, kaynak, `goal_tr/fr`, `prompt_tr/fr`, `mode` | Kurs projesi `veri/mufredat-revizyon/site/uygula.py` (konu/kaynak plandan; konusu değişen dersin hedef/etkinliği `cikti.json`'dan) |
| `src/data/konular-fr.json`, `konular-en.json`, `src/data/ders-konu-fr.ts` | Ders başlıklarının FR/EN karşılığı (kurs günlüğü, veli portalı, FR bülten) | Aynı betik; **plandaki her başlığın karşılığı olmak zorunda** (`npm run test:gunluk`, `tests/defter-ceviri.test.mjs`). Eski anahtarlar silinmez (geçmiş defter kayıtları) |
| `src/data/ders-materyalleri.json` | Günlük sunum/plan dosyaları (Release `ders-<tarih>`) | Kurs projesi `scripts/site-materyal-yayinla.py <gün>` |
| `src/data/ezber/plan-eslesme.json`, `src/data/ezber/eski-kimlikler.json` (`eskiPlan`) | Plandaki her ezber dizesi → Ezber Kilimi katalog kimlikleri | Elle: yeni dize `plan-eslesme.json`'a; plandan **kalkan dize silinmez**, `eskiPlan`'a taşınır (hoca ekranı eski kayıtları dizeyle anahtarlar). `npm run test:ezber` yol gösterir. Ayrıntı: [Ezber Kilimi](EZBER-KILIMI.md) |
| `src/data/ilim-yolu/kartlar/*.json` | İlim Yolu bilgi kartları (261 kart; `id` ve ilerleme bitleri silinmez) | Konu/kaynak genişlerse ilgili kartın `kitap` alanı güncellenir; iptal edilip başka derse katılan kart silinmez, `katilanPlanKonu` + yeni `ilkDers` yazılır (`npm run test:ilim-yolu`) |
| Apps Script Drive kopyası «Ulu Camii Kuran Kursu 2026-2027 Mufredat.pdf» | Kayıt formu e-postasının müfredat eki | `mufredatEki()` **önce Drive kopyasını** kullanır → PDF değişince `POST {tur:"mufredat-yukle", anahtar, base64}` (panel anahtarı), sonra `?islem=mufredat-sina` ile `drive == uzunluk` doğrula |

Kurs tarafındaki eşleri (aynı işte): `D:/ulu-camii-kuran-kursu/veri/yillik-plan-2026-2027.json` ve
`belgeler/ogrenci-defteri-2026-2027/yillik-plan.json` (site JSON'uyla **MD5 eşit** tutulur), `…/konular-fr.json`,
`…/ders-etkinlikleri-v2.json`, `veri/yillik-plan-ozetli-2026-2027.md`, `veri/mufredat-2026-2027.md`.

## Çok dilli gövde (12 Kasım 2026)

Yıllık plan gövdesinin en/nl/de/fr çevirisi üretilen JSON'a **yazılmaz**; `src/data/kurs-ceviri/<dil>.json` → `plan` bölümünde (anahtar: Türkçe paragraf). Plan yeniden üretildiğinde
metni değişen paragrafın çevirisi eskir ve sayfa Türkçeye düşer; `node --test tests/yillik-plan-ceviri.test.mjs` sahipsiz anahtarı yakalar. Ayrıntı ve kapsam: [KURS-CEVIRISI.md](KURS-CEVIRISI.md).

## Müfredat sayfası gövdesi çok dilli (12 Kasım 2026)

Bölüm 1-2 gövdesinin fr/en/nl/de çevirisi de aynı bindirmede: `src/data/kurs-ceviri/<dil>.json` → `mufredat` (anahtar: Türkçe metin). `mufredat-uret.py` çıktısına dokunulmaz; metni
değişen öğe Türkçeye düşer (`lang="tr"`). PDF ve yazdırılabilir HTML hâlâ yalnız Türkçe. Ayrıntı, kapsam ve PDF önerisi: [KURS-CEVIRISI.md](KURS-CEVIRISI.md).

## Tekrar yapılacaksa sıra

1. Kaynak Word/HTML/`ozet-nihai.json` — klasör artık OneDrive'da değil:
   `D:/koordinatörlük/Arsiv_Cami_ve_Koordinatorluk_OneDrive/01_Marche_en_Famenne_Ulu_Camii/Ulu Camii Kuran Kursu/2026-2027 Mufredat ve Yillik Plan/`
   (betikler OneDrive yolu yoksa buraya düşer). Toplu değişiklik: `mufredat/revizyon-uygula.py [--kuru]` (iskelet + içerik JSON'u
   kurs projesi `veri/mufredat-revizyon/`; önce tarihli yedek `D:/ulu-camii-kuran-kursu-yedek/2026-09-mufredat-revizyonu/`).
2. `py -3.14 yillik-plan-cikar.py` → çapraz kontrol «ders fark 0» olmalı; `py -3.14 mufredat-uret.py`.
3. Kurs projesi: `python scripts/kitap/mufredat_denetle.py veri/yillik-plan-2026-2027.json` (İHLAL 0), yeni başlıklar/dersler için
   çeviri+etkinlik (`site/cikti.json`) → `python veri/mufredat-revizyon/site/uygula.py`.
4. Site: `npm run check` + `npm run dogrula` + `py -3.14 ~/.claude/skills/ulucamii-site/scripts/mufredat-test.py <kök>`.
5. Commit/push → deploy → canlı kontrol → GAS `mufredat-yukle` → kayıtlar (`YAYIN-KAYITLARI.md`, kurs `belgeler/YAYIN-KAYITLARI.md`, iki `DEVAM.md`).

## Bilinen durumlar ve tuzaklar

- `mufredat-test.py` kaydırma takibi / mobil özet / yapışkan başlık kontrolleri (5 adet) 24 Eylül öncesi canlı sitede de
  kalıyordu — bu değişiklikle ilgisiz; PDF sayfa sayısı kontrolü artık `mufredat-meta.json`'dan okur (önce sabit 43'tü; yeni PDF 41 s.).
- Kurs günlüğü (`/tr/kurs-gunlugu/`) yalnız geçmiş haftaları + sıradaki ders gününü gösterir; gelecek başlıkların orada
  görünmemesi normaldir.
- `ders-defteri-2026-2027.json` `sayfa` alanı basılı defterle **+4 kayık** (bilinen, düzeltilmedi; `ulucamii-site` becerisi «BEKLEYEN DÜZELTME»).
- Öğrenci defterleri (kurs projesi, Sürüm 3) 24 Eylül itibarıyla yeni plana göre **yeniden üretilmedi**; girdileri hazır.
- Yayın kanıtı: [YAYIN-KAYITLARI.md](YAYIN-KAYITLARI.md) «24 Eylül 2026»; içerik commit'i `a4b802b`, deploy run `36041808956`.
