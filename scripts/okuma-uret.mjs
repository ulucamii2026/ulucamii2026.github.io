/**
 * Kur'an Okuma (İlim Yolu · 10 Kasım 2026) veri üretici.
 *
 *   node scripts/okuma-uret.mjs [--kaynak D:/tmp/ilim-yolu-okuma-ses]   üretir (ek.json, sureler.json, ses kopyası, künye)
 *   node scripts/okuma-uret.mjs --denetle                               yalnız depodaki çıktıları sınar (kaynak klasörü gerekmez)
 *
 * Girdi 1: Diyanet Elifbâ portalından indirilmiş, sha256'sı kayıtlı sesler (KAYNAK.json). Yalnız ilk basamakların ihtiyacı olan
 * dosyalar `public/media/ses/okuma/` altına kopyalanır: harflerin şekilleri (kelimenin başı/ortası/sonu) ve üstün/esre/ötre kelime
 * alıştırmaları. Arapça metin portalın ders verisinden (SPA paketi) olduğu gibi alınır; `{..}` vurgu işareti `v` aralıklarına çevrilir.
 * Girdi 2: Ezber Kilimi'nin sûre metni ve âyet sesleri (src/data/ezber/metin, katalog.json): yeni ses ya da şifreli API kullanılmaz.
 * Yapay ses yoktur. Çıktı: src/data/okuma/ek.json, src/data/okuma/sureler.json, docs/okuma-ses-kaynaklari.json.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = new URL('../', import.meta.url);
const yol = (p) => new URL(p, kok);
const json = (p) => JSON.parse(readFileSync(fileURLToPath(yol(p)), 'utf8'));
const yer = (p) => fileURLToPath(yol(p));
const yaz = (p, v) => { mkdirSync(dirname(yer(p)), { recursive: true }); writeFileSync(yer(p), JSON.stringify(v, null, 1) + '\n'); };
const ozet = (dosya) => createHash('sha256').update(readFileSync(dosya)).digest('hex');

/** `{..}` vurgu işaretli portal metni → işaretsiz metin ve [başlangıç, bitiş) aralıkları. */
export function vurguAyir(ham) {
  let metin = '';
  const v = [];
  let bas = -1;
  for (const c of ham) {
    if (c === '{') bas = metin.length;
    else if (c === '}') { if (bas >= 0) v.push([bas, metin.length]); bas = -1; }
    else metin += c;
  }
  return { metin, v };
}
/** Harfin kelimedeki yeri: tek başına | başta | ortada | sonda. */
export function konumSec(metin, v) {
  if (v.length === 1 && v[0][0] === 0 && v[0][1] === metin.length) return 'harf';
  if (v[0][0] === 0) return 'basta';
  if (v[v.length - 1][1] === metin.length) return 'sonda';
  return 'ortada';
}

const SES_KOK = '/media/ses/okuma/';
const KELIME_DERSLERI = [['fetha/uygulama', 'ustun'], ['kesra/uygulama', 'esre'], ['damme/uygulama', 'otre']];
const SURE_ARALIGI = [114, 93]; // Nâs … Duhâ, aşağıdan yukarı; Fâtiha ayrıca başa eklenir

function sureleriKur() {
  const katalog = json('src/data/ezber/katalog.json').ogeler.filter((o) => o.tur === 'sure' && o.kuran);
  const sirali = [];
  for (let n = 1; n <= 114; n++) if (n === 1 || (n <= SURE_ARALIGI[0] && n >= SURE_ARALIGI[1])) sirali.push(n);
  sirali.sort((a, b) => (a === 1 ? -1 : b === 1 ? 1 : b - a));
  const cikti = [];
  for (const no of sirali) {
    const o = katalog.find((k) => k.kuran.sure === no && k.kuran.ayetler[0] === 1 && /^s-[a-z]+$/.test(k.id));
    if (!o) throw new Error(`sûre ${no} katalogda yok`);
    const metin = json(`src/data/ezber/metin/${o.id}.json`);
    const n = o.kuran.ayetler[1];
    if (metin.bolumler.length !== n || o.ses?.parcalar?.length !== n) throw new Error(`${o.id}: âyet/ses sayısı uyuşmuyor`);
    cikti.push({ id: o.id, no, ayetler: metin.bolumler.map((b, i) => ({ n: b.no, ar: b.ar, ses: o.ses.parcalar[i], sayfa: b.sayfa })) });
  }
  return cikti;
}

function uret(kaynakKlasoru) {
  const k = JSON.parse(readFileSync(`${kaynakKlasoru}/KAYNAK.json`, 'utf8'));
  const kunye = {};
  const al = (o) => {
    const hedef = SES_KOK + o.yol.replace(/^elifba\//, '');
    const dosya = `${kaynakKlasoru}/${o.yol}`;
    if (ozet(dosya) !== o.sha256) throw new Error(`sha256 uyuşmuyor: ${o.yol}`);
    const gercek = yer(`public${hedef}`);
    mkdirSync(dirname(gercek), { recursive: true });
    copyFileSync(dosya, gercek);
    kunye[hedef] = { kaynak: o.kaynakUrl, sha256: o.sha256 };
    return hedef;
  };
  const sira = (a, b) => a.sira - b.sira;
  const bitisme = k.ogeler.filter((o) => o.ders === 'harfler/sekilleri' && o.rol === 'oge').sort(sira).map((o) => {
    const { metin, v } = vurguAyir(o.ar);
    return { id: Number(o.yol.match(/(\d+)\.mp3$/)[1]), ar: metin, v, konum: konumSec(metin, v), ses: al(o) };
  });
  const kelimeler = [];
  for (const [ders, hareke] of KELIME_DERSLERI) {
    for (const o of k.ogeler.filter((x) => x.ders === ders && x.rol === 'oge').sort(sira)) {
      const { metin } = vurguAyir(o.ar);
      kelimeler.push({ id: `${hareke}-${o.yol.match(/(\d+)\.mp3$/)[1]}`, ar: metin, hareke, ses: al(o) });
    }
  }
  yaz('src/data/okuma/ek.json', { surum: 1, kaynak: 'Diyanet Elifbâ portalı (kuran.diyanet.gov.tr/elifba); metin ve sesler olduğu gibi, sha256 docs/okuma-ses-kaynaklari.json', bitisme, kelimeler });
  yaz('docs/okuma-ses-kaynaklari.json', kunye);
  console.log(`ek.json: ${bitisme.length} bitişme, ${kelimeler.length} kelime; ${Object.keys(kunye).length} ses kopyalandı`);
}

function denetle() {
  const ek = json('src/data/okuma/ek.json');
  const kunye = json('docs/okuma-ses-kaynaklari.json');
  let hata = 0;
  for (const o of [...ek.bitisme, ...ek.kelimeler]) {
    const dosya = yer(`public${o.ses}`);
    if (!existsSync(dosya) || !kunye[o.ses] || ozet(dosya) !== kunye[o.ses].sha256) { console.error('BOZUK', o.ses); hata++; }
  }
  const sureler = json('src/data/okuma/sureler.json');
  console.log(`bitişme ${ek.bitisme.length}, kelime ${ek.kelimeler.length}, sûre ${sureler.length}, hata ${hata}`);
  if (hata) process.exit(1);
}

if (import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  const a = process.argv.slice(2);
  if (a.includes('--denetle')) denetle();
  else {
    const i = a.indexOf('--kaynak');
    uret(i >= 0 ? a[i + 1] : 'D:/tmp/ilim-yolu-okuma-ses');
    yaz('src/data/okuma/sureler.json', sureleriKur());
    console.log('sureler.json yazıldı');
  }
}
