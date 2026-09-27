/**
 * «Kilimim» bölümündeki örnek kilimin uydurma ilerlemesi (onaylı taslaktaki veriyle aynı; ad yok). Dört basamak ve
 * rozet/mühür örneği birlikte görünsün diye seçildi. Gerçek öğrenci verisi bu platformda hiçbir zaman basılmaz.
 */
import type { OgeDurumu } from '@ortak/lib/ezber/durum';

const g = (basamak: OgeDurumu['basamak'], kalite: OgeDurumu['kalite'] = 'tam', sonrakiKontrol = ''): OgeDurumu =>
  ({ basamak, kalite, notlar: [], sonrakiKontrol, surum: 1 });

export const ORNEK_KILIM: Readonly<Record<string, OgeDurumu>> = Object.freeze({
  'd-euzu-besmele': g(4), 'd-kelime-i-tevhid': g(4), 'd-kelime-i-sehadet': g(4), 'b-imanin-sartlari': g(4), 'b-islamin-sartlari': g(4),
  'b-abdestin-farzlari': g(3, 'tam', '2026-11-14'), 'b-guslun-farzlari': g(3, 'tam', '2026-11-14'), 'b-teyemmumun-farzlari': g(3, 'az', '2026-11-21'),
  'd-abdest-niyeti': g(3, 'tam', '2026-11-14'), 'b-namazin-farzlari': g(2, 'az', '2026-10-24'), 'd-namaz-niyeti': g(2, 'tam', '2026-10-24'),
  'd-tekbir': g(4), 'd-subhaneke': g(2, 'tam', '2026-10-24'),
  's-fatiha': g(2, 'tam', '2026-10-24'), 's-ihlas': g(1, 'tekrar', '2026-10-24'), 's-kevser': g(1, '', ''),
  'd-yemek-duasi': g(3, 'tam', '2026-11-07'),
});
