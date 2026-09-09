// EK-9 kenar durumları: çok uzun ad/adres, kadın başvuran, T.C. vatandaşı, eksik alanlar.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ek9Uret, sahitleriCoz } from '../public/admin/ek9.js';

const KOK = new URL('../', import.meta.url).pathname.replace(/^\/(?:([A-Z]:))/, '$1');
const OUT = new URL('../.codex/cikti/ihtida/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const testGorsel = await sharp({ create: { width: 120, height: 80, channels: 3, background: '#7c7461' } }).png().toBuffer();
const oku = (p) => new Uint8Array(readFileSync(p));
const kaynak = {
  sablonBytes: oku(KOK + 'public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'),
  fontBytes: oku(KOK + 'public/fonts/Lora-Regular.ttf'),
  fontKalinBytes: oku(KOK + 'public/fonts/Lora-Bold.ttf'),
  fontKaligrafiBytes: oku(KOK + 'public/fonts/GreatVibes-Regular.ttf'),
  fontElYazisiBytes: oku(KOK + 'public/fonts/Caveat-Medium.ttf'),
};

// --- 1) sahitleriCoz mantığı (birim testi)
const im = (x) => 'data:image/png;base64,' + x;
const yedek = [{ ad: 'Rıdvan KAYAHAN', imza: im('R') }, { ad: 'Yeliz KAYAHAN', imza: im('Y') }];
const senaryolar = [
  ['iki sahit de var', [{ ad: 'A', imza: im('a') }, { ad: 'B', imza: im('b') }]],
  ['yalniz 1. sahit', [{ ad: 'A', imza: im('a') }]],
  ['yalniz 2. sahit', [null, { ad: 'B', imza: im('b') }]],
  ['hicbiri', []],
  ['ad var imza yok', [{ ad: 'A', imza: '' }]],
];
assert.equal(sahitleriCoz([{ ad: 'A', imza: '' }], yedek)[0].ad, 'A');
assert.equal(sahitleriCoz([{ ad: 'A', imza: '' }], yedek)[0].yedek, false);
console.log('--- sahitleriCoz ---');
for (const [ad, girdi] of senaryolar) {
  const s = sahitleriCoz(girdi, yedek).map((x) => (x ? `${x.ad}${x.yedek ? ' (cami)' : ''}` : 'YOK'));
  console.log(`  ${ad.padEnd(18)} -> ${s.join('  |  ')}`);
}

// --- 2) uzun metin / farklı veri kenar durumları
const uzun = {
  adSoyad: 'Abdurrahman Muhammed El-Hüseyin Van Der Berghe-Şahingiray',
  belgeNo: '', belgeTarihi: '25/08/2026', duzenleyen: 'Marche-en-Famenne Ulu Camii',
  cinsiyet: 'Kadın / Femme', ogrenim: 'Yüksek lisans (İşletme ve Uluslararası İlişkiler)',
  anneAdi: 'Marie-Christine Van Der Berghe', babaAdi: 'Jean-Pierre Alexandre Şahingiray',
  dogumYeri: 'Saint-Josse-ten-Noode / Bruxelles-Capitale',
  dogumTarihi: '03/11/1994', medeniHali: 'Boşanmış', meslek: 'Uluslararası nakliye koordinatörü',
  uyruk: 'Belçika / Türkiye (çifte vatandaş)', tcKimlik: '12345678901',
  oncekiDin: 'Hristiyanlık / Protestan (Evanjelik)',
  ihtidaSebebi: 'Uzun yıllar süren okuma, araştırma ve cami cemaatiyle kurduğum dostluk sonucunda İslâm’ın tevhid inancına kalben ikna oldum; ailemin ve eşimin desteğiyle bu kararı verdim ve resmî olarak kaydedilmesini istiyorum.',
  ihtidaTarihi: '05/09/2026', eposta: 'abdurrahman.elhuseyin.vanderberghe@example.test',
  telefon: '+32 471 79 46 82',
  adres: 'Chaussée de Marche 1247, Boîte 12, 5100 Jambes (Namur), Belçika — geçici ikamet: Thier des Corbeaux 14, 6900 Marche-en-Famenne',
  beyanTarihi: '25/08/2026',
};
const bytes = await ek9Uret({
  pdfLib, fontkit, ...kaynak, veri: uzun,
  foto: testGorsel,
  sahitler: [],
  yedekImzalar: [
    { ad: 'Rıdvan KAYAHAN', imza: testGorsel },
    { ad: 'Yeliz KAYAHAN', imza: testGorsel },
  ],
  basvuranImza: testGorsel,
  tarih: new Date('2026-08-25T06:00:00Z'),
});
writeFileSync(new URL('ek9-kenar-uzun.pdf', OUT), bytes);
console.log('\nuzun veri PDF:', bytes.length, 'bayt');

// --- 3) boş/eksik veri (hiçbir alan yok) — çökmemeli
const bos = await ek9Uret({ pdfLib, fontkit, ...kaynak, veri: {}, sahitler: [], yedekImzalar: [] });
writeFileSync(new URL('ek9-kenar-bos.pdf', OUT), bos);
console.log('bos veri PDF:', bos.length, 'bayt (cokme yok)');

// Normal uzunlukta isim, Türkçe/Fransızca harfler ve mavi el yazısı önizlemesi.
const ornekVeri = { ...uzun, adSoyad: 'Deniz Örnek', anneAdi: 'Élodie Örnek', babaAdi: 'İlhan Örnek',
  ogrenim: 'Lisans', dogumYeri: 'Liège', meslek: 'Öğretmen', uyruk: 'Belçika', tcKimlik: '',
  oncekiDin: 'Hristiyanlık', ihtidaSebebi: 'Kendi isteği ve araştırmaları', eposta: 'deniz@example.test',
  adres: 'Rue du Test 12, 6900 Marche-en-Famenne, Belçika', belgeTarihi: '', duzenleyen: '' };
for (const stil of ['mavi', 'sade']) {
  const pdf = await ek9Uret({ pdfLib, fontkit, ...kaynak, veri: ornekVeri,
    isimYazisi: stil === 'sade' ? 'sade' : 'kaligrafik', alanYazisi: stil === 'sade' ? 'sade' : 'el-yazisi',
    sahitler: [{ ad: 'Birinci Örnek Şahit' }, { ad: 'İkinci Örnek Şahit' }] });
  writeFileSync(new URL(`ek9-ornek-${stil}.pdf`, OUT), pdf);
}
