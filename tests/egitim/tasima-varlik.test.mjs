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

test('robots.txt veli ve hoca sayfalarını yasaklar; üst/alt bilgi veli portalına bağlanır (Dilim 4 geçişi), hoca ekranına HİÇ bağlanmaz', () => {
  const r = oku('egitim/public/robots.txt');
  assert.match(r, /^Disallow: \/hoca\/$/m);
  assert.match(r, /^Disallow: \/\*\/veli\/$/m);
  for (const f of ['egitim/src/components/UstBilgi.astro', 'egitim/src/components/AltBilgi.astro']) {
    assert.match(oku(f), /\/veli\//, `${f}: veli bağlantısı`);
    assert.doesNotMatch(oku(f), /\/hoca\//, `${f}: hoca ekranına bağlanmamalı`);
  }
});
