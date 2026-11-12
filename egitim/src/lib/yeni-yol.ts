/**
 * «Yeni Müslüman yolu» verisine tipli erişim (11 Kasım 2026). İçerik paylasilan/ogrenme-yolu/icerik.json'dan derleme anında okunur (tek kaynak:
 * ihtida.ulucamii.be ona kopyasıyla bakar; burada hiçbir metin kopyalanmaz, dinî metin düzenlenmez). Yalnız okuma yardımcıları, platformdaki
 * eşleşen çalışma bağlantıları ve sayfa kimlikleri vardır. Doğrulama: tests/ilim-yolu-yeni-yol.test.mjs.
 */
import ham from '../../../paylasilan/ogrenme-yolu/icerik.json';
import enVideolar from '../../../src/data/diyanet-videolar-en.json';
import type { Adim, Hafta, Yol } from '../../../paylasilan/ogrenme-yolu/tipler';

export const YOL = ham as unknown as Yol;
export const HAFTALAR: readonly Hafta[] = YOL.haftalar;
export const ADIMLAR: readonly Adim[] = YOL.adimlar;

/** Sayfa kimlikleri dilden bağımsızdır: hafta `h01`…`h12`, adım `adim-1`…`adim-8`. */
export const adimKimligi = (no: number): string => `adim-${no}`;
export const SAYFA_KIMLIKLERI: readonly string[] = [...HAFTALAR.map((h) => h.id), ...ADIMLAR.map((a) => adimKimligi(a.no))];

export const haftaBul = (id: string): Hafta | undefined => HAFTALAR.find((h) => h.id === id);
export const adimBul = (id: string): Adim | undefined => ADIMLAR.find((a) => adimKimligi(a.no) === id);
export const adimHaftalari = (no: number): Hafta[] => HAFTALAR.filter((h) => h.adim === no);
export const adimaGore = (h: Hafta): Adim => ADIMLAR.find((a) => a.no === h.adim)!;

/**
 * Haftanın sayfa dilindeki videosu. Diyanet'in resmî videosu yalnız TR ve EN'dedir; fr, nl ve de sayfaları İngilizce videoyu gösterir
 * (imamın kararı, 12 Kasım 2026) ve sayfada «video İngilizce» notu yazar (`videoIngilizceMi`). Videosu olmayan hafta (h12) hiçbir dilde video göstermez.
 */
export function videoKimligi(h: Hafta, dil: string): string | undefined {
  const id = h.video?.[dil === 'tr' ? 'tr' : 'en'];
  return id && /^[\w-]{11}$/.test(id) ? id : undefined;
}
/** Sayfa dili TR ya da EN değilse video İngilizce yedeğidir: sayfa notu ve lang="en" etiketi bunu izler. */
export const videoIngilizceMi = (dil: string): boolean => dil !== 'tr' && dil !== 'en';
/** Diyanet'in İngilizce videosunun kendi başlığı (src/data/diyanet-videolar-en.json); İngilizce yedekte lang="en" etiketiyle gösterilir. */
export const videoIngilizceBasligi = (id: string): string | undefined => (enVideolar.bolumler as readonly { id: string; baslik: string }[]).find((b) => b.id === id)?.baslik;
/** Dış bağlantılar yalnız https olur. */
export const guvenliBaglanti = (url: string): boolean => /^https:\/\//.test(url);

/**
 * Konusu açıkça örtüşen platform çalışmaları (yalnız bağlantı; metin kopyalanmaz). `ad` anahtarı sayfada hangi var olan metnin etiket olacağını
 * söyler: `plan:<kod>` yollar sayfasının planAd'ı, `ibadet-abdest` / `ibadet-namaz` Abdest ve Namaz konuları, `okuma` Kur'an Okuma.
 * Eşleşmesi belirsiz haftalar (h09 aile iletişimi, h12 tekrar) bağlantısız kalır.
 */
export type PlatformBaglantisi =
  | { readonly tur: 'plan'; readonly kod: 'kuran' | 'itikat' | 'ibadet' | 'siyer' | 'ahlak' }
  | { readonly tur: 'ibadet-abdest' }
  | { readonly tur: 'ibadet-namaz' }
  | { readonly tur: 'okuma' };

export const PLATFORM_BAGLANTILARI: Readonly<Record<string, PlatformBaglantisi>> = {
  h01: { tur: 'plan', kod: 'itikat' },
  h02: { tur: 'plan', kod: 'itikat' },
  h03: { tur: 'plan', kod: 'siyer' },
  h04: { tur: 'okuma' },
  h05: { tur: 'ibadet-abdest' },
  h06: { tur: 'ibadet-namaz' },
  h07: { tur: 'okuma' },
  h08: { tur: 'plan', kod: 'ahlak' },
  h10: { tur: 'plan', kod: 'ibadet' },
  h11: { tur: 'plan', kod: 'ibadet' },
};

/** Bağlantının dil öneksiz adresi. */
export function platformAdresi(b: PlatformBaglantisi): string {
  switch (b.tur) {
    case 'plan': return `yollar/plan-${b.kod}/`;
    case 'ibadet-abdest': return 'ibadet/abdest/';
    case 'ibadet-namaz': return 'ibadet/namaz/';
    case 'okuma': return 'okuma/';
  }
}
