/**
 * Cami ekranının Kur'an kayıtlarına (ayetler.json, Kur'an duaları dualar.json, tema kartlarındaki âyetler
 * kartlar.json) Fransızca meâl ekler: Muhammad Hamidullah çevirisi (24 Ekim 2026 kararı).
 *
 * Karar: ekranın FR meâli Diyanet'in Fransızca meâli (Mohammed Chiadmi, «Le Noble Coran», DİB 2022) olacaktı
 * (27 Eylül 2026, docs/EKRAN-YOL-HARITASI.md). Chiadmi dijitalde yok: kuran.diyanet.gov.tr `/meal/kaynaklar` TR/EN/DE/RU/ES
 * sunuyor, Fransızca yok; kitap yalnız basılı. İnternetteki Chiadmi PDF'leri yetkisiz Tawhid 2008 baskısıdır. Ezber Kilimi
 * (egitim.ulucamii.be) aynı gün aynı gerekçeyle Hamidullah'a geçti (scripts/ezber-meal-fr.mjs); çocuk sınıfta, sitede ve
 * camideki ekranda aynı Fransızca metni görür. Çevirmen adı yazılır, «Diyanet meâli» denmez. Diyanet'in Fransızca meâli
 * dijital olarak açılınca bu betiğin yerine o kaynak gelir (kaynakFr ve bu dosya birlikte değişir).
 *
 * Metin: api.alquran.cloud `fr.hamidullah`; her âyet Tanzil'in aynı adlı dosyasıyla karşılaştırılır, ikisi birebir aynı
 * değilse hiçbir dosya yazılmaz. Tanzil çevirileri ticari olmayan kullanım içindir; site ücretsizdir.
 *
 * Kuralları:
 * - Kaydın Arapçası, âyet aralığının Tanzil Uthmani metniyle harf iskeletinde AYNI olmalıdır (scripts/ezber-iskelet.mjs
 *   `iskelet`). Âyetin yalnız bir parçasını taşıyan kayda (ör. dua olarak okunan yarım âyet) bütün âyetin çevirisi
 *   konmaz: FR eklenmez, kayıt AR + TR kalır ve raporlanır.
 * - Ekrana sığmayan kayda FR eklenmez (src/lib/ekran/butce.ts): FR'li hâli bütçeyi aşarsa derleme kaydı tümden düşürürdü.
 *   Kayıt AR + TR kalır ve aşım raporlanır.
 * - Fransız yazım kuralı (yalnız tipografi, harf değişmez): düz kesme işareti «’», «? ! ; :» öncesinde boşluk, «« »»
 *   içinde boşluk (kaynak «Entrez…» diye bitişik yazar); bölünmez boşluğu çalışma anında src/lib/fransiz-tipografi.ts
 *   koyar; düz çift tırnak «« »». Kaynakla karşılaştırma bu
 *   dönüşümden sonra aynı dönüşümle yapılır.
 *
 *   node scripts/ekran-meal-fr.mjs --kuru     yazmadan rapor verir
 *   node scripts/ekran-meal-fr.mjs            önbellekle çeker, src/data/ekran/*.json dosyalarına yazar
 *   node scripts/ekran-meal-fr.mjs --denetle  önbelleksiz yeniden çeker; dosyalarla fark varsa çıkış 1
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { iskelet, BESMELE } from './ezber-iskelet.mjs';
import { fransizMetin } from '../src/lib/fransiz-tipografi.ts';
import { maneviButce } from '../src/lib/ekran/butce.ts';
import { ayetKaynagi, referans } from '../src/lib/ekran/kaynak.ts';

const VERI = resolve('src/data/ekran');
// Ezber Kilimi'nin FR meâl betiğiyle aynı önbellek: Tanzil dosyası ve sûre yanıtları bir kez iner.
const ONBELLEK = resolve('node_modules/.cache/ezber-meal-fr');
const UA = { 'User-Agent': 'Mozilla/5.0 (ulucamii.be ekran; info@ulucamii.be)' };
const denetle = process.argv.includes('--denetle');
const kuru = process.argv.includes('--kuru');
export const KAYNAK_FR = 'Hamidullah';

async function getir(url, dosya) {
  const yol = resolve(ONBELLEK, dosya);
  if (!denetle && existsSync(yol)) return readFileSync(yol, 'utf8');
  const y = await fetch(url, { headers: UA });
  if (!y.ok) throw new Error(`${url} HTTP ${y.status}`);
  const t = await y.text();
  mkdirSync(ONBELLEK, { recursive: true });
  writeFileSync(yol, t);
  await new Promise((r) => setTimeout(r, 250)); // sunucuya nazik ol
  return t;
}

/** Hamidullah'ın düz metnine Fransız yazım kuralı (yalnız tipografi). */
export function fransizYazim(s) {
  return s
    .replace(/'/g, '’')
    .replace(/"([^"]*)"/g, '« $1 »')
    .replace(/«\s*/g, '« ')
    .replace(/\s*»/g, ' »')
    .replace(/(\S)([?!;:])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Tanzil dosyası: «sûre|âyet|metin» satırları, sonda # ile başlayan künye.
const tanzil = new Map();
for (const satir of (await getir('https://tanzil.net/trans/?transID=fr.hamidullah&type=txt-2', 'tanzil-fr.hamidullah.txt')).split('\n')) {
  const m = /^(\d+)\|(\d+)\|(.*)$/.exec(satir.trimEnd());
  if (m) tanzil.set(`${m[1]}:${m[2]}`, m[3].trim());
}
if (tanzil.size !== 6236) throw new Error(`Tanzil dosyasında ${tanzil.size} âyet var, 6236 bekleniyordu`);

const frSureleri = new Map();
const arSureleri = new Map();
async function sure(n) {
  if (!frSureleri.has(n)) {
    const fr = JSON.parse(await getir(`https://api.alquran.cloud/v1/surah/${n}/fr.hamidullah`, `alquran-${n}.json`));
    if (fr.data?.edition?.identifier !== 'fr.hamidullah') throw new Error(`${n}: beklenmeyen FR sürümü`);
    frSureleri.set(n, new Map(fr.data.ayahs.map((x) => [x.numberInSurah, x.text.trim()])));
    const ar = JSON.parse(await getir(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`, `alquran-ar-${n}.json`));
    if (ar.data?.edition?.identifier !== 'quran-uthmani') throw new Error(`${n}: beklenmeyen Arapça sürüm`);
    arSureleri.set(n, new Map(ar.data.ayahs.map((x) => [x.numberInSurah, x.text.replace(/^﻿/, '')])));
  }
  return { fr: frSureleri.get(n), ar: arSureleri.get(n) };
}

/** Âyet aralığının Hamidullah metni (iki kaynaklı) ve Uthmani iskeleti. */
async function aralik(s, a, b) {
  const { fr, ar } = await sure(s);
  const metinler = [];
  const iskeletler = [];
  for (let n = a; n <= b; n++) {
    const metin = fr.get(n);
    const ikinci = tanzil.get(`${s}:${n}`);
    if (!metin) throw new Error(`${s}:${n} api.alquran.cloud'da yok`);
    if (metin !== ikinci) throw new Error(`${s}:${n} iki kaynak farklı\n  alquran: ${metin}\n  tanzil:  ${ikinci}`);
    metinler.push(metin);
    let t = iskelet(ar.get(n));
    // Tanzil, sûrelerin 1. âyetine besmeleyi ekler; Diyanet'te besmele yalnız Fâtiha'nın 1. âyetidir.
    if (n === 1 && s !== 1 && s !== 9 && t.startsWith(iskelet(BESMELE))) t = t.slice(iskelet(BESMELE).length);
    iskeletler.push(t);
  }
  return { metin: metinler.join(' '), iskelet: iskeletler.join('') };
}

const oku = (ad) => JSON.parse(readFileSync(resolve(VERI, `${ad}.json`), 'utf8'));
const dosyalar = { ayetler: oku('ayetler'), dualar: oku('dualar'), kartlar: oku('kartlar') };

/** Kayıttaki âyet künyesi: ayetler ve kart âyetleri düz, Kur'an duaları `ayet` nesnesinde; hadis duası ve diğerleri yok. */
function kunye(dosya, k) {
  if (dosya === 'ayetler') return { tur: 'ayet', ...k };
  if (dosya === 'dualar') return k.ayet ? { tur: 'dua', sure: k.ayet.sure, ayet: k.ayet.ayet, sureAdi: k.ayet.sureAdi } : null;
  return k.cesit === 'ayet' ? { tur: 'ayet', sure: k.sure, ayet: k.ayet, sureAdi: k.sureAdi } : null;
}

/** `kaynakFr`'yi `tr`'nin hemen arkasına, `fr`'yi `tr`'den sonra koyarak anahtar sırasını korur. */
function frYaz(k, fr) {
  const yeni = {};
  for (const [ad, deger] of Object.entries(k)) {
    if (ad === 'fr' || ad === 'kaynakFr') continue;
    yeni[ad] = deger;
    if (ad === 'tr' && fr) yeni.fr = fr.fr;
    if (ad === 'kaynakTr' && fr) yeni.kaynakFr = fr.kaynakFr;
  }
  return yeni;
}

const rapor = { eklendi: [], sigmaz: [], arapcaFarkli: [], diger: [] };
const yazilacak = {};
for (const [dosya, liste] of Object.entries(dosyalar)) {
  yazilacak[dosya] = [];
  for (const k of liste) {
    const ku = kunye(dosya, k);
    if (!ku || k.durum !== 'imam-onayli') { yazilacak[dosya].push(k); continue; }
    if (k.kaynakFr && !/Hamidullah/.test(k.kaynakFr)) { rapor.diger.push(`${k.id}: başka bir FR kaynağı var (${k.kaynakFr}); dokunulmadı`); yazilacak[dosya].push(k); continue; }
    const [a, b] = [ku.ayet[0], ku.ayet[ku.ayet.length - 1]];
    const { metin, iskelet: aralikIskeleti } = await aralik(ku.sure, a, b);
    const kayitIskeleti = iskelet(k.ar);
    if (kayitIskeleti !== aralikIskeleti) {
      const nasil = aralikIskeleti.includes(kayitIskeleti) ? 'âyetin bir parçası' : 'Uthmani metinden farklı';
      rapor.arapcaFarkli.push(`${k.id} (${ku.sure}:${ku.ayet.join('-')}): kaydın Arapçası ${nasil} (${kayitIskeleti.length}/${aralikIskeleti.length} harf)`);
      yazilacak[dosya].push(frYaz(k, null));
      continue;
    }
    const fr = fransizMetin(fransizYazim(metin));
    const ham = fransizYazim(metin);
    const aday = { fr: ham, kaynakFr: KAYNAK_FR };
    const oge = { referans: referans(ku.sureAdi, ku.sure, ku.ayet), kaynakTr: k.kaynakTr, fr, kaynakFr: KAYNAK_FR };
    const b2 = maneviButce(ku.tur, { ar: k.ar, tr: k.tr, fr, kaynak: ayetKaynagi(oge) });
    if (!b2.uygun) {
      rapor.sigmaz.push(`${k.id} (${ku.sure}:${ku.ayet.join('-')}): FR ile ekrana sığmaz (${b2.asim.join(', ')}); AR + TR kalır`);
      yazilacak[dosya].push(frYaz(k, null));
      continue;
    }
    rapor.eklendi.push(`${k.id} ${ku.sure}:${ku.ayet.join('-')}`);
    yazilacak[dosya].push(frYaz(k, aday));
  }
}

console.log(`FR eklenen: ${rapor.eklendi.length}`);
for (const [ad, liste] of Object.entries(rapor)) if (ad !== 'eklendi' && liste.length) console.log(`\n${ad} (${liste.length}):\n  ${liste.join('\n  ')}`);

const farkli = [];
for (const [dosya, liste] of Object.entries(yazilacak)) {
  const metin = JSON.stringify(liste, null, 2) + '\n';
  if (metin !== readFileSync(resolve(VERI, `${dosya}.json`), 'utf8')) farkli.push(dosya);
  if (!kuru && !denetle) writeFileSync(resolve(VERI, `${dosya}.json`), metin);
}
if (denetle) {
  console.log(farkli.length ? `\nKaynakla farklı dosya: ${farkli.join(', ')}` : '\nBütün ekran FR meâlleri kaynakla aynı.');
  if (farkli.length) process.exitCode = 1;
} else if (!kuru) console.log(`\nYazılan dosya: ${farkli.join(', ') || 'yok (zaten güncel)'}`);
