/**
 * İlim Yolu oturum işareti (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md). FIREBASE'SİZ: her sayfa bunu yükleyebilir. Anonim sayfalar
 * Firebase'i yalnız bu işaret varsa (ya da hesap sayfasında) yükler; ilerleme yazan sayfalar (çalışma, kartlar…) hangi cihaz
 * anahtarına yazacağını buradan öğrenir (`etkinAnahtar`): girişliyken kullanıcının anahtarı, değilse anonim anahtar.
 *
 * İşaretin değeri uid'nin özetidir (SHA-256 onaltılık, ilk 32 hane). Kişisel veri değildir ve yeni bir bilgi de taşımaz: aynı özet
 * kullanıcının cihaz anahtarının adında (`ulucamii:ezber:cihaz:v1:u:<özet>`) zaten durur. Ham uid, e-posta, ad, token yazılmaz.
 * Depo kapalı ya da bozuksa her işlev sessizce «işaret yok»a döner.
 */
import { ANAHTAR, kullaniciAnahtari, type Depo } from '@ortak/lib/ezber/cihaz';

export const OTURUM_ANAHTARI = 'ilimYolu:oturum';
const OZET = /^[0-9a-f]{32}$/;

/** uid → SHA-256 onaltılık, ilk 32 hane (WebCrypto; tarayıcıda ve Node 20+'da). */
export async function uidOzeti(uid: string, subtle: SubtleCrypto = globalThis.crypto.subtle): Promise<string> {
  if (typeof uid !== 'string' || !uid) throw new TypeError('uid boş olamaz');
  const ozet = new Uint8Array(await subtle.digest('SHA-256', new TextEncoder().encode(uid)));
  return [...ozet].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/** İşaretteki özet; işaret yok, bozuk ya da depo kapalıysa `null`. */
export function oturumOzeti(depo: Depo | null | undefined): string | null {
  try {
    const v = depo?.getItem(OTURUM_ANAHTARI) ?? null;
    return v && OZET.test(v) ? v : null;
  } catch {
    return null;
  }
}

export const oturumVar = (depo: Depo | null | undefined): boolean => oturumOzeti(depo) !== null;

export function isaretKoy(depo: Depo | null | undefined, ozet: string): void {
  if (!OZET.test(ozet)) throw new TypeError('oturum özeti 32 onaltılık hane olmalı');
  try { depo?.setItem(OTURUM_ANAHTARI, ozet); } catch { /* depo kapalı: sayfalar anonim anahtarla sürer */ }
}

export function isaretKaldir(depo: Depo | null | undefined): void {
  try { depo?.removeItem?.(OTURUM_ANAHTARI); } catch { /* depo kapalı */ }
}

/** İlerlemenin okunup yazılacağı cihaz anahtarı: girişliyse kullanıcının, değilse anonim anahtar (`cihaz.ts` `oku/yaz` ile). */
export function etkinAnahtar(depo: Depo | null | undefined): string {
  const ozet = oturumOzeti(depo);
  return ozet ? kullaniciAnahtari(ozet) : ANAHTAR;
}

/** `window.localStorage`; erişim engelliyse (gizli kip, site verisi kapalı) `null`. */
export function tarayiciDeposu(): Depo | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
