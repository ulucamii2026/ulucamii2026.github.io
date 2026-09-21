/** Apps Script v33 — soyad büyük harfi (yerel-duyarlı), kayıt PDF dosya adı ve kayit-duzelt ucu (13 Eyl 2026 gecesi).
 *  Arka ucun SAF bölümü Node'da çalıştırılır; Sheets/Drive sahte nesnelerle taklit edilir. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v39.gs']
  .map(ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');

const ContentService = { createTextOutput: t => ({ setMimeType() { return this; }, getContent: () => t }), MimeType: { JSON: 'json' } };
function backend(ek = {}) {
  const ctx = vm.createContext({ console, ContentService, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) }, ...ek });
  vm.runInContext(source, ctx);
  return ctx;
}

test('soyadBuyuk: Türkçe kural yalnız tr dilde ya da Türkçe harf varsa', () => {
  const c = backend();
  assert.equal(c.soyadBuyuk('Husic', 'fr', 'fr'), 'HUSIC');          // Bosnalı aile, FR form → İ değil I
  assert.equal(c.soyadBuyuk('Halilovic', 'fr', 'fr'), 'HALILOVIC');
  assert.equal(c.soyadBuyuk('Irina', 'fr', 'fr'), 'IRINA');
  assert.equal(c.soyadBuyuk('Demir', 'tr', 'tr'), 'DEMİR');           // TR form → i → İ
  assert.equal(c.soyadBuyuk('Demir', 'fr', 'tr'), 'DEMİR');           // FR form ama iletişim dili TR
  assert.equal(c.soyadBuyuk('Çınar', 'fr', 'fr'), 'ÇINAR');           // Türkçe harf → tr kuralı (ı → I)
  assert.equal(c.soyadBuyuk('Yiğit', 'en', 'en'), 'YİĞİT');           // ğ var → i → İ
  assert.equal(c.soyadBuyuk('Işık', 'fr', 'fr'), 'IŞIK');
  assert.equal(c.soyadBuyuk('  Kaya ', 'fr', 'fr'), 'KAYA');
  assert.equal(c.soyadBuyuk(null, 'tr', 'tr'), '');
});

test('kayitDosyaAdi: "<ref> - <Ad> <SOYAD>.pdf" tek kaynak', () => {
  const c = backend();
  assert.equal(c.kayitDosyaAdi('UC-2026-0019', 'Irina', 'Halilovic', 'fr', 'fr'), 'UC-2026-0019 - Irina HALILOVIC.pdf');
  assert.equal(c.kayitDosyaAdi('UC-2026-0018', 'Albino Izet', 'Husic', 'fr', 'fr'), 'UC-2026-0018 - Albino Izet HUSIC.pdf');
  assert.equal(c.kayitDosyaAdi('UC-2026-0004', 'Muhammed Enes', 'Cinar', 'tr', 'tr'), 'UC-2026-0004 - Muhammed Enes CİNAR.pdf');
});

test('kayitDuzeltDogrula: alan kuralları', () => {
  const c = backend();
  assert.equal(c.kayitDuzeltDogrula('ad', 'Irina'), 'Irina');
  assert.equal(c.kayitDuzeltDogrula('soyad', "O'Brien-Şahin"), "O'Brien-Şahin");
  assert.equal(c.kayitDuzeltDogrula('ad', '<script>'), null);
  assert.equal(c.kayitDuzeltDogrula('ad', '123'), null);
  assert.equal(c.kayitDuzeltDogrula('dogum', '2018-04-22'), '2018-04-22');
  assert.equal(c.kayitDuzeltDogrula('dogum', '22.04.2018'), null);
  assert.equal(c.kayitDuzeltDogrula('sinif', 'P3'), 'P3');
  assert.equal(c.kayitDuzeltDogrula('okul', 'École communale de Rendeux (2e)'), 'École communale de Rendeux (2e)');
  assert.equal(c.kayitDuzeltDogrula('okul', ''), null);
  assert.equal(c.kayitDuzeltDogrula('ad', 'x'.repeat(81)), null);
});

// Sahte defter + Drive: tek satır, UC-2026-0019 ad/soyad ters.
function sahteOrtam() {
  const basliklar = ['Zaman damgası', 'Referans', 'Öğrenci soyadı', 'Öğrenci adı', 'Doğum tarihi', 'Cinsiyet', 'Okul', 'Sınıf', 'Kurs durumu',
    'Veli yakınlığı', 'Veli adı soyadı', 'Veli cep', 'Veli e-posta', 'Adres', 'Posta kodu', 'Şehir', 'İletişim dili', 'Acil kişi', 'Acil cep',
    'Sağlık notu', 'Sağlık rızası', 'Görüntü izni', 'Elektronik imza', 'Form dili', 'PDF bağlantısı', 'Durum', 'Gönderim anahtarı', 'Sosyal medya izni', 'Kimlik belgesi'];
  const satir = [new Date('2026-09-13T14:39:00Z'), 'UC-2026-0019', 'Irina', 'Halilovic', '2016-12-24', 'kiz', 'École communale de Rendeux', 'P4', 'yeni',
    'anne', 'Sevala', '+32491553295', 'v@example.test', 'Rue de Hotton 11', '6987', 'Rendeux', 'fr', 'Abdullah Alshaer', '+32465746029',
    '', '', 'Evet', 'Sevala', 'fr', 'https://drive.google.com/file/d/ESKI_PDF_ID_0123456789abcdef/view', 'Yeni kayıt | veli-kopyasi-gonderildi', 'anahtar', 'Evet', 'elden gösterilecek'];
  const yazilan = [], cop = [], olusan = [];
  const hucre = (r, c) => ({ setValue: v => { yazilan.push([r, c, v]); if (r === 2) satir[c - 1] = v; }, getValues: () => (r === 1 ? [basliklar] : [satir]) });
  const sayfa = {
    getLastRow: () => 2, getLastColumn: () => basliklar.length,
    getRange: (r, c, nr, nc) => (nr === undefined ? hucre(r, c) : { getValues: () => (r === 1 ? [basliklar] : [satir]) }),
  };
  const klasor = { getFilesByName: () => ({ hasNext: () => false }), createFile: blob => { olusan.push(blob.getName()); return { getId: () => 'YENI_PDF_ID', getUrl: () => 'https://drive.google.com/file/d/YENI_PDF_ID/view' }; } };
  const ctx = backend({
    SpreadsheetApp: { flush: () => {} },
    Utilities: { formatDate: (d, tz, bicim) => (bicim === 'yyyy-MM-dd' ? d.toISOString().slice(0, 10) : '13.09.2026 16:39'), newBlob: () => ({}) },
    DriveApp: { getFileById: id => ({ setTrashed: () => cop.push(id), isTrashed: () => false }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
  });
  ctx.kayitV2SayfaGetir = () => sayfa;
  ctx.klasorGetir = () => klasor;
  ctx.kayitImzaOku = () => '';
  ctx.kayitPdfUret = (veri, meta, ad) => ({ getName: () => ad, _veri: veri, _meta: meta });
  ctx.dosyayiIdIleCopeAt = id => { cop.push(id); return true; };
  ctx.panelYetkiTamam = e => e.parameter.anahtar === 'gizli';
  return { ctx, satir, yazilan, cop, olusan };
}

test('kayit-duzelt: ad/soyad düzeltir, PDF yeniler, eskiyi çöpe atar, Durum damgalar', () => {
  const { ctx, satir, cop, olusan } = sahteOrtam();
  const r = JSON.parse(ctx.doGet({ parameter: { islem: 'kayit-duzelt', anahtar: 'gizli', ref: 'UC-2026-0019', ad: 'Irina', soyad: 'Halilovic' } }).getContent());
  assert.equal(r.ok, true);
  assert.deepEqual(r.degisen, ['ad', 'soyad']);
  assert.deepEqual(r.eski, { ad: 'Halilovic', soyad: 'Irina' });
  assert.equal(r.pdf.ad, 'UC-2026-0019 - Irina HALILOVIC.pdf');
  assert.equal(olusan[0], 'UC-2026-0019 - Irina HALILOVIC.pdf');
  assert.deepEqual(cop, ['ESKI_PDF_ID_0123456789abcdef']);
  assert.equal(satir[3], 'Irina'); assert.equal(satir[2], 'Halilovic');
  assert.match(satir[25], /duzeltildi-v33 \[ad,soyad\]/);
  assert.equal(satir[24], 'https://drive.google.com/file/d/YENI_PDF_ID/view');
});

test('kayit-duzelt: yalnız pdf=1 → alan değişmez, PDF yenilenir; yetki, ref ve alan hataları', () => {
  const { ctx, olusan, yazilan } = sahteOrtam();
  const cagir = p => JSON.parse(ctx.doGet({ parameter: { islem: 'kayit-duzelt', anahtar: 'gizli', ...p } }).getContent());
  assert.equal(cagir({ ref: 'UC-2026-0019', pdf: '1' }).ok, true);
  assert.equal(olusan[0], 'UC-2026-0019 - Halilovic IRINA.pdf');          // veri değişmedi, ad tek kaynaktan
  assert.equal(yazilan.filter(y => y[2] === 'Halilovic' || y[2] === 'Irina').length, 0);
  assert.equal(cagir({ ref: 'UC-2026-0019' }).hata, 'degisiklik-yok');
  assert.equal(cagir({ ref: 'UC-2026-9999', ad: 'X' }).hata, 'bulunamadi');
  assert.equal(cagir({ ref: 'IH-2026-0001', ad: 'X' }).hata, 'ref-gecersiz');
  assert.equal(cagir({ ref: 'UC-2026-0019', dogum: '24.12.2016' }).hata, 'alan-gecersiz');
  assert.equal(JSON.parse(ctx.doGet({ parameter: { islem: 'kayit-duzelt', anahtar: 'yanlis', ref: 'UC-2026-0019', ad: 'X' } }).getContent()).hata, 'yetki');
});

test('Sağlık ucu v33 ve kayitDuzelt bayrağını bildirir', () => {
  const c = backend();
  c.VELI_PORTAL_SURUM = 'test';
  const h = JSON.parse(c.doGet({ parameter: {} }).getContent());
  assert.equal(h.surum, 39); assert.equal(h.kayitDuzelt, true); assert.equal(h.kayitImza, true);
});
