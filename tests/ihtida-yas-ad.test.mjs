/** İhtida formu — 12 Kasım 2026 iki değişikliği (Apps Script v48 + istemci).
 *  A) 18 yaşından küçükler yeni başvuru yapamaz (din görevlisi kararı): kural istemcide (src/lib/ihtida-yas.ts), sunucuda
 *     (ihtidaYasKontrol) ve panel uyarısında (ek9-hazirlik.js) aynı tabloyla sınanır; sunucu reddi ref ayırmadan, hiçbir şey
 *     yazmadan olur; beş dilde bilgi metni vardır.
 *  B) «Ad Soyad» iki alana bölündü: sunucu «Ad SOYAD» değerini tek yerde kurar; eski önbellekli sayfanın tek alanlı gövdesi kabul edilir.
 *  Ağ, Drive, Sheets ve e-posta yoktur: arka uç `vm` içinde, sahte servislerle çalışır. Kişiler TESTOGLU / .test adresleri. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { camiCoz } from '../public/admin/cami-secimi.js';
import { imzaVektorCoz } from '../public/admin/imza-ciz.js';
import { ihtidaYasUyarisi } from '../public/admin/ek9-hazirlik.js';
import { IHTIDA_ASGARI_YAS, brukselBugun, ihtidaYasDurumu, yasGunu } from '../src/lib/ihtida-yas.ts';
import { build } from 'esbuild';

// Dil dosyaları uzantısız içe aktarma kullanır (Astro/Vite çözer); Node için bellekte paketlenir, diske yazılmaz.
const paket = await build({ stdin: { contents: "export { tr } from './src/i18n/formlar/tr'; export { fr } from './src/i18n/formlar/fr'; export { en } from './src/i18n/formlar/en'; export { nl } from './src/i18n/formlar/nl'; export { de } from './src/i18n/formlar/de';", resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { tr, fr, en, nl, de } = await import('data:text/javascript;base64,' + Buffer.from(paket.outputFiles[0].text).toString('base64'));
const kaynak = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v48.gs']
  .map(ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const formMetinleri = dil => ({ tr, fr, en, nl, de })[dil];

const brukselFormat = (d, tz, bicim) => bicim === 'yyyy-MM-dd'
  ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : '12.11.2026 12:00';

/** simdiIso: arka ucun «şimdi» saati (UTC anı). Date, bu bağlamda sabitlenir. */
function arkaUc(simdiIso = '2026-11-12T10:00:00Z') {
  const sabit = new Date(simdiIso);
  const c = vm.createContext({ console, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) }, Utilities: { formatDate: brukselFormat } });
  vm.runInContext(kaynak, c);
  c.Date = class extends Date { constructor(...a) { if (a.length === 0) super(sabit.getTime()); else super(...a); } static now() { return sabit.getTime(); } };
  c.IhtidaPdf = { camiCoz, imzaVektorCoz };
  c.Utilities = { formatDate: brukselFormat };
  c.json = x => x;
  return c;
}

const govde = (ek = {}, basvuran = {}) => ({
  sir: 'ULUCAMII-IHTIDA-2026', dil: 'tr', gonderimAnahtari: 'test-yas-2099-0001',
  basvuran: { adSoyad: 'Deniz Testoglu', cinsiyet: 'kadin', dogumTarihi: '1990-05-20', dogumYeri: 'Namur', uyruk: 'Belçika', anneAdi: 'Anne', babaAdi: 'Baba', medeniHali: 'bekar', ogrenimDurumu: 'Lisans', meslek: 'Öğretmen', oncekiDin: 'Belirtilen inanç', eposta: 'deniz@example.test', telefon: '+32470000000', adres: 'Rue du Test 12, 6900, Marche-en-Famenne, Belçika', adresSokak: 'Rue du Test 12', postaKodu: '6900', sehir: 'Marche-en-Famenne', ulke: 'Belçika', torenDili: 'tr', ...basvuran },
  teslimat: { yontem: 'cami' }, sahitSecimi: 'cami', sahitler: [],
  fotografIzni: false, belgeTuru: 'pasaport', imzaYok: true,
  gorseller: { vesikalik: 'data:image/png;base64,' + 'A'.repeat(400), kimlikOn: 'data:image/png;base64,' + 'A'.repeat(400), kimlikArka: '', imza: '' },
  onay: { acikRiza: true, ek10: true, ek10Surumu: '2026-09-09', imzaAktarimIzni: false, gizlilik: true, gorselRiza: true, beyan: 'Deniz Testoglu' },
  ...ek,
});

/** Sahte servislerle POST işleyicisi; her yan etki sayılır. */
function postHazirla(simdiIso) {
  const c = arkaUc(simdiIso);
  const say = { ref: 0, satir: [], dosya: 0, pdf: [], eposta: 0, gorsel: 0, kuyruk: 0, klasor: 0, kilit: 0 };
  c.ihtidaKlasorGetir = () => { say.klasor++; return { createFile: () => { say.dosya++; return { getUrl: () => 'https://example.test/arsiv' }; } }; };
  c.ihtidaV2SayfaGetir = () => ({ getLastRow: () => 1, getLastColumn: () => c.BASLIKLAR2_IHTIDA.length, getParent: () => ({ getUrl: () => 'https://example.test/defter' }) });
  c.ihtidaV2AnahtarBul = () => null; c.ihtidaV2AnahtarKaydet = () => {};
  c.ihtidaPaketKuyrugaAl = () => { say.kuyruk++; }; c.ihtidaDefteriKirlet = () => {};
  c.v1SayfaBulTablo = () => null;
  c.referansMaxBul = () => { say.ref++; return 9999; };
  c.LockService = { getScriptLock: () => ({ waitLock() { say.kilit++; }, releaseLock() {} }) };
  c.htmlPdfUret = (_h, ad) => { say.pdf.push(ad); return {}; };
  c.ihtidaGorselleriKaydet = () => { say.gorsel++; return []; };
  c.satirEkle = (_s, satir) => { say.satir.push(satir); }; c.SpreadsheetApp = { flush() {} };
  c.epostaGonder = () => { say.eposta++; }; c.ihtidaKopyaGonderV2 = () => { say.eposta++; };
  c.basvuruSinirKodu = () => '';
  return { c, say };
}

// ---- A) yaş sınırı -------------------------------------------------------------------------------------------------------

/** [doğum, başvuru günü (Brussels), beklenen]; istemci, sunucu ve panel aynı tabloyu kullanır. */
const YAS_TABLOSU = [
  ['2008-11-12', '2026-11-12', 'tamam'],       // tam 18. yaş günü kabul
  ['2008-11-13', '2026-11-12', 'yas-siniri'],  // bir gün eksik ret
  ['2008-11-11', '2026-11-12', 'tamam'],
  ['2010-01-01', '2026-11-12', 'yas-siniri'],
  ['1990-05-20', '2026-11-12', 'tamam'],
  ['2008-02-29', '2026-02-28', 'yas-siniri'],  // 29 Şubat doğumlu: artık olmayan yılda 18'e 1 Mart'ta girer
  ['2008-02-29', '2026-03-01', 'tamam'],
  ['2004-02-29', '2022-02-28', 'yas-siniri'],
  ['2004-02-29', '2022-03-01', 'tamam'],
  ['2008-12-31', '2026-12-31', 'tamam'],
  ['2009-01-01', '2026-12-31', 'yas-siniri'],
];

test('Yaş kuralı: tam 18. yaş günü kabul, bir gün eksik ret, 29 Şubat 1 Mart\'ta (istemci ve sunucu aynı tablo)', () => {
  assert.equal(IHTIDA_ASGARI_YAS, 18);
  const c = arkaUc();
  assert.equal(c.IHTIDA_ASGARI_YAS, 18);
  for (const [dogum, bugun, beklenen] of YAS_TABLOSU) {
    assert.equal(ihtidaYasDurumu(dogum, bugun), beklenen, `istemci ${dogum} @ ${bugun}`);
    assert.equal(c.ihtidaYasKontrol(dogum, bugun), beklenen, `sunucu ${dogum} @ ${bugun}`);
    const uyari = ihtidaYasUyarisi({ 'Doğum tarihi': dogum, 'Zaman damgası': bugun.split('-').reverse().join('.') + ' 10:00' });
    assert.equal(uyari !== '', beklenen === 'yas-siniri', `panel ${dogum} @ ${bugun}`);
  }
  assert.equal(yasGunu('2008-02-29'), '2026-03-01');
  assert.equal(yasGunu('2008-05-20'), '2026-05-20');
});

test('Geçersiz, eksik ve gelecekteki doğum tarihi yaş sınırı sayılmaz; kendi koduyla reddedilir', () => {
  const c = arkaUc();
  for (const gecersiz of ['', '  ', 'abc', '2008-02-30', '2008-13-01', '12.11.2008', null, undefined]) {
    assert.equal(ihtidaYasDurumu(gecersiz, '2026-11-12'), 'format', String(gecersiz));
    assert.equal(c.ihtidaYasKontrol(gecersiz, '2026-11-12'), 'format', String(gecersiz));
    assert.equal(c.ihtidaDogrulaV2(govde({}, { dogumTarihi: gecersiz })).kod, 'basvuran-dogum-tarihi-gecersiz', String(gecersiz));
  }
  assert.equal(ihtidaYasDurumu('2027-01-01', '2026-11-12'), 'gelecek');
  assert.equal(c.ihtidaDogrulaV2(govde({}, { dogumTarihi: '2027-01-01' })).kod, 'basvuran-yas-disi');
  assert.equal(c.ihtidaDogrulaV2(govde({}, { dogumTarihi: '1890-01-01' })).kod, 'basvuran-yas-disi', '120 yaş üstü eskisi gibi reddedilir');
});

test('Brussels sınırı: UTC\'de hâlâ önceki gün olan gece yarısı sonrası başvuruda yaş Brussels gününe göre hesaplanır', () => {
  // 12 Kasım 2026 23:30 UTC = 13 Kasım 00:30 Brussels (kış saati, UTC+1); 18. yaş günü 13 Kasım olan kişi kabul edilir.
  const kis = new Date('2026-11-12T23:30:00Z');
  assert.equal(brukselBugun(kis), '2026-11-13');
  assert.equal(ihtidaYasDurumu('2008-11-13', brukselBugun(kis)), 'tamam');
  // Yaz saati (UTC+2): 30 Haziran 22:30 UTC = 1 Temmuz 00:30 Brussels.
  const yaz = new Date('2026-06-30T22:30:00Z');
  assert.equal(brukselBugun(yaz), '2026-07-01');
  assert.equal(ihtidaYasDurumu('2008-07-01', brukselBugun(yaz)), 'tamam');
  // Sunucu: aynı anlarda ihtidaDogrulaV2 (Date sabit, Utilities Brussels).
  assert.equal(arkaUc('2026-11-12T23:30:00Z').ihtidaDogrulaV2(govde({}, { dogumTarihi: '2008-11-13' })).tamam, true);
  assert.equal(arkaUc('2026-11-12T23:30:00Z').ihtidaDogrulaV2(govde({}, { dogumTarihi: '2008-11-14' })).kod, 'yas-siniri');
  assert.equal(arkaUc('2026-06-30T22:30:00Z').ihtidaDogrulaV2(govde({}, { dogumTarihi: '2008-07-01' })).tamam, true);
  // Gece yarısından hemen ÖNCE (Brussels 23:30 = 22:30 UTC): hâlâ 12 Kasım, ertesi gün doğanlar reddedilir.
  assert.equal(arkaUc('2026-11-12T22:30:00Z').ihtidaDogrulaV2(govde({}, { dogumTarihi: '2008-11-13' })).kod, 'yas-siniri');
});

test('Sunucu 18 yaşından küçüğü ref ayırmadan, hiçbir şey yazmadan reddeder', () => {
  const { c, say } = postHazirla();
  const sonuc = c.ihtidaPostIsleV2(govde({}, { dogumTarihi: '2008-11-13' }));
  assert.deepEqual(JSON.parse(JSON.stringify(sonuc)), { ok: false, hata: 'yas-siniri' });
  assert.deepEqual({ ...say, satir: say.satir.length, pdf: say.pdf.length }, { ref: 0, satir: 0, dosya: 0, pdf: 0, eposta: 0, gorsel: 0, kuyruk: 0, klasor: 0, kilit: 0 },
    'ref numarası harcanmadı; defter, Drive, PDF, e-posta, görsel, kuyruk ve kilit dokunulmadı');
  const bos = postHazirla(), gecersiz = bos.c.ihtidaPostIsleV2(govde({}, { dogumTarihi: '' }));
  assert.equal(gecersiz.hata, 'basvuran-dogum-tarihi-gecersiz');
  assert.equal(bos.say.ref + bos.say.satir.length + bos.say.dosya, 0);
});

test('Tam 18 yaşındaki başvuru kabul edilir ve ref ayrılır', () => {
  const { c, say } = postHazirla();
  const sonuc = c.ihtidaPostIsleV2(govde({}, { dogumTarihi: '2008-11-12' }));
  assert.equal(sonuc.ok, true);
  assert.match(sonuc.ref, /^IH-\d{4}-9999$/);
  assert.equal(say.ref, 1); assert.equal(say.satir.length, 1); assert.equal(say.kuyruk, 1);
});

test('Var olan kayıtlar yeniden doğrulanmaz: doğrulama yalnız yeni başvuru işleyicisinde çağrılır, belge üretimi yaşa bakmaz', () => {
  const adet = (kaynak.match(/ihtidaDogrulaV2\(/g) || []).length;
  assert.equal(adet, 2, 'tanım + ihtidaPostIsleV2 içindeki tek çağrı');
  assert.equal((kaynak.match(/ihtidaYasKontrol\(/g) || []).length, 2, 'tanım + ihtidaDogrulaV2 içindeki tek çağrı');
  // Defterde zaten duran 18 yaşından küçük bir kaydın PDF'i yine üretilir.
  const c = arkaUc();
  const v = govde({}, { dogumTarihi: '2012-03-04' });
  const html = c.pdfHtmlIhtida(v, { ref: 'IH-2026-0001', zaman: '12.11.2026 10:00', dil: 'tr' });
  assert.match(String(html), /Deniz Testoglu/);
});

test('Bilgi metni: beş dilde var, Türkçe ana metin birebir, iletişim yalnız info@ulucamii.be, yasak sözcük ve imam telefonu yok', () => {
  const tr = formMetinleri('tr').ihtida.kisi;
  assert.equal(tr.yasAltiBilgi, 'Bu çevrim içi başvuru 18 yaşını doldurmuş kişiler içindir. 18 yaşından küçükseniz başvurunuzu buradan alamıyoruz. Sorularınız için camimize gelebilir veya info@ulucamii.be adresine yazabilirsiniz; size memnuniyetle yardımcı oluruz.');
  const etiketler = { tr: ['Ad', 'Soyad'], fr: ['Prénom', 'Nom'], en: ['First name', 'Surname'], nl: ['Voornaam', 'Achternaam'], de: ['Vorname', 'Nachname'] };
  const gorulen = new Set();
  for (const dil of DILLER) {
    const k = formMetinleri(dil).ihtida.kisi;
    assert.deepEqual([k.ad, k.soyad], etiketler[dil], dil + ' etiketleri');
    for (const alan of ['yasAltiKisa', 'yasAltiBilgi']) assert.ok(typeof k[alan] === 'string' && k[alan].length > 20, `${dil}.${alan}`);
    assert.ok(k.yasAltiBilgi.startsWith(k.yasAltiKisa), dil + ': kısa metin bilgi metninin ilk cümlesidir');
    assert.match(k.yasAltiBilgi, /info@ulucamii\.be/);
    assert.doesNotMatch(k.yasAltiBilgi, /Müşavir|Büyükelçi|elçilik|konsolos|ambassad|consulat|embass|consulate|botschaft|konsulat|ambassade|\+\s?32|\d{3}\s?\d{2}\s?\d{2}/i, dil + ': yasak sözcük/telefon');
    assert.doesNotMatch(k.yasAltiBilgi, /Müslüman olam|devenir musulman|become (a )?Muslim|moslim worden|Muslim werden/i, dil + ': Müslüman olmayı engelleyen ima yok');
    gorulen.add(k.yasAltiBilgi);
  }
  assert.equal(gorulen.size, 5, 'her dilin metni ayrı');
  assert.match(formMetinleri('fr').ihtida.kisi.yasAltiBilgi, /vous/);
});

// ---- B) Ad ve soyad ---------------------------------------------------------------------------------------------------

test('Ad + soyad sunucuda tek yerde «Ad SOYAD» olarak birleşir (Türkçe harfler, Fransızca aksanlar, boşluklar)', () => {
  const tablo = [
    ['tr', 'Ayşe', 'yılmaz', 'Ayşe YILMAZ'],
    ['tr', 'Ali', 'ışık', 'Ali IŞIK'],            // ı → I
    ['tr', 'Mehmet', 'iyi', 'Mehmet İYİ'],        // i → İ (sayfa dili tr)
    ['tr', 'Öznur', 'üçgen', 'Öznur ÜÇGEN'],
    ['tr', 'Gül', 'çelik', 'Gül ÇELİK'],
    ['tr', 'Yağız', 'öğüt', 'Yağız ÖĞÜT'],        // ğ ö ü
    ['fr', 'Étienne', 'Dubois-Lefèvre', 'Étienne DUBOIS-LEFÈVRE'],
    ['fr', 'Zoë', 'Çelik', 'Zoë ÇELİK'],          // Türkçe harf taşıyan soyad → tr kuralı
    ['fr', 'Hélène', 'Husic', 'Hélène HUSIC'],    // i → I (Bosna soyadı, tr kuralı uygulanmaz)
    ['en', 'Jane', 'ilhan', 'Jane ILHAN'],
    ['nl', 'Jan', 'van den Berg', 'Jan VAN DEN BERG'],
    ['tr', '  Ayşe   Nur ', ' Yılmaz ', 'Ayşe Nur YILMAZ'],
  ];
  const c = arkaUc();
  for (const [dil, ad, soyad, beklenen] of tablo) {
    const v = govde({ dil }, { adSoyad: undefined, ad, soyad });
    delete v.basvuran.adSoyad;
    v.onay.beyan = beklenen;
    const sonuc = c.ihtidaDogrulaV2(v);
    assert.equal(sonuc.tamam, true, `${dil} ${ad} ${soyad}: ${sonuc.kod}`);
    assert.equal(v.basvuran.adSoyad, beklenen, `${dil} ${ad} ${soyad}`);
  }
});

test('Ad ve soyad: yalnız biri doluysa ya da çok uzunsa reddedilir; ikisi birden boşsa eski tek alan aranır', () => {
  const c = arkaUc();
  const dene = (basvuran) => { const v = govde(); delete v.basvuran.adSoyad; Object.assign(v.basvuran, basvuran); return c.ihtidaDogrulaV2(v).kod; };
  assert.equal(dene({ ad: 'Deniz' }), 'basvuran-adsoyad-eksik');
  assert.equal(dene({ soyad: 'Testoglu' }), 'basvuran-adsoyad-eksik');
  assert.equal(dene({ ad: 'Deniz', soyad: '   ' }), 'basvuran-adsoyad-eksik');
  assert.equal(dene({ ad: 'D'.repeat(51), soyad: 'Testoglu' }), 'basvuran-adsoyad-eksik');
  assert.equal(dene({}), 'basvuran-adsoyad-eksik', 'hiçbiri yok');
});

test('Eski önbellekli sayfanın yalnız adSoyad gönderen gövdesi aynen kabul edilir (geriye uyum)', () => {
  const c = arkaUc();
  const eski = govde();                                   // yalnız basvuran.adSoyad, ad/soyad yok
  assert.equal('ad' in eski.basvuran || 'soyad' in eski.basvuran, false);
  assert.equal(c.ihtidaDogrulaV2(eski).tamam, true);
  assert.equal(eski.basvuran.adSoyad, 'Deniz Testoglu', 'değer değiştirilmez, büyük harfe çevrilmez');
  // Eski gövde 18 yaş kuralına da tabidir.
  assert.equal(c.ihtidaDogrulaV2(govde({}, { dogumTarihi: '2015-01-01' })).kod, 'yas-siniri');
});

test('POST: yeni gövdede PDF adı, deftere yazılan «Adı Soyadı» ve beyan eşleşmesi birleşik değeri kullanır; eski gövde de çalışır', () => {
  for (const [ad, soyad, beklenen] of [['Ayşe', 'yılmaz', 'Ayşe YILMAZ'], [undefined, undefined, 'Deniz Testoglu']]) {
    const { c, say } = postHazirla();
    const v = govde({}, ad ? { ad, soyad } : {});
    if (ad) { delete v.basvuran.adSoyad; v.onay.beyan = 'Ayşe Yılmaz'; }
    const sonuc = c.ihtidaPostIsleV2(v);
    assert.equal(sonuc.ok, true, JSON.stringify(sonuc));
    assert.equal(say.satir[0][c.BASLIKLAR2_IHTIDA.indexOf('Adı Soyadı')], beklenen);
    assert.match(say.pdf[0], new RegExp(beklenen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.pdf$'));
  }
});

test('Defter sütunları değişmedi: başlık listesi ve «Adı Soyadı» konumu aynı', () => {
  const c = arkaUc();
  assert.equal(c.BASLIKLAR2_IHTIDA[2], 'Adı Soyadı');
  assert.equal(c.BASLIKLAR2_IHTIDA.includes('Ad'), false);
  assert.equal(c.BASLIKLAR2_IHTIDA.includes('Soyad'), false);
});

test('Form işaretlemesi: iki zorunlu alan, doğru autocomplete, eski ad alanı yok, beyan ad+soyadla eşleşir, sunucu en az v48', () => {
  const html = readFileSync(new URL('../src/components/formlar/IhtidaFormu.astro', import.meta.url), 'utf8');
  assert.match(html, /id="i-ad" name="basvuran\.ad" type="text" required[^>]*autocomplete="given-name"/);
  assert.match(html, /id="i-soyad" name="basvuran\.soyad" type="text" required[^>]*autocomplete="family-name"/);
  assert.doesNotMatch(html, /name="basvuran\.adSoyad"/);
  assert.match(html, /name="onay\.beyan"[^>]*data-esle="basvuran\.ad basvuran\.soyad"/);
  assert.match(html, /data-asgari-servis-surumu="48"/);
  assert.match(html, /name="sahit\.1"/, 'şahit adı alanı bölünmedi');
  assert.match(html, /id="i-yas-bilgi" role="status" aria-live="polite"/);
});
