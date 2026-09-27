/* Ezber Kilimi — telefonda bekleyen yazımların defteri (27 Eylül 2026, bağımsız inceleme D1). Önceki oturumda kuyruğa
   alınıp sonra sunucuda reddedilen yazım sessizce kaybolmamalı: açılışta olayı sunucuda olmayan kayıt hocaya söylenir.
   Modül: src/lib/ezber/bekleyen.ts · ekran: src/scripts/hoca-ezber.ts · belge: docs/EZBER-KILIMI.md. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-bekleyen-test.mjs');
await build({ entryPoints: ['src/lib/ezber/bekleyen.ts'], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const m = await import(pathToFileURL(outfile).href);

const depo = () => {
  const v = new Map();
  return { getItem: (k) => (v.has(k) ? v.get(k) : null), setItem: (k, x) => v.set(k, String(x)), ham: v };
};
const y = (olayId, ek = {}) => ({ ref: 'ogr-a', olayId, id: 's-fatiha', tur: 'dinleme', kalite: 'tam', zaman: 1000, ...ek });

test('Defter: ekle, aynı olayı yinelemez, çıkar; bozuk ya da okunamayan depo boş sayılır', () => {
  const d = depo();
  assert.deepEqual(m.bekleyenler(d), []);
  m.bekleyenEkle(d, y('o1'));
  m.bekleyenEkle(d, y('o2', { ref: 'ogr-b' }));
  m.bekleyenEkle(d, y('o1', { kalite: 'az' }));
  assert.deepEqual(m.bekleyenler(d).map((x) => [x.olayId, x.kalite]), [['o2', 'tam'], ['o1', 'az']]);
  m.bekleyenCikar(d, 'o2');
  m.bekleyenCikar(d, 'yok');
  assert.deepEqual(m.bekleyenler(d).map((x) => x.olayId), ['o1']);
  d.setItem(m.BEKLEYEN_ANAHTARI, '{bozuk');
  assert.deepEqual(m.bekleyenler(d), []);
  d.setItem(m.BEKLEYEN_ANAHTARI, JSON.stringify([y('o3'), { ref: 'x' }, null, y('o4', { olayId: 5 })]));
  assert.deepEqual(m.bekleyenler(d).map((x) => x.olayId), ['o3']);
  const kapali = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } };
  assert.deepEqual(m.bekleyenler(kapali), []);
  assert.doesNotThrow(() => m.bekleyenEkle(kapali, y('o5')));
  assert.deepEqual(m.bekleyenler(null), []);
});

test('Defter sınırı: en yeni kayıtlar kalır', () => {
  const d = depo();
  for (let i = 0; i < m.BEKLEYEN_SINIRI + 5; i++) m.bekleyenEkle(d, y(`o${i}`));
  const l = m.bekleyenler(d);
  assert.equal(l.length, m.BEKLEYEN_SINIRI);
  assert.equal(l.at(-1).olayId, `o${m.BEKLEYEN_SINIRI + 4}`);
});

test('Açılış denetimi: olayı sunucuda olan düşer, olmayan kayıp listesine geçer; ağ hatasında kayıt bekler; yeni kayıt beklenir', async () => {
  const d = depo();
  for (const x of [y('var', { zaman: 1 }), y('yok', { zaman: 2 }), y('ag', { zaman: 3 }), y('taze', { zaman: 99_000 })]) m.bekleyenEkle(d, x);
  const sorulan = [];
  const olayVar = async (x) => {
    sorulan.push(x.olayId);
    if (x.olayId === 'ag') throw Object.assign(new Error('offline'), { code: 'unavailable' });
    return x.olayId === 'var';
  };
  const kayip = await m.kayiplariBul(d, olayVar, { simdi: 100_000, bekleme: 60_000 });
  assert.deepEqual(sorulan, ['var', 'yok', 'ag']);                      // taze kayıt (başka sekmede gidiyor olabilir) sorulmaz
  assert.deepEqual(kayip.map((x) => x.olayId), ['yok']);
  assert.deepEqual(m.bekleyenler(d).map((x) => x.olayId), ['ag', 'taze']);
  assert.deepEqual(m.kayiplar(d).map((x) => x.olayId), ['yok']);
  // İkinci denetim aynı kaybı yinelemez; kapatınca liste boşalır.
  await m.kayiplariBul(d, async () => true, { simdi: 200_000, bekleme: 60_000 });
  assert.deepEqual(m.kayiplar(d).map((x) => x.olayId), ['yok']);
  assert.deepEqual(m.bekleyenler(d), []);
  m.kayiplariKapat(d);
  assert.deepEqual(m.kayiplar(d), []);
  // Yalnız açılışta defterde olanlar sorulur: bu oturumda eklenen (hâlâ gidiyor olabilir) sorulmaz.
  m.bekleyenEkle(d, y('eski', { zaman: 1 }));
  m.bekleyenEkle(d, y('bu-oturum', { zaman: 2 }));
  const sorulan2 = [];
  await m.kayiplariBul(d, async (x) => { sorulan2.push(x.olayId); return false; }, { simdi: 100_000, yalniz: new Set(['eski']) });
  assert.deepEqual([sorulan2, m.bekleyenler(d).map((x) => x.olayId), m.kayiplar(d).map((x) => x.olayId)], [['eski'], ['bu-oturum'], ['eski']]);
});
