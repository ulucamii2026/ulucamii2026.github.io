# Ezber Kilimi Faz 1a — Tek Ezber Kataloğu İskeleti — Uygulama Planı

> **Ajanlar için:** Gerekli alt beceri: `superpowers:subagent-driven-development` (önerilen) ya da
> `superpowers:executing-plans`. Adımlar `- [ ]` onay kutularıyla izlenir.

**Amaç:** Dağınık üç ezber kimlik sistemini (plan metinleri, `EZBER_LISTESI.id`, seviye testi `ez01…`) tek, sürümlü,
şemayla doğrulanan bir katalogda birleştirmek; seviye listesini Diyanet kaynaklarıyla doğrulayıp Rıdvan'ın onayına
tablo hâlinde sunmak.

**Mimari:** Statik JSON katalog (`src/data/ezber/`) + saf TS erişim katmanı (`src/lib/ezber/katalog.ts`, ekran ve
veritabanı bilmez). Plan dizeleri ve eski kimlikler ayrı eşleme tablolarında; yıllık plan JSON'u elle düzenlenmez.
Onay tablosu katalogdan üretilir (tek kaynak).

**Teknoloji:** Astro 7 / TypeScript (strict), Node `node:test`, esbuild paketleme (mevcut test düzeni),
`@cfworker/json-schema` (draft-07, `cms-config-denetim.mjs` ile aynı motor).

**Şartname:** [Ana plan](2026-09-26-ezber-kilimi-ana-plan.md) (26 Eylül 2026'da onaylanan planın depo kopyası)
§2 (Kararlar), §3.2 (Tek ezber kataloğu), §4 Faz 1a, §7 (Doğrulama). Kalıcı özet: [`docs/EZBER-KILIMI.md`](../../EZBER-KILIMI.md).

## Genel kısıtlar

- Yıllık plan (`src/data/yillik-plan-2026-2027.json`) **değişmez**; plan tarihleri yalnız «sınıf hedefi» olarak türetilir.
- Kimlik biçimi: `s-` sûre/âyet, `d-` dua (Kur'an'dan olan dualar dahil), `b-` bilgi; küçük ASCII, `-` ayraç, ≤ 40 karakter.
- Seviyeler: 1–7 namaz kılabilme sırası, 8 Amme cüzü, `kenar` (kenar suyu, dönemlik). Kesin liste Rıdvan onayından geçer.
- Kur'an sesi **yalnız Diyanet** (`webdosya.diyanet.gov.tr`, `kuran.diyanet.gov.tr`); dualar `namaz.diyanet.gov.tr`.
  Kur'an metninde yapay ses (TTS) **asla** yok. Kaynak kaydı olmayan ses dosyası kataloğa bağlanmaz.
- Adlar beş dilde (tr, fr, en, nl, de) zorunlu; mevcut 19 maddenin adları `src/lib/ezber-verisi.ts`'ten birebir alınır.
- `src/lib/ezber-verisi.ts`, `hoca-ekrani.ts`, `veli-portali.ts`, Firestore kuralları bu fazda **değişmez** (Faz 1b–1d).
- İhtida bölümüne ve `ihtida.ulucamii.be`'ye dokunulmaz. Commit yalnız `ezber-kilimi` dalına; push yok.
- Kod yorumları ve belgeler Türkçe, tam imlâ; kişisel veri yok.

## İnceleme odağı

1. **Birden çok maddeyi tek dizede sayan plan metinleri** («Kevser; Asr; Nasr», «Allâhümme Salli; Allâhümme Bârik»,
   «Kelime-i Tevhid ve Kelime-i Şehâdet») her maddeye ayrı ayrı eşlenmeli; sınıf hedefi hepsine aynı tarih olarak düşmeli.
   → Görev 2 testi `sinifHedefleri: çoklu dize`.
2. **Aynı içeriğin plandaki iki farklı yazımı** (Kelime-i Tevhid 7 Kasım ve 27 Mart; Kadir Gecesi duası iki ayrı metin)
   aynı kimliğe gitmeli; sınıf hedefi en erken tarih olmalı. → Görev 2 testi `sinifHedefleri: en erken tarih`.
3. **Kaynağı belgelenmemiş ses** (`/media/ses/dualar/rabbena.mp3` — Diyanet özgün dosyasıyla aynı değil, kaynak kaydı yok)
   kataloğa bağlanırsa test düşmeli. → Görev 1 testi `ses: kaynak kaydı ve sha256`.
4. **Kur'an'dan olan dualar** (Rabbenâ âtinâ = Bakara 201, Rabbenağfirlî = İbrâhim 41, Hz. Mûsâ'nın duası = Tâhâ 25–28)
   `d-` önekli olsa da `kuranMetni: true` taşımalı; bu bayrak TTS yasağının dayanağıdır. → Görev 1 testi `kuranMetni`.
5. **Eski kimliği olan her kayıt** (19 `EZBER_LISTESI` kimliği, 14 seviye testi maddesi, kurallardaki `ezber-*` ev
   çalışması kimlikleri) yeni katalogda karşılık bulmalı; yoksa Faz 1b geçişi veri kaybeder. → Görev 3 testi `eski kimlikler`.

---

## Dosya yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/data/ezber/katalog.schema.json` (yeni) | Katalog şeması (draft-07) |
| `src/data/ezber/katalog.json` (yeni) | Seviye tanımları + maddeler (kimlik, tür, seviye, sıra, 5 dilde ad, Kur'an bilgisi, ses) |
| `src/data/ezber/plan-eslesme.json` (yeni) | Yıllık plandaki 49 serbest ezber dizesi → katalog kimlikleri (dizi) |
| `src/data/ezber/eski-kimlikler.json` (yeni) | `ezberListesi` (19) ve `seviyeTesti` (14) → katalog kimlikleri (dizi) |
| `src/lib/ezber/katalog.ts` (yeni) | Tipli erişim + saf yardımcılar |
| `tests/ezber-katalog.test.mjs` (yeni) | Şema, çapraz alan kuralları, ses kaynağı, eşleme, API testleri |
| `scripts/ezber-seviye-tablosu.mjs` (yeni) | Katalogdan Markdown onay tablosu |
| `docs/EZBER-KILIMI.md`, `docs/EGITIM-PLATFORMU.md` (yeni) | Kararların ve katalog kurallarının kalıcı özeti (ana plan §10) |
| `docs/PROJE-HAFIZASI.md` (değişir) | İki belgeye bağlantı |
| `package.json` (değişir) | `test:ezber`, `ezber:tablo`; `dogrula` zincirine `test:ezber` |

---

### Görev 1: Katalog şeması, erişim katmanı ve bütünlük testleri

**Dosyalar:**
- Oluştur: `src/data/ezber/katalog.schema.json`, `src/lib/ezber/katalog.ts`, `tests/ezber-katalog.test.mjs`
- Oluştur (geçici en küçük veri): `src/data/ezber/katalog.json`, `plan-eslesme.json`, `eski-kimlikler.json`
- Değiştir: `package.json` (`test:ezber`, `dogrula` zinciri)

**Arayüzler — Üretir:**
```ts
export type Seviye = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'kenar';
export type EzberTuru = 'sure' | 'dua' | 'bilgi';
export type BesDil = Record<Dil, string>;
export interface EzberOgesi { id: string; tur: EzberTuru; seviye: Seviye; sira: number; ad: BesDil; kuranMetni: boolean;
  kuran?: { sure: number; ayetler: [number, number] }; ses?: { tam?: string; parcalar?: string[] }; not?: string; }
export interface SeviyeTanimi { kimlik: Seviye; ad: BesDil; amac: BesDil; }
export interface Katalog { surum: number; seviyeler: SeviyeTanimi[]; ogeler: EzberOgesi[]; }
export type EskiKaynak = 'ezberListesi' | 'seviyeTesti';
export const KATALOG: Katalog;
export const SEVIYE_SIRASI: readonly Seviye[];            // [1..8, 'kenar']
export function ezberBul(id: string): EzberOgesi | undefined;
export function seviyeOgeleri(seviye: Seviye, katalog?: Katalog): EzberOgesi[];   // sira'ya göre
export function planKimlikleri(planMetni: string): string[];                       // eşlenmemişse []
export function eskiKimliktenYeni(kaynak: EskiKaynak, eski: string): string[];    // eşlenmemişse []
export function sinifHedefleri(plan: { gunler: { tarih: string; dersler?: { ezber?: string[] }[] }[] }): Record<string, string>;
```

- [ ] **Adım 1: Şemayı yaz** — `src/data/ezber/katalog.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Ezber Kilimi kataloğu",
  "type": "object",
  "additionalProperties": false,
  "required": ["surum", "seviyeler", "ogeler"],
  "properties": {
    "$schema": { "type": "string" },
    "surum": { "type": "integer", "minimum": 1 },
    "seviyeler": { "type": "array", "minItems": 9, "maxItems": 9, "items": { "$ref": "#/definitions/seviyeTanimi" } },
    "ogeler": { "type": "array", "minItems": 1, "items": { "$ref": "#/definitions/oge" } }
  },
  "definitions": {
    "seviye": { "oneOf": [{ "type": "integer", "minimum": 1, "maximum": 8 }, { "const": "kenar" }] },
    "metin": { "type": "string", "minLength": 1, "maxLength": 200, "pattern": "^\\S(.*\\S)?$" },
    "besDil": {
      "type": "object", "additionalProperties": false, "required": ["tr", "fr", "en", "nl", "de"],
      "properties": {
        "tr": { "$ref": "#/definitions/metin" }, "fr": { "$ref": "#/definitions/metin" },
        "en": { "$ref": "#/definitions/metin" }, "nl": { "$ref": "#/definitions/metin" },
        "de": { "$ref": "#/definitions/metin" }
      }
    },
    "sesYolu": { "type": "string", "pattern": "^/media/ses/[a-z0-9-]+/[a-z0-9-]+\\.mp3$" },
    "seviyeTanimi": {
      "type": "object", "additionalProperties": false, "required": ["kimlik", "ad", "amac"],
      "properties": { "kimlik": { "$ref": "#/definitions/seviye" }, "ad": { "$ref": "#/definitions/besDil" }, "amac": { "$ref": "#/definitions/besDil" } }
    },
    "oge": {
      "type": "object", "additionalProperties": false,
      "required": ["id", "tur", "seviye", "sira", "ad", "kuranMetni"],
      "properties": {
        "id": { "type": "string", "maxLength": 40, "pattern": "^[sdb]-[a-z0-9]+(-[a-z0-9]+)*$" },
        "tur": { "enum": ["sure", "dua", "bilgi"] },
        "seviye": { "$ref": "#/definitions/seviye" },
        "sira": { "type": "integer", "minimum": 1, "maximum": 99 },
        "ad": { "$ref": "#/definitions/besDil" },
        "kuranMetni": { "type": "boolean" },
        "kuran": {
          "type": "object", "additionalProperties": false, "required": ["sure", "ayetler"],
          "properties": {
            "sure": { "type": "integer", "minimum": 1, "maximum": 114 },
            "ayetler": { "type": "array", "minItems": 2, "maxItems": 2, "items": { "type": "integer", "minimum": 1, "maximum": 286 } }
          }
        },
        "ses": {
          "type": "object", "additionalProperties": false, "minProperties": 1,
          "properties": {
            "tam": { "$ref": "#/definitions/sesYolu" },
            "parcalar": { "type": "array", "minItems": 1, "items": { "$ref": "#/definitions/sesYolu" } }
          }
        },
        "not": { "type": "string", "maxLength": 300 }
      }
    }
  }
}
```

- [ ] **Adım 2: Başarısız testi yaz** — `tests/ezber-katalog.test.mjs` (tamamı; veri görevlerinde de bu dosya kullanılır):

```js
/**
 * Ezber Kilimi kataloğu (27 Eyl 2026, Faz 1a) — bütünlük testleri. Kurallar: docs/EZBER-KILIMI.md.
 * Neden: üç eski kimlik sistemi (plan metinleri, EZBER_LISTESI, seviye testi ez01…) tek katalogda birleşiyor;
 * eşlemede boşluk Faz 1b geçişinde veri kaybı, kaynaksız ses ise «Kur'an sesi yalnız Diyanet» kuralının ihlali olur.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Validator } from '@cfworker/json-schema';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-katalog-test.mjs');
await build({
  stdin: {
    contents: [
      'export * from "./src/lib/ezber/katalog.ts";',
      'export { EZBER_LISTESI } from "./src/lib/ezber-verisi.ts";',
      'export { EZBER as SEVIYE_EZBER } from "./src/lib/seviye-testi/sorular/ezber.ts";',
    ].join('\n'),
    resolveDir: process.cwd(),
  },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const m = await import(pathToFileURL(outfile).href);

const json = (yol) => JSON.parse(readFileSync(yol, 'utf8'));
const katalog = json('src/data/ezber/katalog.json');
const sema = json('src/data/ezber/katalog.schema.json');
const planEslesme = json('src/data/ezber/plan-eslesme.json');
const eski = json('src/data/ezber/eski-kimlikler.json');
const plan = json('src/data/yillik-plan-2026-2027.json');
const sesKaynaklari = json('docs/dinleme-ses-kaynaklari.json');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SEVIYELER = [1, 2, 3, 4, 5, 6, 7, 8, 'kenar'];
const DIYANET = /^https:\/\/(webdosya\.diyanet\.gov\.tr|namaz\.diyanet\.gov\.tr|kuran\.diyanet\.gov\.tr)\//;
const KURAN_SESI = /^https:\/\/(webdosya\.diyanet\.gov\.tr\/kuran\/|kuran\.diyanet\.gov\.tr\/)/;
const kimlikler = new Set(katalog.ogeler.map((o) => o.id));
const planDizeleri = [...new Set(plan.gunler.flatMap((g) => (g.dersler ?? []).flatMap((d) => d.ezber ?? [])))];
const ozet = (yol) => createHash('sha256').update(readFileSync(`public${yol}`)).digest('hex');

test('katalog şemaya uyar', () => {
  const sonuc = new Validator(sema, '7', false).validate(katalog);
  assert.ok(sonuc.valid, JSON.stringify(sonuc.errors.slice(0, 6), null, 1));
});

test('kimlikler benzersiz; önek türle tutarlı', () => {
  assert.equal(kimlikler.size, katalog.ogeler.length, 'yinelenen kimlik');
  const onek = { s: 'sure', d: 'dua', b: 'bilgi' };
  for (const o of katalog.ogeler) assert.equal(o.tur, onek[o.id[0]], o.id);
});

test('seviyeler: 1–8 + kenar birer kez; her seviyede sıra 1..n kesintisiz', () => {
  assert.deepEqual(katalog.seviyeler.map((s) => s.kimlik), SEVIYELER);
  for (const s of SEVIYELER) {
    const siralar = katalog.ogeler.filter((o) => o.seviye === s).map((o) => o.sira).sort((a, b) => a - b);
    assert.ok(siralar.length > 0, `seviye ${s} boş`);
    assert.deepEqual(siralar, siralar.map((_, i) => i + 1), `seviye ${s} sıraları`);
  }
});

test('kuranMetni: sûre ⇒ Kur\'an + âyet aralığı; bilgi ⇒ Kur\'an değil; aralık düzgün', () => {
  for (const o of katalog.ogeler) {
    if (o.tur === 'sure') assert.ok(o.kuranMetni && o.kuran, `${o.id}: sûre Kur'an bilgisi taşımalı`);
    if (o.tur === 'bilgi') assert.equal(o.kuranMetni, false, o.id);
    if (o.kuran) {
      assert.ok(o.kuranMetni, `${o.id}: kuran alanı varsa kuranMetni true olmalı`);
      assert.ok(o.kuran.ayetler[0] <= o.kuran.ayetler[1], `${o.id}: âyet aralığı`);
    }
  }
});

test('ses: dosya var, kaynak kaydı ve sha256 tutuyor; kaynak Diyanet; Kur\'an sesi Kur\'an sunucusundan', () => {
  for (const o of katalog.ogeler) {
    const yollar = [o.ses?.tam, ...(o.ses?.parcalar ?? [])].filter(Boolean);
    for (const yol of yollar) {
      assert.ok(existsSync(`public${yol}`), `${o.id}: dosya yok ${yol}`);
      const kayit = sesKaynaklari[yol];
      assert.ok(kayit, `${o.id}: kaynak kaydı yok ${yol}`);
      assert.equal(ozet(yol), kayit.sha256, `${o.id}: sha256 ${yol}`);
      const kaynaklar = String(kayit.kaynak).split(' + ');
      assert.ok(kaynaklar.every((k) => DIYANET.test(k)), `${o.id}: Diyanet dışı kaynak ${yol}`);
      if (o.tur === 'sure') assert.ok(kaynaklar.every((k) => KURAN_SESI.test(k)), `${o.id}: sûre sesi Kur'an sunucusundan değil`);
    }
  }
});

test('plan eşlemesi: 49 dizenin hepsi var, fazlalık yok, kimlikler katalogda', () => {
  assert.deepEqual(Object.keys(planEslesme).sort(), [...planDizeleri].sort());
  for (const [dize, idler] of Object.entries(planEslesme)) {
    assert.ok(Array.isArray(idler) && idler.length > 0, `boş eşleme: ${dize}`);
    for (const id of idler) assert.ok(kimlikler.has(id), `katalogda yok: ${id} ← ${dize}`);
  }
});

test('eski kimlikler: 19 EZBER_LISTESI + 14 seviye testi maddesi + kurallardaki ezber-* kimlikleri', () => {
  assert.deepEqual(Object.keys(eski.ezberListesi).sort(), m.EZBER_LISTESI.map((e) => e.id).sort());
  assert.deepEqual(Object.keys(eski.seviyeTesti).sort(), m.SEVIYE_EZBER.map((e) => e.id).sort());
  for (const tablo of [eski.ezberListesi, eski.seviyeTesti])
    for (const [k, idler] of Object.entries(tablo)) {
      assert.ok(idler.length > 0, `boş: ${k}`);
      for (const id of idler) assert.ok(kimlikler.has(id), `katalogda yok: ${id} ← ${k}`);
    }
  const kurallar = readFileSync('firebase/firestore.rules', 'utf8');
  for (const [, k] of kurallar.matchAll(/'ezber-([a-z-]+)'/g)) assert.ok(eski.ezberListesi[k], `kuraldaki ezber-${k} eşlenmemiş`);
});

test('adlar: beş dil dolu; eski 19 maddenin adları eski katalogla aynı', () => {
  for (const o of katalog.ogeler) for (const d of DILLER) assert.ok(o.ad[d]?.trim(), `${o.id}.${d}`);
  for (const e of m.EZBER_LISTESI) {
    const yeni = eski.ezberListesi[e.id];
    if (yeni.length === 1) assert.deepEqual(m.ezberBul(yeni[0]).ad, e.ad, `${e.id} adı`);
  }
});

test('katalog.ts: ezberBul, seviyeOgeleri, planKimlikleri, eskiKimliktenYeni', () => {
  assert.equal(m.KATALOG.ogeler.length, katalog.ogeler.length);
  assert.deepEqual(m.SEVIYE_SIRASI, SEVIYELER);
  assert.equal(m.ezberBul('s-fatiha').kuran.sure, 1);
  assert.equal(m.ezberBul('yok-boyle-bir-sey'), undefined);
  const s1 = m.seviyeOgeleri(1);
  assert.deepEqual(s1.map((o) => o.sira), s1.map((_, i) => i + 1));
  assert.deepEqual(m.planKimlikleri('Fâtiha'), ['s-fatiha']);
  assert.deepEqual(m.planKimlikleri('planda olmayan dize'), []);
  assert.deepEqual(m.eskiKimliktenYeni('ezberListesi', 'fatiha'), ['s-fatiha']);
  assert.deepEqual(m.eskiKimliktenYeni('seviyeTesti', 'ez04'), ['s-fatiha']);
  assert.deepEqual(m.eskiKimliktenYeni('seviyeTesti', 'ez99'), []);
});

test('sinifHedefleri: çoklu dize her maddeye aynı tarih; aynı madde için en erken tarih', () => {
  const h = m.sinifHedefleri(plan);
  assert.equal(h['s-fatiha'], '2027-03-27');
  for (const id of ['s-kevser', 's-asr', 's-nasr']) assert.equal(h[id], '2027-04-25', id);
  assert.equal(h['d-kelime-i-tevhid'], '2026-11-07');   // 7 Kasım 2026 ve 27 Mart 2027'de iki ayrı yazım
  assert.equal(h['d-kadir-gecesi-duasi'], '2026-12-12'); // 12 Aralık 2026 ve 1 Mart 2027'de iki ayrı metin
  const yapay = { gunler: [{ tarih: '2027-01-02', dersler: [{ ezber: ['Fâtiha'] }] }, { tarih: '2026-12-01', dersler: [{ ezber: ['Fâtiha'] }] }] };
  assert.deepEqual(m.sinifHedefleri(yapay), { 's-fatiha': '2026-12-01' });
});
```

- [ ] **Adım 3: Testi çalıştır, başarısız olduğunu gör** — `node --test tests/ezber-katalog.test.mjs` →
  Beklenen: esbuild «Could not resolve "./src/lib/ezber/katalog.ts"» ile düşer.

- [ ] **Adım 4: Erişim katmanını yaz** — `src/lib/ezber/katalog.ts`:

```ts
/**
 * Ezber Kilimi — tek ezber kataloğu (27 Eylül 2026, Faz 1a).
 * Veri: src/data/ezber/katalog.json (şema katalog.schema.json). Yıllık plandaki serbest ezber dizeleri
 * plan-eslesme.json'da, eski kimlikler (EZBER_LISTESI, seviye testi ez01…) eski-kimlikler.json'da eşlenir;
 * yıllık plan JSON'u elle düzenlenmez. Bu modül ekran ve veritabanı bilmez. Kurallar: docs/EZBER-KILIMI.md.
 */
import type { Dil } from '../../i18n/ui';
import katalogVerisi from '../../data/ezber/katalog.json';
import planEslesme from '../../data/ezber/plan-eslesme.json';
import eskiKimlikler from '../../data/ezber/eski-kimlikler.json';

export type Seviye = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'kenar';
export type EzberTuru = 'sure' | 'dua' | 'bilgi';
export type BesDil = Record<Dil, string>;
export interface EzberOgesi {
  id: string;
  tur: EzberTuru;
  seviye: Seviye;
  sira: number;
  ad: BesDil;
  /** Kur'an metni mi (Kur'an'dan olan dualar dahil): yapay ses yasağının ve «yalnız Diyanet» kuralının dayanağı. */
  kuranMetni: boolean;
  kuran?: { sure: number; ayetler: [number, number] };
  ses?: { tam?: string; parcalar?: string[] };
  not?: string;
}
export interface SeviyeTanimi { kimlik: Seviye; ad: BesDil; amac: BesDil }
export interface Katalog { surum: number; seviyeler: SeviyeTanimi[]; ogeler: EzberOgesi[] }
export type EskiKaynak = 'ezberListesi' | 'seviyeTesti';
type PlanGunu = { tarih: string; dersler?: { ezber?: string[] }[] };

export const KATALOG = katalogVerisi as unknown as Katalog;
export const SEVIYE_SIRASI: readonly Seviye[] = [1, 2, 3, 4, 5, 6, 7, 8, 'kenar'];

const dizin = new Map(KATALOG.ogeler.map((o) => [o.id, o]));
const planTablosu = planEslesme as Record<string, string[]>;
const eskiTablo = eskiKimlikler as Record<EskiKaynak, Record<string, string[]>>;

export function ezberBul(id: string): EzberOgesi | undefined {
  return dizin.get(id);
}

export function seviyeOgeleri(seviye: Seviye, katalog: Katalog = KATALOG): EzberOgesi[] {
  return katalog.ogeler.filter((o) => o.seviye === seviye).sort((a, b) => a.sira - b.sira);
}

export function planKimlikleri(planMetni: string): string[] {
  return Object.hasOwn(planTablosu, planMetni) ? planTablosu[planMetni] : [];
}

export function eskiKimliktenYeni(kaynak: EskiKaynak, eski: string): string[] {
  const tablo = eskiTablo[kaynak] ?? {};
  return Object.hasOwn(tablo, eski) ? tablo[eski] : [];
}

/** Katalog kimliği → yıllık planda ilk geçtiği tarih («sınıf hedefi»). Aynı madde birden çok yazımla geçebilir. */
export function sinifHedefleri(plan: { gunler: PlanGunu[] }): Record<string, string> {
  const hedef: Record<string, string> = {};
  for (const gun of plan.gunler)
    for (const ders of gun.dersler ?? [])
      for (const metin of ders.ezber ?? [])
        for (const id of planKimlikleri(metin)) if (!hedef[id] || gun.tarih < hedef[id]) hedef[id] = gun.tarih;
  return hedef;
}
```

- [ ] **Adım 5: `package.json`** — `"test:ezber": "node --test tests/ezber-katalog.test.mjs"` ekle; `dogrula` zincirinde
  `npm run test:svg && ` öncesine `npm run test:ezber && ` koy.
- [ ] **Adım 6: Testi yeniden çalıştır** — veri dosyaları olmadığından `ENOENT … katalog.json` ile düşmeli
  (veri Görev 2'de). Katalog.ts derleme hatası kalmamalı: `npx astro check` yalnız eksik JSON'u bildirmeli.

### Görev 2: Katalog verisi ve eşlemeler

**Dosyalar:** Oluştur `src/data/ezber/katalog.json`, `plan-eslesme.json`, `eski-kimlikler.json`
**Tüketir:** Görev 1 şeması ve testleri. **Üretir:** Faz 1b–1d'nin kullanacağı kimlikler (aşağıdaki tablo).

Kaynak kuralları: TR adlar Diyanet yazımı; 19 eski maddenin beş dildeki adı `ezber-verisi.ts`'ten birebir; yeni
sûrelerin FR/EN/NL/DE adları aynı düzende («Sourate Al-…», «Surah Al-…», «Soera Al-…», «Sure Al-…»). Âyet sayıları
Diyanet mushafı (Kûfe sayımı). Ses yalnız `docs/dinleme-ses-kaynaklari.json`'da kaydı olan dosyalar; Fâtiha parçaları
`1-1…1-7` (`1-0` besmeledir, parçalara girmez).

**Seviye önerisi v2** (27 Eylül 2026: v1, kaynak araştırmasının «asgari değişiklik» önerisiyle güncellendi —
[EZBER-SEVIYE-KAYNAK-ARASTIRMASI.md](../../EZBER-SEVIYE-KAYNAK-ARASTIRMASI.md) §I.3 Seçenek A; Rıdvan onayına kadar
öneridir; dayanak: Diyanet programlarının «önce namaz» ilkesi + Hanefî hükümler):

| Seviye | Ad (öneri) | Maddeler (sıra) |
|---|---|---|
| 1 | İlk adım: iman ve besmele | d-euzu-besmele, d-kelime-i-tevhid, d-kelime-i-sehadet, b-imanin-sartlari, b-islamin-sartlari |
| 2 | Namaza hazırlık | b-abdestin-farzlari, b-guslun-farzlari, b-teyemmumun-farzlari, d-abdest-niyeti, b-namazin-farzlari, d-namaz-niyeti, d-tekbir, d-subhaneke |
| 3 | Kıyam, rükû ve secde | s-fatiha, s-ihlas, s-kevser, d-ruku-tesbihi, d-tesmi-tahmid, d-secde-tesbihi |
| 4 | Oturuş ve selâm | d-ettehiyyatu, d-salli, d-barik, d-rabbena-atina, d-rabbenagfirli, d-selam |
| 5 | Namaz sûreleri I | s-asr, s-fil, s-nasr, s-felak, s-nas |
| 6 | Namaz sûreleri II | s-kureys, s-maun, s-kafirun, s-tebbet, s-insirah |
| 7 | Vitir, tesbihat ve ezan | d-kunut-1, d-kunut-2, s-ayetel-kursi, d-tesbihat, d-ezan, d-kamet, d-ezan-duasi, d-amentu |
| 8 | Amme cüzü | Kalan Amme sûreleri, mushaf sonundan başa: s-humeze, s-tekasur, s-karia, s-adiyat, s-zilzal, s-beyyine, s-kadir, s-alak, s-tin, s-duha, s-leyl, s-sems, s-beled, s-fecr, s-gasiye, s-ala, s-tarik, s-buruc, s-insikak, s-mutaffifin, s-infitar, s-tekvir, s-abese, s-naziat, s-nebe |
| kenar | Kenar suyu (dönemlik) | b-ulul-azm, d-tesrik-tekbiri, d-kadir-gecesi-duasi, d-rabbisrahli (Tâhâ 25–28), d-telbiye, d-oruc-niyeti, s-alak-1-5, b-secme-hadisler, b-kuran-fazileti-hadisleri, b-dort-halife, d-yemek-duasi — sıra sınıf hedefi tarihine göre |

- [ ] **Adım 1:** `katalog.json`'u yaz (`"$schema": "./katalog.schema.json"`, `surum: 1`, 9 seviye tanımı: ad + amaç
  beş dilde, 70–80 madde). Mevcut ses bağlantıları: 15 sûre `sureler/*.mp3` + âyet parçaları (`ayet/1-*`, `2-255`,
  `94-*`, `97-*`, `103-*`, `105…114-*`); dualar `subhaneke`, `tahiyyat`, `salli`, `barik`, `rabbena-atina`,
  `rabbenagfirli`, `kunut-1`, `kunut-2`, `ezan`, `kamet`, `ezan-duasi`. `rabbena.mp3` ve `sallibarik.mp3` bağlanmaz
  (ilki kaynaksız, ikincisi iki maddenin birleşimi).
- [ ] **Adım 2:** `plan-eslesme.json` — 49 dizenin her biri, dosyadaki yazımıyla birebir anahtar; değer kimlik dizisi.
  Çoklu dizeler: «Kevser; Asr; Nasr» → `["s-kevser","s-asr","s-nasr"]`, «Allâhümme Salli; Allâhümme Bârik» →
  `["d-salli","d-barik"]`, «Rabbenâ Âtinâ; Rabbenağfirlî» → `["d-rabbena-atina","d-rabbenagfirli"]`,
  «Felak; Nâs», «Fîl; Kureyş», «Kelime-i Tevhid ve Kelime-i Şehâdet», «Ezan ve Kâmet», «Kunut duaları» →
  `["d-kunut-1","d-kunut-2"]`, tesbihat dizesi → `["d-tesbihat"]`, «Ardından: Lâ ilâhe illallâhu vahdehû…» →
  `["d-tesbihat"]` (tesbihatın parçası), cenaze dizesi («…Rabbenâ âtinâ… dua niyetiyle okur») → `["d-rabbena-atina"]`,
  iki niyet dizesi → `["d-namaz-niyeti"]`.
- [ ] **Adım 3:** `eski-kimlikler.json` — `ezberListesi`: 19 kimlik (`salli-barik` → `["d-salli","d-barik"]`,
  `rabbena` → `["d-rabbena-atina","d-rabbenagfirli"]`, `tahiyyat` → `["d-ettehiyyatu"]`, diğerleri tek); `seviyeTesti`:
  `ez01`…`ez14` (ez02 → tevhid + şehâdet, ez10 → Fîl…Tebbet 7 sûre, ez11 → İhlâs/Felak/Nâs, ez13 → ezan + kâmet).
- [ ] **Adım 4:** `npm run test:ezber` → tüm testler geçer. `npx astro check` temiz.
- [ ] **Adım 5: Commit** — `git add src/data/ezber src/lib/ezber tests/ezber-katalog.test.mjs package.json` →
  «Ezber Kilimi Faz 1a: tek ezber kataloğu, eşlemeler ve bütünlük testleri».

### Görev 3: Onay tablosu, belgeler, doğrulama

**Dosyalar:** Oluştur `scripts/ezber-seviye-tablosu.mjs`, `docs/EZBER-KILIMI.md`, `docs/EGITIM-PLATFORMU.md`;
değiştir `docs/PROJE-HAFIZASI.md`, `package.json` (`"ezber:tablo": "node scripts/ezber-seviye-tablosu.mjs"`).

- [ ] **Adım 1: Tablo üreticisi** — `scripts/ezber-seviye-tablosu.mjs`:

```js
/** Ezber Kilimi seviye onay tablosu (27 Eyl 2026, Faz 1a): katalogdan Markdown üretir; tek kaynak katalog.json.
 *  Kullanım: npm run ezber:tablo [-- --dil fr] */
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-tablo.mjs');
await build({ stdin: { contents: 'export * from "./src/lib/ezber/katalog.ts";', resolveDir: process.cwd() }, outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const m = await import(pathToFileURL(outfile).href);
const dil = process.argv.includes('--dil') ? process.argv[process.argv.indexOf('--dil') + 1] : 'tr';
const plan = JSON.parse(readFileSync('src/data/yillik-plan-2026-2027.json', 'utf8'));
const hedef = m.sinifHedefleri(plan);
const eski = JSON.parse(readFileSync('src/data/ezber/eski-kimlikler.json', 'utf8'));
const eskiAdlari = (id) => Object.entries(eski).flatMap(([kaynak, t]) => Object.entries(t).filter(([, v]) => v.includes(id)).map(([k]) => (kaynak === 'seviyeTesti' ? k : `eski:${k}`)));
const TUR = { sure: 'sûre', dua: 'dua', bilgi: 'bilgi' };
const tarih = (t) => (t ? new Date(`${t}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const satirlar = [];
for (const s of m.KATALOG.seviyeler) {
  const ogeler = m.seviyeOgeleri(s.kimlik);
  satirlar.push(`\n### ${s.kimlik === 'kenar' ? 'Kenar suyu' : `${s.kimlik}. şerit`} — ${s.ad[dil]} (${ogeler.length})\n`, `_${s.amac[dil]}_\n`,
    '| # | Madde | Tür | Kur\'an | Ses | Sınıf hedefi | Eski kimlik |', '|---|---|---|---|---|---|---|');
  for (const o of ogeler) {
    const ses = o.ses?.tam ? (o.ses.parcalar ? 'tam + âyet âyet' : 'tam') : o.ses?.parcalar ? 'parça' : 'yok';
    const kuran = o.kuran ? `${o.kuran.sure}:${o.kuran.ayetler[0]}${o.kuran.ayetler[1] !== o.kuran.ayetler[0] ? `–${o.kuran.ayetler[1]}` : ''}` : o.kuranMetni ? 'evet' : '—';
    satirlar.push(`| ${o.sira} | ${o.ad[dil]} | ${TUR[o.tur]} | ${kuran} | ${ses} | ${tarih(hedef[o.id])} | ${eskiAdlari(o.id).join(', ') || '—'} |`);
  }
}
const toplam = m.KATALOG.ogeler.length, sesli = m.KATALOG.ogeler.filter((o) => o.ses).length;
console.log(`## Ezber Kilimi — seviye listesi (katalog sürüm ${m.KATALOG.surum}; ${toplam} madde, ${sesli} maddenin Diyanet sesi hazır)`);
console.log(satirlar.join('\n'));
```

- [ ] **Adım 2:** `npm run ezber:tablo` → çıktıyı gözle denetle (9 başlık, her satırda ad/tür/tarih).
- [ ] **Adım 3: Belgeler** — `docs/EZBER-KILIMI.md`: kararlar özeti (ana plan §2'den), katalog kuralları (kimlik biçimi,
  seviye modeli, `kuranMetni`, ses kaynağı kuralı, eşleme tabloları, madde ekleme reçetesi: JSON → `npm run test:ezber`
  → `npm run ezber:tablo`), onay durumu. `docs/EGITIM-PLATFORMU.md`: platform kararı (egitim.ulucamii.be, Firebase
  Hosting, taşıma sırası, ihtida ulucamii.be'de kalır, ihtida.ulucamii.be'ye dokunulmaz). `PROJE-HAFIZASI.md`'ye iki bağlantı.
- [ ] **Adım 4: Bağımsız gözden geçirme** — taze bir alt ajan (Opus): katalogdaki dinî ad/numara/âyet aralıklarını
  araştırma raporu ve Diyanet kaynağıyla örneklem denetler; Türkçe imlâ; eşleme boşlukları. Bulgular düzeltilir.
- [ ] **Adım 5: Doğrulama** — `npm run test:ezber`, `npx astro check`, `npm run dogrula` (tarihe bağlı 12 ana sayfa
  görsel temel resmi dışında temiz).
- [ ] **Adım 6: Commit** (push yok) ve **onay kapısı**: `npm run ezber:tablo` çıktısı Rıdvan'a sunulur. Onaydan
  sonra yalnız `seviye`/`sira`/seviye adları değişir; testler yeniden koşar; `surum` artmaz (yayın öncesi).
