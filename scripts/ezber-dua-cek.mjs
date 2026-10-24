/**
 * Ezber dualarının metnini Diyanet portalından çıkarır (Faz 2b, 24 Ekim 2026).
 *
 * Arapça metin: namaz.diyanet.gov.tr «Sureler ve Dualar» sayfasındaki kayıtlar (tek istek; ses dosyaları da aynı sitedendir).
 * Türkçe anlam ve okunuş: Diyanet yayınlarından, scripts/ezber-dua-tanim.mjs tablosundaki aynen alınmış metinlerdir.
 * Portal kayıtlarının bilinen yazım kusurları (eksik fetha, yanlış sükûn, fazladan harf) tabloda tek tek
 * gerekçesiyle düzeltilir; düzeltme kaynakta bulunmazsa (Diyanet kaydı değişmişse) betik durur.
 *
 *   node scripts/ezber-dua-cek.mjs             önbellekle çıkarır, src/data/ezber/metin/<id>.json yazar
 *   node scripts/ezber-dua-cek.mjs --denetle   portalı yeniden indirir; dosyalarla fark varsa çıkış 1
 *
 * Hoca alanı `onay` yeniden çekimde korunur. Çıktıyı değiştiren her şey tablodan geçer: dosyaları elle düzenlemeyin
 * (`ozet` bunu yakalar, tests/ezber-madde-metni.test.mjs).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DUALAR, PORTAL, duaOzeti } from './ezber-dua-tanim.mjs';

const HEDEF = resolve('src/data/ezber/metin');
const ONBELLEK = resolve('node_modules/.cache/ezber-dua-cek');
const denetle = process.argv.includes('--denetle');
const arg = (ad) => { const i = process.argv.indexOf(ad); return i < 0 ? undefined : process.argv[i + 1]; };
// --onayla <hepsi|id,id> [--kapsam ar,meal,okunus-tr] [--tarih YYYY-AA-GG]: hocanın onayını dosyaya işler (yalnız hoca onayladıktan sonra).
const onaylanacak = arg('--onayla');
const onayKapsami = (arg('--kapsam') ?? 'ar,meal,okunus-tr').split(',');
const onayTarihi = arg('--tarih') ?? new Date().toISOString().slice(0, 10);
if (onaylanacak !== undefined && (!/^d{4}-d{2}-d{2}$/.test(onayTarihi) || onayKapsami.some((k) => !['ar', 'meal', 'okunus-tr', 'okunus-fr'].includes(k)))) throw new Error('--onayla: tarih ya da kapsam geçersiz');
const bugun = new Date().toISOString().slice(0, 10);
const UA = { 'User-Agent': 'Mozilla/5.0 (ulucamii.be ezber; info@ulucamii.be)' };

// --- portal ---------------------------------------------------------------------------------------------------------
async function portalHtml() {
  const dosya = resolve(ONBELLEK, 'sureler-dualar.html');
  if (!denetle && existsSync(dosya)) return readFileSync(dosya, 'utf8');
  const y = await fetch(PORTAL, { headers: UA });
  if (!y.ok) throw new Error(`portal HTTP ${y.status}`);
  const t = await y.text();
  mkdirSync(ONBELLEK, { recursive: true });
  writeFileSync(dosya, t);
  return t;
}
const coz = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/<[^>]+>/g, '');

function portalKayitlari(html) {
  const kayitlar = new Map();
  for (const parca of html.split('<div class="dua-description"').slice(1)) {
    const no = Number(parca.match(/data-index="(\d+)"/)?.[1]);
    const govde = parca.slice(0, parca.indexOf('</div>'));
    const ar = govde.match(/<span class="arapcaMetin">([\s\S]*?)<\/span>/)?.[1];
    if (Number.isInteger(no) && ar) kayitlar.set(no, coz(ar));
  }
  return kayitlar;
}

// --- Arapça yardımcıları --------------------------------------------------------------------------------------------
const ESLE = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ۀ': 'ه' };
const ISARET = /[\p{Mn}\p{Cf}ـ]/u;
/** Harekesiz harf dizisi (boşluklar korunur) ve her harfin özgün metindeki konumu. */
function harf(s) {
  const k = []; const h = [];
  let i = 0;
  for (const c of s) {
    if (!ISARET.test(c)) { k.push(ESLE[c] ?? c); h.push(i); }
    i += c.length;
  }
  return { k: k.join(''), h };
}
// Kanonik eşdeğer biçim: işaret sırası (şedde/fetha) portalda ile tabloda farklı yazılmış olabilir; ikisi de NFC'ye çevrilir.
const NFC = (s) => s.normalize('NFC');
function duzen(s) {
  return NFC(s).replace(/[‎‏]/g, '').replace(/[،﴿﴾]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/(^| )(و[ً-ْ]?) (?=\S)/g, '$1$2'); // ayrı yazılmış «وَ » ekini sonraki kelimeye bağla
}
const bul1 = (metin, aranan, ad) => {
  const n = metin.split(aranan).length - 1;
  if (n !== 1) throw new Error(`${ad}: «${aranan}» kaynakta ${n} kez geçiyor (1 olmalı); Diyanet kaydı değişmiş olabilir`);
};

/** Metni harf iskeleti çapalarından keser (ilk parça baştan); çapalar sırayla aranır. */
function kes(metin, capalar, ad) {
  const { k, h } = harf(metin);
  const baslar = [0]; let onceki = 0;
  for (const c of capalar) {
    const p = k.indexOf(harf(c).k, onceki + 1);
    if (p < 0) throw new Error(`${ad}: «${c}» çapası bulunamadı`);
    baslar.push(h[p]); onceki = p;
  }
  return baslar.map((b, i) => metin.slice(b, baslar[i + 1]).trim());
}

// --- Türkçe metin yardımcıları ---------------------------------------------------------------------------------------
const tipo = (s) => s.replace(/\*\*/g, '').replace(/'/g, '’');
function turkceParca(tanim, adet, ad) {
  let p;
  if (Array.isArray(tanim)) p = tanim.map(tipo);
  else {
    const metin = tipo(tanim.metin); let onceki = 0; const baslar = [0];
    for (const c of tanim.kesim) {
      const i = metin.indexOf(tipo(c), onceki + 1);
      if (i < 0) throw new Error(`${ad}: «${c}» çapası bulunamadı`);
      baslar.push(i); onceki = i;
    }
    p = baslar.map((b, i) => metin.slice(b, baslar[i + 1]).trim());
    if (p.join(' ') !== metin) throw new Error(`${ad}: bölümler paragrafı birebir kapsamıyor`);
  }
  if (p.length !== adet) throw new Error(`${ad}: ${p.length} parça, ${adet} bölüm`);
  return p;
}

// --- üretim ---------------------------------------------------------------------------------------------------------
const kayitlar = portalKayitlari(await portalHtml());
const sonuc = new Map();

function bolumleriKur(id, d) {
  const ham = kayitlar.get(d.portal);
  if (ham === undefined) throw new Error(`${id}: portalda ${d.portal} numaralı dua kaydı yok`);
  let metin = duzen(ham);
  for (const c0 of d.cikar ?? []) { const c = NFC(c0); bul1(metin, c, `${id}/çıkar`); metin = metin.replace(c, '').replace(/\s+/g, ' ').trim(); }
  if (d.aralik) {
    const { k, h } = harf(metin);
    const [bas, son] = d.aralik;
    const b = bas ? h[k.indexOf(harf(bas).k)] : 0;
    const s = son ? h[k.indexOf(harf(son).k)] : metin.length;
    if (b === undefined || s === undefined) throw new Error(`${id}: aralık çapası bulunamadı`);
    metin = metin.slice(b, s).trim();
  }
  const duzeltmeler = [];
  for (const [i, x] of (d.duzelt ?? []).entries()) {
    const bul = NFC(x.bul), yerine = NFC(x.yerine);
    bul1(metin, bul, `${id}/düzeltme ${i + 1}`);
    metin = metin.replace(bul, yerine);
    duzeltmeler.push({ bul, yerine, neden: x.neden });
  }
  const ar = d.kesim ? kes(metin, d.kesim, id) : [metin];
  for (const e of d.ek ?? []) ar.push(NFC(e.ar));
  return { ar, duzeltmeler };
}

for (const [id, d] of Object.entries(DUALAR)) {
  if (d.turet) continue;
  const { ar, duzeltmeler } = bolumleriKur(id, d);
  const tr = turkceParca(d.anlam, ar.length, `${id}/anlam`);
  const okunus = d.okunus ? turkceParca(d.okunus, ar.length, `${id}/okunuş`) : undefined;
  sonuc.set(id, { ar, tr, okunus, duzeltmeler, d });
}
// Türetilenler (ezan = ikamet − «kad kâmeti’s-salâh» + sabah bölümü).
for (const [id, d] of Object.entries(DUALAR)) {
  if (!d.turet) continue;
  const k = sonuc.get(d.turet.kaynak);
  const ar = [], tr = [], okunus = [];
  k.ar.forEach((a, i) => {
    const no = i + 1;
    if (!d.turet.cikar.includes(no)) { ar.push(a); tr.push(k.tr[i]); okunus.push(k.okunus[i]); }
    if (no === d.turet.sabah.sonra) { ar.push(NFC(d.turet.sabah.ar)); tr.push(d.turet.sabah.anlam); okunus.push(d.turet.sabah.okunus); }
  });
  sonuc.set(id, { ar, tr: tr.map(tipo), okunus: okunus.map(tipo), duzeltmeler: [], d });
}

// --- yazım / denetim --------------------------------------------------------------------------------------------------
const hatalar = [];
for (const [id, { ar, tr, okunus, duzeltmeler, d }] of sonuc) {
  const yol = resolve(HEDEF, `${id}.json`);
  const onceki = existsSync(yol) ? JSON.parse(readFileSync(yol, 'utf8')) : undefined;
  const m = {
    $schema: './metin.schema.json',
    id,
    bolumler: ar.map((a, i) => ({ no: i + 1, ar: a })),
    meal: { tr: { kaynak: d.anlamKaynak, gruplar: tr.map((metin, i) => ({ ayetler: [i + 1, i + 1], metin })) } },
    kaynak: { ar: d.kaynakAr, url: PORTAL, alindi: bugun },
    ...(duzeltmeler.length && { duzeltmeler }),
    ozet: '',
    ...(okunus && { okunus: { tr: okunus.map((metin, i) => ({ no: i + 1, metin })) } }),
    zor: d.zor ?? [],
    onay: onaylanacak !== undefined && (onaylanacak === 'hepsi' || onaylanacak.split(',').includes(id)) ? { tarih: onayTarihi, kapsam: onayKapsami } : onceki?.onay ?? null,
  };
  m.ozet = duaOzeti(m);
  // Aynı içerik yeniden çekilirse alım tarihi korunur (dosya gereksiz değişmesin).
  if (onceki && onceki.ozet === m.ozet && JSON.stringify({ ...onceki, kaynak: { ...onceki.kaynak, alindi: 0 } }) === JSON.stringify({ ...m, kaynak: { ...m.kaynak, alindi: 0 } })) m.kaynak.alindi = onceki.kaynak.alindi;
  const yaz = JSON.stringify(m, null, 1) + '\n';
  if (denetle) {
    if (!onceki || JSON.stringify({ ...onceki, kaynak: { ...onceki.kaynak, alindi: 0 } }) !== JSON.stringify({ ...m, kaynak: { ...m.kaynak, alindi: 0 } })) hatalar.push(`${id}: dosya portalla/tabloyla uyuşmuyor`);
  } else if (!existsSync(yol) || readFileSync(yol, 'utf8') !== yaz) {
    mkdirSync(HEDEF, { recursive: true });
    writeFileSync(yol, yaz);
    console.log('yazıldı', id, `(${ar.length} bölüm)`);
  }
}
if (denetle) {
  if (hatalar.length) { console.error(hatalar.join('\n')); process.exit(1); }
  console.log(`${sonuc.size} dua portal ve tabloyla uyumlu.`);
}
