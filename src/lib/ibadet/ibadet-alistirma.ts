/**
 * «Abdest ve Namaz» alıştırmalarının saf mantığı (10 Kasım 2026): sıralama, eşleştirme ve seçim (hüküm / rek‘at sayısı) soruları.
 * Ekran (egitim scripts/ibadet.ts) yalnız çizer; doğru yanıtın ne olduğu burada belirlenir ve testle sabitlenir. Karıştırma tohumludur
 * (src/lib/ezber/oyun.ts). Puan ve sıralama yoktur: sonuç «tamam» ve «hatasız tamam» bitleridir (ibadet-ilerleme.ts).
 */
import { farkliSira, karistir, rastgele, tohum } from '../ezber/oyun';

export { rastgele, tohum, karistir };

/** Karışık başlangıç sırası: `sira[i]` = i. konumdaki parçanın asıl sırası; n > 1 ise asıl sıradan farklıdır. */
export const karisikSira = (n: number, r: () => number): number[] => farkliSira(n, r);

/** i. konumdaki parçayı `yon` (−1 yukarı, +1 aşağı) yönünde bir basamak taşır; sınır dışıysa aynı diziyi (kopya) döner. */
export function tasi(sira: readonly number[], i: number, yon: -1 | 1): number[] {
  const kopya = [...sira];
  const j = i + yon;
  if (!Number.isInteger(i) || i < 0 || i >= kopya.length || j < 0 || j >= kopya.length) return kopya;
  [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  return kopya;
}

export interface SiraSonucu { readonly dogru: readonly boolean[]; readonly yerinde: number; readonly toplam: number; readonly tamam: boolean }

export function siraDegerlendir(sira: readonly number[]): SiraSonucu {
  const dogru = sira.map((x, i) => x === i);
  const yerinde = dogru.filter(Boolean).length;
  return { dogru, yerinde, toplam: sira.length, tamam: sira.length > 0 && yerinde === sira.length };
}

/** `toplam` parçadan `adet` tanesini seçer (artan sırayla, tekrarsız); adet toplamdan büyükse hepsi. */
export function turSec(toplam: number, adet: number, r: () => number): number[] {
  const hepsi = Array.from({ length: Math.max(0, toplam) }, (_, i) => i);
  if (adet >= toplam) return hepsi;
  return karistir(hepsi, r).slice(0, Math.max(0, adet)).sort((a, b) => a - b);
}

export interface EslesmeSonucu { readonly dogru: readonly boolean[]; readonly eksik: number; readonly tamam: boolean }

/**
 * Eşleştirme: `cevap[i]` = i. sol parçaya seçilen sağ parça (`null` = seçilmedi). Doğru eşleşme kimliktir (i ↔ i).
 */
export function eslestirDegerlendir(cevap: readonly (number | null)[]): EslesmeSonucu {
  const dogru = cevap.map((c, i) => c === i);
  const eksik = cevap.filter((c) => c === null).length;
  return { dogru, eksik, tamam: cevap.length > 0 && dogru.every(Boolean) };
}

export interface SecimSonucu { readonly dogru: readonly boolean[]; readonly eksik: number; readonly tamam: boolean }

/** Seçim soruları: `secim[i]` = seçilen seçenek (−1 = işaretlenmedi), `dogrular[i]` = doğru seçenek. */
export function secimDegerlendir(secim: readonly number[], dogrular: readonly number[]): SecimSonucu {
  if (secim.length !== dogrular.length) throw new RangeError('seçim ve doğru dizisi aynı uzunlukta olmalı');
  const dogru = secim.map((s, i) => s === dogrular[i]);
  const eksik = secim.filter((s) => s < 0).length;
  return { dogru, eksik, tamam: secim.length > 0 && dogru.every(Boolean) };
}

/** İlerleme bitleri: 0 tamam değil · 1 tamam · 3 hatasız (ilk kontrolde) tamam. */
export const sonucBiti = (tamam: boolean, hataSayisi: number): number => (!tamam ? 0 : hataSayisi === 0 ? 3 : 1);
