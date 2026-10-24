/**
 * Ezber Kilimi bilgi maddeleri (24 Ekim 2026) — veri bütünlüğü. Neden: iman şartları, farzlar, hadis seçkileri gibi sayılı
 * listeler çocuğa dinî bilgi öğretir; kaynağı olmayan ya da iki Diyanet çizgili kaynakla karşılaştırılmamış bir madde, eksik bir
 * dil ya da yanlış gruplanmış bir satır yanlış öğretir. Burada: şema, katalogla bayrak eşleşmesi, kaynak ve doğrulama kuralları,
 * beş dilin eksiksizliği, EN/NL/DE'nin taslak sayılması, Arapça terimlerin yazı tipi kümesinde olması, grup numaralaması ve
 * kişisel veri/yasak simge taraması. Metnin kitaplarla birebir eşliği veri girilirken
 * kaynak dosyalarına karşı sınanmıştır (kaynak arşivi depoda yoktur, telif gereği yalnız yerel); sayfa davranışı tests/egitim/bilgi.spec.mjs'tedir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Validator } from '@cfworker/json-schema';

const json = (yol) => JSON.parse(readFileSync(yol, 'utf8'));
mkdirSync('node_modules/.cache', { recursive: true });
const modul = resolve('node_modules/.cache/ezber-bilgi-test.mjs');
await build({
  stdin: {
    contents: [
      'export * from "./src/lib/ezber/bilgi-metni.ts";',
      'export { calismaSayfasiVar, KATALOG } from "./src/lib/ezber/katalog.ts";',
    ].join('\n'),
    resolveDir: process.cwd(),
  },
  outfile: modul, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent', packages: 'external',
});
const m = await import(pathToFileURL(modul).href);

const KLASOR = 'src/data/ezber/bilgi';
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const sema = new Validator(json(`${KLASOR}/bilgi.schema.json`), '7', false);
const katalog = json('src/data/ezber/katalog.json');
const font = new Set(json('egitim/public/fonts/ulu-nesih.json').kume.map((u) => Number.parseInt(u.slice(2), 16)));
const dosyalar = readdirSync(KLASOR).filter((d) => /^b-.*\.json$/.test(d));
const veriler = new Map(dosyalar.map((d) => [d.slice(0, -5), json(`${KLASOR}/${d}`)]));
const bilgiOgeleri = katalog.ogeler.filter((o) => o.bilgiMetni === true);
// Arapça blokları + Arapça Genişletilmiş-C (Diyanet'in kasr işareti) + boşluk/ZWNJ/ZWJ (madde-metni testiyle aynı küme).
const ARAPCA = /^[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\u{10EC0}-\u{10EFF}  ‌‍]+$/u;

test('Her bilgi dosyası şemaya uyar; kimliği dosya adıyla aynıdır', () => {
  assert.ok(dosyalar.length > 0, 'bilgi dosyası yok');
  for (const [id, b] of veriler) {
    const r = sema.validate(b);
    assert.ok(r.valid, `${id}: ${JSON.stringify(r.errors.slice(0, 3))}`);
    assert.equal(b.id, id);
  }
});

test('Katalogdaki bilgiMetni bayrağı ile bilgi dosyaları bire bir eşleşir; maddeler bilgi türünde ve çalışma sayfası alır', () => {
  assert.deepEqual(bilgiOgeleri.map((o) => o.id).sort(), [...veriler.keys()].sort());
  for (const o of bilgiOgeleri) {
    assert.equal(o.tur, 'bilgi', `${o.id}: bayraklı madde bilgi türünde olmalı`);
    assert.equal(o.kuranMetni, false, `${o.id}: Kur'an metni değildir`);
    assert.equal(m.calismaSayfasiVar(m.KATALOG.ogeler.find((x) => x.id === o.id)), true, `${o.id}: sayfa çıkmalı`);
  }
  // Bayraksız bilgi maddesi sayfa almaz (metni yoksa «yakında»).
  assert.equal(m.calismaSayfasiVar({ tur: 'bilgi' }), false);
  assert.equal(m.calismaSayfasiVar({ tur: 'bilgi', bilgiMetni: true }), true);
});

test('Kaynaklar: en az iki, biri metin biri karşılaştırma; her kaynak sayfa ya da bölüm gösterir; Fransızca kaynağı yoksa satırlar taslaktır', () => {
  for (const [id, b] of veriler) {
    assert.ok(b.kaynaklar.length >= 2, `${id}: en az iki kaynak`);
    assert.ok(b.kaynaklar.some((k) => k.rol === 'metin'), `${id}: metin kaynağı yok`);
    assert.ok(b.kaynaklar.some((k) => k.rol === 'dogrulama'), `${id}: karşılaştırma kaynağı yok`);
    for (const k of b.kaynaklar) assert.ok(k.sayfa || k.bolum, `${id}: «${k.ad}» sayfa ya da bölüm göstermiyor`);
    if (!b.kaynaklar.some((k) => k.rol === 'fr')) {
      assert.ok(b.maddeler.every((x) => x.taslak?.includes('fr')), `${id}: resmî Fransızca kaynağı yok, her satır taslak sayılmalı`);
    }
  }
});

test('Beş dil de dolu; en, nl ve de her zaman taslaktır, tr ve fr taslak değildir (satır bazında fr taslağı olabilir)', () => {
  for (const [id, b] of veriler) {
    for (const x of b.maddeler) for (const d of DILLER) assert.ok(x.ad[d]?.trim(), `${id}: madde ${d} boş`);
    for (const g of b.gruplar ?? []) for (const d of DILLER) assert.ok(g.ad[d]?.trim(), `${id}: grup ${g.kimlik} ${d} boş`);
    if (b.not) for (const d of DILLER) assert.ok(b.not[d]?.trim(), `${id}: not ${d} boş`);
    for (const d of ['en', 'nl', 'de']) assert.ok(b.taslak.includes(d), `${id}: ${d} taslak sayılmalı (resmî çeviri yok)`);
    for (const d of ['tr', 'fr']) assert.ok(!b.taslak.includes(d), `${id}: ${d} dosya düzeyinde taslak olamaz (satır bazında olur)`);
    for (const x of b.maddeler) for (const d of x.taslak ?? []) assert.ok(DILLER.includes(d), `${id}: bilinmeyen dil ${d}`);
  }
});

test('Gruplar: her madde tanımlı bir gruba bağlıdır, boş grup yoktur; grupsuz listede grup alanı yoktur', () => {
  for (const [id, b] of veriler) {
    const kimlikler = new Set((b.gruplar ?? []).map((g) => g.kimlik));
    assert.equal(kimlikler.size, (b.gruplar ?? []).length, `${id}: yinelenen grup kimliği`);
    for (const x of b.maddeler) {
      if (kimlikler.size) assert.ok(x.grup && kimlikler.has(x.grup), `${id}: «${x.ad.tr}» bilinmeyen gruba bağlı`);
      else assert.equal(x.grup, undefined, `${id}: grup tanımsız ama madde grup taşıyor`);
    }
    for (const k of kimlikler) assert.ok(b.maddeler.some((x) => x.grup === k), `${id}: «${k}» grubu boş`);
  }
});

test('Arapça terimler yalnız Arapça karakterden oluşur ve Ulu Nesih yazı tipi kümesindedir (boş kare çıkmaz)', () => {
  let toplam = 0;
  for (const [id, b] of veriler) {
    for (const x of b.maddeler) {
      if (!x.ar) continue;
      toplam++;
      assert.match(x.ar, ARAPCA, `${id}: Arapça alanda Arapça dışı karakter`);
      for (const ch of x.ar) {
        const u = ch.codePointAt(0);
        if (u === 0x20 || u === 0x200c || u === 0x200d || u === 0xa0) continue;
        assert.ok(font.has(u), `${id}: U+${u.toString(16).toUpperCase()} yazı tipi kümesinde yok`);
      }
    }
  }
  assert.ok(toplam > 0, 'hiç Arapça terim denetlenmedi');
});

test('Hadis listeleri: sıra yoktur; her satırın künyesi ve Diyanet karşılığı vardır; doğrulanamayanın nedeni yazılıdır', () => {
  const hadisler = [...veriler.values()].filter((b) => !b.sirali);
  assert.ok(hadisler.length >= 2);
  for (const b of hadisler) {
    for (const x of b.maddeler) {
      assert.ok(x.kunye?.trim(), `${b.id}: «${x.ad.tr.slice(0, 40)}» künyesiz hadis`);
      assert.ok(x.dogrulama?.kaynak?.trim(), `${b.id}: «${x.ad.tr.slice(0, 40)}» Diyanet hadis yayınında doğrulanmamış`);
    }
    assert.ok(Array.isArray(b.alinmayan) && b.alinmayan.length > 0, `${b.id}: alınmayanlar ve nedenleri yazılmalı`);
    for (const a of b.alinmayan) assert.ok(a.neden?.trim() && a.metin?.trim(), `${b.id}: alınmayan satırın nedeni boş`);
    assert.ok(b.not, `${b.id}: kitaptaki sayı ile sayfadaki sayı farkı notla açıklanmalı`);
  }
});

test('Onay: onay yoksa «hoca incelemesi bekliyor»; onaylı kapsam geçerli dillerden ve tarih biçimlidir', () => {
  for (const [id, b] of veriler) {
    if (b.onay === null) continue;
    assert.match(b.onay.tarih, /^\d{4}-\d{2}-\d{2}$/, `${id}: onay tarihi`);
    assert.ok(b.onay.kapsam.length > 0 && b.onay.kapsam.every((d) => DILLER.includes(d)), `${id}: onay kapsamı`);
  }
});

test('dilDurumu: onaysız tr/fr bekliyor, en/nl/de taslak; onay dili taslaktan da çıkarır; maddeTaslakMi satır taslağını görür', () => {
  const b = { id: 'x', sirali: true, maddeler: [{ ad: {}, taslak: ['fr'] }, { ad: {} }], taslak: ['en', 'nl', 'de'], kaynaklar: [], onay: null };
  assert.equal(m.dilDurumu(b, 'tr'), 'bekliyor');
  assert.equal(m.dilDurumu(b, 'fr'), 'bekliyor');
  for (const d of ['en', 'nl', 'de']) assert.equal(m.dilDurumu(b, d), 'taslak');
  const onayli = { ...b, onay: { tarih: '2026-10-25', kapsam: ['tr', 'en'] } };
  assert.equal(m.dilDurumu(onayli, 'tr'), 'onayli');
  assert.equal(m.dilDurumu(onayli, 'en'), 'onayli');
  assert.equal(m.dilDurumu(onayli, 'nl'), 'taslak');
  assert.equal(m.maddeTaslakMi(b, b.maddeler[0], 'fr'), true);
  assert.equal(m.maddeTaslakMi(b, b.maddeler[1], 'fr'), false);
  assert.equal(m.maddeTaslakMi(onayli, onayli.maddeler[0], 'en'), false);
});

test('gosterimGruplari: her grup 1\'den numaralanır; siralamaVar sırasız listede ve iki maddede kapalıdır', () => {
  const ad = (t) => ({ tr: t, fr: t, en: t, nl: t, de: t });
  const iki = { id: 'x', sirali: true, maddeler: [{ ad: ad('a') }, { ad: ad('b') }], taslak: [], kaynaklar: [], onay: null };
  assert.deepEqual(m.gosterimGruplari(iki, 'tr').map((g) => g.maddeler.map((x) => x.no)), [[1, 2]]);
  assert.equal(m.siralamaVar(iki), false, 'iki maddede sıralama oyunu anlamsız');
  const uc = { ...iki, maddeler: [...iki.maddeler, { ad: ad('c') }] };
  assert.equal(m.siralamaVar(uc), true);
  assert.equal(m.siralamaVar({ ...uc, sirali: false }), false);
  const iki2 = {
    ...iki,
    gruplar: [{ kimlik: 'g1', ad: ad('G1') }, { kimlik: 'g2', ad: ad('G2') }],
    maddeler: [{ ad: ad('a'), grup: 'g1' }, { ad: ad('b'), grup: 'g2' }, { ad: ad('c'), grup: 'g1' }, { ad: ad('d'), grup: 'g2' }],
  };
  const g = m.gosterimGruplari(iki2, 'tr');
  assert.deepEqual(g.map((x) => [x.kimlik, x.ad, x.maddeler.map((y) => `${y.no}${y.metin}`)]), [['g1', 'G1', ['1a', '2c']], ['g2', 'G2', ['1b', '2d']]]);
  // Bilinmeyen grup madde atlamaz, ilk gruba düşer.
  const bozuk = { ...iki2, maddeler: [...iki2.maddeler, { ad: ad('e'), grup: 'yok' }] };
  assert.equal(m.gosterimGruplari(bozuk, 'tr').reduce((t, x) => t + x.maddeler.length, 0), 5);
});

test('Gerçek veride numaralama: kitaptaki sayılarla uyuşur', () => {
  const sayi = (id) => m.gosterimGruplari(veriler.get(id), 'tr').map((g) => g.maddeler.length);
  assert.deepEqual(sayi('b-imanin-sartlari'), [6]);
  assert.deepEqual(sayi('b-islamin-sartlari'), [5]);
  assert.deepEqual(sayi('b-abdestin-farzlari'), [4]);
  assert.deepEqual(sayi('b-guslun-farzlari'), [3]);
  assert.deepEqual(sayi('b-teyemmumun-farzlari'), [2]);
  assert.deepEqual(sayi('b-namazin-farzlari'), [6, 6]);
  assert.deepEqual(sayi('b-ulul-azm'), [5]);
  assert.deepEqual(sayi('b-dort-halife'), [4]);
});

test('Kaynak sırası rol sırasıyladır; kişisel veri, telefon ve yasak simge yoktur (herkese açık depo)', () => {
  for (const [id, b] of veriler) {
    const roller = m.kaynakSirasi(b).map((k) => k.rol);
    assert.deepEqual(roller, [...roller].sort((p, q) => ['metin', 'fr', 'ar', 'dogrulama'].indexOf(p) - ['metin', 'fr', 'ar', 'dogrulama'].indexOf(q)), id);
    const hamMetin = readFileSync(`${KLASOR}/${id}.json`, 'utf8');
    assert.doesNotMatch(hamMetin, /🙏/, `${id}: katlanmış el simgesi yasak`);
    assert.doesNotMatch(hamMetin, /\+?\d[\d .\-/]{8,}\d/, `${id}: telefon benzeri sayı dizisi`);
    assert.doesNotMatch(hamMetin, /@[a-z0-9-]+\.[a-z]{2,}/i, `${id}: e-posta adresi`);
    assert.doesNotMatch(hamMetin, /Rıdvan|Yeliz|KAYAHAN/i, `${id}: kişi adı`);
  }
});

test('Katalog bayrağı yalnız bilgi türünde kullanılır; bilgi dosyası dışında bilgiMetni verisi yok', () => {
  for (const o of katalog.ogeler.filter((x) => 'bilgiMetni' in x)) assert.equal(o.tur, 'bilgi', o.id);
  assert.ok(existsSync(`${KLASOR}/bilgi.schema.json`));
});

test('ezber:bilgi --onayla: bilinmeyen madde ve geçersiz kapsam reddedilir, dosyalara dokunmaz', () => {
  const once = dosyalar.map((d) => readFileSync(`${KLASOR}/${d}`, 'utf8'));
  const kos = (...a) => spawnSync(process.execPath, ['scripts/ezber-bilgi.mjs', ...a], { encoding: 'utf8' });
  const a = kos('--onayla', 'b-yok');
  assert.equal(a.status, 1);
  assert.match(a.stderr, /Bilinmeyen madde/);
  const b = kos('--onayla', 'hepsi', '--kapsam', 'tr,xx');
  assert.equal(b.status, 1);
  assert.deepEqual(dosyalar.map((d) => readFileSync(`${KLASOR}/${d}`, 'utf8')), once);
});
