/**
 * Çalışma Belgesi (25 Ekim 2026): bu cihazdaki çalışma kaydından (cihaz.ts) belgeye girecek satırları çıkarır. Saf ve ağsız:
 * yalnız `CihazDurumu` okur, hiçbir şey yazmaz. Veri uydurulmaz: madde başına cihazda tutulan alanlar `son` (son çalışma anı)
 * ve `kutu` (tekrar basamağı) vardır; «çalışılan gün sayısı» maddeye değil cihaza aittir (`gunler`, son üç hafta).
 * Belge hocanın dinlediği ezberi değil, çocuğun kendi çalışmasını söyler; Ezber Sertifikası'nın yerini tutmaz (docs/EZBER-KILIMI.md).
 */
import type { CihazDurumu } from './cihaz';
import { KUTU_GUN, gunEkle, tarihMi, yerelGun } from './tekrar';

export interface BelgeSatiri {
  readonly id: string;
  /** Son çalışma günü (`YYYY-AA-GG`, cihazın yerel günü). */
  readonly son: string;
  /** Tekrar basamağı: −1 hiç sınanmadı, 0…4 (belgede 1…5 / 5). */
  readonly kutu: number;
}

/** «Son üç hafta»: bugün dâhil 21 takvim günü. */
export const HAFTA_PENCERESI = 21;
/** Belgede tekrar basamağı en çok bu kadardır (`KUTU_GUN` kadar basamak). */
export const BASAMAK_SAYISI = KUTU_GUN.length;

/**
 * Çalışılmış (cihazda kaydı ve geçerli son çalışma anı olan) maddeler, `sira` (katalog sırası) düzeninde. `sira`da olmayan
 * (katalogdan kalkmış ya da çalışma sayfası olmayan) madde atlanır: belgeye adı yazılamayan satır girmez.
 */
export function belgeSatirlari(d: CihazDurumu, sira: readonly string[]): BelgeSatiri[] {
  const cikti: BelgeSatiri[] = [];
  for (const id of sira) {
    const a = d.maddeler[id];
    if (!a || !(a.son > 0)) continue;
    const gun = yerelGun(new Date(a.son));
    if (!tarihMi(gun)) continue;
    cikti.push({ id, son: gun, kutu: a.kutu });
  }
  return cikti;
}

/** Son üç haftada (bugün dâhil) çalışılan gün sayısı; seri ya da puan değildir. */
export function ucHaftaGunu(gunler: readonly string[], bugun: string): number {
  if (!tarihMi(bugun)) return 0;
  const bas = gunEkle(bugun, -(HAFTA_PENCERESI - 1));
  return new Set(gunler.filter((g) => tarihMi(g) && g >= bas && g <= bugun)).size;
}

/** Satır sayısına göre kâğıt yoğunluğu: az satırda satırlar iri ve ferah, çoğunda sıkı (sayfaya yaymak için). */
export function yogunluk(n: number): 'az' | 'orta' | 'cok' {
  return n <= 6 ? 'az' : n <= 12 ? 'orta' : 'cok';
}

/** Tekrar basamağını belgedeki yazıya çevirir («2 / 5»); sınanmamışsa boş çizgi. */
export const basamakYazisi = (kutu: number): string => (kutu >= 0 ? `${Math.min(kutu, BASAMAK_SAYISI - 1) + 1} / ${BASAMAK_SAYISI}` : '—');
