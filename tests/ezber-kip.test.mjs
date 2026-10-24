/**
 * Ezber çalışma kipleri (Faz 2c, 24 Ekim 2026): kademeli gizleme, bağlayarak ezberleme ve cihaz ayarları. Üçü de saf
 * kütüphanedir (src/lib/ezber/{gizleme,zincir,cihaz}.ts); ekran bunların kararını çizer. Gerçek Kur'an ve dua metinleri
 * veri dosyalarından okunur: testte metin yazılmaz, yalnız genel Arapça kelimeler kullanılır. 2d: cihaz kaydındaki tekrar
 * takvimi alanları (kutu, sonraki gün, çalışılan günler) da burada sınanır; takvimin kendisi ezber-tekrar-oyun.test.mjs'tedir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(ad) {
  const cikti = resolve(`node_modules/.cache/ezber-kip-${ad}-test.mjs`);
  await build({ entryPoints: [`src/lib/ezber/${ad}.ts`], outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
}
const g = await yukle('gizleme');
const z = await yukle('zincir');
const c = await yukle('cihaz');
const t = await yukle('tekrar');

const KLASOR = 'src/data/ezber/metin';
const metinler = readdirSync(KLASOR).filter((d) => /^[sdb]-.*\.json$/.test(d)).map((d) => JSON.parse(readFileSync(`${KLASOR}/${d}`, 'utf8')));
const ZWJ = '‍';

// ——— gizleme ———
test('kelimeler: bütün gerçek metinlerde hiçbir karakter kaybolmaz, her kelimede harf vardır', () => {
  let sayi = 0;
  for (const m of metinler) {
    for (const b of m.bolumler) {
      const k = g.kelimeler(b.ar);
      assert.ok(k.length > 0, `${m.id} ${b.no}: kelime yok`);
      assert.equal(k.join(''), b.ar.replace(/[\s ]+/g, ''), `${m.id} ${b.no}: karakter kaybı`);
      for (const x of k) assert.match(x, /\p{L}/u, `${m.id} ${b.no}: harfsiz kelime`);
      sayi += k.length;
    }
  }
  assert.ok(sayi > 500, `yalnız ${sayi} kelime sınandı`);
});

test('kelimeler: durak işareti önceki kelimeye bağlanır, baştaki işaret atılır, sert boşluk keser', () => {
  assert.deepEqual(g.kelimeler('كِتَابٌ ۚ قَلَمٌ'), ['كِتَابٌۚ', 'قَلَمٌ']);
  assert.deepEqual(g.kelimeler('ۖ قَلَمٌ'), ['قَلَمٌ']);
  assert.deepEqual(g.kelimeler('كِتَابٌ قَلَمٌ'), ['كِتَابٌ', 'قَلَمٌ']);
  assert.deepEqual(g.kelimeler('   '), []);
  assert.deepEqual(g.kelimeler(''), []);
});

test('ilkHarf: ilk harf ve hareke; «ال» takısında (ekli de olsa) takıdan sonraki harfi de verir', () => {
  assert.equal(g.ilkHarf('قَلَمٌ'), `قَ${ZWJ}`);
  assert.equal(g.ilkHarf('ٱلْقَلَمُ'), `ٱلْقَ${ZWJ}`);
  assert.equal(g.ilkHarf('وَٱلْقَلَمِ'), `وَٱلْقَ${ZWJ}`);
  assert.equal(g.ilkHarf('بِٱلْقَلَمِ'), `بِٱلْقَ${ZWJ}`);
  assert.equal(g.ilkHarf('الْكِتَابُ'), `الْكِ${ZWJ}`);
  // Hemzeli elif takı sayılmaz: «أَلَمٌ» kökünün ilk harfi.
  assert.equal(g.ilkHarf('أَلَمٌ'), `أَ${ZWJ}`);
  assert.equal(g.ilkHarf(''), '');
});

test('ilkHarf: tanımlık ayrımı — kök harfleriyle başlayan «اِلٰهَ», «اِلاَّ», «اَلَمْ» tek harf verir; gerçek tanımlıkta takıdan sonraki harf de gelir', () => {
  assert.equal(g.ilkHarf('اِلٰهَ'), `اِ${ZWJ}`);
  assert.equal(g.ilkHarf('اِلاَّ'), `اِ${ZWJ}`);
  assert.equal(g.ilkHarf('اَلَمْ'), `اَ${ZWJ}`);
  assert.equal(g.ilkHarf('اَلسَّلاَمُ'), `اَلسَّ${ZWJ}`);
  assert.equal(g.ilkHarf('الرَّحْمٰنِ'), `الرَّ${ZWJ}`);
});

test('ilkHarf: gerçek metinde ipucu kelimenin tamamını vermez (yalnız çok kısa kelimelerde tamamı olabilir)', () => {
  let sizan = 0;
  let toplam = 0;
  for (const m of metinler) for (const b of m.bolumler) for (const k of g.kelimeler(b.ar)) {
    toplam++;
    const ip = g.ilkHarf(k).slice(0, -1);
    const harfler = (x) => (x.match(/\p{L}/gu) ?? []).length;
    if (harfler(k) >= 4 && harfler(ip) >= harfler(k)) sizan++;
  }
  assert.ok(toplam > 500);
  assert.ok(sizan / toplam < 0.01, `ipucu ${sizan}/${toplam} kelimede kelimenin tamamını veriyor`);
});

test('ilkHarf: gerçek metinde her kelime için boş değil ve kelimenin başıdır', () => {
  for (const m of metinler) {
    for (const b of m.bolumler) {
      for (const k of g.kelimeler(b.ar)) {
        const ip = g.ilkHarf(k);
        assert.ok(ip.length >= 2, `${m.id}: boş ipucu «${k}»`);
        assert.ok(ip.endsWith(ZWJ));
        assert.ok(k.startsWith(ip.slice(0, -1)), `${m.id}: ipucu kelimenin başı değil «${k}» → «${ip}»`);
      }
    }
  }
});

test('düzeyler: 0 tam · 1 iki kelimeden biri · 2 ilk harf · 3-4 boş', () => {
  assert.deepEqual(g.gorunumler(4, 0), ['tam', 'tam', 'tam', 'tam']);
  assert.deepEqual(g.gorunumler(4, 1), ['tam', 'bos', 'tam', 'bos']);
  assert.deepEqual(g.gorunumler(3, 2), ['ilk', 'ilk', 'ilk']);
  assert.deepEqual(g.gorunumler(3, 3), ['bos', 'bos', 'bos']);
  assert.deepEqual(g.gorunumler(3, 4), ['bos', 'bos', 'bos']);
  assert.deepEqual(g.gorunumler(0, 2), []);
});

test('kelime başına açılma: boş → ilk harf → tam; ilk harf → tam; en çok iki adım', () => {
  assert.equal(g.acilmisGorunum('bos', 0), 'bos');
  assert.equal(g.acilmisGorunum('bos', 1), 'ilk');
  assert.equal(g.acilmisGorunum('bos', 2), 'tam');
  assert.equal(g.acilmisGorunum('ilk', 1), 'tam');
  assert.equal(g.acilmisGorunum('tam', 0), 'tam');
  assert.equal(g.bir_adim_ac(0), 1);
  assert.equal(g.bir_adim_ac(1), 2);
  assert.equal(g.bir_adim_ac(2), 2);
  assert.deepEqual(g.gorunumler(3, 3, [2, 1, 0]), ['tam', 'ilk', 'bos']);
});

test('sonrakiGizli ve acikSayisi', () => {
  const h = g.gorunumler(4, 1);
  assert.equal(g.sonrakiGizli(h), 1);
  assert.equal(g.acikSayisi(h), 2);
  assert.equal(g.sonrakiGizli(g.gorunumler(3, 0)), -1);
  assert.equal(g.acikSayisi(g.gorunumler(3, 0)), 3);
});

test('işaretler 0–3. düzeyde görünür, 4. düzeyde kaybolur', () => {
  assert.deepEqual(g.SEVIYELER.map((s) => g.isaretGoster(s)), [true, true, true, true, false]);
});

test('ilerle: iki tam üst düzeye çıkarır, az yerinde bırakıp seriyi sıfırlar, tekrar bir alt düzeye indirir', () => {
  let d = { seviye: 0, seri: 0 };
  d = g.ilerle(d, 'tam'); assert.deepEqual(d, { seviye: 0, seri: 1 });
  d = g.ilerle(d, 'tam'); assert.deepEqual(d, { seviye: 1, seri: 0 });
  d = g.ilerle(d, 'tam'); d = g.ilerle(d, 'az'); assert.deepEqual(d, { seviye: 1, seri: 0 });
  d = g.ilerle(d, 'tam'); d = g.ilerle(d, 'tam'); assert.deepEqual(d, { seviye: 2, seri: 0 });
  d = g.ilerle(d, 'tekrar'); assert.deepEqual(d, { seviye: 1, seri: 0 });
  d = g.ilerle({ seviye: 0, seri: 0 }, 'tekrar'); assert.deepEqual(d, { seviye: 0, seri: 0 });
});

test('ilerle: 4. düzeyde iki tam çalışmayı tamamlar ve seri taşmaz', () => {
  let d = { seviye: 4, seri: 0 };
  assert.equal(g.tamamlandi(d), false);
  d = g.ilerle(d, 'tam'); assert.deepEqual(d, { seviye: 4, seri: 1 });
  d = g.ilerle(d, 'tam'); assert.deepEqual(d, { seviye: 4, seri: 2 });
  assert.equal(g.tamamlandi(d), true);
  d = g.ilerle(d, 'tam'); assert.deepEqual(d, { seviye: 4, seri: 2 });
  d = g.ilerle(d, 'tekrar'); assert.deepEqual(d, { seviye: 3, seri: 0 });
  assert.equal(g.tamamlandi(d), false);
});

test('takıldı: ses varsa önce o bölümün sesi, sonra her basışta bir kelime, sonunda biter', () => {
  assert.deepEqual(g.takildi(0, 3, true), { tur: 'ses' });
  assert.deepEqual(g.takildi(1, 3, true), { tur: 'kelime', sira: 0 });
  assert.deepEqual(g.takildi(3, 3, true), { tur: 'kelime', sira: 2 });
  assert.deepEqual(g.takildi(4, 3, true), { tur: 'bitti' });
  assert.deepEqual(g.takildi(0, 3, false), { tur: 'kelime', sira: 0 });
  assert.deepEqual(g.takildi(3, 3, false), { tur: 'bitti' });
});

test('cizgiBoyu: kelime uzunluğuna göre 1–6 basamak', () => {
  assert.equal(g.cizgiBoyu('قَ'), 1);
  assert.equal(g.cizgiBoyu('قَلَمٌ'), 2);
  for (const m of metinler) for (const b of m.bolumler) for (const k of g.kelimeler(b.ar)) {
    const n = g.cizgiBoyu(k);
    assert.ok(Number.isInteger(n) && n >= 1 && n <= 6);
  }
});

// ——— zincir ———
test('halkalar: ileri zincirde her halka bir birim ekler, kapsam okuma sırasındadır', () => {
  const h = z.halkalar(3);
  assert.deepEqual(h.map((x) => x.yeni), [0, 1, 2]);
  assert.deepEqual(h.map((x) => x.kapsam), [[0], [0, 1], [0, 1, 2]]);
});

test('halkalar: sondan zincirde son birimden geriye gidilir, kapsam yine okuma sırasındadır', () => {
  const h = z.halkalar(3, true);
  assert.deepEqual(h.map((x) => x.yeni), [2, 1, 0]);
  assert.deepEqual(h.map((x) => x.kapsam), [[2], [1, 2], [0, 1, 2]]);
});

test('halkalar: grubun başı kaydırılır', () => {
  const h = z.halkalar(2, false, 5);
  assert.deepEqual(h.map((x) => x.kapsam), [[5], [5, 6]]);
  assert.deepEqual(z.halkalar(2, true, 5).map((x) => x.kapsam), [[6], [5, 6]]);
  assert.deepEqual(z.halkalar(0), []);
});

test('gruplar: beşer birim; artakalan yarım boydan küçükse öncekine katılır', () => {
  assert.deepEqual(z.gruplar(0), []);
  assert.deepEqual(z.gruplar(1), [{ bas: 0, son: 1 }]);
  assert.deepEqual(z.gruplar(5), [{ bas: 0, son: 5 }]);
  assert.deepEqual(z.gruplar(7), [{ bas: 0, son: 7 }]);
  assert.deepEqual(z.gruplar(8), [{ bas: 0, son: 5 }, { bas: 5, son: 8 }]);
  assert.deepEqual(z.gruplar(12), [{ bas: 0, son: 5 }, { bas: 5, son: 12 }]);
  assert.deepEqual(z.gruplar(40), Array.from({ length: 8 }, (_, i) => ({ bas: i * 5, son: i * 5 + 5 })));
  for (const n of [1, 2, 6, 9, 11, 13, 29, 40, 286]) {
    const gr = z.gruplar(n);
    assert.equal(gr[0].bas, 0);
    assert.equal(gr.at(-1).son, n);
    gr.forEach((x, i) => { if (i) assert.equal(x.bas, gr[i - 1].son); assert.ok(x.son - x.bas >= 1 && x.son - x.bas <= 7); });
  }
});

test('durum makinesi: yeni → sen → kontrol; tam sıradaki halkaya, son halkada bitişe götürür', () => {
  let d = z.baslangic();
  assert.deepEqual(d, { halka: 0, evre: 'yeni' });
  d = z.gec(d, 2, 'hazir'); assert.deepEqual(d, { halka: 0, evre: 'sen' });
  d = z.gec(d, 2, 'kontrol'); assert.deepEqual(d, { halka: 0, evre: 'kontrol' });
  d = z.gec(d, 2, 'tam'); assert.deepEqual(d, { halka: 1, evre: 'yeni' });
  d = z.gec(z.gec(z.gec(d, 2, 'hazir'), 2, 'kontrol'), 2, 'tam'); assert.deepEqual(d, { halka: 1, evre: 'bitti' });
  assert.deepEqual(z.gec(d, 2, 'hazir'), d, 'bitti son durumdur');
});

test('durum makinesi: az aynı halkada yeniden okutur, tekrar yeniden dinletir, tanımsız olay durumu değiştirmez', () => {
  const k = { halka: 1, evre: 'kontrol' };
  assert.deepEqual(z.gec(k, 3, 'az'), { halka: 1, evre: 'sen' });
  assert.deepEqual(z.gec(k, 3, 'tekrar'), { halka: 1, evre: 'yeni' });
  assert.deepEqual(z.gec({ halka: 1, evre: 'sen' }, 3, 'tekrar'), { halka: 1, evre: 'yeni' });
  assert.deepEqual(z.gec({ halka: 1, evre: 'yeni' }, 3, 'tam'), { halka: 1, evre: 'yeni' });
  assert.deepEqual(z.gec({ halka: 1, evre: 'sen' }, 3, 'tam'), { halka: 1, evre: 'sen' });
});

test('birimHali: «sen» evresinde yalnız yeni birim görünür, öbür evrelerde hepsi', () => {
  assert.equal(z.birimHali(0, 2, 'sen'), 'gizli');
  assert.equal(z.birimHali(2, 2, 'sen'), 'tam');
  for (const e of ['yeni', 'kontrol', 'bitti']) assert.equal(z.birimHali(0, 2, e), 'tam');
});

// ——— cihaz ———
const depoYap = (ilk = {}) => {
  const m = new Map(Object.entries(ilk));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), m };
};

test('cihaz: boş depoda varsayılan, yazılanı geri okur', () => {
  const depo = depoYap();
  assert.deepEqual(c.oku(depo), c.bos());
  let d = c.maddeyiGuncelle(c.bos(), 's-ihlas', { kip: 'gizle', seviye: 2, seri: 1, dinleyici: true }, 1000);
  d = c.arBoyutuAyarla(d, 3);
  assert.equal(c.yaz(depo, d), true);
  const geri = c.oku(depo);
  assert.equal(geri.ar, 3);
  assert.deepEqual(c.maddeAyari(geri, 's-ihlas'), { kip: 'gizle', seviye: 2, seri: 1, boy: 5, grup: 0, sondan: false, dinleyici: true, kutu: -1, sonraki: '', son: 1000 });
  assert.deepEqual(c.maddeAyari(geri, 'baska'), c.varsayilanAyar());
});

test('cihaz: bozuk, yabancı sürümlü ya da türü yanlış içerik sessizce varsayılana döner', () => {
  for (const ham of ['{', 'null', '[]', '"x"', '{"v":2,"ar":1,"maddeler":{}}', '{"v":1,"ar":"x","maddeler":[]}']) {
    const d = c.oku(depoYap({ [c.ANAHTAR]: ham }));
    assert.equal(d.v, 1);
    assert.equal(d.ar, c.AR_VARSAYILAN);
    assert.deepEqual(d.maddeler, {});
  }
});

test('cihaz: aralık dışı değerler sınıra çekilir, geçersiz kimlikler ve tür hataları atılır', () => {
  const d = c.temizle({ v: 1, ar: 99, maddeler: {
    iyi: { kip: 'gizle', seviye: 9, seri: -3, boy: 99, grup: -1, sondan: 'evet', dinleyici: 1, son: 'dün' },
    'KÖTÜ/ad': { kip: 'zincir' },
    bozuk: 'metin',
  } });
  assert.equal(d.ar, c.AR_ENCOK);
  assert.deepEqual(Object.keys(d.maddeler), ['iyi']);
  assert.deepEqual(d.maddeler.iyi, { kip: 'gizle', seviye: 4, seri: 0, boy: c.BOY_ENCOK, grup: 0, sondan: false, dinleyici: false, kutu: -1, sonraki: '', son: 0 });
});

test('cihaz: depo kapalı ya da dolu olsa da hata fırlatmaz', () => {
  const atan = { getItem() { throw new Error('kapalı'); }, setItem() { throw new Error('dolu'); } };
  assert.deepEqual(c.oku(atan), c.bos());
  assert.equal(c.yaz(atan, c.bos()), false);
  assert.deepEqual(c.oku(null), c.bos());
  assert.equal(c.yaz(undefined, c.bos()), false);
});

test('cihaz: en çok AZAMI_MADDE madde tutulur, en eski çalışılan atılır', () => {
  let d = c.bos();
  for (let i = 0; i < c.AZAMI_MADDE + 5; i++) d = c.maddeyiGuncelle(d, `m-${i}`, { seviye: 1 }, 1000 + i);
  assert.equal(Object.keys(d.maddeler).length, c.AZAMI_MADDE);
  assert.ok(!('m-0' in d.maddeler) && !('m-4' in d.maddeler));
  assert.ok('m-5' in d.maddeler && `m-${c.AZAMI_MADDE + 4}` in d.maddeler);
});

test('cihaz: kısmi güncelleme öbür alanları korur, geçersiz kimlik durumu değiştirmez', () => {
  let d = c.maddeyiGuncelle(c.bos(), 'd-subhaneke', { kip: 'zincir', boy: 3, sondan: true }, 5);
  d = c.maddeyiGuncelle(d, 'd-subhaneke', { grup: 2 }, 6);
  assert.deepEqual(c.maddeAyari(d, 'd-subhaneke'), { kip: 'zincir', seviye: 0, seri: 0, boy: 3, grup: 2, sondan: true, dinleyici: false, kutu: -1, sonraki: '', son: 6 });
  assert.equal(c.maddeyiGuncelle(d, '../x', { seviye: 1 }, 7), d);
});


// ——— cihaz: tekrar takvimi alanları (Faz 2d) ———
test('cihaz: tekrar alanları — kutu −1…4 ve gerçek takvim günü; kip «sina» kabul edilir', () => {
  const d = c.temizle({ v: 1, ar: 1, maddeler: {
    a: { kip: 'sina', kutu: 99, sonraki: '2026-10-25' },
    b: { kip: 'sina', kutu: -7, sonraki: '2026-02-30' },
    c: { kutu: 2.9, sonraki: 20261025 },
    d: { kip: 'baska', kutu: 'x', sonraki: '25.10.2026' },
  } });
  assert.deepEqual(
    [d.maddeler.a.kip, d.maddeler.a.kutu, d.maddeler.a.sonraki],
    ['sina', c.KUTU_ENCOK, '2026-10-25'],
  );
  assert.deepEqual([d.maddeler.b.kutu, d.maddeler.b.sonraki], [c.KUTU_ENAZ, ''], 'olmayan gün (30 Şubat) atılır');
  assert.deepEqual([d.maddeler.c.kutu, d.maddeler.c.sonraki], [2, ''], 'ondalık kesilir, sayı olan tarih atılır');
  assert.deepEqual([d.maddeler.d.kip, d.maddeler.d.kutu, d.maddeler.d.sonraki], ['zincir', c.KUTU_ENAZ, '']);
});

test('cihaz: 2c kaydında tekrar alanları yoktur; okunurken varsayılan alırlar ve kayıt bozulmaz', () => {
  const eski = JSON.stringify({ v: 1, ar: 3, maddeler: { 's-ihlas': { kip: 'gizle', seviye: 2, seri: 1, boy: 5, grup: 0, sondan: false, dinleyici: true, son: 77 } } });
  const d = c.oku(depoYap({ [c.ANAHTAR]: eski }));
  assert.equal(d.ar, 3);
  assert.deepEqual(c.maddeAyari(d, 's-ihlas'), { kip: 'gizle', seviye: 2, seri: 1, boy: 5, grup: 0, sondan: false, dinleyici: true, kutu: -1, sonraki: '', son: 77 });
  assert.deepEqual(d.gunler, []);
});

test('cihaz: tekrar alanları kısmi güncellemeyle yazılır, öbür alanlar ve öteki maddeler korunur', () => {
  let d = c.maddeyiGuncelle(c.bos(), 's-ihlas', { kip: 'gizle', seviye: 3 }, 10);
  d = c.maddeyiGuncelle(d, 's-ihlas', { kutu: 1, sonraki: '2026-10-27' }, 20);
  d = c.maddeyiGuncelle(d, 's-felak', { kutu: 0, sonraki: '2026-10-25' }, 30);
  assert.deepEqual(c.maddeAyari(d, 's-ihlas'), { kip: 'gizle', seviye: 3, seri: 0, boy: 5, grup: 0, sondan: false, dinleyici: false, kutu: 1, sonraki: '2026-10-27', son: 20 });
  assert.equal(c.maddeAyari(d, 's-felak').sonraki, '2026-10-25');
  // Geçersiz tarih yazılmaz: boşa döner (öneri silinir), kutu sınırlanır.
  d = c.maddeyiGuncelle(d, 's-ihlas', { sonraki: '2026-02-30', kutu: 40 }, 40);
  assert.deepEqual([c.maddeAyari(d, 's-ihlas').sonraki, c.maddeAyari(d, 's-ihlas').kutu], ['', c.KUTU_ENCOK]);
  // Depodan geri okununca aynıdır.
  const depo = depoYap();
  assert.equal(c.yaz(depo, d), true);
  assert.deepEqual(c.oku(depo), d);
});

test('cihaz: çalışılan günler — gerçek günler, tekil, sıralı, son üç hafta; bozuk girdi atılır', () => {
  const d = c.temizle({ v: 1, ar: 1, maddeler: {}, gunler: ['2026-10-24', '2026-10-23', '2026-10-24', '2026-02-30', 'x', 5, null] });
  assert.deepEqual(d.gunler, ['2026-10-23', '2026-10-24']);
  assert.deepEqual(c.temizle({ v: 1, ar: 1, maddeler: {}, gunler: 'dün' }).gunler, []);
  let uzun = c.bos();
  for (let i = 0; i < 30; i++) uzun = c.calismaGunuIsle(uzun, t.gunEkle('2026-09-01', i));
  assert.equal(uzun.gunler.length, t.GUN_AZAMI);
  assert.equal(uzun.gunler.at(-1), '2026-09-30');
  assert.equal(uzun.gunler[0], t.gunEkle('2026-09-30', -(t.GUN_AZAMI - 1)));
  // Aynı gün iki kez işlenince çoğalmaz; geçersiz tarih durumu değiştirmez.
  assert.deepEqual(c.calismaGunuIsle(c.calismaGunuIsle(c.bos(), '2026-10-24'), '2026-10-24').gunler, ['2026-10-24']);
  const bosD = c.bos();
  assert.equal(c.calismaGunuIsle(bosD, '2026-13-01'), bosD);
  assert.equal(c.calismaGunuIsle(bosD, 'bugün'), bosD);
});
