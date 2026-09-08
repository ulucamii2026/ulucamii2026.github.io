/** İmza zinciri sınaması (8 Eylül 2026).
 *
 *  Soru: formda ekrana çizilen imza ile yüklenen vesikalık, EK-9 belgesine gerçekten basılıyor mu?
 *  Bu betik zincirin BAŞINDAN alır: scripts/form-tarayici-test.py'nin kaydettiği GERÇEK gönderim
 *  gövdesini (D:/tmp/form-test/ihtida-govde.json) okur, Apps Script'in yaptığı gibi veri URL'lerini
 *  bayta çevirir ve panelin kullandığı ek9.js ile belgeyi üretir.
 *
 *  Kullanım:  node scripts/ek9-imza-zinciri.mjs
 *  Çıktı:     D:/tmp/ek9-imza-zinciri.pdf  (+ konsolda denetim satırları)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import * as pdfLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ek9Uret } from '../public/admin/ek9.js';

const KOK = 'D:/app/ulucamii-site/';
const GOVDE = 'D:/tmp/form-test/ihtida-govde.json';
const oku = (p) => new Uint8Array(readFileSync(p));

if (!existsSync(GOVDE)) {
  console.error(`Gövde yok: ${GOVDE}\nÖnce: ONIZLEME=http://localhost:4399 py -3.14 scripts/form-tarayici-test.py`);
  process.exit(1);
}
const govde = JSON.parse(readFileSync(GOVDE, 'utf-8'));
const g = govde.gorseller || {};

/** Apps Script'teki veriUrlBlob'un Node karşılığı — aynı kabul kuralları. */
function veriUrlBayt(veri) {
  const m = String(veri || '').match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/);
  if (!m) return null;
  const bayt = new Uint8Array(Buffer.from(m[2], 'base64'));
  return { tur: m[1], bayt };
}

let hata = 0;
const denet = (ad, kosul, ek = '') => {
  console.log((kosul ? 'OK   ' : 'HATA ') + ad + (ek ? '  ' + ek : ''));
  if (!kosul) hata++;
};

const vesikalik = veriUrlBayt(g.vesikalik);
const imza = veriUrlBayt(g.imza);
denet('vesikalık veri URL çözüldü', !!vesikalik, vesikalik ? `${vesikalik.tur}, ${vesikalik.bayt.length} bayt` : '');
denet('imza veri URL çözüldü', !!imza, imza ? `${imza.tur}, ${imza.bayt.length} bayt` : '');
denet('imza PNG imzasını taşıyor', !!imza && imza.bayt[0] === 0x89 && imza.bayt[1] === 0x50);
denet('vesikalık JPEG imzasını taşıyor', !!vesikalik && vesikalik.bayt[0] === 0xff && vesikalik.bayt[1] === 0xd8);

// PNG başlığından imzanın gerçek ölçüsü — boş/kırpılmamış bir kare göndermediğimizi doğrular.
if (imza) {
  const dv = new DataView(imza.bayt.buffer, imza.bayt.byteOffset);
  const en = dv.getUint32(16), boy = dv.getUint32(20);
  denet('imza kırpılmış (kanvasın tamamı değil)', en > 20 && boy > 10 && en < 1000, `${en}×${boy} px`);
}

const b = govde.basvuran || {};
const bytes = await ek9Uret({
  pdfLib, fontkit,
  sablonBytes: oku(KOK + 'public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf'),
  fontBytes: oku(KOK + 'public/fonts/Lora-Regular.ttf'),
  fontKalinBytes: oku(KOK + 'public/fonts/Lora-Bold.ttf'),
  uyar: (kod) => denet('ek9 uyarısı yok', false, kod),
  veri: {
    adSoyad: b.adSoyad, belgeNo: '', belgeTarihi: '08/09/2026', duzenleyen: 'Marche-en-Famenne Ulu Camii',
    cinsiyet: b.cinsiyet === 'kadin' ? 'Kadın / Femme' : 'Erkek / Homme',
    ogrenim: b.ogrenimDurumu, anneAdi: b.anneAdi, babaAdi: b.babaAdi,
    dogumYeri: b.dogumYeri, dogumTarihi: (b.dogumTarihi || '').split('-').reverse().join('/'),
    medeniHali: b.medeniHali, meslek: b.meslek, uyruk: b.uyruk, tcKimlik: '',
    oncekiDin: b.oncekiDin, ihtidaSebebi: b.ihtidaSebebi || '', ihtidaTarihi: '08/09/2026',
    eposta: b.eposta, telefon: b.telefon, adres: b.adres, beyanTarihi: '08/09/2026',
  },
  foto: g.vesikalik,                       // panel de veri URL'ini olduğu gibi geçer
  sahitler: [],
  yedekImzalar: [],
  basvuranImza: g.imza,
  tarih: new Date('2026-09-08T12:00:00Z'),
});

const cikti = 'D:/tmp/ek9-imza-zinciri.pdf';
writeFileSync(cikti, bytes);

// Şablonun kendi boyutuna göre büyüme: gömülen görseller belgeye gerçekten girdi mi?
const sablonBoy = readFileSync(KOK + 'public/belgeler/ihtida/ihtida-belgesi-ek9-ornek.pdf').length;
denet('belge şablondan büyük (görseller gömüldü)', bytes.length > sablonBoy, `${sablonBoy} → ${bytes.length} bayt`);

console.log(`\nyazildi: ${cikti}`);
process.exit(hata ? 1 : 0);
