import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* Ekran ikinci el Android TV kutusunun WebView'ünde çalışır; hesapsız kurulan Android 9 kutusunda bu
   Chromium 70 civarında kalabilir (docs/EKRAN-YOL-HARITASI.md → riskler). esbuild sözdizimini indirir
   ama API'leri ve CSS özelliklerini indirmez: yasaklı olanlar paket çıktısında aranır. */
const kok = fileURLToPath(new URL('../', import.meta.url));
const oku = (p) => readFileSync(kok + p, 'utf8');
test.before(() => { execFileSync(process.execPath, ['scripts/ekran-derle.mjs'], { cwd: kok, stdio: 'pipe' }); });

const YASAK_JS = [
  /\?\.(?!\d)/, /\?\?/, /\.at\(/, /Object\.fromEntries/, /Object\.hasOwn/, /\.replaceAll\(/, /structuredClone/, /Promise\.allSettled/, /\.findLast(Index)?\(/, /\|\|=|&&=/,
  /globalThis/, // Chrome 71
  /queueMicrotask/, // Chrome 71
  /Intl\.(RelativeTimeFormat|ListFormat|Locale|DisplayNames|Segmenter)/, // Chrome 71–87
  /\.matchAll\(/, // Chrome 73
  /hourCycle/, // Chrome 73
  /dateStyle|timeStyle/, // Chrome 76
  /formatRange/, // Chrome 76
  /Promise\.(any|withResolvers)/, // Chrome 85 / 119
  /WeakRef|FinalizationRegistry|AggregateError/, // Chrome 84–85
  /\.replaceChildren\(/, // Chrome 86
  /AbortSignal\.(timeout|any)/, // Chrome 103 / 116
  /\.(toSorted|toReversed|toSpliced)\(/, // Chrome 110
  /(Object|Map)\.groupBy/, // Chrome 117
];
const YASAK_CSS = [
  /oklch\(/, /color-mix\(/, /\bclamp\(/, /(^|[^-\w])min\(/, /(^|[^-\w])max\(/, /:has\(/, /@layer/, /@container/, /\d(cqw|cqh|cqi|cqb|dvh|svh|lvh|dvw|svw|lvw)\b/, /(^|[;{\s])inset\s*:/, /aspect-ratio/, /(^|[;{\s])(row-|column-)?gap\s*:/, /&/,
  /:(is|where)\(/, // Chrome 88
  /:focus-visible/, // Chrome 86
  /(^|[;{\s])(translate|rotate|scale)\s*:/, // Chrome 104 (bağımsız transform özellikleri)
  /overflow(-x|-y)?\s*:\s*clip/, // Chrome 90
  /backdrop-filter/, // Chrome 76
  /@property/, // Chrome 85
  /content-visibility/, // Chrome 85
  /text-wrap\s*:/, // Chrome 114
  /(^|[;{\s])(margin|padding|inset|border)-(inline|block)\s*:/, // Chrome 87 (mantıksal kısaltmalar)
  /(^|[^-\w])(hwb|lab|lch|oklab|color)\(/, // Chrome 101–111
  /@media[^{]*[<>]/, // Chrome 104 (aralık sözdizimi)
];

for (const dosya of ['public/ekran/ekran.js', 'public/ekran/sw.js']) {
  test(`${dosya} Chromium 70 dışı sözdizimi ya da API içermez`, () => {
    const js = oku(dosya);
    for (const r of YASAK_JS) assert.doesNotMatch(js, r, `${dosya}: ${r}`);
  });
}

test('ekran.css yalnız Chromium 70 CSS özelliklerini kullanır; renk kimlik dosyasından gelir', () => {
  const css = oku('public/ekran/ekran.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const r of YASAK_CSS) assert.doesNotMatch(css, r, `ekran.css: ${r}`);
  assert.match(css, /--ana:#E30A17/i);
});

test('fontlar pakete kopyalanır', () => {
  for (const f of ['work-sans-latin.woff2', 'work-sans-latin-ext.woff2', 'amiri-arabic.woff2']) assert.ok(existsSync(kok + 'public/ekran/fonts/' + f), f);
});
