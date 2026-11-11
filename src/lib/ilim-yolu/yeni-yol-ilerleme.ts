/**
 * İlim Yolu 12 haftalık yol ilerlemesi (11 Kasım 2026). Saf ve ağsız: depo bir parametredir. Düzen `ibadet-ilerleme.ts` ile aynıdır.
 *
 * NE TUTULUR. Yalnız hafta başına dört işaret: iki sorunun doğru cevaplandığı, uygulamanın yapıldığı, haftanın tamamlandığı. Ad, e-posta, cevap
 * metni, zaman, sayaç YOKTUR. Belge adı yolun kendisinden başka bir şey söylemez (`ozel/yol12`).
 *
 * SIKIŞTIRILMIŞ KODLAMA. `maddeler` en çok 12 anahtar (h01…h12) taşır; her biri küçük bir dizedir: dizenin `n`. karakteri `SLOTLAR[n]`
 * çalışmasının durumudur ('0'…'3'; bit 1 = tamam, bit 2 = ilk denemede doğru / hatasız). Bitler tek yönlüdür (geri alınmaz) ve birleştirme bit
 * düzeyinde VEYA'dır: iki cihaz hiçbir işareti ezemez, işlem değişmez (idempotent), zaman damgası gerekmez.
 *
 * NEREDE. Cihazda `localStorage` (anonim anahtar ya da girişliyse kullanıcının özetli anahtarı); girişliyse ayrıca `kullanicilar/{uid}/ozel/yol12`
 * (YALNIZ sahibi okur ve yazar; hoca, haftalık e-posta, veli ve rapor görünümleri bu belgeye hiç uzanmaz: `firestore.rules`).
 */
import type { Depo } from '../ezber/cihaz';

export const ANAHTAR = 'ulucamii:yeniyol:cihaz:v1';
/** `kullanicilar/{uid}/ozel/{BELGE}` (calisma/ değil: calisma listesi kursun hocasına açıktır). */
export const BELGE = 'yol12';
export const TAMAM = 1;
export const HATASIZ = 2;
export const HAFTALAR = ['h01', 'h02', 'h03', 'h04', 'h05', 'h06', 'h07', 'h08', 'h09', 'h10', 'h11', 'h12'] as const;
export type Hafta = (typeof HAFTALAR)[number];
export const SLOTLAR = ['s1', 's2', 'yap', 'tamam'] as const;
export type Slot = (typeof SLOTLAR)[number];
export const AZAMI_UZUNLUK = SLOTLAR.length;
const UID_OZETI = /^[a-z0-9]{8,64}$/;

export interface YolIlerleme {
  readonly v: 1;
  /** Hafta → durum dizesi (boş dizeler tutulmaz). */
  readonly maddeler: Readonly<Partial<Record<Hafta, string>>>;
}

export const bos = (): YolIlerleme => ({ v: 1, maddeler: {} });
export const haftaMi = (k: unknown): k is Hafta => typeof k === 'string' && (HAFTALAR as readonly string[]).includes(k);

const harf = (dize: string, sira: number): number => {
  const n = dize.charCodeAt(sira) - 48;
  return n >= 0 && n <= 3 ? n : 0;
};

/** Bir çalışmanın durumu: 0 yok · 1 tamam · 3 ilk denemede tamam (2 tek başına görülmez). */
export function durum(il: YolIlerleme, hafta: Hafta, slot: Slot): number {
  const i = SLOTLAR.indexOf(slot);
  return i < 0 ? 0 : harf(il.maddeler[hafta] ?? '', i);
}

/** Çalışmanın durumuna `bit`leri ekler (yeni nesne döner; geçersiz hafta/slot durumu değiştirmez). */
export function isaretle(il: YolIlerleme, hafta: Hafta, slot: Slot, bit: number): YolIlerleme {
  const i = SLOTLAR.indexOf(slot);
  if (!haftaMi(hafta) || i < 0) return il;
  const eski = il.maddeler[hafta] ?? '';
  const yeni = (harf(eski, i) | (bit & 3)) & 3;
  const dizi = (eski + '0'.repeat(Math.max(0, i + 1 - eski.length))).split('');
  dizi[i] = String(yeni);
  return { v: 1, maddeler: { ...il.maddeler, [hafta]: dizi.join('') } };
}

/** Bilinmeyen kaynaktan güvenli durum kurar: yalnız on iki hafta, yalnız '0'…'3', uzunluk sınırlı, boşlar atılır. */
export function temizle(ham: unknown): YolIlerleme {
  if (typeof ham !== 'object' || ham === null || Array.isArray(ham)) return bos();
  const m = (ham as { maddeler?: unknown }).maddeler;
  if (typeof m !== 'object' || m === null || Array.isArray(m)) return bos();
  const cikti: Partial<Record<Hafta, string>> = {};
  for (const hafta of HAFTALAR) {
    const d = (m as Record<string, unknown>)[hafta];
    if (typeof d !== 'string') continue;
    const dize = d.slice(0, AZAMI_UZUNLUK).replace(/[^0-3]/g, '0').replace(/0+$/, '');
    if (dize) cikti[hafta] = dize;
  }
  return { v: 1, maddeler: cikti };
}

/** İki durumu bit düzeyinde VEYA ile birleştirir (değişme ve idempotent). */
export function birlestir(a: unknown, b: unknown): YolIlerleme {
  const x = temizle(a);
  const y = temizle(b);
  const cikti: Partial<Record<Hafta, string>> = {};
  for (const hafta of HAFTALAR) {
    const p = x.maddeler[hafta] ?? '';
    const q = y.maddeler[hafta] ?? '';
    const n = Math.max(p.length, q.length);
    let s = '';
    for (let i = 0; i < n; i++) s += String(harf(p, i) | harf(q, i));
    if (s) cikti[hafta] = s;
  }
  return { v: 1, maddeler: cikti };
}

export const ayniMi = (a: YolIlerleme, b: YolIlerleme): boolean => HAFTALAR.every((k) => (a.maddeler[k] ?? '') === (b.maddeler[k] ?? ''));

/** Girişli kullanıcının cihaz kopyasının anahtarı (ham uid yazılmaz; özet hesap/isaret.ts'ten gelir). */
export function kullaniciAnahtari(uidOzeti: string): string {
  if (typeof uidOzeti !== 'string' || !UID_OZETI.test(uidOzeti)) throw new TypeError('uid özeti [a-z0-9]{8,64} olmalı');
  return `${ANAHTAR}:u:${uidOzeti}`;
}

export function oku(depo: Depo | null | undefined, anahtar: string = ANAHTAR): YolIlerleme {
  try {
    const ham = depo?.getItem(anahtar);
    return ham ? temizle(JSON.parse(ham)) : bos();
  } catch {
    return bos();
  }
}

export function yaz(depo: Depo | null | undefined, il: YolIlerleme, anahtar: string = ANAHTAR): boolean {
  try {
    if (!depo) return false;
    depo.setItem(anahtar, JSON.stringify(temizle(il)));
    return true;
  } catch {
    return false;
  }
}

/** Buluta giden yük: YALNIZ kuralın izin verdiği alanlar (`v, maddeler, guncelleme`). */
export const bulutYuku = (il: YolIlerleme, guncelleme: unknown) => ({ v: 1, maddeler: { ...temizle(il).maddeler }, guncelleme });

/** Haftanın tamamlanıp tamamlanmadığı ve kaç soruyu doğru bildiği. */
export function haftaDurumu(il: YolIlerleme, hafta: Hafta): { tamam: boolean; dogru: number; yapildi: boolean } {
  return {
    tamam: (durum(il, hafta, 'tamam') & TAMAM) !== 0,
    dogru: (['s1', 's2'] as const).filter((s) => (durum(il, hafta, s) & TAMAM) !== 0).length,
    yapildi: (durum(il, hafta, 'yap') & TAMAM) !== 0,
  };
}

export const tamamlananHafta = (il: YolIlerleme): number => HAFTALAR.filter((h) => haftaDurumu(il, h).tamam).length;
