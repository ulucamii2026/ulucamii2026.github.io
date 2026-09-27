# Ezber Kilimi Faz 1f — `egitim/` Astro iskeleti

**Tarih:** 27 Eylül 2026. **Durum:** iskelet yerelde bitti; aynı akşam onaylı planla **yayında**
(https://egitim.ulucamii.be; Hosting, alan adı ve DNS: [YAYIN-KAYITLARI](../../YAYIN-KAYITLARI.md) «27 Eylül 2026 (2)»).
Auth alanı ayrı onaylı canlı adımdır (Faz 3). Barındırma yapılandırması sonradan eklendi (`firebase.json` Hosting
bloğu; `.firebaserc` değişmedi).

**Şartname:** [Ana plan](2026-09-26-ezber-kilimi-ana-plan.md) §3.1 ve §4 Faz 1f; görünüm
[`egitim/DESIGN.md`](../../../egitim/DESIGN.md) ve onaylı taslak `egitim/docs/taslaklar/giris.html`
([Faz 1e belgesi](2026-09-27-ezber-kilimi-faz-1e-tasarim.md)); platform kararları
[`docs/EGITIM-PLATFORMU.md`](../../EGITIM-PLATFORMU.md).

## Ne kuruldu

| Ne | Yer |
|---|---|
| İkinci Astro uygulaması: `site: https://egitim.ulucamii.be`, statik, sonda eğik çizgi, stil ve betik hep dış dosya (`inlineStylesheets: 'never'`, `assetsInlineLimit: 0`), `@ortak/*` → kök `src/` | `egitim/astro.config.mjs`, `egitim/tsconfig.json` |
| Sayfalar: Ezber Kilimi girişi beş dilde (`/tr/ /fr/ /en/ /nl/ /de/`); kök `/` dil yönlendirmesi (bu platformda son seçilen dil → tarayıcı dili → İngilizce; JS kapalıysa Türkçe); 404 beş dilde yol gösterir | `egitim/src/pages/` |
| Bileşenler: üst bilgi (logo, ana siteye dönüş, dil seçici, bordür), pano, dört basamak, şeritler ve madde satırı, örnek kilim + lejant, kaynaklar, alt bilgi | `egitim/src/components/` |
| Pano yerleşimi (saf işlev; 13 × 14, kenar suyu kilimdeki gibi saat yönünde) | `egitim/src/lib/pano.ts` |
| Davranış: pano kuşağı + dolaşan tabindex + ok tuşları; telefonda katlı şerit listeleri ve `#m-…` bağlantısında açılma; çal düğmeleri; dil tercihi | `egitim/src/scripts/{pano,seritler,calar,dil}.ts` |
| Stil (taslaktaki jetonlar, `DESIGN.md` ile birebir) | `egitim/src/styles/cini.css` |
| Arayüz metinleri beş dilde (`Record<Dil, …>`; nl «u», de «Sie») | `egitim/src/i18n/metinler.ts` |
| Fransız tipografisi bütün FR sayfada (ortak katalog adları dahil) | `egitim/src/middleware.ts` |
| Kurumsal kimlik (kurs adı, hukuki satır, iletişim: adres · info@ulucamii.be · cami hattı · web) | `egitim/src/lib/kimlik.ts` ← `src/data/kurumsal-kimlik.json` |

Veri derleme anında ortak koddan gelir: katalog (`src/lib/ezber/katalog.ts`), yıllık plan hedefleri
(`sinifHedefleri`), motifler, kilim çizici ve lejant (`src/lib/ezber/kilim.ts`), basamak adları. Ses dosyaları
`https://ulucamii.be/media/ses/…` adresinden çalar (Hosting ses taşımaz; kaynaklar Diyanet kayıtları).

**Komutlar (depo kökünden):** `npm run egitim:dev` · `npm run egitim:build` (astro check + derleme,
çıktı `egitim/dist`, Git dışı) · `npm run egitim:onizle` (127.0.0.1:4402) · `npm run test:egitim` (birim + ekran).
`npm run dogrula:codex` ikisini de çalıştırır.

## Taslaktan bilinçli farklar

1. **Satır içi stil yok** (sıkı CSP'ye hazırlık): pano hücrelerinin yeri `r1…r14` / `c1…c13` sınıflarıyla, Amme
   etiketi `grid-row-end: span 5`, Kalıcı basamağının çerçeve kalınlığı sınıfla.
2. **«Sesli» rozeti yerine kare çal düğmesi** (DESIGN.md «Çal düğmesi»nin liste boyu, 2.75rem): karo yüzlü, bağlantı
   yeşili oynat simgesi; çalarken kurs yeşili ve duraklat simgesi, maddenin rozet karosunda sır yayılır. Erişilebilir
   adı «Dinle: Fâtiha Sûresi» ↔ «Durdur: …». Aynı anda tek ses; Eûzü–Besmele iki parçası sırayla çalar; ses
   açılamazsa durum satırı sayfa dilinde söyler.
3. **Basamak metinleri onaylı eşiklere göre** (`docs/EZBER-KILIMI.md`: sertifika tümü ≥ Pekişti, altın kenar tümü
   Kalıcı). Taslakta Kalıcı kartı «Ezber Sertifikası bu basamakta verilir» diyordu; üretimde Pekişti kartı sertifikayı,
   Kalıcı kartı altın kenarı söyler. Taslak da düzeltildi ve yeniden üretildi (`derle.mjs`).
4. **Örnek kilimde ad yok** (taslakta uydurma bir ad vardı); kesikli «Örnek veri» etiketi durur.
5. **Kilim madde başlıkları «Ad, basamak»** (önce «Ad — basamak»): ekran okuyucu uzun çizgiyi ayrıca seslendirmesin.
   Ortak çizici olduğundan ana sitedeki veli kilimine de geçer (bir sonraki site yayınında).

## Doğrulama (27 Eylül 2026)

- `npm run egitim:build`: astro check 31 dosya, 0 hata; 7 sayfa. Sayfalarda satır içi stil 0; tek satır içi betik kök
  yönlendirme sayfasında (aşağıda). Sayılar her dilde: 81 madde karosu (13'ü kenar suyu), 33 bordür, 4 köşe, 7 sıra,
  1 Amme etiketi, 52 boş hücre (toplam 182); listede 81 madde, 27 çal düğmesi; FR sayfada düz boşluklu `: ; ! ?` 0.
- `node --test tests/egitim/pano.test.mjs`: 9/9 (ızgara tam ve çakışmasız, sayılar, okuma sırası ve saat yönü,
  bordür yönleri, beş dilde dolu metinler, FR tipografisinin tekrar uygulanınca değişmemesi, basamak eşik metinleri,
  iletişim bloğunun kurumsal kimlikten gelmesi).
- `npx playwright test -c playwright.egitim.config.mjs`: 45 geçti, 1 bilerek atlandı (kök yönlendirmesi yalnız
  masaüstünde sınanır). Dış ağ kesik; beş dilde pano/liste bağları, çal düğmeleri, klavye, `#m-…` açılması, iki temada
  axe (wcag2a/aa, 21a/aa), 390 ve 1440'ta yatay taşma yok, telefonda katlı listeler, azaltılmış hareket, 404.
- Görsel inceleme bir tur: 1440 ve 390, açık ve koyu; hedef madde, çalan düğme ve üzerine gelme hâlleri.
- Kök site: `npm run build` 1890 sayfa. `src/styles/global.css`'e `@source not "../../egitim"` eklendi; kök CSS'ten
  yalnız egitim taslaklarındaki sözcüklerden sızmış, kökte sınıf olarak hiç kullanılmayan üç Tailwind yardımcısı düştü
  (görünürlük, yığın yalıtımı ve rakam biçimi yardımcıları; kuralların listesi öncesi/sonrası karşılaştırmasıyla
  çıkarıldı). Dikkat: Tailwind `docs/` altındaki Markdown'u da tarar; bir belgeye yardımcı sınıf adı yazmak o sınıfı
  kök CSS'e geri getirir. Kök `tsconfig.json` `egitim`'i dışlar (kök `astro check` ikinci uygulamayı taramaz).

## Açık kalemler (sonraki adımlar)

- **Canlıya alma (27 Eylül 2026, Rıdvan: «egitim.ulucamii.be canlıya alınmasını planla, devam et»):** barındırma
  yapılandırması ve güvenlik başlıkları (`firebase.json`), kök yönlendirme dış betiğe alındı (CSP'de özet gerekmedi),
  simgeler ve beş dilde paylaşım kartı, site haritası ve `robots.txt` eklendi — ayrıntı
  [EGITIM-PLATFORMU.md](../../EGITIM-PLATFORMU.md) «Barındırma ve yayın». Hosting sitesi, alan adı ve DNS adımlarının
  sonucu [YAYIN-KAYITLARI.md](../../YAYIN-KAYITLARI.md)'de. Auth alanı (`authDomain`) giriş gerektiren ilk bölümle (Faz 3).
- **Madde sayfaları** (Arapça metin, harf harf Diyanet denetimi, çalar, «namazda nerede okunur») ve hoca görünümü
  Faz 2; taslakları `egitim/docs/taslaklar/{madde,hoca}.html`.
