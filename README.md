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

## Kur'an kursu ders materyalleri (6 Eyl 2026)
- Sayfa: `/tr/ders-materyalleri/` (+ `/fr/supports-de-cours/`, `/en/lesson-materials/`; kısa adres `ulucamii.be/materyal`) — `src/sayfalar/DersMateryalleri.astro` + kart bileşeni `src/components/DersGunuKarti.astro`, yol anahtarı `dersmateryalleri`, üst menü «Eğitim». Kurs sayfasında yan kart, yıllık plan gün kartlarında `#g-<tarih>` bağlantısı.
- Düzen: «Bu haftanın dersleri» (bu haftadan itibaren yayımlanan günler; yoksa son ders günü) → alan filtresi (JS) → «Önceki ders günleri» ay ay katlanır (`<details>`) → «Kalıcı materyaller». «Sıradaki ders günü» satırı yıllık plandan gelir. Site her gece yeniden yayımlandığı için bugün/hafta hesabı derleme anındadır.
- **Günlük belgeler** — veri `src/data/ders-materyalleri.json` (gün başına plan PDF + 3 sunum: sesli .pptx ve sessiz PDF hâli + isteğe bağlı `ekler[]`; `donem` kökte). **Elle yazılmaz.** Dosyalar depoda **değil**: GitHub Releases `ders-<tarih>` sürüm ekleri (`…/releases/download/ders-<tarih>/<dosya>`).
- **Kalıcı materyaller** (güne bağlı olmayan ezber kartı, alıştırma, tablo, rehber, sınav…) — içerik koleksiyonu `src/content/materyaller/*.md`, Sveltia'da «Ders Materyalleri (kalıcı)»: küçük dosya (≤ 15 MB) `dosya` ile `public/media/materyaller/` altına yüklenir, büyük dosya Releases'a konup `link` verilir. Şema `src/content.config.ts`, CMS `public/admin/icerik/config.yml` (`npm run denetim:cms`).
- Yayın (kurs projesi): `"C:/Users/ridva/AppData/Local/Programs/Python/Python314/python.exe" D:\ulu-camii-kuran-kursu\scripts\site-materyal-yayinla.py <gün-klasörü>` — sürümde aynı ad/boyut/tarihle duran dosyayı atlar (`--zorla` hepsini yükler); sessiz PDF'ler `scripts\sunum-pdf.ps1 <gün>` ile (PowerPoint COM) üretilir; ekler `dersler/<gün>/ekler/` (ASCII ad, `basliklar.json`). Sonra burada `npm run check && npx astro build`, commit + push.
- Denetim: `scripts/site-denetim.mjs` JSON'u doğrular (tarih/etiket/url/boyut, tekrar eden gün); dış bağlantı denetimi sürüm eklerini yoklar.
- Kural: materyallerde hoca, öğrenci ve veli adı, telefon, e-posta yer almaz (depo ve sürüm ekleri herkese açık); yayın öncesi PDF gizlilik taraması yapılır.

## Veli portalı ve hoca ekranı (6 Eyl 2026)
- Sayfalar: veli portalı `/tr/veli-portali/` (+ `/fr/portail-parents/`, `/en/parents-portal/`; `src/sayfalar/Veli.astro` + `src/scripts/veli-portali.ts`, metinler `src/i18n/veli.ts`), hoca ekranı `/hoca/` (yalnız TR; `src/pages/hoca/index.astro` + `src/scripts/hoca-ekrani.ts`). İkisi de `noindex`; Firebase yalnız bu sayfalarda dinamik import ile yüklenir (`src/lib/firebase.ts`, yapılandırma herkese açık).
- Altyapı: Firebase projesi `ulucamii-portal` (dernek hesabı; Firestore europe-west1, Spark planı, Functions/Storage yok). Kimlik: Firebase Authentication — veli e-postasına tek kullanımlık bağlantı → veli şifresini belirler; sonra e-posta + şifre. Kimlik numarasıyla giriş yoktur (hukuki karar, 30 Ağu 2026).
- Güvenlik: `firebase/firestore.rules` (dağıtım `npm run firebase:kurallar`). Hoca = `hocalar/{uid}` belgesi; veli = `aileler/{e-posta}` belgesi ve yalnız kendi `ogrenciler` listesindeki kayıtlar. Veli sorguları `where('ref','==',…)` / `yayin==true` / `veliyeGorunur==true` ile kurulur (kural kanıtlanabilir olsun); bileşik indeks yok.
- Koleksiyonlar: `ogrenciler/{ref}`, `aileler/{e-posta}`, `yoklama/{ref}_{tarih}`, `ilerleme/{ref}`, `degerlendirme`, `notlar`, `odevler/{hafta ilk günü}`, `duyurular`, `bildirimler` (veli → hoca: mazeret/iletişim/soru), `hocalar`, `ayarlar/portal` (dönem, kayıt defteri anahtarı — yalnız hoca okur).
- Kişisel veri sınırı: portalda ad, soyad, kayıt referansı, grup, veli e-postası, dil ve ders kayıtları bulunur; **kimlik numarası, adres, telefon, doğum tarihi, fotoğraf girilmez.** Öğrenci verisi depoya girmez (Firestore'da durur).
- Yönetim (Claude): `~/.claude/skills/ulucamii-site/scripts/portal-yonetim.py` — `ice-aktar` (kayıt defteri → Firestore), `hoca-ekle`, `ayar`, `listele`, `sil`. Hoca ekranında da «Kayıt defterinden yenile» ve «Davet gönder» var.
- Gizlilik sayfası (3 dil) portal bölümü canlı duruma göre yazıldı: Firestore verisi Belçika'da, kimlik doğrulama hizmeti Google'ın ABD veri merkezlerinde (DPF + SCC), saklama 2 yıl, hesap silme info@ulucamii.be.

## Apps Script (kayıt + ihtida arka ucu)
- Kaynak: `scripts/apps-script/ulucamii-Kod-vNN.gs` — canlı sürüm bu depodaki en yüksek numaralı dosyadır (Ağu 2026 sonu itibarıyla v14: e-posta kimliği, müfredat eki, ders kitapları bilgisi).
- Dağıtım Apps Script web editöründen yapılır, her seferinde **"Nouvelle version"** seçilir (ayrıntı: `scripts/apps-script/README.md`).
