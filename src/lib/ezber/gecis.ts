/**
 * Ezber Kilimi — eski kayıtların geçiş planı (27 Eylül 2026, Faz 1b). Saf: `ilerleme/{ref}.ezber` alanlarından ve
 * yeni sistemdeki mevcut maddelerden yazılacak geçişleri çıkarır; yazmaz. Kurallar: docs/EZBER-KILIMI.md «Eski
 * kayıtların geçişi»; betik: scripts/ezber-gecis.mjs (önce kuru). Eski alan olduğu gibi kalır. Yeni sistemde geçmişi
 * (olayı) olan ama kaydı olmayan madde hocanın kaldırdığı maddedir: betik yeniden çalıştırılınca geri getirilmez.
 */
import { eskiEzberGecisi } from './katalog';
import { gecisDurumu, katalogSirasi, type Gecis, type OgeDurumu } from './durum';

export interface GecisGirdisi {
  readonly ref: string;
  /** `ilerleme/{ref}.ezber`: plan dizesi → eski durum. Eksik ya da bozuksa boş sayılır. */
  readonly ezber: unknown;
}
export interface GecisPlani {
  /** Öğrenci, sonra katalog sırasıyla. Engel varsa boştur. */
  readonly yazilacak: { readonly ref: string; readonly id: string; readonly gecis: Gecis }[];
  readonly ogrenci: number;
  /** Eski ezber kaydı (boş olmayan değer) bulunan öğrenci sayısı. */
  readonly ezberli: number;
  /** Yeni sistemde kaydı zaten olan maddeler: ezilmez. */
  readonly atlanan: number;
  /** Yeni sistemde kaydı yok ama olayı var (geçişten sonra hoca kaldırmış): yeniden yazılmaz. */
  readonly gecmisli: number;
  /** Bilerek karşılıksız bırakılan dizelerin kayıt sayısı (eski alanda kalır). */
  readonly karsiliksiz: number;
  /** Engeller: doluysa hiçbir şey yazılmaz; eşleme eklenir, `npm run test:ezber` yeşil olunca yeniden çalıştırılır. */
  readonly eslesmeyen: string[];
  readonly bilinmeyenDurum: string[];
  /** Yazılacak maddelerin yeni basamağa göre sayısı. */
  readonly basamaklar: { readonly 1: number; readonly 2: number };
}

export function gecisPlani(girdi: readonly GecisGirdisi[],
  mevcut: Readonly<Record<string, Readonly<Record<string, OgeDurumu>> | undefined>>, bugun: string,
  gecmis: Readonly<Record<string, Iterable<string> | undefined>> = {}): GecisPlani {
  const yazilacak: GecisPlani['yazilacak'] = [];
  const eslesmeyen = new Set<string>();
  const bilinmeyen = new Set<string>();
  const basamaklar = { 1: 0, 2: 0 };
  let ezberli = 0;
  let atlanan = 0;
  let gecmisli = 0;
  let karsiliksiz = 0;
  for (const { ref, ezber } of girdi) {
    const eski = ezber && typeof ezber === 'object' && !Array.isArray(ezber) ? (ezber as Record<string, unknown>) : {};
    if (Object.values(eski).some((v) => v !== '')) ezberli++;
    const g = eskiEzberGecisi(eski);
    g.eslesmeyen.forEach((k) => eslesmeyen.add(k));
    g.bilinmeyenDurum.forEach((k) => bilinmeyen.add(k));
    karsiliksiz += g.karsiliksiz.length;
    const var_ = mevcut[ref] ?? {};
    const olayli = new Set(gecmis[ref] ?? []);
    for (const [id, durum] of Object.entries(g.durumlar)) {
      if (Object.hasOwn(var_, id)) { atlanan++; continue; }
      if (olayli.has(id)) { gecmisli++; continue; }
      const gecis = gecisDurumu(durum, id, bugun);
      if (!gecis || gecis.islem !== 'yaz') continue;
      yazilacak.push({ ref, id, gecis });
      basamaklar[gecis.durum.basamak === 2 ? 2 : 1]++;
    }
  }
  const engel = eslesmeyen.size > 0 || bilinmeyen.size > 0;
  yazilacak.sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : katalogSirasi(a.id) - katalogSirasi(b.id)));
  return {
    yazilacak: engel ? [] : yazilacak,
    ogrenci: girdi.length, ezberli, atlanan, gecmisli, karsiliksiz,
    eslesmeyen: [...eslesmeyen].sort(), bilinmeyenDurum: [...bilinmeyen].sort(),
    basamaklar: engel ? { 1: 0, 2: 0 } : basamaklar,
  };
}
