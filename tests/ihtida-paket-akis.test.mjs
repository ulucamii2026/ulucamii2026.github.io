import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

execFileSync(process.execPath, ['scripts/ihtida-gas-derle.mjs'], { stdio: 'pipe' });
const source = readFileSync('.codex/cikti/gas/ulucamii-v28.gs', 'utf8');
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
    const id = 'file-test-identifier-' + ++seq;
    const f = { getId: () => id, getName: () => b.getName(), getUrl: () => 'https://drive.google.com/file/d/' + id + '/view', getBlob: () => b, isTrashed: () => false, getMimeType: () => b.getContentType(), getParents: () => iterator([{ getId: () => 'test-ihtida-folder' }]), setContent: text => { b = blob(text, 'application/json', b.getName()); } };
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

test('GAS ortamı tarayıcı/Node/timer olmadan gerçek altı sayfalık imzalı paketi üretir', async () => {
  const { ctx, sent, files, cells } = ortam();
  assert.equal(vm.runInContext('typeof setTimeout', ctx), 'undefined');
  assert.equal(vm.runInContext('typeof window', ctx), 'undefined');
  assert.equal(vm.runInContext('typeof Buffer', ctx), 'undefined');
  await ctx.IhtidaPdf.uret(k, ctx.ihtidaGorselleriOku(), null, ctx.ihtidaPaketKaynaklari(), ctx.PDFLib, ctx.fontkit);
  ctx.ihtidaPaketKuyrugaAl(k.Referans);
  await ctx.ihtidaPaketIsle(k.Referans);
  const is = ctx.ihtidaPaketIsiOku(k.Referans);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.equal(is.sayfa, 6);
  assert.deepEqual(sent.map(p => p.to[0].email), ['info@ulucamii.be', 'imam@ulucamii.be', 'deniz@example.test']);
  const bytes = Buffer.from(files.get(is.pdfId).getBlob().getBytes());
  for (const p of sent) {
    assert.deepEqual(Buffer.from(p.attachment[0].content, 'base64'), bytes);
    assert.equal(p.to.length, 1); assert.equal(p.cc, undefined);
  }
  assert.ok(cells.get('Tam paket PDF').includes(is.pdfId));
  assert.ok(cells.get('E-posta durumu').includes('Alıcı sunucusuna teslim edildi'));
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 6);
  writeFileSync('.codex/cikti/ihtida/gas-otomatik-paket.pdf', bytes);
  await ctx.ihtidaPaketIsle(k.Referans);
  assert.equal(sent.length, 3, 'Kuyruk tekrar çalışsa da üç e-posta tekrarlanmaz');
});

test('Eski kaydın EK-10 rızası yeni sürüme taşınmadan v1 şablonla korunur', async () => {
  const { ctx } = ortam();
  const eski = { ...k, 'EK-10 sürümü': '', 'İmza aktarım izni': '' };
  ctx.ihtidaPaketKayit = () => ({ kayit: eski });
  ctx.ihtidaPaketKuyrugaAl(eski.Referans);
  await ctx.ihtidaPaketIsle(eski.Referans);
  const is = ctx.ihtidaPaketIsiOku(eski.Referans);
  assert.equal(is.durum, 'tamam', JSON.stringify(is));
  assert.equal(is.sayfa, 6);
});

test('Büyük görselli başvuru 20 KB eski sınırına takılmaz; diğer formlar sınırsız büyümez', () => {
  const { ctx } = ortam();
  ctx.ihtidaPostIsleV2 = v => ({ ok: true, boyut: v.gorseller.length });
  const payload = { tur: 'ihtida', gorseller: 'A'.repeat(40000) };
  assert.equal(ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).ok, true);
  payload.tur = 'kayit';
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
