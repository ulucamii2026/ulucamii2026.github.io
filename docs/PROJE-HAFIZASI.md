# Ulu Camii — kısa proje başvurusu

Güncelleme: 9 Eylül 2026. Amaç: aynı keşfi tekrarlamadan ilgili kaynağa ulaşmak.
Çalışma ve hesap kuralları [AGENTS.md](../AGENTS.md) içindedir; burada yinelenmez.
Bu dosya canlı durum garantisi veya yeni gönderim/yayın izni değildir.

## İşe göre başlangıç

| İş | Önce bakılacak kaynak | İlgili kod / doğrulama |
|---|---|---|
| Web yayını / ders materyalleri / öğretici sunumları | [Yayın kayıtları](YAYIN-KAYITLARI.md) | İçerik commit, Release, deploy, canlı dosya kontrolü; kaynak proje kalite raporları |
| Yeni Müslümanlar eğitim merkezi / sesli dersler / kitap karekodları / Elifbâ sesleri | [Dinleme sayfaları ve eğitim merkezi](DINLEME-SAYFALARI.md) | `/tr/muhtedi-egitimi/`, `/e/`, `src/i18n/egitim-rehberi.ts`, `scripts/elifba-ses-denetle.py`; `npm run test:dinleme`, `tests/web/ecouter.spec.mjs` |
| Cami ve kurs logoları | [Geçerli temiz logolar](LOGO-KIMLIGI.md) | `public/media/logo`; kurumsal kimlik ana paketi |
| Veli e-postasının dili | [Dil kararı](VELI-EPOSTA-DILI.md) | `src/scripts/veli-portali.ts`, `src/scripts/hoca-ekrani.ts`; `tests/veli-eposta-dili.test.mjs` |
| Yeni kaydı e-posta listesine alma | [Otomatik aktarım](VELI-MAIL-LISTESI-OTOMASYONU.md) | `scripts/apps-script/veli-mail-listesi.gs`; `tests/veli-mail-listesi.test.mjs` |
| Cuma e-postası / ödev / malzeme | [Haftalık otomasyon](VELI-CUMA-EPOSTASI.md) | `scripts/apps-script/veli-cuma.gs`; `tests/veli-cuma.test.mjs` |
| İhtida formunda adımlar / cami / şahit | [Adımlar](IHTIDA-ADIMLI-FORM-v27.md), [cami seçimi](IHTIDA-CAMI-SECIMI-v26.md) | `src/components/formlar/IhtidaFormu.astro`, `src/scripts/ihtida-adimlari.ts`, `src/scripts/ihtida-cami.ts`; `tests/web/ihtida*.spec.mjs` |
| EK-9, EK-10, dilekçe ve e-posta paketi | [Paket akışı](IHTIDA-OTOMASYON-v25.md) | `public/admin/ihtida-paket.js`, `ek9.js`, `ek10.js`, `dilekce.js`; `scripts/apps-script/ihtida-paket-isleri.gs`; `npm run test:ihtida` |
| İhtida defteri | [Defter](IHTIDA-DEFTERI-v28.md) | `public/admin/ihtida-defteri.js`, `scripts/apps-script/ihtida-defteri-isleri.gs`; `tests/ihtida-defteri-*.test.mjs` |
| Yetişkin seviye tespit testi (Kur'an + dinî bilgi) | [Seviye testi](SEVIYE-TESTI.md) | `src/lib/seviye-testi/` (banka + puanlama, tek kaynak), `src/components/formlar/SeviyeTesti*.astro`, `src/scripts/seviye-form.ts`, `scripts/apps-script/seviye-testi-isleri.gs`, `public/admin/seviye-panel.js`; `npm run test:seviye`, `tests/web/seviye-*.spec.mjs` |
| Site dilleri: tr, fr, en + Flemenkçe (nl), Almanca (de) — 21 Eylül 2026 | [Çeviri ve mühendislik kılavuzu](DIL-NL-DE.md) | `src/i18n/ui.ts` (tek kaynak: `Dil`, `diller`, `yollar`), `src/i18n/utils.ts` (`dilListesi`, `yerelKodu`, `hreflangKodu`); yasak kalıp `dil === 'tr' ? … : dil === 'en' ? … : …` → `Record<Dil, …>`; saklanan içerik TR+FR (`icerikDili`); paylaşım kartı `scripts/og-kart-uret.mjs`; Apps Script `SITE_DILLERI` (v39) |
| Ortam, hesap sarmalayıcıları, genel testler | [Çalışma rehberi](CODEX-CALISMA.md) | `package.json`, `scripts/dogrula-codex.mjs`; `npm run dogrula:codex` |
| Ana sayfa vitrini | [Ana sayfa vitrini](ANA-SAYFA-VITRINI.md) | `src/lib/vitrin-secimi.ts`, `src/components/GundemVitrini.astro`; `tests/web/vitrin.spec.mjs` |
| Ana sayfa akışı | [Ana sayfa akışı](ANA-SAYFA-AKISI.md) | `src/components/AnaSayfaAkisi.astro`, `src/styles/ana-sayfa-akisi.css`; `tests/web/ana-sayfa-akisi.spec.mjs` |
| Mektep çalışma odası / öğrenci modu | [Öğrenci modu](OGRENCI-MODU-PORTAL.md) | `src/scripts/veli-portali.ts`, `src/scripts/hoca-ekrani.ts`, `src/lib/elifba-verisi.ts`, `src/lib/ezber-verisi.ts`, `src/lib/quiz-verisi.ts`; `npm run dogrula:codex` |
| Birlikte öğrenme / aile rehberi / aralıklı tekrar | [Atölye](VELI-OGRENCI-ATOLYESI.md), [pedagojik araştırma](VELI-OGRENCI-PEDAGOJIK-ARASTIRMA.md) | `src/scripts/ogrenme-atolyesi.ts`, `src/lib/ogrenme-ilerleme.ts`; `npm run test:ogrenme` |
| Haftalık bülten / kontrollü öğrenci kayıt temizliği | [Bülten ve idare](HAFTALIK-BULTEN-VE-IDARE.md) | `src/scripts/hoca-bulten.ts`, `src/lib/portal-idare.ts`; `tests/web/bulten-idare.spec.mjs`, `npm run test:kurallar` |
| Hoca ezber–ödev / haftalık ortak çalışma | [Ezber ve ödev](HOCA-EZBER-ODEV.md) | `src/scripts/hoca-odev.ts`, `src/lib/haftalik-odev.ts`; `tests/web/hoca-odev.spec.mjs` |
| Basılı Bulletin d’école / dijital ders defteri | [Ders defteri](DERS-DEFTERI-ENTEGRASYONU.md) | `src/scripts/ders-defteri.ts`, `src/lib/ders-defteri.ts`, `src/data/ders-defteri-2026-2027.json`; `tests/web/ders-defteri.spec.mjs` |
| Anti-Gravity iş akışı | [İş akışı](ANTIGRAVITY-IS-AKISI.md), [12 Eylül oturum incelemesi](AGY-OTURUM-INCELEMESI-2026-09-12.md) | `scripts/oto-kaydet.ps1`; `npm run test:oto-kaydet` |
| Web sitesi genel çalışma dökümü | [11 Eylül çalışma dökümü](WEB-SITESI-CALISMA-DOKUMANI-2026-09-11.md) | Konu notlarına yönlendiren genel özet |
| 18 Eylül devir notu ve hata avı | [18 Eylül devir notu](DEVIR-NOTU-2026-09-18.md) | Personel, favicon, WCAG A11y, materyal koleksiyonu ve tam denetim |
| 19 Eylül hata avı / son değişiklikler | [19 Eylül denetimi](HATA-AVI-2026-09-19.md) | CMS iç içe alan denetimi, çeviri yanıtı/ad bütünlüğü, personel kontrastı ve tabloda klavye erişimi |
| BDV hac/umre takvimi, müşavirlik ve Diyanet yayın rehberi | [19 Eylül içerik yayını](HATA-AVI-2026-09-19.md#yayın-hazırlığı--19-eylül-2026) | `etkinlik-tarihleri.ts`, `sayfalar/*/musavirlik.md`, `sayfalar/*/yayinrehberi.md`; resmî kaynak ve yurt dışı abonelik sınırı |
| Belçika’dan dergi aboneliği | [Belçika araştırması](BELCIKA-DERGI-ABONELIGI.md) | Yurt dışı birimi, portal teslimat sınırı, ülkeye özel ücret teyidi; eski avro tarifelerini kullanma |

## Tekrar keşfedilmemesi gereken kararlar

- Din görevlisinin şahsi/cep telefonu numarası hiçbir mecrada (web sitesi, duyurular, afişler,
  iletişim alanları) açık metin olarak yayımlanmaz. WhatsApp logosu/butonuyla doğrudan
  sohbete (`wa.me`) yönlendirme yapılabilir ancak numara ekranda veya metinde gösterilmez. Yayımlanan
  yegâne telefon numarası cami dernek hattıdır (+32 472 98 50 73).
- Veli iletişim dili, kayıt tercihidir; siteyi görüntüleme diliyle değiştirilmez.
  Ayrıntı, istisnalar ve doğrulama yukarıdaki dil notundadır.
- Öğrenci modunda çocuk fotoğrafı veya biyometrik veri asla istenmez ve saklanmaz;
  RGPD ve çocuk mahremiyeti gereğince deterministik renkli monogram avatarlar kullanılır.
- Kur'an-ı Kerim sûre, âyet ve Elifba sesleri istisnasız resmî Diyanet Kur'an portalı
  sunucularından (`kuran.diyanet.gov.tr`, `webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/` —
  Davut Kaya / Osman Şahin) alınır. Dış servis veya onaylanmamış üçüncü taraf ses kullanılmaz.
- Otomatik kayıt aktarımı mevcut şifreyi, kitap yanıtını, ikinci veliyi ve sabit
  öğrenci alanlarını ezmemelidir. Aynı kayıt yeniden işlendiğinde çoğalmamalıdır.
- Cuma mesajı yayımlanmış plan ve ödevlerden hazırlanır. Eksik plan tatil demek
  değildir; eski ödev yeni haftanın ödevi gibi gönderilmez.
- Sağlayıcının mesajı kabul etmesi, alıcının okuması veya kesin teslim değildir.
  Belirsiz gönderim sonucunda aynı mesajı körlemesine tekrar gönderme.
- Veli e-postaları telefon önceliklidir. Kalıcı deneme alıcısı özel ayar dosyasında;
  konumu ve mobil şablon ölçüleri cuma e-postası notunda bulunur.
- GAS canlı uygulamasında gömülü PDF kaynakları bulunur. Megabaytlık dosyayı
  bütünüyle bağlama alma; gerekli fonksiyonları dar aralıkta incele. Yetkili
  dağıtımda canlı kaynağı koru; yerel derlemeyi doğrulamadan üstüne yazma.
- Apps Script'in protokol sürümü, dağıtım sürümü ve GitHub Pages yayını ayrıdır.
  Yerel değişiklik veya geçen test, canlıya yayınlandığını göstermez.

## Tarihli kanıtın yeri

9 Eylül 2026'da kayıt aktarımının bağımsız zamanlayıcı çalışması doğrulandı.
Cuma otomasyonu etkinleştirildi; ilk planlı gönderim 11 Eylül, Belçika saatiyle
10.00 civarıdır. Kurulum, dağıtım ve test kanıtları ilgili iki otomasyon notundadır.
Sonraki bir oturumda güncel teslimat veya çalışırlık sorulursa salt okunur
durum kontrolü yap; bu tarihli kaydı güncel sonuç diye sunma.

Özel veli/öğrenci listeleri ve e-posta gönderim kayıtları repo dışında, dernek
arşivinde tutulur. Bu dosyaya kişi bilgisi, anahtar veya özel belge içeriği ekleme.

## Notları küçük ve güncel tutma

1. Önce ilgili konu notu ve kodda `rg` ile dar arama; eski sohbeti ancak açık eksik varsa tara.
2. Karar değiştiğinde aynı konu notunu düzelt; yeni bir tarihçe dosyasıyla çoğaltma.
3. Kalıcı not: karar + gerekçe + kaynak dosya. Geçici durum: tarih + kanıt + kalan iş.
4. Uzun işte devir notuna değişen yolları, yapılan kontrolleri ve sıradaki adımı yaz;
   tamamlanmış günlüğü otomatik yüklenen talimatlara taşıma.
5. Token tasarrufu için gerekli kalite kapısını atlama; yeni değişiklik veya hata
   yokken aynı başarılı doğrulamayı tekrar çalıştırma.

Dayanak: [OpenAI çalışma önerileri](https://learn.chatgpt.com/guides/best-practices),
[AGENTS.md yönergeleri](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## Kayıt belgeleri

15 Eylül 2026: [Zorunlu veli imzası ve öğrenci kimliği](KAYIT-ZORUNLU-BELGELER.md). Çevrim içi kayıt bu iki belge olmadan tamamlanmaz; kimlik kayıt PDF’sine eklenir. Eski eksik kayıtlara imza üretilmez.
