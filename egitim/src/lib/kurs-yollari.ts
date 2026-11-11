/**
 * Kurs sayfaları arası bağlantılar (Dilim 4 / P5): ana sitedeki `yol(dil, anahtar)` ile AYNI çağrı biçimi, ama taşınan sayfalar egitim'in nötr
 * adreslerine (/<dil>/kurs/…, /<dil>/veli/) gider; taşınmayanlar (UİP, seviye testi, gizlilik, yetişkin eğitimi…) ana sitede (ulucamii.be) kalır.
 * Sayfa dosyaları ana sitedekiyle aynı kalsın diye `yol` adı korunur.
 */
import type { Dil } from '@ortak/i18n/ui';
import { yollar } from '@ortak/i18n/ui';
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
// `yollar` doğrudan: ana sitenin yol()'u (i18n/utils.ts) Dilim 4'ten beri taşınan sayfalar için egitim adresi verir; bu işlev ulucamii.be'deki ESKİ adrestir.
export const anaAdres = (dil: Dil, anahtar: string): string => `${ANA_SITE}/${dil}/${(yollar as Record<string, Record<Dil, string>>)[anahtar][dil]}/`;

export function yol(dil: Dil, anahtar: string): string {
  const y = KURS_YOLLARI[anahtar];
  return y ? `/${dil}/${y}/` : anaAdres(dil, anahtar);
}
