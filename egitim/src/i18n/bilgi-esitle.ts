/**
 * Girişten sonra «Bu cihazdaki N işaret hesabınıza eklensin mi?» sorusu (bilgi kartı işaretleri; Ezber'deki `esitleSor`un karşılığı).
 * Evet/Hayır düğmeleri ve not metni Ezber sorusuyla ortaktır (i18n/hesap.ts). Çoğul ekinden kaçınmak için sayı Türkçe dışında parantezde verilir.
 */
import type { Dil } from '@ortak/i18n/ui';

const NNBSP = ' ';
const SOR: Record<Dil, (n: number) => string> = {
  tr: (n) => `Bu cihazdaki ${n} işaret hesabınıza eklensin mi?`,
  fr: (n) => `Ajouter à votre compte les repères de cet appareil (${n})${NNBSP}?`,
  en: (n) => `Add the marks on this device (${n}) to your account?`,
  nl: (n) => `Wilt u de markeringen op dit apparaat (${n}) aan uw account toevoegen?`,
  de: (n) => `Sollen die Markierungen auf diesem Gerät (${n}) Ihrem Konto hinzugefügt werden?`,
};

export const bilgiEsitleSor = (dil: Dil, n: number): string => SOR[dil](n);
