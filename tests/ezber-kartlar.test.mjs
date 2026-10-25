/**
 * Ezber kartları · 8'li baskı (25 Ekim 2026): src/lib/ezber/kartlar.ts saf kütüphanesi. Sayfalama (2 × 4), arka yüzün satır aynası
 * (uzun kenardan çevirince ön ve arka kartlar karşı karşıya gelir), basım sırası, katalog kodu, Arapça kart yazısı (yazı tipi
 * kümesinde olmayan harf yok), açılış seçimi.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(ad) {
  const cikti = resolve(`node_modules/.cache/ezber-${ad}-kartlar-test.mjs`);
  await build({ entryPoints: [`src/lib/ezber/${ad}.ts`], outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
}
const k = await yukle('kartlar');
const c = await yukle('cihaz');

const idler = (n) => Array.from({ length: n }, (_, i) => `m${i + 1}`);

test('aynala: her satır ters çevrilir (2 sütun); sütun sayısına bölünmeyen girdi de bozulmaz', () => {
  assert.deepEqual(k.aynala(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']), ['b', 'a', 'd', 'c', 'f', 'e', 'h', 'g']);
  assert.deepEqual(k.aynala(['a', 'b', 'c']), ['b', 'a', 'c']);
  assert.deepEqual(k.aynala([]), []);
  assert.deepEqual(k.aynala(['a', 'b', 'c', 'd', 'e', 'f'], 3), ['c', 'b', 'a', 'f', 'e', 'd']);
  assert.throws(() => k.aynala(['a'], 0), RangeError);
});

test('aynala iki kez uygulanınca özgün sıra gelir (aynalama kendi tersidir)', () => {
  const x = idler(8);
  assert.deepEqual(k.aynala(k.aynala(x)), x);
});

test('sayfala: 10 kart → 2 kâğıt; ilk yüz 8 dolu, ikincide 2 dolu ve 6 boş; arka yüz ön yüzün satır aynası', () => {
  const s = k.sayfala(idler(10));
  assert.equal(s.length, 2);
  assert.deepEqual(s[0].on, idler(8));
  assert.deepEqual(s[0].arka, ['m2', 'm1', 'm4', 'm3', 'm6', 'm5', 'm8', 'm7']);
  assert.deepEqual(s[1].on, ['m9', 'm10', null, null, null, null, null, null]);
  assert.deepEqual(s[1].arka, ['m10', 'm9', null, null, null, null, null, null]);
  assert.deepEqual(s.map((x) => x.sayfa), [1, 2]);
});

test('sayfala: ön yüzde (satır r, sütun c) kartının arkası aynı satırda ters sütundadır — uzun kenardan çevirme', () => {
  for (const n of [1, 2, 3, 7, 8, 9, 16, 17, 76]) {
    for (const s of k.sayfala(idler(n))) {
      for (let r = 0; r < k.KART_SATIR; r++) {
        for (let col = 0; col < k.KART_SUTUN; col++) {
          assert.equal(s.arka[r * k.KART_SUTUN + (k.KART_SUTUN - 1 - col)], s.on[r * k.KART_SUTUN + col], `n=${n} sayfa ${s.sayfa} (${r},${col})`);
        }
      }
    }
  }
});

test('sayfala: kâğıt sayısı ⌈n / 8⌉; boş girdi boş; her kart tam bir kez ön ve bir kez arka yüzde', () => {
  assert.deepEqual(k.sayfala([]), []);
  for (const n of [1, 8, 9, 24, 25]) {
    const s = k.sayfala(idler(n));
    assert.equal(s.length, Math.ceil(n / 8));
    for (const yuz of ['on', 'arka']) assert.deepEqual(s.flatMap((x) => x[yuz]).filter(Boolean).sort(), idler(n).sort());
  }
  assert.throws(() => k.sayfala(idler(3), 7, 2), RangeError);
});

test('basimSirasi: çift taraflı ön 1, arka 1, ön 2, arka 2; yalnız ön / yalnız arka tek yüzlü', () => {
  const s = k.sayfala(idler(10));
  assert.deepEqual(k.basimSirasi(s, 'cift').map((x) => `${x.yuz}${x.sayfa}`), ['on1', 'arka1', 'on2', 'arka2']);
  assert.deepEqual(k.basimSirasi(s, 'on').map((x) => `${x.yuz}${x.sayfa}`), ['on1', 'on2']);
  assert.deepEqual(k.basimSirasi(s, 'arka').map((x) => `${x.yuz}${x.sayfa}`), ['arka1', 'arka2']);
  assert.deepEqual(k.basimSirasi([], 'cift'), []);
});

test('basimOzeti: 10 kart çift taraflı 2 yaprak = 4 sayfa; yalnız bir yüz 2 sayfa; 0 kart 0', () => {
  assert.deepEqual(k.basimOzeti(10, 'cift'), { kart: 10, kagit: 2, sayfa: 4 });
  assert.deepEqual(k.basimOzeti(10, 'on'), { kart: 10, kagit: 2, sayfa: 2 });
  assert.deepEqual(k.basimOzeti(8, 'cift'), { kart: 8, kagit: 1, sayfa: 2 });
  assert.deepEqual(k.basimOzeti(0, 'cift'), { kart: 0, kagit: 0, sayfa: 0 });
});

test('kartKodu: şerit-sıra, Amme ve kenar suyu', () => {
  assert.equal(k.kartKodu(3, 2), '3-02');
  assert.equal(k.kartKodu(8, 14), '8-14');
  assert.equal(k.kartKodu('kenar', 4), 'K-04');
});

const katalog = JSON.parse(readFileSync('src/data/ezber/katalog.json', 'utf8'));
const metinler = new Map(readdirSync('src/data/ezber/metin').filter((d) => /^[sdb]-.*\.json$/.test(d)).map((d) => {
  const m = JSON.parse(readFileSync(`src/data/ezber/metin/${d}`, 'utf8'));
  return [m.id, m];
}));
const sayfali = katalog.ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length || o.kuran || o.metinli || o.bilgiMetni);

test('arapcaKartYazisi: tam sûrede serlevha adı; kesik metinde kelime tavanı; metinsiz (bilgi) maddede null', () => {
  assert.deepEqual(k.arapcaKartYazisi(metinler.get('s-ihlas'), 's-ihlas', 'sure'), { metin: `سُورَةُ ${metinler.get('s-ihlas').sureAdi}`, kesik: false });
  const kursi = k.arapcaKartYazisi(metinler.get('s-ayetel-kursi'), 's-ayetel-kursi', 'sure');
  assert.equal(kursi.kesik, true);
  assert.ok(kursi.metin.split(' ').length <= k.ARAPCA_KELIME_TAVANI);
  assert.ok(metinler.get('s-ayetel-kursi').bolumler[0].ar.startsWith(kursi.metin), 'sayfadaki metnin başı');
  assert.equal(k.arapcaKartYazisi(undefined, 'b-imanin-sartlari', 'bilgi'), null);
  // sûrenin bir parçası (Alak 1–5) tam sûre başlığı olmaz: o sayfada serlevha adı da yoktur
  const alak = k.arapcaKartYazisi(metinler.get('s-alak-1-5'), 's-alak-1-5', 'sure');
  assert.ok(!alak.metin.startsWith('سُورَةُ'));
});

test('arapcaKartYazisi: her çalışma sayfalı madde için kart Arapçası maddenin kendi sayfa verisinden gelir ve yazı tipi kümesindedir', () => {
  const kume = new Set(JSON.parse(readFileSync('egitim/public/fonts/ulu-nesih.json', 'utf8')).kume.map((u) => Number.parseInt(u.slice(2), 16)));
  let sayi = 0;
  for (const o of sayfali) {
    const y = k.arapcaKartYazisi(metinler.get(o.id), o.id, o.tur);
    if (!y) continue;
    sayi++;
    const mt = metinler.get(o.id);
    const sayfadaki = mt.bolumler.map((b) => b.ar).join(' ') + (mt.sureAdi ?? '');
    for (const kelime of y.metin.split(' ').filter((x) => x !== 'سُورَةُ')) assert.ok(sayfadaki.includes(kelime), `${o.id}: «${kelime}» sayfa verisinde yok`);
    for (const ch of y.metin) assert.ok(kume.has(ch.codePointAt(0)), `${o.id}: U+${ch.codePointAt(0).toString(16)} yazı tipi kümesinde yok`);
  }
  assert.ok(sayi >= 60, `Arapça başlıklı kart sayısı ${sayi}`);
});

test('secParametresi: yalnız katalogdaki kimlikler, katalog sırası; bozuk girdi boş', () => {
  const sira = ['s-fatiha', 's-ihlas', 'd-ezan'];
  assert.deepEqual(k.secParametresi('?sec=d-ezan,s-fatiha', sira), ['s-fatiha', 'd-ezan']);
  assert.deepEqual(k.secParametresi('?sec=x-yok,<script>,s-ihlas', sira), ['s-ihlas']);
  assert.deepEqual(k.secParametresi('', sira), []);
  assert.deepEqual(k.secParametresi('?baska=1', sira), []);
});

const an = (y, a, g, s = 10) => new Date(y, a - 1, g, s, 0, 0).getTime();

test('baslangicSecimi: cihazdaki çalışma kaydı olanlar ve bağlantıyla istenenler, katalog sırasıyla; kayıt yoksa boş', () => {
  const sira = ['s-fatiha', 's-ihlas', 's-nas', 'd-ezan'];
  const d = c.temizle({ v: 1, ar: 1, gunler: [], maddeler: {
    's-nas': { kip: 'sina', son: an(2026, 10, 24) },
    's-fatiha': { kip: 'zincir', son: an(2026, 10, 20) },
    's-ihlas': { kip: 'gizle', son: 0 },
  } });
  assert.deepEqual(k.baslangicSecimi(d, sira), ['s-fatiha', 's-nas']);
  assert.deepEqual(k.baslangicSecimi(d, sira, ['d-ezan', 'x-yok']), ['s-fatiha', 's-nas', 'd-ezan']);
  assert.deepEqual(k.baslangicSecimi(c.bos(), sira), []);
  assert.deepEqual(k.baslangicSecimi(c.bos(), sira, ['s-ihlas']), ['s-ihlas']);
});
