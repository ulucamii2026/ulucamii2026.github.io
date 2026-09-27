import test from 'node:test';
import assert from 'node:assert/strict';
import { tazele, vakitGecerli, akisGecerli, icerikGecerli } from '../src/ekran/veri.ts';

const VAKIT = { kaynakTuru: 'diyanet', ilce: '11890', gunler: [{ tarih: '2026-09-27' }] };
const AKIS = { duyurular: [], ayar: { slayt: { tabanSn: 8 } } };
const ICERIK = { ayetler: [], hadisler: [] };

test('Diyanet dışı ya da bozuk akış kabul edilmez', () => {
  assert.equal(vakitGecerli({ ...VAKIT, kaynakTuru: 'aladhan' }), false);
  assert.equal(vakitGecerli({ ...VAKIT, ilce: '9541' }), false);
  assert.equal(vakitGecerli({ ...VAKIT, gunler: [] }), false);
  assert.equal(vakitGecerli(VAKIT), true);
  assert.equal(akisGecerli({ duyurular: [] }), false);
  assert.equal(akisGecerli(AKIS), true);
  assert.equal(icerikGecerli(null), false);
  assert.equal(icerikGecerli(ICERIK), true);
});

test('ağ hatası, 500 ve bozuk JSON son sağlam veriyi silmez', async () => {
  const v = { vakit: VAKIT, akis: AKIS, icerik: ICERIK };
  const eski = globalThis.fetch;
  globalThis.fetch = async (yol) => {
    if (yol.endsWith('vakitler.json')) throw new TypeError('ağ yok');
    if (yol.endsWith('akis.json')) return new Response('sunucu hatası', { status: 500 });
    return new Response('{bozuk', { status: 200 });
  };
  try {
    await tazele(v);
    assert.deepEqual(v, { vakit: VAKIT, akis: AKIS, icerik: ICERIK });
  } finally {
    globalThis.fetch = eski;
  }
});

test('geçerli yanıt eski verinin yerine geçer', async () => {
  const v = { vakit: null, akis: null, icerik: null };
  const eski = globalThis.fetch;
  globalThis.fetch = async (yol) => Response.json(yol.endsWith('vakitler.json') ? VAKIT : yol.endsWith('akis.json') ? AKIS : ICERIK);
  try {
    await tazele(v);
    assert.deepEqual(v, { vakit: VAKIT, akis: AKIS, icerik: ICERIK });
  } finally {
    globalThis.fetch = eski;
  }
});
