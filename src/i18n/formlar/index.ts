import type { Dil } from '../ui';
import type { FormMetinleri } from './tipler';
import { tr } from './tr';
import { fr } from './fr';
import { en } from './en';
import { nl } from './nl';
import { de } from './de';

export type { FormMetinleri } from './tipler';

/** Beş dilin tamamı burada; eksik dil TypeScript hatası olur (sessiz Türkçe/Fransızca yedeği yok). */
const metinler: Record<Dil, FormMetinleri> = { tr, fr, en, nl, de };

export function formMetinleri(dil: Dil): FormMetinleri {
  return metinler[dil] ?? tr;
}

/** {ad} biçimindeki yer tutucuları doldurur (basit, HTML üretmez). */
export function doldur(metin: string, degerler: Record<string, string | number>): string {
  return metin.replace(/\{(\w+)\}/g, (_, k) => (k in degerler ? String(degerler[k]) : `{${k}}`));
}
