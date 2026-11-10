/**
 * İlim Yolu · Kur'an Okuma (10 Kasım 2026) — ilerleme kodlaması (src/lib/okuma/ilerleme.ts) ve «Bugünkü çalışma» kurucusu (oturum.ts).
 * Bağlayıcı: birleştirme değişmeli/birleşmeli/idempotent; bozuk girdi temizlenir; buluta yalnız `v, maddeler, guncelleme` gider; cihaz anahtarı
 * ham uid taşımaz; 7 adımın hepsini işaretlemek kuralın 120 anahtar sınırına sığar; oturum 10–11 madde, en çok 5 tekrar, belirleyici.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { BellekDepo, SUNUCU_ZAMANI, kullanici, sahteFirebase, yukle } from './egitim/hesap-sahte.mjs';

mkdirSync('node_modules/.cache', { recursive: true });
const paket = async (giris, ad) => {
  const cikti = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ entryPoints: [giris], outfile: cikti, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href);
};
const m = await paket('src/lib/okuma/ilerleme.ts', 'okuma-ilerleme-test');
const o = await paket('src/lib/okuma/oturum.ts', 'okuma-oturum-test');
const { PLAN, YOL } = await paket('src/lib/okuma/yol.ts', 'okuma-yol-test');
const esitle = await yukle('okuma-esitle-test', ['hesap/okuma-esitle', 'hesap/isaret']);

const G0 = '2026-11-10';
const plan = [{ id: 'o1', iz: 'elifba', n: 12 }, { id: 'o2', iz: 'elifba', n: 8 }, { id: 'o7', iz: 'mushaf', n: 5 }];
const calis = (il, idler, sonuc = 'tam', gun = G0) => idler.reduce((a, id) => m.isaretle(a, id, sonuc, gun), il);
const hepsi = (adim, n) => Array.from({ length: n }, (_, i) => `${adim}-${i}`);

test('Madde kimliği ve konum: geçerli/geçersiz', () => {
  assert.deepEqual(m.konum('o3-17'), { adim: 'o3', sira: 17 });
  for (const k of ['o0-1', 'o10-1', 'o1-400', 'o1-', 'x1-1', 'o1-1 ', '']) assert.equal(m.konum(k), null, k);
});

test('İşaretleme: kutu tekrar.ts ile aynı gider; ilk görülme kutu 0 sayılır; vade son gün + aralık', () => {
  let il = m.bos();
  assert.equal(m.durum(il, 'o1-0'), null);
  il = m.isaretle(il, 'o1-0', 'tam', G0);
  assert.deepEqual(m.durum(il, 'o1-0'), { kutu: 0, gun: G0 });
  assert.equal(m.vade(il, 'o1-0'), '2026-11-11');
  il = m.isaretle(il, 'o1-0', 'tam', '2026-11-11');
  assert.equal(m.durum(il, 'o1-0').kutu, 1);
  assert.equal(m.vade(il, 'o1-0'), '2026-11-14');
  il = m.isaretle(il, 'o1-0', 'az', '2026-11-14');
  assert.equal(m.durum(il, 'o1-0').kutu, 1);
  il = m.isaretle(il, 'o1-0', 'tekrar', '2026-11-20');
  assert.equal(m.durum(il, 'o1-0').kutu, 0);
  assert.equal(m.vadeGeldi(il, 'o1-0', '2026-11-20'), false);
  assert.equal(m.vadeGeldi(il, 'o1-0', '2026-11-21'), true);
  let k = m.bos();
  for (let i = 0; i < 9; i++) k = m.isaretle(k, 'o2-3', 'tam', m.durum(k, 'o2-3') ? m.vade(k, 'o2-3') : G0);
  assert.equal(m.durum(k, 'o2-3').kutu, 4, 'beşinci kutuda kalır');
  assert.equal(m.isaretle(il, 'zz', 'tam', G0), il, 'geçersiz kimlik durumu değiştirmez');
  assert.equal(m.isaretle(il, 'o1-1', 'tam', '2026-13-01'), il, 'geçersiz tarih durumu değiştirmez');
});

test('Seyrek madde: aradaki boşluklar «çalışılmadı» kalır; sondaki boşluklar kırpılır', () => {
  const il = m.isaretle(m.bos(), 'o4-5', 'tam', G0);
  assert.equal(il.maddeler.o4.length, 18);
  assert.equal(m.goruldu(il, 'o4-2'), false);
  assert.equal(m.goruldu(il, 'o4-5'), true);
  assert.equal(m.goruldu(il, 'o4-6'), false);
  assert.deepEqual(m.temizle({ maddeler: { o4: '000000' } }).maddeler, {});
});

test('Birleştirme: değişmeli, birleşmeli, idempotent; yeni gün kazanır, aynı günde düşük kutu kazanır', () => {
  const a = calis(m.bos(), ['o1-0', 'o1-1', 'o2-0']);
  const b = m.isaretle(m.isaretle(m.bos(), 'o1-0', 'tam', '2026-11-12'), 'o1-0', 'tam', '2026-11-13');
  const c = m.isaretle(calis(m.bos(), ['o1-0']), 'o1-0', 'tekrar', G0);
  for (const [x, y] of [[a, b], [a, c], [b, c]]) assert.deepEqual(m.birlestir(x, y), m.birlestir(y, x));
  assert.deepEqual(m.birlestir(m.birlestir(a, b), c), m.birlestir(a, m.birlestir(b, c)));
  assert.deepEqual(m.birlestir(a, a), m.temizle(a));
  assert.deepEqual(m.birlestir(a, m.bos()), m.temizle(a));
  assert.equal(m.durum(m.birlestir(a, b), 'o1-0').gun, '2026-11-13');
  const ayniGun = m.birlestir(calis(m.bos(), ['o1-0']), m.isaretle(m.bos(), 'o1-0', 'tekrar', G0));
  assert.equal(m.durum(ayniGun, 'o1-0').kutu, 0);
  assert.equal(m.durum(m.birlestir(a, b), 'o1-1').kutu, 0);
});

test('Temizle: bozuk girdi atılır; yalnız o1…o9; uzunluk sınırlı', () => {
  for (const ham of [null, undefined, 'x', 5, [], { maddeler: [] }, { maddeler: 'x' }, {}]) assert.deepEqual(m.temizle(ham), m.bos(), String(ham));
  const t = m.temizle({ maddeler: { o1: '1abXYZ2zz9', o8: '1ab', o10: '1ab', evil: '1ab', o3: 7, o2: '6ab1ab' } });
  assert.equal(t.maddeler.o1, '1ab' + '000' + '2zz', 'geçersiz üçlü sıfırlanır, geçerli kalır');
  assert.equal(t.maddeler.o8, '1ab');
  assert.equal(t.maddeler.o10, undefined);
  assert.equal(t.maddeler.evil, undefined);
  assert.equal(t.maddeler.o3, undefined);
  assert.equal(t.maddeler.o2, '000' + '1ab', 'kutu 6 geçersiz');
  assert.equal(m.temizle({ maddeler: { o1: '1ab'.repeat(900) } }).maddeler.o1.length, m.AZAMI_MADDE * 3);
});

test('Hesap kuralı: yedi adımın hepsi dolu olsa da ≤ 120 anahtar; buluta yalnız v, maddeler, guncelleme', () => {
  let il = m.bos();
  for (const a of PLAN) il = calis(il, hepsi(a.id, a.n));
  assert.deepEqual(Object.keys(il.maddeler).sort(), PLAN.map((a) => a.id).sort());
  assert.ok(Object.keys(il.maddeler).length <= 120);
  for (const a of PLAN) assert.equal(il.maddeler[a.id].length, a.n * 3);
  const yuk = m.bulutYuku(il, 'ZAMAN');
  assert.deepEqual(Object.keys(yuk).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.equal(yuk.guncelleme, 'ZAMAN');
  assert.deepEqual(m.sayim(il, ['o1-0', 'o1-1', 'o9-0']), { goruldu: 2, toplam: 3 });
});

test('Cihaz anahtarı ham uid taşımaz; depo okuma/yazma bozulmaya dayanır', () => {
  assert.equal(m.kullaniciAnahtari('a'.repeat(32)), `ulucamii:okuma:cihaz:v1:u:${'a'.repeat(32)}`);
  for (const k of ['', 'ABC', 'kısa', 'a b c d e f g h', 'x'.repeat(65)]) assert.throws(() => m.kullaniciAnahtari(k), TypeError, k);
  const kayit = new Map();
  const depo = { getItem: (k) => kayit.get(k) ?? null, setItem: (k, v) => void kayit.set(k, v), removeItem: (k) => void kayit.delete(k) };
  const il = calis(m.bos(), ['o1-0', 'o1-1']);
  assert.equal(m.yaz(depo, il), true);
  assert.deepEqual(m.oku(depo), il);
  kayit.set(m.ANAHTAR, '{bozuk');
  assert.deepEqual(m.oku(depo), m.bos());
  assert.equal(m.yaz(null, il), false);
  assert.equal(m.yaz({ getItem: () => null, setItem: () => { throw new Error('dolu'); } }, il), false);
  assert.deepEqual(m.oku(null), m.bos());
});

test('eklenecekSayisi: anonimin hesaba gerçekten kattığı madde sayısı', () => {
  const hesap = calis(m.bos(), ['o1-0'], 'tam', '2026-11-12');
  const anonim = calis(m.bos(), ['o1-0', 'o1-1', 'o2-0'], 'tam', G0);
  assert.equal(m.eklenecekSayisi(anonim, hesap), 2, 'o1-0 hesapta daha yeni; o1-1 ve o2-0 yeni');
  assert.equal(m.eklenecekSayisi(m.bos(), hesap), 0);
  assert.equal(m.eklenecekSayisi(hesap, hesap), 0);
});

test('Oturum: boş ilerlemede ilk adımın ilk 6 maddesi, tekrar yok; aynı girdi aynı çıktı', () => {
  const s = o.oturumKur(m.bos(), G0, plan);
  assert.deepEqual(s.yeni, ['o1-0', 'o1-1', 'o1-2', 'o1-3', 'o1-4', 'o1-5']);
  assert.deepEqual(s.tekrar, []);
  assert.equal(s.adim, 'o1');
  assert.deepEqual(s, o.oturumKur(m.bos(), G0, plan));
});

test('Oturum: vadesi gelenler önce (en eski önce, en çok 5), yeniler 4–6; toplam 10–11', () => {
  let il = calis(m.bos(), hepsi('o1', 8), 'tam', '2026-11-01');
  il = m.isaretle(il, 'o1-7', 'tam', '2026-11-02'); // o1-7 daha yeni: vadesi sonra
  const s = o.oturumKur(il, G0, plan);
  assert.deepEqual(s.tekrar, ['o1-0', 'o1-1', 'o1-2', 'o1-3', 'o1-4'], 'birikim 7 olsa da yalnız 5; eşit vadede yol sırası');
  assert.deepEqual(s.yeni, ['o1-8', 'o1-9', 'o1-10', 'o1-11', 'o2-0'], 'adım bitince aynı izin sonraki adımı');
  assert.ok(s.sira.length >= 10 && s.sira.length <= 11);
  assert.deepEqual(s.sira, [...s.tekrar, ...s.yeni]);
  assert.deepEqual(o.oturumKur(calis(m.bos(), ['o1-0']), G0, plan).tekrar, [], 'vadesi gelmemiş tekrara girmez');
  const bir = o.oturumKur(calis(m.bos(), ['o1-0'], 'tam', '2026-11-01'), G0, plan);
  assert.equal(bir.tekrar.length, 1);
  assert.equal(bir.yeni.length, 6, 'yeni üst sınırı 6');
});

test('Oturum: seçilen adım, iz kuralı ve bitiş', () => {
  const s = o.oturumKur(m.bos(), G0, plan, 'o7');
  assert.deepEqual(s.yeni, ['o7-0', 'o7-1', 'o7-2', 'o7-3', 'o7-4'], 'sûre izi yalnız kendi adımı');
  assert.equal(o.oturumKur(m.bos(), G0, plan, 'yok').adim, 'o1');
  const elifbaBitti = calis(m.bos(), [...hepsi('o1', 12), ...hepsi('o2', 8)]);
  assert.equal(o.oturumKur(elifbaBitti, G0, plan).adim, 'o7', 'elifbâ bitince sûre izine geçer');
  const hepsiBitti = calis(elifbaBitti, hepsi('o7', 5));
  const son = o.oturumKur(hepsiBitti, G0, plan);
  assert.deepEqual(son.yeni, []);
  assert.equal(son.adim, null);
  assert.equal(o.oturumKur(hepsiBitti, '2026-12-30', plan).tekrar.length, 5, 'bir ay sonra tekrarlar geri gelir');
});

test('Gerçek yol: 7 adım, her biri ≤ 400 madde; ilk oturum 6 yeni madde', () => {
  assert.equal(PLAN.length, 7);
  assert.equal(YOL.length, 7);
  for (const a of PLAN) assert.ok(a.n > 0 && a.n <= m.AZAMI_MADDE, a.id);
  assert.deepEqual(PLAN.map((a) => a.iz), ['elifba', 'elifba', 'elifba', 'elifba', 'elifba', 'elifba', 'mushaf']);
  assert.equal(o.oturumKur(m.bos(), G0, PLAN).sira.length, 6);
});

test('eşitleme (okuma-esitle.ts): hesap kopyasıyla birleşir; yalnız v, maddeler, guncelleme yazar; değişiklik yoksa yazmaz; oturum yok / çevrim dışı güvenli', async () => {
  const depo = new BellekDepo();
  const ozet = await esitle.uidOzeti('u-deneme-1');
  const anahtar = m.kullaniciAnahtari(ozet);
  m.yaz(depo, calis(m.bos(), ['o1-0', 'o1-1']), anahtar);
  const bulutIl = m.isaretle(m.bos(), 'o2-0', 'tam', '2026-11-09');
  const { f, k, bulut } = sahteFirebase({ user: kullanici('u-deneme-1'), belgeler: { 'kullanicilar/u-deneme-1/calisma/okuma': m.bulutYuku(bulutIl, 'eski') } });
  const sonuc = await esitle.okumaEsitle(f, { depo, cevrimici: () => true });
  assert.equal(sonuc.durum, 'tamam');
  assert.equal(sonuc.yazildi, true);
  assert.equal(sonuc.madde, 3);
  const belge = bulut.get('kullanicilar/u-deneme-1/calisma/okuma');
  assert.deepEqual(Object.keys(belge).sort(), ['guncelleme', 'maddeler', 'v']);
  assert.equal(belge.guncelleme, SUNUCU_ZAMANI);
  assert.deepEqual(Object.keys(belge.maddeler).sort(), ['o1', 'o2']);
  const yerel = m.oku(depo, anahtar);
  assert.ok(m.goruldu(yerel, 'o1-1') && m.goruldu(yerel, 'o2-0'), 'iki yön birleşti');
  const ikinci = await esitle.okumaEsitle(f, { depo, cevrimici: () => true });
  assert.equal(ikinci.yazildi, false);
  assert.equal(k.yazimlar.length, 1, 'ikinci eşitleme yazmadı');
  assert.equal((await esitle.okumaEsitle(sahteFirebase({ user: null }).f, { depo, cevrimici: () => true })).durum, 'oturum-yok');
  const once = JSON.stringify(m.oku(depo, anahtar));
  assert.equal((await esitle.okumaEsitle(f, { depo, cevrimici: () => false })).durum, 'cevrimdisi');
  assert.equal(JSON.stringify(m.oku(depo, anahtar)), once);
});

test('girişte karar (okuma-esitle.ts): anonim yoksa sorulmaz; yeni madde varsa sorulur, «evet» katar ve anonimi siler, «hayır» dokunmaz', async () => {
  const u = kullanici('u-deneme-1');
  const ozet = await esitle.uidOzeti('u-deneme-1');
  const anahtar = m.kullaniciAnahtari(ozet);
  const bosKarar = await esitle.okumaGiristeEsitle(sahteFirebase({ user: u }).f, { depo: new BellekDepo(), cevrimici: () => true });
  assert.equal(bosKarar.tur, 'tamam');
  const bulutBelgesi = () => ({ 'kullanicilar/u-deneme-1/calisma/okuma': m.bulutYuku(calis(m.bos(), ['o1-0'], 'tam', '2026-11-09'), SUNUCU_ZAMANI) });
  const depo = new BellekDepo();
  m.yaz(depo, calis(m.bos(), ['o1-0', 'o1-1']));
  const s1 = sahteFirebase({ user: u, belgeler: bulutBelgesi() });
  const karar = await esitle.okumaGiristeEsitle(s1.f, { depo, cevrimici: () => true });
  assert.equal(karar.tur, 'sor');
  assert.equal(karar.n, 2, 'o1-0 daha yeni gün, o1-1 yeni');
  assert.equal(s1.k.yazimlar.length, 0, 'cevap gelmeden yazılmaz');
  const once = depo.getItem(m.ANAHTAR);
  await karar.cevapla(false);
  assert.equal(depo.getItem(m.ANAHTAR), once);
  assert.equal(m.goruldu(m.oku(depo, anahtar), 'o1-1'), false);
  const s2 = sahteFirebase({ user: u, belgeler: bulutBelgesi() });
  const karar2 = await esitle.okumaGiristeEsitle(s2.f, { depo, cevrimici: () => true });
  await karar2.cevapla(true);
  assert.equal(depo.getItem(m.ANAHTAR), null, 'anonim silindi');
  assert.ok(m.goruldu(m.oku(depo, anahtar), 'o1-1'));
  assert.equal(s2.k.yazimlar.length, 1);
});
