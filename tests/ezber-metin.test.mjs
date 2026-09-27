/**
 * Ezber Kilimi Faz 1c (27 Eyl 2026) — ekran metinleri ve öğrenci önerisi. Neden: veliye giden her cümle beş dilde ve
 * yumuşak olmalı, kalıp anahtarı Firestore kuralına uymalı; defter cümlesinin Fransızcası makineye gitmeden kalıp
 * sözlüğünden gelmeli; hocanın penceresinde üstte doğru madde çıkmalı.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-metin-test.mjs');
await build({
  stdin: {
    contents: ['metinler', 'oneri', 'durum', 'katalog'].map((m) => `export * from "./src/lib/ezber/${m}.ts";`).join('\n'),
    resolveDir: process.cwd(),
  },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(outfile).href);
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const B = '2026-10-17';
const d = (basamak, sonrakiKontrol = '', ek = {}) => ({ basamak, kalite: '', notlar: [], sonrakiKontrol, surum: 1, ...ek });
const plan = JSON.parse(readFileSync('src/data/yillik-plan-2026-2027.json', 'utf8'));

test('Basamak adları ve kalite karşılıkları beş dilde dolu; veliye giden kalite cümlesi kararla aynı', () => {
  for (const b of [0, 1, 2, 3, 4]) for (const dil of DILLER) assert.ok(m.BASAMAK_ADLARI[b][dil]?.trim(), `${b}/${dil}`);
  for (const k of m.KALITELER) {
    assert.ok(m.KALITE_ETIKETI[k]);
    for (const dil of DILLER) assert.ok(m.KALITE_VELI[k][dil]?.trim(), `${k}/${dil}`);
  }
  assert.deepEqual(m.KALITELER.map((k) => m.KALITE_VELI[k].tr), ['Çok güzel okudu', 'Küçük düzeltmelerle geçti', 'Bir kez daha çalışalım']);
  assert.deepEqual(Object.values(m.KALITE_ETIKETI), ['Tam', 'Az hatalı', 'Tekrar gelsin']);
});

test('Kalıp notları: anahtar kuraldaki biçimde ve tekil; beş dilde dolu; ad yer tutucusu ve cinsiyet yok', () => {
  const kural = readFileSync('firebase/firestore.rules', 'utf8');
  const bicim = new RegExp(kural.match(/function kalipNotu\(n\) \{ return n is string && n\.matches\('([^']+)'\)/)[1]);
  const anahtarlar = m.NOT_KALIPLARI.map((n) => n.anahtar);
  assert.equal(new Set(anahtarlar).size, anahtarlar.length);
  assert.ok(anahtarlar.length >= 6 && anahtarlar.length <= 12);
  for (const n of m.NOT_KALIPLARI) {
    assert.match(n.anahtar, bicim);
    assert.ok(n.etiket.trim().length > 0 && n.etiket.length <= 14, n.etiket);
    for (const dil of DILLER) {
      const t = n.metin[dil];
      assert.ok(t?.trim(), `${n.anahtar}/${dil}`);
      assert.doesNotMatch(t, /[{}[\]<>]|\bil\b|\belle\b|\bhe\b|\bshe\b|\bhij\b|\bzij\b|\ber\b|\bsie\b/i, `${n.anahtar}/${dil}: ${t}`);
      assert.match(t, /[.!]$/, `${n.anahtar}/${dil} noktayla bitmeli`);
    }
    assert.equal(m.notMetni(n.anahtar, 'fr'), n.metin.fr);
  }
  assert.equal(m.notMetni('eski-anahtar', 'tr'), null);
});

test('Defter cümlesi: katalog adından kurulur; 81 × 3 cümlenin hepsi tekil ve Fransızcası var', () => {
  assert.deepEqual(m.defterCumlesi('s-fatiha', 'tam'), {
    tr: 'Ezber — Fâtiha Sûresi: çok güzel okudu.',
    fr: `Mémorisation — ${m.ezberBul('s-fatiha').ad.fr} : très bien récité.`,
  });
  assert.equal(m.defterCumlesi('d-subhaneke', 'tekrar').tr, 'Ezber — Sübhâneke Duası: bir kez daha çalışalım.');
  const s = m.defterSozlugu();
  assert.equal(Object.keys(s).length, m.KATALOG.ogeler.length * 3);
  assert.ok(Object.values(s).every((fr) => fr.startsWith('Mémorisation — ') && fr.endsWith('.')));
  assert.throws(() => m.defterCumlesi('yok', 'tam'), /katalog/i);
  assert.throws(() => m.defterCumlesi('s-fatiha', 'iyi'), /kalite/i);
});

test('Öneri: kontrolü gelenler → çalıştıkları → sıradaki yeni madde; kayıtlı ve kapsanan madde sıradaki olmaz', () => {
  const hedef = m.sinifHedefleri(plan);
  const ogeler = {
    's-fatiha': d(2, '2026-10-10'), 's-ihlas': d(1), 's-kevser': d(1, '2026-10-16'), 's-nas': d(3, '2026-11-20'),
    'd-euzu-besmele': d(4), 's-alak': d(2, '2026-10-30'),
  };
  const o = m.ogrenciOnerisi(ogeler, B, hedef);
  assert.deepEqual(o.kontrol, ['s-fatiha', 's-kevser']);
  assert.deepEqual(o.calisiyor, ['s-ihlas']);
  assert.ok(o.siradaki && !Object.hasOwn(ogeler, o.siradaki) && o.siradaki !== 's-alak-1-5');
  // Sıradaki: kaydı olmayanlar içinde en erken sınıf hedefi (eşitlikte katalog sırası).
  const kayitsiz = m.KATALOG.ogeler.map((x) => x.id).filter((id) => !Object.hasOwn(ogeler, id) && id !== 's-alak-1-5' && hedef[id]);
  const beklenen = kayitsiz.sort((a, b) => hedef[a].localeCompare(hedef[b]) || m.katalogSirasi(a) - m.katalogSirasi(b))[0];
  assert.equal(o.siradaki, beklenen);
  // Hedef yoksa katalog sırası; hepsi kayıtlıysa sıradaki yok.
  assert.equal(m.ogrenciOnerisi({}, B, {}).siradaki, 'd-euzu-besmele');
  assert.equal(m.ogrenciOnerisi({ 'd-euzu-besmele': d(1) }, B, {}).siradaki, 'd-kelime-i-tevhid');
  const hepsi = Object.fromEntries(m.KATALOG.ogeler.map((x) => [x.id, d(4)]));
  assert.equal(m.ogrenciOnerisi(hepsi, B, hedef).siradaki, null);
  assert.deepEqual(m.ogrenciOnerisi({ 'katalog-disi': d(1) }, B, {}).calisiyor, []);
});
