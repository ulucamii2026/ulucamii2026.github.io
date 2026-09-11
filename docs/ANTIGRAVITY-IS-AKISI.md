# Antigravity İş Akışı ve Tercihler

## 10 Eylül 2026 Kullanıcı Tercihleri

- **Görev Dağılımı ve Kalıcı Tercih:** Ana koordinatör Codex'tir; Anti-Gravity (`agy`) ise üretim işçisidir. Kullanıcının kalıcı tercihi doğrultusunda bu projede sonraki işlerde asıl üretici Anti-Gravity CLI (`agy`) olacaktır.
- **CLI Kullanım Örnekleri:**
  Geçerli PowerShell örnekleri:
  ```powershell
  agy --mode plan --effort high --print-timeout 8m --print "Yalnız incele ve raporla."
  agy --effort high --print-timeout 8m --print "Belirtilen dosyalarda değişikliği uygula."
  ```
- **Sahiplik ve Güvenlik:** 
  - Paralel dosya sahipliği korunur. 
  - Kişisel hesap/sır verileri ve canlı işlem sınırları ihlal edilmez.
- **Araç ve Limit Durumu (Mevcut Oturum):**
  - Yerleşik görsel üretimi bu oturumda gerçek anlamda çalıştı.
  - Ses üretimi: Yerleşik doğrudan TTS aracı yok anlamındadır; betik çalıştıramaz demek değildir.
  - Haftalık kalan limit bağımsız olarak doğrulanmadı.

## Altyapı Düzenlemesi ve Verimlilik (10 Eylül 2026)

- **Beceri Filtreleme (`.agents/skills.json`):** Küresel ortamdaki biyoloji, genetik, araç alım-satım ve ağır bulut veri hattı gibi bu projeyle ilgisiz 46 beceri kategorisi dışlandı. Böylece bağlam penceresi (context window) şişmesi engellendi ve web/PDF/tasarım becerileri için tam alan açıldı.
- **Proje Kuralları:** `AGENTS.md` doğrudan kök dizinde tüm Anti-Gravity oturumları tarafından tanınır; hesap ve canlı yayın sınırları güvencededir.
- **Sağlık Kontrolü:** Proje ortamının Anti-Gravity CLI ile uyumluluğu `npm run agy:kontrol` komutu ile anlık olarak doğrulanabilir.

## Tasarım, İkon ve Kalıcı Tarayıcı Altyapısı (11 Eylül 2026)

- **Yeni Tasarım ve Arayüz Becerileri:**
  - `impeccable` (v4.3.1): `~/.gemini/config/skills/impeccable` dizininde etkin. Tipografi, kontrast, ritim ve dokunsal kart tasarımlarında temel zanaat rehberi.
  - `better-icons`: Global CLI (`better-icons`) ve `~/.gemini/config/skills/better-icons` becerisi aktif. Emojiler yerine doğrudan Lucide vb. saf SVG ikonlar çekilerek kullanılır.
  - `stitch`: Google Stitch MCP sunucusu hazır ve çalışır durumda.
  - `figma`: `figma-ui-mcp` (port 38451) yapılandırıldı.
- **Kalıcı Tarayıcı Profili (Higgsfield ve Oturumlar):**
  - Playwright MCP'nin her oturumda profil sıfırlama sorunu giderildi. `~/.gemini/config/mcp_config.json` içinde `--user-data-dir C:\Users\ridva\AppData\Local\ms-playwright-mcp\mcp-chrome-permanent` bayrağı tanımlandı.
  - Higgsfield Ultimate hesabı (`ridvankayahan0032@gmail.com`) kalıcı profile bağlandı; oturum kapanıp açılsa da tekrar giriş istemez.
- **Resmî Duyuru ve Görsel Tasarım Standardı:**
  - Diyanet idari/istihdam sınavı ve resmî duyurularda soyut AI görseli yerine `impeccable` ilkeleriyle hazırlanan kurumsal bilgi afişi, şartlar rozeti ve dokunsal SVG indirme kartları esastır.
  - Higgsfield üretimi sanatsal, atmosferik veya etkinlik odaklı afiş ihtiyaçlarında değerlendirilir.
