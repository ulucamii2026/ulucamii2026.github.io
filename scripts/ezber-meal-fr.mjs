/**
 * Ezber maddelerine Fransızca meâl ekler: Muhammad Hamidullah çevirisi (24 Ekim 2026 kararı).
 *
 * Neden Hamidullah: 27 Eylül 2026'da seçilen Diyanet çevirisi (Mohammed Chiadmi, «Le Noble Coran», DİB 2022, ISBN
 * 978-625-435-299-7) yalnız basılı. 24 Ekim 2026'da kuran.diyanet.gov.tr `/meal/kaynaklar` ucunda 8 meâl vardı
 * (TR 4, EN, DE, RU, ES), Fransızca yoktu; Diyanet dijital kitaplığında da yok (19 Ekim araması). Rıdvan kitabın
 * kendisinde olmadığını söyledi ve seçimi Claude'a bıraktı. Kur'an kursunun kaynak zinciri FR meâlde Diyanet'ten sonra
 * Hamidullah'ı ikincil sayar, ders sunumları da onu kullanır: çocuk sınıfta ve sitede aynı Fransızca metni görür.
 * Hamidullah'ın bir baskısını Türkiye Diyanet Vakfı da yayımladı (ISBN 9789753897334). Sayfada çevirmen adı yazılır,
 * «Diyanet meâli» denmez. Diyanet'in Fransızca meâli dijital olarak açılınca bu meâl onunla değiştirilir.
 *
 * Metin: api.alquran.cloud `fr.hamidullah`; her âyet Tanzil'in aynı adlı dosyasıyla karşılaştırılır, ikisi birebir
 * aynı değilse hiçbir dosya yazılmaz. Tanzil çevirileri ticari olmayan kullanım içindir; site ücretsizdir.
 *
 *   node scripts/ezber-meal-fr.mjs             önbellekle çeker, Kur'an maddelerine meal.fr yazar
 *   node scripts/ezber-meal-fr.mjs --denetle   önbelleksiz yeniden çeker; dosyalarla fark varsa çıkış 1
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HEDEF = resolve('src/data/ezber/metin');
const ONBELLEK = resolve('node_modules/.cache/ezber-meal-fr');
const UA = { 'User-Agent': 'Mozilla/5.0 (ulucamii.be ezber; info@ulucamii.be)' };
const KAYNAK = 'Muhammad Hamidullah, traduction française du sens (texte : Tanzil, fr.hamidullah)';
const denetle = process.argv.includes('--denetle');

async function getir(url, dosya) {
  const yol = resolve(ONBELLEK, dosya);
  if (!denetle && existsSync(yol)) return readFileSync(yol, 'utf8');
  const y = await fetch(url, { headers: UA });
  if (!y.ok) throw new Error(`${url} HTTP ${y.status}`);
  const t = await y.text();
  mkdirSync(ONBELLEK, { recursive: true });
  writeFileSync(yol, t);
  return t;
}

// Tanzil dosyası: «sûre|âyet|metin» satırları, sonda # ile başlayan künye.
const tanzil = new Map();
for (const satir of (await getir('https://tanzil.net/trans/?transID=fr.hamidullah&type=txt-2', 'tanzil-fr.hamidullah.txt')).split('\n')) {
  const m = /^(\d+)\|(\d+)\|(.*)$/.exec(satir.trimEnd());
  if (m) tanzil.set(`${m[1]}:${m[2]}`, m[3].trim());
}
if (tanzil.size !== 6236) throw new Error(`Tanzil dosyasında ${tanzil.size} âyet var, 6236 bekleniyordu`);

const hatalar = [];
const farklar = [];
const yazilacak = [];
const sureler = new Map();
for (const ad of readdirSync(HEDEF).filter((a) => /^[sdb]-.*\.json$/.test(a)).sort()) {
  const yol = resolve(HEDEF, ad);
  const eski = JSON.parse(readFileSync(yol, 'utf8'));
  if (!eski.kuran) continue; // Kur'an dışı dualar: meâl değil, anlam taşır (ayrı kaynak)
  const { sure, ayetler: [a, b] } = eski.kuran;
  if (!sureler.has(sure)) {
    const j = JSON.parse(await getir(`https://api.alquran.cloud/v1/surah/${sure}/fr.hamidullah`, `alquran-${sure}.json`));
    if (j.data?.edition?.identifier !== 'fr.hamidullah') throw new Error(`${sure}: beklenmeyen sürüm`);
    sureler.set(sure, new Map(j.data.ayahs.map((x) => [x.numberInSurah, x.text.trim()])));
  }
  const gruplar = [];
  for (let n = a; n <= b; n++) {
    const metin = sureler.get(sure).get(n);
    const ikinci = tanzil.get(`${sure}:${n}`);
    if (!metin) hatalar.push(`${eski.id}: ${sure}:${n} api.alquran.cloud'da yok`);
    else if (metin !== ikinci) hatalar.push(`${eski.id}: ${sure}:${n} iki kaynak farklı\n  alquran: ${metin}\n  tanzil:  ${ikinci}`);
    else gruplar.push({ ayetler: [n, n], metin });
  }
  const fr = { kaynak: KAYNAK, gruplar };
  if (JSON.stringify(eski.meal.fr) === JSON.stringify(fr)) continue;
  if (eski.meal.fr && /Chiadmi/.test(eski.meal.fr.kaynak)) { hatalar.push(`${eski.id}: Diyanet'in Chiadmi meâli var, üzerine yazılmaz`); continue; }
  farklar.push(eski.id);
  yazilacak.push([yol, JSON.stringify({ ...eski, meal: { ...eski.meal, fr } }, null, 1) + '\n']);
}

if (hatalar.length) { console.error(hatalar.join('\n')); process.exit(1); }
if (denetle) {
  console.log(farklar.length ? `Kaynakla farklı ${farklar.length} madde: ${farklar.join(', ')}` : 'Bütün FR meâller kaynakla aynı.');
  if (farklar.length) process.exitCode = 1;
} else {
  for (const [yol, metin] of yazilacak) writeFileSync(yol, metin);
  console.log(`${yazilacak.length} maddeye FR meâl yazıldı (${sureler.size} sûre, her âyet iki kaynakla aynı).`);
}
