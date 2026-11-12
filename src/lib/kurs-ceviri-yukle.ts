/**
 * Ana site için kurs çevirisi yükleyicisi (12 Kasım 2026): egitim/src/lib/kurs-ceviri-yukle.ts'in eşi; aynı bindirme dosyalarını
 * (src/data/kurs-ceviri/<dil>.json, konular-<dil>.json) derleme anında okur. Yapı: src/lib/kurs-ceviri.mjs başlığı, süreç: docs/KURS-CEVIRISI.md.
 */
import type { Dil } from '../i18n/ui';
import { cevirici } from './kurs-ceviri.mjs';

const bindirmeler = import.meta.glob('../data/kurs-ceviri/*.json', { eager: true, import: 'default' }) as Record<string, any>;
const konular = import.meta.glob('../data/konular-*.json', { eager: true, import: 'default' }) as Record<string, Record<string, string>>;
const dosya = (harita: Record<string, any>, ad: string) => Object.entries(harita).find(([y]) => y.endsWith(`/${ad}.json`))?.[1];

export function kursCevirici(dil: Dil) {
  return cevirici(dil, {
    bindirme: dosya(bindirmeler, dil) ?? {},
    konular: dosya(konular, `konular-${dil}`) ?? {},
    konularFr: dosya(konular, 'konular-fr') ?? {},
  });
}
