/**
 * Abonelikten çıkış bağlantısı imzası (Dilim 2): token = `<uid>.<bitisMs>.<HMAC-SHA256 base64url>`. Sır koda girmez; çağıran
 * Functions secret'ından verir. Yalnız Node (functions + testler); tarayıcı paketine girmez.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Bağlantı geçerlilik süresi: e-posta geç açılabilir; yine de sonsuz değil. */
export const BAGLANTI_OMRU_MS = 180 * 24 * 3_600_000;
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const MAC = /^[A-Za-z0-9_-]{43}$/;
const SIRRI_ENAZ = 16;

const mac = (sirr: string, uid: string, bitis: number) => createHmac('sha256', sirr).update(`abonelik.v1.${uid}.${bitis}`).digest('base64url');
function sirriDenetle(sirr: string) {
  if (typeof sirr !== 'string' || sirr.length < SIRRI_ENAZ) throw new Error('abonelik-sirri-eksik');
}

export function tokenUret(uid: string, sirr: string, simdi: number, omur = BAGLANTI_OMRU_MS): string {
  sirriDenetle(sirr);
  if (!UID.test(uid)) throw new RangeError('uid biçimi geçersiz');
  const bitis = Math.floor(simdi + omur);
  return `${uid}.${bitis}.${mac(sirr, uid, bitis)}`;
}

export type TokenSonucu = { readonly ok: true; readonly uid: string } | { readonly ok: false; readonly neden: 'bicim' | 'imza' | 'suresi-doldu' };

export function tokenDogrula(token: unknown, sirr: string, simdi: number): TokenSonucu {
  sirriDenetle(sirr);
  const p = typeof token === 'string' && token.length <= 256 ? token.split('.') : [];
  if (p.length !== 3 || !UID.test(p[0]) || !/^\d{1,15}$/.test(p[1]) || !MAC.test(p[2])) return { ok: false, neden: 'bicim' };
  const bitis = Number(p[1]);
  const beklenen = Buffer.from(mac(sirr, p[0], bitis)), gelen = Buffer.from(p[2]);
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return { ok: false, neden: 'imza' };
  if (bitis <= simdi) return { ok: false, neden: 'suresi-doldu' };
  return { ok: true, uid: p[0] };
}
