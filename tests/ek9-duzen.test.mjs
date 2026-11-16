// EK-9 ön yüz DÜZEN 2 (16 Kas 2026): yetkilinin ıslak imza/mühür alanı. Yalnız konum değişir; metin, süsleme ve filigran aynı kalır.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ek9Uret, EK9_DUZEN, EK9_DUZEN_KAYMA, EK9_YETKILI_IMZA_ALANI, EK9_ZAMIR_CIZIKLERI } from '../public/admin/ek9.js';

const oku = (ad) => readFileSync(new URL('../public/' + ad, import.meta.url));
const SABLON = oku('belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf');
const SAYFA_H = 595.2756;
const OLCEK = 0.983158;   // şablonun metin bölümündeki cm ölçeği

async function ilkAkis(bytes) {
  const doc = await pdfLib.PDFDocument.load(bytes);
  const refler = doc.getPage(0).node.Contents().asArray();
  const akislar = refler.map(ref => Buffer.from(pdfLib.decodePDFRawStream(doc.context.lookup(ref)).decode()));
  return akislar.reduce((a, b) => (b.length > a.length ? b : a));
}

test('Düzen 2: sürüm sabiti ve kayma değerleri belgelenen değerlerdir', () => {
  assert.equal(EK9_DUZEN, 2);
  assert.deepEqual(EK9_DUZEN_KAYMA, { ust: -6.5, ingilizce: -10.25, yetkili: 8 });
  const { tam, cep } = EK9_YETKILI_IMZA_ALANI;
  assert.ok(tam.alt - tam.ust >= 16 - 1e-9, 'tam şerit en az 16 pt');
  assert.ok(cep.alt - cep.ust >= 36 - 1e-9, 'cep en az 36 pt');
  assert.equal(cep.alt, tam.alt);
  // Zamir çizikleri İngilizce paragrafla birlikte kaydı.
  assert.ok(Math.abs(EK9_ZAMIR_CIZIKLERI.erkek[0][2] - (350.9 - 10.25)) < 1e-9);
});

test('Düzen 2: şablonda süsleme/filigran akışı bayt bayt aynı, bloklar tam kayma kadar kaymış', async () => {
  const akis = (await ilkAkis(SABLON)).toString('latin1');
  const i = akis.indexOf('BT 1 0 0 1 397.2636');
  assert.ok(i > 0);
  // Çerçeve ve orta filigran (bu işaretten önceki bölüm) eski şablonla aynı: SHA-256 eski şablondan alındı.
  assert.equal(createHash('sha256').update(akis.slice(0, i), 'latin1').digest('hex'), '394b2f9debe840a9ea4154192ad72249159209befddfd289ac7bb77747d8089b');
  const y = [...akis.slice(i).matchAll(/1 0 0 1 [\d.]+ ([\d.]+) Tm/g)].map(m => Number(m[1]));
  const eski = [444.06, 444.06, 429.26, 429.26, 414.36, 414.36, 381.96, 361.56, 306.16, 288.16, 270.16, 243.56, 225.56, 207.56, 168.56, 169.06, 155.76, 168.56];
  const kayma = [...Array(11).fill(EK9_DUZEN_KAYMA.ust), ...Array(3).fill(EK9_DUZEN_KAYMA.ingilizce), 0, EK9_DUZEN_KAYMA.yetkili, EK9_DUZEN_KAYMA.yetkili, 0];
  assert.equal(y.length, eski.length);
  y.forEach((v, k) => assert.ok(Math.abs(v - (eski[k] - kayma[k] / OLCEK)) < 2e-5, `satır ${k}: ${v}`));
});

test('Düzen 2: ek9Uret yetkili adı/unvanını +8 pt aşağıya yazar; imza cebi basılı adın üstünde ve boş', async () => {
  const kaynak = { pdfLib, fontkit, sablonBytes: SABLON, fontBytes: oku('fonts/Lora-Regular.ttf'), fontKalinBytes: oku('fonts/Lora-Bold.ttf'), kalemFontBytes: oku('fonts/Allura-Regular.ttf') };
  const bytes = await ek9Uret({ ...kaynak, veri: { adSoyad: 'Deneme Örnek' }, sahitler: [], yedekImzalar: [] });
  const doc = await pdfLib.PDFDocument.load(bytes);
  const metin = doc.getPage(0).node.Contents().asArray()
    .map(ref => Buffer.from(pdfLib.decodePDFRawStream(doc.context.lookup(ref)).decode()).toString('latin1')).join('\n');
  const yazilar = [...metin.matchAll(/1 0 0 1 ([-\d.]+) ([-\d.]+) Tm\s+<([A-F\d]+)> Tj/g)].map(m => ({ x: +m[1], y: +m[2] }));
  const adSatiri = yazilar.find(t => Math.abs(t.y - (SAYFA_H - (401 + EK9_DUZEN_KAYMA.yetkili))) < 0.01);
  const unvanSatiri = yazilar.find(t => Math.abs(t.y - (SAYFA_H - (415 + EK9_DUZEN_KAYMA.yetkili))) < 0.01);
  assert.ok(adSatiri && unvanSatiri, 'Salih GÖR ve unvan satırı kaymış tabanda olmalı');
  // Basılı adın üstü (kapaktaki aksan dahil ≈ 12 pt) imza cebinin altından aşağıda başlar.
  assert.ok(SAYFA_H - adSatiri.y - 12 >= EK9_YETKILI_IMZA_ALANI.cep.alt - 1.5);
});
