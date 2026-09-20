/** Apps Script v36 — çeviri ucu + özellik bakımı sözleşmesi (14 Eyl 2026, 2–3): motor seçimi, Gemini → Google Translate yedeği,
 *  yetki, sınırlar. Arka ucun SAF bölümü Node'da çalıştırılır; UrlFetchApp / LanguageApp / Properties sahtedir. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = ['kimlik-sabitler.gs', 'veli-eposta-sablon.gs', 'ulucamii-Kod-v38.gs', 'veli-mail-listesi.gs', 'veli-cuma.gs']
  .map((ad) => readFileSync(new URL('../scripts/apps-script/' + ad, import.meta.url), 'utf8')).join('\n');

const ContentService = { createTextOutput: (t) => ({ setMimeType() { return this; }, getContent: () => t }), MimeType: { JSON: 'json' } };
const yanit = (kod, govde) => ({ getResponseCode: () => kod, getContentText: () => (typeof govde === 'string' ? govde : JSON.stringify(govde)) });
const JETON = 'x'.repeat(120);

/** Sahte ağ: Identity Toolkit → hoca; Firestore hocalar/{uid} → belge var; Gemini → verilen senaryo. */
function backend({ ozellikler = {}, gemini = [], translate = (m) => `GT(${m})`, webAnahtar = 'web-anahtar' } = {}) {
  if (webAnahtar) ozellikler = { FIREBASE_WEB_API_KEY: webAnahtar, ...ozellikler };
  const istekler = [], uykular = [];
  const UrlFetchApp = {
    fetch(url, opt = {}) {
      istekler.push({ url, opt });
      if (url.includes('identitytoolkit')) { if (!url.includes('key=web-anahtar')) return yanit(400, {}); return yanit(200, { users: [{ localId: 'HOCA-UID' }] }); }
      if (url.includes('/hocalar/')) return yanit(200, { name: 'x', fields: { eposta: { stringValue: 'imam@ulucamii.be' } } });
      if (url.includes('generativelanguage')) {
        const s = gemini.shift();
        if (!s) return yanit(503, { error: { message: 'high demand' } });
        if (s.kod) return yanit(s.kod, s.govde || {});
        return yanit(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(s.dizi) }] } }] });
      }
      throw new Error('beklenmeyen istek ' + url);
    },
  };
  const ctx = vm.createContext({
    console: { ...console, warn: () => {} },
    ContentService,
    UrlFetchApp,
    LanguageApp: { translate: (m) => translate(m) },
    ScriptApp: { getOAuthToken: () => 'oauth' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => ozellikler[k] ?? null, setProperty: (k, d) => { ozellikler[k] = d; }, deleteProperty: (k) => { delete ozellikler[k]; }, getProperties: () => ({ ...ozellikler }) }) },
    Utilities: { newBlob: (s) => ({ getBytes: () => Buffer.from(s) }), sleep: (ms) => { uykular.push(ms); }, formatDate: () => '2026-09-14' },
  });
  vm.runInContext(source, ctx);
  const ayar = (govde) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ tur: 'ceviri-ayar', ...govde }) } }).getContent());
  const cevir = (metinler, extra = {}) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ tur: 'cevir', idToken: JETON, hedef: 'fr', metinler, ...extra }) } }).getContent());
  return { ctx, istekler, cevir, ayar, ozellikler, uykular };
}

test('sağlık ucu v36: ceviriMotoru anahtara göre gemini / translate / kapali', () => {
  assert.equal(JSON.parse(backend().ctx.doGet({}).getContent()).surum, 38);
  assert.equal(JSON.parse(backend().ctx.doGet({}).getContent()).ceviriMotoru, 'translate');
  assert.equal(JSON.parse(backend({ ozellikler: { GEMINI_API_KEY: 'k' } }).ctx.doGet({}).getContent()).ceviriMotoru, 'gemini');
  assert.equal(JSON.parse(backend({ ozellikler: { GEMINI_API_KEY: 'k', CEVIRI_MOTOR: 'translate' } }).ctx.doGet({}).getContent()).ceviriMotoru, 'translate');
  assert.equal(JSON.parse(backend({ ozellikler: { GEMINI_API_KEY: 'k', CEVIRI_KAPALI: '1' } }).ctx.doGet({}).getContent()).ceviriMotoru, 'kapali');
});

test('Gemini birincil: istem, düşük düşünme, JSON dizi; yanıt ceviriDuzelt\'ten geçer; yer tutucu korunur', () => {
  const b = backend({ ozellikler: { GEMINI_API_KEY: 'gizli' }, gemini: [{ dizi: ['[[1]] était absent au cours , mais a bien travaillé .', 'Le prophète Mahomet a dit: bonjour'] }] });
  const r = b.cevir(['[[1]] derste yoktu, ama iyi çalıştı.', 'Peygamber Muhammed dedi ki: merhaba']);
  assert.equal(r.ok, true);
  assert.equal(r.motor, 'gemini-3.5-flash-lite');
  assert.deepEqual(r.ceviriler, ['[[1]] était absent au cours, mais a bien travaillé.', 'Le prophète Muhammad a dit : bonjour']);
  const g = b.istekler.find((x) => x.url.includes('generativelanguage'));
  assert.ok(g.url.includes('/models/gemini-3.5-flash-lite:generateContent?key=gizli'));
  const govde = JSON.parse(g.opt.payload);
  assert.equal(govde.generationConfig.thinkingConfig, undefined, 'lite düşünme ayarı almaz');
  assert.equal(govde.generationConfig.responseMimeType, 'application/json');
  assert.match(govde.systemInstruction.parts[0].text, /votre enfant/);
  assert.match(govde.systemInstruction.parts[0].text, /never Mahomet/);
  assert.match(govde.systemInstruction.parts[0].text, /never replace a name with a placeholder/);
  assert.deepEqual(JSON.parse(govde.contents[0].parts[0].text), ['[[1]] derste yoktu, ama iyi çalıştı.', 'Peygamber Muhammed dedi ki: merhaba']);
  assert.ok(!b.istekler.some((x) => x.url.includes('translate')), 'Google Translate çağrılmadı');
});

test('Gemini düşerse (503 / sayı tutmaz / boş öğe) sıradaki model, sonra Google Translate; kapalıysa hata kodu', () => {
  // 1. model (lite) 503 ×2, 2. model (3.6-flash, düşük düşünme) tamam
  let b = backend({ ozellikler: { GEMINI_API_KEY: 'k' }, gemini: [{ kod: 503 }, { kod: 503 }, { dizi: ['A', 'B'] }] });
  let r = b.cevir(['a', 'b']);
  assert.equal(r.motor, 'gemini-3.6-flash');
  assert.deepEqual(r.ceviriler, ['A', 'B']);
  assert.equal(JSON.parse(b.istekler.filter((x) => x.url.includes('generativelanguage'))[2].opt.payload).generationConfig.thinkingConfig.thinkingLevel, 'low', '3.6-flash düşük düşünme');
  // 429/503 aynı modelde bir kez daha denenir (1,5 s), sonra sıradaki: lite 429 → lite tamam
  b = backend({ ozellikler: { GEMINI_API_KEY: 'k' }, gemini: [{ kod: 429 }, { dizi: ['A'] }] });
  r = b.cevir(['a']);
  assert.equal(r.motor, 'gemini-3.5-flash-lite');
  assert.deepEqual(b.uykular, [1500]);
  assert.equal(b.istekler.filter((x) => x.url.includes('generativelanguage')).length, 2);
  // lite 503 ×2 → 3.6-flash 503 ×2 → Translate (dört istek, iki uyku)
  b = backend({ ozellikler: { GEMINI_API_KEY: 'k' }, gemini: [{ kod: 503 }, { kod: 503 }, { kod: 503 }, { kod: 503 }] });
  r = b.cevir(['a']);
  assert.equal(r.motor, 'translate');
  assert.equal(b.istekler.filter((x) => x.url.includes('generativelanguage')).length, 4);
  // sayı tutmuyor + boş öğe → Translate
  b = backend({ ozellikler: { GEMINI_API_KEY: 'k' }, gemini: [{ dizi: ['A'] }, { dizi: ['A', ''] }] });
  r = b.cevir(['a', 'b']);
  assert.equal(r.motor, 'translate');
  assert.deepEqual(r.ceviriler, ['GT(a)', 'GT(b)']);
  // CEVIRI_MODEL özelliği model listesini değiştirir
  b = backend({ ozellikler: { GEMINI_API_KEY: 'k', CEVIRI_MODEL: 'gemini-9-flash' }, gemini: [{ dizi: ['A'] }] });
  r = b.cevir(['a']);
  assert.equal(r.motor, 'gemini-9-flash');
  // anahtar yoksa doğrudan Translate; kapalıysa hata
  b = backend();
  assert.deepEqual(b.cevir(['a']), { ok: true, hedef: 'fr', ceviriler: ['GT(a)'], motor: 'translate' });
  assert.equal(backend({ ozellikler: { CEVIRI_KAPALI: '1' } }).cevir(['a']).hata, 'ceviri-kapali');
});

test('sınırlar ve yetki: hedef, metin sayısı/uzunluğu, kısa/yanlış belirteç', () => {
  const b = backend({ ozellikler: { GEMINI_API_KEY: 'k' } });
  assert.equal(b.cevir(['a'], { hedef: 'de' }).hata, 'hedef-gecersiz');
  assert.equal(b.cevir([]).hata, 'metin-sayisi');
  assert.equal(b.cevir(Array.from({ length: 21 }, () => 'a')).hata, 'metin-sayisi');
  assert.equal(b.cevir(['x'.repeat(1801)]).hata, 'metin-uzunlugu');
  assert.equal(b.cevir(['a'], { idToken: 'kısa' }).hata, 'yetkisiz');
  assert.ok(!b.istekler.some((x) => x.url.includes('generativelanguage')), 'yetkisiz istekte Gemini çağrılmaz');
  // FIREBASE_WEB_API_KEY tanımsız → doğrulama kapalı (yetkisiz), Identity Toolkit hiç çağrılmaz
  const k = backend({ ozellikler: { GEMINI_API_KEY: 'k' }, webAnahtar: '' });
  assert.equal(k.cevir(['a']).hata, 'yetkisiz');
  assert.ok(!k.istekler.some((x) => x.url.includes('identitytoolkit')));
});

test('ceviri-ayar ucu: panel anahtarıyla dört çeviri ayarı yazılır/silinir; gizli değer geri okunmaz; yetkisiz ve yabancı ad reddedilir', () => {
  const b = backend({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli' } });
  assert.equal(b.ayar({ anahtar: 'yanlis', ayarlar: { CEVIRI_MOTOR: 'translate' } }).hata, 'yetkisiz');
  assert.equal(b.ayar({ ayarlar: { CEVIRI_MOTOR: 'translate' } }).hata, 'yetkisiz');
  assert.equal(b.ayar({ anahtar: 'panel-gizli', ayarlar: { BREVO_API_KEY: 'x' } }).hata, 'ayar-gecersiz');
  assert.equal(b.ayar({ anahtar: 'panel-gizli', ayarlar: { CEVIRI_MODEL: 'x'.repeat(513) } }).hata, 'deger-gecersiz');
  assert.equal(b.ozellikler.BREVO_API_KEY, undefined, 'yabancı ad yazılmadı');
  let r = b.ayar({ anahtar: 'panel-gizli', ayarlar: { GEMINI_API_KEY: 'AIza-gizli', CEVIRI_MODEL: 'gemini-9-flash' } });
  assert.deepEqual(r, { ok: true, yazilan: ['GEMINI_API_KEY', 'CEVIRI_MODEL'], ayarlar: { GEMINI_API_KEY: 'var', CEVIRI_MOTOR: '', CEVIRI_MODEL: 'gemini-9-flash', CEVIRI_KAPALI: '', FIREBASE_WEB_API_KEY: 'web-anahtar' }, motor: 'gemini' });
  assert.ok(!JSON.stringify(r).includes('AIza-gizli'), 'anahtar yanıtta yok');
  assert.equal(JSON.parse(b.ctx.doGet({}).getContent()).ceviriMotoru, 'gemini');
  r = b.ayar({ anahtar: 'panel-gizli', ayarlar: { GEMINI_API_KEY: '', CEVIRI_MODEL: null } });
  assert.deepEqual(r.ayarlar, { GEMINI_API_KEY: 'yok', CEVIRI_MOTOR: '', CEVIRI_MODEL: '', CEVIRI_KAPALI: '', FIREBASE_WEB_API_KEY: 'web-anahtar' });
  assert.equal(r.motor, 'translate');
  // Panel anahtarı tanımlı değilse uç kapalı (gömülü yedek değer geçmez)
  assert.equal(backend().ayar({ anahtar: 'SCRIPT-PROPERTIES-ICINDE', ayarlar: {} }).hata, 'yetkisiz');
});

test('ozellik-bakim ucu (v36): panel anahtarıyla veli-cuma özellikleri cuma başına tek kayda katlanır; yanıt yalnız adlar ve sayılar', () => {
  const b = backend({ ozellikler: { PANEL_ANAHTARI: 'panel-gizli', 'VELI_CUMA_GONDERIM_2026-09-11_h1': JSON.stringify({ durum: 'saglayici-kabul', messageId: 'm1' }), 'VELI_CUMA_GONDERIM_2026-09-11_h2': JSON.stringify({ durum: 'belirsiz' }), VELI_CUMA_FR_x: 'Les lettres', BREVO_API_KEY: 'gizli-brevo' } });
  const bakim = (ctx, govde) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ tur: 'ozellik-bakim', ...govde }) } }).getContent());
  assert.equal(bakim(b.ctx, { anahtar: 'yanlis' }).hata, 'yetkisiz');
  assert.equal(bakim(b.ctx, {}).hata, 'yetkisiz');
  assert.equal(b.ozellikler.VELI_CUMA_FR_x, 'Les lettres', 'yetkisiz çağrı hiçbir şeyi silmedi');
  const r = bakim(b.ctx, { anahtar: 'panel-gizli' });
  assert.deepEqual(r, { ok: true, katlanan: 2, silinen: 1, toplam: 4, adlar: ['BREVO_API_KEY', 'FIREBASE_WEB_API_KEY', 'PANEL_ANAHTARI', 'VELI_CUMA_GONDERIM_2026-09-11'] });
  assert.ok(!JSON.stringify(r).includes('gizli-brevo') && !JSON.stringify(r).includes('panel-gizli'), 'değerler yanıtta yok');
  assert.deepEqual(JSON.parse(b.ozellikler['VELI_CUMA_GONDERIM_2026-09-11']), { h1: { durum: 'saglayici-kabul', messageId: 'm1' }, h2: { durum: 'belirsiz' } });
  assert.deepEqual(bakim(b.ctx, { anahtar: 'panel-gizli' }), { ok: true, katlanan: 0, silinen: 0, toplam: 4, adlar: r.adlar }, 'ikinci çağrı değişiklik yapmaz');
  // Panel anahtarı tanımlı değilse uç kapalı
  assert.equal(bakim(backend().ctx, { anahtar: 'SCRIPT-PROPERTIES-ICINDE' }).hata, 'yetkisiz');
});
