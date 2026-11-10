/**
 * src/lib/firebase.ts egitim bayrağı (Dilim 4 / P1): egitim derlemesinde (`import.meta.env.PUBLIC_UYGULAMA === 'egitim'`) veli portalı ve hoca ekranı
 * `ilim` adlı uygulamayı egitim Auth alanıyla alır (egitim Hosting CSP'si `frame-src 'self'`; ana sitenin ulucamii-portal.firebaseapp.com çerçevesi engellenir);
 * bayraksız derlemede (ulucamii.be) varsayılan uygulama ve eski Auth alanı AYNEN kalır. Ağ yok: initializeApp yalnız bellekte ayar kurar.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });

async function yukle(ad, define) {
  const outfile = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ entryPoints: ['src/lib/firebase.ts'], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent', define });
  return import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
}
const firebaseApp = () => import('firebase/app');

test('egitim derlemesi: `ilim` uygulaması + egitim Auth alanı; tekrar çağrı aynı uygulamayı verir; varsayılan uygulama oluşmaz', async () => {
  const m = await yukle('firebase-uyg-egitim', { 'import.meta.env.PUBLIC_UYGULAMA': '"egitim"' });
  const { getApps, deleteApp } = await firebaseApp();
  const a = m.firebaseUygulamasi();
  assert.equal(a.name, 'ilim');
  assert.equal(a.options.authDomain, 'egitim.ulucamii.be');
  assert.equal(a.options.projectId, 'ulucamii-portal');
  assert.equal(m.firebaseUygulamasi(), a);
  assert.deepEqual(getApps().map((x) => x.name), ['ilim']);
  await deleteApp(a);
});

test('egitim derlemesi: başka bir uygulama (varsayılan) zaten varsa da `ilim` döner', async () => {
  const m = await yukle('firebase-uyg-egitim2', { 'import.meta.env.PUBLIC_UYGULAMA': '"egitim"' });
  const { initializeApp, getApps, deleteApp } = await firebaseApp();
  const varsayilan = initializeApp({ projectId: 'x', apiKey: 'k' });
  const a = m.firebaseUygulamasi();
  assert.equal(a.name, 'ilim');
  assert.equal(varsayilan.name, '[DEFAULT]');
  await Promise.all(getApps().map((x) => deleteApp(x)));
});

test('ana site derlemesi (bayrak yok): varsayılan uygulama ve ulucamii-portal.firebaseapp.com alanı aynen', async () => {
  const m = await yukle('firebase-uyg-ana', { 'import.meta.env': '{}' });
  const { getApps, deleteApp } = await firebaseApp();
  const a = m.firebaseUygulamasi();
  assert.equal(a.name, '[DEFAULT]');
  assert.equal(a.options.authDomain, 'ulucamii-portal.firebaseapp.com');
  assert.equal(m.firebaseUygulamasi(), a);
  assert.equal(m.FIREBASE_YAPILANDIRMA.authDomain, 'ulucamii-portal.firebaseapp.com'); // egitim istemcisi (firebase-istemci.ts) bu sabiti kendi alanıyla ezer
  assert.deepEqual(getApps().map((x) => x.name), ['[DEFAULT]']);
  await deleteApp(a);
});

test('bayrak "egitim" dışında bir değerse ana site davranışı', async () => {
  const m = await yukle('firebase-uyg-baska', { 'import.meta.env.PUBLIC_UYGULAMA': '"baska"' });
  const { deleteApp } = await firebaseApp();
  const a = m.firebaseUygulamasi();
  assert.equal(a.name, '[DEFAULT]');
  await deleteApp(a);
});

test('uygulama adı ve alan egitim/src/lib/firebase-istemci.ts ile aynı (tek oturum)', () => {
  const ist = readFileSync('egitim/src/lib/firebase-istemci.ts', 'utf8');
  const kaynak = readFileSync('src/lib/firebase.ts', 'utf8');
  assert.match(ist, /UYGULAMA_ADI = 'ilim'/);
  assert.match(ist, /AUTH_ALANI = 'egitim\.ulucamii\.be'/);
  assert.match(kaynak, /EGITIM_UYGULAMA_ADI = 'ilim'/);
  assert.match(kaynak, /EGITIM_AUTH_ALANI = 'egitim\.ulucamii\.be'/);
});
