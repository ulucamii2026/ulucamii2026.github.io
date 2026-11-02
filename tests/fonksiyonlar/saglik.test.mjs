// Dilim 0: işlev emülatörü yükleniyor ve yer tutucu `saglik` işlevi yanıt veriyor.
import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hazir } from './yardimci.mjs';

const surum = JSON.parse(readFileSync(new URL('../../functions/package.json', import.meta.url), 'utf8')).version;
const ADRES = 'http://127.0.0.1:5185/demo-ulucamii/europe-west1/saglik';
// İşlev emülatörü tanımları yükleyene dek 404 döner (2 Kas 2026'da bir kez görüldü): önce yüklenmesini bekle.
before(() => hazir(['saglik']));

test('saglik: 200, JSON {ok:true, surum}, önbellek yok', async () => {
  const yanit = await fetch(ADRES);
  assert.equal(yanit.status, 200);
  assert.match(yanit.headers.get('content-type'), /application\/json/);
  assert.equal(yanit.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await yanit.json(), { ok: true, surum });
});
