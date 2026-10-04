# Hoca portalında ders kitapları

21 Eylül 2026. Kullanıcı dört yerel PDF'nin **hoca ekranından indirilebilmesini** istedi.
`/hoca/ → Ders kitapları`: Camiye Gidiyorum 1–2, Fransızca Belçika ve Türkçe vektörel sürümler.
Kaynak PDF'ler değiştirilmez; indirme sonunda SHA-256 ile birebir eşitlik aranır.

**23 Eylül 2026 yenileme.** Dört kitap, kullanıcının teslim klasöründeki A4 ev yazıcısı baskı
sürümleriyle (22–23 Eylül hazırlığı; klasördeki `BASKI_NOTLARI.md` + `SHA256.txt`) değiştirildi.
Kimlikler `…-20260921` → `…-20260923`; eski 21 parça silindi, yeni 25 parça yazıldı; her kitap
yeni bağımsız anahtar aldı. Yenileme adımları: `.codex/kitap-yenile-20260923.py` (kaynak özeti
`SHA256.txt` ile doğrulanır, eski anahtar dosyası tarihli adla yedeklenir) → birim/tarayıcı
testleri → `.codex/kitap-yayin-20260923.py --firestore birlestir` (eski ∪ yeni anahtar; canlı
site kesintisiz) → Pages yayını → `--canli` (dört kitap + eski parçaların 404 olduğu) →
`--firestore yeni` (yalnız yeni dört anahtar). Eski parçalar Git geçmişinde kalır ama anahtarları
Firestore'dan silindiği için çözülemez; 23 Eylül 22:20'de yerel eski anahtar yedeği de kullanıcının
isteğiyle silindi.

**28 Eylül 2026 yenileme.** Kullanıcı aynı teslim klasörünün güncel sürümünü verdi («bu kitapları
hoca portalındaki kitaplar güncellenecek, bunlar güncel»). Klasördeki `BASKI_NOTLARI.md`'ye göre bu
sürümde **yalnız ön kapaklar** değişti (TR ve FR kapak tasarımı eşleştirildi, üst-alt beyaz şeritler
giderildi); diğer sayfalar aynı. Kimlikler `…-20260923` → `…-20260928`; eski 25 parça silindi, yeni 25
parça yazıldı, her kitap yeni bağımsız anahtar aldı. Betikler `.codex/kitap-yenile-20260928.py` ve
`.codex/kitap-yayin-20260928.py` (23 Eylül betiklerinden yalnız tarih sabitleri değişti); eski anahtar
dosyası `.codex/hoca-kitap-anahtarlar-eski-20260923.json` olarak yedeklendi (Git dışı). Yayın ve canlı
doğrulamadan sonra kullanıcı kararı bize bıraktı («bütün yetki ve karar senin»); 23 Eylül'deki «eskileri at
gitsin» ilkesiyle bu yedek ve 23 Eylül'e ait yardımcı/çıktı dosyaları silindi. Eski parçalar artık hiçbir
anahtarla çözülemez.

## Depo boyutu kararı (28 Eylül 2026)

Her yenileme depoya ≈350–380 MB ekler (şifreli parçalar sıkıştırılamaz); 28 Eylül sonrası GitHub depo boyutu
≈1,46 GiB. **Geçmiş yeniden yazılmaz.** Gerekçeler: (1) eski parçalar anahtarsız şifreli veridir, gizlilik
riski taşımaz; (2) yayın iş akışları `actions/checkout` varsayılanıyla yalnız son commit'i indirir, derleme
süresi geçmişten etkilenmez; yayımlanan site (`dist`) ≈757 MB ile Pages'in 1 GB sınırının altındadır;
(3) aynı depoda eşzamanlı çalışan başka oturumlar/çalışma ağaçları vardır, zorla gönderim onların dallarını
bozar; (4) GitHub'da zorla gönderim tek başına eski nesneleri silmez, Destek bileti gerekir (hutbe temizliği
deneyimi). Depo GitHub'ın önerdiği 5 GB üst sınırının altında.

**Sonraki yenilemede** parçalar bu depodan çıkarılır. Release dosyaları seçenek değildir: 28 Eylül'de
denendi, `release-assets.githubusercontent.com` yanıtı `Access-Control-Allow-Origin` başlığı göndermiyor,
`fetch` ile parça indiren hoca ekranı çalışmaz. Uygun yol, aynı hesapta yalnız şifreli parçaları taşıyan
ayrı bir depo + GitHub Pages proje sitesidir (özel alan adıyla `ulucamii.be/<depo>/…` altında aynı kökenden
sunulur); her yenilemede o depo tek commit'e indirilip zorla gönderilir, ana depo büyümez.
`src/data/hoca-kitaplari.json` içindeki `yol` alanları yeni öneke çevrilir; betik ve testler yolu JSON'dan
okuduğu için başka kod değişikliği gerekmez (yine de `hoca-kitaplari.spec.mjs` ve canlı `--canli` denetimi
yeni adresle koşulur).

## Erişim ve dosyalar

- Düz PDF'ler herkese açık Git deposuna veya Release'e konmaz. Yayınlanan 25 `.bin` parçası
  AES-256-GCM ile şifrelidir; açık PDF içeriği taşımaz.
- Her kitap bağımsız 32 bayt anahtar, her parça bağımsız 12 bayt rastgele IV kullanır.
  Parça düzeni: IV + şifreli içerik + GCM etiketi. AAD: `<kitap-id>:<sıfırdan-parça-no>`.
  En büyük düz parça 16 MiB. Anahtar dernek Firestore'undaki `ayarlar/hocaKitaplari`
  belgesinin `anahtarlar` alanında (`kitap-id → hex anahtar` eşlemesi) ve Git dışı
  `.codex/hoca-kitap-anahtarlar.json` dosyasındadır. 4 Ekim 2026'dan beri aynı anahtarlar
  `/kitap/` paylaşım sarmalının içinde de bulunur (aşağıdaki bölüm); sarmal paylaşım anahtarı
  olmadan açılmaz.
- Mevcut Firestore `ayarlar` kuralı yalnız `hocalar/{uid}` kaydı bulunan oturumlara okuma
  izni verir. Yeni kullanıcı, rol, genel okuma kuralı veya ücretli depolama servisi açılmaz.
- `src/scripts/hoca-kitaplari.ts`: anahtar her indirmede Firestore lite `getDoc` ile sunucudan
  alınır. Anahtarlar localStorage/IndexedDB'ye yazılmaz. Parçalar ardışık indirilir, şifreli
  parça özeti ve GCM doğrulanır; tamamının boyutu ve kaynak PDF özeti tutmadan indirme sunulmaz.
  Hata yeniden denenebilir; iptal, sekme değişimi ve çıkış süren indirmeyi sonlandırır.
- `src/data/hoca-kitaplari.json`: yalnız kitap adı, sayfa, boyut, dosya adı, özet ve şifreli
  yolları içerir. Anahtarlar, kaynak düz PDF'ler ve gerçek kişi verileri bu dosyaya girmez.
- Kitabı indirmeye yetkili hoca dosyayı cihazına kaydedebilir; indirilmiş kopyayı uzaktan
  geri çekme iddiası yoktur.

## Paylaşım bağlantısı (/kitap/)

4 Ekim 2026. Kullanıcı dört kitabın hoca hesabı olmayan bir muhataba (Müşavirlik, 2026/23 sayılı
yazının Ek-4'ü ve e-postası) bağlantı ve karekodla indirtilmesini istedi; Müşavirliğe portal hesabı açmak
(öğrenci/veli verisini de gösterirdi) yerine **gizli paylaşım bağlantısı** seçildi.

- Sayfa `src/pages/kitap/index.astro`: TR, `noindex`, `tekDil`, menüde bağlantısı yok, site haritasına girmez.
  Davranış `src/scripts/kitap-paylasim.ts`; listeleme, ilerleme, iptal ve kaydetme `hoca-kitaplari.ts`
  ile ortaktır (`kitaplarHtml(m)` / `hocaKitaplari(kok, anahtariOku, m)` — `m` yalnız ekran metni).
- `src/data/kitap-paylasim.json`: dört kitap anahtarı (`{kitap-id: hex}`) 16 baytlık **paylaşım
  anahtarıyla** AES-GCM ile sarılıdır (AAD `kitap-paylasim:v<surum>`). Paylaşım anahtarı yalnız adresin
  `#` kısmındadır (`https://ulucamii.be/kitap/#<22 karakter base64url>`): tarayıcı onu sunucuya, sayaca
  ve Referer'a göndermez; sayfa onu hiçbir depoya yazmaz. Depoda açık anahtar bulunmaz (test eder).
- Üretim yardımcısı Git dışı `.codex/kitap-paylasim-olustur.py` (Python314 + `cryptography`):
  `--depo <ağaç>` her kitap anahtarını o kitabın ilk parçasını çözerek sınar, sarmalı yazar; paylaşım
  anahtarı ve tam bağlantı yalnız Git dışı `.codex/kitap-paylasim-anahtar.json` içinde kalır.
  Bayraklar: (bayraksız) mevcut paylaşım anahtarıyla yeniden sarar; `--yeni` yeni anahtar (eski bağlantı
  ve basılı karekod geçersiz olur); `--kapat` `{surum, durum:"kapali"}` yazar; `--qr <svg>` karekod.
  Tam bağlantı ve paylaşım anahtarı rapora, kayda, log'a ve Git'e yazılmaz.
- **Kitap yenilemesinde** (`kitap-yenile-*.py`) yeni kitap kimlikleri ve anahtarlarından sonra bu betik
  `--yeni` OLMADAN çalıştırılır; böylece Müşavirliğe verilmiş bağlantı/karekod çalışmaya devam eder.
  Unutulursa `tests/kitap-paylasim.test.mjs` kırılır (sarmaldaki kimlikler `hoca-kitaplari.json` ile aynı olmalı).
- Sınırlar: bağlantıya ya da karekodun fotoğrafına sahip olan herkes indirebilir. `--kapat` sayfayı
  kapatır ama eski sarmal Git geçmişinde kalır; eski paylaşım anahtarı, kitap anahtarları yenilenene
  kadar o sarmalı açabilir — gerçek iptal kitap yenilemesidir. Büyük dosyalar eski telefonlarda ve e-posta
  uygulamalarının iç tarayıcısında belleğe sığmayabilir (sayfa bilgisayar önerir).
- Doğrulama: `tests/kitap-paylasim.test.mjs` (adres ayrıştırma, doğru/yanlış/bozuk anahtar, sürüm, eksik
  kitap, depo sözleşmesi) ve `tests/web/kitap-paylasim.spec.mjs` (anahtarsız/yanlış bağlantı, test
  sarmalıyla dört düğme, indirme hatası, depolama boş kalır, noindex, mobil taşma, açık/koyu axe).
  Gerçek anahtarla dört kitabın `SHA256.txt` eşitliği yerelde (4 Ekim 2026) sınandı; canlı denetim yayın
  kaydındadır.

## Doğrulama ve bakım

- `tests/hoca-kitaplari.test.mjs`: bütün şifreli dosyaların varlığı/özeti/boyutu; doğru çözüm,
  yanlış anahtar, bozuk içerik, farklı AAD ve iptal. `npm run test:ogrenme` içine dahildir.
- `tests/kurallar/firestore.test.mjs`: hoca okuyabilir; veli, rolü olmayan hesap ve ziyaretçi
  anahtarları okuyamaz/yazamaz. Yalnız `demo-ulucamii` emülatörü kullanılır.
- `tests/web/hoca-kitaplari.spec.mjs`: dört indirme, izin hatası, yeniden deneme, mobil taşma,
  açık/koyu tema ve erişilebilirlik. Testlerde gerçek kişi/üretim anahtarı yoktur.
- Bu çalışma alanındaki `.codex/kitap-hazirla.py`, `.codex/kitap-yayin.py` ve
  `.codex/kitap-tarayici.mjs` ilk yükleme ve gerçek dosya eşitliği doğrulamasının özel yardımcılarıdır.
  `.codex/hoca-kitap-anahtarlar.json` Git dışında kalır; içeriği hiçbir rapora/loga kopyalanmaz.
  Yenilemede önce dosyalar ve testler hazırlanır, tek özel anahtar belgesi güncellenir,
  Pages yayını ve dört canlı indirme doğrulanır. Eski anahtar körlemesine değiştirilmez.

| Kitap | Sürüm | Kimlik | Sayfa | Bayt | Parça |
|---|---|---|---:|---:|---:|
| Camiye Gidiyorum 1 | Fransızca Belçika | `cg1-fr-20260928` | 228 | 99477220 | 6 |
| Camiye Gidiyorum 1 | Türkçe vektörel | `cg1-tr-20260928` | 228 | 88648802 | 6 |
| Camiye Gidiyorum 2 | Fransızca Belçika | `cg2-fr-20260928` | 270 | 72302208 | 5 |
| Camiye Gidiyorum 2 | Türkçe vektörel | `cg2-tr-20260928` | 270 | 120541855 | 8 |

Önceki sürüm (23 Eylül 2026, kaldırıldı): FR1 228 s. / 97003740 B, TR1 228 s. / 87384744 B,
FR2 270 s. / 69277461 B, TR2 270 s. / 119001909 B.
Önceki sürüm (21 Eylül 2026, kaldırıldı): FR1 228 s. / 119508776 B, TR1 227 s. / 47574147 B,
FR2 270 s. / 94836992 B, TR2 270 s. / 63422630 B.
