/**
 * Kur'an Okuma o8/o9 içe alma ve doğrulama (scripts/okuma-ses-ekle.mjs): kanonik karşılaştırma yalnız yazılış biçimini eler, gerçek farkı yakalar;
 * bekçi eksik, bozuk ve yetim dosyayı bildirir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { denetle, kanon } from '../scripts/okuma-ses-ekle.mjs';

test('kanon: yazılış biçimi farkları (hançer elif/elif, esre işareti, açık tenvin, şedde sırası) eşitlenir', () => {
  // Diyanet Elifbâ ↔ Ezber metni (sıkı)
  assert.equal(kanon('اَلَّذ۪ي', { siki: true }), kanon('اَلَّذٖی', { siki: true }));
  assert.equal(kanon('رَبِّ', { siki: true }), kanon('رَبِّ', { siki: true }));
  assert.equal(kanon('شَهٰدَةِ', { siki: true }), kanon('شَهَادَةِ', { siki: true }));
  // Diyanet ↔ tam Kur'an metni (gevşek): hançer elif, açık tenvin (U+0657), iklâb işareti
  assert.equal(kanon('هٰذِهِ'), kanon('هَٰذِهِ', { kuran: true }));
  assert.equal(kanon('مَثَلًا رَجُلَيْنِ'), kanon('مَّثَلࣰا رَّجُلَيْنِ', { kuran: true }));
});

test('kanon: gerçek farklar yakalanır (ünsüz, kısa hareke, şedde, sükûn)', () => {
  assert.notEqual(kanon('قُلْ اَعُوذُ'), kanon('قُلْ اَعُوذِ'), 'damma ↔ esre');
  assert.notEqual(kanon('قُلْ', { siki: true }), kanon('قُلَ', { siki: true }), 'sükûn/fetha (sıkı kip)');
  assert.notEqual(kanon('مَلِكِ'), kanon('مَلِكَ'), 'esre ↔ fetha');
  assert.notEqual(kanon('النَّاسِ', { siki: true }), kanon('النَاسِ', { siki: true }), 'şedde');
  assert.notEqual(kanon('الْحَمْدُ', { siki: true }), kanon('الْحَمَدُ', { siki: true }), 'sükûn ↔ fetha');
  assert.notEqual(kanon('كَبِيرٌ'), kanon('كَثِيرٌ'), 'ünsüz');
});

test('bekçi: eksik, bozuk ve yetim dosyayı bildirir; sağlam klasörde hata yok', () => {
  const kok = mkdtempSync(join(tmpdir(), 'okuma-ses-'));
  try {
    mkdirSync(join(kok, 'docs'), { recursive: true });
    mkdirSync(join(kok, 'src/data/okuma'), { recursive: true });
    const klasor = join(kok, 'egitim/public/media/ses/okuma/yeni/x');
    mkdirSync(klasor, { recursive: true });
    const veri = Buffer.from('ID3-deneme-verisi'.repeat(100));
    writeFileSync(join(klasor, '1.mp3'), veri);
    const k = { '/media/ses/okuma/yeni/x/1.mp3': { kaynak: 'https://kuran.diyanet.gov.tr/x', sha256: createHash('sha256').update(veri).digest('hex'), bayt: veri.length } };
    writeFileSync(join(kok, 'docs/okuma-ses-kaynaklari-egitim.json'), JSON.stringify(k));
    writeFileSync(join(kok, 'src/data/okuma/yeni.json'), JSON.stringify({ tecvid: [{ grup: 'g', ogeler: [{ ar: 'ا', ses: '/media/ses/okuma/yeni/x/1.mp3' }] }], ayetler: [] }));
    assert.deepEqual(denetle({ kok }), []);
    writeFileSync(join(klasor, '1.mp3'), Buffer.from('bozuk'));
    assert.match(denetle({ kok })[0], /bayt tutmuyor/);
    writeFileSync(join(klasor, '1.mp3'), Buffer.from('X'.repeat(veri.length)));
    assert.match(denetle({ kok })[0], /sha256 tutmuyor/);
    rmSync(join(klasor, '1.mp3'));
    assert.match(denetle({ kok })[0], /dosya yok/);
    writeFileSync(join(klasor, 'yetim.mp3'), veri);
    assert.ok(denetle({ kok }).some((h) => /yetim/.test(h)));
  } finally {
    rmSync(kok, { recursive: true, force: true });
  }
});

test('gerçek depo: künye, yeni.json ve doğrulama kaydı birbiriyle tutarlı (dosyalar yoksa bekçi ayrıca bildirir)', () => {
  const kunye = JSON.parse(readFileSync('docs/okuma-ses-kaynaklari-egitim.json', 'utf8'));
  const yeni = JSON.parse(readFileSync('src/data/okuma/yeni.json', 'utf8'));
  const sesler = [...yeni.tecvid, ...yeni.ayetler].flatMap((g) => g.ogeler.map((o) => o.ses));
  assert.equal(new Set(sesler).size, sesler.length, 'aynı ses iki maddede yok');
  assert.deepEqual([...sesler].sort(), Object.keys(kunye).sort());
});
