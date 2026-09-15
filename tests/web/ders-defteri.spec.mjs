import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {mektepAc} from './helpers/mektep.mjs';
const katalog=JSON.parse(readFileSync('src/data/ders-defteri-2026-2027.json','utf8'));
const d=katalog.find(x=>x.id==='2026-09-12_1');
const yol='dersDefteri/TEST-1/kayitlar';
const students=[{ref:'TEST-1',ad:'Örnek',soyad:'Talebe'},{ref:'TEST-2',ad:'İkinci',soyad:'Örnek'}];
const kayit={id:d.id,donem:'2026-2027',tarih:d.tarih,sira:d.sira,no:d.no,sayfa:d.sayfa,konu:d.konu,kaynak:d.kaynak,grup:'',durum:'islendi',giris:'kagit',calisma:'Birlikte okuduk <b>örnek</b>',okunan:'12. sayfa',dikkat:'Yavaş oku',oz:'destek',odev:'13. sayfayı tekrar et',sonraki:'Birlikte kontrol',surum:1};
async function ac(page,context,records={}){
 await mektepAc(page,context,{hoca:true,students,records});await page.locator('[data-sekme=defter]').click();
 await page.locator('[data-dd-gun]').selectOption(d.tarih);await page.locator('[data-dd-ogr]').selectOption('TEST-1');
 await expect(page.locator('[data-dd-form]')).toBeVisible();
 return page.locator('[data-ders-defteri]');
}
test('Ders defteri basılı sayfayı eşler; boş varsayılan kayıt yazmaz, kaydeder ve sonraki derse geçer',async({page,context})=>{
 const p=await ac(page,context);await expect(p).toContainText(`${d.no + 54}. sayfa`);await expect(p.locator('[name=durum]')).toHaveValue('');await expect(p.locator('[name=grup]')).toHaveValue('');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await p.locator('[name=durum]').selectOption('islendi');await p.locator('[name=calisma]').fill('Kâğıttan aktarılan örnek not');await p.locator('[name=odev]').fill('Sayfa 12–13');
 await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 await p.locator('[data-dd-yenile]').click();await expect(p.locator('[name=calisma]')).toHaveValue('Kâğıttan aktarılan örnek not');
 await p.locator('[value=sonraki]').click();await expect(p.locator('[data-dd-ders="2026-09-12_2"]')).toHaveAttribute('aria-pressed','true');
 await expect(p.locator('[name=calisma]')).toHaveValue('');
 const r=await page.evaluate(y=>window.__records[y],yol);expect(r).toHaveLength(1);expect(r[0].surum).toBe(2);expect(r[0].sayfa).toBe(d.sayfa);
});
test('Kesinti ve çakışmada not kaybolmaz; menü ve öğrenci değişiminde vazgeçilebilir',async({page,context})=>{
 const p=await ac(page,context,{[yol]:[kayit]});await p.locator('[name=calisma]').fill('Kaybolmasın');
 page.once('dialog',x=>x.dismiss());await page.locator('[data-sekme=yoklama]').click();await expect(p.locator('[name=calisma]')).toHaveValue('Kaybolmasın');
 await expect(page.locator('[data-sekme=defter]')).toBeFocused();
 page.once('dialog',x=>x.dismiss());await page.locator('[data-sekme=defter]').press('ArrowRight');await expect(page.locator('[data-sekme=defter]')).toBeFocused();
 page.once('dialog',x=>x.dismiss());await p.locator('[data-dd-ogr]').selectOption('TEST-2');await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-1');
 await page.evaluate(()=>{window.__commitError=true;});await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('Kaydedilemedi');await expect(p.locator('[name=calisma]')).toHaveValue('Kaybolmasın');
 await page.evaluate(y=>{window.__commitError=false;window.__records[y][0].surum=2;},yol);await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('başka bir ekranda');
 expect(await page.evaluate(y=>window.__records[y][0].calisma,yol)).toBe(kayit.calisma);
 page.once('dialog',x=>x.accept());await p.locator('[data-dd-yenile]').click();await expect(p.locator('[name=calisma]')).toHaveValue(kayit.calisma);
 await page.evaluate(()=>{window.__dataError=true;});await p.locator('[data-dd-yenile]').click();await expect(p.locator('[data-dd-durum]')).toContainText('alınamadı');
 await page.evaluate(()=>{window.__dataError=false;});await p.locator('[data-dd-yenile]').click();await expect(p.locator('[data-dd-form]')).toBeVisible();
});
test('Arşiv çıktısı seçili öğrenciyle sınırlı; bültene aktarım kendiliğinden yayımlanmaz',async({page,context})=>{
 const p=await ac(page,context,{[yol]:[kayit],'dersDefteri/TEST-2/kayitlar':[{...kayit,calisma:'Kardeşin özel notu'}]});
 await p.locator('.dd-arsiv summary').click();
 await page.evaluate(()=>{const append=document.body.appendChild.bind(document.body);document.body.appendChild=function(n){if(n.tagName==='IFRAME'){const load=n.onload;n.onload=()=>{n.contentWindow.print=()=>{window.__defterPrint=n.contentDocument.body.textContent;};load?.();};}return append(n);};});
 await p.locator('[data-dd-yazdir]').click();await expect.poll(()=>page.evaluate(()=>window.__defterPrint)).toContain('Örnek Talebe');
 const metin=await page.evaluate(()=>window.__defterPrint);expect(metin).toContain('<b>örnek</b>');expect(metin).not.toContain('Kardeşin özel notu');expect(metin).toContain(`Basılı sayfa ${d.no + 54}`);
 const indirme=page.waitForEvent('download');await p.locator('[data-dd-indir]').click();const dosya=await indirme;expect(dosya.suggestedFilename()).toBe('Ders-Defteri-TEST-1.json');
 const data=JSON.parse(readFileSync(await dosya.path(),'utf8'));expect(data.kayitlar).toHaveLength(1);expect(data.ogrenci.ref).toBe('TEST-1');
 await page.locator('[data-sekme=bulten]').click();await page.locator('[data-hb-ogr]').selectOption('TEST-1');await expect(page.locator('[data-hb-form]')).toBeVisible();
 await page.locator('[name=getir]').fill('Defterini getir');page.once('dialog',x=>x.accept());await page.locator('[data-hb-defter]').click();
 await expect(page.locator('[data-hb-durum]')).toContainText('taslağa aktarıldı');await expect(page.locator('[name=ders]')).toHaveValue(/Birlikte okuduk/);await expect(page.locator('[name=getir]')).toHaveValue('Defterini getir');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 await page.locator('[value=taslak]').click();await expect(page.locator('[data-hb-durum]')).toContainText('Taslak kaydedildi');
 expect(await page.evaluate(()=>window.__records['bultenler/TEST-1/haftalar'][0].yayin)).toBe(false);
});
test('Ders defteri telefon ve masaüstünde açık/koyu temada erişilebilir ve taşmasız',async({page,context})=>{
 const p=await ac(page,context,{[yol]:[kayit]});
 await expect(p.locator('.dd-ayrinti')).not.toHaveAttribute('open','');
 for(const tema of ['light','dark']){
  await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');},tema);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await p.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  const sonuc=await new AxeBuilder({page}).include('[data-ders-defteri]').analyze();expect(sonuc.violations).toEqual([]);
  await p.screenshot({path:test.info().outputPath('ders-defteri-'+tema+'.png')});
 }
 await p.locator('.dd-ayrinti summary').click();await expect(p.locator('[name=okunan]')).toHaveValue('12. sayfa');
 await p.locator('[name=sonraki]').fill('Yeni hedef');await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 expect(await page.evaluate(y=>window.__records[y][0].okunan,yol)).toBe('12. sayfa');
 expect(await page.evaluate(y=>window.__records[y][0].sonraki,yol)).toBe('Yeni hedef');
});

/* 12 Eyl 2026 — yoklama bağlantısı. O gün hoca 45 kaydın 30'unu gelmeyen öğrenciler için elle
   doldurdu («gelmedi.», «Derse katılmadı.», «Ya, işte yoktu.» …) ve hepsi 'islendi' yazıldı. */
const yoklamaKaydi=(ref,dersler)=>({id:`${ref}_2026-09-12`,ref,tarih:'2026-09-12',dersler,not:''});
test('Yoklamada «Yok» ise durum kendiliğinden seçilir, not zorunlu olmaz ve kanonik cümle yazılır',async({page,context})=>{
 const p=await ac(page,context,{yoklama:[yoklamaKaydi('TEST-1',{1:'yok',2:'yok',3:'var'})]});
 await expect(p.locator('[data-dd-yoklama]')).toContainText('Yoklama: Yok');
 await expect(p.locator('[name=durum]')).toHaveValue('gelmedi');
 await expect(p.locator('[name=calisma]')).not.toHaveAttribute('required','');
 await expect(p.locator('[name=calisma]')).toHaveAttribute('placeholder',/Derse gelmedi\./);
 await expect(p.locator('[data-dd-ders="2026-09-12_1"]')).toContainText('Yok');
 await expect(p.locator('[data-dd-ders="2026-09-12_3"]')).toContainText('Var');
 await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 const r=await page.evaluate(y=>window.__records[y],yol);
 expect(r[0].durum).toBe('gelmedi');expect(r[0].calisma).toBe('Derse gelmedi.');expect(r[0].giris).toBe('dijital');
 // Üçüncü derste yoklama «Var»: durum boş gelir, not yine zorunludur.
 await p.locator('[data-dd-ders="2026-09-12_3"]').click();
 await expect(p.locator('[name=durum]')).toHaveValue('');
 await expect(p.locator('[name=calisma]')).toHaveAttribute('required','');
});
test('Yoklama ile çelişen durum uyarı verir ama kaydı engellemez',async({page,context})=>{
 const p=await ac(page,context,{yoklama:[yoklamaKaydi('TEST-1',{1:'yok',2:'var',3:'var'})]});
 await expect(p.locator('[data-dd-celiski]')).toHaveCount(0);
 await p.locator('[name=durum]').selectOption('islendi');
 await expect(p.locator('[data-dd-celiski]')).toContainText('Yoklamada «Yok» işaretli');
 await p.locator('[name=calisma]').fill('Telafi dersi yaptık');
 await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 expect(await page.evaluate(y=>window.__records[y][0].calisma,yol)).toBe('Telafi dersi yaptık');
 // Ters yön: gelen öğrenciye «gelmedi» seçilirse de uyarılır.
 await p.locator('[data-dd-ders="2026-09-12_2"]').click();
 await p.locator('[name=durum]').selectOption('mazeretli');
 await expect(p.locator('[data-dd-celiski]')).toContainText('Yoklamada «Var» işaretli');
});
test('Gelmeyenlerin defteri toplu doldurulur; var olan kayda dokunulmaz',async({page,context})=>{
 const p=await ac(page,context,{
  yoklama:[yoklamaKaydi('TEST-1',{1:'yok',2:'yok',3:'yok'}),yoklamaKaydi('TEST-2',{1:'mazeret',2:'var',3:'yok'})],
  [yol]:[{...kayit,calisma:'Hocanın kendi notu'}]});
 // TEST-1: 3 ders yok (1'inin kaydı var) · TEST-2: 1. mazeret + 3. yok → 5 aday, 4 yazılacak
 await expect(p.locator('[data-dd-toplu]')).toContainText('5 ders');
 page.once('dialog',x=>{expect(x.message()).toContain('4 ders kaydı açılacak (2 öğrenci)');x.accept();});
 await p.locator('[data-dd-toplu]').click();
 await expect(p.locator('[data-dd-durum]')).toContainText('4 ders kaydı açıldı');
 const bir=await page.evaluate(y=>window.__records[y],yol);
 expect(bir.find(k=>k.id==='2026-09-12_1').calisma).toBe('Hocanın kendi notu'); // ezilmedi
 expect(bir.find(k=>k.id==='2026-09-12_2').durum).toBe('gelmedi');
 expect(bir.find(k=>k.id==='2026-09-12_2').calisma).toBe('Derse gelmedi.');
 const iki=await page.evaluate(()=>window.__records['dersDefteri/TEST-2/kayitlar']);
 expect(iki.map(k=>k.id).sort()).toEqual(['2026-09-12_1','2026-09-12_3']);
 expect(iki.find(k=>k.id==='2026-09-12_1').durum).toBe('mazeretli');
 expect(iki.find(k=>k.id==='2026-09-12_1').calisma).toBe('Mazereti bildirildi; derse gelmedi.');
 expect(iki.find(k=>k.id==='2026-09-12_3').durum).toBe('gelmedi');
 // İkinci tıklamada yazacak bir şey kalmaz.
 await p.locator('[data-dd-toplu]').click();
 await expect(p.locator('[data-dd-durum]')).toContainText('kaydı zaten var');
});
/* 14 Eyl 2026 — «dokuna dokuna» doldurma: kalıp çipleri, hazır kayıt, son kayıtla aynı, yapışkan kaydet.
   Rıdvan: «hazır butonlara basınca o metin ile defter kolay doldurulabilsin; özel bir durum varsa hoca yine yazar.» */
test('Kalıp çipi cümleyi ekler, ikinci dokunuş geri alır; hocanın kendi metni korunur ve kaydedilir',async({page,context})=>{
 const p=await ac(page,context,{yoklama:[yoklamaKaydi('TEST-1',{1:'var',2:'var',3:'var'})]});
 const cip=p.locator('[data-dd-kalip="calisma"][data-metin="Derse katılımı güzeldi."]');
 await expect(cip).toHaveAttribute('aria-pressed','false');
 await p.locator('[name=calisma]').fill('Hocanın özel notu');
 await cip.click();
 await expect(p.locator('[name=calisma]')).toHaveValue('Hocanın özel notu. Derse katılımı güzeldi.');
 await expect(cip).toHaveAttribute('aria-pressed','true');
 await expect(p.locator('[data-dd-durum]')).toContainText('Kaydedilmemiş');
 await p.locator('[data-dd-kalip="calisma"][data-metin="Memnunum, elhamdülillah."]').click();
 await expect(p.locator('[name=calisma]')).toHaveValue('Hocanın özel notu. Derse katılımı güzeldi. Memnunum, elhamdülillah.');
 await cip.click(); // geri al
 await expect(p.locator('[name=calisma]')).toHaveValue('Hocanın özel notu. Memnunum, elhamdülillah.');
 await expect(cip).toHaveAttribute('aria-pressed','false');
 // Elle silince çipin basılı görünümü de düşer.
 await p.locator('[name=calisma]').fill('Sadece hoca');
 await expect(p.locator('[data-dd-kalip="calisma"][data-metin="Memnunum, elhamdülillah."]')).toHaveAttribute('aria-pressed','false');
 // Kur’an dersinde okuma/dikkat kalıpları var; madde alanı virgülle birleşir.
 await p.locator('[data-dd-kalip="odev"][data-metin="Öğrendiği harfleri evde her gün tekrar etsin."]').click();
 await p.locator('.dd-ayrinti summary').click();
 await p.locator('[data-dd-kalip="dikkat"][data-metin="Mahreç"]').click();await p.locator('[data-dd-kalip="dikkat"][data-metin="Peltek harfler"]').click();
 await expect(p.locator('[name=dikkat]')).toHaveValue('Mahreç, Peltek harfler');
 await p.locator('[name=durum]').selectOption('islendi');await p.locator('[value=kaydet]').click();
 await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 const r=await page.evaluate(y=>window.__records[y][0],yol);
 expect(r.calisma).toBe('Sadece hoca');expect(r.odev).toBe('Öğrendiği harfleri evde her gün tekrar etsin.');expect(r.dikkat).toBe('Mahreç, Peltek harfler');
});
test('Hazır kayıt tek dokunuşla durum ve notları doldurur; dolu alan ezilmez; «Son kayıtla aynı» sıradaki öğrenciye taşır',async({page,context})=>{
 const p=await ac(page,context,{yoklama:[yoklamaKaydi('TEST-1',{1:'var',2:'var',3:'var'}),yoklamaKaydi('TEST-2',{1:'var',2:'var',3:'var'})]});
 await expect(p.locator('[data-dd-oncekinden]')).toHaveCount(0); // henüz bu ders için kayıt yok
 await p.locator('[name=odev]').fill('Kendi ödevim');
 await p.locator('[data-dd-hazir="islendi-iyi"]').click();
 await expect(p.locator('[name=durum]')).toHaveValue('islendi');
 await expect(p.locator('[name=calisma]')).toHaveValue(new RegExp(`«${d.konu}» konusunu birlikte işledik\\. Derse katılımı güzeldi\\.`));
 await expect(p.locator('[name=odev]')).toHaveValue('Kendi ödevim'); // dolu alan korundu
 await expect(p.locator('[data-dd-durum]')).toContainText('dolu alanlara dokunulmadı');
 await expect(p.locator('[data-dd-kalip="calisma"][data-metin="Derse katılımı güzeldi."]')).toHaveAttribute('aria-pressed','true');
 await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 // Sıradaki öğrencide aynı ders: «Son kayıtla aynı» boş alanları kopyalar, durum da gelir.
 await p.locator('[data-dd-ogr]').selectOption('TEST-2');await expect(p.locator('[data-dd-form]')).toBeVisible();
 await expect(p.locator('[name=calisma]')).toHaveValue('');
 await p.locator('[data-dd-oncekinden]').click();
 await expect(p.locator('[name=durum]')).toHaveValue('islendi');
 await expect(p.locator('[name=odev]')).toHaveValue('Kendi ödevim');
 await expect(p.locator('[name=calisma]')).toHaveValue(/Derse katılımı güzeldi\./);
 await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 expect((await page.evaluate(()=>window.__records['dersDefteri/TEST-2/kayitlar']))[0].odev).toBe('Kendi ödevim');
 // Ertelendi hazır kaydı durumu değiştirir; dolu çalışma notuna dokunmaz.
 await p.locator('[data-dd-hazir="ertelendi"]').click();
 await expect(p.locator('[name=durum]')).toHaveValue('ertelendi');
 await expect(p.locator('[name=calisma]')).toHaveValue(/Derse katılımı güzeldi\./);
});
test('Gelmeyen öğrencide çip ve hazır kayıt görünmez; kaydet çubuğu yapışkan; dokunma hedefleri yeterli',async({page,context},testInfo)=>{
 const p=await ac(page,context,{yoklama:[yoklamaKaydi('TEST-1',{1:'yok',2:'var',3:'var'})]});
 await expect(p.locator('[data-dd-kalip]')).toHaveCount(0);await expect(p.locator('[data-dd-hazir]')).toHaveCount(0);
 await p.locator('[data-dd-ders="2026-09-12_2"]').click();
 await expect(p.locator('[data-dd-hazir]').first()).toBeVisible();
 expect(await p.locator('.dd-kaydet').evaluate(el=>getComputedStyle(el).position)).toBe('sticky');
 const kucuk=await p.locator('[data-dd-kalip]').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height<36).length);
 expect(kucuk).toBe(0);
 if(testInfo.project.name.startsWith('mobil')){
  // Telefonda kaydet düğmesi, çiplerin altına kaydırmadan görünür (sayfanın altına yapışır).
  await p.locator('[name=calisma]').scrollIntoViewIfNeeded();
  const kutu=await p.locator('[value=kaydet]').boundingBox();const vh=page.viewportSize().height;
  expect(kutu.y+kutu.height).toBeLessThanOrEqual(vh+1);
 }
 await p.screenshot({path:testInfo.outputPath('ders-defteri-kaliplar.png')});
});
test('«Kaydet ve sonraki» gün bitince ertesi güne değil sıradaki öğrenciye geçer',async({page,context})=>{
 const p=await ac(page,context,{yoklama:[yoklamaKaydi('TEST-1',{1:'var',2:'var',3:'var'})]});
 // Listedeki ilk öğrenciden başla (sıra ada göre; sabit ref varsaymayalım).
 const refler=await p.locator('[data-dd-ogr] option').evaluateAll(o=>o.map(x=>x.value).filter(Boolean));
 expect(refler.length).toBeGreaterThan(1);
 await p.locator('[data-dd-ogr]').selectOption(refler[0]);
 await expect(p.locator('[data-dd-form]')).toBeVisible();
 for(const sira of [1,2,3]){
  await expect(p.locator(`[data-dd-ders="2026-09-12_${sira}"]`)).toHaveAttribute('aria-pressed','true');
  await p.locator('[name=durum]').selectOption('islendi');
  await p.locator('[name=calisma]').fill(`${sira}. ders notu`);
  await p.locator('[value=sonraki]').click();
  if(sira<3) await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 }
 // Üçüncü dersten sonra: aynı gün, sıradaki öğrenci — ertesi gün DEĞİL.
 await expect(p.locator('[data-dd-durum]')).toContainText('Sıradaki öğrenci');
 await expect(p.locator('[data-dd-ogr]')).toHaveValue(refler[1]);
 await expect(p.locator('[data-dd-gun]')).toHaveValue('2026-09-12');
 await expect(p.locator('[data-dd-ders="2026-09-12_1"]')).toHaveAttribute('aria-pressed','true');
 await expect(p.locator('[name=calisma]')).toHaveValue('');
 const ilk=await page.evaluate(r=>window.__records[`dersDefteri/${r}/kayitlar`],refler[0]);
 expect(ilk.map(k=>k.id).sort()).toEqual(['2026-09-12_1','2026-09-12_2','2026-09-12_3']);
 expect(await page.evaluate(r=>window.__records[`dersDefteri/${r}/kayitlar`],refler[1])).toBeUndefined();
});
test('Günün ilerlemesi: kaç öğrencinin defteri tamam, seçenekte ◐/✓ işareti, «Sıradaki eksik» ilk eksik dersi açar',async({page,context})=>{
 // TEST-1'in 1. dersi kayıtlı (1/3 → kısmen), TEST-2'de kayıt yok (başlanmadı).
 const p=await ac(page,context,{[yol]:[kayit]});
 const ozet=p.locator('[data-dd-gun-ozet]');
 await expect(ozet).toContainText('0/2 öğrencinin günlük defteri tamam');
 await expect(ozet).toContainText('1 kısmen');
 await expect(ozet).toContainText('1 başlanmadı');
 await expect(p.locator('[data-dd-ogr] option[value="TEST-1"]')).toContainText('◐ 1/3');
 // Sıradaki eksik: listede ilk tamamlanmamış öğrenci (sıra soyada göre → «İkinci Örnek»), ilk eksik dersiyle.
 const siradaki=p.locator('[data-dd-siradaki]');
 await expect(siradaki).toContainText('Sıradaki eksik: İkinci');
 await siradaki.click();
 await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-2');
 await expect(p.locator('[data-dd-ders="2026-09-12_1"]')).toHaveAttribute('aria-pressed','true');
 for(const sira of [1,2,3]){
  await p.locator('[name=durum]').selectOption('islendi');
  await p.locator('[name=calisma]').fill(`${sira}. ders notu`);
  await p.locator('[value=sonraki]').click();
  await expect(p.locator('[data-dd-durum]')).toContainText(sira<3?'kaydedildi':'Sıradaki öğrenci');
 }
 // TEST-2 tamam → 1/2; seçenekte ✓; sıradaki eksik artık TEST-1 («Örnek»), eksik dersi 2.
 await expect(ozet).toContainText('1/2 öğrencinin günlük defteri tamam');
 await expect(ozet).toContainText('1 kısmen');
 await expect(ozet).not.toContainText('başlanmadı');
 await expect(p.locator('[data-dd-ogr] option[value="TEST-2"]')).toContainText('✓');
 await expect(siradaki).toContainText('Sıradaki eksik: Örnek');
 await siradaki.click();
 await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-1');
 await expect(p.locator('[data-dd-ders="2026-09-12_2"]')).toHaveAttribute('aria-pressed','true');
});
/* 14 Eyl 2026 — Rıdvan: «iletişim tercihi Fransızca olan velilere Türkçe doldurduğum ekranlar Fransızca kaydedilsin.»
   Kayıt kaydedilince çeviri belgesi (dersDefteri/{ref}/ceviriler/{id}_fr) yazılır: kalıp cümleler yerel Fransızca,
   serbest cümle çeviri ucuna gider; yarım çeviri yazılmaz. Bülten Fransızca aileye Fransızca kurulur. */
const frStudents=[{ref:'TEST-1',ad:'Örnek',soyad:'Talebe'},{ref:'TEST-2',ad:'İkinci',soyad:'Örnek',dil:'fr'}];
async function ceviriUcuKur(context){
 const durum={istekler:[],bozuk:false};
 await context.route('http://127.0.0.1:4401/ceviri-test',async r=>{const g=JSON.parse(r.request().postData()||'{}');durum.istekler.push(g);
  if(durum.bozuk)return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:false,hata:'ceviri-kapali'})});
  await r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,hedef:g.hedef,ceviriler:(g.metinler||[]).map(m=>`[FR] ${m}`)})});});
 return durum;
}
test('Veli dili Fransızca: kaydedilince çeviri belgesi yazılır (kalıp yerel, serbest cümle makineye); Türkçe ailede yazılmaz; hata → «Şimdi çevir»',async({page,context})=>{
 await mektepAc(page,context,{hoca:true,students:frStudents,records:{}});
 const uc=await ceviriUcuKur(context); // mektepAc'ın genel yolundan SONRA: sonra kaydedilen yol önce bakılır
 await page.locator('[data-sekme=defter]').click();await page.locator('[data-dd-gun]').selectOption(d.tarih);
 const p=page.locator('[data-ders-defteri]');
 await p.locator('[data-dd-ogr]').selectOption('TEST-2');await expect(p.locator('[data-dd-form]')).toBeVisible();
 await expect(p.locator('[data-dd-ceviri]')).toContainText('kaydedince yapılır');
 await p.locator('[name=durum]').selectOption('islendi');
 await p.locator('[name=calisma]').fill('Derse katılımı güzeldi. Bugün çok neşeliydi.');
 await p.locator('[name=odev]').fill('Bu ders için ödev yok.');
 await p.locator('[value=kaydet]').click();
 await expect(p.locator('[data-dd-durum]')).toContainText('Fransızca çevirisi kaydedildi (kalıp + makine)');
 expect(uc.istekler).toHaveLength(1);
 expect(uc.istekler[0].metinler).toEqual(['Bugün çok neşeliydi.']);
 expect(uc.istekler[0].hedef).toBe('fr');
 expect(typeof uc.istekler[0].idToken).toBe('string');
 const c=await page.evaluate(()=>window.__records['dersDefteri/TEST-2/ceviriler']);
 expect(c).toHaveLength(1);
 expect(c[0]).toMatchObject({id:`${d.id}_fr`,kayitId:d.id,dil:'fr',kaynakSurum:1,yontem:'karma',calisma:'Sa participation au cours était bonne. [FR] Bugün çok neşeliydi.',odev:'Pas de devoir pour ce cours.'});
 await expect(p.locator('[data-dd-ceviri]')).toContainText('kayıtlı ✓');
 // Yalnız kalıp: ikinci sürüm makineye gitmez, çeviri kaynak sürümü izler.
 await p.locator('[name=calisma]').fill('Derse katılımı güzeldi. Dersi dikkatle dinledi.');
 await p.locator('[value=kaydet]').click();
 await expect(p.locator('[data-dd-durum]')).toContainText('Fransızca çevirisi kaydedildi (kalıp cümleler)');
 expect(uc.istekler).toHaveLength(1);
 expect((await page.evaluate(()=>window.__records['dersDefteri/TEST-2/ceviriler']))[0]).toMatchObject({kaynakSurum:2,yontem:'kalip',calisma:'Sa participation au cours était bonne. Votre enfant a écouté le cours avec attention.'});
 // Uç bozuksa yarım çeviri YAZILMAZ; satır «eski» der ve «Şimdi çevir» sunar; uç düzelince tamamlanır.
 uc.bozuk=true;
 await p.locator('[name=calisma]').fill('Serbest cümle.');
 await p.locator('[value=kaydet]').click();
 await expect(p.locator('[data-dd-durum]')).toContainText('Fransızca çevirisi yapılamadı');
 expect((await page.evaluate(()=>window.__records['dersDefteri/TEST-2/ceviriler']))[0].kaynakSurum).toBe(2);
 await expect(p.locator('[data-dd-ceviri]')).toContainText('eski');
 uc.bozuk=false;
 await p.locator('[data-dd-cevir]').click();
 await expect(p.locator('[data-dd-durum]')).toHaveText('Fransızca çevirisi kaydedildi (kalıp + makine).'); // «Çevriliyor…» yerini alır; ödev kalıp kaldı
 expect((await page.evaluate(()=>window.__records['dersDefteri/TEST-2/ceviriler']))[0]).toMatchObject({kaynakSurum:3,calisma:'[FR] Serbest cümle.'});
 // Türkçe aile: çeviri satırı yok, belge yazılmaz, uca istek gitmez.
 const n=uc.istekler.length;
 await p.locator('[data-dd-ogr]').selectOption('TEST-1');await expect(p.locator('[data-dd-form]')).toBeVisible();
 await expect(p.locator('[data-dd-ceviri]')).toHaveCount(0);
 await p.locator('[name=durum]').selectOption('islendi');await p.locator('[name=calisma]').fill('Türkçe aile notu.');
 await p.locator('[value=kaydet]').click();await expect(p.locator('[data-dd-durum]')).toContainText('kaydedildi');
 await expect(p.locator('[data-dd-durum]')).not.toContainText('Fransızca');
 expect(uc.istekler).toHaveLength(n);
 expect(await page.evaluate(()=>window.__records['dersDefteri/TEST-1/ceviriler'])).toBeUndefined();
});
test('Fransızca aile: yeni bülten Fransızca başlar; «Ders defterinden doldur» çevirileri kullanır, eksik kaydı Türkçe bırakıp uyarır; «Fransızcaya çevir» elle metni çevirir',async({page,context})=>{
 const d2=katalog.find(x=>x.id==='2026-09-12_2');
 await mektepAc(page,context,{hoca:true,students:frStudents,records:{
  'dersDefteri/TEST-2/kayitlar':[{...kayit,calisma:'Derse katılımı güzeldi.',odev:'Bu ders için ödev yok.',sonraki:''},{...kayit,id:d2.id,sira:d2.sira,no:d2.no,sayfa:d2.sayfa,konu:d2.konu,kaynak:d2.kaynak,calisma:'Serbest not.',odev:'',sonraki:''}],
  'dersDefteri/TEST-2/ceviriler':[{id:`${d.id}_fr`,kayitId:d.id,dil:'fr',kaynakSurum:1,yontem:'kalip',calisma:'Sa participation au cours était bonne.',odev:'Pas de devoir pour ce cours.',sonraki:'',okunan:'',dikkat:''}],
 }});
 const uc=await ceviriUcuKur(context);
 await page.locator('[data-sekme=bulten]').click();
 await page.locator('[data-hb-ogr]').selectOption('TEST-2');await expect(page.locator('[data-hb-form]')).toBeVisible();
 await expect(page.locator('[name=dil]')).toHaveValue('fr');
 page.once('dialog',x=>x.accept());await page.locator('[data-hb-defter]').click();
 await expect(page.locator('[data-hb-durum]')).toContainText('1 dersin çevirisi yok');
 const ders=await page.locator('[name=ders]').inputValue();
 expect(ders).toContain(`${d.tarih} · cours 1 · `);
 expect(ders).toContain('Cours fait : Sa participation au cours était bonne.');
 expect(ders).toContain('Cours fait : Serbest not.'); // çevirisi olmayan kayıt Türkçe kalır
 expect(ders).not.toContain('İşlendi');
 await expect(page.locator('[name=odev]')).toHaveValue(/Pas de devoir pour ce cours\.$/);
 // Elle çeviri: paragraflar tek istekte uca gider, dil 'fr' kalır, henüz kaydedilmez.
 await page.locator('[name=not]').fill('Aileye kısa not.');
 await page.locator('[data-hb-cevir]').click();
 await expect(page.locator('[data-hb-durum]')).toContainText('Fransızcaya çevrildi');
 expect(uc.istekler).toHaveLength(1);
 expect(uc.istekler[0].metinler).toContain('Aileye kısa not.');
 await expect(page.locator('[name=not]')).toHaveValue('[FR] Aileye kısa not.');
 await expect(page.locator('[name=dil]')).toHaveValue('fr');
 expect(await page.evaluate(()=>window.__writes.length)).toBe(0);
 // Türkçe aile: düğme yok, bülten Türkçe başlar.
 await page.locator('[data-hb-ogr]').selectOption('TEST-1');await expect(page.locator('[data-hb-form]')).toBeVisible();
 await expect(page.locator('[name=dil]')).toHaveValue('tr');
 await expect(page.locator('[data-hb-cevir]')).toHaveCount(0);
});

/* 14 Eyl 2026 — Rıdvan: «hangi gün hangi öğrencinin hangi dersi doldurulmamış, tek ekranda göreyim; ekran beni
   yönlendirsin, gidip kolayca doldurayım.» Harness saati 13 Eyl 2026 → geçmiş günler 12 ve 13 Eyl (3'er ders). */
test('Doldurulmamış defterler: başlıkta sayı; tek ekran listesi; dokununca defter o kayıtla açılır; «Kaydet ve sonraki» sıradaki eksiğe geçer; gelmeyenlerin kaydı toplu açılır',async({page,context})=>{
 const g12=katalog.filter(x=>x.tarih==='2026-09-12'), g13=katalog.filter(x=>x.tarih==='2026-09-13');
 const k=(x)=>({...kayit,id:x.id,tarih:x.tarih,sira:x.sira,no:x.no,sayfa:x.sayfa,konu:x.konu,kaynak:x.kaynak,calisma:'Dolu'});
 const ucOgr=[...students,{ref:'TEST-3',ad:'Üçüncü',soyad:'Talebe'}];
 await mektepAc(page,context,{hoca:true,students:ucOgr,records:{
  'dersDefteri/TEST-1/kayitlar':[...g12,...g13].map(k),
  'dersDefteri/TEST-2/kayitlar':[k(g12[0])],
  yoklama:[{id:'TEST-2_2026-09-13',ref:'TEST-2',tarih:'2026-09-13',dersler:{1:'var',2:'var',3:'var'},not:''},{id:'TEST-3_2026-09-13',ref:'TEST-3',tarih:'2026-09-13',dersler:{1:'yok',2:'mazeret',3:'yok'},not:''}],
 }});
 // Başlık: arka planda hesaplanan sayı bir düğmedir; defteri liste görünümüyle açar.
 const hero=page.locator('[data-hero-eksik]');
 await expect(hero).toContainText('11 doldurulmamış defter kaydı');
 await expect(hero).toContainText('2 gün · 2 öğrenci');
 await hero.click();
 const p=page.locator('[data-ders-defteri]');
 await expect(p.locator('[data-dd-eksik-ozet]')).toContainText('11 eksik kayıt');
 await expect(p.locator('[data-dd-eksik-ozet]')).toContainText('2 öğrenci');
 await expect(p.locator('[data-dd-eksik-ozet]')).toContainText('3 yoklamada gelmedi');
 await expect(p.locator('[data-dd-eksik-gun]')).toHaveCount(2);
 await expect(p.locator('[data-dd-eksik-bos]')).toContainText('5 Eylül'); // plandaki ilk hafta sonu: kayıt/yoklama yok → sayılmaz, not düşülür
 const gun12=p.locator('[data-dd-eksik-gun="2026-09-12"]'), gun13=p.locator('[data-dd-eksik-gun="2026-09-13"]');
 await expect(gun12.locator('[data-dd-eksik]')).toHaveCount(5);
 await expect(gun12).toContainText('4/9 dolu · 5 eksik');
 await expect(gun12).toContainText('yoklaması girilmemiş');
 await expect(gun12.locator('[data-dd-eksik-toplu]')).toHaveCount(0);
 await expect(gun13.locator('[data-dd-eksik-toplu]')).toContainText('Gelmeyenlerin 3 kaydını aç');
 await expect(gun13.locator('[data-dd-eksik="TEST-3"][data-dd-eksik-ders="2026-09-13_2"]')).toContainText('Yoklama: Mazeretli');
 // Dokunuş: defter o öğrenci / gün / dersle açılır; kalan eksikler kuyruk olur.
 await gun12.locator('[data-dd-eksik="TEST-2"][data-dd-eksik-ders="2026-09-12_2"]').click();
 await expect(p.locator('[data-dd-form]')).toBeVisible();
 await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-2');
 await expect(p.locator('[data-dd-gun]')).toHaveValue('2026-09-12');
 await expect(p.locator('[data-dd-ders="2026-09-12_2"]')).toHaveAttribute('aria-pressed','true');
 await expect(p.locator('[data-dd-eksik-satir]')).toContainText('Sıradaki eksik: İkinci Örnek');
 await expect(p.locator('[data-dd-eksik-satir]')).toContainText('3. ders');
 await p.locator('[name=durum]').selectOption('islendi');await p.locator('[name=calisma]').fill('Eksik tamamlandı.');
 await p.locator('[value=sonraki]').click();
 await expect(p.locator('[data-dd-durum]')).toContainText('Sıradaki eksik: İkinci Örnek');
 await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-2');
 await expect(p.locator('[data-dd-ders="2026-09-12_3"]')).toHaveAttribute('aria-pressed','true');
 await expect(hero).toContainText('10 doldurulmamış');
 // «Sıradakine geç» kuyruğu kayıt yazmadan ilerletir; sonra listeye dönüş: sayı düştü.
 await p.locator('[data-dd-kuyruk-sonraki]').click();
 await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-3');
 await expect(p.locator('[data-dd-ders="2026-09-12_1"]')).toHaveAttribute('aria-pressed','true');
 await p.locator('[data-dd-eksikler-ac]').click();
 await expect(p.locator('[data-dd-eksik-ozet]')).toContainText('10 eksik kayıt');
 // Gelmeyenlerin kaydı toplu açılır: yoklama Yok → «gelmedi», Mazeretli → «mazeretli»; liste ve başlık düşer.
 page.once('dialog',x=>x.accept());
 await gun13.locator('[data-dd-eksik-toplu]').click();
 await expect(p.locator('[data-dd-eksik-durum]')).toContainText('3 ders kaydı açıldı (1 öğrenci)');
 await expect(p.locator('[data-dd-eksik-ozet]')).toContainText('7 eksik kayıt');
 await expect(gun13.locator('[data-dd-eksik-toplu]')).toHaveCount(0);
 const r3=await page.evaluate(()=>window.__records['dersDefteri/TEST-3/kayitlar']);
 expect(r3.map(x=>`${x.id}:${x.durum}`).sort()).toEqual(['2026-09-13_1:gelmedi','2026-09-13_2:mazeretli','2026-09-13_3:gelmedi']);
 await expect(hero).toContainText('7 doldurulmamış');
 // «Sırayla doldur» listenin ilk eksiğiyle başlar: soyad sırasında İkinci Örnek önce gelir; 12_3 kaydedilmeden atlanmıştı.
 await p.locator('[data-dd-eksik-basla]').click();
 await expect(p.locator('[data-dd-form]')).toBeVisible();
 await expect(p.locator('[data-dd-ogr]')).toHaveValue('TEST-2');
 await expect(p.locator('[data-dd-ders="2026-09-12_3"]')).toHaveAttribute('aria-pressed','true');
 await expect(p.locator('[data-dd-eksik-satir]')).toContainText('Sıradaki eksik: Üçüncü Talebe');
 // Eksik yoksa: liste «eksiksiz» der, başlık ✓.
 await p.locator('[data-dd-eksikler-ac]').click();
 await page.evaluate(()=>{for(const r of ['TEST-2','TEST-3'])window.__records[`dersDefteri/${r}/kayitlar`]=window.__records['dersDefteri/TEST-1/kayitlar'].map(x=>({...x}));});
 await p.locator('[data-dd-eksik-yenile]').click();
 await expect(p.locator('[data-dd-eksik-ozet]')).toContainText('0 eksik kayıt');
 await expect(p).toContainText('defteri tam ✓');
 await expect(hero).toContainText('eksiksiz ✓');
});
