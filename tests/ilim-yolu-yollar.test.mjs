/**
 * İlim Yolu Dilim 2 (10 Kasım 2026) — yollar (src/lib/ilim-yolu/yollar.ts) ve yerleştirme testi (src/lib/ilim-yolu/yerlestirme.ts).
 * Bağlayıcı: her kart tam bir plan yolunda ve tam bir alan yolunda; yol kimlikleri geçerli; mini sınav yalnız hepsi doğruysa geçer;
 * yerleştirme alt kümesi seviye testi bankasından gelir (sesli/emekli/mezhebe bağlı yok), uyarlamalıdır (alt basamak geçilmeden üst sorulmaz),
 * puanı seviye testinin ölçütüyle verir ve en zayıf alanı önerir; aynı cevaplar aynı öneriyi üretir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(ad, girdi) {
  const cikti = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ stdin: { contents: girdi, resolveDir: process.cwd() }, outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
}
const m = await yukle('ilim-yolu-yollar-test', `
  export * from './src/lib/ilim-yolu/yollar.ts';
  export * from './src/lib/ilim-yolu/yerlestirme.ts';
  export { MADDELER } from './src/lib/seviye-testi/index.ts';
`);
const kartlar = readdirSync('src/data/ilim-yolu/kartlar').filter((a) => a.endsWith('.json'))
  .flatMap((a) => JSON.parse(readFileSync(`src/data/ilim-yolu/kartlar/${a}`, 'utf8')).kartlar);

test('yol kimlikleri: 5 plan + 7 alan + bilgi; biçim çözümü; geçersiz kimlik reddedilir', () => {
  assert.equal(m.TUM_YOLLAR.length, 13);
  assert.deepEqual(m.yolBicimi('plan-siyer'), { tur: 'plan', kod: 'siyer' });
  assert.deepEqual(m.yolBicimi('alan-kuranBilgi'), { tur: 'alan', alan: 'kuranBilgi' });
  assert.deepEqual(m.yolBicimi('bilgi'), { tur: 'bilgi' });
  for (const kotu of ['', 'plan-yok', 'alan-', 'plan', 'x', 'plan-ku']) assert.equal(m.yolBicimi(kotu), null);
  for (const y of m.TUM_YOLLAR) assert.ok(m.yolBicimi(y), y);
});

test('her kart tam bir plan yolunda ve tam bir alan yolunda; yol sıraları belirlenimci', () => {
  const planSay = new Map();
  const alanSay = new Map();
  for (const y of m.TUM_YOLLAR.filter((x) => x.startsWith('plan-'))) for (const k of m.yolKartlari(kartlar, y)) planSay.set(k.id, (planSay.get(k.id) ?? 0) + 1);
  for (const y of m.TUM_YOLLAR.filter((x) => x.startsWith('alan-'))) for (const k of m.yolKartlari(kartlar, y)) alanSay.set(k.id, (alanSay.get(k.id) ?? 0) + 1);
  assert.equal(planSay.size, 261);
  assert.equal(alanSay.size, 261);
  assert.ok([...planSay.values()].every((n) => n === 1));
  assert.ok([...alanSay.values()].every((n) => n === 1));
  assert.deepEqual(m.yolKartlari(kartlar, 'bilgi'), []);
  assert.deepEqual(m.yolKartlari(kartlar, 'x'), []);
  const a = m.yolKartlari(kartlar, 'alan-itikat').map((k) => k.id);
  assert.deepEqual(a, m.yolKartlari([...kartlar].reverse(), 'alan-itikat').map((k) => k.id), 'giriş sırasından bağımsız');
  const basamaklar = m.yolKartlari(kartlar, 'alan-itikat').map((k) => k.basamak);
  assert.deepEqual(basamaklar, [...basamaklar].sort((x, y) => x - y), 'alan yolu basamak sırasıyla');
  const gunler = m.yolKartlari(kartlar, 'plan-ahlak').map((k) => k.ilkDers);
  assert.deepEqual(gunler, [...gunler].sort(), 'plan yolu ilk işlenme gününe göre');
  for (const k of kartlar) assert.deepEqual(m.kartYollari(k), [`plan-${k.kod}`, `alan-${k.seviyeAlani}`]);
});

test('mini sınav: yalnız hepsi doğruysa geçer; işaretsiz soru yanlıştır; soru yoksa geçmez', () => {
  const sorular = [{ dogru: 1 }, { dogru: 0 }];
  assert.deepEqual(m.miniSinav(sorular, [1, 0]), { dogru: [true, true], hepsi: true });
  assert.deepEqual(m.miniSinav(sorular, [1, 2]), { dogru: [true, false], hepsi: false });
  assert.deepEqual(m.miniSinav(sorular, [1, -1]), { dogru: [true, false], hepsi: false });
  assert.deepEqual(m.miniSinav(sorular, []), { dogru: [false, false], hepsi: false });
  assert.deepEqual(m.miniSinav([], []), { dogru: [], hepsi: false });
});

const alt = m.yerlestirmeSorulari(m.MADDELER);
const dogruCevaplar = (olcut) => Object.fromEntries(alt.filter(olcut).map((q) => [q.id, q.dogru]));

test('yerleştirme alt kümesi: bankadan, sesli/emekli/mezhebe bağlı yok, alan ve basamak başına en çok 2, okuma K1–K3, diğerleri B1–B2', () => {
  const idler = new Set(m.MADDELER.map((q) => q.id));
  assert.ok(alt.length > 0 && alt.length <= 7 * 3 * 2);
  for (const q of alt) {
    assert.ok(idler.has(q.id));
    assert.ok(!q.emekli && !q.mezhepBagli && !q.ses, q.id);
    assert.ok(q.basamak <= (q.alan === 'okuma' ? 3 : 2), q.id);
  }
  for (const alan of m.ALANLAR) for (const b of [1, 2, 3]) assert.ok(alt.filter((q) => q.alan === alan && q.basamak === b).length <= m.BASAMAK_SORUSU);
  assert.equal(new Set(alt.map((q) => q.alan)).size, 7, 'yedi alanın hepsinden soru var');
  assert.equal(m.yerlestirmeSorulari(m.MADDELER).map((q) => q.id).join(), alt.map((q) => q.id).join(), 'belirlenimci');
});

test('uyarlama: ilk soru ilk alanın B1\'i; B1 geçilmezse B2 sorulmaz; geçilirse sorulur; hepsi cevaplanınca null', () => {
  assert.equal(m.siradaki(alt, {}).id, alt[0].id);
  const ilkAlan = alt[0].alan;
  const b1 = alt.filter((q) => q.alan === ilkAlan && q.basamak === 1);
  const b2 = alt.filter((q) => q.alan === ilkAlan && q.basamak === 2);
  // B1'in biri yanlış (−1): B2 hiç sorulmaz.
  const kotu = { [b1[0].id]: b1[0].dogru, [b1[1].id]: -1 };
  assert.ok(!b2.some((q) => m.siradaki(alt, kotu)?.id === q.id));
  assert.notEqual(m.siradaki(alt, kotu)?.alan, ilkAlan);
  // B1 ikisi doğru: sıradaki B2.
  const iyi = { [b1[0].id]: b1[0].dogru, [b1[1].id]: b1[1].dogru };
  assert.equal(m.siradaki(alt, iyi).id, b2[0].id);
  // Hepsi doğru cevaplanırsa test biter.
  assert.equal(m.siradaki(alt, dogruCevaplar(() => true)), null);
  // Her alan «bilmiyorum» ise yalnız B1 soruları sorulur ve test biter.
  let cevap = {};
  let say = 0;
  for (let q = m.siradaki(alt, cevap); q; q = m.siradaki(alt, cevap)) { cevap = { ...cevap, [q.id]: -1 }; say += 1; assert.ok(say <= alt.length); }
  assert.equal(say, alt.filter((q) => q.basamak === 1).length);
});

test('öneri: hepsi doğru → her alan en üst basamaktan; hiçbiri → 1. basamak; tek zayıf alan önerilir; aynı cevap aynı sonuç', () => {
  const tam = m.oner(alt, dogruCevaplar(() => true));
  for (const a of tam.alanlar) {
    assert.equal(a.duzey, a.alan === 'okuma' ? 3 : 2, a.alan);
    assert.equal(a.basamak, 3);
    assert.equal(a.yuzde, 100);
  }
  const hic = m.oner(alt, Object.fromEntries(alt.map((q) => [q.id, -1])));
  for (const a of hic.alanlar) { assert.equal(a.duzey, 0); assert.equal(a.basamak, 1); assert.equal(a.yuzde, 0); }
  assert.equal(hic.alanlar.length, 7);
  // Namaz dışında hepsi doğru, namazda hepsi bilinmiyor → namaz önerilir, 1. basamaktan.
  const namazZayif = m.oner(alt, { ...dogruCevaplar((q) => q.alan !== 'namaz'), ...Object.fromEntries(alt.filter((q) => q.alan === 'namaz').map((q) => [q.id, -1])) });
  assert.equal(namazZayif.onerilen.alan, 'namaz');
  assert.equal(namazZayif.onerilen.basamak, 1);
  // Siyer B1 tam, B2 yanlış → düzey 1, 2. basamaktan başlanır.
  const siyer = m.oner(alt, { ...dogruCevaplar((q) => q.alan !== 'siyer' || q.basamak === 1), ...Object.fromEntries(alt.filter((q) => q.alan === 'siyer' && q.basamak === 2).map((q) => [q.id, -1])) });
  const s = siyer.alanlar.find((a) => a.alan === 'siyer');
  assert.deepEqual([s.duzey, s.basamak], [1, 2]);
  assert.equal(siyer.onerilen.alan, 'siyer');
  assert.deepEqual(m.oner(alt, dogruCevaplar(() => true)), tam);
});
