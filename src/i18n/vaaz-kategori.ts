/** Vaaz kategorileri — liste süzgeci (Vaazlar.astro) ve okuma sayfası künyesi ([slug].astro) ortak sözlüğü. */
import type { Dil } from './ui';

export const katAd: Record<string, Record<Dil, string>> = {
  ibadet: { tr: 'İbadet', fr: 'Culte', en: 'Worship' },
  ahlak: { tr: 'Ahlak', fr: 'Éthique', en: 'Ethics' },
  iman: { tr: 'İman', fr: 'Foi', en: 'Faith' },
  ramazan: { tr: 'Ramazan', fr: 'Ramadan', en: 'Ramadan' },
  kandil: { tr: 'Kandiller', fr: 'Nuits saintes', en: 'Holy nights' },
  aile: { tr: 'Aile', fr: 'Famille', en: 'Family' },
  siyer: { tr: 'Siyer', fr: 'Vie du Prophète', en: "Prophet's life" },
  toplum: { tr: 'Toplum', fr: 'Société', en: 'Society' },
  genel: { tr: 'Genel', fr: 'Général', en: 'General' },
};

/** Süzgeç çiplerinin sabit sırası. */
export const katSira = ['iman', 'ibadet', 'ahlak', 'ramazan', 'kandil', 'siyer', 'aile', 'toplum', 'genel'];
