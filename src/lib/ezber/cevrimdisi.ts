/**
 * Çevrim dışı kayıt (25 Ekim 2026): bir maddeyi «İnternetsiz çalışmak için kaydet» ile kaydederken cihaza indirilecek TÜM ses dosyaları.
 * Yeni ses ya da yeni veri yoktur; yalnız katalogdaki yollar derlenir: tam kayıt, âyet parçaları, vakit seçenekleri (Ezan) ve
 * dinleme sırası (sûre başından başlayan maddede eûzü ve besmele de çalar). Çalışma sayfasındaki çalar, çalışma kipleri ve «Kendini sına»
 * yalnız bu dosyaları çalar; hangisi hangi kipte kullanılırsa kullanılsın hiçbiri eksik kalmaz (tests/ezber-cevrimdisi.test.mjs).
 * Yollar sunucudan bağımsızdır (`/media/ses/…`); sayfa başına ANA_SITE eklenir.
 */
import { dinlemeSirasi, sesSecenekleri, type KatalogOgesi } from './katalog';

export function sesYollari(oge: KatalogOgesi): string[] {
  const kume = new Set<string>();
  for (const yol of dinlemeSirasi(oge)) kume.add(yol);
  if (oge.ses?.tam) kume.add(oge.ses.tam);
  for (const yol of oge.ses?.parcalar ?? []) kume.add(yol);
  for (const secenek of sesSecenekleri(oge)) kume.add(secenek.yol);
  return [...kume];
}
