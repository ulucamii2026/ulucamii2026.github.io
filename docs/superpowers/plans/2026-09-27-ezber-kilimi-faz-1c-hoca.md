# Ezber Kilimi Faz 1c — Hoca «Ezber» Sekmesi — Uygulama Planı

> **Ajanlar için:** Gerekli alt beceri: `superpowers:subagent-driven-development` (önerilen) ya da
> `superpowers:executing-plans`. Adımlar `- [ ]` onay kutularıyla izlenir.

**Amaç:** Hocanın sınıfta telefonla ezber dinleyip tek dokunuşla işlemesi: «Bugün» (derste olanlar ve öneri),
«Tekrar» (kontrol günü gelenler), «Tablo» (öğrenci × madde); defterden aynı dinleme penceresi; zayıf bağlantıda
bekleyen yazma göstergesi. Eski ezber formu kalkar, eski veri silinmez.

**Mimari:** Saf katman (`src/lib/ezber/metinler.ts` beş dilde adlar ve kalıp notları, `src/lib/ezber/oneri.ts`
sıradaki madde) + Faz 1b'nin `durum.ts`/`depo.ts`'i + ekran modülü `src/scripts/hoca-ezber.ts` (sekme paneli ve
dışa açık dinleme penceresi). Ezber paneli tam SDK'yı (`firebase/firestore`, kalıcı yerel önbellek) yalnız açıldığında
yükler; hoca ekranının geri kalanı `firebase/firestore/lite` ile sürer. Canlı durum `onSnapshot` ile gelir; bekleyen
yazım `metadata.hasPendingWrites`'tan okunur.

**Teknoloji:** TypeScript, Firebase JS SDK 12 (tam + lite), Playwright (sahte Firebase: `tests/web/helpers/mektep.mjs`),
`node:test` + esbuild, `impeccable` tasarım ilkeleri, mevcut Kilim Kartografyası jetonları (`src/styles/global.css`).

**Şartname:** [Ana plan](2026-09-26-ezber-kilimi-ana-plan.md) §4 Faz 1c; veri modeli [Faz 1b planı](2026-09-27-ezber-kilimi-faz-1b-durum.md);
kalıcı özet [`docs/EZBER-KILIMI.md`](../../EZBER-KILIMI.md).

## Genel kısıtlar

- Telefon önce: dokunma hedefi ≥ 44 px, tek elle kullanım, yatay taşma yalnız Tablo'da (kendi kaydırıcısında).
- Veliye giden her metin beş dilde (tr, fr, en, nl, de), yumuşak dil; öğrenci adı hiçbir kalıba girmez.
- Renk tek başına bilgi taşımaz: basamak işareti biçim + metin (erişilebilir ad) taşır. Açık/koyu tema, azaltılmış
  hareket, klavye erişimi.
- Yazım yalnız `depo.uygula` ile (durum + olay tek toplu yazım). Ekran yazımı beklemez; hata ve `EZBER_CAKISMA` mesajla
  döner. «Geri al» = `duzelt` ile önceki hedef.
- `ilerleme/{ref}.ezber` salt okunur: ilerleme kaydı bu alanı okunduğu gibi korur (Faz 1b bulgusu).
- Hoca ekranının diğer sekmeleri lite SDK'da kalır; yeni bağımlılık yok. Canlı veri yok; yayın Faz 1 sonunda.

## İnceleme odağı

1. **Bağlantı yokken dokunuş** kaybolmamalı: ekran hemen güncellenir, «N kayıt bekliyor» görünür, bağlantı gelince
   kaybolur. → Görev 4 testi `bekleyen yazma`.
2. **Yanlış düğme**: hoca «Tekrar gelsin» yerine «Tam»a basarsa «Geri al» önceki durumu aynen getirmeli (sürüm artar).
   → Görev 4 testi `geri al`.
3. **İki telefon aynı maddede** (ortak hesap): ikinci yazım `EZBER_CAKISMA` ile döner, ekran güncel durumu gösterir,
   hiçbir şey sessizce ezilmez. → Görev 4 testi `çakışma`.
4. **Eski form kalkınca ilerleme kaydı** `ezber` alanını silmemeli. → Görev 5 testi `ilerleme ezber korunur`.
5. **Yoklama boşken** «Bugün» boş kalmamalı: aktif öğrencilerin hepsi «yoklama işaretsiz» notuyla listelenir.
   → Görev 4 testi `yoklamasız gün`.

---

## Dosya yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/lib/ezber/metinler.ts` (yeni) | Basamak adları, kalite (hoca etiketi + veliye yumuşak cümle), kalıp notları, defter cümlesi (TR + FR) |
| `src/lib/ezber/oneri.ts` (yeni) | Öğrenci önerisi: kontrolü gelenler, çalıştıkları, sıradaki yeni madde (sınıf hedefi sırası) |
| `src/lib/firebase-tam.ts` (yeni) | Tam SDK Firestore; kalıcı önbellek (çoklu sekme), olmazsa bellek |
| `src/scripts/hoca-ezber.ts` (yeni) | Ezber sekmesi paneli + `ezberDinlemesiAc` (defter de kullanır) |
| `src/styles/hoca-ezber.css` (yeni) | Panel, kartlar, pencere, kilim işaretleri |
| `src/scripts/hoca-ekrani.ts` (değişir) | Sekme, panelin bağlanması, öğrenci kartında özet, ilerleme kaydında `ezber` koruması, WhatsApp karnesi |
| `src/scripts/ders-defteri.ts`, `src/lib/defter-ceviri.ts` (değişir) | «Ezber dinlendi» çipi; defter cümlesinin Fransızcası kalıp sözlüğünde |
| `tests/ezber-metin.test.mjs` (yeni) | Metin ve öneri testleri |
| `tests/web/hoca-ezber.spec.mjs` (yeni), `tests/web/helpers/mektep.mjs` (değişir) | Ekran testleri; sahte tam SDK |

### Görev 1: Metinler ve öneri (saf)

```ts
// metinler.ts
export const BASAMAK_ADLARI: Readonly<Record<Basamak, BesDil>>;
export const KALITE_ETIKETI: Readonly<Record<Kalite, string>>;          // hoca: Tam · Az hatalı · Tekrar gelsin
export const KALITE_VELI: Readonly<Record<Kalite, BesDil>>;             // «Çok güzel okudu» …
export interface NotKalibi { readonly anahtar: string; readonly etiket: string; readonly metin: BesDil }
export const NOT_KALIPLARI: readonly NotKalibi[];
export function notMetni(anahtar: string, dil: Dil): string | null;     // bilinmeyen anahtar → null (gösterilmez)
export function defterCumlesi(id: string, kalite: Kalite): { tr: string; fr: string };
export function defterSozlugu(): Record<string, string>;               // 81 × 3 cümle, TR → FR
// oneri.ts
export interface OgrenciOnerisi { kontrol: readonly string[]; calisiyor: readonly string[]; siradaki: string | null }
export function ogrenciOnerisi(ogeler, bugun: string, hedefler: Readonly<Record<string, string>>): OgrenciOnerisi;
```

Sıradaki yeni madde: kaydı olmayan (gösterilen basamağı 0) maddeler içinde önce sınıf hedefi olanlar (hedef gününe
göre), sonra hedefi olmayanlar katalog sırasıyla.

- [x] Testler: beş dil dolu; kalıp anahtarı kuraldaki biçimde ve tekil; kalıplarda ad yer tutucusu yok; 243 defter
  cümlesinin hepsi tekil ve Fransızcası var; öneri sırası (kontrol → çalışıyor → sıradaki), sınıf hedefi önceliği,
  `s-alak` kaydı `s-alak-1-5`'i sıradaki olmaktan çıkarır.
- [x] Uygula; `test:ezber`'e ekle.

### Görev 2: Tam SDK ve sahte istemci

- [x] `firebase-tam.ts`: `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager:
  persistentMultipleTabManager() }) })`; ikinci çağrıda aynı örnek; hata olursa `getFirestore(app)`.
- [x] `mektep.mjs`: `firebase/firestore` için sahte modül (lite sahtesinin üstüne `onSnapshot`, `deleteField`,
  `getDocFromServer`, `orderBy`, `limit`, `initializeFirestore`, `persistentLocalCache`,
  `persistentMultipleTabManager`, birleştirerek `set`); bekleyen yazma ve çakışma için test düğmeleri.

### Görev 3: Ezber paneli (`hoca-ezber.ts`)

- Başlık satırı: bugünün tarihi, «Bugün · Tekrar · Tablo» sekmesi, bağlantı/bekleyen yazma rozeti.
- **Bugün:** yoklamada «var/geç» olanlar (yoksa aktif herkes + not). Kart: ad, sıradaki madde, kontrol sayısı.
- **Tekrar:** bütün aktif öğrencilerin kontrolü gelen maddeleri, en eskisi önce.
- **Tablo:** şerit seçici (1–8, Amme durakları, kenar); satır öğrenci, sütun madde; hücre = kilim işareti + erişilebilir ad.
- **Dinleme penceresi** (`<dialog>`): öğrenci; madde seçimi (öneriler üstte, «Başka madde» katalog şeritleri); maddenin
  durumu ve kontrol günü; kalıp not çipleri (en çok 3); erken dinlemede «Yine de ilerlet» kutusu; üç büyük düğme
  (dokununca kaydeder); sonuç satırı + «Geri al». Elle basamak (Tablo'dan) aynı pencerede ikincil bölüm.
- **Uygulamadaki sapma (27 Eylül 2026, devredilen karar):** `<dialog>` yerine öğrencinin kartı **yerinde açılır**
  (Tablo'da hücrenin altında panel). Sınıfta telefonla art arda dinlerken açılır pencere odak ve kaydırma yerini
  kaybettirir; kart içi panelde hoca listeyi görmeye devam eder. Defterdeki «Ezber dinlendi» aynı paneli defterin
  içinde açar.
- [x] Ekran testleri (Görev 4 odakları dahil) + axe + Pixel 7 ve masaüstü ekran görüntüsü incelemesi.

### Görev 4: Hoca ekranına bağlama

- [x] Sekme «Ezber» (Ders Defteri'nden sonra); eski «Ezber · Ödev» sekmesinin adı «Haftalık ödev».
- [x] Öğrenci kartı: eski ezber tablosu yerine özet (basamak sayıları, «Ezber sekmesinde aç»); ilerleme kaydı
  `ezber`'i korur; WhatsApp karnesi yeni kayıttan (≥ Hocaya okudu).

### Görev 5: Defter bağlantısı

- [x] Defterde «Ezber dinlendi» çipi aynı pencereyi açar; kayıt sonrası defter cümlesi `calisma`'ya eklenir; Fransızcası
  kalıp sözlüğünden gelir (makineye gitmez). Test: `defter-ceviri` eksik kalıp testi ezber cümlelerini de kapsar.

### Görev 6: Belgeler, doğrulama, commit

- [x] `docs/EZBER-KILIMI.md` hoca akışı; `npm run dogrula:codex`; ekran görüntüleri; commit.

## Sonuç (27 Eylül 2026)

- Ekran testleri `tests/web/hoca-ezber.spec.mjs`: 10 senaryo × 2 cihaz (masaüstü, Pixel 7) geçti; axe açık/koyu temada
  temiz, telefonda yatay taşma yok. Görsel incelemede iki düzeltme yapıldı: «Başka madde» seçim kutusu telefonu 517 px'e
  taşırıyordu; tablo başlıkları sitenin büyük harfli eşaralıklı th'sini alıp «Kelime-i» tiresinden bölünüyordu.
- Mevcut hata (ayrı başlık): öğrenci kartındaki WhatsApp karnesi düğmesi `data-ogr` da taşıdığı için tıklama öğrenci
  seçimi sayılıyordu; karne hiç kopyalanmıyordu (11 Eylül 2026'dan beri). Düzeltildi ve teste bağlandı.
- `npm run dogrula:codex`: design:check, check, dogrula, test:kurallar (53), test:veli-eposta, test:oto-kaydet,
  test:ogrenme geçti. test:web 618/636; kalan 18'in 6'sı `portal-giris` sahtesinde tam SDK karşılığı eksikliğiydi
  (düzeltildi, 24/24), 12'si bilinen tarih bağımlı ana sayfa görsel karşılaştırmaları (bu işten bağımsız, ertelendi).
- Impeccable `detect.mjs`: ezber arayüz dosyalarında bulgu yok.
