/**
 * Ezber metinlerinin harf iskeleti denetimi (Faz 2b, 19 Ekim 2026). Diyanet'in Türk imlâsıyla yazılmış Arapça metin,
 * bağımsız bir kaynakla (Tanzil Uthmani) harekesiz iskelet üzerinden karşılaştırılır: çekim ya da kodlama hatası bir
 * harfi bile değiştirirse test yakalar. Mantık `video-sunum/scripts/arapca_denetle.py`'den taşındı.
 *
 * Gevşek iskelet: hareke ve işaretler atılır, harf biçimleri eşlenir, elif ve hemze atılır (Türk imlâsı ile Uthmani
 * yazım en çok bunlarda ayrılır: الْعَالَمٖينَ ↔ ٱلْعَٰلَمِينَ). Kalan farklar (küçük yâ/vâv ile yazılan uzatma gibi)
 * fikstürde gerekçesiyle tek tek kayıtlıdır.
 *
 * Fikstür (`tests/fixtures/ezber-tanzil-iskelet.json`) Tanzil metnini değil, yalnız iskeletlerin kısa özetini taşır.
 * Yeniden üretim (Tanzil dosyası yerelde, api.alquran.cloud «quran-uthmani» = Tanzil Uthmani, CC BY 3.0):
 *   node scripts/ezber-iskelet.mjs --uret D:/ulu-camii-kuran-kursu/scratch/kitap-md/quran-uthmani.json
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ESLE = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ؤ': 'و', 'ئ': 'ي', 'ى': 'ي', 'ی': 'ي', 'ة': 'ه', 'ۀ': 'ه', 'ک': 'ك' };
const HARFLER = new Set('ابتثجحخدذرزسشصضطظعغفقكلمنهويء');
export const BESMELE = 'بسماللهالرحمنالرحيم';

/** Harekesiz, boşluksuz gevşek iskelet (elif ve hemze atılmış). */
export function iskelet(metin) {
  return [...metin].map((c) => ESLE[c] ?? c).filter((c) => HARFLER.has(c) && c !== 'ا' && c !== 'ء').join('');
}

export const ozet = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/** Kur'an maddelerinin âyet listesi: "sûre:âyet" → [metin dosyası kimlikleri]. */
export function katalogAyetleri(katalog) {
  const ayetler = new Map();
  for (const o of katalog.ogeler) if (o.kuran) {
    const { sure, ayetler: [a, b] } = o.kuran;
    for (let n = a; n <= b; n++) ayetler.set(`${sure}:${n}`, [...(ayetler.get(`${sure}:${n}`) ?? []), o.id]);
  }
  return ayetler;
}

function uret(tanzilYolu) {
  const katalog = JSON.parse(readFileSync('src/data/ezber/katalog.json', 'utf8'));
  const sureler = new Map(JSON.parse(readFileSync(tanzilYolu, 'utf8')).data.surahs.map((s) => [s.number, s.ayahs]));
  const diyanet = new Map();
  for (const ad of readdirSync('src/data/ezber/metin').filter((d) => /^[sdb]-.*\.json$/.test(d))) {
    const m = JSON.parse(readFileSync(`src/data/ezber/metin/${ad}`, 'utf8'));
    if (m.kuran) for (const b of m.bolumler) diyanet.set(`${m.kuran.sure}:${b.no}`, b.ar);
  }
  const ayetler = {}; const farklar = {};
  for (const k of katalogAyetleri(katalog).keys()) {
    const [s, a] = k.split(':').map(Number);
    let t = iskelet(sureler.get(s)[a - 1].text.replace(/^\uFEFF/, ''));
    // Tanzil, sûrelerin 1. âyetine besmeleyi ekler; Diyanet'te besmele yalnız Fâtiha'nın 1. âyetidir.
    if (a === 1 && s !== 1 && s !== 9 && t.startsWith(iskelet(BESMELE))) t = t.slice(iskelet(BESMELE).length);
    ayetler[k] = ozet(t);
    const d = diyanet.get(k);
    if (d !== undefined && iskelet(d) !== t) farklar[k] = { diyanet: iskelet(d), tanzil: t };
  }
  const fikstur = 'tests/fixtures/ezber-tanzil-iskelet.json';
  const onceki = existsSync(fikstur) ? JSON.parse(readFileSync(fikstur, 'utf8')).farklar : {};
  // Diyanet iskeleti değişmeyen farkın yazılmış gerekçesi korunur; yeni ya da değişen fark yeniden gözden geçirilir.
  const gerekce = (k, d) => (onceki[k]?.diyanet === d ? onceki[k].neden : 'GÖZDEN GEÇİR');
  writeFileSync(fikstur, JSON.stringify({
    kunye: 'Tanzil Quran Text (Uthmani), Tanzil Project, tanzil.net, CC BY 3.0 — yalnız gevşek iskeletlerin SHA-256 özetinin ilk 16 hanesi; metnin kendisi yok.',
    uretim: 'node scripts/ezber-iskelet.mjs --uret <quran-uthmani.json>',
    ayetler,
    // Bilinen imlâ farkları: her biri gözle doğrulanır; «diyanet» Diyanet iskeletinin özetidir, metin değişirse test düşer.
    farklar: Object.fromEntries(Object.keys(farklar).map((k) => {
      const d = ozet(iskelet(diyanet.get(k)));
      return [k, { diyanet: d, neden: gerekce(k, d) }];
    })),
  }, null, 1) + '\n');
  for (const [k, f] of Object.entries(farklar)) console.log(k, '\n  Diyanet:', f.diyanet, '\n  Tanzil: ', f.tanzil);
  console.log(`${Object.keys(ayetler).length} âyet, ${Object.keys(farklar).length} fark.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--uret');
  if (i < 0 || !process.argv[i + 1]) { console.error('Kullanım: node scripts/ezber-iskelet.mjs --uret <quran-uthmani.json>'); process.exit(2); }
  uret(process.argv[i + 1]);
}
