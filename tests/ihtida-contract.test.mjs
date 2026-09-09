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

const source = readFileSync(new URL('../scripts/apps-script/ulucamii-Kod-v28.gs', import.meta.url), 'utf8');
function backend() { const ctx = vm.createContext({ console, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) } }); vm.runInContext(source, ctx); ctx.IhtidaPdf = { camiCoz }; return ctx; }
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
  assert.deepEqual(sahitOnerileri({}), ['Rıdvan KAYAHAN', 'Ercan MOLA']);
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
  c.ihtidaV2SayfaGetir = () => ({ getParent: () => ({ getUrl: () => 'https://example.test/defter' }) });
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

test('Tam paket taşma yapmadan hazırlanır; başvuran imzası üç yere taşınır, eksik ek sessizce atlanmaz', async () => {
  const oku = ad => readFileSync(new URL('../public/' + ad, import.meta.url));
  const png = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><path d="M20 70 Q70 5 120 60 T270 40" fill="none" stroke="black" stroke-width="4"/></svg>')).png().toBuffer();
  const resim = 'data:image/png;base64,' + png.toString('base64');
  const g = { pdfLib, fontkit, sablonBytes: oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'), ek10SablonBytes: oku('belgeler/ihtida/ek10-kvkk-acik-riza-metni.pdf'),
    fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'), fontKaligrafiBytes: oku('fonts/GreatVibes-Regular.ttf'), fontElYazisiBytes: oku('fonts/Caveat-Medium.ttf'),
    veri: { ref: 'IH-2099-9999', adSoyad: 'Deniz Élodie Örnek', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', beyanTarihi: '09/09/2026', ihtidaTarihi: '08/09/2026', ihtidaSebebi: 'Kendi araştırmam sonucunda.', dil: 'fr', eposta: 'deniz@example.test' },
    sahitler: [{ ad: 'Birinci Örnek', imza: resim }, { ad: 'İkinci Örnek', imza: resim }],
    foto: resim, kimlikOn: resim, kimlikArka: resim, belgeTuru: 'kimlik', basvuranImza: resim, ek10Onayi: true,
    ek10Surumu: '2026-09-09', imzaAktarimIzni: true };
  const imzali = await ihtidaPaketiUret(g), imzasiz = await ihtidaPaketiUret({ ...g, basvuranImza: '', imzasiz: true, ek10Onayi: false, imzaAktarimIzni: false });
  const a = await pdfLib.PDFDocument.load(imzali), b = await pdfLib.PDFDocument.load(imzasiz);
  assert.equal(a.getPageCount(), 6, 'Normal doldurulmuş paket tek sayfalık dilekçeyi korur');
  assert.equal(b.getPageCount(), 6);
  const gorselSayisi = (d, i) => d.getPage(i).node.Resources().lookup(pdfLib.PDFName.of('XObject'))?.keys().length || 0;
  for (const i of [1, 3, 4]) assert.equal(gorselSayisi(a, i), gorselSayisi(b, i) + 1, (i + 1) + '. sayfada başvuran imzası');
  assert.equal(gorselSayisi(a, 5), 2, 'Kimlik ön/arka aynı ek sayfada');
  const imzalar = a.getPage(0).node.Resources().lookup(pdfLib.PDFName.of('XObject'), pdfLib.PDFDict).entries().map(([, ref]) => a.context.lookup(ref));
  assert.equal(imzalar.filter(im => im.dict?.get(pdfLib.PDFName.of('Decode'))?.toString() === '[ 0.08 1 0.2 1 0.48 1 ]').length, 2, 'Şahit imzalarının siyah çizgileri maviye eşlenmeli');
  await assert.rejects(() => ihtidaPaketiUret({ ...g, ek10Onayi: false }), /rızası/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, imzaAktarimIzni: false }), /aktarımı.*izni/i);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, kimlikArka: '' }), /yüzleri eksik/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, foto: '' }), /Vesikalık/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, basvuranImza: 'bozuk' }), /imzası okunamadı/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, sahitler: [{ ad: 'Örnek Şahit', imza: 'bozuk' }] }), /şahidin imzası okunamadı/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, belgeTuru: 'pasaport' }), /kimlik türünü kontrol/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, okunamayanGorseller: ['kimlikArka'] }), /görselleri okunamadı/);
  const namurCami = camiCoz({ id: 'namur-camii-namur', ad: 'oynanmis', sehir: 'oynanmis', postaKodu: '0', adres: 'oynanmis' });
  await assert.rejects(() => ihtidaPaketiUret({ ...g, cami: namurCami, sahitler: [{ ad: '' }, { ad: '' }], yedekImzalar: [{ ad: 'Rıdvan KAYAHAN', imza: resim }] }), /iki şahidin adı/);
  await assert.rejects(() => ihtidaPaketiUret({ ...g, cami: undefined, veri: { ...g.veri, cami: namurCami }, sahitler: [{ ad: '' }, { ad: '' }] }), /iki şahidin adı/, 'Cami yalnız veri altında taşınsa da paket aynı kanonik şahit kuralını uygular');
  const namurPdf = await ihtidaPaketiUret({ ...g, cami: namurCami, sahitler: [{ ad: 'Namur Birinci Şahit' }, { ad: 'Namur İkinci Şahit' }], yedekImzalar: [] });
  const namurOut = new URL('../.codex/cikti/ihtida/namur-paket.pdf', import.meta.url);
  writeFileSync(namurOut, namurPdf);
  const namurMetni = execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `pdftotext ${fileURLToPath(namurOut)} -`], { encoding: 'utf8' });
  assert.match(namurMetni, /Namur Camii/);
  assert.match(namurMetni, /Rue Denis Georges Bayar 13, 5000, Namur/);
  assert.match(namurMetni, /Posta dönüş camisi/);
  assert.match(namurMetni, /Mosquée de retour postal de l’attestation/);
  assert.match(namurMetni, /Namur, 09\.09\.2026/);
  assert.doesNotMatch(namurMetni, /Marche-en-Famenne Ulu Camii’nde/);
  const evePdf = await ihtidaPaketiUret({ ...g, cami: namurCami, veri: { ...g.veri, teslimat: { yontem: 'adres' } }, sahitler: [{ ad: 'Namur Birinci Şahit' }, { ad: 'Namur İkinci Şahit' }], yedekImzalar: [] });
  const eveOut = new URL('../.codex/cikti/ihtida/namur-ev-teslim-paket.pdf', import.meta.url);
  writeFileSync(eveOut, evePdf);
  const eveMetni = execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `pdftotext ${fileURLToPath(eveOut)} -`], { encoding: 'utf8' });
  assert.match(eveMetni, /Posta dönüş adresi/);
  assert.match(eveMetni, /Adresse de retour postal de l’attestation/);
  assert.match(eveMetni, /Deniz Élodie Örnek/);
  assert.match(eveMetni, /Rue du Test 12, 6900, Marche-en-Famenne, Belçika/);
  const uzunManuelCami = camiCoz({
    id: 'diger', ad: 'Uzun Adlı Resmî Başvuru ve Tören Camii Derneği Merkezi',
    sehir: 'Çok Uzun Şehir Adı Bölgesi', postaKodu: '5000',
    adres: 'Avenue de la Très Longue Adresse et des Bâtiments Communautaires 123 B, Bâtiment Principal, Entrée Arrière',
  });
  const uzunCamiPdf = await ihtidaPaketiUret({ ...g, cami: uzunManuelCami, sahitler: [{ ad: 'Birinci Uzun Cami Şahidi' }, { ad: 'İkinci Uzun Cami Şahidi' }], yedekImzalar: [] });
  const uzunCamiDoc = await pdfLib.PDFDocument.load(uzunCamiPdf);
  assert.equal(uzunCamiDoc.getPageCount(), 6, 'Normal katalog sınırındaki cami bilgisi tek sayfalık dilekçeyi korumalı');
  const uzunCamiOut = new URL('../.codex/cikti/ihtida/uzun-manuel-cami-paket.pdf', import.meta.url);
  writeFileSync(uzunCamiOut, uzunCamiPdf);
  const uzunCamiMetni = execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `pdftotext ${fileURLToPath(uzunCamiOut)} -`], { encoding: 'utf8' });
  assert.match(uzunCamiMetni, /Uzun Adlı Resmî Başvuru ve Tören Camii Derneği Merkezi/);
  assert.match(uzunCamiMetni, /Bâtiments Communautaires 123 B/);
  const uzunluk = (metin, adet) => metin.repeat(Math.ceil(adet / metin.length)).slice(0, adet);
  const sinirCami = camiCoz({
    id: 'diger', ad: uzunluk('Belçika Türk Müslüman Toplumu Başvuru ve Tören Merkezi ', 120),
    sehir: uzunluk('Brüksel Başkent Bölgesi Uzun Yerleşim Merkezi ', 80), postaKodu: '5000',
    adres: 'Avenue de la Très Longue Adresse ' + uzunluk('X', 167),
  });
  const sinirVeri = {
    ...g.veri,
    adSoyad: uzunluk('Alexandra Marie Elisabeth de la Conversion Exemple ', 120),
    dogumYeri: 'Saint-Remy-en-Bouzemont-Saint-Genest-et-Isson', dogumTarihi: '01/01/1990',
    uyruk: 'Belçika Krallığı vatandaşlığı ve uzun resmî uyruk açıklaması',
    adres: 'Rue de la Résidence Très Longue 999, Appartement 1234, 5000 Namur, Belgique',
    telefon: '+32 470 123 456', eposta: 'alexandra.exemple.tres.longue@example.test',
  };
  const sinirPdf = await dilekceUret({ pdfLib, fontkit, fontBytes: g.fontBytes, fontKalinBytes: g.fontKalinBytes, veri: { ...sinirVeri, cami: sinirCami, teslimat: { yontem: 'cami' } }, imza: resim, tarih: new Date('2026-09-09T12:00:00Z') });
  const sinirOut = new URL('../.codex/cikti/ihtida/sinir-manuel-cami-dilekce.pdf', import.meta.url);
  writeFileSync(sinirOut, sinirPdf);
  const sinirBelge = await pdfLib.PDFDocument.load(sinirPdf);
  assert.ok(sinirBelge.getPageCount() >= 2, 'Sınır bilgileri dilekçe devam sayfasına akmalı');
  const sinirMetni = execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `pdftotext ${fileURLToPath(sinirOut)} -`], { encoding: 'utf8' });
  assert.match(sinirMetni, /Belçika Türk Müslüman Toplumu Başvuru ve Tören Merkezi/);
  assert.match(sinirMetni, /Avenue de la\s+Très\s+Longue Adresse/);
  assert.match(sinirMetni, /Alexandra Marie Elisabeth de la Conversion Exemple/);
  const sinirKutu = execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `pdftotext -bbox-layout ${fileURLToPath(sinirOut)} -`], { encoding: 'utf8' });
  const koordinatlar = [...sinirKutu.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)"/g)].map(([, sol, ust, sag, alt]) => [Number(sol), Number(ust), Number(sag), Number(alt)]);
  assert.ok(koordinatlar.length > 100, 'PDF metin koordinatları okunmalı');
  assert.ok(koordinatlar.every(([, ust,, alt]) => ust >= 20 && alt <= 822), 'Hiçbir metin alt veya üst sayfa sınırına taşmamalı');
  /* Onaylı yeni dilekçe düzeni 43 pt kenar boşluğu kullanır. PDF metin
     yükselişi nedeniyle 1 pt tolerans bırakılır; fiziksel sayfa sınırı ya
     da dışarıya taşma yine kabul edilmez. */
  assert.ok(koordinatlar.every(([sol,, sag]) => sol >= 42 && sag <= 554.28), 'Hiçbir metin sağ veya sol sayfa güvenli alanına taşmamalı');
  const uzun = await ihtidaPaketiUret({ ...g, veri: { ...g.veri, ihtidaSebebi: 'Kendi araştırmam sonucunda karar verdim. '.repeat(12) } });
  assert.equal((await pdfLib.PDFDocument.load(uzun)).getPageCount(), 7, 'Uzun gerekçe kesilmeden açıklama ekine taşınmalı');
  const out = new URL('../.codex/cikti/ihtida/', import.meta.url); mkdirSync(out, { recursive: true });
  writeFileSync(new URL('tam-paket-imzali.pdf', out), imzali); writeFileSync(new URL('tam-paket-imzasiz.pdf', out), imzasiz);
  writeFileSync(new URL('tam-paket-uzun-aciklama.pdf', out), uzun);
});
