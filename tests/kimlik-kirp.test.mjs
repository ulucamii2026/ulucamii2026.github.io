/** Kimlik kırpma geometrisi (src/scripts/kimlik-kirp.ts, 17 Eki 2026): izdüşüm, köşe arama, doğrultma.
 *  Görüntüler kurgusaldır (düz renkli örnek kart); gerçek kimlik verisi kullanılmaz. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { izdusum, izdusumNokta, koseleriBul, dogrultVeri, sirala, dondur, HEDEF } from '../src/scripts/kimlik-kirp.ts';

const uzak = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function icinde(q, x, y) {
  let ic = false;
  for (let i = 0, j = 3; i < 4; j = i++) {
    const [xi, yi] = q[i], [xj, yj] = q[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

/** Arka plan üzerinde, köşeleri kırpılmış (yuvarlak köşeyi andıran) dörtgen kart; kartın içinde koyu «yazı» blokları. */
function sahne(W, H, q, { zemin = [92, 70, 52], kart = [232, 226, 240], gurultu = 6 } = {}) {
  const data = new Uint8ClampedArray(W * H * 4);
  const k = izdusum(q);
  const pah = 0.035;
  let tohum = 7;
  const rnd = () => ((tohum = (tohum * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5) * 2 * gurultu;
  const bloklar = [[0.08, 0.25, 0.3, 0.8], [0.4, 0.3, 0.9, 0.38], [0.4, 0.5, 0.85, 0.56], [0.4, 0.68, 0.7, 0.74]]
    .map(([u0, v0, u1, v1]) => [izdusumNokta(k, u0, v0), izdusumNokta(k, u1, v0), izdusumNokta(k, u1, v1), izdusumNokta(k, u0, v1)]);
  const kose = [[pah, 0, 0, pah], [1 - pah, 0, 1, pah], [1, 1 - pah, 1 - pah, 1], [pah, 1, 0, 1 - pah]]
    .map(([u0, v0, u1, v1], i) => [izdusumNokta(k, u0, v0), q[i], izdusumNokta(k, u1, v1)]);
  const ucgenIci = ([a, b, c], x, y) => {
    const s = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
    const d1 = s([x, y], a, b), d2 = s([x, y], b, c), d3 = s([x, y], c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let renk = zemin;
    if (icinde(q, x + 0.5, y + 0.5) && !kose.some(t => ucgenIci(t, x + 0.5, y + 0.5))) {
      renk = bloklar.some(b => icinde(b, x + 0.5, y + 0.5)) ? [60, 60, 70] : kart;
    }
    const i = (y * W + x) * 4;
    for (let c = 0; c < 3; c++) data[i + c] = renk[c] + rnd();
    data[i + 3] = 255;
  }
  return { data, width: W, height: H };
}

test('izdüşüm birim karenin köşelerini dörtgenin köşelerine taşır', () => {
  for (const q of [[[0, 0], [100, 0], [100, 60], [0, 60]], [[12, 30], [410, 55], [380, 300], [30, 260]], [[5, 5], [205, 25], [215, 145], [15, 125]]]) {
    const k = izdusum(q);
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([u, v], i) => assert.ok(uzak(izdusumNokta(k, u, v), q[i]) < 1e-6));
  }
});

test('eğik ve perspektifli kartın köşeleri birkaç piksel içinde bulunur', () => {
  const durumlar = [
    [[70, 60], [410, 80], [395, 300], [55, 280]],          // hafif dönük
    [[120, 40], [420, 120], [360, 330], [60, 250]],        // belirgin dönük
    [[90, 70], [390, 60], [430, 290], [50, 300]],          // perspektif (yamuk)
  ];
  for (const q of durumlar) {
    const bulunan = koseleriBul(sahne(480, 360, q));
    assert.ok(bulunan, 'kart bulunmalı');
    bulunan.forEach((p, i) => assert.ok(uzak(p, q[i]) < 6, `köşe ${i}: ${p.map(Math.round)} ≠ ${q[i]}`));
  }
});

test('düz renkli ya da kartsız görüntüde köşe uydurulmaz', () => {
  assert.equal(koseleriBul(sahne(320, 240, [[0, 0], [0, 0], [0, 0], [0, 0]])), null);
  const zeminSiz = sahne(320, 240, [[-5, -5], [325, -5], [325, 245], [-5, 245]]);
  assert.equal(koseleriBul(zeminSiz), null, 'kart bütün kareyi kaplıyorsa elle yerleştirilir');
});

test('köşe sırası sol üstten saat yönündedir; dik duran kart yatırılır, döndür 90° çevirir', () => {
  const q = sirala([[300, 250], [20, 30], [310, 40], [10, 240]]);
  assert.deepEqual(q, [[20, 30], [310, 40], [300, 250], [10, 240]]);
  const dik = sirala([[100, 20], [200, 20], [200, 200], [100, 200]]);
  assert.ok(uzak(dik[0], dik[1]) > uzak(dik[0], dik[3]), 'uzun kenar üstte olmalı');
  assert.deepEqual(dondur(q), [[10, 240], [20, 30], [310, 40], [300, 250]]);
});

test('doğrultma kartı hedef ölçüde açar; arka plan sızmaz', () => {
  const q = [[90, 70], [390, 60], [430, 290], [50, 300]];
  const g = sahne(480, 360, q, { gurultu: 0 });
  const [W, H] = HEDEF.kimlik.map(x => Math.round(x / 4));
  const cikti = dogrultVeri(g, q, W, H);
  assert.equal(cikti.length, W * H * 4);
  const piksel = (x, y) => Array.from(cikti.slice((y * W + x) * 4, (y * W + x) * 4 + 3));
  for (const [x, y] of [[W - 8, 8], [W - 8, H - 8], [W / 2 | 0, 6]]) {
    assert.ok(piksel(x, y).every((c, i) => Math.abs(c - [232, 226, 240][i]) < 12), `kart rengi beklenir (${x},${y}): ${piksel(x, y)}`);
  }
  assert.ok(Math.abs(HEDEF.kimlik[0] / HEDEF.kimlik[1] - 85.6 / 54) < 0.002 && Math.abs(HEDEF.pasaport[0] / HEDEF.pasaport[1] - 125 / 88) < 0.002,
    'hedef ölçüler kimlik-sayfa.js oranlarıyla aynı olmalı');
});
