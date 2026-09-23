/** Apps Script v38 — seviye tespit testi arka ucu (20 Eylül 2026): doğrulama, defter, günlük sınırlar,
 *  iki e-posta (mahremiyet kapıları), panel uçları, saklama temizliği.
 *
 *  Arka ucun SAF bölümü Node'da `vm` içinde çalıştırılır: Sheets/Drive/Lock/Cache/Utilities sahtedir,
 *  UrlFetchApp ve MailApp HİÇ tanımlanmaz (canlı ağ ve gerçek gönderim imkânsız) — `epostaGonder`
 *  bağlamda kaydediciyle değiştirilir. Beklentiler SORU BANKASINDAN türetilir; banka içeriği
 *  değiştiğinde test kendiliğinden uyar (kimlik ve cevap sabitleri yazılmaz).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import {
  MADDELER, EZBER, BEYAN, SORU_BANKASI_SURUMU, bankaPuanla,
} from '../src/lib/seviye-testi/index.ts';
import { PROFIL_DEGERLERI } from '../src/lib/seviye-testi/profil.ts';
import { SONUC_METINLERI } from '../src/lib/seviye-testi/metinler.ts';

const kok = new URL('../', import.meta.url);
const gs = ad => readFileSync(new URL('scripts/apps-script/' + ad, kok), 'utf8');
// Derleme betiğindeki (scripts/ihtida-gas-derle.mjs) seçeneklerin aynısı.
const seviyePaketi = buildSync({
  entryPoints: [fileURLToPath(new URL('src/lib/seviye-testi/gas-giris.ts', kok))],
  bundle: true, write: false, format: 'iife', globalName: 'SeviyeTesti', target: 'es2020', minify: true,
}).outputFiles[0].text;

const kaynak = [
  gs('kimlik-sabitler.gs'), gs('veli-eposta-sablon.gs'), gs('ulucamii-Kod-v40.gs'),
  gs('veli-mail-listesi.gs'), gs('seviye-testi-isleri.gs'), seviyePaketi,
].join('\n;\n');

const BASLIKLAR = ['Zaman', 'Referans', 'Ad Soyad', 'E-posta', 'Telefon', 'Test dili', 'Ders dili', 'Yaş aralığı', 'Cinsiyet',
  'Müslümanlık süresi', 'Önceki eğitim', 'Hedefler', 'Müsaitlik', 'Biçim', 'Not', "Kur'an düzeyi", 'Tecvid',
  "Kur'an bilgisi", 'İnanç', 'Namaz', 'İbadet', 'Siyer', 'Ahlak', 'Yüzdeler', 'Önerilen program',
  'Atlananlar', 'Ezberler', 'Beyanlar', 'Cevaplar', 'Süre (dk)', 'Banka sürümü', 'Rıza sürümü', 'Durum', 'Gönderim anahtarı',
  'Ülke', 'Şehir', 'En yakın Diyanet camisi', 'Camiyi biliyor', 'Görevliyi tanıyor', 'Ataşelik bilgisi', 'Yerel görevli onayı', 'Ataşelik onayı'];

/* ---------- Sahte Google altyapısı ---------- */

function sahteSayfa(satirlar = []) {
  const genislet = (r, n) => {
    while (satirlar.length < r) satirlar.push([]);
    const s = satirlar[r - 1];
    while (s.length < n) s.push('');
  };
  const sayfa = {
    _satirlar: satirlar,
    getLastRow: () => satirlar.length,
    getLastColumn: () => satirlar.reduce((n, s) => Math.max(n, s.length), 0),
    setFrozenRows: () => sayfa,
    setColumnWidth: () => sayfa,
    appendRow: d => { satirlar.push(d.slice()); },
    deleteRow: r => { satirlar.splice(r - 1, 1); },
    getRange(r, c, nr, nc) {
      const satirSayisi = nr === undefined ? 1 : nr;
      const sutunSayisi = nc === undefined ? 1 : nc;
      const aralik = {
        getValues: () => Array.from({ length: satirSayisi }, (_, i) =>
          Array.from({ length: sutunSayisi }, (_, j) => {
            const v = (satirlar[r - 1 + i] || [])[c - 1 + j];
            return v === undefined ? '' : v;
          })),
        getValue() { return this.getValues()[0][0]; },
        setValues(deger) {
          deger.forEach((s, i) => { genislet(r + i, c + s.length - 1); s.forEach((x, j) => { satirlar[r - 1 + i][c - 1 + j] = x; }); });
          return aralik;
        },
        setValue(x) { genislet(r, c); satirlar[r - 1][c - 1] = x; return aralik; },
        setFontWeight: () => aralik, setBackground: () => aralik, setFontColor: () => aralik,
      };
      return aralik;
    },
  };
  return sayfa;
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

function ortam({ ozellikler = {}, seviyeSatirlari = null } = {}) {
  const gonderilen = [];
  const defterler = new Map();
  let yaratilan = 0;
  if (seviyeSatirlari) {
    defterler.set('SS-SEVIYE', sahteSayfa([BASLIKLAR.slice(), ...seviyeSatirlari]));
    ozellikler = { SEVIYE_TABLO_ID: 'SS-SEVIYE', ...ozellikler };
  }
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
      create(ad) {
        yaratilan++;
        const id = 'SS-YENI-' + yaratilan;
        defterler.set(id, sahteSayfa());
        return { getId: () => id, getName: () => ad, getSheets: () => [defterler.get(id)] };
      },
      openById(id) {
        if (!defterler.has(id)) throw new Error('acilmadi: ' + id);
        return { getId: () => id, getSheets: () => [defterler.get(id)] };
      },
      flush() {},
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    CacheService: {
      getScriptCache: () => ({
        get: k => (onbellek.has(k) ? onbellek.get(k) : null),
        put: (k, d) => { onbellek.set(k, d); },
      }),
    },
    Utilities: { formatDate: sahteFormatDate, newBlob: s => ({ getBytes: () => Buffer.from(String(s), 'utf8') }), base64Encode: () => '' },
    DriveApp: {
      getFileById: () => ({}),
      getRootFolder: () => ({ removeFile() {} }),
      getFoldersByName: () => ({ hasNext: () => false }),
      createFolder: () => ({ getId: () => 'KLASOR', addFile() {} }),
    },
  });
  vm.runInContext(kaynak, ctx);
  ctx.klasorGetir = () => ({ getId: () => 'KLASOR', addFile() {} });
  ctx.epostaGonder = s => { gonderilen.push(s); return { yol: 'sahte' }; };
  const post = govde => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(govde) } }).getContent());
  const get = parametre => JSON.parse(ctx.doGet({ parameter: parametre }).getContent());
  return {
    ctx, gonderilen, ozellikler, post, get, onbellek,
    get yaratilanDefter() { return yaratilan; },
    seviyeSayfa: () => (ozellikler.SEVIYE_TABLO_ID ? defterler.get(ozellikler.SEVIYE_TABLO_ID) : null),
    defterEkle: (id, sayfa) => defterler.set(id, sayfa),
  };
}

/* ---------- Bankadan türetilen geçerli gövde ---------- */

const puanliMaddeler = MADDELER.filter(m => !m.emekli);
const cevapUret = kip => {
  const c = {};
  puanliMaddeler.forEach((m, i) => {
    if (kip === 'dogru') c[m.id] = m.dogru;
    else if (kip === 'bilmiyorum') c[m.id] = -1;
    else c[m.id] = i % 3 === 0 ? m.dogru : (m.dogru + 1) % m.siklar.length;
  });
  return c;
};

const ilk = alan => PROFIL_DEGERLERI[alan][0];
function govdeUret(ek = {}) {
  const { profil, ...kalan } = ek;
  return {
    tur: 'seviye', sir: 'ULUCAMII-SEVIYE-2026', formSurumu: 1, dil: 'tr',
    gonderimAnahtari: 'anahtar-0000000001', bankaSurumu: SORU_BANKASI_SURUMU, rizaSurumu: '2026-09-20',
    profil: {
      adSoyad: 'Deniz TESTOGLU', eposta: 'deniz@example.test', telefon: '+32400000000', // uydurma numara
      yasAraligi: ilk('yasAraligi'), cinsiyet: ilk('cinsiyet'), muslumanlik: ilk('muslumanlik'),
      oncekiEgitim: ilk('oncekiEgitim'), hedefler: [ilk('hedefler')], dersDili: 'tr',
      gunler: [ilk('gunler')], dilim: [ilk('dilim')], bicim: ilk('bicim'),
      not: 'Cumartesi sabahları uygunum, bilgi: https://x.test/sayfa **kalın**',
      ...(profil || {}),
    },
    onay: { yas18: true, riza: true }, atla: {},
    cevaplar: cevapUret('karisik'),
    ezber: Object.fromEntries(EZBER.map((e, i) => [e.id, i % 3])),
    beyan: Object.fromEntries(BEYAN.map(b => [b.id, 0])),
    meta: { sureSn: 1500 },
    ...kalan,
  };
}

const satirNesnesi = satir => Object.fromEntries(BASLIKLAR.map((b, i) => [b, satir[i]]));

/* ---------- Testler ---------- */

test('seviyeDogrula: her doğrulama kodu ayrı ayrı çıkar; geçerli gövde geçer', () => {
  const o = ortam();
  const dene = ek => o.post(govdeUret(ek)).hata;
  assert.equal(dene({ sir: 'YANLIS' }), 'yetkisiz');
  assert.equal(dene({ formSurumu: 3 }), 'form-surumu-gecersiz');
  assert.equal(dene({ dil: 'es' }), 'dil-gecersiz');
  for (const dil of ['nl', 'de']) assert.equal(ortam().post(govdeUret({ dil })).ok, true, dil + ': site dili kabul edilir');
  assert.equal(dene({ gonderimAnahtari: 'kisa' }), 'anahtar-gecersiz');
  assert.equal(dene({ onay: { riza: true } }), 'onay-yas-eksik');
  assert.equal(dene({ onay: { yas18: true } }), 'onay-riza-eksik');
  assert.equal(dene({ rizaSurumu: '' }), 'riza-surumu-gecersiz');
  assert.equal(dene({ rizaSurumu: 'x'.repeat(21) }), 'riza-surumu-gecersiz');
  assert.equal(dene({ bankaSurumu: 'bir' }), 'banka-surumu-gecersiz');
  assert.equal(dene({ profil: { adSoyad: '' } }), 'ad-gecersiz');
  assert.equal(dene({ profil: { adSoyad: '<script>' } }), 'ad-gecersiz');
  assert.equal(dene({ profil: { adSoyad: 'Ali 12' } }), 'ad-gecersiz');
  assert.equal(dene({ profil: { adSoyad: 'a@b.test' } }), 'ad-gecersiz');
  assert.equal(dene({ profil: { adSoyad: 'A'.repeat(121) } }), 'ad-gecersiz');
  assert.equal(dene({ profil: { eposta: 'deniz(at)example.test' } }), 'eposta-gecersiz');
  assert.equal(dene({ profil: { telefon: '0470 11 22 33' } }), 'telefon-gecersiz');
  assert.equal(dene({ profil: { yasAraligi: 'cok-genc' } }), 'profil-yasAraligi-gecersiz');
  assert.equal(dene({ profil: { bicim: null } }), 'profil-bicim-gecersiz');
  assert.equal(dene({ profil: { hedefler: 'namaz' } }), 'profil-hedefler-gecersiz');
  assert.equal(dene({ profil: { hedefler: [ilk('hedefler'), ilk('hedefler')] } }), 'profil-hedefler-gecersiz');
  assert.equal(dene({ profil: { gunler: ['pazartesi'] } }), 'profil-gunler-gecersiz');
  assert.equal(dene({ profil: { not: 'n'.repeat(501) } }), 'not-uzun');
  assert.equal(dene({ atla: { bilinmeyen: true } }), 'atla-gecersiz');
  assert.equal(dene({ atla: { okuma: 'evet' } }), 'atla-gecersiz');
  assert.equal(dene({ cevaplar: 'yok' }), 'cevaplar-gecersiz');
  assert.equal(dene({ cevaplar: { yokBoyleMadde: 0 } }), 'madde-bilinmiyor');
  assert.equal(dene({ cevaplar: { [puanliMaddeler[0].id]: 99 } }), 'cevap-gecersiz');
  assert.equal(dene({ ezber: { [EZBER[0].id]: 3 } }), 'ezber-gecersiz');
  assert.equal(dene({ ezber: { yokBoyleEzber: 1 } }), 'ezber-gecersiz');
  assert.equal(dene({ beyan: { [BEYAN[0].id]: BEYAN[0].secenekler.length } }), 'beyan-gecersiz');
  assert.equal(dene({ beyan: { yokBoyleBeyan: 0 } }), 'beyan-gecersiz');
  assert.equal(dene({ meta: { sureSn: 'uzun' } }), 'sure-gecersiz');
  assert.equal(o.gonderilen.length, 0, 'geçersiz istekte e-posta gitmez');
  assert.equal(o.seviyeSayfa(), null, 'geçersiz istek defteri yaratmaz');
  // Telefon isteğe bağlıdır: boş gelince kayıt açılır.
  const t = ortam();
  assert.equal(t.post(govdeUret({ profil: { telefon: '' } })).ok, true);
  assert.equal(satirNesnesi(t.seviyeSayfa()._satirlar[1]).Telefon, '');
});

test('Başarılı gönderim: ST-<yıl>-0001, sütun sırası başlıklarla birebir, sunucu puanı bankayla aynı', () => {
  const o = ortam();
  const govde = govdeUret();
  const r = o.post(govde);
  assert.equal(r.ok, true);
  const yil = sahteFormatDate(new Date(), 'Europe/Brussels', 'yyyy');
  assert.equal(r.ref, `ST-${yil}-0001`);
  assert.deepEqual(r.sonuc, JSON.parse(JSON.stringify(bankaPuanla({ cevaplar: govde.cevaplar, atla: {} }))));
  assert.equal(r.kopyaGitti, true);

  const sayfa = o.seviyeSayfa();
  assert.deepEqual(sayfa._satirlar[0], BASLIKLAR, 'başlık satırı sırası bağlayıcıdır');
  assert.equal(sayfa._satirlar.length, 2);
  const s = satirNesnesi(sayfa._satirlar[1]);
  assert.equal(s.Referans, r.ref);
  assert.equal(s['Ad Soyad'], 'Deniz TESTOGLU');
  assert.equal(s['E-posta'], 'deniz@example.test');
  assert.equal(s['Gönderim anahtarı'], govde.gonderimAnahtari);
  // `hucreGuvenli` her hücreyi METNE sabitler (formül enjeksiyonu koruması): sayılar da dizge olur.
  assert.equal(s['Banka sürümü'], String(SORU_BANKASI_SURUMU));
  assert.equal(s['Süre (dk)'], '25');
  assert.deepEqual(JSON.parse(s.Cevaplar), govde.cevaplar);
  assert.deepEqual(JSON.parse(s.Ezberler), govde.ezber);
  assert.deepEqual(JSON.parse(s.Beyanlar), govde.beyan);
  assert.deepEqual(JSON.parse(s.Atlananlar), {});
  assert.equal(s["Kur'an düzeyi"], String(r.sonuc.okuma.duzey));
  assert.equal(s['Önerilen program'], r.sonuc.program);
  assert.deepEqual(JSON.parse(s.Yüzdeler), Object.fromEntries(r.sonuc.alanlar.map(a => [a.alan, a.yuzde])));
  assert.ok(s.Durum.includes('katilimci-eposta-gonderildi') && s.Durum.includes('imam-eposta-gonderildi'));
  assert.ok(!s.Durum.includes('eposta-bekleniyor'), 'gönderim bitince bekleme damgası kalkar');
});

test('Alıcılar: tam iki ileti; katılımcı → yanıt imam@, hoca → imam@ yedeksiz; info@ ve cc/bcc yok', () => {
  const o = ortam();
  o.post(govdeUret());
  assert.equal(o.gonderilen.length, 2);
  // İnceleme için: SEVIYE_EPOSTA_DOKUM=<klasör> verilirse iletiler HTML olarak yazılır (hiçbir şey gönderilmez).
  if (process.env.SEVIYE_EPOSTA_DOKUM) {
    mkdirSync(process.env.SEVIYE_EPOSTA_DOKUM, { recursive: true });
    for (const dil of ['tr', 'fr', 'en', 'nl', 'de']) {
      const d = ortam();
      d.post(govdeUret({ dil, gonderimAnahtari: 'anahtar-dokum-' + dil + '-0001' }));
      for (const m of d.gonderilen) {
        const ad = (m.to === 'imam@ulucamii.be' ? 'hoca-raporu' : 'katilimci') + '-' + dil;
        writeFileSync(process.env.SEVIYE_EPOSTA_DOKUM + '/' + ad + '.html', m.htmlBody, 'utf8');
        writeFileSync(process.env.SEVIYE_EPOSTA_DOKUM + '/' + ad + '.txt', ['Konu: ' + m.subject, '', m.body].join(String.fromCharCode(10)), 'utf8');
      }
    }
  }
  const katilimci = o.gonderilen.find(m => m.to === 'deniz@example.test');
  const hoca = o.gonderilen.find(m => m.to === 'imam@ulucamii.be');
  assert.ok(katilimci && hoca);
  assert.equal(katilimci.replyTo, 'imam@ulucamii.be');
  assert.equal(katilimci.yedeksiz, undefined);
  assert.equal(hoca.replyTo, 'deniz@example.test');
  assert.equal(hoca.yedeksiz, true, 'hoca raporunda MailApp yedeği kapalıdır');
  for (const m of o.gonderilen) {
    assert.equal(m.cc, undefined);
    assert.equal(m.bcc, undefined);
    assert.equal(m.kurum, 'cami');
    // Alıcı ve yanıt alanlarında info@ ya da dernek Gmail'i ASLA yoktur (kurumsal imza bloğundaki
    // info@ adresi gövdededir ve kimlikten gelir — o alıcı değildir).
    for (const alan of ['to', 'cc', 'bcc', 'replyTo']) {
      const deger = String(m[alan] == null ? '' : m[alan]);
      assert.ok(!deger.includes('info@ulucamii.be'), alan + ': info@ alıcı/yanıt olamaz');
      assert.ok(!deger.includes('ulucamii.marche@gmail.com'), alan + ': dernek Gmail\'i alıcı olamaz');
      assert.ok(!deger.includes(','), alan + ': tek adres olmalı');
    }
  }
});

test('Katılımcı e-postası yalnız düzey adları taşır: doğru şık metni, not ve «yanlış» dökümü yok', () => {
  const o = ortam();
  o.post(govdeUret());
  const m = o.gonderilen.find(x => x.to === 'deniz@example.test');
  const M = SONUC_METINLERI.tr;
  assert.ok(m.htmlBody.includes(M.eposta.kuranBaslik) && m.htmlBody.includes(M.eposta.alanBaslik));
  assert.ok(m.htmlBody.includes(M.sonraki) && m.htmlBody.includes(M.programNot));
  assert.ok(m.htmlBody.includes('https://ulucamii.be/tr/gizlilik/#seviye-testi'));
  assert.ok(m.subject.includes('ST-'));
  // Bankanın en uzun TR doğru şık metni e-postada geçmemeli.
  const uzunDogru = MADDELER.filter(x => !x.emekli && x.siklar[x.dogru] && typeof x.siklar[x.dogru].tr === 'string')
    .map(x => x.siklar[x.dogru].tr).sort((a, b) => b.length - a.length)[0];
  assert.ok(uzunDogru && uzunDogru.length > 10);
  assert.ok(!m.htmlBody.includes(uzunDogru), 'doğru şık metni katılımcıya gösterilmez');
  assert.ok(!m.htmlBody.includes('Cumartesi sabahları uygunum'), 'katılımcının kendi notu iletiye girmez');
  assert.ok(!m.body.includes('Cumartesi sabahları uygunum'));
  assert.ok(!/yanlış|Yanlış|Bilmiyorum/.test(m.htmlBody), 'yanlış/bilmiyorum dökümü katılımcıya gitmez');
  assert.ok(!/\(\d\/[35]\)/.test(m.htmlBody), 'katılımcıda sayı yazılmaz (sonuç bir not değildir)');
  assert.ok(m.body.length > 100, 'düz metin gövdesini çağıran kurar');
});

test('Hoca raporu: ilk başlık Kur\'an okuma düzeyi; serbest metin tıklanır bağlantıya dönmez', () => {
  const o = ortam();
  o.post(govdeUret());
  const m = o.gonderilen.find(x => x.to === 'imam@ulucamii.be');
  const ilkBaslik = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(m.htmlBody);
  assert.ok(ilkBaslik);
  const duzMetin = ilkBaslik[1].replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
  assert.equal(duzMetin, "Kur'an okuma düzeyi");
  assert.ok(!m.htmlBody.includes('href="https://x.test'), 'katılımcının yazdığı adres bağlantı olmaz');
  assert.ok(!m.htmlBody.includes('https://x.test/sayfa'), '«://» etkisizleştirilir');
  assert.ok(m.htmlBody.includes('x.test'), 'metin yine de hocaya görünür');
  assert.ok(!m.htmlBody.includes('<b>kalın</b>'), '«**» ayıklanır');
  assert.ok(/\(\d\/5\)/.test(m.htmlBody), 'hoca raporunda ölçek sayısı yazılır');
  assert.ok(m.htmlBody.includes('Yanlış ve «bilmiyorum» maddeleri'));
  assert.ok(m.htmlBody.includes('Ezber listesi') && m.htmlBody.includes('Önerilen program'));
  assert.ok(m.body.includes('Tam döküm yönetim panelindedir.'));
});

test('Hoca raporu: beyan–sonuç çelişkisi uyarı verir; uzun döküm alan başına 12 maddeyle kırpılır', () => {
  const o = ortam({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  assert.ok(BEYAN.some(b => b.kume === 'okuma'), 'bankada okuma beyanı olmalı');
  const r = o.post(govdeUret({
    cevaplar: cevapUret('bilmiyorum'),
    beyan: Object.fromEntries(BEYAN.map(b => [b.id, b.secenekler.length - 1])), // en üst düzey öz beyan
    meta: { sureSn: 900 },
  }));
  assert.equal(r.sonuc.okuma.duzey, 0, 'hepsi «bilmiyorum» → K0');
  const hoca = o.gonderilen.find(x => x.to === 'imam@ulucamii.be');
  assert.match(hoca.htmlBody, /belirgin biçimde YÜKSEK/, 'K0 iken en üst öz beyan çelişki uyarısı verir');

  const rapor = o.get({ islem: 'seviye-detay', anahtar: 'panel-gizli', ref: r.ref }).rapor;
  const toplamYanlis = Object.keys(rapor.yanlislar).reduce((n, a) => n + rapor.yanlislar[a].length, 0);
  assert.ok(toplamYanlis > 12, 'kırpma yolunu sınamak için yeterli madde olmalı');
  const tam = o.ctx.veliEpostaZengin(o.ctx.seviyeImamBloklari(rapor, 0), 'tr', 'Rapor', { kurum: 'cami' });
  const kisa = o.ctx.veliEpostaZengin(o.ctx.seviyeImamBloklari(rapor, 12), 'tr', 'Rapor', { kurum: 'cami' });
  assert.ok(kisa.length < tam.length);
  assert.ok(kisa.includes('tam döküm yönetim panelindedir'), 'kırpılan dökümde panel notu bulunur');
  assert.ok(!tam.includes('tam döküm yönetim panelindedir'));
  assert.ok(hoca.htmlBody.length <= 90 * 1024, 'ileti 90 KB sınırının altında kalır');
});

test('Aynı gönderim anahtarı: tekrar:true, yeni satır ve yeni e-posta yok', () => {
  const o = ortam();
  const govde = govdeUret();
  const ilkYanit = o.post(govde);
  const satirSayisi = o.seviyeSayfa()._satirlar.length;
  // İlk kaydın zamanını 2 dakikadan eskiye çek (aksi hâlde «kayit-isleniyor» beklenir).
  const sayfa = o.seviyeSayfa();
  sayfa._satirlar[1][0] = new Date(Date.now() - 10 * 60 * 1000);
  const ikinci = o.post(govde);
  assert.equal(ikinci.ok, true);
  assert.equal(ikinci.tekrar, true);
  assert.equal(ikinci.ref, ilkYanit.ref);
  assert.equal(ikinci.kopyaGitti, true);
  assert.deepEqual(ikinci.sonuc, ilkYanit.sonuc);
  assert.equal(o.seviyeSayfa()._satirlar.length, satirSayisi, 'ikinci çağrı satır açmaz');
  assert.equal(o.gonderilen.length, 2, 'ikinci çağrı e-posta göndermez');
});

test('Yarım kalan kayıt: 2 dakikadan yeni ve «eposta-bekleniyor» ise kayit-isleniyor', () => {
  const o = ortam();
  const govde = govdeUret();
  o.ctx.epostaGonder = () => { throw new Error('gonderilemedi'); };
  o.post(govde);
  const sayfa = o.seviyeSayfa();
  sayfa._satirlar[1][BASLIKLAR.indexOf('Durum')] = 'Yeni | eposta-bekleniyor';
  assert.equal(o.post(govde).hata, 'kayit-isleniyor');
  assert.equal(sayfa._satirlar.length, 2);
});

test('Günlük sınırlar: aynı adresten 4., toplamda 26. gönderim reddedilir; satır ve e-posta yok', () => {
  const o = ortam();
  for (let i = 0; i < 3; i++) {
    const r = o.post(govdeUret({ gonderimAnahtari: 'ayni-adres-000000' + i }));
    assert.equal(r.ok, true, JSON.stringify(r));
  }
  const dorduncu = o.post(govdeUret({ gonderimAnahtari: 'ayni-adres-0000003' }));
  assert.equal(dorduncu.hata, 'eposta-gunluk-sinir');
  assert.equal(o.seviyeSayfa()._satirlar.length, 4, 'sınır aşımında satır yazılmaz');
  assert.equal(o.gonderilen.length, 6);

  for (let i = 3; i < 25; i++) {
    const r = o.post(govdeUret({ gonderimAnahtari: 'farkli-adres-00000' + i, profil: { eposta: `k${i}@example.test` } }));
    assert.equal(r.ok, true, JSON.stringify(r));
  }
  assert.equal(o.seviyeSayfa()._satirlar.length, 26, '25 kayıt + başlık');
  const yirmiAlti = o.post(govdeUret({ gonderimAnahtari: 'gun-sinirinda-00001', profil: { eposta: 'yeni@example.test' } }));
  assert.equal(yirmiAlti.hata, 'gunluk-sinir');
  assert.equal(o.seviyeSayfa()._satirlar.length, 26);
});

test('Mezhebe bağlı madde puanı değiştirmez ama hoca raporunda listelenir', () => {
  const mezhepli = MADDELER.filter(m => m.mezhepBagli && !m.emekli);
  assert.ok(mezhepli.length > 0, 'bankada en az bir mezhebe bağlı madde olmalı');
  const temiz = cevapUret('dogru');
  const yanlisli = { ...temiz };
  mezhepli.forEach(m => { yanlisli[m.id] = (m.dogru + 1) % m.siklar.length; });

  const a = ortam(), b = ortam();
  const ra = a.post(govdeUret({ cevaplar: temiz }));
  const rb = b.post(govdeUret({ cevaplar: yanlisli }));
  assert.deepEqual(rb.sonuc.okuma, ra.sonuc.okuma);
  assert.deepEqual(rb.sonuc.alanlar, ra.sonuc.alanlar);
  assert.equal(rb.sonuc.program, ra.sonuc.program);
  const rapor = b.gonderilen.find(x => x.to === 'imam@ulucamii.be');
  assert.ok(rapor.htmlBody.includes('Mezhebe bağlı maddeler'));
  mezhepli.forEach(m => assert.ok(rapor.htmlBody.includes(m.id), m.id + ' raporda görünmeli'));
});

test('Atlanan bölüm: düzey 0 + atlandı; katılımcıya «atlandı» metni, hocaya uyarı', () => {
  const o = ortam();
  const r = o.post(govdeUret({ atla: { okuma: true, siyer: true }, cevaplar: cevapUret('dogru') }));
  assert.equal(r.ok, true);
  assert.equal(r.sonuc.okuma.duzey, 0);
  assert.equal(r.sonuc.okuma.atlandi, true);
  const siyer = r.sonuc.alanlar.find(a => a.alan === 'siyer');
  assert.equal(siyer.duzey, 0);
  assert.equal(siyer.atlandi, true);
  const satir = satirNesnesi(o.seviyeSayfa()._satirlar[1]);
  assert.deepEqual(JSON.parse(satir.Atlananlar), { okuma: true, siyer: true });
  const katilimci = o.gonderilen.find(x => x.to === 'deniz@example.test');
  assert.ok(katilimci.htmlBody.includes(SONUC_METINLERI.tr.atlandi));
  const hoca = o.gonderilen.find(x => x.to === 'imam@ulucamii.be');
  assert.ok(hoca.htmlBody.includes('Atlanan bölümler'));
});

test('Saklama: 25 aylık satır silinir, 23 aylık kalır; zamanlı temizlik 6 saat önbellekli', () => {
  const eski = new Date(); eski.setMonth(eski.getMonth() - 25);
  const yeni = new Date(); yeni.setMonth(yeni.getMonth() - 23);
  const bos = () => BASLIKLAR.map(() => '');
  const satirYap = (zaman, ref) => { const s = bos(); s[0] = zaman; s[1] = ref; s[2] = 'Eski KAYIT'; return s; };
  const o = ortam({ seviyeSatirlari: [satirYap(eski, 'ST-2024-0001'), satirYap(yeni, 'ST-2024-0002')] });
  assert.equal(o.ctx.seviyeZamanliTemizlik(), 1);
  const kalan = o.seviyeSayfa()._satirlar.slice(1).map(s => s[1]);
  assert.deepEqual(kalan, ['ST-2024-0002']);
  assert.equal(o.ctx.seviyeZamanliTemizlik(), 0, 'altı saat içinde ikinci kez koşmaz');
  assert.ok(o.onbellek.has('seviye-temizlik'));
  // Zamanlı görev veli-mail-listesi'nin içinden çağrılır.
  assert.ok(/seviyeZamanliTemizlik/.test(gs('veli-mail-listesi.gs')));
});

test('seviye-sil: yetkisiz anahtar reddedilir, doğru anahtar tek satır siler, ikinci çağrı silinen:0', () => {
  const o = ortam({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  const r = o.post(govdeUret());
  const sil = govde => o.post({ tur: 'seviye-sil', ...govde });
  assert.equal(sil({ anahtar: 'yanlis', ref: r.ref }).hata, 'yetkisiz');
  assert.equal(sil({ ref: r.ref }).hata, 'yetkisiz');
  assert.equal(o.seviyeSayfa()._satirlar.length, 2, 'yetkisiz çağrı hiçbir şey silmedi');
  assert.equal(sil({ anahtar: 'panel-gizli', ref: 'UC-2026-0001' }).hata, 'ref-gecersiz');
  assert.deepEqual(sil({ anahtar: 'panel-gizli', ref: r.ref }), { ok: true, silinen: 1 });
  assert.equal(o.seviyeSayfa()._satirlar.length, 1);
  assert.deepEqual(sil({ anahtar: 'panel-gizli', ref: r.ref }), { ok: true, silinen: 0 }, 'idempotent');
});

test('seviye-detay: yetki ister, yan etkisizdir ve defter yokken defter YARATMAZ', () => {
  const bos = ortam({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  assert.equal(bos.get({ islem: 'seviye-detay', ref: 'ST-2026-0001' }).hata, 'yetki');
  assert.equal(bos.get({ islem: 'seviye-detay', anahtar: 'panel-gizli', ref: 'bozuk' }).hata, 'ref-gecersiz');
  assert.equal(bos.get({ islem: 'seviye-detay', anahtar: 'panel-gizli', ref: 'ST-2026-0001' }).hata, 'bulunamadi');
  assert.equal(bos.yaratilanDefter, 0, 'GET ucu defter yaratmaz');
  assert.equal(bos.ozellikler.SEVIYE_TABLO_ID, undefined);

  const o = ortam({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  const r = o.post(govdeUret());
  const oncekiSatirlar = JSON.stringify(o.seviyeSayfa()._satirlar);
  const d = o.get({ islem: 'seviye-detay', anahtar: 'panel-gizli', ref: r.ref });
  assert.equal(d.ok, true);
  assert.equal(d.rapor.ref, r.ref);
  assert.equal(d.rapor.adSoyad, 'Deniz TESTOGLU');
  assert.equal(d.rapor.okuma.duzey, r.sonuc.okuma.duzey);
  assert.equal(d.rapor.program.kod, r.sonuc.program);
  assert.equal(d.rapor.ezberler.length, EZBER.length);
  assert.ok(Array.isArray(d.rapor.profil) && d.rapor.profil.length >= 9);
  assert.ok(d.rapor.not.includes('x.test') && !d.rapor.not.includes('https://x.test'));
  assert.equal(JSON.stringify(o.seviyeSayfa()._satirlar), oncekiSatirlar, 'detay ucu defteri değiştirmez');
  assert.equal(o.gonderilen.length, 2, 'detay ucu e-posta göndermez');
});

test('Panel listesi: seviyeler gelir; cevaplar, beyanlar, ezberler ve not sütunları gizlenir', () => {
  const o = ortam({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  o.ctx.kayitV2SayfaGetir = () => sahteSayfa([['Referans', 'Gönderim anahtarı']]);
  o.ctx.ihtidaV2SayfaGetir = () => sahteSayfa([['Referans', 'Gönderim anahtarı']]);
  const bosListe = o.get({ islem: 'liste', anahtar: 'panel-gizli' });
  assert.deepEqual(bosListe.seviyeler, { basliklar: [], satirlar: [] }, 'defter yokken boş liste');
  o.post(govdeUret());
  const liste = o.get({ islem: 'liste', anahtar: 'panel-gizli' });
  assert.equal(liste.ok, true);
  assert.equal(liste.seviyeler.satirlar.length, 1);
  for (const gizli of ['Gönderim anahtarı', 'Cevaplar', 'Beyanlar', 'Ezberler', 'Not']) {
    assert.ok(!liste.seviyeler.basliklar.includes(gizli), gizli + ' panel listesine girmez');
  }
  assert.ok(liste.seviyeler.basliklar.includes('Referans') && liste.seviyeler.basliklar.includes('Ad Soyad'));
  assert.ok(!JSON.stringify(liste.seviyeler).includes('Cumartesi sabahları uygunum'));
});

test('test-temizle: ST defterindeki TESTOGLU satırını siler, başka soyadı bırakır', () => {
  const o = ortam({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  o.ctx.kayitV2SayfaGetir = () => sahteSayfa([['Referans', 'Öğrenci soyadı', 'Öğrenci adı']]);
  o.ctx.ihtidaV2SayfaGetir = () => sahteSayfa([['Referans', 'Adı Soyadı']]);
  o.ctx.ihtidaKlasorGetir = () => ({ getFilesByName: () => ({ hasNext: () => false }) });
  o.post(govdeUret());
  o.post(govdeUret({ gonderimAnahtari: 'ikinci-anahtar-00001', profil: { adSoyad: 'Ayşe Testoglulari', eposta: 'ayse@example.test' } }));
  assert.equal(o.seviyeSayfa()._satirlar.length, 3);
  const r = o.get({ islem: 'test-temizle', anahtar: 'panel-gizli' });
  assert.equal(r.ok, true);
  assert.equal(r.silinen, 1);
  const kalan = o.seviyeSayfa()._satirlar.slice(1).map(s => s[BASLIKLAR.indexOf('Ad Soyad')]);
  assert.deepEqual(kalan, ['Ayşe Testoglulari'], 'yalnız tam sözcük TESTOGLU silinir');
});

test('Panel anahtarı tanımsızken gömülü yer tutucu seviye uçlarını AÇMAZ', () => {
  /* 20 Eyl 2026 bulgusu ve düzeltmesi: depo public olduğu için `SCRIPT-PROPERTIES-ICINDE` yer tutucusu herkesçe
     bilinir; `panelYetkiTamam` onu artık anahtar SAYMAZ (bütün panel GET uçları için geçerli). Seviye uçları aynı
     korumayı ayrıca kendileri de yapar — PANEL_ANAHTARI tanımlı değilken ne detay okunur ne kayıt silinir. */
  const o = ortam(); // PANEL_ANAHTARI yok
  assert.equal(o.ctx.PANEL.anahtar, 'SCRIPT-PROPERTIES-ICINDE');
  assert.equal(o.ctx.panelYetkiTamam({ parameter: { anahtar: 'SCRIPT-PROPERTIES-ICINDE' } }), false,
    'ortak yardımcı yer tutucuyu anahtar saymamalı');
  assert.equal(o.get({ islem: 'liste', anahtar: 'SCRIPT-PROPERTIES-ICINDE' }).ok, false, 'liste ucu yer tutucuyla açılmamalı');
  assert.equal(o.get({ islem: 'seviye-detay', anahtar: 'SCRIPT-PROPERTIES-ICINDE', ref: 'ST-2026-0001' }).hata, 'yetki');
  assert.equal(o.post({ tur: 'seviye-sil', anahtar: 'SCRIPT-PROPERTIES-ICINDE', ref: 'ST-2026-0001' }).hata, 'yetkisiz');
  // Gerçek anahtar tanımlıyken uçlar yine çalışır.
  const k = ortam({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  assert.equal(k.get({ islem: 'seviye-detay', anahtar: 'panel-gizli', ref: 'ST-2026-0001' }).hata, 'bulunamadi');
});

test('Sağlık yanıtı seviye testini ve banka sürümünü bildirir; paket yoksa uç kapalıdır', () => {
  const o = ortam();
  const saglik = o.get({});
  assert.equal(saglik.surum, 40);
  assert.equal(saglik.seviyeTesti, true);
  assert.equal(saglik.seviyeBankaSurumu, SORU_BANKASI_SURUMU);

  // Paket yüklenmemiş kurulum: SeviyeTesti tanımsız → kayıt açılmaz.
  const ctx = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, getContent: () => t }), MimeType: { JSON: 'json' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
  });
  vm.runInContext([gs('kimlik-sabitler.gs'), gs('veli-eposta-sablon.gs'), gs('ulucamii-Kod-v40.gs')].join('\n;\n'), ctx);
  const yanit = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ tur: 'seviye' }) } }).getContent());
  assert.deepEqual(yanit, { ok: false, hata: 'seviye-hazir-degil' });
  assert.equal(JSON.parse(ctx.doGet({ parameter: {} }).getContent()).seviyeTesti, false);
});

test('epostaGonder: yedeksiz:true Brevo düşünce MailApp\'e düşmez; seçenek çağıranın nesnesinde kalmaz', () => {
  const gonderilen = [];
  const ctx = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, getContent: () => t }), MimeType: { JSON: 'json' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k === 'BREVO_API_KEY' ? 'anahtar' : null) }) },
    MailApp: { sendEmail: m => gonderilen.push(m) },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 500, getContentText: () => 'hata' }) },
  });
  vm.runInContext([gs('kimlik-sabitler.gs'), gs('veli-eposta-sablon.gs'), gs('ulucamii-Kod-v40.gs')].join('\n;\n'), ctx);
  const rapor = { to: 'imam@ulucamii.be', subject: 'Rapor', body: 'x', kurum: 'cami', yedeksiz: true };
  assert.throws(() => ctx.epostaGonder(rapor), /Brevo HTTP 500/);
  assert.equal(gonderilen.length, 0, 'yedeksiz ileti MailApp\'e düşmez');
  assert.equal(rapor.yedeksiz, true, 'çağıranın nesnesi değişmez');
  // Yedekli (varsayılan) davranış korunur.
  ctx.epostaGonder({ to: 'veli@example.test', subject: 'Onay', body: 'x', kurum: 'kurs' });
  assert.equal(gonderilen.length, 1);
  assert.equal(gonderilen[0].yedeksiz, undefined, 'MailApp yalnız kendi seçeneklerini alır');
  // Brevo anahtarı hiç yoksa yedeksiz ileti sessizce Gmail\'e düşmez.
  const ctx2 = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, getContent: () => t }), MimeType: { JSON: 'json' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    MailApp: { sendEmail: () => { throw new Error('MailApp cagrilmamaliydi'); } },
  });
  vm.runInContext([gs('kimlik-sabitler.gs'), gs('veli-eposta-sablon.gs'), gs('ulucamii-Kod-v40.gs')].join('\n;\n'), ctx2);
  assert.throws(() => ctx2.epostaGonder({ to: 'imam@ulucamii.be', subject: 'x', body: 'x', kurum: 'cami', yedeksiz: true }), /brevo-anahtari-yok/);
});

test('Bir e-posta düşerse öbürü yine denenir ve defter damgası dürüst kalır', () => {
  const o = ortam();
  const gonderilen = [];
  o.ctx.epostaGonder = s => {
    gonderilen.push(s);
    if (s.to === 'imam@ulucamii.be') throw new Error('brevo-dustu');
    return { yol: 'sahte' };
  };
  const r = o.post(govdeUret());
  assert.equal(r.ok, true);
  assert.equal(r.kopyaGitti, true);
  assert.equal(gonderilen.length, 2, 'ilk ileti düşse de ikincisi denenir');
  const durum = satirNesnesi(o.seviyeSayfa()._satirlar[1]).Durum;
  assert.ok(durum.includes('katilimci-eposta-gonderildi'));
  assert.ok(durum.includes('imam-eposta-gonderilemedi'));
  assert.ok(!durum.includes('eposta-bekleniyor'));
});

test('20 KiB gövde sınırı UTF-8 bayt sayar: Türkçe karakterli büyük gövde karakter sayısı sınırın altında olsa da reddedilir', () => {
  const o = ortam();
  const dolgu = 'ş'.repeat(11000); // 11.000 UTF-16 birimi, 22.000 bayt
  const govde = govdeUret({ profil: { not: dolgu } });
  assert.ok(JSON.stringify(govde).length < 20 * 1024 && Buffer.byteLength(JSON.stringify(govde)) > 20 * 1024);
  assert.equal(o.post(govde).hata, 'cok-buyuk');
  assert.equal(o.post(govdeUret()).ok, true, 'olağan gövde etkilenmez');
});

/* ---------- Form sürümü 2: «Nereden başvuruyorsunuz?» (v39) ---------- */
const yerelUret = (ek = {}) => ({ ulke: 'DE', sehir: 'Köln 50667', camiBiliyor: 'evet', yakinCami: 'Köln Merkez Camii', gorevliTaniyor: 'hayir', ateselikBilgisi: 'hayir', ...ek });

test('Yer bilgisi: sürüm 2 doğrulaması, isteğe bağlı paylaşım onayları, defter sütunları ve hoca raporu', () => {
  const o = ortam();
  let sira = 0;
  const dene = ek => o.post(govdeUret({ formSurumu: 2, gonderimAnahtari: 'anahtar-yerel-' + String(++sira).padStart(5, '0'), ...ek })).hata;
  assert.equal(dene({}), 'yerel-eksik');
  assert.equal(dene({ yerel: yerelUret({ ulke: 'XX' }) }), 'yerel-ulke-gecersiz');
  assert.equal(dene({ yerel: yerelUret({ sehir: '  ' }) }), 'yerel-sehir-gecersiz');
  assert.equal(dene({ yerel: yerelUret({ yakinCami: 'x'.repeat(121) }) }), 'yerel-cami-uzun');
  assert.equal(dene({ yerel: yerelUret({ gorevliTaniyor: 'belki' }) }), 'yerel-gorevliTaniyor-gecersiz');
  assert.equal(dene({ yerel: yerelUret(), onay: { yas18: true, riza: true, ateselik: 'true' } }), 'onay-paylasim-gecersiz');

  // Onaysız gönderim geçerlidir (paylaşım onayları testin şartı DEĞİLDİR) ve defterde açıkça «Hayır» yazar.
  const a = ortam();
  const ra = a.post(govdeUret({ formSurumu: 2, yerel: yerelUret() }));
  assert.equal(ra.ok, true, JSON.stringify(ra));
  const sa = satirNesnesi(a.seviyeSayfa()._satirlar[1]);
  assert.equal(sa['Ülke'], 'DE');
  assert.equal(sa['Şehir'], 'Köln 50667');
  assert.equal(sa['En yakın Diyanet camisi'], 'Köln Merkez Camii');
  assert.equal(sa['Yerel görevli onayı'], 'Hayır');
  assert.equal(sa['Ataşelik onayı'], 'Hayır');
  const hocaA = a.gonderilen.find(m => m.to === 'imam@ulucamii.be');
  assert.match(hocaA.htmlBody, /Yer ve yerel destek/);
  assert.match(hocaA.htmlBody, /ONAY VERMEDİ/);
  assert.match(hocaA.htmlBody, /Onay verilmeyen paylaşım YAPILMAZ/);
  assert.match(hocaA.htmlBody, /Almanya/);
  // Katılımcıya giden iletide yer/onay dökümü yoktur (yalnız düzeyler).
  const katA = a.gonderilen.find(m => m.to === 'deniz@example.test');
  assert.ok(!/ONAY VER/.test(katA.htmlBody));

  // İki onay da verilirse rapor bunu yazar, uyarı kutusu çıkmaz.
  const b = ortam();
  b.post(govdeUret({ formSurumu: 2, yerel: yerelUret(), onay: { yas18: true, riza: true, yerelGorevli: true, ateselik: true } }));
  const sb = satirNesnesi(b.seviyeSayfa()._satirlar[1]);
  assert.equal(sb['Yerel görevli onayı'], 'Evet');
  assert.equal(sb['Ataşelik onayı'], 'Evet');
  const hocaB = b.gonderilen.find(m => m.to === 'imam@ulucamii.be');
  assert.ok(!/Onay verilmeyen paylaşım YAPILMAZ/.test(hocaB.htmlBody));
  assert.match(hocaB.htmlBody, /onayı var/);

  // Sürüm 1 (dağıtım geçişi): yer bilgisi yoktur, sütunlar boş kalır, raporda bölüm çıkmaz.
  const c = ortam();
  c.post(govdeUret());
  const sc = satirNesnesi(c.seviyeSayfa()._satirlar[1]);
  assert.equal(sc['Ülke'], '');
  assert.equal(sc['Yerel görevli onayı'], '');
  assert.ok(!/Yer ve yerel destek/.test(c.gonderilen.find(m => m.to === 'imam@ulucamii.be').htmlBody));
});
