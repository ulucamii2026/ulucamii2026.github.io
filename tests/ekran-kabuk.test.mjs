import test from 'node:test';
import assert from 'node:assert/strict';
import { kabukDuyurusu, kabukYukunuCoz, kabukKur, EN_COK_KABUK_DUYURUSU, FS_ONEKI } from '../src/ekran/kabuk.ts';
import { birlesikDuyurular, duyuruAnahtari } from '../src/ekran/veri.ts';

const D = (ek = {}) => ({
  id: 'kermes-1', tur: 'duyuru',
  tr: { baslik: 'Hayır çarşısı', metin: 'Pazar günü cami bahçesinde.' }, fr: { baslik: 'Kermesse', metin: 'Dimanche.' },
  baslangic: '2026-10-01', son: '2026-10-31', hedef: [], ...ek,
});
const yuk = (rev, duyurular) => JSON.stringify({ rev, duyurular });

test('geçerli öğe alınır: kimlik fs: önekli, yalnız görüntü alanları, görsel yok', () => {
  const d = kabukDuyurusu(D({ gorsel: '/x.webp', gizli: 'z' }));
  assert.deepEqual(d, { id: 'fs:kermes-1', tur: 'duyuru', tr: D().tr, fr: D().fr, baslangic: '2026-10-01', son: '2026-10-31', hedef: [] });
  assert.equal(FS_ONEKI, 'fs:');
});

test('nesne olmayan, dizi ya da null öğe reddedilir', () => {
  for (const x of [null, undefined, 5, 'metin', [], [D()]]) assert.equal(kabukDuyurusu(x), null, String(x));
});

test('kimlik yalnız harf, rakam, tire, alt tire ve en çok 64 karakter', () => {
  for (const id of ['', 'a b', '../x', 'a/b', 'x'.repeat(65), 'é', 5, null]) assert.equal(kabukDuyurusu(D({ id })), null, String(id));
  assert.ok(kabukDuyurusu(D({ id: 'x'.repeat(64) })));
  assert.ok(kabukDuyurusu(D({ id: 'A_b-9' })));
});

test('tür duyuru değilse, tarih YYYY-AA-GG değilse reddedilir', () => {
  assert.equal(kabukDuyurusu(D({ tur: 'ayet' })), null);
  for (const t of ['2026-1-1', '01/10/2026', '2026-10-01T00:00', '', 'bugun', 20261001, null]) {
    assert.equal(kabukDuyurusu(D({ baslangic: t })), null, 'başlangıç ' + t);
    assert.equal(kabukDuyurusu(D({ son: t })), null, 'son ' + t);
  }
});

test('hedef dizi olmalı ve yalnız bilinen ekranları içermeli; boş dizi tüm ekranlar', () => {
  assert.ok(kabukDuyurusu(D({ hedef: [] })));
  assert.ok(kabukDuyurusu(D({ hedef: ['ana', 'giris', 'kadin'] })));
  for (const h of ['ana', undefined, null, ['balkon'], [1], [null]]) assert.equal(kabukDuyurusu(D({ hedef: h })), null, JSON.stringify(h));
});

test('bir dil bozuksa öteki alınır; iki dil de bozuksa öğe reddedilir; metin kırpılır, 500 karakter tavanı', () => {
  const bos = { baslik: '   ', metin: 'x' };
  assert.deepEqual(kabukDuyurusu(D({ tr: bos })).tr, undefined);
  assert.deepEqual(kabukDuyurusu(D({ tr: bos })).fr, D().fr);
  assert.equal(kabukDuyurusu(D({ tr: bos, fr: null })), null);
  assert.equal(kabukDuyurusu(D({ tr: 'metin', fr: 5 })), null);
  assert.deepEqual(kabukDuyurusu(D({ tr: { baslik: '  B  ', metin: '  M  ' }, fr: undefined })).tr, { baslik: 'B', metin: 'M' });
  assert.ok(kabukDuyurusu(D({ tr: { baslik: 'b', metin: 'm'.repeat(500) }, fr: undefined })));
  assert.equal(kabukDuyurusu(D({ tr: { baslik: 'b', metin: 'm'.repeat(501) }, fr: undefined })), null);
  assert.equal(kabukDuyurusu(D({ tr: { baslik: 'b'.repeat(501), metin: 'm' }, fr: undefined })), null);
});

test('düşmanca metin olduğu gibi (veri olarak) korunur', () => {
  const kotu = '</script><img src=x onerror=1> "q" \\ \u2028 \u0001 😀';
  assert.equal(kabukDuyurusu(D({ tr: { baslik: kotu, metin: kotu }, fr: undefined })).tr.baslik, kotu);
});

test('yük: dize ya da nesne; rev tam sayı ≥ 0 olmalı; duyurular dizi olmalı', () => {
  assert.deepEqual(kabukYukunuCoz(yuk(3, [D()])).rev, 3);
  assert.deepEqual(kabukYukunuCoz({ rev: 0, duyurular: [] }), { rev: 0, duyurular: [] });
  for (const bozuk of ['{bozuk', 'null', '[]', '""', '5', yuk('1', []), yuk(-1, []), yuk(1.5, []), yuk(null, []), '{"rev":1}', '{"rev":1,"duyurular":{}}']) {
    assert.equal(kabukYukunuCoz(bozuk), null, bozuk);
  }
  for (const x of [undefined, null, 7, true, { rev: NaN, duyurular: [] }, { rev: Infinity, duyurular: [] }, { rev: 1, duyurular: 5 }]) assert.equal(kabukYukunuCoz(x), null);
  assert.equal(kabukYukunuCoz('x'.repeat(200_001)), null);
});

test('yük: bozuk öğeler atlanır, yinelenen kimlikte ilki kalır, en çok 30 öğe', () => {
  const r = kabukYukunuCoz(yuk(1, [D({ id: 'a' }), D({ id: 'bozuk', son: 'yarin' }), D({ id: 'a', tr: { baslik: 'ikinci', metin: 'x' } }), 5, null, D({ id: 'b' })]));
  assert.deepEqual(r.duyurular.map((d) => d.id), ['fs:a', 'fs:b']);
  assert.equal(r.duyurular[0].tr.baslik, 'Hayır çarşısı');
  const cok = Array.from({ length: 45 }, (_, i) => D({ id: 'd' + i }));
  assert.equal(kabukYukunuCoz(yuk(1, cok)).duyurular.length, EN_COK_KABUK_DUYURUSU);
  assert.equal(EN_COK_KABUK_DUYURUSU, 30);
});

test('UluKabukAl: yalnız artan rev listeyi değiştirir; eşit/eski/bozuk yük yok sayılır; her değişimde bir kez bildirir', () => {
  const pencere = {};
  const durum = { rev: -1, duyurular: [] };
  let bildirim = 0;
  kabukKur(pencere, durum, () => { bildirim++; });
  assert.equal(typeof pencere.UluKabukAl, 'function');
  pencere.UluKabukAl(yuk(2, [D({ id: 'a' })]));
  assert.equal(bildirim, 1); assert.equal(durum.rev, 2); assert.deepEqual(durum.duyurular.map((d) => d.id), ['fs:a']);
  pencere.UluKabukAl(yuk(2, [D({ id: 'b' })]));   // eşit rev
  pencere.UluKabukAl(yuk(1, [D({ id: 'c' })]));   // eski rev
  pencere.UluKabukAl('{bozuk');
  pencere.UluKabukAl(undefined);
  assert.equal(bildirim, 1); assert.deepEqual(durum.duyurular.map((d) => d.id), ['fs:a']);
  pencere.UluKabukAl(yuk(3, []));                 // boş liste duyuruyu kaldırır
  assert.equal(bildirim, 2); assert.deepEqual(durum.duyurular, []);
});

test('UluKabukAl: bildirim geri çağrısı fırlatsa da çağırana istisna sızmaz', () => {
  const pencere = {};
  kabukKur(pencere, { rev: -1, duyurular: [] }, () => { throw new Error('çizim patladı'); });
  const eski = console.error; console.error = () => {};
  try { assert.doesNotThrow(() => pencere.UluKabukAl(yuk(1, [D()]))); } finally { console.error = eski; }
});

test('birleşik liste: kabuk önce, akış sonra; akış yoksa yalnız kabuk', () => {
  const akis = { derleme: '', ayar: { slayt: {} }, duyurular: [D({ id: 'akis-1' })] };
  const kabuk = [kabukDuyurusu(D({ id: 'imam-1' }))];
  assert.deepEqual(birlesikDuyurular(akis, kabuk).map((d) => d.id), ['fs:imam-1', 'akis-1']);
  assert.deepEqual(birlesikDuyurular(null, kabuk).map((d) => d.id), ['fs:imam-1']);
  assert.deepEqual(birlesikDuyurular(akis, []).map((d) => d.id), ['akis-1']);
});

test('duyuru anahtarı kabuk listesini kapsar; rev kapsamaz; kabuk boşken eski davranış', () => {
  const akis = { derleme: '', ayar: { slayt: {} }, duyurular: [D({ id: 'akis-1' })] };
  const k1 = [kabukDuyurusu(D({ id: 'imam-1' }))];
  const k2 = [kabukDuyurusu(D({ id: 'imam-1', tr: { baslik: 'Başka', metin: 'x' } }))];
  assert.equal(duyuruAnahtari(akis, []), duyuruAnahtari(akis));
  assert.equal(duyuruAnahtari(akis), JSON.stringify(akis.duyurular));
  assert.notEqual(duyuruAnahtari(akis, k1), duyuruAnahtari(akis));
  assert.notEqual(duyuruAnahtari(akis, k1), duyuruAnahtari(akis, k2));
  assert.equal(duyuruAnahtari(akis, k1), duyuruAnahtari(akis, [kabukDuyurusu(D({ id: 'imam-1' }))]));
  assert.equal(duyuruAnahtari(null, []), undefined);
  assert.equal(typeof duyuruAnahtari(null, k1), 'string');   // akış hiç gelmediyse de kabuk değişimi fark edilir
  assert.notEqual(duyuruAnahtari(null, k1), duyuruAnahtari(null, k2));
});
