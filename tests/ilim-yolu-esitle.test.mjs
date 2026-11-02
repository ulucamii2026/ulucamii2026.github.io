/**
 * İlim Yolu Dilim 1 (2 Kasım 2026) — cihazdaki ezber çalışmasının hesapla eşitlenmesi (egitim/src/lib/hesap/esitle.ts).
 * Bağlayıcı: buluta YALNIZ kuralın izin verdiği alanlar gider (`v, ar, maddeler, gunler, guncelleme`; guncelleme = sunucu
 * zamanı); değişiklik yoksa yazılmaz; çevrim dışıyken cihaz kopyası esas kalır ve hiçbir şey kaybolmaz; anonim çalışma ancak
 * kullanıcı «evet» deyince ve kullanıcının kopyası yazıldıktan sonra taşınıp silinir; «hayır»da olduğu gibi kalır.
 * Firebase sahtedir (tests/egitim/hesap-sahte.mjs): ağ ve emülatör yok.
 */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { BellekDepo, SUNUCU_ZAMANI, hata, kullanici, sahteFirebase, yukle } from './egitim/hesap-sahte.mjs';

const m = await yukle('ilim-yolu-esitle-test', ['hesap/esitle', 'hesap/isaret']);
// Aynı paketteki cihaz.ts (sayfaların kullandığı oku/yaz/anahtar) — ayrı pakette olsaydı da aynı biçim; burada tek kopya.
const c = await yukle('ilim-yolu-esitle-cihaz', ['@ortak/lib/ezber/cihaz']);

const UID = 'u-deneme-1';
const OZET = await m.uidOzeti(UID);
const KULLANICI = c.kullaniciAnahtari(OZET);
const BULUT = `kullanicilar/${UID}/calisma/ezber`;
const SIMDI = Date.UTC(2026, 10, 2, 12);
const ayar = (son, ek = {}) => ({ ...c.varsayilanAyar(), son, ...ek });
const durum = (maddeler, gunler = [], ar = 1) => ({ v: 1, ar, maddeler, gunler });
const depoIle = (kayitlar) => new BellekDepo(Object.fromEntries(Object.entries(kayitlar).map(([k, v]) => [k, JSON.stringify(v)])));
const oku = (depo, anahtar) => c.oku(depo, anahtar);
const IZINLI = ['ar', 'guncelleme', 'gunler', 'maddeler', 'v'];

test('uid özeti: SHA-256 onaltılık ilk 32 hane; kullanıcı anahtarı bundan', async () => {
  assert.equal(await m.uidOzeti('abc'), 'ba7816bf8f01cfea414140de5dae2223');
  assert.match(OZET, /^[0-9a-f]{32}$/);
  assert.equal(KULLANICI, `ulucamii:ezber:cihaz:v1:u:${OZET}`);
  await assert.rejects(() => m.uidOzeti(''), TypeError);
});

test('birleştir-yaz: buluta yalnız izinli alanlar, guncelleme = sunucu zamanı; cihaz da birleşik sonucu alır', async () => {
  const depo = depoIle({ [KULLANICI]: durum({ 's-fatiha': ayar(SIMDI - 1000, { kutu: 2 }) }, ['2026-11-01'], 3) });
  const { f, k, bulut } = sahteFirebase({ belgeler: { [BULUT]: { ...durum({ 's-ihlas': ayar(SIMDI - 5000) }, ['2026-10-30']), guncelleme: 'eski', fazla: 'x' } } });
  const s = await m.esitle(f, { depo, simdi: SIMDI, cevrimici: () => true });
  assert.deepEqual(s, { durum: 'tamam', yazildi: true, madde: 2 });
  assert.equal(k.islemler, 1, 'okuma-birleştirme-yazma tek işlemde');
  assert.equal(k.yazimlar.length, 1);
  const { yol, veri, sec } = k.yazimlar[0];
  assert.equal(yol, BULUT);
  assert.equal(sec, undefined, 'tam yazım (merge değil): eski/fazla alan kalmaz');
  assert.deepEqual(Object.keys(veri).sort(), IZINLI);
  assert.equal(veri.guncelleme, SUNUCU_ZAMANI);
  assert.equal(veri.v, 1);
  assert.equal(veri.ar, 3, 'Arapça boyutu bu cihazın tercihi');
  assert.deepEqual(Object.keys(veri.maddeler).sort(), ['s-fatiha', 's-ihlas']);
  assert.deepEqual(veri.gunler, ['2026-10-30', '2026-11-01']);
  assert.ok(Number.isInteger(veri.v) && Number.isInteger(veri.ar) && veri.ar >= 0 && veri.ar <= 4, 'kural: v int, ar int 0–4');
  assert.deepEqual(Object.keys(bulut.get(BULUT)).sort(), IZINLI);
  assert.deepEqual(Object.keys(oku(depo, KULLANICI).maddeler).sort(), ['s-fatiha', 's-ihlas']);
  assert.equal(depo.getItem(c.ANAHTAR), null, 'anonim anahtara dokunulmaz');
});

test('değişiklik yoksa yazılmaz; ne bulut ne cihazda kayıt varsa boş belge açılmaz', async () => {
  const d = durum({ 's-fatiha': ayar(SIMDI - 1000, { kutu: 1 }) }, ['2026-11-01']);
  const depo = depoIle({ [KULLANICI]: d });
  // Bulut aynı içeriği farklı alan sırasıyla taşıyor (Firestore harita sırasını korumaz).
  const ters = { gunler: d.gunler, maddeler: { 's-fatiha': Object.fromEntries(Object.entries(d.maddeler['s-fatiha']).reverse()) }, ar: 1, v: 1, guncelleme: 'eski' };
  const { f, k } = sahteFirebase({ belgeler: { [BULUT]: ters } });
  assert.deepEqual(await m.esitle(f, { depo, simdi: SIMDI, cevrimici: () => true }), { durum: 'tamam', yazildi: false, madde: 1 });
  assert.equal(k.yazimlar.length, 0);
  const bos = sahteFirebase();
  assert.deepEqual(await m.esitle(bos.f, { depo: new BellekDepo(), simdi: SIMDI, cevrimici: () => true }), { durum: 'tamam', yazildi: false, madde: 0 });
  assert.equal(bos.k.yazimlar.length, 0);
});

test('çevrim dışı: işlem açılmaz, cihaz kopyası aynen kalır; bağlantı hatası da çevrim dışı sayılır', async () => {
  const d = durum({ 's-fatiha': ayar(SIMDI - 1000) });
  const depo = depoIle({ [KULLANICI]: d });
  const once = depo.getItem(KULLANICI);
  const { f, k } = sahteFirebase();
  assert.deepEqual(await m.esitle(f, { depo, simdi: SIMDI, cevrimici: () => false }), { durum: 'cevrimdisi' });
  assert.equal(k.islemler, 0);
  assert.equal(depo.getItem(KULLANICI), once);
  f.fs.runTransaction = async () => { throw hata('unavailable'); };
  assert.deepEqual(await m.esitle(f, { depo, simdi: SIMDI, cevrimici: () => true }), { durum: 'cevrimdisi' });
  assert.equal(depo.getItem(KULLANICI), once);
  f.fs.runTransaction = async () => { throw hata('permission-denied'); };
  assert.deepEqual(await m.esitle(f, { depo, simdi: SIMDI, cevrimici: () => true }), { durum: 'hata', kod: 'permission-denied' });
  assert.equal(depo.getItem(KULLANICI), once);
  f.auth.currentUser = null;
  assert.deepEqual(await m.esitle(f, { depo, simdi: SIMDI }), { durum: 'oturum-yok' });
});

test('işlem sürerken sayfa yeni çalışma yazarsa kaybolmaz (cihaz yeniden okunup birleştirilir)', async () => {
  const depo = depoIle({ [KULLANICI]: durum({ 's-fatiha': ayar(SIMDI - 9000) }) });
  const { f } = sahteFirebase();
  const asil = f.fs.runTransaction;
  f.fs.runTransaction = async (db, fn) => {
    const r = await asil(db, fn);
    c.yaz(depo, c.maddeyiGuncelle(oku(depo, KULLANICI), 's-kevser', { kutu: 0 }, SIMDI - 10), KULLANICI);
    return r;
  };
  await m.esitle(f, { depo, simdi: SIMDI, cevrimici: () => true });
  assert.deepEqual(Object.keys(oku(depo, KULLANICI).maddeler).sort(), ['s-fatiha', 's-kevser']);
});

test('ilk giriş: anonim çalışma hesaba bir şey katacaksa karar sayfaya bırakılır; «evet» taşır ve anonimi siler', async () => {
  const anonim = durum({ 's-fatiha': ayar(SIMDI - 1000, { kutu: 3 }), 's-ihlas': ayar(SIMDI - 9000), 's-nas': ayar(0) }, ['2026-11-02'], 4);
  const depo = depoIle({ [c.ANAHTAR]: anonim });
  // Bulutta s-ihlas daha yeni: yalnız s-fatiha katkıdır (s-nas hiç çalışılmamış).
  const { f, k, bulut } = sahteFirebase({ belgeler: { [BULUT]: durum({ 's-ihlas': ayar(SIMDI - 100) }) } });
  const karar = await m.giristeEsitle(f, { depo, simdi: SIMDI, cevrimici: () => true });
  assert.equal(karar.tur, 'sor');
  assert.equal(karar.n, 1);
  assert.equal(depo.getItem(m.OTURUM_ANAHTARI), OZET, 'oturum işareti konur');
  assert.equal(k.yazimlar.length, 0, 'cevap gelmeden buluta yazılmaz');
  assert.equal(oku(depo, KULLANICI).ar, 4, 'yazı boyutu tercihi kullanıcının kopyasına geçer');
  const s = await karar.cevapla(true);
  assert.equal(s.durum, 'tamam');
  assert.equal(depo.getItem(c.ANAHTAR), null, 'anonim kayıt taşındıktan sonra silinir');
  assert.deepEqual(Object.keys(bulut.get(BULUT).maddeler).sort(), ['s-fatiha', 's-ihlas', 's-nas']);
  assert.equal(bulut.get(BULUT).maddeler['s-ihlas'].son, SIMDI - 100, 'buluttaki daha yeni kayıt kazanır');
  assert.deepEqual(bulut.get(BULUT).gunler, ['2026-11-02']);
});

test('ilk giriş «hayır»: anonim kayıt aynen kalır, hesap yine eşitlenir; kopya yazılamazsa anonim silinmez', async () => {
  const anonim = durum({ 's-fatiha': ayar(SIMDI - 1000) });
  const depo = depoIle({ [c.ANAHTAR]: anonim });
  const once = depo.getItem(c.ANAHTAR);
  const { f, k } = sahteFirebase({ belgeler: { [BULUT]: durum({ 's-ihlas': ayar(SIMDI - 100) }) } });
  const karar = await m.giristeEsitle(f, { depo, simdi: SIMDI, cevrimici: () => true });
  assert.equal(karar.tur, 'sor');
  assert.equal((await karar.cevapla(false)).durum, 'tamam');
  assert.equal(depo.getItem(c.ANAHTAR), once);
  assert.deepEqual(Object.keys(oku(depo, KULLANICI).maddeler), ['s-ihlas']);
  assert.equal(k.yazimlar.length, 0, 'bulut zaten güncel');

  // Depo doluysa (yazım başarısız) anonim kayıt silinmez.
  const dolu = depoIle({ [c.ANAHTAR]: anonim });
  const s2 = sahteFirebase();
  const karar2 = await m.giristeEsitle(s2.f, { depo: dolu, simdi: SIMDI, cevrimici: () => true });
  dolu.setItem = () => { throw new Error('QuotaExceededError'); };
  await karar2.cevapla(true);
  assert.equal(dolu.getItem(c.ANAHTAR), once);
});

test('ilk giriş: anonim kayıt yoksa ya da hesaba bir şey katmıyorsa soru yok, doğrudan eşitlenir', async () => {
  const { f } = sahteFirebase({ belgeler: { [BULUT]: durum({ 's-fatiha': ayar(SIMDI - 100) }) } });
  const k1 = await m.giristeEsitle(f, { depo: new BellekDepo(), simdi: SIMDI, cevrimici: () => true });
  assert.deepEqual(k1, { tur: 'tamam', sonuc: { durum: 'tamam', yazildi: false, madde: 1 } });
  const depo = depoIle({ [c.ANAHTAR]: durum({ 's-fatiha': ayar(SIMDI - 5000) }) });
  const k2 = await m.giristeEsitle(f, { depo, simdi: SIMDI, cevrimici: () => true });
  assert.equal(k2.tur, 'tamam', 'buluttaki daha yeni: katkı yok');
  assert.notEqual(depo.getItem(c.ANAHTAR), null, 'sorulmadan anonim kayıt silinmez');
  // Çevrim dışı girişte bulut okunamaz: sayım cihazdaki hesap kopyasıyla yapılır.
  const depo3 = depoIle({ [c.ANAHTAR]: durum({ 's-fatiha': ayar(SIMDI - 5000) }) });
  const s3 = sahteFirebase();
  s3.f.fs.getDoc = async () => { throw hata('unavailable'); };
  const k3 = await m.giristeEsitle(s3.f, { depo: depo3, simdi: SIMDI, cevrimici: () => false });
  assert.equal(k3.tur, 'sor');
  assert.equal(k3.n, 1);
  assert.deepEqual(await k3.cevapla(true), { durum: 'cevrimdisi' });
  assert.ok(oku(depo3, KULLANICI).maddeler['s-fatiha'], 'çevrim dışında da cihaz kopyasına taşındı');
  assert.equal(depo3.getItem(c.ANAHTAR), null);
});

test('eklenecekSayisi: yalnız çalışılmış ve hesaptakinden yeni/yok olan maddeler', () => {
  const anonim = c.temizle(durum({ a1: ayar(10), a2: ayar(20), a3: ayar(0), a4: ayar(30) }));
  const hesap = c.temizle(durum({ a1: ayar(10), a2: ayar(19), a4: ayar(31) }));
  assert.equal(m.eklenecekSayisi(anonim, hesap), 1);
  assert.equal(m.eklenecekSayisi(anonim, c.bos()), 3);
});

test('visibilitychange: bekletmeli tek eşitleme; durdurunca dinleme biter', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const dinleyiciler = new Map();
    const belge = { addEventListener: (t, fn) => dinleyiciler.set(t, fn), removeEventListener: (t) => dinleyiciler.delete(t) };
    const { f, k } = sahteFirebase();
    const depo = depoIle({ [KULLANICI]: durum({ 's-fatiha': ayar(Date.UTC(2026, 9, 1)) }) });
    const sonuclar = [];
    const durdur = m.esitlemeyiBaslat(f, { depo, belge, bekleme: 1000, cevrimici: () => true, sonuc: (s) => sonuclar.push(s) });
    const olay = dinleyiciler.get('visibilitychange');
    olay(); olay(); olay();
    mock.timers.tick(999);
    assert.equal(k.islemler, 0);
    mock.timers.tick(1);
    for (let i = 0; i < 20 && !sonuclar.length; i++) await new Promise((r) => setImmediate(r));
    assert.equal(k.islemler, 1, 'üç olay → tek eşitleme');
    assert.equal(sonuclar[0].durum, 'tamam');
    durdur();
    assert.equal(dinleyiciler.has('visibilitychange'), false);
  } finally {
    mock.timers.reset();
  }
});

test('kullanıcıya göre ayrı anahtar: başka uid başka kopya', async () => {
  const depo = new BellekDepo();
  for (const uid of ['u-a', 'u-b']) {
    const { f } = sahteFirebase({ user: kullanici(uid), belgeler: { [`kullanicilar/${uid}/calisma/ezber`]: durum({ [`s-${uid === 'u-a' ? 'fatiha' : 'nas'}`]: ayar(SIMDI - 10) }) } });
    await m.esitle(f, { depo, simdi: SIMDI, cevrimici: () => true });
  }
  const anahtarlar = depo.anahtarlar();
  assert.equal(anahtarlar.length, 2);
  assert.ok(anahtarlar.every((x) => /^ulucamii:ezber:cihaz:v1:u:[0-9a-f]{32}$/.test(x)));
  assert.ok(!anahtarlar.some((x) => x.includes('u-a') || x.includes('u-b')), 'ham uid depoya yazılmaz');
});
