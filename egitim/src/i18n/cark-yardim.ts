/**
 * Çarkıfelek i18n yardımcısı (`carkMetinleri` ve `{n}/{m}` doldurma).
 */
export { CARK_DESTELERI, CARK_OKUMA_DESTELERI, CARK_SORU_DESTELERI, carkMetinleri, type CarkDeste, type CarkMetinleri, type CarkOkumaDeste, type CarkSoruDeste } from './cark';

export const doldurCark = (s: string, d: Readonly<Record<string, string | number>>): string =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));
