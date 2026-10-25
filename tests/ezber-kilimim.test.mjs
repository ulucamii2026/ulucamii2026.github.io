/**
 * Kilimim · kendi çalışmam (25 Ekim 2026) — cihaz verisinden kendi dokusuna eşleme (src/lib/ezber/kilimim.ts) ve kilim çiziciyin `kendi` kipi.
 * Bağlayıcı ayrım: cihaz verisi hocanın basamağına çevrilmez; kendi kipinde rozet, mühür, altın kenar ve basamak adı çıkmaz; metinlerde
 * hocanın basamak adları yoktur; sayfa betiği cihaz hafızasına yazmaz ve ağa çıkmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { optimize } from 'svgo';

mkdirSync('node_modules/.cache', { recursive: true });
const alias = { '@ortak': resolve('src') };
const cikti = resolve('node_modules/.cache/ezber-kilimim-test.mjs');
await build({
  stdin: {
    contents: ['kilimim', 'kilim', 'cihaz', 'katalog', 'metinler', 'durum'].map((m) => `export * from "./src/lib/ezber/${m}.ts";`).join('\n'),
    resolveDir: process.cwd(),
  },
  outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(cikti).href);
const metinDosyasi = resolve('node_modules/.cache/egitim-kilimim-metin-test.mjs');
await build({ entryPoints: ['egitim/src/i18n/kilimim.ts'], outfile: metinDosyasi, bundle: true, platform: 'node', format: 'esm', alias, logLevel: 'silent' });
const k = await import(pathToFileURL(metinDosyasi).href);
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];

const an = (y, a, g, s = 10) => new Date(y, a - 1, g, s, 0, 0).getTime();
const durum = (maddeler, gunler = []) => m.temizle({ v: 1, ar: 1, gunler, maddeler });
const SIRA = m.KATALOG.ogeler.filter(m.calismaSayfasiVar).map((o) => o.id);

test('kendiDoku: kayıt yok 0 · kayıt var ama sınanmadı 1 · kutu 0…3 → 2 · kutu 4 → 3; geçerli son çalışma anı şart', () => {
  assert.equal(m.kendiDoku(undefined), 0);
  assert.equal(m.kendiDoku({ son: 0, kutu: 3 }), 0, 'son çalışma anı olmayan kayıt çalışılmış sayılmaz');
  assert.equal(m.kendiDoku({ son: 1, kutu: -1 }), 1);
  assert.deepEqual([0, 1, 2, 3].map((kutu) => m.kendiDoku({ son: 1, kutu })), [2, 2, 2, 2]);
  assert.equal(m.kendiDoku({ son: 1, kutu: 4 }), 3);
  assert.equal(m.kendiDoku({ son: 1, kutu: Number.NaN }), 1);
  assert.equal(m.KENDI_BASAMAK, 5);
});

test('kendiMaddeler: katalog sırası, yerel gün, basamak «n / 5»; listede olmayan kayıt girmez', () => {
  const d = durum({
    's-ihlas': { kip: 'sina', kutu: 1, sonraki: '2026-10-28', son: an(2026, 10, 24, 23) },
    's-fatiha': { kip: 'zincir', son: an(2026, 10, 20, 0) },
    's-nas': { kip: 'sina', kutu: 4, sonraki: '2026-11-24', son: an(2026, 10, 25) },
    'x-yok': { kip: 'sina', kutu: 2, son: an(2026, 10, 25) },
  });
  const s = m.kendiMaddeler(d, ['s-fatiha', 's-ihlas', 's-nas', 's-felak']);
  assert.deepEqual(s.map((x) => x.id), ['s-fatiha', 's-ihlas', 's-nas', 's-felak']);
  assert.deepEqual(s.map((x) => [x.doku, x.son, x.basamak]), [[1, '2026-10-20', 0], [2, '2026-10-24', 2], [3, '2026-10-25', 5], [0, '', 0]]);
});

test('kendiOzeti: başlanan, takvimde, son basamakta ve son üç haftadaki gün sayısı', () => {
  const d = durum({
    's-ihlas': { kip: 'sina', kutu: 1, son: an(2026, 10, 24) }, 's-fatiha': { kip: 'zincir', son: an(2026, 10, 20) },
    's-nas': { kip: 'sina', kutu: 4, son: an(2026, 10, 25) }, 's-felak': { kip: 'sina', kutu: 0, son: an(2026, 10, 25) },
  }, ['2026-10-04', '2026-10-24', '2026-10-25']);
  const o = m.kendiOzeti(m.kendiMaddeler(d, SIRA), d.gunler, '2026-10-25');
  assert.deepEqual({ ...o }, { toplam: SIRA.length, basladi: 4, takvimde: 3, sonBasamakta: 1, gun: 2 });
  assert.deepEqual({ ...m.kendiOzeti(m.kendiMaddeler(m.bos(), SIRA), [], '2026-10-25') }, { toplam: SIRA.length, basladi: 0, takvimde: 0, sonBasamakta: 0, gun: 0 });
});

test('Eşleme saftır: durum nesnesini değiştirmez', () => {
  const d = durum({ 's-ihlas': { kip: 'sina', kutu: 1, son: an(2026, 10, 24) } });
  const once = JSON.stringify(d);
  m.kendiOzeti(m.kendiMaddeler(d, SIRA), d.gunler, '2026-10-25');
  assert.equal(JSON.stringify(d), once);
});

const secenek = (ek = {}) => ({
  onek: 'kl-kendi', dil: 'tr', baslik: 'Kilimim',
  kendi: { etiket: (id, ad, d) => `${ad}, doku ${d}`, ozet: 'özet satırı', ...ek },
});

test('Kendi kipi: geçerli SVG, 81 madde bir kez, ödül yuvası/altın kenar/basamak yok, kimlikler önekli, kilim hocanın verisini okumaz', () => {
  const svg = m.kilimSvg({}, secenek());
  assert.doesNotThrow(() => optimize(svg), 'XML ayrıştırılamadı');
  assert.match(svg, /^<svg class="ezber-kilim kl-kendi" /);
  const ogeler = [...svg.matchAll(/<g class="kl-oge" data-id="([^"]+)" data-doku="(\d)">/g)];
  assert.equal(ogeler.length, m.KATALOG.ogeler.length);
  assert.deepEqual(ogeler.map((x) => x[1]).sort(), m.KATALOG.ogeler.map((o) => o.id).sort());
  assert.ok(ogeler.every((x) => x[2] === '0'));
  assert.doesNotMatch(svg, /kl-odul|kazanildi|data-rozet|data-muhur|data-altin|kl-altin|kl-b\d|kl-b4-cerceve|data-basamak|-m-rozet|-m-muhur/);
  assert.match(svg, /<desc id="kl-kendi-a">özet satırı<\/desc>/);
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
  assert.equal(new Set(ids).size, ids.length, 'kimlik tekrarı');
  assert.ok(ids.filter((id) => !id.startsWith('kl-tarama-')).every((id) => id.startsWith('kl-kendi-')), 'öneksiz kimlik');
  assert.ok(ids.includes('kl-tarama-1') && ids.includes('kl-tarama-2'));
  for (const [, hedef] of svg.matchAll(/href="([^"#][^"]*)"/g)) assert.fail(`dış bağlantı: ${hedef}`);
  assert.doesNotMatch(svg, /<script|<style|<image|<text|\son\w+=|javascript:|data:/i);
  // Hocanın durumu verilse bile kendi kipi onu çizmez (aynı çıktı).
  const hoca = Object.fromEntries(m.KATALOG.ogeler.map((o) => [o.id, { basamak: 4, kalite: 'tam', notlar: [], sonrakiKontrol: '', surum: 1 }]));
  assert.equal(m.kilimSvg(hoca, secenek()), svg);
});

test('Kendi kipi: doku işlevi hücreye yansır; başlık «ad, kendi durumu»; yönlendirme (data-href) yalnız çalışma sayfası olana, gerçek <a> yok', () => {
  const dokular = { 's-fatiha': 1, 's-ihlas': 2, 's-nas': 3 };
  const svg = m.kilimSvg({}, secenek({ doku: (id) => dokular[id] ?? 0, baglanti: (id) => (SIRA.includes(id) ? `/tr/calis/${id}/` : null) }));
  for (const [id, d] of Object.entries(dokular)) {
    assert.match(svg, new RegExp(`<g class="kl-oge" data-id="${id}" data-doku="${d}" data-href="[^"]+"><title>[^<]+, doku ${d}</title><rect class="kl-hedef" [^>]*/><use [^>]*class="kl-m kl-k${d}"/></g>`));
  }
  const baglar = [...svg.matchAll(/data-href="([^"]+)"/g)];
  assert.equal(baglar.length, SIRA.length);
  assert.ok(baglar.every((x) => /^\/tr\/calis\/[a-z0-9-]+\/$/.test(x[1])));
  const sayfasiz = m.KATALOG.ogeler.find((o) => !SIRA.includes(o.id));
  assert.ok(sayfasiz, 'çalışma sayfası olmayan madde beklenir');
  assert.match(svg, new RegExp(`<g class="kl-oge" data-id="${sayfasiz.id}" data-doku="0"><title>`));
  assert.doesNotMatch(svg, /<a[\s>]|\shref="\/|tabindex/, 'SVG içinde odaklanabilir öğe olmamalı');
  assert.doesNotThrow(() => optimize(svg));
});

test('Varsayılan (hoca) kipi değişmedi: aynı sınıf, ödül yuvaları ve basamak öznitelikleri duruyor', () => {
  const svg = m.kilimSvg({}, { onek: 'kl-bos', dil: 'tr', baslik: 'Kilim' });
  assert.match(svg, /^<svg class="ezber-kilim" /);
  assert.equal((svg.match(/class="kl-odul kl-rozet"/g) || []).length, 12);
  assert.match(svg, /data-basamak="0"/);
  assert.doesNotMatch(svg, /kl-tarama|kl-k\d|data-doku/);
});

test('Kendi lejantı: dört doku, çağıranın metniyle; rozet/mühür/altın ve hocanın basamak adı yok; kilimin sembollerine bağlı', () => {
  const html = m.kendiLejanti(secenek(), ['A', 'B', 'C', 'D']);
  assert.equal((html.match(/<li data-doku="/g) || []).length, 4);
  assert.deepEqual([...html.matchAll(/<span>([^<]+)<\/span>/g)].map((x) => x[1]), ['A', 'B', 'C', 'D']);
  assert.deepEqual([...html.matchAll(/class="kl-m kl-k(\d)"/g)].map((x) => Number(x[1])), [0, 1, 2, 3]);
  assert.ok([...html.matchAll(/href="#([^"]+)"/g)].every((x) => x[1].startsWith('kl-kendi-m-')));
  assert.doesNotMatch(html, /rozet|muhur|altin|kazanildi|kl-b\d/);
});

test('Metinler: beş dil tam; hocanın basamak adları, rozet, mühür ve sertifika geçmez; zorunlu cümle ve «{b}» yer tutucusu var', () => {
  const yasak = {
    tr: /Çalışıyor|Hocaya okudu|Pekişti|Kalıcı|rozet|mühür|sertifika/i,
    fr: /En apprentissage|Récité à l’enseignant|Consolidé|Acquis durablement|insigne|sceau|certificat/i,
    en: /Recited to the teacher|Consolidated|Firmly memorised|badge|seal|certificate/i,
    nl: /Opgezegd bij de leraar|Verstevigd|Blijvend gekend|insigne|zegel|certificaat/i,
    de: /Beim Lehrer vorgetragen|Gefestigt|Dauerhaft gelernt|Abzeichen|Siegel|Zertifikat/i,
  };
  const sleutels = Object.keys(k.kilimimMetinleri('tr'));
  for (const dil of DILLER) {
    const t = k.kilimimMetinleri(dil);
    assert.deepEqual(Object.keys(t), sleutels, dil);
    for (const [ad, v] of Object.entries(t)) {
      for (const s of Array.isArray(v) ? v : [v]) {
        assert.ok(typeof s === 'string' && s.length > 2, `${dil}.${ad}`);
        assert.doesNotMatch(s, yasak[dil], `${dil}.${ad}: hocanın değerlendirmesine ait terim`);
      }
    }
    assert.equal(t.doku.length, 4);
    assert.equal(t.dokuMadde.length, 4);
    assert.match(t.dokuMadde[2], /\{b\}/);
    assert.match(t.doku[2], /1(?:–| à )4/);
    assert.match(t.doku[3], /5/);
    assert.match(t.ozetBasladi, /\{n\}.*\{m\}/);
    assert.match(t.ozetGun, /\{k\}/);
  }
  assert.equal(k.kilimimMetinleri('tr').fark, 'Hocanın dinlediği ezberler veli portalındaki kilimde görünür.');
  assert.equal(k.kilimimMetinleri('tr').baslik, 'Kilimim · kendi çalışmam');
  // Fransızca tipografi: iki nokta öncesi bölünmez boşluk.
  assert.match(k.kilimimMetinleri('fr').ozetBasladi, /commencés[  ]: /);
});

test('Sayfa betiği yalnız okur: depoya yazmaz, ağa çıkmaz, innerHTML kullanmaz, çerez/oturum hafızasına dokunmaz', () => {
  const kaynak = readFileSync('egitim/src/scripts/kilimim.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const yasak of [/setItem/, /removeItem/, /\.clear\(/, /sessionStorage/, /document\.cookie/, /\bfetch\(/, /XMLHttpRequest/, /sendBeacon/, /WebSocket/, /innerHTML/, /outerHTML/, /insertAdjacentHTML/, /\byaz\(/, /location\.(href|search|hash)\s*=/, /history\.(push|replace)State/]) {
    assert.doesNotMatch(kaynak, yasak, `betikte yasak kalıp: ${yasak}`);
  }
});
