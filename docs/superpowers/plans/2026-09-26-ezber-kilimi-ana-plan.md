# Ezber Kilimi + egitim.ulucamii.be — Uygulama Planı

> Hazırlanış: 26 Eylül 2026, plan modu; 11 tur soru-cevap. Plan onayından sonra **ilk iş Faz 0 (altyapı kurulumu)**.
> Her fazın başında `superpowers:writing-plans` ile ayrıntılı görev listesi çıkarılır; uygulama
> `superpowers:subagent-driven-development` ile (Claude alt ajanları: Opus 5 + bol Sonnet 5). Codex yalnız vektör çizim yapar.

## 1. Bağlam

Kur'an kursunda (21 öğrenci, tek sınıf, TR+FR) öğrencilerin ezberleri için bir liste ve öğrenci başına takip gerekiyor.
Aynı sistem yetişkinlere ve genel cemaate de hizmet edecek, kurumu en profesyonel biçimde tanıtacak.

Keşifte bulunan durum:
- **Ezber takibinin parçaları var ama dağınık.** Hepsi aşağıdaki tabloda.
- **Kimlik uyuşmazlığı:** plan metni, `kevser` ve `ez01` biçimindeki üç kimlik sistemi arasında eşleme yok.
- **Eksik sesler:** planda olup sitede sesi eksik sûreler var (Alak 1–5, Hümeze, Tekâsür, Kâria, Âdiyât, Zilzâl, Beyyine).
- **Ezber Odası kurallara aykırı:** portaldaki Ezber Odası webp görsel ve emoji kullanıyor. Bu, vektör önceliği kuralına ve DESIGN.md'ye aykırı.
- **Tarih:** yıllık plandaki ilk ezber **18 Ekim 2026**'da.

| Mevcut parça | Nerede | Durum |
|---|---|---|
| Hocanın öğrenci başına kaydı | `ilerleme/{ref}.ezber`, `src/scripts/hoca-ekrani.ts:30-35, 339-370, 742-745` | 3 durum; anahtarlar plandaki serbest metinler; madde başına tarih ve geçmiş yok; belge her kayıtta baştan yazılıyor |
| Haftalık ortak ezber | `odevler/{hafta}`, `src/lib/haftalik-odev.ts` | Ortak ödev olarak kalacak |
| Velinin evde tekrar kaydı | `evCalismalari/{ref}/etkinlikler/ezber-{id}`, `src/lib/ogrenme-ilerleme.ts` (1/1/3/7 gün) | 19 kimlik kurallarda sabit yazılı |
| Ezber Odası (öğrenci modu) | `src/scripts/veli-portali.ts:552-883` | Tarayıcı depolaması + webp/emoji görseller |
| Katalog | `src/lib/ezber-verisi.ts` (15 sûre + 4 dua, 5 dilde anlam) | Yerini yeni tek katalog alacak |
| Çalar | `src/components/SesliDers.astro`, `src/scripts/ecouter.ts` | Âyet âyet dinleme, «tekrar» kipi; yeniden kullanılacak |

**Hedef:**
- Tek ezber kataloğu ve öğrenci başına ayrıntılı takip.
- Telefonda hızlı çalışan hoca ekranı; velinin görebildiği kişisel kilim.
- Herkese açık, bol görselli **Ezber Kilimi**.
- Bunların hepsi yeni eğitim platformu **egitim.ulucamii.be** üzerinde. Diğer eğitim bölümleri sonra kademeli olarak buraya taşınacak.

## 2. Kararlar (Rıdvan, 26 Eylül 2026)

| Konu | Karar |
|---|---|
| Kitle | Hafta sonu çocuk kursu + yetişkin eğitimi + genel cemaat |
| İçerik | Namaz sûreleri, namaz duaları, temel bilgiler. **Kapsam:** yıllık plandaki tüm ezberler + namaz ekleri (Âyetü'l-Kürsî, İnşirâh, 32 farz, tesbihat) + **Amme cüzü** (8. şerit) |
| Seviyeler | 7 şerit (namaz kılabilme sırası) + 8. şerit Amme + **kenar suyu** (seviye dışı, dönemlik ezberler). Kesin liste Diyanet kaynaklarıyla doğrulanıp onaya sunulacak |
| Plan ilişkisi | Öğrenci kendi hızında ilerler; yıllık plandaki tarih «sınıf hedefi» olarak görünür; **yıllık plan değişmez** |
| Takip | Hoca işaretler, veli görür. 4 basamak: Çalışıyor → Hocaya okudu → Pekişti (≥1 hafta sonra) → Kalıcı (≥1 ay sonra). Kalite: Tam / Az hatalı / Tekrar gelsin + kısa not |
| Veliye not | Yumuşak dille görünür («Çok güzel okudu», «Küçük düzeltmelerle geçti», «Bir kez daha çalışalım»); Fransızca konuşan ailelere çeviri gider |
| Hoca ekranı | Ayrı «Ezber» sekmesi + defter bağlantısı; **tek ortak hoca hesabı**; **telefon öncelikli** |
| Karşılaştırma | Öğrenciler arasında sıralama yok; herkes yalnız kendi ilerlemesini görür |
| Metafor | **Ezber Kilimi / Ezber Kilimim**. Her ezber kilime bir motif dokur: kontur → yarı dokunmuş → renkli → altın kenar |
| Motif dili | Anadolu kilim motifleri + İslâmî geometrik desenler birlikte. Rozet, sertifika ve karne çerçeveleri geometrik (girih, sekiz köşeli yıldız, rûmî-hatâyî) |
| Figür kuralı | Canlı figür yok, hayvan yok. **Tek istisna:** yüzsüz küçük insan siluetleri (namaz, rahle). Peygamber ve sahabe asla çizilmez; Arapça yazı hiçbir zaman çizim olarak konmaz |
| Ödüller | Seviye rozetleri. **Ezber Sertifikası** yalnız hocanın dinlediği ezberlere verilir. Genel cemaat, «kendi çalışmasıyla, hoca dinlemeden» ibareli **Çalışma Belgesi** alır. Dönem sonunda ezber karnesi |
| Basılı materyal (A4, ev yazıcısı, vektör PDF) | Kişisel kilim çıktısı; ezber kartları (bir sayfada 8 kart, arkasında ses için kare kod); öğrenci defterinin «Ezber listem» sayfasının güncellenmesi |
| Okunuş | Sayfa diline göre ve açılıp kapanabilir: TR sayfada Türkçe usulü, diğer dillerde Fransızca usulü |
| Ses | Sûreler **yalnız Diyanet'ten** (eksikler kuran.diyanet.gov.tr'den indirilir). Dualar namaz.diyanet.gov.tr'den. Diyanet kaydı yoksa yapay ses (TTS), yalnız **Kur'an dışı** metinlerde ve hoca onayından sonra |
| Genel cemaat | İsteğe bağlı hesap: **e-posta bağlantısı + Google ile giriş**. Hesapsız kullanımda ilerleme cihazda kalır. Yaş sorulmaz. İlerleme **öz sınavla** kaydedilir. «Hesabımı sil» + 24 ay hareketsiz kalan hesap silinir |
| Yetişkinler | Portala öğrenci olarak eklenir ve kendi e-postasıyla girer. Seviye testindeki «ezbere biliyorum» cevapları yalnız öneri olarak aktarılır, hoca teyit eder |
| Veli bildirimi | Portal + haftalık cuma e-postasında «Bu hafta ezber» özeti (v2 şablon, iletişim dili) |
| Çalışma modları | Dinle-tekrarla, kademeli gizleme (öz sınav), oyunlar (sıralama, eşleştirme, eksik kelime) |
| Ezber Odası | Yeni kataloğa bağlanır. Evdeki tekrar hocaya görünür ama resmî basamağı değiştirmez. Webp ve emoji görseller Codex vektörleriyle değiştirilir |
| Platform | **egitim.ulucamii.be**, Firebase Hosting (ulucamii-portal). **Yepyeni tasarım:** modern ve ferah, çizimlerle sıcak; **kurs yeşili (#134420) + altın**; Arapça yazı **Türk mushaf hattına yakın** |
| Taşınacaklar (kademeli) | Kur'an kursu sayfaları; veli portalı + hoca ekranı; seviye testi + yetişkin eğitimi; muhtedi eğitimi, vaazlar, irşat, UİP |
| Taşınmayanlar | **İhtida** (sayfa, form, EK-9/EK-10) ulucamii.be'de kalır. **ihtida.ulucamii.be'ye dokunulmaz**; Rıdvan onu Müşavir beye gösterecek |
| Sıra ve takvim | Önce sınıf, sonra vitrin, sonra hesaplar ve belgeler, en son taşıma. Faz 1 **18 Ekim'den önce** |

## 3. Hedef mimari

### 3.1 Depo ve platform
- **İkinci Astro uygulaması aynı depoda:** `egitim/` (kendi `astro.config.mjs` dosyası; `site: 'https://egitim.ulucamii.be'`, `output: 'static'`).
  - Ortak kod `@ortak/*` takma adıyla ana `src/` klasöründen paylaşılır: katalog, Firebase istemcisi, i18n yardımcıları, çalar.
  - Kök `node_modules` ortak kullanılır; yeni depo açılmaz.
- **Barındırma:** `firebase.json` dosyasına `hosting` hedefi `egitim` eklenir; `.firebaserc` içinde hedef eşlemesi yapılır.
- **Yayın akışı:** önce önizleme kanalında denenir, sonra canlıya alınır.
  - Yayın ya GitHub Actions ve en az yetkili bir servis hesabı sırrıyla, ya da `scripts/firebase-cami.ps1` üzerinden yapılır. Seçim Faz 1'de, onayla.
  - Her yayın `docs/YAYIN-KAYITLARI.md` dosyasına işlenir.
- **Giriş:** yeni platformda `authDomain: 'egitim.ulucamii.be'` kullanılır (Hosting'in kendi `/__/auth` yardımcısı). Böylece Google girişi kendi alan adımızda görünür ve Safari/iPhone'da sorun çıkmaz.
  - Ana site eski ayarla çalışmaya devam eder.
- **Spark planı sınırı:** Hosting günde 360 MB trafik taşır. **Ses dosyaları ulucamii.be'den (GitHub Pages, CORS \*) verilir**; platform yalnız HTML, JS, SVG ve fontu taşır.
- **Güvenlik başlıkları:** Firebase Hosting'de CSP, HSTS ve `X-Content-Type-Options` tanımlanır; bu, ana siteye göre bir kazanım.
- **Diller:** tr/fr/en/nl/de; ana sitedeki `yollar` + `Record<Dil,…>` düzeni ve `docs/DIL-NL-DE.md` kuralları uygulanır.

### 3.2 Tek ezber kataloğu (repoda, statik, sürümlü)
- **Dosyalar:** `src/data/ezber/katalog.json` + `katalog.schema.json` (`@cfworker/json-schema` ile doğrulanır) + `src/lib/ezber/katalog.ts`.
- **Kimlik biçimi:**
  - `s-` sûre (`s-fatiha`, `s-alak-1-5`, `s-nebe`)
  - `d-` dua (`d-subhaneke`)
  - `b-` bilgi (`b-imanin-sartlari`)
- **Madde alanları:**
  - kimlik, tür, `seviye` (1–8 ya da `kenar`) ve seviye içindeki sıra
  - 5 dilde ad
  - Arapça metin: âyet/cümle parçaları halinde, kaynak kaydıyla
  - okunuş `tr` ve okunuş `fr`
  - 5 dilde anlam, `inceleme` bayrağıyla
  - ses: tam okuma ve parçalar; kaynak, sha256 ve `yapay` bayrağı
  - motif kimliği, plandaki «sınıf hedefi» tarihleri
- **Eşleme tabloları** (plan JSON'u elle düzenlenmez):
  - `plan-eslesme.json`: plandaki 49 serbest metin → katalog kimliği
  - `eski-kimlikler.json`: `EZBER_LISTESI.id` ve seviye testinin `ez01…` kimlikleri → katalog kimliği
- `ezber-verisi.ts`, geçiş süresince katalogdan türetilen bir uyum katmanı olarak kalır.

### 3.3 Durum makinesi (saf işlevler)
Dosya: `src/lib/ezber/durum.ts`. Ekran ve veritabanı bilmez; birim testlidir.

- **Basamaklar:** 0 yok · 1 çalışıyor · 2 hocaya okudu · 3 pekişti · 4 kalıcı.
- **Hocanın dinlemesi** (kalite: tam, az hatalı, tekrar gelsin):
  - 0 ya da 1 + tam/az → **2**; sonraki kontrol 7 gün sonra.
  - 2 + tam/az + kontrol zamanı gelmiş → **3**; sonraki kontrol 30 gün sonra.
  - 3 + tam/az + kontrol zamanı gelmiş → **4**.
  - «Tekrar gelsin» → bir basamak düşer (en az 1); 7 gün sonra yeniden kontrol.
  - Kontrol zamanından önce dinleme yalnız olay olarak kaydedilir. Hoca isterse «yine de ilerlet» ile basamağı açıkça ilerletebilir.
- **Genel cemaat (öz sınav):** aynı makine, kaynak `oz`.
  - 2. basamak için kademeli gizlemenin son adımı (metnin tamamı gizli) tamamlanmalı.
  - 3 ve 4 aynı zaman kurallarıyla yeniden öz sınav ister.
- **Öneri — onay isteniyor:**
  - **Rozet:** seviyedeki tüm ezberler ≥ 2.
  - **Sertifika:** tümü ≥ 3.
  - **Altın kenar:** tümü 4.

### 3.4 Firestore veri modeli ve kurallar

**Yeni ve değişen koleksiyonlar**

| Koleksiyon | Ne tutar |
|---|---|
| `ezberDurum/{ref}` | `ogeler.{ezberId}: {basamak, kalite, not, son, sonrakiKontrol, surum}` + `oneriler` (seviye testinden) |
| `ezberDurum/{ref}/olaylar/{auto}` | Yalnız eklenir, silinmez: dinleme ve atama geçmişi (karne ve haftalık özet için) |
| `ezberUyeleri/{uid}` | Genel cemaat hesabı: dil, `ogeler` (öz takip), rozetler. E-posta Auth'ta kalır; burada saklanmaz |
| `evCalismalari/.../ezber-{id}` | Sabit 19 kimlik yerine katalog kimliği kalıbı + alan şekli doğrulaması |

**Yazma ve okuma yetkileri**
- `ezberDurum`: hoca yazar, veli okur (`veliOkur(ref)`, `islemeAcik(ref)`).
- `ezberDurum/.../olaylar`: hoca oluşturur, veli okur.
- `ezberUyeleri`: yalnız `request.auth.uid == uid` olan kişi okur ve yazar.

**Nasıl yazılır**
- Nokta yollu `updateDoc` ile alan alan birleştirilir. Aynı öğeye iki cihaz aynı anda yazarsa işlem (transaction) kullanılır.
- Bu, ortak hoca hesabı iki telefonda açıkken kayıp yaşanmasını önler.

**Geçiş ve eşleme**
- `ilerleme/{ref}.ezber` → önce kuru çalıştırılan betikle `ezberDurum`'a taşınır; eski alan salt okunur bırakılır.
- Öğrenci silme dökümüne yeni koleksiyonlar eklenir: `src/lib/portal-idare.ts:31-77`.

**Zorunlu kural denetimi**
- Herkese kayıt açılınca **rastgele giriş yapmış kullanıcı** şu an erişemediği hiçbir veriye erişememeli.
- Salt `request.auth != null` koşuluna dayanan her kural bulunur; bunun için yeni Firebase denetçi becerisi ve emülatör testleri kullanılır.

### 3.5 Kilim çizici (çerçevesiz, her yerde aynı)
- **Dosya:** `src/lib/ezber/kilim.ts`. Katalog ve durumdan tek bir SVG üretir:
  - motifler `<symbol>` + `<use>` ile çizilir (kimlik önekli);
  - şeritler seviyelerdir, kenar suyu çerçevedir, 8. şerit Amme'dir;
  - yatay (masaüstü, baskı) ve dikey (telefon) yerleşim.
- **Görünüm:** basamaklar dolgu deseni + küçük işaretle ayrılır; renk tek başına bilgi taşımaz.
- **Erişilebilirlik:** her kilimin yanında metin karşılığı olarak bir liste veya tablo bulunur.
- **Kullanıldığı yerler:** veli portalı, hoca öğrenci kartı, platformdaki «Kilimim» sayfası, A4 baskı sayfaları, sertifika ve karne.
- **Tema:** CSS değişkenleriyle hem ana sitenin hem yeni platformun renklerine uyar.

## 4. Fazlar

### Faz 0 — Altyapı kurulumu (plan onayından hemen sonra, ~½ gün)
1. `git status --short` ile mevcut işler korunur (diğer oturumların izlenmeyen dosyaları: `CODEX-DEFTER-KOORDINASYON.md`, `scripts/veli-cuma-gonder*.py`…).
   - Özellik işi ayrı bir worktree ve dalda yürür (`superpowers:using-git-worktrees`, dal `ezber-kilimi`).
   - Commit ve push yalnız Rıdvan isteyince yapılır.
2. **Firebase kural becerileri:**
   - Önce `npx skills add --help` ile bayraklar doğrulanır.
   - Sonra `DISABLE_TELEMETRY=1 npx skills add firebase/agent-skills --skill firestore-rules-creation --skill firebase-security-rules-auditor -a claude-code -g --copy -y` çalıştırılır.
   - Kurulan `SKILL.md` dosyaları kullanılmadan önce **baştan sona okunur** (tedarik zinciri kontrolü).
   - `firestore-rules-creation` kural dosyasına doğrudan yazdığı için yalnız rehber olarak kullanılır.
3. **svgo sabitleme:**
   - `npm i -D svgo@4.1.0`
   - Yeni `scripts/svg-denetim.mjs`:
     - `<image>`, `data:`, `<script>`, `on*`, dış `href` ve `<text>` yasak (Arapça çizim olmaz);
     - `viewBox` zorunlu, boyut < 12 KB;
     - `prefixIds` + `preset-default` (viewBox ve title korunur).
   - Betik `npm run denetim:svg` olarak `dogrula` zincirine eklenir.
4. **Firebase aracı güncellemesi:** `npm i -g firebase-tools@15.31.0` ve ardından `firebase --version` doğrulaması.
   - Canlı işlemler yine yalnız `scripts/firebase-cami.ps1` ile yapılır.
5. **Temel kural denetimi:** mevcut `firebase/firestore.rules` denetçi beceriyle taranır.
   - «Rastgele oturum açmış kullanıcı» senaryosu `tests/kurallar/firestore.test.mjs` dosyasına eklenir.
   - Bulgular ayrı başlıkla raporlanır (kalıcı kural: mevcut hatalar da düzeltilir).
6. **Codex 1 dakikalık deneme:** `~/.claude/references/codex-vektor-cizim.md` komutuyla tek bir SVG çizdirilir.
   - Kabuk kilitlenirse «Codex sanal alan tuzağı» hafızasındaki yol izlenir (talimat depo içi `.codex/` klasöründe).
7. `settings.json` dosyasına ve eklentilere dokunulmaz.

### Faz 1 — Temel: sınıfta kullanım (hedef **17 Ekim 2026 Cumartesi canlı**; 18 Ekim'deki ilk plan ezberinde kullanılır)

**Zorunlu (18 Ekim'e kesin yetişecekler)**
- **1a. Katalog iskeleti:**
  - kimlik, tür, seviye, sıra, 5 dilde ad; plan ve eski kimlik eşlemeleri;
  - mevcut sesler bağlanır.
  - Seviye listesi dinî kaynaklarla doğrulanır: önce yerel arşiv `D:\ihtisas` (Diyanet İlmihali, Elifbâ s. 34–39), sonra kuran.diyanet.gov.tr.
  - **Onay kapısı:** seviye listesi Rıdvan'a tablo halinde sunulur.
- **1b. Veri modeli, kurallar, durum makinesi ve testler (§3.3–3.4).**
  - Kurallar emülatörde yeşil olduktan sonra canlıya alınır (`npm run firebase:kurallar`, onayla).
- **1c. Hoca «Ezber» sekmesi** (`src/scripts/hoca-ezber.ts`; `hoca-ekrani.ts` içindeki eski ezber formunun yerine):
  - **Bugün:** yoklamada «var» olanlar; her kartta sıradaki ezber ve tekrarı gelenlerin sayısı. Dokunulunca öneri gelir: 3 büyük düğme + not kalıpları (`src/lib/defter-kaliplari.ts` düzeninde, öğrenci adı asla yazılmaz).
  - **Tekrar kuyruğu:** kontrol zamanı gelenler.
  - **Tablo:** öğrenci × ezber, kilim işaretleriyle; yatay kaydırma, telefonda ikincil görünüm.
  - **Defter bağlantısı:** defterde «Ezber dinlendi» çipi aynı seçiciyi açar, `ezberDurum`'a ve günün defter metnine yazar (`src/scripts/ders-defteri.ts`).
  - Sınıftaki zayıf bağlantıya karşı Firestore yerel önbelleği ve bekleyen yazma göstergesi.
- **1d. Veli portalında kilim** (`veli-portali.ts:1381` civarı):
  - Kişisel kilim + liste + yumuşak dilli notlar; Fransızca notlar mevcut çeviri hattıyla (`npm run defter:cevir` düzeni).
  - Ezber Odası kataloğa bağlanır.

**Hedef (yetişmezse Faz 2'nin ilk haftasına kayar)**
- **1e. Tasarım yönü:**
  - `impeccable` becerisiyle 2–3 ekran taslağı hazırlanır: giriş, Ezber Kilimi, madde sayfası, hoca telefonu.
  - Tasarım jetonları: kurs yeşili + altın, yerel fontlar.
  - Türk mushaf hattına yakın Arapça font için adaylar karşılaştırılır; **lisansı doğrulanır**, glif kapsamı ve alt küme kontrol edilir. Yedek: Amiri Quran.
  - **Onay kapısı:** Rıdvan taslaklardan seçer. Sonra `egitim/docs/DESIGN.md` yazılır.
- **1f. Platform iskeleti:**
  - `egitim/` uygulaması, 5 dilli yönlendirme, ana siteye dönüş bağlantısı.
  - Firebase Hosting sitesi + önizleme kanalı; DNS kaydı ve yetkili Auth alanı (canlı adımlar, onayla).
  - Katalog sayfası v1: seviye şeritleri, adlar, ses varsa çalar.

### Faz 2 — Herkese açık Ezber Kilimi (hedef Kasım 2026)
- **İçerik zenginleştirme:**
  - Arapça metin kuran.diyanet.gov.tr ile **harf harf** karşılaştırılır (betik + örneklem kontrolü).
  - TR anlam yalnız `kuran.diyanet.gov.tr/mushaf/kuran-meal-2/…` adresinden alınır. FR ve EN için `ezber-verisi.ts` kaynak sözleşmesi izlenir; nl/de Diyanet TR'den çevrilir ve `inceleme` bayrağı taşır.
  - Okunuş iki usulle; hoca kontrolünden geçer.
  - **Ses:**
    - Eksik sûreler (Alak, Hümeze, Tekâsür, Kâria, Âdiyât, Zilzâl, Beyyine ve Amme'nin kalan 18 sûresi) Diyanet'ten tam ve âyet âyet indirilir. Kaynak ve sha256 `docs/dinleme-ses-kaynaklari.json` dosyasına yazılır.
    - Dualar namaz.diyanet.gov.tr'den alınır. Yalnız bulunamayan Kur'an dışı metinler Gemini TTS ile `sesli-anlatim` hattından üretilir (rotasyonlu anahtar havuzu).
    - Yapay ses arayüzde küçük bir notla belirtilir; yayından önce hoca onaylar.
- **Madde sayfaları:** Arapça (Türk mushaf hattı, `lang="ar"`, `dir="rtl"`), katlanır okunuş, anlam, ses, «namazda nerede okunur» etiketi, motif ve sınıf hedef haftası.
- **Çalışma modları** (framework'süz TS modülleri, ana sitenin `data-*` kanca düzeni):
  - **Dinle-tekrarla:** `ecouter.ts` genişletilir; parça parça 3 kez, 0,75×, sıralı.
  - **Kademeli gizleme:** kelimeler adım adım silinir, ilk harf ipucu verilir; son adım öz sınavdır.
  - **Oyunlar:**
    - âyet/cümle sıralama (sürükle-bırakın yanında dokunarak seçme);
    - anlam eşleştirme;
    - eksik kelime.
    - Klavye ve ekran okuyucuyla kullanılabilir; azaltılmış hareket tercihine uyar.
- **Hesapsız ilerleme:** cihazda saklanır (try/catch; depolama kapalıysa sayfa yine çalışır).
- **Codex görsel seti (§5)** ve Claude'un koddan çizdiği grafikler:
  - kişisel kilim;
  - seviye haritası;
  - 4 basamaklı döngü şeması;
  - tekrar takvimi ısı haritası;
  - «Namazda ezberler nerede okunur» etkileşimli şeması (Codex siluetleri + gerçek metin etiketleri).

### Faz 3 — Hesaplar, belgeler, e-posta (hedef Aralık 2026, 1. dönem sonundan önce)
- **İsteğe bağlı hesap** (e-posta bağlantısı `noreply@ulucamii.be` + Google açılır pencere/yönlendirme):
  - Hesap açma ancak kural denetimi ve «rastgele kullanıcı» testleri yeşilse açılır.
  - Veli e-postasıyla Google hesabı çakışması Auth emülatöründe sınanır (`firebase.emulators.json`'a Auth emülatörü eklenir).
  - Cihazdaki ilerleme hesaba aktarılır.
- **Hesap silme:** «Hesabımı sil» düğmesi Firestore'daki üye kaydını ve Auth kullanıcısını siler.
  - 24 ay hareketsiz hesap temizliği aylık **Apps Script zaman tetikleyicisiyle** yapılır (Spark'ta Cloud Functions yok); önce kuru çalıştırma.
  - Gizlilik notunda yazılır.
- **Rozetler** (Codex geometrik) ve **belgeler:** Ezber Sertifikası (hoca onaylı), Çalışma Belgesi (kendi beyanı), dönem sonu karnesi, kişisel kilim A4, ezber kartları.
  - Hepsi A4 baskı CSS'li sayfalardan tarayıcıda «Yazdır / PDF» olarak alınır.
  - Toplu karneler betikle Chrome «print-to-pdf» ile üretilir.
  - Kurumsal kimlik `kimlik.json`'dan gelir (kurs yeşili, Work Sans, ana SVG'den logo).
  - **PDF'te raster olmadığı** betikle doğrulanır.
- **Haftalık cuma e-postası:** «Bu hafta ezber» bloğu (yeni okunanlar, tekrarı gelenler, sıradaki).
  - Yalnız `veli-eposta-sablon.gs` v2 + `icerik_koy` ile, iletişim dilinde.
  - Diğer oturumun `scripts/veli-cuma-gonder*.py` işiyle koordine edilir. **Gönderim ayrıca onaylanır.**
- **Yetişkinler portala eklenir** (`portal-yonetim.py` düzeni). Seviye testindeki `ez..` cevapları `oneriler` alanına aktarılır; hoca teyit eder.
- **Öğrenci defteri:** «Ezber listem» sayfası yeni katalogla yeniden üretilir. Kurs projesi `D:\ulu-camii-kuran-kursu`, `belgeler/ogrenci-defteri-2026-2027/`.

### Faz 4 — Kademeli taşıma (Ocak–Mart 2027; her bölüm ayrı yayın)
Sıra:
- 4a veli portalı + hoca ekranı;
- 4b Kur'an kursu sayfaları (müfredat, yıllık plan, materyaller, günlük; CMS içerik yolları);
- 4c seviye testi + yetişkin eğitimi;
- 4d muhtedi eğitimi, vaazlar, irşat, UİP.

Her bölümde yapılacaklar:
- **Yönlendirme sayfaları:** ulucamii.be'deki eski adreslerde, `location.search` ve `hash`'i koruyan yönlendirme sayfaları.
  - Bu sayfalarda **ziyaret sayacı yoktur** (oobCode sızıntısı dersi).
  - Kurallara göre canonical ve `noindex` ayarlanır.
- **Kalıcı kare kodlar:** yetişkin kitabındaki `ulucamii.be/e/<kod>/` kodları **sonsuza dek** çalışır; bağlantı testi basılı kodların tam listesini tarar.
- **Apps Script:** formların kaynak (origin/referer) kontrolü yeni alan adına göre güncellenir.
- **Veli ve e-posta:** veliye bir kez yeniden giriş duyurusu gider (onayla); e-posta şablonlarındaki bağlantılar güncellenir.
- **Menü:** ana site «Eğitim» menüsü yeni platforma bağlanır. Ana sayfaya ancak Rıdvan isterse dokunulur.
- **Yayın ve kayıt:** YAYIN-KAYITLARI'na işlenir; canlı doğrulama yapılmadan «yayında» denmez.
- **Dokunulmayanlar:** ihtida bölümü ve ihtida.ulucamii.be.

## 5. Görsel üretim (Codex — saf vektör)

| Parti | İçerik | Adet |
|---|---|---|
| M1–M3 | Ezber motifleri (Anadolu kilim + İslâmî geometrik), 28'lik partiler | ~70 |
| R | Seviye rozetleri + kenar suyu nişanı + sertifika/karne çerçeveleri | ~12 |
| S | Sahneler: giriş, her seviye başlığı (kapı, seccade, rahle, gece/hilal, minare…), boş durum, 404 | ~16 |
| I | Şema parçaları: yüzsüz namaz duruşu siluetleri (kıyam, rükû, secde, ka'de), döngü okları | ~10 |
| U | Arayüz ikonları: dinle, tekrar, gizle, oyun, yazdır, rozet… (tek çizgi kalınlığı) | ~32 |
| P | Mevcut portaldaki webp/emoji görsellerin vektör karşılıkları | ~10 |

**Görev dağılımı**
- Talimatlar `GOREV.md` dosyasında İngilizce yazılır (referans şablonu kullanılır).
- Çizim kuralları:
  - `currentColor`, en fazla 2 vurgu rengi;
  - `<text>` yok, Arapça yok;
  - canlı figür yok; tek istisna yüzsüz küçük siluetler;
  - peygamber ve sahabe yok, logo yeniden çizilmez.
- Claude her dosyayı denetler: XML ayrıştırma, `denetim:svg`, svgo `prefixIds`.
- Sonra sayfaya gömer ve derlenmiş sayfanın görüntüsüne bakar.
- Codex'in kotası partiler halinde izlenir. Başarısız ya da işe yaramaz koşular kapatılır; arkada iş bırakılmaz.

## 6. Kritik dosyalar

**Yeni**
- Katalog: `src/data/ezber/{katalog.json, katalog.schema.json, plan-eslesme.json, eski-kimlikler.json}`
- Mantık: `src/lib/ezber/{katalog.ts, durum.ts, kilim.ts, metinler.ts}`
- Hoca ekranı: `src/scripts/hoca-ezber.ts`
- Yeni platform: `egitim/**` (astro.config, sayfalar, bileşenler, stiller, `docs/DESIGN.md`)
- Betikler: `scripts/svg-denetim.mjs`, `scripts/ezber-gecis.mjs` (kuru → `--yaz`), `scripts/pdf-vektor-denetim.mjs`, `scripts/apps-script/uye-temizlik.gs`
- Belgeler: `docs/EZBER-KILIMI.md`, `docs/EGITIM-PLATFORMU.md`

**Değişecek**
- Portal ve hoca ekranı: `src/scripts/hoca-ekrani.ts`, `src/scripts/veli-portali.ts`, `src/scripts/ders-defteri.ts`, `src/lib/ezber-verisi.ts` (uyum katmanı), `src/lib/portal-idare.ts`
- Firebase: `firebase/firestore.rules`, `firebase.json`, `.firebaserc` (hosting hedefi), `firebase.emulators.json` (Auth emülatörü)
- Doğrulama: `package.json` betikleri, `scripts/dogrula-codex.mjs`
- Belgeler: `docs/PROJE-HAFIZASI.md`

**Yeniden kullanılacaklar**
- Çalar: `SesliDers.astro`, `ecouter.ts`
- Mevcut mantık: `ogrenme-ilerleme.ts` (tekrar aralıkları), `defter-kaliplari.ts` (kalıp düzeni), `haftalik-odev.ts`
- Dil: `src/i18n/utils.ts` (`ceviri`, `yol`), `icerikDili` (`src/lib/icerik.ts`)
- Arapça font: `arapca:altkume` betiği (font alt kümesi)
- E-posta: `veli-eposta-sablon.gs` v2
- Testler: `tests/web/helpers/mektep.mjs` (yapay veri)
- Doğrulama zinciri: `dogrula:codex`

## 7. Doğrulama

**Birim testleri**
- Durum makinesi: bütün geçişler, zaman sınırları, öz sınav.
- Katalog bütünlüğü:
  - kimlikler benzersiz;
  - plandaki 49 metnin hepsi eşlenmiş;
  - her ses dosyası mevcut ve sha256'sı tutuyor;
  - Kur'an sesleri yalnız Diyanet'ten ve `yapay=false`.
- Kilim çizici: SVG geçerli, kimlikler benzersiz.

**Kural testleri** (`npm run test:kurallar`, emülatör, `demo-ulucamii`)
- `ezberDurum`, `olaylar` ve `ezberUyeleri` erişimleri.
- «Rastgele kullanıcı» tüm koleksiyonlarda reddedilir.
- Alan şekilleri ve boyut sınırları.

**Playwright**
- Pixel 7 ile hoca Ezber sekmesi (Bugün, Tekrar, Tablo, defter bağlantısı).
- Veli kilimi.
- Platform sayfaları + axe.
- Oyunlar klavyeyle oynanabilir; azaltılmış hareket tercihine uyulur.

**Denetimler**
- `denetim:svg`, `design:check`.
- Baskı çıktılarında `pdf-vektor-denetim` (raster yok).
- Türkçe imlâ ve dinî metinlerde örneklem kontrolü.

**Kapı:** her fazda `npm run dogrula:codex` + yeni `egitim` derleme/test adımları. Görsel değişiklikte `npm run onizle` ile ekran görüntüsü (telefon, masaüstü, açık/koyu tema) incelenir.

**Canlı doğrulama:** yayından sonra gerçek adreste kontrol edilir ve YAYIN-KAYITLARI'na yazılır. `scripts/portal-test.py` olağan doğrulamada çalıştırılmaz.

## 8. Canlı adımlar

Her canlı adımdan önce kısa bir onay alınır. Yerel geliştirme izni yayın izni sayılmaz.

1. Firestore kurallarının yayını (Faz 1).
2. Ana site push ve Pages yayını: hoca ve veli ezber özellikleri (Faz 1).
3. Firebase Hosting: site oluşturma, `firebase.json` hosting hedefi, önizleme kanalı, canlı yayın (Faz 1f).
4. DNS: egitim.ulucamii.be kaydı. ihtida kaydının eklendiği paneldir, erişim Rıdvan'da (Faz 1f).
5. Auth: yetkili alan adı (Faz 1f). Faz 3'te Google sağlayıcısı, OAuth yönlendirme adresi, onay ekranı adı ve logosu, herkese kayıt açılması.
6. GitHub Actions için servis hesabı sırrı; yayının CI'dan yapılması seçilirse (Faz 1f).
7. Apps Script: haftalık e-posta bloğu, hesap temizlik tetikleyicisi (Faz 3). E-posta gönderimleri ayrıca onaylanır.
8. Faz 4'teki her taşıma ve veliye yeniden giriş duyurusu.

## 9. Riskler ve açık konular

- **Google onay ekranının destek e-postası:** yalnız proje sahibinin Google hesabı ya da bir Google Grubu olabilir. Bu, «ulucamii2026@gmail.com asla görünmez» kuralıyla çakışabilir.
  - Öneri: dernek hesabına ait bir Google Grubu. Karar Faz 3'te.
- **Herkese kayıt açmak** zayıf kuralları açığa çıkarır. Faz 0 ve Faz 3'te denetim yapılır; kurallar yeşil olmadan kayıt açılmaz.
- **Spark sınırları:** Hosting'de günde 360 MB, Firestore'da günde 50 bin okuma. Ses ana siteden verilir; ilk ay kullanım izlenir.
- **Mushaf fontu:** lisans ve glif kapsamı. Yedek Amiri Quran. Metin kaynağı her zaman Diyanet.
- **Arapça yapay ses kalitesi:** yalnız Kur'an dışı metinlerde kullanılır; hoca onayı ve arayüzde not.
- **18 Ekim kapsamı:** zorunlu ve hedef işler ayrıldı. Zorunlu kısım yetişmezse Rıdvan'a önceden haber verilir.
- **Eşzamanlı oturumlar:** izlenmeyen dosyalara dokunulmaz; worktree kullanılır; her commit öncesi `git status`.
- **Basılı kare kodlar ve e-posta bağlantıları:** yönlendirme sayfaları kalıcıdır ve bağlantı testiyle korunur.
- **Veliler için tek seferlik yeniden giriş** (Faz 4a): duyuru ve destek metni hazırlanır.

## 10. Kayıt ve hafıza
- Plan onaylanınca bu dosyanın özeti `docs/EZBER-KILIMI.md` ve `docs/EGITIM-PLATFORMU.md` dosyalarına işlenir; `docs/PROJE-HAFIZASI.md`'ye bağlantı eklenir.
- Proje hafızasına iki not yazılır:
  - «Ezber Kilimi kararları (26 Eyl 2026)»;
  - «egitim.ulucamii.be platform kararı; ihtida ulucamii.be'de kalır, ihtida.ulucamii.be dokunulmaz».
- Her yayın aynı oturumda `docs/YAYIN-KAYITLARI.md`'ye yazılır.
