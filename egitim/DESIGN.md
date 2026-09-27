---
name: Ezber Kilimi — Çini Panosu (egitim.ulucamii.be)
description: Ulu Camii Kur'an kursunun eğitim platformu; bütün ezber yolu tek bir çini panosu, her öğrencinin yolu kendi kilimi.
colors:
  astar: "#F3F6F1"
  karo: "#FFFFFF"
  derz: "#D3DDD5"
  derz-koyu: "#B5C5B9"
  kontur: "#0E2217"
  kontur-2: "#475B4E"
  yesil: "#134420"
  yesil-2: "#1C5A30"
  yesil-soluk: "#E3EEE5"
  yesil-bag: "#1D5E33"
  sir-motif: "#F5FAF6"
  motif: "color-mix(in oklab, #1D5E33 58%, #FFFFFF)"
  kenar-zemin: "color-mix(in oklab, #134420 14%, #FFFFFF)"
  kusak: "#134420"
  kusak-yazi: "#E9F2EB"
  firuze: "#2E9E97"
  firuze-yazi: "#0D6660"
  altin: "#C9A23C"
typography:
  display:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1.6rem + 4.6vw, 4.25rem)"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.028em"
  display-madde:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 1.6rem + 3.6vw, 4.25rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 1.4rem + 1.9vw, 2.75rem)"
    fontWeight: 750
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 750
    lineHeight: 1.12
  lead:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    lineHeight: 1.35
  okunus:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.55
  meal:
    fontFamily: "Atkinson Next, Segoe UI, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.6
  kuran:
    fontFamily: "Ulu Nesih, Scheherazade New, Amiri, serif"
    fontSize: "clamp(1.9rem, 1.35rem + 1.9vw, 2.6rem)"
    fontWeight: 400
    lineHeight: 2.05
    letterSpacing: "0"
    fontFeature: "\"cv62\" 1"
  kuran-serlevha:
    fontFamily: "Ulu Nesih, Scheherazade New, Amiri, serif"
    fontSize: "clamp(2.1rem, 1.5rem + 2.4vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "\"cv62\" 1"
rounded:
  karo: "1px"
  r: "3px"
  cerceve: "5px"
spacing:
  derz: "2px"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "2.25rem"
  xl: "3.5rem"
  bolum: "clamp(3.5rem, 2.5rem + 4vw, 6.5rem)"
  genislik: "84rem"
components:
  dugme-birincil:
    backgroundColor: "{colors.yesil}"
    textColor: "#FFFFFF"
    rounded: "{rounded.r}"
    padding: "0.75rem 1.35rem"
    height: "3.25rem"
  dugme-birincil-hover:
    backgroundColor: "{colors.yesil-2}"
  dugme-ikincil:
    backgroundColor: "{colors.karo}"
    textColor: "{colors.kontur}"
    rounded: "{rounded.r}"
    padding: "0.75rem 1.35rem"
    height: "3.25rem"
  dugme-ikincil-hover:
    backgroundColor: "{colors.yesil-soluk}"
  secim:
    backgroundColor: "{colors.karo}"
    textColor: "{colors.kontur}"
    rounded: "{rounded.r}"
    padding: "0.3rem 0.8rem"
    height: "2.5rem"
  secim-basili:
    backgroundColor: "{colors.yesil-soluk}"
    textColor: "{colors.kontur}"
  cip:
    backgroundColor: "{colors.karo}"
    textColor: "{colors.kontur}"
    rounded: "{rounded.r}"
    padding: "0 0.85rem"
    height: "2.6rem"
  cip-basili:
    backgroundColor: "{colors.yesil-soluk}"
  karo-madde:
    backgroundColor: "{colors.karo}"
    textColor: "{colors.motif}"
    rounded: "{rounded.karo}"
  karo-madde-sirli:
    backgroundColor: "{colors.yesil}"
    textColor: "{colors.sir-motif}"
  kusak-yazi:
    backgroundColor: "{colors.kusak}"
    textColor: "{colors.kusak-yazi}"
    typography: "{typography.label}"
    padding: "0.55rem 0.9rem"
    height: "3.65rem"
  kart:
    backgroundColor: "{colors.karo}"
    textColor: "{colors.kontur}"
    rounded: "{rounded.r}"
    padding: "1.25rem"
  dil-secici-etkin:
    backgroundColor: "{colors.yesil}"
    textColor: "#FFFFFF"
    height: "2.5rem"
  kalite-dugmesi:
    backgroundColor: "{colors.karo}"
    textColor: "{colors.kontur}"
    padding: "0.8rem 0.9rem"
    height: "4.6rem"
---

# Design System: Ezber Kilimi — Çini Panosu

<!-- Kaynak: egitim/docs/taslaklar/ (cini.css, giris.html, madde.html, hoca.html), Faz 1e, 27 Eylül 2026; bitiş
incelemesi «ship». Bu taslaklar prototiptir; Faz 1f onları egitim/ altındaki Astro uygulamasına taşır ve bu dosya o
taşımanın kaynağıdır. Jeton adları koddaki CSS değişkenleriyle birebir aynıdır (--astar, --karo, --derz …).
[çıkarım] işareti, kodda ya da yön sözleşmesinde doğrudan karşılığı olmayan yorum cümlelerini gösterir. -->

## Overview

**Creative North Star: "Caminin duvarındaki çini panosu"**

Bütün ezber yolu tek bir çini panosudur: açık bir astar zeminde derzle ayrılmış beyaz sırlı karolar, her karoda koyu
konturlu (tahrirli) bir kilim motifi, üstte kurs yeşili bir yazı kuşağı, çevrede kenar suyu bordürü. Müfredat
kahramandır; arabesk süslemeli yeşil-altın kahraman görseli, cami silueti ve stok fotoğraf yoktur. Pano 12 sıradır
(7 şerit + Amme'nin 5 durağı) ve her karo bir ezberdir; ziyaretçi yolu bir bakışta görür, karoya dokunup Diyanet metnine
ve sesine geçer.

Yüzey ferah ve düzdür: gölge yok, geçiş rengi yok, derinlik yalnız 1–2 px derz çizgisinden ve 3 px karo köşesinden
gelir. Renk tasarruflu kullanılır: zemin astar ve beyaz karo, yazı koyu mürekkep, kurs yeşili yalnız kuşakta, birincil
düğmede ve yayılan sırda; firuze ve altın yalnız ezber basamaklarının sırrıdır. Tek bir hareket yasası vardır: her
değişim dokunulan karodan yayılır. Zaman her yerde yazıyla söylenir, ilerleme çubuğu ya da seri sayacıyla değil.

Yazı iki aileyle konuşur: Latin metin okunabilirlik için tasarlanmış Atkinson Hyperlegible Next, Kur'an metni Türk
mushaf usulüne yakın «Ulu Nesih». Dört ses dört biçimde durur: Kur'an, okunuş, anlam, hocanın notu. Çizimler yalnız
vektördür; yayındaki tek piksel yoktur.

**Key Characteristics:**
- Tek pano, 13 × 14 ızgara: 12 sıra, sıra etiketi sütunu, sırada en çok 10 madde karosu, kilimle aynı düzende kenar suyu bordürü.
- Beyaz sırlı karo + yeşil dolgulu, koyu konturlu motif (tahrir); boş hücre astara çekilir.
- Kurs yeşili (#134420) kuşakta ve sırda; firuze ve altın yalnız basamakta.
- Gölgesiz, geçişsiz; derinlik derzden (1–2 px) ve 3 px köşeden.
- Tek hareket yasası: sır dokunulan noktadan yayılır (420 ms, üstel yavaşlama); azaltılmış harekette anında.
- Kök yazı boyu 17 px; satır ölçüleri em ile.
- Zaman yazıyla («Pekişme kontrolü 24 Ekim’de»); sıralama, puan, seri yok.

### Named Rules
**The Tek Dünya Rule (kilim ↔ çini köprüsü).** Kilim ile çini iki ayrı zanaat değil, tek dünyadır. Pano müfredattır:
her karo bir ezber maddesidir. Kilim öğrencinin kendi yoludur: öğrenci okudukça o karonun motifi, panodakiyle aynı
yerleşimde kendi kilimine dokunur (kenar suyu maddeleri iki yerde de saat yönünde: üst 4, sağ 3, alt 3 sağdan sola,
sol 3 aşağıdan yukarı). Dört basamak, bir çini karonun dört olgunlaşma aşamasıdır: kontur çizilir (Çalışıyor) →
firuzeyle boyanır (Hocaya okudu) → yeşille sırlanır (Pekişti) → altınla bezenir (Kalıcı). Yeni bir yüzey bu üç
eşlemeden birini bozuyorsa dünyanın dışındadır.

**The Müfredat Kahramandır Rule.** İlk görünümde tek baskın öğe panodur; kahramanın yerine süsleme, fotoğraf ya da
soyut görsel konmaz. Her ekranda bir baskın öğe ve bir sakin alan bulunur.

## Colors

Açık, serin bir astar üzerinde beyaz karolar ve koyu yeşil-siyah mürekkep; tek güçlü renk kurs yeşili, iki ayrılmış
renk (firuze, altın) yalnız basamak içindir.

### Primary
- **Kurs Yeşili Sır** (`yesil`): kuşak zemini, birincil düğme, etkin dil, alt bilgi zemini, kenar suyu bordürünün
  deseni ve üzerine gelinen karoya yayılan sır. Kurs kimliğinin rengidir (kimlik paketindeki kurs yeşili).
- **Sırın Parlak Yüzü** (`yesil-2`): yalnız birincil düğmenin ve çal düğmesinin üzerine gelme hâli.
- **Bağlantı Yeşili** (`yesil-bag`): metin içi bağlantı, seçili sekme ve etkin menü alt çizgisi (3 px), sıra
  numaraları, Arapça serlevha, âyet numaraları, basamak Pekişti işareti, `:target` çerçevesi. Karo motifinin dolgusu
  (`motif`) bu rengin %58'inin karoya karıştırılmasıdır.
- **Kuşak** (`kusak`) ve **Kuşak Yazısı** (`kusak-yazi`): panonun üstündeki yazı kuşağı; odaktaki karonun adını yazar.

### Secondary
- **Firuze Boya** (`firuze`): yalnız «Hocaya okudu» basamağı (motif %30 dolgu + kontur) ve kilimde rozet ödülü;
  hoca listesindeki «kontrol günü geldi» etiketi firuzenin %14'ü üstünde `firuze-yazi` ile yazılır.

### Tertiary
- **Altın Bezeme** (`altin`): yalnız «Kalıcı» basamağı (dolgu + çerçeve) ve kilimdeki altın kenar ödülü.

### Neutral
- **Beyaz Astar** (`astar`): sayfa zemini ve panodaki boş hücreler (ortasında küçük derz rengi baklava).
- **Sırlı Karo Yüzü** (`karo`): kartlar, liste satırları, madde karoları, düğme zeminleri.
- **Derz** (`derz`) ve **Koyu Derz** (`derz-koyu`): karolar arası 1–2 px çizgi, kart kenarı; koyu derz seçim çipi
  kenarı, rozet karonun iç çizgisi, kesikli «Örnek veri» etiketi.
- **Mürekkep** (`kontur`): metin, motif konturu (tahrir), odak halkası, ikincil düğme kenarı.
- **İkincil Mürekkep** (`kontur-2`): açıklama ve üst bilgi yazısı (astar üstünde 6,6:1), «Çalışıyor» konturu.
- **Soluk Yeşil** (`yesil-soluk`): üzerine gelme zemini, basılı seçim/çip, gönderilmiş kayıt satırı, durak başlığı.
- **Kenar Suyu Zemini** (`kenar-zemin`): bordür ve köşe karoları (kurs yeşilinin %14'ü).
- **Sır Beyazı** (`sir-motif`): sır yayıldığında motifin döndüğü renk.

**Koyu tema** aynı adlarla yeniden tanımlanır (sistem tercihi, `data-theme="light"` ile kapatılır, `data-theme="dark"`
ile zorlanır): astar #08130D, karo #0F1D16, derz #1F3227, kontur #E5EEE7, yesil #1E5B34, yesil-bag #93D3A7,
firuze #41B8AF, altin #D8B452. Koyu temada logo, kimlik kılavuzundaki gibi beyaz koruma alanına oturur.

### Named Rules
**The Ayrılmış Sır Rule.** Firuze ve altın yalnız basamak sırrıdır. Düğmede, başlıkta, süslemede, bağlantıda
kullanılmaz. Kilim ödülleri kendilerini kazandıran basamağın rengini taşır: rozet (hepsi ≥ Hocaya okudu) firuze,
mühür (hepsi ≥ Pekişti) yeşil, altın kenar (hepsi Kalıcı) altın.

**The Yeşil Kuşakta ve Sırdadır Rule.** Kurs yeşili dolu alan olarak yalnız kuşakta, birincil eylemde, etkin
seçimde, alt bilgide ve yayılan sırda görünür. Madde karosunun dinlenme yüzü beyazdır; yeşil karoya ancak dokunulunca
yayılır.

## Typography

**Display Font:** Atkinson Next (Atkinson Hyperlegible Next, değişken 200–800 + italik, alt küme; yedek Segoe UI, system-ui)
**Body Font:** Atkinson Next (aynı aile)
**Arapça:** Ulu Nesih (Scheherazade New 4.500 alt kümesi, yeniden adlandırılmış, OFL; yedek Scheherazade New, Amiri)

**Character:** Karışabilen harfleri ayıran geniş, açık bir grotesk; çocuğa, yaşlı cemaate ve ikinci dilinde okuyan
veliye yazılmış. Yanında Türk mushaf usulüne yakın, sakin bir nesih; iki yazı birbirini taklit etmez.

### Hierarchy
- **Display** (800, clamp(3rem → 4.25rem), 0.96, -0.028em): yalnız giriş başlığı «Ezber Kilimi». Tavan 4.25rem = 72,25 px.
- **Display — madde** (800, clamp(2.6rem → 4.25rem), 1, -0.025em): madde sayfası serlevhasındaki Türkçe ad.
- **Headline** (750, clamp(1.9rem → 2.75rem), 1.12, -0.02em): bölüm başlıkları.
- **Title** (750, 1.2–1.45rem, 1.12): kart, basamak ve şerit başlıkları; hoca telefonunda kalite adı 1.2rem.
- **Lead** (400, 1.12–1.3rem, 1.5): vaat cümlesi ve bölüm açıklaması; en çok 22–40em.
- **Body** (400, 1.0625rem = 17 px, 1.55): gövde; en çok 37–45em.
- **Label** (650–750, 0.82–0.95rem): üst bilgi, dil kısaltmaları (0.84rem, 0.04em aralık), etiketler, dipnot.
- **Kur'an** (Ulu Nesih 400, clamp(1.9rem → 2.6rem), 2.05, sağa hizalı): âyet metni; serlevhada clamp(2.1rem → 3.5rem), 1.6, bağlantı yeşili.
- **Okunuş** (Atkinson italik, 1.12rem, 1.55): transliterasyon; numarası düz, kalın, tablo rakamlı.
- **Meâl** (Atkinson düz, 1.12rem, 1.6, en çok 42em): Diyanet meâli; numarası bağlantı yeşili, kalın.

Başlıklar `text-wrap: balance`, paragraflar `pretty`. Sayılar `tabular-nums lining-nums`.

### Named Rules
**The Dört Ses Rule.** Kur'an metni Ulu Nesih'le (büyük, sağa hizalı, satır aralığı ~2), okunuş Atkinson italikle,
anlam Atkinson düzle yazılır; hocanın notu hoca ekranında çiple seçilir, öğrenci ve veli görünümünde durum karosunda tırnak içinde, alıntı olarak durur. Bir ses bir başkasının biçimini ödünç almaz. Arapça her zaman
`lang="ar"`, `dir="rtl"`, `font-feature-settings: "cv62" 1` (şeddeli esre harfin altında, Türk usulü), harf
aralığı 0, ağırlık 400; Arapça yazı hiçbir zaman çizim olarak konmaz.

**The On Yedi Piksel Rule.** Kök yazı boyu `--olcu` = 1.0625rem, yani 1rem = 17 px her yerde. Satır ölçüleri `em`
ile verilir, asla `ch` ile değil: Chromium `ch`'yi web yazı tipi yüklenmeden önce yedek yazı tipinden hesaplayıp
güncellemedi (aynı sayfada 405 px ↔ 487 px ölçüldü).

## Layout

İçerik kabı `min(100% - 2rem, 84rem)`, 48rem üstünde `min(100% - 5rem, 84rem)`. Bölümler arası üst boşluk
clamp(3.5rem → 6.5rem). Ritim derz (2 px), 0.75rem, 1.25rem, 2.25rem, 3.5rem basamaklarıyla kurulur. Kesme noktaları
rem ile: 30, 40, 48, 56, 60, 64, 72rem.

**Giriş:** telefonda başlık → pano → güven satırı; 64rem üstünde metin solda (alta hizalı), pano sağda iki satırı
kaplar. Kuşak ve bütün pano 1440×900 ilk görünüme sığar (ölçüm 164 → 885 px).

**Pano geometrisi:** tek 13 × 14 ızgara, hücreler arası 2 px derz. Karo ölçüsü geniş ekranda
`clamp(1.4rem, min(3.6vw, (100svh - 16rem) / 14), 3rem)`, 64rem altında `clamp(1.1rem, (100vw - 2rem - 28px) / 13, 2.8rem)`
(390 genişlikte 25,2 px). Çerçeve genişliği içerikten değil karo ölçüsünden hesaplanır: `13 × karo + 28px`. Amme
etiketi 5 sıra boyunca dikey yazılır. Kenar suyu 13 maddesi bordür içinde saat yönünde dağılır (üst 4, sağ 3, alt 3
sağdan sola, sol 3 aşağıdan yukarı), aradaki bordür karoları koçboynuzunu panoya dönük taşır, köşelerde köşe motifi.

**Liste ve madde:** şerit maddeleri `auto-fill, minmax(15.5rem, 1fr)` karo ızgarası; şerit başı 60rem üstünde
17rem sütun. Telefonda şerit listeleri katlanır (`details`), geniş ekranda hep açıktır. Madde sayfası 64rem üstünde
metin + 22rem yapışkan yan panel. Basamak kartları 1 → 2 (48rem) → 4 (72rem) sütun; telefonda kart yatay (motif solda).

**Hoca telefonu:** tek sütun, tek el; dokunma hedefleri en az 2.5rem, ana eylemler 3rem ve üstü, kalite düğmeleri 4.6rem.

## Elevation & Depth

Sistem düzdür: gölge yoktur. Derinlik yalnız derzden gelir. Karolar derz renginde bir zemine 2 px aralıkla dizilir;
böylece aralık kendiliğinden çizgi olur (pano, basamaklar, kaynaklar, kalite düğmeleri, çalışma kartları). Liste
karolarında her karonun 1 px dış çizgisi 1 px aralığı doldurur. Katman ayrımı renk tonuyla yapılır: astar (en arka) →
karo (yüz) → soluk yeşil (etkileşim) → kurs yeşili (sır). Kodda geçen `box-shadow` yalnız çizgi olarak kullanılır
(etkin sekme/menünün 3 px alt çizgisi, basılı çipin 1 px iç kenarı, rozet karonun 1 px iç derzi); gölge olarak değil.

### Named Rules
**The Derz Rule.** Yüzeyleri gölge ayırmaz, derz ayırır: 1–2 px `derz` çizgisi ve 3 px köşe. Bulanık gölge, geçiş
rengi ve yarı saydam cam yüzey bu dünyada yoktur. Tek istisna modal alt sayfanın arkasındaki mürekkep perdesidir
(`kontur` %38).

## Shapes

Köşeler neredeyse keskindir: madde karoları 1 px, düğmeler, çipler, kartlar ve etiketler 3 px (`--r`), derz
çerçeveli gruplar 5 px (`--r` + 2 px). Pano ve kilim karedir; motifler 120 birimlik kare görünüm kutusunda, dik açılı,
kilim dokusundan gelen basamaklı geometridir (hatem, mihrap, su yolu, bereket, göz, pıtrak, kandil, hayat ağacı,
muska, mühür, rozet; bordürde koçboynuzu). Motif dolgusu `motif`, konturu `kontur`, kalınlık 120'lik kutuda 4
(madalyonda 2.5), köşe birleşimi yuvarlak. Basamak işaretleri keskin köşeli (miter) baklavalardır. Simgeler 24'lük
kutuda 2 px, yuvarlak uçlu çizgi simgelerdir. Tek büyük yarıçap hoca telefonundaki alt sayfanın üst köşeleridir
(1.1rem) [çıkarım: sayfanın kaydırılabilir bir katman olduğunu anlatır].

## Components

### Buttons
Dolu, düz, kararlı; yükseklik ve kalınlık dokunmayı kolaylaştırır.
- **Shape:** neredeyse keskin (3 px), 2 px kenar, en az 3.25rem yükseklik, 750 ağırlık, 1.06rem.
- **Primary:** kurs yeşili zemin, beyaz yazı («Fâtiha ile başla»); yanında çizgi ok simgesi.
- **Hover / Focus:** zemin ve kenar `yesil-2` (160 ms); odak her yerde 3 px `kontur` halka, 3 px aralık.
- **Secondary:** karo zemin, mürekkep yazı ve mürekkep kenar; üzerine gelince soluk yeşil.
- **Çal düğmesi:** 3.5rem kare, kurs yeşili, beyaz oynat simgesi.

### Chips
- **Seçim (`secim`):** karo zemin, 1 px koyu derz kenar, 3 px köşe, 2.5rem; basılıyken soluk yeşil zemin ve bağlantı
  yeşili kenar («3 kez tekrar», «Okunuşu göster»).
- **Not çipi (`cip`, hoca):** aynı biçim, 2.6rem; basılıyken ayrıca 1 px iç kenar. Hocanın veliye notu buradan seçilir.
- **Örnek veri etiketi:** 0.75rem, 700, kesikli koyu derz kenar; uydurma verinin gösterildiği her yerde zorunlu.
- **Yakında / kontrol etiketi:** soluk yeşil (yakında) ya da firuze %14 (kontrol günü) zeminli 3 px küçük etiket; renkli kenar çizgisi yok.

### Cards / Containers
- **Corner Style:** 3 px; derz çerçeveli grup 5 px.
- **Background:** karo; grup zemini derz.
- **Shadow Strategy:** yok (Elevation & Depth).
- **Border:** 1 px `derz`; gruplarda 2 px `derz` çerçeve ve 2 px aralık.
- **Internal Padding:** 1–1.5rem (durum karosu 1rem 1.1rem, kilim kutusu 1.25rem, basamak kartı 1.5rem 1.4rem).

### Navigation
- Üst bilgi astar üstünde: kurs logosu (kimlik paketinden birebir SVG, yeniden çizilmez; yalnız görünür 836/400
  kısmı `object-fit` ile kırpılır), 650 ağırlıklı bağlantılar; bulunulan sayfa 3 px bağlantı yeşili alt çizgi.
- Dil seçici derzle ayrılmış karo dizisi (TR FR EN NL DE), her biri en az 2.5rem; etkin dil kurs yeşili. Telefonda
  menü tek satır, bölüm bağlantısı gizlenir.
- Altında 14 px kenar suyu bordürü (koçboynuzu, kurs yeşili) üst bilgiyi içerikten ayırır; alt bilgi kurs yeşili zemin
  üstünde aynı bordürle açılır.
- Hoca telefonunda sekmeler derzle ayrılmış üç eşit karo; seçili sekme 3 px alt çizgi.
- Yol izi 0.92rem, `/` ayraç koyu derz renginde.

### Çini panosu (imza bileşeni)
- **Madde karosu:** beyaz yüz, motif %72, dolgu `motif`, 4 birim `kontur` tahrir. **Boş hücre:** astar + küçük derz
  baklava. **Sıra etiketi:** karo üstünde bağlantı yeşili, 800 ağırlık, tablo rakamı. **Bordür/köşe karosu:** `kenar-zemin`
  üstünde kurs yeşili desen.
- **Sır yayılması:** üzerine gelince ya da odakta karonun katmanı kurs yeşilini imleç noktasından yayar
  (`clip-path: circle(0 → 145% at --x --y)`, 420 ms, `--yayil` = cubic-bezier(0.16, 1, 0.3, 1)); motif aynı anda
  `sir-motif` rengine döner. Klavye odağında nokta merkezdir.
- **Kuşak:** panonun üstündeki yeşil yazı kuşağı varsayılan olarak panoyu özetler; odaktaki karonun adını, şeridini,
  türünü, sesli olup olmadığını ve sınıf hedef tarihini yazar; en çok iki satır, yüksekliği zıplamaz.
- **Klavye:** tek sekme durağı (dolaşan tabindex); sağ/sol okuma sırası, yukarı/aşağı ızgarada en yakın karo, Home/End.
- **Zorunlu renk kipinde:** karolar Canvas/CanvasText, sır Highlight.

### Rozet karo ve liste maddesi
Panodaki madde karosunun küçüğü (1.7–2.75rem): beyaz yüz, 1 px iç koyu derz, aynı tahrirli motif. Liste maddesi
derzli karo ızgarasında rozet + ad + üst bilgi (ses simgesi bağlantı yeşili). Bağlantıyla gelinen madde (`#m-…`)
2 px bağlantı yeşili çerçeve alır ve sır rozet karodan yayılır (900 ms, 150 ms gecikme); üzerine gelince aynısı.

### Basamak işareti ve durum karosu
- **Biçim önce, renk sonra:** Başlanmadı kesikli ve soluk (kilimde ve basamak kartında kesikli kontur, 1.4rem’lik satır içi işarette tek soluk nokta); Çalışıyor yalnız kontur (`kontur-2`); Hocaya okudu firuze
  boya (%30 dolgu + kontur); Pekişti dolu yeşil sır (`yesil-bag`); Kalıcı altın dolgu + çerçeve. Renksiz baskıda da ayırt edilir.
- **Durum karosu:** kim · basamak işareti (2rem) ve adı · zaman yazıyla («Pekişme kontrolü 24 Ekim’de»).

### Kilim
Öğrencinin kilimi `src/lib/ezber/kilim.ts` ile çizilir ve bu jetonları `--kl-*` takma adlarıyla kullanır: zemin
karo, kenar yeşilin %9'u, bordür kurs yeşili, basamak renkleri `kontur-2` / `firuze` / `yesil-bag` / `altin`, rozet
firuze, mühür yeşil, altın kenar altın. En çok 30rem genişlik.

### Hoca telefonu
- **Üst şerit:** kurs yeşili; «Ezber» + tarih; bağlantı durumu şeridin içinde tek satır yazılır («Bütün kayıtlar
  sunucuda · 10.42» / «Bağlantı yok · 2 kayıt sırada; bağlantı gelince gider»); açılır bildirim yok.
- **Öğrenci satırı:** ad (750), sıradaki madde rozetiyle, durum işareti + zaman yazıyla, sağda 3rem «Dinle» düğmesi
  (birincil; pekişmişse ikincil).
- **Kayıt satırı:** gönderilmiş kayıt soluk yeşil; sıradaki (gönderilmemiş) kayıt beyaz zemin ve içeriden 1 px
  kesikli `kontur-2` çerçeve («Sırada · 10.43 · Tam; deftere yazıldı»), yanında «Geri al».
- **Dinleme penceresi:** alt sayfa; üç büyük kalite düğmesi derz grubunda (Tam = yeşil dolu kare, Az hatalı = soluk
  yeşil + 2 px yeşil kenar, Tekrar gelsin = beyaz + 2 px kesikli kenar), her birinde veliye gidecek yumuşak cümle
  yazılı; altında not çipleri.

### Namazda nerede okunur
Dört duruş (kıyam, rükû, secde, oturuş) derzle ayrılmış karo dizisi; yüzsüz siluet çizimleri %45 opaklıkta, bulunulan
duruş soluk yeşil zemin, tam opak çizim, 800 ağırlıklı yazı.

## Do's and Don'ts

### Do:
- **Do** her yeni yüzeyi derzli karo diliyle kur: karo zemini derz rengine 2 px aralıkla dizilir, köşe 3 px.
- **Do** her değişimi dokunulan karodan yayılan sırla göster (420 ms, `--yayil`); azaltılmış harekette süre 1 ms, son hâl anında.
- **Do** basamakları önce biçimle ayır (kontur, boya, dolu sır, altın + çerçeve), sonra renkle.
- **Do** zamanı yazıyla söyle («En erken 7 gün sonra pekişir», «sınıf hedefi 28 Mart»).
- **Do** kök yazı boyunu 17 px tut ve satır ölçülerini `em` ile ver.
- **Do** Arapçayı Ulu Nesih, `cv62`, `lang="ar"` ve `dir="rtl"` ile yaz; okunuşu italik, meâli düz tut.
- **Do** uydurma veriyi kesikli «Örnek veri» etiketiyle işaretle.
- **Do** logoyu kimlik paketinden birebir SVG olarak kullan; koyu temada beyaz koruma alanına oturt.
- **Do** bağlantı durumunu ve kayıt kuyruğunu akışın içinde bir satır olarak yaz.

### Don't:
- **Don't** gölge, geçiş rengi ya da bulanık cam yüzey kullanma; derinlik yalnız derzden gelir.
- **Don't** firuzeyi ya da altını basamak dışında (düğme, başlık, süsleme, bağlantı) kullanma.
- **Don't** madde karosunu dinlenme hâlinde yeşile boyama; yeşil yalnız kuşakta ve yayılan sırdadır.
- **Don't** ilerlemeyi ilerleme çubuğu, yüzde, seri, puan ya da sıralamayla gösterme.
- **Don't** satır ölçüsünü `ch` ile verme.
- **Don't** yeşil-altın arabesk kahraman, cami silueti ya da stok fotoğrafla kahraman kurma; müfredat kahramandır.
- **Don't** piksel görsel koyma, logoyu yeniden çizme, Arapça yazıyı çizim olarak koyma; canlı figür yalnız yüzsüz küçük siluet.
- **Don't** açılır bildirimle (toast) bağlantı ya da kayıt durumu söyleme.

<!-- Bilinen ayrılık (jeton değil): ulucamii.be'deki üretim veli portalı kilimi (src/styles/ezber-kilim.css) hâlâ
eski «Kilim Kartografyası» paletini kullanıyor (rozet aşı boyası). Kilim Faz 1f'de egitim/'e taşındığında bu çini
jetonlarını alır (rozet firuze). -->
