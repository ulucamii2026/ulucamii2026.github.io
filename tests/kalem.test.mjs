/** Belge doldurma kalemi (public/admin/kalem.js): Python kalem.py ile aynı titreşim için aynı rastgele dizi.
 *  17 Eki 2026: SHA-512 ve random.seed tohumlaması BigInt'siz yazıldı (Apps Script kayıtta «0n» değişmezini reddediyor). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PyRandom, sha512 } from '../public/admin/kalem.js';

test('SHA-512, Node crypto ile 0–300 baytın her uzunluğunda (blok sınırları dâhil) aynı', () => {
  for (let n = 0; n <= 300; n++) {
    const b = Uint8Array.from({ length: n }, (_, i) => (i * 131 + n * 7) & 255);
    assert.equal(Buffer.from(sha512(b)).toString('hex'), createHash('sha512').update(b).digest('hex'), n + ' bayt');
  }
});

test('PyRandom, Python random.Random(metin) ile aynı diziyi verir', () => {
  // Değerler Python 3.14 ile üretildi: r = random.Random(s); [r.random(), r.uniform(-0.45, 0.35), r.uniform(0.6, 2), r.random()]
  const python = [
    ['Jean DUPONT', [0.6644640066285796, -0.39549203039493763, 0.9500955570127654, 0.010770025779791359]],
    ['Şükrü Ağaoğlu', [0.2797891914539389, -0.31333069888030796, 1.4610566484779377, 0.19372690864021702]],
    ['', [0.9602256525641875, 0.026329566281359185, 1.1432164014137562, 0.7335810344878906]],
    ['é'.repeat(70), [0.44973719316880967, -0.2764836316924528, 0.656550247208856, 0.810568659117299]],
    ['Kiril Ж 漢字 😀', [0.8622642810152668, 0.0861740585669793, 1.6663306871931782, 0.8162902318721866]],
  ];
  for (const [metin, beklenen] of python) {
    const r = new PyRandom(metin);
    assert.deepEqual([r.random(), r.uniform(-0.45, 0.35), r.uniform(0.6, 2), r.random()], beklenen, JSON.stringify(metin));
  }
});
