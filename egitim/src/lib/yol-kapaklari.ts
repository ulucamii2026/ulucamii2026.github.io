/**
 * Yol kapak görselleri (İlim Yolu, 10 Kasım 2026): yapay zekâ ile üretilmiş süs resimleri (egitim/docs/KAPAK-KUNYE.md), public/media/yollar/.
 * Her yol kimliği (`plan-…`, `alan-…`, `bilgi`) en çok bir kapağa bağlanır; uygun kapağı olmayan yol (şimdilik `bilgi`) yalnız motifli kalır.
 * Süstür: alt metin boş. Küçük (640×360) kartlarda, büyük (1600×900) yol sayfası başlığında kullanılır; `srcset` ikisini birlikte verir.
 */
const KAPAK_KODU: Readonly<Record<string, string>> = {
  'plan-kuran': 'kuran-okuma',
  'plan-itikat': 'itikat',
  'plan-ibadet': 'ibadet',
  'plan-siyer': 'siyer-medine',
  'plan-ahlak': 'ahlak',
  'alan-okuma': 'kuran-okuma',
  'alan-kuranBilgi': 'kuran-bilgi',
  'alan-itikat': 'itikat',
  'alan-namaz': 'namaz',
  'alan-ibadet': 'ibadet',
  'alan-siyer': 'siyer-mekke',
  'alan-ahlak': 'ahlak',
};

export interface Kapak { readonly kucuk: string; readonly buyuk: string; readonly srcset: string }

const kapakOlustur = (kod: string): Kapak => {
  const kucuk = `/media/yollar/${kod}-640x360.webp`;
  const buyuk = `/media/yollar/${kod}.webp`;
  return { kucuk, buyuk, srcset: `${kucuk} 640w, ${buyuk} 1600w` };
};

/** Yolun kapağı; yoksa `null` (motifli başlık kalır). */
export const yolKapagi = (yol: string): Kapak | null => (KAPAK_KODU[yol] ? kapakOlustur(KAPAK_KODU[yol]) : null);

/** Ezber Kilimi girişinin kapağı (ana sayfa kartı). */
export const ezberKapagi = (): Kapak => kapakOlustur('ezber');
