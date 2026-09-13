import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kimlikKaynakOku, kimlikDosyalari, kimlikDenetle, kopyaYolu, sabitYolu, sha256 } from '../scripts/kimlik-uret.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const oku = ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8');
const kaynak = await kimlikKaynakOku(), kimlik = kaynak.kimlik;
const source = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v31.gs', 'veli-cuma.gs'].map(oku).join('\n');
function ortam() {
  const sent = [];
  const c = vm.createContext({ console: {error() {}, log() {}}, PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})},
    MailApp:{sendEmail:m=>sent.push(m)},
    UrlFetchApp:{fetch() { throw Error('Testte canlı ağ yasak'); }} });
  vm.runInContext(source, c);
  c.mufredatEki = () => null;
  return {c, sent};
}
const {c} = ortam();
const htmlKacis = t => c.veliEpostaKacis(t);
const sade = x => JSON.parse(JSON.stringify(x));
const cli = input => spawnSync(process.execPath, [join(root, 'scripts/veli-eposta-render.mjs')], {cwd:root, input, encoding:'utf8', windowsHide:true});

test('Üretilmiş sabitler ve JSON ana kaynağın tüm alanlarını taşır; UTF-8/LF ve kaynak SHA-256 eşleşir', () => {
  assert.deepEqual(sade(c.KIMLIK), kimlik);
  assert.deepEqual(JSON.parse(readFileSync(kopyaYolu, 'utf8')), kimlik);
  for (const [yol, beklenen] of kimlikDosyalari(kimlik, kaynak.kaynakSha256)) {
    const bytes = readFileSync(yol);
    assert.equal(sha256(bytes), sha256(beklenen));
    assert.ok(!bytes.toString('utf8').includes('\r'));
    assert.notEqual(bytes.subarray(0, 3).toString('hex'), 'efbbbf');
  }
  assert.ok(oku('kimlik-sabitler.gs').startsWith('/* ÜRETİLDİ — elle düzenleme;'));
  assert.ok(oku('kimlik-sabitler.gs').includes('sha256: ' + sha256(readFileSync(kimlik.anaKaynak))));
});
test('Denetim değiştirilmiş/eksik kopyayı dosya adıyla bildirir; sağlam CLI sıfır döner', async () => {
  assert.deepEqual((await kimlikDenetle()).hatalar, []);
  const bozuk = await kimlikDenetle(async yol => yol === sabitYolu ? Buffer.from('bozuk') : readFile(yol));
  assert.deepEqual(bozuk.hatalar, [sabitYolu]);
  const eksik = await kimlikDenetle(async yol => { if (yol === kopyaYolu) throw Object.assign(Error(), {code:'ENOENT'}); return readFile(yol); });
  assert.deepEqual(eksik.hatalar, [kopyaYolu]);
  const r = spawnSync(process.execPath, [join(root, 'scripts/kimlik-uret.mjs'), '--denetle'], {encoding:'utf8', windowsHide:true});
  assert.equal(r.status, 0, r.stderr);
});
for (const kurum of ['kurs', 'cami']) for (const dil of ['tr', 'fr', 'en']) {
  test(`${kurum}/${dil}: ad, renk, logo, imza, gizlilik ve hukukî satır doğru tek kimlikten gelir`, () => {
    const k = kimlik.kurumlar[kurum];
    const html = c.veliEpostaDuzMetin('Sayın TESTOGLU,\n\nÖrnek içerik.', dil, 'Örnek başlık', {kurum});
    for (const deger of [k.ad[dil], k.logoYazisi.ust, ...kimlik.yazisma.imza[kurum][dil], kimlik.hukuki.altbilgi[dil]]) assert.ok(html.includes(htmlKacis(deger)), deger);
    for (const renk of Object.values(kimlik.gorunum.ortakRenk).filter(x => x !== kimlik.gorunum.ortakRenk.cizgi)) assert.ok(html.includes(renk));
    assert.ok(html.includes('border-bottom:4px solid ' + k.renk.ana));
    assert.ok(html.includes('src="' + k.logo.web + '"'));
    assert.ok(html.includes('alt="' + htmlKacis(k.ad[dil]) + '"'));
    assert.ok(html.includes('href="' + kimlik.iletisim.gizlilik[dil] + '"'));
    assert.ok(html.includes(kimlik.yazisma.gizlilikBaglantiMetni[dil]));
    assert.ok(html.includes(htmlKacis(kimlik.yazisma.epostaAltNotu[dil].replace('{kurum}', k.ad[dil]))));
    assert.match(html, new RegExp('<html lang="' + dil + '">'));
    assert.doesNotMatch(html, /\.gif|media\/eposta\/|VELI_EPOSTA_GORSEL|ulucamii2026@gmail/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal((html.match(/<img\b/g) || []).length, 1);
  });
}
test('Renkler, kurum metinleri ve font şablona gömülmez; KIMLIK değişimi çıktıya yansır', () => {
  const {c:x} = ortam();
  assert.doesNotMatch(oku('veli-eposta-sablon.gs'), /#[a-f0-9]{3,8}\b|Marche-en-Famenne|\+32 |info@|Arial|Work Sans/i);
  x.KIMLIK.kurumlar.kurs.renk.ana = '#123456';
  x.KIMLIK.kurumlar.kurs.ad.fr = 'École TESTOGLU';
  x.KIMLIK.gorunum.eposta.govdePuntoPx = 19;
  const html = x.veliEpostaDuzMetin('Essai', 'fr', 'Test');
  assert.match(html, /#123456/); assert.match(html, /École TESTOGLU/); assert.match(html, /font-size:19px/);
});
test('Bilinmeyen/eksik dil ve kurum reddedilir; yalnız kurum için kurs varsayılır', () => {
  for (const dil of [undefined, null, '', 'nl', 'TR']) {
    for (const render of [() => c.veliEpostaBelge(dil, '', ''), () => c.veliEpostaDuzMetin('', dil, ''), () => c.veliEpostaZengin([], dil, '')]) assert.throws(render, /veli-eposta-dil/);
  }
  for (const kurum of ['', null, 'baska', '__proto__']) assert.throws(() => c.veliEpostaDuzMetin('', 'tr', '', {kurum}), /veli-eposta-kurum/);
  assert.match(c.veliEpostaDuzMetin('', 'tr', ''), /data-kurum="kurs"/);
});
test('Yalnız çift yıldız kalınlaşır; HTML ve diğer Markdown düz metin kalır', () => {
  const html = c.veliEpostaDuzMetin('**kalın <özel>**\n*italik* [etiket](adres) `kod`\n\nİkinci paragraf', 'tr', '<Başlık>');
  assert.match(html, /<b>kalın &lt;özel&gt;<\/b>/);
  assert.ok(html.includes('*italik* [etiket](adres) `kod`'));
  assert.match(html, /&lt;Başlık&gt;/); assert.doesNotMatch(html, /<özel>|<script|<em>/);
  assert.match(html, /<br>\*italik\*/);
});
test('URL sonundaki noktalama dışarıda; sorgu parametreleri bir kez kaçışlanır', () => {
  const url = 'https://example.test/portal?a=1&b=2';
  const html = c.veliEpostaDuzMetin('(' + url + ').\n**https://example.test/kalin**\nhttps://example.test/x!\nhttps://example.test/y;', 'tr', 'Test');
  assert.ok(html.includes('href="https://example.test/portal?a=1&amp;b=2"'));
  assert.match(html, /b=2<\/a>\)\./); assert.match(html, /<b><a [^>]+>https:\/\/example\.test\/kalin<\/a><\/b>/);
  assert.match(html, /\/x<\/a>!/); assert.match(html, /\/y<\/a>;/); assert.doesNotMatch(html, /&amp;amp;/);
});
test('Zengin içerikte sekiz blok türü, sırası ve liste notunun 16 px ölçüsü korunur', () => {
  const html = c.veliEpostaZengin([
    {tur:'paragraf', metin:'BLOK-1'}, {tur:'baslik', metin:'BLOK-2'}, {tur:'dugme', metin:'BLOK-3', url:'https://example.test/portal'},
    {tur:'gorsel', src:'cid:ornek', alt:'BLOK-4'}, {tur:'liste', ogeler:[{baslik:'BLOK-5', not:'Kitap s. 16'}]},
    {tur:'madde', ogeler:['BLOK-6']}, {tur:'cizgi'}, {tur:'not', metin:'BLOK-7'}
  ], 'fr', 'Zengin', {kurum:'cami'});
  const pos = Array.from({length:7}, (_,i) => html.indexOf('BLOK-' + (i+1)));
  assert.ok(pos.every((p,i) => p >= 0 && (!i || p > pos[i-1])));
  assert.match(html, /<h2\b/); assert.match(html, /<ol\b/); assert.match(html, /<ul\b/);
  assert.match(html, /font-size:16px[^>]+>Kitap s\. 16/); assert.match(html, /border-radius:50%/); assert.match(html, /src="cid:ornek"/);
  assert.ok(html.includes(kimlik.gorunum.ortakRenk.cizgi));
});
test('Bilinmeyen blok ve bozuk liste/görseller açık hatadır', () => {
  for (const blok of [null, {tur:'video'}, {tur:'liste'}, {tur:'madde', ogeler:'yanlis'}, {tur:'liste', ogeler:[null]}]) assert.throws(() => c.veliEpostaZengin([blok], 'tr', ''), /veli-eposta-/);
  assert.throws(() => c.veliEpostaZengin(null, 'tr', ''), /veli-eposta-bloklar/);
  assert.throws(() => c.veliEpostaDuzMetin('', 'tr', '', {gorseller:'yanlis'}), /veli-eposta-gorseller/);
});
test('Düğmenin URL, metin ve görsel alt alanları kaçışlanır; etkin URL şemaları reddedilir', () => {
  const html = c.veliEpostaZengin([{tur:'dugme', metin:'<Aç>', url:'https://example.test/?q="özel"&b=2'}, {tur:'gorsel', src:'https://example.test/logo.png?q="x"&b=2', alt:'" onerror="x'}], 'tr', '');
  assert.match(html, /href="https:\/\/example\.test\/\?q=&quot;özel&quot;&amp;b=2"/);
  assert.match(html, /&lt;Aç&gt;/); assert.match(html, /alt="&quot; onerror=&quot;x"/);
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//example.test', 'http://example.test', 'https://example.test/\nizle']) assert.throws(() => c.veliEpostaZengin([{tur:'dugme', metin:'Aç', url}], 'tr', ''), /veli-eposta-dugme-url/);
  assert.throws(() => c.veliEpostaZengin([{tur:'gorsel', src:'data:image/png;base64,AA'}], 'tr', ''), /veli-eposta-gorsel-url/);
});
test('Düz metin seçenekleri düğme, görsel, liste, alt not ve gizli önizlemeyi taşır', () => {
  const html = c.veliEpostaDuzMetin('Metin', 'en', 'Başlık', {dugme:{metin:'Open', url:'https://example.test'}, gorseller:[{src:'cid:resim', alt:'Logo'}], liste:[{baslik:'Step', not:'Note'}], altNot:'Son not', onIzleme:'Gizli <özet>'});
  for (const text of ['Open', 'cid:resim', 'Step', 'Son not', 'Gizli &lt;özet&gt;']) assert.ok(html.includes(text));
  assert.match(html, /mso-hide:all/);
  assert.ok(c.veliEpostaBelge('tr', '', '', 'Eski alt not').includes('Eski alt not'));
});
test('Açık renk bildirimi, Outlook tablo çerçevesi ve kaynak ölçüleri bulunur', () => {
  const html = c.veliEpostaDuzMetin('Metin', 'tr', 'Başlık');
  assert.match(html, /name="color-scheme" content="light"/); assert.match(html, /name="supported-color-schemes" content="light"/);
  assert.match(html, /<!--\[if mso\]>/); assert.ok(html.includes('max-width:' + kimlik.gorunum.eposta.genislikPx + 'px'));
  assert.equal((html.match(/<table\b/g) || []).length, (html.match(/<table role="presentation"/g) || []).length);
  assert.ok(html.includes('font-family:' + htmlKacis(kimlik.gorunum.yaziTipi.epostaYigin)));
});
test('Renderer gerçek stdin/stdout sürecinde düz ve zengin JSON sözleşmesini uygular', () => {
  for (const dil of kimlik.diller) for (const kurum of ['kurs', 'cami']) {
    for (const govde of [{metin:'**TESTOGLU**'}, {metin:'YOKSAY', bloklar:[{tur:'paragraf', metin:'**TESTOGLU**'}]}]) {
      const r = cli(JSON.stringify({...govde, dil, kurum, baslik:'Başlık', dugme:{metin:'Aç', url:'https://example.test'}, altNot:'Son not'}));
      assert.equal(r.status, 0, r.stderr); assert.equal(r.stderr, '');
      assert.ok(r.stdout.startsWith('<!doctype html>')); assert.match(r.stdout, /<b>TESTOGLU<\/b>/); assert.match(r.stdout, /Son not/);
      assert.doesNotMatch(r.stdout, /YOKSAY/);
    }
  }
});
test('Renderer hatalı JSON/dil/kurum/blok için stdout boş, stderr açıklamalı ve çıkış kodu 1 verir', () => {
  for (const input of ['{bozuk', 'null', '[]', '{}', '{"dil":"tr","kurum":"yok"}', '{"dil":"en","bloklar":[{"tur":"bilinmiyor"}]}']) {
    const r = cli(input); assert.equal(r.status, 1); assert.equal(r.stdout, ''); assert.match(r.stderr, /veli-eposta-/);
  }
});
test('Altı imza HTML/TXT çifti kaynak satırlarını ve 48 px amblemi taşır; gizlilik bağlantısı yoktur', () => {
  const klasor = join(dirname(kimlik.anaKaynak), 'imza');
  for (const kurum of ['kurs', 'cami']) for (const dil of kimlik.diller) {
    const ad = 'imza-' + kurum + '-' + dil, html = readFileSync(join(klasor, ad + '.html'), 'utf8');
    assert.equal(readFileSync(join(klasor, ad + '.txt'), 'utf8'), kimlik.yazisma.imza[kurum][dil].join('\n') + '\n');
    assert.match(html, /width="48" height="48"/);
    assert.ok(html.includes(kimlik.kurumlar[kurum].logo.web));
    for (const satir of kimlik.yazisma.imza[kurum][dil]) assert.ok(html.includes(htmlKacis(satir)));
    assert.ok(!html.includes(kimlik.iletisim.gizlilik[dil]));
    assert.ok(readFileSync(join(klasor, 'OKUBENI.md'), 'utf8').includes(ad + '.html'));
  }
});
test('Kayıt onayı iki veli dilinde kurs çerçevesi/adıyla gider; ek ve alıcı korunur', () => {
  for (const dil of ['tr', 'fr']) {
    const {c:x, sent} = ortam(), ek = {getName:()=> 'ornek.pdf'};
    assert.equal(x.kopyaGonderV2(ek, 'UC-2099-0001', 'Deniz TESTOGLU', ['veli@example.test'], dil), true);
    assert.equal(sent.length, 1); assert.equal(sent[0].to, 'veli@example.test'); assert.equal(sent[0].attachments[0], ek);
    assert.equal(sent[0].name, kimlik.kurumlar.kurs.gonderenAdi); assert.equal(sent[0].replyTo, kimlik.iletisim.eposta.yanit);
    assert.match(sent[0].htmlBody, /data-eposta-sablon="v2" data-kurum="kurs"/);
  }
});
test('İhtida kopyası açıkça verilen üç dilde cami çerçevesi/adıyla gider', () => {
  for (const dil of kimlik.diller) {
    const {c:x, sent} = ortam(), ek = {};
    x.ihtidaKopyaGonderV2(ek, 'IH-2099-0001', 'Deniz TESTOGLU', 'veli@example.test', dil);
    assert.equal(sent.length, 1); assert.equal(sent[0].name, kimlik.kurumlar.cami.gonderenAdi);
    assert.equal(sent[0].attachments[0], ek); assert.match(sent[0].htmlBody, /data-eposta-sablon="v2" data-kurum="cami"/);
    assert.match(sent[0].htmlBody, new RegExp('<html lang="' + dil + '">'));
    assert.ok(!sent[0].subject.includes(' / '));
  }
  assert.throws(() => c.ihtidaKopyaGonderV2({}, 'IH-2099-0001', 'TESTOGLU', 'veli@example.test'), /veli-eposta-dil/);
});
test('Brevo ve MailApp gönderenleri kurum parametresini izler; çağıranın nesnesi değişmez', () => {
  for (const kurum of ['kurs', 'cami']) {
    const {c:x, sent} = ortam(); const payload = [];
    x.brevoAnahtari = () => 'test-anahtar';
    x.UrlFetchApp.fetch = (url, s) => { payload.push(JSON.parse(s.payload)); return {getResponseCode:()=>201, getContentText:()=> '{}'}; };
    const s = {to:'veli@example.test', subject:'Test', body:'TESTOGLU', kurum, name:'Eski ad'};
    x.epostaGonder(s);
    assert.deepEqual(payload[0].sender, {name:kimlik.kurumlar[kurum].gonderenAdi, email:kimlik.kurumlar[kurum].epostaAdresi});
    assert.equal(s.name, 'Eski ad'); assert.equal(s.kurum, kurum);
    x.brevoAnahtari = () => null;
    x.epostaGonder('veli@example.test', 'Test', 'TESTOGLU', kurum);
    assert.equal(sent[0].name, kimlik.kurumlar[kurum].gonderenAdi);
    assert.ok(!Object.hasOwn(sent[0], 'kurum'));
  }
  assert.equal(c.EPOSTA.ad, kimlik.kurumlar.cami.gonderenAdi);
  assert.equal(c.BREVO_GONDEREN.name, kimlik.kurumlar.cami.gonderenAdi);
  assert.throws(() => c.epostaGonder({kurum:'yok'}), /veli-eposta-kurum/);
});
test('Cuma içeriği ve Brevo yükü kurs kimliğini, imam yanıt adresini ve içerik bloklarını taşır', () => {
  const {c:x} = ortam(); let payload;
  const model = x.veliCumaModel('2026-09-11', {donem:'2026-2027', gunler:[{tarih:'2026-09-12', dersler:[{kod:'kuran', konu:'Harfler', kaynak:'Kitap s. 16'}]}]}, [], {});
  const icerik = x.veliCumaIcerik(model, 'tr', t => t);
  assert.match(icerik.htmlBody, /data-kurum="kurs"/); assert.match(icerik.htmlBody, /Kitap s\. 16/);
  assert.doesNotMatch(oku('veli-cuma.gs'), /#[a-f\d]{3,8}\b/i);
  x.brevoAnahtari = () => 'test-anahtar';
  x.UrlFetchApp.fetch = (url, s) => {payload = JSON.parse(s.payload); return {getResponseCode:()=>201, getContentText:()=> '{"messageId":"test@example.test"}'};};
  assert.equal(x.veliCumaGonder({eposta:'veli@example.test'}, icerik, 'test-id', 'test-tag').durum, 'saglayici-kabul');
  assert.equal(payload.sender.name, kimlik.kurumlar.kurs.gonderenAdi);
  assert.equal(payload.replyTo.email, kimlik.iletisim.eposta.dinGorevlisi);
  assert.equal(payload.headers.idempotencyKey, 'test-id');
});
test('Brevo sınaması da ortak çerçeve kullanır; yalnız sahte taşıyıcı çalışır', () => {
  const {c:x, sent} = ortam();
  x.Utilities = {newBlob:()=>({})}; x.brevoSina();
  assert.equal(sent.length, 1); assert.match(sent[0].htmlBody, /data-kurum="cami"/); assert.match(sent[0].htmlBody, /data-eposta-sablon="v2"/);
  assert.doesNotMatch(sent[0].htmlBody, /&lt;p&gt;/);
});
test('PDF üst künyesi görünümünü korur ve kaynak alanları değişince yenilenir', () => {
  const {c:x} = ortam();
  x.KIMLIK.hukuki.kbo = 'TEST-KBO'; x.KIMLIK.iletisim.adres.tekSatir = 'Test sokak';
  const html = x.pdfUst('Başlık', '', 'tr', 'UC-2099-0001', '2099-01-01', '');
  assert.match(html, /TEST-KBO/); assert.match(html, /Test sokak/); assert.ok(html.includes(kimlik.hukuki.resmiAd));
});
// 13 Eyl 2026 temizliği: v29↔v31 birebir koruma testi kaldırıldı — v9–v30 kaynakları depodan çıktı (git geçmişinde), v31 canlıda doğrulandı.
