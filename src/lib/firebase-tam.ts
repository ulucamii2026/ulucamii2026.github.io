/**
 * Tam Firestore SDK'sı (27 Eylül 2026, Ezber Kilimi Faz 1c). Hoca ekranının geri kalanı `firebase/firestore/lite`
 * kullanır; ezber paneli sınıftaki zayıf bağlantıya dayanmak için kalıcı yerel önbellek (IndexedDB, çoklu sekme),
 * canlı dinleme (`onSnapshot`) ve bekleyen yazma bilgisi (`hasPendingWrites`) ister. Yalnız ezber paneli açılınca
 * dinamik olarak yüklenir. IndexedDB kullanılamazsa (gizli pencere) SDK bellek önbelleğine düşer; panel yine çalışır,
 * yalnız sayfa kapanınca bekleyen yazımlar kaybolur (panel bunu «bekleyen kayıt» uyarısıyla gösterir).
 */
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';

let ornek: Firestore | null = null;

export function tamFirestore(app: FirebaseApp): Firestore {
  if (ornek) return ornek;
  try {
    ornek = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    // Aynı uygulamada daha önce başka ayarla açılmışsa var olanı kullan.
    ornek = getFirestore(app);
  }
  return ornek;
}
