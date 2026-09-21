/** Vaaz kategorileri — liste süzgeci (Vaazlar.astro) ve okuma sayfası künyesi ([slug].astro) ortak sözlüğü. */
import type { Dil } from './ui';

export const katAd: Record<string, Record<Dil, string>> = {
  ibadet: { tr: 'İbadet', fr: 'Culte', en: 'Worship', nl: 'Eredienst', de: 'Gottesdienst' },
  ahlak: { tr: 'Ahlak', fr: 'Éthique', en: 'Ethics', nl: 'Ethiek', de: 'Ethik' },
  iman: { tr: 'İman', fr: 'Foi', en: 'Faith', nl: 'Geloof', de: 'Glaube' },
  ramazan: { tr: 'Ramazan', fr: 'Ramadan', en: 'Ramadan', nl: 'Ramadan', de: 'Ramadan' },
  kandil: { tr: 'Kandiller', fr: 'Nuits saintes', en: 'Holy nights', nl: 'Gezegende nachten', de: 'Gesegnete Nächte' },
  aile: { tr: 'Aile', fr: 'Famille', en: 'Family', nl: 'Gezin', de: 'Familie' },
  siyer: { tr: 'Siyer', fr: 'Vie du Prophète', en: "Prophet's life", nl: 'Leven van de Profeet', de: 'Leben des Propheten' },
  toplum: { tr: 'Toplum', fr: 'Société', en: 'Society', nl: 'Samenleving', de: 'Gesellschaft' },
  genel: { tr: 'Genel', fr: 'Général', en: 'General', nl: 'Algemeen', de: 'Allgemein' },
};

/** Süzgeç çiplerinin sabit sırası. */
export const katSira = ['iman', 'ibadet', 'ahlak', 'ramazan', 'kandil', 'siyer', 'aile', 'toplum', 'genel'];
