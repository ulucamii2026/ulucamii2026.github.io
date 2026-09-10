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

