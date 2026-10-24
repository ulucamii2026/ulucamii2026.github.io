/**
 * Tekrar takvimi ve kendini sınama oyunları (Faz 2d, 24 Ekim 2026): saf kütüphaneler src/lib/ezber/{tekrar,oyun}.ts. Ekran bu
 * kararları çizer; burada takvim aralıkları, tarih aritmetiği, tohumlu karıştırma ve soruların doğruluğu sabitlenir. Gerçek
 * Kur'an ve dua metinleri veri dosyalarından okunur: testte dinî metin yazılmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(ad) {
  const cikti = resolve(`node_modules/.cache/ezber-${ad}-test.mjs`);
  await build({ entryPoints: [`src/lib/ezber/${ad}.ts`], outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
}
const t = await yukle('tekrar');
const o = await yukle('oyun');
const g = await yukle('gizleme');

const KLASOR = 'src/data/ezber/metin';
const metinler = readdirSync(KLASOR).filter((d) => /^[sdb]-.*\.json$/.test(d)).map((d) => JSON.parse(readFileSync(`${KLASOR}/${d}`, 'utf8')));
const kelimeler = (m) => m.bolumler.map((b) => g.kelimeler(b.ar));

// ——— tekrar takvimi ———
test('gunEkle: ay, yıl ve artık yıl sınırlarını geçer; geriye de gider', () => {
  assert.equal(t.gunEkle('2026-10-24', 7), '2026-10-31');
  assert.equal(t.gunEkle('2026-10-24', 30), '2026-11-23');
  assert.equal(t.gunEkle('2026-12-31', 1), '2027-01-01');
  assert.equal(t.gunEkle('2028-02-28', 1), '2028-02-29');
  assert.equal(t.gunEkle('2027-02-28', 1), '2027-03-01');
  assert.equal(t.gunEkle('2026-10-24', -6), '2026-10-18');
  assert.equal(t.gunEkle('2026-10-24', 0), '2026-10-24');
});

test('tarihMi: yalnız gerçek takvim günleri', () => {
  for (const iyi of ['2026-10-24', '2028-02-29']) assert.equal(t.tarihMi(iyi), true, iyi);
  for (const kotu of ['2026-02-30', '2027-02-29', '2026-13-01', '24.10.2026', '', null, 20261024]) assert.equal(t.tarihMi(kotu), false, String(kotu));
});

test('yerelGun: cihazın takvim günü, iki haneli', () => {
  assert.equal(t.yerelGun(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(t.yerelGun(new Date(2026, 11, 31, 0, 1)), '2026-12-31');
});

test('sonrakiTekrar: kutular 1·3·7·14·30; tam yükseltir, az yerinde bırakır, bir daha başa döner', () => {
  assert.deepEqual([...t.KUTU_GUN], [1, 3, 7, 14, 30]);
  let k = { kutu: -1, sonraki: '' };
  const gunler = [];
  for (let i = 0; i < 6; i++) {
    k = t.sonrakiTekrar(k.kutu, 'tam', '2026-10-24');
    gunler.push(k.sonraki);
  }
  assert.deepEqual(gunler, ['2026-10-25', '2026-10-27', '2026-10-31', '2026-11-07', '2026-11-23', '2026-11-23']);
  assert.equal(k.kutu, 4);
  assert.deepEqual(t.sonrakiTekrar(2, 'az', '2026-10-24'), { kutu: 2, sonraki: '2026-10-31' });
  assert.deepEqual(t.sonrakiTekrar(-1, 'az', '2026-10-24'), { kutu: 0, sonraki: '2026-10-25' });
  assert.deepEqual(t.sonrakiTekrar(4, 'tekrar', '2026-10-24'), { kutu: 0, sonraki: '2026-10-25' });
  // Bozuk kutu değeri güvenle ele alınır.
  assert.deepEqual(t.sonrakiTekrar(99, 'tam', '2026-10-24'), { kutu: 4, sonraki: '2026-11-23' });
  assert.deepEqual(t.sonrakiTekrar(Number.NaN, 'tam', '2026-10-24'), { kutu: 0, sonraki: '2026-10-25' });
});

test('bugunTekrar: günü gelen ya da geçen maddeler, en eski önce; tarihsiz ve gelecek tarihliler yok', () => {
  const m = {
    'a-yeni': { sonraki: '2026-10-24' },
    'b-eski': { sonraki: '2026-10-20' },
    'c-gelecek': { sonraki: '2026-10-25' },
    'd-bos': { sonraki: '' },
    'e-eski': { sonraki: '2026-10-20' },
    'f-bozuk': { sonraki: '2026-02-30' },
  };
  assert.deepEqual(t.bugunTekrar(m, '2026-10-24'), ['b-eski', 'e-eski', 'a-yeni']);
  assert.deepEqual(t.bugunTekrar(m, '2026-10-19'), []);
  assert.deepEqual(t.bugunTekrar({}, '2026-10-24'), []);
});

test('gunuIsle ve haftaGunu: tekil, sıralı, sınırlı; yedi günlük pencere bugün dâhil', () => {
  let gunler = [];
  gunler = t.gunuIsle(gunler, '2026-10-24');
  gunler = t.gunuIsle(gunler, '2026-10-24');
  gunler = t.gunuIsle(gunler, '2026-10-22');
  assert.deepEqual(gunler, ['2026-10-22', '2026-10-24']);
  assert.deepEqual(t.gunuIsle(gunler, 'bozuk'), gunler);
  assert.equal(t.haftaGunu(gunler, '2026-10-24'), 2);
  assert.equal(t.haftaGunu(['2026-10-17', '2026-10-18', '2026-10-24'], '2026-10-24'), 2, '17 Ekim pencerenin dışındadır');
  assert.equal(t.haftaGunu(['2026-10-18'], '2026-10-24'), 1, '18 Ekim yedinci gündür');
  assert.equal(t.haftaGunu([], '2026-10-24'), 0);
  let uzun = [];
  for (let i = 0; i < 40; i++) uzun = t.gunuIsle(uzun, t.gunEkle('2026-09-01', i));
  assert.equal(uzun.length, 21);
  assert.equal(uzun.at(-1), '2026-10-10');
});

// ——— oyun ———
test('tohum ve rastgele: aynı tohum aynı dizi, [0,1) aralığı, farklı tohum farklı dizi', () => {
  assert.equal(o.tohum('s-ihlas'), o.tohum('s-ihlas'));
  assert.notEqual(o.tohum('s-ihlas'), o.tohum('s-nas'));
  const a = o.rastgele(7);
  const b = o.rastgele(7);
  const dizi = Array.from({ length: 200 }, () => a());
  assert.deepEqual(dizi, Array.from({ length: 200 }, () => b()));
  assert.ok(dizi.every((x) => x >= 0 && x < 1));
  assert.ok(new Set(dizi).size > 190);
  assert.notDeepEqual(dizi.slice(0, 5), Array.from({ length: 5 }, ((c) => () => c())(o.rastgele(8))));
});

test('karistir: elemanları korur, girdiyi değiştirmez; farkliSira asla asıl sıra değildir', () => {
  const girdi = [1, 2, 3, 4, 5];
  const s = o.karistir(girdi, o.rastgele(3));
  assert.deepEqual(girdi, [1, 2, 3, 4, 5]);
  assert.deepEqual([...s].sort(), girdi);
  for (let n = 2; n <= 10; n++) {
    for (let tohum = 0; tohum < 200; tohum++) {
      const p = o.farkliSira(n, o.rastgele(tohum));
      assert.deepEqual([...p].sort((x, y) => x - y), Array.from({ length: n }, (_, i) => i));
      assert.equal(o.siraDogru(p), false, `n=${n} tohum=${tohum}`);
    }
  }
  assert.deepEqual(o.farkliSira(1, o.rastgele(1)), [0]);
  assert.deepEqual(o.farkliSira(0, o.rastgele(1)), []);
});

test('yerindeSayisi ve siraDogru', () => {
  assert.equal(o.yerindeSayisi([0, 1, 2, 3]), 4);
  assert.equal(o.yerindeSayisi([1, 0, 2, 3]), 2);
  assert.equal(o.yerindeSayisi([3, 2, 1, 0]), 0);
  assert.equal(o.siraDogru([0, 1, 2]), true);
  assert.equal(o.siraDogru([0, 2, 1]), false);
});

test('parcalaKelimeler: eşit öbekler, kelimeler kaybolmaz, çok kısa metinde boş', () => {
  const k = (n) => Array.from({ length: n }, (_, i) => `w${i}`);
  assert.deepEqual(o.parcalaKelimeler(k(4)), []);
  assert.deepEqual(o.parcalaKelimeler(k(6)), ['w0 w1 w2', 'w3 w4 w5']);
  for (const n of [5, 7, 9, 10, 13, 18, 30, 55]) {
    const p = o.parcalaKelimeler(k(n));
    assert.ok(p.length >= 2 && p.length <= 6, `n=${n}: ${p.length} parça`);
    assert.equal(p.join(' '), k(n).join(' '));
    const boylar = p.map((x) => x.split(' ').length);
    assert.ok(Math.max(...boylar) - Math.min(...boylar) <= 1, `n=${n}: parçalar eşit değil`);
  }
});

test('iskelet: harekeler, durak işaretleri ve uzatma çizgisi atılır', () => {
  assert.equal(o.iskelet('قَلَمٌ'), 'قلم');
  assert.equal(o.iskelet('كِتَابٌۚ'), 'كتاب');
  assert.equal(o.iskelet('ـقلم'), 'قلم');
});

test('eksikKelimeSorulari: doğru kelime metindendir, seçenekler üç ve iskeletçe farklı, aynı tohum aynı sorular', () => {
  const m = metinler.find((x) => x.id === 's-ihlas');
  const kel = kelimeler(m);
  const sorular = o.eksikKelimeSorulari(kel, 4, o.rastgele(o.tohum('s-ihlas')));
  assert.equal(sorular.length, 4);
  assert.equal(new Set(sorular.map((s) => s.bolum)).size, 4, 'her bölümden bir soru');
  for (const s of sorular) {
    assert.equal(kel[s.bolum][s.sira], s.dogru);
    assert.equal(s.secenekler.length, 3);
    assert.equal(s.secenekler[s.dogruSecenek], s.dogru);
    assert.equal(new Set(s.secenekler.map(o.iskelet)).size, 3);
  }
  assert.deepEqual(sorular, o.eksikKelimeSorulari(kel, 4, o.rastgele(o.tohum('s-ihlas'))));
});

test('eksikKelimeSorulari: bütün gerçek maddelerde hata vermez; üretilen her soru geçerlidir', () => {
  let sorulu = 0;
  for (const m of metinler) {
    const kel = kelimeler(m);
    const sorular = o.eksikKelimeSorulari(kel, 5, o.rastgele(o.tohum(m.id)));
    if (sorular.length) sorulu++;
    for (const s of sorular) {
      assert.equal(kel[s.bolum][s.sira], s.dogru, m.id);
      assert.equal(s.secenekler[s.dogruSecenek], s.dogru, m.id);
      assert.equal(new Set(s.secenekler.map(o.iskelet)).size, s.secenekler.length, m.id);
    }
    assert.ok(sorular.length <= 5);
  }
  assert.ok(sorulu >= metinler.length * 0.9, `yalnız ${sorulu}/${metinler.length} maddede soru çıktı`);
  // Seçenek havuzu yetersizse (iki kelimelik madde) soru üretilmez, hata da vermez.
  assert.deepEqual(o.eksikKelimeSorulari([['قَلَمٌ', 'كِتَابٌ']], 3, o.rastgele(1)), []);
});

test('hangiAyetSorulari: doğru bölüm seçeneklerde, seçenekler tekil; havuz küçükse soru yok', () => {
  const sorular = o.hangiAyetSorulari([0, 1, 2, 3], [0, 1, 2, 3], 3, o.rastgele(5));
  assert.equal(sorular.length, 3);
  assert.equal(new Set(sorular.map((s) => s.bolum)).size, 3);
  for (const s of sorular) {
    assert.equal(s.secenekler.length, 3);
    assert.equal(new Set(s.secenekler).size, 3);
    assert.equal(s.secenekler[s.dogruSecenek], s.bolum);
  }
  assert.deepEqual(o.hangiAyetSorulari([0, 1], [0, 1], 3, o.rastgele(5)), []);
  assert.deepEqual(o.hangiAyetSorulari([7], [0, 1, 2, 3], 3, o.rastgele(5)), [], 'sesli bölüm grup dışındaysa sorulmaz');
});


test('gunFarki: gün sayısı; ay, yıl, artık yıl ve yaz saati sınırlarını aşar; geçmiş negatiftir', () => {
  assert.equal(t.gunFarki('2026-10-24', '2026-10-24'), 0);
  assert.equal(t.gunFarki('2026-10-24', '2026-10-25'), 1);
  assert.equal(t.gunFarki('2026-10-24', '2026-11-23'), 30);
  assert.equal(t.gunFarki('2026-12-31', '2027-01-01'), 1);
  assert.equal(t.gunFarki('2028-02-28', '2028-03-01'), 2);
  assert.equal(t.gunFarki('2027-02-28', '2027-03-01'), 1);
  assert.equal(t.gunFarki('2026-10-24', '2026-10-20'), -4);
  // Avrupa yaz saati bitişi (25 Ekim 2026) günü 25 saattir; gün sayısı yine 1'dir.
  assert.equal(t.gunFarki('2026-10-24', '2026-10-26'), 2);
  // gunEkle ile tutarlı: gunFarki(a, gunEkle(a, n)) === n
  for (const n of [-40, -1, 0, 1, 7, 30, 365]) assert.equal(t.gunFarki('2026-10-24', t.gunEkle('2026-10-24', n)), n);
});

// ——— anlamla eşleştir (Faz 2e) ———
const mmodul = await yukle('madde-metni');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];

test('anlamBloklari: bölüm aralıklarına bağlanır, hepsi maddenin içinde ve sıralıdır; gözden geçirilmemiş taslak meâlde boş döner', () => {
  let oyunlu = 0;
  for (const m of metinler) {
    for (const dil of DILLER) {
      const bloklar = mmodul.anlamBloklari(m, dil);
      const meal = mmodul.sayfaMeali(m, dil);
      if (!meal || meal.inceleme) { assert.deepEqual(bloklar, [], `${m.id}/${dil}: taslak ya da meâlsiz dilde oyun bloğu olmaz`); continue; }
      if (bloklar.length) oyunlu++;
      let onceki = 0;
      for (const b of bloklar) {
        assert.ok(b.bas >= 0 && b.son > b.bas && b.son <= m.bolumler.length, `${m.id}/${dil}: aralık madde dışında`);
        assert.ok(b.bas >= onceki, `${m.id}/${dil}: bloklar sıralı olmalı`);
        assert.ok(b.meal.trim().length > 0);
        onceki = b.son;
      }
    }
  }
  assert.ok(oyunlu > 100, `oyun kurulabilen madde × dil sayısı beklenenden az: ${oyunlu}`);
});

test('anlamBloklari: NL taslak meâl her zaman dışarıda, inceleme işareti kalkmışsa içeride', () => {
  const m = structuredClone(metinler.find((x) => x.id === 's-ihlas'));
  assert.equal(m.meal.nl.inceleme, true, 'veri değişmiş: NL taslak işareti kalkmışsa bu test elle güncellenir');
  assert.deepEqual(mmodul.anlamBloklari(m, 'nl'), []);
  delete m.meal.nl.inceleme;
  assert.ok(mmodul.anlamBloklari(m, 'nl').length >= 1, 'gözden geçirilmiş meâl oyuna girer');
});

test('anlamAdaylari: kısmı tam kapsayan bloklar; ikiden azsa maddenin bütün blokları; boş meâl elenir', () => {
  const b = [{ bas: 0, son: 2, meal: 'a' }, { bas: 2, son: 3, meal: 'b' }, { bas: 3, son: 5, meal: 'c' }, { bas: 5, son: 6, meal: '  ' }, { bas: 6, son: 7, meal: 'e' }];
  assert.deepEqual(o.anlamAdaylari(b, 0, 5), [0, 1, 2]);
  assert.deepEqual(o.anlamAdaylari(b, 2, 6), [1, 2], 'kısım sınırını aşan blok (0–2) dışarıda; boş meâl (5–6) elenir');
  assert.deepEqual(o.anlamAdaylari(b, 3, 6), [0, 1, 2, 4], 'kısımda yalnız bir blok var: maddenin hepsi');
  assert.deepEqual(o.anlamAdaylari([], 0, 5), []);
});

test('eslestirmeTuru: sol metin sırasında, sağ karışık (asıl sırayla aynı değil), aynı kimlikler; tekil anlam; aynı tohum aynı tur', () => {
  const meal = ['bir', 'iki', 'üç', 'dört', 'beş', 'altı'];
  for (let tohum = 0; tohum < 300; tohum++) {
    const tur = o.eslestirmeTuru([0, 1, 2, 3, 4, 5], (i) => meal[i], 3, o.rastgele(tohum));
    assert.equal(tur.sol.length, 3);
    assert.deepEqual([...tur.sol], [...tur.sol].sort((a, b) => a - b), 'Arapça sütun metin sırasında');
    assert.deepEqual([...tur.sag].sort((a, b) => a - b), [...tur.sol]);
    assert.notDeepEqual(tur.sag, tur.sol, `tohum ${tohum}: anlam sütunu karışık gelmeli`);
    assert.equal(new Set(tur.sol).size, 3);
  }
  const a = o.eslestirmeTuru([0, 1, 2, 3], (i) => meal[i], 3, o.rastgele(9));
  assert.deepEqual(a, o.eslestirmeTuru([0, 1, 2, 3], (i) => meal[i], 3, o.rastgele(9)));
  // İki blok aynı anlamı taşıyorsa biri elenir: eşleşme belirsiz kalmaz.
  const ayni = ['x', 'x', 'y', 'z'];
  for (let tohum = 0; tohum < 100; tohum++) {
    const tur = o.eslestirmeTuru([0, 1, 2, 3], (i) => ayni[i], 3, o.rastgele(tohum));
    assert.equal(new Set(tur.sol.map((i) => ayni[i])).size, tur.sol.length);
  }
  // Yeterli blok yoksa tur kurulmaz.
  assert.equal(o.eslestirmeTuru([0], (i) => meal[i], 3, o.rastgele(1)), null);
  assert.equal(o.eslestirmeTuru([0, 1], () => 'aynı', 3, o.rastgele(1)), null);
  assert.equal(o.eslestirmeTuru([], () => 'x', 3, o.rastgele(1)), null);
  // İki blokluk madde: tur iki eşleşmeden oluşur ve sağ sütun ters gelir.
  const iki = o.eslestirmeTuru([4, 7], (i) => meal[i % 6], 3, o.rastgele(2));
  assert.deepEqual([...iki.sol], [4, 7]);
  assert.deepEqual([...iki.sag], [7, 4]);
});

test('Gerçek maddelerde eşleştirme turu: oyun açılan her madde × dilde geçerli tur kurulur', () => {
  let acilan = 0;
  for (const m of metinler) {
    for (const dil of DILLER) {
      const bloklar = mmodul.anlamBloklari(m, dil);
      const gr = (n, boy = 5) => { const g = []; for (let b = 0; b < n; b += boy) g.push([b, Math.min(n, b + boy)]); return g; };
      for (const [bas, son] of gr(m.bolumler.length)) {
        const tur = o.eslestirmeTuru(o.anlamAdaylari(bloklar, bas, son), (i) => bloklar[i].meal, 3, o.rastgele(o.tohum(m.id + dil)));
        if (!tur) continue;
        acilan++;
        assert.ok(tur.sol.every((i) => i >= 0 && i < bloklar.length));
        assert.ok(tur.sol.length >= 2 && tur.sol.length <= 3);
      }
    }
  }
  assert.ok(acilan > 200, `açılan oyun sayısı beklenenden az: ${acilan}`);
});

// ——— senin sıran (Faz 2e) ———
const s = await yukle('sira');

test('siraSuresiMs: kaydın süresinin katı; 0 katsayı bekleme yok; süre bilinmiyorsa 3 sn; 2–90 sn sınırı; yavaş çalma uzatır', () => {
  assert.deepEqual([...s.SIRA_KATSAYILARI], [0, 1, 1.5, 2]);
  assert.equal(s.siraSuresiMs(10, 0), 0);
  assert.equal(s.siraSuresiMs(10, 1), 10_000);
  assert.equal(s.siraSuresiMs(10, 1.5), 15_000);
  assert.equal(s.siraSuresiMs(10, 2), 20_000);
  assert.equal(s.siraSuresiMs(6, 1, 0.75), 8_000, '0,75× çalınan 6 sn’lik kayıt 8 sn sürer');
  assert.equal(s.siraSuresiMs(0.4, 1), 2_000, 'çok kısa kayıtta alt sınır');
  assert.equal(s.siraSuresiMs(300, 2), 90_000, 'çok uzun kayıtta üst sınır');
  for (const bilinmeyen of [Number.NaN, 0, -3, Number.POSITIVE_INFINITY, undefined]) {
    assert.equal(s.siraSuresiMs(bilinmeyen, 1), 3_000, `süre ${bilinmeyen}`);
    assert.equal(s.siraSuresiMs(bilinmeyen, 0), 0, 'katsayı 0 ise süre bilinmese de bekleme yok');
  }
  assert.equal(s.siraSuresiMs(10, 1, 0), 10_000, 'bozuk hız 1 sayılır');
});

test('siraKatsayisi: yalnız listedeki değerler; virgüllü yazım ve bozuk girdi varsayılana döner', () => {
  assert.equal(s.siraKatsayisi('0'), 0);
  assert.equal(s.siraKatsayisi('1'), 1);
  assert.equal(s.siraKatsayisi('1.5'), 1.5);
  assert.equal(s.siraKatsayisi('1,5'), 1.5);
  assert.equal(s.siraKatsayisi('2'), 2);
  for (const kotu of ['3', '-1', 'abc', '', null, undefined, Number.NaN]) assert.equal(s.siraKatsayisi(kotu), s.SIRA_VARSAYILAN, String(kotu));
});
