/**
 * İlim Yolu bilgi sayfalarının ortak parçası (Dilim 2, 10 Kasım 2026): cihazdaki kart ilerlemesini okur/yazar (`etkinAnahtar` kuralı: girişliyken
 * kullanıcının anahtarı, değilse anonim) ve oturum varsa bulutla eşitler. Anonim sayfa Firebase indirmez: `bulutlaEsitle` oturum işareti yoksa
 * hiçbir şey yapmaz. Depo kapalıysa sessizce boş durum döner ve yazım `false` bildirir.
 */
import { oku as ezberOku, type CihazDurumu, type Depo } from '@ortak/lib/ezber/cihaz';
import { ayniMi, isaretle, oku, yaz, type BilgiIlerleme } from '@ortak/lib/ilim-yolu/bilgi-ilerleme';
import { bilgiAnahtari, bilgiEsitle } from '../lib/hesap/bilgi-esitle';
import { etkinAnahtar, oturumVar, tarayiciDeposu } from '../lib/hesap/isaret';
import { oturumDurumu } from './oturum-ortak';

export const depoAl = (): Depo | null => tarayiciDeposu();

/** Bu cihazdaki (etkin anahtardaki) kart ilerlemesi. */
export const bilgiOku = (): BilgiIlerleme => {
  const d = depoAl();
  return oku(d, bilgiAnahtari(d));
};

/** Kartı işaretler ve cihaza yazar; yeni durumu ve yazımın başarısını döner. */
export function bilgiIsaretle(id: string, bit: number): { il: BilgiIlerleme; yazildi: boolean } {
  const d = depoAl();
  const il = isaretle(bilgiOku(), id, bit);
  return { il, yazildi: yaz(d, il, bilgiAnahtari(d)) };
}

/** Ezber Kilimi'ndeki cihaz kaydı (bilgi maddelerinin «çalışıldı» durumu buradan okunur). */
export const ezberOkuEtkin = (): CihazDurumu => {
  const d = depoAl();
  return ezberOku(d, etkinAnahtar(d));
};

/** Oturum varsa kart ilerlemesini bulutla birleştirir; cihazdaki kayıt değiştiyse `degisti` çağrılır (yeniden çizim için). */
export async function bulutlaEsitle(degisti?: () => void): Promise<void> {
  if (!oturumVar(depoAl())) return;
  const once = bilgiOku();
  const durum = await oturumDurumu();
  if (!durum) return;
  await bilgiEsitle(durum.f);
  if (degisti && !ayniMi(once, bilgiOku())) degisti();
}
