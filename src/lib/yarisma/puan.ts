/**
 * Bilgi Yarışması ortak puanı (10 Kasım 2026). Sınıfın TEK bir puanı vardır; kişi, takım, sıralama, süre ve saklama yoktur
 * (imamın kararı; İlim Yolu'ndaki «puan yok» ilkesinden yalnız bu sınıf ekranı için ayrılır). Metinde «ortak puan» denir.
 *  - sınav / sıralama / gruplama / eşleştirme: ilk kontrolde tam doğru 3, düzeltmeyle doğru 1, cevap gösterilmek zorunda kaldıysa 0;
 *  - gizemli kutu: ilk ipucunda 3, ikincide 2, üçüncü ya da sonrasında 1, bütün seçenekler tükendiyse 0.
 * Hiçbir yerde «N / M» ya da yüzde gösterilmez; son ekrandaki sıcak cümle üç banttan seçilir ve hep olumludur.
 */

/** Bir turda en çok kaç kez «Kontrol» edilebilir; ikincisi de yanlışsa cevap gösterilir. */
export const EN_COK_KONTROL = 2;
export const TUR_EN_COK = 3;

export type TurPuani = 0 | 1 | 2 | 3;

/** `kontrol`: şimdiye dek yapılan kontrol sayısı (≥ 1 ise anlamlı); `cozuldu`: tur doğru çözüldü mü (cevap gösterilmediyse). */
export function turPuani(kontrol: number, cozuldu: boolean): TurPuani {
  if (!cozuldu || kontrol < 1) return 0;
  return kontrol === 1 ? 3 : 1;
}

/** Gizemli kutu: çözüldüğü anda açık olan ipucu sayısına göre. */
export function gizemliPuani(acikIpucu: number, cozuldu: boolean): TurPuani {
  if (!cozuldu || acikIpucu < 1) return 0;
  return acikIpucu === 1 ? 3 : acikIpucu === 2 ? 2 : 1;
}

export const toplamPuan = (turlar: readonly number[]): number => turlar.reduce((a, b) => a + b, 0);

export type Bant = 'ilk' | 'orta' | 'yuksek';

/** Son ekranın sıcak cümlesi için üç bant (oran yalnız burada kullanılır, asla gösterilmez). */
export function bant(toplam: number, turSayisi: number): Bant {
  const en = TUR_EN_COK * Math.max(1, turSayisi);
  const oran = toplam / en;
  return oran < 1 / 3 ? 'ilk' : oran < 2 / 3 ? 'orta' : 'yuksek';
}

/** Tur karosunun dokusu 0–3: tura göre ortak puan. */
export const dokuma = (puan: number): TurPuani => (puan >= 3 ? 3 : puan <= 0 ? 0 : (Math.round(puan) as TurPuani));

export type GeriEvre = 'soru' | 'geri' | 'son';

/**
 * «Bir tur geri»: oyunun en son turunu geri alır ve o turu baştan açar; ortak puan o turun puanı çıkarılmış hâlde kalır.
 *  - tur çözülmüşse (`geri`): bu turun puanı silinir, aynı tur yeniden açılır;
 *  - tur henüz çözülmediyse (`soru`): önceki tur silinir ve o tur yeniden açılır (ilk turda geri yoktur → `null`);
 *  - son ekranda (`son`): son tur silinir ve yeniden açılır.
 * Değişmez: `soru` evresinde `puanlar.length === i`, `geri` evresinde `i + 1`; sonuçta `puanlar.length === i`.
 */
export function turGeri(puanlar: readonly number[], i: number, evre: GeriEvre, turSayisi: number): { puanlar: number[]; i: number } | null {
  const hedef = evre === 'son' ? turSayisi - 1 : evre === 'geri' ? i : i - 1;
  if (hedef < 0 || hedef >= turSayisi) return null;
  return { puanlar: puanlar.slice(0, hedef), i: hedef };
}
