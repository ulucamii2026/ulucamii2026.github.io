# Ulu Camii — Codex geliştirme ortamı

İşe göre kısa başlangıç: [Proje başvurusu](PROJE-HAFIZASI.md).
Bu rehberdeki kurulum sonuçları tarihlidir; yeni işte ilgili konu notunu esas alın.

Kurulum: 8 Eylül 2026. Amaç, mevcut siteyi Codex CLI ile yerelde geliştirmek ve
yayından önce sınamak. Bu kurulumda tema/içerik, Firestore kuralları ve canlı servisler
değiştirilmedi; commit, push ve dağıtım yapılmadı.

## Başlangıç

```powershell
codex -C D:\app\ulucamii-site
```

Yeni oturum `AGENTS.md` ve `.codex/config.toml` dosyalarını okur. Bu bilgisayarda
proje güveni tanımlandı. Mevcut sohbetin araç listesi kendiliğinden yenilenmeyebilir;
yerel Playwright MCP için bu klasörde yeni Codex oturumu açın.
Genel `muhendislik` profilini seçmek gerekmez; burada daha dar bir araç seti vardır.

9 Eylül güncellemesi: proje ayarlarında kullanılmayan Canva/Figma, sunum ve benzeri
eklenti grupları bu klasör için kapatıldı; web/PDF araçları korundu. Katalog 115'ten
68 etkin beceriye indi. 10.000 token bütçesiyle yeni gerçek Codex/Spark oturumunda
beceri açıklamalarının kısaltılması uyarısı oluşmadı. Diğer projelerin eklenti
ayarları değişmedi. Devam `.cmd` dosyasındaki artık mevcut olmayan profil seçimi
kaldırıldı; komut bu klasörün ayarlarını doğrudan yükler. Eski açık oturuma yeni
ayarları geçirmek için bir kez yeniden başlatmak gerekir.

Kaynak: [Codex beceri kataloğu bütçesi](https://learn.chatgpt.com/docs/config-file/config-reference#skillsmax_context_tokens).

Model, kullanıcıdaki mevcut seçimi devralır; bu projede muhakeme seviyesi `high`.
Kişisel uygulama bağlayıcıları kapalıdır. Context7 güncel kütüphane belgeleri için
korundu. Yeni bir tasarım aboneliği, ücretli servis veya yinelenen beceri kurulmadı.
Bu altyapı tek başına Claude'dan üstün kalite garantisi değildir: avantajı proje
kuralları, hesap ayrımı ve tekrar çalıştırılabilir doğrulamadır.

## Günlük komutlar

| Komut | Amaç |
|---|---|
| `npm run dev` | Astro geliştirme ortamı |
| `npm run onizle` | Derlenmiş siteyi 4399 portunda inceleme |
| `npm run dogrula:codex` | Tip kontrolü, mevcut denetimler/build, tarayıcı ve kural testleri |
| `npm run test:web` | Mevcut `dist` üzerinde mobil/masaüstü senaryoları |
| `npm run test:ihtida` | Yerel VM ve PDF üretiminde ihtida sözleşme/akış senaryoları |
| `npm run test:veli-eposta` | Dil tercihi, otomatik kayıt aktarımı ve cuma e-postası |
| `npm run test:web:rapor` | Yerel HTML test raporunu açma |
| `npm run test:kurallar` | Yalnız demo Firestore üzerinde 17 güvenlik senaryosu |
| `npm run codex:kontrol` | Codex ayar/beceri keşfi ve gerçek yerel MCP bağlantı denemesi |

`test:web` ve `codex:kontrol` aynı 4401 portunu kullanır: eşzamanlı çalıştırmayın.
İkisi de önceden `npm run build` gerektirir. Test sunucusu, zaten açık olan 4399
önizlemesini durdurmaz veya yeniden kullanmaz; Astro'nun programatik API'siyle açılır.

Toplu doğrulama web hatası olsa da bağımsız backend testlerini çalıştırır.
Build/ön denetim başarısızsa eski çıktıyı geçerli sanmamak için web testi atlanır.
Hiçbir doğrulama komutu `firebase:kurallar`, `git push` veya form gönderimi çağırmaz.

## Kurulum sırasındaki kalite durumu (8–9 Eylül 2026)

- Mevcut site build'i: 867 sayfa; panel, CMS, site ve EK-9 denetimleri çalıştırıldı.
- Astro tip kontrolü: hata/uyarı yok; mevcut iyileştirme ipuçları ayrıca raporlanır.
- Web işlev testleri: 12/12 geçti — TR/FR/EN, masaüstü ve mobil; menü/dil seçimi,
  açık/koyu tema kalıcılığı, temel sayfalar, ana sayfa JS hataları ve yatay taşma.
- İhtida: tam adres, posta/şahit seçimleri, sürüm koruması, imza teyidi, belge hazırlama ekranı, altı sayfalık PDF, admin teslim durumu ve paket onayı. 9 Eylül son doğrulaması: toplam web testi 48/48; ayrı ihtida/PDF sözleşme ve akış testleri 16/16. Otomasyon ve canlı yayın sınırı: `docs/IHTIDA-OTOMASYON-v25.md`.
- Firestore güvenlik testleri: 17/17 geçti — anonim erişim, öğrenci/aile yalıtımı,
  rol yükseltme yasağı, hoca yetkileri, gizli notlar, taslaklar, sorgular ve mesajlar.
- Erişilebilirlik: 6/6 senaryo geçti. İlk kurulumdaki `color-contrast` bulguları,
  tema geçişi tamamlanmadan ara renklerin ölçülmesinden kaynaklanıyordu.
  Test sonlu animasyonların tamamlanmasını bekler; renkler ve axe kuralları korunur.
- Dar ekran: 6/6 ek senaryo geçti; hizmet sayfaları 640/768/1024 px,
  Fransızca kütüphane 320/360/390 px, namaz ve anma sayfaları 320 px.

8 Eylül akşamındaki hata avında tablet/mobil taşmaları düzeltildi. Tip kontrolü
üretilmiş Playwright raporlarını ve yerel test çıktılarını artık taramaz.
Ayrıntılar ve önceki iki oturumun özeti: `docs/HATA-AVI-2026-09-08.md`.

Otomatik axe testi erişilebilirlik sertifikası değildir. Chrome motorundaki mobil
emülasyon gerçek iPhone/Safari veya Android cihaz testi yerine geçmez.

## Dernek hesabı ile çalışma

GitHub yalnız `ulucamii2026`; Firebase yalnız `ulucamii2026@gmail.com` ve
`ulucamii-portal`. İkisi de 8 Eylül'de salt okunur kimlik/erişim kontrolünden geçti.
Bu, her kaynağa ve her işleme yetki bulunduğu anlamına gelmez.

```powershell
.\scripts\gh-cami.ps1 api user --jq .login
.\scripts\gh-cami.ps1 repo view --json nameWithOwner
.\scripts\firebase-cami.ps1 projects:list
```

GitHub sarmalayıcısı kayıtlı dernek token'ını yalnız süreç belleğinde seçer, gerçek
hesabı doğrular ve çıkışta ortamı eski hâline getirir. `gh auth switch` çalıştırmaz.
Firebase sarmalayıcısı her komuta açık hesap/proje ekler; ortam token'ı/ADC'nin
hesap seçimini ezmesini önler. Bu betikler sır kasası veya yetkilendirme sandbox'ı
değildir; dışarıya yazan komutlar ancak kullanıcı o işlemi istediğinde çağrılır.

`npm run firebase:kurallar` artık dernek sarmalayıcısından geçer, ancak hâlâ
**canlı dağıtım** yapar. Geliştirme veya test komutu olarak kullanmayın.
Hesap süresi dolarsa yalnız dernek hesabını yeniden yetkilendirin; kişisel hesaba
sessiz geçiş yoktur. Parola/token değerlerini terminale, Git'e veya rehbere yazmayın.

## Araç ve beceri seti

| İş | Tercih edilen araç |
|---|---|
| Site işleyişi ve hesap sınırı | `ulucamii-site` + proje `AGENTS.md` |
| Tema, kullanılabilirlik, tasarım | Mevcut `impeccable` becerisi |
| Astro/Preact/Tailwind/Firebase API bilgisi | Context7 ve resmî belgeler |
| Yerel etkileşim ve ekran incelemesi | `ulucamii_browser` Playwright MCP |
| Tekrarlanabilir tarayıcı kontrolü | Playwright Test + axe |
| Firestore yetki kontrolü | Firebase Rules Unit Testing + yerel emülatör |
| GitHub/Firebase yönetimi | Dernek hesaplı CLI sarmalayıcıları |
| Afiş, PDF veya görsel | İşin gerektirdiği mevcut belge/görsel becerisi |

Playwright MCP sürümü proje bağımlılıklarında sabittir; `npx ...@latest` her
oturumda çalıştırılmaz. Tarayıcı başsız ve geçici profillidir; kişisel çerezleri
kullanmaz. Yalnız localhost'ta 4321/4399/4401 portlarına HTTP sayfa istekleri açılır;
servis çalışanları kapatılır. MCP'nin yerleşik origin süzgeci yönlendirmeleri garanti
altına almaz ve işletim sistemi seviyesinde ağ güvenlik duvarı değildir; genel Node
kodu/WebSocket gibi başka yollar için ayrıca ajan kapsam kuralları geçerlidir.
Otomatik web testlerinin ayrı istek süzgeci ve WebSocket engeli vardır.

`codex:kontrol` canlı MCP üzerinden 24 aracın keşfini, yerel sayfanın açılmasını ve
izin listesi dışındaki ayrı bir yerel sunucuya isteğin ulaşmadığını doğruladı.
Windows'ta tam Chrome yürütücüsü beklemede kaldığından kurulu Chromium Headless Shell
seçildi; sandbox'ı kapatan bir bayrak eklenmedi.

## Firebase test yalıtımı

Canlı `firebase.json` ve `.firebaserc` korunur. Ayrı `firebase.emulators.json`
kullanılır: Firestore 8185, hub 4485, günlük servisi 4585; localhost bağlantısı.
Emülatörün ek WebSocket portu 9150 de çakışma açısından denetlenir.

Kural testi başlamadan `FIRESTORE_EMULATOR_HOST=127.0.0.1:8185` ve
`GCLOUD_PROJECT=demo-ulucamii` zorunlu tutulur. Demo projesi dışında çalışmayı
reddeder. Dolu test portu görülürse başka süreci kapatmaz veya mevcut emülatörü
temizlemez. Üretilen tüm kişiler sentetiktir ve e-posta alanı `example.test`tir.
Test sonunda emülatör kapanır; veri dışa aktarımı veya üretime senkronizasyon yoktur.

Bu testler gerçek Firebase giriş akışını, OAuth ekranını, GAS e-posta/Drive
işlemlerini veya tüm portal ekranlarını uçtan uca doğrulamaz. Bunlar sonraki işlerde
ayrı sahte servis/test hesabı senaryolarıyla ele alınmalı. Eski `portal-test.py`
canlı kaynak kullanabildiğinden varsayılan zincire alınmadı.

## Kurulum ve taşınabilirlik

Bu bilgisayarda Node 24.19.0, npm 11.17.0, Firebase CLI 15.28.2 ve GitHub CLI
2.98.0 doğrulandı. Eklenen geliştirme bağımlılıkları sabitlendi:
Playwright Test 1.63.0, Playwright MCP 0.0.80, axe 4.13.0,
Firebase Rules Unit Testing 5.0.2. Chromium test tarayıcısı indirildi.

Yeni makinede:

```powershell
npm ci
npx --no-install playwright install chromium
```

Ayrıca Firebase CLI, GitHub CLI ve Java 21+ gerekir. Bu makinede mevcut Java 17'yi
değiştirmemek için Temurin JRE 21.0.12.1+1 taşınabilir kuruldu:
`C:\Users\ridva\.codex\tools\temurin-jre-21\jdk-21.0.12.1+1-jre`.
İndirilen arşivin SHA256 değeri Adoptium kaydıyla eşleştirildi. Sistem PATH/JAVA_HOME
değiştirilmedi; Java yalnız emülatörün çocuk sürecine seçilir.

Farklı konumlarda `ULUCAMII_JAVA_HOME`, `ULUCAMII_FIREBASE_CLI` (firebase.js dosyası)
ve `ULUCAMII_CODEX_BIN` (Codex yürütülebilir dosyası) kullanılabilir.
`.codex/config.toml` içindeki proje yolları da yeni konuma göre güncellenmelidir.
Bu yardımcılar öncelikle Rıdvan'ın Windows ortamı için doğrulandı.

## Makine kapsamındaki küçük değişiklikler

- `C:\Users\ridva\.codex\config.toml`: yalnız bu depo için güven kaydı eklendi.
- `C:\Users\ridva\.codex\hooks\router-guard.ps1` ve `rogue-process-guard.ps1`:
  cami klasörü/altında erken çıkış eklendi. Böylece burada oturum açılması başka
  projelerin süreçlerine, `D:\tmp` dosyalarına veya Claude ayarlarına müdahale etmez.
  Diğer çalışma dizinlerindeki eski davranışları değiştirilmedi.
- Kanca yedekleri: `C:\Users\ridva\.codex\yedek\ulucamii-20260908`.
  Gizli bilgi denetimi ve diğer yaşam döngüsü kancaları korunmuştur.

Yalnız proje `hooks.state` ayarını değiştirmek canlı `hooks/list` kontrolünde
beklenen sonucu vermedi; bu yüzden yukarıdaki açık klasör sınırı kullanıldı.

## Sonraki geliştirmeler için sıra

1. Yeni değişikliklerde tema geçişini bekleyen kontrast ve dar ekran testlerini korumak.
2. İstenen içerik/tema değişikliğine göre ilgili sayfa testlerini genişletmek.
3. Portal ekranları ve GAS formları için gerçek gönderim yapmayan uçtan uca senaryolar.
4. İhtiyaç doğarsa Safari/Firefox, performans ve CI kontrollerini eklemek.
5. Yayın istendiğinde dernek hesabı, diff ve test sonucunu yeniden doğrulamak.

## Başvurulan belgeler

- [Codex proje yönergeleri](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [Astro programatik API](https://docs.astro.build/en/reference/programmatic-reference/)
- [Playwright test sunucusu](https://playwright.dev/docs/test-webserver)
- [Firebase güvenlik kuralları testleri](https://firebase.google.com/docs/rules/unit-tests)
- [Firestore emülatörü](https://firebase.google.com/docs/emulator-suite/connect_firestore)

Bu tarihteki genel Claude/Codex kullanım incelemesi ayrıca
`C:\Users\ridva\Documents\CLI-Inceleme\2026-09-08\RAPOR.md` içindedir.
O raporun envanteri bu proje kurulumundan önceki anlık görüntüdür; sürekli izleyici kurulmadı.
