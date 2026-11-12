/**
 * src/i18n/veli.ts: beş dilin anahtar kümesi aynı olmalı, hiçbir değer boş olmamalı
 * (eksik anahtar arayüzde «undefined» olarak görünüyordu: fr sonrakiSoru / testiYenidenBaslat).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/veli-metin-esitlik-test.mjs');
await build({ entryPoints: ['src/i18n/veli.ts'], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const { VELI_METIN } = await import(pathToFileURL(outfile).href);

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];

function yapraklar(nesne, onek = '', cikti = new Map()) {
  for (const [k, v] of Object.entries(nesne)) {
    const yol = onek ? `${onek}.${k}` : k;
    if (v && typeof v === 'object') yapraklar(v, yol, cikti);
    else cikti.set(yol, v);
  }
  return cikti;
}

test('veli.ts: beş dil var ve her dilde aynı anahtarlar bulunur', () => {
  assert.deepEqual(Object.keys(VELI_METIN).sort(), [...DILLER].sort());
  const tum = new Set();
  const dilYapraklari = {};
  for (const d of DILLER) { dilYapraklari[d] = yapraklar(VELI_METIN[d]); for (const k of dilYapraklari[d].keys()) tum.add(k); }
  const eksik = [];
  for (const d of DILLER) for (const k of tum) if (!dilYapraklari[d].has(k)) eksik.push(`${d}: ${k}`);
  assert.deepEqual(eksik, [], `eksik anahtarlar: ${eksik.join(', ')}`);
});

test('veli.ts: hiçbir dilde boş veya metin olmayan değer yok', () => {
  const kotu = [];
  for (const d of DILLER) for (const [k, v] of yapraklar(VELI_METIN[d])) {
    if (typeof v !== 'string' || v.trim() === '') kotu.push(`${d}: ${k}`);
  }
  assert.deepEqual(kotu, [], `boş değerler: ${kotu.join(', ')}`);
});
