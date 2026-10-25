/**
 * Çevrim dışı kayıt (25 Ekim 2026): src/lib/ezber/cevrimdisi.ts `sesYollari` — «İnternetsiz çalışmak için kaydet»e basılınca cihaza inecek TÜM ses
 * dosyaları. Neden: çalışma sayfası (çalar, kademeli gizleme, bağlayarak ezber, Kendini sına, Ezan'ın beş vakti) katalogdaki her yolu çalabilir; kayıt
 * bunlardan birini atlarsa çevrim dışı o kipte ses susar ve bu ancak yolda fark edilir. Burada: her sesli maddede dinleme sırası, tam kayıt, âyet
 * parçaları ve vakit seçeneklerinin hepsi var, yinelenen yok, her yol sunucu yoluyla başlıyor, her dosya depoda duruyor; sessiz maddede boş dizi.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ezber-cevrimdisi-test.mjs');
await build({
  stdin: {
    contents: 'export { sesYollari } from "./src/lib/ezber/cevrimdisi.ts"; export { KATALOG, dinlemeSirasi, sesSecenekleri, calismaSayfasiVar } from "./src/lib/ezber/katalog.ts";',
    resolveDir: process.cwd(),
  },
  outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent',
});
const m = await import(pathToFileURL(cikti).href);
const sesli = m.KATALOG.ogeler.filter((o) => o.ses?.tam || o.ses?.parcalar?.length);

test('Katalogda sesli maddeler var (testin boş geçmesini engeller)', () => {
  assert.ok(sesli.length >= 60, `yalnız ${sesli.length} sesli madde`);
});

test('sesYollari: dinleme sırası, tam kayıt, âyet parçaları ve vakit seçeneklerinin hepsi var; yineleme yok', () => {
  for (const oge of sesli) {
    const yollar = m.sesYollari(oge);
    assert.equal(new Set(yollar).size, yollar.length, `${oge.id}: yinelenen yol`);
    for (const yol of m.dinlemeSirasi(oge)) assert.ok(yollar.includes(yol), `${oge.id}: dinleme sırasında ${yol} eksik`);
    if (oge.ses.tam) assert.ok(yollar.includes(oge.ses.tam), `${oge.id}: tam kayıt eksik`);
    for (const yol of oge.ses.parcalar ?? []) assert.ok(yollar.includes(yol), `${oge.id}: parça ${yol} eksik`);
    for (const s of m.sesSecenekleri(oge)) assert.ok(yollar.includes(s.yol), `${oge.id}: seçenek ${s.id} eksik`);
  }
});

test('sesYollari: her yol sunucu yoludur (/media/ses/…mp3) ve dosya depoda durur', () => {
  for (const oge of sesli) {
    for (const yol of m.sesYollari(oge)) {
      assert.match(yol, /^\/media\/ses\/[a-z0-9\-/]+\.mp3$/, `${oge.id}: ${yol}`);
      assert.ok(existsSync(resolve('public', yol.slice(1))), `${oge.id}: public${yol} yok`);
    }
  }
});

test('sesYollari: sûre başından başlayan parçalı maddede eûzü ve besmele de iner (Fâtiha’da besmele zaten 1. âyet)', () => {
  const parcali = sesli.filter((o) => !o.ses.tam && o.tur === 'sure' && o.kuran?.ayetler[0] === 1 && o.ses.parcalar?.length);
  assert.ok(parcali.length >= 1, 'parçalı sûre maddesi yok');
  for (const oge of parcali) {
    const yollar = m.sesYollari(oge);
    assert.ok(yollar.includes('/media/ses/ayet/1-0.mp3'), `${oge.id}: eûzü yok`);
    if (oge.kuran.sure !== 1) assert.ok(yollar.includes('/media/ses/ayet/1-1.mp3'), `${oge.id}: besmele yok`);
  }
});

test('sesYollari: Ezan’ın beş vakit kaydı da iner', () => {
  const secenekli = sesli.filter((o) => m.sesSecenekleri(o).length > 1);
  assert.ok(secenekli.length >= 1, 'seçenekli madde yok');
  for (const oge of secenekli) {
    const yollar = m.sesYollari(oge);
    for (const s of m.sesSecenekleri(oge)) assert.ok(yollar.includes(s.yol), `${oge.id}: ${s.id}`);
  }
});

test('sesYollari: sessiz maddede (yalnız bilgi ya da kitap duası metni) boş dizi', () => {
  const sessiz = m.KATALOG.ogeler.filter((o) => m.calismaSayfasiVar(o) && !o.ses?.tam && !o.ses?.parcalar?.length);
  assert.ok(sessiz.length >= 1, 'sessiz çalışma sayfası yok');
  for (const oge of sessiz) assert.deepEqual(m.sesYollari(oge), [], oge.id);
});

test('sesYollari: d-euzu-besmele ile s-alak-1-5 aynı iki dosyayı (eûzü 1-0, besmele 1-1) paylaşır — silme sınaması (tests/egitim/cevrimdisi.spec.mjs) buna dayanır', () => {
  const yollar = (id) => new Set(m.sesYollari(m.KATALOG.ogeler.find((o) => o.id === id)));
  const kucuk = yollar('d-euzu-besmele');
  const buyuk = yollar('s-alak-1-5');
  assert.deepEqual([...kucuk].sort(), ['/media/ses/ayet/1-0.mp3', '/media/ses/ayet/1-1.mp3']);
  assert.equal(buyuk.size, 7);
  for (const y of kucuk) assert.ok(buyuk.has(y), y);
  // Genel: katalogda dosya paylaşan çok sayıda madde çifti var (silme «başka kayıt kullanıyor mu» diye bakmak zorunda).
  const paylasanlar = sesli.filter((o) => m.sesYollari(o).some((y) => y === '/media/ses/ayet/1-1.mp3'));
  assert.ok(paylasanlar.length >= 20, `1-1.mp3 yalnız ${paylasanlar.length} maddede`);
});
