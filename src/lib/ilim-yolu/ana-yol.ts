/**
 * İlim Yolu ana sayfası (giriş yapmış görünümü, 11 Kasım 2026): «Bugün», «Kaldığınız yer», «Yolunuz» ve «Yollarınız» kartları için saf mantık.
 * Girdi yalnız cihazdaki bilgi kartı ilerlemesidir (bilgi-ilerleme.ts) ve «son çalışılan kart» işareti; ağ ve yeni Firestore belgesi yoktur.
 *
 * SON İŞARET. Kart ilerlemesi sıkıştırılmış bit dizisidir, zaman damgası taşımaz; «en son hangi yolda çalıştı» sorusu için cihazda ayrıca TEK
 * kayıt tutulur: `{id, ms}` (son işaretlenen kartın kimliği ve zamanı). Yalnız bu cihazdadır, buluta gitmez, kimliği kart kimliğidir
 * (`ku-001` gibi). Başka cihazdan eşitlenen ilerlemede işaret yoksa ilerlemesi olan ilk yol seçilir.
 * GİZLİLİK: «Yeni Müslüman yolu» (`ilim:y12:v1`, `ozel/yol12`) bu modülün hiçbir girdisinde yoktur ve ana sayfaya hiçbir iz taşımaz.
 */
import type { Depo } from '../ezber/cihaz';
import { konum, ogrenildi, type BilgiIlerleme } from './bilgi-ilerleme';

export const SON_ANAHTAR = 'ulucamii:bilgi:son:v1';
const UID_OZETI = /^[a-z0-9]{8,64}$/;

/** Girişli kullanıcının son işareti anahtarı (ham uid yazılmaz; özet hesap/isaret.ts'ten gelir). */
export function sonKullaniciAnahtari(uidOzeti: string): string {
  if (typeof uidOzeti !== 'string' || !UID_OZETI.test(uidOzeti)) throw new TypeError('uid özeti [a-z0-9]{8,64} olmalı');
  return `${SON_ANAHTAR}:u:${uidOzeti}`;
}

export interface SonKayit { readonly id: string; readonly ms: number }

export function sonOku(depo: Depo | null | undefined, anahtar: string = SON_ANAHTAR): SonKayit | null {
  try {
    const ham = depo?.getItem(anahtar);
    if (!ham) return null;
    const x = JSON.parse(ham) as { id?: unknown; ms?: unknown };
    return typeof x.id === 'string' && konum(x.id) && typeof x.ms === 'number' && Number.isFinite(x.ms) && x.ms > 0 ? { id: x.id, ms: x.ms } : null;
  } catch {
    return null;
  }
}

export function sonYaz(depo: Depo | null | undefined, id: string, ms: number, anahtar: string = SON_ANAHTAR): boolean {
  try {
    if (!depo || !konum(id) || !Number.isFinite(ms) || ms <= 0) return false;
    depo.setItem(anahtar, JSON.stringify({ id, ms: Math.trunc(ms) }));
    return true;
  } catch {
    return false;
  }
}

export interface AnaYol { readonly id: string; readonly idler: readonly string[] }
export interface YolDurumu {
  readonly id: string;
  readonly ogrenilen: number;
  readonly toplam: number;
  readonly tamam: boolean;
  /** Yolun sırasındaki ilk öğrenilmemiş kart; yol bitmişse `null`. */
  readonly sonraki: string | null;
}

export function yolDurumlari(il: BilgiIlerleme, yollar: readonly AnaYol[]): YolDurumu[] {
  return yollar.map((y) => {
    const ogrenilen = y.idler.filter((id) => ogrenildi(il, id)).length;
    return { id: y.id, ogrenilen, toplam: y.idler.length, tamam: y.idler.length > 0 && ogrenilen === y.idler.length, sonraki: y.idler.find((id) => !ogrenildi(il, id)) ?? null };
  });
}

/** Kazanılan rozet sayısı: tamamlanan kart yolları + (Ezber Kilimi'ndeki bilgi maddeleri yolu tamamsa) 1. */
export const rozetSayisi = (durumlar: readonly YolDurumu[], bilgiYoluTamam: boolean): number => durumlar.filter((d) => d.tamam).length + (bilgiYoluTamam ? 1 : 0);

/** En son çalışılan plan yolu: işaretin yolu (ilerlemesi varsa) → ilerlemesi olan ilk bitmemiş yol → ilerlemesi olan ilk yol; yoksa `null`. */
export function sonYol(planDurumlari: readonly YolDurumu[], son: SonKayit | null): YolDurumu | null {
  const k = son ? konum(son.id) : null;
  const isaretli = k ? planDurumlari.find((d) => d.id === `plan-${k.kod}` && d.ogrenilen > 0) : undefined;
  if (isaretli) return isaretli;
  const baslayan = planDurumlari.filter((d) => d.ogrenilen > 0);
  return baslayan.find((d) => !d.tamam) ?? baslayan[0] ?? null;
}

export type SonCalisilan = { tur: 'ezber' } | { tur: 'kart'; yol: YolDurumu; son: SonKayit | null };

/** Ezber (son çalışılan maddenin zamanı) ile kart yolları arasında hangisi daha yeni; hiçbiri başlamadıysa `null`. */
export function sonCalisilan(planDurumlari: readonly YolDurumu[], son: SonKayit | null, ezberMs: number): SonCalisilan | null {
  const yol = sonYol(planDurumlari, son);
  const k = son ? konum(son.id) : null;
  // İşaret yalnız kendi yolundaysa geçerlidir (o yolda ilerleme kalmadıysa, ör. başka hesaba geçildiyse, işaret yok sayılır).
  const gecerli = yol && son && k && yol.id === `plan-${k.kod}` ? son : null;
  if (yol && gecerli && gecerli.ms > ezberMs) return { tur: 'kart', yol, son: gecerli };
  if (ezberMs > 0) return { tur: 'ezber' };
  return yol ? { tur: 'kart', yol, son: gecerli } : null;
}
