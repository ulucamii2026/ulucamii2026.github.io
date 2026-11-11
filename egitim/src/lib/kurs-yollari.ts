/**
 * Kurs sayfaları arası bağlantılar (Dilim 4 / P5): ana sitedeki `yol(dil, anahtar)` ile AYNI çağrı biçimi, ama taşınan sayfalar egitim'in nötr
 * adreslerine (/<dil>/kurs/…, /<dil>/veli/) gider; taşınmayanlar (UİP, seviye testi, gizlilik, yetişkin eğitimi…) ana sitede (ulucamii.be) kalır.
 * Sayfa dosyaları ana sitedekiyle aynı kalsın diye `yol` adı korunur.
 */
import type { Dil } from '@ortak/i18n/ui';
import { yol as anaYol } from '@ortak/i18n/utils';
import { ANA_SITE } from './kimlik';

/** Ana site sayfa anahtarı → egitim yolu (dil önekinden sonrası). */
export const KURS_YOLLARI: Record<string, string> = {
  kurankursu: 'kurs',
  mufredat: 'kurs/mufredat',
  yillikplan: 'kurs/yillik-plan',
  dersmateryalleri: 'kurs/materyaller',
  kursgunlugu: 'kurs/gunluk',
  veli: 'veli',
};

/** Bu sayfanın ulucamii.be'deki (eski ve şimdilik kanonik) adresi. */
export const anaAdres = (dil: Dil, anahtar: string): string => ANA_SITE + anaYol(dil, anahtar as Parameters<typeof anaYol>[1]);

export function yol(dil: Dil, anahtar: string): string {
  const y = KURS_YOLLARI[anahtar];
  return y ? `/${dil}/${y}/` : anaAdres(dil, anahtar);
}
