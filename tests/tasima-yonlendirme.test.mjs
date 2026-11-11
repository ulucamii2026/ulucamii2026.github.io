/**
 * Dilim 4 · P7a — ulucamii.be → egitim.ulucamii.be yönlendirme sayfaları (src/components/EgitimeYonlendir.astro, src/lib/egitim-tasima.ts).
 * Bağlayıcı: (1) eski her adres (5 dil × 6 sayfa, /hoca/, /e/ ve basılı 74 karekodun 73'ü; `test` kodu ulucamii.be'de kalır) bir yönlendirme sayfasıdır;
 * (2) sorgu + çapa (ör. ?mode=signIn&oobCode=…#…) aynen taşınır; (3) sayaç, harici betik, stil dosyası ve ağ isteği YOK, referrer yok;
 * (4) noindex + kanonik = egitim adresi, betiksiz yedek; (5) bu cihazda eşitlenmemiş yazım varsa hesap sayfaları durur ve tek seferlik uyarı çıkar;
 * (6) yönlendirme sayfaları ana sitenin site haritasında yok. Derleme (`npm run build`) yoksa derleme sınamaları atlanır. Ağ kullanmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
async function yukle(ad, girdi) {
  const cikti = resolve(`node_modules/.cache/${ad}.mjs`);
  await build({ stdin: { contents: girdi, resolveDir: process.cwd() }, outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  return import(pathToFileURL(cikti).href + `?t=${Date.now()}`);
}
const m = await yukle('tasima-yonlendirme-test', `
  export { yollar, diller } from './src/i18n/ui.ts';
  export * from './src/lib/egitim-tasima.ts';
`);

const oku = (y) => readFileSync(y, 'utf8');
const dist = (y) => `dist/${y}`;
const DILLER = Object.keys(m.diller);
const KODLAR = JSON.parse(oku('tests/fixtures/e-kodlari-basili.json')).kodlar;
const atla = !existsSync(dist('hoca/index.html')) && 'önce npm run build';
const TASINAN = Object.keys(m.EGITIM_SAYFALARI);

test('egitim-tasima tablosu egitim/src/lib/kurs-yollari.ts ile aynı; veli tek hesap sayfası; basılı liste 74', () => {
  const kurs = oku('egitim/src/lib/kurs-yollari.ts');
  const tablo = Object.fromEntries([...kurs.match(/KURS_YOLLARI[^{]*\{([^}]*)\}/)[1].matchAll(/(\w+):\s*'([^']+)'/g)].map((x) => [x[1], x[2]]));
  assert.deepEqual(tablo, m.EGITIM_SAYFALARI);
  assert.deepEqual([...m.HESAP_SAYFALARI], ['veli']);
  assert.equal(TASINAN.length, 6);
  assert.equal(KODLAR.length, 74);
  assert.equal(m.TASIMA_ACIK, true, 'branş anahtarı: yayın hâli açık');
});

const tumYonlendirmeler = () => {
  const liste = [];
  for (const dil of DILLER) for (const anahtar of TASINAN) liste.push({ dosya: dist(`${dil}/${m.yollar[anahtar][dil]}/index.html`), hedef: m.egitimAdresi(dil, anahtar), hesap: m.HESAP_SAYFALARI.includes(anahtar), ad: `${dil}/${anahtar}` });
  liste.push({ dosya: dist('hoca/index.html'), hedef: 'https://egitim.ulucamii.be/hoca/', hesap: true, ad: 'hoca' });
  liste.push({ dosya: dist('e/index.html'), hedef: 'https://egitim.ulucamii.be/e/', hesap: false, ad: 'e/' });
  for (const kod of KODLAR.filter((k) => k !== 'test')) liste.push({ dosya: dist(`e/${kod}/index.html`), hedef: `https://egitim.ulucamii.be/e/${kod}/`, hesap: false, ad: `e/${kod}` });
  return liste;
};

test('30 kurs/veli sayfası + /hoca/ + /e/ + 73 karekod: hepsi yönlendirme sayfası, hedef doğru', { skip: atla }, () => {
  const liste = tumYonlendirmeler();
  assert.equal(liste.length, 30 + 1 + 1 + 73);
  for (const { dosya, hedef, hesap, ad } of liste) {
    assert.ok(existsSync(dosya), `${ad}: ${dosya} yok`);
    const html = oku(dosya);
    assert.match(html, new RegExp(`id="yonlendir" data-hedef="${hedef.replace(/[.?+]/g, '\\$&')}" data-hesap="${hesap ? 1 : 0}"`), `${ad}: hedef`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, `${ad}: noindex`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${hedef.replace(/[.?+]/g, '\\$&')}"`), `${ad}: kanonik egitim`);
    assert.match(html, /<meta name="referrer" content="no-referrer"/, `${ad}: referrer`);
    // Betiksiz yedek: kamuda meta refresh, hesapta yalnız bağlantı (sorgu statik HTML'de bilinemez).
    if (hesap) assert.equal(/http-equiv="refresh"/.test(html), false, `${ad}: hesap sayfasında meta refresh olmamalı`);
    else assert.match(html, /<noscript><meta http-equiv="refresh" content="0;url=https:\/\/egitim\.ulucamii\.be\//, `${ad}: noscript yedeği`);
    assert.match(html, new RegExp(`<a id="git" class="dugme birincil" href="${hedef.replace(/[.?+]/g, '\\$&')}"`), `${ad}: düz bağlantı`);
  }
});

test('Yönlendirme sayfalarında sayaç, harici betik, stil dosyası, görsel, ağ isteği YOK (oobCode hiçbir yere gitmez)', { skip: atla }, () => {
  for (const { dosya, ad } of tumYonlendirmeler()) {
    const html = oku(dosya);
    assert.equal(/goatcounter|sayac\.js|vendor\//i.test(html), false, `${ad}: sayaç`);
    assert.equal(/<script[^>]*\ssrc=/i.test(html), false, `${ad}: harici betik`);
    assert.equal(/<link[^>]+rel="(?:stylesheet|preload|modulepreload|prefetch|manifest|alternate)"/i.test(html), false, `${ad}: dış kaynak bağlantısı`);
    assert.equal(/<(?:img|iframe|video|audio|source|form|object|embed)\b/i.test(html), false, `${ad}: ağ isteği doğuran öğe`);
    assert.equal(/\ssrc=|https?:\/\/(?!egitim\.ulucamii\.be)/i.test(html.replace(/<style[\s\S]*?<\/style>/g, '')), false, `${ad}: egitim dışı adres`);
    assert.ok(html.length < 12000, `${ad}: sayfa küçük kalmalı`);
  }
});

test('/e/test/ ulucamii.be’de kalır (seviye testine yönlenir, egitim’e gitmez)', { skip: atla }, () => {
  const html = oku(dist('e/test/index.html'));
  assert.equal(html.includes('id="yonlendir"'), false);
  assert.match(html, /http-equiv="refresh" content="0;url=\/fr\/test-de-niveau\/"|test-de-niveau/);
});

test('Ana sitenin site haritasında yönlendirme sayfası yok', { skip: atla }, () => {
  const dosyalar = readdirSync('dist').filter((a) => /^sitemap-\d+\.xml$/.test(a));
  assert.ok(dosyalar.length >= 1, 'sitemap-0.xml yok');
  const adresler = dosyalar.flatMap((a) => [...oku(dist(a)).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => new URL(x[1]).pathname));
  assert.ok(adresler.length > 100);
  for (const yol of adresler) {
    const dosya = dist(`${yol.replace(/^\//, '')}index.html`);
    if (existsSync(dosya)) assert.equal(oku(dosya).includes('id="yonlendir"'), false, `haritada yönlendirme sayfası: ${yol}`);
  }
});

// --- Betik davranışı (aynı satır içi betik vm içinde koşar) ---
function sahte(html, { search = '', hash = '', depo = {} } = {}) {
  const betik = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(betik, 'satır içi yönlendirme betiği yok');
  const oznitelik = Object.fromEntries([...html.match(/<main id="yonlendir"([^>]*)>/)[1].matchAll(/(data-[\w-]+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
  const ogeler = {};
  const oge = (ad, ek = {}) => (ogeler[ad] ??= { hidden: false, href: '', dinleyiciler: {}, getAttribute: (k) => oznitelik[k], addEventListener(t, f) { this.dinleyiciler[t] = f; }, ...ek });
  const kayit = { replace: [] };
  const depoNesne = { ...depo };
  const localStorage = {
    getItem: (k) => (k in depoNesne ? depoNesne[k] : null), setItem: (k, v) => { depoNesne[k] = String(v); },
    key: (i) => Object.keys(depoNesne)[i] ?? null, get length() { return Object.keys(depoNesne).length; },
  };
  const location = { search, hash, replace: (u) => kayit.replace.push(u) };
  const document = { getElementById: (ad) => oge(ad, ad === 'yonlendir' ? { getAttribute: (k) => oznitelik[k] } : {}) };
  vm.runInNewContext(betik, { document, location, window: { localStorage }, JSON, Array, Object, RegExp });
  return { kayit, ogeler, depoNesne };
}
const hesapSayfasi = () => oku(dist('tr/veli-portali/index.html'));
const kamuSayfasi = () => oku(dist('tr/kuran-kursu/index.html'));
const GIRIS = '?apiKey=KEY&oobCode=TEST&mode=signIn&lang=tr';

test('Betik: sorgu ve çapa aynen taşınır (e-posta giriş bağlantısı, kitap çapası)', { skip: atla }, () => {
  const a = sahte(hesapSayfasi(), { search: GIRIS, hash: '#x' });
  assert.deepEqual(a.kayit.replace, [`https://egitim.ulucamii.be/tr/veli/${GIRIS}#x`]);
  const b = sahte(kamuSayfasi(), { hash: '#ders-kitaplari' });
  assert.deepEqual(b.kayit.replace, ['https://egitim.ulucamii.be/tr/kurs/#ders-kitaplari']);
  const c = sahte(kamuSayfasi());
  assert.deepEqual(c.kayit.replace, ['https://egitim.ulucamii.be/tr/kurs/']);
  assert.equal(c.ogeler.git.href, 'https://egitim.ulucamii.be/tr/kurs/');
});

test('Betik: bekleyen yazım varsa hesap sayfası durur, uyarı tek seferdir; kamu sayfası hiç durmaz', { skip: atla }, () => {
  const bekleyen = { 'ulucamii.ezber.bekleyen.v1': JSON.stringify([{ ref: 'a', olayId: 'b', id: 'c', tur: 'd', kalite: 'e', zaman: 1 }]) };
  const a = sahte(hesapSayfasi(), { search: GIRIS, depo: bekleyen });
  assert.deepEqual(a.kayit.replace, [], 'uyarı varken yönlendirilmemeli');
  assert.equal(a.ogeler.uyari.hidden, false);
  assert.equal(a.ogeler.duz.hidden, true);
  assert.equal(a.ogeler['uyari-gec'].href, `https://egitim.ulucamii.be/tr/veli/${GIRIS}`);
  a.ogeler['uyari-gec'].dinleyiciler.click({ preventDefault() {} });
  assert.deepEqual(a.kayit.replace, [`https://egitim.ulucamii.be/tr/veli/${GIRIS}`]);
  assert.equal(a.depoNesne['ulucamii.tasima.uyari.v1'], '1');
  // Aynı cihaz ikinci kez: bayrak var → uyarısız yönlendirme.
  const b = sahte(hesapSayfasi(), { depo: { ...bekleyen, 'ulucamii.tasima.uyari.v1': '1' } });
  assert.equal(b.kayit.replace.length, 1);
  // Atölye kuyruğu da sayılır; boş kuyruk sayılmaz.
  const c = sahte(oku(dist('hoca/index.html')), { depo: { 'ulucamii_ogrenme_v1:hesap:ref:bekleyen': '{"k1":{"cevap":"d"}}' } });
  assert.deepEqual(c.kayit.replace, []);
  const d = sahte(oku(dist('hoca/index.html')), { depo: { 'ulucamii_ogrenme_v1:hesap:ref:bekleyen': '{}', 'ulucamii.ezber.bekleyen.v1': '[]' } });
  assert.deepEqual(d.kayit.replace, ['https://egitim.ulucamii.be/hoca/']);
  const e = sahte(kamuSayfasi(), { depo: bekleyen });
  assert.equal(e.kayit.replace.length, 1, 'kamu sayfası uyarı göstermez');
  // Bozuk depolama içeriği yönlendirmeyi engellemez.
  const f = sahte(hesapSayfasi(), { depo: { 'ulucamii.ezber.bekleyen.v1': '{bozuk' } });
  assert.equal(f.kayit.replace.length, 1);
});
