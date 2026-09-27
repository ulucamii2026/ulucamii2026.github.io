/**
 * Ezber Kilimi — Firestore bağdaştırıcısı (27 Eylül 2026, Faz 1b). `durum.ts`'in kararını yazar: madde durumu
 * `ezberDurum/{ref}.ogeler.<id>` (birleştirerek) ve olay `ezberDurum/{ref}/olaylar/{otomatik}` TEK toplu yazımda gider;
 * kural birini reddederse ikisi de yazılmaz. Eşzamanlılık madde `surum`'uyla kuralda denetlenir: ortak hoca hesabı iki
 * telefonda açıkken eski ekrandan (ya da çevrim dışı kuyruktan) gelen yazım sessizce ezmez, `EZBER_CAKISMA` alır.
 * Tam SDK (`firebase/firestore`): Faz 1c'deki yerel önbellek ve bekleyen yazma göstergesi bunu ister.
 * Kurallar: firebase/firestore.rules «ezberDurum»; belge: docs/EZBER-KILIMI.md «Durum makinesi ve veri modeli».
 */
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { ezberDurumuOku, olayOku, type EzberOlayi, type Gecis, type OgeDurumu } from './durum';
import { gecisPlani, type GecisPlani } from './gecis';

/** Aynı maddeye başka bir cihaz daha önce yazdı: ekran durumu yeniden okuyup hocaya yeniden sordurur. */
export const EZBER_CAKISMA = 'EZBER_CAKISMA';
export type KayitliOlay = EzberOlayi & { readonly id: string; readonly zamanMs: number };
export type EzberSinifi = Record<string, Record<string, OgeDurumu>>;

const zamanMs = (z: unknown) => (z && typeof (z as { toMillis?: unknown }).toMillis === 'function' ? (z as { toMillis(): number }).toMillis() : 0);

export function ezberDeposu(db: Firestore, ref: string) {
  if (!ref || ref.includes('/')) throw new Error('Öğrenci seçimi geçersiz.');
  const belge = doc(db, 'ezberDurum', ref);
  const olayYolu = collection(belge, 'olaylar');
  return {
    /** Öğrencinin maddeleri (katalog dışı ve bozuk maddeler süzülür). */
    async oku(): Promise<Record<string, OgeDurumu>> {
      const s = await getDoc(belge);
      return s.exists() ? ezberDurumuOku(s.data()) : {};
    },
    /** Durum makinesinin kararı: `yaz`/`sil` durum + olay, `olay` yalnız olay; hepsi tek toplu yazım. */
    async uygula(gecis: Gecis): Promise<void> {
      const id = gecis.olay.ezber;
      const batch = writeBatch(db);
      if (gecis.islem === 'yaz')
        batch.set(belge, {
          ogeler: { [id]: { ...gecis.durum, notlar: [...gecis.durum.notlar], son: serverTimestamp() } },
          degisen: id, guncelleme: serverTimestamp(),
        }, { merge: true });
      else if (gecis.islem === 'sil')
        batch.set(belge, { ogeler: { [id]: deleteField() }, degisen: id, guncelleme: serverTimestamp() }, { merge: true });
      batch.set(doc(olayYolu), { ...gecis.olay, notlar: [...gecis.olay.notlar], zaman: serverTimestamp() });
      try {
        await batch.commit();
      } catch (e) {
        // Kural sürümü tutmadıysa sunucudaki sürüm kararın dayandığı sürümden farklıdır: ayırt edilebilir ileti.
        if (gecis.islem === 'yaz' && (e as { code?: string }).code === 'permission-denied') {
          const sunucu = await getDocFromServer(belge).catch(() => null);
          const simdi = sunucu?.exists() ? (ezberDurumuOku(sunucu.data())[id]?.surum ?? 0) : 0;
          if (sunucu && simdi !== gecis.durum.surum - 1) throw new Error(EZBER_CAKISMA);
        }
        throw e;
      }
    },
    /** Son olaylar, yeniden eskiye (karne, haftalık özet, veli geçmişi). */
    async olaylar(sinir = 50): Promise<KayitliOlay[]> {
      const s = await getDocs(query(olayYolu, orderBy('zaman', 'desc'), limit(sinir)));
      return s.docs.flatMap((d) => {
        const o = olayOku(d.data());
        return o ? [{ ...o, id: d.id, zamanMs: zamanMs(d.data().zaman) }] : [];
      });
    },
  };
}

/** Hoca: bütün sınıfın ezber durumu (öğrenci başına tek belge okuması). */
export async function ezberSinifi(db: Firestore): Promise<EzberSinifi> {
  const s = await getDocs(collection(db, 'ezberDurum'));
  return Object.fromEntries(s.docs.map((d) => [d.id, ezberDurumuOku(d.data())]));
}

export type TasimaSonucu = GecisPlani & { readonly yazilan: number; readonly hatali: number; readonly hatalar: string[] };

/**
 * Eski `ilerleme/{ref}.ezber` → `ezberDurum` (hoca hesabıyla; kurallar geçerli). Varsayılan kuru: yalnız plan döner.
 * Engel (eşleşmeyen dize, bilinmeyen değer) varsa plan boştur, hiçbir şey yazılmaz. Yazımlar birbirinden bağımsız ve
 * yinelenebilir: yarıda kalırsa yeniden çalıştırmak kalanı yazar. Hata iletileri kişisel veri taşımaz (yalnız kod).
 */
export async function eskiKayitlariTasi(db: Firestore, bugun: string, secenek: { yaz?: boolean } = {}): Promise<TasimaSonucu> {
  const [ilerleme, mevcut] = await Promise.all([getDocs(collection(db, 'ilerleme')), ezberSinifi(db)]);
  const plan = gecisPlani(ilerleme.docs.map((d) => ({ ref: d.id, ezber: d.data().ezber })), mevcut, bugun);
  let yazilan = 0;
  const hatalar: string[] = [];
  if (secenek.yaz)
    for (const y of plan.yazilacak) {
      try {
        await ezberDeposu(db, y.ref).uygula(y.gecis);
        yazilan++;
      } catch (e) {
        hatalar.push(String((e as { code?: string }).code ?? (e as Error).message));
      }
    }
  return { ...plan, yazilan, hatali: hatalar.length, hatalar };
}
