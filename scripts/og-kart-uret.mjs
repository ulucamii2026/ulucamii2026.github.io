#!/usr/bin/env node
/** Paylaşım kartı (Open Graph, 1200 × 630) üreticisi — public/media/og/ulu-camii-<dil>.png
 *
 *  Kartın ilk şablonu (`__og-kart.html`) geçici bir dosyaydı ve silinmişti (docs/LOGO-KIMLIGI.md); 21 Eylül 2026'da Flemenkçe ve
 *  Almanca eklenince şablon kalıcı olarak buraya alındı. Amblem ana SVG'den (public/media/logo/ulu-camii-logo.svg) vektör olarak
 *  yerleşir; PNG yalnız çıktı biçimidir (OG kartı raster olmak zorunda — «vektör önce» kuralının bilinen istisnası).
 *
 *    node scripts/og-kart-uret.mjs nl de          yalnız bu diller (varsayılan: nl de — tr/fr/en kartları yayımlanmış hâliyle korunur)
 *    node scripts/og-kart-uret.mjs --hepsi        beş dilin hepsi
 *    node scripts/og-kart-uret.mjs fr --cikti <klasör>   karşılaştırma için başka klasöre
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const METIN = {
  tr: { baslik: ['Türk-İslam Kültür Merkezi', 've Camii'], alt: '1979’DAN BERİ · MARCHE-EN-FAMENNE' },
  fr: { baslik: ['Centre culturel', 'turco-islamique et mosquée'], alt: 'DEPUIS 1979 · MARCHE-EN-FAMENNE' },
  en: { baslik: ['Turkish-Islamic Cultural', 'Centre and Mosque'], alt: 'SINCE 1979 · MARCHE-EN-FAMENNE' },
  nl: { baslik: ['Turks-islamitisch cultureel', 'centrum en moskee'], alt: 'SINDS 1979 · MARCHE-EN-FAMENNE' },
  de: { baslik: ['Türkisch-islamisches', 'Kulturzentrum und Moschee'], alt: 'SEIT 1979 · MARCHE-EN-FAMENNE' },
};

const arg = process.argv.slice(2);
const ciktiSirasi = arg.indexOf('--cikti');
const hedefKlasor = ciktiSirasi >= 0 ? resolve(arg[ciktiSirasi + 1]) : join(KOK, 'public', 'media', 'og');
const secilen = arg.filter((a, i) => !a.startsWith('--') && !(ciktiSirasi >= 0 && i === ciktiSirasi + 1)).filter((a) => a in METIN);
const diller = arg.includes('--hepsi') ? Object.keys(METIN) : secilen.length ? secilen : ['nl', 'de'];

// setContent ile açılan sayfa file:// yazı tiplerini yükleyemez (köken about:blank) → yazı tipleri veri adresi olarak gömülür.
const font = (yol) => 'data:font/woff2;base64,' + readFileSync(join(KOK, 'node_modules', yol)).toString('base64');
const logo = readFileSync(join(KOK, 'public', 'media', 'logo', 'ulu-camii-logo.svg'), 'utf8').replace(/<\?xml[^>]*>/, '');
const sayfa = (dil) => `<!doctype html><html lang="${dil}"><meta charset="utf-8"><style>
@font-face { font-family: "Lora"; font-weight: 400 700; src: url("${font('@fontsource-variable/lora/files/lora-latin-ext-wght-normal.woff2')}") format("woff2"); unicode-range: U+0100-02AF, U+1E00-1EFF, U+2020, U+20A0-20AB; }
@font-face { font-family: "Lora"; font-weight: 400 700; src: url("${font('@fontsource-variable/lora/files/lora-latin-wght-normal.woff2')}") format("woff2"); }
@font-face { font-family: "Plex"; font-weight: 400; src: url("${font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-400-normal.woff2')}") format("woff2"); unicode-range: U+0100-02AF, U+1E00-1EFF; }
@font-face { font-family: "Plex"; font-weight: 400; src: url("${font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}") format("woff2"); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; }
body { position: relative; overflow: hidden; background: radial-gradient(900px 500px at 92% 0%, #f7ecdd 0%, rgba(247,236,221,0) 70%), #fdfbf7; border: 1px solid #ecd9c4;
  display: flex; flex-direction: column; align-items: center; font-family: "Lora", Georgia, serif; color: #2a1d17; }
.serit { position: absolute; left: 0; right: 0; height: 13px; background: repeating-linear-gradient(135deg, #b8452c 0 9px, #fdf6ec 9px 18px); }
.serit.ust { top: 0; } .serit.alt { bottom: 0; }
.logo { margin-top: 58px; width: 270px; height: 270px; }
.logo svg { width: 100%; height: 100%; display: block; }
h1 { margin-top: 24px; font-size: 42px; line-height: 52px; font-weight: 600; letter-spacing: -0.01em; text-align: center; }
.ayrac { margin-top: 22px; display: flex; align-items: center; gap: 12px; color: #b8452c; font-size: 11px; }
.ayrac::before, .ayrac::after { content: ""; width: 96px; height: 1px; background: #d9d2c6; }
.alt { margin-top: 20px; font-family: "Plex", Consolas, monospace; font-size: 15px; letter-spacing: .14em; color: #5b5048; }
.adres { margin-top: 18px; font-family: "Plex", Consolas, monospace; font-size: 15px; letter-spacing: .22em; color: #b8452c; }
</style><body><div class="serit ust"></div><div class="logo">${logo}</div>
<h1>${METIN[dil].baslik.join('<br>')}</h1><div class="ayrac">◆</div><p class="alt">${METIN[dil].alt}</p><p class="adres">ULUCAMII.BE</p><div class="serit alt"></div></body></html>`;

mkdirSync(hedefKlasor, { recursive: true });
const tarayici = await chromium.launch();
try {
  const s = await tarayici.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const dil of diller) {
    await s.setContent(sayfa(dil), { waitUntil: 'load' });
    await s.evaluate(() => document.fonts.ready);
    const hedef = join(hedefKlasor, `ulu-camii-${dil}.png`);
    await s.screenshot({ path: hedef, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
    console.log('✓', hedef);
  }
} finally { await tarayici.close(); }
