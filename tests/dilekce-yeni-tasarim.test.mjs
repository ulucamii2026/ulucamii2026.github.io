import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import sharp from 'sharp';
import { dilekceUret } from '../public/admin/dilekce.js';

const oku = n => readFileSync(new URL('../public/' + n, import.meta.url));
const resim = async () => 'data:image/png;base64,' + (await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60"><path d="M5 48 C55 2 85 64 135 23 S190 49 215 13" fill="none" stroke="black" stroke-width="4"/></svg>')).png().toBuffer()).toString('base64');
const uzun = (s, n) => s.repeat(Math.ceil(n / s.length)).slice(0, n);
async function uret(veri) { return dilekceUret({ pdfLib, fontkit, fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'), veri, imza: await resim(), tarih: new Date('2026-09-09T12:00:00Z') }); }
test('Onaylı dilekçe normalde tek sayfa, uzun alanlarda devam sayfasıdır', async () => {
  const temel = { adSoyad: 'Deniz Élodie Örnek', dogumTarihi: '20/05/1990', adres: 'Rue du Test 12, 6900 Marche-en-Famenne, Belçika', eposta: 'deniz@example.test', telefon: '+32 470 00 00 00', dil: 'fr', ihtidaTarihi: '08/09/2026', teslimat: { yontem: 'cami' }, cami: { ad: 'Namur Camii', adres: 'Rue Denis Georges Bayar 13', postaKodu: '5000', sehir: 'Namur' } };
  const out = new URL('../.codex/cikti/ihtida/dilekce-yeni-normal.pdf', import.meta.url); mkdirSync(new URL('../.codex/cikti/ihtida/', import.meta.url), { recursive: true }); writeFileSync(out, await uret(temel));
  assert.equal((await pdfLib.PDFDocument.load(readFileSync(out))).getPageCount(), 1);
  const long = { ...temel, adSoyad: uzun('Alexandra Marie Elisabeth de la Conversion Exemple ', 120), adres: uzun('Avenue de la Très Longue Adresse ', 200), cami: { id: 'diger', ad: uzun('Belçika Türk Müslüman Toplumu Başvuru ve Tören Merkezi ', 120), sehir: uzun('Brüksel Başkent Bölgesi Uzun Yerleşim Merkezi ', 80), postaKodu: '5000', adres: 'Avenue ' + 'X'.repeat(193) } };
  const uzunOut = new URL('../.codex/cikti/ihtida/dilekce-yeni-uzun.pdf', import.meta.url); writeFileSync(uzunOut, await uret(long));
  assert.ok((await pdfLib.PDFDocument.load(readFileSync(uzunOut))).getPageCount() >= 2);
});
