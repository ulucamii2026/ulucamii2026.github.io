import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { YATAY_ESIGI, duzenSec, olcekKur, tuvalGeometrisi } from '../src/ekran/olcek.ts';

/* Kayan noktalı ölçüler bire bir tutmayabilir (961 × 9/16 × 16/9 gibi); dönüşüm dizgisi ise harfi harfine eşleşmeli. */
const yakin = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

/** `beklenen` içinde yazılmayan alan denetlenmez; düzen her zaman denetlenir. */
function esles(sonuc, beklenen, tol = 1e-9) {
  assert.equal(sonuc.duzen, beklenen.duzen);
  for (const alan of ['genislik', 'yukseklik', 'u']) {
    if (beklenen[alan] !== undefined) assert.ok(yakin(sonuc[alan], beklenen[alan], tol), `${alan}: ${sonuc[alan]} ≠ ${beklenen[alan]}`);
  }
  if (beklenen.donusum !== undefined) assert.equal(sonuc.donusum, beklenen.donusum);
}

test('düzen eşiği 1,2: alan oranı buna ulaşınca yatay, altında dikey; yükseklik 0 ise dikey; tercih her şeyi ezer', () => {
  assert.equal(YATAY_ESIGI, 1.2);
  assert.equal(duzenSec(1200, 1000, null), 'yatay');
  assert.equal(duzenSec(1199, 1000, null), 'dikey');
  assert.equal(duzenSec(1000, 1000, null), 'dikey');
  assert.equal(duzenSec(1000, 0, null), 'dikey');
  assert.equal(duzenSec(1000, -1, null), 'dikey');
  assert.equal(duzenSec(1000, 1000, 'yatay'), 'yatay');
  assert.equal(duzenSec(1920, 1080, 'dikey'), 'dikey');
  assert.equal(duzenSec(1000, 0, 'yatay'), 'yatay'); // tercih, yükseklik korumasından önce gelir
});

/* [etiket, [W, H, don, tercih], beklenen, tolerans?]. Tolerans yalnız kesirli boyut satırında 1e-6, ötekilerde 1e-9.
   u her zaman tuvalin KISA kenarının %1'idir: dikeyde genişlik, yatayda yükseklik (1080 px'te ikisi de 10,8). */
const SATIRLAR = [
  ['1080p yatay TV alanı tam doldurur', [1920, 1080, 0, null], { duzen: 'yatay', genislik: 1920, yukseklik: 1080, u: 10.8, donusum: 'translate(0px, 0px)' }],
  ['720p yatay TV', [1280, 720, 0, null], { duzen: 'yatay', genislik: 1280, yukseklik: 720, u: 7.2 }],
  ['961×541: 16:9 yuvarlaması alanın altında kalır, alana yapışır', [961, 541, 0, null], { duzen: 'yatay', genislik: 961, yukseklik: 541, u: 5.41, donusum: 'translate(0px, 0px)' }],
  ['kesirli TV boyutu 961,5023×540,8451: kenarda alt-piksellik çizgi kalmaz', [961.5023, 540.8451, 0, null], { duzen: 'yatay', genislik: 961.5023, yukseklik: 540.8451, u: 5.408451, donusum: 'translate(0px, 0px)' }, 1e-6],
  ['1366×768: genişlik 1366’ya yapışır, yükseklik 768', [1366, 768, 0, null], { duzen: 'yatay', genislik: 1366, yukseklik: 768, u: 7.68, donusum: 'translate(0px, 0px)' }],
  ['1920,99×1080: 16:9 genişliği (1920) alanın 1 pikselden az altında kalır, alana yapışır', [1920.99, 1080, 0, null], { duzen: 'yatay', genislik: 1920.99, yukseklik: 1080, u: 10.8, donusum: 'translate(0px, 0px)' }],
  ['1921×1080: tam 1 piksellik pay gerçek şerit sayılır, doldurulmaz (iki kenarda 0,5 px)', [1921, 1080, 0, null], { duzen: 'yatay', genislik: 1920, yukseklik: 1080, u: 10.8, donusum: 'translate(0.5px, 0px)' }],
  ['1920×1200 (16:10): tuval ortalanır, altta ve üstte 60 px pay', [1920, 1200, 0, null], { duzen: 'yatay', genislik: 1920, yukseklik: 1080, u: 10.8, donusum: 'translate(0px, 60px)' }],
  ['dikey pencere, döndürme yok: bugünkü sonuç', [1080, 1920, 0, null], { duzen: 'dikey', genislik: 1080, yukseklik: 1920, u: 10.8, donusum: 'translate(0px, 0px)' }],
  ['yatay pencere, don=90: dikey tuval, bugünkü sonuç', [1920, 1080, 90, null], { duzen: 'dikey', genislik: 1080, yukseklik: 1920, u: 10.8, donusum: 'translate(1920px, 0px) rotate(90deg)' }],
  ['yatay pencere, don=270: dikey tuval, bugünkü sonuç', [1920, 1080, 270, null], { duzen: 'dikey', genislik: 1080, yukseklik: 1920, u: 10.8, donusum: 'translate(0px, 1080px) rotate(270deg)' }],
  ['dikey pencere, don=90: döndürülünce alan yatay olur', [1080, 1920, 90, null], { duzen: 'yatay', genislik: 1920, yukseklik: 1080, u: 10.8, donusum: 'translate(1080px, 0px) rotate(90deg)' }],
  ['dikey pencere, don=270: döndürülünce alan yatay olur', [1080, 1920, 270, null], { duzen: 'yatay', genislik: 1920, yukseklik: 1080, u: 10.8, donusum: 'translate(0px, 1920px) rotate(270deg)' }],
  ['yatay pencerede dikey zorlanır: u tuval genişliğinin %1’i', [1920, 1080, 0, 'dikey'], { duzen: 'dikey', genislik: 607.5, yukseklik: 1080, u: 6.075, donusum: 'translate(656.25px, 0px)' }],
  ['dikey pencerede yatay zorlanır: u tuval yüksekliğinin %1’i', [1080, 1920, 0, 'yatay'], { duzen: 'yatay', genislik: 1080, yukseklik: 607.5, u: 6.075, donusum: 'translate(0px, 656.25px)' }],
  ['döndürülmüş dikey pencerede dikey zorlanır: pay tuvalin kendi ekseninde', [1080, 1920, 90, 'dikey'], { duzen: 'dikey', genislik: 607.5, yukseklik: 1080, u: 6.075, donusum: 'translate(1080px, 656.25px) rotate(90deg)' }],
  ['768×1366 dikey TV: 9:16 yuvarlaması yükseklikte 1 pikselden az pay bırakır, dikeyde de alana yapışır', [768, 1366, 0, null], { duzen: 'dikey', genislik: 768, yukseklik: 1366, u: 7.68, donusum: 'translate(0px, 0px)' }],
  ['1920×1200, don=270: döndürülmüş tuval 1080×1920 kalır, pencere yüksekliğinde iki kenarda 60 px pay', [1920, 1200, 270, null], { duzen: 'dikey', genislik: 1080, yukseklik: 1920, u: 10.8, donusum: 'translate(0px, 1140px) rotate(270deg)' }],
  ['2000×1080, don=90: döndürülmüş tuval 1080×1920 kalır, pencere genişliğinde iki kenarda 40 px pay', [2000, 1080, 90, null], { duzen: 'dikey', genislik: 1080, yukseklik: 1920, u: 10.8, donusum: 'translate(1960px, 0px) rotate(90deg)' }],
];
for (const [etiket, cagri, beklenen, tol] of SATIRLAR) {
  test(`tuvalGeometrisi(${cagri.map((a) => JSON.stringify(a)).join(', ')}): ${etiket}`, () => esles(tuvalGeometrisi(...cagri), beklenen, tol));
}

/* olcekKur'un yatay düzenden ÖNCEKİ hesabı (bdab002), olduğu gibi kopyalandı: dikey düzen bununla birebir aynı kalmalı,
   çünkü dikey ekranlar (ve ?don=90/270 ile döndürülmüş kutular) pikseli pikseline eskisi gibi çizilmeye devam etmeli. */
function eskiOlcekKur(W, H, don) {
  const alanG = don ? H : W;
  const alanY = don ? W : H;
  const g = Math.min(alanG, (alanY * 9) / 16);
  const y = (g * 16) / 9;
  const x = (W - (don ? y : g)) / 2;
  const ust = (H - (don ? g : y)) / 2;
  const donusum =
    don === 90 ? `translate(${x + y}px, ${ust}px) rotate(90deg)`
    : don === 270 ? `translate(${x}px, ${ust + g}px) rotate(270deg)`
    : `translate(${x}px, ${ust}px)`;
  return { genislik: g, yukseklik: y, u: g / 100, donusum };
}

test('dikey düzen bugünkü olcekKur hesabıyla birebir aynı (regresyon)', () => {
  // İlk üçü dikey pencere ile ?don=90/270'li yatay pencere; son ikisi tuvalin ortalandığı (sıfırdan farklı pay) dikey durumlar.
  for (const [W, H, don] of [[1080, 1920, 0], [1920, 1080, 90], [1920, 1080, 270], [1080, 2400, 0], [1920, 1200, 90]]) {
    const eski = eskiOlcekKur(W, H, don);
    const yeni = tuvalGeometrisi(W, H, don, null);
    assert.equal(yeni.duzen, 'dikey', `${W}×${H} don=${don}`);
    assert.deepEqual({ genislik: yeni.genislik, yukseklik: yeni.yukseklik, u: yeni.u, donusum: yeni.donusum }, eski, `${W}×${H} don=${don}`);
  }
});

test('hiçbir pencerede tuval alanı aşmaz, en az bir ekseni tam doldurur ve 1 pikselden küçük siyah çizgi bırakmaz', () => {
  const boyutlar = [
    [1920, 1080], [1080, 1920], [1366, 768], [1280, 720], [961, 541], [961.5023, 540.8451], [1919.4, 1080.3], [1600, 900], [1024, 768], [768, 1024],
    [1280, 800], [2560, 1440], [3840, 2160], [640, 360], [1000, 1000], [1200, 1000], [1080, 2400],
    [0, 0], [800, 0], [0, 600], // henüz ölçülmemiş pencere: NaN/Infinity üretmemeli
  ];
  for (const [W, H] of boyutlar) {
    for (const don of [0, 90, 270]) {
      for (const tercih of [null, 'yatay', 'dikey']) {
        const s = tuvalGeometrisi(W, H, don, tercih);
        const nerede = `${W}×${H} don=${don} tercih=${tercih}`;
        const alanG = don ? H : W;
        const alanY = don ? W : H;
        const bosG = alanG - s.genislik;
        const bosY = alanY - s.yukseklik;
        assert.ok(s.genislik >= 0 && s.yukseklik >= 0 && s.genislik <= alanG && s.yukseklik <= alanY, `alanı aşıyor: ${nerede}`);
        assert.ok(bosG === 0 || bosG >= 1, `genişlikte alt-piksellik boşluk: ${nerede} → ${bosG}`);
        assert.ok(bosY === 0 || bosY >= 1, `yükseklikte alt-piksellik boşluk: ${nerede} → ${bosY}`);
        assert.ok(bosG === 0 || bosY === 0, `hiçbir eksen dolmadı: ${nerede}`);
        assert.ok(Number.isFinite(s.u) && s.u >= 0, `u sonlu değil: ${nerede}`);
        assert.doesNotMatch(s.donusum, /NaN|Infinity/, nerede);
      }
    }
  }
});

/* olcekKur'un DOM tarafı sahte pencere ve tuvalle sınanır. Tarayıcı testleri sahne kabının her zaman var ve dolu olduğu
   durumu görür; kabın yokluğu, 0 ölçüsü ve geri çağrının sırası yalnız burada denetlenebilir. `kap`, kabın
   getBoundingClientRect değeridir (null: kap yok) ve sonradan değiştirilerek pencerenin boyutlanması taklit edilir. */
afterEach(() => { delete globalThis.window; });

function ortam(kap, pencere = [1000, 1000]) {
  const dinleyiciler = [];
  globalThis.window = { innerWidth: pencere[0], innerHeight: pencere[1], addEventListener: (ad, fn) => dinleyiciler.push([ad, fn]) };
  const oznitelikler = {};
  const ozel = {};
  const stil = { setProperty: (ad, deger) => { ozel[ad] = deger; } };
  const tuval = { parentElement: kap && { getBoundingClientRect: () => kap }, style: stil, setAttribute: (ad, deger) => { oznitelikler[ad] = deger; } };
  const resizeTetikle = () => dinleyiciler.filter(([ad]) => ad === 'resize').forEach(([, fn]) => fn());
  return { tuval, oznitelikler, ozel, stil, resizeTetikle };
}

test('olcekKur: boyutu sahne kabının kesirli ölçüsünden alır, pencerenin tam sayılı ölçüsünden değil', () => {
  const e = ortam({ width: 961.5023, height: 540.8451 }, [961, 541]);
  olcekKur(e.tuval, 0, null);
  assert.equal(e.oznitelikler['data-duzen'], 'yatay');
  assert.ok(e.stil.width.endsWith('px') && yakin(parseFloat(e.stil.width), 961.5023, 1e-6), e.stil.width);
  assert.ok(e.stil.height.endsWith('px') && yakin(parseFloat(e.stil.height), 540.8451, 1e-6), e.stil.height);
  assert.ok(e.ozel['--u'].endsWith('px') && yakin(parseFloat(e.ozel['--u']), 5.408451, 1e-6), e.ozel['--u']);
  assert.equal(e.stil.transformOrigin, '0 0');
  assert.equal(e.stil.transform, 'translate(0px, 0px)');
});

test('olcekKur: sahne kabı yoksa ya da bir kenarı 0 ise pencere ölçüsüne düşer', () => {
  for (const kap of [null, { width: 0, height: 500 }, { width: 500, height: 0 }, { width: 0, height: 0 }]) {
    const e = ortam(kap, [1080, 1920]);
    olcekKur(e.tuval, 0, null);
    const nerede = JSON.stringify(kap);
    assert.equal(e.oznitelikler['data-duzen'], 'dikey', nerede);
    assert.equal(e.stil.width, '1080px', nerede);
    assert.equal(e.stil.height, '1920px', nerede);
    assert.equal(e.ozel['--u'], '10.8px', nerede);
  }
});

test('olcekKur: don ile tercihi geometriye iletir', () => {
  const e = ortam({ width: 1080, height: 1920 });
  olcekKur(e.tuval, 90, 'dikey');
  assert.equal(e.oznitelikler['data-duzen'], 'dikey');
  assert.equal(e.stil.width, '607.5px');
  assert.equal(e.stil.height, '1080px');
  assert.equal(e.ozel['--u'], '6.075px');
  assert.equal(e.stil.transform, 'translate(1080px, 656.25px) rotate(90deg)');
});

test('olcekKur: geri çağrı ilk uygulamada çalışmaz; her resize’da, yeni düzen uygulandıktan SONRA çalışır', () => {
  const kap = { width: 1920, height: 1080 };
  const e = ortam(kap);
  const gorulen = [];
  olcekKur(e.tuval, 0, null, () => gorulen.push(e.oznitelikler['data-duzen']));
  assert.deepEqual(gorulen, [], 'ilk uygulamada çağrılırsa main.ts’in durumu henüz kurulmamıştır');
  assert.equal(e.oznitelikler['data-duzen'], 'yatay');
  Object.assign(kap, { width: 1080, height: 1920 });
  e.resizeTetikle();
  assert.deepEqual(gorulen, ['dikey'], 'geri çağrı yeni düzeni görmeli');
  Object.assign(kap, { width: 1920, height: 1080 });
  e.resizeTetikle();
  assert.deepEqual(gorulen, ['dikey', 'yatay']);
});

test('olcekKur: geri çağrı verilmemişse resize hata vermez, düzen yine güncellenir', () => {
  const kap = { width: 1920, height: 1080 };
  const e = ortam(kap);
  olcekKur(e.tuval, 0, null);
  Object.assign(kap, { width: 1080, height: 1920 });
  assert.doesNotThrow(() => e.resizeTetikle());
  assert.equal(e.oznitelikler['data-duzen'], 'dikey');
});
