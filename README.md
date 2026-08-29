# Marche-en-Famenne Ulu Camii — Web Sitesi

Resmî web sitesi: **https://ulucamii2026.github.io** · Association Diyanet Mosquée Ulu Camii de Marche en Famenne (ASBL, KBO 0421.900.807)

## Teknoloji
- [Astro 7](https://astro.build) (statik), Tailwind CSS v4, Preact adaları
- İçerik: Markdown/YAML (`src/content/`), **Sveltia CMS** yönetim paneli: `/admin/`
- Yayın: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`)
- Namaz vakitleri: Diyanet (Marche-en-Famenne, ilçe 11890) — `scripts/namaz-vakitleri.mjs`, 1 ve 15'inde otomatik yenilenir
- Diller: Türkçe (`/tr/`) ve Fransızca (`/fr/`)

## Geliştirme
```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # dist/
```

## İçerik yönetimi (yönetici)
1. `https://ulucamii2026.github.io/admin/` adresini açın.
2. **Sign in with Token** → GitHub'da *fine-grained personal access token* oluşturun: yalnız bu depo, izin **Contents: Read and write**.
3. Duyuru / etkinlik / sayfa metni / ayarları düzenleyin; kaydedince site 1-2 dakikada yeniden yayınlanır.

## Klasörler
```
src/content/duyurular/{tr,fr}/     duyurular
src/content/etkinlikler/{tr,fr}/   etkinlikler ve afişler
src/content/sayfalar/{tr,fr}/      uzun sayfa metinleri
src/content/ayarlar/site.yaml      künye, telefon, IBAN, konsolosluk
src/content/galeri/galeri.yaml     galeri listesi
public/media/                      görseller (WebP)
```

## Kur'an kursu müfredatı ve yıllık plan (29 Ağu 2026)
- Sayfalar: `/tr/kuran-kursu-mufredati/` (+ `/fr/programme-ecole-coranique/`, `/en/quran-school-curriculum/`) ve `/tr/yillik-ders-plani/` (+ FR/EN karşılıkları).
- Belgeler: `docs/kuran-kursu-mufredati-2026-2027.md`, `docs/kuran-kursu-yillik-plan-ozetli-2026-2027.md`, `public/belgeler/kuran-kursu/` (yazdırılabilir HTML + A4 PDF).
- Üretim betikleri (`mufredat-uret.py`, `yillik-plan-cikar.py` vb.) bu depoda **değil**, `D:\app\marche-cami-sitesi\mufredat\` altında tutuluyor; buradaki içerik dosyaları onların çıktısıdır.

## Apps Script (kayıt + ihtida arka ucu)
- Kaynak: `scripts/apps-script/ulucamii-Kod-vNN.gs` — canlı sürüm bu depodaki en yüksek numaralı dosyadır (Ağu 2026 sonu itibarıyla v14: e-posta kimliği, müfredat eki, ders kitapları bilgisi).
- Dağıtım Apps Script web editöründen yapılır, her seferinde **"Nouvelle version"** seçilir (ayrıntı: `scripts/apps-script/README.md`).
