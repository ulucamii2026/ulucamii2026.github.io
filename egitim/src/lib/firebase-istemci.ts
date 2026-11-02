/**
 * İlim Yolu Firebase istemcisi — egitim.ulucamii.be (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Ortak kararlar» 2).
 *
 * Proje ana siteyle aynıdır (`ulucamii-portal`, src/lib/firebase.ts); yalnız `authDomain` egitim'dir (Google girişinin
 * `/__/auth/handler`'ı bu alan adında, aynı köken) ve uygulama adı `ilim`'dir (ana sitenin varsayılan uygulamasıyla karışmaz).
 * Firestore yalnız LITE SDK'dır (REST; yerel önbellek yok): çevrim dışında cihazdaki kopya (cihaz.ts) esas kalır.
 *
 * BU DOSYA FIREBASE'İ STATİK İÇE AKTARMAZ (yalnız `import type`): anonim sayfa bunu içe aktarsa bile SDK inmez. SDK ancak
 * `firebaseYukle()` çağrılınca, `firebase/functions` ise ilk callable çağrısında iner. Anonim sayfalar `gerekirseYukle()` ile
 * yükler: oturum işareti (hesap/isaret.ts) yoksa Firebase hiç yüklenmez. Hesap sayfaları doğrudan `firebaseYukle()` çağırır.
 *
 * Emülatör (Auth 9185, Firestore 8185, Functions 5185, proje demo-ulucamii) YALNIZ adres localhost/127.0.0.1 iken VE açık bayrak
 * (`localStorage['ilimYolu:emulator'] = '1'`) varken; canlıda bayrak yanlışlıkla kalsa bile hiçbir şey değişmez.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore/lite';
import type { Depo } from '@ortak/lib/ezber/cihaz';
import { oturumVar, tarayiciDeposu } from './hesap/isaret';

export type AuthModulu = typeof import('firebase/auth');
export type FirestoreModulu = typeof import('firebase/firestore/lite');
/** Giriş uçları (Hosting rewrite → cocukGiris / kartGiris). */
export type GirisUcu = 'cocuk-giris' | 'kart-giris';

export interface IlimFirebase {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly db: Firestore;
  /** `firebase/auth` modülü (işlevler buradan çağrılır; testler sahtesini verir). */
  readonly a: AuthModulu;
  /** `firebase/firestore/lite` modülü. */
  readonly fs: FirestoreModulu;
  /** Callable çağrısı (europe-west1); `firebase/functions` ilk çağrıda yüklenir, kimlik belirteci kendiliğinden eklenir. */
  cagir<T>(ad: string, veri?: Record<string, unknown>): Promise<T>;
  /** Giriş ucunun adresi: canlıda `/api/<uç>` (aynı köken), emülatörde işlevin emülatör adresi. */
  api(uc: GirisUcu): string;
}

export const UYGULAMA_ADI = 'ilim';
export const BOLGE = 'europe-west1';
export const AUTH_ALANI = 'egitim.ulucamii.be';
export const EMULATOR_BAYRAGI = 'ilimYolu:emulator';
export const EMULATOR = Object.freeze({ proje: 'demo-ulucamii', host: '127.0.0.1', auth: 9185, firestore: 8185, functions: 5185 });
const ISLEV_ADI: Readonly<Record<GirisUcu, string>> = { 'cocuk-giris': 'cocukGiris', 'kart-giris': 'kartGiris' };

/** Emülatöre bağlanılsın mı: yalnız yerel adres VE açık bayrak. */
export function emulatorMu(hostname: string, depo: Depo | null | undefined): boolean {
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return false;
  try {
    return depo?.getItem(EMULATOR_BAYRAGI) === '1';
  } catch {
    return false;
  }
}

/** Ana sitenin yapılandırması + egitim alan adı; emülatörde proje demo-ulucamii (emülatör tek projeli çalışır). */
export function yapilandirma<T extends { authDomain: string; projectId: string }>(temel: T, emulator: boolean): T {
  return { ...temel, authDomain: AUTH_ALANI, ...(emulator ? { projectId: EMULATOR.proje } : {}) };
}

export function apiAdresi(uc: GirisUcu, emulator: boolean): string {
  return emulator ? `http://${EMULATOR.host}:${EMULATOR.functions}/${EMULATOR.proje}/${BOLGE}/${ISLEV_ADI[uc]}` : `/api/${uc}`;
}

let soz: Promise<IlimFirebase> | null = null;

/** Firebase'i (bir kez) yükler. Başarısız olursa bir sonraki çağrı yeniden dener. */
export function firebaseYukle(): Promise<IlimFirebase> {
  soz ||= kur().catch((e: unknown) => {
    soz = null;
    throw e;
  });
  return soz;
}

/** Anonim sayfalar için: oturum işareti varsa Firebase'i yükler, yoksa hiçbir şey indirmeden `null`. */
export function gerekirseYukle(depo: Depo | null | undefined = tarayiciDeposu()): Promise<IlimFirebase | null> {
  return oturumVar(depo) ? firebaseYukle() : Promise.resolve(null);
}

async function kur(): Promise<IlimFirebase> {
  const [{ FIREBASE_YAPILANDIRMA }, appM, a, fs] = await Promise.all([
    import('@ortak/lib/firebase'), import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite'),
  ]);
  const emulator = emulatorMu(location.hostname, tarayiciDeposu());
  const mevcut = appM.getApps().find((x) => x.name === UYGULAMA_ADI);
  const app = mevcut ?? appM.initializeApp(yapilandirma(FIREBASE_YAPILANDIRMA, emulator), UYGULAMA_ADI);
  const auth = a.getAuth(app);
  const db = fs.getFirestore(app);
  // Emülatör bağlantısı yalnız uygulama burada ilk kez kurulunca (ikinci bağlantı SDK'da hatadır).
  if (emulator && !mevcut) {
    a.connectAuthEmulator(auth, `http://${EMULATOR.host}:${EMULATOR.auth}`, { disableWarnings: true });
    fs.connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);
  }

  type Cagirici = <T>(ad: string, veri?: Record<string, unknown>) => Promise<T>;
  let cagiriciSozu: Promise<Cagirici> | null = null;
  const cagirici = () => {
    cagiriciSozu ||= import('firebase/functions').then((f) => {
      const fns = f.getFunctions(app, BOLGE);
      if (emulator) f.connectFunctionsEmulator(fns, EMULATOR.host, EMULATOR.functions);
      return async <T,>(ad: string, veri?: Record<string, unknown>) => (await f.httpsCallable<Record<string, unknown> | undefined, T>(fns, ad)(veri)).data;
    }).catch((e: unknown) => {
      cagiriciSozu = null;
      throw e;
    });
    return cagiriciSozu;
  };

  return {
    app, auth, db, a, fs,
    cagir: async <T,>(ad: string, veri?: Record<string, unknown>) => (await cagirici())<T>(ad, veri),
    api: (uc) => apiAdresi(uc, emulator),
  };
}
