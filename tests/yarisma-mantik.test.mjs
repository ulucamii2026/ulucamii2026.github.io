/**
 * Bilgi Yarışması'nın saf mantığı (10 Kasım 2026; src/lib/yarisma/): ortak puan kuralı, tur seçimi ve dağılımı, tohumla yinelenebilirlik,
 * ayarın adres çubuğunda gidip gelmesi ve kontrolden sonra yerinde kalan parçalar. Ekran bu işlevleri yalnız çizer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const modul = async (ad, giris) => {
  const cikti = resolve(`node_modules/.cache/yarisma-${ad}-test.mjs`);
  await build({ entryPoints: [giris], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
};
const p = await modul('puan', 'src/lib/yarisma/puan.ts');
const t = await modul('tur', 'src/lib/yarisma/tur.ts');
const y = await modul('yerlesim', 'src/lib/yarisma/yerlesim.ts');
const v = await modul('veri', 'src/lib/yarisma/veri.ts');

test('puan: ilk kontrolde 3, düzeltmeyle 1, cevap gösterilirse 0', () => {
  assert.equal(p.turPuani(1, true), 3);
  assert.equal(p.turPuani(2, true), 1);
  assert.equal(p.turPuani(2, false), 0);
  assert.equal(p.turPuani(0, false), 0);
});

test('puan: gizemli kutu ipucu sayısına göre 3 / 2 / 1, tükenirse 0', () => {
  assert.deepEqual([1, 2, 3, 4].map((n) => p.gizemliPuani(n, true)), [3, 2, 1, 1]);
  assert.equal(p.gizemliPuani(4, false), 0);
});

test('ortak puan: toplam, bant ve doku; oran asla dışarı çıkmaz', () => {
  assert.equal(p.toplamPuan([3, 1, 0, 2]), 6);
  assert.equal(p.toplamPuan([]), 0);
  assert.equal(p.bant(0, 10), 'ilk');
  assert.equal(p.bant(9, 10), 'ilk');
  assert.equal(p.bant(10, 10), 'orta');
  assert.equal(p.bant(19, 10), 'orta');
  assert.equal(p.bant(20, 10), 'yuksek');
  assert.equal(p.bant(30, 10), 'yuksek');
  assert.equal(p.bant(0, 0), 'ilk');
  assert.deepEqual([0, 1, 2, 3, 4].map(p.dokuma), [0, 1, 2, 3, 3]);
});

test('ayar adres çubuğunda gidip gelir; bozuk parçalar varsayılana düşer, hata fırlatmaz', () => {
  const a = { bicim: 'siralama', konular: ['siyer', 'ibadet'], seviye: '2-3', adet: 15, tohum: 'abc123' };
  const geri = t.ayarOku('#' + t.ayarYaz(a));
  assert.deepEqual({ ...geri, konular: [...geri.konular] }, { ...a, konular: ['itikat', 'ibadet', 'siyer', 'ahlak', 'kuran'].filter((x) => a.konular.includes(x)) });
  const bozuk = t.ayarOku('#f=x&k=yok,siyer&d=9&n=7&s=%3Cscript%3E', () => 'uretildi');
  assert.equal(bozuk.bicim, 'karisik');
  assert.deepEqual([...bozuk.konular], ['siyer']);
  assert.equal(bozuk.seviye, '1-2');
  assert.equal(bozuk.adet, 10);
  assert.equal(bozuk.tohum, 'uretildi');
  const bos = t.ayarOku('', () => 's1');
  assert.deepEqual([bos.bicim, bos.adet, bos.seviye, bos.tohum, bos.konular.length], ['karisik', 10, '1-2', 's1', 5]);
});

test('havuz: biçim, konu ve seviye bandına göre süzer', () => {
  const ayar = { bicim: 'quiz', konular: ['siyer'], seviye: '1', adet: 10, tohum: 'a' };
  const h = t.havuz(v.SORULAR, ayar);
  assert.ok(h.length > 0);
  assert.ok(h.every((s) => s.format === 'quiz' && s.topic === 'siyer' && s.level === 1));
  const buyuk = t.havuz(v.SORULAR, { ...ayar, seviye: '2-3' });
  assert.ok(buyuk.every((s) => s.level >= 2));
  assert.equal(t.havuz(v.SORULAR, { ...ayar, konular: [] }).length, 0);
});

test('turDagit: aynı tohum aynı oyun, farklı tohum farklı; tekrarsız, adet kadar', () => {
  const ayar = { bicim: 'karisik', konular: v.KONULAR, seviye: '1-2', adet: 10, tohum: 'sinif-7' };
  const a = t.turDagit(v.SORULAR, ayar).map((s) => s.id);
  const b = t.turDagit(v.SORULAR, ayar).map((s) => s.id);
  assert.deepEqual(a, b);
  assert.equal(a.length, 10);
  assert.equal(new Set(a).size, 10);
  const c = t.turDagit(v.SORULAR, { ...ayar, tohum: 'sinif-8' }).map((s) => s.id);
  assert.notDeepEqual(a, c);
});

test('karışık 10 tur: 4 sınav, 2 sıralama, 1 gruplama, 1 eşleştirme, 2 gizemli; yan yana aynı biçim yok', () => {
  for (let i = 0; i < 60; i++) {
    const ayar = { bicim: 'karisik', konular: v.KONULAR, seviye: '1-2', adet: 10, tohum: 'k' + i };
    const turlar = t.turDagit(v.SORULAR, ayar);
    const say = Object.fromEntries(v.BICIMLER.map((b) => [b, turlar.filter((s) => s.format === b).length]));
    assert.deepEqual(say, { quiz: 4, siralama: 2, gruplama: 1, eslestirme: 1, gizemli: 2 }, 'tohum ' + i);
    for (let j = 1; j < turlar.length; j++) assert.notEqual(turlar[j].format, turlar[j - 1].format, `tohum ${i}, tur ${j}`);
  }
});

test('karışık dağılım: 5 ve 15 tur; kapasite yetmeyen biçim kırpılır, artan boş yere dağıtılır', () => {
  const tam = { quiz: 99, siralama: 99, gruplama: 99, eslestirme: 99, gizemli: 99 };
  assert.equal(Object.values(t.karisikDagilim(5, tam)).reduce((a, b) => a + b, 0), 5);
  assert.deepEqual(t.karisikDagilim(15, tam), { quiz: 6, siralama: 3, gruplama: 2, eslestirme: 1, gizemli: 3 });
  const dar = t.karisikDagilim(10, { quiz: 99, siralama: 0, gruplama: 1, eslestirme: 0, gizemli: 1 });
  assert.deepEqual(dar, { quiz: 8, siralama: 0, gruplama: 1, eslestirme: 0, gizemli: 1 });
  const azi = t.karisikDagilim(10, { quiz: 2, siralama: 1, gruplama: 0, eslestirme: 0, gizemli: 0 });
  assert.equal(Object.values(azi).reduce((a, b) => a + b, 0), 3);
});

test('küçük havuzda daha az tur gelir, boşsa boş; hassas kutu hiçbir ayarda gelmez', () => {
  const dar = { bicim: 'gruplama', konular: ['kuran'], seviye: '1', adet: 10, tohum: 'z' };
  assert.deepEqual(t.turDagit(v.SORULAR, dar), []);
  const tek = { bicim: 'gizemli', konular: v.KONULAR, seviye: '1-2', adet: 15, tohum: 'z' };
  const gelen = t.turDagit(v.SORULAR, tek);
  assert.ok(gelen.length > 0 && gelen.length <= 15);
  for (const sev of ['1', '1-2', '2-3']) for (const bicim of ['karisik', 'gizemli']) {
    for (let i = 0; i < 20; i++) {
      assert.equal(t.turDagit(v.SORULAR, { bicim, konular: v.KONULAR, seviye: sev, adet: 15, tohum: 'h' + i }).some((s) => v.HASSAS.has(s.id)), false);
    }
  }
});

test('sunum: dilden bağımsız ve tohumlu; sıralama asla çözülmüş gelmez; eşleştirmede hiçbir satır hizalı başlamaz', () => {
  for (const s of v.SORULAR) {
    const n = v.parcaSayisi(s);
    const a = t.sunumHazirla(s, n, 'tohum').sira;
    assert.deepEqual(a, t.sunumHazirla(s, n, 'tohum').sira);
    assert.deepEqual([...a].sort((x, z) => x - z), Array.from({ length: n }, (_, i) => i), s.id);
    if (s.format === 'siralama') assert.ok(a.some((x, i) => x !== i), s.id + ' çözülmüş geldi');
    if (s.format === 'eslestirme') assert.ok(a.every((x, i) => x !== i), s.id + ' hizalı satır var');
  }
});

test('sabitli taşıma: sabit parçalar yerinde kalır, hareket sabitleri atlar, sınırda aynı dizi', () => {
  assert.deepEqual(y.tasiSabitli([2, 1, 0, 3], [false, true, false, true], 0, 1), [0, 1, 2, 3]);
  assert.deepEqual(y.tasiSabitli([2, 1, 0, 3], [false, true, false, true], 2, -1), [0, 1, 2, 3]);
  assert.deepEqual(y.tasiSabitli([2, 1, 0, 3], [false, true, false, true], 1, 1), [2, 1, 0, 3], 'sabit parça taşınmaz');
  assert.deepEqual(y.tasiSabitli([2, 1, 0, 3], [false, true, false, true], 2, 1), [2, 1, 0, 3], 'öte yanda boş konum yok');
  assert.deepEqual(y.tasiSabitli([1, 0], [false, false], 0, -1), [1, 0]);
});

test('gruplama sonucu: havuzdaki kart ne doğru ne yanlış; yanlışlar listelenir', () => {
  const s = y.gruplamaDegerlendir([0, 1, -1, 0], [0, 1, 1, 1]);
  assert.deepEqual([...s.dogru], [true, true, false, false]);
  assert.deepEqual([...s.yanlis], [3]);
  assert.equal(s.eksik, 1);
  assert.equal(s.tamam, false);
  assert.equal(y.gruplamaDegerlendir([0, 1, 1], [0, 1, 1]).tamam, true);
  assert.throws(() => y.gruplamaDegerlendir([0], [0, 1]), RangeError);
});

test('eşleştirme: yanlış çiftler boşaltılır, doğrular kalır', () => {
  const s = y.yanlisCiftleriBosalt([0, 2, 1, null]);
  assert.deepEqual(s.cevap, [0, null, null, null]);
  assert.deepEqual(s.birakilan, [1, 2]);
});

test('bir tur geri: puan tutarlı düzeltilir (çözülmüş tur, çözülmemiş tur, son ekran, ilk tur)', () => {
  // 2. tur çözüldü (puanlar [3, 1], i = 1): bu tur geri alınır, 1. turun puanı kalır.
  assert.deepEqual(p.turGeri([3, 1], 1, 'geri', 5), { puanlar: [3], i: 1 });
  assert.equal(p.toplamPuan(p.turGeri([3, 1], 1, 'geri', 5).puanlar), 3);
  // 3. tur açık ama çözülmedi (puanlar [3, 1], i = 2): önceki (2.) tur silinir ve yeniden açılır.
  assert.deepEqual(p.turGeri([3, 1], 2, 'soru', 5), { puanlar: [3], i: 1 });
  // İlk tur çözülmediyse geri yok; çözüldüyse aynı tur baştan.
  assert.equal(p.turGeri([], 0, 'soru', 5), null);
  assert.deepEqual(p.turGeri([2], 0, 'geri', 5), { puanlar: [], i: 0 });
  // Son ekran: son tur silinir.
  assert.deepEqual(p.turGeri([3, 3, 0], 2, 'son', 3), { puanlar: [3, 3], i: 2 });
  // Girdi değiştirilmez; üst üste geri alma puanı tek tek düşürür.
  const once = [3, 1, 2];
  const bir = p.turGeri(once, 3, 'soru', 4);
  assert.deepEqual(once, [3, 1, 2]);
  const iki = p.turGeri(bir.puanlar, bir.i, 'soru', 4);
  assert.deepEqual(iki, { puanlar: [3], i: 1 });
});
