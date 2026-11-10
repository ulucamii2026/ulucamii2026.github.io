/**
 * Bilgi Yarışması sayfa katmanı (10 Kasım 2026): arayüz metinleri beş dilde eksiksiz ve yer tutucuları tutarlı mı, oyun sayfasına giden
 * dil gövdesi hassas kutuları taşımıyor mu, betikler kural dışı bir şey yapıyor mu (depo, ağ, Firebase, satır içi stil, innerHTML).
 * «Hiçbir kişi verisi saklanmaz» kararı (imam, 10 Kasım 2026) burada kaynak taramasıyla sabitlenir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const modul = async (ad, giris) => {
  const cikti = resolve(`node_modules/.cache/yarisma-${ad}-test.mjs`);
  await build({ entryPoints: [giris], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
};
const i = await modul('i18n', 'egitim/src/i18n/yarisma.ts');
const v = await modul('veri-sayfa', 'src/lib/yarisma/veri.ts');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const yerTutucu = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort().join(',');
const KALP = /[❤♥❣\u{1F493}-\u{1F49F}\u{1F90D}\u{1F90E}\u{1F9E1}\u{1FA75}-\u{1FA77}]/u;

test('arayüz metinleri: her anahtar beş dilde dolu, yer tutucular dilden dile aynı, kalp simgesi yok', () => {
  const { H, BICIM, KONU, SEVIYE } = i.YARISMA_HAM;
  for (const tablo of [H, BICIM, KONU, SEVIYE]) {
    for (const [anahtar, b] of Object.entries(tablo)) {
      assert.equal(b.length, 5, `${anahtar}: beş dil`);
      const duzlestir = (x) => (Array.isArray(x) ? x : [x]);
      b.forEach((x, k) => {
        for (const s of duzlestir(x)) {
          assert.ok(typeof s === 'string' && s.trim(), `${anahtar}.${DILLER[k]} boş`);
          assert.doesNotMatch(s, KALP, `${anahtar}.${DILLER[k]} kalp simgesi`);
          assert.doesNotMatch(s, /undefined|\bnull\b/, `${anahtar}.${DILLER[k]}`);
        }
      });
      if (typeof b[0] === 'string') assert.equal(new Set(b.map(yerTutucu)).size, 1, `${anahtar}: yer tutucular dillerde aynı olmalı`);
      else assert.equal(new Set(b.map((x) => x.length)).size, 1, `${anahtar}: madde sayısı dillerde aynı olmalı`);
    }
  }
  assert.deepEqual(Object.keys(BICIM).sort(), ['eslestirme', 'gizemli', 'gruplama', 'karisik', 'quiz', 'siralama']);
  assert.deepEqual(Object.keys(KONU).sort(), ['ahlak', 'ibadet', 'itikat', 'kuran', 'siyer']);
  for (const d of DILLER) {
    const m = i.yarismaMetinleri(d);
    assert.ok(m.ad && m.bicim.quiz && m.konu.kuran && m.seviye['1-2'], d);
  }
});

test('metin kuralı: «skor», «sıralama tablosu», «kaybettiniz» ve «yanlış» yok; puan yalnız «ortak puan»', () => {
  const tr = JSON.stringify(i.yarismaMetinleri('tr'));
  assert.doesNotMatch(tr, /skor|kaybet|yanlış|liderlik/i);
  assert.match(i.yarismaMetinleri('tr').ortakPuan, /ortak puan/i);
  assert.match(i.yarismaMetinleri('fr').ortakPuan, /commun/i);
});

test('oyun sayfasına giden dil gövdesi: yalnız o dilin düz metni, hassas kutular yok', () => {
  for (const d of DILLER) {
    const l = v.yerellestir(d);
    assert.equal(l.length, v.SORULAR.length - v.HASSAS.size);
    for (const id of v.HASSAS) assert.equal(l.some((s) => s.id === id), false);
    const ham = JSON.stringify(l);
    assert.doesNotMatch(ham, /"(tr|fr|en|nl|de)":/, 'çok dilli nesne sızmamalı');
  }
  const q = v.yerellestir('fr').find((s) => s.format === 'quiz');
  assert.equal(typeof q.soru, 'string');
  assert.ok(Array.isArray(q.secenekler) && typeof q.secenekler[0] === 'string');
});

const DOSYALAR = ['egitim/src/scripts/yarisma.ts', 'egitim/src/scripts/yarisma-oyna.ts', 'src/lib/yarisma/tur.ts', 'src/lib/yarisma/puan.ts', 'src/lib/yarisma/yerlesim.ts', 'src/lib/yarisma/tipler.ts'];
const yorumsuz = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split(/\r?\n/).map((l) => l.replace(/(^|[^:'"`])\/\/.*$/, '$1')).join('\n');
const YASAK = [
  [/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie|\bcaches\.open\b/, 'tarayıcı deposu'],
  [/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|\bnew Image\b/, 'ağ isteği'],
  [/firebase|firestore|ibadet-ortak|hesap-ortak|oturum-ortak/i, 'Firebase / hesap'],
  [/\.innerHTML|outerHTML|insertAdjacentHTML|document\.write/, 'HTML enjeksiyonu'],
  [/\bstyle\s*=\s*["']|setAttribute\(\s*['"]style['"]|\.style\./, 'satır içi stil'],
  [/\beval\s*\(|new Function\s*\(/, 'dinamik kod'],
];
for (const dosya of DOSYALAR) {
  test(`${dosya}: depo, ağ, Firebase, satır içi stil ve HTML enjeksiyonu yok`, () => {
    const s = yorumsuz(readFileSync(dosya, 'utf8'));
    for (const [re, ad] of YASAK) assert.doesNotMatch(s, re, `${dosya}: ${ad}`);
  });
}

test('sayfalar: oturum kapalı (Firebase yok), oyun sayfası noindex, betikler yalnız yarisma + dil (+ çevrim dışı kutu)', () => {
  const hub = readFileSync('egitim/src/pages/[dil]/yarisma/index.astro', 'utf8');
  const oyna = readFileSync('egitim/src/pages/[dil]/yarisma/oyna/index.astro', 'utf8');
  for (const s of [hub, oyna]) assert.match(s, /oturum=\{false\}/);
  assert.match(oyna, /\bnoindex\b/);
  for (const s of [hub, oyna]) assert.doesNotMatch(s, /<script is:inline|style="|import .*(ibadet-ortak|firebase|hesap)/i);
});
