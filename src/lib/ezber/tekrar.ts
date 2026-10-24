/**
 * Tekrar takvimi (Faz 2d, 24 Ekim 2026): kendini sınama turundan sonra bir maddenin ne zaman yeniden çalışılacağını önerir.
 * Aralıklı tekrar (Cepeda vd. 2008; Rawson–Dunlosky 2022): aralıklar 1 · 3 · 7 · 14 · 30 gün. «Tam» bir üst kutuya, «Az
 * takıldım» aynı kutuda, «Bir daha» ilk kutuya (1 gün) götürür. Bu takvim yalnız ÖNERİDİR: hocanın verdiği basamağı, kilimi ve
 * rozeti değiştirmez; yalnız bu cihazda tutulur (cihaz.ts). Seri ya da puan yoktur: ritim yazıyla söylenir («bu hafta 3 gün»).
 * Saf işlevler: tarihler `YYYY-AA-GG` dizesidir (yerel gün), saat dilimi hesaba karışmaz.
 */
export const KUTU_GUN = [1, 3, 7, 14, 30] as const;
export type TekrarSonucu = 'tam' | 'az' | 'tekrar';

const TARIH = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Gerçek takvim günü mü: «2026-02-30» gibi taşan günleri `Date.parse` kabul eder, gidiş dönüş sınaması reddeder. */
export const tarihMi = (s: unknown): s is string => typeof s === 'string' && TARIH.test(s) && gunEkle(s, 0) === s;

/** `tarih` + `n` gün (UTC takvimi; yaz saati kaymaz). */
export function gunEkle(tarih: string, n: number): string {
  const [, y, a, g] = TARIH.exec(tarih) ?? [];
  return new Date(Date.UTC(Number(y), Number(a) - 1, Number(g) + n)).toISOString().slice(0, 10);
}

/** `son` − `bas` gün sayısı (UTC takvimi; yaz saati kaymaz). Geçmişte kalan tarih için negatiftir. */
export function gunFarki(bas: string, son: string): number {
  const gun = (s: string) => {
    const [, y, a, g] = TARIH.exec(s) ?? [];
    return Date.UTC(Number(y), Number(a) - 1, Number(g));
  };
  return Math.round((gun(son) - gun(bas)) / 86_400_000);
}

/** Cihazın yerel takvim günü. */
export function yerelGun(d: Date): string {
  const iki = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

export interface Kutu { readonly kutu: number; readonly sonraki: string }

/**
 * Sınama sonucundan sonraki durum. `kutu` −1: henüz hiç sınanmadı. Sonraki gün, yeni kutunun aralığı kadar sonradır.
 */
export function sonrakiTekrar(kutu: number, sonuc: TekrarSonucu, bugun: string): Kutu {
  const onceki = Number.isInteger(kutu) ? Math.min(Math.max(kutu, -1), KUTU_GUN.length - 1) : -1;
  const yeni = sonuc === 'tam' ? Math.min(onceki + 1, KUTU_GUN.length - 1) : sonuc === 'az' ? Math.max(onceki, 0) : 0;
  return { kutu: yeni, sonraki: gunEkle(bugun, KUTU_GUN[yeni]) };
}

/** Bugün (ya da geçmişte) tekrarı gelen maddeler: en eski tarih önce, eşitse kimliğe göre. */
export function bugunTekrar(maddeler: Readonly<Record<string, { readonly sonraki: string }>>, bugun: string): string[] {
  return Object.entries(maddeler)
    .filter(([, m]) => tarihMi(m.sonraki) && m.sonraki <= bugun)
    .sort(([a, x], [b, y]) => (x.sonraki === y.sonraki ? (a < b ? -1 : 1) : x.sonraki < y.sonraki ? -1 : 1))
    .map(([id]) => id);
}

/** Cihazda en çok bu kadar çalışılan gün tutulur (üç hafta). */
export const GUN_AZAMI = 21;

/** Çalışılan günler listesine bugünü ekler: tekil, sıralı, son `en` gün tutulur. */
export function gunuIsle(gunler: readonly string[], bugun: string, en = GUN_AZAMI): string[] {
  if (!tarihMi(bugun)) return [...gunler];
  return [...new Set([...gunler, bugun])].sort().slice(-en);
}

/** Son yedi günde (bugün dâhil) çalışılan gün sayısı; «bu hafta 3 gün çalıştınız» için. */
export function haftaGunu(gunler: readonly string[], bugun: string): number {
  const bas = gunEkle(bugun, -6);
  return new Set(gunler.filter((g) => tarihMi(g) && g >= bas && g <= bugun)).size;
}
