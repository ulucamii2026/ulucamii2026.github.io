/**
 * İlim Yolu hesap testlerinin ortak parçaları (Dilim 1): egitim/src/lib/hesap/** ve firebase-istemci.ts'i esbuild ile paketler,
 * Firebase'in yerine bellekte sahte bir `IlimFirebase` verir (ağ yok, emülatör yok). Sahte Firestore yazımları kaydeder ve belgeyi
 * kurallardaki gibi birleştirir: `serverTimestamp()` ve `deleteField()` tanınabilir nesnelerdir.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });

/** `egitim/src/lib/<yol>.ts` (ya da `@ortak/…`) modüllerini tek pakette yükler. */
export async function yukle(ad, yollar) {
  const outfile = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({
    stdin: { contents: yollar.map((y) => `export * from "${y.startsWith('@') ? y : `./egitim/src/lib/${y}.ts`}";`).join('\n'), resolveDir: process.cwd() },
    outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
    alias: { '@ortak': resolve('src') },
  });
  return import(pathToFileURL(outfile).href);
}

export class BellekDepo {
  constructor(ilk = {}) { this.v = new Map(Object.entries(ilk)); }
  getItem(k) { return this.v.has(k) ? this.v.get(k) : null; }
  setItem(k, d) { this.v.set(k, String(d)); }
  removeItem(k) { this.v.delete(k); }
  anahtarlar() { return [...this.v.keys()].sort(); }
}

export const SUNUCU_ZAMANI = Object.freeze({ sahte: 'serverTimestamp' });
export const ALAN_SIL = Object.freeze({ sahte: 'deleteField' });
export const hata = (code, message = code, details) => Object.assign(new Error(message), { code, details });

export function kullanici(uid = 'u-deneme-1', { claims = {}, email = 'deneme@example.test', emailVerified = true, saglayicilar = ['password'] } = {}) {
  const u = {
    uid, email, emailVerified,
    providerData: saglayicilar.map((providerId) => ({ providerId })),
    tazelemeler: 0,
    async getIdTokenResult(tazele) { if (tazele) u.tazelemeler++; return { claims: u.claims }; },
    async getIdToken(tazele) { if (tazele) u.tazelemeler++; return 'id-token'; },
    claims,
  };
  return u;
}

/**
 * Sahte Firebase. `belgeler`: yol → veri (bulut). `cagrilar`: callable adı → (veri) => sonuç | throw. Dönen `k` çağrı günlüğüdür.
 */
export function sahteFirebase({ user = kullanici(), belgeler = {}, cagrilar = {} } = {}) {
  const bulut = new Map(Object.entries(belgeler).map(([y, v]) => [y, structuredClone(v)]));
  const k = { yazimlar: [], okumalar: [], cagrilar: [], auth: [], islemler: 0 };
  const snap = (yol) => {
    const v = bulut.get(yol);
    return { id: yol.split('/').pop(), exists: () => v !== undefined, data: () => (v === undefined ? undefined : structuredClone(v)) };
  };
  const birlestir = (eski, yeni) => {
    const s = { ...(eski ?? {}) };
    for (const [a, v] of Object.entries(yeni)) {
      if (v === ALAN_SIL) delete s[a];
      else if (v && typeof v === 'object' && !Array.isArray(v) && v !== SUNUCU_ZAMANI && s[a] && typeof s[a] === 'object') s[a] = birlestir(s[a], v);
      else s[a] = v;
    }
    return s;
  };
  const yazBulut = (yol, veri, sec) => {
    k.yazimlar.push({ tur: 'set', yol, veri, sec });
    bulut.set(yol, sec?.merge ? birlestir(bulut.get(yol), veri) : { ...veri });
  };
  const fs = {
    doc: (_db, ...yol) => ({ path: yol.join('/') }),
    collection: (_db, ...yol) => ({ path: yol.join('/') }),
    query: (c, ...k2) => ({ path: c.path, kisit: k2 }),
    orderBy: (alan, yon) => ({ orderBy: [alan, yon] }),
    limit: (n) => ({ limit: n }),
    async getDoc(ref) { k.okumalar.push(ref.path); return snap(ref.path); },
    async getDocs(q) {
      k.okumalar.push(q.path);
      const onek = `${q.path}/`;
      const docs = [...bulut.keys()].filter((y) => y.startsWith(onek) && !y.slice(onek.length).includes('/')).map(snap);
      return { docs };
    },
    async setDoc(ref, veri, sec) { yazBulut(ref.path, veri, sec); },
    async deleteDoc(ref) { k.yazimlar.push({ tur: 'delete', yol: ref.path }); bulut.delete(ref.path); },
    serverTimestamp: () => SUNUCU_ZAMANI,
    deleteField: () => ALAN_SIL,
    async runTransaction(_db, fn) {
      k.islemler++;
      const bekleyen = [];
      const sonuc = await fn({ get: async (ref) => { k.okumalar.push(ref.path); return snap(ref.path); }, set: (ref, veri, sec) => { bekleyen.push([ref.path, veri, sec]); } });
      for (const [yol, veri, sec] of bekleyen) yazBulut(yol, veri, sec);
      return sonuc;
    },
  };
  const auth = { currentUser: user, languageCode: null, async authStateReady() {} };
  const giris = (u) => { auth.currentUser = u; return { user: u }; };
  const a = {
    async signInWithEmailAndPassword(_a, eposta, sifre) { k.auth.push(['sifre', eposta, sifre]); return giris(kullanici('u-sifre', { email: eposta })); },
    async createUserWithEmailAndPassword(_a, eposta, sifre) { k.auth.push(['kayit', eposta, sifre]); return giris(kullanici('u-yeni', { email: eposta, emailVerified: false })); },
    async sendEmailVerification(u, ayar) { k.auth.push(['dogrulama', u.uid, ayar, auth.languageCode]); },
    async sendPasswordResetEmail(_a, eposta, ayar) { k.auth.push(['sifirla', eposta, ayar, auth.languageCode]); },
    async signInWithCustomToken(_a, token) { k.auth.push(['token', token]); return giris(kullanici('c_cocuk0000000000000', { claims: { rol: 'cocuk', ref: 'R1' }, email: null, saglayicilar: [] })); },
    GoogleAuthProvider: class { setCustomParameters(p) { this.p = p; } },
    async signInWithPopup(_a, s) { k.auth.push(['popup', s.p]); return giris(kullanici('u-google', { saglayicilar: ['google.com'] })); },
    async signInWithRedirect(_a, s) { k.auth.push(['yonlendir', s.p]); },
    async getRedirectResult() { return null; },
    async signOut() { k.auth.push(['cikis']); auth.currentUser = null; },
    onAuthStateChanged(_a, cb) { k.dinleyici = cb; return () => { k.dinleyici = null; }; },
  };
  const f = {
    app: {}, auth, db: {}, a, fs,
    async cagir(ad, veri) {
      k.cagrilar.push([ad, veri]);
      if (!cagrilar[ad]) throw hata('functions/not-found', 'not-found');
      return cagrilar[ad](veri);
    },
    api: (uc) => `/api/${uc}`,
  };
  return { f, k, bulut };
}
