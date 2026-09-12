import { test, expect } from '@playwright/test';
import { build } from 'esbuild';

// Gerçek portal kodu; Firebase bütünüyle bellek içi taklittir. Hesap/gönderim yok.
const authMock = `
const a = { currentUser: null };
export const getAuth = () => a;
export const isSignInWithEmailLink = () => !!window.__emailLink;
export const onAuthStateChanged = (_a, callback) => callback(null);
export const signInWithEmailAndPassword = async (_a, email, password) => {
  window.__login = { email, password };
  throw { code: 'auth/invalid-credential' };
};
export const sendSignInLinkToEmail = async (_a, email) => { window.__sent = email; };
export const sendPasswordResetEmail = async (_a, email) => { window.__sent = email; };
export const signOut = async () => {};
export const updatePassword = async () => {};
export const signInWithEmailLink = async () => { throw { code:'auth/invalid-action-code' }; };
`;
const bundles = new Map();
async function bundle(kind) {
  if (!bundles.has(kind)) {
    const result = await build({
      entryPoints: [`src/scripts/${kind === 'veli' ? 'veli-portali' : 'hoca-ekrani'}.ts`],
      bundle: true, write: false, format: 'iife', globalName: 'PortalTest', logLevel: 'silent',
      plugins: [{ name: 'yalniz-sahte-firebase', setup(b) {
        b.onResolve({ filter: /^(firebase\/|\.\.\/lib\/firebase$)/ }, args => ({ path:args.path, namespace:'test' }));
        b.onLoad({ filter: /.*/, namespace:'test' }, args => ({ contents:
          args.path === 'firebase/auth' ? authMock : args.path === 'firebase/firestore/lite'
          ? 'export const getFirestore = () => ({}); export const collection=()=>{throw Error("Girişten önce veri okunamaz")}; export const doc=collection, getDocs=collection, runTransaction=collection, serverTimestamp=collection; export const Timestamp={};'
          : 'export const firebaseUygulamasi = () => ({});', loader:'js' }));
      } }],
    });
    bundles.set(kind, result.outputFiles[0].text);
  }
  return bundles.get(kind);
}

async function start(page, context, kind, lang, blocked = false, emailLink = false) {
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, s => s.close());
  // Boş, yerel sayfa: gerçek uygulamanın Firebase başlatıcısı çalışmaz.
  await context.route('http://127.0.0.1:4401/portal-test/', r => r.fulfill({ contentType:'text/html', body:'<!doctype html><html><body></body></html>' }));
  await page.goto('/portal-test/');
  await page.evaluate(({kind,lang,blocked,emailLink}) => {
    window.__emailLink = emailLink;
    if (blocked) Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Depolama kapalı','SecurityError');}});
    const root = kind === 'veli' ? 'veli-portal' : 'hoca-ekrani';
    document.body.innerHTML = `<div id="${root}" data-dil="${lang}"></div><div id="${kind}-durum"></div><script id="${kind}-veri" type="application/json">${JSON.stringify({gunler:[],materyalGunleri:[],dilYollari:{},veliYollari:{}})}</script>`;
  }, {kind,lang,blocked,emailLink});
  await page.addScriptTag({content:await bundle(kind)});
  await page.evaluate(async kind => {
    try { await window.PortalTest[kind === 'veli' ? 'veliPortali' : 'hocaEkrani'](); }
    catch(e) { window.__initError = e.message; }
  },kind);
  expect(await page.evaluate(()=>window.__initError)).toBeUndefined();
}

for (const [kind,lang] of [['veli','tr'],['veli','fr'],['veli','en'],['hoca','tr']]) {
  test(`${kind}/${lang}: şifre aynen iletilir`, async ({page,context}) => {
    await start(page,context,kind,lang);
    const form = page.locator('form[data-form="giris"]');
    await form.locator('[name=eposta]').fill('veli@example.test');
    await form.locator('[name=sifre]').fill('  Ornek parola  ');
    await form.locator('[type=submit]').click();
    await expect.poll(()=>page.evaluate(()=>window.__login)).toEqual({email:'veli@example.test',password:'  Ornek parola  '});
  });
  test(`${kind}/${lang}: depolama kapalıyken giriş ve bağlantı isteği çalışır`, async ({page,context}) => {
    await start(page,context,kind,lang,true);
    const form = page.locator('form[data-form="giris"]');
    await form.locator('[name=eposta]').fill('veli@example.test');
    await form.locator('[name=sifre]').fill('OrnekParola123');
    await form.locator('[type=submit]').click();
    await expect.poll(()=>page.evaluate(()=>window.__login?.email)).toBe('veli@example.test');
    await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
    const bag = page.locator('form[data-form="bag"]');
    await bag.locator('[name=eposta]').fill('veli@example.test');
    await bag.locator('[type=submit]').click();
    await expect(bag.locator('[data-mesaj]')).toHaveClass(/basari/);
    await expect.poll(()=>page.evaluate(()=>window.__sent)).toBe('veli@example.test');
  });
  test(`${kind}/${lang}: depolama kapalıyken e-posta bağlantısı elle tamamlanabilir`, async ({page,context}) => {
    await start(page,context,kind,lang,true,true);
    await expect(page.locator('form[data-form="bagTamamla"] input[name="eposta"]')).toBeVisible();
  });
}
