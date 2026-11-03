// Veda Programı üst görseli: kaynak PNG'den sıkıştırılmış JPG + WebP üretir (sayfa klasörüne).
// Kullanım: node scripts/davet-gorsel-uret.mjs "<kaynak.png>"   (b görseline geçmek = aynı komut, başka kaynak)
// Kaynak depoya GİRMEZ; yalnız çıktılar (ebru-lale-480/800.webp, ebru-lale-800.jpg) girer.
import sharp from 'sharp';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const kaynak = process.argv[2];
if (!kaynak) { console.error('kaynak PNG yolu gerekli'); process.exit(1); }
const hedef = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'davet', 'veda-04735binju');
for (const w of [480, 800]) {
  const b = await sharp(kaynak).resize({ width: w }).webp({ quality: 74, effort: 6 }).toFile(join(hedef, `ebru-lale-${w}.webp`));
  console.log(`ebru-lale-${w}.webp`, b.width + 'x' + b.height, Math.round(b.size / 1024) + ' KB');
}
const j = await sharp(kaynak).resize({ width: 800 }).jpeg({ quality: 74, mozjpeg: true }).toFile(join(hedef, 'ebru-lale-800.jpg'));
console.log('ebru-lale-800.jpg', j.width + 'x' + j.height, Math.round(j.size / 1024) + ' KB');
