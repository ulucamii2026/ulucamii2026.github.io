/**
 * scripts/ezber-dua-kitap.mjs — kitap kaynaklı dua motoru (24 Ekim 2026).
 *
 * Yerel Diyanet kitap arşivi depoda yoktur; bu test motoru SENTETİK, dinî içeriği olmayan küçük Markdown kaynaklarla sınar
 * (geçici klasör, test sonunda silinir). Gerçek dua metinlerinin doğruluğunu `tests/ezber-madde-metni.test.mjs` (özet, iskelet,
 * fixtür) ve `scripts/ezber-dua-cek.mjs` (her çalıştırmada sözcüğü sözcüğüne doğrulama) güvence altına alır.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KOKLER, anlamCoz, arapcaAralik, arapcaDuzenle, arapcaKes, kitapDuasi, metniDogrula } from '../scripts/ezber-dua-kitap.mjs';

let kok; const eskiKurs = KOKLER.kurs;
const K = (dosya, ek = {}) => ({ kok: 'kurs', dosya, ...ek });

before(() => {
  kok = mkdtempSync(join(tmpdir(), 'ezber-dua-kitap-'));
  KOKLER.kurs = kok;
  // Sayfa işareti sayfanın BAŞINDA durur. «أَخَذَ» cümle başında hemzeli kelime, «إِنَّ» tek harfli iskelet (kelime ortasından kesme tuzağı).
  writeFileSync(join(kok, 'arapca-a.md'), [
    '<!-- s. 10 -->', '', 'Ders: أَخَذَ الطَّالِبُ كِتَابًا ثُمَّ كَتَبَ دَرْسًا', '',
    '<!-- s. 11 -->', '', 'وَقَالَ إِنَّ الْعِلْمَ نُورٌ', '',
  ].join('\n'));
  // İkinci kaynak: harekesiz, iskeleti aynı.
  writeFileSync(join(kok, 'arapca-d.md'), ['<!-- s. 77 -->', '', 'أخذ الطالب كتابا ثم كتب درسا', ''].join('\n'));
  // İkinci kaynak: iskeleti ayrışan (kitap yerine kalem).
  writeFileSync(join(kok, 'arapca-e.md'), ['<!-- s. 5 -->', '', 'أخذ الطالب قلما ثم كتب درسا', ''].join('\n'));
  writeFileSync(join(kok, 'anlam-b.md'), [
    '<!-- s. 5 -->', '', 'Öğrenci çalıştı; kalemi aldı. Allah’ın adıyla.[^1] Metin[^1] devam.', '',
    '<!-- s. 6 -->', '', 'İkinci sayfa metni *burada*.', '', 'L’enfant a écrit sa leçon.', '',
  ].join('\n'));
  writeFileSync(join(kok, 'sayfasiz.md'), 'Öğrenci çalıştı; kalemi aldı.\n');
});
after(() => { KOKLER.kurs = eskiKurs; rmSync(kok, { recursive: true, force: true }); });

test('arapcaAralik: cümle başındaki hemzeli kelime baştan alınır; sayfa aralığı bölüm başından sonuna', () => {
  const r = arapcaAralik(K('arapca-a.md'), [{ bas: 'أخذ', son: 'درسا' }]);
  assert.ok(r.metin.startsWith('أَخَذَ الطَّالِبُ'), `ilk harf ve hemze kaybolmamalı: ${r.metin}`);
  assert.ok(r.metin.endsWith('دَرْسًا'), 'son kelimenin hareke ve tanvini aralıkta kalır');
  assert.ok(!/[A-Za-z]/.test(r.metin), 'Latin başlık («Ders:») aralığa girmez');
  assert.equal(r.sayfa, '10');
  assert.equal(arapcaAralik(K('arapca-a.md'), [{ bas: 'أخذ', son: 'نور' }]).sayfa, '10–11', 'sayfa sınırı aşan aralık');
});

test('arapcaAralik: nth ikinci geçişi seçer; çapa yoksa ya da yalnız kelime ortasında geçiyorsa hata', () => {
  const ikinci = arapcaAralik(K('arapca-a.md'), [{ bas: 'كتب', nth: 2 }]);
  assert.equal(ikinci.metin, 'كَتَبَ', 'ikinci «كتب» fiildir, ilki «كِتَابًا»');
  assert.throws(() => arapcaAralik(K('arapca-a.md'), [{ bas: 'كتب', nth: 3 }]), /başlangıç çapası bulunamadı/);
  assert.throws(() => arapcaAralik(K('arapca-a.md'), [{ bas: 'طال' }]), /başlangıç çapası bulunamadı/, 'tam kelime sınırı ister: «طال» ⊄ «لطلب»');
  assert.throws(() => arapcaAralik(K('arapca-a.md'), [{ bas: 'نور', son: 'اخذ' }]), /bitiş çapası bulunamadı/, 'bitiş, başlangıçtan sonra aranır');
});

test('arapcaAralik: kesit sınırı ve dosya yok hatası', () => {
  const k = arapcaAralik(K('arapca-a.md', { kesit: ['وَقَالَ'] }), [{ bas: 'نور' }]);
  assert.equal(k.sayfa, '11');
  assert.throws(() => arapcaAralik(K('arapca-a.md', { kesit: ['yok böyle bir şey'] }), [{ bas: 'نور' }]), /kesit başlangıcı bulunamadı/);
  assert.throws(() => arapcaAralik(K('olmayan.md'), [{ bas: 'نور' }]), /kaynak dosya yok/);
  assert.throws(() => arapcaAralik({ kok: 'bilinmeyen', dosya: 'x' }, []), /bilinmeyen kaynak kökü/);
});

test('arapcaDuzenle: kitap süsleri atılır, ayrı yazılmış «وَ» sonraki kelimeye bağlanır, Latin harf kalırsa hata', () => {
  assert.equal(arapcaDuzenle('﴿ كَتَبَ ۞ دَرْسًا ﴾'), 'كَتَبَ دَرْسًا');
  assert.equal(arapcaDuzenle('وَ قَالَ'), 'وَقَالَ');
  assert.throws(() => arapcaDuzenle('كَتَبَ (1) دَرْسًا'), /Latin harf ya da rakam kaldı/);
});

test('arapcaKes: kelime ortasından değil gerçek kelime başından keser («إِنَّ» tek harfli iskelet)', () => {
  const [a, b] = arapcaKes('وَقَالَ إِنَّ الْعِلْمَ نُورٌ', ['ان'], 'deneme');
  assert.equal(a, 'وَقَالَ');
  assert.equal(b, 'إِنَّ الْعِلْمَ نُورٌ');
  assert.deepEqual(arapcaKes('وَقَالَ إِنَّ الْعِلْمَ نُورٌ', [], 'deneme'), ['وَقَالَ إِنَّ الْعِلْمَ نُورٌ']);
  assert.throws(() => arapcaKes('وَقَالَ نُورٌ', ['قلم'], 'deneme'), /«قلم» çapası bulunamadı/);
});

test('metniDogrula: tırnak, yıldız, dipnot imi ve yorum farkı yok sayılır; sayfa aralığı döner', () => {
  assert.equal(metniDogrula("Allah'ın adıyla.", K('anlam-b.md'), 't'), '5', 'dik tırnak = kıvrık tırnak');
  assert.equal(metniDogrula('Metin devam.', K('anlam-b.md'), 't'), '5', 'dipnot imi [^1] atılır');
  assert.equal(metniDogrula('İkinci sayfa metni burada.', K('anlam-b.md'), 't'), '6', '*vurgu* imleri atılır');
  assert.equal(metniDogrula('kalemi aldı. Allah’ın adıyla. Metin devam. İkinci sayfa', K('anlam-b.md'), 't'), '5–6', 'sayfa sınırını aşan metin');
  assert.equal(metniDogrula('Öğrenci çalıştı', K('sayfasiz.md'), 't'), '', 'sayfa işareti yoksa sayfa boş');
});

test('metniDogrula: değişmiş ya da ezberden yazılmış metin bulunamaz', () => {
  assert.throws(() => metniDogrula('kalemi almadı', K('anlam-b.md'), 'dua/anlam'), /sözcüğü sözcüğüne bulunamadı/);
  assert.throws(() => metniDogrula('Ogrenci calisti', K('anlam-b.md'), 'dua/anlam'), /sözcüğü sözcüğüne bulunamadı/, 'ASCII sadeleştirme de farktır');
});

test('anlamCoz: dizi parçaları ve gruplar bölümleri boşluksuz kaplar; künye sayfa numarasını taşır', () => {
  const r = anlamCoz({
    kaynak: K('anlam-b.md', { kunye: 'Deneme kitabı, s. {s}' }),
    dizi: ['Öğrenci çalıştı', 'kalemi aldı', { metin: 'İkinci sayfa metni burada' }],
    gruplar: [[1, 1], [2, 3], [4, 4]],
  }, 4, 'd', 'tr');
  assert.deepEqual(r.parcalar, ['Öğrenci çalıştı', 'kalemi aldı', 'İkinci sayfa metni burada']);
  assert.deepEqual(r.gruplar, [[1, 1], [2, 3], [4, 4]]);
  assert.equal(r.kunye, 'Deneme kitabı, s. 5–6', 'parçaların sayfa aralığı birleşir');
});

test('anlamCoz: parça başına kaynak künyesi ayrı yazılır; gruplar yoksa bölüm başına bir parça', () => {
  const r = anlamCoz({
    kaynak: K('anlam-b.md', { kunye: 'Kitap A, s. {s}' }),
    dizi: ['Öğrenci çalıştı', { metin: 'burada', kaynak: K('anlam-b.md', { kunye: 'Kitap B, s. {s}' }) }],
  }, 2, 'd', 'tr');
  assert.equal(r.kunye, 'Kitap A, s. 5; Kitap B, s. 6');
  assert.deepEqual(r.gruplar, [[1, 1], [2, 2]]);
});

test('anlamCoz: tam paragraf ve kesim çapaları (metin birebir kaplanır); Fransızca tipografi', () => {
  const r = anlamCoz({ kaynak: K('anlam-b.md', { kunye: 'K, s. {s}' }), metin: 'Öğrenci çalıştı; kalemi aldı.', kesim: ['kalemi'] }, 2, 'd', 'tr');
  assert.deepEqual(r.parcalar, ['Öğrenci çalıştı;', 'kalemi aldı.']);
  assert.throws(() => anlamCoz({ kaynak: K('anlam-b.md', { kunye: 'K' }), metin: 'Öğrenci çalıştı; kalemi aldı.', kesim: ['yok'] }, 2, 'd'), /«yok» çapası bulunamadı/);
  const fr = anlamCoz({ kaynak: K('anlam-b.md', { kunye: 'K, s. {s}' }), dizi: ["L'enfant a écrit sa leçon"] }, 1, 'd', 'fr');
  assert.deepEqual(fr.parcalar, ["L'enfant a écrit sa leçon"], 'FR metinde dik kesme');
  const tr = anlamCoz({ kaynak: K('anlam-b.md', { kunye: 'K' }), dizi: ["Allah'ın adıyla"] }, 1, 'd', 'tr');
  assert.deepEqual(tr.parcalar, ['Allah’ın adıyla'], 'TR metinde kıvrık kesme');
});

test('anlamCoz: gruplar bölümleri kaplamıyorsa, parça sayısı uyuşmuyorsa ya da sayfa istenip işaret yoksa hata', () => {
  const dizi = ['Öğrenci çalıştı', 'kalemi aldı'];
  const kaynak = K('anlam-b.md', { kunye: 'K' });
  assert.throws(() => anlamCoz({ kaynak, dizi, gruplar: [[1, 1], [3, 3]] }, 3, 'd'), /boşluksuz kaplamıyor/);
  assert.throws(() => anlamCoz({ kaynak, dizi, gruplar: [[1, 1], [2, 2]] }, 3, 'd'), /2 bölümü kaplıyor, 3 bölüm var/);
  assert.throws(() => anlamCoz({ kaynak, dizi }, 3, 'd'), /2 parça, 3 grup/);
  assert.throws(() => anlamCoz({ kaynak: K('sayfasiz.md', { kunye: 'K, s. {s}' }), dizi: ['Öğrenci çalıştı'] }, 1, 'd'), /sayfa ister ama kaynakta sayfa işareti yok/);
  assert.equal(anlamCoz({ kaynak: K('sayfasiz.md', { kunye: 'K' }), dizi: ['Öğrenci çalıştı'] }, 1, 'd').kunye, 'K', 'sayfa istemeyen künye sayfasız kaynakla geçer');
});

const ana = () => ({ ...K('arapca-a.md', { kunye: 'Ana kitap, s. {s}' }), parcalar: [{ bas: 'أخذ', son: 'درسا' }] });
const ikinci = (dosya, ek = {}) => ({ ...K(dosya, { kunye: 'İkinci kitap, s. {s}' }), parcalar: [{ bas: 'أخذ', son: 'درسا' }], ...ek });
const anlam = () => ({ kaynak: K('anlam-b.md', { kunye: 'Anlam kitabı, s. {s}' }), dizi: ['Öğrenci çalıştı'] });
const dua = (kitap) => ({ kitap: { ana: ana(), anlam: anlam(), ...kitap } });

test('kitapDuasi: ana kaynak + iskeleti aynı ikinci kaynak → bölüm, künye, fixtür kaydı', () => {
  const r = kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md')] }));
  assert.deepEqual(r.ar, ['أَخَذَ الطَّالِبُ كِتَابًا ثُمَّ كَتَبَ دَرْسًا']);
  assert.equal(r.kaynakAr, 'Ana kitap, s. 10 ↔ İkinci kitap, s. 77');
  assert.equal(r.ikinci.length, 1);
  assert.deepEqual(r.ikinci[0].bolumler, [1]);
  assert.match(r.ikinci[0].iskelet, /^[0-9a-f]{16}$/);
  assert.ok(!('fark' in r.ikinci[0]));
  assert.equal(r.tr.kunye, 'Anlam kitabı, s. 5');
  assert.equal(r.fr, undefined);
  assert.equal(r.okunus, undefined);
});

test('kitapDuasi: kesim bölümleri ve bölümlere bağlı ikinci kaynak; her bölüm iskeletçe doğrulanmalı', () => {
  const kitap = { ana: { ...K('arapca-a.md', { kunye: 'Ana, s. {s}' }), parcalar: [{ bas: 'أخذ', son: 'درسا' }] }, kesim: ['ثم'], anlam: { ...anlam(), dizi: ['Öğrenci çalıştı', 'kalemi aldı'] } };
  const r = kitapDuasi('d-deneme', { kitap: {
    ...kitap,
    ikinci: [ikinci('arapca-d.md', { parcalar: [{ bas: 'أخذ', son: 'كتابا' }], bolumler: [1] }), ikinci('arapca-d.md', { parcalar: [{ bas: 'ثم', son: 'درسا' }], bolumler: [2] })],
  } });
  assert.equal(r.ar.length, 2);
  assert.ok(r.ar[1].startsWith('ثُمَّ'));
  assert.throws(() => kitapDuasi('d-deneme', { kitap: { ...kitap, ikinci: [ikinci('arapca-d.md', { parcalar: [{ bas: 'أخذ', son: 'كتابا' }], bolumler: [1] })] } }),
    /2\. bölümü iskeletçe doğrulayan ikinci Diyanet kaynağı yok/);
});

test('kitapDuasi: ikinci kaynak yoksa, iskelet ayrışıyorsa ya da yalnız farklı kaynak varsa madde yazılmaz', () => {
  assert.throws(() => kitapDuasi('d-deneme', dua({})), /1\. bölümü iskeletçe doğrulayan ikinci Diyanet kaynağı yok/);
  assert.throws(() => kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-e.md')] })), /harf iskeletinde ayrışıyor/);
  assert.throws(() => kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-e.md', { fark: 'kitap ↔ kalem' })] })), /iskeletçe doğrulayan ikinci Diyanet kaynağı yok/,
    'gerekçeli fark tek başına doğrulama sayılmaz');
});

test('kitapDuasi: gerekçeli fark, iskeleti eşit başka kaynak varken kayda geçer; gereksiz fark kaydı reddedilir', () => {
  const r = kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md'), ikinci('arapca-e.md', { fark: 'kitap ↔ kalem' })] }));
  assert.equal(r.ikinci.length, 2);
  assert.equal(r.ikinci[1].fark, 'kitap ↔ kalem');
  assert.match(r.ikinci[1].bizim, /^[0-9a-f]{16}$/);
  assert.throws(() => kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md', { fark: 'yok aslında' })] })), /fark kaydı artık gereksiz/);
});

test('kitapDuasi: düzeltme kaynakta tam bir kez geçmeli; sayfa isteyen künye sayfa işareti ister', () => {
  const ok = kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md')], duzelt: [{ bul: 'كِتَابًا', yerine: 'كِتَابٌ', neden: 'deneme' }] }));
  assert.ok(ok.ar[0].includes('كِتَابٌ'));
  assert.deepEqual(ok.duzeltmeler, [{ bul: 'كِتَابًا', yerine: 'كِتَابٌ', neden: 'deneme' }]);
  assert.throws(() => kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md')], duzelt: [{ bul: 'قلم', yerine: 'x', neden: 'n' }] })), /kaynakta 0 kez geçiyor/);
  assert.throws(() => kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md')], duzelt: [{ bul: 'ا', yerine: 'x', neden: 'n' }] })), /kez geçiyor \(1 olmalı\)/);
});

test('kitapDuasi: Fransızca anlam ve okunuş da sözcüğü sözcüğüne doğrulanır', () => {
  const fr = { kaynak: K('anlam-b.md', { kunye: 'Je vais, p. {s}' }), dizi: ["L'enfant a écrit sa leçon"] };
  const okunus = { kaynak: K('anlam-b.md', { kunye: 'Okunuş, s. {s}' }), dizi: ['kalemi aldı'] };
  const r = kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md')], fr, okunus }));
  assert.deepEqual(r.fr.parcalar, ["L'enfant a écrit sa leçon"]);
  assert.deepEqual(r.okunus.parcalar, ['kalemi aldı']);
  assert.throws(() => kitapDuasi('d-deneme', dua({ ikinci: [ikinci('arapca-d.md')], fr: { ...fr, dizi: ["L'enfant a copié"] } })), /sözcüğü sözcüğüne bulunamadı/);
});
