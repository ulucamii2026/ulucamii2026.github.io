// egitim CI dist kapısı: çökmüş/eksik derleme yayını durdurmalı (scripts/egitim-dist-denetle.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { denetle, say } from '../../scripts/egitim-dist-denetle.mjs';

function dist(dosyalar, ek = 0) {
  const d = mkdtempSync(join(tmpdir(), 'egitim-dist-'));
  for (const [y, icerik] of Object.entries(dosyalar)) { mkdirSync(dirname(join(d, y)), { recursive: true }); writeFileSync(join(d, y), icerik); }
  for (let i = 0; i < ek; i++) writeFileSync(join(d, `dolgu-${i}.txt`), 'x');
  return d;
}
const taban = { dosya: 100, zorunlu: ['index.html', 'tr/veli/index.html'] };
const iyi = { 'index.html': 'a', 'tr/veli/index.html': '<script id="veli-veri">' };

test('taban kadar dosya + zorunlular: tamam', () => {
  const d = dist(iyi, 98);
  assert.equal(say(d), 100);
  assert.deepEqual(denetle({ dist: d, taban }), []);
  rmSync(d, { recursive: true });
});

test('tam %95 sınırı geçer, bir eksiği düşer', () => {
  const d = dist(iyi, 93); // 95
  assert.deepEqual(denetle({ dist: d, taban }), []);
  rmSync(d, { recursive: true });
  const e = dist(iyi, 92); // 94
  assert.match(denetle({ dist: e, taban }).join('\n'), /dosya sayısı 94 < alt sınır 95/);
  rmSync(e, { recursive: true });
});

test('çok az dosya (çökmüş derleme) ve eksik zorunlu sayfa yakalanır', () => {
  const d = dist({ 'index.html': 'a' }, 3);
  const h = denetle({ dist: d, taban }).join('\n');
  assert.match(h, /dosya sayısı/);
  assert.match(h, /zorunlu dosya yok: tr\/veli\/index\.html/);
  rmSync(d, { recursive: true });
});

test('veli-veri bloğu olmayan veli sayfası ve olmayan klasör reddedilir', () => {
  const d = dist({ 'index.html': 'a', 'tr/veli/index.html': 'boş' }, 98);
  assert.match(denetle({ dist: d, taban }).join('\n'), /veli-veri bloğu yok/);
  rmSync(d, { recursive: true });
  assert.match(denetle({ dist: join(tmpdir(), 'olmayan-egitim-dist'), taban })[0], /yok/);
});
