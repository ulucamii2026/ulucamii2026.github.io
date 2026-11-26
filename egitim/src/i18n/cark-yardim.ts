/**
 * Çarkıfelek i18n yardımcısı (`carkMetinleri` ve `{n}/{m}` doldurma) — CARK_DESTELERI tekrarını önler.
 */
export { CARK_DESTELERI, carkMetinleri, type CarkDeste, type CarkMetinleri } from './cark';

export const doldurCark = (s: string, d: Readonly<Record<string, string | number>>): string =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? ''));
