/**
 * Levha sığdırma araması (cami ekranı, A alt projesi). DOM kullanmaz: çağıran her ölçekte içeriği çizip sığıp
 * sığmadığını söyler (src/ekran/slaytlar.ts → levhaSigdir). Ölçek hiçbir zaman enAz'ın altına inmez; enAz'da da
 * sığmayan slayt çağıran tarafından atlanır (okunur taban kuralı).
 */
export type SigarMi = (olcek: number) => boolean;
export interface OlcekSonucu { olcek: number; sigdi: boolean; olcumSayisi: number }

/** [enAz, enCok] aralığında sığan en büyük ölçeği ikiye bölerek bulur. Alt uç hep doğrulanmış (sığmış) bir değerdir
 *  ve sonuç olarak o döner; kutu tekdüze olmasa bile (satır kırılımı) dönen ölçek sığar. Durma: aralık `adim`'dan
 *  dar ya da `enCokOlcum` ölçüme ulaşıldı. Çağıran, dönen ölçeği DOM'a YENİDEN yazmalıdır (son ölçüm sığmayan bir
 *  değerde kalmış olabilir). */
export function olcekBul(sigarMi: SigarMi, enAz: number, enCok: number, adim = 0.02, enCokOlcum = 8): OlcekSonucu {
  let olcum = 0;
  const dene = (s: number): boolean => { olcum++; return sigarMi(s); };
  if (!(enCok > enAz)) {
    const ok = dene(enAz);
    return { olcek: enAz, sigdi: ok, olcumSayisi: olcum };
  }
  if (dene(enCok)) return { olcek: enCok, sigdi: true, olcumSayisi: olcum };
  if (!dene(enAz)) return { olcek: enAz, sigdi: false, olcumSayisi: olcum };
  let lo = enAz;
  let hi = enCok;
  while (hi - lo >= adim && olcum < enCokOlcum) {
    const orta = (lo + hi) / 2;
    if (dene(orta)) lo = orta;
    else hi = orta;
  }
  return { olcek: lo, sigdi: true, olcumSayisi: olcum };
}
