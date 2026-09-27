import { build } from 'esbuild';
import { readFileSync, existsSync } from 'node:fs';
import { expect } from '@playwright/test';

const kod={};
const auth = `
const user = { uid:'TEST-HOCA', email: 'veli@example.test', getIdToken: async () => 'test-id-token' }; // getIdToken: çeviri ucu (14 Eyl 2026)
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
 if(window.__dataError && (ref.col.startsWith('bultenler/')||ref.col.startsWith('dersDefteri/')))throw Error('offline');
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
 if(window.__dataError && (ref.col.startsWith('bultenler/')||ref.col.startsWith('dersDefteri/')))throw Error('offline');
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
export const setDoc=async(ref,data)=>{if(ref.col==='odevler'){if(window.__odevWriteError)throw Error('offline');if(window.__odevWriteDelay)await new Promise(r=>window.__releaseOdev=r);}return yaz(ref,data);};
export const updateDoc=async(ref,data)=>{if(Object.keys(data).every(k=>k==='sonGiris'))return;return yaz(ref,{...(await getDoc(ref)).data(),...data});};
export const deleteDoc=async ref=>{window.__writes.push({ref,delete:true});if(ref.col.startsWith('evCalismalari/'))delete (window.__cloud[ref.col]||{})[ref.id];else if(ref.col==='ogrenciler')window.__students=window.__students.filter(s=>s.ref!==ref.id);else window.__records[ref.col]=(window.__records[ref.col]||[]).filter(d=>d.id!==ref.id);};
/* writeBatch sahtesi (12 Eyl 2026): hoca ekranı yoklamayı ve toplu defter doldurmayı yığınla
   yazıyor; sahte istemcide yoktu, bu yüzden o yollar hiç sınanmamıştı. Gerçeğinde olduğu gibi
   ya hepsi yazılır ya hiçbiri. */
export const writeBatch=_db=>{
 const ops=[];
 const b={set:(r,d)=>{ops.push(()=>yaz(r,d));return b;},update:(r,d)=>{ops.push(()=>updateDoc(r,d));return b;},delete:r=>{ops.push(()=>deleteDoc(r));return b;},
  commit:async()=>{if(window.__commitError)throw Error('Toplu işlem kaydedilemedi.');for(const op of ops)await op();}};
 return b;
};
export const runTransaction=async(_db,cb)=>{
 const pending=[];
 const result=await cb({get:async ref=>{if(window.__cloudError&&ref.col.startsWith('evCalismalari/'))throw Error('offline');return getDoc(ref);},set:(r,d)=>pending.push(()=>yaz(r,d)),update:(r,d)=>pending.push(()=>updateDoc(r,d)),delete:r=>pending.push(()=>deleteDoc(r))});
 if(window.__commitError)throw Error('İşlem kaydedilemedi.');
 for(const op of pending)await op();return result;
};
`;

/* Tam SDK sahtesi (27 Eyl 2026, Ezber Kilimi Faz 1c): ezber paneli `firebase/firestore`'u (kalıcı önbellek,
   onSnapshot, bekleyen yazma) kullanır. Veri lite sahtesiyle aynı yerde (window.__records) durur; öğrenci kartı
   lite ile okuyunca paneldeki yazımı görür. Sınama düğmeleri: __ezberBaglantiKes()/__ezberBaglan() (yazım
   sunucuya gitmez, ekran hemen güncellenir, metadata bekleyen yazma gösterir); __ezberReddet = {kod, sunucu}
   (sıradaki yazım reddedilir; yerel değişiklik geri sarılır, sunucu durumu `sunucu` olur — iki telefon çakışması);
   __ezberDinlemeHatasi (dinleme yetki hatası). Her toplu yazım __ezberYazimlar'a düşer. */
const firestoreTam = `
const parca=(...p)=>p.flatMap(x=>String(x).split('/')).filter(Boolean);
let oto=0;
const tablo=col=>(window.__records[col]||=[]);
const bul=ref=>(window.__records[ref.col]||[]).find(d=>d.id===ref.id);
const temiz=v=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='id'));
const kopya=v=>Array.isArray(v)?v.map(kopya):v&&typeof v==='object'&&!v.toMillis?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,kopya(x)])):v;
export const Timestamp={fromDate:d=>({toDate:()=>d,toMillis:()=>d.getTime()})};
const zaman=()=>Timestamp.fromDate(new Date());
export const serverTimestamp=()=>({__sunucu:true});
export const deleteField=()=>({__sil:true});
export const initializeFirestore=()=>({tam:true});
export const getFirestore=()=>({tam:true});
export const persistentLocalCache=o=>({o});
export const persistentMultipleTabManager=()=>({});
export const terminate=async()=>{};
export const clearIndexedDbPersistence=async()=>{};
export const waitForPendingWrites=async()=>{};
export const where=(field,op,value)=>({field,op,value});
export const orderBy=(alan,yon='asc')=>({alan,yon});
export const limit=n=>({limit:n});
export const query=(ref,...k)=>({...ref,kosullar:k});
export function doc(ust,...p){
  if(ust&&ust.col!==undefined&&ust.id===undefined)return{col:ust.col,id:p.length?parca(...p).join('/'):'oto'+(++oto).toString(36)+Math.random().toString(36).slice(2,8)};
  const yol=ust&&ust.id!==undefined?[...parca(ust.col,ust.id),...parca(...p)]:parca(...p);
  return{col:yol.slice(0,-1).join('/'),id:yol.at(-1)};
}
export function collection(ust,...p){return{col:ust&&ust.id!==undefined?[...parca(ust.col,ust.id),...parca(...p)].join('/'):parca(...p).join('/')};}
const coz=v=>v&&v.__sunucu?zaman():Array.isArray(v)?v.map(coz):v&&typeof v==='object'&&!v.toMillis?Object.fromEntries(Object.entries(v).filter(([,x])=>!(x&&x.__sil)).map(([k,x])=>[k,coz(x)])):v;
function birlestir(eski,yeni){
  const s={...(eski||{})};
  for(const[k,v]of Object.entries(yeni)){
    if(v&&v.__sil){delete s[k];continue;}
    if(v&&typeof v==='object'&&!Array.isArray(v)&&!v.__sunucu&&!v.toMillis&&s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])&&!s[k].toMillis)s[k]=birlestir(s[k],v);
    else s[k]=coz(v);
  }
  return s;
}
const bekleyen=new Map();
const yolu=ref=>ref.col+'/'+ref.id;
function uygula(op){
  const t=tablo(op.ref.col),i=t.findIndex(d=>d.id===op.ref.id);
  if(op.tur==='delete'){if(i>=0)t.splice(i,1);return;}
  const eski=i>=0?temiz(t[i]):null;
  const yeni={id:op.ref.id,...(op.merge||op.tur==='update'?birlestir(eski,op.veri):coz(op.veri))};
  if(i>=0)t[i]=yeni;else t.push(yeni);
}
const anlik=d=>{
  const belge=x=>({id:x.id,exists:()=>true,data:()=>temiz(x),metadata:{hasPendingWrites:bekleyen.has(d.ref.col+'/'+x.id),fromCache:!!window.__ezberCevrimdisi}});
  if(d.ref.id!==undefined){const x=bul(d.ref);return x?belge(x):{id:d.ref.id,exists:()=>false,data:()=>undefined,metadata:{hasPendingWrites:false,fromCache:!!window.__ezberCevrimdisi}};}
  const docs=(window.__records[d.ref.col]||[]).map(belge);
  return{docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f),metadata:{hasPendingWrites:docs.some(x=>x.metadata.hasPendingWrites),fromCache:!!window.__ezberCevrimdisi}};
};
const dinleyiciler=new Set();
const yayinla=d=>{if(window.__ezberDinlemeHatasi){d.error?.(Object.assign(Error('Missing or insufficient permissions.'),{code:'permission-denied'}));return;}d.next?.(anlik(d));};
const herkese=()=>{for(const d of dinleyiciler)yayinla(d);};
export function onSnapshot(ref,...a){
  let sec={},next,error;
  if(typeof a[0]==='function'){next=a[0];error=a[1];}
  else if(typeof a[1]==='function'){sec=a[0]||{};next=a[1];error=a[2];}
  else{sec=a[0]||{};next=a[1]?.next;error=a[1]?.error;}
  const d={ref,next,error,meta:!!sec.includeMetadataChanges};
  dinleyiciler.add(d);setTimeout(()=>{if(dinleyiciler.has(d))yayinla(d);},0);
  return()=>dinleyiciler.delete(d);
}
const bekleyenler=[];
window.__ezberYazimlar=[];
window.__ezberBaglantiKes=()=>{window.__ezberCevrimdisi=true;herkese();};
window.__ezberBaglan=()=>{window.__ezberCevrimdisi=false;for(const r of bekleyenler.splice(0))r();herkese();};
export function writeBatch(){
  const ops=[];
  const b={set:(ref,veri,s)=>{ops.push({tur:'set',ref,veri,merge:!!s?.merge});return b;},update:(ref,veri)=>{ops.push({tur:'update',ref,veri});return b;},delete:ref=>{ops.push({tur:'delete',ref});return b;},
    async commit(){
      const once=ops.map(op=>({ref:op.ref,veri:bul(op.ref)?kopya(bul(op.ref)):null}));
      for(const op of ops)uygula(op);
      const yollar=ops.map(op=>yolu(op.ref));
      for(const y of yollar)bekleyen.set(y,(bekleyen.get(y)||0)+1);
      window.__ezberYazimlar.push(ops.map(op=>({tur:op.tur,yol:yolu(op.ref),veri:kopya(op.veri??null)})));
      herkese();
      if(window.__ezberCevrimdisi)await new Promise(r=>bekleyenler.push(r));
      await new Promise(r=>setTimeout(r,0));
      for(const y of yollar){const n=(bekleyen.get(y)||1)-1;if(n>0)bekleyen.set(y,n);else bekleyen.delete(y);}
      const red=window.__ezberReddet;
      if(red){
        window.__ezberReddet=null;
        for(const o of once.reverse()){const t=tablo(o.ref.col),i=t.findIndex(d=>d.id===o.ref.id);if(i>=0)t.splice(i,1);if(o.veri)t.push(o.veri);}
        if(red.sunucu){const t=tablo('ezberDurum'),i=t.findIndex(d=>d.id===red.sunucu.id);if(i>=0)t.splice(i,1);t.push(red.sunucu);}
        herkese();
        throw Object.assign(new Error('Missing or insufficient permissions.'),{code:red.kod||'permission-denied'});
      }
      herkese();
    }};
  return b;
}
export const getDoc=async ref=>anlik({ref});
export const getDocFromServer=async ref=>{if(window.__ezberCevrimdisi)throw Object.assign(Error('offline'),{code:'unavailable'});return anlik({ref});};
export const getDocs=async ref=>{
  let docs=anlik({ref:{col:ref.col}}).docs;
  for(const k of ref.kosullar||[]){
    if(k.field)docs=docs.filter(x=>{const v=x.data()[k.field];return k.op==='array-contains'?v?.includes(k.value):v===k.value;});
    if(k.alan){const s=v=>v&&v.toMillis?v.toMillis():v;docs=[...docs].sort((x,y)=>{const a=s(x.data()[k.alan]),b=s(y.data()[k.alan]);return(a<b?-1:a>b?1:0)*(k.yon==='desc'?-1:1);});}
    if(k.limit)docs=docs.slice(0,k.limit);
  }
  return{docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};
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
            : a.path === 'firebase/firestore' ? firestoreTam : 'export const firebaseUygulamasi = () => ({});' }));
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
    data.textContent = JSON.stringify({ hadisSesleri, veliYollari:{}, materyalYolu:'/', donem: '2026-2027', ceviriUcu: 'http://127.0.0.1:4401/ceviri-test', dilYollari: {}, materyalGunleri: [], gunler: [
      { tarih: '2026-09-12', hafta: 2, dersler: [{ no: 1, kod: 'kuran', alan: 'Kur’an', konu: 'Cumartesi konusu', ezber: ['Cumartesi tekrarı'] }] },
      { tarih: '2026-09-13', hafta: 2, dersler: [{ no: 1, kod: 'kuran', alan: 'Kur’an', konu: 'Pazar konusu', ezber: ['Pazar tekrarı'] }] },
      /* Gerçek ders günü üç derstir; tek dersli günler yukarıdaki eski sınamaları bozmasın diye
         üç dersli bir gün ayrıca eklendi (12 Eyl 2026, yoklama-mazeret şeridi sınaması). */
      { tarih: '2026-09-19', hafta: 3, dersler: [
        { no: 1, kod: 'kuran', alan: 'Kur’an', konu: 'Üç dersli gün 1', ezber: [] },
        { no: 2, kod: 'itikat', alan: 'İtikat', konu: 'Üç dersli gün 2', ezber: [] },
        { no: 3, kod: 'ibadet', alan: 'İbadet', konu: 'Üç dersli gün 3', ezber: [] },
      ] },
    ] });
    document.body.appendChild(data);
  }, { dil, records, hadisSesleri, students,cloud,cloudError,hoca });
  await page.addScriptTag({ content: await bundle(hoca) });
  await page.evaluate(hoca => hoca?window.MektepTest.hocaEkrani():window.MektepTest.veliPortali(),hoca);
  if(hoca){await expect(page.locator('[data-sekme=odev]')).toBeVisible();return;}
  await expect(page.locator('[data-eylem="ogrenciModu"]')).toBeVisible();
  if (ogrenci) await page.locator('[data-eylem="ogrenciModu"]').click();
}
