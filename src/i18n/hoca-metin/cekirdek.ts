/** Hoca ekranı — dil seçici ve ortak kabuk metinleri (çekirdek: src/i18n/hoca.ts). */
import { sozluk, type Metin } from '../hoca';
import type { Dil } from '../ui';

const tr = {
  'dil.etiket': 'Dil',
  'yukleniyor': 'Yükleniyor…',
} as const;

export const CEKIRDEK = {
  tr,
  fr: { 'dil.etiket': 'Langue', 'yukleniyor': 'Chargement…' },
  en: { 'dil.etiket': 'Language', 'yukleniyor': 'Loading…' },
  nl: { 'dil.etiket': 'Taal', 'yukleniyor': 'Laden…' },
  de: { 'dil.etiket': 'Sprache', 'yukleniyor': 'Wird geladen …' },
} satisfies Record<Dil, Record<keyof typeof tr, Metin>>;

export const tc = sozluk(CEKIRDEK);
