/** Seviye testi — Apps Script sunucu paketinin (`SeviyeTesti`) giriş noktası.
 *
 *  `npm run ihtida:gas-derle` bu dosyayı esbuild ile IIFE olarak paketler; GAS tarafında
 *  `SeviyeTesti.<ad>` ile okunur. Burada Apps Script API'si ÇAĞRILMAZ: dosya saf kalır ki
 *  hem tarayıcı hem Node hem de GAS aynı bankayı ve aynı puanlamayı görsün.
 *  Tek kaynak: `sorular/*.ts` + `puanlama.ts` + `metinler.ts` + `profil.ts`.
 */
import { MADDELER } from './index.ts';
import { girdiDogrula as bankaGirdiDogrula } from './puanlama.ts';

export {
  SORU_BANKASI_SURUMU, BANKA_DURUMU, MADDELER, EZBER, BEYAN, bankaPuanla, maddeBul,
} from './index.ts';
export { SONUC_METINLERI } from './metinler.ts';
export {
  PROFIL_DEGERLERI, PROFIL_TEKLI, PROFIL_COKLU, PROFIL_SINIRLARI, PROFIL_ETIKETLERI_TR,
  OKUMA_DUZEYLERI_TR, EZBER_DURUMLARI_TR,
} from './profil.ts';

/** Sunucu sarmalayıcısı: madde listesi her zaman yayındaki bankadır (çağıran banka geçemez). */
export const girdiDogrula = (cevaplar: unknown) => bankaGirdiDogrula(MADDELER, cevaplar);
