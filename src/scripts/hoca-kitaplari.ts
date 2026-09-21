import kitaplar from '../data/hoca-kitaplari.json';

type Kitap = (typeof kitaplar)[number];
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const ozet = async (bytes: ArrayBuffer) => hex(await crypto.subtle.digest('SHA-256', bytes));
const kac = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export function kitaplarHtml(): string {
  return `<section class="bolum" data-hoca-kitaplari><h2>Ders kitapları</h2>
    <p class="kucuk">Camiye Gidiyorum kitaplarını ders hazırlığı için indirebilirsiniz. Büyük dosyalarda indirme biraz zaman alabilir.</p>
    <ul class="liste">${kitaplar.map(k => `<li><div class="buyu"><b>${kac(k.ad)}</b><p class="kucuk">${kac(k.surum)} · ${k.sayfa} sayfa · ${(k.bayt / 1024 / 1024).toLocaleString('tr-TR',{maximumFractionDigits:1})} MB · PDF</p></div>
      <button type="button" class="dugme dugme-ikincil" data-kitap-indir="${k.id}" aria-label="${kac(k.ad + ' — ' + k.surum + ' PDF indir')}">PDF indir</button></li>`).join('')}</ul>
    <p class="kucuk" role="status" aria-live="polite" data-kitap-durum></p>
    <button type="button" class="kucuk-dugme" data-kitap-iptal hidden>İndirmeyi iptal et</button></section>`;
}

/** Anahtar yalnız mevcut hoca oturumuyla sunucudan alınır; tarayıcıda kalıcı saklanmaz. */
export async function kitapCoz(k: Kitap, anahtar: string, signal: AbortSignal, ilerleme: (yuzde:number)=>void): Promise<Blob> {
  if (!/^[0-9a-f]{64}$/.test(anahtar)) throw new Error('kitap-anahtari');
  const raw = Uint8Array.from(anahtar.match(/../g)!, b => parseInt(b,16));
  const key = await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
  raw.fill(0);
  const pieces: ArrayBuffer[]=[];
  for (const [i,part] of k.parcalar.entries()) {
    signal.throwIfAborted();
    const response=await fetch(part.yol,{signal,cache:'no-store',credentials:'same-origin'});
    if (!response.ok) throw new Error('kitap-indirme');
    const cipher=await response.arrayBuffer();
    if (await ozet(cipher)!==part.sha256) throw new Error('kitap-butunluk');
    pieces.push(await crypto.subtle.decrypt({name:'AES-GCM',iv:cipher.slice(0,12),additionalData:new TextEncoder().encode(`${k.id}:${i}`)},key,cipher.slice(12)));
    ilerleme(Math.round((i+1)/k.parcalar.length*100));
  }
  signal.throwIfAborted();
  const blob=new Blob(pieces,{type:'application/pdf'});
  if (blob.size!==k.bayt || await ozet(await blob.arrayBuffer())!==k.sha256) throw new Error('kitap-butunluk');
  signal.throwIfAborted();
  return blob;
}

export function hocaKitaplari(kok: HTMLElement, anahtariOku: (id:string)=>Promise<string>): ()=>void {
  const durum=kok.querySelector<HTMLElement>('[data-kitap-durum]')!;
  const iptal=kok.querySelector<HTMLButtonElement>('[data-kitap-iptal]')!;
  let controller: AbortController | null=null;
  let kapali=false;
  const iptalEt=()=>controller?.abort();
  const tikla=async (ev:Event)=>{
    const button=(ev.target as HTMLElement).closest<HTMLButtonElement>('[data-kitap-indir]');
    if(!button || controller) return;
    const kitap=kitaplar.find(k=>k.id===button.dataset.kitapIndir);if(!kitap)return;
    const task=new AbortController();controller=task;
    const buttons=kok.querySelectorAll<HTMLButtonElement>('[data-kitap-indir]');
    buttons.forEach(b=>b.disabled=true);iptal.hidden=false;
    durum.textContent='Hoca erişimi doğrulanıyor…';
    try {
      const key=await anahtariOku(kitap.id);task.signal.throwIfAborted();
      const blob=await kitapCoz(kitap,key,task.signal,p=>{if(!kapali)durum.textContent=`${kitap.ad} indiriliyor… %${p}`;});
      task.signal.throwIfAborted();
      const url=URL.createObjectURL(blob);const a=document.createElement('a');
      a.href=url;a.download=kitap.dosyaAdi;document.body.append(a);a.click();a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),60_000);
      durum.textContent=`${kitap.ad} hazır. Dosyayı cihazınızın indirilenler bölümünden açabilirsiniz.`;
    } catch {
      if(!kapali)durum.textContent=task.signal.aborted?'İndirme iptal edildi.':'Kitap indirilemedi. Bağlantınızı ve hoca oturumunuzu kontrol edip yeniden deneyin.';
    } finally {
      controller=null;
      if(!kapali){buttons.forEach(b=>b.disabled=false);iptal.hidden=true;}
    }
  };
  kok.addEventListener('click',tikla);iptal.addEventListener('click',iptalEt);
  return ()=>{kapali=true;iptalEt();kok.removeEventListener('click',tikla);iptal.removeEventListener('click',iptalEt);};
}
