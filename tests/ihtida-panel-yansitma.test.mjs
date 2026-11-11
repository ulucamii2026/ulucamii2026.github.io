/** Dilim 5 / WP4 — ihtida başvurusunu panelin `basvuruAl` ucuna yansıtma (Apps Script, ihtida-panel-yansitma.gs).
 *
 *  Kod Node'da `vm` içinde çalışır; Sheets, Properties, UrlFetchApp, Utilities, e-posta sahtedir (canlı ağ / gönderim imkânsız).
 *  İmza çapraz denetimi: GAS kod yolu imzayı üretir, panelin KENDİ doğrulayıcı mantığı (tests/fixtures/ihtida-panel-sozlesme.mjs,
 *  kaynak: panel deposu commit d92c79ec) doğrular. Bütün kişi verisi uydurmadır (.test adresleri).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basvuruKapisi, imzaDogrula, KATALOG_PANELDE_YOK, BASVURU_IZINLI_ALANLAR, DILLER } from './fixtures/ihtida-panel-sozlesme.mjs';

const gs = ad => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8');
const kaynak = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v48.gs', 'ihtida-paket-isleri.gs', 'ihtida-panel-yansitma.gs'].map(gs).join('\n;\n');

const SIR = 'test-panel-sirri-0123456789abcdef-0123456789';
const URL_ = 'https://panel.example.test/basvuruAl';
const DK = 60000;
const AD = 'Çağla Örnek-Deneme';
const EPOSTA = 'cagla.deneme@ihtida.test';
const DOGUM = '1990-05-17';
const SIZMAZ = ['SIZMAZ-tel', 'SIZMAZ-adres', 'SIZMAZ-sebep', 'SIZMAZ-anne', 'SIZMAZ-baba', 'SIZMAZ-meslek', 'SIZMAZ-sahit', 'SIZMAZ-pdf', 'SIZMAZ-anahtar', 'SIZMAZ-yeni-isim', 'SIZMAZ-not'];
const brukselGunu = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** Sahte Google altyapısı + kod. `saat` değişkeni sahte saattir (ihtidaPanelSaat geçersiz kılınır). */
function ortam({ acik = true, ayar = true, props: ek = {} } = {}) {
  const log = [], mailler = [], istekler = [], props = new Map();
  if (acik) props.set('PANEL_YANSIT', '1');
  if (ayar) { props.set('PANEL_YANSIT_URL', URL_); props.set('PANEL_YANSIT_SIR', SIR); }
  for (const [k, v] of Object.entries(ek)) props.set(k, v);
  const k = { saat: Date.parse('2026-11-12T10:00:00Z'), yanitlar: [], kilit: 0, kilitFetchte: [] };
  const yaz = (...a) => log.push(a.map(String).join(' '));
  const ctx = vm.createContext({
    console: { log: yaz, error: yaz, warn: yaz, info: yaz },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: p => props.has(p) ? props.get(p) : null, setProperty: (p, v) => { props.set(p, String(v)); },
      deleteProperty: p => { props.delete(p); }, getProperties: () => Object.fromEntries(props),
    }) },
    Utilities: {
      formatDate: (d, _tz, bicim) => bicim === 'yyyy-MM-dd' ? brukselGunu(new Date(d)) : '12.11.2026 10:00',
      // Apps Script gibi: metin UTF-8 baytlarına çevrilir, sonuç işaretli bayt dizisidir.
      computeHmacSha256Signature: (deger, anahtar) => [...createHmac('sha256', Buffer.from(anahtar, 'utf8')).update(Buffer.from(deger, 'utf8')).digest()].map(b => b > 127 ? b - 256 : b),
      getUuid: randomUUID,
    },
    UrlFetchApp: { fetch: (url, o) => {
      istekler.push({ url, ...o });
      k.kilitFetchte.push(k.kilit);
      const y = k.yanitlar.shift();
      if (y === 'ag') throw new Error('ag-hatasi');
      return { getResponseCode: () => y ?? 200 };
    } },
    LockService: { getScriptLock: () => ({ waitLock() { k.kilit++; }, releaseLock() { k.kilit--; } }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    SpreadsheetApp: { flush() {} },
  });
  vm.runInContext(kaynak, ctx);
  ctx.json = x => x;
  ctx.ihtidaPanelSaat = () => k.saat;
  ctx.epostaGonder = m => { mailler.push(m); };
  return { ctx, log, mailler, istekler, props, k };
}

/** Defter: üst satır başlık, altı satırlar; her sütun SIZMAZ işaretiyle dolu, gereken sütunlar geçerli. */
function defter(ctx, satirOzellikleri = [{}]) {
  const baslik = [...ctx.BASLIKLAR2_IHTIDA];
  const satirlar = satirOzellikleri.map((ek, n) => {
    const s = baslik.map((b, i) => SIZMAZ[i % SIZMAZ.length] + '-' + i);
    const koy = (ad, v) => { s[baslik.indexOf(ad)] = v; };
    koy('Zaman damgası', new Date('2026-11-12T08:30:00Z')); koy('Referans', 'IH-2026-' + String(n + 1).padStart(4, '0'));
    koy('Adı Soyadı', AD); koy('Cinsiyet', 'kadin'); koy('Doğum tarihi', DOGUM); koy('Uyruk', 'Belçika'); koy('E-posta', EPOSTA);
    koy('Tören dili', 'tr'); koy('Form dili', 'fr'); koy('Açık rıza', 'Evet'); koy('EK-10 rızası', 'Evet'); koy('Cami kimliği', 'ulucamii-marche'); koy('EK-10 sürümü', '2026-10');
    for (const [a, v] of Object.entries(ek)) koy(a, v);
    return s;
  });
  const tum = [baslik, ...satirlar];
  const sayfa = {
    getLastRow: () => tum.length, getLastColumn: () => baslik.length,
    getRange: (r, c, nr = 1, nc = 1) => ({ getValues: () => tum.slice(r - 1, r - 1 + nr).map(s => s.slice(c - 1, c - 1 + nc)) }),
    satirlar,
  };
  ctx.ihtidaV2SayfaGetir = () => sayfa;
  return sayfa;
}
const kur = (ctx, ek, simdi = Date.parse('2026-11-12T10:00:00Z')) => {
  const s = defter(ctx, [ek]);
  const k = {}; ctx.BASLIKLAR2_IHTIDA.forEach((b, i) => { k[b] = s.satirlar[0][i]; });
  return JSON.parse(JSON.stringify(ctx.ihtidaPanelGovdeKur(k, simdi)));
};
const q = (e, ref) => { const h = e.props.get('PANEL_YANSIT_KUYRUK_' + ref); return h ? JSON.parse(h) : null; };
const sonuc = (e, ref) => e.props.get('PANEL_YANSIT_SONUC_' + ref) ?? null;

/* ───────────── 1. Ana anahtar ───────────── */

test('anahtar kapalı (yok, 0, true, evet): sıraya alma ve işleme hiçbir şey yapmaz', async () => {
  for (const deger of [undefined, '0', 'true', 'evet', '', '11']) {
    const e = ortam({ acik: false, props: deger === undefined ? {} : { PANEL_YANSIT: deger } });
    defter(e.ctx);
    assert.equal(e.ctx.ihtidaPaneleYansitKuyrugaAl('IH-2026-0001'), false);
    e.props.set('PANEL_YANSIT_KUYRUK_IH-2026-0001', JSON.stringify({ d: 0, i: 0, s: 0 })); // kuyruk dolu olsa bile işlenmez
    const s = e.ctx.ihtidaPaneleYansitKuyrukCalistir(e.k.saat);
    assert.equal(e.istekler.length, 0, `anahtar «${deger}»`);
    assert.equal(s.denenen, 0);
    assert.equal(sonuc(e, 'IH-2026-0001'), null);
  }
});
test('anahtar açık ama URL/sır eksik ya da sır kısa: işlenmez, kuyruk korunur', () => {
  for (const props of [{}, { PANEL_YANSIT_URL: 'http://panel.example.test/x', PANEL_YANSIT_SIR: SIR }, { PANEL_YANSIT_URL: URL_, PANEL_YANSIT_SIR: 'kisa' }]) {
    const e = ortam({ ayar: false, props });
    defter(e.ctx);
    assert.equal(e.ctx.ihtidaPaneleYansitKuyrugaAl('IH-2026-0001'), true);
    e.ctx.ihtidaPaneleYansitKuyrukCalistir(e.k.saat);
    assert.equal(e.istekler.length, 0);
    assert.ok(q(e, 'IH-2026-0001'));
  }
});

/* ───────────── 2. Beyaz liste ───────────── */

test('beyaz liste kanıtı: her hassas sütun dolu satırdan yalnız sözleşme alanları çıkar; hiçbiri sızmaz', () => {
  const e = ortam();
  const m = kur(e.ctx, {});
  assert.equal(m.ok, true);
  assert.deepEqual(Object.keys(m.govde).sort(), ['ad', 'camiId', 'cinsiyet', 'dil', 'dogumTarihi', 'eposta', 'ref', 'rizaSurum', 'torenDili', 'uyruk', 'zaman']);
  for (const a of Object.keys(m.govde)) assert.ok(BASVURU_IZINLI_ALANLAR.includes(a), `sözleşmede yok: ${a}`);
  const metin = JSON.stringify(m.govde);
  assert.ok(!/SIZMAZ/.test(metin), 'hassas sütun sızdı');
  assert.deepEqual(m.govde, { ref: 'IH-2026-0001', zaman: '2026-11-12T08:30:00.000Z', dil: 'fr', cinsiyet: 'K', dogumTarihi: DOGUM, uyruk: 'be', camiId: 'ulucamii-marche', torenDili: 'tr', rizaSurum: '2026-10', ad: AD, eposta: EPOSTA });
});
test('kimlik yalnız ad + e-posta; sütun okuyucu yalnız on üç sütunu okur', () => {
  const e = ortam();
  const s = defter(e.ctx);
  const okunan = e.ctx.ihtidaPanelSatirOku('IH-2026-0001');
  assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(okunan))).sort(), [...e.ctx.PANEL_YANSIT_SUTUNLAR].sort());
  assert.equal(e.ctx.PANEL_YANSIT_SUTUNLAR.length, 13);
  assert.ok(!JSON.stringify(okunan).includes('SIZMAZ'));
  assert.equal(e.ctx.ihtidaPanelSatirOku('IH-2026-0099'), null);
  assert.ok(s);
});

/* ───────────── 3. Enum eşlemesi ───────────── */

test('uyruk: tanınan yazımlar enuma, tanınmayan metin «diger» (serbest metin asla gitmez)', () => {
  const { ctx } = ortam();
  const dogru = { 'Belçika': 'be', 'Belgique': 'be', 'belgian': 'be', 'Fransa': 'fr', 'France': 'fr', 'Hollanda': 'nl', 'Pays-Bas': 'nl', 'Nederland': 'nl', 'Almanya': 'de', 'Deutschland': 'de', 'Allemagne': 'de', 'İngiltere': 'gb', 'Birleşik Krallık': 'gb', 'United Kingdom': 'gb', 'Royaume-Uni': 'gb' };
  for (const [girdi, enum_] of Object.entries(dogru)) assert.equal(ctx.ihtidaPanelUyruk(girdi), enum_, girdi);
  for (const g of ['Türkiye', 'Maroc', '', null, undefined, 'Belçika / Türkiye', 'x'.repeat(500)]) assert.equal(ctx.ihtidaPanelUyruk(g), 'diger', String(g));
});
test('cinsiyet, form dili, tören dili, cami kimliği, rıza sürümü eşlemesi ve bilinmeyen değerlerde atlama', () => {
  const e = ortam();
  assert.equal(kur(e.ctx, { 'Cinsiyet': 'erkek' }).govde.cinsiyet, 'E');
  assert.equal(kur(e.ctx, { 'Cinsiyet': 'diger' }).neden, 'cinsiyet-gecersiz');
  assert.equal(kur(e.ctx, { 'Cinsiyet': '' }).neden, 'cinsiyet-gecersiz');
  for (const d of ['tr', 'fr', 'en', 'nl', 'de']) assert.ok(DILLER.includes(kur(e.ctx, { 'Form dili': d }).govde.dil));
  assert.equal(kur(e.ctx, { 'Form dili': 'xx' }).neden, 'dil-gecersiz');
  assert.equal(kur(e.ctx, { 'Form dili': '' }).neden, 'dil-gecersiz');
  assert.equal(kur(e.ctx, { 'Tören dili': 'ar' }).govde.torenDili, 'ar');
  assert.equal(kur(e.ctx, { 'Tören dili': 'serbest metin' }).neden, 'toren-dili-gecersiz');
  assert.equal(kur(e.ctx, { 'Cami kimliği': '' }).govde.camiId, 'ulucamii-marche', 'eski satır: form da Marche sayar');
  assert.equal(kur(e.ctx, { 'Cami kimliği': 'merkez-camii-bif-genk' }).govde.camiId, 'merkez-camii-bif-genk');
  assert.equal(kur(e.ctx, { 'Cami kimliği': 'Serbest Metin Cami!' }).neden, 'cami-gecersiz');
  assert.equal(kur(e.ctx, { 'EK-10 sürümü': '' }).govde.rizaSurum, 'ek10-v1', 'sürümsüz = eski rıza metni');
  assert.equal(kur(e.ctx, { 'EK-10 sürümü': "'2026-09-09" }).govde.rizaSurum, '2026-09-09');
  assert.equal(kur(e.ctx, { 'EK-10 sürümü': 'çok uzun ve geçersiz sürüm metni !!' }).neden, 'riza-yok');
  assert.equal(kur(e.ctx, { 'Açık rıza': 'Hayır' }).neden, 'riza-yok');
  assert.equal(kur(e.ctx, { 'EK-10 rızası': 'Hayır' }).neden, 'riza-yok');
});
test('ad ve e-posta sözleşme kuralına uymuyorsa atlanır (panel 400 verirdi)', () => {
  const e = ortam();
  assert.equal(kur(e.ctx, { 'Adı Soyadı': 'Ali 2. Veli' }).neden, 'ad-gecersiz');
  assert.equal(kur(e.ctx, { 'Adı Soyadı': 'A' }).neden, 'ad-gecersiz');
  assert.equal(kur(e.ctx, { 'Adı Soyadı': '  Ali   Veli  ' }).govde.ad, 'Ali Veli');
  assert.equal(kur(e.ctx, { 'E-posta': 'yanlis' }).neden, 'eposta-gecersiz');
  assert.equal(kur(e.ctx, { 'E-posta': ' BÜYÜK@Ihtida.TEST ' }).neden, 'eposta-gecersiz', 'ü: panel de reddeder');
  assert.equal(kur(e.ctx, { 'E-posta': ' Buyuk@Ihtida.TEST ' }).govde.eposta, 'buyuk@ihtida.test');
});

/* ───────────── 4. Yaş ve doğum tarihi ───────────── */

test('18 yaş altı: başvuru gününe göre panele HİÇ gönderilmez; tam 18 gönderilir; sonradan 18 olan eski küçük gönderilmez', () => {
  const e = ortam();
  const zaman = new Date('2026-11-12T08:30:00Z'); // başvuru günü 2026-11-12
  assert.equal(kur(e.ctx, { 'Zaman damgası': zaman, 'Doğum tarihi': '2008-11-13' }).neden, 'kucuk', '17 yaş 364 gün');
  assert.equal(kur(e.ctx, { 'Zaman damgası': zaman, 'Doğum tarihi': '2008-11-12' }).ok, true, 'tam 18');
  assert.equal(kur(e.ctx, { 'Zaman damgası': zaman, 'Doğum tarihi': '2010-03-01' }).neden, 'kucuk', 'form 16 yaşı kabul eder');
  // 17 yaşında başvurmuş, bugün 18+ : yine küçük (başvuru günü esas)
  assert.equal(kur(e.ctx, { 'Zaman damgası': new Date('2026-09-01T08:00:00Z'), 'Doğum tarihi': '2008-10-01' }, Date.parse('2026-12-01T10:00:00Z')).neden, 'kucuk');
});
test('doğum tarihi biçimleri: ISO metin, GG.AA.YYYY metin, tarih nesnesi; eksik/bozuk = atla', () => {
  const e = ortam();
  assert.equal(kur(e.ctx, { 'Doğum tarihi': '1984-12-24' }).govde.dogumTarihi, '1984-12-24');
  assert.equal(kur(e.ctx, { 'Doğum tarihi': '24.12.1984' }).govde.dogumTarihi, '1984-12-24');
  assert.equal(kur(e.ctx, { 'Doğum tarihi': new Date('1984-12-23T23:00:00Z') }).govde.dogumTarihi, '1984-12-24', 'Brüksel günü');
  for (const g of ['', null, 'bilinmiyor', '1984-13-40', '31.02.1990', new Date('x')]) assert.equal(kur(e.ctx, { 'Doğum tarihi': g }).neden, 'dogum-eksik', String(g));
});
test('zaman damgası sözleşme penceresinin dışındaysa (400 günden eski) alan atlanır, başvuru yine gider', () => {
  const e = ortam();
  const m = kur(e.ctx, { 'Zaman damgası': new Date('2024-01-01T00:00:00Z') });
  assert.equal(m.ok, true); assert.equal(m.govde.zaman, undefined);
  assert.equal(kur(e.ctx, { 'Zaman damgası': new Date('2026-11-14T00:00:00Z') }).govde.zaman, undefined, 'gelecek');
});

/* ───────────── 5. İmza çapraz denetimi ───────────── */

test('GAS imzası, panelin kendi doğrulayıcısından geçer (UTF-8 ad dahil); bozulan gövde/sır/zaman reddedilir', () => {
  const e = ortam();
  const m = kur(e.ctx, {});
  const simdi = e.k.saat;
  const ist = JSON.parse(JSON.stringify(e.ctx.ihtidaPanelIstekKur(m.govde, SIR, simdi)));
  assert.match(ist.basliklar['x-ihtida-zaman'], /^\d{13}$/);
  assert.match(ist.basliklar['x-ihtida-nonce'], /^[A-Za-z0-9_-]{16,64}$/);
  assert.match(ist.basliklar['x-ihtida-imza'], /^[0-9a-f]{64}$/);
  const b = { zaman: ist.basliklar['x-ihtida-zaman'], nonce: ist.basliklar['x-ihtida-nonce'], imza: ist.basliklar['x-ihtida-imza'] };
  assert.equal(imzaDogrula(SIR, b, ist.metin, simdi).ok, true);
  assert.ok(ist.metin.includes('Çağla'), 'ad ham UTF-8 olarak gövdede');
  assert.equal(imzaDogrula(SIR, b, ist.metin + ' ', simdi).ok, false);
  assert.equal(imzaDogrula(SIR + 'x', b, ist.metin, simdi).ok, false);
  assert.equal(imzaDogrula(SIR, b, ist.metin, simdi + 6 * DK).neden, 'zaman-penceresi');
  const ikinci = e.ctx.ihtidaPanelIstekKur(m.govde, SIR, simdi);
  assert.notEqual(ikinci.basliklar['x-ihtida-nonce'], b.nonce, 'her denemede taze nonce');
});
test('uçtan uca: yük panel kapısından 200 geçer; ad/e-posta/tarih beklenen alanlara düşer; küçük/kapsam dışı/cami kayması doğru koda gider', () => {
  const e = ortam();
  const simdi = e.k.saat;
  const gonder = (ek, acik = true) => {
    const m = kur(e.ctx, ek);
    assert.equal(m.ok, true, JSON.stringify(m));
    const ist = JSON.parse(JSON.stringify(e.ctx.ihtidaPanelIstekKur(m.govde, SIR, simdi)));
    return basvuruKapisi({ anahtar: SIR, basliklar: ist.basliklar, ham: ist.metin, simdiMs: simdi, acik });
  };
  const ok = gonder({});
  assert.equal(ok.durum, 200); assert.equal(ok.saklandi, true);
  assert.deepEqual([ok.veri.ad, ok.veri.eposta, ok.veri.dogumYili, ok.veri.uyruk, ok.veri.camiId], [AD, EPOSTA, 1990, 'be', 'ulucamii-marche']);
  assert.equal(gonder({}, false).durum, 503, 'kayıt alımı kapalı → yeniden denenebilir');
  assert.equal(gonder({ 'Cami kimliği': 'anderlecht-merkez-camii-anderlecht' }).durum, 422, 'kapsam dışı bölge');
  const borg = gonder({ 'Cami kimliği': KATALOG_PANELDE_YOK[0] });
  assert.deepEqual([borg.durum, borg.alan], [400, 'camiId'], 'KATALOG KAYMASI: sitede var, panelde yok');
  // panel kapısı yanlış sırla 401
  const m = kur(e.ctx, {});
  const ist = JSON.parse(JSON.stringify(e.ctx.ihtidaPanelIstekKur(m.govde, SIR + 'yanlis', simdi)));
  assert.equal(basvuruKapisi({ anahtar: SIR, basliklar: ist.basliklar, ham: ist.metin, simdiMs: simdi }).durum, 401);
  // tekrar oynatma: aynı istek ikinci kez 401 (nonce)
  const k = new Set(); const a = JSON.parse(JSON.stringify(e.ctx.ihtidaPanelIstekKur(m.govde, SIR, simdi)));
  assert.equal(basvuruKapisi({ anahtar: SIR, basliklar: a.basliklar, ham: a.metin, simdiMs: simdi, kullanilmisNonce: k }).durum, 200);
  assert.equal(basvuruKapisi({ anahtar: SIR, basliklar: a.basliklar, ham: a.metin, simdiMs: simdi, kullanilmisNonce: k }).durum, 401);
});
test('gönderilen HTTP isteği: POST, JSON, yönlendirme izlenmez, yalnız üç başlık; panel kapısı kabul eder', () => {
  const e = ortam();
  defter(e.ctx);
  e.ctx.ihtidaPaneleYansitKuyrugaAl('IH-2026-0001');
  e.ctx.ihtidaPaneleYansitKuyrukCalistir(e.k.saat);
  assert.equal(e.istekler.length, 1);
  const i = e.istekler[0];
  assert.equal(i.url, URL_); assert.equal(i.method, 'post'); assert.equal(i.contentType, 'application/json');
  assert.equal(i.followRedirects, false); assert.equal(i.muteHttpExceptions, true);
  assert.deepEqual(Object.keys(i.headers).sort(), ['x-ihtida-imza', 'x-ihtida-nonce', 'x-ihtida-zaman']);
  assert.equal(basvuruKapisi({ anahtar: SIR, basliklar: i.headers, ham: i.payload, simdiMs: e.k.saat }).durum, 200);
});

/* ───────────── 6. Kuyruk durum makinesi ───────────── */

function kuyrukluOrtam(ek = {}, satir = {}) {
  const e = ortam(ek);
  defter(e.ctx, [satir]);
  assert.equal(e.ctx.ihtidaPaneleYansitKuyrugaAl('IH-2026-0001'), true);
  return e;
}
const tur = (e, ...yanitlar) => { e.k.yanitlar.push(...yanitlar); return JSON.parse(JSON.stringify(e.ctx.ihtidaPaneleYansitKuyrukCalistir(e.k.saat))); };
const REF = 'IH-2026-0001';

test('200: kuyruktan çıkar, sonuç «ok»; tekrar sıraya alınmaz (ref ile idempotent)', () => {
  const e = kuyrukluOrtam();
  assert.equal(tur(e, 200).ok, 1);
  assert.equal(q(e, REF), null); assert.equal(sonuc(e, REF), 'ok');
  assert.equal(e.ctx.ihtidaPaneleYansitKuyrugaAl(REF), false);
  tur(e); assert.equal(e.istekler.length, 1);
});
test('422: kapsam dışı — kuyruktan çıkar, işaretlenir, yeniden denenmez', () => {
  const e = kuyrukluOrtam({}, { 'Cami kimliği': 'anderlecht-merkez-camii-anderlecht' });
  assert.equal(tur(e, 422).kapsamDisi, 1);
  assert.equal(q(e, REF), null); assert.equal(sonuc(e, REF), 'kapsam-disi');
  e.k.saat += 10 * 24 * 60 * DK; tur(e); assert.equal(e.istekler.length, 1);
  assert.equal(e.ctx.ihtidaPaneleYansitKuyrugaAl(REF), false);
});
test('503 (kayıt alımı kapalı): kuyrukta KALIR, 1 saat bekler, deneme sayacı artmaz; açılınca gider', () => {
  const e = kuyrukluOrtam();
  for (let n = 1; n <= 60; n++) { tur(e, 503); e.k.saat += 61 * DK; }
  assert.equal(e.istekler.length, 60);
  assert.deepEqual([q(e, REF).d, q(e, REF).i], [0, 0]);
  assert.equal(sonuc(e, REF), null);
  assert.equal(e.mailler.length, 0, 'bekleme uyarı üretmez');
  assert.equal(tur(e, 200).ok, 1);
});
test('503 sonrası vakit gelmeden yeniden denenmez', () => {
  const e = kuyrukluOrtam();
  tur(e, 503);
  e.k.saat += 59 * DK; tur(e);
  assert.equal(e.istekler.length, 1);
  e.k.saat += 2 * DK; tur(e, 200);
  assert.equal(e.istekler.length, 2);
});
test('geçici hata (500, 429, ağ istisnası): üstel geri çekilme 5-10-20-40-80-160-320-360(üst sınır); kuyrukta kalır', () => {
  const e = kuyrukluOrtam();
  const beklenen = [5, 10, 20, 40, 80, 160, 320, 360, 360];
  const kodlar = [500, 429, 'ag', 502, 500, 429, 'ag', 500, 500];
  beklenen.forEach((dk, n) => {
    const once = e.k.saat;
    tur(e, kodlar[n]);
    assert.equal((q(e, REF).s - once) / DK, dk, `${n + 1}. deneme sonrası bekleme`);
    assert.equal(q(e, REF).d, n + 1);
    e.k.saat = q(e, REF).s;
  });
  assert.equal(sonuc(e, REF), null);
});
test('geçici hata sürerse 40. denemede bırakılır ve tek uyarı gelir; geri doldurma yeniden sıraya alır', () => {
  const e = kuyrukluOrtam();
  for (let n = 0; n < 45; n++) { tur(e, 500); const s = q(e, REF); if (s) e.k.saat = s.s; }
  assert.equal(e.istekler.length, 40);
  assert.equal(sonuc(e, REF), 'vazgecildi'); assert.equal(q(e, REF), null);
  assert.equal(e.mailler.length, 1);
  e.ctx.ihtidaPaneleGeriDoldur(false);
  assert.ok(q(e, REF), 'bırakılan, geri doldurmayla yeniden sıraya girer'); assert.equal(sonuc(e, REF), null);
});
test('401: 5 denemede bırakılır, TEK operatör uyarısı; uyarıda kişisel veri yok; sonraki turda tekrar uyarı yok', () => {
  const e = kuyrukluOrtam();
  for (let n = 1; n <= 5; n++) {
    const s = tur(e, 401);
    assert.equal(s.diger, 1, 'imza hatası turu bitirir');
    const kayit = q(e, REF); if (kayit) e.k.saat = kayit.s;
  }
  assert.equal(e.istekler.length, 5);
  assert.equal(sonuc(e, REF), 'imza-red'); assert.equal(q(e, REF), null);
  assert.equal(e.mailler.length, 1);
  const m = e.mailler[0];
  assert.ok(!/Çağla|cagla|1990|ihtida\.test/i.test(JSON.stringify(m)), 'uyarıda kişisel veri yok');
  assert.equal(m.kurum, 'cami'); assert.match(m.to, /info@ulucamii\.be/);
  // ikinci başvuru da 401 alır: ikinci uyarı gelmez
  defter(e.ctx, [{}, { 'Referans': 'IH-2026-0002' }]);
  e.ctx.ihtidaPaneleYansitKuyrugaAl('IH-2026-0002');
  for (let n = 1; n <= 5; n++) { tur(e, 401); const k2 = q(e, 'IH-2026-0002'); if (k2) e.k.saat = k2.s; }
  assert.equal(sonuc(e, 'IH-2026-0002'), 'imza-red');
  assert.equal(e.mailler.length, 1, 'tek uyarı');
});
test('401 ilk denemelerde geri çekilmeyle bekler (sır düzelirse sonraki deneme geçer)', () => {
  const e = kuyrukluOrtam();
  tur(e, 401); assert.equal(q(e, REF).i, 1);
  e.k.saat = q(e, REF).s; tur(e, 200);
  assert.equal(sonuc(e, REF), 'ok');
});
test('400: panel biçimi reddetti — yeniden denenmez, işaretlenir, tek uyarı (başvuru numarası var, kişisel veri yok)', () => {
  const e = kuyrukluOrtam({}, { 'Cami kimliği': KATALOG_PANELDE_YOK[0] });
  tur(e, 400);
  assert.equal(sonuc(e, REF), 'red-400'); assert.equal(q(e, REF), null); assert.equal(e.mailler.length, 1);
  assert.ok(!/Çağla|cagla|ihtida\.test/i.test(JSON.stringify(e.mailler[0])));
  assert.equal(e.ctx.ihtidaPaneleYansitKuyrugaAl(REF), true, '400 kesin sonuç değildir: düzeltilince yeniden sıraya alınabilir');
});
test('satır atlanır: küçük / eksik doğum / rıza yok → panele İSTEK GİTMEZ, sonuç «atlandi-…»', () => {
  for (const [ek, neden] of [[{ 'Doğum tarihi': '2011-01-01' }, 'kucuk'], [{ 'Doğum tarihi': '' }, 'dogum-eksik'], [{ 'Açık rıza': 'Hayır' }, 'riza-yok']]) {
    const e = kuyrukluOrtam({}, ek);
    tur(e);
    assert.equal(e.istekler.length, 0, neden);
    assert.equal(sonuc(e, REF), 'atlandi-' + neden); assert.equal(q(e, REF), null);
  }
});
test('satır defterde yoksa atlanır; zamanı gelmemiş öğe beklenir', () => {
  const e = kuyrukluOrtam();
  defter(e.ctx, []); // satır silindi
  tur(e); assert.equal(sonuc(e, REF), 'atlandi-satir-yok');
  const e2 = kuyrukluOrtam();
  e2.props.set('PANEL_YANSIT_KUYRUK_' + REF, JSON.stringify({ d: 1, i: 0, s: e2.k.saat + DK }));
  tur(e2); assert.equal(e2.istekler.length, 0);
});
test('zaman bütçesi: tur süre dolunca durur, kalanlar sonraki dakikaya kalır', () => {
  const e = ortam();
  defter(e.ctx, Array.from({ length: 4 }, (_, i) => ({ 'Referans': 'IH-2026-' + String(i + 1).padStart(4, '0') })));
  for (let i = 1; i <= 4; i++) e.ctx.ihtidaPaneleYansitKuyrugaAl('IH-2026-000' + i);
  e.ctx.ihtidaPanelSaat = () => { const t = e.k.saat; e.k.saat += 25000; return t; }; // her okuma 25 sn ilerletir
  e.ctx.ihtidaPaneleYansitKuyrukCalistir(e.k.saat);
  assert.ok(e.istekler.length >= 1 && e.istekler.length < 4, 'bütçe aşılınca kalan öğeler bırakıldı: ' + e.istekler.length);
});
test('kuyruk ve sonuç özelliklerinde yalnız ref + sayaç + zaman; bozuk kuyruk kaydı temizlenir', () => {
  const e = kuyrukluOrtam();
  tur(e, 500);
  assert.deepEqual(Object.keys(q(e, REF)).sort(), ['d', 'i', 's']);
  e.props.set('PANEL_YANSIT_KUYRUK_IH-2026-0009', '{bozuk');
  tur(e);
  assert.equal(e.props.has('PANEL_YANSIT_KUYRUK_IH-2026-0009'), false);
});

/* ───────────── 7. Dakika tetikleyicisi: sıra ve kilit ───────────── */

test('dakika tetikleyicisi: PDF paket işi ÖNCE, panel yansıtması SONRA; başvuru kilidi tutulmaz', async () => {
  const e = kuyrukluOrtam({ props: { 'IHTIDA_PAKET_IS_IH-2026-0001': 'dosya-1' } });
  const sira = [];
  e.k.saat = Date.now(); // tetikleyici gerçek saati başlangıç olarak verir; sahte saat onunla uyumlu olmalı
  e.ctx.ihtidaPaketIsle = async () => { sira.push('paket'); };
  const eskiFetch = e.ctx.UrlFetchApp.fetch;
  e.ctx.UrlFetchApp.fetch = (...a) => { sira.push('yansit'); return eskiFetch(...a); };
  await e.ctx.ihtidaPaketKuyrukCalistir();
  assert.deepEqual(sira, ['paket', 'yansit']);
  assert.deepEqual(e.k.kilitFetchte, [0], 'fetch sırasında betik kilidi yok');
});
test('yansıtma turu hata fırlatsa bile dakika tetikleyicisi bozulmaz', async () => {
  const e = kuyrukluOrtam();
  e.ctx.ihtidaPaneleYansitKuyrukCalistir = () => { throw new Error('beklenmedik'); };
  await assert.doesNotReject(() => e.ctx.ihtidaPaketKuyrukCalistir());
});

/* ───────────── 8. Başvuru yanıtı: kanca yalıtımı ───────────── */

function basvuruOrtami({ acik = true } = {}) {
  const e = ortam({ acik });
  const satirlar = [];
  const defterim = { satirlar, getLastRow: () => satirlar.length + 1, getLastColumn: () => e.ctx.BASLIKLAR2_IHTIDA.length,
    getRange: (r, c, nr, nc) => ({ getValues: () => satirlar.slice(r - 2, r - 2 + nr).map(s => Array.from({ length: nc }, (_, j) => s[c - 1 + j] ?? '')) }) };
  const paket = [];
  let sira = 100;
  Object.assign(e.ctx, {
    ihtidaV2SayfaGetir: () => defterim, ihtidaKlasorGetir: () => ({ createFile: () => ({ getUrl: () => 'https://example.test/arsiv' }) }),
    ihtidaCamiCoz: () => ({ id: 'ulucamii-marche', ad: 'Ulu Camii', sehir: 'Marche-en-Famenne', postaKodu: '6900', adres: 'Adres', kurum: '' }),
    ihtidaDogrulaV2: () => ({ tamam: true }), ihtidaGorselleriKaydet: () => [], pdfHtmlIhtida: () => '', htmlPdfUret: () => ({}),
    satirEkle: (s, satir) => { s.satirlar.push(satir); }, referansMaxBul: () => ++sira, v1SayfaBulTablo: () => null, ihtidaDefteriKirlet: () => {},
    ihtidaPaketKuyrugaAl: ref => { paket.push(ref); },
  });
  e.defter = defterim; e.paket = paket;
  return e;
}
let anahtarNo = 0;
const govde = ek => ({ tur: 'ihtida', sir: 'ULUCAMII-IHTIDA-2026', dil: 'fr', gonderimAnahtari: 'test-yansit-' + String(++anahtarNo).padStart(12, '0'),
  basvuran: { adSoyad: AD, eposta: EPOSTA }, sahitler: [{ ad: 'Birinci' }, { ad: 'İkinci' }], cami: 'ulucamii', onay: { acikRiza: true, beyan: AD, ek10Surumu: '2026-10' }, ...ek });

test('kanca: yansıtma kodu her şekilde patlasa başvuru yanıtı, satır ve paket kuyruğu AYNI kalır', () => {
  const temel = basvuruOrtami({ acik: true });
  const y0 = JSON.parse(JSON.stringify(temel.ctx.ihtidaPostIsleV2(govde())));
  assert.deepEqual(y0, { ok: true, ref: 'IH-2026-0101', tekrar: false, paket: 'sirada' });
  assert.ok(q(temel, 'IH-2026-0101'), 'anahtar açıkken kuyruğa girdi');

  for (const ariza of ['kuyrugaAl', 'guvenli-ic', 'properties']) {
    const e = basvuruOrtami({ acik: true });
    if (ariza === 'kuyrugaAl') e.ctx.ihtidaPaneleYansitKuyrugaAl = () => { throw new Error('patladi'); };
    if (ariza === 'guvenli-ic') e.ctx.ihtidaPanelAcikMi = () => { throw new Error('patladi'); };
    if (ariza === 'properties') e.ctx.ihtidaPanelOzellikler = () => { throw new Error('patladi'); };
    const y = JSON.parse(JSON.stringify(e.ctx.ihtidaPostIsleV2(govde())));
    assert.deepEqual(y, y0, `arıza: ${ariza}`);
    assert.equal(e.defter.satirlar.length, 1, 'satır yazıldı');
    assert.deepEqual(e.paket, ['IH-2026-0101'], 'paket kuyruğa alındı');
  }
  // kanca fonksiyonunun kendisi hiç tanımlı değilse (eski paket): yine aynı
  const e = basvuruOrtami({ acik: true });
  e.ctx.ihtidaPaneleYansitKuyrugaAlGuvenli = undefined;
  assert.deepEqual(JSON.parse(JSON.stringify(e.ctx.ihtidaPostIsleV2(govde()))), y0);
});
test('kanca: anahtar kapalıyken yanıt aynı ve hiçbir özellik yazılmaz; yinelenen gönderimde (tekrar) da aynı', () => {
  const e = basvuruOrtami({ acik: false });
  const g = govde();
  const y = JSON.parse(JSON.stringify(e.ctx.ihtidaPostIsleV2(g)));
  assert.deepEqual(y, { ok: true, ref: 'IH-2026-0101', tekrar: false, paket: 'sirada' });
  assert.deepEqual([...e.props.keys()].filter(k => !/^PANEL_YANSIT_(URL|SIR)$/.test(k)), [], 'özellik yazılmadı');
  // yinelenen gönderim: defterde aynı anahtar → tekrar yolu
  const y2 = JSON.parse(JSON.stringify(e.ctx.ihtidaPostIsleV2(g)));
  assert.equal(y2.tekrar, true); assert.equal(y2.ref, 'IH-2026-0101');
  const a = basvuruOrtami({ acik: true });
  a.ctx.ihtidaPaneleYansitKuyrugaAl = () => { throw new Error('patladi'); };
  a.ctx.ihtidaPostIsleV2(g); // satır yaz
  assert.deepEqual(JSON.parse(JSON.stringify(a.ctx.ihtidaPostIsleV2(g))), y2, 'tekrar yolunda da kanca yalıtılmış');
});

/* ───────────── 9. Geri doldurma ───────────── */

test('geri doldurma: varsayılan KURU KOŞU — yalnız sayaç; `false` verilse bile anahtar kapalıysa kuru; gerçek koşu yalnız ikisiyle', () => {
  const satirlar = [{}, { 'Referans': 'IH-2026-0002', 'Doğum tarihi': '2012-01-01' }, { 'Referans': 'IH-2026-0003', 'Doğum tarihi': '' }, { 'Referans': 'IH-2026-0004' }, { 'Referans': 'IH-2026-0005' }];
  const hazirla = acik => { const e = ortam({ acik }); defter(e.ctx, satirlar); e.props.set('PANEL_YANSIT_SONUC_IH-2026-0004', 'ok'); e.props.set('PANEL_YANSIT_KUYRUK_IH-2026-0005', JSON.stringify({ d: 0, i: 0, s: 0 })); return e; };
  const e = hazirla(true);
  const onceki = JSON.stringify([...e.props]);
  const kuru = JSON.parse(JSON.stringify(e.ctx.ihtidaPaneleGeriDoldur()));
  assert.deepEqual(kuru, { kip: 'kuru', toplam: 5, zatenTamam: 1, kuyrukta: 1, eklenecek: 1, atlanacak: 2, nedenler: { kucuk: 1, 'dogum-eksik': 1 } });
  assert.equal(JSON.stringify([...e.props]), onceki, 'kuru koşu hiçbir şey yazmaz');
  for (const arg of [undefined, null, 0, 'false', true, 1]) assert.equal(e.ctx.ihtidaPaneleGeriDoldur(arg).kip, 'kuru', String(arg));
  const kapali = hazirla(false);
  assert.equal(kapali.ctx.ihtidaPaneleGeriDoldur(false).kip, 'kuru', 'anahtar kapalı');
  assert.equal(q(kapali, 'IH-2026-0001'), null);
  const g = JSON.parse(JSON.stringify(e.ctx.ihtidaPaneleGeriDoldur(false)));
  assert.equal(g.kip, 'gercek'); assert.equal(g.eklenecek, 1);
  assert.ok(q(e, 'IH-2026-0001')); assert.equal(q(e, 'IH-2026-0002'), null);
  assert.equal(sonuc(e, 'IH-2026-0004'), 'ok', 'kesin sonuca dokunulmaz');
  assert.ok(!JSON.stringify(g).includes(AD) && !JSON.stringify(g).includes(EPOSTA), 'yalnız sayaç döner');
});

/* ───────────── 10. Kişisel veri sızıntısı taraması ───────────── */

test('günlük, özellikler, uyarı e-postaları ve geri dönüşlerde ad / e-posta / doğum tarihi yok', () => {
  const e = ortam();
  defter(e.ctx, [{}, { 'Referans': 'IH-2026-0002' }, { 'Referans': 'IH-2026-0003' }]);
  for (const r of ['IH-2026-0001', 'IH-2026-0002', 'IH-2026-0003']) e.ctx.ihtidaPaneleYansitKuyrugaAl(r);
  const donusler = [];
  donusler.push(tur(e, 500, 'ag', 401));
  e.k.saat += 24 * 60 * DK; donusler.push(tur(e, 400, 422, 200));
  e.ctx.ihtidaPaneleGeriDoldur(); donusler.push(e.ctx.ihtidaPaneleGeriDoldur(false));
  const hepsi = JSON.stringify([e.log, [...e.props].filter(([k]) => /^PANEL_YANSIT_(KUYRUK|SONUC|UYARI)_/.test(k)), e.mailler, donusler]);
  for (const yasak of ['Çağla', 'Örnek', 'cagla', 'ihtida.test', DOGUM, '1990', 'SIZMAZ', SIR, 'panel.example.test']) assert.ok(!hepsi.includes(yasak), `sızdı: ${yasak}`);
  assert.ok(e.log.length > 0, 'günlük hata kodları yazdı (kişisel veri olmadan)');
});
