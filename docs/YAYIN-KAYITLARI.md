# Web yayını kayıtları

Kalıcı kural: [AGENTS.md](../AGENTS.md). Tarihler Europe/Brussels saat dilimindedir.
Kayıtlar içerik yayınının kanıtıdır; sırf kayıt güncelleyen belge commit'i yeni içerik yayını değildir.
Kaynak proje: `D:/ulu-camii-kuran-kursu`; kurs indeksi `belgeler/YAYIN-KAYITLARI.md`.

## 21 Eylül 2026 (3) — dinleme sayfaları `/e/<kod>/` (ders kitabı kare kodlarının hedefi)

- Zaman: 21 Eylül 2026 03:10 – 05:05 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Dayanak: kullanıcının kişiye özel ders kitabı talimatı («içeriğinde kare kodlar olsun, sesli dinlemeler için kullanılabilsin… full otonom ilerle»); kare kodların çalışması için sayfaların yayında olması gerekir.
- Kapsam: 74 kod → 74 Fransızca sayfa (`noindex, nofollow`, site haritası dışı, kanonik adres yok). 14 sûre âyet âyet (71 satır sesi) + bütün kayıt; Sübhâneke, Tahiyyât, Salli, Bârik, Rabbenâ (2), Kunut (2), ezan, kamet, ezan duası; Elifbâ ve tecvid aşamaları (843 öge); `test` kodu seviye testine yönlendirir. Sayfalarda **kişisel veri yok**; kod kişiyi değil içeriği adlandırır. Kaynak proje özeldir ve depoya girmez.
- Ses kaynakları (yalnız resmî Diyanet; hepsi yerelde): mushaf kaydı Hafız Osman Şahin (`webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/ar_OsmanSahin/`), Namaz Portalı (`namaz.diyanet.gov.tr`), Elifbâ portalı (`kuran.diyanet.gov.tr/elifba`). Her dosyanın kaynak adresi ve SHA-256 özeti: `docs/dinleme-ses-kaynaklari.json`.
- Aynı yayında mevcut sistemde düzeltilen: `public/media/ses/dualar/{subhaneke,tahiyyat,sallibarik}.mp3` dosyalarının kaynağı belgesizdi → resmî Namaz Portalı kayıtlarıyla değiştirildi (öğrenci ezber sayfası bu dosyaları zamanlamasız, bütün olarak çalar; süreler 17,4→13,9 / 41,0→33,0 / 57,5→40,1 sn).
- Yayından ÖNCE yakalanan üretim kusuru: üreteç tek âyetin bölümlerine (Âyetü'l-Kürsî) satır numarasını âyet numarası sanıp Bakara 1–2'nin sesini bağlamıştı; satır sesi artık yalnız tam sûrede ve sûre boyunca tek kayıttan bağlanır, `tests/web/ecouter.spec.mjs` içindeki bekçi testi tekrarını engeller. Harf sayfalarında portalın noktasız yazdığı yâ' düşüyordu (27/28) → 28/28, kitap sırası.
- Değişen yollar (720 dosya): `src/pages/e/[kod].astro`, `src/lib/ecouter.ts`, `src/scripts/ecouter.ts`, `src/styles/ecouter.css`, `src/data/ecouter.json`, `tests/web/ecouter.spec.mjs`, `docs/DINLEME-SAYFALARI.md`, `docs/dinleme-ses-kaynaklari.json`, `public/media/ses/ayet/` (71), `public/media/ses/dualar/` (9 yeni + 3 değişen), `public/media/ses/elifba/k/` (≈ 23 MB).
- İçerik commit'i `2d09f07`; Release kullanılmadı. [Pages 35551772695](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35551772695) başarılı.
- Testler (yayın öncesi, yerel): `npm run check` 0 hata / 0 uyarı; `npm run build` 980 sayfa; `tests/web/ecouter.spec.mjs` 26/26; tam `playwright test` 530 geçti / 2 kaldı — kalan ikisi (`seviye-testi.spec.mjs:481`, odak beklentisi) çalışma ağacında duran, **bu yayına girmeyen** «soruyu sesli dinleme» çalışmasına ait; `npm run dogrula:codex` içindeki tek kırmızı da aynı çalışmanın ses listesi (`seviye-sesler.json` güncel değil — klip üretimi sürüyor). Öteki kapılar GEÇTİ.
- Canlı doğrulama: 74 sayfa + 884 ses adresi HTTP 200 (`text/html` / `audio/mp3`), bilinmeyen kod 404, `sitemap-0.xml` içinde `/e/` adresi 0; iki dosyanın canlı SHA-256 özeti yerelle aynı (`64c76f36d86811ed…`, `9818f1ad7a4e1682…`); gerçek tarayıcıda (390 px) `/e/fatiha/` 2. âyet ve `/e/lettres-7/` yâ' **gerçekten çaldı** (`currentTime` ilerledi, `aria-pressed="true"`), konsol hatası 0.
- Açık sınırlar: Âmentü, şehâdet, tevhid, yemek/uyku duaları, tesbihat ve kısa namaz formülleri için resmî Diyanet kaydı bulunamadı → kare kodsuz (kitapta «imamla tekrarlayın»); basılmış kitaptaki kod kalıcı adrestir — yayımlanmış kod silinmez, başka içeriğe bağlanmaz.

## 21 Eylül 2026 (2) — seviye testi: tek e-posta, telefon biçimi, titreme ve iniş düzeltmeleri

- Zaman: 21 Eylül 2026 00:25 – 01:10 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık talimatı («Bunları düzelt, yayınla»).
- İlk gerçek başvuru aynı gece geldi (`ST-2026-0001`, 00:02; iki e-posta da gönderildi) — kullanıcı geri bildirimi bu başvurunun ardından verildi. Kayıtta kişisel veri tutulmaz.
- Kapsam (yalnız ön yüz; Apps Script v38 değişmedi): (1) e-posta TEK kez yazılır, yaygın alan adı yazım hatasında «Şunu mu demek istediniz…?» önerisi (TR/FR/EN); (2) telefon alanları yalnız rakam kabul eder ve yazarken «+32 470 12 34 56» biçimine girer — ortak çekirdekte, seviye + kayıt + ihtida formlarında; gövdeye giden değer yine boşluksuz E.164; (3) **titreme**: alt şerit yapışınca içindeki taslak notu gizleniyor, şeridin boyu 110↔71 px oynuyor ve formun sonundaki ~40 px'lik bantta 1,2 sn'de 34 yapış/çöz döngüsü kuruluyordu → not şeridin dışına alındı, aynı ölçüm 1; (4) kısa ekranda (ör. 1366×640) adıma inişte adım paneli + alt şerit içeriğe 70 px bırakıyordu → yer < 240 px ise doğrudan bölüme inilir (ortak adım motoru; ihtida formu da yararlanır); (5) koyu temada atlanan basamağın kesik çizgisi okunur oldu.
- Değişen dosyalar: `src/scripts/telefon-bicim.ts` (yeni), `src/scripts/form-cekirdek.ts`, `src/scripts/form-adimlari.ts`, `src/scripts/seviye-form.ts`, `src/components/formlar/SeviyeTestiFormu.astro`, `src/i18n/seviye-testi.ts`, `src/styles/seviye-testi.css`, `tests/telefon-bicim.test.mjs` (yeni, 6 test), `tests/web/seviye-testi.spec.mjs` (+3 senaryo: iniş, titreme, e-posta/telefon), `package.json`, `docs/SEVIYE-TESTI.md`.
- İçerik commit'i `3f5ed97`; Release kullanılmadı. [Pages 35543472762](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35543472762) başarılı.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` çıkış 0 — **test:web 504/504**, öteki bütün kapılar GEÇTİ; `npm run test:seviye` 50/50 + döküm güncel; kayıt ve ihtida form testleri 116/116 (telefon biçimlendirici bağlıyken).
- Canlı doğrulama (gerçek tarayıcı, 1366×640, **gönderimsiz — POST kesildi**), üç dilde: tekrar alanı yok (0), öneri görünür ve `ornek@gmial.com` → `ornek@gmail.com` düzeliyor, `04x70-12 34ab56` → `+32 470 12 34 56`, kararsız bantta `data-yapisik` değişimi **0**, sayfa hatası yok.
- Açık sınırlar: ek animasyon eklenmedi (öncelik hatalardaydı); soruyu sesli dinleme ayrı yayın olarak hazırlanıyor (bkz. sonraki kayıt).

## 21 Eylül 2026 — seviye testi: etkileşim ve hareket katmanı

- Zaman: 20 Eylül 23:50 – 21 Eylül 2026 00:20 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık talimatı («ön izleme göstermene gerek yok… ne gerekiyorsa yap, yayınla»).
- Kapsam (yalnız ön yüz; Apps Script v38 değişmedi, veri sözleşmesi aynı): seçim anı (mürekkep dolumu, çizilen onay işareti, «cevaplandı» rozeti; «Bilmiyorum» aynı onayı alır ve artık soluk gösterilmez), otomatik ilerleme + `role="switch"` anahtarı (odak taşımaz, klavye seçiminde devreye girmez), masaüstünde 1–4 / 0 kısayolları, yapışkan alt şerit (adım sayacı, ilerleme çubuğu, kalan süre, tek `aria-live` bölgesinde eşik cümleleri), Kur'an merdiveni (kilim baklavası düğümleri, basamak tamamlanınca kıvılcım, atlanan basamak kesik çizgili), Arapça ibarelerde mürekkep belirişi, ses çalarken ekolayzır, adım geçiş hareketi, «Teste başla» / «Kaldığım yerden devam et», sonuç ekranında sırayla dolan çubuklar + 1,8 sn'lik kilim konfetisi. İstemcide doğruluk bilgisi yoktur; hiçbir hareket doğru/yanlış ima etmez. `prefers-reduced-motion` altında tümü kapalı; betik hata verse de form aynen çalışır.
- Değişen dosyalar: `src/scripts/seviye-etkilesim.ts` (yeni), `src/scripts/seviye-form.ts`, `src/scripts/form-adimlari.ts` (geriye uyumlu tek ek: `form:adim` olayı), `src/styles/seviye-testi.css`, `src/i18n/seviye-testi.ts` (TR/FR/EN 14 metin), `src/components/formlar/SeviyeTestiFormu.astro`, `tests/web/seviye-testi.spec.mjs` (+9 senaryo).
- İçerik commit'i `cf34fd0`; Release kullanılmadı. [Pages 35540452564](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35540452564) başarılı.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` çıkış 0 — design:check, check (0 hata / 0 uyarı), dogrula, **test:web 500/500**, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ; `npm run test:seviye` 44/44 + döküm güncel; `npm run denetim` yüksek/orta bulgu yok.
- Canlı doğrulama (gerçek tarayıcı, 390 px dokunmatik bağlam, **gönderimsiz — POST kesildi**): üç dilde «Teste başla» düğmesi, merdiven, anahtar ve alt şerit yerinde; şık seçilince `data-cevaplandi` işaretlendi; şerit metinleri yerelleşmiş («Bu adım: 1 / 33 · yaklaşık 28 dk kaldı» / «Cette étape : 1 / 33 · environ 28 min restantes» / «This step: 1 / 33 · about 28 min left»); sayfa hatası yok; sayfa kaynağında `"dogru"` izi 0.
- Açık sınırlar: kaydırırken görünür kalan küçük merdiven sürümü yapılmadı (isteğe bağlıydı); 49 düşük «başlık seviyesi atlanıyor» bulgusu eski sayfalarda duruyor (bu yayının kapsamı dışında).

## 20 Eylül 2026 — yetişkinler için Kur'an ve dinî bilgi seviye tespit testi (Apps Script v38)

- Zaman: 20 Eylül 2026, 21:55–22:10 (Europe/Brussels, CEST). Durum: **yayımlandı ve canlı doğrulandı.** Kullanıcının açık yayın onayı (aynı oturumda, soru-yanıtla teyit edildi).
- Kapsam: üç dilli test sayfası (`/tr/seviye-tespit-testi/`, `/fr/test-de-niveau/`, `/en/level-assessment/`), «Eğitim» menüsü + ihtida sayfasında «Nereden başlamalıyım?» kartı + Kur'an kursu sayfasında yetişkin satırı; soru bankası sürüm 1 (112 madde + 14 ezber + 13 öz beyan, üç bağımsız doğrulamadan geçti); sunucu yetkili puanlama; defter + iki e-posta (rapor yalnız `imam@ulucamii.be`, yedek kanal kapalı); panelde «Seviye testleri» sekmesi; gizlilik politikası ×3 yeni bölüm; TR + FR duyuru. Ayrıntı: [Seviye testi](SEVIYE-TESTI.md).
- Aynı yayında mevcut sistemde düzeltilenler: `panelYetkiTamam` gömülü yer tutucuyu anahtar sayıyordu; `ihtidaV2AnahtarBul` önbellek kesintisinde başvuruyu düşürüyordu; 20 KiB gövde sınırı bayt yerine UTF-16 birimi sayıyordu; form çekirdeği iç içe koşullu blokları yeniden açamıyordu; Elifbâ şedde metinleri NFC değildi (veri + aktarım betiği + test kapısı); ihtida başarı panelinde koyu tema kontrastı 2:1 → 6,4:1; panelde yetki hatasında asılı kalan not; ihtida formunda hiç görünmeyen ölü ok işaretlemesi.
- Aşama 1 — Apps Script: `D:/tmp/gas/dagit_v38.py` (`--kuru` → canlı editör kaynağı yerel v37 derlemesiyle bayt bayt aynı, dernek hesabı doğrulandı; sonra `GAS_HEADLESS=1`). Paket `.codex/cikti/gas/ulucamii-v38.gs` 8 542 627 bayt (LF), SHA-256 `eb7befcac583b577e7ad20d23c3eac867632e27da7ef8fca8be137efba4453c6`; yeniden okunan kaynak paketle birebir aynı; **mevcut dağıtıma yeni sürüm** (adres değişmedi). Yerel yedek `D:/tmp/gas/v38-oncesi-20260920-215735-389322.gs`. Sağlık: `surum:38 · seviyeTesti:true · seviyeBankaSurumu:1`; `kayitKimlik`, `kayitImza`, `kayitBelgeleriZorunlu`, `kayitDuzelt`, `defterCeviri`, `ihtidaPaketHazir`, `ihtidaDefteriHazir`, `ihtidaCamiSecimi` aynen `true`.
- Aşama 2 — site: içerik commit'i `b4140913882b68877b30522ca0419bb14e37b80c` (`main`'e ileri sarma). [Pages 35534070441](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35534070441) başarılı. Release kullanılmadı.
- Aşama 3 — canlı doğrulama: üç adres + `/admin/seviye-panel.js` HTTP 200; `hreflang` tr/fr/en/x-default; sayfa kaynağında `"dogru"` izi 0; `data-asgari-servis-surumu="38"`; ana sayfa menüsü ve ihtida kartı canlı. İki gerçek deneme (soyad TESTOGLU, deneme adresi dernek kutusu): `ST-2026-0001` (FR) ve `ST-2026-0002` (TR) — sonuç ekranı K3 + «B» programı (beklenen), defter damgası ikisinde de `katilimci-eposta-gonderildi | imam-eposta-gonderildi`; info@ gelen kutusunda **yalnız** iki katılımcı iletisi (doğru dilde, `Reply-To: imam@ulucamii.be`), hoca raporu info@'ya düşmedi; `liste` yanıtında `seviyeler` 29 sütun, gizli sütun (Cevaplar, Gönderim anahtarı, Not) yok; `seviye-detay` raporu döndürdü; gömülü yer tutucu anahtar canlıda `yetki` ile reddedildi.
- Temizlik: iki deneme kaydı `seviye-sil` ile **tek tek** silindi (`silinen:1` ×2); seviye defteri 0 satır; kayıt defteri 25, ihtida defteri 5 satır — dokunulmadı. `test-temizle` bilerek kullanılmadı (öteki defterlere de dokunur). Açık: `imam@` kutusundaki iki deneme raporu ile info@ kutusundaki iki deneme iletisi elle silinecek; ilk gerçek katılımcı yeniden `ST-2026-0001` numarasını alır.
- Aşama 4 — duyuru: `src/content/duyurular/{tr,fr}/seviye-tespit-testi-2026.md` taslaktan çıkarıldı (öne çıkan, 25 Ekim 2026'ya kadar); commit `a6e6f1c0a77cb33b2a0d446045082256b99a0b98`; [Pages 35534574905](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35534574905) başarılı; `/tr/duyurular/seviye-tespit-testi-2026/` ve `/fr/annonces/seviye-tespit-testi-2026/` HTTP 200, ana sayfa vitrininde görünüyor.
- Testler (yayın öncesi, yerel): `npm run dogrula:codex` — design:check, check (0 hata), dogrula, test:kurallar, test:veli-eposta, test:oto-kaydet, test:ogrenme GEÇTİ; test:web 476 geçti + 6 beklenen görsel taban çizgisi farkı (ihtida kartı) güncellendi → `design-visual` 24/24; duyurudan sonra ana sayfa taban çizgileri de güncellendi (24/24). `npm run test:seviye` 44/44 + döküm güncel; `seviye-testi` + `seviye-panel` + `ihtida` tarayıcı testleri 62/62; `npm run denetim` yüksek/orta bulgu yok (49 düşük, hepsi eski sayfalarda).
- Açık sınırlar: katılımcıdan ses kaydı alınmaz — akıcılık/mahreç ilk yüz yüze derste teyit edilir; duyurunun EN sürümü, Facebook/afiş kapsam dışı; cevap anahtarı herkese açık depoda durur (sayfa HTML'ine basılmaz).

## 20 Eylül 2026 — örnek defterler ve ders kitapları (kalıcı materyaller)

- Zaman: 20 Eylül 2026, 11:18–11:25 (Europe/Brussels, CEST). Durum: yayımlandı ve canlı doğrulandı. Kullanıcının açık yayın talimatı.
- Kapsam: «Ders Materyalleri → Kalıcı materyaller» bölümüne beş kayıt. İki PDF depoda (`public/media/materyaller/`): `Ornek-Mesk-Defteri-2026-2027.pdf` (64 s., 180 768 bayt) ve `Ornek-Ders-ve-Iletisim-Defteri-2026-2027.pdf` (324 s., boş şablon, 1 476 520 bayt). Üç ders kitabı **yalnız resmî ücretsiz kaynağa bağlantıyla**: Camiye Gidiyorum 1 ve 2 → DİTİB Akademi (`/cg1/`, `/cg2/`), Temel Dinî Bilgiler → `dijital.diyanet.gov.tr` e-kitap 4218 (bağlantılar yayından önce HTTP 200).
- Değişen dosyalar: `src/content/materyaller/{ornek-mesk-defteri-2026-2027,ornek-ders-ve-iletisim-defteri-2026-2027,camiye-gidiyorum-1,camiye-gidiyorum-2,temel-dini-bilgiler}.md`; yeni materyal türleri `kitap` ve `defter` — `src/content.config.ts`, `src/sayfalar/DersMateryalleri.astro` (TR/FR/EN etiket), `public/admin/icerik/config.yml` birlikte.
- İçerik commit'i `e822d0110c3cc9b2d1e286e92c1ee7cd2bce4871`; Release kullanılmadı (dosyalar ≤ 15 MB). [Pages 35501947723](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35501947723): build ve deploy başarılı.
- Testler: `npm run check` 0 hata / 0 uyarı (259 dosya); `npm run dogrula` çıkış 0, başarısız test yok; `npm run denetim:cms` çıkış 0. Günlükler: `D:/tmp/materyal-{check,dogrula,cms}.log`.
- Canlı doğrulama: `/tr/ders-materyalleri/`, `/fr/supports-de-cours/`, `/en/lesson-materials/` HTTP 200, beş kayıt üç dilde görünüyor; iki PDF HTTP 200 `application/pdf`, indirilen dosyaların SHA-256'sı kaynakla eşleşti (`69588ecd99b7e98e…`, `b754fad8dac498b1…`). Sayfada din görevlisi hattı: 0.
- Kişisel veri taraması (yayından önce): iki PDF'te 98 öğrenci/veli/hoca ad sözcüğü, `UC-…` kayıt numarası, e-posta ve telefon arandı — yalnız cami hattı, `info@` ve `imam@ulucamii.be` var; ad ve kayıt numarası yok.
- Açık sınır — **kitap PDF'leri yüklenmedi**: kullanıcı Camiye Gidiyorum 1-2 PDF'lerinin de yayımlanmasını istedi. Yerel dosyalar incelendi: Türkçe kaynaklar DİTİB Akademi çevrim içi okuyucusundan alınmış sayfa görüntüleri (jsPDF, metin katmanı yok); kitaplar ISBN'li ve satışta, içlerinde DİTİB'e lisanslı Shutterstock fotoğrafları var; Fransızca sürümler kursun kendi çevirisi olduğu hâlde kapakta «DITIB | DITIB Verlag — VERSION FRANÇAISE», 2. kitabın künyesinde «Fondation Diyanet de Belgique» ibaresi taşıyor. Bu depo herkese açık ve sitenin kendisi olduğundan yükleme kullanıcının teyidine bırakıldı; 29 Ağustos 2026 kararı («kitap PDF'i dağıtılmaz — telif») yürürlükte kaldı. Kaynak proje kaydı: `D:/ulu-camii-kuran-kursu/belgeler/YAYIN-RAPORU-2026-09-20-ORNEK-DEFTERLER-VE-KITAPLAR.md`.
- OneDrive: kapsam dışı (örnek defterlerin tek kopyası D sürücüsündedir; 19 Eylül kararı).

## 19 Eylül 2026 — Belçika’dan dergi aboneliği araştırması

- Kullanıcı talebiyle TR/FR/EN yayın rehberi güncellendi; içerik commit'i `2b54e7c`.
- [Pages 35459124981](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35459124981): build ve deploy başarılı; üç canlı rehber HTTP 200, yeni resmî birim/teslimat şartları/e-posta bağlantıları doğrulandı.
- Yurt dışı birimi, üç adımlı başvuru ve örnek bilgi talebi eklendi. Portal üyeliğinin Belçika teslimat onayı olmadığı açıklandı. Güncel avro bedeli/posta ücreti teyit edilemedi; eski tarifeler kullanılmadı.
- `npm run dogrula:codex`: sekiz kapı geçti; 448 tarayıcı testi başarılı. Ek 12 rehber kontrolü (üç dil, iki genişlik, iki tema): taşma ve axe ihlali yok; masaüstü TR ve mobil FR ekran görüntüleri incelendi.
- Kanıtlar: `D:/tmp/ulucamii-belcika-abonelik-dogrulama-20260919.log`, `D:/tmp/abone-gorsel-20260919.json`, `D:/tmp/abone-canli-20260919.json`.
- Kaynaklar ve doğrulama sınırı: [Belçika araştırması](BELCIKA-DERGI-ABONELIGI.md). Abonelik açılmadı, ödeme yapılmadı, e-posta gönderilmedi.

## 19 Eylül 2026 — Diyanet içerikleri ve site hata düzeltmeleri

- Durum: yayımlandı ve canlı doğrulandı. Kullanıcının açık içerik/yayın talimatı.
- İçerik/teknik commit: `82871f2`; görsel referans ve son denetim: `d0c0d8f`.
- [Pages 35456237657](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35456237657): build ve deploy başarılı.
- [Hac kayıtları](https://ulucamii.be/tr/duyurular/2027-hac-kayitlari-devam-ediyor/): ön kayıt ve kesin kayıt son günü 30 Ekim. Ortak tarih kaynağı ve hizmet sayfaları düzeltildi; eski duyurular güncel takvime yönlendiriyor.
- [Taif ziyaretli Aralık umresi](https://ulucamii.be/tr/duyurular/taif-ziyaretli-aralik-umresi/): 20 Aralık–1 Ocak, son başvuru 20 Kasım; mevcut duyuru yenilendi.
- [Salih GÖR / Müşavirlik](https://ulucamii.be/tr/musavirlik-salih-gor/): TR/FR/EN kalıcı tanıtım; göreve başlama 20 Nisan 2026.
- [Yeni eğitim yılı mesajı](https://ulucamii.be/tr/duyurular/yeni-egitim-yili-birlikte-ogreniyoruz/): Diyanet'in 14 Eylül mesajından hareketle yerel kursa uyarlama.
- [Dergi aboneliği ve ücretsiz erişim](https://ulucamii.be/tr/diyanet-yayinlari-rehberi/): TR/FR/EN rehber, resmî dış abonelik temsilcilikleri/e-postaları ve anonim PDF erişimi. Belçika güncel ücret/posta bedeli açıkça doğrulanamadığından fiyat vaadi yok.
- [İslam İlmihali tanıtımı](https://ulucamii.be/tr/duyurular/diyanet-islam-ilmihali-tanitimi/): resmî tanıtım ve ürün künyesi; ücretsiz PDF iddiası yok.
- Teknik düzeltmeler: CMS alan eşleştirmesi, çeviride ad bütünlüğü/yanıt kontrolü, personel kartı kontrastı ve kenarlığı, geniş tabloda klavye erişimi.
- Doğrulama: toplu kapının web dışındaki adımları geçti; 442 web testi ve içerik nedeniyle yenilenen 6 görsel referans. Son rebase/build ardından normal modda 110/110 web testi; ek 54 içerik/görünüm kontrolü. Build: 900 sayfa.
- Canlı: 25/25 sayfa/dosya kontrolü; `govde.js` ve CMS yapılandırması SHA-256 eşit, çeviri paketindeki yeni kontrol mevcut. Kanıt: `D:/tmp/site-yayin-dogrulama-20260919.json`.
- Ayrıntılar ve sınırlar: [19 Eylül denetimi](HATA-AVI-2026-09-19.md). Öğrenci dosyaları ve özel işlem betikleri bu yayına alınmadı.

## 19 Eylül 2026 — 19–20 Eylül öğretici materyalleri

- Durum: tamamlandı. Önceki oturumun doğrulanmış sonucu bu kalıcı indekse aktarıldı.
- İçerik commit'i: `5b8bd5fd3979eaa6f6251672b8acaf373c13e9bb`.
- Değişen site dosyası: `src/data/ders-materyalleri.json`.
- Release: `ders-2026-09-19`, `ders-2026-09-20`; her birinde 13 dosya
  (plan PDF, üç öğrenci PPTX/PDF, üç öğretici PPTX/PDF).
- [Pages 35433895620](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35433895620): başarılı.
- Canlı [19 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-19),
  [20 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-20); TR/FR/EN bağlantı kontrolü geçti.
- `npm run dogrula:codex`: sekiz kapı ve 424 tarayıcı testi geçti.
  Yayın dosyalarının HTTP/SHA-256 eşitliği 26/26; mobil/masaüstü ve açık/koyu tema kontrolü geçti.
- Kaynak rapor: `belgeler/KALITE-DENETIMI-2026-09-19.md`.
  Kanıt: `scratchpad/denetim-2026-09-19/`.
- Sınır: fiziksel baskı/projeksiyon ve bütün ses/video içeriğinin yeniden dinleme/izleme provası yapılmadı.

## 19 Eylül 2026 — 26–27 Eylül öğretici materyalleri

- Durum: tamamlandı. Önceki oturumun doğrulanmış sonucu bu kalıcı indekse aktarıldı.
- İçerik commit'i: `fcc71bf3dfa4328c9e0539390f6384d30a1d62d0`.
- Değişen site dosyası: `src/data/ders-materyalleri.json`.
- Release: `ders-2026-09-26`, `ders-2026-09-27`; her birinde 13 güncel ve benzersiz dosya.
- [Pages 35440883908](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35440883908): başarılı.
- Canlı [26 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-26),
  [27 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-27).
- 134 öğretici slaydı öğrenciyle 1:1; notlar öğrenci PPTX'e işlendi. Altı öğretici PPTX/PDF.
  PowerPoint ölçümünde öğrenci/öğretici taşması 0; kaynak, süre, dil/punto denetimleri geçti.
- `npm run dogrula:codex`: sekiz kapı ve 424 tarayıcı testi geçti.
  Yayın dosyalarının HTTP/SHA-256 eşitliği 26/26; OneDrive yerel eşitliği 22/22.
  TR/FR/EN, 320/390/1440 px, açık/koyu tema kontrolleri geçti.
- Kaynak rapor: `belgeler/KALITE-DENETIMI-2026-09-26-27.md`.
  Kanıt: `scratchpad/hafta-2026-09-26/`.
- Sınır: fiziksel sınıf provası ve videoların baştan sona tekrar izlenmesi yapılmadı;
  OneDrive kanıtı yerel kopyadır, bulut eşitleme makbuzu değildir.

## 19 Eylül 2026 — 3–4 Ekim öğretici materyalleri ve yayın kayıt düzeni

Durum: tamamlandı. Son kayıt: 2026-09-19T17:01:40+02:00 (Europe/Brussels).

- İçerik commit'i: `8edf0232e6f3659fb61fbabea6702662249c9b57`.
- [Pages 35450386608](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35450386608): başarılı; canlı yayın ayrıca doğrulandı.
- Kalite kapılarının tümü geçti: ilk `dogrula:codex` koşusunda yedi kapı başarılı;
  iki klavye hatası `src/styles/global.css` içinde azaltılmış hareket kaydırmasıyla
  düzeltildi. Yeniden derleme, iki hedef test ve tam `test:web` tekrarı başarılı: 424/424.
  İlk başarısız koşu `site-kalite.log`, son başarılı koşu `site-web-final.log` içinde korunur.
- Dört Release'te 13'er benzersiz dosya; 52/52 indirme HTTP 200 ve SHA-256 eşleşmesi.
- Canlı TR/FR/EN: gün başına 13 bağlantı, altısı öğretici; 320/390/1440 px taşma yok.
  Açık/koyu tema ciddi/kritik erişilebilirlik ihlali 0; klavye erişimi başarılı.
- OneDrive yerel 44/44 dosya eşleşmesi; üretim/yerleşim/kaynak kontrolleri temiz.
- Canlı: [26 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-26),
  [27 Eylül](https://ulucamii.be/tr/ders-materyalleri/#g-2026-09-27),
  [3 Ekim](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-03),
  [4 Ekim](https://ulucamii.be/tr/ders-materyalleri/#g-2026-10-04).

İşlem günü/saat dilimi: 19 Eylül 2026, Europe/Brussels.

- 3–4 Ekim: altı öğretici PPTX/PDF, toplam 138 slayt ve öğrenci sunucu notları tamamlandı.
- 26–27 Eylül ve 3–4 Ekim öğrenci PDF'lerinde video kapakları korundu.
  4 Ekim planı metin kaybı olmadan 16 sayfadan 14 sayfaya düzenlendi.
- Dört Release: `ders-2026-09-26`, `ders-2026-09-27`, `ders-2026-10-03`,
  `ders-2026-10-04`. Gün başına 13 dosya; 52/52 HTTP 200 ve SHA-256 eşleşmesi.
- OneDrive yerel kopyaları: 44/44 SHA-256 eşleşmesi.
- Altı öğrenci ve altı öğretici sunumunun PowerPoint yerleşimi temiz;
  dil/punto/not eşleşmesi ve sert materyal kapıları geçti.
- Yerel TR/FR/EN sayfalarında dört günün her birinde 13 dosya, altısı öğretici bağlantısı.
  320/390/1440 px taşma yok; açık/koyu tema ciddi/kritik erişilebilirlik ihlali yok;
  klavye erişimi çalışıyor.
- Site değişiklikleri: `src/data/ders-materyalleri.json`, `AGENTS.md`,
  `docs/PROJE-HAFIZASI.md`, `docs/YAYIN-KAYITLARI.md`, `src/styles/global.css`.
  Son dosyada azaltılmış hareket tercihi kök kaydırıcıya da uygulanır;
  kayıt sonrası klavyeyle kardeş kaydı bağlantısına geçerken ekran odağı izler.
- Kurs raporu: `belgeler/KALITE-DENETIMI-2026-10-03-04.md`;
  kanıt: `scratchpad/hafta-2026-10-03/`.
- Sınırlar: fiziksel sınıf provası, bütün seslerin yeniden dinlenmesi ve videoların
  baştan sona tekrar izlenmesi yapılmadı; OneDrive kanıtı yerel kopyadır.

Kayıt tamamlandı; salt devir belgesi commit’i bu içerik yayınına referans verir.

Kalıcı kural `AGENTS.md`, başvuru `docs/PROJE-HAFIZASI.md` ve bu dosyadır.
Kurs tarafında `AGENTS.md`, `CLAUDE.md`, `DEVAM.md`, `belgeler/YAYIN-KAYITLARI.md`
aynı kayıt düzenine bağlanır. İzole çalışma kopyası:
`D:/tmp/ulucamii-ogretici-yayin-20260919`; ana repodaki başka oturum değişiklikleri korunur.

## 19 Eylül 2026 — slayda gömülü oyunlar (20 Eylül–4 Ekim)

- Kapsam: 20/26/27 Eylül, 3/4 Ekim; 15 öğrenci ve 15 öğretici PPTX/PDF, beş plan PDF. Gün başına 13, toplam 65 Release dosyası.
- Sınıf oyunlarında ayrı kart/çıktı ve fiziksel hazırlık kaldırıldı; 18 oyun yerel PowerPoint cevap tetiğiyle sunuma gömüldü. Öğretici metinleri, sunucu notları, planlar ve 23 kısa TR/FR anlatım eşleştirildi; yedi resmî Diyanet FR kaynak bağlantısı eklendi.
- Kaynak proje: `D:/ulu-camii-kuran-kursu`; rapor `belgeler/KALITE-DENETIMI-GOMULU-OYUN-2026-09-19.md`; kanıt `scratchpad/oyun-2026-09-20/`.
- Site değişikliği: `src/data/ders-materyalleri.json`; adlar sabit, sürüm çoğaltılmadı.
- Portalın 19 Eylül haftalık tekrar notunda yalnız `odevler/2026-09-19.ezber.tr` alanındaki kart seçeneği kitap/defterle değiştirildi; eşzamanlı değişiklik önkoşulu ve canlı geri okuma doğrulandı. Diğer kayıtlar değiştirilmedi.
- İçerik commit'i `61bde97dcf563b04c3968c43f9eb6aceff147ae0`; Pages [35455560570](https://github.com/ulucamii2026/ulucamii2026.github.io/actions/runs/35455560570) başarılı.
- Yayın sonrası kanıt: 65/65 canlı Release indirmesi HTTP 200 ve SHA-256 eşleşmesi; OneDrive yerel 55/55 SHA-256 eşleşmesi. TR/FR/EN canlı ve yerel kontrollerde her gün 13 bağlantı, altısı öğretici; 320/390/1440 px taşma 0, açık/koyu temada ciddi/kritik ihlal 0 ve klavye odağı geçer.
- Özel veli iletileri ve öğrenciye özel meşk defterleri kamuya açık yayına dahil edilmedi; kişisel bilgiler bu depoya alınmadı.
