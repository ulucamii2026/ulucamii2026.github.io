# Ulu Camii — Codex çalışma sözleşmesi

Yalnız Türkçe yanıt ver; tam imlâyı koru. Bu proje Marche-en-Famenne Ulu Camii
derneğinin sitesidir. Önce `git status --short` ile mevcut çalışmaları koru.
Kurulum ve doğrulama rehberi: `docs/CODEX-CALISMA.md`.

## Hesap ve yayın sınırı

- GitHub: **ulucamii2026**, depo `ulucamii2026/ulucamii2026.github.io`.
- Google/Firebase: **ulucamii2026@gmail.com**, proje **ulucamii-portal**.
- Kişisel GitHub, Gmail, Drive ve Firebase bağlantılarını bu projede kullanma.
  Genel `gh auth switch` çalıştırma. GitHub için `scripts/gh-cami.ps1`, Firebase
  için `scripts/firebase-cami.ps1` kullan; kimliği önce salt okunur doğrula.
- Yerel geliştirme izni yayın izni değildir. Push, Pages yayını, CMS kaydı,
  Firestore/GAS değişikliği, e-posta ve form gönderimi için o iş açıkça istenmiş olmalı.
- `.firebaserc` ve `firebase.json` canlıya aittir. Testler yalnız
  `firebase.emulators.json` + **demo-ulucamii** + localhost kullanır.
- Parola, token, çerez, gerçek öğrenci/veli kaydı ve özel belgeyi kaynak koda,
  rapora, ekran görüntüsüne veya Git'e taşıma. Örneklerde yalnız `.test` adresleri.
- `scripts/portal-test.py` canlı kaynak kullanır: olağan doğrulamada çalıştırma.

## Proje haritası ve beceriler

- Astro statik sayfalar; Preact adacıkları; Tailwind 4; yerel fontlar.
- Sayfa/içerik: `src/pages`, `src/content`, `src/content.config.ts`.
- Dil/yollar: `src/i18n`; TR, FR ve EN akışlarını birlikte kontrol et.
- CMS: `public/admin/icerik/config.yml`; içerik şeması değişirse Astro şemasıyla eşleştir.
- Veli/hoca portalı: `src/scripts/veli-portali.ts`, `src/scripts/hoca-ekrani.ts`,
  `src/lib/firebase.ts`, `src/pages/hoca`, `firebase/`.
- Form backend'i: `scripts/apps-script/`; yerel sürüm numarası canlı sürüm kanıtı değildir.
- `ulucamii-site` becerisini oku; hesap, içerik ve operasyon ayrıntılarında kullan.
  Özel tarihçe notlarında sır bulunabilir: yalnız gereken bölümü incele, kopyalama.
- Arayüz/tasarım işinde `impeccable`; kütüphane API'sinde Context7;
  Codex ayarlarında `openai-docs`; görsel/belge işinde uygun mevcut beceri.
  Aynı iş için yinelenen plugin/MCP kurma. Alt ajanı ancak açıkça istendiğinde kullan.

## İçerik ve tasarım ilkeleri

- Namaz vakti yalnız Diyanet, ilçe 11890. Hesaplama servisi/farklı kaynakla doldurma.
- Dinî metin, saat, tarih ve kurum bilgisini güvenilir kaynaktan doğrula.
- Mevcut Kilim Kartografyası dilini, renklerini ve yerel fontlarını başlangıç kabul et;
  köklü tasarım değişikliğinde kullanıcının isteğini esas al.
- Mobil, klavye erişimi, açık/koyu tema ve azaltılmış hareketi doğrula.
- Kimlik verisi/çocuk fotoğrafı istemeyi veya saklamayı kendiliğinden genişletme.

## Her değişiklikte kalite kapısı

1. İlgili dosyaları dar kapsamda incele; alakasız düzeltme/bağımlılık yükseltmesi yapma.
2. Gerekli küçük değişikliği yap. İçerik/tema işi backend politikasını sessizce değiştirmesin.
3. `npm run dogrula:codex` çalıştır. Bu komut yayın yapmaz; web testleri dış ağı keser,
   kural testleri gerçek Firebase'e bağlanmayı reddeder.
4. Görsel değişiklikte ayrıca `npm run onizle` ile derlenmiş siteyi aç, uygun boyutlarda
   ekran görüntülerini incele. Otomatik axe testi tam erişilebilirlik onayı değildir.
5. Sonuçta değişiklikleri, test sonuçlarını ve test edilmemiş sınırları açıkça bildir.
   Canlı işlem gerekiyorsa ayrı adım olarak ele al; kendiliğinden commit/push yapma.
