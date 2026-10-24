/**
 * Cihaz ayarları (Faz 2c, 24 Ekim 2026): çocuğun bu tarayıcıdaki çalışma tercihi. Tek sürümlü tek anahtar
 * (`ulucamii:ezber:cihaz:v1`), yalnız bu cihazda kalır; hocanın verdiği basamağı ve Firestore'u etkilemez («evdeki çalışma
 * basamağı değiştirmez»). Depolama kapalı, dolu ya da bozuksa her işlev sessizce varsayılana döner: sayfa depolamadan
 * bağımsız çalışır. Saf: depo bir parametredir (Storage biçimli).
 */
import type { Seviye } from './gizleme';

export const ANAHTAR = 'ulucamii:ezber:cihaz:v1';
/** Tarayıcıda en çok bu kadar madde hatırlanır; en eski çalışılan atılır. */
export const AZAMI_MADDE = 120;
/** Arapça yazı boyutu adımları: 0 küçük … 4 çok büyük; varsayılan 1 (sayfanın kendi boyutu). */
export const AR_ENAZ = 0;
export const AR_ENCOK = 4;
export const AR_VARSAYILAN = 1;
export const BOY_ENAZ = 2;
export const BOY_ENCOK = 10;
export const BOY_VARSAYILAN = 5;

export type Kip = 'zincir' | 'gizle';

export interface MaddeAyari {
  readonly kip: Kip;
  readonly seviye: Seviye;
  readonly seri: number;
  readonly boy: number;
  readonly grup: number;
  readonly sondan: boolean;
  readonly dinleyici: boolean;
  /** Son çalışma anı (ms); eskiyi atmak için. */
  readonly son: number;
}
export interface CihazDurumu {
  readonly v: 1;
  readonly ar: number;
  readonly maddeler: Readonly<Record<string, MaddeAyari>>;
}
/** `localStorage` biçimi: yalnız üç işlev yeter. */
export interface Depo {
  getItem(anahtar: string): string | null;
  setItem(anahtar: string, deger: string): void;
  removeItem?(anahtar: string): void;
}

export const bos = (): CihazDurumu => ({ v: 1, ar: AR_VARSAYILAN, maddeler: {} });
export const varsayilanAyar = (): MaddeAyari => ({ kip: 'zincir', seviye: 0, seri: 0, boy: BOY_VARSAYILAN, grup: 0, sondan: false, dinleyici: false, son: 0 });

const sinirla = (x: unknown, enaz: number, encok: number, yedek: number) => {
  const n = typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) : yedek;
  return Math.min(encok, Math.max(enaz, n));
};
const kayit = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const KIMLIK = /^[a-z0-9-]{1,64}$/;

function ayarTemizle(x: unknown): MaddeAyari | null {
  if (!kayit(x)) return null;
  const v = varsayilanAyar();
  return {
    kip: x.kip === 'gizle' ? 'gizle' : 'zincir',
    seviye: sinirla(x.seviye, 0, 4, v.seviye) as Seviye,
    seri: sinirla(x.seri, 0, 1, v.seri),
    boy: sinirla(x.boy, BOY_ENAZ, BOY_ENCOK, v.boy),
    grup: sinirla(x.grup, 0, 200, v.grup),
    sondan: x.sondan === true,
    dinleyici: x.dinleyici === true,
    son: sinirla(x.son, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

/** Bilinmeyen kaynaktan (depodan okunan JSON) güvenli durum kurar: tür, aralık ve madde sayısı denetlenir. */
export function temizle(ham: unknown): CihazDurumu {
  if (!kayit(ham) || ham.v !== 1) return bos();
  const maddeler: Record<string, MaddeAyari> = {};
  if (kayit(ham.maddeler)) {
    for (const [id, a] of Object.entries(ham.maddeler)) {
      const t = KIMLIK.test(id) ? ayarTemizle(a) : null;
      if (t) maddeler[id] = t;
    }
  }
  return budaYap({ v: 1, ar: sinirla(ham.ar, AR_ENAZ, AR_ENCOK, AR_VARSAYILAN), maddeler });
}

function budaYap(d: CihazDurumu): CihazDurumu {
  const idler = Object.keys(d.maddeler);
  if (idler.length <= AZAMI_MADDE) return d;
  const kalan = idler.sort((a, b) => d.maddeler[b].son - d.maddeler[a].son).slice(0, AZAMI_MADDE);
  return { ...d, maddeler: Object.fromEntries(kalan.map((id) => [id, d.maddeler[id]])) };
}

/** Depodan oku; depo yok, kapalı ya da içerik bozuksa boş durum. */
export function oku(depo: Depo | null | undefined): CihazDurumu {
  try {
    const ham = depo?.getItem(ANAHTAR);
    return ham ? temizle(JSON.parse(ham)) : bos();
  } catch {
    return bos();
  }
}

/** Depoya yaz; başarısızsa (kapalı, dolu) `false` ve sayfa çalışmaya devam eder. */
export function yaz(depo: Depo | null | undefined, d: CihazDurumu): boolean {
  try {
    if (!depo) return false;
    depo.setItem(ANAHTAR, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export const maddeAyari = (d: CihazDurumu, id: string): MaddeAyari => d.maddeler[id] ?? varsayilanAyar();

/** Bir maddenin ayarını kısmen günceller (yeni durum döner); `simdi` son çalışma anıdır. */
export function maddeyiGuncelle(d: CihazDurumu, id: string, kismi: Partial<Omit<MaddeAyari, 'son'>>, simdi: number): CihazDurumu {
  if (!KIMLIK.test(id)) return d;
  const yeni = ayarTemizle({ ...maddeAyari(d, id), ...kismi, son: simdi });
  return yeni ? budaYap({ ...d, maddeler: { ...d.maddeler, [id]: yeni } }) : d;
}

export const arBoyutuAyarla = (d: CihazDurumu, adim: number): CihazDurumu => ({ ...d, ar: sinirla(adim, AR_ENAZ, AR_ENCOK, AR_VARSAYILAN) });
