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
  assert.deepEqual(m.planKimlikleri('constructor'), []);
  assert.deepEqual(m.eskiKimliktenYeni('ezberListesi', 'fatiha'), ['s-fatiha']);
  assert.deepEqual(m.eskiKimliktenYeni('seviyeTesti', 'ez04'), ['s-fatiha']);
  assert.deepEqual(m.eskiKimliktenYeni('seviyeTesti', 'ez99'), []);
});

test('sinifHedefleri: çoklu dize her maddeye aynı tarih; aynı madde için en erken tarih', () => {
  const h = m.sinifHedefleri(plan);
  assert.equal(h['s-fatiha'], '2027-03-27');
  for (const id of ['s-kevser', 's-asr', 's-nasr']) assert.equal(h[id], '2027-04-25', id);
  assert.equal(h['d-kelime-i-tevhid'], '2026-11-07'); // 7 Kasım 2026 ve 27 Mart 2027'de iki ayrı yazım
  assert.equal(h['d-kadir-gecesi-duasi'], '2026-12-12'); // 12 Aralık 2026 ve 1 Mart 2027'de iki ayrı metin
  const yapay = { gunler: [{ tarih: '2027-01-02', dersler: [{ ezber: ['Fâtiha'] }] }, { tarih: '2026-12-01', dersler: [{ ezber: ['Fâtiha'] }] }] };
  assert.deepEqual(m.sinifHedefleri(yapay), { 's-fatiha': '2026-12-01' });
});
