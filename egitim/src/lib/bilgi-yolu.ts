/**
 * «Bilgi maddeleri» yolu (İlim Yolu · Dilim 2): Ezber Kilimi'ndeki bilgi maddeleri (src/data/ezber/bilgi/b-*.json), katalog sırasıyla. Bu yolun ilerlemesi
 * kart ilerlemesinden değil, ezber cihaz kaydından gelir (bir madde çalışıldıysa `maddeler[id].son > 0`); sayfaları zaten `/[dil]/calis/<id>/` adresindedir.
 */
import { KATALOG, calismaSayfasiVar } from '@ortak/lib/ezber/katalog';
import { BILGI_METINLERI } from './bilgi-metinleri';

export const BILGI_MADDELERI = KATALOG.ogeler.filter((o) => BILGI_METINLERI.has(o.id) && calismaSayfasiVar(o));
export const BILGI_ID_LISTESI: readonly string[] = BILGI_MADDELERI.map((o) => o.id);
