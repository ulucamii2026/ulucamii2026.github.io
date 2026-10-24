// Basılı ezber kartlarını PDF olarak üretir (Faz 2e, 24 Ekim 2026).
//
// Kart, egitim.ulucamii.be madde sayfasının yazdırma görünümüdür (egitim/src/styles/kart.css). Bu betik, derlenmiş siteyi
// (egitim/dist) yerelde sunar ve Chromium'un "PDF olarak yazdır"ıyla her madde sayfasını A4 kart olarak kaydeder; böylece
// hoca toplu basabilir, WhatsApp'tan paylaşabilir ya da düzeni gözle inceleyebilir. Kartlar depoya GİRMEZ ve siteye
// konmaz: sayfa her zaman güncel veriden basılır, PDF'ler ise bu betikle istendiği an üretilir.
//
// Kullanım (önce `npm run egitim:build`):
//   node scripts/ezber-kart-pdf.mjs                              bütün maddeler, bütün diller → output/ezber-kartlari/<dil>/<id>.pdf
//   node scripts/ezber-kart-pdf.mjs --dil tr,fr --id s-ihlas     seçili dil ve maddeler
//   node scripts/ezber-kart-pdf.mjs --cikti D:/yol               başka klasör
//   node scripts/ezber-kart-pdf.mjs --okunus                     hocanın onayladığı okunuş varsa kartta açık basılır
//   node scripts/ezber-kart-pdf.mjs --koyu                       sayfa koyu temadayken basar (kâğıt yine beyaz olmalı: sınama)
//
// Kapı: her PDF'te piksel görsel (/Subtype /Image) olmamalı (kare kod ve çizimler vektör), yazı tipleri gömülü olmalı ve en az
// bir sayfa bulunmalı; aksi hâlde çıkış kodu 1. Kare kodun doğru adrese gittiğini ve yazı tiplerini ayrıca
// `python scripts/ezber-kart-dogrula.py <klasör>` (PyMuPDF + OpenCV) çözerek denetler.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { preview } from 'astro';

const KOK = fileURLToPath(new URL('..', import.meta.url));
const DILLER = ['tr', 'fr', 'en', 'nl', 'de'];
const PORT = 4403;

function arguman(ad, varsayilan = null) {
  const i = process.argv.indexOf(`--${ad}`);
  if (i < 0) return varsayilan;
  const sonraki = process.argv[i + 1];
  return sonraki && !sonraki.startsWith('--') ? sonraki : true;
}
const dilSecimi = String(arguman('dil', DILLER.join(','))).split(',').filter(Boolean);
const idSecimi = arguman('id') ? String(arguman('id')).split(',').filter(Boolean) : null;
const cikti = resolve(String(arguman('cikti', 'output/ezber-kartlari')));
const okunusAc = Boolean(arguman('okunus'));
const koyu = Boolean(arguman('koyu'));
for (const d of dilSecimi) if (!DILLER.includes(d)) throw new Error(`Bilinmeyen dil: ${d}`);

// Kartı olan maddeler: yazdırma düğmesi yalnız Arapça metni olan sayfada vardır; sayfa listesi derlenmiş çıktıdan alınır.
const dist = resolve(KOK, 'egitim/dist');
const maddeler = readdirSync(resolve(dist, 'tr/calis'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const secilen = idSecimi ?? maddeler;
for (const id of secilen) if (!maddeler.includes(id)) throw new Error(`Madde sayfası yok: ${id} (önce npm run egitim:build?)`);

const sunucu = await preview({ root: resolve(KOK, 'egitim'), server: { host: '127.0.0.1', port: PORT, open: false } });
if (sunucu.port !== PORT) { await sunucu.stop(); throw new Error(`${PORT} portu kullanımda.`); }

const tarayici = await chromium.launch();
const sonuc = [];
let hata = 0;
try {
  const baglam = await tarayici.newContext({ colorScheme: koyu ? 'dark' : 'light', locale: 'tr-TR' });
  // Yalnız yerel sunucu: sayfa dış kaynak istemez, istenirse kesilir (ses ulucamii.be'den çalınır, kartta gerekmez).
  await baglam.route('**/*', (r) => (new URL(r.request().url()).origin === `http://127.0.0.1:${PORT}` ? r.continue() : r.abort()));
  const sayfa = await baglam.newPage();
  for (const dil of dilSecimi) {
    mkdirSync(resolve(cikti, dil), { recursive: true });
    for (const id of secilen) {
      await sayfa.goto(`http://127.0.0.1:${PORT}/${dil}/calis/${id}/`, { waitUntil: 'load' });
      // Kart yalnız Arapça metni olan maddede vardır (yazdırma düğmesi o zaman çıkar).
      if (!(await sayfa.locator('[data-yazdir]').count())) continue;
      await sayfa.evaluate(() => document.fonts.ready);
      if (okunusAc) {
        const d = sayfa.locator('[data-okunus-dugme]');
        if (await d.count()) await d.click();
      }
      const yol = resolve(cikti, dil, `${id}.pdf`);
      const veri = await sayfa.pdf({ format: 'A4', printBackground: false, preferCSSPageSize: true });
      writeFileSync(yol, veri);
      const metin = veri.toString('latin1');
      const sayfaSayisi = (metin.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
      const gorsel = /\/Subtype\s*\/Image/.test(metin);
      const yaziTipi = /\/FontFile[23]?\b|\/Subtype\s*\/Type3/.test(metin);
      const tamam = veri.subarray(0, 5).toString() === '%PDF-' && sayfaSayisi >= 1 && !gorsel && yaziTipi;
      if (!tamam) hata++;
      sonuc.push({ dil, id, sayfa: sayfaSayisi, kb: Math.round(veri.length / 1024), gorsel, yaziTipi, tamam });
    }
  }
} finally {
  await tarayici.close();
  await sunucu.stop();
}

writeFileSync(resolve(cikti, 'ozet.json'), JSON.stringify({ uretim: new Date().toISOString(), okunus: okunusAc, koyu, kartlar: sonuc }, null, 1));
const toplamKb = sonuc.reduce((t, s) => t + s.kb, 0);
console.log(`${sonuc.length} kart yazıldı → ${cikti} (${toplamKb} KB, ${sonuc.reduce((t, s) => t + s.sayfa, 0)} sayfa)`);
for (const s of sonuc.filter((x) => !x.tamam)) console.error(`HATA ${s.dil}/${s.id}: sayfa=${s.sayfa} görsel=${s.gorsel} yazıTipi=${s.yaziTipi}`);
if (!sonuc.length) { console.error('Hiç kart üretilmedi.'); process.exit(1); }
process.exit(hata ? 1 : 0);
