/**
 * «Abdest ve Namaz» veri ve metin bütünlüğü (10 Kasım 2026): src/data/ibadet/*.json, çizimler, dua bağlantıları ve beş dilli arayüz.
 * Bağlayıcı: her adımın beş dilde metni ve bir sayfa kaynağı (kaynakNo) vardır; dua kimlikleri katalogda bulunur ve çalışma sayfası alır;
 * her çizimin beş dilde adı vardır (metin alternatifi); rek‘at şeması veriyle uyumludur; hükmü tartışmalı adımlar hüküm alıştırmasında yoktur;
 * arayüz metinlerinde beş dilin anahtarları aynıdır ve boş değer yoktur; hiçbir yerde «taslak» etiketi basılmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(giris, ad) {
  const outfile = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ entryPoints: [giris], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent', alias: { '@ortak': resolve('src') } });
  return import(pathToFileURL(outfile).href);
}
const v = await yukle('src/lib/ibadet/ibadet-veri.ts', 'ibadet-veri-test');
const kat = await yukle('src/lib/ezber/katalog.ts', 'ibadet-katalog-test');
const metin = await yukle('egitim/src/i18n/ibadet.ts', 'ibadet-i18n-test');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const svgler = readdirSync('egitim/src/assets/cizim/ibadet').filter((a) => a.endsWith('.svg')).map((a) => a.replace(/\.svg$/, ''));
const tumAdimlar = [...v.ABDEST.adimlar, ...v.NAMAZ.adimlar];

test('her adımın beş dilde metni, hükmü, sayfa kaynağı ve var olan bir çizimi vardır; sıra 1…n', () => {
  for (const [konu, kok] of [['abdest', v.ABDEST], ['namaz', v.NAMAZ]]) {
    kok.adimlar.forEach((a, i) => {
      assert.equal(a.sira, i + 1, `${a.id}: sıra`);
      assert.match(a.kaynakNo, /^s\. \d+(-\d+)?$/, `${a.id}: kaynakNo`);
      assert.ok(kok.terimler[a.tur], `${a.id}: hüküm terimi ${a.tur}`);
      assert.ok(svgler.includes(a.ikon), `${a.id}: çizim ${a.ikon}`);
      for (const d of DILLER) {
        assert.ok(a.metin[d]?.trim(), `${a.id} ${d}: metin`);
        for (const alan of ['kadin', 'not']) if (a[alan]) assert.ok(a[alan][d]?.trim(), `${a.id} ${d}: ${alan}`);
      }
      for (const s of a.kaynakNolar ?? []) assert.match(s, /^s\. \d+/);
    });
    assert.ok(kok.etiket.tr.includes('Hanefî'), `${konu}: kaynak etiketi`);
    for (const d of DILLER) assert.ok(kok.etiket[d]);
  }
  assert.equal(v.ABDEST.adimlar.length, 13);
  assert.equal(v.NAMAZ.adimlar.length, 16);
});

test('dua kimlikleri katalogda vardır ve çalışma sayfası alır (ses ya da metin)', () => {
  const idler = [...new Set(tumAdimlar.flatMap((a) => [a.dua, ...(a.duaEk ?? [])]).filter(Boolean))];
  assert.ok(idler.length >= 10, 'namazdaki dualar');
  for (const id of idler) {
    const oge = kat.ezberBul(id);
    assert.ok(oge, `${id}: katalogda yok`);
    assert.ok(kat.calismaSayfasiVar(oge), `${id}: çalışma sayfası yok`);
    for (const d of DILLER) assert.ok(oge.ad[d], `${id} ${d}: ad`);
  }
});

test('her çizimin beş dilde adı vardır; abdest adımlarının adı çizimden gelir; nm-06 ve kardeşlerinin adı vardır', () => {
  assert.deepEqual([...metin.CIZIM_ADLARI].sort(), [...svgler].sort(), 'çizim adları ile SVG dosyaları aynı küme');
  for (const ad of svgler) for (const d of DILLER) assert.ok(metin.cizimAdi(d, ad).trim(), `${ad} ${d}`);
  for (const a of v.ABDEST.adimlar) for (const d of DILLER) assert.ok(metin.adimAdi(d, a.id, a.ikon));
  for (const a of v.NAMAZ.adimlar) for (const d of DILLER) assert.ok(metin.adimAdi(d, a.id, a.ikon), `${a.id} ${d}`);
  for (const id of metin.ADIM_ADI_KIMLIKLERI) assert.ok(v.NAMAZ.adimlar.some((a) => a.id === id), `${id}: namaz adımı`);
  assert.throws(() => metin.cizimAdi('tr', 'yok-boyle-cizim'));
});

test('rek‘at şablonu ve şeması: kimlikler vardır; 2/3/4 rek‘atta son oturuş yalnız sonda; nm-06 her rek‘atta; nm-12 iki rek‘atta bir kez', () => {
  const s = v.NAMAZ.rekatSablonu;
  const kimlikler = new Set(v.NAMAZ.adimlar.map((a) => a.id));
  for (const liste of Object.values(s)) for (const id of liste) assert.ok(kimlikler.has(id), id);
  assert.ok(s.ucuncuDorduncuRekat.includes('nm-06'), 'üçüncü/dördüncü rek‘atta Fâtiha vardır (rk-03 ile gösterilir)');
  assert.ok(v.NAMAZ.rekatKurallari.some((k) => k.id === 'rk-03' && /sûre okunmaz/.test(k.metin.tr)));
  for (const n of [2, 3, 4]) {
    const sema = v.rekatSemasi(n);
    assert.equal(sema.length, n);
    sema.forEach((r, i) => {
      assert.equal(r.no, i + 1);
      assert.equal(r.son, i === n - 1);
      assert.ok(r.adimlar.includes('nm-06'), `${n}: ${r.no}. rek‘atta Fâtiha`);
      assert.equal(r.adimlar.includes('nm-15'), r.son, 'selâm yalnız son rek‘atta');
    });
    const oturus = sema.flatMap((r) => r.adimlar).filter((id) => id === 'nm-12').length;
    assert.equal(oturus, n === 2 ? 1 : 2, `${n} rek‘at: ka‘de sayısı`);
  }
  assert.throws(() => v.rekatSemasi(1), RangeError);
  assert.throws(() => v.rekatSemasi(5), RangeError);
});

test('vakitler: farz 2-4-4-3-4; birimler sırası önce–farz–sonra; hükümler terim sözlüğünde', () => {
  assert.deepEqual(v.NAMAZ.vakitler.map((x) => x.farz), [2, 4, 4, 3, 4]);
  assert.deepEqual(v.NAMAZ.vakitler.map((x) => x.id), [...v.VAKIT_IDLERI]);
  for (const x of v.NAMAZ.vakitler) {
    const b = v.vakitBirimleri(x);
    assert.equal(b.filter((y) => y.tip === 'farz').length, 1);
    assert.ok(['once', 'farz', 'sonra'].indexOf(b[0].tip) <= ['once', 'farz', 'sonra'].indexOf(b[b.length - 1].tip));
    for (const y of b) assert.ok(v.NAMAZ.terimler[y.hukum], `${x.id}: ${y.hukum}`);
    for (const d of DILLER) assert.ok(x.ad[d]);
    assert.match(x.kaynakNo.farz, /^s\. \d+/);
  }
  assert.equal(v.vakitBul('sabah').sunnetOnce.rekat, 2);
  assert.equal(v.vakitBul('aksam').sunnetOnce, null);
  assert.equal(v.NAMAZ.vitir.rekat, 3);
  assert.ok(v.NAMAZ.terimler[v.NAMAZ.vitir.hukum]);
  assert.throws(() => v.vakitBul('yok'));
});

test('hüküm alıştırması: tartışmalı ve karma adımlar yok; çizim eşleştirmede her çizim bir kez; kısmi etiket fiilleri', () => {
  const ad = (id) => v.adimBul(v.NAMAZ, id);
  for (const id of v.HUKUM_ADIMLARI_NAMAZ) {
    assert.ok(['farz', 'vacip', 'sunnet'].includes(ad(id).tur), id);
    assert.ok(!['nm-02', 'nm-06', 'nm-08', 'nm-10', 'nm-12'].includes(id), `${id}: tartışmalı/karma adım hüküm sorusunda olmamalı`);
    assert.ok(!v.KISMI_ETIKET[id] || ad(id).tur === 'farz');
  }
  const cizimler = v.CIZIM_ADIMLARI_NAMAZ.map((id) => ad(id).ikon);
  assert.equal(new Set(cizimler).size, cizimler.length, 'çizim eşleştirmede her çizim tek adıma düşer');
  assert.deepEqual(Object.keys(v.KISMI_ETIKET).sort(), ['nm-02', 'nm-07', 'nm-09']);
  for (const id of Object.keys(v.KISMI_ETIKET)) assert.equal(ad(id).tur, 'farz');
  assert.equal(ad('nm-06').tur, 'vacip');
});

test('arayüz metinleri: beş dilin anahtarları aynı, boş değer yok, yer tutucular korunur, «taslak» etiketi yok', () => {
  const duz = (o, on = '') => Object.entries(o).flatMap(([k, x]) => (typeof x === 'object' ? duz(x, `${on}${k}.`) : [[`${on}${k}`, x]]));
  const tr = duz(metin.ibadetMetinleri('tr'));
  const anahtarlar = tr.map(([k]) => k).sort();
  assert.ok(anahtarlar.length > 100);
  for (const d of DILLER) {
    const dl = duz(metin.ibadetMetinleri(d));
    assert.deepEqual(dl.map(([k]) => k).sort(), anahtarlar, `${d}: anahtarlar`);
    for (const [k, x] of dl) {
      assert.ok(typeof x === 'string' && x.trim(), `${d} ${k}: boş`);
      const yer = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((e) => e[1]).sort().join(',');
      assert.equal(yer(x), yer(Object.fromEntries(tr)[k]), `${d} ${k}: yer tutucular`);
      assert.ok(!/taslak|brouillon|draft|concept|entwurf/i.test(x), `${d} ${k}: taslak etiketi`);
    }
  }
  assert.equal(metin.doldur(metin.ibadetMetinleri('tr').adimSayaci, { n: 2, m: 13 }), 'Adım 2 / 13');
});

test('sayfalar: taslak etiketi bileşeni kullanılmaz; sayfa içi betik ve stil yok (CSP)', () => {
  const dosyalar = [
    'egitim/src/pages/[dil]/ibadet/index.astro', 'egitim/src/pages/[dil]/ibadet/abdest.astro', 'egitim/src/pages/[dil]/ibadet/namaz/index.astro',
    'egitim/src/pages/[dil]/ibadet/namaz/[vakit].astro', ...readdirSync('egitim/src/components').filter((a) => a.startsWith('Ibadet')).map((a) => `egitim/src/components/${a}`),
  ];
  for (const f of dosyalar) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/TaslakEtiketi/.test(s), `${f}: taslak etiketi`);
    assert.ok(!/\sstyle=|is:inline|<style/.test(s), `${f}: satır içi stil`);
    assert.ok(!/\son[a-z]+=\{?["']/.test(s), `${f}: satır içi olay`);
  }
});
