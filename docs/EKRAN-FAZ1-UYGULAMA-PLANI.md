# Cami Ekranı — Faz 1 Uygulama Planı (site tarafı: ekran sayfası MVP)

> **Ajanlar için:** Bu plan görev görev uygulanır; zorunlu alt skill `superpowers:subagent-driven-development`
> (önerilen) ya da `superpowers:executing-plans`. Adımlar `- [ ]` kutularıyla izlenir.

**Amaç:** `ulucamii.be/ekran/` adresinde, dikey asılan monitörde Diyanet vakitlerini sürekli gösteren, duyuru, günün ayeti ve günün hadisini TR + FR sırayla döndüren, internet kesilse de açılan bir ekran sayfası yayımlamak.

**Mimari:** Veri derleme anında üç statik JSON akışına dönüşür: `vakitler.json` (Diyanet kapısından geçer), `akis.json` (CMS duyuruları ve ekran ayarları), `icerik.json` (onaylı ayet ve hadisler). Sayfa statik bir iskelettir. Görüntüyü, esbuild ile Chromium 70 sözdizimine indirilmiş çerçevesiz bir istemci paketi (`/ekran/ekran.js`) doldurur. Karar veren her şey saf fonksiyonlardır ve `src/lib/ekran/` altında durur; node:test ile sınanır. DOM katmanı `src/ekran/` altındadır ve Playwright ile sınanır.

**Teknoloji:** Astro 7 statik uç noktaları, TypeScript (testlerde Node 24 tip ayıklama), esbuild (`chrome70` hedefi), düz DOM, Sveltia CMS, node:test, Playwright 1.63 (`page.clock`), Open-Meteo.

**Spesifikasyon:** `docs/EKRAN-YOL-HARITASI.md` (27 Eylül 2026'da onaylandı). Bu plan onun Faz 1'idir.

## Çalışma ortamı

- **Çalışma ağacı:** `D:\tmp\ulucamii-ekran-mvp`, dal `ekran-mvp`. Git Bash'te `cd /d/tmp/ulucamii-ekran-mvp`. Ana depoda (`main`) başka bir oturum çalışıyor; ona dokunulmaz.
- **node_modules:** Ana depoya bağlantıdır (junction). Bu ağaçta **`npm install` çalıştırılmaz**, çünkü ana deponun paketlerini değiştirir. Planın ek bağımlılığı yoktur: esbuild, preact ve qrcode zaten kurulu.
- **Başlangıç ölçümü (27 Eylül 2026):** `npm run build` 1890 sayfayı 44 saniyede derliyor. `node scripts/site-denetim.mjs` çıktısı `orta=2 dusuk=58`, kritik bulgu yok. Bu ölçüm karşılaştırma tabanıdır.
- **Vakit verisi:** `src/data/namaz-vakitleri.json` 2026-09-25 ile 2026-10-26 arasını ve 2027'nin tamamını kapsıyor; arada 67 günlük boşluk var. Günlük Diyanet işi yaklaşık 30 gün ileriyi dolduruyor. Bu yüzden testler sabit tarih kullanmaz, günleri veriden seçer. Denetim de kapsamı bugünden itibaren **kesintisiz** gün sayısıyla ölçer.

## Genel kısıtlar

- Vakitler yalnız Diyanet'ten gelir (ilçe `11890`, M.FAMENNE). `kaynakTuru !== 'diyanet'` ya da başka bir ilçe derlemeyi durdurur. Hesapla vakit üretilmez, yedek kaynak yoktur. Bugünün kaydı yoksa ekranda "Namaz vakitleri güncellenemedi / Horaires de prière indisponibles" yazar.
- TR ve FR aynı slaytta alt alta durur. Ayet ve hadiste Arapça aslı en üstte yer alır. Vakit adları sitenin sözlüğünden gelir (`src/i18n/ui.ts`, `namaz.*`). Cuma günü öğle satırı "Cuma · Vendredi" olur; bu, sitenin kendi kısa etiketidir.
- Tuval dikey 9:16'dır. `?don=90|270` tuvali CSS ile döndürür, `?ekran=ana|giris|kadin` hedeflemeyi seçer (geçersiz değer `ana` sayılır).
- Slayt süresi `min(enCokSn, max(enAzSn, tabanSn + karakterSn × karakter))` formülüyle bulunur. Değerler `src/content/ayarlar/ekran.yaml` dosyasındadır (8 / 0,05 / 10 / 30).
- Tema güneş vaktinden akşam vaktine kadar açık, diğer saatlerde koyudur.
- Renkler ve adlar yalnız `src/data/kurumsal-kimlik.json` dosyasından gelir; elle renk yazılmaz. Yazı tipleri Work Sans ve Arapça için Amiri'dir. Logolar SVG'dir, ekranda raster logo kullanılmaz.
- Sayfa `noindex, nofollow` işaretlidir ve `robots.txt` içinde `Disallow: /ekran/` bulunur.
- **Eski WebView uyumu (Chromium 70):**
  - İstemci paketi esbuild `target: ['chrome70']` ile üretilir.
  - Kodda şunlar kullanılmaz: `.at()`, `Object.fromEntries`, `Object.hasOwn`, `replaceAll`, `structuredClone`, `Promise.allSettled`, `findLast`.
  - CSS'te şunlar kullanılmaz: `oklch`, `color-mix`, `clamp/min/max()`, `:has`, `@layer`, `@container`, `cq*`/`dvh` birimleri, `inset`, `aspect-ratio`, `gap`, `&`.
  - Bütün ölçüler `--u` değişkenine bağlıdır: tuval genişliğinin %1'i, JS ile verilir.
- Ekran cihazın saat diliminden bağımsız olarak Brüksel saatini gösterir. Kutuların saat dilimi UTC olabilir.
- Yalnız `durum: "imam-onayli"` ayet ve hadis yayına girer. Metinler resmî Diyanet yayınlarından alınır; `D:\ihtisas` arşivinden metin kopyalanmaz.
- Hava Open-Meteo'dan 30 dakikada bir alınır. Veri 3 saatten eskiyse gösterilmez. Ekranda "Open-Meteo" ibaresi bulunur.
- İmamın telefonu hiçbir yerde görünmez. Yalnız dernek hesapları kullanılır: GitHub `ulucamii2026`.
- Commit mesajları Türkçe yazılır ve şu satırla biter: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Dikkat edilecek beş kırılma noktası

Hiçbir görevin olağan yolu bunları kendiliğinden sınamaz. Her birinin testi, sahibi olan göreve eklendi.

1. **Eski WebView:** Hesapsız kurulan Android 9 kutusunda WebView Chromium 70 civarında kalır. Tek bir modern API ya da CSS özelliği ekranı boş bırakır. Paket taraması Görev 5'te, `tests/ekran-eski-tarayici.test.mjs` dosyasındadır.
2. **Gece yarısı ve yaz saati:** Sayfa yeniden yüklenmeden aylarca açık kalır. Tarih gece yarısında, saat de 25 Ekim 2026'daki geri alışta doğru değişmeli. Testler Görev 4 (birim) ve Görev 5'tedir (Playwright, New York saat diliminde).
3. **Uzun TR/FR metin:** 160 karakterlik ekran metni ve uzun başlık slayt alanından taşmamalı. Test Görev 7'dedir.
4. **Akış arızası:** Deploy ya da ağ hatası akışı 500 döndürür ya da bozuk JSON verir. Ekran son sağlam veriyle dönmeye devam etmeli. Testler Görev 5 (birim, `tazele`) ve Görev 7'dedir (Playwright).
5. **Bugünün Diyanet kaydı yok:** Başka bir günün vakti bugünün gibi gösterilmemeli; geri sayım ve vurgu olmamalı. Testler Görev 4 (birim) ve Görev 6'dadır (Playwright).

---

### Görev 1: Diyanet kapısı ve `/ekran/vakitler.json`

**Dosyalar:**
- Oluştur: `src/lib/ekran/vakit-kapisi.ts`
- Oluştur: `src/pages/ekran/vakitler.json.ts`
- Oluştur: `tests/ekran-vakit-kapisi.test.mjs`
- Değiştir: `public/robots.txt`

**Arayüzler:**
- Kullanır: `src/lib/namaz.ts` → `SIRA`, `type Gun`. `src/lib/icerik.ts` → `bugunBrussels()`.
- Üretir: `ekranVakitleri(veri: VakitKaynagi, bugun: string): EkranVakitleri`, `gunGecerliMi(g: Gun): boolean`, `DIYANET_ILCE`, `type EkranVakitleri = { kaynak; kaynakTuru: 'diyanet'; ilce; ilceAdi?; guncelleme; gunler: Gun[]; atlanan: string[] }`.

- [ ] **Adım 1: Başarısız testi yaz.** Dosya: `tests/ekran-vakit-kapisi.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ekranVakitleri, gunGecerliMi } from '../src/lib/ekran/vakit-kapisi.ts';

const gun = (tarih, ek = {}) => ({ tarih, hicri: '15 Rebiulahir 1448', imsak: '05:41', gunes: '07:24', ogle: '13:35', ikindi: '16:49', aksam: '19:37', yatsi: '21:06', ...ek });
const gunler = (bas, n) => Array.from({ length: n }, (_, i) => gun(new Date(Date.parse(bas + 'T12:00:00Z') + i * 864e5).toISOString().slice(0, 10)));
const veri = (liste, ek = {}) => ({ kaynak: 'Diyanet', kaynakTuru: 'diyanet', ilce: '11890', ilceAdi: 'M.FAMENNE', guncelleme: '2026-09-26T08:00:00Z', gunler: liste, ...ek });

test('Diyanet verisi dünden itibaren sıralı ve eksiksiz verilir', () => {
  const s = ekranVakitleri(veri(gunler('2026-09-20', 20).reverse()), '2026-09-27');
  assert.equal(s.gunler[0].tarih, '2026-09-26');
  assert.equal(s.gunler[s.gunler.length - 1].tarih, '2026-10-09');
  assert.equal(s.kaynakTuru, 'diyanet');
  assert.deepEqual(s.atlanan, []);
});

test('kaynağı Diyanet olmayan ya da başka ilçenin verisi derlemeyi durdurur', () => {
  assert.throws(() => ekranVakitleri(veri(gunler('2026-09-26', 10), { kaynakTuru: 'aladhan' }), '2026-09-27'), /REDDEDİLDİ.*aladhan/);
  assert.throws(() => ekranVakitleri(veri(gunler('2026-09-26', 10), { kaynakTuru: undefined }), '2026-09-27'), /REDDEDİLDİ/);
  assert.throws(() => ekranVakitleri(veri(gunler('2026-09-26', 10), { ilce: '9541' }), '2026-09-27'), /ilçe/);
});

test('biçimi ya da sırası bozuk gün ve mükerrer tarih yayımlanmaz, hesapla onarılmaz', () => {
  const g = gunler('2026-09-26', 10);
  g[2] = gun(g[2].tarih, { ogle: '1:35' });
  g[3] = gun(g[3].tarih, { aksam: '16:00' });
  g.push(gun(g[4].tarih, { yatsi: '21:10' }));
  const s = ekranVakitleri(veri(g), '2026-09-27');
  assert.deepEqual(s.atlanan, [g[2].tarih, g[3].tarih, g[4].tarih]);
  assert.ok(!s.gunler.some((x) => s.atlanan.includes(x.tarih)));
});

test('yediden az geçerli gün kalırsa derleme durur', () => {
  assert.throws(() => ekranVakitleri(veri(gunler('2026-09-26', 6)), '2026-09-27'), /yalnız 6/);
});

test('gunGecerliMi saat biçimini ve vakit sırasını denetler', () => {
  assert.equal(gunGecerliMi(gun('2026-09-27')), true);
  assert.equal(gunGecerliMi(gun('2026-09-27', { imsak: '24:10' })), false);
  assert.equal(gunGecerliMi(gun('2026-09-27', { gunes: '05:00' })), false);
});
```

- [ ] **Adım 2: Testin başarısız olduğunu gör.** Komut: `node --test tests/ekran-vakit-kapisi.test.mjs`. Beklenen: modül bulunamadığı için FAIL (`ERR_MODULE_NOT_FOUND`).

- [ ] **Adım 3: Kapıyı yaz.** Dosya: `src/lib/ekran/vakit-kapisi.ts`

```ts
/**
 * Cami ekranının vakit akışı (/ekran/vakitler.json) için Diyanet kapısı — 27 Eylül 2026.
 *
 * KALICI KURAL: vakitler yalnız Diyanet İşleri Başkanlığı verisidir (ilçe 11890, M.FAMENNE). Kaynağı
 * Diyanet olmayan ya da başka ilçenin dosyası derlemeyi durdurur (src/lib/icerik.ts → namazVakitleri()
 * ile aynı karar). Biçimi/sırası bozuk ya da mükerrer bir gün yayımlanmaz ve hesapla onarılmaz: ekran
 * o gün "Namaz vakitleri güncellenemedi" der. Ekran internetsiz haftalarca çalışabilsin diye sitedeki
 * 46 günlük pencere yerine dünden itibaren eldeki bütün günler verilir.
 */
import { SIRA, type Gun } from '../namaz.ts';

export const DIYANET_ILCE = '11890';
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
const TARIH = /^\d{4}-\d{2}-\d{2}$/;

export interface VakitKaynagi {
  kaynak: string;
  kaynakTuru?: string;
  ilce: string;
  ilceAdi?: string;
  guncelleme: string;
  gunler: Gun[];
}

export interface EkranVakitleri {
  kaynak: string;
  kaynakTuru: 'diyanet';
  ilce: string;
  ilceAdi?: string;
  guncelleme: string;
  gunler: Gun[];
  /** Yayımlanmayan (bozuk ya da mükerrer) günler; site denetimi bunları raporlar. */
  atlanan: string[];
}

/** Altı vakit HH:MM biçiminde ve imsak < güneş < öğle < ikindi < akşam < yatsı sırasında mı */
export function gunGecerliMi(g: Gun): boolean {
  if (!TARIH.test(g.tarih) || typeof g.hicri !== 'string') return false;
  for (let i = 0; i < SIRA.length; i++) {
    const saat = g[SIRA[i]];
    if (typeof saat !== 'string' || !SAAT.test(saat)) return false;
    if (i > 0 && !(g[SIRA[i - 1]] < saat)) return false;
  }
  return true;
}

const oncekiGun = (tarih: string): string =>
  new Date(Date.parse(tarih + 'T12:00:00Z') - 86_400_000).toISOString().slice(0, 10);

export function ekranVakitleri(veri: VakitKaynagi, bugun: string): EkranVakitleri {
  if (veri.kaynakTuru !== 'diyanet') {
    throw new Error(`EKRAN VAKİTLERİ REDDEDİLDİ: kaynakTuru="${veri.kaynakTuru ?? 'yok'}" (beklenen: "diyanet"). Build durduruldu.`);
  }
  if (veri.ilce !== DIYANET_ILCE) {
    throw new Error(`EKRAN VAKİTLERİ REDDEDİLDİ: ilçe "${veri.ilce}" (beklenen: "${DIYANET_ILCE}", M.FAMENNE). Build durduruldu.`);
  }
  const dun = oncekiGun(bugun);
  const aday = veri.gunler.filter((g) => typeof g.tarih === 'string' && g.tarih >= dun);
  const sayi = new Map<string, number>();
  for (const g of aday) sayi.set(g.tarih, (sayi.get(g.tarih) ?? 0) + 1);
  const atlanan = new Set<string>();
  const gunler: Gun[] = [];
  for (const g of [...aday].sort((a, b) => a.tarih.localeCompare(b.tarih))) {
    if ((sayi.get(g.tarih) ?? 0) > 1 || !gunGecerliMi(g)) { atlanan.add(g.tarih); continue; }
    gunler.push({ tarih: g.tarih, hicri: g.hicri, imsak: g.imsak, gunes: g.gunes, ogle: g.ogle, ikindi: g.ikindi, aksam: g.aksam, yatsi: g.yatsi });
  }
  if (gunler.length < 7) {
    throw new Error(`EKRAN VAKİTLERİ REDDEDİLDİ: dünden itibaren yalnız ${gunler.length} geçerli gün var. Build durduruldu.`);
  }
  return { kaynak: veri.kaynak, kaynakTuru: 'diyanet', ilce: veri.ilce, ilceAdi: veri.ilceAdi, guncelleme: veri.guncelleme, gunler, atlanan: [...atlanan].sort() };
}
```

- [ ] **Adım 4: Testin geçtiğini gör.** Komut: `node --test tests/ekran-vakit-kapisi.test.mjs`. Beklenen: 5 test PASS.

- [ ] **Adım 5: Uç noktayı yaz.** Dosya: `src/pages/ekran/vakitler.json.ts`

```ts
/**
 * /ekran/vakitler.json — cami ekranının vakit akışı (derleme anında; site her gün 03:30 UTC'de yeniden
 * derlenir). Kapı: src/lib/ekran/vakit-kapisi.ts (yalnız Diyanet, ilçe 11890; bozuk gün yayımlanmaz).
 */
import type { APIRoute } from 'astro';
import namaz from '../../data/namaz-vakitleri.json';
import { bugunBrussels } from '../../lib/icerik';
import { ekranVakitleri, type VakitKaynagi } from '../../lib/ekran/vakit-kapisi.ts';

export const GET: APIRoute = () => {
  const govde = ekranVakitleri(namaz as VakitKaynagi, bugunBrussels());
  if (govde.atlanan.length) console.warn(`[ekran] UYARI: biçimi/sırası bozuk ${govde.atlanan.length} gün yayımlanmadı: ${govde.atlanan.join(', ')}`);
  return new Response(JSON.stringify(govde), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
```

- [ ] **Adım 6: `robots.txt` dosyasına ekran yasağını ekle.** `public/robots.txt` dosyasının tamamı şöyle olacak:

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /ekran/
Sitemap: https://ulucamii.be/sitemap-index.xml
```

- [ ] **Adım 7: Derleyip çıktıyı doğrula.** Komut: `npm run build && node -e "const v=require('./dist/ekran/vakitler.json'); console.log(v.kaynakTuru, v.ilce, v.gunler.length, v.gunler[0].tarih, v.atlanan.length)"`. Beklenen (27 Eylül 2026'da derlenirse): `diyanet 11890 396 2026-09-26 0`. Başka bir gün derlenince gün sayısı ve ilk tarih kayar.

- [ ] **Adım 8: Commit.**

```bash
git add src/lib/ekran/vakit-kapisi.ts src/pages/ekran/vakitler.json.ts tests/ekran-vakit-kapisi.test.mjs public/robots.txt
git commit -m "Ekran: Diyanet kapılı vakit akışı (/ekran/vakitler.json)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 2: Duyuruların ekran alanları, ekran ayarları ve `/ekran/akis.json`

**Dosyalar:**
- Oluştur: `src/lib/ekran/akis.ts`
- Oluştur: `src/content/ayarlar/ekran.yaml`
- Oluştur: `src/pages/ekran/akis.json.ts`
- Oluştur: `tests/ekran-akis.test.mjs`
- Değiştir: `src/content.config.ts`. Duyuru şemasına beş düz alan eklenir; yeni `ekranAyar` koleksiyonu açılır ve `collections` dışa aktarımına eklenir.
- Değiştir: `public/admin/icerik/config.yml`. Duyuru alanlarına beş alan girer; `ayarlar.files` altına "Cami ekranı" dosyası eklenir.

**Arayüzler:**
- Üretir:
  - `EKRANLAR = ['ana','giris','kadin'] as const`, `type EkranId`
  - `type EkranDuyuru = { id; tur: 'duyuru'; tr?: {baslik; metin}; fr?: {baslik; metin}; gorsel?; baslangic: 'YYYY-MM-DD'; son: 'YYYY-MM-DD'; hedef: EkranId[] }`
  - `ekranDuyurulari(girdiler: DuyuruGirdisi[], bugun: string, varsayilanGun: number): EkranDuyuru[]`
  - Akış gövdesi: `{ derleme: string, ayar: { slayt: {tabanSn, karakterSn, enAzSn, enCokSn}, gece: {kapanmaDk, acilmaDk}, duyuruVarsayilanGun }, duyurular: EkranDuyuru[] }`

- [ ] **Adım 1: Başarısız testi yaz.** Dosya: `tests/ekran-akis.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ekranDuyurulari } from '../src/lib/ekran/akis.ts';

const d = (id, data) => ({ id, data: { baslik: 'Başlık ' + id, tarih: new Date('2026-09-20'), taslak: false, ekranHedef: [], ...data } });

test('TR ve FR duyuru slugdan eşlenir; yalnız ekranda işaretli olan girer', () => {
  const s = ekranDuyurulari([
    d('tr/kermes', { ekranda: true, ozet: 'Kermes pazar günü.' }),
    d('fr/kermes', { ekranda: true, baslik: 'Kermesse', ozet: 'Kermesse dimanche.' }),
    d('tr/eski-haber', { ekranda: false }),
  ], '2026-09-27', 30);
  assert.equal(s.length, 1);
  assert.equal(s[0].id, 'kermes');
  assert.deepEqual(s[0].tr, { baslik: 'Başlık tr/kermes', metin: 'Kermes pazar günü.' });
  assert.deepEqual(s[0].fr, { baslik: 'Kermesse', metin: 'Kermesse dimanche.' });
});

test('ekran metni özetten önce gelir, boş bırakılmışsa özet; taslak ve süresi dolan duyuru girmez', () => {
  const s = ekranDuyurulari([
    d('tr/a', { ekranda: true, ozet: 'Uzun özet', ekranMetni: 'Kısa ekran metni' }),
    d('tr/b', { ekranda: true, taslak: true }),
    d('tr/c', { ekranda: true, ekranSon: new Date('2026-09-26') }),
    d('tr/d', { ekranda: true, ozet: 'Özet kalır', ekranMetni: '  ' }),
  ], '2026-09-27', 30);
  assert.deepEqual(s.map((x) => x.id), ['a', 'd']);
  assert.equal(s[0].tr.metin, 'Kısa ekran metni');
  assert.equal(s[1].tr.metin, 'Özet kalır');
});

test('son gün boşsa başlangıçtan itibaren varsayılan gün sayısı kadar (başlangıç dâhil) gösterilir', () => {
  const [x] = ekranDuyurulari([d('tr/a', { ekranda: true, ekranBaslangic: new Date('2026-09-25') })], '2026-09-27', 30);
  assert.equal(x.baslangic, '2026-09-25');
  assert.equal(x.son, '2026-10-24');
  assert.deepEqual(ekranDuyurulari([d('tr/a', { ekranda: true, ekranBaslangic: new Date('2026-08-01') })], '2026-09-27', 30), []);
});

test('hedef ekranlar ve kapak görseli akışa taşınır; FR yoksa yalnız TR', () => {
  const [x] = ekranDuyurulari([d('tr/a', { ekranda: true, ekranHedef: ['kadin'], kapak: '/media/duyurular/a.webp' })], '2026-09-27', 30);
  assert.deepEqual(x.hedef, ['kadin']);
  assert.equal(x.gorsel, '/media/duyurular/a.webp');
  assert.equal(x.fr, undefined);
});
```

- [ ] **Adım 2: Testin başarısız olduğunu gör.** Komut: `node --test tests/ekran-akis.test.mjs`. Beklenen: `ERR_MODULE_NOT_FOUND` ile FAIL.

- [ ] **Adım 3: Akış kurucuyu yaz.** Dosya: `src/lib/ekran/akis.ts`

```ts
/**
 * Cami ekranının duyuru akışı (/ekran/akis.json) — 27 Eylül 2026.
 *
 * Sveltia'da TR ve FR duyuru ayrı dosyadır (src/content/duyurular/{tr,fr}/slug.md); ekran ikisini
 * slug'dan eşler ve aynı slaytta alt alta gösterir. Yalnız «Cami ekranında göster» işaretli, taslak
 * olmayan ve gösterim aralığı bitmemiş duyurular girer. Aralık ekranda da yeniden denetlenir
 * (src/lib/ekran/secim.ts → aktifMi): internet kesilse bile süresi dolan duyuru kalkar.
 */
export const EKRANLAR = ['ana', 'giris', 'kadin'] as const;
export type EkranId = (typeof EKRANLAR)[number];

export interface DuyuruGirdisi {
  id: string;
  data: {
    baslik: string;
    tarih: Date;
    ozet?: string;
    kapak?: string;
    taslak: boolean;
    ekranda?: boolean;
    ekranBaslangic?: Date;
    ekranSon?: Date;
    ekranHedef?: readonly EkranId[];
    ekranMetni?: string;
  };
}

export interface EkranMetni { baslik: string; metin: string }

export interface EkranDuyuru {
  id: string;
  tur: 'duyuru';
  tr?: EkranMetni;
  fr?: EkranMetni;
  gorsel?: string;
  /** Brüksel takvim günü, iki uç dâhil */
  baslangic: string;
  son: string;
  /** Boşsa bütün ekranlar */
  hedef: EkranId[];
}

const brukselGunu = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const gunEkle = (tarih: string, gun: number): string =>
  new Date(Date.parse(tarih + 'T12:00:00Z') + gun * 86_400_000).toISOString().slice(0, 10);

/** Ekran metni boş ya da yalnız boşluksa özet kullanılır (CMS boş alanı "" olarak yazabilir). */
function metin(g: DuyuruGirdisi | undefined): EkranMetni | undefined {
  if (!g || g.data.taslak) return undefined;
  return { baslik: g.data.baslik, metin: (g.data.ekranMetni || '').trim() || (g.data.ozet || '').trim() };
}

export function ekranDuyurulari(girdiler: DuyuruGirdisi[], bugun: string, varsayilanGun: number): EkranDuyuru[] {
  const gruplar = new Map<string, { tr?: DuyuruGirdisi; fr?: DuyuruGirdisi }>();
  for (const g of girdiler) {
    const bolu = g.id.indexOf('/');
    const dil = g.id.slice(0, bolu);
    if (bolu < 1 || (dil !== 'tr' && dil !== 'fr')) continue;
    const slug = g.id.slice(bolu + 1);
    const grup = gruplar.get(slug) ?? {};
    grup[dil] = g;
    gruplar.set(slug, grup);
  }
  const sonuc: EkranDuyuru[] = [];
  for (const [slug, grup] of gruplar) {
    const ana = grup.tr ?? grup.fr;
    if (!ana || !ana.data.ekranda || ana.data.taslak) continue;
    const baslangic = brukselGunu(ana.data.ekranBaslangic ?? ana.data.tarih);
    const son = ana.data.ekranSon ? brukselGunu(ana.data.ekranSon) : gunEkle(baslangic, varsayilanGun - 1);
    if (son < bugun || son < baslangic) continue;
    sonuc.push({ id: slug, tur: 'duyuru', tr: metin(grup.tr), fr: metin(grup.fr), gorsel: ana.data.kapak, baslangic, son, hedef: [...(ana.data.ekranHedef ?? [])] });
  }
  return sonuc.sort((a, b) => b.baslangic.localeCompare(a.baslangic) || a.id.localeCompare(b.id));
}
```

- [ ] **Adım 4: Testin geçtiğini gör.** Komut: `node --test tests/ekran-akis.test.mjs`. Beklenen: 4 test PASS.

- [ ] **Adım 5: Şemayı genişlet.** Dosya: `src/content.config.ts`
  - `import { parse as yamlParse } from 'yaml';` satırının altına şunu ekle:

```ts
import { EKRANLAR } from './lib/ekran/akis.ts';

/** Sveltia boş bırakılan isteğe bağlı alanı "" (ya da null) yazabilir; ekran alanlarında bu "yok" demektir. */
const bosIseYok = (v: unknown) => (v === '' || v === null ? undefined : v);
```

  - Duyuru şemasında `oneCikanSon: z.coerce.date().optional(),` satırından sonra, `taslak` satırından önce şunu ekle:

```ts
    /* Cami ekranı (ulucamii.be/ekran, 27 Eylül 2026). İşaretli değilse duyuru ekranlarda görünmez;
       son gün boşsa ekran.yaml → duyuruVarsayilanGun kadar gösterilir. Hedef boşsa bütün ekranlar.
       Boş bırakılan tarih "" olarak gelse de derleme kırılmaz (bosIseYok). */
    ekranda: z.boolean().default(false),
    ekranBaslangic: z.preprocess(bosIseYok, z.coerce.date().optional()),
    ekranSon: z.preprocess(bosIseYok, z.coerce.date().optional()),
    ekranHedef: z.array(z.enum(EKRANLAR)).default([]),
    ekranMetni: z.string().max(160).optional(),
```

  - `export const collections = …` satırının hemen üstüne şunu ekle:

```ts
/** Cami ekranı ayarları — src/content/ayarlar/ekran.yaml (27 Eylül 2026; İçerik Yönetimi → Site Ayarları → Cami ekranı) */
const ekranAyar = defineCollection({
  loader: file('./src/content/ayarlar/ekran.yaml', { parser: (text) => [{ id: 'ekran', ...yamlParse(text).ekran }] }),
  schema: z.object({
    slayt: z.object({
      tabanSn: z.number().min(0).max(60),
      karakterSn: z.number().min(0).max(1),
      enAzSn: z.number().min(3).max(120),
      enCokSn: z.number().min(3).max(300),
    }),
    gece: z.object({ kapanmaDk: z.number().int().min(0).max(240), acilmaDk: z.number().int().min(0).max(240) }),
    duyuruVarsayilanGun: z.number().int().min(1).max(365).default(30),
  }),
});
```

  - Dışa aktarım şöyle olacak: `export const collections = { duyurular, etkinlikler, sayfalar, ayarlar, galeri, vefat, afisler, kurul, materyaller, vaazlar, ekranAyar };`

- [ ] **Adım 6: Ayar dosyasını oluştur.** Dosya: `src/content/ayarlar/ekran.yaml`

```yaml
# Cami ekranı ayarları — İçerik Yönetimi → Site Ayarları → Cami ekranı (27 Eylül 2026).
# Slayt süresi = tabanSn + karakterSn × karakter sayısı; enAzSn ile enCokSn arasında tutulur.
# Gece: ekran yatsıdan kapanmaDk sonra kapanır, imsaktan acilmaDk önce açılır (kutudaki uygulama uygular, Faz 2).
ekran:
  slayt:
    tabanSn: 8
    karakterSn: 0.05
    enAzSn: 10
    enCokSn: 30
  gece:
    kapanmaDk: 60
    acilmaDk: 30
  duyuruVarsayilanGun: 30
```

- [ ] **Adım 7: CMS alanlarını ekle.** Dosya: `public/admin/icerik/config.yml`
  - Duyurular koleksiyonunda şu üç satırı bul:

```yaml
      - { name: taslak, label: Taslak (sitede gösterme), widget: boolean, default: false, i18n: duplicate }
      - { name: body, label: Metin, widget: markdown, i18n: true }

  - name: etkinlikler
```

  - Taslak satırının hemen önüne şunu ekle:

```yaml
      - { name: ekranda, label: "Cami ekranında göster", widget: boolean, default: false, i18n: duplicate, hint: "İşaretlenirse duyuru camideki ekranlarda da döner (ulucamii.be/ekran)." }
      - { name: ekranBaslangic, label: "Ekranda ilk gün (boşsa duyuru tarihi)", widget: datetime, format: "YYYY-MM-DD", date_format: "DD.MM.YYYY", time_format: false, required: false, i18n: duplicate }
      - { name: ekranSon, label: "Ekranda son gün (boşsa ekran ayarındaki süre, 30 gün)", widget: datetime, format: "YYYY-MM-DD", date_format: "DD.MM.YYYY", time_format: false, required: false, i18n: duplicate, hint: "Bu gün dâhil gösterilir, sonra ekrandan kendiliğinden kalkar." }
      - { name: ekranHedef, label: "Hangi ekranlar (boşsa hepsi)", widget: select, multiple: true, required: false, default: [], i18n: duplicate, options: [{ label: "Ana ekran (LED panonun yeri)", value: ana }, { label: "Giriş / çay ocağı", value: giris }, { label: "Kadınlar bölümü", value: kadin }] }
      - { name: ekranMetni, label: "Ekran metni (boşsa özet)", widget: text, required: false, i18n: true, hint: "En fazla 160 karakter; ekranda başlığın altında görünür.", pattern: ["^[\\s\\S]{0,160}$", "En fazla 160 karakter"] }
```

  - Ayarlar koleksiyonunda şu satırları bul:

```yaml
              - { name: sira, label: Sıra (küçük önce), widget: number, default: 100 }

  - name: kurulAyar
```

  - `sira` satırından sonra, boş satırdan önce yeni dosya girişini ekle (6 boşluk girinti; `- name: site` ile aynı düzey):

```yaml
      - name: ekran
        label: Cami ekranı
        file: src/content/ayarlar/ekran.yaml
        fields:
          - name: ekran
            label: Cami ekranı ayarları
            widget: object
            collapsed: false
            fields:
              - name: slayt
                label: "Slayt süresi (taban + karakter başına ek süre × karakter sayısı)"
                widget: object
                fields:
                  - { name: tabanSn, label: "Taban süre (sn)", widget: number, value_type: float, min: 0, max: 60 }
                  - { name: karakterSn, label: "Karakter başına ek süre (sn)", widget: number, value_type: float, min: 0, max: 1 }
                  - { name: enAzSn, label: "En kısa slayt (sn)", widget: number, value_type: int, min: 3, max: 120 }
                  - { name: enCokSn, label: "En uzun slayt (sn)", widget: number, value_type: int, min: 3, max: 300 }
              - name: gece
                label: "Gece kapanması (kutudaki uygulama uygular)"
                widget: object
                fields:
                  - { name: kapanmaDk, label: "Yatsıdan kaç dakika sonra kapansın", widget: number, value_type: int, min: 0, max: 240 }
                  - { name: acilmaDk, label: "İmsaktan kaç dakika önce açılsın", widget: number, value_type: int, min: 0, max: 240 }
              - { name: duyuruVarsayilanGun, label: "Son günü girilmemiş duyuru kaç gün gösterilsin", widget: number, value_type: int, min: 1, max: 365 }
```

- [ ] **Adım 8: Uç noktayı yaz.** Dosya: `src/pages/ekran/akis.json.ts`

```ts
/**
 * /ekran/akis.json — cami ekranının duyuru akışı ve ekran ayarları (derleme anında; CMS'te her kayıt
 * yeniden derlemeyi tetikler). Kurucu: src/lib/ekran/akis.ts.
 */
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { bugunBrussels } from '../../lib/icerik';
import { ekranDuyurulari } from '../../lib/ekran/akis.ts';

export const GET: APIRoute = async () => {
  const ayar = (await getEntry('ekranAyar', 'ekran'))!.data;
  const govde = {
    derleme: new Date().toISOString(),
    ayar,
    duyurular: ekranDuyurulari(await getCollection('duyurular'), bugunBrussels(), ayar.duyuruVarsayilanGun),
  };
  return new Response(JSON.stringify(govde), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
```

- [ ] **Adım 9: CMS denetimini ve derlemeyi çalıştır.**
  - `npm run denetim:cms`: sıfır çıkış kodu beklenir, kritik bulgu olmamalı. Sveltia şeması bir alanı reddederse denetimin gösterdiği alan düzeltilir.
  - `npm run build && node -e "const a=require('./dist/ekran/akis.json'); console.log(JSON.stringify(a.ayar.slayt), a.duyurular.length)"`: beklenen çıktı `{"tabanSn":8,"karakterSn":0.05,"enAzSn":10,"enCokSn":30} 0`.

- [ ] **Adım 10: Commit.**

```bash
git add src/lib/ekran/akis.ts src/content/ayarlar/ekran.yaml src/pages/ekran/akis.json.ts tests/ekran-akis.test.mjs src/content.config.ts public/admin/icerik/config.yml
git commit -m "Ekran: duyuruların ekran alanları, ekran ayarları ve /ekran/akis.json" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 3: Onaylı ayet/hadis akışı (`/ekran/icerik.json`)

**Dosyalar:**
- Oluştur: `src/lib/ekran/icerik.ts`
- Oluştur: `src/data/ekran/ayetler.json`, `src/data/ekran/hadisler.json` (ikisi de `[]` ile başlar)
- Oluştur: `src/pages/ekran/icerik.json.ts`
- Oluştur: `tests/ekran-icerik.test.mjs`

**Arayüzler:**
- Kullanır: `src/lib/hadis-verisi.ts` → `AHLAK_HADISLERI`, `type HadisOgesi`.
- Üretir:
  - `type EkranAyet = { id; referans: {tr; fr}; ar; tr; fr?; kaynakTr; kaynakFr? }`
  - `type EkranHadis = { id; ar; tr; fr?; kaynak }`
  - `type EkranIcerik = { ayetler; hadisler; eksik: string[] }`
  - `ekranIcerigi(ayetler: AyetKaydi[], hadisler: HadisKaydi[], siteHadisleri: HadisOgesi[]): EkranIcerik`
  - Kayıt şemaları `AyetKaydi` ve `HadisKaydi`: içerik hattı (İ2/İ3) bu biçimde veri üretir.

- [ ] **Adım 1: Başarısız testi yaz.** Dosya: `tests/ekran-icerik.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { ekranIcerigi } from '../src/lib/ekran/icerik.ts';

const ayet = (ek = {}) => ({ id: 'a-94-5', sure: 94, ayet: [5, 6], sureAdi: { tr: 'İnşirah', fr: 'Ach-Charh' }, ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)', durum: 'imam-onayli', ...ek });
const siteHadisi = { id: 'tebessum', arapca: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', metin: { tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.', fr: 'Sourire à ton frère est pour toi une aumône.', en: '', nl: '', de: '' }, kaynak: 'Tirmizî, Birr, 36', konu: { tr: '', fr: '', en: '', nl: '', de: '' }, ikon: '' };

test('yalnız imam onaylı ve eksiksiz ayet yayına girer', () => {
  const s = ekranIcerigi([ayet(), ayet({ id: 'a-taslak', durum: 'taslak' }), ayet({ id: 'a-eksik', tr: '' })], [], []);
  assert.deepEqual(s.ayetler.map((a) => a.id), ['a-94-5']);
  assert.deepEqual(s.eksik, ['a-eksik']);
});

test('ayet referansı TR ve FR biçiminde, aralık tireyle yazılır; FR yoksa alan hiç yok', () => {
  const [a] = ekranIcerigi([ayet()], [], []).ayetler;
  assert.deepEqual(a.referans, { tr: 'İnşirah, 94/5-6', fr: 'Ach-Charh, 94:5-6' });
  assert.equal('fr' in a, false);
  const [b] = ekranIcerigi([ayet({ ayet: [5], fr: 'Texte français de test.', kaynakFr: 'Traduction de test' })], [], []).ayetler;
  assert.equal(b.referans.tr, 'İnşirah, 94/5');
  assert.equal(b.kaynakFr, 'Traduction de test');
});

test('sitedeki ahlâk hadisleri havuza AR, TR, FR ve kaynağıyla katılır', () => {
  assert.deepEqual(ekranIcerigi([], [], [siteHadisi]).hadisler, [{ id: 'site-tebessum', ar: siteHadisi.arapca, tr: siteHadisi.metin.tr, fr: siteHadisi.metin.fr, kaynak: 'Tirmizî, Birr, 36' }]);
});

test('mükerrer kimlik ikinci kez alınmaz ve raporlanır', () => {
  const h = { id: 'h1', ar: 'ا', tr: 't', kaynak: 'k', durum: 'imam-onayli' };
  const s = ekranIcerigi([ayet(), ayet()], [h, h], []);
  assert.equal(s.ayetler.length, 1);
  assert.equal(s.hadisler.length, 1);
  assert.deepEqual(s.eksik, ['a-94-5 (mükerrer)', 'h1 (mükerrer)']);
});
```

- [ ] **Adım 2: Testin başarısız olduğunu gör.** Komut: `node --test tests/ekran-icerik.test.mjs`. Beklenen: FAIL.

- [ ] **Adım 3: Kurucuyu yaz.** Dosya: `src/lib/ekran/icerik.ts`

```ts
/**
 * Cami ekranının ayet/hadis akışı (/ekran/icerik.json) — 27 Eylül 2026.
 *
 * Yalnız imamın onayladığı kayıtlar (durum: "imam-onayli") yayına girer; eksik alanlı ya da mükerrer
 * kimlikli kayıt atlanır ve `eksik` listesinde raporlanır. Metinler resmî Diyanet yayınlarından alınır;
 * D:\ihtisas arşivi yalnız seçim/doğrulama içindir (telif kuralı). Fransızca meal DİB / Mohammed Chiadmi
 * «Le Noble Coran» (2022) çevirisidir; cami Diyanet'e bağlı olduğu için Diyanet yayınları için ayrıca izin
 * istenmez. `fr` ile `kaynakFr` birlikte dolu değilse FR yayımlanmaz, ekran AR + TR gösterir. Sitedeki 10 ahlâk
 * hadisi (src/lib/hadis-verisi.ts) zaten yayında olduğu için başlangıç havuzudur.
 */
import type { HadisOgesi } from '../hadis-verisi.ts';

type Durum = 'taslak' | 'imam-onayli';

export interface AyetKaydi {
  id: string;
  sure: number;
  ayet: number[];
  sureAdi: { tr: string; fr: string };
  ar: string;
  tr: string;
  fr?: string;
  kaynakTr: string;
  kaynakFr?: string;
  durum: Durum;
  onayTarihi?: string;
}

export interface HadisKaydi {
  id: string;
  ar: string;
  tr: string;
  fr?: string;
  kaynak: string;
  durum: Durum;
  onayTarihi?: string;
}

export interface EkranAyet { id: string; referans: { tr: string; fr: string }; ar: string; tr: string; fr?: string; kaynakTr: string; kaynakFr?: string }
export interface EkranHadis { id: string; ar: string; tr: string; fr?: string; kaynak: string }
export interface EkranIcerik { ayetler: EkranAyet[]; hadisler: EkranHadis[]; eksik: string[] }

const dolu = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const aralik = (ayetler: number[]): string =>
  ayetler.length > 1 ? `${ayetler[0]}-${ayetler[ayetler.length - 1]}` : String(ayetler[0]);

export function ekranIcerigi(ayetler: AyetKaydi[], hadisler: HadisKaydi[], siteHadisleri: HadisOgesi[]): EkranIcerik {
  const eksik: string[] = [];
  const gorulen = new Set<string>();
  const yeni = (id: string): boolean => {
    if (gorulen.has(id)) { eksik.push(id + ' (mükerrer)'); return false; }
    gorulen.add(id);
    return true;
  };

  const ekranAyetleri: EkranAyet[] = [];
  for (const a of ayetler) {
    if (a.durum !== 'imam-onayli') continue;
    const tam = dolu(a.id) && Number.isInteger(a.sure) && a.sure >= 1 && a.sure <= 114 && Array.isArray(a.ayet) && a.ayet.length > 0
      && dolu(a.ar) && dolu(a.tr) && dolu(a.kaynakTr) && !!a.sureAdi && dolu(a.sureAdi.tr) && dolu(a.sureAdi.fr);
    if (!tam) { eksik.push(String(a.id)); continue; }
    if (!yeni(a.id)) continue;
    const ek = aralik(a.ayet);
    ekranAyetleri.push({
      id: a.id,
      referans: { tr: `${a.sureAdi.tr}, ${a.sure}/${ek}`, fr: `${a.sureAdi.fr}, ${a.sure}:${ek}` },
      ar: a.ar,
      tr: a.tr,
      ...(dolu(a.fr) ? { fr: a.fr, kaynakFr: a.kaynakFr } : {}),
      kaynakTr: a.kaynakTr,
    });
  }

  const ekranHadisleri: EkranHadis[] = [];
  for (const h of siteHadisleri) {
    const id = 'site-' + h.id;
    if (yeni(id)) ekranHadisleri.push({ id, ar: h.arapca, tr: h.metin.tr, fr: h.metin.fr, kaynak: h.kaynak });
  }
  for (const h of hadisler) {
    if (h.durum !== 'imam-onayli') continue;
    if (!dolu(h.id) || !dolu(h.ar) || !dolu(h.tr) || !dolu(h.kaynak)) { eksik.push(String(h.id)); continue; }
    if (!yeni(h.id)) continue;
    ekranHadisleri.push({ id: h.id, ar: h.ar, tr: h.tr, ...(dolu(h.fr) ? { fr: h.fr } : {}), kaynak: h.kaynak });
  }
  return { ayetler: ekranAyetleri, hadisler: ekranHadisleri, eksik };
}
```

- [ ] **Adım 4: Testin geçtiğini gör.** Komut: `node --test tests/ekran-icerik.test.mjs`. Beklenen: 4 test PASS.

- [ ] **Adım 5: Veri dosyalarını ve uç noktayı oluştur.**
  - `src/data/ekran/ayetler.json` içeriği: `[]`
  - `src/data/ekran/hadisler.json` içeriği: `[]`
  - `src/pages/ekran/icerik.json.ts`:

```ts
/**
 * /ekran/icerik.json — günün ayeti ve günün hadisi havuzu (yalnız imam onaylı kayıtlar).
 * Veri: src/data/ekran/{ayetler,hadisler}.json (içerik hattı İ2/İ3) + sitedeki 10 ahlâk hadisi.
 */
import type { APIRoute } from 'astro';
import ayetler from '../../data/ekran/ayetler.json';
import hadisler from '../../data/ekran/hadisler.json';
import { AHLAK_HADISLERI } from '../../lib/hadis-verisi';
import { ekranIcerigi, type AyetKaydi, type HadisKaydi } from '../../lib/ekran/icerik.ts';

export const GET: APIRoute = () => {
  const govde = ekranIcerigi(ayetler as AyetKaydi[], hadisler as HadisKaydi[], AHLAK_HADISLERI);
  if (govde.eksik.length) console.warn(`[ekran] UYARI: eksik/mükerrer içerik yayımlanmadı: ${govde.eksik.join(', ')}`);
  return new Response(JSON.stringify({ derleme: new Date().toISOString(), ...govde }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
```

- [ ] **Adım 6: Derleyip çıktıyı doğrula.** Komut: `npm run build && node -e "const i=require('./dist/ekran/icerik.json'); console.log(i.ayetler.length, i.hadisler.length, JSON.stringify(i.eksik))"`. Beklenen: `0 10 []`.

- [ ] **Adım 7: Commit.**

```bash
git add src/lib/ekran/icerik.ts src/data/ekran src/pages/ekran/icerik.json.ts tests/ekran-icerik.test.mjs
git commit -m "Ekran: imam onaylı ayet/hadis akışı (/ekran/icerik.json)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 4: Ortak karar fonksiyonları (`src/lib/ekran/secim.ts`)

**Dosyalar:**
- Oluştur: `src/lib/ekran/secim.ts`
- Oluştur: `tests/ekran-secim.test.mjs`

**Arayüzler:**
- Kullanır: `namaz.ts` → `brukselTarih`, `bugunTarih`, `durumHesapla`, `haftaGunu`, `TZ`, `Gun`, `Vakit`. `akis.ts` → `EKRANLAR`, `EkranId`, `EkranDuyuru`. `icerik.ts` → `EkranAyet`, `EkranHadis`.
- Üretir (istemci Görev 5–9'da kullanır):
  - `slaytSuresi(karakter, SlaytAyari): number`
  - `hedefUygunMu(hedef, ekran): boolean`
  - `aktifMi({baslangic, son}, bugun): boolean`
  - `gunNo(tarih): number`
  - `gununOgesi<T>(liste, tarih): T | undefined`
  - `temaSec(gun | undefined, simdi): 'acik' | 'koyu'`
  - `saatGecerliMi(simdi): boolean`
  - `brukselSaat(t): {sa, dk, sn}`
  - `vakitGorunumu(gunler, simdi): VakitGorunumu | null`
  - `type Slayt`
  - `slaytListesi({duyurular, ayetler, hadisler}, ekran, bugun): Slayt[]`
  - `ekranIdOku(deger | null): EkranId`
  - `donmeOku(deger | null): 0 | 90 | 270`
  - `type SlaytAyari`

- [ ] **Adım 1: Başarısız testi yaz.** Dosya: `tests/ekran-secim.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { slaytSuresi, hedefUygunMu, aktifMi, gunNo, gununOgesi, temaSec, saatGecerliMi, brukselSaat, vakitGorunumu, slaytListesi, ekranIdOku, donmeOku } from '../src/lib/ekran/secim.ts';

const AYAR = { tabanSn: 8, karakterSn: 0.05, enAzSn: 10, enCokSn: 30 };
const gun = (tarih, ek = {}) => ({ tarih, hicri: '16 Rebiulahir 1448', imsak: '05:43', gunes: '07:26', ogle: '13:34', ikindi: '16:47', aksam: '19:35', yatsi: '21:04', ...ek });

test('slayt süresi metin uzunluğuyla artar ve 10–30 sn arasında kalır', () => {
  assert.equal(slaytSuresi(0, AYAR), 10);
  assert.equal(slaytSuresi(200, AYAR), 18);
  assert.equal(slaytSuresi(5000, AYAR), 30);
});

test('hedefsiz duyuru her ekranda, hedefli duyuru yalnız kendi ekranında', () => {
  assert.equal(hedefUygunMu([], 'giris'), true);
  assert.equal(hedefUygunMu(['kadin'], 'kadin'), true);
  assert.equal(hedefUygunMu(['kadin'], 'ana'), false);
});

test('gösterim aralığının iki ucu dâhil', () => {
  const o = { baslangic: '2026-09-27', son: '2026-09-30' };
  assert.equal(aktifMi(o, '2026-09-27'), true);
  assert.equal(aktifMi(o, '2026-09-30'), true);
  assert.equal(aktifMi(o, '2026-10-01'), false);
  assert.equal(aktifMi(o, '2026-09-26'), false);
});

test('günün öğesi aynı gün sabit, ertesi gün sıradaki; yaz saati geçişi sırayı bozmaz', () => {
  const l = ['a', 'b', 'c'];
  assert.equal(gunNo('2026-10-26') - gunNo('2026-10-25'), 1);
  assert.equal(gunNo('2027-03-29') - gunNo('2027-03-28'), 1);
  const bugun = gununOgesi(l, '2026-10-25');
  const yarin = gununOgesi(l, '2026-10-26');
  assert.equal(gununOgesi(l, '2026-10-25'), bugun);
  assert.equal(l.indexOf(yarin), (l.indexOf(bugun) + 1) % 3);
  assert.equal(gununOgesi([], '2026-10-25'), undefined);
});

test('tema güneşten akşama açık, sonra koyu (kış saatine geçilen gün dâhil)', () => {
  const g = gun('2026-10-25', { gunes: '07:45', aksam: '18:00' });
  assert.equal(temaSec(g, new Date('2026-10-25T07:44:59+01:00')), 'koyu');
  assert.equal(temaSec(g, new Date('2026-10-25T07:45:00+01:00')), 'acik');
  assert.equal(temaSec(g, new Date('2026-10-25T17:59:59+01:00')), 'acik');
  assert.equal(temaSec(g, new Date('2026-10-25T18:00:00+01:00')), 'koyu');
  assert.equal(temaSec(undefined, new Date('2026-10-25T12:00:00+01:00')), 'acik');
});

test('pilsiz kutuda saat 1970e dönerse güvenilmez sayılır', () => {
  assert.equal(saatGecerliMi(new Date(0)), false);
  assert.equal(saatGecerliMi(new Date('2026-09-27T12:00:00Z')), true);
});

test('Brüksel saati: gece yarısı 00; yaz saati biterken 02:30 iki kez yaşanır', () => {
  assert.deepEqual(brukselSaat(new Date('2026-09-26T22:00:05Z')), { sa: 0, dk: 0, sn: 5 });
  assert.deepEqual(brukselSaat(new Date('2026-10-25T00:30:00Z')), { sa: 2, dk: 30, sn: 0 });
  assert.deepEqual(brukselSaat(new Date('2026-10-25T01:30:00Z')), { sa: 2, dk: 30, sn: 0 });
});

test('bugünün kaydı yoksa vakit görünümü yok; varsa sıradaki vakit ve Cuma bilgisi', () => {
  assert.equal(vakitGorunumu([gun('2026-09-26')], new Date('2026-09-27T10:00:00+02:00')), null);
  const v = vakitGorunumu([gun('2026-09-27'), gun('2026-09-28')], new Date('2026-09-27T10:00:00+02:00'));
  assert.equal(v.siradaki.vakit, 'ogle');
  assert.equal(v.cuma, false);
  assert.equal(vakitGorunumu([gun('2026-10-02'), gun('2026-10-03')], new Date('2026-10-02T10:00:00+02:00')).cuma, true);
  const gece = vakitGorunumu([gun('2026-09-27'), gun('2026-09-28')], new Date('2026-09-27T22:00:00+02:00'));
  assert.deepEqual([gece.siradaki.vakit, gece.siradaki.yarinMi], ['imsak', true]);
});

test('slayt turu: bu ekrana özel duyuru, ortak duyuru, günün ayeti, günün hadisi', () => {
  const du = (id, hedef, son = '2026-10-30') => ({ id, tur: 'duyuru', tr: { baslik: id, metin: 'metin' }, baslangic: '2026-09-01', son, hedef });
  const s = slaytListesi({
    duyurular: [du('ortak', []), du('kadin', ['kadin']), du('giris', ['giris']), du('bitmis', [], '2026-09-20')],
    ayetler: [{ id: 'a1', referans: { tr: 'r', fr: 'r' }, ar: 'ا', tr: 'meal', kaynakTr: 'DİB' }],
    hadisler: [{ id: 'h1', ar: 'ا', tr: 'hadis', kaynak: 'k' }],
  }, 'kadin', '2026-09-27');
  assert.deepEqual(s.map((x) => x.tur + ':' + x.oge.id), ['duyuru:kadin', 'duyuru:ortak', 'ayet:a1', 'hadis:h1']);
  assert.equal(s[0].karakter, 'kadin'.length + 'metin'.length);
});

test('ekran ve döndürme parametresi güvenli okunur', () => {
  assert.equal(ekranIdOku('kadin'), 'kadin');
  assert.equal(ekranIdOku('<script>'), 'ana');
  assert.equal(ekranIdOku(null), 'ana');
  assert.equal(donmeOku('90'), 90);
  assert.equal(donmeOku('270'), 270);
  assert.equal(donmeOku('45'), 0);
});
```

- [ ] **Adım 2: Testin başarısız olduğunu gör.** Komut: `node --test tests/ekran-secim.test.mjs`. Beklenen: FAIL.

- [ ] **Adım 3: Fonksiyonları yaz.** Dosya: `src/lib/ekran/secim.ts`

```ts
/**
 * Cami ekranının saf karar fonksiyonları — hem derlemede hem ekranın kendisinde (src/ekran/*) çalışır.
 * DOM ve ağ kullanmaz; node:test ile doğrudan sınanır (tests/ekran-secim.test.mjs). 27 Eylül 2026.
 * İstemci paketi Chromium 70'e iner: burada .at(), Object.fromEntries, replaceAll gibi API'ler kullanılmaz.
 */
import { brukselTarih, bugunTarih, durumHesapla, haftaGunu, TZ, type Gun, type Vakit } from '../namaz.ts';
import { EKRANLAR, type EkranDuyuru, type EkranId } from './akis.ts';
import type { EkranAyet, EkranHadis } from './icerik.ts';

export interface SlaytAyari { tabanSn: number; karakterSn: number; enAzSn: number; enCokSn: number }

/** Süre = taban + karakter başına ek süre × karakter; [enAz, enÇok] aralığına sıkıştırılır (saniye). */
export function slaytSuresi(karakter: number, a: SlaytAyari): number {
  const ham = a.tabanSn + a.karakterSn * Math.max(0, karakter);
  return Math.min(a.enCokSn, Math.max(a.enAzSn, ham));
}

/** Hedefi boş duyuru bütün ekranlarda, dolu olan yalnız listelenen ekranlarda görünür. */
export const hedefUygunMu = (hedef: readonly string[], ekran: EkranId): boolean => hedef.length === 0 || hedef.indexOf(ekran) >= 0;

/** Gösterim aralığı Brüksel takvim günüyle, iki uç dâhil. */
export const aktifMi = (o: { baslangic: string; son: string }, bugun: string): boolean => o.baslangic <= bugun && bugun <= o.son;

/** Takvim gününün 1970'ten beri sırası; 12:00 UTC üzerinden hesaplandığı için yaz/kış saatinden etkilenmez. */
export const gunNo = (tarih: string): number => Math.floor(Date.parse(tarih + 'T12:00:00Z') / 86_400_000);

/** Listeden "günün öğesi": aynı gün hep aynı, ertesi gün sıradaki. */
export function gununOgesi<T>(liste: readonly T[], tarih: string): T | undefined {
  if (!liste.length) return undefined;
  return liste[((gunNo(tarih) % liste.length) + liste.length) % liste.length];
}

/** Güneş vaktinden akşam vaktine kadar açık tema; geri kalan saatlerde koyu. Günün verisi yoksa açık. */
export function temaSec(gun: Gun | undefined, simdi: Date): 'acik' | 'koyu' {
  if (!gun) return 'acik';
  const t = simdi.getTime();
  return t >= brukselTarih(gun.tarih, gun.gunes).getTime() && t < brukselTarih(gun.tarih, gun.aksam).getTime() ? 'acik' : 'koyu';
}

/** Kutularda saat pili yok: elektrik kesilip internet de yoksa saat 1970'e dönebilir. Bu andan eskiyse saate güvenilmez. */
export const EN_ERKEN_GECERLI = Date.parse('2026-09-01T00:00:00Z');
export const saatGecerliMi = (simdi: Date): boolean => simdi.getTime() >= EN_ERKEN_GECERLI;

const SAAT_PARCALARI = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** Brüksel duvar saati; bazı tarayıcıların gece yarısı için verdiği "24" 0'a çevrilir. */
export function brukselSaat(t: Date): { sa: number; dk: number; sn: number } {
  const parcalar = SAAT_PARCALARI.formatToParts(t);
  const al = (tur: string): number => {
    for (const p of parcalar) if (p.type === tur) return Number(p.value);
    return 0;
  };
  return { sa: al('hour') % 24, dk: al('minute'), sn: al('second') };
}

export interface VakitGorunumu {
  gun: Gun;
  siradaki: { vakit: Vakit; saat: string; kalanDk: number; yarinMi: boolean } | null;
  cuma: boolean;
}

/** Bugünün Diyanet kaydı yoksa null: ekran başka bir günün vakitlerini ASLA bugünün gibi göstermez, hesaplamaz. */
export function vakitGorunumu(gunler: Gun[], simdi: Date): VakitGorunumu | null {
  const bugun = bugunTarih(simdi);
  let gun: Gun | undefined;
  for (const g of gunler) if (g.tarih === bugun) { gun = g; break; }
  if (!gun) return null;
  const durum = durumHesapla(gunler, simdi);
  return { gun, siradaki: durum ? durum.siradaki : null, cuma: haftaGunu(simdi) === 5 };
}

export type Slayt =
  | { tur: 'duyuru'; oge: EkranDuyuru; karakter: number }
  | { tur: 'ayet'; oge: EkranAyet; karakter: number }
  | { tur: 'hadis'; oge: EkranHadis; karakter: number };

const uz = (...parcalar: (string | undefined)[]): number => {
  let t = 0;
  for (const p of parcalar) t += p ? p.length : 0;
  return t;
};

/** Bir tur: bu ekrana özel duyurular, ortak duyurular, günün ayeti, günün hadisi. Boş kategori atlanır.
 *  Okuma süresi en uzun dildeki metne göre hesaplanır (izleyici tek dil okur). */
export function slaytListesi(girdi: { duyurular: EkranDuyuru[]; ayetler: EkranAyet[]; hadisler: EkranHadis[] }, ekran: EkranId, bugun: string): Slayt[] {
  const gecerli = girdi.duyurular.filter((d) => aktifMi(d, bugun) && hedefUygunMu(d.hedef, ekran));
  const sirali = gecerli.filter((d) => d.hedef.length > 0).concat(gecerli.filter((d) => d.hedef.length === 0));
  const liste: Slayt[] = sirali.map((d) => ({
    tur: 'duyuru' as const,
    oge: d,
    karakter: Math.max(uz(d.tr?.baslik, d.tr?.metin), uz(d.fr?.baslik, d.fr?.metin)),
  }));
  const ayet = gununOgesi(girdi.ayetler, bugun);
  if (ayet) liste.push({ tur: 'ayet', oge: ayet, karakter: Math.max(uz(ayet.ar), uz(ayet.tr), uz(ayet.fr)) });
  const hadis = gununOgesi(girdi.hadisler, bugun);
  if (hadis) liste.push({ tur: 'hadis', oge: hadis, karakter: Math.max(uz(hadis.ar), uz(hadis.tr), uz(hadis.fr)) });
  return liste;
}

export const ekranIdOku = (deger: string | null): EkranId =>
  (EKRANLAR as readonly string[]).indexOf(deger || '') >= 0 ? (deger as EkranId) : 'ana';

export const donmeOku = (deger: string | null): 0 | 90 | 270 => (deger === '90' ? 90 : deger === '270' ? 270 : 0);
```

- [ ] **Adım 4: Testin geçtiğini gör.** Komut: `node --test tests/ekran-secim.test.mjs`. Beklenen: 10 test PASS.

- [ ] **Adım 5: Commit.**

```bash
git add src/lib/ekran/secim.ts tests/ekran-secim.test.mjs
git commit -m "Ekran: slayt, tema, saat ve vakit görünümü karar fonksiyonları" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 5: İstemci paketi, sayfa iskeleti, saat ve takvim

**Dosyalar:**
- Oluştur: `scripts/ekran-derle.mjs`
- Oluştur: `src/ekran/main.ts`, `src/ekran/olcek.ts`, `src/ekran/gorunum.ts`, `src/ekran/metinler.ts`, `src/ekran/veri.ts`, `src/ekran/ekran.css`
- Oluştur: `src/pages/ekran/index.astro`
- Oluştur: `tests/ekran-veri.test.mjs`, `tests/ekran-eski-tarayici.test.mjs`, `tests/web/ekran.spec.mjs`
- Değiştir: `package.json` (`dev`, `build`, `ekran:derle`, `test:ekran`), `.gitignore`

**Arayüzler:**
- Kullanır: Görev 4'teki `brukselSaat`, `donmeOku`, `saatGecerliMi`; `namaz.ts` → `bugunTarih`, `TZ`; `i18n/hicri.ts` → `hicriCevir`.
- Üretir:
  - `olcekKur(tuval, don)`
  - `alan(ad)`, `yaz(ad, metin)`, `el(etiket, sinif?, metin?)`
  - `METIN`
  - `type EkranVerisi`, `tazele(v)`, `vakitGecerli`, `akisGecerli`, `icerikGecerli`
  - Sayfa verisi `#ekran-veri`: `{ cami: {tr, fr}, vakit: {tr: {imsak…yatsi, cuma, cumaUzun}, fr: {…}}, gps: {enlem, boylam} }`
  - DOM kancaları: `data-alan` = `cami-tr`, `cami-fr`, `saat`, `saat-sd`, `saat-sn`, `hava`, `tarih-tr`, `tarih-fr`, `hicri-tr`, `hicri-fr`, `slayt`, `vakitler`

- [ ] **Adım 1: Veri katmanı için başarısız testi yaz.** Dosya: `tests/ekran-veri.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { tazele, vakitGecerli, akisGecerli, icerikGecerli } from '../src/ekran/veri.ts';

const VAKIT = { kaynakTuru: 'diyanet', ilce: '11890', gunler: [{ tarih: '2026-09-27' }] };
const AKIS = { duyurular: [], ayar: { slayt: { tabanSn: 8 } } };
const ICERIK = { ayetler: [], hadisler: [] };

test('Diyanet dışı ya da bozuk akış kabul edilmez', () => {
  assert.equal(vakitGecerli({ ...VAKIT, kaynakTuru: 'aladhan' }), false);
  assert.equal(vakitGecerli({ ...VAKIT, ilce: '9541' }), false);
  assert.equal(vakitGecerli({ ...VAKIT, gunler: [] }), false);
  assert.equal(vakitGecerli(VAKIT), true);
  assert.equal(akisGecerli({ duyurular: [] }), false);
  assert.equal(akisGecerli(AKIS), true);
  assert.equal(icerikGecerli(null), false);
  assert.equal(icerikGecerli(ICERIK), true);
});

test('ağ hatası, 500 ve bozuk JSON son sağlam veriyi silmez', async () => {
  const v = { vakit: VAKIT, akis: AKIS, icerik: ICERIK };
  const eski = globalThis.fetch;
  globalThis.fetch = async (yol) => {
    if (yol.endsWith('vakitler.json')) throw new TypeError('ağ yok');
    if (yol.endsWith('akis.json')) return new Response('sunucu hatası', { status: 500 });
    return new Response('{bozuk', { status: 200 });
  };
  try {
    await tazele(v);
    assert.deepEqual(v, { vakit: VAKIT, akis: AKIS, icerik: ICERIK });
  } finally {
    globalThis.fetch = eski;
  }
});

test('geçerli yanıt eski verinin yerine geçer', async () => {
  const v = { vakit: null, akis: null, icerik: null };
  const eski = globalThis.fetch;
  globalThis.fetch = async (yol) => Response.json(yol.endsWith('vakitler.json') ? VAKIT : yol.endsWith('akis.json') ? AKIS : ICERIK);
  try {
    await tazele(v);
    assert.deepEqual(v, { vakit: VAKIT, akis: AKIS, icerik: ICERIK });
  } finally {
    globalThis.fetch = eski;
  }
});
```

- [ ] **Adım 2: Testin başarısız olduğunu gör.** Komut: `node --test tests/ekran-veri.test.mjs`. Beklenen: FAIL.

- [ ] **Adım 3: Veri katmanını yaz.** Dosya: `src/ekran/veri.ts`

```ts
/**
 * Ekranın üç akışı: /ekran/vakitler.json, akis.json, icerik.json. Hatalı ya da geçersiz bir yanıt son
 * sağlam veriyi SİLMEZ — deploy arızasında ya da internet kesildiğinde ekran boşalmaz.
 */
import type { EkranVakitleri } from '../lib/ekran/vakit-kapisi.ts';
import type { EkranDuyuru } from '../lib/ekran/akis.ts';
import type { EkranIcerik } from '../lib/ekran/icerik.ts';
import type { SlaytAyari } from '../lib/ekran/secim.ts';

export interface AkisGovdesi {
  derleme: string;
  ayar: { slayt: SlaytAyari; gece: { kapanmaDk: number; acilmaDk: number }; duyuruVarsayilanGun: number };
  duyurular: EkranDuyuru[];
}
export type IcerikGovdesi = EkranIcerik & { derleme: string };
export interface EkranVerisi { vakit: EkranVakitleri | null; akis: AkisGovdesi | null; icerik: IcerikGovdesi | null }

const nesne = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

export function vakitGecerli(x: unknown): x is EkranVakitleri {
  return nesne(x) && x.kaynakTuru === 'diyanet' && x.ilce === '11890' && Array.isArray(x.gunler) && x.gunler.length > 0;
}
export function akisGecerli(x: unknown): x is AkisGovdesi {
  return nesne(x) && Array.isArray(x.duyurular) && nesne(x.ayar) && nesne(x.ayar.slayt);
}
export function icerikGecerli(x: unknown): x is IcerikGovdesi {
  return nesne(x) && Array.isArray(x.ayetler) && Array.isArray(x.hadisler);
}

async function getir<T>(yol: string, gecerli: (x: unknown) => x is T): Promise<T | null> {
  try {
    const yanit = await fetch(yol, { cache: 'no-cache' });
    if (!yanit.ok) return null;
    const govde: unknown = await yanit.json();
    return gecerli(govde) ? govde : null;
  } catch {
    return null;
  }
}

export async function tazele(v: EkranVerisi): Promise<void> {
  const [vakit, akis, icerik] = await Promise.all([
    getir('/ekran/vakitler.json', vakitGecerli),
    getir('/ekran/akis.json', akisGecerli),
    getir('/ekran/icerik.json', icerikGecerli),
  ]);
  if (vakit) v.vakit = vakit;
  if (akis) v.akis = akis;
  if (icerik) v.icerik = icerik;
}
```

- [ ] **Adım 4: Testin geçtiğini gör.** Komut: `node --test tests/ekran-veri.test.mjs`. Beklenen: 3 test PASS.

- [ ] **Adım 5: Küçük istemci modüllerini yaz.**

`src/ekran/metinler.ts`:

```ts
/** Ekrana özgü iki dilli sabit metinler. Vakit adları site sözlüğünden gelir (src/i18n/ui.ts → sayfa verisi). */
export const METIN = {
  ayet: { tr: 'Günün Ayeti', fr: 'Verset du jour' },
  hadis: { tr: 'Günün Hadisi', fr: 'Hadith du jour' },
  duyuru: { tr: 'Duyuru', fr: 'Annonce' },
  vaktine: { tr: 'vaktine', fr: 'dans' },
  vakitYok: { tr: 'Namaz vakitleri güncellenemedi', fr: 'Horaires de prière indisponibles' },
  saatYok: { tr: 'Saat doğrulanıyor', fr: 'Heure en vérification' },
  hosgeldiniz: { tr: 'Hoş geldiniz', fr: 'Bienvenue' },
} as const;
```

`src/ekran/gorunum.ts`:

```ts
/** Küçük DOM yardımcıları. Metin her zaman textContent ile yazılır: CMS metni HTML olarak yorumlanmaz. */
export const alan = (ad: string): HTMLElement | null => document.querySelector(`[data-alan="${ad}"]`);

export function yaz(ad: string, metin: string): void {
  const e = alan(ad);
  if (e && e.textContent !== metin) e.textContent = metin;
}

export function el(etiket: string, sinif?: string, metin?: string): HTMLElement {
  const e = document.createElement(etiket);
  if (sinif) e.className = sinif;
  if (metin !== undefined) e.textContent = metin;
  return e;
}
```

`src/ekran/olcek.ts`:

```ts
/**
 * Dikey tuval (9:16) ekrana sığdırılır. Kutu yatay 16:9 sinyal verir; ekran dikey asıldığında ?don=90
 * (ya da 270) tuvali döndürür. Bütün ölçüler --u'ya bağlıdır (tuval genişliğinin %1'i, px): eski
 * WebView'de cqw/clamp olmadığı için ölçek JS ile verilir.
 */
export function olcekKur(tuval: HTMLElement, don: 0 | 90 | 270): void {
  const uygula = (): void => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const alanG = don ? H : W;
    const alanY = don ? W : H;
    const g = Math.min(alanG, (alanY * 9) / 16);
    const y = (g * 16) / 9;
    tuval.style.width = g + 'px';
    tuval.style.height = y + 'px';
    tuval.style.setProperty('--u', g / 100 + 'px');
    const x = (W - (don ? y : g)) / 2;
    const ust = (H - (don ? g : y)) / 2;
    tuval.style.transformOrigin = '0 0';
    tuval.style.transform =
      don === 90 ? `translate(${x + y}px, ${ust}px) rotate(90deg)`
      : don === 270 ? `translate(${x}px, ${ust + g}px) rotate(270deg)`
      : `translate(${x}px, ${ust}px)`;
  };
  uygula();
  window.addEventListener('resize', uygula);
}
```

- [ ] **Adım 6: İstemcinin giriş dosyasını yaz.** Dosya: `src/ekran/main.ts`

```ts
/**
 * Cami ekranı istemcisi — /ekran/ekran.js (27 Eylül 2026).
 * scripts/ekran-derle.mjs bu dosyayı eski Android TV WebView'lerine (Chromium 70) uygun pakete çevirir.
 * Saat ve takvim Brüksel'e göredir, cihazın saat diliminden bağımsızdır (src/lib/namaz.ts → TZ).
 * Veri: /ekran/vakitler.json, /ekran/akis.json, /ekran/icerik.json (10 dakikada bir tazelenir).
 */
import { hicriCevir } from '../i18n/hicri.ts';
import { bugunTarih, TZ } from '../lib/namaz.ts';
import { brukselSaat, donmeOku, saatGecerliMi } from '../lib/ekran/secim.ts';
import { yaz } from './gorunum.ts';
import { METIN } from './metinler.ts';
import { olcekKur } from './olcek.ts';
import { tazele, type EkranVerisi } from './veri.ts';

interface SayfaVerisi {
  cami: { tr: string; fr: string };
  vakit: Record<'tr' | 'fr', Record<string, string>>;
  gps: { enlem: number; boylam: number };
}

const sayfa = JSON.parse(document.getElementById('ekran-veri')?.textContent || '{}') as SayfaVerisi;
const parametre = new URLSearchParams(location.search);
const ekran = document.getElementById('ekran') as HTMLElement;
olcekKur(ekran, donmeOku(parametre.get('don')));
yaz('cami-tr', sayfa.cami.tr);
yaz('cami-fr', sayfa.cami.fr);

const veri: EkranVerisi = { vakit: null, akis: null, icerik: null };
const TARIH_TR = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const TARIH_FR = new Intl.DateTimeFormat('fr-BE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const iki = (n: number): string => (n < 10 ? '0' : '') + n;

/** Dakikada bir ve her veri tazelemesinden sonra yeniden çizilenler. */
function dakikalik(simdi: Date): void {
  const gecerli = saatGecerliMi(simdi);
  yaz('tarih-tr', gecerli ? TARIH_TR.format(simdi) : '');
  yaz('tarih-fr', gecerli ? TARIH_FR.format(simdi) : '');
  const bugun = bugunTarih(simdi);
  const gun = gecerli && veri.vakit ? veri.vakit.gunler.filter((g) => g.tarih === bugun)[0] : undefined;
  yaz('hicri-tr', gun ? gun.hicri : '');
  yaz('hicri-fr', gun ? hicriCevir(gun.hicri, 'fr') : '');
}

let sonDakika = -1;
function saniyelik(): void {
  const simdi = new Date();
  if (saatGecerliMi(simdi)) {
    const s = brukselSaat(simdi);
    yaz('saat-sd', iki(s.sa) + ':' + iki(s.dk));
    yaz('saat-sn', ':' + iki(s.sn));
    ekran.classList.remove('saat-yok');
  } else {
    yaz('saat-sd', METIN.saatYok.tr + ' · ' + METIN.saatYok.fr);
    yaz('saat-sn', '');
    ekran.classList.add('saat-yok');
  }
  const dakika = Math.floor(simdi.getTime() / 60_000);
  if (dakika !== sonDakika) {
    sonDakika = dakika;
    dakikalik(simdi);
  }
  setTimeout(saniyelik, 1000 - (Date.now() % 1000) + 15);
}

async function veriDongusu(): Promise<void> {
  await tazele(veri);
  dakikalik(new Date());
  setTimeout(() => { void veriDongusu(); }, 10 * 60_000);
}

saniyelik();
void veriDongusu();
```

- [ ] **Adım 7: Stil dosyasını yaz.** Dosya: `src/ekran/ekran.css`. Bütün bölümlerin stili burada bir kez yazılır; Görev 6–9 yalnız HTML'i doldurur.

```css
/* Cami ekranı — /ekran/ekran.css. scripts/ekran-derle.mjs başına kurumsal renk değişkenlerini
   (src/data/kurumsal-kimlik.json) ekler: --ana --siyah --beyaz --zemin --yuzey --metin --ikincil --cizgi.
   ESKİ WEBVIEW UYUMU (Chromium 70): yeni renk fonksiyonları, clamp/min/max, has seçicisi, layer ve
   container kuralları, kapsayıcı/dinamik görüntü birimleri, inset, aspect-ratio, gap ve iç içe kural
   KULLANILMAZ — tests/ekran-eski-tarayici.test.mjs denetler. Bütün ölçüler --u'ya bağlıdır. */

@font-face { font-family: 'Work Sans'; font-style: normal; font-weight: 100 900; font-display: swap; src: url(fonts/work-sans-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Work Sans'; font-style: normal; font-weight: 100 900; font-display: swap; src: url(fonts/work-sans-latin-ext.woff2) format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
@font-face { font-family: 'Amiri'; font-style: normal; font-weight: 400; font-display: swap; src: url(fonts/amiri-arabic.woff2) format('woff2'); unicode-range: U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC; }

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; background: var(--siyah); }
[hidden] { display: none !important; }
.sahne { position: fixed; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; background: var(--siyah); }
.ekran { position: absolute; left: 0; top: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--zemin); color: var(--metin); font-family: 'Work Sans', 'Segoe UI', Arial, sans-serif; font-size: calc(var(--u) * 3); line-height: 1.3; -webkit-font-smoothing: antialiased; transition: background-color .6s, color .6s; }
.ekran[data-tema='koyu'] { background: var(--siyah); color: var(--zemin); }
.fr { opacity: .78; }

/* Üst bant: kimlik, saat, hava, miladi ve hicrî tarih */
.ust { height: calc(var(--u) * 44); padding: calc(var(--u) * 3.5) calc(var(--u) * 5) calc(var(--u) * 2.5); border-bottom: calc(var(--u) * .7) solid var(--ana); overflow: hidden; }
.kimlik { display: flex; align-items: center; height: calc(var(--u) * 12); }
.logo { width: calc(var(--u) * 11); height: calc(var(--u) * 11); margin-right: calc(var(--u) * 3); }
.ekran[data-tema='acik'] .logo-koyu, .ekran[data-tema='koyu'] .logo-acik { display: none; }
.cami-adi span { display: block; }
.cami-adi span:first-child { font-weight: 700; font-size: calc(var(--u) * 4.6); line-height: 1.1; }
.cami-adi .fr { font-size: calc(var(--u) * 3.2); margin-top: calc(var(--u) * .6); }
.zaman { display: flex; align-items: center; justify-content: space-between; height: calc(var(--u) * 17); }
.saat { font-weight: 700; font-size: calc(var(--u) * 16); line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; white-space: nowrap; }
.saat small { font-size: .4em; font-weight: 600; opacity: .7; }
.ekran.saat-yok .saat { font-size: calc(var(--u) * 5); color: var(--ana); white-space: normal; }
.takvim { font-size: calc(var(--u) * 3.3); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.takvim.fr { font-size: calc(var(--u) * 2.8); }
.hava { display: flex; align-items: center; font-weight: 700; font-size: calc(var(--u) * 5); }
.hava svg { width: calc(var(--u) * 7); height: calc(var(--u) * 7); margin-right: calc(var(--u) * 1.5); }
.hava small { font-weight: 400; font-size: calc(var(--u) * 1.8); opacity: .6; margin-left: calc(var(--u) * 1.5); }

/* Orta: slayt alanı */
.slayt-alani { flex: 1; position: relative; overflow: hidden; padding: calc(var(--u) * 4) calc(var(--u) * 5); background: var(--yuzey); }
.ekran[data-tema='koyu'] .slayt-alani { background: var(--metin); }
.slayt { height: 100%; display: flex; flex-direction: column; justify-content: center; }
.ust-baslik { font-size: calc(var(--u) * 2.8 * var(--olcek, 1)); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ana); margin-bottom: calc(var(--u) * 3 * var(--olcek, 1)); }
.slayt .ar { font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl; text-align: right; font-size: calc(var(--u) * 6.4 * var(--olcek, 1)); line-height: 1.85; margin-bottom: calc(var(--u) * 2.5 * var(--olcek, 1)); }
.slayt .baslik { font-weight: 700; font-size: calc(var(--u) * 5.6 * var(--olcek, 1)); line-height: 1.15; margin-bottom: calc(var(--u) * 1.5 * var(--olcek, 1)); }
.slayt .baslik.fr { font-size: calc(var(--u) * 4.4 * var(--olcek, 1)); margin-top: calc(var(--u) * 3 * var(--olcek, 1)); }
.slayt .tr { font-size: calc(var(--u) * 4.4 * var(--olcek, 1)); line-height: 1.38; font-weight: 500; }
.slayt p.fr { font-size: calc(var(--u) * 3.6 * var(--olcek, 1)); line-height: 1.38; margin-top: calc(var(--u) * 2 * var(--olcek, 1)); }
.slayt .kaynak { font-size: calc(var(--u) * 2.6 * var(--olcek, 1)); opacity: .7; margin-top: calc(var(--u) * 3 * var(--olcek, 1)); }
.slayt img { display: block; max-width: 100%; max-height: calc(var(--u) * 30); margin: 0 auto calc(var(--u) * 3); object-fit: contain; }
.slayt.bos { align-items: center; text-align: center; }
.slayt.bos b { font-size: calc(var(--u) * 7); color: var(--ana); }

/* Alt: vakitler ve geri sayım */
.vakitler { height: calc(var(--u) * 56); border-top: calc(var(--u) * .7) solid var(--ana); display: flex; flex-direction: column; }
.vakit { display: flex; align-items: center; justify-content: space-between; height: calc(var(--u) * 7.4); padding: 0 calc(var(--u) * 5); border-bottom: 1px solid var(--cizgi); }
.ekran[data-tema='koyu'] .vakit { border-bottom-color: var(--metin); }
.vakit .ad b { font-weight: 700; font-size: calc(var(--u) * 4.6); }
.vakit .ad i { font-style: normal; font-size: calc(var(--u) * 3.1); opacity: .7; margin-left: calc(var(--u) * 2); }
.vakit .deger { font-weight: 700; font-size: calc(var(--u) * 5.8); font-variant-numeric: tabular-nums; }
.vakit.siradaki { background: var(--ana); color: var(--beyaz); border-bottom-color: var(--ana); }
.vakit.siradaki .ad i { opacity: .9; }
.geri-sayim { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 calc(var(--u) * 5); }
.geri-sayim b { font-size: calc(var(--u) * 3.8); }
.geri-sayim .fr { font-size: calc(var(--u) * 3); }
.vakit-yok { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: calc(var(--u) * 5); color: var(--ana); }
.vakit-yok b { font-size: calc(var(--u) * 5); }
.vakit-yok .fr { font-size: calc(var(--u) * 3.8); margin-top: calc(var(--u) * 1.5); }
```

- [ ] **Adım 8: Sayfa iskeletini yaz.** Dosya: `src/pages/ekran/index.astro`

```astro
---
/**
 * /ekran/ — cami ekranı (27 Eylül 2026; docs/EKRAN-YOL-HARITASI.md). Android TV kutusundaki kabuk
 * uygulaması bu sayfayı tam ekran açar: /ekran/?ekran=ana|giris|kadin&don=90.
 * Statik iskelet: görüntüyü /ekran/ekran.js doldurur (src/ekran/main.ts → scripts/ekran-derle.mjs).
 * Sitenin Base düzeni ve Tailwind CSS'i bilerek kullanılmaz: ekran eski WebView'de (Chromium 70) de
 * çalışmalı. Arama motorlarına kapalıdır (noindex + robots.txt).
 */
import { ui } from '../../i18n/ui';
import kimlik from '../../data/kurumsal-kimlik.json';
import { siteAyarlari } from '../../lib/icerik';
import { SIRA } from '../../lib/namaz';

const ayar = await siteAyarlari();
const vakitAdlari = (dil: 'tr' | 'fr'): Record<string, string> => {
  const sozluk = ui[dil] as Record<string, string>;
  const adlar: Record<string, string> = { cuma: sozluk['namaz.cumaKisa'], cumaUzun: sozluk['namaz.cuma'] };
  for (const v of SIRA) adlar[v] = sozluk[`namaz.${v}`];
  return adlar;
};
const sayfaVerisi = {
  cami: { tr: kimlik.kurumlar.cami.ad.tr, fr: kimlik.kurumlar.cami.ad.fr },
  vakit: { tr: vakitAdlari('tr'), fr: vakitAdlari('fr') },
  gps: { enlem: ayar.gps.enlem, boylam: ayar.gps.boylam },
};
---
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>{kimlik.kurumlar.cami.kisaAd} · Ekran</title>
    <link rel="stylesheet" href="/ekran/ekran.css" />
  </head>
  <body>
    <div class="sahne">
      <main id="ekran" class="ekran" data-tema="acik">
        <header class="ust">
          <div class="kimlik">
            <img class="logo logo-acik" src="/media/logo/ulu-camii-logo.svg" alt="" />
            <img class="logo logo-koyu" src="/media/logo/ulu-camii-logo-beyaz.svg" alt="" />
            <div class="cami-adi"><span data-alan="cami-tr"></span><span class="fr" lang="fr" data-alan="cami-fr"></span></div>
          </div>
          <div class="zaman">
            <div class="saat" data-alan="saat"><span data-alan="saat-sd">--:--</span><small data-alan="saat-sn"></small></div>
            <div class="hava" data-alan="hava" hidden></div>
          </div>
          <div class="takvim"><span data-alan="tarih-tr"></span> · <span data-alan="hicri-tr"></span></div>
          <div class="takvim fr" lang="fr"><span data-alan="tarih-fr"></span> · <span data-alan="hicri-fr"></span></div>
        </header>
        <section class="slayt-alani" data-alan="slayt"></section>
        <section class="vakitler" data-alan="vakitler"></section>
      </main>
    </div>
    <script is:inline id="ekran-veri" type="application/json" set:html={JSON.stringify(sayfaVerisi)}></script>
    <script is:inline src="/ekran/ekran.js"></script>
  </body>
</html>
```

- [ ] **Adım 9: Paketleme betiğini yaz.** Dosya: `scripts/ekran-derle.mjs`

```js
/**
 * Cami ekranı istemci paketini üretir → public/ekran/ (üretilen çıktı; .gitignore'da, her derlemede yenilenir).
 *
 * Neden ayrı paket: ekran ikinci el Android TV kutularının WebView'ünde çalışır; hesapsız kurulan
 * Android 9 kutusunda WebView Chromium 70 civarında kalabilir. Sitenin Vite/Tailwind 4 çıktısı yeni
 * tarayıcı ister; esbuild bu paketin SÖZDİZİMİNİ chrome70'e indirir (API'ler inmez — src/ekran/ ve
 * src/lib/ekran/ yalnız Chromium 70'te olan API'leri kullanır; tests/ekran-eski-tarayici.test.mjs denetler).
 * Renkler kurumsal kimlik dosyasından CSS değişkeni olarak eklenir (elle renk yazılmaz).
 *
 * Kullanım: node scripts/ekran-derle.mjs [--izle]   (npm run build ve npm run dev bunu önce çalıştırır)
 */
import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const yol = (p) => fileURLToPath(new URL('../' + p, import.meta.url));
const CIKTI = yol('public/ekran/');
const HEDEF = ['chrome70'];

mkdirSync(CIKTI + 'fonts', { recursive: true });
const FONTLAR = {
  'work-sans-latin.woff2': 'node_modules/@fontsource-variable/work-sans/files/work-sans-latin-wght-normal.woff2',
  'work-sans-latin-ext.woff2': 'node_modules/@fontsource-variable/work-sans/files/work-sans-latin-ext-wght-normal.woff2',
  'amiri-arabic.woff2': 'node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff2',
};
for (const [ad, kaynak] of Object.entries(FONTLAR)) copyFileSync(yol(kaynak), CIKTI + 'fonts/' + ad);

const kimlik = JSON.parse(readFileSync(yol('src/data/kurumsal-kimlik.json'), 'utf8'));
const r = kimlik.gorunum.ortakRenk;
const cami = kimlik.kurumlar.cami.renk;
const degiskenler = `:root{--ana:${cami.ana};--siyah:${cami.koyu};--beyaz:${cami.acik};--zemin:${r.zemin};--yuzey:${r.acikYuzey};--metin:${r.metin};--ikincil:${r.ikincil};--cizgi:${r.cizgi}}\n`;
writeFileSync(CIKTI + 'ekran.css', degiskenler + readFileSync(yol('src/ekran/ekran.css'), 'utf8'));

const ortak = { bundle: true, format: 'iife', target: HEDEF, minify: true, legalComments: 'none', logLevel: 'warning', charset: 'utf8' };
const paketler = [{ ...ortak, entryPoints: [yol('src/ekran/main.ts')], outfile: CIKTI + 'ekran.js' }];

if (process.argv.includes('--izle')) {
  for (const p of paketler) await (await context(p)).watch();
  console.log('[ekran] paket izleniyor (CSS değişince betiği yeniden çalıştırın)…');
} else {
  await Promise.all(paketler.map((p) => build(p)));
  console.log('[ekran] paket hazır → public/ekran/');
}
```

- [ ] **Adım 10: `package.json` ve `.gitignore` dosyalarını güncelle.**
  - `package.json` → `scripts` içinde:
    - `"dev": "node scripts/ekran-derle.mjs && astro dev"`
    - `"build": "node scripts/ekran-derle.mjs && astro build"`
    - Yeni: `"ekran:derle": "node scripts/ekran-derle.mjs"`
    - Yeni: `"test:ekran": "node --test tests/ekran-vakit-kapisi.test.mjs tests/ekran-akis.test.mjs tests/ekran-icerik.test.mjs tests/ekran-secim.test.mjs tests/ekran-veri.test.mjs tests/ekran-eski-tarayici.test.mjs"`
  - `.gitignore` sonuna şunu ekle:

```
# Cami ekranı istemci paketi — scripts/ekran-derle.mjs üretir (build/dev öncesi); depoya girmez.
public/ekran/
```

- [ ] **Adım 11: Eski WebView testini yaz.** Dosya: `tests/ekran-eski-tarayici.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* Ekran ikinci el Android TV kutusunun WebView'ünde çalışır; hesapsız kurulan Android 9 kutusunda bu
   Chromium 70 civarında kalabilir (docs/EKRAN-YOL-HARITASI.md → riskler). esbuild sözdizimini indirir
   ama API'leri ve CSS özelliklerini indirmez: yasaklı olanlar paket çıktısında aranır. */
const kok = fileURLToPath(new URL('../', import.meta.url));
const oku = (p) => readFileSync(kok + p, 'utf8');
test.before(() => { execFileSync(process.execPath, ['scripts/ekran-derle.mjs'], { cwd: kok, stdio: 'pipe' }); });

const YASAK_JS = [/\?\.(?!\d)/, /\?\?/, /\.at\(/, /Object\.fromEntries/, /Object\.hasOwn/, /\.replaceAll\(/, /structuredClone/, /Promise\.allSettled/, /\.findLast(Index)?\(/, /\|\|=|&&=/];
const YASAK_CSS = [/oklch\(/, /color-mix\(/, /\bclamp\(/, /(^|[^-\w])min\(/, /(^|[^-\w])max\(/, /:has\(/, /@layer/, /@container/, /\d(cqw|cqh|cqi|cqb|dvh|svh|lvh|dvw|svw|lvw)\b/, /(^|[;{\s])inset\s*:/, /aspect-ratio/, /(^|[;{\s])(row-|column-)?gap\s*:/, /&/];

for (const dosya of ['public/ekran/ekran.js']) {
  test(`${dosya} Chromium 70 dışı sözdizimi ya da API içermez`, () => {
    const js = oku(dosya);
    for (const r of YASAK_JS) assert.doesNotMatch(js, r, `${dosya}: ${r}`);
  });
}

test('ekran.css yalnız Chromium 70 CSS özelliklerini kullanır; renk kimlik dosyasından gelir', () => {
  const css = oku('public/ekran/ekran.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const r of YASAK_CSS) assert.doesNotMatch(css, r, `ekran.css: ${r}`);
  assert.match(css, /--ana:#E30A17/i);
});

test('fontlar pakete kopyalanır', () => {
  for (const f of ['work-sans-latin.woff2', 'work-sans-latin-ext.woff2', 'amiri-arabic.woff2']) assert.ok(existsSync(kok + 'public/ekran/fonts/' + f), f);
});
```

- [ ] **Adım 12: Paket testlerini çalıştır.** Komut: `node --test tests/ekran-eski-tarayici.test.mjs tests/ekran-veri.test.mjs`. Beklenen: hepsi PASS. Tarama bir API yakalarsa ilgili kaynak satırı Chromium 70 karşılığıyla değiştirilir; test gevşetilmez.

- [ ] **Adım 13: Tarayıcı testini yaz.** Dosya: `tests/web/ekran.spec.mjs`

```js
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brukselTarih } from '../../src/lib/namaz.ts';

/* Cami ekranı (/ekran/, docs/EKRAN-FAZ1-UYGULAMA-PLANI.md). Tuval dikey 1080×1920; kutu yatay sinyal
   verdiğinde ?don=90. Saat page.clock ile kurulur. Testler bilerek New York saat diliminde koşar:
   ekran cihazın saat diliminden bağımsız olarak Brüksel saatini göstermeli. Vakit akışı derleme gününe
   bağlı kalmasın diye kaynak Diyanet dosyasından verilir. */
test.use({ viewport: { width: 1080, height: 1920 }, timezoneId: 'America/New_York', locale: 'en-US' });

const kaynak = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/namaz-vakitleri.json'), 'utf8'));
const vakitAkisi = (gunler = kaynak.gunler) => ({ kaynak: kaynak.kaynak, kaynakTuru: 'diyanet', ilce: '11890', ilceAdi: kaynak.ilceAdi, guncelleme: kaynak.guncelleme, gunler, atlanan: [] });
const cumaMi = (g) => new Date(g.tarih + 'T12:00:00Z').getUTCDay() === 5;
const ornek = kaynak.gunler.find((g, i) => i >= 2 && !cumaMi(g));
const an = (g, hm, dkFark = 0) => new Date(brukselTarih(g.tarih, hm).getTime() + dkFark * 60_000);
const ayAdi = (t, yerel) => new Intl.DateTimeFormat(yerel, { timeZone: 'Europe/Brussels', month: 'long' }).format(t);

test.beforeEach(async ({ context }) => {
  test.skip(test.info().project.name !== 'masaustu-chromium', 'ekran testleri tek tarayıcı projesinde koşar');
  // Ağ yalıtımı (depodaki öteki web testleriyle aynı): 4401 dışındaki HTTP ve WebSocket kesilir.
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    return u.origin === 'http://127.0.0.1:4401' || u.origin === 'http://localhost:4401' ? route.continue() : route.abort('blockedbyclient');
  });
  await context.routeWebSocket(/.*/, (socket) => socket.close());
  await context.route('**/ekran/vakitler.json', (route) => route.fulfill({ json: vakitAkisi() }));
});

test('kimlik, saat, miladi ve hicrî tarih Brüksel saatine göre yazılır', async ({ page }) => {
  const t = an(ornek, '12:00');
  await page.clock.install({ time: t });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="cami-tr"]')).toHaveText('Marche-en-Famenne Ulu Camii');
  await expect(page.locator('[data-alan="saat"]')).toHaveText(/^12:00:0\d$/);
  await expect(page.locator('[data-alan="tarih-tr"]')).toContainText(ayAdi(t, 'tr-TR'));
  await expect(page.locator('[data-alan="tarih-fr"]')).toContainText(ayAdi(t, 'fr-BE'));
  await expect(page.locator('[data-alan="hicri-tr"]')).toHaveText(ornek.hicri);
});

test('gece yarısı ve yaz saatinin bitişi sayfa yenilenmeden işlenir', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-24T23:59:50+02:00') });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="tarih-tr"]')).toContainText('24 Ekim 2026');
  await page.clock.runFor(20_000);
  await expect(page.locator('[data-alan="tarih-tr"]')).toContainText('25 Ekim 2026');
  await page.clock.setSystemTime(new Date('2026-10-25T00:59:58Z'));
  await page.clock.runFor(4_000);
  await expect(page.locator('[data-alan="saat"]')).toHaveText(/^02:00:0\d$/);
});

test('saat pilsiz kutuda 1970e dönmüşse vakit yerine uyarı gösterilir', async ({ page }) => {
  await page.clock.install({ time: new Date(0) });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="saat"]')).toContainText('Saat doğrulanıyor');
});

test.describe('yatay sinyalde döndürme', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test('?don=90 dikey tuvali yatay ekrana taşmadan tam sığdırır', async ({ page }) => {
    await page.goto('/ekran/?don=90');
    const kutu = await page.locator('#ekran').boundingBox();
    expect(Math.round(kutu.width)).toBe(1920);
    expect(Math.round(kutu.height)).toBe(1080);
    expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([1920, 1080]);
  });
});
```

- [ ] **Adım 14: Derleyip tarayıcı testini çalıştır.** Komut: `npm run build && npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium`. Beklenen: 4 test PASS. Playwright önizleme sunucusunu (4401) kendisi açıp kapatır.

- [ ] **Adım 15: Commit.**

```bash
git add scripts/ekran-derle.mjs src/ekran src/pages/ekran/index.astro tests/ekran-veri.test.mjs tests/ekran-eski-tarayici.test.mjs tests/web/ekran.spec.mjs package.json .gitignore
git commit -m "Ekran: eski WebView uyumlu istemci paketi, sayfa iskeleti, saat ve takvim" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 6: Vakit listesi, geri sayım, Cuma ve tema

**Dosyalar:**
- Oluştur: `src/ekran/vakitler.ts`
- Değiştir: `src/ekran/main.ts`, `tests/web/ekran.spec.mjs`

**Arayüzler:**
- Kullanır: `vakitGorunumu`, `temaSec` (Görev 4); `namaz.ts` → `SIRA`, `sureMetni`, `Vakit`.
- Üretir: `vakitleriCiz(kok: HTMLElement, v: VakitGorunumu | null, ad: VakitAdlari, saatGecerli: boolean): void`. DOM: `.vakit[data-vakit]`, `.vakit.siradaki`, `.geri-sayim b`, `.geri-sayim .fr`, `.vakit-yok`.

- [ ] **Adım 1: Başarısız tarayıcı testlerini ekle.** Bunlar `tests/web/ekran.spec.mjs` dosyasının sonuna eklenir.

```js
test('sıradaki vakit vurgulanır, geri sayım iki dilde yazılır', async ({ page }) => {
  await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await expect(page.locator('.vakit.siradaki')).toHaveAttribute('data-vakit', 'ogle');
  await expect(page.locator('.vakit[data-vakit="ogle"] .deger')).toHaveText(ornek.ogle);
  await expect(page.locator('.geri-sayim b')).toHaveText('Öğle vaktine 30 dk');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Dhuhr dans 30 min');
});

test('Cuma günü öğle satırı ve geri sayım Cuma olarak yazılır', async ({ page }) => {
  const cuma = kaynak.gunler.find(cumaMi);
  test.skip(!cuma, 'veride Cuma yok');
  await page.clock.install({ time: an(cuma, cuma.ogle, -90) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad b')).toHaveText('Cuma');
  await expect(page.locator('.vakit[data-vakit="ogle"] .ad i')).toHaveText('Vendredi');
  await expect(page.locator('.geri-sayim .fr')).toHaveText('Prière du vendredi dans 1 h 30');
});

test('tema güneşten akşama açık, akşam vaktinden sonra koyu', async ({ page }) => {
  await page.clock.install({ time: an(ornek, ornek.aksam, -1) });
  await page.goto('/ekran/');
  await expect(page.locator('#ekran')).toHaveAttribute('data-tema', 'acik');
  await page.clock.runFor(2 * 60_000);
  await expect(page.locator('#ekran')).toHaveAttribute('data-tema', 'koyu');
});

test('bugünün Diyanet kaydı yoksa vakit yerine uyarı çıkar, geri sayım yapılmaz', async ({ page }) => {
  await page.route('**/ekran/vakitler.json', (r) => r.fulfill({ json: vakitAkisi(kaynak.gunler.filter((g) => g.tarih !== ornek.tarih)) }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit-yok b')).toHaveText('Namaz vakitleri güncellenemedi');
  await expect(page.locator('.vakit')).toHaveCount(0);
  await expect(page.locator('.geri-sayim')).toHaveCount(0);
});
```

- [ ] **Adım 2: Testlerin başarısız olduğunu gör.** Komut: `npm run build && npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium -g "vakit|Cuma|tema"`. Beklenen: `.vakit` bulunamadığı için FAIL.

- [ ] **Adım 3: Vakit bölümünü yaz.** Dosya: `src/ekran/vakitler.ts`

```ts
/** Alt bölüm: altı vakit (TR · FR adlarıyla), sıradaki vakit vurgusu ve iki dilli geri sayım. */
import { SIRA, sureMetni, type Vakit } from '../lib/namaz.ts';
import type { VakitGorunumu } from '../lib/ekran/secim.ts';
import { el } from './gorunum.ts';
import { METIN } from './metinler.ts';

export type VakitAdlari = Record<'tr' | 'fr', Record<string, string>>;

function uyari(kok: HTMLElement, m: { tr: string; fr: string }): void {
  const kutu = el('div', 'vakit-yok');
  kutu.appendChild(el('b', '', m.tr));
  const fr = el('span', 'fr', m.fr);
  fr.setAttribute('lang', 'fr');
  kutu.appendChild(fr);
  kok.appendChild(kutu);
}

export function vakitleriCiz(kok: HTMLElement, v: VakitGorunumu | null, ad: VakitAdlari, saatGecerli: boolean): void {
  kok.textContent = '';
  if (!saatGecerli) return uyari(kok, METIN.saatYok);
  if (!v) return uyari(kok, METIN.vakitYok);
  const adi = (dil: 'tr' | 'fr', vakit: Vakit, uzun = false): string =>
    v.cuma && vakit === 'ogle' ? ad[dil][uzun ? 'cumaUzun' : 'cuma'] : ad[dil][vakit];
  const vurgu = v.siradaki && !v.siradaki.yarinMi ? v.siradaki.vakit : null;
  for (const vakit of SIRA) {
    const satir = el('div', vakit === vurgu ? 'vakit siradaki' : 'vakit');
    satir.setAttribute('data-vakit', vakit);
    const adKutusu = el('span', 'ad');
    adKutusu.appendChild(el('b', '', adi('tr', vakit)));
    const fr = el('i', '', adi('fr', vakit));
    fr.setAttribute('lang', 'fr');
    adKutusu.appendChild(fr);
    satir.appendChild(adKutusu);
    satir.appendChild(el('span', 'deger', v.gun[vakit]));
    kok.appendChild(satir);
  }
  const sayim = el('div', 'geri-sayim');
  const s = v.siradaki;
  if (s) {
    sayim.appendChild(el('b', '', `${adi('tr', s.vakit)} ${METIN.vaktine.tr} ${sureMetni(s.kalanDk, 'tr')}`));
    const fr = el('span', 'fr', `${adi('fr', s.vakit, true)} ${METIN.vaktine.fr} ${sureMetni(s.kalanDk, 'fr')}`);
    fr.setAttribute('lang', 'fr');
    sayim.appendChild(fr);
  }
  kok.appendChild(sayim);
}
```

- [ ] **Adım 4: Vakit bölümünü `main.ts`'e bağla.** Dosya: `src/ekran/main.ts`
  - İçe aktarma satırlarını değiştir:
    - `import { brukselSaat, donmeOku, saatGecerliMi } from '../lib/ekran/secim.ts';` → `import { brukselSaat, donmeOku, saatGecerliMi, temaSec, vakitGorunumu } from '../lib/ekran/secim.ts';`
    - `import { yaz } from './gorunum.ts';` → `import { alan, yaz } from './gorunum.ts';`
    - `import { olcekKur } from './olcek.ts';` satırının altına: `import { vakitleriCiz } from './vakitler.ts';`
  - `const veri: EkranVerisi = { vakit: null, akis: null, icerik: null };` satırının altına: `let ilkTazelemeBitti = false;`
  - `dakikalik` içinde `yaz('hicri-fr', …);` satırının altına:

```ts
  const gorunum = gecerli && veri.vakit ? vakitGorunumu(veri.vakit.gunler, simdi) : null;
  const kok = alan('vakitler');
  if (kok && (veri.vakit || ilkTazelemeBitti)) vakitleriCiz(kok, gorunum, sayfa.vakit, gecerli);
  ekran.setAttribute('data-tema', temaSec(gorunum ? gorunum.gun : undefined, simdi));
```

  - `veriDongusu` içinde `await tazele(veri);` satırının altına: `ilkTazelemeBitti = true;`

- [ ] **Adım 5: Testlerin geçtiğini gör.** Komut: `npm run build && npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium`. Beklenen: 8 test PASS. Ardından `node --test tests/ekran-eski-tarayici.test.mjs` da PASS vermeli.

- [ ] **Adım 6: Görsel kontrol testini ekle ve görüntüleri incele.** Bu test olağan koşuda atlanır, yalnız `EKRAN_GORSEL=1` verilince görüntü üretir. Sunucuyu Playwright açıp kapatır; elle önizleme sunucusu başlatılmaz. `tests/web/ekran.spec.mjs` dosyasının sonuna eklenir:

```js
test('görsel kontrol görüntüleri (yalnız EKRAN_GORSEL=1)', async ({ page }) => {
  test.skip(!process.env.EKRAN_GORSEL, 'görüntü üretimi isteğe bağlı');
  await page.clock.install({ time: an(ornek, ornek.ogle, -30) });
  await page.goto('/ekran/');
  await expect(page.locator('.vakit')).toHaveCount(6);
  await page.screenshot({ path: 'test-results/ekran-gorsel/dikey-acik.png' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.clock.setSystemTime(an(ornek, ornek.aksam, 30));
  await page.goto('/ekran/?don=90');
  await expect(page.locator('#ekran')).toHaveAttribute('data-tema', 'koyu');
  await page.screenshot({ path: 'test-results/ekran-gorsel/yatay-don90-koyu.png' });
});
```

  - Komutlar:

```bash
EKRAN_GORSEL=1 npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium -g EKRAN_GORSEL
ffmpeg -y -loglevel error -i test-results/ekran-gorsel/dikey-acik.png -vf scale=-2:1500 test-results/ekran-gorsel/dikey-acik-1500.png
ffmpeg -y -loglevel error -i test-results/ekran-gorsel/yatay-don90-koyu.png -vf scale=1500:-2 test-results/ekran-gorsel/yatay-don90-koyu-1500.png
```

  - Yalnız `-1500` ile biten küçültülmüş görüntüler okunur. `test-results/` gitignore'dadır.
  - Kontrol listesi:
    - Yazılar taşmıyor.
    - Saat ile hava çakışmıyor.
    - Vakit satırları eşit.
    - Sıradaki vakit kırmızı zeminde beyaz.
    - Koyu temada logo beyaz.

- [ ] **Adım 7: Commit.**

```bash
git add src/ekran/vakitler.ts src/ekran/main.ts tests/web/ekran.spec.mjs
git commit -m "Ekran: vakit listesi, iki dilli geri sayım, Cuma satırı ve gündüz/gece teması" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 7: Slaytlar (duyuru, günün ayeti, günün hadisi)

**Dosyalar:**
- Oluştur: `src/ekran/slaytlar.ts`
- Değiştir: `src/ekran/main.ts`, `tests/web/ekran.spec.mjs`

**Arayüzler:**
- Kullanır: `slaytListesi`, `slaytSuresi`, `ekranIdOku`, `type Slayt`, `type SlaytAyari` (Görev 4); `EkranVerisi` (Görev 5).
- Üretir:
  - `slaytCiz(kok, s: Slayt)`, `bosCiz(kok, cami)`, `sigdir(kok)`
  - DOM: `.slayt-duyuru`, `.slayt-ayet`, `.slayt-hadis`, `.slayt.bos`, `.ar[dir=rtl][lang=ar]`, `p.fr[lang=fr]`, `.kaynak`

- [ ] **Adım 1: Başarısız tarayıcı testlerini ekle.** Bunlar `tests/web/ekran.spec.mjs` dosyasının sonuna eklenir.

```js
const SABIT_10SN = { tabanSn: 10, karakterSn: 0, enAzSn: 10, enCokSn: 10 };
const AKIS = (duyurular) => ({ derleme: '', ayar: { slayt: SABIT_10SN, gece: { kapanmaDk: 60, acilmaDk: 30 }, duyuruVarsayilanGun: 30 }, duyurular });
const DUYURU = (ek = {}) => ({ id: 'kermes', tur: 'duyuru', tr: { baslik: 'Hayır çarşısı', metin: 'Pazar günü öğleden sonra cami bahçesinde.' }, fr: { baslik: 'Kermesse', metin: 'Dimanche après-midi dans la cour de la mosquée.' }, baslangic: '2000-01-01', son: '2099-12-31', hedef: [], ...ek });
const ICERIK = { derleme: '', eksik: [],
  ayetler: [{ id: 'a1', referans: { tr: 'İnşirah, 94/5-6', fr: 'Ach-Charh, 94:5-6' }, ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Demek ki zorlukla beraber bir kolaylık vardır.', kaynakTr: 'Kur’an Yolu Meali (DİB)' }],
  hadisler: [{ id: 'h1', ar: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', tr: 'Mümin kardeşine tebessüm etmen senin için bir sadakadır.', fr: 'Sourire à ton frère est pour toi une aumône.', kaynak: 'Tirmizî, Birr, 36' }] };

test('slayt turu duyuru → günün ayeti → günün hadisi; TR ve FR alt alta', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU()]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  const slayt = page.locator('[data-alan="slayt"]');
  await expect(slayt.locator('.slayt-duyuru .baslik').first()).toHaveText('Hayır çarşısı');
  await expect(slayt.locator('.slayt-duyuru p.fr').last()).toHaveText('Dimanche après-midi dans la cour de la mosquée.');
  await page.clock.runFor(10_500);
  await expect(slayt.locator('.slayt-ayet .ar')).toHaveAttribute('dir', 'rtl');
  await expect(slayt.locator('.slayt-ayet .kaynak')).toContainText('İnşirah, 94/5-6');
  await page.clock.runFor(10_000);
  await expect(slayt.locator('.slayt-hadis p.fr')).toHaveText('Sourire à ton frère est pour toi une aumône.');
});

test('başka ekrana hedeflenmiş duyuru bu ekranda gösterilmez', async ({ page }) => {
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ hedef: ['giris'] })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/?ekran=kadin');
  await expect(page.locator('.slayt-ayet')).toBeVisible();
  await expect(page.locator('.slayt-duyuru')).toHaveCount(0);
});

test('uzun duyuru metni slayt alanından taşmaz', async ({ page }) => {
  const uzun = 'Cemaatimizin dikkatine: '.repeat(7).slice(0, 160);
  await page.route('**/ekran/akis.json', (r) => r.fulfill({ json: AKIS([DUYURU({ tr: { baslik: 'Yıllık genel kurul toplantısı ve yönetim kurulu seçimi hakkında', metin: uzun }, fr: { baslik: 'Assemblée générale annuelle et élection du conseil d’administration', metin: uzun } })]) }));
  await page.route('**/ekran/icerik.json', (r) => r.fulfill({ json: ICERIK }));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.slayt-duyuru')).toBeVisible();
  expect(await page.locator('[data-alan="slayt"]').evaluate((e) => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
});

test('akış bozulursa ekran son sağlam içerikle dönmeye devam eder', async ({ page }) => {
  let bozuk = false;
  await page.route('**/ekran/akis.json', (r) => (bozuk ? r.fulfill({ status: 500, body: 'hata' }) : r.fulfill({ json: AKIS([DUYURU()]) })));
  await page.route('**/ekran/icerik.json', (r) => (bozuk ? r.fulfill({ status: 200, contentType: 'application/json', body: '{bozuk' }) : r.fulfill({ json: ICERIK })));
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('.slayt-duyuru')).toBeVisible();
  bozuk = true;
  await page.clock.runFor(11 * 60_000);
  await expect(page.locator('[data-alan="slayt"] .slayt')).not.toHaveClass(/bos/);
  await expect(page.locator('.vakit')).toHaveCount(6);
});
```

- [ ] **Adım 2: Testlerin başarısız olduğunu gör.** Komut: `npm run build && npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium -g "slayt|duyuru|akış"`. Beklenen: FAIL.

- [ ] **Adım 3: Slayt bölümünü yaz.** Dosya: `src/ekran/slaytlar.ts`

```ts
/** Orta bölüm: duyuru, günün ayeti ve günün hadisi slaytları; metin kutuya sığana dek küçültülür. */
import type { Slayt } from '../lib/ekran/secim.ts';
import { el } from './gorunum.ts';
import { METIN } from './metinler.ts';

function paragraf(kok: HTMLElement, sinif: string, metin: string | undefined, dil?: 'fr' | 'ar'): void {
  if (!metin) return;
  const p = el('p', sinif, metin);
  if (dil) p.setAttribute('lang', dil);
  if (dil === 'ar') p.setAttribute('dir', 'rtl');
  kok.appendChild(p);
}

function ustBaslik(kok: HTMLElement, m: { tr: string; fr: string }): void {
  const b = el('div', 'ust-baslik', m.tr + ' · ');
  const fr = el('span', 'fr', m.fr);
  fr.setAttribute('lang', 'fr');
  b.appendChild(fr);
  kok.appendChild(b);
}

export function slaytCiz(kok: HTMLElement, s: Slayt): void {
  kok.textContent = '';
  const kart = el('article', 'slayt slayt-' + s.tur);
  ustBaslik(kart, METIN[s.tur]);
  if (s.tur === 'duyuru') {
    const d = s.oge;
    if (d.gorsel) {
      const img = document.createElement('img');
      img.alt = '';
      img.addEventListener('load', () => sigdir(kok));
      img.src = d.gorsel;
      kart.appendChild(img);
    }
    if (d.tr) { paragraf(kart, 'baslik', d.tr.baslik); paragraf(kart, 'tr', d.tr.metin); }
    if (d.fr) { paragraf(kart, 'baslik fr', d.fr.baslik, 'fr'); paragraf(kart, 'fr', d.fr.metin, 'fr'); }
  } else if (s.tur === 'ayet') {
    const a = s.oge;
    paragraf(kart, 'ar', a.ar, 'ar');
    paragraf(kart, 'tr', a.tr);
    paragraf(kart, 'fr', a.fr, 'fr');
    paragraf(kart, 'kaynak', `${a.referans.tr} · ${a.referans.fr} — ${a.kaynakTr}${a.fr && a.kaynakFr ? ' · ' + a.kaynakFr : ''}`);
  } else {
    const h = s.oge;
    paragraf(kart, 'ar', h.ar, 'ar');
    paragraf(kart, 'tr', h.tr);
    paragraf(kart, 'fr', h.fr, 'fr');
    paragraf(kart, 'kaynak', h.kaynak);
  }
  kok.appendChild(kart);
}

/** Veri hiç gelmediyse (ilk açılış, internet yok) gösterilen sakin slayt. */
export function bosCiz(kok: HTMLElement, cami: { tr: string; fr: string }): void {
  kok.textContent = '';
  const kart = el('article', 'slayt bos');
  kart.appendChild(el('b', '', METIN.hosgeldiniz.tr));
  paragraf(kart, 'fr', METIN.hosgeldiniz.fr, 'fr');
  paragraf(kart, 'kaynak', cami.tr);
  kok.appendChild(kart);
}

/** Metin kutudan taşıyorsa --olcek'i %10'luk adımlarla küçültür (en az ~%45). */
export function sigdir(kok: HTMLElement): void {
  let olcek = 1;
  kok.style.setProperty('--olcek', '1');
  for (let i = 0; i < 12 && kok.scrollHeight > kok.clientHeight + 1 && olcek > 0.45; i++) {
    olcek *= 0.9;
    kok.style.setProperty('--olcek', olcek.toFixed(3));
  }
}
```

- [ ] **Adım 4: Slayt döngüsünü `main.ts`'e bağla.** Dosya: `src/ekran/main.ts`
  - Secim içe aktarması şöyle olacak: `import { brukselSaat, donmeOku, ekranIdOku, saatGecerliMi, slaytListesi, slaytSuresi, temaSec, vakitGorunumu, type Slayt, type SlaytAyari } from '../lib/ekran/secim.ts';`
  - `import { vakitleriCiz } from './vakitler.ts';` satırının altına: `import { bosCiz, sigdir, slaytCiz } from './slaytlar.ts';`
  - `const ekran = document.getElementById('ekran') as HTMLElement;` satırının altına: `const ekranId = ekranIdOku(parametre.get('ekran'));`
  - Dosyanın sonundaki `saniyelik();` satırından hemen önce şunu ekle:

```ts
/* Slayt turu: bu ekrana özel duyurular, ortak duyurular, günün ayeti, günün hadisi (src/lib/ekran/secim.ts).
   Tur bitince liste yeni veriyle yeniden kurulur; süre metin uzunluğundan (ekran.yaml → slayt). */
const VARSAYILAN_SLAYT: SlaytAyari = { tabanSn: 8, karakterSn: 0.05, enAzSn: 10, enCokSn: 30 };
let tur: Slayt[] = [];
let sira = 0;
let slaytBasladi = false;
function sonrakiSlayt(): void {
  const kok = alan('slayt');
  if (!kok) return;
  if (sira >= tur.length) {
    tur = slaytListesi({ duyurular: veri.akis?.duyurular ?? [], ayetler: veri.icerik?.ayetler ?? [], hadisler: veri.icerik?.hadisler ?? [] }, ekranId, bugunTarih(new Date()));
    sira = 0;
  }
  const s = tur[sira++];
  if (!s) {
    bosCiz(kok, sayfa.cami);
    setTimeout(sonrakiSlayt, 15_000);
    return;
  }
  slaytCiz(kok, s);
  sigdir(kok);
  setTimeout(sonrakiSlayt, slaytSuresi(s.karakter, veri.akis?.ayar.slayt ?? VARSAYILAN_SLAYT) * 1000);
}
```

  - `veriDongusu` içinde `dakikalik(new Date());` satırının altına şunu ekle:

```ts
  if (!slaytBasladi) {
    slaytBasladi = true;
    sonrakiSlayt();
  }
```

- [ ] **Adım 5: Testlerin geçtiğini gör.** Komutlar sırayla: `npm run build`, ardından `npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium` ve `node --test tests/ekran-eski-tarayici.test.mjs`. Beklenen: 12 tarayıcı testi ve paket taraması PASS; görsel kontrol testi atlanmış (skipped) görünür.

- [ ] **Adım 6: Commit.**

```bash
git add src/ekran/slaytlar.ts src/ekran/main.ts tests/web/ekran.spec.mjs
git commit -m "Ekran: duyuru, günün ayeti ve günün hadisi slaytları (sığdırma, hedefleme, arıza dayanımı)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 8: İnternetsiz açılış (service worker)

**Dosyalar:**
- Oluştur: `src/ekran/sw.ts`
- Değiştir: `scripts/ekran-derle.mjs` (sw paketi), `src/ekran/main.ts` (kayıt), `tests/ekran-eski-tarayici.test.mjs` (sw.js taraması), `tests/web/ekran.spec.mjs` (internetsiz testi)

**Arayüzler:**
- Üretir: `/ekran/sw.js`, kapsam `/ekran/`. Önbellek adı `ekran-<sürüm damgası>`. Sayfa ve JSON'lar ağ öncelikli, diğer dosyalar önbellek öncelikli gelir.

- [ ] **Adım 1: Başarısız testi ekle.** Bu blok `tests/web/ekran.spec.mjs` dosyasının sonuna eklenir.

```js
test.describe('internetsiz açılış', () => {
  test.use({ serviceWorkers: 'allow' });
  test('internet kesilse de ekran son sağlam hâliyle açılır', async ({ page, context }) => {
    await page.goto('/ekran/');
    await page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);
    await expect(page.locator('.vakit')).toHaveCount(6);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.vakit')).toHaveCount(6);
    await expect(page.locator('[data-alan="saat"]')).toHaveText(/^\d\d:\d\d:\d\d$/);
    await context.setOffline(false);
  });
});
```

`tests/ekran-eski-tarayici.test.mjs` içindeki döngü listesi şöyle olacak: `for (const dosya of ['public/ekran/ekran.js', 'public/ekran/sw.js'])`.

- [ ] **Adım 2: Testlerin başarısız olduğunu gör.** Komut: `npm run build && npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium -g "internetsiz"`. Beklenen: denetleyici hiç gelmediği için `waitForFunction` zaman aşımıyla FAIL. `node --test tests/ekran-eski-tarayici.test.mjs` de FAIL vermeli, çünkü `sw.js` yok.

- [ ] **Adım 3: Service worker'ı yaz.** Dosya: `src/ekran/sw.ts`

```ts
/**
 * Cami ekranının service worker'ı — /ekran/sw.js (kapsam /ekran/). 27 Eylül 2026.
 * Ekran internetsiz de açılabilsin diye sayfa iskeleti, paket, fontlar, logolar ve üç veri akışı
 * önbellekte tutulur. Sayfa ve JSON'lar AĞ ÖNCE (taze veri), diğerleri ÖNBELLEK ÖNCE gelir. Her derleme
 * yeni bir sürüm damgası taşır; yeni SW eski önbelleği siler, sayfa bir kez yenilenir (main.ts).
 */
declare const __EKRAN_SURUM__: string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw: any = self;
const ONBELLEK = 'ekran-' + __EKRAN_SURUM__;
const KABUK = [
  '/ekran/', '/ekran/ekran.css', '/ekran/ekran.js',
  '/ekran/fonts/work-sans-latin.woff2', '/ekran/fonts/work-sans-latin-ext.woff2', '/ekran/fonts/amiri-arabic.woff2',
  '/media/logo/ulu-camii-logo.svg', '/media/logo/ulu-camii-logo-beyaz.svg',
  '/ekran/vakitler.json', '/ekran/akis.json', '/ekran/icerik.json',
];

sw.addEventListener('install', (e: { waitUntil(p: Promise<unknown>): void }) => {
  e.waitUntil(caches.open(ONBELLEK).then((c) => c.addAll(KABUK)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (e: { waitUntil(p: Promise<unknown>): void }) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a.indexOf('ekran-') === 0 && a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => sw.clients.claim()),
  );
});

function sakla(istek: Request, yanit: Response): Response {
  if (yanit.ok) {
    const kopya = yanit.clone();
    void caches.open(ONBELLEK).then((c) => c.put(istek, kopya));
  }
  return yanit;
}

const agOnce = (istek: Request): Promise<Response> =>
  fetch(istek)
    .then((y) => sakla(istek, y))
    .catch(() => caches.match(istek, { ignoreSearch: true }).then((y) => y || Response.error()));

const onbellekOnce = (istek: Request): Promise<Response> =>
  caches.match(istek).then((y) => y || fetch(istek).then((t) => sakla(istek, t)));

sw.addEventListener('fetch', (e: { request: Request; respondWith(p: Promise<Response>): void }) => {
  const istek = e.request;
  const u = new URL(istek.url);
  if (istek.method !== 'GET' || u.origin !== sw.location.origin) return;
  if (u.pathname === '/ekran/' || /^\/ekran\/[a-z]+\.json$/.test(u.pathname)) e.respondWith(agOnce(istek));
  else if (u.pathname.indexOf('/ekran/') === 0 || u.pathname.indexOf('/media/') === 0) e.respondWith(onbellekOnce(istek));
});
```

- [ ] **Adım 4: Paketlemeye SW'yi ekle.** Dosya: `scripts/ekran-derle.mjs`. `const paketler = [...]` satırının altına şunu ekle:

```js
/* Her derleme yeni bir SW sürümü: kutu yeni paketi bir sonraki güncelleme denetiminde alır. */
const damga = (process.env.GITHUB_SHA || 'yerel').slice(0, 12) + '-' + Date.now().toString(36);
paketler.push({ ...ortak, entryPoints: [yol('src/ekran/sw.ts')], outfile: CIKTI + 'sw.js', define: { __EKRAN_SURUM__: JSON.stringify(damga) } });
```

- [ ] **Adım 5: Kaydı `main.ts`'e ekle.** Dosya: `src/ekran/main.ts`. Dosyanın sonundaki `saniyelik();` satırından önce şunu ekle:

```ts
/* İnternetsiz açılış için service worker (src/ekran/sw.ts). Yeni sürüm denetimi 6 saatte bir; yeni SW
   denetimi devralınca sayfa bir kez yenilenir (ilk kurulumda değil). */
if ('serviceWorker' in navigator) {
  const oncekiDenetci = !!navigator.serviceWorker.controller;
  navigator.serviceWorker
    .register('/ekran/sw.js', { scope: '/ekran/' })
    .then((kayit) => { setInterval(() => { kayit.update().catch(() => {}); }, 6 * 3_600_000); })
    .catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (oncekiDenetci) location.reload(); });
}
```

- [ ] **Adım 6: Testlerin geçtiğini gör.** Komutlar: `npm run build`, ardından `npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium` ve `node --test tests/ekran-eski-tarayici.test.mjs`. Beklenen: hepsi PASS.

- [ ] **Adım 7: Commit.**

```bash
git add src/ekran/sw.ts scripts/ekran-derle.mjs src/ekran/main.ts tests/ekran-eski-tarayici.test.mjs tests/web/ekran.spec.mjs
git commit -m "Ekran: service worker ile internetsiz açılış" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 9: Dış hava (Open-Meteo)

**Dosyalar:**
- Oluştur: `src/ekran/hava.ts`, `tests/ekran-hava.test.mjs`
- Değiştir: `src/ekran/main.ts`, `tests/web/ekran.spec.mjs` (beforeEach Open-Meteo taklidi ve test), `package.json` (`test:ekran`)

**Arayüzler:**
- Üretir: `havaAdresi(enlem, boylam)`, `havaCoz(govde, alinan)`, `havaTazeMi(h, simdi)`, `havaSimgesi(kod)`, `SIMGE_YOLLARI`, `type HavaDurumu`. DOM: `[data-alan="hava"] svg`, `span` (°C), `small` (Open-Meteo).

- [ ] **Adım 1: Başarısız testi yaz.** Dosya: `tests/ekran-hava.test.mjs`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { havaAdresi, havaCoz, havaTazeMi, havaSimgesi } from '../src/ekran/hava.ts';

test('Open-Meteo yanıtı çözülür, eksik yanıt reddedilir', () => {
  assert.deepEqual(havaCoz({ current: { temperature_2m: 18.6, weather_code: 61 } }, 1000), { sicaklik: 19, kod: 61, alinan: 1000 });
  assert.equal(havaCoz({ current: { temperature_2m: '18' } }, 1), null);
  assert.equal(havaCoz(null, 1), null);
});

test('3 saatten eski hava gösterilmez', () => {
  const h = { sicaklik: 12, kod: 3, alinan: 0 };
  assert.equal(havaTazeMi(h, 3 * 3_600_000), true);
  assert.equal(havaTazeMi(h, 3 * 3_600_000 + 1), false);
  assert.equal(havaTazeMi(null, 0), false);
});

test('WMO kodları simgeye eşlenir', () => {
  assert.deepEqual([0, 2, 3, 45, 61, 73, 86, 95].map(havaSimgesi), ['gunes', 'parcali', 'bulut', 'sis', 'yagmur', 'kar', 'kar', 'firtina']);
});

test('adres caminin konumunu ve Brüksel saat dilimini taşır', () => {
  assert.match(havaAdresi(50.231495, 5.339165), /latitude=50\.231495&longitude=5\.339165&current=temperature_2m,weather_code&timezone=Europe%2FBrussels$/);
});
```

- [ ] **Adım 2: Testin başarısız olduğunu gör.** Komut: `node --test tests/ekran-hava.test.mjs`. Beklenen: FAIL.

- [ ] **Adım 3: Hava modülünü yaz.** Dosya: `src/ekran/hava.ts`

```ts
/**
 * Dış hava — Open-Meteo (anahtarsız; CC BY 4.0, ekranda "Open-Meteo" ibaresi). 30 dakikada bir alınır;
 * 3 saatten eski veri gösterilmez (bayat sıcaklık yerine hiç). Konum: site.yaml → gps.
 * Simgeler saf vektördür (SVG yol verisi), raster kullanılmaz.
 */
export interface HavaDurumu { sicaklik: number; kod: number; alinan: number }
export type HavaSimgesi = 'gunes' | 'parcali' | 'bulut' | 'sis' | 'yagmur' | 'kar' | 'firtina';

export const havaAdresi = (enlem: number, boylam: number): string =>
  `https://api.open-meteo.com/v1/forecast?latitude=${enlem}&longitude=${boylam}&current=temperature_2m,weather_code&timezone=Europe%2FBrussels`;

export function havaCoz(govde: unknown, alinan: number): HavaDurumu | null {
  const c = (govde as { current?: { temperature_2m?: unknown; weather_code?: unknown } } | null)?.current;
  if (!c || typeof c.temperature_2m !== 'number' || typeof c.weather_code !== 'number') return null;
  return { sicaklik: Math.round(c.temperature_2m), kod: c.weather_code, alinan };
}

export const havaTazeMi = (h: HavaDurumu | null, simdi: number): h is HavaDurumu => !!h && simdi - h.alinan <= 3 * 3_600_000;

/** WMO kodu: 0 açık, 1–2 parçalı, 3 kapalı, 45/48 sis, 71–77 ve 85–86 kar, 95+ fırtına, kalanı yağış. */
export function havaSimgesi(kod: number): HavaSimgesi {
  if (kod === 0) return 'gunes';
  if (kod === 1 || kod === 2) return 'parcali';
  if (kod === 3) return 'bulut';
  if (kod === 45 || kod === 48) return 'sis';
  if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) return 'kar';
  if (kod >= 95) return 'firtina';
  return 'yagmur';
}

const BULUT = 'M7 17h10.5a3.8 3.8 0 0 0 .4-7.6A5.8 5.8 0 0 0 6.7 11 3.1 3.1 0 0 0 7 17z';
export const SIMGE_YOLLARI: Record<HavaSimgesi, string> = {
  gunes: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  parcali: '<circle cx="8.5" cy="8.5" r="3.3"/><path d="M8.5 2.6v1.3M2.6 8.5h1.3M4.3 4.3l.9.9M12.7 4.3l-.9.9"/><path d="M9.5 19h8a3.3 3.3 0 0 0 .3-6.6 5 5 0 0 0-9.4 1.3A2.7 2.7 0 0 0 9.5 19z"/>',
  bulut: `<path d="${BULUT}"/>`,
  sis: '<path d="M4 9h16M3 13h18M5 17h14"/>',
  yagmur: `<path d="${BULUT}"/><path d="M9 19.5l-1 2.5M13 19.5l-1 2.5M17 19.5l-1 2.5"/>`,
  kar: `<path d="${BULUT}"/><path d="M9 20.5h.01M13 21.5h.01M17 20.5h.01"/>`,
  firtina: `<path d="${BULUT}"/><path d="M13 17.5l-2 3h3l-2 3"/>`,
};
```

- [ ] **Adım 4: Birim testinin geçtiğini gör.** Komut: `node --test tests/ekran-hava.test.mjs`. Beklenen: 4 test PASS.

- [ ] **Adım 5: Havayı `main.ts`'e bağla ve tarayıcı testini ekle.**
  - `src/ekran/main.ts`: `import { bosCiz, sigdir, slaytCiz } from './slaytlar.ts';` satırının altına şunu ekle: `import { havaAdresi, havaCoz, havaSimgesi, havaTazeMi, SIMGE_YOLLARI, type HavaDurumu } from './hava.ts';`
  - `dakikalik` fonksiyonunun hemen üstüne şunu ekle:

```ts
let hava: HavaDurumu | null = null;
/** Üst bantta dış hava; 3 saatten eskiyse gizlenir. SVG ve sayı sabit/sayısal olduğu için innerHTML güvenli. */
function havaCiz(): void {
  const kutu = alan('hava');
  const h = hava;
  if (!kutu) return;
  if (!havaTazeMi(h, Date.now())) { kutu.hidden = true; return; }
  kutu.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SIMGE_YOLLARI[havaSimgesi(h.kod)]}</svg><span>${h.sicaklik}°C</span><small>Open-Meteo</small>`;
  kutu.hidden = false;
}
```

  - `dakikalik` içinde `ekran.setAttribute('data-tema', …);` satırının altına: `havaCiz();`
  - `saniyelik();` satırından önce şunu ekle:

```ts
async function havaDongusu(): Promise<void> {
  try {
    const yanit = await fetch(havaAdresi(sayfa.gps.enlem, sayfa.gps.boylam), { cache: 'no-cache' });
    const h = yanit.ok ? havaCoz(await yanit.json(), Date.now()) : null;
    if (h) hava = h;
  } catch {
    /* ağ yok: son değer 3 saat daha gösterilir */
  }
  havaCiz();
  setTimeout(() => { void havaDongusu(); }, 30 * 60_000);
}
```

  - Dosyanın en sonuna, `void veriDongusu();` satırının altına: `void havaDongusu();`
  - `tests/web/ekran.spec.mjs` → `beforeEach` içindeki `context.route('**/*', …)` gövdesi şöyle olacak:

```js
    const u = new URL(route.request().url());
    if (u.hostname === 'api.open-meteo.com') return route.fulfill({ json: { current: { temperature_2m: 18.6, weather_code: 61 } } });
    return u.origin === 'http://127.0.0.1:4401' || u.origin === 'http://localhost:4401' ? route.continue() : route.abort('blockedbyclient');
```

  - Dosyanın sonuna şu testi ekle:

```js
test('dış hava sıcaklığı, simgesi ve kaynak ibaresi üst bantta görünür', async ({ page }) => {
  await page.clock.install({ time: an(ornek, '12:00') });
  await page.goto('/ekran/');
  await expect(page.locator('[data-alan="hava"]')).toBeVisible();
  await expect(page.locator('[data-alan="hava"] span')).toHaveText('19°C');
  await expect(page.locator('[data-alan="hava"] small')).toHaveText('Open-Meteo');
  await expect(page.locator('[data-alan="hava"] svg path').first()).toBeAttached();
});
```

  - `package.json` → `test:ekran` listesinin sonuna `tests/ekran-hava.test.mjs` ekle.

- [ ] **Adım 6: Hepsinin geçtiğini gör.** Komutlar: `npm run test:ekran`, `npm run build`, `npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium`. Beklenen: hepsi PASS.

- [ ] **Adım 7: Commit.**

```bash
git add src/ekran/hava.ts tests/ekran-hava.test.mjs src/ekran/main.ts tests/web/ekran.spec.mjs package.json
git commit -m "Ekran: Open-Meteo dış hava ve vektör hava simgeleri" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Görev 10: Site denetimi, doğrulama zinciri ve son kontrol

**Dosyalar:**
- Değiştir: `scripts/site-denetim.mjs`, `package.json` (`dogrula`)

- [ ] **Adım 1: Denetimi genişlet.** Dosya: `scripts/site-denetim.mjs`
  - 39. satırdaki `uygulamaSayfasi` şöyle olacak (ekran bir site sayfası değildir; canonical, h1 ve hreflang beklenmez):

```js
const uygulamaSayfasi = (u) => u.startsWith('/admin') || u.startsWith('/kayit') || u.startsWith('/ekran') || /^\/google[0-9a-f]+\.html$/.test(u);
```

  - "namaz vakitleri" bloğunun kapanışından sonra, "ders materyalleri verisi" bloğundan önce şunu ekle:

```js
/* ---------------------------------------------------------------- cami ekranı (/ekran/) */
/* Ekran ikinci el Android TV kutularında çalışır (27 Eylül 2026, docs/EKRAN-YOL-HARITASI.md). Paket ya
   da akış eksikse ekran boş kalır; vakit akışı Diyanet değilse ya da kapsamı daralıyorsa yayın öncesi
   burada yakalanır. */
{
  const dizin = join(KOK, 'ekran');
  if (!existsSync(join(dizin, 'index.html'))) ekle('kritik', 'cami ekranı sayfası üretilmemiş', '/ekran/');
  else {
    for (const ad of ['vakitler.json', 'akis.json', 'icerik.json', 'ekran.js', 'ekran.css', 'sw.js', 'fonts/work-sans-latin.woff2', 'fonts/amiri-arabic.woff2'])
      if (!existsSync(join(dizin, ad))) ekle('kritik', 'cami ekranı dosyası eksik', '/ekran/' + ad);
    if (!/<meta name="robots" content="noindex/.test(readFileSync(join(dizin, 'index.html'), 'utf8')))
      ekle('yuksek', 'cami ekranı arama motorlarına açık', '/ekran/ noindex değil');
    if (existsSync(join(dizin, 'vakitler.json'))) {
      const v = JSON.parse(readFileSync(join(dizin, 'vakitler.json'), 'utf8'));
      if (v.kaynakTuru !== 'diyanet') ekle('kritik', 'cami ekranı vakitleri Diyanet değil', String(v.kaynakTuru));
      /* Kapsam, bugünden itibaren KESİNTİSİZ gün sayısıdır. Verideki bir boşluk (27 Eylül 2026'da:
         27 Ekim–31 Aralık 2026) ekranın o günlerde "güncellenemedi" demesi demektir; toplam gün sayısı bunu gizler. */
      const tarihler = new Set((v.gunler || []).map((g) => g.tarih));
      let kesintisiz = 0;
      for (let t = Date.parse(new Date().toISOString().slice(0, 10) + 'T12:00:00Z'); tarihler.has(new Date(t).toISOString().slice(0, 10)); t += 86_400_000) kesintisiz++;
      if (kesintisiz < 7) ekle('yuksek', 'cami ekranı vakit kapsamı daralıyor', `bugünden itibaren ${kesintisiz} kesintisiz gün`);
      else if (kesintisiz < 14) ekle('orta', 'cami ekranı vakit kapsamı', `bugünden itibaren ${kesintisiz} kesintisiz gün`);
      if ((v.atlanan || []).length) ekle('yuksek', 'cami ekranında bozuk vakit günü yayımlanmadı', v.atlanan.join(', '));
    }
    for (const f of readdirSync(KOK).filter((f) => /^sitemap.*\.xml$/.test(f)))
      if (readFileSync(join(KOK, f), 'utf8').includes('/ekran/')) ekle('yuksek', 'cami ekranı sitemap içinde', f);
    if (existsSync(join(dizin, 'icerik.json'))) {
      const i = JSON.parse(readFileSync(join(dizin, 'icerik.json'), 'utf8'));
      if (!(i.hadisler || []).length) ekle('orta', 'cami ekranında hadis yok', 'icerik.json boş');
      if ((i.eksik || []).length) ekle('orta', 'cami ekranı içeriğinde eksik/mükerrer kayıt', i.eksik.join(', '));
    }
  }
}
```

- [ ] **Adım 2: Denetimin ekranı gördüğünü sına.**
  - Komut: `npm run build && node scripts/site-denetim.mjs`. Beklenen özet başlangıçla aynı: `orta=2 dusuk=58`, kritik yok, ekran bulgusu yok.
  - Negatif sınama:

```bash
mv dist/ekran/sw.js dist/ekran/sw.js.bak
node scripts/site-denetim.mjs; echo "exit=$?"
mv dist/ekran/sw.js.bak dist/ekran/sw.js
```

  - Beklenen: `[kritik] cami ekranı dosyası eksik` ve `exit=1`.

- [ ] **Adım 3: Doğrulama zincirine ekle.** `package.json` → `dogrula` betiğinin sonuna ` && npm run test:ekran` ekle.

- [ ] **Adım 4: Tam doğrulama.** Sırayla:
  1. `npm run test:ekran` (7 dosya PASS)
  2. `npm run denetim:cms` (kritik yok)
  3. `npm run build`
  4. `node scripts/site-denetim.mjs` (kritik yok)
  5. `npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium` (hepsi PASS)
  6. Son olarak `git status` temiz olmalı. `public/ekran/` görünmemeli, çünkü gitignore'da.

- [ ] **Adım 5: Görsel son kontrol.** Görev 6'da eklenen görsel test, bu kez slaytlar ve hava da dolu hâlde yeniden koşturulur:

```bash
EKRAN_GORSEL=1 npx playwright test tests/web/ekran.spec.mjs --project=masaustu-chromium -g EKRAN_GORSEL
ffmpeg -y -loglevel error -i test-results/ekran-gorsel/dikey-acik.png -vf scale=-2:1500 test-results/ekran-gorsel/dikey-acik-1500.png
ffmpeg -y -loglevel error -i test-results/ekran-gorsel/yatay-don90-koyu.png -vf scale=1500:-2 test-results/ekran-gorsel/yatay-don90-koyu-1500.png
```

  Üretilen iki görüntü (yalnız `-1500` sürümleri okunur):
  - Dikey 1080×1920, açık tema, öğle öncesi.
  - `?don=90` ile 1920×1080, koyu tema, akşamdan sonra.

  Kontrol listesi:
  - Hiçbir yazı kesilmiyor ya da taşmıyor.
  - Arapça sağdan sola ve Amiri yazı tipiyle.
  - TR ve FR alt alta.
  - Logo vektör ve temaya uygun renkte.
  - Sıradaki vakit belirgin.

- [ ] **Adım 6: Commit.**

```bash
git add scripts/site-denetim.mjs package.json
git commit -m "Ekran: site denetimine ekran kapısı, doğrulama zincirine ekran testleri" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Faz 1'in bitişi (yayın, kullanıcı onayıyla)

`ekran-mvp` dalı tamamlanınca `main`'e birleştirmek ve push etmek siteyi yayınlar. Bu, dışa dönük bir adımdır ve imamın açık onayını ister. Ana depoda başka bir oturum çalıştığı için birleştirme o oturumla çakışmayacak bir anda yapılır.

Yayından sonra yol haritasının Faz 1 çıkış ölçütü canlıda doğrulanır:
- `https://ulucamii.be/ekran/` telefonda ve PC'de açılıyor.
- CMS'te "Cami ekranında göster" işaretlenen bir test duyurusu en geç 15 dakikada `akis.json` içinde ve ekranda görünüyor.
- `curl -I https://ulucamii.be/ekran/vakitler.json` ETag döndürüyor.

Test duyurusu doğrulamadan sonra kaldırılır.
