import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
const out = (p) => { mkdirSync(p, { recursive: true }); return p; };
async function toWebp(src, dst, width, quality = 82) {
  await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(dst);
}
out('public/media/arsiv');

const KAYNAK = 'D:/tmp/fb-oku/eski2/img';
const items = [
  [`${KAYNAK}/g146_1.jpg`, '2018-uip-basvuru-paylasim'],
];
for (const [src, slug] of items) {
  if (!existsSync(src)) { console.log('YOK', src); continue; }
  await toWebp(src, `public/media/arsiv/${slug}.webp`, 1400, 82);
  await toWebp(src, `public/media/arsiv/${slug}-thumb.webp`, 520, 74);
  console.log('arşiv', slug);
}
console.log('bitti');
