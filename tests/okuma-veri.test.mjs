/**
 * İlim Yolu · Kur'an Okuma (10 Kasım 2026) — yol içeriği (src/lib/okuma/yol.ts, scripts/okuma-uret.mjs) ve beş dilli metinler (egitim/src/i18n/okuma.ts).
 * Bağlayıcı: her ses dosyası vardır ve Diyanet künyesi/sha256'sı kayıtlıdır (yapay ses yok); her Arapça metin Diyanet verisinden gelir; madde sırası
 * kalıcıdır (parmak izi: sıra değişirse eski ilerleme kayar); her etiket ve ders adı beş dilde vardır; metinlerde «taslak» etiketi yoktur.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const ozet = (yol) => createHash('sha256').update(readFileSync(`public${yol}`)).digest('hex');
mkdirSync('node_modules/.cache', { recursive: true });
const paket = async (giris, ad) => {
  const cikti = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ entryPoints: [giris], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent', alias: { '@ortak': resolve('src') } });
  return import(pathToFileURL(cikti).href);
};
const { YOL, PLAN, ogeBul } = await paket('src/lib/okuma/yol.ts', 'okuma-veri-yol');
const T = await paket('egitim/src/i18n/okuma.ts', 'okuma-veri-i18n');
const { vurguAyir, konumSec } = await import('../scripts/okuma-uret.mjs');

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const okumaKunye = json('docs/okuma-ses-kaynaklari.json');
const dinlemeKunye = json('docs/dinleme-ses-kaynaklari.json');
const yeniKunye = json('docs/okuma-ses-kaynaklari-egitim.json');
const yeni = json('src/data/okuma/yeni.json');
const dogrulama = json('docs/okuma-metin-dogrulama.json');
const ek = json('src/data/okuma/ek.json');
const sureler = json('src/data/okuma/sureler.json');
const ogeler = YOL.flatMap((b) => b.dersler.flatMap((d) => d.ogeler));

test('Dokuz adım; kimlikler benzersiz, sıralı ve <adım>-<sıra> biçiminde', () => {
  assert.deepEqual(YOL.map((b) => b.id), ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9']);
  assert.equal(new Set(ogeler.map((o) => o.id)).size, ogeler.length);
  for (const b of YOL) {
    const idler = b.dersler.flatMap((d) => d.ogeler.map((o) => o.id));
    assert.deepEqual(idler, idler.map((_, i) => `${b.id}-${i}`), b.id);
    assert.ok(b.dersler.every((d) => d.ogeler.length > 0 && d.ogeler.length <= 14), `${b.id}: ders boyu`);
  }
  assert.equal(ogeBul('o1-0').h, 'elif');
});

test('Her madde: Arapça dolu, ses yolu Diyanet künyesinde kayıtlı, dosya var, yapay/harici kaynak yok', () => {
  for (const o of ogeler) {
    assert.ok(o.ar && o.ar.trim() === o.ar, o.id);
    assert.match(o.ses, /^\/media\/ses\/(elifba|okuma|ayet)\/.+\.mp3$/, o.id);
    assert.ok(!/yapay/.test(o.ses), o.id);
    // ulucamii.be'deki sesler public/ altında; egitim Hosting'indeki yeni sesler (o8, o9) egitim/public/ altında ve kendi künyesinde (git dışı: dosya yoksa bekçi `node scripts/okuma-ses-ekle.mjs --denetle` bildirir)
    const yerel = o.ses.startsWith('/media/ses/okuma/yeni/');
    if (!yerel) assert.ok(existsSync(`public${o.ses}`), `${o.id}: ${o.ses}`);
    assert.ok(okumaKunye[o.ses] || dinlemeKunye[o.ses] || yeniKunye[o.ses], `${o.id}: künye yok ${o.ses}`);
    if (o.v) for (const [bas, bit] of o.v) assert.ok(0 <= bas && bas < bit && bit <= o.ar.length, `${o.id}: vurgu`);
  }
});

test('Yeni eklenen sesler (okuma/) künyedeki sha256 ile birebir; künye Diyanet adreslerini gösterir', () => {
  const adlar = Object.keys(okumaKunye);
  assert.equal(adlar.length, ek.bitisme.length + ek.kelimeler.length);
  for (const yol of adlar) {
    assert.equal(ozet(yol), okumaKunye[yol].sha256, yol);
    assert.match(okumaKunye[yol].kaynak, /^https:\/\/kuran\.diyanet\.gov\.tr\/elifba\/data\/sound\//, yol);
  }
  for (const o of [...ek.bitisme, ...ek.kelimeler]) assert.ok(okumaKunye[o.ses], o.ses);
});

test('Sûreler: Arapça metin, sayfa ve ses Ezber Kilimi verisiyle birebir', () => {
  const katalog = json('src/data/ezber/katalog.json').ogeler;
  for (const s of sureler) {
    const k = katalog.find((x) => x.id === s.id);
    const metin = json(`src/data/ezber/metin/${s.id}.json`);
    assert.equal(s.ayetler.length, metin.bolumler.length, s.id);
    s.ayetler.forEach((a, i) => {
      assert.equal(a.ar, metin.bolumler[i].ar, `${s.id}:${a.n}`);
      assert.equal(a.sayfa, metin.bolumler[i].sayfa, `${s.id}:${a.n}`);
      assert.equal(a.ses, k.ses.parcalar[i], `${s.id}:${a.n}`);
      assert.match(a.ses, new RegExp(`^/media/ses/ayet/${s.no}-${a.n}\\.mp3$`));
    });
  }
  assert.equal(sureler[0].id, 's-fatiha');
  assert.equal(sureler[1].id, 's-nas');
});

test('Harf, hece ve tecvid maddeleri ecouter.json ile aynı (Arapça ve ses)', () => {
  const e = json('src/data/ecouter.json').kodlar;
  const havuz = new Map(Object.values(e).flatMap((k) => (k.ogeler ?? []).map((o) => [o.ses, o.ar])));
  const yerel = ogeler.filter((o) => !o.s && !o.ses.startsWith('/media/ses/okuma/'));
  assert.ok(yerel.length > 300);
  for (const o of yerel) assert.equal(havuz.get(o.ses), o.ar, o.id);
  // yeni sesler: bitişme + kelime sayıları
  assert.equal(ogeler.filter((o) => o.ses.startsWith('/media/ses/okuma/') && !o.ses.startsWith('/media/ses/okuma/yeni/')).length, 225);
});

test('Portal metni vurgu ayrıştırıcısı ve harf konumu', () => {
  assert.deepEqual(vurguAyir('س{ا}ل'), { metin: 'سال', v: [[1, 2]] });
  assert.deepEqual(vurguAyir('سك{ت} جن{ة}'), { metin: 'سكت جنة', v: [[2, 3], [6, 7]] });
  assert.equal(konumSec('ا', [[0, 1]]), 'harf');
  assert.equal(konumSec('امر', [[0, 1]]), 'basta');
  assert.equal(konumSec('سال', [[1, 2]]), 'ortada');
  assert.equal(konumSec('نبا', [[2, 3]]), 'sonda');
  assert.equal(konumSec('سكت جنة', [[2, 3], [6, 7]]), 'sonda');
  const konumlar = new Set(ek.bitisme.map((b) => b.konum));
  assert.deepEqual([...konumlar].sort(), ['basta', 'harf', 'ortada', 'sonda']);
});

const IZ = { o1: '742bec0b9cad301c', o2: '3ab456d5bd5e6870', o3: '84581b4846bbcd09', o4: '9c8da8ed2ea30bbe', o5: '1cd00693997d0359', o6: '7727226ac8fc1eb4', o7: '5d425ebb61e8ddd0', o8: 'ebde8eee3e1ccc48', o9: '1513acd68a8aa9f7' };

test('PARMAK İZİ: madde sırası kalıcıdır (ilerleme dizesi sıraya bağlı). Değişirse bilerek güncelleyin; yalnız SONA ekleme güvenlidir', () => {
  const iz = Object.fromEntries(YOL.map((b) => [b.id, {
    n: b.dersler.reduce((t, d) => t + d.ogeler.length, 0),
    sha: createHash('sha256').update(b.dersler.flatMap((d) => d.ogeler.map((o) => o.ses)).join('\n')).digest('hex').slice(0, 16),
  }]));
  assert.deepEqual(Object.fromEntries(Object.entries(iz).map(([k, v]) => [k, v.n])), { o1: 28, o2: 84, o3: 120, o4: 232, o5: 146, o6: 69, o7: 164, o8: 105, o9: 60 });
  assert.deepEqual(PLAN.map((p) => p.n), [28, 84, 120, 232, 146, 69, 164, 105, 60]);
  assert.deepEqual(Object.fromEntries(Object.entries(iz).map(([k, v]) => [k, v.sha])), IZ);
});

test('Beş dil: adım, etiket, ders adı ve arayüz anahtarları her dilde dolu', () => {
  const tum = DILLER.map((d) => T.okumaMetinleri(d));
  const anahtarlar = (x) => Object.keys(x).sort().join();
  for (const t of tum) {
    assert.equal(anahtarlar(t), anahtarlar(tum[0]));
    assert.equal(anahtarlar(t.kart), anahtarlar(tum[0].kart));
    assert.equal(anahtarlar(t.adlar), anahtarlar(tum[0].adlar));
    assert.equal(anahtarlar(t.adimlar), anahtarlar(tum[0].adimlar));
    assert.equal(anahtarlar(t.anaKart), anahtarlar(tum[0].anaKart));
    for (const [k, v] of [...Object.entries(t), ...Object.entries(t.kart), ...Object.entries(t.adlar)]) {
      if (typeof v === 'string') assert.ok(v.trim(), k);
    }
    for (const a of Object.values(t.adimlar)) assert.ok(a.ad && a.metin);
  }
  const gruplar = new Set(YOL.flatMap((b) => b.dersler.map((d) => d.grup)).filter((g) => !g.startsWith('s-')));
  const etiketler = new Set(ogeler.map((o) => o.e).filter(Boolean));
  for (const d of DILLER) {
    const adlar = T.okumaMetinleri(d).adlar;
    for (const g of [...gruplar, ...etiketler]) assert.ok(adlar[g], `${d}: ${g}`);
    for (const b of YOL) for (const ders of b.dersler) assert.ok(T.dersAdi(d, ders.grup, ders.parca, ders.parcaSayisi), `${d}: ${ders.id}`);
    for (const o of ogeler) if (o.h || o.s) assert.ok(T.etiketYaz(d, o), `${d}: ${o.id}`);
  }
  // sûre adları katalogdan beş dilde gelir; harf adı elifba-verisinden
  assert.equal(T.etiketYaz('tr', ogeBul('o7-8')), 'Nâs Sûresi · 2');
  assert.equal(T.etiketYaz('fr', ogeBul('o2-0')), 'Fatha · Alif');
  assert.notEqual(T.etiketYaz('de', ogeBul('o7-8')), T.etiketYaz('tr', ogeBul('o7-8')));
});

test('Hitap ve ilke: «taslak» etiketi yok; kalp simgesi yok; telefon numarası yok; fr tipografisi bölünmez boşlukla', () => {
  const kaynak = readFileSync('egitim/src/i18n/okuma.ts', 'utf8');
  assert.ok(!/taslak|draft|entwurf|concept/i.test(kaynak), '«taslak» etiketi');
  assert.ok(!/[♥❤💗💖]/u.test(kaynak));
  assert.ok(!/\+?\d[\d ]{8,}/.test(kaynak.replace(/10–15|10 bis 15|10 tot 15|10 à 15|10-15/g, '')), 'telefon');
  assert.match(T.okumaMetinleri('fr').kart.kisayol, /Espace :/);
  assert.match(T.okumaMetinleri('tr').giris, /dinleyin/);
  assert.match(T.okumaMetinleri('nl').giris, /\bu\b/);
  assert.match(T.okumaMetinleri('de').giris, /\bSie\b/);
  assert.match(T.okumaMetinleri('fr').giris, /\brépétez\b|\bécoutez\b/i);
});

test('Yeni adımlar (o8 tecvid, o9 kısa âyet): her madde doğrulanmış, künyede Diyanet adresi ve sha256, ses egitim Hosting köküne işaret eder', () => {
  const kayitlar = Object.entries(dogrulama.ogeler);
  const alinan = new Map(kayitlar.filter(([, r]) => r.durum !== 'elendi').map(([yol]) => [yol, true]));
  const maddeler = [...yeni.tecvid, ...yeni.ayetler].flatMap((g) => g.ogeler);
  assert.equal(maddeler.length, alinan.size, 'yeni.json yalnız doğrulananları taşır');
  assert.equal(Object.keys(yeniKunye).length, maddeler.length);
  for (const [yol, k] of Object.entries(yeniKunye)) {
    assert.match(yol, /^\/media\/ses\/okuma\/yeni\/.+\.mp3$/, yol);
    assert.match(k.kaynak, /^https:\/\/(kuran|webdosya)\.diyanet\.gov\.tr\//, yol);
    assert.match(k.sha256, /^[0-9a-f]{64}$/, yol);
    assert.ok(k.bayt > 1000, yol);
  }
  for (const o of maddeler) assert.ok(yeniKunye[o.ses], o.ses);
  // her kayıt ya doğrulandı ya da gerekçesiyle elendi; dolaylı olanın eşi doğrulanmış olmalı
  for (const [yol, r] of kayitlar) {
    assert.ok(['dogrulandi', 'dolayli', 'elendi'].includes(r.durum), yol);
    if (r.durum === 'elendi') assert.ok(r.neden, yol);
    if (r.durum === 'dolayli') assert.equal(dogrulama.ogeler[r.es]?.durum, 'dogrulandi', yol);
  }
  assert.equal(dogrulama.sayilar.ayet.elendi, 0);
  assert.ok(dogrulama.sayilar.tecvid.dogrulandi + dogrulama.sayilar.tecvid.dolayli >= 100);
  for (const g of yeni.ayetler) {
    const ns = g.ogeler.filter((o) => o.n !== undefined).map((o) => o.n);
    assert.deepEqual(ns, [...ns].sort((a, b) => a - b), g.grup);
    assert.ok(g.ogeler.filter((o) => o.e === 'besmele').length <= 1, g.grup);
  }
  for (const o of ogeler.filter((x) => x.ses.startsWith('/media/ses/okuma/yeni/'))) assert.ok(/^o[89]-/.test(o.id), o.id);
  assert.equal(YOL.find((b) => b.id === 'o8').iz, 'elifba');
  assert.equal(YOL.find((b) => b.id === 'o9').iz, 'mushaf');
  assert.equal(T.etiketYaz('tr', ogeler.find((o) => o.s === 's-nas' && o.n === undefined)), 'Nâs Sûresi · Besmele');
  assert.equal(T.etiketYaz('fr', ogeler.find((o) => o.s === 'bakara-1-5' && o.n === 1)), 'Sourate Al-Baqara, versets 1 à 5 · 1');
});
