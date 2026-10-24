/**
 * Bağlayarak ezberleme (Faz 2c, 24 Ekim 2026): birimleri (âyet ya da dua bölümü) tek tek zincire ekler. Saf durum makinesi:
 * ekran (egitim kip-zincir.ts) yalnız hangi birimin görüneceğini ve hangi düğmenin açık olacağını buradan okur.
 *
 * Bir «halka» yeni bir birim ve o ana kadar zincire girenlerden oluşur. İleri zincirde birimler okuma sırasıyla eklenir
 * (1, 1–2, 1–3 …); «sondan» zincirde son birimden başlanıp geriye gidilir (n, n−1–n …): uzun maddede sonu başa göre zayıf
 * kalan çocuk için. Her halkada üç evre vardır: yeni (dinle ve oku) → sen (yeniyi görerek, öncekileri ezberden oku) →
 * kontrol (hepsi görünür, kendini yokla). Sonucu çocuk kendi söyler; uygulama doğruluğu ölçmez.
 */

export interface Halka {
  /** Bu halkada eklenen birimin sırası (0'dan). */
  readonly yeni: number;
  /** Okuma sırasındaki bütün birimler (yeni dâhil). */
  readonly kapsam: readonly number[];
}

/** `n` birimlik aralık için halkalar; `bas` aralığın ilk birim sırası (uzun maddede grubun başı). */
export function halkalar(n: number, sondan = false, bas = 0): Halka[] {
  const sonuc: Halka[] = [];
  for (let k = 0; k < n; k++) {
    if (sondan) {
      const yeni = bas + n - 1 - k;
      sonuc.push({ yeni, kapsam: Array.from({ length: k + 1 }, (_, i) => yeni + i) });
    } else {
      sonuc.push({ yeni: bas + k, kapsam: Array.from({ length: k + 1 }, (_, i) => bas + i) });
    }
  }
  return sonuc;
}

export interface Grup { readonly bas: number; readonly son: number }

/**
 * Uzun maddeyi `boy`'lik gruplara böler (son grup `son` hariç sınırlıdır). Artakalan yarım boydan küçükse önceki gruba
 * katılır: tek birimlik «zincir» çocuğa boş bir tur yaptırırdı.
 */
export function gruplar(n: number, boy = 5): Grup[] {
  if (n <= 0) return [];
  const g: { bas: number; son: number }[] = [];
  for (let bas = 0; bas < n; bas += boy) g.push({ bas, son: Math.min(n, bas + boy) });
  if (g.length > 1) {
    const son = g[g.length - 1];
    if (son.son - son.bas < Math.ceil(boy / 2)) {
      g.pop();
      g[g.length - 1].son = n;
    }
  }
  return g;
}

export type Evre = 'yeni' | 'sen' | 'kontrol' | 'bitti';
export type Olay = 'hazir' | 'kontrol' | 'tam' | 'az' | 'tekrar';
export interface Durum { readonly halka: number; readonly evre: Evre }

export const baslangic = (): Durum => ({ halka: 0, evre: 'yeni' });

/**
 * Tek geçiş tablosu. «tam» halkayı bitirir ve sıradakine geçer; «az» aynı halkada yeniden okutur (öncekiler gizli kalır,
 * yalnız yeni görünür); «tekrar» yeniden dinletir. Tanımsız olay durumu değiştirmez.
 */
export function gec(d: Durum, halkaSayisi: number, olay: Olay): Durum {
  if (d.evre === 'bitti') return d;
  if (d.evre === 'yeni' && olay === 'hazir') return { halka: d.halka, evre: 'sen' };
  if (d.evre === 'sen') {
    if (olay === 'kontrol') return { halka: d.halka, evre: 'kontrol' };
    if (olay === 'tekrar') return { halka: d.halka, evre: 'yeni' };
  }
  if (d.evre === 'kontrol') {
    if (olay === 'tam') return d.halka + 1 < halkaSayisi ? { halka: d.halka + 1, evre: 'yeni' } : { halka: d.halka, evre: 'bitti' };
    if (olay === 'az') return { halka: d.halka, evre: 'sen' };
    if (olay === 'tekrar') return { halka: d.halka, evre: 'yeni' };
  }
  return d;
}

export type BirimHali = 'tam' | 'gizli';

/**
 * Evrede her birimin hâli. yeni: hepsi görünür (çocuk okur, dinler); sen: yalnız yeni görünür, öncekiler ezberden
 * okunur; kontrol: hepsi görünür. Bitti evresinde de hepsi görünür.
 */
export function birimHali(birim: number, yeni: number, evre: Evre): BirimHali {
  return evre === 'sen' && birim !== yeni ? 'gizli' : 'tam';
}
