// İlim Yolu tasarım taslakları: Arapça metni ve meâli elle yazmadan, Diyanet kaynaklı ezber JSON'undan birebir
// yerleştirir. İşaretler (etiketin içi her çalıştırmada yeniden yazılır, iç içe etiket kullanılmaz):
//   data-ar="s-ihlas:1"        → src/data/ezber/metin/s-ihlas.json, bolumler[no=1].ar
//   data-meal="s-ihlas:1"      → meal.tr.gruplar içinde 1. âyeti kapsayan grubun metni
//   data-sure-adi="s-ihlas"    → sureAdi
// Çalıştırma: node egitim/docs/taslaklar/ilim-yolu/yerlestir.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const KOK = new URL('./', import.meta.url);
const METIN = new URL('../../../../src/data/ezber/metin/', import.meta.url);
const SAYFALAR = ['a', 'b', 'c'].flatMap((x) => ['ana-girisli', 'ana-misafir', 'giris'].map((s) => `${x}/${s}.html`));

const onbellek = new Map();
const oku = (id) => {
  if (!onbellek.has(id)) onbellek.set(id, JSON.parse(readFileSync(new URL(`${id}.json`, METIN), 'utf8')));
  return onbellek.get(id);
};
const kacis = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function deger(tur, anahtar) {
  const [id, no] = anahtar.split(':');
  const t = oku(id);
  if (tur === 'ar') {
    const b = t.bolumler.find((x) => String(x.no) === no);
    if (!b) throw new Error(`${id}: ${no}. bölüm yok`);
    return b.ar;
  }
  if (tur === 'meal') {
    const g = t.meal.tr.gruplar.find((x) => +no >= x.ayetler[0] && +no <= x.ayetler[1]);
    if (!g) throw new Error(`${id}: ${no}. âyetin meâli yok`);
    return g.metin;
  }
  if (tur === 'sure-adi') return t.sureAdi;
  throw new Error(`bilinmeyen tür ${tur}`);
}

const DESEN = /(<([a-z][a-z0-9]*)\b[^>]*\bdata-(ar|meal|sure-adi)="([^"]+)"[^>]*>)[^<]*(<\/\2>)/g;
let toplam = 0;
for (const yol of SAYFALAR) {
  const url = new URL(yol, KOK);
  let html;
  try { html = readFileSync(url, 'utf8'); } catch { continue; }
  let sayi = 0;
  const yeni = html.replace(DESEN, (_, ac, _etiket, tur, anahtar, kapa) => { sayi++; return ac + kacis(deger(tur, anahtar)) + kapa; });
  if (yeni !== html) writeFileSync(url, yeni);
  if (sayi) console.log(`${yol}: ${sayi} yer`);
  toplam += sayi;
}
console.log(`toplam ${toplam} yer dolduruldu`);
