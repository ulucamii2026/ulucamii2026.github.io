/**
 * Ders defteri çevirisi — saf katman (14 Eyl 2026).
 * Rıdvan: «iletişim tercihi fransızca olan velilere benim türkçe olarak doldurduğum ekranlar fransızca kaydedilsin.»
 * Kalıp cümleler elle yazılmış Fransızcayla birebir; serbest cümle makineye gider; yarım çeviri asla.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/defter-ceviri-test.mjs');
await build({
  stdin: { contents: 'export * from "./src/lib/defter-ceviri.ts"; export * from "./src/lib/defter-kaliplari.ts"; export { GELMEDI_NOTU } from "./src/lib/ders-defteri.ts"; export * from "./src/lib/ceviri-servisi.ts";', resolveDir: process.cwd() },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const m = await import(pathToFileURL(outfile).href);
const katalog = JSON.parse(readFileSync('src/data/ders-defteri-2026-2027.json', 'utf8'));
const kuran = katalog.find((d) => d.kod === 'kuran' && d.konu === 'Elif Grubu Harfleri');
const siyer = katalog.find((d) => d.kod === 'siyer');
const sonraki = (d) => katalog[katalog.findIndex((x) => x.id === d.id) + 1] || null;
const kayit = (d, extra = {}) => ({
  id: d.id, donem: '2026-2027', tarih: d.tarih, sira: d.sira, no: d.no, sayfa: d.sayfa, konu: d.konu, kaynak: d.kaynak,
  grup: '', durum: 'islendi', giris: 'dijital', calisma: '', okunan: '', dikkat: '', oz: '', odev: '', sonraki: '', surum: 1, ...extra,
});
const makineKaydedici = (cevap = (t) => `[FR] ${t}`) => {
  const cagrilar = [];
  const makine = async (metinler) => { cagrilar.push(metinler); return metinler.map(cevap); };
  return { makine, cagrilar };
};

test('plandaki her ders başlığının Fransızcası var; «Mahomet» yok; numaralar korunur', () => {
  const eksik = [...new Set(katalog.map((d) => d.konu))].filter((k) => m.konuFr(k) === k);
  assert.deepEqual(eksik, []);
  for (const d of katalog) {
    const fr = m.konuFr(d.konu);
    assert.doesNotMatch(fr, /Mahomet/);
    const n = d.konu.match(/\(\d+\/\d+\)$/);
    if (n) assert.ok(fr.endsWith(n[0]), `${d.konu} → ${fr}`);
  }
  assert.equal(m.konuFr('Kutsal kitabımız Kur\'an\'dır'), 'Notre Livre saint est le Coran');
  assert.equal(m.kaynakFr('Temel Dinî Bilgiler (S. Yazıcı) s. 257–302'), 'Temel Dinî Bilgiler (S. Yazıcı) p. 257–302');
  assert.equal(m.kaynakFr("Elifbâ / Kur'an-ı Kerim"), 'Elifbâ / Coran');
});

test('ekrandaki her kalıp cümlesinin (çip, hazır kayıt, kanonik not) Fransızcası var — Kur’an ve siyer dersinde', () => {
  assert.deepEqual(m.eksikKaliplar(kuran, sonraki(kuran)), []);
  assert.deepEqual(m.eksikKaliplar(siyer, sonraki(siyer)), []);
  assert.deepEqual(m.eksikKaliplar(siyer, null), []);
  // Fransızca cümleler cinsiyetsiz: «il/elle» öznesi yok.
  const sozluk = m.kalipSozlugu(kuran, sonraki(kuran));
  for (const fr of Object.values(sozluk)) assert.doesNotMatch(fr, /\b(Il|Elle) /);
});

test('bölümleme: kalıp cümleler tanınır, aradaki serbest cümle ayrı parça olur; makineye yalnız o gider', async () => {
  const s = m.kalipSozlugu(kuran, sonraki(kuran));
  const metin = `«${kuran.konu}» konusunu birlikte işledik. Derse katılımı güzeldi. Bugün biraz üşüttü ama gayretliydi. Memnunum, elhamdülillah.`;
  const parcalar = m.bolumle(metin, s);
  assert.deepEqual(parcalar.map((p) => !!p.fr), [true, true, false, true]);
  assert.equal(parcalar[2].tr, 'Bugün biraz üşüttü ama gayretliydi.');
  assert.equal(parcalar[0].fr, 'Nous avons travaillé ensemble le thème « Lettres du groupe Elif ».');
  const { makine, cagrilar } = makineKaydedici();
  const c = await m.defterKaydiniCevir(kayit(kuran, { calisma: metin, odev: 'Bu ders için ödev yok.', okunan: 'Elifbâ harfleri, Fâtiha sûresi, kendi listem' }), kuran, sonraki(kuran), 'fr', makine);
  assert.deepEqual(cagrilar, [['Bugün biraz üşüttü ama gayretliydi.', 'kendi listem']]);
  assert.equal(c.calisma, 'Nous avons travaillé ensemble le thème « Lettres du groupe Elif ». Sa participation au cours était bonne. [FR] Bugün biraz üşüttü ama gayretliydi. Très bon travail, al-hamdulillah.');
  assert.equal(c.odev, 'Pas de devoir pour ce cours.');
  assert.equal(c.okunan, 'Lettres de l’Elifbâ, Sourate Al-Fâtiha, [FR] kendi listem');
  assert.equal(c.yontem, 'karma');
  assert.equal(c.id, `${kuran.id}_fr`);
  assert.equal(c.kaynakSurum, 1);
});

test('yalnız kalıp varsa makine hiç çağrılmaz; yalnız serbest metinse yöntem «makine»; eksik yanıt hata', async () => {
  const { makine, cagrilar } = makineKaydedici();
  const h = m.hazirKayitlar(kuran, sonraki(kuran))[0];
  const c = await m.defterKaydiniCevir(kayit(kuran, { calisma: h.alanlar.calisma, odev: h.alanlar.odev }), kuran, sonraki(kuran), 'fr', makine);
  assert.deepEqual(cagrilar, []);
  assert.equal(c.yontem, 'kalip');
  assert.match(c.calisma, /^Nous avons travaillé ensemble le thème « Lettres du groupe Elif »\. Sa participation/);
  const serbest = await m.defterKaydiniCevir(kayit(siyer, { calisma: 'Hikâyeyi anlattım, çok sevdi.' }), siyer, null, 'fr', makine);
  assert.equal(serbest.yontem, 'makine');
  assert.equal(serbest.calisma, '[FR] Hikâyeyi anlattım, çok sevdi.');
  await assert.rejects(() => m.defterKaydiniCevir(kayit(siyer, { calisma: 'Serbest.' }), siyer, null, 'fr', async () => []), /eksik/);
  await assert.rejects(() => m.defterKaydiniCevir(kayit(siyer, { calisma: 'Serbest.' }), siyer, null, 'fr', async () => ['  ']), /eksik/);
  // Gelmeyen öğrencinin kanonik notu kalıptır.
  const g = await m.defterKaydiniCevir(kayit(siyer, { durum: 'mazeretli', calisma: m.GELMEDI_NOTU.mazeretli }), siyer, null, 'fr', makine);
  assert.equal(g.calisma, 'Absence justifiée ; le motif nous a été transmis.');
  assert.equal(g.yontem, 'kalip');
});

test('çeviri güncelliği kaynak sürüme bağlı; Fransızca bülten etiketleri, başlıkları ve eksik listesi', () => {
  const k1 = kayit(kuran, { calisma: 'Derse katılımı güzeldi.', odev: 'Bu ders için ödev yok.', surum: 2 });
  const k2 = kayit(sonraki(kuran), { durum: 'gelmedi', calisma: m.GELMEDI_NOTU.gelmedi });
  const guncel = { id: `${k1.id}_fr`, kayitId: k1.id, dil: 'fr', kaynakSurum: 2, yontem: 'kalip', calisma: 'Sa participation au cours était bonne.', odev: 'Pas de devoir pour ce cours.', sonraki: '', okunan: '', dikkat: '' };
  assert.equal(m.ceviriGuncel(k1, guncel), true);
  assert.equal(m.ceviriGuncel(k1, { ...guncel, kaynakSurum: 1 }), false);
  const b = m.defterdenBultenFr([k2, k1], [guncel]);
  assert.deepEqual(b.eksik, []);
  assert.match(b.ders, new RegExp(`^${k1.tarih} · cours ${k1.sira} · Lettres du groupe Elif\\nCours fait : Sa participation au cours était bonne\\.`));
  assert.match(b.ders, /Ma religion est l'islam\nAbsence$/); // kanonik not durumun tekrarı; iki kez yazılmaz
  assert.equal(b.odev, `${k1.tarih} · cours ${k1.sira} · Lettres du groupe Elif\nPas de devoir pour ce cours.`);
  const eski = m.defterdenBultenFr([k1], [{ ...guncel, kaynakSurum: 1 }]);
  assert.deepEqual(eski.eksik, [k1.id]);
  assert.match(eski.ders, /Cours fait : Derse katılımı güzeldi\./); // çeviri eskiyse Türkçe metin, uyarıyla
  assert.throws(() => m.defterdenBultenFr([], []), /kayıtlı ders/);
});

test('makine ucu: geçici sapma (sağlık JSON’u, 404, ağ hatası) yeniden denenir; ucun hata kodu kalıcıdır; parti 20', async () => {
  const yanit = (govde, status = 200) => ({ ok: status < 400, status, json: async () => govde });
  const kayit = (yanitlar) => {
    const cagrilar = [];
    const fetchFn = async (uc, init) => { cagrilar.push(JSON.parse(init.body)); const y = yanitlar.shift(); if (y instanceof Error) throw y; return y; };
    return { fetchFn, cagrilar };
  };
  // 1) sağlık JSON'u (doGet'e düşen yönlendirme) → yeniden dene → tamam
  let k = kayit([yanit({ ok: true, servis: 'ulucamii-alici', surum: 34 }), yanit({ ok: true, hedef: 'fr', ceviriler: ['A', 'B'] })]);
  const c = m.makineCevirici('https://uc.test/exec', async () => 'jeton', k.fetchFn);
  assert.deepEqual(await c(['a', 'b'], 'fr'), ['A', 'B']);
  assert.equal(k.cagrilar.length, 2);
  assert.deepEqual(k.cagrilar[0], { tur: 'cevir', idToken: 'jeton', hedef: 'fr', metinler: ['a', 'b'] });
  // 2) 404 + ağ hatası + tamam → üç denemede başarı
  k = kayit([yanit('<html>', 404), new TypeError('fetch failed'), yanit({ ok: true, hedef: 'fr', ceviriler: ['A'] })]);
  assert.deepEqual(await m.makineCevirici('https://uc.test/exec', async () => 'jeton', k.fetchFn)(['a'], 'fr'), ['A']);
  assert.equal(k.cagrilar.length, 3);
  // 3) üç kez sapma → en son hata fırlar
  k = kayit([yanit('<html>', 404), yanit('<html>', 404), yanit('<html>', 404), yanit({ ok: true, hedef: 'fr', ceviriler: ['A'] })]);
  await assert.rejects(() => m.makineCevirici('https://uc.test/exec', async () => 'jeton', k.fetchFn)(['a'], 'fr'), /ceviri-http-404/);
  assert.equal(k.cagrilar.length, 3);
  // 4) ucun bilinçli hata kodu tek denemede biter
  k = kayit([yanit({ ok: false, hata: 'ceviri-kapali' }), yanit({ ok: true, hedef: 'fr', ceviriler: ['A'] })]);
  await assert.rejects(() => m.makineCevirici('https://uc.test/exec', async () => 'jeton', k.fetchFn)(['a'], 'fr'), /ceviri-ceviri-kapali/);
  assert.equal(k.cagrilar.length, 1);
  // 5) 25 metin → 20 + 5 iki parti, sıra korunur; uç adresi yoksa makine kapalı
  const metinler = Array.from({ length: 25 }, (_, i) => `m${i}`);
  k = kayit([yanit({ ok: true, hedef: 'fr', ceviriler: metinler.slice(0, 20).map((x) => x.toUpperCase()) }), yanit({ ok: true, hedef: 'fr', ceviriler: metinler.slice(20).map((x) => x.toUpperCase()) })]);
  assert.deepEqual(await m.makineCevirici('https://uc.test/exec', async () => 'jeton', k.fetchFn)(metinler, 'fr'), metinler.map((x) => x.toUpperCase()));
  assert.deepEqual(k.cagrilar.map((x) => x.metinler.length), [20, 5]);
  await assert.rejects(() => m.makineCevirici(undefined, async () => 'jeton', k.fetchFn)(['a'], 'fr'), /ceviri-ucu-yok/);
  assert.deepEqual(await m.makineCevirici(undefined, async () => 'jeton', k.fetchFn)([], 'fr'), []);
});

test('adGizleyici v2: büyük harfli ad [[n]] olur (Türkçe İ, ek korunur), küçük harfli/yaygın sözcük dokunulmaz, bozuk yer tutucu tolerans, yabancı yer tutucu hata', async () => {
  const cagrilar = [];
  const makine = async (m) => { cagrilar.push(m); return m.map((x) => `FR(${x})`); };
  const g = m.adGizleyici(() => ['Tayyip Emre', 'Berber', 'Ayşe', 'Temel', 'Melek', 'Al'])(makine);
  const out = await g(['Derse ilk katılan Tayyip oldu. TAYYİP\'in kardeşi Ayşe Berber de geldi.', 'Emre çok çalıştı; berberde değil, ayşe ile değil.', 'Temel bilgileri evde tekrar etsin; temel konular. Melek gibi çocuk.'], 'fr');
  assert.deepEqual(cagrilar, [[
    'Derse ilk katılan [[1]] oldu. [[1]]\'in kardeşi [[2]] [[3]] de geldi.',
    '[[4]] çok çalıştı; berberde değil, ayşe ile değil.',
    'Temel bilgileri evde tekrar etsin; temel konular. Melek gibi çocuk.',
  ]]);
  assert.deepEqual(out, [
    'FR(Derse ilk katılan Tayyip oldu. Tayyip\'in kardeşi Ayşe Berber de geldi.)',
    'FR(Emre çok çalıştı; berberde değil, ayşe ile değil.)',
    'FR(Temel bilgileri evde tekrar etsin; temel konular. Melek gibi çocuk.)',
  ]);
  assert.ok(m.AD_DEGIL.has('temel') && m.AD_DEGIL.has('muhammed'), 'yaygın sözcük listesi');
  // Bozuk yer tutucu toleransı ([[ 1 ]], [ [1] ]); motorun uydurduğu yer tutucu → hata (yarım çeviri yazılmaz)
  const g2 = m.adGizleyici(() => ['Tayyip'])(async () => ['Bonjour [[ 1 ]] et [ [1] ].']);
  assert.deepEqual(await g2(['Tayyip geldi.'], 'fr'), ['Bonjour Tayyip et Tayyip.']);
  await assert.rejects(m.adGizleyici(() => ['Tayyip'])(async () => ['Bonjour [[9]].'])(['Tayyip geldi.'], 'fr'), /yer-tutucu-bilinmiyor/);
  await assert.rejects(m.adGizleyici(() => ['Tayyip'])(async () => ['[ [1] ] est venu.'])(['Tayyib geldi.'], 'fr'), /yer-tutucu-bilinmiyor/);
  // Ad geçmeyen metinde makineye özgün metin gider.
  const g3 = m.adGizleyici(() => ['Tayyip'])(makine);
  await g3(['Kimse yok.'], 'fr');
  assert.deepEqual(cagrilar.at(-1), ['Kimse yok.']);
});
