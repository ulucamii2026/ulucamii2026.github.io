import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import sharp from 'sharp';
import { ek10Uret } from '../public/admin/ek10.js';
import { ek9Uret, sahitleriCoz } from '../public/admin/ek9.js';
import { sahitOnerileri, sahitUnvani } from '../public/admin/ek9-hazirlik.js';
import { ihtidaPaketiUret } from '../public/admin/ihtida-paket.js';
import { dilekceUret } from '../public/admin/dilekce.js';
import { camiCoz } from '../public/admin/cami-secimi.js';
import { imzaVektorCoz } from '../public/admin/imza-ciz.js';
import { ek10SurumuCoz } from '../public/admin/ek10.js';
import { adBicimleri } from '../public/admin/kalem.js';
import { pdfMetni } from './yardim/pdf-metin.mjs';

const source = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v43.gs'].map(ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');
function backend() { const ctx = vm.createContext({ console, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) } }); vm.runInContext(source, ctx); ctx.IhtidaPdf = { camiCoz, imzaVektorCoz }; return ctx; }
const govde = () => ({
  sir: 'ULUCAMII-IHTIDA-2026', dil: 'tr', gonderimAnahtari: 'test-islem-2099-9999',
  basvuran: { adSoyad: 'Deniz Örnek', cinsiyet: 'kadin', dogumTarihi: '1990-05-20', dogumYeri: 'Namur', uyruk: 'Belçika', anneAdi: 'Anne', babaAdi: 'Baba', medeniHali: 'bekar', ogrenimDurumu: 'Lisans', meslek: 'Öğretmen', oncekiDin: 'Belirtilen inanç', eposta: 'deniz@example.test', telefon: '+32470000000', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', adresSokak: 'Rue du Test 12', postaKodu: '6900', sehir: 'Marche-en-Famenne', ulke: 'Belçika', torenDili: 'tr' },
  teslimat: { yontem: 'adres' }, sahitSecimi: 'kendi', sahitler: [{ ad: 'Birinci Örnek' }, { ad: 'İkinci Örnek' }],
  fotografIzni: false, belgeTuru: 'pasaport', imzaYok: true,
  gorseller: { vesikalik: 'data:image/png;base64,' + 'A'.repeat(400), kimlikOn: 'data:image/png;base64,' + 'A'.repeat(400), kimlikArka: '', imza: '' },
  onay: { acikRiza: true, ek10: true, ek10Surumu: '2026-09-09', imzaAktarimIzni: false, gizlilik: true, gorselRiza: true, beyan: 'Deniz Örnek' },
});

test('Şahit adı, imzası yokken de korunur; yalnız boş yer tamamlanır', () => {
  const sonuc = sahitleriCoz([{ ad: 'Birinci Örnek', imza: '' }], [{ ad: 'Yedek Örnek', imza: 'sahte' }]);
  assert.equal(sonuc[0].ad, 'Birinci Örnek'); assert.equal(sonuc[0].imza, ''); assert.equal(sonuc[1].ad, 'Yedek Örnek');
  assert.deepEqual(sahitOnerileri({}), ['Ercan MOLA', 'Rıdvan KAYAHAN']);
  assert.deepEqual(sahitOnerileri({ 'Şahit 1': 'Rıdvan KAYAHAN' }), ['Rıdvan KAYAHAN', 'Ercan MOLA']);
  assert.deepEqual(sahitOnerileri({ 'Şahit 1': 'Ercan MOLA' }), ['Ercan MOLA', 'Rıdvan KAYAHAN']);
  assert.deepEqual(sahitOnerileri({ 'Şahit 1': 'Yeliz KAYAHAN', 'Şahit 2': 'Önceki Şahit' }), ['Yeliz KAYAHAN', 'Önceki Şahit']);
  assert.deepEqual(sahitOnerileri({ 'Cami kimliği': 'namur-camii-namur' }), ['', '']);
  assert.equal(sahitUnvani(' Rıdvan  KAYAHAN '), 'Din Görevlisi');
  assert.equal(sahitUnvani('Ercan MOLA'), 'Dernek Başkanı');
  assert.equal(sahitUnvani('Yeliz KAYAHAN'), '');
  assert.equal(sahitUnvani('Ercan MOLA', 'namur-camii-namur'), '');
});

test('Teslim ve şahit seçimleri doğrulanır; önceki sürüm başvuruları korunur', () => {
  const c = backend(), v = govde();
  assert.equal(c.ihtidaDogrulaV2(v).tamam, true);
  for (const alan of ['adresSokak', 'postaKodu', 'sehir', 'ulke']) {
    const eksik = govde(); delete eksik.basvuran[alan];
    assert.equal(c.ihtidaDogrulaV2(eksik).tamam, false, alan + ' sunucuda zorunlu');
  }
  const uyumsuz = govde(); uyumsuz.basvuran.adres = 'Eksik veya farklı adres';
  assert.equal(c.ihtidaDogrulaV2(uyumsuz).tamam, false);
  const fotosuz = govde(); fotosuz.gorseller.vesikalik = '';
  assert.equal(c.ihtidaDogrulaV2(fotosuz).tamam, false);
  delete fotosuz.gorseller.vesikalik;
  assert.equal(c.ihtidaDogrulaV2(fotosuz).tamam, false);
  for (const degistir of [x => x.teslimat.yontem = 'bilinmeyen', x => x.sahitSecimi = 'bilinmeyen', x => x.sahitler.push({ ad: 'Fazla' }), x => x.sahitler[0].ad = '', x => x.sahitSecimi = 'cami']) {
    const yanlis = govde(); degistir(yanlis); assert.equal(c.ihtidaDogrulaV2(yanlis).tamam, false);
  }
  const cami = govde(); cami.sahitSecimi = 'cami'; cami.sahitler = []; cami.teslimat.yontem = 'cami';
  assert.equal(c.ihtidaDogrulaV2(cami).tamam, true);
  const eski = govde(); delete eski.teslimat; delete eski.sahitSecimi;
  assert.equal(c.ihtidaDogrulaV2(eski).tamam, true);
  assert.match(c.ihtidaTeslimMetni(eski, 'tr'), /teyit/);
});

test('Yeni EK-10 sürümü çizili imzanın aktarım iznini zorunlu kılar; sürümsüz eski gövde korunur', () => {
  const c = backend();
  const eski = govde();
  delete eski.onay.ek10Surumu;
  delete eski.onay.imzaAktarimIzni;
  assert.equal(c.ihtidaDogrulaV2(eski).tamam, true);
  const gecersizSurum = govde();
  gecersizSurum.onay.ek10Surumu = 'v1';
  assert.equal(c.ihtidaDogrulaV2(gecersizSurum).kod, 'onay-ek10-surum-gecersiz');

  const imzali = govde();
  imzali.imzaYok = false;
  imzali.gorseller.imza = 'data:image/png;base64,' + 'A'.repeat(400);
  imzali.onay.ek10Surumu = '2026-09-09';
  assert.equal(c.ihtidaDogrulaV2(imzali).kod, 'onay-imza-aktarim-izni-eksik');

  imzali.onay.imzaAktarimIzni = true;
  assert.equal(c.ihtidaDogrulaV2(imzali).tamam, true);
  imzali.onay.imzaAktarimIzni = false;
  assert.equal(c.ihtidaDogrulaV2(imzali).kod, 'onay-imza-aktarim-izni-eksik');

  const imzasiz = govde();
  imzasiz.onay.ek10Surumu = '2026-09-09';
  imzasiz.onay.imzaAktarimIzni = false;
  assert.equal(c.ihtidaDogrulaV2(imzasiz).tamam, true);
  imzasiz.onay.imzaAktarimIzni = true;
  assert.equal(c.ihtidaDogrulaV2(imzasiz).kod, 'onay-imza-aktarim-izni-gecersiz');
});

test('Ekim 2026 EK-10 ve vektör imza sunucuda doğrulanır; sürüm deftere metin olarak yazılır', () => {
  const c = backend();
  const vektor = JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22L140 40M60 66L170 70' });
  const ekim = govde();
  Object.assign(ekim, { imzaYok: false }); ekim.gorseller.imza = 'data:image/png;base64,' + 'A'.repeat(400);
  ekim.onay.ek10Surumu = '2026-10'; ekim.onay.imzaAktarimIzni = true;
  assert.equal(c.ihtidaDogrulaV2(ekim).tamam, true, 'vektörsüz (eski tarayıcı) gövde de geçer');
  ekim.gorseller.imzaVektor = vektor;
  assert.equal(c.ihtidaDogrulaV2(ekim).tamam, true);
  for (const bozuk of ['{"v":1}', 'M0 0', JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M0 0L1 1<script>' }), 'x'.repeat(120001)]) {
    const b = govde(); Object.assign(b, { imzaYok: false }); b.gorseller.imza = ekim.gorseller.imza;
    b.onay.ek10Surumu = '2026-10'; b.onay.imzaAktarimIzni = true; b.gorseller.imzaVektor = bozuk;
    assert.equal(c.ihtidaDogrulaV2(b).kod, 'imza-vektor-gecersiz', bozuk.slice(0, 30));
  }
  const imzasizVektor = govde(); imzasizVektor.onay.ek10Surumu = '2026-10'; imzasizVektor.gorseller.imzaVektor = vektor;
  assert.equal(c.ihtidaDogrulaV2(imzasizVektor).kod, 'imza-fazla', 'imza atamıyorum diyen başvuruda vektör imza olamaz');
  const paketsiz = backend(); delete paketsiz.IhtidaPdf.imzaVektorCoz;
  assert.equal(paketsiz.ihtidaDogrulaV2(ekim).kod, 'imza-vektor-gecersiz', 'çözücü yoksa kapalı başarısızlık');
  // Sheets «2026-10»u tarihe çevirmesin: hücreye kesme işaretiyle yazılır; tarihe dönmüş eski değerler de tanınır.
  assert.match(source, /onay\.ek10Surumu \? "'" \+ onay\.ek10Surumu : ""/);
  assert.equal(ek10SurumuCoz('2026-10'), '2026-10');
  assert.equal(ek10SurumuCoz('01.10.2026'), '2026-10');
  assert.equal(ek10SurumuCoz('09.09.2026 00:00'), '2026-09-09');
  assert.equal(ek10SurumuCoz('2026-09-09'), '2026-09-09');
  assert.equal(ek10SurumuCoz(''), 'v1');
});

test('Resmî ad biçimi: serbest yazılan ad soyadda soyad büyük harfe çevrilir, kişinin seçimi korunur', () => {
  assert.deepEqual(adBicimleri('marco bellandi'), { yazili: ['Marco BELLANDI', 'BELLANDI Marco'], el: ['Marco Bellandi', 'Bellandi Marco'] });
  assert.deepEqual(adBicimleri('Marco BELLANDI').yazili, ['Marco BELLANDI', 'BELLANDI Marco']);
  assert.deepEqual(adBicimleri('Ayşe yılmaz').yazili, ['Ayşe YILMAZ', 'YILMAZ Ayşe']);
  assert.deepEqual(adBicimleri('jean-luc McDonald').yazili, ['Jean-Luc MCDONALD', 'MCDONALD Jean-Luc']);
});

test('Ulu Camii başvurusunda aynı kişi iki şahit olarak kaydedilemez', () => {
  const c = backend(), v = govde();
  v.sahitler = [{ ad: 'Birinci Örnek' }, { ad: '  BİRİNCİ   ÖRNEK  ' }];
  assert.equal(c.ihtidaDogrulaV2(v).tamam, false);
});

test('Başka cami kanonikleşir, iki farklı şahit ister ve yerel imzaları yedeklemez', async () => {
  const c = backend();
  const yabanci = govde();
  yabanci.cami = { id: 'namur-camii-namur', ad: 'Değiştirilmiş ad', sehir: 'Başka şehir', postaKodu: '0000', adres: 'Sahte adres' };
  yabanci.sahitler = [{ ad: '' }, { ad: '' }];
  assert.equal(c.ihtidaDogrulaV2(yabanci).kod, 'sahit-adi-eksik');
  yabanci.sahitler = [{ ad: 'Aynı Şahit' }, { ad: 'Aynı Şahit' }];
  assert.equal(c.ihtidaDogrulaV2(yabanci).kod, 'diger-cami-sahitler-farkli-olmali');
  yabanci.sahitler = [{ ad: 'Birinci Namur Şahidi' }, { ad: 'İkinci Namur Şahidi' }];
  assert.equal(c.ihtidaDogrulaV2(yabanci).tamam, true);
  assert.deepEqual(c.ihtidaCamiCoz(yabanci.cami), { id: 'namur-camii-namur', ad: 'Namur Camii', sehir: 'Namur', postaKodu: '5000', adres: 'Rue Denis Georges Bayar 13', kurum: 'BDV' });
  assert.equal(c.ihtidaCamiCoz({ id: 'uydurma-cami' }), null);
  assert.equal(camiCoz({ id: 'diger', ad: 'Elle Girilen Cami', sehir: 'Namur', postaKodu: '0690', adres: 'Rue du Test 1' }), null, 'Belçika posta kodu dört haneli ve sıfırla başlamaz');
  assert.deepEqual(camiCoz({ id: 'diger', ad: 'Elle Girilen Cami', sehir: 'Namur', postaKodu: '5000', adres: 'Rue du Test 1' }), { id: 'diger', ad: 'Elle Girilen Cami', sehir: 'Namur', postaKodu: '5000', adres: 'Rue du Test 1', kurum: 'Diğer' });
  assert.deepEqual(sahitOnerileri({ 'Cami kimliği': 'namur-camii-namur' }), ['', '']);
});

test('PDF özeti üç dilde teslimi taşır, adres metnini HTML olarak çalıştırmaz', () => {
  const c = backend(), v = govde();
  v.basvuran.adres = '<img src=x onerror=alert(1)> 6900';
  for (const dil of ['tr', 'fr', 'en']) {
    const html = c.pdfHtmlIhtida(v, { dil, ref: 'IH-2099-9999', zaman: '08.09.2026' });
    assert.match(html, /6900/); assert.match(html, /Birinci Örnek/);
    assert.ok(!html.includes('<img src=x')); assert.ok(html.includes('&lt;img'));
  }
});

test('Defter ve bildirim teslim seçimini kaybetmez; eski sütun sırası değişmez', () => {
  const c = backend(), v = govde(), mesajlar = [];
  let satir;
  c.json = x => x;
  c.ihtidaKlasorGetir = () => ({ createFile: () => ({ getUrl: () => 'https://example.test/arsiv' }) });
  c.ihtidaV2SayfaGetir = () => ({ getLastRow: () => 1, getParent: () => ({ getUrl: () => 'https://example.test/defter' }) }); // v40: boş defter — hacim sınırı sayacak satır yok
  c.ihtidaV2AnahtarBul = () => null; c.ihtidaV2AnahtarKaydet = () => {};
  c.ihtidaPaketKuyrugaAl = () => {}; c.ihtidaPaketIsle = async () => {};
  c.v1SayfaBulTablo = () => null; c.referansMaxBul = () => 9999;
  c.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  c.Utilities = { formatDate: () => '08.09.2026 12:00' };
  c.htmlPdfUret = () => ({}); c.ihtidaGorselleriKaydet = () => [];
  c.satirEkle = (_, s) => { satir = s; }; c.SpreadsheetApp = { flush() {} };
  c.epostaGonder = m => mesajlar.push(m); c.ihtidaKopyaGonderV2 = () => {};
  const result = c.ihtidaPostIsleV2(v);
  assert.equal(result.ok, true);
  assert.equal(satir.length, c.BASLIKLAR2_IHTIDA.length);
  assert.equal(satir[29], 'Yeni başvuru');
  assert.equal(satir[c.BASLIKLAR2_IHTIDA.indexOf('Şahit 1')], 'Birinci Örnek');
  assert.equal(satir[c.BASLIKLAR2_IHTIDA.indexOf('Belge teslim yeri')], 'adres');
  assert.equal(satir[c.BASLIKLAR2_IHTIDA.indexOf('Şahit seçimi')], 'kendi');
  assert.equal(satir[c.BASLIKLAR2_IHTIDA.indexOf('EK-10 rızası')], 'Evet');
  assert.equal(satir[c.BASLIKLAR2_IHTIDA.indexOf('Posta kodu')], '6900');
  assert.equal(satir[c.BASLIKLAR2_IHTIDA.indexOf('Şehir')], 'Marche-en-Famenne');
  assert.equal(satir[c.BASLIKLAR2_IHTIDA.indexOf('Kimlik belgesi türü')], 'pasaport');
  assert.equal(mesajlar.length, 0, 'Özet PDF yerine tam paket kuyruğu e-posta gönderir');
  assert.equal(result.paket, 'sirada');
});

test('Yeni EK-10 iki sayfa ve dört dilde tek imzayı yalnız ikinci sayfaya ekler', async () => {
  const sablonBytes = readFileSync(new URL('../public/belgeler/ihtida/ek10-kvkk-acik-riza-metni.pdf', import.meta.url));
  const fontBytes = readFileSync(new URL('../public/fonts/Lora-Regular.ttf', import.meta.url));
  const png = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="70"><text x="15" y="53" font-size="52">TEST</text></svg>')).png().toBuffer();
  const girdi = { pdfLib, fontkit, sablonBytes, fontBytes, adSoyad: 'Deniz Örnek', tarih: '08/09/2026', imza: 'data:image/png;base64,' + png.toString('base64'), onay: true, surum: '2026-09-09', imzaAktarimIzni: true };
  const bytes = await ek10Uret(girdi), yeni = await pdfLib.PDFDocument.load(bytes), eski = await pdfLib.PDFDocument.load(sablonBytes);
  assert.equal(yeni.getPageCount(), 2);
  const gorselSayisi = s => s.node.Resources().lookup(pdfLib.PDFName.of('XObject'))?.keys().length || 0;
  assert.equal(gorselSayisi(yeni.getPage(0)), gorselSayisi(eski.getPage(0)));
  assert.equal(gorselSayisi(yeni.getPage(1)), gorselSayisi(eski.getPage(1)) + 1);
  await assert.rejects(() => ek10Uret({ ...girdi, onay: false }), /rızası/);
  await assert.rejects(() => ek10Uret({ ...girdi, imza: 'bozuk' }), /okunamadı/);
  const bos = await ek10Uret({ ...girdi, onay: true, imzaAktarimIzni: false, imza: '', tarih: '' });
  assert.equal((await pdfLib.PDFDocument.load(bos)).getPageCount(), 2);
  const out = new URL('../.codex/cikti/ihtida/', import.meta.url);
  mkdirSync(out, { recursive: true }); writeFileSync(new URL('ek10-onizleme.pdf', out), bytes);
});


test('EK-9 mavi el yazısında fontu tam gömer; sade seçenekte eski yazıya döner', async () => {
  const oku = ad => readFileSync(new URL('../public/' + ad, import.meta.url));
  const kaynak = { pdfLib, fontkit, sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'),
    fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'),
    fontKaligrafiBytes: oku('fonts/GreatVibes-Regular.ttf'), fontElYazisiBytes: oku('fonts/Caveat-Medium.ttf') };
  const alfabe = 'ÇĞİÖŞÜçğıöşüéèêëàâäùûüôœÉÈÊËÀÂÄÙÛÜÔŒ0123456789@.+()/,-';
  for (const bytes of [kaynak.fontKaligrafiBytes, kaynak.fontElYazisiBytes]) {
    const f = fontkit.create(bytes);
    for (const c of alfabe) assert.ok(f.hasGlyphForCodePoint(c.codePointAt(0)), 'Eksik harf: ' + c);
  }
  const veri = { adSoyad: 'Deniz Élodie Örnek', anneAdi: 'İlknur', dogumYeri: 'Liège', dogumTarihi: '20/05/1990', adres: 'Rue du Test 12, 6900, Belçika' };
  for (const stil of ['mavi', 'sade']) {
    const bytes = await ek9Uret({ ...kaynak, veri, isimYazisi: stil === 'sade' ? 'sade' : 'kaligrafik', alanYazisi: stil === 'sade' ? 'sade' : 'el-yazisi' });
    const doc = await pdfLib.PDFDocument.load(bytes); assert.equal(doc.getPageCount(), 2);
    // Ortak şablonun kurum seçimi her üretilen PDF'de korunmalı; Müşavirlik üstü çizilmemeli.
    const ilkAkis = doc.getPage(0).node.Contents().asArray().map(ref => Buffer.from(pdfLib.decodePDFRawStream(doc.context.lookup(ref)).decode()).toString('latin1')).join('');
    const cizgiler = [...ilkAkis.matchAll(/([\d.]+) ([\d.]+) m\s+([\d.]+) ([\d.]+) l\s+\.8 w\s+\.08 \.2 \.48 RG S/g)].map(m => m.slice(1).map(Number));
    const beklenen = [[144.593, 305.896, 232.859, 305.896], [328.213, 305.896, 411.465, 305.896], [256.38, 244.35, 304.441, 244.35], [434.936, 244.35, 477.344, 244.35]];
    assert.equal(cizgiler.length, 4, 'Türkçe ve İngilizce dört kurum alternatifi çizilmeli');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) assert.ok(Math.abs(cizgiler[i][j] - beklenen[i][j]) < .02, 'Kurum çizgisi ilgili kelimenin üzerinde olmalı');
    const adlar = [];
    const fonts = doc.getPage(1).node.Resources().lookup(pdfLib.PDFName.of('Font'), pdfLib.PDFDict);
    for (const [, ref] of fonts.entries()) {
      const f = doc.context.lookup(ref, pdfLib.PDFDict);
      const ad = f.lookup(pdfLib.PDFName.of('BaseFont'))?.toString() || ''; adlar.push(ad);
      if (ad.includes('Caveat')) {
        const alt = f.lookup(pdfLib.PDFName.of('DescendantFonts'), pdfLib.PDFArray).lookup(0, pdfLib.PDFDict);
        const tanim = alt.lookup(pdfLib.PDFName.of('FontDescriptor'), pdfLib.PDFDict);
        const veri = tanim.lookup(pdfLib.PDFName.of('FontFile2'), pdfLib.PDFRawStream);
        // Alt küme gömme bazı harfleri görünmez yapıyordu: tam font korunmalı.
        assert.deepEqual(Buffer.from(pdfLib.decodePDFRawStream(veri).decode()), kaynak.fontElYazisiBytes);
      }
    }
    assert.equal(adlar.some(ad => ad.includes('Caveat')), stil === 'mavi');
    const akislar = doc.getPage(1).node.Contents();
    const metin = akislar.asArray().map(ref => Buffer.from(pdfLib.decodePDFRawStream(doc.context.lookup(ref)).decode()).toString('latin1')).join('');
    assert.equal(metin.includes('0.08 0.2 0.48 rg'), stil === 'mavi');
    // İmza yüklenmemişken de künye ile sağ alt beyan bloğunda aynı tam ad bulunmalı.
    const yazilar = [...metin.matchAll(/1 0 0 1 ([-\d.]+) ([-\d.]+) Tm\s+<([A-F\d]+)> Tj/g)].map(m => ({ x: +m[1], y: +m[2], metin: m[3] }));
    const kunye = yazilar.find(y => Math.abs(y.x - 182.5) < .1 && y.y > 400 && y.y < 405);
    const beyan = yazilar.find(y => y.x > 600 && y.y > 135 && y.y < 150);
    assert.ok(kunye && beyan, 'İkinci sayfada başvuranın künye ve beyan adı bulunmalı');
    assert.equal(beyan.metin, kunye.metin, 'Beyan adı kesilmeden ve harf kaybetmeden aktarılmalı');
  }
  await assert.rejects(() => ek9Uret({ ...kaynak, veri: {}, cami: { id: 'namur-camii-namur' }, sahitler: [{ ad: 'Birinci Şahit' }, { ad: 'İkinci Şahit' }], yedekImzalar: [{ ad: 'Rıdvan KAYAHAN', imza: 'yerel' }] }), /yerel yedek şahit/);
});

test('Tam paket Müşavirlik sırasıyla yedi sayfadır; kalem yazısı, vektör imza ve eksik ek denetimi', async () => {
  const oku = ad => readFileSync(new URL('../public/' + ad, import.meta.url));
  const png = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><path d="M20 70 Q70 5 120 60 T270 40" fill="none" stroke="black" stroke-width="4"/></svg>')).png().toBuffer();
  const resim = 'data:image/png;base64,' + png.toString('base64');
  const kartJpg = async yuz => 'data:image/jpeg;base64,' + (await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1011" height="638"><rect width="1011" height="638" fill="#eee6f2"/><text x="40" y="80" font-size="40">ÖRNEK ${yuz}</text></svg>`)).jpeg().toBuffer()).toString('base64');
  const vektor = JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22L140 40L180 52L224 58M60 66L170 70' });
  const g = { pdfLib, fontkit, sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'), ek10SablonBytes: oku('belgeler/ihtida/ek10-acik-riza-metni-2026-10.pdf'),
    dilekceSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10.pdf'), dilekceAdresSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10-adres.pdf'),
    kalemFontBytes: oku('fonts/Allura-Regular.ttf'),
    fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'), fontKaligrafiBytes: oku('fonts/GreatVibes-Regular.ttf'), fontElYazisiBytes: oku('fonts/Caveat-Medium.ttf'),
    veri: { ref: 'IH-2099-9999', adSoyad: 'Deniz Élodie örnek', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', beyanTarihi: '09/09/2026', ihtidaTarihi: '08/09/2026', ihtidaSebebi: 'Kendi araştırmam sonucunda.', dil: 'fr', eposta: 'deniz@example.test', dogumTarihi: '20/05/1990' },
    sahitler: [{ ad: 'Birinci Örnek', imza: resim }, { ad: 'İkinci Örnek', imza: resim }],
    foto: resim, kimlikOn: await kartJpg('RECTO'), kimlikArka: await kartJpg('VERSO'), belgeTuru: 'kimlik', basvuranImza: resim, basvuranImzaVektor: vektor, ek10Onayi: true,
    ek10Surumu: '2026-10', imzaAktarimIzni: true };
  const imzali = await ihtidaPaketiUret(g), imzasiz = await ihtidaPaketiUret({ ...g, basvuranImza: '', basvuranImzaVektor: '', imzasiz: true, ek10Onayi: false, imzaAktarimIzni: false });
  const onBasvuru = await ihtidaPaketiUret({ ...g, onBasvuru: true, veri: { ...g.veri, ihtidaTarihi: '' } });
  const out = new URL('../.codex/cikti/ihtida/', import.meta.url); mkdirSync(out, { recursive: true });
  const yaz = (ad, b) => { const u = new URL(ad, out); writeFileSync(u, b); return u; };
  const imzaliYol = yaz('tam-paket-imzali.pdf', imzali), onYol = yaz('tam-paket-on-basvuru.pdf', onBasvuru);
  yaz('tam-paket-imzasiz.pdf', imzasiz);
  const a = await pdfLib.PDFDocument.load(imzali), b = await pdfLib.PDFDocument.load(imzasiz), o = await pdfLib.PDFDocument.load(onBasvuru);
  for (const d of [a, b, o]) assert.equal(d.getPageCount(), 7, 'EK-9 ×2, dilekçe ×2, EK-10 ×2, kimlik');
  const metin = (yol, s) => pdfMetni(yol, ['-f', String(s), '-l', String(s)]);
  assert.match(metin(imzaliYol, 1), /İHTİDA BELGESİ/);
  assert.match(metin(imzaliYol, 3), /İhtida Belgesi Talep Dilekçesi/);
  assert.match(metin(imzaliYol, 5), /Açık Rıza Metni/);
  const kimlik = metin(imzaliYol, 7);
  assert.match(kimlik, /PHOTOCOPIE DE LA CARTE D'IDENTITÉ/);
  assert.match(kimlik, /ÖRNEK Deniz Élodie/, 'kimlik sayfasında SOYAD Ad');
  assert.match(kimlik, /Naissance\s*:\s*20\.05\.1990/);
  assert.match(kimlik, /RECTO[\s\S]*VERSO/);
  const akis = (d, i) => {
    const c = d.getPage(i).node.get(pdfLib.PDFName.of('Contents'));
    const refler = c instanceof pdfLib.PDFArray ? c.asArray() : [c];
    return refler.map(r => Buffer.from(pdfLib.decodePDFRawStream(d.context.lookup(r)).decode()).toString('latin1')).join('\n');
  };
  const rasterSayisi = (d, i) => {
    const x = d.getPage(i).node.Resources().lookup(pdfLib.PDFName.of('XObject'));
    return x ? x.keys().filter(k => d.context.lookup(x.get(k))?.dict?.get(pdfLib.PDFName.of('Subtype'))?.toString() === '/Image').length : 0;
  };
  // İmzalı son nüsha: vektör imza EK-9 arka yüzü, dilekçenin ve EK-10'un iki yüzü; hiçbirinde raster yok.
  for (const i of [1, 2, 3, 4, 5]) {
    assert.match(akis(a, i), /1 J/, (i + 1) + '. sayfada vektör imza');
    assert.doesNotMatch(akis(b, i), /1 J/, (i + 1) + '. sayfa imzasız nüshada boş');
    assert.equal(rasterSayisi(a, i), 0, (i + 1) + '. sayfada raster olmamalı');
  }
  // 23 Eki 2026 (Rıdvan: «tek bir imza hem belgeye hem dilekçeye hem de açık rıza metninin olduğu ek belgeye otomatik
  // basılsın»): ön başvuruda da AYNI imza EK-9 arka yüzüne, dilekçenin iki yüzüne ve EK-10'un iki yüzüne basılır.
  for (const i of [1, 2, 3, 4, 5]) assert.match(akis(o, i), /1 J/, (i + 1) + '. sayfada ön başvuruda da vektör imza');
  for (const i of [1, 2, 3, 4, 5]) assert.equal(rasterSayisi(o, i), 0, (i + 1) + '. sayfada (ön başvuru) raster olmamalı');
  // Tören henüz yok: ön başvuruda dilekçenin ihtida tarihi ve yer-tarih satırı boş kalır, son nüshada dolu gelir.
  const dilekceMetni = (yol) => metin(yol, 3).replace(/[ 	]+/g, '');
  assert.ok(!dilekceMetni(onYol).includes('08/09/2026'), 'ön başvuruda tören tarihi uydurulmaz');
  assert.ok(dilekceMetni(imzaliYol).includes('08/09/2026'), 'son nüshada tören tarihi dilekçededir');
  // Ekranda imza atmayan başvuran (elle imza): ön başvuruda da hiçbir belgeye imza basılmaz.
  const onImzasiz = await ihtidaPaketiUret({ ...g, onBasvuru: true, veri: { ...g.veri, ihtidaTarihi: '' }, basvuranImza: '', basvuranImzaVektor: '', imzasiz: true, ek10Onayi: false, imzaAktarimIzni: false });
  const oi = await pdfLib.PDFDocument.load(onImzasiz);
  for (const i of [1, 2, 3, 4, 5]) assert.doesNotMatch(akis(oi, i), /1 J/, (i + 1) + '. sayfa imzasız ön başvuruda boş');
  // Yalnız PNG imzalı eski başvuru (vektör yok): imza üç belgeye de PNG olarak, ön başvuruda da basılır.
  const onPng = await ihtidaPaketiUret({ ...g, onBasvuru: true, veri: { ...g.veri, ihtidaTarihi: '' }, basvuranImzaVektor: '' });
  const op = await pdfLib.PDFDocument.load(onPng);
  for (const i of [1, 2, 3, 4, 5]) assert.ok(rasterSayisi(op, i) >= 1, (i + 1) + '. sayfada PNG imza (ön başvuru, vektörsüz)');
  // Adrese teslim dilekçe baskısı da (ön başvuru) aynı imzayı taşır.
  const onAdres = await ihtidaPaketiUret({ ...g, onBasvuru: true, veri: { ...g.veri, ihtidaTarihi: '', teslimat: { yontem: 'adres' } } });
  const oa = await pdfLib.PDFDocument.load(onAdres);
  for (const i of [2, 3]) assert.match(akis(oa, i), /1 J/, (i + 1) + '. sayfa (adrese teslim dilekçe, ön başvuru) imzalı');
  assert.match(metin(onYol, 3), /ÖN BAŞVURU/);
  assert.doesNotMatch(metin(onYol, 5), /ÖN BAŞVURU/);
  assert.equal(rasterSayisi(a, 6), 2, 'Kimlik ön/arka aynı sayfada');
  // Şahit imzaları (raster) kalem mürekkebine boyanır.
  const xo = a.getPage(0).node.Resources().lookup(pdfLib.PDFName.of('XObject'), pdfLib.PDFDict);
  const decode = xo.keys().map(k => a.context.lookup(xo.get(k))?.dict?.get(pdfLib.PDFName.of('Decode'))?.toString()).filter(Boolean);
  assert.equal(decode.filter(d => d === '[ 0.1 0.1 0.24 0.24 0.62 0.62 ]').length, 2, 'Şahit imzaları #1A3D9E');
  // Kalem: Allura tam gömülür (alt küme bazı harfleri görünmez yapıyordu).
  for (const i of [1, 2, 4]) assert.match(akis(a, i), /2 Tr/, (i + 1) + '. sayfada kalem yazısı');
  const ikinci = metin(imzaliYol, 2).replace(/[ \t]+/g, '');
  assert.ok(ikinci.includes('DenizÉlodieÖRNEK'), 'EK-9 arka yüzde ad SOYAD');
  assert.ok(ikinci.includes('SosyalİşlerMüşavirliği'), 'Düzenleyen birim Müşavirlik (eğik kelimeler metin katmanında bölünebilir)');
  assert.ok(ikinci.includes('Bildirilmedi/Noncommuniqué'), 'Bildirilmeyen alan uydurulmaz');

  await assert.rejects(() => ihtidaPaketiUret({ ...g, ek10Onayi: false }), /rızası/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, imzaAktarimIzni: false }), /aktarımı.*izni/i);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, kimlikArka: '' }), /yüzleri eksik/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, foto: '' }), /Vesikalık/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, basvuranImza: 'bozuk', basvuranImzaVektor: '' }), /imzası okunamadı/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, sahitler: [{ ad: 'Örnek Şahit', imza: 'bozuk' }] }), /şahidin imzası okunamadı/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, belgeTuru: 'pasaport' }), /kimlik türünü kontrol/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, okunamayanGorseller: ['kimlikArka'] }), /görselleri okunamadı/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, kalemFontBytes: undefined }), /Allura/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, kimlikOn: 'data:image/png;base64,AAAA' }), /okunamadı/);
  const namurCami = camiCoz({ id: 'namur-camii-namur', ad: 'oynanmis', sehir: 'oynanmis', postaKodu: '0', adres: 'oynanmis' });
  await assert.rejects(() => ihtidaPaketiUret({ ...g, cami: namurCami, sahitler: [{ ad: '' }, { ad: '' }], yedekImzalar: [{ ad: 'Rıdvan KAYAHAN', imza: resim }] }), /iki şahidin adı/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, cami: undefined, veri: { ...g.veri, cami: namurCami }, sahitler: [{ ad: '' }, { ad: '' }] }), /iki şahidin adı/, 'Cami yalnız veri altında taşınsa da paket aynı kanonik şahit kuralını uygular');
  const namurPdf = await ihtidaPaketiUret({ ...g, cami: namurCami, veri: { ...g.veri, teslimat: { yontem: 'adres' } }, sahitler: [{ ad: 'Namur Birinci Şahit' }, { ad: 'Namur İkinci Şahit' }], yedekImzalar: [] });
  const namurYol = yaz('namur-ev-teslim-paket.pdf', namurPdf);
  const namur = metin(namurYol, 3).replace(/[ \t]+/g, '');
  assert.ok(namur.includes('NamurCamii'), 'dilekçede başvuru camisi');
  assert.ok(namur.includes('RueDenisGeorgesBayar13,5000Namur'), 'cami adresi «adres, posta kodu şehir»');
  assert.ok(namur.includes('Namur,08/09/2026'), 'yer ve tarih törenin yeri ve günü');
  assert.ok(namur.includes('RueduTest12,6900,Marche-en-Famenne,Belçika'), 'eve teslimde dönüş adresi başvuranın adresi');
  // 21 Eki 2026: eve teslimde formun «adrese teslim» baskısı: dönüş bölümü «adres · Alıcı», «cami» değil.
  // Bölüm başlıkları metin katmanında büyük harf ve harf aralıklı gelir (boşluklar atıldı).
  assert.ok(namur.includes('BELGENİNGÖNDERİLECEĞİADRES·ADDRESSTOWHICH'), 'eve teslimde bölüm başlığı adres');
  assert.ok(namur.includes('ALICI·RECIPIENT'), 'eve teslimde alıcı etiketi');
  assert.ok(!namur.includes('GÖNDERİLECEĞİCAMİ'), 'eve teslimde «gönderileceği cami» başlığı kalmaz');
  const namurArka = metin(namurYol, 4).replace(/[ 	]+/g, '');
  assert.ok(namurArka.includes('ADRESSED’ENVOIDEL’ATTESTATION') && namurArka.includes('DESTINATAIRE·ONTVANGER'), 'FR/NL yüzü de adres baskısı');
  const camiYol = yaz('cami-teslim-dilekce.pdf', imzali);
  assert.ok(metin(camiYol, 3).replace(/[ 	]+/g, '').includes('BELGENİNGÖNDERİLECEĞİCAMİ'), 'camiden teslimde baskı değişmez');
  await assert.rejects(() => ihtidaPaketiUret({ ...g, dilekceAdresSablonBytes: undefined, veri: { ...g.veri, teslimat: { yontem: 'adres' } } }), /Adrese teslim dilekçe şablonu/);
  const uzun = await ihtidaPaketiUret({ ...g, veri: { ...g.veri, ihtidaSebebi: 'Kendi araştırmam sonucunda karar verdim. '.repeat(12) } });
  assert.equal((await pdfLib.PDFDocument.load(uzun)).getPageCount(), 8, 'Uzun gerekçe kesilmeden açıklama ekine taşınmalı');
  yaz('tam-paket-uzun-aciklama.pdf', uzun);
});

test('EK-9 arka yüz değerleri tek tablodan gelir; son nüshada düzeltilen alanlar öne geçer (21 Eki 2026)', async () => {
  const { ek9Degerleri, ek9AlanlariUygula, ek9AlanlariGecerli } = await import('../public/admin/ek9-hazirlik.js');
  const { uret } = await import('../scripts/apps-script/ihtida-pdf-entry.js');
  const k = { 'Cinsiyet': 'kadin', 'Medeni hali': 'evli', 'Doğum yeri': 'liège', 'Uyruk': 'belge', 'Mesleği': 'retraitée', 'Öğrenim durumu': 'lisans', 'Önceki din/mezhep': 'hristiyan-katolik', 'Anne adı': 'marie', 'Baba adı': '' };
  const d = ek9Degerleri(k);
  assert.deepEqual([d.cinsiyet, d.medeniHali, d.dogumYeri, d.uyruk, d.meslek, d.ogrenim, d.oncekiDin, d.anneAdi, d.babaAdi],
    ['Kadın / Femme', 'Evli / Mariée', 'Liège', 'Belge', 'Retraitée', 'Lisans', 'Hristiyanlık / Katolik', 'marie', '']);
  assert.equal(ek9Degerleri({ 'Cinsiyet': 'erkek', 'Medeni hali': 'dul' }).medeniHali, 'Dul / Veuf');
  assert.equal(ek9Degerleri({ 'Medeni hali': 'bosanmis' }).medeniHali, 'Boşanmış / Divorcé(e)', 'cinsiyet bilinmiyorsa iki biçim');
  assert.equal(ek9Degerleri({ 'Medeni hali': 'bekar', 'Cinsiyet': 'kadin' }).medeniHali, 'Bekâr / Célibataire');
  const u = ek9AlanlariUygula(d, { dogumYeri: ' Belçika  / Belgique ', anneAdi: '' });
  assert.equal(u.dogumYeri, 'Belçika / Belgique');
  assert.equal(u.anneAdi, '', 'boş düzeltme «Bildirilmedi» olarak basılır');
  assert.equal(u.meslek, 'Retraitée', 'dokunulmayan alan kayıttan gelir');
  for (const yanlis of [[], 'metin', { cinsiyet: 'x' }, { meslek: 5 }, { meslek: 'a'.repeat(121) }]) assert.equal(ek9AlanlariGecerli(yanlis), false, JSON.stringify(yanlis));
  assert.equal(ek9AlanlariGecerli(undefined), true);
  assert.equal(ek9AlanlariGecerli({ meslek: '' }), true);

  // Uçtan uca (sunucunun eşlemesi): düzeltilen değerler EK-9 arka yüzüne basılır.
  const oku = ad => new Uint8Array(readFileSync(new URL('../public/' + ad, import.meta.url)));
  const png = 'data:image/png;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#ccd"/></svg>')).png().toBuffer()).toString('base64');
  const kart = 'data:image/jpeg;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1011" height="638"><rect width="1011" height="638" fill="#eee"/></svg>')).jpeg().toBuffer()).toString('base64');
  const kaynaklar = {
    sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'), ek10EkimSablonBytes: oku('belgeler/ihtida/ek10-acik-riza-metni-2026-10.pdf'),
    dilekceSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10.pdf'), dilekceAdresSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10-adres.pdf'),
    kalemFontBytes: oku('fonts/Allura-Regular.ttf'), fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'),
    fontKaligrafiBytes: oku('fonts/GreatVibes-Regular.ttf'), fontElYazisiBytes: oku('fonts/Caveat-Medium.ttf'),
  };
  const kayit = { ...k, 'Referans': 'IH-2099-0002', 'Zaman damgası': '2026-10-01T10:00:00', 'Form dili': 'fr', 'Adı Soyadı': 'Deniz ÖRNEK',
    'Doğum tarihi': '1990-05-20', 'E-posta': 'deniz@example.test', 'Telefon': '+32 470 00 00 00', 'Adres': 'Rue du Test 12, 6900 Marche-en-Famenne, Belgique',
    'EK-10 rızası': 'Evet', 'EK-10 sürümü': '2026-10', 'İmza aktarım izni': 'Hayır', 'Kimlik belgesi türü': 'kimlik', 'Belge teslim yeri': 'cami' };
  const duzenleme = { adSoyad: 'Deniz ÖRNEK', sahitler: [{ ad: 'Ercan MOLA', imza: '' }, { ad: 'Rıdvan KAYAHAN', imza: '' }], ihtidaTarihi: '2026-10-02',
    adres: kayit['Adres'], ihtidaSebebi: '', beyanTarihi: '2026-10-01', belgeTuru: 'kimlik',
    alanlar: { dogumYeri: 'Belçika / Belgique', meslek: 'Emekli / Retraitée', anneAdi: '' } };
  const bytes = await uret(kayit, { vesikalik: png, kimlikOn: kart, kimlikArka: kart, imza: '', imzaVektor: '' }, duzenleme, kaynaklar, pdfLib, fontkit);
  const out = new URL('../.codex/cikti/ihtida/', import.meta.url); mkdirSync(out, { recursive: true });
  const yol = new URL('ek9-alanlar-duzeltilmis.pdf', out); writeFileSync(yol, bytes);
  const arka = pdfMetni(yol, ['-f', '2', '-l', '2']).replace(/[ \t]+/g, '');
  for (const beklenen of ['Belçika/Belgique', 'Emekli/Retraitée', 'Evli/Mariée', 'Hristiyanlık/Katolik', 'Bildirilmedi/Noncommuniqué']) assert.ok(arka.includes(beklenen), beklenen);
  assert.ok(!arka.includes('Liège'), 'düzeltilen doğum yeri kaydın değerinin yerini alır');
  const dilekce = pdfMetni(yol, ['-f', '3', '-l', '3']).replace(/[ \t]+/g, '');
  assert.ok(dilekce.includes('Liège') && !dilekce.includes('Belçika/Belgique'), 'dilekçe başvuranın kendi beyanı kalır');
});

// ---- 23 Ekim 2026: kayıtlı şahit imzaları (Rıdvan KAYAHAN, Ercan MOLA) belgeye otomatik basılır ------------------------------
// Gerçek imzalar depoda, testte, derlemede ve günlükte ASLA bulunmaz: bütün sınamalar SENTETİK şekillerle yapılır. Gerçekleri
// yalnız dernek Google hesabındaki özel depodadır (ihtida klasörü, sahit-imzalari.json).
const SAHTE_DOLGU = JSON.stringify({ v: 2, w: 300, h: 120, p: [{ d: 'M10 100L60 20L110 100L90 100L60 50L30 100Z M150 20L290 20L290 40L150 40Z', f: 1, e: 1 }] });
const SAHTE_CIZGI = JSON.stringify({ v: 2, w: 240, h: 100, p: [{ d: 'M10 80C40 10 80 10 100 60L140 20L230 90', k: 3 }] });

/** Sayfanın içerik akışı ve vektör imza kutuları: yol imzası «q s 0 0 -s x y cm q <mürekkep rengi>» ile başlar (şablonun kendi cm'leri ayrışır). */
function sayfaAkisi(doc, i) {
  const c = doc.getPage(i).node.get(pdfLib.PDFName.of('Contents'));
  const refler = c instanceof pdfLib.PDFArray ? c.asArray() : [c];
  return refler.map(r => Buffer.from(pdfLib.decodePDFRawStream(doc.context.lookup(r)).decode()).toString('latin1')).join('\n');
}
function imzaKutulari(doc, i, boyutlar) {
  const H = doc.getPage(i).getHeight();
  return [...sayfaAkisi(doc, i).matchAll(/q\s+(-?[\d.]+(?:e-?\d+)?) 0 0 -([\d.]+(?:e-?\d+)?) (-?[\d.]+) (-?[\d.]+) cm\s+(?:q\s+0\.1 0\.24 0\.62 (?:rg|RG)|[\d.]+ w\s+1 J\s+1 j\s+0\.1 0\.24 0\.62 RG)/g)].map((m, j) => {
    const s = Number(m[1]), x0 = Number(m[3]), y0 = H - Number(m[4]), [w, h] = boyutlar[j] || [1, 1];
    return { x0, y0, x1: x0 + w * s, y1: y0 + h * s };
  });
}

test('Şahit imzası kaydı (sürüm 2) doğrulanır; herkese açık formun vektör imzası bu biçimi kabul etmez', async () => {
  const { sahitImzaCoz, imzaHazirla } = await import('../public/admin/imza-ciz.js');
  const y = sahitImzaCoz(SAHTE_DOLGU);
  assert.equal(y.yollar.length, 1); assert.equal(y.yollar[0].dolgu, true); assert.equal(y.yollar[0].evenodd, true);
  assert.deepEqual(y.yollar[0].ops.map(o => o.c), ['M', 'L', 'L', 'L', 'L', 'L', 'Z', 'M', 'L', 'L', 'L', 'Z']);
  const c = sahitImzaCoz(SAHTE_CIZGI);
  assert.equal(c.yollar[0].dolgu, false); assert.equal(c.yollar[0].k, 3);
  assert.deepEqual(c.yollar[0].ops.map(o => o.c), ['M', 'C', 'L', 'L']);
  const gecersiz = (p, ust = {}) => JSON.stringify({ v: 2, w: 300, h: 120, p, ...ust });
  const kotu = [
    '', null, '{', JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22' }),          // sürüm 1
    gecersiz([]),                                                                                              // yol yok
    gecersiz([{ d: 'L10 10L20 20', f: 1 }]),                                                                   // M ile başlamıyor
    gecersiz([{ d: 'M10 10L20', f: 1 }]),                                                                      // eksik sayı
    gecersiz([{ d: 'M10 10C1 2 3 4 5L20 20', f: 1 }]),                                                         // C 6'nın katı değil
    gecersiz([{ d: 'M10 10L20 20Z5', f: 1 }]),                                                                 // Z sayı almaz
    gecersiz([{ d: 'M10 10L20 20' }]),                                                                         // çizgide kalınlık yok
    gecersiz([{ d: 'M10 10L20 20', k: 0 }]),
    gecersiz([{ d: 'M10 10 l20 20', f: 1 }]),                                                                  // göreli komut
    gecersiz([{ d: 'M10 10L1e9 20', f: 1 }]),                                                                  // üstel sayı
    gecersiz([{ d: 'M10 10L99999 20', f: 1 }]),                                                                // kutu dışı koordinat
    gecersiz([{ d: 'M10 10L20 20', f: 1 }], { w: 0 }),
    gecersiz([{ d: 'M10 10L20 20'.padEnd(150001, ' '), f: 1 }]),                                               // yol çok uzun
  ];
  for (const x of kotu) assert.equal(sahitImzaCoz(x), null, String(x).slice(0, 60));
  // Çizim yalnız şahit kipinde: aynı kayıt şahit bayrağı olmadan imza sayılmaz (başvuranın kendi imzası v1'dir).
  const belge = await pdfLib.PDFDocument.create();
  assert.equal(imzaVektorCoz(SAHTE_DOLGU), null, 'sürüm 2 kaydı formun vektör çözücüsünden geçmez');
  assert.equal(await imzaHazirla(pdfLib, belge, { vektor: SAHTE_DOLGU }), null);
  assert.equal((await imzaHazirla(pdfLib, belge, { vektor: SAHTE_DOLGU, sahit: true })).tur, 'yol');
});

test('Kayıtlı şahit imzası yalnız Ulu Camii Marche içinde ve ad eşleşirse bağlanır; işaret kaldırılırsa bağlanmaz', async () => {
  const { sahitImzalariniBagla, sahitImzaAnahtari } = await import('../public/admin/ek9-hazirlik.js');
  assert.equal(sahitImzaAnahtari(' rıdvan  KAYAHAN '), 'ridvan');
  assert.equal(sahitImzaAnahtari('ERCAN MOLA'), 'ercan');
  assert.equal(sahitImzaAnahtari('Yeliz KAYAHAN'), '');
  const imzalar = { ridvan: SAHTE_CIZGI, ercan: SAHTE_DOLGU };
  let r = sahitImzalariniBagla([{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN' }], 'ulucamii-marche', imzalar);
  assert.deepEqual(r.uygulanan, ['ercan', 'ridvan']);
  assert.equal(r.sahitler[0].imza, SAHTE_DOLGU); assert.equal(r.sahitler[1].imza, SAHTE_CIZGI);
  r = sahitImzalariniBagla([{ ad: 'Ercan MOLA', imzaKullan: false }, { ad: 'Rıdvan KAYAHAN', imzaKullan: true }], 'ulucamii-marche', imzalar);
  assert.deepEqual(r.uygulanan, ['ridvan'], 'görevli işareti kaldırdıysa o şahidin imzası basılmaz');
  assert.equal(r.sahitler[0].imza, undefined);
  r = sahitImzalariniBagla([{ ad: 'Yeliz KAYAHAN' }, { ad: 'Rıdvan KAYAHAN' }], 'ulucamii-marche', { ridvan: SAHTE_CIZGI });
  assert.deepEqual(r.uygulanan, ['ridvan']);
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }], 'ulucamii-marche', { ridvan: SAHTE_CIZGI }).uygulanan, [], 'kayıtlı imza yoksa bağlanmaz');
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN' }], 'namur-camii-namur', imzalar).uygulanan, [], 'başka camide yerel imza kullanılmaz');
  // 25 Eki 2026: yedek şahit — başka camide yalnız mühtedinin yazılı/sözlü rızasıyla; işaret kaldırılırsa yine basılmaz.
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN' }], 'namur-camii-namur', imzalar, [], { yedekSahitRizasi: 'yazili' }).uygulanan, ['ercan', 'ridvan']);
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN', imzaKullan: false }], 'namur-camii-namur', imzalar, [], { yedekSahitRizasi: 'sozlu' }).uygulanan, ['ercan']);
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN' }], 'namur-camii-namur', imzalar, [], { yedekSahitRizasi: 'evet' }).uygulanan, [], 'bilinmeyen rıza değeri sayılmaz');
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }, { ad: 'ercan mola' }], 'ulucamii-marche', imzalar).uygulanan, ['ercan'], 'aynı kişi iki kez imzalamaz');
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }], 'ulucamii-marche', undefined).uygulanan, []);
  const eski = sahitImzalariniBagla([{ ad: 'Ercan MOLA', imza: 'data:eski-raster' }], 'ulucamii-marche', {});
  assert.equal(eski.sahitler[0].imza, 'data:eski-raster', 'istemciden gelen eski biçim değişmez');
});

test('EK-9 ön yüzünde şahit imzaları iki yuvaya vektör olarak, kalem mürekkebiyle basılır; raster yoktur', async () => {
  const oku = ad => readFileSync(new URL('../public/' + ad, import.meta.url));
  const kaynak = { pdfLib, fontkit, sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'), fontBytes: oku('fonts/Lora-Regular.ttf'),
    fontKalinBytes: oku('fonts/Lora-Bold.ttf'), kalemFontBytes: oku('fonts/Allura-Regular.ttf'),
    veri: { adSoyad: 'Deniz Örnek', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', beyanTarihi: '09/09/2026', dogumTarihi: '20/05/1990', cami: camiCoz({ id: 'ulucamii-marche' }) } };
  const imzasiz = await pdfLib.PDFDocument.load(await ek9Uret({ ...kaynak, sahitler: [{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN' }] }));
  assert.equal(imzaKutulari(imzasiz, 0, []).length, 0, 'imza verilmezse adlar basılır, yuva boş kalır');
  const bytes = await ek9Uret({ ...kaynak, sahitler: [{ ad: 'Ercan MOLA', imza: SAHTE_DOLGU }, { ad: 'Rıdvan KAYAHAN', imza: SAHTE_CIZGI }] });
  const doc = await pdfLib.PDFDocument.load(bytes);
  const kutu = imzaKutulari(doc, 0, [[300, 120], [240, 100]]);
  assert.equal(kutu.length, 2, 'iki vektör imza');
  // Yuvalar: sol şahit x 155–235, sağ şahit x 603–683 (±13 pt), imza alanı etiketin (424) altı, 432–462 pt (üstten).
  assert.ok(kutu[0].x0 >= 141.9 && kutu[0].x1 <= 248.1, 'ilk imza sol şahit yuvasında: ' + JSON.stringify(kutu[0]));
  assert.ok(kutu[1].x0 >= 589.9 && kutu[1].x1 <= 696.1, 'ikinci imza sağ şahit yuvasında: ' + JSON.stringify(kutu[1]));
  for (const k of kutu) assert.ok(k.y0 >= 431.9 && k.y1 <= 462.1, 'imza alanı sınırında: ' + JSON.stringify(k));
  const akis = sayfaAkisi(doc, 0);
  assert.match(akis, /f\*/, 'dolgulu kontur çift-tek kuralıyla doldurulur');
  assert.match(akis, /0\.1 0\.24 0\.62 rg/, 'dolgu mürekkebi #1A3D9E');
  assert.match(akis, /0\.1 0\.24 0\.62 RG/, 'çizgi mürekkebi #1A3D9E');
  assert.match(akis, /1 J/, 'kalem çizgisi yuvarlak uçlu');
  const x = doc.getPage(0).node.Resources().lookup(pdfLib.PDFName.of('XObject'));
  const raster = x ? x.keys().filter(k => doc.context.lookup(x.get(k))?.dict?.get(pdfLib.PDFName.of('Subtype'))?.toString() === '/Image').length : 0;
  assert.equal(raster, 0, 'şahit imzası görsel olarak gömülmez');
  // Bozuk kayıt belgeyi düşürür (imzasız belge sessizce çıkmaz).
  await assert.rejects(() => ek9Uret({ ...kaynak, sahitler: [{ ad: 'Ercan MOLA', imza: '{"v":2,"w":3}' }, { ad: 'Rıdvan KAYAHAN' }] }), /şahidin imzası okunamadı/);
  // Sade siyah yazı kipinde de kayıtlı vektör imza çizilir.
  const sade = await pdfLib.PDFDocument.load(await ek9Uret({ ...kaynak, kalemFontBytes: undefined, fontKaligrafiBytes: oku('fonts/GreatVibes-Regular.ttf'), fontElYazisiBytes: oku('fonts/Caveat-Medium.ttf'),
    isimYazisi: 'sade', alanYazisi: 'sade', sahitler: [{ ad: 'Ercan MOLA', imza: SAHTE_DOLGU }, { ad: 'Rıdvan KAYAHAN', imza: SAHTE_CIZGI }] }));
  assert.equal(imzaKutulari(sade, 0, [[300, 120], [240, 100]]).length, 2);
});

test('Sunucu eşlemesi: ön başvuruda varsayılan şahitler eşleşirse imza basılır; imza verilmezse (başvuran nüshası) basılmaz', async () => {
  const { uret, sahitImzaPlani } = await import('../scripts/apps-script/ihtida-pdf-entry.js');
  const oku = ad => new Uint8Array(readFileSync(new URL('../public/' + ad, import.meta.url)));
  const png = 'data:image/png;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#ccd"/></svg>')).png().toBuffer()).toString('base64');
  const kart = 'data:image/jpeg;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1011" height="638"><rect width="1011" height="638" fill="#eee"/></svg>')).jpeg().toBuffer()).toString('base64');
  const kaynaklar = { sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'), ek10EkimSablonBytes: oku('belgeler/ihtida/ek10-acik-riza-metni-2026-10.pdf'),
    dilekceSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10.pdf'), dilekceAdresSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10-adres.pdf'),
    kalemFontBytes: oku('fonts/Allura-Regular.ttf'), fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'),
    fontKaligrafiBytes: oku('fonts/GreatVibes-Regular.ttf'), fontElYazisiBytes: oku('fonts/Caveat-Medium.ttf') };
  const kayit = { 'Referans': 'IH-2099-0003', 'Zaman damgası': '2026-10-01T10:00:00', 'Form dili': 'fr', 'Adı Soyadı': 'Deniz ÖRNEK', 'Cinsiyet': 'kadin', 'Doğum tarihi': '1990-05-20',
    'E-posta': 'deniz@example.test', 'Telefon': '+32470000000', 'Adres': 'Rue du Test 12, 6900 Marche-en-Famenne, Belgique', 'EK-10 rızası': 'Evet', 'EK-10 sürümü': '2026-10',
    'İmza aktarım izni': 'Hayır', 'Kimlik belgesi türü': 'kimlik', 'Belge teslim yeri': 'cami' };
  const g = { vesikalik: png, kimlikOn: kart, kimlikArka: kart, imza: '', imzaVektor: '' };
  const imzalar = { ercan: SAHTE_DOLGU, ridvan: SAHTE_CIZGI };
  // Plan: şahit adı yoksa varsayılan «Ercan MOLA», «Rıdvan KAYAHAN» önerilir ve ikisinin imzası bağlanır.
  assert.deepEqual(sahitImzaPlani(kayit, null, imzalar).uygulanan, ['ercan', 'ridvan']);
  assert.deepEqual(sahitImzaPlani({ ...kayit, 'Şahit 1': 'Yeliz KAYAHAN', 'Şahit 2': 'Ercan MOLA' }, null, imzalar).uygulanan, ['ercan']);
  assert.deepEqual(sahitImzaPlani({ ...kayit, 'Cami kimliği': 'namur-camii-namur', 'Şahit 1': 'Rıdvan KAYAHAN', 'Şahit 2': 'Ercan MOLA' }, null, imzalar).uygulanan, []);
  assert.deepEqual(sahitImzaPlani(kayit, { sahitler: [{ ad: 'Ercan MOLA', imzaKullan: false }, { ad: 'Rıdvan KAYAHAN', imzaKullan: true }] }, imzalar).uygulanan, ['ridvan']);
  const imzali = await pdfLib.PDFDocument.load(await uret(kayit, g, null, kaynaklar, pdfLib, fontkit, { sahitImzalari: imzalar }));
  const imzasiz = await pdfLib.PDFDocument.load(await uret(kayit, g, null, kaynaklar, pdfLib, fontkit));
  assert.equal(imzali.getPageCount(), 7); assert.equal(imzasiz.getPageCount(), 7);
  assert.equal(imzaKutulari(imzali, 0, [[300, 120], [240, 100]]).length, 2, 'dernek içi nüsha: iki şahit imzası');
  assert.equal(imzaKutulari(imzasiz, 0, []).length, 0, 'başvuran nüshası: şahit imzası yok');
  // Başvuran nüshası ile iç nüsha yalnız şahit imzasıyla ayrışır: diğer sayfaların imza kutuları aynıdır.
  for (const i of [1, 2, 3, 4, 5, 6]) assert.equal(imzaKutulari(imzali, i, []).length, imzaKutulari(imzasiz, i, []).length, (i + 1) + '. sayfa');
  // Son nüsha: görevli işareti kaldırınca yalnız işaretli şahidin imzası basılır.
  const duzenleme = { adSoyad: 'Deniz ÖRNEK', sahitler: [{ ad: 'Ercan MOLA', imza: '', imzaKullan: false }, { ad: 'Rıdvan KAYAHAN', imza: '', imzaKullan: true }], ihtidaTarihi: '2026-10-02',
    adres: kayit['Adres'], ihtidaSebebi: '', beyanTarihi: '2026-10-01', belgeTuru: 'kimlik' };
  const son = await pdfLib.PDFDocument.load(await uret(kayit, g, duzenleme, kaynaklar, pdfLib, fontkit, { sahitImzalari: imzalar }));
  const kutu = imzaKutulari(son, 0, [[240, 100]]);
  assert.equal(kutu.length, 1); assert.ok(kutu[0].x0 >= 589.9, 'yalnız sağdaki (Rıdvan KAYAHAN) yuvada');
});

// ---- 23 Ekim 2026 (Rıdvan KAYAHAN, kapsam genişletmesi): mühtedi kendi şahitlerini seçtiyse şahit imzasını formda kendisi atabilir ----
// «eğer şahit biz seçliysek … imzalarımız otomatik atılsın, yok değil de mühtedi kendi şahitlerini seçtiyse … şahitler yanındaysa onlara
// o an imza attırabilmeli ya da değilse işlere şahit imzası olmadan ilerle». İmza şahidin kendi rızasıyla alınır ve başvuru
// dosyasında (özel Drive) durur; ad eşleşmezse ya da rıza kaydı yoksa belgeye basılmaz. Hepsi sentetik şekillerle sınanır.
const V1_IMZA = JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22L140 40L180 52L224 58' });
const PNG_BAS = 'data:image/png;base64,';
const sahitRizaKaydi = (...adlar) => JSON.stringify({ v: 1, zaman: '2026-10-23T10:00:00.000Z', ...Object.fromEntries(adlar.map((ad, i) => ad ? [`sahit${i + 1}`, { ad, riza: true }] : [])) });

test('Şahidin formda attığı imza: rıza kaydı, PNG ve ad şartı; vektör yalnız geçerliyse; kayıtlı imzanın önüne geçer', async () => {
  const { sahitKendiImzalari, sahitImzalariniBagla, sahitAdiNormal } = await import('../public/admin/ek9-hazirlik.js');
  const png = PNG_BAS + 'AAAA';
  const g = { sahit1Imza: png, sahit1ImzaVektor: V1_IMZA, sahit2Imza: png, sahit2ImzaVektor: '', sahitRiza: sahitRizaKaydi(' Ali  Örnek ', 'Veli Örnek') };
  const [bir, iki] = sahitKendiImzalari(g);
  assert.deepEqual(bir, { ad: 'Ali  Örnek', imza: V1_IMZA }, 'vektör (sürüm 1) geçerliyse o kullanılır; ad kırpılır');
  assert.deepEqual(iki, { ad: 'Veli Örnek', imza: png }, 'vektör yoksa PNG kullanılır');
  assert.deepEqual(sahitKendiImzalari({ ...g, sahit1ImzaVektor: '{"v":1}' })[0].imza, png, 'bozuk vektör PNG\'ye döner');
  // Rıza kaydı yoksa / riza true değilse / PNG yoksa / ad boşsa / JSON bozuksa imza kullanılmaz.
  assert.deepEqual(sahitKendiImzalari({ ...g, sahitRiza: '' }), [null, null]);
  assert.deepEqual(sahitKendiImzalari({ ...g, sahitRiza: '{bozuk' }), [null, null]);
  assert.deepEqual(sahitKendiImzalari({ ...g, sahitRiza: JSON.stringify({ sahit1: { ad: 'Ali Örnek', riza: false }, sahit2: { ad: '', riza: true } }) }), [null, null]);
  assert.deepEqual(sahitKendiImzalari({ ...g, sahit1Imza: '' }).map(x => x && x.ad), [null, 'Veli Örnek']);
  assert.deepEqual(sahitKendiImzalari(undefined), [null, null]);
  assert.equal(sahitAdiNormal('  ALİ   Örnek '), 'ali örnek', 'Türkçe küçük harf kuralı');
  const kendi = [bir, iki];
  // Ad eşleşirse imza şahide bağlanır ve «kendi imza» diye işaretlenir; kayıtlı (Ercan/Rıdvan) imzalar sayılmaz.
  let r = sahitImzalariniBagla([{ ad: 'ali örnek' }, { ad: 'Veli Örnek' }], 'namur-camii-namur', {}, kendi);
  assert.equal(r.sahitler[0].imza, V1_IMZA); assert.equal(r.sahitler[0].kendiImza, true); assert.equal(r.sahitler[1].imza, png);
  assert.deepEqual(r.uygulanan, [], 'kendi imza, kayıtlı imza listesine (başvuran nüshasından ayrılan imzalar) girmez');
  // Ad değiştiyse (görevli düzeltti ya da başka kişi yazıldı) imza basılmaz; sıra bağlıdır.
  r = sahitImzalariniBagla([{ ad: 'Başka Kişi' }, { ad: 'Ali Örnek' }], 'namur-camii-namur', {}, kendi);
  assert.equal(r.sahitler[0].imza, undefined); assert.equal(r.sahitler[1].imza, undefined);
  // Görevli işareti kaldırdıysa (imzaKullan false) basılmaz.
  r = sahitImzalariniBagla([{ ad: 'Ali Örnek', imzaKullan: false }, { ad: 'Veli Örnek' }], 'namur-camii-namur', {}, kendi);
  assert.equal(r.sahitler[0].imza, undefined); assert.equal(r.sahitler[1].imza, png);
  // Aynı ad hem kayıtlı hem kendi imzaya sahipse şahidin kendi çizdiği önde gelir; ikisinin yarışması iki imza basmaz.
  const imzalar = { ercan: SAHTE_DOLGU, ridvan: SAHTE_CIZGI };
  r = sahitImzalariniBagla([{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN' }], 'ulucamii-marche', imzalar, [{ ad: 'ercan mola', imza: V1_IMZA }, null]);
  assert.equal(r.sahitler[0].imza, V1_IMZA); assert.equal(r.sahitler[1].imza, SAHTE_CIZGI); assert.deepEqual(r.uygulanan, ['ridvan']);
  // Eski çağrılar (kendi parametresiz) aynen çalışır.
  assert.deepEqual(sahitImzalariniBagla([{ ad: 'Ercan MOLA' }], 'ulucamii-marche', imzalar).uygulanan, ['ercan']);
});

test('Sunucu doğrulaması: şahit imzası yalnız kendi şahitlerinde, şahidin rızasıyla, geçerli PNG ve vektörle kabul edilir', () => {
  const c = backend();
  const png = PNG_BAS + 'A'.repeat(400);
  const temel = () => ({ ...govde(), sahitSecimi: 'kendi', sahitler: [{ ad: 'Birinci Örnek' }, { ad: 'İkinci Örnek' }] });
  const imzali = (ek, i = 0) => { const v = temel(); v.sahitler[i] = { ...v.sahitler[i], ...ek }; return v; };
  assert.equal(c.ihtidaDogrulaV2(temel()).tamam, true, 'imzasız kendi şahit: eskisi gibi');
  assert.equal(c.ihtidaDogrulaV2(imzali({ imza: png, imzaVektor: V1_IMZA, riza: true })).tamam, true);
  assert.equal(c.ihtidaDogrulaV2(imzali({ imza: png, riza: true }, 1)).tamam, true, 'yalnız PNG yeterli; ikinci şahit da imzalayabilir');
  assert.equal(c.ihtidaDogrulaV2(imzali({ imza: '', imzaVektor: '', riza: false })).tamam, true, 'boş imza + rıza yok: imzasız sayılır');
  const kod = v => c.ihtidaDogrulaV2(v).kod;
  assert.equal(kod(imzali({ imza: png, riza: false })), 'sahit-imza-riza-eksik');
  assert.equal(kod(imzali({ imza: png })), 'sahit-imza-riza-eksik', 'rıza gönderilmediyse imza alınmaz');
  assert.equal(kod(imzali({ imza: png, riza: 'evet' })), 'sahit-riza-gecersiz');
  assert.equal(kod(imzali({ imza: 'data:image/gif;base64,' + 'A'.repeat(400), riza: true })), 'sahit-imza-gecersiz');
  assert.equal(kod(imzali({ imza: PNG_BAS + 'AAAA', riza: true })), 'sahit-imza-gecersiz', 'birkaç piksellik boş kare');
  assert.equal(kod(imzali({ imza: png, imzaVektor: '{"v":2,"w":3}', riza: true })), 'sahit-imza-vektor-gecersiz', 'sürüm 2 vektör bu uçtan gelemez');
  assert.equal(kod(imzali({ imza: '', imzaVektor: V1_IMZA, riza: true })), 'sahit-imza-gecersiz', 'PNG olmadan vektör tek başına geçmez');
  assert.equal(kod(imzali({ ad: '  ', imza: png, riza: true }, 1)), 'sahit-imza-ad-eksik', 'adı olmayan şahit imza atamaz');
  const cami = { ...temel(), sahitSecimi: 'cami', sahitler: [] };
  assert.equal(c.ihtidaDogrulaV2(cami).tamam, true);
  assert.equal(kod({ ...cami, sahitler: [{ ad: 'Ercan MOLA', imza: png, riza: true }] }), 'sahit-secimi-tutarsiz', 'cami şahitlerinde istemci imza gönderemez');
  const eskiBiçim = { ...govde(), sahitler: [{ ad: 'Birinci Örnek', imza: png, riza: true }] };
  delete eskiBiçim.teslimat; delete eskiBiçim.sahitSecimi;
  assert.equal(kod(eskiBiçim), 'sahit-imza-fazla', 'şahit seçimi bildirilmemiş eski gövdede imza kabul edilmez');
  // Diğer cami: iki şahit adı zorunlu; imza orada da isteğe bağlıdır.
  const diger = { ...temel(), cami: { id: 'diger', ad: 'Başka Cami', sehir: 'Namur', postaKodu: '5000', adres: 'Rue 1' } };
  assert.equal(c.ihtidaDogrulaV2(diger).tamam, true);
  assert.equal(c.ihtidaDogrulaV2({ ...diger, sahitler: [{ ad: 'Birinci Örnek', imza: png, imzaVektor: V1_IMZA, riza: true }, { ad: 'İkinci Örnek' }] }).tamam, true);
  // Klasöre yazılacak düz nesne: imza + rıza kaydı; imzasız şahit için hiçbir anahtar yok.
  const g = c.ihtidaSahitImzaGorselleri(imzali({ imza: png, imzaVektor: V1_IMZA, riza: true, ad: '  Birinci   Örnek ' }));
  assert.deepEqual(Object.keys(g).sort(), ['sahit1Imza', 'sahit1ImzaVektor', 'sahitRiza']);
  const riza = JSON.parse(g.sahitRiza);
  assert.deepEqual(riza.sahit1, { ad: 'Birinci Örnek', riza: true }); assert.equal(riza.sahit2, undefined); assert.equal(riza.v, 1);
  assert.match(riza.zaman, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(Object.assign({}, c.ihtidaSahitImzaGorselleri(temel())), {}, 'imza yoksa hiçbir şey yazılmaz');
});

test('EK-9 ön yüzünde şahidin kendi imzası: vektör (sürüm 1) ve PNG, kalem mürekkebiyle, yuvasında; kayıtlı imza gerekmez', async () => {
  const oku = ad => readFileSync(new URL('../public/' + ad, import.meta.url));
  const kaynak = { pdfLib, fontkit, sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'), fontBytes: oku('fonts/Lora-Regular.ttf'),
    fontKalinBytes: oku('fonts/Lora-Bold.ttf'), kalemFontBytes: oku('fonts/Allura-Regular.ttf'),
    veri: { adSoyad: 'Deniz Örnek', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', beyanTarihi: '09/09/2026', dogumTarihi: '20/05/1990', cami: camiCoz({ id: 'namur-camii-namur' }) } };
  const pngBayt = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><path d="M12 55L40 30L70 18L100 22L140 40" stroke="#123" stroke-width="4" fill="none"/></svg>')).png().toBuffer();
  const doc = await pdfLib.PDFDocument.load(await ek9Uret({ ...kaynak, sahitler: [{ ad: 'Birinci Örnek', imza: V1_IMZA }, { ad: 'İkinci Örnek', imza: PNG_BAS + pngBayt.toString('base64') }] }));
  const kutu = imzaKutulari(doc, 0, [[240, 80]]);
  assert.equal(kutu.length, 1, 'vektör şahit imzası bir kutu');
  assert.ok(kutu[0].x0 >= 141.9 && kutu[0].x1 <= 248.1, 'sol yuvada: ' + JSON.stringify(kutu[0]));
  assert.ok(kutu[0].y0 >= 431.9 && kutu[0].y1 <= 462.1, 'imza alanında: ' + JSON.stringify(kutu[0]));
  assert.match(sayfaAkisi(doc, 0), /0\.1 0\.24 0\.62 RG/, 'çizgi mürekkebi #1A3D9E');
  const x = doc.getPage(0).node.Resources().lookup(pdfLib.PDFName.of('XObject'));
  const gorseller = x ? x.keys().filter(k => doc.context.lookup(x.get(k))?.dict?.get(pdfLib.PDFName.of('Subtype'))?.toString() === '/Image') : [];
  assert.equal(gorseller.length, 1, 'ikinci şahidin PNG imzası tek görsel olarak, mürekkebe boyanmış gömülür');
  // Şahit imzası belgeye hiçbir yerde ham veri olarak yazılmaz; PNG yalnız görsel olarak girer.
  await assert.rejects(() => ek9Uret({ ...kaynak, sahitler: [{ ad: 'Birinci Örnek', imza: PNG_BAS + 'AAAA' }, { ad: 'İkinci Örnek' }] }), /şahidin imzası okunamadı/);
});

test('Sunucu eşlemesi: şahidin kendi imzası her nüshada (başvuran nüshası dâhil) basılır; kayıtlı imzalar ayrı kalır', async () => {
  const { uret, sahitImzaPlani } = await import('../scripts/apps-script/ihtida-pdf-entry.js');
  const oku = ad => new Uint8Array(readFileSync(new URL('../public/' + ad, import.meta.url)));
  const png = 'data:image/png;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#ccd"/></svg>')).png().toBuffer()).toString('base64');
  const kart = 'data:image/jpeg;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1011" height="638"><rect width="1011" height="638" fill="#eee"/></svg>')).jpeg().toBuffer()).toString('base64');
  const imzaPng = PNG_BAS + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><path d="M12 55L40 30L70 18L100 22L140 40" stroke="#123" stroke-width="4" fill="none"/></svg>')).png().toBuffer()).toString('base64');
  const kaynaklar = { sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'), ek10EkimSablonBytes: oku('belgeler/ihtida/ek10-acik-riza-metni-2026-10.pdf'),
    dilekceSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10.pdf'), dilekceAdresSablonBytes: oku('belgeler/ihtida/ihtida-talep-dilekcesi-2026-10-adres.pdf'),
    kalemFontBytes: oku('fonts/Allura-Regular.ttf'), fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'),
    fontKaligrafiBytes: oku('fonts/GreatVibes-Regular.ttf'), fontElYazisiBytes: oku('fonts/Caveat-Medium.ttf') };
  const kayit = { 'Referans': 'IH-2099-0004', 'Zaman damgası': '2026-10-01T10:00:00', 'Form dili': 'fr', 'Adı Soyadı': 'Deniz ÖRNEK', 'Cinsiyet': 'kadin', 'Doğum tarihi': '1990-05-20',
    'E-posta': 'deniz@example.test', 'Telefon': '+32470000000', 'Adres': 'Rue du Test 12, 6900 Marche-en-Famenne, Belgique', 'EK-10 rızası': 'Evet', 'EK-10 sürümü': '2026-10',
    'İmza aktarım izni': 'Hayır', 'Kimlik belgesi türü': 'kimlik', 'Belge teslim yeri': 'cami', 'Şahit 1': 'Ali Örnek', 'Şahit 2': 'Veli Örnek' };
  const temel = { vesikalik: png, kimlikOn: kart, kimlikArka: kart, imza: '', imzaVektor: '' };
  const g = { ...temel, sahit1Imza: imzaPng, sahit1ImzaVektor: V1_IMZA, sahit2Imza: imzaPng, sahitRiza: sahitRizaKaydi('Ali Örnek', 'Veli Örnek') };
  const rasterSayisi = doc => { const x = doc.getPage(0).node.Resources().lookup(pdfLib.PDFName.of('XObject')); return x ? x.keys().filter(k => doc.context.lookup(x.get(k))?.dict?.get(pdfLib.PDFName.of('Subtype'))?.toString() === '/Image').length : 0; };
  // Marche, kendi şahitler: kayıtlı imza yok → kendi imzalar basılır, «uygulanan» boş (başvuran nüshası ayrılmaz).
  assert.deepEqual(sahitImzaPlani(kayit, null, { ercan: SAHTE_DOLGU, ridvan: SAHTE_CIZGI }, g).uygulanan, []);
  const imzali = await pdfLib.PDFDocument.load(await uret(kayit, g, null, kaynaklar, pdfLib, fontkit));
  assert.equal(imzaKutulari(imzali, 0, [[240, 80]]).length, 1, 'birinci şahit: vektör imza');
  assert.equal(rasterSayisi(imzali) - rasterSayisi(await pdfLib.PDFDocument.load(await uret(kayit, temel, null, kaynaklar, pdfLib, fontkit))), 1, 'ikinci şahit: PNG imza (+1 görsel)');
  // Rıza kaydı yok / ad uyuşmuyor: imza basılmaz, her şey eskisi gibi.
  const rizasiz = await pdfLib.PDFDocument.load(await uret(kayit, { ...g, sahitRiza: '' }, null, kaynaklar, pdfLib, fontkit));
  assert.equal(imzaKutulari(rizasiz, 0, []).length, 0);
  const baska = await pdfLib.PDFDocument.load(await uret({ ...kayit, 'Şahit 1': 'Başka Kişi' }, g, null, kaynaklar, pdfLib, fontkit));
  assert.equal(imzaKutulari(baska, 0, []).length, 0, 'ad kayıttaki ad değilse şahidin imzası başkasına basılmaz');
  // Son nüsha: görevli adı aynı bıraktı ve işareti kaldırmadı → basılır; işareti kaldırınca ya da adı değiştirince basılmaz.
  const duz = (ek) => ({ adSoyad: 'Deniz ÖRNEK', sahitler: [{ ad: 'Ali Örnek', imza: '', imzaKullan: true, ...ek }, { ad: 'Veli Örnek', imza: '', imzaKullan: true }], ihtidaTarihi: '2026-10-02',
    adres: kayit['Adres'], ihtidaSebebi: '', beyanTarihi: '2026-10-01', belgeTuru: 'kimlik' });
  assert.equal(imzaKutulari(await pdfLib.PDFDocument.load(await uret(kayit, g, duz({}), kaynaklar, pdfLib, fontkit)), 0, [[240, 80]]).length, 1);
  assert.equal(imzaKutulari(await pdfLib.PDFDocument.load(await uret(kayit, g, duz({ imzaKullan: false }), kaynaklar, pdfLib, fontkit)), 0, []).length, 0);
  assert.equal(imzaKutulari(await pdfLib.PDFDocument.load(await uret(kayit, g, duz({ ad: 'Ali Örnek Jr.' }), kaynaklar, pdfLib, fontkit)), 0, []).length, 0);
  // Şahit «Ercan MOLA» adını kendisi yazıp kendi imzasını attıysa, kendi imzası kayıtlı imzanın önüne geçer: tek imza, başvuran nüshası ayrılmaz.
  const ercan = { ...kayit, 'Şahit 1': 'Ercan MOLA', 'Şahit 2': 'Veli Örnek' };
  const gErcan = { ...g, sahitRiza: sahitRizaKaydi('Ercan MOLA', 'Veli Örnek') };
  assert.deepEqual(sahitImzaPlani(ercan, null, { ercan: SAHTE_DOLGU }, gErcan).uygulanan, []);
  assert.deepEqual(sahitImzaPlani(ercan, null, { ercan: SAHTE_DOLGU }, temel).uygulanan, ['ercan'], 'kendi imza yoksa kayıtlı imza basılır');
});
