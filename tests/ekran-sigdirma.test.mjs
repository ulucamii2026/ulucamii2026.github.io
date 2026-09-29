import test from 'node:test';
import assert from 'node:assert/strict';
import { olcekBul } from '../src/lib/ekran/sigdirma.ts';

/** Eşik e: e ve altındaki her ölçek sığar (tekdüze kutu). */
const esik = (e) => (s) => s <= e + 1e-9;

test('en büyük ölçekte sığıyorsa hemen o döner, tek ölçüm', () => {
  const r = olcekBul(esik(5), 1, 1.9);
  assert.deepEqual(r, { olcek: 1.9, sigdi: true, olcumSayisi: 1 });
});

test('tabanda bile sığmıyorsa sigdi=false ve ölçek taban (1 altına inmez)', () => {
  const r = olcekBul(esik(0.8), 1, 1.9);
  assert.equal(r.sigdi, false);
  assert.equal(r.olcek, 1);
  assert.equal(r.olcumSayisi, 2);
});

test('aradaki eşiği 0,02 hassasiyetle ve eşiği aşmadan bulur, en çok 8 ölçüm', () => {
  for (const e of [1, 1.013, 1.37, 1.5, 1.899]) {
    const r = olcekBul(esik(e), 1, 1.9);
    assert.equal(r.sigdi, true);
    assert.ok(r.olcek <= e + 1e-9, `ölçek ${r.olcek} eşiği ${e} aşmamalı`);
    assert.ok(e - r.olcek < 0.02 || r.olcumSayisi === 8, `ölçek ${r.olcek} eşiğe ${e} yakın olmalı`);
    assert.ok(r.olcumSayisi <= 8);
  }
});

test('tekdüze olmayan kutuda (satır kırılımı) dönen ölçek her zaman doğrulanmış bir sığan değerdir', () => {
  const sigan = new Set();
  const garip = (s) => { const ok = s < 1.2 || (s > 1.5 && s < 1.55); if (ok) sigan.add(s); return ok; };
  const r = olcekBul(garip, 1, 1.9);
  assert.equal(r.sigdi, true);
  assert.ok(r.olcek === 1 || sigan.has(r.olcek), 'dönen ölçek ölçülmüş ve sığmış olmalı');
});

test('enCok enAz\'dan küçükse enAz\'da tek ölçüm yapılır', () => {
  const r = olcekBul(esik(5), 1, 0.5);
  assert.deepEqual(r, { olcek: 1, sigdi: true, olcumSayisi: 1 });
});
