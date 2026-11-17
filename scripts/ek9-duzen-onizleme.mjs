/* EK-9 ön yüz yerleşim önizlemesi — YALNIZ KURGUSAL VERİ (gerçek kişi yok).
 * Kullanım: node scripts/ek9-duzen-onizleme.mjs <çıktı.pdf> [kök=.] [bos|dolu]
 *   kök  : ek9.js ve şablonun okunacağı depo kökü (eski düzeni çizmek için eski bir ağacın kökü verilebilir).
 *   bos  : veri/foto/imza yok (yalnız şablon + yetkili adı); dolu: kalem yolundan kurgusal örnek.
 * Çıktı PDF'in yalnız ön yüzü (1. sayfa) anlamlıdır. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import sharp from 'sharp';

const [cikti, kok = '.', kip = 'dolu'] = process.argv.slice(2);
if (!cikti) { console.error('kullanım: node scripts/ek9-duzen-onizleme.mjs <çıktı.pdf> [kök] [bos|dolu]'); process.exit(2); }
const KOK = resolve(kok);
const oku = (p) => new Uint8Array(readFileSync(resolve(KOK, p)));
const { ek9Uret } = await import(pathToFileURL(resolve(KOK, 'public/admin/ek9.js')).href);

// Kurgusal şahit imzaları (vektör kaydı, sürüm 2) ve vesikalık yer tutucusu.
const IMZA_A = JSON.stringify({ v: 2, w: 240, h: 100, p: [{ d: 'M10 80C40 10 80 10 100 60L140 20L230 90', k: 3 }] });
const IMZA_B = JSON.stringify({ v: 2, w: 260, h: 90, p: [{ d: 'M8 70C30 20 70 20 90 55C110 90 150 10 170 40L250 25', k: 3 }] });
const foto = await sharp({ create: { width: 360, height: 460, channels: 3, background: { r: 196, g: 206, b: 216 } } })
  .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="460"><circle cx="180" cy="170" r="70" fill="#8d9aa8"/><ellipse cx="180" cy="400" rx="130" ry="110" fill="#8d9aa8"/></svg>'), top: 0, left: 0 }])
  .jpeg().toBuffer();

const kaynak = {
  pdfLib, fontkit,
  sablonBytes: oku('public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'),
  fontBytes: oku('public/fonts/Lora-Regular.ttf'),
  fontKalinBytes: oku('public/fonts/Lora-Bold.ttf'),
  kalemFontBytes: oku('public/fonts/Allura-Regular.ttf'),
};
const veri = kip === 'bos' ? {} : {
  adSoyad: 'Deneme ÖRNEK', cinsiyet: 'Kadın / Femme', cinsiyetKodu: 'kadin',
  belgeTarihi: '', dogumTarihi: '01/01/1990', uyruk: 'Belçika', ihtidaTarihi: '16/11/2026', beyanTarihi: '16/11/2026',
};
const bytes = await ek9Uret({
  ...kaynak, veri,
  foto: kip === 'bos' ? undefined : new Uint8Array(foto),
  sahitler: kip === 'bos' ? [] : [{ ad: 'Birinci ŞAHİT', imza: IMZA_A }, { ad: 'İkinci ŞAHİT', imza: IMZA_B }],
  yedekImzalar: [],
  tarih: new Date('2026-11-16T09:00:00Z'),
});
writeFileSync(cikti, bytes);
console.log('yazıldı:', cikti, bytes.length, 'bayt');
