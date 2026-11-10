/**
 * Kur'an Okuma sayfalarının ortak parçası (10 Kasım 2026): cihazdaki ilerlemeyi okur/yazar (`etkinAnahtar` kuralı: girişliyken kullanıcının anahtarı,
 * değilse anonim) ve oturum varsa bulutla eşitler. Anonim sayfa Firebase indirmez: `bulutlaEsitle` oturum işareti yoksa hiçbir şey yapmaz.
 * Depo kapalıysa sessizce boş durum döner ve yazım `false` bildirir. (scripts/bilgi-ortak.ts ile aynı düzen.)
 */
import type { Depo } from '@ortak/lib/ezber/cihaz';
import type { TekrarSonucu } from '@ortak/lib/ezber/tekrar';
import { ANAHTAR, ayniMi, isaretle, kullaniciAnahtari, oku, yaz, type OkumaIlerleme } from '@ortak/lib/okuma/ilerleme';
import { okumaEsitle } from '../lib/hesap/okuma-esitle';
import { oturumOzeti, oturumVar, tarayiciDeposu } from '../lib/hesap/isaret';
import { oturumDurumu } from './oturum-ortak';

const depoAl = (): Depo | null => tarayiciDeposu();
const anahtar = (d: Depo | null): string => {
  const ozet = oturumOzeti(d);
  return ozet ? kullaniciAnahtari(ozet) : ANAHTAR;
};

export const okumaOku = (): OkumaIlerleme => {
  const d = depoAl();
  return oku(d, anahtar(d));
};

/** Maddeyi işaretler ve cihaza yazar; yeni durumu ve yazımın başarısını döner. */
export function okumaIsaretle(id: string, sonuc: TekrarSonucu, bugun: string): { il: OkumaIlerleme; yazildi: boolean } {
  const d = depoAl();
  const il = isaretle(okumaOku(), id, sonuc, bugun);
  return { il, yazildi: yaz(d, il, anahtar(d)) };
}

/** Oturum varsa ilerlemeyi bulutla birleştirir; cihazdaki kayıt değiştiyse `degisti` çağrılır (yeniden çizim için). */
export async function bulutlaEsitle(degisti?: () => void): Promise<void> {
  if (!oturumVar(depoAl())) return;
  const once = okumaOku();
  const durum = await oturumDurumu();
  if (!durum) return;
  await okumaEsitle(durum.f);
  if (degisti && !ayniMi(once, okumaOku())) degisti();
}
