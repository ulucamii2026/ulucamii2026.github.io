/**
 * İlim Yolu ana sayfası (11 Kasım 2026) — «Bugün / Kaldığınız yer / Yolunuz / Yollarınız» mantığı (src/lib/ilim-yolu/ana-yol.ts). Bağlayıcı:
 * en son çalışılan yol Ezber ile kart yolları arasında zamana göre seçilir; sıradaki kart yolun sırasındaki ilk öğrenilmemiş karttır; rozet sayısı
 * 13 yoldan sayılır; «son işaret» yalnız kart kimliği + zaman tutar, bozuk girdiyi yok sayar; GİZLİLİK: «Yeni Müslüman yolu» (ilim:y12:v1, ozel/yol12)
 * bu mantıkta ve ana sayfa betiğinde hiç geçmez.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { BellekDepo } from './egitim/hesap-sahte.mjs';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ilim-yolu-ana-yol-test.mjs');
await build({ entryPoints: ['src/lib/ilim-yolu/ana-yol.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
const a = await import(pathToFileURL(cikti).href);
const bilgi = await (async () => {
  const c = resolve('node_modules/.cache/ilim-yolu-ana-yol-bilgi-test.mjs');
  await build({ entryPoints: ['src/lib/ilim-yolu/bilgi-ilerleme.ts'], outfile: c, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  return import(pathToFileURL(c).href);
})();

const kartlar = readdirSync('src/data/ilim-yolu/kartlar').filter((d) => d.endsWith('.json'))
  .flatMap((d) => JSON.parse(readFileSync(`src/data/ilim-yolu/kartlar/${d}`, 'utf8')).kartlar);
const idler = (kod) => kartlar.filter((k) => k.kod === kod).map((k) => k.id).sort();
const PLAN = ['kuran', 'itikat', 'ibadet', 'siyer', 'ahlak'].map((kod) => ({ id: `plan-${kod}`, idler: idler(kod) }));
const isaret = (il, ...ids) => ids.reduce((x, id) => bilgi.isaretle(x, id, bilgi.OGRENDIM), il);
const OZET = 'a'.repeat(32);

test('yolDurumlari: sayım, tamam ve sıradaki kart (sıradaki = yolun sırasındaki ilk öğrenilmemiş)', () => {
  const ib = idler('ibadet');
  const il = isaret(bilgi.bos(), ib[0], ib[1]);
  const [, , d] = a.yolDurumlari(il, PLAN);
  assert.equal(d.id, 'plan-ibadet');
  assert.equal(d.ogrenilen, 2);
  assert.equal(d.toplam, ib.length);
  assert.equal(d.tamam, false);
  assert.equal(d.sonraki, ib[2]);
  // boşluklu ilerleme: ilk boşluk sıradaki olur
  const bosluklu = a.yolDurumlari(isaret(bilgi.bos(), ib[1]), PLAN)[2];
  assert.equal(bosluklu.sonraki, ib[0]);
  // tamamı öğrenilince sıradaki yok, tamam
  const hepsi = a.yolDurumlari(isaret(bilgi.bos(), ...ib), PLAN)[2];
  assert.equal(hepsi.tamam, true);
  assert.equal(hepsi.sonraki, null);
  // boş ilerlemede hiçbir yol tamam değil
  assert.ok(a.yolDurumlari(bilgi.bos(), PLAN).every((x) => !x.tamam && x.ogrenilen === 0));
});

test('rozetSayisi: tamamlanan yollar + (Ezber bilgi yolu tamamsa) 1', () => {
  const ib = idler('ibadet');
  const si = idler('siyer');
  const durum = a.yolDurumlari(isaret(bilgi.bos(), ...ib, ...si), PLAN);
  assert.equal(a.rozetSayisi(durum, false), 2);
  assert.equal(a.rozetSayisi(durum, true), 3);
  assert.equal(a.rozetSayisi(a.yolDurumlari(bilgi.bos(), PLAN), false), 0);
  // seviye alanı yolları da sayılır (aynı kartlar farklı gruplanır)
  const alan = [{ id: 'alan-ahlak', idler: kartlar.filter((k) => k.seviyeAlani === 'ahlak').map((k) => k.id) }];
  const il = isaret(bilgi.bos(), ...alan[0].idler);
  assert.equal(a.rozetSayisi(a.yolDurumlari(il, alan), false), 1);
});

test('sonYol: işaretin yolu → ilerlemesi olan ilk bitmemiş yol → ilerlemesi olan ilk yol → yok', () => {
  const ku = idler('kuran');
  const ah = idler('ahlak');
  const il = isaret(bilgi.bos(), ku[0], ah[0]);
  const durum = a.yolDurumlari(il, PLAN);
  assert.equal(a.sonYol(durum, { id: ah[0], ms: 5 }).id, 'plan-ahlak');
  assert.equal(a.sonYol(durum, { id: ku[0], ms: 5 }).id, 'plan-kuran');
  // işaret yok: ilerlemesi olan ilk bitmemiş yol
  assert.equal(a.sonYol(durum, null).id, 'plan-kuran');
  // işaretin yolunda ilerleme yok (ör. başka hesap): geri kalan ilerlemeden seçilir
  assert.equal(a.sonYol(durum, { id: idler('siyer')[0], ms: 5 }).id, 'plan-kuran');
  // ilk yol bitmiş, ikincisi sürüyor → sürenen
  const bitmis = a.yolDurumlari(isaret(bilgi.bos(), ...ku, ah[0]), PLAN);
  assert.equal(a.sonYol(bitmis, null).id, 'plan-ahlak');
  assert.equal(a.sonYol(a.yolDurumlari(bilgi.bos(), PLAN), { id: ku[0], ms: 5 }), null);
});

test('sonCalisilan: Ezber ile kart yolu arasında zamana göre; ikisi de yoksa null; işaretsiz kart ilerlemesi de sayılır', () => {
  const ib = idler('ibadet');
  const durum = a.yolDurumlari(isaret(bilgi.bos(), ib[0]), PLAN);
  const son = { id: ib[0], ms: 2000 };
  assert.deepEqual(a.sonCalisilan(durum, son, 1000), { tur: 'kart', yol: durum[2], son });
  assert.deepEqual(a.sonCalisilan(durum, son, 3000), { tur: 'ezber' });
  assert.deepEqual(a.sonCalisilan(durum, null, 0), { tur: 'kart', yol: durum[2], son: null });
  assert.deepEqual(a.sonCalisilan(durum, null, 10), { tur: 'ezber' });
  assert.equal(a.sonCalisilan(a.yolDurumlari(bilgi.bos(), PLAN), null, 0), null);
  // işaretin yolunda ilerleme yoksa işaret yok sayılır (zamanı Ezber'i geçemez)
  assert.deepEqual(a.sonCalisilan(durum, { id: idler('siyer')[0], ms: 9999 }, 100), { tur: 'ezber' });
  const baskasi = a.sonCalisilan(durum, { id: idler('siyer')[0], ms: 9999 }, 0);
  assert.equal(baskasi.tur, 'kart');
  assert.equal(baskasi.son, null);
});

test('son işaret: yalnız geçerli kart kimliği ve zaman yazılır/okunur, bozuk girdi yok sayılır, kullanıcı anahtarı özetle kurulur', () => {
  const d = new BellekDepo();
  assert.equal(a.sonOku(d), null);
  assert.equal(a.sonYaz(d, 'ib-003', 123456), true);
  assert.deepEqual(a.sonOku(d), { id: 'ib-003', ms: 123456 });
  assert.equal(d.getItem(a.SON_ANAHTAR), JSON.stringify({ id: 'ib-003', ms: 123456 }), 'yalnız kimlik ve zaman');
  for (const kotu of [['yeni-yol-h01', 5], ['ib-003', 0], ['ib-003', NaN], ['', 5]]) {
    assert.equal(a.sonYaz(new BellekDepo(), kotu[0], kotu[1]), false, String(kotu));
  }
  for (const ham of ['', 'bozuk{', '{}', '{"id":"x","ms":5}', '{"id":"ib-003","ms":"5"}', '{"id":"ib-003","ms":-1}', '[]', 'null']) {
    assert.equal(a.sonOku(new BellekDepo({ [a.SON_ANAHTAR]: ham })), null, ham);
  }
  assert.equal(a.sonKullaniciAnahtari(OZET), `${a.SON_ANAHTAR}:u:${OZET}`);
  assert.throws(() => a.sonKullaniciAnahtari('uid-1/../x'));
  // depo yok ya da kapalıysa sessizce başarısız
  assert.equal(a.sonOku(null), null);
  assert.equal(a.sonYaz(null, 'ib-003', 5), false);
  assert.equal(a.sonYaz({ setItem() { throw new Error('kota'); } }, 'ib-003', 5), false);
});

test('GİZLİLİK: Yeni Müslüman yolu bu mantıkta ve ana sayfa betiklerinde yok', () => {
  for (const dosya of ['src/lib/ilim-yolu/ana-yol.ts', 'egitim/src/scripts/ana-bilgi.ts', 'egitim/src/scripts/ana.ts', 'egitim/src/scripts/bilgi-ortak.ts']) {
    const kod = readFileSync(dosya, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(kod, /y12|yol12|yeni-yol|yeniYol|yeni-musluman|ozel\//i, `${dosya}: yeni Müslüman izi`);
  }
  // Ana sayfa verisi: yalnız beş plan yolu ve yedi alan yolu; yeni Müslüman kimliği yok.
  const sayfa = readFileSync('egitim/src/pages/[dil]/index.astro', 'utf8');
  const veriBlogu = sayfa.slice(sayfa.indexOf('const planYollari'), sayfa.indexOf('---\n<Taban'));
  assert.doesNotMatch(veriBlogu, /yeni-yol|yeniYol|y12|yol12/i);
});
