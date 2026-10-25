import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PDFDocument, PDFName, PDFArray, decodePDFRawStream } from 'pdf-lib';
import sharp from 'sharp';
import { pdfMetni } from './yardim/pdf-metin.mjs';

execFileSync(process.execPath, ['scripts/ihtida-gas-derle.mjs'], { stdio: 'pipe' });
const source = readFileSync('.codex/cikti/gas/ulucamii-v43.gs', 'utf8');
const png = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220"><rect width="180" height="220" fill="#e0e6ee"/><circle cx="90" cy="72" r="35" fill="#596478"/><text x="35" y="170" font-size="30">TEST</text></svg>')).png().toBuffer();
const image = 'data:image/png;base64,' + png.toString('base64');
const k = { 'Referans': 'IH-2099-9999', 'Adı Soyadı': 'Deniz Örnek', 'Adres': 'Rue du Test 12, 6900, Marche-en-Famenne, Belgique', 'E-posta': 'deniz@example.test', 'Zaman damgası': '09.09.2026', 'Form dili': 'fr', 'Kimlik belgesi türü': 'kimlik', 'EK-10 rızası': 'Evet', 'EK-10 sürümü': '2026-09-09', 'İmza aktarım izni': 'Evet', 'Cinsiyet': 'kadin', 'Doğum tarihi': '1990-05-20', 'Doğum yeri': 'Namur', 'Uyruk': 'Belçika', 'Anne adı': 'Anne', 'Baba adı': 'Baba', 'Medeni hali': 'bekar', 'Öğrenim durumu': 'lisans', 'Mesleği': 'Öğretmen', 'Önceki din/mezhep': 'hristiyan-katolik', 'Telefon': '+32470000000', 'İhtida sebebi': 'Kendi araştırmam sonucunda.' };

function ortam() {
  const props = new Map([['PANEL_ANAHTARI', 'test-panel-key'], ['BREVO_API_KEY', 'test-api-key'], ['IHTIDA_PAKET_KURULU', '28']]);
  const files = new Map(), sent = [], cells = new Map(); let seq = 0;
  const blob = (bytes, type, name) => {
    const b = typeof bytes === 'string' ? Buffer.from(bytes) : Buffer.from(bytes);
    return { getBytes: () => [...b], getDataAsString: () => b.toString('utf8'), getContentType: () => type, getName: () => name };
  };
  const createFile = b => {
    const id = 'file-test-identifier-' + ++seq; let cop = false;
    const f = { getId: () => id, getName: () => b.getName(), getUrl: () => 'https://drive.google.com/file/d/' + id + '/view', getBlob: () => b, isTrashed: () => cop, setTrashed: v => { cop = v; }, getMimeType: () => b.getContentType(), getParents: () => iterator([{ getId: () => 'test-ihtida-folder' }]), setContent: text => { b = blob(text, 'application/json', b.getName()); } };
    files.set(id, f); return f;
  };
  const iterator = items => ({ hasNext: () => items.length > 0, next: () => items.shift() });
  const ctx = vm.createContext({ console, Utilities: {
    base64Decode: s => [...Buffer.from(s, 'base64')], base64Encode: a => Buffer.from(a).toString('base64'), newBlob: blob,
    getUuid: randomUUID, DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, b) => [...createHash('sha256').update(Buffer.from(b)).digest()],
    formatDate: (_, tz, format) => format === 'yyyy-MM-dd' ? '2026-09-09' : '09.09.2026',
  }, PropertiesService: { getScriptProperties: () => ({ getProperty: p => props.get(p), setProperty: (p, v) => props.set(p, v), deleteProperty: p => props.delete(p), getProperties: () => Object.fromEntries(props) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) }, DriveApp: { getFileById: id => files.get(id) },
  });
  vm.runInContext(source, ctx);
  ctx.json = x => x;
  ctx.ihtidaKlasorGetir = () => ({ getId: () => 'test-ihtida-folder', createFile, getFilesByName: name => iterator([...files.values()].filter(f => f.getName() === name)) });
  ctx.ihtidaPaketKayit = () => ({ kayit: { ...k } });
  ctx.ihtidaPaketHucre = (ref, name, value) => cells.set(name, value);
  ctx.gercekGorselleriOku = ctx.ihtidaGorselleriOku;
  ctx.ihtidaGorselleriOku = () => ({ vesikalik: image, kimlikOn: image, kimlikArka: image, imza: image });
  ctx.UrlFetchApp = { fetch: (url, options) => {
    if (options.method === 'post') {
      const p = JSON.parse(options.payload); sent.push(p);
      return { getResponseCode: () => 201, getContentText: () => JSON.stringify({ messageId: '<test-' + sent.length + '@example.test>' }) };
    }
    const id = new URL(url).searchParams.get('messageId');
    const n = Number(id.match(/test-(\d+)/)[1]);
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ events: [{ messageId: id, email: sent[n - 1].to[0].email, event: 'delivered' }] }) };
  } };
  return { ctx, sent, files, cells, props };
}

test('GAS ortamı tarayıcı/Node/timer olmadan gerçek yedi sayfalık imzalı paketi üretir', async () => {
  const { ctx, sent, files, cells } = ortam();
  assert.equal(vm.runInContext('typeof setTimeout', ctx), 'undefined');
  assert.equal(vm.runInContext('typeof window', ctx), 'undefined');
  assert.equal(vm.runInContext('typeof Buffer', ctx), 'undefined');
  await ctx.IhtidaPdf.uret(k, ctx.ihtidaGorselleriOku(), null, ctx.ihtidaPaketKaynaklari(), ctx.PDFLib, ctx.fontkit);
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.equal(is.sayfa, 7, 'EK-9 ×2, dilekçe ×2, EK-10 ×2, kimlik');
  assert.deepEqual(sent.map(p => p.to[0].email), ['info@ulucamii.be', 'imam@ulucamii.be', 'deniz@example.test']);
  const bytes = Buffer.from(files.get(is.pdfId).getBlob().getBytes());
  for (const p of sent) {
    assert.deepEqual(Buffer.from(p.attachment[0].content, 'base64'), bytes);
    assert.equal(p.to.length, 1); assert.equal(p.cc, undefined);
  }
  assert.ok(cells.get('Tam paket PDF').includes(is.pdfId));
  assert.ok(cells.get('E-posta durumu').includes('Alıcı sunucusuna teslim edildi'));
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 7);
  writeFileSync('.codex/cikti/ihtida/gas-otomatik-paket.pdf', bytes);
  // Kalem büyük harfli kelimeyi harf harf yazar; metin katmanında harf arasına boşluk düşebilir.
  const metin = pdfMetni('.codex/cikti/ihtida/gas-otomatik-paket.pdf', ['-f', '1', '-l', '1']).replace(/[ \t]+/g, '');
  for (const text of ['RıdvanKAYAHAN', 'DinGörevlisi', 'ErcanMOLA', 'DernekBaşkanı']) assert.ok(metin.includes(text), text);
  assert.ok(metin.indexOf('ErcanMOLA') < metin.indexOf('RıdvanKAYAHAN'), 'Otomatik EK-9 paketinde Ercan birinci, Rıdvan ikinci şahit olmalı');
  assert.doesNotMatch(metin, /Yeliz/);
  await ctx.ihtidaPaketIsle(k.Referans);
  assert.equal(sent.length, 3, 'Kuyruk tekrar çalışsa da üç e-posta tekrarlanmaz');
});

test('53 sayfalık defter GAS ortamında timer veya Node olmadan PDF ve Word üretir', async () => {
  const { ctx } = ortam();
  assert.equal(vm.runInContext('typeof setTimeout', ctx), 'undefined');
  assert.equal(vm.runInContext('typeof Buffer', ctx), 'undefined');
  const model = { surum: 1, guncelleme: '2026-09-09T10:00:00Z', kayitlar: [
    { ref: 'IH-2099-0001', adSoyad: 'Sentetik Çağrı Örnek', durum: 'bekliyor' },
  ] };
  const bytes = await ctx.IhtidaDefteri.pdfUret(model, ctx.ihtidaPaketKaynaklari(), ctx.PDFLib, ctx.fontkit);
  assert.equal((await PDFDocument.load(Buffer.from(bytes))).getPageCount(), 53);
  const word = Buffer.from(ctx.IhtidaDefteri.docxUret(model));
  assert.equal(word.readUInt32LE(0), 0x04034b50);
  assert.ok(word.includes(Buffer.from('Sentetik Çağrı Örnek')));
});

test('Otomatik PDF boş ikinci şahidi tamamlarken ilk şahidi tekrarlamaz', async () => {
  const { ctx } = ortam();
  const bytes = await ctx.IhtidaPdf.uret({ ...k, 'Şahit 1': 'Yeliz KAYAHAN', 'Şahit 2': '' }, ctx.ihtidaGorselleriOku(), null, ctx.ihtidaPaketKaynaklari(), ctx.PDFLib, ctx.fontkit);
  const file = '.codex/cikti/ihtida/gas-sahit-tekrari.pdf';
  writeFileSync(file, Buffer.from(bytes));
  const metin = pdfMetni(file, ['-f', '1', '-l', '1']).replace(/[ \t]+/g, '');
  assert.equal((metin.match(/YelizKAYAHAN/g) || []).length, 1);
  assert.match(metin, /ErcanMOLA/);
});

test('Ekim 2026 EK-10 ve vektör imza: tarihe dönmüş sürüm hücresi tanınır, imza yol olarak çizilir', async () => {
  const { ctx } = ortam();
  // Google Sheets «2026-10» metnini 1 Ekim 2026 tarihine çeviriyordu; okunan değer «01.10.2026» olur.
  const kayit = { ...k, 'EK-10 sürümü': '01.10.2026' };
  const imzaVektor = JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22L140 40L180 52L224 58M60 66L170 70' });
  const g = { ...ctx.ihtidaGorselleriOku(), imzaVektor };
  const bytes = Buffer.from(await ctx.IhtidaPdf.uret(kayit, g, null, ctx.ihtidaPaketKaynaklari(), ctx.PDFLib, ctx.fontkit));
  const file = '.codex/cikti/ihtida/gas-ekim-2026-paket.pdf';
  writeFileSync(file, bytes);
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 7);
  const metin = (a, b) => pdfMetni(file, ['-f', String(a), '-l', String(b)]);
  assert.match(metin(3, 3), /İhtida Belgesi Talep Dilekçesi/);
  assert.match(metin(5, 5), /Açık Rıza Metni/);
  assert.match(metin(7, 7), /PHOTOCOPIE DE LA CARTE D'IDENTITÉ/);
  assert.doesNotMatch(metin(7, 7), /N° de carte|registre national|\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}/, 'kimlik numarası yazılmaz');
  const { PDFName, decodePDFRawStream, PDFArray } = await import('pdf-lib');
  const akis = i => {
    const c = doc.getPage(i).node.get(PDFName.of('Contents'));
    const refler = c instanceof PDFArray ? c.asArray() : [c];
    return refler.map(r => Buffer.from(decodePDFRawStream(doc.context.lookup(r)).decode()).toString('latin1')).join('\n');
  };
  const gorselVar = i => (doc.getPage(i).node.Resources().lookup(PDFName.of('XObject'))?.keys() || [])
    .some(ad => doc.context.lookup(doc.getPage(i).node.Resources().lookup(PDFName.of('XObject')).get(ad))?.dict?.get(PDFName.of('Subtype'))?.toString() === '/Image');
  // Ön başvuru: tek imza (23 Eki 2026 kararı) EK-9 arka yüzüne, dilekçenin ve EK-10'un iki yüzüne yol olarak basılır.
  for (const i of [1, 2, 3, 4, 5]) assert.match(akis(i), /1 J/, (i + 1) + '. sayfada vektör imza');
  for (const i of [1, 2, 3, 4, 5]) assert.equal(gorselVar(i), false, (i + 1) + '. sayfada raster olmamalı');
  assert.match(akis(4), /0\.1 0\.24 0\.62 RG/, 'mürekkep #1A3D9E');
});

test('Eski kaydın EK-10 rızası yeni sürüme taşınmadan v1 şablonla korunur', async () => {
  const { ctx } = ortam();
  const eski = { ...k, 'EK-10 sürümü': '', 'İmza aktarım izni': '' };
  ctx.ihtidaPaketKayit = () => ({ kayit: eski });
  ctx.ihtidaPaketKuyrugaAl(eski.Referans);
  await ctx.ihtidaPaketIsle(eski.Referans);
  const is = ctx.ihtidaPaketIsiOku(eski.Referans);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.equal(is.sayfa, 7);
});

test('Büyük görselli başvuru 20 KB eski sınırına takılmaz; diğer formlar sınırsız büyümez', () => {
  // 13 Eyl 2026: v29 kayıt üst sınırı 4 MiB; diğer görselsiz işlemler 20 KiB'da kalır.
  const { ctx } = ortam();
  ctx.ihtidaPostIsleV2 = v => ({ ok: true, boyut: v.gorseller.length });
  const payload = { tur: 'ihtida', gorseller: 'A'.repeat(40000) };
  assert.equal(ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).ok, true);
  payload.tur = 'kayit';
  assert.equal(ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).hata, 'yetkisiz');
  payload.gorseller = 'A'.repeat(4 * 1024 * 1024);
  assert.equal(ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).hata, 'cok-buyuk');
  payload.tur = 'bilinmeyen'; payload.gorseller = 'A'.repeat(40000);
  assert.equal(ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).hata, 'cok-buyuk');
  assert.equal(ctx.doPost({ postData: { contents: 'A'.repeat(15 * 1024 * 1024 + 1) } }).hata, 'cok-buyuk');
});

test('Ağ sonucu belirsizse yeniden e-posta ve MailApp yedeği çalışmaz; kabul teslim sayılmaz', async () => {
  const { ctx, sent } = ortam();
  const fetch = ctx.UrlFetchApp.fetch;
  ctx.UrlFetchApp.fetch = (url, options) => {
    if (options.method === 'post' && JSON.parse(options.payload).to[0].email === 'imam@ulucamii.be') throw new Error('timeout');
    if (options.method !== 'post') return { getResponseCode: () => 200, getContentText: () => '{"events":[]}' };
    return fetch(url, options);
  };
  ctx.ihtidaPaketKuyrugaAl(k.Referans); await ctx.ihtidaPaketIsle(k.Referans);
  let is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.deepEqual(Array.from(is.alicilar, a => a.durum), ['saglayici-kabul', 'belirsiz', 'saglayici-kabul']);
  is.sonraki = 0; ctx.ihtidaPaketIsiYaz(is); await ctx.ihtidaPaketIsle(k.Referans);
  assert.equal(sent.length, 2);
  assert.notEqual(ctx.ihtidaPaketIsiOku(k.Referans).durum, 'tamam');
});

test('Kaybolan gönderim cevabı yalnız aynı nüsha ve alıcının tek mesajıyla kurtarılır', async () => {
  const { ctx, sent } = ortam();
  const fetch = ctx.UrlFetchApp.fetch;
  let phase = 0;
  const tag = k.Referans + '-r1';
  ctx.UrlFetchApp.fetch = (url, options) => {
    if (options.method === 'post') {
      const accepted = fetch(url, options);
      if (JSON.parse(options.payload).to[0].email === 'imam@ulucamii.be') throw new Error('Yanıt alınmadan bağlantı kesildi');
      return accepted;
    }
    const query = new URL(url).searchParams;
    if (!query.has('tags')) return fetch(url, options);
    assert.deepEqual(JSON.parse(query.get('tags')), [tag]);
    assert.equal(query.get('email'), 'imam@ulucamii.be');
    const matching = { tag, email: 'imam@ulucamii.be', messageId: '<test-2@example.test>', event: 'delivered' };
    const events = phase === 0 ? [
      { ...matching, tag: k.Referans + '-r0' },
      { ...matching, email: 'baska@example.test' },
    ] : phase === 1 ? [matching, { ...matching, messageId: '<baska@example.test>' }] : [matching, { ...matching, event: 'requests' }];
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ events }) };
  };
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  for (phase = 0; phase < 3; phase++) {
    const queued = ctx.ihtidaPaketIsiOku(k.Referans);
    queued.sonraki = 0; ctx.ihtidaPaketIsiYaz(queued);
    await ctx.ihtidaPaketIsle(k.Referans);
    const current = ctx.ihtidaPaketIsiOku(k.Referans);
    assert.equal(current.alicilar[1].durum, phase < 2 ? 'belirsiz' : 'teslim-edildi');
    assert.equal(sent.length, 3, 'Sağlayıcıya ulaşan e-posta yeniden gönderilmez');
  }
  assert.equal(ctx.ihtidaPaketIsiOku(k.Referans).durum, 'tamam');
});

test('Bir başvurunun bozuk iş dosyası diğer başvuruların kuyruğunu durdurmaz', async () => {
  const { ctx, props, sent } = ortam();
  const badRef = 'IH-2099-9998', updates = [];
  const corrupted = ctx.ihtidaKlasorGetir().createFile(ctx.Utilities.newBlob('{bozuk', 'application/json', badRef + ' - paket-islem.json'));
  props.set('IHTIDA_PAKET_IS_' + badRef, corrupted.getId());
  const update = ctx.ihtidaPaketHucre;
  ctx.ihtidaPaketHucre = (ref, field, value) => { updates.push({ ref, field, value }); update(ref, field, value); };
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketKuyrukCalistir();
  assert.ok(updates.some(v => v.ref === badRef && v.field === 'Paket durumu' && /iş kaydı okunamadı/.test(v.value)));
  assert.equal(ctx.ihtidaPaketIsiOku(k.Referans).durum, 'tamam');
  assert.equal(sent.length, 3);
  assert.equal(props.has('IHTIDA_PAKET_IS_' + k.Referans), false);
});

test('Bozuk ekle eksik PDF/e-posta oluşmaz; hata arşivde ve admin durumunda kalır', async () => {
  const { ctx, sent, cells } = ortam();
  ctx.ihtidaGorselleriOku = () => ({ vesikalik: image, kimlikOn: 'bozuk', kimlikArka: image, imza: image });
  ctx.ihtidaPaketKuyrugaAl(k.Referans); await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'hata'); assert.equal(is.pdfId, undefined); assert.equal(sent.length, 0);
  assert.match(cells.get('Paket durumu'), /tamamlanamadı/);
});

test('Admin uçları yetkisiz istekleri reddeder; gelecekteki tören onaylanamaz', () => {
  const { ctx } = ortam();
  assert.equal(ctx.ihtidaPaketDurumIsle({ parameter: { ref: k.Referans } }).hata, 'yetki');
  assert.equal(ctx.ihtidaPaketOnayIsle({}).hata, 'yetki');
  assert.equal(ctx.ihtidaPaketTekrarIsle({}).hata, 'yetki');
  assert.equal(ctx.ihtidaPaketOnayDogrula({ ihtidaTarihi: '2099-01-01', beyanTarihi: '2026-09-09' }), false);
});

// 21 Eki 2026: son nüsha ekranında düzeltilen EK-9 arka yüz alanları sunucuda yalnız bilinen anahtar ve ≤120 karakterle geçer.
test('Son nüsha onayı düzeltilen EK-9 alanlarını doğrular ve belgeye basar', async () => {
  const { ctx, files } = ortam();
  const temel = { adSoyad: k['Adı Soyadı'], adres: k.Adres, ihtidaTarihi: '2026-09-08', beyanTarihi: '2026-09-09', belgeTuru: 'kimlik', sahitler: [{ ad: 'Birinci Örnek' }, { ad: 'İkinci Örnek' }] };
  assert.equal(ctx.ihtidaPaketOnayDogrula(temel), true, 'alanlar olmadan eski panel onayı geçer');
  assert.equal(ctx.ihtidaPaketOnayDogrula({ ...temel, alanlar: { dogumYeri: 'Belçika / Belgique', anneAdi: '' } }), true);
  for (const alanlar of [{ adSoyad: 'Başka Ad' }, { meslek: 'x'.repeat(121) }, { meslek: 7 }, ['dogumYeri'], 'metin'])
    assert.equal(ctx.ihtidaPaketOnayDogrula({ ...temel, alanlar }), false, JSON.stringify(alanlar));
  const v = { anahtar: 'test-panel-key', ref: k.Referans, hazirlik: { ...temel, alanlar: { dogumYeri: 'Belçika / Belgique', meslek: 'Emekli / Retraité' } }, islemAnahtari: 'approval-alanlar-2099' };
  assert.equal(ctx.ihtidaPaketOnayIsle(v).ok, true);
  await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'tamam');
  const yol = '.codex/cikti/ihtida/gas-son-nusha-alanlar.pdf';
  writeFileSync(yol, Buffer.from(files.get(is.pdfId).getBlob().getBytes()));
  const arka = pdfMetni(yol, ['-f', '2', '-l', '2']).replace(/[ 	]+/g, '');
  assert.ok(arka.includes('Belçika/Belgique') && arka.includes('Emekli/Retraité'), 'düzeltilen değerler EK-9 arka yüzünde');
});

test('Satır kaydedilip kuyruk yarım kaldığında aynı form yeni başvuru oluşturmadan kuyruğu onarır', () => {
  const { ctx } = ortam();
  ctx.ihtidaDogrulaV2 = () => ({ tamam: true });
  ctx.ihtidaV2SayfaGetir = () => ({});
  ctx.ihtidaV2AnahtarBul = () => ({ ref: k.Referans });
  ctx.satirEkle = () => { throw new Error('Yinelenen satır'); };
  const result = ctx.ihtidaPostIsleV2({ gonderimAnahtari: 'duplicate-test-2099' });
  assert.equal(result.ok, true); assert.equal(result.tekrar, true);
  assert.equal(ctx.ihtidaPaketIsiOku(k.Referans).durum, 'sirada');
});

test('Son nüsha onayı idempotenttir; arşiv değiştirilirse e-posta durur', async () => {
  const { ctx, sent, files } = ortam();
  const hazirlik = { adSoyad: k['Adı Soyadı'], adres: k.Adres, ihtidaTarihi: '2026-09-08', beyanTarihi: '2026-09-09', belgeTuru: 'kimlik', sahitler: [{ ad: 'Birinci Örnek', imza: image }, { ad: 'İkinci Örnek', imza: image }] };
  const v = { anahtar: 'test-panel-key', ref: k.Referans, hazirlik, islemAnahtari: 'approval-test-2099' };
  assert.equal(ctx.ihtidaPaketOnayIsle(v).ok, true);
  assert.equal(ctx.ihtidaPaketOnayIsle(v).paket.revizyon, 1);
  await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.asama, 'musavirlik'); assert.equal(is.durum, 'tamam'); assert.equal(sent.length, 3);
  assert.equal(is.duzenleme, undefined, 'İmza resmi geçici iş dosyasından temizlenir');
  writeFileSync('.codex/cikti/ihtida/gas-son-nusha.pdf', Buffer.from(files.get(is.pdfId).getBlob().getBytes()));
  assert.equal(ctx.ihtidaPaketOnayIsle(v).paket.revizyon, 1, 'Cevap kaybolunca onay tekrarı yeni nüsha değildir');
  is.durum = 'teslim-takibi'; is.sonraki = 0; is.alicilar[0].durum = 'sirada'; ctx.ihtidaPaketIsiYaz(is);
  files.get(is.pdfId).getBlob = () => ({ getBytes: () => [1, 2, 3] });
  await ctx.ihtidaPaketIsle(k.Referans);
  assert.equal(ctx.ihtidaPaketIsiOku(k.Referans).durum, 'hata'); assert.equal(sent.length, 3);
});

// 29 Eyl 2026: silinen deneme başvurusunun numarası sonraki gerçek başvuruya yeniden verilirdi; çöpteki eski dosyalar yenisini
// gölgelemesin diye bu savunma kalır. 23 Eki 2026'dan beri numara yeniden verilmez (aşağıdaki «azalmayan sayaç» testi).
test('Yeniden verilen numarada çöpteki eski iş dosyası ve görseller yeni başvuruyu gölgelemez', () => {
  const { ctx } = ortam(), klasor = ctx.ihtidaKlasorGetir(), ref = 'IH-2099-0006';
  const eskiIs = klasor.createFile(ctx.Utilities.newBlob(JSON.stringify({ ref, durum: 'tamam', alicilar: [] }), 'application/json', ref + ' - paket-islem.json'));
  const eskiGorsel = klasor.createFile(ctx.Utilities.newBlob('ESKI-DENEME', 'image/jpeg', ref + ' - vesikalik.jpg'));
  eskiIs.setTrashed(true); eskiGorsel.setTrashed(true);
  assert.equal(ctx.ihtidaPaketIsiOku(ref), null, 'çöpteki iş dosyası okunmamalı');
  assert.equal(ctx.gercekGorselleriOku(klasor, ref, []).vesikalik, '', 'çöpteki görsel okunmamalı');
  assert.equal(ctx.ihtidaPaketKuyrugaAl(ref).durum, 'sirada');
  assert.equal(ctx.ihtidaPaketIsiOku(ref).durum, 'sirada', 'yeni iş dosyası çöpteki eskinin arkasında kaybolmamalı');
  klasor.createFile(ctx.Utilities.newBlob('YENI-BASVURU', 'image/jpeg', ref + ' - vesikalik.jpg'));
  const g = ctx.gercekGorselleriOku(klasor, ref, []);
  assert.equal(Buffer.from(g.vesikalik.split(',')[1], 'base64').toString(), 'YENI-BASVURU');
});

test('Test temizliği ihtida satırıyla birlikte aynı numaranın iş dosyasını, paket PDF’ini, görsellerini ve kuyruğunu kaldırır', () => {
  const { ctx, files, props } = ortam(), klasor = ctx.ihtidaKlasorGetir(), yeni = (ad, tur = 'image/jpeg') => klasor.createFile(ctx.Utilities.newBlob('x', tur, ad));
  const hedef = 'IH-2099-0007', diger = 'IH-2099-0005';
  for (const ref of [hedef, diger]) for (const son of [' - vesikalik.jpg', ' - kimlik-on.jpg', ' - kimlik-arka.jpg', ' - imza.png', ' - imza-vektor.json']) yeni(ref + son);
  const paket = yeni(hedef + ' - Ihtida Belge Paketi - r1.pdf', 'application/pdf'), benzer = yeni('IH-2099-00071 - vesikalik.jpg');
  ctx.ihtidaPaketIsiYaz({ ref: hedef, durum: 'teslim-takibi', pdfId: paket.getId(), alicilar: [] });
  ctx.ihtidaPaketIsiYaz({ ref: diger, durum: 'tamam', alicilar: [] });
  const rows = [[new Date(), diger, 'Deniz Örnek', ''], [new Date(), hedef, 'Deniz TESTOGLU', '']], baslik = ['Zaman damgası', 'Referans', 'Adı Soyadı', 'PDF bağlantısı'];
  const sheet = { getLastRow: () => rows.length + 1, getLastColumn: () => baslik.length, deleteRow: n => rows.splice(n - 2, 1),
    getRange: (r, c, nr) => ({ getValues: () => r === 1 ? [baslik] : rows.slice(r - 2, r - 2 + nr) }) };
  assert.equal(ctx.testTemizleSayfa(sheet, klasor, ['Adı Soyadı']), 1);
  assert.deepEqual(rows.map(r => r[1]), [diger]);
  const cop = [...files.values()].filter(f => f.isTrashed()).map(f => f.getName()).sort();
  assert.deepEqual(cop, [hedef + ' - Ihtida Belge Paketi - r1.pdf', hedef + ' - imza-vektor.json', hedef + ' - imza.png', hedef + ' - kimlik-arka.jpg', hedef + ' - kimlik-on.jpg', hedef + ' - paket-islem.json', hedef + ' - vesikalik.jpg']);
  assert.equal(benzer.isTrashed(), false);
  assert.equal(props.has('IHTIDA_PAKET_IS_' + hedef), false);
  assert.equal(props.has('IHTIDA_PAKET_IS_' + diger), true);
});

// 23 Eki 2026: IH-2026-0004 üç deneme paketinin e-postasında/PDF'inde zaten kullanılmıştı; test-temizle satırı silince aynı numara
// ilk GERÇEK başvurana yeniden verildi. Sayaç artık defterden bağımsız olarak azalmaz (Script Property REF_SON_<ÖNEK>_<YIL>).
function referansSayfasi(refler) {
  const satirlar = refler;   // her eleman bir referans; sütun 2 referanstır
  return { satirlar, getLastRow: () => satirlar.length + 1,
    getRange: (r, c, nr) => ({ getValues: () => satirlar.slice(r - 2, r - 2 + nr).map(ref => [ref]) }) };
}

test('Referans numarası azalmaz: silinen son başvurunun numarası bir daha verilmez', () => {
  const { ctx, props } = ortam();
  const defter = referansSayfasi(['IH-2026-0001', 'IH-2026-0002', 'IH-2026-0003']);
  assert.equal(ctx.referansMaxBul([defter], 'IH', '2026'), 4, 'defterdeki en büyükten sonraki');
  assert.equal(props.get('REF_SON_IH_2026'), '4', 'dağıtılan numara kaydedilir');
  // Deneme (TESTOGLU) 0004'ü aldı, sonra test-temizle satırı sildi: defter yine 0003'te kalır.
  defter.satirlar.push('IH-2026-0004');
  defter.satirlar.pop();
  assert.equal(ctx.referansMaxBul([defter], 'IH', '2026'), 5, 'silinen 0004 yeniden verilmez');
  assert.equal(ctx.referansMaxBul([referansSayfasi([])], 'IH', '2026'), 6, 'defter boşalsa da sayaç geri gitmez');
  // Defterde saklanandan büyük bir numara varsa (elle eklenmiş satır) o esas alınır.
  assert.equal(ctx.referansMaxBul([referansSayfasi(['IH-2026-0020'])], 'IH', '2026'), 21);
  assert.equal(props.get('REF_SON_IH_2026'), '21');
  // Önekler birbirinden, yıllar birbirinden bağımsız sayılır; başka önek bu sayaca dokunmaz.
  assert.equal(ctx.referansMaxBul([referansSayfasi([])], 'UC', '2026'), 1);
  assert.equal(ctx.referansMaxBul([referansSayfasi([])], 'ST', '2026'), 1);
  assert.equal(ctx.referansMaxBul([referansSayfasi([])], 'IH', '2027'), 1);
  assert.equal(props.get('REF_SON_IH_2026'), '21');
  // v1 + v2 defterleri birlikte taranır; sayfa yoksa (null) atlanır.
  assert.equal(ctx.referansMaxBul([null, referansSayfasi(['IH-2026-0040']), referansSayfasi(['IH-2026-0030'])], 'IH', '2026'), 41);
});

test('Sayaç özelliği okunamaz ya da yazılamazsa başvuru düşmez; defterdeki numaraya dönülür', () => {
  const { ctx } = ortam();
  ctx.PropertiesService = { getScriptProperties: () => { throw new Error('quota'); } };
  assert.equal(ctx.referansMaxBul([referansSayfasi(['IH-2026-0007'])], 'IH', '2026'), 8);
  ctx.PropertiesService = { getScriptProperties: () => ({ getProperty: () => '9', setProperty: () => { throw new Error('quota'); } }) };
  assert.equal(ctx.referansMaxBul([referansSayfasi(['IH-2026-0007'])], 'IH', '2026'), 10);
});

// ---- 25 Ekim 2026: EK-9 iki dilli ve zamir çizikleri ------------------------------------------------------------------------------
// Rıdvan KAYAHAN: «bu belgeyi diyanet veriyor, diyanetin resmi olarak konuştuğu dil türkçe, bu belgede dolayısıyla iki dilli olmalı» ·
// «başvuru sahibi erkek ise "he/she" (she) bölümünü … kadın ise de tam tersini üstünü çiz».
async function onYuzAkisi(bytes) {
  const doc = await PDFDocument.load(bytes);
  const c = doc.getPage(0).node.get(PDFName.of('Contents'));
  return (c instanceof PDFArray ? c.asArray() : [c]).map(r => Buffer.from(decodePDFRawStream(doc.context.lookup(r)).decode()).toString('latin1')).join('\n');
}
const zamirCizgisi = (akis, x0, x1) => new RegExp(`${x0.replace('.', '\\.')} [\\d.]+ m\\s+${x1.replace('.', '\\.')} [\\d.]+ l`).test(akis);

test('Sebebin Türkçesi: görevlinin yazdığı önce gelir, yoksa Google Çeviri; Türkçe formda ve hata hâlinde ikinci satır yok', () => {
  const { ctx } = ortam();
  const cagrilar = [];
  ctx.LanguageApp = { translate: (metin, kaynak, hedef) => { cagrilar.push([kaynak, hedef]); return 'Huzuru  buldum .'; } };
  const fr = { ...k, 'İhtida sebebi': 'J’ai trouvé la paix.' };
  assert.equal(ctx.ihtidaSebebiTurkcesi(fr, null), 'Huzuru buldum.', 'boşluk ve noktalama önündeki boşluk temizlenir');
  assert.deepEqual(cagrilar, [['', 'tr']], 'kaynak dil kendiliğinden bulunur, hedef Türkçe');
  assert.equal(ctx.ihtidaSebebiTurkcesi(fr, { ihtidaSebebiTr: ' Görevlinin  çevirisi. ' }), 'Görevlinin çevirisi.');
  assert.equal(ctx.ihtidaSebebiTurkcesi(fr, { ihtidaSebebi: '' }), '', 'görevli sebebi sildiyse çeviri yok');
  assert.equal(ctx.ihtidaSebebiTurkcesi({ ...fr, 'Form dili': 'tr' }, null), '');
  assert.equal(cagrilar.length, 1, 'Türkçe formda ve boş sebepte çeviri servisi çağrılmaz');
  ctx.LanguageApp = { translate: () => 'J’ai trouvé la paix.' };
  assert.equal(ctx.ihtidaSebebiTurkcesi(fr, null), '', 'çeviri metnin aynısıysa ikinci satır yazılmaz');
  ctx.LanguageApp = { translate: () => { throw new Error('kota'); } };
  assert.equal(ctx.ihtidaSebebiTurkcesi(fr, null), '', 'çeviri alınamazsa paket yine üretilir');
  const temel = { adSoyad: k['Adı Soyadı'], adres: k.Adres, ihtidaTarihi: '2026-09-08', beyanTarihi: '2026-09-09', belgeTuru: 'kimlik', sahitler: [{ ad: 'Birinci Örnek' }, { ad: 'İkinci Örnek' }] };
  assert.equal(ctx.ihtidaPaketOnayDogrula({ ...temel, ihtidaSebebiTr: 'Huzuru buldum.' }), true);
  for (const ihtidaSebebiTr of [7, 'x'.repeat(601), null]) assert.equal(ctx.ihtidaPaketOnayDogrula({ ...temel, ihtidaSebebiTr }), false, String(ihtidaSebebiTr));
});

test('Son nüsha iki dilli: Fransızca sebebin altında Türkçesi; kadın başvuranda «he/» ve «his/», erkekte «/she» ve «/her» çizilir', async () => {
  const { ctx, files } = ortam();
  ctx.LanguageApp = { translate: () => 'Sunucu çevirisi kullanılmamalı.' };
  const fr = { ...k, 'İhtida sebebi': 'J’ai trouvé la paix.' };
  ctx.ihtidaPaketKayit = () => ({ kayit: { ...fr } });
  const temel = { adSoyad: k['Adı Soyadı'], adres: k.Adres, ihtidaTarihi: '2026-09-08', beyanTarihi: '2026-09-09', belgeTuru: 'kimlik', sahitler: [{ ad: 'Birinci Örnek' }, { ad: 'İkinci Örnek' }] };
  assert.equal(ctx.ihtidaPaketOnayIsle({ anahtar: 'test-panel-key', ref: k.Referans, hazirlik: { ...temel, ihtidaSebebiTr: 'Huzuru buldum.' }, islemAnahtari: 'approval-iki-dilli-2099' }).ok, true);
  await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  const bytes = Buffer.from(files.get(is.pdfId).getBlob().getBytes());
  const yol = '.codex/cikti/ihtida/gas-son-nusha-iki-dilli.pdf';
  writeFileSync(yol, bytes);
  const arka = pdfMetni(yol, ['-f', '2', '-l', '2']).replace(/[ \t]+/g, '');
  assert.ok(arka.includes('J’aitrouvélapaix.'), 'özgün sebep');
  assert.ok(arka.includes('Huzurubuldum.'), 'görevlinin Türkçesi');
  assert.doesNotMatch(arka, /Sunucuçevirisi/);
  const kadin = await onYuzAkisi(bytes);
  assert.ok(zamirCizgisi(kadin, '565.5', '581.2') && zamirCizgisi(kadin, '288.1', '307'), 'kadın: he/ ve his/ çizili');
  assert.ok(!zamirCizgisi(kadin, '578.3', '599.2') && !zamirCizgisi(kadin, '304', '324.4'), 'kadın: she ve her çizilmez');
  const erkekBytes = Buffer.from(await ctx.IhtidaPdf.uret({ ...k, Cinsiyet: 'erkek' }, ctx.ihtidaGorselleriOku(), null, ctx.ihtidaPaketKaynaklari(), ctx.PDFLib, ctx.fontkit));
  const erkek = await onYuzAkisi(erkekBytes);
  assert.ok(zamirCizgisi(erkek, '578.3', '599.2') && zamirCizgisi(erkek, '304', '324.4'), 'erkek: /she ve /her çizili');
  assert.ok(!zamirCizgisi(erkek, '565.5', '581.2'), 'erkek: he çizilmez');
  const belirsiz = await onYuzAkisi(Buffer.from(await ctx.IhtidaPdf.uret({ ...k, Cinsiyet: '' }, ctx.ihtidaGorselleriOku(), null, ctx.ihtidaPaketKaynaklari(), ctx.PDFLib, ctx.fontkit)));
  assert.ok(!zamirCizgisi(belirsiz, '565.5', '581.2') && !zamirCizgisi(belirsiz, '578.3', '599.2'), 'cinsiyet bilinmiyorsa zamir çizilmez');
  const saglik = ctx.doGet({ parameter: {} });
  assert.equal(saglik.ihtidaSebepTurkcesi, true);
  assert.equal(saglik.ihtidaZamirCizigi, true);
});

test('Sağlık cevabı tek imza kuralını ve azalmayan sayacı bildirir', () => {
  const { ctx } = ortam();
  const saglik = ctx.doGet({ parameter: {} });
  assert.equal(saglik.ihtidaTekImza, true);
  assert.equal(saglik.referansSayaci, true);
});

// ---- 23 Ekim 2026: kayıtlı şahit imzaları (Rıdvan KAYAHAN, Ercan MOLA) paketlere otomatik basılır -------------------------------
// Rıdvan KAYAHAN: «benim imzam ve başkan Ercan MOLA imzası otomatik gelmedi, belgeye … otomatik gelecek şekilde düzelt».
// Gerçek imzalar yalnız dernek Google hesabındaki özel depodadır; bu testlerin hepsi SENTETİK şekil kullanır.
const SAHTE_DOLGU = JSON.stringify({ v: 2, w: 300, h: 120, p: [{ d: 'M10 100L60 20L110 100L90 100L60 50L30 100Z M150 20L290 20L290 40L150 40Z', f: 1, e: 1 }] });
const SAHTE_CIZGI = JSON.stringify({ v: 2, w: 240, h: 100, p: [{ d: 'M10 80C40 10 80 10 100 60L140 20L230 90', k: 3 }] });
const PANEL = 'test-panel-key';
const imzaYukle = (ctx, ad, imza) => ctx.ihtidaSahitImzaYukleIsle({ tur: 'sahit-imza-yukle', anahtar: PANEL, ad, imza });
const imzalariKaydet = ctx => { imzaYukle(ctx, 'ercan', SAHTE_DOLGU); imzaYukle(ctx, 'ridvan', SAHTE_CIZGI); };
const dosyaBayt = (files, id) => Buffer.from(files.get(id).getBlob().getBytes());
/** EK-9 ön yüzündeki vektör şahit imzası sayısı («q s 0 0 -s x y cm q <kalem mürekkebi>»). */
async function sahitImzaSayisi(bytes) {
  const doc = await PDFDocument.load(bytes);
  const c = doc.getPage(0).node.get(PDFName.of('Contents'));
  const akis = (c instanceof PDFArray ? c.asArray() : [c]).map(r => Buffer.from(decodePDFRawStream(doc.context.lookup(r)).decode()).toString('latin1')).join('\n');
  return [...akis.matchAll(/q\s+-?[\d.]+(?:e-?\d+)? 0 0 -[\d.]+(?:e-?\d+)? -?[\d.]+ -?[\d.]+ cm\s+(?:q\s+0\.1 0\.24 0\.62 (?:rg|RG)|[\d.]+ w\s+1 J\s+1 j\s+0\.1 0\.24 0\.62 RG)/g)].length;
}

test('Şahit imza deposu: yetki ister, biçimi doğrular, cevapta imzayı geri vermez; okuma ve silme çalışır', () => {
  const { ctx, files } = ortam();
  assert.equal(imzaYukle(ctx, 'ercan', SAHTE_DOLGU).ok, true);
  assert.equal(ctx.ihtidaSahitImzaYukleIsle({ ad: 'ercan', imza: SAHTE_DOLGU }).hata, 'yetki');
  assert.equal(ctx.ihtidaSahitImzaYukleIsle({ anahtar: 'yanlis', ad: 'ercan', imza: SAHTE_DOLGU }).hata, 'yetki');
  assert.equal(ctx.ihtidaSahitImzalariGetIsle({ parameter: {} }).hata, 'yetki');
  assert.equal(ctx.ihtidaSahitImzalariGetIsle({ parameter: { anahtar: 'yanlis' } }).hata, 'yetki');
  assert.equal(imzaYukle(ctx, 'yeliz', SAHTE_DOLGU).hata, 'sahit-adi-gecersiz');
  assert.equal(imzaYukle(ctx, 'ercan', JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22' })).hata, 'sahit-imzasi-gecersiz', 'formun v1 imzası şahit imzası olamaz');
  assert.equal(imzaYukle(ctx, 'ercan', { v: 2 }).hata, 'sahit-imzasi-gecersiz');
  assert.equal(imzaYukle(ctx, 'ercan', '{bozuk').hata, 'sahit-imzasi-gecersiz');
  const r = imzaYukle(ctx, 'ridvan', SAHTE_CIZGI);
  assert.equal(r.ok, true); assert.deepEqual([...r.kayitliSahitler].sort(), ['ercan', 'ridvan']);
  assert.ok(!JSON.stringify(r).includes('"v":2'), 'yükleme cevabı imzayı geri vermez');
  const g = ctx.ihtidaSahitImzalariGetIsle({ parameter: { anahtar: PANEL } });
  assert.equal(g.ok, true); assert.equal(g.imzalar.ercan, SAHTE_DOLGU); assert.equal(g.imzalar.ridvan, SAHTE_CIZGI);
  assert.equal([...files.values()].filter(f => f.getName() === 'sahit-imzalari.json').length, 1, 'tek dosya, ikinci yazma aynı dosyayı günceller');
  assert.equal(imzaYukle(ctx, 'ercan', '').ok, true, 'boş imza kaydı siler');
  assert.deepEqual(Object.keys(ctx.ihtidaSahitImzalariGetIsle({ parameter: { anahtar: PANEL } }).imzalar), ['ridvan']);
});

test('Ön başvuruda arşiv ve dernek içi alıcılar şahit imzalı, başvuran şahit imzasız ikinci PDF alır', async () => {
  const { ctx, sent, files, cells } = ortam();
  imzalariKaydet(ctx);
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.deepEqual(Array.from(is.sahitImzasi), ['ercan', 'ridvan']);
  assert.equal(is.basvuranKopya, 'hazir');
  assert.deepEqual(sent.map(p => p.to[0].email), ['info@ulucamii.be', 'imam@ulucamii.be', 'deniz@example.test']);
  const ana = dosyaBayt(files, is.pdfId), basvuran = dosyaBayt(files, is.basvuranPdfId);
  assert.notDeepEqual(ana, basvuran);
  assert.equal(await sahitImzaSayisi(ana), 2, 'arşiv ve dernek içi nüsha: iki şahit imzası');
  assert.equal(await sahitImzaSayisi(basvuran), 0, 'başvuran nüshası: şahit imzası yok');
  assert.equal((await PDFDocument.load(ana)).getPageCount(), 7); assert.equal((await PDFDocument.load(basvuran)).getPageCount(), 7);
  assert.deepEqual(Buffer.from(sent[0].attachment[0].content, 'base64'), ana);
  assert.deepEqual(Buffer.from(sent[1].attachment[0].content, 'base64'), ana);
  assert.deepEqual(Buffer.from(sent[2].attachment[0].content, 'base64'), basvuran, 'başvurana yalnız şahit imzasız nüsha gider');
  for (const p of sent) assert.equal(p.attachment[0].name, k.Referans + ' - Ihtida Belge Paketi - r1.pdf', 'ek adı her alıcıda aynı');
  // Bütünlük: iki ayrı özet, iki ayrı arşiv dosyası.
  assert.equal(is.sha256, createHash('sha256').update(ana).digest('hex'));
  assert.equal(is.basvuranSha256, createHash('sha256').update(basvuran).digest('hex'));
  assert.equal(files.get(is.basvuranPdfId).getName(), k.Referans + ' - Ihtida Belge Paketi - r1 - basvuran.pdf');
  assert.ok(cells.get('Tam paket PDF').includes(is.pdfId) && !cells.get('Tam paket PDF').includes(is.basvuranPdfId), 'defterdeki bağlantı şahit imzalı arşiv nüshasıdır');
  assert.deepEqual(Array.from(is.alicilar, a => Boolean(a.basvuran)), [false, false, true]);
  // İmzalar iş dosyasında ve durum özetinde çoğaltılmaz.
  assert.ok(!ctx.ihtidaPaketIsDosyasi(k.Referans).getBlob().getDataAsString('UTF-8').includes('"v":2'));
  const ozet = ctx.ihtidaPaketOzet(is);
  assert.ok(!JSON.stringify(ozet).includes('"v":2'));
  assert.deepEqual(Array.from(ozet.sahitImzasi), ['ercan', 'ridvan']); assert.equal(ozet.basvuranPdfId, is.basvuranPdfId);
  assert.equal(ozet.alicilar[2].basvuran, true);
  await ctx.ihtidaPaketIsle(k.Referans);
  assert.equal(sent.length, 3, 'kuyruk tekrar çalışsa da e-posta tekrarlanmaz');
});

test('Başvuran nüshası hazırlanamazsa dernek içine gönderim sürer; başvurana şahit imzalı nüsha asla gitmez; sonraki çalışma tamamlar', async () => {
  const { ctx, sent, files } = ortam();
  imzalariKaydet(ctx);
  let cagri = 0;
  const gorseller = ctx.ihtidaGorselleriOku;
  ctx.ihtidaGorselleriOku = (klasor, ref, hatalar) => { cagri++; if (cagri === 2) hatalar.push({ dosya: 'x', neden: 'hata' }); return gorseller(); };
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketIsle(k.Referans);
  let is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.deepEqual(sent.map(p => p.to[0].email), ['info@ulucamii.be', 'imam@ulucamii.be'], 'başvuran nüshası yokken başvurana gönderilmez');
  assert.equal(is.basvuranKopya, 'sirada'); assert.equal(is.durum, 'teslim-takibi'); assert.equal(is.alicilar[2].durum, 'sirada');
  assert.ok(is.sonraki - Date.now() < 60 * 1000, 'nüsha için bir sonraki dakikalık çalışma beklenir (5 dakika değil)');
  is.sonraki = 0; ctx.ihtidaPaketIsiYaz(is);
  await ctx.ihtidaPaketIsle(k.Referans);
  is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.basvuranKopya, 'hazir'); assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.equal(sent.length, 3); assert.equal(sent[2].to[0].email, 'deniz@example.test');
  assert.deepEqual(Buffer.from(sent[2].attachment[0].content, 'base64'), dosyaBayt(files, is.basvuranPdfId));
  assert.equal(await sahitImzaSayisi(Buffer.from(sent[2].attachment[0].content, 'base64')), 0);
  assert.equal(await sahitImzaSayisi(Buffer.from(sent[0].attachment[0].content, 'base64')), 2);
});

test('Başvuran nüshası üç kez hazırlanamazsa iş hataya düşer; başvurana hiçbir şey gönderilmez', async () => {
  const { ctx, sent } = ortam();
  imzalariKaydet(ctx);
  let cagri = 0;
  const gorseller = ctx.ihtidaGorselleriOku;
  ctx.ihtidaGorselleriOku = (klasor, ref, hatalar) => { if (++cagri > 1) hatalar.push({ dosya: 'x', neden: 'hata' }); return gorseller(); };
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  for (let i = 0; i < 5; i++) {
    const is = ctx.ihtidaPaketIsiOku(k.Referans); is.sonraki = 0; ctx.ihtidaPaketIsiYaz(is);
    await ctx.ihtidaPaketIsle(k.Referans);
  }
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'hata'); assert.equal(is.basvuranKopya, 'sirada'); assert.equal(is.basvuranPdfId, undefined);
  assert.deepEqual(sent.map(p => p.to[0].email), ['info@ulucamii.be', 'imam@ulucamii.be']);
});

test('Son nüshada işaretli şahidin imzası basılır, ikinci PDF üretilmez; önceki nüshaların dosyaları test temizliğinde de bulunur', async () => {
  const { ctx, sent, files } = ortam();
  imzalariKaydet(ctx);
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketIsle(k.Referans);
  const r1 = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(r1.durum, 'tamam');
  const hazirlik = { adSoyad: k['Adı Soyadı'], adres: k.Adres, ihtidaTarihi: '2026-09-08', beyanTarihi: '2026-09-09', belgeTuru: 'kimlik',
    sahitler: [{ ad: 'Ercan MOLA', imza: '', imzaKullan: true }, { ad: 'Rıdvan KAYAHAN', imza: '', imzaKullan: false }] };
  assert.equal(ctx.ihtidaPaketOnayDogrula(hazirlik), true);
  assert.equal(ctx.ihtidaPaketOnayDogrula({ ...hazirlik, sahitler: [{ ad: 'Ercan MOLA', imzaKullan: 'evet' }, { ad: 'Rıdvan KAYAHAN' }] }), false, 'imzaKullan mantıksal olmalı');
  assert.equal(ctx.ihtidaPaketOnayDogrula({ ...hazirlik, sahitler: [{ ad: 'Ercan MOLA' }, { ad: 'Rıdvan KAYAHAN', imzaKullan: true }] }), true, 'işaret gönderilmezse varsayılan: eklenir');
  assert.equal(ctx.ihtidaPaketOnayIsle({ anahtar: PANEL, ref: k.Referans, hazirlik, islemAnahtari: 'approval-sahit-2099' }).ok, true);
  assert.equal(ctx.ihtidaPaketIsiOku(k.Referans).duzenleme.sahitler[0].imza, '', 'imza istemciden gelmez, iş kaydında durmaz');
  await ctx.ihtidaPaketIsle(k.Referans);
  const r2 = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(r2.asama, 'musavirlik'); assert.equal(r2.durum, 'tamam', JSON.stringify(r2));
  assert.deepEqual(Array.from(r2.sahitImzasi), ['ercan'], 'işareti kaldırılan şahidin imzası basılmaz');
  assert.ok(!r2.basvuranKopya, 'son nüshada ikinci PDF yok: aynı nüsha başvurana da gider');
  assert.equal(sent.length, 6);
  const son = dosyaBayt(files, r2.pdfId);
  for (const p of sent.slice(3)) assert.deepEqual(Buffer.from(p.attachment[0].content, 'base64'), son);
  assert.equal(await sahitImzaSayisi(son), 1);
  assert.deepEqual(Array.from(r2.eskiPdfler).sort(), [r1.pdfId, r1.basvuranPdfId].sort(), 'önceki revizyonun iki dosyası iş kaydında kalır');
  // Test temizliği (yalnız TESTOGLU satırı): üç PDF'in hepsi çöpe gider, başka başvurunun dosyası kalır.
  const klasor = ctx.ihtidaKlasorGetir(), diger = 'IH-2099-0005';
  const digerPdf = klasor.createFile(ctx.Utilities.newBlob('x', 'application/pdf', diger + ' - Ihtida Belge Paketi - r1.pdf'));
  ctx.ihtidaPaketIsiYaz({ ref: diger, durum: 'tamam', pdfId: digerPdf.getId(), alicilar: [] });
  const satirlar = [[new Date(), diger, 'Deniz Örnek', ''], [new Date(), k.Referans, 'Deniz TESTOGLU', '']], baslik = ['Zaman damgası', 'Referans', 'Adı Soyadı', 'PDF bağlantısı'];
  const sheet = { getLastRow: () => satirlar.length + 1, getLastColumn: () => baslik.length, deleteRow: n => satirlar.splice(n - 2, 1),
    getRange: (r, c, nr) => ({ getValues: () => r === 1 ? [baslik] : satirlar.slice(r - 2, r - 2 + nr) }) };
  assert.equal(ctx.testTemizleSayfa(sheet, klasor, ['Adı Soyadı']), 1);
  for (const id of [r1.pdfId, r1.basvuranPdfId, r2.pdfId]) assert.equal(files.get(id).isTrashed(), true, files.get(id).getName());
  assert.equal(digerPdf.isTrashed(), false, 'TESTOGLU olmayan başvuruya dokunulmaz');
  assert.deepEqual(satirlar.map(r => r[1]), [diger]);
});

test('Kayıtlı imza dosyası bozuksa paket hata verir, imzasız belge e-postalanmaz; dosya yoksa eski davranış sürer', async () => {
  for (const icerik of ['{bozuk', JSON.stringify({ ercan: JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22' }) })]) {
    const { ctx, sent, files } = ortam();
    ctx.ihtidaKlasorGetir().createFile(ctx.Utilities.newBlob(icerik, 'application/json', 'sahit-imzalari.json'));
    ctx.ihtidaPaketKuyrugaAl(k.Referans);
    await ctx.ihtidaPaketIsle(k.Referans);
    const is = ctx.ihtidaPaketIsiOku(k.Referans);
    assert.equal(is.durum, 'hata'); assert.equal(is.pdfId, undefined); assert.equal(sent.length, 0);
    assert.ok(![...files.values()].some(f => /Ihtida Belge Paketi/.test(f.getName())));
  }
  const { ctx, sent, files } = ortam();   // dosya yok: özellik kurulmamış, ön başvuru eskisi gibi tek PDF
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'tamam'); assert.deepEqual(Array.from(is.sahitImzasi), []); assert.ok(!is.basvuranKopya);
  assert.equal(await sahitImzaSayisi(dosyaBayt(files, is.pdfId)), 0);
  assert.equal(sent.length, 3);
});

test('Başka camide kayıtlı yerel imza basılmaz ve başvuran nüshası ayrılmaz', async () => {
  const { ctx, sent, files } = ortam();
  imzalariKaydet(ctx);
  const namur = { ...k, 'Cami kimliği': 'namur-camii-namur', 'Başvuru camisi': 'Namur Camii', 'Cami şehri': 'Namur', 'Cami posta kodu': '5000', 'Cami adresi': 'Rue Denis Georges Bayar 13', 'Şahit 1': 'Rıdvan KAYAHAN', 'Şahit 2': 'Ercan MOLA' };
  ctx.ihtidaPaketKayit = () => ({ kayit: { ...namur } });
  ctx.ihtidaPaketKuyrugaAl(namur.Referans);
  await ctx.ihtidaPaketIsle(namur.Referans);
  const is = ctx.ihtidaPaketIsiOku(namur.Referans);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.deepEqual(Array.from(is.sahitImzasi), []); assert.ok(!is.basvuranKopya);
  assert.equal(await sahitImzaSayisi(dosyaBayt(files, is.pdfId)), 0);
  assert.equal(sent.length, 3);
});

test('Sağlık cevabı şahit imzası özelliğini bildirir; derleme ve herkese açık dosyalar imza içermez', () => {
  const { ctx } = ortam();
  assert.equal(ctx.doGet({ parameter: {} }).ihtidaSahitImzasi, true);
  assert.equal(ctx.doGet({ parameter: {} }).ihtidaSahitKendiImzasi, true);
  assert.equal(ctx.doGet({ parameter: {} }).ihtidaTekImza, true);
  // GAS paketi herkese açık kaynaklardan derlenir: sürüm 2 imza kaydı hiçbir yerde yer almaz (imzalar yalnız özel Drive'dadır).
  assert.ok(!source.includes('"v":2,"w":'), 'derlenmiş paket imza kaydı taşımaz');
  const gez = (dizin, bulunan = []) => {
    for (const ad of readdirSync(dizin, { withFileTypes: true })) {
      const yol = dizin + '/' + ad.name;
      if (ad.isDirectory()) gez(yol, bulunan);
      else if (/\.(js|mjs|json|svg|html|css|txt|md|xml|gs)$/.test(ad.name) && statSync(yol).size < 3e6 && readFileSync(yol, 'utf8').includes('"v":2,"w":')) bulunan.push(yol);
    }
    return bulunan;
  };
  assert.deepEqual(gez('public'), [], 'public/ altında şahit imza kaydı bulunmamalı');
});

// ---- 23 Ekim 2026 (Rıdvan KAYAHAN, kapsam genişletmesi): mühtedi kendi şahitlerini seçtiyse şahit imzasını formda kendisi atabilir ----
// Şahidin imzası ve rızası başvuruyla aynı özel klasörde «<ref> - sahit1-imza.png» (+ vektör) ve «<ref> - sahit-imza-riza.json» olarak durur.
// Bu imza şahidin kendi çizdiğidir: başvuran nüshasında da basılır (yalnız Ercan MOLA / Rıdvan KAYAHAN'ın kayıtlı imzaları saklanır).
const V1_SAHIT = JSON.stringify({ v: 1, w: 240, h: 80, k: 2.4, d: 'M12 55L40 30L70 18L100 22L140 40L180 52L224 58' });
const imzaPng = 'data:image/png;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><path d="M12 55L40 30L70 18L100 22L140 40" stroke="#123" stroke-width="4" fill="none"/></svg>')).png().toBuffer()).toString('base64');
/** Başvuru gövdesinden (doğrulanmış varsayılır) klasöre yazılan şahit imzası dosyaları + taban görseller; kayıt satırı şahit adlarıyla. */
function sahitliBasvuru(ctx, sahitler, { sahitSecimi = 'kendi' } = {}) {
  const klasor = ctx.ihtidaKlasorGetir();
  const ek = ctx.ihtidaSahitImzaGorselleri({ sahitSecimi, sahitler });
  const hata = ctx.ihtidaGorselleriKaydet(klasor, k.Referans, Object.assign({ vesikalik: image, kimlikOn: image, kimlikArka: image, imza: image }, ek));
  assert.deepEqual(Array.from(hata), []);
  ctx.ihtidaGorselleriOku = (kl, ref, h) => ctx.gercekGorselleriOku(kl, ref, h);   // gerçek okuma: yazılan dosyalar
  ctx.ihtidaPaketKayit = () => ({ kayit: { ...k, 'Şahit 1': sahitler[0].ad, 'Şahit 2': sahitler[1].ad } });
  return { klasor, ek };
}
const adlar = files => [...files.values()].map(f => f.getName());

test('Şahidin kendi imzası: başvuru dosyasına yazılır; ön başvuruda hem arşiv hem başvuran nüshasında basılır, kayıtlı imza yalnız dernek içi nüshada', async () => {
  const { ctx, sent, files } = ortam();
  imzalariKaydet(ctx);
  const { klasor } = sahitliBasvuru(ctx, [{ ad: 'Ali Örnek', imza: imzaPng, imzaVektor: V1_SAHIT, riza: true }, { ad: 'Ercan MOLA' }]);
  const ref = k.Referans;
  assert.deepEqual(adlar(files).filter(a => a.startsWith(ref + ' - ') && /sahit/.test(a)).sort(), [ref + ' - sahit-imza-riza.json', ref + ' - sahit1-imza-vektor.json', ref + ' - sahit1-imza.png'].sort(),
    'imza atmayan ikinci şahit için dosya yazılmaz');
  const g = ctx.gercekGorselleriOku(klasor, ref, []);
  assert.equal(g.sahit1Imza, imzaPng); assert.equal(g.sahit1ImzaVektor, V1_SAHIT); assert.equal(g.sahit2Imza, ''); assert.equal(g.sahit2ImzaVektor, '');
  const riza = JSON.parse(g.sahitRiza);
  assert.deepEqual({ ad: riza.sahit1.ad, riza: riza.sahit1.riza }, { ad: 'Ali Örnek', riza: true }); assert.equal(riza.sahit2, undefined);
  ctx.ihtidaPaketKuyrugaAl(ref);
  await ctx.ihtidaPaketIsle(ref);
  const is = ctx.ihtidaPaketIsiOku(ref);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.deepEqual(Array.from(is.sahitImzasi), ['ercan'], 'kayıtlı imza yalnız adı eşleşen Ercan MOLA için');
  assert.equal(is.basvuranKopya, 'hazir', 'kayıtlı imza var: başvuran nüshası ayrılır');
  const ana = dosyaBayt(files, is.pdfId), basvuran = dosyaBayt(files, is.basvuranPdfId);
  assert.equal(await sahitImzaSayisi(ana), 2, 'arşiv: Ali Örnek\'in kendi imzası + Ercan MOLA\'nın kayıtlı imzası');
  assert.equal(await sahitImzaSayisi(basvuran), 1, 'başvuran nüshası: yalnız şahidin kendi imzası; kayıtlı imza yok');
  assert.deepEqual(Buffer.from(sent[2].attachment[0].content, 'base64'), basvuran);
  // İmzalar iş dosyasında ve durum özetinde çoğaltılmaz.
  assert.ok(!ctx.ihtidaPaketIsDosyasi(ref).getBlob().getDataAsString('UTF-8').includes('M12 55L40 30'));
  assert.ok(!JSON.stringify(ctx.ihtidaPaketOzet(is)).includes('M12 55L40 30'));
  // Test temizliği: şahit imzası ve rıza dosyaları da başvuruyla birlikte çöpe gider.
  assert.ok(ctx.ihtidaRefIzleriniCopeAt(klasor, ref) >= 3);
  for (const f of files.values()) if (f.getName().startsWith(ref + ' - ')) assert.equal(f.isTrashed(), true, f.getName());
});

test('Şahidin kendi imzası: kayıtlı imza yoksa ikinci PDF ayrılmaz; iki şahit de imzalarsa ikisi de her nüshada; rıza kaydı yoksa hiçbiri basılmaz', async () => {
  // Kayıtlı imza hiç yüklenmemiş: başvuran nüshası ayrılmaz, aynı PDF herkese gider ve şahit imzaları içindedir.
  const a = ortam();
  sahitliBasvuru(a.ctx, [{ ad: 'Ali Örnek', imza: imzaPng, riza: true }, { ad: 'Veli Örnek', imza: imzaPng, imzaVektor: V1_SAHIT, riza: true }]);
  a.ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await a.ctx.ihtidaPaketIsle(k.Referans);
  const isA = a.ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(isA.durum, 'tamam', JSON.stringify(isA)); assert.ok(!isA.basvuranKopya); assert.equal(isA.basvuranPdfId, undefined);
  assert.equal(await sahitImzaSayisi(dosyaBayt(a.files, isA.pdfId)), 1, 'yalnız vektör sayılır (PNG görsel olarak gömülür): Veli Örnek');
  const doc = await PDFDocument.load(dosyaBayt(a.files, isA.pdfId));
  const x = doc.getPage(0).node.Resources().lookup(PDFName.of('XObject'));
  const gorsel = x ? x.keys().filter(n => doc.context.lookup(x.get(n))?.dict?.get(PDFName.of('Subtype'))?.toString() === '/Image').length : 0;
  assert.ok(gorsel >= 1, 'Ali Örnek\'in PNG imzası (vesikalıkla birlikte) gömülü');
  assert.equal(a.sent.length, 3); for (const p of a.sent) assert.deepEqual(Buffer.from(p.attachment[0].content, 'base64'), dosyaBayt(a.files, isA.pdfId));
  // Rıza kaydı yoksa (silinmiş) ya da kayıttaki ad değiştiyse şahit imzası basılmaz.
  const durumlar = [
    ['rıza kaydı yok', o => { for (const f of o.files.values()) if (f.getName().endsWith(' - sahit-imza-riza.json')) f.setTrashed(true); }],
    ['ad uyuşmuyor', o => { o.ctx.ihtidaPaketKayit = () => ({ kayit: { ...k, 'Şahit 1': 'Başka Kişi', 'Şahit 2': 'Veli Örnek' } }); }],
  ];
  for (const [neden, degis] of durumlar) {
    const b = ortam();
    sahitliBasvuru(b.ctx, [{ ad: 'Ali Örnek', imza: imzaPng, imzaVektor: V1_SAHIT, riza: true }, { ad: 'Veli Örnek' }]);
    degis(b);
    b.ctx.ihtidaPaketKuyrugaAl(k.Referans);
    await b.ctx.ihtidaPaketIsle(k.Referans);
    const is = b.ctx.ihtidaPaketIsiOku(k.Referans);
    assert.equal(is.durum, 'tamam', JSON.stringify(is));
    assert.equal(await sahitImzaSayisi(dosyaBayt(b.files, is.pdfId)), 0, neden + ': şahit imzası basılmaz');
  }
});

test('Son nüshada şahidin kendi imzası: işaretli gelir ve basılır; görevli işareti kaldırırsa ya da adı değiştirirse basılmaz; tek PDF gider', async () => {
  const { ctx, sent, files } = ortam();
  sahitliBasvuru(ctx, [{ ad: 'Ali Örnek', imza: imzaPng, imzaVektor: V1_SAHIT, riza: true }, { ad: 'Veli Örnek' }]);
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketIsle(k.Referans);
  assert.equal(ctx.ihtidaPaketIsiOku(k.Referans).durum, 'tamam');
  const onay = async (sahitler, anahtar) => {
    const hazirlik = { adSoyad: k['Adı Soyadı'], adres: k.Adres, ihtidaTarihi: '2026-09-08', beyanTarihi: '2026-09-09', belgeTuru: 'kimlik', sahitler };
    assert.equal(ctx.ihtidaPaketOnayDogrula(hazirlik), true);
    assert.equal(ctx.ihtidaPaketOnayIsle({ anahtar: PANEL, ref: k.Referans, hazirlik, islemAnahtari: anahtar }).ok, true);
    await ctx.ihtidaPaketIsle(k.Referans);
    const is = ctx.ihtidaPaketIsiOku(k.Referans);
    assert.equal(is.durum, 'tamam', JSON.stringify(is));
    assert.ok(!is.basvuranKopya, 'son nüshada ikinci PDF yok');
    return sahitImzaSayisi(dosyaBayt(files, is.pdfId));
  };
  assert.equal(await onay([{ ad: 'Ali Örnek', imza: '', imzaKullan: true }, { ad: 'Veli Örnek', imza: '', imzaKullan: true }], 'approval-kendi-1-2099'), 1, 'varsayılan: işaretli, kendi imza basılır');
  assert.equal(await onay([{ ad: 'Ali Örnek', imza: '', imzaKullan: false }, { ad: 'Veli Örnek', imza: '', imzaKullan: true }], 'approval-kendi-2-2099'), 0, 'görevli işareti kaldırdı');
  assert.equal(await onay([{ ad: 'Ali Örnek Jr.', imza: '', imzaKullan: true }, { ad: 'Veli Örnek', imza: '', imzaKullan: true }], 'approval-kendi-3-2099'), 0, 'ad değişti: başkasına basılmaz');
  assert.equal(await onay([{ ad: 'ali  ÖRNEK', imza: '', imzaKullan: true }, { ad: 'Veli Örnek', imza: '', imzaKullan: true }], 'approval-kendi-4-2099'), 1, 'yazım farkı (büyük/küçük harf, boşluk) eşleşmeyi bozmaz');
  assert.equal(sent.length, 3 * 5, 'her nüsha üç alıcıya gitti');
});
