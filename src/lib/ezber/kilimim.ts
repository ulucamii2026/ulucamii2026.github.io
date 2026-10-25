/**
 * «Kilimim — kendi çalışmam» (25 Ekim 2026, Faz 3, hesapsız): bu cihazdaki çalışma kaydından (cihaz.ts) kilimin dokusunu çıkarır.
 * Saf ve ağsız: yalnız `CihazDurumu` okur, hiçbir şey yazmaz.
 *
 * BAĞLAYICI AYRIM: hocanın dinleyip verdiği basamak (Çalışıyor · Hocaya okudu · Pekişti · Kalıcı, `durum.ts`) ile çocuğun bu cihazda
 * kendi başına yaptığı çalışma ayrı şeylerdir. Burada cihaz verisi o basamaklara ÇEVRİLMEZ: ayrı bir dört dokulu ölçek vardır ve
 * yalnız cihazdaki iki alandan türer:
 *   - `son` (son çalışma anı): kaydı ve geçerli `son`u olan madde en az «başladım»dır;
 *   - `kutu` (tekrar basamağı, tekrar.ts `KUTU_GUN` = 1·3·7·14·30 gün): −1 hiç «Kendini sına» yapılmadı, 0…3 tekrar takvimine girdi,
 *     4 son (30 günlük) tekrar basamağında.
 * Rozet, mühür ve altın kenar yoktur: onlar hocanın dinlemesiyle kazanılır. Belge ve kilim hocanın onayı yerine geçmez.
 */
import type { CihazDurumu, MaddeAyari } from './cihaz';
import { KUTU_GUN, tarihMi, yerelGun } from './tekrar';
import { ucHaftaGunu } from './belge';

/** 0 çalışılmadı · 1 çalışmaya başladım (henüz sınanmadı) · 2 tekrar takvimine girdi (basamak 1–4 / 5) · 3 son tekrar basamağında (5 / 5). */
export type KendiDoku = 0 | 1 | 2 | 3;
export const KENDI_DOKULAR: readonly KendiDoku[] = Object.freeze([0, 1, 2, 3] as const);
/** Tekrar basamağı sayısı (belgedeki «n / 5» ile aynı). */
export const KENDI_BASAMAK = KUTU_GUN.length;

/** Bir madde kaydından doku. Kayıt yoksa ya da geçerli bir son çalışma anı yoksa 0. */
export function kendiDoku(a: Pick<MaddeAyari, 'son' | 'kutu'> | undefined): KendiDoku {
  if (!a || !(a.son > 0)) return 0;
  if (!(a.kutu >= 0)) return 1;
  return a.kutu >= KENDI_BASAMAK - 1 ? 3 : 2;
}

export interface KendiMadde {
  readonly id: string;
  readonly doku: KendiDoku;
  /** Son çalışma günü (`YYYY-AA-GG`, cihazın yerel günü); çalışılmadıysa boş. */
  readonly son: string;
  /** Tekrar basamağı 1…5 (belgedeki «n / 5»); henüz sınanmadıysa 0. */
  readonly basamak: number;
}

/** `sira`daki (çalışma sayfası olan) her madde için doku; katalog sırası korunur, listede olmayan kayıt atlanır. */
export function kendiMaddeler(d: CihazDurumu, sira: readonly string[]): KendiMadde[] {
  return sira.map((id) => {
    const a = d.maddeler[id];
    const doku = kendiDoku(a);
    const gun = doku > 0 && a ? yerelGun(new Date(a.son)) : '';
    return { id, doku, son: tarihMi(gun) ? gun : '', basamak: doku >= 2 && a ? Math.min(a.kutu, KENDI_BASAMAK - 1) + 1 : 0 };
  });
}

export interface KendiOzet {
  /** Çalışma sayfası olan madde sayısı. */
  readonly toplam: number;
  /** Çalışmaya başlanan (doku ≥ 1). */
  readonly basladi: number;
  /** Tekrar takvimine girmiş (doku ≥ 2). */
  readonly takvimde: number;
  /** Son tekrar basamağında (doku 3). */
  readonly sonBasamakta: number;
  /** Son üç haftada (bugün dâhil 21 gün) çalışılan gün sayısı; seri ya da puan değildir. */
  readonly gun: number;
}

export function kendiOzeti(maddeler: readonly KendiMadde[], gunler: readonly string[], bugun: string): KendiOzet {
  return {
    toplam: maddeler.length,
    basladi: maddeler.filter((m) => m.doku >= 1).length,
    takvimde: maddeler.filter((m) => m.doku >= 2).length,
    sonBasamakta: maddeler.filter((m) => m.doku === 3).length,
    gun: ucHaftaGunu(gunler, bugun),
  };
}
