/**
 * Bilgi Yarışması'nda sınıfın ekrandaki yerleştirmelerinin saf mantığı (10 Kasım 2026): kontrolden sonra yerinde kalan parçalar «sabit» olur;
 * yalnız yanlışlar oynar. Ekran (egitim scripts/yarisma-oyna.ts) yalnız çizer.
 */
import { siraDegerlendir } from '../ibadet/ibadet-alistirma';

export { siraDegerlendir };

/**
 * Sıralamada i. konumdaki parçayı `yon` (−1 yukarı, +1 aşağı) yönünde, o yönde sabit OLMAYAN ilk konumla yer değiştirerek taşır.
 * Sabit parçalara dokunulmaz; taşıyan konum sabitse ya da yön boşsa dizi aynen (kopya) döner.
 */
export function tasiSabitli(sira: readonly number[], sabit: readonly boolean[], i: number, yon: -1 | 1): number[] {
  const kopya = [...sira];
  if (!Number.isInteger(i) || i < 0 || i >= kopya.length || sabit[i]) return kopya;
  let j = i + yon;
  while (j >= 0 && j < kopya.length && sabit[j]) j += yon;
  if (j < 0 || j >= kopya.length) return kopya;
  [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  return kopya;
}

export interface GruplamaSonucu { readonly dogru: readonly boolean[]; readonly yanlis: readonly number[]; readonly eksik: number; readonly tamam: boolean }

/** `yer[i]` = i. kartın konduğu kutu (0/1; −1 = havuzda), `dogruGrup[i]` = doğru kutu. Havuzdaki kart ne doğru ne yanlıştır. */
export function gruplamaDegerlendir(yer: readonly number[], dogruGrup: readonly number[]): GruplamaSonucu {
  if (yer.length !== dogruGrup.length) throw new RangeError('yer ve doğru dizisi aynı uzunlukta olmalı');
  const dogru = yer.map((y, i) => y >= 0 && y === dogruGrup[i]);
  const yanlis = yer.flatMap((y, i) => (y >= 0 && y !== dogruGrup[i] ? [i] : []));
  const eksik = yer.filter((y) => y < 0).length;
  return { dogru, yanlis, eksik, tamam: yer.length > 0 && dogru.every(Boolean) };
}

/**
 * Eşleştirmede `cevap[i]` = i. sol parçaya seçilen sağ parçanın ASIL sırası (doğru eşleşme kimlik), `null` = seçilmedi.
 * Kontrolde yanlış çiftlerin cevabı boşaltılır, doğrular kalır; boşaltılan indisler döner.
 */
export function yanlisCiftleriBosalt(cevap: readonly (number | null)[]): { cevap: (number | null)[]; birakilan: number[] } {
  const birakilan: number[] = [];
  const yeni = cevap.map((c, i) => {
    if (c !== null && c !== i) { birakilan.push(i); return null; }
    return c;
  });
  return { cevap: yeni, birakilan };
}
