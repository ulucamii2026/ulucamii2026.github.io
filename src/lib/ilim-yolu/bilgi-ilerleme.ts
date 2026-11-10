/**
 * İlim Yolu bilgi kartları ilerlemesi (Dilim 2, 10 Kasım 2026; docs/ILIM-YOLU.md «Dilim 2»). Saf ve ağsız: depo bir parametredir.
 *
 * SIKIŞTIRILMIŞ KODLAMA. `kullanicilar/{uid}/calisma/bilgi` belgesinin kuralı en çok 120 `maddeler` anahtarına izin verir; 261 kartın
 * her biri için anahtar açılamaz. Bu yüzden kod başına (kuran, itikat, ibadet, siyer, ahlak) TEK dize tutulur: dizenin `n`. karakteri
 * `<ön ek>-<n>` kartının durumudur ('0'…'3'; bit 1 = öğrendim, bit 2 = mini sınavı doğru çözdü). Toplam en çok 5 anahtar, her biri
 * ≤ 400 karakter. Kuralın değerini denetlemediği alanlar kullanılır; `firestore.rules` değişmez (`v, maddeler, guncelleme` zaten izinli).
 * Bit işaretleri tek yönlüdür (geri alınmaz): birleştirme bit düzeyinde VEYA'dır; böylece iki cihaz hiçbir işareti ezemez, işlem
 * kendi kendine uygulanınca değişmez ve zaman damgası gerekmez.
 */
import type { Depo } from '../ezber/cihaz';
import type { PlanKodu } from './bilgi-kartlari';

export const ANAHTAR = 'ulucamii:bilgi:cihaz:v1';
/** `kullanicilar/{uid}/calisma/{ad}` */
export const CALISMA_BELGESI = 'bilgi';
export const OGRENDIM = 1;
export const SINAV = 2;
export const KODLAR: readonly PlanKodu[] = ['kuran', 'itikat', 'ibadet', 'siyer', 'ahlak'];
/** Bir koddaki en büyük kart numarası sınırı (dize uzunluğu). */
export const AZAMI_UZUNLUK = 400;
const KOD_ON_EK: Readonly<Record<string, PlanKodu>> = { ku: 'kuran', it: 'itikat', ib: 'ibadet', si: 'siyer', ah: 'ahlak' };
const KIMLIK = /^(ku|it|ib|si|ah)-(\d{3})$/;
const UID_OZETI = /^[a-z0-9]{8,64}$/;

export interface BilgiIlerleme {
  readonly v: 1;
  /** Kod → durum dizesi (boş dizeler tutulmaz). */
  readonly maddeler: Readonly<Partial<Record<PlanKodu, string>>>;
}

export const bos = (): BilgiIlerleme => ({ v: 1, maddeler: {} });

/** Kart kimliği → kod ve dizideki sıra (0 tabanlı); geçersiz kimlik `null`. */
export function konum(id: string): { kod: PlanKodu; sira: number } | null {
  const e = KIMLIK.exec(id);
  if (!e) return null;
  const sira = Number(e[2]) - 1;
  return sira >= 0 && sira < AZAMI_UZUNLUK ? { kod: KOD_ON_EK[e[1]], sira } : null;
}

const harf = (dize: string, sira: number): number => {
  const n = dize.charCodeAt(sira) - 48;
  return n >= 0 && n <= 3 ? n : 0;
};

/** Kartın durumu: 0 yok · 1 öğrendim · 2 yalnız sınav · 3 ikisi. */
export function kartDurumu(il: BilgiIlerleme, id: string): number {
  const k = konum(id);
  return k ? harf(il.maddeler[k.kod] ?? '', k.sira) : 0;
}
export const ogrenildi = (il: BilgiIlerleme, id: string): boolean => (kartDurumu(il, id) & OGRENDIM) !== 0;

/** Kartın durumuna `bit`leri ekler (yeni nesne döner; geçersiz kimlik durumu değiştirmez). */
export function isaretle(il: BilgiIlerleme, id: string, bit: number): BilgiIlerleme {
  const k = konum(id);
  if (!k) return il;
  const eski = il.maddeler[k.kod] ?? '';
  const yeniDeger = (harf(eski, k.sira) | (bit & 3)) & 3;
  const bosluk = Math.max(0, k.sira + 1 - eski.length);
  const dizi = (eski + '0'.repeat(bosluk)).split('');
  dizi[k.sira] = String(yeniDeger);
  return { v: 1, maddeler: { ...il.maddeler, [k.kod]: dizi.join('') } };
}

/** Bilinmeyen kaynaktan (depo, bulut) güvenli durum kurar: yalnız beş kod, yalnız '0'…'3', uzunluk sınırlı, boşlar atılır. */
export function temizle(ham: unknown): BilgiIlerleme {
  if (typeof ham !== 'object' || ham === null || Array.isArray(ham)) return bos();
  const m = (ham as { maddeler?: unknown }).maddeler;
  if (typeof m !== 'object' || m === null || Array.isArray(m)) return bos();
  const cikti: Partial<Record<PlanKodu, string>> = {};
  for (const kod of KODLAR) {
    const d = (m as Record<string, unknown>)[kod];
    if (typeof d !== 'string') continue;
    const dize = d.slice(0, AZAMI_UZUNLUK).replace(/[^0-3]/g, '0').replace(/0+$/, '');
    if (dize) cikti[kod] = dize;
  }
  return { v: 1, maddeler: cikti };
}

/** İki durumu bit düzeyinde VEYA ile birleştirir (değişme ve idempotent). */
export function birlestir(a: unknown, b: unknown): BilgiIlerleme {
  const x = temizle(a);
  const y = temizle(b);
  const cikti: Partial<Record<PlanKodu, string>> = {};
  for (const kod of KODLAR) {
    const p = x.maddeler[kod] ?? '';
    const q = y.maddeler[kod] ?? '';
    const n = Math.max(p.length, q.length);
    let s = '';
    for (let i = 0; i < n; i++) s += String(harf(p, i) | harf(q, i));
    if (s) cikti[kod] = s;
  }
  return { v: 1, maddeler: cikti };
}

export const ayniMi = (a: BilgiIlerleme, b: BilgiIlerleme): boolean => KODLAR.every((k) => (a.maddeler[k] ?? '') === (b.maddeler[k] ?? ''));

/** Girişli kullanıcının cihaz kopyasının anahtarı (ham uid yazılmaz; özet hesap/isaret.ts'ten gelir). */
export function kullaniciAnahtari(uidOzeti: string): string {
  if (typeof uidOzeti !== 'string' || !UID_OZETI.test(uidOzeti)) throw new TypeError('uid özeti [a-z0-9]{8,64} olmalı');
  return `${ANAHTAR}:u:${uidOzeti}`;
}

export function oku(depo: Depo | null | undefined, anahtar: string = ANAHTAR): BilgiIlerleme {
  try {
    const ham = depo?.getItem(anahtar);
    return ham ? temizle(JSON.parse(ham)) : bos();
  } catch {
    return bos();
  }
}

export function yaz(depo: Depo | null | undefined, il: BilgiIlerleme, anahtar: string = ANAHTAR): boolean {
  try {
    if (!depo) return false;
    depo.setItem(anahtar, JSON.stringify(temizle(il)));
    return true;
  } catch {
    return false;
  }
}

/** Buluta giden yük: YALNIZ kuralın izin verdiği alanlar (`v, maddeler, guncelleme`). */
export const bulutYuku = (il: BilgiIlerleme, guncelleme: unknown) => ({ v: 1, maddeler: { ...temizle(il).maddeler }, guncelleme });

/** Verilen kartların kaçı öğrenildi ve hepsi öğrenildi mi (boş liste tamam sayılmaz). */
export function yolSayimi(il: BilgiIlerleme, idler: readonly string[]): { ogrenilen: number; toplam: number; tamam: boolean } {
  const ogrenilen = idler.filter((id) => ogrenildi(il, id)).length;
  return { ogrenilen, toplam: idler.length, tamam: idler.length > 0 && ogrenilen === idler.length };
}

/**
 * Anonim (hesapsız) kayıttaki kartlardan hesaba gerçekten yeni bir işaret katacak olanların sayısı: bir kartın anonim bitlerinden en az biri
 * hesapta yoksa o kart sayılır. «Bu cihazdaki N işaret hesabınıza eklensin mi?» sorusunun N'si; 0 ise soru sorulmaz (Ezber'deki `eklenecekSayisi` gibi).
 */
export function eklenecekSayisi(anonim: unknown, hesap: unknown): number {
  const x = temizle(anonim);
  const y = temizle(hesap);
  let n = 0;
  for (const kod of KODLAR) {
    const p = x.maddeler[kod] ?? '';
    const q = y.maddeler[kod] ?? '';
    for (let i = 0; i < p.length; i++) if ((harf(p, i) & ~harf(q, i)) !== 0) n++;
  }
  return n;
}
