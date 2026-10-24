/**
 * Kendini sınama oyunlarının saf mantığı (Faz 2d, 24 Ekim 2026): tohumlu karıştırma, «Sırala», «Eksik kelime» ve «Hangi âyet?»
 * soruları. Ekran (egitim kip-sina.ts) yalnız bu soruları çizer ve yanıtı sorar; doğru yanıt burada belirlenir ve testle
 * sabitlenir. Tohum verildiğinde sonuç aynıdır: test ve hata ayıklama için; ekran her turda yeni tohum alır. Doğru ya da yanlış
 * sesi, puan ve sıralama yoktur (karar: karşılaştırmasız ilerleme); sonuç yalnız çocuğun kendi öz değerlendirmesine girdidir.
 */

/** Dizeden 32 bit tohum (FNV-1a). */
export function tohum(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Tohumlu [0, 1) üreteci (mulberry32). */
export function rastgele(t: number): () => number {
  let a = t >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates; girdiyi değiştirmez. */
export function karistir<T>(d: readonly T[], r: () => number): T[] {
  const s = [...d];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

/** 0…n−1'in permütasyonu; n > 1 ise asıl sıradan her zaman farklıdır (karışık gelmeyen «Sırala» turu olmaz). */
export function farkliSira(n: number, r: () => number): number[] {
  const asil = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return asil;
  for (let deneme = 0; deneme < 20; deneme++) {
    const s = karistir(asil, r);
    if (s.some((x, i) => x !== i)) return s;
  }
  return [...asil.slice(1), asil[0]];
}

/** Kaç parça yerinde: `sira[i]` konumdaki parçanın asıl sırası i ise yerindedir. */
export const yerindeSayisi = (sira: readonly number[]): number => sira.filter((x, i) => x === i).length;

/** Okunaklı geri bildirim için: bütün parçalar asıl sıradaysa tamam. */
export const siraDogru = (sira: readonly number[]): boolean => sira.every((x, i) => x === i);

/** Tek parçaya yakın metni «Sırala» için eşit kelime öbeklerine böler (2–4 kelimelik parçalar); çok kısaysa boş döner. */
export function parcalaKelimeler(kelimeler: readonly string[], enFazla = 6): string[] {
  const adet = Math.min(enFazla, Math.round(kelimeler.length / 3));
  if (adet < 2) return [];
  const sonuc: string[] = [];
  let bas = 0;
  for (let i = 0; i < adet; i++) {
    const son = bas + Math.ceil((kelimeler.length - bas) / (adet - i));
    sonuc.push(kelimeler.slice(bas, son).join(' '));
    bas = son;
  }
  return sonuc;
}

const ISARETLER = /[\p{Mn}\p{Cf}]/gu;
const UZATMA = String.fromCodePoint(0x640);
/** Harf iskeleti: harekeler, durak işaretleri ve uzatma çizgisi atılır; iki seçeneğin «aynı kelime» sayılıp sayılmadığına bakar. */
export const iskelet = (kelime: string): string => kelime.replace(ISARETLER, '').replaceAll(UZATMA, '');
const harfSayisi = (kelime: string): number => (iskelet(kelime).match(/\p{L}/gu) ?? []).length;

export interface EksikSoru {
  readonly bolum: number;
  readonly sira: number;
  readonly dogru: string;
  readonly secenekler: readonly string[];
  readonly dogruSecenek: number;
}

/**
 * «Eksik kelime» soruları: bölümlerden birer kelime seçilir (önce her bölümden en çok bir kelime, bölüm azsa tekrar), kalan
 * seçenekler aynı maddenin başka kelimelerinden, doğru kelimeye uzunlukça en yakın olanlar arasından alınır. Doğrudan aynı
 * iskelete sahip bir seçenek olmaz. Yeterli seçenek yoksa soru atlanır (daha az soru döner).
 */
export function eksikKelimeSorulari(kel: readonly (readonly string[])[], adet: number, r: () => number, secenekSayisi = 3): EksikSoru[] {
  const havuz = new Map<string, string>();
  for (const b of kel) for (const k of b) if (harfSayisi(k) >= 2 && !havuz.has(iskelet(k))) havuz.set(iskelet(k), k);
  const adaylar: { bolum: number; sira: number }[] = [];
  kel.forEach((b, bolum) => b.forEach((k, sira) => { if (harfSayisi(k) >= 3) adaylar.push({ bolum, sira }); }));
  const karisik = karistir(adaylar, r);
  const sirali = [...karisik.filter((a, i) => karisik.findIndex((x) => x.bolum === a.bolum) === i), ...karisik.filter((a, i) => karisik.findIndex((x) => x.bolum === a.bolum) !== i)];
  const sorular: EksikSoru[] = [];
  for (const { bolum, sira } of sirali) {
    if (sorular.length >= adet) break;
    const dogru = kel[bolum][sira];
    const dogruIskelet = iskelet(dogru);
    const digerler = [...havuz.entries()].filter(([i]) => i !== dogruIskelet).map(([, k]) => k);
    if (digerler.length < secenekSayisi - 1) continue;
    const yakin = [...digerler]
      .map((k) => ({ k, fark: Math.abs(harfSayisi(k) - harfSayisi(dogru)), kur: r() }))
      .sort((a, b) => a.fark - b.fark || a.kur - b.kur)
      .slice(0, Math.max(secenekSayisi + 3, 6))
      .map((x) => x.k);
    const secilen = karistir(yakin, r).slice(0, secenekSayisi - 1);
    const secenekler = karistir([dogru, ...secilen], r);
    sorular.push({ bolum, sira, dogru, secenekler, dogruSecenek: secenekler.indexOf(dogru) });
  }
  return sorular;
}

export interface HangiSoru {
  readonly bolum: number;
  readonly secenekler: readonly number[];
  readonly dogruSecenek: number;
}

/**
 * «Hangi âyet?» soruları: sesi çalınacak bölüm `sesli` içinden, seçenekler `hepsi` içinden (doğru bölüm dâhil) gelir.
 * `hepsi` en az `secenekSayisi` bölüm içermiyorsa soru üretilmez.
 */
export function hangiAyetSorulari(sesli: readonly number[], hepsi: readonly number[], adet: number, r: () => number, secenekSayisi = 3): HangiSoru[] {
  if (hepsi.length < secenekSayisi) return [];
  return karistir(sesli.filter((b) => hepsi.includes(b)), r).slice(0, adet).map((bolum) => {
    const digerleri = karistir(hepsi.filter((b) => b !== bolum), r).slice(0, secenekSayisi - 1);
    const secenekler = karistir([bolum, ...digerleri], r);
    return { bolum, secenekler, dogruSecenek: secenekler.indexOf(bolum) };
  });
}

/** Sayfanın meâl bloklarından biri: `bas` ilk, `son` son bölümün sırasından bir fazlası (aralık [bas, son)). */
export interface AnlamBlogu {
  readonly bas: number;
  readonly son: number;
  readonly meal: string;
}

/**
 * «Anlamla eşleştir» için aday bloklar: çalışılan kısmın (bölüm aralığı [bas, son)) içine tamamen sığanlar. Meâl grupları kısım
 * sınırını aşabilir; kısımda ikiden az blok kalırsa oyun boş kalmasın diye maddenin bütün blokları aday olur. Metni boş blok
 * eşleşme olamaz, elenir.
 */
export function anlamAdaylari(bloklar: readonly AnlamBlogu[], bas: number, son: number): number[] {
  const dolu = bloklar.map((b, i) => (b.meal.trim() ? i : -1)).filter((i) => i >= 0);
  const kismi = dolu.filter((i) => bloklar[i].bas >= bas && bloklar[i].son <= son);
  return kismi.length >= 2 ? kismi : dolu;
}

export interface EslestirmeTuru {
  /** Arapça sütun: seçilen blokların kimlikleri, metindeki sıraya göre. */
  readonly sol: readonly number[];
  /** Anlam sütunu: aynı kimlikler, sol sütunla aynı sırada gelmeyecek biçimde karıştırılmış. */
  readonly sag: readonly number[];
}

/**
 * «Anlamla eşleştir» turu: `adaylar` içinden en çok `adet` blok seçilir (aynı anlam metnini taşıyan iki blok birden seçilmez,
 * yoksa eşleşme belirsiz kalırdı). En az iki blok yoksa tur kurulamaz. Tohum aynıysa tur aynıdır.
 */
export function eslestirmeTuru(adaylar: readonly number[], anahtar: (kimlik: number) => string, adet: number, r: () => number): EslestirmeTuru | null {
  const gorulen = new Set<string>();
  const tekil = adaylar.filter((i) => {
    const a = anahtar(i).trim();
    if (!a || gorulen.has(a)) return false;
    gorulen.add(a);
    return true;
  });
  const k = Math.min(adet, tekil.length);
  if (k < 2) return null;
  const sol = karistir(tekil, r).slice(0, k).sort((a, b) => a - b);
  const sag = farkliSira(k, r).map((p) => sol[p]);
  return { sol, sag };
}
