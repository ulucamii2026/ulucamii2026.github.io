import type { Dil } from '../ui';
import type { FormMetinleri } from './tipler';
import { tr } from './tr';
import { fr } from './fr';
import { en } from './en';

export type { FormMetinleri } from './tipler';

export function formMetinleri(dil: Dil): FormMetinleri {
  return dil === 'fr' ? fr : dil === 'en' ? en : tr;
}

/** {ad} biçimindeki yer tutucuları doldurur (basit, HTML üretmez). */
export function doldur(metin: string, degerler: Record<string, string | number>): string {
  return metin.replace(/\{(\w+)\}/g, (_, k) => (k in degerler ? String(degerler[k]) : `{${k}}`));
}
