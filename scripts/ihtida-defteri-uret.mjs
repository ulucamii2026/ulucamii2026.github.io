/** Çevrimdışı üretim; giriş JSON'u ve çıktılar özel çalışma klasöründe kalmalıdır. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute } from 'node:path';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { pdfUret, docxUret } from '../public/admin/ihtida-defteri.js';
const [input, output] = process.argv.slice(2);
if (!output) throw new Error('Kullanım: node scripts/ihtida-defteri-uret.mjs özel-model.json özel-çıktı-klasörü');
const target = resolve(output), pub = resolve('public');
const rel = relative(pub, target);
if (target === pub || (!isAbsolute(rel) && !rel.startsWith('..' + sep))) throw new Error('Özel defter public klasörüne yazılamaz.');
const model = JSON.parse(await readFile(input, 'utf8'));
const kaynak = {
  fontBytes: await readFile(new URL('../public/fonts/Lora-Regular.ttf', import.meta.url)),
  fontKalinBytes: await readFile(new URL('../public/fonts/Lora-Bold.ttf', import.meta.url)),
};
await mkdir(target, { recursive: true });
await writeFile(resolve(target, 'ihtida-defteri.pdf'), await pdfUret(model, kaynak, pdfLib, fontkit));
await writeFile(resolve(target, 'ihtida-defteri.docx'), docxUret(model));
console.log(JSON.stringify({ pdf: true, docx: true, kayitSayisi: model.kayitlar.length }));
