/**
 * Ezber Kilimi kataloğu (27 Eyl 2026, Faz 1a) — bütünlük testleri. Kurallar: docs/EZBER-KILIMI.md.
 * Neden: üç eski kimlik sistemi (plan metinleri, EZBER_LISTESI, seviye testi ez01…) tek katalogda birleşiyor;
 * eşlemede boşluk Faz 1b geçişinde veri kaybı, kaynaksız ses ise «Kur'an sesi yalnız Diyanet» kuralının ihlali olur.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Validator } from '@cfworker/json-schema';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/ezber-katalog-test.mjs');
await build({
  stdin: {
    contents: [
      'export * from "./src/lib/ezber/katalog.ts";',
      'export { EZBER_LISTESI } from "./src/lib/ezber-verisi.ts";',
      'export { EZBER as SEVIYE_EZBER } from "./src/lib/seviye-testi/sorular/ezber.ts";',
    ].join('\n'),
    resolveDir: process.cwd(),
  },
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const m = await import(pathToFileURL(outfile).href);

const json = (yol) => JSON.parse(readFileSync(yol, 'utf8'));
const katalog = json('src/data/ezber/katalog.json');
const sema = json('src/data/ezber/katalog.schema.json');
const planEslesme = json('src/data/ezber/plan-eslesme.json');
const eski = json('src/data/ezber/eski-kimlikler.json');
const plan = json('src/data/yillik-plan-2026-2027.json');
const sesKaynaklari = json('docs/dinleme-ses-kaynaklari.json');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const SEVIYELER = [1, 2, 3, 4, 5, 6, 7, 8, 'kenar'];
const DIYANET = /^https:\/\/(webdosya\.diyanet\.gov\.tr|namaz\.diyanet\.gov\.tr|kuran\.diyanet\.gov\.tr)\//;
const KURAN_SESI = /^https:\/\/(webdosya\.diyanet\.gov\.tr\/kuran\/|kuran\.diyanet\.gov\.tr\/)/;
const kimlikler = new Set(katalog.ogeler.map((o) => o.id));
const planDizeleri = [...new Set(plan.gunler.flatMap((g) => (g.dersler ?? []).flatMap((d) => d.ezber ?? [])))];
const ozet = (yol) => createHash('sha256').update(readFileSync(`public${yol}`)).digest('hex');
const ESKI_TELBIYE = 'Telbiye: Lebbeyk Allahümme lebbeyk…';
const SALAT_I_UMMIYE = 'Salât-ı ümmiye (kısa salavat)';
// Katalogda geçen sûrelerin âyet sayısı, Diyanet mushafı (Kûfe sayımı). 27 Eyl 2026'da Diyanet'in âyet ses dosyalarıyla
// doğrulandı: webdosya.diyanet.gov.tr/…/ar_OsmanSahin/{sûre}_{n}.mp3 var, {sûre}_{n+1}.mp3 yok (41 sûrenin 41'i).
const AYET_SAYISI = {
  1: 7, 2: 286, 14: 52, 20: 135, 78: 40, 79: 46, 80: 42, 81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26,
  89: 30, 90: 20, 91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11, 101: 11, 102: 8, 103: 3,
  104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3, 111: 5, 112: 4, 113: 5, 114: 6,
};
// Sûrenin tamamı olmayan Kur'an maddeleri: [sûre, ilk âyet, son âyet].
const KURAN_PARCALARI = {
  's-ayetel-kursi': [2, 255, 255], 's-alak-1-5': [96, 1, 5],
  'd-rabbena-atina': [2, 201, 201], 'd-rabbenagfirli': [14, 41, 41], 'd-rabbisrahli': [20, 25, 28],
};
const ayetSesleri = (s, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `/media/ses/ayet/${s}-${a + i}.mp3`);

test('katalog şemaya uyar', () => {
  const sonuc = new Validator(sema, '7', false).validate(katalog);
  assert.ok(sonuc.valid, JSON.stringify(sonuc.errors.slice(0, 6), null, 1));
});

test('kimlikler benzersiz; önek türle tutarlı', () => {
  assert.equal(kimlikler.size, katalog.ogeler.length, 'yinelenen kimlik');
  const onek = { s: 'sure', d: 'dua', b: 'bilgi' };
  for (const o of katalog.ogeler) assert.equal(o.tur, onek[o.id[0]], o.id);
});

test('seviyeler: 1–8 + kenar birer kez; her seviyede sıra 1..n kesintisiz', () => {
  assert.deepEqual(katalog.seviyeler.map((s) => s.kimlik), SEVIYELER);
  for (const s of SEVIYELER) {
    const siralar = katalog.ogeler.filter((o) => o.seviye === s).map((o) => o.sira).sort((a, b) => a - b);
    assert.ok(siralar.length > 0, `seviye ${s} boş`);
    assert.deepEqual(siralar, siralar.map((_, i) => i + 1), `seviye ${s} sıraları`);
  }
});

test('kuranMetni: sûre ⇒ Kur\'an + âyet aralığı; bilgi ⇒ Kur\'an değil; aralık düzgün', () => {
  for (const o of katalog.ogeler) {
    if (o.tur === 'sure') assert.ok(o.kuranMetni && o.kuran, `${o.id}: sûre Kur'an bilgisi taşımalı`);
    if (o.tur === 'bilgi') assert.equal(o.kuranMetni, false, o.id);
    if (o.kuran) {
      assert.ok(o.kuranMetni, `${o.id}: kuran alanı varsa kuranMetni true olmalı`);
      assert.ok(o.kuran.ayetler[0] <= o.kuran.ayetler[1], `${o.id}: âyet aralığı`);
    }
  }
});

test('ses: dosya var, kaynak kaydı ve sha256 tutuyor; kaynak Diyanet; Kur\'an sesi Kur\'an sunucusundan', () => {
  for (const o of katalog.ogeler) {
    const yollar = [o.ses?.tam, ...(o.ses?.parcalar ?? [])].filter(Boolean);
    for (const yol of yollar) {
      assert.ok(existsSync(`public${yol}`), `${o.id}: dosya yok ${yol}`);
      const kayit = sesKaynaklari[yol];
      assert.ok(kayit, `${o.id}: kaynak kaydı yok ${yol}`);
      assert.equal(ozet(yol), kayit.sha256, `${o.id}: sha256 ${yol}`);
      const kaynaklar = String(kayit.kaynak).split(' + ');
      assert.ok(kaynaklar.every((k) => DIYANET.test(k)), `${o.id}: Diyanet dışı kaynak ${yol}`);
      if (o.tur === 'sure') assert.ok(kaynaklar.every((k) => KURAN_SESI.test(k)), `${o.id}: sûre sesi Kur'an sunucusundan değil`);
    }
  }
});

test('plan eşlemesi: plandaki her ezber dizesi eşli, fazlalık yok, kimlikler katalogda', () => {
  const eksik = planDizeleri.filter((d) => !Object.hasOwn(planEslesme, d));
  const fazla = Object.keys(planEslesme).filter((k) => !planDizeleri.includes(k));
  assert.deepEqual(eksik, [], 'planda yeni ezber dizesi: plan-eslesme.json\'a ekleyin');
  assert.deepEqual(fazla, [], 'plandan kalkan dize: silmeyin, eski-kimlikler.json → eskiPlan\'a taşıyın (docs/EZBER-KILIMI.md)');
  for (const [dize, idler] of Object.entries(planEslesme)) {
    assert.ok(Array.isArray(idler) && idler.length > 0, `boş eşleme: ${dize}`);
    for (const id of idler) assert.ok(kimlikler.has(id), `katalogda yok: ${id} ← ${dize}`);
  }
});

test('eski kimlikler: 19 EZBER_LISTESI + 14 seviye testi + planın eski yazımları + kurallardaki ezber-* kimlikleri', () => {
  assert.deepEqual(Object.keys(eski).sort(), ['eskiPlan', 'ezberListesi', 'seviyeTesti']);
  assert.deepEqual(Object.keys(eski.ezberListesi).sort(), m.EZBER_LISTESI.map((e) => e.id).sort());
  assert.deepEqual(Object.keys(eski.seviyeTesti).sort(), m.SEVIYE_EZBER.map((e) => e.id).sort());
  // Planın git geçmişinde (9adc308…43cd854) olup bugün olmayan iki dize; hoca ekranı ilerleme.ezber'i dizeyle anahtarlar.
  assert.deepEqual(Object.keys(eski.eskiPlan).sort(), [SALAT_I_UMMIYE, ESKI_TELBIYE]);
  for (const k of Object.keys(eski.eskiPlan)) assert.ok(!Object.hasOwn(planEslesme, k), `bugünkü planda da var: ${k}`);
  for (const [ad, tablo] of Object.entries(eski))
    for (const [k, idler] of Object.entries(tablo)) {
      // Boş dizi yalnız bilerek karşılıksız bırakılan eski plan dizesinde: taşınmaz, eski alanda salt okunur kalır.
      if (!(ad === 'eskiPlan' && k === SALAT_I_UMMIYE)) assert.ok(idler.length > 0, `boş: ${k}`);
      for (const id of idler) assert.ok(kimlikler.has(id), `katalogda yok: ${id} ← ${k}`);
    }
  assert.deepEqual(eski.eskiPlan[ESKI_TELBIYE], ['d-telbiye']);
  const kurallar = readFileSync('firebase/firestore.rules', 'utf8');
  for (const [, k] of kurallar.matchAll(/'ezber-([a-z-]+)'/g)) assert.ok(eski.ezberListesi[k], `kuraldaki ezber-${k} eşlenmemiş`);
});

test('eskiEzberGecisi: ilerleme.ezber → katalog; aynı maddede en ileri durum; eşleşmeyen ve bilinmeyen ayrı listede', () => {
  const tevhid = Object.keys(planEslesme).find((k) => k.startsWith('Kelime-i Tevhid: '));
  const ikisi = 'Kelime-i Tevhid ve Kelime-i Şehâdet';
  const girdi = {
    [ikisi]: 'ogrendi', [tevhid]: 'tekrar', // aynı maddeye iki dize: en ileri durum kalır
    'Allâhümme Salli; Allâhümme Bârik': 'tekrar', // bir dize iki madde
    [ESKI_TELBIYE]: 'baslamadi', // planın eski yazımı
    [SALAT_I_UMMIYE]: 'ogrendi', // bilerek karşılıksız
    constructor: 'ogrendi', 'Uydurma dize': 'tekrar', // eşleşmeyen: kuru çalıştırma durur
    'Fâtiha': 'harika', // bilinmeyen durum: kuru çalıştırma durur
    'Sübhâneke': '', // boş değer kayıt sayılmaz
  };
  const s = m.eskiEzberGecisi(girdi);
  assert.deepEqual(s.durumlar, {
    'd-kelime-i-tevhid': 'ogrendi', 'd-kelime-i-sehadet': 'ogrendi',
    'd-salli': 'tekrar', 'd-barik': 'tekrar', 'd-telbiye': 'baslamadi',
  });
  assert.deepEqual(s.eslesmeyen, ['Uydurma dize', 'constructor']);
  assert.deepEqual(s.karsiliksiz, [SALAT_I_UMMIYE]);
  assert.deepEqual(s.bilinmeyenDurum, ['Fâtiha']);
  const ters = m.eskiEzberGecisi(Object.fromEntries(Object.entries(girdi).reverse()));
  assert.deepEqual(ters, s, 'girdi sırası sonucu değiştirmemeli');
  assert.deepEqual(m.eskiEzberGecisi({ [tevhid]: 'tekrar', [ikisi]: 'baslamadi' }).durumlar['d-kelime-i-tevhid'], 'tekrar');
  assert.deepEqual(m.ESKI_DURUM_SIRASI, ['baslamadi', 'tekrar', 'ogrendi']);
});

test('adlar: beş dil dolu; eski 19 maddenin adları eski katalogla aynı', () => {
  for (const o of katalog.ogeler) for (const d of DILLER) assert.ok(o.ad[d]?.trim(), `${o.id}.${d}`);
  for (const e of m.EZBER_LISTESI) {
    const yeni = eski.ezberListesi[e.id];
    if (yeni.length === 1) assert.deepEqual(m.ezberBul(yeni[0]).ad, e.ad, `${e.id} adı`);
  }
});

test('katalog.ts: ezberBul, seviyeOgeleri, planKimlikleri, eskiKimliktenYeni', () => {
  assert.equal(m.KATALOG.ogeler.length, katalog.ogeler.length);
  assert.deepEqual(m.SEVIYE_SIRASI, SEVIYELER);
  assert.equal(m.ezberBul('s-fatiha').kuran.sure, 1);
  assert.equal(m.ezberBul('yok-boyle-bir-sey'), undefined);
  const s1 = m.seviyeOgeleri(1);
  assert.deepEqual(s1.map((o) => o.sira), s1.map((_, i) => i + 1));
  assert.deepEqual(m.planKimlikleri('Fâtiha'), ['s-fatiha']);
  assert.deepEqual(m.planKimlikleri('planda olmayan dize'), []);
  assert.deepEqual(m.planKimlikleri('constructor'), []);
  assert.deepEqual(m.eskiKimliktenYeni('ezberListesi', 'fatiha'), ['s-fatiha']);
  assert.deepEqual(m.eskiKimliktenYeni('seviyeTesti', 'ez04'), ['s-fatiha']);
  assert.deepEqual(m.eskiKimliktenYeni('seviyeTesti', 'ez99'), []);
});

test('sinifHedefleri: çoklu dize her maddeye aynı tarih; aynı madde için en erken tarih', () => {
  const h = m.sinifHedefleri(plan);
  assert.equal(h['s-fatiha'], '2027-03-27');
  for (const id of ['s-kevser', 's-asr', 's-nasr']) assert.equal(h[id], '2027-04-25', id);
  assert.equal(h['d-kelime-i-tevhid'], '2026-11-07'); // 7 Kasım 2026 ve 27 Mart 2027'de iki ayrı yazım
  assert.equal(h['d-kadir-gecesi-duasi'], '2026-12-12'); // 12 Aralık 2026 ve 1 Mart 2027'de iki ayrı metin
  const yapay = { gunler: [{ tarih: '2027-01-02', dersler: [{ ezber: ['Fâtiha'] }] }, { tarih: '2026-12-01', dersler: [{ ezber: ['Fâtiha'] }] }] };
  assert.deepEqual(m.sinifHedefleri(yapay), { 's-fatiha': '2026-12-01' });
});

test('Kur\'an aralıkları Kûfe sayımına uyar; tam sûre eksiksiz; âyet parçaları aralıkla ve tam kaydın parçalarıyla aynı', () => {
  for (const o of katalog.ogeler.filter((x) => x.kuran)) {
    const { sure, ayetler: [a, b] } = o.kuran;
    assert.ok(AYET_SAYISI[sure], `${o.id}: sûre ${sure} âyet sayısı tablosunda yok`);
    assert.ok(a >= 1 && b <= AYET_SAYISI[sure], `${o.id}: ${sure}:${a}–${b} sûrenin dışında`);
    if (KURAN_PARCALARI[o.id]) assert.deepEqual([sure, a, b], KURAN_PARCALARI[o.id], o.id);
    else assert.deepEqual([o.tur, a, b], ['sure', 1, AYET_SAYISI[sure]], `${o.id}: sûrenin tamamı olmalı`);
    if (o.ses?.parcalar) assert.deepEqual(o.ses.parcalar, ayetSesleri(sure, a, b), `${o.id}: âyet parçaları`);
    const tam = o.ses?.tam && sesKaynaklari[o.ses.tam];
    if (tam?.parcalar) {
      // Birleşik kayıt eûzü (1-0) + besmele (1-1) ile başlar; Fâtiha'da besmele zaten 1. âyettir.
      const bas = sure === 1 ? ['/media/ses/ayet/1-0.mp3'] : ['/media/ses/ayet/1-0.mp3', '/media/ses/ayet/1-1.mp3'];
      assert.deepEqual(tam.parcalar, [...bas, ...ayetSesleri(sure, a, b)], `${o.id}: tam kaydın parçaları`);
    }
  }
  for (const id of Object.keys(KURAN_PARCALARI)) assert.equal(m.ezberBul(id)?.kuranMetni, true, id);
});

test('inceleme odağı: eûzü-besmele Kur\'an metni ve Diyanet sesi; kaynaksız eski sesler katalogda yok; çoklu plan dizeleri', () => {
  const eb = m.ezberBul('d-euzu-besmele');
  assert.equal(eb.kuranMetni, true);
  assert.deepEqual(eb.ses, { parcalar: ['/media/ses/ayet/1-0.mp3', '/media/ses/ayet/1-1.mp3'] }); // 1-0 eûzü, 1-1 besmele
  const yollar = katalog.ogeler.flatMap((o) => [o.ses?.tam, ...(o.ses?.parcalar ?? [])]).filter(Boolean);
  // Eski Ezber Odası dosyaları katalog maddesine bağlanmaz: rabbena.mp3 kaynaksız (Diyanet özgünüyle aynı değil),
  // sallibarik.mp3 iki Diyanet kaydının birleşimi (katalogda Salli ve Bârik ayrı maddeler).
  for (const yasak of ['/media/ses/dualar/rabbena.mp3', '/media/ses/dualar/sallibarik.mp3']) assert.ok(!yollar.includes(yasak), yasak);
  assert.equal(sesKaynaklari['/media/ses/dualar/rabbena.mp3'], undefined, 'rabbena.mp3 artık kayıtlıysa bu testi gözden geçirin');
  assert.equal(sesKaynaklari['/media/ses/dualar/sallibarik.mp3'].kaynak.split(' + ').length, 2);
  assert.deepEqual(m.planKimlikleri('Allâhümme Salli; Allâhümme Bârik'), ['d-salli', 'd-barik']);
  assert.deepEqual(m.planKimlikleri('Kelime-i Tevhid ve Kelime-i Şehâdet'), ['d-kelime-i-tevhid', 'd-kelime-i-sehadet']);
  assert.deepEqual(m.eskiKimliktenYeni('seviyeTesti', 'ez02'), ['d-kelime-i-sehadet']);
  assert.deepEqual(m.eskiKimliktenYeni('ezberListesi', 'rabbena'), ['d-rabbena-atina', 'd-rabbenagfirli']);
});

test('eski Ezber Odası Fâtiha metni Diyanet (Kûfe) sayımında: besmele 1. âyet, «…المستقيم» 6, «صراط…الضالين» 7', () => {
  const ar = m.EZBER_LISTESI.find((e) => e.id === 'fatiha').arapca;
  // Portal (veli-portali.ts, arapcaMetinGoster) baştaki «besmele ﴿١﴾»i siler; besmele üstteki serlevhada görünür.
  assert.ok(ar.startsWith('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ '), 'besmele ﴿١﴾ ile başlamalı');
  const rakamlar = [...ar.matchAll(/﴿([٠-٩]+)﴾/g)].map((x) => x[1]);
  assert.deepEqual(rakamlar, ['١', '٢', '٣', '٤', '٥', '٦', '٧']);
  const harekesiz = ar.normalize('NFD').replace(/[\u064B-\u065F\u0670]/g, '');
  assert.match(harekesiz, /المستقيم ﴿٦﴾ صراط/);
  assert.match(harekesiz, /عليهم غير المغضوب عليهم ولا الضالين ﴿٧﴾$/);
});

test('katalog salt okunur: paylaşılan veri dışarıdan değiştirilemez', () => {
  assert.ok(Object.isFrozen(m.KATALOG) && Object.isFrozen(m.KATALOG.ogeler) && Object.isFrozen(m.SEVIYE_SIRASI));
  const o = m.ezberBul('s-fatiha');
  assert.ok([o, o.ad, o.kuran, o.kuran.ayetler, o.ses, o.ses.parcalar].every(Object.isFrozen));
  assert.throws(() => { o.ad.tr = 'x'; }, TypeError);
  assert.throws(() => m.planKimlikleri('Fâtiha').push('s-nas'), TypeError);
  assert.throws(() => m.eskiKimliktenYeni('ezberListesi', 'fatiha').push('s-nas'), TypeError);
  assert.throws(() => m.ESKI_DURUM_SIRASI.push('x'), TypeError);
  assert.deepEqual(m.planKimlikleri('Fâtiha'), ['s-fatiha']);
  const s1 = m.seviyeOgeleri(1);
  s1.reverse();
  assert.equal(m.seviyeOgeleri(1)[0].sira, 1, 'seviyeOgeleri kopya döndürmeli');
});

test('ezber:tablo: --dil yalnız beş site dilini kabul eder; bilinmeyen seçenekte çıkış kodu 1', () => {
  const kos = (...a) => spawnSync(process.execPath, ['scripts/ezber-seviye-tablosu.mjs', ...a], { encoding: 'utf8' });
  const fr = kos('--dil', 'fr');
  assert.equal(fr.status, 0, fr.stderr);
  assert.match(fr.stdout, /\| Sourate Al-Fatiha \|/);
  for (const hatali of [['--dil', 'xx'], ['--dil'], ['--dill', 'fr']]) {
    const r = kos(...hatali);
    assert.equal(r.status, 1, hatali.join(' '));
    assert.match(r.stderr, /tr, fr, en, nl, de/, hatali.join(' '));
  }
});
