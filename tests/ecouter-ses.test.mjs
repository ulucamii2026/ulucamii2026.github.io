import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const veri = json('src/data/ecouter.json');
const kaynaklar = json('docs/dinleme-ses-kaynaklari.json');
const resmi = json('tests/fixtures/elifba-resmi-eslesmeler.json');
const hash = (path) => createHash('sha256').update(readFileSync(new URL('public' + path, root))).digest('hex');

test('112 harf/hareke kaydı resmî metin, kaynak ve ses özetiyle eşleşir', () => {
  assert.equal(Object.keys(resmi).length, 112);
  for (const [path, r] of Object.entries(resmi)) {
    assert.equal(kaynaklar[path].kaynak, r.kaynak, path);
    assert.equal(hash(path), r.sha256, path);
  }
  for (const kod of ['alphabet', 'fatha', 'kasra', 'damma']) {
    assert.equal(veri.kodlar[kod].ogeler.length, 28);
    for (const o of veri.kodlar[kod].ogeler) assert.equal(o.ar, resmi[o.ses].metin, o.ses);
  }
  // Önceki hata: üstün klasöründe harf adları; benzer görünen adlar testi kandıramaz.
  for (const o of veri.kodlar.fatha.ogeler) {
    assert.match(kaynaklar[o.ses].kaynak, /\/fetha\/fetha\/btn_\d+\.mp3$/);
    assert.notEqual(hash(o.ses), hash(o.ses.replace('/ustun/', '/')));
  }
});

test('Her ses dosyası vardır ve belgelenmiş kayıtların özeti değişmemiştir', () => {
  for (const ders of Object.values(veri.kodlar)) {
    for (const p of [ders.tam, ...(ders.ogeler ?? []), ...(ders.satirlar ?? [])].filter((p) => p?.ses)) {
      assert.ok(existsSync(new URL('public' + p.ses, root)), p.ses);
      if (p.ses.includes('/elifba/')) assert.ok(kaynaklar[p.ses], p.ses);
    }
  }
  for (const [path, r] of Object.entries(kaynaklar)) assert.equal(hash(path), r.sha256, path);
});

test('Kısa–uzun karşılaştırmasında tek kayıt tek düğmede iki heceyi gösterir', () => {
  const ogeler = veri.kodlar.e09.ogeler;
  assert.equal(ogeler.length, 28);
  for (const o of ogeler) assert.match(o.ar, / — /);
  assert.equal(new Set(ogeler.map((o) => kaynaklar[o.ses].kaynak)).size, 28);
});
