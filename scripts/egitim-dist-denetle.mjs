#!/usr/bin/env node
/**
 * egitim CI: derlenmiş egitim/dist'in "boş ya da çökmüş derleme" kapısı (11 Kasım 2026).
 *
 *   node scripts/egitim-dist-denetle.mjs [--dist egitim/dist] [--yaz]      (--yaz: taban dosya sayısını elle günceller)
 *
 * Hosting her yayında tam sürüm anlık görüntüsüdür; derleme sessizce eksik çıkarsa canlı site eksilir. Kapı:
 *  - dosya sayısı, `scripts/egitim-dist-taban.json` içindeki tabanın %95'inden az olamaz (taban: son doğrulanmış yayındaki sayı);
 *  - zorunlu sayfa/dosyalar var; veli sayfası `veli-veri` bloğunu taşır.
 * Site bilerek %5'ten fazla küçülürse taban elle güncellenir (`--yaz`) ve nedeni commit iletisine yazılır. Test: tests/egitim/dist-denetle.test.mjs.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TABAN_DOSYASI = join(KOK, 'scripts', 'egitim-dist-taban.json');
export const ALT_ORAN = 0.95;

export function say(klasor) {
  let n = 0;
  for (const e of readdirSync(klasor, { withFileTypes: true })) n += e.isDirectory() ? say(join(klasor, e.name)) : 1;
  return n;
}

/** Döner: hata iletilerinin listesi (boş = tamam). `taban`: { dosya, zorunlu: [yol…] }. */
export function denetle({ dist, taban }) {
  const hatalar = [];
  if (!existsSync(dist)) return [`${dist} yok (derleme çalışmamış)`];
  const sayi = say(dist);
  const alt = Math.ceil(taban.dosya * ALT_ORAN);
  if (sayi < alt) hatalar.push(`dosya sayısı ${sayi} < alt sınır ${alt} (taban ${taban.dosya} × ${ALT_ORAN})`);
  for (const y of taban.zorunlu) if (!existsSync(join(dist, y))) hatalar.push(`zorunlu dosya yok: ${y}`);
  const veli = join(dist, 'tr', 'veli', 'index.html');
  if (existsSync(veli) && !readFileSync(veli, 'utf8').includes('veli-veri')) hatalar.push('tr/veli/index.html: veli-veri bloğu yok');
  return hatalar;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = process.argv.slice(2);
  const dist = resolve(a.includes('--dist') ? a[a.indexOf('--dist') + 1] : join(KOK, 'egitim', 'dist'));
  const taban = JSON.parse(readFileSync(TABAN_DOSYASI, 'utf8'));
  if (a.includes('--yaz')) {
    const n = say(dist);
    writeFileSync(TABAN_DOSYASI, `${JSON.stringify({ ...taban, dosya: n }, null, 2)}\n`);
    console.log(`Taban güncellendi: ${n}`);
  } else {
    const hatalar = denetle({ dist, taban });
    if (hatalar.length) { console.error(`egitim/dist denetimi BAŞARISIZ — yayın başlatılmaz.\n${hatalar.map((h) => `- ${h}`).join('\n')}`); process.exit(1); }
    console.log(`egitim/dist denetimi tamam: ${say(dist)} dosya (taban ${taban.dosya}, alt sınır ${Math.ceil(taban.dosya * ALT_ORAN)}).`);
  }
}
