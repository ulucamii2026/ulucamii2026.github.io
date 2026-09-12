import type { OgrenmeDeposu } from '../lib/ogrenme-bulut';
import type { Dil } from '../i18n/ui';
import { ETKINLIKLER, VELI_REHBERLERI, type Etkinlik } from '../lib/ogrenme-icerigi';
import { ogrenmeMetni } from '../i18n/ogrenme';
import { kaydiOku, gunlukSec, tekrarKaydet, bosKayit, type Tekrar, tekrarBirlestir } from '../lib/ogrenme-ilerleme';
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Secenek = { bulut?:OgrenmeDeposu; atanan?:string[]; dil:Dil; ogrenci:boolean; hesap:string; ref:string; ad:string; hafta:{tarih:string;konu:string}[]; oynat:(url:string)=>void; durdur:()=>void; yardim:(metin:string)=>void };
export function ogrenmeAtolyesi(kok:HTMLElement,o:Secenek):()=>void {
 const m=ogrenmeMetni(o.dil); const ids=new Set(ETKINLIKLER.map(a=>a.id));
 const bugun=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels'}).format(new Date());
 const atanan=ETKINLIKLER.filter(e=>o.atanan?.includes(e.id)).slice(0,3);
 const key=`ulucamii_ogrenme_v1:${encodeURIComponent(o.hesap.toLowerCase())}:${encodeURIComponent(o.ref)}`;
 let kalici=true; let k=bosKayit();
 let kapali=false, eslesiyor=false, bulutDurum=o.bulut?'eslesiyor':'yerel';
 let bekleyen:Record<string,Tekrar>={};
 try{bekleyen=kaydiOku(JSON.stringify({v:1,tekrar:JSON.parse(localStorage.getItem(key+':bekleyen')||'{}')}),ids,bugun()).tekrar;}catch{}
 try{k=kaydiOku(localStorage.getItem(key),ids,bugun()); const probe=key+':probe';localStorage.setItem(probe,'1');localStorage.removeItem(probe);}catch{kalici=false;}
 let sekme='bugun', aktif:Etkinlik|undefined, acik=false, cevap:number|undefined, degerlendi=false, seans:string[]=[], sira=0, bitti=false, arama='',alan='hepsi',not='';
 const tarih=(v:string)=>new Intl.DateTimeFormat(o.dil==='tr'?'tr-TR':o.dil==='fr'?'fr-BE':'en-GB',{dateStyle:'medium',timeZone:'Europe/Brussels'}).format(new Date(v+'T12:00:00Z'));
 const kaydet=()=>{try{localStorage.setItem(key,JSON.stringify(k));localStorage.setItem(key+':bekleyen',JSON.stringify(bekleyen));}catch{kalici=false;}};
 const durumYaz=()=>{const el=kok.querySelector('[data-bulut-durum]');if(el)el.textContent=m[bulutDurum as keyof typeof m];const btn=kok.querySelector<HTMLButtonElement>('[data-oa=esle]');if(btn)btn.disabled=eslesiyor;const sil=kok.querySelector<HTMLButtonElement>('[data-oa=sil]');if(sil)sil.disabled=eslesiyor;};
 async function esle(oku=true){
  if(!o.bulut||eslesiyor||kapali)return;eslesiyor=true;bulutDurum='eslesiyor';durumYaz();
  try{
   const uzak=oku?await o.bulut.oku():{};if(kapali)return;
   for(const [id,r] of Object.entries(uzak))k.tekrar[id]=tekrarBirlestir(k.tekrar[id],r);
   for(const id of Object.keys(bekleyen)){
    if(kapali)return;const gonderilen=bekleyen[id];
    const r=await o.bulut.yaz(id,gonderilen);if(kapali)return;
    k.tekrar[id]=tekrarBirlestir(k.tekrar[id],r);
    if(bekleyen[id]===gonderilen)delete bekleyen[id];kaydet();
   }
   bulutDurum='eslendi';kaydet();
  }catch{if(!kapali){bulutDurum='eslemeHata';kaydet();}}
  finally{eslesiyor=false;if(!kapali){
    const odak=document.activeElement as HTMLElement|null;
    if(!aktif&&!odak?.matches('input,select,textarea')){
     const sec=odak?.dataset.sekme?`[data-sekme="${odak.dataset.sekme}"]`:odak?.dataset.oa?`[data-oa="${odak.dataset.oa}"]`:undefined;ciz(sec);
    }else{durumYaz();}
    if(bulutDurum!=='eslemeHata'&&Object.keys(bekleyen).length)void esle();
   }}
 }
 const dugme=(eylem:string,metin:string,ek='')=>`<button type="button" class="oa-dugme" data-oa="${eylem}" ${ek}>${esc(metin)}</button>`;
 const kitaplik=()=>ETKINLIKLER.filter(a=>(alan==='hepsi'||a.alan===alan)&&`${a.baslik[o.dil]} ${a.soru[o.dil]} ${a.arapca||''}`.toLocaleLowerCase(o.dil).includes(arama.toLocaleLowerCase(o.dil)));
 const liste=(a:Etkinlik[])=>a.length?`<ul class="oa-liste">${a.map(e=>`<li><button type="button" data-oa="ac" data-id="${esc(e.id)}"><span><strong>${esc(e.baslik[o.dil])}</strong><small>${esc(m[e.alan])} · ${e.dakika} ${esc(m.dakika)}${k.tekrar[e.id]?` · ${esc(m.tekrarTarih)}: ${esc(tarih(k.tekrar[e.id].sonraki))}`:''}</small></span><span aria-hidden="true">${e.alan==='harf'?`<span lang="ar" class="oa-harf">${esc(e.arapca)}</span>`:'→'}</span></button></li>`).join('')}</ul>`:`<p>${esc(m.sonucYok)}</p>`;
 const haftalik=()=>`<details class="oa-hafta"><summary>${esc(m.hafta)}</summary>${o.hafta.length?`<ul>${o.hafta.map(g=>`<li>${esc(tarih(g.tarih))}: <span lang="tr">${esc(g.konu)}</span></li>`).join('')}</ul>`:`<p>${esc(m.plansiz)}</p>`}</details>`;
 const oneriler=()=>{const havuz=ETKINLIKLER.filter(e=>k.seviye==='birlikte'?e.alan!=='ezber':k.seviye==='bagimsiz'?e.alan!=='harf':true);return gunlukSec(havuz,k,bugun());};
 const canta=()=>`<fieldset class="oa-canta"><legend>${esc(m.canta)}</legend><p>${esc(m.cantaNot)}</p>${(['kitap','defter','kalem','odev'] as const).map(id=>`<label><input type="checkbox" data-canta="${id}" ${k.canta[bugun()+':'+id]?'checked':''}>${esc(m[id])}</label>`).join('')}</fieldset>`;
 const secenekler=(a:Etkinlik)=>{
  if(a.alan!=='harf')return (a.secenek||[]).map((s,i)=>({metin:s[o.dil],dogru:i===a.dogru}));
  const harfler=ETKINLIKLER.filter(e=>e.alan==='harf'), index=harfler.findIndex(e=>e.id===a.id);
  return [a,harfler[(index+1)%harfler.length],harfler[(index+7)%harfler.length]].map(e=>({metin:e.arapca!,dogru:e.id===a.id}));
 };
 // Doğru cevap aynı sütunda ezberlenmesin; sıralama etkinlik boyunca sabittir.
 const siraliSecenekler=(a:Etkinlik)=>{const s=secenekler(a);const n=Array.from(a.id+bugun()).reduce((x,c)=>x+c.charCodeAt(0),0)%Math.max(s.length,1);return [...s.slice(n),...s.slice(0,n)];};
 function etkinlikHtml(a:Etkinlik):string {
  const s=siraliSecenekler(a); const geriBildirim=cevap!==undefined?s[cevap]?.dogru:undefined;
  return `<div class="oa-calisma">${dugme('geri',m.geri)}${seans.length?`<p>${esc(m.seans)} · ${sira+1} / ${seans.length} ${esc(m.asama)}</p>`:''}<h3 tabindex="-1" data-baslik>${esc(a.baslik[o.dil])}</h3>
   ${a.alan!=='ezber'?`<p>${esc(a.metin[o.dil])}</p>`:''}<h4>${esc(m.dusun)}</h4><p>${esc(a.soru[o.dil])}</p>
   ${a.ses?dugme('dinle',m.dinle):''}
   ${s.length?`<div class="oa-cevaplar">${s.map((s,i)=>dugme('cevap',s.metin,`data-index="${i}" ${a.alan==='harf'?'lang="ar"':''} ${cevap!==undefined?'disabled':''} aria-pressed="${cevap===i}"`)).join('')}</div>`:''}
   ${cevap!==undefined?`<p role="status" class="oa-geribildirim"><b>${esc(geriBildirim?m.dogru:m.tekrarDene)}</b>${!geriBildirim?` ${esc(s.find(x=>x.dogru)?.metin)}`:''}</p>`:''}
   ${!acik?dugme('goster',m.metniAc):`<div class="oa-aciklama">${a.arapca?`<p class="oa-arapca" lang="ar" dir="rtl">${esc(a.arapca)}</p>`:''}${a.alan==='ezber'?`<p>${esc(a.metin[o.dil])}</p>`:''}<p>${esc(a.aciklama[o.dil])}</p><p>${esc(m.anlat)}</p><a href="${esc(a.kaynak)}" target="_blank" rel="noopener noreferrer">${esc(m.kaynak)}</a></div>`}
   ${acik?(degerlendi?`<p role="status">${esc(not)} ${k.tekrar[a.id]?`${esc(m.tekrarTarih)}: ${esc(tarih(k.tekrar[a.id].sonraki))}`:''}</p>${dugme('sonraki',seans.length&&sira+1<seans.length?m.sonraki:m.tamam)}`:`<fieldset class="oa-degerlendirme"><legend>${esc(m.nasil)}</legend>${(['destek','tekrar','rahat'] as const).map(v=>dugme('degerlendir',m[v],`data-deger="${v}"`)).join('')}</fieldset>`):''}
   ${cevap!==undefined&&!geriBildirim&&!degerlendi?dugme('yenidenDene',m.yenidenDene):''}${dugme('yardim',m.hoca)} ${dugme('mola',m.ara)}</div>`;
 }
 function ciz(odak?:string) {
  let govde='';
  if(aktif)govde=etkinlikHtml(aktif);
  else if(bitti)govde=`<div class="oa-bitis"><h3 tabindex="-1" data-baslik>${esc(m.tamam)}</h3><p>${esc(m.bitis)}</p>${dugme('geri',m.geri)}</div>`;
  else if(sekme==='bugun'){
   const oneri=oneriler().map(id=>ETKINLIKLER.find(e=>e.id===id)!);
   govde=`<div class="oa-gunluk"><div><p>${esc(o.ogrenci?m.aciklama:m.aileOneri)}</p><label class="oa-seviye">${esc(m.hedef)}<select data-seviye>${(['birlikte','gelisen','bagimsiz'] as const).map(s=>`<option value="${s}" ${s===k.seviye?'selected':''}>${esc(m[s])}</option>`).join('')}</select></label><p class="oa-not">${esc(m.hedefNot)}</p><p>${esc(m.oneri)}</p>${oneri.length?dugme('basla',`${m.basla} · ${oneri.reduce((n,a)=>n+a.dakika,0)} ${m.dakika}`):`<p>${esc(m.bekle)}</p>`}</div><div>${liste(oneri)}</div></div>${atanan.length?`<section class="oa-atama"><h3>${esc(m.hocaAtama)}</h3><p>${esc(m.atamaNot)}</p>${liste(atanan)}</section>`:''}${haftalik()}${!o.ogrenci?`<details><summary>${esc(m.canta)}</summary>${canta()}</details>`:''}`;
  } else if(sekme==='kutuphane')govde=`<h3>${esc(m.kutuphane)}</h3><div class="oa-filtre"><label>${esc(m.araEt)}<input data-ara type="search" value="${esc(arama)}"></label><label>${esc(m.alan)}<select data-alan>${(['hepsi','harf','ezber','bilgi','hayat'] as const).map(a=>`<option value="${a}" ${alan===a?'selected':''}>${esc(m[a])}</option>`).join('')}</select></label></div><div data-sonuclar>${liste(kitaplik())}</div>`;
  else if(sekme==='aile')govde=`<h3>${esc(m.aile)}</h3><p>${esc(m.aileOneri)}</p><div class="oa-rehber">${VELI_REHBERLERI.map(([b,t])=>`<details><summary>${esc(b[o.dil])}</summary><p>${esc(t[o.dil])}</p></details>`).join('')}</div>${canta()}${dugme('yardim',m.hoca)} ${dugme('yazdir',m.yazdir)}`;
  else govde=`<h3>${esc(m.takip)}</h3><p>${esc(o.bulut?m.hesapNot:m.yerel)}</p>${Object.keys(k.tekrar).length?liste(ETKINLIKLER.filter(a=>k.tekrar[a.id]).sort((a,b)=>k.tekrar[a.id].sonraki.localeCompare(k.tekrar[b.id].sonraki))):`<p>${esc(m.henuz)}</p>`}${dugme('sil',m.temiz,eslesiyor?'disabled':'')}`;
  kok.innerHTML=`<div class="oa-bas"><h2>${esc(o.ogrenci?m.ogrenci:m.baslik)}</h2><p>${esc(m.aciklama)}</p></div><nav class="oa-nav" aria-label="${esc(m.baslik)}">${(['bugun','kutuphane','aile','takip'] as const).map(s=>dugme('sekme',m[s],`data-sekme="${s}" aria-pressed="${sekme===s&&!aktif&&!bitti}"`)).join('')}</nav><div class="oa-govde">${govde}</div><p class="oa-not">${esc(kalici?(o.bulut?m.hesapNot:m.yerel):m.kayitYok)}</p>${o.bulut?`<div class="oa-esleme"><p role="status" data-bulut-durum>${esc(m[bulutDurum as keyof typeof m])}</p>${dugme('esle',m.esle,eslesiyor?'disabled':'')}</div>`:''}`;
  if(odak)kok.querySelector<HTMLElement>(odak)?.focus({preventScroll:true});
 }
 function ac(id:string){o.durdur();aktif=ETKINLIKLER.find(a=>a.id===id);acik=false;cevap=undefined;degerlendi=false;not='';bitti=false;ciz('[data-baslik]');}
 const ctl=new AbortController();
 kok.addEventListener('click',e=>{
  const btn=(e.target as Element).closest<HTMLButtonElement>('[data-oa]'); if(!btn)return;e.stopPropagation();
  switch(btn.dataset.oa){
   case 'sekme': o.durdur();sekme=btn.dataset.sekme!;aktif=undefined;bitti=false;seans=[];ciz(`[data-sekme="${sekme}"]`);break;
   case 'ac': seans=[];ac(btn.dataset.id!);break;
   case 'basla':seans=oneriler();sira=0;if(seans.length)ac(seans[0]);break;
   case 'geri':case 'mola':o.durdur();aktif=undefined;bitti=false;seans=[];ciz('[data-sekme="bugun"]');break;
   case 'dinle':if(aktif?.ses)o.oynat(aktif.ses);break;
   case 'goster':acik=true;ciz('[data-deger="destek"]');break;
   case 'cevap':if(aktif&&cevap===undefined){cevap=Number(btn.dataset.index);acik=true;ciz('[data-deger="destek"]');}break;
   case 'degerlendir':if(aktif&&!degerlendi&&acik){const yeni=tekrarKaydet(k,aktif.id,btn.dataset.deger as Tekrar['cevap'],bugun());not=yeni?m.kaydedildi:m.zaten;degerlendi=true;if(yeni&&o.bulut)bekleyen[aktif.id]={...k.tekrar[aktif.id]};kaydet();ciz('[data-oa="sonraki"]');void esle(false);}break;
   case 'sonraki':o.durdur();if(seans.length&&sira+1<seans.length)ac(seans[++sira]);else{aktif=undefined;bitti=true;ciz('[data-baslik]');}break;
   case 'yenidenDene':cevap=undefined;acik=false;ciz('[data-oa=cevap]');break;
   case 'yardim':o.yardim(aktif?m.taslak.replace('…',aktif.baslik[o.dil]):m.taslak);break;
   case 'esle':void esle();break;
   case 'sil':if(!eslesiyor&&window.confirm(o.bulut?m.eminBulut:m.emin)){k=bosKayit();bekleyen={};kaydet();ciz('[data-oa="sil"]');}break;
   case 'yazdir':yazdir();break;
  }
 },{signal:ctl.signal});
 kok.addEventListener('input',e=>{const t=e.target as HTMLInputElement;if(!t.matches('[data-ara]'))return;arama=t.value;const results=kok.querySelector('[data-sonuclar]');if(results)results.innerHTML=liste(kitaplik());},{signal:ctl.signal});
 kok.addEventListener('change',e=>{const t=e.target as HTMLInputElement;
  if(t.matches('[data-seviye]')){if(['birlikte','gelisen','bagimsiz'].includes(t.value)){k.seviye=t.value as typeof k.seviye;kaydet();ciz('[data-seviye]');}}
  if(t.matches('[data-alan]')){alan=t.value;ciz('[data-alan]');}
  if(t.dataset.canta){k.canta[bugun()+':'+t.dataset.canta]=t.checked;kaydet();}
 },{signal:ctl.signal});
 function yazdir(){
  const frame=document.createElement('iframe');frame.title=m.yazdir;frame.style.cssText='position:fixed;width:1px;height:1px;inset:0;border:0';document.body.append(frame);
  const doc=frame.contentDocument;if(!doc){frame.remove();return;}
  const rows=Array.from({length:7},()=>`<tr><td> </td><td> </td><td> </td></tr>`).join('');
  doc.open();doc.write(`<!doctype html><html lang="${o.dil}"><head><meta charset="utf-8"><title>${esc(m.yazdir)}</title><style>body{font:18px/1.5 sans-serif;color:#111;margin:24px}h1{font-size:26px}table{border-collapse:collapse;width:100%;margin-top:20px}td,th{border:1px solid #555;padding:12px;height:34px}p{max-width:70ch}@page{size:A4;margin:18mm}</style></head><body><h1>Ulu Camii — ${esc(m.seans)}</h1><p>${esc(o.ad)} · ${esc(tarih(bugun()))}</p><p>${esc(m.aileOneri)}</p><h2>${esc(m.hafta)}</h2>${o.hafta.length?`<ul>${o.hafta.map(g=>`<li>${esc(tarih(g.tarih))}: <span lang="tr">${esc(g.konu)}</span></li>`).join('')}</ul>`:`<p>${esc(m.plansiz)}</p>`}<p>${esc(m.yazili)}</p><table aria-label="${esc(m.yazili)}"><tbody>${rows}</tbody></table><p>${esc(m.canta)}: ${esc(m.kitap)}, ${esc(m.defter)}, ${esc(m.kalem)}, ${esc(m.odev)}.</p><p>${esc(m.bitis)}</p></body></html>`);doc.close();
  frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),1000);
 }
 window.addEventListener('online',()=>{void esle();},{signal:ctl.signal});
 ciz();void esle();return ()=>{kapali=true;ctl.abort();};
}
