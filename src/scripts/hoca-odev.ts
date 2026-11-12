import { ETKINLIKLER } from '../lib/ogrenme-icerigi';
import { odevHaftalari, odevTaslagi, odevMetni, planEzberleri, ODEV_DILLERI, ODEV_KALIPLARI, odevKalibiSec, odevHatasi, type HaftalikOdev, type OdevPlanGunu, type OdevDil } from '../lib/haftalik-odev';
import type { MakineCevirici } from '../lib/defter-ceviri';
import { bultenEsc as e } from './bulten-gorunumu';
import { tO, type OdevAnahtar } from '../i18n/hoca-metin/odev';
import { hocaDili, hocaYerel } from '../i18n/hoca';

type Ogrenci = { ref: string; ad: string; soyad: string; durum?: string };
const dilAdi = { tr: tO('dil.tr'), fr: tO('dil.fr'), en: tO('dil.en') };
const dilK = { tr: tO('dilk.tr'), fr: tO('dilk.fr'), en: tO('dilk.en') };
/** Kalıp düğmesi: Türkçede özgün ad; başka dilde çevrilmiş ad + kaydedilecek Türkçe cümle (kayıt metni çevrilmez, görünür kalır). */
const kalipEtiket = (x: (typeof ODEV_KALIPLARI)[number]) => {
  const ad = tO(`kalip.${x.id}` as OdevAnahtar);
  return hocaDili() === 'tr' ? e(ad) : `${e(ad)}<br><span class="kucuk" lang="tr">${e(x.metin.tr)}</span>`;
};
const tarihYaz = (t: string) => new Intl.DateTimeFormat(hocaYerel(), { day: 'numeric', month: 'long', weekday: 'short', timeZone: 'Europe/Brussels' }).format(new Date(t + 'T12:00:00Z'));

export function hocaOdevi(root: HTMLElement, opt: {
  gunler: OdevPlanGunu[]; hafta: number; bugun: string; kayitlar: Partial<HaftalikOdev>[];
  materyalGunleri: string[]; materyalYolu: string; ogrenciler: Ogrenci[]; cevir: MakineCevirici;
  kaydet: (kayit: HaftalikOdev) => Promise<void>; sil: (tarih: string) => Promise<void>;
  haftaDegisti: (hafta: number) => void;
  git: (sekme: 'defter' | 'ogrenci' | 'bulten', deger?: string) => Promise<void>;
}) {
  const ac = new AbortController();
  const haftalar = odevHaftalari(opt.gunler);
  if (!haftalar.length) { root.innerHTML = `<p role="status">${tO('plan.yok')}</p>`; return { ayrilabilir: () => true, temizle: () => ac.abort() }; }
  let hafta = haftalar.find(h => h.hafta === opt.hafta) || haftalar[0];
  let kayitlar = [...opt.kayitlar], mesgul = false, kapali = false, mesaj = '', onizlemeDili: OdevDil = 'tr';
  const mevcut = () => kayitlar.find(k => k.tarih === hafta.tarih);
  const materyal = () => {
    const gun = hafta.gunler.find(g => opt.materyalGunleri.includes(g.tarih));
    return gun ? location.origin + opt.materyalYolu + '#g-' + gun.tarih : '';
  };
  let taslak = odevTaslagi(hafta, mevcut(), materyal());
  let ilk = JSON.stringify(taslak);
  const form = () => root.querySelector<HTMLFormElement>('form[data-form=odev]')!;
  const oku = (): HaftalikOdev => {
    if (!form()) return taslak;
    const fd = new FormData(form());
    const al = (k: string) => String(fd.get(k) || '').trim();
    return { ...taslak, ezber: { tr: al('ezberTr'), fr: al('ezberFr'), en: al('ezberEn') }, odev: { tr: al('odevTr'), fr: al('odevFr'), en: al('odevEn') }, materyal: al('materyal'), etkinlikler: fd.getAll('etkinlik').map(String).filter(Boolean), yayin: fd.get('yayin') === 'on' };
  };
  const kirli = () => JSON.stringify(oku()) !== ilk;
  const bildir = (s: string) => { mesaj = s; const el = root.querySelector('[data-ho-durum]'); if (el) el.textContent = s; };
  const ayrilabilir = () => {
    if (mesgul) { bildir(tO('islem.suruyor')); return false; }
    return !kirli() || confirm(tO('ayril.onay'));
  };
  const onizle = () => {
    const k = oku(), d = onizlemeDili;
    const et = ETKINLIKLER.filter(x => k.etkinlikler.includes(x.id));
    const eksik = (['ezber', 'odev'] as const).filter(a => !k[a][d] && odevMetni(k[a], d));
    return `<p class="kucuk">${tO(mevcut()?.yayin ? 'onizle.yayinda' : 'onizle.taslak', { dil: e(dilK[d]) })}</p>${eksik.length ? `<p class="not">${tO('onizle.eksik', { dil: e(dilK[d]), alanlar: eksik.map(a => tO(a === 'ezber' ? 'alanAd.ezber' : 'alanAd.odev')).join(', ') })}</p>` : ''}<div class="ho-veli-metin" lang="${d}"><h4>${({tr:'Ezber',fr:'Mémorisation',en:'Memorisation'})[d]}</h4><p>${e(odevMetni(k.ezber, d) || '—')}</p><h4>${({tr:'Ödev ve tekrar',fr:'Devoirs et révisions',en:'Homework and revision'})[d]}</h4><p>${e(odevMetni(k.odev, d) || '—')}</p>${et.length ? `<ul>${et.map(x => `<li>${e(x.baslik[d])} · ${x.dakika} dk</li>`).join('')}</ul>` : ''}${/^https?:\/\//i.test(k.materyal) ? `<a href="${e(k.materyal)}" target="_blank" rel="noopener noreferrer">${({tr:'Ders materyallerini aç',fr:'Ouvrir les supports de cours',en:'Open course materials'})[d]}</a>` : ''}</div>`;
  };
  const guncelle = () => {
    taslak = oku();
    root.querySelectorAll<HTMLButtonElement>('[data-ho-kalip]').forEach(b => b.setAttribute('aria-pressed', String(taslak.odev.tr.includes(ODEV_KALIPLARI.find(k => k.id === b.dataset.hoKalip)!.metin.tr))));
    const secimler = root.querySelectorAll<HTMLSelectElement>('[name=etkinlik]');
    secimler.forEach(s => [...s.options].forEach(o => { o.disabled = Boolean(o.value && o.value !== s.value && taslak.etkinlikler.includes(o.value)); }));
    const sayi = root.querySelector('[data-ho-etkinlik-ozet]');
    if (sayi) sayi.textContent = tO('etk.ozet', { n: taslak.etkinlikler.length, dk: ETKINLIKLER.filter(x => taslak.etkinlikler.includes(x.id)).reduce((n,x) => n+x.dakika,0) });
    const preview = root.querySelector('[data-ho-onizleme]'); if (preview) preview.innerHTML = onizle();
    const kaydet = root.querySelector<HTMLButtonElement>('[type=submit]');
    if (kaydet) kaydet.textContent = taslak.yayin ? (mevcut()?.yayin ? tO('kaydet.yayinGuncelle') : tO('kaydet.yayimla')) : (mevcut()?.yayin ? tO('kaydet.yayindanKaldir') : tO('kaydet.taslak'));
  };
  const metinleriYaz = () => {
    for (const alan of ['ezber', 'odev'] as const) for (const dil of ODEV_DILLERI) {
      const t = form().elements.namedItem(alan + dil[0].toUpperCase() + dil.slice(1)) as HTMLTextAreaElement;
      t.value = taslak[alan][dil];
    }
    guncelle();
  };
  const kilitle = (v: boolean) => {
    mesgul = v;
    root.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement>('input,button,select,textarea').forEach(x => { if (v) { x.dataset.hoOnceDisabled = String(x.disabled); x.disabled = true; } else { x.disabled = x.dataset.hoOnceDisabled === 'true'; delete x.dataset.hoOnceDisabled; } });
    root.setAttribute('aria-busy', String(v));
  };
  const ciz = () => {
    root.setAttribute('aria-busy', 'false');
    const k = taslak, i = haftalar.indexOf(hafta), kayit = mevcut();
    const buHafta = haftalar.find(h => h.gunler.some(g => g.tarih >= opt.bugun)) || haftalar.at(-1)!;
    const onceki = haftalar.slice(0,i).reverse().find(h => kayitlar.some(k => k.tarih === h.tarih));
    const alan = (ad: 'ezber' | 'odev', dil: OdevDil) => `<label>${tO(ad === 'ezber' ? 'alan.ezber' : 'alan.odev', { dil: dil.toUpperCase() })}<textarea name="${ad}${dil[0].toUpperCase()+dil.slice(1)}" lang="${dil}" maxlength="1000" rows="3">${e(k[ad][dil])}</textarea></label>`;
    root.innerHTML = `<header class="ho-baslik"><h2>${tO('baslik')}</h2><p>${tO('giris')}</p></header>
      <div class="ho-hafta"><label>${tO('hafta')}<select data-hafta>${haftalar.map(h => { const r = kayitlar.find(k => k.tarih === h.tarih); return `<option value="${h.hafta}" ${h.hafta===hafta.hafta?'selected':''}>${tO('haftaSecenek', { n: h.hafta, tarih: e(tarihYaz(h.tarih)), durum: r ? r.yayin ? tO('durum.yayinda') : tO('durum.taslak') : tO('durum.hazirlanmadi') })}</option>`; }).join('')}</select></label><div class="ho-dugmeler" role="group" aria-label="${tO('gecis')}"><button type="button" class="kucuk-dugme" data-ho-hafta="${haftalar[i-1]?.hafta || ''}" ${i===0?'disabled':''}>${tO('onceki')}</button><button type="button" class="kucuk-dugme" data-ho-hafta="${haftalar[i+1]?.hafta || ''}" ${i===haftalar.length-1?'disabled':''}>${tO('sonraki')}</button><button type="button" class="kucuk-dugme" data-ho-hafta="${buHafta.hafta}" ${hafta===buHafta?'disabled':''}>${tO('guncel')}</button></div></div>
      <p class="ho-kayit-durumu"><strong>${kayit ? kayit.yayin ? tO('durum.yayinda') : tO('durum.taslak') : tO('durum.kaydedilmedi')}</strong> · ${tO('dersGunu', { n: hafta.gunler.length })}${kayit?.guncelleme && !Number.isNaN(Date.parse(kayit.guncelleme)) ? ` · ${tO('sonKayit', { tarih: e(new Intl.DateTimeFormat(hocaYerel(),{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Brussels'}).format(new Date(kayit.guncelleme))) })}` : ''}</p>
      <details class="ho-plan"><summary>${tO('plan.ozet')}</summary>${hafta.gunler.map(g => `<div class="ho-plan-gun"><strong>${e(tarihYaz(g.tarih))}</strong><ul>${g.dersler.map(d => `<li>${e(d.konu)}${d.ezber.length ? ` · ${tO('plan.ezber', { liste: e(d.ezber.join(', ')) })}` : ''}</li>`).join('')}</ul><button type="button" class="kucuk-dugme" data-ho-defter="${g.tarih}">${tO('plan.defterAc')}</button></div>`).join('')}<button type="button" class="kucuk-dugme" data-ho-bulten>${tO('plan.bultenAc')}</button></details>
      <form data-form="odev"><div class="ho-dugmeler"><button type="button" class="kucuk-dugme" data-ho-plan>${tO('plan.al')}</button>${onceki ? `<button type="button" class="kucuk-dugme" data-ho-kopyala>${tO('kopyala', { n: onceki.hafta })}</button>` : ''}</div>
      <div class="ho-metinler">${alan('ezber','tr')}${alan('odev','tr')}</div>
      <fieldset class="ho-kaliplar"><legend>${tO('kalip.baslik')}</legend><p class="kucuk">${tO('kalip.ipucu')}</p><div class="ho-dugmeler">${ODEV_KALIPLARI.map(x => `<button type="button" class="kucuk-dugme" data-ho-kalip="${x.id}" aria-pressed="${k.odev.tr.includes(x.metin.tr)}">${kalipEtiket(x)}</button>`).join('')}</div></fieldset>
      <details class="ho-ceviriler" ${k.ezber.fr||k.odev.fr?'open':''}><summary>${tO('fr.ozet')}</summary><p class="kucuk">${tO('fr.ipucu')}</p><button type="button" class="kucuk-dugme" data-ho-cevir>${tO('fr.cevir')}</button><div class="ho-metinler">${alan('ezber','fr')}${alan('odev','fr')}</div></details>
      <details class="ho-ceviriler" ${k.ezber.en||k.odev.en?'open':''}><summary>${tO('en.ozet')}</summary><div class="ho-metinler">${alan('ezber','en')}${alan('odev','en')}</div></details>
      <fieldset class="ho-etkinlikler"><legend>${tO('etk.baslik')}</legend><p class="kucuk">${tO('etk.ipucu')}</p><div class="ho-etkinlik-secim">${[0,1,2].map(i => `<label>${tO('etk.sira', { n: i+1 })}<select name="etkinlik"><option value="">${tO('etk.yok')}</option>${['harf','ezber','bilgi','hayat'].map(alan => `<optgroup label="${tO(`etk.alan.${alan}` as OdevAnahtar)}">${ETKINLIKLER.filter(x=>x.alan===alan).map(x=>`<option value="${x.id}" ${k.etkinlikler[i]===x.id?'selected':''}>${e(x.baslik[hocaDili()] || x.baslik.tr)} · ${tO('dk', { n: x.dakika })}</option>`).join('')}</optgroup>`).join('')}</select></label>`).join('')}</div><p data-ho-etkinlik-ozet class="kucuk"></p></fieldset>
      <label>${tO('materyal')}<input type="url" name="materyal" maxlength="2000" value="${e(k.materyal)}" placeholder="https://…"></label>${materyal() ? `<button type="button" class="kucuk-dugme" data-ho-materyal>${tO('materyal.kullan')}</button>` : ''}
      <details class="ho-onizleme"><summary>${tO('onizleme.ozet')}</summary><label>${tO('onizleme.dil')}<select data-ho-dil>${ODEV_DILLERI.map(d => `<option value="${d}" ${d===onizlemeDili?'selected':''}>${dilAdi[d]}</option>`).join('')}</select></label><div data-ho-onizleme></div></details>
      <label class="satir ho-yayin"><input type="checkbox" name="yayin" ${k.yayin?'checked':''}> ${tO('yayimla')}</label><p class="kucuk">${tO('yayin.ipucu')}</p>
      <p data-ho-durum role="status" tabindex="-1">${e(mesaj)}</p><div class="ho-kaydet"><button type="submit" class="dugme dugme-birincil">${tO('kaydet')}</button>${kayit ? `<button type="button" class="kucuk-dugme" data-ho-geri>${tO('geri')}</button>` : ''}</div>
      ${kayit ? `<details class="ho-sil"><summary>${tO('sil.ozet')}</summary><p>${tO('sil.aciklama')}</p><button type="button" class="baglanti-dugme" data-ho-sil>${tO('sil.dugme')}</button></details>` : ''}</form>
      <section class="ho-takip"><h3>${tO('takip.baslik')}</h3><p>${tO('takip.aciklama')}</p><label>${tO('ogrenci')}<select data-ho-ogr><option value="">${tO('ogrenciSec')}</option>${opt.ogrenciler.filter(o=>o.durum!=='pasif').map(o=>`<option value="${e(o.ref)}">${e(o.ad+' '+o.soyad)}</option>`).join('')}</select></label><button type="button" class="kucuk-dugme" data-ho-takip>${tO('takip.ac')}</button></section>`;
    guncelle();
  };
  const haftaAc = (n: number) => {
    const yeni = haftalar.find(h=>h.hafta===n);
    if (!yeni || yeni===hafta) return;
    if (!ayrilabilir()) { root.querySelector<HTMLSelectElement>('[data-hafta]')!.value=String(hafta.hafta); return; }
    hafta=yeni; opt.haftaDegisti(n); taslak=odevTaslagi(hafta,mevcut(),materyal()); ilk=JSON.stringify(taslak); mesaj=''; ciz(); root.querySelector<HTMLElement>('[data-hafta]')?.focus();
  };
  root.addEventListener('input', ev => { if (mesgul || !(ev.target as HTMLElement).closest('form')) return; guncelle(); bildir(tO('mesaj.degisiklik')); }, {signal:ac.signal});
  root.addEventListener('change', ev => {
    ev.stopPropagation(); const t=ev.target as HTMLSelectElement;
    if (mesgul) return;
    if (t.matches('[data-hafta]')) { haftaAc(Number(t.value)); return; }
    if (t.matches('[data-ho-dil]')) { onizlemeDili=t.value as OdevDil; guncelle(); return; }
    if (t.closest('form')) {
      guncelle();
      if(t.name==='etkinlik'&&t.value&&taslak.odev.tr.includes(ODEV_KALIPLARI.find(k=>k.yok)!.metin.tr)) {
        taslak.odev=odevKalibiSec(taslak.odev,'yok');metinleriYaz();
      }
      bildir(tO('mesaj.degisiklik'));
    }
  }, {signal:ac.signal});
  root.addEventListener('click', async ev => {
    const b=(ev.target as HTMLElement).closest<HTMLButtonElement>('button'); if(!b || mesgul) return;
    if (b.hasAttribute('data-ho-hafta')) { haftaAc(Number(b.dataset.hoHafta)); return; }
    if (b.hasAttribute('data-ho-defter') || b.hasAttribute('data-ho-bulten') || b.hasAttribute('data-ho-takip')) {
      const hedef = b.hasAttribute('data-ho-defter') ? 'defter' : b.hasAttribute('data-ho-bulten') ? 'bulten' : 'ogrenci';
      const deger = hedef==='ogrenci' ? root.querySelector<HTMLSelectElement>('[data-ho-ogr]')!.value : b.dataset.hoDefter;
      if(hedef==='ogrenci'&&!deger) { bildir(tO('mesaj.ogrenciSec')); root.querySelector<HTMLElement>('[data-ho-ogr]')?.focus(); return; }
      if(!ayrilabilir())return;
      kilitle(true);
      try{await opt.git(hedef,deger);}catch{if(!kapali){kilitle(false);bildir(tO('mesaj.bolumAcilamadi'));}}
      return;
    }
    if (b.hasAttribute('data-ho-kalip')) {
      taslak=oku(); const yeni=odevKalibiSec(taslak.odev,b.dataset.hoKalip!);
      if(Object.values(yeni).some(s=>s.length>1000)) { bildir(tO('mesaj.kalipUzun')); return; }
      taslak.odev=yeni;
      if(b.dataset.hoKalip==='yok'&&yeni.tr.includes(ODEV_KALIPLARI.find(k=>k.yok)!.metin.tr)) {
        root.querySelectorAll<HTMLSelectElement>('[name=etkinlik]').forEach(s=>s.value='');
      }
      metinleriYaz(); bildir(b.dataset.hoKalip==='yok' ? tO('mesaj.kalipYok') : tO('mesaj.kalip')); return;
    }
    if(b.hasAttribute('data-ho-plan')) {
      const ezber=planEzberleri(hafta).join('\n'); if(!ezber) { bildir(tO('mesaj.planEzberYok')); return; }
      taslak=oku(); if(taslak.ezber.tr && taslak.ezber.tr!==ezber && !confirm(tO('plan.onay')))return;
      taslak.ezber.tr=ezber; metinleriYaz(); bildir(tO('mesaj.planAlindi')); return;
    }
    if(b.hasAttribute('data-ho-kopyala')) {
      const rec=haftalar.slice(0,haftalar.indexOf(hafta)).reverse().map(h=>kayitlar.find(k=>k.tarih===h.tarih)).find(Boolean); if(!rec)return;
      taslak=oku(); let say=0;
      for(const alan of ['ezber','odev'] as const) {
        // Bir dilde yeni haftanın metni varken diğer dile eski haftanın çevirisi eklenmez.
        if(ODEV_DILLERI.some(d=>taslak[alan][d]&&taslak[alan][d]!==rec[alan]?.[d]))continue;
        for(const d of ODEV_DILLERI)if(!taslak[alan][d]&&rec[alan]?.[d]){taslak[alan][d]=rec[alan]![d];say++;}
      }
      metinleriYaz(); bildir(say ? tO('mesaj.kopyaTamam') : tO('mesaj.kopyaBos')); return;
    }
    if(b.hasAttribute('data-ho-materyal')) {
      const input=form().elements.namedItem('materyal') as HTMLInputElement;
      if(input.value&&input.value!==materyal()&&!confirm(tO('materyal.onay')))return;
      input.value=materyal();guncelle();bildir(tO('mesaj.materyal'));return;
    }
    if(b.hasAttribute('data-ho-geri')) { if(!ayrilabilir())return;taslak=odevTaslagi(hafta,mevcut(),materyal());ilk=JSON.stringify(taslak);mesaj=tO('mesaj.geri');ciz();return; }
    if(b.hasAttribute('data-ho-cevir')) {
      taslak=oku(); const alanlar=(['ezber','odev'] as const).filter(a=>taslak[a].tr);
      if(!alanlar.length){bildir(tO('mesaj.cevirOnce'));return;}
      if(alanlar.some(a=>taslak[a].fr)&&!confirm(tO('cevir.onay')))return;
      kilitle(true);bildir(tO('mesaj.cevirSuruyor'));
      try { const sonuc=await opt.cevir(alanlar.map(a=>taslak[a].tr),'fr');
        if(kapali)return;
        if(sonuc.length!==alanlar.length||sonuc.some(s=>!s.trim()||s.length>1000))throw Error('Çeviri eksik veya çok uzun.');
        alanlar.forEach((a,i)=>taslak[a].fr=sonuc[i]);kilitle(false);metinleriYaz();root.querySelector('[name=ezberFr]')?.closest('details')?.setAttribute('open','');bildir(tO('mesaj.cevirTamam'));
      }catch{if(!kapali){kilitle(false);bildir(tO('mesaj.cevirHata'));}}
      return;
    }
    if(b.hasAttribute('data-ho-sil')) {
      if(!confirm(tO('sil.onay', { n: hafta.hafta })))return;
      kilitle(true);try{await opt.sil(hafta.tarih);if(kapali)return;kayitlar=kayitlar.filter(k=>k.tarih!==hafta.tarih);taslak=odevTaslagi(hafta,undefined,materyal());ilk=JSON.stringify(taslak);mesgul=false;mesaj=tO('mesaj.silindi');ciz();}catch{if(!kapali){kilitle(false);bildir(tO('mesaj.silHata'));}}
    }
  }, {signal:ac.signal});
  root.addEventListener('submit', async ev => {
    ev.preventDefault();ev.stopPropagation();if(mesgul)return;
    taslak=oku();const hata=odevHatasi(taslak,ETKINLIKLER.map(x=>x.id),{uzun:tO('hata.uzun'),etkinlik:tO('hata.etkinlik'),materyal:tO('hata.materyal'),bos:tO('hata.bos')});if(hata){bildir(hata);return;}
    const kayit={...taslak,guncelleme:new Date().toISOString()};kilitle(true);bildir(tO('mesaj.kaydediliyor'));
    try{await opt.kaydet(kayit);if(kapali)return;kayitlar=[...kayitlar.filter(k=>k.tarih!==kayit.tarih),kayit];taslak=kayit;ilk=JSON.stringify(taslak);mesgul=false;mesaj=kayit.yayin?tO('mesaj.kaydedildiYayin'):tO('mesaj.kaydedildiTaslak');ciz();root.querySelector<HTMLElement>('[data-ho-durum]')?.focus();}
    catch{if(!kapali){kilitle(false);bildir(tO('mesaj.kaydetHata'));}}
  }, {signal:ac.signal});
  window.addEventListener('beforeunload', ev=>{if(mesgul||kirli()){ev.preventDefault();ev.returnValue='';}}, {signal:ac.signal});
  ciz();
  return { ayrilabilir, temizle: () => { kapali=true; ac.abort(); } };
}
