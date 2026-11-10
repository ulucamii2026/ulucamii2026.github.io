/**
 * İlim Yolu «Abdest ve Namaz» ilerlemesi (10 Kasım 2026). Saf ve ağsız: depo bir parametredir. Düzen bilgi kartlarıyla (bilgi-ilerleme.ts) aynıdır.
 *
 * SIKIŞTIRILMIŞ KODLAMA. `kullanicilar/{uid}/calisma/ibadet` belgesinde `maddeler` en çok 7 anahtar taşır (abdest, namaz, beş vakit);
 * her anahtar küçük bir dizedir: dizenin `n`. karakteri o konudaki `n`. çalışmanın durumudur ('0'…'3'; bit 1 = tamamladı, bit 2 = hiç
 * yanılmadan tamamladı). Çalışma sırası SLOTLAR'dadır: ogren, sirala, eslestir, hukum, vakit. Bitler tek yönlüdür (geri alınmaz) ve
 * birleştirme bit düzeyinde VEYA'dır: iki cihaz hiçbir işareti ezemez, işlem değişmez (idempotent), zaman damgası gerekmez.
 * `firestore.rules` yalnız belge adını (`ibadet`) bilir; alan değerlerini denetlemez.
 */
import type { Depo } from '../ezber/cihaz';

export const ANAHTAR = 'ulucamii:ibadet:cihaz:v1';
/** `kullanicilar/{uid}/calisma/{ad}` */
export const CALISMA_BELGESI = 'ibadet';
export const TAMAM = 1;
export const HATASIZ = 2;
export const KONULAR = ['abdest', 'namaz', 'sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
export type Konu = (typeof KONULAR)[number];
export const SLOTLAR = ['ogren', 'sirala', 'eslestir', 'hukum', 'vakit'] as const;
export type Slot = (typeof SLOTLAR)[number];
/** Her konuda hangi çalışmalar vardır (konu tamam sayılması için hepsi `TAMAM` olmalıdır). */
export const KONU_SLOTLARI: Readonly<Record<Konu, readonly Slot[]>> = {
  abdest: ['ogren', 'sirala', 'eslestir', 'hukum'],
  namaz: ['ogren', 'sirala', 'eslestir', 'hukum', 'vakit'],
  sabah: ['ogren', 'sirala', 'hukum'],
  ogle: ['ogren', 'sirala', 'hukum'],
  ikindi: ['ogren', 'sirala', 'hukum'],
  aksam: ['ogren', 'sirala', 'hukum'],
  yatsi: ['ogren', 'sirala', 'hukum'],
};
export const AZAMI_UZUNLUK = SLOTLAR.length;
const UID_OZETI = /^[a-z0-9]{8,64}$/;

export interface IbadetIlerleme {
  readonly v: 1;
  /** Konu → durum dizesi (boş dizeler tutulmaz). */
  readonly maddeler: Readonly<Partial<Record<Konu, string>>>;
}

export const bos = (): IbadetIlerleme => ({ v: 1, maddeler: {} });
export const konuMu = (k: unknown): k is Konu => typeof k === 'string' && (KONULAR as readonly string[]).includes(k);

const harf = (dize: string, sira: number): number => {
  const n = dize.charCodeAt(sira) - 48;
  return n >= 0 && n <= 3 ? n : 0;
};

/** Bir çalışmanın durumu: 0 yok · 1 tamam · 3 hatasız tamam (2 tek başına görülmez). */
export function durum(il: IbadetIlerleme, konu: Konu, slot: Slot): number {
  const i = SLOTLAR.indexOf(slot);
  return i < 0 ? 0 : harf(il.maddeler[konu] ?? '', i);
}

/** Çalışmanın durumuna `bit`leri ekler (yeni nesne döner; geçersiz konu/slot durumu değiştirmez). */
export function isaretle(il: IbadetIlerleme, konu: Konu, slot: Slot, bit: number): IbadetIlerleme {
  const i = SLOTLAR.indexOf(slot);
  if (!konuMu(konu) || i < 0) return il;
  const eski = il.maddeler[konu] ?? '';
  const yeni = (harf(eski, i) | (bit & 3)) & 3;
  const dizi = (eski + '0'.repeat(Math.max(0, i + 1 - eski.length))).split('');
  dizi[i] = String(yeni);
  return { v: 1, maddeler: { ...il.maddeler, [konu]: dizi.join('') } };
}

/** Bilinmeyen kaynaktan güvenli durum kurar: yalnız yedi konu, yalnız '0'…'3', uzunluk sınırlı, boşlar atılır. */
export function temizle(ham: unknown): IbadetIlerleme {
  if (typeof ham !== 'object' || ham === null || Array.isArray(ham)) return bos();
  const m = (ham as { maddeler?: unknown }).maddeler;
  if (typeof m !== 'object' || m === null || Array.isArray(m)) return bos();
  const cikti: Partial<Record<Konu, string>> = {};
  for (const konu of KONULAR) {
    const d = (m as Record<string, unknown>)[konu];
    if (typeof d !== 'string') continue;
    const dize = d.slice(0, AZAMI_UZUNLUK).replace(/[^0-3]/g, '0').replace(/0+$/, '');
    if (dize) cikti[konu] = dize;
  }
  return { v: 1, maddeler: cikti };
}

/** İki durumu bit düzeyinde VEYA ile birleştirir (değişme ve idempotent). */
export function birlestir(a: unknown, b: unknown): IbadetIlerleme {
  const x = temizle(a);
  const y = temizle(b);
  const cikti: Partial<Record<Konu, string>> = {};
  for (const konu of KONULAR) {
    const p = x.maddeler[konu] ?? '';
    const q = y.maddeler[konu] ?? '';
    const n = Math.max(p.length, q.length);
    let s = '';
    for (let i = 0; i < n; i++) s += String(harf(p, i) | harf(q, i));
    if (s) cikti[konu] = s;
  }
  return { v: 1, maddeler: cikti };
}

export const ayniMi = (a: IbadetIlerleme, b: IbadetIlerleme): boolean => KONULAR.every((k) => (a.maddeler[k] ?? '') === (b.maddeler[k] ?? ''));

/** Girişli kullanıcının cihaz kopyasının anahtarı (ham uid yazılmaz; özet hesap/isaret.ts'ten gelir). */
export function kullaniciAnahtari(uidOzeti: string): string {
  if (typeof uidOzeti !== 'string' || !UID_OZETI.test(uidOzeti)) throw new TypeError('uid özeti [a-z0-9]{8,64} olmalı');
  return `${ANAHTAR}:u:${uidOzeti}`;
}

export function oku(depo: Depo | null | undefined, anahtar: string = ANAHTAR): IbadetIlerleme {
  try {
    const ham = depo?.getItem(anahtar);
    return ham ? temizle(JSON.parse(ham)) : bos();
  } catch {
    return bos();
  }
}

export function yaz(depo: Depo | null | undefined, il: IbadetIlerleme, anahtar: string = ANAHTAR): boolean {
  try {
    if (!depo) return false;
    depo.setItem(anahtar, JSON.stringify(temizle(il)));
    return true;
  } catch {
    return false;
  }
}

/** Buluta giden yük: YALNIZ kuralın izin verdiği alanlar (`v, maddeler, guncelleme`). */
export const bulutYuku = (il: IbadetIlerleme, guncelleme: unknown) => ({ v: 1, maddeler: { ...temizle(il).maddeler }, guncelleme });

/** Bir konunun kaç çalışması tamam ve hepsi tamam mı. */
export function konuSayimi(il: IbadetIlerleme, konu: Konu): { tamamlanan: number; toplam: number; tamam: boolean } {
  const slotlar = KONU_SLOTLARI[konu];
  const tamamlanan = slotlar.filter((s) => (durum(il, konu, s) & TAMAM) !== 0).length;
  return { tamamlanan, toplam: slotlar.length, tamam: tamamlanan === slotlar.length };
}

/** Hesaba gerçekten yeni bir şey katacak anonim çalışma sayısı (anonimde olup hesapta olmayan bitler taşıyan çalışmalar). */
export function eklenecekSayisi(anonim: unknown, hesap: unknown): number {
  const x = temizle(anonim);
  const y = temizle(hesap);
  let n = 0;
  for (const konu of KONULAR) {
    const p = x.maddeler[konu] ?? '';
    const q = y.maddeler[konu] ?? '';
    for (let i = 0; i < p.length; i++) if ((harf(p, i) & ~harf(q, i)) !== 0) n++;
  }
  return n;
}
