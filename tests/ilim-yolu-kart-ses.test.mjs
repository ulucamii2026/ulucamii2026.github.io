/**
 * İlim Yolu kart seslendirmesi (10 Kasım 2026): depodaki manifest ile `public/media/ses/kart/` dosyaları birbirini tutar (sha256, bayt, kimlik, dil),
 * adres kuralı tek yerden gelir, boş manifestte hiçbir kart için ses yoktur ve içe alma betiği bozuk kaynakta hiçbir şey yazmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { ice_al, kartKimlikleri } from '../scripts/kart-ses-al.mjs';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/kart-ses-test.mjs');
await build({ entryPoints: ['src/lib/ilim-yolu/kart-ses.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const lib = await import(pathToFileURL(cikti).href);

const sha = (b) => createHash('sha256').update(b).digest('hex');
const manifest = JSON.parse(readFileSync('src/data/ilim-yolu/kart-ses.json', 'utf8'));
const kartlar = kartKimlikleri();

test('manifest: biçim, taban ve her kayıt dosyayla tutar; klasörde manifestsiz dosya yok', () => {
  assert.equal(manifest.v, 1);
  assert.equal(manifest.taban, lib.KART_SES_TABANI ?? '/media/ses/kart');
  const klasor = join('public', ...manifest.taban.split('/').filter(Boolean));
  const beklenen = new Set();
  for (const [id, diller] of Object.entries(manifest.kartlar)) {
    assert.ok(kartlar.has(id), `${id}: kart yok`);
    for (const [dil, k] of Object.entries(diller)) {
      assert.ok(lib.KART_SES_DILLERI.includes(dil), `${id}/${dil}: dil`);
      const dosya = join(klasor, dil, `${id}.mp3`);
      assert.ok(existsSync(dosya), `${dosya} yok`);
      const b = readFileSync(dosya);
      assert.equal(b.length, k.bayt, `${dosya}: bayt`);
      assert.equal(sha(b), k.sha256, `${dosya}: sha256`);
      assert.ok(k.sn === null || k.sn > 0, `${dosya}: süre`);
      beklenen.add(`${dil}/${id}.mp3`);
    }
  }
  const var_ = [];
  for (const dil of lib.KART_SES_DILLERI) {
    const d = join(klasor, dil);
    if (existsSync(d)) for (const a of readdirSync(d)) var_.push(`${dil}/${a}`);
  }
  assert.deepEqual(var_.sort(), [...beklenen].sort(), 'klasördeki dosyalar manifestle aynı olmalı');
});

test('adres: yalnız manifestte olan kart ve dil için, tek tabandan; boş manifestte hiçbiri', () => {
  const m = { v: 1, taban: '/media/ses/kart', kartlar: { 'ib-013': { tr: { bayt: 1, sn: 1, sha256: 'x' } } } };
  assert.equal(lib.kartSesAdresi(m, 'tr', 'ib-013', 'https://ulucamii.be'), 'https://ulucamii.be/media/ses/kart/tr/ib-013.mp3');
  assert.equal(lib.kartSesAdresi(m, 'fr', 'ib-013'), null);
  assert.equal(lib.kartSesAdresi(m, 'en', 'ib-013'), null);
  assert.equal(lib.kartSesAdresi(m, 'tr', '../x'), null);
  for (const id of kartlar) for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
    const a = lib.kartSesAdresi(manifest, dil, id);
    assert.equal(a !== null, Boolean(manifest.kartlar[id]?.[dil]), `${id}/${dil}`);
  }
});

// ——— içe alma betiği: geçici klasörlerle ———
function hazirla() {
  const kok = mkdtempSync(join(tmpdir(), 'kart-ses-'));
  const kaynak = join(kok, 'kaynak');
  mkdirSync(join(kok, 'src/data/ilim-yolu'), { recursive: true });
  writeFileSync(join(kok, 'src/data/ilim-yolu/kart-ses.json'), JSON.stringify({ v: 1, taban: '/media/ses/kart', kartlar: {} }));
  for (const dil of ['tr', 'fr']) mkdirSync(join(kaynak, dil), { recursive: true });
  const bayt = (n) => Buffer.concat([Buffer.from([0x49, 0x44, 0x33, 4, 0]), Buffer.alloc(n, n)]);
  const kayitlar = [];
  for (const [id, dil, n] of [['ib-013', 'tr', 30], ['ib-013', 'fr', 40], ['it-001', 'tr', 50]]) {
    const b = bayt(n);
    writeFileSync(join(kaynak, dil, `${id}.mp3`), b);
    kayitlar.push({ id, lang: dil, file: `${dil}/${id}.mp3`, seconds: n / 10, bytes: b.length, sha256: sha(b) });
  }
  writeFileSync(join(kaynak, 'MANIFEST.json'), JSON.stringify(kayitlar));
  return { kok, kaynak, kayitlar };
}

test('içe alma: dosyalar kopyalanır, manifest sha256 ile yeniden üretilir, yeniden çalıştırınca değişmez', () => {
  const { kok, kaynak } = hazirla();
  try {
    const ids = new Set(['ib-013', 'it-001']);
    const kuru = ice_al({ kaynak, kok, kartlar: ids, kuru: true });
    assert.equal(kuru.toplam, 3);
    assert.equal(existsSync(join(kok, 'public/media/ses/kart/tr/ib-013.mp3')), false, 'kuru kipte yazma yok');
    const s = ice_al({ kaynak, kok, kartlar: ids });
    assert.equal(s.kopyalanan, 3);
    const yazilan = JSON.parse(readFileSync(join(kok, 'src/data/ilim-yolu/kart-ses.json'), 'utf8'));
    assert.deepEqual(Object.keys(yazilan.kartlar), ['ib-013', 'it-001']);
    assert.deepEqual(Object.keys(yazilan.kartlar['ib-013']), ['tr', 'fr']);
    assert.equal(yazilan.kartlar['it-001'].tr.sn, 5);
    assert.equal(ice_al({ kaynak, kok, kartlar: ids }).kopyalanan, 0);
    assert.deepEqual(JSON.parse(readFileSync(join(kok, 'src/data/ilim-yolu/kart-ses.json'), 'utf8')), yazilan);
  } finally { rmSync(kok, { recursive: true, force: true }); }
});

test('içe alma: bozuk kayıt (sha256, bilinmeyen kart, dil, MP3 değil) hiçbir şey yazmaz', () => {
  const { kok, kaynak, kayitlar } = hazirla();
  try {
    const ids = new Set(['ib-013', 'it-001']);
    const yaz = (k) => writeFileSync(join(kaynak, 'MANIFEST.json'), JSON.stringify(k));
    yaz([{ ...kayitlar[0], sha256: '0'.repeat(64) }, kayitlar[1]]);
    assert.throws(() => ice_al({ kaynak, kok, kartlar: ids }), /sha256 tutmuyor/);
    yaz([{ ...kayitlar[0], id: 'yok-001', file: 'tr/yok-001.mp3' }]);
    assert.throws(() => ice_al({ kaynak, kok, kartlar: ids }), /kart kimliği yok/);
    yaz([{ ...kayitlar[0], lang: 'en', file: 'en/ib-013.mp3' }]);
    assert.throws(() => ice_al({ kaynak, kok, kartlar: ids }), /dil tr\/fr değil/);
    writeFileSync(join(kaynak, 'tr/ib-013.mp3'), Buffer.from('metin dosyası'));
    yaz([{ ...kayitlar[0], bytes: 13, sha256: sha(Buffer.from('metin dosyası')) }]);
    assert.throws(() => ice_al({ kaynak, kok, kartlar: ids }), /MP3 değil/);
    assert.equal(existsSync(join(kok, 'public')), false, 'hata durumunda hiçbir dosya yazılmaz');
  } finally { rmSync(kok, { recursive: true, force: true }); }
});
