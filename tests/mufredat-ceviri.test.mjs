/** Müfredat sayfası gövdesi çevirisi (12 Kasım 2026) — anahtar eşliği, sahipsiz anahtar, biçim kuralları, çevirici ve düşüş (lang="tr").
 *
 *  Gövde src/data/mufredat-2026-2027.html (mufredat-uret.py üretir, elle düzenlenmez); çeviri src/data/kurs-ceviri/<dil>.json → mufredat
 *  bölümünde, anahtar Türkçe metnin kendisidir (bkz. src/lib/kurs-ceviri.mjs «Müfredat sayfası gövdesi»).
 *  (1) dört dilin anahtar kümesi aynı, (2) her anahtar gövdede bir öğeyle birebir eşleşir (sahipsiz çeviri yok), (3) biçim kuralları,
 *  (4) mufredatCevir: çeviri, numara/meta/strong/data-etiket, künye, kaçış ve eksik parçada lang="tr".
 *  Kapsam (eksik anahtar) bilgi amaçlıdır: gövde yeniden üretilince eksik parça Türkçe kalır ve sayfa bozulmaz. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cevirici, mufredatBirimleri, mufredatCevir, MUF_KUNYE } from '../src/lib/kurs-ceviri.mjs';

const kok = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/\/$/, '');
const oku = (y) => JSON.parse(readFileSync(`${kok}/${y}`, 'utf8'));
const html = readFileSync(`${kok}/src/data/mufredat-2026-2027.html`, 'utf8');
const birimler = mufredatBirimleri(html);
const DILLER = ['en', 'nl', 'de', 'fr'];
const muf = Object.fromEntries(DILLER.map((d) => [d, oku(`src/data/kurs-ceviri/${d}.json`).mufredat ?? {}]));

test('müfredat gövdesi: dört dilin anahtar kümesi aynı ve boş değil', () => {
  const temel = Object.keys(muf.en).sort();
  assert.ok(temel.length > 0, 'en mufredat bölümü boş');
  for (const d of DILLER) assert.deepEqual(Object.keys(muf[d]).sort(), temel, `${d}: anahtar kümesi en ile aynı olmalı`);
});

test('müfredat gövdesi: her anahtar gövdedeki bir öğeyle birebir eşleşir (sahipsiz çeviri yok)', () => {
  const var_ = new Set(birimler);
  for (const d of DILLER) for (const k of Object.keys(muf[d])) assert.ok(var_.has(k), `${d}: gövdede olmayan anahtar: ${k.slice(0, 70)}`);
});

test('müfredat gövdesi: çevirilerin biçimi (boşluk, tırnak, noktalama, ayraç sayısı, sayılar, dil tuzakları, HTML yok)', () => {
  const sorun = [];
  for (const d of DILLER) for (const [tr, deger] of Object.entries(muf[d])) {
    const ad = `${d} «${tr.slice(0, 40)}»`;
    if (typeof deger !== 'string' || !deger.trim()) { sorun.push(`${ad}: boş`); continue; }
    if (deger !== deger.trim()) sorun.push(`${ad}: kenar boşluğu`);
    if (/[ \t]{2,}/.test(deger)) sorun.push(`${ad}: çift boşluk`);
    if (/[<>]/.test(deger)) sorun.push(`${ad}: HTML işareti`);
    // Fransızca sayfalarda noktalama öncesi ince/bölünmez boşluğu src/lib/fransiz-tipografi.ts (ara katman) ekler; düz boşluk veride kalabilir.
    if (d !== 'fr' && / [:;?!]/.test(deger)) sorun.push(`${ad}: noktalama öncesi boşluk (yalnız Fransızcada olur)`);
    if (/['"]/.test(deger)) sorun.push(`${ad}: düz tırnak/kesme (’ ve dile uygun tırnak kullanın)`);
    if (d !== 'fr' && /[«»]/.test(deger)) sorun.push(`${ad}: « » yalnız Fransızcada`);
    if (d !== 'de' && /„/.test(deger)) sorun.push(`${ad}: „ yalnız Almancada`);
    if (d === 'de' && (deger.match(/“/g) ?? []).length !== (deger.match(/„/g) ?? []).length) sorun.push(`${ad}: „ “ çifti eşleşmiyor`);
    // Bir-iki sözcüklü özel terim (Lâmelif, İhfâ…) çevirisiz kalabilir; cümle ve öbeklerin çevirisi kaynağın aynısı olamaz.
    if (deger === tr && tr.trim().split(/\s+/).length > 2) sorun.push(`${ad}: çeviri kaynağın aynısı`);
    for (const ayirac of ['·', '→', ' + ']) {
      const say = (s) => s.split(ayirac).length;
      if (say(deger) !== say(tr)) sorun.push(`${ad}: «${ayirac.trim()}» sayısı kaynakla aynı değil`);
    }
    for (const n of tr.match(/\d{2,}/g) ?? []) if (!deger.includes(n)) sorun.push(`${ad}: kaynaktaki sayı yok (${n})`);
  }
  assert.deepEqual(sorun, []);
});

test('müfredat gövdesi: kitap künyesi (kitap adı + sayfa) çevrilmez, anahtar da olmaz', () => {
  assert.ok(MUF_KUNYE.test('Camiye Gidiyorum 1 s. 55–58'));
  assert.ok(MUF_KUNYE.test('Elifbâ s. 5; s. 10–11'));
  assert.ok(!MUF_KUNYE.test('Camiye Gidiyorum 1 s. 85–90 (Ramazan özel programı)'));
  for (const d of DILLER) for (const k of Object.keys(muf[d])) assert.ok(!MUF_KUNYE.test(k), `${d}: künye anahtarı olmamalı: ${k}`);
});

test('mufredatCevir: çeviri, numara/meta/strong/data-etiket korunur, kaçış yapılır, eksik parça lang="tr" alır', () => {
  const kaynak = '<h2 id="a"><span class="no">1.</span> Genel Esaslar</h2>\n<h3 id="b">Kur\'an-ı Kerim <span class="meta">toplam 87 ders saati</span></h3>\n'
    + '<table><tr><th><strong>Konu</strong></th></tr><tr><td data-etiket="Konu">Her gün Ahlak &amp; İtikat</td><td>Camiye Gidiyorum 1 s. 55–58</td><td>11:00-11:40</td><td>Çevrilmemiş cümle burada</td></tr></table>';
  const harita = { 'Genel Esaslar': 'General rules', "Kur'an-ı Kerim": 'The Holy Qur’an', 'toplam 87 ders saati': '87 lessons in total', Konu: 'Topic', 'Her gün Ahlak &amp; İtikat': 'Every day Ethics & Creed' };
  const { html: c, eksik } = mufredatCevir(kaynak, harita, 'en');
  assert.match(c, /<h2 id="a"><span class="no">1\.<\/span> General rules<\/h2>/);
  assert.match(c, /<h3 id="b">The Holy Qur’an <span class="meta">87 lessons in total<\/span><\/h3>/);
  assert.match(c, /<th><strong>Topic<\/strong><\/th>/);
  assert.match(c, /data-etiket="Topic"/);
  assert.match(c, /Every day Ethics &amp; Creed/);
  assert.match(c, /<td>Camiye Gidiyorum 1 s\. 55–58<\/td>/);
  assert.match(c, /<td>11:00-11:40<\/td>/);
  assert.match(c, /<td><span lang="tr">Çevrilmemiş cümle burada<\/span><\/td>/);
  assert.deepEqual(eksik, ['Çevrilmemiş cümle burada']);
});

test('mufredatCevir: gerçek gövde, gerçek bindirmeyle — çevrilmemiş (eksik) parça sayısı bilgi olarak yazılır, yapı bozulmaz', () => {
  for (const d of DILLER) {
    const { html: c, eksik } = mufredatCevir(html, muf[d], d);
    const etiket = (s) => (s.match(/<(?:h[23]|table|tr|th|td|ul|li|p)\b/g) ?? []).length;
    assert.equal(etiket(c), etiket(html), `${d}: öğe sayısı değişmemeli`);
    assert.equal((c.match(/id="/g) ?? []).length, (html.match(/id="/g) ?? []).length, `${d}: kimlikler (içindekiler bağları) korunmalı`);
    console.log(`# müfredat gövdesi ${d}: ${birimler.length - eksik.length}/${birimler.length} anahtar çevrilmiş, ${eksik.length} eksik (Türkçe kalır, lang="tr")`);
  }
});

test('çevirici: mufredat düşüş zinciri doğru dili bildirir; tr bindirme kullanmaz', () => {
  const k = Object.keys(muf.en)[0];
  for (const d of DILLER) {
    const c = cevirici(d, { bindirme: { mufredat: muf[d] } });
    assert.deepEqual(c.mufredat(k), { m: muf[d][k], d });
    assert.deepEqual(c.mufredat('Bu metin bindirmede yok'), { m: 'Bu metin bindirmede yok', d: 'tr' });
    assert.deepEqual(c.mufredat('11:00-11:40'), { m: '11:00-11:40', d });
  }
  const tr = cevirici('tr', { bindirme: { mufredat: muf.en } });
  assert.deepEqual(tr.mufredat(k), { m: k, d: 'tr' });
  assert.deepEqual(tr.mufredatHaritasi, {});
});
