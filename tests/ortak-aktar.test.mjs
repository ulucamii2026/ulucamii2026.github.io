/**
 * İlim Yolu Dilim 3 — paylaşılan modülün ihtida platformuna aktarımı (scripts/ortak-aktar.mjs): liste yoksa durur, eşleşmede
 * durur ve terimi yazmaz, temiz kaynağı özetleriyle kopyalar, eski kopyayı boşaltır. Gerçek terim listesi burada YOK (yerel dosya).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aktar } from '../scripts/ortak-aktar.mjs';

function kur(kaynakDosyalari, liste = 'yasakkelime\n# yorum\n') {
  const kok = mkdtempSync(join(tmpdir(), 'ortak-aktar-'));
  const kaynak = join(kok, 'kaynak');
  const hedef = join(kok, 'hedef');
  for (const [ad, metin] of Object.entries(kaynakDosyalari)) {
    mkdirSync(join(kaynak, ad, '..'), { recursive: true });
    writeFileSync(join(kaynak, ad), metin);
  }
  mkdirSync(join(hedef, '.yerel'), { recursive: true });
  if (liste !== null) writeFileSync(join(hedef, '.yerel', 'yasak-terimler.txt'), liste);
  return { kok, kaynak, hedef, varis: join(hedef, 'src', 'ortak', 'ogrenme-yolu') };
}

test('liste yoksa aktarım yapılmaz (kapalı başarısızlık)', (t) => {
  const k = kur({ 'icerik.json': '{}' }, null);
  t.after(() => rmSync(k.kok, { recursive: true, force: true }));
  assert.deepEqual(aktar(k), { ok: false, neden: 'liste-yok' });
  assert.equal(existsSync(k.varis), false);
});

test('yasak terim, kurum adı, telefon ve e-posta durdurur; bulgu terimi değil yeri yazar', (t) => {
  const k = kur({ 'a.json': '{"x":"bir YasakKelime var"}\n', 'alt/b.ts': 'ok\n// Ulu  Camii\n', 'c.json': '"+32 400 00 00 00"\n', 'd.json': '"x@ornek.test"\n' });
  t.after(() => rmSync(k.kok, { recursive: true, force: true }));
  const s = aktar(k);
  assert.equal(s.ok, false);
  assert.equal(s.neden, 'tarama');
  assert.deepEqual(s.bulgular.sort(), ['a.json:1 (yasak terim)', 'alt/b.ts:2 (kurum adı)', 'c.json:1 (telefon)', 'd.json:1 (e-posta)'].map((x) => x.replace('/', process.platform === 'win32' ? '\\' : '/')).sort());
  assert.ok(!s.bulgular.join(' ').toLowerCase().includes('yasakkelime'));
  assert.equal(existsSync(k.varis), false);
});

test('adres içindeki sayı dizisi telefon sayılmaz; adresteki yasak terim yine yakalanır', (t) => {
  const k = kur({ 'a.json': '"https://ornek.test/tefsir/3483/14-15-ayet"\n', 'b.json': '"https://ornek.test/yasakkelime/1"\n' });
  t.after(() => rmSync(k.kok, { recursive: true, force: true }));
  assert.deepEqual(aktar(k).bulgular, ['b.json:1 (yasak terim)']);
});

test('temiz kaynak kopyalanır, SURUM.json özetleri doğru, eski kopya boşaltılır; prova yazmaz', (t) => {
  const k = kur({ 'icerik.json': '{"surum":1}\n', 'alt/tipler.ts': 'export type A = 1;\n' });
  t.after(() => rmSync(k.kok, { recursive: true, force: true }));
  assert.equal(aktar({ ...k, prova: true }).ok, true);
  assert.equal(existsSync(k.varis), false);
  mkdirSync(k.varis, { recursive: true });
  writeFileSync(join(k.varis, 'eski.json'), 'eski');
  const s = aktar({ ...k, commit: 'abc123' });
  assert.equal(s.ok, true);
  assert.equal(s.dosyaSayisi, 2);
  assert.equal(existsSync(join(k.varis, 'eski.json')), false);
  const surum = JSON.parse(readFileSync(join(k.varis, 'SURUM.json'), 'utf8'));
  const ozet = (m) => createHash('sha256').update(m).digest('hex');
  assert.deepEqual(surum, { kaynakCommit: 'abc123', dosyalar: { 'alt/tipler.ts': ozet('export type A = 1;\n'), 'icerik.json': ozet('{"surum":1}\n') } });
  assert.equal(readFileSync(join(k.varis, 'alt', 'tipler.ts'), 'utf8'), 'export type A = 1;\n');
});
