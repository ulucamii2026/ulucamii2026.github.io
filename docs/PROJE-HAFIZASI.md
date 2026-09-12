# Ulu Camii — kısa proje başvurusu

Güncelleme: 9 Eylül 2026. Amaç: aynı keşfi tekrarlamadan ilgili kaynağa ulaşmak.
Çalışma ve hesap kuralları [AGENTS.md](../AGENTS.md) içindedir; burada yinelenmez.
Bu dosya canlı durum garantisi veya yeni gönderim/yayın izni değildir.

## İşe göre başlangıç

| İş | Önce bakılacak kaynak | İlgili kod / doğrulama |
|---|---|---|
| Veli e-postasının dili | [Dil kararı](VELI-EPOSTA-DILI.md) | `src/scripts/veli-portali.ts`, `src/scripts/hoca-ekrani.ts`; `tests/veli-eposta-dili.test.mjs` |
| Yeni kaydı e-posta listesine alma | [Otomatik aktarım](VELI-MAIL-LISTESI-OTOMASYONU.md) | `scripts/apps-script/veli-mail-listesi.gs`; `tests/veli-mail-listesi.test.mjs` |
| Cuma e-postası / ödev / malzeme | [Haftalık otomasyon](VELI-CUMA-EPOSTASI.md) | `scripts/apps-script/veli-cuma.gs`; `tests/veli-cuma.test.mjs` |
| İhtida formunda adımlar / cami / şahit | [Adımlar](IHTIDA-ADIMLI-FORM-v27.md), [cami seçimi](IHTIDA-CAMI-SECIMI-v26.md) | `src/components/formlar/IhtidaFormu.astro`, `src/scripts/ihtida-adimlari.ts`, `src/scripts/ihtida-cami.ts`; `tests/web/ihtida*.spec.mjs` |
| EK-9, EK-10, dilekçe ve e-posta paketi | [Paket akışı](IHTIDA-OTOMASYON-v25.md) | `public/admin/ihtida-paket.js`, `ek9.js`, `ek10.js`, `dilekce.js`; `scripts/apps-script/ihtida-paket-isleri.gs`; `npm run test:ihtida` |
| İhtida defteri | [Defter](IHTIDA-DEFTERI-v28.md) | `public/admin/ihtida-defteri.js`, `scripts/apps-script/ihtida-defteri-isleri.gs`; `tests/ihtida-defteri-*.test.mjs` |
| Ortam, hesap sarmalayıcıları, genel testler | [Çalışma rehberi](CODEX-CALISMA.md) | `package.json`, `scripts/dogrula-codex.mjs`; `npm run dogrula:codex` |
| Ana sayfa vitrini | [Ana sayfa vitrini](ANA-SAYFA-VITRINI.md) | `src/lib/vitrin-secimi.ts`, `src/components/GundemVitrini.astro`; `tests/web/vitrin.spec.mjs` |
| Ana sayfa akışı | [Ana sayfa akışı](ANA-SAYFA-AKISI.md) | `src/components/AnaSayfaAkisi.astro`, `src/styles/ana-sayfa-akisi.css`; `tests/web/ana-sayfa-akisi.spec.mjs` |
| Mektep çalışma odası / öğrenci modu | [Öğrenci modu](OGRENCI-MODU-PORTAL.md) | `src/scripts/veli-portali.ts`, `src/scripts/hoca-ekrani.ts`, `src/lib/elifba-verisi.ts`, `src/lib/ezber-verisi.ts`, `src/lib/quiz-verisi.ts`; `npm run dogrula:codex` |
| Birlikte öğrenme / aile rehberi / aralıklı tekrar | [Atölye](VELI-OGRENCI-ATOLYESI.md), [pedagojik araştırma](VELI-OGRENCI-PEDAGOJIK-ARASTIRMA.md) | `src/scripts/ogrenme-atolyesi.ts`, `src/lib/ogrenme-ilerleme.ts`; `npm run test:ogrenme` |
| Haftalık bülten / kontrollü öğrenci kayıt temizliği | [Bülten ve idare](HAFTALIK-BULTEN-VE-IDARE.md) | `src/scripts/hoca-bulten.ts`, `src/lib/portal-idare.ts`; `tests/web/bulten-idare.spec.mjs`, `npm run test:kurallar` |
| Anti-Gravity iş akışı | [İş akışı](ANTIGRAVITY-IS-AKISI.md), [12 Eylül oturum incelemesi](AGY-OTURUM-INCELEMESI-2026-09-12.md) | `scripts/oto-kaydet.ps1`; `npm run test:oto-kaydet` |
| Web sitesi genel çalışma dökümü | [11 Eylül çalışma dökümü](WEB-SITESI-CALISMA-DOKUMANI-2026-09-11.md) | Konu notlarına yönlendiren genel özet |

## Tekrar keşfedilmemesi gereken kararlar

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
