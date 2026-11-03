// «Ahde Vefa» Veda Programı arka ucu (scripts/apps-script/veda-davet/Kod.gs) — sahte Apps Script ortamında.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const KOD = readFileSync(new URL('../scripts/apps-script/veda-davet/Kod.gs', import.meta.url), 'utf8');
const ANAHTAR = 'test-liste-anahtari-0123456789abcdef';

function ortam(simdiIso = '2026-11-04T10:00:00+01:00') {
  const satirlar = [];
  const postalar = [];
  const ozellik = { LISTE_ANAHTARI: ANAHTAR };
  const sayfa = {
    getLastRow: () => satirlar.length + 1,
    getRange: (r, c, n, m) => ({
      getValues: () => satirlar.slice(r - 2, r - 2 + n),
      setValues() { return { setFontWeight() {} }; },
    }),
    appendRow: (s) => satirlar.push(s),
    setName() {}, setFrozenRows() {},
  };
  const gercekDate = Date;
  const sabit = gercekDate.parse(simdiIso);
  class SahteDate extends gercekDate {
    constructor(...a) { super(...(a.length ? a : [sabit])); }
    static now() { return sabit; }
  }
  const sandbox = {
    console, Date: SahteDate,
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (m) => ({ icerik: m, setMimeType() { return this; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => ozellik[k] ?? null, setProperty: (k, v) => { ozellik[k] = v; } }) },
    SpreadsheetApp: { create: () => ({ getSheets: () => [sayfa], getId: () => 'T1' }), openById: () => ({ getSheets: () => [sayfa] }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { formatDate: (d, _tz, f) => (f === 'yyyy-MM-dd' ? new gercekDate(d).toISOString().slice(0, 10) : '04.11.2026 10:00') },
    MailApp: { sendEmail: (o) => postalar.push(o) },
  };
  vm.createContext(sandbox);
  vm.runInContext(KOD, sandbox);
  const post = (nesne) => JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(nesne) } }).icerik);
  return { post, satirlar, postalar, get: () => JSON.parse(sandbox.doGet().icerik), sandbox };
}

const gecerli = (ek = {}) => ({ tur: 'veda', gonderimAnahtari: 'k-' + Math.random().toString(16).slice(2), ad: 'Ali Veli', kurum: 'Dernek A', gorev: 'Dernek başkanı', telefon: '+32 472 00 00 00', durum: 'katilacak', kisi: 3, web: '', ...ek });

test('geçerli kayıt deftere yazılır, e-posta düz metin ve doğru konuyla gider', () => {
  const o = ortam();
  assert.deepEqual(o.post(gecerli()), { ok: true });
  assert.equal(o.satirlar.length, 1);
  assert.equal(o.postalar.length, 1);
  assert.equal(o.postalar[0].to, 'rdvankayahan@gmail.com');
  assert.equal(o.postalar[0].subject, 'Veda programı — yeni katılım: Ali Veli');
  assert.match(o.postalar[0].body, /Katılacak toplam kişi: 3/);
  assert.match(o.postalar[0].body, /Kurum \/ dernek: Dernek A/);
  assert.equal(o.postalar[0].htmlBody, undefined);
});

test('geçersiz alanlar ve tuzak alan reddedilir', () => {
  const o = ortam();
  assert.equal(o.post(gecerli({ ad: 'A' })).alan, 'ad');
  assert.equal(o.post(gecerli({ kurum: '' })).alan, 'kurum');
  assert.equal(o.post(gecerli({ gorev: 'Hacker' })).alan, 'gorev');
  assert.equal(o.post(gecerli({ telefon: 'abc' })).alan, 'telefon');
  assert.equal(o.post(gecerli({ kisi: 11 })).alan, 'kisi');
  assert.equal(o.post(gecerli({ kisi: 0 })).alan, 'kisi');
  assert.equal(o.post(gecerli({ durum: 'belki' })).alan, 'durum');
  assert.equal(o.post(gecerli({ ad: 'x'.repeat(81) })).alan, 'ad');
  assert.equal(o.post(gecerli({ web: 'http://spam' })).hata, 'bos-istek');
  assert.equal(o.satirlar.length, 0);
  assert.equal(o.postalar.length, 0);
});

test('katılamayacak kayıtta kişi 0 olur; aynı gönderim anahtarı tek kez yazılır', () => {
  const o = ortam();
  const g = gecerli({ durum: 'katilamayacak', kisi: 5 });
  o.post(g);
  assert.equal(o.post(g).tekrar, true);
  assert.equal(o.satirlar.length, 1);
  assert.equal(o.satirlar[0][7], 0);
  assert.equal(o.postalar.length, 1);
});

test('formül biçimli girdi etkisizleştirilir', () => {
  const o = ortam();
  o.post(gecerli({ ad: '=IMPORTXML("x")', kurum: '+kurum' }));
  assert.ok(o.satirlar[0][2].startsWith("'="));
  assert.ok(o.satirlar[0][3].startsWith("'+"));
});

test('liste: yanlış anahtar reddedilir, doğru anahtarla toplamlar çıkar, tekrar eden ad+kurumda yalnız en yeni sayılır', () => {
  const o = ortam();
  o.post(gecerli({ ad: 'Ali Veli', kurum: 'Dernek A', kisi: 3 }));
  o.post(gecerli({ ad: 'Ayşe Kaya', kurum: 'Dernek B', kisi: 2 }));
  o.post(gecerli({ ad: 'ali veli', kurum: 'dernek a', kisi: 4 })); // güncelleme
  o.post(gecerli({ ad: 'Can Er', kurum: 'STK C', durum: 'katilamayacak' }));
  assert.equal(o.post({ tur: 'veda-liste', anahtar: 'yanlis' }).hata, 'yetki');
  assert.equal(o.post({ tur: 'veda-liste' }).hata, 'yetki');
  const l = o.post({ tur: 'veda-liste', anahtar: ANAHTAR });
  assert.equal(l.ok, true);
  assert.deepEqual({ ...l.toplam }, { katilacakKayit: 2, katilacakKisi: 6, katilamayacak: 1, toplamKayit: 4 });
  assert.equal(l.kayitlar.length, 4);
  assert.equal(l.kayitlar.filter((k) => !k.gecerli).length, 1);
});

test('form 7 Kasım 17.00 (Brüksel) sonrası kapanır', () => {
  const o = ortam('2026-11-07T17:00:01+01:00');
  assert.equal(o.post(gecerli()).hata, 'kapali');
  assert.equal(o.get().kapali, true);
  assert.equal(ortam('2026-11-07T11:59:00+01:00').get().kapali, false);
});

test('anahtar tanımlı değilse liste kapalıdır', () => {
  const o = ortam();
  o.sandbox.PropertiesService.getScriptProperties().setProperty('LISTE_ANAHTARI', '');
  assert.equal(o.post({ tur: 'veda-liste', anahtar: '' }).hata, 'yetki');
});

test('mesaj: isteğe bağlı, iki durumda da saklanır, e-postaya ve listeye girer, 600 sınırı ve formül koruması var', () => {
  const o = ortam();
  assert.equal(o.post(gecerli()).ok, true); // mesajsız
  assert.equal(o.satirlar[0][9], '');
  const m = 'Hayırlı olsun hocam.\nAllah yolunuzu açık etsin.';
  assert.equal(o.post(gecerli({ ad: 'Ayşe Kaya', kurum: 'Dernek B', durum: 'katilamayacak', mesaj: m })).ok, true);
  assert.equal(o.satirlar[1][9], m);
  assert.match(o.postalar[1].body, /Hocamıza mesaj: \nHayırlı olsun hocam\.\nAllah yolunuzu açık etsin\./);
  assert.match(o.postalar[0].body, /Hocamıza mesaj: —/);
  assert.equal(o.post(gecerli({ ad: 'Can Er', kurum: 'Dernek C', mesaj: 'x'.repeat(600) })).ok, true);
  assert.equal(o.post(gecerli({ ad: 'Can Er2', kurum: 'Dernek C', mesaj: 'x'.repeat(601) })).alan, 'mesaj');
  assert.equal(o.post(gecerli({ ad: 'Can Er3', kurum: 'Dernek C', mesaj: 5 })).alan, 'mesaj');
  o.post(gecerli({ ad: 'Eren Su', kurum: 'Dernek D', mesaj: '=HYPERLINK("http://x")' }));
  assert.ok(o.satirlar.at(-1)[9].startsWith("'="));
  const l = o.post({ tur: 'veda-liste', anahtar: ANAHTAR });
  assert.ok(l.kayitlar.some((k) => k.mesaj === m));
});
