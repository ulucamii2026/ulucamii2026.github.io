// Arşivdeki görselleri site için WebP'ye çevirir (tek seferlik hazırlık betiği)
import sharp from 'sharp';
import { readdirSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
const K = 'D:/app/marche-cami-sitesi/kaynak';
const out = (p) => { mkdirSync(p, { recursive: true }); return p; };
async function toWebp(src, dst, width, quality = 80) {
  await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(dst);
}
// 1) Cami fotoğrafları → galeri (1600 + 480 thumb)
const fotoDir = join(K, 'fotograflar');
const fotos = readdirSync(fotoDir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
let i = 0;
for (const f of fotos) {
  i++; const n = String(i).padStart(2, '0');
  await toWebp(join(fotoDir, f), `public/media/galeri/cami-${n}.webp`, 1600, 80);
  await toWebp(join(fotoDir, f), `public/media/galeri/cami-${n}-thumb.webp`, 480, 72);
  console.log('galeri', n, f);
}
// 2) Hero/hakkımızda için src/assets (Astro <Image> optimize eder)
await sharp(join(fotoDir, 'Marche-en-Famenne Ulu Camii - Dis Cephe.jpg')).rotate().resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile('src/assets/foto/dis-cephe.jpg');
await sharp(join(fotoDir, 'Marche-en-Famenne Ulu Camii - Ic Mekan.jpg')).rotate().resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile('src/assets/foto/ic-mekan.jpg');
// 3) Afişler
const afisler = [
  ['belgeler/cami-panosu/Bayram_Programi_2026_v5_iznik_tr.png', 'bayram-programi-2026-tr.webp'],
  ['belgeler/cami-panosu/Bayram_Programi_2026_v5_iznik_fr.png', 'bayram-programi-2026-fr.webp'],
  ['belgeler/afisler/Bağış Afişi A3 - TR-FR (13.08.2026).png', 'bagis-afisi-2026-tr-fr.webp'],
  ['belgeler/afisler/Bağış Afişi A2 - Üç Dilli (AR-TR-FR) (13.08.2026).png', 'bagis-afisi-2026-uc-dilli.webp'],
  ['belgeler/afisler/Bağış Afişi A3 - Bir Tane Yedi Başak - TR-FR (13.08.2026).png', 'bagis-afisi-2026-yedi-basak.webp'],
  ['belgeler/kurban-2026/Kurban_Bagis_Duyuru_2026-05-22.png', 'vekaletle-kurban-2026.webp'],
];
for (const [src, dst] of afisler) {
  const p = join(K, src); if (!existsSync(p)) { console.log('YOK', src); continue; }
  await toWebp(p, `public/media/afisler/${dst}`, 1400, 82);
  await toWebp(p, `public/media/afisler/${dst.replace('.webp', '-thumb.webp')}`, 520, 74);
  console.log('afiş', dst);
}
// 4) Logolar
for (const f of ['marche-ulu-camii-logo.svg', 'marche-ulu-camii-logo-beyaz.svg', 'marche-ulu-camii-logo-512.png', 'marche-ulu-camii-logo-128.png', 'marche-kuran-kursu-logo.svg', 'marche-kuran-kursu-logo-256.png']) {
  copyFileSync(join(K, 'logolar', f), `public/media/logo/${f.replace('marche-', '')}`);
}
console.log('bitti');
