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
  /\.(union|intersection|difference|symmetricDifference)\(/, // Chrome 122 (Set yöntemleri)
  /\.(values|keys|entries)\(\)\.(map|filter|take|drop|flatMap|reduce|toArray|forEach|some|every|find)\(/, // Chrome 122 (yineleyici yardımcıları)
  /Iterator\.from/, // Chrome 122
  /Array\.fromAsync/, // Chrome 121
  /URL\.canParse/, // Chrome 120
  /Response\.json\(/, // Chrome 105 (statik)
  /crypto\.randomUUID/, // Chrome 92
  /fractionalSecondDigits/, // Chrome 84 (Intl seçeneği)
  /dayPeriod/, // Chrome 92 (Intl seçeneği)
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
  /text-wrap\s*:(?!\s*balance\b)/, // Chrome 114. Yalnız balance serbest: satır SAYISINI değiştirmez (levha ölçümü bozulmaz), eski WebView yok sayar
  /(^|[;{\s])(margin|padding|inset|border)-(inline|block)\s*:/, // Chrome 87 (mantıksal kısaltmalar)
  /(^|[^-\w])(hwb|lab|lch|oklab|color)\(/, // Chrome 101–111
  /@media[^{]*[<>]/, // Chrome 104 (aralık sözdizimi)
  /:not\([^)]*,/, // Chrome 88 (:not içinde seçici listesi)
  /\dr?lh\b/, // Chrome 109 / 111 (lh, rlh birimleri)
  /@scope/, // Chrome 118
  /@starting-style/, // Chrome 117
];

/* Kalıpların kendisi de sınanır: yazım hatalı bir kalıp hiçbir şeyi yakalamaz ve tarama sessizce boşa çıkardı.
   Her örnek, yasaklı listede en az bir kalıba takılmalı. */
test('yasaklı kalıplar örnek kodu gerçekten yakalar', () => {
  const jsOrnekleri = ['a.union(b)', 's.symmetricDifference(t)', 'm.values().map(f)', 'Iterator.from(x)', 'Array.fromAsync(x)', 'URL.canParse(u)', 'Response.json(v)', 'crypto.randomUUID()', '{fractionalSecondDigits:2}', '{dayPeriod:"short"}'];
  for (const o of jsOrnekleri) assert.ok(YASAK_JS.some((r) => r.test(o)), `JS kalıbı yakalamadı: ${o}`);
  const cssOrnekleri = ['a:not(.b, .c){}', '.a{margin-top:1lh}', '.a{height:2rlh}', '@scope (.a){}', '@starting-style{.a{opacity:0}}', '.a{text-wrap:pretty}', '.a{text-wrap: wrap}'];
  for (const o of cssOrnekleri) assert.ok(YASAK_CSS.some((r) => r.test(o)), `CSS kalıbı yakalamadı: ${o}`);
  // Chromium 70'te olan biçimler yakalanmamalı (yanlış alarm yok).
  for (const o of ['a:not(.b){}', '.a{line-height:1.3}', 'yanit.json()', 'Object.entries(x).map(f)', '.a{text-wrap:balance}', '.a{text-wrap: balance}']) {
    assert.ok(!YASAK_CSS.concat(YASAK_JS).some((r) => r.test(o)), `yanlış alarm: ${o}`);
  }
});

/* Yayımlanan dist/ekran/sw.js derleme sonunda içerik damgasıyla ayrıca derlenir (scripts/ekran-damga.mjs); aynı
   ayarlarla ama ayrı bir yoldan geldiği için o da taranır (yalnız `npm run build` sonrasında vardır). */
for (const dosya of ['public/ekran/ekran.js', 'public/ekran/sw.js', 'dist/ekran/sw.js']) {
  const yok = dosya.startsWith('dist/') && !existsSync(kok + dosya);
  test(`${dosya} Chromium 70 dışı sözdizimi ya da API içermez`, { skip: yok && `${dosya} yok — önce \`npm run build\`; tarama atlandı` }, () => {
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

/* Derlenmiş sayfa (dist/) yalnız `npm run build` sonrasında vardır; yayın hattında bu test derlemeden sonra koşar.
   Sayfa yalnız /ekran/ekran.js'i klasik betik olarak yükler. Astro'nun eklediği modül betikleri (adacık, görünüm
   geçişi…) Vite ile yeni tarayıcı hedefine derlenir: esbuild'in chrome70 indirmesinden de bu taramadan da geçmez. */
const SAYFA = kok + 'dist/ekran/index.html';
test('dist/ekran/index.html modül betiği içermez', { skip: !existsSync(SAYFA) && 'dist/ekran/index.html yok — önce `npm run build`; denetim atlandı' }, () => {
  assert.doesNotMatch(readFileSync(SAYFA, 'utf8'), /<script\b[^>]*\btype\s*=\s*["']?module/i);
});
