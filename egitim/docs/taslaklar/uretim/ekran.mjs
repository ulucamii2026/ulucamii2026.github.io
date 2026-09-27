// Faz 1e taslakları, adım 3/3: ekran görüntüleri (başsız Chromium, iş bitince kapanır) → egitim/.impeccable/review/
// (Git dışı). Açık/koyu, 1440 ve 390 genişlik; yatay taşma, konsol hatası ve yüklenen yazı tipleri yazdırılır.
// Çalıştırma (depo kökünden): node egitim/docs/taslaklar/uretim/ekran.mjs [dosya ön eki]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const on = process.argv[2] || '';
const CIKTI = 'egitim/.impeccable/review';
mkdirSync(CIKTI, { recursive: true });
const url = (ad, hash = '') => pathToFileURL(resolve(`egitim/docs/taslaklar/${ad}.html`)).href + hash;
const IS = [
  { ad: 'giris', w: 1440, h: 900, tam: false, dosya: 'giris-masaustu-ilk' },
  { ad: 'giris', w: 1440, h: 900, tam: true, dosya: 'desktop' },
  { ad: 'giris', w: 390, h: 844, tam: false, dosya: 'giris-telefon-ilk' },
  { ad: 'giris', w: 390, h: 844, tam: true, dosya: 'mobile' },
  { ad: 'giris', w: 390, h: 844, tam: false, dosya: 'giris-telefon-baglanti', hash: '#m-s-ihlas' },
  { ad: 'giris', w: 1440, h: 900, tam: false, dosya: 'giris-masaustu-koyu', koyu: true },
  { ad: 'madde', w: 1440, h: 900, tam: true, dosya: 'madde-masaustu' },
  { ad: 'madde', w: 390, h: 844, tam: true, dosya: 'madde-telefon' },
  { ad: 'madde', w: 390, h: 844, tam: false, dosya: 'madde-telefon-koyu', koyu: true },
  { ad: 'hoca', w: 1440, h: 900, tam: true, dosya: 'hoca-masaustu' },
  { ad: 'hoca', w: 390, h: 844, tam: true, dosya: 'hoca-telefon' },
];
const tarayici = await chromium.launch();
try {
  for (const is of IS) {
    const sayfa = await tarayici.newPage({ viewport: { width: is.w, height: is.h }, deviceScaleFactor: 1, colorScheme: is.koyu ? 'dark' : 'light', reducedMotion: 'reduce' });
    const hatalar = [];
    sayfa.on('pageerror', (e) => hatalar.push(e.message));
    sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
    await sayfa.goto(url(is.ad, is.hash));
    await sayfa.evaluate(() => document.fonts.ready);
    if (is.hash) await sayfa.waitForTimeout(1200);   // bağlantıyla gelinen maddede sırrın yayılışı bitsin
    const fontlar = await sayfa.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).join(', '));
    const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await sayfa.screenshot({ path: `${CIKTI}/${on}${is.dosya}.png`, fullPage: is.tam });
    const yukseklik = await sayfa.evaluate(() => document.documentElement.scrollHeight);
    console.log(`${is.dosya}: ${is.w}px, yükseklik ${yukseklik}, yatay taşma ${tasma}, fontlar [${fontlar}]${hatalar.length ? ` HATA: ${hatalar.join(' | ')}` : ''}`);
    await sayfa.close();
  }
} finally {
  await tarayici.close();
}
