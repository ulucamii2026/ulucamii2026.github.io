/**
 * Bilgi Yarışması tur dağıtıcısı (10 Kasım 2026): öğretmenin seçtiği biçim, konu, yaş bandı ve tur sayısına göre soru seçer; aynı tohum + aynı
 * ayar = aynı oyun (tohum ve ayarlar adres çubuğunun `#` kısmında gider, sunucuya hiçbir şey ulaşmaz). Karıştırma kimliklere ve tohuma
 * bağlıdır, metne değil: aynı bağlantı beş dilde aynı turları verir.
 */
import { farkliSira, karistir, rastgele, tohum } from '../ezber/oyun';
import { BICIMLER, HASSAS, KONULAR, type Biçim, type Konu } from './tipler';

/** Dağıtıcının ihtiyacı olan alanlar: oyun sayfası kendi dilindeki gövdeyle (YerelSoru), testler tam bankayla çalışır. */
export interface Kunye { readonly id: string; readonly format: Biçim; readonly topic: Konu; readonly level: number }

export type Seviye = '1' | '1-2' | '2-3';
export const SEVIYELER: readonly Seviye[] = ['1', '1-2', '2-3'];
export const ADETLER = [5, 10, 15] as const;

export interface Ayar { readonly bicim: 'karisik' | Biçim; readonly konular: readonly Konu[]; readonly seviye: Seviye; readonly adet: number; readonly tohum: string }
export const VARSAYILAN: Omit<Ayar, 'tohum'> = { bicim: 'karisik', konular: KONULAR, seviye: '1-2', adet: 10, };

/** «Karışık» kipte 10 tur başına sabit dağılım (ölçek oranı): 4 sınav, 2 sıralama, 1 gruplama, 1 eşleştirme, 2 gizemli. */
export const KARISIK_AGIRLIK: Readonly<Record<Biçim, number>> = { quiz: 4, siralama: 2, gruplama: 1, eslestirme: 1, gizemli: 2 };

export const seviyeAraligi = (s: Seviye): readonly number[] => (s === '1' ? [1] : s === '1-2' ? [1, 2] : [2, 3]);

/** Ayara uyan sorular. Hassas gizemli kutular `hassasDahil` verilmedikçe asla girmez. */
export function havuz<T extends Kunye>(sorular: readonly T[], ayar: Pick<Ayar, 'bicim' | 'konular' | 'seviye'>, hassasDahil = false): T[] {
  const sev = seviyeAraligi(ayar.seviye);
  return sorular.filter((s) => (ayar.bicim === 'karisik' || s.format === ayar.bicim) && ayar.konular.includes(s.topic) && sev.includes(s.level) && (hassasDahil || !HASSAS.has(s.id)));
}

/**
 * «Karışık» kipte biçim başına tur sayısı: ağırlıklara göre (en büyük kalan yöntemi), sonra havuzda yeterli soru olmayan biçimler kırpılıp
 * artan turlar boş yeri olan biçimlere dağıtılır. Toplam, havuzun taşıyabileceğinden fazla olamaz.
 */
export function karisikDagilim(adet: number, kapasite: Readonly<Record<Biçim, number>>): Record<Biçim, number> {
  const toplamAgirlik = BICIMLER.reduce((a, b) => a + KARISIK_AGIRLIK[b], 0);
  const hedef = Math.min(adet, BICIMLER.reduce((a, b) => a + kapasite[b], 0));
  const sayi = Object.fromEntries(BICIMLER.map((b) => [b, 0])) as Record<Biçim, number>;
  const ideal = BICIMLER.map((b) => (hedef * KARISIK_AGIRLIK[b]) / toplamAgirlik);
  BICIMLER.forEach((b, i) => { sayi[b] = Math.min(Math.floor(ideal[i]), kapasite[b]); });
  const kalan = (): number => hedef - BICIMLER.reduce((a, b) => a + sayi[b], 0);
  // Küsurat sırası (büyükten küçüğe; eşitte ağırlık, sonra bildirim sırası) ve ardından boş yeri olanlara döngü.
  const sira = BICIMLER.map((b, i) => ({ b, k: ideal[i] - Math.floor(ideal[i]) })).sort((x, y) => y.k - x.k || KARISIK_AGIRLIK[y.b] - KARISIK_AGIRLIK[x.b]);
  for (let guvenlik = 0; kalan() > 0 && guvenlik < 1000; guvenlik++) {
    for (const { b } of sira) {
      if (kalan() > 0 && sayi[b] < kapasite[b]) sayi[b]++;
    }
  }
  return sayi;
}

/** Aynı biçim yan yana gelmeyecek biçimde (mümkünse) tohumlu sıralar; bir biçim kalanın yarısından fazlaysa sırayı o açar. */
function araliklaDiz<T extends Kunye>(kuyruklar: Record<Biçim, T[]>, r: () => number): T[] {
  const sonuc: T[] = [];
  let son: Biçim | null = null;
  for (;;) {
    const kalan = BICIMLER.filter((b) => kuyruklar[b].length > 0);
    if (!kalan.length) break;
    const toplam = kalan.reduce((a, b) => a + kuyruklar[b].length, 0);
    const zorunlu = kalan.find((b) => kuyruklar[b].length * 2 > toplam);
    let adaylar = kalan.filter((b) => b !== son);
    if (!adaylar.length) adaylar = kalan;
    let secilen: Biçim;
    if (zorunlu && adaylar.includes(zorunlu)) secilen = zorunlu;
    else {
      let x = r() * adaylar.reduce((a, b) => a + kuyruklar[b].length, 0);
      secilen = adaylar[adaylar.length - 1];
      for (const b of adaylar) { x -= kuyruklar[b].length; if (x < 0) { secilen = b; break; } }
    }
    sonuc.push(kuyruklar[secilen].shift()!);
    son = secilen;
  }
  return sonuc;
}

/** Oyunun turları: ayara uyan, tekrarsız, en çok `ayar.adet` soru. Havuz küçükse daha az döner (boşsa boş). */
export function turDagit<T extends Kunye>(sorular: readonly T[], ayar: Ayar, hassasDahil = false): T[] {
  const r = rastgele(tohum(`${ayar.tohum}|tur`));
  const hepsi = havuz(sorular, ayar, hassasDahil);
  const karisik = karistir(hepsi, r);
  if (ayar.bicim !== 'karisik') return karisik.slice(0, ayar.adet);
  const kuyruklar = Object.fromEntries(BICIMLER.map((b) => [b, karisik.filter((s) => s.format === b)])) as Record<Biçim, T[]>;
  const kapasite = Object.fromEntries(BICIMLER.map((b) => [b, kuyruklar[b].length])) as Record<Biçim, number>;
  const dagilim = karisikDagilim(ayar.adet, kapasite);
  for (const b of BICIMLER) kuyruklar[b] = kuyruklar[b].slice(0, dagilim[b]);
  return araliklaDiz(kuyruklar, r);
}

/** Hiçbir elemanı yerinde kalmayan permütasyon (n ≥ 2): eşleştirmede sağ sütunun hiçbir satırı hizalı başlamaz. */
export function yerindeKalmayanSira(n: number, r: () => number): number[] {
  const asil = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return asil;
  for (let d = 0; d < 100; d++) {
    const s = karistir(asil, r);
    if (s.every((x, i) => x !== i)) return s;
  }
  return asil.map((_, i) => (i + 1) % n);
}

export interface Sunum {
  /** quiz / gizemli: görünen k. seçenek = seçenekler[sira[k]]. siralama: sira[konum] = parçanın asıl sırası. gruplama: görünen k. kart = ogeler[sira[k]]. eslestirme: sağ sütunda p. satır = ciftler[sira[p]].sag. */
  readonly sira: readonly number[];
}

/** Bir sorunun ekrandaki karışık düzeni (n: parça sayısı); soru kimliği + oyun tohumundan türer (dilden bağımsız). */
export function sunumHazirla(soru: { readonly id: string; readonly format: Biçim }, n: number, oyunTohumu: string): Sunum {
  const r = rastgele(tohum(oyunTohumu + "|" + soru.id));
  const dizi = Array.from({ length: n }, (_, i) => i);
  switch (soru.format) {
    case 'quiz':
    case 'gizemli':
    case 'gruplama': return { sira: karistir(dizi, r) };
    case 'siralama': return { sira: farkliSira(n, r) };
    case 'eslestirme': return { sira: yerindeKalmayanSira(n, r) };
  }
}

const rastgeleTohum = (): string => Math.floor(Math.random() * 0xffffffff).toString(36);

/** Adres çubuğunun `#` kısmı: `f=quiz&k=siyer,ibadet&d=1-2&n=10&s=abc`. */
export const ayarYaz = (a: Ayar): string =>
  `f=${a.bicim}&k=${a.konular.join(',')}&d=${a.seviye}&n=${a.adet}&s=${encodeURIComponent(a.tohum)}`;

/** `#` kısmından ayar; bozuk ya da eksik parçalar varsayılana düşer (asla hata fırlatmaz). Tohum yoksa `uret` ile (ya da rastgele) yenisi atanır. */
export function ayarOku(hash: string, uret: () => string = rastgeleTohum): Ayar {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const f = p.get('f');
  const bicim = f === 'karisik' || (BICIMLER as readonly string[]).includes(f ?? '') ? (f as Ayar['bicim']) : VARSAYILAN.bicim;
  const k = (p.get('k') ?? '').split(',').filter((x): x is Konu => (KONULAR as readonly string[]).includes(x));
  const d = p.get('d') as Seviye;
  const n = Number(p.get('n'));
  const s = (p.get('s') ?? '').slice(0, 32);
  return {
    bicim,
    konular: k.length ? KONULAR.filter((x) => k.includes(x)) : VARSAYILAN.konular,
    seviye: SEVIYELER.includes(d) ? d : VARSAYILAN.seviye,
    adet: (ADETLER as readonly number[]).includes(n) ? n : VARSAYILAN.adet,
    tohum: /^[\w-]+$/.test(s) ? s : uret(),
  };
}
