/**
 * src/i18n/hoca-metin/*.ts (hoca ekranı sözlükleri): beş dilin anahtar kümesi, değer türü, yer tutucuları ve işaretlemesi aynı olmalı;
 * hiçbir değer boş olmamalı; çevrilmiş (tr dışı) değerlerde HTML/varlık olmamalı (yalnız `Html` ile biten anahtarlar işaretleme taşır).
 * Tip düzeyinde eksik dil `astro check` hatasıdır; bu sınama çalışma zamanı eşitliğini ve içerik kurallarını da bağlar.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const KLASOR = 'src/i18n/hoca-metin';
mkdirSync('node_modules/.cache', { recursive: true });

const sozlukler = [];
for (const dosya of readdirSync(KLASOR).filter((d) => d.endsWith('.ts'))) {
  const outfile = resolve(`node_modules/.cache/hoca-metin-${dosya}.mjs`);
  await build({ entryPoints: [`${KLASOR}/${dosya}`], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  const mod = await import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
  for (const [ad, deger] of Object.entries(mod)) {
    if (deger && typeof deger === 'object' && DILLER.every((d) => d in deger)) sozlukler.push({ ad: `${dosya}:${ad}`, deger });
  }
}

const parcalar = (m) => (typeof m === 'string' ? [m] : [m.one, m.other].filter((x) => x !== undefined));
const yerTutucular = (m) => [...new Set(parcalar(m).flatMap((s) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1])))].sort();
const etiketler = (m) => parcalar(m).flatMap((s) => [...s.matchAll(/<\/?([a-z][a-z0-9]*)/gi)].map((x) => x[0].toLowerCase())).sort();

test('hoca-metin: en az bir sözlük bulunur ve çekirdek sözlüğü vardır', () => {
  assert.ok(sozlukler.length >= 1);
  assert.ok(sozlukler.some((s) => s.ad.startsWith('cekirdek.ts')));
});

for (const { ad, deger } of sozlukler) {
  test(`${ad}: beş dilde aynı anahtarlar`, () => {
    const tum = new Set(DILLER.flatMap((d) => Object.keys(deger[d])));
    const eksik = [];
    for (const d of DILLER) for (const k of tum) if (!(k in deger[d])) eksik.push(`${d}: ${k}`);
    assert.deepEqual(eksik, [], `eksik anahtarlar: ${eksik.join(', ')}`);
  });

  test(`${ad}: değerler boş değil; tür, yer tutucu ve işaretleme her dilde aynı`, () => {
    const kotu = [];
    for (const k of Object.keys(deger.tr)) {
      const trDeger = deger.tr[k];
      const trTur = typeof trDeger === 'string' ? 's' : 'c';
      for (const d of DILLER) {
        const m = deger[d][k];
        if (parcalar(m).some((s) => typeof s !== 'string' || s.trim() === '')) { kotu.push(`${d}: ${k} boş`); continue; }
        if ((typeof m === 'string' ? 's' : 'c') !== trTur) kotu.push(`${d}: ${k} tür farklı`);
        if (yerTutucular(m).join() !== yerTutucular(trDeger).join()) kotu.push(`${d}: ${k} yer tutucular farklı`);
        if (k.endsWith('Html')) { if (etiketler(m).join() !== etiketler(trDeger).join()) kotu.push(`${d}: ${k} etiketler farklı`); }
        else if (d !== 'tr' && /[<&]/.test(parcalar(m).join(' '))) kotu.push(`${d}: ${k} HTML/varlık içeriyor`);
      }
    }
    assert.deepEqual(kotu, [], kotu.join('\n'));
  });
}

for (const { ad, deger } of sozlukler) {
  test(`${ad}: Fransızca yazım kuralı (; ! ? : öncesi ve « » içi bölünmez boşluk, düz boşluk değil)`, () => {
    const kotu = [];
    for (const [k, m] of Object.entries(deger.fr)) {
      for (const s of parcalar(m)) if (/ [:;!?»]|« /.test(s)) kotu.push(`fr: ${k} → «${s}»`);
    }
    assert.deepEqual(kotu, [], 'düz boşluk yerine U+00A0 (: ve « ») ya da U+202F (; ! ?) kullanın:\n' + kotu.join('\n'));
  });
}
