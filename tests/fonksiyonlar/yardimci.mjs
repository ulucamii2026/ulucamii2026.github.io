/**
 * tests/fonksiyonlar ortak yardımcıları (İlim Yolu Dilim 1). Yalnız `npm run test:hesap` altında çalışır: Auth 9185, Firestore 8185,
 * Functions 5185, proje demo-ulucamii. Veri firebase-admin ile (functions/node_modules) emülatöre yazılır; callable'lar HTTP
 * üzerinden callable protokolüyle ({data} + Bearer ID token) çağrılır; ID token Auth emülatörünün REST ucundan alınır.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// firebase-admin'den ÖNCE: üretime sessiz geri dönüş yok.
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8185', 'Yalnız test emülatörü kullanılabilir.');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-ulucamii', 'Yalnız demo projesi kullanılabilir.');
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9185';
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9185', 'Yalnız Auth emülatörü kullanılabilir.');

export const gerek = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp, getApps, getApp } = gerek('firebase-admin/app');
const firestore = gerek('firebase-admin/firestore');
const { getAuth } = gerek('firebase-admin/auth');
const app = getApps().length ? getApp() : initializeApp({ projectId: 'demo-ulucamii' });
export const db = firestore.getFirestore(app);
export const auth = getAuth(app);
export const { Timestamp, FieldValue } = firestore;

const PROJE = 'demo-ulucamii';
const AUTH = 'http://127.0.0.1:9185';
export const KOKEN = 'https://egitim.ulucamii.be';
export const ISLEV = (ad) => `http://127.0.0.1:5185/${PROJE}/europe-west1/${ad}`;
export const GUN = 86_400_000;
export const SIFRE = 'deneme-sifre-123';

/** Emülatördeki bütün Firestore belgeleri ve Auth kullanıcıları silinir (yalnız demo projesi). */
export async function temizle() {
  await fetch(`http://127.0.0.1:8185/emulator/v1/projects/${PROJE}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`${AUTH}/emulator/v1/projects/${PROJE}/accounts`, { method: 'DELETE' });
}

/** İşlev emülatörü tanımları yükleyene dek 404 döner: her işlev 404'ten çıkana kadar bekle. */
export async function hazir(adlar) {
  const son = Date.now() + 60_000;
  for (const ad of adlar) {
    for (;;) {
      const y = await fetch(ISLEV(ad), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"data":null}' }).catch(() => null);
      if (y && y.status !== 404) break;
      if (Date.now() > son) throw new Error(`${ad} işlevi yüklenmedi`);
      await uyu(250);
    }
  }
}

export const uyu = (ms) => new Promise((r) => setTimeout(r, ms));
export async function bekle(kosul, sure = 15_000) {
  const son = Date.now() + sure;
  for (;;) {
    const v = await kosul();
    if (v) return v;
    if (Date.now() > son) throw new Error('bekleme zaman aşımı');
    await uyu(200);
  }
}

/** Callable protokolü: { durum, sonuc, hata: {status, message, details} }. */
export async function cagir(ad, veri, idToken) {
  const y = await fetch(ISLEV(ad), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ data: veri ?? null }),
  });
  const j = await y.json().catch(() => ({}));
  return { durum: y.status, sonuc: j.result, hata: j.error };
}
/** Callable başarılıysa sonucu döner, değilse anlaşılır biçimde düşer. */
export async function basarili(ad, veri, idToken) {
  const c = await cagir(ad, veri, idToken);
  assert.equal(c.durum, 200, `${ad}: ${JSON.stringify(c.hata)}`);
  return c.sonuc;
}

async function kimlik(yol, govde) {
  const y = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${yol}?key=demo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...govde, returnSecureToken: true }),
  });
  const j = await y.json();
  assert.ok(j.idToken, `${yol}: ${JSON.stringify(j.error)}`);
  return j.idToken;
}
export const sifreyleGir = (email, sifre = SIFRE) => kimlik('signInWithPassword', { email, password: sifre });
export const ozelTokenleGir = (token) => kimlik('signInWithCustomToken', { token });
/** JWT gövdesi (imza denetimi yok; yalnız emülatör token'ı okunur). */
export const coz = (jwt) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));

/** E-posta + şifreli kullanıcı açar, ID token döner. */
export async function kullaniciAc(uid, { dogrulanmis = true } = {}) {
  const email = `${uid}@example.test`;
  await auth.createUser({ uid, email, password: SIFRE, emailVerified: dogrulanmis });
  return sifreyleGir(email);
}
/** Hoca: doğrulanmış e-posta + hocalar/{uid}. */
export async function hocaAc(uid = 'hoca-a') {
  await db.doc(`hocalar/${uid}`).set({ adSoyad: 'Deneme Hoca' });
  return kullaniciAc(uid);
}
/** Elle açılmış çocuk oturumu ({rol:'cocuk', ref}, e-posta yok). */
export async function cocukOturumu(uid = 'c_deneme0000000000000', ref = 'R1') {
  await auth.createUser({ uid });
  await auth.setCustomUserClaims(uid, { rol: 'cocuk', ref });
  return ozelTokenleGir(await auth.createCustomToken(uid, { rol: 'cocuk', ref }));
}

/** /api/cocuk-giris ve /api/kart-giris: { durum, govde }. */
export async function giris(ad, govde, { basliklar = {}, yontem = 'POST' } = {}) {
  const y = await fetch(ISLEV(ad), {
    method: yontem,
    headers: { 'Content-Type': 'application/json', Origin: KOKEN, ...basliklar },
    ...(yontem === 'GET' ? {} : { body: typeof govde === 'string' ? govde : JSON.stringify(govde) }),
  });
  return { durum: y.status, govde: await y.json().catch(() => null), basliklar: y.headers };
}
export const kartAyir = (url) => {
  const [kartId, sir] = new URL(url).hash.slice(1).split('.');
  return { kartId, sir };
};
