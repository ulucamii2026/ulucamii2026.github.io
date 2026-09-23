/** Apps Script v40 (23 Eyl 2026) — herkese açık kayıt/ihtida uçlarının sunucu tarafı hacim sınırı ve tuzak alanı.
 *
 *  Arka ucun SAF bölümü Node'da `vm` içinde çalıştırılır: defter (Sheets), Drive, Lock, Cache ve Utilities sahtedir;
 *  PDF, görsel, e-posta ve kuyruk işleri kaydedicilerle değiştirilir — ağ ve gerçek gönderim yoktur.
 *  Sınanan kurallar: 10 dakikada 10 yeni kayıt ("cok-sik"), günlük kayıt 60 / ihtida 20 ("gunluk-sinir"),
 *  aynı e-posta günde 3 ("eposta-gunluk-sinir"), aynı gonderimAnahtari ile yinelenen istek ASLA engellenmez/sayılmaz,
 *  dolu tuzak alan ("web") "bos-istek" ile hiçbir kayıt açmadan reddedilir, günlük satırında kişisel veri yoktur.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v40.gs']
  .map(ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');

const DAKIKA = 60 * 1000;
const brukselGunu = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** Sahte defter: satirlar[i] = BASLIKLAR dizisi uzunluğunda bir satır (1. sütun Date). */
function sahteDefter(sutunSayisi) {
  const satirlar = [];
  return {
    satirlar,
    getLastRow: () => satirlar.length + 1,
    getLastColumn: () => sutunSayisi,
    getRange: (r, c, nr, nc) => ({
      getValues: () => satirlar.slice(r - 2, r - 2 + nr).map(s => Array.from({ length: nc }, (_, j) => s[c - 1 + j] ?? '')),
    }),
    getParent: () => ({ getUrl: () => 'https://example.test/defter' }),
  };
}

/** ctx + kaydediciler. gunSabit=true iken son 26 saatteki her zaman damgası «bugün» sayılır (gece yarısına bağlı titreşim olmasın). */
function backend({ gunSabit = true } = {}) {
  const uyarilar = [];
  const sahteConsole = { log() {}, error() {}, info() {}, warn: (...a) => uyarilar.push(a.join(' ')) };
  const onbellek = new Map();
  const c = vm.createContext({ console: sahteConsole, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) } });
  vm.runInContext(source, c);
  c.json = x => x;
  c.console = sahteConsole;
  c.Utilities = {
    formatDate: (d, _tz, bicim) => bicim === 'yyyy-MM-dd' ? (gunSabit ? '2026-09-23' : brukselGunu(new Date(d))) : '23.09.2026 12:00',
  };
  c.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  c.CacheService = { getScriptCache: () => ({ get: k => onbellek.get(k) ?? null, put: (k, v) => { onbellek.set(k, v); } }) };
  c.SpreadsheetApp = { flush() {} };
  c.satirEkle = (sayfa, satir) => { sayfa.satirlar.push(satir); };
  let sira = 100;
  c.referansMaxBul = () => ++sira;
  c.v1SayfaBulTablo = () => null;
  const dosya = { getUrl: () => 'https://example.test/arsiv' };
  const eposta = [];
  c.epostaGonder = m => eposta.push(m);
  // Kayıt
  const kayitDefteri = sahteDefter(c.BASLIKLAR2.length);
  c.kayitV2SayfaGetir = () => kayitDefteri;
  c.klasorGetir = () => ({ createFile: () => dosya });
  c.kayitPdfUret = () => ({});
  c.kayitGorselleriKaydet = () => ({ hatalar: [], on: '', arka: '' });
  c.kayitImzaKaydet = () => true;
  c.kopyaGonderV2 = () => true;
  c.kayitDurumNotuEkle = () => {};
  // İhtida
  const ihtidaDefteri = sahteDefter(c.BASLIKLAR2_IHTIDA.length);
  c.ihtidaV2SayfaGetir = () => ihtidaDefteri;
  c.ihtidaKlasorGetir = () => ({ createFile: () => dosya });
  c.ihtidaCamiCoz = () => ({ id: 'ulucamii', ad: 'Ulu Camii', sehir: 'Marche-en-Famenne', postaKodu: '6900', adres: 'Adres', kurum: '' });
  c.pdfHtmlIhtida = () => '';
  c.htmlPdfUret = () => ({});
  c.ihtidaGorselleriKaydet = () => [];
  c.ihtidaPaketKuyrugaAl = () => {};
  c.ihtidaDefteriKirlet = () => {};
  // Doğrulama bu dosyanın konusu değil (kendi testleri var); tuzak alanın doğrulamadan ÖNCE çalıştığını saymak için sayılır.
  const dogrulama = { kayit: 0, ihtida: 0 };
  c.kayitDogrulaV2 = () => { dogrulama.kayit++; return { tamam: true }; };
  c.ihtidaDogrulaV2 = () => { dogrulama.ihtida++; return { tamam: true }; };
  return { c, uyarilar, kayitDefteri, ihtidaDefteri, eposta, dogrulama };
}

let anahtarSayaci = 0;
const yeniAnahtar = () => 'test-siniri-' + String(++anahtarSayaci).padStart(12, '0');

const kayitGovdesi = (ek = {}) => ({
  tur: 'kayit', sir: 'ULUCAMII-KAYIT-2026', formSurumu: 3, dil: 'tr', gonderimAnahtari: yeniAnahtar(),
  ogrenci: { ad: 'Ayşe', soyad: 'TESTOGLU', cinsiyet: 'kiz', dogumTarihi: '2017-03-15', okul: 'Okul', sinif: 'P3', kursDurumu: 'yeni' },
  veli: { yakinlik: 'anne', adSoyad: 'Deneme Veli', cep: '+32470123456', eposta: 'veli@example.test', adres: 'Rue 1', postaKodu: '6900', sehir: 'Marche', iletisimDili: 'tr' },
  acil: {}, saglik: { var: false }, goruntuIzni: false, goruntuSosyalIzni: false,
  kimlik: { yol: 'yukle' }, onay: { kurallar: true, gizlilik: true, elektronikImza: 'Deneme Veli', kimlikRiza: true },
  ...ek,
});
const ihtidaGovdesi = (ek = {}) => ({
  tur: 'ihtida', sir: 'ULUCAMII-IHTIDA-2026', dil: 'tr', gonderimAnahtari: yeniAnahtar(),
  basvuran: { adSoyad: 'Deniz Örnek', eposta: 'deniz@example.test' },
  sahitler: [{ ad: 'Birinci' }, { ad: 'İkinci' }], cami: 'ulucamii',
  onay: { acikRiza: true, beyan: 'Deniz Örnek', ek10Surumu: '2026-09-09' },
  ...ek,
});

/** Deftere geçmiş satır ekler: dakikaOnce = kaç dakika önce, eposta = e-posta sütununa yazılacak adres, anahtar/durum isteğe bağlı. */
function tohumla(c, tur, defter, adet, { dakikaOnce = 60, eposta = null, anahtar = '', durum = '' } = {}) {
  const basliklar = tur === 'kayit' ? c.BASLIKLAR2 : c.BASLIKLAR2_IHTIDA;
  const sutun = tur === 'kayit' ? c.SUTUN2 : c.SUTUN2_IHTIDA;
  const epostaIdx = basliklar.indexOf(tur === 'kayit' ? 'Veli e-posta' : 'E-posta');
  for (let i = 0; i < adet; i++) {
    const satir = new Array(basliklar.length).fill('');
    satir[0] = new Date(Date.now() - dakikaOnce * DAKIKA - i * 1000);
    satir[sutun.referans - 1] = (tur === 'kayit' ? 'UC' : 'IH') + '-2026-' + String(defter.satirlar.length + 1).padStart(4, '0');
    satir[epostaIdx] = eposta ?? `kisi${defter.satirlar.length}@example.test`;
    satir[sutun.durum - 1] = durum || 'Yeni';
    satir[sutun.anahtar - 1] = anahtar;
    defter.satirlar.push(satir);
  }
}

const cagir = (c, tur, v) => tur === 'kayit' ? c.kayitPostIsleV2(v) : c.ihtidaPostIsleV2(v);
const govdeOf = (tur, ek) => tur === 'kayit' ? kayitGovdesi(ek) : ihtidaGovdesi(ek);
const defterOf = (h, tur) => tur === 'kayit' ? h.kayitDefteri : h.ihtidaDefteri;

test('v40: sürüm, sağlık bayrağı ve sınır sayıları tek yapılandırmada', () => {
  const { c } = backend();
  assert.equal(c.SURUM, 40);
  c.ceviriMotoru = () => 'translate';
  assert.equal(c.doGet({}).basvuruSiniri, true);
  assert.deepEqual(JSON.parse(JSON.stringify(c.AYAR_BASVURU_SINIRI)), {
    kayit: { pencereDakika: 10, pencereSinir: 10, gunlukSinir: 60, epostaGunlukSinir: 3 },
    ihtida: { pencereDakika: 10, pencereSinir: 10, gunlukSinir: 20, epostaGunlukSinir: 3 },
  });
});

for (const tur of ['kayit', 'ihtida']) {
  test(`${tur}: 10 dakikada 10 yeni kayıttan sonra "cok-sik"; 9'da ve pencere dışında kabul`, () => {
    const h = backend(), defter = defterOf(h, tur);
    tohumla(h.c, tur, defter, 9, { dakikaOnce: 2 });
    tohumla(h.c, tur, defter, 5, { dakikaOnce: 11 }); // pencere dışı: sayılmaz
    const ilk = cagir(h.c, tur, govdeOf(tur));
    assert.equal(ilk.ok, true, '9 + 1 = 10. kayıt kabul');
    assert.equal(defter.satirlar.length, 15);
    const ikinci = cagir(h.c, tur, govdeOf(tur));
    assert.deepEqual({ ...ikinci }, { ok: false, hata: 'cok-sik' });
    assert.equal(defter.satirlar.length, 15, 'reddedilen istek satır açmaz');
  });

  const gunluk = tur === 'kayit' ? 60 : 20;
  test(`${tur}: günde ${gunluk} yeni kayıttan sonra "gunluk-sinir"`, () => {
    const h = backend(), defter = defterOf(h, tur);
    tohumla(h.c, tur, defter, gunluk - 1, { dakikaOnce: 30 });
    assert.equal(cagir(h.c, tur, govdeOf(tur)).ok, true, `${gunluk}. kayıt kabul`);
    const red = cagir(h.c, tur, govdeOf(tur));
    assert.equal(red.ok, false); assert.equal(red.hata, 'gunluk-sinir');
    assert.equal(defter.satirlar.length, gunluk);
    assert.equal(h.eposta.length, tur === 'kayit' ? 1 : 0, 'reddedilen istek e-posta göndermez');
  });

  test(`${tur}: aynı e-posta günde 3 kez; büyük/küçük harf ve boşluk farkı aynı adres sayılır`, () => {
    const h = backend(), defter = defterOf(h, tur);
    const alan = tur === 'kayit' ? 'veli' : 'basvuran';
    const adresli = adres => { const g = govdeOf(tur); g[alan] = { ...g[alan], eposta: adres }; return g; };
    tohumla(h.c, tur, defter, 2, { dakikaOnce: 40, eposta: ' Aile@Example.test ' });
    assert.equal(cagir(h.c, tur, adresli('aile@example.test')).ok, true, '3. kayıt kabul');
    const red = cagir(h.c, tur, adresli('AILE@example.TEST  '));
    assert.equal(red.ok, false); assert.equal(red.hata, 'eposta-gunluk-sinir');
    assert.equal(cagir(h.c, tur, adresli('baska@example.test')).ok, true, 'başka adres etkilenmez');
    // E-posta alanı boşsa adres denetimi atlanır (genel sınırlar sürer).
    tohumla(h.c, tur, defter, 3, { dakikaOnce: 50, eposta: '' });
    assert.equal(cagir(h.c, tur, adresli('')).ok, true, 'boş adres «aynı adres» sayılmaz');
    // Uyarı satırı kişisel veri taşımaz.
    assert.ok(h.uyarilar.length >= 1);
    for (const u of h.uyarilar) {
      assert.doesNotMatch(u, /@|example|Deneme|Deniz|TESTOGLU/i, 'günlükte e-posta/ad yok: ' + u);
    }
  });

  test(`${tur}: aynı gonderimAnahtari ile yinelenen istek sınır dolu olsa da engellenmez ve sayılmaz`, () => {
    const h = backend(), defter = defterOf(h, tur);
    const anahtar = yeniAnahtar();
    // Önce sınırı doldur: önceki gönderimin satırı + pencere dolu + günlük dolu + aynı adres dolu.
    tohumla(h.c, tur, defter, 1, { dakikaOnce: 1, anahtar, durum: 'Yeni kayıt | veli-kopyasi-gonderildi',
      eposta: tur === 'kayit' ? 'veli@example.test' : 'deniz@example.test' });
    tohumla(h.c, tur, defter, (tur === 'kayit' ? 60 : 20) + 10, { dakikaOnce: 3, eposta: tur === 'kayit' ? 'veli@example.test' : 'deniz@example.test' });
    const once = defter.satirlar.length;
    const yanit = cagir(h.c, tur, govdeOf(tur, { gonderimAnahtari: anahtar }));
    assert.equal(yanit.ok, true, 'tekrar yanıtı başarı döner');
    assert.equal(yanit.tekrar, true);
    assert.equal(yanit.ref, defter.satirlar[0][1]);
    assert.equal(defter.satirlar.length, once, 'yeni satır açılmaz');
    assert.equal(h.uyarilar.length, 0, 'tekrar hiçbir sınır uyarısı üretmez');
    // Yeni anahtar ise reddedilir (sınır gerçekten doludur).
    assert.equal(cagir(h.c, tur, govdeOf(tur)).ok, false);
  });

  test(`${tur}: dolu tuzak alan ("web") doğrulamadan önce "bos-istek" ile reddedilir; boş alan zarar vermez`, () => {
    const h = backend(), defter = defterOf(h, tur);
    for (const web of ['http://spam.example', '  x  ', 0]) {
      const red = cagir(h.c, tur, govdeOf(tur, { web }));
      assert.deepEqual({ ...red }, { ok: false, hata: 'bos-istek' });
    }
    assert.equal(defter.satirlar.length, 0);
    assert.equal(h.dogrulama[tur], 0, 'doğrulama ve defter hiç çalışmadı');
    assert.equal(h.eposta.length, 0);
    for (const u of h.uyarilar) assert.doesNotMatch(u, /spam|@/);
    assert.equal(cagir(h.c, tur, govdeOf(tur, { web: '' })).ok, true, 'boş tuzak alan gerçek kullanıcıyı engellemez');
    assert.equal(cagir(h.c, tur, govdeOf(tur)).ok, true, 'alan hiç gönderilmezse kabul (gerçek istemci göndermez)');
  });
}

test('Günlük sayım Brüksel gününe göre: gece yarısından önceki satırlar yeni günde sayılmaz', () => {
  const h = backend({ gunSabit: false });
  const d = h.c.BASLIKLAR2.indexOf('Veli e-posta') + 1;
  // 23 Eyl 2026 00:30 Brüksel (CEST, UTC+2) = 22 Eyl 22:30 UTC.
  const simdi = new Date('2026-09-22T22:30:00Z');
  const satir = (iso, eposta) => { const s = new Array(h.c.BASLIKLAR2.length).fill(''); s[0] = new Date(iso); s[d - 1] = eposta; return s; };
  for (let i = 0; i < 60; i++) h.kayitDefteri.satirlar.push(satir('2026-09-22T21:00:00Z', 'a@example.test')); // 22 Eyl 23:00 Brüksel
  assert.equal(h.c.basvuruSinirKodu('kayit', h.kayitDefteri, d, 'a@example.test', simdi), '', 'dünkü 60 satır bugünü doldurmaz');
  for (let i = 0; i < 3; i++) h.kayitDefteri.satirlar.push(satir('2026-09-22T22:05:00Z', 'a@example.test')); // 23 Eyl 00:05 Brüksel
  assert.equal(h.c.basvuruSinirKodu('kayit', h.kayitDefteri, d, 'a@example.test', simdi), 'eposta-gunluk-sinir');
  assert.equal(h.c.basvuruSinirKodu('kayit', h.kayitDefteri, d, 'b@example.test', simdi), '');
  assert.equal(h.c.basvuruSinirKodu('kayit', h.kayitDefteri, 0, 'a@example.test', simdi), '', 'e-posta sütunu yoksa adres denetimi atlanır');
  // Zaman damgası olmayan/bozuk (v1'den taşınmış metin) satırlar sayılmaz, hata da vermez.
  h.kayitDefteri.satirlar.push(satir('', 'a@example.test'));
  h.kayitDefteri.satirlar.push(['23.09.2026 00:10', '']);
  assert.equal(h.c.basvuruSinirKodu('kayit', h.kayitDefteri, d, 'c@example.test', simdi), '');
  assert.equal(h.c.basvuruSinirKodu('bilinmeyen', h.kayitDefteri, d, 'a@example.test', simdi), '', 'yapılandırmada olmayan tür sınırlanmaz');
});

test('doPost: kayıt ve ihtida sınır kodları yönlendiriciden aynen döner', () => {
  const h = backend();
  h.c.Utilities.newBlob = s => ({ getBytes: () => Buffer.from(s) });
  h.c.PropertiesService = { getScriptProperties: () => ({ getProperty: k => (k === 'IHTIDA_PAKET_KURULU' ? '28' : null) }) };
  h.c.IhtidaPdf = {};
  tohumla(h.c, 'kayit', h.kayitDefteri, 10, { dakikaOnce: 1 });
  tohumla(h.c, 'ihtida', h.ihtidaDefteri, 20, { dakikaOnce: 30 });
  const post = v => h.c.doPost({ postData: { contents: JSON.stringify(v) } });
  assert.equal(post(kayitGovdesi()).hata, 'cok-sik');
  assert.equal(post(ihtidaGovdesi()).hata, 'gunluk-sinir');
  assert.equal(post(kayitGovdesi({ web: 'x' })).hata, 'bos-istek');
});
