/**
 * Hoca hesabı iki adımlı doğrulama (TOTP) — mantık (src/lib/hoca-mfa.ts) ve beş dilli metinler (12 Kasım 2026).
 * Auth emülatörü (firebase-tools 15.33) TOTP'yi DESTEKLEMEZ (yalnız telefon/SMS faktörü; apiSpec'te TOTP alanları var, işleyici yok),
 * bu yüzden Firebase Auth modülünün küçük bir sahtesi verilir. Gerçek SDK davranışı canlı projede (Identity Platform + TOTP açılınca) sınanır.
 * Arayüz akışı (kod ekranı, kayıt, kapatma) tarayıcıda: tests/web/hoca-mfa.spec.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(girdi, ad) {
  const outfile = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ entryPoints: [girdi], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent' });
  return import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
}
const L = await yukle('src/lib/hoca-mfa.ts', 'hoca-mfa-lib-test');
const { MFA } = await yukle('src/i18n/hoca-metin/mfa.ts', 'hoca-mfa-metin-test');

/** Sahte Firebase Auth modülü: TOTP üretici + çoklu faktör kullanıcısı + çözümleyici. Dönen `olaylar` çağrıları kaydeder. */
function sahteAuth({ faktorler = [], dogruKod = '123456', ipuclari } = {}) {
  const olaylar = [];
  const kullanici = { email: 'hoca@example.test', enrolledFactors: faktorler };
  const m = {
    TotpMultiFactorGenerator: {
      FACTOR_ID: 'totp',
      assertionForSignIn: (uid, kod) => ({ tur: 'giris', uid, kod }),
      assertionForEnrollment: (gizli, kod) => ({ tur: 'kayit', gizli, kod }),
      generateSecret: async (oturum) => {
        olaylar.push(['generateSecret', oturum]);
        return { secretKey: 'JBSWY3DPEHPK3PXP', generateQrCodeUrl: (hesap, veren) => `otpauth://totp/${veren}:${hesap}?secret=JBSWY3DPEHPK3PXP&issuer=${veren}` };
      },
    },
    multiFactor: () => ({
      get enrolledFactors() { return kullanici.enrolledFactors; },
      getSession: async () => { olaylar.push(['getSession']); return { oturum: 'S1' }; },
      enroll: async (asr, ad) => {
        olaylar.push(['enroll', asr, ad]);
        if (asr.kod !== dogruKod) throw Object.assign(new Error('x'), { code: 'auth/invalid-verification-code' });
        kullanici.enrolledFactors = [...kullanici.enrolledFactors, { uid: 'F-YENI', factorId: 'totp', displayName: ad }];
      },
      unenroll: async (uid) => { olaylar.push(['unenroll', uid]); kullanici.enrolledFactors = kullanici.enrolledFactors.filter((f) => f.uid !== uid); },
    }),
    getMultiFactorResolver: (a, hata) => {
      olaylar.push(['resolver', a, hata.code]);
      return {
        hints: ipuclari ?? kullanici.enrolledFactors,
        session: {},
        resolveSignIn: async (asr) => {
          olaylar.push(['resolveSignIn', asr]);
          if (asr.kod !== dogruKod) throw Object.assign(new Error('x'), { code: 'auth/invalid-verification-code' });
          return { user: { uid: 'U1' } };
        },
      };
    },
  };
  return { m, kullanici, olaylar };
}
const GIRIS_HATASI = Object.assign(new Error('mfa'), { code: 'auth/multi-factor-auth-required' });
const TOTP_FAKTORU = { uid: 'F1', factorId: 'totp', displayName: 'Authenticator' };

test('mfaGerekli yalnız multi-factor-auth-required hatasını tanır', () => {
  assert.equal(L.mfaGerekli(GIRIS_HATASI), true);
  assert.equal(L.mfaGerekli({ code: 'auth/wrong-password' }), false);
  assert.equal(L.mfaGerekli(null), false);
  assert.equal(L.mfaGerekli(undefined), false);
});

test('hata kodları ileti türlerine çevrilir; bilinmeyen «genel»', () => {
  const tur = (code) => L.mfaHataTuru({ code });
  assert.equal(tur('auth/invalid-verification-code'), 'kod');
  assert.equal(tur('auth/code-expired'), 'kod');
  assert.equal(tur('auth/requires-recent-login'), 'yenidenGiris');
  assert.equal(tur('auth/unverified-email'), 'eposta');
  assert.equal(tur('auth/operation-not-allowed'), 'kapali'); // TOTP proje düzeyinde açılmadı → «henüz açılmadı»
  assert.equal(tur('auth/admin-restricted-operation'), 'kapali');
  assert.equal(tur('auth/user-token-expired'), 'oturum');
  assert.equal(tur('auth/invalid-multi-factor-session'), 'sure'); // ikinci adım oturumu doldu → girişe dön
  assert.equal(tur('auth/missing-multi-factor-session'), 'sure');
  assert.equal(tur('auth/too-many-requests'), 'yogun');
  assert.equal(tur('auth/network-request-failed'), 'ag');
  assert.equal(tur('auth/baska'), 'genel');
  assert.equal(L.mfaHataTuru(new Error('x')), 'genel');
});

test('kodTemizle ve desen: «123 456» ve «123-456» kabul, harf/5 hane red', () => {
  assert.equal(L.kodTemizle(' 123 456 '), '123456');
  assert.equal(L.kodTemizle('123-456'), '123456');
  assert.ok(L.KOD_DESENI.test('123456'));
  assert.ok(!L.KOD_DESENI.test('12345'));
  assert.ok(!L.KOD_DESENI.test('12345a'));
  assert.ok(!L.KOD_DESENI.test('1234567'));
});

test('faktörsüz hesap: kayitliFaktorler boş (giriş eskisi gibi; çözümleyici hiç kurulmaz)', () => {
  const { m, olaylar } = sahteAuth();
  assert.deepEqual(L.kayitliFaktorler(m, {}), []);
  assert.deepEqual(olaylar, []);
});

test('giriş sınaması: doğru kodla tamamlanır (kod boşluktan arındırılır, faktör uid\'i kullanılır)', async () => {
  const { m, olaylar } = sahteAuth({ faktorler: [TOTP_FAKTORU] });
  const c = L.girisCozumleyici(m, { auth: 1 }, GIRIS_HATASI);
  assert.equal(c.ad, 'Authenticator');
  const sonuc = await c.coz('123 456');
  assert.equal(sonuc.user.uid, 'U1');
  assert.deepEqual(olaylar.find((o) => o[0] === 'resolveSignIn')[1], { tur: 'giris', uid: 'F1', kod: '123456' });
});

test('giriş sınaması: yanlış kod fırlatır ve «kod» türündedir', async () => {
  const { m } = sahteAuth({ faktorler: [TOTP_FAKTORU] });
  const c = L.girisCozumleyici(m, {}, GIRIS_HATASI);
  await assert.rejects(() => c.coz('000000'), (e) => L.mfaHataTuru(e) === 'kod');
});

test('giriş sınaması: TOTP olmayan ikinci adımda null (arayüz «desteklenmiyor» der)', () => {
  const { m } = sahteAuth({ ipuclari: [{ uid: 'P1', factorId: 'phone', displayName: 'tel' }] });
  assert.equal(L.girisCozumleyici(m, {}, GIRIS_HATASI), null);
});

test('kayıt: getSession → generateSecret, otpauth bağlantısı e-posta ve veren adını taşır, doğru kodla faktör eklenir', async () => {
  const { m, olaylar, kullanici } = sahteAuth();
  const user = { email: 'hoca@example.test' };
  const t = await L.kayitBaslat(m, user);
  assert.deepEqual(olaylar.map((o) => o[0]), ['getSession', 'generateSecret']);
  assert.equal(olaylar[1][1].oturum, 'S1'); // gizli anahtar çoklu faktör oturumuyla üretilir
  assert.equal(t.anahtar, 'JBSWY3DPEHPK3PXP');
  assert.match(t.uri, /^otpauth:\/\/totp\/Ulu Camii:hoca@example\.test\?/);
  await t.bitir('123 456');
  const kayit = olaylar.find((o) => o[0] === 'enroll');
  assert.equal(kayit[1].kod, '123456');
  assert.equal(kayit[2], L.MFA_ADI);
  assert.deepEqual(L.kayitliFaktorler(m, user).map((f) => f.ad), [L.MFA_ADI]);
  assert.equal(kullanici.enrolledFactors.length, 1);
});

test('kayıt: yanlış kod faktör eklemez ve «kod» hatası verir', async () => {
  const { m, kullanici } = sahteAuth();
  const t = await L.kayitBaslat(m, { email: 'hoca@example.test' });
  await assert.rejects(() => t.bitir('654321'), (e) => L.mfaHataTuru(e) === 'kod');
  assert.equal(kullanici.enrolledFactors.length, 0);
});

test('kayıt: TOTP proje düzeyinde kapalıysa başlatma «kapali» hatası verir (arayüz «henüz açılmadı» der)', async () => {
  const { m } = sahteAuth();
  m.TotpMultiFactorGenerator.generateSecret = async () => { throw Object.assign(new Error('x'), { code: 'auth/operation-not-allowed' }); };
  await assert.rejects(() => L.kayitBaslat(m, { email: 'hoca@example.test' }), (e) => L.mfaHataTuru(e) === 'kapali');
});

test('kaldırma: faktör uid\'iyle unenroll çağrılır, hesap faktörsüz kalır', async () => {
  const { m, olaylar, kullanici } = sahteAuth({ faktorler: [TOTP_FAKTORU] });
  await L.faktorKaldir(m, {}, 'F1');
  assert.deepEqual(olaylar.find((o) => o[0] === 'unenroll'), ['unenroll', 'F1']);
  assert.deepEqual(kullanici.enrolledFactors, []);
});

test('metinler: mfa sözlüğü beş dilde aynı anahtarlar, boş değer yok, yer tutucular aynı', () => {
  const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
  const anahtarlar = Object.keys(MFA.tr).sort();
  assert.ok(anahtarlar.length >= 30);
  const yer = (s) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]))].sort().join();
  for (const d of DILLER) {
    assert.deepEqual(Object.keys(MFA[d]).sort(), anahtarlar, `${d}: anahtarlar`);
    for (const k of anahtarlar) {
      assert.ok(typeof MFA[d][k] === 'string' && MFA[d][k].trim(), `${d}: ${k} boş`);
      assert.equal(yer(MFA[d][k]), yer(MFA.tr[k]), `${d}: ${k} yer tutucular`);
    }
  }
  assert.match(MFA.fr['mfa.baslik'], /deux étapes/);
});
