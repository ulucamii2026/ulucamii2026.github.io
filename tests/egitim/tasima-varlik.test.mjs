/**
 * Dilim 4 / P1 varlıkları: veli portalı ve hoca ekranı egitim.ulucamii.be'de çalışırken kullandığı dosyalar bu kökende bulunur ve sıkı CSP'ye (`img-src 'self'`,
 * `style-src 'self'`) takılmaz. Derleme gerektirmez (kaynak taraması).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const oku = (y) => readFileSync(y, 'utf8');

test('betiklerin başvurduğu /media/mektep/* resimleri egitim/public altında var', () => {
  const dosyalar = [...readdirSync('src/scripts').filter((d) => d.endsWith('.ts')).map((d) => `src/scripts/${d}`), ...readdirSync('src/lib').filter((d) => d.endsWith('.ts')).map((d) => `src/lib/${d}`)];
  const istenen = new Set();
  for (const d of dosyalar) for (const m of oku(d).matchAll(/\/media\/mektep\/([\w.-]+\.(?:webp|png|gif|jpg|svg))/g)) istenen.add(m[1]);
  assert.ok(istenen.size >= 5, 'betiklerde mektep resmi bulunamadı: tarama bozuk olabilir');
  for (const f of istenen) assert.ok(existsSync(`egitim/public/media/mektep/${f}`), `egitim/public/media/mektep/${f} yok`);
});

test('egitim CSS dosyaları (veli, hoca, uyum) data: adresi ve satır içi stil taşımaz; bağlı svg dosyası var', () => {
  for (const f of ['veli', 'hoca', 'uyum-jetonlari']) {
    const css = oku(`egitim/src/styles/${f}.css`);
    assert.doesNotMatch(css, /url\(\s*["']?data:/i, `${f}.css içinde data: adresi (CSP img-src 'self' engeller)`);
    for (const m of css.matchAll(/url\(\s*["']?(\/[^)"']+)["']?\s*\)/g)) assert.ok(existsSync(`egitim/public${m[1]}`) || existsSync(`egitim${m[1]}`), `${f}.css: ${m[1]} yok`);
  }
});

test('veli manifestleri beş dilde /<dil>/veli/ kapsamında ve Kilim renklerinde; ikonlar var', () => {
  for (const d of ['tr', 'fr', 'en', 'nl', 'de']) {
    const m = JSON.parse(oku(`egitim/public/portal/veli-${d}.webmanifest`));
    assert.equal(m.start_url, `/${d}/veli/`);
    assert.equal(m.scope, `/${d}/veli/`);
    assert.equal(m.lang, d);
    assert.equal(m.theme_color, '#9B2C22');
    for (const i of m.icons) assert.ok(existsSync(`egitim/public${i.src}`), i.src);
  }
});

test('veli ve hoca sayfaları robots.txt ile DEĞİL, noindex başlığıyla dizinden çıkar (G-12: yasaklı adres meta noindex\'i göstermez); üst/alt bilgi veli portalına bağlanır (Dilim 4 geçişi), hoca ekranına HİÇ bağlanmaz', () => {
  const r = oku('egitim/public/robots.txt');
  assert.doesNotMatch(r, /Disallow: \/hoca\/|Disallow: \/\*\/veli\//);
  const basliklar = JSON.parse(oku('firebase.json')).hosting.find((h) => h.site === 'ulucamii-egitim').headers;
  for (const kaynak of ['/hoca/**', '/*/veli/**']) {
    const k = basliklar.find((b) => b.source === kaynak);
    assert.deepEqual(k?.headers, [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }], kaynak);
  }
  for (const f of ['egitim/src/components/UstBilgi.astro', 'egitim/src/components/AltBilgi.astro']) {
    assert.match(oku(f), /\/veli\//, `${f}: veli bağlantısı`);
    assert.doesNotMatch(oku(f), /\/hoca\//, `${f}: hoca ekranına bağlanmamalı`);
  }
});

test('uygulama manifesti beş dilde: Türkçe eski adında, diğerleri manifest.<dil>.webmanifest; aynı anahtarlar, id/kapsam/simge/renk aynı, metinler dilde', () => {
  const yol = (d) => `egitim/public/manifest${d === 'tr' ? '' : `.${d}`}.webmanifest`;
  const tr = JSON.parse(oku(yol('tr')));
  const metinler = new Set();
  for (const d of ['tr', 'fr', 'en', 'nl', 'de']) {
    const m = JSON.parse(oku(yol(d)));
    assert.deepEqual(Object.keys(m), Object.keys(tr), `${d}: anahtarlar`);
    assert.equal(m.lang, d);
    assert.equal(m.start_url, d === 'tr' ? '/' : `/${d}/`);
    for (const k of ['id', 'scope', 'display', 'theme_color', 'background_color', 'icons']) assert.deepEqual(m[k], tr[k], `${d}: ${k}`);
    assert.ok(m.name.length > m.short_name.length && m.short_name && m.description, `${d}: metinler`);
    for (const k of ['name', 'short_name', 'description']) metinler.add(m[k]);
  }
  assert.equal(metinler.size, 15, 'üç metin × beş dil birbirinden farklı olmalı');
});
