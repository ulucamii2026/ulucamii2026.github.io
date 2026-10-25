/**
 * Ders günü ezber takvimi (25 Ekim 2026): türev veri (src/data/ezber/ders-takvimi-2026-2027.json), üretici betik
 * (scripts/ezber-ders-takvimi.mjs), saf kütüphane (src/lib/ezber/ders-takvimi.ts) ve beş dilli metinler (egitim/src/i18n/takvim.ts).
 * Neden: veli «Derste bu hafta» bandına güvenip çocuğunu çalıştırır; yanlış hafta sonu, katalogda olmayan bir kimlik, ders günü olmayan bir tarih
 * ya da öğreticiye ait bir alanın (not, bireysel dinleme listesi, ad) sızması sessizce yanlış bilgi verir. Burada sabitlenenler:
 *  - türev dosyanın şeması, kimliklerin katalogda ve tarihlerin yıllık plandaki ders günlerinde olması, öğreticiye ait alan ve ad bulunmaması;
 *  - «diğer derslerin ezberi»nin yıllık plandan eksiksiz gelmesi, ezber köşesi listelerindeki kimliği yinelememesi, Kur'an dersini saymaması;
 *  - hafta sonu gruplaması (Cumartesi–Pazar–tatil Pazartesisi, boşluk ≤ 2 gün) ve seçim: Cumartesi sabahı, Pazar, Pazartesi, hafta içi, tatil,
 *    ilk günden önce, son günden sonra; Brüksel günü (yaz saati bitişi dâhil);
 *  - bir ezberin sonraki ders günü, madde eki, yoğun kodlama gidiş dönüşü;
 *  - üretici: öğreticiye ait alanlar kopyalanmaz, hatalı kaynak reddedilir, --denetle güncel/eski/kaynaksız davranışı;
 *  - beş dilde metin eşitliği, yer tutucular, Fransızca tipografi, yasak simge yok, «hoca» yalnız Türkçede.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/ezber-ders-takvimi-test.mjs');
await build({
  stdin: {
    contents: [
      'export * from "./src/lib/ezber/ders-takvimi.ts";',
      'export { DERS_TAKVIMI } from "./src/lib/ezber/ders-takvimi-veri.ts";',
      'export { DERS_GUNLERI, HAFTA_SONLARI, SAYFALI, takvimAdlari } from "./egitim/src/lib/ders-takvimi.ts";',
      'export { takvimMetinleri } from "./egitim/src/i18n/takvim.ts";',
      'export { KATALOG, calismaSayfasiVar, planKimlikleri } from "./src/lib/ezber/katalog.ts";',
    ].join('\n'),
    resolveDir: process.cwd(),
  },
  alias: { '@ortak': './src' },
  outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
});
const k = await import(pathToFileURL(cikti).href);
const uretici = await import(pathToFileURL(resolve('scripts/ezber-ders-takvimi.mjs')).href);

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const YEREL = { tr: 'tr-TR', fr: 'fr-BE', en: 'en-GB', nl: 'nl-BE', de: 'de-BE' };
const dosya = JSON.parse(readFileSync('src/data/ezber/ders-takvimi-2026-2027.json', 'utf8'));
const dosyaMetni = readFileSync('src/data/ezber/ders-takvimi-2026-2027.json', 'utf8');
const plan = JSON.parse(readFileSync('src/data/yillik-plan-2026-2027.json', 'utf8'));
const katalogKimlikleri = new Set(k.KATALOG.ogeler.map((o) => o.id));
const KAYNAK_YOLU = process.env.EZBER_KOSESI_KAYNAK || uretici.VARSAYILAN_KAYNAK;
const kaynakVar = existsSync(KAYNAK_YOLU);

// ——— Türev dosya ———
test('türev dosya: üst alanlar, kaynak adı kişisel yol değil, özet 64 hane, 77 ders günü (10 Ekim 2026 → 6 Haziran 2027)', () => {
  assert.deepEqual(Object.keys(dosya), ['kaynak', 'kaynakSha256', 'uretim', 'gunler']);
  assert.equal(dosya.kaynak, 'ulu-camii-kuran-kursu/veri/ezber-kosesi-2026-2027.json');
  assert.doesNotMatch(dosya.kaynak, /^[a-z]:|\\|users|ridva/i);
  assert.match(dosya.kaynakSha256, /^[0-9a-f]{64}$/);
  assert.match(dosya.uretim, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(dosya.gunler.length, 77); // kaynak değişince bilerek güncellenir (kurs planı: 77 ders günü)
  assert.equal(dosya.gunler[0].tarih, '2026-10-10');
  assert.equal(dosya.gunler.at(-1).tarih, '2027-06-06');
});

test('türev dosya: her gün tarih, gün adı, kip + yalnız beyaz listedeki boş olmayan listeler; maddeler {id, ayet?, bolum?}', () => {
  const IZINLI = ['tarih', 'gun', 'kip', 'yeni', 'pekistir', 'dinleme', 'plan', 'kalici'];
  let onceki = '';
  for (const g of dosya.gunler) {
    assert.deepEqual(Object.keys(g), IZINLI.filter((a) => a in g), `${g.tarih}: alan sırası`);
    for (const a of Object.keys(g)) assert.ok(IZINLI.includes(a), `${g.tarih}: izinsiz alan ${a}`);
    assert.ok(k.tarihMi(g.tarih), g.tarih);
    assert.ok(g.tarih > onceki, `${g.tarih}: artan sıra`);
    onceki = g.tarih;
    assert.equal(g.gun, uretici.gunAdi(g.tarih), `${g.tarih}: gün adı`);
    assert.ok(k.DERS_KIPLERI.includes(g.kip), `${g.tarih}: kip ${g.kip}`);
    for (const a of ['yeni', 'pekistir', 'dinleme']) {
      if (!(a in g)) continue;
      assert.ok(Array.isArray(g[a]) && g[a].length > 0, `${g.tarih}.${a}: boş liste yazılmaz`);
      for (const x of g[a]) {
        assert.deepEqual(Object.keys(x), ['id', 'ayet', 'bolum'].filter((y) => y in x), `${g.tarih}.${a}.${x.id}`);
        assert.equal(typeof x.id, 'string');
        if (x.ayet) assert.ok(x.ayet.length === 2 && x.ayet.every(Number.isInteger) && x.ayet[0] >= 1 && x.ayet[0] <= x.ayet[1], `${g.tarih} ${x.id} ayet`);
        if (x.bolum !== undefined) assert.ok(Number.isInteger(x.bolum) && x.bolum >= 1, `${g.tarih} ${x.id} bölüm`);
      }
    }
    for (const a of ['plan', 'kalici']) {
      if (!(a in g)) continue;
      assert.ok(Array.isArray(g[a]) && g[a].length > 0 && g[a].every((x) => typeof x === 'string'), `${g.tarih}.${a}`);
    }
  }
});

test('türev dosya: her kimlik katalogda; çalışma sayfası olmayan kimlik varsa düz metin olarak çizilir (kural)', () => {
  for (const g of dosya.gunler) {
    for (const a of ['yeni', 'pekistir', 'dinleme']) for (const x of g[a] ?? []) assert.ok(katalogKimlikleri.has(x.id), `${g.tarih}.${a}: ${x.id}`);
    for (const a of ['plan', 'kalici']) for (const id of g[a] ?? []) assert.ok(katalogKimlikleri.has(id), `${g.tarih}.${a}: ${id}`);
  }
  // Birleşik liste (diğer derslerin ezberi dâhil): her kimliğin sayfa dilindeki adı var.
  for (const dil of DILLER) {
    const adlar = k.takvimAdlari(dil);
    for (const g of k.DERS_GUNLERI) for (const l of Object.values(g.gruplar)) for (const x of l) assert.ok(adlar[x.id], `${dil}: ${x.id} adı`);
  }
});

test('türev dosya: her tarih yıllık planda ders olan bir gün (tatil/bayram-yalnız günler değil)', () => {
  const dersGunleri = new Set(plan.gunler.filter((g) => (g.dersler ?? []).length > 0).map((g) => g.tarih));
  for (const g of dosya.gunler) assert.ok(dersGunleri.has(g.tarih), `${g.tarih} yıllık planda ders günü değil`);
  // Ters yön: 10 Ekim'den sonra planda ders olan her gün takvimde (Kurban Bayramı 16 Mayıs'ta dersi yok).
  const takvimde = new Set(dosya.gunler.map((g) => g.tarih));
  for (const t of dersGunleri) if (t >= '2026-10-10') assert.ok(takvimde.has(t), `${t}: planda ders var, takvimde yok`);
});

test('türev dosya: öğreticiye ait alan ve ad yok (not, plan_konusu, bireysel, karar, ayarlar…); metin kişisel veri taşımaz', () => {
  const yasakAlan = /"(not|plan_konusu|bireysel|karar|ayarlar|maddeler|katalog|kose_disi|sira_istisnalari)"\s*:/;
  assert.doesNotMatch(dosyaMetni, yasakAlan);
  assert.doesNotMatch(dosyaMetni, /Rıdvan|KAYAHAN|Yeliz|Mehmet|hoca|öğretici|imam/i);
  assert.doesNotMatch(dosyaMetni, /[A-Za-z]:[\\/]|@|\+\d{6,}|https?:/);
  // Kaynakta olan ama türeve alınmaması gerekenler gerçekten alınmamış: bireysel dinleme listesi 10 Ekim'de var, türevde yok.
  assert.equal(dosya.gunler[0].bireysel, undefined);
});

test('türev dosya: kaynak yerelde varsa güncel (kaynak özeti ve içerik; uretim hariç) — kaynak yoksa atlanır', { skip: !kaynakVar && 'kaynak bu makinede yok (CI)' }, () => {
  const metin = readFileSync(KAYNAK_YOLU, 'utf8');
  assert.equal(dosya.kaynakSha256, createHash('sha256').update(metin).digest('hex'));
  const yeni = uretici.takvimUret(metin, { katalogKimlikleri, uretim: dosya.uretim });
  assert.equal(uretici.takvimMetni(yeni), dosyaMetni);
});

// ——— Üretici ———
const TOHUM = {
  surum: 1, karar: { kim: 'Birisi' }, ayarlar: { x: 1 }, katalog: {}, kose_disi: {}, maddeler: {},
  gunler: [
    { tarih: '2026-10-10', gun: 'Cumartesi', kip: 'tam-ders', plan_konusu: 'Konu', yeni: [{ id: 's-fatiha', ayet: [1, 4] }], dinleme: [], bireysel: ['s-fatiha'], not: 'Gizli not' },
    { tarih: '2026-10-11', gun: 'Pazar', kip: 'kose', pekistir: [{ id: 's-fatiha', bolum: 2 }], plan: [], kalici: ['s-ihlas'], yeniAlan: 1 },
  ],
};
const uret = (obje, secenek = {}) => uretici.takvimUret(JSON.stringify(obje), { katalogKimlikleri, uretim: '2026-10-25', ...secenek });

test('üretici: öğreticiye ait alanlar kopyalanmaz, boş liste yazılmaz, bilinmeyen alan uyarı verir ve alınmaz', () => {
  const uyarilar = [];
  const t = uret(TOHUM, { uyar: (m) => uyarilar.push(m) });
  assert.deepEqual(t.gunler, [
    { tarih: '2026-10-10', gun: 'Cumartesi', kip: 'tam-ders', yeni: [{ id: 's-fatiha', ayet: [1, 4] }] },
    { tarih: '2026-10-11', gun: 'Pazar', kip: 'kose', pekistir: [{ id: 's-fatiha', bolum: 2 }], kalici: ['s-ihlas'] },
  ]);
  assert.equal(uyarilar.length, 1);
  assert.match(uyarilar[0], /yeniAlan/);
  assert.doesNotMatch(JSON.stringify(t), /Gizli not|Konu|Birisi|bireysel/);
  assert.equal(t.kaynakSha256, createHash('sha256').update(JSON.stringify(TOHUM)).digest('hex'));
});

test('üretici: hatalı kaynak reddedilir (gün adı, kip, sıra, tekrar tarih, ayet, bölüm, katalogda olmayan kimlik, boş gün listesi)', () => {
  const degis = (f) => { const c = structuredClone(TOHUM); f(c); return c; };
  assert.throws(() => uret(degis((c) => { c.gunler[0].gun = 'Pazar'; })), /günün adı değil/);
  assert.throws(() => uret(degis((c) => { c.gunler[0].kip = 'bilinmeyen'; })), /bilinmeyen kip/);
  assert.throws(() => uret(degis((c) => { c.gunler[1].tarih = '2026-10-10'; c.gunler[1].gun = 'Cumartesi'; })), /artan ve tekil/);
  assert.throws(() => uret(degis((c) => { c.gunler[0].tarih = '2026-02-30'; })), /geçersiz|günün adı|YYYY/);
  assert.throws(() => uret(degis((c) => { c.gunler[0].yeni[0].ayet = [4, 1]; })), /ayet/);
  assert.throws(() => uret(degis((c) => { c.gunler[0].yeni[0].ayet = [1]; })), /ayet/);
  assert.throws(() => uret(degis((c) => { c.gunler[1].pekistir[0].bolum = 0; })), /bolum/);
  assert.throws(() => uret(degis((c) => { c.gunler[1].kalici = ['yok-boyle-madde']; })), /kataloğda yok/);
  assert.throws(() => uret(degis((c) => { c.gunler[0].yeni = [{ ayet: [1, 2] }]; })), /\{id\}/);
  assert.throws(() => uret({ gunler: [] }), /gunler\[\] yok/);
  assert.throws(() => uretici.takvimUret('{bozuk', {}), SyntaxError);
});

test('üretici: dosya metni her gün tek satır, sonda yeni satır; JSON olarak aynı nesneyi verir; Brüksel günü yaz saati bitişinde doğru', () => {
  const t = uret(TOHUM);
  const metin = uretici.takvimMetni(t);
  assert.ok(metin.endsWith('}\n'));
  assert.deepEqual(JSON.parse(metin), t);
  assert.equal(metin.split('\n').filter((s) => s.startsWith('    {')).length, t.gunler.length);
  assert.equal(uretici.brukselBugun(new Date('2026-10-24T22:30:00Z')), '2026-10-25'); // CEST 00.30
  assert.equal(uretici.brukselBugun(new Date('2026-10-25T23:30:00Z')), '2026-10-26'); // CET 00.30 (yaz saati bitti)
});

test('üretici CLI: yaz → --denetle geçer; kaynak değişirse --denetle düşer; kaynak yoksa --denetle atlar (çıkış 0); yazarken kaynak yoksa 2', () => {
  const dizin = mkdtempSync(join(tmpdir(), 'ders-takvimi-'));
  try {
    const kaynak = join(dizin, 'kaynak.json');
    const hedef = join(dizin, 'hedef.json');
    writeFileSync(kaynak, JSON.stringify(TOHUM));
    const calistir = (...a) => spawnSync(process.execPath, ['scripts/ezber-ders-takvimi.mjs', ...a], { encoding: 'utf8' });
    let r = calistir('--kaynak', kaynak, '--hedef', hedef);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Yazıldı/);
    assert.ok(existsSync(hedef));
    const ilk = readFileSync(hedef, 'utf8');
    r = calistir('--kaynak', kaynak, '--hedef', hedef, '--denetle');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /güncel/);
    // İçerik aynıysa dosyaya dokunulmaz (uretim tarihi boşuna değişmez).
    writeFileSync(hedef, ilk.replace(/"uretim": "[^"]+"/, '"uretim": "2020-01-01"'));
    r = calistir('--kaynak', kaynak, '--hedef', hedef);
    assert.match(r.stdout, /dokunulmadı/);
    assert.match(readFileSync(hedef, 'utf8'), /"uretim": "2020-01-01"/);
    // Kaynak değişti (yeni gün eklendi): denetim düşer, yeniden üretince geçer.
    const degisik = structuredClone(TOHUM);
    degisik.gunler.push({ tarih: '2026-10-17', gun: 'Cumartesi', kip: 'kose', yeni: [{ id: 's-ihlas' }] });
    writeFileSync(kaynak, JSON.stringify(degisik));
    r = calistir('--kaynak', kaynak, '--hedef', hedef, '--denetle');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /kaynakla aynı değil/);
    r = calistir('--kaynak', kaynak, '--hedef', hedef);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(calistir('--kaynak', kaynak, '--hedef', hedef, '--denetle').status, 0);
    // Yalnız öğretici alanı değişse bile özet değişir → eski sayılır (özet güncellensin diye bilerek).
    degisik.gunler[0].not = 'yeni gizli not';
    writeFileSync(kaynak, JSON.stringify(degisik));
    assert.equal(calistir('--kaynak', kaynak, '--hedef', hedef, '--denetle').status, 1);
    // Kaynak yok: --denetle atlar, yazma 2 ile durur.
    const yok = join(dizin, 'yok.json');
    r = calistir('--kaynak', yok, '--hedef', hedef, '--denetle');
    assert.equal(r.status, 0);
    assert.match(r.stdout, /atlandı/);
    r = calistir('--kaynak', yok, '--hedef', hedef);
    assert.equal(r.status, 2);
  } finally {
    rmSync(dizin, { recursive: true, force: true });
  }
});

// ——— Birleştirme: diğer derslerin ezberi ———
const PLAN_ORNEK = {
  gunler: [
    { tarih: '2026-10-24', dersler: [{ kod: 'kuran', ezber: ['Kur’an dersinin dizesi'] }, { kod: 'itikat', ezber: ['A', 'B'] }, { kod: 'ibadet', ezber: ['A'] }] },
    { tarih: '2026-10-25', dersler: [{ kod: 'siyer', ezber: ['B', 'C'] }] },
    { tarih: '2026-10-26', dersler: [{ kod: 'ahlak', ezber: [] }, { kod: 'kuran' }] },
    { tarih: '2026-10-27' },
  ],
};
const ESLE = { A: ['d-tekbir'], B: ['s-ihlas', 'd-subhaneke'], C: ['s-kevser'], 'Kur’an dersinin dizesi': ['s-fatiha'] };

test('digerDersEzberi: yalnız Kur’an dışı dersler, sıra planınki, yineleme yok, boş günler yok', () => {
  const d = k.digerDersEzberi(PLAN_ORNEK, (m) => ESLE[m] ?? []);
  assert.deepEqual(d, { '2026-10-24': ['d-tekbir', 's-ihlas', 'd-subhaneke'], '2026-10-25': ['s-ihlas', 'd-subhaneke', 's-kevser'] });
});

test('dersGunleri: diğer grup, ezber köşesi listelerinde (yeni, pekiştirme, dinleme, plan, kalıcı) geçen kimliği yinelemez; grup sırası sabit', () => {
  const veri = {
    kaynak: '', kaynakSha256: '', uretim: '', gunler: [
      { tarih: '2026-10-24', gun: 'Cumartesi', kip: 'kose', yeni: [{ id: 'd-tekbir' }], pekistir: [{ id: 's-fatiha', ayet: [1, 4] }], kalici: ['d-subhaneke'], plan: ['s-kevser'] },
      { tarih: '2026-10-25', gun: 'Pazar', kip: 'tekrar' },
    ],
  };
  const diger = { '2026-10-24': ['d-tekbir', 's-ihlas', 'd-subhaneke', 's-kevser', 's-nas'], '2026-10-25': ['d-tekbir'] };
  const g = k.dersGunleri(veri, diger);
  assert.deepEqual(Object.keys(g[0].gruplar), ['yeni', 'pekistir', 'kalici', 'plan', 'diger']);
  assert.deepEqual(g[0].gruplar.diger.map((x) => x.id), ['s-ihlas', 's-nas']);
  assert.deepEqual(g[0].gruplar.kalici, [{ id: 'd-subhaneke' }]);
  assert.deepEqual(g[1].gruplar, { diger: [{ id: 'd-tekbir' }] });
  assert.deepEqual(k.dersGunleri(veri)[1].gruplar, {});
  assert.deepEqual(k.GRUP_SIRASI, ['yeni', 'pekistir', 'dinleme', 'kalici', 'plan', 'diger']);
});

test('gerçek veri: planın Kur’an dışı derslerindeki her ezber o günün ekranında var; Kur’an dersinin plan ezberi köşe «plan» listesiyle uyuşuyor', () => {
  const gunler = new Map(k.DERS_GUNLERI.map((g) => [g.tarih, g]));
  let sayi = 0;
  for (const pg of plan.gunler) {
    if (pg.tarih < '2026-10-10') continue;
    for (const ders of pg.dersler ?? []) {
      const idler = (ders.ezber ?? []).flatMap((m) => k.planKimlikleri(m));
      if (!idler.length) continue;
      const g = gunler.get(pg.tarih);
      assert.ok(g, `${pg.tarih}: takvimde yok`);
      const hepsi = new Set(Object.values(g.gruplar).flatMap((l) => l.map((x) => x.id)));
      for (const id of idler) {
        assert.ok(hepsi.has(id), `${pg.tarih} (${ders.kod}): ${id} ekranda yok`);
        sayi++;
      }
      if (ders.kod === 'kuran') for (const id of idler) assert.ok((g.gruplar.plan ?? []).some((x) => x.id === id), `${pg.tarih}: Kur’an dersinin plan ezberi ${id} köşe planında yok`);
    }
  }
  assert.ok(sayi > 30, `beklenenden az plan ezberi (${sayi})`);
  // Örnek: 7 Kasım'da İtikat dersi Kelime-i Tevhid ve Şehâdet'i ezberletir; köşede Kevser var.
  const g7 = gunler.get('2026-11-07');
  assert.deepEqual(g7.gruplar.diger.map((x) => x.id), ['d-kelime-i-tevhid', 'd-kelime-i-sehadet']);
  assert.deepEqual(g7.gruplar.yeni.map((x) => x.id), ['s-kevser']);
});

// ——— Hafta sonları ———
test('haftaSonlari: Cumartesi–Pazar–tatil Pazartesisi bir hafta sonu; boşluk ≤ 2 gün; 35 hafta sonu', () => {
  const h = k.HAFTA_SONLARI;
  assert.equal(h.length, 35);
  assert.deepEqual(h.slice(0, 4).map((x) => [x.ilk, x.son, x.gunler.length]), [
    ['2026-10-10', '2026-10-11', 2], ['2026-10-17', '2026-10-19', 3], ['2026-10-24', '2026-10-26', 3], ['2026-10-31', '2026-11-01', 2],
  ]);
  for (const x of h) {
    for (let i = 1; i < x.gunler.length; i++) assert.ok(k.gunFarki(x.gunler[i - 1].tarih, x.gunler[i].tarih) <= k.HAFTA_SONU_BOSLUGU, `${x.ilk}: iç boşluk`);
  }
  for (let i = 1; i < h.length; i++) assert.ok(k.gunFarki(h[i - 1].son, h[i].ilk) > k.HAFTA_SONU_BOSLUGU, `${h[i].ilk}: haftalar ayrı`);
  assert.equal(h.flatMap((x) => x.gunler).length, 77);
  // Tek günlük hafta sonu: 15 Mayıs 2027 (16 Mayıs Kurban Bayramı'nda ders yok).
  assert.deepEqual(h.find((x) => x.ilk === '2027-05-15').gunler.map((g) => g.tarih), ['2027-05-15']);
  // Üç gün: tatil Pazartesileri (Cumartesi, Pazar, Pazartesi) birlikte.
  assert.deepEqual(h.find((x) => x.ilk === '2026-12-19').gunler.map((g) => g.tarih), ['2026-12-19', '2026-12-20', '2026-12-21']);
  assert.deepEqual(k.haftaSonlari([]), []);
  // Boşluk eşiği: Cumartesi → Pazartesi (2 gün) birleşir, Cumartesi → Salı (3 gün) ayrılır.
  const gun = (tarih) => ({ tarih, gun: '', kip: 'kose', gruplar: {} });
  assert.equal(k.haftaSonlari([gun('2026-10-24'), gun('2026-10-26')]).length, 1);
  assert.equal(k.haftaSonlari([gun('2026-10-24'), gun('2026-10-27')]).length, 2);
});

test('haftaBul: Cumartesi sabahı, Pazar, tatil Pazartesisi → o hafta sonu (şimdi); hafta içi ve tatil → sıradaki; ilk günden önce → ilk; son günden sonra → yok', () => {
  const bul = (t) => k.haftaBul(k.HAFTA_SONLARI, t);
  const ozet = (t) => { const s = bul(t); return s && [s.hafta.ilk, s.simdi]; };
  assert.deepEqual(ozet('2026-10-24'), ['2026-10-24', true]); // Cumartesi sabahı
  assert.deepEqual(ozet('2026-10-25'), ['2026-10-24', true]); // Pazar (bugün)
  assert.deepEqual(ozet('2026-10-26'), ['2026-10-24', true]); // sonbahar tatili Pazartesisi, ders günü
  assert.deepEqual(ozet('2026-10-27'), ['2026-10-31', false]); // Salı → sıradaki
  assert.deepEqual(ozet('2026-10-28'), ['2026-10-31', false]); // Çarşamba
  assert.deepEqual(ozet('2026-10-30'), ['2026-10-31', false]); // Cuma
  assert.deepEqual(ozet('2026-10-31'), ['2026-10-31', true]);
  assert.deepEqual(ozet('2026-11-01'), ['2026-10-31', true]);
  assert.deepEqual(ozet('2026-11-02'), ['2026-11-07', false]); // Pazartesi (ders yok) → sıradaki
  // Sonbahar tatili 19–30 Ekim: hafta içi günleri hep sıradaki hafta sonunu gösterir.
  for (let g = 20; g <= 23; g++) assert.deepEqual(ozet(`2026-10-${g}`), ['2026-10-24', false], `2026-10-${g}`);
  assert.deepEqual(ozet('2026-10-19'), ['2026-10-17', true]); // tatil Pazartesisi, ders günü
  assert.deepEqual(ozet('2026-10-29'), ['2026-10-31', false]);
  assert.deepEqual(ozet('2026-10-10'), ['2026-10-10', true]);
  assert.deepEqual(ozet('2026-10-09'), ['2026-10-10', false]); // ilk günden önce
  assert.deepEqual(ozet('2026-01-01'), ['2026-10-10', false]);
  // Bayram: 16 Mayıs'ta ders yok, 15 Mayıs tek günlük hafta sonu → 22 Mayıs.
  assert.deepEqual(ozet('2027-05-15'), ['2027-05-15', true]);
  assert.deepEqual(ozet('2027-05-16'), ['2027-05-22', false]);
  assert.deepEqual(ozet('2027-06-05'), ['2027-06-05', true]);
  assert.deepEqual(ozet('2027-06-06'), ['2027-06-05', true]); // son ders günü
  assert.equal(bul('2027-06-07'), null); // son günden sonra: ders yok
  assert.equal(bul('2027-09-01'), null);
  assert.equal(k.haftaBul([], '2026-10-25'), null);
});

test('brukselGunu: cihaz saat diliminden bağımsız Brüksel takvim günü (yaz saati bitişinde de)', () => {
  assert.equal(k.brukselGunu(new Date('2026-10-28T10:00:00Z')), '2026-10-28');
  assert.equal(k.brukselGunu(new Date('2026-10-24T21:59:59Z')), '2026-10-24'); // 23.59.59 CEST
  assert.equal(k.brukselGunu(new Date('2026-10-24T22:00:00Z')), '2026-10-25'); // 00.00 CEST
  assert.equal(k.brukselGunu(new Date('2026-10-25T22:59:59Z')), '2026-10-25'); // 23.59.59 CET
  assert.equal(k.brukselGunu(new Date('2026-10-25T23:00:00Z')), '2026-10-26'); // 00.00 CET
  assert.match(k.brukselGunu(), /^\d{4}-\d{2}-\d{2}$/);
});

test('hafta seçimi ile ay/gün yardımcıları: tarih aritmetiği, geçersiz tarih, ay anahtarı', () => {
  assert.equal(k.gunEkle('2026-10-31', 1), '2026-11-01');
  assert.equal(k.gunEkle('2026-12-31', 1), '2027-01-01');
  assert.equal(k.gunFarki('2026-10-24', '2026-10-26'), 2);
  assert.equal(k.gunFarki('2026-10-26', '2026-10-24'), -2);
  assert.equal(k.gunFarki('2026-10-24', '2026-10-25'), 1); // yaz saati bitişi günü 25 saat sürer: gün sayısı kaymaz
  assert.ok(k.tarihMi('2026-10-24'));
  for (const kotu of ['2026-02-30', '2026-13-01', '24-10-2026', '', 20261024, null, undefined]) assert.equal(k.tarihMi(kotu), false, String(kotu));
  assert.equal(k.ayAnahtari('2026-10-31'), '2026-10');
});

// ——— Bir ezberin sonraki günü ———
test('maddeTarihleri ve sonrakiGun: İhlâs 31 Ekim’de yeni, 1 Kasım’da pekiştirme; bugünden sonraki ilk gün; bitince yok', () => {
  const t = k.maddeTarihleri(k.DERS_GUNLERI, 's-ihlas');
  assert.deepEqual(t.slice(0, 3), [
    { tarih: '2026-10-31', gruplar: ['yeni'] }, { tarih: '2026-11-01', gruplar: ['pekistir'] }, { tarih: '2026-11-21', gruplar: ['pekistir'] },
  ]);
  assert.ok(t.every((x, i) => i === 0 || x.tarih > t[i - 1].tarih), 'artan tarih, gün başına tek kayıt');
  assert.deepEqual(k.sonrakiGun(t, '2026-10-28'), { tarih: '2026-10-31', gruplar: ['yeni'] });
  assert.equal(k.sonrakiGun(t, '2026-10-31').tarih, '2026-10-31'); // bugün de sayılır
  assert.equal(k.sonrakiGun(t, '2026-11-02').tarih, '2026-11-21');
  assert.equal(k.sonrakiGun(t, '2027-12-31'), null);
  // Aynı günde iki grup: Kelime-i Tevhid 14 Mart 2027'de hem plan hem kalıcı listesinde.
  const tevhid = k.maddeTarihleri(k.DERS_GUNLERI, 'd-kelime-i-tevhid').find((x) => x.tarih === '2027-03-14');
  assert.deepEqual(tevhid.gruplar, ['kalici', 'plan']); // grup sırası GRUP_SIRASI'nı izler
  // Aynı günde aynı ezberin iki bölümü tek kayıt: Ettehiyyâtü 6 Aralık.
  assert.deepEqual(k.maddeTarihleri(k.DERS_GUNLERI, 'd-ettehiyyatu').find((x) => x.tarih === '2026-12-06'), { tarih: '2026-12-06', gruplar: ['pekistir'] });
  assert.deepEqual(k.maddeTarihleri(k.DERS_GUNLERI, 'yok-boyle'), []);
});

test('yoğun kodlama: kodla/coz gidiş dönüş; bozuk dize hata verir', () => {
  for (const x of [{ id: 's-fatiha' }, { id: 's-fatiha', ayet: [1, 4] }, { id: 'd-ettehiyyatu', bolum: 2 }, { id: 'x', ayet: [2, 2], bolum: 3 }]) {
    assert.deepEqual(k.coz(k.kodla(x)), x);
  }
  assert.equal(k.kodla({ id: 's-fatiha', ayet: [1, 4] }), 's-fatiha~1-4');
  assert.equal(k.kodla({ id: 'd-ettehiyyatu', bolum: 2 }), 'd-ettehiyyatu#2');
  assert.throws(() => k.coz('~1-4'), /çözülemeyen/);
  for (const g of k.DERS_GUNLERI) for (const l of Object.values(g.gruplar)) for (const x of l) assert.deepEqual(k.coz(k.kodla(x)), x);
});

// ——— Biçimler ve metinler ———
test('tarih biçimleri: sayfa dilinde gün, aralık ve ay; Brüksel öğle saati ile gün kaymaz', () => {
  assert.match(k.gunYaz('2026-10-24', YEREL.tr), /^24 Ekim Cumartesi$/);
  assert.match(k.gunYaz('2026-10-24', YEREL.fr), /^Samedi 24 octobre$/);
  assert.match(k.gunYaz('2026-10-24', YEREL.en), /^Saturday 24 October$/);
  assert.match(k.gunYaz('2026-10-24', YEREL.nl), /^Zaterdag 24 oktober$/);
  assert.match(k.gunYaz('2026-10-24', YEREL.de), /^Samstag, 24\. Oktober$/);
  assert.match(k.aralikYaz('2026-10-24', '2026-10-26', YEREL.tr), /^24\s*[–-]\s*26 Ekim$/);
  assert.match(k.aralikYaz('2026-10-31', '2026-11-01', YEREL.tr), /^31 Ekim\s*[–-]\s*1 Kasım$/);
  assert.equal(k.aralikYaz('2027-05-15', '2027-05-15', YEREL.tr), '15 Mayıs');
  assert.equal(k.ayYaz('2026-10-31', YEREL.tr), 'Ekim 2026');
  assert.equal(k.ayYaz('2027-02-06', YEREL.fr), 'Février 2027');
  for (const d of DILLER) for (const g of k.DERS_GUNLERI) {
    assert.ok(k.gunYaz(g.tarih, YEREL[d]).includes(String(Number(g.tarih.slice(8)))), `${d} ${g.tarih}`);
  }
});

test('maddeEki: âyet aralığı, tek âyet, bölüm; ikisi de yoksa boş; beş dilde', () => {
  for (const d of DILLER) {
    const m = k.takvimMetinleri(d);
    assert.equal(k.maddeEki({ id: 'x' }, m), '');
    assert.match(k.maddeEki({ id: 'x', ayet: [1, 4] }, m), /1[–-]4/);
    assert.match(k.maddeEki({ id: 'x', ayet: [3, 3] }, m), /3/);
    assert.doesNotMatch(k.maddeEki({ id: 'x', ayet: [3, 3] }, m), /[–-]/);
    assert.match(k.maddeEki({ id: 'x', bolum: 2 }, m), /2/);
    assert.doesNotMatch(k.maddeEki({ id: 'x', ayet: [1, 4], bolum: 2 }, m), /[{}]/);
  }
  assert.equal(k.maddeEki({ id: 'x', ayet: [1, 4] }, k.takvimMetinleri('tr')), '1–4. âyetler');
  assert.equal(k.maddeEki({ id: 'x', ayet: [5, 5] }, k.takvimMetinleri('tr')), '5. âyet');
  assert.equal(k.maddeEki({ id: 'x', bolum: 2 }, k.takvimMetinleri('tr')), '2. bölüm');
});

test('metinler: beş dilin anahtarları ve yer tutucuları aynı; dillerin metni kopya değil; yasak simge yok, «hoca» yalnız Türkçede; Fransızca tipografi uygulanmış', () => {
  const duz = (o, on = '') => Object.entries(o).flatMap(([a, d]) => (d && typeof d === 'object' && !Array.isArray(d) ? duz(d, `${on}${a}.`) : [[`${on}${a}`, d]]));
  const tr = duz(k.takvimMetinleri('tr'));
  const yerTutucu = (s) => (typeof s === 'string' ? [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort().join(',') : '');
  for (const d of DILLER) {
    const m = duz(k.takvimMetinleri(d));
    assert.deepEqual(m.map(([a]) => a), tr.map(([a]) => a), `${d}: anahtarlar`);
    for (const [a, v] of m) {
      const dizi = Array.isArray(v) ? v : [v];
      assert.ok(dizi.every((s) => typeof s === 'string' && s.trim()), `${d}.${a}: boş metin`);
      const trDeger = tr.find(([x]) => x === a)[1];
      assert.equal(yerTutucu(Array.isArray(v) ? v.join(' ') : v), yerTutucu(Array.isArray(trDeger) ? trDeger.join(' ') : trDeger), `${d}.${a}: yer tutucu`);
      for (const s of dizi) {
        assert.doesNotMatch(s, /🙏|[♥❤💚💛💙💜🤍🖤🧡💖💗💓💕]/, `${d}.${a}`);
        if (d !== 'tr') assert.doesNotMatch(s, /hoca|hodja/i, `${d}.${a}: Türkçe «hoca» başka dile sızmış`); // Türkçede «hoca» platformun diğer sayfalarında da geçer (belge, kilimim)
        assert.doesNotMatch(s, /\s{2,}/, `${d}.${a}: çift boşluk`);
      }
      if (d !== 'tr') assert.notDeepEqual(v, trDeger, `${d}.${a}: Türkçe ile aynı (çevrilmemiş)`);
    }
  }
  // Fransızca: ; ! ? öncesinde düz boşluk kalmaz (ince bölünmez boşluk), : öncesinde bölünmez boşluk.
  for (const [a, v] of duz(k.takvimMetinleri('fr'))) for (const s of Array.isArray(v) ? v : [v]) assert.doesNotMatch(s, / [;!?:]/, `fr.${a}: düz boşluk + noktalama`);
  const frKarsilastir = k.takvimMetinleri('fr').bandBu;
  assert.match(frKarsilastir, /semaine :/);
  // Grup adları ve ders kipleri eksiksiz.
  for (const d of DILLER) {
    const m = k.takvimMetinleri(d);
    assert.deepEqual(Object.keys(m.grup), k.GRUP_SIRASI);
    assert.deepEqual(Object.keys(m.grupKisa), k.GRUP_SIRASI);
    assert.deepEqual(Object.keys(m.gunKipi).sort(), [...k.DERS_KIPLERI].sort());
  }
  assert.deepEqual(k.takvimMetinleri('tr').grup, {
    yeni: 'Yeni ezber', pekistir: 'Pekiştirme', dinleme: 'Dinleme', kalici: 'Tekrar ve kalıcı tur', plan: 'Dersin ezberi (plan)', diger: 'Diğer derslerin ezberi',
  });
});
