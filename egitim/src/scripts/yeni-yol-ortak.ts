/**
 * 12 haftalık yol sayfalarının ortak parçası (11 Kasım 2026): cihazdaki ilerlemeyi okur/yazar (girişliyken kullanıcının anahtarı, değilse anonim)
 * ve oturum varsa bulutla eşitler. Anonim sayfa Firebase indirmez (`bilgi-ortak.ts` ile aynı kural). Depo kapalıysa boş durum döner ve yazım
 * `false` bildirir.
 */
import type { Depo } from '@ortak/lib/ezber/cihaz';
import { ayniMi, isaretle, oku, yaz, type Hafta, type Slot, type YolIlerleme } from '@ortak/lib/ilim-yolu/yeni-yol-ilerleme';
import { yolAnahtari, yolEsitle, yolSil, yolTeklif, type YolSilmeSonucu, type YolTeklifi } from '../lib/hesap/yeni-yol-esitle';
import { KABUK_ONEKI, KAYIT_ONBELLEGI, yeniYolKaydiMi } from '../lib/cevrimdisi-ortak';
import { oturumVar, tarayiciDeposu } from '../lib/hesap/isaret';
import { oturumDurumu } from './oturum-ortak';

const depoAl = (): Depo | null => tarayiciDeposu();

export const yolOku = (): YolIlerleme => {
  const d = depoAl();
  return oku(d, yolAnahtari(d));
};

/** Çalışmayı işaretler ve cihaza yazar; yazımın başarısını döner. */
export function yolIsaretle(hafta: Hafta, slot: Slot, bit: number): { il: YolIlerleme; yazildi: boolean } {
  const d = depoAl();
  const il = isaretle(yolOku(), hafta, slot, bit);
  return { il, yazildi: yaz(d, il, yolAnahtari(d)) };
}

/** Oturum varsa ilerlemeyi bulutla birleştirir; cihazdaki kayıt değiştiyse `degisti` çağrılır (yeniden çizim için). */
export async function bulutlaEsitle(degisti?: () => void): Promise<void> {
  if (!oturumVar(depoAl())) return;
  const once = yolOku();
  const durum = await oturumDurumu();
  if (!durum) return;
  await yolEsitle(durum.f);
  if (degisti && !ayniMi(once, yolOku())) degisti();
}

/** Girişli kullanıcıya «cihazdaki işaretleri hesaba ekleyelim mi?» teklifi (yoksa ya da giriş yoksa `null`). Anonim sayfa Firebase indirmez. */
export async function yolTeklifi(): Promise<YolTeklifi | null> {
  if (!oturumVar(depoAl())) return null;
  const durum = await oturumDurumu();
  return durum ? yolTeklif(durum.f) : null;
}

/** Cache API'deki bu yola ait sayfa kopyaları ve eski «kaydet» künyesi (SW artık yazmaz; eski sürümlerin bıraktıkları kalkar). Cache API yoksa sessizce geçer. */
export async function onbellekTemizle(): Promise<void> {
  try {
    for (const ad of await caches.keys()) {
      if (!ad.startsWith(KABUK_ONEKI) && ad !== KAYIT_ONBELLEGI) continue;
      const c = await caches.open(ad);
      for (const istek of await c.keys()) if (yeniYolKaydiMi(istek.url)) await c.delete(istek);
    }
  } catch { /* Cache API kapalı ya da yok */ }
}

/** «Bu cihazdaki izleri silin»: cihaz işaretleri ve sayfa önbelleği hemen, girişliyse hesap da (olmazsa `bekliyor`; sonraki eşitleme önce siler). Oturum yoksa Firebase yüklenmez. */
export async function yolSilme(): Promise<YolSilmeSonucu> {
  await onbellekTemizle();
  const durum = oturumVar(depoAl()) ? await oturumDurumu() : null;
  return yolSil(durum?.f ?? null);
}
