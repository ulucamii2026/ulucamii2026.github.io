import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import sharp from 'sharp';
import { ek10Uret } from '../public/admin/ek10.js';
import { pdfMetni } from './yardim/pdf-metin.mjs';

const oku = ad => readFileSync(new URL('../public/' + ad, import.meta.url));
const gorselSayisi = s => s.node.Resources().lookup(pdfLib.PDFName.of('XObject'))?.keys().length || 0;

test('EK-10 2026 sürümü tek imzayı yalnız ikinci sayfaya ve seçilen izne göre işler', async () => {
  const imzaPng = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="70"><path d="M8 50 C45 5 92 65 145 24 S205 52 234 13" fill="none" stroke="#183c48" stroke-width="5"/></svg>')).png().toBuffer();
  const sablonBytes = oku('belgeler/ihtida/ek10-kvkk-acik-riza-metni.pdf');
  const ortak = { pdfLib, fontkit, sablonBytes, fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'), adSoyad: 'Deniz Élodie Örnek', tarih: '09/09/2026', onay: true, surum: '2026-09-09', imza: 'data:image/png;base64,' + imzaPng.toString('base64') };
  const evet = await ek10Uret({ ...ortak, imzaAktarimIzni: true });
  const hayir = await ek10Uret({ ...ortak, imzaAktarimIzni: false });
  const kaynak = await pdfLib.PDFDocument.load(sablonBytes), evetBelge = await pdfLib.PDFDocument.load(evet), hayirBelge = await pdfLib.PDFDocument.load(hayir);
  assert.equal(evetBelge.getPageCount(), 2);
  assert.equal(gorselSayisi(evetBelge.getPage(0)), gorselSayisi(kaynak.getPage(0)), 'İmza ilk sayfaya eklenmez');
  assert.equal(gorselSayisi(evetBelge.getPage(1)), gorselSayisi(kaynak.getPage(1)) + 1, 'İmza yalnız ikinci sayfadadır');
  assert.equal(gorselSayisi(hayirBelge.getPage(1)), gorselSayisi(kaynak.getPage(1)), 'Hayır seçeneğinde imza görseli gömülmez');
  const cikti = new URL('../.codex/cikti/ihtida/ek10-2026-evet.pdf', import.meta.url); mkdirSync(new URL('../.codex/cikti/ihtida/', import.meta.url), { recursive: true }); writeFileSync(cikti, evet);
  const metin = pdfMetni(cikti);
  assert.match(metin, /Deniz Élodie Örnek/); assert.match(metin, /09\/09\/2026/);
  await assert.rejects(() => ek10Uret({ ...ortak, imzaAktarimIzni: undefined }), /Evet veya Hayır/);
});
