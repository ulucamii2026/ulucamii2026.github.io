import { collection, doc, getDocs, runTransaction, serverTimestamp, Timestamp, type Firestore } from 'firebase/firestore/lite';
import { ETKINLIKLER } from './ogrenme-icerigi';
import { kaydiOku, tekrarBirlestir, type Tekrar } from './ogrenme-ilerleme';

export type OgrenmeDeposu = { oku:()=>Promise<Record<string,Tekrar>>; yaz:(id:string,kayit:Tekrar)=>Promise<Tekrar> };
const ids=new Set(ETKINLIKLER.map(e=>e.id));
const bugun=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels'}).format(new Date());
const temizle=(tekrar:unknown)=>kaydiOku(JSON.stringify({v:1,tekrar}),ids,bugun()).tekrar;
const belgeOku=(data:Record<string,unknown>)=>({...data,son:(data.son as Timestamp)?.toDate?.().toISOString().slice(0,10),sonraki:(data.sonraki as Timestamp)?.toDate?.().toISOString().slice(0,10)});

/** Her etkinlik tek belge: en fazla 65 kayıt. Kimlik, yanıt metni veya cihaz bilgisi tutulmaz. */
export function ogrenmeDeposu(db:Firestore,ref:string):OgrenmeDeposu {
 return {
  async oku(){
   const snap=await getDocs(collection(db,'evCalismalari',ref,'etkinlikler'));
   return temizle(Object.fromEntries(snap.docs.map(d=>[d.id,belgeOku(d.data())])));
  },
  async yaz(id,kayit){
   const yeni=temizle({[id]:kayit})[id];if(!yeni)throw new Error('Geçersiz etkinlik kaydı');
   const belge=doc(db,'evCalismalari',ref,'etkinlikler',id);
   return runTransaction(db,async tx=>{
    const once=await tx.get(belge);
    const eski=once.exists()?temizle({[id]:belgeOku(once.data()!)})[id]:undefined;
    const sonuc=tekrarBirlestir(eski,yeni);
    if(!eski||JSON.stringify(eski)!==JSON.stringify(sonuc))tx.set(belge,{...sonuc,son:Timestamp.fromDate(new Date(sonuc.son+'T12:00:00Z')),sonraki:Timestamp.fromDate(new Date(sonuc.sonraki+'T12:00:00Z')),guncelleme:serverTimestamp()});
    return sonuc;
   },{maxAttempts:3});
  },
 };
}
