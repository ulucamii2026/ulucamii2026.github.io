import fs from 'fs';
// Depo kökü (sonunda «/»): betik konumundan türetilir, mutlak yol yazılmaz.
export const W=decodeURIComponent(new URL('../',import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,'');
export const LANGS=['tr','fr','en','nl','de'];
const R=W+'src/data/ilim-yolu/kartlar/';
export const kart={};
for(const f of fs.readdirSync(R)){for(const k of JSON.parse(fs.readFileSync(R+f,'utf8')).kartlar)kart[k.id]=k;}
export const abdest=JSON.parse(fs.readFileSync(W+'src/data/ibadet/abdest.json','utf8'));
export const namaz=JSON.parse(fs.readFileSync(W+'src/data/ibadet/namaz.json','utf8'));
export function bol(s){
  const P=s.replace(/\b(Hz|s\.a\.s|a\.s|b|vzmh|bzmh|St|Dr|ca|z\.B|d\.h|bijv|vs|etc|c\.-à-d|p\.ex)\./g,m=>m.replace('.','\u0001')).replace(/\(s\.\)/g,m=>m.replace('.','\u0001'));
  return P.split(/(?<=[.!?])\s+/).map(x=>x.replace(/\u0001/g,'.').trim()).filter(Boolean);
}
export function cumleler(id){const k=kart[id];const o={};for(const l of LANGS)o[l]=bol(k.ozet[l]);return o;}
export function sayilarEsit(id){const c=cumleler(id);const n=c.tr.length;return LANGS.every(l=>c[l].length===n)?n:-1;}

export const t=(tr,fr,en,nl,de)=>({tr,fr,en,nl,de});
export const konuOf=id=>({ah:'ahlak',ib:'ibadet',it:'itikat',si:'siyer',ku:'kuran'}[id.slice(0,2)]);
export const soruBul=qid=>{const cid=qid.replace(/-\d+$/,'');const k=kart[cid];if(!k)throw new Error('kart yok '+qid);const q=k.sorular.find(s=>s.id===qid);if(!q)throw new Error('soru yok '+qid);return {k,q};};
export const bas=cid=>({...kart[cid].baslik});
export const secenek=(qid,i)=>{const {q}=soruBul(qid);return {...q.siklar[i]};};
export const dogruSecenek=qid=>{const {q}=soruBul(qid);return {...q.siklar[q.dogru]};};
export const govde=qid=>({...soruBul(qid).q.soru});
export const cum=(cid,i)=>{const n=sayilarEsit(cid);if(n<0)throw new Error('cümle sayısı eşit değil '+cid);const c=cumleler(cid);const o={};for(const l of LANGS)o[l]=c[l][i];return o;};
export function ilk(m){const o={};for(const l of LANGS){let s=bol(m[l])[0];s=s.replace(/\s*[:;].*$/,'').replace(/[.,]+$/,'');o[l]=s;}return o;}
export const adimMetin=id=>{const a=[...abdest.adimlar,...namaz.adimlar].find(x=>x.id===id);if(!a)throw new Error('adım yok '+id);return a;};
