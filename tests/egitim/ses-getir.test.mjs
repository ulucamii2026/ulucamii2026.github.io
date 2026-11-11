// egitim CI ses geri alma: eksik / bozuk / yetim durumları yayını durdurmalı (scripts/egitim-ses-getir.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getir, beklenenler } from '../../scripts/egitim-ses-getir.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const A = Buffer.from('ID3-ses-a');
const B = Buffer.from('ID3-ses-bb');

function sahteDepo() {
  const kok = mkdtempSync(join(tmpdir(), 'egitim-ses-'));
  mkdirSync(join(kok, 'src/data/ilim-yolu'), { recursive: true });
  mkdirSync(join(kok, 'docs'), { recursive: true });
  writeFileSync(join(kok, 'src/data/ilim-yolu/kart-ses.json'), JSON.stringify({ v: 1, taban: '/media/ses/kart', kartlar: { 'ah-001': { tr: { bayt: A.length, sn: 1, sha256: sha(A) } } } }));
  writeFileSync(join(kok, 'docs/okuma-ses-kaynaklari-egitim.json'), JSON.stringify({ '/media/ses/okuma/yeni/x/1.mp3': { kaynak: 'k', bayt: B.length, sha256: sha(B) } }));
  return kok;
}
const canli = (harita) => async (url) => {
  const v = harita[new URL(url).pathname];
  return v === undefined ? { ok: false, status: 404 } : { ok: true, status: 200, arrayBuffer: async () => v };
};
const hizli = { bekle: async () => {}, deneme: 2 };

test('manifest iki kaynaktan beklenen dosyaları çıkarır', () => {
  const kok = sahteDepo();
  assert.deepEqual(beklenenler(kok).map((g) => g.yol).sort(), ['/media/ses/kart/tr/ah-001.mp3', '/media/ses/okuma/yeni/x/1.mp3']);
  rmSync(kok, { recursive: true });
});

test('tam ve doğru ses: indirilir, önbellekteki ikinci koşuda yeniden indirilmez', async () => {
  const kok = sahteDepo();
  const hedef = join(kok, 'egitim/public');
  const f = canli({ '/media/ses/kart/tr/ah-001.mp3': A, '/media/ses/okuma/yeni/x/1.mp3': B });
  const s1 = await getir({ kok, hedef, getirFn: f, ...hizli });
  assert.equal(s1.hatalar.length, 0);
  assert.equal(s1.indirilen, 2);
  assert.deepEqual(readFileSync(join(hedef, 'media/ses/kart/tr/ah-001.mp3')), A);
  const s2 = await getir({ kok, hedef, getirFn: async () => { throw new Error('ağ kullanılmamalı'); }, ...hizli });
  assert.equal(s2.onbellekten, 2);
  assert.equal(s2.hatalar.length, 0);
  rmSync(kok, { recursive: true });
});

test('canlıda eksik dosya: hata verir, hedefe bir şey yazmaz', async () => {
  const kok = sahteDepo();
  const hedef = join(kok, 'egitim/public');
  const s = await getir({ kok, hedef, getirFn: canli({ '/media/ses/okuma/yeni/x/1.mp3': B }), ...hizli });
  assert.equal(s.hatalar.length, 1);
  assert.match(s.hatalar[0], /ah-001\.mp3: HTTP 404/);
  assert.equal(existsSync(join(hedef, 'media/ses/kart/tr/ah-001.mp3')), false);
  rmSync(kok, { recursive: true });
});

test('sha256 tutmayan dosya reddedilir ve diske yazılmaz', async () => {
  const kok = sahteDepo();
  const hedef = join(kok, 'egitim/public');
  const bozuk = Buffer.from('ID3-ses-X'); // aynı bayt, farklı içerik
  const s = await getir({ kok, hedef, getirFn: canli({ '/media/ses/kart/tr/ah-001.mp3': bozuk, '/media/ses/okuma/yeni/x/1.mp3': B }), ...hizli });
  assert.match(s.hatalar.join('\n'), /ah-001\.mp3: sha256 tutmuyor/);
  assert.equal(existsSync(join(hedef, 'media/ses/kart/tr/ah-001.mp3')), false);
  rmSync(kok, { recursive: true });
});

test('bayt sayısı tutmayan dosya reddedilir; önbellekteki bozuk dosya yeniden indirilip düzeltilir', async () => {
  const kok = sahteDepo();
  const hedef = join(kok, 'egitim/public');
  mkdirSync(join(hedef, 'media/ses/kart/tr'), { recursive: true });
  writeFileSync(join(hedef, 'media/ses/kart/tr/ah-001.mp3'), 'bozuk önbellek');
  const s1 = await getir({ kok, hedef, getirFn: canli({ '/media/ses/kart/tr/ah-001.mp3': Buffer.from('kısa'), '/media/ses/okuma/yeni/x/1.mp3': B }), ...hizli });
  assert.match(s1.hatalar.join('\n'), /bayt tutmuyor/);
  const s2 = await getir({ kok, hedef, getirFn: canli({ '/media/ses/kart/tr/ah-001.mp3': A, '/media/ses/okuma/yeni/x/1.mp3': B }), ...hizli });
  assert.equal(s2.hatalar.length, 0);
  assert.deepEqual(readFileSync(join(hedef, 'media/ses/kart/tr/ah-001.mp3')), A);
  rmSync(kok, { recursive: true });
});

test('geçici ağ hatası yeniden denenir', async () => {
  const kok = sahteDepo();
  const hedef = join(kok, 'egitim/public');
  let n = 0;
  const f = async (url) => {
    if (url.endsWith('ah-001.mp3') && n++ === 0) throw new Error('ECONNRESET');
    return canli({ '/media/ses/kart/tr/ah-001.mp3': A, '/media/ses/okuma/yeni/x/1.mp3': B })(url);
  };
  const s = await getir({ kok, hedef, getirFn: f, ...hizli });
  assert.equal(s.hatalar.length, 0);
  rmSync(kok, { recursive: true });
});

test('manifestte yol kaçışı reddedilir', () => {
  const kok = sahteDepo();
  writeFileSync(join(kok, 'docs/okuma-ses-kaynaklari-egitim.json'), JSON.stringify({ '/media/ses/okuma/../../x.mp3': { bayt: 1, sha256: sha(A) } }));
  assert.throws(() => beklenenler(kok), /geçersiz yol/);
  rmSync(kok, { recursive: true });
});
