/** Kayıt formu — çizilen imza sözleşmesi (Apps Script v32, 13 Eyl 2026 akşamı).
 *  Arka ucun SAF bölümü Node'da çalıştırılır: kayitDogrulaV2 (imza/imzaYok kuralları) ve
 *  pdfHtmlKayit (imza alanı: PNG basılır / el yazısı ad / «kursta kalemle imzalar» notu). */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v38.gs']
  .map(ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');
function backend() {
  const ctx = vm.createContext({ console, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) } });
  vm.runInContext(source, ctx);
  return ctx;
}

// gorselGecerli: ≥ 400 karakter Base64, 4'ün katı, geçerli alfabe. Gerçek bir PNG olması gerekmez (saf doğrulama).
const PNG = 'data:image/png;base64,' + 'iVBORw0KGgo'.repeat(40).slice(0, 440);
const JPEG = 'data:image/jpeg;base64,' + '/9j/4AAQSkZJRg'.repeat(40).slice(0, 440);

const govde = (ek = {}) => ({
  tur: 'kayit', sir: 'ULUCAMII-KAYIT-2026', formSurumu: 3, dil: 'tr', gonderimAnahtari: 'test-kayit-imza-000000000000001',
  ogrenci: { ad: 'Ayşe', soyad: 'TESTOGLU', cinsiyet: 'kiz', dogumTarihi: '2017-03-15', okul: "École communale d'Aye", okulDiger: '', sinif: 'P3', kursDurumu: 'yeni' },
  veli: { yakinlik: 'anne', adSoyad: 'Anne-Marie Işık', cep: '+32470123456', eposta: 'v3@example.test', adres: 'Rue Exemple 12', postaKodu: '6990', sehir: 'Hotton', iletisimDili: 'tr' },
  acil: { adSoyad: '', cep: '' },
  saglik: { var: false, not: '' },
  goruntuIzni: false, goruntuSosyalIzni: false,
  kimlik: { yol: 'yukle', on: PNG, arka: '' },
  onay: { kurallar: true, gizlilik: true, saglikRiza: false, elektronikImza: 'annemarieisik', kimlikRiza: true },
  ...ek,
});

test('Sağlık ucu v32 ve kayitImza bayrağını bildirir', () => {
  const c = backend();
  assert.equal(c.SURUM, 38);
  assert.match(source, /kayitImza: true/);
});

test('Çizilen imza zorunlu; kaçış kutusu ve eski istemci kabul edilmez', () => {
  const c = backend();
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: false })).tamam, true, 'PNG + imzaYok=false');
  assert.equal(c.kayitDogrulaV2(govde({ imza: '', imzaYok: true })).kod, 'imza-gecersiz', 'boş + imzaYok=true');
  assert.equal(c.kayitDogrulaV2(govde()).kod, 'imza-gecersiz', 'eski istemci de imzasız kayıt olamaz');
});

test('Eksik, fazla, JPEG ve bozuk imza gövdeleri reddedilir', () => {
  const c = backend();
  assert.equal(c.kayitDogrulaV2(govde({ imza: '', imzaYok: false })).kod, 'imza-gecersiz');
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: true })).kod, 'imza-gecersiz');
  assert.equal(c.kayitDogrulaV2(govde({ imza: JPEG, imzaYok: false })).kod, 'imza-gecersiz', 'yalnız PNG');
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: 'hayir' })).kod, 'imza-gecersiz');
  assert.equal(c.kayitDogrulaV2(govde({ imza: 'data:image/png;base64,QUJD', imzaYok: false })).kod, 'imza-gecersiz', 'birkaç piksel');
  assert.equal(c.kayitDogrulaV2(govde({ imza: 'data:image/png;base64,' + 'A'.repeat(1.1 * 1024 * 1024 / 0.75 | 0).replace(/.{0,3}$/, ''), imzaYok: false })).kod, 'imza-gecersiz', '1 MB üstü');
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: false, onay: { ...govde().onay, elektronikImza: 'Başkası' } })).kod, 'onay-imza-eslesmiyor', 'yazılan ad denetimi sürer');
});

test('PDF: çizilen imza imza alanına PNG olarak basılır, altında velinin yazdığı ad', () => {
  const c = backend();
  const html = c.pdfHtmlKayit(govde({ imza: PNG, imzaYok: false }), { ref: 'UC-2026-9999', zaman: '13.09.2026 21:00', dil: 'tr' });
  assert.ok(html.includes('<img class="imza-gorsel" src="' + PNG + '"'), 'PNG veri URL\'i img olarak gömülü');
  assert.ok(html.includes('İmza (veli) — annemarieisik'), 'etiket + yazılan ad');
  assert.ok(html.includes('ekranda çizdiği imzadır'), 'TR not');
  assert.ok(html.includes('tracée à l’écran'), 'FR not');
  assert.ok(!html.includes('<span class="el">annemarieisik</span>'), 'el yazısı ad artık imza çizgisinde değil');
  assert.ok(html.includes('.imza-gorsel{display:block;max-height:54px'), 'CSS');
});

test('Eski imzasız PDF yeniden üretiminde ad imza gibi çizilmez; alan boş ve eksiklik açıktır', () => {
  const c = backend();
  for (const ek of [{}, { imza: '', imzaYok: true }]) {
    const html = c.pdfHtmlKayit(govde(ek), { ref: 'UC-2099-9998', zaman: '15.09.2026 18:00', dil: 'fr' });
    assert.ok(!html.includes('class="imza-gorsel"'));
    assert.ok(!html.includes('<span class="el">annemarieisik</span>'));
    assert.ok(html.includes('çizilmiş veli imzası kayıtlı değildir'));
    assert.ok(html.includes('aucune signature tracée'));
  }
});

test('Kimlik belgesi ve rıza zorunlu; eski istemci/sonra yolları eksik kaydı geçiremez', () => {
  const c = backend();
  const imza = { imza: PNG, imzaYok: false };
  for (const yol of ['elden', 'eposta', 'whatsapp']) {
    assert.equal(c.kayitDogrulaV2(govde({ ...imza, kimlik: { yol } })).kod, 'kimlik-yol-gecersiz');
  }
  assert.equal(c.kayitDogrulaV2(govde({ ...imza, formSurumu: 2, kimlik: undefined })).kod, 'kimlik-yol-gecersiz');
  assert.equal(c.kayitDogrulaV2(govde({ ...imza, kimlik: { yol: 'yukle', on: '' } })).kod, 'kimlik-on-gecersiz');
  assert.equal(c.kayitDogrulaV2(govde({ ...imza, onay: { ...govde().onay, kimlikRiza: false } })).kod, 'kimlikRiza');
  assert.equal(c.kayitDogrulaV2(govde({ ...imza, kimlik: { yol: 'yukle', on: PNG, arka: PNG } })).tamam, true);
});

test('PDF kimlik eki ön/arka görsellerini içerir; dış URL ve HTML enjekte edilemez', () => {
  const c = backend();
  const html = c.pdfHtmlKayit(govde({ imza: PNG, imzaYok: false, kimlik: { yol: 'yukle', on: PNG, arka: PNG } }), { ref: 'UC-2099-9999' });
  assert.equal((html.match(/class="kimlik-gorsel"/g) || []).length, 2);
  assert.ok(html.includes('page-break-before:always'));
  for (const value of ['https://example.test/card.png', 'data:image/png;base64,xx" onerror="alert(1)']) {
    assert.equal(c.kayitPdfKimlikEki({ kimlik: { on: value } }, 'UC-2099-9999'), '');
  }
});

test('PDF: imza özniteliğine yalnız beyaz listeli PNG veri URL\'i girer', () => {
  const c = backend();
  const meta = { ref: 'UC-2026-9997', zaman: '13.09.2026 21:06', dil: 'en' };
  for (const kotu of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,AAAA"onerror="alert(1)', 'javascript:alert(1)', 'https://x/y.png']) {
    const html = c.pdfHtmlKayit(govde({ imza: kotu, imzaYok: false }), meta);
    assert.ok(!html.includes('class="imza-gorsel"') && !html.includes(kotu), 'reddedildi: ' + kotu.slice(0, 30));
  }
});

test('Arşiv yenileme imza ve kimliği birlikte taşır; okuma hatasında durur', () => {
  const c = backend(), v = {};
  c.kayitGorselleriOku = () => ({ imza: PNG, on: PNG, arka: PNG });
  c.kayitPdfGorselleriniEkle(v, {}, 'UC-2099-9999');
  assert.equal(v.imza, PNG); assert.equal(v.kimlik.on, PNG); assert.equal(v.kimlik.arka, PNG);
  c.kayitGorselleriOku = (_folder, _ref, errors) => { errors.push({ neden: 'imza-okunamadi' }); return {}; };
  assert.throws(() => c.kayitPdfGorselleriniEkle({}, {}, 'UC-2099-9999'), /kayit-gorseli-okunamadi/);
});

test('Sunucunun kabul ettiği veri URL’leri PDF beyaz listesiyle aynı biçimde olmalı', () => {
  const c = backend(), satirli = PNG + '\n';
  assert.equal(c.kayitDogrulaV2(govde({ imza: satirli, imzaYok: false })).kod, 'imza-gecersiz');
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: false, kimlik: { yol: 'yukle', on: satirli } })).kod, 'kimlik-on-gecersiz');
});
