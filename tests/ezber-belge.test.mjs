/**
 * Çalışma Belgesi satırları (25 Ekim 2026): src/lib/ezber/belge.ts saf kütüphanesi. Belge yalnız cihazdaki kayıttan çıkar:
 * kaydı olmayan madde girmez, katalog sırası korunur, tarih yerel gündür, uydurma alan yoktur.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(ad) {
  const cikti = resolve(`node_modules/.cache/ezber-${ad}-belge-test.mjs`);
  await build({ entryPoints: [`src/lib/ezber/${ad}.ts`], outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
}
const b = await yukle('belge');
const c = await yukle('cihaz');

const an = (y, a, g, s = 10) => new Date(y, a - 1, g, s, 0, 0).getTime();
const durum = (maddeler, gunler = []) => c.temizle({ v: 1, ar: 1, gunler, maddeler });

test('belgeSatirlari: yalnız kaydı ve son çalışma anı olan maddeler, katalog sırasıyla; tarih yerel gündür', () => {
  const d = durum({
    's-ihlas': { kip: 'sina', kutu: 1, sonraki: '2026-10-28', son: an(2026, 10, 24, 23) },
    's-fatiha': { kip: 'zincir', son: an(2026, 10, 20, 0) },
    's-felak': { kip: 'gizle', son: 0 },
  });
  const s = b.belgeSatirlari(d, ['s-fatiha', 's-ihlas', 's-felak', 's-nas']);
  assert.deepEqual(s, [
    { id: 's-fatiha', son: '2026-10-20', kutu: -1 },
    { id: 's-ihlas', son: '2026-10-24', kutu: 1 },
  ]);
});

test('belgeSatirlari: katalogda ya da çalışma sayfası listesinde olmayan madde atlanır; boş kayıtta boş liste', () => {
  const d = durum({ 's-ihlas': { kip: 'sina', son: an(2026, 10, 24) }, 'x-yok': { kip: 'sina', son: an(2026, 10, 24) } });
  assert.deepEqual(b.belgeSatirlari(d, ['s-ihlas']).map((x) => x.id), ['s-ihlas']);
  assert.deepEqual(b.belgeSatirlari(c.bos(), ['s-ihlas']), []);
});

test('ucHaftaGunu: bugün dâhil 21 takvim günü; dışı ve geçersiz günler sayılmaz', () => {
  const gunler = ['2026-10-04', '2026-10-05', '2026-10-24', '2026-10-25'];
  assert.equal(b.ucHaftaGunu(gunler, '2026-10-25'), 3, '4 Ekim 22 gün önce: dışarıda');
  assert.equal(b.ucHaftaGunu(gunler, '2026-10-24'), 3, '4 Ekim tam 21. gün: içeride');
  assert.equal(b.ucHaftaGunu([], '2026-10-25'), 0);
  assert.equal(b.ucHaftaGunu(gunler, 'bozuk'), 0);
});

test('yogunluk: 6 ve altı ferah, 12 ve altı orta, üstü sıkı', () => {
  assert.deepEqual([0, 1, 6, 7, 12, 13, 40].map(b.yogunluk), ['az', 'az', 'az', 'orta', 'orta', 'cok', 'cok']);
});

test('basamakYazisi: sınanmamış «—», sınanmış 1…5 / 5', () => {
  assert.equal(b.basamakYazisi(-1), '—');
  assert.deepEqual([0, 1, 4].map(b.basamakYazisi), ['1 / 5', '2 / 5', '5 / 5']);
  assert.equal(b.basamakYazisi(9), '5 / 5');
});
