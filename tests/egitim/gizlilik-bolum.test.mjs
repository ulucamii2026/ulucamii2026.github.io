/**
 * egitim.ulucamii.be/<dil>/gizlilik/ (11 Kasım 2026) — sayfanın tek kaynağı src/content/sayfalar/<dil>/gizlilik.md'dir (kopya yok). Bu test kaynak dosyalardan
 * dilimlerin hâlâ kesilebildiğini sabitler: `#ezber-kilimi` çapası ve onu izleyen bölümler düşerse (yeniden düzenleme) kırmızı olur; yoksa egitim derlemesi
 * kırılır ve sayfa sessizce boş kalmazdı. Ayrıca: iletişim bilgisi yalnız info@ulucamii.be ve cami hattı; din görevlisinin telefonu hiçbir yerde metin olarak yok.
 * Derlenmiş çıktı varsa (egitim/dist) sayfanın çıktısı da denetlenir; yoksa o kısım atlanır. Ağ kullanmaz.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const cikti = resolve('node_modules/.cache/gizlilik-bolumleri-test.mjs');
await build({ entryPoints: ['src/lib/gizlilik-bolumleri.ts'], outfile: cikti, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { gizlilikBolumleri, CAPA } = await import(pathToFileURL(cikti).href);

const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const kaynak = (d) => readFileSync(`src/content/sayfalar/${d}/gizlilik.md`, 'utf8');
const CAMI = '+32 472 98 50 73';

test('her dilde dilimler kesilir: veri sorumlusu bölümü, ardından çapadan sona İlim Yolu + haklar bölümleri', () => {
  for (const d of DILLER) {
    const dosya = kaynak(d);
    assert.ok(dosya.includes(CAPA), `${d}: ${CAPA} çapası kaynakta yok`);
    const { kontrolcu, ilim } = gizlilikBolumleri(dosya);
    assert.match(kontrolcu, /^## /, `${d}: kontrolcu ## ile başlar`);
    assert.equal((kontrolcu.match(/^## /gm) ?? []).length, 1, `${d}: kontrolcu tek bölüm`);
    assert.match(kontrolcu, /info@ulucamii\.be/, `${d}: kontrolcu e-postası`);
    assert.ok(ilim.startsWith(CAPA), `${d}: ilim çapayla başlar`);
    assert.ok((ilim.match(/^## /gm) ?? []).length >= 4, `${d}: ilim en az 4 bölüm (İlim Yolu, haklar, ihlal, şikâyet)`);
    assert.match(ilim, /info@ulucamii\.be/, `${d}: haklar bölümünde iletişim e-postası`);
    assert.match(ilim, /egitim\.ulucamii\.be/, `${d}: İlim Yolu bölümü`);
  }
});

test('çapa ya da bölüm düşerse dilimleme FIRLATIR (sessiz boş sayfa olmaz)', () => {
  const dosya = kaynak('tr');
  assert.throws(() => gizlilikBolumleri(dosya.replace(CAPA, '')), /çapası yok/);
  assert.throws(() => gizlilikBolumleri('---\nbaslik: x\n---\n\nmetin'), /veri sorumlusu/);
  assert.throws(() => gizlilikBolumleri(`---\nbaslik: x\n---\n\n## A\n\nb\n\n${CAPA}\n\nsonda bölüm yok`), /çapadan sonra/);
});

test('iletişim: yalnız info@ulucamii.be ve cami hattı; din görevlisinin telefonu metin olarak yok', () => {
  for (const d of DILLER) {
    const { kontrolcu, ilim } = gizlilikBolumleri(kaynak(d));
    const metin = `${kontrolcu}\n${ilim}`;
    for (const e of metin.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []) assert.match(e, /^(info@ulucamii\.be|noreply@ulucamii\.be)$/, `${d}: beklenmeyen adres ${e}`);
    // Telefon biçimli diziler (uluslararası ya da 0 ile başlayan, en az 9 rakam) varsa yalnız cami hattı olabilir.
    const gerekli = (metin.match(/\+?\d[\d .()/-]{7,}\d/g) ?? []).filter((x) => x.replace(/\D/g, '').length >= 9 && !/^\d{4}-\d{2}-\d{2}$/.test(x));
    for (const t of gerekli) assert.equal(t.trim(), CAMI, `${d}: beklenmeyen telefon ${t}`);
  }
});

const dist = (y) => `egitim/dist/${y}`;
const atla = !existsSync(dist('tr/gizlilik/index.html')) && 'önce npm run egitim:build';

test('derlenmiş sayfa: dizine girer, kendi kanonik adresi, tam metne bağlantı, çapa, beş dilde hreflang', { skip: atla }, () => {
  for (const d of DILLER) {
    const html = readFileSync(dist(`${d}/gizlilik/index.html`), 'utf8');
    assert.equal(/<meta name="robots" content="[^"]*noindex/.test(html), false, `${d}: noindex olmamalı`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://egitim\\.ulucamii\\.be/${d}/gizlilik/">`), `${d}: kanonik`);
    assert.match(html, /id="ezber-kilimi"/, `${d}: çapa`);
    assert.match(html, /href="https:\/\/ulucamii\.be\/[a-z]{2}\/[a-z-]+\/"/, `${d}: tam metne bağlantı`);
    assert.equal((html.match(/rel="alternate" hreflang=/g) ?? []).length, 6, `${d}: 5 dil + x-default`);
    assert.ok(html.includes('info@ulucamii.be') && html.includes(CAMI), `${d}: iletişim`);
    assert.equal(/<[^>]+\sstyle=/.test(html), false, `${d}: style özniteliği (CSP)`);
  }
  // Alt bilgi ve hesap sayfaları yeni sayfaya bağlanır
  for (const d of DILLER) {
    assert.match(readFileSync(dist(`${d}/index.html`), 'utf8'), new RegExp(`href="/${d}/gizlilik/"`), `${d}: alt bilgi bağlantısı`);
    assert.match(readFileSync(dist(`${d}/hesap/index.html`), 'utf8'), new RegExp(`/${d}/gizlilik/#ezber-kilimi`), `${d}: hesap sayfası bağlantısı`);
  }
});
