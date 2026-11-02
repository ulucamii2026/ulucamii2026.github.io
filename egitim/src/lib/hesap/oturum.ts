/**
 * İlim Yolu oturumu (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Hesaplar», «Kayıt akışı»): e-posta + şifre ile kayıt ve giriş
 * (kayıttan sonra doğrulama e-postası), Google (açılır pencere; engellenirse yönlendirme), çıkış, şifre sıfırlama, şimdiki
 * kullanıcı ve yetkileri (`rol`, `ref`). Çocuk ve kart girişi: kart-giris.ts.
 *
 * Oturum işareti (isaret.ts) her girişte konur, açık çıkışta kalkar: anonim sayfalar Firebase'i yalnız işaret varken yükler.
 * Açık çıkışta kullanıcının cihaz kopyası da silinir (önce son bir eşitleme denenir; olmazsa sayfaya sorulur). Oturum kendiliğinden
 * düşerse (hoca oturumu kapattı, tarayıcı verisi silindi) yalnız işaret kalkar; kopya kalır ve aynı kişi yeniden girince
 * gönderilmemiş çalışması kaybolmaz.
 *
 * Hatalar sayfaya kod olarak döner (`AuthNedeni`); metin sayfanın dilindedir. Hiçbir şey konsola, e-posta ya da şifre depoya yazılmaz.
 */
import type { User } from 'firebase/auth';
import { kullaniciAnahtari, type Depo } from '@ortak/lib/ezber/cihaz';
import type { IlimFirebase } from '../firebase-istemci';
import { esitle } from './esitle';
import { isaretKaldir, isaretKoy, oturumOzeti, tarayiciDeposu, uidOzeti } from './isaret';

export interface Kullanici {
  readonly uid: string;
  readonly eposta: string | null;
  readonly dogrulanmis: boolean;
  /** Sunucunun verdiği yetki: çocuk hesabında `cocuk`, yoksa boş. */
  readonly rol: 'cocuk' | '';
  /** Kurs kaydı (çocuk hesabı ya da bağlı yetişkin); yoksa boş. */
  readonly ref: string;
  /** `password`, `google.com` …; çocuk hesabında boş. */
  readonly saglayicilar: readonly string[];
}

export type AuthNedeni =
  | 'eposta-kullanimda' | 'eposta-gecersiz' | 'sifre-zayif' | 'giris-yanlis' | 'cok-deneme' | 'ag' | 'iptal' | 'hesap-kapali'
  | 'baska-yontem' | 'yeniden-giris' | 'oturum-yok' | 'bilinmeyen';
export type Basarisiz = { readonly ok: false; readonly neden: AuthNedeni };
export type GirisSonucu = { readonly ok: true; readonly kullanici: Kullanici } | Basarisiz;

const AUTH_NEDENLERI: Readonly<Record<string, AuthNedeni>> = {
  'auth/email-already-in-use': 'eposta-kullanimda',
  'auth/invalid-email': 'eposta-gecersiz', 'auth/missing-email': 'eposta-gecersiz',
  'auth/weak-password': 'sifre-zayif', 'auth/missing-password': 'sifre-zayif', 'auth/password-does-not-meet-requirements': 'sifre-zayif',
  'auth/invalid-credential': 'giris-yanlis', 'auth/wrong-password': 'giris-yanlis', 'auth/user-not-found': 'giris-yanlis',
  'auth/invalid-login-credentials': 'giris-yanlis',
  'auth/too-many-requests': 'cok-deneme', 'auth/quota-exceeded': 'cok-deneme',
  'auth/network-request-failed': 'ag', 'auth/timeout': 'ag',
  'auth/popup-closed-by-user': 'iptal', 'auth/cancelled-popup-request': 'iptal', 'auth/user-cancelled': 'iptal',
  'auth/user-disabled': 'hesap-kapali',
  'auth/account-exists-with-different-credential': 'baska-yontem',
  'auth/requires-recent-login': 'yeniden-giris',
};
/** Firebase Auth hatası → sayfanın çevireceği kod. */
export function authNedeni(e: unknown): AuthNedeni {
  return AUTH_NEDENLERI[String((e as { code?: unknown } | null)?.code ?? '')] ?? 'bilinmeyen';
}
const basarisiz = (e: unknown): Basarisiz => ({ ok: false, neden: authNedeni(e) });
const depoAl = (o?: { depo?: Depo | null }) => (o?.depo === undefined ? tarayiciDeposu() : o.depo);

/** Kullanıcı + token yetkileri. Token tazelenemezse (çevrim dışı) yetkiler boş döner; `c_` önekli uid yine çocuk sayılır. */
export async function kullaniciBilgisi(u: User, tazele = false): Promise<Kullanici> {
  let claims: Record<string, unknown> = {};
  try { claims = (await u.getIdTokenResult(tazele)).claims; } catch { /* çevrim dışı */ }
  return {
    uid: u.uid,
    eposta: u.email,
    dogrulanmis: u.emailVerified,
    rol: claims.rol === 'cocuk' || u.uid.startsWith('c_') ? 'cocuk' : '',
    ref: typeof claims.ref === 'string' ? claims.ref : '',
    saglayicilar: u.providerData.map((p) => p.providerId),
  };
}

/** Oturum işaretini Auth durumuna uydurur (bkz. başlık: kendiliğinden düşen oturumda cihaz kopyası kalır). */
export async function isaretiEsle(depo: Depo | null | undefined, u: Pick<User, 'uid'> | null): Promise<void> {
  if (u) isaretKoy(depo, await uidOzeti(u.uid));
  else if (oturumOzeti(depo)) isaretKaldir(depo);
}

/** Sayfa açılışı: saklı oturum yüklenene kadar bekler, işareti uydurur. Oturum yoksa `null`. */
export async function oturumHazir(f: IlimFirebase, o?: { depo?: Depo | null }): Promise<Kullanici | null> {
  await f.auth.authStateReady();
  const u = f.auth.currentUser;
  await isaretiEsle(depoAl(o), u);
  return u ? kullaniciBilgisi(u) : null;
}

/** Oturum değişikliklerini izler (giriş, çıkış, başka sekmede çıkış). Durdurmak için dönen işlevi çağırın. */
export function oturumIzle(f: IlimFirebase, cb: (k: Kullanici | null) => void, o?: { depo?: Depo | null }): () => void {
  const depo = depoAl(o);
  return f.a.onAuthStateChanged(f.auth, (u) => {
    void isaretiEsle(depo, u).then(() => (u ? kullaniciBilgisi(u) : null)).then(cb);
  });
}

async function girdi(u: User, depo: Depo | null | undefined): Promise<GirisSonucu> {
  await isaretiEsle(depo, u);
  return { ok: true, kullanici: await kullaniciBilgisi(u) };
}

/**
 * E-posta + şifreyle kayıt; ardından doğrulama e-postası (sayfanın dilinde). Doğrulama e-postası gitmezse kayıt yine geçerlidir:
 * `dogrulamaGitti: false` döner, sayfa «yeniden gönder» sunar (`dogrulamaGonder`).
 */
export async function kayitOl(
  f: IlimFirebase,
  o: { eposta: string; sifre: string; dil: string; donus?: string; depo?: Depo | null },
): Promise<(GirisSonucu & { readonly dogrulamaGitti?: boolean }) | Basarisiz> {
  f.auth.languageCode = o.dil;
  try {
    const k = await f.a.createUserWithEmailAndPassword(f.auth, o.eposta.trim(), o.sifre);
    let dogrulamaGitti = true;
    try { await f.a.sendEmailVerification(k.user, o.donus ? { url: o.donus } : null); } catch { dogrulamaGitti = false; }
    return { ...(await girdi(k.user, depoAl(o))), dogrulamaGitti };
  } catch (e) {
    return basarisiz(e);
  }
}

export async function girisYap(f: IlimFirebase, o: { eposta: string; sifre: string; depo?: Depo | null }): Promise<GirisSonucu> {
  try {
    return await girdi((await f.a.signInWithEmailAndPassword(f.auth, o.eposta.trim(), o.sifre)).user, depoAl(o));
  } catch (e) {
    return basarisiz(e);
  }
}

/**
 * Google ile giriş/kayıt. Açılır pencere engellenirse (ya da ortam desteklemezse) yönlendirmeye geçer: `{ ok: true, yonlendirme:
 * true }` döner ve sayfa ayrılır; dönüşte `yonlendirmeSonucu` çağrılır.
 */
export async function googleIleGir(
  f: IlimFirebase,
  o: { dil: string; depo?: Depo | null },
): Promise<GirisSonucu | { readonly ok: true; readonly yonlendirme: true }> {
  f.auth.languageCode = o.dil;
  const saglayici = new f.a.GoogleAuthProvider();
  saglayici.setCustomParameters({ prompt: 'select_account' });
  try {
    return await girdi((await f.a.signInWithPopup(f.auth, saglayici)).user, depoAl(o));
  } catch (e) {
    const kod = (e as { code?: unknown } | null)?.code;
    if (kod !== 'auth/popup-blocked' && kod !== 'auth/operation-not-supported-in-this-environment') return basarisiz(e);
    try {
      await f.a.signInWithRedirect(f.auth, saglayici);
      return { ok: true, yonlendirme: true };
    } catch (e2) {
      return basarisiz(e2);
    }
  }
}

/** Google yönlendirmesinden dönüşte (hesap sayfası açılışı). Yönlendirme yoksa `null`. */
export async function yonlendirmeSonucu(f: IlimFirebase, o?: { depo?: Depo | null }): Promise<GirisSonucu | null> {
  try {
    const k = await f.a.getRedirectResult(f.auth);
    return k ? girdi(k.user, depoAl(o)) : null;
  } catch (e) {
    return basarisiz(e);
  }
}

/**
 * Açık çıkış: önce son bir eşitleme denenir. Olmazsa (çevrim dışı, hata) `{ ok: false, neden: 'esitlenmedi' }` döner ve sayfa
 * «Bu cihazdaki gönderilmemiş çalışma silinecek, yine de çıkılsın mı?» diye sorar; evet derse `zorla: true` ile yeniden çağırır.
 * Sonra kullanıcının cihaz kopyası ve oturum işareti silinir, oturum kapanır. Anonim kayda dokunulmaz.
 */
export async function cikisYap(
  f: IlimFirebase,
  o: { depo?: Depo | null; zorla?: boolean; cevrimici?: () => boolean } = {},
): Promise<{ readonly ok: true } | { readonly ok: false; readonly neden: 'esitlenmedi' }> {
  const depo = depoAl(o);
  const u = f.auth.currentUser;
  if (u) {
    if (!o.zorla) {
      const s = await esitle(f, { depo, cevrimici: o.cevrimici });
      if (s.durum !== 'tamam') return { ok: false, neden: 'esitlenmedi' };
    }
    const anahtar = kullaniciAnahtari(await uidOzeti(u.uid));
    try { depo?.removeItem?.(anahtar); } catch { /* depo kapalı */ }
  }
  isaretKaldir(depo);
  await f.a.signOut(f.auth);
  return { ok: true };
}

/** Şifre sıfırlama e-postası (sayfanın dilinde). Adresin kayıtlı olup olmadığı söylenmez (Firebase e-posta numaralandırma koruması). */
export async function sifreSifirla(f: IlimFirebase, o: { eposta: string; dil: string; donus?: string }): Promise<{ readonly ok: true } | Basarisiz> {
  f.auth.languageCode = o.dil;
  try {
    await f.a.sendPasswordResetEmail(f.auth, o.eposta.trim(), o.donus ? { url: o.donus } : undefined);
    return { ok: true };
  } catch (e) {
    return basarisiz(e);
  }
}

/** Doğrulama e-postasını yeniden gönderir (doğrulanmamış e-posta + şifre hesabı). */
export async function dogrulamaGonder(f: IlimFirebase, o: { dil: string; donus?: string }): Promise<{ readonly ok: true } | Basarisiz> {
  const u = f.auth.currentUser;
  if (!u) return { ok: false, neden: 'oturum-yok' };
  f.auth.languageCode = o.dil;
  try {
    await f.a.sendEmailVerification(u, o.donus ? { url: o.donus } : null);
    return { ok: true };
  } catch (e) {
    return basarisiz(e);
  }
}
