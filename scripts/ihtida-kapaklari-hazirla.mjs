// Oluşturulan özgün kapakları web için boyutlandırır; özgün PNG'leri korur.
// Kullanım: node scripts/ihtida-kapaklari-hazirla.mjs <PNG klasörü>
import sharp from 'sharp';
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.argv[2]) throw new Error('Özgün PNG klasörünü belirtin.');
const input = resolve(process.argv[2]);
const output = fileURLToPath(new URL('../public/media/ihtida/kapaklar/', import.meta.url));
await mkdir(output, { recursive: true });
const files = (await readdir(input)).filter(n => /^(\d{2}|extra-\d{2}|fr-sermon)\.png$/.test(n));
const covers = [];
for (const name of files.sort()) {
  const key = basename(name, '.png');
  const slug = /^\d/.test(key) ? `ders-${key}` : key;
  const dest = join(output, `${slug}.webp`);
  const info = await sharp(join(input, name)).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dest);
  const size = (await stat(dest)).size;
  if (info.width < 960 || Math.abs(info.width / info.height - 16 / 9) > 0.06) throw new Error(`Kapak oranı/boyutu beklenenden farklı: ${name}`);
  covers.push({ key, dosya: `${slug}.webp`, genislik: info.width, yukseklik: info.height, bayt: size });
}
await writeFile(join(output, 'kapaklar.json'), JSON.stringify({ tarih: '2026-09-09', tur: 'Ulu Camii için yapay zekâyla üretilmiş temsili kapak illüstrasyonları; Diyanet video kareleri değildir.', kapaklar: covers }, null, 2) + '\n');
console.log(`${covers.length} kapak hazır; toplam ${(covers.reduce((n, c) => n + c.bayt, 0) / 1024 / 1024).toFixed(2)} MB.`);
