/** Kayıt formu — çizilen imza sözleşmesi (Apps Script v32, 13 Eyl 2026 akşamı).
 *  Arka ucun SAF bölümü Node'da çalıştırılır: kayitDogrulaV2 (imza/imzaYok kuralları) ve
 *  pdfHtmlKayit (imza alanı: PNG basılır / el yazısı ad / «kursta kalemle imzalar» notu). */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v34.gs']
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
  kimlik: { yol: 'elden', on: '', arka: '' },
  onay: { kurallar: true, gizlilik: true, saglikRiza: false, elektronikImza: 'annemarieisik', kimlikRiza: false },
  ...ek,
});

test('Sağlık ucu v32 ve kayitImza bayrağını bildirir', () => {
  const c = backend();
  assert.equal(c.SURUM, 34);
  assert.match(source, /kayitImza: true/);
});

test('Çizilen imza (PNG) ve «imza atamıyorum» kaçış kutusu sunucuda kabul edilir', () => {
  const c = backend();
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: false })).tamam, true, 'PNG + imzaYok=false');
  assert.equal(c.kayitDogrulaV2(govde({ imza: '', imzaYok: true })).tamam, true, 'boş + imzaYok=true');
  assert.equal(c.kayitDogrulaV2(govde()).tamam, true, 'eski istemci: iki alan da yok → imzasız kabul');
});

test('Eksik, fazla, JPEG ve bozuk imza gövdeleri reddedilir', () => {
  const c = backend();
  assert.equal(c.kayitDogrulaV2(govde({ imza: '', imzaYok: false })).kod, 'imza-gecersiz');
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: true })).kod, 'imza-fazla');
  assert.equal(c.kayitDogrulaV2(govde({ imza: JPEG, imzaYok: false })).kod, 'imza-gecersiz', 'yalnız PNG');
  assert.equal(c.kayitDogrulaV2(govde({ imza: PNG, imzaYok: 'hayir' })).kod, 'imza-yok-gecersiz');
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

test('PDF: imzasız gönderimde el yazısı ad + «kursta kalemle imzalar» notu; eski istemcide eski not', () => {
  const c = backend();
  const meta = { ref: 'UC-2026-9998', zaman: '13.09.2026 21:05', dil: 'fr' };
  const yok = c.pdfHtmlKayit(govde({ imza: '', imzaYok: true }), meta);
  assert.ok(!yok.includes('class="imza-gorsel"') && yok.includes('<span class="el">annemarieisik</span>'), 'el yazısı ad');
  assert.ok(yok.includes('kursta kalemle imzalayacağını bildirmiştir') && yok.includes('signera le document au stylo'), 'kaçış notu iki dilde');
  const eski = c.pdfHtmlKayit(govde(), meta);
  assert.ok(!eski.includes('class="imza-gorsel"') && !eski.includes('kalemle imzalayaca') && eski.includes('imza alanındaki ad, velinin forma yazdığı addır.'), 'eski istemci notu değişmedi');
});

test('PDF: imza özniteliğine yalnız beyaz listeli PNG veri URL\'i girer', () => {
  const c = backend();
  const meta = { ref: 'UC-2026-9997', zaman: '13.09.2026 21:06', dil: 'en' };
  for (const kotu of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,AAAA"onerror="alert(1)', 'javascript:alert(1)', 'https://x/y.png']) {
    const html = c.pdfHtmlKayit(govde({ imza: kotu, imzaYok: false }), meta);
    assert.ok(!html.includes('class="imza-gorsel"') && !html.includes(kotu), 'reddedildi: ' + kotu.slice(0, 30));
  }
});
