/**
 * Fransızca sayfalarda Fransız yazım kuralı (27 Eylül 2026): «;», «!», «?» öncesindeki düz boşluk ince bölünmez
 * boşluğa (U+202F), «:» öncesindeki ve «« »» içindeki düz boşluk bölünmez boşluğa (U+00A0) çevrilir; noktalama satır
 * başına tek başına düşmez. Kural eğitim platformundakiyle aynıdır (egitim/src/i18n/metinler.ts → fransizTipografi).
 *
 * Eğitim platformu dönüşümü bütün HTML'ye uygular; ana sitede satır içi betik, stil ve Preact adacıkları olduğundan
 * burada yalnız metin düğümleri değişir. Etiketler ve öznitelikler, yorumlar, <script>, <style>, <textarea> içeriği
 * ile <pre>, <code>, <template>, <astro-island> altındaki her şey olduğu gibi kalır (CSS'te `!important` önündeki
 * boşluk, adacığın istemcide yeniden çizdiği metin). Boşluk yoksa eklenmez («https:», «10:30» değişmez). Dönüşüm
 * tekrar uygulanınca sonuç değişmez. Sayfanın dili `<html lang="fr…">`'den okunur: `/fr/` dışındaki Fransızca
 * sayfalar da (yetişkin kitabının `/e/<kod>/` sayfaları) kapsanır.
 */

const INCE = ' ';
const BOLUNMEZ = ' ';

/** Düz metin için kural. */
export function fransizMetin(s: string): string {
  return s
    .replace(/ ([;!?])/g, `${INCE}$1`)
    .replace(/ :/g, `${BOLUNMEZ}:`)
    .replace(/« /g, `«${BOLUNMEZ}`)
    .replace(/ »/g, `${BOLUNMEZ}»`);
}

/** İçeriği ham metin olan öğeler: kapanış etiketine kadar olduğu gibi kopyalanır. */
const HAM_METIN = new Set(['script', 'style', 'textarea']);
/** Alt ağacı olduğu gibi kalan öğeler (iç içe olabilir). */
const DOKUNULMAZ = new Set(['pre', 'code', 'template', 'astro-island']);
/** Kapanış etiketi olmayan öğeler: yığına girmez. */
const BOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** Etiketin kapanan `>`'ünden sonraki konum; tırnak içindeki `>` sayılmaz. */
function etiketSonu(html: string, bas: number): number {
  let tirnak = '';
  for (let j = bas + 1; j < html.length; j++) {
    const c = html[j];
    if (tirnak) {
      if (c === tirnak) tirnak = '';
    } else if (c === '"' || c === "'") {
      tirnak = c;
    } else if (c === '>') {
      return j + 1;
    }
  }
  return html.length;
}

/** Sayfa Fransızca mı: `<html lang="fr">`, `fr-BE` … */
export function fransizcaSayfaMi(html: string): boolean {
  return /<html\b[^>]*\blang=["']?fr\b/i.test(html.slice(0, 2000));
}

/** HTML'deki metin düğümlerine kuralı uygular. */
export function fransizTipografiHtml(html: string): string {
  const parcalar: string[] = [];
  const yigin: string[] = [];
  const etiketBasi = /<(?=[a-zA-Z/!?])/g;
  let i = 0;
  while (i < html.length) {
    etiketBasi.lastIndex = i;
    const bulunan = etiketBasi.exec(html);
    const lt = bulunan ? bulunan.index : html.length;
    if (lt > i) {
      const metin = html.slice(i, lt);
      parcalar.push(yigin.length ? metin : fransizMetin(metin));
    }
    if (!bulunan) break;
    if (html.startsWith('<!--', lt)) {
      const son = html.indexOf('-->', lt + 4);
      i = son === -1 ? html.length : son + 3;
      parcalar.push(html.slice(lt, i));
      continue;
    }
    const gt = etiketSonu(html, lt);
    const etiket = html.slice(lt, gt);
    parcalar.push(etiket);
    i = gt;
    const ad = /^<(\/?)([a-zA-Z][\w-]*)/.exec(etiket);
    if (!ad) continue;
    const kapanis = ad[1] === '/';
    const isim = ad[2].toLowerCase();
    if (!kapanis && HAM_METIN.has(isim) && !etiket.endsWith('/>')) {
      // toLowerCase() kullanılmaz: «İ» küçülünce iki kod birimi olur ve konumlar asıl metinle kayar.
      const kapat = new RegExp(`</${isim}\\b`, 'gi');
      kapat.lastIndex = i;
      const son = kapat.exec(html);
      const bitis = son ? etiketSonu(html, son.index) : html.length;
      parcalar.push(html.slice(i, bitis));
      i = bitis;
      continue;
    }
    if (!DOKUNULMAZ.has(isim) || BOS.has(isim)) continue;
    if (kapanis) {
      const k = yigin.lastIndexOf(isim);
      if (k !== -1) yigin.length = k;
    } else if (!etiket.endsWith('/>')) {
      yigin.push(isim);
    }
  }
  return parcalar.join('');
}
