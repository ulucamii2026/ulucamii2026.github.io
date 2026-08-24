import { readFileSync, writeFileSync } from 'node:fs';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ek9Uret } from '../public/admin/ek9.js';

const KOK = 'D:/app/ulucamii-site/';
const oku = (p) => new Uint8Array(readFileSync(p));

const veri = {
  adSoyad: 'Frédéric Pouillon',
  belgeNo: '',
  belgeTarihi: '24/08/2026',
  duzenleyen: 'Marche-en-Famenne Ulu Camii',
  cinsiyet: 'Erkek / Homme',
  ogrenim: 'Lisans',
  anneAdi: 'Marie-Christine',
  babaAdi: 'Jean-Pierre',
  dogumYeri: 'Marche-en-Famenne',
  dogumTarihi: '24/04/1979',
  medeniHali: 'Evli',
  meslek: 'Teknisyen',
  uyruk: 'Belçika',
  tcKimlik: '',
  oncekiDin: 'Hristiyanlık / Katolik',
  ihtidaSebebi: 'Uzun süredir İslâm üzerine okumalar yaptım ve kalben tatmin oldum; ailemin desteğiyle karar verdim.',
  ihtidaTarihi: '24/08/2026',
  eposta: 'frederic.pouillon@example.be',
  telefon: '+32 471 79 46 82',
  adres: 'Thier des Corbeaux 14, 6900 Marche-en-Famenne, Belçika',
  beyanTarihi: '24/08/2026',
};

const test = process.argv[2] || 'tam';
// tam: iki sahit de basvurudan | bir: tek sahit -> Ridvan tamamlar | hic: iki sahit de yedek
const sahitler = test === 'tam'
  ? [{ ad: 'Ahmet Yılmaz', imza: oku('C:/Users/ridva/.claude/assets/imza.png') },
     { ad: 'Mehmet Demir', imza: oku('C:/Users/ridva/.claude/assets/imza-yeliz.png') }]
  : test === 'bir'
    ? [{ ad: 'Ahmet Yılmaz', imza: oku('C:/Users/ridva/.claude/assets/imza.png') }, null]
    : [];

const bytes = await ek9Uret({
  pdfLib, fontkit,
  sablonBytes: oku(KOK + 'public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'),
  fontBytes: oku(KOK + 'public/fonts/Lora-Regular.ttf'),
  fontKalinBytes: oku(KOK + 'public/fonts/Lora-Bold.ttf'),
  veri,
  foto: oku('D:/tmp/test-vesikalik.jpg'),
  sahitler,
  yedekImzalar: [
    { ad: 'Rıdvan KAYAHAN', imza: oku('C:/Users/ridva/.claude/assets/imza.png') },
    { ad: 'Yeliz KAYAHAN', imza: oku('C:/Users/ridva/.claude/assets/imza-yeliz.png') },
  ],
  basvuranImza: oku('C:/Users/ridva/.claude/assets/imza.png'),
  tarih: new Date('2026-08-24T21:00:00Z'),
});
writeFileSync(`D:/tmp/ek9-cikti-${test}.pdf`, bytes);
console.log(`yazildi: D:/tmp/ek9-cikti-${test}.pdf (${bytes.length} bayt)`);
