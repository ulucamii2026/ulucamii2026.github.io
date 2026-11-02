/**
 * İlim Yolu Dilim 1 (2 Kasım 2026) — kilim çiziciye birleşik kip (src/lib/ezber/kilim.ts, `birlesik`). Çocuk sayfasında hocanın
 * basamakları ve çocuğun kendi çalışması AYNI kilimde görünür (docs/ILIM-YOLU.md, «Birleşik kilim»): dolgu hocanın basamağıdır;
 * kendi dokusu (src/lib/ezber/kilimim.ts) yalnız hocanın basamağı ≤ 1 olan hücreye biner, açıklama ikisini de gösterir.
 * Bağlayıcı: seçenek verilmeyince bütün eski çıktılar (veli portalı, Kilimim sayfası, örnek kilim) BAYT BAYT aynı kalır —
 * özet, birleşik kip eklenmeden önceki kodla alınmıştır.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { optimize } from 'svgo';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-kilim-birlesik-test.mjs');
await build({
  stdin: {
    contents: ['kilim', 'kilimim', 'cihaz', 'metinler', 'durum', 'katalog'].map((m) => `export * from "./src/lib/ezber/${m}.ts";`).join('\n'),
    resolveDir: process.cwd(),
  },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(outfile).href);
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const ozet = (parcalar) => createHash('sha256').update(parcalar.join('\u0000')).digest('hex');
const d = (basamak, sonrakiKontrol = '', ek = {}) => ({ basamak, kalite: '', notlar: [], sonrakiKontrol, surum: 1, ...ek });
const serit = (anahtar) => m.bolumler().find((b) => b.anahtar === anahtar).ogeler;
const kimlikler = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
const hucre = (svg, id) => svg.match(new RegExp(`<g class="kl-oge" data-id="${id}"[^>]*>[\\s\\S]*?</g>`))?.[0] ?? '';

/** Hocanın kaydı: şerit 1 Kalıcı (altın), şerit 2 Pekişti (mühür), şerit 3'te bir Hocaya okudu ve bir Çalışıyor, bütün Alak Hocaya okudu. */
function hocaKaydi() {
  const ogeler = {};
  for (const id of serit('1')) ogeler[id] = d(4);
  for (const id of serit('2')) ogeler[id] = d(3, '2026-11-20');
  const s3 = serit('3');
  ogeler[s3[0]] = d(2, '2026-11-09', { kalite: 'tam', notlar: ['akici'] });
  ogeler[s3[1]] = d(1);
  ogeler['s-alak'] = d(2, '2026-11-09');
  return ogeler;
}

/** Birleşik kip eklenmeden önceki bütün dışa açık çıktılar (beş dil, üç kip, açıklamalar, özet, işaret). */
function eskiCiktilar() {
  const ogeler = hocaKaydi();
  const parca = [];
  for (const dil of DILLER) {
    const s = { onek: `kl-${dil}`, dil, baslik: `Başlık <${dil}> & "x"` };
    parca.push(m.kilimSvg({}, s), m.kilimSvg(ogeler, s), m.kilimLejanti(s), m.kilimOzeti(ogeler, dil), m.kilimOzeti({}, dil));
    const kendi = { doku: (id) => id.length % 4, etiket: (id, ad, k) => `${ad} · ${k}`, ozet: 'öz', baglanti: (id) => (id.startsWith('s-') ? `/${dil}/calis/${id}/` : null) };
    parca.push(m.kilimSvg(ogeler, { ...s, kendi }), m.kilimSvg({}, { ...s, kendi: { etiket: () => 'e', ozet: 'o' } }), m.kendiLejanti(s, ['a', 'b', 'c', 'd']));
    parca.push(m.motifIsareti(s.onek, 'hatem', 3), m.motifIsareti(s.onek, 'muska', 0));
  }
  return parca;
}

// Birleşik kip eklenmeden ÖNCEKİ kilim.ts (HEAD bef63b19) ile alınmış özet. Değişirse veli portalı ve Kilimim sayfası değişmiştir.
const ESKI_OZET = 'ae9d3f728c8814147859d4c415a9a9f62a9700c4d5d0832fc6d06baee67ff358';

test('seçenek yokken eski çıktılar bayt bayt aynı (veli portalı, Kilimim, örnek kilim)', () => {
  assert.equal(ozet(eskiCiktilar()), ESKI_OZET);
});

const AN = (g) => new Date(2026, 10, g, 10).getTime();
const ayar = (son, kutu = -1) => ({ ...m.varsayilanAyar(), son, kutu });
const ADLAR = ['çalışılmadı', 'başladım', 'takvimde', 'son basamakta'];
/** Çocuğun kendi kaydı: farklı hoca basamaklarındaki hücrelere dört doku. */
function kendiKaydi() {
  const s3 = serit('3');
  const s4 = serit('4');
  return m.temizle({
    v: 1, ar: 1, gunler: [],
    maddeler: {
      [serit('1')[0]]: ayar(AN(1), 4), // hoca 4: kendi dokusu görünmez
      [serit('2')[0]]: ayar(AN(1), 2), // hoca 3: görünmez
      [s3[0]]: ayar(AN(1), 4), // hoca 2: görünmez
      [s3[1]]: ayar(AN(1), 1), // hoca 1: doku 2 biner
      [s4[0]]: ayar(AN(1)), // hoca 0: doku 1
      [s4[1]]: ayar(AN(1), 4), // hoca 0: doku 3
      [s4[2]]: ayar(0, 3), // kayıt var, son yok: doku 0
      'alak-dis': ayar(AN(1), 4), // katalog dışı (temizle'den geçer, kilimde yok)
      's-alak-1-5': ayar(AN(1), 3), // kapsayan s-alak hoca 2: görünen basamak 2, biner MEZ
    },
  });
}
const birlesikSecenek = (dil = 'tr', ek = {}) => ({ onek: 'kl-bir', dil, baslik: 'Kilimim', birlesik: { kendi: kendiKaydi(), dokuAdlari: ADLAR, ...ek } });

test('birleşik kip: dolgu hocanın basamağı; kendi dokusu yalnız basamak ≤ 1 hücreye biner', () => {
  const svg = m.kilimSvg(hocaKaydi(), birlesikSecenek());
  const s3 = serit('3');
  const s4 = serit('4');
  // Hocanın basamağı ve ödülleri yerinde: şerit 1 altın, şerit 2 mühür.
  assert.match(svg, /<g class="kl-serit" data-serit="1" data-rozet="" data-muhur="" data-altin="">/);
  assert.match(svg, /<g class="kl-serit" data-serit="2" data-rozet="" data-muhur="">/);
  const binenler = [...svg.matchAll(/<g class="kl-oge" data-id="([^"]+)" data-basamak="(\d)" data-kendi="(\d)">/g)].map((x) => [x[1], Number(x[2]), Number(x[3])]);
  assert.deepEqual(binenler.sort(), [[s3[1], 1, 2], [s4[0], 0, 1], [s4[1], 0, 3]].sort());
  for (const id of [serit('1')[0], serit('2')[0], s3[0], s4[2], 's-alak-1-5']) assert.doesNotMatch(hucre(svg, id), /data-kendi|kl-ust/, id);
  // Binen hücre: önce hocanın dolgusu, üstte kendi dokusu; başlık ikisini de söyler.
  const h = hucre(svg, s4[1]);
  assert.match(h, /class="kl-m kl-b0"\/><use href="#kl-bir-m-[a-z-]+" [^>]*class="kl-m kl-k3 kl-ust"\/><\/g>$/);
  assert.match(h, new RegExp(`<title>[^<]+, ${m.BASAMAK_ADLARI[0].tr} · son basamakta</title>`));
  assert.match(hucre(svg, s3[1]), new RegExp(`<title>[^<]+, ${m.BASAMAK_ADLARI[1].tr} · takvimde</title>`));
  // Kapsama: s-alak Hocaya okudu → s-alak-1-5 de 2 görünür, kendi dokusu binmez.
  assert.match(hucre(svg, 's-alak-1-5'), /data-basamak="2"/);
  // Her katalog maddesi tam bir kez.
  assert.equal([...svg.matchAll(/<g class="kl-oge" data-id=/g)].length, m.KATALOG.ogeler.length);
});

test('birleşik kip geçerli SVG: kimlikler önekli (tarama desenleri hariç), bağlar çözülüyor, betik yok', () => {
  for (const dil of DILLER) {
    const svg = m.kilimSvg(hocaKaydi(), birlesikSecenek(dil, { ozet: 'kendi <özet>' }));
    assert.doesNotThrow(() => optimize(svg), `${dil}: XML ayrıştırılamadı`);
    assert.match(svg, /^<svg class="ezber-kilim kl-birlesik" xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    const ids = kimlikler(svg);
    assert.equal(new Set(ids).size, ids.length, 'kimlik tekrarı');
    assert.ok(ids.every((id) => id.startsWith('kl-bir-') || id === 'kl-tarama-1' || id === 'kl-tarama-2'), 'öneksiz kimlik');
    assert.ok(ids.includes('kl-tarama-1') && ids.includes('kl-tarama-2'), 'tarama desenleri tanımlı');
    for (const [, hedef] of svg.matchAll(/href="([^"]*)"/g)) assert.ok(hedef.startsWith('#') && ids.includes(hedef.slice(1)), `çözülmeyen bağ: ${hedef}`);
    assert.doesNotMatch(svg, /<script|<style|<image|<text|\son\w+=|javascript:|data:/i);
    // Açıklama: hocanın özeti + kendi özeti (kaçışlı).
    assert.ok(svg.includes(`<desc id="kl-bir-a">${m.kilimOzeti(hocaKaydi(), dil)} · kendi &lt;özet&gt;</desc>`), dil);
  }
});

test('birleşik kip: hoca kaydı boşsa kendi dokuları görünür; kendi kaydı boşsa çıktı hoca kipinden yalnız sınıf ve desenle ayrılır', () => {
  const bos = m.kilimSvg({}, birlesikSecenek());
  assert.equal([...bos.matchAll(/data-kendi="/g)].length, 7, 'hoca boş: kendi kaydındaki yedi çalışılmış katalog maddesi (son 0 ve katalog dışı hariç)');
  const kendisiz = m.kilimSvg(hocaKaydi(), { onek: 'kl-bir', dil: 'tr', baslik: 'Kilimim', birlesik: { kendi: m.bos(), dokuAdlari: ADLAR } });
  const hoca = m.kilimSvg(hocaKaydi(), { onek: 'kl-bir', dil: 'tr', baslik: 'Kilimim' });
  const TARAMA = kendisiz.match(/<pattern id="kl-tarama-1"[\s\S]*?<\/pattern><pattern id="kl-tarama-2"[\s\S]*?<\/pattern>/)[0];
  assert.equal(kendisiz.replace(' kl-birlesik', '').replace(TARAMA, ''), hoca);
});

test('birleşik açıklama: beş basamak + üç ödül + kendi çalışmanın üç dokusu; kendi ile birlikte verilemez', () => {
  const s = birlesikSecenek();
  const lejant = m.kilimLejanti(s);
  const eski = m.kilimLejanti({ onek: s.onek, dil: s.dil, baslik: s.baslik });
  assert.ok(lejant.startsWith(eski), 'hocanın açıklaması aynen başta');
  const ek = lejant.slice(eski.length);
  assert.match(ek, /^<ul class="kilim-lejant kilim-lejant-kendi">/);
  assert.deepEqual([...ek.matchAll(/<li data-doku="(\d)">/g)].map((x) => x[1]), ['1', '2', '3']);
  assert.deepEqual([...ek.matchAll(/<span>([^<]+)<\/span>/g)].map((x) => x[1]), ADLAR.slice(1));
  for (const k of [1, 2, 3]) assert.match(ek, new RegExp(`href="#kl-bir-m-hatem"[^>]*class="kl-m kl-k${k}"`));
  assert.throws(() => m.kilimSvg({}, { ...s, kendi: { etiket: () => '', ozet: '' } }), /birlikte/);
});

// Birleşik kip çıktısının özeti (beş dil, çizim + açıklama). Bilerek değiştirildiğinde yeni değer buraya yazılır.
const BIRLESIK_OZET = '991345c166b4287e647a5ad785c32c98772a43af8094304f26bd84a9c2ddefa1';
test('birleşik kip anlık görüntüsü (beş dil)', () => {
  const parca = DILLER.flatMap((dil) => {
    const s = { ...birlesikSecenek(dil, { ozet: 'öz' }), onek: `kl-${dil}` };
    return [m.kilimSvg(hocaKaydi(), s), m.kilimLejanti(s)];
  });
  assert.equal(ozet(parca), BIRLESIK_OZET);
});
