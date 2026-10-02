/** Mühtedi Hizmetleri Envanteri — Apps Script sunucu paketinin (`EnvanterVeri`) giriş noktası.
 *
 *  `npm run ihtida:gas-derle` bu dosyayı esbuild ile IIFE olarak paketler; GAS tarafında
 *  `EnvanterVeri.<ad>` ile okunur (scripts/apps-script/envanter-isleri.gs). Burada Apps Script API'si
 *  ÇAĞRILMAZ. Cami tablosu derleme anında iki JSON'dan kurulur: bölge eşlemesi yalnız katalog
 *  kimliği ve bölge adı taşır (kişisel veri yok).
 */
import bolgeHaritasi from '../../data/envanter-bolgeleri.json';
import katalog from '../../../public/data/belcika-camileri.json';
import { camiTablosu, dogrula as dogrulaTemel } from './sozlesme.ts';

export {
  FORM_SURUMU, ONAY_SURUMU, AZAMI_KISI, AZAMI_SAYI, LISTEDE_YOK, BOLGELER,
  GOREVLI_SEKMESI, BILDIRIM_SEKMESI, GOREVLI_BASLIKLARI, BILDIRIM_BASLIKLARI,
  ayarCoz, gorevliSatiri, bildirimSatirlari,
} from './sozlesme.ts';

/** Yayındaki cami tablosu (70 BDV camisi, 7 bölge). */
export const CAMILER = camiTablosu(bolgeHaritasi as Record<string, string>, katalog);

/** Sunucu sarmalayıcısı: cami tablosu her zaman yayındaki tablodur (çağıran başka tablo geçemez). */
export const dogrula = (govde: unknown, yil: number) => dogrulaTemel(govde, CAMILER, yil);
