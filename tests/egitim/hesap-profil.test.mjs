/**
 * İlim Yolu Dilim 1 (2 Kasım 2026) — profil, kullanıcı adı, «Yeni Müslümanım» açık rızası, hesap silme/bağlama (hesap/profil.ts)
 * ve öğrencinin sayfasındaki hoca kaydı (hesap/ogretmen-kaydi.ts). Bağlayıcı: profile istemci YALNIZ dil/sehir/cami/tercihler/
 * sonGiris yazar (kural `profilGecerli`); hassas belge yalnız {muhtedi, riza:{zaman: sunucu zamanı, metinSurum}} ve geri alma onu
 * siler; sunucu hataları koda çevrilir; hoca kaydı yalnız `ref` yetkisi varken okunur ve birleşik kilimin girdisini verir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALAN_SIL, BellekDepo, SUNUCU_ZAMANI, hata, kullanici, sahteFirebase, yukle } from './hesap-sahte.mjs';

const m = await yukle('egitim-hesap-profil-test', ['hesap/profil', 'hesap/ogretmen-kaydi', 'hesap/isaret', '@ortak/lib/ezber/kilim', '@ortak/lib/ezber/kilimim', '@ortak/lib/ezber/cihaz']);
const PROFIL = 'kullanicilar/u-deneme-1';
const HASSAS = 'kullanicilar/u-deneme-1/ozel/hassas';
const IZINLI = ['cami', 'dil', 'sehir', 'sonGiris', 'tercihler'];

test('profil yükü: yalnız izinli alanlar; boş şehir/cami ve null tercihler silinir; geçersiz değer reddedilir', () => {
  assert.deepEqual(m.profilYuku({ dil: 'fr', sehir: ' Namur ', cami: '', tercihler: { haftalik: true, gun: 0, saat: 19 } }, ALAN_SIL),
    { dil: 'fr', sehir: 'Namur', cami: ALAN_SIL, tercihler: { haftalik: true, gun: 0, saat: 19 } });
  assert.deepEqual(m.profilYuku({ sehir: null, tercihler: null }, ALAN_SIL), { sehir: ALAN_SIL, tercihler: ALAN_SIL });
  assert.deepEqual(m.profilYuku({ ad: 'x', tur: 'kursYetiskin', ref: 'R1', olusturma: 1, sonGiris: 2 }, ALAN_SIL), {}, 'sunucu alanları yük dışında');
  for (const kotu of [{ dil: 'es' }, { sehir: 'x'.repeat(81) }, { cami: 5 }, { tercihler: { gun: 7 } }, { tercihler: { saat: 1.5 } }, { tercihler: { haftalik: 'evet' } }, { tercihler: { renk: 'mavi' } }, { tercihler: [] }])
    assert.throws(() => m.profilYuku(kotu, ALAN_SIL), TypeError, JSON.stringify(kotu));
});

test('profil yazımı birleştirerek; belge kurallardaki alanların dışına çıkmaz', async () => {
  const { f, k, bulut } = sahteFirebase({ belgeler: { [PROFIL]: { ad: 'ayse', tur: 'genel', cami: 'Ulu Camii' } } });
  assert.deepEqual(await m.profilYaz(f, { dil: 'tr', cami: null, tercihler: { gun: 3 } }), { ok: true });
  assert.deepEqual(k.yazimlar, [{ tur: 'set', yol: PROFIL, veri: { dil: 'tr', cami: ALAN_SIL, tercihler: { gun: 3 } }, sec: { merge: true } }]);
  assert.deepEqual(bulut.get(PROFIL), { ad: 'ayse', tur: 'genel', dil: 'tr', tercihler: { gun: 3 } });
  for (const y of k.yazimlar) assert.ok(Object.keys(y.veri).every((a) => IZINLI.includes(a)));
  assert.deepEqual(await m.profilYaz(f, {}), { ok: true });
  assert.equal(k.yazimlar.length, 1, 'boş değişiklik yazılmaz');
  f.fs.setDoc = async () => { throw hata('permission-denied'); };
  assert.deepEqual(await m.profilYaz(f, { dil: 'en' }), { ok: false, neden: 'yetki-yok' });
  f.auth.currentUser = null;
  assert.deepEqual(await m.profilYaz(f, { dil: 'en' }), { ok: false, neden: 'oturum-yok' });
});

test('profil okuma: bozuk ve bilinmeyen alanlar süzülür', async () => {
  const zaman = { toMillis: () => Date.UTC(2026, 11, 2) };
  assert.deepEqual(m.profilOku({ ad: 'ayse.nur', dil: 'nl', tur: 'kursYetiskin', ref: 'UC-1', sehir: 'Marche', tercihler: { haftalik: false }, silinecek: zaman, gizli: 'x' }),
    { ad: 'ayse.nur', dil: 'nl', tur: 'kursYetiskin', ref: 'UC-1', sehir: 'Marche', cami: '', tercihler: { haftalik: false }, silinecek: '2026-12-02T00:00:00.000Z' });
  assert.deepEqual(m.profilOku({ ad: 'A B', dil: 'es', tur: 'admin', tercihler: { gun: 9 } }),
    { ad: '', dil: '', tur: '', ref: '', sehir: '', cami: '', tercihler: {}, silinecek: '' });
  assert.deepEqual(m.profilOku(null).ad, '');
  const { f } = sahteFirebase();
  assert.equal(await m.profilGetir(f), null, 'belge yok: kullanıcı adı adımı');
});

test('sonGiris: sunucu zamanı, cihaz başına günde bir kez', async () => {
  const { f, k } = sahteFirebase();
  const depo = new BellekDepo();
  assert.equal(await m.sonGirisYaz(f, { bugun: '2026-11-02', depo }), true);
  assert.equal(await m.sonGirisYaz(f, { bugun: '2026-11-02', depo }), false);
  assert.equal(await m.sonGirisYaz(f, { bugun: '2026-11-03', depo }), true);
  assert.equal(k.yazimlar.length, 2);
  assert.deepEqual(k.yazimlar[0], { tur: 'set', yol: PROFIL, veri: { sonGiris: SUNUCU_ZAMANI }, sec: { merge: true } });
  assert.match(depo.getItem(m.SON_GIRIS_ANAHTARI), /^[0-9a-f]{32}:2026-11-03$/, 'ham uid yazılmaz');
});

test('kullanıcı adı: biçim önce istemcide; normal biçim gönderilir; sunucu hataları kod', async () => {
  const { f, k } = sahteFirebase({ cagrilar: { kullaniciAdiAl: ({ ad }) => ({ ad }) } });
  assert.deepEqual(await m.kullaniciAdiAl(f, '  İrem.K '), { ok: true, ad: 'irem.k' });
  assert.deepEqual(k.cagrilar, [['kullaniciAdiAl', { ad: 'irem.k' }]]);
  assert.deepEqual(await m.kullaniciAdiAl(f, 'ab'), { ok: false, neden: 'gecersiz-ad', alt: 'kisa' });
  assert.deepEqual(await m.kullaniciAdiAl(f, 'ırmak'), { ok: false, neden: 'gecersiz-ad', alt: 'bas' });
  assert.equal(k.cagrilar.length, 1, 'geçersiz ad sunucuya gitmez');
  const sunucu = (e) => sahteFirebase({ cagrilar: { kullaniciAdiAl: () => { throw e; } } }).f;
  assert.deepEqual(await m.kullaniciAdiAl(sunucu(hata('functions/invalid-argument', 'gecersiz-ad', { neden: 'ayrilmis' })), 'admin'), { ok: false, neden: 'gecersiz-ad', alt: 'ayrilmis' });
  assert.deepEqual(await m.kullaniciAdiAl(sunucu(hata('functions/already-exists', 'ad-alinmis')), 'ayse'), { ok: false, neden: 'ad-alinmis' });
  assert.deepEqual(await m.kullaniciAdiAl(sunucu(hata('functions/resource-exhausted', 'ad-degisikligi-sinirli', { sonraki: '2026-12-01T00:00:00.000Z' })), 'ayse'),
    { ok: false, neden: 'ad-degisikligi-sinirli', sonraki: '2026-12-01T00:00:00.000Z' });
  assert.deepEqual(await m.kullaniciAdiAl(sunucu(hata('functions/permission-denied', 'yetki-yok')), 'ayse'), { ok: false, neden: 'yetki-yok' });
  assert.deepEqual(await m.kullaniciAdiAl(sunucu(hata('functions/internal', 'internal')), 'ayse'), { ok: false, neden: 'ag' });
  assert.deepEqual(await m.kullaniciAdiAl(sunucu(hata('functions/unauthenticated', 'oturum-yok')), 'ayse'), { ok: false, neden: 'oturum-yok' });
  assert.deepEqual(m.cagriHatasi(hata('functions/not-found', 'not-found')), { ok: false, neden: 'not-found' });
  assert.deepEqual(m.cagriHatasi(new Error('Bir Şey')), { ok: false, neden: 'bilinmeyen' });
});

test('hesap bağlama: kod gönderilir, token zorla tazelenir; kod hataları alt nedenle', async () => {
  const u = kullanici();
  const { f, k } = sahteFirebase({ user: u, cagrilar: { hesabiBagla: () => ({ ref: 'UC-2026-0022' }) } });
  assert.deepEqual(await m.hesabiBagla(f, 'k7p2-qx9m'), { ok: true, ref: 'UC-2026-0022' });
  assert.deepEqual(k.cagrilar, [['hesabiBagla', { kod: 'k7p2-qx9m' }]]);
  assert.equal(u.tazelemeler, 1, 'yeni ref yetkisi için token tazelendi');
  for (const alt of ['bicim', 'yok', 'kullanildi', 'suresi-doldu', 'kapali']) {
    const s = sahteFirebase({ cagrilar: { hesabiBagla: () => { throw hata('functions/failed-precondition', 'gecersiz-kod', { neden: alt }); } } });
    assert.deepEqual(await m.hesabiBagla(s.f, 'X'), { ok: false, neden: 'gecersiz-kod', alt });
  }
  const s2 = sahteFirebase({ cagrilar: { hesabiBagla: () => { throw hata('functions/permission-denied', 'eposta-dogrulanmamis'); } } });
  assert.deepEqual(await m.hesabiBagla(s2.f, 'X'), { ok: false, neden: 'eposta-dogrulanmamis' });
});

test('hesap silme ve iptal', async () => {
  const { f, k } = sahteFirebase({ cagrilar: { hesabimiSil: () => ({ silinecek: '2026-12-02T10:00:00.000Z' }), hesapSilmeIptal: () => ({ ok: true }) } });
  assert.deepEqual(await m.hesabimiSil(f), { ok: true, silinecek: '2026-12-02T10:00:00.000Z' });
  assert.deepEqual(await m.hesapSilmeIptal(f), { ok: true });
  assert.deepEqual(k.cagrilar.map((x) => x[0]), ['hesabimiSil', 'hesapSilmeIptal']);
});

test('«Yeni Müslümanım»: yalnız {muhtedi, riza:{zaman: sunucu zamanı, metinSurum}}; geri alma belgeyi siler', async () => {
  const { f, k, bulut } = sahteFirebase();
  assert.equal(await m.muhtediOku(f), false);
  assert.deepEqual(await m.muhtediIsaretle(f, 'riza-2026-11'), { ok: true });
  assert.deepEqual(k.yazimlar[0], { tur: 'set', yol: HASSAS, veri: { muhtedi: true, riza: { zaman: SUNUCU_ZAMANI, metinSurum: 'riza-2026-11' } }, sec: undefined });
  assert.equal(await m.muhtediOku(f), true);
  assert.equal(bulut.has(PROFIL), false, 'profile hiçbir şey yazılmaz');
  assert.deepEqual(await m.muhtediGeriAl(f), { ok: true });
  assert.deepEqual(k.yazimlar[1], { tur: 'delete', yol: HASSAS });
  assert.equal(bulut.has(HASSAS), false);
  await assert.rejects(() => m.muhtediIsaretle(f, ''), TypeError);
  await assert.rejects(() => m.muhtediIsaretle(f, 'x'.repeat(41)), TypeError);
  f.fs.setDoc = async () => { throw hata('permission-denied'); };
  assert.deepEqual(await m.muhtediIsaretle(f, 'riza-2026-11'), { ok: false, neden: 'yetki-yok' }, 'çocuk hesabı: kural reddeder');
  f.fs.getDoc = async () => { throw hata('unavailable'); };
  assert.equal(await m.muhtediOku(f), null);
});

const d = (basamak, sonrakiKontrol = '') => ({ basamak, kalite: '', notlar: [], sonrakiKontrol, surum: 1 });
const olay = (ezber, tur, sonra, ek = {}) => ({ ezber, tur, kalite: '', notlar: [], basamakOnce: 0, basamakSonra: sonra, zorla: false, tarih: '2026-10-30', zaman: 1, ...ek });

test('hoca kaydı: ref yoksa okunmaz; varsa ezberDurum/{ref} + son 20 olay okunur, bozuk kayıt süzülür', async () => {
  const { f, k } = sahteFirebase({
    belgeler: {
      'ezberDurum/R1': { ogeler: { 's-fatiha': d(2, '2026-11-06'), 's-yok': d(1), 's-ihlas': { basamak: 9 } } },
      'ezberDurum/R1/olaylar/o1': olay('s-fatiha', 'dinleme', 2, { kalite: 'tam', notlar: ['akici'] }),
      'ezberDurum/R1/olaylar/o2': olay('s-fatiha', 'atama', 1),
      'ezberDurum/R1/olaylar/o3': { ezber: 'bozuk' },
    },
  });
  assert.equal(await m.ogretmenKaydiOku(f, { ref: '' }), null);
  assert.equal(k.okumalar.length, 0);
  const kayit = await m.ogretmenKaydiOku(f, { ref: 'R1' });
  assert.deepEqual(Object.keys(kayit.ogeler), ['s-fatiha']);
  assert.equal(kayit.olaylar.length, 2);
  assert.deepEqual(k.okumalar.sort(), ['ezberDurum/R1', 'ezberDurum/R1/olaylar']);
  const s2 = sahteFirebase();
  s2.f.fs.getDoc = async () => { throw hata('permission-denied'); };
  const uyari = console.warn;
  console.warn = () => {};
  try { assert.equal(await m.ogretmenKaydiOku(s2.f, { ref: 'R2' }), null, 'yetki yoksa (bağ çözülmüş) null'); } finally { console.warn = uyari; }
});

test('öğretmen görünümü: birleşik kilimin girdisi ve çocuk dilindeki satırlar (beş dil)', () => {
  const kayit = { ogeler: { 's-fatiha': d(2, '2026-11-06') }, olaylar: [olay('s-fatiha', 'dinleme', 2, { kalite: 'tam' }), olay('s-ihlas', 'gecis', 2)] };
  const kendi = { v: 1, ar: 1, gunler: [], maddeler: { 's-ihlas': { ...m.varsayilanAyar(), son: Date.UTC(2026, 10, 1), kutu: 4 }, 's-fatiha': { ...m.varsayilanAyar(), son: 5, kutu: 4 } } };
  for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
    const g = m.ogretmenGorunumu(kayit, kendi, dil);
    assert.deepEqual(g.ogeler, kayit.ogeler);
    assert.equal(g.dinlemeler.length, 1, `${dil}: geçiş olayı veliye/çocuğa görünmez`);
    assert.equal(g.ozet, m.kilimOzeti(kayit.ogeler, dil));
    assert.ok(g.seritler.length > 0);
    const svg = m.kilimSvg(g.ogeler, { onek: 'kl-iy', dil, baslik: 'Kilimim', birlesik: { kendi: g.kendi, dokuAdlari: ['0', '1', '2', '3'] } });
    assert.match(svg, /<g class="kl-oge" data-id="s-ihlas" data-basamak="0" data-kendi="3">/, `${dil}: hoca 0 → kendi dokusu`);
    assert.match(svg, /<g class="kl-oge" data-id="s-fatiha" data-basamak="2">/, `${dil}: hoca 2 → yalnız hocanın dolgusu`);
  }
  const bos = m.ogretmenGorunumu(null, 'bozuk', 'tr');
  assert.deepEqual(bos.ogeler, {});
  assert.deepEqual(bos.kendi, m.bos());
  assert.deepEqual(bos.dinlemeler, []);
});
