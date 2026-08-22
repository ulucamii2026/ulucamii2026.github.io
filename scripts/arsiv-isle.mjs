// Eski/güncel Facebook arşivinden seçilen görselleri site için WebP'ye çevirir (tek seferlik betik)
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
const out = (p) => { mkdirSync(p, { recursive: true }); return p; };
async function toWebp(src, dst, width, quality = 82) {
  await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(dst);
}
out('public/media/arsiv');

const KAYNAK_ESKI = 'D:/app/marche-cami-sitesi/kaynak/facebook/ulu-camii-5/gorseller-tamboy';
const KAYNAK_GUNCEL = 'D:/tmp/fb-oku/guncel/img';

// 1) Eski sayfa arşivinden duyuru kapakları (≤1400 + thumb ≤520)
const arsiv = [
  [`${KAYNAK_ESKI}/029_db3415cff9.jpg`, 'belediye-kurban-atik-2016'],
  [`${KAYNAK_ESKI}/040_d2aa23a862.jpg`, 'ramazan-vaiz-programi-2016'],
];
for (const [src, slug] of arsiv) {
  if (!existsSync(src)) { console.log('YOK', src); continue; }
  await toWebp(src, `public/media/arsiv/${slug}.webp`, 1400, 82);
  await toWebp(src, `public/media/arsiv/${slug}-thumb.webp`, 520, 74);
  console.log('arşiv', slug);
}

// 2) Güncel sayfadaki kayıt afişleri → Kur'an kursu duyurusu kapağı
const kurs = [
  [`${KAYNAK_GUNCEL}/g01_1.jpg`, 'kurs-kayit-2026-tr'],
  [`${KAYNAK_GUNCEL}/g02_1.jpg`, 'kurs-kayit-2026-fr'],
];
for (const [src, slug] of kurs) {
  if (!existsSync(src)) { console.log('YOK', src); continue; }
  await toWebp(src, `public/media/arsiv/${slug}.webp`, 1400, 82);
  console.log('kurs kapak', slug);
}
console.log('bitti');
