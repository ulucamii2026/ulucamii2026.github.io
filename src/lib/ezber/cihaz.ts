/**
 * Cihaz ayarları (Faz 2c, 24 Ekim 2026; 2d'de tekrar takvimi eklendi): çocuğun bu tarayıcıdaki çalışma tercihi. Tek sürümlü tek
 * anahtar (`ulucamii:ezber:cihaz:v1`), yalnız bu cihazda kalır; hocanın verdiği basamağı ve Firestore'u etkilemez («evdeki
 * çalışma basamağı değiştirmez»). Depolama kapalı, dolu ya da bozuksa her işlev sessizce varsayılana döner: sayfa depolamadan
 * bağımsız çalışır. 2d alanları (`kutu`, `sonraki`, `gunler`) sürüm numarasını değiştirmez: eski kayıtta yoklar, okunurken
 * varsayılanı alırlar. Saf: depo bir parametredir (Storage biçimli).
 */
import type { Seviye } from './gizleme';
import { GUN_AZAMI, gunuIsle, tarihMi } from './tekrar';

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
/** Tekrar kutusu: −1 hiç sınanmadı, 0…4 aralıklar 1·3·7·14·30 gün (tekrar.ts). */
export const KUTU_ENAZ = -1;
export const KUTU_ENCOK = 4;

export type Kip = 'zincir' | 'gizle' | 'sina';

export interface MaddeAyari {
  readonly kip: Kip;
  readonly seviye: Seviye;
  readonly seri: number;
  readonly boy: number;
  readonly grup: number;
  readonly sondan: boolean;
  readonly dinleyici: boolean;
  /** Tekrar kutusu (−1: hiç sınanmadı). */
  readonly kutu: number;
  /** Önerilen sonraki tekrar günü (`YYYY-AA-GG`); boş: öneri yok. */
  readonly sonraki: string;
  /** Son çalışma anı (ms); eskiyi atmak için. */
  readonly son: number;
}
export interface CihazDurumu {
  readonly v: 1;
  readonly ar: number;
  readonly maddeler: Readonly<Record<string, MaddeAyari>>;
  /** Çalışılan günler (`YYYY-AA-GG`, sıralı, son üç hafta): «bu hafta N gün» yazısı içindir; seri ya da puan değildir. */
  readonly gunler: readonly string[];
}
/** `localStorage` biçimi: yalnız üç işlev yeter. */
export interface Depo {
  getItem(anahtar: string): string | null;
  setItem(anahtar: string, deger: string): void;
  removeItem?(anahtar: string): void;
}

export const bos = (): CihazDurumu => ({ v: 1, ar: AR_VARSAYILAN, maddeler: {}, gunler: [] });
export const varsayilanAyar = (): MaddeAyari => ({
  kip: 'zincir', seviye: 0, seri: 0, boy: BOY_VARSAYILAN, grup: 0, sondan: false, dinleyici: false, kutu: KUTU_ENAZ, sonraki: '', son: 0,
});

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
    kip: x.kip === 'gizle' ? 'gizle' : x.kip === 'sina' ? 'sina' : 'zincir',
    seviye: sinirla(x.seviye, 0, 4, v.seviye) as Seviye,
    seri: sinirla(x.seri, 0, 1, v.seri),
    boy: sinirla(x.boy, BOY_ENAZ, BOY_ENCOK, v.boy),
    grup: sinirla(x.grup, 0, 200, v.grup),
    sondan: x.sondan === true,
    dinleyici: x.dinleyici === true,
    kutu: sinirla(x.kutu, KUTU_ENAZ, KUTU_ENCOK, v.kutu),
    sonraki: tarihMi(x.sonraki) ? x.sonraki : '',
    son: sinirla(x.son, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

/** Çalışılan gün listesi: yalnız gerçek takvim günleri, tekil, sıralı, son `GUN_AZAMI` gün. */
function gunleriTemizle(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return [...new Set(x.filter(tarihMi))].sort().slice(-GUN_AZAMI);
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
  return budaYap({ v: 1, ar: sinirla(ham.ar, AR_ENAZ, AR_ENCOK, AR_VARSAYILAN), maddeler, gunler: gunleriTemizle(ham.gunler) });
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

/** Bugünü çalışılan günlere ekler (tekil, sıralı, son üç hafta). Geçersiz tarih durumu değiştirmez. */
export const calismaGunuIsle = (d: CihazDurumu, bugun: string): CihazDurumu => (tarihMi(bugun) ? { ...d, gunler: gunuIsle(d.gunler, bugun) } : d);
