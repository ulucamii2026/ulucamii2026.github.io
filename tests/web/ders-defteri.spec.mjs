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
 const p=await ac(page,context);await expect(p).toContainText(`${d.sayfa}. sayfa`);await expect(p.locator('[name=durum]')).toHaveValue('');await expect(p.locator('[name=grup]')).toHaveValue('');
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
 const metin=await page.evaluate(()=>window.__defterPrint);expect(metin).toContain('<b>örnek</b>');expect(metin).not.toContain('Kardeşin özel notu');
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
