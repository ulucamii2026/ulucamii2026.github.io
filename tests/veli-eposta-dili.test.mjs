import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=['kimlik-sabitler.gs','veli-eposta-sablon.gs','ulucamii-Kod-v35.gs'].map(ad=>readFileSync(new URL('../scripts/apps-script/'+ad,import.meta.url),'utf8')).join('\n');
function backend(){const sent=[];const c=vm.createContext({console,PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})}});vm.runInContext(source,c);c.epostaGonder=m=>sent.push(m);c.mufredatEki=()=>null;return {c,sent};}
for(const dil of ['tr','fr'])test(`Kayıt onayı yalnız seçilen iletişim dilinde: ${dil}`,()=>{
 const {c,sent}=backend();const blob={name:'test.pdf'};
 c.kopyaGonderV2(blob,'UC-2099-TEST','Deniz Örnek',['veli@example.test'],dil);
 assert.equal(sent.length,1);assert.equal(sent[0].to,'veli@example.test');assert.equal(sent[0].attachments[0],blob);
 assert.match(sent[0].htmlBody,new RegExp('<html lang="'+dil+'">'));
 if(dil==='fr'){assert.match(sent[0].subject,/Confirmation d’inscription/);assert.match(sent[0].body,/Bonjour/);assert.doesNotMatch(sent[0].body,/Esselâmü|kaydı alınmıştır|Dersler /);}
 else{assert.match(sent[0].subject,/kayıt onayı/);assert.match(sent[0].body,/kaydı alınmıştır/);assert.doesNotMatch(sent[0].body,/Bonjour|L’inscription|Les cours/);}
});
test('Eksik ya da bilinmeyen iletişim dilinde Türkçe varsayılarak gönderim yapılmaz',()=>{
 for(const dil of [undefined,'','nl']){const {c,sent}=backend();assert.throws(()=>c.kopyaGonderV2({},'UC-2099-TEST','Örnek',['veli@example.test'],dil),/iletişim dili/i);assert.equal(sent.length,0);}
});
test('Formun görüntüleme dili farklı olsa da veli iletişim dili kayıt onayına aktarılır',()=>{
 const {c,sent}=backend();let dil;
 c.kayitDogrulaV2=()=>({tamam:true});c.klasorGetir=()=>({createFile:()=>({getUrl:()=>''})});c.kayitV2SayfaGetir=()=>({getParent:()=>({getUrl:()=>''})});c.kayitV2AnahtarBul=()=>null;
 c.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};c.v1SayfaBulTablo=()=>null;c.referansMaxBul=()=>1;c.Utilities={formatDate:()=>''};c.kayitPdfUret=()=>({});c.satirEkle=()=>{};c.SpreadsheetApp={flush(){}};c.kayitV2AnahtarKaydet=()=>{};c.kayitDurumNotuEkle=()=>{};c.json=x=>x;c.kopyaGonderV2=(b,r,n,es,lang)=>{dil=lang;return true;};
 const v={dil:'tr',gonderimAnahtari:'test',ogrenci:{ad:'Deniz',soyad:'Örnek'},veli:{eposta:'veli@example.test',iletisimDili:'fr'},onay:{}};
 assert.equal(c.kayitPostIsleV2(v).ok,true);assert.equal(dil,'fr');
});

// 13 Eyl 2026: v29 sözleşmesi, mahremiyet, hata ve tekrar senaryoları tamamen sahte GAS ile sınanır.
const resim = 'data:image/jpeg;base64,' + Buffer.alloc(420, 7).toString('base64');
function kayitVerisi(c, yol = 'yukle') {
 const v = c.ornekKayitVerisi('fr', false);
 v.formSurumu = 3; v.sir = c.AYAR2.ortakSir; v.gonderimAnahtari = 'test-kayit-anahtari-0001';
 v.ogrenci.ad = 'Deniz'; v.ogrenci.soyad = 'TESTOGLU';
 v.veli.cep = '+32470000000'; v.veli.eposta = 'veli@example.test'; v.acil = {};
 v.onay.kimlikRiza = true; v.kimlik = { yol, on: resim, arka: '' };
 return v;
}
function kayitOrtami() {
 const { c, sent } = backend(), rows = [], files = [], cache = new Map();
 const iterator = a => ({ hasNext: () => a.length > 0, next: () => a.shift() });
 const blob = (bytes, type = 'text/plain', name = 'test') => ({ getBytes: () => [...Buffer.from(bytes)], getContentType: () => type, getName: () => name });
 c.Utilities = { newBlob: blob, base64Decode: s => [...Buffer.from(s, 'base64')], base64Encode: b => Buffer.from(b).toString('base64'), formatDate: () => '13.09.2026 12:00' };
 const folder = {
  createFile(b) { const f = { getName: () => b.getName(), getBlob: () => b, getSize: () => b.getBytes().length, getUrl: () => 'https://example.test/form.pdf', setTrashed: t => { f.trashed = t; } }; files.push(f); return f; },
  getFilesByName: name => iterator(files.filter(f => !f.trashed && f.getName() === name))
 };
 const sheet = { getLastRow: () => rows.length + 1, getLastColumn: () => c.BASLIKLAR2.length, getParent: () => ({ getUrl: () => 'https://example.test/defter' }),
  getRange(row, col, count = 1, width = 1) {
   const values = () => Array.from({ length: count }, (_, i) => (row + i === 1 ? Array.from(c.BASLIKLAR2) : rows[row + i - 2]).slice(col - 1, col - 1 + width));
   return { getValues: values, getValue: () => values()[0][0], setValue: value => { rows[row - 2][col - 1] = value; } };
  }, appendRow: a => rows.push(Array.from(a)), deleteRow: n => rows.splice(n - 2, 1)
 };
 c.klasorGetir = () => folder; c.kayitV2SayfaGetir = () => sheet; c.v1SayfaBulTablo = () => null;
 c.CacheService = { getScriptCache: () => ({ get: k => cache.get(k), put: (k, v) => cache.set(k, v) }) };
 c.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }; c.SpreadsheetApp = { flush() {} };
 c.kayitPdfUret = () => blob('FORM TEST', 'application/pdf', 'form.pdf'); c.json = x => x;
 c.console = { error() {}, warn() {}, log() {} };
 return { c, sent, rows, files, folder, sheet, cache, blob };
}

test('v29: v2 kimliksiz kabul edilir, v3 yol ister; yalnız 2 ve 3 geçerlidir', () => {
 const { c } = backend(), v = kayitVerisi(c);
 assert.equal(c.kayitDogrulaV2(v).tamam, true);
 for (const formSurumu of [undefined, 1, 4, '3']) assert.equal(c.kayitDogrulaV2({ ...v, formSurumu }).kod, 'form-surumu-gecersiz');
 delete v.kimlik; assert.equal(c.kayitDogrulaV2(v).kod, 'kimlik-yol-gecersiz');
 v.formSurumu = 2; assert.equal(c.kayitDogrulaV2(v).tamam, true); assert.equal(c.kayitKimlikOzeti(v.kimlik), '');
});

test('v29: dijital yollarda gerçek boolean rıza, yüklemede ön yüz ve 1,5 MiB sınırı', () => {
 const { c } = backend();
 for (const yol of ['yukle', 'eposta', 'whatsapp']) for (const riza of [false, undefined, 'true']) {
  const v = kayitVerisi(c, yol); v.onay.kimlikRiza = riza; assert.equal(c.kayitDogrulaV2(v).kod, 'kimlikRiza');
 }
 const v = kayitVerisi(c); v.kimlik.on = ''; assert.equal(c.kayitDogrulaV2(v).kod, 'kimlik-on-gecersiz');
 for (const mime of ['jpeg', 'png', 'webp']) { v.kimlik.on = resim.replace('jpeg', mime); assert.equal(c.kayitDogrulaV2(v).tamam, true); }
 for (const bozuk of [resim.replace('jpeg', 'svg+xml'), 'data:image/jpeg;base64,@@@@', null, 123]) { v.kimlik.on = bozuk; assert.equal(c.kayitDogrulaV2(v).kod, 'kimlik-on-gecersiz'); }
 v.kimlik.on = 'data:image/jpeg;base64,' + Buffer.alloc(1.5 * 1024 * 1024).toString('base64');
 assert.equal(c.kayitDogrulaV2(v).tamam, true); v.kimlik.on += 'AAAA'; assert.equal(c.kayitDogrulaV2(v).kod, 'kimlik-on-gecersiz');
 v.kimlik.on = resim; v.kimlik.arka = 'bozuk'; assert.equal(c.kayitDogrulaV2(v).kod, 'kimlik-arka-gecersiz');
 v.kimlik.yol = 'elden'; v.onay.kimlikRiza = false; assert.equal(c.kayitDogrulaV2(v).tamam, true);
});

test('v29: yaş 4–18, posta kodu, şehir ve e-posta son eki doğrulanır', () => {
 const { c } = backend();
 for (const yas of [3, 4, 18, 19]) { const v = kayitVerisi(c); const yil = new Date().getFullYear(); v.ogrenci.dogumTarihi = `${yil - yas}-01-01`; assert.equal(c.kayitDogrulaV2(v).tamam, yas >= 4 && yas <= 18); }
 for (const alan of ['postaKodu', 'sehir']) { const v = kayitVerisi(c); v.veli[alan] = ' '; assert.equal(c.kayitDogrulaV2(v).tamam, false); }
 for (const eposta of ['veli@example.t', 'veli@example.123', 'a@@example.test']) assert.equal(c.epostaGecerli(eposta), false);
 assert.equal(c.epostaGecerli('veli@example.test'), true);
});

test('v29: kayıt JSON sınırı UTF-8 baytlarıyla 4 MiB; görselsiz diğer uç 20 KiB', () => {
 const { c } = kayitOrtami(); c.kayitPostIsleV2 = () => ({ ok: true });
 const post = value => c.doPost({ postData: { contents: JSON.stringify(value) } });
 assert.equal(post({ tur: 'kayit', dolgu: 'A'.repeat(30000) }).ok, true);
 assert.equal(post({ tur: 'kayit', dolgu: 'A'.repeat(4 * 1024 * 1024) }).hata, 'cok-buyuk');
 assert.equal(post({ tur: 'kayit', dolgu: 'ğ'.repeat(2200000) }).hata, 'cok-buyuk');
 assert.equal(post({ tur: 'bilinmeyen', dolgu: 'A'.repeat(30000) }).hata, 'cok-buyuk');
});

test('v29: görsel yalnız Drive’da; PDF ve posta eklerinde ham resim yok; tekrar kopya sonucunu korur', () => {
 const { c, rows, files, sent, cache } = kayitOrtami(), v = kayitVerisi(c); v.kimlik.arka = resim;
 const ilk = c.kayitPostIsleV2(v); assert.equal(ilk.ok, true); assert.equal(ilk.kopyaGitti, true);
 assert.equal(rows.length, 1); assert.equal(rows[0].at(-1), 'yüklendi (ön+arka)');
 assert.equal(files.filter(f => /kimlik-(on|arka)\.jpg$/.test(f.getName())).length, 2);
 assert.doesNotMatch(JSON.stringify(rows), /data:image/);
 for (const mail of sent) { assert.doesNotMatch(mail.body, /data:image/); assert.equal(mail.attachments.length, 1); assert.equal(mail.attachments[0].getContentType(), 'application/pdf'); }
 assert.match(sent[0].body, /Kimlik belgesi: yüklendi \(ön\+arka\)/);
 assert.equal(c.kayitPostIsleV2(v).tekrar, true); assert.equal(sent.length, 2);
 cache.clear(); const tekrar = c.kayitPostIsleV2(v); assert.equal(tekrar.kopyaGitti, true); assert.equal(rows.length, 1); assert.equal(files.length, 3); assert.equal(sent.length, 2);
 const html = c.pdfHtmlKayit(v, { ref: ilk.ref, zaman: '', dil: 'fr' }); assert.ok(!html.includes(resim)); assert.doesNotMatch(html, /kimlik-on\.jpg|kimlik-arka\.jpg/);
});

test('v29: elden/e-posta/WhatsApp görselleri yok sayılır, sabit durumlar yazılır', () => {
 for (const [yol, durum] of [['elden', 'elden gösterilecek'], ['eposta', 'e-posta ile gelecek'], ['whatsapp', 'WhatsApp ile gelecek']]) {
  const { c, rows, files } = kayitOrtami(), v = kayitVerisi(c, yol); v.kimlik.arka = resim;
  assert.equal(c.kayitPostIsleV2(v).ok, true); assert.equal(rows[0].at(-1), durum); assert.equal(files.length, 1);
 }
});

test('v29: kısmi/tam kimlik ve posta hataları kaydı engellemez, birbirini ezmez', () => {
 for (const tam of [false, true]) {
  const { c, rows, folder, cache } = kayitOrtami(), create = folder.createFile, v = kayitVerisi(c); v.kimlik.arka = resim;
  folder.createFile = b => { if (b.getName().includes('kimlik-') && (tam || b.getName().includes('arka'))) throw new Error('Drive deneme hatası'); return create(b); };
  c.epostaGonder = () => { throw new Error('Posta deneme hatası'); };
  const sonuc = c.kayitPostIsleV2(v); assert.equal(sonuc.ok, true); assert.equal(sonuc.kopyaGitti, false);
  assert.match(rows[0][25], /kimlik-kayit-hatasi/); assert.match(rows[0][25], /e-posta gönderilemedi/); assert.match(rows[0][25], /veli-kopyasi-gonderilemedi/);
  assert.equal(rows[0].at(-1), tam ? '' : 'yüklendi (ön)'); cache.clear(); assert.equal(c.kayitPostIsleV2(v).kopyaGitti, false);
 }
});

test('v29: gerçek veli gönderim hatası false döner; başarı, boş alıcı ve kısmi başarısızlık ayrılır', () => {
 const { c } = backend(); c.console = { error() {} };
 assert.equal(c.kopyaGonderV2({}, 'UC-2099-0001', 'Örnek', [], 'tr'), false);
 c.epostaGonder = m => { if (m.to.startsWith('hata')) throw new Error('beklenen'); };
 assert.equal(c.kopyaGonderV2({}, 'UC-2099-0001', 'Örnek', ['veli@example.test'], 'tr'), true);
 assert.equal(c.kopyaGonderV2({}, 'UC-2099-0001', 'Örnek', ['veli@example.test', 'hata@example.test'], 'tr'), false);
});

test('v29: kimlik paragrafı veli dilinde, WhatsApp URL’si tam tıklanabilir', () => {
 for (const dil of ['tr', 'fr']) for (const yol of ['yukle', 'eposta', 'whatsapp', 'elden']) {
  const { c, sent } = backend(), ad = "Deniz O'NEIL (TEST)";
  assert.equal(c.kopyaGonderV2({}, 'UC-2099-0001', ad, ['veli@example.test'], dil, { yol }, 'en', []), true);
  const metin = c.kayitKimlikEpostaMetni({ yol }, dil, 'UC-2099-0001', ad, []);
  assert.ok(sent[0].body.includes(metin)); assert.match(metin, dil === 'tr' ? /Kimlik|Lütfen/ : /La copie|Veuillez/);
  if (yol === 'whatsapp') {
   const url = metin.split('\n').at(-1); const htmlUrl = url.replace(/&/g, '&amp;');
   assert.ok(sent[0].htmlBody.includes('href="' + htmlUrl + '"')); assert.equal(new URL(url).hostname, 'wa.me');
   assert.ok(new URL(url).searchParams.get('text').includes('UC-2099-0001 (' + ad + ')'));
  }
 }
 const { c } = backend(); assert.match(c.kayitKimlikEpostaMetni({ yol: 'yukle' }, 'fr', '', '', ['on']), /n’ont pas pu être enregistrées/);
});

test('v29: yetkisiz/bozuk referanslı yeni uçlar Drive’a erişemez', () => {
 const { c } = kayitOrtami(); c.klasorGetir = () => { throw new Error('Drive erişimi olmamalı'); };
 for (const islem of ['kayit-belge', 'kayit-gorsel-sil']) {
  assert.equal(c.doGet({ parameter: { islem, ref: 'UC-2099-0001' } }).hata, 'yetki');
  for (const ref of ['IH-2099-0001', 'UC-2099-0001x', ' UC-2099-0001', 'UC-2099-0001\n', '../UC-2099-0001']) assert.equal(c.doGet({ parameter: { islem, ref, anahtar: c.PANEL.anahtar } }).hata, 'ref-gecersiz');
 }
 c.VELI_PORTAL_SURUM = 'test'; assert.equal(c.doGet({}).kayitKimlik, true); assert.equal(c.doGet({}).surum, 35);
});

test('v29: belge okuma MIME ve toplam yanıt sınırı uygular, okunamayanları açık döner', () => {
 const { c, folder, blob } = kayitOrtami();
 folder.createFile(blob(Buffer.alloc(200), 'image/png', 'UC-2099-0001 - kimlik-on.jpg'));
 folder.createFile(blob(Buffer.alloc(200), 'text/html', 'UC-2099-0001 - kimlik-arka.jpg'));
 let sonuc = c.kayitBelgeIsle({ parameter: { anahtar: c.PANEL.anahtar, ref: 'UC-2099-0001' } });
 assert.match(sonuc.on, /^data:image\/png/); assert.equal(sonuc.arka, ''); assert.equal(sonuc.okunamayan[0].neden, 'tur-gecersiz');
 const { c: c2, folder: f2, blob: b2 } = kayitOrtami();
 for (const yan of ['on', 'arka']) f2.createFile(b2(Buffer.alloc(1700000), 'image/jpeg', `UC-2099-0001 - kimlik-${yan}.jpg`));
 sonuc = c2.kayitBelgeIsle({ parameter: { anahtar: c2.PANEL.anahtar, ref: 'UC-2099-0001' } });
 assert.ok(Buffer.byteLength(JSON.stringify(sonuc)) < 4 * 1024 * 1024); assert.equal(sonuc.okunamayan[0].neden, 'cok-buyuk');
});

test('v29: silme tam adla sınırlıdır, farklı referans/defter/PDF ve benzer ad korunur', () => {
 const { c, folder, files, blob } = kayitOrtami();
 for (const ad of ['UC-2099-0001 - kimlik-on.jpg', 'UC-2099-0001 - kimlik-arka.jpg', 'UC-2099-0002 - kimlik-on.jpg', 'UC-2099-0001 - kimlik-on.jpg.yedek', 'Kayıt defteri', 'UC-2099-0001.pdf']) folder.createFile(blob('TEST', 'image/jpeg', ad));
 folder.getFilesByName = () => { let i = 0; return { hasNext: () => i < files.length, next: () => files[i++] }; };
 const sonuc = c.kayitGorselSilIsle({ parameter: { anahtar: c.PANEL.anahtar, ref: 'UC-2099-0001' } });
 assert.equal(sonuc.ok, true); assert.equal(sonuc.silinen.length, 2); assert.deepEqual(files.map(f => !!f.trashed), [true, true, false, false, false, false]);
});

test('v29: test temizliği yalnız eşleşen test satırının iki kimliğini çöpe atar', () => {
 const { c, rows, files, sheet, folder } = kayitOrtami(), v = kayitVerisi(c); v.kimlik.arka = resim;
 c.kayitPostIsleV2(v); const normal = [...rows[0]]; normal[1] = 'UC-2026-0002'; normal[2] = 'ÖRNEK'; rows.push(normal);
 c.driveIdCikar = () => ''; assert.equal(c.testTemizleSayfa(sheet, folder, ['Öğrenci soyadı', 'Öğrenci adı']), 1);
 assert.equal(rows.length, 1); assert.equal(rows[0][2], 'ÖRNEK'); assert.equal(files.filter(f => f.trashed).length, 2);
});

test('v29 C: kimlik paragrafı ve WhatsApp mesajı da veli iletişim dilinde kalır', () => {
 for (const iletisim of ['tr', 'fr']) for (const formDili of ['tr', 'fr', 'en']) {
  const { c, sent } = backend();
  c.kopyaGonderV2({}, 'UC-2099-0001', "Deniz O'NEIL (TEST)", ['veli@example.test'], iletisim, { yol: 'whatsapp' }, formDili, []);
  const body = sent[0].body;
  if (iletisim === 'fr') { assert.match(body, /Veuillez envoyer/); assert.doesNotMatch(body, /Lütfen|Please send/); }
  else { assert.match(body, /Lütfen/); assert.doesNotMatch(body, /Veuillez|Please send/); }
  const url = body.split('\n').find(satir => satir.startsWith('https://wa.me/'));
  assert.match(new URL(url).searchParams.get('text'), iletisim === 'fr' ? /^Bonjour/ : /^Merhaba/);
 }
});

test('v29 C: bozuk Base64 dolgu ve uzunluğu reddedilir; satır sonları boyuta eklenmez', () => {
 const { c } = backend(), prefix = 'data:image/jpeg;base64,';
 for (const b64 of ['A'.repeat(400) + '=A==', '='.repeat(400), 'A'.repeat(401), 'A'.repeat(400) + '====']) {
  assert.equal(c.gorselGecerli(prefix + b64, 1.5), false, b64.slice(-8));
 }
 const sinir = Buffer.alloc(1.5 * 1024 * 1024).toString('base64');
 assert.equal(c.gorselGecerli(prefix + sinir.replace(/(.{76})/g, '$1\r\n'), 1.5), true);
});

test('v29 C: yalnız TESTOGLU sözcüğü ve geçerli referans test temizliğine girer', () => {
 const { c, rows, sheet, folder } = kayitOrtami();
 c.kayitPostIsleV2(kayitVerisi(c)); const ilk = [...rows[0]]; rows.length = 0;
 for (const [soyad, ad, ref] of [['TESTOGLUOĞLU', 'Deniz', 'UC-2099-0002'], ['ÖRNEK', 'TEST', 'UC-2099-0003'], ['TESTOGLU', 'Deniz', 'bozuk-ref']]) {
  const r = [...ilk]; r[2] = soyad; r[3] = ad; r[1] = ref; rows.push(r);
 }
 c.driveIdCikar = () => '';
 assert.equal(c.testTemizleSayfa(sheet, folder, ['Öğrenci soyadı', 'Öğrenci adı']), 0);
 assert.equal(rows.length, 3);
});

test('v29 C: Sheets formül önekleri ve HTML metni çalıştırılmadan saklanır/gösterilir', () => {
 const { c, rows, sent } = kayitOrtami(), v = kayitVerisi(c, 'elden');
 v.ogrenci.ad = '<img src=x onerror=alert(1)>';
 v.veli.adres = '=HYPERLINK("https://example.test")'; v.veli.sehir = '@SUM(1)';
 v.acil = { adSoyad: '-2+3', cep: '+32470000001' };
 assert.equal(c.kayitPostIsleV2(v).ok, true);
 assert.match(rows[0][13], /^'=/); assert.match(rows[0][15], /^'@/); assert.match(rows[0][17], /^'-/); assert.match(rows[0][18], /^'\+/);
 const html = sent.find(m => m.to === 'veli@example.test').htmlBody;
 assert.ok(html.includes('&lt;img')); assert.doesNotMatch(html, /<img src=x/);
});

test('v29 C: önbellek kesintisi mevcut kaydı çoğaltmaz ve gönderilmiş kopyayı yanlış bildirmez', () => {
 const { c, rows, cache } = kayitOrtami(), v = kayitVerisi(c, 'elden');
 const ilk = c.kayitPostIsleV2(v); assert.equal(ilk.kopyaGitti, true);
 cache.set('kayit2:' + v.gonderimAnahtari, JSON.stringify({ ref: ilk.ref, kopyaGitti: false }));
 assert.equal(c.kayitPostIsleV2(v).kopyaGitti, true);
 c.CacheService = { getScriptCache: () => ({ get() { throw new Error('Sahte önbellek kesintisi'); }, put() { throw new Error('Sahte önbellek kesintisi'); } }) };
 const tekrar = c.kayitPostIsleV2(v); assert.equal(tekrar.ok, true); assert.equal(tekrar.tekrar, true); assert.equal(rows.length, 1);
});

test('v29 C: ilk isteğin e-postası sürerken tekrar yanlış başarı/kopya sonucu vermez', () => {
 const { c, rows, sent } = kayitOrtami(), v = kayitVerisi(c, 'elden'); let bekleyen;
 c.epostaGonder = m => { sent.push(m); if (!bekleyen) bekleyen = c.kayitPostIsleV2(v); };
 const ilk = c.kayitPostIsleV2(v);
 assert.equal(bekleyen.ok, false); assert.equal(bekleyen.hata, 'kayit-isleniyor');
 assert.equal(ilk.kopyaGitti, true);
 const tekrar = c.kayitPostIsleV2(v);
 assert.equal(tekrar.tekrar, true); assert.equal(tekrar.kopyaGitti, true); assert.equal(tekrar.ref, ilk.ref);
 assert.equal(rows.length, 1); assert.equal(sent.length, 2);
});

test('v29 C: yarım kalan eski kopya işlemi tekrar kaydı kilitlemez veya çoğaltmaz', () => {
 const { c, rows, cache, sent } = kayitOrtami(), v = kayitVerisi(c, 'elden');
 c.kayitPostIsleV2(v); rows[0][0] = new Date(Date.now() - 11 * 60 * 1000);
 rows[0][25] = 'Yeni kayıt | veli-kopyasi-bekleniyor'; cache.clear();
 const tekrar = c.kayitPostIsleV2(v);
 assert.equal(tekrar.ok, true); assert.equal(tekrar.tekrar, true); assert.equal(tekrar.kopyaGitti, false);
 assert.equal(rows.length, 1); assert.equal(sent.length, 2);
});

test('v29 C: test satırının PDF hücresi deftere yönelse de yalnız tam adlı PDF silinir', () => {
 for (const dogruAd of [false, true]) {
  const { c, sheet, folder } = kayitOrtami(), v = kayitVerisi(c, 'elden');
  const sonuc = c.kayitPostIsleV2(v); let silindi = false;
  c.driveIdCikar = () => 'sentetik-dosya-id';
  c.DriveApp = { getFileById: () => ({ getName: () => dogruAd ? sonuc.ref + ' - Deniz TESTOGLU.pdf' : 'Kayıt defteri', setTrashed: () => { silindi = true; } }) };
  assert.equal(c.testTemizleSayfa(sheet, folder, ['Öğrenci soyadı', 'Öğrenci adı']), 1);
  assert.equal(silindi, dogruAd);
 }
});

test('v29 C: hatalı yol ve arka yüz tek başına kayıt oluşturamaz', () => {
 const { c, rows, files } = kayitOrtami(), v = kayitVerisi(c);
 for (const kimlik of [null, [], {}, 'yukle', { yol: 'posta' }, { yol: 'yukle', on: '', arka: resim }]) {
  assert.equal(c.kayitPostIsleV2({ ...v, kimlik }).ok, false);
 }
 assert.equal(rows.length, 0); assert.equal(files.length, 0);
});
