/**
 * İlim Yolu fonksiyonlarının ortak parçaları (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md): Admin SDK, izinli kökenler, yetki
 * denetimleri, rastgele dizeler. Admin SDK kuralları aşar; bu yüzden her callable yetkiyi burada kendisi denetler.
 */
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { createHash, randomBytes, randomInt } from 'node:crypto';

// Bütün işlevler: europe-west1, en çok 2 örnek (bütçe uyarısı harcamayı durdurmaz; tavan budur). Burada, çünkü firebase-functions
// seçenekleri işlev TANIMLANIRKEN okur ve bu dosya her işlev modülünden önce yüklenir (index.ts'in gövdesi ise en son çalışır).
setGlobalOptions({ region: 'europe-west1', maxInstances: 2 });

// Testler aynı paketi kendi sürecinde de yükler (zamanlanmış işlevleri doğrudan çalıştırmak için): varsayılan uygulama varsa o kullanılır.
const app = getApps().length ? getApp() : initializeApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export { FieldValue, Timestamp };

export const DAKIKA = 60_000;
export const SAAT = 60 * DAKIKA;
export const GUN = 24 * SAAT;

/** Callable CORS ve giriş uçlarının Origin denetimi: iki site + yerel geliştirme. */
export const KOKENLER: (string | RegExp)[] = [
  'https://ulucamii.be', 'https://egitim.ulucamii.be', /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/,
];
export const kokenIzinli = (koken: unknown): boolean =>
  typeof koken === 'string' && KOKENLER.some((k) => (typeof k === 'string' ? k === koken : k.test(koken)));
/** Bütün callable'ların seçenekleri (bölge ve maxInstances: 2 setGlobalOptions'tan gelir). */
export const CAGRI = { cors: KOKENLER };

export const DILLER = ['tr', 'fr', 'en', 'nl', 'de'] as const;
export type Dil = (typeof DILLER)[number];
export const dilMi = (d: unknown): d is Dil => typeof d === 'string' && (DILLER as readonly string[]).includes(d);

const REF = /^[A-Za-z0-9_-]{1,64}$/;
/** Öğrenci referansı (ör. UC-2026-0022): belge kimliği olarak güvenli biçim. */
export function refAl(veri: unknown): string {
  const ref = (veri as { ref?: unknown } | null)?.ref;
  if (typeof ref !== 'string' || !REF.test(ref)) throw new HttpsError('invalid-argument', 'gecersiz-istek', { neden: 'ref' });
  return ref;
}

type Kimlik = { uid: string; token: Record<string, unknown> };
function oturum(istek: CallableRequest): Kimlik {
  if (!istek.auth) throw new HttpsError('unauthenticated', 'oturum-yok');
  return { uid: istek.auth.uid, token: istek.auth.token as unknown as Record<string, unknown> };
}
export const cocukMu = (k: Kimlik) => k.token.rol === 'cocuk' || k.uid.startsWith('c_');

/** Giriş yapmış, çocuk olmayan her kullanıcı (kullanıcı adı, hesap silme). */
export function yetiskinGerekli(istek: CallableRequest): Kimlik {
  const k = oturum(istek);
  if (cocukMu(k)) throw new HttpsError('permission-denied', 'yetki-yok');
  return k;
}

/** E-postası doğrulanmış, çocuk olmayan kullanıcı (bağlama kodu). */
export function dogrulanmisGerekli(istek: CallableRequest): Kimlik {
  const k = yetiskinGerekli(istek);
  if (typeof k.token.email !== 'string' || k.token.email_verified !== true) throw new HttpsError('permission-denied', 'eposta-dogrulanmamis');
  return k;
}

/** Hoca: e-postası doğrulanmış oturum + hocalar/{uid} belgesi. Döner: hocanın uid'si. */
export async function hocaGerekli(istek: CallableRequest): Promise<string> {
  const k = oturum(istek);
  if (typeof k.token.email !== 'string' || k.token.email_verified !== true) throw new HttpsError('permission-denied', 'yetki-yok');
  if (!(await db.doc(`hocalar/${k.uid}`).get()).exists) throw new HttpsError('permission-denied', 'yetki-yok');
  return k.uid;
}

export const sha256 = (metin: string) => createHash('sha256').update(metin).digest('hex');
export const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
/** Crockford base32 (I, L, O, U yok). */
export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function rastgeleDize(alfabe: string, uzunluk: number): string {
  let s = '';
  for (let i = 0; i < uzunluk; i++) s += alfabe[randomInt(alfabe.length)];
  return s;
}
export const rastgeleB64 = (bayt: number) => randomBytes(bayt).toString('base64url');
export const iso = (t: unknown): string | undefined => (t instanceof Timestamp ? t.toDate().toISOString() : undefined);
/** firebase-admin Auth hatasında «kullanıcı yok» mu. */
export const kullaniciYok = (e: unknown) => (e as { code?: string })?.code === 'auth/user-not-found';
