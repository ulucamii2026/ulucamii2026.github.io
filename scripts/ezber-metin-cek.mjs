/**
 * Ezber maddelerinin Kur'an metnini ve Diyanet meâllerini kuran.diyanet.gov.tr'den çeker (Faz 2b, 19 Ekim 2026).
 *
 * Site artık tek sayfalık uygulama: âyet ve meâl `/api/v2` uçlarından AES-256-CBC şifreli gelir; anahtar sitenin açık
 * JS paketindedir ve her çalıştırmada oradan okunur. Anahtar hiçbir dosyaya, günlüğe ya da çıktıya yazılmaz.
 * Diyanet tam dökümü kapatmıştır («içerik bütünlüğü ve kaynak güvenilirliği», acikkaynakkuran-dev.diyanet.gov.tr):
 * `/sync/*` uçları kullanılmaz; yalnız katalogdaki âyetler sırayla ve beklemeli çekilir (Rıdvan'ın 19 Ekim kararı:
 * kurum içi eğitim kullanımı, her içerikte künye).
 *
 *   node scripts/ezber-metin-cek.mjs             önbellekle çeker, src/data/ezber/metin/<id>.json yazar
 *   node scripts/ezber-metin-cek.mjs --denetle   önbelleksiz yeniden çeker; dosyalarla fark varsa çıkış 1
 *
 * Meâl gruplaması Diyanet'indir (`ayet_no`–`ayet_bitis`). Kaynakta eksik ya da tutarsız grup çıkarsa betik durur;
 * düzeltme yalnız `src/data/ezber/metin/duzeltmeler.json` ile, gerekçesi ve kaynağıyla yapılır.
 */
import { createDecipheriv, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KOK = 'https://kuran.diyanet.gov.tr';
const API = `${KOK}/api/v2`;
const UA = { 'User-Agent': 'Mozilla/5.0 (ulucamii.be ezber; info@ulucamii.be)' };
const ARAPCA_GRUBU = 4; // «Amasya Abay» yazı tipinin metin grubu: Diyanet mushafının Türk imlâsı
const MEALLER = { tr: 4, en: 5, de: 6 }; // /meal/kaynaklar: 4 Diyanet İşleri Başkanlığı, 5 İngilizce, 6 Almanca
const HEDEF = resolve('src/data/ezber/metin');
const ONBELLEK = resolve('node_modules/.cache/ezber-metin-cek');
const denetle = process.argv.includes('--denetle');
const bugun = new Date().toISOString().slice(0, 10);

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
// Kaynak kayıtlarının başında/sonunda görünmez dolgu karakteri çıkabiliyor: Zilzâl 99:7'nin Türkçe meâli U+FFA0 (Hangul dolgu
// karakteri) ile başlıyordu (24 Ekim 2026). `trim()` bunu boşluk saymaz; ekranda boş bir kare ya da boşluk görünür.
// Kod noktaları sayıyla yazılır (görünmez karakter kaynağa konmaz): Hangul dolguları, sıfır genişlikli karakterler, BOM.
const GORUNMEZ = String.fromCodePoint(0xFFA0, 0x3164, 0x115F, 0x1160, 0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0x2060, 0xFEFF);
function kenarTemizle(t) {
  const gor = (c) => /\s/.test(c) || GORUNMEZ.includes(c);
  let a = 0;
  let b = t.length;
  while (a < b && gor(t[a])) a++;
  while (b > a && gor(t[b - 1])) b--;
  return t.slice(a, b);
}

async function anahtarBul() {
  const html = await (await fetch(`${KOK}/`, { headers: UA })).text();
  const paket = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  if (!paket) throw new Error('Sitenin JS paketi bulunamadı; sayfa yapısı değişmiş olabilir.');
  const js = await (await fetch(KOK + paket, { headers: UA })).text();
  const adaylar = [...new Set(js.match(/["'][0-9a-f]{64}["']/g) ?? [])].map((s) => s.slice(1, -1));
  if (!adaylar.length) throw new Error('Pakette çözme anahtarı adayı yok; şifreleme değişmiş olabilir.');
  return adaylar;
}

function coz(govde, adaylar) {
  if (typeof govde?.iv !== 'string' || typeof govde?.data !== 'string') return govde;
  for (const a of adaylar) {
    try {
      const d = createDecipheriv('aes-256-cbc', Buffer.from(a, 'hex'), Buffer.from(govde.iv, govde.iv.length === 32 ? 'hex' : 'base64'));
      return JSON.parse(Buffer.concat([d.update(Buffer.from(govde.data, 'base64')), d.final()]).toString('utf8'));
    } catch { /* sıradaki aday */ }
  }
  throw new Error('Yanıt çözülemedi');
}

let adaylar;
let sonIstek = 0;
async function al(yol) {
  const dosya = resolve(ONBELLEK, `${yol.replace(/[^a-z0-9]+/gi, '_')}.json`);
  if (!denetle && existsSync(dosya)) return JSON.parse(readFileSync(dosya, 'utf8'));
  adaylar ??= await anahtarBul();
  // API geçidi dakikada ≈ 4 istek geçiriyor, fazlasına 504 veriyor (19 Ekim 2026 ölçümü): istekler 15 sn aralıklı,
  // hata olursa bir dakika beklenip yeniden denenir.
  for (let i = 0; ; i++) {
    await bekle(Math.max(0, sonIstek + 15000 - Date.now()));
    sonIstek = Date.now();
    try {
      const y = await fetch(API + yol, { headers: { ...UA, Accept: 'application/json' } });
      const metin = await y.text();
      if (!y.ok) throw new Error(`HTTP ${y.status}`);
      const veri = coz(JSON.parse(metin), adaylar).data;
      mkdirSync(ONBELLEK, { recursive: true });
      writeFileSync(dosya, JSON.stringify(veri));
      console.log('alındı', yol);
      return veri;
    } catch (e) {
      if (i === 5) throw new Error(`${yol}: ${e.message}`);
      await bekle(65000);
    }
  }
}

const katalog = JSON.parse(readFileSync('src/data/ezber/katalog.json', 'utf8'));
const duzeltmeYolu = resolve(HEDEF, 'duzeltmeler.json');
const duzeltmeler = existsSync(duzeltmeYolu) ? JSON.parse(readFileSync(duzeltmeYolu, 'utf8')).duzeltmeler : [];
const maddeler = katalog.ogeler.filter((o) => o.kuran);

// 1. Âyetler: mushaf sayfası başına (bir istek bir sayfanın bütün âyetlerini getirir; âyet başına istek 6 kat fazlaydı).
const sureler = new Map((await al('/sure')).map((s) => [s.id, s]));
const ayet = new Map();
const okunanSayfa = new Set();
async function sayfaOku(p) {
  if (okunanSayfa.has(p)) return;
  okunanSayfa.add(p);
  for (const v of await al(`/sayfa/${p}`)) {
    const ar = v.metinler.find((m) => m.metin_grubu_id === ARAPCA_GRUBU)?.metin;
    if (!ar || v.sayfa !== p) throw new Error(`sayfa ${p}: beklenmeyen âyet yanıtı (${v.sure_id}:${v.ayet_no})`);
    // birebir: Türk imlâsının U+06CC yâ'sı ve U+10EFE kasr işareti korunur
    ayet.set(`${v.sure_id}:${v.ayet_no}`, { ar, sayfa: p });
  }
}
for (const o of maddeler) {
  const { sure, ayetler: [a, b] } = o.kuran;
  const s = sureler.get(sure);
  if (!s || s.ayet_sayisi < b) throw new Error(`${o.id}: ${sure}. sûre ${s?.ayet_sayisi} âyet`);
  // Âyetin sayfası, sûrenin sayfa aralığında doğrusal tahminle bulunur, sonra birer sayfa ileri/geri düzeltilir.
  const ilk = s.ilk_sayfa, son = sureler.get(sure + 1)?.ilk_sayfa ?? 604;
  let p = Math.min(son, ilk + Math.floor(((a - 1) / s.ayet_sayisi) * (son - ilk + 1)));
  for (let adim = 0; !ayet.has(`${sure}:${a}`); adim++) {
    // Sayfalar 0 (Fâtiha) – 604 (İhlâs, Felak, Nâs).
    if (adim > 12 || p < 0 || p > 604) throw new Error(`${sure}:${a} sayfası bulunamadı`);
    await sayfaOku(p);
    if (ayet.has(`${sure}:${a}`)) break;
    const burada = [...ayet.entries()].filter(([, v]) => v.sayfa === p).map(([k]) => k.split(':').map(Number));
    const ilkBurada = burada.find(([x]) => x === sure)?.[1];
    // Sayfada bu sûreden âyet yoksa sûre sırasına, varsa âyet numarasına göre yön seçilir.
    p += ilkBurada === undefined ? (burada.every(([x]) => x > sure) ? -1 : 1) : (ilkBurada > a ? -1 : 1);
  }
  for (let n = a + 1; n <= b; n++) {
    while (!ayet.has(`${sure}:${n}`)) {
      const sonSayfa = ayet.get(`${sure}:${n - 1}`).sayfa;
      if (okunanSayfa.has(sonSayfa + 1)) throw new Error(`${sure}:${n} sayfalarda yok`);
      await sayfaOku(sonSayfa + 1);
    }
  }
}
// Daha önce âyet ucundan çekilmiş kayıtlar varsa sayfa ucuyla birebir aynı olmalı (iki uç tek kaynak).
for (const k of ayet.keys()) {
  const [s, a] = k.split(':');
  const dosya = resolve(ONBELLEK, `_ayet_${s}_${a}.json`);
  if (!existsSync(dosya)) continue;
  const v = JSON.parse(readFileSync(dosya, 'utf8'));
  if (v.metinler.find((m) => m.metin_grubu_id === ARAPCA_GRUBU)?.metin !== ayet.get(k).ar) throw new Error(`${k}: /ayet ile /sayfa farklı`);
}

// 2. Meâller: Diyanet'in gruplamasıyla, mushaf sayfası başına.
const sayfaMeal = new Map();
async function sayfaMeali(sayfa, kaynak) {
  const k = `${sayfa}/${kaynak}`;
  if (!sayfaMeal.has(k)) sayfaMeal.set(k, await al(`/meal/sayfa/${sayfa}/${kaynak}`));
  return sayfaMeal.get(k);
}

const hatalar = [];
const kullanilanDuzeltme = new Set();
async function gruplar(o, dil) {
  const { sure, ayetler: [a, b] } = o.kuran;
  const sayfalar = [...new Set(Array.from({ length: b - a + 1 }, (_, i) => ayet.get(`${sure}:${a + i}`).sayfa))];
  let kayitlar = [];
  for (const s of sayfalar) for (const m of await sayfaMeali(s, MEALLER[dil])) {
    if (m.sure_id !== sure || kayitlar.some((x) => x.ayetler[0] === m.ayet_no)) continue;
    kayitlar.push({ ayetler: [m.ayet_no, m.ayet_bitis ?? m.ayet_no], metin: kenarTemizle(m.metin) });
  }
  // Düzeltmeler tek tek Diyanet kaydına uygulanır: önce âyet bağları (yeniAyet, bitis), sonra eksik kayıt (ekle).
  // Uygulanamayan ya da artık gereksiz düzeltme (Diyanet verisini düzeltmiş) hata sayılır.
  const sirali = [...duzeltmeler.entries()].sort(([, x], [, y]) => ('ekle' in x) - ('ekle' in y));
  for (const [i, d] of sirali) {
    if (d.dil !== dil || d.sure !== sure || d.ayet < a || d.ayet > b) continue;
    const ad = `düzeltme ${dil} ${sure}:${d.ayet}`;
    const k = kayitlar.find((x) => x.ayetler[0] === d.ayet);
    const not = d.kaynak ? `${d.neden} Kaynak: ${d.kaynak}` : d.neden;
    if ('ekle' in d) {
      if (kayitlar.some((x) => x.ayetler[0] <= d.ayet && d.ayet <= x.ayetler[1])) { hatalar.push(`${ad}: kaynakta artık kayıt var, düzeltme gereksiz`); continue; }
      kayitlar.push({ ayetler: [d.ayet, d.ayet], metin: d.ekle, duzeltme: not });
    } else if (!k) {
      hatalar.push(`${ad}: kaynakta bu âyetle başlayan kayıt yok`); continue;
    } else {
      const [uc, yeni] = 'yeniAyet' in d ? [0, d.yeniAyet] : [1, d.bitis ?? d.ayet];
      if (k.ayetler[uc] === yeni) { hatalar.push(`${ad}: kaynak zaten ${k.ayetler.join('-')}, düzeltme gereksiz`); continue; }
      k.ayetler[uc] = yeni;
      k.duzeltme = not;
    }
    kullanilanDuzeltme.add(i);
  }
  kayitlar = kayitlar.filter((g) => g.ayetler[1] >= a && g.ayetler[0] <= b).sort((x, y) => x.ayetler[0] - y.ayetler[0]);
  // Gruplar maddenin aralığını boşluksuz ve örtüşmesiz kaplamalı; aralık dışına taşan grup da hatadır.
  let beklenen = a;
  for (const g of kayitlar) {
    if (g.ayetler[0] !== beklenen) hatalar.push(`${o.id} ${dil}: ${sure}:${beklenen} meâli yok ya da grup ${g.ayetler.join('-')} örtüşüyor`);
    beklenen = g.ayetler[1] + 1;
  }
  if (beklenen !== b + 1) hatalar.push(`${o.id} ${dil}: ${sure}:${beklenen}–${b} meâli yok`);
  if (kayitlar.some((g) => g.ayetler[0] < a || g.ayetler[1] > b)) hatalar.push(`${o.id} ${dil}: grup aralık dışına taşıyor`);
  return kayitlar;
}

const kaynakAdi = {
  ar: 'Diyanet İşleri Başkanlığı, Kur\'an-ı Kerim (kuran.diyanet.gov.tr, «Amasya Abay» metni)',
  tr: 'Diyanet İşleri Başkanlığı Meâli (kuran.diyanet.gov.tr)',
  en: 'The Holy Quran with English Translation (Diyanet İşleri Başkanlığı, kuran.diyanet.gov.tr)',
  de: 'Der Heilige Koran – Deutsche Übersetzung (Diyanet İşleri Başkanlığı, kuran.diyanet.gov.tr)',
};

const farklar = [];
const yazilacak = [];
for (const o of maddeler) {
  const { sure, ayetler: [a, b] } = o.kuran;
  const bolumler = Array.from({ length: b - a + 1 }, (_, i) => ({ no: a + i, ...ayet.get(`${sure}:${a + i}`) }));
  const meal = {};
  for (const dil of Object.keys(MEALLER)) meal[dil] = { kaynak: kaynakAdi[dil], gruplar: await gruplar(o, dil) };
  const yol = resolve(HEDEF, `${o.id}.json`);
  const eski = existsSync(yol) ? JSON.parse(readFileSync(yol, 'utf8')) : null;
  const icerik = { kuran: o.kuran, sureAdi: sureler.get(sure).ad_ar, bolumler, meal };
  const ozet = createHash('sha256').update(JSON.stringify(icerik)).digest('hex');
  if (denetle) {
    if (eski?.ozet !== ozet) farklar.push(o.id);
    continue;
  }
  // Başka kaynaktan eklenen meâller (fr Hamidullah ya da Chiadmi, nl çeviri) ve hoca alanları (zor kelimeler, onay, okunuş) yeniden
  // çekimde korunur; kaynak değişmediyse dosya aynı kalır.
  const kayit = {
    $schema: './metin.schema.json', id: o.id, ...icerik,
    meal: { ...meal, ...(eski?.meal.fr && { fr: eski.meal.fr }), ...(eski?.meal.nl && { nl: eski.meal.nl }) },
    kaynak: { ar: kaynakAdi.ar, url: KOK, alindi: eski?.ozet === ozet ? eski.kaynak.alindi : bugun },
    ozet,
    ...(eski?.okunus && { okunus: eski.okunus }), zor: eski?.zor ?? [], onay: eski?.onay ?? null,
  };
  yazilacak.push([yol, JSON.stringify(kayit, null, 1) + '\n']);
}

for (const [i, d] of duzeltmeler.entries()) if (!kullanilanDuzeltme.has(i)) hatalar.push(`Hiçbir maddeye uygulanmayan düzeltme: ${d.dil} ${d.sure}:${d.ayet}`);
// Hatalı kaynakla hiçbir dosya yazılmaz; çekilenler önbellekte kalır, düzeltmeden sonraki koşu ağa çıkmaz.
if (hatalar.length) { console.error(hatalar.join('\n')); process.exit(1); }
mkdirSync(HEDEF, { recursive: true });
for (const [yol, metin] of yazilacak) writeFileSync(yol, metin);
if (denetle) {
  console.log(farklar.length ? `Kaynakla farklı ${farklar.length} madde: ${farklar.join(', ')}` : 'Bütün maddeler kaynakla aynı.');
  if (farklar.length) process.exitCode = 1;
} else {
  const sayi = maddeler.reduce((t, o) => t + o.kuran.ayetler[1] - o.kuran.ayetler[0] + 1, 0);
  console.log(`${maddeler.length} madde, ${sayi} âyet yazıldı (${HEDEF}).`);
}
