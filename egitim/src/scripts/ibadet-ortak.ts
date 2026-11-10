/**
 * «Abdest ve Namaz» sayfalarının ortak parçası (10 Kasım 2026): cihazdaki ilerlemeyi okur/yazar (girişliyken kullanıcının anahtarı,
 * değilse anonim) ve oturum varsa bulutla eşitler. Anonim sayfa Firebase indirmez (`bilgi-ortak.ts` ile aynı kural). Depo kapalıysa
 * boş durum döner ve yazım `false` bildirir.
 */
import type { Depo } from '@ortak/lib/ezber/cihaz';
import { ayniMi, isaretle, oku, yaz, type IbadetIlerleme, type Konu, type Slot } from '@ortak/lib/ilim-yolu/ibadet-ilerleme';
import { ibadetAnahtari, ibadetEsitle } from '../lib/hesap/ibadet-esitle';
import { oturumVar, tarayiciDeposu } from '../lib/hesap/isaret';
import { oturumDurumu } from './oturum-ortak';

const depoAl = (): Depo | null => tarayiciDeposu();

export const ibadetOku = (): IbadetIlerleme => {
  const d = depoAl();
  return oku(d, ibadetAnahtari(d));
};

/** Çalışmayı işaretler ve cihaza yazar; yazımın başarısını döner. */
export function ibadetIsaretle(konu: Konu, slot: Slot, bit: number): { il: IbadetIlerleme; yazildi: boolean } {
  const d = depoAl();
  const il = isaretle(ibadetOku(), konu, slot, bit);
  return { il, yazildi: yaz(d, il, ibadetAnahtari(d)) };
}

/** Oturum varsa ilerlemeyi bulutla birleştirir; cihazdaki kayıt değiştiyse `degisti` çağrılır (yeniden çizim için). */
export async function bulutlaEsitle(degisti?: () => void): Promise<void> {
  if (!oturumVar(depoAl())) return;
  const once = ibadetOku();
  const durum = await oturumDurumu();
  if (!durum) return;
  await ibadetEsitle(durum.f);
  if (degisti && !ayniMi(once, ibadetOku())) degisti();
}
