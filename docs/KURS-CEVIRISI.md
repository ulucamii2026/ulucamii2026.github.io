# Kurs bölümünün İngilizce, Felemenkçe ve Almanca çevirisi (İlim Yolu)

12 Kasım 2026. İlim Yolu'nun kurs bölümü (`/<dil>/kurs/{,mufredat,yillik-plan,materyaller,gunluk}/`) artık en, nl ve de'de
sessizce Fransızcaya düşmüyor: konu başlıkları, sunum ve ek belge başlıkları, ders kazanımları, haftalık not, takvim rozetleri,
kalıcı materyal başlıkları ve sayfaların bütün arayüz etiketleri o dilde. **Durum dürüstçe: makine destekli çeviri** (Claude,
Türkçeden; Fransızca çapraz denetim; 40 örneklik anlam gözden geçirmesi yapıldı) — ana dili o dil olan biri **okumadı**.

## Neden bu yapı (yeniden üretimden sağ çıkar)

`ders-materyalleri.json`, `ders-defteri-2026-2027.json`, `ders-ilerleme.json`, `yillik-plan-2026-2027.json` kurs projesindeki
betiklerle üretilir ve haftalık yenilenir (elle yazılmaz; bkz. [Müfredat ve yıllık plan](MUFREDAT-VE-YILLIK-PLAN.md)). Bu dosyalara
alan eklenmedi; çeviri dil başına **bindirme** dosyalarında, anahtar her zaman Türkçe kaynak metnin kendisi:

| Dosya | Bölüm → anahtar |
|---|---|
| `src/data/konular-en.json` (eskiden beri), `konular-nl.json`, `konular-de.json` | konu başlığı: Türkçe başlık → çeviri (var olan `konular-fr/en` kalıbı) |
| `src/data/kurs-ceviri/<dil>.json` | `baslik` (sunum/ek başlığı), `sunumKonu`, `hedef` (kazanım `goal_tr`), `rozet` (takvim rozeti ve gün notu parçası): Türkçe metin → çeviri |
| | `hafta`: `tarih\|odev`, `tarih\|ezber` → `{ h, t }` (`h`: Türkçe metnin özeti) |
| | `kalici`: materyal dosya adı → `{ h, baslik, aciklama }`; elle girilmiş CMS İngilizcesi önce gelir |
| | `bekleyen` (+ `bekleyenNeden`): bilerek çevrilmeyenler |

Kaynak metin değişirse anahtar tutmaz (ya da özet uyuşmaz): sayfa o öğeyi Fransızcaya (yoksa Türkçeye) düşürür, doğru `lang` ve
küçük görünür dil etiketiyle (`FR`/`TR`) gösterir; çeviri silinmez, yeniden üretim onu bozamaz. Mantık `src/lib/kurs-ceviri.mjs`,
sayfa bağlantısı `egitim/src/lib/kurs-ceviri-yukle.ts`, etiket `egitim/src/components/DilEtiketi.astro` (+ `GunNotu.astro`).

## Haftalık akış (yeni içerik geldiğinde)

1. Kurs projesi betikleri yeni haftayı tr/fr üretir ve sürümler; sayfalar yeni öğeyi etiketli Fransızca/Türkçe gösterir.
2. `node scripts/kurs-ceviri-kaynak.mjs` her dil için eksik/eski/sahipsiz sayısını verir; `--eksik nl` çevrilecek öğeleri JSON verir.
3. Çeviriyi ilgili bindirmeye ekleyin (hafta notu ve kalıcı materyalde `h` = `ozet(Türkçe metin)`, `src/lib/kurs-ceviri.mjs`).
4. `npm run test:gunluk` (eşlik, eskime ve yazım kapısı; yayın iş akışlarına **bağlı değildir**, yeni hafta yayını bozmaz).
Âyet/hadis/dua **anlamı** içeren bir öğe çevrilmez: `bekleyen` listesine nedeniyle yazılır (şu an böyle öğe yok).

## Kapsam ve sayılar (12 Kasım 2026)

Her dil için: konu başlığı 249 (en eskiden vardı), sunum/ek başlığı 46, sunum konu satırı 37, kazanım 111, takvim rozeti 17,
haftalık not 8 (4 hafta × evde tekrar/ezber), kalıcı materyal 6. Ders defterindeki `prompt_*` ve `hedef_a_*` alanları bu
sayfalarda **gösterilmez** (yalnız hoca ekranında), bu yüzden çevrilmedi. Fransızca tipografi kuralı (`test:tipografi`)
yalnız fr sayfalarına uygulanır; en/nl/de metinlerinde `’`, dile uygun tırnak (nl “…”, de „…“) ve noktalama öncesi boşluksuzluk
`tests/kurs-ceviri.test.mjs` ile denetlenir.

## Müfredat ve yıllık plan sayfaları

Başlık/etiket/not zaten beş dilde; bu işte eklenenler: yıllık plandaki blok başlıkları (Kazanım, Konu özeti, Etkinlik önerisi, Ezber)
Türkçe kalmıştı → fr/en/nl/de'de çevrildi; takvim rozetleri ve tatil notları çevrildi; Müfredat'ta içindekiler başlıkları ve çevrilmemiş
rozetler `lang="tr"` ile işaretlendi (eskiden sayfa dilini taşıyan bölümde duruyordu). **Gövde bilerek Türkçe** (`lang="tr"`) ve
sayfanın dilinde görünür not taşır («ayrıntılı plan Türkçe»).

### Yıllık plan gövdesi: düzenek hazır, içerik pilot (12 Kasım 2026, imamın kararı: beş dilde olsun, resmî olmayanlar taslak)

- **Düzenek:** gövde (kazanım, konu özeti, etkinlik, ezber paragrafı) `src/data/kurs-ceviri/<dil>.json` → `plan` bölümünde: Türkçe paragraf → çeviri
  (en, nl, de ve yeni `fr.json`; fr dosyası yalnız bu bölümü taşır). Mantık `cevirici(dil).govde()` ve `planParagraflari()` (`src/lib/kurs-ceviri.mjs`).
  Üretilen `yillik-plan-2026-2027.json`'a ve Word/`yillik-plan-cikar.py`'ye dokunulmadı; plan yeniden üretilince anahtar tutmayan paragraf Türkçeye düşer.
- **Sayfalar:** ana site `src/sayfalar/YillikPlan.astro` (5 dil; yükleyici `src/lib/kurs-ceviri-yukle.ts`) ve İlim Yolu `egitim/src/sayfalar/YillikPlan.astro`.
  Ders başlıkları artık `konular-<dil>.json`'dan (daha önce planda Türkçe kalıyordu); gövdesi çevrilmiş derste «Taslak/Brouillon/Draft/Concept/Entwurf»
  etiketi görünür (egitim: `TaslakEtiketi`); çevrilmemiş paragraf `lang="tr"` ile Türkçe kalır, paragraf başına etiket konmaz (≈ 900 etiket gürültü olurdu);
  durum sayfa başındaki notta beş dilde yazılı (başlıklar ve çeviriler makine destekli, ana dili o dil olan biri okumadı).
- **Kapsam (pilot):** 892 tekil paragraftan 10'u her dilde (5 Eylül 2026 Kur'an, İtikat, İbadet dersleri ve 12 Eylül Kur'an dersi). Âyet, hadis ve dua **metni** içeren
  paragraf bu 10'da yok; olanlar çevrilmez, olduğu gibi Türkçe bırakılır. Dinî terimler ezber kataloğundaki (`src/data/ezber/katalog.json`) ve `konular-<dil>.json`
  karşılıklarıyla aynı (Kelime-i Tevhid/Şehadet adları, Basmala, mahreç).
- **Test:** `tests/yillik-plan-ceviri.test.mjs` (`npm run test:gunluk` içinde): dört dilin anahtar kümesi eşit, her anahtar plandaki paragrafla birebir, biçim kuralları,
  düşüş zinciri; kapsam sayısını bilgi olarak yazar (eksik başarısızlık değildir).
- **Eksik paragrafı bulmak:** `planParagraflari(plan)` ile bindirmedeki anahtarların farkı; çeviri `plan` bölümüne eklenir, test geçmeli. Kalan hacim ve önerilen yol aşağıdaki değerlendirmede;
  **Müfredat sayfası gövdesi (`mufredat-2026-2027.html`) bu işte çevrilmedi** (`mufredat-uret.py` depo dışında, dil başına HTML istiyor).

### Gövdeyi çevirmenin maliyeti (değerlendirme)

- **Tek kaynak:** Word belgesi (`…/Ulu Camii Kuran Kursu/2026-2027 Mufredat ve Yillik Plan/`, bkz. MUFREDAT-VE-YILLIK-PLAN.md «Tekrar
  yapılacaksa sıra»). `yillik-plan-cikar.py` → `src/data/yillik-plan-2026-2027.json`; `mufredat-uret.py` →
  `src/data/mufredat-2026-2027.html`, `mufredat-meta.json`, A4 PDF. Hepsi `D:/app/marche-cami-sitesi/mufredat/` (bu depo dışı).
- **Hacim:** yıllık plan gövdesi ≈ 30,8 bin Türkçe kelime, 963 paragraf (892 tekil): özet 14,0 bin, kazanım 11,0 bin, etkinlik 5,2 bin,
  ezber 0,6 bin. Müfredat HTML'i ≈ 13,6 bin kelime (bölüm 1-2; ay ay bakış zaten veriden kurulur). Dil başına ≈ 40-45 bin kelime,
  üç dil ≈ 130 bin kelime; `ders-defteri` `prompt_*` (≈ 1 bin) ve `hedef_a_*` hoca ekranı içindir, ayrıca.
- **Önerilen yol:** Word'ü tek kaynak tutmak; plan için `yillik-plan-<dil>.json` bindirmesi (anahtar: tarih_sıra + blok + paragraf
  özeti) `yillik-plan-cikar.py`'nin yanında üretilir ve çeviri adımı kurs projesindeki mevcut `uygula.py` zincirine (dil listesi) eklenir;
  Müfredat için `mufredat-uret.py` dil başına HTML (`mufredat-2026-2027.<dil>.html`) ve PDF çıkarır (şu an yalnız tr PDF, 41 sayfa).
  Her dil için ayrı Word çevirisi yerine paragraf düzeyinde bindirme önerilir: Word değişince yalnız eskiyen paragraflar yeniden çevrilir.
- **Risk:** âyet/hadis/dua anlamları ve kitap sayfa künyeleri; üç dilde anlam gözden geçirmesi; hoca/veli onayı. Bu işte yapılmadı.
