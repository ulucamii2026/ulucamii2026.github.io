/**
 * Ezber Kilimi Faz 1d (27 Eyl 2026) — kilim çizici ve veli görünümünün saf yardımcıları. Neden: kilim satır içi SVG
 * olarak veli portalına girer; bozuk XML, sayfadaki başka bir kilimle çakışan kimlik ya da dış bağlantı bütün sayfayı
 * etkiler. Her madde tam bir kez dokunmalı, basamak ve ödüller durum makinesinin (bolumOzeti) sonucuyla aynı olmalı;
 * veliye giden satırlar beş dilde ve yumuşak olmalı, eski kayıttan taşıma (gecis) veliye olay diye görünmemeli.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { optimize } from 'svgo';
import { motifModulu } from '../scripts/ezber-motif-uret.mjs';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-kilim-test.mjs');
await build({
  stdin: {
    contents: ['kilim', 'veli', 'motifler', 'metinler', 'durum', 'katalog'].map((m) => `export * from "./src/lib/ezber/${m}.ts";`).join('\n'),
    resolveDir: process.cwd(),
  },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(outfile).href);
// Veli portalının kart parçası (src/scripts/veli-ezber.ts): Firebase'e yalnız tür olarak bağlı, sahte `fs` ile sınanır.
const kartDosyasi = resolve('node_modules/.cache/ezber-veli-kart-test.mjs');
await build({ entryPoints: ['src/scripts/veli-ezber.ts'], outfile: kartDosyasi, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const kart = await import(pathToFileURL(kartDosyasi).href);
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const d = (basamak, sonrakiKontrol = '', ek = {}) => ({ basamak, kalite: '', notlar: [], sonrakiKontrol, surum: 1, ...ek });
const hepsi = (ids, b) => Object.fromEntries(ids.map((id) => [id, d(b, b === 2 || b === 3 ? '2026-10-24' : '')]));
const serit = (anahtar) => m.bolumler().find((b) => b.anahtar === anahtar).ogeler;
const kimlikler = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
const grup = (svg, anahtar) => svg.match(new RegExp(`<g class="kl-serit" data-serit="${anahtar.replace('.', '\\.')}"[^>]*>[\\s\\S]*?</g>(?=<g class="kl-serit"|<rect class="kl-cerceve")`))[0];

test('Motif modülü kaynak çizimlerle aynı; her şeridin motifi var', () => {
  assert.equal(readFileSync('src/lib/ezber/motifler.ts', 'utf8'), motifModulu(), 'node scripts/ezber-motif-uret.mjs çalıştırın');
  for (const s of m.SEVIYE_SIRASI) assert.ok(m.MOTIFLER[m.SERIT_MOTIFI[s]], `${s}: motif yok`);
  for (const ad of ['kenar-kocboynuzu', 'kenar-kose', 'rozet', 'muhur']) assert.ok(m.MOTIFLER[ad], ad);
  for (const [ad, x] of Object.entries(m.MOTIFLER)) assert.doesNotMatch(x.icerik, /fill=|stroke=|style=|class=|id=/, `${ad}: çizim renk ya da kimlik taşımamalı`);
});

test('Boş kilim geçerli SVG: 81 madde tam bir kez, hepsi Başlanmadı; kimlikler önekli ve bağlar çözülüyor', () => {
  const svg = m.kilimSvg({}, { onek: 'kl-bos', dil: 'tr', baslik: 'Örnek Talebe — Ezber Kilimi' });
  assert.doesNotThrow(() => optimize(svg), 'XML ayrıştırılamadı');
  assert.match(svg, /^<svg class="ezber-kilim" xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+" role="img" aria-labelledby="kl-bos-b kl-bos-a"/);
  const ogeler = [...svg.matchAll(/<g class="kl-oge" data-id="([^"]+)" data-basamak="(\d)">/g)];
  assert.equal(ogeler.length, m.KATALOG.ogeler.length);
  assert.deepEqual(ogeler.map((x) => x[1]).sort(), m.KATALOG.ogeler.map((o) => o.id).sort());
  assert.ok(ogeler.every((x) => x[2] === '0'));
  const ids = kimlikler(svg);
  assert.equal(new Set(ids).size, ids.length, 'kimlik tekrarı');
  assert.ok(ids.every((id) => id.startsWith('kl-bos-')), 'öneksiz kimlik');
  for (const [, hedef] of svg.matchAll(/href="([^"]*)"/g)) assert.ok(hedef.startsWith('#') && ids.includes(hedef.slice(1)), `çözülmeyen bağ: ${hedef}`);
  assert.doesNotMatch(svg, /<script|<style|<image|<text|\son\w+=|javascript:|data:/i);
  assert.match(svg, /<title id="kl-bos-b">Örnek Talebe — Ezber Kilimi<\/title><desc id="kl-bos-a">0\/81 metin başladı<\/desc>/);
  assert.equal((svg.match(/class="kl-odul kl-rozet"/g) || []).length, 12, '12 şerit, 12 boş rozet yuvası');
  assert.doesNotMatch(svg, /kazanildi|data-rozet|data-muhur|data-altin|kl-altin"/);
  assert.ok(svg.length < 60_000, `kilim çok büyük: ${svg.length}`);
});

test('Ödüller durum makinesiyle aynı: tümü ≥ 2 rozet, ≥ 3 mühür, 4 altın kenar; gösterilen basamak kapsamayı izler', () => {
  const ogeler = { ...hepsi(serit('1'), 2), ...hepsi(serit('2'), 3), ...hepsi(serit('3'), 4), 's-alak': d(3, '2026-10-24') };
  const svg = m.kilimSvg(ogeler, { onek: 'kl-odul', dil: 'tr', baslik: 'Kilim' });
  assert.doesNotThrow(() => optimize(svg));
  assert.match(grup(svg, '1'), /data-rozet=""/);
  assert.doesNotMatch(grup(svg, '1'), /data-muhur|data-altin/);
  assert.match(grup(svg, '1'), /class="kl-odul kl-rozet kazanildi"/);
  assert.match(grup(svg, '2'), /data-rozet="" data-muhur=""/);
  assert.match(grup(svg, '2'), /class="kl-odul kl-muhur kazanildi"/);
  assert.match(grup(svg, '3'), /data-rozet="" data-muhur="" data-altin=""/);
  assert.match(grup(svg, '3'), /<rect class="kl-altin"/);
  assert.equal((svg.match(/class="kl-b4-cerceve"/g) || []).length, serit('3').length);
  assert.doesNotMatch(grup(svg, '4'), /data-rozet/);
  // s-alak kaydı s-alak-1-5'i de gösterir (kapsama); kenar suyu ödülsüzdür.
  assert.match(svg, /data-id="s-alak-1-5" data-basamak="3"/);
  const ozet = m.bolumOzetleri(ogeler);
  for (const oz of m.kilimSeritleri(ozet)) assert.equal(/data-rozet=""/.test(grup(svg, oz.bolum.anahtar)), oz.rozet, oz.bolum.anahtar);
  assert.match(svg, /<desc id="kl-odul-a">\d+\/81 metin başladı · Hocaya okudu 5 · Pekişti \d+ · Kalıcı \d+ · Rozet 3 · Mühür 2<\/desc>/);
});

test('Aynı sayfada iki kilim kimlik paylaşmaz; geçersiz önek reddedilir; başlıklar velinin dilinde', () => {
  const a = kimlikler(m.kilimSvg({}, { onek: 'kl-a', dil: 'tr', baslik: 'A' }));
  const b = kimlikler(m.kilimSvg({}, { onek: 'kl-b', dil: 'tr', baslik: 'B' }));
  assert.equal(a.filter((x) => b.includes(x)).length, 0);
  for (const kotu of ['', '1kl', 'Kl', 'kl a', 'kl"><script>', 'k'.repeat(41)])
    assert.throws(() => m.kilimSvg({}, { onek: kotu, dil: 'tr', baslik: 'x' }), /Geçersiz kilim öneki/, JSON.stringify(kotu));
  const fr = m.kilimSvg({ 's-fatiha': d(3, '2026-10-24') }, { onek: 'kl-fr', dil: 'fr', baslik: 'Kilim <b>' });
  assert.match(fr, /<title>Sourate Al-Fatiha — Consolidé<\/title>/);
  assert.match(fr, /<title id="kl-fr-b">Kilim &lt;b&gt;<\/title>/);
  for (const dil of DILLER) assert.doesNotThrow(() => optimize(m.kilimSvg({ 'd-euzu-besmele': d(4) }, { onek: `kl-${dil}`, dil, baslik: 'x' })), dil);
});

test('Açıklama beş basamağı ve üç ödülü velinin dilinde anlatır, kilimin sembollerine bağlanır', () => {
  for (const dil of DILLER) {
    const l = m.kilimLejanti({ onek: 'kl-l', dil, baslik: 'x' });
    for (const b of [0, 1, 2, 3, 4]) assert.ok(l.includes(m.BASAMAK_ADLARI[b][dil]), `${dil}/${b}`);
    for (const k of ['rozet', 'muhur', 'altin']) assert.ok(l.includes(m.KILIM_METINLERI[k][dil]) && l.includes(m.KILIM_METINLERI[`${k}Anlam`][dil]), `${dil}/${k}`);
    assert.ok([...l.matchAll(/href="#([^"]+)"/g)].every((x) => x[1].startsWith('kl-l-m-')));
  }
});

test('Son dinlemeler: yumuşak dil, kalıp notlar velinin dilinde, geçiş gösterilmez, sınır uygulanır', () => {
  const olay = (ezber, tur, ek = {}) => ({ ezber, tur, kalite: '', notlar: [], basamakOnce: 0, basamakSonra: 1, zorla: false, tarih: '2026-10-17', ...ek });
  const olaylar = [
    olay('s-fatiha', 'dinleme', { kalite: 'tam', notlar: ['med', 'bilinmeyen-not'], basamakOnce: 2, basamakSonra: 3 }),
    olay('s-ihlas', 'gecis', { basamakSonra: 2 }),
    olay('d-euzu-besmele', 'atama'),
    olay('s-kevser', 'duzeltme', { basamakOnce: 1, basamakSonra: 3 }),
    olay('s-nas', 'dinleme', { kalite: 'tekrar', basamakOnce: 2, basamakSonra: 1 }),
    olay('katalogda-yok', 'dinleme', { kalite: 'tam' }),
  ];
  const tr = m.veliDinlemeleri(olaylar, 'tr');
  assert.deepEqual(tr.map((x) => x.ad), ['Fâtiha Sûresi', 'Eûzü-Besmele', 'Kevser Sûresi', 'Nâs Sûresi']);
  assert.deepEqual(tr[0], { tarih: '2026-10-17', ad: 'Fâtiha Sûresi', metin: 'çok güzel okudu', notlar: ['Uzatmalara (med) dikkat edelim.'] });
  assert.equal(tr[1].metin, 'çalışmaya başladı');
  assert.equal(tr[2].metin, 'hoca kaydı güncelledi (Pekişti)');
  assert.equal(tr[3].metin, 'bir kez daha çalışalım');
  const fr = m.veliDinlemeleri(olaylar, 'fr');
  assert.equal(fr[0].metin, 'très bien récité');
  assert.deepEqual(fr[0].notlar, ['Faisons attention aux allongements (madd).']);
  assert.equal(fr[0].ad, 'Sourate Al-Fatiha');
  assert.equal(m.veliDinlemeleri(olaylar, 'de', 2).length, 2);
  for (const dil of DILLER) for (const x of m.veliDinlemeleri(olaylar, dil)) assert.ok(x.metin && !/tekrar gelsin|az hatalı/i.test(x.metin), `${dil}: ${x.metin}`);
});

test('Şerit listesi kilimin metin karşılığı: 12 şerit + kenar suyu, durak adları, ödüller ve basamak adları', () => {
  const ogeler = { ...hepsi(serit('8.2'), 2), 'd-euzu-besmele': d(1) };
  const tr = m.veliSeritleri(ogeler, 'tr');
  assert.equal(tr.length, 13);
  assert.equal(tr[0].ad, '1 · İlk adım: iman ve besmele');
  assert.equal(tr[8].ad, '8.2 · Amme cüzü · 2. durak');
  assert.ok(tr[8].rozet && !tr[8].muhur && tr[8].baslanan === serit('8.2').length);
  assert.equal(tr[12].anahtar, 'kenar');
  assert.equal(tr[12].odullu, false);
  assert.equal(tr[0].maddeler[0].basamakAdi, 'Çalışıyor');
  assert.deepEqual([tr[0].motif, tr[8].motif, tr[12].motif], ['hatem', 'hayat-agaci', 'muska']);
  assert.equal(tr[0].baslanan, 1);
  assert.equal(m.veliSeritleri(ogeler, 'fr')[8].ad, '8.2 · Le juz’ ‘Amma · étape 2');
  const toplam = tr.reduce((t, x) => t + x.maddeler.length, 0);
  assert.equal(toplam, m.KATALOG.ogeler.length);
});

test('Motif işareti: doku basamağa göre, kalıcıda çerçeve; kilimin önekine bağlanır ve süstür', () => {
  const x = m.motifIsareti('kl-x', 'su-yolu', 4);
  assert.match(x, /aria-hidden="true"/);
  assert.match(x, /href="#kl-x-m-su-yolu"/);
  assert.match(x, /class="kl-m kl-b4"/);
  assert.match(x, /kl-b4-cerceve/);
  assert.doesNotMatch(m.motifIsareti('kl-x', 'su-yolu', 2), /cerceve/);
});

const yardim = (dil) => ({ dil, bas: (_i, b) => `<h2>${b}</h2>`, bosDurum: (_i, t) => `<p class="bos">${t}</p>`, simge: () => '', tarihYaz: (x) => x });
const olay = (ezber, tur, ek = {}) => ({ ezber, tur, kalite: '', notlar: [], basamakOnce: 0, basamakSonra: 1, zorla: false, tarih: '2026-10-17', ...ek });

test('Veli kartı görünümü: yeni kayıt ya da hiç kayıt yoksa kilim; geçişten önce yalnız eski liste; hata ayrı', () => {
  const bos = { ogeler: {}, olaylar: [] };
  assert.equal(kart.ezberGorunumu(null, true), 'hata');
  assert.equal(kart.ezberGorunumu(null, false), 'hata');
  assert.equal(kart.ezberGorunumu(bos, true), 'eski');
  assert.equal(kart.ezberGorunumu(bos, false), 'kilim');
  assert.equal(kart.ezberGorunumu({ ogeler: { 's-fatiha': d(1) }, olaylar: [] }, true), 'kilim');
});

test('Veli kartı: kilim, özet, yumuşak dilli dinlemeler, açıklama ve 81 maddelik şerit listesi; bağlar kartın içinde', () => {
  const ez = { ogeler: { 's-fatiha': d(3, '2026-10-24'), 'd-euzu-besmele': d(4) }, olaylar: [
    olay('s-fatiha', 'dinleme', { kalite: 'tam', notlar: ['med'], basamakOnce: 2, basamakSonra: 3 }), olay('s-ihlas', 'gecis', { basamakSonra: 2 })] };
  const tr = kart.veliKilimKarti(ez, 'kl-v0', yardim('tr'));
  assert.match(tr, /data-ezber-kilim="veli"/);
  assert.match(tr, /<svg class="ezber-kilim"/);
  assert.ok(tr.includes('Son dinlemeler') && tr.includes('çok güzel okudu') && tr.includes('Uzatmalara (med) dikkat edelim.'));
  assert.ok(!tr.includes('İhlâs Sûresi</b>'), 'eski kayıttan taşıma veliye olay diye görünmez');
  assert.ok(tr.includes('Kilimi okumak') && tr.includes('Şerit şerit'));
  assert.equal([...tr.matchAll(/<li data-id="/g)].length, m.KATALOG.ogeler.length);
  const kimlik = new Set(kimlikler(tr));
  for (const [, h] of tr.matchAll(/href="#([^"]+)"/g)) assert.ok(kimlik.has(h), `çözülmeyen bağ: ${h}`);
  assert.doesNotMatch(tr, /Tekrar gelsin|Az hatalı|<script|javascript:/);
  const fr = kart.veliKilimKarti(ez, 'kl-v0', yardim('fr'));
  assert.ok(fr.includes('Kilim de mémorisation') && fr.includes('Dernières récitations') && fr.includes('très bien récité') && fr.includes('Faisons attention aux allongements (madd).'));
});

test('Veli kartı boşken beklentiyi söyler, dinleme başlığı açmaz; okuma hatasında yalnız hata iletisi', () => {
  const bos = kart.veliKilimKarti({ ogeler: {}, olaylar: [] }, 'kl-v0', yardim('tr'));
  assert.ok(bos.includes(m.KILIM_METINLERI.bos.tr));
  assert.ok(!bos.includes('Son dinlemeler'));
  const hata = kart.veliKilimKarti(null, 'kl-v0', yardim('nl'));
  assert.match(hata, /data-ezber-kilim="hata"/);
  assert.ok(hata.includes(m.KILIM_METINLERI.hata.nl) && !hata.includes('<svg'));
});

test('Öğrenci kartı «Kilimim»: kilim ve açıklama; dinleme geçmişi ve şerit listesi yok', () => {
  const x = kart.ogrenciKilimKarti({ ogeler: { 's-fatiha': d(2, '2026-10-24') }, olaylar: [olay('s-fatiha', 'dinleme', { kalite: 'az' })] }, 'kl-o0', yardim('de'));
  assert.match(x, /data-ezber-kilim="ogrenci"/);
  assert.ok(x.includes('Mein Kelim') && x.includes('Den Kelim lesen'));
  assert.ok(!x.includes('Letzte Vorträge') && !x.includes('<details'));
});

test('Okuma: durum belgesi + son 20 olay (zamana göre yeniden eskiye); bozuk olay düşer; hata null döner', async () => {
  const cagri = [];
  const fs = {
    doc: (...p) => (cagri.push(['doc', ...p.slice(1)]), { yol: p.slice(1).join('/') }),
    collection: (...p) => (cagri.push(['collection', ...p.slice(1)]), { yol: p.slice(1).join('/') }),
    orderBy: (...a) => (cagri.push(['orderBy', ...a]), {}),
    limit: (n) => (cagri.push(['limit', n]), {}),
    query: (r) => r,
    getDoc: async () => ({ exists: () => true, data: () => ({ ogeler: { 's-fatiha': d(2, '2026-10-24'), 'katalogda-yok': d(1) } }) }),
    getDocs: async () => ({ docs: [{ data: () => olay('s-fatiha', 'atama') }, { data: () => ({ bozuk: true }) }] }),
  };
  const ez = await kart.veliEzberiYukle(fs, {}, 'TEST-1');
  assert.deepEqual(Object.keys(ez.ogeler), ['s-fatiha']);
  assert.equal(ez.olaylar.length, 1);
  assert.deepEqual(cagri, [['doc', 'ezberDurum', 'TEST-1'], ['collection', 'ezberDurum', 'TEST-1', 'olaylar'], ['orderBy', 'zaman', 'desc'], ['limit', 20]]);
  const uyari = console.warn; console.warn = () => {};
  try {
    assert.equal(await kart.veliEzberiYukle({ ...fs, getDoc: async () => { throw Object.assign(Error('izin yok'), { code: 'permission-denied' }); } }, {}, 'TEST-1'), null);
  } finally { console.warn = uyari; }
});

test('Ezber Odası çipi: eski Oda kimliği kataloğa eşlenir; bileşikte en düşük basamak; başlanmamışta işaret yok', () => {
  const ez = { ogeler: { 's-fatiha': d(3, '2026-10-24'), 'd-salli': d(2, '2026-10-24'), 'd-rabbena-atina': d(4), 'd-rabbenagfirli': d(2, '2026-10-24') }, olaylar: [] };
  assert.equal(kart.odaBasamagi(ez, 'fatiha'), 3);
  assert.equal(kart.odaBasamagi(ez, 'salli-barik'), 0, 'Bârik başlanmadıkça bileşik madde başlanmamış sayılır');
  assert.equal(kart.odaBasamagi(ez, 'rabbena'), 2);
  assert.equal(kart.odaBasamagi(ez, 'oda-disi'), null);
  assert.equal(kart.odaIsareti(ez, 'salli-barik', 'tr'), '');
  const x = kart.odaIsareti(ez, 'fatiha', 'fr');
  assert.match(x, /data-basamak="3"/);
  assert.match(x, /<svg class="ez-isaret b3"[^>]*aria-hidden="true"/);
  assert.match(x, /<span class="sr-only"> · Consolidé<\/span>/);
});
