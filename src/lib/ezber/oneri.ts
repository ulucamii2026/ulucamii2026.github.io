/**
 * Ezber Kilimi — öğrenci önerisi (27 Eylül 2026, Faz 1c). Saf: hocanın dinleme penceresinde üstte çıkan maddeler.
 * Sıra: kontrol günü gelenler (en eskisi önce) → çalıştıkları (Çalışıyor, kontrolü gelmemiş) → sıradaki yeni madde.
 * Sıradaki: kaydı olmayan (gösterilen basamağı 0) maddeler içinde önce yıllık planda sınıf hedefi olanlar (hedef
 * gününe göre), sonra hedefi olmayanlar katalog sırasıyla. Plan tarihi «sınıf hedefi»dir; öğrenci kendi hızında
 * ilerler (atlanmış eski hedef yeni hedeften önce gelir).
 */
import { KATALOG } from './katalog';
import { gorunenBasamak, katalogSirasi, kontrolSirasi, type OgeDurumu } from './durum';

export interface OgrenciOnerisi {
  readonly kontrol: readonly string[];
  readonly calisiyor: readonly string[];
  readonly siradaki: string | null;
}

export function ogrenciOnerisi(ogeler: Readonly<Record<string, OgeDurumu>>, bugun: string,
  hedefler: Readonly<Record<string, string>> = {}): OgrenciOnerisi {
  const kontrol = kontrolSirasi(ogeler, bugun);
  const katalogda = (id: string) => katalogSirasi(id) !== Number.MAX_SAFE_INTEGER;
  const calisiyor = Object.entries(ogeler)
    .filter(([id, d]) => d.basamak === 1 && katalogda(id) && !kontrol.includes(id))
    .map(([id]) => id)
    .sort((a, b) => katalogSirasi(a) - katalogSirasi(b));
  const hedef = (id: string) => (Object.hasOwn(hedefler, id) ? hedefler[id] : '');
  const adaylar = KATALOG.ogeler.map((o) => o.id).filter((id) => gorunenBasamak(ogeler, id) === 0);
  adaylar.sort((a, b) => {
    const [ha, hb] = [hedef(a), hedef(b)];
    if (ha && hb && ha !== hb) return ha < hb ? -1 : 1;
    if (Boolean(ha) !== Boolean(hb)) return ha ? -1 : 1;
    return katalogSirasi(a) - katalogSirasi(b);
  });
  return { kontrol, calisiyor, siradaki: adaylar[0] ?? null };
}
