import { build } from 'esbuild';
import { readFileSync, existsSync } from 'node:fs';
import { expect } from '@playwright/test';

const kod={};
const auth = `
const user = { uid:'TEST-HOCA', email: 'veli@example.test' };
let callback;
export const getAuth = () => ({ currentUser: user });
export const isSignInWithEmailLink = () => false;
export const onAuthStateChanged = (_a, cb) => {callback=cb;cb(user);};
export const signOut = async () => {callback?.(null);};
`;
const firestore = `
export const getFirestore = () => ({});
export const doc = (_db, ...p) => {const parts=p.flatMap(x=>x.split('/'));return {col:parts.slice(0,-1).join('/'),id:parts.at(-1)};};
export const collection = (_db, ...p) => ({ col:p.join("/") });
export const where = (field, op, value) => ({ field, op, value });
export const query = (ref, ...filters) => ({ ...ref, filters });
export const getDoc = async ref => {
 if(window.__dataError && ref.col.startsWith('bultenler/'))throw Error('offline');
 if(ref.col.startsWith('evCalismalari/')){const data=decode(window.__cloud[ref.col]?.[ref.id]);return{id:ref.id,exists:()=>!!data,data:()=>data};}
 const stored=(window.__records[ref.col]||[]).find(d=>d.id===ref.id);
 const data = stored || (ref.col === 'hocalar' ? {ad:'Örnek Hoca',sifreVar:true} : ref.col === 'aileler' && ref.id==='veli@example.test' ? { ogrenciler: window.__students.map(s=>s.ref), dil: window.__lang, sifreVar: true }
   : ref.col === 'ogrenciler' ? window.__students.find(s=>s.ref===ref.id) : null);
 const clean=data&&Object.fromEntries(Object.entries(data).filter(([k])=>k!=='id'));
 return { id: ref.id, exists: () => !!data, data: () => clean };
};

export const Timestamp={fromDate:d=>({toDate:()=>d})};
export const serverTimestamp=()=> 'server-time';
const decode=d=>d&&({...d,son:d.son?Timestamp.fromDate(new Date(d.son+'T12:00:00Z')):undefined,sonraki:d.sonraki?Timestamp.fromDate(new Date(d.sonraki+'T12:00:00Z')):undefined});
export const getDocs = async ref => {
 if(window.__dataError && ref.col.startsWith('bultenler/'))throw Error('offline');
 if(window.__bultenDelay && ref.col.startsWith('bultenler/'))await new Promise(r=>window.__releaseBulten=r);
 if(ref.col.startsWith('evCalismalari/')){
  if(window.__cloudError)throw Error('offline');
  if(window.__cloudDelay)await new Promise(r=>window.__releaseCloud=r);
  return {docs:Object.entries(window.__cloud[ref.col]||{}).map(([id,d])=>({id,data:()=>decode(d)}))};
 }
 return {docs:(ref.col==='ogrenciler'?window.__students:window.__records[ref.col]||[]).filter(d=>!ref.filters||ref.filters.every(f=>f.op==='array-contains'?d[f.field]?.includes(f.value):d[f.field]===f.value)).map((data,i)=>({id:data.id||data.ref||String(i),data:()=>Object.fromEntries(Object.entries(data).filter(([k])=>k!=='id'))}))};
};
const yaz=(ref,data)=>{
 if(ref.col.startsWith('evCalismalari/')){(window.__cloud[ref.col]||={})[ref.id]={...data,son:data.son.toDate().toISOString().slice(0,10),sonraki:data.sonraki.toDate().toISOString().slice(0,10)};window.__writes.push({ref,data:window.__cloud[ref.col][ref.id]});return;}
 window.__writes.push({ref,data});window.__records[ref.col]=[...(window.__records[ref.col]||[]).filter(d=>d.id!==ref.id),{id:ref.id,...data}];
};
export const setDoc=async(ref,data)=>yaz(ref,data);
export const updateDoc=async(ref,data)=>{if(Object.keys(data).every(k=>k==='sonGiris'))return;return yaz(ref,{...(await getDoc(ref)).data(),...data});};
export const deleteDoc=async ref=>{window.__writes.push({ref,delete:true});if(ref.col.startsWith('evCalismalari/'))delete (window.__cloud[ref.col]||{})[ref.id];else if(ref.col==='ogrenciler')window.__students=window.__students.filter(s=>s.ref!==ref.id);else window.__records[ref.col]=(window.__records[ref.col]||[]).filter(d=>d.id!==ref.id);};
export const runTransaction=async(_db,cb)=>{
 const pending=[];
 const result=await cb({get:async ref=>{if(window.__cloudError&&ref.col.startsWith('evCalismalari/'))throw Error('offline');return getDoc(ref);},set:(r,d)=>pending.push(()=>yaz(r,d)),update:(r,d)=>pending.push(()=>updateDoc(r,d)),delete:r=>pending.push(()=>deleteDoc(r))});
 if(window.__commitError)throw Error('İşlem kaydedilemedi.');
 for(const op of pending)await op();return result;
};
`;

async function bundle(hoca=false) {
  const mode=hoca?'hoca':'veli';
  if (!kod[mode]) {
    const result = await build({
      entryPoints: [hoca?'src/scripts/hoca-ekrani.ts':'src/scripts/veli-portali.ts'], bundle: true, write: false,
      format: 'iife', globalName: 'MektepTest', logLevel: 'silent',
      plugins: [{ name: 'sahte-firebase', setup(b) {
        b.onResolve({ filter: /^(firebase\/|\.\.\/lib\/firebase$)/ }, a => ({ path: a.path, namespace: 'test' }));
        b.onLoad({ filter: /.*/, namespace: 'test' }, a => ({ loader: 'js', contents:
          a.path === 'firebase/auth' ? auth : a.path === 'firebase/firestore/lite' ? firestore
            : 'export const firebaseUygulamasi = () => ({});' }));
      } }],
    });
    kod[mode] = result.outputFiles[0].text;
  }
  return kod[mode];
}

export async function mektepAc(page, context, { hoca=false, cloud={}, cloudError=false, dil = 'tr', ogrenci = true, records = {}, tarih = '2026-09-13T10:00:00Z', students = [{ref:'TEST-1',ad:'Örnek',soyad:'Talebe'}] } = {}) {
  await context.route('**/*', r => new URL(r.request().url()).origin === 'http://127.0.0.1:4401' ? r.continue() : r.abort());
  await context.routeWebSocket(/.*/, s => s.close());
  const yol = hoca?'hoca':{ tr: 'tr/veli-portali', fr: 'fr/portail-parents', en: 'en/parents-portal' }[dil];
  // Derlenmiş gerçek CSS ve iskelet, sahte aile/öğrenci, dış ağ yok.
  const html = readFileSync(`dist/${yol}/index.html`, 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  await context.route('http://127.0.0.1:4401/mektep-test/', r => r.fulfill({ contentType: 'text/html', body: html }));
  await page.clock.install({ time: new Date(tarih) });
  await page.goto('/mektep-test/');
  const ids = [...readFileSync('src/lib/hadis-verisi.ts', 'utf8').matchAll(/id: '([^']+)'/g)].map(m => m[1]);
  const hadisSesleri = Object.fromEntries(['ar', 'tr', 'fr', 'en'].map(d => [d, ids.filter(id => existsSync(`public/media/ses/hadisler/${d}/${id}.mp3`))]));
  await page.evaluate(({ dil, records, hadisSesleri, students,cloud,cloudError,hoca }) => {
    window.__cloud=cloud;window.__cloudError=cloudError;window.__writes=[];
    window.__students = students;
    window.__lang = dil;
    window.__records = records;
    window.__audio = [];
    window.__tts = [];
    const playing = new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get() { return !playing.get(this); } });
    HTMLMediaElement.prototype.play = function () {
      if (window.__delayNextAudio) {
        window.__delayNextAudio = false;
        return new Promise((resolve, reject) => { window.__pending = { resolve, reject, audio: this }; });
      }
      playing.set(this, true);
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      if (playing.get(this)) { playing.set(this, false); this.dispatchEvent(new Event('pause')); }
    };
    window.Audio = function (url) {
      const audio = document.createElement('audio');
      audio.preload = 'none'; audio.src = url;
      window.__audio.push(audio);
      return audio;
    };
    if (window.speechSynthesis) window.speechSynthesis.speak = u => window.__tts.push(u.text);
    const data = document.createElement('script');
    data.id = hoca?'hoca-veri':'veli-veri'; data.type = 'application/json';
    data.textContent = JSON.stringify({ hadisSesleri, veliYollari:{}, materyalYolu:'/', donem: '2026-2027', dilYollari: {}, materyalGunleri: [], gunler: [
      { tarih: '2026-09-12', hafta: 2, dersler: [{ no: 1, kod: 'kuran', alan: 'Kur’an', konu: 'Cumartesi konusu', ezber: ['Cumartesi tekrarı'] }] },
      { tarih: '2026-09-13', hafta: 2, dersler: [{ no: 1, kod: 'kuran', alan: 'Kur’an', konu: 'Pazar konusu', ezber: ['Pazar tekrarı'] }] },
    ] });
    document.body.appendChild(data);
  }, { dil, records, hadisSesleri, students,cloud,cloudError,hoca });
  await page.addScriptTag({ content: await bundle(hoca) });
  await page.evaluate(hoca => hoca?window.MektepTest.hocaEkrani():window.MektepTest.veliPortali(),hoca);
  if(hoca){await expect(page.locator('[data-sekme=odev]')).toBeVisible();return;}
  await expect(page.locator('[data-eylem="ogrenciModu"]')).toBeVisible();
  if (ogrenci) await page.locator('[data-eylem="ogrenciModu"]').click();
}
