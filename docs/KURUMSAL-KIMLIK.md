# E-posta ve yazışma kimliği

Tek kaynak: [kimlik.json](D:/vektorel-calismalar/ulu-camii-kurumsal-kimlik/05-yazisma/kimlik.json).
Bağlayıcı kullanım: [YAZISMA-KILAVUZU.md](D:/vektorel-calismalar/ulu-camii-kurumsal-kimlik/05-yazisma/YAZISMA-KILAVUZU.md).
Renk, ad, telefon, logo, font ve imza bu kaynaklarda yönetilir. Site kopyası ve GAS sabitleri elle düzenlenmez.

`npm run kimlik:uret` yerel JSON/GAS kopyalarını ve ana pakette altı HTML/TXT imzasını üretir.
`npm run kimlik:denetle` üretilen kopyaların SHA-256 özetlerini beklenen çıktılarla karşılaştırır; farklı/eksik dosyada 1 döner.
GAS başlığındaki SHA-256 ana dosyanın ham baytlarına aittir; JSON kopyası iki boşlukla biçimlendirilmiş UTF-8/LF'dir.
Üretim, denetim ve GAS derlemesi ana kaynağın `anaKaynak` yolunda bulunmasını gerektirir; eksiklikte eski kopyaya dönülmez.

Ortak çerçeve [veli-eposta-sablon.gs](../scripts/apps-script/veli-eposta-sablon.gs) v2'dir.
`veliEpostaDuzMetin(metin, dil, baslik, secenekler?)`, `veliEpostaZengin(bloklar, dil, baslik, secenekler?)`
ve `veliEpostaBelge(dil, baslik, icerikHtml, secenekler?)` kullanılır. Sonuncunun HTML girdisi yalnız güvenilir iç üretim içindir.
Dil açıkça `tr|fr|en` olmalıdır; eksik dil reddedilir. Kurum varsayılanı `kurs`, diğer seçenek `cami`dir.
Mevcut kayıt/cuma akışları kendi TR/FR iletişim dili sözleşmelerini korur; şablonun EN desteği bu akışları genişletmez.

Python/CLI sözleşmesi: `scripts/veli-eposta-render.mjs` stdin'den `{metin?, bloklar?, dil, baslik, kurum?, dugme?, gorseller?, liste?, altNot?, onIzleme?}` alır;
`bloklar` varsa önceliklidir. Stdout yalnız HTML, hata stderr ve çıkış kodu 1'dir. Düz metinde yalnız `**kalın**` ve HTTPS bağlantıları işlenir.
Zengin bloklar: `paragraf`, `baslik`, `dugme`, `gorsel`, `liste`, `madde`, `cizgi`, `not`. Görseller HTTPS/CID, düğmeler HTTPS kabul eder.
GIF/otomatik tanıtım görseli yoktur; yalnız açıkça verilen içerik görselleri eklenir.

`npm run eposta:onizle` → `D:/tmp/eposta-onizleme/` içinde 12 HTML.
`node tests/kurumsal-kimlik-gorsel.mjs` → aynı yerde 84 ölçüm ve 24 ekran görüntüsü; dış istekler kesilir, logolar yerel dosyalardan karşılanır.
`npm run test:kimlik`, `npm run test:veli-eposta`, `npm run test:ihtida` yerel sözleşme testleridir.
`npm run ihtida:gas-derle` → `.codex/cikti/gas/ulucamii-v30.gs`; sıralama kimlik sabitleri → v30 → ortak şablon/içerik modülleridir.
Kayıt ve cuma göndereni kurs, ihtida ve genel yazışma göndereni cami kimliğidir. Gönderim sarmalayıcısı `kurum` seçeneğini kabul eder.
Eski `ihtidaKopyaGonderV2` yardımcı çağrısı artık beşinci argümanda dili ister; mevcut ihtida kuyruk/teslim akışı değiştirilmemiştir.

13 Eylül 2026: v29 kaynağı korunmuştur (`ulucamii-Kod-v29.gs`); v30 aynı gün `D:/tmp/gas/dagit_v30.py` ile dağıtıldı. Karar ve kurallar: hafıza `kurumsal-kimlik`, skill `ulucamii-site` «CORPORATE IDENTITY», paket `05-yazisma/YAZISMA-KILAVUZU.md`.
Test sonuçları ve kapsam dışı kalan doğrulamalar: `.codex/kimlik/codex-A.out`. Tarayıcı kontrolü gerçek Gmail/Outlook/Purelymail istemci testi değildir.
