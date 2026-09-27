# Eğitim platformu — egitim.ulucamii.be

Karar tarihi: 26 Eylül 2026 (Rıdvan: «eğitim işleri için egitim.ulucamii.be adlı ayrı bir platforma geçelim»).
Durum: **planlandı**; iskelet Faz 1f'de. Her canlı adım (Hosting sitesi, DNS, Auth alanı) ayrıca onaylanır.
Ana plan §3.1 ve §4: [2026-09-26-ezber-kilimi-ana-plan.md](superpowers/plans/2026-09-26-ezber-kilimi-ana-plan.md).
İlk bölüm: [Ezber Kilimi](EZBER-KILIMI.md).

## Kararlar

| Konu | Karar |
|---|---|
| Adres | `egitim.ulucamii.be` |
| Barındırma | Firebase Hosting, proje `ulucamii-portal` (Spark planı: Cloud Functions yok, Hosting ~360 MB/gün) |
| Kod | Aynı depoda ikinci Astro uygulaması `egitim/` (kendi `astro.config.mjs`, `output: 'static'`); ortak kod `@ortak/*` takma adıyla ana `src/`'den; kök `node_modules` ortak |
| Ses dosyaları | Ana siteden (ulucamii.be, GitHub Pages) verilir; platform yalnız HTML, JS, SVG ve font taşır |
| Giriş | Platformda `authDomain: 'egitim.ulucamii.be'` (Hosting `/__/auth` yardımcısı; Google girişi kendi alan adımızda, Safari/iPhone uyumlu). Ana site eski ayarla sürer |
| Güvenlik başlıkları | Hosting'de CSP, HSTS, `X-Content-Type-Options` |
| Diller | tr, fr, en, nl, de — ana sitenin `yollar` + `Record<Dil, …>` düzeni ve [DIL-NL-DE.md](DIL-NL-DE.md) kuralları |
| Tasarım | Yön «Çini Panosu» (Faz 1e, 27 Eylül 2026): beyaz sırlı karo, derz çizgisi, kurs yeşili `#134420` kuşak; firuze ve altın yalnız ezber basamaklarında; gölge yok, yalnız vektör (Codex çizimleri). Arapça «Ulu Nesih» (Scheherazade New 4.500 alt kümesi, Türk usulü yazım), Latin Atkinson Hyperlegible Next. Tasarım sistemi [`egitim/DESIGN.md`](../egitim/DESIGN.md); karar, taslaklar ve Rıdvan'ın seçenekleri: [Faz 1e belgesi](superpowers/plans/2026-09-27-ezber-kilimi-faz-1e-tasarim.md) |

## Kademeli taşıma (Faz 4, Ocak–Mart 2027; her bölüm ayrı yayın)

1. Veli portalı + hoca ekranı
2. Kur'an kursu sayfaları (müfredat, yıllık plan, materyaller, günlük)
3. Seviye testi + yetişkin eğitimi
4. Muhtedi eğitimi, vaazlar, irşat, UİP

Her bölümde: ulucamii.be'deki eski adreslerde sorgu ve hash'i koruyan yönlendirme sayfaları (ziyaret sayacı **yok**);
yetişkin kitabındaki basılı `ulucamii.be/e/<kod>/` kare kodları sonsuza dek çalışır; Apps Script kaynak denetimi yeni
alan adına göre güncellenir; veliye bir kez yeniden giriş duyurusu (onayla); yayın `YAYIN-KAYITLARI.md`'ye işlenir.

## Taşınmayanlar — bağlayıcı

- **İhtida** (sayfa, form, EK-9, EK-10) ulucamii.be'de kalır.
- **`ihtida.ulucamii.be`'ye dokunulmaz.** Rıdvan onu Müşavir Beye gösterip onay alacak (26 Eylül 2026:
  «şimdilik oraya dokunma»).
