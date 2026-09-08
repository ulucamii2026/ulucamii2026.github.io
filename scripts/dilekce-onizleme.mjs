/** Mühtedi dilekçesinin önizlemesi (8 Eylül 2026).
 *
 *  Panelin ürettiği belgenin aynısını Node'da üretir; imza olarak tarayıcı testinin kaydettiği
 *  GERÇEK imzayı kullanır (D:/tmp/form-test/ihtida-govde.json), yoksa imza satırını boş bırakır.
 *
 *  Kullanım: node scripts/dilekce-onizleme.mjs [tr|fr|en]
 *  Çıktı:    D:/tmp/dilekce-<dil>.pdf
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { dilekceUret } from '../public/admin/dilekce.js';

const KOK = 'D:/app/ulucamii-site/';
const oku = (p) => new Uint8Array(readFileSync(p));
const dil = process.argv[2] || 'fr';

const GOVDE = 'D:/tmp/form-test/ihtida-govde.json';
let imza = '';
if (existsSync(GOVDE)) {
  imza = (JSON.parse(readFileSync(GOVDE, 'utf-8')).gorseller || {}).imza || '';
}

const bytes = await dilekceUret({
  pdfLib, fontkit,
  fontBytes: oku(KOK + 'public/fonts/Lora-Regular.ttf'),
  fontKalinBytes: oku(KOK + 'public/fonts/Lora-Bold.ttf'),
  veri: {
    ref: 'IH-2026-0007',
    adSoyad: 'Frédéric Pouillon',
    dogumYeri: 'Marche-en-Famenne',
    dogumTarihi: '24/04/1979',
    uyruk: 'Belçika',
    adres: 'Thier des Corbeaux 14, 6900 Marche-en-Famenne',
    telefon: '+32 471 79 46 82',
    eposta: 'frederic.pouillon@example.be',
    dil,
  },
  imza,
  tarih: new Date('2026-09-08T12:00:00Z'),
});

const cikti = `D:/tmp/dilekce-${dil}.pdf`;
writeFileSync(cikti, bytes);
console.log(`yazildi: ${cikti} (${bytes.length} bayt, imza ${imza ? 'var' : 'YOK'})`);
