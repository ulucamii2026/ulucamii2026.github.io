/**
 * Ezber kartı için kare kod (Faz 2e): madde sayfasının kanonik adresi, derleme anında `qrcode` paketiyle vektör SVG'ye çevrilir.
 * Matrisin çizimi saf ve testli kısımda: src/lib/ezber/kare-kod.ts. Çalışma zamanında hiçbir şey üretilmez (statik sayfa).
 */
import QRCode from 'qrcode';
import { kareKodSvg } from '@ortak/lib/ezber/kare-kod';

export function maddeKareKodu(adres: string): string {
  return kareKodSvg(QRCode.create(adres, { errorCorrectionLevel: 'M' }).modules);
}
