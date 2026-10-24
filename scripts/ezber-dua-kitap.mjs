/**
 * Dua metinleri — ikinci kaynak yolu: yerel Diyanet (DİB/DİTİB/TDV) basılı kitapları (Faz 2b, 24 Ekim 2026).
 *
 * namaz.diyanet.gov.tr portalı yalnız abdest duaları, kamet, kıyam, sübhâneke, rükû, secde, kunut, ettehiyyâtü, salli/bârik,
 * rabbenâ ve ezan duasını taşır (scripts/ezber-dua-cek.mjs). Tekbir, kelime-i tevhid, şehâdet, tesmî–tahmîd, selâm, âmentü,
 * teşrik tekbiri, telbiye, yemek duası ve Eûzü-Besmele portalda yoktur; bunların metni Diyanet'in basılı kitaplarından,
 * yerelde Markdown olarak duran kopyalardan alınır:
 *   kurs     D:\ulu-camii-kuran-kursu\veri\kitaplar   Elif-Bâ (DİB 2020), Temel Dinî Bilgiler (DİB), Camiye Gidiyorum 1-2 (DİTİB)
 *   ihtisas  D:\ihtisas\kaynaklar                     İslam İlmihali, Diyanet İlmihali, Hac İlmihali, Dînî Kavramlar Sözlüğü,
 *                                                     Tecrid-i Sarih, Riyâzü's-Sâlihîn, Hadislerle İslam (DİB)
 *   dia      D:\ihtisas\dia\maddeler                  TDV İslâm Ansiklopedisi
 * Bu klasörler telifli yayınların yerel çalışma kopyasıdır: depoya girmez, yalnız bu betik okur.
 *
 * KURAL: bir Arapça metin ancak İKİ BAĞIMSIZ Diyanet kaynağında harf iskeleti (ezber-iskelet.mjs: hareke ve işaretler, elif ve
 * hemze atılmış) aynıysa maddeye girer. Birincil kaynaktan harekeli metin alınır, her `ikinci` kaynağın iskeleti onunkiyle
 * karşılaştırılır; fark ya giderilir ya da `fark` alanına gerekçesiyle yazılır. İkinci kaynağı bulunmayan ya da iskeleti
 * ayrışan madde YAZILMAZ. Türkçe/Fransızca anlam ve okunuş da kitaptan SÖZCÜĞÜ SÖZCÜĞÜNE alınır: tabloya yazılan her dizenin
 * kaynak sayfada aynen geçtiği her çalıştırmada doğrulanır (ezberden yazılamaz, yazım değiştirilemez).
 *
 * Fixtür (tests/fixtures/ezber-dua-ikinci-kaynak.json) kitap metnini değil, yalnız iskelet özetlerinin ilk 16 hanesini taşır
 * (scripts/ezber-dua-iskelet.mjs --uret).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { iskelet, ozet } from './ezber-iskelet.mjs';

export const KOKLER = {
  kurs: 'D:/ulu-camii-kuran-kursu/veri/kitaplar',
  ihtisas: 'D:/ihtisas/kaynaklar',
  dia: 'D:/ihtisas/dia/maddeler',
};
const MUSHAF_ONBELLEK = resolve('node_modules/.cache/ezber-metin-cek');

// --- kaynak dosyaları ------------------------------------------------------------------------------------------------
const okunanlar = new Map();
export function kaynakMetni({ kok, dosya }) {
  if (!KOKLER[kok]) throw new Error(`bilinmeyen kaynak kökü: ${kok}`);
  const yol = `${KOKLER[kok]}/${dosya}`;
  if (!okunanlar.has(yol)) {
    if (!existsSync(yol)) throw new Error(`kaynak dosya yok: ${yol} (bu betik yerel Diyanet kitap arşivini ister)`);
    okunanlar.set(yol, readFileSync(yol, 'utf8').replace(/\r\n/g, '\n'));
  }
  return okunanlar.get(yol);
}

// Sayfa işaretleri sayfanın BAŞINDA durur: `<!-- s. 38 -->` (Elif-Bâ, TDB, CG), `[s. 51]` (Hac İlmihali, DKS, Diyanet İlmihali).
const SAYFA_IMI = '<!-- s\\. (\\d+) -->|\\[s\\. (\\d+)\\]';
/** `t` içinde `indeks`ten önceki son sayfa işaretinin numarası (yoksa null). */
function sayfaNo(t, indeks) {
  let son = null;
  for (const m of t.matchAll(new RegExp(SAYFA_IMI, 'g'))) { if (m.index > indeks) break; son = Number(m[1] ?? m[2]); }
  return son;
}
const sayfaYaz = (a, b) => (a == null ? '' : b == null || a === b ? String(a) : `${a}–${b}`);

/** `kesit`: [başlangıç düz metni | [metin, n], bitiş düz metni?]. Dosyanın o parçasını ve parçanın dosyadaki konumunu verir. */
function kesitAl(t, kesit) {
  if (!kesit) return { t, ofset: 0 };
  const [bas, son] = kesit;
  const [metin, n] = Array.isArray(bas) ? bas : [bas, 1];
  let i = -1;
  for (let k = 0; k < n; k++) { i = t.indexOf(metin, i + 1); if (i < 0) throw new Error(`kesit başlangıcı bulunamadı (${n}. kez): «${metin}»`); }
  if (!Array.isArray(bas) && t.indexOf(metin, i + 1) >= 0) throw new Error(`kesit başlangıcı birden çok kez geçiyor, [metin, n] biçimini kullanın: «${metin}»`);
  let j = t.length;
  if (son) { j = t.indexOf(son, i + metin.length); if (j < 0) throw new Error(`kesit sonu bulunamadı: «${son}»`); }
  return { t: t.slice(i, j), ofset: i };
}

// --- Arapça ----------------------------------------------------------------------------------------------------------
// ezber-iskelet.mjs `iskelet()` ile aynı eşleme; fark: boşluklar korunur (kelime sınırı için) ve her harfin konumu tutulur.
const ESLE = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ؤ': 'و', 'ئ': 'ي', 'ى': 'ي', 'ی': 'ي', 'ة': 'ه', 'ۀ': 'ه', 'ک': 'ك' };
const HARF = /[\u0621-\u064A\u0671\u06C0\u06CC\u06A9]/;
const AYRAC = /[\s،؛.:;,()\-–—*"“”«»\u06DD\u06DE|[\]]/;
/** Elif ve hemze atılmış harf dizisi (kelime araları tek boşluk) ve her harfin özgün metindeki konumu. */
function kBos(t) {
  const k = []; const h = [];
  for (let i = 0; i < t.length; i++) {
    const c = ESLE[t[i]] ?? t[i];
    if (HARF.test(t[i])) { if (c !== 'ا' && c !== 'ء') { k.push(c); h.push(i); } }
    else if (k.length && k[k.length - 1] !== ' ' && AYRAC.test(t[i])) { k.push(' '); h.push(i); }
  }
  return { k: k.join(''), h };
}
const kelimeSiniri = (k, bas, uzunluk) => (bas === 0 || k[bas - 1] === ' ') && (bas + uzunluk === k.length || k[bas + uzunluk] === ' ');
/** `k` iskeletinde `aranan`ın (tam kelime sınırlarında) `n`. geçişi `from`dan sonra; yoksa -1. */
function iskeletBul(k, aranan, n, from = 0) {
  let p = from - 1;
  for (let sayac = 0; sayac < n; sayac++) {
    do { p = k.indexOf(aranan, p + 1); } while (p >= 0 && !kelimeSiniri(k, p, aranan.length));
    if (p < 0) return -1;
  }
  return p;
}
const ISARET = /\p{Mn}/u;
/** İskelette atılan elif/hemze ve işaretler de kelimeye dâhildir: ilk tutulan harften kelimenin gerçek başına geri gider. */
function kelimeBasi(t, i) {
  while (i > 0 && (HARF.test(t[i - 1]) || ISARET.test(t[i - 1]))) i--;
  return i;
}

/**
 * Kaynaktan harekeli Arapça aralık: `parcalar` = [{ bas, son?, nth? }] (harekesiz iskelet çapaları, tam kelime; `son` yoksa `bas`).
 * Aralık, son harfin harekelerini de içerir. Sonuç: { metin (parçalar boşlukla birleşik), sayfa }.
 */
export function arapcaAralik(kaynak, parcalar) {
  const tam = kaynakMetni(kaynak);
  const { t, ofset } = kesitAl(tam, kaynak.kesit);
  const { k, h } = kBos(t);
  const metinler = []; let ilk; let sonKonum;
  for (const p of parcalar) {
    const b = kBos(p.bas).k.trim();
    const e = kBos(p.son ?? p.bas).k.trim();
    const bi = iskeletBul(k, b, p.nth ?? 1);
    if (bi < 0) throw new Error(`${kaynak.dosya}: başlangıç çapası bulunamadı (${p.nth ?? 1}. kez): ${p.bas}`);
    const ei = iskeletBul(k, e, 1, bi);
    if (ei < 0) throw new Error(`${kaynak.dosya}: bitiş çapası bulunamadı: ${p.son ?? p.bas}`);
    // Kelimenin sonundaki elif/hemze iskelette atılır ama kelimeye dâhildir («دَرْسًا»nın sonu): bitişik harf ve işaretler de alınır.
    let bitis = h[ei + e.length - 1] + 1;
    while (bitis < t.length && (HARF.test(t[bitis]) || ISARET.test(t[bitis]))) bitis++;
    const bas = kelimeBasi(t, h[bi]);
    metinler.push(t.slice(bas, bitis));
    ilk ??= ofset + bas;
    sonKonum = ofset + bitis;
  }
  return { metin: metinler.join(' '), sayfa: sayfaYaz(sayfaNo(tam, ilk), sayfaNo(tam, sonKonum)) };
}

const NFC = (s) => s.normalize('NFC');
const ARAPCA_DISI = /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u{10EC0}-\u{10EFF} ]/gu;
/** Kitap yazımından ezber metnine: yalnız Arapça harf, hareke ve boşluk kalır; kitap süsleri (۞, ayraç) atılır. */
export function arapcaDuzenle(s) {
  const t = NFC(s).replace(/[،؛؟۔﴾﴿۞۝]/g, ' ').replace(/[‎‏]/g, '');
  if (/[A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(t)) throw new Error(`Arapça aralıkta Latin harf ya da rakam kaldı (çapalar yanlış kesiyor): ${t.slice(0, 80)}`);
  return t.replace(ARAPCA_DISI, ' ').replace(/\s+/g, ' ').trim()
    .replace(/(^| )(و[ً-ْ]?) (?=\S)/g, '$1$2'); // ayrı yazılmış «وَ » ekini sonraki kelimeye bağla
}

/** Metni harf iskeleti çapalarından keser (ilk parça baştan); çapalar sırayla aranır. */
export function arapcaKes(metin, capalar, ad) {
  const { k, h } = kBos(metin);
  const baslar = [0]; let onceki = 0;
  for (const c of capalar) {
    const p = iskeletBul(k, kBos(c).k.trim(), 1, onceki + 1);
    if (p < 0) throw new Error(`${ad}: «${c}» çapası bulunamadı`);
    baslar.push(kelimeBasi(metin, h[p])); onceki = p;
  }
  return baslar.map((b, i) => metin.slice(b, baslar[i + 1]).trim());
}

// --- Türkçe / Fransızca anlam ve okunuş: sözcüğü sözcüğüne doğrulama -------------------------------------------------
/** Karşılaştırma biçimi: tırnak türleri, Markdown imleri, yorumlar ve boşluk farkları yok sayılır; sözcükler aynen aranır. */
const norm = (s) => s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\[\^\d+\]/g, '').replace(/[  ]/g, ' ')
  .replace(/[’‘'ʼ`´]/g, '’').replace(/\*/g, '').replace(/^\s*>\s?/gm, '').replace(/\s+/g, ' ').trim();

/** Kaynağın (kesit içinde) karşılaştırma metni ve [konum, sayfa] dizisi. */
function samanlik(kaynak) {
  const tam = kaynakMetni(kaynak);
  const { t, ofset } = kesitAl(tam, kaynak.kesit);
  let sayfa = sayfaNo(tam, ofset);
  let metin = ''; const sayfalar = []; let son = 0;
  const ekle = (parca) => {
    const n = norm(parca);
    if (!n) return;
    if (metin) metin += ' ';
    sayfalar.push([metin.length, sayfa]);
    metin += n;
  };
  for (const m of t.matchAll(new RegExp(SAYFA_IMI, 'g'))) {
    ekle(t.slice(son, m.index));
    sayfa = Number(m[1] ?? m[2]); son = m.index + m[0].length;
  }
  ekle(t.slice(son));
  return { metin, sayfalar };
}
function sayfaAt(sayfalar, konum) {
  let s = sayfalar[0]?.[1] ?? null;
  for (const [pos, no] of sayfalar) { if (pos > konum) break; s = no; }
  return s;
}

/** `aranan` kaynakta (karşılaştırma biçiminde) geçmeli; geçmezse hata. Sayfa aralığı döner ('' = sayfa işareti yok). */
export function metniDogrula(aranan, kaynak, ad) {
  const { metin, sayfalar } = samanlik(kaynak);
  const n = norm(aranan);
  const i = metin.indexOf(n);
  if (i < 0) throw new Error(`${ad}: «${aranan}» ${kaynak.dosya} içinde sözcüğü sözcüğüne bulunamadı (ezberden yazılan ya da değişmiş metin)`);
  return sayfaYaz(sayfaAt(sayfalar, i), sayfaAt(sayfalar, i + n.length - 1));
}

const tipoTr = (s) => s.replace(/\*+/g, '').replace(/['‘]/g, '’');
const tipoFr = (s) => s.replace(/\*+/g, '').replace(/’/g, "'");

/** Tam paragrafı çapa başlarından parçalar; parçalar paragrafı birebir kapsar. */
function paragrafKes(metin, capalar, ad, tipo) {
  const t = tipo(metin); let onceki = 0; const baslar = [0];
  for (const c of capalar) {
    const i = t.indexOf(tipo(c), onceki + 1);
    if (i < 0) throw new Error(`${ad}: «${c}» çapası bulunamadı`);
    baslar.push(i); onceki = i;
  }
  const p = baslar.map((b, i) => t.slice(b, baslar[i + 1]).trim());
  if (p.join(' ') !== t) throw new Error(`${ad}: parçalar paragrafı birebir kapsamıyor`);
  return p;
}

/**
 * Anlam/okunuş tanımını doğrular ve parçalar. `spec`:
 *   kaynak   { kok, dosya, kesit?, kunye }  — kunye'de `{s}` sayfa numarasıdır
 *   metin + kesim   tam paragraf ve parça başları; ya da
 *   dizi     [ 'parça' | { metin, kaynak } ]  — parça başına kaynak verilebilir
 *   gruplar  [[ilk, son], …]  — her parçanın kapsadığı bölüm aralığı (yoksa bölüm başına bir parça)
 * Dönüş: { parcalar, gruplar, kunye }.
 */
export function anlamCoz(spec, adet, ad, dil = 'tr') {
  const tipo = dil === 'fr' ? tipoFr : tipoTr;
  const sayfalar = new Map(); // künye şablonu → sayfa numaraları
  const kaydet = (kaynak, sayfa) => {
    if (!sayfalar.has(kaynak.kunye)) sayfalar.set(kaynak.kunye, []);
    for (const n of sayfa.split('–').filter(Boolean).map(Number)) sayfalar.get(kaynak.kunye).push(n);
  };
  let parcalar;
  if (spec.dizi) {
    parcalar = spec.dizi.map((p, i) => {
      const o = typeof p === 'string' ? { metin: p } : p;
      const kaynak = o.kaynak ?? spec.kaynak;
      kaydet(kaynak, metniDogrula(o.metin, kaynak, `${ad}/${i + 1}`));
      return tipo(o.metin);
    });
  } else {
    kaydet(spec.kaynak, metniDogrula(spec.metin, spec.kaynak, ad));
    parcalar = paragrafKes(spec.metin, spec.kesim, ad, tipo);
  }
  const gruplar = spec.gruplar ?? Array.from({ length: adet }, (_, i) => [i + 1, i + 1]);
  if (parcalar.length !== gruplar.length) throw new Error(`${ad}: ${parcalar.length} parça, ${gruplar.length} grup`);
  let beklenen = 1;
  for (const [a, b] of gruplar) { if (a !== beklenen || b < a) throw new Error(`${ad}: gruplar bölümleri boşluksuz kaplamıyor`); beklenen = b + 1; }
  if (beklenen !== adet + 1) throw new Error(`${ad}: gruplar ${beklenen - 1} bölümü kaplıyor, ${adet} bölüm var`);
  const kunye = [...sayfalar.entries()].map(([sablon, nolar]) => {
    if (!sablon.includes('{s}')) return sablon;
    if (!nolar.length) throw new Error(`${ad}: «${sablon}» sayfa ister ama kaynakta sayfa işareti yok`);
    return sablon.replace('{s}', sayfaYaz(Math.min(...nolar), Math.max(...nolar)));
  }).join('; ');
  return { parcalar, gruplar, kunye };
}

// --- Diyanet mushafı (Kur'an'dan alınan sözcükler: Eûzü, Besmele) ------------------------------------------------------
/**
 * node scripts/ezber-metin-cek.mjs önbelleğindeki âyet kaydından (Diyanet mushafı, «Amasya Abay» metin grubu 4) sözcük aralığı.
 * `kelimeler`: [ilk, son] (1 tabanlı, son dâhil). Önbellek yoksa: node scripts/ezber-metin-cek.mjs --yalniz-ayet <sûre:âyet,…>
 */
function mushafSozleri(sure, ayet, [ilk, son]) {
  const yol = resolve(MUSHAF_ONBELLEK, `_ayet_${sure}_${ayet}.json`);
  if (!existsSync(yol)) throw new Error(`${sure}:${ayet} mushaf önbelleğinde yok: node scripts/ezber-metin-cek.mjs --yalniz-ayet ${sure}:${ayet}`);
  const metin = JSON.parse(readFileSync(yol, 'utf8')).metinler.find((m) => m.metin_grubu_id === 4)?.metin;
  if (!metin) throw new Error(`${sure}:${ayet}: Diyanet mushaf metni yok`);
  const sozler = NFC(metin).split(/\s+/).filter(Boolean);
  if (son > sozler.length) throw new Error(`${sure}:${ayet}: ${son}. kelime yok (${sozler.length} kelime)`);
  return sozler.slice(ilk - 1, son).join(' ');
}

// --- bir dua için bütün işlem ------------------------------------------------------------------------------------------
/**
 * `d.kitap` tanımından duanın bölümlerini, anlamlarını ve okunuşunu kurar; ikinci kaynak karşılaştırmasını da yapar.
 * Dönüş: { ar, kaynakAr, duzeltmeler, tr, fr?, okunus?, ikinci (fixtür kayıtları) }
 */
export function kitapDuasi(id, d) {
  const k = d.kitap;
  // 1. Birincil Arapça
  let metin; let sayfa = '';
  if (k.ana.mushaf) {
    metin = k.ana.mushaf.map(({ sure, ayet, kelimeler }) => mushafSozleri(sure, ayet, kelimeler)).join(' ').replace(/\s+/g, ' ').trim();
  } else {
    const r = arapcaAralik(k.ana, k.ana.parcalar);
    metin = arapcaDuzenle(r.metin); sayfa = r.sayfa;
  }
  if (k.ana.kunye.includes('{s}') && !sayfa) throw new Error(`${id}: ana kaynak sayfa ister ama kaynakta sayfa işareti yok`);
  const duzeltmeler = [];
  for (const [i, x] of (k.duzelt ?? []).entries()) {
    const bul = NFC(x.bul); const yerine = NFC(x.yerine);
    const n = metin.split(bul).length - 1;
    if (n !== 1) throw new Error(`${id}/düzeltme ${i + 1}: «${bul}» kaynakta ${n} kez geçiyor (1 olmalı)`);
    metin = metin.replace(bul, yerine);
    duzeltmeler.push({ bul, yerine, neden: x.neden });
  }
  const ar = k.kesim ? arapcaKes(metin, k.kesim, id) : [metin];

  // 2. İkinci kaynaklar: iskelet karşılaştırması
  const ikinci = []; const ikinciKunye = [];
  for (const [i, s] of (k.ikinci ?? []).entries()) {
    const nolar = s.bolumler ?? ar.map((_, j) => j + 1);
    const r = arapcaAralik(s, s.parcalar);
    const onlarin = iskelet(r.metin); const bizim = iskelet(nolar.map((n) => ar[n - 1]).join(''));
    const ayri = onlarin !== bizim;
    if (ayri && !s.fark) throw new Error(`${id}: ikinci kaynak ${i + 1} (${s.dosya}) bölüm ${nolar} ile harf iskeletinde ayrışıyor\n  ikinci: ${onlarin}\n  bizim:  ${bizim}`);
    if (!ayri && s.fark) throw new Error(`${id}: ikinci kaynak ${i + 1}: fark kaydı artık gereksiz`);
    if (s.kunye.includes('{s}') && !r.sayfa) throw new Error(`${id}: ikinci kaynak ${i + 1} sayfa ister ama kaynakta sayfa işareti yok`);
    const kunye = s.kunye.replace('{s}', r.sayfa);
    if (!ayri) ikinciKunye.push(kunye);
    ikinci.push({
      id, bolumler: nolar, kaynak: kunye, ...(s.not && { not: s.not }), iskelet: ozet(onlarin),
      ...(ayri && { bizim: ozet(bizim), fark: s.fark }),
    });
  }
  // Her bölüm, iskeleti birebir aynı çıkan en az bir ikinci kaynakta karşılaştırılmış olmalı (kural: iki bağımsız Diyanet kaynağı).
  for (let n = 1; n <= ar.length; n++) {
    if (!ikinci.some((r) => r.bolumler.includes(n) && !r.fark)) throw new Error(`${id}: ${n}. bölümü iskeletçe doğrulayan ikinci Diyanet kaynağı yok; kural gereği madde yazılmaz`);
  }
  // «↔»: harf iskeleti ana kaynakla karşılaştırılan ikinci Diyanet kaynakları (dile bağlı söz içermez: künye her dilde aynı görünür).
  const kaynakAr = [k.ana.kunye.replace('{s}', sayfa), ...new Set(ikinciKunye)].join(' ↔ ');

  // 3. Anlam, Fransızca anlam ve okunuş: sözcüğü sözcüğüne doğrulanır
  const tr = anlamCoz(k.anlam, ar.length, `${id}/anlam`, 'tr');
  const fr = k.fr ? anlamCoz(k.fr, ar.length, `${id}/fr`, 'fr') : undefined;
  const okunus = k.okunus ? anlamCoz({ ...k.okunus, gruplar: undefined }, ar.length, `${id}/okunuş`, 'tr') : undefined;
  return { ar, kaynakAr, duzeltmeler, tr, fr, okunus, ikinci };
}
