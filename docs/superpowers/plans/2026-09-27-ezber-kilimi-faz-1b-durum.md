# Ezber Kilimi Faz 1b — Durum Makinesi, Veri Modeli ve Kurallar — Uygulama Planı

> **Ajanlar için:** Gerekli alt beceri: `superpowers:subagent-driven-development` (önerilen) ya da
> `superpowers:executing-plans`. Adımlar `- [ ]` onay kutularıyla izlenir.

**Amaç:** Hocanın dinlediği ezberi 4 basamaklı durum makinesiyle işleyen saf çekirdeği, bunun Firestore veri modelini
ve güvenlik kurallarını, eski `ilerleme/{ref}.ezber` kayıtlarının geçişini ve öğrenci silme dökümünü kurmak. Ekran
yok (Faz 1c hoca sekmesi, Faz 1d veli kilimi bu katmanın üstüne kurulur).

**Mimari:** Üç katman. (1) `src/lib/ezber/durum.ts`: saf durum makinesi (tarih dizeleriyle çalışır, ekran ve
veritabanı bilmez). (2) `src/lib/ezber/depo.ts`: Firestore bağdaştırıcısı (tam SDK `firebase/firestore`; 1c'deki yerel
önbellek ve bekleyen yazma göstergesi bunu ister). Durum ve olay tek toplu yazımda (batch) gider; eşzamanlılık madde
başına `surum` ile kuralda denetlenir (çevrim dışı kuyruğa giren eski yazım sessizce ezmez, reddedilir).
(3) `firebase/firestore.rules`: öğrenci başına tek belge, yazım başına tek madde (`degisen` bildirir, kural
`diff().affectedKeys()` ile doğrular).

**Teknoloji:** TypeScript (strict), `node:test` + esbuild paketleme (mevcut düzen), Firebase JS SDK 12 (tam),
`@firebase/rules-unit-testing` + Firestore emülatörü (`npm run test:kurallar`, `demo-ulucamii`).

**Şartname:** [Ana plan](2026-09-26-ezber-kilimi-ana-plan.md) §3.3 (Durum makinesi), §3.4 (Firestore veri modeli ve
kurallar), §4 Faz 1b, §7 (Doğrulama). Kalıcı özet: [`docs/EZBER-KILIMI.md`](../../EZBER-KILIMI.md). Önceki faz:
[Faz 1a planı](2026-09-27-ezber-kilimi-faz-1a-katalog.md).

## Genel kısıtlar

- **Basamaklar:** 0 yok · 1 Çalışıyor · 2 Hocaya okudu · 3 Pekişti · 4 Kalıcı. Kayıtta yalnız 1–4 durur (0 = kayıt yok).
- **Dinleme (tam / az hatalı):** 0–1 → 2, kontrol +7 gün · 2 ve kontrol günü gelmiş → 3, kontrol +30 gün ·
  3 ve kontrol günü gelmiş → 4, kontrol yok. Kontrol gününden önceki dinleme yalnız olay olur; «yine de ilerlet»
  (`zorla`) açıkça ilerletir ve olayda işaretlenir.
- **«Tekrar gelsin»:** her zaman bir basamak düşürür (en az 1), kontrol +7 gün.
- **Ödül eşikleri (onaylı):** rozet = bölümdeki tümü ≥ 2 · sertifika = tümü ≥ 3 · altın kenar = tümü 4. Bölüm: 1–8.
  şeritler ve Amme'nin 5 durağı. Kenar suyu seviye dışıdır, ödülü yoktur.
- **Geçiş (öneri kesinleşti):** `ogrendi` → 2 (kontrol geçiş günü +7) · `tekrar` → 1 · `baslamadi` → kayıt açılmaz.
  Yeni sistemde kaydı olan madde ezilmez. Eşleşmeyen anahtar ya da tanınmayan değer varsa hiçbir şey yazılmaz.
- **Yetki:** `ezberDurum` hoca yazar, veli okur (`veliOkur(ref)`), idari kilitte (`islemeAcik`) yazım yok.
  Olaylar yalnız eklenir; güncellenmez; yalnız hoca siler (öğrenci silme). Rastgele giriş yapmış kullanıcı hiçbir
  ezber verisine erişemez.
- **Veliye not:** yalnız kalıp anahtarı (en çok 3, `^[a-z0-9-]{1,40}$`); serbest metin ezber kaydına girmez (serbest
  söz ders defterinde kalır; oranın çeviri hattı var). Öğrenci adı hiçbir kalıba girmez. Kalıp metinleri Faz 1c.
- `ezberUyeleri` (genel cemaat hesabı) ve `oneriler` (seviye testi önerisi) **Faz 3'e** kalır: yazanı olmayan alan
  kurala girmez.
- Canlı veri yok: testler yalnız emülatör (`demo-ulucamii`). Geçiş betiği canlıda ancak yayın adımında, önce kuru.
- `hoca-ekrani.ts`, `veli-portali.ts` bu fazda değişmez. İhtida bölümüne dokunulmaz. Commit yalnız `ezber-kilimi`.

## İnceleme odağı

1. **İki telefon aynı öğrenciye yazar** (ortak hoca hesabı): farklı maddeler birbirini ezmemeli; aynı maddede eski
   sürüme dayanan yazım reddedilmeli ve olay da yazılmamalı (toplu yazım). → Görev 3 testi `eşzamanlı yazım`.
2. **Kontrol günü tam bugün** (`sonrakiKontrol == bugun`) gelmiş sayılmalı; ay/yıl dönümü (28 Aralık + 7) doğru
   hesaplanmalı. → Görev 1 testi `kontrol günü sınırı`.
3. **Firestore'dan bozuk ya da katalog dışı madde gelirse** (elle düzeltme, eski sürüm) veli ekranı çökmemeli; madde
   yok sayılmalı. → Görev 1 testi `ezberDurumuOku`.
4. **Geçiş iki kez çalıştırılırsa** ikinci koşu hiçbir şey yazmamalı; bu arada hocanın yeni kaydı ezilmemeli.
   → Görev 4 testi `geçiş tekrar`.
5. **Silinen öğrencinin açık kalmış ekranı** yazmaya devam ederse ne durum belgesi ne sahipsiz olay oluşmalı.
   → Görev 3 testi `silinen öğrenci`.

---

## Dosya yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/lib/ezber/durum.ts` (yeni) | Saf durum makinesi, okuma süzgeci, tekrar sırası, bölüm ve ödül özeti |
| `src/lib/ezber/gecis.ts` (yeni) | Eski `ilerleme.ezber` → yazılacak geçişler planı (saf) |
| `src/lib/ezber/depo.ts` (yeni) | Firestore: durum oku, geçişi uygula (durum + olay tek toplu yazım), olayları oku |
| `firebase/firestore.rules` (değişir) | `ezberDurum/{ref}` + `olaylar`; `evCalismalari` katalog kimliği kalıbı |
| `src/lib/portal-idare.ts` (değişir) | Silme dökümüne `ezberDurum` belgesi ve olayları |
| `scripts/ezber-gecis.mjs` (yeni) | Geçiş betiği: kuru (varsayılan) / `--yaz`; yalnız sayı yazar |
| `tests/ezber-durum.test.mjs` (yeni) | Durum makinesi ve geçiş planı testleri |
| `tests/kurallar/firestore.test.mjs` (değişir) | Kural, depo, geçiş ve silme testleri (emülatör) |
| `package.json` (değişir) | `test:ezber` iki dosyayı koşar; `ezber:gecis` betiği |
| `.github/workflows/deploy.yml` (değişir) | `npm run test:ezber` yayın kapısı (kimlikler artık Firestore anahtarı) |
| `docs/EZBER-KILIMI.md` (değişir) | Durum makinesi, veri modeli, geçiş kararı, bilinen sınırlar |

## Veri modeli

```text
ezberDurum/{ref}
  ogeler: { <katalogId>: { basamak: 1..4, kalite: ''|'tam'|'az'|'tekrar', notlar: [kalıp ≤ 3],
                           son: sunucu zamanı, sonrakiKontrol: 'YYYY-AA-GG' | '', surum: 1,2,… } }
  degisen: <katalogId>      // bu yazımda değişen tek madde
  guncelleme: sunucu zamanı
ezberDurum/{ref}/olaylar/{otomatik}
  ezber, tur: 'atama'|'dinleme'|'duzeltme'|'gecis', kalite, notlar, basamakOnce 0..4, basamakSonra 0..4,
  zorla: bool, tarih: 'YYYY-AA-GG' (ders günü, Brüksel), zaman: sunucu zamanı
```

Tutarlılık (kural da denetler): basamak 2–3 → `sonrakiKontrol` dolu; basamak 4 → boş; `dinleme` ⇔ kalite dolu;
`zorla` yalnız dinlemede; `atama` 0 → 1; `gecis` 0 → 1 ya da 2.

Neden öğrenci başına tek belge: «Bugün», «Tekrar kuyruğu» ve «Tablo» görünümleri sınıfın tamamını okur. Madde başına
belge 30 öğrenci × 81 madde = 2.430 okuma demek (Spark günlük 50.000); tek belgede 30 okuma.

---

### Görev 1: Saf durum makinesi (`src/lib/ezber/durum.ts`)

**Dosyalar:** oluştur `src/lib/ezber/durum.ts`, `tests/ezber-durum.test.mjs`; değiştir `package.json` (`test:ezber`).

**Arayüz (sonraki görevler bunu kullanır):**

```ts
export type Basamak = 0 | 1 | 2 | 3 | 4;
export type Kalite = 'tam' | 'az' | 'tekrar';
export type OlayTuru = 'atama' | 'dinleme' | 'duzeltme' | 'gecis';
export const PEKISME_GUN = 7, KALICILIK_GUN = 30, TEKRAR_GUN = 7, NOT_SINIRI = 3;
export interface OgeDurumu { basamak: 1|2|3|4; kalite: Kalite|''; notlar: readonly string[]; sonrakiKontrol: string; surum: number }
export type Hedef = Omit<OgeDurumu, 'surum'>;
export interface EzberOlayi { ezber: string; tur: OlayTuru; kalite: Kalite|''; notlar: readonly string[];
  basamakOnce: Basamak; basamakSonra: Basamak; zorla: boolean; tarih: string }
export type Gecis =
  | { islem: 'yaz'; durum: OgeDurumu; olay: EzberOlayi }
  | { islem: 'sil'; olay: EzberOlayi }
  | { islem: 'olay'; olay: EzberOlayi };           // durum değişmez, yalnız olay
export function kontrolGeldi(d: OgeDurumu | undefined, bugun: string): boolean;
export function dinle(onceki: OgeDurumu | undefined, id: string, kalite: Kalite, bugun: string,
  secenek?: { notlar?: readonly string[]; zorla?: boolean }): Gecis;
export function ata(onceki: OgeDurumu | undefined, id: string, bugun: string): Gecis | null;
export function elleBasamak(basamak: Basamak, onceki: OgeDurumu | undefined, bugun: string): Hedef | null;
export function duzelt(onceki: OgeDurumu | undefined, id: string, hedef: Hedef | null, bugun: string): Gecis | null;
export function gecisDurumu(eski: EskiDurum, id: string, bugun: string): Gecis | null;
export function ogeDurumuOku(x: unknown): OgeDurumu | null;
export function ezberDurumuOku(veri: unknown): Record<string, OgeDurumu>;   // katalog dışı ve bozuk maddeler düşer
export function kontrolSirasi(ogeler: Readonly<Record<string, OgeDurumu>>, bugun: string): string[];
export interface Bolum { anahtar: string; seviye: Seviye; durak?: number; odullu: boolean; ogeler: readonly string[] }
export function bolumler(katalog?: Katalog): Bolum[];                      // 1..8, 8.1..8.5, kenar
export interface BolumOzeti { bolum: Bolum; sayilar: readonly [number, number, number, number, number];
  rozet: boolean; sertifika: boolean; altin: boolean }
export function bolumOzeti(bolum: Bolum, ogeler: Readonly<Record<string, OgeDurumu>>): BolumOzeti;
```

Hatalar (`Error` fırlatır; ekran bu iletiyi gösterir): katalog dışı kimlik, geçersiz gün, geçersiz kalite, 3'ten çok
ya da kalıba uymayan ya da yinelenen not.

- [ ] **Adım 1: Başarısız testleri yaz** (`tests/ezber-durum.test.mjs`): geçiş tablosu (0/1 + tam/az → 2 +7;
  2 erken → olay; 2 günü gelmiş → 3 +30; 2 erken + zorla → 3 ve `zorla: true`; 3 → 4 kontrol boş; 4 + tam → olay;
  tekrar 0→1, 1→1, 2→1, 3→2, 4→3, hepsi +7); `surum` artışı; kontrol günü sınırı (`== bugun` gelmiş) ve yıl dönümü
  (`2026-12-28` + 7 = `2027-01-04`); `ata`, `elleBasamak`, `duzelt` (aynı hedef → `null`, 0 → `sil`);
  `gecisDurumu` üç değer; `ezberDurumuOku` bozuk/katalog dışı süzgeci; `kontrolSirasi` sırası; `bolumler`
  (14 bölüm, 8.1–8.5 = 10/4/4/4/3, kenar ödülsüz, 1–8 toplamı 68, kenar 13); `bolumOzeti` eşikleri; hata iletileri.
- [ ] **Adım 2:** `node --test tests/ezber-durum.test.mjs` → modül yok hatasıyla düşer.
- [ ] **Adım 3:** `durum.ts`'i yaz (gün işlemleri `ogrenme-ilerleme.ts`'teki `gunGecerli` / `tarihEkle`'den; yeniden yazılmaz).
- [ ] **Adım 4:** testler yeşil; `package.json` → `"test:ezber": "node --test tests/ezber-katalog.test.mjs tests/ezber-durum.test.mjs"`.

### Görev 2: Geçiş planı (`src/lib/ezber/gecis.ts`)

**Arayüz:**

```ts
export interface GecisGirdisi { ref: string; ezber: Record<string, unknown> }
export interface GecisPlani {
  yazilacak: { ref: string; id: string; gecis: Gecis }[];
  ogrenci: number; ezberli: number; atlanan: number; karsiliksiz: number;
  eslesmeyen: string[]; bilinmeyenDurum: string[];      // doluysa hiçbir şey yazılmaz
  basamaklar: Record<'1' | '2', number>;
}
export function gecisPlani(girdi: GecisGirdisi[], mevcut: Readonly<Record<string, Readonly<Record<string, OgeDurumu>>>>, bugun: string): GecisPlani;
```

- [ ] Başarısız testler: aynı maddeye iki dize → en ileri durum; mevcut kayıt atlanır (`atlanan`); `baslamadi`
  yazılmaz; eşleşmeyen dize ve bilinmeyen değer listelenir; ikinci koşuda (mevcut = ilk koşunun sonucu) yazılacak 0.
- [ ] Uygula (`eskiEzberGecisi` + `gecisDurumu`), testler yeşil.

### Görev 3: Kurallar ve depo (`firebase/firestore.rules`, `src/lib/ezber/depo.ts`)

**Kural (öz):**

```text
match /ezberDurum/{ref} {
  allow read: if hoca() || veliOkur(ref);
  allow create: if hoca() && islemeAcik(ref) && exists(ogrenciler/ref) && ezberBelgesi()
    && d.ogeler.keys().hasOnly([d.degisen]) && d.degisen in d.ogeler && ezberOgesi(d.degisen, d.ogeler, {});
  allow update: if hoca() && islemeAcik(ref) && ezberBelgesi()
    && d.ogeler.diff(resource.data.ogeler).affectedKeys().hasOnly([d.degisen])
    && ezberOgesi(d.degisen, d.ogeler, resource.data.ogeler);          // madde silme serbest (hocanın düzeltmesi)
  allow delete: if hoca();
  match /olaylar/{olay} {
    allow read: if hoca() || veliOkur(ref);
    allow create: if hoca() && islemeAcik(ref) && existsAfter(ezberDurum/ref) && olayGecerli();
    allow delete: if hoca();                                           // güncelleme yok
  }
}
```

`ezberOgesi`: kimlik kalıbı `^[sdb]-[a-z0-9]+(-[a-z0-9]+)*$` (≤ 40), alanlar tam olarak altı, basamak 1–4, kalite
kümesi, not listesi (≤ 3, her biri kalıp anahtarı), `son == request.time`, kontrol biçimi ve basamakla tutarlılığı,
`surum == eski + 1` (yeni maddede 1). Belge: yalnız `ogeler`, `degisen`, `guncelleme == request.time`, `ogeler`
en çok 150 madde. `evCalismalari`: eski 19 `ezber-*` kimliği kalır, yanına `^ezber-[sdb]-…$` katalog kalıbı.

**Depo arayüzü:**

```ts
export const EZBER_CAKISMA = 'EZBER_CAKISMA';
export function ezberDeposu(db: Firestore, ref: string): {
  oku(): Promise<Record<string, OgeDurumu>>;
  uygula(id: string, gecis: Gecis): Promise<void>;   // durum (set-merge) + olay, tek toplu yazım
  olaylar(sinir?: number): Promise<(EzberOlayi & { id: string; zamanMs: number })[]>;
};
```

Çakışma: reddedilen yazımdan sonra sunucudaki `surum` beklenenden farklıysa `Error(EZBER_CAKISMA)` fırlatılır.

- [ ] Başarısız emülatör testleri: hoca yazar/okur, bağlı veli okur; diğer veli, anonim, doğrulanmamış ve kayıtsız
  doğrulanmış hesap okuyamaz/yazamaz; veli yazamaz; bozuk biçimler (basamak 0/5, kalite, 4 not, not tipi, kontrol
  biçimi, 2 + boş kontrol, 4 + dolu kontrol, sürüm atlama, sürüm artmaması, iki madde birden, `degisen` uyuşmazlığı,
  fazla alan, istemci saati, geçersiz kimlik) reddedilir; öğrenci yoksa oluşturulamaz; idari kilit yazımı durdurur;
  olay güncellenemez, veli olay yazamaz, sahipsiz olay reddedilir; eşzamanlı yazım (farklı madde geçer, aynı maddede
  eski sürüm `EZBER_CAKISMA` ve olay yazılmaz); silinen öğrencinin açık ekranı yazamaz; `evCalismalari`
  `ezber-s-fatiha` geçer, `ezber-x-fatiha` düşer, eski `ezber-fatiha` sürer.
- [ ] Kuralları ve depoyu yaz; `npm run test:kurallar` yeşil. Denetçi beceriyle (`firebase-security-rules-auditor`)
  yeni bölümü tara; bulgu varsa test + düzeltme.

### Görev 4: Silme dökümü, geçiş betiği, belgeler

- [ ] `portal-idare.ts`: `ezberDurum/{ref}` («Ezber durumu») ve `ezberDurum/{ref}/olaylar` («Ezber olayları»)
  dökümde; «ev» kapsamı dokunmaz, «tüm» siler. Emülatör testi: silme sonrası ikisi de yok, kardeşinki duruyor.
- [ ] `scripts/ezber-gecis.mjs`: `defter-cevir.mjs` düzeni (HOCA_EPOSTA/HOCA_SIFRE, istemci SDK, kurallar
  geçerli). Varsayılan kuru; `--yaz` yalnız eşleşmeyen/bilinmeyen yoksa. Çıktı yalnız sayılar ve plan dizeleri
  (öğrenci kimliği/adı yazılmaz). Emülatör testi: tohumlanan `ilerleme` → geçiş → doğru `ezberDurum`; ikinci koşu 0.
- [ ] `.github/workflows/deploy.yml`: derlemeden sonra «Ezber kataloğu ve durum makinesi» adımı (`npm run test:ezber`).
- [ ] `docs/EZBER-KILIMI.md`: «Durum makinesi ve veri modeli» bölümü, geçiş kararı (6. madde kesinleşti), bilinen
  sınırlar (silme dökümü 400 belge sınırı olaylarla daha erken dolabilir; `ezberUyeleri`/`oneriler` Faz 3).
- [ ] `npx astro check`, `npm run test:ezber`, `npm run test:kurallar`, `npm run dogrula:codex`; commit.
- [ ] Kurallar canlıya: `npm run firebase:kurallar` bir kez denenir (eklemeli kural; mevcut akış değişmez). İzin
  denetimi reddederse Rıdvan'ın adımlarına yazılır. Yayınlanırsa `docs/YAYIN-KAYITLARI.md` kaydı.
