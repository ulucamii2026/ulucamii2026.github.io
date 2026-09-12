export type Tekrar = { son: string; sonraki: string; basamak: number; cevap: 'destek'|'tekrar'|'rahat' };
export type OgrenmeKaydi = { v:1; tekrar: Record<string,Tekrar>; canta: Record<string,boolean>; seviye: 'birlikte'|'gelisen'|'bagimsiz' };
export const bosKayit = ():OgrenmeKaydi => ({v:1,tekrar:{},canta:{},seviye:'birlikte'});
export const gunGecerli = (d:unknown): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0,10)===d;
export const tarihEkle = (d:string,n:number) => new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
/** İki cihaz aynı gün çalışırsa daha çok destek isteyen kayıt korunur; basamak şişmez. */
export function tekrarBirlestir(a:Tekrar|undefined,b:Tekrar):Tekrar {
 if(!a||a.son<b.son)return {...b};
 if(a.son>b.son)return {...a};
 const sira={destek:0,tekrar:1,rahat:2};
 const cevap=sira[a.cevap]<=sira[b.cevap]?a.cevap:b.cevap;
 return {son:a.son,sonraki:a.sonraki<b.sonraki?a.sonraki:b.sonraki,basamak:Math.min(a.basamak,b.basamak),cevap};
}
export function kaydiOku(raw:string|null, ids:ReadonlySet<string>, bugun:string):OgrenmeKaydi {
 const k=bosKayit(); try { const x=JSON.parse(raw||'null'); if(x?.v!==1)return k;
 if(['birlikte','gelisen','bagimsiz'].includes(x.seviye))k.seviye=x.seviye;
 for(const [id,r] of Object.entries(x.tekrar||{})) { const t=r as Tekrar; if(ids.has(id)&&t&&gunGecerli(t.son)&&gunGecerli(t.sonraki)&&t.son<=bugun&&t.sonraki>=t.son&&t.sonraki<=tarihEkle(t.son,30)&&Number.isInteger(t.basamak)&&t.basamak>=0&&t.basamak<=3&&['destek','tekrar','rahat'].includes(t.cevap)) k.tekrar[id]={son:t.son,sonraki:t.sonraki,basamak:t.basamak,cevap:t.cevap}; }
 for(const [id,v] of Object.entries(x.canta||{})) if(/^\d{4}-\d{2}-\d{2}:(kitap|defter|kalem|odev)$/.test(id)&&typeof v==='boolean'&&id.slice(0,10)>=tarihEkle(bugun,-14)&&id.slice(0,10)<=tarihEkle(bugun,14))k.canta[id]=v;
 }catch{} return k;
}
/** Öz değerlendirme planıdır; puan veya öğretmen yeterlilik kaydı değildir. */
export function tekrarKaydet(k:OgrenmeKaydi,id:string,cevap:Tekrar['cevap'],bugun:string):boolean {
 if(!gunGecerli(bugun)||!['destek','tekrar','rahat'].includes(cevap))return false;
 const eski=k.tekrar[id]; if(eski?.son===bugun)return false;
 const basamak=cevap==='rahat'?Math.min(3,(eski?.basamak||0)+1):cevap==='tekrar'?1:0;
 k.tekrar[id]={son:bugun,sonraki:tarihEkle(bugun,[1,1,3,7][basamak]),basamak,cevap}; return true;
}
export function gunlukSec(ids:{id:string;alan:string}[],k:OgrenmeKaydi,bugun:string):string[]{
 const aday=ids.filter(a=>k.tekrar[a.id]?.son!==bugun && (!k.tekrar[a.id]||k.tekrar[a.id].sonraki<=bugun));
 aday.sort((a,b)=>Number(!k.tekrar[a.id])-Number(!k.tekrar[b.id]) || (k.tekrar[a.id]?.sonraki||'').localeCompare(k.tekrar[b.id]?.sonraki||''));
 const sec:string[]=[]; const alanlar=new Set<string>();
 for(const a of aday)if(!alanlar.has(a.alan)&&sec.length<3){sec.push(a.id);alanlar.add(a.alan);}
 for(const a of aday)if(sec.length<3&&!sec.includes(a.id))sec.push(a.id);
 return sec;
}
