/**
 * Ekran levhasının karakter bütçeleri (A alt projesi). Yatay 961×541'de (Polaroid TV, en dar ekran), ölçek 1'de
 * (taban boylar, src/lib/ekran/olcu.ts), %5 payla ölçülen sınırlar. Tek kaynak: içerik doğrulaması (icerik.ts),
 * duyuru bölme (secim.ts), node kapısı (tests/ekran-butce.test.mjs) ve CMS sınırları (config.yml) buradan beslenir.
 *
 * Sayılar başlangıç değerleridir; T1 numunesinde onaya sunuldu, T7 kalibrasyonunda kesinleşir.
 * Kalibrasyonu çalıştırmak için: EKRAN_KALIBRE=1 npx playwright test tests/web/ekran.spec.mjs -g kalibrasyonu
 *
 * Karakter = metin.trim().length (UTF-16 birimi; CMS pattern'i de böyle sayar). Arapçada harekeler de sayılır.
 */
import type { EkranDuyuru } from './akis.ts';

export const BUTCE = {
  /** Ayet, hadis, dua: bir kayıt profillerden herhangi birine uyarsa geçer. A: 2+2+2 satır, B: 1+3+3 satır. */
  manevi: [
    { ad: 'A', ar: 140, tr: 88, fr: 100, kaynak: 70 },
    { ad: 'B', ar: 70, tr: 130, fr: 150, kaynak: 70 },
  ],
  esma: { ar: 40, okunus: 30, tr: 80, fr: 90, kaynak: 70 },
  duyuru: {
    baslik: 60,
    /** İki dil aynı slaytta: her dilin metni en çok bu kadar. */
    tekSlaytMetin: 90,
    /** Dil başına ayrı slayt (ya da tek dilli duyuru): en çok bu kadar; aşan duyuru ekrana çıkmaz. */
    ikiSlaytMetin: 180,
    /** Afişin sağındaki sütun: başlık ve metin bu sınırların içindeyse aynı slayta girer. */
    afisBaslik: 30,
    afisMetin: 44,
  },
} as const;

export const uzunluk = (s?: string): number => (s ? s.trim().length : 0);

export interface ManeviMetin { ar: string; tr: string; fr?: string; kaynak: string; okunus?: string }
export interface ButceSonucu { uygun: boolean; asim: string[] }

type Sinir = { ar: number; tr: number; fr: number; kaynak: number; okunus?: number };

/** Bir profildeki aşımlar («TR 131/130») ve toplam fazla karakter. */
function asimlar(m: ManeviMetin, s: Sinir): { liste: string[]; fazla: number } {
  const liste: string[] = [];
  let fazla = 0;
  const bak = (ad: string, n: number, sinir: number): void => {
    if (n > sinir) { liste.push(`${ad} ${n}/${sinir}`); fazla += n - sinir; }
  };
  bak('AR', uzunluk(m.ar), s.ar);
  if (s.okunus !== undefined) bak('OKUNUŞ', uzunluk(m.okunus), s.okunus);
  bak('TR', uzunluk(m.tr), s.tr);
  bak('FR', uzunluk(m.fr), s.fr);
  bak('KAYNAK', uzunluk(m.kaynak), s.kaynak);
  return { liste, fazla };
}

/** Kayıt bütçeye uyuyor mu; uymuyorsa kısaltmanın en az olduğu (toplam fazlası en küçük) profilin aşımları. Örnek:
 *  TR'si 200 karakterlik hadis için «TR 200/130» (profil B) döner, «TR 200/88» (profil A) değil. */
export function maneviButce(tur: 'ayet' | 'hadis' | 'dua' | 'esma', m: ManeviMetin): ButceSonucu {
  const profiller: Sinir[] = tur === 'esma' ? [BUTCE.esma] : BUTCE.manevi.slice();
  let enIyi: { liste: string[]; fazla: number } | null = null;
  for (const p of profiller) {
    const a = asimlar(m, p);
    if (!a.liste.length) return { uygun: true, asim: [] };
    if (!enIyi || a.fazla < enIyi.fazla) enIyi = a;
  }
  return { uygun: false, asim: enIyi ? enIyi.liste : [] };
}

export type DuyuruParcasi =
  | { yerlesim: 'levha'; diller: Array<'tr' | 'fr'> }
  | { yerlesim: 'afis-sol'; metinli: boolean };

/** Duyurunun dolu dilleri (TR önce). Tek kaynak: parçalama, aşım raporu, slayt listesi ve çizici hep bunu kullanır. */
export function duyuruDilleri(d: Pick<EkranDuyuru, 'tr' | 'fr'>): Array<'tr' | 'fr'> {
  const diller: Array<'tr' | 'fr'> = [];
  if (d.tr) diller.push('tr');
  if (d.fr) diller.push('fr');
  return diller;
}

/** Duyurunun ekrandaki slaytları. Sığmayan (başlık > 60 ya da dil metni > 180) duyuru için boş liste. */
export function duyuruParcalari(d: Pick<EkranDuyuru, 'tr' | 'fr' | 'gorsel'>): DuyuruParcasi[] {
  const D = BUTCE.duyuru;
  const diller = duyuruDilleri(d);
  if (!diller.length) return [];
  const metinUz = diller.map((l) => uzunluk((l === 'tr' ? d.tr : d.fr)!.metin));
  const baslikUz = diller.map((l) => uzunluk((l === 'tr' ? d.tr : d.fr)!.baslik));
  const enUzunMetin = Math.max.apply(null, metinUz);
  const enUzunBaslik = Math.max.apply(null, baslikUz);
  if (enUzunBaslik > D.baslik || enUzunMetin > D.ikiSlaytMetin) return [];
  const metinLevhalari = (): DuyuruParcasi[] =>
    diller.length === 1 || enUzunMetin <= D.tekSlaytMetin
      ? [{ yerlesim: 'levha', diller }]
      : diller.map((l) => ({ yerlesim: 'levha' as const, diller: [l] }));
  if (d.gorsel) {
    const sagSutunaSigar = enUzunBaslik <= D.afisBaslik && enUzunMetin <= D.afisMetin;
    if (sagSutunaSigar) return [{ yerlesim: 'afis-sol', metinli: true }];
    const afis: DuyuruParcasi = { yerlesim: 'afis-sol', metinli: false };
    const liste: DuyuruParcasi[] = [afis];
    return liste.concat(metinLevhalari());
  }
  return metinLevhalari();
}

/** Sığmayan duyurunun aşımları («TR başlık 67/60», «FR metin 212/180»); sığıyorsa boş. Derleme uyarısı ve site
 *  denetimi için (src/lib/ekran/akis.ts → ekranDuyurulari). */
export function duyuruAsimlari(d: Pick<EkranDuyuru, 'tr' | 'fr'>): string[] {
  const D = BUTCE.duyuru;
  const liste: string[] = [];
  for (const dil of duyuruDilleri(d)) {
    const m = d[dil]!;
    const b = uzunluk(m.baslik);
    const t = uzunluk(m.metin);
    if (b > D.baslik) liste.push(`${dil.toUpperCase()} başlık ${b}/${D.baslik}`);
    if (t > D.ikiSlaytMetin) liste.push(`${dil.toUpperCase()} metin ${t}/${D.ikiSlaytMetin}`);
  }
  return liste;
}
