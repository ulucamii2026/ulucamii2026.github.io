/**
 * Ders günü ezber takvimi — türev veri (25 Ekim 2026). JSON'u içe aktaran TEK modül: tarayıcı betikleri `ders-takvimi.ts`'in saf işlevlerini alır, veriyi
 * bundle'a çekmez. Derleme (sayfalar) ve testler bunu kullanır. Dosyayı scripts/ezber-ders-takvimi.mjs üretir (elle düzenlenmez).
 */
import veri from '../../data/ezber/ders-takvimi-2026-2027.json';
import { takvimDogrula, type TakvimVerisi } from './ders-takvimi';

export const DERS_TAKVIMI: TakvimVerisi = takvimDogrula(veri as unknown as TakvimVerisi);
