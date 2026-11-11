// İlim Yolu Dilim 2 — haftalikKuyruk (zamanlanmış işlev doğrudan `.run()` ile, scheduleTime = referans an) ve abonelikCik (HTTP, emülatör).
// Sır: scripts/test-hesap.mjs ABONELIK_SIRRI'yı hem emülatöre hem bu sürece verir.
import { before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { db, auth, gerek, temizle, hazir, ISLEV, Timestamp, GUN } from './yardimci.mjs';
import { tokenUret, tokenDogrula } from '../../src/lib/ilim-yolu/abonelik-imza.ts';

const SIRR = process.env.ABONELIK_SIRRI;
assert.ok(SIRR && SIRR.length >= 16, 'ABONELIK_SIRRI test koşucusundan gelmeli (scripts/test-hesap.mjs)');
const islevler = gerek('./lib/index.js');
before(() => hazir(['abonelikCik']));
beforeEach(temizle);

// Kış: Pazar 8 Kasım 2026, 18.00 Brüksel = 17:00 UTC. Yaz saati geçişi: Pazar 29 Mart 2026, 01:00 UTC = 03:00 CEST.
const PAZAR_18 = '2026-11-08T17:00:00.000Z';
const calistir = (scheduleTime = PAZAR_18) => islevler.haftalikKuyruk.run({ scheduleTime });
const kuyruk = async () => Object.fromEntries((await db.collection('epostaKuyrugu').get()).docs.map((d) => [d.id, d.data()]));

/** Auth + profil: dogrulanmis false → e-posta doğrulanmamış; eposta false → e-postasız (çocuk gibi). */
async function kullanici(uid, profil = {}, { dogrulanmis = true, eposta = true } = {}) {
  await auth.createUser({ uid, ...(eposta ? { email: `${uid}@example.test`, emailVerified: dogrulanmis } : {}) });
  await db.doc(`kullanicilar/${uid}`).set({ ad: `kisi.${uid}`, dil: 'tr', tur: 'genel', tercihler: { haftalik: true, gun: 0, saat: 18 }, sonGiris: Timestamp.now(), ...profil });
}

test('haftalikKuyruk: tercihi uyan doğrulanmış yetişkin için tek belge yazar; içerik biçimi ve imzalı bağlantı', async () => {
  await kullanici('u1', { dil: 'fr', ad: 'ali.veli' });
  await db.doc('kullanicilar/u1/calisma/ezber').set({ maddeler: { a: { sonraki: '2026-11-07' }, b: {} }, gunler: ['2026-11-06', '2026-11-08'], guncelleme: Timestamp.now() });
  await db.doc('kullanicilar/u1/calisma/bilgi').set({ maddeler: { k: {} }, gunler: ['2026-11-08'], guncelleme: Timestamp.now() });
  await calistir();

  const k = await kuyruk();
  assert.deepEqual(Object.keys(k), ['h_u1_2026-W45']);
  const d = k['h_u1_2026-W45'];
  assert.deepEqual(Object.keys(d).sort(), ['abonelik', 'ad', 'baglanti', 'bitis', 'deneme', 'dil', 'durum', 'eposta', 'ozet', 'tur', 'uid', 'zaman']);
  assert.equal(d.tur, 'haftalik');
  assert.equal(d.uid, 'u1');
  assert.equal(d.eposta, 'u1@example.test');
  assert.equal(d.dil, 'fr');
  assert.equal(d.ad, 'ali.veli');
  assert.equal(d.durum, 'bekliyor');
  assert.equal(d.deneme, 0);
  assert.deepEqual(d.ozet, { gun: 2, madde: 3, tekrar: 1, sonraki: 'tekrar' });
  assert.equal(d.baglanti, 'https://egitim.ulucamii.be/fr/');
  assert.equal(d.bitis.toMillis(), Date.parse(PAZAR_18) + 7 * GUN, 'TTL: 7 gün');
  const url = new URL(d.abonelik);
  assert.equal(url.origin + url.pathname, 'https://egitim.ulucamii.be/api/abonelik-cik');
  assert.deepEqual(tokenDogrula(url.searchParams.get('k'), SIRR, Date.parse(PAZAR_18)), { ok: true, uid: 'u1' });
});

test('haftalikKuyruk: aynı hafta ikinci çalışma kopya yazmaz; gönderilmiş belgeye dokunmaz; sonraki hafta yeni belge', async () => {
  await kullanici('u1');
  await calistir();
  await db.doc('epostaKuyrugu/h_u1_2026-W45').update({ durum: 'gonderildi' });
  await calistir();
  await calistir(PAZAR_18.replace('17:00', '17:30')); // aynı saat içinde geç başlayan ikinci tetik
  let k = await kuyruk();
  assert.deepEqual(Object.keys(k), ['h_u1_2026-W45']);
  assert.equal(k['h_u1_2026-W45'].durum, 'gonderildi');

  await calistir('2026-11-15T17:00:00.000Z');
  k = await kuyruk();
  assert.deepEqual(Object.keys(k).sort(), ['h_u1_2026-W45', 'h_u1_2026-W46']);
});

test('haftalikKuyruk: zamanı gelmeyen, kapalı, doğrulanmamış, e-postasız, çocuk ve silinecek hesap atlanır; varsayılan Pazar 18', async () => {
  await kullanici('saat9', { tercihler: { haftalik: true, gun: 0, saat: 9 } });
  await kullanici('persembe', { tercihler: { haftalik: true, gun: 4, saat: 18 } });
  await kullanici('kapali', { tercihler: { haftalik: false, gun: 0, saat: 18 } });
  await kullanici('dogrulanmamis', {}, { dogrulanmis: false });
  await kullanici('epostasiz', {}, { eposta: false });
  await kullanici('c_cocuk0000000000000001', { tur: 'cocuk', ref: 'R1' }, { eposta: false });
  await kullanici('cocukTuru', { tur: 'cocuk' }); // e-postası olsa bile tur: cocuk
  await kullanici('silinecek', { silinecek: Timestamp.fromMillis(Date.parse(PAZAR_18) + GUN) });
  await db.doc('kullanicilar/authyok').set({ ad: 'kisi.authyok', tur: 'genel', tercihler: { haftalik: true, gun: 0, saat: 18 } }); // Auth kaydı yok
  await kullanici('varsayilan', { tercihler: { haftalik: true } }); // gun/saat yok → Pazar 18
  await calistir();
  assert.deepEqual(Object.keys(await kuyruk()), ['h_varsayilan_2026-W45']);
});

test('haftalikKuyruk: ilkbahar saat atlamasında 02.00 seçen kullanıcı 03.00 çalışmasında kuyruğa girer', async () => {
  await kullanici('gece2', { tercihler: { haftalik: true, gun: 0, saat: 2 } });
  await kullanici('gece3', { tercihler: { haftalik: true, gun: 0, saat: 3 } });
  await kullanici('gece4', { tercihler: { haftalik: true, gun: 0, saat: 4 } });
  await calistir('2026-03-29T01:00:00.000Z');
  assert.deepEqual(Object.keys(await kuyruk()).sort(), ['h_gece2_2026-W13', 'h_gece3_2026-W13']);
});

test('haftalikKuyruk: yetim kuyruk belgesi (hareketsiz uyarısı) ve başka tür dokunulmaz; uid yoksa hata yok', async () => {
  await db.doc('epostaKuyrugu/x1').set({ tur: 'hareketsiz', uid: 'u9', dil: 'tr', zaman: Timestamp.now() });
  await calistir();
  assert.deepEqual(Object.keys(await kuyruk()), ['x1']);
});

// ── abonelikCik ──
const git = (k, { yontem = 'POST', basliklar = {}, govde } = {}) =>
  fetch(`${ISLEV('abonelikCik')}${k === undefined ? '' : `?k=${encodeURIComponent(k)}`}`, { method: yontem, headers: basliklar, ...(govde ? { body: govde } : {}) });
const haftalik = async (uid) => (await db.doc(`kullanicilar/${uid}`).get()).get('tercihler');

test('abonelikCik: POST haftalığı kapatır (gün/saat korunur), yerelleşmiş sayfa döner; yineleme zararsız', async () => {
  await kullanici('u1', { dil: 'nl', tercihler: { haftalik: true, gun: 2, saat: 7 } });
  const k = tokenUret('u1', SIRR, Date.now());
  for (let i = 0; i < 2; i++) {
    const y = await git(k);
    assert.equal(y.status, 200);
    assert.match(y.headers.get('content-type'), /text\/html/);
    assert.equal(y.headers.get('cache-control'), 'no-store');
    const h = await y.text();
    assert.match(h, /<html lang="nl">/);
    assert.match(h, /Wekelijkse e-mail uitgezet/);
    assert.doesNotMatch(h, /<script|<form|<style|style=/i);
    assert.deepEqual(await haftalik('u1'), { haftalik: false, gun: 2, saat: 7 });
  }
});

test('abonelikCik: GET durum değiştirmez (posta tarayıcısı ön yüklemesi); geçerli belirteç onay sayfasına 302, parça olarak', async () => {
  await kullanici('u1', { dil: 'nl', tercihler: { haftalik: true } });
  const k = tokenUret('u1', SIRR, Date.now());
  const y = await fetch(`${ISLEV('abonelikCik')}?k=${encodeURIComponent(k)}`, { redirect: 'manual', headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' } });
  assert.equal(y.status, 302);
  assert.equal(y.headers.get('location'), `https://egitim.ulucamii.be/fr/abonelik-cik/#${k}`);
  assert.equal((await haftalik('u1')).haftalik, true);
  assert.equal((await git('cop', { yontem: 'GET' })).status, 400);
});

test('abonelikCik: POST tek tıkla (List-Unsubscribe-Post) aynı işi yapar', async () => {
  await kullanici('u1');
  const y = await git(tokenUret('u1', SIRR, Date.now()), { yontem: 'POST', basliklar: { 'Content-Type': 'application/x-www-form-urlencoded' }, govde: 'List-Unsubscribe=One-Click' });
  assert.equal(y.status, 200);
  assert.equal((await haftalik('u1')).haftalik, false);
});

test('abonelikCik: kurcalanmış, süresi dolmuş, eksik ve yanlış sırlı bağlantı reddedilir; hesap değişmez; dil Accept-Language\'den', async () => {
  await kullanici('u1');
  await kullanici('u2');
  const gecerli = tokenUret('u1', SIRR, Date.now());
  const [, bitis, imza] = gecerli.split('.');
  const kotuler = [
    `u2.${bitis}.${imza}`, // başka kullanıcıya taşınmış imza
    `u1.${Number(bitis) + 1}.${imza}`, // süre uzatma
    tokenUret('u1', SIRR, Date.now(), -1), // süresi dolmuş
    tokenUret('u1', 'baska-bir-sir-en-az-16-karakter', Date.now()),
    'cop', '',
  ];
  for (const k of kotuler) {
    const y = await git(k, { basliklar: { 'Accept-Language': 'de-DE,de;q=0.9' } });
    assert.equal(y.status, 400, k);
    assert.match(await y.text(), /<html lang="de">[\s\S]*Ungültiger Link/);
  }
  assert.equal((await git(undefined)).status, 400);
  assert.equal((await haftalik('u1')).haftalik, true);
  assert.equal((await haftalik('u2')).haftalik, true);
});

test('abonelikCik: bilinmeyen hesap «tamam» döner ama profil yaratmaz; PUT 405', async () => {
  const y = await git(tokenUret('yok_uid', SIRR, Date.now()));
  assert.equal(y.status, 200);
  assert.equal((await db.doc('kullanicilar/yok_uid').get()).exists, false);
  assert.equal((await git(tokenUret('yok_uid', SIRR, Date.now()), { yontem: 'PUT' })).status, 405);
});

test('abonelikCik sonrası haftalikKuyruk o kullanıcıyı artık kuyruğa almaz', async () => {
  await kullanici('u1');
  await git(tokenUret('u1', SIRR, Date.now()));
  await calistir();
  assert.deepEqual(await kuyruk(), {});
});

test('G-11: abonelikCik her yanıtta (200, 302, 400, 405) kendi güvenlik başlıklarını yazar', async () => {
  await kullanici('u1', { dil: 'nl', tercihler: { haftalik: true } });
  const k = tokenUret('u1', SIRR, Date.now());
  const yanitlar = [
    await git(k), // 200
    await fetch(`${ISLEV('abonelikCik')}?k=${encodeURIComponent(k)}`, { redirect: 'manual' }), // 302
    await git('cop', { yontem: 'GET' }), // 400
    await fetch(`${ISLEV('abonelikCik')}?k=${encodeURIComponent(k)}`, { method: 'PUT' }), // 405
  ];
  assert.deepEqual(yanitlar.map((y) => y.status), [200, 302, 400, 405]);
  for (const y of yanitlar) {
    assert.equal(y.headers.get('x-frame-options'), 'DENY', String(y.status));
    assert.match(y.headers.get('content-security-policy'), /^default-src 'none'/, String(y.status));
    assert.equal(y.headers.get('x-content-type-options'), 'nosniff', String(y.status));
    assert.equal(y.headers.get('referrer-policy'), 'no-referrer', String(y.status));
  }
});
