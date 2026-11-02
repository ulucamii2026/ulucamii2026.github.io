// İlim Yolu tasarım taslakları: ekran görüntüleri ve otomatik denetim (başsız Chromium, iş bitince kapanır).
// Her sayfa 1440×900 ve 390×844'te yalnız görünüm alanı olarak çekilir (fullPage svh/vw düzenlerini bozar);
// sayfa uzunsa kaydırılmış ek görüntüler -2, -3 … ekiyle. 320 genişlikte yalnız ilk görünüm + denetim.
// Denetim: yatay taşma, görünüm dışına taşan öğe, 44 px altı dokunma hedefi, WCAG AA metin kontrastı, konsol hatası,
// yüklenen yazı tipleri. Çalıştırma (depo kökünden): node egitim/docs/taslaklar/ilim-yolu/ekran.mjs [a|b|c|a/giris …]
import { chromium } from '@playwright/test';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KOK = new URL('./', import.meta.url);
const CIKTI = fileURLToPath(new URL('ekran/', KOK));
mkdirSync(CIKTI, { recursive: true });
const suzgec = process.argv.slice(2);
const SAYFALAR = ['a', 'b', 'c'].flatMap((x) => ['ana-girisli', 'ana-misafir', 'giris'].map((s) => ({ x, s })))
  .filter(({ x, s }) => !suzgec.length || suzgec.some((f) => f === x || f === `${x}/${s}`));
const BOYUTLAR = [{ w: 1440, h: 900, en: 6 }, { w: 390, h: 844, en: 8 }, { w: 320, h: 700, en: 1 }];

function denetle() {
  const rgb = (c) => { const m = c.match(/^rgba?\(([^)]+)\)$/); if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const zemin = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor);
    if (c && c.a > 0.5) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const ad = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const W = innerWidth;
  const tasma = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const disari = [];
  const kucuk = [];
  const kontrast = [];
  const bilinmeyen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (r.right > W + 1 && !el.closest('[data-tasma-serbest]')) disari.push(`${ad(el)} sağ=${Math.round(r.right)}`);
    const etkilesim = el.matches('a[href], button, select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), summary, [role=button], label:has(> input[type=checkbox]), label:has(> input[type=radio])');
    if (etkilesim && !el.closest('p, li > span, .satir-ici') && (r.height < 43.5 || r.width < 43.5)) kucuk.push(`${ad(el)} ${Math.round(r.width)}×${Math.round(r.height)} «${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}»`);
    const metinli = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!metinli || el.closest('svg')) continue;
    const on = rgb(cs.color);
    const arka = zemin(el);
    if (!on) { bilinmeyen.add(cs.color); continue; }
    const karisik = { r: on.r * on.a + arka.r * (1 - on.a), g: on.g * on.a + arka.g * (1 - on.a), b: on.b * on.a + arka.b * (1 - on.a) };
    const [a, b] = [lum(karisik), lum(arka)];
    const oran = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const boy = parseFloat(cs.fontSize);
    const buyuk = boy >= 24 || (+cs.fontWeight >= 700 && boy >= 18.66);
    if (oran < (buyuk ? 3 : 4.5) - 0.005) kontrast.push(`${ad(el)} ${oran.toFixed(2)} «${el.textContent.trim().slice(0, 30)}»`);
  }
  const fontlar = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`))].join(', ');
  return { tasma, disari: disari.slice(0, 8), kucuk: kucuk.slice(0, 12), kontrast: kontrast.slice(0, 12), bilinmeyen: [...bilinmeyen], fontlar,
    yukseklik: document.documentElement.scrollHeight };
}

const tarayici = await chromium.launch();
try {
  for (const { x, s } of SAYFALAR) {
    for (const ad of readdirSync(CIKTI)) if (ad.startsWith(`${x}-${s}-`)) rmSync(CIKTI + ad);
    for (const { w, h, en } of BOYUTLAR) {
      const sayfa = await tarayici.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const hatalar = [];
      sayfa.on('pageerror', (e) => hatalar.push(e.message));
      sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
      sayfa.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) hatalar.push(`AĞ İSTEĞİ ${r.url()}`); });
      await sayfa.goto(new URL(`${x}/${s}.html`, KOK).href);
      await sayfa.evaluate(() => document.fonts.ready);
      await sayfa.waitForTimeout(150);
      const d = await sayfa.evaluate(denetle);
      const adet = Math.min(en, Math.ceil(d.yukseklik / h));
      for (let i = 0; i < adet; i++) {
        await sayfa.evaluate((y) => window.scrollTo(0, y), i * (h - 60));
        await sayfa.waitForTimeout(60);
        await sayfa.screenshot({ path: `${CIKTI}${x}-${s}-${w}${i ? `-${i + 1}` : ''}.png` });
      }
      const satir = [`${x}/${s} @${w}: yükseklik ${d.yukseklik} (${adet} görüntü), taşma ${d.tasma}`];
      if (d.disari.length) satir.push(`  DIŞARI: ${d.disari.join(' | ')}`);
      if (d.kucuk.length) satir.push(`  KÜÇÜK HEDEF: ${d.kucuk.join(' | ')}`);
      if (d.kontrast.length) satir.push(`  KONTRAST: ${d.kontrast.join(' | ')}`);
      if (d.bilinmeyen.length) satir.push(`  RENK ÇÖZÜLEMEDİ: ${d.bilinmeyen.join(' | ')}`);
      if (hatalar.length) satir.push(`  HATA: ${hatalar.join(' | ')}`);
      if (w === 1440) satir.push(`  fontlar: ${d.fontlar}`);
      console.log(satir.join('\n'));
      await sayfa.close();
    }
  }
} finally {
  await tarayici.close();
}
