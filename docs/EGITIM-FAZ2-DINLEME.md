# Eğitim platformu — Faz 2 dinleme çalışması

Tarih: 2 Ekim 2026, Europe/Brussels. Kullanıcı isteği: eğitim sitesinin durumunu kontrol etmek ve kaldığı yerden devam etmek.

## Canlı durum ve bu çalışmanın sınırı

- **9 Ekim 2026 09:19 (CEST) YAYINDA.** Kullanıcının 9 Ekim «Eğitim Faz 2 yayını» seçimiyle güncel `origin/main`
  üzerinde (commit `1fecd5b`) kalite kapısı 10/10 geçti; `npm run egitim:yayinla` → Hosting `ulucamii-egitim` canlı
  kanalı; `npm run egitim:canli -- https://egitim.ulucamii.be` 36/36 (140 adresli site haritası, çalışma çaları gerçek
  ses 206, CSP ihlali 0). Duyuru yapılmadı (karar: metin/oyun içerikleri tamamlanınca). Aşağıdaki 2 Ekim notları
  yerel geliştirme kaydıdır. Yayın kaydı: `docs/YAYIN-KAYITLARI.md` «9 Ekim 2026 (5)».
- `https://egitim.ulucamii.be`: 2 Ekim 19.07'de mevcut canlı denetim 33/33 geçti. Beş dil, CSP ve diğer güvenlik başlıkları,
  yönlendirme, site haritası ve gerçek Diyanet kaydının HTTP 206 ile oynatılması doğrulandı.
- Faz 1a–1f tamam; katalog 81 madde, 27 sesli / 54 sessiz. Canlı site halen beş giriş sayfasından oluşuyor.
- Bu değişiklik Faz 2'nin **dinle–tekrarla** bölümüdür. Arapça metin, okunuş, meâl, gizleme/oyunlar ve hesapsız ilerleme
  bu bölümle tamamlanmış sayılmaz. Yeni dinî metin veya ses eklenmedi; doğrulanmış katalog ve ses kayıtları kullanıldı.
- Commit, push, Hosting/Firestore/GAS yayını, hesap değişikliği veya e-posta gönderimi yapılmadı.
- Dernek GitHub sarmalayıcısıyla uzak `main` salt okunur doğrulandı: `6b0e452f4fc2b1dddf24cbd917fb52694eb03ded`,
  yerel `9877efc` tabanından 10 commit ileride. Farklar vaaz, cami ekranı ve namaz verisinde; eğitim dosyalarıyla
  çakışma yok. Test sırasında çalışma ağacı değiştirilmedi. Yayından önce güncel tabanla birleştirip kalite kapısını
  o içerikte yeniden çalıştır; bu kaydın test sonucu yerel tabana aittir.

## Yerel uygulama

- `egitim/src/pages/[dil]/calis/[id].astro`: yalnız sesi hazır 27 madde için beş dilde 135 sayfa; örnek `/tr/calis/s-fatiha/`.
  Sınıf hedefi mevcut yıllık plandan, madde ve seviye adları ortak katalogdan gelir.
- `egitim/src/scripts/calisma.ts`: bütün bölümler sırayla veya tek bölüm; bölüm başına 1/3 tekrar; 1×/0,75× hız;
  isteğe bağlı üç saniyelik tekrar arası; duraklat/devam/başa dön; anlaşılır hata ve yeniden başlatma.
  Ses kullanıcı tıklamadan yüklenmez. Eski ses nesnesinin olayları/oynatma reddi yeni çalışmayı kesemez.
  Bölüm/tekrar değişimi oynatmayı durdurur; hız anında uygulanır. Sayfadan ayrılınca oynatma ve zamanlayıcı kapanır.
- `egitim/src/i18n/calisma.ts`, `egitim/src/styles/calisma.css`: beş dil, Çini Panosu tasarımı ve açık/koyu tema.
  JavaScript kapalıysa doğrudan kayıt bağlantısı gösterilir. Ezan sayfası kaydın sabah ezanı olduğunu belirtir.
- Girişte Fâtiha düğmesi ve sesli madde adları çalışma sayfalarına bağlanır; pano ve eski `#m-…` bağlantıları korunur.
  Dil seçici aynı maddeyi korur; kanonik/hreflang ve site haritası her çalışma sayfasını içerir.
- Hesap veya ilerleme yazımı yok; çalışma hocanın verdiği basamağı değiştirmez.
- `tests/egitim/calisma.spec.mjs`: ses sırası, tekrar, hız, duraklatma, bekleme iptali, eski olaylardan yalıtım,
  hata sonrası yeniden başlatma, beş dil, klavye, CSP, tema, dar ekran ve kapalı depolama.
  `tests/egitim/barindirma.test.mjs` bütün 142 HTML çıktısını CSP için tarar, 140 kanonik adresi kontrol eder.
- `scripts/egitim-canli-denetim.mjs` bir sonraki yayından sonra 140 adresli site haritası ve yeni çalışma çalarını da bekler.
  Eski canlı sürümün bu yeni denetimden geçmesi beklenmez; 33/33 sonucu değişiklik öncesi denetimin sonucudur.

## Doğrulama

- `npm run dogrula:codex` çıkış **0**; 10/10 aşama geçti: tasarım, tip kontrolü, içerik/derleme,
  ana web, eğitim derleme/test, yerel Firestore kuralları, veli e-postası, otomatik kayıt ve öğrenme testleri.
- Ana site: **796 geçti / 96 yapılandırılmış atlama**. Eğitim: **15/15 birim**, **70 geçti / 2 bilinçli atlama**
  (yönlendirme ve başlık senaryolarının mobil tekrarları). Yeni çalışma ekranı senaryoları iki cihaz profilinde geçti.
- Eğitim derlemesi **142 HTML**, site haritası **140 adres**; satır içi betik/stil olmadan CSP denetimi geçti.
- Görsel inceleme: TR 1440 px masaüstü, FR 390 px mobil, DE 390 px koyu mobil. Koyu tema motifinin dolgusu düzeltildi,
  son derlemede yeniden incelendi. 320 px DE ekran, klavye, açık/koyu tema ve otomatik erişilebilirlik testleri geçti.
- Yeni çalarda gerçek `ulucamii.be` kaydı HTTP **206** ile alındı, **0,75×** hızda süre ilerledi (`currentTime > 0,3`),
  duraklatma `paused: true` oldu. JavaScript kapalı sayfada doğrudan kayıt bağlantısı var ve çalışma düğmeleri kapalı.
- Kanıtlar: `D:\tmp\egitim-faz2-dogrula.log`, `D:\tmp\egitim-faz2-dogrula-exit.txt`,
  `D:\tmp\egitim-faz2-gorsel\kontrol.json` ve aynı klasörde `tr-masaustu.png`, `fr-mobil.png`, `de-mobil-koyu.png`.
- `git diff --check` ve yeni denetim/test betiklerinin sözdizimi kontrolü geçti. Başlangıçtaki dokuz ilgisiz izlenmeyen
  dosya korundu. Test/önizleme portları 4399, 4401, 4402, 8185, 4485, 4585, 9150 son kontrolde dinlenmiyordu.
- Sınırlar: fiziksel telefon/iPhone/Safari, girişli canlı veli/hoca akışı ve yeni sayfaların Hosting yayını denenmedi.
  Otomatik axe testi erişilebilirlik sertifikası değildir. Bu çalışma yalnız yerel tabanda doğrulandı; yukarıdaki uzak dal
  farkı yayın öncesinde ele alınmalı. Yeni bir yayın olmadığı için `YAYIN-KAYITLARI.md` dosyasına yayın kaydı eklenmedi.

## Sonraki sıra

1. Bu bölümün yayın onayı, temiz çalışma ağacından yayın ve yayın kaydı; mevcut ana site ses adresleri değişmedi.
2. Diyanet'ten eksik sesler ve metinlerin kaynaklı hazırlanması. Arapça harf karşılaştırması, meâl kaynakları ve hoca
   okunuş kontrolü tamamlanmadan metinleri çalışma sayfalarına ekleme.
3. Kademeli gizleme, sıralama/eşleştirme/eksik kelime ve cihazda ilerleme.
4. Faz 2'nin asıl madde içerikleri tamamlanınca duyuru; hesaplar/belgeler Faz 3, diğer bölümlerin taşınması Faz 4.
