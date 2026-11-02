---
name: İlim Yolu — Kilim (egitim.ulucamii.be)
description: Ulu Camii'nin öğrenme platformu İlim Yolu; Anadolu kilimi dilinde (yün krem zemin, kök boya kırmızısı, koyu yeşil, safran süs), basamaklı dik açılı motifler, ilerleme alttan yukarı dokunan kilim.
colors:
  yun: "#F6EEDF"
  yuz: "#FFFAF0"
  murekkep: "#2B1B14"
  murekkep-2: "#61493C"
  kokboya: "#9B2C22"
  kokboya-2: "#84231B"
  kokboya-soluk: "#F3DDD3"
  yesil: "#1E4D3B"
  yesil-2: "#173C2E"
  yesil-soluk: "#DCE8DF"
  safran: "#D7A23E"
  safran-yazi: "#6F5210"
  safran-soluk: "#F6E6C2"
  krem-yazi: "#F6EEDF"
  cizgi: "#E3D5BD"
  cizgi-koyu: "#C9B28E"
  girdi-kenar: "#8A6F55"
  koyu-yun: "#1A120E"
  koyu-yuz: "#241914"
  koyu-murekkep: "#F2E8D6"
  koyu-kokboya: "#B8392D"
  koyu-yesil: "#2A6B52"
typography:
  baslik:
    fontFamily: "Work Sans (yerel, 500/600), Segoe UI, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
  gövde:
    fontFamily: "Atkinson Hyperlegible Next, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    lineHeight: 1.55
  kuran:
    fontFamily: "Ulu Nesih, Scheherazade New, Amiri, serif"
    fontSize: "clamp(1.9rem, 1.35rem + 1.9vw, 2.6rem)"
    lineHeight: 2.05
    fontFeature: "\"cv62\" 1"
rounded:
  r: "2px"
spacing:
  genislik: "78rem"
---

# Design System: İlim Yolu — Kilim

<!-- 2 Kasım 2026: Rıdvan «C · Kilim» yönünü seçti (taslak: egitim/docs/taslaklar/ilim-yolu/c, NOTLAR.md). Bu dosya onun kaynağıdır;
jetonlar src/styles/kilim.css'te aynı adlarla durur. Eski «Çini Panosu» jeton adları (astar, karo, derz, kontur, yesil, firuze, altin) Ezber Kilimi
sayfaları çalışsın diye kodda KORUNDU ve kilim paletine bağlandı; yeni kodda kokboya / safran / yun / yuz kullanın. -->

## Overview

**Yön: Anadolu kilimi.** Yün krem zemin, kök boya kırmızısı (ana renk, bağlantı, birincil düğme), koyu yeşil (ikinci renk, «tamam»), safran yalnız süste ve
koyu zeminde. Her şekil dik açılı ve basamaklıdır: göz, yıldız, su yolu, mihrap, testere bandı. Köşe 2 px, eğri yok, gölge yok. Derinlik derz çizgisinden ve
zemin farkından gelir. Üstte ve kartların başında kilim şeridi (ince bordür) durur. Dekor bilgiyi geçmez: sayfa ilk bakışta ne yapılacağını söyler.

**İlerleme dokunur.** Çalışılan her madde kilimde bir hücreyi alttan yukarı doldurur; dört ayrı doku (boş, çizgi, çapraz, dolu) biçimle ayrılır, renk ikinci
işarettir. Yüzde, seri, puan ve sıralama yoktur; zaman yazıyla söylenir («Pekişme kontrolü 24 Ekim’de»).

**İki görünüm tek sayfada.** Ziyaretçi ana sayfası statiktir (kapak kilimi, dört yol, üç adım, güvence) ve Firebase yüklemez. Oturum işareti
(`public/oturum-isareti.js`, yalnız yerel işarete bakar) `<html data-oturum>` koyarsa «Bugün tekrar», «Kaldığın yer» ve kilim görünür.

### Named Rules
**Safran Yazı Olmaz.** Safran (#D7A23E) krem üstünde 2,0:1'dir: açık zeminde asla yazı rengi değil; yalnız süs ve koyu zemin. Açık zeminde yazı gerekirse `safran-yazi` (6,3:1).

**Motif Yasağı.** Haç, artı, köknar, kalp, insan ve hayvan figürü yok. Kalp yerine İslâmî sembol (lale, hilal, rahle). Yalnız vektör; piksel görsel yok.

**Biçim Önce, Renk Sonra.** Her durum önce biçimle (doku, kontur, çerçeve) ayrılır, sonra renkle; renk körü okuyucu için de tek başına anlam taşımaz.

## Colors

- **Yün** (`yun`): sayfa zemini. **Yüz** (`yuz`): kart, karo, alan zemini. **Mürekkep** (`murekkep`, `murekkep-2`): metin 14,4:1 ve ikincil 7,2:1.
- **Kök Boya** (`kokboya`, `kokboya-2`, `kokboya-soluk`): birincil düğme, bağlantı, odak vurgusu, hata. **Yeşil** (`yesil`, `yesil-soluk`): ikincil düğme, «uygun / tamam», alt bilgi ve koyu bant zemini; krem yazı 8,4:1.
- **Safran** (`safran`, `safran-soluk`, `safran-yazi`): kilim bordürü, koyu zemindeki vurgu, rıza kutusunun soluk zemini.
- **Çizgi** (`cizgi`, `cizgi-koyu`): kart ve karo kenarı. **Alan kenarı** (`girdi-kenar`, 4,5:1): form alanı.
- **Koyu tema** (otomatik ya da `data-theme="dark"`): sıcak koyu kahve zemin (#1A120E), açık krem yazı, kırmızı #B8392D, yeşil #2A6B52. Yazı oranları AA.
- Kilim şeridi desenleri `--sp-*` jetonlarıyla boyanır; koyu temada kendiliğinden döner.

## Typography

- **Başlık:** Work Sans (yerel `work-sans-500/600.woff2`, SIL OFL; kopya `public/fonts/work-sans-OFL.txt`). **Metin:** Atkinson Hyperlegible Next. Kök yazı boyu 17 px (`--olcu`), satır ölçüleri `em`.
- **Kur'an:** Ulu Nesih, `cv62`, `lang="ar"` `dir="rtl"`; okunuş italik, meâl düz. Dört ses (Kur'an, okunuş, anlam, hocanın notu) dört biçimde durur.
- Üst yazı: 0.8rem, 600, büyük harf, 0.16em aralık, kök boya renginde.

## Layout & Components

- **Üst bilgi:** kilim şeridi + marka damgası (İlim Yolu · Ulu Camii) + menü (Ana sayfa, Ezber Kilimi, ulucamii.be) + beş dil + «Giriş yap / Hesap aç» (ziyaretçi) ya da «Hesabım» (oturum). Dar ekranda menü ve dil satırı alta iner.
- **Düğme:** `dugme birincil` (kök boya), `ikincil` (yeşil kenar), `safran` (koyu zemin), `cizgili-krem` (koyu zemin), `google` (beyaz), `tehlike` (kırmızı kenar). En az 3 rem (küçük 2,75 rem), 2 px kenar. Odak 3 px mürekkep halkası.
- **Kart:** `iy-kart` (yüz zemin, 1,5 px koyu çizgi) + üstte kilim şeridi; form kartları `iy-form-kart`.
- **Form:** etiket her zaman alanın üstünde ve görünür; `iy-girdi` en az 3 rem; hata `role="alert"`, durum `role="status"`; gösterilen şifre `aria-pressed` düğmesiyle; kullanıcı adı `@` önekli alanla, canlı biçim denetimiyle.
- **Rıza kutusu** (`iy-riza`): «Yeni Müslümanım» altında AYRI kutu; safran-soluk zemin, kilit simgesi; kutu kaldırılınca kayıt silinir.
- **Sekme** (`iy-sekmeler`): ARIA sekme deseni, ok tuşları; seçili sekme koyu zeminli.
- **Adım göstergesi** (`iy-tezgah`): baklava rozet; geniş ekranda dikey kesik hat.
- **Ezber panosu** (`/[dil]/ezber/`): 13 × 14 ızgara, derzli karo, odaktaki karonun adı üstteki yeşil kuşakta; sır yalnız dokunulan karodan yayılır (420 ms, `--yayil`), azaltılmış harekette anında. Motif karoda kontur çizilir.
- **Kilim** (`.ezber-kilim`): kendi kipi (`kl-kendi`, tek mürekkep doku) ve birleşik kip (`kl-birlesik`: hocanın basamağı dolgu, öğrencinin kendi çalışması yeşil doku, `kl-ust`).
- **Hoca telefonu** (`/hoca/`): ana sitedeki ekran; bu sistemin dışında, ayrı stil.

## Motion & Accessibility

- Tek hareket yasası: değişim dokunulan noktadan yayılır; `prefers-reduced-motion` altında süre 1 ms ve son hâl anında.
- Zorunlu renk kipinde (`forced-colors`) karolar Canvas/CanvasText, vurgu Highlight.
- 44 px hedef, görünür odak, 320 px'te yatay kaydırma yok, klavyeyle tam gezinti; `aria-live` iletileri; ekran okuyucu için hücre başına metin karşılığı (liste).
- Satır içi stil ve betik yok (CSP): yerleşim sınıflarla, metinler `data-veri` JSON'uyla gelir.

## Do's and Don'ts

**Do**
- Yeni yüzeyi kilim dilinde kur: yün zemin, yüz kart, 2 px köşe, kenarda kilim şeridi.
- Zamanı yazıyla söyle; kök yazı boyunu 17 px tut; satır ölçüsünü `em` ile ver.
- Hesap sayfalarını `noindex` yap, site haritasından ve çevrim dışı önbellekten çıkar.
- Fransızca metinde ince/bölünmez boşluk kuralını istemci tarafında da uygula (`hesapMetinleri('fr')`).

**Don't**
- Safranı açık zeminde yazı rengi yapma. Gölge, geçiş rengi, bulanık cam kullanma.
- Eğri köşe, haç/artı/köknar/kalp/insan/hayvan motifi, piksel görsel koyma.
- İlerlemeyi çubuk, yüzde, seri ya da sıralamayla gösterme.
- Anonim sayfada Firebase yükleme; oturum işareti yoksa ağ isteği yok.
- Açılır bildirimle (toast) durum söyleme; durum akışın içinde bir satırdır.
