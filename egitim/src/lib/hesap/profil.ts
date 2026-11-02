/**
 * İlim Yolu profili (Dilim 1, 2 Kasım 2026; docs/ILIM-YOLU.md «Kayıt akışı», «Veri modeli»; kurallar firebase/firestore.rules
 * «İlim Yolu — hesaplar»).
 *
 * `kullanicilar/{uid}`: istemci YALNIZ `dil, sehir, cami, tercihler, sonGiris` yazar (birleştirerek; boş şehir/cami alanı silinir).
 * `ad` (kullanıcı adı), `tur`, `ref`, `olusturma`, `silinecek` yalnız sunucuda yazılır: ad `kullaniciAdiAl`, kurs bağı `hesabiBagla`,
 * silme `hesabimiSil` / `hesapSilmeIptal` (callable'lar, functions/src).
 *
 * «Yeni Müslümanım» (isteğe bağlı, GVKT md. 9 açık rıza): yalnız `kullanicilar/{uid}/ozel/hassas` = `{muhtedi: true, riza: {zaman:
 * sunucu zamanı, metinSurum}}`. Auth'a, token'a, profile, depoya ya da konsola girmez; geri almak belgeyi siler.
 *
 * Callable hataları koda çevrilir (`CagriHatasi`): `neden` sunucunun iletisi (`gecersiz-ad`, `ad-alinmis`, `ad-degisikligi-sinirli`,
 * `gecersiz-kod`, `baska-kayit`, `eposta-dogrulanmamis`, `yetki-yok` …) ya da `ag` / `oturum-yok` / `bilinmeyen`; `alt` ayrıntı
 * (`kisa`, `ayrilmis`, `kullanildi`, `suresi-doldu` …), `sonraki` ad değişikliğinin açılacağı an (ISO).
 */
import type { Depo } from '@ortak/lib/ezber/cihaz';
import { gecerliMi } from '@ortak/lib/ilim-yolu/kullanici-adi';
import type { IlimFirebase } from '../firebase-istemci';
import { tarayiciDeposu, uidOzeti } from './isaret';

/** Kuraldaki dil listesi (profilGecerli). */
export const DILLER = ['tr', 'fr', 'en', 'nl', 'de'] as const;
export type ProfilDili = (typeof DILLER)[number];
export const METIN_SINIRI = 80;
export type HesapTuru = 'genel' | 'cocuk' | 'kursYetiskin';
export interface Tercihler {
  /** Haftalık e-posta isteniyor mu. */
  readonly haftalik?: boolean;
  /** 0 Pazar … 6 Cumartesi. */
  readonly gun?: number;
  /** 0–23. */
  readonly saat?: number;
}
export interface Profil {
  /** Kullanıcı adı (`@ad`); henüz alınmadıysa boş: sayfa zorunlu ad adımını gösterir. */
  readonly ad: string;
  readonly dil: ProfilDili | '';
  readonly tur: HesapTuru | '';
  readonly ref: string;
  readonly sehir: string;
  readonly cami: string;
  readonly tercihler: Tercihler;
  /** Silme bekliyorsa kalıcı silinme anı (ISO); yoksa boş. */
  readonly silinecek: string;
}
export type ProfilDegisikligi = {
  readonly dil?: ProfilDili;
  /** Boş dize ya da `null`: alan silinir. */
  readonly sehir?: string | null;
  readonly cami?: string | null;
  /** Verilen alt alanlar birleşir; `null`: tercihler silinir. */
  readonly tercihler?: Tercihler | null;
};
export type CagriHatasi = { readonly ok: false; readonly neden: string; readonly alt?: string; readonly sonraki?: string };
type Basari<T = object> = { readonly ok: true } & T;

const dilMi = (x: unknown): x is ProfilDili => typeof x === 'string' && (DILLER as readonly string[]).includes(x);
const tamsayi = (x: unknown, enaz: number, encok: number): x is number => Number.isInteger(x) && (x as number) >= enaz && (x as number) <= encok;
const kayit = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const iso = (z: unknown): string => {
  const ms = typeof (z as { toMillis?: unknown } | null)?.toMillis === 'function' ? (z as { toMillis(): number }).toMillis() : NaN;
  return Number.isFinite(ms) ? new Date(ms).toISOString() : '';
};
const oturumUid = (f: IlimFirebase): string | null => f.auth.currentUser?.uid ?? null;
const profilRef = (f: IlimFirebase, uid: string) => f.fs.doc(f.db, 'kullanicilar', uid);
const hassasRef = (f: IlimFirebase, uid: string) => f.fs.doc(f.db, 'kullanicilar', uid, 'ozel', 'hassas');
const OTURUM_YOK: CagriHatasi = { ok: false, neden: 'oturum-yok' };

/** Tercihler biçim denetimi (kuralla aynı); geçersiz alt alan `null` döndürür. */
function tercihTemizle(t: unknown): Tercihler | null {
  if (!kayit(t) || Object.keys(t).some((k) => !['haftalik', 'gun', 'saat'].includes(k))) return null;
  if ('haftalik' in t && typeof t.haftalik !== 'boolean') return null;
  if ('gun' in t && !tamsayi(t.gun, 0, 6)) return null;
  if ('saat' in t && !tamsayi(t.saat, 0, 23)) return null;
  return { ...t } as Tercihler;
}

/** Firestore'dan gelen profil belgesi → güvenli biçim (bilinmeyen ve bozuk alanlar boş). */
export function profilOku(veri: unknown): Profil {
  const d = kayit(veri) ? veri : {};
  const metin = (x: unknown) => (typeof x === 'string' ? x.slice(0, METIN_SINIRI) : '');
  return {
    ad: typeof d.ad === 'string' && gecerliMi(d.ad).ok ? d.ad : '',
    dil: dilMi(d.dil) ? d.dil : '',
    tur: d.tur === 'genel' || d.tur === 'cocuk' || d.tur === 'kursYetiskin' ? d.tur : '',
    ref: typeof d.ref === 'string' ? d.ref : '',
    sehir: metin(d.sehir),
    cami: metin(d.cami),
    tercihler: tercihTemizle(d.tercihler) ?? {},
    silinecek: iso(d.silinecek),
  };
}

/**
 * Profil değişikliği → Firestore yükü (`setDoc(…, {merge: true})` için). Yalnız izinli alanlar; boş/`null` şehir, cami ve
 * tercihler `sil` (deleteField) ile kalkar. Geçersiz değer `TypeError` fırlatır (sayfa formu zaten süzmüş olmalı).
 */
export function profilYuku(d: ProfilDegisikligi, sil: unknown): Record<string, unknown> {
  const yuk: Record<string, unknown> = {};
  if (d.dil !== undefined) {
    if (!dilMi(d.dil)) throw new TypeError('dil tr|fr|en|nl|de olmalı');
    yuk.dil = d.dil;
  }
  for (const alan of ['sehir', 'cami'] as const) {
    const v = d[alan];
    if (v === undefined) continue;
    const t = typeof v === 'string' ? v.trim() : v === null ? '' : undefined;
    if (t === undefined || t.length > METIN_SINIRI) throw new TypeError(`${alan} en çok ${METIN_SINIRI} karakter olmalı`);
    yuk[alan] = t || sil;
  }
  if (d.tercihler !== undefined) {
    if (d.tercihler === null) yuk.tercihler = sil;
    else {
      const t = tercihTemizle(d.tercihler);
      if (!t) throw new TypeError('tercihler {haftalik: bool, gun: 0–6, saat: 0–23} olmalı');
      yuk.tercihler = t;
    }
  }
  return yuk;
}

/** Kendi profilin; belge yoksa `null` (kullanıcı adı adımı henüz yapılmadı). */
export async function profilGetir(f: IlimFirebase): Promise<Profil | null> {
  const uid = oturumUid(f);
  if (!uid) return null;
  const s = await f.fs.getDoc(profilRef(f, uid));
  return s.exists() ? profilOku(s.data()) : null;
}

/** Profilin izinli alanlarını yazar (belge yoksa açar). */
export async function profilYaz(f: IlimFirebase, d: ProfilDegisikligi): Promise<Basari | CagriHatasi> {
  const uid = oturumUid(f);
  if (!uid) return OTURUM_YOK;
  const yuk = profilYuku(d, f.fs.deleteField());
  if (!Object.keys(yuk).length) return { ok: true };
  try {
    await f.fs.setDoc(profilRef(f, uid), yuk, { merge: true });
    return { ok: true };
  } catch (e) {
    return firestoreHatasi(e);
  }
}

export const SON_GIRIS_ANAHTARI = 'ilimYolu:sonGiris';
/**
 * `sonGiris` = sunucu zamanı (24 ay hareketsiz hesap taraması buna bakar; oturum aylarca açık kalabildiği için yalnız girişte
 * değil, her gün ilk açılışta). Cihaz başına günde en çok bir yazım: `ilimYolu:sonGiris` = `<uid özeti>:<gün>`. Yazdıysa `true`.
 */
export async function sonGirisYaz(f: IlimFirebase, o: { bugun: string; depo?: Depo | null }): Promise<boolean> {
  const uid = oturumUid(f);
  if (!uid) return false;
  const depo = o.depo === undefined ? tarayiciDeposu() : o.depo;
  const isaret = `${await uidOzeti(uid)}:${o.bugun}`;
  try { if (depo?.getItem(SON_GIRIS_ANAHTARI) === isaret) return false; } catch { /* depo kapalı: yine yaz */ }
  try {
    await f.fs.setDoc(profilRef(f, uid), { sonGiris: f.fs.serverTimestamp() }, { merge: true });
  } catch {
    return false;
  }
  try { depo?.setItem(SON_GIRIS_ANAHTARI, isaret); } catch { /* depo kapalı */ }
  return true;
}

/** Callable hatası → kod. */
export function cagriHatasi(e: unknown): CagriHatasi {
  const h = (e ?? {}) as { code?: unknown; message?: unknown; details?: unknown };
  const kod = String(h.code ?? '').replace(/^functions\//, '');
  if (kod === 'unavailable' || kod === 'deadline-exceeded' || kod === 'internal') return { ok: false, neden: 'ag' };
  if (kod === 'unauthenticated') return OTURUM_YOK;
  const mesaj = String(h.message ?? '');
  const ayrinti = kayit(h.details) ? h.details : {};
  if (/^[a-z][a-z-]{1,40}$/.test(mesaj) && mesaj !== kod) {
    return {
      ok: false,
      neden: mesaj,
      ...(typeof ayrinti.neden === 'string' ? { alt: ayrinti.neden } : {}),
      ...(typeof ayrinti.sonraki === 'string' ? { sonraki: ayrinti.sonraki } : {}),
    };
  }
  return { ok: false, neden: kod || 'bilinmeyen' };
}

/** Firestore hatası → kod (`yetki-yok`, `ag`, `bilinmeyen`). */
function firestoreHatasi(e: unknown): CagriHatasi {
  const kod = String((e as { code?: unknown } | null)?.code ?? '');
  if (kod === 'permission-denied') return { ok: false, neden: 'yetki-yok' };
  if (kod === 'unavailable' || kod === 'deadline-exceeded') return { ok: false, neden: 'ag' };
  if (kod === 'unauthenticated') return OTURUM_YOK;
  return { ok: false, neden: 'bilinmeyen' };
}

/** Kullanıcı adı al ya da değiştir (30 günde bir; sunucu normalleştirir ve ayrılmış adları reddeder). Biçim önce burada denetlenir. */
export async function kullaniciAdiAl(f: IlimFirebase, ad: string): Promise<Basari<{ readonly ad: string }> | CagriHatasi> {
  const b = gecerliMi(ad);
  if (!b.ok) return { ok: false, neden: 'gecersiz-ad', alt: b.neden };
  try {
    const s = await f.cagir<{ ad: string }>('kullaniciAdiAl', { ad: b.ad });
    return { ok: true, ad: s.ad };
  } catch (e) {
    return cagriHatasi(e);
  }
}

/** Hesap silme isteği: 30 gün sonra kalıcı (o zamana dek `hesapSilmeIptal` geri alır). */
export async function hesabimiSil(f: IlimFirebase): Promise<Basari<{ readonly silinecek: string }> | CagriHatasi> {
  try {
    return { ok: true, silinecek: (await f.cagir<{ silinecek: string }>('hesabimiSil')).silinecek };
  } catch (e) {
    return cagriHatasi(e);
  }
}

export async function hesapSilmeIptal(f: IlimFirebase): Promise<Basari | CagriHatasi> {
  try {
    await f.cagir('hesapSilmeIptal');
    return { ok: true };
  } catch (e) {
    return cagriHatasi(e);
  }
}

/**
 * Hocanın verdiği bağlama koduyla hesabı kurs kaydına bağlar (doğrulanmış e-posta gerekir). Sunucu token'a `ref` yetkisini
 * yazar; burada token zorla tazelenir, böylece öğretmen kaydı (`ezberDurum/{ref}`) hemen okunabilir.
 */
export async function hesabiBagla(f: IlimFirebase, kod: string): Promise<Basari<{ readonly ref: string }> | CagriHatasi> {
  try {
    const { ref } = await f.cagir<{ ref: string }>('hesabiBagla', { kod: String(kod ?? '') });
    await f.auth.currentUser?.getIdToken(true).catch(() => undefined);
    return { ok: true, ref };
  } catch (e) {
    return cagriHatasi(e);
  }
}

/** «Yeni Müslümanım» işareti var mı (yalnız sahibi okur). Okunamazsa `null`. */
export async function muhtediOku(f: IlimFirebase): Promise<boolean | null> {
  const uid = oturumUid(f);
  if (!uid) return null;
  try {
    const s = await f.fs.getDoc(hassasRef(f, uid));
    return s.exists() && s.data()?.muhtedi === true;
  } catch {
    return null;
  }
}

/** «Yeni Müslümanım» + açık rıza kaydı. `metinSurum`: kullanıcının onayladığı rıza metninin sürümü (1–40 karakter). */
export async function muhtediIsaretle(f: IlimFirebase, metinSurum: string): Promise<Basari | CagriHatasi> {
  const uid = oturumUid(f);
  if (!uid) return OTURUM_YOK;
  if (typeof metinSurum !== 'string' || metinSurum.length < 1 || metinSurum.length > 40) throw new TypeError('metinSurum 1–40 karakter olmalı');
  try {
    await f.fs.setDoc(hassasRef(f, uid), { muhtedi: true, riza: { zaman: f.fs.serverTimestamp(), metinSurum } });
    return { ok: true };
  } catch (e) {
    return firestoreHatasi(e);
  }
}

/** Rızayı geri alır: belge silinir (hiçbir iz kalmaz). */
export async function muhtediGeriAl(f: IlimFirebase): Promise<Basari | CagriHatasi> {
  const uid = oturumUid(f);
  if (!uid) return OTURUM_YOK;
  try {
    await f.fs.deleteDoc(hassasRef(f, uid));
    return { ok: true };
  } catch (e) {
    return firestoreHatasi(e);
  }
}
