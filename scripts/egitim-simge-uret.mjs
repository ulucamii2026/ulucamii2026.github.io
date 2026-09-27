#!/usr/bin/env node
/** egitim.ulucamii.be sekme ve ana ekran simgeleri — kurs ambleminin iç dairesi (27 Eylül 2026).
 *
 *  Kaynak: kurumsal kimlik paketindeki kurs ana SVG'si (docs/LOGO-KIMLIGI.md; SHA-256 doğrulanır, başka sürümle
 *  çalışmaz). Logo yeniden çizilmez: yazı halkası katmanları çıkarılır, görünüm kutusu iç halkaya kırpılır — tam
 *  madalyon 16–32 px'te yazı halkası yüzünden okunmaz (ana sitenin public/favicon.svg'si de cami ambleminin iç
 *  diskidir). Raster dosyalar bu vektörden Playwright ile hedef boyutta çizilir («vektör önce» kuralının bilinen
 *  istisnaları: favicon.ico ve apple-touch-icon).
 *
 *    egitim/public/favicon.svg           vektör (tarayıcı sekmesi)
 *    egitim/public/favicon.ico           16/32/48 px, PNG gövdeli ICO (WhatsApp, eski tarayıcılar, yer imi araçları)
 *    egitim/public/apple-touch-icon.png  180 × 180 opak, kurs yeşili zemin (iOS saydamı siyaha çevirir)
 *
 *  Çalıştırma (depo kökünden): node scripts/egitim-simge-uret.mjs   — logo değişirse yeniden çalıştırılır.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { optimize } from 'svgo';

const KAYNAK = 'D:/vektorel-calismalar/ulu-camii-kurumsal-kimlik/02-kuran-kursu/kuran-kursu-renkli.svg';
const KAYNAK_SHA256 = '6d0bc56df446622aa1fb012b1d43aa11624412cc69c9239a7e31b0ddc485a8c1'; // docs/LOGO-KIMLIGI.md
const HEDEF = new URL('../egitim/public/', import.meta.url);
const KURS_YESILI = '#134420';

const ham = readFileSync(KAYNAK);
const sha = createHash('sha256').update(ham).digest('hex');
if (sha !== KAYNAK_SHA256) throw new Error(`Kurs ana SVG'si beklenen sürüm değil (sha256 ${sha}); önce docs/LOGO-KIMLIGI.md.`);
let svg = ham.toString('utf8');

// Yazı halkasına ait katmanlar: dış sınır ve halka, yazı zemini, iki ayırıcı nokta, yazıdaki İ noktaları, harfler.
const cikar = (desen, ad) => {
  const once = svg;
  svg = svg.replace(desen, '');
  if (svg === once) throw new Error(`Ana SVG'de «${ad}» katmanı bulunamadı; kırpma yeniden gözden geçirilmeli.`);
};
for (const id of ['dis-sinir', 'dis-halka', 'yazi-zemini', 'sol-ayirici', 'sag-ayirici', 'i-noktasi-1', 'i-noktasi-2']) {
  cikar(new RegExp(`\\s*<ellipse id="${id}"[^>]*/>`), id);
}
cikar(/\s*<g id="ozgun-yazi-konturlari"[\s\S]*?<\/g>/, 'ozgun-yazi-konturlari');
if (/<g[\s>]/.test(svg)) throw new Error('Ana SVG beklenmeyen bir grup içeriyor; kırpma yeniden gözden geçirilmeli.');

// Görünüm kutusu: iç halkanın dış kenarı (kontur yarısı + 1 birim pay), kare.
const halka = svg.match(/<ellipse id="ic-halka" cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"[^>]*stroke-width="([\d.]+)"/);
if (!halka) throw new Error('Ana SVG\'de «ic-halka» bulunamadı.');
const [cx, cy, rx, ry, kontur] = halka.slice(1).map(Number);
const yari = Math.max(rx, ry) + kontur / 2 + 1;
const kutu = [cx - yari, cy - yari, 2 * yari, 2 * yari].map((s) => +s.toFixed(2)).join(' ');
svg = svg
  .replace(/<\?xml[^>]*>\s*/, '')
  .replace(/<svg([^>]*?) width="[^"]*" height="[^"]*" viewBox="[^"]*"/, `<svg$1 viewBox="${kutu}"`)
  .replace(/<desc id="desc">[^<]*<\/desc>/, '<desc id="desc">Kurs ambleminin iç dairesi (sekme simgesi); kaynak kurumsal kimlik paketindeki ana SVG.</desc>');
if (!svg.includes(`viewBox="${kutu}"`)) throw new Error('Kök <svg> görünüm kutusu değiştirilemedi.');
// Küçültme: 468 birimlik kutuda 0,01 birim hassasiyet gözle ayırt edilmez; katman adları (id) ana SVG'yle eşleşsin diye kalır.
svg = optimize(svg, {
  multipass: true, floatPrecision: 2,
  plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false } } }],
}).data;
writeFileSync(new URL('favicon.svg', HEDEF), svg.trim() + '\n');

// Raster türevler: vektör hedef boyutta çizilir (küçültülmüş büyük resim değil).
const veriAdresi = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const tarayici = await chromium.launch();
const ciz = async (boyut, { zemin = null, oran = 1 } = {}) => {
  const s = await tarayici.newPage({ viewport: { width: boyut, height: boyut }, deviceScaleFactor: 1 });
  const olcu = Math.round(boyut * oran);
  await s.setContent(`<!doctype html><html><body style="margin:0;width:${boyut}px;height:${boyut}px;display:grid;place-items:center;background:${zemin ?? 'transparent'}"><img src="${veriAdresi}" width="${olcu}" height="${olcu}" alt=""></body></html>`);
  await s.locator('img').evaluate((img) => img.decode());
  const png = await s.screenshot({ type: 'png', omitBackground: zemin === null, clip: { x: 0, y: 0, width: boyut, height: boyut } });
  await s.close();
  return png;
};

// ICO: 6 baytlık başlık + her boyut için 16 baytlık girdi + PNG gövdeleri (Vista'dan beri her istemci okur).
const ico = (resimler) => {
  const bas = Buffer.alloc(6);
  bas.writeUInt16LE(0, 0); bas.writeUInt16LE(1, 2); bas.writeUInt16LE(resimler.length, 4);
  let konum = 6 + 16 * resimler.length;
  const girdiler = resimler.map(({ boyut, png }) => {
    const g = Buffer.alloc(16);
    g.writeUInt8(boyut % 256, 0); g.writeUInt8(boyut % 256, 1); g.writeUInt16LE(1, 4); g.writeUInt16LE(32, 6);
    g.writeUInt32LE(png.length, 8); g.writeUInt32LE(konum, 12);
    konum += png.length;
    return g;
  });
  return Buffer.concat([bas, ...girdiler, ...resimler.map((r) => r.png)]);
};

try {
  const kucukler = [];
  for (const boyut of [16, 32, 48]) kucukler.push({ boyut, png: await ciz(boyut) });
  writeFileSync(new URL('favicon.ico', HEDEF), ico(kucukler));
  writeFileSync(new URL('apple-touch-icon.png', HEDEF), await ciz(180, { zemin: KURS_YESILI, oran: 0.86 }));
} finally {
  await tarayici.close();
}
console.log(`✓ favicon.svg (görünüm kutusu ${kutu}), favicon.ico (16/32/48), apple-touch-icon.png (180) → egitim/public/`);
