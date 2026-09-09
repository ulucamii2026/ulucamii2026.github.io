import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const ana = readFileSync(new URL('../scripts/apps-script/ulucamii-Kod-v28.gs', import.meta.url), 'utf8');
const defter = readFileSync(new URL('../scripts/apps-script/ihtida-defteri-isleri.gs', import.meta.url), 'utf8');
const BASLIK = ['Zaman damgası', 'Referans', 'Adı Soyadı', 'Yeni isim tercihi', 'Şahit 1', 'Şahit 2', 'Cami kimliği', 'Başvuru camisi', 'Cami şehri', 'E-posta', 'Telefon', 'Adres'];
const satir = (ref, ad, cami = 'ulucamii-marche') => ['2026-09-09', ref, ad, 'Meryem', 'Şahit Bir', 'Şahit İki', cami, cami === 'ulucamii-marche' ? 'Ulu Camii' : 'Başka Cami', cami === 'ulucamii-marche' ? 'Marche-en-Famenne' : 'Namur', 'gizli@example.test', '+32470000000', 'Gizli adres'];

function ortam(veri = [satir('IH-2026-0001', 'Deniz Örnek'), satir('IH-2026-0002', 'Başka Cami Kişisi', 'namur-camii-namur'), satir('IH-2026-0003', 'TEST V1 - Gerçek başvuru değildir')]) {
  const props = new Map([['PANEL_ANAHTARI', 'panel-test']]), files = new Map(); let sequence = 0, patchSayisi = 0;
  const blob = (bytes, type = 'application/octet-stream', name = 'dosya') => {
    const b = Buffer.from(bytes);
    return { getBytes: () => [...b], getDataAsString: () => b.toString('utf8'), getContentType: () => type, getName: () => name };
  };
  const folder = {
    getId: () => 'gizli-defter-klasoru',
    getFilesByName: ad => { const xs = [...files.values()].filter(f => f.getName() === ad && !f.isTrashed()); return { hasNext: () => xs.length > 0, next: () => xs.shift() }; },
    createFile: b => { const id = 'file-' + (++sequence); let current = b; const f = { getId: () => id, getName: () => current.getName(), getBlob: () => current, isTrashed: () => false, setContent: x => { current = blob(x, 'application/json', current.getName()); }, _yaz: (x, tur) => { current = blob(x, tur, current.getName()); } }; files.set(id, f); return f; },
  };
  const sheet = {
    getLastRow: () => veri.length + 1, getLastColumn: () => BASLIK.length,
    getRange: (row, col, rows, cols) => ({ getValues: () => {
      const all = [BASLIK, ...veri]; return all.slice(row - 1, row - 1 + rows).map(r => r.slice(col - 1, col - 1 + cols));
    } }),
  };
  const ctx = vm.createContext({ console, Buffer, Date, JSON, RegExp, Object, String, Number, Array, Math, encodeURIComponent, PDFLib: {}, fontkit: {},
    Utilities: { newBlob: blob, base64Encode: x => Buffer.from(x).toString('base64'), formatDate: (_, __, format) => format === 'yyyy' ? '2026' : '2026-09-09' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props.get(k), setProperty: (k, v) => props.set(k, v), deleteProperty: k => props.delete(k), getProperties: () => Object.fromEntries(props) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create() {} }) }) }), getOAuthToken: () => 'token' },
    UrlFetchApp: { fetch: (url, opts) => { patchSayisi++; const id = String(url).match(/files\/([^?]+)/)?.[1], f = files.get(id); if (f) f._yaz(opts.payload, opts.contentType); return { getResponseCode: () => 200 }; } },
  });
  vm.runInContext(ana + '\n' + defter, ctx);
  ctx.json = x => x;
  ctx.ihtidaV2SayfaGetir = () => sheet;
  ctx.ihtidaDefteriKlasorGetir = () => folder;
  ctx.ihtidaPaketKaynaklari = () => ({});
  ctx.IhtidaDefteri = { pdfUret: model => Buffer.from('%PDF ' + model.kayitlar.length), docxUret: model => Buffer.from('DOCX ' + model.kayitlar.length) };
  return { ctx, props, files, getPatchSayisi: () => patchSayisi };
}

test('İhtida defteri yalnız Ulu Camii satırlarını taşır; bekleyen başvuru defter numarası almaz', () => {
  const { ctx } = ortam();
  const model = ctx.ihtidaDefteriModelOlustur();
  assert.equal(model.surum, 1); assert.equal(model.kayitlar.length, 1);
  const k = model.kayitlar[0];
  assert.equal(k.ref, 'IH-2026-0001'); assert.equal(k.durum, 'bekliyor'); assert.equal(k.defterNo, '');
  assert.equal('eposta' in k, false); assert.equal('telefon' in k, false); assert.equal('adres' in k, false);
});

test('Yetkili doğrulama gerçek tarih ve açık merasim onayı ister; sıra no idempotenttir', () => {
  const { ctx } = ortam([satir('IH-2026-0001', 'Deniz Örnek'), satir('IH-2026-0004', 'İkinci Örnek')]);
  ctx.ihtidaDefteriMetaYaz({ surum: 1, kayitlar: { eskiYil: { defterNo: 'UC-2025-0999' }, buYil: { defterNo: 'UC-2026-0007' } } });
  assert.equal(ctx.ihtidaDefteriGuncelle({ anahtar: 'yanlis', ref: 'IH-2026-0001', durum: 'tamamlandi', ihtidaTarihi: '2026-09-09' }).hata, 'yetki');
  assert.equal(ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0001', durum: 'tamamlandi' }).hata, 'ihtida-tarihi-zorunlu');
  assert.equal(ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0001', durum: 'tamamlandi', ihtidaTarihi: '2026-09-09' }).hata, 'merasim-dogrulamasi-zorunlu');
  assert.equal(ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0001', durum: 'tamamlandi', ihtidaTarihi: '2026-02-29', merasimDogrulandi: true }).hata, 'tarih-gecersiz');
  assert.equal(ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0001', durum: 'tamamlandi', ihtidaTarihi: '2026-09-10', merasimDogrulandi: true }).hata, 'tarih-gecersiz');
  assert.equal(ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0004', durum: 'musavirlikte', ihtidaTarihi: '2026-09-09' }).hata, 'tamamlanma-onayi-gerekli');
  const ilk = ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0001', durum: 'tamamlandi', ihtidaTarihi: '2026-09-09', merasimDogrulandi: true, ek9No: 'EK9-1', not: 'Tören tamamlandı.' });
  assert.equal(ilk.ok, true); assert.equal(ilk.kayit.defterNo, 'UC-2026-0008');
  const ikinci = ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0001', durum: 'musavirlikte', musavirlikGonderimTarihi: '2026-09-09' });
  assert.equal(ikinci.ok, true); assert.equal(ikinci.kayit.defterNo, 'UC-2026-0008');
  assert.equal(ikinci.kayit.ihtidaTarihi, '2026-09-09');
});

test('Tüm satırlar taranır, asenkron PDF ve aynı dosya kimliğiyle güncelleme çalışır', async () => {
  const veri = Array.from({ length: 501 }, (_, i) => satir('IH-2026-' + String(i + 1).padStart(4, '0'), 'Kişi ' + i));
  const { ctx, files, getPatchSayisi } = ortam(veri);
  assert.equal(ctx.ihtidaDefteriModelOlustur().kayitlar.length, 501);
  ctx.IhtidaDefteri.pdfUret = async model => Buffer.from('%PDF ' + model.kayitlar.length);
  await ctx.ihtidaDefteriKuyrukCalistir();
  assert.equal([...files.values()].filter(f => /ihtida-defteri\.(pdf|docx)$/.test(f.getName())).length, 2);
  const onceki = [...files.values()].filter(f => f.getName() === 'ihtida-defteri.pdf')[0].getId();
  await ctx.ihtidaDefteriKuyrukCalistir();
  assert.equal(getPatchSayisi(), 0, 'Kaynak özeti değişmemişse gereksiz medya yazımı olmaz');
  veri.push(satir('IH-2026-0502', 'Sonradan bulunan eski satır'));
  await ctx.ihtidaDefteriKuyrukCalistir();
  assert.equal([...files.values()].filter(f => f.getName() === 'ihtida-defteri.pdf')[0].getId(), onceki);
  assert.equal(getPatchSayisi(), 2, 'Kaynak değişimi dirty işareti olmadan da aynı Drive kimliklerinde medya güncellemesi yapar');
  assert.equal(ctx.ihtidaDefteriGetIsle({ parameter: { anahtar: 'yanlis' } }).hata, 'yetki');
  const indirme = ctx.ihtidaDefteriGetIsle({ parameter: { anahtar: 'panel-test', format: 'pdf' } });
  assert.equal(indirme.ok, true); assert.equal(indirme.mime, 'application/pdf'); assert.equal(Buffer.from(indirme.base64, 'base64').toString(), '%PDF 502');
});

test('Kirli işaret kaybolsa da değişen kaynak eski PDF olarak indirilmez', async () => {
  const veri = [satir('IH-2026-0001', 'Deniz Örnek')], { ctx, props } = ortam(veri);
  await ctx.ihtidaDefteriKuyrukCalistir();
  const tarih = ctx.ihtidaDefteriGetIsle({ parameter: { anahtar: 'panel-test' } }).defter.guncelleme;
  assert.ok(tarih);
  veri.push(satir('IH-2026-0004', 'Yeni Örnek'));
  assert.equal(props.get('IHTIDA_DEFTERI_DIRTY'), undefined);
  assert.equal(ctx.ihtidaDefteriGetIsle({ parameter: { anahtar: 'panel-test', format: 'pdf' } }).hata, 'guncelleniyor');
  assert.equal(ctx.ihtidaDefteriGetIsle({ parameter: { anahtar: 'panel-test' } }).defter.guncelleme, tarih);
});

test('Bozuk metadata ve yinelenen numara üzerine yazılmaz; 9999 sonrası numara sarmaz', () => {
  const { ctx, files } = ortam();
  ctx.ihtidaDefteriMetaYaz({ surum: 1, kayitlar: {} });
  const f = [...files.values()][0];
  f.setContent('{bozuk');
  assert.throws(() => ctx.ihtidaDefteriMetaOku(), /meta-bozuk/);
  assert.equal(ctx.ihtidaDefteriGuncelle({ anahtar: 'panel-test', ref: 'IH-2026-0001', durum: 'bekliyor' }).ok, false);
  assert.equal(f.getBlob().getDataAsString(), '{bozuk');
  f.setContent(JSON.stringify({ surum: 1, kayitlar: { bir: { defterNo: 'UC-2026-0001' }, iki: { defterNo: 'UC-2026-0001' } } }));
  assert.throws(() => ctx.ihtidaDefteriMetaOku(), /meta-bozuk/);
  assert.throws(() => ctx.ihtidaDefteriSonrakiNo({ kayitlar: { son: { defterNo: 'UC-2026-9999' } } }), /tukendi/);
});

test('Müşavirlik ve teslim tarihleri zorunludur; boş gönderim mevcut tarihi gizlice silemez', () => {
  const { ctx } = ortam();
  const base = { anahtar: 'panel-test', ref: 'IH-2026-0001' };
  assert.equal(ctx.ihtidaDefteriGuncelle({ ...base, durum: 'tamamlandi', ihtidaTarihi: '2026-09-08', merasimDogrulandi: true }).ok, true);
  assert.equal(ctx.ihtidaDefteriGuncelle({ ...base, durum: 'musavirlikte' }).hata, 'gonderim-tarihi-zorunlu');
  assert.equal(ctx.ihtidaDefteriGuncelle({ ...base, durum: 'teslim-edildi' }).hata, 'teslim-tarihi-zorunlu');
  assert.equal(ctx.ihtidaDefteriGuncelle({ ...base, durum: 'teslim-edildi', teslimTarihi: '2026-09-07' }).hata, 'tarih-sirasi-gecersiz');
  assert.equal(ctx.ihtidaDefteriGuncelle({ ...base, durum: 'musavirlikte', musavirlikGonderimTarihi: '2026-09-09' }).ok, true);
  assert.equal(ctx.ihtidaDefteriGuncelle({ ...base, durum: 'musavirlikte', musavirlikGonderimTarihi: '' }).hata, 'gonderim-tarihi-zorunlu');
  assert.equal(ctx.ihtidaDefteriGuncelle({ ...base, durum: 'iptal', ihtidaTarihi: '' }).hata, 'ihtida-tarihi-zorunlu');
  const iptal = ctx.ihtidaDefteriGuncelle({ ...base, durum: 'iptal' });
  assert.equal(iptal.ok, true); assert.equal(iptal.kayit.defterNo, 'UC-2026-0001');
});

test('Kuyruk kilitliyken başlamaz; ikinci dosya yazımı başarısızsa eski kopya açılmaz', async () => {
  const { ctx, props } = ortam();
  let uretim = 0, kilitAcildi = 0;
  ctx.LockService = { getScriptLock: () => ({ tryLock: () => false, releaseLock: () => { kilitAcildi++; } }) };
  ctx.IhtidaDefteri.pdfUret = async () => { uretim++; return Buffer.from('%PDF'); };
  await ctx.ihtidaDefteriKuyrukCalistir();
  assert.equal(uretim, 0); assert.equal(kilitAcildi, 0);
  ctx.LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => { kilitAcildi++; } }) };
  props.set('IHTIDA_DEFTERI_DIRTY', 'test');
  ctx.IhtidaDefteri.docxUret = () => { throw new Error('sentetik'); };
  ctx.console = { error() {} };
  await ctx.ihtidaDefteriKuyrukCalistir();
  assert.equal(props.get('IHTIDA_DEFTERI_DIRTY'), 'test'); assert.equal(kilitAcildi, 1);
  assert.equal(ctx.ihtidaDefteriGetIsle({ parameter: { anahtar: 'panel-test', format: 'pdf' } }).ok, false);
});
