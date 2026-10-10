/** Apps Script v42 — Mühtedi Hizmetleri Envanteri arka ucu (1 Ekim 2026): açık/kapalı kararı, doğrulama,
 *  iki sekmeli tablo, gizli satırın düşürülmesi, gövde sınırı, hacim sınırı, test temizliği, saklama.
 *
 *  Arka uç Node'da `vm` içinde çalışır: Sheets/Drive/Lock/Cache/Utilities sahtedir; UrlFetchApp, MailApp ve
 *  GmailApp HİÇ tanımlanmaz (canlı ağ ve gerçek gönderim imkânsız). Paket (`EnvanterVeri`) derleme betiğiyle
 *  aynı esbuild seçenekleriyle kurulur. Bütün kişi verileri uydurmadır; görevli soyadı TESTOGLU'dur.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';

const kok = new URL('../', import.meta.url);
const gs = ad => readFileSync(new URL('scripts/apps-script/' + ad, kok), 'utf8');
const json = yol => JSON.parse(readFileSync(new URL(yol, kok), 'utf8'));
// Derleme betiğindeki (scripts/ihtida-gas-derle.mjs) seçeneklerin aynısı.
const paket = buildSync({
  entryPoints: [fileURLToPath(new URL('src/lib/envanter/gas-giris.ts', kok))],
  bundle: true, write: false, format: 'iife', globalName: 'EnvanterVeri', target: 'es2020', minify: true,
}).outputFiles[0].text;

const kaynak = [
  gs('kimlik-sabitler.gs'), gs('veli-eposta-sablon.gs'), gs('ulucamii-Kod-v43.gs'),
  gs('veli-mail-listesi.gs'), gs('envanter-isleri.gs'), paket,
].join('\n;\n');

const PANEL = 'panel-gizli-anahtar';
const ACIK = JSON.stringify({ acik: 1, veriSorumlusu: 'Belçika Mühtedi Koordinatörlüğü (deneme)' });

/* ---------- Sahte Google altyapısı ---------- */

function sahteSayfa(ad, satirlar = [], { maxRows = 1000 } = {}) {
  let azami = Math.max(maxRows, satirlar.length), donuk = satirlar.length ? 1 : 0;
  const genislet = (r, n) => {
    while (satirlar.length < r) satirlar.push([]);
    const s = satirlar[r - 1];
    while (s.length < n) s.push('');
  };
  const sayfa = {
    _satirlar: satirlar,
    getName: () => ad,
    setName: y => { ad = y; return sayfa; },
    getLastRow: () => satirlar.length,
    getLastColumn: () => satirlar.reduce((n, s) => Math.max(n, s.length), 0),
    getMaxRows: () => azami,
    getFrozenRows: () => donuk,
    setFrozenRows: n => { donuk = n; return sayfa; },
    setColumnWidth: () => sayfa,
    insertRowsAfter: (_r, n) => { azami += n; return sayfa; },
    // Gerçek Sheets gibi: donmamış satırların TAMAMI silinemez.
    deleteRows: (r, n) => {
      if (azami - n <= donuk) throw new Error('Donmamış satırların tamamı silinemez');
      satirlar.splice(r - 1, n); azami -= n;
    },
    deleteRow: r => sayfa.deleteRows(r, 1),
    appendRow: d => { satirlar.push(d.slice()); azami = Math.max(azami, satirlar.length); },
    getRange(r, c, nr = 1, nc = 1) {
      const aralik = {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => {
          const v = (satirlar[r - 1 + i] || [])[c - 1 + j];
          return v === undefined ? '' : v;
        })),
        setValues(deger) {
          deger.forEach((s, i) => { genislet(r + i, c + s.length - 1); s.forEach((x, j) => { satirlar[r - 1 + i][c - 1 + j] = x; }); });
          azami = Math.max(azami, satirlar.length);
          return aralik;
        },
        setFontWeight: () => aralik,
      };
      return aralik;
    },
  };
  return sayfa;
}

function sahteTablo(id, sekmeler) {
  return {
    getId: () => id,
    getSheets: () => sekmeler,
    getSheetByName: ad => sekmeler.find(s => s.getName() === ad) || null,
    insertSheet: ad => { const s = sahteSayfa(ad); sekmeler.push(s); return s; },
  };
}

/** Brüksel yaz saati (UTC+2) — sahte ama yazma ile sınır denetimi aynı işlevi kullanır. */
function sahteFormatDate(d, _tz, bicim) {
  const t = new Date(d.getTime() + 2 * 3600 * 1000);
  const p = n => String(n).padStart(2, '0');
  const y = t.getUTCFullYear(), ay = p(t.getUTCMonth() + 1), g = p(t.getUTCDate());
  if (bicim === 'yyyy') return String(y);
  if (bicim === 'yyyy-MM-dd') return `${y}-${ay}-${g}`;
  return `${g}.${ay}.${y} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
}

function ortam({ ozellikler = {}, tablo = null } = {}) {
  const tablolar = new Map();
  let yaratilan = 0;
  const eposta = [];
  ozellikler = { PANEL_ANAHTARI: PANEL, ...ozellikler };
  if (tablo) { tablolar.set('SS-ENVANTER', sahteTablo('SS-ENVANTER', tablo)); ozellikler.ENVANTER_TABLO_ID = 'SS-ENVANTER'; }
  const onbellek = new Map();
  const ctx = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, getContent: () => t }), MimeType: { JSON: 'json' } },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => (k in ozellikler ? ozellikler[k] : null),
        setProperty: (k, d) => { ozellikler[k] = d; },
        deleteProperty: k => { delete ozellikler[k]; },
        getProperties: () => ({ ...ozellikler }),
      }),
    },
    SpreadsheetApp: {
      create() {
        yaratilan++;
        const id = 'SS-YENI-' + yaratilan;
        tablolar.set(id, sahteTablo(id, [sahteSayfa('Sayfa1')]));
        return tablolar.get(id);
      },
      openById(id) {
        if (!tablolar.has(id)) throw new Error('acilmadi: ' + id);
        return tablolar.get(id);
      },
      flush() {},
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: k => (onbellek.has(k) ? onbellek.get(k) : null), put: (k, d) => { onbellek.set(k, d); } }) },
    Utilities: { formatDate: sahteFormatDate, newBlob: s => ({ getBytes: () => Buffer.from(String(s), 'utf8') }), base64Encode: () => '' },
    DriveApp: { getFileById: () => ({}), getRootFolder: () => ({ removeFile() {} }) },
  });
  vm.runInContext(kaynak, ctx);
  ctx.ihtidaKlasorGetir = () => ({ getId: () => 'IHTIDA-KLASOR', addFile() {} });
  ctx.klasorGetir = () => { throw new Error('envanter tablosu kayıt klasörüne konmamalı'); };
  ctx.epostaGonder = s => { eposta.push(s); return { yol: 'sahte' }; };
  const post = govde => JSON.parse(ctx.doPost({ postData: { contents: typeof govde === 'string' ? govde : JSON.stringify(govde) } }).getContent());
  const get = parametre => JSON.parse(ctx.doGet({ parameter: parametre }).getContent());
  const tabloAc = () => (ozellikler.ENVANTER_TABLO_ID ? tablolar.get(ozellikler.ENVANTER_TABLO_ID) : null);
  return {
    ctx, ozellikler, onbellek, eposta, post, get,
    get yaratilan() { return yaratilan; },
    sekme: ad => tabloAc()?.getSheetByName(ad) ?? null,
  };
}

/* ---------- Gövde üreticileri (uydurma veri) ---------- */

let sayac = 0;
const anahtar = () => 'env-anahtar-' + String(++sayac).padStart(8, '0');

function kisi(ek = {}) {
  return { gizli: false, ad: 'Marie Dupont', telefon: '+32470000001', eposta: '', cinsiyet: 'kadin', dogumYili: 1990,
    dil: 'fr', ihtidaYili: '2025', belge: 'aldi', izin: true, ...ek };
}

function govde(ek = {}) {
  const { gorevli, ...kalan } = ek;
  return {
    tur: 'envanter', formSurumu: 1, onaySurumu: 'envanter-bilgilendirme-v1', dil: 'tr', gonderimAnahtari: anahtar(), web: '',
    onay: { bilgilendirme: true, izin: true },
    gorevli: { ad: 'Deniz TESTOGLU', bolge: 'Namur', cami: 'ulucamii-marche', statu: 'baokk', telefon: '+32470000000', eposta: '',
      diller: ['tr', 'fr'], ...(gorevli || {}) },
    sayilar: { ihtida: { '2026': { kadin: 2, erkek: 1 }, '2021-oncesi': { kadin: null, erkek: 3 } }, belge: { aldi: 4 }, yas: { '26-40': 3 }, dil: { fr: 5 } },
    kisiler: [],
    durum: { duzenliGelen: 2, konyaIsteyen: 1 },
    faaliyet: { dersSohbet: true, bulusmaIftar: true, materyal: 'Fransızca ilmihal' },
    gonullu: { kadin: 1, erkek: 2, kardesAile: 1 },
    aday: { a: { var: 'hayir' }, b: { secim: 'kendim' }, c: { cami: 'namur-camii-namur', gerekce: 'Merkezî konum' }, d: { irtibat: 'evet' } },
    belge: { var: 'evet', adet: 12, iletilebilir: 'evet' },
    gorus: 'Kısa bir görüş.',
    ...kalan,
  };
}

const satirNesnesi = (sekme, satir) => Object.fromEntries(sekme._satirlar[0].map((b, i) => [b, satir[i]]));
const acikOrtam = (ek = {}) => ortam({ ...ek, ozellikler: { ENVANTER_AYAR: ACIK, ...(ek.ozellikler || {}) } });

/* ---------- Bölge eşlemesi ---------- */

test('Bölge eşlemesi: 70 BDV camisi, 7 bölge; her kimlik katalogda; BİF ve liste dışı cami yok', () => {
  const harita = json('src/data/envanter-bolgeleri.json');
  const katalog = json('public/data/belcika-camileri.json').camiler;
  const kimlikler = Object.keys(harita);
  assert.equal(kimlikler.length, 70);
  for (const id of kimlikler) {
    const c = katalog.find(x => x.id === id);
    assert.ok(c, id + ' katalogda yok');
    assert.equal(c.kurum, 'BDV', id);
  }
  const sayim = {};
  for (const b of Object.values(harita)) sayim[b] = (sayim[b] || 0) + 1;
  assert.deepEqual(sayim, { Antwerpen: 12, 'Brüksel': 5, Charleroi: 10, Gent: 10, Limburg: 18, 'Liège': 10, Namur: 5 });
  assert.equal(harita['de-koepel-camii-borgerhout'], undefined, 'Müşavirlik listesinde olmayan cami eşlenmez');
  assert.equal(harita['merkez-camii-maasmechelen'], undefined);
  // Dosyada yalnız kimlik → bölge adı vardır (kişisel veri yok).
  assert.ok(Object.values(harita).every(b => typeof b === 'string' && b.length < 12));
  const o = ortam();
  assert.equal(o.ctx.EnvanterVeri.CAMILER.length, 70, 'paketteki cami tablosu eşlemeyle aynı');
});

/* ---------- Açık / kapalı ---------- */

test('Sağlık: ENVANTER_AYAR yoksa, bozuksa, acik 0 ise, veri sorumlusu boşsa ya da kapanış geçtiyse KAPALI', () => {
  const durum = ayar => ortam({ ozellikler: ayar === undefined ? {} : { ENVANTER_AYAR: ayar } }).get({}).envanter;
  assert.deepEqual(durum(undefined), { acik: false, veriSorumlusu: null, kapanis: null });
  assert.equal(durum('{bozuk').acik, false);
  assert.equal(durum(JSON.stringify({ acik: 0, veriSorumlusu: 'X' })).acik, false);
  assert.equal(durum(JSON.stringify({ acik: 1, veriSorumlusu: '   ' })).acik, false);
  assert.equal(durum(JSON.stringify({ acik: 1 })).acik, false);
  assert.equal(durum(JSON.stringify({ acik: 1, veriSorumlusu: 'X', kapanis: '2000-01-01' })).acik, false);
  assert.equal(durum(JSON.stringify({ acik: 1, veriSorumlusu: 'X', kapanis: '31.12.2099' })).acik, false, 'bozuk kapanış → kapalı');
  const acik = durum(JSON.stringify({ acik: 1, veriSorumlusu: ' Veri Sorumlusu ', kapanis: '2099-12-31', silme: '2100-01-30' }));
  assert.deepEqual(acik, { acik: true, veriSorumlusu: 'Veri Sorumlusu', kapanis: '2099-12-31' }, 'silme tarihi dışarı verilmez');
  const saglik = ortam().get({});
  assert.equal(saglik.surum, 43);
});

test('Kapalıyken POST "kapali"; tablo yaratılmaz, satır yazılmaz', () => {
  for (const ayar of [undefined, JSON.stringify({ acik: 1, veriSorumlusu: '' }), JSON.stringify({ acik: 1, veriSorumlusu: 'X', kapanis: '2000-01-01' })]) {
    const o = ortam({ ozellikler: ayar === undefined ? {} : { ENVANTER_AYAR: ayar } });
    const y = o.post(govde());
    assert.deepEqual(y, { ok: false, hata: 'kapali' });
    assert.equal(o.yaratilan, 0);
    assert.equal(o.ozellikler.ENVANTER_TABLO_ID, undefined);
  }
});

/* ---------- Geçerli gönderim ---------- */

test('Açıkken: bir Görevli + N Bildirim satırı; gizli satırda ad/telefon/e-posta DÜŞER; e-posta gönderilmez', () => {
  const o = acikOrtam();
  const g = govde({
    kisiler: [
      kisi({ gizli: true, kod: 'KOD-7', ad: 'Gizli Kisi Adi', telefon: '+32470999999', eposta: 'gizli@example.test' }),
      kisi({ ad: 'Jan Peeters', telefon: '', eposta: 'jan@example.test', cinsiyet: 'erkek', dil: 'nl', ihtidaYili: '2021-oncesi', belge: 'istiyor', dogumYili: '' }),
    ],
    aday: { a: { var: 'evet', ad: 'Aday TESTOGLU', telefon: '0470 00 00 02', neden: 'Tecrübeli', izin: true }, b: { secim: 'yok' }, c: { cami: 'namur-camii-namur' }, d: {} },
  });
  const y = o.post(g);
  assert.equal(y.ok, true, JSON.stringify(y));
  assert.match(y.ref, /^EV-\d{4}-0001$/);
  assert.equal(o.yaratilan, 1);
  assert.equal(o.ozellikler.ENVANTER_TABLO_ID, 'SS-YENI-1');
  const gorevli = o.sekme('Görevli'), bildirim = o.sekme('Bildirim');
  assert.ok(gorevli && bildirim, 'iki sekme');
  assert.equal(gorevli._satirlar.length, 2);
  assert.equal(bildirim._satirlar.length, 4, 'iki kişi + komisyon adayı');
  const gs1 = satirNesnesi(gorevli, gorevli._satirlar[1]);
  assert.equal(gs1['Referans'], y.ref);
  assert.equal(gs1['Gönderim anahtarı'], g.gonderimAnahtari);
  assert.equal(gs1['Onay sürümü'], 'envanter-bilgilendirme-v1');
  assert.equal(gs1['Cami kimliği'], 'ulucamii-marche');
  assert.equal(gs1['Cami adı'], 'Ulu Camii (Marche-en-Famenne)');
  assert.equal(gs1['İhtida 2026 — kadın'], '2');
  assert.equal(gs1['İhtida 2021 ve öncesi — kadın'], '', 'boş sayı boş kalır (0 yazılmaz)');
  assert.equal(gs1['Pilot cami önerisi'], 'Namur Camii (Namur)');
  assert.equal(gs1['Adlı bildirim sayısı'], '2');
  assert.equal(gs1['Gizli/kodlu bildirim sayısı'], '1');
  assert.equal(gs1['Komisyon adayı bildirildi'], 'E');
  const [gizli, acik, aday] = bildirim._satirlar.slice(1).map(s => satirNesnesi(bildirim, s));
  assert.equal(gizli['Satır türü'], 'bildirim');
  assert.equal(gizli['Gizli'], 'E');
  assert.equal(gizli['Kod'], 'KOD-7');
  assert.equal(gizli['Ad soyad'], '');
  assert.equal(gizli['Telefon'], '');
  assert.equal(gizli['E-posta'], '');
  assert.equal(gizli['İzin'], 'E');
  assert.equal(acik['Ad soyad'], 'Jan Peeters');
  assert.equal(acik['Belge durumu'], 'Almak istiyor');
  assert.equal(aday['Satır türü'], 'komisyon-adayi');
  assert.equal(aday['Telefon'], "'+32470000002", 'telefon E.164 ve formül önekiyle metin');
  const hepsi = JSON.stringify([gorevli._satirlar, bildirim._satirlar]);
  for (const sizinti of ['Gizli Kisi Adi', '+32470999999', 'gizli@example.test']) assert.ok(!hepsi.includes(sizinti), sizinti + ' tabloya yazılmamalı');
  assert.equal(o.eposta.length, 0, 'bu modül e-posta göndermez');
});

test('Aynı gönderim anahtarı: tekrar:true, aynı numara, ikinci satır yok; anahtarsız gövde reddedilir', () => {
  const o = acikOrtam();
  const g = govde({ kisiler: [kisi()] });
  const ilk = o.post(g);
  const ikinci = o.post(g);
  assert.equal(ikinci.ok, true);
  assert.equal(ikinci.tekrar, true);
  assert.equal(ikinci.ref, ilk.ref);
  assert.equal(o.sekme('Görevli')._satirlar.length, 2);
  assert.equal(o.sekme('Bildirim')._satirlar.length, 2);
  assert.equal(o.post(govde()).ref.slice(-4), '0002', 'yeni anahtar yeni numara alır');
  assert.equal(o.post(govde({ gonderimAnahtari: 'kisa' })).hata, 'anahtar-gecersiz');
});

test('Yarım kalmış önceki denemenin Bildirim satırları aynı anahtarla yeniden gönderimde çift yazılmaz', () => {
  const o = acikOrtam();
  const g = govde({ kisiler: [kisi(), kisi({ ad: 'Paul Martin', cinsiyet: 'erkek' })] });
  o.post(govde());                                  // tabloyu kur
  const bildirim = o.sekme('Bildirim');
  const basliklar = bildirim._satirlar[0];
  const yetim = basliklar.map(b => (b === 'Gönderim anahtarı' ? g.gonderimAnahtari : b === 'Görevli adı' ? 'Deniz TESTOGLU' : ''));
  bildirim._satirlar.push(yetim.slice(), yetim.slice());
  const y = o.post(g);
  assert.equal(y.ok, true);
  const bu = bildirim._satirlar.filter(s => s[basliklar.indexOf('Gönderim anahtarı')] === g.gonderimAnahtari);
  assert.equal(bu.length, 2, 'yetim satırlar silinip iki gerçek satır yazıldı');
  assert.ok(bu.every(s => s[basliklar.indexOf('Ad soyad')] !== ''));
});

/* ---------- Doğrulama ---------- */

test('Doğrulama: izinsiz satır, 40+ satır, onay, sürüm, cami/bölge, aday izni, sayı ve alan hataları reddedilir', () => {
  const o = acikOrtam();
  const kod = ek => o.post(govde(ek)).hata;
  assert.equal(kod({ kisiler: [kisi(), kisi({ izin: false })] }), 'kisi-izin-eksik');
  assert.equal(kod({ kisiler: [kisi({ izin: 'true' })] }), 'kisi-izin-eksik', 'izin yalnız boolean true');
  assert.equal(kod({ kisiler: Array.from({ length: 41 }, () => kisi()) }), 'kisi-sayisi');
  assert.equal(o.post(govde({ kisiler: Array.from({ length: 40 }, () => kisi()) })).ok, true, '40 satır kabul');
  assert.equal(kod({ onay: { bilgilendirme: true } }), 'onay-eksik');
  assert.equal(kod({ onaySurumu: 'eski' }), 'surum-gecersiz');
  assert.equal(kod({ formSurumu: 2 }), 'surum-gecersiz');
  assert.equal(kod({ gorevli: { bolge: 'Gent' } }), 'cami-gecersiz', 'cami başka bölgede');
  assert.equal(kod({ gorevli: { cami: 'yok-boyle-cami' } }), 'cami-gecersiz');
  assert.equal(kod({ gorevli: { cami: 'listede-yok' } }), 'gorevli-eksik', 'listede yoksa serbest ad zorunlu');
  assert.equal(o.post(govde({ gorevli: { cami: 'listede-yok', camiSerbest: 'Yeni Mescit (Arlon)' } })).ok, true);
  assert.equal(kod({ gorevli: { telefon: '', eposta: '' } }), 'gorevli-eksik');
  assert.equal(kod({ gorevli: { ad: '' } }), 'gorevli-eksik');
  assert.equal(kod({ gorevli: { statu: 'imam' } }), 'gorevli-eksik');
  assert.equal(kod({ kisiler: [kisi({ telefon: '', eposta: '' })] }), 'kisi-gecersiz', 'gizli değilse iletişim zorunlu');
  assert.equal(kod({ kisiler: [kisi({ gizli: true, kod: '', ad: '' })] }), 'kisi-gecersiz', 'gizli satırda kod zorunlu');
  assert.equal(o.post(govde({ kisiler: [kisi({ gizli: true, kod: 'K-1', ad: '', telefon: '' })] })).ok, true);
  assert.equal(kod({ kisiler: [kisi({ cinsiyet: '' })] }), 'kisi-gecersiz');
  assert.equal(kod({ kisiler: [kisi({ dogumYili: 1800 })] }), 'kisi-gecersiz');
  assert.equal(kod({ kisiler: [kisi({ ad: '=HYPERLINK("x")' })] }), 'kisi-gecersiz');
  assert.equal(kod({ kisiler: [kisi({ adres: 'Rue X 1' })] }) ?? 'kabul', 'kabul', 'bilinmeyen alan yok sayılır');
  assert.equal(kod({ aday: { a: { var: 'evet', ad: 'Aday Kisi', eposta: 'a@example.test', izin: false } } }), 'aday-izin-eksik');
  assert.equal(kod({ aday: { a: { var: 'evet', ad: 'Aday Kisi', izin: true } } }), 'aday-gecersiz');
  assert.equal(kod({ aday: { a: { var: 'hayir' }, c: { cami: 'fatih-camii-schaerbeek' } } }), 'aday-gecersiz', 'pilot cami görevlinin bölgesinden');
  assert.equal(kod({ sayilar: { ihtida: { '2026': { kadin: 1000 } } } }), 'sayi-gecersiz');
  assert.equal(kod({ sayilar: { yas: { '18-25': -1 } } }), 'sayi-gecersiz');
  assert.equal(kod({ durum: { duzenliGelen: '3a' } }), 'sayi-gecersiz');
  assert.equal(kod({ gorus: 'x'.repeat(1501) }), 'alan-gecersiz');
});

test('«evet» dışındaki 8a yanıtında aday alanları atılır; gizli değilse kod yazılmaz', () => {
  const o = acikOrtam();
  const y = o.post(govde({ aday: { a: { var: 'hayir', ad: 'Sizinti Adi', eposta: 's@example.test', izin: true } }, kisiler: [kisi({ kod: 'YAZILMAZ' })] }));
  assert.equal(y.ok, true);
  const hepsi = JSON.stringify([o.sekme('Görevli')._satirlar, o.sekme('Bildirim')._satirlar]);
  assert.ok(!hepsi.includes('Sizinti Adi'));
  assert.ok(!hepsi.includes('YAZILMAZ'));
  assert.equal(o.sekme('Bildirim')._satirlar.length, 2, 'yalnız bir bildirim satırı, aday satırı yok');
});

test('hucreGuvenli: «=» ile başlayan metin formül olarak çalışmaz', () => {
  const o = acikOrtam();
  assert.equal(o.post(govde({ gorus: '=IMPORTXML("http://x.test")', faaliyet: { materyal: '+SUM(A1)' } })).ok, true);
  const s = satirNesnesi(o.sekme('Görevli'), o.sekme('Görevli')._satirlar[1]);
  assert.equal(s['Görüş ve öneri'], "'=IMPORTXML(\"http://x.test\")");
  assert.equal(s['Materyal ve ihtiyaç'], "'+SUM(A1)");
});

test('Tuzak alan «web» doluysa bos-istek; kayıt açılmaz', () => {
  const o = acikOrtam();
  assert.equal(o.post(govde({ web: 'http://spam.test' })).hata, 'bos-istek');
  assert.equal(o.yaratilan, 0);
});

/* ---------- Gövde sınırı ve hacim ---------- */

test('Gövde sınırı: envanter 64 KiB\'a kadar geçer (~40 KB kabul), 64 KiB üstü ve diğer türler 20 KiB üstü reddedilir', () => {
  const o = acikOrtam();
  const buyuk = govde({ kisiler: Array.from({ length: 40 }, (_, i) => kisi({ ad: 'Çiğdem Öztürk' + 'ş'.repeat(i % 5) })), dolgu: 'ğ'.repeat(16000) });
  const bayt = Buffer.byteLength(JSON.stringify(buyuk));
  assert.ok(bayt > 35 * 1024 && bayt < 64 * 1024, 'deneme gövdesi ~40 KB: ' + bayt);
  assert.equal(o.post(buyuk).ok, true);
  const cokBuyuk = govde({ dolgu: 'ğ'.repeat(33 * 1024) });
  assert.ok(Buffer.byteLength(JSON.stringify(cokBuyuk)) > 64 * 1024);
  assert.equal(o.post(cokBuyuk).hata, 'cok-buyuk');
  assert.equal(o.post({ tur: 'seviye-sil', dolgu: 'x'.repeat(21 * 1024) }).hata, 'cok-buyuk');
  assert.equal(o.post({ tur: 'seviye', dolgu: 'ğ'.repeat(11 * 1024) }).hata, 'cok-buyuk', 'diğer türde sınır UTF-8 baytı 20 KiB');
});

test('Hacim sınırı: 10 dakikada 30 gönderimden sonra cok-sik; günde 200 sınırı; e-posta sayımı yok', () => {
  const o = acikOrtam();
  assert.deepEqual(JSON.parse(JSON.stringify(o.ctx.AYAR_BASVURU_SINIRI.envanter)), { pencereDakika: 10, pencereSinir: 30, gunlukSinir: 200 });
  for (let i = 0; i < 30; i++) assert.equal(o.post(govde()).ok, true, 'gönderim ' + (i + 1));
  assert.equal(o.post(govde()).hata, 'cok-sik');
  assert.equal(o.sekme('Görevli')._satirlar.length, 31);
  // Günlük sınır: sabit bir anda, aynı Brüksel gününde 10 dakikadan eski 200 satır.
  const simdi = new Date('2026-10-01T15:00:00Z');
  const satirlar = [['Zaman']];
  for (let i = 0; i < 200; i++) satirlar.push([new Date(simdi.getTime() - (20 + i) * 60 * 1000)]);
  const sayfa = sahteSayfa('Görevli', satirlar);
  assert.equal(o.ctx.basvuruSinirKodu('envanter', sayfa, 0, '', simdi), 'gunluk-sinir');
  satirlar.pop();
  assert.equal(o.ctx.basvuruSinirKodu('envanter', sayfa, 0, '', simdi), '');
});

/* ---------- Test temizliği ---------- */

function doluTablo() {
  const o = acikOrtam();
  o.post(govde({ kisiler: [kisi(), kisi({ gizli: true, kod: 'K-2', ad: '' })] }));                 // TESTOGLU
  o.post(govde({ gorevli: { ad: 'Ahmet Yılmaz' }, kisiler: [kisi({ ad: 'Luc Test' })] }));          // gerçek (uydurma)
  o.post(govde({ gorevli: { ad: 'Mehmet TESTOGLUOGLU' }, kisiler: [kisi()] }));                      // tam sözcük değil
  return o;
}

test('envanter-test-temizle: yetkisiz reddedilir; yalnız TESTOGLU görevli satırları iki sekmeden silinir; yineleme 0', () => {
  const o = doluTablo();
  assert.deepEqual(o.get({ islem: 'envanter-test-temizle' }), { ok: false, hata: 'yetki' });
  assert.deepEqual(o.get({ islem: 'envanter-test-temizle', anahtar: 'yanlis' }), { ok: false, hata: 'yetki' });
  assert.equal(o.sekme('Görevli')._satirlar.length, 4);
  assert.equal(o.sekme('Bildirim')._satirlar.length, 5);
  const y = o.get({ islem: 'envanter-test-temizle', anahtar: PANEL });
  assert.deepEqual(y, { ok: true, silinen: 3, gorevli: 1, bildirim: 2 });
  const adlar = s => s._satirlar.slice(1).map(r => r[s._satirlar[0].indexOf('Görevli adı')]);
  assert.deepEqual(adlar(o.sekme('Görevli')), ['Ahmet Yılmaz', 'Mehmet TESTOGLUOGLU']);
  assert.deepEqual(adlar(o.sekme('Bildirim')), ['Ahmet Yılmaz', 'Mehmet TESTOGLUOGLU']);
  assert.deepEqual(o.get({ islem: 'envanter-test-temizle', anahtar: PANEL }), { ok: true, silinen: 0, gorevli: 0, bildirim: 0 });
});

test('envanter-test-temizle: tablo yoksa yaratmaz (GET yan etkisiz)', () => {
  const o = ortam({ ozellikler: { ENVANTER_AYAR: ACIK } });
  assert.deepEqual(o.get({ islem: 'envanter-test-temizle', anahtar: PANEL }), { ok: true, silinen: 0, gorevli: 0, bildirim: 0 });
  assert.equal(o.yaratilan, 0);
  assert.equal(o.ozellikler.ENVANTER_TABLO_ID, undefined);
});

/* ---------- Saklama ---------- */

test('Saklama: silme günü geçince Bildirim başlık kalarak boşalır; Görevli 183 günden eski satırları silinir', () => {
  const simdi = Date.now();
  const gun = n => new Date(simdi - n * 86400000);
  const gorevli = sahteSayfa('Görevli', [['Zaman', 'Referans'], [gun(200), 'EV-2026-0001'], [gun(184), 'EV-2026-0002'], [gun(182), 'EV-2026-0003'], [gun(1), 'EV-2026-0004']]);
  // maxRows = satır sayısı: bütün veri satırları silinirken «donmamış satırın tamamı» korumasına takılmamalı.
  const bildirim = sahteSayfa('Bildirim', [['Zaman', 'Referans'], [gun(3), 'EV-2026-0003'], [gun(1), 'EV-2026-0004']], { maxRows: 3 });
  const o = ortam({ tablo: [gorevli, bildirim], ozellikler: { ENVANTER_AYAR: JSON.stringify({ acik: 0, veriSorumlusu: 'X', kapanis: '2000-01-01', silme: '2000-01-31' }) } });
  const sonuc = JSON.parse(JSON.stringify(o.ctx.envanterSaklamaTemizle()));
  assert.deepEqual(sonuc, { bildirim: 2, gorevli: 2 });
  assert.deepEqual(bildirim._satirlar, [['Zaman', 'Referans']], 'başlık kalır');
  assert.deepEqual(gorevli._satirlar.map(s => s[1]), ['Referans', 'EV-2026-0003', 'EV-2026-0004']);
});

test('Saklama: silme gelecekteyse Bildirim durur; silme yazılmamışsa kapanış + 30 gün kullanılır', () => {
  const bildirimSatirlari = () => [['Zaman'], [new Date()], [new Date()]];
  const dene = ayar => {
    const bildirim = sahteSayfa('Bildirim', bildirimSatirlari());
    const o = ortam({ tablo: [sahteSayfa('Görevli', [['Zaman']]), bildirim], ozellikler: { ENVANTER_AYAR: JSON.stringify(ayar) } });
    o.ctx.envanterSaklamaTemizle();
    return bildirim._satirlar.length - 1;
  };
  assert.equal(dene({ acik: 1, veriSorumlusu: 'X', kapanis: '2099-12-01', silme: '2099-12-31' }), 2);
  assert.equal(dene({ acik: 0, veriSorumlusu: 'X', kapanis: '2099-12-01' }), 2, 'kapanış + 30 gün gelmedi');
  assert.equal(dene({ acik: 0, veriSorumlusu: 'X', kapanis: '2000-01-01' }), 0, 'kapanış + 30 gün geçti');
  assert.equal(dene({ acik: 0 }), 2, 'tarih yoksa adlı bildirim kendiliğinden silinmez');
});

test('Zamanlı temizlik 6 saatte bir koşar; portal işi hata verse de (finally) çalışır; tablo yoksa hiçbir şey yaratmaz', () => {
  const bildirim = sahteSayfa('Bildirim', [['Zaman'], [new Date()]]);
  const ayar = JSON.stringify({ acik: 0, veriSorumlusu: 'X', silme: '2000-01-01' });
  const o = ortam({ tablo: [sahteSayfa('Görevli', [['Zaman']]), bildirim], ozellikler: { ENVANTER_AYAR: ayar } });
  // Portal (Firebase) bu ortamda erişilemez: veliMailListesiZamanli hata fırlatır, ama envanter temizliği yine koşar.
  assert.throws(() => o.ctx.veliMailListesiZamanli());
  assert.equal(bildirim._satirlar.length, 1);
  assert.equal(o.onbellek.get('envanter-temizlik'), '1');
  bildirim._satirlar.push([new Date()]);
  assert.equal(o.ctx.envanterZamanliTemizlik(), null, 'önbellek varken ikinci kez koşmaz');
  assert.equal(bildirim._satirlar.length, 2);
  const bos = ortam({ ozellikler: { ENVANTER_AYAR: ayar } });
  assert.deepEqual(JSON.parse(JSON.stringify(bos.ctx.envanterZamanliTemizlik())), { bildirim: 0, gorevli: 0 });
  assert.equal(bos.yaratilan, 0);
});

test('Paket ya da modül yoksa: sağlık kapalı, POST "kapali" (eski v42 öncesi parça listesiyle yüklenebilir)', () => {
  const ctx = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, getContent: () => t }), MimeType: { JSON: 'json' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k === 'ENVANTER_AYAR' ? ACIK : null), setProperty() {} }) },
    Utilities: { formatDate: sahteFormatDate, newBlob: s => ({ getBytes: () => Buffer.from(String(s), 'utf8') }) },
  });
  vm.runInContext([gs('kimlik-sabitler.gs'), gs('veli-eposta-sablon.gs'), gs('ulucamii-Kod-v43.gs')].join('\n;\n'), ctx);
  ctx.ceviriMotoru = () => 'yok';
  const saglik = JSON.parse(ctx.doGet({}).getContent());
  assert.deepEqual(saglik.envanter, { acik: false, veriSorumlusu: null, kapanis: null });
  assert.equal(JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(govde()) } }).getContent()).hata, 'kapali');
});
