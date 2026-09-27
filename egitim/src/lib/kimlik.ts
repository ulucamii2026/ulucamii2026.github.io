/**
 * Kurumsal kimlik tek kaynaktan: src/data/kurumsal-kimlik.json (kimlik paketinin depo kopyası; `npm run kimlik:uret`).
 * Kurs sayfası kurs kimliğini taşır (yeşil). İletişim bloğu: adres · info@ulucamii.be · cami hattı · web; din
 * görevlisinin adı ya da telefonu hiçbir zaman yer almaz (13 Eylül 2026 kararı).
 */
import kimlik from '@ortak/data/kurumsal-kimlik.json';
import type { Dil } from '@ortak/i18n/ui';

const cami = kimlik.iletisim.telefonlar.find((t) => t.kimlik === 'cami');
if (!cami) throw new Error('kurumsal kimlikte cami telefonu yok');

export const kursAdi = (dil: Dil): string => kimlik.kurumlar.kurs.ad[dil];
export const kursTamAdi = (dil: Dil): string => kimlik.kurumlar.kurs.tamAd[dil];
export const hukukiSatir = (dil: Dil): string => kimlik.hukuki.altbilgi[dil];
export const veliPortali = (dil: Dil): string => kimlik.iletisim.veliPortali[dil];
export const ILETISIM = Object.freeze({
  adres: kimlik.iletisim.adres.tekSatir,
  eposta: kimlik.iletisim.eposta.genel,
  telefon: { goster: cami.goster, e164: cami.e164 },
  web: { adres: kimlik.iletisim.web.adres, goster: kimlik.iletisim.web.goster },
});
/** Ana site (sesler de buradan gelir: Hosting ses taşımaz, GitHub Pages CORS *). */
export const ANA_SITE = 'https://ulucamii.be';
