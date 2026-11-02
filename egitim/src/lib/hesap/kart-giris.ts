/**
 * Çocuk girişi (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Ortak kararlar» 4): basılı kare kodlu kart ve hocanın verdiği kullanıcı
 * adı + kısa şifre. İki yol da sunucudan custom token alır (`/api/kart-giris`, `/api/cocuk-giris`; functions/src/cocuk.ts) ve
 * `signInWithCustomToken` ile girer; sonra oturum işareti konur.
 *
 * Kart adresi `https://egitim.ulucamii.be/k/#<kartId>.<sır>`: sır yalnız fragment'tedir (sunucuya, günlüğe, Referer'a gitmez).
 * `adrestenKartAl` sırrı HEMEN, her şeyden önce adresten siler (`history.replaceState`): geçmişte, yer iminde, paylaşılan adreste
 * kalmaz. Sır yalnız bu çağrının belleğinde yaşar; depoya ve konsola yazılmaz.
 *
 * Yanıtlar koda çevrilir: 401 → `yanlis` (kart iptal/yanlış, şifre yanlış), 429 → `kilit` (+ `bitis`, ISO), 4xx → `gecersiz`,
 * ağ hatası → `ag`, kalan → `sunucu`.
 */
import type { Depo } from '@ortak/lib/ezber/cihaz';
import type { IlimFirebase, GirisUcu } from '../firebase-istemci';
import { isaretKoy, tarayiciDeposu, uidOzeti } from './isaret';

/** Sunucuyla aynı biçimler (functions/src/cocuk.ts KART_ID, KART_SIR): 72 bit + 128 bit base64url. */
const KART_ID = /^[A-Za-z0-9_-]{12}$/;
const KART_SIR = /^[A-Za-z0-9_-]{22}$/;

export interface Kart {
  readonly kartId: string;
  readonly sir: string;
}
export type CocukGirisNedeni = 'yanlis' | 'kilit' | 'gecersiz' | 'ag' | 'sunucu';
export type CocukGirisSonucu =
  | { readonly ok: true; readonly uid: string }
  | { readonly ok: false; readonly neden: CocukGirisNedeni; readonly bitis?: string };
type Getir = (adres: string, istek: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/** `#<kartId>.<sır>` (baştaki # isteğe bağlı) → kart; biçim tutmazsa `null`. */
export function kartAyristir(hash: string): Kart | null {
  const parca = String(hash ?? '').replace(/^#/, '').split('.');
  if (parca.length !== 2) return null;
  const [kartId, sir] = parca;
  return KART_ID.test(kartId) && KART_SIR.test(sir) ? { kartId, sir } : null;
}

/**
 * Adresteki kartı okur ve fragment'i (geçerli olsun olmasın) adresten HEMEN siler. Fragment yoksa `null`, hiçbir şey değişmez.
 */
export function adrestenKartAl(
  konum: Pick<Location, 'hash' | 'pathname' | 'search'> = location,
  gecmis: Pick<History, 'replaceState' | 'state'> = history,
): Kart | null {
  const hash = konum.hash;
  if (!hash) return null;
  gecmis.replaceState(gecmis.state, '', `${konum.pathname}${konum.search}`);
  return kartAyristir(hash);
}

/** Giriş ucunun yanıtı → neden (yalnız başarısız yanıtlar için). */
export function yanitNedeni(durum: number, govde: unknown): { readonly neden: CocukGirisNedeni; readonly bitis?: string } {
  if (durum === 401) return { neden: 'yanlis' };
  if (durum === 429) {
    const bitis = (govde as { bitis?: unknown } | null)?.bitis;
    return typeof bitis === 'string' && !Number.isNaN(Date.parse(bitis)) ? { neden: 'kilit', bitis } : { neden: 'kilit' };
  }
  if (durum >= 400 && durum < 500) return { neden: 'gecersiz' };
  return { neden: 'sunucu' };
}

async function tokenleGir(
  f: IlimFirebase, uc: GirisUcu, govde: Record<string, string>, o: { depo?: Depo | null; getir?: Getir },
): Promise<CocukGirisSonucu> {
  const getir: Getir = o.getir ?? ((a, i) => fetch(a, i));
  let yanit: Awaited<ReturnType<Getir>>;
  try {
    yanit = await getir(f.api(uc), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde),
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
    });
  } catch {
    return { ok: false, neden: 'ag' };
  }
  const j: unknown = await yanit.json().catch(() => null);
  const token = (j as { token?: unknown } | null)?.token;
  if (!yanit.ok || typeof token !== 'string' || !token) return { ok: false, ...(yanit.ok ? { neden: 'sunucu' as const } : yanitNedeni(yanit.status, j)) };
  try {
    const k = await f.a.signInWithCustomToken(f.auth, token);
    isaretKoy(o.depo === undefined ? tarayiciDeposu() : o.depo, await uidOzeti(k.user.uid));
    return { ok: true, uid: k.user.uid };
  } catch (e) {
    return { ok: false, neden: (e as { code?: unknown } | null)?.code === 'auth/network-request-failed' ? 'ag' : 'sunucu' };
  }
}

/** Kartla giriş (kart `adrestenKartAl` ile alınmış olmalı: adres önce temizlenir). */
export function kartlaGir(f: IlimFirebase, kart: Kart, o: { depo?: Depo | null; getir?: Getir } = {}): Promise<CocukGirisSonucu> {
  return tokenleGir(f, 'kart-giris', { kartId: kart.kartId, sir: kart.sir }, o);
}

/** Kullanıcı adı + şifre (hocanın verdiği). Büyük/küçük harf, boşluk ve tire sunucuda önemsizdir. */
export function cocukGir(
  f: IlimFirebase, g: { kullaniciAdi: string; sifre: string }, o: { depo?: Depo | null; getir?: Getir } = {},
): Promise<CocukGirisSonucu> {
  const kullaniciAdi = String(g.kullaniciAdi ?? '').trim();
  const sifre = String(g.sifre ?? '');
  if (!kullaniciAdi || !sifre.trim() || kullaniciAdi.length > 64 || sifre.length > 64) return Promise.resolve({ ok: false, neden: 'gecersiz' });
  return tokenleGir(f, 'cocuk-giris', { kullaniciAdi, sifre }, o);
}
