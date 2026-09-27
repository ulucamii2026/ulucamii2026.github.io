/**
 * Ezber Kilimi durum makinesi (27 Eyl 2026, Faz 1b) — saf çekirdek testleri. Kurallar: docs/EZBER-KILIMI.md
 * «Durum makinesi ve veri modeli»; plan: docs/superpowers/plans/2026-09-27-ezber-kilimi-faz-1b-durum.md.
 * Neden: hocanın telefonda verdiği her karar (tam / az hatalı / tekrar gelsin) çocuğun kilimini ve veliye giden
 * bilgiyi değiştirir; basamak, kontrol günü ve ödül eşiği yanlış hesaplanırsa emek siliniyor ya da hak edilmemiş
 * rozet çıkıyor demektir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-durum-test.mjs');
await build({
  stdin: { contents: 'export * from "./src/lib/ezber/durum.ts"; export * from "./src/lib/ezber/gecis.ts";', resolveDir: process.cwd() },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const m = await import(pathToFileURL(outfile).href);
const planEslesme = JSON.parse(readFileSync('src/data/ezber/plan-eslesme.json', 'utf8'));
/** Yalnız bu maddeye giden ilk plan dizesi (uzun dizeler testte elle yazılmasın). */
const planDizesi = (id) => Object.keys(planEslesme).find((k) => planEslesme[k].length === 1 && planEslesme[k][0] === id);

const B = '2026-10-17'; // «bugün»: Faz 1'in canlı günü
const d = (basamak, sonrakiKontrol = '', ek = {}) => ({ basamak, kalite: '', notlar: [], sonrakiKontrol, surum: 3, ...ek });

test('Dinleme: 0 ve 1 tam/az ile Hocaya okudu olur (kontrol günü beklenmez), kontrol 7 gün sonra', () => {
  for (const [onceki, kalite] of [[undefined, 'tam'], [undefined, 'az'], [d(1), 'tam'], [d(1, '2026-10-20'), 'az']]) {
    const g = m.dinle(onceki, 's-fatiha', kalite, B);
    assert.equal(g.islem, 'yaz');
    assert.deepEqual(g.durum, { basamak: 2, kalite, notlar: [], sonrakiKontrol: '2026-10-24', surum: (onceki?.surum ?? 0) + 1 });
    assert.deepEqual(g.olay, { ezber: 's-fatiha', tur: 'dinleme', kalite, notlar: [], basamakOnce: onceki?.basamak ?? 0,
      basamakSonra: 2, zorla: false, tarih: B });
  }
});

test('Dinleme: 2 ve 3 yalnız kontrol günü geldiyse ilerler; erken dinleme ve Kalıcı yalnız olaydır', () => {
  let g = m.dinle(d(2, '2026-10-18'), 's-fatiha', 'tam', B);
  assert.equal(g.islem, 'olay');
  assert.deepEqual([g.olay.basamakOnce, g.olay.basamakSonra, g.olay.zorla, g.olay.kalite], [2, 2, false, 'tam']);
  assert.equal('durum' in g, false);
  g = m.dinle(d(2, B), 's-fatiha', 'az', B);
  assert.deepEqual(g.durum, { basamak: 3, kalite: 'az', notlar: [], sonrakiKontrol: '2026-11-16', surum: 4 });
  g = m.dinle(d(3, '2026-10-01'), 's-fatiha', 'tam', B);
  assert.deepEqual([g.islem, g.durum.basamak, g.durum.sonrakiKontrol, g.olay.basamakSonra], ['yaz', 4, '', 4]);
  assert.equal(m.dinle(d(3, '2026-11-01'), 's-fatiha', 'tam', B).islem, 'olay');
  g = m.dinle(d(4), 's-fatiha', 'tam', B);
  assert.deepEqual([g.islem, g.olay.basamakOnce, g.olay.basamakSonra], ['olay', 4, 4]);
});

test('«Yine de ilerlet» erken dinlemeyi ilerletir ve olayda işaretlenir; gerekmeyen yerde işaret konmaz', () => {
  let g = m.dinle(d(2, '2026-10-20'), 's-fatiha', 'tam', B, { zorla: true });
  assert.deepEqual([g.durum.basamak, g.durum.sonrakiKontrol, g.olay.zorla], [3, '2026-11-16', true]);
  g = m.dinle(d(3, '2026-11-01'), 's-fatiha', 'az', B, { zorla: true });
  assert.deepEqual([g.durum.basamak, g.durum.sonrakiKontrol, g.olay.zorla], [4, '', true]);
  assert.equal(m.dinle(d(2, B), 's-fatiha', 'tam', B, { zorla: true }).olay.zorla, false);
  assert.equal(m.dinle(undefined, 's-fatiha', 'tam', B, { zorla: true }).olay.zorla, false);
  g = m.dinle(d(4), 's-fatiha', 'tam', B, { zorla: true });
  assert.deepEqual([g.islem, g.olay.zorla], ['olay', false]);
  assert.equal(m.dinle(d(2, '2026-10-20'), 's-fatiha', 'tekrar', B, { zorla: true }).olay.zorla, false);
});

test('«Tekrar gelsin» her zaman bir basamak düşürür (en az 1); kontrol 7 gün sonra', () => {
  for (const [once, sonra] of [[0, 1], [1, 1], [2, 1], [3, 2], [4, 3]]) {
    const onceki = once === 0 ? undefined : d(once, once === 4 || once === 1 ? '' : '2026-12-01');
    const g = m.dinle(onceki, 's-ihlas', 'tekrar', B, { notlar: ['med'] });
    assert.equal(g.islem, 'yaz');
    assert.deepEqual(g.durum, { basamak: sonra, kalite: 'tekrar', notlar: ['med'], sonrakiKontrol: '2026-10-24',
      surum: (onceki?.surum ?? 0) + 1 });
    assert.deepEqual([g.olay.basamakOnce, g.olay.basamakSonra, g.olay.kalite], [once, sonra, 'tekrar']);
  }
});

test('Kontrol günü sınırı ve takvim dönümleri', () => {
  assert.equal(m.kontrolGeldi(d(2, B), B), true);
  assert.equal(m.kontrolGeldi(d(2, '2026-10-16'), B), true);
  assert.equal(m.kontrolGeldi(d(2, '2026-10-18'), B), false);
  assert.equal(m.kontrolGeldi(d(1), B), false);
  assert.equal(m.kontrolGeldi(undefined, B), false);
  assert.equal(m.dinle(undefined, 's-fatiha', 'tam', '2026-12-28').durum.sonrakiKontrol, '2027-01-04');
  assert.equal(m.dinle(d(2, '2027-02-01'), 's-fatiha', 'tam', '2027-02-01').durum.sonrakiKontrol, '2027-03-03');
  // Yaz saati dönümü (25 Ekim 2026) günü kaydırmaz.
  assert.equal(m.dinle(undefined, 's-fatiha', 'tam', '2026-10-22').durum.sonrakiKontrol, '2026-10-29');
  assert.equal(m.dinle(undefined, 's-fatiha', 'tam', '2028-02-26').durum.sonrakiKontrol, '2028-03-04');
});

test('Notlar kalıp anahtarıdır: en çok 3, biçimli, yinelenmez; durum ve olaya kopya olarak geçer', () => {
  const notlar = ['med', 'mahrec'];
  const g = m.dinle(undefined, 's-fatiha', 'az', B, { notlar });
  assert.deepEqual(g.durum.notlar, ['med', 'mahrec']);
  assert.deepEqual(g.olay.notlar, ['med', 'mahrec']);
  notlar.push('gayret');
  assert.equal(g.durum.notlar.length, 2);
  assert.notEqual(g.durum.notlar, g.olay.notlar);
  for (const kotu of [['a', 'b', 'c', 'd'], ['Med'], ['med', 'med'], [''], ['x'.repeat(41)], [3], ['med yeri'], 'med'])
    assert.throws(() => m.dinle(undefined, 's-fatiha', 'tam', B, { notlar: kotu }), /not/i, JSON.stringify(kotu));
  const e = m.dinle(d(2, '2026-10-20'), 's-fatiha', 'tam', B, { notlar: ['gayret'] });
  assert.deepEqual([e.islem, e.olay.notlar], ['olay', ['gayret']]);
});

test('Katalog dışı kimlik, geçersiz gün ve kalite reddedilir', () => {
  assert.throws(() => m.dinle(undefined, 'ezber-fatiha', 'tam', B), /katalog/i);
  assert.throws(() => m.dinle(undefined, 'constructor', 'tam', B), /katalog/i);
  assert.throws(() => m.dinle(undefined, 's-fatiha', 'tam', '2026-02-30'), /gün/i);
  assert.throws(() => m.dinle(undefined, 's-fatiha', 'tam', '17.10.2026'), /gün/i);
  assert.throws(() => m.dinle(undefined, 's-fatiha', 'iyi', B), /kalite/i);
  assert.throws(() => m.ata(undefined, 'yok', B), /katalog/i);
  assert.throws(() => m.duzelt(undefined, 's-fatiha', null, 'dün'), /gün/i);
  assert.throws(() => m.gecisDurumu('ogrendi', 'x-yok', B), /katalog/i);
});

test('Atama: kaydı olmayan madde Çalışıyor olur; kaydı olana dokunulmaz', () => {
  assert.deepEqual(m.ata(undefined, 's-nas', B), {
    islem: 'yaz', durum: { basamak: 1, kalite: '', notlar: [], sonrakiKontrol: '', surum: 1 },
    olay: { ezber: 's-nas', tur: 'atama', kalite: '', notlar: [], basamakOnce: 0, basamakSonra: 1, zorla: false, tarih: B },
  });
  assert.equal(m.ata(d(1), 's-nas', B), null);
  assert.equal(m.ata(d(3, '2026-11-01'), 's-nas', B), null);
});

test('Elle basamak: kontrol günü basamaktan türer; son dinlemenin kalitesi ve notu korunur', () => {
  assert.deepEqual(m.elleBasamak(2, undefined, B), { basamak: 2, kalite: '', notlar: [], sonrakiKontrol: '2026-10-24' });
  assert.deepEqual(m.elleBasamak(3, d(2, '2026-10-20', { kalite: 'az', notlar: ['med'] }), B),
    { basamak: 3, kalite: 'az', notlar: ['med'], sonrakiKontrol: '2026-11-16' });
  assert.deepEqual(m.elleBasamak(4, d(3, '2026-11-01', { kalite: 'tam' }), B), { basamak: 4, kalite: 'tam', notlar: [], sonrakiKontrol: '' });
  assert.deepEqual(m.elleBasamak(1, d(2, '2026-10-20'), B), { basamak: 1, kalite: '', notlar: [], sonrakiKontrol: '' });
  assert.equal(m.elleBasamak(0, d(2, '2026-10-20'), B), null);
  assert.throws(() => m.elleBasamak(5, undefined, B), /basamak/i);
});

test('Düzeltme: hedef aynen yazılır, aynı hedef işlem değildir, boş hedef kaydı kaldırır, geri alma çalışır', () => {
  const once = d(2, '2026-10-20');
  let g = m.duzelt(once, 's-fil', m.elleBasamak(3, once, B), B);
  assert.deepEqual(g, { islem: 'yaz', durum: { basamak: 3, kalite: '', notlar: [], sonrakiKontrol: '2026-11-16', surum: 4 },
    olay: { ezber: 's-fil', tur: 'duzeltme', kalite: '', notlar: [], basamakOnce: 2, basamakSonra: 3, zorla: false, tarih: B } });
  assert.deepEqual(m.duzelt(once, 's-fil', null, B), { islem: 'sil', surum: once.surum,
    olay: { ezber: 's-fil', tur: 'duzeltme', kalite: '', notlar: [], basamakOnce: 2, basamakSonra: 0, zorla: false, tarih: B } });
  assert.equal(m.duzelt(undefined, 's-fil', null, B), null);
  const ayni = d(2, '2026-10-20', { kalite: 'tam', notlar: ['med'] });
  assert.equal(m.duzelt(ayni, 's-fil', { basamak: 2, kalite: 'tam', notlar: ['med'], sonrakiKontrol: '2026-10-20' }, B), null);
  // Geri al: yanlış düğmeden önceki durum aynen geri gelir, sürüm ilerler.
  const eski = d(2, '2026-10-20', { kalite: 'az', notlar: ['med'] });
  const yanlis = m.dinle(eski, 's-fil', 'tam', '2026-10-20');
  g = m.duzelt(yanlis.durum, 's-fil', { basamak: eski.basamak, kalite: eski.kalite, notlar: eski.notlar, sonrakiKontrol: eski.sonrakiKontrol }, '2026-10-20');
  assert.deepEqual(g.durum, { ...eski, surum: yanlis.durum.surum + 1 });
  assert.deepEqual([g.olay.basamakOnce, g.olay.basamakSonra], [3, 2]);
  // Tutarsız hedef reddedilir (kural da reddeder).
  assert.throws(() => m.duzelt(undefined, 's-fil', { basamak: 2, kalite: '', notlar: [], sonrakiKontrol: '' }, B), /kontrol/i);
  assert.throws(() => m.duzelt(undefined, 's-fil', { basamak: 4, kalite: '', notlar: [], sonrakiKontrol: B }, B), /kontrol/i);
  assert.throws(() => m.duzelt(undefined, 's-fil', { basamak: 1, kalite: 'iyi', notlar: [], sonrakiKontrol: '' }, B), /kalite/i);
});

test('Eski durumların geçişi: öğrendi → Hocaya okudu (+7), tekrar → Çalışıyor, başlamadı → kayıt yok', () => {
  assert.deepEqual(m.gecisDurumu('ogrendi', 's-fatiha', B), {
    islem: 'yaz', durum: { basamak: 2, kalite: '', notlar: [], sonrakiKontrol: '2026-10-24', surum: 1 },
    olay: { ezber: 's-fatiha', tur: 'gecis', kalite: '', notlar: [], basamakOnce: 0, basamakSonra: 2, zorla: false, tarih: B },
  });
  const t = m.gecisDurumu('tekrar', 's-fatiha', B);
  assert.deepEqual([t.durum.basamak, t.durum.sonrakiKontrol, t.olay.basamakSonra], [1, '', 1]);
  assert.equal(m.gecisDurumu('baslamadi', 's-fatiha', B), null);
  assert.throws(() => m.gecisDurumu('bitti', 's-fatiha', B), /eski durum/i);
});

test('Firestore verisi süzülür: bozuk, tutarsız ve katalog dışı madde düşer; sunucu alanları taşınmaz', () => {
  const iyi = { basamak: 2, kalite: 'tam', notlar: ['med'], sonrakiKontrol: '2026-10-24', surum: 2, son: { seconds: 1 } };
  const s = m.ezberDurumuOku({ ogeler: {
    's-fatiha': iyi,
    'ezber-fatiha': iyi,
    'constructor': iyi,
    's-ihlas': { ...iyi, basamak: 5 },
    's-kevser': { ...iyi, sonrakiKontrol: '' },
    's-asr': { ...iyi, kalite: 'super' },
    's-fil': { ...iyi, notlar: 'med' },
    's-nas': { ...iyi, surum: 0 },
    's-felak': null,
    's-kureys': { ...iyi, sonrakiKontrol: '2026-13-01' },
    's-nasr': { ...iyi, basamak: 4, sonrakiKontrol: '' },
  } });
  assert.deepEqual(Object.keys(s).sort(), ['s-fatiha', 's-nasr']);
  assert.deepEqual(s['s-fatiha'], { basamak: 2, kalite: 'tam', notlar: ['med'], sonrakiKontrol: '2026-10-24', surum: 2 });
  assert.notEqual(s['s-fatiha'].notlar, iyi.notlar);
  for (const bos of [undefined, null, 3, 'x', {}, { ogeler: 5 }, { ogeler: [] }, { ogeler: null }]) assert.deepEqual(m.ezberDurumuOku(bos), {});
});

test('Tekrar sırası: kontrol günü gelenler, en eskisi önce; eşitlikte katalog sırası; Kalıcı ve kontrolsüz yok', () => {
  const ogeler = {
    's-nas': d(2, '2026-10-10'), 's-fatiha': d(3, B), 's-ihlas': d(2, '2026-10-10'),
    's-kevser': d(2, '2026-10-18'), 's-asr': d(4), 's-fil': d(1), 's-felak': d(1, '2026-10-16'),
  };
  assert.deepEqual(m.kontrolSirasi(ogeler, B), ['s-ihlas', 's-nas', 's-felak', 's-fatiha']);
  assert.deepEqual(m.kontrolSirasi({}, B), []);
});

test('Bölümler: 8 şerit + Amme\'nin 5 durağı + kenar suyu; ödül yalnız şerit ve duraklarda', () => {
  const b = m.bolumler();
  assert.deepEqual(b.map((x) => x.anahtar), ['1', '2', '3', '4', '5', '6', '7', '8', '8.1', '8.2', '8.3', '8.4', '8.5', 'kenar']);
  assert.deepEqual(Object.fromEntries(b.map((x) => [x.anahtar, x.ogeler.length])),
    { 1: 5, 2: 8, 3: 6, 4: 6, 5: 5, 6: 5, 7: 8, 8: 25, 8.1: 10, 8.2: 4, 8.3: 4, 8.4: 4, 8.5: 3, kenar: 13 });
  assert.deepEqual(b.filter((x) => !x.odullu).map((x) => x.anahtar), ['kenar']);
  assert.deepEqual(b.find((x) => x.anahtar === '3').ogeler,
    ['s-fatiha', 's-ihlas', 's-kevser', 'd-ruku-tesbihi', 'd-tesmi-tahmid', 'd-secde-tesbihi']);
  assert.deepEqual(b.find((x) => x.anahtar === '8.5'), { anahtar: '8.5', seviye: 8, durak: 5, odullu: true, ogeler: ['s-abese', 's-naziat', 's-nebe'] });
  assert.equal(b.filter((x) => x.durak === undefined).reduce((t, x) => t + x.ogeler.length, 0), 81);
});

test('Ödül eşikleri: rozet tümü ≥ 2, sertifika tümü ≥ 3, altın kenar tümü 4; başka bölüm sayılmaz', () => {
  const bolum = m.bolumler().find((x) => x.anahtar === '8.5');
  const oz = (ogeler) => m.bolumOzeti(bolum, ogeler);
  let o = oz({});
  assert.deepEqual([o.sayilar, o.rozet, o.sertifika, o.altin], [[3, 0, 0, 0, 0], false, false, false]);
  o = oz({ 's-abese': d(2, '2026-10-24'), 's-naziat': d(3, '2026-11-01'), 's-nebe': d(1) });
  assert.deepEqual([o.sayilar, o.rozet], [[0, 1, 1, 1, 0], false]);
  o = oz({ 's-abese': d(2, '2026-10-24'), 's-naziat': d(3, '2026-11-01'), 's-nebe': d(4) });
  assert.deepEqual([o.rozet, o.sertifika, o.altin], [true, false, false]);
  o = oz({ 's-abese': d(3, '2026-11-01'), 's-naziat': d(3, '2026-11-01'), 's-nebe': d(4) });
  assert.deepEqual([o.rozet, o.sertifika, o.altin], [true, true, false]);
  o = oz({ 's-abese': d(4), 's-naziat': d(4), 's-nebe': d(4), 's-fatiha': d(1) });
  assert.deepEqual([o.sayilar, o.altin], [[0, 0, 0, 0, 3], true]);
  const kenar = m.bolumler().find((x) => x.anahtar === 'kenar');
  const k = m.bolumOzeti(kenar, Object.fromEntries(kenar.ogeler.map((id) => [id, d(4)])));
  assert.deepEqual([k.sayilar[4], k.rozet, k.sertifika, k.altin], [13, false, false, false]);
  assert.equal(m.bolumOzetleri({}).length, 14);
});

test('Geçiş planı: aynı maddeye iki dize en ileri durumu alır; mevcut kayıt ezilmez; başlamadı ve boş yazılmaz', () => {
  const tevhidUzun = planDizesi('d-kelime-i-tevhid');
  assert.ok(tevhidUzun && tevhidUzun !== 'Kelime-i Tevhid ve Kelime-i Şehâdet');
  const girdi = [
    { ref: 'ogr-b', ezber: { 'Fâtiha': 'ogrendi', 'Kevser; Asr; Nasr': 'tekrar', 'İhlâs': 'baslamadi', 'Tebbet': '' } },
    { ref: 'ogr-a', ezber: { 'Kelime-i Tevhid ve Kelime-i Şehâdet': 'tekrar', [tevhidUzun]: 'ogrendi', 'Salât-ı ümmiye (kısa salavat)': 'ogrendi' } },
    { ref: 'ogr-c', ezber: {} },
    { ref: 'ogr-d', ezber: null },
    { ref: 'ogr-e', ezber: ['Fâtiha'] },
  ];
  const p = m.gecisPlani(girdi, { 'ogr-b': { 's-asr': d(3, '2026-11-01') } }, B);
  assert.deepEqual(p.yazilacak.map((y) => [y.ref, y.id, y.gecis.durum.basamak, y.gecis.olay.tur]), [
    ['ogr-a', 'd-kelime-i-tevhid', 2, 'gecis'], ['ogr-a', 'd-kelime-i-sehadet', 1, 'gecis'],
    ['ogr-b', 's-fatiha', 2, 'gecis'], ['ogr-b', 's-kevser', 1, 'gecis'], ['ogr-b', 's-nasr', 1, 'gecis'],
  ]);
  assert.deepEqual({ ogrenci: p.ogrenci, ezberli: p.ezberli, atlanan: p.atlanan, karsiliksiz: p.karsiliksiz, basamaklar: p.basamaklar },
    { ogrenci: 5, ezberli: 2, atlanan: 1, karsiliksiz: 1, basamaklar: { 1: 3, 2: 2 } });
  assert.deepEqual([p.eslesmeyen, p.bilinmeyenDurum], [[], []]);
  assert.equal(p.yazilacak[2].gecis.durum.sonrakiKontrol, '2026-10-24');
});

test('Geçiş planı: eşleşmeyen dize ya da bilinmeyen değer varsa hiçbir şey yazılmaz; ikinci koşu boştur', () => {
  const p = m.gecisPlani([
    { ref: 'a', ezber: { 'Fâtiha': 'ogrendi', 'Bilinmeyen ezber': 'ogrendi' } },
    { ref: 'b', ezber: { 'İhlâs': 'yarim', 'Tebbet': 'ogrendi' } },
  ], {}, B);
  assert.deepEqual([p.yazilacak, p.eslesmeyen, p.bilinmeyenDurum, p.basamaklar], [[], ['Bilinmeyen ezber'], ['İhlâs'], { 1: 0, 2: 0 }]);
  const girdi = [{ ref: 'a', ezber: { 'Fâtiha': 'ogrendi', 'Felak; Nâs': 'tekrar' } }];
  const ilk = m.gecisPlani(girdi, {}, B);
  assert.equal(ilk.yazilacak.length, 3);
  const mevcut = {};
  for (const y of ilk.yazilacak) (mevcut[y.ref] ??= {})[y.id] = y.gecis.durum;
  const ikinci = m.gecisPlani(girdi, mevcut, B);
  assert.deepEqual([ikinci.yazilacak.length, ikinci.atlanan], [0, 3]);
});

/* 27 Eyl 2026 — inceleme F3: geçişten sonra hocanın kaldırdığı madde, betik yeniden çalıştırılınca geri gelmemeli. */
test('Geçiş planı: yeni sistemde geçmişi (olayı) olan ama kaydı olmayan madde yeniden yazılmaz; öbürleri yazılır', () => {
  const girdi = [{ ref: 'a', ezber: { 'Fâtiha': 'ogrendi', 'Felak; Nâs': 'tekrar' } }, { ref: 'b', ezber: { 'Fâtiha': 'ogrendi' } }];
  const p = m.gecisPlani(girdi, { a: { 's-nas': d(2, '2026-10-20') } }, B, { a: ['s-fatiha', 's-nas'], b: new Set(['s-ihlas']) });
  assert.deepEqual(p.yazilacak.map((y) => [y.ref, y.id]), [['a', 's-felak'], ['b', 's-fatiha']]);
  assert.deepEqual([p.atlanan, p.gecmisli, p.basamaklar], [1, 1, { 1: 1, 2: 1 }]);
  assert.equal(m.gecisPlani(girdi, {}, B).gecmisli, 0);
});

test('Olay süzgeci: geçerli olay aynen döner; bozuk, katalog dışı ve eksik alanlı olay düşer', () => {
  const iyi = { ezber: 's-fatiha', tur: 'dinleme', kalite: 'az', notlar: ['med'], basamakOnce: 1, basamakSonra: 2, zorla: false, tarih: B, zaman: { seconds: 1 } };
  const { zaman, ...beklenen } = iyi;
  assert.deepEqual(m.olayOku(iyi), beklenen);
  for (const kotu of [null, [], 'x', { ...iyi, ezber: 'ezber-fatiha' }, { ...iyi, tur: 'sinav' }, { ...iyi, kalite: 'iyi' },
    { ...iyi, notlar: ['A'] }, { ...iyi, basamakOnce: 5 }, { ...iyi, basamakSonra: '2' }, { ...iyi, zorla: 1 }, { ...iyi, tarih: '2026-10-32' }]) {
    assert.equal(m.olayOku(kotu), null, JSON.stringify(kotu));
  }
});

test('Örtüşen maddeler: bütün sûrenin basamağı parçasında gösterilir (türetilir, yazılmaz); tersi yok', () => {
  const parcalilar = m.bolumler().flatMap((b) => b.ogeler).filter((id) => m.kapsayanMaddeler(id).length);
  assert.deepEqual([...new Set(parcalilar)], ['s-alak-1-5']);
  assert.deepEqual(m.kapsayanMaddeler('s-alak-1-5'), ['s-alak']);
  assert.equal(m.gorunenBasamak({ 's-alak': d(3, '2026-11-01') }, 's-alak-1-5'), 3);
  assert.equal(m.gorunenBasamak({ 's-alak-1-5': d(4) }, 's-alak'), 0);
  assert.equal(m.gorunenBasamak({ 's-alak': d(2, '2026-10-24'), 's-alak-1-5': d(4) }, 's-alak-1-5'), 4);
  assert.equal(m.gorunenBasamak({}, 's-fatiha'), 0);
  const kenar = m.bolumler().find((x) => x.anahtar === 'kenar');
  assert.equal(m.bolumOzeti(kenar, { 's-alak': d(2, '2026-10-24') }).sayilar[2], 1);
  assert.deepEqual(m.kontrolSirasi({ 's-alak': d(2, '2026-10-01') }, B), ['s-alak']);
});
