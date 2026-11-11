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

/** Cihaz anahtarı. Adı bilerek yolu söylemez (ortak cihazda depoya bakan kişi konuyu görmesin); ilk sürümün adı `ESKI_ANAHTAR`dı. */
export const ANAHTAR = 'ilim:y12:v1';
export const ESKI_ANAHTAR = 'ulucamii:yeniyol:cihaz:v1';
/** Yeni cihaz anahtarının eski adı (`ANAHTAR` ya da `ANAHTAR:u:<özet>`); `oku` bir kez okuyup taşır ve siler. */
export const eskiAnahtar = (anahtar: string): string => ESKI_ANAHTAR + anahtar.slice(ANAHTAR.length);
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
    let ham = depo?.getItem(anahtar);
    if (!ham && anahtar.startsWith(ANAHTAR)) {
      const eski = eskiAnahtar(anahtar);
      ham = depo?.getItem(eski);
      if (ham) {
        // Bir kereye mahsus taşıma: yeni adla yaz, ancak yazılabildiyse eskiyi sil.
        const t = temizle(JSON.parse(ham));
        if (yaz(depo, t, anahtar)) depo?.removeItem?.(eski);
        return t;
      }
    }
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

/** `anonim`deki işaretlerden hesapta henüz bulunmayan çalışma-bit sayısı (birleştirmenin hesaba gerçekten katacağı şey; 0 = teklif edilecek bir şey yok). */
export function eklenecekSayisi(anonim: YolIlerleme, hesap: YolIlerleme): number {
  let n = 0;
  for (const h of HAFTALAR) {
    const a = anonim.maddeler[h] ?? '';
    const b = hesap.maddeler[h] ?? '';
    for (let i = 0; i < AZAMI_UZUNLUK; i++) if ((harf(a, i) & ~harf(b, i)) !== 0) n++;
  }
  return n;
}

/**
 * Hesap başına küçük cihaz durumu (`ilim:y12:d:v1:u:<özet>`): YALNIZ iki sayı/bayrak, işaret içermez.
 *  - `s`: «Şimdi değil» denildiğinde teklif edilen sayı; sayı bundan fazlaysa teklif yeniden çıkar (aynı sayıda tekrar sorulmaz).
 *  - `sil`: «İşaretlerimi silin» cihazda yapıldı ama hesaptaki belge henüz silinemedi; sonraki eşitleme önce belgeyi siler, birleştirmez
 *    (yoksa bulut kopyası cihaza geri yazılırdı).
 */
export interface YolDurum { readonly s?: number; readonly sil?: true }
export function durumAnahtari(uidOzeti: string): string {
  return kullaniciAnahtari(uidOzeti).replace(`${ANAHTAR}:u:`, 'ilim:y12:d:v1:u:');
}
export function durumOku(depo: Depo | null | undefined, anahtar: string): YolDurum {
  try {
    const ham = depo?.getItem(anahtar);
    const o = ham ? (JSON.parse(ham) as { s?: unknown; sil?: unknown }) : {};
    return { ...(Number.isInteger(o.s) && (o.s as number) > 0 ? { s: o.s as number } : {}), ...(o.sil === true ? { sil: true as const } : {}) };
  } catch {
    return {};
  }
}
export function durumYaz(depo: Depo | null | undefined, anahtar: string, d: YolDurum): boolean {
  try {
    if (!depo) return false;
    if (d.s === undefined && !d.sil) depo.removeItem?.(anahtar);
    else depo.setItem(anahtar, JSON.stringify({ ...(d.s ? { s: d.s } : {}), ...(d.sil ? { sil: true } : {}) }));
    return true;
  } catch {
    return false;
  }
}
