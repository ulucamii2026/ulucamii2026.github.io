/**
 * Hoca hesabı iki adımlı doğrulama (TOTP) — saf mantık (12 Kasım 2026). Arayüz: src/scripts/hoca-mfa.ts; belge: docs/HOCA-IKINCI-DOGRULAMA.md.
 *
 * Firebase Auth modülü (`import * as auth from 'firebase/auth'` ya da sınamada sahtesi) DIŞARIDAN verilir: bu dosya firebase'i içe aktarmaz,
 * böylece hoca ekranının mevcut tembel yüklemesi bozulmaz ve Auth emülatörü TOTP'yi desteklemediği için (firebase-tools 15.33)
 * sınama sahte modülle yapılır. API: https://firebase.google.com/docs/auth/web/totp-mfa (getMultiFactorResolver, assertionForSignIn,
 * multiFactor(user).getSession, TotpMultiFactorGenerator.generateSecret / assertionForEnrollment, multiFactor(user).enroll / unenroll).
 *
 * Gizlilik: gizli anahtar ve kodlar günlüğe yazılmaz, Firestore'a ve localStorage'a konmaz; yalnız bellekte tutulur.
 */
import type * as FirebaseAuth from 'firebase/auth';

/** Kullanılan Auth yüzeyi (yalnız bu dört dışa aktarım). */
export type AuthModulu = Pick<typeof FirebaseAuth, 'multiFactor' | 'getMultiFactorResolver' | 'TotpMultiFactorGenerator'>;
type Auth = FirebaseAuth.Auth;
type Kullanici = FirebaseAuth.User;

/** Hesapta görünen faktör adı (Firebase'e yazılır; arayüz dilinden bağımsız). */
export const MFA_ADI = 'Authenticator';
/** Doğrulayıcı uygulamada görünen sağlayıcı adı. */
export const MFA_VEREN = 'Ulu Camii';

export const KOD_DESENI = /^\d{6}$/;

/** Girişte `auth/multi-factor-auth-required` hatası mı? */
export const mfaGerekli = (e: unknown): boolean => (e as { code?: string } | null)?.code === 'auth/multi-factor-auth-required';

/** Kullanıcıya yazılan kodu temizler: boşluk/tire düşer (uygulamalar «123 456» gösterir). */
export const kodTemizle = (s: string): string => s.replace(/[\s-]/g, '');

export type MfaHataTuru = 'kod' | 'yenidenGiris' | 'eposta' | 'kapali' | 'oturum' | 'yogun' | 'ag' | 'genel';

/** Firebase hata kodunu arayüz iletisi türüne çevirir. */
export function mfaHataTuru(e: unknown): MfaHataTuru {
  const kod = (e as { code?: string } | null)?.code || '';
  switch (kod) {
    case 'auth/invalid-verification-code': case 'auth/code-expired': case 'auth/invalid-credential': return 'kod';
    case 'auth/requires-recent-login': return 'yenidenGiris';
    case 'auth/unverified-email': return 'eposta';
    case 'auth/operation-not-allowed': case 'auth/admin-restricted-operation': case 'auth/unsupported-tenant-operation': return 'kapali';
    case 'auth/user-token-expired': case 'auth/user-disabled': case 'auth/invalid-user-token': return 'oturum';
    case 'auth/too-many-requests': return 'yogun';
    case 'auth/network-request-failed': return 'ag';
    default: return 'genel';
  }
}

export type GirisCozumleyici = {
  /** Faktör adı (hesapta kayıtlı görünen ad). */
  ad: string;
  /** 6 haneli kodla girişi tamamlar; yanlış/süresi dolmuş kodda fırlatır (hata: mfaHataTuru). */
  coz: (kod: string) => Promise<{ user: Kullanici }>;
};

/**
 * `auth/multi-factor-auth-required` hatasından TOTP çözümleyicisi kurar. Hesapta TOTP olmayan bir ikinci adım varsa (bu sitede
 * yalnız TOTP kaydedilir) `null` döner.
 */
export function girisCozumleyici(m: AuthModulu, a: Auth, hata: unknown): GirisCozumleyici | null {
  const r = m.getMultiFactorResolver(a, hata as FirebaseAuth.MultiFactorError);
  const ipucu = r.hints.find((h) => h.factorId === m.TotpMultiFactorGenerator.FACTOR_ID);
  if (!ipucu) return null;
  return {
    ad: ipucu.displayName || MFA_ADI,
    coz: (kod) => r.resolveSignIn(m.TotpMultiFactorGenerator.assertionForSignIn(ipucu.uid, kodTemizle(kod))),
  };
}

export type KayitliFaktor = { uid: string; ad: string };

/** Hesapta kayıtlı TOTP faktörleri. */
export function kayitliFaktorler(m: AuthModulu, user: Kullanici): KayitliFaktor[] {
  return m.multiFactor(user).enrolledFactors
    .filter((f) => f.factorId === m.TotpMultiFactorGenerator.FACTOR_ID)
    .map((f) => ({ uid: f.uid, ad: f.displayName || MFA_ADI }));
}

export type KayitTaslagi = {
  /** Elle girilecek gizli anahtar (yalnız ekranda gösterilir). */
  anahtar: string;
  /** otpauth:// bağlantısı (kare kod bunu kodlar; yerelde çizilir, hiçbir yere gönderilmez). */
  uri: string;
  /** Kodla kaydı tamamlar. */
  bitir: (kod: string) => Promise<void>;
};

/** Yeni TOTP kaydını başlatır: gizli anahtar üretir (SDK: getSession → generateSecret). */
export async function kayitBaslat(m: AuthModulu, user: Kullanici): Promise<KayitTaslagi> {
  const oturum = await m.multiFactor(user).getSession();
  const gizli = await m.TotpMultiFactorGenerator.generateSecret(oturum);
  return {
    anahtar: gizli.secretKey,
    uri: gizli.generateQrCodeUrl(user.email || '', MFA_VEREN),
    bitir: (kod) => m.multiFactor(user).enroll(m.TotpMultiFactorGenerator.assertionForEnrollment(gizli, kodTemizle(kod)), MFA_ADI),
  };
}

/** Kayıtlı faktörü kaldırır (SDK: multiFactor(user).unenroll). */
export const faktorKaldir = (m: AuthModulu, user: Kullanici, uid: string): Promise<void> => m.multiFactor(user).unenroll(uid);
