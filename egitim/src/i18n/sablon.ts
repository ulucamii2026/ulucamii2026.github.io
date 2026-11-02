/**
 * Metin nesnelerini sayfa betiğine `data-veri` (JSON) ile aktarmak için: işlev üyeleri (`(n) => …`) JSON'a girmez, bu yüzden her biri tek
 * argümanla `'{0}'` verilerek çağrılır ve bir kalıp dizesine çevrilir; betik `doldur(kalip, değer)` ile `{0}`'ı değiştirir.
 * Fransızca metinlerdeki ince/bölünmez boşluklar işlev sonucunda da korunur (i18n dosyalarındaki `fransizca` sarmalayıcısı).
 */
export type Sablonlu<T> = T extends (...a: never[]) => string
  ? string
  : T extends object
    ? { [K in keyof T]: Sablonlu<T[K]> }
    : T;

export function sablonlar<T>(x: T): Sablonlu<T> {
  if (typeof x === 'function') return (x as unknown as (a: string) => string)('{0}') as Sablonlu<T>;
  if (Array.isArray(x)) return x.map((e) => sablonlar(e)) as Sablonlu<T>;
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, sablonlar(v)])) as Sablonlu<T>;
  return x as Sablonlu<T>;
}

/** `{0}` kalıbını doldurur (betik tarafı). */
export const kalipDoldur = (kalip: string, deger: string | number): string => kalip.replace('{0}', String(deger));
